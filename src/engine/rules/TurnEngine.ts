/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TurnParticipant, ActionCostConfig, TurnStepResult } from './types';

/**
 * Standard baseline turn energy rules
 */
export const DEFAULT_ACTION_COSTS: ActionCostConfig = {
  baseActionCost: 100,
  energyThreshold: 100,
  speedMultiplier: 100
};

/**
 * Universal Turn-Based Energy Scheduler.
 * Conforms to Step 8 (Engine / Game Separation) of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md).
 * Resolves turn order based on actor speeds with zero hardcoded game logic.
 */
export class TurnEngine {
  private participants: Map<string, TurnParticipant> = new Map();
  private turnCount: number = 0;
  private config: ActionCostConfig;

  constructor(config: Partial<ActionCostConfig> = {}) {
    this.config = { ...DEFAULT_ACTION_COSTS, ...config };
  }

  /**
   * Registers a participant into the turn loop
   */
  public addParticipant(participant: TurnParticipant): void {
    this.participants.set(participant.id, {
      ...participant,
      energy: participant.energy ?? 0
    });
  }

  /**
   * Removes a participant (e.g. upon death)
   */
  public removeParticipant(id: string): void {
    this.participants.delete(id);
  }

  /**
   * Retrieves participant state
   */
  public getParticipant(id: string): TurnParticipant | undefined {
    return this.participants.get(id);
  }

  /**
   * Advances the turn loop until an alive participant accumulates enough energy to act.
   * Returns the actor ready to execute their turn, or null if no alive participants exist.
   */
  public nextActor(maxTicks: number = 1000): TurnStepResult | null {
    if (this.participants.size === 0) return null;

    let ticks = 0;

    while (ticks++ < maxTicks) {
      // 1. Check if anyone already has >= energyThreshold
      let readyActor: TurnParticipant | null = null;
      let highestEnergy = -1;

      for (const p of this.participants.values()) {
        if (p.isAlive && p.energy >= this.config.energyThreshold) {
          if (p.energy > highestEnergy) {
            highestEnergy = p.energy;
            readyActor = p;
          }
        }
      }

      if (readyActor) {
        if (readyActor.isPlayer) {
          this.turnCount++;
        }
        return {
          actor: readyActor,
          turnNumber: this.turnCount,
          ticksPassed: ticks
        };
      }

      // 2. Accumulate energy based on speed
      let anyAlive = false;
      for (const p of this.participants.values()) {
        if (p.isAlive) {
          anyAlive = true;
          const gain = Math.max(1, Math.round(p.speed * this.config.speedMultiplier));
          p.energy += gain;
        }
      }

      if (!anyAlive) return null;
    }

    return null;
  }

  /**
   * Deducts action energy cost once an actor acts
   */
  public consumeAction(actorId: string, cost: number = this.config.baseActionCost): void {
    const actor = this.participants.get(actorId);
    if (actor) {
      actor.energy = Math.max(0, actor.energy - cost);
    }
  }

  /**
   * Returns total elapsed player turns
   */
  public getTurnCount(): number {
    return this.turnCount;
  }

  /**
   * Resets scheduler to turn 0
   */
  public reset(): void {
    this.participants.clear();
    this.turnCount = 0;
  }

  /**
   * Returns all active participants
   */
  public getAllParticipants(): TurnParticipant[] {
    return Array.from(this.participants.values());
  }
}
