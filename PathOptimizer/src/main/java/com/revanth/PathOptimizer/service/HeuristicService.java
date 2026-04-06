package com.revanth.PathOptimizer.service;

import com.revanth.PathOptimizer.model.Node;
import org.springframework.stereotype.Service;

@Service
public class HeuristicService {

    public int calculate(Node a, Node b) {
        return Math.abs(a.getX() - b.getX()) + Math.abs(a.getY() - b.getY());
    }
}