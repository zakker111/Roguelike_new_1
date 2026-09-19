/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, PlayerStats, GameLogMessage, WeaponBaseType, TileType } from '../types';
import gameConfig from '../data/gameConfig.json';
import { generateOverworldChunk, setWorldSeed } from '../utils/overworld';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../utils/gameUtils';
import { getValidWeatherForBiome } from '../utils/weatherEngine';
import { STARTING_WEAPON, STARTING_ARMOR } from '../utils/spellsAndEquipment';
import { DEFAULT_QUESTS } from '../utils/questData';
import { computeFOV } from '../utils/ai';

export const INITIAL_FACTION_TERRITORIES = {
  'borderlands': {
    id: 'borderlands',
    name: 'Oakhaven Borderlands',
    controller: 'neutral' as const,
    controlPercent: 50,
    contested: true,
    bonusDescription: 'Tax Dividends: 🪙 50 Gold Coins. Buff: +10% Experience Gains.',
    taxGoldAccumulated: 0,
    taxMaterialIdAccumulated: 'mat_wood'
  },
  'shadow_fjord': {
    id: 'shadow_fjord',
    name: 'Shadow Fjord',
    controller: 'neutral' as const,
    controlPercent: 40,
    contested: true,
    bonusDescription: 'Tax Dividends: 🪙 80 Gold Coins. Buff: +15% Mining Yield for copper/iron veins.',
    taxGoldAccumulated: 0,
    taxMaterialIdAccumulated: 'mat_iron'
  },
  'moonshadow_cove': {
    id: 'moonshadow_cove',
    name: 'Moonshadow Cove',
    controller: 'syndicate' as const,
    controlPercent: 80,
    contested: false,
    bonusDescription: 'Tax Dividends: 🪙 100 Gold Coins. Buff: +5% Critical Strike Chance.',
    taxGoldAccumulated: 0,
    taxMaterialIdAccumulated: 'mat_lockpick'
  },
  'sunplate_ridge': {
    id: 'sunplate_ridge',
    name: 'Sunplate Ridge',
    controller: 'vanguard' as const,
    controlPercent: 80,
    contested: false,
    bonusDescription: 'Tax Dividends: 🪙 100 Gold Coins. Buff: +2 Defense Power.',
    taxGoldAccumulated: 0,
    taxMaterialIdAccumulated: 'mat_mithril'
  },
  'swamp_of_whispers': {
    id: 'swamp_of_whispers',
    name: 'Swamp of Whispers',
    controller: 'outlaw' as const,
    controlPercent: 90,
    contested: false,
    bonusDescription: 'Tax Dividends: 🪙 120 Gold Coins. Buff: Poison Resistance (+3 flat reduction from DoTs).',
    taxGoldAccumulated: 0,
    taxMaterialIdAccumulated: 'mat_berry'
  }
};

export const INITIAL_FACTION_WAR_TREASURY = {
  syndicateGold: 500,
  vanguardGold: 500,
  playerContributionSyndicate: 0,
  playerContributionVanguard: 0,
  activeTactics: []
};

export const INITIAL_STARTING_EQUIPMENT = [
  { id: 'axe_steel', name: 'Recruit Hatchet', type: 'weapon' as const, subType: WeaponBaseType.Sword, defense: 0, damage: 5, critChance: 0.10, range: 1, color: '#94a3b8', description: 'A sturdy handaxe for harvesting timber. Works from inventory or equipped! Cannot be repaired.', value: 15, durability: 100, maxDurability: 100, isTool: true, isRepairable: false },
  { id: 'pickaxe_rusty', name: 'Prospectors Pickaxe', type: 'weapon' as const, subType: WeaponBaseType.Hammer, defense: 0, damage: 4, critChance: 0.05, range: 1, color: '#f59e0b', description: 'A sturdy iron pickaxe for mining ore veins. Works from inventory or equipped! Cannot be repaired.', value: 15, durability: 100, maxDurability: 100, isTool: true, isRepairable: false },
  { id: 'armor_leather', name: 'Reinforced Leather Jerkin', type: 'armor' as const, subType: 'LightArmor', defense: 3, damage: 0, critChance: 0, range: 0, color: '#b45309', description: 'Provides decent flexible resistance.', value: 25, durability: 100, maxDurability: 100 },
  { id: 'shield_wooden', name: 'Buckler Shield', type: 'armor' as const, subType: 'Shield', defense: 2, damage: 0, critChance: 0, range: 0, color: '#f59e0b', description: 'A lightweight wooden target shield.', value: 12, durability: 100, maxDurability: 100 },
  { id: 'scroll_recall_town_starting', name: 'Scroll of Recall 📜', type: 'scroll' as any, subType: 'Scroll' as any, defense: 0, damage: 0, critChance: 0, range: 0, color: '#38bdf8', description: 'A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!', value: 200, durability: 100, maxDurability: 100 }
];

export const INITIAL_INVENTORY_MATERIALS = {
  'mat_iron': 3, 'mat_mithril': 1, 'mat_obsidian': 0, 'mat_dragonscale': 0, 'mat_feybone': 0,
  'mat_wood': 5, 'mat_raw_meat': 2, 'mat_cooked_meat': 1, 'mat_berry': 3, 'mat_cooked_pie': 0,
  'mat_beer': 0, 'mat_bread': 0, 'mat_fishing_pole': 1, 'mat_lockpick': 5, 'mat_skeleton_key': 1,
  'mat_raw_fish': 0, 'mat_cooked_fish': 0, 'mat_prime_meat': 0, 'mat_cooked_prime_meat': 0, 'mat_thick_hide': 0
};

export const INITIAL_INVENTORY_CATALYSTS = {
  'cat_fire': 1, 'cat_frost': 0, 'cat_poison': 0, 'cat_lightning': 0, 'cat_shadow': 0
};

export function createFreshPlayerStats(): PlayerStats {
  return {
    ...gameConfig.startingPlayerStats,
    depth: 0,
    turnsPlayed: 0,
    realTimeSeconds: 0,
    scars: [],
    relics: []
  };
}

export function isSafeSpawnTile(x: number, y: number, map: TileType[][]): boolean {
  if (x < 0 || x >= LEVEL_WIDTH || y < 0 || y >= LEVEL_HEIGHT) return false;
  const tile = map[y]?.[x];
  const isBlocked =
    tile === TileType.Wall ||
    tile === TileType.Window ||
    tile === TileType.Tree ||
    tile === TileType.PineTree ||
    tile === TileType.BirchTree ||
    tile === TileType.CopperVein ||
    tile === TileType.IronVein ||
    tile === TileType.Water ||
    tile === TileType.Table ||
    tile === TileType.Campfire ||
    tile === TileType.Anvil;
  return !isBlocked;
}

export function findSafeSpawnPosition(startX: number, startY: number, map: TileType[][]): { x: number; y: number } {
  let pX = startX;
  let pY = startY;
  if (!isSafeSpawnTile(pX, pY, map)) {
    let found = false;
    for (let r = 1; r < 25 && !found; r++) {
      for (let dx = -r; dx <= r && !found; dx++) {
        for (let dy = -r; dy <= r && !found; dy++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) {
            const testX = pX + dx;
            const testY = pY + dy;
            if (isSafeSpawnTile(testX, testY, map)) {
              pX = testX;
              pY = testY;
              found = true;
            }
          }
        }
      }
    }
  }
  return { x: pX, y: pY };
}

export function createNewGameRun(seed?: number): GameState {
  const randomizedSeed = seed ?? (Math.floor(Math.random() * 999999) + 1);
  setWorldSeed(randomizedSeed);

  const freshStats = createFreshPlayerStats();
  const initialChunk = generateOverworldChunk(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT, [], false, freshStats, STARTING_WEAPON);

  const initialCats: string[] = [];
  initialChunk.npcs.forEach(n => {
    if (n.id?.startsWith('npc_cat_')) {
      const catName = n.name.split(' (')[0];
      initialCats.push(catName);
    }
  });

  const rawX = Math.floor(LEVEL_WIDTH / 2);
  const rawY = Math.floor(LEVEL_HEIGHT / 2) + 2;
  const { x: pX, y: pY } = findSafeSpawnPosition(rawX, rawY, initialChunk.map);

  const visibleMask = computeFOV(pX, pY, initialChunk.map, 6);
  const discoveredMask = initialChunk.map.map((row, y) =>
    row.map((_, x) => visibleMask[y][x])
  );

  const welcomeLog: GameLogMessage = {
    id: `welcome_${Date.now()}`,
    text: '🌲 Welcome to the Infinite Overworld! You spawn in the peaceful hamlet of Oakhaven. Adventure lies in any direction! Talk to NPCs, buy/sell gear, and discover hidden dungeon cave entrances (∩).',
    type: 'system',
    timestamp: 'SYSTEM',
  };

  const initialVisited: { [key: string]: boolean } = {};
  initialVisited[`${pX},${pY},0,0`] = true;

  return {
    playerX: pX,
    playerY: pY,
    levelWidth: LEVEL_WIDTH,
    levelHeight: LEVEL_HEIGHT,
    map: initialChunk.map,
    visible: visibleMask,
    discovered: discoveredMask,
    enemies: initialChunk.enemies,
    traps: initialChunk.traps,
    chests: initialChunk.chests,
    logs: [welcomeLog],
    playerStats: freshStats,
    currentWeapon: STARTING_WEAPON,
    inventoryMaterials: { ...INITIAL_INVENTORY_MATERIALS },
    inventoryCatalysts: { ...INITIAL_INVENTORY_CATALYSTS },
    gameDurationHours: 0,

    isOverworld: true,
    overworldZ: 0,
    isArena: false,
    currentChunkX: 0,
    currentChunkY: 0,
    overworldChunks: {
      '0,0': initialChunk
    },
    equipmentInventory: [...INITIAL_STARTING_EQUIPMENT],
    equippedArmor: STARTING_ARMOR,
    equippedHelmet: null,
    equippedGloves: null,
    equippedBoots: null,
    equippedShield: null,
    equippedAmulet: null,
    lootPiles: [],
    visitedTiles: initialVisited,
    gameTime: 480,
    npcs: initialChunk.npcs,
    activeTradeNpcId: null,
    quests: [...DEFAULT_QUESTS],
    followers: [],
    spawnedCats: initialCats,
    spawnedSeppo: false,
    activeQuestBoardOpen: false,
    activeFollowerIdForInspect: null,
    isBraced: false,
    defeatedEnemiesCount: {},
    biome: initialChunk.biome,
    weather: getValidWeatherForBiome(initialChunk.biome, initialChunk.weather),
    season: 'spring',
    gmAutonomousWeather: true,
    gmWeatherInterval: 120,

    corpses: [],
    bloodSplatters: [],
    elementalFields: [],
    dungeonProps: initialChunk.props || [],
    dungeonLevels: {},
    unlockedChapters: [],

    fishingPoleDurability: 7,
    merchantGold: {},
    merchantStock: {},
    lastRestockTime: 480,
    areGuardsHostile: false,
    townReputation: 100,
    blacksmithForgeLevel: 1,
    apothecaryTier: 1,
    purchasedRumors: [],
    clearedCamps: [],
    hasActiveCaravanLicense: false,
    caravanAmbushState: {},
    faction: 'neutral',
    factionReputation: { syndicate: 0, vanguard: 0, bandits: 0 },
    activeEscapeAlarm: null,
    factionTerritories: { ...INITIAL_FACTION_TERRITORIES },
    factionWarTreasury: { ...INITIAL_FACTION_WAR_TREASURY },
    lastTaxClaimTurn: 0,
    hasTransmuter: false,
    caravanTravel: null,
    customMapPins: [],
    attunedWaystones: ['waystone_0_0']
  };
}
