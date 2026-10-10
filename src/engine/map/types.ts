/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Basic 2D grid integer coordinates
 */
export interface GridPoint {
  x: number;
  y: number;
}

/**
 * Bounding rectangle in grid coordinates
 */
export interface GridBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Cell state flags in the generic grid map
 */
export interface GridCell {
  x: number;
  y: number;
  walkable: boolean;
  transparent: boolean;
  explored?: boolean;
  visible?: boolean;
  tileType?: string;
  cost?: number; // Movement cost multiplier (default 1)
}

/**
 * Metric options for distance calculations
 */
export type DistanceMetric = 'manhattan' | 'euclidean' | 'chebyshev';

/**
 * Result of line-of-sight raycasting
 */
export interface LineOfSightResult {
  hasLos: boolean;
  points: GridPoint[];
  blockingPoint?: GridPoint;
}
