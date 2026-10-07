/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  PALETTE_THEMES,
  PRESET_SPRITE_SIZES,
  TEST_ENTITIES,
  TEST_BOSSES,
  AUTOTILING_MASKS
} from '../components/god/tileset/tilesetTesterTypes';
import { TilesetTesterTab } from '../components/god/TilesetTesterTab';
import { tilesetAtlasManager } from '../canvas/TilesetAtlasManager';
import { TileType } from '../types';

describe('Modular Tileset Tester Sub-Engine & Anti-Monolith Verification', () => {
  it('exports valid palette themes with descriptions and colors', () => {
    expect(PALETTE_THEMES.length).toBe(3);
    const themeIds = PALETTE_THEMES.map(t => t.id);
    expect(themeIds).toContain('classic');
    expect(themeIds).toContain('forest');
    expect(themeIds).toContain('infernal');
  });

  it('exports preset sprite sizes spanning 16px to 64px', () => {
    expect(PRESET_SPRITE_SIZES).toEqual([16, 24, 32, 48, 64]);
  });

  it('exports complete test entity definitions with valid default animations', () => {
    expect(TEST_ENTITIES.length).toBeGreaterThanOrEqual(10);
    const hero = TEST_ENTITIES.find(e => e.id === 'player');
    expect(hero).toBeDefined();
    expect(hero?.char).toBe('@');
    expect(hero?.defaultAnim).toBe('idle');
  });

  it('exports test bosses with mult-tile sizes', () => {
    expect(TEST_BOSSES.length).toBe(3);
    const dragon = TEST_BOSSES.find(b => b.id === 'dragon');
    expect(dragon).toBeDefined();
    expect(dragon?.size).toBe('2x2 (64px)');
  });

  it('defines all 16 cardinal Wang autotile masks with coordinates in atlas manager', () => {
    expect(AUTOTILING_MASKS.length).toBe(16);
    for (let mask = 0; mask < 16; mask++) {
      const entry = AUTOTILING_MASKS.find(m => m.mask === mask);
      expect(entry, `Mask ${mask} must exist`).toBeDefined();
      const coords = tilesetAtlasManager.getAutotileCoords(TileType.Wall, mask);
      expect(coords).toBeDefined();
      expect(typeof coords.sx).toBe('number');
      expect(typeof coords.sy).toBe('number');
    }
  });

  it('exports TilesetTesterTab functional component', () => {
    expect(typeof TilesetTesterTab).toBe('function');
  });
});
