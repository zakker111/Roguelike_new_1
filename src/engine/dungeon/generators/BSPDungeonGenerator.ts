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
  DungeonSpawnPoint
} from '../types';
import {
  Random,
  createGrid,
  carveRectangle,
  carveLCorridor,
  getRoomCenter
} from '../dungeonUtils';

interface BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  left?: BSPNode;
  right?: BSPNode;
  room?: DungeonRoomDefinition;
}

/**
 * Binary Space Partitioning (BSP) Dungeon Generator:
 * Recursively divides dungeon space into a binary tree of leaf compartments,
 * carves a room within each leaf, and connects sibling nodes to guarantee 100% connectivity.
 */
export class BSPDungeonGenerator implements IDungeonGenerator {
  readonly id = 'bsp_dungeon';
  readonly name = 'Binary Space Partitioning (BSP)';
  readonly description = 'Subdivides space recursively for structured, architectural room layouts with guaranteed connectivity.';

  generate(config: DungeonGeneratorConfig): DungeonGenerationResult {
    const width = config.width || 48;
    const height = config.height || 36;
    const minLeafSize = (config.minRoomSize ?? 5) + 3;
    const corridorWidth = config.corridorWidth ?? 1;

    const rng = new Random(config.seed);
    const grid = createGrid(width, height, 'wall');
    const rooms: DungeonRoomDefinition[] = [];
    const corridors: DungeonCorridorDefinition[] = [];
    const features: DungeonFeaturePlacement[] = [];
    const spawns: DungeonSpawnPoint[] = [];

    // Root container
    const root: BSPNode = {
      x: 1,
      y: 1,
      width: width - 2,
      height: height - 2
    };

    // 1. Recursive BSP partitioning
    this.splitNode(root, minLeafSize, rng);

    // 2. Carve rooms inside leaf nodes
    this.carveRoomsInLeaves(root, grid, rooms, rng, config);

    // 3. Connect sibling nodes recursively
    this.connectLeaves(root, grid, corridors, corridorWidth, rng);

    if (rooms.length === 0) {
      // Emergency fallback
      carveRectangle(grid, 5, 5, 8, 8, 'floor');
      rooms.push({
        id: 'bsp_room_1',
        x: 5,
        y: 5,
        width: 8,
        height: 8,
        type: 'entrance',
        shape: 'rectangle'
      });
    }

    // Assign roles
    rooms[0].type = 'entrance';
    rooms[rooms.length - 1].type = 'exit';

    const playerSpawn = getRoomCenter(rooms[0]);
    grid[playerSpawn.y][playerSpawn.x] = 'stairs_up';

    const exitCenter = getRoomCenter(rooms[rooms.length - 1]);
    const stairsDown: DungeonPoint = { x: exitCenter.x, y: exitCenter.y };
    grid[stairsDown.y][stairsDown.x] = 'stairs_down';

    // Distribute features
    for (let i = 1; i < rooms.length - 1; i++) {
      const room = rooms[i];
      const center = getRoomCenter(room);
      const roll = rng.nextFloat();

      if (roll < 0.25) {
        room.type = 'treasure';
        features.push({
          id: `chest_bsp_${room.id}`,
          type: 'chest',
          x: center.x,
          y: center.y
        });
      } else if (roll < 0.4) {
        room.type = 'shrine';
        features.push({
          id: `shrine_bsp_${room.id}`,
          type: 'shrine',
          x: center.x,
          y: center.y
        });
      } else {
        room.type = 'encounter';
        spawns.push({
          id: `enemy_bsp_${room.id}`,
          entityType: 'enemy',
          x: center.x,
          y: center.y,
          tier: config.depth ?? 1,
          aiRole: 'hostile'
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
        leafCount: rooms.length,
        depth: config.depth ?? 1
      }
    };
  }

  private splitNode(node: BSPNode, minLeafSize: number, rng: Random): void {
    if (node.width < minLeafSize * 2 && node.height < minLeafSize * 2) {
      return; // Reached leaf size limit
    }

    // Determine split orientation
    let splitHorizontal = rng.chance(0.5);
    if (node.width > node.height && node.width / node.height >= 1.25) {
      splitHorizontal = false;
    } else if (node.height > node.width && node.height / node.width >= 1.25) {
      splitHorizontal = true;
    }

    const max = (splitHorizontal ? node.height : node.width) - minLeafSize;
    if (max <= minLeafSize) {
      return;
    }

    const split = rng.nextInt(minLeafSize, max);

    if (splitHorizontal) {
      node.left = {
        x: node.x,
        y: node.y,
        width: node.width,
        height: split
      };
      node.right = {
        x: node.x,
        y: node.y + split,
        width: node.width,
        height: node.height - split
      };
    } else {
      node.left = {
        x: node.x,
        y: node.y,
        width: split,
        height: node.height
      };
      node.right = {
        x: node.x + split,
        y: node.y,
        width: node.width - split,
        height: node.height
      };
    }

    this.splitNode(node.left, minLeafSize, rng);
    this.splitNode(node.right, minLeafSize, rng);
  }

  private carveRoomsInLeaves(
    node: BSPNode,
    grid: string[][],
    rooms: DungeonRoomDefinition[],
    rng: Random,
    config: DungeonGeneratorConfig
  ): void {
    if (node.left || node.right) {
      if (node.left) this.carveRoomsInLeaves(node.left, grid, rooms, rng, config);
      if (node.right) this.carveRoomsInLeaves(node.right, grid, rooms, rng, config);
      return;
    }

    // Leaf: carve a room inside bounds
    const minW = Math.max(4, (config.minRoomSize ?? 4));
    const minH = Math.max(4, (config.minRoomSize ?? 4));
    const maxW = Math.max(minW, node.width - 2);
    const maxH = Math.max(minH, node.height - 2);

    const roomW = rng.nextInt(minW, maxW);
    const roomH = rng.nextInt(minH, maxH);
    const roomX = node.x + rng.nextInt(1, node.width - roomW - 1);
    const roomY = node.y + rng.nextInt(1, node.height - roomH - 1);

    const room: DungeonRoomDefinition = {
      id: `bsp_room_${rooms.length + 1}`,
      x: roomX,
      y: roomY,
      width: roomW,
      height: roomH,
      type: 'standard',
      shape: 'rectangle'
    };

    carveRectangle(grid, roomX, roomY, roomW, roomH, 'floor');
    node.room = room;
    rooms.push(room);
  }

  private connectLeaves(
    node: BSPNode,
    grid: string[][],
    corridors: DungeonCorridorDefinition[],
    corridorWidth: number,
    rng: Random
  ): DungeonRoomDefinition | undefined {
    if (!node.left && !node.right) {
      return node.room;
    }

    const leftRoom = node.left ? this.connectLeaves(node.left, grid, corridors, corridorWidth, rng) : undefined;
    const rightRoom = node.right ? this.connectLeaves(node.right, grid, corridors, corridorWidth, rng) : undefined;

    if (leftRoom && rightRoom) {
      const p1 = getRoomCenter(leftRoom);
      const p2 = getRoomCenter(rightRoom);
      const points = carveLCorridor(grid, p1, p2, corridorWidth, 'floor', rng.chance(0.5));

      corridors.push({
        fromRoomId: leftRoom.id,
        toRoomId: rightRoom.id,
        points,
        width: corridorWidth
      });
      return rng.chance(0.5) ? leftRoom : rightRoom;
    }

    return leftRoom || rightRoom;
  }
}
