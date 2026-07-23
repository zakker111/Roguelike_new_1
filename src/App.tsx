/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Swords, Heart, Shield, Sparkles, Coins, HelpCircle, Trophy, RefreshCcw, BookOpen, AlertCircle, Play, ShoppingBag, Eye, Map, Package, User, ChefHat, Download, FileText, Skull } from 'lucide-react';
import { TileType, Enemy, Trap, Chest, GameState, CraftedWeapon, PlayerStats, GameLogMessage, WeaponBaseType, CatalystType, EnemyState, EnemyType, EquipmentItem, LootPile, NPC, OverworldChunk, Follower, Corpse, BloodSplatter, DungeonProp, DungeonLevelState, PlayerEffect, CaravanTravelState, CaravanEncounter, CaravanEncounterOption, getMoonPhase, MOON_PHASES, isTwoHandedWeapon, isToolItem, isItemRepairable } from './types';
import { generateLevel, getEnemyTemplate } from './utils/dungeon';
import { computeFOV, getNextStepTowards, bresenhamLine } from './utils/ai';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS, WEAPON_TEMPLATES } from './utils/itemsData';
import { playSound } from './utils/audio';
import { generateOverworldChunk, formatGameTime, setWorldSeed, getDeterministicTownName, hasTownAtChunk, isCastleTownAtChunk, prng, getCurrentWorldSeed, getOrganicBiome, isTileSafeForNpc, findNearestSafeNpcTile } from './utils/overworld';
import { getGMPointOfInterestNudge } from './utils/gmNarrator';
import { tickActiveGMStoryteller, getGMStorytellerState } from './utils/gmStoryteller';
import { getCurrentWeight, getMaxWeight, checkWeightCapacity, getItemWeight, getMaterialUnitWeight } from './utils/itemWeight';
import { evaluateScarAcquisition, getEffectiveStats } from './utils/scars';
import { 
  getBiomePriceMultiplier, 
  getPriceReports, 
  GUILD_UPGRADES, 
  GUILD_DECORS, 
  COMPANION_QUEST_BOARD, 
  SYNDICATE_GEAR, 
  VANGUARD_GEAR 
} from './utils/tradeEconomy';

import GameCanvas from './components/GameCanvas';
import DungeonGlancePanel from './components/DungeonGlancePanel';
import { ChunkMinimap } from './components/ChunkMinimap';
import CraftingPanel from './components/CraftingPanel';
import GameLog from './components/GameLog';
import DifficultyTracker from './components/DifficultyTracker';
import ChaosConsole from './components/ChaosConsole';
import { COMBAT_FLAVOR_TEXTS, FALLBACK_FLAVORS } from './data/combatFlavors';
import gameConfig from './data/gameConfig.json';

import HelpOverlay from './components/HelpOverlay';
import AppOverlays from './components/AppOverlays';
import { useEquipmentHandlers } from './hooks/useEquipmentHandlers';
import BestiaryOverlay from './components/BestiaryOverlay';
import { incrementDefeatedEnemyCount } from './utils/bestiary';
import FollowerInspectOverlay from './components/FollowerInspectOverlay';
import QuestBoardOverlay from './components/QuestBoardOverlay';
import GodPanelOverlay from './components/GodPanelOverlay';
import { SPELL_SCROLLS, getSpellScrollAsEquipmentItem } from './utils/spellScrolls';
import GmPanelOverlay from './components/GmPanelOverlay';
import GuildOverlay from './components/GuildOverlay';
import SleepOverlay from './components/SleepOverlay';
import HistoryBookOverlay from './components/HistoryBookOverlay';
import FishingMiniGame from './components/FishingMiniGame';
import LockpickingMiniGame from './components/LockpickingMiniGame';
import UnifiedInventoryPanel from './components/UnifiedInventoryPanel';
import PoiInteractionOverlay, { PoiType } from './components/PoiInteractionOverlay';
import DrunkInteractionOverlay from './components/DrunkInteractionOverlay';
import TravelerInteractionOverlay from './components/TravelerInteractionOverlay';
import { WEATHER_EFFECTS } from './utils/weatherEngine';
import { Spell, SPELLS, STARTING_WEAPON, STARTING_ARMOR, getItemDurabilityDecay } from './utils/spellsAndEquipment';
import SanctumRelicsDraftOverlay from './components/SanctumRelicsDraftOverlay';
import RecallScrollOverlay from './components/RecallScrollOverlay';
import { consumeItemFromInventory, addEquipmentItemToInventory, consolidateStackableItems } from './utils/scrollUtils';
import { SANCTUM_RELICS, getRandomRelicDraft, SanctumRelic } from './utils/relics';
import { resolveMutationSynergyChain } from './utils/mutationSynergy';
import { DEFAULT_QUESTS } from './utils/questData';
import { getEnemyFleeQuote } from './utils/fleeQuotes';
import {
  BLACKSMITH_SHOP_ITEMS,
  MERCHANT_RESOURCES,
  TAVERN_SHOP_ITEMS,
  SEPPO_SHOP_ITEMS,
  SEPPO_RESOURCES,
  APOTHECARY_ITEMS,
  MERCHANT_INITIALS,
  getBlacksmithItems,
  getApothecaryItems,
  getMerchantConfig
} from './utils/shopData';
import { syncCaravanState, getRegionIdForChunk, getUpdatedTerritoriesOnKill } from './utils/caravanAndTerritory';
import {
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
  findNearestSafePlayerTile,
  hasEquippedTrait,
  isLunarBlessingActive,
  getEffectiveAttribute,
  getCharismaDiscountMultiplier,
  generateRandomAmulet,
  generateRandomLootGear
} from './utils/gameUtils';

// Initialize global registries for custom modifiable components
if (typeof window !== 'undefined') {
  if (!(window as any).customEnemies) {
    (window as any).customEnemies = [
      { type: 'Rat', name: "Giant Plague Rat", baseHp: 6, baseAtk: 1, baseDef: 0, range: 1, speed: 1.0, char: "r", color: "#a1a1aa" },
      { type: 'Goblin', name: "Scavenger Goblin", baseHp: 12, baseAtk: 2, baseDef: 1, range: 1, speed: 1.0, char: "g", color: "#eab308" },
      { type: 'Mage', name: "Skeleton Spellflinger", baseHp: 14, baseAtk: 4, baseDef: 0, range: 4, speed: 1.0, char: "S", color: "#60a5fa" },
      { type: 'Brute', name: "Orc Skullbreaker", baseHp: 30, baseAtk: 6, baseDef: 3, range: 1, speed: 1.3, char: "O", color: "#ea580c" },
      { type: 'Trapmaster', name: "Kobold Trapsmith", baseHp: 22, baseAtk: 4, baseDef: 2, range: 3, speed: 1.0, char: "K", color: "#22c55e" },
      { type: 'Dragon', name: "Sunder Ashwyrm Dragon", baseHp: 120, baseAtk: 11, baseDef: 6, range: 3, speed: 1.2, char: "🐉", color: "#ef4444" },
      { type: 'Hiisi', name: "Hiisi Forest Fiend", baseHp: 25, baseAtk: 5, baseDef: 2, range: 1, speed: 1.0, char: "👹", color: "#16a34a" },
      { type: 'Nakki', name: "Näkki Water Kelpie", baseHp: 22, baseAtk: 4, baseDef: 1, range: 2, speed: 0.9, char: "🧜", color: "#06b6d4" },
      { type: 'Otso', name: "Otso the Honey-Paw", baseHp: 180, baseAtk: 12, baseDef: 7, range: 1, speed: 1.1, char: "🐻", color: "#b45309" },
      { type: 'Louhi', name: "Louhi, Mistress of Pohjola", baseHp: 260, baseAtk: 15, baseDef: 10, range: 4, speed: 0.8, char: "🦅", color: "#c084fc" },
      { type: 'IkuTurso', name: "Iku-Turso Eternal Leviathan", baseHp: 200, baseAtk: 14, baseDef: 8, range: 2, speed: 1.0, char: "🦑", color: "#0ea5e9" },
      { type: 'Kalma', name: "Kalma Grave Goddess", baseHp: 90, baseAtk: 8, baseDef: 4, range: 3, speed: 0.9, char: "💀", color: "#a855f7" }
    ];
  }
  if (!(window as any).customHouses) {
    (window as any).customHouses = [
      { id: 'blacksmith', name: 'Blacksmith Shop', x: 4, y: 3, w: 8, h: 8 },
      { id: 'apothecary', name: 'Apothecary Shop', x: 37, y: 3, w: 8, h: 8 },
      { id: 'tavern', name: 'Tavern & Inn', x: 18, y: 3, w: 14, h: 8 },
      { id: 'villager1', name: 'Villager Cottage Left', x: 4, y: 19, w: 8, h: 8 },
      { id: 'villager2', name: 'Villager Cottage Right', x: 37, y: 19, w: 8, h: 8 },
      { id: 'barracks', name: 'Guard Barracks', x: 18, y: 20, w: 14, h: 7 }
    ];
  }
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSpellId, setSelectedSpellId] = useState<string>('arcane_bolt');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [activeTab, setActiveTab] = useState<'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary'>('dungeon');
  const [bagSubTab, setBagSubTab] = useState<'allies' | 'gear' | 'food' | 'resources'>('allies');
  const [dungeonBagTab, setDungeonBagTab] = useState<'allies' | 'gear' | 'food' | 'mats'>('allies');
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Automatic mobile check & listener
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [forceLayoutMode, setForceLayoutMode] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    const handleCheckMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isNarrow = window.innerWidth < 1024;
      const isMob = isMobileUA || (isTouch && isNarrow) || isNarrow;
      setIsMobileDevice(isMob);
      setForceLayoutMode(isMob ? 'mobile' : 'desktop');
    };

    handleCheckMobile();
    window.addEventListener('resize', handleCheckMobile);
    return () => window.removeEventListener('resize', handleCheckMobile);
  }, []);

  useEffect(() => {
    const handleGlobalButtonPress = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest('button');
      if (button) {
        playSound('click');
      }
    };
    window.addEventListener('pointerdown', handleGlobalButtonPress);
    return () => window.removeEventListener('pointerdown', handleGlobalButtonPress);
  }, []);

  const activeMobileView = forceLayoutMode === 'mobile';

  // Overlay states
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGodPanelOpen, setIsGodPanelOpen] = useState(false);
  const [isGmPanelOpen, setIsGmPanelOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isHistoryBookOpen, setIsHistoryBookOpen] = useState(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [isFishingOpen, setIsFishingOpen] = useState(false);
  const [isLockpickingOpen, setIsLockpickingOpen] = useState(false);
  const [isWeatherControlOpen, setIsWeatherControlOpen] = useState(false);
  const [activeLockpickingChestIndex, setActiveLockpickingChestIndex] = useState<number | null>(null);
  const [unlawfulGuardTarget, setUnlawfulGuardTarget] = useState<{ enemy: Enemy, index: number, pathPoints: any[] } | null>(null);
  const [activePoi, setActivePoi] = useState<PoiType | null>(null);
  const [activeDrunkNpc, setActiveDrunkNpc] = useState<NPC | null>(null);
  const [activeTravelerNpc, setActiveTravelerNpc] = useState<NPC | null>(null);
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [activeRelicDraft, setActiveRelicDraft] = useState<SanctumRelic[] | null>(null);
  const [activeRecallScroll, setActiveRecallScroll] = useState<EquipmentItem | null>(null);
  const [activeTargetedScroll, setActiveTargetedScroll] = useState<EquipmentItem | null>(null);

  // Core App Game State
  const [gameState, setGameState] = useState<GameState>({
    playerX: 0,
    playerY: 0,
    levelWidth: LEVEL_WIDTH,
    levelHeight: LEVEL_HEIGHT,
    map: [],
    discovered: [],
    visible: [],
    enemies: [],
    traps: [],
    chests: [],
    logs: [],
    playerStats: {
      ...gameConfig.startingPlayerStats,
      depth: 0,
      turnsPlayed: 0,
      realTimeSeconds: 0,
      scars: [],
      relics: []
    },
    currentWeapon: STARTING_WEAPON,
    inventoryMaterials: { 'mat_iron': 2, 'mat_mithril': 0, 'mat_obsidian': 0, 'mat_dragonscale': 0, 'mat_feybone': 0, 'mat_wood': 5, 'mat_raw_meat': 2, 'mat_cooked_meat': 1, 'mat_berry': 3, 'mat_cooked_pie': 0, 'mat_beer': 0, 'mat_bread': 0, 'mat_fishing_pole': 1, 'mat_lockpick': 5, 'mat_skeleton_key': 1, 'mat_raw_fish': 0, 'mat_cooked_fish': 0, 'mat_prime_meat': 0, 'mat_cooked_prime_meat': 0, 'mat_thick_hide': 0 },
    inventoryCatalysts: { 'cat_fire': 1, 'cat_frost': 0, 'cat_poison': 0, 'cat_lightning': 0, 'cat_shadow': 0 },
    gameDurationHours: 0,

    // Expansion Fields
    isOverworld: true,
    overworldZ: 0,
    isArena: false,
    currentChunkX: 0,
    currentChunkY: 0,
    overworldChunks: {},
    equipmentInventory: [
      { id: 'axe_steel', name: 'Recruit Hatchet', type: 'weapon', subType: WeaponBaseType.Sword, defense: 0, damage: 5, critChance: 0.10, range: 1, color: '#94a3b8', description: 'A sturdy handaxe for harvesting timber. Works from inventory or equipped! Cannot be repaired.', value: 15, durability: 100, maxDurability: 100, isTool: true, isRepairable: false },
      { id: 'pickaxe_rusty', name: 'Prospectors Pickaxe', type: 'weapon', subType: WeaponBaseType.Hammer, defense: 0, damage: 4, critChance: 0.05, range: 1, color: '#f59e0b', description: 'A sturdy iron pickaxe for mining ore veins. Works from inventory or equipped! Cannot be repaired.', value: 15, durability: 100, maxDurability: 100, isTool: true, isRepairable: false },
      { id: 'armor_leather', name: 'Reinforced Leather Jerkin', type: 'armor', subType: 'LightArmor', defense: 3, damage: 0, critChance: 0, range: 0, color: '#b45309', description: 'Provides decent flexible resistance.', value: 25, durability: 100, maxDurability: 100 },
      { id: 'shield_wooden', name: 'Buckler Shield', type: 'armor', subType: 'Shield', defense: 2, damage: 0, critChance: 0, range: 0, color: '#f59e0b', description: 'A lightweight wooden target shield.', value: 12, durability: 100, maxDurability: 100 },
      { id: 'scroll_recall_town_starting', name: 'Scroll of Recall 📜', type: 'scroll' as any, subType: 'Scroll' as any, defense: 0, damage: 0, critChance: 0, range: 0, color: '#38bdf8', description: 'A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!', value: 200, durability: 100, maxDurability: 100 }
    ],
    equippedArmor: STARTING_ARMOR,
    equippedHelmet: null,
    equippedGloves: null,
    equippedBoots: null,
    equippedShield: null,
    equippedAmulet: null,
    lootPiles: [],
    visitedTiles: {},
    gameTime: 480, // starts at 8:00 AM
    npcs: [],
    activeTradeNpcId: null,
    quests: [...DEFAULT_QUESTS],
    followers: [],
    spawnedCats: [],
    activeQuestBoardOpen: false,
    activeFollowerIdForInspect: null,
    isBraced: false,
    defeatedEnemiesCount: {},
    biome: 'forest',
    weather: 'clear',
    season: 'spring',
    gmAutonomousWeather: true,
    gmWeatherInterval: 25,

    // Persisted Dungeons, Corpses, and Blood Splatters
    corpses: [],
    bloodSplatters: [],
    dungeonProps: [],
    dungeonLevels: {},
    unlockedChapters: [],

    // Fishing and merchant restocking initials
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
    factionTerritories: {
      'borderlands': {
        id: 'borderlands',
        name: 'Oakhaven Borderlands',
        controller: 'neutral',
        controlPercent: 50,
        contested: true,
        bonusDescription: 'Tax Dividends: 🪙 50 Gold Coins. Buff: +10% Experience Gains.',
        taxGoldAccumulated: 0,
        taxMaterialIdAccumulated: 'mat_wood'
      },
      'shadow_fjord': {
        id: 'shadow_fjord',
        name: 'Shadow Fjord',
        controller: 'neutral',
        controlPercent: 40,
        contested: true,
        bonusDescription: 'Tax Dividends: 🪙 80 Gold Coins. Buff: +15% Mining Yield for copper/iron veins.',
        taxGoldAccumulated: 0,
        taxMaterialIdAccumulated: 'mat_iron'
      },
      'moonshadow_cove': {
        id: 'moonshadow_cove',
        name: 'Moonshadow Cove',
        controller: 'syndicate',
        controlPercent: 80,
        contested: false,
        bonusDescription: 'Tax Dividends: 🪙 100 Gold Coins. Buff: +5% Critical Strike Chance.',
        taxGoldAccumulated: 0,
        taxMaterialIdAccumulated: 'mat_lockpick'
      },
      'sunplate_ridge': {
        id: 'sunplate_ridge',
        name: 'Sunplate Ridge',
        controller: 'vanguard',
        controlPercent: 80,
        contested: false,
        bonusDescription: 'Tax Dividends: 🪙 100 Gold Coins. Buff: +2 Defense Power.',
        taxGoldAccumulated: 0,
        taxMaterialIdAccumulated: 'mat_mithril'
      },
      'swamp_of_whispers': {
        id: 'swamp_of_whispers',
        name: 'Swamp of Whispers',
        controller: 'outlaw',
        controlPercent: 90,
        contested: false,
        bonusDescription: 'Tax Dividends: 🪙 120 Gold Coins. Buff: Poison Resistance (+3 flat reduction from DoTs).',
        taxGoldAccumulated: 0,
        taxMaterialIdAccumulated: 'mat_berry'
      }
    },
    factionWarTreasury: {
      syndicateGold: 500,
      vanguardGold: 500,
      playerContributionSyndicate: 0,
      playerContributionVanguard: 0,
      activeTactics: []
    },
    lastTaxClaimTurn: 0,
    hasTransmuter: false,
    caravanTravel: null
  });

  const gameStateRef = useRef<GameState>(gameState);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const scrollTabBar = (direction: 'left' | 'right') => {
    if (tabBarRef.current) {
      const scrollAmount = 200;
      tabBarRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Cleanly handle player death to prevent React side-effect state update crashes
  useEffect(() => {
    if (isPlaying && !isGameOver && !isVictory && gameState.playerStats && gameState.playerStats.hp <= 0) {
      playSound('defeat');
      setIsGameOver(true);
    }
  }, [gameState.playerStats?.hp, isPlaying, isGameOver, isVictory]);

  // Reference for game time ticks
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Store all logs from the active playthrough for downloading when the player dies
  const allSessionLogsRef = useRef<GameLogMessage[]>([]);
  // Store all detailed state snapshots for in-game simulation replays
  const allSessionStateSnapshotsRef = useRef<any[]>([]);
  const lastCapturedTurnRef = useRef<number>(-1);
  const lastCapturedFingerprintRef = useRef<string>("");

  const getLightweightState = (state: GameState): Partial<GameState> => {
    return {
      playerX: state.playerX,
      playerY: state.playerY,
      levelWidth: state.levelWidth,
      levelHeight: state.levelHeight,
      isOverworld: state.isOverworld,
      currentChunkX: state.currentChunkX,
      currentChunkY: state.currentChunkY,
      biome: state.biome,
      weather: state.weather,
      season: state.season,
      playerStats: state.playerStats,
      currentWeapon: state.currentWeapon,
      equipmentInventory: state.equipmentInventory,
      equippedArmor: state.equippedArmor,
      equippedHelmet: state.equippedHelmet,
      equippedGloves: state.equippedGloves,
      equippedBoots: state.equippedBoots,
      equippedShield: state.equippedShield,
      equippedAmulet: state.equippedAmulet,
      inventoryMaterials: state.inventoryMaterials,
      inventoryCatalysts: state.inventoryCatalysts,
      gameTime: state.gameTime,
      isBraced: state.isBraced,
      fishingPoleDurability: state.fishingPoleDurability,
      areGuardsHostile: state.areGuardsHostile,
      townReputation: state.townReputation,
      blacksmithForgeLevel: state.blacksmithForgeLevel,
      apothecaryTier: state.apothecaryTier,
      purchasedRumors: state.purchasedRumors,
    };
  };

  // Check for Cat Lover Trait
  useEffect(() => {
    if (!gameState.spawnedCats) return;
    const cats = ['Jekku', 'Pulla', 'Alli', 'Leevi'];
    const hasAll = cats.every(c => gameState.spawnedCats?.includes(c));
    if (hasAll && !gameState.playerStats.hasCatLover) {
      setGameState(prev => {
        if (prev.playerStats.hasCatLover) return prev;
        
        console.log("%c🐈 [DEVELOPER MEMORIAL] In memory of my cats, you have met them all! You now have the special trait 'Cat Lover' (+10 Luck)!", "color: #ff2a5f; font-weight: bold; font-size: 14px;");
        
        return {
          ...prev,
          playerStats: {
            ...prev.playerStats,
            hasCatLover: true
          },
          logs: [
            ...prev.logs,
            {
              id: `cat_lover_${Date.now()}`,
              text: "🐈 [DEVELOPER MEMORIAL]: In memory of my cats, you have met them all! You have received the special trait 'Cat Lover' that grants +10 to Luck!",
              type: 'loot' as any,
              timestamp: 'TRAIT'
            }
          ]
        };
      });
    }
  }, [gameState.spawnedCats, gameState.playerStats.hasCatLover]);

  useEffect(() => {
    if (gameState.logs && gameState.logs.length > 0) {
      const seenIds = new Set(allSessionLogsRef.current.map((l) => l.id));
      const newLogs = gameState.logs.filter((l) => !seenIds.has(l.id));
      if (newLogs.length > 0) {
        allSessionLogsRef.current = [...allSessionLogsRef.current, ...newLogs];
      }
    }
  }, [gameState.logs]);

  useEffect(() => {
    if (!isPlaying) return;
    
    const fingerprint = `${gameState.playerStats.turnsPlayed}_${gameState.playerX}_${gameState.playerY}_${gameState.playerStats.depth}_${gameState.playerStats.hp}_${gameState.playerStats.mp}_${gameState.playerStats.gold}_${gameState.playerStats.xp}_${gameState.playerStats.level}_${gameState.currentWeapon?.id || ''}_${gameState.equippedArmor?.id || ''}_${gameState.equippedHelmet?.id || ''}_${gameState.equippedGloves?.id || ''}_${gameState.equippedBoots?.id || ''}_${gameState.equippedShield?.id || ''}_${gameState.equippedAmulet?.id || ''}_${gameState.logs?.length || 0}_${gameState.isOverworld}_${gameState.currentChunkX}_${gameState.currentChunkY}_${gameState.quests?.length || 0}_${gameState.followers?.length || 0}_${gameState.activeTradeNpcId || ''}`;

    if (fingerprint !== lastCapturedFingerprintRef.current) {
      lastCapturedFingerprintRef.current = fingerprint;
      const formatted = formatGameTime(gameState.gameTime);
      const lightweightState = getLightweightState(gameState);
      
      allSessionStateSnapshotsRef.current.push({
        turn: gameState.playerStats.turnsPlayed,
        gameTimeStr: `${formatted.timeStr} (${formatted.period})`,
        state: lightweightState
      });
    }
  }, [gameState, isPlaying]);

  const handleRegenerateCurrentLocation = () => {
    if (gameState.isOverworld) {
      const updatedChunk = generateOverworldChunk(
        gameState.currentChunkX,
        gameState.currentChunkY,
        LEVEL_WIDTH,
        LEVEL_HEIGHT,
        gameState.spawnedCats,
        gameState.spawnedSeppo,
        gameState.playerStats,
        gameState.currentWeapon
      );
      setGameState((prev) => {
        // compute initial visibility mask around the player
        const visibleMask = computeFOV(prev.playerX, prev.playerY, updatedChunk.map, 6);
        const nextLogs = [...prev.logs, {
          id: `regen_${Date.now()}`,
          text: `⚡ SYSTEM: Live-regenerated Overworld Chunk (${prev.currentChunkX}, ${prev.currentChunkY}) using modified JSON configurations!`,
          type: 'system' as const,
          timestamp: 'GOD'
        }];
        const nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
        updatedChunk.npcs.forEach(n => {
          if (n.id?.startsWith('npc_cat_')) {
            const catName = n.name.split(' (')[0];
            if (!nextSpawnedCats.includes(catName)) {
              nextSpawnedCats.push(catName);
            }
          }
        });
        const hasSeppo = updatedChunk.npcs.some(n => n.id === 'npc_seppo');
        return {
          ...prev,
          map: updatedChunk.map,
          npcs: updatedChunk.npcs,
          enemies: updatedChunk.enemies,
          chests: updatedChunk.chests,
          traps: updatedChunk.traps,
          discovered: visibleMask,
          visible: visibleMask,
          spawnedCats: nextSpawnedCats,
          spawnedSeppo: prev.spawnedSeppo || hasSeppo,
          overworldChunks: {
            ...prev.overworldChunks,
            [`${prev.currentChunkX},${prev.currentChunkY}`]: updatedChunk
          },
          logs: nextLogs
        };
      });
    } else {
      const newDungeon = generateLevel(LEVEL_WIDTH, LEVEL_HEIGHT, gameState.playerStats.depth, gameState.playerStats.turnsPlayed, gameState.playerStats.realTimeSeconds, gameState.playerStats, gameState.currentWeapon, gameState.defeatedEnemiesCount, gameState.clearedCamps?.length || 0);
      setGameState((prev) => {
        const visibleMask = computeFOV(newDungeon.playerX, newDungeon.playerY, newDungeon.map, 6);
        const nextLogs = [...prev.logs, {
          id: `regen_${Date.now()}`,
          text: `⚡ SYSTEM: Live-regenerated Dungeon Level ${prev.playerStats.depth} using modified JSON enemy templates!`,
          type: 'system' as const,
          timestamp: 'GOD'
        }];
        return {
          ...prev,
          map: newDungeon.map,
          playerX: newDungeon.playerX,
          playerY: newDungeon.playerY,
          enemies: newDungeon.enemies,
          chests: newDungeon.chests,
          traps: newDungeon.traps,
          discovered: visibleMask,
          visible: visibleMask,
          logs: nextLogs
        };
      });
    }
  };

  // Initialize a fresh new application run
  const handleStartNewGame = () => {
    allSessionLogsRef.current = [];
    allSessionStateSnapshotsRef.current = [];
    lastCapturedTurnRef.current = -1;
    lastCapturedFingerprintRef.current = "";
    // Generate randomized world seed for every run!
    const randomizedSeed = Math.floor(Math.random() * 999999) + 1;
    setWorldSeed(randomizedSeed);

    playSound('loot');
    const freshStats: PlayerStats = {
      ...gameConfig.startingPlayerStats,
      depth: 0, // 0 means overworld
      turnsPlayed: 0,
      realTimeSeconds: 0,
      scars: []
    };

    // Generate initial town chunk (0,0) in the Overworld
    const initialChunk = generateOverworldChunk(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT, [], false, freshStats, STARTING_WEAPON);
    
    const initialCats: string[] = [];
    initialChunk.npcs.forEach(n => {
      if (n.id?.startsWith('npc_cat_')) {
        const catName = n.name.split(' (')[0];
        initialCats.push(catName);
      }
    });

    // Player starts at the center crossroads
    let pX = Math.floor(LEVEL_WIDTH / 2);
    let pY = Math.floor(LEVEL_HEIGHT / 2) + 2;

    // Safety guard to ensure player never spawns in a wall, tree, water, or other blocked tile!
    const isSafeInitialSpawn = (x: number, y: number) => {
      if (x < 0 || x >= LEVEL_WIDTH || y < 0 || y >= LEVEL_HEIGHT) return false;
      const tile = initialChunk.map[y][x];
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
    };

    if (!isSafeInitialSpawn(pX, pY)) {
      let found = false;
      for (let r = 1; r < 25 && !found; r++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            if (Math.abs(dx) === r || Math.abs(dy) === r) {
              const testX = pX + dx;
              const testY = pY + dy;
              if (isSafeInitialSpawn(testX, testY)) {
                pX = testX;
                pY = testY;
                found = true;
              }
            }
          }
        }
      }
    } 

    const visibleMask = computeFOV(pX, pY, initialChunk.map, 6);
    
    // Discover visible cells
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

    setGameState({
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
      inventoryMaterials: { 'mat_iron': 3, 'mat_mithril': 1, 'mat_obsidian': 0, 'mat_dragonscale': 0, 'mat_feybone': 0, 'mat_wood': 5, 'mat_raw_meat': 2, 'mat_cooked_meat': 1, 'mat_berry': 3, 'mat_cooked_pie': 0, 'mat_beer': 0, 'mat_bread': 0, 'mat_fishing_pole': 1, 'mat_lockpick': 5, 'mat_skeleton_key': 1, 'mat_raw_fish': 0, 'mat_cooked_fish': 0, 'mat_prime_meat': 0, 'mat_cooked_prime_meat': 0, 'mat_thick_hide': 0 },
      inventoryCatalysts: { 'cat_fire': 1, 'cat_frost': 0, 'cat_poison': 0, 'cat_lightning': 0, 'cat_shadow': 0 },
      gameDurationHours: 0,

      // Expansion fields
      isOverworld: true,
      overworldZ: 0,
      currentChunkX: 0,
      currentChunkY: 0,
      overworldChunks: {
        '0,0': initialChunk
      },
      equipmentInventory: [
        { id: 'axe_steel', name: 'Recruit Hatchet', type: 'weapon', subType: WeaponBaseType.Sword, defense: 0, damage: 5, critChance: 0.10, range: 1, color: '#94a3b8', description: 'A sturdy handaxe for harvesting timber. Works from inventory or equipped! Cannot be repaired.', value: 15, durability: 100, maxDurability: 100, isTool: true, isRepairable: false },
        { id: 'pickaxe_rusty', name: 'Prospectors Pickaxe', type: 'weapon', subType: WeaponBaseType.Hammer, defense: 0, damage: 4, critChance: 0.05, range: 1, color: '#f59e0b', description: 'A sturdy iron pickaxe for mining ore veins. Works from inventory or equipped! Cannot be repaired.', value: 15, durability: 100, maxDurability: 100, isTool: true, isRepairable: false },
        { id: 'armor_leather', name: 'Reinforced Leather Jerkin', type: 'armor', subType: 'LightArmor', defense: 3, damage: 0, critChance: 0, range: 0, color: '#b45309', description: 'Provides decent flexible resistance.', value: 25, durability: 100, maxDurability: 100 },
        { id: 'shield_wooden', name: 'Buckler Shield', type: 'armor', subType: 'Shield', defense: 2, damage: 0, critChance: 0, range: 0, color: '#f59e0b', description: 'A lightweight wooden target shield.', value: 12, durability: 100, maxDurability: 100 },
        { id: 'scroll_recall_town_starting', name: 'Scroll of Recall 📜', type: 'scroll' as any, subType: 'Scroll' as any, defense: 0, damage: 0, critChance: 0, range: 0, color: '#38bdf8', description: 'A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!', value: 200, durability: 100, maxDurability: 100 }
      ],
      equippedArmor: STARTING_ARMOR,
      equippedHelmet: null,
      equippedGloves: null,
      equippedBoots: null,
      equippedShield: null,
      equippedAmulet: null,
      lootPiles: [],
      visitedTiles: initialVisited,
      gameTime: 480, // 8:00 AM
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
      weather: initialChunk.weather,
      season: 'spring',
      corpses: [],
      bloodSplatters: [],
      dungeonProps: [],
      dungeonLevels: {},
      clearedCamps: [],
      hasActiveCaravanLicense: false,
      caravanAmbushState: {},
      faction: 'neutral',
      factionReputation: { syndicate: 0, vanguard: 0, bandits: 0 },
      activeEscapeAlarm: null,
      factionTerritories: {
        'borderlands': {
          id: 'borderlands',
          name: 'Oakhaven Borderlands',
          controller: 'neutral',
          controlPercent: 50,
          contested: true,
          bonusDescription: 'Tax Dividends: 🪙 50 Gold Coins. Buff: +10% Experience Gains.',
          taxGoldAccumulated: 0,
          taxMaterialIdAccumulated: 'mat_wood'
        },
        'shadow_fjord': {
          id: 'shadow_fjord',
          name: 'Shadow Fjord',
          controller: 'neutral',
          controlPercent: 40,
          contested: true,
          bonusDescription: 'Tax Dividends: 🪙 80 Gold Coins. Buff: +15% Mining Yield for copper/iron veins.',
          taxGoldAccumulated: 0,
          taxMaterialIdAccumulated: 'mat_iron'
        },
        'moonshadow_cove': {
          id: 'moonshadow_cove',
          name: 'Moonshadow Cove',
          controller: 'syndicate',
          controlPercent: 80,
          contested: false,
          bonusDescription: 'Tax Dividends: 🪙 100 Gold Coins. Buff: +5% Critical Strike Chance.',
          taxGoldAccumulated: 0,
          taxMaterialIdAccumulated: 'mat_lockpick'
        },
        'sunplate_ridge': {
          id: 'sunplate_ridge',
          name: 'Sunplate Ridge',
          controller: 'vanguard',
          controlPercent: 80,
          contested: false,
          bonusDescription: 'Tax Dividends: 🪙 100 Gold Coins. Buff: +2 Defense Power.',
          taxGoldAccumulated: 0,
          taxMaterialIdAccumulated: 'mat_mithril'
        },
        'swamp_of_whispers': {
          id: 'swamp_of_whispers',
          name: 'Swamp of Whispers',
          controller: 'outlaw',
          controlPercent: 90,
          contested: false,
          bonusDescription: 'Tax Dividends: 🪙 120 Gold Coins. Buff: Poison Resistance (+3 flat reduction from DoTs).',
          taxGoldAccumulated: 0,
          taxMaterialIdAccumulated: 'mat_berry'
        }
      },
      factionWarTreasury: {
        syndicateGold: 500,
        vanguardGold: 500,
        playerContributionSyndicate: 0,
        playerContributionVanguard: 0,
        activeTactics: []
      },
      lastTaxClaimTurn: 0,
      caravanTravel: null
    });

    setIsGameOver(false);
    setIsVictory(false);
    setIsPlaying(true);
    setActiveTab('dungeon');
  };

  const handleDownloadLogs = () => {
    const seed = getCurrentWorldSeed();
    const stats = gameState.playerStats;
    const finalWeapon = gameState.currentWeapon?.name || 'Recruit Hatchet';
    const timestampStr = new Date().toLocaleString();
    
    let content = `======================================================================\n`;
    content += `                SUNDER SANCTUM PLAYTHROUGH ADVENTURE LOGS\n`;
    content += `======================================================================\n`;
    content += `Time of Demise/Victory: ${timestampStr}\n`;
    content += `World Seed:       ${seed}\n`;
    content += `Floors Cleared:   ${stats.depth}\n`;
    content += `Turns Kept:       ${stats.turnsPlayed}\n`;
    content += `Gold Plundered:   ${stats.gold} Gold coins\n`;
    content += `Final Masterpiece: ${finalWeapon}\n`;
    content += `----------------------------------------------------------------------\n\n`;
    content += `CHRONOLOGICAL RUN JOURNAL:\n`;
    
    const logsToDownload = allSessionLogsRef.current.length > 0 
      ? allSessionLogsRef.current 
      : gameState.logs;
      
    logsToDownload.forEach((log) => {
      content += `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.text}\n`;
    });
    
    content += `\n======================================================================\n`;
    content += `                       END OF ADVENTURE JOURNAL\n`;
    content += `======================================================================\n`;

    // Comprehensive Simulation Payload
    content += `\n\n======================================================================\n`;
    content += `                 --- COMPREHENSIVE SIMULATOR REPLAY DATA ---          \n`;
    content += `======================================================================\n`;
    content += `The block below contains precise turn-by-turn state telemetry records.\n`;
    content += `This structured JSON can be loaded into an automated game engine/replay simulator.\n\n`;
    
    try {
      const simulationPayload = {
        appletId: "e743f047-96de-4fc7-8cf6-cc907f6ee5bd",
        gameName: "Sunder Sanctum",
        exportedAt: timestampStr,
        seed,
        finalStats: {
          depth: stats.depth,
          turnsPlayed: stats.turnsPlayed,
          realTimeSeconds: stats.realTimeSeconds,
          gold: stats.gold,
          level: stats.level,
          xp: stats.xp,
          hp: stats.hp,
          mp: stats.mp,
          maxHp: stats.maxHp,
          maxMp: stats.maxMp,
          exhaustion: stats.exhaustion,
        },
        finalWeapon,
        journalLogsCount: logsToDownload.length,
        snapshotsCount: allSessionStateSnapshotsRef.current.length,
        snapshots: allSessionStateSnapshotsRef.current.map(({ turn, gameTimeStr, state }) => ({ turn, gameTimeStr, state }))
      };
      
      content += JSON.stringify(simulationPayload, null, 2);
    } catch (e) {
      content += `// ERROR SERIALIZING TELEMETRY SNAPSHOTS: ${String(e)}\n`;
    }

    content += `\n======================================================================\n`;
    content += `                   --- END OF SIMULATOR REPLAY DATA ---               \n`;
    content += `======================================================================\n`;

    // Write to clipboard as an extremely robust fallback
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(content);
        // Dispatch floating text effect to notify player!
        const copyEv = new CustomEvent('spawn-game-effect', {
          detail: { x: gameState.playerX, y: gameState.playerY, text: `📋 LOGS COPIED!`, type: 'heal' },
        });
        window.dispatchEvent(copyEv);
      }
    } catch (clipError) {
      console.warn('Could not copy to clipboard:', clipError);
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sunder_sanctum_run_seed_${seed}_depth_${stats.depth}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Setup Real-time difficulty ticking loop
  useEffect(() => {
    if (isPlaying && !isGameOver && !isVictory) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          const nextSec = prev.playerStats.realTimeSeconds + 1;
          
          // Small aesthetic: notify of scalable challenge triggers
          let nextLogs = prev.logs;
          if (nextSec % 120 === 0) {
            nextLogs = [...prev.logs, {
              id: `threat_escalation_${nextSec}`,
              text: `⚠️ THE ATMOSPHERE HEAVENS GROWS HEAVIER - Chaos Threat has scaled! Monsters are reinforced!`,
              type: 'danger',
              timestamp: 'CHALLENGE',
            }];
            playSound('trap');
          }

          // Setup lazy real-time updates for watchtower sieges
          let updatedChunks: Record<string, OverworldChunk> | null = null;
          let updatedEnemies: Enemy[] | null = null;
          let chunksChanged = false;
          let enemiesChanged = false;

          const getUpdatedChunks = () => {
            if (!updatedChunks) {
              updatedChunks = { ...prev.overworldChunks };
            }
            return updatedChunks;
          };

          const getUpdatedEnemies = () => {
            if (!updatedEnemies) {
              updatedEnemies = [...prev.enemies];
            }
            return updatedEnemies;
          };

          // 1. Trigger a random siege event every 80 seconds with a 35% chance
          if (nextSec > 15 && nextSec % 80 === 0 && Math.random() < 0.35) {
            // Find all claimed watchtowers that are not currently under siege
            const watchtowerChunks = Object.values(prev.overworldChunks as Record<string, OverworldChunk>).filter(c => c.watchtower && c.watchtower.isClaimed && !c.watchtower.siegeState?.isUnderSiege);
            if (watchtowerChunks.length > 0) {
              const selectedChunk = watchtowerChunks[Math.floor(Math.random() * watchtowerChunks.length)] as OverworldChunk;
              const wt = { ...selectedChunk.watchtower! };
              
              // Pick an attacker different from the current controller
              const possibleAttackers: Array<'syndicate' | 'vanguard' | 'bandits'> = ['syndicate', 'vanguard', 'bandits'];
              const filteredAttackers = possibleAttackers.filter(a => a !== wt.controller);
              const attacker = filteredAttackers[Math.floor(Math.random() * filteredAttackers.length)];

              wt.siegeState = {
                isUnderSiege: true,
                attacker,
                defender: wt.controller || 'neutral',
                siegeTimerSeconds: 120, // 2 minutes to respond
                maxTimerSeconds: 120
              };

              const chunks = getUpdatedChunks();
              chunks[`${selectedChunk.chunkX},${selectedChunk.chunkY}`] = {
                ...selectedChunk,
                watchtower: wt
              };
              chunksChanged = true;

              if (nextLogs === prev.logs) {
                nextLogs = [...prev.logs];
              }
              nextLogs.push({
                id: `siege_alert_${Date.now()}`,
                text: `📡 [WATCHTOWER SECTOR ALERT]: The Watchtower at Sector [${selectedChunk.chunkX}, ${selectedChunk.chunkY}] is being besieged by ${attacker === 'syndicate' ? 'Moonshadow Syndicate' : (attacker === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')} forces! Intervene within 120 seconds to defend!`,
                type: 'danger',
                timestamp: 'SIEGE'
              });
              
              playSound('trap');

              // If the player is currently inside this besieged watchtower's chunk, spawn the siege combatants immediately!
              if (selectedChunk.chunkX === prev.currentChunkX && selectedChunk.chunkY === prev.currentChunkY) {
                const wtX = wt.x;
                const wtY = wt.y;
                const defender = wt.siegeState.defender;
                const playerFaction = prev.faction || 'neutral';
                const reputation = prev.factionReputation || { syndicate: 0, vanguard: 0, bandits: 0 };
                
                const siegeEnemies = getSiegeCombatants(
                  wtX,
                  wtY,
                  prev.currentChunkX,
                  prev.currentChunkY,
                  attacker,
                  defender,
                  playerFaction,
                  reputation
                );

                const enemies = getUpdatedEnemies();
                updatedEnemies = [...enemies, ...siegeEnemies];
                enemiesChanged = true;
              }
            }
          }

          // 2. Count down active sieges
          for (const key of Object.keys(prev.overworldChunks)) {
            const chunk = prev.overworldChunks[key] as OverworldChunk;
            if (chunk.watchtower && chunk.watchtower.siegeState?.isUnderSiege) {
              const wt = { ...chunk.watchtower };
              const sState = { ...wt.siegeState };
              sState.siegeTimerSeconds -= 1;

              if (sState.siegeTimerSeconds <= 0) {
                // Attacker wins! Watchtower is captured
                wt.isClaimed = true;
                wt.controller = sState.attacker;
                wt.claimPercent = 100;
                wt.garrisonDefeated = false;
                wt.siegeState = undefined; // Clear siege state

                const chunks = getUpdatedChunks();
                chunks[key] = {
                  ...chunk,
                  watchtower: wt
                };
                chunksChanged = true;

                if (nextLogs === prev.logs) {
                  nextLogs = [...prev.logs];
                }
                nextLogs.push({
                  id: `siege_loss_${Date.now()}`,
                  text: `💔 [WATCHTOWER OVERTHROWN]: The watchtower at Sector [${chunk.chunkX}, ${chunk.chunkY}] has fallen! It is now controlled by the ${sState.attacker === 'syndicate' ? 'Moonshadow Syndicate' : (sState.attacker === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')}.`,
                  type: 'danger',
                  timestamp: 'SYSTEM'
                });
                
                playSound('trap');

                // If player is in this chunk, remove any remaining siege combatants
                if (chunk.chunkX === prev.currentChunkX && chunk.chunkY === prev.currentChunkY) {
                  const enemies = getUpdatedEnemies();
                  updatedEnemies = enemies.filter(e => !e.id.startsWith('siege_attacker_') && !e.id.startsWith('siege_defender_'));
                  enemiesChanged = true;
                }
              } else {
                wt.siegeState = sState;
                const chunks = getUpdatedChunks();
                chunks[key] = {
                  ...chunk,
                  watchtower: wt
                };
                chunksChanged = true;
              }
            }
          }

          return {
            ...prev,
            playerStats: {
              ...prev.playerStats,
              realTimeSeconds: nextSec,
            },
            logs: nextLogs,
            overworldChunks: chunksChanged && updatedChunks ? updatedChunks : prev.overworldChunks,
            enemies: enemiesChanged && updatedEnemies ? updatedEnemies : prev.enemies,
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isGameOver, isVictory]);

  // Command logs helper
  const addLogMessage = (text: string, type: GameLogMessage['type'] = 'info') => {
    setGameState((prev) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text,
        type,
        timestamp: timeStr,
      };
      
      // Limit to 45 logs to avoid memory lags
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;
      return {
        ...prev,
        logs: [...truncatedLogs, newMsg],
      };
    });
  };

  const spawnFollowersOnLevelLoadByReset = (
    enemiesArray: Enemy[],
    fList: Follower[],
    playerX: number,
    playerY: number,
    map: TileType[][],
    activeCompanionQuestsList?: any[]
  ): Enemy[] => {
    const filtered = enemiesArray.filter(e => !e.isFollower || e.id?.startsWith('wt_ally_'));
    const nextEnemies = [...filtered];
    
    const activeQuests = activeCompanionQuestsList || gameState?.activeCompanionQuests || [];
    const activeQuestFollowerIds = activeQuests
      .filter((q: any) => q.durationTurns > 0)
      .map((q: any) => q.followerId);

    const availableFollowers = fList.filter(fol => !activeQuestFollowerIds.includes(fol.id));

    availableFollowers.forEach((fol, idx) => {
      const spots = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ];
      
      let spotX = playerX;
      let spotY = playerY;
      
      for (const s of spots) {
        const tx = playerX + s.dx;
        const ty = playerY + s.dy;
        if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
          if (map[ty][tx] === TileType.Floor || map[ty][tx] === TileType.Grass || map[ty][tx] === TileType.Path) {
            const occupied = nextEnemies.some(ne => ne.x === tx && ne.y === ty);
            if (!occupied) {
              spotX = tx;
              spotY = ty;
              break;
            }
          }
        }
      }
      
      nextEnemies.push({
        id: `actor_${fol.id}`,
        x: spotX,
        y: spotY,
        type: 'Goblin' as any, // acts on melee triggers
        name: fol.name,
        hp: fol.hp,
        maxHp: fol.maxHp,
        atk: fol.atk,
        def: fol.def,
        range: 1,
        speed: 1,
        color: fol.color,
        char: fol.char,
        state: EnemyState.Chasing,
        isElite: false,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: [],
        isFollower: true,
        followerId: fol.id
      });
    });
    
    return nextEnemies;
  };

  const getSiegeCombatants = (
    wtX: number,
    wtY: number,
    cx: number,
    cy: number,
    attacker: string,
    defender: string,
    playerFaction: string,
    reputation: Record<string, number>
  ): Enemy[] => {
    const isAttackerFriendly = attacker === playerFaction || (reputation?.[attacker] !== undefined && reputation[attacker] > 40);
    const isDefenderFriendly = defender === playerFaction || (reputation?.[defender] !== undefined && reputation[defender] > 40);

    const attackerName = attacker === 'vanguard' ? 'Vanguard Crusader' : (attacker === 'syndicate' ? 'Syndicate Skirmisher' : 'Rust-Raider Outlaw');
    const attackerColor = attacker === 'vanguard' ? '#38bdf8' : (attacker === 'syndicate' ? '#c084fc' : '#f97316');
    const attackerChar = attacker === 'vanguard' ? '🗡️' : (attacker === 'syndicate' ? '☠️' : '🪓');
    
    const defenderName = defender === 'vanguard' ? 'Vanguard Shieldknight' : (defender === 'syndicate' ? 'Syndicate Enforcer' : (defender === 'bandits' ? 'Rust-Raider Sentry' : 'Independent Guard'));
    const defenderColor = defender === 'vanguard' ? '#60a5fa' : (defender === 'syndicate' ? '#a78bfa' : (defender === 'bandits' ? '#ea580c' : '#94a3b8'));
    const defenderChar = '🛡️';

    const siegeEnemies: Enemy[] = [];

    // Spawn defenders
    const defenderCoords = [
      { dx: 2, dy: 2 },
      { dx: 6, dy: 2 },
      { dx: 4, dy: 1 }
    ];
    defenderCoords.forEach((offset, idx) => {
      const isDefAllied = isDefenderFriendly;
      siegeEnemies.push({
        id: isDefAllied ? `wt_ally_defender_${idx}_${cx}_${cy}` : `siege_defender_${idx}_${cx}_${cy}`,
        x: wtX + offset.dx,
        y: wtY + offset.dy,
        type: EnemyType.OrcBrute,
        name: isDefAllied ? `🛡️ [ALLY] ${defenderName}` : `🛡️ [DEFENDER] ${defenderName}`,
        hp: 200,
        maxHp: 200,
        atk: 15,
        def: 8,
        range: 1,
        speed: 1.0,
        color: defenderColor,
        char: defenderChar,
        state: EnemyState.Chasing,
        isElite: true,
        faction: (defender === 'neutral' ? undefined : defender) as any,
        isFollower: isDefAllied,
        debuffs: [],
        patrolPath: [],
        patrolIndex: 0
      });
    });

    // Spawn attackers
    const attackerCoords = [
      { dx: 2, dy: 5 },
      { dx: 6, dy: 5 },
      { dx: 4, dy: 6 }
    ];
    attackerCoords.forEach((offset, idx) => {
      const isAttAllied = isAttackerFriendly;
      siegeEnemies.push({
        id: isAttAllied ? `wt_ally_attacker_${idx}_${cx}_${cy}` : `siege_attacker_${idx}_${cx}_${cy}`,
        x: wtX + offset.dx,
        y: wtY + offset.dy,
        type: EnemyType.Bandit,
        name: isAttAllied ? `⚔️ [ALLY] ${attackerName}` : `🔥 [ATTACKER] ${attackerName}`,
        hp: 180,
        maxHp: 180,
        atk: 18,
        def: 4,
        range: 1,
        speed: 1.0,
        color: attackerColor,
        char: attackerChar,
        state: EnemyState.Chasing,
        isElite: true,
        faction: attacker as any,
        isFollower: isAttAllied,
        debuffs: [],
        patrolPath: [],
        patrolIndex: 0
      });
    });

    // If player is neutral or has no friendly siege side, spawn 2 Allied Sellswords to fight alongside player!
    if (!isAttackerFriendly && !isDefenderFriendly) {
      const mercCoords = [
        { dx: 1, dy: 7 },
        { dx: 7, dy: 7 }
      ];
      mercCoords.forEach((offset, idx) => {
        siegeEnemies.push({
          id: `wt_ally_merc_${idx}_${cx}_${cy}`,
          x: wtX + offset.dx,
          y: wtY + offset.dy,
          type: EnemyType.Bandit,
          name: `⚔️ [ALLY] Allied Sellsword`,
          hp: 170,
          maxHp: 170,
          atk: 14,
          def: 5,
          range: 1,
          speed: 1.0,
          color: '#fbbf24',
          char: '⚔️',
          state: EnemyState.Chasing,
          isElite: true,
          isFollower: true,
          debuffs: [],
          patrolPath: [],
          patrolIndex: 0
        });
      });
    }

    return siegeEnemies;
  };

  // Render and handle procedural decoration props for dungeon interiors
  const generateDungeonProps = (map: TileType[][], depth: number): DungeonProp[] => {
    const propsList: DungeonProp[] = [];
    const height = map.length;
    const width = map[0]?.length || 0;

    const PROP_TEMPLATES = [
      { char: '☠', name: 'Pile of Bones', color: '#cbd5e1', description: 'Bleached mortal remains scattered in dust.' },
      { char: '🕸', name: 'Cobweb', color: '#64748b', description: 'Stretched ancient cobweb covering stone structures.' },
      { char: '⌸', name: 'Broken Barrel', color: '#78350f', description: 'A crushed wooden frame with rusted trim.' },
      { char: 'π', name: 'Ancient Column', color: '#94a3b8', description: 'A cracked stone pillar of forgotten craftsmanship.' },
      { char: '⎖', name: 'Iron Shackle', color: '#64748b', description: 'Heavy prison bolts anchored to damp floors.' },
      { char: '⎗', name: 'Stained Altar', color: '#b91c1c', description: 'A blackened granite stone carved with sacrificial runes.' }
    ];

    const SHRINE_TEMPLATES = [
      {
        id_prefix: 'forbidden_strength',
        char: '⛧',
        name: 'Shrine of Forbidden Strength',
        color: '#f87171',
        description: 'An obsidian pillar carved with bleeding runes. Pray to gain permanent +4 Strength, but suffer -15 HP and receive the Curse of Vulnerability (-5 Defense for 40 turns).'
      },
      {
        id_prefix: 'blind_oracle',
        char: '🔮',
        name: 'Shrine of the Blind Oracle',
        color: '#c084fc',
        description: 'A swirling void of deep cosmic purple. Touch to fully reveal the floor map and gain permanent +3 Intellect, but suffer Cursed Sight (-5 Attack and -15% Crit Chance for 45 turns).'
      },
      {
        id_prefix: 'blood_transfusion',
        char: '🧪',
        name: 'Shrine of Blood Transfusion',
        color: '#34d399',
        description: 'A bubbling font of dark jade ley-water. Offer blood to gain permanent +12 Max MP (mana is fully restored), but instantly drain -15 HP.'
      },
      {
        id_prefix: 'covetous_greed',
        char: '🏺',
        name: 'Altar of the Covetous Greed',
        color: '#facc15',
        description: 'A glowing brass urn of endless wealth. Claims a toll on your armor to grant +250 Gold instantly, but inflicts Cursed Weight (-2 Strength and -2 Dexterity for 30 turns).'
      },
      {
        id_prefix: 'reckless_berserker',
        char: '⚔️',
        name: 'Shrine of the Reckless Berserker',
        color: '#fb923c',
        description: 'A blood-spattered anvil of combat rage. Pray to permanently gain +15% Critical Strike Chance, but permanently sacrifices -20 Max HP.'
      },
      {
        id_prefix: 'chrono_shift',
        char: '🌀',
        name: 'Altar of the Chrono-Shift',
        color: '#60a5fa',
        description: 'A twisting sapphire temporal vortex. Pray to permanently gain +3 Dexterity, but suffer +30 physical exhaustion points immediately.'
      }
    ];

    // 1. Generate 12-20 decorative props
    const count = 12 + Math.floor(Math.random() * 9); // 12-20 props
    let attempts = 0;
    
    for (let i = 0; i < count && attempts < 1500; i++) {
      attempts++;
      const rx = Math.floor(Math.random() * width);
      const ry = Math.floor(Math.random() * height);

      if (map[ry]?.[rx] === TileType.Floor) {
        const dup = propsList.some(p => p.x === rx && p.y === ry);
        if (!dup) {
          const t = PROP_TEMPLATES[Math.floor(Math.random() * PROP_TEMPLATES.length)];
          propsList.push({
            id: `d_prop_${Date.now()}_${Math.random()}`,
            x: rx,
            y: ry,
            char: t.char,
            name: t.name,
            color: t.color,
            description: t.description
          });
        }
      }
    }

    // 2. Ensure exactly 2 unique double-edged shrines per dungeon floor
    const shuffledShrines = [...SHRINE_TEMPLATES].sort(() => 0.5 - Math.random());
    const shrinesToSpawn = shuffledShrines.slice(0, 2);

    let shrinesSpawned = 0;
    let shrineAttempts = 0;
    while (shrinesSpawned < shrinesToSpawn.length && shrineAttempts < 1000) {
      shrineAttempts++;
      const rx = Math.floor(Math.random() * width);
      const ry = Math.floor(Math.random() * height);

      if (map[ry]?.[rx] === TileType.Floor) {
        const dup = propsList.some(p => p.x === rx && p.y === ry);
        if (!dup) {
          const s = shrinesToSpawn[shrinesSpawned];
          propsList.push({
            id: `d_shrine_${s.id_prefix}_${Date.now()}_${Math.random()}`,
            x: rx,
            y: ry,
            char: s.char,
            name: s.name,
            color: s.color,
            description: s.description
          });
          shrinesSpawned++;
        }
      }
    }

    return propsList;
  };

  // Handle player interaction with Double-Edged Dungeon Shrines
  const handleInteractWithDungeonShrine = (shrine: DungeonProp) => {
    if (shrine.description.includes('(EXHAUSTED)')) return;

    playSound('spell');

    let effectType = '';
    if (shrine.id.includes('forbidden_strength')) effectType = 'forbidden_strength';
    else if (shrine.id.includes('blind_oracle')) effectType = 'blind_oracle';
    else if (shrine.id.includes('blood_transfusion')) effectType = 'blood_transfusion';
    else if (shrine.id.includes('covetous_greed')) effectType = 'covetous_greed';
    else if (shrine.id.includes('reckless_berserker')) effectType = 'reckless_berserker';
    else if (shrine.id.includes('chrono_shift')) effectType = 'chrono_shift';

    if (!effectType) {
      if (shrine.name.includes('Strength')) effectType = 'forbidden_strength';
      else if (shrine.name.includes('Oracle')) effectType = 'blind_oracle';
      else if (shrine.name.includes('Transfusion')) effectType = 'blood_transfusion';
      else if (shrine.name.includes('Greed')) effectType = 'covetous_greed';
      else if (shrine.name.includes('Berserker')) effectType = 'reckless_berserker';
      else if (shrine.name.includes('Chrono-Shift')) effectType = 'chrono_shift';
    }

    setGameState((prev) => {
      const nextProps = prev.dungeonProps.map((p) => {
        if (p.id === shrine.id) {
          return {
            ...p,
            description: `${p.description.split(' Pray to')[0].split(' Touch to')[0]} (EXHAUSTED) - You have claimed this power.`,
          };
        }
        return p;
      });

      let nextStats = { ...prev.playerStats };
      let nextActiveEffects = nextStats.activeEffects ? [...nextStats.activeEffects] : [];
      let nextDiscovered = prev.discovered ? prev.discovered.map(row => [...row]) : [];

      const logs: string[] = [];

      if (effectType === 'forbidden_strength') {
        nextStats.str += 4;
        nextStats.hp = Math.max(1, nextStats.hp - 15);
        
        nextActiveEffects = nextActiveEffects.filter(e => e.id !== 'curse_vulnerability');
        nextActiveEffects.push({
          id: 'curse_vulnerability',
          name: 'Curse of Vulnerability',
          type: 'debuff',
          icon: '💀',
          description: 'Your physical defenses are withered. Reduces physical Defense by 5.',
          turnsRemaining: 40,
          color: '#f87171',
          statModifiers: {
            def: -5
          }
        });

        logs.push(`⛧ [SHRINE]: You pray at the Shrine of Forbidden Strength. Your body surges with raw power! Permanent Strength increased by +4.`);
        logs.push(`💀 [CURSE]: The Altar drains -15 HP and inflicts the Curse of Vulnerability (-5 Def for 40 turns).`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `💪 +4 STR`, type: 'heal' },
        });
        window.dispatchEvent(ev);
        setTimeout(() => {
          const ev2 = new CustomEvent('spawn-game-effect', {
            detail: { x: prev.playerX, y: prev.playerY, text: `💔 -15 HP`, type: 'dmg' },
          });
          window.dispatchEvent(ev2);
        }, 150);
      } 
      else if (effectType === 'blind_oracle') {
        nextStats.int += 3;
        
        const height = prev.map.length;
        const width = prev.map[0]?.length || 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            nextDiscovered[y][x] = true;
          }
        }

        nextActiveEffects = nextActiveEffects.filter(e => e.id !== 'cursed_sight');
        nextActiveEffects.push({
          id: 'cursed_sight',
          name: 'Cursed Sight',
          type: 'debuff',
          icon: '🔮',
          description: 'Your eyes burn with chronomantic light. Reduces Attack by 5 and Critical Chance by 15%.',
          turnsRemaining: 45,
          color: '#c084fc',
          statModifiers: {
            atk: -5,
            crit: -0.15
          }
        });

        logs.push(`🔮 [SHRINE]: You touch the swirling purple orb. Deep ancestral knowledge enters your mind! Permanent Intellect increased by +3, and the dungeon layout is fully revealed.`);
        logs.push(`👁️ [CURSE]: The ethereal blast blinds you. Inflicted Cursed Sight (-5 Atk, -15% Crit for 45 turns).`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `👁️ MAP REVEALED`, type: 'heal' },
        });
        window.dispatchEvent(ev);
      } 
      else if (effectType === 'blood_transfusion') {
        nextStats.maxMp += 12;
        nextStats.mp = nextStats.maxMp;
        nextStats.hp = Math.max(1, nextStats.hp - 15);

        logs.push(`🧪 [SHRINE]: You bleed into the Ley-well. Ethereal forces flow into your veins! Permanent Max MP increased by +12 and Mana fully restored.`);
        logs.push(`🩸 [CURSE]: Siphoned -15 HP instantly in blood sacrifice.`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `🧪 MANA RESTORED`, type: 'heal' },
        });
        window.dispatchEvent(ev);
        setTimeout(() => {
          const ev2 = new CustomEvent('spawn-game-effect', {
            detail: { x: prev.playerX, y: prev.playerY, text: `💔 -15 HP`, type: 'dmg' },
          });
          window.dispatchEvent(ev2);
        }, 150);
      } 
      else if (effectType === 'covetous_greed') {
        nextStats.gold += 250;
        
        nextActiveEffects = nextActiveEffects.filter(e => e.id !== 'cursed_weight');
        nextActiveEffects.push({
          id: 'cursed_weight',
          name: 'Cursed Weight',
          type: 'debuff',
          icon: '🏺',
          description: 'Your gear feels extremely heavy and worn. Reduces Attack by 2 and Defense by 2.',
          turnsRemaining: 30,
          color: '#facc15',
          statModifiers: {
            atk: -2,
            def: -2
          }
        });

        logs.push(`🪙 [SHRINE]: You reach into the golden vessel. It overflows with heavy gold coins! Gained +250 Gold instantly.`);
        logs.push(`⚖️ [CURSE]: Your equipment grows leaden. Inflicted Cursed Weight (-2 Strength, -2 Dexterity for 30 turns).`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `🪙 +250 GOLD`, type: 'heal' },
        });
        window.dispatchEvent(ev);
      } 
      else if (effectType === 'reckless_berserker') {
        nextStats.maxHp = Math.max(10, nextStats.maxHp - 20);
        if (nextStats.hp > nextStats.maxHp) nextStats.hp = nextStats.maxHp;

        nextActiveEffects = nextActiveEffects.filter(e => e.id !== 'permanent_berserker_rage');
        nextActiveEffects.push({
          id: 'permanent_berserker_rage',
          name: 'Berserker Bloodlust',
          type: 'buff',
          icon: '⚔️',
          description: 'A permanent combat blessing. Increases Critical Strike Chance by +15%.',
          turnsRemaining: 999999,
          color: '#fb923c',
          statModifiers: {
            crit: 0.15
          }
        });

        logs.push(`⚔️ [SHRINE]: You swear the oath of the Berserker. Your eyes redline with battle rage! Permanent Critical Strike Chance increased by +15%.`);
        logs.push(`💀 [CURSE]: Your life essence is consumed. Permanent Max HP decreased by -20.`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `💥 CRIT +15%`, type: 'heal' },
        });
        window.dispatchEvent(ev);
      } 
      else if (effectType === 'chrono_shift') {
        nextStats.dex += 3;
        nextStats.exhaustion = Math.min(100, (nextStats.exhaustion || 0) + 30);

        logs.push(`🌀 [SHRINE]: Ethereal sapphire rings snap around your ankles. Your speed multiplies! Permanent Dexterity increased by +3.`);
        logs.push(`💤 [CURSE]: The temporal distortion drains your energy. Gained +30 physical exhaustion points immediately.`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `⚡ +3 DEX`, type: 'heal' },
        });
        window.dispatchEvent(ev);
      }

      nextStats.activeEffects = nextActiveEffects;

      const nextLogs = [...prev.logs];
      logs.forEach(msg => {
        nextLogs.push({
          id: `log_shrine_${Date.now()}_${Math.random()}`,
          text: msg,
          type: msg.includes('[CURSE]') ? 'danger' : 'info',
          timestamp: new Date().toLocaleTimeString().split(' ')[0]
        });
      });

      return {
        ...prev,
        dungeonProps: nextProps,
        playerStats: nextStats,
        discovered: nextDiscovered,
        logs: nextLogs
      };
    });
  };

  // Handle Level generation advancement down
  const advanceToNextDepth = () => {
    playSound('levelUp');
    const nextDepth = gameState.playerStats.depth + 1;

    if (nextDepth > 10) {
      playSound('victory');
      setIsVictory(true);
      addLogMessage(`👑 LEGENDARY VICTORY! You have successfully plundered all 10 floors of the Abyss, conquered the molten Underworld Depths, and reclaimed the Spark of the Cosmos!`, 'craft');
      return;
    }

    if (nextDepth === 6) {
      addLogMessage(`🌋 ALERT: You have crossed the threshold into the UNDERWORLD DEPTHS! Searing heatwaves, bubbling lava channels, and molten basalt walls define these bottomless floors...`, 'danger');
    } else {
      addLogMessage(`🪜 You walked down the stairs into Abyss Floor ${nextDepth}. Deep forces intensify!`, 'system');
    }

    setGameState((prev) => {
      // 1. Save current depth status
      const chunkX = prev.dungeonEntranceChunkX ?? prev.currentChunkX;
      const chunkY = prev.dungeonEntranceChunkY ?? prev.currentChunkY;
      const currentDepth = prev.playerStats.depth;
      const key = `${chunkX},${chunkY}_depth-${currentDepth}`;

      const saved: DungeonLevelState = {
        depth: currentDepth,
        chunkX,
        chunkY,
        map: prev.map,
        discovered: prev.discovered,
        visible: prev.visible,
        enemies: prev.enemies,
        traps: prev.traps,
        chests: prev.chests,
        lootPiles: prev.lootPiles || [],
        corpses: prev.corpses || [],
        bloodSplatters: prev.bloodSplatters || [],
        props: prev.dungeonProps || [],
      };

      const nextDungeonLevels = {
        ...prev.dungeonLevels,
        [key]: saved,
      };

      // 2. Check if next depth of this specific entrance is already generated
      const nextKey = `${chunkX},${chunkY}_depth-${nextDepth}`;
      const existing = nextDungeonLevels[nextKey];

      if (existing) {
        // Find Stairs Up to place player
        const stairsUpY = existing.map.findIndex(row => row.includes(TileType.StairsUp));
        const stairsUpX = stairsUpY !== -1 ? existing.map[stairsUpY].indexOf(TileType.StairsUp) : 12;

        const syncedEnemies = spawnFollowersOnLevelLoadByReset(
          existing.enemies,
          prev.followers,
          stairsUpX,
          stairsUpY,
          existing.map
        );

        const fov = computeFOV(stairsUpX, stairsUpY, existing.map, 6);
        const discovered = existing.map.map((row, y) =>
          row.map((cell, x) => (existing.discovered[y]?.[x] || fov[y]?.[x] || false))
        );

        return {
          ...prev,
          playerX: stairsUpX,
          playerY: stairsUpY,
          map: existing.map,
          visible: fov,
          discovered: discovered,
          enemies: syncedEnemies,
          traps: existing.traps,
          chests: existing.chests,
          lootPiles: existing.lootPiles || [],
          corpses: existing.corpses || [],
          bloodSplatters: existing.bloodSplatters || [],
          dungeonProps: existing.props || [],
          dungeonLevels: nextDungeonLevels,
          playerStats: {
            ...prev.playerStats,
            depth: nextDepth,
          },
        };
      } else {
        // Generate new level layout
        const nextLvl = generateLevel(
          LEVEL_WIDTH,
          LEVEL_HEIGHT,
          nextDepth,
          prev.playerStats.turnsPlayed,
          prev.playerStats.realTimeSeconds,
          prev.playerStats,
          prev.currentWeapon,
          prev.defeatedEnemiesCount,
          prev.clearedCamps?.length || 0
        );

        const fov = computeFOV(nextLvl.playerX, nextLvl.playerY, nextLvl.map, 6);
        const discovered = nextLvl.map.map((row, y) => row.map((_, x) => fov[y][x]));
        const props = generateDungeonProps(nextLvl.map, nextDepth);

        const boss = nextLvl.enemies.find(e => e.isBoss);
        if (boss) {
          setTimeout(() => {
            addLogMessage(`👑 WARNING: An ancient, powerful presence commands this chamber... ${boss.name} awaits!`, 'danger');
          }, 100);
        }

        return {
          ...prev,
          playerX: nextLvl.playerX,
          playerY: nextLvl.playerY,
          map: nextLvl.map,
          visible: fov,
          discovered: discovered,
          enemies: spawnFollowersOnLevelLoadByReset(nextLvl.enemies, prev.followers, nextLvl.playerX, nextLvl.playerY, nextLvl.map),
          traps: nextLvl.traps,
          chests: nextLvl.chests,
          lootPiles: [],
          corpses: [],
          bloodSplatters: [],
          dungeonProps: props,
          dungeonLevels: nextDungeonLevels,
          playerStats: {
            ...prev.playerStats,
            depth: nextDepth,
          },
        };
      }
    });

    setActiveTab('dungeon');
  };

  const descendToDungeonFirstFloor = () => {
    playSound('levelUp');
    addLogMessage(`🪜 You descend into the black cave opening... Abyss Floor 1! Spikes, traps, and demonic forge pieces await!`, 'system');
    
    setGameState((prev) => {
      // Save current overworld chunk state
      const currentChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const currentChunkCopy: OverworldChunk = {
        chunkX: prev.currentChunkX,
        chunkY: prev.currentChunkY,
        map: prev.map,
        discovered: prev.discovered,
        visible: prev.visible,
        enemies: prev.enemies,
        traps: prev.traps,
        chests: prev.chests,
        npcs: prev.npcs,
        lootPiles: prev.lootPiles || [],
        dungeons: [],
        towns: [],
        biome: prev.biome,
        weather: prev.weather,
      };

      const chunkX = prev.currentChunkX;
      const chunkY = prev.currentChunkY;
      const dungeonKey = `${chunkX},${chunkY}_depth-1`;
      const existing = prev.dungeonLevels[dungeonKey];

      if (existing) {
        // Restore existing depth 1 of this dungeon
        const stairsUpY = existing.map.findIndex(row => row.includes(TileType.StairsUp));
        const stairsUpX = stairsUpY !== -1 ? existing.map[stairsUpY].indexOf(TileType.StairsUp) : 12;

        const syncedEnemies = spawnFollowersOnLevelLoadByReset(
          existing.enemies,
          prev.followers,
          stairsUpX,
          stairsUpY,
          existing.map
        );

        const fov = computeFOV(stairsUpX, stairsUpY, existing.map, 6);
        const discovered = existing.map.map((row, y) =>
          row.map((cell, x) => (existing.discovered[y]?.[x] || fov[y]?.[x] || false))
        );

        return {
          ...prev,
          isOverworld: false,
          dungeonEntranceChunkX: chunkX,
          dungeonEntranceChunkY: chunkY,
          dungeonEntrancePlayerX: prev.playerX,
          dungeonEntrancePlayerY: prev.playerY,
          overworldChunks: {
            ...prev.overworldChunks,
            [currentChunkKey]: currentChunkCopy
          },
          playerX: stairsUpX,
          playerY: stairsUpY,
          map: existing.map,
          visible: fov,
          discovered: discovered,
          enemies: syncedEnemies,
          traps: existing.traps,
          chests: existing.chests,
          npcs: [],
          lootPiles: existing.lootPiles || [],
          corpses: existing.corpses || [],
          bloodSplatters: existing.bloodSplatters || [],
          dungeonProps: existing.props || [],
          playerStats: {
            ...prev.playerStats,
            depth: 1
          }
        };
      } else {
        // Create clean depth 1 layout
        const nextDepth = 1;
        const nextLvl = generateLevel(LEVEL_WIDTH, LEVEL_HEIGHT, nextDepth, prev.playerStats.turnsPlayed, prev.playerStats.realTimeSeconds, prev.playerStats, prev.currentWeapon, prev.defeatedEnemiesCount, prev.clearedCamps?.length || 0);
        const fov = computeFOV(nextLvl.playerX, nextLvl.playerY, nextLvl.map, 6);
        const discovered = nextLvl.map.map((row, y) => row.map((_, x) => fov[y][x]));
        const props = generateDungeonProps(nextLvl.map, nextDepth);

        const boss = nextLvl.enemies.find(e => e.isBoss);
        if (boss) {
          setTimeout(() => {
            addLogMessage(`👑 WARNING: An ancient, powerful presence commands this chamber... ${boss.name} awaits!`, 'danger');
          }, 100);
        }

        return {
          ...prev,
          isOverworld: false,
          dungeonEntranceChunkX: chunkX,
          dungeonEntranceChunkY: chunkY,
          dungeonEntrancePlayerX: prev.playerX,
          dungeonEntrancePlayerY: prev.playerY,
          overworldChunks: {
            ...prev.overworldChunks,
            [currentChunkKey]: currentChunkCopy
          },
          playerX: nextLvl.playerX,
          playerY: nextLvl.playerY,
          map: nextLvl.map,
          visible: fov,
          discovered: discovered,
          enemies: spawnFollowersOnLevelLoadByReset(nextLvl.enemies, prev.followers, nextLvl.playerX, nextLvl.playerY, nextLvl.map),
          traps: nextLvl.traps,
          chests: nextLvl.chests,
          npcs: [],
          lootPiles: [],
          corpses: [],
          bloodSplatters: [],
          dungeonProps: props,
          playerStats: {
            ...prev.playerStats,
            depth: 1
          }
        };
      }
    });

    setActiveTab('dungeon');
    setTimeout(() => {
      document.getElementById('dungeon-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const climbStairsUpToOverworld = () => {
    if (gameState.isOverworld || gameState.playerStats.depth !== 1) {
      addLogMessage(`❌ There are no overworld stairs here. You are too deep in the dungeon.`, 'system');
      return;
    }

    playSound('levelUp');
    addLogMessage(`🪜 You climbed back out of the cave depths into the fresh air of the Overworld!`, 'system');

    setGameState((prev) => {
      const exChunkX = prev.dungeonEntranceChunkX ?? 0;
      const exChunkY = prev.dungeonEntranceChunkY ?? 0;
      const exPlayerX = prev.dungeonEntrancePlayerX ?? 25;
      const exPlayerY = prev.dungeonEntrancePlayerY ?? 15;

      // Save current Depth 1 dungeon state
      const currentDepth = prev.playerStats.depth;
      const key = `${exChunkX},${exChunkY}_depth-${currentDepth}`;

      const saved: DungeonLevelState = {
        depth: currentDepth,
        chunkX: exChunkX,
        chunkY: exChunkY,
        map: prev.map,
        discovered: prev.discovered,
        visible: prev.visible,
        enemies: prev.enemies,
        traps: prev.traps,
        chests: prev.chests,
        lootPiles: prev.lootPiles || [],
        corpses: prev.corpses || [],
        bloodSplatters: prev.bloodSplatters || [],
        props: prev.dungeonProps || [],
      };

      const updatedDungeonLevels = {
        ...prev.dungeonLevels,
        [key]: saved,
      };

      const targetChunkKey = `${exChunkX},${exChunkY}`;
      let targetChunk = prev.overworldChunks[targetChunkKey];
      let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
      let nextOverworldChunks = { ...prev.overworldChunks };
      
      if (!targetChunk) {
        targetChunk = generateOverworldChunk(exChunkX, exChunkY, LEVEL_WIDTH, LEVEL_HEIGHT, nextSpawnedCats, false, prev.playerStats, prev.currentWeapon);
        targetChunk.npcs.forEach(n => {
          if (n.id?.startsWith('npc_cat_')) {
            const catName = n.name.split(' (')[0];
            if (!nextSpawnedCats.includes(catName)) {
              nextSpawnedCats.push(catName);
            }
          }
        });
        nextOverworldChunks[targetChunkKey] = targetChunk;
      }

      const fov = computeFOV(exPlayerX, exPlayerY, targetChunk.map, 6);
      const discovered = targetChunk.map.map((row, y) =>
        row.map((cell, x) => ((targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
      );

      return {
        ...prev,
        isOverworld: true,
        isArena: false,
        currentChunkX: exChunkX,
        currentChunkY: exChunkY,
        playerX: exPlayerX,
        playerY: exPlayerY,
        map: targetChunk.map,
        discovered: discovered,
        visible: fov,
        enemies: spawnFollowersOnLevelLoadByReset(targetChunk.enemies, prev.followers, exPlayerX, exPlayerY, targetChunk.map),
        traps: targetChunk.traps,
        chests: targetChunk.chests,
        npcs: targetChunk.npcs,
        lootPiles: targetChunk.lootPiles || [],
        corpses: [],
        bloodSplatters: [],
        dungeonProps: [],
        dungeonLevels: updatedDungeonLevels,
        overworldChunks: nextOverworldChunks,
        spawnedCats: nextSpawnedCats,
        playerStats: {
          ...prev.playerStats,
          depth: 0,
        }
      };
    });

    setActiveTab('dungeon');
    setTimeout(() => {
      document.getElementById('dungeon-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const climbToPreviousDepth = () => {
    if (gameState.isOverworld || gameState.playerStats.depth <= 1) {
      addLogMessage(`❌ You cannot climb to a previous depth.`, 'system');
      return;
    }

    playSound('levelUp');
    const nextDepth = gameState.playerStats.depth - 1;
    addLogMessage(`🪜 You climbed back up the stairs to Abyss Floor ${nextDepth}.`, 'system');

    setGameState((prev) => {
      const chunkX = prev.dungeonEntranceChunkX ?? prev.currentChunkX;
      const chunkY = prev.dungeonEntranceChunkY ?? prev.currentChunkY;
      const currentDepth = prev.playerStats.depth;
      const key = `${chunkX},${chunkY}_depth-${currentDepth}`;

      // 1. Save current depth status
      const saved: DungeonLevelState = {
        depth: currentDepth,
        chunkX,
        chunkY,
        map: prev.map,
        discovered: prev.discovered,
        visible: prev.visible,
        enemies: prev.enemies,
        traps: prev.traps,
        chests: prev.chests,
        lootPiles: prev.lootPiles || [],
        corpses: prev.corpses || [],
        bloodSplatters: prev.bloodSplatters || [],
        props: prev.dungeonProps || [],
      };

      const updatedDungeonLevels = {
        ...prev.dungeonLevels,
        [key]: saved,
      };

      // 2. Load previous depth status
      const prevKey = `${chunkX},${chunkY}_depth-${nextDepth}`;
      const existing = updatedDungeonLevels[prevKey];

      if (existing) {
        // Find Stairs Down to place player (since they came UP, they spawn on Stairs Down tile)
        const stairsDownY = existing.map.findIndex(row => row.includes(TileType.StairsDown));
        const stairsDownX = stairsDownY !== -1 ? existing.map[stairsDownY].indexOf(TileType.StairsDown) : 12;

        const syncedEnemies = spawnFollowersOnLevelLoadByReset(
          existing.enemies,
          prev.followers,
          stairsDownX,
          stairsDownY,
          existing.map
        );

        const fov = computeFOV(stairsDownX, stairsDownY, existing.map, 6);
        const discovered = existing.map.map((row, y) =>
          row.map((cell, x) => (existing.discovered[y]?.[x] || fov[y]?.[x] || false))
        );

        return {
          ...prev,
          playerX: stairsDownX,
          playerY: stairsDownY,
          map: existing.map,
          visible: fov,
          discovered: discovered,
          enemies: syncedEnemies,
          traps: existing.traps,
          chests: existing.chests,
          lootPiles: existing.lootPiles || [],
          corpses: existing.corpses || [],
          bloodSplatters: existing.bloodSplatters || [],
          dungeonProps: existing.props || [],
          dungeonLevels: updatedDungeonLevels,
          playerStats: {
            ...prev.playerStats,
            depth: nextDepth,
          },
        };
      } else {
        // Fallback (should theoretically never happen because players must have visited prevDepth)
        const prevLvl = generateLevel(
          LEVEL_WIDTH,
          LEVEL_HEIGHT,
          nextDepth,
          prev.playerStats.turnsPlayed,
          prev.playerStats.realTimeSeconds,
          prev.playerStats,
          prev.currentWeapon,
          prev.defeatedEnemiesCount,
          prev.clearedCamps?.length || 0
        );

        const fov = computeFOV(prevLvl.playerX, prevLvl.playerY, prevLvl.map, 6);
        const discovered = prevLvl.map.map((row, y) => row.map((_, x) => fov[y][x]));
        const props = generateDungeonProps(prevLvl.map, nextDepth);

        return {
          ...prev,
          playerX: prevLvl.playerX,
          playerY: prevLvl.playerY,
          map: prevLvl.map,
          visible: fov,
          discovered: discovered,
          enemies: spawnFollowersOnLevelLoadByReset(prevLvl.enemies, prev.followers, prevLvl.playerX, prevLvl.playerY, prevLvl.map),
          traps: prevLvl.traps,
          chests: prevLvl.chests,
          lootPiles: [],
          corpses: [],
          bloodSplatters: [],
          dungeonProps: props,
          dungeonLevels: updatedDungeonLevels,
          playerStats: {
            ...prev.playerStats,
            depth: nextDepth,
          },
        };
      }
    });

    setActiveTab('dungeon');
    setTimeout(() => {
      document.getElementById('dungeon-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const interactWithNpc = (npc: NPC) => {
    playSound('loot');
    const normTime = gameState.gameTime % 1440;
    const hr = Math.floor(normTime / 60);
    const isNight = hr >= 21 || hr < 7;
    let text = '';
    
    // 1. QUEST BOARD
    if (npc.role === ('quest_board' as any)) {
      setGameState(prev => ({ ...prev, activeQuestBoardOpen: true }));
      addLogMessage('📜 You examine the Oakhaven notice Quest Board.', 'system');
      return;
    }

    // 2. COMPANION HIRE
    if (npc.role === ('companion_hire' as any)) {
      if (gameState.followers.length >= 3) {
        addLogMessage('🗣| Sade says: "Your party is full! You can only manage up to 3 companions."', 'system');
        return;
      }

      const cost = 180;
      if (gameState.playerStats.gold < cost) {
        addLogMessage(`🗣| ${npc.name} says: "I require ${cost} Gold to pledge my steel. You look a bit short on pouch."`, 'system');
        return;
      }

      // Process hire
      setGameState((prev) => {
        const isGuard = npc.char === '🛡';
        const rep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const isEliteGuard = isGuard && rep >= 81;

        const nextFollower: Follower = {
          id: `fol_${Date.now()}`,
          name: isEliteGuard ? `${npc.name.split(' (')[0]} (Elite Shield Guard)` : npc.name.split(' (')[0],
          archetypeId: isGuard ? 'guard' : 'thief',
          role: 'follower',
          char: npc.char,
          color: isEliteGuard ? '#f59e0b' : npc.color,
          hp: isEliteGuard ? 65 : (isGuard ? 40 : 30),
          maxHp: isEliteGuard ? 65 : (isGuard ? 40 : 30),
          atk: isEliteGuard ? 10 : (isGuard ? 6 : 5),
          def: isEliteGuard ? 6 : (isGuard ? 3 : 1),
          level: isEliteGuard ? 4 : 1,
          xp: 0,
          xpNext: 100,
          mode: 'follow',
          equipment: { weapon: null, armor: null },
          inventory: [],
          injuries: [],
          personality: isEliteGuard 
            ? 'Elite heavy-plate peacekeeper sworn to defend the Sunder Champion.' 
            : (isGuard ? 'Shield-bearer defender' : 'Agile critical lockpicker'),
          temperament: 'Loyal'
        };

        // Remove from town npcs lists
        const nextNpcs = prev.npcs.filter(n => n.id !== npc.id);

        const newActor: Enemy = {
          id: `actor_${nextFollower.id}`,
          x: npc.x,
          y: npc.y,
          type: 'Goblin' as any, // Standard melee follow/fight brain
          name: nextFollower.name,
          hp: nextFollower.hp,
          maxHp: nextFollower.maxHp,
          atk: nextFollower.atk,
          def: nextFollower.def,
          range: 1,
          speed: 1,
          color: nextFollower.color,
          char: nextFollower.char,
          state: EnemyState.Chasing,
          isElite: isEliteGuard,
          patrolPath: [],
          patrolIndex: 0,
          debuffs: [],
          isFollower: true,
          followerId: nextFollower.id
        };

        const logsText = isEliteGuard 
          ? `👥 COMPANION JOINED: ${nextFollower.name} pledged heavy plate steel to the Champion! (-${cost} Gold)`
          : `👥 COMPANION JOINED: ${nextFollower.name} joins your party! (-${cost} Gold)`;

        return {
          ...prev,
          playerStats: {
            ...prev.playerStats,
            gold: Math.max(0, prev.playerStats.gold - cost)
          },
          followers: [...prev.followers, nextFollower],
          enemies: [...prev.enemies, newActor],
          npcs: nextNpcs,
          logs: [...prev.logs, {
            id: `hire_${Date.now()}`,
            text: logsText,
            type: 'loot',
            timestamp: 'RECRUIT'
          }]
        };
      });

      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: npc.x, y: npc.y, text: `👥 Allied!`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);
      return;
    }

    // 2.5 SPECIAL CAT HIRE
    if (npc.role === 'special_cat') {
      if (gameState.followers.length >= 3) {
        addLogMessage(`🐈 ${npc.name} meows softly: "Your party is full! You can only manage up to 3 companions."`, 'system');
        return;
      }

      setGameState((prev) => {
        const catName = npc.name.split(' (')[0];
        let catPersonality = 'Elusive Legendary Town Cat';
        let catTemperament = 'Loyal but Flee-prone';
        let catHp = 15;
        let catAtk = 2;
        let catDef = 0;

        if (catName === 'Alli') {
          catPersonality = 'Royal Silver Cat';
          catTemperament = 'Dignified & Regal';
          catHp = 15;
          catAtk = 2;
          catDef = 1;
        } else if (catName === 'Leevi') {
          catPersonality = 'Eternally Angry Battle Cat';
          catTemperament = 'Fierce, Aggressive & Grumpy';
          catHp = 12;
          catAtk = 5;
          catDef = 0;
        } else if (catName === 'Pulla') {
          catPersonality = 'True Loyal Companion';
          catTemperament = 'Warm, Trusting & Obedient';
          catHp = 18;
          catAtk = 2;
          catDef = 1;
        } else if (catName === 'Jekku') {
          catPersonality = 'Playful Orange Trickster';
          catTemperament = 'Mischievous & Energetic';
          catHp = 15;
          catAtk = 3;
          catDef = 0;
        }

        const nextFollower: Follower = {
          id: `fol_${Date.now()}`,
          name: catName,
          archetypeId: 'cat',
          role: 'follower',
          char: npc.char,
          color: npc.color,
          hp: catHp,
          maxHp: catHp,
          atk: catAtk,
          def: catDef,
          level: 1,
          xp: 0,
          xpNext: 100,
          mode: 'follow',
          equipment: { weapon: null, armor: null },
          inventory: [],
          injuries: [],
          personality: catPersonality,
          temperament: catTemperament
        };

        const nextNpcs = prev.npcs.filter(n => n.id !== npc.id);

        const newActor: Enemy = {
          id: `actor_${nextFollower.id}`,
          x: npc.x,
          y: npc.y,
          type: 'Goblin' as any,
          name: nextFollower.name,
          hp: nextFollower.hp,
          maxHp: nextFollower.maxHp,
          atk: nextFollower.atk,
          def: nextFollower.def,
          range: 1,
          speed: 1,
          color: nextFollower.color,
          char: nextFollower.char,
          state: EnemyState.Chasing,
          isElite: false,
          patrolPath: [],
          patrolIndex: 0,
          debuffs: [],
          isFollower: true,
          followerId: nextFollower.id
        };

        const catSpawns = prev.spawnedCats ? [...prev.spawnedCats] : [];
        if (!catSpawns.includes(catName)) {
          catSpawns.push(catName);
        }

        return {
          ...prev,
          followers: [...prev.followers, nextFollower],
          enemies: [...prev.enemies, newActor],
          npcs: nextNpcs,
          spawnedCats: catSpawns,
          logs: [...prev.logs, {
            id: `hire_cat_${Date.now()}`,
            text: `🐈 LEGENDARY COMPANION JOINED: ${nextFollower.name} decides to accompany you on your adventure!`,
            type: 'loot',
            timestamp: 'RECRUIT'
          }]
        };
      });

      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: npc.x, y: npc.y, text: `🐾 Purr!`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);
      return;
    }

    // 3. BOAT JOURNEY PASSAGE
    if (npc.role === ('harbor_captain' as any)) {
      if (gameState.playerStats.gold < 200) {
        addLogMessage(`🗣️ Captain Jack says: "Paid passage fare is 200 Gold coins. No free loading!"`, 'system');
        return;
      }

      const inHarbor = (gameState.currentChunkX === 3 && gameState.currentChunkY === -2);
      const targetCx = inHarbor ? 0 : 3;
      const targetCy = inHarbor ? 0 : -2;
      const destName = inHarbor ? 'Oakhaven Hamlet' : 'Vanguard Harbor Port';

      setGameState((prev) => {
        // Advanced game clock 8 hours (480 minutes)
        const advancedTime = (prev.gameTime + 480) % 1440;
        const nextLogs = [...prev.logs, {
          id: `sail_${Date.now()}`,
          text: `⛵ Captain Jack hoists the anchors! You sail across cresting waves to ${destName}... (-400 Gold, 8 hours passage time)`,
          type: 'info' as const,
          timestamp: 'VOYAGE'
        }];

        return {
          ...prev,
          currentChunkX: targetCx,
          currentChunkY: targetCy,
          playerX: 10, 
          playerY: 12,
          isOverworld: true,
          npcs: [], // force reload chunk npcs on cross over
          gameTime: advancedTime,
          playerStats: {
            ...prev.playerStats,
            gold: Math.max(0, prev.playerStats.gold - 400)
          },
          logs: nextLogs
        };
      });

      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: npc.x, y: npc.y, text: `⛵ Set Sail!`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);
      return;
    }

    if (npc.role === 'traveler_herbalist' || npc.role === 'traveler_hunter' || npc.role === 'traveler_pilgrim') {
      setActiveTravelerNpc(npc);
      addLogMessage(`🧭 You approach ${npc.name} resting in the Sunder wilderness.`, 'system');
      return;
    }

    if ((npc.role as any) === 'drunk_villager') {
      setActiveDrunkNpc(npc);
      addLogMessage(`🍻 You pull up a wooden stool to sit with ${npc.name}.`, 'system');
      return;
    }

    if (isNight) {
      text = npc.dialogue[3]; // sleeping dialogue
      addLogMessage(`🗣️ ${npc.name} dreams: "${text}"`, 'system');
      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: npc.x, y: npc.y, text: `💤 Zzz...`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);
    } else {
      text = npc.dialogue[Math.floor(Math.random() * 3)];
      addLogMessage(`🗣️ ${npc.name} says: "${text}"`, 'system');
      
      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: npc.x, y: npc.y, text: `🗣️ Hello!`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);

      // Open store dashboard if they are Merchant, Blacksmith, or Apothecary!
      if (npc.role !== 'villager' && npc.role !== ('quest_board' as any) && npc.role !== ('companion_hire' as any)) {
        const rep = gameState.townReputation !== undefined ? gameState.townReputation : 100;
        if (rep <= 20 && npc.role !== 'merchant_seppo') {
          playSound('deny');
          addLogMessage(`😡 ${npc.name} spits on the ground: "I don't deal with infamous Sunder Outlaws! Scram before I call the guards!"`, 'danger');
        } else {
          setGameState(prev => ({ ...prev, activeTradeNpcId: npc.id }));
          setActiveTab('market');
          addLogMessage(`🛒 Trading store opened with ${npc.name}! Buy equipment or sell materials and excess gear.`, 'craft');
        }
      }
    }
  };

  const interactWithFollower = (follower: Enemy) => {
    const linkedFollower = gameState.followers.find(f => f.id === follower.followerId);
    const archetype = linkedFollower?.archetypeId || 'generic';
    
    // Choose appropriate sound
    if (archetype === 'cat') {
      playSound('levelUp');
    } else {
      playSound('loot');
    }

    const lowercaseName = follower.name.toLowerCase();
    let quote = '';
    let effectText = '💬 Chat!';

    if (archetype === 'cat' || lowercaseName.includes('cat') || lowercaseName.includes('purr') || lowercaseName.includes('whiskers') || lowercaseName.includes('meow')) {
      const catQuotes = [
        `"Meow! 🐾 *rubs happily against your boots*"`,
        `"Prrr... *stares into your soul with brilliant, round eyes*"`,
        `"Meow? *playfully bats at your shiny weapon straps*"`,
        `"*stretches gracefully on the floor, letting out a soft purr*"`,
        `"Meow! *chirps excitedly and points its whiskers toward hidden corridors*"`
      ];
      quote = catQuotes[Math.floor(Math.random() * catQuotes.length)];
      effectText = '🐾 Purr!';
    } else if (archetype === 'guard' || archetype === 'merchant_guard' || lowercaseName.includes('guard') || lowercaseName.includes('shield')) {
      const guardQuotes = [
        `"Watching your back, commander! Let no raider ambush us."`,
        `"My heavy shield stands ready. No blade shall touch you while I draw breath!"`,
        `"Stay sharp, friend. The ambient flow of this dungeon feels dangerous."`,
        `"I've got your flank fully covered. Lead the way!"`,
        `"Ready for the next clash. Just give the order!"`
      ];
      quote = guardQuotes[Math.floor(Math.random() * guardQuotes.length)];
      effectText = '🛡️ Shield!';
    } else if (archetype === 'thief' || lowercaseName.includes('thief') || lowercaseName.includes('rogue')) {
      const thiefQuotes = [
        `"Keep it quiet... we don't want to alert the whole dungeon floor."`,
        `"Always scanning the dark. Say, spotted any locked chests nearby?"`,
        `"My daggers are clean, oiled, and ready. Let me know if you need lockpicks!"`,
        `"Slinking through the shadows is my specialty. What's our next move?"`,
        `"Shh! I heard a scuttle... or maybe it was just the wind."`
      ];
      quote = thiefQuotes[Math.floor(Math.random() * thiefQuotes.length)];
      effectText = '🗡️ Rogue!';
    } else if (follower.isCaptive && follower.isFreed) {
      quote = `"Thank you again for releasing me from that cage! Let's cleanse these dark ruins together!"`;
      effectText = '🔓 Freed!';
    } else {
      const genericQuotes = [
        `"With you to the end, adventurer! Let's conquer these levels."`,
        `"Lead on! I'll be right behind you to watch our rear."`,
        `"An honor to fight by your side. What's our next target?"`,
        `"We make quite the team, don't we? Let's find some legendary treasure!"`,
        `"We've survived this far. Together, we're completely unstoppable!"`
      ];
      quote = genericQuotes[Math.floor(Math.random() * genericQuotes.length)];
      effectText = '🤝 Ally!';
    }

    // Add speech message to the log
    const normTime = gameState.gameTime % 1440;
    const { timeStr } = formatGameTime(normTime);
    
    setGameState(prev => {
      const truncatedLogs = prev.logs.length > 35 ? prev.logs.slice(1) : prev.logs;
      return {
        ...prev,
        logs: [
          ...truncatedLogs,
          {
            id: `talk_fol_${Date.now()}_${Math.random()}`,
            text: `🗣️ [Companion] ${follower.name} says: ${quote}`,
            type: 'info',
            timestamp: timeStr
          }
        ]
      };
    });

    // Spawn floating interaction text
    const talkEvent = new CustomEvent('spawn-game-effect', {
      detail: { x: follower.x, y: follower.y, text: effectText, type: 'heal' },
    });
    window.dispatchEvent(talkEvent);
  };

  const getCombatFlavorText = (weapon: CraftedWeapon, enemyName: string, isCrit: boolean): string => {
    const name = enemyName;
    const base = weapon.baseType;

    const pool = COMBAT_FLAVOR_TEXTS[base] || FALLBACK_FLAVORS;
    const array = isCrit ? pool.crit : pool.normal;
    const index = Math.floor(Math.random() * array.length);
    return array[index].replace(/{name}/g, name);
  };

  // Ranged and Melee interactive attack handler
  const performPlayerAttack = (enemy: Enemy, index: number, pathPoints: {x:number, y:number}[]) => {
    if (enemy.isFollower || (enemy.isCaptive && enemy.isFreed)) {
      interactWithFollower(enemy);
      return false;
    }

    const weapon = gameState.currentWeapon || STARTING_WEAPON;
    const stats = getEffectiveStats(gameState.playerStats);

    // Check custom ammunition costs (Staff or Wand costs mana)
    const isMagic = weapon.baseType === WeaponBaseType.Staff || weapon.baseType === WeaponBaseType.Wand;
    const activeSpell = SPELLS.find(s => s.id === selectedSpellId) || SPELLS[0];
    let finalManaCost = isMagic
      ? (weapon.baseType === WeaponBaseType.Wand ? Math.max(2, activeSpell.manaCost - 1) : activeSpell.manaCost)
      : 0;

    if (isMagic && stats.relics?.includes('mana_battery')) {
      finalManaCost = Math.max(1, finalManaCost - 3);
    }

    if (isMagic && stats.mp < finalManaCost) {
      addLogMessage(`❌ Magic casting with ${weapon.name} requires ${finalManaCost} Mana! Wait to restore Mana!`, 'system');
      playSound('bump');
      return false;
    }

    // Spend mana
    let spentMp = 0;
    if (isMagic) {
      spentMp = finalManaCost;
      playSound('spell');
    } else {
      playSound('slash');
    }

    // Roll damage & critical rates
    const isBroken = weapon.durability !== undefined && weapon.durability <= 0;
    const playerExhaustion = stats.exhaustion || 0;
    const exhaustionPenalty = (playerExhaustion / 100) * 0.15;

    let activeEffectsAtkBonus = 0;
    let activeEffectsCritBonus = 0;
    if (stats.activeEffects) {
      stats.activeEffects.forEach(eff => {
        if (eff.statModifiers) {
          if (eff.statModifiers.atk) activeEffectsAtkBonus += eff.statModifiers.atk;
          if (eff.statModifiers.crit) activeEffectsCritBonus += eff.statModifiers.crit;
        }
      });
    }

    const factionCritBonus = (gameState.factionTerritories?.['moonshadow_cove']?.controller === gameState.faction) ? 0.05 : 0;
    const finalCritChance = Math.max(0.01, weapon.critChance - exhaustionPenalty + (gameState.activeFoodBuff?.critBonus || 0) + activeEffectsCritBonus + factionCritBonus);
    const rollCrit = isBroken ? false : (Math.random() < finalCritChance);
    if (playerExhaustion > 40 && !isBroken) {
      addLogMessage(`💤 [EXHAUSTED]: Physical fatigue (${playerExhaustion}% exhaustion) dampens your reflexes, reducing your critical strike chance to ${Math.round(finalCritChance * 100)}%!`, 'info');
    }
    let baseHit = (isBroken ? 1 : weapon.damage) + stats.atk + (gameState.activeFoodBuff?.atkBonus || 0) + activeEffectsAtkBonus;
    if (stats.relics?.includes('giants_blood')) {
      baseHit += 4;
    }
    if (hasEquippedTrait(gameState, 'WORG_FORCE')) {
      baseHit += 3;
    }

    // Dual Wielding Off-Hand Bonus (when holding a weapon in the off-hand slot)
    if (gameState.equippedShield && (gameState.equippedShield.type === 'weapon' || (gameState.equippedShield.damage ?? 0) > 0) && gameState.equippedShield.subType !== 'Shield') {
      const offhandDmg = gameState.equippedShield.damage || 0;
      const offhandBonus = Math.max(1, Math.floor(offhandDmg * 0.5));
      baseHit += offhandBonus;
    }
    
    // Apply spell power scaling if magic
    if (isMagic) {
      let spellScale = activeSpell.damageMultiplier;
      if (stats.relics?.includes('spell_weaver')) {
        spellScale *= 1.15;
      }
      if (isLunarBlessingActive(gameState, 'full_moon')) {
        spellScale *= 1.25;
      }
      baseHit = Math.round(baseHit * spellScale);
    }

    // Apply Sandbox Player Damage Multiplier
    const playerDmgMult = (window as any).arenaPlayerDamageMultiplier || 1.0;
    baseHit = Math.round(baseHit * playerDmgMult);
    
    // Core alloys effects (e.g. Obsidian deals +150% crit damage)
    let critMult = 2.0;
    if (!isBroken && weapon.materialUsed.extraProperty === 'CRIT_HEAVY' && rollCrit) {
      critMult = 2.5;
    }

    let finalHit = rollCrit ? Math.floor(baseHit * critMult) : baseHit;

    // Autumn Stealth Crit Bonus (+40% extra damage on critical strikes in Autumn)
    if (rollCrit && gameState.season === 'autumn') {
      finalHit = Math.floor(finalHit * 1.40);
      addLogMessage(`🍂 [AUTUMN STEALTH]: Shadow critical strikes from the amber mists deal +40% extra damage!`, 'craft');
    }

    // Summer Catalyst Spark / Lightning Charge (+25% extra lightning damage during Summer)
    const catalyst = weapon.catalystUsed;
    if (gameState.season === 'summer' && catalyst && (catalyst.type === CatalystType.Lightning || catalyst.id?.includes('lightning') || catalyst.name?.includes('Lightning'))) {
      finalHit = Math.floor(finalHit * 1.25);
      addLogMessage(`⚡ [SUMMER SUPERCHARGE]: Heatwaves supercharge your Lightning catalyst for +25% extra damage!`, 'craft');
    }

    // Weather Specific Combat Buffs and Modifiers
    if (gameState.isOverworld && gameState.weather) {
      const effect = WEATHER_EFFECTS[gameState.weather];
      if (effect && effect.combatModifiers) {
        const mods = effect.combatModifiers;
        if (catalyst && mods.catalystModifiers) {
          const catMod = mods.catalystModifiers[catalyst.type];
          if (catMod) {
            finalHit = Math.floor(finalHit * catMod.multiplier);
            addLogMessage(catMod.logText, 'craft');
          }
        }
        if (mods.blindnessChance && Math.random() < mods.blindnessChance) {
          finalHit = Math.floor(finalHit * (mods.blindnessMultiplier ?? 0.5));
          if (mods.blindnessLog) {
            addLogMessage(mods.blindnessLog, 'danger');
          }
        }
      }
    }

    // Initialize enemy debuffs
    let nextDebuffs = [...enemy.debuffs];
    let comboDmgBonus = 0;
    let comboTriggered = false;
    let comboLog = '';
    let comboEffectText = '';

    // Spell Combo Mechanics (Elemental Interactions)
    if (isMagic) {
      // 1. SHATTER (Frostbite Lance + Lightning debuff OR Chain Lightning + Frost debuff)
      if (activeSpell.id === 'frostbite_lance' && nextDebuffs.some(d => d.type === CatalystType.Lightning)) {
        comboTriggered = true;
        comboDmgBonus = 25;
        nextDebuffs = nextDebuffs.filter(d => d.type !== CatalystType.Lightning);
        comboLog = `❄️⚡ SPELL COMBO [SHATTER]: ${enemy.name} was Shocked, and your Frostbite Lance shattered the conductive ice! Deals +25 bonus damage!`;
        comboEffectText = `💥 SHATTER! +25`;
      } else if (activeSpell.id === 'chain_lightning' && nextDebuffs.some(d => d.type === CatalystType.Frost)) {
        comboTriggered = true;
        comboDmgBonus = 25;
        nextDebuffs = nextDebuffs.filter(d => d.type !== CatalystType.Frost);
        comboLog = `⚡❄️ SPELL COMBO [SHATTER]: ${enemy.name} was Frozen, and your Chain Lightning shattered the brittle frozen core! Deals +25 bonus damage!`;
        comboEffectText = `💥 SHATTER! +25`;
      }
      // 2. MELT (Pyroblast + Frost debuff OR Frostbite Lance + Fire debuff)
      else if (activeSpell.id === 'pyroblast' && nextDebuffs.some(d => d.type === CatalystType.Frost)) {
        comboTriggered = true;
        comboDmgBonus = 20;
        nextDebuffs = nextDebuffs.filter(d => d.type !== CatalystType.Frost);
        comboLog = `🔥❄️ SPELL COMBO [MELT]: ${enemy.name} was Frozen, and your Pyroblast vaporized the ice in a burst of superheated steam! Deals +20 bonus damage!`;
        comboEffectText = `💧 STEAM BLAST! +20`;
      } else if (activeSpell.id === 'frostbite_lance' && nextDebuffs.some(d => d.type === CatalystType.Fire)) {
        comboTriggered = true;
        comboDmgBonus = 20;
        nextDebuffs = nextDebuffs.filter(d => d.type !== CatalystType.Fire);
        comboLog = `❄️🔥 SPELL COMBO [MELT]: ${enemy.name} was Burning, and your Frostbite Lance rapidly cooled the hot flesh causing severe thermal shock! Deals +20 bonus damage!`;
        comboEffectText = `💧 THERMAL SHOCK! +20`;
      }
      // 3. COMBUSTION (Pyroblast on Poison debuff)
      else if (activeSpell.id === 'pyroblast' && nextDebuffs.some(d => d.type === CatalystType.Poison)) {
        comboTriggered = true;
        comboDmgBonus = 20;
        nextDebuffs = nextDebuffs.filter(d => d.type !== CatalystType.Poison);
        comboLog = `🔥🧪 SPELL COMBO [COMBUSTION]: ${enemy.name} was Poisoned, and your Pyroblast ignited the noxious toxic fumes! Deals +20 bonus damage and triggers a gas burst!`;
        comboEffectText = `💥 COMBUSTION! +20`;

        const splashEvent = new CustomEvent('spawn-game-effect', {
          detail: {
            x: enemy.x,
            y: enemy.y,
            text: `🔥 TOXIC DEFLAGRATION!`,
            type: 'crit'
          }
        });
        window.dispatchEvent(splashEvent);
      }
      // 4. VOID REAP (Void Siphon on ANY elemental debuff)
      else if (activeSpell.id === 'void_siphon' && nextDebuffs.some(d => d.type === CatalystType.Fire || d.type === CatalystType.Frost || d.type === CatalystType.Poison || d.type === CatalystType.Lightning)) {
        comboTriggered = true;
        comboDmgBonus = 15;
        const targetDebuff = nextDebuffs.find(d => d.type === CatalystType.Fire || d.type === CatalystType.Frost || d.type === CatalystType.Poison || d.type === CatalystType.Lightning);
        if (targetDebuff) {
          nextDebuffs = nextDebuffs.filter(d => d.type !== targetDebuff.type);
          comboLog = `🌌🔮 SPELL COMBO [VOID REAP]: Void Siphon consumed ${enemy.name}'s ${targetDebuff.type} affliction, tearing their lifeforce! Deals +15 bonus damage & restores +15 HP!`;
        } else {
          comboLog = `🌌🔮 SPELL COMBO [VOID REAP]: Void Siphon consumed ${enemy.name}'s affliction! Deals +15 bonus damage & restores +15 HP!`;
        }
        comboEffectText = `🌌 VOID REAP! +15`;

        // Void Siphon heals player for additional combo damage
        const isPlayerHurt = gameState.playerStats.hp < gameState.playerStats.maxHp;
        setGameState(prev => {
          const stats = { ...prev.playerStats };
          stats.hp = Math.min(stats.maxHp, stats.hp + 15);
          return { ...prev, playerStats: stats };
        });

        if (isPlayerHurt) {
          const healEvent = new CustomEvent('spawn-game-effect', {
            detail: { x: gameState.playerX, y: gameState.playerY, text: `+15 Combo HP`, type: 'heal' },
          });
          window.dispatchEvent(healEvent);
        }
      }
    }

    let finalComboBonus = comboDmgBonus;
    if (comboTriggered && stats.relics?.includes('spell_weaver')) {
      finalComboBonus += 5;
    }
    const finalDmg = Math.max(1, finalHit - enemy.def) + finalComboBonus;

    // Apply material specific property visual impact (e.g., Dragonforce circular ring explosion)
    if (rollCrit && weapon.materialUsed.extraProperty === 'DRAGON_FORCE') {
      addLogMessage(`🔥 Crimson DragonScale sparks circular fire ring! Nearby targets crackle!`, 'craft');
    }

    if (comboTriggered) {
      addLogMessage(comboLog, 'craft');
      // Dispatch a second game effect slightly higher for the Spell Combo label
      setTimeout(() => {
        const comboEvent = new CustomEvent('spawn-game-effect', {
          detail: {
            x: enemy.x,
            y: enemy.y,
            text: comboEffectText,
            type: 'heal', // Greenish/bluish high contrast text
          }
        });
        window.dispatchEvent(comboEvent);
      }, 100);
    }

    // Apply on-hit elemental affliction catalysts if NO combo was triggered
    if (!comboTriggered) {
      if (isMagic && activeSpell.id === 'frostbite_lance') {
        const alreadyAfflicted = nextDebuffs.some((d) => d.type === CatalystType.Frost);
        if (!alreadyAfflicted) {
          let duration = 3;
          if (stats.relics?.includes('sunder_catalyst_relic')) {
            duration += 2;
          }
          nextDebuffs.push({
            type: CatalystType.Frost,
            duration: duration,
            damagePerTurn: 2,
          });
          addLogMessage(`❄️ Frostbite lance frozen infusion: ${enemy.name} is frozen solid in deep frost!${stats.relics?.includes('sunder_catalyst_relic') ? ' (Extended by Sunder Catalyst)' : ''}`, 'craft');
        }
      } else if (catalyst) {
        const afflictedRoll = Math.random() < catalyst.statusEffectChance;
        if (afflictedRoll) {
          const alreadyAfflicted = nextDebuffs.some((d) => d.type === catalyst.type);
          if (!alreadyAfflicted) {
            let overTurnDamage = 2;
            if (catalyst.type === CatalystType.Fire) overTurnDamage = 3;
            else if (catalyst.type === CatalystType.Poison) overTurnDamage = 4;

            let duration = catalyst.statusDuration;
            if (stats.relics?.includes('sunder_catalyst_relic')) {
              duration += 2;
            }

            nextDebuffs.push({
              type: catalyst.type,
              duration: duration,
              damagePerTurn: overTurnDamage,
            });
            addLogMessage(`✨ Fused elemental affliction: ${enemy.name} is now inflicted with ${catalyst.damageType}!${stats.relics?.includes('sunder_catalyst_relic') ? ' (Extended by Sunder Catalyst)' : ''}`, 'craft');
          }
        }
      }

      // Giant's Blood stun application for physical hits
      if (!isMagic && stats.relics?.includes('giants_blood') && Math.random() < 0.25) {
        const alreadyStunned = nextDebuffs.some((d) => d.type === CatalystType.Shadow);
        if (!alreadyStunned) {
          nextDebuffs.push({
            type: CatalystType.Shadow,
            duration: 1,
            damagePerTurn: 0,
          });
          addLogMessage(`🌋 [GIANT'S BLOOD]: Brutal strike stuns ${enemy.name}!`, 'craft');
          
          const stunEv = new CustomEvent('spawn-game-effect', {
            detail: { x: enemy.x, y: enemy.y, text: '💥 STUNNED!', type: 'dmg' },
          });
          window.dispatchEvent(stunEv);
        }
      }
    }

    const updatedEnemy = {
      ...enemy,
      hp: enemy.hp - finalDmg,
      debuffs: nextDebuffs,
    };

    // Vampirism material healing
    let healingDone = 0;
    if (weapon.materialUsed.extraProperty === 'VAMPIRISM') {
      healingDone = Math.floor(finalDmg * 0.15);
    }
    if (isMagic && activeSpell.id === 'void_siphon') {
      healingDone += Math.floor(finalDmg * 0.25);
    }

    // Emit global Custom Event to trigger canvas graphics (floating text particle splatter)
    const isRanged = weapon.range > 1;
    let projType: 'arrow' | 'magic_staff' | 'electric_wand' | 'skeleton_bolt' | 'enemy_spell' | 'throwable' = 'arrow';
    if (weapon.baseType === WeaponBaseType.Staff) {
      projType = 'magic_staff';
    } else if (weapon.baseType === WeaponBaseType.Wand) {
      projType = 'electric_wand';
    } else if (weapon.baseType === WeaponBaseType.Spear || weapon.baseType === WeaponBaseType.Dagger) {
      projType = 'throwable';
    } else if (weapon.baseType === WeaponBaseType.Crossbow) {
      projType = 'arrow';
    }

    let projColor = weapon.color || '#38bdf8';
    if (isMagic) {
      if (activeSpell.id === 'pyroblast') projColor = '#f97316';
      else if (activeSpell.id === 'frostbite_lance') projColor = '#38bdf8';
      else if (activeSpell.id === 'chain_lightning') {
        projColor = '#eab308';
        projType = 'electric_wand';
      } else if (activeSpell.id === 'void_siphon') projColor = '#8b5cf6';
      else projColor = '#a78bfa';
    }

    const isPlayerHurt = gameState.playerStats.hp < gameState.playerStats.maxHp;

    if (isRanged) {
      const projEvent = new CustomEvent('spawn-projectile', {
        detail: {
          startX: gameState.playerX,
          startY: gameState.playerY,
          targetX: enemy.x,
          targetY: enemy.y,
          color: projColor,
          projectileType: projType,
          impactText: rollCrit ? `CRIT! -${finalDmg} HP` : `-${finalDmg} HP`,
          impactType: rollCrit ? 'crit' : 'dmg',
          impactHealingText: (healingDone > 0 && isPlayerHurt) ? `+${healingDone} Vamp HP` : null
        }
      });
      window.dispatchEvent(projEvent);
    } else {
      const event = new CustomEvent('spawn-game-effect', {
        detail: {
          x: enemy.x,
          y: enemy.y,
          text: rollCrit ? `CRIT! -${finalDmg} HP` : `-${finalDmg} HP`,
          type: rollCrit ? 'crit' : 'dmg',
        },
      });
      window.dispatchEvent(event);

      // If healing triggers
      if (healingDone > 0 && isPlayerHurt) {
        const healEvent = new CustomEvent('spawn-game-effect', {
          detail: { x: gameState.playerX, y: gameState.playerY, text: `+${healingDone} Vamp HP`, type: 'heal' },
        });
        window.dispatchEvent(healEvent);
      }
    }

    // Construct attack messages
    const flavor = getCombatFlavorText(weapon, enemy.name, rollCrit);
    addLogMessage(`${flavor} [${finalDmg} DMG · ${weapon.name}]`, 'combat');

    // Hammer Knockback Mechanics
    let finalEx = enemy.x;
    let finalEy = enemy.y;
    if (weapon.baseType === WeaponBaseType.Hammer) {
      const dx = enemy.x - gameState.playerX;
      const dy = enemy.y - gameState.playerY;
      const tX = enemy.x + Math.sign(dx);
      const tY = enemy.y + Math.sign(dy);

      // Verify bounds & empty tiles to push enemy back
      if (
        tX >= 0 &&
        tX < LEVEL_WIDTH &&
        tY >= 0 &&
        tY < LEVEL_HEIGHT &&
        (gameState.map[tY][tX] === TileType.Floor || gameState.map[tY][tX] === TileType.Grass || gameState.map[tY][tX] === TileType.Path)
      ) {
        finalEx = tX;
        finalEy = tY;
        updatedEnemy.x = tX;
        updatedEnemy.y = tY;
        addLogMessage(`🔨 Granite Heavy Mallet blows knock the ${enemy.name} backward!`, 'combat');
      }
    }

    // Update enemies array
    setGameState((prev) => {
      const nextEnemies = [...prev.enemies];
      let gainedXp = 0;
      let extraXpGained = 0;
      let guardWasAttacked = enemy.isTownGuard;
      let nextLootPiles = prev.lootPiles ? [...prev.lootPiles] : [];
      const nextCorpses = prev.corpses ? [...prev.corpses] : [];
      const nextSplatters = prev.bloodSplatters ? [...prev.bloodSplatters] : [];
      let updatedLogs = [...prev.logs];
      let nextDefeatedCounts = prev.defeatedEnemiesCount ? { ...prev.defeatedEnemiesCount } : {};

      const finalEnemyIndex = nextEnemies.findIndex((e) => e.id === enemy.id);

      if (finalEnemyIndex === -1) {
        // Safe check if enemy is already removed/killed
        return prev;
      }

      // Process Pyroblast Splash or Chain Lightning Chaining
      if (isMagic && activeSpell.id === 'pyroblast') {
        const primaryX = enemy.x;
        const primaryY = enemy.y;
        const splashDmg = Math.max(1, Math.floor(finalDmg * 0.50));

        for (let sIdx = nextEnemies.length - 1; sIdx >= 0; sIdx--) {
          const splashEnemy = nextEnemies[sIdx];
          if (splashEnemy.id === enemy.id) continue;

          const distToTarget = Math.abs(splashEnemy.x - primaryX) + Math.abs(splashEnemy.y - primaryY);
          if (distToTarget <= 1) {
            const finalSplashDmg = Math.max(1, splashDmg - splashEnemy.def);
            splashEnemy.hp -= finalSplashDmg;
            if (splashEnemy.isTownGuard) {
              guardWasAttacked = true;
            }

            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: splashEnemy.x, y: splashEnemy.y, text: `💥 Splash -${finalSplashDmg} HP`, type: 'dmg' },
            });
            window.dispatchEvent(ev);

            updatedLogs.push({
              id: `pyro_splash_${Date.now()}_${Math.random()}`,
              text: `🔥 Pyroblast splash singes ${splashEnemy.name} for ${finalSplashDmg} damage!`,
              type: 'combat',
              timestamp: formatGameTime(prev.gameTime).timeStr
            });

            if (Math.random() < 0.40) {
              const alreadyAfflicted = splashEnemy.debuffs.some((d) => d.type === CatalystType.Fire);
              if (!alreadyAfflicted) {
                splashEnemy.debuffs = [...splashEnemy.debuffs, {
                  type: CatalystType.Fire,
                  duration: 3,
                  damagePerTurn: 3
                }];
                updatedLogs.push({
                  id: `pyro_splash_burn_${Date.now()}_${Math.random()}`,
                  text: `✨ Pyroblast ignited ${splashEnemy.name}!`,
                  type: 'craft',
                  timestamp: formatGameTime(prev.gameTime).timeStr
                });
              }
            }

            if (splashEnemy.hp <= 0) {
              nextDefeatedCounts = incrementDefeatedEnemyCount(
                nextDefeatedCounts,
                splashEnemy.name,
                splashEnemy.type,
                !!splashEnemy.isBoss
              );
              nextEnemies.splice(sIdx, 1);
              nextCorpses.push({
                id: `corpse_${Date.now()}_${Math.random()}`,
                x: splashEnemy.x,
                y: splashEnemy.y,
                char: splashEnemy.char,
                name: splashEnemy.name,
                color: splashEnemy.color,
                type: splashEnemy.isAnimal ? 'animal' : 'enemy',
                isElite: splashEnemy.isElite,
              });
              nextSplatters.push({
                id: `splatter_slain_${Date.now()}_${Math.random()}`,
                x: splashEnemy.x,
                y: splashEnemy.y,
                intensity: 2,
                color: '#dc2626',
              });
              const splashGold = Math.floor(Math.random() * 4) + 2;
              nextLootPiles.push({
                id: `loot_${Date.now()}_${Math.random()}`,
                x: splashEnemy.x,
                y: splashEnemy.y,
                gold: splashGold,
                materials: [],
                catalysts: [],
                equipment: []
              });
              updatedLogs.push({
                id: `pyro_splash_kill_${Date.now()}_${Math.random()}`,
                text: `💀 ${splashEnemy.name} was incinerated by the blast! (+15 XP)`,
                type: 'loot',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });
              extraXpGained += 15;
            }
          }
        }
      } else if (isMagic && activeSpell.id === 'chain_lightning') {
        const primaryX = enemy.x;
        const primaryY = enemy.y;
        const chainCandidates = nextEnemies
          .filter(e => e.id !== enemy.id)
          .map(e => ({ enemy: e, dist: Math.abs(e.x - primaryX) + Math.abs(e.y - primaryY) }))
          .filter(c => c.dist <= 3)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 2);

        chainCandidates.forEach((cand) => {
          const chainEnemy = cand.enemy;
          const chainDmg = Math.max(1, Math.floor(finalDmg * 0.80) - chainEnemy.def);
          chainEnemy.hp -= chainDmg;
          if (chainEnemy.isTownGuard) {
            guardWasAttacked = true;
          }

          const chainProjEvent = new CustomEvent('spawn-projectile', {
            detail: {
              startX: primaryX,
              startY: primaryY,
              targetX: chainEnemy.x,
              targetY: chainEnemy.y,
              color: '#eab308',
              projectileType: 'electric_wand',
              impactText: `⚡ Chain -${chainDmg} HP`,
              impactType: 'dmg'
            }
          });
          window.dispatchEvent(chainProjEvent);

          updatedLogs.push({
            id: `chain_lightning_${Date.now()}_${Math.random()}`,
            text: `⚡ Lightning chains to ${chainEnemy.name} for ${chainDmg} damage!`,
            type: 'combat',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });

          if (chainEnemy.hp <= 0) {
            const cIdx = nextEnemies.findIndex(e => e.id === chainEnemy.id);
            if (cIdx !== -1) {
              nextDefeatedCounts = incrementDefeatedEnemyCount(
                nextDefeatedCounts,
                chainEnemy.name,
                chainEnemy.type,
                !!chainEnemy.isBoss
              );
              nextEnemies.splice(cIdx, 1);
              nextCorpses.push({
                id: `corpse_${Date.now()}_${Math.random()}`,
                x: chainEnemy.x,
                y: chainEnemy.y,
                char: chainEnemy.char,
                name: chainEnemy.name,
                color: chainEnemy.color,
                type: chainEnemy.isAnimal ? 'animal' : 'enemy',
                isElite: chainEnemy.isElite,
              });
              nextSplatters.push({
                id: `splatter_slain_${Date.now()}_${Math.random()}`,
                x: chainEnemy.x,
                y: chainEnemy.y,
                intensity: 2,
                color: '#38bdf8',
              });
              const chainGold = Math.floor(Math.random() * 4) + 2;
              nextLootPiles.push({
                id: `loot_${Date.now()}_${Math.random()}`,
                x: chainEnemy.x,
                y: chainEnemy.y,
                gold: chainGold,
                materials: [],
                catalysts: [],
                equipment: []
              });
              updatedLogs.push({
                id: `chain_kill_${Date.now()}_${Math.random()}`,
                text: `💀 ${chainEnemy.name} was electrocuted by the chain! (+15 XP)`,
                type: 'loot',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });
              extraXpGained += 15;
            }
          }
        });
      }

      const isAnimal = updatedEnemy.isAnimal;
      const isLootGoblin = updatedEnemy.type === EnemyType.LootGoblin || updatedEnemy.name.toLowerCase().includes('loot goblin');
      const splatterColor = updatedEnemy.char === 'r' ? '#22c55e' : (updatedEnemy.char === 'S' || updatedEnemy.name.toLowerCase().includes('skeleton') ? '#38bdf8' : '#dc2626');
      const finalSplatterColor = isLootGoblin ? '#f59e0b' : splatterColor;

      if (updatedEnemy.hp <= 0) {
        // Enemy is dead - spawn corpse & high intensity death splatter
        const xpMult = (window as any).arenaXpMultiplier || 1.0;
        const goldMult = (window as any).arenaGoldMultiplier || 1.0;
        const isBoss = !!updatedEnemy.isBoss;
        const isDragon = updatedEnemy.type === EnemyType.Dragon;
        
        gainedXp = Math.round((isAnimal ? 5 : (isLootGoblin ? 60 : (isBoss ? 250 : (isDragon ? 120 : (updatedEnemy.isElite ? 45 : 15))))) * xpMult);
        const baseGold = isBoss
          ? Math.floor(Math.random() * 50) + 50 + prev.playerStats.depth * 15
          : (isDragon
              ? Math.floor(Math.random() * 80) + 80
              : Math.floor(Math.random() * 8) + 4 + prev.playerStats.depth * 3);
        const goldVal = Math.round(baseGold * goldMult);

        const newCorpse: Corpse = {
          id: `corpse_${Date.now()}_${Math.random()}`,
          x: updatedEnemy.x,
          y: updatedEnemy.y,
          char: updatedEnemy.char,
          name: updatedEnemy.name,
          color: updatedEnemy.color,
          type: isAnimal ? 'animal' : 'enemy',
          isElite: updatedEnemy.isElite,
        };
        if (!isLootGoblin) {
          nextCorpses.push(newCorpse);
        }

        nextSplatters.push({
          id: `splatter_slain_${Date.now()}_${Math.random()}`,
          x: updatedEnemy.x,
          y: updatedEnemy.y,
          intensity: (isBoss || isDragon) ? 5 : 3,
          color: isDragon ? '#f97316' : finalSplatterColor,
        });

        // Roll materials drop based on monster strength! Beautiful crafting resource supply loop!
        const materialRewards = Object.keys(prev.inventoryMaterials).filter(k => k !== 'mat_wood' && k !== 'mat_raw_meat' && k !== 'mat_cooked_meat');
        const rolledGiftMat = materialRewards[Math.floor(Math.random() * materialRewards.length)];

        // Armor/Weapon random equipment drop chance! (Guaranteed 100% on bosses, 60% on dragons, 22% otherwise, boosted by Luck!)
        const droppedEquip: EquipmentItem[] = [];
        const effectiveLck = getEffectiveAttribute(prev, 'lck');
        const luckBonus = Math.max(0, effectiveLck - 10) * (gameConfig.worldRates?.equipmentDropRateBonusPerLuck ?? 0.03);
        const finalDropChance = Math.min(0.85, 0.22 + luckBonus);
        if (!isAnimal && (isBoss || isDragon || Math.random() < finalDropChance)) {
          droppedEquip.push(generateRandomLootGear(isBoss, isDragon, updatedEnemy.name));
        }

        let bossMats = [rolledGiftMat];
        let bossCats = (!isAnimal && Math.random() > 0.65) ? [['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'][Math.floor(Math.random() * 5)]] : [];

        let goblinMats: string[] = [];
        let goblinCats: string[] = [];
        if (isLootGoblin) {
          if (updatedEnemy.name.toLowerCase().includes('honey')) {
            goblinMats = ['mat_cooked_fish', 'mat_cooked_prime_meat', 'mat_prime_meat'];
            goblinCats = ['cat_fire'];
          } else if (updatedEnemy.name.toLowerCase().includes('sprite')) {
            goblinMats = ['mat_obsidian', 'mat_mithril'];
            goblinCats = ['cat_fire', 'cat_frost', 'cat_lightning', 'cat_shadow'];
          } else {
            const dropMats = ['mat_iron', 'mat_steel', 'mat_mithril', 'mat_obsidian'];
            const dropCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
            goblinMats = [
              dropMats[Math.floor(Math.random() * dropMats.length)],
              dropMats[Math.floor(Math.random() * dropMats.length)],
              dropMats[Math.floor(Math.random() * dropMats.length)],
            ];
            goblinCats = [
              dropCats[Math.floor(Math.random() * dropCats.length)],
              dropCats[Math.floor(Math.random() * dropCats.length)],
            ];
          }
        }

        if (isBoss) {
          // Guaranteed rich double legendary component items
          const legendaryMats = ['mat_obsidian', 'mat_shadow_fabric', 'mat_dragon_scale', 'mat_void_shard', 'mat_royal_iron'];
          const m1 = legendaryMats[Math.floor(Math.random() * legendaryMats.length)] === 'mat_dragon_scale' ? 'mat_dragonscale' : legendaryMats[Math.floor(Math.random() * legendaryMats.length)];
          const m2 = legendaryMats[(Math.floor(Math.random() * (legendaryMats.length - 1)) + 1) % legendaryMats.length] === 'mat_dragon_scale' ? 'mat_dragonscale' : 'mat_obsidian';
          bossMats = [m1, m2];

          // Guaranteed double dynamic elemental modifiers
          const allCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
          const c1 = allCats[Math.floor(Math.random() * allCats.length)];
          const c2 = allCats[(Math.floor(Math.random() * (allCats.length - 1)) + 1) % allCats.length];
          bossCats = [c1, c2];
        }

        let animalMats = ['mat_raw_meat'];
        let animalMsg = `🥩 You hunted down ${enemy.name}! Gained +${gainedXp} XP and dropped Raw Meat. Collect it!`;
        const lowercaseEnemyName = enemy.name.toLowerCase();
        const isWildlife = lowercaseEnemyName.includes("deer") || lowercaseEnemyName.includes("boar") || lowercaseEnemyName.includes("goat") || enemy.type === EnemyType.WildlifeDeer || enemy.type === EnemyType.WildlifeBoar || enemy.type === EnemyType.WildlifeGoat;

        if (isAnimal && isWildlife) {
          // Drops Prime Meat and Thick Hide!
          animalMats = ['mat_prime_meat', 'mat_thick_hide'];
          animalMsg = `🥩 You hunted down a magnificent ${enemy.name}! Gained +${gainedXp} XP and dropped Prime Wild Meat and Thick Wildlife Hide. Collect it!`;
        }

        const isBloodMoon = prev.bloodMoonTurnsLeft !== undefined && prev.bloodMoonTurnsLeft > 0;
        
        // Dragon Specialized Loot: guaranteed Elder Dragon Scale (mat_dragonscale) and a high-tier random elemental catalyst
        const dragonCatalysts = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
        const randomDragonCatalyst = dragonCatalysts[Math.floor(Math.random() * dragonCatalysts.length)];
        
        let finalMats = isAnimal ? animalMats : (isLootGoblin ? goblinMats : (isDragon ? ['mat_dragonscale', 'mat_obsidian'] : bossMats));
        let finalCats = isLootGoblin ? goblinCats : (isDragon ? [randomDragonCatalyst] : bossCats);

        if (updatedEnemy.type === EnemyType.Hiisi) {
          finalMats = ['mat_wood', 'mat_iron'];
          finalCats = ['cat_poison'];
        } else if (updatedEnemy.type === EnemyType.Nakki) {
          finalMats = ['mat_iron', 'mat_feybone'];
          finalCats = ['cat_frost'];
        } else if (updatedEnemy.type === EnemyType.Otso) {
          finalMats = ['mat_prime_meat', 'mat_thick_hide', 'mat_obsidian'];
          finalCats = ['cat_fire', 'cat_lightning'];
        } else if (updatedEnemy.type === EnemyType.Louhi) {
          finalMats = ['mat_obsidian', 'mat_mithril', 'mat_feybone'];
          finalCats = ['cat_frost', 'cat_shadow'];
        }

        if (updatedEnemy.id?.startsWith('wt_commander_') || updatedEnemy.name?.toLowerCase().includes('watchtower commander') || updatedEnemy.name?.toLowerCase().includes('watchtower overlord') || updatedEnemy.name?.toLowerCase().includes('outpost commander')) {
          finalMats = [...finalMats, 'mat_watchtower_key'];
          updatedLogs.push(`🔑 [KEY DROPPED]: ${updatedEnemy.name} dropped the Faction Watchtower Key! Collect the Loot Pile to claim it!`);
        }

        if (isBloodMoon && finalCats.length > 0) {
          finalCats = [...finalCats, ...finalCats]; // Double catalyst drops!
        }

        const newLootPile: LootPile = {
          id: `loot_${Date.now()}_${Math.random()}`,
          x: updatedEnemy.x,
          y: updatedEnemy.y,
          gold: isAnimal ? 0 : (isLootGoblin ? Math.floor(Math.random() * 80) + 50 : goldVal),
          materials: finalMats,
          catalysts: finalCats,
          equipment: droppedEquip
        };

        // Remove dead enemy from array with index-safety check
        const currentPrimaryIndexForSplice = nextEnemies.findIndex((e) => e.id === enemy.id);
        if (currentPrimaryIndexForSplice !== -1) {
          nextEnemies.splice(currentPrimaryIndexForSplice, 1);
        }
        if (isAnimal) {
          addLogMessage(animalMsg, 'loot');
        } else if (isLootGoblin) {
          if (updatedEnemy.name.toLowerCase().includes('honey')) {
            addLogMessage(`🐗 [HONEY BOAR SLAIN]: With a satisfied squeal, Mielikki's Honey-Glazed Boar collapses, dropping honey-infused steaks, campfire fish, and high-quality gold! (+${gainedXp} XP)`, 'loot');
          } else if (updatedEnemy.name.toLowerCase().includes('sprite')) {
            addLogMessage(`✧ [ALCHEMICAL SPRITE HARVESTED]: The Alchemical Sprite pops in a burst of sparkling lights, releasing its full catalyst cargo onto the ground! (+${gainedXp} XP)`, 'loot');
          } else {
            addLogMessage(`🧚 [LOOT GOBLIN VANISHED]: With a panicked squeal, the Alchemical Loot Goblin dissolves in a puff of glittering stardust! It dropped its full inventory stash on the ground! (+${gainedXp} XP)`, 'loot');
          }
        } else if (isBoss) {
          addLogMessage(`👑 BOSS VANQUISHED! You have slain ${enemy.name}! The chamber trembles as ancient heirloom treasures spill onto the tile! (+${gainedXp} XP)`, 'danger');
        } else if (isDragon) {
          addLogMessage(`🐉 DRAGON SLAIN! You have vanquished the legendary ${enemy.name}! Hardened volcanic scales and hoarded gold scatter onto the ground! (+${gainedXp} XP)`, 'danger');
        } else {
          addLogMessage(`💀 You struck down ${enemy.name}! It dropped a shimmering Loot Pile ✦ on the ground! (+${gainedXp} XP)`, 'loot');
        }
        nextLootPiles.push(newLootPile);
      } else {
        // Still alive, modify coordinates and current health status with index-safety check
        const currentPrimaryIndexForUpdate = nextEnemies.findIndex((e) => e.id === enemy.id);
        if (currentPrimaryIndexForUpdate !== -1) {
          nextEnemies[currentPrimaryIndexForUpdate] = updatedEnemy;
        }

        if (isLootGoblin) {
          let rolledMat = 'mat_iron';
          let rolledCat = 'cat_fire';
          let customMsg = '';

          if (updatedEnemy.name.toLowerCase().includes('honey')) {
            rolledMat = Math.random() > 0.5 ? 'mat_cooked_fish' : 'mat_cooked_prime_meat';
            rolledCat = 'cat_fire';
            customMsg = `🐗 [HONEY BOAR HIT]: Hitting the Honey-Glazed Boar causes it to drop a warm ${rolledMat.replace('mat_', '').toUpperCase().replace('COOKED_', 'COOKED ')}!`;
          } else if (updatedEnemy.name.toLowerCase().includes('sprite')) {
            rolledMat = Math.random() > 0.5 ? 'mat_obsidian' : 'mat_mithril';
            rolledCat = ['cat_fire', 'cat_frost', 'cat_lightning', 'cat_shadow'][Math.floor(Math.random() * 4)];
            customMsg = `✧ [ALCHEMICAL SPRITE HIT]: Hitting the Alchemical Sprite causes a magical discharge, leaving behind 1x ${rolledMat.replace('mat_', '').toUpperCase()} and 1x ${rolledCat.replace('cat_', '').toUpperCase()} Catalyst!`;
          } else {
            const dropMats = ['mat_iron', 'mat_steel', 'mat_mithril', 'mat_obsidian'];
            const dropCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
            rolledMat = dropMats[Math.floor(Math.random() * dropMats.length)];
            rolledCat = dropCats[Math.floor(Math.random() * dropCats.length)];
            customMsg = `🧚 [LOOT GOBLIN HIT]: Hitting the Alchemical Loot Goblin causes it to panic and drop 1x ${rolledMat.replace('mat_', '').toUpperCase()} and 1x ${rolledCat.replace('cat_', '').toUpperCase()} Catalyst!`;
          }
          
          nextLootPiles.push({
            id: `goblin_hit_${Date.now()}_${Math.random()}`,
            x: updatedEnemy.x,
            y: updatedEnemy.y,
            gold: Math.floor(Math.random() * 20) + 15,
            materials: [rolledMat],
            catalysts: [rolledCat],
            equipment: []
          });
          
          addLogMessage(customMsg, 'loot');
          
          // Trigger visual hit effect
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: updatedEnemy.x, y: updatedEnemy.y, text: `✨ SPLASH!`, type: 'heal' },
          });
          window.dispatchEvent(ev);
        }

        // Spawn interactive hit splatter
        nextSplatters.push({
          id: `splatter_dmg_${Date.now()}_${Math.random()}`,
          x: updatedEnemy.x,
          y: updatedEnemy.y,
          intensity: Math.random() > 0.5 ? 2 : 1,
          color: finalSplatterColor,
        });
      }

      // Roll level up calculations
      gainedXp += extraXpGained;
      let updatedXp = prev.playerStats.xp + gainedXp;
      let level = prev.playerStats.level;
      let nextThreshold = prev.playerStats.nextLevelXp;
      let hp = stats.hp - spentMp; // wait hp is hp, mp decreases
      let maxHp = stats.maxHp;
      let mp = stats.mp - spentMp;
      let maxMp = stats.maxMp;
      let atk = stats.atk;
      let def = stats.def;
      let unspentPoints = stats.unspentPoints || 0;
      
      const currentExhaustion = prev.playerStats.exhaustion || 0;
      const nextExhaustion = Math.min(100, currentExhaustion + 4); // attack adds +4% physical fatigue

      if (healingDone > 0) {
        hp = Math.min(maxHp, hp + healingDone);
      }

      while (updatedXp >= nextThreshold) {
        const bonuses = gameConfig.levelUpBonuses;
        level += 1;
        updatedXp -= nextThreshold;
        nextThreshold = Math.floor(nextThreshold * bonuses.xpThresholdMultiplier);
        maxHp += bonuses.maxHp;
        hp = maxHp; // full restore health
        maxMp += bonuses.maxMp;
        mp = maxMp;
        atk += bonuses.atk;
        def += bonuses.def;
        unspentPoints += bonuses.attributePoints;
        addLogMessage(`🌟 LEVEL UP! You reached Level ${level}! Got +${bonuses.attributePoints} Attribute Points to spend! (+${bonuses.maxHp} Max HP, +${bonuses.maxMp} Max MP, +${bonuses.def} DEF, +${bonuses.atk} ATK)`, 'craft');
        
        // Spawn graphic
        setTimeout(() => {
          playSound('levelUp');
        }, 120);

        // Trigger Sanctum Relics Draft
        setTimeout(() => {
          setGameState(current => {
            const currentRelics = current.playerStats.relics || [];
            const draft = getRandomRelicDraft(3, currentRelics);
            setActiveRelicDraft(draft);
            return current;
          });
        }, 300);
      }

      let nextWeapon = prev.currentWeapon;
      if (nextWeapon) {
        const curDur = nextWeapon.durability ?? 100;
        const maxD = nextWeapon.maxDurability ?? 100;
        const decayAmt = getItemDurabilityDecay(nextWeapon, 1);
        const nextDur = Math.max(0, curDur - decayAmt);
        if (nextDur === 0 && curDur > 0) {
          if (isToolItem(nextWeapon, 'hatchet') || isToolItem(nextWeapon, 'pickaxe') || (nextWeapon as any).isTool) {
            addLogMessage(`💥 TOOL BROKE: Your ${nextWeapon.name} broke into pieces from heavy wear and was destroyed! [Craft a new tool in Crafting -> Survival]`, 'danger');
            nextWeapon = null;
          } else {
            nextWeapon = { ...nextWeapon, durability: nextDur, maxDurability: maxD };
            addLogMessage(`⚠️ WARNING: Your Right Hand item [${nextWeapon.name}] has broken! Its damage drops to 1! Repair it at the Town Blacksmith!`, 'danger');
          }
        } else {
          nextWeapon = { ...nextWeapon, durability: nextDur, maxDurability: maxD };
        }
      }

      let nextShield = prev.equippedShield;
      if (nextShield) {
        if (nextShield.type === 'weapon' || isToolItem(nextShield, 'hatchet') || isToolItem(nextShield, 'pickaxe') || (nextShield as any).isTool) {
          const curDur = nextShield.durability ?? 100;
          const maxD = nextShield.maxDurability ?? 100;
          const decayAmt = getItemDurabilityDecay(nextShield, 1);
          const nextDur = Math.max(0, curDur - decayAmt);
          if (nextDur === 0 && curDur > 0) {
            if (isToolItem(nextShield, 'hatchet') || isToolItem(nextShield, 'pickaxe') || (nextShield as any).isTool) {
              addLogMessage(`💥 TOOL BROKE: Your ${nextShield.name} broke into pieces from heavy wear and was destroyed! [Craft a new tool in Crafting -> Survival]`, 'danger');
              nextShield = null;
            } else {
              nextShield = { ...nextShield, durability: nextDur, maxDurability: maxD };
              addLogMessage(`⚠️ WARNING: Your Left Hand weapon [${nextShield.name}] has broken! Its damage drops to 1! Repair it at the Town Blacksmith!`, 'danger');
            }
          } else {
            nextShield = { ...nextShield, durability: nextDur, maxDurability: maxD };
          }
        }
      }

      let currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      let nextRep = currentRep;
      let nextGuardsHostile = prev.areGuardsHostile !== undefined ? prev.areGuardsHostile : false;
      
      if (enemy.isTownGuard) {
        let decrease = 25; // Base attack penalty
        if (updatedEnemy.hp <= 0) {
          decrease += 35; // Killing penalty
        }
        nextRep = Math.max(0, currentRep - decrease);
      }

      if (guardWasAttacked) {
        nextGuardsHostile = true;
      }

      let nextFactionReputation = prev.factionReputation ? { ...prev.factionReputation } : { syndicate: 0, vanguard: 0, bandits: 0 };
      if (enemy.faction === 'syndicate' || enemy.faction === 'vanguard' || enemy.faction === 'bandits' || enemy.faction === 'outlaw') {
        const repFaction = (enemy.faction === 'outlaw' || enemy.faction === 'bandits') ? 'bandits' : enemy.faction;
        const curFacRep = nextFactionReputation[repFaction] ?? 0;
        let decrease = 20;
        if (updatedEnemy.hp <= 0) {
          decrease += 30; // killing a faction guard drops reputation by another -30 (-50 total!)
        }
        const nextFacRep = Math.max(-100, curFacRep - decrease);
        nextFactionReputation[repFaction] = nextFacRep;
        
        updatedLogs.push({
          id: `faction_assault_${Date.now()}`,
          text: `⚠️ [REPUTATION FALLOUT]: Assaulting a member of the ${repFaction === 'syndicate' ? 'Moonshadow Syndicate' : (repFaction === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')} reduced your standing by -${decrease}! (Standing: ${nextFacRep})`,
          type: 'danger',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      let nextFactionTerritories = prev.factionTerritories;
      if (updatedEnemy.hp <= 0 && prev.isOverworld) {
        const { territories, logText } = getUpdatedTerritoriesOnKill(
          prev.factionTerritories,
          prev.currentChunkX,
          prev.currentChunkY,
          prev.faction || 'neutral',
          updatedEnemy
        );
        nextFactionTerritories = territories;
        if (logText) {
          updatedLogs.push({
            id: `conquest_kill_${Date.now()}_${Math.random()}`,
            text: logText,
            type: 'info',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        }
      }

      if (updatedEnemy.hp <= 0) {
        nextDefeatedCounts = incrementDefeatedEnemyCount(
          nextDefeatedCounts,
          updatedEnemy.name,
          updatedEnemy.type,
          !!updatedEnemy.isBoss
        );
      }

      return {
        ...prev,
        enemies: nextEnemies,
        lootPiles: nextLootPiles,
        corpses: nextCorpses,
        bloodSplatters: nextSplatters,
        currentWeapon: nextWeapon,
        equippedShield: nextShield,
        townReputation: nextRep,
        areGuardsHostile: nextGuardsHostile,
        factionReputation: nextFactionReputation,
        factionTerritories: nextFactionTerritories,
        defeatedEnemiesCount: nextDefeatedCounts,
        logs: updatedLogs,
        playerStats: {
          ...prev.playerStats,
          xp: updatedXp,
          level,
          nextLevelXp: nextThreshold,
          hp,
          maxHp,
          mp,
          maxMp,
          atk,
          def,
          unspentPoints,
          exhaustion: nextExhaustion,
        },
      };
    });

    return true; // turn used!
  };

  // Main turn-based controller
  const makeMove = (dx: number, dy: number) => {
    if (!isPlaying || isGameOver || isVictory) return;

    // Overburdened sluggish/stagger checks
    const currentW = getCurrentWeight(gameState);
    const maxW = getMaxWeight(gameState);
    if (currentW > maxW && (dx !== 0 || dy !== 0)) {
      const staggerChance = gameState.season === 'winter' ? 0.65 : 0.45;
      if (Math.random() < staggerChance) {
        playSound('bump');
        const winterExt = gameState.season === 'winter' ? ' Glacial blizzards worsen overburden strain!' : '';
        addLogMessage(`⚠️ OVERBURDENED! You are carrying too much heavy gear (${currentW}/${maxW} kg).${winterExt} You stagger and stumble!`, 'danger');
        executeEnemiesTurn(gameState.playerX, gameState.playerY);
        return;
      }
    }

    // Weather & Seasonal Fatigue Movement Checks
    if (gameState.isOverworld && (dx !== 0 || dy !== 0)) {
      const weather = gameState.weather || 'clear';
      const effect = WEATHER_EFFECTS[weather];
      if (effect && effect.movementPenaltyChance > 0) {
        let isImmune = false;
        let genericFatigueLog = effect.fatigueLog;
        if (weather === 'rainy') {
          isImmune = hasEquippedTrait(gameState, 'SWAMP_GLIDE') || hasEquippedTrait(gameState, 'NON_SLIPPERY');
          genericFatigueLog = '🌧️ [MUDDY PATHS]: You slip and slide on the muddy wet ground, wasting your turn recovering your footing. (Tip: Equip forged Non-Slippery shoes or Swamp-Glide boots!)';
        } else if (weather === 'sandstorm') {
          isImmune = hasEquippedTrait(gameState, 'DESERT_IMMUNITY');
          genericFatigueLog = '🌪️ [SANDSTORM DUST]: Swirling sand fills your eyes, making you stumble blindly! You lose a turn trying to clear your vision. (Tip: Equip forged Desert-Immune visor or dune boots!)';
        } else if (weather === 'blizzard') {
          isImmune = hasEquippedTrait(gameState, 'WORG_FORCE') || hasEquippedTrait(gameState, 'NON_SLIPPERY');
          genericFatigueLog = '🌨️ [BLIZZARD FREEZE]: A savage winter blizzard gale sweeps over you! You shiver from cold fatigue and lose a turn. (Tip: Equip forged Non-Slippery shoes or heavy Worg-Spiked gear!)';
        }

        if (!isImmune && Math.random() < effect.movementPenaltyChance) {
          playSound('bump');
          addLogMessage(genericFatigueLog, 'danger');
          const coldEv = new CustomEvent('spawn-game-effect', {
            detail: { x: gameState.playerX, y: gameState.playerY, text: effect.fatigueText, type: 'dmg' },
          });
          window.dispatchEvent(coldEv);
          executeEnemiesTurn(gameState.playerX, gameState.playerY);
          return;
        }
      } else if (gameState.season === 'winter' && (gameState.biome === 'tundra' || Math.random() < 0.05)) {
        // Fallback baseline winter shiver
        if (Math.random() < 0.04) {
          playSound('bump');
          addLogMessage(`❄️ [WINTER CHILL]: A frosty blast of freezing wind locks up your muscles! You shiver from frostbite fatigue and waste a turn.`, 'danger');
          const coldEv = new CustomEvent('spawn-game-effect', {
            detail: { x: gameState.playerX, y: gameState.playerY, text: `🥶 SHIVER`, type: 'dmg' },
          });
          window.dispatchEvent(coldEv);
          executeEnemiesTurn(gameState.playerX, gameState.playerY);
          return;
        }
      }
    }

    const stats = gameState.playerStats;
    const targetX = gameState.playerX + dx;
    const targetY = gameState.playerY + dy;

    // Check overworld infinite coordinate crossover boundary limits
    if (gameState.isOverworld) {
      let nextCx = gameState.currentChunkX;
      let nextCy = gameState.currentChunkY;
      let crossed = false;
      let newPx = targetX;
      let newPy = targetY;

      if (targetX < 0) {
        nextCx = gameState.currentChunkX - 1;
        newPx = LEVEL_WIDTH - 1;
        crossed = true;
      } else if (targetX >= LEVEL_WIDTH) {
        nextCx = gameState.currentChunkX + 1;
        newPx = 0;
        crossed = true;
      }

      if (targetY < 0) {
        nextCy = gameState.currentChunkY - 1;
        newPy = LEVEL_HEIGHT - 1;
        crossed = true;
      } else if (targetY >= LEVEL_HEIGHT) {
        nextCy = gameState.currentChunkY + 1;
        newPy = 0;
        crossed = true;
      }

      if (crossed) {
        playSound('levelUp');
        addLogMessage(`🗺️ Traversing boundary to Chunk (${nextCx}, ${nextCy}). The infinite horizon expands...`, 'system');

        setTimeout(() => {
          document.getElementById('dungeon-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);

        let finalPx = newPx;
        let finalPy = newPy;

        setGameState((prev) => {
          // Save current chunk
          const currentChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
          const oldChunk = prev.overworldChunks[currentChunkKey];
          const isSecondFloorActive = prev.isOverworld && prev.overworldZ === 1;

          const currentChunkCopy: OverworldChunk = {
            chunkX: prev.currentChunkX,
            chunkY: prev.currentChunkY,
            map: isSecondFloorActive ? (oldChunk?.map || prev.map) : prev.map,
            discovered: isSecondFloorActive ? (oldChunk?.discovered || prev.discovered) : prev.discovered,
            visible: isSecondFloorActive ? (oldChunk?.visible || prev.visible) : prev.visible,
            secondFloorMap: isSecondFloorActive ? prev.map : oldChunk?.secondFloorMap,
            secondFloorDiscovered: isSecondFloorActive ? prev.discovered : oldChunk?.secondFloorDiscovered,
            secondFloorVisible: isSecondFloorActive ? prev.visible : oldChunk?.secondFloorVisible,
            enemies: prev.enemies,
            traps: prev.traps,
            chests: prev.chests,
            npcs: prev.npcs,
            lootPiles: prev.lootPiles || [],
            dungeons: oldChunk?.dungeons || [],
            towns: oldChunk?.towns || [],
            biome: prev.biome,
            weather: prev.weather,
            watchtower: oldChunk?.watchtower,
            pois: oldChunk?.pois
          };

          const updatedChunks = {
            ...prev.overworldChunks,
            [currentChunkKey]: currentChunkCopy
          };

          // Load or generate next chunk
          const targetChunkKey = `${nextCx},${nextCy}`;
          let targetChunk = updatedChunks[targetChunkKey];
          let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
          let hasSeppoOnLoad = false;
          let newlyDiscoveredTown = false;
          const newMsgs: GameLogMessage[] = [];
          if (!targetChunk) {
            targetChunk = generateOverworldChunk(nextCx, nextCy, LEVEL_WIDTH, LEVEL_HEIGHT, nextSpawnedCats, prev.spawnedSeppo, prev.playerStats, prev.currentWeapon);
            if (hasTownAtChunk(nextCx, nextCy)) {
              newlyDiscoveredTown = true;
            }
            targetChunk.npcs.forEach(n => {
              if (n.id?.startsWith('npc_cat_')) {
                const catName = n.name.split(' (')[0];
                if (!nextSpawnedCats.includes(catName)) {
                  nextSpawnedCats.push(catName);
                }
              }
            });
            hasSeppoOnLoad = targetChunk.npcs.some(n => n.id === 'npc_seppo');
          }

          // If watchtower is under siege, and we haven't spawned the siege combatants yet, spawn them!
          if (targetChunk.watchtower && targetChunk.watchtower.siegeState?.isUnderSiege) {
            const hasSiegeEnemies = targetChunk.enemies.some(e => e.id.startsWith('siege_attacker_') || e.id.startsWith('wt_ally_attacker_'));
            if (!hasSiegeEnemies) {
              const wtX = targetChunk.watchtower.x;
              const wtY = targetChunk.watchtower.y;
              const attacker = targetChunk.watchtower.siegeState.attacker;
              const defender = targetChunk.watchtower.siegeState.defender;
              const playerFaction = prev.faction || 'neutral';
              const reputation = prev.factionReputation || { syndicate: 0, vanguard: 0, bandits: 0 };

              const siegeEnemies = getSiegeCombatants(
                wtX,
                wtY,
                nextCx,
                nextCy,
                attacker,
                defender,
                playerFaction,
                reputation
              );

              targetChunk.enemies = [...targetChunk.enemies, ...siegeEnemies];
            }
          }

          // If watchtower is NOT under siege, but is hostile to the player, spawn active assault allies to raid the watchtower!
          if (targetChunk.watchtower && !targetChunk.watchtower.siegeState?.isUnderSiege) {
            const controller = targetChunk.watchtower.controller || 'neutral';
            const playerFaction = prev.faction || 'neutral';
            const isFriendlyWatchtower = targetChunk.watchtower.isClaimed && controller === playerFaction;
            
            if (!isFriendlyWatchtower && !targetChunk.watchtower.garrisonDefeated) {
              const hasWatchtowerAllies = targetChunk.enemies.some(e => e.id.startsWith('wt_ally_assault_'));
              if (!hasWatchtowerAllies) {
                const wtX = targetChunk.watchtower.x;
                const wtY = targetChunk.watchtower.y;
                
                // Spawn 3 faction assault allies or rebel allies!
                const assaultAllies: Enemy[] = [];
                const allyCoords = [
                  { dx: 2, dy: 6, isRanged: false },
                  { dx: 6, dy: 6, isRanged: false },
                  { dx: 4, dy: 7, isRanged: true }
                ];
                
                let allyName = 'Allied Rebel';
                let allyColor = '#fbbf24';
                let allyChar = '⚔️';
                
                if (playerFaction === 'vanguard') {
                  allyName = 'Vanguard Vanguardian';
                  allyColor = '#38bdf8';
                } else if (playerFaction === 'syndicate') {
                  allyName = 'Syndicate Operative';
                  allyColor = '#c084fc';
                  allyChar = '☠️';
                } else if (playerFaction === 'bandits') {
                  allyName = 'Outlaw Pillager';
                  allyColor = '#f97316';
                  allyChar = '🪓';
                }
                
                allyCoords.forEach((offset, idx) => {
                  const nameStr = offset.isRanged ? `🏹 [ALLY] ${allyName} Marksman` : `⚔️ [ALLY] ${allyName}`;
                  assaultAllies.push({
                    id: `wt_ally_assault_${idx}_${nextCx}_${nextCy}`,
                    x: wtX + offset.dx,
                    y: wtY + offset.dy,
                    type: offset.isRanged ? EnemyType.SkeletonMage : EnemyType.Bandit,
                    name: nameStr,
                    hp: offset.isRanged ? 140 : 180,
                    maxHp: offset.isRanged ? 140 : 180,
                    atk: offset.isRanged ? 12 : 15,
                    def: offset.isRanged ? 3 : 6,
                    range: offset.isRanged ? 3 : 1,
                    speed: 1.0,
                    color: allyColor,
                    char: offset.isRanged ? '🏹' : allyChar,
                    state: EnemyState.Chasing,
                    isElite: true,
                    isFollower: true,
                    debuffs: [],
                    patrolPath: [],
                    patrolIndex: 0
                  });
                });
                
                targetChunk.enemies = [...targetChunk.enemies, ...assaultAllies];
                newMsgs.push({
                  id: `wt_ally_spawn_${Date.now()}`,
                  text: `⚔️ [ASSAULT IN PROGRESS]: Your faction forces have launched a raid on the watchtower! Move in and assist them in defeating the garrison!`,
                  type: 'combat',
                  timestamp: 'MILITARY ALERT'
                });
              }
            }
          }

          // Sanitise player spawn position to prevent getting stuck in trees/walls on chunk load/transition
          const safePlayerPos = findNearestSafePlayerTile(newPx, newPy, targetChunk.map);
          finalPx = safePlayerPos.x;
          finalPy = safePlayerPos.y;

          // Compute initial vision for the new coordinate
          const fov = computeFOV(finalPx, finalPy, targetChunk.map, 6);
          const discovered = targetChunk.map.map((row, y) =>
            row.map((cell, x) => ((targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
          );

          // Update visited map tracking
          const nextVisited = { ...prev.visitedTiles };
          nextVisited[`${finalPx},${finalPy},${nextCx},${nextCy}`] = true;

          // Alert user of nearby active camps or caravan ambushes in the new chunk
          if (newlyDiscoveredTown) {
            const townName = prng(nextCx, nextCy, 123) < 0.3 ? "Port Royal Town" : getDeterministicTownName(nextCx, nextCy);
            newMsgs.push({
              id: `discover_town_${Date.now()}`,
              text: `🏘️ [DISCOVERY REWARD]: You have discovered the magnificent town of ${townName}! The Sunder Guild drops a rare Scroll of Recall 📜 into your backpack to mark this landmark event!`,
              type: 'loot',
              timestamp: 'SYSTEM'
            });
          }
          const hasCaravanAmbush = targetChunk.npcs.some(n => n.id?.startsWith('ambushed_merchant_'));
          const ambushCleared = prev.caravanAmbushState?.[`${nextCx},${nextCy}`] === 'success';
          if (hasCaravanAmbush && !ambushCleared) {
            newMsgs.push({
              id: `sos_caravan_${Date.now()}_1`,
              text: `🚨 [EMERGENCY S.O.S.]: You spot a merchant caravan wagon ambushed by ruthless bandits nearby! Defend the caravan and defeat all bandits to claim your reward!`,
              type: 'combat',
              timestamp: 'SYSTEM'
            });
          }
          
          const hasCampSentry = targetChunk.enemies.some(e => e.id.includes('camp_guard_'));
          const campCleared = prev.clearedCamps?.includes(`camp_${nextCx}_${nextCy}`);
          if (hasCampSentry && !campCleared) {
            newMsgs.push({
              id: `sos_camp_${Date.now()}_2`,
              text: `🏕️ [WILD CAMP DETECTED]: Your scout instincts flare! A heavily fortified Hostile Raider Camp is positioned in this chunk, guarding a locked treasure chest!`,
              type: 'danger',
              timestamp: 'SYSTEM'
            });
          }

          const activeAlarm = prev.activeEscapeAlarm;
          if (activeAlarm) {
            newMsgs.push({
              id: `escaped_alarm_${Date.now()}`,
              text: `💨 [ESCAPED]: You have crossed the chunk border and successfully slipped away from the pursuing ${activeAlarm === 'syndicate' ? 'Moonshadow Syndicate' : (activeAlarm === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')} forces! The alarm has deactivated.`,
              type: 'info',
              timestamp: 'SYSTEM'
            });
          }

          const truncatedLogs = prev.logs.length > 35 ? prev.logs.slice(newMsgs.length) : prev.logs;

          return {
            ...prev,
            playerX: finalPx,
            playerY: finalPy,
            currentChunkX: nextCx,
            currentChunkY: nextCy,
            overworldZ: 0,
            overworldChunks: {
              ...updatedChunks,
              [targetChunkKey]: targetChunk
            },
            spawnedCats: nextSpawnedCats,
            spawnedSeppo: prev.spawnedSeppo || hasSeppoOnLoad,
            map: targetChunk.map,
            discovered: discovered,
            visible: fov,
            enemies: spawnFollowersOnLevelLoadByReset(targetChunk.enemies, prev.followers, finalPx, finalPy, targetChunk.map),
            traps: targetChunk.traps,
            chests: targetChunk.chests,
            npcs: targetChunk.npcs,
            lootPiles: targetChunk.lootPiles || [],
            equipmentInventory: newlyDiscoveredTown ? [
              ...prev.equipmentInventory,
              {
                id: `scroll_recall_town_${Date.now()}_${Math.random()}`,
                name: "Scroll of Recall 📜",
                type: 'scroll' as any,
                subType: 'Scroll' as any,
                defense: 0,
                damage: 0,
                critChance: 0,
                range: 0,
                color: '#38bdf8',
                description: "A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!",
                value: 200,
                durability: 100,
                maxDurability: 100
              }
            ] : prev.equipmentInventory,
            logs: [...truncatedLogs, ...newMsgs],
            visitedTiles: nextVisited,
            biome: targetChunk.biome,
            weather: targetChunk.weather,
            activeEscapeAlarm: null,
            playerStats: {
              ...prev.playerStats,
              turnsPlayed: prev.playerStats.turnsPlayed + 1
            }
          };
        });

        // Trigger clocks etc
        executeEnemiesTurn(finalPx, finalPy);
        return;
      }
    }

    // Standard dungeon map check bounds
    if (targetX < 0 || targetX >= LEVEL_WIDTH || targetY < 0 || targetY >= LEVEL_HEIGHT) {
      return;
    }

    const tile = gameState.map[targetY][targetX];

    // Multi-floor Overworld Stairs climb
    if (gameState.isOverworld) {
      if (tile === TileType.StairsUp) {
        // Climb UP to second floor!
        playSound('levelUp');
        addLogMessage('🪜 You climb up the stairs to the second floor.', 'system');

        setGameState((prev) => {
          const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
          const currentChunk = prev.overworldChunks[chunkKey];
          if (!currentChunk) return prev;

          // Save current ground floor state to chunk
          const updatedChunk = {
            ...currentChunk,
            map: prev.map,
            discovered: prev.discovered,
            visible: prev.visible,
          };

          const nextOverworldChunks = {
            ...prev.overworldChunks,
            [chunkKey]: updatedChunk
          };

          // Load second floor state
          const targetMap = currentChunk.secondFloorMap || currentChunk.map;
          const targetDiscovered = currentChunk.secondFloorDiscovered || currentChunk.discovered;

          // Calculate new FOV for second floor
          const fov = computeFOV(targetX, targetY, targetMap, 6);
          const nextDiscovered = targetMap.map((row, y) =>
            row.map((cell, x) => (targetDiscovered[y]?.[x] || fov[y]?.[x] || false))
          );

          return {
            ...prev,
            overworldZ: 1,
            map: targetMap,
            discovered: nextDiscovered,
            visible: fov,
            playerX: targetX,
            playerY: targetY,
            overworldChunks: nextOverworldChunks
          };
        });
        
        executeEnemiesTurn(targetX, targetY);
        return;
      }

      if (tile === TileType.StairsDown) {
        // Climb DOWN to ground floor!
        playSound('levelUp');
        addLogMessage('🪜 You climb down the stairs to the ground floor.', 'system');

        setGameState((prev) => {
          const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
          const currentChunk = prev.overworldChunks[chunkKey];
          if (!currentChunk) return prev;

          // Save current second floor state to chunk
          const updatedChunk = {
            ...currentChunk,
            secondFloorMap: prev.map,
            secondFloorDiscovered: prev.discovered,
            secondFloorVisible: prev.visible,
          };

          const nextOverworldChunks = {
            ...prev.overworldChunks,
            [chunkKey]: updatedChunk
          };

          // Load ground floor state
          const targetMap = currentChunk.map;
          const targetDiscovered = currentChunk.discovered;

          // Calculate new FOV for ground floor
          const fov = computeFOV(targetX, targetY, targetMap, 6);
          const nextDiscovered = targetMap.map((row, y) =>
            row.map((cell, x) => (targetDiscovered[y]?.[x] || fov[y]?.[x] || false))
          );

          return {
            ...prev,
            overworldZ: 0,
            map: targetMap,
            discovered: nextDiscovered,
            visible: fov,
            playerX: targetX,
            playerY: targetY,
            overworldChunks: nextOverworldChunks
          };
        });

        executeEnemiesTurn(targetX, targetY);
        return;
      }
    }

    // Wait Action (Skip turn)
    if (dx === 0 && dy === 0) {
      addLogMessage(`⏳ You stand alert, recovering a drip of Mana.`, 'system');
      
      // Recover some mana passively
      setGameState((prev) => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + 2),
        },
      }));

      // Trigger traps tick on pass
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
      return;
    }

    // Tree Chopping / Lumberjacking with Hatchet/Axe in hand or inventory!
    if (tile === TileType.Tree || tile === TileType.PineTree || tile === TileType.BirchTree) {
      let hatchetTool: { location: 'right' | 'left' | 'inventory'; item: EquipmentItem | CraftedWeapon; index?: number } | null = null;

      if (isToolItem(gameState.currentWeapon, 'hatchet')) {
        hatchetTool = { location: 'right', item: gameState.currentWeapon! };
      } else if (isToolItem(gameState.equippedShield, 'hatchet')) {
        hatchetTool = { location: 'left', item: gameState.equippedShield! };
      } else {
        const invIdx = gameState.equipmentInventory.findIndex((it) => isToolItem(it, 'hatchet'));
        if (invIdx !== -1) {
          hatchetTool = { location: 'inventory', item: gameState.equipmentInventory[invIdx], index: invIdx };
        }
      }

      if (hatchetTool) {
        // Replace tree tile with Grass
        const nextMap = gameState.map.map((row, y) =>
          row.map((cell, x) => (x === targetX && y === targetY ? TileType.Grass : cell))
        );

        const materialId = tile === TileType.PineTree ? 'mat_pine_log' : (tile === TileType.BirchTree ? 'mat_birch_log' : 'mat_wood');
        const materialName = tile === TileType.PineTree ? 'Aromatic Pine Log 🌲' : (tile === TileType.BirchTree ? 'Pale Birch Log 🌳' : 'Scrap Wood 🌲');

        const curDurability = hatchetTool.item.durability ?? 100;
        const maxDurability = hatchetTool.item.maxDurability ?? 100;
        const newDurability = Math.max(0, curDurability - 20);
        const isBroken = newDurability <= 0;

        setGameState((prev) => {
          const nextMats = {
            ...prev.inventoryMaterials,
            'mat_wood': (prev.inventoryMaterials['mat_wood'] || 0) + 1,
            [materialId]: (prev.inventoryMaterials[materialId] || 0) + 1
          };

          const nextChunks = { ...prev.overworldChunks };
          const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
          if (prev.isOverworld && nextChunks[chunkKey]) {
            nextChunks[chunkKey] = {
              ...nextChunks[chunkKey],
              map: nextMap
            };
          }

          let nextCurrentWeapon = prev.currentWeapon;
          let nextEquippedShield = prev.equippedShield;
          let nextEquipmentInventory = [...prev.equipmentInventory];

          if (hatchetTool!.location === 'right') {
            if (isBroken) {
              nextCurrentWeapon = null;
            } else if (nextCurrentWeapon) {
              nextCurrentWeapon = { ...nextCurrentWeapon, durability: newDurability };
            }
          } else if (hatchetTool!.location === 'left') {
            if (isBroken) {
              nextEquippedShield = null;
            } else if (nextEquippedShield) {
              nextEquippedShield = { ...nextEquippedShield, durability: newDurability };
            }
          } else if (hatchetTool!.location === 'inventory' && hatchetTool!.index !== undefined) {
            if (isBroken) {
              nextEquipmentInventory.splice(hatchetTool!.index, 1);
            } else {
              nextEquipmentInventory[hatchetTool!.index] = {
                ...nextEquipmentInventory[hatchetTool!.index],
                durability: newDurability
              };
            }
          }

          return {
            ...prev,
            map: nextMap,
            overworldChunks: nextChunks,
            inventoryMaterials: nextMats,
            currentWeapon: nextCurrentWeapon,
            equippedShield: nextEquippedShield,
            equipmentInventory: nextEquipmentInventory,
          };
        });

        playSound('spell'); // Crackling or action success sound
        if (isBroken) {
          playSound('bump');
          addLogMessage(`💥 TOOL BROKE: Your ${hatchetTool.item.name} broke into pieces from wear and was destroyed! (+1 ${materialName}) [Craft a new tool in Crafting -> Survival]`, 'danger');
        } else {
          addLogMessage(`🪓 You chopped down the tree using your ${hatchetTool.item.name}! (+1 ${materialName}) [Tool Durability: ${newDurability}/${maxDurability}]`, 'loot');
        }

        // Spawn visual text effect on top of tree
        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: targetX, y: targetY, text: isBroken ? `💥 Tool Broke!` : `🪓 +1 Log`, type: isBroken ? 'damage' : 'heal' },
        });
        window.dispatchEvent(ev);

        // Spend turn
        executeEnemiesTurn(gameState.playerX, gameState.playerY);
        return;
      } else {
        playSound('bump');
        addLogMessage(`🌲 This tree requires a Hatchet or Axe in your inventory or hand to chop down! (Craft one under Crafting -> Survival)`, 'system');
        return;
      }
    }

    // Ore Mining with Pickaxe in hand or inventory!
    if (tile === TileType.CopperVein || tile === TileType.IronVein) {
      let pickaxeTool: { location: 'right' | 'left' | 'inventory'; item: EquipmentItem | CraftedWeapon; index?: number } | null = null;

      if (isToolItem(gameState.currentWeapon, 'pickaxe')) {
        pickaxeTool = { location: 'right', item: gameState.currentWeapon! };
      } else if (isToolItem(gameState.equippedShield, 'pickaxe')) {
        pickaxeTool = { location: 'left', item: gameState.equippedShield! };
      } else {
        const invIdx = gameState.equipmentInventory.findIndex((it) => isToolItem(it, 'pickaxe'));
        if (invIdx !== -1) {
          pickaxeTool = { location: 'inventory', item: gameState.equipmentInventory[invIdx], index: invIdx };
        }
      }

      if (pickaxeTool) {
        // Replace vein tile with Grass
        const nextMap = gameState.map.map((row, y) =>
          row.map((cell, x) => (x === targetX && y === targetY ? TileType.Grass : cell))
        );

        const materialId = tile === TileType.CopperVein ? 'mat_copper_ore' : 'mat_iron_ore';
        const materialName = tile === TileType.CopperVein ? 'Raw Copper Ore ⛋' : 'Raw Iron Ore ⛋';
        let yieldAmt = Math.floor(Math.random() * 2) + 2; // yields 2-3 ore
        if (gameState.factionTerritories?.['shadow_fjord']?.controller === gameState.faction) {
          yieldAmt = Math.ceil(yieldAmt * 1.15);
        }

        const curDurability = pickaxeTool.item.durability ?? 100;
        const maxDurability = pickaxeTool.item.maxDurability ?? 100;
        const newDurability = Math.max(0, curDurability - 20);
        const isBroken = newDurability <= 0;

        setGameState((prev) => {
          const nextMats = {
            ...prev.inventoryMaterials,
            [materialId]: (prev.inventoryMaterials[materialId] || 0) + yieldAmt
          };

          // Also occasionally drop raw iron alloy directly as bonus
          if (tile === TileType.IronVein) {
            let bonusAmt = 1;
            if (prev.factionTerritories?.['shadow_fjord']?.controller === prev.faction) {
              bonusAmt = 2; // extra iron ingot bonus!
            }
            nextMats['mat_iron'] = (nextMats['mat_iron'] || 0) + bonusAmt;
          }

          const nextChunks = { ...prev.overworldChunks };
          const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
          if (prev.isOverworld && nextChunks[chunkKey]) {
            nextChunks[chunkKey] = {
              ...nextChunks[chunkKey],
              map: nextMap
            };
          }

          let nextCurrentWeapon = prev.currentWeapon;
          let nextEquippedShield = prev.equippedShield;
          let nextEquipmentInventory = [...prev.equipmentInventory];

          if (pickaxeTool!.location === 'right') {
            if (isBroken) {
              nextCurrentWeapon = null;
            } else if (nextCurrentWeapon) {
              nextCurrentWeapon = { ...nextCurrentWeapon, durability: newDurability };
            }
          } else if (pickaxeTool!.location === 'left') {
            if (isBroken) {
              nextEquippedShield = null;
            } else if (nextEquippedShield) {
              nextEquippedShield = { ...nextEquippedShield, durability: newDurability };
            }
          } else if (pickaxeTool!.location === 'inventory' && pickaxeTool!.index !== undefined) {
            if (isBroken) {
              nextEquipmentInventory.splice(pickaxeTool!.index, 1);
            } else {
              nextEquipmentInventory[pickaxeTool!.index] = {
                ...nextEquipmentInventory[pickaxeTool!.index],
                durability: newDurability
              };
            }
          }

          return {
            ...prev,
            map: nextMap,
            overworldChunks: nextChunks,
            inventoryMaterials: nextMats,
            currentWeapon: nextCurrentWeapon,
            equippedShield: nextEquippedShield,
            equipmentInventory: nextEquipmentInventory,
          };
        });

        playSound('loot'); // Metallic strike sound
        if (isBroken) {
          playSound('bump');
          addLogMessage(`💥 TOOL BROKE: Your ${pickaxeTool.item.name} broke into pieces from heavy mining and was destroyed! (+${yieldAmt} ${materialName}) [Craft a new tool in Crafting -> Survival]`, 'danger');
        } else {
          addLogMessage(`⛏️ You struck the vein with your ${pickaxeTool.item.name}! (+${yieldAmt} ${materialName}) [Tool Durability: ${newDurability}/${maxDurability}]`, 'loot');
        }

        // Spawn visual text effect on top of vein
        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: targetX, y: targetY, text: isBroken ? `💥 Tool Broke!` : `⛏️ +${yieldAmt} Ore`, type: isBroken ? 'damage' : 'heal' },
        });
        window.dispatchEvent(ev);

        // Spend turn
        executeEnemiesTurn(gameState.playerX, gameState.playerY);
        return;
      } else {
        playSound('bump');
        addLogMessage(`⛏️ This rich mineral vein requires a Pickaxe in your inventory or hand to mine! (Craft one under Crafting -> Survival)`, 'system');
        return;
      }
    }

    // Collision Blocks
    const isUnderworldLava = !gameState.isOverworld && gameState.playerStats.depth >= 6;
    const isWaterWalkable = gameState.season === 'winter' || hasEquippedTrait(gameState, 'SWAMP_GLIDE') || isUnderworldLava;
    const collides = tile === TileType.Wall || tile === TileType.Window || tile === TileType.Tree || tile === TileType.PineTree || tile === TileType.BirchTree || tile === TileType.CopperVein || tile === TileType.IronVein || (tile === TileType.Water && !isWaterWalkable) || tile === TileType.Table || tile === TileType.WatchtowerWall || tile === TileType.WatchtowerSlit || tile === TileType.WatchtowerBarricade;
    if (collides) {
      playSound('bump');
      return;
    }

    if (tile === TileType.Water && isWaterWalkable) {
      if (isUnderworldLava) {
        const lavaDamage = 8;
        addLogMessage(`🔥 [LAVA POOL]: Searing magma burns your boots! You take ${lavaDamage} Fire Damage!`, 'danger');
        playSound('bump');

        const finalHp = Math.max(0, gameState.playerStats.hp - lavaDamage);
        setGameState((prev) => ({
          ...prev,
          playerStats: {
            ...prev.playerStats,
            hp: finalHp,
          },
        }));

        const shakeEv = new CustomEvent('spawn-game-effect', {
          detail: { x: targetX, y: targetY, text: `🔥 -${lavaDamage} HP`, type: 'dmg' },
        });
        window.dispatchEvent(shakeEv);

        if (finalHp <= 0) {
          playSound('defeat');
          setIsGameOver(true);
          return;
        }
      } else if (hasEquippedTrait(gameState, 'SWAMP_GLIDE')) {
        addLogMessage(`🐊 [BAYOU SLIDE]: Your Swamp-Glide gear allows you to glide effortlessly through the murky water!`, 'system');
        const iceEv = new CustomEvent('spawn-game-effect', {
          detail: { x: targetX, y: targetY, text: `🐊 Glide!`, type: 'heal' },
        });
        window.dispatchEvent(iceEv);
      } else {
        // Step on ice slide effect!
        addLogMessage(`⛸️ [ICY SHORES]: You slide gracefully across the frozen water ice platform!`, 'system');
        const iceEv = new CustomEvent('spawn-game-effect', {
          detail: { x: targetX, y: targetY, text: `⛸️ Slide!`, type: 'heal' },
        });
        window.dispatchEvent(iceEv);
      }
    }

    // Door open
    if (tile === TileType.Door) {
      playSound('bump');
      // replace Door cell with normal Floors to unlock passage
      const nextMap = gameState.map.map((row, y) =>
        row.map((cell, x) => (x === targetX && y === targetY ? TileType.Floor : cell))
      );
      setGameState((prev) => ({ ...prev, map: nextMap }));
      addLogMessage('🚪 You opened a heavy corridor door.', 'system');
      
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
      return;
    }

    // DungeonEntrance step
    if (tile === TileType.DungeonEntrance) {
      descendToDungeonFirstFloor();
      return;
    }

    // TownGate step
    if (tile === TileType.TownGate) {
      playSound('bump');
      addLogMessage('∏ You approach the wooden Village gateway arch.', 'system');
    }

    // Stairs down step
    if (tile === TileType.StairsDown) {
      advanceToNextDepth();
      return;
    }

    // Check if friendly NPC is on destination (Interactions)
    if (gameState.isOverworld && gameState.npcs) {
      const npcIndex = gameState.npcs.findIndex((n) => n.x === targetX && n.y === targetY);
      if (npcIndex !== -1) {
        interactWithNpc(gameState.npcs[npcIndex]);
        return;
      }
    }

    // Check if monster is on destination coordinate (Bump Combat Range 1)
    const enemyIndex = gameState.enemies.findIndex((e) => e.x === targetX && e.y === targetY);
    if (enemyIndex !== -1) {
      const activeEnemy = gameState.enemies[enemyIndex];
      
      // If companion or freed captive, trigger friendly chat instead of attacking
      if (activeEnemy.isFollower || (activeEnemy.isCaptive && activeEnemy.isFreed)) {
        interactWithFollower(activeEnemy);
        return;
      }
      
      // Check if target is a captive locked in a cage
      if (activeEnemy.isCaptive && !activeEnemy.isFreed) {
        const rawName = activeEnemy.name.replace('🔒 ', '');
        const hasRoom = gameState.followers.length < 3;
        
        setGameState((prev) => {
          let archetypeId: 'guard' | 'thief' | 'cat' | 'merchant_guard' = 'thief';
          let char = '🧍';
          let color = '#10b981';
          let personality = `Freed from a dark dungeon cage. Loyal to the Sunder Champion who broke their chains.`;

          if (rawName.includes('Cleric')) {
            archetypeId = 'guard';
            char = '⚕️';
            color = '#38bdf8';
            personality = `A holy healer freed from dungeon captivity. Sworn to restore and safeguard the Champion.`;
          } else if (rawName.includes('Miner')) {
            archetypeId = 'thief';
            char = '⛏️';
            color = '#fbbf24';
            personality = `An industrious cavern miner rescued from captivity. Gladly lends heavy pick utility.`;
          } else if (rawName.includes('Merchant')) {
            archetypeId = 'merchant_guard';
            char = '💰';
            color = '#f59e0b';
            personality = `A wealthy trader's guard trapped in the deep. Gratefully pledges commercial and physical aid.`;
          } else if (rawName.includes('Wanderer')) {
            archetypeId = 'thief';
            char = '🏹';
            color = '#c084fc';
            personality = `An agile rogue ranger caught scouting these deep chambers. Ready to strike from behind.`;
          } else if (rawName.includes('Peasant')) {
            archetypeId = 'thief';
            char = '🧍';
            color = '#94a3b8';
            personality = `A humble laborer who was locked up by dungeons. Indebted to follow you to safety.`;
          }

          const followerId = `fol_freed_${Date.now()}`;
          const nextEnemies = [...prev.enemies];
          
          if (prev.followers.length < 3) {
            const nextFollower: Follower = {
              id: followerId,
              name: rawName,
              archetypeId,
              role: 'follower',
              char,
              color,
              hp: activeEnemy.hp * 3, // Boost HP since they are now a follower companion
              maxHp: activeEnemy.maxHp * 3,
              atk: activeEnemy.atk + 2,
              def: activeEnemy.def + 2,
              level: 1,
              xp: 0,
              xpNext: 100,
              mode: 'follow',
              equipment: { weapon: null, armor: null },
              inventory: [],
              injuries: [],
              personality,
              temperament: 'Grateful'
            };

            nextEnemies[enemyIndex] = {
              ...activeEnemy,
              id: `actor_${followerId}`,
              isFreed: true,
              isFollower: true,
              followerId: followerId,
              name: rawName,
              hp: nextFollower.hp,
              maxHp: nextFollower.maxHp,
              atk: nextFollower.atk,
              def: nextFollower.def,
              char,
              color,
              state: EnemyState.Chasing
            };

            return {
              ...prev,
              enemies: nextEnemies,
              followers: [...prev.followers, nextFollower]
            };
          } else {
            // No room in companion party; joins as temporary floor-only ally
            nextEnemies[enemyIndex] = {
              ...activeEnemy,
              isFreed: true,
              isFollower: true, // Treated as follower on this floor
              name: `${rawName} (Floor Ally)`,
              hp: activeEnemy.hp * 2,
              maxHp: activeEnemy.maxHp * 2,
              char,
              color,
              state: EnemyState.Chasing
            };

            return {
              ...prev,
              enemies: nextEnemies
            };
          }
        });

        playSound('levelUp');

        if (hasRoom) {
          addLogMessage(`🔓 You break open the cage and free the ${rawName}!`, 'loot');
          addLogMessage(`👥 COMPANION JOINED: ${rawName} has pledged their life to you as a permanent companion!`, 'info');
          addLogMessage(`🗣️ ${rawName}: "Thank you adventurer! I was trapped here forever. My steel is yours — I will follow you to the ends of Sunder!"`, 'info');
        } else {
          addLogMessage(`🔓 You break open the cage and free the ${rawName}!`, 'loot');
          addLogMessage(`👥 PARTY FULL: Since your companion list is full (max 3), ${rawName} joins you as a floor ally!`, 'system');
          addLogMessage(`🗣️ ${rawName}: "Thank you for rescuing me! I see you already have a full crew, but I will help you clear out the beasts of this floor!"`, 'info');
        }

        const effectEv = new CustomEvent('spawn-game-effect', {
          detail: { x: targetX, y: targetY, text: "🔓 FREED!", type: 'heal' },
        });
        window.dispatchEvent(effectEv);

        executeEnemiesTurn(gameState.playerX, gameState.playerY);
        return;
      }

      // If the target is a town guard and they are not yet hostile, trigger prompt!
      if (activeEnemy.isTownGuard && !gameState.areGuardsHostile) {
        setUnlawfulGuardTarget({ enemy: activeEnemy, index: enemyIndex, pathPoints: [] });
        return;
      }
      const acted = performPlayerAttack(activeEnemy, enemyIndex, []);
      if (acted) {
        executeEnemiesTurn(gameState.playerX, gameState.playerY);
      }
      return;
    }

    // Check Chest loot
    const chestIndex = gameState.chests.findIndex((c) => c.x === targetX && c.y === targetY && !c.isOpened);
    if (chestIndex !== -1) {
      const chest = gameState.chests[chestIndex];

      // Check if this chest requires a specific key
      if (chest.keyRequired) {
        const hasKeyCount = gameState.inventoryMaterials[chest.keyRequired] || 0;
        if (hasKeyCount > 0) {
          // Consume 1 key
          setGameState((prev) => {
            const nextMats = { ...prev.inventoryMaterials };
            nextMats[chest.keyRequired!] = Math.max(0, (nextMats[chest.keyRequired!] || 0) - 1);
            return {
              ...prev,
              inventoryMaterials: nextMats
            };
          });

          addLogMessage(`🔑 [KEY USED]: You inserted the Faction Watchtower Key into the massive padlock! It turns with a heavy, satisfying metallic CLANK!`, 'loot');
          handleOpenChest(chestIndex, false);
          return;
        } else {
          playSound('deny');
          addLogMessage(`🔒 [KEY REQUIRED]: The Faction Tribute Chest is sealed shut with an elite faction padlock! You need the Faction Watchtower Key to unlock it. Defeat the Watchtower Commander here to claim the key!`, 'danger');
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: targetX, y: targetY, text: `🔒 Key Required`, type: 'text' },
          });
          window.dispatchEvent(ev);
          return;
        }
      }

      playSound('loot');
      let nameStr = "Locked Chest";
      if (chest.id?.includes("camp_chest")) {
        nameStr = "🔒 Locked Camp Chest";
      } else if (chest.id?.includes("ruined_chest")) {
        nameStr = "🏺 Ancient Ruined Vault Chest";
      } else if (chest.id?.includes("oasis_chest")) {
        nameStr = "🌴 Hidden Oasis Sarcophagus";
      } else if (chest.id?.startsWith("chest_")) {
        nameStr = "🕸️ Locked Dungeon Depth Chest";
      }
      
      addLogMessage(`🔒 You encountered a locked ${nameStr}! Pulling out Tension Lockpicks...`, 'system');
      setActiveLockpickingChestIndex(chestIndex);
      setIsLockpickingOpen(true);
      return;
    }

    // Perform actual player coordinate advance
    let isPoisonedMove = false;
    let nextHp = stats.hp;
    let activeMoveScars = stats.scars ? [...stats.scars] : [];

    // Check if standing on traps
    const steppedTrapIndex = gameState.traps.findIndex((t) => t.x === targetX && t.y === targetY);
    let nextTraps = [...gameState.traps];

    let currentScoutingLvl = stats.scoutingLevel || 1;
    let currentScoutingXp = stats.scoutingXp || 0;

    if (steppedTrapIndex !== -1 && !isLunarBlessingActive(gameState, 'new_moon')) {
      const activeTrap = gameState.traps[steppedTrapIndex];
      if (!activeTrap.triggered || activeTrap.type === 'FireVent') {
        // If the trap has been detected and is not triggered, attempt to DISARM!
        if (activeTrap.detected && !activeTrap.triggered) {
          const roll = Math.floor(Math.random() * 20) + 1;
          const disarmSkill = (stats.dex || 10) + currentScoutingLvl * 4;
          const difficulty = activeTrap.type === 'FireVent' ? 18 : activeTrap.type === 'PoisonGas' ? 14 : 12;

          if (roll + disarmSkill >= difficulty) {
            playSound('loot');
            const xpGained = 25;
            currentScoutingXp += xpGained;
            let levelUpText = '';
            if (currentScoutingXp >= currentScoutingLvl * 100) {
              currentScoutingXp -= currentScoutingLvl * 100;
              currentScoutingLvl += 1;
              levelUpText = ` 🎓 [SCOUTING UPGRADE]: Your Trap Detection & Scouting level increased to Level ${currentScoutingLvl}!`;
              setTimeout(() => playSound('levelUp'), 150);
            }

            addLogMessage(`🔧 [DISARM SUCCESS]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) You disarmed the ${activeTrap.type}! (+25 Scouting XP)${levelUpText}`, 'loot');

            nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };

            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: targetX, y: targetY, text: `🔧 DISARMED`, type: 'heal' },
            });
            window.dispatchEvent(ev);
          } else {
            // Disarm failed! Trap triggers! Check Luck Evasion
            const luckRoll = Math.random();
            const effectiveLck = getEffectiveAttribute(gameState, 'lck');
            const evadeChance = Math.min(0.75, Math.max(0.05, effectiveLck * 0.02));
            if (luckRoll < evadeChance) {
              playSound('loot');
              addLogMessage(`🍀 [LUCK EVADE]: (Disarm Failed) You slipped up, but your incredible luck (${stats.lck || 10} LCK) saved you! You dodged the springing parts of the ${activeTrap.type} trap! (+10 Scouting XP)`, 'loot');
              nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
              currentScoutingXp += 10;
              const ev = new CustomEvent('spawn-game-effect', {
                detail: { x: targetX, y: targetY, text: `🍀 EVADED!`, type: 'heal' },
              });
              window.dispatchEvent(ev);
            } else {
              let trapDamage = 6;
              let trapLog = '';
              if (activeTrap.type === 'Spikes') {
                trapDamage = Math.floor(Math.random() * 5) + 6;
                trapLog = `💥 [DISARM FAIL]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) Your fingers slip! Spikes snap! Sustained -${trapDamage} HP.`;
                nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
              } else if (activeTrap.type === 'PoisonGas') {
                trapDamage = 4;
                trapLog = `🧪 [DISARM FAIL]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) Gas nozzle explodes! Sustained -${trapDamage} HP & poison.`;
                isPoisonedMove = true;
              } else if (activeTrap.type === 'FireVent') {
                trapDamage = 12;
                trapLog = `🔥 [DISARM FAIL]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) Searing volcanic fumes burst! Sustained -${trapDamage} HP burning.`;
              }

              playSound('trap');
              nextHp -= trapDamage;
              addLogMessage(trapLog, 'danger');
              setShakeTrigger((s) => s + 1);

              const ev = new CustomEvent('spawn-game-effect', {
                detail: { x: targetX, y: targetY, text: `💥 TRAP! -${trapDamage} HP`, type: 'dmg' },
              });
              window.dispatchEvent(ev);

              // Scar check
              const scarResult = evaluateScarAcquisition(trapDamage, nextHp, stats.maxHp, activeMoveScars, stats.turnsPlayed + 1);
              if (scarResult) {
                activeMoveScars.push(scarResult.scar);
                addLogMessage(scarResult.logText, 'danger');
                setTimeout(() => { playSound('trap'); }, 40);
                const evSc = new CustomEvent('spawn-game-effect', {
                  detail: { x: targetX, y: targetY, text: `🤕 SCARRED!`, type: 'heal' },
                });
                window.dispatchEvent(evSc);
              }
            }
          }
        } else {
          // Standard trigger of hidden / undetected trap! Check Luck Evasion
          const luckRoll = Math.random();
          const effectiveLck = getEffectiveAttribute(gameState, 'lck');
          const evadeChance = Math.min(0.75, Math.max(0.05, effectiveLck * 0.02));
          if (luckRoll < evadeChance) {
            playSound('loot');
            addLogMessage(`🍀 [LUCK EVADE]: You stepped on a hidden ${activeTrap.type}, but your incredible luck (${stats.lck || 10} LCK) saved you! You avoided taking any damage! (+10 Scouting XP)`, 'loot');
            nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
            currentScoutingXp += 10;
            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: targetX, y: targetY, text: `🍀 EVADED!`, type: 'heal' },
            });
            window.dispatchEvent(ev);
          } else {
            playSound('trap');
            let trapDamage = 6;
            let trapLog = '';

            if (activeTrap.type === 'Spikes') {
              trapDamage = Math.floor(Math.random() * 5) + 6;
              trapLog = `💥 SNAP! You stumbled onto hidden floor spikes! Sustained -${trapDamage} HP.`;
              nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
            } else if (activeTrap.type === 'PoisonGas') {
              trapDamage = 4;
              trapLog = `🧪 GAS! You stepped on an invisible poison gas vent! Sustained -${trapDamage} HP & poison.`;
              isPoisonedMove = true;
            } else if (activeTrap.type === 'FireVent' && activeTrap.isActive) {
              trapDamage = 12;
              trapLog = `🔥 BLAZE! You walked into a hidden Fire Vent! Sustained -${trapDamage} HP burning.`;
            } else {
              trapDamage = 0;
            }

            if (trapDamage > 0) {
              nextHp -= trapDamage;
              addLogMessage(trapLog, 'danger');
              setShakeTrigger((s) => s + 1);

              // Evaluate scar
              const scarResult = evaluateScarAcquisition(trapDamage, nextHp, stats.maxHp, activeMoveScars, stats.turnsPlayed + 1);
              if (scarResult) {
                activeMoveScars.push(scarResult.scar);
                addLogMessage(scarResult.logText, 'danger');
                setTimeout(() => { playSound('trap'); }, 40);
                const evSc = new CustomEvent('spawn-game-effect', {
                  detail: { x: targetX, y: targetY, text: `🤕 SCARRED!`, type: 'heal' },
                });
                window.dispatchEvent(evSc);
              }

              const ev = new CustomEvent('spawn-game-effect', {
                detail: { x: targetX, y: targetY, text: `-${trapDamage} TRAP`, type: 'dmg' },
              });
              window.dispatchEvent(ev);
            }
          }
        }
      }
    } else if (steppedTrapIndex !== -1 && isLunarBlessingActive(gameState, 'new_moon')) {
      addLogMessage(`🌑 [SHADOW VEIL]: You drift over a hidden ${gameState.traps[steppedTrapIndex].type} trap without triggering it!`, 'info');
    }

    // Now scan for ANY nearby hidden traps within a dynamic radius based on INT
    const scanRadius = stats.int >= 30 ? 4 : stats.int >= 18 ? 3 : 2;
    let detectedCount = 0;
    let detectedViaIntellect = 0;
    let scoutingXpEarned = 0;

    nextTraps = nextTraps.map((trap) => {
      // If already detected or triggered, skip
      if (trap.detected || trap.triggered) return trap;

      const dist = Math.max(Math.abs(trap.x - targetX), Math.abs(trap.y - targetY));
      if (dist <= scanRadius) {
        // Run perception check, boosted by DEX, LCK, and INT
        const baseChance = 0.20 + (stats.dex * 0.01) + (stats.lck * 0.01) + (stats.int * 0.015) + currentScoutingLvl * 0.10;
        if (Math.random() < baseChance) {
          detectedCount++;
          if (dist > 2 || stats.int >= 15) {
            detectedViaIntellect++;
          }
          scoutingXpEarned += 15;
          return { ...trap, detected: true, hidden: false };
        }
      }
      return trap;
    });

    if (detectedCount > 0) {
      playSound('spell'); // soft alert sound
      currentScoutingXp += scoutingXpEarned;
      let levelUpText = '';
      if (currentScoutingXp >= currentScoutingLvl * 100) {
        currentScoutingXp -= currentScoutingLvl * 100;
        currentScoutingLvl += 1;
        levelUpText = ` 🎓 [SCOUTING UPGRADE]: Your Trap Detection & Scouting level increased to Level ${currentScoutingLvl}!`;
        setTimeout(() => playSound('levelUp'), 150);
      }

      let logMessage = `👁️ [PERCEPTION]: Spot ${detectedCount} hidden trap${detectedCount > 1 ? 's' : ''}! (+${scoutingXpEarned} Scouting XP)${levelUpText}`;
      if (detectedViaIntellect > 0) {
        logMessage = `🧠 [INTELLECT DISCOVERY]: Your high intellect (${stats.int} INT) reveals ${detectedCount} hidden trap${detectedCount > 1 ? 's' : ''} from a distance! (+${scoutingXpEarned} Scouting XP)${levelUpText}`;
      }
      addLogMessage(logMessage, 'info');
    }

    // Check if stepping on custom physical LootPile on the ground (Manual Loot collecting)
    let nextLootPiles = gameState.lootPiles ? [...gameState.lootPiles] : [];
    const lootIndex = nextLootPiles.findIndex(l => l.x === targetX && l.y === targetY);
    let collectedGold = 0;
    let extraEquipmentText = '';

    if (lootIndex !== -1) {
      playSound('loot');
      const pile = nextLootPiles[lootIndex];
      collectedGold = pile.gold;
      
      addLogMessage(`💰 Collected loot pile: +${pile.gold} Gold!`, 'loot');

      pile.materials.forEach(mid => {
        const uWeight = getMaterialUnitWeight(mid);
        if (mid === 'mat_wood') {
          addLogMessage(`  + Gathered: Scrap Wood 🌲 (Weight: ${uWeight} kg)`, 'loot');
        } else if (mid === 'mat_raw_meat') {
          addLogMessage(`  + Acquired: Raw Meat 🥩 (Weight: ${uWeight} kg)`, 'loot');
        } else if (mid === 'mat_cooked_meat') {
          addLogMessage(`  + Acquired: Cooked Meat 🍖 (Weight: ${uWeight} kg)`, 'loot');
        } else {
          const mat = BASIC_MATERIALS.find(m => m.id === mid);
          if (mat) addLogMessage(`  + Metal Material: ${mat.name} (${uWeight} kg)`, 'loot');
        }
      });

      pile.catalysts.forEach(cid => {
        const uWeight = getMaterialUnitWeight(cid);
        const cat = ELEMENTAL_CATALYSTS.find(c => c.id === cid);
        if (cat) addLogMessage(`  + Crystal Catalyst: ${cat.name} (${uWeight} kg)`, 'loot');
      });

      pile.equipment.forEach(equip => {
        const uWeight = getItemWeight(equip);
        addLogMessage(`  + Unlocked Equipment: ${equip.name} (${equip.type === 'weapon' ? `ATK: ${equip.damage}` : `DEF: ${equip.defense}`} · ${uWeight} kg)`, 'loot');
      });
    }

    // Recalculate Vision
    const nextFov = computeFOV(targetX, targetY, gameState.map, 6);
    const nextDiscovered = gameState.discovered.map((row, y) =>
      row.map((cell, x) => cell || nextFov[y][x])
    );

    // Track walked tile on minimap
    const nextVisited = { ...gameState.visitedTiles };
    nextVisited[`${targetX},${targetY},${gameState.currentChunkX},${gameState.currentChunkY}`] = true;

    setGameState((prev) => {
      let activeEffectsList = prev.playerStats.activeEffects ? [...prev.playerStats.activeEffects] : [];
      if (isPoisonedMove) {
        activeEffectsList = activeEffectsList.filter(e => e.id !== 'poison');
        activeEffectsList.push({
          id: 'poison',
          name: 'Poisoned',
          type: 'debuff',
          icon: '🤢',
          description: 'Sustained toxic damage over time. Deals -2 HP per turn.',
          turnsRemaining: 15,
          color: '#10b981',
          damagePerTurn: 2
        });
      }

      // Handle loot pile updates
      let updatedMaterials = prev.inventoryMaterials;
      let updatedCatalysts = prev.inventoryCatalysts;
      let updatedEquipment = prev.equipmentInventory;
      let updatedLootPiles = prev.lootPiles ? [...prev.lootPiles] : [];

      if (lootIndex !== -1) {
        const pile = updatedLootPiles[lootIndex];
        const nextMats = { ...prev.inventoryMaterials };
        const nextCats = { ...prev.inventoryCatalysts };
        const nextEquipment = [...prev.equipmentInventory];

        pile.materials.forEach(mid => {
          nextMats[mid] = (nextMats[mid] || 0) + 1;
        });
        pile.catalysts.forEach(cid => {
          nextCats[cid] = (nextCats[cid] || 0) + 1;
        });
        pile.equipment.forEach(equip => {
          nextEquipment.push(equip);
        });

        updatedLootPiles.splice(lootIndex, 1);
        updatedMaterials = nextMats;
        updatedCatalysts = nextCats;
        updatedEquipment = nextEquipment;
      }

      let nextOverworldChunks = { ...prev.overworldChunks };
      let finalHp = Math.min(prev.playerStats.maxHp, nextHp);
      let finalXp = prev.playerStats.xp;
      let finalLevel = prev.playerStats.level;
      let finalNextLevelXp = prev.playerStats.nextLevelXp;
      let finalMaxHp = prev.playerStats.maxHp;
      let finalMaxMp = prev.playerStats.maxMp;
      let finalMp = prev.playerStats.mp;
      let finalAtk = prev.playerStats.atk;
      let finalDef = prev.playerStats.def;
      let finalUnspentPoints = prev.playerStats.unspentPoints || 0;
      let finalGold = prev.playerStats.gold + collectedGold;
      let finalFactionRep = prev.factionReputation ? { ...prev.factionReputation } : { syndicate: 0, vanguard: 0, bandits: 0 };
      const nextLogs = [...prev.logs];

      const currentChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const currentChunkObj = prev.overworldChunks[currentChunkKey];

      // Watchtower Flag interaction
      if (prev.isOverworld && currentChunkObj && prev.map[targetY]?.[targetX] === TileType.WatchtowerFlag) {
        const wt = currentChunkObj.watchtower;
        if (wt) {
          if (!wt.isClaimed) {
            // Check if garrison is active
            const garrisonAlive = prev.enemies.some(e => 
              (e.id?.includes(`_${prev.currentChunkX}_${prev.currentChunkY}`) && 
               (e.id?.startsWith('wt_commander_') || e.id?.startsWith('wt_knight') || e.id?.startsWith('wt_ranger_')))
            );

            if (garrisonAlive) {
              playSound('deny');
              nextLogs.push({
                id: `garrison_active_${Date.now()}`,
                text: `🛡️ [GARRISON ACTIVE]: Watchtower Sentinel Garrison is actively defending! Defeat all sentries and the Commander before claiming the flag.`,
                type: 'danger',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });
            } else {
              const nextPercent = Math.min(100, wt.claimPercent + 25);
              const updatedWt = { ...wt, claimPercent: nextPercent };

              if (nextPercent >= 100) {
                const playerFaction = prev.faction || 'neutral';
                updatedWt.isClaimed = true;
                updatedWt.controller = playerFaction;
                updatedWt.garrisonDefeated = true;

                setTimeout(() => playSound('levelUp'), 150);
                nextLogs.push({
                  id: `wt_secured_${Date.now()}`,
                  text: `👑 [WATCHTOWER SECURED]: Captured for ${playerFaction === 'syndicate' ? 'Moonshadow Syndicate' : (playerFaction === 'vanguard' ? 'Dawn Vanguard' : (playerFaction === 'bandits' ? 'Rust-Raider Bandits' : 'Independent Renegades'))}! (+150 XP)`,
                  type: 'loot',
                  timestamp: formatGameTime(prev.gameTime).timeStr
                });

                // Award +150 XP
                let updatedXp = finalXp + 150;
                const bonuses = gameConfig.levelUpBonuses;
                while (updatedXp >= finalNextLevelXp) {
                  finalLevel += 1;
                  updatedXp -= finalNextLevelXp;
                  finalNextLevelXp = Math.floor(finalNextLevelXp * bonuses.xpThresholdMultiplier);
                  finalMaxHp += bonuses.maxHp;
                  finalHp = finalMaxHp;
                  finalMaxMp += bonuses.maxMp;
                  finalMp = finalMaxMp;
                  finalAtk += bonuses.atk;
                  finalDef += bonuses.def;
                  finalUnspentPoints += bonuses.attributePoints;

                  nextLogs.push({
                    id: `lvl_up_wt_${Date.now()}_${finalLevel}`,
                    text: `🌟 LEVEL UP! You reached Level ${finalLevel}! (+${bonuses.attributePoints} Stat Points, +${bonuses.maxHp} Max HP)`,
                    type: 'quest',
                    timestamp: formatGameTime(prev.gameTime).timeStr
                  });
                }
                finalXp = updatedXp;

                // Award +30 faction reputation
                if (playerFaction !== 'neutral') {
                  const currentRep = finalFactionRep[playerFaction] || 0;
                  finalFactionRep[playerFaction] = Math.min(100, currentRep + 30);
                  nextLogs.push({
                    id: `wt_rep_${Date.now()}`,
                    text: `⚖️ [REPUTATION GAINED]: Secured a strategic stronghold! +30 Standing with ${playerFaction === 'syndicate' ? 'Moonshadow Syndicate' : (playerFaction === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')} (Current: ${finalFactionRep[playerFaction]})`,
                    type: 'info',
                    timestamp: formatGameTime(prev.gameTime).timeStr
                  });
                }
              } else {
                playSound('loot');
                nextLogs.push({
                  id: `wt_capturing_${Date.now()}`,
                  text: `🚩 [CAPTURING FLAG]: Securing the Faction Watchtower... (${nextPercent}% Captured)`,
                  type: 'info',
                  timestamp: formatGameTime(prev.gameTime).timeStr
                });
              }

              nextOverworldChunks[currentChunkKey] = {
                ...currentChunkObj,
                watchtower: updatedWt
              };
            }
          } else {
            // Already claimed! Check if there is accumulated tax gold to collect!
            if (wt.taxGoldAccumulated > 0) {
              playSound('loot');
              finalGold += wt.taxGoldAccumulated;
              nextLogs.push({
                id: `tax_collected_${Date.now()}`,
                text: `💰 [TAX COLLECTED]: Collected +${wt.taxGoldAccumulated} Gold in tribute tax from the watchtower garrison!`,
                type: 'loot',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });

              nextOverworldChunks[currentChunkKey] = {
                ...currentChunkObj,
                watchtower: {
                  ...wt,
                  taxGoldAccumulated: 0
                }
              };
            }
          }
        }
      }

      // Tax accumulation in all claimed towers across chunks every 30 turns
      const currentTurns = prev.playerStats.turnsPlayed + 1;
      if (currentTurns % 30 === 0) {
        Object.keys(nextOverworldChunks).forEach(key => {
          const chunk = nextOverworldChunks[key];
          if (chunk.watchtower && chunk.watchtower.isClaimed) {
            nextOverworldChunks[key] = {
              ...chunk,
              watchtower: {
                ...chunk.watchtower,
                taxGoldAccumulated: (chunk.watchtower.taxGoldAccumulated || 0) + 25
              }
            };
          }
        });
      }

      return {
        ...prev,
        playerX: targetX,
        playerY: targetY,
        visible: nextFov,
        discovered: nextDiscovered,
        traps: nextTraps,
        lootPiles: updatedLootPiles,
        visitedTiles: nextVisited,
        inventoryMaterials: updatedMaterials,
        inventoryCatalysts: updatedCatalysts,
        equipmentInventory: updatedEquipment,
        overworldChunks: nextOverworldChunks,
        logs: nextLogs,
        playerStats: {
          ...prev.playerStats,
          hp: finalHp,
          xp: finalXp,
          level: finalLevel,
          nextLevelXp: finalNextLevelXp,
          maxHp: finalMaxHp,
          maxMp: finalMaxMp,
          mp: finalMp,
          atk: finalAtk,
          def: finalDef,
          unspentPoints: finalUnspentPoints,
          gold: finalGold,
          turnsPlayed: currentTurns,
          scars: activeMoveScars,
          activeEffects: activeEffectsList,
          scoutingLevel: currentScoutingLvl,
          scoutingXp: currentScoutingXp,
        },
        factionReputation: finalFactionRep
      };
    });

    // Trigger Game Over if trap kills player
    if (nextHp <= 0) {
      playSound('defeat');
      setIsGameOver(true);
      return;
    }

    executeEnemiesTurn(targetX, targetY);
  };

  // Pathfinding and AI solver for dungeon monsters and Overworld villagers schedules
  const executeEnemiesTurn = (px: number, py: number) => {
    setGameState((prev) => {
      let nextEnemies = [...prev.enemies];
      let nextDefeatedCounts = prev.defeatedEnemiesCount ? { ...prev.defeatedEnemiesCount } : {};
      let playerHp = prev.playerStats.hp;
      let playerMp = prev.playerStats.mp;
      const staticLogs: string[] = [];
      const updatedStats = { ...prev.playerStats, turnsPlayed: prev.playerStats.turnsPlayed + 1 };

      // Process Player Status Effects (Active Effects)
      let nextActiveEffects = prev.playerStats.activeEffects ? [...prev.playerStats.activeEffects] : [];
      const updatedEffects: PlayerEffect[] = [];
      
      for (const eff of nextActiveEffects) {
        let turnsLeft = eff.turnsRemaining - 1;
        
        // Ticking effect values
        if (eff.damagePerTurn) {
          let tickDmg = eff.damagePerTurn;
          if (prev.factionTerritories?.['swamp_of_whispers']?.controller === prev.faction) {
            tickDmg = Math.max(1, tickDmg - 3);
          }
          playerHp = Math.max(0, playerHp - tickDmg);
          staticLogs.push(`🤢 You suffer -${tickDmg} toxic damage from ${eff.name}.`);
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: px, y: py, text: `-${tickDmg} Poison`, type: 'dmg' },
          });
          window.dispatchEvent(ev);
        }
        if (eff.healPerTurn) {
          if (playerHp < updatedStats.maxHp) {
            playerHp = Math.min(updatedStats.maxHp, playerHp + eff.healPerTurn);
            staticLogs.push(`✨ You heal +${eff.healPerTurn} HP from ${eff.name}.`);
            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: px, y: py, text: `+${eff.healPerTurn} HP`, type: 'heal' },
            });
            window.dispatchEvent(ev);
          }
        }

        if (turnsLeft > 0) {
          updatedEffects.push({
            ...eff,
            turnsRemaining: turnsLeft
          });
        } else {
          staticLogs.push(`✨ [EFFECT EXPIRED]: Your ${eff.name} effect has expired.`);
        }
      }

      let nextFoodBuff = prev.activeFoodBuff;
      if (nextFoodBuff) {
        if (nextFoodBuff.turnsRemaining <= 1) {
          nextFoodBuff = undefined;
          staticLogs.push(`🍴 [BUFF EXPIRED]: Your culinary buff "${prev.activeFoodBuff?.name}" has expired.`);
        } else {
          nextFoodBuff = {
            ...nextFoodBuff,
            turnsRemaining: nextFoodBuff.turnsRemaining - 1
          };
        }
      }
      let activeScars = updatedStats.scars ? [...updatedStats.scars] : [];

      // Crimson Heart Relic regeneration check
      if (updatedStats.relics?.includes('crimson_heart') && playerHp > 0 && playerHp < updatedStats.maxHp) {
        playerHp = Math.min(updatedStats.maxHp, playerHp + 2);
        staticLogs.push(`❤️ [CRIMSON HEART]: Regenerated +2 HP from your Sanctum Relic.`);
        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: px, y: py, text: `+2 HP`, type: 'heal' },
        });
        window.dispatchEvent(ev);
      }

      let currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      let nextRep = currentRep;
      if (currentRep < 100) {
        nextRep = Math.min(100, currentRep + 0.35);
      }
      let nextGuardsHostile = prev.areGuardsHostile !== undefined ? prev.areGuardsHostile : false;
      if (nextGuardsHostile && nextRep >= 100) {
        nextGuardsHostile = false;
        staticLogs.push(`⚖️ [TOWN NOTICE]: Your crimes have been pardoned over time. The town guards are no longer hostile.`);
      }

      // -----------------------------------------------------------
      // INSTANT DEATH AURA - Sandbox Tweak
      // -----------------------------------------------------------
      if ((window as any).arenaDeathAuraActive) {
        nextEnemies = nextEnemies.filter((e) => {
          const dist = Math.abs(e.x - px) + Math.abs(e.y - py);
          if (dist <= 2 && !e.isFollower && !e.isTownGuard) {
            staticLogs.push(`⚡ DEATH AURA: ${e.name} was smitten dead instantly!`);
            const effectEv = new CustomEvent('spawn-game-effect', {
              detail: { x: e.x, y: e.y, text: "Smite!", type: 'dmg' },
            });
            window.dispatchEvent(effectEv);
            return false;
          }
          return true;
        });
      }

      const nextCorpses = prev.corpses ? [...prev.corpses] : [];
      let nextSplatters = (prev.bloodSplatters || [])
        .map((spl) => {
          // 4% chance per turn to decay blood splatters
          if (Math.random() < 0.04) {
            return { ...spl, intensity: spl.intensity - 1 };
          }
          return spl;
        })
        .filter((spl) => spl.intensity > 0);

      let nextArmor = prev.equippedArmor;
      let nextHelmet = prev.equippedHelmet;
      let nextGloves = prev.equippedGloves;
      let nextBoots = prev.equippedBoots;
      let nextShield = prev.equippedShield;

      // Passage time: ticking clocks and schedule (only on players move ticks) - slowed down!
      let timeCost = 4;
      if (prev.isOverworld) {
        if (hasEquippedTrait(prev, 'SWAMP_GLIDE') && prev.biome === 'swamp') {
          timeCost = 2;
        } else if (hasEquippedTrait(prev, 'DESERT_IMMUNITY') && prev.biome === 'desert') {
          timeCost = 2;
        } else if (hasEquippedTrait(prev, 'STALLION_SPEED')) {
          timeCost = 3;
        }
      }
      let nextTimeVal = (prev.gameTime + timeCost) % 1440;
      let nextNpcs = prev.npcs ? [...prev.npcs] : [];
      let nextTraps = prev.traps ? [...prev.traps] : [];

      // Merchant restock clock check
      let lastRestock = prev.lastRestockTime !== undefined ? prev.lastRestockTime : 480;
      let nextRestockTime = lastRestock;
      let merchantGoldUpdate = prev.merchantGold ? { ...prev.merchantGold } : {};
      let merchantStockUpdate = prev.merchantStock ? { ...prev.merchantStock } : {};

      // If time progressed significantly (5 hours of game clock = 300 minutes = 30 turns)
      let restockDiff = 0;
      if (nextTimeVal >= lastRestock) {
        restockDiff = nextTimeVal - lastRestock;
      } else {
        restockDiff = (1440 - lastRestock) + nextTimeVal;
      }
      if (restockDiff >= 300) {
        nextRestockTime = nextTimeVal;
        merchantGoldUpdate = {};
        merchantStockUpdate = {};
      }

      // Weather fluctuation & GM Autonomous Climate Ritual Engine
      let nextWeather = prev.weather;
      if (prev.isOverworld && prev.gmAutonomousWeather && updatedStats.turnsPlayed > 0 && updatedStats.turnsPlayed % (prev.gmWeatherInterval || 25) === 0) {
        const weathers: ('clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard')[] = ['clear', 'rainy', 'foggy', 'snowy', 'sandstorm', 'blizzard'];
        const candidates = weathers.filter(w => w !== prev.weather);
        const randomWeather = candidates[Math.floor(Math.random() * candidates.length)];
        nextWeather = randomWeather;
        
        const wLabel = nextWeather === 'clear' ? '☀️ Clear Skies'
                     : nextWeather === 'rainy' ? '🌧️ Pouring Rain & Storms'
                     : nextWeather === 'foggy' ? '🌫️ Dense Fog'
                     : nextWeather === 'snowy' ? '❄️ Gentle Snow'
                     : nextWeather === 'sandstorm' ? '🌪️ Swirling Sandstorm'
                     : '🌨️ Frostbite Blizzard';
                     
        const ritualNames = {
          clear: '☀️ Divine Solar Cleansing Ritual',
          rainy: '🌧️ Cosmic Torrent Storm Calling',
          foggy: '🌫️ Ethereal Shadow-Weave Fog Chant',
          snowy: '❄️ Celestial Gentle Frostfall',
          sandstorm: '🌪️ Arid Great Dune Sandstorm',
          blizzard: '🌨️ Glacial Eternal Blizzard Channelling'
        };
        const rName = ritualNames[nextWeather] || 'Divine Weather Alteration';

        staticLogs.push(`🌌 SOVEREIGN GM RITUAL: The autonomous Game Master has invoked "${rName}"! The global climate has transitioned to ${wLabel}.`);
      } else if (prev.isOverworld && !prev.gmAutonomousWeather && updatedStats.turnsPlayed % 40 === 0) {
        const roll = Math.random();
        if (prev.biome === 'desert') {
          nextWeather = roll > 0.70 ? 'sandstorm' : (roll > 0.50 ? 'foggy' : 'clear');
        } else if (prev.biome === 'tundra') {
          nextWeather = roll > 0.75 ? 'blizzard' : (roll > 0.40 ? 'snowy' : 'clear');
        } else if (prev.biome === 'swamp') {
          nextWeather = roll > 0.60 ? 'rainy' : (roll > 0.40 ? 'foggy' : 'clear');
        } else {
          nextWeather = roll > 0.70 ? 'rainy' : (roll > 0.50 ? 'foggy' : 'clear');
        }

        if (nextWeather !== prev.weather) {
          const wLabel = nextWeather === 'clear' ? '☀️ Clear Skies'
                       : nextWeather === 'rainy' ? '🌧️ Pouring Rain & Storms'
                       : nextWeather === 'foggy' ? '🌫️ Dense Fog'
                       : nextWeather === 'snowy' ? '❄️ Gentle Snow'
                       : nextWeather === 'sandstorm' ? '🌪️ Swirling Sandstorm'
                       : '🌨️ Frostbite Blizzard';
          staticLogs.push(`☁️ The weather shifts! The area is now covered in ${wLabel}.`);
        }
      }

      // Seasonal Transformation & Cycles Progression (every 250 turns)
      const getSeasonFromTurns = (turns: number): 'spring' | 'summer' | 'autumn' | 'winter' => {
        const cycle = Math.floor(turns / 250) % 4;
        if (cycle === 0) return 'spring';
        if (cycle === 1) return 'summer';
        if (cycle === 2) return 'autumn';
        return 'winter';
      };

      const currentSeason = getSeasonFromTurns(prev.playerStats.turnsPlayed);
      const nextSeason = getSeasonFromTurns(updatedStats.turnsPlayed);

      if (nextSeason !== currentSeason) {
        let msg = '';
        if (nextSeason === 'spring') {
          msg = '🌸 [SEASON TRANSITION]: The cycle of life turns. Fresh blossoms bloom under gentle skies! Lowland fields are rich with double-yield Wild Berries.';
        } else if (nextSeason === 'summer') {
          msg = '☀️ [SEASON TRANSITION]: The midyear sun peaks! Severe drought heatwaves slow traveling speeds and slowly sap 1 Focus (MP) every 15 turns.';
        } else if (nextSeason === 'autumn') {
          msg = '🍂 [SEASON TRANSITION]: Leaves turn amber. Thick shrouds of mist cover the land, reducing vision by 50% but boosting stealth critical strikes by +40%.';
        } else if (nextSeason === 'winter') {
          msg = '❄️ [SEASON TRANSITION]: Solstice freeze! Glacial winter blizzards sweep the land. Overworld lakes and puddles freeze into solid walkable ice platforms, but your carrying weight penalties are 1.5x more severe and berry gathering is frozen barren!';
        }
        staticLogs.push(msg);

        const sEv = new CustomEvent('spawn-game-effect', {
          detail: { x: px, y: py, text: `${nextSeason.toUpperCase()} TIME!`, type: 'heal' },
        });
        window.dispatchEvent(sEv);
      }

      // Summer Heat Dehydration drain (1 MP consumed every 15 turns)
      if (prev.isOverworld && nextSeason === 'summer') {
        if (updatedStats.turnsPlayed % 15 === 0) {
          playerMp = Math.max(0, playerMp - 1);
          staticLogs.push(`☀️ [SUMMER HEAT]: The blazing sun saps your concentration! You lose 1 Focus (MP) to dehydration.`);
          const heatEv = new CustomEvent('spawn-game-effect', {
            detail: { x: px, y: py, text: `-1 MP (Heat) ☀️`, type: 'dmg' },
          });
          window.dispatchEvent(heatEv);
        }
      }

      // Day-Night hour shift alert logs
      const hoursPrev = Math.floor(prev.gameTime / 60);
      const hoursNext = Math.floor(nextTimeVal / 60);
      if (hoursPrev !== hoursNext) {
        if (hoursNext === 18) {
          staticLogs.push(`🌇 Sunset approaches. The skies burn with warm amber twilight.`);
        } else if (hoursNext === 20) {
          staticLogs.push(`🌙 Night has fallen. Wilderness shadows grow deep, and town gates close.`);
        } else if (hoursNext === 4) {
          staticLogs.push(`🌅 Dawn rises with soft lavender hues. Light begins to bleed into the horizon.`);
        } else if (hoursNext === 6) {
          staticLogs.push(`☀️ Morning has arrived. A fresh day of overworld travel begins!`);
        }
      }

      // -----------------------------------------------------------------
      // GM RPG POINT OF INTEREST NUDGE (Modular narration helper)
      // Occurs occasionally to narratively nudge player toward surrounding cities/ruins/dungeons
      // -----------------------------------------------------------------
      if (prev.isOverworld && updatedStats.turnsPlayed > 0 && updatedStats.turnsPlayed % 55 === 22) {
        const nudgeMsg = getGMPointOfInterestNudge(prev.currentChunkX, prev.currentChunkY, updatedStats.turnsPlayed);
        if (nudgeMsg) {
          staticLogs.push(nudgeMsg);
        }
      }

      // Calculate dynamic core RPG item and stat threat factors to scale monsters difficulty
      const pLevel = updatedStats.level || 1;
      const weaponVal = prev.currentWeapon ? Math.max(0, prev.currentWeapon.damage) : 0;
      const armorVal = (nextArmor?.defense || 0) + 
                       (nextHelmet?.defense || 0) + 
                       (nextGloves?.defense || 0) + 
                       (nextBoots?.defense || 0) + 
                       (nextShield?.defense || 0);

      const gearRating = weaponVal + armorVal;

      const totalStats = (updatedStats.str || 10) + 
                          (updatedStats.dex || 10) + 
                          (updatedStats.int || 10) + 
                          (updatedStats.cha || 10) + 
                          (updatedStats.lck || 10);
      const statExcess = Math.max(0, totalStats - 50);

      const gearBonusFactor = Math.max(0, gearRating - 4) * 0.15; // +15% per rating point above default template (was 3%)
      const statBonusFactor = statExcess * 0.05; // +5% per allocated stat point (was 1.5%)
      const levelBonusFactor = Math.max(0, pLevel - 1) * 0.25; // +25% per level above level 1 (was 8%)

      // Absolute progression multiplier
      const playerScaleCoeff = 1.0 + levelBonusFactor + gearBonusFactor + statBonusFactor;

      // Escalation threat calculations
      const turnIntensity = updatedStats.turnsPlayed / 100;
      const timeHours = updatedStats.realTimeSeconds / 3600;
      const threatCoeff = (1.0 + Math.max(0, prev.playerStats.depth - 1) * 0.45 + turnIntensity * 0.12 + timeHours * 0.8) * playerScaleCoeff;

      // -----------------------------------------------------------------
      // GM ACTIVE ENEMY SPAWNER
      // Spawns hostiles 20-30 tiles away from the player. Bounds density to stay playable.
      // Scale up spawning frequency and maximum roaming count as requested for long runs!
      // -----------------------------------------------------------------
      const activeMonstersCount = nextEnemies.filter(e => !e.isFollower && !e.isTownGuard).length;
      const gmSpawnInterval = updatedStats.turnsPlayed > 300 ? 35 : 45; // Spawns every 35-45 turns (was 150!)
      const maxActiveRoaming = updatedStats.turnsPlayed > 300 ? 8 : 6;  // More active monsters allowed (was 4)

      if (updatedStats.turnsPlayed % gmSpawnInterval === 0 && activeMonstersCount < maxActiveRoaming) {
        let spawnedCoordinate: { x: number; y: number } | null = null;
        for (let attempt = 0; attempt < 40; attempt++) {
          const dx = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 11) + 20); // 20-30 tile range
          const dy = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 11) + 20);
          const rx = px + dx;
          const ry = py + dy;

          if (rx >= 0 && rx < LEVEL_WIDTH && ry >= 0 && ry < LEVEL_HEIGHT) {
            const levelTile = prev.map[ry][rx];
            const isBlocked = nextEnemies.some(e => e.x === rx && e.y === ry) || (px === rx && py === ry);
            if (!isBlocked && (levelTile === TileType.Floor || levelTile === TileType.Grass || levelTile === TileType.Path)) {
              spawnedCoordinate = { x: rx, y: ry };
              break;
            }
          }
        }

        if (spawnedCoordinate) {
          const roll = Math.random();
          let spawnedType = EnemyType.Rat;
          // 8% chance to spawn the rare Alchemical Loot Goblin!
          if (roll < 0.08) {
            spawnedType = EnemyType.LootGoblin;
          } else {
            const innerRoll = Math.random();
            // Scale spawning and spawn dynamic bosses/giants in deep dungeons or late turns!
            if (prev.playerStats.depth >= 6 || updatedStats.turnsPlayed > 400) {
              if (innerRoll > 0.90) spawnedType = EnemyType.Louhi; // Finnish Pohjola mistress boss
              else if (innerRoll > 0.80) spawnedType = EnemyType.IkuTurso; // Finnish sea monster boss
              else if (innerRoll > 0.70) spawnedType = EnemyType.Otso; // Finnish forest bear spirit boss
              else if (innerRoll > 0.50) spawnedType = EnemyType.Dragon;
              else if (innerRoll > 0.35) spawnedType = EnemyType.Kalma; // Finnish grave goddess
              else spawnedType = EnemyType.DreadKnight;
            } else if (prev.playerStats.depth > 3) {
              if (innerRoll > 0.85) spawnedType = EnemyType.Hiisi; // Finnish forest fiend
              else if (innerRoll > 0.70) spawnedType = EnemyType.Nakki; // Finnish water kelpie
              else if (innerRoll > 0.50) spawnedType = EnemyType.OrcBrute;
              else if (innerRoll > 0.30) spawnedType = EnemyType.SkeletonMage;
              else spawnedType = EnemyType.Goblin;
            } else {
              if (innerRoll > 0.85) spawnedType = EnemyType.Nakki;
              else if (innerRoll > 0.70) spawnedType = EnemyType.Hiisi;
              else if (innerRoll > 0.50) spawnedType = EnemyType.SkeletonMage;
              else if (innerRoll > 0.30) spawnedType = EnemyType.Goblin;
              else spawnedType = EnemyType.Rat;
            }
          }

          const enemyTemplate = getEnemyTemplate(spawnedType);
          const isBoss = spawnedType === EnemyType.Otso || spawnedType === EnemyType.Louhi || spawnedType === EnemyType.IkuTurso;
          const hpMult = isBoss ? 5.0 : 1.0;
          const atkMult = isBoss ? 2.0 : 1.0;

          const newRoamingEnemy: Enemy = {
            id: `gm_spawned_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
            x: spawnedCoordinate.x,
            y: spawnedCoordinate.y,
            type: spawnedType,
            name: isBoss ? `👑 Roaming ${enemyTemplate.name}` : `Roaming ${enemyTemplate.name}`,
            hp: Math.round(enemyTemplate.baseHp * playerScaleCoeff * hpMult * ((window as any).arenaEnemyHpMultiplier || 1.0)),
            maxHp: Math.round(enemyTemplate.baseHp * playerScaleCoeff * hpMult * ((window as any).arenaEnemyHpMultiplier || 1.0)),
            atk: Math.round(enemyTemplate.baseAtk * playerScaleCoeff * atkMult * ((window as any).arenaEnemyDamageMultiplier || 1.0)),
            def: Math.round((enemyTemplate.baseDef + (isBoss ? 5 : 0)) * playerScaleCoeff),
            range: enemyTemplate.range || 1,
            speed: enemyTemplate.speed || 1,
            color: enemyTemplate.color,
            char: enemyTemplate.char,
            state: EnemyState.Chasing,
            isElite: Math.random() > 0.80 || isBoss,
            isBoss: isBoss,
            patrolPath: [{ x: spawnedCoordinate.x, y: spawnedCoordinate.y }],
            patrolIndex: 0,
            debuffs: []
          };

          nextEnemies.push(newRoamingEnemy);
          if (isBoss) {
            staticLogs.push(`🚨 [GM WARN]: The Game Master has spawned a roaming BOSS: ${enemyTemplate.name}! Defeat it for legendary drops!`);
          } else {
            staticLogs.push(`⚠️ [GM SYSTEM]: A hostile Roaming ${enemyTemplate.name} has spawned far away (20-30 tiles)! Adaptive scaling sets its HP to ${newRoamingEnemy.hp} due to your strength!`);
          }
        }
      }

      // 1. Caravan Syncer integration
      const caravanState = syncCaravanState(prev, nextTimeVal, nextNpcs, nextEnemies);
      nextNpcs = caravanState.npcs;
      nextEnemies = caravanState.enemies;

      // 2. Overworld Random Event System (triggered periodically in the overworld chunk)
      // Toned down to occur rarely (every 160 turns with a 15% chance, instead of every 30 turns with 25% chance)
      const nextTurnsPlayed = updatedStats.turnsPlayed;
      if (prev.isOverworld && nextTurnsPlayed % 160 === 0 && Math.random() < 0.15) {
        const eventId = Math.floor(Math.random() * 5);
        if (eventId === 0) {
          // Town Brawl near the tavern!
          const brawlX = 20 + Math.floor(Math.random() * 5);
          const brawlY = 4 + Math.floor(Math.random() * 3);
          nextEnemies.push({
            id: `brawler_${Date.now()}`,
            name: "Drunk Brawler (Bandit)",
            char: "B",
            color: "#f43f5e",
            hp: 20,
            maxHp: 20,
            atk: 4,
            def: 1,
            x: brawlX,
            y: brawlY,
            state: EnemyState.Chasing,
            isElite: false,
            patrolPath: [],
            patrolIndex: 0,
            debuffs: [],
            speed: 1.0,
            range: 1
          });
          staticLogs.push(`🍺 EVENT: A loud brawling fight breaks out at the Inn Tavern! Angry drunkards take to the floor!`);
        } else if (eventId === 1) {
          // Bandit ambush!
          const rX = Math.min(LEVEL_WIDTH - 2, Math.max(1, px + (Math.random() > 0.5 ? 4 : -4)));
          const rY = Math.min(LEVEL_HEIGHT - 2, Math.max(1, py + (Math.random() > 0.5 ? 4 : -4)));
          nextEnemies.push({
            id: `ambush_${Date.now()}`,
            name: "Rogue Bandit",
            char: "B",
            color: "#fb7185",
            hp: 30,
            maxHp: 30,
            atk: 5,
            def: 2,
            x: rX,
            y: rY,
            state: EnemyState.Chasing,
            isElite: false,
            patrolPath: [],
            patrolIndex: 0,
            debuffs: [],
            speed: 1.0,
            range: 1
          });
          staticLogs.push(`🏹 EVENT: Bandit Ambush! A Rogue Bandit steps out of the forest canopy and points a blade at you!`);
        } else if (eventId === 2) {
          // Forest glimmer (Chest spawns nearby!)
          const rX = Math.min(LEVEL_WIDTH - 3, Math.max(2, px + (Math.random() > 0.5 ? 3 : -3)));
          const rY = Math.min(LEVEL_HEIGHT - 3, Math.max(2, py + (Math.random() > 0.5 ? 3 : -3)));
          if (prev.map[rY][rX] === TileType.Grass) {
            nextTraps.push({
              id: `event_chest_${Date.now()}`,
              type: 'PoisonDart' as any,
              x: rX,
              y: rY,
              status: 'concealed'
            } as any);
            staticLogs.push(`✨ EVENT: You spot a glimmering wooden box hidden behind the woodland brush nearby!`);
          }
        } else if (eventId === 3) {
          staticLogs.push(`☄️ EVENT: A bright shooting star breaks through the overworld sky! You absorb its magical residue, fully restoring MP.`);
          playerMp = prev.playerStats.maxMp;
        } else if (eventId === 4) {
          // Troll migration!
          const rX = Math.min(LEVEL_WIDTH - 2, Math.max(1, px + (Math.random() > 0.5 ? 5 : -5)));
          const rY = Math.min(LEVEL_HEIGHT - 2, Math.max(1, py + (Math.random() > 0.5 ? 5 : -5)));
          nextEnemies.push({
            id: `troll_migrant_${Date.now()}`,
            name: "Forest Troll",
            char: "T",
            color: "#16a34a",
            hp: 75,
            maxHp: 75,
            atk: 7,
            def: 5,
            x: rX,
            y: rY,
            state: EnemyState.Chasing,
            isElite: true,
            patrolPath: [],
            patrolIndex: 0,
            debuffs: [],
            speed: 0.8,
            range: 1
          });
          staticLogs.push(`👹 EVENT: A wild Forest Troll wanders out of the nearby mountain range in search of meat!`);
        }
      }

      // Day schedule trigger: Blacksmith, Merchant and Sage walk down crossroads, or go inside Inn
      if (prev.isOverworld && nextNpcs.length > 0) {
        const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
        const currentChunk = prev.overworldChunks[chunkKey];

        const findTileInMap = (map: TileType[][], tileType: TileType, refX: number, refY: number) => {
          let bestX = -1;
          let bestY = -1;
          let bestDist = 9999;
          for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
              if (map[y] && map[y][x] === tileType) {
                const d = Math.abs(x - refX) + Math.abs(y - refY);
                if (d < bestDist) {
                  bestDist = d;
                  bestX = x;
                  bestY = y;
                }
              }
            }
          }
          return bestX !== -1 ? { x: bestX, y: bestY } : null;
        };

        nextNpcs = nextNpcs.map((npc) => {
          // Dynamic safety guard: if NPC is somehow stuck in a solid/blocked tile, sanitise immediately
          let currentX = npc.x;
          let currentY = npc.y;
          const npcFloorMap = (npc.z === 1 && currentChunk?.secondFloorMap) 
            ? currentChunk.secondFloorMap 
            : (currentChunk?.map || prev.map);

          const currentTile = npcFloorMap[currentY]?.[currentX];
          if (currentTile && !isTileSafeForNpc(currentTile)) {
            const nearestSafe = findNearestSafeNpcTile(currentX, currentY, npcFloorMap);
            currentX = nearestSafe.x;
            currentY = nearestSafe.y;
          }

          if (npc.id?.startsWith('safehouse_guard_')) {
            const hr = Math.floor(nextTimeVal / 60);
            const isSleepTime = hr >= 22 || hr < 7;
            
            let targetX = npc.homeX;
            let targetY = npc.homeY;
            let sched: NPC['scheduleState'] = 'work';
            let char = npc.char || '💂';
            let finalDialogue = [...npc.dialogue];

            if (isSleepTime) {
              const bedX = npc.homeX + 1;
              const bedY = npc.homeY - 1;
              targetX = bedX;
              targetY = bedY;
              sched = 'home';
              if (currentX === bedX && currentY === bedY) {
                char = '🛌';
                finalDialogue = [
                  `Zzz... *snore*... keeping the safehouse secure in my dreams...`,
                  `*Snore*... resting up for tomorrow's hunt...`,
                  `Zzz... sleeping peacefully...`
                ];
              } else {
                finalDialogue = [
                  `I am heading to bed now, boss. Heading inside to rest.`,
                  `It's getting late, gotta recharge my batteries.`
                ];
              }
            } else {
              sched = 'work';
              const hostiles = nextEnemies.filter(item => !item.isFollower && !item.isTownGuard && !item.isAnimal && !item.isCaptive);
              let closestHostile: Enemy | null = null;
              let closestDist = 999;
              hostiles.forEach(h => {
                const d = Math.abs(currentX - h.x) + Math.abs(currentY - h.y);
                if (d < closestDist) {
                  closestDist = d;
                  closestHostile = h;
                }
              });

              if (closestHostile && closestDist <= 10) {
                targetX = closestHostile.x;
                targetY = closestHostile.y;
                finalDialogue = [
                  `⚔️ ALERT! Hunting down the hostile ${closestHostile.name}! Die, fiend!`,
                  `Die, trespasser! You won't breach our safehouse borders!`,
                  `Securing the perimeter! Hunting ${closestHostile.name}!`
                ];
              } else {
                targetX = npc.workX;
                targetY = npc.workY;
                finalDialogue = [
                  `I am guarding this safehouse, boss! Your stash is perfectly secure here with me, ${npc.name}.`,
                  "Keeping a sharp lookout for wild beasts and bandits. Need to trade some goods?",
                  "A safe outpost is a profitable outpost. I'll hold down the fort."
                ];
              }
            }

            // Sanitise target coordinate
            const targetTile = prev.map[targetY]?.[targetX];
            if (targetTile && !isTileSafeForNpc(targetTile)) {
              const nearestSafe = findNearestSafeNpcTile(targetX, targetY, prev.map);
              targetX = nearestSafe.x;
              targetY = nearestSafe.y;
            }

            let nx = currentX;
            let ny = currentY;

            if (currentX !== targetX || currentY !== targetY) {
              const obstacles = nextNpcs.filter(item => item.id !== npc.id).map(n => ({ x: n.x, y: n.y }));
              if (px !== targetX || py !== targetY) {
                obstacles.push({ x: px, y: py });
              }
              nextEnemies.filter(e => e.x !== targetX || e.y !== targetY).forEach(e => obstacles.push({ x: e.x, y: e.y }));

              const nextWalkStep = getNextStepTowards(currentX, currentY, targetX, targetY, prev.map, true, obstacles);
              if (nextWalkStep) {
                nx = nextWalkStep.x;
                ny = nextWalkStep.y;
                
                if (nx === targetX && ny === targetY && !isSleepTime) {
                  const targetIdx = nextEnemies.findIndex(h => h.x === targetX && h.y === targetY);
                  if (targetIdx !== -1) {
                    const targetH = nextEnemies[targetIdx];
                    const dmg = Math.max(1, 10 - targetH.def);
                    const nextHp = Math.max(0, targetH.hp - dmg);
                    nextEnemies[targetIdx] = { ...targetH, hp: nextHp };
                    
                    playSound('hit');
                    staticLogs.push(`⚔️ [SAFEHOUSE]: Your safehouse guard ${npc.name} charges and strikes ${targetH.name} for ${dmg} damage!`);
                    
                    const dmgEv = new CustomEvent('spawn-game-effect', {
                      detail: { x: targetH.x, y: targetH.y, text: `-${dmg}`, type: 'damage' },
                    });
                    setTimeout(() => window.dispatchEvent(dmgEv), 50);

                    if (nextHp <= 0) {
                      staticLogs.push(`💀 [SAFEHOUSE]: Guard ${npc.name} has slain ${targetH.name}!`);
                      playSound('kill');
                    }
                    nx = currentX;
                    ny = currentY;
                  }
                }
              }
            }

            return {
              ...npc,
              x: nx,
              y: ny,
              char: char,
              scheduleState: sched,
              dialogue: finalDialogue
            };
          }

          let targetX = npc.workX;
          let targetY = npc.workY;
          let sched: NPC['scheduleState'] = 'work';

          const hr = Math.floor(nextTimeVal / 60);
          const isInclement = nextWeather === 'rainy' || nextWeather === 'snowy';

          if (hr >= 20 || hr < 7) {
            // Night: Go sleep inside cottages / home
            targetX = npc.homeX;
            targetY = npc.homeY;
            sched = 'home';
          } else if (isInclement || (hr >= 16 && hr < 20)) {
            // Inclement weather or evening: Walk into the Tavern & Inn!
            // This satisfies "make some villagers to go in" the Inn
            const isTavernVisitor = npc.id?.includes('villager') || npc.id?.includes('apothecary') || npc.id?.includes('companion') || npc.id?.includes('merchant');
            if (isTavernVisitor) {
              const tavernNpc = prev.npcs?.find((n: any) => n.id?.startsWith('npc_tavernmaster_'));
              if (tavernNpc) {
                targetX = tavernNpc.homeX + (Math.abs((npc.name.charCodeAt(0) * 3) % 4) - 2);
                targetY = tavernNpc.homeY + 2; // sit inside Tavern around tables
              } else {
                targetX = 22 + Math.abs((npc.homeX * 3) % 6);
                targetY = 5;
              }
            } else {
              targetX = npc.homeX;
              targetY = npc.homeY;
            }
            sched = 'leisure';
          }

          // Determine target Z floor
          let targetZ = 0;
          if (sched === 'home') {
            targetZ = npc.homeZ !== undefined ? npc.homeZ : 0;
          } else if (sched === 'work') {
            targetZ = npc.workZ !== undefined ? npc.workZ : 0;
          } else if (sched === 'leisure') {
            targetZ = 0; // Tavern floor is ground level
          }

          let nextZ = npc.z !== undefined ? npc.z : 0;

          // If NPC is on the wrong floor, their target is the stairs!
          if (nextZ !== targetZ) {
            if (nextZ === 0) {
              // On ground floor, need to find StairsUp near their home
              const stairs = findTileInMap(currentChunk?.map || prev.map, TileType.StairsUp, npc.homeX, npc.homeY);
              if (stairs) {
                targetX = stairs.x;
                targetY = stairs.y;
                if (currentX === stairs.x && currentY === stairs.y) {
                  nextZ = 1; // climb up!
                }
              }
            } else {
              // On second floor, need to find StairsDown near their home
              const stairs = findTileInMap(currentChunk?.secondFloorMap || prev.map, TileType.StairsDown, npc.homeX, npc.homeY);
              if (stairs) {
                targetX = stairs.x;
                targetY = stairs.y;
                if (currentX === stairs.x && currentY === stairs.y) {
                  nextZ = 0; // climb down!
                }
              }
            }
          }

          // Sanitise target coordinate
          const targetTile = npcFloorMap[targetY]?.[targetX];
          if (targetTile && !isTileSafeForNpc(targetTile)) {
            const nearestSafe = findNearestSafeNpcTile(targetX, targetY, npcFloorMap);
            targetX = nearestSafe.x;
            targetY = nearestSafe.y;
          }

          let nx = currentX;
          let ny = currentY;

          // Only walk if they didn't just change floor (Z transition takes a turn)
          if (nextZ === (npc.z !== undefined ? npc.z : 0)) {
            if (currentX !== targetX || currentY !== targetY) {
              // Friendly NPCs bypass collisions with other entities cleanly
              const obstacles = nextNpcs.filter(item => item.id !== npc.id).map(n => ({ x: n.x, y: n.y }));
              if (px !== targetX || py !== targetY) {
                obstacles.push({ x: px, y: py });
              }
              const nextWalkStep = getNextStepTowards(currentX, currentY, targetX, targetY, npcFloorMap, true, obstacles);
              if (nextWalkStep) {
                nx = nextWalkStep.x;
                ny = nextWalkStep.y;
              }
            }
          }

          // Dynamically adjust dialogue if they go inside the Inn due to rain/snow
          let finalDialogue = [...npc.dialogue];
          if (npc.id === 'npc_caravan_merchant') {
            if (sched === 'leisure' && isInclement) {
              finalDialogue = [
                `Gah! The rain is terrible for the wagon canvas! I am sheltering inside the Tavern until my caravan rolls again!`,
                `Enjoying a warm hearth fire in Oakhaven instead of shivering on the dusty carriage seat.`,
                `I have locked the caravan chest securely while visiting the Tavern. Care for some hot fresh bread?`
              ];
            } else if (sched === 'leisure') {
              finalDialogue = [
                `Ah! The caravan is parked safely in the town square. I am taking a quick evening draft in the Tavern!`,
                `Trading tales of the high roads with the local blacksmith Grom Garrison.`,
                `A traveler's feet are always tired. Sit, rest, and check my caravan equipment supplies!`
              ];
            } else if (sched === 'home') {
              finalDialogue = [
                `Zzz... Dreaming of golden roads, heavy coins and merchant cargo...`,
                `*Snore*... Keep that sword ready, sentry guards...`,
                `Zzz... Sleep tightly under the wagon's canvas covers...`
              ];
            }
          } else if (sched === 'leisure' && isInclement) {
            finalDialogue = [
              `Brrr! It is really pouring outside. Thank goodness for Innkeeper Barnaby's warm fire inside the Inn!`,
              `Stay dry other traveler! Let's sit back and enjoy a fresh hearth bread or cold beer in here.`,
              `The dungeons can wait while the skies clear. Sit down and join us inside the Inn!`,
              `Zzz... Dreaming inside the warm tavern...`
            ];
          } else if (sched === 'leisure') {
            finalDialogue = [
              `The evening sun sets beautifully. We've gathered inside the Inn for some hot hearth bread!`,
              `Care for a frothy pint of beer? BARNABY, pour this apprentice another drink!`,
              `Ah, standard twilight social hour at the village Inn. What a relaxing time.`,
              `Zzz... Sleeping under a soft tavern blanket...`
            ];
          }

          if (npc.id?.startsWith('wandering_merchant_') && sched === 'work' && Math.random() < 0.25) {
            const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
            const rDir = dirs[Math.floor(Math.random() * dirs.length)];
            const tx = currentX + rDir.dx;
            const ty = currentY + rDir.dy;
            if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
              const tile = prev.map[ty]?.[tx];
              if (tile === TileType.Grass || tile === TileType.Path) {
                nx = tx;
                ny = ty;
              }
            }
          }

          const isAtHome = Math.abs(nx - npc.homeX) <= 1 && Math.abs(ny - npc.homeY) <= 1;
          const isAsleep = (sched === 'home' && isAtHome);
          const finalChar = isAsleep ? '🛌' : (npc.originalChar || npc.char);

          if (isAsleep) {
            if (npc.role === 'blacksmith') {
              finalDialogue = [
                "*Mumble*... heat the forge... fold the steel... Zzz...",
                "Zzz... no more weapon orders... let me rest...",
                "Zzz... the forge fires are dim...",
                "Zzz... Grom Garison is deep in sleep in his cozy forge..."
              ];
            } else if (npc.role === 'merchant') {
              finalDialogue = [
                "Zzz... five gold coins... no, that's worth ten... Zzz...",
                "Hic... no refunds on cursed swords... Zzz...",
                "Zzz... dreaming of rare silk and ores...",
                "Zzz... Adelia is dreaming of gold bars and rare wares..."
              ];
            } else if (npc.role === 'apothecary') {
              finalDialogue = [
                "Zzz... stir the brew clockwise... one drop of lotus... Zzz...",
                "Sleeping under the starlight... Zzz...",
                "Zzz... Valerius is murmuring ancient incantations...",
                "Zzz... Valerius is resting after an alchemical explosion..."
              ];
            } else if (npc.role === 'tavern_master' as any) {
              finalDialogue = [
                "Zzz... sweep the floor... clean the tables... Zzz...",
                "A fresh baked loaf of bread... coming up... Zzz...",
                "Zzz... Innkeeper Barnaby is snoring loudly...",
                "Zzz... Tavern Master Barnaby is asleep under a warm blanket..."
              ];
            } else if ((npc.role as any) === 'drunk_villager') {
              finalDialogue = [
                "*Loud Snorting*... another lavender pint... Hic... Zzz...",
                "Zzz... spinny beds... *burps in sleep*...",
                "Zzz... too much beer... too spinny...",
                "Zzz... *snore*... the tavern spin is over..."
              ];
            } else if (npc.role === 'villager') {
              finalDialogue = [
                "Zzz... Pip is resting his vocal cords...",
                "*Snore*... hear ye... hear ye... Zzz...",
                "Zzz... dreaming of big news and announcements...",
                "Zzz... Pip the Town Crier is snoring softly..."
              ];
            } else if (npc.role === ('companion_hire' as any)) {
              finalDialogue = [
                "Zzz... shield is ready... watch your back... Zzz...",
                "*Snore*... I am on guard... in my dreams...",
                "Zzz... dreaming of glorious battlefield victories...",
                "Zzz... Your brave companion is resting for tomorrow's dungeon trek..."
              ];
            } else {
              finalDialogue = [
                "Zzz... sleeping peacefully...",
                "Zzz... *snore*...",
                "Zzz... dreaming...",
                "Zzz..."
              ];
            }
          }

          return {
            ...npc,
            x: nx,
            y: ny,
            z: nextZ,
            char: finalChar,
            isAsleep: isAsleep,
            scheduleState: sched,
            dialogue: finalDialogue
          };
        });
      }

      // Pass periodically ticking FireVents and active hazards
      nextTraps = nextTraps.map((t) => {
        if (t.type === 'FireVent') {
          return { ...t, isActive: Math.random() > 0.45 };
        }
        return t;
      });

      // Resolve each enemy sequence
      for (let i = 0; i < nextEnemies.length; i++) {
        const enemy = nextEnemies[i];
        let ex = enemy.x;
        let ey = enemy.y;

        // 1. Process damage debuffs over time (Burn / Poison)
        let nextDebuffs = [...enemy.debuffs];
        let currentHp = enemy.hp;

        for (let dIdx = nextDebuffs.length - 1; dIdx >= 0; dIdx--) {
          const debf = nextDebuffs[dIdx];
          currentHp -= debf.damagePerTurn;
          
          staticLogs.push(`🔥 ${enemy.name} suffers -${debf.damagePerTurn} element damage over time.`);

          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: ex, y: ey, text: `-${debf.damagePerTurn} ${debf.type}`, type: 'dmg' },
          });
          window.dispatchEvent(ev);

          // decay duration
          if (debf.duration <= 1) {
            nextDebuffs.splice(dIdx, 1);
          } else {
            nextDebuffs[dIdx] = { ...debf, duration: debf.duration - 1 };
          }
        }

        // Check if DoT kills monster
        if (currentHp <= 0) {
          nextDefeatedCounts = incrementDefeatedEnemyCount(
            nextDefeatedCounts,
            enemy.name,
            enemy.type,
            !!enemy.isBoss
          );

          // Drop Watchtower Key if it's the Commander dying to DoT!
          if (enemy.id?.startsWith('wt_commander_') || enemy.name?.toLowerCase().includes('watchtower commander') || enemy.name?.toLowerCase().includes('watchtower overlord') || enemy.name?.toLowerCase().includes('outpost commander')) {
            const nextLootPiles = prev.lootPiles ? [...prev.lootPiles] : [];
            nextLootPiles.push({
              id: `loot_dot_${Date.now()}`,
              x: enemy.x,
              y: enemy.y,
              gold: 80,
              materials: ['mat_watchtower_key', 'mat_iron', 'mat_steel'],
              catalysts: ['cat_shadow'],
              equipment: []
            });
            staticLogs.push(`🔑 [KEY DROPPED]: ${enemy.name} has dropped the Faction Watchtower Key in a Loot Pile!`);
          }

          nextEnemies.splice(i, 1);
          i--; // compensate
          updatedStats.xp += 15;
          staticLogs.push(`💀 ${enemy.name} succumbs to elemental damage affliction!`);
          continue;
        }

        // 2. Troll Passive Regeneration (+1 HP each turn up to maxHp)
        if (currentHp > 0 && currentHp < enemy.maxHp && (enemy.name.includes("Troll") || enemy.id.includes("troll"))) {
          const healAmount = Math.min(1, enemy.maxHp - currentHp);
          currentHp += healAmount;
          staticLogs.push(`💚 Troll Regeneration: ${enemy.name} passively heals +${healAmount} HP.`);
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: ex, y: ey, text: `+${healAmount} HP`, type: 'heal' },
          });
          window.dispatchEvent(ev);
        }

        // Apply updated values
        nextEnemies[i] = {
          ...enemy,
          hp: currentHp,
          debuffs: nextDebuffs,
        };

        // Giant's Blood Stun check
        const hasStun = nextDebuffs.some((d) => d.type === CatalystType.Shadow);
        if (hasStun) {
          staticLogs.push(`🌋 ${enemy.name} is stunned from your Giant's Blood and skips its action!`);
          continue;
        }

        // Frostbite / Freeze Skip Alternate Turns Slow
        const hasFrost = nextDebuffs.some((d) => d.type === CatalystType.Frost);
        if (hasFrost && (updatedStats.turnsPlayed % 2 === 0)) {
          staticLogs.push(`❄️ ${enemy.name} is frozen stiff and skips its action this turn!`);
          continue;
        }

        const dist = Math.abs(ex - px) + Math.abs(ey - py);

        // Captive turn resolution
        if (enemy.isCaptive && !enemy.isFreed) {
          // Captives that are not freed yet stay locked up and do absolutely nothing
          continue;
        }

        // Harmless wild animal turn resolution (wanders around without combat)
        if (enemy.isAnimal) {
          if (Math.random() < 0.35) {
            const dirs = [
              { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
              { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];
            const validDirs = dirs.filter(d => {
              const nx = enemy.x + d.dx;
              const ny = enemy.y + d.dy;
              if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
                const t = prev.map[ny][nx];
                const blocked = t === TileType.Wall || t === TileType.Window || t === TileType.Tree || t === TileType.PineTree || t === TileType.BirchTree || t === TileType.CopperVein || t === TileType.IronVein || t === TileType.Water || t === TileType.Table || t === TileType.Campfire || t === TileType.Anvil;
                return !blocked && !(nx === px && ny === py);
              }
              return false;
            });
            if (validDirs.length > 0) {
              const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
              ex = enemy.x + dir.dx;
              ey = enemy.y + dir.dy;
              nextEnemies[i] = { ...enemy, x: ex, y: ey };
            }
          }
          continue;
        }

        // Faction Soldier AI Turn Resolution
        if (enemy.faction === 'vanguard' || enemy.faction === 'syndicate' || enemy.faction === 'bandits') {
          // Determine if player/followers are hostile targets
          let playerIsHostile = false;
          if (enemy.faction === 'vanguard') {
            const rep = prev.factionReputation?.['vanguard'] !== undefined ? prev.factionReputation['vanguard'] : 0;
            if (prev.faction === 'syndicate' || prev.faction === 'bandits' || rep < -30 || prev.activeEscapeAlarm === 'vanguard') {
              playerIsHostile = true;
            }
          } else if (enemy.faction === 'syndicate') {
            const rep = prev.factionReputation?.['syndicate'] !== undefined ? prev.factionReputation['syndicate'] : 0;
            if (prev.faction === 'vanguard' || prev.faction === 'bandits' || rep < -30 || prev.activeEscapeAlarm === 'syndicate') {
              playerIsHostile = true;
            }
          } else if (enemy.faction === 'bandits') {
            const rep = prev.factionReputation?.['bandits'] !== undefined ? prev.factionReputation['bandits'] : 0;
            if (prev.faction !== 'bandits' || rep < -30 || prev.activeEscapeAlarm === 'bandits') {
              playerIsHostile = true;
            }
          }

          // Let's look for targets! Hostile targets can be opposing faction soldiers, or monsters, or player if hostile.
          let targetXVal = -1;
          let targetYVal = -1;
          let isTargetingPlayer = false;
          let isTargetingCompanion = false;
          let targetedCompanionActor: any = null;
          let targetedNpcActor: any = null;

          // 1. Check distance to player. If player is hostile, and close (range 8), target player!
          const distToPlayer = Math.abs(enemy.x - px) + Math.abs(enemy.y - py);
          if (playerIsHostile && distToPlayer <= 8) {
            targetXVal = px;
            targetYVal = py;
            isTargetingPlayer = true;
          }

          // 2. Check distance to companion followers. If player is hostile, target followers!
          if (playerIsHostile && !isTargetingPlayer) {
            const companions = nextEnemies.filter(actor => actor.isFollower);
            let closestFol: any = null;
            let closestFolDist = Infinity;
            for (const fol of companions) {
              const fd = Math.abs(enemy.x - fol.x) + Math.abs(enemy.y - fol.y);
              if (fd < closestFolDist) {
                closestFolDist = fd;
                closestFol = fol;
              }
            }
            if (closestFol && closestFolDist <= 8) {
              targetXVal = closestFol.x;
              targetYVal = closestFol.y;
              isTargetingCompanion = true;
              targetedCompanionActor = closestFol;
            }
          }

          // 3. Find closest opposing faction soldier, town guard (for syndicates), or general monster!
          if (!isTargetingPlayer && !isTargetingCompanion) {
            let closestOpponent: any = null;
            let closestOpponentDist = Infinity;

            for (const actor of nextEnemies) {
              if (actor.id === enemy.id) continue;
              
              let isOpposing = false;
              const enemyFaction = enemy.faction || 'neutral';
              const actorFaction = actor.faction || 'neutral';
              
              if (enemyFaction !== 'neutral') {
                if (actor.isFollower) {
                  // Enemies will target the player's allies/followers IF the player is hostile to this enemy's faction
                  // OR if the ally belongs to an opposing faction
                  if (playerIsHostile) {
                    isOpposing = true;
                  } else {
                    if (enemyFaction === 'vanguard') {
                      isOpposing = actorFaction === 'syndicate' || actorFaction === 'bandits';
                    } else if (enemyFaction === 'syndicate') {
                      isOpposing = actorFaction === 'vanguard' || actorFaction === 'bandits' || actor.isTownGuard;
                    } else if (enemyFaction === 'bandits') {
                      isOpposing = actorFaction === 'vanguard' || actorFaction === 'syndicate' || actor.isTownGuard;
                    }
                  }
                } else {
                  // Standard opposing faction check for non-followers
                  if (enemyFaction === 'vanguard') {
                    isOpposing = actorFaction === 'syndicate' || actorFaction === 'bandits';
                  } else if (enemyFaction === 'syndicate') {
                    isOpposing = actorFaction === 'vanguard' || actorFaction === 'bandits' || actor.isTownGuard;
                  } else if (enemyFaction === 'bandits') {
                    isOpposing = actorFaction === 'vanguard' || actorFaction === 'syndicate' || actor.isTownGuard;
                  }
                }
              }

              if (isOpposing) {
                const fd = Math.abs(enemy.x - actor.x) + Math.abs(enemy.y - actor.y);
                if (fd < closestOpponentDist) {
                  closestOpponentDist = fd;
                  closestOpponent = actor;
                }
              }
            }

            if (closestOpponent && closestOpponentDist <= 8) {
              targetXVal = closestOpponent.x;
              targetYVal = closestOpponent.y;
              targetedNpcActor = closestOpponent;
            }
          }

          // Resolve turn based on selected target
          if (targetXVal !== -1 && targetYVal !== -1) {
            const range = enemy.range || 1;
            const currentDist = Math.max(Math.abs(enemy.x - targetXVal), Math.abs(enemy.y - targetYVal));

            if (currentDist <= range) {
              // Within Attack Range!
              if (isTargetingPlayer) {
                // Strike Player! Player Dodge roll
                const playerExhaustion = updatedStats.exhaustion || 0;
                const baseDodge = Math.min(0.35, (updatedStats.dex || 10) * 0.015);
                const exhaustionPenalty = (playerExhaustion / 100) * 0.15;
                let lunarDodgeBonus = 0;
                if (isLunarBlessingActive(prev, 'new_moon')) lunarDodgeBonus = 0.15;
                else if (isLunarBlessingActive(prev, 'waxing_crescent')) lunarDodgeBonus = 0.10;
                const finalDodgeChance = Math.max(0.02, baseDodge - exhaustionPenalty + lunarDodgeBonus);
                const isDodged = Math.random() < finalDodgeChance;

                if (isDodged) {
                  staticLogs.push(`💨 Dodged! You nimbly evade Faction ${enemy.name}'s strike! (Dodge: ${Math.round(finalDodgeChance * 100)}%)`);
                  const evadeEv = new CustomEvent('spawn-game-effect', {
                    detail: { x: px, y: py, text: `💨 EVADED`, type: 'heal' },
                  });
                  window.dispatchEvent(evadeEv);
                } else {
                  let brokenDefAdjustment = 0;
                  if (nextArmor && nextArmor.durability !== undefined && nextArmor.durability <= 0) brokenDefAdjustment += nextArmor.defense;
                  if (nextHelmet && nextHelmet.durability !== undefined && nextHelmet.durability <= 0) brokenDefAdjustment += nextHelmet.defense;
                  if (nextGloves && nextGloves.durability !== undefined && nextGloves.durability <= 0) brokenDefAdjustment += nextGloves.defense;
                  if (nextBoots && nextBoots.durability !== undefined && nextBoots.durability <= 0) brokenDefAdjustment += nextBoots.defense;
                  if (nextShield && nextShield.durability !== undefined && nextShield.durability <= 0) brokenDefAdjustment += nextShield.defense;
                  
                  const factionDefBonus = (prev.factionTerritories?.['sunplate_ridge']?.controller === prev.faction) ? 2 : 0;
                  const activeCombatDef = Math.max(0, updatedStats.def - brokenDefAdjustment + (prev.activeFoodBuff?.defBonus || 0) + factionDefBonus);

                  let strikeDmg = Math.max(1, enemy.atk - activeCombatDef);
                  const isBloodMoon = prev.bloodMoonTurnsLeft !== undefined && prev.bloodMoonTurnsLeft > 0;
                  if (isBloodMoon) {
                    strikeDmg = Math.round(strikeDmg * 1.25);
                  }
                  const godModeInvuln = (window as any).arenaGodModeActive || false;
                  strikeDmg = godModeInvuln ? 0 : strikeDmg;

                  if (prev.isBraced) {
                    strikeDmg = Math.max(1, Math.floor(strikeDmg / 2));
                  }

                  playerHp -= strikeDmg;
                  staticLogs.push(`⚔️ [WAR]: Hostile Faction ${enemy.name} strikes you for ${strikeDmg} damage!`);
                  
                  const ev = new CustomEvent('spawn-game-effect', {
                    detail: { x: px, y: py, text: `-${strikeDmg} HP`, type: 'dmg' },
                  });
                  window.dispatchEvent(ev);
                }
              } else if (isTargetingCompanion && targetedCompanionActor) {
                // Strike companion
                const dmg = Math.max(1, enemy.atk - 2);
                const folIdx = nextEnemies.findIndex(actor => actor.id === targetedCompanionActor.id);
                if (folIdx !== -1) {
                  const nextHp = Math.max(0, nextEnemies[folIdx].hp - dmg);
                  nextEnemies[folIdx] = { ...nextEnemies[folIdx], hp: nextHp };
                  staticLogs.push(`⚔️ [WAR]: ${enemy.name} slashes your companion ${nextEnemies[folIdx].name} for ${dmg} damage!`);
                  const ev = new CustomEvent('spawn-game-effect', {
                    detail: { x: targetXVal, y: targetYVal, text: `-${dmg} HP`, type: 'dmg' },
                  });
                  window.dispatchEvent(ev);
                }
              } else if (targetedNpcActor) {
                // Strike another NPC / Opposing monster!
                const targetIdx = nextEnemies.findIndex(actor => actor.id === targetedNpcActor.id);
                if (targetIdx !== -1) {
                  const targetM = nextEnemies[targetIdx];
                  const dmg = Math.max(1, enemy.atk - (targetM.def || 0));
                  const nextHp = targetM.hp - dmg;

                  if (range > 1) {
                    staticLogs.push(`🏹 [WAR]: Faction Sentry ${enemy.name} shoots ${targetM.name} for ${dmg} damage!`);
                    const projEvent = new CustomEvent('spawn-projectile', {
                      detail: {
                        startX: enemy.x,
                        startY: enemy.y,
                        targetX: targetM.x,
                        targetY: targetM.y,
                        color: enemy.faction === 'vanguard' ? '#38bdf8' : '#f43f5e',
                        projectileType: 'arrow',
                        impactText: `-${dmg} HP`,
                        impactType: 'dmg'
                      }
                    });
                    window.dispatchEvent(projEvent);
                  } else {
                    staticLogs.push(`⚔️ [WAR]: Faction Sentry ${enemy.name} slashes ${targetM.name} for ${dmg} damage!`);
                    const ev = new CustomEvent('spawn-game-effect', {
                      detail: { x: targetM.x, y: targetM.y, text: `-${dmg} HP`, type: 'dmg' },
                    });
                    window.dispatchEvent(ev);
                  }

                  if (nextHp <= 0) {
                    nextEnemies.splice(targetIdx, 1);
                    if (targetIdx < i) i--;
                    staticLogs.push(`💀 [WAR]: Faction Soldier ${targetM.name} was slain by ${enemy.name}!`);

                    nextCorpses.push({
                      id: `corpse_f_${Date.now()}_${Math.random()}`,
                      x: targetM.x,
                      y: targetM.y,
                      char: targetM.char,
                      name: targetM.name,
                      color: targetM.color,
                      type: 'enemy',
                      isElite: targetM.isElite
                    });

                    nextSplatters.push({
                      id: `spl_f_kill_${Date.now()}_${Math.random()}`,
                      x: targetM.x,
                      y: targetM.y,
                      intensity: 3,
                      color: enemy.faction === 'vanguard' ? '#38bdf8' : '#dc2626'
                    });
                  } else {
                    nextEnemies[targetIdx] = { ...targetM, hp: nextHp };
                    nextSplatters.push({
                      id: `spl_f_hit_${Date.now()}_${Math.random()}`,
                      x: targetM.x,
                      y: targetM.y,
                      intensity: 1,
                      color: enemy.faction === 'vanguard' ? '#38bdf8' : '#dc2626'
                    });
                  }
                }
              }
            } else {
              // Out of Range! Pathfind closer to the target
              const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
              obstacles.push({ x: px, y: py });

              const nextStep = getNextStepTowards(enemy.x, enemy.y, targetXVal, targetYVal, prev.map, true, obstacles);
              if (nextStep) {
                // Melee strike fallback if nextStep is right on top of target
                if (nextStep.x === targetXVal && nextStep.y === targetYVal) {
                  // Attack triggers
                  if (isTargetingPlayer) {
                    // Strike player
                    let brokenDefAdjustment = 0;
                    if (nextArmor && nextArmor.durability !== undefined && nextArmor.durability <= 0) brokenDefAdjustment += nextArmor.defense;
                    if (nextHelmet && nextHelmet.durability !== undefined && nextHelmet.durability <= 0) brokenDefAdjustment += nextHelmet.defense;
                    if (nextGloves && nextGloves.durability !== undefined && nextGloves.durability <= 0) brokenDefAdjustment += nextGloves.defense;
                    if (nextBoots && nextBoots.durability !== undefined && nextBoots.durability <= 0) brokenDefAdjustment += nextBoots.defense;
                    if (nextShield && nextShield.durability !== undefined && nextShield.durability <= 0) brokenDefAdjustment += nextShield.defense;
                    
                    const factionDefBonus = (prev.factionTerritories?.['sunplate_ridge']?.controller === prev.faction) ? 2 : 0;
                    const activeCombatDef = Math.max(0, updatedStats.def - brokenDefAdjustment + (prev.activeFoodBuff?.defBonus || 0) + factionDefBonus);

                    let strikeDmg = Math.max(1, enemy.atk - activeCombatDef);
                    const godModeInvuln = (window as any).arenaGodModeActive || false;
                    strikeDmg = godModeInvuln ? 0 : strikeDmg;

                    playerHp = Math.max(0, playerHp - strikeDmg);
                    staticLogs.push(`⚔️ [WAR]: Hostile Faction ${enemy.name} lunges and strikes you for ${strikeDmg} damage!`);
                    
                    const ev = new CustomEvent('spawn-game-effect', {
                      detail: { x: px, y: py, text: `-${strikeDmg} HP`, type: 'dmg' },
                    });
                    window.dispatchEvent(ev);
                  } else if (targetedNpcActor) {
                    const targetIdx = nextEnemies.findIndex(actor => actor.id === targetedNpcActor.id);
                    if (targetIdx !== -1) {
                      const targetM = nextEnemies[targetIdx];
                      const dmg = Math.max(1, enemy.atk - (targetM.def || 0));
                      const nextHp = targetM.hp - dmg;

                      staticLogs.push(`⚔️ [WAR]: ${enemy.name} strikes ${targetM.name} for ${dmg} damage!`);
                      const ev = new CustomEvent('spawn-game-effect', {
                        detail: { x: targetM.x, y: targetM.y, text: `-${dmg} HP`, type: 'dmg' },
                      });
                      window.dispatchEvent(ev);

                      if (nextHp <= 0) {
                        nextEnemies.splice(targetIdx, 1);
                        if (targetIdx < i) i--;
                        staticLogs.push(`💀 [WAR]: ${targetM.name} was slain by ${enemy.name}!`);

                        nextCorpses.push({
                          id: `corpse_f_${Date.now()}_${Math.random()}`,
                          x: targetM.x,
                          y: targetM.y,
                          char: targetM.char,
                          name: targetM.name,
                          color: targetM.color,
                          type: 'enemy',
                          isElite: targetM.isElite
                        });
                      } else {
                        nextEnemies[targetIdx] = { ...targetM, hp: nextHp };
                      }
                    }
                  }
                } else {
                  nextEnemies[i] = { ...enemy, x: nextStep.x, y: nextStep.y };
                }
              }
            }
          } else {
            // No targets nearby! Walk on patrol route or random drift
            const pPath = enemy.patrolPath || [];
            if (pPath.length > 0) {
              let pIndex = enemy.patrolIndex || 0;
              let checkpoint = pPath[pIndex];
              const distToCheckpoint = Math.abs(enemy.x - checkpoint.x) + Math.abs(enemy.y - checkpoint.y);

              if (distToCheckpoint === 0) {
                pIndex = (pIndex + 1) % pPath.length;
                checkpoint = pPath[pIndex];
              }

              const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
              obstacles.push({ x: px, y: py });
              const nextStep = getNextStepTowards(enemy.x, enemy.y, checkpoint.x, checkpoint.y, prev.map, true, obstacles);
              if (nextStep) {
                nextEnemies[i] = { ...enemy, x: nextStep.x, y: nextStep.y, patrolIndex: pIndex };
              }
            } else {
              // Small random drift
              const dirs = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
              ];
              const validDirs = dirs.filter(dir => {
                const targetX = enemy.x + dir.dx;
                const targetY = enemy.y + dir.dy;
                // Walkable checks
                const tile = prev.map[targetY]?.[targetX];
                if (tile === TileType.Grass || tile === TileType.Floor) {
                  const hasObstacle = nextEnemies.some(e => e.x === targetX && e.y === targetY) || (px === targetX && py === targetY);
                  return !hasObstacle;
                }
                return false;
              });
              if (validDirs.length > 0 && Math.random() < 0.3) {
                const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
                nextEnemies[i] = { ...enemy, x: enemy.x + dir.dx, y: enemy.y + dir.dy };
              }
            }
          }
          continue;
        }

        // Town Guard turn resolution
        if (enemy.isTownGuard) {
          if (nextGuardsHostile) {
            // Hostile guard AI targets the player (at px, py) and companion followers!
            let txVal = px;
            let tyVal = py;
            let targetIsFollower = false;
            let targetedFollowActor: any = null;

            const companionActors = nextEnemies.filter(actor => actor.isFollower);
            if (companionActors.length > 0) {
              let closestFol: any = null;
              let closestFolDist = Infinity;
              for (const folActor of companionActors) {
                const fD = Math.abs(enemy.x - folActor.x) + Math.abs(enemy.y - folActor.y);
                if (fD < closestFolDist) {
                  closestFolDist = fD;
                  closestFol = folActor;
                }
              }
              const distToPlayer = Math.abs(enemy.x - px) + Math.abs(enemy.y - py);
              if (closestFol && closestFolDist < distToPlayer) {
                txVal = closestFol.x;
                tyVal = closestFol.y;
                targetIsFollower = true;
                targetedFollowActor = closestFol;
              }
            }

            const currentDist = Math.max(Math.abs(enemy.x - txVal), Math.abs(enemy.y - tyVal));
            if (currentDist <= (enemy.range || 1)) {
              if (targetIsFollower && targetedFollowActor) {
                // Strike companion
                const dmg = Math.max(1, enemy.atk - 2); // companion has flat def 2
                const folIdx = nextEnemies.findIndex(actor => actor.id === targetedFollowActor.id);
                if (folIdx !== -1) {
                  const nextHp = Math.max(0, nextEnemies[folIdx].hp - dmg);
                  nextEnemies[folIdx] = { ...nextEnemies[folIdx], hp: nextHp };
                  staticLogs.push(`❌ Hostile ${enemy.name} strikes your companion ${nextEnemies[folIdx].name} for ${dmg} damage!`);
                  
                  const ev = new CustomEvent('spawn-game-effect', {
                    detail: { x: txVal, y: tyVal, text: `-${dmg} HP`, type: 'dmg' },
                  });
                  window.dispatchEvent(ev);
                }
              } else {
                // Strike Player !
                const enemyIsLootGoblin = enemy.type === EnemyType.LootGoblin || enemy.name.toLowerCase().includes('loot goblin');
                if (enemyIsLootGoblin) {
                  // Loot Goblin does not attack!
                  staticLogs.push(`🧚 The Alchemical Loot Goblin squeals and tries to find a path away from you!`);
                } else {
                  // Roll player dodge check
                  const playerExhaustion = updatedStats.exhaustion || 0;
                  const baseDodge = Math.min(0.35, (updatedStats.dex || 10) * 0.015);
                  const exhaustionPenalty = (playerExhaustion / 100) * 0.15;
                  let lunarDodgeBonus = 0;
                  if (isLunarBlessingActive(prev, 'new_moon')) lunarDodgeBonus = 0.15;
                  else if (isLunarBlessingActive(prev, 'waxing_crescent')) lunarDodgeBonus = 0.10;
                  const finalDodgeChance = Math.max(0.02, baseDodge - exhaustionPenalty + lunarDodgeBonus);
                  const isDodged = Math.random() < finalDodgeChance;

                  if (isDodged) {
                    staticLogs.push(`💨 Dodged! You nimbly evade ${enemy.name}'s strike! (Dodge Chance: ${Math.round(finalDodgeChance * 100)}%)`);
                    const evadeEv = new CustomEvent('spawn-game-effect', {
                      detail: { x: px, y: py, text: `💨 EVADED`, type: 'heal' },
                    });
                    window.dispatchEvent(evadeEv);
                  } else {
                    let brokenDefAdjustment = 0;
                    if (nextArmor && nextArmor.durability !== undefined && nextArmor.durability <= 0) brokenDefAdjustment += nextArmor.defense;
                    if (nextHelmet && nextHelmet.durability !== undefined && nextHelmet.durability <= 0) brokenDefAdjustment += nextHelmet.defense;
                    if (nextGloves && nextGloves.durability !== undefined && nextGloves.durability <= 0) brokenDefAdjustment += nextGloves.defense;
                    if (nextBoots && nextBoots.durability !== undefined && nextBoots.durability <= 0) brokenDefAdjustment += nextBoots.defense;
                    if (nextShield && nextShield.durability !== undefined && nextShield.durability <= 0) brokenDefAdjustment += nextShield.defense;
                    const factionDefBonus = (prev.factionTerritories?.['sunplate_ridge']?.controller === prev.faction) ? 2 : 0;
                    const activeCombatDef = Math.max(0, updatedStats.def - brokenDefAdjustment + (prev.activeFoodBuff?.defBonus || 0) + factionDefBonus);

                    let strikeDmg = Math.max(1, enemy.atk - activeCombatDef);
                    
                    const isBloodMoon = prev.bloodMoonTurnsLeft !== undefined && prev.bloodMoonTurnsLeft > 0;
                    if (isBloodMoon) {
                      strikeDmg = Math.round(strikeDmg * 1.25); // highly aggressive monsters buff
                    }

                    const godModeInvuln = (window as any).arenaGodModeActive || false;
                    strikeDmg = godModeInvuln ? 0 : strikeDmg;

                    if (prev.isBraced) {
                      strikeDmg = Math.max(1, Math.floor(strikeDmg / 2));
                      staticLogs.push(`🛡️ Braced! Physical guard strike damage halved to ${strikeDmg}.`);
                    }

                    playerHp -= strikeDmg;
                    
                    const isVampireType = enemy.type === EnemyType.Vampire || enemy.name.toLowerCase().includes('vampire');
                    if ((isBloodMoon || isVampireType) && strikeDmg > 0) {
                      const ratio = isVampireType ? 0.2 : 0.15;
                      const healedAmt = Math.min(4, enemy.maxHp - enemy.hp, Math.floor(strikeDmg * ratio));
                      if (healedAmt > 0) {
                        nextEnemies[i] = { ...nextEnemies[i], hp: nextEnemies[i].hp + healedAmt };
                        staticLogs.push(`🩸 [LIFESTEAL]: ${isVampireType ? 'Sovereign blood' : 'Blood Moon'} empowers ${enemy.name}, siphoning ${healedAmt} HP back!`);
                      }
                    }

                    staticLogs.push(`❌ Hostile ${enemy.name} strikes you for ${strikeDmg} damage!`);

                    const ev = new CustomEvent('spawn-game-effect', {
                      detail: { x: px, y: py, text: `-${strikeDmg} HP`, type: 'dmg' },
                    });
                    window.dispatchEvent(ev);
                  }
                }
              }
            } else {
              // Pathfind towards target
              const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
              obstacles.push({ x: px, y: py });
              const nextStep = getNextStepTowards(enemy.x, enemy.y, txVal, tyVal, prev.map, true, obstacles);
              if (nextStep) {
                nextEnemies[i] = { ...enemy, x: nextStep.x, y: nextStep.y };
              }
            }
            continue;
          }

          // Find closest normal hostile monster (non-guard, non-follower)
          const targetMonsters = nextEnemies.filter(item => !item.isFollower && !item.isTownGuard);
          let closestMonster: Enemy | null = null;
          let closestMonsterDist = 999;

          targetMonsters.forEach(m => {
            const d = Math.abs(enemy.x - m.x) + Math.abs(enemy.y - m.y);
            if (d < closestMonsterDist) {
              closestMonsterDist = d;
              closestMonster = m;
            }
          });

          // Sight range is 8 tiles for guards
          if (closestMonster && closestMonsterDist <= 8) {
            // Check if closestMonster is within guard's weapon range
            const currentDist = Math.max(Math.abs(enemy.x - closestMonster.x), Math.abs(enemy.y - closestMonster.y));
            if (currentDist <= (enemy.range || 1)) {
              // Within range! Attack directly!
              const targetIdx = nextEnemies.findIndex(m => m.id === closestMonster!.id);
              if (targetIdx !== -1) {
                const targetM = nextEnemies[targetIdx];
                const dmg = Math.max(1, enemy.atk - targetM.def);
                const nextHp = targetM.hp - dmg;

                if ((enemy.range || 1) > 1) {
                  staticLogs.push(`🏹 ${enemy.name} shoots ${targetM.name} with projectile! (dmg: ${dmg})`);
                  const projEvent = new CustomEvent('spawn-projectile', {
                    detail: {
                      startX: enemy.x,
                      startY: enemy.y,
                      targetX: targetM.x,
                      targetY: targetM.y,
                      color: '#22c55e',
                      projectileType: 'arrow',
                      impactText: `-${dmg} HP`,
                      impactType: 'dmg'
                    }
                  });
                  window.dispatchEvent(projEvent);
                } else {
                  staticLogs.push(`🛡️ ${enemy.name} strikes ${targetM.name} for ${dmg} damage!`);
                  const ev = new CustomEvent('spawn-game-effect', {
                    detail: { x: targetM.x, y: targetM.y, text: `-${dmg} HP`, type: 'dmg' },
                  });
                  window.dispatchEvent(ev);
                }

                if (nextHp <= 0) {
                  nextEnemies.splice(targetIdx, 1);
                  if (targetIdx < i) i--;
                  staticLogs.push(`💀 ${targetM.name} was slain by the brave ${enemy.name}!`);

                  // Spawn physical corpse and death splatter
                  nextCorpses.push({
                    id: `corpse_g_${Date.now()}_${Math.random()}`,
                    x: targetM.x,
                    y: targetM.y,
                    char: targetM.char,
                    name: targetM.name,
                    color: targetM.color,
                    type: targetM.isAnimal ? 'animal' : 'enemy',
                    isElite: targetM.isElite
                  });

                  const splatterColor = targetM.char === 'r' ? '#22c55e' : (targetM.char === 'S' || targetM.name.toLowerCase().includes('skeleton') ? '#38bdf8' : '#dc2626');
                  nextSplatters.push({
                    id: `spl_g_kill_${Date.now()}_${Math.random()}`,
                    x: targetM.x,
                    y: targetM.y,
                    intensity: 3,
                    color: splatterColor
                  });
                } else {
                  nextEnemies[targetIdx] = { ...targetM, hp: nextHp };

                  const splatterColor = targetM.char === 'r' ? '#22c55e' : (targetM.char === 'S' || targetM.name.toLowerCase().includes('skeleton') ? '#38bdf8' : '#dc2626');
                  nextSplatters.push({
                    id: `spl_g_hit_${Date.now()}_${Math.random()}`,
                    x: targetM.x,
                    y: targetM.y,
                    intensity: 1,
                    color: splatterColor
                  });
                }
              }
            } else {
              // Out of range! Move closer to the target
              const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
              obstacles.push({ x: px, y: py }); // player is an obstacle for guards

              const nextStep = getNextStepTowards(enemy.x, enemy.y, closestMonster.x, closestMonster.y, prev.map, true, obstacles);
              if (nextStep) {
                // If the next step is exactly on the monster, attack (melee fallback)!
                if (nextStep.x === closestMonster.x && nextStep.y === closestMonster.y) {
                  const targetIdx = nextEnemies.findIndex(m => m.id === closestMonster!.id);
                  if (targetIdx !== -1) {
                    const targetM = nextEnemies[targetIdx];
                    const dmg = Math.max(1, enemy.atk - targetM.def);
                    const nextHp = targetM.hp - dmg;

                    staticLogs.push(`🛡️ ${enemy.name} strikes ${targetM.name} for ${dmg} damage!`);

                    const ev = new CustomEvent('spawn-game-effect', {
                      detail: { x: targetM.x, y: targetM.y, text: `-${dmg} HP`, type: 'dmg' },
                    });
                    window.dispatchEvent(ev);

                    if (nextHp <= 0) {
                      nextEnemies.splice(targetIdx, 1);
                      if (targetIdx < i) i--;
                      staticLogs.push(`💀 ${targetM.name} was slain by the brave ${enemy.name}!`);

                      nextCorpses.push({
                        id: `corpse_g_${Date.now()}_${Math.random()}`,
                        x: targetM.x,
                        y: targetM.y,
                        char: targetM.char,
                        name: targetM.name,
                        color: targetM.color,
                        type: targetM.isAnimal ? 'animal' : 'enemy',
                        isElite: targetM.isElite
                      });

                      const splatterColor = targetM.char === 'r' ? '#22c55e' : (targetM.char === 'S' || targetM.name.toLowerCase().includes('skeleton') ? '#38bdf8' : '#dc2626');
                      nextSplatters.push({
                        id: `spl_g_kill_${Date.now()}_${Math.random()}`,
                        x: targetM.x,
                        y: targetM.y,
                        intensity: 3,
                        color: splatterColor
                      });
                    } else {
                      nextEnemies[targetIdx] = { ...targetM, hp: nextHp };

                      const splatterColor = targetM.char === 'r' ? '#22c55e' : (targetM.char === 'S' || targetM.name.toLowerCase().includes('skeleton') ? '#38bdf8' : '#dc2626');
                      nextSplatters.push({
                        id: `spl_g_hit_${Date.now()}_${Math.random()}`,
                        x: targetM.x,
                        y: targetM.y,
                        intensity: 1,
                        color: splatterColor
                      });
                    }
                  }
                } else {
                  nextEnemies[i] = { ...enemy, x: nextStep.x, y: nextStep.y };
                }
              }
            }
          } else {
            // Guards patrol their designated checkpoint route during peaceful standby
            const pPath = enemy.patrolPath || [];
            if (pPath.length > 0) {
              let pIndex = enemy.patrolIndex || 0;
              let checkpoint = pPath[pIndex];
              const distToCheckpoint = Math.abs(enemy.x - checkpoint.x) + Math.abs(enemy.y - checkpoint.y);

              if (distToCheckpoint === 0) {
                pIndex = (pIndex + 1) % pPath.length;
                checkpoint = pPath[pIndex];
              }

              const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
              obstacles.push({ x: px, y: py });
              const nextStep = getNextStepTowards(enemy.x, enemy.y, checkpoint.x, checkpoint.y, prev.map, true, obstacles);
              if (nextStep) {
                nextEnemies[i] = { ...enemy, x: nextStep.x, y: nextStep.y, patrolIndex: pIndex };
              }
            }
          }
          continue;
        }

        // 2a. Freed Captive Turn Resolution
        if (enemy.isCaptive && enemy.isFreed) {
          // Freed captives search for the closest actual monster (not a follower, not a guard, not animal, not other captive)
          const monsters = nextEnemies.filter(item => !item.isFollower && !item.isTownGuard && !item.isAnimal && !item.isCaptive);
          let closestMonster: Enemy | null = null;
          let closestDist = 999;
          
          monsters.forEach(m => {
             const d = Math.abs(enemy.x - m.x) + Math.abs(enemy.y - m.y);
             if (d < closestDist) {
               closestDist = d;
               closestMonster = m;
             }
          });

          let currentHp = enemy.hp;
          const updatedEnemy = { ...enemy, hp: currentHp };

          if (closestMonster && closestDist <= 10) {
            const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
            obstacles.push({ x: px, y: py }); // avoid player
            
            const nextStep = getNextStepTowards(updatedEnemy.x, updatedEnemy.y, closestMonster.x, closestMonster.y, prev.map, true, obstacles);
            if (nextStep) {
              if (nextStep.x === closestMonster.x && nextStep.y === closestMonster.y) {
                const targetIdx = nextEnemies.findIndex(h => h.id === closestMonster!.id);
                if (targetIdx !== -1) {
                  const targetM = nextEnemies[targetIdx];
                  const dmg = Math.max(1, updatedEnemy.atk - targetM.def);
                  const nextHp = targetM.hp - dmg;
                  
                  staticLogs.push(`⚔️ Freed Captive ${updatedEnemy.name} attacks ${targetM.name} for ${dmg} damage!`);
                  
                  const ev = new CustomEvent('spawn-game-effect', {
                    detail: { x: targetM.x, y: targetM.y, text: `-${dmg} HP`, type: 'dmg' },
                  });
                  window.dispatchEvent(ev);
                  
                  if (nextHp <= 0) {
                     nextEnemies.splice(targetIdx, 1);
                     if (targetIdx < i) i--;
                     staticLogs.push(`💀 ${targetM.name} was defeated by Freed Captive ${updatedEnemy.name}!`);
  
                     nextCorpses.push({
                       id: `corpse_c_${Date.now()}_${Math.random()}`,
                       x: targetM.x,
                       y: targetM.y,
                       char: targetM.char,
                       name: targetM.name,
                       color: targetM.color,
                       type: targetM.isAnimal ? 'animal' : 'enemy',
                       isElite: targetM.isElite
                     });
  
                     const splatterColor = targetM.char === 'r' ? '#22c55e' : (targetM.char === 'S' || targetM.name.toLowerCase().includes('skeleton') ? '#38bdf8' : '#dc2626');
                     nextSplatters.push({
                       id: `spl_c_kill_${Date.now()}_${Math.random()}`,
                       x: targetM.x,
                       y: targetM.y,
                       intensity: 3,
                       color: splatterColor
                     });
                  } else {
                     nextEnemies[targetIdx] = { ...targetM, hp: nextHp };
  
                     const splatterColor = targetM.char === 'r' ? '#22c55e' : (targetM.char === 'S' || targetM.name.toLowerCase().includes('skeleton') ? '#38bdf8' : '#dc2626');
                     nextSplatters.push({
                       id: `spl_c_hit_${Date.now()}_${Math.random()}`,
                       x: targetM.x,
                       y: targetM.y,
                       intensity: 1,
                       color: splatterColor
                     });
                  }
                }
              } else {
                nextEnemies[i] = { ...updatedEnemy, x: nextStep.x, y: nextStep.y };
              }
            }
          } else {
            // No monsters nearby, just wander randomly
            if (Math.random() < 0.45) {
              const dirs = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
              ];
              const validDirs = dirs.filter(d => {
                const nx = enemy.x + d.dx;
                const ny = enemy.y + d.dy;
                if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
                  const t = prev.map[ny][nx];
                  const blocked = t === TileType.Wall || t === TileType.Window || t === TileType.Tree || t === TileType.PineTree || t === TileType.BirchTree || t === TileType.CopperVein || t === TileType.IronVein || t === TileType.Water || t === TileType.Table || t === TileType.Campfire || t === TileType.Anvil;
                  return !blocked && !(nx === px && ny === py);
                }
                return false;
              });
              if (validDirs.length > 0) {
                const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
                nextEnemies[i] = { ...updatedEnemy, x: enemy.x + dir.dx, y: enemy.y + dir.dy };
              }
            }
          }
          continue;
        }

        // 2. Follower Turn Resolution
        if (enemy.isFollower) {
          const hostiles = nextEnemies.filter(item => {
            if (item.isFollower) return false;

            // If this follower has an active faction, check if the item belongs to an opposing faction
            const enemyFaction = enemy.faction || 'neutral';
            const itemFaction = item.faction || 'neutral';
            
            if (enemyFaction !== 'neutral') {
              if (enemyFaction === 'vanguard') {
                return itemFaction === 'syndicate' || itemFaction === 'bandits' || item.id?.startsWith('siege_attacker_') || item.id?.startsWith('siege_defender_');
              } else if (enemyFaction === 'syndicate') {
                return itemFaction === 'vanguard' || itemFaction === 'bandits' || item.isTownGuard || item.id?.startsWith('siege_attacker_') || item.id?.startsWith('siege_defender_');
              } else if (enemyFaction === 'bandits') {
                return itemFaction === 'vanguard' || itemFaction === 'syndicate' || item.isTownGuard || item.id?.startsWith('siege_attacker_') || item.id?.startsWith('siege_defender_');
              }
            }

            // Never attack caravan allies, caravan defenders, or any Allied entities
            const isAlliedCaravan = item.id?.startsWith('caravan_ally_') || 
                                    item.id?.startsWith('caravan_guard_') || 
                                    item.name?.toLowerCase().includes('[allied]') || 
                                    item.name?.toLowerCase().includes('allied') || 
                                    item.name?.toLowerCase().includes('defender');
            if (isAlliedCaravan) return false;

            // If player has a faction, standard companions should target members of opposing factions if player is hostile
            if (prev.faction) {
              const rep = prev.factionReputation?.[itemFaction] !== undefined ? prev.factionReputation[itemFaction] : 0;
              const isOpposingFaction = (prev.faction === 'vanguard' && (itemFaction === 'syndicate' || itemFaction === 'bandits')) ||
                                        (prev.faction === 'syndicate' && (itemFaction === 'vanguard' || itemFaction === 'bandits')) ||
                                        (prev.faction === 'bandits' && (itemFaction === 'vanguard' || itemFaction === 'syndicate'));
              if (isOpposingFaction || rep < -30) {
                return true;
              }
            }

            // Never attack town guards unless the player has provoked them (areGuardsHostile is true)
            if (item.isTownGuard || item.id?.includes('guard') || item.name?.toLowerCase().includes('guard')) {
              return !!prev.areGuardsHostile;
            }

            // Otherwise, it is a standard monster/hostile, so attack!
            return true;
          });
          let closestHostile: Enemy | null = null;
          let closestDist = 999;
          
          hostiles.forEach(h => {
             const d = Math.abs(enemy.x - h.x) + Math.abs(enemy.y - h.y);
             if (d < closestDist) {
               closestDist = d;
               closestHostile = h;
             }
          });
          
          const folId = enemy.followerId;
          const folState = prev.followers.find(f => f.id === folId);
          const isWaitingStance = folState?.mode === 'wait';
          const isCat = folState?.archetypeId === 'cat';

          let currentHp = enemy.hp;
          if (isCat && currentHp < enemy.maxHp) {
            currentHp = Math.min(enemy.maxHp, currentHp + 2);
            if (currentHp > enemy.hp) {
              const healEv = new CustomEvent('spawn-game-effect', {
                detail: { x: enemy.x, y: enemy.y, text: `❤ +2 HP`, type: 'heal' },
              });
              window.dispatchEvent(healEv);
              staticLogs.push(`🐈 ${enemy.name} licks its fur and regenerates 2 HP.`);
            }
          }

          const isHurt = currentHp < enemy.maxHp;
          if (isCat && isHurt) {
            let nextStep = null;
            if (closestHostile && closestDist <= 8) {
              const dirs = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
              ];
              const height = prev.map.length;
              const width = prev.map[0].length;
              let bestStep = null;
              let bestDist = -1;
              const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
              obstacles.push({ x: px, y: py }); // avoid player
              
              for (const d of dirs) {
                const nx = enemy.x + d.dx;
                const ny = enemy.y + d.dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const tile = prev.map[ny][nx];
                  const isBlocked =
                    tile === TileType.Wall ||
                    tile === TileType.Window ||
                    tile === TileType.Table ||
                    tile === TileType.Tree ||
                    tile === TileType.PineTree ||
                    tile === TileType.BirchTree ||
                    tile === TileType.CopperVein ||
                    tile === TileType.IronVein ||
                    tile === TileType.Water ||
                    tile === TileType.Campfire ||
                    tile === TileType.Anvil ||
                    tile === TileType.Bed ||
                    tile === TileType.Empty;
                  if (isBlocked) continue;
                  if (obstacles.some(o => o.x === nx && o.y === ny)) continue;
                  
                  const moveDist = Math.abs(nx - closestHostile.x) + Math.abs(ny - closestHostile.y);
                  if (moveDist > bestDist) {
                    bestDist = moveDist;
                    bestStep = { x: nx, y: ny };
                  }
                }
              }
              nextStep = bestStep;
            }
            
            if (nextStep) {
              nextEnemies[i] = { ...enemy, hp: currentHp, x: nextStep.x, y: nextStep.y };
              if (Math.random() < 0.2) {
                staticLogs.push(`🐈 ${enemy.name} is hurt and scurries away in fear!`);
              }
            } else {
              if (dist > 1) {
                const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
                const pStep = getNextStepTowards(enemy.x, enemy.y, px, py, prev.map, true, obstacles);
                if (pStep && (pStep.x !== px || pStep.y !== py)) {
                  nextEnemies[i] = { ...enemy, hp: currentHp, x: pStep.x, y: pStep.y };
                } else {
                  nextEnemies[i] = { ...enemy, hp: currentHp };
                }
              } else {
                nextEnemies[i] = { ...enemy, hp: currentHp };
              }
            }
            continue;
          }

          const updatedEnemy = { ...enemy, hp: currentHp };
          const isWatchtowerAlly = enemy.id?.startsWith('wt_ally_');
          const isTooFarFromPlayer = !isWatchtowerAlly && dist > 3;
          let shouldChaseHostile = closestHostile && closestDist <= 10 && !isWaitingStance;
          if (shouldChaseHostile && isTooFarFromPlayer) {
            // If the follower is too far from the player (dist > 3), they shouldn't pursue distant targets.
            // They will only engage if the hostile is very close to them (closestDist <= 2).
            // Otherwise, they'll return/linger near the player.
            if (closestDist > 2) {
              shouldChaseHostile = false;
            }
          }

          if (shouldChaseHostile) {
            const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
            obstacles.push({ x: px, y: py });
            
            const nextStep = getNextStepTowards(updatedEnemy.x, updatedEnemy.y, closestHostile.x, closestHostile.y, prev.map, true, obstacles);
            if (nextStep) {
              if (nextStep.x === closestHostile.x && nextStep.y === closestHostile.y) {
                const targetIdx = nextEnemies.findIndex(h => h.id === closestHostile!.id);
                if (targetIdx !== -1) {
                  const targetH = nextEnemies[targetIdx];
                  const dmg = Math.max(1, updatedEnemy.atk - targetH.def);
                  const nextHp = targetH.hp - dmg;
                  
                  staticLogs.push(`⚔️ Companion ${updatedEnemy.name} strikes ${targetH.name} for ${dmg} damage!`);
                  
                  const ev = new CustomEvent('spawn-game-effect', {
                    detail: { x: targetH.x, y: targetH.y, text: `-${dmg} HP`, type: 'dmg' },
                  });
                  window.dispatchEvent(ev);
                  
                  if (nextHp <= 0) {
                     nextEnemies.splice(targetIdx, 1);
                     if (targetIdx < i) i--;
                     staticLogs.push(`💀 ${targetH.name} was defeated by Companion ${updatedEnemy.name}!`);
 
                     // Spawn physical corpse and death splatter
                     nextCorpses.push({
                       id: `corpse_f_${Date.now()}_${Math.random()}`,
                       x: targetH.x,
                       y: targetH.y,
                       char: targetH.char,
                       name: targetH.name,
                       color: targetH.color,
                       type: targetH.isAnimal ? 'animal' : 'enemy',
                       isElite: targetH.isElite
                     });
 
                     const splatterColor = targetH.char === 'r' ? '#22c55e' : (targetH.char === 'S' || targetH.name.toLowerCase().includes('skeleton') ? '#38bdf8' : '#dc2626');
                     nextSplatters.push({
                       id: `spl_f_kill_${Date.now()}_${Math.random()}`,
                       x: targetH.x,
                       y: targetH.y,
                       intensity: 3,
                       color: splatterColor
                     });
                  } else {
                     nextEnemies[targetIdx] = { ...targetH, hp: nextHp };
 
                     const splatterColor = targetH.char === 'r' ? '#22c55e' : (targetH.char === 'S' || targetH.name.toLowerCase().includes('skeleton') ? '#38bdf8' : '#dc2626');
                     nextSplatters.push({
                       id: `spl_f_hit_${Date.now()}_${Math.random()}`,
                       x: targetH.x,
                       y: targetH.y,
                       intensity: 1,
                       color: splatterColor
                     });
                  }
                }
              } else {
                nextEnemies[i] = { ...updatedEnemy, x: nextStep.x, y: nextStep.y };
              }
            }
          } else {
            if (!isWaitingStance && dist > 1) {
              const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
              const nextStep = getNextStepTowards(updatedEnemy.x, updatedEnemy.y, px, py, prev.map, true, obstacles);
              if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
                nextEnemies[i] = { ...updatedEnemy, x: nextStep.x, y: nextStep.y };
              }
            }
          }
          continue;
        }

        // 3. Behavioral decision tree
        const inLoS = !!(prev.visible?.[ey]?.[ex]); // Can player see monster (and vice versa)

        let nextState = enemy.state;
        const lowercaseNameForWildlife = enemy.name.toLowerCase();
        const isWildlife = lowercaseNameForWildlife.includes("deer") || lowercaseNameForWildlife.includes("boar") || lowercaseNameForWildlife.includes("goat") || enemy.type === EnemyType.WildlifeDeer || enemy.type === EnemyType.WildlifeBoar || enemy.type === EnemyType.WildlifeGoat;
        const isLootGoblin = enemy.type === EnemyType.LootGoblin || lowercaseNameForWildlife.includes("loot goblin");

        // Faction reputation override: if guard is faction-aligned, and reputation >= -30, and alarm is not active, they remain passive/patrolling.
        let isFactionNeutral = false;
        if (enemy.faction === 'syndicate' || enemy.faction === 'vanguard') {
          const factionRep = prev.factionReputation?.[enemy.faction] ?? 0;
          if (factionRep >= -30 && prev.activeEscapeAlarm !== enemy.faction) {
            isFactionNeutral = true;
          }
        } else if (enemy.faction === 'bandits') {
          const factionRep = prev.factionReputation?.[enemy.faction] ?? 0;
          if (prev.faction === 'bandits' && factionRep >= -30 && prev.activeEscapeAlarm !== enemy.faction) {
            isFactionNeutral = true;
          }
        }

        const lowercaseName = enemy.name.toLowerCase();
        const isWolf = lowercaseName.includes("wolf") || lowercaseName.includes("worg");
        const isWolfNeutralized = isWolf && hasEquippedTrait(prev, 'WORG_FORCE');

        if (isWildlife || isLootGoblin) {
          // Wildlife and Loot Goblin always retreat if player is within 8 tiles
          if (dist <= 8) {
            nextState = EnemyState.Retreating;
          } else {
            nextState = EnemyState.Patrolling;
          }
        } else if (isFactionNeutral || isWolfNeutralized) {
          // Neutral faction guards or domesticated wolves just patrol, they don't chase!
          nextState = EnemyState.Patrolling;
        } else if ((inLoS && dist <= 8) || dist <= 5) {
          nextState = EnemyState.Chasing;
        }

        // Low HP Fleeing / Retreating Check
        const isLowHp = currentHp <= enemy.maxHp * 0.12;
        const cannotCombatFlee = enemy.isFollower || enemy.isTownGuard || enemy.isAnimal;
        
        // Only cowardly types (rats, goblins, trapmasters) have a small chance to flee; skeletons, orcs, trolls, and bosses fight to the bitter end
        const isCowardlyType = lowercaseName.includes("rat") || lowercaseName.includes("goblin") || lowercaseName.includes("trapmaster");
        
        let isFleeingThisTurn = enemy.state === EnemyState.Retreating;
        if (isLowHp && !cannotCombatFlee && isCowardlyType && enemy.state !== EnemyState.Retreating) {
          // Only an 8% chance to panic and flee when down to near-death health
          if (Math.random() < 0.08) {
            isFleeingThisTurn = true;
            nextState = EnemyState.Retreating;
          }
        }

        // Handle Retreat movement and logs
        if (isFleeingThisTurn || nextState === EnemyState.Retreating) {
          nextState = EnemyState.Retreating; // persist state
          
          const wasRetreatingBefore = enemy.state === EnemyState.Retreating;
          if (!wasRetreatingBefore) {
            const quote = getEnemyFleeQuote(enemy.name, enemy.type);
            staticLogs.push(`🏃 ${enemy.name} panics and flees! ${quote}`);
            
            // Visual trigger effect
            const effectEv = new CustomEvent('spawn-game-effect', {
              detail: { x: ex, y: ey, text: "Flee!", type: 'heal' },
            });
            window.dispatchEvent(effectEv);
          } else if (Math.random() < 0.12) {
            // 12% chance to say something while running
            const quote = getEnemyFleeQuote(enemy.name, enemy.type);
            staticLogs.push(`🏃 ${enemy.name}: ${quote}`);
          }

          // Determine walkable rules
          const canOpen = enemy.type !== EnemyType.Rat; // smart monsters pass doors
          
          // Move away from player (maximize distance to (px, py))
          const dirs = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
          ];
          const height = prev.map.length;
          const width = prev.map[0].length;
          
          let bestStep: { x: number; y: number } | null = null;
          let bestDist = -1;
          const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));

          for (const d of dirs) {
            const nx = ex + d.dx;
            const ny = ey + d.dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const tile = prev.map[ny][nx];
              const isTileBlocked =
                tile === TileType.Wall ||
                tile === TileType.Window ||
                tile === TileType.Table ||
                tile === TileType.Tree ||
                tile === TileType.PineTree ||
                tile === TileType.BirchTree ||
                tile === TileType.CopperVein ||
                tile === TileType.IronVein ||
                tile === TileType.Water ||
                tile === TileType.Campfire ||
                tile === TileType.Anvil ||
                tile === TileType.Bed ||
                tile === TileType.Empty ||
                (tile === TileType.Door && !canOpen);
              
              if (isTileBlocked) continue;
              if (obstacles.some((e) => e.x === nx && e.y === ny)) continue;
              if (nx === px && ny === py) continue; // don't run INTO the player!

              const moveDist = Math.abs(nx - px) + Math.abs(ny - py);
              if (moveDist > bestDist) {
                bestDist = moveDist;
                bestStep = { x: nx, y: ny };
              }
            }
          }

          if (bestStep) {
            ex = bestStep.x;
            ey = bestStep.y;
          }

          // Update state and position in game world, then skip and let them move
          nextEnemies[i] = {
            ...enemy,
            x: ex,
            y: ey,
            state: EnemyState.Retreating,
            hp: currentHp
          };
          continue; // Consumes the turn, prevents them from attacking
        }

        // Determine walkable rules
        const canOpen = enemy.type !== EnemyType.Rat; // smart monsters pass doors

        if (nextState === EnemyState.Chasing) {
          // Mage / Spell caster retreat behavioral loop
          const isSpellcaster = enemy.type === EnemyType.SkeletonMage || enemy.type === EnemyType.Trapmaster || enemy.type === EnemyType.Necromancer || enemy.type === EnemyType.Ghost || enemy.type === EnemyType.Dragon || enemy.type === EnemyType.Nakki || enemy.type === EnemyType.Louhi;
          
          if (isSpellcaster && dist <= enemy.range && inLoS) {
            // Apply scale threat multiplier
            const finalSpAtk = Math.max(1, Math.floor(enemy.atk * threatCoeff));
            
            // Calculate effective armor defense (broken = 0 defense contribution)
            let brokenDefAdjustment = 0;
            if (nextArmor && nextArmor.durability !== undefined && nextArmor.durability <= 0) brokenDefAdjustment += nextArmor.defense;
            if (nextHelmet && nextHelmet.durability !== undefined && nextHelmet.durability <= 0) brokenDefAdjustment += nextHelmet.defense;
            if (nextGloves && nextGloves.durability !== undefined && nextGloves.durability <= 0) brokenDefAdjustment += nextGloves.defense;
            if (nextBoots && nextBoots.durability !== undefined && nextBoots.durability <= 0) brokenDefAdjustment += nextBoots.defense;
            if (nextShield && nextShield.durability !== undefined && nextShield.durability <= 0) brokenDefAdjustment += nextShield.defense;
            const factionDefBonus = (prev.factionTerritories?.['sunplate_ridge']?.controller === prev.faction) ? 2 : 0;
            const activeCombatDef = Math.max(0, updatedStats.def - brokenDefAdjustment + (prev.activeFoodBuff?.defBonus || 0) + factionDefBonus);

            let spellDmg = Math.max(1, finalSpAtk - activeCombatDef);
            
            // Apply Sandbox Enemy Damage Multiplier and God Mode invuln
            const enemyDmgMult = (window as any).arenaEnemyDamageMultiplier !== undefined ? (window as any).arenaEnemyDamageMultiplier : 1.0;
            const godModeInvuln = (window as any).arenaGodModeActive || false;
            spellDmg = godModeInvuln ? 0 : Math.round(spellDmg * enemyDmgMult);

            if (prev.isBraced) {
              spellDmg = Math.max(1, Math.floor(spellDmg / 2));
              staticLogs.push(`🛡️ Braced! Magic spell damage halved to ${spellDmg}.`);
            }
            playerHp -= spellDmg;
            
            if (enemy.type === EnemyType.Dragon) {
              staticLogs.push(`🔥 ${enemy.name} breathes a torrent of liquid fire at you for ${spellDmg} fire damage!`);
            } else {
              staticLogs.push(`🪄 ${enemy.name} projects magic sphere at you for ${spellDmg} damage!`);
            }

            // Evaluate battle-scar acquisition
            const scarResult = evaluateScarAcquisition(spellDmg, playerHp, updatedStats.maxHp, activeScars, updatedStats.turnsPlayed);
            if (scarResult) {
              activeScars.push(scarResult.scar);
              staticLogs.push(scarResult.logText);
              
              setTimeout(() => {
                playSound('trap');
              }, 40);

              const evSc = new CustomEvent('spawn-game-effect', {
                detail: { x: px, y: py, text: `🤕 SCARRED!`, type: 'heal' },
              });
              window.dispatchEvent(evSc);
            }

            // Spawn cyan / magic colored blood splatter under player coordinates
            nextSplatters.push({
              id: `spl_player_magic_${Date.now()}_${Math.random()}`,
              x: px,
              y: py,
              intensity: 1,
              color: '#38bdf8'
            });
            
            // Randomly decay some equipped armor durability
            const decaySlots = [];
            if (nextArmor && (nextArmor.durability ?? 100) > 0) decaySlots.push('armor');
            if (nextHelmet && (nextHelmet.durability ?? 100) > 0) decaySlots.push('helmet');
            if (nextGloves && (nextGloves.durability ?? 100) > 0) decaySlots.push('gloves');
            if (nextBoots && (nextBoots.durability ?? 100) > 0) decaySlots.push('boots');
            if (nextShield && (nextShield.durability ?? 100) > 0) decaySlots.push('shield');

            if (decaySlots.length > 0) {
              const pickedSlot = decaySlots[Math.floor(Math.random() * decaySlots.length)];
              const baseAmount = Math.random() > 0.5 ? 2 : 1;
              if (pickedSlot === 'armor' && nextArmor) {
                const oldD = nextArmor.durability ?? 100;
                const decayAmt = getItemDurabilityDecay(nextArmor, baseAmount);
                const nextD = Math.max(0, oldD - decayAmt);
                nextArmor = { ...nextArmor, durability: nextD };
                if (nextD === 0 && oldD > 0) {
                  staticLogs.push(`⚠️ WARNING: Your body armor [${nextArmor.name}] has broken!`);
                }
              } else if (pickedSlot === 'helmet' && nextHelmet) {
                const oldD = nextHelmet.durability ?? 100;
                const decayAmt = getItemDurabilityDecay(nextHelmet, baseAmount);
                const nextD = Math.max(0, oldD - decayAmt);
                nextHelmet = { ...nextHelmet, durability: nextD };
                if (nextD === 0 && oldD > 0) {
                  staticLogs.push(`⚠️ WARNING: Your helmet [${nextHelmet.name}] has broken!`);
                }
              } else if (pickedSlot === 'gloves' && nextGloves) {
                const oldD = nextGloves.durability ?? 100;
                const decayAmt = getItemDurabilityDecay(nextGloves, baseAmount);
                const nextD = Math.max(0, oldD - decayAmt);
                nextGloves = { ...nextGloves, durability: nextD };
                if (nextD === 0 && oldD > 0) {
                  staticLogs.push(`⚠️ WARNING: Your gloves [${nextGloves.name}] have broken!`);
                }
              } else if (pickedSlot === 'boots' && nextBoots) {
                const oldD = nextBoots.durability ?? 100;
                const decayAmt = getItemDurabilityDecay(nextBoots, baseAmount);
                const nextD = Math.max(0, oldD - decayAmt);
                nextBoots = { ...nextBoots, durability: nextD };
                if (nextD === 0 && oldD > 0) {
                  staticLogs.push(`⚠️ WARNING: Your boots [${nextBoots.name}] have broken!`);
                }
              } else if (pickedSlot === 'shield' && nextShield) {
                const oldD = nextShield.durability ?? 100;
                const decayAmt = getItemDurabilityDecay(nextShield, baseAmount);
                const nextD = Math.max(0, oldD - decayAmt);
                nextShield = { ...nextShield, durability: nextD };
                if (nextD === 0 && oldD > 0) {
                  staticLogs.push(`⚠️ WARNING: Your shield [${nextShield.name}] has broken!`);
                }
              }
            }
            
            const pType = enemy.type === EnemyType.SkeletonMage 
              ? 'skeleton_bolt' 
              : enemy.type === EnemyType.Necromancer 
                ? 'shadow_orb' 
                : enemy.type === EnemyType.Ghost 
                  ? 'ghostly_echo' 
                  : enemy.type === EnemyType.Dragon
                    ? 'dragon_fire'
                    : enemy.type === EnemyType.Nakki
                      ? 'water_blast'
                      : enemy.type === EnemyType.Louhi
                        ? 'frost_storm'
                        : 'enemy_spell';
            const projColor = enemy.type === EnemyType.SkeletonMage 
              ? '#38bdf8' 
              : enemy.type === EnemyType.Necromancer 
                ? '#a855f7' 
                : enemy.type === EnemyType.Ghost 
                  ? '#6366f1' 
                  : enemy.type === EnemyType.Dragon
                    ? '#f97316'
                    : enemy.type === EnemyType.Nakki
                      ? '#06b6d4'
                      : enemy.type === EnemyType.Louhi
                        ? '#cbd5e1'
                        : '#ec4899';
            const projEvent = new CustomEvent('spawn-projectile', {
              detail: {
                startX: enemy.x,
                startY: enemy.y,
                targetX: px,
                targetY: py,
                color: projColor,
                projectileType: pType,
                impactText: `-${spellDmg} ${enemy.type === EnemyType.Dragon ? 'Fire' : 'Magic'}`,
                impactType: 'dmg'
              }
            });
            window.dispatchEvent(projEvent);

            // If player is adjacent (1 tile), mage flees in opposite direction
            if (dist === 1) {
              const dx = Math.sign(ex - px);
              const dy = Math.sign(ey - py);
              const escapeX = ex + dx;
              const escapeY = ey + dy;

              if (
                escapeX >= 0 && escapeX < LEVEL_WIDTH &&
                escapeY >= 0 && escapeY < LEVEL_HEIGHT &&
                (prev.map[escapeY][escapeX] === TileType.Floor || prev.map[escapeY][escapeX] === TileType.Grass || prev.map[escapeY][escapeX] === TileType.Path)
              ) {
                ex = escapeX;
                ey = escapeY;
              }
            }
          } else {
            // Melee Chaser pathfind: select combat target (either player or nearest companion follower)
            let txVal = px;
            let tyVal = py;
            let targetIsFollower = false;
            let targetedFollowActor: any = null;

            const companionActors = nextEnemies.filter(actor => actor.isFollower || (actor.isCaptive && actor.isFreed));
            if (companionActors.length > 0) {
              let closestFol: any = null;
              let closestFolDist = Infinity;
              for (const folActor of companionActors) {
                const fD = Math.abs(ex - folActor.x) + Math.abs(ey - folActor.y);
                if (fD < closestFolDist) {
                  closestFolDist = fD;
                  closestFol = folActor;
                }
              }
              // If companion is close (distance <= 2 tiles), 50% chance to target the companion!
              if (closestFol && closestFolDist <= 2 && Math.random() > 0.45) {
                txVal = closestFol.x;
                tyVal = closestFol.y;
                targetIsFollower = true;
                targetedFollowActor = closestFol;
              }
            }

            const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
            const nextStep = getNextStepTowards(ex, ey, txVal, tyVal, prev.map, canOpen, obstacles);

            if (nextStep) {
              if (nextStep.x === txVal && nextStep.y === tyVal) {
                if (targetIsFollower && targetedFollowActor) {
                  // Strike friendly companion follower or freed captive!
                  const finalApAtk = Math.max(1, Math.floor(enemy.atk * threatCoeff));
                  const carryDmg = Math.max(1, finalApAtk - 2); // defense of 2
                  
                  const folIdx = nextEnemies.findIndex(actor => actor.id === targetedFollowActor.id);
                  if (folIdx !== -1) {
                    const targetActor = nextEnemies[folIdx];
                    const nextHp = Math.max(0, targetActor.hp - carryDmg);
                    
                    if (targetActor.isCaptive && nextHp <= 0) {
                      nextEnemies.splice(folIdx, 1);
                      if (folIdx < i) i--;
                      staticLogs.push(`🪦 Freed Captive ${targetActor.name} was slain by ${enemy.name}!`);
                      
                      nextCorpses.push({
                        id: `corpse_c_dead_${Date.now()}_${Math.random()}`,
                        x: txVal,
                        y: tyVal,
                        char: '💀',
                        name: targetActor.name,
                        color: '#94a3b8',
                        type: 'enemy',
                        isElite: false
                      });
                      nextSplatters.push({
                        id: `spl_c_slain_${Date.now()}_${Math.random()}`,
                        x: txVal,
                        y: tyVal,
                        intensity: 3,
                        color: '#dc2626'
                      });
                    } else {
                      nextEnemies[folIdx] = { ...targetActor, hp: nextHp };
                      const label = targetActor.isCaptive ? `Freed Captive ${targetActor.name}` : `your companion ${targetActor.name}`;
                      staticLogs.push(`⚔️ ${enemy.name} strikes ${label} for ${carryDmg} damage!`);
                    }

                    // Spawn physical impact splatter under allied companion target
                    nextSplatters.push({
                      id: `spl_companion_dmg_${Date.now()}_${Math.random()}`,
                      x: txVal,
                      y: tyVal,
                      intensity: 2,
                      color: '#dc2626'
                    });
                    
                    const ev = new CustomEvent('spawn-game-effect', {
                      detail: { x: txVal, y: tyVal, text: `-${carryDmg} HP`, type: 'dmg' },
                    });
                    window.dispatchEvent(ev);
                  }
                } else {
                  // Strike Player ! Apply scaled damage factor if playing for longer hours
                  const enemyIsLootGoblin = enemy.type === EnemyType.LootGoblin || enemy.name.toLowerCase().includes('loot goblin');
                  if (enemyIsLootGoblin) {
                    // Loot Goblin does not attack!
                    staticLogs.push(`🧚 The Alchemical Loot Goblin squeals and tries to find a path away from you!`);
                  } else {
                    // Roll player dodge check
                    const playerExhaustion = updatedStats.exhaustion || 0;
                    const baseDodge = Math.min(0.35, (updatedStats.dex || 10) * 0.015);
                    const exhaustionPenalty = (playerExhaustion / 100) * 0.15;
                    let lunarDodgeBonus = 0;
                    if (isLunarBlessingActive(prev, 'new_moon')) lunarDodgeBonus = 0.15;
                    else if (isLunarBlessingActive(prev, 'waxing_crescent')) lunarDodgeBonus = 0.10;
                    const finalDodgeChance = Math.max(0.02, baseDodge - exhaustionPenalty + lunarDodgeBonus);
                    const isDodged = Math.random() < finalDodgeChance;

                    if (isDodged) {
                      staticLogs.push(`💨 Dodged! You nimbly evade ${enemy.name}'s strike! (Dodge Chance: ${Math.round(finalDodgeChance * 100)}%)`);
                      const evadeEv = new CustomEvent('spawn-game-effect', {
                        detail: { x: px, y: py, text: `💨 EVADED`, type: 'heal' },
                      });
                      window.dispatchEvent(evadeEv);
                    } else {
                      const finalApAtk = Math.max(1, Math.floor(enemy.atk * threatCoeff));
                      
                      // Calculate effective armor defense (broken = 0 defense contribution)
                      let brokenDefAdjustment = 0;
                      if (nextArmor && nextArmor.durability !== undefined && nextArmor.durability <= 0) brokenDefAdjustment += nextArmor.defense;
                      if (nextHelmet && nextHelmet.durability !== undefined && nextHelmet.durability <= 0) brokenDefAdjustment += nextHelmet.defense;
                      if (nextGloves && nextGloves.durability !== undefined && nextGloves.durability <= 0) brokenDefAdjustment += nextGloves.defense;
                      if (nextBoots && nextBoots.durability !== undefined && nextBoots.durability <= 0) brokenDefAdjustment += nextBoots.defense;
                      if (nextShield && nextShield.durability !== undefined && nextShield.durability <= 0) brokenDefAdjustment += nextShield.defense;
                      const factionDefBonus = (prev.factionTerritories?.['sunplate_ridge']?.controller === prev.faction) ? 2 : 0;
                      
                      const relicDefBonus = updatedStats.relics?.includes('mirror_shield_relic') ? 3 : 0;
                      const activeCombatDef = Math.max(0, updatedStats.def + relicDefBonus - brokenDefAdjustment + (prev.activeFoodBuff?.defBonus || 0) + factionDefBonus);

                      let strikeDmg = Math.max(1, finalApAtk - activeCombatDef);

                      // Apply Blood Moon scaling
                      const isBloodMoon = prev.bloodMoonTurnsLeft !== undefined && prev.bloodMoonTurnsLeft > 0;
                      if (isBloodMoon) {
                        strikeDmg = Math.round(strikeDmg * 1.25);
                      }

                      // Apply Sandbox Enemy Damage Multiplier and God Mode invuln
                      const enemyDmgMult = (window as any).arenaEnemyDamageMultiplier !== undefined ? (window as any).arenaEnemyDamageMultiplier : 1.0;
                      const godModeInvuln = (window as any).arenaGodModeActive || false;
                      strikeDmg = godModeInvuln ? 0 : Math.round(strikeDmg * enemyDmgMult);

                      // Challenge Mechanic: Overburdened capacity increases damage taken
                      const currentWeight = getCurrentWeight(prev);
                      const maxWeight = getMaxWeight(prev);
                      if (currentWeight > maxWeight && !godModeInvuln) {
                        const extraWeightMultiplier = 1.0 + Math.min(1.0, (currentWeight - maxWeight) / maxWeight);
                        const baseStrike = strikeDmg;
                        strikeDmg = Math.round(strikeDmg * extraWeightMultiplier);
                        const bonusDmg = strikeDmg - baseStrike;
                        if (bonusDmg > 0) {
                          staticLogs.push(`⚠️ OVERBURDENED: Your bag's physical bulk makes you slow. Staggering weight yields +${bonusDmg} extra heavy damage!`);
                          const stunEv = new CustomEvent('spawn-game-effect', {
                            detail: { x: px, y: py, text: `💦 CLUMSY`, type: 'dmg' },
                          });
                          window.dispatchEvent(stunEv);
                        }
                      }

                      if (prev.isBraced) {
                        strikeDmg = Math.max(1, Math.floor(strikeDmg / 2));
                        staticLogs.push(`🛡️ Braced! Physical strike damage halved to ${strikeDmg}.`);
                      }
                      
                      playerHp -= strikeDmg;

                      // Mirror Shield damage reflection
                      if (updatedStats.relics?.includes('mirror_shield_relic') && Math.random() < 0.20 && strikeDmg > 0) {
                        const reflectionDamage = Math.max(1, Math.floor(strikeDmg * 0.50));
                        nextEnemies[i] = {
                          ...nextEnemies[i],
                          hp: Math.max(1, nextEnemies[i].hp - reflectionDamage)
                        };
                        staticLogs.push(`🛡️ [MIRROR SHIELD]: You reflected ${reflectionDamage} damage back to ${enemy.name}!`);
                        
                        const reflexEv = new CustomEvent('spawn-game-effect', {
                          detail: { x: enemy.x, y: enemy.y, text: `💥 REFLECT: -${reflectionDamage}`, type: 'dmg' },
                        });
                        window.dispatchEvent(reflexEv);
                      }

                      const isVampireType = enemy.type === EnemyType.Vampire || enemy.name.toLowerCase().includes('vampire');
                      if ((isBloodMoon || isVampireType) && strikeDmg > 0) {
                        const ratio = isVampireType ? 0.6 : 0.5;
                        const healedAmt = Math.min(enemy.maxHp - enemy.hp, Math.floor(strikeDmg * ratio));
                        if (healedAmt > 0) {
                          nextEnemies[i] = { ...nextEnemies[i], hp: nextEnemies[i].hp + healedAmt };
                          staticLogs.push(`🩸 [LIFESTEAL]: ${isVampireType ? 'Sovereign blood' : 'Blood Moon'} empowers ${enemy.name}, siphoning ${healedAmt} HP back!`);
                        }
                      }

                      staticLogs.push(`❌ ${enemy.name} strikes you for ${strikeDmg} damage!`);

                      // Evaluate battlefield scar trigger
                      const scarResult = evaluateScarAcquisition(strikeDmg, playerHp, updatedStats.maxHp, activeScars, updatedStats.turnsPlayed);
                      if (scarResult) {
                        activeScars.push(scarResult.scar);
                        staticLogs.push(scarResult.logText);
                        
                        setTimeout(() => {
                          playSound('trap');
                        }, 40);

                        const evSc = new CustomEvent('spawn-game-effect', {
                          detail: { x: px, y: py, text: `🤕 SCARRED!`, type: 'heal' },
                        });
                        window.dispatchEvent(evSc);
                      }

                      // Spawn physical crimson splatter on player hit
                      nextSplatters.push({
                        id: `spl_player_struck_${Date.now()}_${Math.random()}`,
                        x: px,
                        y: py,
                        intensity: 2,
                        color: '#dc2626'
                      });

                      const ev = new CustomEvent('spawn-game-effect', {
                        detail: { x: px, y: py, text: `-${strikeDmg} HP`, type: 'dmg' },
                      });
                      window.dispatchEvent(ev);

                      // sound
                      setTimeout(() => {
                        playSound('injury');
                      }, 10);
                    }
                  }
                }
                
                // Randomly decay some equipped armor durability
                const decaySlots = [];
                if (nextArmor && (nextArmor.durability ?? 100) > 0) decaySlots.push('armor');
                if (nextHelmet && (nextHelmet.durability ?? 100) > 0) decaySlots.push('helmet');
                if (nextGloves && (nextGloves.durability ?? 100) > 0) decaySlots.push('gloves');
                if (nextBoots && (nextBoots.durability ?? 100) > 0) decaySlots.push('boots');
                if (nextShield && (nextShield.durability ?? 100) > 0) decaySlots.push('shield');

                if (decaySlots.length > 0) {
                  const pickedSlot = decaySlots[Math.floor(Math.random() * decaySlots.length)];
                  const baseAmount = Math.random() > 0.5 ? 2 : 1;
                  if (pickedSlot === 'armor' && nextArmor) {
                    const oldD = nextArmor.durability ?? 100;
                    const decayAmt = getItemDurabilityDecay(nextArmor, baseAmount);
                    const nextD = Math.max(0, oldD - decayAmt);
                    nextArmor = { ...nextArmor, durability: nextD };
                    if (nextD === 0 && oldD > 0) {
                      staticLogs.push(`⚠️ WARNING: Your body armor [${nextArmor.name}] has broken!`);
                    }
                  } else if (pickedSlot === 'helmet' && nextHelmet) {
                    const oldD = nextHelmet.durability ?? 100;
                    const decayAmt = getItemDurabilityDecay(nextHelmet, baseAmount);
                    const nextD = Math.max(0, oldD - decayAmt);
                    nextHelmet = { ...nextHelmet, durability: nextD };
                    if (nextD === 0 && oldD > 0) {
                      staticLogs.push(`⚠️ WARNING: Your helmet [${nextHelmet.name}] has broken!`);
                    }
                  } else if (pickedSlot === 'gloves' && nextGloves) {
                    const oldD = nextGloves.durability ?? 100;
                    const decayAmt = getItemDurabilityDecay(nextGloves, baseAmount);
                    const nextD = Math.max(0, oldD - decayAmt);
                    nextGloves = { ...nextGloves, durability: nextD };
                    if (nextD === 0 && oldD > 0) {
                      staticLogs.push(`⚠️ WARNING: Your gloves [${nextGloves.name}] have broken!`);
                    }
                  } else if (pickedSlot === 'boots' && nextBoots) {
                    const oldD = nextBoots.durability ?? 100;
                    const decayAmt = getItemDurabilityDecay(nextBoots, baseAmount);
                    const nextD = Math.max(0, oldD - decayAmt);
                    nextBoots = { ...nextBoots, durability: nextD };
                    if (nextD === 0 && oldD > 0) {
                      staticLogs.push(`⚠️ WARNING: Your boots [${nextBoots.name}] have broken!`);
                    }
                  } else if (pickedSlot === 'shield' && nextShield) {
                    const oldD = nextShield.durability ?? 100;
                    const decayAmt = getItemDurabilityDecay(nextShield, baseAmount);
                    const nextD = Math.max(0, oldD - decayAmt);
                    nextShield = { ...nextShield, durability: nextD };
                    if (nextD === 0 && oldD > 0) {
                      staticLogs.push(`⚠️ WARNING: Your shield [${nextShield.name}] has broken!`);
                    }
                  }
                }
              } else {
                ex = nextStep.x;
                ey = nextStep.y;
              }
            }
          }
        } else {
          // Patrol Mode: Cycle through its patrol array corners
          if (enemy.patrolPath && enemy.patrolPath.length > 0) {
            const targetCorner = enemy.patrolPath[enemy.patrolIndex];
            const distanceToCorner = Math.abs(ex - targetCorner.x) + Math.abs(ey - targetCorner.y);

            if (distanceToCorner <= 1) {
              // Move to next waypoint
              const nextPatIndex = (enemy.patrolIndex + 1) % enemy.patrolPath.length;
              nextEnemies[i] = { ...enemy, patrolIndex: nextPatIndex };
            } else {
              const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
              const step = getNextStepTowards(ex, ey, targetCorner.x, targetCorner.y, prev.map, canOpen, obstacles);
              if (step) {
                ex = step.x;
                ey = step.y;
              }
            }
          } else {
            // No patrol path: wander randomly (graze or patrol fields)
            const dirs = [
              { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
              { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
              { dx: 0, dy: 0 } // option to stand still and graze
            ];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const nx = ex + d.dx;
            const ny = ey + d.dy;
            const height = prev.map.length;
            const width = prev.map[0].length;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const tile = prev.map[ny][nx];
              const isTileBlocked =
                tile === TileType.Wall ||
                tile === TileType.Window ||
                tile === TileType.Table ||
                tile === TileType.Tree ||
                tile === TileType.PineTree ||
                tile === TileType.BirchTree ||
                tile === TileType.CopperVein ||
                tile === TileType.IronVein ||
                tile === TileType.Water ||
                tile === TileType.Campfire ||
                tile === TileType.Anvil ||
                tile === TileType.Bed ||
                tile === TileType.Empty;
              const obstacles = nextEnemies.filter((_, idx) => idx !== i).map((e) => ({ x: e.x, y: e.y }));
              if (!isTileBlocked && !obstacles.some((e) => e.x === nx && e.y === ny) && !(nx === px && ny === py)) {
                ex = nx;
                ey = ny;
              }
            }
          }
        }

        // Apply visual coordinates
        nextEnemies[i] = {
          ...nextEnemies[i],
          x: ex,
          y: ey,
          state: nextState,
        };
      }

      // Record logs in HUD panel
      let nextLogList = [...prev.logs];
      staticLogs.forEach((logText) => {
        nextLogList.push({
          id: `ai_log_${Math.random()}`,
          text: logText,
          type: logText.includes('strikes you') || logText.includes('projects') ? 'combat' : 'trap',
          timestamp: 'MONSTER',
        });
      });

      // Trigger defeat state if life hits zero
      if (playerHp <= 0) {
        // Handled cleanly via useEffect to prevent React state updater side-effect crashes
        playerHp = 0;
      }

      // Sync followers HP or handle companion permadeath
      const finalFollowers = prev.followers.map(fol => {
        const isOnQuest = (prev.activeCompanionQuests || []).some(q => q.followerId === fol.id && q.durationTurns > 0);
        if (isOnQuest) {
          return fol; // Keep their current HP unchanged and don't require an active map actor
        }
        const activeActor = nextEnemies.find(actor => actor.isFollower && actor.followerId === fol.id);
        if (activeActor) {
          return { ...fol, hp: activeActor.hp };
        }
        return { ...fol, hp: 0 };
      }).filter(fol => {
        const isOnQuest = (prev.activeCompanionQuests || []).some(q => q.followerId === fol.id && q.durationTurns > 0);
        if (isOnQuest) {
          return true; // Dispatched companions cannot die on the local map
        }
        if (fol.hp <= 0) {
          nextLogList.push({
            id: `fol_dead_${Date.now()}`,
            text: `🪦 COMPANION DIED: ${fol.name} has been slain in combat!`,
            type: 'danger',
            timestamp: 'DEFEAT'
          });

          // Spawn physical friendly companion corpse & high splatter
          const preDead = prev.enemies.find(actor => actor.isFollower && actor.followerId === fol.id);
          const fX = preDead ? preDead.x : px;
          const fY = preDead ? preDead.y : py;

          nextCorpses.push({
            id: `corpse_fol_${Date.now()}_${Math.random()}`,
            x: fX,
            y: fY,
            char: '@',
            name: fol.name,
            color: '#60a5fa', // Blue tint representing blue allied frame
            type: 'enemy',
            isElite: false
          });

          nextSplatters.push({
            id: `spl_fol_slain_${Date.now()}_${Math.random()}`,
            x: fX,
            y: fY,
            intensity: 3,
            color: '#dc2626'
          });

          return false;
        }
        return true;
      });

      // -----------------------------------------------------------------
      // WANDERING FACTIONS: CAMP LIBERATION & CARAVAN SECURED CHECKS
      // -----------------------------------------------------------------
      let nextClearedCamps = prev.clearedCamps ? [...prev.clearedCamps] : [];
      let nextCaravanAmbushState = prev.caravanAmbushState ? { ...prev.caravanAmbushState } : {};
      let hasActiveCaravanLicense = prev.hasActiveCaravanLicense || false;

      if (prev.isOverworld) {
        const cx = prev.currentChunkX;
        const cy = prev.currentChunkY;

        // Check Camp Liberation
        const hasCampChest = prev.chests.some(c => c.id === `camp_chest_${cx}_${cy}`);
        const isCampAlreadyCleared = nextClearedCamps.includes(`camp_${cx}_${cy}`);
        if (hasCampChest && !isCampAlreadyCleared) {
          const campGuardsRemaining = nextEnemies.some(e => e.id?.startsWith(`camp_guard_${cx}_${cy}_`));
          if (!campGuardsRemaining) {
            nextClearedCamps.push(`camp_${cx}_${cy}`);
            nextRep = Math.min(100, nextRep + 15);
            nextLogList.push({
              id: `liberate_${Date.now()}`,
              text: `⚔️ [CAMP LIBERATED]: You have cleared the Hostile Sentry Camp! Regional danger permanently lowered. +15 Town Reputation! +150 XP!`,
              type: 'quest',
              timestamp: 'VICTORY'
            });

            let xpGained = 150;
            let currentXp = updatedStats.xp + xpGained;
            let currentLvl = updatedStats.level;
            let currentNextThreshold = updatedStats.nextLevelXp;
            let currentHp = playerHp;
            let currentMaxHp = updatedStats.maxHp;
            let currentMp = playerMp;
            let currentMaxMp = updatedStats.maxMp;
            let currentAtk = updatedStats.atk;
            let currentDef = updatedStats.def;
            let currentUnspent = updatedStats.unspentPoints || 0;

            const bonuses = gameConfig.levelUpBonuses;
            while (currentXp >= currentNextThreshold) {
              currentLvl += 1;
              currentXp -= currentNextThreshold;
              currentNextThreshold = Math.floor(currentNextThreshold * bonuses.xpThresholdMultiplier);
              currentMaxHp += bonuses.maxHp;
              currentHp = currentMaxHp;
              currentMaxMp += bonuses.maxMp;
              currentMp = currentMaxMp;
              currentAtk += bonuses.atk;
              currentDef += bonuses.def;
              currentUnspent += bonuses.attributePoints;

              nextLogList.push({
                id: `lvl_up_camp_${Date.now()}_${currentLvl}`,
                text: `🌟 LEVEL UP! You reached Level ${currentLvl}! (+${bonuses.attributePoints} Stat Points, +${bonuses.maxHp} Max HP)`,
                type: 'quest',
                timestamp: 'LEVEL'
              });
            }

            updatedStats.xp = currentXp;
            updatedStats.level = currentLvl;
            updatedStats.nextLevelXp = currentNextThreshold;
            updatedStats.maxHp = currentMaxHp;
            playerHp = currentHp;
            updatedStats.maxMp = currentMaxMp;
            playerMp = currentMp;
            updatedStats.atk = currentAtk;
            updatedStats.def = currentDef;
            updatedStats.unspentPoints = currentUnspent;
          }
        }

        // Check Caravan Ambush Defended
        const hasCaravanTobias = prev.npcs.some(n => n.id === `ambushed_merchant_${cx}_${cy}`);
        const caravanState = nextCaravanAmbushState[`${cx},${cy}`];
        if (hasCaravanTobias && caravanState !== 'success' && caravanState !== 'failed') {
          const hasBanditsRemaining = nextEnemies.some(e => e.id?.startsWith(`caravan_bandit_${cx}_${cy}_`));
          if (!hasBanditsRemaining) {
            nextCaravanAmbushState[`${cx},${cy}`] = 'success';
            hasActiveCaravanLicense = true;
            nextRep = Math.min(100, nextRep + 25);
            nextLogList.push({
              id: `caravan_secured_${Date.now()}`,
              text: `🏆 [CARAVAN SECURED]: Baron Tobias cheers: "Saved! Show this Rare Trade License in Port Towns for 30% bonus trade gains & 20% discount!"`,
              type: 'quest',
              timestamp: 'VICTORY'
            });

            updatedStats.gold += 250;
            nextLogList.push({
              id: `caravan_reward_${Date.now()}`,
              text: `💰 Obtained: +250 Gold!`,
              type: 'loot',
              timestamp: 'LOOT'
            });

            let xpGained = 200;
            let currentXp = updatedStats.xp + xpGained;
            let currentLvl = updatedStats.level;
            let currentNextThreshold = updatedStats.nextLevelXp;
            let currentHp = playerHp;
            let currentMaxHp = updatedStats.maxHp;
            let currentMp = playerMp;
            let currentMaxMp = updatedStats.maxMp;
            let currentAtk = updatedStats.atk;
            let currentDef = updatedStats.def;
            let currentUnspent = updatedStats.unspentPoints || 0;

            const bonuses = gameConfig.levelUpBonuses;
            while (currentXp >= currentNextThreshold) {
              currentLvl += 1;
              currentXp -= currentNextThreshold;
              currentNextThreshold = Math.floor(currentNextThreshold * bonuses.xpThresholdMultiplier);
              currentMaxHp += bonuses.maxHp;
              currentHp = currentMaxHp;
              currentMaxMp += bonuses.maxMp;
              currentMp = currentMaxMp;
              currentAtk += bonuses.atk;
              currentDef += bonuses.def;
              currentUnspent += bonuses.attributePoints;

              nextLogList.push({
                id: `lvl_up_car_${Date.now()}_${currentLvl}`,
                text: `🌟 LEVEL UP! You reached Level ${currentLvl}! (+${bonuses.attributePoints} Stat Points, +${bonuses.maxHp} Max HP)`,
                type: 'quest',
                timestamp: 'LEVEL'
              });
            }

            updatedStats.xp = currentXp;
            updatedStats.level = currentLvl;
            updatedStats.nextLevelXp = currentNextThreshold;
            updatedStats.maxHp = currentMaxHp;
            playerHp = currentHp;
            updatedStats.maxMp = currentMaxMp;
            playerMp = currentMp;
            updatedStats.atk = currentAtk;
            updatedStats.def = currentDef;
            updatedStats.unspentPoints = currentUnspent;

            // Change Tobias NPC Dialogue
            nextNpcs = nextNpcs.map(npc => {
              if (npc.id === `ambushed_merchant_${cx}_${cy}`) {
                return {
                  ...npc,
                  dialogue: [
                    "Thank you, brave savior! Show your Rare Trade License in Oakhaven for 20% discount on all buying stocks!",
                    "My carriage is safe, the alloys are safe. Bless your steel!",
                    "A fine day for trading indeed, now that those forest bandits are history!"
                  ]
                };
              }
              return npc;
            });
          }
        }
      }

      // -----------------------------------------------------------------
      // DYNAMIC WORLD EVENT: BLOOD MOON CELESTIAL RIFT SCHEDULER
      // -----------------------------------------------------------------
      let nextTurnsUntilBloodMoon = prev.turnsUntilBloodMoon;
      let nextBloodMoonTurnsLeft = prev.bloodMoonTurnsLeft;

      if (nextTurnsUntilBloodMoon === undefined) {
        nextTurnsUntilBloodMoon = Math.floor(Math.random() * 251) + 300; // 300-550 turns
      }
      if (nextBloodMoonTurnsLeft === undefined) {
        nextBloodMoonTurnsLeft = 0;
      }

      if (nextBloodMoonTurnsLeft > 0) {
        nextBloodMoonTurnsLeft -= 1;
        if (nextBloodMoonTurnsLeft === 0) {
          staticLogs.push(`🌌 [CELESTIAL RIFT CLOSED]: The crimson Blood Moon Celestial Rift has collapsed! The sky recedes back to its peaceful state.`);
          nextTurnsUntilBloodMoon = Math.floor(Math.random() * 251) + 300; // 300-550 turns
        }
      } else {
        if (nextTurnsUntilBloodMoon > 0) {
          nextTurnsUntilBloodMoon -= 1;
        }
        if (nextTurnsUntilBloodMoon === 0) {
          nextBloodMoonTurnsLeft = Math.floor(Math.random() * 21) + 30; // 30-50 turns duration
          staticLogs.push(`🌌 [CELESTIAL RIFT OPENED]: The sky burns crimson... A BLOOD MOON CELESTIAL RIFT has ripped open! Monsters are aggressive and heal on hit (lifesteal), but drop double catalysts!`);
          
          const moonEv = new CustomEvent('spawn-game-effect', {
            detail: { x: px, y: py, text: `🩸 BLOOD MOON RIFT!`, type: 'dmg' },
          });
          window.dispatchEvent(moonEv);
        }
      }

      // -----------------------------------------------------------------
      // INTEGRATED ACTIVE GM STORYTELLER ENTITY
      // -----------------------------------------------------------------
      let finalFollowersList = [...finalFollowers];
      let nextLootPiles = prev.lootPiles ? [...prev.lootPiles] : [];

      // Tick active companion quests (Autonomous dispatch expeditions)
      const nextActiveCompanionQuests = (prev.activeCompanionQuests || []).map((quest) => {
        const nextTurns = Math.max(0, quest.durationTurns - 1);
        if (nextTurns === 0 && quest.durationTurns > 0) {
          const compName = prev.followers.find(f => f.id === quest.followerId)?.name || 'Expedition companion';
          staticLogs.push(`🚀 [EXPEDITION COMPLETE]: ${compName} has returned from [${quest.title}]! Open the Guild & Factions tab to claim rewards.`);
        }
        return {
          ...quest,
          durationTurns: nextTurns
        };
      });

      const partialCurrentState: GameState = {
        ...prev,
        enemies: nextEnemies,
        traps: nextTraps,
        logs: nextLogList,
        npcs: nextNpcs,
        followers: finalFollowersList,
        lootPiles: nextLootPiles,
        gameTime: nextTimeVal,
        weather: nextWeather,
        season: nextSeason,
        activeCompanionQuests: nextActiveCompanionQuests,
        activeFoodBuff: nextFoodBuff,
        playerStats: {
          ...updatedStats,
          hp: Math.max(0, playerHp),
          mp: Math.min(updatedStats.maxMp, Math.max(0, playerMp)),
          scars: activeScars,
        }
      };

      const gmResponse = tickActiveGMStoryteller(partialCurrentState);
      if (gmResponse.didIntervene && gmResponse.logMessage) {
        if (gmResponse.stateUpdates.playerStats) {
          playerHp = gmResponse.stateUpdates.playerStats.hp;
          playerMp = gmResponse.stateUpdates.playerStats.mp;
        }
        if (gmResponse.stateUpdates.enemies) {
          nextEnemies = gmResponse.stateUpdates.enemies;
        }
        if (gmResponse.stateUpdates.traps) {
          nextTraps = gmResponse.stateUpdates.traps;
        }
        if (gmResponse.stateUpdates.lootPiles) {
          nextLootPiles = gmResponse.stateUpdates.lootPiles;
        }
        if (gmResponse.stateUpdates.weather) {
          nextWeather = gmResponse.stateUpdates.weather;
        }
        nextLogList = [gmResponse.logMessage, ...nextLogList].slice(0, 200);

        // Spawn associated visual effects
        const spawnEffect = gmResponse.effectSpawn || (gmResponse.logMessage.text.includes("Seraphic") 
          ? { x: px, y: py, text: "Divine Restoration!", type: 'heal' as const }
          : gmResponse.logMessage.text.includes("Void-Torn")
          ? { x: px + 2, y: py + 2, text: "Rift Ambush!", type: 'dmg' as const }
          : gmResponse.logMessage.text.includes("alloy")
          ? { x: px, y: py - 1, text: "Alchemical Gift!", type: 'loot' as const }
          : null);

        if (spawnEffect) {
          const actEv = new CustomEvent('spawn-game-effect', {
            detail: spawnEffect,
          });
          window.dispatchEvent(actEv);
        }
      }

      // Tick tax and materials accumulation for controlled territories
      let nextFactionTerritories = prev.factionTerritories;
      if (prev.factionTerritories) {
        nextFactionTerritories = {};
        for (const id of Object.keys(prev.factionTerritories)) {
          const terr = prev.factionTerritories[id];
          
          let addedGold = 0;
          let addedMat = 0;
          
          // Controlled territories generate gold
          if (terr.controller !== 'neutral') {
            const chanceMultiplier = terr.controller === 'outlaw' ? 0.05 : 0.08;
            if (Math.random() < chanceMultiplier) {
              addedGold = id === 'borderlands' ? 1 : id === 'shadow_fjord' ? 2 : id === 'moonshadow_cove' ? 3 : id === 'sunplate_ridge' ? 3 : 4;
            }
            
            const matChance = id === 'borderlands' ? 0.04 : id === 'shadow_fjord' ? 0.03 : id === 'moonshadow_cove' ? 0.02 : id === 'sunplate_ridge' ? 0.02 : 0.04;
            if (Math.random() < matChance) {
              addedMat = 1;
            }
          }
          
          nextFactionTerritories[id] = {
            ...terr,
            taxGoldAccumulated: (terr.taxGoldAccumulated || 0) + addedGold,
            taxMaterialCountAccumulated: (terr.taxMaterialCountAccumulated || 0) + addedMat
          };
        }
      }

      // -----------------------------------------------------------------
      // ACTIVE WATCHTOWER SIEGE RESOLUTION CHECK
      // -----------------------------------------------------------------
      let finalChunksForSiege = prev.overworldChunks ? { ...prev.overworldChunks } : {};
      let nextMats = prev.inventoryMaterials ? { ...prev.inventoryMaterials } : {};
      let nextReputation = prev.factionReputation ? { ...prev.factionReputation } : { syndicate: 0, vanguard: 0, bandits: 0 };
      const siegeChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      
      if (prev.isOverworld && finalChunksForSiege[siegeChunkKey]?.watchtower?.siegeState?.isUnderSiege) {
        const wt = { ...finalChunksForSiege[siegeChunkKey].watchtower! };
        const sState = { ...wt.siegeState! };
        
        const attackersRemaining = nextEnemies.some(e => e.id.startsWith('siege_attacker_') || e.id.startsWith('wt_ally_attacker_'));
        const defendersRemaining = nextEnemies.some(e => e.id.startsWith('siege_defender_') || e.id.startsWith('wt_ally_defender_'));

        if (!attackersRemaining && defendersRemaining) {
          // Defenders won! Player gets big rewards!
          wt.siegeState = undefined; // clear siege
          
          const defenderFactionName = wt.controller === 'syndicate' ? 'Moonshadow Syndicate' : (wt.controller === 'vanguard' ? 'Dawn Vanguard' : (wt.controller === 'bandits' ? 'Rust-Raider Bandits' : 'Town Faction'));
          
          nextLogList.push({
            id: `siege_defense_victory_${Date.now()}`,
            text: `🎉 [SIEGE REPRISAL SUCCESSFUL]: The watchtower is safe! You helped the ${defenderFactionName} repel the invaders! Faction reputation increased by +40, and the garrison awards you with battle treasures! (+400 XP, +250g, +3 rare materials!)`,
            type: 'quest',
            timestamp: 'VICTORY'
          });

          // Award rewards
          updatedStats.gold = (updatedStats.gold || 0) + 250;
          
          // XP progression
          let xpGained = 400;
          let currentXp = updatedStats.xp + xpGained;
          let currentLvl = updatedStats.level;
          let currentNextThreshold = updatedStats.nextLevelXp;
          let currentHp = playerHp;
          let currentMp = playerMp;

          while (currentXp >= currentNextThreshold) {
            currentXp -= currentNextThreshold;
            currentLvl += 1;
            currentNextThreshold = Math.round(currentNextThreshold * 1.5);
            
            // Level up stats
            updatedStats.str += 1;
            updatedStats.dex += 1;
            updatedStats.int += 1;
            updatedStats.cha += 1;
            updatedStats.lck += 1;
            updatedStats.unspentPoints += 5;
            
            currentHp = updatedStats.maxHp + 25; // Boost maxHp
            currentMp = updatedStats.maxMp + 10;
            updatedStats.maxHp = currentHp;
            updatedStats.maxMp = currentMp;

            nextLogList.push({
              id: `lvl_up_${Date.now()}_${currentLvl}`,
              text: `🌟 CONGRATULATIONS! LEVEL UP! You have reached level ${currentLvl}! All attributes increased by +1! You earned 5 Attribute points to allocate!`,
              type: 'quest',
              timestamp: 'LEVEL UP'
            });
            
            // Play level up sound
            setTimeout(() => {
              playSound('level_up');
            }, 100);
          }

          updatedStats.xp = currentXp;
          updatedStats.level = currentLvl;
          updatedStats.nextLevelXp = currentNextThreshold;
          playerHp = currentHp;
          playerMp = currentMp;

          // Award materials
          const matsToAward = ['mat_steel', 'mat_iron_plate', 'mat_cloth', 'mat_leather_scrap', 'mat_lockpick'];
          for (let mIdx = 0; mIdx < 3; mIdx++) {
            const chosenMat = matsToAward[Math.floor(Math.random() * matsToAward.length)];
            nextMats[chosenMat] = (nextMats[chosenMat] || 0) + 1;
          }

          // Faction standing increase
          if (wt.controller && wt.controller !== 'neutral') {
            nextReputation[wt.controller] = Math.min(100, (nextReputation[wt.controller] || 0) + 40);
          }

          finalChunksForSiege[siegeChunkKey] = {
            ...finalChunksForSiege[siegeChunkKey],
            watchtower: wt
          };

          // Spawn celebration effect
          const victoryEv = new CustomEvent('spawn-game-effect', {
            detail: { x: px, y: py, text: `🎉 SIEGE DEFENDED!`, type: 'heal' },
          });
          window.dispatchEvent(victoryEv);
          playSound('quest_complete');
        } 
        else if (attackersRemaining && !defendersRemaining) {
          // Attackers won! Watchtower fallen!
          wt.siegeState = undefined;
          wt.isClaimed = true;
          wt.controller = sState.attacker;
          wt.claimPercent = 100;
          wt.garrisonDefeated = false; // Reset garrison so attackers can occupy it

          const attackerFactionName = sState.attacker === 'syndicate' ? 'Moonshadow Syndicate' : (sState.attacker === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits');

          nextLogList.push({
            id: `siege_attacker_victory_${Date.now()}`,
            text: `💔 [WATCHTOWER OVERTHROWN]: The defender garrison in Sector [${prev.currentChunkX}, ${prev.currentChunkY}] was wiped out! The ${attackerFactionName} forces have claimed control of the watchtower!`,
            type: 'danger',
            timestamp: 'SIEGE OVERTHROW'
          });

          finalChunksForSiege[siegeChunkKey] = {
            ...finalChunksForSiege[siegeChunkKey],
            watchtower: wt
          };

          const defeatEv = new CustomEvent('spawn-game-effect', {
            detail: { x: px, y: py, text: `💔 OVERTHROWN!`, type: 'dmg' },
          });
          window.dispatchEvent(defeatEv);
          playSound('trap');
        }
      }

      return {
        ...prev,
        enemies: nextEnemies,
        traps: nextTraps,
        logs: nextLogList,
        npcs: nextNpcs,
        followers: finalFollowersList,
        lootPiles: nextLootPiles,
        defeatedEnemiesCount: nextDefeatedCounts,
        gameTime: nextTimeVal,
        weather: nextWeather,
        season: nextSeason,
        isBraced: false,
        equippedArmor: nextArmor,
        equippedHelmet: nextHelmet,
        equippedGloves: nextGloves,
        equippedBoots: nextBoots,
        equippedShield: nextShield,
        corpses: nextCorpses,
        bloodSplatters: nextSplatters,
        lastRestockTime: nextRestockTime,
        merchantGold: merchantGoldUpdate,
        merchantStock: merchantStockUpdate,
        townReputation: nextRep,
        areGuardsHostile: nextGuardsHostile,
        clearedCamps: nextClearedCamps,
        hasActiveCaravanLicense: hasActiveCaravanLicense,
        caravanAmbushState: nextCaravanAmbushState,
        activeCompanionQuests: nextActiveCompanionQuests,
        activeFoodBuff: nextFoodBuff,
        turnsUntilBloodMoon: nextTurnsUntilBloodMoon,
        bloodMoonTurnsLeft: nextBloodMoonTurnsLeft,
        factionTerritories: nextFactionTerritories,
        overworldChunks: finalChunksForSiege,
        inventoryMaterials: nextMats,
        factionReputation: nextReputation,
        playerStats: {
          ...updatedStats,
          hp: Math.max(0, playerHp),
          mp: Math.min(updatedStats.maxMp, Math.max(0, playerMp)),
          scars: activeScars,
          activeEffects: updatedEffects,
        },
      };
    });
  };

  // Callback when a tile is clicked on GameCanvas (allows moving or shooting)
  const handleTileClick = (tx: number, ty: number) => {
    // Manhattan click offset distance
    const dx = tx - gameState.playerX;
    const dy = ty - gameState.playerY;

    if (activeTargetedScroll) {
      const template = SPELL_SCROLLS.find(t => activeTargetedScroll.id.includes(t.id));
      const requiredMp = template ? template.mpCost : 20;

      if (gameState.playerStats.mp < requiredMp) {
        addLogMessage(`❌ Insufficient Mana! You need at least ${requiredMp} MP to channel the scroll.`, 'system');
        setActiveTargetedScroll(null);
        return;
      }

      const targetEnemyIdx = gameState.enemies.findIndex((e) => e.x === tx && e.y === ty);
      if (targetEnemyIdx === -1) {
        addLogMessage(`❌ You must click on an enemy on the battlefield to unleash the scroll magic!`, 'system');
        return;
      }
      const enemy = gameState.enemies[targetEnemyIdx];
      const distance = Math.floor(Math.sqrt(dx ** 2 + dy ** 2));
      const castRange = 6;
      if (distance > castRange) {
        addLogMessage(`❌ ${enemy.name} is too far away! Spell Scroll casting range is ${castRange} tiles.`, 'system');
        return;
      }

      // Check line of sight
      const bresenline = bresenhamLine(gameState.playerX, gameState.playerY, tx, ty);
      let obscured = false;
      for (let i = 1; i < bresenline.length - 1; i++) {
        const pt = bresenline[i];
        const tile = gameState.map[pt.y]?.[pt.x];
        if (tile === TileType.Wall || tile === TileType.Door) {
          obscured = true;
          break;
        }
      }

      if (obscured) {
        addLogMessage(`❌ Spell trajectory to ${enemy.name} is obscured by solid barriers.`, 'system');
        return;
      }

      // Player casting spell scroll!
      // 1. Consume the scroll from equipmentInventory
      const nextEquip = consumeItemFromInventory(gameState.equipmentInventory, activeTargetedScroll.id, 1);
      
      // 2. Reduce MP
      const nextMp = Math.max(0, gameState.playerStats.mp - requiredMp);

      // 3. Determine the spell scroll traits/type and deal damage & debuffs
      let baseDmg = 35 + gameState.playerStats.int * 2;
      let scrollElement = CatalystType.Fire;
      let effectText = '🔥 PYROBLAST!';
      let msgText = '';
      let debuffToApply: { type: CatalystType; duration: number; damagePerTurn: number } | null = null;

      let nextDebuffs = [...enemy.debuffs];
      let comboTriggered = false;
      let comboDmgBonus = 0;
      let comboLog = '';
      let comboEffectText = '';

      if (template) {
        baseDmg = template.baseDamage + gameState.playerStats.int * 2;
        scrollElement = template.element;
        const icon = template.name.split(' ').slice(-1)[0] || '✨';
        const rawName = template.name.replace('Scroll of ', '');
        effectText = `${icon} ${rawName.toUpperCase()}!`;
        debuffToApply = { 
          type: template.debuff.type, 
          duration: template.debuff.duration, 
          damagePerTurn: template.debuff.damagePerTurn 
        };
        msgText = `📜 [SCROLL SPELL]: You read the ${template.name}, unleashing its arcanum at ${enemy.name}! Deals ${baseDmg} elemental damage and afflicts them!`;

        // Check current debuffs on enemy for combo triggers!
        const activeCombo = template.combos.find(c => nextDebuffs.some(d => d.type === c.onDebuff));
        if (activeCombo) {
          comboTriggered = true;
          comboDmgBonus = activeCombo.bonusDamage;
          nextDebuffs = nextDebuffs.filter(d => d.type !== activeCombo.onDebuff);
          comboLog = `✨ SPELL COMBO: ${enemy.name} ${activeCombo.logMessage}`;
          comboEffectText = activeCombo.effectText;
        }
      } else {
        // Fallback for custom basic scrolls
        scrollElement = CatalystType.Lightning;
        effectText = '⚡ SCROLL LIGHTNING!';
        debuffToApply = { type: CatalystType.Lightning, duration: 3, damagePerTurn: 4 };
        msgText = `📜 [SCROLL SPELL]: You read a spell scroll, striking ${enemy.name} with magic! Deals ${baseDmg} damage.`;
      }

      // Apply new debuff if not consumed/combo-wiped
      if (debuffToApply && !comboTriggered) {
        const existIdx = nextDebuffs.findIndex(d => d.type === debuffToApply!.type);
        if (existIdx !== -1) {
          nextDebuffs[existIdx].duration = debuffToApply.duration;
        } else {
          nextDebuffs.push(debuffToApply);
        }
      }

      const totalDmg = baseDmg + comboDmgBonus;
      const nextHp = Math.max(0, enemy.hp - totalDmg);

      playSound('spell');

      // Floating damage text
      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: enemy.x, y: enemy.y, text: `-${totalDmg} Spell Dmg 📜`, type: 'damage' },
      });
      window.dispatchEvent(ev);

      if (comboTriggered) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('spawn-game-effect', {
            detail: { x: enemy.x, y: enemy.y, text: comboEffectText, type: 'crit' }
          }));
        }, 150);
      }

      // Spawn some magical floating effect
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('spawn-game-effect', {
          detail: { x: enemy.x, y: enemy.y, text: effectText, type: 'heal' }
        }));
      }, 300);

      // Construct update
      setGameState(prev => {
        const updatedEnemies = [...prev.enemies];
        const updatedLogs = [...prev.logs];
        
        let nextGuardsHostile = prev.areGuardsHostile !== undefined ? prev.areGuardsHostile : false;
        let currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        let nextRep = currentRep;

        // Log the main damage
        const timeStr = formatGameTime(prev.gameTime).timeStr;

        if (enemy.isTownGuard) {
          nextGuardsHostile = true;
          let decrease = 25;
          if (nextHp <= 0) decrease += 35;
          nextRep = Math.max(0, currentRep - decrease);
          updatedLogs.push({
            id: `unlawful_scroll_${Date.now()}`,
            text: `⚖️ [CRIMINAL OFFENSE]: You have assaulted a peacekeeper of the crown with magic! Town guards are now hostile!`,
            type: 'danger' as const,
            timestamp: timeStr
          });
        }

        updatedLogs.push({
          id: `scroll_cast_dmg_${Date.now()}`,
          text: msgText,
          type: 'combat',
          timestamp: timeStr
        });

        if (comboTriggered && comboLog) {
          updatedLogs.push({
            id: `scroll_combo_${Date.now()}`,
            text: comboLog,
            type: 'craft',
            timestamp: timeStr
          });
        }

        // Handle enemy defeat or HP deduction
        if (nextHp <= 0) {
          updatedLogs.push({
            id: `scroll_kill_${Date.now()}`,
            text: `💀 ${enemy.name} has been vaporized by your Scroll magic! Gained +${enemy.xpValue} XP.`,
            type: 'combat',
            timestamp: timeStr
          });
          
          // Defeated stats update
          const cat = enemy.category || 'Standard Foe';
          const nextDefeatedCounts = {
            ...prev.defeatedEnemiesCount,
            [cat]: (prev.defeatedEnemiesCount[cat] || 0) + 1,
            total: (prev.defeatedEnemiesCount.total || 0) + 1,
          };

          // Handle player XP gain
          let newXp = prev.playerStats.xp + enemy.xpValue;
          let newLvl = prev.playerStats.level;
          let newMaxHp = prev.playerStats.maxHp;
          let newMaxMp = prev.playerStats.maxMp;
          let hpVal = prev.playerStats.hp;
          let mpVal = nextMp; // updated MP from casting!

          const xpNeeded = newLvl * 100;
          if (newXp >= xpNeeded) {
            newXp -= xpNeeded;
            newLvl += 1;
            newMaxHp += 15;
            newMaxMp += 8;
            hpVal = newMaxHp;
            mpVal = newMaxMp;
            
            updatedLogs.push({
              id: `level_up_${Date.now()}`,
              text: `🌟 LEVEL UP! You have advanced to Level ${newLvl}! HP & MP fully restored!`,
              type: 'system',
              timestamp: timeStr
            });

            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('spawn-game-effect', {
                detail: { x: prev.playerX, y: prev.playerY, text: `🌟 LEVEL UP!`, type: 'heal' }
              }));
            }, 450);
          }

          // Remove enemy from list and spawn loot pile!
          const withoutEnemy = updatedEnemies.filter((_, idx) => idx !== targetEnemyIdx);
          const nextLootPiles = [...prev.lootPiles];
          
          // Spawn drop
          const chance = Math.random();
          if (chance < 0.65) {
            // Gold drop
            const goldAmount = Math.floor(Math.random() * (enemy.xpValue * 1.5)) + 3;
            nextLootPiles.push({
              id: `loot_${Date.now()}_${Math.random()}`,
              x: enemy.x,
              y: enemy.y,
              gold: goldAmount,
              materials: [],
              catalysts: [],
              equipment: []
            });
          }

          return {
            ...prev,
            enemies: withoutEnemy,
            lootPiles: nextLootPiles,
            defeatedEnemiesCount: nextDefeatedCounts,
            equipmentInventory: nextEquip,
            logs: updatedLogs,
            areGuardsHostile: nextGuardsHostile,
            townReputation: nextRep,
            playerStats: {
              ...prev.playerStats,
              xp: newXp,
              level: newLvl,
              maxHp: newMaxHp,
              maxMp: newMaxMp,
              hp: hpVal,
              mp: mpVal
            }
          };
        } else {
          // Just deduct HP and apply debuffs
          updatedEnemies[targetEnemyIdx] = {
            ...enemy,
            hp: nextHp,
            debuffs: nextDebuffs
          };

          return {
            ...prev,
            enemies: updatedEnemies,
            equipmentInventory: nextEquip,
            logs: updatedLogs,
            areGuardsHostile: nextGuardsHostile,
            townReputation: nextRep,
            playerStats: {
              ...prev.playerStats,
              mp: nextMp
            }
          };
        }
      });

      // Clear targeting state and trigger enemies turn!
      setActiveTargetedScroll(null);
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
      return;
    }

    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
      // Normal adjacent standard move / strike
      makeMove(dx, dy);
    } else {
      // Ranged active combat click
      // e.g., if we hold a Staff, Spear or Bow, check if clicked coordinate intersects target range
      const weapon = gameState.currentWeapon || STARTING_WEAPON;
      const targetEnemyIdx = gameState.enemies.findIndex((e) => e.x === tx && e.y === ty);

      if (targetEnemyIdx !== -1) {
        const enemy = gameState.enemies[targetEnemyIdx];
        const distance = Math.floor(Math.sqrt(dx ** 2 + dy ** 2));

        if (distance <= weapon.range) {
          // Direct Line of Sight blocks check
          const bresenline = bresenhamLine(gameState.playerX, gameState.playerY, tx, ty);
          let obscured = false;
          
          for (let i = 1; i < bresenline.length - 1; i++) {
            const pt = bresenline[i];
            const tile = gameState.map[pt.y][pt.x];
            if (tile === TileType.Wall || tile === TileType.Door) {
              obscured = true;
              break;
            }
          }

          if (!obscured) {
            // If the target is a follower or companion, trigger friendly chat instead of attacking
            if (enemy.isFollower || (enemy.isCaptive && enemy.isFreed)) {
              interactWithFollower(enemy);
              return;
            }

            // If the target is a town guard and they are not yet hostile, trigger prompt!
            if (enemy.isTownGuard && !gameState.areGuardsHostile) {
              setUnlawfulGuardTarget({ enemy, index: targetEnemyIdx, pathPoints: bresenline });
              return;
            }
            // Shoot Ranged strike!
            const acted = performPlayerAttack(enemy, targetEnemyIdx, bresenline);
            if (acted) {
              executeEnemiesTurn(gameState.playerX, gameState.playerY);
            }
          } else {
            addLogMessage(`❌ Direct vision trajectory is obscured by wall barriers.`, 'system');
          }
        } else {
          addLogMessage(`❌ Enemy resides outside this weapon's active assault reach (${weapon.range} tiles).`, 'system');
        }
      } else {
        addLogMessage(`❌ Click Adjacent cells to walk. Distance is too great.`, 'system');
      }
    }
  };

  const handleConfirmUnlawfulAttack = () => {
    if (!unlawfulGuardTarget) return;
    const { enemy, index, pathPoints } = unlawfulGuardTarget;
    setUnlawfulGuardTarget(null);

    // Make town guards permanently hostile and log criminal offense
    setGameState(prev => {
      return {
        ...prev,
        areGuardsHostile: true,
        logs: [
          ...prev.logs,
          {
            id: `unlawful_${Date.now()}`,
            text: `⚖️ [CRIMINAL OFFENSE]: You have assaulted a peacekeeper of the crown! Town guards are now hostile!`,
            type: 'danger' as const,
            timestamp: formatGameTime(prev.gameTime).timeStr
          }
        ]
      };
    });

    // Execute the unlawful assault
    const acted = performPlayerAttack(enemy, index, pathPoints);
    if (acted) {
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
    }
  };

  const handleConfirmSleep = (hours: number, hpHealed: number, mpHealed: number) => {
    setIsSleepOpen(false);
    
    // Calculate new stats & advanced game clock
    const futureTime = (gameState.gameTime + hours * 60) % 1440;
    const formattedTime = formatGameTime(futureTime).timeStr;

    setGameState((prev) => {
      const advancedTime = (prev.gameTime + hours * 60) % 1440;
      const nextStats = {
        ...prev.playerStats,
        hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + hpHealed),
        mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + mpHealed),
        exhaustion: 0, // Fully purges exhaustion!
      };
      const currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      const nextRep = Math.min(100, currentRep + hours * 10);
      let nextGuardsHostile = prev.areGuardsHostile;
      const nextLogs = [...prev.logs];
      if (nextGuardsHostile && nextRep >= 50) {
        nextGuardsHostile = false;
        nextLogs.push({
          id: `pardon_${Date.now()}`,
          text: `⚖️ [TOWN NOTICE]: Your crimes have been pardoned over your period of rest! Town guards are no longer hostile.`,
          type: 'info' as const,
          timestamp: formatGameTime(advancedTime).timeStr
        });
      }
      return {
        ...prev,
        playerStats: nextStats,
        gameTime: advancedTime,
        townReputation: nextRep,
        areGuardsHostile: nextGuardsHostile,
        logs: nextLogs,
      };
    });

    addLogMessage(`🛏️ You slept peacefully for ${hours} hour(s) until ${formattedTime}. Restored +${hpHealed} HP and +${mpHealed} MP!`, 'loot');

    const ev = new CustomEvent('spawn-game-effect', {
      detail: { x: gameState.playerX, y: gameState.playerY, text: `Rested +${hpHealed} HP! 💤`, type: 'heal' },
    });
    window.dispatchEvent(ev);
  };

  const handleDrunkNpcEffects = (effects: {
    logText: string;
    goldChange: number;
    hpChange?: number;
    mpChange?: number;
    addMaterials?: { [matId: string]: number };
    addCatalysts?: { [catId: string]: number };
    spawnEffectText: string;
    spawnEffectType: 'heal' | 'damage' | 'xp' | 'gold' | 'loot';
    buff?: {
      name: string;
      type: 'atk' | 'crit' | 'def' | 'speed';
      atkBonus?: number;
      critBonus?: number;
      defBonus?: number;
      turnsRemaining: number;
    };
  }) => {
    addLogMessage(effects.logText, 'loot');

    if (effects.spawnEffectText) {
      const ev = new CustomEvent('spawn-game-effect', {
        detail: {
          x: gameState.playerX,
          y: gameState.playerY,
          text: effects.spawnEffectText,
          type: effects.spawnEffectType || 'heal'
        },
      });
      window.dispatchEvent(ev);
    }

    setGameState((prev) => {
      const nextStats = { ...prev.playerStats };
      nextStats.gold = Math.max(0, nextStats.gold + effects.goldChange);
      if (effects.hpChange) {
        nextStats.hp = Math.min(nextStats.maxHp, Math.max(1, nextStats.hp + effects.hpChange));
      }
      if (effects.mpChange) {
        nextStats.mp = Math.min(nextStats.maxMp, Math.max(0, nextStats.mp + effects.mpChange));
      }

      const nextMats = { ...prev.inventoryMaterials };
      if (effects.addMaterials) {
        Object.entries(effects.addMaterials).forEach(([matId, qty]) => {
          nextMats[matId] = (nextMats[matId] || 0) + qty;
        });
      }

      const nextCats = { ...prev.inventoryCatalysts };
      if (effects.addCatalysts) {
        Object.entries(effects.addCatalysts).forEach(([catId, qty]) => {
          nextCats[catId] = (nextCats[catId] || 0) + qty;
        });
      }

      return {
        ...prev,
        playerStats: nextStats,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        activeFoodBuff: effects.buff ? effects.buff : prev.activeFoodBuff,
      };
    });
  };

  const handleTravelerAttack = (witnessed: boolean) => {
    if (!activeTravelerNpc) return;
    const traveler = activeTravelerNpc;
    setActiveTravelerNpc(null);

    playSound('slash');

    setGameState((prev) => {
      let hp = 50;
      let maxHp = 50;
      let atk = 7;
      let def = 2;
      let range = 1;
      let color = traveler.color;
      let char = traveler.char;

      if (traveler.role === 'traveler_herbalist') {
        hp = 45;
        maxHp = 45;
        atk = 5;
        def = 1;
        range = 1;
      } else if (traveler.role === 'traveler_hunter') {
        hp = 60;
        maxHp = 60;
        atk = 9;
        def = 3;
        range = 4;
      } else if (traveler.role === 'traveler_pilgrim') {
        hp = 50;
        maxHp = 50;
        atk = 7;
        def = 2;
        range = 1;
      }

      const newEnemy: Enemy = {
        id: `enemy_traveler_${Date.now()}`,
        x: traveler.x,
        y: traveler.y,
        type: 'Goblin',
        name: traveler.name.split(' (')[0],
        hp,
        maxHp,
        atk,
        def,
        range,
        speed: 1,
        color,
        char,
        state: EnemyState.Chasing,
        isElite: false,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      };

      const updatedNpcs = prev.npcs.filter(n => n.id !== traveler.id);
      let currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      let nextRep = currentRep;
      const nextLogs = [...prev.logs];

      let questIdToFail = '';
      if (traveler.role === 'traveler_herbalist') questIdToFail = 'q_traveler_herbalist_mushrooms';
      else if (traveler.role === 'traveler_hunter') questIdToFail = 'q_traveler_hunter_pelts';
      else if (traveler.role === 'traveler_pilgrim') questIdToFail = 'q_traveler_pilgrim_relic';

      const updatedQuests = prev.quests.map((q) => {
        if (q.id === questIdToFail && (q.status === 'active' || q.status === 'available')) {
          return { ...q, status: 'failed' as const };
        }
        return q;
      });

      const associatedQuest = prev.quests.find(q => q.id === questIdToFail);
      if (associatedQuest && (associatedQuest.status === 'active' || associatedQuest.status === 'available')) {
        nextLogs.push({
          id: `quest_failed_${Date.now()}`,
          text: `❌ QUEST FAILED: "${associatedQuest.title}" has failed because you chose to assault the quest giver!`,
          type: 'danger' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      if (witnessed) {
        nextRep = Math.max(0, currentRep - 35);
        nextLogs.push({
          id: `unlawful_traveler_${Date.now()}`,
          text: `⚖️ [WITNESSED CRIME]: You assaulted ${newEnemy.name} in broad daylight! Nearby witnesses reported your crime to the authorities! Your reputation with Sunder settlements plummeted (-35 Town Rep)!`,
          type: 'danger' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      } else {
        nextLogs.push({
          id: `stealth_traveler_${Date.now()}`,
          text: `🤫 [UNWITNESSED ASSAULT]: You assault ${newEnemy.name} in absolute silence. Sunder's cold mountain winds swallow their cries... No witnesses are around to report your crime.`,
          type: 'info' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      return {
        ...prev,
        npcs: updatedNpcs,
        enemies: [...prev.enemies, newEnemy],
        townReputation: nextRep,
        logs: nextLogs,
        quests: updatedQuests
      };
    });

    setTimeout(() => {
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
    }, 100);
  };

  const handleTravelerTrade = () => {
    if (!activeTravelerNpc) return;
    const traveler = activeTravelerNpc;

    setGameState(prev => ({
      ...prev,
      activeTradeNpcId: traveler.id
    }));
    setActiveTab('market');
    addLogMessage(`🛒 Trading store opened with ${traveler.name}! Buy equipment or sell materials and excess gear.`, 'craft');
  };

  const handlePoiChoiceSelected = (
    poiId: string,
    choiceId: string,
    effects: {
      logText: string;
      hpChange?: number;
      mpChange?: number;
      maxHpChange?: number;
      maxMpChange?: number;
      xpChange?: number;
      goldChange?: number;
      defChange?: number;
      unspentPointsChange?: number;
      reputationChange?: number;
      addMaterials?: { [matId: string]: number };
      addCatalysts?: { [catId: string]: number };
      spawnEffectText?: string;
      spawnEffectType?: 'heal' | 'damage' | 'xp' | 'gold';
    }
  ) => {
    setActivePoi(null);

    // Add log message
    addLogMessage(effects.logText, 'loot');

    // Spawn event effect if specified
    if (effects.spawnEffectText) {
      const ev = new CustomEvent('spawn-game-effect', {
        detail: {
          x: gameState.playerX,
          y: gameState.playerY,
          text: effects.spawnEffectText,
          type: effects.spawnEffectType || 'heal'
        },
      });
      window.dispatchEvent(ev);
    }

    setGameState((prev) => {
      // 1. Update POI isInteracted state in the current chunk
      const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const activeChunk = prev.overworldChunks[chunkKey];
      let nextChunks = { ...prev.overworldChunks };
      if (activeChunk && activeChunk.pois) {
        const updatedPois = activeChunk.pois.map((poi) => {
          if (poi.id === poiId) {
            return { ...poi, isInteracted: true };
          }
          return poi;
        });
        nextChunks[chunkKey] = {
          ...activeChunk,
          pois: updatedPois
        };
      }

      // 2. Unlock History Scroll Chapter
      const currentChapters = prev.unlockedChapters || [];
      const matchedPoi = activeChunk?.pois?.find(p => p.id === poiId);
      const nextChapters = matchedPoi && !currentChapters.includes(matchedPoi.chapterId)
        ? [...currentChapters, matchedPoi.chapterId]
        : currentChapters;

      // 3. Update player stats (HP, MP, MaxHP, MaxMP, XP, Gold, DEF, Unspent Points, Level-up)
      const bonuses = gameConfig.levelUpBonuses;
      let maxHp = prev.playerStats.maxHp + (effects.maxHpChange || 0);
      let maxMp = prev.playerStats.maxMp + (effects.maxMpChange || 0);
      let hp = Math.min(maxHp, Math.max(1, prev.playerStats.hp + (effects.hpChange || 0)));
      let mp = Math.min(maxMp, Math.max(0, prev.playerStats.mp + (effects.mpChange || 0)));
      let xp = prev.playerStats.xp + (effects.xpChange || 0);
      let gold = Math.max(0, prev.playerStats.gold + (effects.goldChange || 0));
      let def = prev.playerStats.def + (effects.defChange || 0);
      let unspent = (prev.playerStats.unspentPoints || 0) + (effects.unspentPointsChange || 0);
      let level = prev.playerStats.level;
      let nextThreshold = prev.playerStats.nextLevelXp;
      let atk = prev.playerStats.atk;

      while (xp >= nextThreshold) {
        level += 1;
        xp -= nextThreshold;
        nextThreshold = Math.floor(nextThreshold * bonuses.xpThresholdMultiplier);
        maxHp += bonuses.maxHp;
        hp = maxHp;
        maxMp += bonuses.maxMp;
        mp = maxMp;
        atk += bonuses.atk;
        def += bonuses.def;
        unspent += bonuses.attributePoints;
        addLogMessage(`🌟 LEVEL UP! You reached Level ${level}! Got +${bonuses.attributePoints} Attribute Points to spend! (+${bonuses.maxHp} Max HP, +${bonuses.maxMp} Max MP, +${bonuses.def} DEF, +${bonuses.atk} ATK)`, 'craft');
        
        // Spawn graphic / sound
        setTimeout(() => {
          playSound('levelUp');
        }, 120);

        // Trigger Sanctum Relics Draft
        setTimeout(() => {
          setGameState(current => {
            const currentRelics = current.playerStats.relics || [];
            const draft = getRandomRelicDraft(3, currentRelics);
            setActiveRelicDraft(draft);
            return current;
          });
        }, 300);
      }

      // 4. Update Town Reputation
      const currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      const nextRep = Math.min(100, Math.max(0, currentRep + (effects.reputationChange || 0)));
      let nextGuardsHostile = prev.areGuardsHostile;
      const nextLogs = [...prev.logs];
      if (nextGuardsHostile && nextRep >= 50) {
        nextGuardsHostile = false;
        nextLogs.push({
          id: `pardon_${Date.now()}`,
          text: `⚖️ [TOWN NOTICE]: Your crimes have been pardoned over reputation restoration! Town guards are no longer hostile.`,
          type: 'info' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      // 5. Update Materials inventory
      const nextMats = { ...prev.inventoryMaterials };
      if (effects.addMaterials) {
        Object.entries(effects.addMaterials).forEach(([matId, count]) => {
          nextMats[matId] = (nextMats[matId] || 0) + count;
        });
      }

      // 6. Update Catalysts inventory
      const nextCats = { ...prev.inventoryCatalysts };
      if (effects.addCatalysts) {
        Object.entries(effects.addCatalysts).forEach(([catId, count]) => {
          nextCats[catId] = (nextCats[catId] || 0) + count;
        });
      }

      let activeEffectsList = prev.playerStats.activeEffects ? [...prev.playerStats.activeEffects] : [];
      if ((effects as any).applyBlessed) {
        activeEffectsList = activeEffectsList.filter(e => e.id !== 'blessed');
        activeEffectsList.push({
          id: 'blessed',
          name: 'Blessed',
          type: 'buff',
          icon: '✨',
          description: 'Blessed by ley-well spirits. Increases critical strike rate by +10% and luck by +5.',
          turnsRemaining: 30,
          color: '#38bdf8',
          statModifiers: {
            crit: 0.10,
            lck: 5
          }
        });
      }
      if ((effects as any).applyShielded) {
        activeEffectsList = activeEffectsList.filter(e => e.id !== 'shielded');
        activeEffectsList.push({
          id: 'shielded',
          name: 'Shielded',
          type: 'buff',
          icon: '🛡️',
          description: 'A magical kinetic barrier absorbs hits. Increases defense by +3.',
          turnsRemaining: 25,
          color: '#2dd4bf',
          statModifiers: {
            def: 3
          }
        });
      }

      return {
        ...prev,
        overworldChunks: nextChunks,
        unlockedChapters: nextChapters,
        townReputation: nextRep,
        areGuardsHostile: nextGuardsHostile,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        logs: nextLogs,
        playerStats: {
          ...prev.playerStats,
          level,
          xp,
          nextLevelXp: nextThreshold,
          hp,
          maxHp,
          mp,
          maxMp,
          gold,
          atk,
          def,
          unspentPoints: unspent,
          activeEffects: activeEffectsList
        }
      };
    });
  };

  const handleGKeyInteract = () => {
    const px = gameState.playerX;
    const py = gameState.playerY;
    const currentTile = gameState.map[py]?.[px];
    if (!currentTile) return;

    if (currentTile === TileType.DungeonEntrance) {
      descendToDungeonFirstFloor();
      return;
    }
    if (currentTile === TileType.StairsDown) {
      advanceToNextDepth();
      return;
    }
    if (currentTile === TileType.StairsUp) {
      if (gameState.playerStats.depth === 1) {
        climbStairsUpToOverworld();
      } else {
        climbToPreviousDepth();
      }
      return;
    }
    
    const adjacentPoints = [
      { dx: 0, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: -1 },
      { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    // 0. Check adjacent Points of Interest (POIs) - HIGH_IMMERSION INTERACTIVE CHOICE ENCOUNTERS
    if (gameState.isOverworld) {
      const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
      const activeChunk = gameState.overworldChunks[chunkKey];
      if (activeChunk && activeChunk.pois) {
        const matchedPoi = activeChunk.pois.find(poi => {
          return Math.abs(px - poi.x) <= 1 && Math.abs(py - poi.y) <= 1;
        });

        if (matchedPoi && !matchedPoi.isInteracted) {
          // Open the interactive POI overlay modal!
          setActivePoi(matchedPoi);
          playSound('loot');
          addLogMessage(`📖 Landmark discovered: [${matchedPoi.name}]`, 'loot');
          addLogMessage(`📜 Chronicle Lore: "${matchedPoi.historySnippet}"`, 'craft');

          // Highlight the mini-effects
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: matchedPoi.x, y: matchedPoi.y, text: `📖 ${matchedPoi.name}`, type: 'heal' },
          });
          window.dispatchEvent(ev);
          return;
        }
      }
    }

    // 1. Check signs adjacent/underneath
    for (const off of adjacentPoints) {
      const tx = px + off.dx;
      const ty = py + off.dy;
      if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
        if (gameState.map[ty][tx] === TileType.Sign) {
          playSound('loot');

          if (!gameState.isOverworld) {
            addLogMessage(`🪧 Dungeon Marker: "Warning! Danger below. Tread carefully, adventurer."`, "danger");
            return;
          }

          const currentCx = gameState.currentChunkX;
          const currentCy = gameState.currentChunkY;
          const currentHasTown = hasTownAtChunk(currentCx, currentCy);
          const currentTownName = currentHasTown ? getDeterministicTownName(currentCx, currentCy) : '';

          // Special Guild Signpost check
          if (currentHasTown && tx >= 41 && tx <= 45 && ty >= 10 && ty <= 12) {
            addLogMessage(`🪧 Guild House Sign: "RESERVED REAL ESTATE: This empty property has been secured for the Sunder Merchants Guild. Ready to be purchased! Open your Guild/Safehouse tab to buy it."`, 'craft');
            const signEvent = new CustomEvent('spawn-game-effect', {
              detail: { x: tx, y: ty, text: `🪧 Guild House`, type: 'heal' },
            });
            window.dispatchEvent(signEvent);
            return;
          }

          if (currentHasTown) {
            addLogMessage(`🪧 Signpost in ${currentTownName} (Reading pointing arrows...):`, 'craft');
          } else {
            addLogMessage(`🪧 Wilderness Signpost at path intersection (Reading pointing arrows...):`, 'craft');
          }

          // Scan all 4 cardinal directions up to 6 chunks away
          const dirs = [
            { name: 'NORTH ⬆️', dx: 0, dy: -1 },
            { name: 'SOUTH ⬇️', dx: 0, dy: 1 },
            { name: 'WEST ⬅️', dx: -1, dy: 0 },
            { name: 'EAST ➡️', dx: 1, dy: 0 }
          ];

          for (const dir of dirs) {
            let townFound: { name: string; dist: number } | null = null;
            let ruinsFound: { name: string; dist: number } | null = null;
            let dungeonFound: { name: string; dist: number } | null = null;

            for (let dist = 1; dist <= 6; dist++) {
              const nx = currentCx + dir.dx * dist;
              const ny = currentCy + dir.dy * dist;

              // Check if town exists at (nx, ny)
              if (hasTownAtChunk(nx, ny)) {
                if (!townFound) {
                  townFound = {
                    name: getDeterministicTownName(nx, ny),
                    dist
                  };
                }
              } else {
                // Determine biome for authentic dungeon naming using organic, Whittaker-like transitions
                const bName = getOrganicBiome(nx, ny);

                // Choose a beautiful, biome-appropriate dungeon name
                let dungName = 'Deepwood Crypts';
                if (bName === 'desert') dungName = 'Bonesand Tomb';
                else if (bName === 'tundra') dungName = 'Frostbite Caverns';
                else if (bName === 'swamp') dungName = 'Soggy Marsh Abyss';

                if (!dungeonFound) {
                  dungeonFound = { name: dungName, dist };
                }

                const spawnRuins = prng(nx, ny, 150) > 0.55;
                if (spawnRuins && !ruinsFound) {
                  let ruinsName = 'Forgotten Wild Temple';
                  if (bName === 'desert') ruinsName = 'Sun-Baked Obelisk';
                  else if (bName === 'tundra') ruinsName = 'Frozen Cairn Ruins';
                  else if (bName === 'swamp') ruinsName = 'Sunken Keep Ruins';
                  
                  ruinsFound = { name: ruinsName, dist };
                }
              }
            }

            // Report the closest interesting landmark in this direction
            let lineMsg = `   ${dir.name}: `;
            if (townFound) {
              const distLabel = townFound.dist === 1 ? 'next region' : `${townFound.dist} regions ahead`;
              lineMsg += `🏡 ${townFound.name} (${distLabel})`;
            } else if (ruinsFound && ruinsFound.dist <= 3) {
              // Highlight ruins if they are nearby
              const distLabel = ruinsFound.dist === 1 ? 'next region' : `${ruinsFound.dist} regions ahead`;
              lineMsg += `🏛️ ${ruinsFound.name} (${distLabel})`;
            } else if (dungeonFound) {
              const distLabel = dungeonFound.dist === 1 ? 'next region' : `${dungeonFound.dist} regions ahead`;
              lineMsg += `💀 ${dungeonFound.name} (${distLabel})`;
            } else {
              lineMsg += `🌲 Uncharted Lands`;
            }

            addLogMessage(lineMsg, 'loot');
          }
          return;
        }
      }
    }

    // 2. Check beds (adjacent or underneath) inside houses / taverns
    for (const off of adjacentPoints) {
      const tx = px + off.dx;
      const ty = py + off.dy;
      if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
        if (gameState.map[ty][tx] === TileType.Bed) {
          setIsSleepOpen(true);
          return;
        }
      }
    }

    // 3. Harvest sweet berries from forest Bushes (adjacent or underneath)
    for (const off of adjacentPoints) {
      const tx = px + off.dx;
      const ty = py + off.dy;
      if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
        if (gameState.map[ty][tx] === TileType.Bush) {
          if (gameState.biome === 'tundra') {
            playSound('bump');
            addLogMessage(`❄️ [WINTER CHILL]: This bush is frozen stiff and has barren branches. There are no sweet berries harvestable in the winter biome!`, "system");
            return;
          }
          const berryAmt = Math.floor(Math.random() * 3) + 1; // 1-3 berries
          setGameState((prev) => {
            const nextMap = prev.map.map(row => [...row]);
            nextMap[ty][tx] = TileType.Grass; // harvested back to grass!
            const nextMats = { ...prev.inventoryMaterials };
            nextMats['mat_berry'] = (nextMats['mat_berry'] || 0) + berryAmt;
            
            // persist in saved chunk
            const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
            const nextChunks = { ...prev.overworldChunks };
            if (prev.isOverworld && nextChunks[chunkKey]) {
              nextChunks[chunkKey] = {
                ...nextChunks[chunkKey],
                map: nextMap
              };
            }

            return { ...prev, map: nextMap, overworldChunks: nextChunks, inventoryMaterials: nextMats };
          });
          playSound('loot');
          addLogMessage(`🍓 Gathering: You plucked +${berryAmt} Wild Berries from the sweet forest bush!`, "loot");
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: tx, y: ty, text: `+${berryAmt} Berries 🍓`, type: 'heal' },
          });
          window.dispatchEvent(ev);
          return;
        }
      }
    }

    // 4. Check NPCs
    for (const off of adjacentPoints) {
      const tx = px + off.dx;
      const ty = py + off.dy;
      if (gameState.isOverworld && gameState.npcs) {
        const foundNpc = gameState.npcs.find((n) => n.x === tx && n.y === ty);
        if (foundNpc) {
          interactWithNpc(foundNpc);
          return;
        }
      }
    }
    addLogMessage("🔍 Nothing here to adjacent search or interact with.", "system");
  };

  const handleBraceDefense = () => {
    setGameState((prev) => {
      const nextLogs = [...prev.logs, {
        id: `brace_${Date.now()}`,
        text: "🛡️ You brace defensively! Your block power is doubled for this turn.",
        type: 'system' as const,
        timestamp: 'BRACE'
      }];
      return {
        ...prev,
        isBraced: true,
        logs: nextLogs
      };
    });
    makeMove(0, 0); // Consumes a pass turn
  };

  // Autonomous Autoplay / Playtest Agent
  useEffect(() => {
    if (!isAutoplayActive || !isPlaying || isGameOver || isVictory) return;

    const interval = setInterval(() => {
      const pX = gameState.playerX;
      const pY = gameState.playerY;
      const map = gameState.map;
      const enemies = gameState.enemies || [];
      const isWaterWalkable = gameState.playerStats.statuses?.includes('Water Walking') || false;

      // 1. Check health/mana: heal automatically if needed and possible
      if (gameState.playerStats.hp < (gameState.playerStats.maxHp * 0.3) && gameState.playerStats.mp >= 15) {
        // Cast heal spell if available
        setGameState(prev => {
          const stats = { ...prev.playerStats };
          stats.hp = Math.min(stats.maxHp, stats.hp + 25);
          stats.mp -= 15;
          return {
            ...prev,
            playerStats: stats,
            logs: [{
              id: `auto_heal_${Date.now()}`,
              text: "✨ AUTONOMOUS: Cast minor Healing spell to restore +25 HP!",
              type: 'heal',
              timestamp: 'AUTO'
            }, ...prev.logs].slice(0, 200)
          };
        });
        makeMove(0, 0); // Pass turn
        return;
      }

      // 2. Look for nearby enemies (within radius of 8 tiles)
      let targetEnemy: any = null;
      let minEnemyDist = Infinity;
      for (const enemy of enemies) {
        const dist = Math.max(Math.abs(enemy.x - pX), Math.abs(enemy.y - pY));
        if (dist < minEnemyDist && dist <= 8) {
          minEnemyDist = dist;
          targetEnemy = enemy;
        }
      }

      if (targetEnemy) {
        // Attack or step towards the enemy
        const dx = Math.sign(targetEnemy.x - pX);
        const dy = Math.sign(targetEnemy.y - pY);
        makeMove(dx, dy);
        return;
      }

      // 3. Look for nearby chests or loot piles (within radius of 8 tiles)
      const chests = gameState.chests || [];
      const lootPiles = gameState.lootPiles || [];
      let targetFeature: { x: number; y: number } | null = null;
      let minFeatureDist = Infinity;

      for (const chest of chests) {
        if (!chest.opened) {
          const dist = Math.max(Math.abs(chest.x - pX), Math.abs(chest.y - pY));
          if (dist < minFeatureDist && dist <= 8) {
            minFeatureDist = dist;
            targetFeature = { x: chest.x, y: chest.y };
          }
        }
      }

      for (const loot of lootPiles) {
        const dist = Math.max(Math.abs(loot.x - pX), Math.abs(loot.y - pY));
        if (dist < minFeatureDist && dist <= 8) {
          minFeatureDist = dist;
          targetFeature = { x: loot.x, y: loot.y };
        }
      }

      if (targetFeature) {
        const dx = Math.sign(targetFeature.x - pX);
        const dy = Math.sign(targetFeature.y - pY);
        makeMove(dx, dy);
        return;
      }

      // 4. Otherwise: wander randomly on walkable neighbor tiles
      const dirs = [
        [0, -1], [0, 1], [-1, 0], [1, 0],
        [-1, -1], [1, -1], [-1, 1], [1, 1]
      ];

      const walkableDirs = dirs.filter(([dx, dy]) => {
        const tx = pX + dx;
        const ty = pY + dy;
        if (tx < 0 || tx >= LEVEL_WIDTH || ty < 0 || ty >= LEVEL_HEIGHT) return false;
        const tile = map[ty]?.[tx];
        if (!tile) return false;

        const collides = 
          tile === TileType.Wall || 
          tile === TileType.Window || 
          tile === TileType.Tree || 
          tile === TileType.PineTree || 
          tile === TileType.BirchTree || 
          tile === TileType.CopperVein || 
          tile === TileType.IronVein || 
          (tile === TileType.Water && !isWaterWalkable) || 
          tile === TileType.Table;

        return !collides;
      });

      if (walkableDirs.length > 0) {
        const [dx, dy] = walkableDirs[Math.floor(Math.random() * walkableDirs.length)];
        makeMove(dx, dy);
      } else {
        // Pass turn if fully trapped
        makeMove(0, 0);
      }
    }, 350);

    return () => clearInterval(interval);
  }, [isAutoplayActive, isPlaying, isGameOver, isVictory, gameState.playerX, gameState.playerY, gameState.enemies, gameState.chests, gameState.lootPiles, gameState.map, gameState.playerStats]);

  // Keyboard controls controller
  const handleKeyDownRef = useRef<(e: KeyboardEvent) => void>(null as any);

  const handleKeyDownInstance = (e: KeyboardEvent) => {
    // 1. If we are typing in an input, textarea, select, or editable element, completely skip game commands
    if (
      document.activeElement &&
      (document.activeElement.tagName === 'INPUT' ||
       document.activeElement.tagName === 'TEXTAREA' ||
       document.activeElement.tagName === 'SELECT' ||
       document.activeElement.getAttribute('contenteditable') === 'true')
    ) {
      return;
    }

    const key = e.key.toLowerCase();
    const code = e.code;

    // Handle Escape globally to close all modals and panels
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsHelpOpen(false);
      setIsGodPanelOpen(false);
      setIsGmPanelOpen(false);
      setIsHistoryBookOpen(false);
      setIsBestiaryOpen(false);
      setGameState((prev) => ({
        ...prev,
        activeQuestBoardOpen: false,
        activeFollowerIdForInspect: null,
      }));
      return;
    }

    // If game is not playing, or game over, or victory, ignore keyboard inputs
    if (!isPlaying || isGameOver || isVictory) return;

    // If lockpicking or fishing minigame is active, they handle their own key states
    if (isLockpickingOpen || isFishingOpen) return;

    // 2. Shortcut keys to toggle panels (accessible anytime while playing)
    switch (key) {
      case 'f1':
        e.preventDefault();
        setIsHelpOpen((p) => !p);
        return;
      case 'c':
        e.preventDefault();
        setActiveTab('inventory');
        return;
      case 'p':
        e.preventDefault();
        setIsGodPanelOpen((p) => !p);
        return;
      case 'o':
        e.preventDefault();
        setIsGmPanelOpen((p) => !p);
        return;
      case 'h':
        e.preventDefault();
        setIsHistoryBookOpen((p) => !p);
        return;
      case 'v':
      case 'k':
        e.preventDefault();
        setActiveTab((prev) => prev === 'bestiary' ? 'dungeon' : 'bestiary');
        return;
    }

    // 3. Prevent movement or interaction commands if ANY overlay panel is open, or if the player is in another tab (Forge, Market, etc.)
    const isAnyOverlayOpen =
      isHelpOpen ||
      isGodPanelOpen ||
      isGmPanelOpen ||
      isHistoryBookOpen ||
      isBestiaryOpen;

    if (isAnyOverlayOpen || activeTab !== 'dungeon') {
      return;
    }

    // Prevent browser default scroll for key inputs on active game screen
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 's', 'a', 'd', 'pageup', 'pagedown', 'home', 'end', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
      e.preventDefault();
    }

    const currentGS = gameStateRef.current;

    // Core actions and movement (supporting WASD, Arrows, Top-row Numbers, and Numpad keys with NumLock ON/OFF)
    switch (key) {
      case 'b':
        e.preventDefault();
        handleBraceDefense();
        break;
      case '<':
        e.preventDefault();
        (() => {
          const px = currentGS.playerX;
          const py = currentGS.playerY;
          const currentTile = currentGS.map[py][px];
          if (currentTile === TileType.StairsUp) {
            if (currentGS.playerStats.depth === 1) {
              climbStairsUpToOverworld();
            } else {
              climbToPreviousDepth();
            }
          } else {
            addLogMessage("🪜 You need to stand on Stairs Up (<) to climb out / up.", "system");
          }
        })();
        break;
      case '>':
        e.preventDefault();
        (() => {
          const px = currentGS.playerX;
          const py = currentGS.playerY;
          const currentTile = currentGS.map[py][px];
          if (currentTile === TileType.StairsDown) {
            advanceToNextDepth();
          } else if (currentTile === TileType.DungeonEntrance) {
            descendToDungeonFirstFloor();
          } else {
            addLogMessage("🪜 You need to stand on Stairs Down (>) or Dungeon Entrance to descend.", "system");
          }
        })();
        break;
      case 'g':
        e.preventDefault();
        handleGKeyInteract();
        break;

      // Up / Orthogonal North
      case 'arrowup':
      case 'w':
      case '8':
        makeMove(0, -1);
        break;

      // Down / Orthogonal South
      case 'arrowdown':
      case 's':
      case '2':
        makeMove(0, 1);
        break;

      // Left / Orthogonal West
      case 'arrowleft':
      case 'a':
      case '4':
        makeMove(-1, 0);
        break;

      // Right / Orthogonal East
      case 'arrowright':
      case 'd':
      case '6':
        makeMove(1, 0);
        break;

      // Wait / Idle turn
      case ' ':
      case '.':
      case '5':
        makeMove(0, 0);
        break;

      // Up-Left / Diagonal North-West
      case '7':
      case 'home':
        makeMove(-1, -1);
        break;

      // Up-Right / Diagonal North-East
      case '9':
      case 'pageup':
        makeMove(1, -1);
        break;

      // Down-Left / Diagonal South-West
      case '1':
      case 'end':
        makeMove(-1, 1);
        break;

      // Down-Right / Diagonal South-East
      case '3':
      case 'pagedown':
        makeMove(1, 1);
        break;
    }
  };

  handleKeyDownRef.current = handleKeyDownInstance;

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (handleKeyDownRef.current) {
        handleKeyDownRef.current(e);
      }
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, []);

  // Equipped Gear Operations
  const handleEquipItem = (item: EquipmentItem, hand?: 'right' | 'left') => {
    playSound('loot');
    
    setGameState((prev) => {
      let updatedStats = { ...prev.playerStats };
      let itemRemoved = false;
      let updatedInventory = prev.equipmentInventory.filter((it) => {
        if (!itemRemoved && (it === item || it.id === item.id)) {
          itemRemoved = true;
          return false;
        }
        return true;
      });
      let nextArmor = prev.equippedArmor;
      let nextHelmet = prev.equippedHelmet;
      let nextGloves = prev.equippedGloves;
      let nextBoots = prev.equippedBoots;
      let nextShield = prev.equippedShield;
      let nextAmulet = prev.equippedAmulet;
      let nextWeapon = prev.currentWeapon;

      if (item.subType === 'Scroll') {
        if (item.id.includes("scroll_spell_")) {
          const template = SPELL_SCROLLS.find(t => item.id.includes(t.id));
          const requiredMp = template ? template.mpCost : 20;
          if (prev.playerStats.mp < requiredMp) {
            setTimeout(() => {
              addLogMessage(`❌ Insufficient Mana! You need at least ${requiredMp} MP to channel the elemental forces of ${item.name}. (Current MP: ${prev.playerStats.mp}/${prev.playerStats.maxMp})`, 'system');
            }, 50);
            return prev;
          }
          setTimeout(() => {
            setActiveTargetedScroll(item);
            setActiveTab('dungeon');
            addLogMessage(`✨ [SPELL SCROLL READY]: Click any enemy on the board to cast ${item.name}! (Cost: ${requiredMp} MP. Tap ESC or Cancel to abort)`, 'info');
          }, 50);
          return prev;
        }

        if (item.name.includes("Recall") || item.id.includes("recall_town")) {
          if (prev.playerStats.mp < 15) {
            setTimeout(() => {
              addLogMessage(`❌ Insufficient Mana! You need at least 15 MP to channel the dimensional magic of the Scroll of Recall. (Current MP: ${prev.playerStats.mp}/${prev.playerStats.maxMp})`, 'system');
            }, 50);
            return prev;
          }
          setTimeout(() => {
            setActiveRecallScroll(item);
          }, 50);
          return prev;
        }

        if (prev.isOverworld) {
          setTimeout(() => {
            addLogMessage(`❌ The Scroll of Escape can only be read inside a dark dungeon to flee back to the surface entrance!`, 'system');
          }, 50);
          return prev;
        }

        setTimeout(() => {
          playSound('spell');
          addLogMessage(`🔮 You read the Scroll of Escape! Bright protective portals of stardust wrap around you and rip you out of the Abyss back to the safety of the surface entrance!`, 'danger');
        }, 50);

        const exChunkX = prev.dungeonEntranceChunkX ?? 0;
        const exChunkY = prev.dungeonEntranceChunkY ?? 0;
        const exPlayerX = prev.dungeonEntrancePlayerX ?? 25;
        const exPlayerY = prev.dungeonEntrancePlayerY ?? 15;

        // Save current Dungeon Level state before discarding active play coordinates
        const currentDepth = prev.playerStats.depth;
        const key = `${exChunkX},${exChunkY}_depth-${currentDepth}`;

        const saved: DungeonLevelState = {
          depth: currentDepth,
          chunkX: exChunkX,
          chunkY: exChunkY,
          map: prev.map,
          discovered: prev.discovered,
          visible: prev.visible,
          enemies: prev.enemies,
          traps: prev.traps,
          chests: prev.chests,
          lootPiles: prev.lootPiles || [],
          corpses: prev.corpses || [],
          bloodSplatters: prev.bloodSplatters || [],
          props: prev.dungeonProps || [],
        };

        const updatedDungeonLevels = {
          ...prev.dungeonLevels,
          [key]: saved,
        };

        const targetChunkKey = `${exChunkX},${exChunkY}`;
        let targetChunk = prev.overworldChunks[targetChunkKey];
        let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
        let nextOverworldChunks = { ...prev.overworldChunks };
        if (!targetChunk) {
          targetChunk = generateOverworldChunk(exChunkX, exChunkY, LEVEL_WIDTH, LEVEL_HEIGHT, nextSpawnedCats, prev.spawnedSeppo, prev.playerStats, prev.currentWeapon);
          targetChunk.npcs.forEach(n => {
            if (n.id?.startsWith('npc_cat_')) {
              const catName = n.name.split(' (')[0];
              if (!nextSpawnedCats.includes(catName)) {
                nextSpawnedCats.push(catName);
              }
            }
          });
          nextOverworldChunks[targetChunkKey] = targetChunk;
        }

        const fov = computeFOV(exPlayerX, exPlayerY, targetChunk.map, 6);
        const discovered = targetChunk.map.map((row, y) =>
          row.map((cell, x) => ((targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
        );

        return {
          ...prev,
          isOverworld: true,
          currentChunkX: exChunkX,
          currentChunkY: exChunkY,
          overworldChunks: nextOverworldChunks,
          map: targetChunk.map,
          discovered: discovered,
          visible: fov,
          enemies: targetChunk.enemies,
          traps: targetChunk.traps,
          chests: targetChunk.chests,
          lootPiles: targetChunk.lootPiles || [],
          corpses: targetChunk.corpses || [],
          bloodSplatters: targetChunk.bloodSplatters || [],
          dungeonProps: targetChunk.props || [],
          spawnedCats: nextSpawnedCats,
          dungeonLevels: updatedDungeonLevels,
          equipmentInventory: updatedInventory,
          playerStats: {
            ...prev.playerStats,
            x: exPlayerX,
            y: exPlayerY,
            depth: 0
          }
        };
      } else if (item.type === 'armor' && item.subType !== 'Shield') {
        // Unequip currently worn armor of this subtype first
        let currentWorn: EquipmentItem | null = null;
        const equippedWithDurability: EquipmentItem = {
          ...item,
          durability: item.durability ?? 100,
          maxDurability: item.maxDurability ?? 100
        };
        if (item.subType === 'Helmet') {
          currentWorn = prev.equippedHelmet;
          nextHelmet = equippedWithDurability;
        } else if (item.subType === 'Gloves') {
          currentWorn = prev.equippedGloves;
          nextGloves = equippedWithDurability;
        } else if (item.subType === 'Amulet') {
          currentWorn = prev.equippedAmulet;
          nextAmulet = equippedWithDurability;
        } else if (item.subType === 'Boots') {
          currentWorn = prev.equippedBoots;
          nextBoots = equippedWithDurability;
        } else {
          currentWorn = prev.equippedArmor;
          nextArmor = equippedWithDurability;
        }

        if (currentWorn) {
          updatedInventory.push(currentWorn);
          updatedStats.def = Math.max(0, updatedStats.def - currentWorn.defense);
          if (currentWorn.statBonuses) {
            if (currentWorn.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - currentWorn.statBonuses.str);
            if (currentWorn.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - currentWorn.statBonuses.dex);
            if (currentWorn.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - currentWorn.statBonuses.int);
            if (currentWorn.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - currentWorn.statBonuses.lck);
            if (currentWorn.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - currentWorn.statBonuses.cha);
          }
          addLogMessage(`🛡️ Unequipped ${currentWorn.name} (-${currentWorn.defense} DEF)`, 'system');
        }

        updatedStats.def += item.defense;
        if (item.statBonuses) {
          if (item.statBonuses.str) updatedStats.str = (updatedStats.str || 10) + item.statBonuses.str;
          if (item.statBonuses.dex) updatedStats.dex = (updatedStats.dex || 10) + item.statBonuses.dex;
          if (item.statBonuses.int) updatedStats.int = (updatedStats.int || 10) + item.statBonuses.int;
          if (item.statBonuses.lck) updatedStats.lck = (updatedStats.lck || 10) + item.statBonuses.lck;
          if (item.statBonuses.cha) updatedStats.cha = (updatedStats.cha || 10) + item.statBonuses.cha;
          
          const bonusesText = Object.entries(item.statBonuses)
              .map(([stat, val]) => `+${val} ${stat.toUpperCase()}`)
              .join(', ');
          addLogMessage(`🛡️ Equipped ${item.name}! Defence increased by +${item.defense}! Stat bonus: ${bonusesText}`, 'craft');
        } else {
          addLogMessage(`🛡️ Equipped ${item.name}! Defence increased by +${item.defense}!`, 'craft');
        }
      } else if (item.type === 'weapon' || item.subType === 'Shield') {
        // Generic Hand Slot Equipping (weapon to right hand, shield to left hand by default unless hand specified)
        const targetHand = hand || (item.subType === 'Shield' ? 'left' : 'right');
        const equippedWithDurability: EquipmentItem = {
          ...item,
          durability: item.durability ?? 100,
          maxDurability: item.maxDurability ?? 100
        };

        if (targetHand === 'right') {
          // If equipping a 2-handed weapon to right hand, automatically unequip left hand item!
          if (isTwoHandedWeapon(item)) {
            let currentLeft = prev.equippedShield;
            if (currentLeft) {
              updatedStats.def = Math.max(0, updatedStats.def - (currentLeft.defense ?? 0));
              if (currentLeft.statBonuses) {
                if (currentLeft.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - currentLeft.statBonuses.str);
                if (currentLeft.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - currentLeft.statBonuses.dex);
                if (currentLeft.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - currentLeft.statBonuses.int);
                if (currentLeft.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - currentLeft.statBonuses.lck);
                if (currentLeft.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - currentLeft.statBonuses.cha);
              }
              updatedInventory.push(currentLeft);
              nextShield = null;
              setTimeout(() => {
                addLogMessage(`🛡️ Unequipped ${currentLeft!.name} from Left Hand (2-Handed weapon takes both hands).`, 'system');
              }, 50);
            }
          }

          // Unequip currently worn R-Hand item
          let currentWorn = prev.currentWeapon;
          if (currentWorn) {
            updatedStats.def = Math.max(0, updatedStats.def - (currentWorn.defense ?? 0));
            if (currentWorn.statBonuses) {
              if (currentWorn.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - currentWorn.statBonuses.str);
              if (currentWorn.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - currentWorn.statBonuses.dex);
              if (currentWorn.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - currentWorn.statBonuses.int);
              if (currentWorn.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - currentWorn.statBonuses.lck);
              if (currentWorn.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - currentWorn.statBonuses.cha);
            }
            const returnedItem: EquipmentItem = {
              id: currentWorn.id,
              name: currentWorn.name,
              type: (currentWorn.type as any) || (currentWorn.baseType === ('Shield' as any) ? 'armor' : 'weapon'),
              subType: (currentWorn.baseType as any) || 'Sword',
              defense: currentWorn.defense ?? 0,
              damage: currentWorn.damage ?? 0,
              critChance: currentWorn.critChance ?? 0,
              range: currentWorn.range ?? 1,
              color: currentWorn.color,
              description: currentWorn.effectDescription || '',
              value: (currentWorn as any).value ?? 25,
              durability: currentWorn.durability ?? 100,
              maxDurability: currentWorn.maxDurability ?? 100,
              upgradeLevel: currentWorn.upgradeLevel,
              isMutated: currentWorn.isMutated,
              mutationCount: currentWorn.mutationCount,
              traits: currentWorn.traits,
              statBonuses: currentWorn.statBonuses
            };
            updatedInventory.push(returnedItem);
            setTimeout(() => {
              addLogMessage(`⚔️ Unequipped ${currentWorn.name} from Right Hand.`, 'system');
            }, 50);
          }

          nextWeapon = {
            id: equippedWithDurability.id,
            name: equippedWithDurability.name,
            baseType: (equippedWithDurability.subType as any) || WeaponBaseType.Sword,
            materialUsed: (equippedWithDurability as any).materialUsed || { id: 'mat_iron', name: 'Scrap Iron', color: '#475569', baseDamageMod: 0, critMod: 0, extraProperty: 'NONE' },
            catalystUsed: (equippedWithDurability as any).catalystUsed || { id: 'cat_plain', type: CatalystType.Shadow, name: 'Normal', statusEffectChance: 0, statusDuration: 0, color: '#94a3b8', damageType: 'Physical' },
            damage: equippedWithDurability.damage || 0,
            critChance: equippedWithDurability.critChance || 0.1,
            range: equippedWithDurability.range || 1,
            manaCost: equippedWithDurability.subType === WeaponBaseType.Staff ? 4 : (equippedWithDurability.subType === WeaponBaseType.Wand ? 3 : 0),
            color: equippedWithDurability.color,
            effectDescription: equippedWithDurability.description,
            durability: equippedWithDurability.durability,
            maxDurability: equippedWithDurability.maxDurability,
            upgradeLevel: equippedWithDurability.upgradeLevel,
            isMutated: equippedWithDurability.isMutated,
            mutationCount: equippedWithDurability.mutationCount,
            traits: equippedWithDurability.traits,
            defense: equippedWithDurability.defense || 0,
            type: equippedWithDurability.type,
            statBonuses: equippedWithDurability.statBonuses
          };

          updatedStats.def += equippedWithDurability.defense || 0;
          if (equippedWithDurability.statBonuses) {
            if (equippedWithDurability.statBonuses.str) updatedStats.str = (updatedStats.str || 10) + equippedWithDurability.statBonuses.str;
            if (equippedWithDurability.statBonuses.dex) updatedStats.dex = (updatedStats.dex || 10) + equippedWithDurability.statBonuses.dex;
            if (equippedWithDurability.statBonuses.int) updatedStats.int = (updatedStats.int || 10) + equippedWithDurability.statBonuses.int;
            if (equippedWithDurability.statBonuses.lck) updatedStats.lck = (updatedStats.lck || 10) + equippedWithDurability.statBonuses.lck;
            if (equippedWithDurability.statBonuses.cha) updatedStats.cha = (updatedStats.cha || 10) + equippedWithDurability.statBonuses.cha;
          }

          setTimeout(() => {
            addLogMessage(`⚡ Equipped ${equippedWithDurability.name} to Right Hand!`, 'craft');
          }, 50);
        } else {
          // targetHand === 'left'
          // If current Right Hand weapon is 2-Handed, unequip it to inventory because Left Hand is now occupied
          if (isTwoHandedWeapon(prev.currentWeapon)) {
            let currentRight = prev.currentWeapon!;
            updatedStats.def = Math.max(0, updatedStats.def - (currentRight.defense ?? 0));
            if (currentRight.statBonuses) {
              if (currentRight.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - currentRight.statBonuses.str);
              if (currentRight.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - currentRight.statBonuses.dex);
              if (currentRight.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - currentRight.statBonuses.int);
              if (currentRight.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - currentRight.statBonuses.lck);
              if (currentRight.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - currentRight.statBonuses.cha);
            }
            const returnedRightItem: EquipmentItem = {
              id: currentRight.id,
              name: currentRight.name,
              type: (currentRight.type as any) || (currentRight.baseType === ('Shield' as any) ? 'armor' : 'weapon'),
              subType: (currentRight.baseType as any) || 'Sword',
              defense: currentRight.defense ?? 0,
              damage: currentRight.damage ?? 0,
              critChance: currentRight.critChance ?? 0,
              range: currentRight.range ?? 1,
              color: currentRight.color,
              description: currentRight.effectDescription || '',
              value: (currentRight as any).value ?? 25,
              durability: currentRight.durability ?? 100,
              maxDurability: currentRight.maxDurability ?? 100,
              upgradeLevel: currentRight.upgradeLevel,
              isMutated: currentRight.isMutated,
              mutationCount: currentRight.mutationCount,
              traits: currentRight.traits,
              statBonuses: currentRight.statBonuses
            };
            updatedInventory.push(returnedRightItem);
            nextWeapon = null;
            setTimeout(() => {
              addLogMessage(`⚔️ Unequipped 2-Handed ${currentRight.name} from Right Hand (Left Hand occupied).`, 'system');
            }, 50);
          }

          let currentWorn = prev.equippedShield;
          if (currentWorn) {
            updatedStats.def = Math.max(0, updatedStats.def - (currentWorn.defense ?? 0));
            if (currentWorn.statBonuses) {
              if (currentWorn.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - currentWorn.statBonuses.str);
              if (currentWorn.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - currentWorn.statBonuses.dex);
              if (currentWorn.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - currentWorn.statBonuses.int);
              if (currentWorn.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - currentWorn.statBonuses.lck);
              if (currentWorn.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - currentWorn.statBonuses.cha);
            }
            updatedInventory.push(currentWorn);
            setTimeout(() => {
              addLogMessage(`🛡️ Unequipped ${currentWorn.name} from Left Hand.`, 'system');
            }, 50);
          }

          nextShield = equippedWithDurability;

          updatedStats.def += equippedWithDurability.defense || 0;
          if (equippedWithDurability.statBonuses) {
            if (equippedWithDurability.statBonuses.str) updatedStats.str = (updatedStats.str || 10) + equippedWithDurability.statBonuses.str;
            if (equippedWithDurability.statBonuses.dex) updatedStats.dex = (updatedStats.dex || 10) + equippedWithDurability.statBonuses.dex;
            if (equippedWithDurability.statBonuses.int) updatedStats.int = (updatedStats.int || 10) + equippedWithDurability.statBonuses.int;
            if (equippedWithDurability.statBonuses.lck) updatedStats.lck = (updatedStats.lck || 10) + equippedWithDurability.statBonuses.lck;
            if (equippedWithDurability.statBonuses.cha) updatedStats.cha = (updatedStats.cha || 10) + equippedWithDurability.statBonuses.cha;
          }

          setTimeout(() => {
            addLogMessage(`⚡ Equipped ${equippedWithDurability.name} to Left Hand!`, 'craft');
          }, 50);
        }
      }

      return {
        ...prev,
        equippedArmor: nextArmor,
        equippedHelmet: nextHelmet,
        equippedGloves: nextGloves,
        equippedBoots: nextBoots,
        equippedShield: nextShield,
        equippedAmulet: nextAmulet,
        currentWeapon: nextWeapon,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
  };

  const handleUnequipArmor = () => {
    if (!gameState.equippedArmor) return;
    playSound('loot');
    const armor = gameState.equippedArmor;
    
    setGameState((prev) => {
      const updatedInventory = [...prev.equipmentInventory, armor];
      const updatedStats = { ...prev.playerStats };
      updatedStats.def = Math.max(0, updatedStats.def - armor.defense);
      if (armor.statBonuses) {
        if (armor.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - armor.statBonuses.str);
        if (armor.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - armor.statBonuses.dex);
        if (armor.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - armor.statBonuses.int);
        if (armor.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - armor.statBonuses.lck);
        if (armor.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - armor.statBonuses.cha);
      }

      return {
        ...prev,
        equippedArmor: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    addLogMessage(`🛡️ Unequipped ${armor.name}.`, 'system');
  };

  const handleUnequipHelmet = () => {
    if (!gameState.equippedHelmet) return;
    playSound('loot');
    const helmet = gameState.equippedHelmet;
    
    setGameState((prev) => {
      const updatedInventory = [...prev.equipmentInventory, helmet];
      const updatedStats = { ...prev.playerStats };
      updatedStats.def = Math.max(0, updatedStats.def - helmet.defense);
      if (helmet.statBonuses) {
        if (helmet.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - helmet.statBonuses.str);
        if (helmet.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - helmet.statBonuses.dex);
        if (helmet.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - helmet.statBonuses.int);
        if (helmet.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - helmet.statBonuses.lck);
        if (helmet.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - helmet.statBonuses.cha);
      }

      return {
        ...prev,
        equippedHelmet: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    addLogMessage(`🛡️ Unequipped ${helmet.name}.`, 'system');
  };

  const handleUnequipGloves = () => {
    if (!gameState.equippedGloves) return;
    playSound('loot');
    const gloves = gameState.equippedGloves;
    
    setGameState((prev) => {
      const updatedInventory = [...prev.equipmentInventory, gloves];
      const updatedStats = { ...prev.playerStats };
      updatedStats.def = Math.max(0, updatedStats.def - gloves.defense);
      if (gloves.statBonuses) {
        if (gloves.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - gloves.statBonuses.str);
        if (gloves.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - gloves.statBonuses.dex);
        if (gloves.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - gloves.statBonuses.int);
        if (gloves.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - gloves.statBonuses.lck);
        if (gloves.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - gloves.statBonuses.cha);
      }

      return {
        ...prev,
        equippedGloves: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    addLogMessage(`🛡️ Unequipped ${gloves.name}.`, 'system');
  };

  const handleUnequipBoots = () => {
    if (!gameState.equippedBoots) return;
    playSound('loot');
    const boots = gameState.equippedBoots;
    
    setGameState((prev) => {
      const updatedInventory = [...prev.equipmentInventory, boots];
      const updatedStats = { ...prev.playerStats };
      updatedStats.def = Math.max(0, updatedStats.def - boots.defense);
      if (boots.statBonuses) {
        if (boots.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - boots.statBonuses.str);
        if (boots.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - boots.statBonuses.dex);
        if (boots.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - boots.statBonuses.int);
        if (boots.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - boots.statBonuses.lck);
        if (boots.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - boots.statBonuses.cha);
      }

      return {
        ...prev,
        equippedBoots: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    addLogMessage(`🛡️ Unequipped ${boots.name}.`, 'system');
  };

  const handleUnequipShield = () => {
    if (!gameState.equippedShield) return;
    playSound('loot');
    const shield = gameState.equippedShield;
    
    setGameState((prev) => {
      const updatedInventory = [...prev.equipmentInventory, shield];
      const updatedStats = { ...prev.playerStats };
      updatedStats.def = Math.max(0, updatedStats.def - shield.defense);
      if (shield.statBonuses) {
        if (shield.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - shield.statBonuses.str);
        if (shield.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - shield.statBonuses.dex);
        if (shield.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - shield.statBonuses.int);
        if (shield.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - shield.statBonuses.lck);
        if (shield.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - shield.statBonuses.cha);
      }

      return {
        ...prev,
        equippedShield: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    addLogMessage(`🛡️ Unequipped ${shield.name}.`, 'system');
  };

  const handleUnequipAmulet = () => {
    if (!gameState.equippedAmulet) return;
    playSound('loot');
    const amulet = gameState.equippedAmulet;
    
    setGameState((prev) => {
      const updatedInventory = [...prev.equipmentInventory, amulet];
      const updatedStats = { ...prev.playerStats };
      updatedStats.def = Math.max(0, updatedStats.def - amulet.defense);
      if (amulet.statBonuses) {
        if (amulet.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - amulet.statBonuses.str);
        if (amulet.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - amulet.statBonuses.dex);
        if (amulet.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - amulet.statBonuses.int);
        if (amulet.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - amulet.statBonuses.lck);
        if (amulet.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - amulet.statBonuses.cha);
      }

      return {
        ...prev,
        equippedAmulet: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    addLogMessage(`🛡️ Unequipped ${amulet.name}.`, 'system');
  };

  const handleUnequipWeapon = () => {
    if (!gameState.currentWeapon) return;
    playSound('loot');
    const weapon = gameState.currentWeapon;

    setGameState((prev) => {
      const returnedItem: EquipmentItem = {
        id: weapon.id,
        name: weapon.name,
        type: (weapon.type as any) || 'weapon',
        subType: (weapon.baseType as any) || 'Sword',
        defense: weapon.defense ?? 0,
        damage: weapon.damage,
        critChance: weapon.critChance,
        range: weapon.range,
        color: weapon.color,
        description: weapon.effectDescription,
        value: (weapon as any).value ?? 25,
        durability: weapon.durability ?? 100,
        maxDurability: weapon.maxDurability ?? 100,
        upgradeLevel: weapon.upgradeLevel,
        isMutated: weapon.isMutated,
        mutationCount: weapon.mutationCount,
        traits: weapon.traits,
        statBonuses: weapon.statBonuses,
      };

      const updatedStats = { ...prev.playerStats };
      if (weapon.statBonuses) {
        if (weapon.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - weapon.statBonuses.str);
        if (weapon.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - weapon.statBonuses.dex);
        if (weapon.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - weapon.statBonuses.int);
        if (weapon.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - weapon.statBonuses.lck);
        if (weapon.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - weapon.statBonuses.cha);
      }
      if (weapon.defense) {
        updatedStats.def = Math.max(0, updatedStats.def - weapon.defense);
      }

      return {
        ...prev,
        currentWeapon: null,
        equipmentInventory: [...prev.equipmentInventory, returnedItem],
        playerStats: updatedStats
      };
    });
    addLogMessage(`⚔️ Stashed away ${weapon.name} into inventory bag.`, 'system');
  };

  const handleDiscardItem = (id: string, qty: number = 1) => {
    setGameState((prev) => {
      const item = prev.equipmentInventory.find(i => i.id === id);
      if (!item) return prev;
      const itemQty = item.quantity || 1;
      const discardCount = Math.min(itemQty, Math.max(1, qty));
      const totalSaved = (getItemWeight(item) * discardCount).toFixed(1);
      addLogMessage(`🗑️ Discarded ${discardCount}x ${item.name} into the abyss to lighten your load (Saved: ${totalSaved} kg).`, 'system');
      return {
        ...prev,
        equipmentInventory: consumeItemFromInventory(prev.equipmentInventory, id, discardCount)
      };
    });
  };

  const handleDiscardMaterial = (id: string, qty: number = 1) => {
    setGameState((prev) => {
      const count = prev.inventoryMaterials[id] || 0;
      if (count <= 0) return prev;
      const discardCount = Math.min(count, Math.max(1, qty));
      const totalSaved = (getMaterialUnitWeight(id) * discardCount).toFixed(1);
      addLogMessage(`🗑️ Discarded ${discardCount}x material unit(s) to lighten weight (Saved: ${totalSaved} kg).`, 'system');
      return {
        ...prev,
        inventoryMaterials: { ...prev.inventoryMaterials, [id]: count - discardCount }
      };
    });
  };

  const handleDiscardCatalyst = (id: string, qty: number = 1) => {
    setGameState((prev) => {
      const count = prev.inventoryCatalysts[id] || 0;
      if (count <= 0) return prev;
      const discardCount = Math.min(count, Math.max(1, qty));
      const totalSaved = (getMaterialUnitWeight(id) * discardCount).toFixed(1);
      addLogMessage(`🗑️ Discarded ${discardCount}x catalyst unit(s) to lighten weight (Saved: ${totalSaved} kg).`, 'system');
      return {
        ...prev,
        inventoryCatalysts: { ...prev.inventoryCatalysts, [id]: count - discardCount }
      };
    });
  };

  const handleAcceptQuest = (questId: string) => {
    setGameState((prev) => {
      const updatedQuests = prev.quests.map((q) => {
        if (q.id === questId) {
          return { ...q, status: 'active' as const };
        }
        return q;
      });

      const updatedLogs = [...prev.logs, {
        id: `q_accept_${Date.now()}`,
        text: `📜 QUEST ACCEPTED: Accepted "${prev.quests.find(q => q.id === questId)?.title}"! Check goals at the local Quest Board or complete it with the quest giver.`,
        type: 'info' as const,
        timestamp: 'QUEST'
      }];

      let nextEnemies = [...prev.enemies];
      if (questId === 'q_bandit_raid') {
        const pX = prev.playerX;
        const pY = prev.playerY;
        const offsets = [
          { dx: -4, dy: -4 },
          { dx: 4, dy: -3 },
          { dx: -5, dy: 4 }
        ];

        offsets.forEach((off, idx) => {
          const ex = pX + off.dx;
          const ey = pY + off.dy;
          nextEnemies.push({
            id: `quest_bandit_${idx}_${Date.now()}`,
            x: ex,
            y: ey,
            type: 'Brute' as any,
            name: `Bandit Raider #${idx + 1}`,
            hp: 25,
            maxHp: 25,
            atk: 5,
            def: 1,
            range: 1,
            speed: 1,
            color: '#ef4444',
            char: '⚔',
            state: EnemyState.Chasing,
            isElite: false,
            patrolPath: [],
            patrolIndex: 0,
            debuffs: []
          });
        });
        
        updatedLogs.push({
          id: `q_spawn_${Date.now()}`,
          text: `⚠️ WARN: 3 hostile Bandit Raiders have appeared in the village outskirts! Defeat them!`,
          type: 'danger' as const,
          timestamp: 'AMBUSH'
        });
      } else if (questId === 'q_pest_control') {
        const pX = prev.playerX;
        const pY = prev.playerY;
        const offsets = [
          { dx: -3, dy: -2 },
          { dx: 3, dy: -2 },
          { dx: -2, dy: 3 }
        ];

        offsets.forEach((off, idx) => {
          const ex = pX + off.dx;
          const ey = pY + off.dy;
          nextEnemies.push({
            id: `quest_rat_${idx}_${Date.now()}`,
            x: ex,
            y: ey,
            type: EnemyType.Rat,
            name: `Quest Sewer Rat #${idx + 1}`,
            hp: 10,
            maxHp: 10,
            atk: 2,
            def: 0,
            range: 1,
            speed: 0.8,
            color: '#808080',
            char: '🐀',
            state: EnemyState.Chasing,
            isElite: false,
            patrolPath: [],
            patrolIndex: 0,
            debuffs: []
          } as any);
        });

        updatedLogs.push({
          id: `q_pest_spawn_${Date.now()}`,
          text: `⚠️ WARN: 3 weak Quest Sewer Rats have scurried into your immediate vicinity! Click on them to strike them down!`,
          type: 'danger' as const,
          timestamp: 'AMBUSH'
        });
      }

      return {
        ...prev,
        quests: updatedQuests,
        enemies: nextEnemies,
        logs: updatedLogs
      };
    });
  };

  const handleTurnInQuest = (questId: string) => {
    const quest = gameState.quests.find(q => q.id === questId);
    if (!quest) return;

    if (quest.id === 'q_outlaw_pardon') {
      const currentGold = gameState.playerStats.gold;
      const cost = quest.targetCount || 200;
      if (currentGold < cost) {
        setGameState(prev => ({
          ...prev,
          logs: [...prev.logs, {
            id: `q_err_${Date.now()}`,
            text: `❌ ERROR: Insufficient Gold! You need ${cost} Gold to donate to the poorbox.`,
            type: 'system' as const,
            timestamp: 'QUEST'
          }]
        }));
        return;
      }

      setGameState((prev) => {
        const updatedQuests = prev.quests.map((q) => {
          if (q.id === questId) return { ...q, status: 'turned_in' as const };
          return q;
        });

        const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const nextRep = Math.min(100, prevRep + 35);
        
        const nextStats = {
          ...prev.playerStats,
          gold: Math.max(0, prev.playerStats.gold - cost)
        };

        const nextLogs = [...prev.logs, {
          id: `q_complete_${Date.now()}`,
          text: `⚖️ PARDON GRANTED: You donated ${cost} Gold to the Church. Your crimes are pardoned! (+35 Town Reputation)`,
          type: 'loot' as const,
          timestamp: 'QUEST'
        }];

        return {
          ...prev,
          quests: updatedQuests,
          playerStats: nextStats,
          townReputation: nextRep,
          logs: nextLogs
        };
      });
      return;
    }

    if (quest.type === 'gather') {
      const itemKey = quest.targetItem || 'mat_iron';
      const userCount = gameState.inventoryMaterials[itemKey] || 0;
      const needed = quest.targetCount || 5;

      if (userCount < needed) {
        setGameState(prev => ({
          ...prev,
          logs: [...prev.logs, {
            id: `q_err_${Date.now()}`,
            text: `❌ ERROR: Insufficient materials! You need ${needed}x items, you only carry ${userCount} in your bag.`,
            type: 'system' as const,
            timestamp: 'QUEST'
          }]
        }));
        return;
      }

      setGameState((prev) => {
        const nextMats = { ...prev.inventoryMaterials };
        nextMats[itemKey] = Math.max(0, nextMats[itemKey] - needed);

        const updatedQuests = prev.quests.map((q) => {
          if (q.id === questId) return { ...q, status: 'turned_in' as const };
          return q;
        });

        const repReward = questId === 'q_iron_gather' ? 15 : (questId === 'q_apothecary_supply' ? 12 : (questId === 'q_mithril_heist' ? 25 : 10));
        const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const nextRep = Math.min(100, prevRep + repReward);

        const nextStats = {
          ...prev.playerStats,
          gold: prev.playerStats.gold + quest.rewardGold
        };

        const nextLogs = [...prev.logs, {
          id: `q_complete_${Date.now()}`,
          text: `🎉 QUEST COMPLETED: Delivered materials! You received +${quest.rewardGold} Gold and +${repReward} Town Reputation!`,
          type: 'loot' as const,
          timestamp: 'QUEST'
        }];

        return {
          ...prev,
          inventoryMaterials: nextMats,
          quests: updatedQuests,
          playerStats: nextStats,
          townReputation: nextRep,
          logs: nextLogs
        };
      });
    } else if (quest.type === 'encounter') {
      const isPestQuest = quest.id === 'q_pest_control';
      const searchName = isPestQuest ? 'Quest Sewer Rat' : 'Bandit Raider';
      const activeTargets = gameState.enemies.filter(e => e.name.includes(searchName));

      if (activeTargets.length > 0) {
        setGameState(prev => ({
          ...prev,
          logs: [...prev.logs, {
            id: `q_err_${Date.now()}`,
            text: isPestQuest
              ? `❌ ERROR: Quest Sewer Rats are still active! You must defeat all 3 rats in the town map.`
              : `❌ ERROR: Bandit Raiders are still active! You must defeat all 3 raiders in the town map.`,
            type: 'system' as const,
            timestamp: 'QUEST'
          }]
        }));
        return;
      }

      setGameState((prev) => {
        const updatedQuests = prev.quests.map((q) => {
          if (q.id === questId) return { ...q, status: 'turned_in' as const };
          return q;
        });

        const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const repReward = isPestQuest ? 10 : 25;
        const nextRep = Math.min(100, prevRep + repReward);

        const nextStats = {
          ...prev.playerStats,
          gold: prev.playerStats.gold + quest.rewardGold
        };

        const nextLogs = [...prev.logs, {
          id: `q_complete_${Date.now()}`,
          text: isPestQuest
            ? `🎉 QUEST COMPLETED: Outskirts cleaned of pests! Grom rewards you with +${quest.rewardGold} Gold and +${repReward} Town Reputation!`
            : `🎉 QUEST COMPLETED: Town secured! Grom rewards you with +${quest.rewardGold} Gold and +${repReward} Town Reputation!`,
          type: 'loot' as const,
          timestamp: 'QUEST'
        }];

        return {
          ...prev,
          quests: updatedQuests,
          playerStats: nextStats,
          townReputation: nextRep,
          logs: nextLogs
        };
      });
    }
  };

  const handleUpgradeBlacksmith = () => {
    const level = gameState.blacksmithForgeLevel ?? 1;
    if (level >= 3) return;

    if (level === 1) {
      const goldCost = 250;
      const ironCount = gameState.inventoryMaterials['mat_iron'] || 0;
      if (gameState.playerStats.gold < goldCost || ironCount < 5) {
        playSound('bump');
        addLogMessage(`❌ Insufficient materials to upgrade Forge to Tier 2! Needs 250 Gold and 5 Scrap Iron.`, 'system');
        return;
      }
      setGameState(prev => {
        const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const nextRep = Math.min(100, prevRep + 10);
        return {
          ...prev,
          blacksmithForgeLevel: 2,
          townReputation: nextRep,
          playerStats: {
            ...prev.playerStats,
            gold: prev.playerStats.gold - goldCost
          },
          inventoryMaterials: {
            ...prev.inventoryMaterials,
            'mat_iron': ironCount - 5
          }
        };
      });
      playSound('loot');
      addLogMessage(`🔨 FORGE UPGRADED: The town Blacksmith forge is now Tier 2! Advanced crafting templates (Staff, Wand, Crossbow) are unlocked! (+10 Town Reputation)`, 'loot');
    } else if (level === 2) {
      const goldCost = 400;
      const mithrilCount = gameState.inventoryMaterials['mat_mithril'] || 0;
      if (gameState.playerStats.gold < goldCost || mithrilCount < 5) {
        playSound('bump');
        addLogMessage(`❌ Insufficient materials to upgrade Forge to Tier 3! Needs 400 Gold and 5 Glimmering Mithril.`, 'system');
        return;
      }
      setGameState(prev => {
        const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const nextRep = Math.min(100, prevRep + 15);
        return {
          ...prev,
          blacksmithForgeLevel: 3,
          townReputation: nextRep,
          playerStats: {
            ...prev.playerStats,
            gold: prev.playerStats.gold - goldCost
          },
          inventoryMaterials: {
            ...prev.inventoryMaterials,
            'mat_mithril': mithrilCount - 5
          }
        };
      });
      playSound('loot');
      addLogMessage(`🔥 FORGE MAXED: The town Blacksmith forge is now Tier 3! Elite legendary crafting templates (Greatsword, Warhammer) are unlocked! (+15 Town Reputation)`, 'loot');
    }
  };

  const handleUpgradeApothecary = () => {
    const tier = gameState.apothecaryTier ?? 1;
    if (tier >= 3) return;

    if (tier === 1) {
      const goldCost = 150;
      const berryCount = gameState.inventoryMaterials['mat_berry'] || 0;
      if (gameState.playerStats.gold < goldCost || berryCount < 10) {
        playSound('bump');
        addLogMessage(`❌ Insufficient materials to upgrade Apothecary to Tier 2! Needs 150 Gold and 10x Wild Berries.`, 'system');
        return;
      }
      setGameState(prev => {
        const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const nextRep = Math.min(100, prevRep + 8);
        return {
          ...prev,
          apothecaryTier: 2,
          townReputation: nextRep,
          playerStats: {
            ...prev.playerStats,
            gold: prev.playerStats.gold - goldCost
          },
          inventoryMaterials: {
            ...prev.inventoryMaterials,
            'mat_berry': berryCount - 10
          }
        };
      });
      playSound('loot');
      addLogMessage(`🧪 LABORATORY UPGRADED: The Apothecary Laboratory is now Tier 2! Medium HP/MP restorative mixtures are now in stock! (+8 Town Reputation)`, 'loot');
    } else if (tier === 2) {
      const goldCost = 300;
      const berryCount = gameState.inventoryMaterials['mat_berry'] || 0;
      
      const totalCats = Object.keys(gameState.inventoryCatalysts).reduce((sum, key) => sum + (gameState.inventoryCatalysts[key] || 0), 0);
      if (gameState.playerStats.gold < goldCost || berryCount < 20 || totalCats < 2) {
        playSound('bump');
        addLogMessage(`❌ Insufficient materials to upgrade Apothecary to Tier 3! Needs 300 Gold, 20x Wild Berries, and any 2x Catalyst Shards.`, 'system');
        return;
      }
      
      setGameState(prev => {
        const nextCats = { ...prev.inventoryCatalysts };
        let deducted = 0;
        for (const catId of Object.keys(nextCats)) {
          if (nextCats[catId] > 0) {
            const take = Math.min(nextCats[catId], 2 - deducted);
            nextCats[catId] -= take;
            deducted += take;
            if (deducted >= 2) break;
          }
        }
        const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const nextRep = Math.min(100, prevRep + 12);
        return {
          ...prev,
          apothecaryTier: 3,
          townReputation: nextRep,
          playerStats: {
            ...prev.playerStats,
            gold: prev.playerStats.gold - goldCost
          },
          inventoryMaterials: {
            ...prev.inventoryMaterials,
            'mat_berry': berryCount - 20
          },
          inventoryCatalysts: nextCats
        };
      });
      playSound('loot');
      addLogMessage(`🔥 LABORATORY MAXED: The Apothecary Laboratory is now Tier 3! Elixir of Full Restoration and Chaos Catalysts are now in stock! (+12 Town Reputation)`, 'loot');
    }
  };

  const handleBuyRumor = () => {
    const cost = 80;
    if (gameState.playerStats.gold < cost) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold! You need 80 Gold to buy Frothy Beer Mug for Bartender Gossip.`, 'system');
      return;
    }

    const rumorPools = [
      { type: 'chest', text: `A merchant caravan dropped a heavy iron lockbox at coordinate ({x}, {y}) in chunk ({cx}, {cy})! It's buried in the trees.` },
      { type: 'boss', text: `A seasoned ranger reported a deep dungeon entrance or dangerous beast den around coordinate ({x}, {y}) in chunk ({cx}, {cy})!` },
      { type: 'cat', text: `A local shepherd swears they saw a mystical legendary cat resting near coordinate ({x}, {y}) in chunk ({cx}, {cy})!` }
    ];

    const randomType = rumorPools[Math.floor(Math.random() * rumorPools.length)];
    const rx = Math.floor(Math.random() * 16) + 2;
    const ry = Math.floor(Math.random() * 16) + 2;
    const rcx = gameState.currentChunkX + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2);
    const rcy = gameState.currentChunkY + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2);

    const rumorMsg = randomType.text
      .replace('{x}', rx.toString())
      .replace('{y}', ry.toString())
      .replace('{cx}', rcx.toString())
      .replace('{cy}', rcy.toString());

    setGameState(prev => {
      const activeRumors = prev.purchasedRumors ? [...prev.purchasedRumors] : [];
      activeRumors.push(rumorMsg);
      return {
        ...prev,
        purchasedRumors: activeRumors,
        playerStats: {
          ...prev.playerStats,
          gold: Math.max(0, prev.playerStats.gold - cost)
        }
      };
    });

    playSound('loot');
    addLogMessage(`🍻 Bartender slides over a Frothy Beer: "Drink up, friend! Let me tell you..."`, 'loot');
    addLogMessage(`📜 GOSSIP: "${rumorMsg}"`, 'system');
  };

  const handleTavernRest = () => {
    const cost = 15;
    if (gameState.playerStats.gold < cost) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold! You need 15 Gold to rent a cozy room at the Inn.`, 'system');
      return;
    }

    setGameState((prev) => {
      const stats = prev.playerStats;
      const nextStats = {
        ...stats,
        gold: Math.max(0, stats.gold - cost),
        exhaustion: 0, // Fully purges exhaustion!
        hp: stats.maxHp, // fully heals HP
        mp: stats.maxMp  // fully heals MP
      };

      playSound('levelUp');
      addLogMessage(`🛌 You rent a cozy room upstairs, tuck into a warm featherbed, and rest deeply. Your physical exhaustion is fully purged and you feel at your fighting peak! (HP & MP Fully Restored)`, 'loot');

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `Fully Restored! 💤`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        playerStats: nextStats
      };
    });
  };

  const handleHireMercenary = (type: 'novice' | 'veteran' | 'champion' | 'merchant_guard') => {
    if (gameState.followers.length >= 3) {
      addLogMessage('🗣️ Bartender: "Your party is full! You can only manage up to 3 companions."', 'system');
      return;
    }

    const reputation = gameState.townReputation ?? 100;
    if (reputation <= 20) {
      playSound('bump');
      addLogMessage('🗣️ Bartender whispers: "No mercenary here will fight for a wanted outlaw! Clean your name first!"', 'system');
      return;
    }

    let cost = 180;
    let name = "Sunder Recruit";
    let hp = 35;
    let atk = 6;
    let def = 2;
    let char = '🗡';
    let color = '#38bdf8';
    let level = 2;
    let desc = "Novice cutthroat hired from the local tavern.";

    if (type === 'veteran') {
      cost = 280;
      name = "Sunder Veteran";
      hp = 55;
      atk = 9;
      def = 4;
      char = '⚔️';
      color = '#34d399';
      level = 4;
      desc = "Veteran sellsword with reinforced chainmail and a broadsword.";
    } else if (type === 'champion') {
      cost = 450;
      name = "Champion Gladiator";
      hp = 85;
      atk = 14;
      def = 7;
      char = '🏆';
      color = '#f59e0b';
      level = 6;
      desc = "Elite gladiator with high-impact strike shields and master training.";
    } else if (type === 'merchant_guard') {
      cost = 250;
      name = "Merchant Guard";
      hp = 60;
      atk = 8;
      def = 5;
      char = '💂';
      color = '#c084fc'; // medium purple
      level = 3;
      desc = "A heavily armed merchant guard. Specialized in safehouse protection and outpost defense.";
    }

    if (gameState.playerStats.gold < cost) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold! Hiring ${name} requires ${cost} Gold.`, 'system');
      return;
    }

    setGameState((prev) => {
      const nextFollower: Follower = {
        id: `fol_${Date.now()}`,
        name: name,
        archetypeId: type === 'champion' ? 'guard' : type === 'merchant_guard' ? 'merchant_guard' : 'thief',
        role: 'follower',
        char: char,
        color: color,
        hp: hp,
        maxHp: hp,
        atk: atk,
        def: def,
        level: level,
        xp: 0,
        xpNext: 150,
        mode: 'follow',
        equipment: { weapon: null, armor: null },
        inventory: [],
        injuries: [],
        personality: desc,
        temperament: 'Loyal'
      };

      const newActor: Enemy = {
        id: `actor_${nextFollower.id}`,
        x: prev.playerX,
        y: prev.playerY,
        type: 'Goblin' as any,
        name: nextFollower.name,
        hp: nextFollower.hp,
        maxHp: nextFollower.maxHp,
        atk: nextFollower.atk,
        def: nextFollower.def,
        range: 1,
        speed: 1,
        color: nextFollower.color,
        char: nextFollower.char,
        state: EnemyState.Chasing,
        isElite: type === 'champion',
        patrolPath: [],
        patrolIndex: 0,
        debuffs: [],
        isFollower: true,
        followerId: nextFollower.id
      };

      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          gold: Math.max(0, prev.playerStats.gold - cost)
        },
        followers: [...prev.followers, nextFollower],
        enemies: [...prev.enemies, newActor],
        logs: [
          ...prev.logs,
          {
            id: `hire_merc_${Date.now()}`,
            text: `👥 MERCENARY HIRED: ${nextFollower.name} (Lvl ${level}) pledges their sword to you! (-${cost} Gold)`,
            type: 'loot',
            timestamp: 'RECRUIT'
          }
        ]
      };
    });

    playSound('loot');
    const talkEvent = new CustomEvent('spawn-game-effect', {
      detail: { x: gameState.playerX, y: gameState.playerY, text: `⚔️ Hired!`, type: 'heal' },
    });
    window.dispatchEvent(talkEvent);
  };

  // Trade/Sellers callbacks
  const handleBuyEquipment = (item: EquipmentItem) => {
    const activeId = gameState.activeTradeNpcId || 'npc_shop';
    const activeNpc = gameState.npcs?.find(n => n.id === activeId);
    const activeRole = activeNpc?.role || (activeId === 'npc_caravan_merchant' || activeId.includes('caravan') ? 'merchant' : '');
    const mConfig = getMerchantConfig(activeRole, activeId);
    
    const reputation = gameState.townReputation ?? 100;
    if (reputation <= 20 && activeRole !== 'merchant_seppo') {
      playSound('bump');
      addLogMessage(`❌ REFUSED: Town merchants refuse to trade with a notorious Sunder Outlaw!`, 'system');
      return;
    }

    const currentStock = gameState.merchantStock?.[activeId]?.[item.id] !== undefined
      ? gameState.merchantStock[activeId][item.id]
      : (mConfig.defaultStock[item.id] !== undefined ? mConfig.defaultStock[item.id] : 2);

    if (currentStock <= 0) {
      playSound('bump');
      addLogMessage(`❌ "${item.name}" is currently OUT OF STOCK! Wait for the next trade restock phase.`, 'system');
      return;
    }

    const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
    const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
    const chaMult = getCharismaDiscountMultiplier(gameState);
    const itemValue = Math.round(item.value * discountMult * chaMult);

    if (gameState.playerStats.gold < itemValue) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold to buy "${item.name}". You need ${itemValue} Gold!`, 'system');
      return;
    }

    const weight = getItemWeight(item);
    if (!checkWeightCapacity(gameState, weight)) {
      playSound('bump');
      addLogMessage(`❌ Cannot buy "${item.name}": Exceeds carry weight capacity (Max: ${getMaxWeight(gameState)} kg, Item: ${weight} kg). Discard or sell items first!`, 'danger');
      return;
    }

    playSound('loot');
    setGameState((prev) => {
      const nextInv = [
        ...prev.equipmentInventory, 
        { 
          ...item, 
          id: `buy_${item.id}_${Date.now()}_${Math.random()}`,
          durability: item.durability ?? 100,
          maxDurability: item.maxDurability ?? 100
        }
      ];
      const nextStats = { ...prev.playerStats, gold: prev.playerStats.gold - itemValue };

      const updatedStockCopy = prev.merchantStock ? { ...prev.merchantStock } : {};
      if (!updatedStockCopy[activeId]) {
        updatedStockCopy[activeId] = { ...mConfig.defaultStock };
      }
      updatedStockCopy[activeId][item.id] = Math.max(0, currentStock - 1);

      return {
        ...prev,
        equipmentInventory: nextInv,
        playerStats: nextStats,
        merchantStock: updatedStockCopy
      };
    });
    addLogMessage(`🛒 Purchased ${item.name} for ${itemValue} Gold! Added to your inventory stash.`, 'loot');
    if (activeRole === 'merchant_seppo') {
      const drunkLogs = [
        `🥴 Seppo: "Ah, yes... *hic*... a fine purchase! This gold will fund my next double-fermentation round!"`,
        `🥴 Seppo: "Treat it well... *burp*... it was forged with direct blood, sweat, and sauna steam!"`,
        `🥴 Seppo: "Sisu, traveler! Sisu is... *hic*... the key to everything!"`
      ];
      addLogMessage(drunkLogs[Math.floor(Math.random() * drunkLogs.length)], 'loot');
    }
  };

  const handleBuyResource = (type: 'material' | 'catalyst' | 'potion', id: string, price: number) => {
    const activeId = gameState.activeTradeNpcId || 'npc_shop';
    const activeNpc = gameState.npcs?.find(n => n.id === activeId);
    const activeRole = activeNpc?.role || (activeId === 'npc_caravan_merchant' || activeId.includes('caravan') ? 'merchant' : '');
    const mConfig = getMerchantConfig(activeRole, activeId);

    const reputation = gameState.townReputation ?? 100;
    if (reputation <= 20 && activeRole !== 'merchant_seppo') {
      playSound('bump');
      addLogMessage(`❌ REFUSED: Town merchants refuse to trade with a notorious Sunder Outlaw!`, 'system');
      return;
    }

    const currentStock = gameState.merchantStock?.[activeId]?.[id] !== undefined
      ? gameState.merchantStock[activeId][id]
      : (mConfig.defaultStock[id] !== undefined ? mConfig.defaultStock[id] : 3);

    if (currentStock <= 0) {
      playSound('bump');
      addLogMessage(`❌ This item is currently OUT OF STOCK! Please wait for the next market restock.`, 'system');
      return;
    }

    const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
    const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
    const chaMult = getCharismaDiscountMultiplier(gameState);
    
    // Apply dynamic trade economy biome multipliers and guild discount research
    const biomeMult = getBiomePriceMultiplier(id, gameState.biome);
    const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
    const baseAdjustedPrice = Math.round(price * biomeMult * upgradedDiscountMult);
    const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);

    if (gameState.playerStats.gold < finalPrice) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold to purchase this shop item!`, 'system');
      return;
    }

    if (type !== 'potion') {
      const weight = getMaterialUnitWeight(id);
      if (!checkWeightCapacity(gameState, weight)) {
        playSound('bump');
        addLogMessage(`❌ Cannot purchase this resource: Exceeds carry weight capacity (Unit: ${weight} kg). Discard or sell items first!`, 'danger');
        return;
      }
    }

    playSound('loot');
    setGameState((prev) => {
      const nextStats = { ...prev.playerStats, gold: prev.playerStats.gold - finalPrice };
      
      const updatedStockCopy = prev.merchantStock ? { ...prev.merchantStock } : {};
      if (!updatedStockCopy[activeId]) {
        updatedStockCopy[activeId] = { ...mConfig.defaultStock };
      }
      updatedStockCopy[activeId][id] = Math.max(0, currentStock - 1);

      let nextPoleDurability = prev.fishingPoleDurability;
      if (id === 'mat_fishing_pole') {
        // Bought a new fishing pole! Durability is fully reset to 7 uses.
        nextPoleDurability = 7;
        addLogMessage(`🎣 Purchased a solid new fishing pole! Sturdy and ready with 7 uses left!`, 'loot');
      }

      if (type === 'material') {
        if (id === 'mat_transmuter') {
          addLogMessage(`🧪 Purchased the Portable Alchemical Transmuter (Wild Magic Flask)! Option unlocked in backpack.`, 'loot');
          return {
            ...prev,
            hasTransmuter: true,
            playerStats: nextStats,
            fishingPoleDurability: nextPoleDurability,
            merchantStock: updatedStockCopy
          };
        }
        const nextMats = { ...prev.inventoryMaterials };
        nextMats[id] = (nextMats[id] || 0) + 1;
        addLogMessage(`🛒 Purchased Alloys material: 1x ${id.replace('mat_', '').toUpperCase()} for ${finalPrice} Gold.`, 'loot');
        return {
          ...prev,
          inventoryMaterials: nextMats,
          playerStats: nextStats,
          fishingPoleDurability: nextPoleDurability,
          merchantStock: updatedStockCopy
        };
      } else if (type === 'catalyst') {
        const nextCats = { ...prev.inventoryCatalysts };
        nextCats[id] = (nextCats[id] || 0) + 1;
        addLogMessage(`🛒 Purchased Elemental Shard: 1x ${id.replace('cat_', '').toUpperCase()} Catalyst for ${finalPrice} Gold.`, 'loot');
        return {
          ...prev,
          inventoryCatalysts: nextCats,
          playerStats: nextStats,
          merchantStock: updatedStockCopy
        };
      } else {
        // Potions & Scrolls - add to backpack provisions instead of instant intake!
        const nextMats = { ...prev.inventoryMaterials };
        nextMats[id] = (nextMats[id] || 0) + 1;
        
        // Find a nice name for the item
        const itemNames: { [k: string]: string } = {
          'potion_hp': 'Apothecary Elixir (HP)',
          'potion_mp': 'Aether Beverage (MP)',
          'potion_medium_hp': 'Rejuvenating Potion (Medium HP)',
          'potion_medium_mp': 'Rejuvenating Beverage (Medium MP)',
          'potion_full_rejuv': 'Elixir of Full Restoration',
          'potion_full_rejuvenation': 'Royal Champion Rejuvenation Elixir',
          'scroll_recall': 'Scroll of Escape'
        };
        const displayName = itemNames[id] || id.replace('potion_', '').replace('scroll_', '').toUpperCase();
        addLogMessage(`🛒 Purchased: 1x ${displayName} (added to your backpack provisions stash).`, 'loot');
        
        return {
          ...prev,
          inventoryMaterials: nextMats,
          playerStats: nextStats,
          merchantStock: updatedStockCopy
        };
      }
    });
    if (activeRole === 'merchant_seppo') {
      const drunkLogs = [
        `🥴 Seppo: "That's the real stuff... *hic*! Warm sauna spirit in a bottle!"`,
        `🥴 Seppo: "Don't drink it all at once! Or do... *burp*... I have more copper tubs running!"`,
        `🥴 Seppo: "May the forest spirits... *hic*... bless your kidneys!"`
      ];
      addLogMessage(drunkLogs[Math.floor(Math.random() * drunkLogs.length)], 'loot');
    }
  };

  const handleBuyEnchantedGear = (gearId: 'horse' | 'camel' | 'worg' | 'crocodile', price: number, gearName: string) => {
    const reputation = gameState.townReputation ?? 100;
    const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
    const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
    const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
    const chaMult = getCharismaDiscountMultiplier(gameState);
    const baseAdjustedPrice = Math.round(price * upgradedDiscountMult);
    const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);

    if (gameState.playerStats.gold < finalPrice) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold to purchase ${gearName}! Costs ${finalPrice} Gold.`, 'system');
      return;
    }

    // Map gearId to actual EquipmentItem
    let item: EquipmentItem;
    if (gearId === 'horse') {
      item = {
        id: `purchased_enchanted_horse_${Date.now()}`,
        name: 'Stallion-Sprung Greaves',
        type: 'armor',
        subType: 'Boots',
        defense: 2,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#f97316',
        description: 'Pre-enchanted Sabatons. [Enchanted: Stallion Speed. Overworld travel speed increased (3m/turn travel time cost).]',
        value: Math.round(price / 2),
        durability: 120,
        maxDurability: 120,
        traits: ['STALLION_SPEED']
      };
    } else if (gearId === 'camel') {
      item = {
        id: `purchased_enchanted_camel_${Date.now()}`,
        name: 'Dune-Treader Sabatons',
        type: 'armor',
        subType: 'Boots',
        defense: 2,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#eab308',
        description: 'Pre-enchanted Sabatons. [Enchanted: Dune Desert Immunity. Complete immunity to sandstorms, sand-blindness, and heat fatigue!]',
        value: Math.round(price / 2),
        durability: 120,
        maxDurability: 120,
        traits: ['DESERT_IMMUNITY']
      };
    } else if (gearId === 'worg') {
      item = {
        id: `purchased_enchanted_worg_${Date.now()}`,
        name: 'Worg-Spiked Gauntlets',
        type: 'armor',
        subType: 'Gloves',
        defense: 2,
        damage: 3,
        critChance: 0.05,
        range: 1,
        color: '#9333ea',
        description: 'Pre-enchanted Gauntlets. [Enchanted: Worg Force. Adds +3 damage to physical attacks and pacifies wild Wolves!]',
        value: Math.round(price / 2),
        durability: 120,
        maxDurability: 120,
        traits: ['WORG_FORCE']
      };
    } else { // crocodile
      item = {
        id: `purchased_enchanted_crocodile_${Date.now()}`,
        name: 'Crocodile Bayou Sabatons',
        type: 'armor',
        subType: 'Boots',
        defense: 2,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#16a34a',
        description: 'Pre-enchanted Sabatons. [Enchanted: Swamp-Glide. Move through swamp paths at extreme speed (2m/turn) and walk safely on water!]',
        value: Math.round(price / 2),
        durability: 120,
        maxDurability: 120,
        traits: ['SWAMP_GLIDE']
      };
    }

    playSound('levelUp');
    setGameState((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        gold: prev.playerStats.gold - finalPrice
      },
      equipmentInventory: [...prev.equipmentInventory, item]
    }));

    addLogMessage(`🛡️ [ENCHANTED GEAR PURCHASED]: You bought ${item.name}! Added directly to your backpack. Equip it from your Gear tab!`, 'loot');

    // Dispatch game effect at player position
    const ev = new CustomEvent('spawn-game-effect', {
      detail: { x: gameState.playerX, y: gameState.playerY, text: `🛡️ Purchased!`, type: 'heal' },
    });
    window.dispatchEvent(ev);
  };

  const handleInvokeWeatherRitual = (targetWeather: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard') => {
    if (!gameState.isOverworld) {
      addLogMessage(`⚠️ Atmospheric weather rituals can only be channeled in the open Overworld sky!`, 'system');
      playSound('bump');
      return;
    }

    // Determine the cost in catalysts or materials
    let requiredCatalyst: string | null = null;
    let requiredMaterial: string | null = null;
    let desc = '';

    if (targetWeather === 'clear') {
      requiredCatalyst = 'cat_fire';
      desc = '🔥 Pyrotactile Fire Catalyst';
    } else if (targetWeather === 'rainy') {
      requiredCatalyst = 'cat_poison';
      desc = '🧪 Venom-stung Gas Catalyst';
    } else if (targetWeather === 'snowy' || targetWeather === 'blizzard') {
      requiredCatalyst = 'cat_frost';
      desc = '❄️ Cryo-forged Ice Catalyst';
    } else if (targetWeather === 'sandstorm') {
      requiredCatalyst = 'cat_fire';
      requiredMaterial = 'mat_iron';
      desc = '🔥 Pyrotactile Fire Catalyst & 🔩 Scrap Iron';
    }

    const availableCatalystCount = requiredCatalyst ? (gameState.inventoryCatalysts[requiredCatalyst] || 0) : 0;
    const availableMaterialCount = requiredMaterial ? (gameState.inventoryMaterials[requiredMaterial] || 0) : 0;

    const isSandbox = (window as any).arenaSandboxModeActive || false;

    if (!isSandbox) {
      if (requiredCatalyst && availableCatalystCount < 1) {
        addLogMessage(`❌ Ritual Failed: Missing required catalyst! You need 1x ${desc}.`, 'danger');
        playSound('bump');
        return;
      }
      if (requiredMaterial && availableMaterialCount < 1) {
        addLogMessage(`❌ Ritual Failed: Missing required material! You need 1x ${desc}.`, 'danger');
        playSound('bump');
        return;
      }
    }

    // Deduct and shift weather
    setGameState((prev) => {
      const nextCatalysts = { ...prev.inventoryCatalysts };
      const nextMaterials = { ...prev.inventoryMaterials };

      if (!isSandbox) {
        if (requiredCatalyst) {
          nextCatalysts[requiredCatalyst] = Math.max(0, nextCatalysts[requiredCatalyst] - 1);
        }
        if (requiredMaterial) {
          nextMaterials[requiredMaterial] = Math.max(0, nextMaterials[requiredMaterial] - 1);
        }
      }

      return {
        ...prev,
        weather: targetWeather,
        inventoryCatalysts: nextCatalysts,
        inventoryMaterials: nextMaterials,
      };
    });

    const label = targetWeather === 'clear' ? '☀️ Clear Skies'
                : targetWeather === 'rainy' ? '🌧️ Stormy Rain'
                : targetWeather === 'foggy' ? '🌫️ Dense Fog'
                : targetWeather === 'snowy' ? '❄️ Gentle Snow'
                : targetWeather === 'sandstorm' ? '🌪️ Swirling Sandstorm'
                : '🌨️ Frostbite Blizzard';

    addLogMessage(`🌌 RITUAL SUCCESS: You invoke an atmospheric climate transition to ${label}!`, 'craft');
    playSound('spell');

    // Dispatch game effect animation on the player
    const effectEv = new CustomEvent('spawn-game-effect', {
      detail: {
        x: gameState.playerX,
        y: gameState.playerY,
        text: `🌌 CLIMATE RITUAL`,
        type: 'heal',
      },
    });
    window.dispatchEvent(effectEv);
  };

  const generateRandomCaravanEncounter = (biome: string, state: GameState): CaravanEncounter => {
    const roll = Math.random();
    
    if (roll < 0.11) {
      return {
        id: `enc_bandit_${Date.now()}`,
        type: 'bandit_ambush',
        title: '🗡️ RUTHLESS BANDIT TOLL ROAD (ELITE CHALLENGE)',
        desc: 'A faction of heavily-armed Sunder Outlaws blocks a tight mountain pass with spike traps and readied iron crossbows. "Disperse 500 Gold, or feed the vultures, rich merchant!" the bandit captain sneers.',
        resolved: false,
        options: [
          {
            id: 'fight',
            text: '⚔️ Draw steel and charge! (Requires Strength [STR] Check, Difficulty 19)',
            statCheck: 'str',
            difficulty: 19
          },
          {
            id: 'intimidate',
            text: '🗣️ Extort them back with deadly threats! (Requires Charisma [CHA] Check, Difficulty 18)',
            statCheck: 'cha',
            difficulty: 18
          },
          {
            id: 'pay',
            text: '🪙 Pay the 500 Gold toll to prevent bloodshed.',
            costGold: 500
          }
        ]
      };
    } else if (roll < 0.22) {
      return {
        id: `enc_beast_${Date.now()}`,
        type: 'beast_attack',
        title: '🐺 DIRE WOLF FOREST AMBUSH (FERAL THREAT)',
        desc: 'A pack of hungry, red-eyed Dire Wolves crawls out of the shadowy brushwood, snapping their jaws at the carriage draft horses!',
        resolved: false,
        options: [
          {
            id: 'fight',
            text: '⚔️ Leap in front of the carriage to slay them! (Requires Dexterity [DEX] Check, Difficulty 18)',
            statCheck: 'dex',
            difficulty: 18
          },
          {
            id: 'feed',
            text: '🥩 Feed them stashed Wild Berries to pacify them. (Costs 15 Berries)',
            costItems: [{ id: 'mat_berry', count: 15, label: 'Wild Berries' }]
          },
          {
            id: 'intimidate',
            text: '🗣️ Use a primal roar to terrify the beasts! (Requires Strength [STR] Check, Difficulty 19)',
            statCheck: 'str',
            difficulty: 19
          }
        ]
      };
    } else if (roll < 0.33) {
      return {
        id: `enc_obstacle_${Date.now()}`,
        type: 'obstacle',
        title: '🪨 AVALANCHE ROAD BLOCK',
        desc: 'A massive boulder and rockslide debris from the mountain peaks has crashed down, fully blocking the narrow dirt road. The caravan is stuck!',
        resolved: false,
        options: [
          {
            id: 'push',
            text: '💪 Lift and push the boulder with raw muscle! (Requires Strength [STR] Check, Difficulty 19)',
            statCheck: 'str',
            difficulty: 19
          },
          {
            id: 'leverage',
            text: '⚙️ Engineer a lever system with wooden logs. (Requires Intelligence [INT] Check, Difficulty 18)',
            statCheck: 'int',
            difficulty: 18
          },
          {
            id: 'detour',
            text: '🗺️ Guide the wagons through a dangerous swampy detour. (Requires Luck [LCK] Check, Difficulty 18)',
            statCheck: 'lck',
            difficulty: 18
          }
        ]
      };
    } else if (roll < 0.44) {
      return {
        id: `enc_pilgrim_${Date.now()}`,
        type: 'pilgrim',
        title: '✨ SHRINE OF THE FIRST AGE',
        desc: 'An ancient, crumbling stone altar glows with white crystalline light. A gentle roadway priest is meditating nearby, tending to a pure water well. He offers a prayer for the caravan guards.',
        resolved: false,
        options: [
          {
            id: 'bless',
            text: '🙏 Bow your head and accept a divine blessing. (Fills HP/MP, removes fatigue!)'
          },
          {
            id: 'wisdom',
            text: '📖 Recite ancient lore snippets with the priest. (Requires Intelligence [INT] Check, Difficulty 17)',
            statCheck: 'int',
            difficulty: 17
          }
        ]
      };
    } else if (roll < 0.55) {
      return {
        id: `enc_wheel_${Date.now()}`,
        type: 'wheel_break',
        title: '⚙️ CRACKED WOODEN AXLE',
        desc: 'CRACK! The heavy caravan carriage strikes a deep, stony ditch. The rear wheel wood splintered, snapping the axle support!',
        resolved: false,
        options: [
          {
            id: 'repair_metal',
            text: '🔨 Forge an iron bracing to fix it immediately. (Costs 8 Iron Ore)',
            costItems: [{ id: 'mat_iron', count: 8, label: 'Iron Ore' }]
          },
          {
            id: 'repair_lumber',
            text: '🌲 Splice a wooden support brace. (Requires 18 Wood Planks)',
            costItems: [{ id: 'mat_wood', count: 18, label: 'Wood Planks' }]
          },
          {
            id: 'wait_fix',
            text: '⏳ Take time to craft a replacement with simple tools. (Adds 30% physical Exhaustion, advances clock)'
          }
        ]
      };
    } else if (roll < 0.66) {
      return {
        id: `enc_storm_${Date.now()}`,
        type: 'mana_storm',
        title: '⛈️ DREADED MANA TEMPEST (ARCANE ANOMALY)',
        desc: 'A sudden vortex of unstable raw violet lightning sweeps over the gravel road. The air hums with volatile mana, and the carriage wheel axles are starting to spark with dangerous static friction!',
        resolved: false,
        options: [
          {
            id: 'spell_barrier',
            text: '🛡️ Cast an Arcane Dampening Barrier to shield the horses. (Requires Intelligence [INT] Check, Difficulty 18)',
            statCheck: 'int',
            difficulty: 18
          },
          {
            id: 'ground_metal',
            text: '⚡ Deploy copper/iron rod bypass groundings. (Requires Dexterity [DEX] Check, Difficulty 17)',
            statCheck: 'dex',
            difficulty: 17
          },
          {
            id: 'ride_through',
            text: '🐎 Gallop recklessly straight through the lightning field! (Requires Luck [LCK] Check, Difficulty 19)',
            statCheck: 'lck',
            difficulty: 19
          }
        ]
      };
    } else if (roll < 0.77) {
      return {
        id: `enc_bridge_${Date.now()}`,
        type: 'bridge_collapse',
        title: '🌉 CRACKED GORGE CHASM BRIDGE (STRUCTURAL DAMAGE)',
        desc: 'The old log-and-rope bridge spanning a deep chasm has partially buckled. Only a single narrow wooden beam remains. A heavy carriage will surely crash unless bolstered or steered with divine precision.',
        resolved: false,
        options: [
          {
            id: 'carpentry',
            text: '🪚 Build a sturdy timber brace ramp. (Costs 15 Scrap Wood logs)',
            costItems: [{ id: 'mat_wood', count: 15, label: 'Scrap Wood' }]
          },
          {
            id: 'steer',
            text: '🐎 Precision-steer the horse carriage across the narrow girder. (Requires Dexterity [DEX] Check, Difficulty 19)',
            statCheck: 'dex',
            difficulty: 19
          },
          {
            id: 'magical_levitation',
            text: '🌀 Cast an arcane levitation wind to support the wheels. (Requires Intelligence [INT] Check, Difficulty 18)',
            statCheck: 'int',
            difficulty: 18
          }
        ]
      };
    } else if (roll < 0.88) {
      return {
        id: `enc_merchant_${Date.now()}`,
        type: 'mysterious_merchant',
        title: '🎒 WANDERING SHELTER TRADER',
        desc: 'An eccentric merchant wearing heavy leather boots and riding a giant moss-covered tortoise waves you down. "Greetings travelers! I trade rare seeds and cure-all draughts for woodland supplies!"',
        resolved: false,
        options: [
          {
            id: 'buy_herbs',
            text: '🪙 Buy a basket of fresh restorative herbs. (Costs 100 Gold)',
            costGold: 100
          },
          {
            id: 'trade_hides',
            text: '🟤 Exchange heavy leather for refined scrap iron. (Costs 3 Thick Wild Hides)',
            costItems: [{ id: 'mat_thick_hide', count: 3, label: 'Thick Wild Hide' }]
          },
          {
            id: 'ignore',
            text: '🚶 Politely refuse and keep rolling along the road.'
          }
        ]
      };
    } else {
      return {
        id: `enc_gas_${Date.now()}`,
        type: 'swamp_gas',
        title: '🤢 NOXIOUS SULFUR MIASMA (POISON HAZARD)',
        desc: 'The mountain pass dips into a humid hollow filled with bubbling, yellow sulfur gas. The horses begin coughing and choking, and your lungs burn with every deep breath!',
        resolved: false,
        options: [
          {
            id: 'alchemy',
            text: '🧪 Synthesize neutralizing air filter vapors. (Requires Intelligence [INT] Check, Difficulty 17)',
            statCheck: 'int',
            difficulty: 17
          },
          {
            id: 'constitution',
            text: '💪 Push through the suffocating vapors with pure grit. (Requires Strength [STR] Check, Difficulty 18)',
            statCheck: 'str',
            difficulty: 18
          },
          {
            id: 'herbs',
            text: '🌿 Chew on stashed Wild Berries to neutralize the toxins. (Costs 12 Wild Berries)',
            costItems: [{ id: 'mat_berry', count: 12, label: 'Wild Berries' }]
          }
        ]
      };
    }
  };

  const handleStartCaravanTravel = (destX: number, destY: number, destName: string) => {
    playSound('levelUp');
    const distance = Math.max(Math.abs(destX - gameState.currentChunkX), Math.abs(destY - gameState.currentChunkY));
    const totalSteps = Math.max(1, distance * 2);
    const reward = 100 + distance * 80;

    setGameState((prev) => {
      const nextTravel: CaravanTravelState = {
        active: true,
        originX: prev.currentChunkX,
        originY: prev.currentChunkY,
        destX,
        destY,
        destName,
        totalSteps,
        currentStep: 0,
        stepsHistory: ["🏕️ Caravan gathers. Baron Tobias checks the heavy iron axles. 'Ready to roll, guard! Keep your hand on your sword hilt!'"],
        rewardGold: reward,
        currentEncounter: null
      };
      
      return {
        ...prev,
        activeTradeNpcId: null, // close trade menu
        caravanTravel: nextTravel
      };
    });

    addLogMessage(`🛡️ [ESCORT INITIATED]: Accompanying caravan to ${destName}! Safe journey!`, 'loot');
  };

  const handleAdvanceCaravanTravel = () => {
    playSound('slash');
    setGameState((prev) => {
      const travel = prev.caravanTravel;
      if (!travel) return prev;

      let nextStep = travel.currentStep + 1;
      const history = [...travel.stepsHistory];

      if (isLunarBlessingActive(prev, 'waxing_crescent') && Math.random() < 0.20 && nextStep < travel.totalSteps) {
        nextStep += 1;
        history.push(`✨ [LUNAR SWIFTNESS]: Stardust Swiftness Blessing speeds up the draft horses, skipping a tedious leg of the journey!`);
      }

      const descriptions = [
        "The heavy iron-reinforced wheels creak as the horses pull the massive wagons up a steep, pine-covered mountain ridge.",
        "A cool forest breeze blows through the caravan canvas. You walk alongside the archers, keeping a keen watch on the treeline.",
        "Baron Tobias hands you a flask of frothy ale. 'Good pace today! No bandit raiders in sight... yet.'",
        "The travelers sing a traditional dwarven road ballad to pass the hours as the shadow of distant mountains grows larger.",
        "You stop briefly by a crystalline creek to water the drafts. The caravan scouts check the pathway ahead for tracks.",
        "A low fog rolls over the dirt road. The caravan guards light their bronze torches, whispering of forest ghosts.",
        "Screeches of wild birds echo from the crags. You adjust your grip on your shield, feeling the wind turn cold."
      ];
      
      const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
      history.push(`📍 [Step ${nextStep}/${travel.totalSteps}]: ${desc}`);

      let encounter: CaravanEncounter | null = null;
      if (nextStep < travel.totalSteps && Math.random() < 0.85) {
        encounter = generateRandomCaravanEncounter(prev.biome || 'forest', prev);
        history.push(`🚨 EVENT TRIPPED: ${encounter.title}! Journey halted.`);
      }

      const updatedTravel: CaravanTravelState = {
        ...travel,
        currentStep: nextStep,
        stepsHistory: history,
        currentEncounter: encounter
      };

      return {
        ...prev,
        caravanTravel: updatedTravel
      };
    });
  };

  const handleResolveCaravanEncounterOption = (optionId: string) => {
    playSound('click');
    setGameState((prev) => {
      const travel = prev.caravanTravel;
      if (!travel || !travel.currentEncounter) return prev;

      const encounter = travel.currentEncounter;
      const option = encounter.options.find(o => o.id === optionId);
      if (!option) return prev;

      if (option.costGold && prev.playerStats.gold < option.costGold) {
        playSound('bump');
        return prev;
      }

      if (option.costItems) {
        let hasEnough = true;
        for (const itemCost of option.costItems) {
          const currentCount = prev.inventoryMaterials[itemCost.id] || 0;
          if (currentCount < itemCost.count) {
            hasEnough = false;
          }
        }
        if (!hasEnough) {
          playSound('bump');
          return prev;
        }
      }

      let nextGold = prev.playerStats.gold;
      if (option.costGold) {
        nextGold -= option.costGold;
      }

      const nextMats = { ...prev.inventoryMaterials };
      if (option.costItems) {
        option.costItems.forEach(itemCost => {
          nextMats[itemCost.id] = Math.max(0, (nextMats[itemCost.id] || 0) - itemCost.count);
        });
      }

      let d20 = 0;
      let modifier = 0;
      let totalRoll = 0;
      let isSuccess = true;
      let resultLog = '';
      let hpChange = 0;
      let xpGained = 0;
      let exhaustionChange = 0;

      const playerStats = prev.playerStats;

      if (option.statCheck) {
        d20 = Math.floor(Math.random() * 20) + 1;
        const attrVal = getEffectiveAttribute(prev, option.statCheck);
        modifier = Math.floor((attrVal - 10) / 2);
        totalRoll = d20 + modifier;
        isSuccess = totalRoll >= (option.difficulty || 10);
      }

      if (encounter.type === 'bandit_ambush') {
        if (option.id === 'fight') {
          if (isSuccess) {
            xpGained = 60;
            const rewardGold = 75;
            nextGold += rewardGold;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You draw your steel weapon and leap over the wagons. With a whirlwind strike, you cut down the bandit vanguard. The remaining outlaws flee, dropping a coin pouch! Gained +${xpGained} XP and +${rewardGold} Gold.`;
          } else {
            hpChange = -28;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! You charge the bandits but they hurl spike iron traps and fire crossbolts. You block several with your shield, but one grazes your thigh before they retreat. Lost -28 HP.`;
          }
        } else if (option.id === 'intimidate') {
          if (isSuccess) {
            xpGained = 40;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You step forward, ignite a magic spark, and threaten the captain with slow combustion. Terrified of your fearsome reputation, they pack up their spike strip and scurry off! Gained +${xpGained} XP.`;
          } else {
            hpChange = -16;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! They laugh at your threats. "Big words, tiny traveler!" They hurl a jagged throwing axe, grazing your shoulder before Baron Tobias's guards open fire. Lost -16 HP.`;
          }
        } else if (option.id === 'pay') {
          resultLog = `🤝 You count out 500 shiny gold coins and toss them to the bandit captain. Baron Tobias sighs. "An expensive road tax, but we live to trade another day." Paid 500 Gold.`;
        }
      } else if (encounter.type === 'beast_attack') {
        if (option.id === 'fight') {
          if (isSuccess) {
            xpGained = 50;
            nextMats['mat_raw_meat'] = (nextMats['mat_raw_meat'] || 0) + 2;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You intercept the lead alpha wolf, hacking it down with a swift strike. The rest of the pack panics and retreats back into the thick dark woodlands. Gained +${xpGained} XP and +2 Raw Meat.`;
          } else {
            hpChange = -22;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! A dire wolf lunges from behind, biting deep into your arm before you shake it off. Lost -22 HP.`;
          }
        } else if (option.id === 'feed') {
          xpGained = 35;
          resultLog = `🥩 You pull out your stashed Wild Berries and throw them on the road. The starving wolves eagerly fight over the forest harvest, completely ignoring the horses. The carriage rolls past safely! Gained +${xpGained} XP.`;
        } else if (option.id === 'intimidate') {
          if (isSuccess) {
            xpGained = 45;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You let out a terrifying, earth-shaking war cry, slamming your weapon against your breastplate. Shocked by your raw aura, the wolves tuck their tails and flee! Gained +${xpGained} XP.`;
          } else {
            hpChange = -18;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! The wolves are too starved to care about your roars. They lunge in, biting your leg before being driven back by the caravan scouts. Lost -18 HP.`;
          }
        }
      } else if (encounter.type === 'obstacle') {
        if (option.id === 'push') {
          if (isSuccess) {
            xpGained = 40;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You plant your feet on the gravel road and leverage your colossal strength. With a loud grunt, you roll the massive boulder down the mountain cliffside, clearing the road! Gained +${xpGained} XP.`;
          } else {
            hpChange = -15;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! You strain your back muscles attempting to heave the giant rock. You manage to shift it just enough for the wagon to squeeze past, but your muscles ache. Lost -15 HP.`;
          }
        } else if (option.id === 'leverage') {
          if (isSuccess) {
            xpGained = 45;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You analyze the boulder's balance point and build a timber fulcrum lever. With minimal physical effort, you slide the stone out of the path! Gained +${xpGained} XP.`;
          } else {
            hpChange = -10;
            exhaustionChange = 25;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! The wooden lever snaps under the boulder's weight. You are forced to dig it out manually, causing physical strain. Lost -10 HP and gained +25% Exhaustion.`;
          }
        } else if (option.id === 'detour') {
          if (isSuccess) {
            xpGained = 35;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! Following a lucky deer trail, you guide the carriage through a beautiful forest bypass, completely avoiding the rockslide. Gained +${xpGained} XP.`;
          } else {
            exhaustionChange = 45;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! The detour leads into a swampy marsh. The carriage gets stuck, and everyone spends hours pushing it out in the rain. Gained +45% Exhaustion.`;
          }
        }
      } else if (encounter.type === 'pilgrim') {
        if (option.id === 'bless') {
          resultLog = `✨ The road priest touches your forehead and murmurs a chant of the old gods. A warm golden vapor wraps around you. Your health, mana, and fatigue are completely restored!`;
        } else if (option.id === 'wisdom') {
          if (isSuccess) {
            xpGained = 80;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You discuss the lore of the Sunder Outlaws and the ancient dungeons. The priest is highly impressed by your intellect and shares forgotten runes of power. Gained +${xpGained} XP.`;
          } else {
            xpGained = 20;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! Your knowledge of old mythology is a bit rusty. The priest smiles gently and offers some simpler guidance. Gained +20 XP.`;
          }
        }
      } else if (encounter.type === 'wheel_break') {
        if (option.id === 'repair_metal') {
          xpGained = 50;
          resultLog = `🔨 You place the cracked iron band on an anvil block and forge-weld a reinforcement. The wagon axle is now stronger than before! Gained +${xpGained} XP. Used 8 Iron Ore.`;
        } else if (option.id === 'repair_lumber') {
          xpGained = 40;
          resultLog = `🌲 Using your stashed wood planks, you carve a solid timber splint to bind the broken axle. It holds perfectly. Gained +${xpGained} XP. Used 18 Wood Planks.`;
        } else if (option.id === 'wait_fix') {
          exhaustionChange = 35;
          resultLog = `⏳ Lacking materials, you spend hours carving and tying green branches to support the wheel. The caravan gets moving again, but you are thoroughly fatigued. Gained +35% Exhaustion.`;
        }
      } else if (encounter.type === 'mana_storm') {
        if (option.id === 'spell_barrier') {
          if (isSuccess) {
            xpGained = 60;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You erect a glowing blue sphere of pure arcane energy around the horses and carriage. The wild magenta lightning bolts bounce off the barrier, charging your inner power! Gained +${xpGained} XP.`;
          } else {
            hpChange = -20;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! The electrical pressure is too intense. The magic barrier bursts, sending a violent shock back into your hands, stinging your nervous system! Lost -20 HP.`;
          }
        } else if (option.id === 'ground_metal') {
          if (isSuccess) {
            xpGained = 55;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! You quickly forge iron grounding lines from the metal stockpile down into the earth. The electrical charge safely dissipates into the muddy roadside, letting you cross without harm. Gained +${xpGained} XP.`;
          } else {
            hpChange = -15;
            exhaustionChange = 20;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! A stray flash of plasma strikes a wagon frame as you wire the line. You are thrown back by the static discharge, suffering burns and exhaustion. Lost -15 HP and gained +20% Exhaustion.`;
          }
        } else if (option.id === 'ride_through') {
          if (isSuccess) {
            xpGained = 50;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! Miraculously, you guide the horses in a zig-zag dash. Lightning bolts strike inches away, turning rocks to molten glass, but not a single spark touches the carriage! Gained +${xpGained} XP.`;
          } else {
            hpChange = -25;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! Unlucky! A direct strike hits the primary storage wagon, blasting splinters everywhere and shocking everyone in the vicinity. Lost -25 HP.`;
          }
        }
      } else if (encounter.type === 'bridge_collapse') {
        if (option.id === 'carpentry') {
          xpGained = 55;
          resultLog = `🔨 You dismantle spare timbers and lay a sturdy cross-hatched reinforcement ramp across the gorge chasm. The heavy wagons roll smoothly over the breach! Gained +${xpGained} XP. Used 15 Scrap Wood logs.`;
        } else if (option.id === 'steer') {
          if (isSuccess) {
            xpGained = 70;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! Taking the leather reins from Baron Tobias, you hold the lead horses steady. With breathtaking precision, you glide the heavy wooden wheels directly along the narrow structural girder! Gained +${xpGained} XP.`;
          } else {
            hpChange = -15;
            exhaustionChange = 30;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! One of the wheels slips off the girder, tilting the wagon dangerously! You strain your shoulder hauling it back onto safe dirt, but the rear carriage cargo took structural damage. Lost -15 HP and gained +30% Exhaustion.`;
          }
        } else if (option.id === 'magical_levitation') {
          if (isSuccess) {
            xpGained = 65;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! Channeling wind currents, you form a soft, floating updraft beneath the heavy wooden carriages. The horses pull them with weightless ease across the shattered gap! Gained +${xpGained} XP.`;
          } else {
            hpChange = -12;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! Your concentration wavers mid-cast, and the kinetic gravity lifts collapse abruptly. The carriage slams hard onto the rocky stone gap, giving everyone a jarring shock. Lost -12 HP.`;
          }
        }
      } else if (encounter.type === 'mysterious_merchant') {
        if (option.id === 'buy_herbs') {
          xpGained = 30;
          nextMats['mat_berry'] = (nextMats['mat_berry'] || 0) + 10;
          nextMats['mat_thick_hide'] = (nextMats['mat_thick_hide'] || 0) + 2;
          resultLog = `🪙 You hand over 100 gold coins. The eccentric trader laughs merrily and reaches into his tortoise saddlebags, gifting you a bundle of 10 Wild Berries and 2 Thick Wild Hides! Gained +30 XP.`;
        } else if (option.id === 'trade_hides') {
          xpGained = 40;
          nextMats['mat_iron'] = (nextMats['mat_iron'] || 0) + 4;
          resultLog = `🟤 You trade 3 Thick Wild Hides. The merchant inspects the furs with satisfaction and hands you 4 chunks of refined Scrap Iron metal from his forge trunk! Gained +40 XP. Used 3 Thick Wild Hides.`;
        } else if (option.id === 'ignore') {
          resultLog = `🚶 You wave a friendly goodbye. The eccentric tortoise merchant slowly moves aside, leaving the mountain path clear. Safe travels!`;
        }
      } else if (encounter.type === 'swamp_gas') {
        if (option.id === 'alchemy') {
          if (isSuccess) {
            xpGained = 60;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! Combining mineral dust and moisture in an empty flask, you spray an acidic neutralizer. The thick yellow miasma dissolves into harmless vapor before it can harm the crew! Gained +${xpGained} XP.`;
          } else {
            hpChange = -18;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! Your reagent ratio was incorrect, resulting in a minor chemical flash. You inhale a mouthful of sulfur gas, coughing violently. Lost -18 HP.`;
          }
        } else if (option.id === 'constitution') {
          if (isSuccess) {
            xpGained = 55;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). SUCCESS! With lungs of iron, you lead the charge, guiding the horse carriage through the yellow fog at top speed. Your lungs burn but you pull everyone out safely without lasting damage! Gained +${xpGained} XP.`;
          } else {
            hpChange = -25;
            exhaustionChange = 20;
            resultLog = `🎲 Rolled ${d20} + Mod ${modifier} = ${totalRoll} (vs Diff ${option.difficulty}). FAILURE! You inhale the poison mist. A horrible nausea overcomes you, leaving your limbs weak and heavy. Lost -25 HP and gained +20% Exhaustion.`;
          }
        } else if (option.id === 'herbs') {
          xpGained = 45;
          resultLog = `🌿 You mash 12 Wild Berries into a thick, sweet anti-toxic paste for the draft horses and guards. The natural fruit acids fully filter out the worst of the toxic fumes! Gained +${xpGained} XP. Used 12 Wild Berries.`;
        }
      }

      let nextHp = playerStats.hp;
      if (hpChange < 0) {
        nextHp = Math.max(1, playerStats.hp + hpChange);
        playSound('hurt');
      } else if (encounter.type === 'pilgrim' && option.id === 'bless') {
        nextHp = playerStats.maxHp;
        playSound('heal');
      }

      let nextMp = playerStats.mp;
      if (encounter.type === 'pilgrim' && option.id === 'bless') {
        nextMp = playerStats.maxMp;
      }

      let nextExhaustion = Math.max(0, Math.min(100, (playerStats.exhaustion || 0) + exhaustionChange));
      if (encounter.type === 'pilgrim' && option.id === 'bless') {
        nextExhaustion = 0;
      }

      let nextXp = playerStats.xp + xpGained;
      let nextLevel = playerStats.level;
      let nextMaxHp = playerStats.maxHp;
      let nextMaxMp = playerStats.maxMp;
      let nextUnspentPoints = playerStats.unspentPoints;
      let nextXpNext = playerStats.xpNext;

      if (nextXp >= nextXpNext) {
        nextLevel += 1;
        nextXp -= nextXpNext;
        nextXpNext = Math.round(nextXpNext * 1.5);
        nextMaxHp += 15;
        nextMaxMp += 8;
        nextHp = nextMaxHp;
        nextMp = nextMaxMp;
        nextUnspentPoints += 3;
        resultLog += ` 🎉 LEVEL UP! You have achieved Level ${nextLevel}! Attributes boosted.`;
        playSound('levelUp');
      }

      const updatedEncounter: CaravanEncounter = {
        ...encounter,
        resolved: true,
        selectedOptionId: optionId,
        rolledValue: totalRoll,
        resultLog
      };

      const updatedTravel: CaravanTravelState = {
        ...travel,
        currentEncounter: updatedEncounter,
        stepsHistory: [...travel.stepsHistory, resultLog]
      };

      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          gold: nextGold,
          hp: nextHp,
          mp: nextMp,
          exhaustion: nextExhaustion,
          xp: nextXp,
          level: nextLevel,
          maxHp: nextMaxHp,
          maxMp: nextMaxMp,
          xpNext: nextXpNext,
          unspentPoints: nextUnspentPoints
        },
        inventoryMaterials: nextMats,
        caravanTravel: updatedTravel
      };
    });
  };

  const handleCompleteCaravanTravel = () => {
    playSound('levelUp');
    setGameState((prev) => {
      const travel = prev.caravanTravel;
      if (!travel) return prev;

      const destX = travel.destX;
      const destY = travel.destY;
      const destName = travel.destName;
      const reward = travel.rewardGold;

      const nextGold = prev.playerStats.gold + reward;

      const targetChunkKey = `${destX},${destY}`;
      let updatedChunks = prev.overworldChunks ? { ...prev.overworldChunks } : {};
      let targetChunk = updatedChunks[targetChunkKey];
      let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
      let hasSeppoOnLoad = false;
      
      const newPx = Math.floor(LEVEL_WIDTH / 2);
      const newPy = Math.floor(LEVEL_HEIGHT / 2) + 2;

      if (!targetChunk) {
        targetChunk = generateOverworldChunk(destX, destY, LEVEL_WIDTH, LEVEL_HEIGHT, nextSpawnedCats, prev.spawnedSeppo, prev.playerStats, prev.currentWeapon);
        targetChunk.npcs.forEach(n => {
          if (n.id?.startsWith('npc_cat_')) {
            const catName = n.name.split(' (')[0];
            if (!nextSpawnedCats.includes(catName)) {
              nextSpawnedCats.push(catName);
            }
          }
        });
        hasSeppoOnLoad = targetChunk.npcs.some(n => n.id === 'npc_seppo');
      }

      const safePlayerPos = findNearestSafePlayerTile(newPx, newPy, targetChunk.map);
      const finalPx = safePlayerPos.x;
      const finalPy = safePlayerPos.y;

      const fov = computeFOV(finalPx, finalPy, targetChunk.map, 6);
      const discovered = targetChunk.map.map((row, y) =>
        row.map((cell, x) => ((targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
      );

      const nextVisited = { ...prev.visitedTiles };
      nextVisited[`${finalPx},${finalPy},${destX},${destY}`] = true;

      const newMsgs = [...prev.logs];
      newMsgs.push({
        id: `caravan_arrived_${Date.now()}`,
        text: `🏆 [CARAVAN SECURED]: You have safely escorted the merchant caravan to ${destName}! Baron Tobias smiles warmly and slides a heavy reward pouch into your hands. +${reward} Gold collected!`,
        type: 'loot',
        timestamp: formatGameTime(prev.gameTime).timeStr
      });

      return {
        ...prev,
        playerX: finalPx,
        playerY: finalPy,
        currentChunkX: destX,
        currentChunkY: destY,
        overworldChunks: {
          ...updatedChunks,
          [targetChunkKey]: targetChunk
        },
        spawnedCats: nextSpawnedCats,
        spawnedSeppo: prev.spawnedSeppo || hasSeppoOnLoad,
        map: targetChunk.map,
        discovered: discovered,
        visible: fov,
        enemies: spawnFollowersOnLevelLoadByReset(targetChunk.enemies, prev.followers, finalPx, finalPy, targetChunk.map),
        traps: targetChunk.traps,
        chests: targetChunk.chests,
        npcs: targetChunk.npcs,
        lootPiles: targetChunk.lootPiles || [],
        logs: newMsgs,
        playerStats: {
          ...prev.playerStats,
          gold: nextGold
        },
        caravanTravel: null
      };
    });
  };

  const handleRecallTeleport = (destX: number, destY: number, destName: string) => {
    if (!activeRecallScroll) return;
    const scrollId = activeRecallScroll.id;
    setActiveRecallScroll(null);

    playSound('spell');
    setGameState((prev) => {
      if (prev.playerStats.mp < 15) {
        const errorMsgs = [...prev.logs];
        errorMsgs.push({
          id: `recall_fail_mana_${Date.now()}`,
          text: `❌ [CAST FAIL]: Your attempt to read the Scroll of Recall failed due to insufficient Mana!`,
          type: 'system',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
        return {
          ...prev,
          logs: errorMsgs
        };
      }

      // 1. Consume the scroll from inventory
      const updatedInventory = consumeItemFromInventory(prev.equipmentInventory, scrollId, 1);

      // 2. Save dungeon state if currently in dungeon
      let updatedDungeonLevels = prev.dungeonLevels || {};
      if (!prev.isOverworld) {
        const exChunkX = prev.currentChunkX;
        const exChunkY = prev.currentChunkY;
        const currentDepth = prev.playerStats.depth;
        const key = `${exChunkX},${exChunkY}_depth-${currentDepth}`;

        const saved: DungeonLevelState = {
          depth: currentDepth,
          chunkX: exChunkX,
          chunkY: exChunkY,
          map: prev.map,
          discovered: prev.discovered,
          visible: prev.visible,
          enemies: prev.enemies,
          traps: prev.traps,
          chests: prev.chests,
          lootPiles: prev.lootPiles || [],
          corpses: prev.corpses || [],
          bloodSplatters: prev.bloodSplatters || [],
          props: prev.dungeonProps || [],
        };

        updatedDungeonLevels = {
          ...updatedDungeonLevels,
          [key]: saved,
        };
      }

      // 3. Load or generate target overworld chunk
      const targetChunkKey = `${destX},${destY}`;
      let updatedChunks = prev.overworldChunks ? { ...prev.overworldChunks } : {};
      let targetChunk = updatedChunks[targetChunkKey];
      let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
      let hasSeppoOnLoad = false;
      
      const newPx = Math.floor(LEVEL_WIDTH / 2);
      const newPy = Math.floor(LEVEL_HEIGHT / 2) + 2;

      if (!targetChunk) {
        targetChunk = generateOverworldChunk(destX, destY, LEVEL_WIDTH, LEVEL_HEIGHT, nextSpawnedCats, prev.spawnedSeppo, prev.playerStats, prev.currentWeapon);
        targetChunk.npcs.forEach(n => {
          if (n.id?.startsWith('npc_cat_')) {
            const catName = n.name.split(' (')[0];
            if (!nextSpawnedCats.includes(catName)) {
              nextSpawnedCats.push(catName);
            }
          }
        });
        hasSeppoOnLoad = targetChunk.npcs.some(n => n.id === 'npc_seppo');
      }

      const safePlayerPos = findNearestSafePlayerTile(newPx, newPy, targetChunk.map);
      const finalPx = safePlayerPos.x;
      const finalPy = safePlayerPos.y;

      const fov = computeFOV(finalPx, finalPy, targetChunk.map, 6);
      const discovered = targetChunk.map.map((row, y) =>
        row.map((cell, x) => ((targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
      );

      const nextVisited = { ...prev.visitedTiles };
      nextVisited[`${finalPx},${finalPy},${destX},${destY}`] = true;

      // 4. Append arrival message log
      const newMsgs = [...prev.logs];
      newMsgs.push({
        id: `recall_teleport_${Date.now()}`,
        text: `🔮 [RECALL PORTAL ACTIVATED]: You read the Scroll of Recall! Blazing leyline sigils erupt around your feet, warping space and time. You instantly dematerialize and reappear in the safety of ${destName}!`,
        type: 'loot',
        timestamp: formatGameTime(prev.gameTime).timeStr
      });

      return {
        ...prev,
        isOverworld: true,
        playerX: finalPx,
        playerY: finalPy,
        currentChunkX: destX,
        currentChunkY: destY,
        overworldChunks: {
          ...updatedChunks,
          [targetChunkKey]: targetChunk
        },
        spawnedCats: nextSpawnedCats,
        spawnedSeppo: prev.spawnedSeppo || hasSeppoOnLoad,
        map: targetChunk.map,
        discovered: discovered,
        visible: fov,
        enemies: spawnFollowersOnLevelLoadByReset(targetChunk.enemies, prev.followers, finalPx, finalPy, targetChunk.map),
        traps: targetChunk.traps,
        chests: targetChunk.chests,
        npcs: targetChunk.npcs,
        lootPiles: targetChunk.lootPiles || [],
        corpses: [],
        bloodSplatters: [],
        dungeonProps: [],
        dungeonLevels: updatedDungeonLevels,
        equipmentInventory: updatedInventory,
        logs: newMsgs,
        playerStats: {
          ...prev.playerStats,
          depth: 0,
          mp: Math.max(0, prev.playerStats.mp - 15)
        }
      };
    });
  };

  const handleSellEquipment = (item: EquipmentItem) => {
    const activeId = gameState.activeTradeNpcId || 'npc_shop';
    const activeNpc = gameState.npcs?.find(n => n.id === activeId);
    const activeRole = activeNpc?.role || (activeId === 'npc_caravan_merchant' || activeId.includes('caravan') ? 'merchant' : '');
    
    const reputation = gameState.townReputation ?? 100;
    if (reputation <= 20 && activeRole !== 'merchant_seppo') {
      playSound('bump');
      addLogMessage(`❌ REFUSED: Town merchants refuse to trade with a notorious Sunder Outlaw!`, 'system');
      return;
    }

    const mConfig = getMerchantConfig(activeRole, activeId);
    const currentGold = gameState.merchantGold?.[activeId] !== undefined
      ? gameState.merchantGold[activeId]
      : mConfig.maxGold;

    const finalPayout = gameState.hasActiveCaravanLicense ? Math.round(item.value * 1.30) : item.value;

    if (currentGold < finalPayout) {
      playSound('bump');
      addLogMessage(`❌ ${activeNpc?.name || 'The merchant'} does not have enough Gold coins! Merchant has ${currentGold} Gold, you want to sell for ${finalPayout} Gold.`, 'system');
      return;
    }

    playSound('loot');
    setGameState((prev) => {
      const nextInv = prev.equipmentInventory.filter((it) => it.id !== item.id);
      const nextStats = { ...prev.playerStats, gold: prev.playerStats.gold + finalPayout };
      const updatedGoldCopy = prev.merchantGold ? { ...prev.merchantGold } : {};
      updatedGoldCopy[activeId] = Math.max(0, currentGold - finalPayout);

      return {
        ...prev,
        equipmentInventory: nextInv,
        playerStats: nextStats,
        merchantGold: updatedGoldCopy
      };
    });
    addLogMessage(`💰 Sold "${item.name}" for +${finalPayout} Gold back to shop keeper!`, 'loot');
  };

  const handleRepairItem = (slotOrId: string, item: any, isEquipped: boolean) => {
    if (!isItemRepairable(item)) {
      playSound('bump');
      addLogMessage(`❌ "${item.name}" is a resource harvesting tool and cannot be repaired! Craft a new one when it breaks.`, 'system');
      return;
    }

    const cost = Math.max(1, Math.floor(((item.maxDurability ?? 100) - (item.durability ?? 100)) * 0.5));
    if (gameState.playerStats.gold < cost) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold! Repairing "${item.name}" costs ${cost} Gold.`, 'system');
      return;
    }

    playSound('loot');
    setGameState((prev) => {
      const nextGold = prev.playerStats.gold - cost;
      const updatedStats = { ...prev.playerStats, gold: nextGold };

      if (isEquipped) {
        if (slotOrId === 'currentWeapon') {
          const repaired = prev.currentWeapon ? { ...prev.currentWeapon, durability: prev.currentWeapon.maxDurability ?? 100 } : null;
          return { ...prev, currentWeapon: repaired, playerStats: updatedStats };
        } else {
          const slotKey = slotOrId as 'equippedArmor' | 'equippedHelmet' | 'equippedGloves' | 'equippedBoots' | 'equippedShield' | 'equippedAmulet';
          const repaired = prev[slotKey] ? { ...prev[slotKey], durability: prev[slotKey]!.maxDurability ?? 100 } : null;
          return { ...prev, [slotKey]: repaired, playerStats: updatedStats };
        }
      } else {
        const nextInv = prev.equipmentInventory.map((it) => {
          if (it.id === slotOrId) {
            return { ...it, durability: it.maxDurability ?? 100 };
          }
          return it;
        });
        return { ...prev, equipmentInventory: nextInv, playerStats: updatedStats };
      }
    });

    addLogMessage(`🔨 Blacksmith restored "${item.name}" durability! (-${cost} Gold)`, 'craft');
  };

  const handleRepairAll = () => {
    let totalCost = 0;
    const itemsToRepair: { slotOrId: string; item: any; isEquipped: boolean }[] = [];

    const checkItem = (slotOrId: string, item: any, isEquipped: boolean) => {
      if (item && isItemRepairable(item) && item.durability !== undefined && item.maxDurability !== undefined && item.durability < item.maxDurability) {
        const cost = Math.max(1, Math.floor((item.maxDurability - item.durability) * 0.5));
        totalCost += cost;
        itemsToRepair.push({ slotOrId, item, isEquipped });
      }
    };

    checkItem('currentWeapon', gameState.currentWeapon, true);
    checkItem('equippedArmor', gameState.equippedArmor, true);
    checkItem('equippedHelmet', gameState.equippedHelmet, true);
    checkItem('equippedGloves', gameState.equippedGloves, true);
    checkItem('equippedBoots', gameState.equippedBoots, true);
    checkItem('equippedShield', gameState.equippedShield, true);
    checkItem('equippedAmulet', gameState.equippedAmulet, true);

    gameState.equipmentInventory.forEach((it) => {
      checkItem(it.id, it, false);
    });

    if (itemsToRepair.length === 0) {
      addLogMessage(`🛠️ All of your equipment is in pristine 100% condition!`, 'system');
      return;
    }

    if (gameState.playerStats.gold < totalCost) {
      playSound('bump');
      addLogMessage(`❌ Repairing all items costs ${totalCost} Gold. You only have ${gameState.playerStats.gold} Gold!`, 'system');
      return;
    }

    playSound('loot');
    setGameState((prev) => {
      const nextGold = prev.playerStats.gold - totalCost;
      let nextWeapon = prev.currentWeapon;
      let nextArmor = prev.equippedArmor;
      let nextHelmet = prev.equippedHelmet;
      let nextGloves = prev.equippedGloves;
      let nextBoots = prev.equippedBoots;
      let nextShield = prev.equippedShield;
      let nextAmulet = prev.equippedAmulet;

      if (nextWeapon && nextWeapon.durability !== undefined && nextWeapon.maxDurability !== undefined) {
        nextWeapon = { ...nextWeapon, durability: nextWeapon.maxDurability };
      }
      if (nextArmor && nextArmor.durability !== undefined && nextArmor.maxDurability !== undefined) {
        nextArmor = { ...nextArmor, durability: nextArmor.maxDurability };
      }
      if (nextHelmet && nextHelmet.durability !== undefined && nextHelmet.maxDurability !== undefined) {
        nextHelmet = { ...nextHelmet, durability: nextHelmet.maxDurability };
      }
      if (nextGloves && nextGloves.durability !== undefined && nextGloves.maxDurability !== undefined) {
        nextGloves = { ...nextGloves, durability: nextGloves.maxDurability };
      }
      if (nextBoots && nextBoots.durability !== undefined && nextBoots.maxDurability !== undefined) {
        nextBoots = { ...nextBoots, durability: nextBoots.maxDurability };
      }
      if (nextShield && nextShield.durability !== undefined && nextShield.maxDurability !== undefined) {
        nextShield = { ...nextShield, durability: nextShield.maxDurability };
      }
      if (nextAmulet && nextAmulet.durability !== undefined && nextAmulet.maxDurability !== undefined) {
        nextAmulet = { ...nextAmulet, durability: nextAmulet.maxDurability };
      }

      const nextInv = prev.equipmentInventory.map((it) => {
        if (it.durability !== undefined && it.maxDurability !== undefined && it.durability < it.maxDurability) {
          return { ...it, durability: it.maxDurability };
        }
        return it;
      });

      return {
        ...prev,
        currentWeapon: nextWeapon,
        equippedArmor: nextArmor,
        equippedHelmet: nextHelmet,
        equippedGloves: nextGloves,
        equippedBoots: nextBoots,
        equippedShield: nextShield,
        equippedAmulet: nextAmulet,
        equipmentInventory: nextInv,
        playerStats: {
          ...prev.playerStats,
          gold: nextGold
        }
      };
    });

    addLogMessage(`🔨 Blacksmith sharpened and repaired ALL of your gear! (-${totalCost} Gold)`, 'craft');
  };

  const renderItemDurability = (dur: number | undefined, max: number | undefined) => {
    if (dur === undefined || max === undefined) return null;
    const pct = max > 0 ? (dur / max) * 100 : 100;
    const finalPct = Math.min(100, Math.max(0, pct));
    let colorClass = 'text-emerald-400';
    if (dur === 0) colorClass = 'text-rose-500 font-bold';
    else if (finalPct < 25) colorClass = 'text-amber-500 font-semibold animate-pulse';
    else if (finalPct < 60) colorClass = 'text-yellow-400';
    
    return (
      <div className="flex flex-col w-full px-1 items-center mt-0.5">
        <span className={`text-[7px] font-mono leading-none ${colorClass}`}>
          {dur === 0 ? '🛠️ BROKEN' : `⚡ ${dur}/${max}`}
        </span>
        <div className="w-full h-[2.5px] bg-slate-950 rounded-full mt-0.5 overflow-hidden border border-slate-900">
          <div className={`h-full transition-all duration-300 ${dur === 0 ? 'bg-rose-500' : finalPct < 25 ? 'bg-amber-500' : finalPct < 60 ? 'bg-yellow-400' : 'bg-emerald-500'}`} style={{ width: `${finalPct}%` }} />
        </div>
      </div>
    );
  };

  const handleConsumeLockpick = () => {
    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };
      nextMats['mat_lockpick'] = Math.max(0, (nextMats['mat_lockpick'] || 0) - 1);
      return {
        ...prev,
        inventoryMaterials: nextMats,
      };
    });
  };

  const handleOpenChest = (chestIndex: number, isPerfect: boolean) => {
    playSound('loot');
    const chest = gameState.chests[chestIndex];
    if (!chest) return;

    // Grant resources
    const goldMult = (window as any).arenaGoldMultiplier || 1.0;
    let calculatedGold = Math.round(chest.gold * goldMult);
    if (isPerfect) {
      calculatedGold += 25; // Perfect lockpick bonus gold!
    }

    addLogMessage(`🎁 You popped open a dusty treasure cache!`, 'loot');
    addLogMessage(`💰 Obtained: ${calculatedGold} Gold!${isPerfect ? ' (⭐ Perfect Lockpicking Bonus +25g)' : ''}`, 'loot');

    setGameState((prev) => {
      // Clone inventories
      const nextMats = { ...prev.inventoryMaterials };
      const nextCats = { ...prev.inventoryCatalysts };

      const leftMaterials: string[] = [];
      const leftCatalysts: string[] = [];

      chest.materials.forEach((mid) => {
        const matItem = BASIC_MATERIALS.find((m) => m.id === mid);
        if (matItem) {
          const uWeight = getMaterialUnitWeight(mid);
          nextMats[mid] = (nextMats[mid] || 0) + 1;
          addLogMessage(`  + Metal: ${matItem.name} (${uWeight} kg)`, 'loot');
        }
      });

      chest.catalysts.forEach((cid) => {
        const catItem = ELEMENTAL_CATALYSTS.find((c) => c.id === cid);
        if (catItem) {
          const uWeight = getMaterialUnitWeight(cid);
          nextCats[cid] = (nextCats[cid] || 0) + 1;
          addLogMessage(`  + Catalyst: ${catItem.name} (${uWeight} kg)`, 'loot');
        }
      });

      // Perfect bonus: 1 random elemental catalyst shard!
      if (isPerfect) {
        const randomCat = ELEMENTAL_CATALYSTS[Math.floor(Math.random() * ELEMENTAL_CATALYSTS.length)];
        if (randomCat) {
          nextCats[randomCat.id] = (nextCats[randomCat.id] || 0) + 1;
          addLogMessage(`  ⭐ Perfect Unlock Catalyst Bonus: ${randomCat.name}!`, 'loot');
        }
      }

      // Toggle chest opened state
      const nextChests = [...prev.chests];
      nextChests[chestIndex] = { ...chest, isOpened: true };

      let nextActiveEscapeAlarm = prev.activeEscapeAlarm;
      let nextFactionReputation = prev.factionReputation ? { ...prev.factionReputation } : { syndicate: 0, vanguard: 0, bandits: 0 };
      const nextLogs = [...prev.logs];

      if (chest.id?.startsWith('syndicate_chest_')) {
        if (prev.faction !== 'syndicate') {
          nextActiveEscapeAlarm = 'syndicate';
          const curRep = nextFactionReputation.syndicate ?? 0;
          const nextRep = Math.max(-100, curRep - 20);
          nextFactionReputation.syndicate = nextRep;
          nextLogs.push({
            id: `alarm_${Date.now()}`,
            text: `🚨 [ESCAPE ALARM ACTIVE]: You have raided the Moonshadow Syndicate Vault without alignment! Silas's agents have been alerted and will pursue you across the chunk! Standing decreased by -20. (Standing: ${nextRep})`,
            type: 'danger',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        } else {
          nextLogs.push({
            id: `vault_access_${Date.now()}`,
            text: `⚖️ [FACTION PREROGATIVE]: Silas permits your access to this vault due to your Syndicate Alliance.`,
            type: 'info',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        }
      } else if (chest.id?.startsWith('vanguard_chest_')) {
        if (prev.faction !== 'vanguard') {
          nextActiveEscapeAlarm = 'vanguard';
          const curRep = nextFactionReputation.vanguard ?? 0;
          const nextRep = Math.max(-100, curRep - 20);
          nextFactionReputation.vanguard = nextRep;
          nextLogs.push({
            id: `alarm_${Date.now()}`,
            text: `🚨 [ESCAPE ALARM ACTIVE]: You have raided the Dawn Vanguard Holy Vault without alignment! Captain Valerius's sentries have been alerted and will pursue you across the chunk! Standing decreased by -20. (Standing: ${nextRep})`,
            type: 'danger',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        } else {
          nextLogs.push({
            id: `vault_access_${Date.now()}`,
            text: `⚖️ [FACTION PREROGATIVE]: Valerius permits your access to this vault due to your Vanguard Alliance.`,
            type: 'info',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        }
      } else if (chest.id?.startsWith('bandits_chest_')) {
        if (prev.faction !== 'bandits') {
          nextActiveEscapeAlarm = 'bandits';
          const curRep = nextFactionReputation.bandits ?? 0;
          const nextRep = Math.max(-100, curRep - 20);
          nextFactionReputation.bandits = nextRep;
          nextLogs.push({
            id: `alarm_${Date.now()}`,
            text: `🚨 [ESCAPE ALARM ACTIVE]: You have raided the Rust-Raider Bandits Cache without alignment! Outlaw cutthroats have been alerted and will pursue you! Standing decreased by -20. (Standing: ${nextRep})`,
            type: 'danger',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        } else {
          nextLogs.push({
            id: `vault_access_${Date.now()}`,
            text: `⚖️ [FACTION PREROGATIVE]: The Bandit King permits your access to this cache due to your Raider Alliance.`,
            type: 'info',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        }
      }

      if (chest.id?.startsWith('tribute_chest_')) {
        nextLogs.push({
          id: `tribute_opened_${Date.now()}`,
          text: `👑 [TRIBUTE CLAIMED]: You have unlocked the Faction Tribute Chest! Pristine alchemical catalysts, rare metal alloys, and tribute gold are yours!`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      let nextHasTransmuter = prev.hasTransmuter;
      if (!prev.hasTransmuter && Math.random() < 0.12) {
        nextHasTransmuter = true;
        nextLogs.push({
          id: `trans_found_${Date.now()}`,
          text: `🧪 [LUCKY FIND]: You discover a Portable Alchemical Transmuter (Wild Magic Flask) stashed in a secret compartment of the chest! The Transmute panel has been unlocked in your backpack!`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      let nextEquip = [...prev.equipmentInventory];
      // 30% chance to find any random equipment (weapons, shields, gloves, helmets, boots, armor) inside a chest! (Boosted by Luck!)
      // Within this pool, Necklaces/Amulets are rare loot.
      const chestLck = getEffectiveAttribute(prev, 'lck');
      const chestLuckBonus = Math.max(0, chestLck - 10) * (gameConfig.worldRates?.equipmentDropRateBonusPerLuck ?? 0.03);
      const finalChestGearChance = Math.min(0.90, 0.30 + chestLuckBonus);
      if (Math.random() < finalChestGearChance) {
        const gear = generateRandomLootGear(false, false, "Chest Loot");
        nextEquip.push(gear);
        if (gear.subType === 'Amulet') {
          nextLogs.push({
            id: `amulet_found_${Date.now()}`,
            text: `💎 [RARE LOOT DETECTED]: You found a rare necklace inside the treasure cache! "${gear.name}" (${Object.entries(gear.statBonuses || {}).map(([s,v]) => `+${v} ${s.toUpperCase()}`).join(', ')})`,
            type: 'loot',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        } else {
          nextLogs.push({
            id: `gear_found_${Date.now()}`,
            text: `🛡️ [EQUIPMENT ACQUIRED]: You found a piece of gear inside the treasure cache: "${gear.name}"!`,
            type: 'loot',
            timestamp: formatGameTime(prev.gameTime).timeStr
          });
        }
      }

      if (Math.random() < 0.05) {
        const recallScroll = {
          id: `scroll_recall_town_${Date.now()}_${Math.random()}`,
          name: "Scroll of Recall 📜",
          type: 'scroll' as any,
          subType: 'Scroll' as any,
          defense: 0,
          damage: 0,
          critChance: 0,
          range: 0,
          color: '#38bdf8',
          description: "A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!",
          value: 200,
          durability: 100,
          maxDurability: 100
        };
        nextEquip.push(recallScroll);
        nextLogs.push({
          id: `recall_scroll_chest_${Date.now()}`,
          text: `📜 [RARE LOOT DETECTED]: You found an incredibly rare Scroll of Recall inside the treasure cache!`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      // 10% chance to find a Grim Skeleton Key inside a chest!
      if (Math.random() < 0.10) {
        nextMats['mat_skeleton_key'] = (nextMats['mat_skeleton_key'] || 0) + 1;
        nextLogs.push({
          id: `skeleton_key_chest_${Date.now()}`,
          text: `💀 [RARE LOOT DETECTED]: You found an incredibly rare Grim Skeleton Key inside the chest! This key instantly unlocks any chest.`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      return {
        ...prev,
        chests: nextChests,
        equipmentInventory: nextEquip,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        activeEscapeAlarm: nextActiveEscapeAlarm,
        factionReputation: nextFactionReputation,
        hasTransmuter: nextHasTransmuter,
        logs: nextLogs,
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold + calculatedGold,
          xp: prev.playerStats.xp + 40, // grant +40 Lockpicking XP!
        },
      };
    });

    // Also, trigger enemy turn so time advances normally when you unlock!
    executeEnemiesTurn(gameState.playerX, gameState.playerY);
  };

  const handleAlchemicalTransmute = (sourceId: string, targetId: string) => {
    playSound('mutate');
    setGameState(prev => {
      const count = prev.inventoryMaterials[sourceId] || 0;
      if (count < 2) return prev;
      
      const nextMats = { ...prev.inventoryMaterials };
      nextMats[sourceId] = count - 2;

      let surgeChance = Math.random();
      let isSurge = surgeChance < 0.15;
      const nextLogs = [...prev.logs];
      
      if (isSurge) {
        const catPool = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
        const randomCat = catPool[Math.floor(Math.random() * catPool.length)];
        const nextCats = { ...prev.inventoryCatalysts };
        nextCats[randomCat] = (nextCats[randomCat] || 0) + 1;
        
        nextLogs.push({
          id: `surge_${Date.now()}`,
          text: `🔮 [WILD SURGE]: The Portable Alchemical Transmuter backfires with a radiant lilac spark! Instead of synthesizing ${targetId.replace('mat_','').toUpperCase()}, you generated 1x ${randomCat.replace('cat_','').toUpperCase()} Catalyst!`,
          type: 'danger',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
        
        return {
          ...prev,
          inventoryMaterials: nextMats,
          inventoryCatalysts: nextCats,
          logs: nextLogs
        };
      } else {
        nextMats[targetId] = (nextMats[targetId] || 0) + 1;
        nextLogs.push({
          id: `trans_${Date.now()}`,
          text: `🧪 [ALCHEMIZED]: Successfully transmuted 2x ${sourceId.replace('mat_','').toUpperCase()} into 1x ${targetId.replace('mat_','').toUpperCase()}!`,
          type: 'craft',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
        
        return {
          ...prev,
          inventoryMaterials: nextMats,
          logs: nextLogs
        };
      }
    });
  };

  const handleShiftCatalyst = (sourceCatId: string) => {
    playSound('mutate');
    setGameState(prev => {
      const count = prev.inventoryCatalysts[sourceCatId] || 0;
      if (count < 1 || prev.playerStats.gold < 10) return prev;
      
      const nextCats = { ...prev.inventoryCatalysts };
      nextCats[sourceCatId] = count - 1;
      
      const catPool = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'].filter(id => id !== sourceCatId);
      const targetCat = catPool[Math.floor(Math.random() * catPool.length)];
      nextCats[targetCat] = (nextCats[targetCat] || 0) + 1;
      
      const nextLogs = [...prev.logs];
      nextLogs.push({
        id: `shift_${Date.now()}`,
        text: `🔮 [ELEMENTAL SHIFT]: Reacted 1x ${sourceCatId.replace('cat_','').toUpperCase()} with 10 Gold. Shifted into 1x ${targetCat.replace('cat_','').toUpperCase()}!`,
        type: 'craft',
        timestamp: formatGameTime(prev.gameTime).timeStr
      });
      
      return {
        ...prev,
        inventoryCatalysts: nextCats,
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold - 10
        },
        logs: nextLogs
      };
    });
  };

  const handleUnstableReactorSurge = () => {
    playSound('mutate');
    setGameState(prev => {
      if (prev.playerStats.gold < 100) return prev;
      
      const nextCats = { ...prev.inventoryCatalysts };
      const totalCats: number = Object.values(nextCats).reduce<number>((sum, qty) => sum + (Number(qty) || 0), 0);
      if (totalCats < 2) return prev;
      
      let deductedCount = 0;
      const catKeys = Object.keys(nextCats);
      for (const key of catKeys) {
        while (nextCats[key] > 0 && deductedCount < 2) {
          nextCats[key]--;
          deductedCount++;
        }
        if (deductedCount >= 2) break;
      }
      
      const nextLogs = [...prev.logs];
      const roll = Math.random();
      let nextEquipment = [...prev.equipmentInventory];
      let nextMats = { ...prev.inventoryMaterials };
      let nextHp = prev.playerStats.hp;
      const nextChests = [...prev.chests];
      
      if (roll < 0.40) {
        const rareItems = [
          { id: 'axe_wild_magic', name: 'Cosmic Wildfire Blade', type: 'weapon', subType: WeaponBaseType.Sword, defense: 0, damage: 16, critChance: 0.25, range: 1, color: '#ec4899', description: 'A surging blade infused with pure, volatile wild magic.', value: 240, durability: 100, maxDurability: 100 },
          { id: 'shield_chaos', name: 'Aegis of Discord', type: 'armor', subType: 'Shield', defense: 9, damage: 0, critChance: 0, range: 0, color: '#a855f7', description: 'Blocks kinetic blows and channels energy back into raw aether sparks.', value: 180, durability: 100, maxDurability: 100 },
          { id: 'armor_void', name: 'Vestments of Void-Grip', type: 'armor', subType: 'HeavyArmor', defense: 10, damage: 0, critChance: 0, range: 0, color: '#8b5cf6', description: 'Warped heavy armor plating crafted from space debris.', value: 260, durability: 100, maxDurability: 100 }
        ];
        const selectedItem = rareItems[Math.floor(Math.random() * rareItems.length)];
        nextEquipment.push({
          ...selectedItem,
          id: `${selectedItem.id}_${Date.now()}`
        });
        nextLogs.push({
          id: `reactor_win_${Date.now()}`,
          text: `🎁 [REACTOR MASTERPIECE]: The wild magic flask surges and crystallizes! Out rolls a pristine, legendary equipment item: [${selectedItem.name}]!`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      } else if (roll < 0.70) {
        const rareMats = ['mat_mithril', 'mat_obsidian', 'mat_dragonscale', 'mat_feybone'];
        const count = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < count; i++) {
          const randMat = rareMats[Math.floor(Math.random() * rareMats.length)];
          nextMats[randMat] = (nextMats[randMat] || 0) + 1;
        }
        nextLogs.push({
          id: `reactor_mats_${Date.now()}`,
          text: `💎 [REACTOR SUCCESS]: The synthesis succeeds! Generated ${count}x rare stellar ore pieces inside your stash.`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      } else if (roll < 0.85) {
        nextHp = Math.max(5, nextHp - 10);
        nextMats['mat_obsidian'] = (nextMats['mat_obsidian'] || 0) + 2;
        nextCats['cat_fire'] = (nextCats['cat_fire'] || 0) + 2;
        nextLogs.push({
          id: `reactor_fail_${Date.now()}`,
          text: `💥 [REACTOR BLOWOUT]: CRITICAL OVERLOAD! The alchemical transmuter explodes with volatile steam! You take 10 Fire damage, but scoop 2x Obsidian and 2x Fire Shards from the blast.`,
          type: 'danger',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      } else {
        nextChests.push({
          id: `chaos_chest_${Date.now()}`,
          x: prev.playerX,
          y: prev.playerY,
          gold: 200,
          materials: ['mat_mithril', 'mat_dragonscale'],
          catalysts: ['cat_shadow'],
          isOpened: false
        });
        nextLogs.push({
          id: `reactor_portal_${Date.now()}`,
          text: `🌌 [REACTOR PORTAL]: The flask rips open an astral rift! A glistening ancient treasure cache materialized directly on your current coordinates!`,
          type: 'info',
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }
      
      return {
        ...prev,
        inventoryCatalysts: nextCats,
        inventoryMaterials: nextMats,
        equipmentInventory: nextEquipment,
        chests: nextChests,
        playerStats: {
          ...prev.playerStats,
          hp: nextHp,
          gold: prev.playerStats.gold - 100
        },
        logs: nextLogs
      };
    });
  };

  const handleEatMeat = (foodKey: string = 'mat_cooked_meat') => {
    const isPotion = foodKey.startsWith('potion_');
    const isScroll = foodKey === 'scroll_recall';

    if (isPotion) {
      playSound('drink');
    } else if (isScroll) {
      // Don't play sound yet, because if overworld, it fails to read
    } else {
      playSound('eat');
    }

    let shouldConsume = true;

    setGameState((prev) => {
      const count = prev.inventoryMaterials[foodKey] || 0;
      if (count <= 0) {
        shouldConsume = false;
        return prev;
      }

      if (isScroll && prev.isOverworld) {
        shouldConsume = false;
        return prev;
      }

      const nextMats = {
        ...prev.inventoryMaterials,
        [foodKey]: count - 1
      };

      if (isScroll) {
        // SCROLL OF ESCAPE TELEPORTATION LOGIC
        const exChunkX = prev.dungeonEntranceChunkX ?? 0;
        const exChunkY = prev.dungeonEntranceChunkY ?? 0;
        const exPlayerX = prev.dungeonEntrancePlayerX ?? 25;
        const exPlayerY = prev.dungeonEntrancePlayerY ?? 15;

        const currentDepth = prev.playerStats.depth;
        const key = `${exChunkX},${exChunkY}_depth-${currentDepth}`;

        const saved: DungeonLevelState = {
          depth: currentDepth,
          chunkX: exChunkX,
          chunkY: exChunkY,
          map: prev.map,
          discovered: prev.discovered,
          visible: prev.visible,
          enemies: prev.enemies,
          traps: prev.traps,
          chests: prev.chests,
          lootPiles: prev.lootPiles || [],
          corpses: prev.corpses || [],
          bloodSplatters: prev.bloodSplatters || [],
          props: prev.dungeonProps || [],
        };

        const updatedDungeonLevels = {
          ...prev.dungeonLevels,
          [key]: saved,
        };

        const targetChunkKey = `${exChunkX},${exChunkY}`;
        let targetChunk = prev.overworldChunks[targetChunkKey];
        let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
        let nextOverworldChunks = { ...prev.overworldChunks };
        if (!targetChunk) {
          targetChunk = generateOverworldChunk(exChunkX, exChunkY, LEVEL_WIDTH, LEVEL_HEIGHT, nextSpawnedCats, prev.spawnedSeppo, prev.playerStats, prev.currentWeapon);
          targetChunk.npcs.forEach(n => {
            if (n.id?.startsWith('npc_cat_')) {
              const catName = n.name.split(' (')[0];
              if (!nextSpawnedCats.includes(catName)) {
                nextSpawnedCats.push(catName);
              }
            }
          });
          nextOverworldChunks[targetChunkKey] = targetChunk;
        }

        const fov = computeFOV(exPlayerX, exPlayerY, targetChunk.map, 6);
        const discovered = targetChunk.map.map((row, y) =>
          row.map((cell, x) => ((targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
        );

        return {
          ...prev,
          isOverworld: true,
          currentChunkX: exChunkX,
          currentChunkY: exChunkY,
          overworldChunks: nextOverworldChunks,
          map: targetChunk.map,
          discovered: discovered,
          visible: fov,
          enemies: targetChunk.enemies,
          traps: targetChunk.traps,
          chests: targetChunk.chests,
          lootPiles: targetChunk.lootPiles || [],
          corpses: targetChunk.corpses || [],
          bloodSplatters: targetChunk.bloodSplatters || [],
          dungeonProps: targetChunk.props || [],
          spawnedCats: nextSpawnedCats,
          dungeonLevels: updatedDungeonLevels,
          inventoryMaterials: nextMats,
          playerStats: {
            ...prev.playerStats,
            x: exPlayerX,
            y: exPlayerY,
            depth: 0
          }
        };
      }

      // POTIONS & FOODS LOGIC
      let hpVal = 25;
      let mpVal = 5;

      if (foodKey === 'potion_hp') {
        hpVal = 35;
        mpVal = 0;
      } else if (foodKey === 'potion_mp') {
        hpVal = 0;
        mpVal = 15;
      } else if (foodKey === 'potion_medium_hp') {
        hpVal = 60;
        mpVal = 0;
      } else if (foodKey === 'potion_medium_mp') {
        hpVal = 0;
        mpVal = 30;
      } else if (foodKey === 'potion_full_rejuv' || foodKey === 'potion_full_rejuvenation') {
        hpVal = prev.playerStats.maxHp;
        mpVal = prev.playerStats.maxMp;
      } else if (foodKey === 'mat_beer') {
        hpVal = 15;
        mpVal = 5;
      } else if (foodKey === 'mat_bread') {
        hpVal = 20;
        mpVal = 0;
      } else if (foodKey === 'mat_berry') {
        hpVal = 5;
        mpVal = 0;
      } else if (foodKey === 'mat_cooked_pie') {
        hpVal = 40;
        mpVal = 15;
      } else if (foodKey === 'mat_raw_fish') {
        hpVal = 10;
        mpVal = 2;
      } else if (foodKey === 'mat_cooked_fish') {
        hpVal = 45;
        mpVal = 30;
      } else if (foodKey === 'mat_prime_meat') {
        hpVal = 15;
        mpVal = 0;
      } else if (foodKey === 'mat_cooked_prime_meat') {
        hpVal = 60;
        mpVal = 15;
      } else if (foodKey === 'mat_seppo_hooch') {
        hpVal = 75;
        mpVal = 40;
      }

      const nextStats = {
        ...prev.playerStats,
        hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + hpVal),
        mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + mpVal)
      };

      // Dispatch canvas visual effect
      let effectText = `+${hpVal} HP +${mpVal} MP`;
      if (foodKey === 'potion_full_rejuv' || foodKey === 'potion_full_rejuvenation') {
        effectText = "Full Rejuv!";
      } else if (hpVal === 0) {
        effectText = `+${mpVal} MP`;
      } else if (mpVal === 0) {
        effectText = `+${hpVal} HP`;
      }

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: effectText, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        playerStats: nextStats
      };
    });

    // Logging & secondary alerts outside setGameState (to avoid side-effects)
    setTimeout(() => {
      if (!shouldConsume) {
        if (isScroll) {
          playSound('bump');
          addLogMessage(`❌ The Scroll of Escape can only be read inside a dark dungeon to flee back to the surface entrance!`, 'system');
        }
        return;
      }

      if (isScroll) {
        playSound('spell');
        addLogMessage(`🔮 You read the Scroll of Escape! Bright protective portals of stardust wrap around you and rip you out of the Abyss back to the safety of the surface entrance!`, 'danger');
        return;
      }

      let hpVal = 25;
      let mpVal = 5;
      let label = "savory Cooked Meat";
      let icon = "🍖";

      if (foodKey === 'potion_hp') {
        hpVal = 35;
        mpVal = 0;
        label = "Apothecary Elixir (HP)";
        icon = "🧪";
      } else if (foodKey === 'potion_mp') {
        hpVal = 0;
        mpVal = 15;
        label = "Aether Beverage (MP)";
        icon = "🧪";
      } else if (foodKey === 'potion_medium_hp') {
        hpVal = 60;
        mpVal = 0;
        label = "Rejuvenating Potion (Medium HP)";
        icon = "🧪";
      } else if (foodKey === 'potion_medium_mp') {
        hpVal = 0;
        mpVal = 30;
        label = "Rejuvenating Beverage (Medium MP)";
        icon = "🧪";
      } else if (foodKey === 'potion_full_rejuv') {
        hpVal = gameState.playerStats.maxHp;
        mpVal = gameState.playerStats.maxMp;
        label = "Elixir of Full Restoration";
        icon = "🧪";
      } else if (foodKey === 'potion_full_rejuvenation') {
        hpVal = gameState.playerStats.maxHp;
        mpVal = gameState.playerStats.maxMp;
        label = "Royal Champion Rejuvenation Elixir";
        icon = "🧪";
      } else if (foodKey === 'mat_beer') {
        hpVal = 15;
        mpVal = 5;
        label = "Frothy Beer Mug";
        icon = "🍺";
      } else if (foodKey === 'mat_bread') {
        hpVal = 20;
        mpVal = 0;
        label = "Fresh Hearth Bread";
        icon = "🍞";
      } else if (foodKey === 'mat_berry') {
        hpVal = 5;
        mpVal = 0;
        label = "Wild Berries";
        icon = "🍓";
      } else if (foodKey === 'mat_cooked_pie') {
        hpVal = 40;
        mpVal = 15;
        label = "Baked Berry Pie";
        icon = "🥧";
      } else if (foodKey === 'mat_raw_fish') {
        hpVal = 10;
        mpVal = 2;
        label = "Raw River Fish";
        icon = "🐟";
      } else if (foodKey === 'mat_cooked_fish') {
        hpVal = 45;
        mpVal = 30;
        label = "Campfire Grilled Fish";
        icon = "🐟";
      } else if (foodKey === 'mat_prime_meat') {
        hpVal = 15;
        mpVal = 0;
        label = "Raw Prime Wild Meat";
        icon = "🥩";
      } else if (foodKey === 'mat_cooked_prime_meat') {
        hpVal = 60;
        mpVal = 15;
        label = "Prime Flame-Grilled Steak";
        icon = "🥩";
      } else if (foodKey === 'mat_seppo_hooch') {
        hpVal = 75;
        mpVal = 40;
        label = "Seppo's Special Hooch (Unbelievably potent!)";
        icon = "🍶";
      }

      if (foodKey === 'mat_seppo_hooch') {
        const playerLogs = [
          `🥴 You down the entire flask of Seppo's Hooch... Your eyes water, your throat burns, and you feel absolutely invincible! *HIC!*`,
          `🥴 Gulp gulp gulp... Wow! That's practically rocket fuel. You can hear colors and see sound now. Excellent!`,
          `🥴 You take a swig of Seppo's secret blend. It smells like sauna birch wood and pure yeast. Truly, a warrior's drink!`
        ];
        addLogMessage(playerLogs[Math.floor(Math.random() * playerLogs.length)], 'danger');
      } else {
        const recoverText = hpVal > 0 && mpVal > 0
          ? `+${hpVal} HP and +${mpVal} MP`
          : hpVal > 0
            ? `+${hpVal} HP`
            : `+${mpVal} MP`;
        addLogMessage(`${icon} You consume ${label}. Restored ${recoverText}!`, 'loot');
      }
    }, 50);
  };

  const handleSellResource = (type: 'material' | 'catalyst', id: string, payout: number) => {
    const activeId = gameState.activeTradeNpcId || 'npc_shop';
    const activeNpc = gameState.npcs?.find(n => n.id === activeId);
    const activeRole = activeNpc?.role || (activeId === 'npc_caravan_merchant' || activeId.includes('caravan') ? 'merchant' : '');
    
    const reputation = gameState.townReputation ?? 100;
    if (reputation <= 20 && activeRole !== 'merchant_seppo') {
      playSound('bump');
      addLogMessage(`❌ REFUSED: Town merchants refuse to trade with a notorious Sunder Outlaw!`, 'system');
      return;
    }

    const mConfig = getMerchantConfig(activeRole, activeId);
    const currentGold = gameState.merchantGold?.[activeId] !== undefined
       ? gameState.merchantGold[activeId]
       : mConfig.maxGold;

    // Apply dynamic trade economy biome multipliers and guild logistics sell bonuses
    const biomeMult = getBiomePriceMultiplier(id, gameState.biome);
    const upgradedSellMult = 1.0 + (gameState.guildUpgrades?.['up_supply_deals'] || 0) * 0.20;
    const baseAdjustedPayout = Math.round(payout * biomeMult * upgradedSellMult);
    const finalPayout = gameState.hasActiveCaravanLicense ? Math.round(baseAdjustedPayout * 1.30) : baseAdjustedPayout;

    if (currentGold < finalPayout) {
      playSound('bump');
      addLogMessage(`❌ ${activeNpc?.name || 'The merchant'} does not have enough Gold coins! Merchant has ${currentGold} Gold, you want to sell for ${finalPayout} Gold.`, 'system');
      return;
    }

    playSound('loot');
    setGameState((prev) => {
      const nextStats = { ...prev.playerStats, gold: prev.playerStats.gold + finalPayout };
      const updatedGoldCopy = prev.merchantGold ? { ...prev.merchantGold } : {};
      updatedGoldCopy[activeId] = Math.max(0, currentGold - finalPayout);
      
      if (type === 'material') {
        const count = prev.inventoryMaterials[id] || 0;
        if (count <= 0) return prev;
        const nextMats = { ...prev.inventoryMaterials, [id]: count - 1 };
        addLogMessage(`💰 Sold 1x ${id.replace('mat_', '').toUpperCase()} Material back for +${finalPayout} Gold.`, 'loot');
        return {
          ...prev,
          inventoryMaterials: nextMats,
          playerStats: nextStats,
          merchantGold: updatedGoldCopy
        };
      } else {
        const count = prev.inventoryCatalysts[id] || 0;
        if (count <= 0) return prev;
        const nextCats = { ...prev.inventoryCatalysts, [id]: count - 1 };
        addLogMessage(`💰 Sold 1x ${id.replace('cat_', '').toUpperCase()} Catalyst back for +${finalPayout} Gold.`, 'loot');
        return {
          ...prev,
          inventoryCatalysts: nextCats,
          playerStats: nextStats,
          merchantGold: updatedGoldCopy
        };
      }
    });
  };

  const handleAdjustAttribute = (attr: 'str' | 'dex' | 'int' | 'cha' | 'lck', amount: number) => {
    if (amount <= 0) return;
    const unspent = gameState.playerStats.unspentPoints || 0;
    if (unspent < amount) {
      playSound('bump');
      return;
    }

    playSound('loot');

    setGameState((prev) => {
      const pStats = { ...prev.playerStats };
      if ((pStats.unspentPoints || 0) < amount) return prev;

      // Increment the attribute
      pStats[attr] = Math.max(10, (pStats[attr] || 10) + amount);
      pStats.unspentPoints = Math.max(0, (pStats.unspentPoints || 0) - amount);

      // Apply attribute specific derived bonuses!
      if (attr === 'str') {
        pStats.maxHp = (pStats.maxHp || 100) + (amount * 5);
        pStats.hp = (pStats.hp || 100) + (amount * 5); // Heal on stat increase too!
      } else if (attr === 'int') {
        pStats.maxMp = (pStats.maxMp || 30) + (amount * 3);
        pStats.mp = (pStats.mp || 30) + (amount * 3);
      } else if (attr === 'dex') {
        pStats.atk = (pStats.atk || 5) + amount; // slightly boost standard attack
      }

      return {
        ...prev,
        playerStats: pStats
      };
    });

    const labels: Record<string, string> = {
      str: 'STR (Strength)',
      dex: 'DEX (Dexterity)',
      int: 'INT (Intellect)',
      cha: 'CHA (Charisma)',
      lck: 'LCK (Luck)',
    };
    addLogMessage(`🧬 Allocated attribute point: +${amount} to ${labels[attr]} (Remaining: ${unspent - amount})`, 'info');
  };

  // Craft completion callback
  const handleCraftComplete = (
    base: WeaponBaseType,
    matId: string,
    catId: string,
    category?: 'weapon' | 'armor',
    armorSubType?: string,
    overforgeHeat: number = 0
  ) => {
    playSound('forge');

    const material = BASIC_MATERIALS.find((m) => m.id === matId)!;
    const catalyst = ELEMENTAL_CATALYSTS.find((c) => c.id === catId)!;

    // Over-Forging risk roll
    const heatRatio = Math.min(1.0, Math.max(0, overforgeHeat / 100));
    if (heatRatio > 0) {
      const shatterChance = heatRatio * 0.65; // Up to 65% shatter risk at 100% heat
      if (Math.random() < shatterChance) {
        playSound('bump');
        const backfireDmg = Math.floor(heatRatio * 15);

        setGameState((prev) => {
          const nextMats = { ...prev.inventoryMaterials };
          const nextCats = { ...prev.inventoryCatalysts };

          // Deduct materials
          nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - 1);
          nextCats[catId] = Math.max(0, (nextCats[catId] || 0) - 1);

          // Salvage: 1x Scrap Iron or Wood
          const salvageId = matId === 'mat_wood' ? 'mat_wood' : 'mat_iron';
          nextMats[salvageId] = (nextMats[salvageId] || 0) + 1;

          // Backfire damage
          const currentHp = prev.playerStats.hp;
          const newHp = Math.max(1, currentHp - backfireDmg);

          return {
            ...prev,
            inventoryMaterials: nextMats,
            inventoryCatalysts: nextCats,
            playerStats: {
              ...prev.playerStats,
              hp: newHp
            }
          };
        });

        const spawnX = gameState.playerX;
        const spawnY = gameState.playerY;
        const effectEv = new CustomEvent('spawn-game-effect', {
          detail: { x: spawnX, y: spawnY, text: `💥 OVER-FORGE SHATTER! (-${backfireDmg} HP)`, type: 'damage' },
        });
        window.dispatchEvent(effectEv);

        addLogMessage(`💥 OVER-FORGE SHATTER: The anvil detonated under ${overforgeHeat}% heat! The ${base} shattered into slag remnants. You took ${backfireDmg} heat blast recoil damage! (Salvaged 1x Scrap Material)`, 'danger');
        setActiveTab('dungeon');
        return;
      }
    }

    function getMaterialAdj(mat: typeof material) {
      if (mat.id === 'mat_iron') return 'Iron-Clasped';
      if (mat.id === 'mat_mithril') return 'Mithril-Core';
      if (mat.id === 'mat_obsidian') return 'Volcanic Obsidian';
      if (mat.id === 'mat_dragonscale') return 'Astral Wyrmscale';
      if (mat.id === 'mat_feybone') return 'Ancient Feybone';
      return mat.name.split(' ')[0];
    }

    function getCatalystPrefix(cat: typeof catalyst) {
      if (cat.type === 'Fire') return 'Pyrotactile';
      if (cat.type === 'Frost') return 'Cryo-forged';
      if (cat.type === 'Poison') return 'Venom-stung';
      if (cat.type === 'Lightning') return 'Super-charged';
      if (cat.type === 'Shadow') return 'Void-gazing';
      return cat.name;
    }

    let customName = '';
    let description = '';
    let scoreDamage = 0;
    let scoreDefense = 0;
    let scoreCrit = 0;
    let scoreRange = 1;
    let maxDur = 100;

    const isWeapon = !category || category === 'weapon';

    if (isWeapon) {
      const baseTmpl = WEAPON_TEMPLATES[base];
      customName = `${getCatalystPrefix(catalyst)} ${getMaterialAdj(material)} ${base}`;
      scoreDamage = baseTmpl.baseDamage + material.baseDamageMod;
      scoreCrit = Math.min(1.0, baseTmpl.baseCrit + material.critMod);
      scoreRange = baseTmpl.range;
      description = `Fused alloy combining physical properties of ${material.name} and elemental kinetic discharge of ${catalyst.name}. Range: ${scoreRange}.`;
      maxDur = 150;
    } else {
      // It is an armor piece
      const baseArmorNames: { [key: string]: { name: string, baseDef: number, maxDur: number } } = {
        'Shield': { name: 'Greatshield', baseDef: 3, maxDur: 150 },
        'HeavyArmor': { name: 'Plate Mail', baseDef: 5, maxDur: 120 },
        'Helmet': { name: 'Visor Helm', baseDef: 2, maxDur: 100 },
        'Gloves': { name: 'Gauntlets', baseDef: 1, maxDur: 100 },
        'Amulet': { name: 'Neck Piece', baseDef: 1, maxDur: 100 },
        'Boots': { name: 'Sabatons', baseDef: 1, maxDur: 100 },
      };

      const armorDetail = baseArmorNames[armorSubType || 'Shield'] || { name: 'Shield', baseDef: 2, maxDur: 100 };
      customName = `${getCatalystPrefix(catalyst)} ${getMaterialAdj(material)} ${armorDetail.name}`;
      
      let defenseBonus = 1;
      if (material.id === 'mat_iron') defenseBonus = 1;
      else if (material.id === 'mat_mithril' || material.id === 'mat_obsidian') defenseBonus = 2;
      else defenseBonus = 3;

      scoreDefense = armorDetail.baseDef + defenseBonus;
      description = `Impenetrable alloy of infused ${material.name} containing protective ${catalyst.type} sparks. Block rate enhanced.`;
      maxDur = armorDetail.maxDur;
    }

    const traits: string[] = [];
    if (!isWeapon) {
      if (armorSubType === 'Boots') {
        if (catalyst.id === 'cat_frost') {
          traits.push('NON_SLIPPERY');
          description += ' [Enchanted: Non-Slippery Ice Tread. Immune to slipping and blizzard freezing fatigue!]';
        } else if (catalyst.id === 'cat_fire' || catalyst.id === 'cat_lightning') {
          traits.push('STALLION_SPEED');
          description += ' [Enchanted: Stallion Speed. Overworld travel speed increased (3m/turn travel time cost).]';
        } else if (catalyst.id === 'cat_poison') {
          traits.push('SWAMP_GLIDE');
          description += ' [Enchanted: Swamp-Glide. Move through swamp paths at extreme speed (2m/turn) and walk safely on water!]';
        }
      } else if (armorSubType === 'Helmet' || armorSubType === 'HeavyArmor') {
        if (catalyst.id === 'cat_lightning' || catalyst.id === 'cat_plain') {
          traits.push('DESERT_IMMUNITY');
          description += ' [Enchanted: Dune Desert Immunity. Complete immunity to sandstorms, sand-blindness, and heat fatigue!]';
        }
      } else if (armorSubType === 'Gloves' || armorSubType === 'Shield' || armorSubType === 'Amulet') {
        if (catalyst.id === 'cat_shadow' || catalyst.id === 'cat_fire') {
          traits.push('WORG_FORCE');
          description += ' [Enchanted: Worg Force. Adds +3 damage to physical attacks and pacifies wild Wolves!]';
        }
      }
    } else {
      if (catalyst.id === 'cat_shadow' || material.id === 'mat_obsidian') {
        traits.push('WORG_FORCE');
        description += ' [Enchanted: Worg Force. Adds +3 damage to physical attacks and pacifies wild Wolves!]';
      }
    }

    if (overforgeHeat > 0) {
      const heatRatio = overforgeHeat / 100;
      const statMult = 1.0 + (heatRatio * 1.25); // Up to 2.25x power!
      const bonusCrit = heatRatio * 0.25;

      let heatPrefix = 'Over-Heated';
      if (overforgeHeat >= 95) heatPrefix = '⚡ GOD-FORGED';
      else if (overforgeHeat >= 75) heatPrefix = 'Infernal';
      else if (overforgeHeat >= 50) heatPrefix = 'Incandescent';

      customName = `${heatPrefix} ${customName}`;
      scoreDamage = Math.round(scoreDamage * statMult);
      scoreDefense = Math.round(scoreDefense * statMult);
      scoreCrit = Math.min(0.95, parseFloat((scoreCrit + bonusCrit).toFixed(2)));
      description += ` [⚡ OVER-FORGED HEAT: ${overforgeHeat}% (+${Math.round((statMult - 1) * 100)}% Power Boost)]`;
    }

    const newItem: EquipmentItem = {
      id: `crafted_${Date.now()}`,
      name: customName,
      type: isWeapon ? 'weapon' : 'armor',
      subType: (isWeapon ? base : (armorSubType || 'Shield')) as any,
      defense: scoreDefense,
      damage: scoreDamage,
      critChance: scoreCrit,
      range: scoreRange,
      color: catalyst.color,
      description: description,
      value: isWeapon ? 30 : 25,
      durability: maxDur,
      maxDurability: maxDur,
      traits: traits,
      isOverforged: overforgeHeat > 0,
      overforgeHeat: overforgeHeat > 0 ? overforgeHeat : undefined
    };

    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };
      const nextCats = { ...prev.inventoryCatalysts };

      // Deduct items used
      nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - 1);
      nextCats[catId] = Math.max(0, (nextCats[catId] || 0) - 1);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        equipmentInventory: [...prev.equipmentInventory, newItem],
      };
    });

    const craftLogPrefix = overforgeHeat >= 95 ? "⚡ GOD-FORGED MASTERPIECE" : overforgeHeat > 0 ? "⚡ OVER-FORGED CRAFT" : "🔨 BLACKSMITH ARCANUM";
    addLogMessage(`${craftLogPrefix}: Forged "${customName}"! Added directly to your inventory!`, 'craft');
    setActiveTab('dungeon');
  };

  const handlePlaceCampfire = () => {
    setGameState((prev) => {
      const woodCount = prev.inventoryMaterials['mat_wood'] || 0;
      if (woodCount < 3) {
        addLogMessage("❌ You do not have enough Scrap Wood (3 required) to place a campfire!", "system");
        return prev;
      }

      // Find an empty walkable tile adjacent to the player (grass, floor, road, sand)
      const px = prev.playerX;
      const py = prev.playerY;
      const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ];

      let targetX = -1;
      let targetY = -1;

      for (const d of dirs) {
        const nx = px + d.dx;
        const ny = py + d.dy;
        if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
          const t = prev.map[ny][nx];
          if (
            t === TileType.Floor ||
            t === TileType.Grass ||
            t === TileType.Path
          ) {
            // Make sure there are no NPCs/Enemies/Chests/Traps on this tile
            const hasEnemy = prev.enemies.some(e => e.x === nx && e.y === ny);
            const hasNpc = prev.npcs.some(n => n.x === nx && n.y === ny);
            const hasChest = prev.chests.some(c => c.x === nx && c.y === ny);
            if (!hasEnemy && !hasNpc && !hasChest) {
              targetX = nx;
              targetY = ny;
              break;
            }
          }
        }
      }

      if (targetX === -1 || targetY === -1) {
        addLogMessage("⚠️ Could not find a suitable empty space next to you to build a campfire! Move to clear ground.", "system");
        return prev;
      }

      // Create new map with the campfire
      const nextMap = prev.map.map((row) => [...row]);
      nextMap[targetY][targetX] = TileType.Campfire;

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_wood': woodCount - 3
      };

      playSound('spell'); // crackling/assembly sound
      addLogMessage(`🔥 You successfully assembled a warm, crackling Campfire at [X:${targetX}, Y:${targetY}]. Stand adjacent to it to cook!`, 'craft');

      // Dispatch visual event to draw steam/sparks
      const cmdEv = new CustomEvent('spawn-game-effect', {
        detail: { x: targetX, y: targetY, text: `🔥 CAMPFIRE`, type: 'heal' },
      });
      window.dispatchEvent(cmdEv);

      return {
        ...prev,
        map: nextMap,
        inventoryMaterials: nextMats
      };
    });
  };

  const handlePlaceAnvil = () => {
    setGameState((prev) => {
      const ironCount = prev.inventoryMaterials['mat_iron'] || 0;
      const woodCount = prev.inventoryMaterials['mat_wood'] || 0;
      if (ironCount < 5 || woodCount < 2) {
        addLogMessage("❌ You need 5x Tempered Iron and 2x Scrap Wood to assemble a Portable Anvil!", "system");
        return prev;
      }

      const px = prev.playerX;
      const py = prev.playerY;
      const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ];

      let targetX = -1;
      let targetY = -1;

      for (const d of dirs) {
        const nx = px + d.dx;
        const ny = py + d.dy;
        if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
          const t = prev.map[ny][nx];
          if (
            t === TileType.Floor ||
            t === TileType.Grass ||
            t === TileType.Path
          ) {
            const hasEnemy = prev.enemies.some(e => e.x === nx && e.y === ny);
            const hasNpc = prev.npcs.some(n => n.x === nx && n.y === ny);
            const hasChest = prev.chests.some(c => c.x === nx && c.y === ny);
            if (!hasEnemy && !hasNpc && !hasChest) {
              targetX = nx;
              targetY = ny;
              break;
            }
          }
        }
      }

      if (targetX === -1 || targetY === -1) {
        addLogMessage("⚠️ Could not find a suitable empty space next to you to place an Anvil! Move to clear ground.", "system");
        return prev;
      }

      const nextMap = prev.map.map((row) => [...row]);
      nextMap[targetY][targetX] = TileType.Anvil;

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_iron': ironCount - 5,
        'mat_wood': woodCount - 2
      };

      playSound('equip');
      addLogMessage(`⚒️ You successfully assembled a heavy Portable Blacksmith Anvil at [X:${targetX}, Y:${targetY}]. Stand adjacent to it to forge, mutate, and upgrade equipment!`, 'craft');

      const cmdEv = new CustomEvent('spawn-game-effect', {
        detail: { x: targetX, y: targetY, text: `⚒️ ANVIL`, type: 'crit' },
      });
      window.dispatchEvent(cmdEv);

      return {
        ...prev,
        map: nextMap,
        inventoryMaterials: nextMats
      };
    });
  };

  const handleCookMeat = () => {
    setGameState((prev) => {
      const rawCount = prev.inventoryMaterials['mat_raw_meat'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (rawCount <= 0) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You don't have any Raw Meat to cook!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      // Check adjacent campfire
      const hasAdjacentCampfire = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ].some(d => {
        const nx = prev.playerX + d.dx;
        const ny = prev.playerY + d.dy;
        return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && prev.map[ny]?.[nx] === TileType.Campfire;
      });

      if (!hasAdjacentCampfire) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ Stand adjacent to a Campfire (🔥) to cook raw meat!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_raw_meat': rawCount - 1,
        'mat_cooked_meat': (prev.inventoryMaterials['mat_cooked_meat'] || 0) + 1
      };

      playSound('loot');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🍖 You slow-cook a Raw Meat over the hot flames. It sizzles beautifully and becomes nutritional Cooked Meat!`,
        type: 'loot',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Cooked Meat`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  };

  const handleCookPrimeMeat = () => {
    setGameState((prev) => {
      const rawCount = prev.inventoryMaterials['mat_prime_meat'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (rawCount <= 0) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You don't have any Prime Wild Meat to cook!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      // Check adjacent campfire
      const hasAdjacentCampfire = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ].some(d => {
        const nx = prev.playerX + d.dx;
        const ny = prev.playerY + d.dy;
        return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && prev.map[ny]?.[nx] === TileType.Campfire;
      });

      if (!hasAdjacentCampfire) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ Stand adjacent to a Campfire (🔥) to cook raw prime meat!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_prime_meat': rawCount - 1,
        'mat_cooked_prime_meat': (prev.inventoryMaterials['mat_cooked_prime_meat'] || 0) + 1
      };

      playSound('loot');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🥩 You slow-grill high-quality Prime Wild Meat. It sizzles with delicious juices and becomes a mouth-watering Flame-Grilled Steak!`,
        type: 'loot',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Grilled Steak`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  };

  const handleRestCampfire = () => {
    setGameState((prev) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      // Check adjacent campfire
      const hasAdjacentCampfire = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ].some(d => {
        const nx = prev.playerX + d.dx;
        const ny = prev.playerY + d.dy;
        return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && prev.map[ny]?.[nx] === TileType.Campfire;
      });

      if (!hasAdjacentCampfire) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ Stand adjacent to a Campfire (🔥) to rest!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const stats = prev.playerStats;
      const nextStats = {
        ...stats,
        exhaustion: 0, // Fully purges exhaustion!
        hp: Math.min(stats.maxHp, stats.hp + Math.round(stats.maxHp * 0.15)), // heals 15% HP
        mp: Math.min(stats.maxMp, stats.mp + Math.round(stats.maxMp * 0.15)) // heals 15% MP
      };

      playSound('levelUp');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🔥 You sit by the campfire warmth and rest. Your exhaustion is completely purged, and you feel refreshed! (+15% HP and MP)`,
        type: 'loot',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `Refreshed! 💤`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        playerStats: nextStats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  };

  const handleCookRecipe = (
    recipeId: string,
    restoringHp: number,
    restoringMp: number,
    buff: any,
    costMaterials: { [matId: string]: number },
    costCatalysts: { [catId: string]: number },
    successLog: string
  ) => {
    setGameState((prev) => {
      // Deduct materials
      const nextMats = { ...prev.inventoryMaterials };
      for (const [matId, qty] of Object.entries(costMaterials)) {
        nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - qty);
      }
      
      // Deduct catalysts
      const nextCats = { ...prev.inventoryCatalysts };
      for (const [catId, qty] of Object.entries(costCatalysts)) {
        nextCats[catId] = Math.max(0, (nextCats[catId] || 0) - qty);
      }

      // Restore health / mana
      const nextStats = {
        ...prev.playerStats,
        hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + restoringHp),
        mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + restoringMp)
      };

      // Special check: Shadow Jerky purges exhaustion
      if (recipeId === 'shadow_smoked_jerky') {
        nextStats.exhaustion = 0;
      }

      const formattedTime = formatGameTime(prev.gameTime).timeStr;
      const nextLogs = [
        ...prev.logs,
        {
          id: `cook_${Date.now()}`,
          text: successLog,
          type: 'loot' as const,
          timestamp: formattedTime
        }
      ];

      // Play appropriate sound & spawn floating text
      playSound('spell');
      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `🍴 GOURMET MEAL!`, type: 'heal' },
      });
      setTimeout(() => window.dispatchEvent(ev), 10);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        playerStats: nextStats,
        activeFoodBuff: buff ? { ...buff, turnsRemaining: buff.turnsRemaining } : prev.activeFoodBuff,
        logs: nextLogs
      };
    });
  };

  const handleBrewPotion = (
    recipeId: string,
    restoringHp: number,
    restoringMp: number,
    permanentStats: {
      str?: number;
      int?: number;
      def?: number;
      lck?: number;
      exhaustionReduction?: number;
    },
    costMaterials: { [matId: string]: number },
    costCatalysts: { [catId: string]: number },
    successLog: string
  ) => {
    setGameState((prev) => {
      // Deduct materials
      const nextMats = { ...prev.inventoryMaterials };
      for (const [matId, qty] of Object.entries(costMaterials)) {
        nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - qty);
      }
      
      // Deduct catalysts
      const nextCats = { ...prev.inventoryCatalysts };
      for (const [catId, qty] of Object.entries(costCatalysts)) {
        nextCats[catId] = Math.max(0, (nextCats[catId] || 0) - qty);
      }

      // Restore health / mana & apply permanent stats
      const nextStats = {
        ...prev.playerStats,
        hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + restoringHp),
        mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + restoringMp),
        str: prev.playerStats.str + (permanentStats.str || 0),
        int: prev.playerStats.int + (permanentStats.int || 0),
        def: prev.playerStats.def + (permanentStats.def || 0),
        lck: prev.playerStats.lck + (permanentStats.lck || 0),
        exhaustion: Math.max(0, (prev.playerStats.exhaustion || 0) - (permanentStats.exhaustionReduction || 0))
      };

      const formattedTime = formatGameTime(prev.gameTime).timeStr;
      const nextLogs = [
        ...prev.logs,
        {
          id: `brew_${Date.now()}`,
          text: successLog,
          type: 'loot' as const,
          timestamp: formattedTime
        }
      ];

      // Play appropriate sound & spawn floating text
      playSound('spell');
      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `🧪 STAT INCREASED!`, type: 'heal' },
      });
      setTimeout(() => window.dispatchEvent(ev), 10);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        playerStats: nextStats,
        logs: nextLogs
      };
    });
  };

  const handleCookFish = () => {
    setGameState((prev) => {
      const rawCount = prev.inventoryMaterials['mat_raw_fish'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (rawCount <= 0) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You don't have any Raw Fish to cook!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      // Check adjacent campfire
      const hasAdjacentCampfire = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ].some(d => {
        const nx = prev.playerX + d.dx;
        const ny = prev.playerY + d.dy;
        return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && prev.map[ny]?.[nx] === TileType.Campfire;
      });

      if (!hasAdjacentCampfire) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ Stand adjacent to a Campfire (🔥) to grill raw fish!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_raw_fish': rawCount - 1,
        'mat_cooked_fish': (prev.inventoryMaterials['mat_cooked_fish'] || 0) + 1
      };

      playSound('loot');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🍣 You slow-grill fresh raw fish over the hot campfire coals. It is beautifully toasted to a rich Grilled Fish!`,
        type: 'loot',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Grilled Fish`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  };

  const handleCraftFishingPole = () => {
    setGameState((prev) => {
      const woodCount = prev.inventoryMaterials['mat_wood'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (woodCount < 3) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need at least 3 Scrap Wood logs to assemble a Fishing Pole!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_wood': woodCount - 3,
        'mat_fishing_pole': (prev.inventoryMaterials['mat_fishing_pole'] || 0) + 1
      };

      playSound('craft');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🎣 You successfully shape 3x Scrap Wood into an Ancient Fishing Pole! Feel free to angle next to lakes or rivers!`,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Fishing Pole`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  };

  const handleCraftLockpicks = () => {
    setGameState((prev) => {
      const ironCount = prev.inventoryMaterials['mat_iron'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (ironCount < 1) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need at least 1 Tempered Iron to fashion Tension Lockpicks!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_iron': ironCount - 1,
        'mat_lockpick': (prev.inventoryMaterials['mat_lockpick'] || 0) + 3
      };

      playSound('craft');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🔑 You successfully forge 1x Tempered Iron into 3x Tension Lockpicks! Ready to crack open dungeon caches.`,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+3 Lockpicks`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  };

  const handleCraftHatchet = () => {
    setGameState((prev) => {
      const woodCount = prev.inventoryMaterials['mat_wood'] || 0;
      const ironCount = prev.inventoryMaterials['mat_iron'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (woodCount < 2 || ironCount < 1) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need 2x Scrap Wood and 1x Tempered Iron to forge a Lumberjack Hatchet!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_wood': woodCount - 2,
        'mat_iron': ironCount - 1,
      };

      const newHatchet: EquipmentItem = {
        id: `tool_hatchet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: 'Lumberjack Hatchet 🪓',
        type: 'weapon',
        subType: WeaponBaseType.Sword,
        defense: 0,
        damage: 6,
        critChance: 0.10,
        range: 1,
        color: '#94a3b8',
        description: 'A sturdy handaxe for chopping down trees and harvesting timber. Works automatically from inventory or equipped! Cannot be repaired.',
        value: 15,
        durability: 100,
        maxDurability: 100,
        isTool: true,
        isRepairable: false,
      };

      playSound('craft');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🪓 Forged a Lumberjack Hatchet! It works automatically from your inventory or equipped slot for chopping trees.`,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Hatchet`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        equipmentInventory: [...prev.equipmentInventory, newHatchet],
        logs: [...truncatedLogs, successMsg]
      };
    });
  };

  const handleCraftPickaxe = () => {
    setGameState((prev) => {
      const woodCount = prev.inventoryMaterials['mat_wood'] || 0;
      const ironCount = prev.inventoryMaterials['mat_iron'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (woodCount < 2 || ironCount < 2) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need 2x Scrap Wood and 2x Tempered Iron to forge a Prospector Pickaxe!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_wood': woodCount - 2,
        'mat_iron': ironCount - 2,
      };

      const newPickaxe: EquipmentItem = {
        id: `tool_pickaxe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: 'Prospector Pickaxe ⛏️',
        type: 'weapon',
        subType: WeaponBaseType.Hammer,
        defense: 0,
        damage: 5,
        critChance: 0.05,
        range: 1,
        color: '#f59e0b',
        description: 'A heavy iron pickaxe for mining copper and iron mineral veins. Works automatically from inventory or equipped! Cannot be repaired.',
        value: 15,
        durability: 100,
        maxDurability: 100,
        isTool: true,
        isRepairable: false,
      };

      playSound('craft');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `⛏️ Forged a Prospector Pickaxe! It works automatically from your inventory or equipped slot for mining mineral veins.`,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Pickaxe`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        equipmentInventory: [...prev.equipmentInventory, newPickaxe],
        logs: [...truncatedLogs, successMsg]
      };
    });
  };

  const handleCraftRecallScroll = () => {
    setGameState((prev) => {
      const dragonScaleCount = prev.inventoryMaterials['mat_dragonscale'] || 0;
      const feyBoneCount = prev.inventoryMaterials['mat_feybone'] || 0;
      const shadowCatalystCount = prev.inventoryCatalysts['cat_shadow'] || 0;

      const normTime = prev.gameTime % 1440;
      const { timeStr } = formatGameTime(normTime);
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (dragonScaleCount < 1 || feyBoneCount < 1 || shadowCatalystCount < 1) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You lack the rare elements (Primal Dragon Scale, Withered Fey Bone, Null Echo Stone) to craft a Scroll of Recall!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      // Consume materials
      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_dragonscale': dragonScaleCount - 1,
        'mat_feybone': feyBoneCount - 1,
      };

      const nextCatalysts = {
        ...prev.inventoryCatalysts,
        'cat_shadow': shadowCatalystCount - 1,
      };

      // Add to equipment inventory
      const newScroll: EquipmentItem = {
        id: `scroll_recall_town_${Date.now()}_${Math.random()}`,
        name: 'Scroll of Recall 📜',
        type: 'scroll' as any,
        subType: 'Scroll' as any,
        defense: 0,
        damage: 0,
        critChance: 0,
        range: 0,
        color: '#38bdf8',
        description: 'A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!',
        value: 200,
        durability: 100,
        maxDurability: 100
      };

      playSound('spell');

      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `📜 [ARCANUM CRAFT]: You weave ancient Ley-line magical energy, fusing a Primal Dragon Scale, Withered Fey Bone, and Null Echo Stone into a sparkling Scroll of Recall!`,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Recall Scroll 📜`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCatalysts,
        equipmentInventory: addEquipmentItemToInventory(prev.equipmentInventory, newScroll),
        logs: [...truncatedLogs, successMsg]
      };
    });
  };

  const handleCraftSpellScroll = (scrollTemplateId: string) => {
    setGameState((prev) => {
      const template = SPELL_SCROLLS.find(t => t.id === scrollTemplateId || t.id.includes(scrollTemplateId));
      if (!template) {
        return prev;
      }

      const normTime = prev.gameTime % 1440;
      const { timeStr } = formatGameTime(normTime);
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      const nextMats = { ...prev.inventoryMaterials };
      const nextCatalysts = { ...prev.inventoryCatalysts };

      // Check materials and catalysts dynamically
      let hasRequired = true;
      for (const [matId, matReq] of Object.entries(template.recipe.materials)) {
        if ((prev.inventoryMaterials[matId] || 0) < matReq.required) {
          hasRequired = false;
        }
      }
      for (const [catId, catReq] of Object.entries(template.recipe.catalysts)) {
        if ((prev.inventoryCatalysts[catId] || 0) < catReq.required) {
          hasRequired = false;
        }
      }

      if (!hasRequired) {
        const matListStr = [
          ...Object.entries(template.recipe.materials).map(([_, req]) => `${req.required}x ${req.name}`),
          ...Object.entries(template.recipe.catalysts).map(([_, req]) => `${req.required}x ${req.name}`),
        ].join(', ');

        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `❌ You lack the materials (${matListStr}) to craft a ${template.name}!`,
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      // Deduct materials
      for (const [matId, matReq] of Object.entries(template.recipe.materials)) {
        nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - matReq.required);
      }
      for (const [catId, catReq] of Object.entries(template.recipe.catalysts)) {
        nextCatalysts[catId] = Math.max(0, (nextCatalysts[catId] || 0) - catReq.required);
      }

      const newScroll = getSpellScrollAsEquipmentItem(template, Date.now());

      playSound('spell');

      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: template.successMsgText,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 ${template.name} 📜`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCatalysts,
        equipmentInventory: addEquipmentItemToInventory(prev.equipmentInventory, newScroll),
        logs: [...truncatedLogs, successMsg]
      };
    });
  };

  const handleCatchFish = (fishName: string, id: string) => {
    setGameState((prev) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      const nextMats = {
        ...prev.inventoryMaterials,
        [id]: (prev.inventoryMaterials[id] || 0) + 1
      };

      const prevDurability = prev.fishingPoleDurability !== undefined ? prev.fishingPoleDurability : 7;
      const nextDurability = prevDurability - 1;

      let logMsg: GameLogMessage;
      if (nextDurability <= 0) {
        nextMats['mat_fishing_pole'] = Math.max(0, (nextMats['mat_fishing_pole'] || 0) - 1);
        playSound('bump');
        logMsg = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `💥 OH NO! Your Ancient Fishing Pole snapped and broke under the heavy load of [${fishName}]! You need to craft or buy another one!`,
          type: 'danger',
          timestamp: timeStr,
        };
      } else {
        logMsg = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `🎣 You successfully captured a [${fishName}]! Raw fish added to your food storage. (Fishing Pole: ${nextDurability} / 7 Uses Left)`,
          type: 'loot',
          timestamp: timeStr,
        };
      }

      return {
        ...prev,
        inventoryMaterials: nextMats,
        fishingPoleDurability: nextDurability <= 0 ? 7 : nextDurability,
        logs: [...truncatedLogs, logMsg]
      };
    });
  };

  const handleFailFish = () => {
    setGameState((prev) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      const prevDurability = prev.fishingPoleDurability !== undefined ? prev.fishingPoleDurability : 7;
      const nextDurability = prevDurability - 1;
      const nextMats = { ...prev.inventoryMaterials };

      let logMsg: GameLogMessage;
      if (nextDurability <= 0) {
        nextMats['mat_fishing_pole'] = Math.max(0, (nextMats['mat_fishing_pole'] || 0) - 1);
        playSound('bump');
        logMsg = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `💥 OH NO! You pulled too hard and your Ancient Fishing Pole snapped and broke! You need to craft or buy another one!`,
          type: 'danger',
          timestamp: timeStr,
        };
      } else {
        logMsg = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `🎣 The fish managed to slip away! Durability lost. (Fishing Pole: ${nextDurability} / 7 Uses Left)`,
          type: 'system',
          timestamp: timeStr,
        };
      }

      return {
        ...prev,
        inventoryMaterials: nextMats,
        fishingPoleDurability: nextDurability <= 0 ? 7 : nextDurability,
        logs: [...truncatedLogs, logMsg]
      };
    });
  };

  const handleMutateItem = (
    targetId: string,
    matId: string,
    catId: string,
    overforgeHeat: number = 0
  ) => {
    playSound('mutate');

    const material = BASIC_MATERIALS.find((m) => m.id === matId)!;
    const catalyst = ELEMENTAL_CATALYSTS.find((c) => c.id === catId)!;

    // Over-forge chaos risk check
    const heatRatio = Math.min(1.0, Math.max(0, overforgeHeat / 100));
    if (heatRatio > 0 && Math.random() < heatRatio * 0.60) {
      playSound('bump');
      const backfireDmg = Math.floor(heatRatio * 15);

      setGameState((prev) => {
        const nextMats = { ...prev.inventoryMaterials };
        const nextCats = { ...prev.inventoryCatalysts };

        // Deduct items used
        nextMats[matId] = Math.max(0, (nextMats[matId] ?? 0) - 1);
        nextCats[catId] = Math.max(0, (nextCats[catId] ?? 0) - 1);

        const currentHp = prev.playerStats.hp;
        const newHp = Math.max(1, currentHp - backfireDmg);

        return {
          ...prev,
          inventoryMaterials: nextMats,
          inventoryCatalysts: nextCats,
          playerStats: {
            ...prev.playerStats,
            hp: newHp
          }
        };
      });

      const spawnX = gameState.playerX;
      const spawnY = gameState.playerY;
      const effectEv = new CustomEvent('spawn-game-effect', {
        detail: { x: spawnX, y: spawnY, text: `💥 CHAOS MELTDOWN! (-${backfireDmg} HP)`, type: 'damage' },
      });
      window.dispatchEvent(effectEv);

      addLogMessage(`💥 CHAOS MELTDOWN: Supercritical mutation collapsed under ${overforgeHeat}% heat! The forge detonated, dealing ${backfireDmg} fire damage!`, 'danger');
      setActiveTab('dungeon');
      return;
    }

    function getMutPrefix(catType: string) {
      if (overforgeHeat >= 95) return '⚡ GOD-MUTATED';
      if (overforgeHeat >= 50) return 'Over-Charged';
      if (catType === 'Fire') return 'Pyromagnetic';
      if (catType === 'Frost') return 'Cryo-warped';
      if (catType === 'Poison') return 'Venom-veined';
      if (catType === 'Lightning') return 'Flux-pulsing';
      if (catType === 'Shadow') return 'Void-stitched';
      return 'Chaos-touched';
    }

    function getMutSuffix(matName: string) {
      const core = matName.split(' ')[0];
      return `of ${core} Chaos`;
    }

    const spawnX = gameState.playerX;
    const spawnY = gameState.playerY;
    const effectEv = new CustomEvent('spawn-game-effect', {
      detail: { x: spawnX, y: spawnY, text: "🌀 Mutated!", type: 'heal' },
    });
    window.dispatchEvent(effectEv);

    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };
      const nextCats = { ...prev.inventoryCatalysts };

      // Deduct items used
      nextMats[matId] = Math.max(0, (nextMats[matId] ?? 0) - 1);
      nextCats[catId] = Math.max(0, (nextCats[catId] ?? 0) - 1);

      let logMessageText = "";
      let nextCurrentWeapon = prev.currentWeapon;
      let nextEquipmentInventory = [...prev.equipmentInventory];

      const heatMult = 1.0 + (overforgeHeat / 100) * 0.8;
      const chaosMultiplier = parseFloat(((0.85 + Math.random() * 0.70) * heatMult).toFixed(2));
      const prefix = getMutPrefix(catalyst.type);
      const suffix = getMutSuffix(material.name);

      if (targetId === 'current_weapon') {
        if (!prev.currentWeapon) {
          return prev;
        }
        const cur = prev.currentWeapon;
        const existingCats = cur.synergyCatalysts || (cur.color ? [catalyst.type] : []);
        const synRes = resolveMutationSynergyChain(existingCats, catalyst.type, cur.mutationCount || 0, overforgeHeat);
        const finalMult = parseFloat((chaosMultiplier * synRes.powerMultiplier).toFixed(2));

        const nextDamage = Math.max(5, Math.round(cur.damage * finalMult));
        const nextCrit = Math.max(0.05, Math.min(0.95, parseFloat((cur.critChance * (0.85 + Math.random() * 0.4)).toFixed(2))));
        const mutatedName = synRes.isOmegaResonance 
          ? `🌌 ${synRes.primaryTitle} ${cur.name}` 
          : `${prefix} ${cur.name} (${synRes.primaryTitle})`;
        
        nextCurrentWeapon = {
          ...cur,
          name: mutatedName,
          damage: nextDamage,
          critChance: nextCrit,
          color: catalyst.color,
          isMutated: true,
          mutationCount: synRes.chainLevel,
          synergyCatalysts: synRes.catalysts,
          synergyTitle: synRes.primaryTitle,
          mutationStrain: synRes.unstableStrain,
          traits: Array.from(new Set([...(cur.traits || []), ...synRes.traits])),
          effectDescription: `[Chain Lv ${synRes.chainLevel}] ${synRes.description} (Power Mult: ${finalMult}x). Fueled with core kinetic residue of ${material.name}.`
        };

        logMessageText = `🌀 MUTATION FORGE: Active weapon "${cur.name}" mutated (Chain Lv ${synRes.chainLevel})! Forged: "${mutatedName}" (Dmg: ${cur.damage} ➔ ${nextDamage}, Power: ${finalMult}x, Strain: ${synRes.unstableStrain}%)!`;
      } else {
        const itemIdx = nextEquipmentInventory.findIndex(item => item.id === targetId);
        if (itemIdx === -1) {
          return prev;
        }
        const item = nextEquipmentInventory[itemIdx];
        const existingCats = item.synergyCatalysts || (item.color ? [catalyst.type] : []);
        const synRes = resolveMutationSynergyChain(existingCats, catalyst.type, item.mutationCount || 0, overforgeHeat);
        const finalMult = parseFloat((chaosMultiplier * synRes.powerMultiplier).toFixed(2));

        const mutatedName = synRes.isOmegaResonance 
          ? `🌌 ${synRes.primaryTitle} ${item.name}` 
          : `${prefix} ${item.name} (${synRes.primaryTitle})`;

        if (item.type === 'weapon') {
          const nextDamage = Math.max(5, Math.round(item.damage * finalMult));
          const nextCrit = Math.max(0.05, Math.min(0.95, parseFloat((item.critChance * (0.85 + Math.random() * 0.4)).toFixed(2))));
          
          nextEquipmentInventory[itemIdx] = {
            ...item,
            name: mutatedName,
            damage: nextDamage,
            critChance: nextCrit,
            color: catalyst.color,
            isMutated: true,
            mutationCount: synRes.chainLevel,
            synergyCatalysts: synRes.catalysts,
            synergyTitle: synRes.primaryTitle,
            mutationStrain: synRes.unstableStrain,
            traits: Array.from(new Set([...(item.traits || []), ...synRes.traits])),
            description: `[Chain Lv ${synRes.chainLevel}] ${synRes.description} Power Multiplier: ${finalMult}x.`
          };

          logMessageText = `🌀 MUTATION FORGE: Bag weapon "${item.name}" mutated (Chain Lv ${synRes.chainLevel})! Forged: "${mutatedName}" (Dmg: ${item.damage} ➔ ${nextDamage}, Power: ${finalMult}x)!`;
        } else {
          // Armor/defensive item
          const nextDefense = Math.max(1, Math.round(item.defense * finalMult));
          
          nextEquipmentInventory[itemIdx] = {
            ...item,
            name: mutatedName,
            defense: nextDefense,
            color: catalyst.color,
            isMutated: true,
            mutationCount: synRes.chainLevel,
            synergyCatalysts: synRes.catalysts,
            synergyTitle: synRes.primaryTitle,
            mutationStrain: synRes.unstableStrain,
            traits: Array.from(new Set([...(item.traits || []), ...synRes.traits])),
            description: `[Chain Lv ${synRes.chainLevel}] ${synRes.description} Power Multiplier: ${finalMult}x.`
          };

          logMessageText = `🌀 MUTATION FORGE: Defensive gear "${item.name}" mutated (Chain Lv ${synRes.chainLevel})! Realignment: "${mutatedName}" (Def: ${item.defense} ➔ ${nextDefense})!`;
        }
      }

      const logMsg: GameLogMessage = {
        id: `mutation_forge_${Date.now()}`,
        text: logMessageText,
        type: 'craft',
        timestamp: 'FORGE'
      };

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        currentWeapon: nextCurrentWeapon,
        equipmentInventory: nextEquipmentInventory,
        logs: [logMsg, ...prev.logs].slice(0, 200)
      };
    });

    setActiveTab('dungeon');
  };

  const handleUpgradeItem = (
    targetId: string,
    materialId: string,
    overforgeHeat: number = 0
  ) => {
    playSound('mutate');

    const material = BASIC_MATERIALS.find((m) => m.id === materialId)!;

    const spawnX = gameState.playerX;
    const spawnY = gameState.playerY;
    const effectEv = new CustomEvent('spawn-game-effect', {
      detail: { x: spawnX, y: spawnY, text: overforgeHeat >= 95 ? "⚡ GOD-UPGRADED!" : "✨ Upgraded!", type: 'heal' },
    });
    window.dispatchEvent(effectEv);

    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };

      // Deduct material
      nextMats[materialId] = Math.max(0, (nextMats[materialId] ?? 0) - 1);

      let logMessageText = "";
      let nextCurrentWeapon = prev.currentWeapon;
      let nextEquipmentInventory = [...prev.equipmentInventory];

      let currentLevel = 0;
      let itemName = "";
      let itemType: 'weapon' | 'armor' = 'weapon';

      if (targetId === 'current_weapon') {
        if (!prev.currentWeapon) return prev;
        currentLevel = prev.currentWeapon.upgradeLevel ?? 0;
        itemName = prev.currentWeapon.name;
        itemType = 'weapon';
      } else {
        const idx = nextEquipmentInventory.findIndex(item => item.id === targetId);
        if (idx === -1) return prev;
        currentLevel = nextEquipmentInventory[idx].upgradeLevel ?? 0;
        itemName = nextEquipmentInventory[idx].name;
        itemType = nextEquipmentInventory[idx].type === 'weapon' ? 'weapon' : 'armor';
      }

      const nextLevel = currentLevel + 1;
      const heatRatio = Math.min(1.0, Math.max(0, overforgeHeat / 100));
      const baseChance = Math.max(0.4, 1.0 - (currentLevel * 0.15));
      const successChance = Math.max(0.15, baseChance - (heatRatio * 0.45));
      const rolled = Math.random() < successChance;

      if (!rolled) {
        const backfireDmg = Math.floor(heatRatio * 12);
        const currentHp = prev.playerStats.hp;
        const newHp = backfireDmg > 0 ? Math.max(1, currentHp - backfireDmg) : currentHp;

        const logMsgFailure: GameLogMessage = {
          id: `upgrade_fail_${Date.now()}`,
          text: `🔨 OVER-FORGE UPGRADE FAILURE: Attempt on "${itemName}" to +${nextLevel} under ${overforgeHeat}% heat failed! Materials consumed.${backfireDmg > 0 ? ` Anvil backfire dealt ${backfireDmg} heat damage!` : ''}`,
          type: 'danger',
          timestamp: 'FORGE'
        };
        return {
          ...prev,
          inventoryMaterials: nextMats,
          playerStats: backfireDmg > 0 ? { ...prev.playerStats, hp: newHp } : prev.playerStats,
          logs: [logMsgFailure, ...prev.logs].slice(0, 200)
        };
      }

      let damageBonus = 0;
      let defenseBonus = 0;
      let critBonus = 0;
      let abilityName = "";
      let abilityDesc = "";

      const heatBonusMult = 1.0 + (overforgeHeat / 100) * 1.0;

      if (materialId === 'mat_iron') {
        damageBonus = Math.round((itemType === 'weapon' ? 2 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 1 : 0) * heatBonusMult);
        abilityName = "Tempered Guard";
        abilityDesc = "Solid reliability. +5% block chance.";
      } else if (materialId === 'mat_mithril') {
        damageBonus = Math.round((itemType === 'weapon' ? 3 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 1 : 0) * heatBonusMult);
        critBonus = 0.04 * heatBonusMult;
        abilityName = "Swift Strike / Nimble Step";
        abilityDesc = "Featherlight design. Increases critical hit rate and speed.";
      } else if (materialId === 'mat_obsidian') {
        damageBonus = Math.round((itemType === 'weapon' ? 5 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 2 : 0) * heatBonusMult);
        abilityName = "Retribution Spikes";
        abilityDesc = "Glassy razor-sharp finish. Reflects 3 physical damage back to attackers.";
      } else if (materialId === 'mat_dragonscale') {
        damageBonus = Math.round((itemType === 'weapon' ? 6 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 2 : 0) * heatBonusMult);
        critBonus = 0.02 * heatBonusMult;
        abilityName = "Primal Fireburst";
        abilityDesc = "Erupts with dragon fire. Crits ignite targets for 3 turns.";
      } else if (materialId === 'mat_feybone') {
        damageBonus = Math.round((itemType === 'weapon' ? 4 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 1 : 0) * heatBonusMult);
        abilityName = "Vampiric Siphon";
        abilityDesc = "Vitality siphon. Reclaims 2 HP upon striking enemies.";
      } else {
        damageBonus = Math.round((itemType === 'weapon' ? 1 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 1 : 0) * heatBonusMult);
        abilityName = "Reinforced";
        abilityDesc = "Treated log reinforcement. Standard physical defense.";
      }

      let cleanBaseName = itemName.replace(/\s\+\d+$/, "");
      const finalName = `${cleanBaseName} +${nextLevel}`;

      if (targetId === 'current_weapon') {
        const cur = prev.currentWeapon!;
        nextCurrentWeapon = {
          ...cur,
          name: finalName,
          damage: cur.damage + damageBonus,
          critChance: Math.min(0.95, cur.critChance + critBonus),
          upgradeLevel: nextLevel,
          color: material.color,
          effectDescription: `${cur.effectDescription || "Custom Gear."}\n[UPGRADE +${nextLevel}] Passive: ${abilityName} - ${abilityDesc}`
        };

        logMessageText = `🔨 FORGE SUCCESS: Upgraded "${cur.name}" to "${finalName}" using ${material.name}! (+${damageBonus} Damage, +${(critBonus * 100).toFixed(0)}% Crit, Passive: ${abilityName})`;
      } else {
        const idx = nextEquipmentInventory.findIndex(item => item.id === targetId);
        const item = nextEquipmentInventory[idx];

        if (item.type === 'weapon') {
          nextEquipmentInventory[idx] = {
            ...item,
            name: finalName,
            damage: item.damage + damageBonus,
            critChance: Math.min(0.95, item.critChance + critBonus),
            upgradeLevel: nextLevel,
            color: material.color,
            description: `${item.description || "Custom Weapon."} [UPGRADE +${nextLevel}] Passive: ${abilityName} - ${abilityDesc}`
          };
          logMessageText = `🔨 FORGE SUCCESS: Upgraded bag weapon "${item.name}" to "${finalName}" using ${material.name}! (+${damageBonus} Damage, Passive: ${abilityName})`;
        } else {
          nextEquipmentInventory[idx] = {
            ...item,
            name: finalName,
            defense: item.defense + defenseBonus,
            upgradeLevel: nextLevel,
            color: material.color,
            description: `${item.description || "Custom Armor."} [UPGRADE +${nextLevel}] Passive: ${abilityName} - ${abilityDesc}`
          };
          logMessageText = `🔨 FORGE SUCCESS: Upgraded defensive gear "${item.name}" to "${finalName}" using ${material.name}! (+${defenseBonus} Defense, Passive: ${abilityName})`;
        }
      }

      const logMsg: GameLogMessage = {
        id: `upgrade_success_${Date.now()}`,
        text: logMessageText,
        type: 'craft',
        timestamp: 'FORGE'
      };

      return {
        ...prev,
        inventoryMaterials: nextMats,
        currentWeapon: nextCurrentWeapon,
        equipmentInventory: nextEquipmentInventory,
        logs: [logMsg, ...prev.logs].slice(0, 200)
      };
    });

    setActiveTab('dungeon');
  };

  // Reset counters
  const handleClearLogs = () => {
    setGameState((prev) => ({ ...prev, logs: [] }));
  };

  // Dynamic computed stats based on durability / broken state
  const isRightHandBroken = gameState.currentWeapon !== null && gameState.currentWeapon.durability !== undefined && gameState.currentWeapon.durability <= 0;
  const rightHandDamage = gameState.currentWeapon !== null
    ? (isRightHandBroken ? 1 : (gameState.currentWeapon.damage ?? 0))
    : 4;

  const isLeftHandBroken = gameState.equippedShield !== null && gameState.equippedShield.durability !== undefined && gameState.equippedShield.durability <= 0;
  const leftHandDamage = gameState.equippedShield !== null
    ? (isLeftHandBroken ? 0 : (gameState.equippedShield.damage ?? 0))
    : 0;

  const isWeaponBroken = isRightHandBroken; // Keep for backwards compatibility
  const effectiveWeaponDamage = rightHandDamage + leftHandDamage;

  let brokenArmorDefReduction = 0;
  const armorSlotsKeysStr = ['equippedArmor', 'equippedHelmet', 'equippedGloves', 'equippedBoots', 'equippedShield', 'equippedAmulet'] as const;
  armorSlotsKeysStr.forEach(slot => {
    const item = gameState[slot];
    if (item && item.durability !== undefined && item.durability <= 0) {
      brokenArmorDefReduction += item.defense;
    }
  });
  let activeEffectsDefBonus = 0;
  if (gameState.playerStats.activeEffects) {
    gameState.playerStats.activeEffects.forEach(eff => {
      if (eff.statModifiers?.def) activeEffectsDefBonus += eff.statModifiers.def;
    });
  }
  const effectivePlayerDef = Math.max(0, getEffectiveStats(gameState.playerStats).def - brokenArmorDefReduction + activeEffectsDefBonus);

  // Market trade helper variables for correct role checks
  const activeNpcRole = gameState.npcs?.find(n => n.id === gameState.activeTradeNpcId)?.role;
  const isBlacksmith = activeNpcRole === 'blacksmith' || activeNpcRole === 'npc_blacksmith';
  const isMerchant = activeNpcRole === 'merchant' || activeNpcRole === 'npc_merchant' || activeNpcRole === 'traveler_hunter' || activeNpcRole === 'traveler_pilgrim';
  const isApothecary = activeNpcRole === 'apothecary' || activeNpcRole === 'npc_apothecary' || activeNpcRole === 'traveler_herbalist';
  const isTavernMaster = activeNpcRole === 'tavern_master';
  const isSeppo = activeNpcRole === 'merchant_seppo' || activeNpcRole === ('merchant_seppo' as any);

  const effectiveMaxHp = isLunarBlessingActive(gameState, 'waxing_gibbous') ? getEffectiveStats(gameState.playerStats).maxHp + 15 : getEffectiveStats(gameState.playerStats).maxHp;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Visual top bar banner */}
      <header className="bg-slate-900 border-b border-slate-800 py-3 px-4 lg:py-3.5 lg:px-6 flex flex-col md:flex-row gap-3.5 items-center justify-between shadow-md select-none">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-amber-500/10 p-1.5 border border-amber-500/20 rounded-lg">
            <Swords className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider font-sans uppercase text-slate-100 flex items-center gap-1.5">
              <span>Dungeon Crafting Roguelike</span>
              {activeMobileView && <span className="text-[9px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded-full font-bold">MOBILE MODE</span>}
            </h1>
            <p className="text-[10px] text-slate-400 leading-normal">
              Classical turn-based grid RPG with modular alloy assembly systems
            </p>
          </div>
        </div>

        {isPlaying && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
            {/* Clock ticker HUD representation */}
            <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 select-none shadow-inner w-full sm:w-auto justify-center">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
              {gameState.isArena ? (
                <span className="text-red-400 font-bold tracking-wider animate-pulse">⚔️ SANDBOX ARENA</span>
              ) : gameState.isOverworld ? (
                <span className="text-amber-500 font-bold">🌍 OVERWORLD</span>
              ) : (
                <span className="text-purple-400 font-bold">DUNGEON {gameState.playerStats.depth}F</span>
              )}
              <span className="text-slate-700">|</span>
              <span className="text-amber-400 font-extrabold text-[13px] md:text-[14px] bg-slate-900 border border-slate-750 px-2.5 py-0.5 rounded shadow tracking-wide animate-pulse">
                {(() => {
                  const formatted = formatGameTime(gameState.gameTime);
                  return `${formatted.timeStr} (${formatted.period})`;
                })()}
              </span>
              <span className="text-slate-700">|</span>
              {/* Season Display Badge */}
              <span className={`px-2.5 py-0.5 rounded border text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1 shadow-sm select-none ${
                gameState.season === 'spring' 
                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-400' 
                  : gameState.season === 'summer' 
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-400 animate-pulse' 
                  : gameState.season === 'autumn'
                  ? 'bg-orange-950/40 border-orange-500/30 text-orange-400'
                  : 'bg-sky-950/40 border-sky-500/30 text-sky-300 animate-pulse'
              }`}>
                {gameState.season === 'spring' && '🌸 Spring'}
                {gameState.season === 'summer' && '☀️ Summer'}
                {gameState.season === 'autumn' && '🍂 Autumn'}
                {gameState.season === 'winter' && '❄️ Winter'}
              </span>
              <span className="text-slate-700">|</span>
              <span>Turns: <strong>{gameState.playerStats.turnsPlayed}</strong></span>
            </div>

            {/* Stairs climb up helper */}
            {!gameState.isOverworld && gameState.playerStats.depth >= 1 && (
              <button
                id="climb-up-stairs-btn"
                onClick={gameState.playerStats.depth === 1 ? climbStairsUpToOverworld : climbToPreviousDepth}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1 shadow animate-pulse w-full sm:w-auto justify-center"
                title={gameState.playerStats.depth === 1 ? "Climb back out onto the Overworld" : "Climb back up to the previous dungeon floor"}
              >
                {gameState.playerStats.depth === 1 ? "🪜 Exit to Overworld" : `🪜 Climb to Floor ${gameState.playerStats.depth - 1}`}
              </button>
            )}

            {/* Quick Panel HUD Buttons */}
            <div className="flex gap-1 bg-slate-950/40 p-1 border border-slate-800 rounded-lg w-full sm:w-auto justify-center flex-wrap">
              <button
                onClick={() => {
                  setForceLayoutMode(prev => prev === 'mobile' ? 'desktop' : 'mobile');
                }}
                className={`px-2 py-1 text-[10px] rounded border flex items-center gap-1 cursor-pointer font-bold transition-all ${
                  activeMobileView 
                    ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 font-extrabold shadow-sm' 
                    : 'bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-800'
                }`}
                title={`Layout mode: ${forceLayoutMode}. Click to toggle.`}
              >
                <span>{activeMobileView ? '📱 Mobile View' : '💻 Windows View'}</span>
              </button>

              <button
                onClick={() => setIsHelpOpen(true)}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer font-medium"
                title="Help manual overlay"
              >
                <span>Help</span>
                <span className="text-[8px] bg-slate-800 px-1 rounded text-slate-500 font-mono hidden sm:inline">F1</span>
              </button>

              <button
                onClick={() => setIsHistoryBookOpen(true)}
                className="px-2 py-1 bg-slate-900 hover:bg-indigo-950/60 text-[10px] text-indigo-400 rounded border border-indigo-500/20 flex items-center gap-1 cursor-pointer font-bold"
                title="Ancient History and World Chronicles"
              >
                <span>📖 Chronicles</span>
                <span className="text-[8px] bg-indigo-950 px-1 rounded text-indigo-400 font-mono hidden sm:inline">H</span>
              </button>

              <button
                onClick={() => { playSound('click'); setActiveTab('chaos'); }}
                className="px-2 py-1 bg-slate-900 hover:bg-amber-950/60 text-[10px] text-amber-400 rounded border border-amber-500/20 flex items-center gap-1 cursor-pointer font-bold"
                title="Chaos Matrix parameters and difficulty tracker"
              >
                <span>🌀 Chaos Matrix</span>
                <span className="text-[8px] bg-amber-950 px-1 rounded text-amber-400 font-mono hidden sm:inline">Y</span>
              </button>
              
              <button
                onClick={() => { playSound('click'); setActiveTab('inventory'); }}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer font-medium"
                title="Attributes layout and follower management"
              >
                <span>Bag & Allies</span>
                <span className="text-[8px] bg-slate-800 px-1 rounded text-slate-500 font-mono hidden sm:inline">C</span>
              </button>

              <button
                onClick={() => setIsGodPanelOpen(true)}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] text-amber-500 rounded border border-amber-500/20 flex items-center gap-1 cursor-pointer font-medium"
                title="God Mode panel"
              >
                <span>Dev Docs</span>
                <span className="text-[8px] bg-amber-500/10 px-1 rounded text-amber-500/50 font-mono hidden sm:inline">P</span>
              </button>

              <button
                onClick={() => setIsGmPanelOpen(true)}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] text-purple-400 rounded border border-purple-500/20 flex items-center gap-1 cursor-pointer font-medium animate-pulse"
                title="GM parameters panel"
              >
                <span>GM Metrics</span>
                <span className="text-[8px] bg-purple-500/10 px-1 rounded text-purple-400/50 font-mono hidden sm:inline">O</span>
              </button>
            </div>

            <button
              id="give-up-header-btn"
              onClick={() => setIsGameOver(true)}
              className="px-3 py-1 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/50 text-[10px] font-semibold text-rose-400 rounded cursor-pointer transition-all w-full sm:w-auto"
            >
              Forfeit Run
            </button>
          </div>
        )}
      </header>

      {/* Main Container screen routers */}
      {!isPlaying ? (
        // Start Screen Menu
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-950 text-center select-none">
          <div className="max-w-md bg-slate-900/40 p-8 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
            
            <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-5">
              <Swords className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>

            <h2 className="text-xl font-bold tracking-tight uppercase font-sans mb-1 text-slate-100">
              Assemble the Ultimate Alloy
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Enter modular chambers populated with strategic Goblins, Orcs, spellcasters, and spikes. 
              Gather Mithril, Obsidian blocks, and elemental crystals on the floor to construct fully custom physical properties.
            </p>

            <button
              id="start-running-btn"
              onClick={handleStartNewGame}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold tracking-wide rounded-xl cursor-default transition-all shadow-lg hover:shadow-amber-500/10 flex items-center justify-center gap-2 font-sans active:scale-[0.98]"
            >
              <Play className="w-4 h-4" />
              <span>DESCEND THE FORGE CHAMBERS</span>
            </button>

            {/* Manual Instructions Card */}
            <div className="mt-8 border-t border-slate-800/80 pt-5 text-left text-[11px] text-slate-400 flex flex-col gap-2.5">
              <div className="font-semibold text-slate-300 uppercase font-sans flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Tactical Primer:
              </div>
              <p>🖯 Move using standard <kbd className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-slate-200">WASD</kbd> or clicking adjoining canvas tiles.</p>
              <p>⚔️ Stand close to enemies to slash, or stand away to fire magic projectiles.</p>
              <p>🎁 Push triggers over spikes or pop treasure caches to gather alloys.</p>
              <p>⚠️ <strong>Scalable Challenge Limit:</strong> Spawning intensities, adversary damage capabilities, and elite perks scale progressively the longer you remain and the deeper you push.</p>
            </div>
          </div>
        </div>
      ) : isGameOver ? (
        // Game Over Canvas
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center">
          <div className="max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
            <div className="mx-auto w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            
            <h2 className="text-md uppercase font-bold tracking-widest text-[#ef444499]">The Void Claims You</h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
              Your vital patterns disintegrated in the depths of Abyssal Floor {gameState.playerStats.depth}. 
              The chaos elements outpaced your survival.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 my-4 text-left font-mono text-[11px] flex flex-col gap-1.5 text-slate-300">
              <div className="text-slate-500 border-b border-slate-800 pb-1 uppercase text-[10px] font-semibold text-center mb-1">
                Sanctum Run Assessment
              </div>
              <div className="flex justify-between">
                <span>Floors Cleared:</span>
                <span className="text-white font-semibold">{gameState.playerStats.depth}</span>
              </div>
              <div className="flex justify-between">
                <span>Turns Kept:</span>
                <span className="text-blue-400 font-semibold">{gameState.playerStats.turnsPlayed}</span>
              </div>
              <div className="flex justify-between">
                <span>Gold Plundered:</span>
                <span className="text-yellow-400 font-semibold">{gameState.playerStats.gold}</span>
              </div>
              <div className="flex justify-between">
                <span>Forged Masterpiece:</span>
                <span className="font-semibold" style={{ color: gameState.currentWeapon?.color }}>
                  {gameState.currentWeapon?.name}
                </span>
              </div>
            </div>

            <button
              id="download-logs-button"
              onClick={handleDownloadLogs}
              className="w-full py-3 mb-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>DOWNLOAD PLAYTHROUGH LOGS</span>
            </button>

            <button
              id="try-again-button"
              onClick={handleStartNewGame}
              className="w-full py-3 bg-slate-100 hover:bg-white text-slate-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>FORGE NEW DECENT</span>
            </button>
          </div>
        </div>
      ) : isVictory ? (
        // Victory Canvas
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center">
          <div className="max-w-sm bg-slate-900 border border-amber-500/30 rounded-xl p-8 shadow-2xl relative overflow-hidden animate-glow">
            <div className="mx-auto w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>

            <h2 className="text-md uppercase font-bold tracking-widest text-yellow-500">Legend Retreived</h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-2.5 font-sans">
              You conquered the 5 floors of the Forge Sanctum, constructed legendary alloys, and retrieved the artifact!
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 my-4 text-left font-mono text-[11px] flex flex-col gap-1.5 text-slate-300">
              <div className="text-slate-500 border-b border-slate-800/80 pb-1 uppercase text-[10px] font-semibold text-center mb-1">
                Final Statistics
              </div>
              <div className="flex justify-between">
                <span>Sanctity Level:</span>
                <span className="text-green-400 font-semibold">Max Lvl {gameState.playerStats.level}</span>
              </div>
              <div className="flex justify-between">
                <span>Turns Elapsed:</span>
                <span className="text-white font-semibold">{gameState.playerStats.turnsPlayed}</span>
              </div>
              <div className="flex justify-between">
                <span>Ultimate Weapon:</span>
                <span className="font-semibold" style={{ color: gameState.currentWeapon?.color }}>
                  {gameState.currentWeapon?.name}
                </span>
              </div>
            </div>

            <button
              id="victory-download-logs-button"
              onClick={handleDownloadLogs}
              className="w-full py-3 mb-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>DOWNLOAD PLAYTHROUGH LOGS</span>
            </button>

            <button
              id="victory-again-btn"
              onClick={handleStartNewGame}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Conquer Again</span>
            </button>
          </div>
        </div>
      ) : (
        // Playable Field layout viewport
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
          
          {/* LEFT SIDEPANEL: Heroes Card and Assets checklist */}
          {!activeMobileView && (
            <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto order-2 lg:order-none">
            
            {/* 1. Attributes panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow flex flex-col gap-3">
              <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Adventurer Specs</span>
                <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded font-mono text-slate-400">LVL {gameState.playerStats.level}</span>
              </div>

              {/* Stat meters list */}
              <div className="flex flex-col gap-2.5">
                {/* HP */}
                <div className="flex flex-col">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" /> Vitals HP</span>
                    <span className="text-slate-200">{gameState.playerStats.hp}/{effectiveMaxHp}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (gameState.playerStats.hp / effectiveMaxHp) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* MP */}
                <div className="flex flex-col">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span className="flex items-center gap-1">⚡ Focus MP</span>
                    <span className="text-slate-200">{gameState.playerStats.mp}/{gameState.playerStats.maxMp}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(gameState.playerStats.mp / gameState.playerStats.maxMp) * 100}%` }}
                    />
                  </div>
                </div>

                {/* XP */}
                <div className="flex flex-col">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span>🌟 Experiential XP</span>
                    <span className="text-slate-200">{gameState.playerStats.xp} / {gameState.playerStats.nextLevelXp}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(gameState.playerStats.xp / gameState.playerStats.nextLevelXp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Secondary elements (base attack additions & gold) */}
              <div className="grid grid-cols-2 gap-2 mt-1.5 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded border border-slate-800/50">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  <span>Def: <strong className="text-white">{effectivePlayerDef}</strong>{brokenArmorDefReduction > 0 && <span className="text-rose-500 text-[8.5px] font-bold" title="Def reduction from broken armor pieces"> (-{brokenArmorDefReduction})</span>}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded border border-slate-800/50">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Gold: <strong className="text-white">{gameState.playerStats.gold}</strong></span>
                </div>
              </div>

              {/* Town Reputation Status */}
              {gameState.isOverworld && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-col">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                    <span className="flex items-center gap-1.5">
                      ⚖️ Town Reputation
                    </span>
                    <span className={`font-bold ${(gameState.townReputation ?? 100) >= 80 ? 'text-emerald-400' : (gameState.townReputation ?? 100) >= 50 ? 'text-teal-400' : 'text-rose-400'}`}>
                      {Math.round(gameState.townReputation ?? 100)}% {(gameState.townReputation ?? 100) >= 80 ? '(Pristine)' : (gameState.townReputation ?? 100) >= 50 ? '(Pardoned)' : '(Wanted)'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${(gameState.townReputation ?? 100) >= 80 ? 'bg-emerald-500' : (gameState.townReputation ?? 100) >= 50 ? 'bg-teal-500' : 'bg-rose-500'}`}
                      style={{ width: `${gameState.townReputation ?? 100}%` }}
                    />
                  </div>
                  {/* Active Caravan License Badge */}
                  {gameState.hasActiveCaravanLicense && (
                    <div className="mt-2.5 flex flex-col">
                      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-[10px] p-1.5 rounded text-amber-300 font-sans">
                        <span className="text-xs">📜</span>
                        <div className="leading-tight">
                          <div className="font-bold uppercase tracking-wider text-[8.5px] text-amber-400">Rare Trade License Active</div>
                          <div className="text-[8px] text-slate-400 font-mono">+30% Sale Profit & 20% Buy Discount</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Enchanted Traits Panel */}
                  {(() => {
                    const activeTraits = [];
                    if (hasEquippedTrait(gameState, 'STALLION_SPEED')) activeTraits.push({ id: 'STALLION_SPEED', label: 'Stallion Speed', icon: '🏇', desc: 'Overworld speed upgraded (3m/turn)' });
                    if (hasEquippedTrait(gameState, 'DESERT_IMMUNITY')) activeTraits.push({ id: 'DESERT_IMMUNITY', label: 'Desert Immunity', icon: '🌵', desc: 'Protected from sandstorms & heat fatigue' });
                    if (hasEquippedTrait(gameState, 'WORG_FORCE')) activeTraits.push({ id: 'WORG_FORCE', label: 'Worg Force', icon: '🐺', desc: '+3 Attack damage & Pacifies wild Wolves' });
                    if (hasEquippedTrait(gameState, 'SWAMP_GLIDE')) activeTraits.push({ id: 'SWAMP_GLIDE', label: 'Swamp-Glide', icon: '🐊', desc: 'High speed in swamps & swim water' });
                    if (hasEquippedTrait(gameState, 'NON_SLIPPERY')) activeTraits.push({ id: 'NON_SLIPPERY', label: 'Non-Slippery', icon: '🥾', desc: 'Immune to wet/muddy slips & blizzard freeze' });

                    if (activeTraits.length === 0) return null;

                    return (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-teal-400 font-mono mb-0.5">Forged Enchantments</div>
                        {activeTraits.map(tr => (
                          <div key={tr.id} className="flex items-center gap-2 bg-teal-950/40 border border-teal-500/20 text-[10px] p-2 rounded text-teal-300 font-sans">
                            <span className="text-xs">{tr.icon}</span>
                            <div className="leading-tight">
                              <div className="font-bold uppercase tracking-wider text-[8px] text-teal-400">{tr.label}</div>
                              <div className="text-[8px] text-slate-400 font-mono">{tr.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 2. Equipped weapon card and alloy combination details */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow flex flex-col gap-2 relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1.5 flex justify-between items-center">
                <span>Active Weaponry</span>
                <span className="text-[9px] font-mono text-slate-500">Custom Forged</span>
              </div>

              {gameState.currentWeapon && (
                <div className="flex flex-col mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl bounce-subtle">
                      {WEAPON_TEMPLATES[gameState.currentWeapon.baseType].icon}
                    </span>
                    <div>
                      <h4
                        className="text-xs font-bold uppercase tracking-wide font-sans text-shadow-glow"
                        style={{ color: gameState.currentWeapon.color }}
                      >
                        {gameState.currentWeapon.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Base: {gameState.currentWeapon.baseType} Class
                      </p>
                    </div>
                  </div>

                  {/* Weapon properties listing block */}
                  <div className="bg-slate-950 border border-slate-850 rounded p-2.5 mt-2.5 flex flex-col gap-1 text-[10px] font-mono text-slate-400 leading-relaxed">
                    <div className="flex justify-between">
                      <span>Physical Base:</span>
                      <span className="text-white font-bold">{gameState.currentWeapon.damage} Dmg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Critical Threshold :</span>
                      <span className="text-amber-500">{(gameState.currentWeapon.critChance * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum Reach:</span>
                      <span className="text-sky-400">{gameState.currentWeapon.range} Tiles</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Infused Material:</span>
                      <span className="text-slate-300 font-semibold">{gameState.currentWeapon.materialUsed.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Infused Catalyst:</span>
                      <span className="text-[#a855f7]" style={{ color: gameState.currentWeapon.catalystUsed.color }}>
                        {gameState.currentWeapon.catalystUsed.damageType}
                      </span>
                    </div>
                    
                    <p className="border-t border-slate-800/80 pt-1.5 mt-1 text-[9px] text-slate-500 italic leading-snug">
                      {gameState.currentWeapon.effectDescription}
                    </p>
                  </div>

                  {/* Magic Spell Tuning Grimoire Panel */}
                  {(() => {
                    const isMagic = gameState.currentWeapon && (gameState.currentWeapon.baseType === WeaponBaseType.Staff || gameState.currentWeapon.baseType === WeaponBaseType.Wand);
                    if (!isMagic) return null;
                    return (
                      <div className="mt-3 border-t border-slate-800/80 pt-3">
                        <span className="text-[10px] font-mono tracking-wider text-[#a855f7] uppercase font-bold flex items-center gap-1">
                          📖 Grimoire Spell Tuning
                        </span>
                        <div className="grid grid-cols-5 gap-1 mt-2">
                          {SPELLS.map((spell) => {
                            const isSelected = selectedSpellId === spell.id;
                            const finalCost = gameState.currentWeapon?.baseType === WeaponBaseType.Wand ? Math.max(2, spell.manaCost - 1) : spell.manaCost;
                            return (
                              <button
                                key={spell.id}
                                onClick={() => setSelectedSpellId(spell.id)}
                                className={`h-10 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer border ${
                                  isSelected
                                    ? 'bg-[#8b5cf6]/20 border-[#a855f7] text-[#c084fc] shadow-md shadow-[#8b5cf6]/10'
                                    : 'bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-400 hover:text-slate-200'
                                }`}
                                title={`${spell.name} (${finalCost} MP): ${spell.description}`}
                              >
                                <span className="text-sm">{spell.icon}</span>
                                <span className="text-[8px] font-mono mt-0.5">{finalCost} MP</span>
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Selected Spell Details */}
                        {(() => {
                          const spell = SPELLS.find(s => s.id === selectedSpellId) || SPELLS[0];
                          const finalCost = gameState.currentWeapon?.baseType === WeaponBaseType.Wand ? Math.max(2, spell.manaCost - 1) : spell.manaCost;
                          return (
                            <div className="bg-slate-950 border border-[#a855f7]/30 rounded p-2 mt-2 text-[10px] font-sans leading-relaxed text-slate-300">
                              <div className="flex justify-between items-center border-b border-slate-850 pb-1 mb-1">
                                <span className="font-bold text-[#c084fc] flex items-center gap-1">
                                  {spell.icon} {spell.name}
                                </span>
                                <span className="font-mono text-[9px] text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-900/30">
                                  Cost: {finalCost} MP
                                </span>
                              </div>
                              <p className="text-slate-400 text-[9.5px] leading-tight mb-1">{spell.description}</p>
                              <p className="text-[#a78bfa] text-[9px] font-mono font-semibold">{spell.effectDescription}</p>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 2.5 Equipped Gear & Stash Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow flex flex-col gap-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1.5 flex justify-between items-center">
                <span>🛡️ WORN GEAR & BAG</span>
                <span className="text-[9px] font-mono text-slate-500">Inventory slots</span>
              </div>

              {/* Worn Armor item */}
              <div className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-lg flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans">Active Armor / Protection:</span>
                {gameState.equippedArmor ? (
                  <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-2 py-1.5 rounded">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold" style={{ color: gameState.equippedArmor.color }}>🛡️</span>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[120px]">{gameState.equippedArmor.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono">Blocks: +{gameState.equippedArmor.defense} DEF</span>
                      </div>
                    </div>
                    <button
                      onClick={handleUnequipArmor}
                      className="px-2 py-0.5 bg-rose-950/20 hover:bg-rose-950/50 border border-rose-900/40 text-[9px] text-rose-400 font-bold rounded cursor-pointer"
                    >
                      Doff
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2.5 text-[10px] text-slate-600 italic bg-slate-950/60 rounded border border-dashed border-slate-850">
                    No Armor Equipped (0 DEF protection)
                  </div>
                )}
              </div>

              {/* Stashed weapon equip handle */}
              <div className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-lg flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-550 uppercase tracking-wider font-sans">Active Weapon:</span>
                {gameState.currentWeapon ? (
                  <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-2 py-1.5 rounded">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold">⚔️</span>
                      <div className="flex flex-col truncate max-w-[120px]">
                        <span className="text-[11px] font-semibold text-slate-200 truncate" style={{ color: gameState.currentWeapon.color }}>{gameState.currentWeapon.name}</span>
                        <span className="text-[9px] text-slate-505 font-mono">ATK: {gameState.currentWeapon.damage} Dmg</span>
                      </div>
                    </div>
                    <button
                      onClick={handleUnequipWeapon}
                      className="px-2 py-0.5 bg-rose-950/25 hover:bg-rose-950/60 border border-rose-950 text-[9px] text-rose-400 font-bold rounded cursor-pointer"
                    >
                      Doff
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 bg-slate-950/50 px-2 py-2 text-center rounded border border-dashed border-slate-855 italic">
                    Belts basic Scavenger Broken Shiv
                  </div>
                )}
              </div>

              {/* Equipment Inventory Bag list */}
              <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-wide font-sans">Available Equipment ({gameState.equipmentInventory.length}):</span>
                {gameState.equipmentInventory.length > 0 ? (
                  gameState.equipmentInventory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-950/50 p-2 border border-slate-850 rounded text-[10px] gap-2">
                      <div className="flex flex-col truncate flex-1">
                        <span className="font-semibold text-slate-100 truncate" style={{ color: item.color }}>
                          {item.name}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {item.subType === 'Scroll' ? 'Consumable teleportation' : (item.type === 'weapon' ? `Damage: +${item.damage}` : `Shield blocks: +${item.defense}`)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleEquipItem(item)}
                        className={`px-2 py-1 text-slate-950 text-[9px] font-bold rounded cursor-pointer ${
                          item.subType === 'Scroll' ? 'bg-pink-500 hover:bg-pink-400' : 'bg-amber-500 hover:bg-amber-400'
                        }`}
                      >
                        {item.subType === 'Scroll' ? 'Use' : 'Equip'}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-600 italic text-center py-2 border border-dashed border-slate-850 rounded">Bag is currently empty.</div>
                )}
              </div>
            </div>

            {/* 2.7 Chunk Minimap tracker */}
            <ChunkMinimap
              playerX={gameState.playerX}
              playerY={gameState.playerY}
              currentChunkX={gameState.currentChunkX}
              currentChunkY={gameState.currentChunkY}
              visitedTiles={gameState.visitedTiles}
              discovered={gameState.discovered}
              map={gameState.map}
            />

            {/* Active Watchtower Sieges Block */}
            {(() => {
              const overworldChunksList = Object.values(gameState.overworldChunks || {}) as OverworldChunk[];
              const activeSieges = overworldChunksList.filter(c => c.watchtower && c.watchtower.siegeState?.isUnderSiege);
              if (activeSieges.length === 0) return null;
              
              return (
                <div className="bg-slate-900 border border-red-900/40 rounded-xl p-3 flex flex-col gap-2 shadow-lg animate-fade-in text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-500 border-b border-red-950/40 pb-1 flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <span className="animate-ping inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
                      📡 WATCHTOWER SIEGES
                    </span>
                    <span className="text-[9px] font-mono text-red-400">
                      ({activeSieges.length} Active)
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {activeSieges.map((chunk) => {
                      const wt = chunk.watchtower!;
                      const sState = wt.siegeState!;
                      
                      const dx = chunk.chunkX - gameState.currentChunkX;
                      const dy = chunk.chunkY - gameState.currentChunkY;
                      const dist = Math.max(Math.abs(dx), Math.abs(dy));
                      
                      let dirStr = "";
                      if (dy < 0) dirStr += "North";
                      else if (dy > 0) dirStr += "South";
                      if (dx < 0) dirStr += "West";
                      else if (dx > 0) dirStr += "East";
                      if (!dirStr) dirStr = "CURRENT SECTOR";
                      else dirStr = `${dirStr} (${dist} ${dist === 1 ? 'Sector' : 'Sectors'} away)`;

                      const attackerLabel = sState.attacker === 'syndicate' ? 'Syndicate' : (sState.attacker === 'vanguard' ? 'Vanguard' : 'Bandits');
                      const attackerColor = sState.attacker === 'vanguard' ? 'text-sky-400' : (sState.attacker === 'syndicate' ? 'text-purple-400' : 'text-orange-500');
                      
                      const defenderLabel = sState.defender === 'syndicate' ? 'Syndicate' : (sState.defender === 'vanguard' ? 'Vanguard' : (sState.defender === 'bandits' ? 'Bandits' : 'Neutral'));
                      const defenderColor = sState.defender === 'vanguard' ? 'text-sky-400' : (sState.defender === 'syndicate' ? 'text-purple-400' : (sState.defender === 'bandits' ? 'text-orange-500' : 'text-slate-400'));

                      const timerLow = sState.siegeTimerSeconds < 30;

                      return (
                        <div key={wt.id} className="bg-slate-950/90 border border-slate-850 p-2.5 rounded flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-200">Sector [{chunk.chunkX}, {chunk.chunkY}]</span>
                            <span className={`text-[10px] font-mono font-bold ${timerLow ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
                              ⏱️ {sState.siegeTimerSeconds}s
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 flex-wrap">
                            <span className={attackerColor + " font-bold"}>{attackerLabel}</span>
                            <span>besieging</span>
                            <span className={defenderColor + " font-bold"}>{defenderLabel}</span>
                          </div>

                          <div className="text-[9px] font-mono text-slate-500 flex items-center justify-between mt-0.5">
                            <span>🧭 {dirStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Active Rumors Block */}
            {gameState.purchasedRumors && gameState.purchasedRumors.length > 0 && (
              <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-3 flex flex-col gap-2 shadow-lg animate-fade-in text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 border-b border-amber-950/40 pb-1 flex justify-between items-center">
                  <span>📜 ACTIVE RUMORS</span>
                  <span className="text-[9px] font-mono text-slate-500">({gameState.purchasedRumors.length})</span>
                </div>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {gameState.purchasedRumors.map((rumor, index) => (
                    <div key={index} className="bg-slate-950/80 border border-slate-850 p-2 rounded text-[10px] text-slate-300 text-left leading-normal">
                      {rumor}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

          {/* RIGHT CENTER: High visual controls and viewport tabs */}
          <div className={`${activeMobileView ? 'col-span-12' : 'lg:col-span-9 col-span-12'} flex flex-col gap-4 overflow-hidden order-1 lg:order-none`}>
            
            {/* Nav tabs controls */}
            <div className="relative w-full flex items-center">
              <button 
                onClick={() => scrollTabBar('left')}
                className="absolute left-1.5 z-10 bg-slate-950/95 hover:bg-slate-900 text-amber-500 hover:text-amber-400 border border-slate-800/80 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold cursor-pointer transition-all shadow-lg active:scale-95"
                title="Scroll Tabs Left"
              >
                ◀
              </button>

              <div ref={tabBarRef} className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex gap-1.5 w-full select-none shadow overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950/40 px-8">
                <button
                  id="tab-btn-dungeon"
                  onClick={() => { playSound('click'); setActiveTab('dungeon'); }}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    activeTab === 'dungeon'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{activeMobileView ? 'Expedition' : 'DUNGEON EXPEDITION'}</span>
                </button>
              <button
                id="tab-btn-forge"
                onClick={() => { playSound('click'); setActiveTab('forge'); }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'forge'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow animate-pulse'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                <span>{activeMobileView ? 'Forge' : 'ARCANUM BLACKSMITH'}</span>
              </button>
              <button
                id="tab-btn-bestiary"
                onClick={() => { playSound('click'); setActiveTab('bestiary'); }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'bestiary'
                    ? 'bg-rose-950 text-rose-400 font-bold border border-rose-500/30 shadow'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Skull className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 animate-pulse" />
                <span>{activeMobileView ? 'Bestiary' : 'WILDERNESS BESTIARY'}</span>
              </button>
              <button
                id="tab-btn-inventory"
                onClick={() => { playSound('click'); setActiveTab('inventory'); }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'inventory'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
                <span>{activeMobileView ? 'Hero & Party' : 'HERO PROFILE, PARTY & BACKPACK'}</span>
              </button>
              <button
                id="tab-btn-guild"
                onClick={() => { playSound('click'); setActiveTab('guild'); }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'guild'
                    ? 'bg-purple-600 text-white font-bold shadow-lg border border-purple-500'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <span className="text-xs">🏰</span>
                <span>{activeMobileView ? 'Guild' : 'GUILD & FACTIONS'}</span>
              </button>
              {gameState.activeTradeNpcId && (
                <button
                  id="tab-btn-market"
                  onClick={() => { playSound('click'); setActiveTab('market'); }}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-500/30 shrink-0 ${
                    activeTab === 'market'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow animate-bounce'
                      : 'text-amber-400 hover:text-amber-100 bg-amber-500/10'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{activeMobileView ? 'Trade' : `TRADE BOOTH (${gameState.npcs?.find(n => n.id === gameState.activeTradeNpcId)?.name})`}</span>
                </button>
              )}
            </div>

            <button 
              onClick={() => scrollTabBar('right')}
              className="absolute right-1.5 z-10 bg-slate-950/95 hover:bg-slate-900 text-amber-500 hover:text-amber-400 border border-slate-800/80 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold cursor-pointer transition-all shadow-lg active:scale-95"
              title="Scroll Tabs Right"
            >
              ▶
            </button>
          </div>

            {/* Render Tab Viewports */}
            <div className="flex-1 min-h-0 flex flex-col gap-4">
              {activeTab === 'dungeon' && (
                <div className="flex-grow flex flex-col min-h-0 gap-4">
                  {/* Interactive Landmark Hotspot Alert Banner */}
                  {(() => {
                    if (!gameState.isOverworld) return null;
                    const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
                    const activeChunk = gameState.overworldChunks[chunkKey];
                    if (!activeChunk || !activeChunk.pois) return null;
                    const adjacentPoi = activeChunk.pois.find(poi => {
                      return Math.abs(gameState.playerX - poi.x) <= 1 && Math.abs(gameState.playerY - poi.y) <= 1;
                    });
                    
                    if (!adjacentPoi) return null;
                    
                    const pIcons: { [key: string]: string } = {
                      shrine: "⛲",
                      hearth: "🔥",
                      monolith: "📜",
                      sunken_keep: "🏰",
                      fossil: "🦴"
                    };
                    const poiIcon = pIcons[adjacentPoi.type] || "📍";
                    
                    return (
                      <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/35 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none shadow-md animate-fade-in">
                        <div className="flex items-center gap-2.5 text-left">
                          <span className="text-3xl filter drop-shadow">{poiIcon}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">{adjacentPoi.name}</h4>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                adjacentPoi.isInteracted ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10'
                              }`}>
                                {adjacentPoi.isInteracted ? 'EXHAUSTED' : 'READY TO INTERACT'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-sans mt-0.5 max-w-md">
                              "{adjacentPoi.description}"
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setActivePoi(adjacentPoi);
                            playSound('loot');
                          }}
                          className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/35 border border-amber-400/20 cursor-pointer"
                        >
                          <span>{adjacentPoi.isInteracted ? "📖 READ CHRONICLE" : "⚡ EXAMINE LANDMARK"}</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Interactive Dungeon Shrine Alert Banner */}
                  {(() => {
                    if (gameState.isOverworld) return null;
                    if (!gameState.dungeonProps) return null;
                    const adjacentShrine = gameState.dungeonProps.find(prop => {
                      const isShrine = prop.name.toLowerCase().includes('shrine') || prop.name.toLowerCase().includes('altar');
                      return isShrine && Math.abs(gameState.playerX - prop.x) <= 1 && Math.abs(gameState.playerY - prop.y) <= 1;
                    });
                    
                    if (!adjacentShrine) return null;
                    
                    const isUsed = adjacentShrine.description.includes('(EXHAUSTED)');
                    
                    return (
                      <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/35 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none shadow-md animate-fade-in">
                        <div className="flex items-center gap-2.5 text-left">
                          <span className="text-3xl filter drop-shadow animate-pulse">{adjacentShrine.char}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest">{adjacentShrine.name}</h4>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                isUsed ? 'bg-slate-800 text-slate-400' : 'bg-purple-500/20 text-purple-400 border border-purple-500/10'
                              }`}>
                                {isUsed ? 'EXHAUSTED' : 'UNTOUCHED POWER'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-sans mt-0.5 max-w-md">
                              "{adjacentShrine.description}"
                            </p>
                          </div>
                        </div>
                        
                        <button
                          disabled={isUsed}
                          onClick={() => {
                            handleInteractWithDungeonShrine(adjacentShrine);
                          }}
                          className={`w-full sm:w-auto py-2.5 px-6 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg border cursor-pointer ${
                            isUsed 
                              ? 'bg-slate-800 text-slate-500 border-slate-750 cursor-not-allowed opacity-50' 
                              : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400/20 shadow-purple-950/35'
                          }`}
                        >
                          <span>{isUsed ? "CLAIMED" : "📿 ACCEPT SACRIFICE"}</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Fishing Hotspot Alert Banner */}
                  {(() => {
                    const hasPole = (gameState.inventoryMaterials['mat_fishing_pole'] || 0) > 0;
                    const hasAdjacentWater = [
                      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                      { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
                      { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
                    ].some(d => {
                      const nx = gameState.playerX + d.dx;
                      const ny = gameState.playerY + d.dy;
                      return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && gameState.map[ny]?.[nx] === TileType.Water;
                    });
                    
                    if (!hasAdjacentWater) return null;
                    
                    return (
                      <div className="bg-gradient-to-r from-sky-950/45 to-slate-900 border border-sky-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse duration-1000 select-none shadow-md">
                        <div className="flex items-center gap-2.5 text-left">
                          <span className="text-3xl animate-bounce">🌊</span>
                          <div>
                            <h4 className="text-xs font-black text-sky-400 uppercase tracking-widest">Quiet Water Hotspot</h4>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                              {hasPole 
                                ? 'Water currents detected in your vicinity! Prime conditions for angling.' 
                                : 'You are exactly next to a water body. Craft an Ancient Fishing Pole under Survival tab to fish!'}
                            </p>
                          </div>
                        </div>
                        
                        {hasPole ? (
                          <button
                            onClick={() => setIsFishingOpen(true)}
                            className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-sky-600 hover:bg-sky-500 text-white border border-sky-450 hover:border-sky-300 text-[11px] font-black uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-sky-950/20 cursor-pointer"
                          >
                            <span>🎣 START FISHING</span>
                          </button>
                        ) : (
                          <div className="text-[10px] bg-slate-950/70 border border-slate-800 text-slate-400 py-1.5 px-3 rounded-lg font-semibold italic text-center w-full sm:w-auto">
                            Rod Required 🎣
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Compact Mobile HUD Overlay */}
                  {activeMobileView && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-lg select-none text-xs font-mono animate-fade-in shrink-0">
                      {/* HP & MP */}
                      <div className="flex gap-2">
                        <div className="bg-red-950/40 border border-red-900/30 px-2 py-1 rounded flex items-center gap-1">
                          <span className="text-red-500 font-bold">❤️</span>
                          <span className="text-slate-200 font-bold">{gameState.playerStats.hp}/{gameState.playerStats.maxHp}</span>
                        </div>
                        <div className="bg-blue-950/40 border border-blue-900/30 px-2 py-1 rounded flex items-center gap-1">
                          <span className="text-blue-400 font-bold">🧪</span>
                          <span className="text-slate-200 font-bold">{gameState.playerStats.mp}/{gameState.playerStats.maxMp}</span>
                        </div>
                      </div>

                      {/* Gold & Active Weapon / Armor */}
                      <div className="flex gap-2 items-center">
                        <div className="bg-amber-950/40 border border-amber-500/20 px-2 py-1 rounded flex items-center gap-1">
                          <span className="text-amber-500">🪙</span>
                          <span className="text-amber-400 font-bold">{gameState.playerStats.gold}</span>
                        </div>
                        {gameState.currentWeapon && (
                          <div className="bg-slate-950/60 border border-slate-800 px-2 py-1 rounded flex items-center gap-1 text-[10px] text-slate-300">
                            <span>⚔️</span>
                            <span className="truncate max-w-[80px] font-sans font-bold" style={{ color: gameState.currentWeapon.color }}>
                              {gameState.currentWeapon.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Atmospheric Weather forecasting banner & Ritual Station */}
                  {gameState.isOverworld && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-3 shadow-xl select-none animate-fade-in font-sans">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center text-xl shadow-inner border border-slate-800">
                            {gameState.weather === 'clear' ? '☀️'
                             : gameState.weather === 'rainy' ? '🌧️'
                             : gameState.weather === 'foggy' ? '🌫️'
                             : gameState.weather === 'snowy' ? '❄️'
                             : gameState.weather === 'sandstorm' ? '🌪️'
                             : '🌨️'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-left">
                              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Atmospheric Status</span>
                              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-bold px-1.5 py-0.5 rounded uppercase">
                                {gameState.season || 'spring'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                              {gameState.weather === 'clear' && '☀️ Clear Skies'}
                              {gameState.weather === 'rainy' && '🌧️ Pouring Rain & Storms'}
                              {gameState.weather === 'foggy' && '🌫️ Thick Ambient Fog'}
                              {gameState.weather === 'snowy' && '❄️ Gentle Frosty Snowfall'}
                              {gameState.weather === 'sandstorm' && '🌪️ Swirling Sandstorm'}
                              {gameState.weather === 'blizzard' && '🌨️ Severe Glacial Blizzard'}
                            </h4>
                          </div>
                        </div>

                        {/* Active Modifiers brief badge */}
                        <div className="flex flex-wrap gap-2 items-center justify-between sm:justify-end w-full sm:w-auto">
                          <span className="text-[11px] font-mono text-slate-400 max-w-[200px] sm:max-w-[320px] leading-tight text-left">
                            {gameState.weather === 'clear' && '☀️ Standard traveling speeds, clear fields of view.'}
                            {gameState.weather === 'rainy' && '⚡ +30% Lightning catalyst, -20% Fire dmg, instant fishing bites!'}
                            {gameState.weather === 'foggy' && '🌫️ Vision is restricted, but +15% stealth dodge rate active!'}
                            {gameState.weather === 'snowy' && '❄️ Fire attacks deal +20% damage. Small chance to slip.'}
                            {gameState.weather === 'sandstorm' && '🐫 Blinds normal attacks. (Tip: Equip Dune-Treader boots for desert immunity!)'}
                            {gameState.weather === 'blizzard' && '🌨️ Freezing fatigue outdoor penalty. Frost deals +40% dmg! (Tip: Equip heavy Worg-Spiked gear!)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!activeMobileView ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[880px] max-h-[880px] min-h-0 overflow-hidden">
                      <div className="lg:col-span-8 flex flex-col min-h-0 relative h-full">
                        <GameCanvas
                          gameState={gameState}
                          onTileClick={handleTileClick}
                          shakeTrigger={shakeTrigger}
                        />
                        {activeTargetedScroll && (
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/95 border-2 border-amber-500 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 z-50 animate-bounce">
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Casting Spell Scroll</span>
                              <span className="text-xs text-slate-200 font-bold">{activeTargetedScroll.name} (Click an enemy to cast)</span>
                            </div>
                            <button
                              onClick={() => setActiveTargetedScroll(null)}
                              className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="lg:col-span-4 flex flex-col h-full min-h-0">
                        <GameLog
                          logs={gameState.logs}
                          onClearLogs={handleClearLogs}
                          onDownloadLogs={handleDownloadLogs}
                          className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full flex flex-col shadow-inner min-h-0"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex flex-col gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-900 shadow-xl">
                      {/* COMPACT MOBILE HUD */}
                      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 shadow grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono select-none animate-fade-in">
                        {/* HP HUD */}
                        <div className="flex flex-col gap-1 bg-slate-950/60 p-2 rounded border border-slate-850">
                          <div className="flex justify-between items-center text-[9px] text-slate-400">
                            <span className="flex items-center gap-1 font-sans font-bold text-[8.5px] uppercase text-rose-400"><Heart className="w-3 h-3 text-rose-500" /> Vitals HP</span>
                            <span className="text-slate-100 font-bold">{gameState.playerStats.hp}/{effectiveMaxHp}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, (gameState.playerStats.hp / effectiveMaxHp) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* MP HUD */}
                        <div className="flex flex-col gap-1 bg-slate-950/60 p-2 rounded border border-slate-850">
                          <div className="flex justify-between items-center text-[9px] text-slate-400">
                            <span className="flex items-center gap-1 font-sans font-bold text-[8.5px] uppercase text-sky-400">⚡ Focus MP</span>
                            <span className="text-slate-100 font-bold">{gameState.playerStats.mp}/{gameState.playerStats.maxMp}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${(gameState.playerStats.mp / gameState.playerStats.maxMp) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* GOLD */}
                        <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded border border-slate-850 px-3">
                          <span className="text-[9.5px] font-sans font-bold text-amber-500 uppercase flex items-center gap-1">🪙 Gold</span>
                          <span className="text-amber-300 font-bold font-mono">{gameState.playerStats.gold}</span>
                        </div>

                        {/* XP / LEVEL HUD */}
                        <div className="flex flex-col gap-1 bg-slate-950/60 p-2 rounded border border-slate-850">
                          <div className="flex justify-between items-center text-[9px] text-slate-400">
                            <span className="font-sans font-bold text-[8.5px] uppercase text-emerald-400">⭐ LVL {gameState.playerStats.level}</span>
                            <span className="text-slate-300 font-bold">{gameState.playerStats.xp}/{gameState.playerStats.nextLevelXp}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-300"
                              style={{ width: `${(gameState.playerStats.xp / gameState.playerStats.nextLevelXp) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* SUB BAR: Position, Time, and Moon Phase */}
                      <div className="bg-slate-900/40 border border-slate-850 rounded-lg px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono select-none">
                        <div className="flex items-center gap-1.5">
                          <span>📍</span>
                          <span className="text-slate-200 font-semibold font-sans">
                            {gameState.isOverworld ? 'Sunder Wilderness' : `Dungeon Floor ${gameState.playerStats.depth}`}
                          </span>
                          <span className="text-slate-500">({gameState.playerStats.x}, {gameState.playerStats.y})</span>
                        </div>

                        {gameState.isOverworld && (
                          <div className="flex items-center gap-1.5">
                            <span>⚖️ Rep:</span>
                            <span className={`font-bold ${(gameState.townReputation ?? 100) >= 80 ? 'text-emerald-400' : (gameState.townReputation ?? 100) >= 50 ? 'text-teal-400' : 'text-rose-400'}`}>
                              {Math.round(gameState.townReputation ?? 100)}%
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-slate-300">
                          <span>🕒 {formatGameTime(gameState.gameTime).timeStr}</span>
                          {(() => {
                            const phase = getMoonPhase(gameState.playerStats.turnsPlayed || 0);
                            return <span title={phase.description} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1 text-[9px] text-indigo-300 font-sans font-medium">{phase.emoji} {phase.name}</span>;
                          })()}
                        </div>
                      </div>

                      <div className="relative">
                        <GameCanvas
                          gameState={gameState}
                          onTileClick={handleTileClick}
                          shakeTrigger={shakeTrigger}
                        />
                        {activeTargetedScroll && (
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900/95 border-2 border-amber-500 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 z-50 animate-bounce animate-duration-1000">
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Casting Spell Scroll</span>
                              <span className="text-xs text-slate-200 font-bold">{activeTargetedScroll.name}</span>
                            </div>
                            <button
                              onClick={() => setActiveTargetedScroll(null)}
                              className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase px-2 py-1 rounded transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mobile Command cockpit controls */}
                  {activeMobileView && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 select-none animate-fade-in">
                      {/* D-PAD DIRECTIONAL GRID */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Movement D-Pad</span>
                        <div className="grid grid-cols-3 gap-1.5 w-max">
                          {/* Row 1 */}
                          <button
                            onClick={() => makeMove(-1, -1)}
                            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-slate-400 hover:text-white font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
                            title="Move Up-Left (Numpad 7)"
                          >
                            ↖
                          </button>
                          <button
                            onClick={() => makeMove(0, -1)}
                            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-amber-500 hover:text-amber-400 font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
                            title="Move Up (Arrow Up / W)"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => makeMove(1, -1)}
                            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-slate-400 hover:text-white font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
                            title="Move Up-Right (Numpad 9)"
                          >
                            ↗
                          </button>

                          {/* Row 2 */}
                          <button
                            onClick={() => makeMove(-1, 0)}
                            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-amber-500 hover:text-amber-400 font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
                            title="Move Left (Arrow Left / A)"
                          >
                            ◀
                          </button>
                          <button
                            onClick={() => makeMove(0, 0)}
                            className="w-12 h-12 rounded-xl bg-slate-950/90 hover:bg-slate-850 border-2 border-slate-800 active:scale-95 text-slate-400 hover:text-slate-300 font-bold text-center flex items-center justify-center transition-all cursor-pointer text-xs"
                            title="Pass / Wait Turn (Space / .)"
                          >
                            WAIT
                          </button>
                          <button
                            onClick={() => makeMove(1, 0)}
                            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-amber-500 hover:text-amber-400 font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
                            title="Move Right (Arrow Right / D)"
                          >
                            ▶
                          </button>

                          {/* Row 3 */}
                          <button
                            onClick={() => makeMove(-1, 1)}
                            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-slate-400 hover:text-white font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
                            title="Move Down-Left (Numpad 1)"
                          >
                            ↙
                          </button>
                          <button
                            onClick={() => makeMove(0, 1)}
                            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-amber-500 hover:text-amber-400 font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
                            title="Move Down (Arrow Down / S)"
                          >
                            ▼
                          </button>
                          <button
                            onClick={() => makeMove(1, 1)}
                            className="w-12 h-12 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 active:scale-95 text-slate-400 hover:text-white font-bold text-center flex items-center justify-center transition-all cursor-pointer text-lg"
                            title="Move Down-Right (Numpad 3)"
                          >
                            ↘
                          </button>
                        </div>
                      </div>

                      {/* QUICK SYSTEM ACTIONS CONTAINER */}
                      <div className="flex-1 w-full flex flex-col gap-2.5 items-center sm:items-stretch">
                        <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase text-center sm:text-left">Tactical Quick Interactions</span>
                        <div className="grid grid-cols-2 gap-2 w-full max-w-sm sm:max-w-none">
                          <button
                            onClick={handleGKeyInteract}
                            className="h-11 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
                            title="Interact with adjacent objects / enter stairs"
                          >
                            <span className="text-sm">🔍</span>
                            <span>Interact [G]</span>
                          </button>

                          <button
                            onClick={handleBraceDefense}
                            className="h-11 rounded-lg bg-sky-500/95 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer uppercase tracking-wider"
                            title="Double brace defense parry power"
                          >
                            <span className="text-sm">🛡️</span>
                            <span>Guard [B]</span>
                          </button>

                          <button
                            onClick={() => { playSound('click'); setActiveTab('inventory'); }}
                            className="h-11 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 active:scale-95 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                            title="Open attributes character sheet overview"
                          >
                            <span className="text-sm">🎒</span>
                            <span>Bag & Stats [C]</span>
                          </button>

                          <button
                            onClick={() => {
                              setGameState((prev) => ({
                                ...prev,
                                activeQuestBoardOpen: true,
                              }));
                            }}
                            className="h-11 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 active:scale-95 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                            title="Browse quest board in village town chunk"
                          >
                            <span className="text-sm">📜</span>
                            <span>Quests Board</span>
                          </button>
                        </div>

                        {/* Extra handy tips help */}
                        <div className="text-[9.5px] font-mono text-slate-500 text-center sm:text-left bg-slate-950/40 p-2 rounded border border-slate-850/65 leading-relaxed w-full">
                          ⚡ <strong>Tip:</strong> Tap adjoining map cells directly to auto-walk / strike, or tap the Movement D-Pad to traverse safely!
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'forge' && (
                <div className="flex-grow flex flex-col">
                  {(() => {
                    const adjCampfire = [
                      { dx: 0, dy: 0 },
                      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                      { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
                      { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
                    ].some(d => {
                      const nx = gameState.playerX + d.dx;
                      const ny = gameState.playerY + d.dy;
                      return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && gameState.map[ny]?.[nx] === TileType.Campfire;
                    });
                    const adjAnvil = [
                      { dx: 0, dy: 0 },
                      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                      { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
                      { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
                    ].some(d => {
                      const nx = gameState.playerX + d.dx;
                      const ny = gameState.playerY + d.dy;
                      return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && gameState.map[ny]?.[nx] === TileType.Anvil;
                    });
                    return (
                      <CraftingPanel
                        inventoryMaterials={gameState.inventoryMaterials}
                        inventoryCatalysts={gameState.inventoryCatalysts}
                        equipmentInventory={gameState.equipmentInventory}
                        onCraftWeapon={handleCraftComplete}
                        currentWeapon={gameState.currentWeapon}
                        onPlaceCampfire={handlePlaceCampfire}
                        onPlaceAnvil={handlePlaceAnvil}
                        onCookMeat={handleCookMeat}
                        onCookFish={handleCookFish}
                        onCookPrimeMeat={handleCookPrimeMeat}
                        onCraftFishingPole={handleCraftFishingPole}
                        onCraftLockpicks={handleCraftLockpicks}
                        onCraftHatchet={handleCraftHatchet}
                        onCraftPickaxe={handleCraftPickaxe}
                        onRestCampfire={handleRestCampfire}
                        isNextToCampfire={adjCampfire}
                        isNextToAnvil={adjAnvil}
                        onMutateItem={handleMutateItem}
                        onUpgradeItem={handleUpgradeItem}
                        blacksmithForgeLevel={gameState.blacksmithForgeLevel ?? 1}
                        onCraftRecallScroll={handleCraftRecallScroll}
                        onCraftSpellScroll={handleCraftSpellScroll}
                        gameState={gameState}
                        onCookRecipe={handleCookRecipe}
                        onBrewPotion={handleBrewPotion}
                        onUpgradeApothecary={handleUpgradeApothecary}
                      />
                    );
                  })()}
                </div>
              )}

              {activeTab === 'bestiary' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <BestiaryOverlay
                    defeatedEnemiesCount={gameState.defeatedEnemiesCount || {}}
                    inline={true}
                  />
                </div>
              )}

              {activeTab === 'chaos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto">
                  <div className="lg:col-span-5 flex flex-col">
                    <DifficultyTracker
                      turnsPlayed={gameState.playerStats.turnsPlayed}
                      realTimeSeconds={gameState.playerStats.realTimeSeconds}
                      depth={gameState.playerStats.depth}
                      defeatedEnemiesCount={gameState.defeatedEnemiesCount}
                      clearedCampsCount={gameState.clearedCamps?.length || 0}
                      playerStats={gameState.playerStats}
                      currentWeapon={gameState.currentWeapon}
                    />
                  </div>
                  <div className="lg:col-span-7 flex flex-col">
                    <ChaosConsole
                      gameState={gameState}
                      setGameState={setGameState}
                      addLogMessage={addLogMessage}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <UnifiedInventoryPanel
                  gameState={gameState}
                  setGameState={setGameState}
                  handleEatMeat={handleEatMeat}
                  handleEquipItem={handleEquipItem}
                  handleDiscardItem={handleDiscardItem}
                  handleDiscardMaterial={handleDiscardMaterial}
                  handleDiscardCatalyst={handleDiscardCatalyst}
                  handleShiftCatalyst={handleShiftCatalyst}
                  handleUnstableReactorSurge={handleUnstableReactorSurge}
                  handleUnequipHelmet={handleUnequipHelmet}
                  handleUnequipArmor={handleUnequipArmor}
                  handleUnequipBoots={handleUnequipBoots}
                  handleUnequipWeapon={handleUnequipWeapon}
                  handleUnequipShield={handleUnequipShield}
                  handleUnequipGloves={handleUnequipGloves}
                  handleUnequipAmulet={handleUnequipAmulet}
                  handleAdjustAttribute={handleAdjustAttribute}
                  playSound={playSound}
                />
              )}

              {activeTab === 'market' && (
                <div className="flex-grow flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow min-h-[420px]">
                  {/* Trader Banner header */}
                  <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center bg-slate-950/30 p-3 rounded-lg border border-slate-850">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🏪</span>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                          {gameState.npcs?.find(n => n.id === gameState.activeTradeNpcId)?.name || 'Town Armorer'}'s Trading Counter
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Role: <strong className="text-emerald-400 capitalize">{gameState.npcs?.find(n => n.id === gameState.activeTradeNpcId)?.role.replace('npc_', '') || 'Merchant'}</strong> | Closes at night (8:00 PM - 8:00 AM)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('dungeon')}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-100 rounded cursor-pointer transition-all border border-slate-705"
                    >
                      Exit Trading
                    </button>
                  </div>

                  {/* Caravan Journey & Escort Service Widget */}
                  {(() => {
                    const activeTradeNpcId = gameState.activeTradeNpcId;
                    const isCaravanMerchant = activeTradeNpcId === 'npc_caravan_merchant' || activeTradeNpcId?.includes('caravan') || activeTradeNpcId?.includes('merchant') || activeTradeNpcId?.includes('wandering_merchant_');
                    if (!isCaravanMerchant) return null;
                    return (
                      <div className="mb-4 bg-blue-950/20 border border-blue-500/30 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2 border-b border-blue-950/40 pb-2">
                          <span className="text-2xl">🗺️</span>
                          <div className="text-left">
                            <h4 className="text-xs font-black uppercase text-blue-400 font-sans tracking-wider">CARAVAN ESCORT & FAST TRAVEL</h4>
                            <p className="text-[10px] text-slate-400 leading-normal">
                              Sign up as a Caravan Guard to travel securely with the traders across overworld chunks. You will face random wilderness encounters, protect the wagon cargo, and collect a major gold payout upon safe arrival!
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2.5">
                          <h5 className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide text-left">Available Destinations:</h5>
                          {(() => {
                            const currentCx = gameState.currentChunkX;
                            const currentCy = gameState.currentChunkY;
                            const destinations = [];
                            
                            for (let dx = -3; dx <= 3; dx++) {
                              for (let dy = -3; dy <= 3; dy++) {
                                const tx = currentCx + dx;
                                const ty = currentCy + dy;
                                if (tx === currentCx && ty === currentCy) continue;
                                if (hasTownAtChunk(tx, ty)) {
                                  const name = getDeterministicTownName(tx, ty);
                                  const dist = Math.max(Math.abs(dx), Math.abs(dy));
                                  destinations.push({ x: tx, y: ty, name, dist });
                                }
                              }
                            }
                            
                            if (!destinations.some(t => t.x === 0 && t.y === 0) && !(currentCx === 0 && currentCy === 0)) {
                              destinations.push({
                                x: 0,
                                y: 0,
                                name: 'Oakhaven Village',
                                dist: Math.max(Math.abs(currentCx), Math.abs(currentCy))
                              });
                            }
                            if (!destinations.some(t => t.x === 3 && t.y === -2) && !(currentCx === 3 && currentCy === -2)) {
                              destinations.push({
                                x: 3,
                                y: -2,
                                name: 'Vanguard Harbor Port',
                                dist: Math.max(Math.abs(currentCx - 3), Math.abs(currentCy + 2))
                              });
                            }

                            if (destinations.length === 0) {
                              return <p className="text-[10px] text-slate-500 italic">No alternative towns discovered in nearby regions.</p>;
                            }

                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {destinations.map((dest, idx) => {
                                  const reward = 100 + dest.dist * 80;
                                  return (
                                    <div key={idx} className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg flex flex-col justify-between gap-2">
                                      <div className="text-left">
                                        <div className="font-bold text-slate-200 text-[11px] truncate">{dest.name}</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5 flex justify-between">
                                          <span>Region: ({dest.x}, {dest.y})</span>
                                          <span className="font-mono text-blue-400 font-semibold">{dest.dist} {dest.dist === 1 ? 'region' : 'regions'} away</span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleStartCaravanTravel(dest.x, dest.y, dest.name)}
                                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] text-slate-50 font-bold text-[9px] rounded-md transition-all flex justify-center items-center gap-1.5 shadow-md cursor-pointer"
                                      >
                                        <span>🛡️ Escort Caravan</span>
                                        <span className="text-yellow-300 font-mono font-bold">(Payout: +{reward}g)</span>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Blacksmith Forge repair bay widget */}
                  {isBlacksmith && (
                    <div className="mb-4 bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center border-b border-amber-950/40 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🔨</span>
                          <div>
                            <h4 className="text-xs font-bold uppercase text-amber-500 font-sans tracking-wide">Blacksmith Forge — Repair Station</h4>
                            <p className="text-[10px] text-slate-400">Repairs cost approximately 0.5 Gold per durability point lost.</p>
                          </div>
                        </div>
                        <button
                          onClick={handleRepairAll}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all flex items-center gap-1.5 shadow"
                        >
                          🔨 Repair All Gear
                        </button>
                      </div>

                      {/* Flex wrapper for equipped/bag items repair buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
                        {/* 1. Weapon */}
                        {(() => {
                          const item = gameState.currentWeapon;
                          if (!item) return null;
                          const dur = item.durability ?? 100;
                          const max = item.maxDurability ?? 100;
                          const cost = Math.max(1, Math.floor((max - dur) * 0.5));
                          const isBroken = dur === 0;
                          return (
                            <div className={`p-2 rounded-lg flex justify-between items-center gap-2 text-[10px] transition-all ${
                              isBroken 
                                ? 'bg-red-950/40 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)]' 
                                : 'bg-slate-950/80 border border-slate-800'
                            }`}>
                              <div className="flex flex-col min-w-0 flex-1 text-left">
                                <span className="font-bold truncate text-slate-200 flex items-center gap-1" style={{ color: item.color }}>
                                  {isBroken && <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />}
                                  ⚔️ {item.name}
                                  {isBroken && <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-0.1 rounded font-mono border border-red-500/30 ml-1">BROKEN</span>}
                                </span>
                                <span className={`text-[9px] ${isBroken ? 'text-red-400 font-semibold animate-pulse' : 'text-slate-400'}`}>Durability: {dur}/{max}</span>
                              </div>
                              <button
                                disabled={dur >= max}
                                onClick={() => handleRepairItem('currentWeapon', item, true)}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                                  isBroken 
                                    ? 'bg-red-500 hover:bg-red-400 text-white cursor-pointer animate-pulse' 
                                    : dur < max 
                                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer' 
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {dur >= max ? 'Pristine' : `${cost}g`}
                              </button>
                            </div>
                          );
                        })()}

                        {/* 2. Equipped Armors slots */}
                        {(['equippedArmor', 'equippedHelmet', 'equippedGloves', 'equippedBoots', 'equippedShield', 'equippedAmulet'] as const).map(slotKey => {
                          const item = gameState[slotKey];
                          if (!item) return null;
                          const dur = item.durability ?? 100;
                          const max = item.maxDurability ?? 100;
                          const cost = Math.max(1, Math.floor((max - dur) * 0.5));
                          const emoji = slotKey === 'equippedHelmet' ? '🪖' : slotKey === 'equippedArmor' ? '👕' : slotKey === 'equippedGloves' ? '🧤' : slotKey === 'equippedAmulet' ? '📿' : slotKey === 'equippedBoots' ? '🥾' : '🛡️';
                          const isBroken = dur === 0;
                          return (
                            <div key={slotKey} className={`p-2 rounded-lg flex justify-between items-center gap-2 text-[10px] transition-all ${
                              isBroken 
                                ? 'bg-red-950/40 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)]' 
                                : 'bg-slate-950/80 border border-slate-800'
                            }`}>
                              <div className="flex flex-col min-w-0 flex-1 text-left">
                                <span className="font-bold truncate text-slate-200 flex items-center gap-1" style={{ color: item.color }}>
                                  {isBroken && <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />}
                                  {emoji} {item.name}
                                  {isBroken && <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-0.1 rounded font-mono border border-red-500/30 ml-1">BROKEN</span>}
                                </span>
                                <span className={`text-[9px] ${isBroken ? 'text-red-400 font-semibold animate-pulse' : 'text-slate-400'}`}>Durability: {dur}/{max}</span>
                              </div>
                              <button
                                disabled={dur >= max}
                                onClick={() => handleRepairItem(slotKey, item, true)}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                                  isBroken 
                                    ? 'bg-red-500 hover:bg-red-400 text-white cursor-pointer animate-pulse' 
                                    : dur < max 
                                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer' 
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {dur >= max ? 'Pristine' : `${cost}g`}
                              </button>
                            </div>
                          );
                        })}

                        {/* 3. Items in pack bag */}
                        {[...gameState.equipmentInventory]
                          .sort((a, b) => {
                            const aBroken = (a.durability ?? 100) === 0;
                            const bBroken = (b.durability ?? 100) === 0;
                            if (aBroken && !bBroken) return -1;
                            if (!aBroken && bBroken) return 1;

                            const aDamaged = (a.durability ?? 100) < (a.maxDurability ?? 100);
                            const bDamaged = (b.durability ?? 100) < (b.maxDurability ?? 100);
                            if (aDamaged && !bDamaged) return -1;
                            if (!aDamaged && bDamaged) return 1;
                            return 0;
                          })
                          .map(item => {
                            const dur = item.durability ?? 100;
                            const max = item.maxDurability ?? 100;
                            const cost = Math.max(1, Math.floor((max - dur) * 0.5));
                            const emoji = item.type === 'weapon' ? '⚔️' : '🛡️';
                            const isBroken = dur === 0;
                            return (
                              <div key={item.id} className={`p-2 rounded-lg flex justify-between items-center gap-2 text-[10px] transition-all ${
                                isBroken 
                                  ? 'bg-red-950/40 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse' 
                                  : 'bg-slate-950/80 border border-slate-800'
                              }`}>
                                <div className="flex flex-col min-w-0 flex-1 text-left">
                                  <span className="font-bold truncate text-slate-300 flex items-center gap-1" style={{ color: item.color }}>
                                    {isBroken && <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />}
                                    {emoji} {item.name} (Bag)
                                    {isBroken && <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-0.1 rounded font-mono border border-red-500/30 ml-1">BROKEN</span>}
                                  </span>
                                  <span className={`text-[9px] ${isBroken ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>Durability: {dur}/{max}</span>
                                </div>
                                <button
                                  disabled={dur >= max}
                                  onClick={() => handleRepairItem(item.id, item, false)}
                                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                                    isBroken 
                                      ? 'bg-red-500 hover:bg-red-400 text-white cursor-pointer animate-pulse' 
                                      : dur < max 
                                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer' 
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  {dur >= max ? 'Pristine' : `${cost}g`}
                                </button>
                              </div>
                            );
                          })}
                      </div>

                      {/* Forge Upgrade Section */}
                      <div className="border-t border-amber-950/40 pt-2 flex flex-col gap-1.5 text-left">
                        <div className="flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-bold text-amber-500 uppercase font-sans tracking-wide">🔥 Forge Tier Level: {(gameState.blacksmithForgeLevel ?? 1) === 3 ? '3 (Maximum)' : gameState.blacksmithForgeLevel ?? 1}</span>
                            <p className="text-[10px] text-slate-400">
                              {(gameState.blacksmithForgeLevel ?? 1) === 1 && "Tier 1: Basic recipes. Upgrade to Tier 2 to craft Staves, Wands, and Crossbows."}
                              {(gameState.blacksmithForgeLevel ?? 1) === 2 && "Tier 2: Advanced recipes. Upgrade to Tier 3 to craft Greatswords and Warhammers."}
                              {(gameState.blacksmithForgeLevel ?? 1) === 3 && "Tier 3: Ultimate templates unlocked! Elite Legendary templates are active."}
                            </p>
                          </div>
                          {(gameState.blacksmithForgeLevel ?? 1) < 3 ? (
                            <button
                              onClick={handleUpgradeBlacksmith}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center gap-1"
                            >
                              <span>Upgrade Forge</span>
                              <span className="text-[9px] text-amber-900">
                                ({(gameState.blacksmithForgeLevel ?? 1) === 1 ? '250g + 5x Iron' : '400g + 5x Mithril'})
                              </span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-bold font-sans">⚔️ Fully Upgraded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Apothecary Laboratory Upgrade Panel */}
                  {isApothecary && (
                    <div className="mb-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center text-left text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🧪</span>
                          <div>
                            <h4 className="text-xs font-bold uppercase text-emerald-400 font-sans tracking-wide">Apothecary Laboratory — Upgrade Station</h4>
                            <span className="font-bold text-slate-300">Laboratory Tier: {(gameState.apothecaryTier ?? 1) === 3 ? '3 (Maximum)' : gameState.apothecaryTier ?? 1}</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {(gameState.apothecaryTier ?? 1) === 1 && "Tier 1: Basic catalyst/elixirs. Upgrade to Tier 2 to unlock Medium Health & Mana potions."}
                              {(gameState.apothecaryTier ?? 1) === 2 && "Tier 2: Advanced mixtures. Upgrade to Tier 3 to unlock Elixirs of Full Restoration & Chaos Catalysts."}
                              {(gameState.apothecaryTier ?? 1) === 3 && "Tier 3: Ultimate laboratory unlocked! Elite Apothecary options are active."}
                            </p>
                          </div>
                        </div>
                        {(gameState.apothecaryTier ?? 1) < 3 ? (
                          <button
                            onClick={handleUpgradeApothecary}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center gap-1.5"
                          >
                            <span>Upgrade Laboratory</span>
                            <span className="text-[9px] text-emerald-900">
                              ({(gameState.apothecaryTier ?? 1) === 1 ? '150g + 10x Berries' : '300g + 20x Berries + 2x Catalysts'})
                            </span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-bold font-sans">🧪 Fully Upgraded</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tavern Gossip & Mercenary Recruitment Board */}
                  {isTavernMaster && (
                    <div className="mb-4 bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center text-left text-[11px] border-b border-amber-950/40 pb-2.5 gap-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase text-amber-500 font-sans tracking-wide font-sans">🍻 Tavern Master — Rumor Mongering & Gossip</h4>
                          <p className="text-[10px] text-slate-400">Buy a round for the bartender to gain valuable coordinates of wild riches.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={handleBuyRumor}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center justify-center gap-1.5 self-start sm:self-auto"
                          >
                            🍺 Buy Gossip Round <span className="text-[9px] text-amber-900">(40g)</span>
                          </button>
                          <button
                            onClick={handleTavernRest}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-100 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center justify-center gap-1.5 self-start sm:self-auto"
                          >
                            🛏️ Rent Cozy Room <span className="text-[9px] text-amber-200">(15g)</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-left text-[11px]">
                        <h4 className="text-xs font-bold uppercase text-amber-500 font-sans tracking-wide mb-2">👥 Wandering Mercenaries For Hire</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          {/* Novice Mercenary */}
                          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between gap-2">
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-sky-400">🗡️ Novice Swordsman</span>
                                <span className="text-[9px] font-mono text-slate-400">Lvl 2</span>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Basic cutthroat. Restores damage swings with 35 HP, +6 ATK.</p>
                            </div>
                            <button
                              onClick={() => handleHireMercenary('novice')}
                              className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
                            >
                              <span>Hire Novice</span>
                              <span className="text-amber-500 font-mono">(180g)</span>
                            </button>
                          </div>

                          {/* Veteran Mercenary */}
                          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between gap-2">
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-emerald-400">⚔️ Veteran Raider</span>
                                <span className="text-[9px] font-mono text-slate-400">Lvl 4</span>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Heavy sellsword. Strong defenses with 55 HP, +9 ATK, 4 DEF.</p>
                            </div>
                            <button
                              onClick={() => handleHireMercenary('veteran')}
                              className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
                            >
                              <span>Hire Veteran</span>
                              <span className="text-amber-500 font-mono">(280g)</span>
                            </button>
                          </div>

                          {/* Champion Gladiator */}
                          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between gap-2">
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-amber-400">🏆 Champion Gladiator</span>
                                <span className="text-[9px] font-mono text-slate-400">Lvl 6</span>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Gladiator. Unstoppable tanking with 85 HP, +14 ATK, 7 DEF.</p>
                            </div>
                            <button
                              onClick={() => handleHireMercenary('champion')}
                              className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
                            >
                              <span>Hire Champion</span>
                              <span className="text-amber-500 font-mono">(450g)</span>
                            </button>
                          </div>

                          {/* Merchant Guard */}
                          <div className="bg-slate-950/80 border border-purple-500/30 p-2.5 rounded-lg flex flex-col justify-between gap-2">
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-purple-400">💂 Merchant Guard</span>
                                <span className="text-[9px] font-mono text-slate-400">Lvl 3</span>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Outpost defender. Essential for establishing and guarding wilderness safehouses.</p>
                            </div>
                            <button
                              onClick={() => handleHireMercenary('merchant_guard')}
                              className="w-full py-1 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/20 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
                            >
                              <span>Hire Guard</span>
                              <span className="text-amber-500 font-mono">(250g)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Twin Columns: Buy on Left, Sell on Right */}
                  {(() => {
                    const getStock = (id: string, defaultVal: number = 3) => {
                      const activeId = gameState.activeTradeNpcId || 'npc_shop';
                      const activeNpc = gameState.npcs?.find(n => n.id === activeId);
                      const activeRole = activeNpc?.role || (activeId === 'npc_caravan_merchant' || activeId.includes('caravan') ? 'merchant' : '');
                      const mConfig = getMerchantConfig(activeRole, activeId);
                      
                      return gameState.merchantStock?.[activeId]?.[id] !== undefined
                        ? gameState.merchantStock[activeId][id]
                        : (mConfig.defaultStock[id] !== undefined ? mConfig.defaultStock[id] : defaultVal);
                    };

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto">
                        {/* BUY COLUMN */}
                        <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl flex flex-col min-h-0">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3">
                            🛍️ Buy Shop Stock
                          </h4>
                          <div className="flex-grow flex flex-col gap-2.5 text-[11px]">
                            {/* Enchanted Artificer & Exotic Gear Shop */}
                            {(gameState.activeTradeNpcId === 'npc_caravan_merchant' || gameState.activeTradeNpcId?.includes('caravan') || gameState.activeTradeNpcId?.includes('merchant') || gameState.activeTradeNpcId?.includes('wandering_merchant_')) && (
                              <div className="flex flex-col gap-2.5 w-full border border-teal-500/20 bg-teal-950/10 p-3 rounded-xl mb-3">
                                <h5 className="text-[10px] font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5 border-b border-teal-950/40 pb-1.5">
                                  <span>🛡️</span> ENCHANTED ARTIFICER & EXOTIC GEAR
                                </h5>
                                <div className="flex flex-col gap-2">
                                  {[
                                    { id: 'horse', name: 'Stallion-Sprung Greaves 🥾', price: 350, desc: 'Enchanted heavy Sabatons. Grants Stallion Speed (overworld speed upgraded to 3m/turn).' },
                                    { id: 'camel', name: 'Dune-Treader Sabatons 🐫', price: 400, desc: 'Enchanted desert boots. Complete immunity to sandstorms, sand-blindness, and overworld heat fatigue.' },
                                    { id: 'worg', name: 'Worg-Spiked Gauntlets 🧤', price: 550, desc: 'Enchanted heavy gauntlets. Adds +3 damage to all physical attacks and pacifies wild Wolves.' },
                                    { id: 'crocodile', name: 'Crocodile Bayou Sabatons 🐊', price: 300, desc: 'Enchanted swamp boots. Move through swamps at extreme speed (2m/turn) and walk safely on water.' }
                                  ].map((gear) => {
                                    const reputation = gameState.townReputation ?? 100;
                                    const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
                                    const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
                                    const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
                                    const chaMult = getCharismaDiscountMultiplier(gameState);
                                    const baseAdjustedPrice = Math.round(gear.price * upgradedDiscountMult);
                                    const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);
                                    
                                    const hasAlready = gameState.equipmentInventory.some(it => it.name.substring(0, 10) === gear.name.substring(0, 10)) ||
                                                      gameState.equippedBoots?.name.substring(0, 10) === gear.name.substring(0, 10) ||
                                                      gameState.equippedGloves?.name.substring(0, 10) === gear.name.substring(0, 10);

                                    return (
                                      <div key={gear.id} className="flex justify-between items-center bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg hover:border-slate-700 transition-all text-left">
                                        <div className="flex flex-col flex-grow pr-3">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-slate-100">{gear.name}</span>
                                            {hasAlready && (
                                              <span className="text-[8px] bg-teal-500 text-white font-mono font-bold px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0">Owned</span>
                                            )}
                                          </div>
                                          <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">{gear.desc}</span>
                                        </div>
                                        <button
                                          onClick={() => handleBuyEnchantedGear(gear.id as any, gear.price, gear.name)}
                                          className="px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer shrink-0 transition-colors bg-teal-600 hover:bg-teal-500 text-white shadow-md"
                                        >
                                          Buy: {finalPrice}g
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Blacksmith Stock */}
                            {isBlacksmith &&
                              getBlacksmithItems(gameState.townReputation ?? 100).map((item) => {
                                const stock = getStock(item.id, 2);
                                const reputation = gameState.townReputation ?? 100;
                                const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
                                const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
                                const chaMult = getCharismaDiscountMultiplier(gameState);
                                const finalPrice = Math.round(item.value * discountMult * chaMult);
                                return (
                                  <div key={item.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left">
                                    <div className="flex flex-col max-w-[200px] truncate">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                                        <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                                          {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 italic mt-0.5 leading-normal">{item.description}</span>
                                      <span className="text-[9px] text-[#38bdf8] font-mono mt-0.5 font-bold">
                                        {item.type === 'weapon' ? `Attack: +${item.damage} ATK` : `Armor blocks: +${item.defense} DEF`}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleBuyEquipment(item)}
                                      disabled={stock <= 0}
                                      className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer flex items-center gap-1 shrink-0 transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                                    >
                                      <span>Buy: {finalPrice}g</span>
                                    </button>
                                  </div>
                                );
                              })}

                            {/* Supply Merchant Stock */}
                            {isMerchant &&
                              MERCHANT_RESOURCES.map((res) => {
                                const reputation = gameState.townReputation ?? 100;
                                const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
                                const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
                                const biomeMult = getBiomePriceMultiplier(res.id, gameState.biome);
                                const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
                                const chaMult = getCharismaDiscountMultiplier(gameState);
                                const baseAdjustedPrice = Math.round(res.price * biomeMult * upgradedDiscountMult);
                                const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);
                                const stock = getStock(res.id, 3);
                                return (
                                  <div key={res.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left">
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-200" style={{ color: res.color }}>{res.name}</span>
                                        {biomeMult !== 1.0 && (
                                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono shrink-0 ${biomeMult > 1.0 ? 'bg-red-950/80 text-red-400 border border-red-900/40' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40'}`}>
                                            {biomeMult > 1.0 ? `▲ ${(biomeMult * 100 - 100).toFixed(0)}% High` : `▼ ${(100 - biomeMult * 100).toFixed(0)}% Low`}
                                          </span>
                                        )}
                                        <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                                          {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                                        </span>
                                      </div>
                                      <span className="text-[9px] text-slate-400 mt-0.5">{res.desc}</span>
                                    </div>
                                    <button
                                      onClick={() => handleBuyResource('material', res.id, res.price)}
                                      disabled={stock <= 0}
                                      className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer shrink-0 transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                                    >
                                      Buy: {finalPrice}g
                                    </button>
                                  </div>
                                );
                              })}

                            {/* Apothecary Stock */}
                            {isApothecary &&
                              getApothecaryItems(gameState.apothecaryTier ?? 1, gameState.townReputation ?? 100).map((cat) => {
                                const reputation = gameState.townReputation ?? 100;
                                const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
                                const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
                                const biomeMult = getBiomePriceMultiplier(cat.id, gameState.biome);
                                const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
                                const chaMult = getCharismaDiscountMultiplier(gameState);
                                const baseAdjustedPrice = Math.round(cat.price * biomeMult * upgradedDiscountMult);
                                const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);
                                const stock = getStock(cat.id, 3);
                                return (
                                  <div key={cat.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left">
                                    <div className="flex flex-col max-w-[200px] truncate">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-200" style={{ color: cat.color }}>✸ {cat.name}</span>
                                        {biomeMult !== 1.0 && (
                                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono shrink-0 ${biomeMult > 1.0 ? 'bg-red-950/80 text-red-400 border border-red-900/40' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40'}`}>
                                            {biomeMult > 1.0 ? `▲ ${(biomeMult * 100 - 100).toFixed(0)}% High` : `▼ ${(100 - biomeMult * 100).toFixed(0)}% Low`}
                                          </span>
                                        )}
                                        <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                                          {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                                        </span>
                                      </div>
                                      <span className="text-[9px] text-slate-400 mt-0.5 whitespace-normal leading-tight">{cat.desc}</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (cat.id?.startsWith('potion_') || cat.id?.startsWith('scroll_')) {
                                          handleBuyResource('potion', cat.id, cat.price);
                                        } else {
                                          handleBuyResource('catalyst', cat.id, cat.price);
                                        }
                                      }}
                                      disabled={stock <= 0}
                                      className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer shrink-0 transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                                    >
                                      Buy: {finalPrice}g
                                    </button>
                                  </div>
                                );
                              })}

                            {/* Tavern Master & Caravan Stock */}
                            {(isTavernMaster || gameState.activeTradeNpcId === 'npc_caravan_merchant' || gameState.activeTradeNpcId?.includes('caravan')) &&
                              TAVERN_SHOP_ITEMS.map((item) => {
                                const reputation = gameState.townReputation ?? 100;
                                const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
                                const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
                                const biomeMult = getBiomePriceMultiplier(item.id, gameState.biome);
                                const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
                                const chaMult = getCharismaDiscountMultiplier(gameState);
                                const baseAdjustedPrice = Math.round(item.price * biomeMult * upgradedDiscountMult);
                                const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);
                                const stock = getStock(item.id, 3);
                                return (
                                  <div key={item.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left">
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                                        {biomeMult !== 1.0 && (
                                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono shrink-0 ${biomeMult > 1.0 ? 'bg-red-950/80 text-red-400 border border-red-900/40' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40'}`}>
                                            {biomeMult > 1.0 ? `▲ ${(biomeMult * 100 - 100).toFixed(0)}% High` : `▼ ${(100 - biomeMult * 100).toFixed(0)}% Low`}
                                          </span>
                                        )}
                                        <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                                          {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                                        </span>
                                      </div>
                                      <span className="text-[9px] text-slate-400 mt-0.5">{item.desc}</span>
                                    </div>
                                    <button
                                      onClick={() => handleBuyResource('material', item.id, item.price)}
                                      disabled={stock <= 0}
                                      className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer shrink-0 transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                                    >
                                      Buy: {finalPrice}g
                                    </button>
                                  </div>
                                );
                              })}

                            {/* Seppo's Unique Stock */}
                            {isSeppo && (
                              <div className="flex flex-col gap-2.5 w-full">
                                {SEPPO_SHOP_ITEMS.map((item) => {
                                  const stock = getStock(item.id, 1);
                                  return (
                                    <div key={item.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left animate-fade-in">
                                      <div className="flex flex-col max-w-[200px] truncate">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                                          <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                                            {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 italic mt-0.5 leading-normal whitespace-normal">{item.description}</span>
                                        <span className="text-[9px] text-[#38bdf8] font-mono mt-0.5 font-bold">
                                          {item.type === 'weapon' ? `Attack: +${item.damage} ATK` : `Armor blocks: +${item.defense} DEF`}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleBuyEquipment(item)}
                                        disabled={stock <= 0}
                                        className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer flex items-center gap-1 shrink-0 font-mono transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                                      >
                                        Buy: {item.value}g
                                      </button>
                                    </div>
                                  );
                                })}
                                {SEPPO_RESOURCES.map((item) => {
                                  const stock = getStock(item.id, 3);
                                  return (
                                    <div key={item.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left animate-fade-in">
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                                          <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                                            {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                                          </span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 mt-0.5">{item.desc}</span>
                                      </div>
                                      <button
                                        onClick={() => handleBuyResource('material', item.id, item.price)}
                                        disabled={stock <= 0}
                                        className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer shrink-0 font-mono transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                                      >
                                        Buy: {item.price}g
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SELL COLUMN */}
                        <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl flex flex-col min-h-0">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3">
                        💰 Liquidate Stash
                      </h4>

                      <div className="flex-grow flex flex-col gap-4 text-[11px] text-left">
                        {/* Sellable Equipment */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Loot & Gear Items:</span>
                          {gameState.equipmentInventory.length > 0 ? (
                            gameState.equipmentInventory.map((item) => (
                              <div key={item.id} className="flex justify-between items-center bg-slate-900/50 border border-slate-850 p-2 rounded-lg">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                                  <span className="text-[9px] text-slate-500">{item.subType === 'Scroll' ? 'Consumable' : (item.type === 'weapon' ? `Damage: +${item.damage}` : `Blocks: +${item.defense}`)}</span>
                                </div>
                                <button
                                  onClick={() => handleSellEquipment(item)}
                                  className="px-2.5 py-1 bg-emerald-950/20 hover:bg-emerald-950/50 border border-emerald-900 text-emerald-400 font-bold text-[9px] rounded cursor-pointer"
                                >
                                  Sell: +{item.value}g
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-[10px] text-slate-600 italic py-2 text-center bg-slate-900/10 rounded border border-slate-850">No unequipped items to sell.</div>
                          )}
                        </div>

                        {/* Sellable Materials */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-sans">Raw Materials:</span>
                          {BASIC_MATERIALS.map((mat) => {
                            const count = gameState.inventoryMaterials[mat.id] || 0;
                            const sellVal = mat.id === 'mat_wood' ? 8 : 6;
                            const biomeMult = getBiomePriceMultiplier(mat.id, gameState.biome);
                            const upgradedSellMult = 1.0 + (gameState.guildUpgrades?.['up_supply_deals'] || 0) * 0.20;
                            const baseAdjustedPayout = Math.round(sellVal * biomeMult * upgradedSellMult);
                            const finalPayout = gameState.hasActiveCaravanLicense ? Math.round(baseAdjustedPayout * 1.30) : baseAdjustedPayout;

                            return (
                              <div key={mat.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-850 p-1.5 px-2 rounded-lg">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-300 font-medium">{mat.name} (x{count})</span>
                                    {biomeMult !== 1.0 && (
                                      <span className={`text-[7px] font-bold px-1 py-0.2 rounded font-mono ${biomeMult > 1.0 ? 'bg-red-950/50 text-red-400' : 'bg-emerald-950/50 text-emerald-400'}`}>
                                        {biomeMult > 1.0 ? `▲ ${(biomeMult * 100 - 100).toFixed(0)}%` : `▼ ${(100 - biomeMult * 100).toFixed(0)}%`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  disabled={count <= 0}
                                  onClick={() => handleSellResource('material', mat.id, sellVal)}
                                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${count > 0 ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 cursor-pointer' : 'opacity-30 border border-slate-800 text-slate-600'}`}
                                >
                                  Sell: +{finalPayout}g
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Sellable Catalysts */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Alchemical Shards:</span>
                          {ELEMENTAL_CATALYSTS.map((cat) => {
                            const count = gameState.inventoryCatalysts[cat.id] || 0;
                            const sellVal = 8;
                            const biomeMult = getBiomePriceMultiplier(cat.id, gameState.biome);
                            const upgradedSellMult = 1.0 + (gameState.guildUpgrades?.['up_supply_deals'] || 0) * 0.20;
                            const baseAdjustedPayout = Math.round(sellVal * biomeMult * upgradedSellMult);
                            const finalPayout = gameState.hasActiveCaravanLicense ? Math.round(baseAdjustedPayout * 1.30) : baseAdjustedPayout;

                            return (
                              <div key={cat.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-850 p-1.5 px-2 rounded-lg">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-35" style={{ color: cat.color }}>✸ {cat.name} (x{count})</span>
                                    {biomeMult !== 1.0 && (
                                      <span className={`text-[7px] font-bold px-1 py-0.2 rounded font-mono ${biomeMult > 1.0 ? 'bg-red-950/50 text-red-400' : 'bg-emerald-950/50 text-emerald-400'}`}>
                                        {biomeMult > 1.0 ? `▲ ${(biomeMult * 100 - 100).toFixed(0)}%` : `▼ ${(100 - biomeMult * 100).toFixed(0)}%`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  disabled={count <= 0}
                                  onClick={() => handleSellResource('catalyst', cat.id, sellVal)}
                                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${count > 0 ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 cursor-pointer' : 'opacity-30 border border-slate-800 text-slate-600'}`}
                                >
                                  Sell: +{finalPayout}g
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

              {activeTab === 'guild' && (
                <GuildOverlay
                  gameState={gameState}
                  setGameState={setGameState}
                  addLogMessage={addLogMessage}
                  playSound={playSound}
                />
              )}
            </div>

            {/* Bottom Log Area (Hidden on Dungeon tab in desktop view since we render it side-by-side) */}
            {!(activeTab === 'dungeon' && !activeMobileView) && (
              <GameLog logs={gameState.logs} onClearLogs={handleClearLogs} onDownloadLogs={handleDownloadLogs} />
            )}
          </div>
        </div>
      )}

      {/* Interactive Tactical Overlays */}
      <AppOverlays
        isHelpOpen={isHelpOpen}
        setIsHelpOpen={setIsHelpOpen}
        isGodPanelOpen={isGodPanelOpen}
        setIsGodPanelOpen={setIsGodPanelOpen}
        isGmPanelOpen={isGmPanelOpen}
        setIsGmPanelOpen={setIsGmPanelOpen}
        isSleepOpen={isSleepOpen}
        setIsSleepOpen={setIsSleepOpen}
        isHistoryBookOpen={isHistoryBookOpen}
        setIsHistoryBookOpen={setIsHistoryBookOpen}
        isBestiaryOpen={isBestiaryOpen}
        setIsBestiaryOpen={setIsBestiaryOpen}
        isFishingOpen={isFishingOpen}
        setIsFishingOpen={setIsFishingOpen}
        isLockpickingOpen={isLockpickingOpen}
        setIsLockpickingOpen={setIsLockpickingOpen}
        activeLockpickingChestIndex={activeLockpickingChestIndex}
        setActiveLockpickingChestIndex={setActiveLockpickingChestIndex}
        activePoi={activePoi}
        setActivePoi={setActivePoi}
        activeDrunkNpc={activeDrunkNpc}
        setActiveDrunkNpc={setActiveDrunkNpc}
        activeTravelerNpc={activeTravelerNpc}
        setActiveTravelerNpc={setActiveTravelerNpc}
        unlawfulGuardTarget={unlawfulGuardTarget}
        setUnlawfulGuardTarget={setUnlawfulGuardTarget}
        activeRelicDraft={activeRelicDraft}
        setActiveRelicDraft={setActiveRelicDraft}
        activeRecallScroll={activeRecallScroll}
        setActiveRecallScroll={setActiveRecallScroll}
        isAutoplayActive={isAutoplayActive}
        setIsAutoplayActive={setIsAutoplayActive}
        gameState={gameState}
        setGameState={setGameState}
        addLogMessage={addLogMessage}
        handleRegenerateCurrentLocation={handleRegenerateCurrentLocation}
        handleConfirmSleep={handleConfirmSleep}
        handleCatchFish={handleCatchFish}
        handleFailFish={handleFailFish}
        handleOpenChest={handleOpenChest}
        handleConsumeLockpick={handleConsumeLockpick}
        handlePoiChoiceSelected={handlePoiChoiceSelected}
        handleDrunkNpcEffects={handleDrunkNpcEffects}
        handleTravelerTrade={handleTravelerTrade}
        handleTravelerAttack={handleTravelerAttack}
        handleAcceptQuest={handleAcceptQuest}
        handleTurnInQuest={handleTurnInQuest}
        handleConfirmUnlawfulAttack={handleConfirmUnlawfulAttack}
        handleRecallTeleport={handleRecallTeleport}
      />

      {gameState.activeQuestBoardOpen && (
        <QuestBoardOverlay
          gameState={gameState}
          setGameState={setGameState}
          onClose={() => setGameState(prev => ({ ...prev, activeQuestBoardOpen: false }))}
          onAcceptQuest={handleAcceptQuest}
          onTurnInQuest={handleTurnInQuest}
        />
      )}

      {/* Caravan Travel & Escort Active Journey Overlay */}
      {gameState.caravanTravel?.active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 overflow-y-auto font-sans text-slate-100">
          <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-blue-500/30 rounded-2xl shadow-2xl flex flex-col min-h-[550px] max-h-[90vh] overflow-hidden">
            
            {/* Header Banner */}
            <div className={`p-4 ${gameState.caravanTravel.currentEncounter && !gameState.caravanTravel.currentEncounter.resolved ? 'bg-red-950/40 border-b border-red-500/20' : 'bg-blue-950/40 border-b border-blue-500/20'} flex justify-between items-center transition-colors duration-300`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">🛡️</span>
                <div className="text-left">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-400">ACTIVE OVERWORLD ESCORT MISSION</h2>
                  <div className="text-sm font-black text-slate-100 flex items-center gap-1.5 mt-0.5">
                    <span>Region Chunk ({gameState.caravanTravel.originX}, {gameState.caravanTravel.originY})</span>
                    <span className="text-blue-500">➔</span>
                    <span className="text-emerald-400 font-bold">{gameState.caravanTravel.destName}</span>
                  </div>
                </div>
              </div>
              <div className="px-3 py-1 bg-blue-950/80 border border-blue-800 rounded-lg text-xs font-mono font-bold text-blue-300">
                💰 Payout: {gameState.caravanTravel.rewardGold}g
              </div>
            </div>

            {/* Main Content Splitted Grid */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0">
              
              {/* Left Column: Visual Map / Progress / Player Stats */}
              <div className="md:col-span-5 flex flex-col gap-4">
                
                {/* Parallax Traveling Wagon Carriage Animation */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-950/10 via-transparent to-slate-950/50 pointer-events-none" />
                  
                  <div className="absolute top-2 right-4 text-xl">🌅</div>
                  
                  <div className="text-slate-800 text-3xl font-bold opacity-30 select-none tracking-tight absolute bottom-8">
                    ▲▲▲▲▲▲▲▲▲▲▲
                  </div>
                  
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3 animate-pulse">
                      <span className="text-3xl filter drop-shadow">🐎</span>
                      <span className="text-3xl filter drop-shadow relative animate-bounce" style={{ animationDelay: '0.2s' }}>🛒</span>
                      <span className="text-xs text-blue-400 font-mono font-black animate-pulse">💨 ROLLING...</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">"Clack-clack! Giddyup!"</div>
                  </div>
                  
                  <div className="w-full h-1 border-t-2 border-dashed border-slate-700 mt-2 absolute bottom-6" />
                </div>

                {/* Progress Tracks */}
                <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl text-left">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1.5 mb-2.5">
                    Journey Milestones
                  </h4>
                  
                  <div className="flex items-center justify-between gap-1 mt-4 px-2">
                    <span className="text-[10px] text-slate-400 font-bold truncate max-w-[80px]">Start</span>
                    <div className="flex-1 flex items-center justify-between relative px-2">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800" />
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 transition-all duration-500" 
                        style={{ width: `${(gameState.caravanTravel.currentStep / gameState.caravanTravel.totalSteps) * 100}%` }}
                      />
                      {Array.from({ length: gameState.caravanTravel.totalSteps + 1 }).map((_, i) => {
                        const isCleared = i <= gameState.caravanTravel.currentStep;
                        const isCurrent = i === gameState.caravanTravel.currentStep;
                        return (
                          <div 
                            key={i} 
                            className={`w-3.5 h-3.5 rounded-full border-2 z-10 flex items-center justify-center transition-all duration-300 ${
                              isCurrent 
                                ? 'bg-blue-500 border-slate-900 scale-125 ring-2 ring-blue-500/40 shadow-blue-500/50 shadow-md' 
                                : isCleared 
                                  ? 'bg-blue-800 border-blue-500' 
                                  : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            {isCleared && <span className="text-[6px] text-white">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold truncate max-w-[80px] text-right">{gameState.caravanTravel.destName}</span>
                  </div>

                  <div className="mt-4 flex justify-between items-center text-[11px] font-mono border-t border-slate-850 pt-3">
                    <span className="text-slate-400">Escort Progress:</span>
                    <span className="text-slate-100 font-bold">
                      {gameState.caravanTravel.currentStep} / {gameState.caravanTravel.totalSteps} Regions
                    </span>
                  </div>
                </div>

                {/* Guard Vital Stats */}
                <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl text-left">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1.5 mb-2.5">
                    Guard Vitality
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/80 p-2.5 border border-slate-850 rounded-lg flex items-center gap-2 text-left">
                      <span className="text-lg">❤️</span>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">HP</div>
                        <div className="font-bold font-mono text-rose-400">{gameState.playerStats.hp} / {gameState.playerStats.maxHp}</div>
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 border border-slate-850 rounded-lg flex items-center gap-2 text-left">
                      <span className="text-lg">⚡</span>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Exhaustion</div>
                        <div className="font-bold font-mono text-amber-400">{gameState.playerStats.exhaustion}%</div>
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 border border-slate-850 rounded-lg flex items-center gap-2 text-left">
                      <span className="text-lg">🪙</span>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Gold</div>
                        <div className="font-bold font-mono text-yellow-400">{gameState.playerStats.gold}g</div>
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 border border-slate-850 rounded-lg flex items-center gap-2 text-left">
                      <span className="text-lg">⭐</span>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Lvl</div>
                        <div className="font-bold font-mono text-emerald-400">Level {gameState.playerStats.level}</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: History Narrative Log & Active Encounters */}
              <div className="md:col-span-7 flex flex-col gap-4 min-h-0">
                
                {/* Journey Logs narrative scroll */}
                <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col min-h-[180px] max-h-[260px] overflow-hidden text-left shadow-inner">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1.5 mb-2 flex items-center gap-1 text-left">
                    <span>📖</span> JOURNEY CHRONICLE
                  </h4>
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 font-mono text-[10.5px] leading-relaxed scroll-smooth text-left">
                    {gameState.caravanTravel.stepsHistory.map((stepMsg, i) => (
                      <div 
                        key={i} 
                        className={`p-2 rounded-lg text-left ${
                          stepMsg.includes('🚨') 
                            ? 'bg-red-950/30 border border-red-500/20 text-red-300' 
                            : stepMsg.includes('🎲') 
                              ? 'bg-amber-950/30 border border-amber-500/20 text-amber-300 font-bold' 
                              : stepMsg.includes('🏆') 
                                ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 font-bold' 
                                : 'bg-slate-900/40 border border-slate-850 text-slate-300'
                        }`}
                      >
                        {stepMsg}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Wilderness Encounter Panel */}
                <div className="flex-grow flex flex-col">
                  {gameState.caravanTravel.currentEncounter ? (
                    <div className={`p-4 border rounded-xl flex flex-col gap-3 text-left transition-all shadow-lg ${
                      gameState.caravanTravel.currentEncounter.resolved 
                        ? 'bg-slate-950/40 border-slate-800' 
                        : 'bg-red-950/10 border-red-500/30 ring-2 ring-red-500/5'
                    }`}>
                      <div className="flex justify-between items-center border-b border-slate-850 pb-1.5 text-left">
                        <div className="flex items-center gap-1.5 text-left">
                          <span className="animate-pulse">🚨</span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 text-left">
                            {gameState.caravanTravel.currentEncounter.title}
                          </h4>
                        </div>
                        {gameState.caravanTravel.currentEncounter.resolved && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                            RESOLVED
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans text-left">
                        {gameState.caravanTravel.currentEncounter.desc}
                      </p>

                      {/* Display outcome if resolved, else option buttons */}
                      {gameState.caravanTravel.currentEncounter.resolved ? (
                        <div className="mt-2 p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-emerald-300 leading-normal text-left">
                          <div className="font-bold text-slate-400 uppercase mb-1 flex items-center gap-1 text-left">
                            <span>🎲</span> RESOLVED ENCOUNTER RESULT:
                          </div>
                          {gameState.caravanTravel.currentEncounter.resultLog}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 mt-2">
                          {gameState.caravanTravel.currentEncounter.options.map((option, oIdx) => {
                            const hasGold = option.costGold ? gameState.playerStats.gold >= option.costGold : true;
                            let hasItems = true;
                            if (option.costItems) {
                              option.costItems.forEach(itemCost => {
                                const cnt = gameState.inventoryMaterials[itemCost.id] || 0;
                                if (cnt < itemCost.count) hasItems = false;
                              });
                            }

                            const isAffordable = hasGold && hasItems;

                            return (
                              <button
                                key={oIdx}
                                disabled={!isAffordable}
                                onClick={() => handleResolveCaravanEncounterOption(option.id)}
                                className={`w-full py-2 px-3 text-left text-xs font-bold rounded-lg transition-all border flex flex-col gap-1 ${
                                  isAffordable 
                                    ? 'bg-slate-950 hover:bg-slate-850 hover:border-blue-500/50 border-slate-800 text-slate-200 cursor-pointer' 
                                    : 'bg-slate-950/50 border-slate-900 text-slate-500 opacity-60 cursor-not-allowed'
                                }`}
                              >
                                <span className="font-sans text-left">{option.text}</span>
                                {option.statCheck && (
                                  <span className="text-[9px] font-mono text-blue-400 font-semibold uppercase text-left">
                                    Your {option.statCheck.toUpperCase()}: {getEffectiveAttribute(gameState, option.statCheck)} (+{Math.floor(((getEffectiveAttribute(gameState, option.statCheck)) - 10) / 2)} modifier)
                                  </span>
                                )}
                                {option.costItems && (
                                  <span className="text-[9px] font-mono text-red-400 font-semibold flex items-center gap-1.5 text-left">
                                    <span>⚠️ Cost:</span>
                                    {option.costItems.map((ic, iIdx) => {
                                      const have = gameState.inventoryMaterials[ic.id] || 0;
                                      return (
                                        <span key={iIdx} className={have >= ic.count ? 'text-slate-400' : 'text-red-500 font-bold'}>
                                          {ic.count}x {ic.label} (You have: {have})
                                        </span>
                                      );
                                    })}
                                  </span>
                                )}
                                {option.costGold && (
                                  <span className={`text-[9px] font-mono font-semibold text-left ${gameState.playerStats.gold >= option.costGold ? 'text-amber-400' : 'text-red-500 font-bold'}`}>
                                    ⚠️ Cost: {option.costGold} Gold (You have: {gameState.playerStats.gold}g)
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col justify-center items-center border border-dashed border-slate-800 rounded-xl p-5 bg-slate-950/20">
                      <span className="text-3xl animate-pulse">🛣️</span>
                      <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mt-2">Wilderness is Calm</h4>
                      <p className="text-[10px] text-slate-500 text-center mt-1 max-w-[280px]">
                        The carriage draft horses trot along a smooth pathway. Ready the next stage of the voyage!
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Bottom Action bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-end items-center gap-3">
              {gameState.caravanTravel.currentEncounter && !gameState.caravanTravel.currentEncounter.resolved ? (
                <div className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 animate-pulse">
                  <span>⚠️</span> MUST RESOLVE THE WILDERNESS ENCOUNTER FIRST!
                </div>
              ) : gameState.caravanTravel.currentEncounter && gameState.caravanTravel.currentEncounter.resolved ? (
                <button
                  onClick={() => setGameState(prev => {
                    const travel = prev.caravanTravel;
                    if (!travel) return prev;
                    return {
                      ...prev,
                      caravanTravel: {
                        ...travel,
                        currentEncounter: null
                      }
                    };
                  })}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 hover:scale-[1.01] border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all shadow cursor-pointer text-center"
                >
                  Clear Path & Roll Onward ➔
                </button>
              ) : gameState.caravanTravel.currentStep < gameState.caravanTravel.totalSteps ? (
                <button
                  onClick={handleAdvanceCaravanTravel}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] text-slate-50 font-black text-xs rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ring-2 ring-blue-500/20 text-center"
                >
                  <span>Proceed Onward (Step {gameState.caravanTravel.currentStep + 1} of {gameState.caravanTravel.totalSteps}) ➔</span>
                </button>
              ) : (
                <button
                  onClick={handleCompleteCaravanTravel}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] text-slate-50 font-black text-xs rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ring-2 ring-emerald-500/20 animate-pulse text-center"
                >
                  <span>🎉 Arrive in {gameState.caravanTravel.destName} & Collect Reward! ➔</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
