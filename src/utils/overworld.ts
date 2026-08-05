import { TileType, OverworldChunk, NPC, Enemy, EnemyState, EnemyType, Chest, Trap, TrapType, WatchtowerState } from '../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from './itemsData';
import { getEnemyTemplate } from './dungeon';
import { POI_BLUEPRINTS, getPOIBlueprint } from '../data/worldHistory';
import townTemplates from '../data/townTemplates.json';
import worldConfig from '../data/worldConfig.json';
import { getOrganicBiome as getOrganicBiomeModule, getOrganicNoise as getOrganicNoiseModule } from '../world/overworldBiomes';
import {
  getBuildingCoordinates as getBuildingCoordinatesModule,
  hasTownAtChunk as hasTownAtChunkModule,
  isCastleTownAtChunk as isCastleTownAtChunkModule,
  getDeterministicTownName as getDeterministicTownNameModule,
  buildModularTownSquare as buildModularTownSquareModule,
  buildCastleKeep as buildCastleKeepModule,
  getSettlementTier as getSettlementTierModule,
} from '../world/overworldStructures';
import {
  generateWatchtowerPOI,
  generateRuinsPOI,
  generatePointsOfInterest,
} from '../world/poiGenerators';
import {
  buildHouse,
  decorateBuildingFromJSON,
  parseCoord,
} from '../world/structureGenerators';

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
  startX: number,
  startY: number,
  w: number,
  h: number,
  secondFloorMap?: TileType[][]
) {
  return buildCastleKeepModule(map, startX, startY, w, h, secondFloorMap);
}

export function generateOverworldChunk(
  chunkX: number,
  chunkY: number,
  width: number,
  height: number,
  spawnedCats?: string[],
  spawnedSeppo?: boolean,
  playerStats?: { level: number; str: number; dex: number; int: number; cha: number; lck: number },
  currentWeapon?: { damage: number; name?: string } | null
): OverworldChunk {
  // Determine Biome using our organic, Whittaker-like temperature/moisture transition system
  const biome = getOrganicBiome(chunkX, chunkY);

  // Determine initial weather dynamically using biome-specific frequencies defined in WorldConfig
  const weatherFreqs = (worldConfig.weatherFrequencies as any)[biome] || { clear: 1.0 };
  const wRoll = prng(chunkX, chunkY, 442);
  let cumulative = 0;
  let weather: 'clear' | 'rainy' | 'foggy' | 'snowy' = 'clear';
  for (const [wType, freq] of Object.entries(weatherFreqs)) {
    cumulative += freq as number;
    if (wRoll <= cumulative) {
      weather = wType as any;
      break;
    }
  }

  const map: TileType[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(TileType.Grass));

  const npcs: NPC[] = [];
  const enemies: Enemy[] = [];
  const chests: Chest[] = [];
  const traps: Trap[] = [];
  const dungeons: { x: number; y: number; id: string; targetDepth: number }[] = [];
  const towns: { x: number; y: number; name: string }[] = [];
  let watchtower: WatchtowerState | undefined = undefined;

  let secondFloorMap: TileType[][] | undefined = undefined;
  let secondFloorDiscovered: boolean[][] | undefined = undefined;
  let secondFloorVisible: boolean[][] | undefined = undefined;

  const hasTown = hasTownAtChunk(chunkX, chunkY);
  const townName = hasTown ? getDeterministicTownName(chunkX, chunkY) : '';
  const isPortTown = hasTown && (chunkX === 3 && chunkY === -2 || townName.toLowerCase().includes('port') || townName.toLowerCase().includes('harbor') || townName.toLowerCase().includes('bay'));
  const isCastleTown = isCastleTownAtChunk(chunkX, chunkY);

  if (hasTown) {
    // GENERATE A TOWN CHUNK
    towns.push({ x: Math.floor(width / 2), y: Math.floor(height / 2), name: townName });

    // Lay down paths/roads (horizontal and vertical crossroad in the town center)
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);

    for (let x = 0; x < width; x++) {
      map[midY][x] = TileType.Path;
      if (midY + 1 < height) map[midY + 1][x] = TileType.Path;
    }
    for (let y = 0; y < height; y++) {
      map[y][midX] = TileType.Path;
      if (midX + 1 < width) map[y][midX + 1] = TileType.Path;
    }

    // Place dynamic modular central town square
    buildModularTownSquare(map, midX, midY, chunkX * 7 + chunkY * 13);

    // Add wooden town Signpost next to the road intersection
    map[midY - 1][midX + 2] = TileType.Sign;

    // Build houses from dynamic JSON-configured templates
    let housesList = getBuildingCoordinates(width, height, chunkX, chunkY);

    // Apply deterministic building size & position shifts per chunk town!
    // This perfectly fulfills "make the villager buildings vary on size"
    housesList = housesList.map((building) => {
      // Create a deterministic hash seed for the building on this chunk
      const bHash1 = prng(chunkX, chunkY, building.id.charCodeAt(0) * 11);
      const bHash2 = prng(chunkX, chunkY, (building.id.charCodeAt(building.id.length - 1) || 99) * 19);

      const shiftX = Math.floor(bHash1 * 7) - 3; // -3 to +3
      const shiftY = Math.floor(bHash2 * 5) - 2; // -2 to +2
      const sizeW = Math.floor(bHash1 * 4) - 1; // -1 to +2
      const sizeH = Math.floor(bHash2 * 3) - 1; // -1 to +1

      let w = Math.max(5, Math.min(14, building.w + sizeW));
      let h = Math.max(4, Math.min(10, building.h + sizeH));

      // Make sure the tavern is always somewhat wide and barracks matches
      if (building.id === 'tavern') {
        w = Math.max(12, Math.min(16, building.w + sizeW));
        h = Math.max(6, Math.min(10, building.h + sizeH));
      } else if (building.id === 'barracks') {
        w = Math.max(12, Math.min(16, building.w + sizeW));
        h = Math.max(5, Math.min(9, building.h + sizeH));
      }

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

    // Ensure every town has an empty guild house marked by a sign
    housesList.push({
      id: 'empty_guild_house',
      name: 'Empty Guild House (Reserved)',
      x: 38,
      y: 4,
      w: 8,
      h: 7
    });

    // Determine which buildings have second floors deterministically
    const secondFloorBuildings = new Set<string>();
    housesList.forEach((h: any) => {
      const hasSecond = h.id === 'tavern' || h.id === 'library' || (prng(chunkX, chunkY, h.x * 2 + h.y * 5) > 0.45 && h.id !== 'empty_guild_house');
      if (hasSecond) {
        secondFloorBuildings.add(h.id);
      }
    });

    secondFloorMap = Array(height)
      .fill(null)
      .map(() => Array(width).fill(TileType.Empty));
    secondFloorDiscovered = Array(height)
      .fill(null)
      .map(() => Array(width).fill(false));
    secondFloorVisible = Array(height)
      .fill(null)
      .map(() => Array(width).fill(false));

    housesList.forEach((h: any) => {
      const has2nd = secondFloorBuildings.has(h.id);
      const target2ndMap = has2nd ? secondFloorMap : undefined;

      if (h.id === 'barracks' && isCastleTown) {
        buildCastleKeep(map, h.x, h.y, h.w, h.h, target2ndMap);
      } else {
        buildHouse(map, h.x, h.y, h.w, h.h, midY, h.id, target2ndMap);
      }
    });

    // If Castle Town, fortify with robust features!
    if (isCastleTown) {
      // 1. Massive surrounding walls (fully dynamic based on width/height boundaries)
      for (let y = 1; y <= height - 2; y++) {
        map[y][2] = TileType.Wall;
        map[y][width - 3] = TileType.Wall;
      }
      for (let x = 2; x <= width - 3; x++) {
        map[1][x] = TileType.Wall;
        map[height - 2][x] = TileType.Wall;
      }

      // 2. Heavy Gates with flanking towers
      // West Gate
      map[midY][2] = TileType.TownGate;
      map[midY + 1][2] = TileType.TownGate;
      map[midY - 1][1] = TileType.Wall; map[midY - 1][2] = TileType.Wall; map[midY - 1][3] = TileType.Wall;
      map[midY + 2][1] = TileType.Wall; map[midY + 2][2] = TileType.Wall; map[midY + 2][3] = TileType.Wall;

      // East Gate
      map[midY][width - 3] = TileType.TownGate;
      map[midY + 1][width - 3] = TileType.TownGate;
      map[midY - 1][width - 4] = TileType.Wall; map[midY - 1][width - 3] = TileType.Wall; map[midY - 1][width - 2] = TileType.Wall;
      map[midY + 2][width - 4] = TileType.Wall; map[midY + 2][width - 3] = TileType.Wall; map[midY + 2][width - 2] = TileType.Wall;

      // North Gate
      map[1][midX] = TileType.TownGate;
      map[1][midX + 1] = TileType.TownGate;
      map[0][midX - 1] = TileType.Wall; map[1][midX - 1] = TileType.Wall; map[2][midX - 1] = TileType.Wall;
      map[0][midX + 2] = TileType.Wall; map[1][midX + 2] = TileType.Wall; map[2][midX + 2] = TileType.Wall;

      // South Gate
      map[height - 2][midX] = TileType.TownGate;
      map[height - 2][midX + 1] = TileType.TownGate;
      map[height - 3][midX - 1] = TileType.Wall; map[height - 2][midX - 1] = TileType.Wall; map[height - 1][midX - 1] = TileType.Wall;
      map[height - 3][midX + 2] = TileType.Wall; map[height - 2][midX + 2] = TileType.Wall; map[height - 1][midX + 2] = TileType.Wall;

      // 3. Pave Central Courtyard (center-based bounds)
      for (let y = midY - 3; y <= midY + 3; y++) {
        for (let x = midX - 12; x <= midX + 12; x++) {
          if (y >= 0 && y < height && x >= 0 && x < width && map[y][x] === TileType.Grass) {
            map[y][x] = TileType.Floor;
          }
        }
      }

      // Courtyard Torches
      map[midY - 2][midX - 2] = TileType.Torch;
      map[midY - 2][midX + 2] = TileType.Torch;
      map[midY + 2][midX - 2] = TileType.Torch;
      map[midY + 2][midX + 2] = TileType.Torch;
    }

    // If Harbor Port Town, sculpt detailed harbor basin, wooden piers, moored vessels, Harbor Master Hut, Fish Market & Crane staging
    if (isPortTown) {
      // 1. Sculpt Coastal Harbor Water Basin
      for (let y = 0; y < height; y++) {
        for (let x = width - 12; x < width; x++) {
          map[y][x] = TileType.Water;
        }
      }

      // 2. Main Central Pier & Quay Promenade
      for (let x = width - 15; x < width - 1; x++) {
        map[midY - 2][x] = TileType.Path;
        map[midY - 1][x] = TileType.Path;
      }
      // Pier head quay
      for (let y = midY - 3; y <= midY; y++) {
        for (let x = width - 5; x <= width - 2; x++) {
          map[y][x] = TileType.Path;
        }
      }
      map[midY - 2][width - 2] = TileType.Torch; // Pier head beacon lantern

      // 3. North Pier & Moored Vessel ("HMS Tidebreaker")
      for (let x = width - 12; x <= width - 3; x++) {
        map[midY - 7][x] = TileType.Path;
      }
      map[midY - 7][width - 3] = TileType.Sign; // Mooring Sign

      // Vessel 1 hull/deck (HMS Tidebreaker)
      for (let vx = width - 6; vx <= width - 2; vx++) {
        for (let vy = midY - 10; vy <= midY - 8; vy++) {
          if (vy >= 0 && vy < height && vx >= 0 && vx < width) {
            map[vy][vx] = TileType.Floor; // Wooden Ship Deck
          }
        }
        if (midY - 11 >= 0) map[midY - 11][vx] = TileType.Wall; // Vessel Bow/Stern railing
      }
      if (midY - 9 >= 0) {
        map[midY - 9][width - 4] = TileType.Torch; // Ship Mast lantern
        map[midY - 9][width - 5] = TileType.Table; // Deck Cargo crate
      }
      if (midY - 8 >= 0) map[midY - 8][width - 3] = TileType.Sign; // HMS Tidebreaker Banner

      // 4. South Pier & Moored Vessel ("The Salty Siren")
      for (let x = width - 12; x <= width - 3; x++) {
        if (midY + 5 < height) map[midY + 5][x] = TileType.Path;
      }
      if (midY + 5 < height) map[midY + 5][width - 3] = TileType.Sign; // Mooring Sign

      // Vessel 2 hull/deck (The Salty Siren)
      for (let vx = width - 6; vx <= width - 2; vx++) {
        for (let vy = midY + 7; vy <= midY + 9; vy++) {
          if (vy >= 0 && vy < height && vx >= 0 && vx < width) {
            map[vy][vx] = TileType.Floor;
          }
        }
        if (midY + 10 < height) map[midY + 10][vx] = TileType.Wall;
      }
      if (midY + 8 < height) {
        map[midY + 8][width - 4] = TileType.Campfire; // Ship Stove / Deck Fire
        map[midY + 8][width - 5] = TileType.Table; // Fish Barrel crate
      }
      if (midY + 7 < height) map[midY + 7][width - 3] = TileType.Sign; // The Salty Siren Banner

      // 5. Harbor Master Hut (x: width - 18 to width - 13, y: midY - 8 to midY - 4)
      const hmX = width - 18;
      const hmY = midY - 8;
      const hmW = 6;
      const hmH = 5;
      for (let hy = hmY; hy < hmY + hmH; hy++) {
        for (let hx = hmX; hx < hmX + hmW; hx++) {
          if (hy >= 0 && hy < height && hx >= 0 && hx < width) {
            if (hy === hmY || hy === hmY + hmH - 1 || hx === hmX || hx === hmX + hmW - 1) {
              map[hy][hx] = TileType.Wall;
            } else {
              map[hy][hx] = TileType.Floor;
            }
          }
        }
      }
      if (hmY + 2 < height && hmX + hmW - 1 < width) map[hmY + 2][hmX + hmW - 1] = TileType.Door; // Door facing east towards docks
      if (hmY + 1 < height) {
        map[hmY + 1][hmX + 2] = TileType.Table; // Harbor Master Desk
        map[hmY + 1][hmX + 1] = TileType.Chair;
      }
      if (hmY + 3 < height) {
        map[hmY + 3][hmX + 1] = TileType.Bed;
        map[hmY + 3][hmX + 3] = TileType.Torch;
      }
      if (hmY + 2 < height) map[hmY + 2][hmX + hmW] = TileType.Sign; // "⚓ Harbor Master Command Hut"

      // 6. Fish Market & Fishmonger Stalls (x: width - 18 to width - 13, y: midY + 2 to midY + 6)
      const fmX = width - 18;
      const fmY = midY + 2;
      for (let fy = fmY; fy < fmY + 4; fy++) {
        for (let fx = fmX; fx < fmX + 5; fx++) {
          if (fy >= 0 && fy < height && fx >= 0 && fx < width) {
            map[fy][fx] = TileType.Floor;
          }
        }
      }
      if (fmY + 1 < height) map[fmY + 1][fmX + 1] = TileType.Table; // Fresh Fish Display Stall
      if (fmY + 2 < height) map[fmY + 2][fmX + 1] = TileType.Table; // Salted Cod Barrel Counter
      if (fmY + 1 < height) map[fmY + 1][fmX + 3] = TileType.Campfire; // Fish Smokehouse
      if (fmY < height) map[fmY][fmX + 2] = TileType.Sign; // "🐟 Harbor Fresh Catch & Salted Fish Market"

      // 7. Harbor Loading Crane & Cargo Staging Area
      if (midY - 4 >= 0) {
        map[midY - 4][width - 11] = TileType.Table; // Cargo Box 1
        map[midY - 4][width - 10] = TileType.Table; // Cargo Box 2
      }
      if (midY - 3 >= 0) {
        map[midY - 3][width - 11] = TileType.Anvil; // Dock Crane Mooring Winch
        map[midY - 3][width - 10] = TileType.Torch; // Loading Beacon
      }
    }

    // Spawn modular defense force of guards
    const barracksHouse = housesList.find((h: any) => h.id === 'barracks') || housesList[5] || { x: 18, y: height - 11, w: 14, h: 8 };

    // Explicitly place bed tiles in map inside the barracks house so guards have beds to sleep in!
    if (barracksHouse && map) {
      const bY = barracksHouse.y + 1;
      if (bY > 0 && bY < map.length - 1) {
        [2, 4, 6, 8].forEach(offsetX => {
          const bX = barracksHouse.x + offsetX;
          if (bX > 0 && bX < map[0].length - 1) {
            map[bY][bX] = TileType.Bed;
          }
        });
      }
    }

    const bBed1 = { x: barracksHouse.x + 2, y: barracksHouse.y + 1 };
    const bBed2 = { x: barracksHouse.x + 4, y: barracksHouse.y + 1 };
    const bBed3 = { x: barracksHouse.x + 6, y: barracksHouse.y + 1 };

    if (isCastleTown) {
      const blacksmithHouse = housesList.find((h: any) => h.id === 'blacksmith') || housesList[0];

      // Defenses with Archers (bowers), Swordsmen, and Crossbowmen (fully relative)
      const guardPositions = [
        { x: 3, y: midY - 2, role: 'Archer', name: 'Castle Archer Sentry', shift: 'sentry' as const, bed: bBed1 },
        { x: width - 6, y: midY - 2, role: 'Archer', name: 'Castle Archer Sentry', shift: 'sentry' as const, bed: bBed2 },
        { x: midX - 3, y: 3, role: 'Crossbowman', name: 'Gate Crossbow Sentry', shift: 'sentry' as const, bed: bBed3 },
        { x: midX + 3, y: height - 4, role: 'Crossbowman', name: 'Gate Crossbow Sentry', shift: 'sentry' as const, bed: bBed1 },
        { x: midX - 4, y: midY, role: 'Swordsman', name: 'Courtyard Day Guard', shift: 'day' as const, bed: bBed2 },
        { x: barracksHouse.x + 4, y: barracksHouse.y - 1, role: 'Swordsman', name: 'Keep Night Guard', shift: 'night' as const, bed: bBed3 }
      ];

      guardPositions.forEach((g, idx) => {
        let hp = 45;
        let atk = 6;
        let def = 4;
        let range = 1;
        let speed = 1;
        let color = '#3b82f6';
        let char = '🛡';

        if (g.role === 'Archer') {
          hp = 42;
          atk = 8;
          def = 3;
          range = 4;
          speed = 1;
          color = '#10b981'; // Emerald bower
          char = '🏹';
        } else if (g.role === 'Crossbowman') {
          hp = 52;
          atk = 12;
          def = 4;
          range = 3;
          speed = 2; // slow power shots
          color = '#a855f7'; // Purple crossbow
          char = '🏹';
        } else {
          // Swordsman
          hp = 65;
          atk = 9;
          def = 7;
          range = 1;
          speed = 1;
          color = '#2563eb'; // Deep Blue swordsman
          char = '⚔️';
        }

        enemies.push({
          id: `castle_guard_${chunkX}_${chunkY}_${idx + 1}`,
          x: g.x,
          y: g.y,
          type: EnemyType.Goblin, // uses goblin AI pathfinding
          name: g.name,
          hp,
          maxHp: hp,
          atk,
          def,
          range,
          speed,
          color,
          char,
          originalChar: char,
          state: EnemyState.Patrolling,
          isElite: false,
          shift: g.shift,
          barracksBed: g.bed,
          patrolPath: [
            { x: g.x, y: g.y },
            { x: g.x + (g.role === 'Swordsman' ? 6 : 2), y: g.y },
            { x: g.x, y: g.y },
            { x: g.x - (g.role === 'Swordsman' ? 6 : 2), y: g.y }
          ],
          patrolIndex: 0,
          debuffs: [],
          isTownGuard: true
        } as any);
      });
    } else {
      // Spawn standard simple village guards (Oakhaven and Vanguard harbor)
      enemies.push({
        id: `town_guard_${chunkX}_${chunkY}_1`,
        x: midX - 3,
        y: midY,
        type: EnemyType.Goblin,
        name: "Day Patrol Guard",
        hp: 45,
        maxHp: 45,
        atk: 6,
        def: 4,
        range: 1,
        speed: 1,
        color: '#3b82f6', // bright guard blue
        char: '🛡',
        originalChar: '🛡',
        state: EnemyState.Patrolling,
        isElite: false,
        shift: 'day',
        barracksBed: bBed1,
        patrolPath: [
          { x: midX - 8, y: midY },
          { x: midX + 8, y: midY },
          { x: midX, y: midY - 4 },
          { x: midX, y: midY + 4 }
        ],
        patrolIndex: 0,
        debuffs: [],
        isTownGuard: true
      } as any);

      enemies.push({
        id: `town_guard_${chunkX}_${chunkY}_2`,
        x: midX + 3,
        y: midY + 1,
        type: EnemyType.Goblin,
        name: "Night Patrol Guard",
        hp: 45,
        maxHp: 45,
        atk: 6,
        def: 4,
        range: 1,
        speed: 1,
        color: '#3b82f6',
        char: '🛡',
        originalChar: '🛡',
        state: EnemyState.Patrolling,
        isElite: false,
        shift: 'night',
        barracksBed: bBed2,
        patrolPath: [
          { x: midX + 5, y: midY + 5 },
          { x: midX - 5, y: midY - 5 },
          { x: midX + 5, y: midY - 5 },
          { x: midX - 5, y: midY + 5 }
        ],
        patrolIndex: 0,
        debuffs: [],
        isTownGuard: true
      } as any);

      enemies.push({
        id: `town_guard_${chunkX}_${chunkY}_3`,
        x: midX,
        y: midY + 5,
        type: EnemyType.Goblin,
        name: "Gate Sentry",
        hp: 50,
        maxHp: 50,
        atk: 7,
        def: 5,
        range: 1,
        speed: 1,
        color: '#2563eb',
        char: '🛡',
        originalChar: '🛡',
        state: EnemyState.Patrolling,
        isElite: false,
        shift: 'sentry',
        barracksBed: bBed3,
        patrolPath: [
          { x: midX - 3, y: midY + 5 },
          { x: midX + 3, y: midY + 5 }
        ],
        patrolIndex: 0,
        debuffs: [],
        isTownGuard: true
      } as any);
    }

    // Spawn town NPCs
    const getNpcHomeCoords = (house: any, defaultOffsetX = 3, defaultOffsetY = 1) => {
      if (secondFloorBuildings.has(house.id)) {
        return {
          homeX: house.x + house.w - 2,
          homeY: house.y + 1,
          homeZ: 1
        };
      }
      return {
        homeX: house.x + defaultOffsetX,
        homeY: house.y + defaultOffsetY,
        homeZ: 0
      };
    };

    // 1. Blacksmith
    const blacksmithHomeIsShop = prng(chunkX, chunkY, 1111) > 0.4; // 60% chance home is shop
    const blacksmithHouse = housesList.find((h: any) => h.id === 'blacksmith') || housesList[0];
    const blacksmithWorkX = blacksmithHomeIsShop
      ? blacksmithHouse.x + 4
      : midX - 3; // stands next to anvil/forge outside
    const blacksmithWorkY = blacksmithHomeIsShop
      ? blacksmithHouse.y + 4
      : midY - 3;

    const bsHome = getNpcHomeCoords(blacksmithHouse, 3, 1);

    npcs.push({
      id: `npc_blacksmith_${chunkX}_${chunkY}`,
      name: 'Grom Garison (Blacksmith)',
      role: 'blacksmith',
      char: 'B',
      originalChar: 'B',
      color: '#fb923c', // orange color
      x: blacksmithHouse.x + 3, // active start
      y: blacksmithHouse.y + 3,
      z: 0,
      homeX: bsHome.homeX,
      homeY: bsHome.homeY,
      homeZ: bsHome.homeZ,
      workX: blacksmithWorkX,
      workY: blacksmithWorkY,
      workZ: 0,
      isHomeSameAsShop: blacksmithHomeIsShop,
      scheduleState: 'work',
      dialogue: [
        "Hey there! Need some heavy alloys? Mastercraft weapons are my specialty.",
        blacksmithHomeIsShop
          ? "My shop is also my home! I live in the back of this foundry so I can hammer steel at all hours."
          : "I live in the local stone house over there and walk to the town forge every single morning.",
        "Ah, the soot and heat... nothing beats working at the anvil.",
        "Zzz... No more orders tonight, let me sleep..."
      ]
    });

    // 2. Traveling Merchant (lives in Tavern & Inn)
    const tavernHouse = housesList.find((h: any) => h.id === 'tavern') || housesList[0];
    const merchantHomeIsShop = prng(chunkX, chunkY, 2222) > 0.5; // 50% chance her home is her shop
    const merchantHouse = merchantHomeIsShop
      ? (housesList.find((h: any) => h.id === 'villager1' || h.id === 'villager2') || tavernHouse)
      : tavernHouse;
    const merchantWorkX = merchantHomeIsShop
      ? merchantHouse.x + 4
      : midX + 3; // Stands at town square kiosk
    const merchantWorkY = merchantHomeIsShop
      ? merchantHouse.y + 4
      : midY - 2;

    const merHome = getNpcHomeCoords(merchantHouse, 3, 1);

    npcs.push({
      id: `npc_merchant_${chunkX}_${chunkY}`,
      name: 'Adelia Rose (Merchant)',
      role: 'merchant',
      char: 'M',
      originalChar: 'M',
      color: '#f43f5e', // rose crimson
      x: merchantHouse.x + 3,
      y: merchantHouse.y + 3,
      z: 0,
      homeX: merHome.homeX,
      homeY: merHome.homeY,
      homeZ: merHome.homeZ,
      workX: merchantWorkX,
      workY: merchantWorkY,
      workZ: 0,
      isHomeSameAsShop: merchantHomeIsShop,
      scheduleState: 'work',
      dialogue: [
        "Greetings, adventurer! Looking to trade? I sell rare armors, shields, and raw ores.",
        merchantHomeIsShop
          ? "This cozy cottage is both my home and my shop! I love living and selling under one roof."
          : "I rent a bed upstairs at the Tavern & Inn, then hike down here to my town square kiosk to sell goods.",
        "Deeper monsters carry spectacular loot. Bring me the scraps!",
        "Zzz... The shop is closed, come back in the morning."
      ]
    });

    // 3. Apothecary / Sage (lives in Apothecary Shop)
    const apothecaryHomeIsShop = prng(chunkX, chunkY, 3333) > 0.3; // 70% chance his home is his shop
    const apothecaryHouse = housesList.find((h: any) => h.id === 'apothecary') || housesList[1];
    const apothecaryWorkX = apothecaryHomeIsShop
      ? apothecaryHouse.x + 4
      : midX + 4;
    const apothecaryWorkY = apothecaryHomeIsShop
      ? apothecaryHouse.y + 4
      : midY + 3;

    const apoHome = getNpcHomeCoords(apothecaryHouse, 3, 1);

    npcs.push({
      id: `npc_apothecary_${chunkX}_${chunkY}`,
      name: 'Valerius of the Markwell',
      role: 'apothecary',
      char: 'A',
      originalChar: 'A',
      color: '#a855f7', // purple
      x: apothecaryHouse.x + 3,
      y: apothecaryHouse.y + 3,
      z: 0,
      homeX: apoHome.homeX,
      homeY: apoHome.homeY,
      homeZ: apoHome.homeZ,
      workX: apothecaryWorkX,
      workY: apothecaryWorkY,
      workZ: 0,
      isHomeSameAsShop: apothecaryHomeIsShop,
      scheduleState: 'work',
      dialogue: [
        "Dungeons are filled with dangerous gas and spikes... Drink a health potion to recover!",
        apothecaryHomeIsShop
          ? "This alchemical lab is my home! The scent of boiling mushrooms helps me sleep."
          : "I live here at the Apothecary, but walk over to my town square alchemy stand to sell daily.",
        "Have you seen the strange ruins out north?",
        "Zzz... Dreaming of spellcraft and starflowers..."
      ]
    });

    // 3.5 Tavern Master (InnkeeperBarnaby - lives & works in Tavern)
    npcs.push({
      id: `npc_tavernmaster_${chunkX}_${chunkY}`,
      name: 'Innkeeper Barnaby',
      role: 'tavern_master' as any,
      char: 'T',
      originalChar: 'T',
      color: '#f59e0b', // warm golden yellow
      x: tavernHouse.x + 3,
      y: tavernHouse.y + 3,
      z: 0,
      homeX: tavernHouse.x + tavernHouse.w - 2,
      homeY: tavernHouse.y + 2,
      homeZ: 1,
      workX: tavernHouse.x + 5, // stands at the counter in Tavern
      workY: tavernHouse.y + 4,
      workZ: 0,
      isHomeSameAsShop: true,
      scheduleState: 'work',
      dialogue: [
        "Warm hearth, cold beer! Come take a rest, or browse our fresh baked goods!",
        "My home is the Tavern itself! I live in the back room and run the counter all day.",
        "Drunk brawls spill from the tavern quite often, keep an eye on active overworld events!",
        "Zzz... Sweep the floor for me, will you..."
      ]
    });

    // 3.6 Drunk Villager inside the Tavern/Inn
    const isDrunkSpawned = prng(chunkX, chunkY, 1234) > 0.25; // 75% chance to spawn a drunk villager
    if (isDrunkSpawned) {
      const drunkNames = ['Drunk Seppo', 'Uncle Pete', 'Tipsy Toby', 'Loud Larry', 'Drunken Miller', 'Oakhaven Stumbler'];
      const drunkName = drunkNames[Math.floor(prng(chunkX, chunkY, 5678) * drunkNames.length)];
      npcs.push({
        id: `npc_drunkvillager_${chunkX}_${chunkY}`,
        name: `${drunkName} (Drunk Patron)`,
        role: 'drunk_villager' as any,
        char: '🥴',
        originalChar: '🥴',
        color: '#f43f5e', // Flush pink
        x: tavernHouse.x + 2,
        y: tavernHouse.y + 3,
        z: 0,
        homeX: tavernHouse.x + 2,
        homeY: tavernHouse.y + 1,
        homeZ: 1,
        workX: tavernHouse.x + 2,
        workY: tavernHouse.y + 3,
        workZ: 0,
        scheduleState: 'leisure',
        dialogue: [
          "Thiss tavern... is... spinny! Wait, is that a giant salmon in your pocket? Hic!",
          "I bet my left boot that Tobias is actually two goblins in a heavy leather trench coat!",
          "Another pint of that glowing lavender brew, Barnaby! *Burps*",
          "Zzz... No more tavern brawls... *mumbles about catalyst gems*"
        ]
      });
    }

    // 4. Strolling Villager (lives in Villager Cottage Left)
    const villagerHouse = housesList.find((h: any) => h.id === 'villager1') || housesList[3];
    const vilHome = getNpcHomeCoords(villagerHouse, 3, 1);

    npcs.push({
      id: `npc_villager_${chunkX}_${chunkY}`,
      name: 'Pip (Town Crier)',
      role: 'villager',
      char: 'V',
      originalChar: 'V',
      color: '#38bdf8', // sky blue
      x: villagerHouse.x + 3,
      y: villagerHouse.y + 3,
      z: 0,
      homeX: vilHome.homeX,
      homeY: vilHome.homeY,
      homeZ: vilHome.homeZ,
      workX: midX - 4, // strolls near crossroad
      workY: midY + 4,
      workZ: 0,
      scheduleState: 'work',
      dialogue: [
        "Hear ye, hear ye! Caves have appeared to the east and south!",
        "They say the dungeon crawls run 5 floors deep and contain a Forge Artifact!",
        "I love Oakhaven. It's safe... as long as we keep the town gates locked.",
        "Zzz... Just five more minutes..."
      ]
    });

    // 5. Town Notice Quest Board
    npcs.push({
      id: `npc_questboard_${chunkX}_${chunkY}`,
      name: 'Quest Board',
      role: 'quest_board' as any,
      char: '▤',
      originalChar: '▤',
      color: '#fbbf24', // amber yellow
      x: midX,
      y: midY - 2,
      z: 0,
      homeX: midX,
      homeY: midY - 2,
      homeZ: 0,
      workX: midX,
      workY: midY - 2,
      workZ: 0,
      scheduleState: 'work',
      dialogue: [
        "A heavy wooden post-board with pinned letters and bounty notices."
      ]
    });

    // 6. Recruitable blade companion (lives in Villager Cottage Right)
    const companionHouse = housesList.find((h: any) => h.id === 'villager2') || housesList[4];
    const isGuard = (Math.abs(chunkX + chunkY) % 2 === 0);
    const compHome = getNpcHomeCoords(companionHouse, 3, 1);

    npcs.push({
      id: `npc_companion_${chunkX}_${chunkY}`,
      name: isGuard ? 'Arne (Shield Guard)' : 'Sade (Agile Thief)',
      role: 'companion_hire' as any,
      char: isGuard ? '🛡' : '🗡',
      originalChar: isGuard ? '🛡' : '🗡',
      color: isGuard ? '#60a5fa' : '#34d399',
      x: companionHouse.x + 3,
      y: companionHouse.y + 3,
      z: 0,
      homeX: compHome.homeX,
      homeY: compHome.homeY,
      homeZ: compHome.homeZ,
      workX: midX + 2,
      workY: midY + 4,
      workZ: 0,
      scheduleState: 'leisure',
      dialogue: isGuard
        ? ["I can watch your back and block blows. Hire me for 180 Gold!"]
        : ["Need lockpicks and critical backstabs? I can tag along for 180 Gold."]
    });

    // 6.5 Spawning of legendary cats: Jekku, Pulla, Alli, Leevi (only if they have not been spawned yet in this gameplay)
    const catRoll = prng(chunkX, chunkY, 7772);
    const activeSpawnedCats = spawnedCats || [];
    
    if (catRoll < 0.015 && !activeSpawnedCats.includes('Jekku')) {
      npcs.push({
        id: `npc_cat_jekku`,
        name: 'Jekku (Legendary Cat)',
        role: 'special_cat' as any,
        char: '🐈',
        color: '#fb923c', // Orange
        x: midX - 2,
        y: midY + 1,
        homeX: midX - 2,
        homeY: midY + 1,
        workX: midX - 1,
        workY: midY + 2,
        scheduleState: 'leisure',
        dialogue: [
          "*Meow!* I am Jekku, the elusive orange trickster. I can guide your steps and keep you company!",
          "*Mew!* Let me join your party! I won't eat much scrap wood, I promise!",
          "*Purr...* (Nudges your ankles softly and chirps happily)"
        ]
      });
    } else if (catRoll >= 0.015 && catRoll < 0.030 && !activeSpawnedCats.includes('Pulla')) {
      npcs.push({
        id: `npc_cat_pulla`,
        name: 'Pulla (Legendary Cat)',
        role: 'special_cat' as any,
        char: '🐈',
        color: '#eab308', // Yellow / Cinnamon
        x: midX + 2,
        y: midY + 1,
        homeX: midX + 2,
        homeY: midY + 1,
        workX: midX + 1,
        workY: midY + 2,
        scheduleState: 'leisure',
        dialogue: [
          "*Prrrt!* I am Pulla, the chubby golden companion. Let's explore together!",
          "*Meow...* Do you have any fresh grilled fish? Just kidding, I'll follow you anyway!",
          "*Purr...* (Rolls over showing a fluffy, warm belly)"
        ]
      });
    } else if (catRoll >= 0.030 && catRoll < 0.045 && !activeSpawnedCats.includes('Alli')) {
      npcs.push({
        id: `npc_cat_alli`,
        name: 'Alli (Legendary Cat)',
        role: 'special_cat' as any,
        char: '🐈',
        color: '#cbd5e1', // Slate gray / Silver
        x: midX,
        y: midY + 2,
        homeX: midX,
        homeY: midY + 2,
        workX: midX,
        workY: midY + 3,
        scheduleState: 'leisure',
        dialogue: [
          "*Miau!* I am Alli, the mystical silver cat. The depths hold no fear for me.",
          "*Meow!* I can follow you into the dark abyss. Shall we go?",
          "*Purr...* (Blinks slowly with wise, glowing eyes)"
        ]
      });
    } else if (catRoll >= 0.045 && catRoll < 0.060 && !activeSpawnedCats.includes('Leevi')) {
      npcs.push({
        id: `npc_cat_leevi`,
        name: 'Leevi (Legendary Cat)',
        role: 'special_cat' as any,
        char: '🐈',
        color: '#f43f5e', // Crimson / Angry Red
        x: midX,
        y: midY - 2,
        homeX: midX,
        homeY: midY - 2,
        workX: midX + 1,
        workY: midY - 1,
        scheduleState: 'leisure',
        dialogue: [
          "*Hiss!* I am Leevi, the eternally angry cat. Touch me and you lose a finger!",
          "*Growl...* What are you staring at, adventurer? Fine, I'll follow you. But don't expect any cuddles!",
          "*Mrowr!* (Glares at you with intense, fiery yellow eyes and swishes his tail aggressively)"
        ]
      });
    }

    // 7. Nautical Population & Harbor Master Command Force
    if (isPortTown) {
      // 7.1 Harbor Master Captain Jack
      npcs.push({
        id: `npc_captain_${chunkX}_${chunkY}`,
        name: 'Captain Jack (Harbor Master)',
        role: 'harbor_master' as any,
        char: '⚓',
        color: '#2dd4bf', // teal
        x: width - 16,
        y: midY - 6,
        homeX: width - 17,
        homeY: midY - 5,
        workX: width - 16,
        workY: midY - 6,
        scheduleState: 'work',
        dialogue: [
          "Ahoy, traveler! I oversee vessel registrations, nautical charts, and sea port logistics.",
          "Looking for fresh salted cod, whale oil, or coastal sea charts? Check our harbor inventory!",
          "I can also arrange ferried passage across the coastal bays for 200 Gold.",
          "Zzz... Restful sleep after a day at the harbor desk..."
        ]
      });

      // 7.2 Fishmonger Finnegan
      npcs.push({
        id: `npc_fishmonger_${chunkX}_${chunkY}`,
        name: 'Finnegan (Fishmonger)',
        role: 'fishmonger' as any,
        char: '🐟',
        color: '#38bdf8', // cyan
        x: width - 16,
        y: midY + 3,
        homeX: width - 16,
        homeY: midY + 3,
        workX: width - 16,
        workY: midY + 3,
        scheduleState: 'work',
        dialogue: [
          "Fresh harbor catch and salted ocean cod! Direct from the fishing trawlers!",
          "Inland desert merchants pay massive gold for salted cod. Stock up before you travel!",
          "Smell that fresh ocean breeze? Nothing better than a early morning catch.",
          "Zzz... The fish stop biting at night..."
        ]
      });

      // 7.3 Dockworker Bram
      npcs.push({
        id: `npc_dockworker_${chunkX}_${chunkY}`,
        name: 'Bram (Dockworker)',
        role: 'dockworker' as any,
        char: '📦',
        color: '#f59e0b', // amber
        x: width - 11,
        y: midY - 3,
        homeX: width - 11,
        homeY: midY - 3,
        workX: width - 11,
        workY: midY - 3,
        scheduleState: 'work',
        dialogue: [
          "Heave-ho! Heavy barrels of ship pitch and refined whale oil coming off the ships!",
          "We operate the harbor cranes day and night to keep international trade moving.",
          "Watch your step on the wet wooden pier planks—they're slick with ocean spray!",
          "Zzz... My shoulders ache from carrying iron anchors..."
        ]
      });

      // 7.4 Old Sailor Seabert
      npcs.push({
        id: `npc_sailor_${chunkX}_${chunkY}`,
        name: 'Seabert (Old Sailor)',
        role: 'sailor' as any,
        char: '⛵',
        color: '#a78bfa', // purple
        x: width - 4,
        y: midY - 9,
        homeX: width - 4,
        homeY: midY - 9,
        workX: width - 4,
        workY: midY - 9,
        scheduleState: 'work',
        dialogue: [
          "Ahoy! The HMS Tidebreaker is tied up at the north pier after battling heavy fog.",
          "I've sailed from glacial northern tundras to scorching desert reef bays. Sunder's waters are wild!",
          "Need waterproof ship pitch for your boots or gear? I've got spare jars.",
          "Zzz... Rocked to sleep by gentle ocean waves..."
        ]
      });

      // 7.5 Ferried Navigator Corin
      npcs.push({
        id: `npc_ferried_nav_${chunkX}_${chunkY}`,
        name: 'Corin (Ferried Navigator)',
        role: 'ferried_navigator' as any,
        char: '🧭',
        color: '#10b981', // emerald
        x: width - 3,
        y: midY - 2,
        homeX: width - 3,
        homeY: midY - 2,
        workX: width - 3,
        workY: midY - 2,
        scheduleState: 'work',
        dialogue: [
          "Greetings, traveler! I pilot the ferried passage between Vanguard Harbor and East Port for 200 Gold.",
          "My nautical sea charts plot every safe channel around coastal reefs and whirlpools.",
          "Speak to me whenever you are ready to set sail!",
          "Zzz... Anchored until daybreak..."
        ]
      });
    }

    // Add visual touch: place anvils and merchant shop stalls in town center near paths
    map[midY - 3][midX - 3] = TileType.Floor; // Forge floor
    map[midY - 2][midX + 3] = TileType.Floor; // Market zone

    // Spawn low-level town pests in the outskirts of the town (safe from immediate village guard agro)
    // This allows players to kill simple low level monsters right away on the starting chunk!
    const outskirtPests = [
      { type: EnemyType.Rat, name: "Outskirt Sewer Rat", x: 6, y: 6 },
      { type: EnemyType.Slime, name: "Town Garden Slime", x: 8, y: height - 7 },
      { type: EnemyType.Goblin, name: "Stray Scavenger Goblin", x: width - 8, y: 7 },
      { type: EnemyType.Spider, name: "Stray Grass Spider", x: width - 7, y: height - 8 },
      { type: EnemyType.Rat, name: "Outskirt Field Mouse", x: 6, y: Math.floor(height / 2) - 4 },
      { type: EnemyType.Slime, name: "Stray Well Slime", x: width - 8, y: Math.floor(height / 2) + 5 }
    ];

    outskirtPests.forEach((pest, idx) => {
      // Find a safe spot near the ideal location (must be on TileType.Grass)
      let pxPos = pest.x;
      let pyPos = pest.y;
      let safeFound = false;

      // Search local area
      for (let r = 0; r < 5 && !safeFound; r++) {
        for (let dx = -r; dx <= r && !safeFound; dx++) {
          for (let dy = -r; dy <= r && !safeFound; dy++) {
            const tx = pxPos + dx;
            const ty = pyPos + dy;
            if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
              if (map[ty][tx] === TileType.Grass) {
                pxPos = tx;
                pyPos = ty;
                safeFound = true;
              }
            }
          }
        }
      }

      if (safeFound) {
        const template = getEnemyTemplate(pest.type);
        // Let's keep them very weak for the starting experience
        const baseHp = template.baseHp; 
        const baseAtk = template.baseAtk;
        const baseDef = template.baseDef;

        enemies.push({
          id: `town_pest_${chunkX}_${chunkY}_${idx}`,
          x: pxPos,
          y: pyPos,
          type: pest.type,
          name: pest.name,
          hp: baseHp,
          maxHp: baseHp,
          atk: baseAtk,
          def: baseDef,
          range: template.range !== undefined ? template.range : 1,
          speed: template.speed !== undefined ? template.speed : 1.0,
          color: template.color,
          char: template.char,
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [
            { x: pxPos, y: pyPos },
            { x: Math.max(1, pxPos - 2), y: pyPos },
            { x: Math.max(1, pxPos - 2), y: Math.max(1, pyPos - 2) },
            { x: pxPos, y: Math.max(1, pyPos - 2) }
          ],
          patrolIndex: 0,
          debuffs: []
        } as any);
      }
    });

    // Place a dungeon entrance in town limits as well, or just in the wild! Let's put one to the east wild!
  } else {
    // GENERATE A WILDERNESS CHUNK WITH COMPLEX BIOMES, HAZARDS, AND ORGANIC LAKES
    const biomeConfig = (worldConfig.environmentalHazards as any)[biome] || { lakeCount: 2, baseLakeRadiusMin: 2, baseLakeRadiusMax: 4, trapCount: 0, trapType: "none" };
    
    // 1. Organic Lakes (Biome-Specific Shapes & Locations loaded from WorldConfig)
    const lakeCount = biomeConfig.lakeCount;
    for (let l = 0; l < lakeCount; l++) {
      // Deterministic center coordinates for lakes (ensure they stay away from direct chunk borders)
      const lakeX = Math.floor(prng(chunkX, chunkY, 100 + l * 20) * (width - 14)) + 7;
      const lakeY = Math.floor(prng(chunkX, chunkY, 150 + l * 20) * (height - 12)) + 6;
      
      const rMin = biomeConfig.baseLakeRadiusMin;
      const rMax = biomeConfig.baseLakeRadiusMax;
      const baseRadius = rMin + Math.floor(prng(chunkX, chunkY, 200 + l * 5) * (rMax - rMin + 1));
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - lakeX;
          const dy = y - lakeY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Organic contouring using deterministic coordinate-based sin/cos noise
          const angle = Math.atan2(dy, dx);
          const contourNoise = Math.sin(angle * 5 + prng(chunkX, chunkY, 300) * 10) * 0.8 + 
                               Math.cos(angle * 3 + prng(chunkX, chunkY, 350) * 10) * 0.5;
          const organicRadius = baseRadius + contourNoise;
          
          if (dist <= organicRadius) {
            // Larger Forest and Swamp lakes feature a majestic 1-tile central grassy islet!
            if (dist < 1.4 && baseRadius >= 4 && (biome === 'forest' || biome === 'swamp')) {
              map[y][x] = TileType.Grass;
            } else {
              map[y][x] = TileType.Water;
            }
          }
        }
      }

      // If islet was generated in the center, decorate it with an ancient tree or sweet berry bush
      if (lakeX >= 0 && lakeX < width && lakeY >= 0 && lakeY < height) {
        if (map[lakeY][lakeX] === TileType.Grass) {
          map[lakeY][lakeX] = (biome === 'forest' || biome === 'tundra') ? TileType.Tree : TileType.Bush;
        }
      }
      
      // Lush vegetation ring around the Desert Oasis!
      if (biome === 'desert' && lakeX >= 0 && lakeX < width && lakeY >= 0 && lakeY < height) {
        const ringRadius = baseRadius + 2.0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dx = x - lakeX;
            const dy = y - lakeY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > baseRadius && dist <= ringRadius && map[y][x] === TileType.Grass) {
              const roll = prng(x, y, 77);
              if (roll > 0.4) {
                map[y][x] = TileType.Tree; // Palm trees around Oasis water edge
              } else if (roll > 0.15) {
                map[y][x] = TileType.Bush; // Dense oasis green shrubs
              }
            }
          }
        }
        
        // Oasis high-value treasure chest!
        const chestX = Math.floor(lakeX + baseRadius - 1);
        const chestY = lakeY;
        if (chestX >= 0 && chestX < width && chestY >= 0 && chestY < height) {
          map[chestY][chestX] = TileType.Floor; // cleared pedestal tile
          chests.push({
            id: `oasis_chest_${chunkX}_${chunkY}`,
            x: chestX,
            y: chestY,
            isOpened: false,
            materials: [
              BASIC_MATERIALS[1].id,
              BASIC_MATERIALS[Math.min(BASIC_MATERIALS.length - 1, Math.floor(prng(chunkX, chunkY, 88) * BASIC_MATERIALS.length))].id
            ],
            catalysts: [
              ELEMENTAL_CATALYSTS[Math.min(ELEMENTAL_CATALYSTS.length - 1, Math.floor(prng(chunkX, chunkY, 89) * ELEMENTAL_CATALYSTS.length))].id
            ],
            gold: Math.floor(prng(chestX, chestY, 90) * 45) + 55
          });
        }
      }
    }

    // 2. Organic Wending River (flows vertically with a nice bridge crossing)
    const riverX = Math.floor(prng(chunkX, chunkY, 1) * (width - 15)) + 7;
    const bridgeY = Math.floor(prng(chunkX, chunkY, 2) * (height - 10)) + 5;

    for (let y = 0; y < height; y++) {
      // Wiggle of current river line
      const riverCurvature = Math.floor(Math.sin((y + chunkY) * 0.4) * 2.5);
      const rx = riverX + riverCurvature;
      
      if (rx >= 1 && rx < width - 1) {
        if (y === bridgeY || y === bridgeY + 1) {
          map[y][rx] = TileType.Path; // Bridge structure
          map[y][rx + 1] = TileType.Path;
        } else {
          map[y][rx] = TileType.Water;
          map[y][rx + 1] = TileType.Water;
        }
      }
    }

    // Place dynamic wooden Signpost next to the road bridge
    const signX = riverX < width - 4 ? riverX + 3 : riverX - 3;
    const signY = bridgeY < height - 3 ? bridgeY + 2 : bridgeY - 2;
    if (signX >= 0 && signX < width && signY >= 0 && signY < height) {
      map[signY][signX] = TileType.Sign;
    }

    // 3. Spawns biome-specific hazards and traps loaded from WorldConfig
    const trapCount = biomeConfig.trapCount || 0;
    const trapTypeStr = biomeConfig.trapType || "none";

    for (let i = 0; i < trapCount; i++) {
      const tx = Math.floor(prng(chunkX, chunkY, 500 + i) * (width - 6)) + 3;
      const ty = Math.floor(prng(chunkX, chunkY, 600 + i) * (height - 6)) + 3;
      if (map[ty]?.[tx] === TileType.Grass) {
        if (trapTypeStr === "poisonGas") {
          traps.push({
            id: `swamp_gas_${chunkX}_${chunkY}_${i}`,
            x: tx,
            y: ty,
            type: TrapType.PoisonGas,
            triggered: false,
            isActive: true,
            hidden: true,
            detected: false,
          });
          map[ty][tx] = TileType.Bush; // camouflage as toxic bush
        } else if (trapTypeStr === "spikes") {
          traps.push({
            id: `tundra_frost_${chunkX}_${chunkY}_${i}`,
            x: tx,
            y: ty,
            type: TrapType.Spikes,
            triggered: false,
            isActive: true,
            hidden: true,
            detected: false,
          });
        } else if (trapTypeStr === "fireVent") {
          traps.push({
            id: `desert_steam_${chunkX}_${chunkY}_${i}`,
            x: tx,
            y: ty,
            type: TrapType.FireVent,
            triggered: false,
            isActive: prng(tx, ty, 33) > 0.5,
            hidden: true,
            detected: false,
          } as any);
          map[ty][tx] = TileType.Campfire; // indicator
        }
      }
    }

    // Organic clustered forests development (clearing surrounding of paths)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === TileType.Grass) {
          let blocked = false;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const adjTile = map[ny][nx];
                if (adjTile === TileType.Path || adjTile === TileType.Door || adjTile === TileType.Water || adjTile === TileType.TownGate || adjTile === TileType.DungeonEntrance) {
                  blocked = true;
                }
              }
            }
          }

          if (!blocked) {
            const noiseVal = prng(x + chunkX * width, y + chunkY * height, 10);
            if (noiseVal < 0.12) {
              const treeTypeNoise = prng(x + chunkX * width, y + chunkY * height, 25);
              if (treeTypeNoise < 0.35) {
                map[y][x] = TileType.PineTree;
              } else if (treeTypeNoise < 0.65) {
                map[y][x] = TileType.BirchTree;
              } else {
                map[y][x] = TileType.Tree;
              }
            } else if (noiseVal < 0.16) {
              if (biome !== 'tundra') {
                map[y][x] = TileType.Bush; // Harvestable bushes
              } else {
                map[y][x] = TileType.PineTree; // Winter biome has snow-laden Pine trees
              }
            } else if (noiseVal < 0.18) {
              const veinNoise = prng(x + chunkX * width, y + chunkY * height, 42);
              if (veinNoise < 0.25) {
                map[y][x] = TileType.CopperVein;
              } else if (veinNoise < 0.45) {
                map[y][x] = TileType.IronVein;
              }
            }
          }
        }
      }
    }

    const isWatchtowerChunk = !hasTown && !isCastleTown && (Math.abs(chunkX) + Math.abs(chunkY)) % 3 === 2 && !(chunkX === 0 && chunkY === 0);

    if (isWatchtowerChunk) {
      watchtower = generateWatchtowerPOI(map, chunkX, chunkY, prng, chests, enemies);
    } else {
      // Spawn a Dungeon Entrance inside a small 3x3 stone building with random entrance door position
      const dungX = Math.floor(prng(chunkX, chunkY, 3) * (width - 10)) + 5;
      const dungY = Math.floor(prng(chunkX, chunkY, 4) * (height - 8)) + 4;

      let canPlaceDungeonBuilding = true;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const tx = dungX + dx;
          const ty = dungY + dy;
          if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
            if (map[ty][tx] === TileType.Water || map[ty][tx] === TileType.Path) {
              canPlaceDungeonBuilding = false;
            }
          } else {
            canPlaceDungeonBuilding = false;
          }
        }
      }

      if (canPlaceDungeonBuilding) {
        // Build 3x3 walls
        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            map[dungY + dy][dungX + dx] = TileType.Wall;
          }
        }
        // Center of 3x3 building gets Floor + DungeonEntrance
        map[dungY + 1][dungX + 1] = TileType.Floor;
        map[dungY + 1][dungX + 1] = TileType.DungeonEntrance;

        // Random position for door (south, west, or east)
        const doorRand = Math.floor(prng(dungX, dungY, 82) * 3);
        if (doorRand === 0) {
          map[dungY + 2][dungX + 1] = TileType.Door; // South
        } else if (doorRand === 1) {
          map[dungY + 1][dungX] = TileType.Door; // West
        } else {
          map[dungY + 1][dungX + 2] = TileType.Door; // East
        }

        dungeons.push({
          x: dungX + 1,
          y: dungY + 1,
          id: `dungeon_${chunkX}_${chunkY}`,
          targetDepth: 1
        });
      } else {
        // Fallback single tile
        if (map[dungY] && map[dungY][dungX] !== TileType.Water && map[dungY][dungX] !== TileType.Path) {
          map[dungY][dungX] = TileType.DungeonEntrance;
          dungeons.push({
            x: dungX,
            y: dungY,
            id: `dungeon_${chunkX}_${chunkY}`,
            targetDepth: 1
          });
        }
      }

      // Spawn some atmospheric ruined buildings in the wild with premium loot chest!
      const spawnRuins = prng(chunkX, chunkY, 150) > 0.55;
      if (spawnRuins) {
        generateRuinsPOI(map, chunkX, chunkY, biome, width, height, prng, chests, enemies);
      }
    }

    // Scatter a couple of resource Chests in the woods loaded from WorldConfig
    const chestCount = biomeConfig.chestCount !== undefined ? biomeConfig.chestCount : 2;
    for (let i = 0; i < chestCount; i++) {
      const cx = Math.floor(prng(chunkX, chunkY, 5 + i) * (width - 6)) + 3;
      const cy = Math.floor(prng(chunkX, chunkY, 15 + i) * (height - 6)) + 3;
      if (map[cy]?.[cx] === TileType.Grass) {
        const gold = Math.floor(prng(cx, cy, 7) * 20) + 10;
        const chestMats = [BASIC_MATERIALS[0].id];
        if (prng(cx, cy, 8) > 0.6) chestMats.push(BASIC_MATERIALS[1].id);
        chests.push({
          id: `overworld_chest_${chunkX}_${chunkY}_${i}`,
          x: cx,
          y: cy,
          isOpened: false,
          materials: chestMats,
          catalysts: prng(cx, cy, 9) > 0.5 ? [ELEMENTAL_CATALYSTS[Math.floor(prng(cx, cy, 10) * ELEMENTAL_CATALYSTS.length)].id] : [],
          gold
        });
      }
    }

    // Spawn wild monsters roaming the grassy fields with biome-specific styles and naming loaded from WorldConfig!
    const minM = biomeConfig.monsterCountMin !== undefined ? biomeConfig.monsterCountMin : 2;
    const maxM = biomeConfig.monsterCountMax !== undefined ? biomeConfig.monsterCountMax : 4;
    const monsterCount = minM + Math.floor(prng(chunkX, chunkY, 12) * (maxM - minM + 1)); 
    for (let i = 0; i < monsterCount; i++) {
      const mx = Math.floor(prng(chunkX, chunkY, 100 + i) * (width - 4)) + 2;
      const my = Math.floor(prng(chunkX, chunkY, 200 + i) * (height - 4)) + 2;

      if (map[my]?.[mx] === TileType.Grass) {
        const mRoll = prng(mx, my, 99);
        let type = EnemyType.Rat;

        if (mRoll > 0.95) {
          if (biome === 'forest' && mRoll > 0.98) {
            type = EnemyType.Otso; // Rare golden bear spirit boss!
          } else if (biome === 'tundra' && mRoll > 0.97) {
            type = EnemyType.Louhi; // Rare Mistress of Pohjola boss!
          } else if (biome === 'swamp' && mRoll > 0.97) {
            type = EnemyType.IkuTurso; // Finnish ancient sea leviathan boss!
          } else {
            type = EnemyType.Dragon;
          }
        } else if (mRoll > 0.70) {
          if (biome === 'swamp' && mRoll > 0.82) {
            type = EnemyType.Kalma; // Finnish grave/death goddess!
          } else {
            type = EnemyType.OrcBrute;
          }
        } else if (mRoll > 0.45) {
          if (biome === 'forest' && mRoll > 0.58) {
            type = EnemyType.Hiisi; // Finnish forest fiend!
          } else if (biome === 'tundra' && mRoll > 0.58) {
            type = EnemyType.Kalma; // Grave goddess haunts the cold northern soil
          } else {
            type = EnemyType.Goblin;
          }
        } else if (mRoll > 0.25) {
          if (biome === 'swamp' && mRoll > 0.35) {
            type = EnemyType.Nakki; // Finnish water spirit!
          } else {
            type = EnemyType.SkeletonMage;
          }
        }

        const template = getEnemyTemplate(type);
        let name = "Wild " + template.name;
        if (type === EnemyType.Hiisi || type === EnemyType.Nakki || type === EnemyType.Otso || type === EnemyType.Louhi || type === EnemyType.IkuTurso || type === EnemyType.Kalma) {
          name = template.name; // Keep pure epic name
        }
        let char = template.char;
        let color = template.color;
        
        // Custom Biome Skins for monsters!
        if (biome === 'desert') {
          if (type === EnemyType.Rat) {
            name = "Desert Sand Beetle";
            char = '🐞';
            color = '#ea580c';
          } else if (type === EnemyType.Goblin) {
            name = "Dune Nomad Nomad";
            char = '⚲';
            color = '#f59e0b';
          } else if (type === EnemyType.OrcBrute) {
            name = "Sand Golem";
            char = '⚙';
            color = '#d97706';
          } else if (type === EnemyType.SkeletonMage) {
            name = "Sun Priest Pyromancer";
            char = '☄';
            color = '#fbbf24';
          } else if (type === EnemyType.Dragon) {
            name = "Desert Sun-Drake Dragon";
            char = '🐉';
            color = '#f97316';
          }
        } else if (biome === 'tundra') {
          if (type === EnemyType.Rat) {
            name = "Frost Biter Rat";
            char = '🐀';
            color = '#e2e8f0';
          } else if (type === EnemyType.Goblin) {
            name = "Frost Goblin";
            char = '❄';
            color = '#93c5fd';
          } else if (type === EnemyType.OrcBrute) {
            name = "Abominable Yeti";
            char = '⛄';
            color = '#ffffff';
          } else if (type === EnemyType.SkeletonMage) {
            name = "Ice Cryomancer Lich";
            char = '☸';
            color = '#38bdf8';
          } else if (type === EnemyType.Dragon) {
            name = "Glacial Frost-Wyrm Dragon";
            char = '🐉';
            color = '#cbd5e1';
          }
        } else if (biome === 'swamp') {
          if (type === EnemyType.Rat) {
            name = "Swamp Mud Slime";
            char = 'o';
            color = '#10b981';
          } else if (type === EnemyType.Goblin) {
            name = "Bog Lurker Sneak";
            char = '♟';
            color = '#84cc16';
          } else if (type === EnemyType.OrcBrute) {
            name = "Marsh Troll Giant";
            char = '☈';
            color = '#15803d';
          } else if (type === EnemyType.SkeletonMage) {
            name = "Swamp Witch Doctor";
            char = '✨';
            color = '#a855f7';
          } else if (type === EnemyType.Dragon) {
            name = "Noxious Acid Drake Dragon";
            char = '🐉';
            color = '#10b981';
          }
        } else {
          // Default/forest biome
          if (type === EnemyType.Dragon) {
            name = "Emerald Forest Dragon";
            char = '🐉';
            color = '#22c55e';
          }
        }

        let baseHp = template.baseHp;
        let baseAtk = template.baseAtk;
        let baseDef = template.baseDef;

        // Buff swamp monsters and yeti slightly for high end challenge value!
        if (biome === 'swamp') {
          baseHp = Math.floor(baseHp * 1.2);
          baseAtk += 1;
        } else if (biome === 'tundra' && type === EnemyType.OrcBrute) {
          baseHp = Math.floor(baseHp * 1.3); // Yeti is extra bulky!
        }

        // Apply scale difficulty more based on playerStats and weapon in hand
        let playerScaleCoeff = 1.0;
        if (playerStats) {
          const pLevel = playerStats.level || 1;
          const totalStats = (playerStats.str || 10) + 
                              (playerStats.dex || 10) + 
                              (playerStats.int || 10) + 
                              (playerStats.cha || 10) + 
                              (playerStats.lck || 10);
          const statExcess = Math.max(0, totalStats - 50);
          const statBonusFactor = statExcess * 0.01; // +1% per allocated stat point
          const levelBonusFactor = Math.max(0, pLevel - 1) * 0.05; // +5% per level above level 1
          playerScaleCoeff += levelBonusFactor + statBonusFactor;
        }
        
        if (currentWeapon) {
          const weaponVal = Math.max(0, currentWeapon.damage || 0);
          const weaponBonusFactor = weaponVal * 0.02; // +2% per weapon damage point
          playerScaleCoeff += weaponBonusFactor;
        }

        // Overworld scale factor: scale HP smoothly, but damp attack scaling to prevent 1-shots
        baseHp = Math.round(baseHp * playerScaleCoeff);
        const atkScaleCoeff = 1.0 + (playerScaleCoeff - 1.0) * 0.35;
        baseAtk = Math.round(baseAtk * atkScaleCoeff);
        baseDef = Math.round(baseDef * atkScaleCoeff);

        enemies.push({
          id: `wild_enemy_${chunkX}_${chunkY}_${i}`,
          x: mx,
          y: my,
          type,
          name,
          hp: baseHp,
          maxHp: baseHp,
          atk: baseAtk,
          def: baseDef,
          range: template.range !== undefined ? template.range : (type === EnemyType.Dragon ? 3 : (type === EnemyType.SkeletonMage ? 4 : 1)),
          speed: template.speed !== undefined ? template.speed : 1,
          color,
          char,
          state: EnemyState.Patrolling,
          isBoss: type === EnemyType.Otso || type === EnemyType.Louhi || type === EnemyType.IkuTurso,
          isElite: prng(mx, my, 25) > 0.88,
          eliteEffect: prng(mx, my, 25) > 0.88 ? 'Scurrying' : undefined,
          patrolPath: [
            { x: mx, y: my },
            { x: Math.max(1, mx - 3), y: my },
            { x: Math.max(1, mx - 3), y: Math.max(1, my - 3) },
            { x: mx, y: Math.max(1, my - 3) }
          ],
          patrolIndex: 0,
          debuffs: []
        });
      }
    }

    // Spawn biome-appropriate harmless wild animals!
    const animalCount = Math.floor(prng(chunkX, chunkY, 33) * 3) + 2; 
    for (let i = 0; i < animalCount; i++) {
      const ax = Math.floor(prng(chunkX, chunkY, 300 + i) * (width - 4)) + 2;
      const ay = Math.floor(prng(chunkX, chunkY, 400 + i) * (height - 4)) + 2;

      if (map[ay]?.[ax] === TileType.Grass) {
        const aRoll = prng(ax, ay, 88);
        let animalType: 'deer' | 'boar' | 'sheep' = 'sheep';
        
        // Visual characters and labels customized by biome!
        let char = '🐑';
        let color = '#f8fafc';
        let hp = 6;
        let name = "Wild Sheep";

        if (biome === 'desert') {
          if (aRoll > 0.5) {
            animalType = 'deer';
            char = '🐪'; // Desert Camel!
            color = '#d97706';
            hp = 18;
            name = "Desert Camel";
          } else {
            animalType = 'sheep';
            char = '🦎'; // Desert Lizard
            color = '#84cc16';
            hp = 5;
            name = "Desert Horned Lizard";
          }
        } else if (biome === 'tundra') {
          if (aRoll > 0.5) {
            animalType = 'boar';
            char = '🐺'; // Arctic wolf
            color = '#94a3b8';
            hp = 16;
            name = "Arctic Icewolf"; // Neutral wolf!
          } else {
            animalType = 'deer';
            char = '🦌'; // caribou
            color = '#cbd5e1';
            hp = 12;
            name = "Wild Caribou";
          }
        } else if (biome === 'swamp') {
          if (aRoll > 0.5) {
            animalType = 'boar';
            char = '🐊'; // Caiman alligator
            color = '#14532d';
            hp = 22;
            name = "Swamp Caiman";
          } else {
            animalType = 'sheep';
            char = '🐸'; // Toxic toad
            color = '#22c55e';
            hp = 4;
            name = "Marsh Bullfrog";
          }
        } else {
          // Standard forest animals
          if (aRoll > 0.70) {
            animalType = 'deer';
            char = '🦌';
            color = '#d97706';
            hp = 8;
            name = "Wild Deer";
          } else if (aRoll > 0.35) {
            animalType = 'boar';
            char = '🐗';
            color = '#a1a1aa';
            hp = 14;
            name = "Wild Boar";
          } else {
            animalType = 'sheep';
            char = '🐐';
            color = '#f8fafc';
            hp = 10;
            name = "Wild Mountain Goat";
          }
        }

        let finalEnemyType = EnemyType.WildlifeGoat;
        if (animalType === 'deer') {
          finalEnemyType = EnemyType.WildlifeDeer;
        } else if (animalType === 'boar') {
          finalEnemyType = EnemyType.WildlifeBoar;
        }

        enemies.push({
          id: `wild_animal_${chunkX}_${chunkY}_${i}`,
          x: ax,
          y: ay,
          type: finalEnemyType,
          name,
          hp,
          maxHp: hp,
          atk: 0,
          def: 0,
          range: 1,
          speed: 1,
          color,
          char,
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [
            { x: ax, y: ay },
            { x: Math.max(1, ax - 2), y: Math.min(height - 2, ay + 2) }
          ],
          patrolIndex: 0,
          debuffs: [],
          isAnimal: true,
          animalType
        });
      }
    }

    // 6. Spawn drunk wandering merchant Seppo (rarely in wilderness)
    let seppoX = -1;
    let seppoY = -1;
    if (!hasTown) {
      const seppoRoll = prng(chunkX, chunkY, 9912);
      if (seppoRoll < 0.04) {
        // Find a grass tile near the center
        for (let attempts = 0; attempts < 100; attempts++) {
          const rx = 10 + Math.floor(prng(chunkX * 17, chunkY * 13, attempts + 1) * (width - 20));
          const ry = 6 + Math.floor(prng(chunkX * 11, chunkY * 19, attempts + 2) * (height - 12));
          if (map[ry]?.[rx] === TileType.Grass) {
            seppoX = rx;
            seppoY = ry;
            break;
          }
        }
        
        if (seppoX !== -1) {
          npcs.push({
            id: `npc_seppo`,
            name: 'Seppo (Wandering Merchant)',
            role: 'merchant_seppo' as any,
            char: 'S',
            color: '#ff7e5f', // Coral pink/orange
            x: seppoX,
            y: seppoY,
            homeX: seppoX,
            homeY: seppoY,
            workX: seppoX,
            workY: seppoY,
            scheduleState: 'leisure',
            dialogue: [
              "*Hic!* Oh... hello there, traveler! Have you seen my reindeer? No? Then buy my stuff... *hic!* I have... premium goods, straight from my secret forest bath! *burp*",
              "They told me not to wander into the swamp. But... *hic*... swamp has the best yeast for brewing! Do you want a sip?",
              "A true warrior... *hic*... respects a solid tree trunk! Look at this Sisu Hammer! I found it in a ditch, works perfectly!",
              "*Mumbles*... I am completely sober... absolutely sober. Yes! Want to buy some authentic Seppo's secret hooch? It's... *hic*... 100% organic!",
              "*Clinks bottles together*... Ah, the sweet music of spirits! Sells for a bargain, buys... wait, what are we buying again?"
            ]
          });
        }
      }
    }
  }

  // --- LIVELY OVERWORLD: WILD CAMPS & CARAVAN AMBUSH PROCEDURAL SPAWNER ---
  let isCampPlaced = false;
  let isCaravanPlaced = false;

  if (!hasTown) {
    const campAndCaravanSeed = prng(chunkX * 19, chunkY * 31, 5543);
    
    if (campAndCaravanSeed < 0.28) {
      // 28% chance of a Hostile Wild Camp
      const campTypeRoll = prng(chunkX * 2, chunkY * 5, 122);
      let campType: 'outlaw' | 'goblin' | 'syndicate' | 'vanguard' = 'outlaw';
      if (campTypeRoll < 0.30) {
        campType = 'outlaw';
      } else if (campTypeRoll < 0.60) {
        campType = 'goblin';
      } else if (campTypeRoll < 0.80) {
        campType = 'syndicate';
      } else {
        campType = 'vanguard';
      }
      
      // Try to find a flat grass area away from borders
      let campX = -1;
      let campY = -1;
      for (let attempts = 0; attempts < 100; attempts++) {
        const rx = 10 + Math.floor(prng(chunkX * 13, chunkY * 17, attempts + 10) * (width - 20));
        const ry = 6 + Math.floor(prng(chunkX * 19, chunkY * 11, attempts + 11) * (height - 12));
        
        if (map[ry]?.[rx] === TileType.Grass) {
          let isSafe = true;
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              const tile = map[ry + dy]?.[rx + dx];
              if (tile && tile !== TileType.Grass && tile !== TileType.Tree && tile !== TileType.PineTree && tile !== TileType.BirchTree) {
                isSafe = false;
              }
            }
          }
          if (isSafe) {
            campX = rx;
            campY = ry;
            break;
          }
        }
      }

      if (campX !== -1) {
        isCampPlaced = true;
        // Build the Camp:
        // Center has a campfire
        map[campY][campX] = TileType.Campfire;
        
        // Stools/chairs around the campfire
        if (map[campY + 1]?.[campX] === TileType.Grass) map[campY + 1][campX] = TileType.Chair;
        if (map[campY - 1]?.[campX] === TileType.Grass) map[campY - 1][campX] = TileType.Chair;
        
        // Barricades / Tents flanking the campfire
        if (map[campY]?.[campX - 1] === TileType.Grass) map[campY][campX - 1] = TileType.Wall;
        if (map[campY]?.[campX + 1] === TileType.Grass) map[campY][campX + 1] = TileType.Wall;
        if (map[campY - 2]?.[campX - 1] === TileType.Grass) map[campY - 2][campX - 1] = TileType.Wall;
        if (map[campY - 2]?.[campX + 1] === TileType.Grass) map[campY - 2][campX + 1] = TileType.Wall;
        
        // Add torches for lighting
        if (map[campY + 1]?.[campX - 2] === TileType.Grass) map[campY + 1][campX - 2] = TileType.Torch;
        if (map[campY + 1]?.[campX + 2] === TileType.Grass) map[campY + 1][campX + 2] = TileType.Torch;

        // Faction-specific additions
        if (campType === 'vanguard') {
          // Dawn Vanguard Holy Shrine
          if (map[campY + 2]?.[campX] === TileType.Grass) {
            map[campY + 2][campX] = TileType.Sign;
          }
          // Spawn Vanguard Crusade Captain NPC
          npcs.push({
            id: `npc_vanguard_${chunkX}_${chunkY}`,
            name: 'Captain Valerius (Vanguard Captain)',
            role: 'faction_vanguard',
            char: 'V',
            color: '#fbbf24',
            x: campX + 1,
            y: campY + 1,
            homeX: campX + 1,
            homeY: campY + 1,
            workX: campX + 1,
            workY: campY + 1,
            scheduleState: 'work',
            dialogue: [
              'Praise the morning sun! The Vanguard Crusade maintains this holy sanctuary.',
              'Our garrison defends the outer borders. Tread lightly and respect our golden vaults.',
              'Donate to our crusade or pray at our Holy Shrine for an active healing blessing.'
            ]
          });
        } else if (campType === 'syndicate') {
          // Spawn Syndicate Smuggler NPC
          npcs.push({
            id: `npc_syndicate_${chunkX}_${chunkY}`,
            name: 'Sly Silas (Syndicate Smuggler)',
            role: 'faction_syndicate',
            char: 'y',
            color: '#a78bfa',
            x: campX - 1,
            y: campY + 1,
            homeX: campX - 1,
            homeY: campY + 1,
            workX: campX - 1,
            workY: campY + 1,
            scheduleState: 'work',
            dialogue: [
              'Greetings, shadow-walker. Silas sells choice lockpicks and shadow crystals, for a fee...',
              'The Syndicate values discretion. Do not touch our vaults and we will remain friendly.',
              'Need to secure some shadow materials? You can always slip me a bribe to rise in the ranks.'
            ]
          });
        }

        // Place a high-tier Loot Chest inside the tent area
        const chestId = campType === 'syndicate' 
          ? `syndicate_chest_${chunkX}_${chunkY}` 
          : campType === 'vanguard' 
            ? `vanguard_chest_${chunkX}_${chunkY}` 
            : `camp_chest_${chunkX}_${chunkY}`;

        chests.push({
          id: chestId,
          x: campX,
          y: campY - 2,
          isOpened: false,
          materials: campType === 'outlaw' 
            ? ['mat_mithril', 'mat_obsidian'] 
            : campType === 'syndicate'
              ? ['mat_thick_hide', 'mat_obsidian']
              : campType === 'vanguard'
                ? ['mat_iron', 'mat_mithril']
                : ['mat_iron', 'mat_mithril', 'mat_feybone'],
          catalysts: campType === 'outlaw' 
            ? ['cat_fire', 'cat_shadow'] 
            : campType === 'syndicate'
              ? ['cat_shadow', 'cat_poison']
              : campType === 'vanguard'
                ? ['cat_fire', 'cat_lightning']
                : ['cat_poison', 'cat_lightning'],
          gold: campType === 'outlaw' ? 120 : campType === 'syndicate' ? 150 : campType === 'vanguard' ? 140 : 100
        });

        // Spawn Hostile guards
        let guardNames = ['Outlaw Brigand', 'Outlaw Marksman', 'Outlaw Desperado'];
        let chars = ['O', 'M', 'D'];
        let colors = ['#f43f5e', '#fb7185', '#ec4899'];
        let enemyTypeStr: any = EnemyType.OrcBrute;

        if (campType === 'goblin') {
          guardNames = ['Goblin Raider', 'Goblin Archer', 'Goblin Pyromaniac'];
          chars = ['g', 'a', 'p'];
          colors = ['#22c55e', '#4ade80', '#10b981'];
          enemyTypeStr = EnemyType.Goblin;
        } else if (campType === 'syndicate') {
          guardNames = ['Syndicate Agent', 'Syndicate Silent Assassin', 'Syndicate Enforcer'];
          chars = ['s', 'a', 'e'];
          colors = ['#a78bfa', '#c084fc', '#8b5cf6'];
          enemyTypeStr = EnemyType.Bandit;
        } else if (campType === 'vanguard') {
          guardNames = ['Vanguard Sentinel', 'Vanguard Marksman', 'Vanguard Crusader'];
          chars = ['S', 'm', 'C'];
          colors = ['#fbbf24', '#f59e0b', '#d97706'];
          enemyTypeStr = EnemyType.OrcBrute;
        }

        // Spawn 3 hostile guards surrounding the camp campfire
        const positions = [
          { dx: -2, dy: -1 },
          { dx: 2, dy: -1 },
          { dx: 0, dy: 2 }
        ];

        positions.forEach((pos, idx) => {
          const gx = campX + pos.dx;
          const gy = campY + pos.dy;
          const guardName = guardNames[idx % guardNames.length];
          const guardChar = chars[idx % chars.length];
          const guardColor = colors[idx % colors.length];

          let gHp = 45;
          let gAtk = 5;
          let gDef = 3;

          if (campType === 'goblin') {
            gHp = 30; gAtk = 4; gDef = 1;
          } else if (campType === 'syndicate') {
            gHp = 55; gAtk = 6; gDef = 4;
          } else if (campType === 'vanguard') {
            gHp = 65; gAtk = 7; gDef = 5;
          }

          enemies.push({
            id: `camp_guard_${chunkX}_${chunkY}_${idx}`,
            x: gx,
            y: gy,
            type: enemyTypeStr,
            name: `${guardName} [Camp Sentry]`,
            hp: gHp,
            maxHp: gHp,
            atk: gAtk,
            def: gDef,
            range: idx === 1 ? 4 : 1, // index 1 is Marksman/Archer with range 4!
            speed: 1,
            color: guardColor,
            char: guardChar,
            state: EnemyState.Patrolling,
            isElite: idx === 2, // Desperado/Pyromaniac/Enforcer/Crusader is elite
            eliteEffect: idx === 2 ? 'Furious' : undefined,
            patrolPath: [{ x: gx, y: gy }, { x: gx + 1, y: gy }, { x: gx, y: gy + 1 }],
            patrolIndex: 0,
            debuffs: [],
            faction: campType
          });
        });
      }
    } else if (campAndCaravanSeed >= 0.28 && campAndCaravanSeed < 0.45) {
      // 17% chance of a Wandering Caravan under active Bandit Ambush
      let caravanX = -1;
      let caravanY = -1;
      
      // Try to find a flat grass area or near paths
      for (let attempts = 0; attempts < 100; attempts++) {
        const rx = 12 + Math.floor(prng(chunkX * 17, chunkY * 19, attempts + 20) * (width - 24));
        const ry = 8 + Math.floor(prng(chunkX * 23, chunkY * 13, attempts + 21) * (height - 16));
        
        if (map[ry]?.[rx] === TileType.Grass) {
          let isSafe = true;
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              const tile = map[ry + dy]?.[rx + dx];
              if (tile && tile !== TileType.Grass && tile !== TileType.Path && tile !== TileType.Tree && tile !== TileType.PineTree && tile !== TileType.BirchTree) {
                isSafe = false;
              }
            }
          }
          if (isSafe) {
            caravanX = rx;
            caravanY = ry;
            break;
          }
        }
      }

      if (caravanX !== -1) {
        isCaravanPlaced = true;
        // Build the active caravan layout:
        // Place a Carriage sign / box
        if (map[caravanY]?.[caravanX] === TileType.Grass) map[caravanY][caravanX] = TileType.Sign;
        if (map[caravanY]?.[caravanX + 1] === TileType.Grass) map[caravanY][caravanX + 1] = TileType.Table;

        // Spawn interactive Baron Tobias NPC as Baron Tobias (Caravan Merchant)
        npcs.push({
          id: `ambushed_merchant_${chunkX}_${chunkY}`,
          name: 'Baron Tobias (Caravan Merchant)',
          role: 'merchant_caravan_ambushed' as any,
          char: 'C',
          color: '#fbbf24',
          x: caravanX,
          y: caravanY + 1,
          homeX: caravanX,
          homeY: caravanY + 1,
          workX: caravanX,
          workY: caravanY + 1,
          scheduleState: 'work',
          dialogue: [
            "Help! We are being ambushed by bloodthirsty bandits! Defeat them all, and I'll grant you our coveted Rare Trade License!",
            "They came from the forest line... they want our fine alloys! Protect us, brave warrior!",
            "If we survive, my cargo is yours at extreme wholesale prices!"
          ]
        });

        // Spawn allied Caravan Sentries
        enemies.push({
          id: `caravan_ally_${chunkX}_${chunkY}_1`,
          name: 'Caravan defender [Allied]',
          char: '🛡',
          color: '#60a5fa',
          hp: 60,
          maxHp: 60,
          atk: 5,
          def: 3,
          type: EnemyType.OrcBrute,
          x: caravanX - 1,
          y: caravanY,
          state: EnemyState.Patrolling,
          isElite: false,
          patrolPath: [{ x: caravanX - 1, y: caravanY }],
          patrolIndex: 0,
          debuffs: [],
          isTownGuard: true, // treats player as friend, and other monsters as hostiles
          speed: 1.0,
          range: 1
        });

        // Spawn 3 hostile bandit ambushers attacking them
        const ambushers = [
          { name: 'Bandit Pillager', char: 'B', color: '#f43f5e', dx: -3, dy: -1 },
          { name: 'Bandit Cutthroat', char: 'B', color: '#fb7185', dx: -3, dy: 1 },
          { name: 'Goblin Marauder', char: 'G', color: '#10b981', dx: 3, dy: 0 }
        ];

        ambushers.forEach((bnd, idx) => {
          const bx = caravanX + bnd.dx;
          const by = caravanY + bnd.dy;

          enemies.push({
            id: `caravan_bandit_${chunkX}_${chunkY}_${idx}`,
            x: bx,
            y: by,
            type: bnd.char === 'G' ? EnemyType.Goblin : EnemyType.OrcBrute,
            name: `${bnd.name} [Hostile]`,
            hp: 35,
            maxHp: 35,
            atk: 4,
            def: 2,
            range: 1,
            speed: 1,
            color: bnd.color,
            char: bnd.char,
            state: EnemyState.Chasing,
            isElite: false,
            patrolPath: [],
            patrolIndex: 0,
            debuffs: []
          });
        });
      }
    } else if (campAndCaravanSeed >= 0.45 && campAndCaravanSeed < 0.60) {
      // 15% chance of a peaceful Traveling Artificer Caravan!
      let caravanX = -1;
      let caravanY = -1;
      
      // Try to find a flat grass area or near paths
      for (let attempts = 0; attempts < 100; attempts++) {
        const rx = 12 + Math.floor(prng(chunkX * 17, chunkY * 19, attempts + 40) * (width - 24));
        const ry = 8 + Math.floor(prng(chunkX * 23, chunkY * 13, attempts + 41) * (height - 16));
        
        if (map[ry]?.[rx] === TileType.Grass) {
          let isSafe = true;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const tile = map[ry + dy]?.[rx + dx];
              if (tile && tile !== TileType.Grass && tile !== TileType.Path && tile !== TileType.Tree && tile !== TileType.PineTree && tile !== TileType.BirchTree) {
                isSafe = false;
              }
            }
          }
          if (isSafe) {
            caravanX = rx;
            caravanY = ry;
            break;
          }
        }
      }

      if (caravanX !== -1) {
        // Place Carriage sign/table/tent indicators
        if (map[caravanY]?.[caravanX] === TileType.Grass) map[caravanY][caravanX] = TileType.Sign;
        if (map[caravanY]?.[caravanX + 1] === TileType.Grass) map[caravanY][caravanX + 1] = TileType.Table;

        // Customize merchant character, name, color, and dialogue based on biome
        let mChar = '🐎';
        let mColor = '#fbbf24';
        let mName = 'Lord Raymond (Artificer Merchant)';
        let mDialogue = [
          "A fine day for travel on the overworld roads! Would you like to check out my horse-drawn wagon's wares?",
          "I forge heavy Stallion-Sprung Greaves! You can buy enchanted boots from me to cover ground quickly.",
          "Keep an eye out for bandits in the wild! But feel free to browse our fine travelling carriage stock."
        ];

        if (biome === 'desert') {
          mChar = '🐫';
          mColor = '#f59e0b';
          mName = 'Yasmin (Dune Caravaneer)';
          mDialogue = [
            "Peace be upon you, traveler of the sands. My camels carry precious silks, exotic ores, and rare desert spices.",
            "The sun is fierce, but these Dune-Treader Sabatons will protect you from the desert sandstorms and heat fatigue!",
            "Rest here by our tents. Browse our caravans and stock up on dry bread, water, or fresh mountain ales."
          ];
        } else if (biome === 'tundra') {
          mChar = '🐕';
          mColor = '#38bdf8';
          mName = 'Kjell (Frost Sledger)';
          mDialogue = [
            "Hoo! It's freezing! My husky-drawn sled can slide across these glaciers with ease.",
            "I deal in fine furs and robust metals. Care to buy Worg-Spiked gauntlets for combat and wolf taming?",
            "Beware of ice elementals in the caves! If you are cold, grab some fresh warm pie from our stove."
          ];
        } else if (biome === 'swamp') {
          mChar = '🐊';
          mColor = '#10b981';
          mName = 'Gideon (Murky Barger)';
          mDialogue = [
            "Welcome to the bogs, traveler. My crocodile barge slides smoothly over the murky waters.",
            "Watch your step in the quicksand! I sell special thick hides, fish, and poison catalysts.",
            "You can buy Crocodile Bayou Sabatons from me to navigate these bayous at extreme speed and walk on water!"
          ];
        }

        npcs.push({
          id: `caravan_merchant_${chunkX}_${chunkY}`,
          name: mName,
          role: 'merchant_caravan' as any,
          char: mChar,
          color: mColor,
          x: caravanX,
          y: caravanY + 1,
          homeX: caravanX,
          homeY: caravanY + 1,
          workX: caravanX,
          workY: caravanY + 1,
          scheduleState: 'work',
          dialogue: mDialogue
        });
      }
    }
  }

  // Generate immersive Points of Interest (POIs) with World History/Lore snippets
  const poisList: any[] = [];
  if (!hasTown) {
    generatePointsOfInterest(map, chunkX, chunkY, biome, width, height, prng, poisList);
  }

  // Generate immersive Traveling NPCs in chunks where there is no town/city/castle
  if (!hasTown) {
    const travelerRoll = prng(chunkX, chunkY, 8852);
    if (travelerRoll < 0.50) { // 50% chance to spawn one in this wilderness chunk
      const typeRoll = prng(chunkX, chunkY, 3211);
      let tRole: 'traveler_herbalist' | 'traveler_hunter' | 'traveler_pilgrim' = 'traveler_herbalist';
      let tChar = '🌿';
      let tColor = '#10b981'; // Emerald
      let tName = '';
      let tDialogue: string[] = [];

      const herbalistNames = ["Sage Cora", "Gatherer Eli", "Apothecary Maeve", "Alchemist Reed", "Botanist Jaxon"];
      const hunterNames = ["Tracker Silas", "Diana the Bowyer", "Hunter Keith", "Ranger Anya", "Woodsman Logan"];
      const pilgrimNames = ["Pilgrim Paul", "Wanderer Wendy", "Brother Timothy", "Sister Clara", "Peddler Pete"];

      if (typeRoll < 0.33) {
        tRole = 'traveler_herbalist';
        tChar = '🌿';
        tColor = '#34d399'; // Emerald mint
        const nameIdx = Math.floor(prng(chunkX, chunkY, 1) * herbalistNames.length);
        tName = `${herbalistNames[nameIdx]} (Wilderness Herbalist)`;
        tDialogue = [
          "I'm searching for rare starflowers and mountain sage here in the wild. Some of Sunder's finest alchemical herbs grow in these untamed lands.",
          "Be careful with those red mushrooms. Some make a savory stew, but others... well, they'll put you in a very deep sleep.",
          "The wild flora carries the ambient magic of Sunder. Would you like to buy some potent herbs or restorative elixirs?",
          "Zzz... clutching a pouch of lavender and wild chamomile..."
        ];
      } else if (typeRoll < 0.66) {
        tRole = 'traveler_hunter';
        tChar = '🏹';
        tColor = '#fb923c'; // Orange
        const nameIdx = Math.floor(prng(chunkX, chunkY, 2) * hunterNames.length);
        tName = `${hunterNames[nameIdx]} (Wilderness Hunter)`;
        tDialogue = [
          "Tracking some wild boars across these parts. Keep your distance from the old boars; they can charge with nasty force.",
          "I have fresh game meat and thick animal hides. A survivalist's treasure in Sunder's cold nights.",
          "Arrows oiled, bowstring tight. No beast escapes my sights.",
          "Zzz... snoring softly, resting a calloused hand on a bundle of pelts..."
        ];
      } else {
        tRole = 'traveler_pilgrim';
        tChar = '🚶';
        tColor = '#c084fc'; // Purple/Lavender
        const nameIdx = Math.floor(prng(chunkX, chunkY, 3) * pilgrimNames.length);
        tName = `${pilgrimNames[nameIdx]} (Traveling Pilgrim)`;
        tDialogue = [
          "I am traveling between distant settlements to deliver sacred texts and sell minor trinkets.",
          "The roads of Sunder are dangerous these days with Syndicate scouts and bandit bands roaming freely.",
          "Safe travels, friend. Sunder is a harsh and unforgiving land, but there is still beauty to be found in the wilderness.",
          "Zzz... dreaming of paved roads, stone arches, and safe havens..."
        ];
      }

      // Find a safe grass tile for the traveler
      let travX = -1;
      let travY = -1;
      for (let attempts = 0; attempts < 100; attempts++) {
        const rx = 5 + Math.floor(prng(chunkX * 23, chunkY * 19, attempts + 1) * (width - 10));
        const ry = 5 + Math.floor(prng(chunkX * 13, chunkY * 29, attempts + 2) * (height - 10));
        if (map[ry]?.[rx] === TileType.Grass && !npcs.some(n => n.x === rx && n.y === ry)) {
          travX = rx;
          travY = ry;
          break;
        }
      }

      if (travX !== -1 && travY !== -1) {
        npcs.push({
          id: `traveler_${chunkX}_${chunkY}`,
          name: tName,
          role: tRole as any,
          char: tChar,
          color: tColor,
          x: travX,
          y: travY,
          homeX: travX,
          homeY: travY,
          workX: travX,
          workY: travY,
          scheduleState: 'work',
          dialogue: tDialogue
        });
      }
    }
  }

  npcs.forEach((npc) => {
    const safePos = findNearestSafeNpcTile(npc.x, npc.y, map);
    npc.x = safePos.x;
    npc.y = safePos.y;

    if (npc.homeX !== undefined && npc.homeY !== undefined) {
      const safeHome = findNearestSafeNpcTile(npc.homeX, npc.homeY, map);
      npc.homeX = safeHome.x;
      npc.homeY = safeHome.y;
    }

    if (npc.workX !== undefined && npc.workY !== undefined) {
      const safeWork = findNearestSafeNpcTile(npc.workX, npc.workY, map);
      npc.workX = safeWork.x;
      npc.workY = safeWork.y;
    }
  });

  // Pre-fill fog arrays
  const discovered = Array(height).fill(null).map(() => Array(width).fill(false));
  const visible = Array(height).fill(null).map(() => Array(width).fill(false));

  return {
    chunkX,
    chunkY,
    map,
    discovered,
    visible,
    enemies,
    traps,
    chests,
    npcs,
    lootPiles: [],
    dungeons,
    towns,
    biome,
    weather,
    pois: poisList,
    watchtower,
    secondFloorMap,
    secondFloorDiscovered,
    secondFloorVisible
  };
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
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r) {
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
