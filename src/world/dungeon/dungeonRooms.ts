/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType } from '../../types';
import { Room } from './types';

export const ROOM_TYPES: ('standard' | 'circular' | 'pillared' | 'basin' | 'composite')[] = [
  'standard', 'circular', 'pillared', 'basin', 'composite'
];

export function generateDungeonRooms(
  map: TileType[][],
  width: number,
  height: number,
  maxRoomsNum: number = 14,
  minRoomSize: number = 5,
  maxRoomSize: number = 11
): Room[] {
  const rooms: Room[] = [];

  for (let i = 0; i < maxRoomsNum; i++) {
    const rw = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const rh = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const rx = Math.floor(Math.random() * (width - rw - 4)) + 2;
    const ry = Math.floor(Math.random() * (height - rh - 4)) + 2;

    const chosenType = ROOM_TYPES[i % ROOM_TYPES.length];
    const newRoom: Room = { x: rx, y: ry, w: rw, h: rh, type: chosenType };

    // Check overlap with 1-tile margin for clean room definitions
    let overlap = false;
    for (const r of rooms) {
      if (
        newRoom.x < r.x + r.w + 2 &&
        newRoom.x + newRoom.w + 2 > r.x &&
        newRoom.y < r.y + r.h + 2 &&
        newRoom.y + newRoom.h + 2 > r.y
      ) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      rooms.push(newRoom);
      carveRoomOnMap(map, newRoom);
    }
  }

  return rooms;
}

export function carveRoomOnMap(map: TileType[][], room: Room): void {
  const { x: rx, y: ry, w: rw, h: rh, type: chosenType } = room;

  if (chosenType === 'circular') {
    const cx = rx + Math.floor(rw / 2);
    const cy = ry + Math.floor(rh / 2);
    const radius = Math.min(rw, rh) / 2;
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        const distSq = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (distSq <= radius * radius) {
          map[y][x] = TileType.Floor;
        }
      }
    }
  } else if (chosenType === 'composite') {
    // L-shaped or T-shaped room by carving two overlapping rectangles
    const subW1 = Math.floor(rw * 0.7);
    const subH1 = rh;
    const subW2 = rw;
    const subH2 = Math.floor(rh * 0.7);
    for (let y = ry; y < ry + subH1; y++) {
      for (let x = rx; x < rx + subW1; x++) {
        map[y][x] = TileType.Floor;
      }
    }
    for (let y = ry + rh - subH2; y < ry + rh; y++) {
      for (let x = rx; x < rx + subW2; x++) {
        map[y][x] = TileType.Floor;
      }
    }
  } else {
    // Standard, Pillared, or Basin chambers
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        map[y][x] = TileType.Floor;
      }
    }

    // Add internal tactical pillars for 'pillared' archetype
    if (chosenType === 'pillared' && rw >= 7 && rh >= 7) {
      const px1 = rx + 2;
      const px2 = rx + rw - 3;
      const py1 = ry + 2;
      const py2 = ry + rh - 3;

      map[py1][px1] = TileType.Wall;
      map[py1][px2] = TileType.Wall;
      map[py2][px1] = TileType.Wall;
      map[py2][px2] = TileType.Wall;
    }

    // Add central water/lava basin for 'basin' archetype
    if (chosenType === 'basin' && rw >= 6 && rh >= 6) {
      const cx = rx + Math.floor(rw / 2);
      const cy = ry + Math.floor(rh / 2);
      for (let by = cy - 1; by <= cy; by++) {
        for (let bx = cx - 1; bx <= cx; bx++) {
          map[by][bx] = TileType.Water;
        }
      }
    }
  }
}

export function carveUnderworldLavaPools(map: TileType[][], rooms: Room[], depth: number, stairsX: number, stairsY: number, playerX: number, playerY: number): void {
  if (depth < 6) return;

  rooms.forEach((room) => {
    if (Math.random() < 0.45) {
      const lavaW = Math.floor(Math.random() * 2) + 2;
      const lavaH = Math.floor(Math.random() * 2) + 1;
      const lx = room.x + Math.floor(Math.random() * (room.w - lavaW - 1)) + 1;
      const ly = room.y + Math.floor(Math.random() * (room.h - lavaH - 1)) + 1;
      for (let y = ly; y < ly + lavaH; y++) {
        for (let x = lx; x < lx + lavaW; x++) {
          if (map[y] && map[y][x] === TileType.Floor && !(x === playerX && y === playerY) && !(x === stairsX && y === stairsY)) {
            map[y][x] = TileType.Water; // In underworld, Water is styled/treated as Lava!
          }
        }
      }
    }
  });
}
