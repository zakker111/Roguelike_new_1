/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAIStrategy, AIStrategyContext, AIActionDecision } from '../types';
import { manhattanDistance, getStepTowards, getStepAway } from '../aiNavigation';

/**
 * Summoner AI Strategy (Necromancer / Swarm Queen):
 * - Prioritizes conjuring minions, totems, or clones to fight on its behalf.
 * - Actively flees / retreats from close combat when enemies get adjacent.
 * - Commands the battlefield from a distance while keeping minions between itself and threat.
 */
export class SummonerStrategy implements IAIStrategy {
  public readonly id = 'summoner';
  public readonly description = 'Summons allied minions and totems while actively keeping distance from threats';

  private minSafeDistance: number;

  constructor(minSafeDistance: number = 3) {
    this.minSafeDistance = minSafeDistance;
  }

  public decide(ctx: AIStrategyContext): AIActionDecision {
    const { actor, target, spatial, visibleEntities } = ctx;

    // 1. Check if summon ability is present on actor
    const abilities = (actor as any).abilities as string[] | undefined;
    const summonAbility = abilities?.find(a => a.includes('summon') || a.includes('clone') || a.includes('spawn') || a.includes('totem'))
      || (abilities && abilities.length > 0 ? abilities[0] : 'summon');

    // Count currently living minions/summons owned by this actor or on same faction
    const minionCount = visibleEntities?.filter(e => 
      e.kind === 'summon' || (e.tags && e.tags.includes('minion'))
    ).length ?? 0;

    // 2. If target is too close (< safe distance), retreat first!
    if (target) {
      const distToThreat = manhattanDistance(actor.x, actor.y, target.x, target.y);
      if (distToThreat < this.minSafeDistance) {
        const retreatStep = getStepAway(actor.x, actor.y, target.x, target.y, spatial);
        if (retreatStep) {
          return {
            type: 'move',
            delta: retreatStep,
            targetPos: { x: actor.x + retreatStep.dx, y: actor.y + retreatStep.dy },
            reason: `Target too close to summoner (${distToThreat} < ${this.minSafeDistance}). Backing away.`
          };
        }
      }
    }

    // 3. Summon minions if capacity not exceeded (e.g. fewer than 3 active minions)
    if (minionCount < 3 && summonAbility) {
      // Find empty adjacent tile to summon into
      const spawnX = actor.x + 1;
      const spawnY = actor.y;
      return {
        type: 'ability',
        abilityId: summonAbility,
        targetEntityId: actor.id,
        targetEntity: actor,
        targetPos: { x: spawnX, y: spawnY },
        reason: `Summoning minion with '${summonAbility}'. Current count: ${minionCount}.`
      };
    }

    // 4. If minions are active and target exists, attack from distance or wait
    if (target) {
      const dist = manhattanDistance(actor.x, actor.y, target.x, target.y);
      const range = (actor as any).range ?? 4;
      if (dist <= range) {
        return {
          type: 'attack',
          targetEntityId: target.id,
          targetEntity: target,
          targetPos: { x: target.x, y: target.y },
          reason: `Summoner firing spell at target from distance ${dist}.`
        };
      }
    }

    return { type: 'wait', reason: 'Summoner overseeing minion horde.' };
  }
}
