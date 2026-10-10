/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAIStrategy, AIStrategyContext, AIActionDecision } from '../types';
import { manhattanDistance, getStepTowards, checkBresenhamLOS } from '../aiNavigation';

/**
 * Ranged AI Strategy:
 * - If target is within ranged attack range and line of sight is clear, attack with ranged shot or ability.
 * - If target is too far, advance closer until within firing range.
 * - If target is too close (distance === 1), melee attack or fallback.
 */
export class RangedStrategy implements IAIStrategy {
  public readonly id = 'ranged';
  public readonly description = 'Attacks targets from distance using ranged attacks or abilities with clear line-of-sight';

  public decide(ctx: AIStrategyContext): AIActionDecision {
    const { actor, target, spatial } = ctx;

    if (!target) {
      return { type: 'wait', reason: 'No target acquired.' };
    }

    const range = (actor as any).range ?? 4;
    const dist = manhattanDistance(actor.x, actor.y, target.x, target.y);

    // Check line of sight
    const hasLOS = spatial.hasLineOfSight
      ? spatial.hasLineOfSight(actor.x, actor.y, target.x, target.y)
      : checkBresenhamLOS(actor.x, actor.y, target.x, target.y, spatial.isPassable);

    // If target in range and has LOS -> Fire ranged attack
    if (dist <= range && hasLOS) {
      // Check if actor has a ranged ability to prioritize
      const abilities = (actor as any).abilities as string[] | undefined;
      const primaryAbility = abilities && abilities.length > 0 ? abilities[0] : undefined;

      return {
        type: primaryAbility ? 'ability' : 'attack',
        abilityId: primaryAbility,
        targetEntityId: target.id,
        targetEntity: target,
        targetPos: { x: target.x, y: target.y },
        reason: primaryAbility
          ? `Firing ability '${primaryAbility}' at distance ${dist}.`
          : `Firing ranged attack at distance ${dist}.`
      };
    }

    // If out of range or LOS blocked, move closer to acquire line of fire
    const step = getStepTowards(actor.x, actor.y, target.x, target.y, spatial);
    if (step) {
      return {
        type: 'move',
        delta: step,
        targetPos: { x: actor.x + step.dx, y: actor.y + step.dy },
        reason: !hasLOS ? 'Moving to re-establish line-of-sight.' : `Closing distance to target (${dist} > ${range}).`
      };
    }

    return { type: 'wait', reason: 'No valid firing line or path found.' };
  }
}
