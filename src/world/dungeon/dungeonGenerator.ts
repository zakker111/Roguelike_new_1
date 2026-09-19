/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, Trap, Chest, Enemy } from '../../types';
import { GeneratedDungeonLevel, Room } from './types';
import { generateDungeonRooms, carveUnderworldLavaPools, spawnSubterraneanOreVeins } from './dungeonRooms';
import { connectDungeonRooms, placeDungeonDoors } from './dungeonCorridors';
import { spawnDungeonTraps, spawnDungeonChests } from './dungeonTrapsAndChests';
import {
  calculateGlobalThreatFactor,
  spawnDungeonBoss,
  spawnDungeonStandardEnemies,
  spawnDungeonCaptivesAndJailers
} from './dungeonEntities';

export function generateLevel(
  width: number,
  height: number,
  depth: number,
  turnsPlayed: number,
  realTimeSeconds: number,
  playerStats?: { level: number; str: number; dex: number; int: number; cha: number; lck: number },
  currentWeapon?: { damage: number; name?: string } | null,
  defeatedEnemiesCount?: { [key: string]: number },
  clearedCampsCount?: number,
  chaosScore?: number
): GeneratedDungeonLevel {
  const map: TileType[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(TileType.Wall));

  // 1. Generate Rooms
  const rooms: Room[] = generateDungeonRooms(map, width, height);

  // 2. Connect Rooms with Wide Corridors & Loops
  connectDungeonRooms(map, width, height, rooms, 2);

  // 3. Place Entrance Threshold Doors
  placeDungeonDoors(map, width, height, 0.22);

  // 4. Place Player in First Room
  let playerX = Math.floor(rooms[0].x + rooms[0].w / 2);
  let playerY = Math.floor(rooms[0].y + rooms[0].h / 2);
  if (map[playerY][playerX] !== TileType.Floor) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tx = playerX + dx;
        const ty = playerY + dy;
        if (map[ty] && map[ty][tx] === TileType.Floor) {
          playerX = tx;
          playerY = ty;
          break;
        }
      }
    }
  }
  map[playerY][playerX] = TileType.StairsUp;

  // 5. Place Stairs Down in Last Room
  const lastRoom = rooms[rooms.length - 1];
  let stairsX = Math.floor(lastRoom.x + lastRoom.w / 2);
  let stairsY = Math.floor(lastRoom.y + lastRoom.h / 2);
  if (map[stairsY][stairsX] !== TileType.Floor || (stairsX === playerX && stairsY === playerY)) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tx = stairsX + dx;
        const ty = stairsY + dy;
        if (map[ty] && map[ty][tx] === TileType.Floor && !(tx === playerX && ty === playerY)) {
          stairsX = tx;
          stairsY = ty;
          break;
        }
      }
    }
  }
  map[stairsY][stairsX] = TileType.StairsDown;

  // 6. Place Torches and Cozy Fireplaces
  rooms.forEach((room, index) => {
    if ((index === 1 || index === 3 || index === 5) && index < rooms.length - 1) {
      const fx = Math.floor(room.x + room.w / 2);
      const fy = Math.floor(room.y + room.h / 2);
      if (map[fy] && map[fy][fx] === TileType.Floor && !(fx === playerX && fy === playerY) && !(fx === stairsX && fy === stairsY)) {
        map[fy][fx] = TileType.Fireplace;
      }
    }
    const corners = [
      { x: room.x, y: room.y },
      { x: room.x + room.w - 1, y: room.y },
      { x: room.x, y: room.y + room.h - 1 },
      { x: room.x + room.w - 1, y: room.y + room.h - 1 }
    ];
    corners.forEach((pt) => {
      if (map[pt.y] && map[pt.y][pt.x] === TileType.Floor && !(pt.x === playerX && pt.y === playerY) && !(pt.x === stairsX && pt.y === stairsY)) {
        map[pt.y][pt.x] = TileType.Torch;
      }
    });
  });

  // 7. Underworld Lava Pools (depth >= 6)
  carveUnderworldLavaPools(map, rooms, depth, stairsX, stairsY, playerX, playerY);

  // 7b. Subterranean Mineral Veins (Copper & Iron embedded in cave/dungeon walls)
  spawnSubterraneanOreVeins(map, rooms, depth, stairsX, stairsY, playerX, playerY);

  // 8. Spawn Traps
  const traps: Trap[] = spawnDungeonTraps(map, width, height, depth, playerX, playerY, stairsX, stairsY, 0.08);

  // 9. Spawn Chests
  const chests: Chest[] = spawnDungeonChests(rooms, depth, stairsX, stairsY);

  // 10. Threat Calculation and Enemy Spawning
  const globalThreatFactor = calculateGlobalThreatFactor(
    depth,
    turnsPlayed,
    realTimeSeconds,
    playerStats,
    currentWeapon,
    defeatedEnemiesCount,
    clearedCampsCount
  );

  let enemies: Enemy[] = [];

  // Boss
  const boss = spawnDungeonBoss(
    rooms,
    depth,
    width,
    height,
    stairsX,
    stairsY,
    globalThreatFactor,
    chaosScore || 0,
    playerStats
  );
  if (boss) {
    enemies.push(boss);
  }

  // Standard Enemies
  enemies = spawnDungeonStandardEnemies(
    rooms,
    depth,
    stairsX,
    stairsY,
    chests,
    enemies,
    globalThreatFactor,
    chaosScore || 0,
    playerStats
  );

  // Captives and Jailers
  spawnDungeonCaptivesAndJailers(
    map,
    rooms,
    depth,
    playerX,
    playerY,
    stairsX,
    stairsY,
    chests,
    enemies
  );

  return {
    map,
    playerX,
    playerY,
    traps,
    chests,
    enemies,
  };
}
