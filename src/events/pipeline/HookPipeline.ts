/**
 * Composable, priority-ordered synchronous middleware pipeline (Koa/Express onion-ring pattern).
 * Used for action interceptors (Damage, Movement, Loot, Spellcasting).
 */

import { BasePipelineContext, PipelineMiddleware, RegisteredMiddleware } from './pipelineTypes';

export class HookPipeline<TContext extends BasePipelineContext> {
  private middlewares: RegisteredMiddleware<TContext>[] = [];
  private executionCount = 0;
  private totalExecutionTimeMs = 0;

  constructor(public readonly name: string) {}

  /**
   * Register a middleware to intercept and mutate context.
   * Higher priority numbers run earlier (default: 0).
   * Returns an unregister function.
   */
  public use(
    id: string,
    middleware: PipelineMiddleware<TContext>,
    priority = 0,
    tag?: string
  ): () => void {
    // Replace if already registered with same ID
    this.remove(id);

    this.middlewares.push({ id, priority, middleware, tag });
    this.middlewares.sort((a, b) => b.priority - a.priority);

    return () => this.remove(id);
  }

  /**
   * Remove a middleware by its ID.
   */
  public remove(id: string): void {
    this.middlewares = this.middlewares.filter((m) => m.id !== id);
  }

  /**
   * Clear all registered middlewares.
   */
  public clear(): void {
    this.middlewares = [];
    this.executionCount = 0;
    this.totalExecutionTimeMs = 0;
  }

  /**
   * Execute the pipeline sequentially through all registered middlewares.
   * If any middleware sets context.cancelled = true, subsequent stages are bypassed.
   */
  public execute(context: TContext): TContext {
    const startTime = performance.now();
    let index = 0;

    const next = () => {
      if (context.cancelled) {
        return;
      }

      if (index < this.middlewares.length) {
        const item = this.middlewares[index++];
        try {
          item.middleware(context, next);
        } catch (err) {
          console.error(`[HookPipeline:${this.name}] Error in middleware '${item.id}':`, err);
          // Auto-advance so faulty plugin doesn't hang pipeline
          next();
        }
      }
    };

    next();

    const elapsed = performance.now() - startTime;
    this.executionCount++;
    this.totalExecutionTimeMs += elapsed;

    return context;
  }

  public getMiddlewares(): ReadonlyArray<{ id: string; priority: number; tag?: string }> {
    return this.middlewares.map((m) => ({ id: m.id, priority: m.priority, tag: m.tag }));
  }

  public getStats(): { name: string; middlewareCount: number; executionCount: number; avgTimeMs: number } {
    return {
      name: this.name,
      middlewareCount: this.middlewares.length,
      executionCount: this.executionCount,
      avgTimeMs: this.executionCount > 0 ? Number((this.totalExecutionTimeMs / this.executionCount).toFixed(4)) : 0,
    };
  }
}
