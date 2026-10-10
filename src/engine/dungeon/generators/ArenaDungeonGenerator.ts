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
import {
  Random,
  createGrid,
  carveRectangle,
  carveCircle
} from '../dungeonUtils';

/**
 * Boss Arena / Trial Colosseum Generator:
 * Generates grand combat arenas with central battle grounds, protective peripheral pillars,
 * spectator terraces, hazards, and ceremonial shrines.
 */
export class ArenaDungeonGenerator implements IDungeonGenerator {
  readonly id = 'arena_colosseum';
  readonly name = 'Boss Arena & Trial Colosseum';
  readonly description = 'Spawns grand, open battlefields, circular ritual pits, and columned trial arenas.';

  generate(config: DungeonGeneratorConfig): DungeonGenerationResult {
    const width = config.width || 36;
    const height = config.height || 36;
    const rng = new Random(config.seed);
    const grid = createGrid(width, height, 'wall');

    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const radius = Math.min(Math.floor(width / 2) - 4, Math.floor(height / 2) - 4);

    const isCircular = config.extraParameters?.circular !== false;

    // 1. Carve central arena
    if (isCircular) {
      carveCircle(grid, cx, cy, radius, radius, 'floor');
    } else {
      carveRectangle(grid, cx - radius, cy - radius, radius * 2, radius * 2, 'floor');
    }

    const features: DungeonFeaturePlacement[] = [];
    const spawns: DungeonSpawnPoint[] = [];

    // 2. Place ceremonial pillars or braziers in concentric formation
    const pillarDist = Math.floor(radius * 0.65);
    const pillarAngles = [0, 45, 90, 135, 180, 225, 270, 315];

    pillarAngles.forEach((angle, idx) => {
      const rad = (angle * Math.PI) / 180;
      const px = Math.round(cx + Math.cos(rad) * pillarDist);
      const py = Math.round(cy + Math.sin(rad) * pillarDist);

      if (py >= 0 && py < height && px >= 0 && px < width && grid[py][px] === 'floor') {
        grid[py][px] = 'pillar';
        features.push({
          id: `arena_pillar_${idx}`,
          type: 'pillar',
          x: px,
          y: py
        });
      }
    });

    // 3. Player entrance gate at bottom perimeter
    const playerSpawn: DungeonPoint = {
      x: cx,
      y: cy + radius - 2
    };
    grid[playerSpawn.y][playerSpawn.x] = 'stairs_up';

    // 4. Boss spawn at arena center or north
    const bossPoint: DungeonPoint = {
      x: cx,
      y: cy - Math.floor(radius * 0.4)
    };
    spawns.push({
      id: 'arena_boss',
      entityType: 'boss',
      x: bossPoint.x,
      y: bossPoint.y,
      tier: (config.depth ?? 1) + 3,
      aiRole: 'boss'
    });

    // 5. Elite guardian adds
    const minionOffset = Math.floor(radius * 0.4);
    spawns.push({
      id: 'arena_guard_left',
      entityType: 'enemy',
      x: cx - minionOffset,
      y: bossPoint.y,
      tier: config.depth ?? 1,
      aiRole: 'hostile'
    });
    spawns.push({
      id: 'arena_guard_right',
      entityType: 'enemy',
      x: cx + minionOffset,
      y: bossPoint.y,
      tier: config.depth ?? 1,
      aiRole: 'hostile'
    });

    // 6. Victory rewards / Stairs down unlocked behind boss
    const exitPoint: DungeonPoint = {
      x: cx,
      y: cy - radius + 2
    };
    grid[exitPoint.y][exitPoint.x] = 'stairs_down';

    features.push({
      id: 'arena_boss_chest',
      type: 'chest',
      x: cx,
      y: cy - radius + 3,
      properties: { tier: 5, locked: true }
    });

    const room: DungeonRoomDefinition = {
      id: 'grand_arena',
      x: cx - radius,
      y: cy - radius,
      width: radius * 2,
      height: radius * 2,
      type: 'boss',
      shape: isCircular ? 'circular' : 'rectangle',
      tags: ['arena', 'colosseum', 'boss']
    };

    return {
      width,
      height,
      grid,
      rooms: [room],
      corridors: [],
      playerSpawn,
      stairsDown: exitPoint,
      features,
      spawns,
      metadata: {
        generator: this.id,
        arenaRadius: radius,
        depth: config.depth ?? 1
      }
    };
  }
}
