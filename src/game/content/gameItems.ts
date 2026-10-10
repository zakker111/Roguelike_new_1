/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentRegistry } from '../../engine';

/**
 * Bootstraps game-specific items into the engine's ItemRegistry
 */
export function bootstrapGameItems(content: ContentRegistry = ContentRegistry.getInstance()): void {
  // Triggers loading of materials, catalysts, relics, spell scrolls, and potions
  content.items.initFromCatalog();
}
