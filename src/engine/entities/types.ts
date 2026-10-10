/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyAffix, CombatArchetype, EnemyState } from '../../types/entities';
import { ActiveEffect } from '../effects/types';

/**
 * Standard AI Behavioral Archetype / Strategy role
 */
export type AIRole = 
  | 'melee'
  | 'ranged'
  | 'flanking'
  | 'skirmisher_kiting'
  | 'support_healer'
  | 'support_buffer'
  | 'tank'
  | 'ambusher'
  | 'passive'
  | 'coward_flee'
  | 'boss';

/**
 * Universal classification of entity kinds supported across the roguelike engine
 */
export type EntityKind =
  | 'player'
  | 'enemy'
  | 'npc'
  | 'animal'
  | 'summon'
  | 'trap'
  | 'projectile'
  | 'item'
  | 'interactable';

/**
 * High-level entity behavioral stance towards player and others
 */
export type EntityDisposition = 'friendly' | 'neutral' | 'hostile' | 'unaligned';

/**
 * Base generic entity interface from which all runtime entities derive
 */
export interface BaseEntity {
  /** Unique entity instance identifier */
  id: string;
  /** Primary entity taxonomy category */
  kind: EntityKind;
  /** Display name of the entity */
  name: string;
  /** Grid X position */
  x: number;
  /** Grid Y position */
  y: number;
  /** Optional floor/depth/layer level (default: 0) */
  z?: number;
  /** ASCII glyph or Unicode character */
  char: string;
  /** Foreground hex color or styling token */
  color: string;
  /** Optional 2D sprite sheet atlas frame key */
  spriteKey?: string;
  /** Searchable classification tags (e.g. ['undead', 'flammable', 'stealth']) */
  tags: string[];
  /** Faction membership (e.g. 'player', 'syndicate', 'wildlife', 'neutral') */
  faction?: string;
  /** High-level disposition */
  disposition?: EntityDisposition;
  /** Does this entity impede passage / block walking path */
  isBlocking: boolean;
  /** Can an actor interact with / examine / bump this entity */
  isInteractable: boolean;
  /** Is this entity living, active and non-destroyed */
  isAlive: boolean;
  /** Flagged for removal from the simulation */
  destroyed?: boolean;
  /** Simulation turn on which entity was created */
  createdAtTurn?: number;
  /** Arbitrary extensible data payload for custom engine modules */
  data?: Record<string, any>;
}

/**
 * Common combat and living attributes for creatures, players, animals, and summons
 */
export interface LivingEntity extends BaseEntity {
  hp: number;
  maxHp: number;
  mp?: number;
  maxMp?: number;
  atk: number;
  def: number;
  speed: number;
  level: number;
  activeEffects?: ActiveEffect[];
  abilities?: string[];
  aiRole?: AIRole;
  isStunned?: boolean;
  isFrozen?: boolean;
}

/**
 * Player entity representation
 */
export interface PlayerEntity extends LivingEntity {
  kind: 'player';
  gold: number;
  xp: number;
  turnsPlayed: number;
  inventory?: any[];
  equipment?: Record<string, any>;
}

/**
 * Hostile or rival enemy entity
 */
export interface EnemyEntity extends LivingEntity {
  kind: 'enemy';
  definitionId?: string;
  isElite?: boolean;
  isBoss?: boolean;
  eliteEffect?: string;
  dropMaterials?: string[];
  dropCatalysts?: string[];
  xpReward?: number;
  goldReward?: number;
  state?: EnemyState;
}

/**
 * Non-player character (merchant, quest giver, villager)
 */
export interface NpcEntity extends LivingEntity {
  kind: 'npc';
  role: string;
  dialogue: string[];
  homeX?: number;
  homeY?: number;
  workX?: number;
  workY?: number;
  scheduleState?: 'home' | 'work' | 'leisure' | 'campfire' | string;
}

/**
 * Neutral or huntable fauna / animal entity
 */
export interface AnimalEntity extends LivingEntity {
  kind: 'animal';
  diet?: 'herbivore' | 'carnivore' | 'omnivore';
  isPrey?: boolean;
  isHostile?: boolean;
  fleeHealthThreshold?: number;
}

/**
 * Conjured minion or companion summon with finite turn lifespan
 */
export interface SummonEntity extends LivingEntity {
  kind: 'summon';
  ownerId: string;
  ownerName: string;
  lifespanTurns: number;
  maxLifespanTurns: number;
}

/**
 * Ground trap or hazard triggering on step or interaction
 */
export interface TrapEntity extends BaseEntity {
  kind: 'trap';
  trapType: string;
  damage: number;
  inflictEffectId?: string;
  isTriggered: boolean;
  isRevealed: boolean;
  triggerOnStep: boolean;
  disarmDifficulty: number;
  chargesRemaining?: number;
}

/**
 * Flying ballistic projectile traversing the grid across turns
 */
export interface ProjectileEntity extends BaseEntity {
  kind: 'projectile';
  sourceEntityId: string;
  sourceEntityName?: string;
  targetX: number;
  targetY: number;
  damage: number;
  element?: string;
  speed: number;
  rangeRemaining: number;
  piercing?: boolean;
  inflictEffectId?: string;
}

/**
 * Physical ground item or loot drop entity
 */
export interface ItemEntity extends BaseEntity {
  kind: 'item';
  itemId: string;
  quantity: number;
  itemType?: string;
  rarity?: string;
  value?: number;
}

/**
 * World interactable (chests, shrines, doors, levers, campfires)
 */
export interface InteractableEntity extends BaseEntity {
  kind: 'interactable';
  interactType: 'chest' | 'shrine' | 'door' | 'lever' | 'campfire' | 'harvest' | 'custom';
  isUsed: boolean;
  interactionPrompt?: string;
  cooldownTurns?: number;
  turnsUntilReset?: number;
  requiredItem?: string;
  state?: string;
}

/**
 * Discriminated union of all concrete engine entity variants
 */
export type GenericEntity =
  | PlayerEntity
  | EnemyEntity
  | NpcEntity
  | AnimalEntity
  | SummonEntity
  | TrapEntity
  | ProjectileEntity
  | ItemEntity
  | InteractableEntity
  | BaseEntity;

/**
 * Blueprint / definition template for registering non-enemy entities into registries
 */
export interface EntityDefinition {
  id: string;
  kind: EntityKind;
  name: string;
  char: string;
  color: string;
  spriteKey?: string;
  tags?: string[];
  faction?: string;
  isBlocking?: boolean;
  isInteractable?: boolean;
  baseHp?: number;
  baseAtk?: number;
  baseDef?: number;
  speed?: number;
  level?: number;
  abilities?: string[];
  aiRole?: AIRole;
  defaultData?: Record<string, any>;
}

/**
 * Context provided when advancing a turn across all active entities
 */
export interface EntityTickContext {
  currentTurn: number;
  playerPos?: { x: number; y: number; z?: number };
  log?: (message: string) => void;
}

/**
 * Diagnostic and action summary returned after a full entity tick
 */
export interface EntityTickReport {
  turn: number;
  processedEntitiesCount: number;
  expiredSummonIds: string[];
  triggeredTrapIds: string[];
  activeProjectileSteps: { projectileId: string; newX: number; newY: number; hitEntityId?: string }[];
  deadEntityIds: string[];
  logs: string[];
}

/**
 * Data-driven definition for any enemy in the engine.
 * Decoupled from theme (can represent a fantasy Goblin, a sci-fi Alien Drone, or a cyberpunk Android).
 */
export interface EnemyDefinition {
  /** Unique identifier key (e.g. 'Goblin', 'AlienDrone', 'CaveRat') */
  id: string;
  /** Display name shown to the player */
  name: string;
  /** Base hit points */
  baseHp: number;
  /** Base physical or kinetic attack damage */
  baseAtk: number;
  /** Base defense / armor mitigation */
  baseDef: number;
  /** Strike or attack range in grid tiles (default: 1) */
  range: number;
  /** Turn action delay multiplier (1.0 = normal, 0.7 = fast, 1.5 = slow) */
  speed: number;
  /** Visual ASCII / Unicode glyph character */
  char?: string;
  /** Foreground hex color */
  color?: string;
  /** Optional sprite atlas frame key */
  spriteKey?: string;
  /** Behavioral AI role */
  aiRole?: AIRole;
  /** List of capability / ability keys this enemy can cast or activate */
  abilities?: string[];
  /** Categorical tags for generic interactions (e.g. ['beast', 'undead', 'cybernetic', 'flammable']) */
  tags?: string[];
  /** Associated faction identifier */
  faction?: string;
  /** Material drop identifiers on death */
  dropMaterials?: string[];
  /** Catalyst / energy crystal drops on death */
  dropCatalysts?: string[];
  /** Default combat archetype */
  archetype?: CombatArchetype;
  /** Possible affixes when spawned as champion / elite */
  possibleAffixes?: EnemyAffix[];
  /** Is this entity passive or harmless prey */
  isPrey?: boolean;
}

/**
 * Options when instantiating a runtime Enemy from an EnemyDefinition.
 */
export interface SpawnEnemyOptions {
  id?: string;
  x: number;
  y: number;
  z?: number;
  level?: number;
  isElite?: boolean;
  isBoss?: boolean;
  eliteEffect?: string;
  faction?: string;
  chaosTier?: number;
  globalThreatFactor?: number;
  customName?: string;
}

/**
 * Entry in a weighted spawn table
 */
export interface SpawnTableEntry {
  enemyId: string;
  weight: number;
  minDepth?: number;
  maxDepth?: number;
  minThreatTier?: number;
}

/**
 * Data-driven Spawn Table for any area, dungeon tier, or biome.
 */
export interface SpawnTable {
  id: string;
  name: string;
  entries: SpawnTableEntry[];
}
