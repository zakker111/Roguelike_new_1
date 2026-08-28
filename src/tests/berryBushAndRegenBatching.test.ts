import { describe, it, expect } from 'vitest';
import { resolveTileStyle } from '../canvas/tileMapRenderer';
import { TileType } from '../types';
import { tickActiveGMStoryteller, getGMStorytellerState, setGMStorytellerState } from '../utils/gmStoryteller';

describe('Berry Bush vs Tree Distinction and Regeneration Batching', () => {
  it('renders Berry Bushes with distinct berry glyphs and colors from Trees', () => {
    const biomes: ('forest' | 'swamp' | 'tundra' | 'desert')[] = ['forest', 'swamp', 'tundra', 'desert'];

    for (const biome of biomes) {
      const treeDetails = resolveTileStyle(TileType.Tree, true, true, biome);
      const bushDetails = resolveTileStyle(TileType.Bush, true, true, biome);

      // Bush and Tree MUST NOT share the same char or glyph representation
      expect(bushDetails.char).not.toBe(treeDetails.char);

      // Verify specific expected iconic glyphs
      if (biome === 'forest') {
        expect(bushDetails.char).toBe('🍓');
        expect(treeDetails.char).toBe('🌲');
      } else if (biome === 'swamp') {
        expect(bushDetails.char).toBe('🫐');
        expect(treeDetails.char).toBe('🌳');
      } else if (biome === 'tundra') {
        expect(bushDetails.char).toBe('🫐');
        expect(treeDetails.char).toBe('▲');
      } else if (biome === 'desert') {
        expect(bushDetails.char).toBe('🌾');
        expect(treeDetails.char).toBe('🌵');
      }
    }
  });

  it('provides world discovery and foraging flavor text for storyteller chaos gifts', () => {
    const gmState = {
      ...getGMStorytellerState(),
      personality: 'Benevolent' as const,
      boredom: 90,
      tension: 20
    };
    setGMStorytellerState(gmState);

    const dummyGameState: any = {
      playerX: 10,
      playerY: 10,
      levelWidth: 30,
      levelHeight: 30,
      discovered: Array(30).fill(null).map(() => Array(30).fill(true)),
      enemies: [],
      traps: [],
      chests: [],
      inventoryMaterials: {},
      inventoryCatalysts: {},
      defeatedEnemiesCount: {},
      playerStats: {
        hp: 50,
        maxHp: 100,
        mp: 30,
        maxMp: 50,
        gold: 20,
        level: 1,
        turnsPlayed: 10,
      },
      chaosScore: 10,
      activeFoodBuff: undefined,
    };

    // Run storyteller ticks to ensure GM chaos rolls execute cleanly with narrative text
    const result = tickActiveGMStoryteller(dummyGameState);
    expect(result).toBeDefined();
    if (result.logMessage) {
      expect(result.logMessage.text.length).toBeGreaterThan(10);
      // Logs should avoid generic "elements condense out of thin air"
      expect(result.logMessage.text).not.toContain('out of thin air');
    }
  });
});
