/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../../types';

/**
 * Carves a ruined building with crumbled walls, broken doorways, and scattered floor debris.
 */
export function carveRuinedBuilding(
  tiles: TileType[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  rngSeed: number = 42
): void {
  const mapH = tiles.length;
  const mapW = tiles[0].length;

  let seed = rngSeed;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (y < 0 || y >= mapH || x < 0 || x >= mapW) continue;

      const isBorder = (x === startX || x === startX + width - 1 || y === startY || y === startY + height - 1);

      if (isBorder) {
        // 25% chance wall is crumbled/collapsed into a breach
        if (pseudoRandom() < 0.25) {
          tiles[y][x] = TileType.Floor;
        } else {
          tiles[y][x] = TileType.Wall;
        }
      } else {
        // Interior floor with cracked stone, rubble, or wood floor remnants
        const r = pseudoRandom();
        if (r < 0.15) {
          tiles[y][x] = TileType.Path; // Cracked flagstone
        } else {
          tiles[y][x] = TileType.Floor;
        }
      }
    }
  }
}

/**
 * Carves natural rubble choke points and collapsed barricades
 */
export function carveRubbleBarricade(
  tiles: TileType[][],
  centerX: number,
  centerY: number,
  length: number,
  horizontal: boolean = true
): void {
  const mapH = tiles.length;
  const mapW = tiles[0].length;

  for (let i = -Math.floor(length / 2); i <= Math.floor(length / 2); i++) {
    const x = horizontal ? centerX + i : centerX;
    const y = horizontal ? centerY : centerY + i;

    if (x >= 1 && x < mapW - 1 && y >= 1 && y < mapH - 1) {
      // Leave 1 tile opening in the middle as tactical choke point
      if (Math.abs(i) !== 0) {
        tiles[y][x] = TileType.Wall;
      } else {
        tiles[y][x] = TileType.Floor;
      }
    }
  }
}

/**
 * Creates an open stone plaza with shattered central pillars
 */
export function carvePlazaCenterpiece(
  tiles: TileType[][],
  centerX: number,
  centerY: number,
  radius: number
): void {
  const mapH = tiles.length;
  const mapW = tiles[0].length;

  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (x < 1 || x >= mapW - 1 || y < 1 || y >= mapH - 1) continue;

      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (dist <= radius) {
        tiles[y][x] = TileType.Path;
      }
    }
  }

  // Place 4 shattered pillars around center
  const pillarOffsets = [
    { x: -2, y: -2 },
    { x: 2, y: -2 },
    { x: -2, y: 2 },
    { x: 2, y: 2 },
  ];

  for (const offset of pillarOffsets) {
    const px = centerX + offset.x;
    const py = centerY + offset.y;
    if (px >= 1 && px < mapW - 1 && py >= 1 && py < mapH - 1) {
      tiles[py][px] = TileType.Wall;
    }
  }
}
