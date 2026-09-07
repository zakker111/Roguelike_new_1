/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy } from '../../types';

/**
 * Packs 2D grid coordinates (-32768 to 32767) into a 32-bit signed integer
 * for O(1) hash map operations with zero string allocation overhead.
 */
export function packCoord(x: number, y: number): number {
  return (((y + 32768) & 0xFFFF) << 16) | ((x + 32768) & 0xFFFF);
}

/**
 * Unpacks a 32-bit integer key back into integer { x, y } coordinates.
 */
export function unpackCoord(key: number): { x: number; y: number } {
  const y = ((key >>> 16) & 0xFFFF) - 32768;
  const x = (key & 0xFFFF) - 32768;
  return { x, y };
}

/**
 * Fast Manhattan distance between two points (L1 metric).
 */
export function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Fast Chebyshev distance between two points (L_inf metric / 8-way diagonal).
 */
export function chebyshevDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

/**
 * Squared Euclidean distance between two points (L2 metric squared, avoiding Math.sqrt).
 */
export function euclideanDistanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

export interface SpatialLocatable {
  x: number;
  y: number;
  id?: string;
}

/**
 * High-performance 2D Spatial Hash Index using bit-packed integer keys.
 * Replaces O(N) array scans with O(1) cell lookups and O(K) neighborhood queries.
 */
export class SpatialGrid<T extends SpatialLocatable> {
  private cells: Map<number, T[]> = new Map();
  private entityCount: number = 0;

  constructor(entities?: T[]) {
    if (entities && entities.length > 0) {
      this.rebuild(entities);
    }
  }

  /**
   * Clears all indexed entities.
   */
  public clear(): void {
    this.cells.clear();
    this.entityCount = 0;
  }

  /**
   * Rebuilds the entire grid from a flat list of entities.
   */
  public rebuild(entities: T[]): void {
    this.clear();
    for (let i = 0; i < entities.length; i++) {
      this.insert(entities[i]);
    }
  }

  /**
   * Inserts an entity into the grid cell corresponding to its (x, y).
   */
  public insert(entity: T): void {
    const key = packCoord(entity.x, entity.y);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(entity);
    this.entityCount++;
  }

  /**
   * Removes an entity from its current grid cell.
   */
  public remove(entity: T): boolean {
    const key = packCoord(entity.x, entity.y);
    const cell = this.cells.get(key);
    if (!cell) return false;

    const idx = entity.id !== undefined
      ? cell.findIndex(e => e.id === entity.id)
      : cell.indexOf(entity);

    if (idx !== -1) {
      cell.splice(idx, 1);
      this.entityCount--;
      if (cell.length === 0) {
        this.cells.delete(key);
      }
      return true;
    }
    return false;
  }

  /**
   * Updates an entity's position from (oldX, oldY) to its current (entity.x, entity.y).
   */
  public update(entity: T, oldX: number, oldY: number): void {
    if (oldX === entity.x && oldY === entity.y) return;

    const oldKey = packCoord(oldX, oldY);
    const oldCell = this.cells.get(oldKey);
    if (oldCell) {
      const idx = entity.id !== undefined
        ? oldCell.findIndex(e => e.id === entity.id)
        : oldCell.indexOf(entity);
      if (idx !== -1) {
        oldCell.splice(idx, 1);
        this.entityCount--;
        if (oldCell.length === 0) {
          this.cells.delete(oldKey);
        }
      }
    }
    this.insert(entity);
  }

  /**
   * Returns the first entity found at (x, y), or undefined.
   */
  public getAt(x: number, y: number): T | undefined {
    const key = packCoord(x, y);
    const cell = this.cells.get(key);
    return cell && cell.length > 0 ? cell[0] : undefined;
  }

  /**
   * Returns all entities found at (x, y).
   */
  public getAllAt(x: number, y: number): T[] {
    const key = packCoord(x, y);
    const cell = this.cells.get(key);
    return cell ? [...cell] : [];
  }

  /**
   * Returns true if any entity occupies (x, y).
   */
  public hasAt(x: number, y: number): boolean {
    const key = packCoord(x, y);
    const cell = this.cells.get(key);
    return !!(cell && cell.length > 0);
  }

  /**
   * Queries all entities within a Chebyshev radius (square bounding box).
   */
  public getNearby(cx: number, cy: number, radius: number): T[] {
    if (radius <= 0) {
      const at = this.getAt(cx, cy);
      return at ? [at] : [];
    }

    const results: T[] = [];
    const minX = cx - radius;
    const maxX = cx + radius;
    const minY = cy - radius;
    const maxY = cy + radius;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = packCoord(x, y);
        const cell = this.cells.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            results.push(cell[i]);
          }
        }
      }
    }
    return results;
  }

  /**
   * Queries all entities within an Euclidean radius (circular area).
   */
  public getNearbyEuclidean(cx: number, cy: number, radius: number): T[] {
    const radiusSq = radius * radius;
    const box = this.getNearby(cx, cy, Math.ceil(radius));
    return box.filter(e => euclideanDistanceSq(cx, cy, e.x, e.y) <= radiusSq);
  }

  /**
   * Finds the closest entity to (cx, cy), optionally filtered by a predicate.
   */
  public findNearest(
    cx: number,
    cy: number,
    maxRadius: number = 20,
    predicate?: (entity: T) => boolean
  ): { entity: T; distance: number } | null {
    let bestEntity: T | null = null;
    let bestDistSq = Infinity;
    const maxRadiusSq = maxRadius * maxRadius;

    // Search outward in rings
    const candidates = this.getNearby(cx, cy, maxRadius);
    for (let i = 0; i < candidates.length; i++) {
      const item = candidates[i];
      if (predicate && !predicate(item)) continue;
      const dSq = euclideanDistanceSq(cx, cy, item.x, item.y);
      if (dSq < bestDistSq && dSq <= maxRadiusSq) {
        bestDistSq = dSq;
        bestEntity = item;
      }
    }

    if (!bestEntity) return null;
    return {
      entity: bestEntity,
      distance: Math.sqrt(bestDistSq)
    };
  }

  /**
   * Total number of entities stored in the index.
   */
  public get size(): number {
    return this.entityCount;
  }

  /**
   * Factory method to create a SpatialGrid directly from an array.
   */
  public static fromEntities<U extends SpatialLocatable>(entities: U[]): SpatialGrid<U> {
    return new SpatialGrid<U>(entities);
  }
}

/**
 * Specialized Spatial Entity Grid for living combatants and NPCs.
 */
export class SpatialEntityGrid extends SpatialGrid<Enemy> {
  /**
   * Fast factory from Enemy list.
   */
  public static fromEnemies(enemies: Enemy[]): SpatialEntityGrid {
    const grid = new SpatialEntityGrid();
    grid.rebuild(enemies);
    return grid;
  }

  /**
   * Returns living enemy at (x, y) if any.
   */
  public getLivingEnemyAt(x: number, y: number): Enemy | undefined {
    const all = this.getAllAt(x, y);
    return all.find(e => e.hp > 0);
  }
}
