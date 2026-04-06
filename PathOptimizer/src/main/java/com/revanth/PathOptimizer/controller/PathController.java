package com.revanth.PathOptimizer.controller;

import com.revanth.PathOptimizer.dto.PathRequest;
import com.revanth.PathOptimizer.dto.PathResponse;
import com.revanth.PathOptimizer.service.PathService;
import com.revanth.PathOptimizer.repo.PathEdgeRepo; // 🟢 NEW IMPORT
import com.revanth.PathOptimizer.model.Edge;         // 🟢 NEW IMPORT

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;                               // 🟢 NEW IMPORT

@RestController
@RequestMapping("/api/path")
@CrossOrigin(origins = "*") // allows frontend connection
public class PathController {

    @Autowired
    private PathService pathService;

    // 🟢 NEW: This connects the controller directly to your database
    @Autowired
    private PathEdgeRepo edgeRepo;

    // ✅ POST API (For finding the path)
    @PostMapping
    public PathResponse findPath(@RequestBody PathRequest request) {
        return pathService.findPath(
                request.getStart(),
                request.getGoal()
        );
    }

    // ✅ OPTIONAL: GET API (for testing in browser)
    @GetMapping
    public PathResponse getPath(
            @RequestParam String start,
            @RequestParam String goal
    ) {
        return pathService.findPath(start, goal);
    }

    // 🟢 NEW: API for React frontend to fetch the entire map data
    @GetMapping("/graph")
    public List<Edge> getFullGraph() {
        // This grabs all the rows you inserted into PostgreSQL and sends them to React!
        return edgeRepo.findAll();
    }
}