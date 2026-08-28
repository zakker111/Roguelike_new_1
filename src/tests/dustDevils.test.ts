import { describe, it, expect, vi } from 'vitest';
import { isDesertBiome, isObstacleTile } from '../utils/weatherEngine';
import { TileType, GameState } from '../types';
import { renderDesertAtmosphere } from '../canvas/weatherLightingRenderer';
import { resolveTileStyle } from '../canvas/tileMapRenderer';

describe('Dust Devils & Tumbleweed Gust System', () => {
  it('identifies desert biomes and sandstorms correctly', () => {
    expect(isDesertBiome('desert', 'clear')).toBe(true);
    expect(isDesertBiome('forest', 'sandstorm')).toBe(true);
    expect(isDesertBiome('forest', 'clear')).toBe(false);
  });

  it('detects rocky obstacles and structures that affect dust whirls', () => {
    expect(isObstacleTile(TileType.Wall)).toBe(true);
    expect(isObstacleTile(TileType.CopperVein)).toBe(true);
    expect(isObstacleTile(TileType.WatchtowerWall)).toBe(true);
    expect(isObstacleTile(TileType.Tree)).toBe(true);
    expect(isObstacleTile(TileType.Floor)).toBe(false);
    expect(isObstacleTile(TileType.Grass)).toBe(false);
    expect(isObstacleTile(TileType.Path)).toBe(false);
  });

  it('renders enchanted desert atmosphere, sunburst rays, and sand particles without error', () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    } as unknown as CanvasRenderingContext2D;

    const mockGameState = {
      biome: 'desert' as const,
      weather: 'clear' as const,
      gameTime: 720, // Midday sun
      playerX: 10,
      playerY: 10,
      map: [[TileType.Grass, TileType.Grass], [TileType.Grass, TileType.Grass]],
    } as unknown as GameState;

    renderDesertAtmosphere(mockCtx, { width: 800, height: 600 }, mockGameState);

    expect(mockCtx.createRadialGradient).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('resolves diverse desert tile micro-textures across coordinates', () => {
    const duneChars = new Set<string>();
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const style = resolveTileStyle(TileType.Grass, true, true, 'desert', 0, undefined, x, y);
        duneChars.add(style.char);
      }
    }
    // Should have multiple distinct sand texture glyphs
    expect(duneChars.size).toBeGreaterThan(1);
    expect(duneChars.has('░') || duneChars.has('~') || duneChars.has('≈')).toBe(true);

    // Desert Flora variety
    const floraChars = new Set<string>();
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const style = resolveTileStyle(TileType.Tree, true, true, 'desert', 0, undefined, x, y);
        floraChars.add(style.char);
      }
    }
    expect(floraChars.has('🌵')).toBe(true);
  });
});

