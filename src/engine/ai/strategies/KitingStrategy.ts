/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAIStrategy, AIStrategyContext, AIActionDecision } from '../types';
import { manhattanDistance, getStepTowards, getStepAway, checkBresenhamLOS } from '../aiNavigation';

/**
 * Kiting AI Strategy (Skirmisher):
 * - Maintains a sweet-spot distance (preferredDist, default 3-4 tiles).
 * - If target is too close (dist < preferredDist), retreats/kites backwards.
 * - If target is in the sweet spot and has LOS, attacks or casts ranged ability.
 * - If target is too far, steps closer.
 */
export class KitingStrategy implements IAIStrategy {
  public readonly id = 'kiting';
  public readonly description = 'Maintains standoff distance, kiting backwards when pressed and attacking from safety';

  private preferredMinDist: number;
  private preferredMaxDist: number;

  constructor(preferredMinDist: number = 3, preferredMaxDist: number = 5) {
    this.preferredMinDist = preferredMinDist;
    this.preferredMaxDist = preferredMaxDist;
  }

  public decide(ctx: AIStrategyContext): AIActionDecision {
    const { actor, target, spatial } = ctx;

    if (!target) {
      return { type: 'wait', reason: 'No target acquired.' };
    }

    const dist = manhattanDistance(actor.x, actor.y, target.x, target.y);
    const range = (actor as any).range ?? this.preferredMaxDist;

    // Check line of sight
    const hasLOS = spatial.hasLineOfSight
      ? spatial.hasLineOfSight(actor.x, actor.y, target.x, target.y)
      : checkBresenhamLOS(actor.x, actor.y, target.x, target.y, spatial.isPassable);

    // 1. Target is too close: kite backwards to open distance
    if (dist < this.preferredMinDist) {
      const retreatStep = getStepAway(actor.x, actor.y, target.x, target.y, spatial);
      if (retreatStep) {
        return {
          type: 'move',
          delta: retreatStep,
          targetPos: { x: actor.x + retreatStep.dx, y: actor.y + retreatStep.dy },
          reason: `Target too close (${dist} < ${this.preferredMinDist}). Kiting backwards to create distance.`
        };
      }

      // If cornered / unable to retreat, fight back with melee or closest attack
      return {
        type: 'attack',
        targetEntityId: target.id,
        targetEntity: target,
        targetPos: { x: target.x, y: target.y },
        reason: 'Cornered and unable to kite backwards. Retaliating.'
      };
    }

    // 2. In sweet spot and has LOS: attack or cast ability
    if (dist <= range && hasLOS) {
      const abilities = (actor as any).abilities as string[] | undefined;
      const primaryAbility = abilities && abilities.length > 0 ? abilities[0] : undefined;

      return {
        type: primaryAbility ? 'ability' : 'attack',
        abilityId: primaryAbility,
        targetEntityId: target.id,
        targetEntity: target,
        targetPos: { x: target.x, y: target.y },
        reason: `Holding sweet spot (${dist}). Firing ranged offensive.`
      };
    }

    // 3. Target is too far away or behind cover: close distance
    const step = getStepTowards(actor.x, actor.y, target.x, target.y, spatial);
    if (step) {
      return {
        type: 'move',
        delta: step,
        targetPos: { x: actor.x + step.dx, y: actor.y + step.dy },
        reason: `Moving into optimal firing range (${dist} > ${this.preferredMaxDist}).`
      };
    }

    return { type: 'wait', reason: 'Holding position.' };
  }
}
