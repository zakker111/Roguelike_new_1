import { describe, it, expect, vi } from 'vitest';
import { renderWaterTileShimmer } from '../canvas/waterShimmerRenderer';
import { renderBiomeMicroAtmosphere } from '../canvas/biomeAtmosphereRenderer';
import { createNewGameRun } from '../utils/gameStateFactory';

describe('Option 3 Biome Visuals: Water Shimmer & Atmospheric Micro-Particles', () => {
  const createMockContext = () => {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      ellipse: vi.fn(),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 1,
      globalAlpha: 1
    } as unknown as CanvasRenderingContext2D;
  };

  it('renders water shimmer and ripples for forest biome without throwing errors', () => {
    const ctx = createMockContext();
    expect(() => {
      renderWaterTileShimmer(ctx, 32, 64, 32, 1, 2, 'forest', false, 1000);
    }).not.toThrow();
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('renders crystalline icy glints for tundra water tiles', () => {
    const ctx = createMockContext();
    expect(() => {
      renderWaterTileShimmer(ctx, 32, 64, 32, 3, 4, 'tundra', false, 1200);
    }).not.toThrow();
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('renders toxic bubble drift for swamp water tiles', () => {
    const ctx = createMockContext();
    expect(() => {
      renderWaterTileShimmer(ctx, 32, 64, 32, 5, 6, 'swamp', false, 2500);
    }).not.toThrow();
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('renders gentle snowflakes in winter/tundra biomes', () => {
    const ctx = createMockContext();
    const state = createNewGameRun(123);
    state.biome = 'tundra';
    state.season = 'winter';

    expect(() => {
      renderBiomeMicroAtmosphere(ctx, { width: 800, height: 600 }, state);
    }).not.toThrow();
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('renders fireflies and wisps in swamp biomes', () => {
    const ctx = createMockContext();
    const state = createNewGameRun(123);
    state.biome = 'swamp';

    expect(() => {
      renderBiomeMicroAtmosphere(ctx, { width: 800, height: 600 }, state);
    }).not.toThrow();
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});
