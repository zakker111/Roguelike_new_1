/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EffectRegistry } from './EffectRegistry';
import {
  ActiveEffect,
  ApplyEffectOptions,
  EffectDefinition,
  EffectStatModifiers,
  EffectTarget,
  EffectTickResult,
  EffectType,
} from './types';

export class EffectManager {
  private static instance: EffectManager;
  private registry: EffectRegistry;

  constructor(registry: EffectRegistry = EffectRegistry.getInstance()) {
    this.registry = registry;
  }

  public static getInstance(): EffectManager {
    if (!EffectManager.instance) {
      EffectManager.instance = new EffectManager();
    }
    return EffectManager.instance;
  }

  public static applyEffect(
    target: EffectTarget,
    effectId: string,
    options?: ApplyEffectOptions
  ): { applied: boolean; effect?: ActiveEffect; log?: string } {
    return EffectManager.getInstance().applyEffect(target, effectId, options);
  }

  public static tickEffects(target: EffectTarget): EffectTickResult {
    return EffectManager.getInstance().tickEffects(target);
  }

  public static removeEffect(
    target: EffectTarget,
    effectId: string
  ): { removed: boolean; log?: string } {
    return EffectManager.getInstance().removeEffect(target, effectId);
  }

  public static hasEffect(target: EffectTarget, effectId: string): boolean {
    return EffectManager.getInstance().hasEffect(target, effectId);
  }

  public static clearEffects(target: EffectTarget): void {
    EffectManager.getInstance().clearEffects(target);
  }

  /**
   * Applies an effect to any target entity (Player, Enemy, Follower, NPC, Summon)
   */
  public applyEffect(
    target: EffectTarget,
    effectId: string,
    options?: ApplyEffectOptions
  ): { applied: boolean; effect?: ActiveEffect; log?: string } {
    const def = this.registry.getEffect(effectId);
    if (!def) {
      return { applied: false };
    }

    if (!target.activeEffects) {
      target.activeEffects = [];
    }

    const duration = options?.duration ?? def.defaultDuration;
    const maxStacks = def.maxStacks ?? 1;
    const existingIndex = target.activeEffects.findIndex((e) => e.id === effectId);

    if (existingIndex >= 0) {
      const existing = target.activeEffects[existingIndex];
      const stacking = def.stacking ?? 'refresh';

      switch (stacking) {
        case 'stack_intensity':
          existing.stacks = Math.min(existing.stacks + (options?.stacks ?? 1), maxStacks);
          existing.duration = duration;
          break;
        case 'stack_duration':
          existing.duration += duration;
          break;
        case 'refresh':
        default:
          existing.duration = Math.max(existing.duration, duration);
          break;
        case 'ignore':
          return { applied: false, effect: existing };
      }

      if (options?.damagePerTurn !== undefined) existing.damagePerTurn = options.damagePerTurn;
      if (options?.healPerTurn !== undefined) existing.healPerTurn = options.healPerTurn;
      if (options?.statModifiers) existing.statModifiers = { ...existing.statModifiers, ...options.statModifiers };

      const log = def.onApplyLog ? def.onApplyLog(target.name) : undefined;
      return { applied: true, effect: existing, log };
    }

    // New active effect creation
    const newEffect: ActiveEffect = {
      id: def.id,
      name: def.name,
      type: def.type,
      icon: def.icon,
      color: def.color,
      description: def.description,
      duration,
      maxDuration: duration,
      stacks: Math.min(options?.stacks ?? 1, maxStacks),
      maxStacks,
      damagePerTurn: options?.damagePerTurn ?? def.damagePerTurn,
      damageType: def.damageType,
      healPerTurn: options?.healPerTurn ?? def.healPerTurn,
      shieldCurrent: options?.shieldAmount ?? def.shieldAmount,
      shieldMax: options?.shieldAmount ?? def.shieldAmount,
      statModifiers: options?.statModifiers ?? def.statModifiers,
      inhibitions: def.inhibitions,
      sourceEntityId: options?.sourceEntityId,
      sourceEntityName: options?.sourceEntityName,
    };

    target.activeEffects.push(newEffect);
    const log = def.onApplyLog ? def.onApplyLog(target.name) : undefined;
    return { applied: true, effect: newEffect, log };
  }

  /**
   * Removes an active effect by ID from an entity
   */
  public removeEffect(
    target: EffectTarget,
    effectId: string
  ): { removed: boolean; log?: string } {
    if (!target.activeEffects || target.activeEffects.length === 0) {
      return { removed: false };
    }

    const index = target.activeEffects.findIndex((e) => e.id === effectId);
    if (index === -1) {
      return { removed: false };
    }

    target.activeEffects.splice(index, 1);
    const def = this.registry.getEffect(effectId);
    const log = def?.onExpireLog ? def.onExpireLog(target.name) : undefined;
    return { removed: true, log };
  }

  /**
   * Checks whether an entity has an active effect
   */
  public hasEffect(target: EffectTarget, effectId: string): boolean {
    if (!target.activeEffects) return false;
    return target.activeEffects.some((e) => e.id === effectId && e.duration > 0);
  }

  /**
   * Retrieves an active effect on an entity
   */
  public getEffect(target: EffectTarget, effectId: string): ActiveEffect | undefined {
    if (!target.activeEffects) return undefined;
    return target.activeEffects.find((e) => e.id === effectId && e.duration > 0);
  }

  /**
   * Clears all active effects matching the given filter (or all effects if unspecified)
   */
  public clearEffects(target: EffectTarget, filter?: EffectType): string[] {
    if (!target.activeEffects) return [];

    const removedIds: string[] = [];
    target.activeEffects = target.activeEffects.filter((eff) => {
      if (!filter || eff.type === filter) {
        removedIds.push(eff.id);
        return false;
      }
      return true;
    });

    return removedIds;
  }

  /**
   * Ticks all active effects on an entity by 1 turn.
   * Resolves DoT damage, HoT healing, duration decrement, and expiration.
   */
  public tickEffects(target: EffectTarget): EffectTickResult {
    const result: EffectTickResult = {
      entityId: target.id,
      entityName: target.name,
      damageTaken: 0,
      healingReceived: 0,
      shieldDepleted: 0,
      expiredEffectIds: [],
      logs: [],
      isEntityDead: false,
      preventedAction: false,
    };

    if (!target.activeEffects || target.activeEffects.length === 0) {
      return result;
    }

    const survivingEffects: ActiveEffect[] = [];

    for (const effect of target.activeEffects) {
      const def = this.registry.getEffect(effect.id);

      // Check action inhibitions
      if (effect.inhibitions?.preventMovement || effect.inhibitions?.preventAttack) {
        result.preventedAction = true;
      }

      // 1. Process Damage Over Time (DoT)
      if (effect.damagePerTurn && effect.damagePerTurn > 0) {
        const dotDamage = effect.damagePerTurn * effect.stacks;
        target.hp = Math.max(0, target.hp - dotDamage);
        result.damageTaken += dotDamage;

        if (def?.onTickLog) {
          result.logs.push(def.onTickLog(target.name, dotDamage));
        } else {
          result.logs.push(`${target.name} suffered ${dotDamage} ${effect.damageType || ''} damage from ${effect.name}!`);
        }
      }

      // 2. Process Heal Over Time (HoT)
      if (effect.healPerTurn && effect.healPerTurn > 0) {
        const heal = effect.healPerTurn * effect.stacks;
        const actualHeal = Math.min(target.maxHp - target.hp, heal);
        target.hp = Math.min(target.maxHp, target.hp + heal);
        result.healingReceived += actualHeal;

        if (def?.onTickLog) {
          result.logs.push(def.onTickLog(target.name, actualHeal));
        } else {
          result.logs.push(`${target.name} regenerated ${actualHeal} HP from ${effect.name}!`);
        }
      }

      // 3. Decrement duration
      effect.duration -= 1;

      // 4. Check for expiration
      if (effect.duration <= 0) {
        result.expiredEffectIds.push(effect.id);
        if (def?.onExpireLog) {
          result.logs.push(def.onExpireLog(target.name));
        }
      } else {
        survivingEffects.push(effect);
      }
    }

    target.activeEffects = survivingEffects;
    result.isEntityDead = target.hp <= 0;

    return result;
  }

  /**
   * Absorbs incoming damage using active shield effects before damage touches health
   */
  public absorbDamageWithShield(
    target: EffectTarget,
    incomingDamage: number
  ): { remainingDamage: number; absorbedDamage: number; logs: string[] } {
    let remainingDamage = incomingDamage;
    let totalAbsorbed = 0;
    const logs: string[] = [];

    if (!target.activeEffects || incomingDamage <= 0) {
      return { remainingDamage, absorbedDamage: 0, logs };
    }

    for (const effect of target.activeEffects) {
      if (remainingDamage <= 0) break;

      if (effect.shieldCurrent && effect.shieldCurrent > 0) {
        const absorb = Math.min(effect.shieldCurrent, remainingDamage);
        effect.shieldCurrent -= absorb;
        remainingDamage -= absorb;
        totalAbsorbed += absorb;

        logs.push(`🛡️ ${effect.name} absorbed ${absorb} damage on ${target.name}!`);

        // If shield broke completely
        if (effect.shieldCurrent <= 0) {
          logs.push(`💥 ${effect.name} shattered!`);
          this.removeEffect(target, effect.id);
        }
      }
    }

    return {
      remainingDamage,
      absorbedDamage: totalAbsorbed,
      logs,
    };
  }

  /**
   * Aggregates all stat modifiers across active effects on an entity
   */
  public aggregateStatModifiers(target: EffectTarget): Required<EffectStatModifiers> {
    const aggregate: Required<EffectStatModifiers> = {
      atk: 0,
      def: 0,
      crit: 0,
      speed: 0,
      lck: 0,
      evasion: 0,
      maxHpBonus: 0,
      maxMpBonus: 0,
    };

    if (!target.activeEffects) return aggregate;

    for (const effect of target.activeEffects) {
      if (effect.statModifiers) {
        if (effect.statModifiers.atk) aggregate.atk += effect.statModifiers.atk;
        if (effect.statModifiers.def) aggregate.def += effect.statModifiers.def;
        if (effect.statModifiers.crit) aggregate.crit += effect.statModifiers.crit;
        if (effect.statModifiers.speed) aggregate.speed += effect.statModifiers.speed;
        if (effect.statModifiers.lck) aggregate.lck += effect.statModifiers.lck;
        if (effect.statModifiers.evasion) aggregate.evasion += effect.statModifiers.evasion;
        if (effect.statModifiers.maxHpBonus) aggregate.maxHpBonus += effect.statModifiers.maxHpBonus;
        if (effect.statModifiers.maxMpBonus) aggregate.maxMpBonus += effect.statModifiers.maxMpBonus;
      }
    }

    return aggregate;
  }

  /**
   * Inspects all active effects to determine action inhibitions on an entity
   */
  public checkInhibitions(target: EffectTarget): {
    canMove: boolean;
    canAttack: boolean;
    canCast: boolean;
    canUseItems: boolean;
    isStunned: boolean;
    isFrozen: boolean;
    isSlowed: boolean;
  } {
    let preventMovement = false;
    let preventAttack = false;
    let preventAbilities = false;
    let preventItemUse = false;

    let isStunned = false;
    let isFrozen = false;
    let isSlowed = false;

    if (target.activeEffects) {
      for (const effect of target.activeEffects) {
        if (effect.id === 'stun') isStunned = true;
        if (effect.id === 'freezing') isFrozen = true;
        if (effect.id === 'slow') isSlowed = true;

        if (effect.inhibitions) {
          if (effect.inhibitions.preventMovement) preventMovement = true;
          if (effect.inhibitions.preventAttack) preventAttack = true;
          if (effect.inhibitions.preventAbilities) preventAbilities = true;
          if (effect.inhibitions.preventItemUse) preventItemUse = true;
        }
      }
    }

    return {
      canMove: !preventMovement,
      canAttack: !preventAttack,
      canCast: !preventAbilities,
      canUseItems: !preventItemUse,
      isStunned,
      isFrozen,
      isSlowed,
    };
  }
}
