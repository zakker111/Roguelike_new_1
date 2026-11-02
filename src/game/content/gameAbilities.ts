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

  content.abilities.register({
    id: 'ground_slam',
    name: 'Ground Slam',
    type: 'attack',
    targetType: 'area_tile',
    range: 2,
    radius: 1,
    cooldown: 5,
    basePower: 22,
    damageMultiplier: 1.5,
    effectId: 'stun',
    effectDuration: 2,
    icon: '💥',
    color: '#b45309',
    description: 'Brings down titanic force upon the ground, shattering stone and stunning targets.',
    soundEffect: 'explosion'
  });

  content.abilities.register({
    id: 'heavy_cleave',
    name: 'Heavy Cleave',
    type: 'attack',
    targetType: 'single_enemy',
    range: 1,
    radius: 0,
    cooldown: 3,
    basePower: 28,
    damageMultiplier: 1.8,
    effectId: 'bleeding',
    effectDuration: 3,
    icon: '🪓',
    color: '#ef4444',
    description: 'A crushing wide arc strike that leaves deep rending wounds.',
    soundEffect: 'slash'
  });

  content.abilities.register({
    id: 'blizzard',
    name: 'Frost Blizzard',
    type: 'attack',
    targetType: 'area_tile',
    range: 5,
    radius: 2,
    cooldown: 6,
    basePower: 20,
    element: 'Frost',
    effectId: 'freezing',
    effectDuration: 2,
    icon: '❄️',
    color: '#38bdf8',
    description: 'Summons a freezing vortex of subzero hail and arctic wind.',
    soundEffect: 'ice_spell'
  });

  content.abilities.register({
    id: 'heal_ally',
    name: 'Soothing Mists',
    type: 'heal',
    targetType: 'single_ally',
    range: 4,
    radius: 0,
    cooldown: 4,
    basePower: 20,
    icon: '💚',
    color: '#22c55e',
    description: 'Restores vitality to a wounded ally.',
    soundEffect: 'heal'
  });

  content.abilities.register({
    id: 'bloodlust',
    name: 'Frenzied Bloodlust',
    type: 'buff',
    targetType: 'self',
    range: 0,
    cooldown: 6,
    effectId: 'shield',
    effectDuration: 4,
    icon: '🩸',
    color: '#dc2626',
    description: 'Engulfs the entity in battle fury.',
    soundEffect: 'roar'
  });
}
