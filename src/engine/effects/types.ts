/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * High-level category of an effect
 */
export type EffectType = 'buff' | 'debuff' | 'neutral';

/**
 * Elemental or damage classification for damage-over-time effects
 */
export type EffectDamageType = 'physical' | 'fire' | 'poison' | 'ice' | 'shock' | 'holy' | 'shadow' | 'arcane';

/**
 * Behavior when applying an effect that is already active on the target
 */
export type EffectStackingBehavior =
  | 'refresh'        // Resets duration to full
  | 'stack_intensity'// Increases stack count (e.g. more damage/heal per tick) and refreshes duration
  | 'stack_duration' // Adds new duration to remaining duration
  | 'independent'    // Distinct instance tracking
  | 'ignore';        // Ignore subsequent applications while active

/**
 * Stat modifiers provided by active effects
 */
export interface EffectStatModifiers {
  atk?: number;
  def?: number;
  crit?: number;
  speed?: number; // >0 means slower (more turns needed), <0 means faster
  lck?: number;
  evasion?: number;
  maxHpBonus?: number;
  maxMpBonus?: number;
}

/**
 * Action restrictions enforced by status effects
 */
export interface EffectActionInhibition {
  preventMovement?: boolean;
  preventAttack?: boolean;
  preventAbilities?: boolean;
  preventItemUse?: boolean;
}

/**
 * Authoritative definition of an effect in the registry
 */
export interface EffectDefinition {
  id: string;
  name: string;
  type: EffectType;
  icon: string;
  color: string;
  description: string;
  defaultDuration: number;
  maxStacks?: number;
  stacking?: EffectStackingBehavior;
  damagePerTurn?: number;
  damageType?: EffectDamageType;
  healPerTurn?: number;
  shieldAmount?: number;
  statModifiers?: EffectStatModifiers;
  inhibitions?: EffectActionInhibition;
  inhibitsActions?: boolean;
  tags?: string[];
  onApplyLog?: (targetName: string) => string;
  onTickLog?: (targetName: string, value: number) => string;
  onExpireLog?: (targetName: string) => string;
}

/**
 * Runtime state of an active effect currently applied to an entity
 */
export interface ActiveEffect {
  id: string;
  name: string;
  type: EffectType;
  icon: string;
  color: string;
  description: string;
  duration: number; // Remaining turns
  maxDuration: number;
  stacks: number;
  maxStacks: number;
  damagePerTurn?: number;
  damageType?: EffectDamageType;
  healPerTurn?: number;
  shieldCurrent?: number;
  shieldMax?: number;
  statModifiers?: EffectStatModifiers;
  inhibitions?: EffectActionInhibition;
  sourceEntityId?: string;
  sourceEntityName?: string;
}

/**
 * Minimal entity contract for targets receiving effects.
 * Universally compatible with Player, Enemy, Follower, NPC, or generic Entity.
 */
export interface EffectTarget {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  activeEffects?: ActiveEffect[];
  [key: string]: any;
}

/**
 * Parameters for applying an effect
 */
export interface ApplyEffectOptions {
  duration?: number;
  stacks?: number;
  damagePerTurn?: number;
  healPerTurn?: number;
  shieldAmount?: number;
  statModifiers?: EffectStatModifiers;
  sourceEntityId?: string;
  sourceEntityName?: string;
}

/**
 * Summary result after processing an effect turn tick on an entity
 */
export interface EffectTickResult {
  entityId: string;
  entityName: string;
  damageTaken: number;
  healingReceived: number;
  shieldDepleted: number;
  expiredEffectIds: string[];
  logs: string[];
  isEntityDead: boolean;
  preventedAction?: boolean;
}
