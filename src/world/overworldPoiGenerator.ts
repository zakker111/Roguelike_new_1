import { TileType, BiomeType } from '../types';
import { generatePointsOfInterest, generateWatchtowerPOI } from './poiGenerators';
import { POI_BLUEPRINTS, getPOIBlueprint } from '../data/worldHistory';

export {
  generatePointsOfInterest,
  generateWatchtowerPOI,
  POI_BLUEPRINTS,
  getPOIBlueprint
};

/**
 * High-level helper to generate points of interest for an overworld chunk
 */
export function generateChunkPOIs(
  map: TileType[][],
  chunkX: number,
  chunkY: number,
  biome: BiomeType,
  width: number,
  height: number,
  prng: (x: number, y: number, seed?: number) => number
): any[] {
  const poisList: any[] = [];
  generatePointsOfInterest(map, chunkX, chunkY, biome, width, height, prng, poisList);
  return poisList;
}
