package com.revanth.PathOptimizer.service;

import org.springframework.stereotype.Service;

@Service
public class AgentService {

    public int adjustCost(int baseCost, boolean traffic, boolean blocked) {

        if (blocked) return Integer.MAX_VALUE; // avoid node

        if (traffic) return baseCost + 5;

        return baseCost;
    }
}