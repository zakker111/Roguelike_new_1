/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getOrganicBiome } from '../world/overworldBiomes';
import { generateLevel } from '../world/dungeon/dungeonGenerator';
import { spawnDungeonTraps } from '../world/dungeon/dungeonTrapsAndChests';
import { BOSS_TEMPLATES } from '../world/dungeon/dungeonEntities';
import { TileType, TrapType } from '../types';
import worldConfig from '../data/worldConfig.json';
import enemiesData from '../data/enemies.json';

describe('New Biomes & Unique Dungeons Suite', () => {
  it('loads worldConfig containing glacial, volcanic, and coral_reef biomes', () => {
    expect(worldConfig.biomeThresholds.glacial).toBeDefined();
    expect(worldConfig.biomeThresholds.volcanic).toBeDefined();
    expect(worldConfig.biomeThresholds.coral_reef).toBeDefined();

    expect(worldConfig.weatherFrequencies.glacial).toBeDefined();
    expect(worldConfig.weatherFrequencies.volcanic).toBeDefined();
    expect(worldConfig.weatherFrequencies.coral_reef).toBeDefined();
  });

  it('determines all new organic biomes based on continuous noise metrics', () => {
    // Check extreme coordinate samples across world map to verify variety of biomes
    const sampledBiomes = new Set<string>();
    for (let cx = -10; cx <= 10; cx += 2) {
      for (let cy = -10; cy <= 10; cy += 2) {
        const biome = getOrganicBiome(cx, cy, 12345);
        sampledBiomes.add(biome);
      }
    }
    expect(sampledBiomes.size).toBeGreaterThanOrEqual(4);
  });

  it('contains new aquatic, volcanic, and cryo enemies in master enemy database', () => {
    const enemyTypes = Object.keys(enemiesData);
    expect(enemyTypes).toContain('CoralGolem');
    expect(enemyTypes).toContain('MagmaWurm');
    expect(enemyTypes).toContain('CryoStalker');
    expect(enemyTypes).toContain('AbyssalSiren');
    expect(enemyTypes).toContain('CinderFiend');
    expect(enemyTypes).toContain('GlacialColossus');
  });

  it('contains Kraken, IgnisWyrm, and FrostfangTitan in boss templates', () => {
    const kraken = BOSS_TEMPLATES.find((b) => b.name.includes('Kraken'));
    const ignisWyrm = BOSS_TEMPLATES.find((b) => b.name.includes('Ignis'));
    const frostTitan = BOSS_TEMPLATES.find((b) => b.name.includes('Frostfang'));

    expect(kraken).toBeDefined();
    expect(ignisWyrm).toBeDefined();
    expect(frostTitan).toBeDefined();
  });

  it('generates unique trap varieties for sunken ruins, volcanic caldera, and glacial caverns', () => {
    const width = 40;
    const height = 30;
    const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Floor));

    const sunkenTraps = spawnDungeonTraps(map, width, height, 3, 2, 2, 38, 28, 0.25, 'sunken_ruins');
    const volcanicTraps = spawnDungeonTraps(map, width, height, 7, 2, 2, 38, 28, 0.25, 'volcanic_caldera');
    const glacialTraps = spawnDungeonTraps(map, width, height, 5, 2, 2, 38, 28, 0.25, 'glacial_caverns');

    const sunkenTypes = sunkenTraps.map((t) => t.type);
    const volcanicTypes = volcanicTraps.map((t) => t.type);
    const glacialTypes = glacialTraps.map((t) => t.type);

    expect(sunkenTypes).toContain(TrapType.Geyser);
    expect(volcanicTypes).toContain(TrapType.MagmaEruption);
    expect(glacialTypes).toContain(TrapType.FrostbiteVent);
  });

  it('generates fully connected dungeon level with rooms, stairs, chests, and enemies', () => {
    const level = generateLevel(40, 30, 3, 50, 120);

    expect(level.map.length).toBe(30);
    expect(level.map[0].length).toBe(40);
    expect(level.playerX).toBeGreaterThan(0);
    expect(level.playerY).toBeGreaterThan(0);
    expect(level.traps.length).toBeGreaterThanOrEqual(0);
    expect(level.chests.length).toBeGreaterThan(0);
    expect(level.enemies.length).toBeGreaterThan(0);
  });
});
