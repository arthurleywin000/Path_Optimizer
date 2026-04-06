package com.revanth.PathOptimizer.model;

import java.util.List;
import java.util.Map;

public class Graph {

    private Map<String, List<Node>> adjacencyList;

    public Graph(Map<String, List<Node>> adjacencyList) {
        this.adjacencyList = adjacencyList;
    }

    public Map<String, List<Node>> getAdjacencyList() {
        return adjacencyList;
    }

    public void setAdjacencyList(Map<String, List<Node>> adjacencyList) {
        this.adjacencyList = adjacencyList;
    }
}