/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DungeonGeneratorRegistry,
  DungeonManager,
  RoomAndCorridorGenerator,
  BSPDungeonGenerator,
  CellularAutomataCaveGenerator,
  ArenaDungeonGenerator,
  Random,
  carveRectangle,
  carveCircle,
  carveLCorridor,
  createGrid,
  roomsOverlap,
  IDungeonGenerator,
  DungeonGeneratorConfig,
  DungeonGenerationResult
} from '../../engine/dungeon';

describe('Dungeon System: Utilities & PRNG', () => {
  it('Random generates predictable sequences with fixed seed', () => {
    const rng1 = new Random(12345);
    const seq1 = [rng1.nextInt(1, 100), rng1.nextInt(1, 100), rng1.nextInt(1, 100)];

    const rng2 = new Random(12345);
    const seq2 = [rng2.nextInt(1, 100), rng2.nextInt(1, 100), rng2.nextInt(1, 100)];

    expect(seq1).toEqual(seq2);
  });

  it('createGrid initializes a 2D array of desired size and tile', () => {
    const grid = createGrid(10, 8, 'wall');
    expect(grid.length).toBe(8);
    expect(grid[0].length).toBe(10);
    expect(grid[0][0]).toBe('wall');
    expect(grid[7][9]).toBe('wall');
  });

  it('roomsOverlap detects intersections and disjoint boxes correctly', () => {
    const r1 = { x: 5, y: 5, width: 4, height: 4 };
    const r2 = { x: 7, y: 7, width: 4, height: 4 }; // overlaps
    const r3 = { x: 20, y: 20, width: 4, height: 4 }; // far away

    expect(roomsOverlap(r1, r2, 1)).toBe(true);
    expect(roomsOverlap(r1, r3, 1)).toBe(false);
  });

  it('carveRectangle sets floor tiles correctly', () => {
    const grid = createGrid(10, 10, 'wall');
    carveRectangle(grid, 2, 3, 4, 3, 'floor');

    expect(grid[3][2]).toBe('floor');
    expect(grid[5][5]).toBe('floor');
    expect(grid[2][2]).toBe('wall'); // Above
    expect(grid[6][2]).toBe('wall'); // Below
  });

  it('carveCircle carves circular region', () => {
    const grid = createGrid(15, 15, 'wall');
    carveCircle(grid, 7, 7, 4, 4, 'floor');

    expect(grid[7][7]).toBe('floor'); // Center
    expect(grid[0][0]).toBe('wall'); // Corner
  });

  it('carveLCorridor connects two points with floor path', () => {
    const grid = createGrid(20, 20, 'wall');
    const path = carveLCorridor(grid, { x: 2, y: 2 }, { x: 10, y: 8 }, 1, 'floor');

    expect(path.length).toBeGreaterThan(0);
    expect(grid[2][2]).toBe('floor');
    expect(grid[8][10]).toBe('floor');
  });
});

describe('RoomAndCorridorGenerator', () => {
  it('generates a playable dungeon layout with entrance and exit', () => {
    const gen = new RoomAndCorridorGenerator();
    const result = gen.generate({
      id: 'rooms_and_corridors',
      name: 'Test Rooms',
      width: 40,
      height: 30,
      seed: 42,
      minRooms: 5,
      maxRooms: 8
    });

    expect(result.width).toBe(40);
    expect(result.height).toBe(30);
    expect(result.rooms.length).toBeGreaterThanOrEqual(4);
    expect(result.corridors.length).toBeGreaterThan(0);

    // Player spawn & exit checks
    expect(result.playerSpawn).toBeDefined();
    expect(result.stairsDown).toBeDefined();
    expect(result.grid[result.playerSpawn.y][result.playerSpawn.x]).toBe('stairs_up');
    expect(result.grid[result.stairsDown!.y][result.stairsDown!.x]).toBe('stairs_down');

    // First room is entrance, last is exit
    expect(result.rooms[0].type).toBe('entrance');
    expect(result.rooms[result.rooms.length - 1].type).toBe('exit');
  });

  it('assigns diverse room types (encounter, treasure, shop, shrine)', () => {
    const gen = new RoomAndCorridorGenerator();
    const result = gen.generate({
      id: 'rooms_and_corridors',
      name: 'Diverse Rooms',
      width: 60,
      height: 40,
      seed: 999,
      minRooms: 10,
      maxRooms: 12,
      treasureRoomChance: 0.3,
      shopRoomChance: 0.2,
      shrineRoomChance: 0.2
    });

    const roomTypes = new Set(result.rooms.map(r => r.type));
    expect(roomTypes.has('entrance')).toBe(true);
    expect(roomTypes.has('exit')).toBe(true);
    expect(roomTypes.size).toBeGreaterThanOrEqual(3);
  });
});

describe('BSPDungeonGenerator', () => {
  it('generates guaranteed recursive room divisions and connections', () => {
    const gen = new BSPDungeonGenerator();
    const result = gen.generate({
      id: 'bsp_dungeon',
      name: 'BSP Test',
      width: 48,
      height: 36,
      seed: 101,
      minRoomSize: 5
    });

    expect(result.rooms.length).toBeGreaterThanOrEqual(4);
    expect(result.corridors.length).toBeGreaterThan(0);

    expect(result.playerSpawn).toBeDefined();
    expect(result.stairsDown).toBeDefined();
    expect(result.grid[result.playerSpawn.y][result.playerSpawn.x]).toBe('stairs_up');
    expect(result.grid[result.stairsDown!.y][result.stairsDown!.x]).toBe('stairs_down');
  });
});

describe('CellularAutomataCaveGenerator', () => {
  it('produces an organic cavern mesh with valid entrance and exit', () => {
    const gen = new CellularAutomataCaveGenerator();
    const result = gen.generate({
      id: 'cellular_cave',
      name: 'Cave Test',
      width: 40,
      height: 30,
      seed: 555
    });

    expect(result.grid.length).toBe(30);
    expect(result.grid[0].length).toBe(40);
    expect(result.metadata?.cavernTileCount).toBeGreaterThan(50);

    expect(result.playerSpawn).toBeDefined();
    expect(result.stairsDown).toBeDefined();
    expect(result.grid[result.playerSpawn.y][result.playerSpawn.x]).toBe('stairs_up');
    expect(result.grid[result.stairsDown!.y][result.stairsDown!.x]).toBe('stairs_down');
  });
});

describe('ArenaDungeonGenerator', () => {
  it('generates a boss colosseum with central boss and pillars', () => {
    const gen = new ArenaDungeonGenerator();
    const result = gen.generate({
      id: 'arena_colosseum',
      name: 'Colosseum Test',
      width: 36,
      height: 36,
      seed: 777,
      depth: 5
    });

    expect(result.rooms.length).toBe(1);
    expect(result.rooms[0].type).toBe('boss');
    expect(result.features.some(f => f.type === 'pillar')).toBe(true);
    expect(result.features.some(f => f.type === 'chest')).toBe(true);

    const bossSpawn = result.spawns.find(s => s.entityType === 'boss');
    expect(bossSpawn).toBeDefined();
    expect(bossSpawn?.aiRole).toBe('boss');

    expect(result.grid[result.playerSpawn.y][result.playerSpawn.x]).toBe('stairs_up');
    expect(result.grid[result.stairsDown!.y][result.stairsDown!.x]).toBe('stairs_down');
  });
});

describe('DungeonGeneratorRegistry & DungeonManager', () => {
  beforeEach(() => {
    DungeonGeneratorRegistry.getInstance().reset();
  });

  it('registers all 4 default dungeon generators', () => {
    const registry = DungeonGeneratorRegistry.getInstance();
    const ids = registry.getIds();

    expect(ids).toContain('rooms_and_corridors');
    expect(ids).toContain('bsp_dungeon');
    expect(ids).toContain('cellular_cave');
    expect(ids).toContain('arena_colosseum');
  });

  it('allows registering a custom dungeon generator', () => {
    const registry = DungeonGeneratorRegistry.getInstance();

    const customGen: IDungeonGenerator = {
      id: 'custom_crossroads',
      name: 'Custom Crossroads',
      description: 'Test custom generator',
      generate: (cfg: DungeonGeneratorConfig): DungeonGenerationResult => {
        const grid = createGrid(cfg.width, cfg.height, 'floor');
        return {
          width: cfg.width,
          height: cfg.height,
          grid,
          rooms: [],
          corridors: [],
          playerSpawn: { x: 5, y: 5 },
          features: [],
          spawns: []
        };
      }
    };

    registry.register(customGen);
    expect(registry.has('custom_crossroads')).toBe(true);

    const retrieved = registry.get('custom_crossroads');
    expect(retrieved?.name).toBe('Custom Crossroads');
  });

  it('DungeonManager generates using requested algorithm or fallback', () => {
    const manager = DungeonManager.getInstance();

    const caveResult = manager.generateDungeon({
      id: 'cellular_cave',
      name: 'Cave Level',
      width: 32,
      height: 32,
      seed: 123
    });
    expect(caveResult.metadata?.generator).toBe('cellular_cave');

    // Test unknown generator fallback to rooms_and_corridors
    const fallbackResult = manager.generateDungeon({
      id: 'non_existent_generator',
      name: 'Fallback Level',
      width: 35,
      height: 35,
      seed: 456
    });
    expect(fallbackResult.metadata?.generator).toBe('rooms_and_corridors');
  });
});
