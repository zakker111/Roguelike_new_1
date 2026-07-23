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
}

export enum TrapType {
  Spikes = 'Spikes',       // Melee damage
  FireVent = 'FireVent',   // Heavy damage, activates periodically
  PoisonGas = 'PoisonGas', // Applies Poison over time
}

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
  biome: 'forest' | 'desert' | 'tundra' | 'swamp';
  weather: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard';
  secondFloorMap?: TileType[][];
  secondFloorDiscovered?: boolean[][];
  secondFloorVisible?: boolean[][];
  pois?: {
    id: string;
    x: number;
    y: number;
    name: string;
    type: 'monolith' | 'shrine' | 'hearth' | 'sunken_keep' | 'fossil';
    description: string;
    historySnippet: string;
    chapterId: string;
    isInteracted: boolean;
    char: string;
    color: string;
  }[];
  watchtower?: WatchtowerState;
}

export interface DungeonLevelState {
  depth: number;
  chunkX: number; // overworld origin x
  chunkY: number; // overworld origin y
  map: TileType[][];
  discovered: boolean[][];
  visible: boolean[][];
  enemies: Enemy[];
  traps: Trap[];
  chests: Chest[];
  lootPiles: LootPile[];
  corpses: Corpse[];
  bloodSplatters: BloodSplatter[];
  props: DungeonProp[];
}
