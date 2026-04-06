package com.revanth.PathOptimizer.dto;

import java.util.List;

public class PathResponse {

    private List<String> path;
    private int cost; // 🔥 NEW: Added the cost variable

    // Updated constructor to include cost
    public PathResponse(List<String> path, int cost) {
        this.path = path;
        this.cost = cost;
    }

    public List<String> getPath() {
        return path;
    }

    public void setPath(List<String> path) {
        this.path = path;
    }

    public int getCost() {
        return cost;
    }

    public void setCost(int cost) {
        this.cost = cost;
    }
}