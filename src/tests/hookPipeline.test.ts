/**
 * Unit test suite for HookPipeline, action mutators, and HookRegistry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HookPipeline } from '../events/pipeline/HookPipeline';
import { DamageContext, MovementContext, LootContext, SpellCastContext } from '../events/pipeline/pipelineTypes';
import { executeDamagePipeline, damagePipeline } from '../events/pipeline/pipelines/damagePipeline';
import { executeMovementPipeline, movementPipeline } from '../events/pipeline/pipelines/movementPipeline';
import { executeLootPipeline, lootPipeline } from '../events/pipeline/pipelines/lootPipeline';
import { executeSpellPipeline, spellPipeline } from '../events/pipeline/pipelines/spellPipeline';
import { hookRegistry } from '../events/registry/HookRegistry';

describe('HookPipeline & Action Mutators', () => {
  it('executes middleware in priority order and modifies context', () => {
    interface TestContext {
      cancelled?: boolean;
      value: number;
      trace: string[];
    }

    const pipeline = new HookPipeline<TestContext>('test');

    pipeline.use('low_priority', (ctx, next) => {
      ctx.trace.push('low');
      ctx.value += 1;
      next();
    }, -10);

    pipeline.use('high_priority', (ctx, next) => {
      ctx.trace.push('high');
      ctx.value *= 2;
      next();
    }, 10);

    const result = pipeline.execute({ value: 5, trace: [] });

    expect(result.trace).toEqual(['high', 'low']);
    expect(result.value).toBe(11); // 5 * 2 = 10, + 1 = 11
  });

  it('halts pipeline execution early when context.cancelled is set', () => {
    interface TestContext {
      cancelled?: boolean;
      cancelReason?: string;
      value: number;
    }

    const pipeline = new HookPipeline<TestContext>('test_cancel');

    pipeline.use('blocker', (ctx, next) => {
      ctx.cancelled = true;
      ctx.cancelReason = 'Blocked by barrier';
      next();
    }, 100);

    pipeline.use('downstream', (ctx, next) => {
      ctx.value += 100;
      next();
    }, 0);

    const result = pipeline.execute({ value: 10 });

    expect(result.cancelled).toBe(true);
    expect(result.cancelReason).toBe('Blocked by barrier');
    expect(result.value).toBe(10); // Downstream bypassed!
  });

  it('calculates damage through standard damage pipeline', () => {
    const res = executeDamagePipeline({
      baseDamage: 20,
      isCrit: true,
      critMultiplier: 2.0,
      catalystBonus: 5,
      armorReduction: 10,
    });

    // 20 * 2 = 40, + 5 = 45, - 10 = 35
    expect(res.finalDamage).toBe(35);
    expect(res.flavorNotes).toContain('CRITICAL STRIKE');
    expect(res.flavorNotes).toContain('Catalyst +5');
  });

  it('calculates movement stamina cost and modifiers through movement pipeline', () => {
    const waterStep = executeMovementPipeline({
      terrainType: 'water',
    });
    expect(waterStep.staminaCost).toBe(2);
    expect(waterStep.modifiers.some((m) => m.includes('water'))).toBe(true);

    const normalStep = executeMovementPipeline({
      terrainType: 'grass',
    });
    expect(normalStep.staminaCost).toBe(1);
  });

  it('multiplies loot and gold through loot pipeline', () => {
    const lootRes = executeLootPipeline({
      baseGold: 50,
      luckScore: 14, // 4 points above 10 = +20% gold
    });

    expect(lootRes.finalGold).toBe(60);
  });

  it('allows dynamic registration of custom relic mod hooks via HookRegistry', () => {
    const unregister = hookRegistry.registerDamageHook({
      id: 'relic_vampiric_ember',
      priority: 200,
      tag: 'relic',
      handler: (ctx, next) => {
        ctx.baseDamage += 15;
        ctx.flavorNotes.push('Vampiric Ember +15');
        next();
      },
    });

    const withRelic = executeDamagePipeline({
      baseDamage: 10,
      armorReduction: 0,
    });

    expect(withRelic.finalDamage).toBe(25);
    expect(withRelic.flavorNotes).toContain('Vampiric Ember +15');

    // Clean up
    unregister();

    const withoutRelic = executeDamagePipeline({
      baseDamage: 10,
      armorReduction: 0,
    });

    expect(withoutRelic.finalDamage).toBe(10);
  });
});
