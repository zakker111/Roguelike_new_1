/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentRegistry } from '../engine';
import { bootstrapGameEnemies } from './content/gameEnemies';
import { bootstrapGameItems } from './content/gameItems';
import { bootstrapGameWeapons } from './content/gameWeapons';
import { bootstrapGameAbilities } from './content/gameAbilities';
import { bootstrapGameEffects } from './content/gameEffects';

/**
 * Bootstraps all fantasy roguelike content into the engine.
 * Conforms to Step 8 (Engine / Game Separation) of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md):
 * ENGINE = HOW THE GAME WORKS
 * GAME CONTENT = WHAT EXISTS IN THE GAME
 */
export function bootstrapGame(content: ContentRegistry = ContentRegistry.getInstance()): ContentRegistry {
  bootstrapGameEnemies(content);
  bootstrapGameItems(content);
  bootstrapGameWeapons(content);
  bootstrapGameAbilities(content);
  bootstrapGameEffects(content);

  return content;
}
