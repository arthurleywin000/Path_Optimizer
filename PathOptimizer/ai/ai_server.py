"""
AI Server — paste this as ai_server.py and run: python ai_server.py
Requires: pip install fastapi uvicorn langchain-groq langchain-core requests pydantic

Set your Groq key:  export GROQ_API_KEY=your_key_here
Get a free key at:  https://console.groq.com
"""

import os
import requests
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.tools import tool

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JAVA = "http://localhost:8080"

# Tracks ALL actions taken during one chat turn (not just the last one)
_actions = []


@tool
def find_path(start_node: str, end_node: str) -> str:
    """
    Find the shortest path between two nodes using the A* engine.
    Use when user says: 'find path A to D', 'route from B to E', 'shortest path A D', etc.
    """
    try:
        r = requests.post(
            f"{JAVA}/api/path",
            json={"start": start_node.strip().upper(), "goal": end_node.strip().upper()},
            timeout=5,
        )
        if r.status_code == 200:
            data = r.json()
            path = data.get("path", [])
            cost = data.get("cost", 0)
            if path:
                _actions.append({"type": "PATH_FOUND", "payload": data})
                return f"Path: {' -> '.join(path)}  |  Total cost: {cost}"
            return "No path exists between those nodes."
        return f"Java engine error: HTTP {r.status_code}"
    except Exception as e:
        return f"Java backend unreachable: {e}"


@tool
def add_node(name: str, x: int = 0, y: int = 0) -> str:
    """
    Add a new node to the graph. x and y are grid coordinates (optional, default 0).
    Use when user says: 'add node E', 'create node F at 3 4', 'new node G', etc.
    """
    node_id = name.strip().upper()[:5]
    payload = {"id": node_id, "x": x, "y": y}
    try:
        r = requests.post(f"{JAVA}/api/nodes", json=payload, timeout=5)
        ok = r.status_code in [200, 201]
    except Exception:
        ok = False

    _actions.append({"type": "ADD_NODE", "payload": payload})
    return f"Node {node_id} added at ({x},{y})." + ("" if ok else " (Java offline - UI only)")


@tool
def add_edge(source: str, target: str, weight: int) -> str:
    """
    Add a weighted edge between two existing nodes.
    Use when user says: 'add edge A to B cost 5', 'connect C D weight 3', 'link E F 7', etc.
    """
    src = source.strip().upper()
    tgt = target.strip().upper()
    payload = {"from": src, "to": tgt, "cost": int(weight)}
    try:
        r = requests.post(f"{JAVA}/api/edges", json=payload, timeout=5)
        ok = r.status_code in [200, 201]
    except Exception:
        ok = False

    _actions.append({"type": "ADD_EDGE", "payload": {"source": src, "target": tgt, "weight": weight}})
    return f"Edge {src}->{tgt} (cost {weight}) added." + ("" if ok else " (Java offline - UI only)")


@tool
def edit_edge_weight(source: str, target: str, new_weight: int) -> str:
    """
    Change the weight of an existing edge between two nodes.
    Use when user says: 'change A to B weight to 7', 'update edge C D to 10', 'set A-B cost 4', etc.
    """
    src = source.strip().upper()
    tgt = target.strip().upper()
    try:
        edges = requests.get(f"{JAVA}/api/path/graph", timeout=5).json()
        match = next((e for e in edges if e["from"] == src and e["to"] == tgt), None)
        if match:
            r = requests.put(
                f"{JAVA}/api/edges/{match['id']}",
                json={"cost": int(new_weight)},
                timeout=5,
            )
            ok = r.status_code == 200
        else:
            return f"No edge found from {src} to {tgt}."
    except Exception:
        ok = False

    _actions.append({"type": "EDIT_EDGE", "payload": {"source": src, "target": tgt, "weight": new_weight}})
    return f"Edge {src}->{tgt} weight updated to {new_weight}." + ("" if ok else " (Java offline - UI only)")


GROQ_KEY = os.getenv("GROQ_API_KEY")

SYSTEM = """You are Nexus, an AI assistant for a graph path-optimizer.
You have exactly 4 tools:
  find_path        - find shortest path between two nodes
  add_node         - add a new node (NO connections, just the node itself)
  add_edge         - add a weighted edge between two existing nodes
  edit_edge_weight - change the weight of an existing edge

CRITICAL RULES:
- If the user says 'add node F from A with cost 6', you must call TWO tools:
    1. add_node(name='F') to create the node
    2. add_edge(source='A', target='F', weight=6) to connect them
- If the user says 'add edge A to B cost 5', call add_edge only.
- If the user says 'add node E', call add_node only.
- If the user says 'find path A to D', call find_path.
- ALWAYS call tools — never just describe what you would do.
- Node names are uppercase letters (A, B, C...).
- After tools return, give a short confirmation to the user."""

tools_list = [find_path, add_node, add_edge, edit_edge_weight]
tool_map   = {t.name: t for t in tools_list}

llm            = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=GROQ_KEY)
llm_with_tools = llm.bind_tools(tools_list)


class ChatRequest(BaseModel):
    message: str


# ── Priority order for picking the "winning" action to send back to React ──
ACTION_PRIORITY = ["PATH_FOUND", "ADD_EDGE", "EDIT_EDGE", "ADD_NODE", "NONE"]

def pick_primary_action(actions: list) -> dict:
    """
    When multiple tools ran in one turn, pick the most important action
    to report back to the React frontend (PATH_FOUND > ADD_EDGE > ...).
    React uses this to decide whether to call fetchGraph() or animatePath().
    """
    if not actions:
        return {"type": "NONE", "payload": {}}
    for preferred in ACTION_PRIORITY:
        for a in actions:
            if a["type"] == preferred:
                return a
    return actions[-1]


@app.post("/api/chat")
async def chat(req: ChatRequest):
    global _actions
    _actions = []          # reset for this turn

    try:
        messages = [
            {"role": "system", "content": SYSTEM},
            HumanMessage(content=req.message),
        ]

        # ── Agentic loop: keep calling tools until the model stops ──
        MAX_ROUNDS = 6     # safety cap — prevents infinite loops
        for _ in range(MAX_ROUNDS):
            ai_msg = llm_with_tools.invoke(messages)
            messages.append(ai_msg)

            if not ai_msg.tool_calls:
                # Model is done — no more tools to call
                break

            # Execute EVERY tool call the model requested this round
            for tc in ai_msg.tool_calls:
                tool_fn = tool_map.get(tc["name"])
                if tool_fn is None:
                    result = f"Unknown tool: {tc['name']}"
                else:
                    result = tool_fn.invoke(tc["args"])

                messages.append(
                    ToolMessage(content=str(result), tool_call_id=tc["id"])
                )

        # Final reply is the last non-tool message from the model
        reply = ai_msg.content or "Done."

        primary = pick_primary_action(_actions)
        return {
            "reply":  reply,
            "action": primary["type"],
            "data":   primary["payload"],
        }

    except Exception as e:
        return {"reply": f"Error: {e}", "action": "NONE", "data": {}}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)