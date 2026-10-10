/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standard phases within an individual turn lifecycle
 */
export type TurnPhase = 'turn_start' | 'action' | 'turn_end' | 'environment_tick';

/**
 * An actor participating in the turn scheduler
 */
export interface TurnParticipant {
  id: string;
  name: string;
  speed: number; // e.g. 1.0 = standard, 2.0 = fast, 0.5 = slow
  energy: number; // accumulates towards threshold
  isAlive: boolean;
  isPlayer?: boolean;
}

/**
 * Standard action costs in energy units
 */
export interface ActionCostConfig {
  baseActionCost: number; // standard step or attack cost (e.g. 100)
  energyThreshold: number; // energy required to act (e.g. 100)
  speedMultiplier: number; // energy gain per tick = speed * speedMultiplier
}

/**
 * Result of advancing the turn scheduler
 */
export interface TurnStepResult {
  actor: TurnParticipant;
  turnNumber: number;
  ticksPassed: number;
}
