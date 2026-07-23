/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../types';

/**
 * Returns a list of coordinates of a straight line connecting two grid points.
 * Uses Bresenham's Line Algorithm.
 */
export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return points;
}

/**
 * Computes light visibility for raw raycasting grid.
 * Updates the visible boolean array up to a certain maximum light radius.
 */
export function computeFOV(
  px: number,
  py: number,
  map: TileType[][],
  radius: number
): boolean[][] {
  const height = map.length;
  const width = map[0].length;
  const visible = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));

  // Clamp starting position to guarantee we don't access out of bounds
  const clampedPx = Math.max(0, Math.min(width - 1, px));
  const clampedPy = Math.max(0, Math.min(height - 1, py));

  // Player position is always visible
  visible[clampedPy][clampedPx] = true;

  // Cast rays to the boundary of vision square
  const minX = Math.max(0, clampedPx - radius);
  const maxX = Math.min(width - 1, clampedPx + radius);
  const minY = Math.max(0, clampedPy - radius);
  const maxY = Math.min(height - 1, clampedPy + radius);

  // Cast rays outward
  for (let x = minX; x <= maxX; x++) {
    castRay(clampedPx, clampedPy, x, minY);
    castRay(clampedPx, clampedPy, x, maxY);
  }
  for (let y = minY; y <= maxY; y++) {
    castRay(clampedPx, clampedPy, minX, y);
    castRay(clampedPx, clampedPy, maxX, y);
  }

  function castRay(x0: number, y0: number, x1: number, y1: number) {
    const line = bresenhamLine(x0, y0, x1, y1);
    for (const p of line) {
      // Bounds check for point coordinates to prevent "Cannot set properties of undefined" or other exceptions
      if (p.x < 0 || p.x >= width || p.y < 0 || p.y >= height) {
        continue;
      }

      // Distance check
      const dist = Math.sqrt((p.x - x0) ** 2 + (p.y - y0) ** 2);
      if (dist > radius) break;

      visible[p.y][p.x] = true;

      // Wall blocks light
      if (
        map[p.y][p.x] === TileType.Wall ||
        map[p.y][p.x] === TileType.Door ||
        map[p.y][p.x] === TileType.WatchtowerWall ||
        map[p.y][p.x] === TileType.WatchtowerSlit ||
        map[p.y][p.x] === TileType.WatchtowerBarricade
      ) {
        break;
      }
    }
  }

  return visible;
}

/**
 * BFS-based grid pathfinder for AI movement.
 * Smart entities can consider Doors walkable.
 */
export function getNextStepTowards(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  map: TileType[][],
  canOpenDoors: boolean,
  otherEnemies: { x: number; y: number }[],
  isWaterWalkable?: boolean
): { x: number; y: number } | null {
  const height = map.length;
  const width = map[0].length;

  const clampedStartX = Math.max(0, Math.min(width - 1, startX));
  const clampedStartY = Math.max(0, Math.min(height - 1, startY));
  const clampedTargetX = Math.max(0, Math.min(width - 1, targetX));
  const clampedTargetY = Math.max(0, Math.min(height - 1, targetY));

  if (clampedStartX === clampedTargetX && clampedStartY === clampedTargetY) {
    return null;
  }

  const queue: { x: number; y: number; firstStep: { x: number; y: number } | null }[] = [];
  const visited = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));

  queue.push({ x: clampedStartX, y: clampedStartY, firstStep: null });
  visited[clampedStartY][clampedStartX] = true;

  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { x, y, firstStep } = current;

    if (x === clampedTargetX && y === clampedTargetY) {
      // Found the target. The next step is the first move in the path
      return firstStep;
    }

    for (const dir of dirs) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
        // Accessibility conditions
        const tile = map[ny][nx];
        const isTileBlocked =
          tile === TileType.Wall ||
          tile === TileType.Window ||
          tile === TileType.Table ||
          tile === TileType.Tree ||
          tile === TileType.PineTree ||
          tile === TileType.BirchTree ||
          tile === TileType.CopperVein ||
          tile === TileType.IronVein ||
          tile === TileType.WatchtowerWall ||
          tile === TileType.WatchtowerSlit ||
          tile === TileType.WatchtowerBarricade ||
          (tile === TileType.Water && !isWaterWalkable) ||
          tile === TileType.Campfire ||
          tile === TileType.Anvil ||
          tile === TileType.Bed ||
          tile === TileType.Empty ||
          (tile === TileType.Door && !canOpenDoors);

        if (isTileBlocked) {
          continue;
        }

        // Avoid stepping on other monsters unless it is the final target cell (e.g. combat strike)
        const isOccupiedByEnemy = otherEnemies.some((e) => e.x === nx && e.y === ny);
        if (isOccupiedByEnemy && !(nx === clampedTargetX && ny === clampedTargetY)) {
          continue;
        }

        visited[ny][nx] = true;
        const nextFirstStep = firstStep || { x: nx, y: ny };
        queue.push({ x: nx, y: ny, firstStep: nextFirstStep });
      }
    }
  }

  // Fallback to simple manhattan if BFS failed (e.g. fully surrounded or unreachable)
  const bestDir = dirs
    .map((dir) => {
      const nx = clampedStartX + dir.dx;
      const ny = clampedStartY + dir.dy;
      const dist = Math.abs(nx - clampedTargetX) + Math.abs(ny - clampedTargetY);
      return { nx, ny, dist };
    })
    .filter((step) => {
      if (step.nx < 0 || step.nx >= width || step.ny < 0 || step.ny >= height) return false;
      const tile = map[step.ny][step.nx];
      const isTileBlocked =
        tile === TileType.Wall ||
        tile === TileType.Window ||
        tile === TileType.Table ||
        tile === TileType.Tree ||
        tile === TileType.PineTree ||
        tile === TileType.BirchTree ||
        tile === TileType.CopperVein ||
        tile === TileType.IronVein ||
        tile === TileType.WatchtowerWall ||
        tile === TileType.WatchtowerSlit ||
        tile === TileType.WatchtowerBarricade ||
        (tile === TileType.Water && !isWaterWalkable) ||
        tile === TileType.Campfire ||
        tile === TileType.Anvil ||
        tile === TileType.Bed ||
        tile === TileType.Empty ||
        (tile === TileType.Door && !canOpenDoors);
      if (isTileBlocked) return false;
      return !otherEnemies.some((e) => e.x === step.nx && e.y === step.ny);
    })
    .sort((a, b) => a.dist - b.dist)[0];

  return bestDir ? { x: bestDir.nx, y: bestDir.ny } : null;
}
