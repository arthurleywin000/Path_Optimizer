package com.revanth.PathOptimizer.service;

import org.springframework.stereotype.Service;

@Service
public class DecisionEngineService {

    public boolean isTrafficHigh(String node) {
        return node.hashCode() % 2 == 0;
    }

    public boolean isBlocked(String node) {
        return node.hashCode() % 5 == 0;
    }
}