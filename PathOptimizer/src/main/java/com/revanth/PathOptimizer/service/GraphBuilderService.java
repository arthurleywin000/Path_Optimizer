package com.revanth.PathOptimizer.service;

import com.revanth.PathOptimizer.model.Edge;
import com.revanth.PathOptimizer.model.Node;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GraphBuilderService {

    public Map<String, List<Node>> buildGraph(List<Edge> edges,
                                              Map<String, Node> nodeMap) {

        Map<String, List<Node>> graph = new HashMap<>();

        for (Edge e : edges) {

            Node fromNode = new Node(e.getFrom(), e.getFromX(), e.getFromY());
            Node toNode = new Node(e.getTo(), e.getToX(), e.getToY());

            nodeMap.put(e.getFrom(), fromNode);
            nodeMap.put(e.getTo(), toNode);

            graph.computeIfAbsent(e.getFrom(), k -> new ArrayList<>())
                    .add(new Node(e.getTo(), e.getCost(), e.getToX(), e.getToY()));
        }

        return graph;
    }
}