/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyDefinition, SpawnEnemyOptions } from './types';
import { Enemy, EnemyState } from '../../types/entities';
import enemyData from '../../data/enemies.json';

/**
 * Singleton EnemyRegistry providing a clean, data-driven catalog of enemy definitions.
 * Conforms to Pillar 1 of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md):
 * Enemy Definition -> Enemy Registry -> Spawn Table -> Runtime Enemy -> AI -> Combat -> Rendering
 */
class EnemyRegistryClass {
  private registry = new Map<string, EnemyDefinition>();
  private aliases = new Map<string, string>();
  private initialized = false;

  constructor() {
    this.initFromCatalog();
  }

  /**
   * Initialize and bootstrap default definitions from JSON catalog
   */
  public initFromCatalog(): void {
    if (this.initialized) return;

    // Load aliases
    this.registerAlias('brute', 'OrcBrute');
    this.registerAlias('mage', 'SkeletonMage');
    this.registerAlias('rat', 'Rat');
    this.registerAlias('goblin', 'Goblin');
    this.registerAlias('giant plague rat', 'Rat');
    this.registerAlias('wolf', 'CryoStalker');
    this.registerAlias('bear', 'Otso');
    this.registerAlias('rabbit', 'Goat');

    // Register all enemies from JSON
    const dataObj = enemyData as Record<string, any>;
    for (const [key, raw] of Object.entries(dataObj)) {
      this.register({
        id: key,
        name: raw.name || key,
        baseHp: raw.baseHp ?? 10,
        baseAtk: raw.baseAtk ?? 2,
        baseDef: raw.baseDef ?? 0,
        range: raw.range ?? 1,
        speed: raw.speed ?? 1.0,
        char: raw.char || '?',
        color: raw.color || '#ffffff',
        spriteKey: raw.spriteKey,
        aiRole: raw.aiRole,
        abilities: raw.abilities || [],
        tags: raw.tags || [],
        faction: raw.faction,
        dropMaterials: raw.dropMaterials,
        dropCatalysts: raw.dropCatalysts,
        archetype: raw.archetype,
        isPrey: raw.isPrey
      });
    }

    // Register captive villager utility template
    this.register({
      id: 'captive',
      name: 'Captive Villager',
      baseHp: 15,
      baseAtk: 0,
      baseDef: 0,
      range: 1,
      speed: 1.0,
      char: '👤',
      color: '#38bdf8',
      aiRole: 'passive',
      tags: ['civilian', 'non-combatant']
    });

    this.initialized = true;
  }

  /**
   * Register or overwrite an enemy definition.
   * Can be called by mods, sci-fi expansions, or runtime content packs.
   */
  public register(definition: EnemyDefinition): void {
    this.registry.set(definition.id, definition);
    this.registry.set(definition.id.toLowerCase(), definition);
  }

  /**
   * Register an alias mapping (e.g. 'Brute' -> 'OrcBrute')
   */
  public registerAlias(alias: string, targetId: string): void {
    this.aliases.set(alias.toLowerCase(), targetId);
  }

  /**
   * Retrieve an enemy definition by ID or alias.
   */
  public get(id: string): EnemyDefinition | undefined {
    // Check direct
    let def = this.registry.get(id) || this.registry.get(id.toLowerCase());
    if (def) return def;

    // Check alias
    const aliased = this.aliases.get(id.toLowerCase());
    if (aliased) {
      def = this.registry.get(aliased) || this.registry.get(aliased.toLowerCase());
      if (def) return def;
    }

    return undefined;
  }

  /**
   * Check if an enemy definition exists
   */
  public has(id: string): boolean {
    return this.get(id) !== undefined;
  }

  /**
   * Returns all registered enemy definitions
   */
  public getAll(): EnemyDefinition[] {
    const unique = new Map<string, EnemyDefinition>();
    for (const def of this.registry.values()) {
      unique.set(def.id, def);
    }
    return Array.from(unique.values());
  }

  /**
   * Create a runtime Enemy entity from an EnemyDefinition with standard scaling.
   */
  public createRuntimeEnemy(enemyId: string, options: SpawnEnemyOptions): Enemy {
    const def = this.get(enemyId) || {
      id: enemyId,
      name: enemyId,
      baseHp: 10,
      baseAtk: 2,
      baseDef: 0,
      range: 1,
      speed: 1.0,
      char: '?',
      color: '#ffffff'
    };

    const threatMultiplier = options.globalThreatFactor ?? 1.0;
    const isElite = !!options.isElite;
    const isBoss = !!options.isBoss;

    const eliteHpMul = isElite ? 1.6 : 1.0;
    const eliteAtkMul = isElite ? 1.3 : 1.0;
    const eliteDefBonus = isElite ? 2 : 0;

    const hp = Math.max(1, Math.round(def.baseHp * threatMultiplier * eliteHpMul));
    const atk = Math.max(1, Math.round(def.baseAtk * threatMultiplier * eliteAtkMul));
    const defVal = Math.max(0, Math.round(def.baseDef + eliteDefBonus));

    const runtimeId = options.id || `enemy_${def.id}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const enemy: Enemy = {
      id: runtimeId,
      x: options.x,
      y: options.y,
      z: options.z ?? 0,
      type: def.id,
      name: options.customName || (isElite ? `Elite ${def.name}` : def.name),
      hp,
      maxHp: hp,
      atk,
      def: defVal,
      range: def.range,
      speed: def.speed,
      color: isElite ? '#f59e0b' : (def.color || '#ffffff'),
      char: def.char || '?',
      state: EnemyState.Patrolling,
      isElite,
      eliteEffect: options.eliteEffect,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: [],
      isBoss,
      isHostile: !def.isPrey,
      aiRole: def.aiRole,
      faction: options.faction || def.faction || 'wild_beasts',
      dropMaterials: def.dropMaterials,
      dropCatalysts: def.dropCatalysts,
      archetype: def.archetype,
      chaosTier: options.chaosTier ?? 0
    };

    return enemy;
  }
}

export const EnemyRegistry = new EnemyRegistryClass();
