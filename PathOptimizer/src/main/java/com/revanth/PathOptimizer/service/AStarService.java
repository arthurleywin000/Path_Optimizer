package com.revanth.PathOptimizer.service;

import com.revanth.PathOptimizer.model.Node;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AStarService {

    @Autowired
    private HeuristicService heuristicService;

    static class State {
        String name;
        int gCost;
        int fCost;

        State(String name, int gCost, int fCost) {
            this.name = name;
            this.gCost = gCost;
            this.fCost = fCost;
        }
    }

    public List<String> findPath(
            Map<String, List<Node>> graph,
            Map<String, Node> nodeMap,
            String start,
            String goal
    ) {

        PriorityQueue<State> open =
                new PriorityQueue<>(Comparator.comparingInt(s -> s.fCost));

        Map<String, Integer> gCost = new HashMap<>();
        Map<String, String> parent = new HashMap<>();
        Set<String> closed = new HashSet<>();

        for (String node : graph.keySet()) {
            gCost.put(node, Integer.MAX_VALUE);
        }

        gCost.put(start, 0);

        open.add(new State(
                start,
                0,
                heuristicService.calculate(nodeMap.get(start), nodeMap.get(goal))
        ));

        while (!open.isEmpty()) {

            State current = open.poll();

            if (closed.contains(current.name)) continue;
            closed.add(current.name);

            if (current.name.equals(goal)) {
                return reconstructPath(parent, goal);
            }

            for (Node neighbor : graph.getOrDefault(current.name, new ArrayList<>())) {

                int tentativeG = gCost.get(current.name) + neighbor.getCost();

                if (tentativeG < gCost.getOrDefault(neighbor.getName(), Integer.MAX_VALUE)) {

                    gCost.put(neighbor.getName(), tentativeG);
                    parent.put(neighbor.getName(), current.name);

                    int fCost = tentativeG +
                            heuristicService.calculate(
                                    nodeMap.get(neighbor.getName()),
                                    nodeMap.get(goal)
                            );

                    open.add(new State(neighbor.getName(), tentativeG, fCost));
                }
            }
        }

        return new ArrayList<>();
    }

    private List<String> reconstructPath(Map<String, String> parent, String goal) {
        List<String> path = new ArrayList<>();
        String current = goal;

        while (current != null) {
            path.add(current);
            current = parent.get(current);
        }

        Collections.reverse(path);
        return path;
    }
}