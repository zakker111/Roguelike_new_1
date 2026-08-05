import { describe, it, expect } from 'vitest';
import { generateOverworldChunk } from '../utils/overworld';
import { TileType } from '../types';
import { getMaterialById } from '../utils/itemsData';
import { getBiomePriceMultiplier } from '../utils/tradeEconomy';
import { getMerchantConfig } from '../utils/shopData';

describe('Phase 28.2: Harbor Towns, Ports & Nautical Population Spawning', () => {
  it('should generate a harbor port town chunk at chunk (3, -2) with water basin, piers, and structures', () => {
    const chunk = generateOverworldChunk(3, -2, 64, 40);

    expect(chunk).toBeDefined();
    expect(chunk.map).toBeDefined();

    // Check water tiles generated in eastern harbor basin
    let waterCount = 0;
    for (let y = 0; y < chunk.map.length; y++) {
      for (let x = chunk.map[0].length - 12; x < chunk.map[0].length; x++) {
        if (chunk.map[y][x] === TileType.Water) {
          waterCount++;
        }
      }
    }
    expect(waterCount).toBeGreaterThan(50);

    // Check pier path tiles exist
    let pierPathCount = 0;
    for (let y = 0; y < chunk.map.length; y++) {
      for (let x = chunk.map[0].length - 15; x < chunk.map[0].length; x++) {
        if (chunk.map[y][x] === TileType.Path) {
          pierPathCount++;
        }
      }
    }
    expect(pierPathCount).toBeGreaterThan(15);
  });

  it('should spawn all specialized nautical NPC roles in harbor port town', () => {
    const chunk = generateOverworldChunk(3, -2, 64, 40);
    const roles = chunk.npcs.map(n => n.role);

    expect(roles).toContain('harbor_master');
    expect(roles).toContain('fishmonger');
    expect(roles).toContain('dockworker');
    expect(roles).toContain('sailor');
    expect(roles).toContain('ferried_navigator');

    const harborMaster = chunk.npcs.find(n => n.role === 'harbor_master');
    expect(harborMaster?.name).toContain('Captain Jack');

    const fishmonger = chunk.npcs.find(n => n.role === 'fishmonger');
    expect(fishmonger?.name).toContain('Finnegan');
  });

  it('should verify harbor-specific trading goods exist with proper stats', () => {
    const freshCatch = getMaterialById('mat_fresh_catch');
    expect(freshCatch).toBeDefined();
    expect(freshCatch?.name).toContain('Fresh Harbor Catch');

    const saltedCod = getMaterialById('mat_salted_cod');
    expect(saltedCod).toBeDefined();
    expect(saltedCod?.name).toContain('Salted Ocean Cod');

    const whaleOil = getMaterialById('mat_whale_oil');
    expect(whaleOil).toBeDefined();
    expect(whaleOil?.name).toContain('Refined Whale Oil');

    const nauticalChart = getMaterialById('mat_nautical_chart');
    expect(nauticalChart).toBeDefined();
    expect(nauticalChart?.name).toContain('Nautical Sea Chart');

    const shipPitch = getMaterialById('mat_ship_pitch');
    expect(shipPitch).toBeDefined();
    expect(shipPitch?.name).toContain('Waterproof Ship Pitch');
  });

  it('should apply accurate biome price multipliers for nautical goods', () => {
    // Fresh catch & salted cod have high demand in arid desert (scarcity)
    const desertFishMult = getBiomePriceMultiplier('mat_salted_cod', 'desert');
    expect(desertFishMult).toBe(2.5);

    // Whale oil is premium in arctic tundra (heating fuel & light)
    const tundraOilMult = getBiomePriceMultiplier('mat_whale_oil', 'tundra');
    expect(tundraOilMult).toBe(2.8);

    // Nautical chart in inland desert
    const chartMult = getBiomePriceMultiplier('mat_nautical_chart', 'desert');
    expect(chartMult).toBe(2.2);

    // Ship pitch in swamp (sealing boats & boots)
    const pitchMult = getBiomePriceMultiplier('mat_ship_pitch', 'swamp');
    expect(pitchMult).toBe(2.0);
  });

  it('should provide merchant configs and stock for harbor NPC roles', () => {
    const fmConfig = getMerchantConfig('fishmonger', 'npc_fishmonger');
    expect(fmConfig.defaultStock['mat_fresh_catch']).toBeGreaterThan(0);
    expect(fmConfig.defaultStock['mat_salted_cod']).toBeGreaterThan(0);

    const hmConfig = getMerchantConfig('harbor_master', 'npc_harbor_master');
    expect(hmConfig.defaultStock['mat_nautical_chart']).toBeGreaterThan(0);
    expect(hmConfig.defaultStock['mat_whale_oil']).toBeGreaterThan(0);
  });
});
