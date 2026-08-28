/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { TileType, EnemyType } from '../types';
import {
  generateLevel,
  generateDungeonRooms,
  carveCorridor,
  connectDungeonRooms,
  placeDungeonDoors,
  spawnDungeonTraps,
  spawnDungeonChests,
  calculateGlobalThreatFactor,
  spawnDungeonBoss,
  spawnDungeonStandardEnemies,
  spawnDungeonCaptivesAndJailers,
  generateDungeonProps,
  BOSS_TEMPLATES,
  getEnemyTemplate,
} from '../world/dungeon';
import {
  generateTownChunk,
  buildCastlePerimeterAndGates,
  buildPortHarborFeatures,
  spawnTownGuards,
  spawnTownOutskirtPests,
} from '../world/town';
import { OverworldGenContext } from '../utils/overworld/types';

describe('Modular Dungeon Generation Engine', () => {
  it('generates a valid dungeon level with player spawn, exit stairs, rooms, and corridors', () => {
    const width = 64;
    const height = 40;
    const depth = 3;
    const turnsPlayed = 50;
    const realTimeSeconds = 600;

    const level = generateLevel(width, height, depth, turnsPlayed, realTimeSeconds);

    expect(level).toBeDefined();
    expect(level.map.length).toBe(height);
    expect(level.map[0].length).toBe(width);
    expect(level.playerX).toBeGreaterThanOrEqual(0);
    expect(level.playerX).toBeLessThan(width);
    expect(level.playerY).toBeGreaterThanOrEqual(0);
    expect(level.playerY).toBeLessThan(height);
    expect(level.map[level.playerY][level.playerX]).toBe(TileType.StairsUp);

    // Verify stairs down exists
    let hasStairsDown = false;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (level.map[y][x] === TileType.StairsDown) {
          hasStairsDown = true;
          break;
        }
      }
    }
    expect(hasStairsDown).toBe(true);

    // Verify traps and chests
    expect(Array.isArray(level.traps)).toBe(true);
    expect(Array.isArray(level.chests)).toBe(true);
    expect(Array.isArray(level.enemies)).toBe(true);
  });

  it('correctly carves diverse room archetypes and connects with multi-tile corridors', () => {
    const width = 64;
    const height = 40;
    const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Wall));

    const rooms = generateDungeonRooms(map, width, height, 10, 6, 10);
    expect(rooms.length).toBeGreaterThan(0);

    connectDungeonRooms(map, width, height, rooms, 2);
    placeDungeonDoors(map, width, height, 0.5);

    // Floor tiles should be carved
    let floorCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === TileType.Floor || map[y][x] === TileType.Door) {
          floorCount++;
        }
      }
    }
    expect(floorCount).toBeGreaterThan(50);
  });

  it('evaluates boss templates and threat factor calculation properly', () => {
    expect(BOSS_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    const ratTemplate = getEnemyTemplate(EnemyType.Rat);
    expect(ratTemplate.name).toBeDefined();

    const lowThreat = calculateGlobalThreatFactor(1, 0, 0);
    const highThreat = calculateGlobalThreatFactor(8, 500, 3600, { level: 10, str: 20, dex: 20, int: 20, cha: 15, lck: 15 });
    expect(highThreat).toBeGreaterThan(lowThreat);
  });

  it('generates double-edged interactive dungeon props and shrines', () => {
    const width = 40;
    const height = 30;
    const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Floor));

    const props = generateDungeonProps(map, 2);
    expect(props.length).toBeGreaterThan(0);
    const shrines = props.filter(p => p.type === 'shrine');
    expect(shrines.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Modular Town Generation Engine', () => {
  it('generates a comprehensive town chunk with road intersections and structures', () => {
    const width = 64;
    const height = 40;
    const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Grass));

    const ctx: OverworldGenContext = {
      chunkX: 0,
      chunkY: 0,
      width,
      height,
      map,
      npcs: [],
      enemies: [],
      traps: [],
      chests: [],
      dungeons: [],
      towns: [],
      poisList: [],
      biome: 'plains' as any,
      weather: 'clear' as any,
      hasTown: true,
      townName: 'Oakhaven Village',
      isPortTown: false,
      isCastleTown: false,
      spawnedCats: [],
      spawnedSeppo: false,
      secondFloorMap: [],
      secondFloorDiscovered: [],
      secondFloorVisible: [],
      props: []
    };

    generateTownChunk(ctx);

    expect(ctx.towns.length).toBe(1);
    expect(ctx.towns[0].name).toBe('Oakhaven Village');
    expect(ctx.npcs.length).toBeGreaterThanOrEqual(4);
    expect(ctx.enemies.length).toBeGreaterThanOrEqual(3);
    expect(ctx.props).toBeDefined();
  });

  it('generates castle town perimeters and harbor port features', () => {
    const width = 64;
    const height = 40;
    const castleMap: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Grass));
    buildCastlePerimeterAndGates(castleMap, width, height, 32, 20);

    expect(castleMap[1][2]).toBe(TileType.Wall);

    const portMap: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Grass));
    buildPortHarborFeatures(portMap, width, height, 32, 20);

    expect(portMap[2][width - 2]).toBe(TileType.Water);
  });
});
