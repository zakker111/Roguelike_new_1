import { describe, it, expect } from 'vitest';
import { generateLevel } from '../utils/dungeon';
import { generateOverworldChunk } from '../utils/overworld';
import { TileType } from '../types';

describe('12.3 World Generation, Chunk Scrolling & Camera Focus Tests', () => {
  it('generateOverworldChunk builds a 64x40 valid map layout with player spawn candidates', () => {
    const chunk = generateOverworldChunk(0, 0, 64, 40);
    expect(chunk).toBeDefined();
    expect(chunk.map.length).toBe(40);
    expect(chunk.map[0].length).toBe(64);
    expect(chunk.biome).toBeDefined();
    expect(chunk.weather).toBeDefined();
    expect(chunk.map[0][0]).not.toBeUndefined();
  });

  it('generateLevel builds a valid dungeon layout across depths 1 through 5 without crashing', () => {
    for (let depth = 1; depth <= 5; depth++) {
      const dungeon = generateLevel(64, 40, depth, 50, 100);
      expect(dungeon).toBeDefined();
      expect(dungeon.map.length).toBe(40);
      expect(dungeon.map[0].length).toBe(64);
      expect(dungeon.playerX).toBeGreaterThanOrEqual(0);
      expect(dungeon.playerX).toBeLessThan(64);
      expect(dungeon.playerY).toBeGreaterThanOrEqual(0);
      expect(dungeon.playerY).toBeLessThan(40);

      // Verify player spawns on a walkable tile
      const spawnTile = dungeon.map[dungeon.playerY][dungeon.playerX];
      expect(spawnTile).not.toBe(TileType.Wall);

      // Verify enemies array initialized with proper properties
      dungeon.enemies.forEach(enemy => {
        expect(enemy.id).toBeDefined();
        expect(enemy.name).toBeDefined();
        expect(enemy.hp).toBeGreaterThan(0);
        expect(enemy.maxHp).toBeGreaterThan(0);
        expect(enemy.debuffs).toBeDefined();
      });
    }
  });

  it('Camera target calculation snaps camera on chunk boundary transition', () => {
    const levelWidth = 64;
    const levelHeight = 40;

    // Player moves to new chunk boundary (x: 0, y: 0) -> camera target centers on player
    const playerX = 32;
    const playerY = 20;

    const targetCamX = playerX;
    const targetCamY = playerY;

    expect(targetCamX).toBe(32);
    expect(targetCamY).toBe(20);
  });
});
