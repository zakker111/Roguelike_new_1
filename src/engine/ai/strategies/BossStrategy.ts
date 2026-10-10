/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAIStrategy, AIStrategyContext, AIActionDecision } from '../types';
import { manhattanDistance, getStepTowards } from '../aiNavigation';

/**
 * Boss AI Strategy:
 * - Multi-phase combat behavior based on HP thresholds.
 * - Phase 1 (> 60% HP): Standard calculated assault, cycles primary abilities, summons minions.
 * - Phase 2 (30% - 60% HP): Enraged, higher aggressive pacing, AoE abilities, charges targets.
 * - Phase 3 (< 30% HP): Desperation frenzy, high-damage nova, shields, berserk attacks.
 */
export class BossStrategy implements IAIStrategy {
  public readonly id = 'boss';
  public readonly description = 'Multi-phase boss combat AI that shifts tactics and unleashes devastating abilities based on health stages';

  public decide(ctx: AIStrategyContext): AIActionDecision {
    const { actor, target, spatial, blackboard } = ctx;

    if (!target) {
      return { type: 'wait', reason: 'Boss awaiting challengers.' };
    }

    const currentHp = actor.hp ?? 100;
    const maxHp = actor.maxHp ?? 100;
    const hpRatio = currentHp / maxHp;

    const dist = manhattanDistance(actor.x, actor.y, target.x, target.y);
    const range = (actor as any).range ?? 1;
    const abilities = (actor as any).abilities as string[] | undefined;

    // Track phase in blackboard or metadata
    let phase = 1;
    if (hpRatio <= 0.3) {
      phase = 3; // Frenzy / Desperation
    } else if (hpRatio <= 0.6) {
      phase = 2; // Enraged
    }

    if (blackboard) {
      blackboard.bossPhase = phase;
    }

    // PHASE 3: Frenzy (< 30% HP)
    if (phase === 3) {
      // Prioritize ultimate or nova/explode ability over standard spells
      const frenzyAbility = abilities?.find(a => a.includes('explode') || a.includes('nova') || a.includes('berserk'))
        ?? abilities?.find(a => a.includes('fireball'))
        ?? (abilities && abilities.length > 0 ? abilities[abilities.length - 1] : undefined);

      if (frenzyAbility && dist <= 3) {
        return {
          type: 'ability',
          abilityId: frenzyAbility,
          targetEntityId: target.id,
          targetEntity: target,
          targetPos: { x: target.x, y: target.y },
          reason: `Boss in Phase 3 Enrage Frenzy (${Math.round(hpRatio * 100)}% HP)! Unleashing '${frenzyAbility}'.`,
          metadata: { phase: 3 }
        };
      }

      if (dist <= range) {
        return {
          type: 'attack',
          targetEntityId: target.id,
          targetEntity: target,
          targetPos: { x: target.x, y: target.y },
          reason: 'Boss Phase 3 crushing frenzy strike!',
          metadata: { phase: 3 }
        };
      }
    }

    // PHASE 2: Enraged (30% - 60% HP)
    if (phase === 2) {
      const enragedAbility = abilities?.find(a => a.includes('dash') || a.includes('poison') || a.includes('shoot'))
        ?? (abilities && abilities.length > 0 ? abilities[0] : undefined);

      if (enragedAbility && dist <= 4) {
        return {
          type: 'ability',
          abilityId: enragedAbility,
          targetEntityId: target.id,
          targetEntity: target,
          targetPos: { x: target.x, y: target.y },
          reason: `Boss in Phase 2 (${Math.round(hpRatio * 100)}% HP)! Casting '${enragedAbility}'.`,
          metadata: { phase: 2 }
        };
      }
    }

    // PHASE 1: Methodical (> 60% HP)
    if (phase === 1 && abilities && abilities.length > 0) {
      const summonOrBuff = abilities.find(a => a.includes('summon') || a.includes('buff') || a.includes('shield'));
      if (summonOrBuff) {
        return {
          type: 'ability',
          abilityId: summonOrBuff,
          targetEntityId: actor.id,
          targetEntity: actor,
          targetPos: { x: actor.x, y: actor.y },
          reason: `Boss Phase 1 invocation: casting '${summonOrBuff}'.`,
          metadata: { phase: 1 }
        };
      }
    }

    // Standard attack if in range
    if (dist <= range) {
      return {
        type: 'attack',
        targetEntityId: target.id,
        targetEntity: target,
        targetPos: { x: target.x, y: target.y },
        reason: `Boss standard attack at distance ${dist}.`,
        metadata: { phase }
      };
    }

    // Advance towards target
    const step = getStepTowards(actor.x, actor.y, target.x, target.y, spatial);
    if (step) {
      return {
        type: 'move',
        delta: step,
        targetPos: { x: actor.x + step.dx, y: actor.y + step.dy },
        reason: `Boss advancing towards intruder. Phase ${phase}.`,
        metadata: { phase }
      };
    }

    return { type: 'wait', reason: 'Boss sizing up opponent.', metadata: { phase } };
  }
}
