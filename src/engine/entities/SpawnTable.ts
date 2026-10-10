/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpawnTable, SpawnTableEntry } from './types';
import { EnemyRegistry } from './EnemyRegistry';
import { Enemy } from '../../types/entities';

/**
 * Registry of reusable spawn tables for biomes, dungeon tiers, and encounters.
 * Enables data-driven spawning as specified in Pillar 1 & 2 of ENGINEPLAN.md.
 */
class SpawnTableRegistryClass {
  private tables = new Map<string, SpawnTable>();

  constructor() {
    this.initDefaultTables();
  }

  private initDefaultTables(): void {
    // Standard Overworld Wilderness Table
    this.register({
      id: 'overworld_standard',
      name: 'Overworld Wilderness',
      entries: [
        { enemyId: 'Wolf', weight: 25 },
        { enemyId: 'Bandit', weight: 25 },
        { enemyId: 'Boar', weight: 20 },
        { enemyId: 'Goblin', weight: 20 },
        { enemyId: 'Bear', weight: 10 }
      ]
    });

    // Overworld Animals / Wildlife Table
    this.register({
      id: 'overworld_wildlife',
      name: 'Peaceful Overworld Wildlife',
      entries: [
        { enemyId: 'Deer', weight: 40 },
        { enemyId: 'Rabbit', weight: 30 },
        { enemyId: 'Goat', weight: 20 },
        { enemyId: 'Boar', weight: 10 }
      ]
    });

    // Dungeon Shallow (Depths 1-2)
    this.register({
      id: 'dungeon_shallow',
      name: 'Dungeon Shallow Depths',
      entries: [
        { enemyId: 'Rat', weight: 30, maxDepth: 2 },
        { enemyId: 'Goblin', weight: 30 },
        { enemyId: 'SkeletonMage', weight: 15 },
        { enemyId: 'OrcBrute', weight: 10 },
        { enemyId: 'Slime', weight: 15 }
      ]
    });

    // Dungeon Deep (Depths 3+)
    this.register({
      id: 'dungeon_deep',
      name: 'Dungeon Deep Depths',
      entries: [
        { enemyId: 'OrcBrute', weight: 20, minDepth: 3 },
        { enemyId: 'SkeletonMage', weight: 20, minDepth: 3 },
        { enemyId: 'Trapmaster', weight: 15, minDepth: 3 },
        { enemyId: 'Spider', weight: 15, minDepth: 3 },
        { enemyId: 'Vampire', weight: 10, minDepth: 4 },
        { enemyId: 'Necromancer', weight: 10, minDepth: 4 },
        { enemyId: 'DreadKnight', weight: 10, minDepth: 5 }
      ]
    });
  }

  public register(table: SpawnTable): void {
    this.tables.set(table.id, table);
  }

  public get(id: string): SpawnTable | undefined {
    return this.tables.get(id);
  }

  public getAll(): SpawnTable[] {
    return Array.from(this.tables.values());
  }

  /**
   * Roll a random enemy ID from a table given current depth and threat tier.
   */
  public rollEnemy(tableId: string, depth = 1, threatTier = 1): string | null {
    const table = this.get(tableId);
    if (!table || table.entries.length === 0) return null;

    const validEntries = table.entries.filter(entry => {
      if (entry.minDepth !== undefined && depth < entry.minDepth) return false;
      if (entry.maxDepth !== undefined && depth > entry.maxDepth) return false;
      if (entry.minThreatTier !== undefined && threatTier < entry.minThreatTier) return false;
      return true;
    });

    if (validEntries.length === 0) return null;

    const totalWeight = validEntries.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight <= 0) return validEntries[0].enemyId;

    let roll = Math.random() * totalWeight;
    for (const entry of validEntries) {
      if (roll < entry.weight) {
        return entry.enemyId;
      }
      roll -= entry.weight;
    }

    return validEntries[validEntries.length - 1].enemyId;
  }
}

export const SpawnTableRegistry = new SpawnTableRegistryClass();
