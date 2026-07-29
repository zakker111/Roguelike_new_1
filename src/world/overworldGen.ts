/**
 * Overworld World & Chunk Generation Module
 */
export {
  generateOverworldChunk,
  prng,
  setWorldSeed,
  getCurrentWorldSeed,
  randomizeTownAndCastleLayouts,
} from '../utils/overworld';

export {
  getOrganicNoise,
  getOrganicBiome,
  getBiomeConfig,
  getBiomeWeatherFrequencies,
} from './overworldBiomes';
export type { BiomeType } from './overworldBiomes';

export {
  getBuildingCoordinates,
  hasTownAtChunk,
  isCastleTownAtChunk,
  getDeterministicTownName,
  buildModularTownSquare,
  buildCastleKeep,
} from './overworldStructures';
