/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IDungeonGenerator,
  DungeonGeneratorConfig,
  DungeonGenerationResult,
  DungeonRoomDefinition,
  DungeonPoint,
  DungeonFeaturePlacement,
  DungeonSpawnPoint
} from '../types';
import { Random, createGrid } from '../dungeonUtils';

/**
 * Cellular Automata Cave Generator:
 * Uses simulation steps (4-5 rule) to simulate natural geological cave formations,
 * floods fills to find the largest contiguous cavern, and prunes isolated dead pockets.
 */
export class CellularAutomataCaveGenerator implements IDungeonGenerator {
  readonly id = 'cellular_cave';
  readonly name = 'Cellular Automata Caves';
  readonly description = 'Generates organic, winding natural caves and subterranean caverns using cellular automata.';

  generate(config: DungeonGeneratorConfig): DungeonGenerationResult {
    const width = config.width || 44;
    const height = config.height || 32;
    const initialWallChance = config.extraParameters?.initialWallChance ?? 0.45;
    const iterations = config.extraParameters?.iterations ?? 4;

    const rng = new Random(config.seed);
    let map = createGrid(width, height, 'wall');

    // 1. Initial random noise
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        map[y][x] = rng.chance(initialWallChance) ? 'wall' : 'floor';
      }
    }

    // 2. Cellular automata simulation iterations (B5678/S45678 standard cave rule)
    for (let iter = 0; iter < iterations; iter++) {
      const nextMap = createGrid(width, height, 'wall');
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const wallCount = this.countSurroundingWalls(map, x, y, width, height);
          if (wallCount >= 5) {
            nextMap[y][x] = 'wall';
          } else {
            nextMap[y][x] = 'floor';
          }
        }
      }
      map = nextMap;
    }

    // 3. Flood fill to find connected floor components
    const regions = this.findFloorRegions(map, width, height);

    // If no regions or small cavern, carve center
    if (regions.length === 0 || regions[0].length < 15) {
      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const fallbackFloor: DungeonPoint[] = [];
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          if (dx * dx + dy * dy <= 16) {
            map[cy + dy][cx + dx] = 'floor';
            fallbackFloor.push({ x: cx + dx, y: cy + dy });
          }
        }
      }
      regions.splice(0, regions.length, fallbackFloor);
    }

    // Keep largest region, seal all other pockets into walls
    const mainRegion = regions[0];
    const mainSet = new Set(mainRegion.map(p => `${p.x},${p.y}`));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === 'floor' && !mainSet.has(`${x},${y}`)) {
          map[y][x] = 'wall';
        }
      }
    }

    // Sort cavern points to find extreme ends for entrance and exit
    const sortedByX = [...mainRegion].sort((a, b) => a.x - b.x);
    const entrance = sortedByX[0];
    const exit = sortedByX[sortedByX.length - 1];

    map[entrance.y][entrance.x] = 'stairs_up';
    map[exit.y][exit.x] = 'stairs_down';

    // Segment main region into semantic cave chambers
    const rooms: DungeonRoomDefinition[] = [
      {
        id: 'cave_entrance',
        x: entrance.x - 2,
        y: entrance.y - 2,
        width: 5,
        height: 5,
        type: 'entrance',
        shape: 'cavern',
        tags: ['entrance']
      },
      {
        id: 'cave_depths',
        x: exit.x - 2,
        y: exit.y - 2,
        width: 5,
        height: 5,
        type: 'exit',
        shape: 'cavern',
        tags: ['boss_lair']
      }
    ];

    const features: DungeonFeaturePlacement[] = [];
    const spawns: DungeonSpawnPoint[] = [];

    // Distribute cave features (mineral ores, mushroom caches, subterranean beast spawns)
    const interiorPoints = mainRegion.filter(p => p !== entrance && p !== exit);
    const shuffled = rng.shuffle(interiorPoints);

    const spawnCount = Math.min(Math.floor(mainRegion.length / 25), 8);
    for (let i = 0; i < spawnCount && i < shuffled.length; i++) {
      const pt = shuffled[i];
      spawns.push({
        id: `cave_beast_${i}`,
        entityType: 'enemy',
        x: pt.x,
        y: pt.y,
        tier: config.depth ?? 1,
        aiRole: 'hostile'
      });
    }

    if (shuffled.length > spawnCount) {
      const chestPt = shuffled[spawnCount];
      features.push({
        id: 'cave_cache_1',
        type: 'chest',
        x: chestPt.x,
        y: chestPt.y,
        properties: { natural_cache: true }
      });
    }

    return {
      width,
      height,
      grid: map,
      rooms,
      corridors: [], // Continuous cavern mesh
      playerSpawn: entrance,
      stairsDown: exit,
      features,
      spawns,
      metadata: {
        generator: this.id,
        cavernTileCount: mainRegion.length,
        depth: config.depth ?? 1
      }
    };
  }

  private countSurroundingWalls(grid: string[][], x: number, y: number, w: number, h: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h || grid[ny][nx] === 'wall') {
          count++;
        }
      }
    }
    return count;
  }

  private findFloorRegions(grid: string[][], w: number, h: number): DungeonPoint[][] {
    const visited = new Set<string>();
    const regions: DungeonPoint[][] = [];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid[y][x] === 'floor' && !visited.has(`${x},${y}`)) {
          const region: DungeonPoint[] = [];
          const queue: DungeonPoint[] = [{ x, y }];
          visited.add(`${x},${y}`);

          while (queue.length > 0) {
            const curr = queue.shift()!;
            region.push(curr);

            const neighbors = [
              { x: curr.x + 1, y: curr.y },
              { x: curr.x - 1, y: curr.y },
              { x: curr.x, y: curr.y + 1 },
              { x: curr.x, y: curr.y - 1 }
            ];

            for (const n of neighbors) {
              if (
                n.x >= 0 &&
                n.x < w &&
                n.y >= 0 &&
                n.y < h &&
                grid[n.y][n.x] === 'floor' &&
                !visited.has(`${n.x},${n.y}`)
              ) {
                visited.add(`${n.x},${n.y}`);
                queue.push(n);
              }
            }
          }

          regions.push(region);
        }
      }
    }

    return regions.sort((a, b) => b.length - a.length);
  }
}
