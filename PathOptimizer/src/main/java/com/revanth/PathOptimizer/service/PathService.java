package com.revanth.PathOptimizer.service;

import com.revanth.PathOptimizer.dto.PathResponse;
import com.revanth.PathOptimizer.model.Edge;
import com.revanth.PathOptimizer.repo.PathEdgeRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PathService {

    @Autowired
    private PathEdgeRepo edgeRepo;

    private static class NodeCoords {
        int x, y;
        NodeCoords(int x, int y) { this.x = x; this.y = y; }
    }

    private static class QueueNode implements Comparable<QueueNode> {
        String id;
        int fScore;
        QueueNode(String id, int fScore) { this.id = id; this.fScore = fScore; }

        @Override
        public int compareTo(QueueNode other) { return Integer.compare(this.fScore, other.fScore); }
    }

    public PathResponse findPath(String start, String goal) {
        List<Edge> allEdges = edgeRepo.findAll();

        Map<String, NodeCoords> coordsMap = new HashMap<>();
        Map<String, List<Edge>> adjList = new HashMap<>();

        for (Edge e : allEdges) {
            coordsMap.putIfAbsent(e.getFrom(), new NodeCoords(e.getFromX(), e.getFromY()));
            coordsMap.putIfAbsent(e.getTo(), new NodeCoords(e.getToX(), e.getToY()));

            adjList.putIfAbsent(e.getFrom(), new ArrayList<>());
            adjList.get(e.getFrom()).add(e);

            adjList.putIfAbsent(e.getTo(), new ArrayList<>());
            Edge reverseEdge = new Edge(e.getId(), e.getTo(), e.getFrom(), e.getCost(), e.getToX(), e.getToY(), e.getFromX(), e.getFromY());
            adjList.get(e.getTo()).add(reverseEdge);
        }

        if (!coordsMap.containsKey(start) || !coordsMap.containsKey(goal)) {
            // 🔥 UPDATE: Added '0' as the default cost for empty paths
            return new PathResponse(Collections.emptyList(), 0);
        }

        PriorityQueue<QueueNode> openSet = new PriorityQueue<>();
        Map<String, String> cameFrom = new HashMap<>();
        Map<String, Integer> gScore = new HashMap<>();

        for (String node : coordsMap.keySet()) {
            gScore.put(node, Integer.MAX_VALUE);
        }
        gScore.put(start, 0);

        openSet.add(new QueueNode(start, heuristic(coordsMap.get(start), coordsMap.get(goal))));

        while (!openSet.isEmpty()) {
            String current = openSet.poll().id;

            if (current.equals(goal)) {
                // 🔥 UPDATE: Grab the final calculated cost and send it to the Response!
                int finalCost = gScore.get(goal);
                return new PathResponse(reconstructPath(cameFrom, current), finalCost);
            }

            for (Edge edge : adjList.getOrDefault(current, new ArrayList<>())) {
                String neighbor = edge.getTo();
                int tentativeGScore = gScore.get(current) + edge.getCost();

                if (tentativeGScore < gScore.get(neighbor)) {
                    cameFrom.put(neighbor, current);
                    gScore.put(neighbor, tentativeGScore);

                    int fScore = tentativeGScore + heuristic(coordsMap.get(neighbor), coordsMap.get(goal));
                    openSet.add(new QueueNode(neighbor, fScore));
                }
            }
        }

        // 🔥 UPDATE: Added '0' as the default cost if no path is found
        return new PathResponse(Collections.emptyList(), 0);
    }

    private int heuristic(NodeCoords a, NodeCoords b) {
        if (a == null || b == null) return 0;
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    private List<String> reconstructPath(Map<String, String> cameFrom, String current) {
        List<String> path = new ArrayList<>();
        path.add(current);
        while (cameFrom.containsKey(current)) {
            current = cameFrom.get(current);
            path.add(0, current);
        }
        return path;
    }
}