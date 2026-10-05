/**
 * Standard Action Pipeline for Combat Damage calculations.
 * Relics, traits, weather, and custom mods can intercept and mutate damage.
 */

import { HookPipeline } from '../HookPipeline';
import { DamageContext } from '../pipelineTypes';

export const damagePipeline = new HookPipeline<DamageContext>('damage');

// Register baseline core calculation middlewares
damagePipeline.use(
  'core:crit_and_combo',
  (ctx, next) => {
    let damage = ctx.baseDamage;
    if (ctx.isCrit && !ctx.metadata?.critAlreadyApplied) {
      damage *= ctx.critMultiplier || 1.5;
      ctx.flavorNotes.push('CRITICAL STRIKE');
    }
    if (ctx.comboMultiplier > 1 && !ctx.metadata?.comboAlreadyApplied) {
      damage *= ctx.comboMultiplier;
      ctx.flavorNotes.push(`COMBO x${ctx.comboMultiplier.toFixed(1)}`);
    }
    ctx.finalDamage = damage;
    next();
  },
  100,
  'core'
);

damagePipeline.use(
  'core:catalyst_and_flat',
  (ctx, next) => {
    if (ctx.catalystBonus > 0) {
      ctx.finalDamage += ctx.catalystBonus;
      ctx.flavorNotes.push(`Catalyst +${ctx.catalystBonus}`);
    }
    if (ctx.flatBonus) {
      ctx.finalDamage += ctx.flatBonus;
    }
    next();
  },
  50,
  'core'
);

damagePipeline.use(
  'core:armor_soak',
  (ctx, next) => {
    if (ctx.armorReduction > 0 && ctx.damageType === 'physical') {
      const soaked = Math.min(ctx.finalDamage - 1, ctx.armorReduction);
      ctx.finalDamage -= soaked;
      if (soaked > 0) {
        ctx.flavorNotes.push(`Armor Soaked -${Math.round(soaked)}`);
      }
    }
    // Final clamp: damage cannot drop below 1 unless fully cancelled/dodged
    ctx.finalDamage = Math.max(1, Math.round(ctx.finalDamage));
    next();
  },
  -50,
  'core'
);

/**
 * Execute damage pipeline with sensible defaults.
 */
export function executeDamagePipeline(initial: Partial<DamageContext>): DamageContext {
  const context: DamageContext = {
    attackerId: initial.attackerId || 'unknown',
    targetId: initial.targetId || 'unknown',
    attackerName: initial.attackerName || 'Attacker',
    targetName: initial.targetName || 'Target',
    isPlayerAttacker: Boolean(initial.isPlayerAttacker),
    baseDamage: Math.max(1, initial.baseDamage ?? 10),
    damageType: initial.damageType || 'physical',
    isCrit: Boolean(initial.isCrit),
    critMultiplier: initial.critMultiplier || 1.5,
    comboMultiplier: initial.comboMultiplier || 1.0,
    catalystBonus: initial.catalystBonus || 0,
    armorReduction: initial.armorReduction || 0,
    flatBonus: initial.flatBonus || 0,
    finalDamage: initial.baseDamage ?? 10,
    cancelled: false,
    flavorNotes: [...(initial.flavorNotes || [])],
    metadata: initial.metadata || {},
  };

  return damagePipeline.execute(context);
}
