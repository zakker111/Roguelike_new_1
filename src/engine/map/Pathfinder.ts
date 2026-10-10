/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GridMap } from './GridMap';
import { GridPoint } from './types';

interface AStarNode {
  point: GridPoint;
  gCost: number;
  hCost: number;
  fCost: number;
  parent?: AStarNode;
}

/**
 * Generic A* Pathfinder for 2D spatial navigation.
 * Conforms to Step 8 (Engine / Game Separation) of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md).
 */
export class Pathfinder {
  /**
   * Finds the shortest walkable path between start and goal.
   * Returns an array of points from start to goal (inclusive), or empty if unreachable.
   */
  public static findPath(
    map: GridMap,
    start: GridPoint,
    goal: GridPoint,
    allowDiagonals: boolean = false,
    maxIterations: number = 1000
  ): GridPoint[] {
    if (!map.isInBounds(start.x, start.y) || !map.isInBounds(goal.x, goal.y)) {
      return [];
    }

    if (start.x === goal.x && start.y === goal.y) {
      return [start];
    }

    const openSet = new Map<string, AStarNode>();
    const closedSet = new Set<string>();

    const startNode: AStarNode = {
      point: start,
      gCost: 0,
      hCost: map.getDistance(start, goal, allowDiagonals ? 'chebyshev' : 'manhattan'),
      fCost: 0
    };
    startNode.fCost = startNode.gCost + startNode.hCost;

    const startKey = `${start.x},${start.y}`;
    openSet.set(startKey, startNode);

    let iterations = 0;

    while (openSet.size > 0 && iterations++ < maxIterations) {
      // Find node with lowest fCost
      let current: AStarNode | null = null;
      for (const node of openSet.values()) {
        if (!current || node.fCost < current.fCost || (node.fCost === current.fCost && node.hCost < current.hCost)) {
          current = node;
        }
      }

      if (!current) break;

      const currentKey = `${current.point.x},${current.point.y}`;

      // Goal reached!
      if (current.point.x === goal.x && current.point.y === goal.y) {
        const path: GridPoint[] = [];
        let curr: AStarNode | undefined = current;
        while (curr) {
          path.unshift(curr.point);
          curr = curr.parent;
        }
        return path;
      }

      openSet.delete(currentKey);
      closedSet.add(currentKey);

      const neighbors = map.getNeighbors(current.point.x, current.point.y, allowDiagonals);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(neighborKey)) continue;

        const cell = map.getCell(neighbor.x, neighbor.y);
        const moveCost = cell?.cost ?? 1;
        const tentativeGCost = current.gCost + moveCost;

        const existing = openSet.get(neighborKey);
        if (!existing || tentativeGCost < existing.gCost) {
          const hCost = map.getDistance(neighbor, goal, allowDiagonals ? 'chebyshev' : 'manhattan');
          const neighborNode: AStarNode = {
            point: neighbor,
            gCost: tentativeGCost,
            hCost,
            fCost: tentativeGCost + hCost,
            parent: current
          };
          openSet.set(neighborKey, neighborNode);
        }
      }
    }

    // No path found
    return [];
  }
}
