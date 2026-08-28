import { describe, it, expect } from 'vitest';
import { getDirectionalShadowParams, isShadowCastingTile } from '../canvas/shadowRenderer';
import { TileType } from '../types';

describe('Directional Shadow Calculation Engine', () => {
  it('calculates morning long shadows extending west', () => {
    // 08:00 (480 minutes)
    const morningParams = getDirectionalShadowParams(480, 'clear');
    expect(morningParams.isNight).toBe(false);
    expect(morningParams.lengthRatio).toBeGreaterThan(0.5);
    expect(morningParams.dx).toBeLessThan(0); // Shadows cast westward in morning
  });

  it('calculates noon short shadows', () => {
    // 12:30 (750 minutes)
    const noonParams = getDirectionalShadowParams(750, 'clear');
    expect(noonParams.isNight).toBe(false);
    expect(noonParams.lengthRatio).toBeLessThan(0.45); // Shortest shadows at noon
  });

  it('calculates evening long shadows extending east', () => {
    // 18:00 (1080 minutes)
    const eveningParams = getDirectionalShadowParams(1080, 'clear');
    expect(eveningParams.isNight).toBe(false);
    expect(eveningParams.lengthRatio).toBeGreaterThan(0.5);
    expect(eveningParams.dx).toBeGreaterThan(0); // Shadows cast eastward in evening
  });

  it('calculates subtle moonlight shadows at night', () => {
    // 23:00 (1380 minutes)
    const nightParams = getDirectionalShadowParams(1380, 'clear');
    expect(nightParams.isNight).toBe(true);
    expect(nightParams.color).toContain('rgba(');
  });

  it('identifies shadow casting tiles accurately', () => {
    expect(isShadowCastingTile(TileType.Tree)).toBe(true);
    expect(isShadowCastingTile(TileType.PineTree)).toBe(true);
    expect(isShadowCastingTile(TileType.Wall)).toBe(true);
    expect(isShadowCastingTile(TileType.WatchtowerWall)).toBe(true);
    expect(isShadowCastingTile(TileType.Grass)).toBe(false);
    expect(isShadowCastingTile(TileType.Path)).toBe(false);
    expect(isShadowCastingTile(TileType.Floor)).toBe(false);
  });
});
