/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supported ability targeting types
 */
export type AbilityTargetType =
  | 'self'
  | 'single_enemy'
  | 'single_ally'
  | 'area_tile'
  | 'direction'
  | 'global';

/**
 * Core category of an ability
 */
export type AbilityType =
  | 'attack'
  | 'heal'
  | 'dash'
  | 'teleport'
  | 'summon'
  | 'buff'
  | 'debuff'
  | 'explode';

/**
 * Universal targeting context provided during ability execution
 */
export interface AbilityExecutionContext {
  /** The source entity invoking the ability */
  source: {
    id: string;
    name: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    mp?: number;
    atk?: number;
    def?: number;
    isPlayer?: boolean;
    isFollower?: boolean;
    isHostile?: boolean;
    faction?: string;
  };
  /** Optional target entity (if single target) */
  target?: {
    id: string;
    name: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    mp?: number;
    atk?: number;
    def?: number;
    isPlayer?: boolean;
    isFollower?: boolean;
    isHostile?: boolean;
    faction?: string;
  };
  /** Target grid coordinates (e.g. for ground AOE, dash, teleport) */
  targetPos?: { x: number; y: number };
  /** Grid environment dimensions & wall / blocking checks */
  mapContext?: {
    isBlocked?: (x: number, y: number) => boolean;
    hasLineOfSight?: (x0: number, y0: number, x1: number, y1: number) => boolean;
  };
}

/**
 * Result returned after an ability is executed
 */
export interface AbilityExecutionResult {
  success: boolean;
  abilityId: string;
  message?: string;
  damageDealt?: number;
  healingDone?: number;
  effectApplied?: string;
  targetsHitCount?: number;
  newPosition?: { x: number; y: number };
  summonedIds?: string[];
  vfx?: {
    type: 'projectile' | 'burst' | 'slash' | 'aoe_circle' | 'teleport_flash';
    color?: string;
    startX?: number;
    startY?: number;
    targetX?: number;
    targetY?: number;
    radius?: number;
  };
}

/**
 * Data-driven Definition for any Ability in the engine.
 * Theme-agnostic: Can represent a fantasy fireball, a sci-fi plasma mortar, or a nanite heal surge.
 */
export interface AbilityDefinition {
  /** Unique ability identifier (e.g. 'fireball', 'dash', 'teleport', 'poison_dart') */
  id: string;
  /** Display name of the ability */
  name: string;
  /** Categorical ability type */
  type: AbilityType;
  /** Targeting mechanism */
  targetType: AbilityTargetType;
  /** Range in grid tiles */
  range: number;
  /** Radius for area-of-effect abilities (0 = single tile) */
  radius?: number;
  /** Turn cooldown between activations */
  cooldown: number;
  /** Resource cost (Mana / Energy / Stamina) */
  manaCost?: number;
  /** Base damage or power */
  basePower?: number;
  /** Damage scaling multiplier (e.g. 1.25 for 125% attack) */
  damageMultiplier?: number;
  /** Status effect ID to apply upon hit (e.g. 'burning', 'poison', 'frozen', 'stunned') */
  effectId?: string;
  /** Duration of applied status effect in turns */
  effectDuration?: number;
  /** Elemental type if applicable ('Fire' | 'Frost' | 'Lightning' | 'Shadow' | 'Physical' | 'Holy') */
  element?: string;
  /** Entity ID to summon if type is 'summon' */
  summonEntityId?: string;
  /** Count of summoned entities */
  summonCount?: number;
  /** Sound effect trigger identifier */
  soundEffect?: string;
  /** UI Icon (emoji or sprite key) */
  icon?: string;
  /** Visual theme color (hex) */
  color?: string;
  /** Human-readable description */
  description?: string;
  /** Custom handler override (optional hook for advanced procedural scripts) */
  customExecute?: (ctx: AbilityExecutionContext) => AbilityExecutionResult;
}

/**
 * Runtime ability state tracked per entity (e.g. active cooldowns)
 */
export interface EntityAbilityState {
  abilityId: string;
  currentCooldown: number;
}
