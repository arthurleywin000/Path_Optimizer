package com.revanth.PathOptimizer.controller;

import com.revanth.PathOptimizer.model.Edge;
import com.revanth.PathOptimizer.repo.PathEdgeRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Paste this file at:
 * src/main/java/com/revanth/PathOptimizer/controller/NodeController.java
 *
 * Handles POST /api/nodes  → adds a "virtual" node by creating a self-loop edge
 *         DELETE /api/nodes/{id} → deletes all edges involving that node
 *
 * NOTE: Your DB only has an "edge" table (no separate node table).
 * A node only exists if it appears in at least one edge.
 * So "adding a node" means storing a placeholder self-loop edge,
 * and "deleting a node" means removing all edges that touch it.
 */
@RestController
@RequestMapping("/api/nodes")
@CrossOrigin(origins = "*")
public class NodeController {

    @Autowired
    private PathEdgeRepo edgeRepo;

    /**
     * POST /api/nodes
     * Body: { "id": "E", "x": 3, "y": 4 }
     * Creates a self-loop edge so the node appears in the graph.
     */
    @PostMapping
    public ResponseEntity<Edge> addNode(@RequestBody Map<String, Object> body) {
        String id = body.get("id").toString().toUpperCase();
        int x = body.containsKey("x") ? Integer.parseInt(body.get("x").toString()) : 0;
        int y = body.containsKey("y") ? Integer.parseInt(body.get("y").toString()) : 0;

        // Auto-increment ID
        long nextId = edgeRepo.findAll().stream()
                .mapToLong(e -> e.getId() != null ? e.getId() : 0)
                .max().orElse(0L) + 1;

        // Self-loop with cost 0 — just to register the node's coordinates
        Edge selfLoop = new Edge(nextId, id, id, 0, x, y, x, y);
        Edge saved = edgeRepo.save(selfLoop);
        return ResponseEntity.ok(saved);
    }

    /**
     * DELETE /api/nodes/{id}
     * Removes ALL edges where this node is the source or target.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNode(@PathVariable String id) {
        String nodeId = id.toUpperCase();
        List<Edge> toDelete = edgeRepo.findAll().stream()
                .filter(e -> nodeId.equals(e.getFrom()) || nodeId.equals(e.getTo()))
                .toList();
        edgeRepo.deleteAll(toDelete);
        return ResponseEntity.noContent().build();
    }
}