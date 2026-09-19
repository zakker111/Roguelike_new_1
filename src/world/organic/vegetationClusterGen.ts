import { TileType } from '../../types';
import { multiOctaveNoise } from './biomeNoiseEngine';
import { prng } from '../../utils/overworld';

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

      // 1. Ore Vein Lodes: Clustered along natural geological mineral belts
      const mineralBelt = multiOctaveNoise(wx * 0.35, wy * 0.35, 2, 0.5, 2.0, worldSeed + 123);
      const pOre = prng(wx, wy, 77);
      if (mineralBelt > 0.54 && pOre > 0.978 && !nearWater) {
        if (mineralBelt > 0.63 && pOre > 0.988) {
          map[y][x] = TileType.IronVein;
        } else {
          map[y][x] = TileType.CopperVein;
        }
        continue;
      }

      // 2. Flora: Trees and Foragable Berry Bushes
      const groveNoise = multiOctaveNoise(wx * 0.35, wy * 0.35, 3, 0.5, 2.0, worldSeed + 33);
      const pFlora = prng(wx, wy, 99);

      if (biome === 'forest') {
        if (groveNoise > 0.44) {
          if (pFlora < 0.28) {
            if (pFlora < 0.14) {
              map[y][x] = TileType.BirchTree;
            } else {
              map[y][x] = TileType.Tree;
            }
          } else if (pFlora > 0.93) {
            map[y][x] = TileType.Bush; // Berry bush cluster on grove edge
          }
        } else {
          if (pFlora < 0.04) {
            map[y][x] = TileType.BirchTree;
          } else if (pFlora > 0.96) {
            map[y][x] = TileType.Bush; // Solitary wild foraging berry bush in sunny meadows
          }
        }
      } else if (biome === 'tundra' || biome === 'glacial') {
        if (groveNoise > 0.45) {
          if (pFlora < 0.25) {
            map[y][x] = TileType.PineTree;
          } else if (pFlora > 0.94) {
            map[y][x] = TileType.Bush; // Glacial frostbloom bush
          }
        } else {
          if (pFlora < 0.03) {
            map[y][x] = TileType.PineTree;
          } else if (pFlora > 0.965) {
            map[y][x] = TileType.Bush;
          }
        }
      } else if (biome === 'swamp') {
        if (groveNoise > 0.44) {
          if (pFlora < 0.25) {
            map[y][x] = TileType.Tree;
          } else if (pFlora > 0.93) {
            map[y][x] = TileType.Bush; // Bioluminescent nightshade shrub
          }
        } else {
          if (pFlora < 0.03) {
            map[y][x] = TileType.Tree;
          } else if (pFlora > 0.96) {
            map[y][x] = TileType.Bush;
          }
        }
      } else if (biome === 'desert') {
        if (pFlora > 0.975) {
          map[y][x] = TileType.Bush; // Rare desert aloe / scrub
        }
      } else if (biome === 'volcanic') {
        if (pFlora > 0.980) {
          map[y][x] = TileType.Bush; // Rare charred ash shrub
        }
      }
    }
  }
}
