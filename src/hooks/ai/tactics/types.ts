/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Enemy,
  GameState,
  PlayerEffect,
  EquipmentItem,
  CaravanTravelState
} from '../../../types';
import { SpatialEntityGrid } from '../../../utils/spatial';
import { DefeatedEnemyCounts } from '../types';

export function safeDispatchEffect(detail: any) {
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    const ev = new CustomEvent('spawn-game-effect', { detail });
    window.dispatchEvent(ev);
  }
}

export function safeDispatchProjectile(detail: any) {
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    const ev = new CustomEvent('spawn-projectile', { detail });
    window.dispatchEvent(ev);
  }
}

export interface HostileAIParams {
  e: Enemy;
  i: number;
  px: number;
  py: number;
  playerHp: number;
  prev: GameState;
  nextGuardsHostile: boolean;
  nextEnemies: Enemy[];
  updatedEnemiesList: Enemy[];
  updatedStats: any;
  nextArmor?: EquipmentItem;
  nextHelmet?: EquipmentItem;
  nextGloves?: EquipmentItem;
  nextBoots?: EquipmentItem;
  nextShield?: EquipmentItem;
  activeScars: any[];
  updatedEffects: PlayerEffect[];
  nextCaravanTravel?: CaravanTravelState;
  nextDefeatedCounts: DefeatedEnemyCounts;
  incomingPlayerDamage: number;
  incomingPlayerHits: number;
  hadPlayerCrit: boolean;
  hadPlayerBrace: boolean;
  lastAttackerX?: number;
  lastAttackerY?: number;
  staticLogs: string[];
  playSound: (soundName: string, options?: any) => void;
  applyDamageToEnemy: (target: Enemy, damage: number) => boolean;
}

export interface HostileActionResult {
  e: Enemy | null;
  playerHp: number;
  nextArmor?: EquipmentItem;
  nextHelmet?: EquipmentItem;
  nextGloves?: EquipmentItem;
  nextBoots?: EquipmentItem;
  nextShield?: EquipmentItem;
  activeScars: any[];
  updatedEffects: PlayerEffect[];
  nextCaravanTravel?: CaravanTravelState;
  nextDefeatedCounts: DefeatedEnemyCounts;
  incomingPlayerDamage: number;
  incomingPlayerHits: number;
  hadPlayerCrit: boolean;
  hadPlayerBrace: boolean;
  lastAttackerX?: number;
  lastAttackerY?: number;
}

export interface AITacticContext {
  e: Enemy;
  i: number;
  px: number;
  py: number;
  playerHp: number;
  prev: GameState;
  nextGuardsHostile: boolean;
  nextEnemies: Enemy[];
  updatedEnemiesList: Enemy[];
  updatedStats: any;
  nextArmor?: EquipmentItem;
  nextHelmet?: EquipmentItem;
  nextGloves?: EquipmentItem;
  nextBoots?: EquipmentItem;
  nextShield?: EquipmentItem;
  activeScars: any[];
  updatedEffects: PlayerEffect[];
  nextCaravanTravel?: CaravanTravelState;
  nextDefeatedCounts: DefeatedEnemyCounts;
  incomingPlayerDamage: number;
  incomingPlayerHits: number;
  hadPlayerCrit: boolean;
  hadPlayerBrace: boolean;
  lastAttackerX?: number;
  lastAttackerY?: number;
  staticLogs: string[];
  playSound: (soundName: string, options?: any) => void;
  applyDamageToEnemy: (target: Enemy, damage: number) => boolean;
  // Pre-calculated spatial & perception context
  allActiveEntities: Enemy[];
  entitySpatialGrid: SpatialEntityGrid;
  isHostile: boolean;
  sameZ: boolean;
  distToPlayer: number;
  dxToPlayer: number;
  dyToPlayer: number;
  hasLOS: boolean;
  enemyRange: number;
  isWithinAttackRange: boolean;
}

export interface AITacticResult {
  handled: boolean;
  actionResult?: HostileActionResult;
}

export type AITacticStrategy = (ctx: AITacticContext) => AITacticResult | null;
