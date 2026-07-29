import { describe, it, expect } from 'vitest';
import { getBiomePriceMultiplier, getPriceReports, GUILD_UPGRADES, WOOD_MATERIAL } from '../utils/tradeEconomy';

describe('12.5 Economy, Caravans, Trading & Life Skills Tests', () => {
  it('getBiomePriceMultiplier calculates accurate regional trade multipliers', () => {
    // Wood in desert has high scarcity multiplier (3.5x)
    const woodDesert = getBiomePriceMultiplier('mat_wood', 'desert');
    expect(woodDesert).toBe(3.5);

    // Wood in swamp has damp discount (0.8x)
    const woodSwamp = getBiomePriceMultiplier('mat_wood', 'swamp');
    expect(woodSwamp).toBe(0.8);

    // Frost catalyst in desert sells at massive premium (2.5x)
    const frostDesert = getBiomePriceMultiplier('cat_frost', 'desert');
    expect(frostDesert).toBe(2.5);

    // Frost catalyst in tundra is abundant (0.6x)
    const frostTundra = getBiomePriceMultiplier('cat_frost', 'tundra');
    expect(frostTundra).toBe(0.6);
  });

  it('getPriceReports generates regional market intelligence reports', () => {
    const desertReports = getPriceReports('desert');
    expect(desertReports.length).toBeGreaterThan(0);
    expect(desertReports.some(r => r.itemName.includes('Timber'))).toBe(true);

    const tundraReports = getPriceReports('tundra');
    expect(tundraReports.length).toBeGreaterThan(0);
    expect(tundraReports.some(r => r.itemName.includes('Brews') || r.itemName.includes('Fire Catalyst'))).toBe(true);
  });

  it('Guild upgrades data structure contains valid requirements and costs', () => {
    expect(GUILD_UPGRADES.length).toBe(3);
    GUILD_UPGRADES.forEach(up => {
      expect(up.id).toBeDefined();
      expect(up.costGold).toBeGreaterThan(0);
      expect(up.maxLevel).toBeGreaterThan(0);
    });
  });

  it('WOOD_MATERIAL constant is properly structured', () => {
    expect(WOOD_MATERIAL.id).toBe('mat_wood');
    expect(WOOD_MATERIAL.price).toBe(8);
  });
});
