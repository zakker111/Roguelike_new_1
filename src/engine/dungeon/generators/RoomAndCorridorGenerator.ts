/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IDungeonGenerator,
  DungeonGeneratorConfig,
  DungeonGenerationResult,
  DungeonRoomDefinition,
  DungeonCorridorDefinition,
  DungeonPoint,
  DungeonFeaturePlacement,
  DungeonSpawnPoint,
  DungeonRoomType
} from '../types';
import {
  Random,
  createGrid,
  roomsOverlap,
  carveRectangle,
  carveCircle,
  carveLCorridor,
  getRoomCenter
} from '../dungeonUtils';

/**
 * Standard Room & Corridor Dungeon Generator:
 * Places non-overlapping rooms of varying archetypes (rectangle, circular, pillared)
 * and interconnects them with corridors.
 * Assigns room roles (entrance, exit/boss, encounter, treasure, shop, shrine).
 */
export class RoomAndCorridorGenerator implements IDungeonGenerator {
  readonly id = 'rooms_and_corridors';
  readonly name = 'Classic Rooms & Corridors';
  readonly description = 'Generates traditional roguelike dungeons with distinct rectangular/circular rooms connected by corridors.';

  generate(config: DungeonGeneratorConfig): DungeonGenerationResult {
    const width = config.width || 40;
    const height = config.height || 30;
    const minRooms = config.minRooms ?? 6;
    const maxRooms = config.maxRooms ?? 12;
    const minSize = config.minRoomSize ?? 4;
    const maxSize = config.maxRoomSize ?? 9;
    const padding = config.roomPadding ?? 2;
    const corridorWidth = config.corridorWidth ?? 1;

    const rng = new Random(config.seed);
    const grid = createGrid(width, height, 'wall');
    const rooms: DungeonRoomDefinition[] = [];
    const corridors: DungeonCorridorDefinition[] = [];
    const features: DungeonFeaturePlacement[] = [];
    const spawns: DungeonSpawnPoint[] = [];

    const targetRoomCount = rng.nextInt(minRooms, maxRooms);
    const maxAttempts = targetRoomCount * 15;

    for (let attempt = 0; attempt < maxAttempts && rooms.length < targetRoomCount; attempt++) {
      const roomWidth = rng.nextInt(minSize, maxSize);
      const roomHeight = rng.nextInt(minSize, maxSize);
      const roomX = rng.nextInt(1, width - roomWidth - 2);
      const roomY = rng.nextInt(1, height - roomHeight - 2);

      const candidate = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight
      };

      const overlaps = rooms.some(r => roomsOverlap(candidate, r, padding));
      if (!overlaps) {
        // Determine room shape
        const shapeRoll = rng.nextFloat();
        let shape: 'rectangle' | 'circular' | 'pillared' = 'rectangle';
        if (shapeRoll < 0.25 && roomWidth >= 5 && roomHeight >= 5) {
          shape = 'circular';
        } else if (shapeRoll < 0.45 && roomWidth >= 6 && roomHeight >= 6) {
          shape = 'pillared';
        }

        const roomDef: DungeonRoomDefinition = {
          id: `room_${rooms.length + 1}`,
          x: roomX,
          y: roomY,
          width: roomWidth,
          height: roomHeight,
          type: 'standard',
          shape,
          tags: []
        };

        // Carve shape into grid
        if (shape === 'circular') {
          carveCircle(grid, roomX + roomWidth / 2, roomY + roomHeight / 2, roomWidth / 2, roomHeight / 2, 'floor');
        } else {
          carveRectangle(grid, roomX, roomY, roomWidth, roomHeight, 'floor');
          if (shape === 'pillared') {
            // Place pillars inside
            for (let py = roomY + 2; py < roomY + roomHeight - 2; py += 2) {
              for (let px = roomX + 2; px < roomX + roomWidth - 2; px += 2) {
                grid[py][px] = 'pillar';
                features.push({
                  id: `pillar_${px}_${py}`,
                  type: 'pillar',
                  x: px,
                  y: py
                });
              }
            }
          }
        }

        rooms.push(roomDef);
      }
    }

    if (rooms.length === 0) {
      // Fallback: create single central room
      const cx = Math.floor(width / 2) - 3;
      const cy = Math.floor(height / 2) - 3;
      carveRectangle(grid, cx, cy, 6, 6, 'floor');
      rooms.push({
        id: 'room_fallback',
        x: cx,
        y: cy,
        width: 6,
        height: 6,
        type: 'entrance',
        shape: 'rectangle'
      });
    }

    // Connect rooms with corridors (sequential MST-like loop)
    for (let i = 0; i < rooms.length - 1; i++) {
      const centerA = getRoomCenter(rooms[i]);
      const centerB = getRoomCenter(rooms[i + 1]);
      const hFirst = rng.chance(0.5);
      const points = carveLCorridor(grid, centerA, centerB, corridorWidth, 'floor', hFirst);

      corridors.push({
        fromRoomId: rooms[i].id,
        toRoomId: rooms[i + 1].id,
        points,
        width: corridorWidth
      });
    }

    // Optional loop connection if 4 or more rooms
    if (rooms.length >= 4) {
      const centerLast = getRoomCenter(rooms[rooms.length - 1]);
      const centerFirst = getRoomCenter(rooms[0]);
      const loopPoints = carveLCorridor(grid, centerLast, centerFirst, corridorWidth, 'floor', false);
      corridors.push({
        fromRoomId: rooms[rooms.length - 1].id,
        toRoomId: rooms[0].id,
        points: loopPoints,
        width: corridorWidth
      });
    }

    // Assign semantic room types
    // First room is always entrance
    rooms[0].type = 'entrance';
    rooms[0].tags?.push('safe');

    // Last room is exit / boss
    if (rooms.length > 1) {
      rooms[rooms.length - 1].type = 'exit';
      rooms[rooms.length - 1].tags?.push('objective');
    }

    // Intermediate rooms assignments
    const treasureChance = config.treasureRoomChance ?? 0.2;
    const shopChance = config.shopRoomChance ?? 0.15;
    const shrineChance = config.shrineRoomChance ?? 0.15;

    for (let i = 1; i < rooms.length - 1; i++) {
      const roll = rng.nextFloat();
      if (roll < treasureChance) {
        rooms[i].type = 'treasure';
        rooms[i].tags?.push('loot');
      } else if (roll < treasureChance + shopChance) {
        rooms[i].type = 'shop';
        rooms[i].tags?.push('peaceful', 'trading');
      } else if (roll < treasureChance + shopChance + shrineChance) {
        rooms[i].type = 'shrine';
        rooms[i].tags?.push('divine');
      } else {
        rooms[i].type = 'encounter';
        rooms[i].tags?.push('combat');
      }
    }

    // Place player spawn in entrance room
    const entranceCenter = getRoomCenter(rooms[0]);
    const playerSpawn: DungeonPoint = { x: entranceCenter.x, y: entranceCenter.y };
    grid[playerSpawn.y][playerSpawn.x] = 'stairs_up';

    // Place exit in last room
    const exitRoom = rooms[rooms.length - 1];
    const exitCenter = getRoomCenter(exitRoom);
    const stairsDown: DungeonPoint = { x: exitCenter.x, y: exitCenter.y };
    grid[stairsDown.y][stairsDown.x] = 'stairs_down';

    // Populate features and spawns based on room types
    for (const room of rooms) {
      const center = getRoomCenter(room);

      if (room.type === 'treasure') {
        features.push({
          id: `chest_${room.id}`,
          type: 'chest',
          x: center.x,
          y: center.y,
          properties: { tier: (config.depth ?? 1) + 1 }
        });
      } else if (room.type === 'shrine') {
        features.push({
          id: `shrine_${room.id}`,
          type: 'shrine',
          x: center.x,
          y: center.y,
          properties: { deity: 'ancients' }
        });
      } else if (room.type === 'shop') {
        spawns.push({
          id: `merchant_${room.id}`,
          entityType: 'merchant',
          x: center.x,
          y: center.y,
          aiRole: 'merchant'
        });
        features.push({
          id: `shop_stall_${room.id}`,
          type: 'shop_stall',
          x: center.x + 1,
          y: center.y
        });
      } else if (room.type === 'encounter') {
        // Spawn 1-3 enemies in encounter rooms
        const enemyCount = rng.nextInt(1, 3);
        for (let e = 0; e < enemyCount; e++) {
          const ex = rng.nextInt(room.x + 1, room.x + room.width - 2);
          const ey = rng.nextInt(room.y + 1, room.y + room.height - 2);
          if (grid[ey] && grid[ey][ex] === 'floor') {
            spawns.push({
              id: `enemy_${room.id}_${e}`,
              entityType: 'enemy',
              x: ex,
              y: ey,
              tier: config.depth ?? 1,
              aiRole: 'hostile'
            });
          }
        }
      } else if (room.type === 'exit') {
        // If depth >= 3 or boss tagged, spawn a boss or elite guardian
        spawns.push({
          id: `boss_${room.id}`,
          entityType: 'boss',
          x: center.x + 1,
          y: center.y,
          tier: (config.depth ?? 1) + 2,
          aiRole: 'boss'
        });
      }
    }

    return {
      width,
      height,
      grid,
      rooms,
      corridors,
      playerSpawn,
      stairsDown,
      features,
      spawns,
      metadata: {
        generator: this.id,
        roomCount: rooms.length,
        depth: config.depth ?? 1
      }
    };
  }
}
