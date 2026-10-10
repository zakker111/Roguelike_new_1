/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GridPoint, GridCell, DistanceMetric, LineOfSightResult } from './types';

/**
 * Generic 2D Spatial Grid Map.
 * Conforms to Step 8 (Engine / Game Separation) of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md).
 * Completely agnostic of graphics or game themes; provides spatial geometry,
 * Bresenham line-of-sight, field-of-view, and coordinate distance metrics.
 */
export class GridMap {
  public readonly width: number;
  public readonly height: number;
  private cells: GridCell[][];

  constructor(width: number, height: number, defaultWalkable: boolean = true) {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => ({
        x,
        y,
        walkable: defaultWalkable,
        transparent: defaultWalkable,
        explored: false,
        visible: false,
        cost: 1
      }))
    );
  }

  /**
   * Checks whether coordinates lie inside map bounds
   */
  public isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Retrieves cell at coordinates
   */
  public getCell(x: number, y: number): GridCell | undefined {
    if (!this.isInBounds(x, y)) return undefined;
    return this.cells[y][x];
  }

  /**
   * Checks if cell is walkable
   */
  public isWalkable(x: number, y: number): boolean {
    return this.isInBounds(x, y) && this.cells[y][x].walkable;
  }

  /**
   * Sets walkability of a cell
   */
  public setWalkable(x: number, y: number, walkable: boolean): void {
    if (this.isInBounds(x, y)) {
      this.cells[y][x].walkable = walkable;
    }
  }

  /**
   * Checks if cell is transparent for line-of-sight
   */
  public isTransparent(x: number, y: number): boolean {
    return this.isInBounds(x, y) && this.cells[y][x].transparent;
  }

  /**
   * Sets transparency of a cell
   */
  public setTransparent(x: number, y: number, transparent: boolean): void {
    if (this.isInBounds(x, y)) {
      this.cells[y][x].transparent = transparent;
    }
  }

  /**
   * Calculates distance between two points using specified metric
   */
  public getDistance(p1: GridPoint, p2: GridPoint, metric: DistanceMetric = 'chebyshev'): number {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);

    switch (metric) {
      case 'manhattan':
        return dx + dy;
      case 'euclidean':
        return Math.sqrt(dx * dx + dy * dy);
      case 'chebyshev':
      default:
        return Math.max(dx, dy);
    }
  }

  /**
   * Evaluates line of sight using Bresenham's line algorithm
   */
  public hasLOS(x0: number, y0: number, x1: number, y1: number): LineOfSightResult {
    const points: GridPoint[] = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let curX = x0;
    let curY = y0;

    while (true) {
      points.push({ x: curX, y: curY });

      if (curX === x1 && curY === y1) {
        break;
      }

      // Check transparency of intermediate points (ignore origin)
      if (!(curX === x0 && curY === y0) && !this.isTransparent(curX, curY)) {
        return {
          hasLos: false,
          points,
          blockingPoint: { x: curX, y: curY }
        };
      }

      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        curX += sx;
      }
      if (e2 < dx) {
        err += dx;
        curY += sy;
      }
    }

    return {
      hasLos: true,
      points
    };
  }

  /**
   * Computes visible cells from origin within given radius using radial raycasting
   */
  public computeFOV(originX: number, originY: number, radius: number): Set<string> {
    const visibleKeys = new Set<string>();
    const originKey = `${originX},${originY}`;
    visibleKeys.add(originKey);

    if (this.isInBounds(originX, originY)) {
      this.cells[originY][originX].visible = true;
      this.cells[originY][originX].explored = true;
    }

    // Cast rays to perimeter bounding box
    const minX = Math.max(0, originX - radius);
    const maxX = Math.min(this.width - 1, originX + radius);
    const minY = Math.max(0, originY - radius);
    const maxY = Math.min(this.height - 1, originY + radius);

    const perimeterPoints: GridPoint[] = [];
    for (let x = minX; x <= maxX; x++) {
      perimeterPoints.push({ x, y: minY });
      perimeterPoints.push({ x, y: maxY });
    }
    for (let y = minY; y <= maxY; y++) {
      perimeterPoints.push({ x: minX, y });
      perimeterPoints.push({ x: maxX, y });
    }

    for (const target of perimeterPoints) {
      const ray = this.hasLOS(originX, originY, target.x, target.y);
      for (const p of ray.points) {
        if (this.getDistance({ x: originX, y: originY }, p) <= radius) {
          const key = `${p.x},${p.y}`;
          visibleKeys.add(key);
          if (this.isInBounds(p.x, p.y)) {
            this.cells[p.y][p.x].visible = true;
            this.cells[p.y][p.x].explored = true;
          }
        }
      }
    }

    return visibleKeys;
  }

  /**
   * Resets visible flags across all cells
   */
  public clearVisibility(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x].visible = false;
      }
    }
  }

  /**
   * Returns adjacent neighbors for pathfinding
   */
  public getNeighbors(x: number, y: number, allowDiagonals: boolean = false): GridPoint[] {
    const directions: GridPoint[] = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    if (allowDiagonals) {
      directions.push(
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: 1 },
        { x: 1, y: 1 }
      );
    }

    const neighbors: GridPoint[] = [];
    for (const d of directions) {
      const nx = x + d.x;
      const ny = y + d.y;
      if (this.isWalkable(nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }
}
