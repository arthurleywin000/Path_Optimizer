package com.revanth.PathOptimizer.model;

public class Node {

    private String name;
    private int x;
    private int y;
    private int cost; // used when acting as neighbor

    // Constructor for node (coordinates)
    public Node(String name, int x, int y) {
        this.name = name;
        this.x = x;
        this.y = y;
    }

    // Constructor for edge usage (neighbor with cost)
    public Node(String name, int cost, int x, int y) {
        this.name = name;
        this.cost = cost;
        this.x = x;
        this.y = y;
    }

    public String getName() {
        return name;
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }

    public int getCost() {
        return cost;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setX(int x) {
        this.x = x;
    }

    public void setY(int y) {
        this.y = y;
    }

    public void setCost(int cost) {
        this.cost = cost;
    }
}