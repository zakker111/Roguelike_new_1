/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAIStrategy, AIStrategyId } from './types';
import {
  MeleeStrategy,
  RangedStrategy,
  KitingStrategy,
  CowardStrategy,
  AggressiveStrategy,
  DefensiveStrategy,
  SummonerStrategy,
  PatrolStrategy,
  BossStrategy
} from './strategies';

/**
 * Singleton Registry for all pluggable AI strategies in the roguelike engine.
 * Allows entities and enemies to select their runtime behavior purely through data (e.g. aiRole: 'kiting').
 */
export class AIStrategyRegistry {
  private static instance: AIStrategyRegistry;
  private strategies = new Map<string, IAIStrategy>();

  constructor() {
    this.registerDefaults();
  }

  public static getInstance(): AIStrategyRegistry {
    if (!AIStrategyRegistry.instance) {
      AIStrategyRegistry.instance = new AIStrategyRegistry();
    }
    return AIStrategyRegistry.instance;
  }

  public static resetInstance(): void {
    (AIStrategyRegistry as any).instance = null;
  }

  private registerDefaults(): void {
    this.register(new MeleeStrategy());
    this.register(new RangedStrategy());
    this.register(new KitingStrategy());
    this.register(new CowardStrategy());
    this.register(new AggressiveStrategy());
    this.register(new DefensiveStrategy());
    this.register(new SummonerStrategy());
    this.register(new PatrolStrategy());
    this.register(new BossStrategy());

    // Register common aliases matching existing engine aiRoles
    const melee = this.get('melee')!;
    const kiting = this.get('kiting')!;
    const coward = this.get('coward')!;
    const defensive = this.get('defensive')!;

    if (melee) {
      this.strategies.set('ambusher', melee);
    }
    if (kiting) {
      this.strategies.set('skirmisher_kiting', kiting);
      this.strategies.set('skirmisher', kiting);
    }
    if (coward) {
      this.strategies.set('coward_flee', coward);
      this.strategies.set('passive', coward);
      this.strategies.set('flee', coward);
    }
    if (defensive) {
      this.strategies.set('tank', defensive);
      this.strategies.set('guardian', defensive);
    }

    const summoner = this.get('summoner');
    if (summoner) {
      this.strategies.set('support_healer', summoner);
      this.strategies.set('support_buffer', summoner);
      this.strategies.set('support', summoner);
      this.strategies.set('healer', summoner);
    }
  }

  /**
   * Registers a new or custom AIStrategy
   */
  public register(strategy: IAIStrategy): void {
    this.strategies.set(strategy.id.toLowerCase(), strategy);
  }

  /**
   * Retrieves a strategy by id/role
   */
  public get(id: string): IAIStrategy | undefined {
    return this.strategies.get(id.toLowerCase());
  }

  /**
   * Checks if a strategy is registered
   */
  public has(id: string): boolean {
    return this.strategies.has(id.toLowerCase());
  }

  /**
   * Returns all registered strategy instances
   */
  public getAll(): IAIStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Lists all registered strategy IDs
   */
  public listIds(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Resolves a strategy with a safe fallback to 'melee'
   */
  public resolve(id?: string): IAIStrategy {
    if (id && this.has(id)) {
      return this.get(id)!;
    }
    return this.get('melee')!;
  }
}
