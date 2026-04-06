import os
import requests
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langchain.agents import create_agent as create_react_agent

# 1. Define the Tool that talks to Java
@tool
def find_path_tool(start_node: str, end_node: str) -> str:
    """Finds the shortest path between two nodes. 
    Use this tool whenever the user asks to calculate a route or path."""
    
    print(f"\n[Tool Execution] Asking Java backend for path from {start_node} to {end_node}...")
    
    # URL of your Spring Boot PathController
    url = "http://localhost:8080/api/path"
    
    # Payload matching your PathRequest.java DTO
    payload = {
        "start": start_node,
        "goal": end_node
    }
    
    try:
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            path_list = data.get("path", []) 
            
            if not path_list:
                return f"No valid path found between {start_node} and {end_node}."
                
            formatted_path = " -> ".join(path_list)
            return f"The calculated path is: {formatted_path}"
        else:
            return f"The backend returned an error: {response.text}"
            
    except requests.exceptions.ConnectionError:
        return "System Error: Could not connect to the Java backend. Ensure Spring Boot is running on port 8080."

tools = [find_path_tool]

# 2. Initialize the official Groq Chat Model
llm = ChatGroq( 
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key="Your Grok_key"  # 👈 Make sure to put a NEW key here!
)

# 3. Create the modern LangGraph Agent
agent_executor = create_react_agent(llm, tools)

def run_agent(user_input: str):
    """Executes the agent with the given input string."""
    response = agent_executor.invoke({"messages": [("user", user_input)]})
    return response["messages"][-1].content

if __name__ == "__main__":
    print("Initializing Path Optimizer Agent...\n")
    result = run_agent("Can you find the shortest path from A to E?")
    print("\nFinal Result:")
    print(result)