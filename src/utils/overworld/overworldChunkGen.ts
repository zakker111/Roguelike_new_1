import { TileType, OverworldChunk, NPC, Enemy, Chest, Trap } from '../../types';
import worldConfig from '../../data/worldConfig.json';
import {
  prng,
  getOrganicBiome,
  hasTownAtChunk,
  isCastleTownAtChunk,
  isRuinedCityAtChunk,
  getDeterministicTownName,
  findNearestSafeNpcTile,
  isTileSafeForNpc,
} from './overworldCore';
import { getValidWeatherForBiome, WeatherType } from '../weatherEngine';
import { generateTownChunk } from './overworldTownGen';
import { generateWildernessChunk } from './overworldWildernessGen';
import { generateRuinedCityChunk } from '../../world/ruinedCity';
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
  let weather: WeatherType = 'clear';
  for (const [wType, freq] of Object.entries(weatherFreqs)) {
    cumulative += freq as number;
    if (wRoll <= cumulative) {
      weather = wType as WeatherType;
      break;
    }
  }
  weather = getValidWeatherForBiome(biome, weather);

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
  const props: any[] = [];

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
    props,
    poisList,
    hasTown,
    townName,
    isPortTown,
    isCastleTown,
  };

  const isRuinedCity = isRuinedCityAtChunk(chunkX, chunkY);

  if (hasTown) {
    generateTownChunk(ctx);
  } else if (isRuinedCity) {
    const ruined = generateRuinedCityChunk(
      chunkX,
      chunkY,
      playerStats?.level || 1,
      20
    );
    // Copy tiles
    for (let y = 0; y < Math.min(height, ruined.tiles.length); y++) {
      for (let x = 0; x < Math.min(width, ruined.tiles[0].length); x++) {
        map[y][x] = ruined.tiles[y][x];
      }
    }
    enemies.push(...ruined.enemies);
    npcs.push(...ruined.npcs);
    if (ruined.props) {
      props.push(...ruined.props);
    }
    towns.push({ x: 10, y: 10, name: ruined.name });
    poisList.push({
      id: `ruined_city_${chunkX}_${chunkY}`,
      x: 10,
      y: 10,
      name: ruined.name,
      type: 'ruins',
      description: 'Contested battleground controlled by rival Orc Clans and Bandit Syndicates.'
    });
  } else {
    generateWildernessChunk(ctx);
  }

  // --- LIVELY OVERWORLD: WILD CAMPS & CARAVAN AMBUSH PROCEDURAL SPAWNER ---
  if (!isRuinedCity) {
    spawnLivelyOverworldEntities(ctx);
  }

  // Sanitize ALL NPC coordinates (position, home, work) to strictly prevent spawning inside windows, walls, or solid obstacles
  npcs.forEach((npc) => {
    const targetMap = (npc.z === 1 && ctx.secondFloorMap) ? ctx.secondFloorMap : map;
    const currentTile = targetMap[npc.y]?.[npc.x];
    if (currentTile === TileType.Window || !isTileSafeForNpc(currentTile)) {
      const safePos = findNearestSafeNpcTile(npc.x, npc.y, targetMap);
      npc.x = safePos.x;
      npc.y = safePos.y;
    }

    if (npc.homeX !== undefined && npc.homeY !== undefined) {
      const homeMap = (npc.homeZ === 1 && ctx.secondFloorMap) ? ctx.secondFloorMap : map;
      const homeTile = homeMap[npc.homeY]?.[npc.homeX];
      if (homeTile === TileType.Window || !isTileSafeForNpc(homeTile)) {
        const safeHome = findNearestSafeNpcTile(npc.homeX, npc.homeY, homeMap);
        npc.homeX = safeHome.x;
        npc.homeY = safeHome.y;
      }
    }

    if (npc.workX !== undefined && npc.workY !== undefined) {
      const workTile = map[npc.workY]?.[npc.workX];
      if (workTile === TileType.Window || !isTileSafeForNpc(workTile)) {
        const safeWork = findNearestSafeNpcTile(npc.workX, npc.workY, map);
        npc.workX = safeWork.x;
        npc.workY = safeWork.y;
      }
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
    props: (ctx.props && ctx.props.length > 0) ? ctx.props : props,
    biome,
    weather,
    pois: ctx.poisList,
    watchtower: ctx.watchtower,
    secondFloorMap: ctx.secondFloorMap,
    secondFloorDiscovered: ctx.secondFloorDiscovered,
    secondFloorVisible: ctx.secondFloorVisible,
  };
}
