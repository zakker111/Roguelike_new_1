/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentRegistry } from '../../engine';

/**
 * Bootstraps game-specific fantasy abilities and spells
 */
export function bootstrapGameAbilities(content: ContentRegistry = ContentRegistry.getInstance()): void {
  // Registers custom high-tier fantasy boss spells and ultimate arts
  content.abilities.register({
    id: 'infernal_cataclysm',
    name: 'Infernal Cataclysm',
    type: 'attack',
    targetType: 'area_tile',
    range: 7,
    radius: 2,
    cooldown: 8,
    manaCost: 25,
    basePower: 45,
    damageMultiplier: 2.0,
    element: 'Fire',
    effectId: 'burning',
    effectDuration: 5,
    icon: '🌋',
    color: '#ea580c',
    description: 'Shatters tectonic plates, showering enemies in cataclysmic magma.',
    soundEffect: 'explosion'
  });

  content.abilities.register({
    id: 'divine_sanctuary',
    name: 'Divine Sanctuary',
    type: 'heal',
    targetType: 'self',
    range: 0,
    radius: 0,
    cooldown: 10,
    manaCost: 30,
    basePower: 50,
    effectId: 'shield',
    effectDuration: 8,
    icon: '✨',
    color: '#facc15',
    description: 'Surrounds the caster with impenetrable golden radiance and massive healing.',
    soundEffect: 'holy_cast'
  });
}
