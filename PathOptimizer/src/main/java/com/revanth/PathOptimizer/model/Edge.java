package com.revanth.PathOptimizer.model;

import jakarta.persistence.Column; // 🟢 MAKE SURE TO IMPORT THIS
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Edge {

    @Id
    private Long id;

    @Column(name = "from_node")
    private String fromNode;

    @Column(name = "to_node")
    private String toNode;

    @Column(name = "cost")
    private int cost;

    // 🔥 Explicitly mapping the coordinates
    @Column(name = "from_x")
    private int fromX;

    @Column(name = "from_y")
    private int fromY;

    @Column(name = "to_x")
    private int toX;

    @Column(name = "to_y")
    private int toY;

    public Edge() {}

    public Edge(Long id, String fromNode, String toNode, int cost,
                int fromX, int fromY, int toX, int toY) {
        this.id = id;
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.cost = cost;
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
    }

    public Long getId() { return id; }

    public String getFrom() { return fromNode; }

    public String getTo() { return toNode; }

    public int getCost() { return cost; }

    public int getFromX() { return fromX; }

    public int getFromY() { return fromY; }

    public int getToX() { return toX; }

    public int getToY() { return toY; }

    public void setId(Long id) { this.id = id; }

    public void setFrom(String fromNode) { this.fromNode = fromNode; }

    public void setTo(String toNode) { this.toNode = toNode; }

    public void setCost(int cost) { this.cost = cost; }

    public void setFromX(int fromX) { this.fromX = fromX; }

    public void setFromY(int fromY) { this.fromY = fromY; }

    public void setToX(int toX) { this.toX = toX; }

    public void setToY(int toY) { this.toY = toY; }
}