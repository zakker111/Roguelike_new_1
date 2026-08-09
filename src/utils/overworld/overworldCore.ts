import { TileType } from '../../types';
import { getOrganicBiome as getOrganicBiomeModule, getOrganicNoise as getOrganicNoiseModule } from '../../world/overworldBiomes';
import {
  getBuildingCoordinates as getBuildingCoordinatesModule,
  hasTownAtChunk as hasTownAtChunkModule,
  isCastleTownAtChunk as isCastleTownAtChunkModule,
  getDeterministicTownName as getDeterministicTownNameModule,
  buildModularTownSquare as buildModularTownSquareModule,
  buildCastleKeep as buildCastleKeepModule,
  getSettlementTier as getSettlementTierModule,
} from '../../world/overworldStructures';

let currentWorldSeed = 8675309;

// Calculate building positions from JSON expressions like "width - 12" safely without eval
export function getBuildingCoordinates(width: number, height: number, chunkX?: number, chunkY?: number): any[] {
  return getBuildingCoordinatesModule(width, height, chunkX, chunkY, prng);
}

export function setWorldSeed(seed: number) {
  currentWorldSeed = seed;
}

export function getCurrentWorldSeed(): number {
  return currentWorldSeed;
}

export function randomizeTownAndCastleLayouts(): number {
  const newSeed = Math.floor(Math.random() * 9000000) + 1000000;
  setWorldSeed(newSeed);
  const width = 50;
  const height = 30;

  const baseBuildings = getBuildingCoordinates(width, height);
  const randomizedHouses = baseBuildings.map((building) => {
    const shiftX = Math.floor(Math.random() * 9) - 4; // -4 to +4
    const shiftY = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const sizeW = Math.floor(Math.random() * 4) - 1; // -1 to +2
    const sizeH = Math.floor(Math.random() * 3) - 1; // -1 to +1
    const w = Math.max(5, Math.min(14, building.w + sizeW));
    const h = Math.max(4, Math.min(10, building.h + sizeH));
    const x = Math.max(4, Math.min(width - w - 4, building.x + shiftX));
    const y = Math.max(3, Math.min(height - h - 3, building.y + shiftY));
    return {
      ...building,
      x,
      y,
      w,
      h
    };
  });
  (window as any).customHouses = randomizedHouses;
  return newSeed;
}

// Simple deterministic hash based on coordinates and current world seed to keep chunk generation stable yet randomizable
export function prng(x: number, y: number, localSeed: number = 0): number {
  const hash = Math.sin(x * 12.9898 + y * 78.233 + localSeed + (currentWorldSeed % 100000)) * 43758.5453123;
  return hash - Math.floor(hash);
}

// Deterministic smooth organic noise based on low-frequency sine/cosine waves to make contiguous regions
export function getOrganicNoise(x: number, y: number, offset: number): number {
  return getOrganicNoiseModule(x, y, offset, currentWorldSeed);
}

// Determine Biome using an organic, Whittaker-like temperature/moisture transition system
export function getOrganicBiome(chunkX: number, chunkY: number): 'forest' | 'desert' | 'tundra' | 'swamp' {
  return getOrganicBiomeModule(chunkX, chunkY, currentWorldSeed);
}

export function hasTownAtChunk(chunkX: number, chunkY: number): boolean {
  return hasTownAtChunkModule(chunkX, chunkY, prng);
}

export function isCastleTownAtChunk(chunkX: number, chunkY: number): boolean {
  return isCastleTownAtChunkModule(chunkX, chunkY, prng);
}

export function getSettlementTier(chunkX: number, chunkY: number) {
  return getSettlementTierModule(chunkX, chunkY, prng);
}

export function getDeterministicTownName(cx: number, cy: number): string {
  return getDeterministicTownNameModule(cx, cy, currentWorldSeed, prng);
}

export function buildModularTownSquare(map: TileType[][], cx: number, cy: number, seedVal: number) {
  return buildModularTownSquareModule(map, cx, cy, seedVal);
}

export function buildCastleKeep(
  map: TileType[][],
  startX: number,  startY: number,  w: number,  h: number,  secondFloorMap?: TileType[][]
) {
  return buildCastleKeepModule(map, startX, startY, w, h, secondFloorMap);
}

// Translate 24h clock minutes to string
export function formatGameTime(minutes: number): { timeStr: string, isNight: boolean, period: string } {
  const normMin = minutes % 1440;
  const hr = Math.floor(normMin / 60);
  const min = normMin % 60;
  const isNight = hr >= 20 || hr < 6;
  const hrPad = String(hr).padStart(2, '0');
  const minPad = String(min).padStart(2, '0');

  let period = "Morning";
  if (hr >= 12 && hr < 17) period = "Afternoon";
  else if (hr >= 17 && hr < 21) period = "Evening";
  else if (hr >= 21 || hr < 6) period = "Night";
  return {
    timeStr: `${hrPad}:${minPad}`,
    isNight,
    period
  };
}

// Safety guard: ensure NO npcs spawn in walls or other solid/blocked tiles
export function isTileSafeForNpc(tile: TileType): boolean {
  return (
    tile !== TileType.Wall &&
    tile !== TileType.Window &&
    tile !== TileType.Tree &&
    tile !== TileType.PineTree &&
    tile !== TileType.BirchTree &&
    tile !== TileType.CopperVein &&
    tile !== TileType.IronVein &&
    tile !== TileType.Water &&
    tile !== TileType.Table &&
    tile !== TileType.Campfire &&
    tile !== TileType.Empty &&
    tile !== TileType.WatchtowerWall &&
    tile !== TileType.WatchtowerSlit &&
    tile !== TileType.WatchtowerBarricade &&
    tile !== TileType.WatchtowerFlag &&
    tile !== TileType.Bed &&
    tile !== TileType.Chair &&
    tile !== TileType.Fireplace &&
    tile !== TileType.Torch &&
    tile !== TileType.Sign &&
    tile !== TileType.DungeonEntrance &&
    tile !== TileType.TownGate &&
    tile !== TileType.Bush &&
    tile !== TileType.Door
  );
}

export function findNearestSafeNpcTile(
  startX: number,
  startY: number,
  map: TileType[][]
): { x: number; y: number } {
  const height = map.length;
  const width = map[0].length;
  if (startY >= 0 && startY < height && startX >= 0 && startX < width) {
    if (isTileSafeForNpc(map[startY][startX])) {
      return { x: startX, y: startY };
    }
  }
  // Spiral search out to a radius of 20 tiles
  for (let r = 1; r <= 20; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {        if (Math.abs(dx) === r || Math.abs(dy) === r) {
          const testX = startX + dx;
          const testY = startY + dy;
          if (testY >= 0 && testY < height && testX >= 0 && testX < width) {
            if (isTileSafeForNpc(map[testY][testX])) {
              return { x: testX, y: testY };
            }
          }
        }
      }
    }
  }
  // Fallback to center town crossroad
  return { x: Math.floor(width / 2), y: Math.floor(height / 2) };
}
