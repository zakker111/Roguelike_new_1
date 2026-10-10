/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DungeonPoint, DungeonRoomDefinition } from './types';

/**
 * Pseudo-Random Number Generator with optional seed support (Linear Congruential Generator)
 */
export class Random {
  private state: number;

  constructor(seed?: number) {
    this.state = seed !== undefined ? seed >>> 0 : Math.floor(Math.random() * 2147483647);
  }

  /**
   * Returns a float between [0, 1)
   */
  nextFloat(): number {
    // Standard Park-Miller / LCG
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return (this.state & 0x7fffffff) / 2147483648;
  }

  /**
   * Returns an integer between [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Pick random item from an array
   */
  pick<T>(items: T[]): T {
    return items[Math.floor(this.nextFloat() * items.length)];
  }

  /**
   * Shuffle an array using Fisher-Yates
   */
  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.nextFloat() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Return true with probability p (0 <= p <= 1)
   */
  chance(p: number): boolean {
    return this.nextFloat() < p;
  }
}

/**
 * Creates a blank 2D grid filled with a tile string
 */
export function createGrid(width: number, height: number, fillTile: string = 'wall'): string[][] {
  const grid: string[][] = [];
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(fillTile));
  }
  return grid;
}

/**
 * Checks if two bounding boxes overlap with padding
 */
export function roomsOverlap(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number },
  padding: number = 1
): boolean {
  return !(
    r1.x + r1.width + padding <= r2.x ||
    r2.x + r2.width + padding <= r1.x ||
    r1.y + r1.height + padding <= r2.y ||
    r2.y + r2.height + padding <= r1.y
  );
}

/**
 * Carves a rectangular room on the grid
 */
export function carveRectangle(
  grid: string[][],
  x: number,
  y: number,
  width: number,
  height: number,
  tile: string = 'floor'
): void {
  const maxY = Math.min(grid.length - 1, y + height);
  const maxX = Math.min(grid[0].length - 1, x + width);

  for (let cy = Math.max(0, y); cy < maxY; cy++) {
    for (let cx = Math.max(0, x); cx < maxX; cx++) {
      grid[cy][cx] = tile;
    }
  }
}

/**
 * Carves an organic circular / elliptical room on the grid
 */
export function carveCircle(
  grid: string[][],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tile: string = 'floor'
): void {
  const minX = Math.max(0, Math.floor(cx - rx));
  const maxX = Math.min(grid[0].length - 1, Math.ceil(cx + rx));
  const minY = Math.max(0, Math.floor(cy - ry));
  const maxY = Math.min(grid.length - 1, Math.ceil(cy + ry));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1.0) {
        grid[y][x] = tile;
      }
    }
  }
}

/**
 * Carves an L-shaped corridor connecting two points
 */
export function carveLCorridor(
  grid: string[][],
  p1: DungeonPoint,
  p2: DungeonPoint,
  width: number = 1,
  tile: string = 'floor',
  horizontalFirst: boolean = true
): DungeonPoint[] {
  const path: DungeonPoint[] = [];
  const gridHeight = grid.length;
  const gridWidth = grid[0].length;

  const setTile = (x: number, y: number) => {
    for (let dy = 0; dy < width; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          grid[ny][nx] = tile;
          path.push({ x: nx, y: ny });
        }
      }
    }
  };

  if (horizontalFirst) {
    const startX = Math.min(p1.x, p2.x);
    const endX = Math.max(p1.x, p2.x);
    for (let x = startX; x <= endX; x++) {
      setTile(x, p1.y);
    }
    const startY = Math.min(p1.y, p2.y);
    const endY = Math.max(p1.y, p2.y);
    for (let y = startY; y <= endY; y++) {
      setTile(p2.x, y);
    }
  } else {
    const startY = Math.min(p1.y, p2.y);
    const endY = Math.max(p1.y, p2.y);
    for (let y = startY; y <= endY; y++) {
      setTile(p1.x, y);
    }
    const startX = Math.min(p1.x, p2.x);
    const endX = Math.max(p1.x, p2.x);
    for (let x = startX; x <= endX; x++) {
      setTile(x, p2.y);
    }
  }

  return path;
}

/**
 * Calculates the center point of a room
 */
export function getRoomCenter(room: DungeonRoomDefinition): DungeonPoint {
  return {
    x: Math.floor(room.x + room.width / 2),
    y: Math.floor(room.y + room.height / 2)
  };
}
