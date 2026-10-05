/**
 * Standard Action Pipeline for Actor Movement and Traversal checks.
 * Intercepts terrain hindrance, freeze/stun statuses, stamina costs, and stealth detection.
 */

import { HookPipeline } from '../HookPipeline';
import { MovementContext } from '../pipelineTypes';

export const movementPipeline = new HookPipeline<MovementContext>('movement');

// Core terrain & stamina cost middleware
movementPipeline.use(
  'core:terrain_cost',
  (ctx, next) => {
    let cost = 1;
    if (ctx.terrainType === 'water' || ctx.terrainType === 'shallow_water') {
      cost = 2;
      ctx.modifiers.push('Wading through water (+1 stamina)');
    } else if (ctx.terrainType === 'mountain' || ctx.terrainType === 'snow') {
      cost = 2;
      ctx.modifiers.push('Rough terrain (+1 stamina)');
    }
    ctx.staminaCost = cost;
    next();
  },
  10,
  'core'
);

export function executeMovementPipeline(initial: Partial<MovementContext>): MovementContext {
  const context: MovementContext = {
    actorId: initial.actorId || 'player',
    isPlayer: initial.isPlayer ?? true,
    fromX: initial.fromX ?? 0,
    fromY: initial.fromY ?? 0,
    toX: initial.toX ?? 0,
    toY: initial.toY ?? 0,
    terrainType: initial.terrainType || 'grass',
    staminaCost: initial.staminaCost ?? 1,
    blocked: Boolean(initial.blocked),
    blockReason: initial.blockReason,
    modifiers: [...(initial.modifiers || [])],
    cancelled: false,
    metadata: initial.metadata || {},
  };

  return movementPipeline.execute(context);
}
