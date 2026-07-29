import worldConfig from '../data/worldConfig.json';

export type BiomeType = 'forest' | 'desert' | 'tundra' | 'swamp';

/**
 * Deterministic smooth organic noise based on low-frequency sine/cosine waves
 */
export function getOrganicNoise(x: number, y: number, offset: number, worldSeed: number = 8675309): number {
  const f1 = Math.sin(x * 0.16 + offset + (worldSeed % 1000) * 0.01) * 0.45;
  const f2 = Math.cos(y * 0.14 - offset * 1.3 - (worldSeed % 1000) * 0.015) * 0.45;
  const f3 = Math.sin((x + y) * 0.07 + offset * 0.7) * 0.2;
  const f4 = Math.cos((x - y) * 0.09 - offset * 0.5) * 0.1;
  return 0.5 + (f1 + f2 + f3 + f4); // Normalized range [0.0, 1.0]
}

/**
 * Determine Biome using an organic, Whittaker-like temperature/moisture transition system
 */
export function getOrganicBiome(chunkX: number, chunkY: number, worldSeed: number = 8675309): BiomeType {
  if (chunkX === 0 && chunkY === 0) {
    return 'forest'; // spawn town is always lush forest
  }

  // Generate organic temperature and moisture
  const tempNoise = getOrganicNoise(chunkX, chunkY, 12.34, worldSeed);
  const moistNoise = getOrganicNoise(chunkX, chunkY, 56.78, worldSeed);

  // Global gradients: North is colder, South is warmer. East is drier, West is wetter.
  const tempGrad = chunkY * 0.06; // negative Y goes North (colder), positive Y goes South (warmer)
  const moistGrad = -chunkX * 0.06; // positive X goes East (drier), negative X goes West (wetter)

  const temperature = tempNoise + tempGrad;
  const moisture = moistNoise + moistGrad;

  const thresholds = worldConfig.biomeThresholds;

  if (temperature < thresholds.tundra.temperatureMax) {
    return 'tundra'; // Cold environments are snowy Tundra
  } else if (temperature >= thresholds.desert.temperatureMin && moisture < thresholds.desert.moistureMax) {
    return 'desert'; // Warm and dry environments are Desert
  } else if (temperature >= thresholds.swamp.temperatureMin && moisture >= thresholds.swamp.moistureMin) {
    return 'swamp';  // Warm and highly wet environments are Swamp
  } else {
    return 'forest'; // Standard balanced environments are Forest
  }
}

/**
 * Helper to get biome-specific environmental configuration
 */
export function getBiomeConfig(biome: BiomeType) {
  return (worldConfig.environmentalHazards as any)[biome] || {
    lakeCount: 2,
    baseLakeRadiusMin: 2,
    baseLakeRadiusMax: 4,
    trapCount: 0,
    trapType: 'none',
  };
}

/**
 * Helper to get weather frequencies for a biome
 */
export function getBiomeWeatherFrequencies(biome: BiomeType): Record<string, number> {
  return (worldConfig.weatherFrequencies as any)[biome] || { clear: 1.0 };
}
