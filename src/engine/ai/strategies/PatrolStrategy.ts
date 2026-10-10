/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAIStrategy, AIStrategyContext, AIActionDecision } from '../types';
import { manhattanDistance, getStepTowards } from '../aiNavigation';

/**
 * Patrol AI Strategy (Sentry / Town Guard / Dungeon Patrol):
 * - Follows a predefined list of waypoint coordinates.
 * - If a hostile intruder is spotted within perception radius, investigates or engages.
 * - Returns to waypoint patrol sequence when area is calm.
 */
export class PatrolStrategy implements IAIStrategy {
  public readonly id = 'patrol';
  public readonly description = 'Circulates along a route of waypoints, breaking patrol only to investigate or neutralize intruders';

  private waypoints: Array<{ x: number; y: number }>;
  private detectionRadius: number;

  constructor(waypoints: Array<{ x: number; y: number }> = [], detectionRadius: number = 5) {
    this.waypoints = waypoints;
    this.detectionRadius = detectionRadius;
  }

  public decide(ctx: AIStrategyContext): AIActionDecision {
    const { actor, target, spatial, blackboard } = ctx;

    // Use waypoints from constructor or from actor/blackboard
    const route = this.waypoints.length > 0
      ? this.waypoints
      : (blackboard?.waypoints as Array<{ x: number; y: number }> | undefined) ?? [];

    let currentWaypointIndex = blackboard?.currentWaypointIndex ?? 0;

    // 1. If target is detected within engagement radius, attack or advance
    if (target) {
      const distToTarget = manhattanDistance(actor.x, actor.y, target.x, target.y);
      if (distToTarget <= this.detectionRadius) {
        const range = (actor as any).range ?? 1;
        if (distToTarget <= range) {
          return {
            type: 'attack',
            targetEntityId: target.id,
            targetEntity: target,
            targetPos: { x: target.x, y: target.y },
            reason: `Intruder spotted on patrol route at distance ${distToTarget}. Attacking!`
          };
        }

        const step = getStepTowards(actor.x, actor.y, target.x, target.y, spatial);
        if (step) {
          return {
            type: 'move',
            delta: step,
            targetPos: { x: actor.x + step.dx, y: actor.y + step.dy },
            reason: 'Pursuing detected intruder off patrol route.'
          };
        }
      }
    }

    // 2. Patrol waypoints
    if (route.length > 0) {
      const targetWp = route[currentWaypointIndex % route.length];
      const distToWp = manhattanDistance(actor.x, actor.y, targetWp.x, targetWp.y);

      // Reached current waypoint: advance to next waypoint
      if (distToWp === 0) {
        currentWaypointIndex = (currentWaypointIndex + 1) % route.length;
        if (blackboard) {
          blackboard.currentWaypointIndex = currentWaypointIndex;
        }
        const nextWp = route[currentWaypointIndex];
        const step = getStepTowards(actor.x, actor.y, nextWp.x, nextWp.y, spatial);
        if (step) {
          return {
            type: 'move',
            delta: step,
            targetPos: { x: actor.x + step.dx, y: actor.y + step.dy },
            reason: `Reached waypoint. Advancing to waypoint #${currentWaypointIndex}.`
          };
        }
      } else {
        const step = getStepTowards(actor.x, actor.y, targetWp.x, targetWp.y, spatial);
        if (step) {
          return {
            type: 'move',
            delta: step,
            targetPos: { x: actor.x + step.dx, y: actor.y + step.dy },
            reason: `Patrolling towards waypoint #${currentWaypointIndex} at (${targetWp.x}, ${targetWp.y}).`
          };
        }
      }
    }

    return { type: 'wait', reason: 'Sentry holding station on patrol route.' };
  }
}
