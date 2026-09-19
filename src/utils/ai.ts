/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../types';
import { ElementalTile } from '../types/elemental';

/**
 * Zero-allocation line tracer using Bresenham's algorithm.
 * Calls `callback(x, y)` for each point along the line from (x0, y0) to (x1, y1).
 * If `callback` returns `false`, execution terminates early and returns `false`.
 * Otherwise returns `true`.
 */
export function traceLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  callback: (x: number, y: number) => boolean | void
): boolean {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    if (callback(x, y) === false) {
      return false;
    }
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
  return true;
}

/**
 * Returns a list of coordinates of a straight line connecting two grid points.
 * Uses Bresenham's Line Algorithm with memoization.
 */
const lineCache = new Map<string, { x: number; y: number }[]>();
const MAX_LINE_CACHE_SIZE = 1000;

export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
  const key = `${x0},${y0},${x1},${y1}`;
  const cached = lineCache.get(key);
  if (cached) return cached;

  const points: { x: number; y: number }[] = [];
  traceLine(x0, y0, x1, y1, (x, y) => {
    points.push({ x, y });
    return true;
  });

  if (lineCache.size >= MAX_LINE_CACHE_SIZE) {
    lineCache.clear();
  }
  lineCache.set(key, points);

  return points;
}

export function hasLineOfSight(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  map: TileType[][],
  elementalFields?: ElementalTile[]
): boolean {
  if (!map || map.length === 0 || !map[0]) return true;
  if (x0 === x1 && y0 === y1) return true;

  let clear = true;
  traceLine(x0, y0, x1, y1, (x, y) => {
    // Endpoints do not block sight between themselves
    if ((x === x0 && y === y0) || (x === x1 && y === y1)) {
      return true;
    }
    const tile = map[y]?.[x];
    if (
      tile === TileType.Wall ||
      tile === TileType.Door ||
      tile === TileType.WatchtowerWall ||
      tile === TileType.WatchtowerSlit ||
      tile === TileType.WatchtowerBarricade ||
      tile === TileType.Tree ||
      tile === TileType.PineTree ||
      tile === TileType.BirchTree ||
      tile === TileType.CopperVein ||
      tile === TileType.IronVein ||
      tile === TileType.FieldTent
    ) {
      clear = false;
      return false; // early stop
    }

    if (elementalFields && elementalFields.length > 0) {
      if (elementalFields.some((f) => f.x === x && f.y === y && f.element === 'steam' && f.duration > 0)) {
        clear = false;
        return false;
      }
    }
    return true;
  });
  return clear;
}

/**
 * Fast direct matrix allocation without closure creation overhead.
 */
export function createBooleanMatrix(width: number, height: number, initialValue: boolean = false): boolean[][] {
  const matrix: boolean[][] = new Array(height);
  for (let y = 0; y < height; y++) {
    const row = new Array(width);
    for (let x = 0; x < width; x++) {
      row[x] = initialValue;
    }
    matrix[y] = row;
  }
  return matrix;
}

/**
 * Computes light visibility for raw raycasting grid.
 * Updates the visible boolean array up to a certain maximum light radius.
 * Uses bounding-box hashing for memoization across static turns.
 */
const fovCache = new Map<string, boolean[][]>();
const MAX_FOV_CACHE_SIZE = 120;

function getBoxHash(px: number, py: number, map: TileType[][], radius: number): string {
  if (!map || map.length === 0 || !map[0]) return '';
  const height = map.length;
  const width = map[0].length;

  const minX = Math.max(0, px - radius);
  const maxX = Math.min(width - 1, px + radius);
  const minY = Math.max(0, py - radius);
  const maxY = Math.min(height - 1, py + radius);

  let h = 2166136261;
  h = Math.imul(h ^ px, 16777619);
  h = Math.imul(h ^ py, 16777619);
  h = Math.imul(h ^ radius, 16777619);

  for (let y = minY; y <= maxY; y++) {
    const row = map[y];
    if (!row) continue;
    for (let x = minX; x <= maxX; x++) {
      const charCode = (row[x] || '0').charCodeAt(0);
      h = Math.imul(h ^ charCode, 16777619);
    }
  }
  return `${px},${py},${radius}:${h >>> 0}`;
}

export function computeFOV(
  px: number,
  py: number,
  map: TileType[][],
  radius: number
): boolean[][] {
  if (!map || map.length === 0 || !map[0] || map[0].length === 0) return [];

  const hashKey = getBoxHash(px, py, map, radius);
  if (hashKey) {
    const cachedFOV = fovCache.get(hashKey);
    if (cachedFOV) {
      return cachedFOV;
    }
  }

  const height = map.length;
  const width = map[0].length;
  const visible = createBooleanMatrix(width, height, false);

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

  const radiusSq = radius * radius;

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
    traceLine(x0, y0, x1, y1, (x, y) => {
      // Bounds check for point coordinates to prevent exceptions
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return true;
      }

      // Fast squared distance check to avoid Math.sqrt in hot raycasting loop
      const distSq = (x - x0) * (x - x0) + (y - y0) * (y - y0);
      if (distSq > radiusSq) return false;

      visible[y][x] = true;

      // Wall blocks light
      const tile = map[y][x];
      if (
        tile === TileType.Wall ||
        tile === TileType.Door ||
        tile === TileType.WatchtowerWall ||
        tile === TileType.WatchtowerSlit ||
        tile === TileType.WatchtowerBarricade ||
        tile === TileType.Tree ||
        tile === TileType.PineTree ||
        tile === TileType.BirchTree ||
        tile === TileType.CopperVein ||
        tile === TileType.IronVein ||
        tile === TileType.FieldTent
      ) {
        return false;
      }
      return true;
    });
  }

  if (fovCache.size >= MAX_FOV_CACHE_SIZE) {
    fovCache.clear();
  }
  fovCache.set(hashKey, visible);

  return visible;
}

export interface TilePassabilityOptions {
  isWaterWalkable?: boolean;
  canOpenDoors?: boolean;
  isBedWalkable?: boolean;
}

/**
 * Authoritative check for whether a tile is impassable (blocks walking/movement) for entities.
 * Includes all obstacles: Wall, Window, Table, Chair, Tree, PineTree, BirchTree, TreeStump,
 * Bush, Sign, Torch, WatchtowerFlag, CopperVein, IronVein, WatchtowerWall, WatchtowerSlit,
 * WatchtowerBarricade, Campfire, Fireplace, Anvil, FieldTent, Empty, and conditionally Water/Door/Bed.
 */
export function isTileBlockedForEntity(
  tile: TileType | undefined,
  options?: TilePassabilityOptions
): boolean {
  if (!tile) return true;

  if (
    tile === TileType.Wall ||
    tile === TileType.Window ||
    tile === TileType.Table ||
    tile === TileType.Chair ||
    tile === TileType.Tree ||
    tile === TileType.PineTree ||
    tile === TileType.BirchTree ||
    tile === TileType.Bush ||
    tile === TileType.Sign ||
    tile === TileType.Torch ||
    tile === TileType.WatchtowerFlag ||
    tile === TileType.CopperVein ||
    tile === TileType.IronVein ||
    tile === TileType.WatchtowerWall ||
    tile === TileType.WatchtowerSlit ||
    tile === TileType.WatchtowerBarricade ||
    tile === TileType.Campfire ||
    tile === TileType.Fireplace ||
    tile === TileType.Anvil ||
    tile === TileType.FieldTent ||
    tile === TileType.Empty
  ) {
    return true;
  }

  if (tile === TileType.Water && !options?.isWaterWalkable) {
    return true;
  }

  if (tile === TileType.Door && !options?.canOpenDoors) {
    return true;
  }

  if (tile === TileType.Bed && !options?.isBedWalkable) {
    return true;
  }

  return false;
}

export function isTileWalkableForEntity(
  tile: TileType | undefined,
  options?: TilePassabilityOptions
): boolean {
  return !isTileBlockedForEntity(tile, options);
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
  if (!map || map.length === 0 || !map[0] || map[0].length === 0) return null;
  const height = map.length;
  const width = map[0].length;

  const clampedStartX = Math.max(0, Math.min(width - 1, startX));
  const clampedStartY = Math.max(0, Math.min(height - 1, startY));
  const clampedTargetX = Math.max(0, Math.min(width - 1, targetX));
  const clampedTargetY = Math.max(0, Math.min(height - 1, targetY));

  if (clampedStartX === clampedTargetX && clampedStartY === clampedTargetY) {
    return null;
  }

  // Pre-build O(1) occupied lookup Set
  const occupiedSet = new Set<number>();
  if (otherEnemies && otherEnemies.length > 0) {
    for (let i = 0; i < otherEnemies.length; i++) {
      const e = otherEnemies[i];
      if (e) occupiedSet.add(e.y * width + e.x);
    }
  }

  const queue: { x: number; y: number; firstStep: { x: number; y: number } | null }[] = [];
  const visited = new Uint8Array(width * height);

  queue.push({ x: clampedStartX, y: clampedStartY, firstStep: null });
  visited[clampedStartY * width + clampedStartX] = 1;

  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  const targetIdx = clampedTargetY * width + clampedTargetX;
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    const { x, y, firstStep } = current;

    if (x === clampedTargetX && y === clampedTargetY) {
      // Found the target. The next step is the first move in the path
      return firstStep;
    }

    for (const dir of dirs) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = ny * width + nx;
        if (visited[idx] === 1) continue;

        // Accessibility conditions
        const tile = map[ny][nx];
        const isTileBlocked = isTileBlockedForEntity(tile, {
          isWaterWalkable,
          canOpenDoors,
          isBedWalkable: idx === targetIdx
        });

        if (isTileBlocked) {
          continue;
        }

        // Avoid stepping on other monsters unless it is the final target cell (e.g. combat strike)
        if (occupiedSet.has(idx) && idx !== targetIdx) {
          continue;
        }

        visited[idx] = 1;
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
      const isTileBlocked = isTileBlockedForEntity(tile, {
        isWaterWalkable,
        canOpenDoors,
        isBedWalkable: step.nx === clampedTargetX && step.ny === clampedTargetY
      });
      if (isTileBlocked) return false;
      return !occupiedSet.has(step.ny * width + step.nx);
    })
    .sort((a, b) => a.dist - b.dist)[0];

  return bestDir ? { x: bestDir.nx, y: bestDir.ny } : null;
}

/**
 * Calculates the next step moving away from a threat position.
 */
export function getNextStepAwayFrom(
  startX: number,
  startY: number,
  threatX: number,
  threatY: number,
  map: TileType[][],
  canOpenDoors: boolean,
  otherEntities: { x: number; y: number }[],
  isWaterWalkable?: boolean
): { x: number; y: number } | null {
  if (!map || map.length === 0 || !map[0] || map[0].length === 0) return null;
  const height = map.length;
  const width = map[0].length;

  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 }
  ];

  const occupiedSet = new Set<string>();
  if (otherEntities) {
    for (let i = 0; i < otherEntities.length; i++) {
      const e = otherEntities[i];
      if (e) occupiedSet.add(`${e.x},${e.y}`);
    }
  }

  let bestStep: { x: number; y: number } | null = null;
  let maxDist = Math.abs(startX - threatX) + Math.abs(startY - threatY);

  for (const dir of dirs) {
    const nx = startX + dir.dx;
    const ny = startY + dir.dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const tile = map[ny][nx];
      const isTileBlocked = isTileBlockedForEntity(tile, {
        isWaterWalkable,
        canOpenDoors,
        isBedWalkable: false
      });

      if (isTileBlocked || occupiedSet.has(`${nx},${ny}`)) continue;

      const dist = Math.abs(nx - threatX) + Math.abs(ny - threatY);
      if (dist > maxDist) {
        maxDist = dist;
        bestStep = { x: nx, y: ny };
      }
    }
  }

  return bestStep;
}

