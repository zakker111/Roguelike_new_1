/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIStrategyRegistry } from './AIStrategyRegistry';
import { AIActionDecision, AIStrategyContext, IAIStrategy } from './types';
import { LivingEntity, BaseEntity } from '../entities/types';
import { AbilityExecutor } from '../abilities/AbilityExecutor';
import { AbilityExecutionContext } from '../abilities/types';

export interface AIExecutionResult {
  decision: AIActionDecision;
  executed: boolean;
  message?: string;
}

/**
 * Universal coordinator and executor for AI turns.
 * Bridges declarative AI strategies, entity states, and the ability/combat systems.
 */
export class AIManager {
  private static instance: AIManager;
  private registry: AIStrategyRegistry;

  constructor(registry: AIStrategyRegistry = AIStrategyRegistry.getInstance()) {
    this.registry = registry;
  }

  public static getInstance(): AIManager {
    if (!AIManager.instance) {
      AIManager.instance = new AIManager();
    }
    return AIManager.instance;
  }

  /**
   * Plans the next turn action for an actor entity based on its configured aiRole
   */
  public planAction(context: AIStrategyContext): AIActionDecision {
    const aiRole = (context.actor as any).aiRole as string | undefined;
    const strategy = this.registry.resolve(aiRole);
    return strategy.decide(context);
  }

  /**
   * Plans and applies standard execution for the planned action
   */
  public executeTurn(
    context: AIStrategyContext,
    callbacks?: {
      onMove?: (actor: LivingEntity, newX: number, newY: number, delta: { dx: number; dy: number }) => void;
      onAttack?: (actor: LivingEntity, target: BaseEntity) => void;
      onAbility?: (actor: LivingEntity, abilityId: string, target?: BaseEntity, targetPos?: { x: number; y: number }) => void;
      onWait?: (actor: LivingEntity) => void;
    }
  ): AIExecutionResult {
    const decision = this.planAction(context);
    const { actor } = context;

    switch (decision.type) {
      case 'move':
      case 'flee': {
        if (decision.targetPos && decision.delta) {
          if (callbacks?.onMove) {
            callbacks.onMove(actor, decision.targetPos.x, decision.targetPos.y, decision.delta);
          } else {
            actor.x = decision.targetPos.x;
            actor.y = decision.targetPos.y;
          }
          return { decision, executed: true, message: decision.reason };
        }
        return { decision, executed: false, message: 'Move target missing.' };
      }

      case 'attack': {
        if (decision.targetEntity) {
          if (callbacks?.onAttack) {
            callbacks.onAttack(actor, decision.targetEntity);
          }
          return { decision, executed: true, message: decision.reason };
        }
        return { decision, executed: false, message: 'Attack target missing.' };
      }

      case 'ability': {
        if (decision.abilityId) {
          if (callbacks?.onAbility) {
            callbacks.onAbility(actor, decision.abilityId, decision.targetEntity, decision.targetPos);
          } else {
            // Default: attempt execution via AbilityExecutor if state and target exist
            const abilityCtx: AbilityExecutionContext = {
              source: actor,
              target: decision.targetEntity as any,
              targetPos: decision.targetPos
            };
            AbilityExecutor.execute(decision.abilityId, undefined, abilityCtx);
          }
          return { decision, executed: true, message: decision.reason };
        }
        return { decision, executed: false, message: 'Ability ID missing.' };
      }

      case 'wait':
      default: {
        if (callbacks?.onWait) {
          callbacks.onWait(actor);
        }
        return { decision, executed: true, message: decision.reason };
      }
    }
  }
}
