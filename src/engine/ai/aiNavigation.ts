/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AISpatialQueryContext } from './types';

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates Manhattan distance between two points
 */
export function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Calculates Chebyshev (diagonal-allowed) distance between two points
 */
export function chebyshevDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

/**
 * 4-directional cardinal vectors
 */
export const CARDINAL_DIRECTIONS: Point[] = [
  { x: 0, y: -1 }, // North
  { x: 1, y: 0 },  // East
  { x: 0, y: 1 },  // South
  { x: -1, y: 0 }, // West
];

/**
 * 8-directional vectors including diagonals
 */
export const OCTILE_DIRECTIONS: Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
];

/**
 * Simple greedy step towards target, avoiding impassable tiles
 */
export function getStepTowards(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  spatial: AISpatialQueryContext,
  allowDiagonal: boolean = false
): { dx: number; dy: number } | null {
  const directions = allowDiagonal ? OCTILE_DIRECTIONS : CARDINAL_DIRECTIONS;
  const currentDist = manhattanDistance(fromX, fromY, toX, toY);

  let bestStep: { dx: number; dy: number } | null = null;
  let bestDist = currentDist;

  // Sort candidate steps by distance reduction to target
  const candidates = directions
    .map(d => ({
      dx: d.x,
      dy: d.y,
      nx: fromX + d.x,
      ny: fromY + d.y,
      dist: manhattanDistance(fromX + d.x, fromY + d.y, toX, toY)
    }))
    .filter(c => c.dist < currentDist)
    .sort((a, b) => a.dist - b.dist);

  for (const cand of candidates) {
    if (spatial.isPassable(cand.nx, cand.ny)) {
      return { dx: cand.dx, dy: cand.dy };
    }
  }

  // If direct distance-reducing step is blocked, look for detour steps that are equal distance
  const detours = directions
    .map(d => ({
      dx: d.x,
      dy: d.y,
      nx: fromX + d.x,
      ny: fromY + d.y,
      dist: manhattanDistance(fromX + d.x, fromY + d.y, toX, toY)
    }))
    .filter(c => c.dist === currentDist)
    .filter(c => spatial.isPassable(c.nx, c.ny));

  if (detours.length > 0) {
    return { dx: detours[0].dx, dy: detours[0].dy };
  }

  return null;
}

/**
 * Step directly away from a threat/target (fleeing / retreating)
 */
export function getStepAway(
  fromX: number,
  fromY: number,
  threatX: number,
  threatY: number,
  spatial: AISpatialQueryContext,
  allowDiagonal: boolean = false
): { dx: number; dy: number } | null {
  const directions = allowDiagonal ? OCTILE_DIRECTIONS : CARDINAL_DIRECTIONS;
  const currentDist = manhattanDistance(fromX, fromY, threatX, threatY);

  // Sort candidates so that if the threat is on an axis (e.g. dy < 0, threat is North),
  // continuing straight away on that axis (South) is prioritized over sideways lateral movement
  const deltaThreatX = fromX - threatX;
  const deltaThreatY = fromY - threatY;

  const candidates = directions
    .map(d => {
      const nx = fromX + d.x;
      const ny = fromY + d.y;
      const dist = manhattanDistance(nx, ny, threatX, threatY);
      // Dot product score to prefer steps collinear with threat displacement
      const collinearScore = d.x * Math.sign(deltaThreatX) + d.y * Math.sign(deltaThreatY);
      return {
        dx: d.x,
        dy: d.y,
        nx,
        ny,
        dist,
        collinearScore
      };
    })
    .filter(c => c.dist > currentDist && spatial.isPassable(c.nx, c.ny))
    .sort((a, b) => {
      if (b.dist !== a.dist) {
        return b.dist - a.dist;
      }
      return b.collinearScore - a.collinearScore;
    });

  if (candidates.length > 0) {
    return { dx: candidates[0].dx, dy: candidates[0].dy };
  }

  // Fallback: any passable direction not decreasing distance
  const sideways = directions
    .map(d => ({
      dx: d.x,
      dy: d.y,
      nx: fromX + d.x,
      ny: fromY + d.y,
      dist: manhattanDistance(fromX + d.x, fromY + d.y, threatX, threatY)
    }))
    .filter(c => c.dist >= currentDist && spatial.isPassable(c.nx, c.ny));

  if (sideways.length > 0) {
    return { dx: sideways[0].dx, dy: sideways[0].dy };
  }

  return null;
}

/**
 * Bresenham Line of sight check if not provided by spatial context
 */
export function checkBresenhamLOS(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  isPassable: (x: number, y: number) => boolean
): boolean {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let cx = x0;
  let cy = y0;

  while (cx !== x1 || cy !== y1) {
    // If not start point and not end point, check passability
    if ((cx !== x0 || cy !== y0) && (cx !== x1 || cy !== y1)) {
      if (!isPassable(cx, cy)) {
        return false;
      }
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }

  return true;
}
