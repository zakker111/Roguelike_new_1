import { TileType } from '../../types';
import { multiOctaveNoise } from './biomeNoiseEngine';

/**
 * Generates organic cellular forest groves, vegetation clearings, and clustered ore lodes.
 */
export function generateOrganicVegetationAndOres(
  map: TileType[][],
  chunkX: number,
  chunkY: number,
  width: number,
  height: number,
  biome: string,
  worldSeed: number = 8675309
): void {
  const worldOriginX = chunkX * width;
  const worldOriginY = chunkY * height;

  for (let y = 0; y < height; y++) {
    const wy = worldOriginY + y;
    for (let x = 0; x < width; x++) {
      const wx = worldOriginX + x;

      if (map[y][x] !== TileType.Grass) continue;

      // Ensure clear passage around paths, doors, town gates, signs, campfires, and dungeon portals
      let nearPassage = false;
      let nearWater = false;

      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const t = map[ny][nx];
            const chebDist = Math.max(Math.abs(dx), Math.abs(dy));

            // Immediate 1-tile clearance around paths and interactive structures
            if (chebDist <= 1) {
              if (
                t === TileType.Path ||
                t === TileType.Door ||
                t === TileType.TownGate ||
                t === TileType.DungeonEntrance ||
                t === TileType.Floor ||
                t === TileType.Sign ||
                t === TileType.Campfire ||
                t === TileType.StairsDown ||
                t === TileType.StairsUp
              ) {
                nearPassage = true;
                break;
              }
              if (t === TileType.Water) {
                nearWater = true;
              }
            } else if (chebDist === 2) {
              // 2-tile buffer strictly for portals and gates to prevent claustrophobia
              if (t === TileType.Door || t === TileType.TownGate || t === TileType.DungeonEntrance) {
                nearPassage = true;
                break;
              }
            }
          }
        }
        if (nearPassage) break;
      }

      if (nearPassage) continue;

      // 1. Ore Vein Lodes (Generated in scarce, rare natural deposits; never directly on water banks)
      const oreLodeNoise = multiOctaveNoise(wx * 0.85, wy * 0.85, 2, 0.55, 2.0, worldSeed + 123);
      const oreSubNoise = multiOctaveNoise(wx * 1.6, wy * 1.6, 2, 0.5, 2.0, worldSeed + 999);
      if (oreLodeNoise > 0.84 && oreSubNoise > 0.60 && !nearWater) {
        if (oreLodeNoise > 0.92) {
          map[y][x] = TileType.IronVein;
        } else {
          map[y][x] = TileType.CopperVein;
        }
        continue;
      }

      // 2. Organic Forest Grove Density Noise (Tuned for scenic, sparse clusters with generous meadows and clearings)
      const groveNoise = multiOctaveNoise(wx * 0.65, wy * 0.65, 3, 0.5, 2.0, worldSeed + 33);
      const subVariation = multiOctaveNoise(wx * 1.4, wy * 1.4, 2, 0.5, 2.0, worldSeed + 55);

      if (biome === 'forest') {
        // Sparse, scenic forest groves with wide clearings and open meadow walks
        if (groveNoise > 0.58) {
          if (nearWater) {
            if (subVariation < 0.08) {
              map[y][x] = TileType.Bush; // Rare berry bush on grassy water bank
            }
          } else if (subVariation >= 0.35 && subVariation <= 0.68) {
            // Naturally spaced trees with room to breathe and maneuver
            if (subVariation < 0.50) {
              map[y][x] = TileType.BirchTree;
            } else {
              map[y][x] = TileType.Tree;
            }
          } else if (subVariation > 0.94) {
            map[y][x] = TileType.Bush; // Occasional berry bush on grove periphery
          }
        } else if (groveNoise > 0.54 && subVariation > 0.96) {
          map[y][x] = TileType.Bush; // Rare solitary wild foraging bush
        }
      } else if (biome === 'tundra' || biome === 'glacial') {
        // Sparse pine clusters and frosted taiga pines
        if (groveNoise > 0.60) {
          if (nearWater) {
            if (subVariation < 0.06) {
              map[y][x] = TileType.Bush;
            }
          } else if (subVariation >= 0.35 && subVariation <= 0.68) {
            map[y][x] = TileType.PineTree;
          } else if (subVariation > 0.95) {
            map[y][x] = TileType.Bush;
          }
        }
      } else if (biome === 'desert') {
        // Very sparse desert scrub & dry cacti
        if (groveNoise > 0.72 && subVariation > 0.92) {
          map[y][x] = TileType.Bush;
        }
      } else if (biome === 'volcanic') {
        // Very sparse charred ash shrubs
        if (groveNoise > 0.75 && subVariation > 0.93) {
          map[y][x] = TileType.Bush;
        }
      } else if (biome === 'swamp') {
        // Sparse murky dead trees & occasional marsh vegetation
        if (groveNoise > 0.60) {
          if (subVariation >= 0.35 && subVariation <= 0.68) {
            map[y][x] = TileType.Tree;
          } else if (subVariation > 0.94 && !nearWater) {
            map[y][x] = TileType.Bush;
          }
        }
      }
    }
  }
}
