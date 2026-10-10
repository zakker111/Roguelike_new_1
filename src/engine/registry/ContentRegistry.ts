/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyRegistry } from '../entities/EnemyRegistry';
import { EntityRegistry } from '../entities/EntityRegistry';
import { SpawnTableRegistry } from '../entities/SpawnTable';
import { AbilityRegistry } from '../abilities/AbilityRegistry';
import { EffectRegistry } from '../effects/EffectRegistry';
import { AIStrategyRegistry } from '../ai/AIStrategyRegistry';
import { DungeonGeneratorRegistry } from '../dungeon/DungeonGeneratorRegistry';
import { RoomRegistry } from '../dungeon/RoomRegistry';
import { ItemRegistry } from '../items/ItemRegistry';
import { WeaponRegistry } from '../items/WeaponRegistry';
import { ContentValidator } from '../validation/ContentValidator';
import { ContentSummary, ContentValidationResult } from './types';

/**
 * Sovereign Master Content Registry Coordinator.
 * Conforms to Step 7 & Section 8 of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md):
 * "Create central registries for:
 *  - enemies
 *  - items
 *  - abilities
 *  - effects
 *  - weapons
 *  - rooms
 *  - generators
 *  - AI strategies
 * The engine loads content through these registries."
 */
export class ContentRegistry {
  private static instance: ContentRegistry | null = null;

  private constructor() {}

  public static getInstance(): ContentRegistry {
    if (!ContentRegistry.instance) {
      ContentRegistry.instance = new ContentRegistry();
    }
    return ContentRegistry.instance;
  }

  /**
   * Resets singleton instance
   */
  public static resetInstance(): void {
    ContentRegistry.instance = null;
  }

  /**
   * Access the central Enemy Registry
   */
  public get enemies(): typeof EnemyRegistry {
    return EnemyRegistry;
  }

  /**
   * Access the central Item Registry
   */
  public get items(): ItemRegistry {
    return ItemRegistry.getInstance();
  }

  /**
   * Access the central Weapon Registry
   */
  public get weapons(): WeaponRegistry {
    return WeaponRegistry.getInstance();
  }

  /**
   * Access the central Ability Registry
   */
  public get abilities(): AbilityRegistry {
    return AbilityRegistry.getInstance();
  }

  /**
   * Access the central Status Effects Registry
   */
  public get effects(): EffectRegistry {
    return EffectRegistry.getInstance();
  }

  /**
   * Access the central Room Templates Registry
   */
  public get rooms(): RoomRegistry {
    return RoomRegistry.getInstance();
  }

  /**
   * Access the central Dungeon Generator Registry
   */
  public get generators(): DungeonGeneratorRegistry {
    return DungeonGeneratorRegistry.getInstance();
  }

  /**
   * Access the central AI Strategies Registry
   */
  public get aiStrategies(): AIStrategyRegistry {
    return AIStrategyRegistry.getInstance();
  }

  /**
   * Access the central Generic Entity Blueprint Registry
   */
  public get entities(): typeof EntityRegistry {
    return EntityRegistry;
  }

  /**
   * Access the central Spawn Table Registry
   */
  public get spawnTables(): typeof SpawnTableRegistry {
    return SpawnTableRegistry;
  }

  /**
   * Bootstraps and initializes all content catalogs across all registries
   */
  public initAll(): void {
    this.enemies.initFromCatalog();
    this.items.initFromCatalog();
    this.weapons.initFromCatalog();
  }

  /**
   * Resets all registries to clean/default state (for isolated testing)
   */
  public resetAll(): void {
    ItemRegistry.resetInstance();
    WeaponRegistry.resetInstance();
    AbilityRegistry.resetInstance();
    EffectRegistry.resetInstance();
    RoomRegistry.resetInstance();
    DungeonGeneratorRegistry.resetInstance();
    AIStrategyRegistry.resetInstance();
    EntityRegistry.resetInstance();
  }

  /**
   * Returns complete metrics summary of all registered content
   */
  public getSummary(): ContentSummary {
    const enemiesCount = this.enemies.getAll().length;
    const itemsCount = this.items.count();
    const weaponsCount = this.weapons.count();
    const abilitiesCount = this.abilities.getAll().length;
    const effectsCount = this.effects.getAll().length;
    const roomsCount = this.rooms.count();
    const generatorsCount = this.generators.getAll().length;
    const aiStrategiesCount = this.aiStrategies.getAll().length;
    const entitiesCount = this.entities.count();

    const total =
      enemiesCount +
      itemsCount +
      weaponsCount +
      abilitiesCount +
      effectsCount +
      roomsCount +
      generatorsCount +
      aiStrategiesCount +
      entitiesCount;

    return {
      enemies: enemiesCount,
      items: itemsCount,
      weapons: weaponsCount,
      abilities: abilitiesCount,
      effects: effectsCount,
      rooms: roomsCount,
      generators: generatorsCount,
      aiStrategies: aiStrategiesCount,
      entities: entitiesCount,
      total
    };
  }

  /**
   * Validates integrity, identifiers, and cross-references across registries.
   * Conforms to Step 9 (Validation tools) requirements.
   */
  public validateContent(): ContentValidationResult {
    const report = ContentValidator.validateAll(this);
    return {
      valid: report.valid,
      errors: report.errors.map(e => `[${e.category.toUpperCase()}] ${e.targetId}: ${e.message}`),
      warnings: report.warnings.map(w => `[${w.category.toUpperCase()}] ${w.targetId}: ${w.message}`),
      timestamp: report.timestamp
    };
  }
}
