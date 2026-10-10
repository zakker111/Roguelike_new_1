/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentRegistry } from '../../engine';
import enemiesJson from '../../data/enemies.json';

/**
 * Bootstraps game-specific fantasy enemies into the engine's EnemyRegistry
 */
export function bootstrapGameEnemies(content: ContentRegistry = ContentRegistry.getInstance()): void {
  const dataObj = enemiesJson as Record<string, any>;
  for (const [key, raw] of Object.entries(dataObj)) {
    content.enemies.register({
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
}
