AI Path Optimizer

AI Path Optimizer is a full-stack application that computes optimal paths using the A* (A-Star) algorithm, enhanced with an AI-powered agent capable of understanding natural language commands.

Overview

This project combines graph algorithms with an AI agent to create an interactive system where users can visually build graphs and perform operations using simple language.

Users can:

Create and manage nodes and edges visually
Assign weights (costs) to edges
Compute the shortest path between nodes using A*
Interact with the system using natural language commands

Example commands:
“Find the shortest path from A to D”
“Add node E and connect it to B with cost 5”


Tech Stack

Frontend
React (Vite)
HTML, CSS, JavaScript
Interactive graph visualization
Backend
Spring Boot (Java)
REST APIs
A* pathfinding algorithm
AI Agent
FastAPI (Python)
LangChain with Groq LLM
Tool-based agent architecture
Database
PostgreSQL

Key Features: 
Efficient shortest path computation using the A* algorithm
Natural language interaction through an AI agent
Dynamic creation and modification of graph structures
Real-time updates to edge weights
API-driven communication between services 

API Overview
Path Operations
POST /api/path → Compute shortest path
GET /api/path?start=A&goal=D → Test path
Graph Management
GET /api/path/graph → Retrieve full graph
POST /api/nodes → Add node
DELETE /api/nodes/{id} → Delete node
Edge Management
POST /api/edges → Add edge
PUT /api/edges/{id} → Update edge

AI Agent Capabilities:
The AI agent interprets user input and maps it to backend operations using a tool-based execution system.

It can:
Compute shortest paths
Add or remove nodes
Create and update edges
Modify edge weights

Future Improvements:
Cloud deployment (AWS or GCP)
User authentication and session management
Real-time updates using WebSockets
Improved heuristics for path optimization
Mobile-friendly user interface

Author-
Revanth Naidu Palukuri

Feedback:
If you found this project useful or interesting, consider starring the repository and sharing your feedback.
