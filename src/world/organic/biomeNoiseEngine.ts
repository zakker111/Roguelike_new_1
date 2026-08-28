/**
 * Multi-octave Simplex-like continuous noise generator for organic world generation.
 */

export function multiOctaveNoise(
  worldX: number,
  worldY: number,
  octaves: number = 3,
  persistence: number = 0.5,
  lacunarity: number = 2.0,
  seed: number = 8675309
): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    const nx = worldX * 0.035 * frequency + (seed % 1000) * 0.05 + i * 17.13;
    const ny = worldY * 0.035 * frequency - (seed % 1000) * 0.04 - i * 13.37;

    const n =
      Math.sin(nx) * 0.5 +
      Math.cos(ny) * 0.5 +
      Math.sin(nx * 0.7 + ny * 0.8) * 0.35 +
      Math.cos(nx * 1.1 - ny * 0.9) * 0.25;

    total += ((n + 1.6) / 3.2) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return Math.min(1, Math.max(0, total / maxValue));
}

/**
 * Evaluates elevation, moisture, and temperature with smooth continuous gradients.
 */
export interface TerrainMetrics {
  elevation: number;
  moisture: number;
  temperature: number;
}

export function getContinuousTerrainMetrics(
  worldX: number,
  worldY: number,
  seed: number = 8675309
): TerrainMetrics {
  const elevation = multiOctaveNoise(worldX, worldY, 3, 0.5, 2.0, seed);
  const moisture = multiOctaveNoise(worldX + 500, worldY - 500, 3, 0.5, 2.0, seed + 101);
  const tempNoise = multiOctaveNoise(worldX - 500, worldY + 500, 2, 0.6, 2.0, seed + 202);

  // Geographic macro-gradients (North is colder, South is warmer; East is slightly drier)
  const tempGrad = (worldY / 300) * 0.15;
  const moistGrad = -(worldX / 300) * 0.12;

  const temperature = Math.min(1, Math.max(0, tempNoise + tempGrad));
  const finalMoisture = Math.min(1, Math.max(0, moisture + moistGrad));

  return {
    elevation,
    moisture: finalMoisture,
    temperature
  };
}
