/**
 * Type contracts for action mutator pipelines and context interceptors.
 */

export interface BasePipelineContext {
  cancelled?: boolean;
  cancelReason?: string;
  metadata?: Record<string, unknown>;
}

export type PipelineNext = () => void;

export type PipelineMiddleware<TContext extends BasePipelineContext> = (
  context: TContext,
  next: PipelineNext
) => void;

export interface RegisteredMiddleware<TContext extends BasePipelineContext> {
  id: string;
  priority: number;
  middleware: PipelineMiddleware<TContext>;
  tag?: string;
}

// -------------------------------------------------------------
// Concrete Pipeline Contexts
// -------------------------------------------------------------

export interface DamageContext extends BasePipelineContext {
  attackerId: string;
  targetId: string;
  attackerName: string;
  targetName: string;
  isPlayerAttacker: boolean;
  baseDamage: number;
  damageType: 'physical' | 'fire' | 'ice' | 'shock' | 'poison' | 'arcane' | 'pure';
  isCrit: boolean;
  critMultiplier: number;
  comboMultiplier: number;
  catalystBonus: number;
  armorReduction: number;
  flatBonus: number;
  finalDamage: number;
  flavorNotes: string[];
}

export interface MovementContext extends BasePipelineContext {
  actorId: string;
  isPlayer: boolean;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  terrainType: string;
  staminaCost: number;
  blocked: boolean;
  blockReason?: string;
  modifiers: string[];
}

export interface LootContext extends BasePipelineContext {
  sourceEntityId: string;
  sourceEntityName: string;
  killerId: string;
  isPlayerKiller: boolean;
  baseGold: number;
  goldMultiplier: number;
  luckScore: number;
  itemDropChanceMultiplier: number;
  bonusLootTableIds: string[];
  finalGold: number;
}

export interface SpellCastContext extends BasePipelineContext {
  casterId: string;
  spellId: string;
  spellName: string;
  baseManaCost: number;
  manaCostMultiplier: number;
  finalManaCost: number;
  targetX?: number;
  targetY?: number;
  elementalEmpowerment?: string;
  cooldownTurns: number;
  prevented: boolean;
  preventReason?: string;
}
