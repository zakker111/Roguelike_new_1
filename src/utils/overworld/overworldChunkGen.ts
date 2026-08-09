import { TileType, OverworldChunk, NPC, Enemy, Chest, Trap } from '../../types';
import worldConfig from '../../data/worldConfig.json';
import {
  prng,
  getOrganicBiome,
  hasTownAtChunk,
  isCastleTownAtChunk,
  getDeterministicTownName,
  findNearestSafeNpcTile,
} from './overworldCore';
import { generateTownChunk } from './overworldTownGen';
import { generateWildernessChunk } from './overworldWildernessGen';
import { spawnLivelyOverworldEntities } from './overworldLivelySpawners';
import { OverworldGenContext } from './types';

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
  const poisList: any[] = [];

  const hasTown = hasTownAtChunk(chunkX, chunkY);
  const townName = hasTown ? getDeterministicTownName(chunkX, chunkY) : '';
  const isPortTown =
    hasTown &&
    ((chunkX === 3 && chunkY === -2) ||
      townName.toLowerCase().includes('port') ||
      townName.toLowerCase().includes('harbor') ||
      townName.toLowerCase().includes('bay'));
  const isCastleTown = isCastleTownAtChunk(chunkX, chunkY);

  const ctx: OverworldGenContext = {
    chunkX,
    chunkY,
    width,
    height,
    spawnedCats,
    spawnedSeppo,
    playerStats,
    currentWeapon,
    biome,
    weather,
    map,
    npcs,
    enemies,
    chests,
    traps,
    dungeons,
    towns,
    poisList,
    hasTown,
    townName,
    isPortTown,
    isCastleTown,
  };

  if (hasTown) {
    generateTownChunk(ctx);
  } else {
    generateWildernessChunk(ctx);
  }

  // --- LIVELY OVERWORLD: WILD CAMPS & CARAVAN AMBUSH PROCEDURAL SPAWNER ---
  spawnLivelyOverworldEntities(ctx);

  // Sanitize NPC work coordinates
  npcs.forEach((npc) => {
    if (npc.workX !== undefined && npc.workY !== undefined) {
      const safeWork = findNearestSafeNpcTile(npc.workX, npc.workY, map);
      npc.workX = safeWork.x;
      npc.workY = safeWork.y;
    }
  });

  // Pre-fill fog arrays
  const discovered = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));
  const visible = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));

  return {
    chunkX,
    chunkY,
    map,
    discovered,
    visible,
    enemies: ctx.enemies,
    traps: ctx.traps,
    chests: ctx.chests,
    npcs: ctx.npcs,
    lootPiles: [],
    dungeons: ctx.dungeons,
    towns: ctx.towns,
    biome,
    weather,
    pois: ctx.poisList,
    watchtower: ctx.watchtower,
    secondFloorMap: ctx.secondFloorMap,
    secondFloorDiscovered: ctx.secondFloorDiscovered,
    secondFloorVisible: ctx.secondFloorVisible,
  };
}
