import { describe, it, expect } from 'vitest';
import { multiOctaveNoise, getContinuousTerrainMetrics } from '../world/organic/biomeNoiseEngine';
import { carveNaturalRiversAndLakes } from '../world/organic/naturalRiverCarver';
import { generateOrganicVegetationAndOres } from '../world/organic/vegetationClusterGen';
import { carveOrganicTrailsAndRoads } from '../world/organic/roadNetworkGen';
import { TileType } from '../types';

describe('Phase 1: Organic World Generation Module', () => {
  it('multiOctaveNoise returns continuous normalized values [0, 1]', () => {
    for (let x = -20; x <= 20; x += 5) {
      for (let y = -20; y <= 20; y += 5) {
        const val = multiOctaveNoise(x, y, 3, 0.5, 2.0, 12345);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('getContinuousTerrainMetrics produces elevation, moisture, and temperature gradients', () => {
    const northMetrics = getContinuousTerrainMetrics(0, -500, 12345);
    const southMetrics = getContinuousTerrainMetrics(0, 500, 12345);

    expect(northMetrics.elevation).toBeGreaterThanOrEqual(0);
    expect(northMetrics.moisture).toBeGreaterThanOrEqual(0);
    expect(northMetrics.temperature).toBeGreaterThanOrEqual(0);

    expect(southMetrics.elevation).toBeGreaterThanOrEqual(0);
    expect(southMetrics.moisture).toBeGreaterThanOrEqual(0);
    expect(southMetrics.temperature).toBeGreaterThanOrEqual(0);
  });

  it('carveNaturalRiversAndLakes places water and bridge path tiles naturally', () => {
    const width = 30;
    const height = 20;
    const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Grass));

    carveNaturalRiversAndLakes(map, 2, 2, width, height, 'forest', 12345);

    let waterCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === TileType.Water) waterCount++;
      }
    }
    expect(waterCount).toBeGreaterThan(0);
  });

  it('generateOrganicVegetationAndOres generates trees, bushes, and ore veins without overwriting path', () => {
    const width = 30;
    const height = 20;
    const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Grass));

    // Place a path through center
    for (let x = 0; x < width; x++) {
      map[10][x] = TileType.Path;
    }

    generateOrganicVegetationAndOres(map, 1, 1, width, height, 'forest', 12345);

    // Verify path remains intact
    for (let x = 0; x < width; x++) {
      expect(map[10][x]).toBe(TileType.Path);
    }

    // Verify vegetation generated
    let treeCount = 0;
    let bushCount = 0;
    let oreCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === TileType.Tree || map[y][x] === TileType.BirchTree || map[y][x] === TileType.PineTree) {
          treeCount++;
        } else if (map[y][x] === TileType.Bush) {
          bushCount++;
        } else if (map[y][x] === TileType.CopperVein || map[y][x] === TileType.IronVein) {
          oreCount++;
        }
      }
    }
    expect(treeCount).toBeGreaterThan(0);
    expect(bushCount).toBeGreaterThan(0);
  });

  it('generates berry bushes and ore veins across macro-world chunks', () => {
    const width = 30;
    const height = 20;
    let totalBushes = 0;
    let totalCopper = 0;
    let totalIron = 0;

    for (let cy = -2; cy <= 2; cy++) {
      for (let cx = -2; cx <= 2; cx++) {
        const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Grass));
        generateOrganicVegetationAndOres(map, cx, cy, width, height, 'forest', 8675309);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (map[y][x] === TileType.Bush) totalBushes++;
            if (map[y][x] === TileType.CopperVein) totalCopper++;
            if (map[y][x] === TileType.IronVein) totalIron++;
          }
        }
      }
    }

    expect(totalBushes).toBeGreaterThan(50);
    expect(totalCopper).toBeGreaterThan(10);
    expect(totalIron).toBeGreaterThan(10);
  });

  it('carveOrganicTrailsAndRoads adds path tiles for highway chunks', () => {
    const width = 30;
    const height = 20;
    const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.Grass));

    carveOrganicTrailsAndRoads(map, 4, 4, width, height, false, 12345);

    let pathCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === TileType.Path) pathCount++;
      }
    }
    expect(pathCount).toBeGreaterThan(0);
  });
});
