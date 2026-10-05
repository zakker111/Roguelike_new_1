/**
 * Declarative Hook Registry for extreme modifiability.
 * Provides a unified entry point for relics, traits, scars, and runtime mod plugins
 * to inject listeners into the EventBus or middlewares into Action Pipelines.
 */

import { gameEventBus } from '../core/EventBus';
import { EventPriority, GameEventType, GameEventPayloadMap } from '../types';
import { damagePipeline } from '../pipeline/pipelines/damagePipeline';
import { movementPipeline } from '../pipeline/pipelines/movementPipeline';
import { lootPipeline } from '../pipeline/pipelines/lootPipeline';
import { spellPipeline } from '../pipeline/pipelines/spellPipeline';
import { DamageContext, MovementContext, LootContext, SpellCastContext, PipelineMiddleware } from '../pipeline/pipelineTypes';

export type PipelineType = 'damage' | 'movement' | 'loot' | 'spell';

export interface HookRegistrationOptions<TContext extends object = any> {
  id: string;
  priority?: number;
  tag?: string;
  description?: string;
  handler: PipelineMiddleware<TContext>;
}

export interface RegisteredHookSummary {
  pipeline: PipelineType;
  id: string;
  priority: number;
  tag?: string;
  description?: string;
}

export class HookRegistryEngine {
  private registeredHookSummaries: Map<string, RegisteredHookSummary> = new Map();

  /**
   * Register a middleware hook into an action pipeline.
   */
  public registerDamageHook(options: HookRegistrationOptions<DamageContext>): () => void {
    const unbind = damagePipeline.use(options.id, options.handler, options.priority ?? 0, options.tag);
    const key = `damage:${options.id}`;
    this.registeredHookSummaries.set(key, {
      pipeline: 'damage',
      id: options.id,
      priority: options.priority ?? 0,
      tag: options.tag,
      description: options.description,
    });

    return () => {
      unbind();
      this.registeredHookSummaries.delete(key);
    };
  }

  public registerMovementHook(options: HookRegistrationOptions<MovementContext>): () => void {
    const unbind = movementPipeline.use(options.id, options.handler, options.priority ?? 0, options.tag);
    const key = `movement:${options.id}`;
    this.registeredHookSummaries.set(key, {
      pipeline: 'movement',
      id: options.id,
      priority: options.priority ?? 0,
      tag: options.tag,
      description: options.description,
    });

    return () => {
      unbind();
      this.registeredHookSummaries.delete(key);
    };
  }

  public registerLootHook(options: HookRegistrationOptions<LootContext>): () => void {
    const unbind = lootPipeline.use(options.id, options.handler, options.priority ?? 0, options.tag);
    const key = `loot:${options.id}`;
    this.registeredHookSummaries.set(key, {
      pipeline: 'loot',
      id: options.id,
      priority: options.priority ?? 0,
      tag: options.tag,
      description: options.description,
    });

    return () => {
      unbind();
      this.registeredHookSummaries.delete(key);
    };
  }

  public registerSpellHook(options: HookRegistrationOptions<SpellCastContext>): () => void {
    const unbind = spellPipeline.use(options.id, options.handler, options.priority ?? 0, options.tag);
    const key = `spell:${options.id}`;
    this.registeredHookSummaries.set(key, {
      pipeline: 'spell',
      id: options.id,
      priority: options.priority ?? 0,
      tag: options.tag,
      description: options.description,
    });

    return () => {
      unbind();
      this.registeredHookSummaries.delete(key);
    };
  }

  /**
   * Register a game event listener directly through the registry.
   */
  public registerEventListener<K extends keyof GameEventPayloadMap | string>(
    eventType: K,
    callback: (payload: K extends keyof GameEventPayloadMap ? GameEventPayloadMap[K] : any) => void,
    options: { priority?: EventPriority; tag?: string } = {}
  ): () => void {
    const sub = gameEventBus.on(eventType as any, callback, options);
    return () => sub.unsubscribe();
  }

  /**
   * Unregister a hook by pipeline and ID.
   */
  public unregisterHook(pipeline: PipelineType, id: string): void {
    if (pipeline === 'damage') damagePipeline.remove(id);
    else if (pipeline === 'movement') movementPipeline.remove(id);
    else if (pipeline === 'loot') lootPipeline.remove(id);
    else if (pipeline === 'spell') spellPipeline.remove(id);

    this.registeredHookSummaries.delete(`${pipeline}:${id}`);
  }

  /**
   * Get all registered custom hooks for diagnostics or mod inspection.
   */
  public getRegisteredHooks(): RegisteredHookSummary[] {
    return Array.from(this.registeredHookSummaries.values());
  }

  /**
   * Reset all registries (for testing or game reload).
   */
  public reset(): void {
    damagePipeline.clear();
    movementPipeline.clear();
    lootPipeline.clear();
    spellPipeline.clear();
    this.registeredHookSummaries.clear();
  }
}

export const hookRegistry = new HookRegistryEngine();
