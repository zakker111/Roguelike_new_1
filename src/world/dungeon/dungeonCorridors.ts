/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../../types';
import { Room } from './types';

export function carveCorridor(
  map: TileType[][],
  width: number,
  height: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  corridorWidth: number = 2
): void {
  const half = Math.floor(corridorWidth / 2);

  // Carve horizontal segment
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  for (let x = startX; x <= endX; x++) {
    for (let w = 0; w < corridorWidth; w++) {
      const cy = y1 - half + w;
      if (cy > 1 && cy < height - 2 && x > 1 && x < width - 2) {
        if (map[cy][x] === TileType.Wall) map[cy][x] = TileType.Floor;
      }
    }
  }

  // Carve vertical segment
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);
  for (let y = startY; y <= endY; y++) {
    for (let w = 0; w < corridorWidth; w++) {
      const cx = x2 - half + w;
      if (y > 1 && y < height - 2 && cx > 1 && cx < width - 2) {
        if (map[y][cx] === TileType.Wall) map[y][cx] = TileType.Floor;
      }
    }
  }
}

export function connectDungeonRooms(
  map: TileType[][],
  width: number,
  height: number,
  rooms: Room[],
  defaultCorridorWidth: number = 2
): void {
  if (rooms.length < 2) return;

  // 1. Sequential Primary Paths
  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];
    const c1 = { x: Math.floor(r1.x + r1.w / 2), y: Math.floor(r1.y + r1.h / 2) };
    const c2 = { x: Math.floor(r2.x + r2.w / 2), y: Math.floor(r2.y + r2.h / 2) };
    carveCorridor(map, width, height, c1.x, c1.y, c2.x, c2.y, defaultCorridorWidth);
  }

  // 2. Add Secondary Loop Connections for Multi-path Dungeon Exploration
  for (let i = 0; i < rooms.length; i++) {
    if (Math.random() < 0.45 && rooms.length >= 4) {
      const targetIdx = (i + 2 + Math.floor(Math.random() * (rooms.length - 3))) % rooms.length;
      if (targetIdx !== i && targetIdx !== i + 1) {
        const r1 = rooms[i];
        const r2 = rooms[targetIdx];
        const c1 = { x: Math.floor(r1.x + r1.w / 2), y: Math.floor(r1.y + r1.h / 2) };
        const c2 = { x: Math.floor(r2.x + r2.w / 2), y: Math.floor(r2.y + r2.h / 2) };
        carveCorridor(map, width, height, c1.x, c1.y, c2.x, c2.y, defaultCorridorWidth);
      }
    }
  }
}

export function placeDungeonDoors(map: TileType[][], width: number, height: number, doorRate: number = 0.22): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (map[y][x] === TileType.Floor) {
        const horizontalWall = map[y][x - 1] === TileType.Wall && map[y][x + 1] === TileType.Wall;
        const verticalFloor = map[y - 1][x] === TileType.Floor && map[y + 1][x] === TileType.Floor;

        const verticalWall = map[y - 1][x] === TileType.Wall && map[y + 1][x] === TileType.Wall;
        const horizontalFloor = map[y][x - 1] === TileType.Floor && map[y][x + 1] === TileType.Floor;

        if ((horizontalWall && verticalFloor) || (verticalWall && horizontalFloor)) {
          if (Math.random() < doorRate) {
            map[y][x] = TileType.Door;
          }
        }
      }
    }
  }
}
