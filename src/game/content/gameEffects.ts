/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentRegistry } from '../../engine';

/**
 * Bootstraps game-specific status effects
 */
export function bootstrapGameEffects(content: ContentRegistry = ContentRegistry.getInstance()): void {
  // Registers unique high-tier game curse effect
  content.effects.register({
    id: 'abyssal_curse',
    name: 'Abyssal Curse',
    type: 'debuff',
    icon: '👁️',
    color: '#6b21a8',
    description: 'Corrupts bodily energy, continuously siphoning life.',
    defaultDuration: 5,
    maxStacks: 1,
    stacking: 'refresh',
    damagePerTurn: 8,
    damageType: 'shadow',
    tags: ['curse', 'shadow', 'dot'],
    statModifiers: {
      def: -3,
      atk: -2
    }
  });
}
