/**
 * Domain types and payload definitions for the Roguelike Unified Event Bus.
 */

export type EventPriority = 'FIRST' | 'HIGH' | 'NORMAL' | 'LOW' | 'LAST' | 'MONITOR';

export const PRIORITY_WEIGHTS: Record<EventPriority, number> = {
  FIRST: 200,
  HIGH: 100,
  NORMAL: 0,
  LOW: -100,
  LAST: -200,
  MONITOR: -1000, // Monitors run last to observe final settled state
};

export interface CancellableEvent {
  isCancelled: boolean;
  cancelReason?: string;
  cancel: (reason?: string) => void;
}

// -------------------------------------------------------------
// Core Event Payloads
// -------------------------------------------------------------

export interface CombatBeforeAttackPayload extends CancellableEvent {
  attackerId: string;
  targetId: string;
  isPlayerAttacker: boolean;
  weaponType?: string;
}

export interface CombatAttackPayload {
  attackerId: string;
  targetId: string;
  isPlayerAttacker: boolean;
  rawDamage: number;
  isCrit: boolean;
  isBackstab?: boolean;
}

export interface CombatDamagePayload extends CancellableEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  damageType?: string;
  isCrit: boolean;
  absorbedDamage: number;
  remainingTargetHp: number;
}

export interface CombatKillPayload {
  killerId: string;
  victimId: string;
  victimName: string;
  isVictimBoss: boolean;
  xpAwarded: number;
  goldAwarded: number;
}

export interface MovementBeforeStepPayload extends CancellableEvent {
  actorId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  terrainType?: string;
}

export interface MovementStepPayload {
  actorId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  distance: number;
}

export interface MovementChunkTransitionPayload {
  actorId: string;
  prevChunkKey: string;
  newChunkKey: string;
  biome: string;
}

export interface SpellBeforeCastPayload extends CancellableEvent {
  casterId: string;
  spellId: string;
  spellName: string;
  manaCost: number;
  targetX?: number;
  targetY?: number;
}

export interface SpellCastPayload {
  casterId: string;
  spellId: string;
  spellName: string;
  manaCost: number;
  targetX?: number;
  targetY?: number;
  damage?: number;
  effectType?: string;
}

export interface ItemUsedPayload {
  actorId: string;
  itemId: string;
  itemName: string;
  itemType: string;
  restoredHp?: number;
  restoredMana?: number;
}

export interface ItemEquippedPayload {
  actorId: string;
  itemId: string;
  slot: string;
  itemName: string;
}

export interface ItemUnequippedPayload {
  actorId: string;
  itemId: string;
  slot: string;
}

export interface LootDroppedPayload {
  sourceEntityId: string;
  x: number;
  y: number;
  items: Array<{ id: string; name: string }>;
  gold: number;
}

export interface LootCollectedPayload {
  actorId: string;
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface WeatherChangedPayload {
  previousWeather: string;
  newWeather: string;
}

export interface TimeChangedPayload {
  previousTime: string;
  newTime: string;
}

export interface ChaosSurgedPayload {
  previousScore: number;
  newScore: number;
  surgeTitle: string;
  intensity: number;
}

export interface FactionReputationChangedPayload {
  factionId: string;
  factionName: string;
  previousStanding: number;
  newStanding: number;
  delta: number;
}

export interface TurnStartedPayload {
  turnNumber: number;
}

export interface TurnCompletedPayload {
  turnNumber: number;
}

export interface DungeonEnteredPayload {
  dungeonId: string;
  name: string;
  depth: number;
  archetype: string;
}

// -------------------------------------------------------------
// Master Event Map
// -------------------------------------------------------------

export interface GameEventPayloadMap {
  // Combat
  'combat:before_attack': CombatBeforeAttackPayload;
  'combat:attack': CombatAttackPayload;
  'combat:damage': CombatDamagePayload;
  'combat:kill': CombatKillPayload;
  
  // Movement
  'movement:before_step': MovementBeforeStepPayload;
  'movement:step': MovementStepPayload;
  'movement:chunk_transition': MovementChunkTransitionPayload;

  // Spells
  'spell:before_cast': SpellBeforeCastPayload;
  'spell:cast': SpellCastPayload;

  // Items
  'item:used': ItemUsedPayload;
  'item:equipped': ItemEquippedPayload;
  'item:unequipped': ItemUnequippedPayload;
  'loot:dropped': LootDroppedPayload;
  'loot:collected': LootCollectedPayload;

  // Environment & World
  'weather:changed': WeatherChangedPayload;
  'time:changed': TimeChangedPayload;
  'chaos:surged': ChaosSurgedPayload;
  'faction:reputation_changed': FactionReputationChangedPayload;

  // Turn Lifecycle
  'turn:started': TurnStartedPayload;
  'turn:completed': TurnCompletedPayload;
  'dungeon:entered': DungeonEnteredPayload;

  // Wildcards & Custom
  [customEvent: string]: unknown;
}

export type GameEventType = keyof GameEventPayloadMap;

export type EventCallback<T = unknown> = (payload: T) => void | Promise<void>;

export interface EventListenerRegistration {
  id: string;
  eventType: string;
  callback: EventCallback;
  priority: EventPriority;
  weight: number;
  once: boolean;
  tag?: string;
}

export interface EventSubscription {
  unsubscribe: () => void;
}

export interface EventTelemetryRecord {
  id: string;
  event: string;
  timestamp: number;
  durationMs: number;
  subscriberCount: number;
  payloadSummary: string;
  wasCancelled?: boolean;
}
