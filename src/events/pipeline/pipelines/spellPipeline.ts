/**
 * Standard Action Pipeline for Spellcasting.
 * Intercepts mana costs, silence effects, elemental empowerment, and cooldowns.
 */

import { HookPipeline } from '../HookPipeline';
import { SpellCastContext } from '../pipelineTypes';

export const spellPipeline = new HookPipeline<SpellCastContext>('spell');

spellPipeline.use(
  'core:mana_cost_assembly',
  (ctx, next) => {
    let cost = ctx.baseManaCost * (ctx.manaCostMultiplier || 1.0);
    ctx.finalManaCost = Math.max(0, Math.round(cost));
    next();
  },
  0,
  'core'
);

export function executeSpellPipeline(initial: Partial<SpellCastContext>): SpellCastContext {
  const context: SpellCastContext = {
    casterId: initial.casterId || 'player',
    spellId: initial.spellId || 'spark',
    spellName: initial.spellName || 'Arcane Spark',
    baseManaCost: initial.baseManaCost ?? 5,
    manaCostMultiplier: initial.manaCostMultiplier ?? 1.0,
    finalManaCost: initial.baseManaCost ?? 5,
    targetX: initial.targetX,
    targetY: initial.targetY,
    elementalEmpowerment: initial.elementalEmpowerment,
    cooldownTurns: initial.cooldownTurns ?? 0,
    prevented: Boolean(initial.prevented),
    preventReason: initial.preventReason,
    cancelled: false,
    metadata: initial.metadata || {},
  };

  return spellPipeline.execute(context);
}
