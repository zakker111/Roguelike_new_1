/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDungeonGenerator } from './types';
import {
  RoomAndCorridorGenerator,
  BSPDungeonGenerator,
  CellularAutomataCaveGenerator,
  ArenaDungeonGenerator
} from './generators';

/**
 * Registry for all modular dungeon generators
 */
export class DungeonGeneratorRegistry {
  private static instance: DungeonGeneratorRegistry;
  private generators: Map<string, IDungeonGenerator> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  static getInstance(): DungeonGeneratorRegistry {
    if (!DungeonGeneratorRegistry.instance) {
      DungeonGeneratorRegistry.instance = new DungeonGeneratorRegistry();
    }
    return DungeonGeneratorRegistry.instance;
  }

  static resetInstance(): void {
    (DungeonGeneratorRegistry as any).instance = null;
  }

  private registerDefaults(): void {
    this.register(new RoomAndCorridorGenerator());
    this.register(new BSPDungeonGenerator());
    this.register(new CellularAutomataCaveGenerator());
    this.register(new ArenaDungeonGenerator());
  }

  /**
   * Register a new or custom dungeon generator
   */
  register(generator: IDungeonGenerator): void {
    this.generators.set(generator.id, generator);
  }

  /**
   * Retrieve a dungeon generator by unique ID
   */
  get(id: string): IDungeonGenerator | undefined {
    return this.generators.get(id);
  }

  /**
   * Check if a generator ID exists
   */
  has(id: string): boolean {
    return this.generators.has(id);
  }

  /**
   * Get list of all registered generators
   */
  getAll(): IDungeonGenerator[] {
    return Array.from(this.generators.values());
  }

  /**
   * Get all registered generator IDs
   */
  getIds(): string[] {
    return Array.from(this.generators.keys());
  }

  /**
   * Reset registry to default generators
   */
  reset(): void {
    this.generators.clear();
    this.registerDefaults();
  }
}
