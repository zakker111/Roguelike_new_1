/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAIStrategy, AIStrategyContext, AIActionDecision } from '../types';
import { manhattanDistance, getStepTowards } from '../aiNavigation';

/**
 * Aggressive AI Strategy (Berserker / Swarmer):
 * - Always pursues target with relentless focus.
 * - Does not pause, brace, or retreat under any circumstances.
 * - Prioritizes offensive abilities first; falls back to melee attack or charge step.
 */
export class AggressiveStrategy implements IAIStrategy {
  public readonly id = 'aggressive';
  public readonly description = 'Relentlessly charges and swarms targets, ignoring personal danger to maximize damage output';

  public decide(ctx: AIStrategyContext): AIActionDecision {
    const { actor, target, spatial } = ctx;

    if (!target) {
      return { type: 'wait', reason: 'No enemy detected.' };
    }

    const dist = manhattanDistance(actor.x, actor.y, target.x, target.y);
    const range = (actor as any).range ?? 1;

    // Check if offensive abilities are available
    const abilities = (actor as any).abilities as string[] | undefined;
    if (abilities && abilities.length > 0 && dist <= range + 1) {
      return {
        type: 'ability',
        abilityId: abilities[0],
        targetEntityId: target.id,
        targetEntity: target,
        targetPos: { x: target.x, y: target.y },
        reason: `Executing berserk ability '${abilities[0]}'.`
      };
    }

    // Direct melee strike
    if (dist <= range) {
      return {
        type: 'attack',
        targetEntityId: target.id,
        targetEntity: target,
        targetPos: { x: target.x, y: target.y },
        reason: 'Aggressive attack!'
      };
    }

    // Relentless pursuit
    const step = getStepTowards(actor.x, actor.y, target.x, target.y, spatial);
    if (step) {
      return {
        type: 'move',
        delta: step,
        targetPos: { x: actor.x + step.dx, y: actor.y + step.dy },
        reason: `Aggressively chasing target towards (${target.x}, ${target.y}).`
      };
    }

    return { type: 'wait', reason: 'Pursuit path blocked.' };
  }
}
