/**
 * Standard Action Pipeline for Loot and Gold distribution.
 * Intercepts luck stat, magic find relics, cursed items, and bonus drops.
 */

import { HookPipeline } from '../HookPipeline';
import { LootContext } from '../pipelineTypes';

export const lootPipeline = new HookPipeline<LootContext>('loot');

lootPipeline.use(
  'core:luck_and_gold_multiplier',
  (ctx, next) => {
    let gold = ctx.baseGold * (ctx.goldMultiplier || 1.0);
    if (ctx.luckScore > 10) {
      const bonusPct = (ctx.luckScore - 10) * 0.05; // 5% per point above 10
      gold *= (1 + bonusPct);
    }
    ctx.finalGold = Math.max(1, Math.round(gold));
    next();
  },
  0,
  'core'
);

export function executeLootPipeline(initial: Partial<LootContext>): LootContext {
  const context: LootContext = {
    sourceEntityId: initial.sourceEntityId || 'unknown',
    sourceEntityName: initial.sourceEntityName || 'Entity',
    killerId: initial.killerId || 'player',
    isPlayerKiller: initial.isPlayerKiller ?? true,
    baseGold: initial.baseGold ?? 10,
    goldMultiplier: initial.goldMultiplier ?? 1.0,
    luckScore: initial.luckScore ?? 10,
    itemDropChanceMultiplier: initial.itemDropChanceMultiplier ?? 1.0,
    bonusLootTableIds: [...(initial.bonusLootTableIds || [])],
    finalGold: initial.baseGold ?? 10,
    cancelled: false,
    metadata: initial.metadata || {},
  };

  return lootPipeline.execute(context);
}
