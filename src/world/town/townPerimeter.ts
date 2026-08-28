/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../../types';

export function buildCastlePerimeterAndGates(
  map: TileType[][],
  width: number,
  height: number,
  midX: number,
  midY: number
): void {
  // 1. Massive surrounding walls
  for (let y = 1; y <= height - 2; y++) {
    map[y][2] = TileType.Wall;
    map[y][width - 3] = TileType.Wall;
  }
  for (let x = 2; x <= width - 3; x++) {
    map[1][x] = TileType.Wall;
    map[height - 2][x] = TileType.Wall;
  }

  // 2. Heavy Gates with flanking towers
  // West Gate
  map[midY][2] = TileType.TownGate;
  map[midY + 1][2] = TileType.TownGate;
  map[midY - 1][1] = TileType.Wall; map[midY - 1][2] = TileType.Wall; map[midY - 1][3] = TileType.Wall;
  map[midY + 2][1] = TileType.Wall; map[midY + 2][2] = TileType.Wall; map[midY + 2][3] = TileType.Wall;

  // East Gate
  map[midY][width - 3] = TileType.TownGate;
  map[midY + 1][width - 3] = TileType.TownGate;
  map[midY - 1][width - 4] = TileType.Wall; map[midY - 1][width - 3] = TileType.Wall; map[midY - 1][width - 2] = TileType.Wall;
  map[midY + 2][width - 4] = TileType.Wall; map[midY + 2][width - 3] = TileType.Wall; map[midY + 2][width - 2] = TileType.Wall;

  // North Gate
  map[1][midX] = TileType.TownGate;
  map[1][midX + 1] = TileType.TownGate;
  map[0][midX - 1] = TileType.Wall; map[1][midX - 1] = TileType.Wall; map[2][midX - 1] = TileType.Wall;
  map[0][midX + 2] = TileType.Wall; map[1][midX + 2] = TileType.Wall; map[2][midX + 2] = TileType.Wall;

  // South Gate
  map[height - 2][midX] = TileType.TownGate;
  map[height - 2][midX + 1] = TileType.TownGate;
  map[height - 3][midX - 1] = TileType.Wall; map[height - 2][midX - 1] = TileType.Wall; map[height - 1][midX - 1] = TileType.Wall;
  map[height - 3][midX + 2] = TileType.Wall; map[height - 2][midX + 2] = TileType.Wall; map[height - 1][midX + 2] = TileType.Wall;

  // 3. Pave Central Courtyard
  for (let y = midY - 3; y <= midY + 3; y++) {
    for (let x = midX - 12; x <= midX + 12; x++) {
      if (y >= 0 && y < height && x >= 0 && x < width && map[y][x] === TileType.Grass) {
        map[y][x] = TileType.Floor;
      }
    }
  }

  // Courtyard Torches
  map[midY - 2][midX - 2] = TileType.Torch;
  map[midY - 2][midX + 2] = TileType.Torch;
  map[midY + 2][midX - 2] = TileType.Torch;
  map[midY + 2][midX + 2] = TileType.Torch;
}

export function buildPortHarborFeatures(
  map: TileType[][],
  width: number,
  height: number,
  midX: number,
  midY: number
): void {
  // 1. Sculpt Coastal Harbor Water Basin
  for (let y = 0; y < height; y++) {
    for (let x = width - 12; x < width; x++) {
      map[y][x] = TileType.Water;
    }
  }

  // 2. Main Central Pier & Quay Promenade
  for (let x = width - 15; x < width - 1; x++) {
    map[midY - 2][x] = TileType.Path;
    map[midY - 1][x] = TileType.Path;
  }
  for (let y = midY - 3; y <= midY; y++) {
    for (let x = width - 5; x <= width - 2; x++) {
      map[y][x] = TileType.Path;
    }
  }
  map[midY - 2][width - 2] = TileType.Torch;

  // 3. North Pier & Moored Vessel ("HMS Tidebreaker")
  for (let x = width - 12; x <= width - 3; x++) {
    map[midY - 7][x] = TileType.Path;
  }
  map[midY - 7][width - 3] = TileType.Sign;

  for (let vx = width - 6; vx <= width - 2; vx++) {
    for (let vy = midY - 10; vy <= midY - 8; vy++) {
      if (vy >= 0 && vy < height && vx >= 0 && vx < width) {
        map[vy][vx] = TileType.Floor;
      }
    }
    if (midY - 11 >= 0) map[midY - 11][vx] = TileType.Wall;
  }
  if (midY - 9 >= 0) {
    map[midY - 9][width - 4] = TileType.Torch;
    map[midY - 9][width - 5] = TileType.Table;
  }
  if (midY - 8 >= 0) map[midY - 8][width - 3] = TileType.Sign;

  // 4. South Pier & Moored Vessel ("The Salty Siren")
  for (let x = width - 12; x <= width - 3; x++) {
    if (midY + 5 < height) map[midY + 5][x] = TileType.Path;
  }
  if (midY + 5 < height) map[midY + 5][width - 3] = TileType.Sign;

  for (let vx = width - 6; vx <= width - 2; vx++) {
    for (let vy = midY + 7; vy <= midY + 9; vy++) {
      if (vy >= 0 && vy < height && vx >= 0 && vx < width) {
        map[vy][vx] = TileType.Floor;
      }
    }
    if (midY + 10 < height) map[midY + 10][vx] = TileType.Wall;
  }
  if (midY + 8 < height) {
    map[midY + 8][width - 4] = TileType.Campfire;
    map[midY + 8][width - 5] = TileType.Table;
  }
  if (midY + 7 < height) map[midY + 7][width - 3] = TileType.Sign;

  // 5. Harbor Master Hut
  const hmX = width - 18;
  const hmY = midY - 8;
  const hmW = 6;
  const hmH = 5;
  for (let hy = hmY; hy < hmY + hmH; hy++) {
    for (let hx = hmX; hx < hmX + hmW; hx++) {
      if (hy >= 0 && hy < height && hx >= 0 && hx < width) {
        if (hy === hmY || hy === hmY + hmH - 1 || hx === hmX || hx === hmX + hmW - 1) {
          map[hy][hx] = TileType.Wall;
        } else {
          map[hy][hx] = TileType.Floor;
        }
      }
    }
  }
  if (hmY + 2 < height && hmX + hmW - 1 < width) map[hmY + 2][hmX + hmW - 1] = TileType.Door;
  if (hmY + 1 < height) {
    map[hmY + 1][hmX + 2] = TileType.Table;
    map[hmY + 1][hmX + 1] = TileType.Chair;
  }
  if (hmY + 3 < height) {
    map[hmY + 3][hmX + 1] = TileType.Bed;
    map[hmY + 3][hmX + 3] = TileType.Torch;
  }
  if (hmY + 2 < height) map[hmY + 2][hmX + hmW] = TileType.Sign;

  // 6. Fish Market & Stalls
  const fmX = width - 18;
  const fmY = midY + 2;
  for (let fy = fmY; fy < fmY + 4; fy++) {
    for (let fx = fmX; fx < fmX + 5; fx++) {
      if (fy >= 0 && fy < height && fx >= 0 && fx < width) {
        map[fy][fx] = TileType.Floor;
      }
    }
  }
  if (fmY + 1 < height) map[fmY + 1][fmX + 1] = TileType.Table;
  if (fmY + 2 < height) map[fmY + 2][fmX + 1] = TileType.Table;
  if (fmY + 1 < height) map[fmY + 1][fmX + 3] = TileType.Campfire;
  if (fmY < height) map[fmY][fmX + 2] = TileType.Sign;

  // 7. Loading Crane & Cargo Staging
  if (midY - 4 >= 0) {
    map[midY - 4][width - 11] = TileType.Table;
    map[midY - 4][width - 10] = TileType.Table;
  }
  if (midY - 3 >= 0) {
    map[midY - 3][width - 11] = TileType.Anvil;
    map[midY - 3][width - 10] = TileType.Torch;
  }
}
