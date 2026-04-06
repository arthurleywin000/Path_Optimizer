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
 * src/main/java/com/revanth/PathOptimizer/controller/EdgeController.java
 */
@RestController
@RequestMapping("/api/edges")
@CrossOrigin(origins = "*")
public class EdgeController {

    @Autowired
    private PathEdgeRepo edgeRepo;

    /**
     * POST /api/edges
     * Body: { "from": "A", "to": "B", "cost": 5 }
     */
    @PostMapping
    public ResponseEntity<Edge> addEdge(@RequestBody Map<String, Object> body) {
        long nextId = edgeRepo.findAll().stream()
                .mapToLong(e -> e.getId() != null ? e.getId() : 0)
                .max().orElse(0L) + 1;

        String from = body.get("from").toString().toUpperCase();
        String to   = body.get("to").toString().toUpperCase();
        int cost    = Integer.parseInt(body.get("cost").toString());

        // Build a map of node-name → (x, y) by scanning ALL edges (including self-loops).
        // Self-loops are written by NodeController when a standalone node is added,
        // so this correctly picks up brand-new nodes that have no real edges yet.
        Map<String, int[]> coordMap = new java.util.HashMap<>();
        for (Edge e : edgeRepo.findAll()) {
            coordMap.putIfAbsent(e.getFrom(), new int[]{e.getFromX(), e.getFromY()});
            coordMap.putIfAbsent(e.getTo(),   new int[]{e.getToX(),   e.getToY()});
        }

        int[] fc = coordMap.getOrDefault(from, new int[]{0, 0});
        int[] tc = coordMap.getOrDefault(to,   new int[]{0, 0});

        Edge edge = new Edge(nextId, from, to, cost, fc[0], fc[1], tc[0], tc[1]);
        return ResponseEntity.ok(edgeRepo.save(edge));
    }

    /**
     * PUT /api/edges/{id}
     * Body: { "cost": 10 }
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEdge(@PathVariable Long id,
                                        @RequestBody Map<String, Object> body) {
        return edgeRepo.findById(id).map(edge -> {
            if (body.containsKey("cost")) {
                edge.setCost(Integer.parseInt(body.get("cost").toString()));
            }
            return ResponseEntity.ok(edgeRepo.save(edge));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/edges/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEdge(@PathVariable Long id) {
        if (!edgeRepo.existsById(id)) return ResponseEntity.notFound().build();
        edgeRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}