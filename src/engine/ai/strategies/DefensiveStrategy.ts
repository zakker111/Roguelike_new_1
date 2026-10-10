/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAIStrategy, AIStrategyContext, AIActionDecision } from '../types';
import { manhattanDistance, getStepTowards } from '../aiNavigation';

/**
 * Defensive AI Strategy (Guardian / Tank):
 * - Guards an anchor point or holds position until target breaches guarding perimeter.
 * - Prioritizes defensive buffs, shields, or brace stances.
 * - Attacks only when enemies enter immediate zone of control (range <= 2).
 */
export class DefensiveStrategy implements IAIStrategy {
  public readonly id = 'defensive';
  public readonly description = 'Holds position and defensive posture, striking only when intruders breach its guard zone';

  private guardRadius: number;

  constructor(guardRadius: number = 3) {
    this.guardRadius = guardRadius;
  }

  public decide(ctx: AIStrategyContext): AIActionDecision {
    const { actor, target, spatial, blackboard } = ctx;

    // Anchor position or current starting position
    const anchorX = blackboard?.anchorX ?? actor.x;
    const anchorY = blackboard?.anchorY ?? actor.y;

    if (!target) {
      // If away from post, return to guard post
      const distToAnchor = manhattanDistance(actor.x, actor.y, anchorX, anchorY);
      if (distToAnchor > 0) {
        const step = getStepTowards(actor.x, actor.y, anchorX, anchorY, spatial);
        if (step) {
          return {
            type: 'move',
            delta: step,
            targetPos: { x: actor.x + step.dx, y: actor.y + step.dy },
            reason: 'Returning to guard post.'
          };
        }
      }
      return { type: 'wait', reason: 'Guarding post.' };
    }

    const distToTarget = manhattanDistance(actor.x, actor.y, target.x, target.y);
    const range = (actor as any).range ?? 1;

    // 1. Target directly in melee reach: punish intruder
    if (distToTarget <= range) {
      return {
        type: 'attack',
        targetEntityId: target.id,
        targetEntity: target,
        targetPos: { x: target.x, y: target.y },
        reason: 'Intruder breached personal space. Striking defensively.'
      };
    }

    // 2. Check for defensive buffs (e.g. shield, brace, iron_skin)
    const abilities = (actor as any).abilities as string[] | undefined;
    const defensiveAbility = abilities?.find(a => a.includes('shield') || a.includes('buff') || a.includes('brace') || a.includes('heal'));
    if (defensiveAbility && distToTarget <= this.guardRadius) {
      return {
        type: 'ability',
        abilityId: defensiveAbility,
        targetEntityId: actor.id,
        targetEntity: actor,
        targetPos: { x: actor.x, y: actor.y },
        reason: `Activating defensive ability '${defensiveAbility}'.`
      };
    }

    // 3. If target within guard perimeter, intercept
    if (distToTarget <= this.guardRadius) {
      const step = getStepTowards(actor.x, actor.y, target.x, target.y, spatial);
      if (step) {
        return {
          type: 'move',
          delta: step,
          targetPos: { x: actor.x + step.dx, y: actor.y + step.dy },
          reason: 'Intercepting intruder inside guard perimeter.'
        };
      }
    }

    // 4. Outside perimeter: hold ground
    return { type: 'wait', reason: 'Holding defensive line; intruder outside engagement radius.' };
  }
}
