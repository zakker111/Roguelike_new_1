/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAIStrategy, AIStrategyContext, AIActionDecision } from '../types';
import { manhattanDistance, getStepAway } from '../aiNavigation';

/**
 * Coward AI Strategy:
 * - When target or threat is perceived within alert radius, flees in the opposite direction.
 * - Does not engage in combat unless cornered with no passable exit.
 * - Used for critters, cowardly goblins, wounded deserters, and passive fauna.
 */
export class CowardStrategy implements IAIStrategy {
  public readonly id = 'coward';
  public readonly description = 'Panics and flees away from threats, only retaliating if completely cornered';

  private panicRadius: number;

  constructor(panicRadius: number = 8) {
    this.panicRadius = panicRadius;
  }

  public decide(ctx: AIStrategyContext): AIActionDecision {
    const { actor, target, spatial } = ctx;

    if (!target) {
      return { type: 'wait', reason: 'No threats detected. Idling peacefully.' };
    }

    const dist = manhattanDistance(actor.x, actor.y, target.x, target.y);

    // If threat is beyond panic awareness radius, do not run
    if (dist > this.panicRadius) {
      return { type: 'wait', reason: `Threat at safe distance (${dist} > ${this.panicRadius}).` };
    }

    // Flee away from threat
    const fleeStep = getStepAway(actor.x, actor.y, target.x, target.y, spatial);
    if (fleeStep) {
      return {
        type: 'flee',
        delta: fleeStep,
        targetPos: { x: actor.x + fleeStep.dx, y: actor.y + fleeStep.dy },
        reason: `Threat detected at distance ${dist}. Fleeing in terror!`
      };
    }

    // If completely trapped and adjacent, desperate strike in self defense
    if (dist === 1) {
      return {
        type: 'attack',
        targetEntityId: target.id,
        targetEntity: target,
        targetPos: { x: target.x, y: target.y },
        reason: 'Trapped with no escape! Desperate cornered defense.'
      };
    }

    return { type: 'wait', reason: 'Cowering in fear.' };
  }
}
