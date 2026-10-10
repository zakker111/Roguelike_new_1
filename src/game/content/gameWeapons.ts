/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentRegistry } from '../../engine';

/**
 * Bootstraps game-specific weapon templates into the engine's WeaponRegistry
 */
export function bootstrapGameWeapons(content: ContentRegistry = ContentRegistry.getInstance()): void {
  // Triggers loading of swords, bows, staves, spears, hammers
  content.weapons.initFromCatalog();
}
