/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generic combat participant interface operating purely on numeric attributes
 */
export interface Combatant {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  critChance?: number; // 0.0 - 1.0
  critMultiplier?: number; // default 1.5
  accuracy?: number; // 0.0 - 1.0, default 1.0
  dodgeChance?: number; // 0.0 - 1.0, default 0.0
  resistances?: Record<string, number>; // e.g. { fire: 0.2, physical: 0.1 }
  vulnerabilities?: Record<string, number>; // e.g. { ice: 0.5 }
}

/**
 * Attack parameters provided by weapon, ability, or unarmed strike
 */
export interface AttackInput {
  baseDamage?: number;
  damageType?: string; // 'physical', 'fire', 'frost', etc.
  bonusDamage?: number;
  critBonus?: number;
  armorPenetration?: number; // absolute armor ignored
  armorPenetrationPercent?: number; // fractional armor ignored (0.0 - 1.0)
  cannotDodge?: boolean;
  guaranteedCrit?: boolean;
}

/**
 * Result of a resolved combat attack calculation
 */
export interface CombatResult {
  hit: boolean;
  isDodged: boolean;
  isCritical: boolean;
  rawDamage: number;
  mitigatedDamage: number;
  finalDamage: number;
  overkill: number;
  defenderDied: boolean;
  remainingHp: number;
  logSummary: string;
}

/**
 * Configurable global formula parameters for the combat engine
 */
export interface CombatFormulaConfig {
  minDamage: number; // default 1
  defenseDivisor?: number; // if using ratio-based armor mitigation
  randomVariance?: number; // e.g. 0.1 for +/- 10% damage roll
  defaultCritMultiplier?: number; // default 1.5
}
