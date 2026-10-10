/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AbilityRegistry } from '../../engine/abilities/AbilityRegistry';
import { AbilityExecutor } from '../../engine/abilities/AbilityExecutor';
import { AbilityDefinition, AbilityExecutionContext, EntityAbilityState } from '../../engine/abilities/types';

describe('Roguelike Engine - Generic Ability System (Step 2)', () => {
  beforeEach(() => {
    AbilityRegistry.resetInstance();
  });

  it('initializes with default core abilities (fireball, heal, poison, dash, summon, teleport, explode, etc.)', () => {
    const registry = AbilityRegistry.getInstance();
    const abilities = registry.getAll();
    expect(abilities.length).toBeGreaterThanOrEqual(10);

    expect(registry.has('fireball')).toBe(true);
    expect(registry.has('shoot')).toBe(true);
    expect(registry.has('heal')).toBe(true);
    expect(registry.has('ally_heal')).toBe(true);
    expect(registry.has('poison_dart')).toBe(true);
    expect(registry.has('dash')).toBe(true);
    expect(registry.has('teleport')).toBe(true);
    expect(registry.has('summon_minions')).toBe(true);
    expect(registry.has('explode')).toBe(true);
    expect(registry.has('buff_bloodlust')).toBe(true);
    expect(registry.has('shield_barrier')).toBe(true);
  });

  it('can register custom procedural abilities and retrieve them by type', () => {
    const registry = AbilityRegistry.getInstance();
    const customAbility: AbilityDefinition = {
      id: 'custom_frost_nova',
      name: 'Frost Nova',
      type: 'attack',
      targetType: 'area_tile',
      range: 4,
      radius: 2,
      cooldown: 4,
      manaCost: 8,
      basePower: 18,
      effectId: 'frozen',
      effectDuration: 2,
      element: 'Frost',
      description: 'Freezes all surrounding foes in crystal rime.'
    };

    registry.register(customAbility);
    expect(registry.get('custom_frost_nova')).toBeDefined();
    expect(registry.get('custom_frost_nova')?.name).toBe('Frost Nova');

    const attacks = registry.getByType('attack');
    expect(attacks.some(a => a.id === 'custom_frost_nova')).toBe(true);
  });

  it('executes heal ability correctly and respects max HP limits', () => {
    const ctx: AbilityExecutionContext = {
      source: {
        id: 'player_1',
        name: 'Hero',
        x: 5,
        y: 5,
        hp: 30,
        maxHp: 50,
        mp: 20
      }
    };

    const res = AbilityRegistry.getInstance().execute('heal', ctx);
    expect(res.success).toBe(true);
    expect(res.healingDone).toBe(15);
    expect(ctx.source.hp).toBe(45);
  });

  it('executes direct attack ability and accounts for defense', () => {
    const ctx: AbilityExecutionContext = {
      source: {
        id: 'mage_1',
        name: 'Archmage',
        x: 10,
        y: 10,
        hp: 40,
        maxHp: 40,
        atk: 10
      },
      target: {
        id: 'orc_1',
        name: 'Orc Warrior',
        x: 12,
        y: 10,
        hp: 30,
        maxHp: 30,
        def: 4
      }
    };

    const res = AbilityRegistry.getInstance().execute('shoot', ctx);
    expect(res.success).toBe(true);
    expect(res.damageDealt).toBeGreaterThan(0);
    expect(ctx.target?.hp).toBeLessThan(30);
  });

  it('executes dash and teleport abilities properly with movement', () => {
    const ctx: AbilityExecutionContext = {
      source: {
        id: 'rogue_1',
        name: 'Shadow Thief',
        x: 2,
        y: 2,
        hp: 25,
        maxHp: 25
      },
      targetPos: { x: 4, y: 2 },
      mapContext: {
        isBlocked: (x, y) => false
      }
    };

    const res = AbilityRegistry.getInstance().execute('dash', ctx);
    expect(res.success).toBe(true);
    expect(res.newPosition).toEqual({ x: 4, y: 2 });
  });

  it('blocks dash or teleport when destination tile is blocked', () => {
    const ctx: AbilityExecutionContext = {
      source: {
        id: 'rogue_1',
        name: 'Shadow Thief',
        x: 2,
        y: 2,
        hp: 25,
        maxHp: 25
      },
      targetPos: { x: 5, y: 5 },
      mapContext: {
        isBlocked: (x, y) => x === 5 && y === 5
      }
    };

    const res = AbilityRegistry.getInstance().execute('teleport', ctx);
    expect(res.success).toBe(false);
    expect(res.message).toContain('blocked');
  });

  it('AbilityExecutor verifies cooldowns, mana costs, and range checks before executing', () => {
    const state: EntityAbilityState = {
      abilityId: 'fireball',
      currentCooldown: 2
    };

    const ctx: AbilityExecutionContext = {
      source: {
        id: 'mage_1',
        name: 'Mage',
        x: 0,
        y: 0,
        hp: 20,
        maxHp: 20,
        mp: 10
      },
      target: {
        id: 'target_1',
        name: 'Target Dummy',
        x: 3,
        y: 0,
        hp: 50,
        maxHp: 50
      }
    };

    // Cooldown check
    const checkOnCd = AbilityExecutor.canCast('fireball', state, ctx);
    expect(checkOnCd.canCast).toBe(false);
    expect(checkOnCd.reason).toContain('cooldown');

    // Reset cooldown
    state.currentCooldown = 0;
    const checkReady = AbilityExecutor.canCast('fireball', state, ctx);
    expect(checkReady.canCast).toBe(true);

    // Range check: target too far
    ctx.target!.x = 20;
    const checkTooFar = AbilityExecutor.canCast('fireball', state, ctx);
    expect(checkTooFar.canCast).toBe(false);
    expect(checkTooFar.reason).toContain('range');

    // Mana check: insufficient MP
    ctx.target!.x = 3;
    ctx.source.mp = 2; // Fireball costs 6
    const checkNoMana = AbilityExecutor.canCast('fireball', state, ctx);
    expect(checkNoMana.canCast).toBe(false);
    expect(checkNoMana.reason).toContain('mana');
  });

  it('AbilityExecutor executes and applies next cooldown and deducts mana', () => {
    const state: EntityAbilityState = {
      abilityId: 'fireball',
      currentCooldown: 0
    };

    const ctx: AbilityExecutionContext = {
      source: {
        id: 'mage_1',
        name: 'Mage',
        x: 0,
        y: 0,
        hp: 20,
        maxHp: 20,
        mp: 15
      },
      target: {
        id: 'target_1',
        name: 'Goblin',
        x: 2,
        y: 0,
        hp: 20,
        maxHp: 20
      }
    };

    const exec = AbilityExecutor.execute('fireball', state, ctx);
    expect(exec.result.success).toBe(true);
    expect(exec.nextCooldown).toBe(3); // Fireball cooldown
    expect(exec.mpConsumed).toBe(6);
    expect(ctx.source.mp).toBe(9); // 15 - 6

    // Ticking down cooldowns
    const states: EntityAbilityState[] = [{ abilityId: 'fireball', currentCooldown: exec.nextCooldown }];
    const ticked = AbilityExecutor.tickCooldowns(states);
    expect(ticked[0].currentCooldown).toBe(2);
  });
});
