/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TileType, OverworldChunk, DungeonLevelState, DungeonProp, Trap } from './map';
import type { CraftedWeapon, EquipmentItem, LootPile, Chest } from './items';
import type { PlayerStats, Enemy, NPC, Follower, Corpse, BloodSplatter } from './entities';

export interface GameLogMessage {
  id: string;
  text: string;
  type: 'combat' | 'loot' | 'trap' | 'craft' | 'system' | 'info' | 'danger';
  timestamp: string;
}

export interface Quest {
  id: string;
  townName: string;
  type: 'gather' | 'encounter';
  title: string;
  description: string;
  targetItem?: string; // e.g. 'mat_iron' or 'plank' or 'berry'
  targetCount?: number;
  targetX?: number; // overworld coordinate
  targetY?: number;
  targetChunkX?: number;
  targetChunkY?: number;
  rewardGold: number;
  status: 'available' | 'active' | 'completed' | 'turned_in' | 'failed';
}

export interface FactionTerritory {
  id: string;
  name: string;
  controller: 'syndicate' | 'vanguard' | 'neutral' | 'outlaw';
  controlPercent: number;
  contested: boolean;
  bonusDescription: string;
  taxGoldAccumulated: number;
  taxMaterialIdAccumulated: string;
  taxMaterialCountAccumulated?: number;
}

export interface FactionWarTreasury {
  syndicateGold: number;
  vanguardGold: number;
  playerContributionSyndicate: number;
  playerContributionVanguard: number;
  activeTactics: string[];
}

export interface CaravanEncounterOption {
  id: string;
  text: string;
  statCheck?: 'str' | 'dex' | 'int' | 'lck' | 'cha';
  difficulty?: number;
  costGold?: number;
  costItems?: { id: string; count: number; label: string }[];
}

export interface CaravanEncounter {
  id: string;
  type: 'bandit_ambush' | 'beast_attack' | 'roadblock' | 'obstacle' | 'pilgrim' | 'wheel_break' | 'mana_storm' | 'bridge_collapse' | 'mysterious_merchant' | 'swamp_gas';
  title: string;
  desc: string;
  options: CaravanEncounterOption[];
  rolledValue?: number;
  selectedOptionId?: string;
  resultLog?: string;
  resolved: boolean;
}

export interface CaravanTravelState {
  active: boolean;
  originX: number;
  originY: number;
  destX: number;
  destY: number;
  destName: string;
  totalSteps: number;
  currentStep: number;
  stepsHistory: string[];
  rewardGold: number;
  currentEncounter: CaravanEncounter | null;
}

export interface GameState {
  playerX: number;
  playerY: number;
  levelWidth: number;
  levelHeight: number;
  map: TileType[][];
  discovered: boolean[][]; // Fog of war memory
  visible: boolean[][];    // Field of View active
  enemies: Enemy[];
  traps: Trap[];
  chests: Chest[];
  logs: GameLogMessage[];
  playerStats: PlayerStats;
  currentWeapon: CraftedWeapon | null;
  inventoryMaterials: { [materialId: string]: number };
  inventoryCatalysts: { [catalystId: string]: number };
  gameDurationHours: number; // for difficulty scaling

  // Expansion Fields
  isOverworld: boolean;
  overworldZ?: number; // 0 for ground, 1 for second floor
  currentChunkX: number;
  currentChunkY: number;
  overworldChunks: { [coordString: string]: OverworldChunk };
  equipmentInventory: EquipmentItem[];
  equippedArmor: EquipmentItem | null;
  equippedHelmet: EquipmentItem | null;
  equippedGloves: EquipmentItem | null;
  equippedBoots: EquipmentItem | null;
  equippedShield: EquipmentItem | null;
  equippedAmulet: EquipmentItem | null;
  lootPiles: LootPile[];
  visitedTiles: { [coordString: string]: boolean }; // For minimap tracking. Key: "{x},{y},{chunkX},{chunkY}" or "{x},{y},dungeon-{depth}"
  gameTime: number; // minutes from 0 to 1439 (representing 24 hours starting at 480 i.e., 8:00 AM)
  npcs: NPC[]; // active NPC lists
  activeTradeNpcId: string | null; // ID of NPC trading with, if any
  biome: 'forest' | 'desert' | 'tundra' | 'swamp';
  weather: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  gmAutonomousWeather?: boolean;
  gmWeatherInterval?: number;

  // Quest, Port Towns, and Followers integrations
  quests: Quest[];
  followers: Follower[];
  activeQuestBoardOpen: boolean; // overlay trigger
  activeFollowerIdForInspect: string | null; // inspect trigger
  isBraced: boolean; // Defensive brace state

  // Persisted Dungeons, Corpses, and Blood Splatters
  corpses: Corpse[];
  bloodSplatters: BloodSplatter[];
  dungeonProps: DungeonProp[];
  dungeonEntranceChunkX?: number;
  dungeonEntranceChunkY?: number;
  dungeonEntrancePlayerX?: number;
  dungeonEntrancePlayerY?: number;
  dungeonLevels: { [key: string]: DungeonLevelState };
  isArena?: boolean;
  unlockedChapters?: string[]; // Found chapter keys for history/lore mechanics
  activeHistoryBookOpen?: boolean; // Determines if the Chronicle Book overlay is open

  // Custom merchant wealth, stock, restock tracking and fishing pole durability
  fishingPoleDurability?: number;
  merchantGold?: { [npcId: string]: number };
  merchantStock?: { [npcId: string]: { [itemId: string]: number } };
  lastRestockTime?: number;
  areGuardsHostile?: boolean;
  townReputation?: number; // 0 to 100, default 100. Below 50 means hostile.
  blacksmithForgeLevel?: number; // 1, 2, or 3
  apothecaryTier?: number; // 1, 2, or 3
  purchasedRumors?: string[]; // 'cat', 'chest', 'boss'
  spawnedCats?: string[]; // Keeps track of unique legendary town cats that have spawned (e.g. 'Jekku', 'Pulla', 'Alli')
  spawnedSeppo?: boolean; // Track if the drunk wandering merchant Seppo has spawned
  // Wandering Factions & Lively Overworld Expansion
  clearedCamps?: string[]; // Keys of cleared camps, e.g. "camp_0,1"
  hasActiveCaravanLicense?: boolean; // Granted by defending caravan Tobias, gives discounts/sales boosts
  caravanAmbushState?: { [coordKey: string]: 'active' | 'success' | 'failed' }; // e.g. "2,1": "success"
  godMode?: boolean;
  isTown?: boolean;
  activeMount?: string;

  // v2.7.0: Advanced Trade Economy & Guild Houses
  guildOwned?: boolean; // Guild Headquarters purchased
  guildUpgrades?: { [upgradeId: string]: number }; // research material multipliers, companion quest speed, etc.
  guildSanctuary?: string[]; // active decorations, e.g., 'trophy_pedestal', 'warm_hearth', 'magic_crystal_ball', 'royal_banner'
  guildStash?: {
    equipment: EquipmentItem[];
    materials: { [id: string]: number };
    catalysts: { [id: string]: number };
    potions: { [id: string]: number };
  };
  safehouses?: { [chunkKey: string]: {
    purchased: boolean;
    stash: {
      equipment: EquipmentItem[];
      materials: { [id: string]: number };
      catalysts: { [id: string]: number };
      potions: { [id: string]: number };
    };
    assignedGuard?: Follower;
  } };
  faction?: 'neutral' | 'syndicate' | 'vanguard' | 'bandits';
  factionReputation?: { syndicate: number; vanguard: number; bandits: number }; // -100 to 100
  factionQuests?: Quest[];
  activeEscapeAlarm?: 'syndicate' | 'vanguard' | 'bandits' | null;
  factionTerritories?: { [id: string]: FactionTerritory };
  factionWarTreasury?: FactionWarTreasury;
  lastTaxClaimTurn?: number;
  activeCompanionQuests?: {
    followerId: string;
    questId: string;
    title: string;
    durationTurns: number;
    rewardGold: number;
    rewardXp: number;
    rewardMaterials?: { [matId: string]: number };
  }[];
  bloodMoonTurnsLeft?: number; // turns left for active Blood Moon rift
  turnsUntilBloodMoon?: number; // turns until next Blood Moon event
  activeFoodBuff?: {
    name: string;
    description: string;
    atkBonus: number;
    defBonus: number;
    critBonus: number;
    speedBonus: number;
    turnsRemaining: number;
  };
  hasTransmuter?: boolean;
  caravanTravel?: CaravanTravelState | null;
  defeatedEnemiesCount?: { [key: string]: number };
  chaosScore?: number; // 0 to 100 GM Chaos Matrix score
}

export interface MoonPhase {
  id: string;
  name: string;
  emoji: string;
  description: string;
  blessing: string;
}

export const MOON_PHASES: MoonPhase[] = [
  { id: 'new_moon', name: 'New Moon', emoji: '🌑', description: 'The sky is ink-black. Perfect for unseen movements.', blessing: 'Shadow Veil Blessing: Gain +15% Evasion, +10% Critical Strike, and moving triggers no traps!' },
  { id: 'waxing_crescent', name: 'Waxing Crescent', emoji: '🌒', description: 'A sliver of silver light begins to gleam. Speed is heightened.', blessing: 'Stardust Swiftness Blessing: Gain +1 Movement Speed in Overworld, +10 Dodge, and 15% travel time discount!' },
  { id: 'first_quarter', name: 'First Quarter', emoji: '🌓', description: 'Balanced light and shadow. Enhances both steel and magic.', blessing: 'Equinox Blessing: Gain +3 Attack Power and +2 Defense.' },
  { id: 'waxing_gibbous', name: 'Waxing Gibbous', emoji: '🌔', description: 'The moon bulges with cosmic vigor. Fortifies physical constitution.', blessing: 'Astral Aegis Blessing: Gain +15 Max HP and regenerate +1 HP per turn.' },
  { id: 'full_moon', name: 'Full Moon', emoji: '🌕', description: 'Glistening light floods the overworld. Spellcasting and miracles peak.', blessing: 'Lunar Brilliance Blessing: Spells deal +25% damage, and gain +2 MP recovery per turn.' },
  { id: 'waning_gibbous', name: 'Waning Gibbous', emoji: '🌖', description: 'The reservoir of power begins to overflow. Fortunes are enhanced.', blessing: 'Tide-Turner Blessing: Gained gold is boosted by 20%, and gain +15 Luck!' },
  { id: 'third_quarter', name: 'Third Quarter', emoji: '🌗', description: 'The waning light demands focused precision.', blessing: 'Sharpshooter Blessing: Ranged attacks and abilities gain +15% Accuracy and +10% Critical.' },
  { id: 'waning_crescent', name: 'Waning Crescent', emoji: '🌘', description: 'The fading celestial crescent triggers wild magic.', blessing: 'Chaos Spark Blessing: Gain +15% resistance to all elements, and 10% chance to duplicate crafted catalysts!' }
];

export function getMoonPhase(turns: number): MoonPhase {
  const idx = Math.floor(turns / 180) % 8; // Change phase every 180 turns
  return MOON_PHASES[idx];
}
