/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseEntity, LivingEntity } from '../entities/types';
import { AbilityExecutionContext, AbilityExecutionResult } from '../abilities/types';

/**
 * Strategy types supported out-of-the-box by the engine
 */
export type AIStrategyId =
  | 'melee'
  | 'ranged'
  | 'kiting'
  | 'coward'
  | 'aggressive'
  | 'defensive'
  | 'summoner'
  | 'patrol'
  | 'boss';

/**
 * Intended action produced by an AI decision step
 */
export type AIActionType =
  | 'wait'
  | 'move'
  | 'attack'
  | 'ability'
  | 'flee'
  | 'interact';

/**
 * Concrete action decision emitted by an AI strategy
 */
export interface AIActionDecision {
  type: AIActionType;
  /**
   * Target destination coordinate if moving or fleeing
   */
  targetPos?: { x: number; y: number };
  /**
   * Step delta (dx, dy) for movement
   */
  delta?: { dx: number; dy: number };
  /**
   * Target entity ID if targeting a specific entity for attack/ability
   */
  targetEntityId?: string;
  /**
   * Target entity reference if resolved
   */
  targetEntity?: BaseEntity;
  /**
   * Target ability ID if casting an ability
   */
  abilityId?: string;
  /**
   * Explanatory debug / log message
   */
  reason?: string;
  /**
   * Custom metadata for telemetry / visualization
   */
  metadata?: Record<string, any>;
}

/**
 * Read-only perception and query interface for AI decision evaluation
 */
export interface AISpatialQueryContext {
  /**
   * Checks if coordinate is walkable / passable by the entity
   */
  isPassable: (x: number, y: number) => boolean;
  /**
   * Checks if an entity is at (x, y)
   */
  getEntityAt?: (x: number, y: number) => BaseEntity | undefined;
  /**
   * Checks line of sight between two positions
   */
  hasLineOfSight?: (x1: number, y1: number, x2: number, y2: number) => boolean;
  /**
   * Distance metric (default Manhattan or Chebyshev)
   */
  distance?: (x1: number, y1: number, x2: number, y2: number) => number;
  /**
   * Map width bounds
   */
  width?: number;
  /**
   * Map height bounds
   */
  height?: number;
}

/**
 * Full turn execution context passed into an AIStrategy
 */
export interface AIStrategyContext {
  /**
   * The acting entity
   */
  actor: LivingEntity;
  /**
   * Primary target entity (usually the player or rival faction member)
   */
  target?: LivingEntity;
  /**
   * All visible or surrounding entities
   */
  visibleEntities?: BaseEntity[];
  /**
   * Spatial query methods for pathfinding, line of sight, and obstacle evaluation
   */
  spatial: AISpatialQueryContext;
  /**
   * Current turn number
   */
  turn?: number;
  /**
   * Memory / blackboard state attached to the entity
   */
  blackboard?: Record<string, any>;
}

/**
 * Strategy contract implemented by all AI behavioral modules
 */
export interface IAIStrategy {
  /**
   * Unique strategy identifier (e.g. 'melee', 'kiting', 'coward', 'patrol', 'boss')
   */
  readonly id: AIStrategyId | string;

  /**
   * Human-readable description
   */
  readonly description: string;

  /**
   * Evaluates the current situation and decides the next action
   */
  decide(context: AIStrategyContext): AIActionDecision;
}
