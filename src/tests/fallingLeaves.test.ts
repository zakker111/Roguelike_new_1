import { describe, it, expect } from 'vitest';
import { getSeasonalLeafPalette, isForestBiome } from '../utils/weatherEngine';

describe('Falling Autumn Leaves & Petals System', () => {
  it('correctly identifies forest biomes', () => {
    expect(isForestBiome('forest')).toBe(true);
    expect(isForestBiome(undefined)).toBe(true);
    expect(isForestBiome('desert')).toBe(false);
    expect(isForestBiome('tundra')).toBe(false);
  });

  it('provides appropriate seasonal leaf and petal palettes', () => {
    const springPalette = getSeasonalLeafPalette('spring');
    expect(springPalette.type).toBe('petal');
    expect(springPalette.colors.length).toBeGreaterThan(0);

    const summerPalette = getSeasonalLeafPalette('summer');
    expect(summerPalette.type).toBe('leaf');

    const autumnPalette = getSeasonalLeafPalette('autumn');
    expect(autumnPalette.type).toBe('leaf');
    expect(autumnPalette.colors).toContain('rgba(217, 119, 6, 0.45)');
  });
});
