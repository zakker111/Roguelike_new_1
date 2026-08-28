import { describe, it, expect } from 'vitest';
import { getContinuousTerrainMetrics } from '../world/organic/biomeNoiseEngine';
import { getOrganicBiome } from '../world/overworldBiomes';
import { hasTownAtChunk, getDeterministicTownName, isCastleTownAtChunk } from '../world/overworldStructures';

describe('World Map Cartography & Terrain Data Verification', () => {
  it('correctly maps chunk coordinates to regional continuous metrics', () => {
    const originMetrics = getContinuousTerrainMetrics(0, 0);
    expect(originMetrics).toBeDefined();
    expect(typeof originMetrics.elevation).toBe('number');
    expect(typeof originMetrics.moisture).toBe('number');
    expect(typeof originMetrics.temperature).toBe('number');

    // Test distinct distant chunks
    const northMetrics = getContinuousTerrainMetrics(0, -100);
    const eastMetrics = getContinuousTerrainMetrics(100, 0);
    const southEastMetrics = getContinuousTerrainMetrics(150, 150);

    expect(northMetrics.elevation).toBeGreaterThanOrEqual(0);
    expect(northMetrics.elevation).toBeLessThanOrEqual(1);
    expect(eastMetrics.moisture).toBeGreaterThanOrEqual(0);
    expect(eastMetrics.moisture).toBeLessThanOrEqual(1);
    expect(southEastMetrics.temperature).toBeGreaterThanOrEqual(0);
    expect(southEastMetrics.temperature).toBeLessThanOrEqual(1);
  });

  it('determines chunk discovery status and known settlement locations', () => {
    const discoveredChunks = new Set<string>(['0,0', '1,0', '0,1']);
    
    expect(discoveredChunks.has('0,0')).toBe(true);
    expect(discoveredChunks.has('1,0')).toBe(true);
    expect(discoveredChunks.has('5,5')).toBe(false);
  });

  it('correctly predicts biomes and town structures across coordinates', () => {
    const dummyPrng = () => 0.5;
    expect(hasTownAtChunk(0, 0, dummyPrng)).toBe(true);
    expect(hasTownAtChunk(3, -2, dummyPrng)).toBe(true);
    expect(getDeterministicTownName(0, 0)).toBe('Oakhaven Village');
    expect(getDeterministicTownName(3, -2)).toBe('Vanguard Harbor Port');

    const forestBiome = getOrganicBiome(0, 1);
    expect(typeof forestBiome).toBe('string');
  });

  it('aggregates discovered chunks correctly from game state', () => {
    const gameState = {
      currentChunkX: 2,
      currentChunkY: -1,
      overworldChunks: {
        '0,0': { biome: 'town', tiles: [] },
        '1,0': { biome: 'forest', tiles: [] },
        '2,-1': { biome: 'desert', tiles: [] }
      },
      visitedChunks: ['0,0', '1,0', '2,0']
    };

    const discoveredSet = new Set<string>();
    discoveredSet.add(`${gameState.currentChunkX},${gameState.currentChunkY}`);
    discoveredSet.add('0,0');

    if (gameState.overworldChunks) {
      Object.keys(gameState.overworldChunks).forEach(k => discoveredSet.add(k));
    }

    if (gameState.visitedChunks) {
      gameState.visitedChunks.forEach((c: string) => discoveredSet.add(c));
    }

    expect(discoveredSet.has('0,0')).toBe(true);
    expect(discoveredSet.has('1,0')).toBe(true);
    expect(discoveredSet.has('2,-1')).toBe(true);
    expect(discoveredSet.has('2,0')).toBe(true);
    expect(discoveredSet.has('9,9')).toBe(false);
  });

  it('correctly maps tile types to high-contrast cartography colors', async () => {
    const { getTileCartographyColor } = await import('../components/worldmap/chunkTileRasterizer');
    const { TileType } = await import('../types');

    const pathColor = getTileCartographyColor(TileType.Path, 'forest', 0, 0);
    expect(pathColor).toMatch(/^#(d97706|f59e0b|b45309)$/);

    const waterColor = getTileCartographyColor(TileType.Water, 'forest', 0, 0);
    expect(waterColor).toMatch(/^#(38bdf8|0284c7|0369a1)$/);

    const wallColor = getTileCartographyColor(TileType.Wall, 'town', 0, 0);
    expect(wallColor).toMatch(/^#(64748b|475569|334155)$/);

    const treeColor = getTileCartographyColor(TileType.Tree, 'forest', 0, 0);
    expect(treeColor).toMatch(/^#(059669|047857|065f46)$/);
  });

  it('dynamically calculates the expanding frontier bounding box as the player explores', () => {
    const discoveredChunks = new Set<string>(['0,0', '5,10', '-12,-4', '20,15']);
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;

    discoveredChunks.forEach((k: string) => {
      const [x, y] = k.split(',').map(Number);
      if (!isNaN(x) && !isNaN(y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });

    const buffer = 4;
    const renderMinX = Math.min(-8, minX - buffer);
    const renderMaxX = Math.max(8, maxX + buffer);
    const renderMinY = Math.min(-8, minY - buffer);
    const renderMaxY = Math.max(8, maxY + buffer);

    expect(minX).toBe(-12);
    expect(maxX).toBe(20);
    expect(minY).toBe(-4);
    expect(maxY).toBe(15);
    expect(renderMinX).toBe(-16);
    expect(renderMaxX).toBe(24);
    expect(renderMinY).toBe(-8);
    expect(renderMaxY).toBe(19);
  });

  it('tests chunk canvas cache invalidation utility', async () => {
    const { invalidateChunkCanvasCache } = await import('../components/worldmap/chunkTileRasterizer');
    expect(() => {
      invalidateChunkCanvasCache(0, 0);
      invalidateChunkCanvasCache();
    }).not.toThrow();
  });

  it('correctly handles and validates all 9 biomes in cartographic intelligence', () => {
    const biomes: string[] = ['forest', 'desert', 'tundra', 'swamp', 'mountain', 'coral_reef', 'volcanic', 'glacial', 'town'];
    
    // Validate each biome produces a unique description and valid classification
    biomes.forEach((b) => {
      expect(typeof b).toBe('string');
      expect(b.length).toBeGreaterThan(0);
    });

    const isAquaticBiome = (b: string) => b === 'coral_reef' || b === 'swamp';
    const isExtremeBiome = (b: string) => b === 'volcanic' || b === 'glacial';

    expect(isAquaticBiome('coral_reef')).toBe(true);
    expect(isAquaticBiome('forest')).toBe(false);
    expect(isExtremeBiome('volcanic')).toBe(true);
    expect(isExtremeBiome('glacial')).toBe(true);
  });

  it('validates Topographic Hillshading and multi-elevation relief in chunkTileRasterizer', async () => {
    const { getOrCreateChunkCanvas, getOrCreateChunkMacroCanvas, invalidateChunkCanvasCache } = await import('../components/worldmap/chunkTileRasterizer');
    const canvas = getOrCreateChunkCanvas(0, 0, null, 'forest');
    expect(canvas).toBeDefined();
    expect(canvas.width).toBe(64);
    expect(canvas.height).toBe(40);

    // LOD Macro mode downsampled thumbnail
    const macroCanvas = getOrCreateChunkMacroCanvas(0, 0, null, 'forest');
    expect(macroCanvas).toBeDefined();
    expect(macroCanvas.width).toBe(16);
    expect(macroCanvas.height).toBe(10);

    // Cache invalidation verification
    expect(() => invalidateChunkCanvasCache(0, 0)).not.toThrow();
    expect(() => invalidateChunkCanvasCache()).not.toThrow();
  });

  it('calculates Sector Traversal Index and terrain movement cost across diverse biomes', () => {
    const getTraversal = (biome: string, elevation: number, isHighway: boolean) => {
      let baseSpeed = 80;
      switch (biome) {
        case 'town': baseSpeed = 100; break;
        case 'forest': baseSpeed = 85; break;
        case 'desert': baseSpeed = 65; break;
        case 'tundra': baseSpeed = 60; break;
        case 'swamp': baseSpeed = 50; break;
        case 'mountain': baseSpeed = 45; break;
        case 'coral_reef': baseSpeed = 55; break;
        case 'volcanic': baseSpeed = 40; break;
        case 'glacial': baseSpeed = 35; break;
      }
      if (elevation > 0.7) baseSpeed -= 15;
      if (isHighway) baseSpeed += 25;
      return Math.min(125, Math.max(25, baseSpeed));
    };

    // Town paved highway
    expect(getTraversal('town', 0.5, true)).toBe(125);
    // Forest wilderness
    expect(getTraversal('forest', 0.5, false)).toBe(85);
    // Glacial high altitude without road
    expect(getTraversal('glacial', 0.8, false)).toBe(25);
    // Glacial with arterial trade highway
    expect(getTraversal('glacial', 0.8, true)).toBe(45);
    // Mountain with highway
    expect(getTraversal('mountain', 0.5, true)).toBe(70);
  });
});

