/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAIStrategy, AIStrategyContext, AIActionDecision } from '../types';
import { manhattanDistance, getStepTowards } from '../aiNavigation';

/**
 * Melee AI Strategy:
 * - If target is adjacent (distance <= range, default 1), attack!
 * - Otherwise, navigate directly towards target.
 * - If target is unreachable or absent, wait.
 */
export class MeleeStrategy implements IAIStrategy {
  public readonly id = 'melee';
  public readonly description = 'Advances aggressively towards the target and executes melee strikes';

  public decide(ctx: AIStrategyContext): AIActionDecision {
    const { actor, target, spatial } = ctx;

    if (!target) {
      return { type: 'wait', reason: 'No target acquired.' };
    }

    const range = (actor as any).range ?? 1;
    const dist = manhattanDistance(actor.x, actor.y, target.x, target.y);

    // Adjacent or within melee range -> Attack
    if (dist <= range) {
      return {
        type: 'attack',
        targetEntityId: target.id,
        targetEntity: target,
        targetPos: { x: target.x, y: target.y },
        reason: `Target in melee range (${dist} <= ${range}). Attacking.`
      };
    }

    // Move closer towards target
    const step = getStepTowards(actor.x, actor.y, target.x, target.y, spatial);
    if (step) {
      return {
        type: 'move',
        delta: step,
        targetPos: { x: actor.x + step.dx, y: actor.y + step.dy },
        reason: `Moving towards target at (${target.x}, ${target.y}).`
      };
    }

    return { type: 'wait', reason: 'Target out of reach and path obstructed.' };
  }
}
