import { Dispatch, SetStateAction } from 'react';
import {
  Enemy,
  GameState,
  PlayerEffect,
  EquipmentItem,
  CaravanTravelState,
  PlayerStats,
  TileType,
  ElementalTile
} from '../../types';

export type FoodBuff = NonNullable<GameState['activeFoodBuff']>;
export type DefeatedEnemyCounts = Record<string, number>;

export interface UseEnemyAIParams {
  gameStateRef?: any;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage?: (text: string, type?: string) => void;
  playSound: (soundName: string, options?: any) => void;
  hasEquippedTrait: (gs: GameState, traitKey: string) => boolean;
}

export interface TurnEnvironmentResult {
  playerHp: number;
  playerMp: number;
  updatedStats: PlayerStats;
  updatedEffects: PlayerEffect[];
  nextFoodBuff: FoodBuff | undefined;
  activeScars: any[];
  nextWeather: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard' | 'ashfall' | 'tidal_surge';
  nextTimeVal: number;
  nextRep: number;
  nextGuardsHostile: boolean;
  nextRestockTime: number;
  merchantGoldUpdate: Record<string, number>;
  merchantStockUpdate: Record<string, any>;
  nextCorpses: any[];
  nextSplatters: any[];
  gmStateUpdates: Partial<GameState>;
  staticLogs: string[];
  nextEnemies: Enemy[];
  nextElementalFields?: ElementalTile[];
  mapModifications?: { x: number; y: number; newTile: TileType }[];
}

export interface HostileCombatResult {
  playerHp: number;
  incomingPlayerDamage: number;
  incomingPlayerHits: number;
  hadPlayerCrit: boolean;
  hadPlayerBrace: boolean;
  lastAttackerX?: number;
  lastAttackerY?: number;
  nextArmor?: EquipmentItem;
  nextHelmet?: EquipmentItem;
  nextGloves?: EquipmentItem;
  nextBoots?: EquipmentItem;
  nextShield?: EquipmentItem;
  activeScars: any[];
  updatedEffects: PlayerEffect[];
  nextCaravanTravel?: CaravanTravelState;
  nextDefeatedCounts: DefeatedEnemyCounts;
  staticLogs: string[];
}

export interface FollowerAIParams {
  e: Enemy;
  i: number;
  px: number;
  py: number;
  prev: GameState;
  nextGuardsHostile: boolean;
  nextEnemies: Enemy[];
  updatedEnemiesList: Enemy[];
  updatedStats: PlayerStats;
  nextDefeatedCounts: DefeatedEnemyCounts;
  staticLogs: string[];
  playSound: (soundName: string, options?: any) => void;
  applyDamageToEnemy: (target: Enemy, dmg: number) => boolean;
}

export interface FollowerActionResult {
  e: Enemy;
  nextDefeatedCounts: DefeatedEnemyCounts;
}

export interface TownGuardAIParams {
  e: Enemy;
  i: number;
  px: number;
  py: number;
  prev: GameState;
  nextEnemies: Enemy[];
  updatedEnemiesList: Enemy[];
  nextDefeatedCounts: DefeatedEnemyCounts;
  staticLogs: string[];
  playSound: (soundName: string, options?: any) => void;
  applyDamageToEnemy: (target: Enemy, dmg: number) => boolean;
}

export interface TownGuardActionResult {
  e: Enemy;
  nextDefeatedCounts: DefeatedEnemyCounts;
}

