package com.revanth.PathOptimizer.repo;

import com.revanth.PathOptimizer.model.Edge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PathEdgeRepo extends JpaRepository<Edge, Long> {

    // 🔹 Get edges starting from a node (optional optimization)
    List<Edge> findByFromNode(String fromNode);

    // 🔹 Get edges going to a node (optional)
    List<Edge> findByToNode(String toNode);
}