/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DungeonGeneratorRegistry } from './DungeonGeneratorRegistry';
import {
  DungeonGeneratorConfig,
  DungeonGenerationResult,
  IDungeonGenerator
} from './types';

/**
 * High-level coordinator and facade for dungeon generation
 */
export class DungeonManager {
  private static instance: DungeonManager;
  private registry: DungeonGeneratorRegistry;

  private constructor() {
    this.registry = DungeonGeneratorRegistry.getInstance();
  }

  static getInstance(): DungeonManager {
    if (!DungeonManager.instance) {
      DungeonManager.instance = new DungeonManager();
    }
    return DungeonManager.instance;
  }

  /**
   * Generates a dungeon using the specified generator algorithm or default fallback
   */
  generateDungeon(config: DungeonGeneratorConfig): DungeonGenerationResult {
    let generator = this.registry.get(config.id);

    // Fallback if specific generator is not found
    if (!generator) {
      generator = this.registry.get('rooms_and_corridors');
    }

    if (!generator) {
      throw new Error(`No dungeon generator found for id '${config.id}' and no fallback available.`);
    }

    return generator.generate(config);
  }

  /**
   * Get all available dungeon generator options
   */
  getAvailableGenerators(): IDungeonGenerator[] {
    return this.registry.getAll();
  }

  /**
   * Register a custom generator
   */
  registerGenerator(generator: IDungeonGenerator): void {
    this.registry.register(generator);
  }
}
