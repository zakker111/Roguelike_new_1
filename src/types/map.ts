/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TileType {
  Wall = 'Wall',
  Floor = 'Floor',
  Door = 'Door',
  StairsDown = 'StairsDown',
  StairsUp = 'StairsUp',
  Empty = 'Empty',
  Grass = 'Grass',
  Tree = 'Tree',
  Water = 'Water',
  Path = 'Path',
  DungeonEntrance = 'DungeonEntrance',
  TownGate = 'TownGate',
  Table = 'Table',
  Chair = 'Chair',
  Bed = 'Bed',
  Campfire = 'Campfire',
  Anvil = 'Anvil',
  Fireplace = 'Fireplace',
  Window = 'Window',
  Bush = 'Bush',
  Sign = 'Sign',
  Torch = 'Torch',
  PineTree = 'PineTree',
  BirchTree = 'BirchTree',
  CopperVein = 'CopperVein',
  IronVein = 'IronVein',
  WatchtowerWall = 'WatchtowerWall',
  WatchtowerSlit = 'WatchtowerSlit',
  WatchtowerDeck = 'WatchtowerDeck',
  WatchtowerFlag = 'WatchtowerFlag',
  WatchtowerBarricade = 'WatchtowerBarricade',
  TreeStump = 'TreeStump',
  Bedroll = 'Bedroll',
  FieldTent = 'FieldTent',
  Ice = 'Ice',
  Ash = 'Ash',
}

export enum TrapType {
  Spikes = 'Spikes',             // Melee physical piercing damage
  FireVent = 'FireVent',         // Heavy fire damage, activates periodically
  PoisonGas = 'PoisonGas',       // Applies Poison over time
  Geyser = 'Geyser',             // Sunken ruins high-pressure water burst (knockback + water damage)
  MagmaEruption = 'MagmaEruption', // Volcanic caldera searing lava eruption (burn DOT + explosive fire damage)
  FrostbiteVent = 'FrostbiteVent', // Glacial ice caverns cryogenic freeze (chill slow + frost damage)
  FallingIcicle = 'FallingIcicle', // Glacial ice caverns falling ceiling spike (crushing damage)
  SulfurVent = 'SulfurVent',     // Volcanic caldera toxic sulfur fumes (weakness debuff + poison)
}

export type DungeonArchetype = 'standard' | 'crypt' | 'sunken_ruins' | 'volcanic_caldera' | 'glacial_caverns';
export type BiomeType = 'forest' | 'desert' | 'tundra' | 'swamp' | 'town' | 'coral_reef' | 'volcanic' | 'glacial' | 'mountain';

export interface Trap {
  id: string;
  x: number;
  y: number;
  type: TrapType;
  isActive: boolean; // Relevant for FireVent
  triggered: boolean;
  hidden?: boolean;
  detected?: boolean;
}

export interface WatchtowerState {
  id: string; // e.g. "watchtower_{chunkX}_{chunkY}"
  chunkX: number;
  chunkY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  controller: 'syndicate' | 'vanguard' | 'neutral' | 'bandits';
  isClaimed: boolean;
  claimPercent: number; // 0 to 100
  garrisonDefeated: boolean;
  taxGoldAccumulated: number;
  lastTaxTimeMinutes: number; // game minutes tracking
  siegeState?: {
    isUnderSiege: boolean;
    attacker: 'syndicate' | 'vanguard' | 'bandits';
    defender: 'syndicate' | 'vanguard' | 'neutral' | 'bandits';
    siegeTimerSeconds: number; // counts down to zero, then attacker wins if not cleared by player
    maxTimerSeconds: number;
  };
}

export interface DungeonProp {
  id: string;
  x: number;
  y: number;
  char: string;
  name: string;
  color: string;
  description: string;
  type?: string;
  actionLabel?: string;
  interaction?: string;
  isInteracted?: boolean;
}

// Forward reference interfaces from entities & items needed in map/chunk
import type { Enemy, NPC, Corpse, BloodSplatter } from './entities';
import type { Chest, LootPile } from './items';

export interface OverworldChunk {
  chunkX: number;
  chunkY: number;
  map: TileType[][];
  discovered: boolean[][];
  visible: boolean[][];
  enemies: Enemy[];
  traps: Trap[];
  chests: Chest[];
  npcs: NPC[];
  lootPiles: LootPile[];
  dungeons: { x: number; y: number; id: string; targetDepth: number }[];
  towns: { x: number; y: number; name: string }[];
  biome: BiomeType;
  weather: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard' | 'ashfall' | 'tidal_surge';
  secondFloorMap?: TileType[][];
  secondFloorDiscovered?: boolean[][];
  secondFloorVisible?: boolean[][];
  pois?: {
    id: string;
    x: number;
    y: number;
    chunkX?: number;
    chunkY?: number;
    name: string;
    type: 'monolith' | 'shrine' | 'hearth' | 'sunken_keep' | 'fossil' | string;
    description: string;
    historySnippet: string;
    chapterId: string;
    isInteracted: boolean;
    isAttunedWaystone?: boolean;
    guardianDefeated?: boolean;
    guardianSpawned?: boolean;
    char: string;
    color: string;
  }[];
  watchtower?: WatchtowerState;
  props?: DungeonProp[];
  corpses?: Corpse[];
  bloodSplatters?: BloodSplatter[];
  visitedTiles?: { [coordString: string]: boolean };
  compressedData?: {
    compressedMap: string;
    compressedDiscovered?: string;
    compressedSecondFloorMap?: string;
    compressedSecondFloorDiscovered?: string;
  };
  isCompressed?: boolean;
}

export interface DungeonLevelState {
  depth: number;
  chunkX: number; // overworld origin x
  chunkY: number; // overworld origin y
  map: TileType[][];
  discovered: boolean[][];
  visible?: boolean[][];
  enemies: Enemy[];
  traps: Trap[];
  chests: Chest[];
  lootPiles: LootPile[];
  corpses: Corpse[];
  bloodSplatters: BloodSplatter[];
  props: DungeonProp[];
}

export const LEVEL_WIDTH = 64;
export const LEVEL_HEIGHT = 40;
