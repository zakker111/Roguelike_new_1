/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AbilityRegistry } from './AbilityRegistry';
import { AbilityDefinition, AbilityExecutionContext, AbilityExecutionResult, EntityAbilityState } from './types';

export class AbilityExecutor {
  /**
   * Checks whether an entity meets the requirements to cast an ability (cooldown, mana, range, LOS)
   */
  public static canCast(
    abilityId: string,
    state: EntityAbilityState | undefined,
    ctx: AbilityExecutionContext
  ): { canCast: boolean; reason?: string } {
    const ability = AbilityRegistry.getInstance().get(abilityId);
    if (!ability) {
      return { canCast: false, reason: `Ability '${abilityId}' does not exist.` };
    }

    // Cooldown check
    if (state && state.currentCooldown > 0) {
      return { canCast: false, reason: `Ability on cooldown (${state.currentCooldown} turns remaining).` };
    }

    // Mana check
    if (ability.manaCost && ability.manaCost > 0) {
      const currentMp = ctx.source.mp ?? 0;
      if (currentMp < ability.manaCost) {
        return { canCast: false, reason: `Insufficient mana (requires ${ability.manaCost}, have ${currentMp}).` };
      }
    }

    // Range check
    if (ability.range > 0) {
      const targetX = ctx.target ? ctx.target.x : ctx.targetPos?.x;
      const targetY = ctx.target ? ctx.target.y : ctx.targetPos?.y;
      if (targetX !== undefined && targetY !== undefined) {
        const dist = Math.abs(targetX - ctx.source.x) + Math.abs(targetY - ctx.source.y);
        if (dist > ability.range) {
          return { canCast: false, reason: `Target out of range (${dist} > ${ability.range}).` };
        }

        // Line of sight check if mapContext provides it
        if (ctx.mapContext?.hasLineOfSight) {
          if (!ctx.mapContext.hasLineOfSight(ctx.source.x, ctx.source.y, targetX, targetY)) {
            return { canCast: false, reason: 'Target is not in line of sight.' };
          }
        }
      }
    }

    return { canCast: true };
  }

  /**
   * Executes the ability and updates the entity's cooldown and mana
   */
  public static execute(
    abilityId: string,
    state: EntityAbilityState | undefined,
    ctx: AbilityExecutionContext
  ): { result: AbilityExecutionResult; nextCooldown: number; mpConsumed: number } {
    const ability = AbilityRegistry.getInstance().get(abilityId);
    if (!ability) {
      return {
        result: { success: false, abilityId, message: `Unknown ability ${abilityId}` },
        nextCooldown: 0,
        mpConsumed: 0
      };
    }

    const check = this.canCast(abilityId, state, ctx);
    if (!check.canCast) {
      return {
        result: { success: false, abilityId, message: check.reason },
        nextCooldown: state?.currentCooldown || 0,
        mpConsumed: 0
      };
    }

    const mpConsumed = ability.manaCost || 0;
    if (ctx.source.mp !== undefined && mpConsumed > 0) {
      ctx.source.mp = Math.max(0, ctx.source.mp - mpConsumed);
    }

    const result = AbilityRegistry.getInstance().execute(abilityId, ctx);
    const nextCooldown = result.success ? ability.cooldown : (state?.currentCooldown || 0);

    return {
      result,
      nextCooldown,
      mpConsumed
    };
  }

  /**
   * Ticks down active cooldowns for an entity at turn end
   */
  public static tickCooldowns(states: EntityAbilityState[]): EntityAbilityState[] {
    return states.map(s => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1)
    }));
  }
}
