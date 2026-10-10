/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentRegistry } from '../../engine';

/**
 * Sci-Fi Roguelike Content Pack.
 * Proves the "Final Test" from ENGINEPLAN.md:
 * "The engine is becoming a real engine when we can create a completely different roguelike
 *  by changing content/configuration instead of rewriting the core engine."
 */
export function bootstrapSciFiRoguelike(content: ContentRegistry = ContentRegistry.getInstance()): ContentRegistry {
  content.resetAll();

  // 1. Sci-Fi Enemies
  content.enemies.register({
    id: 'cyber_drone',
    name: 'Patrol Security Drone',
    baseHp: 15,
    baseAtk: 4,
    baseDef: 2,
    range: 3,
    speed: 1.2,
    char: 'd',
    color: '#38bdf8',
    aiRole: 'ranged',
    abilities: ['laser_burst'],
    tags: ['robot', 'synth', 'security']
  });

  content.enemies.register({
    id: 'xeno_stalker',
    name: 'Bio-Engineered Xenomorph',
    baseHp: 28,
    baseAtk: 8,
    baseDef: 1,
    range: 1,
    speed: 1.5,
    char: 'x',
    color: '#a855f7',
    aiRole: 'flanking',
    abilities: ['acid_spit'],
    tags: ['alien', 'biological', 'stealth']
  });

  // 2. Sci-Fi Items
  content.items.register({
    id: 'nanomed_injector',
    name: 'NanoMed Auto-Injector',
    category: 'consumable',
    description: 'Rapidly deploys cellular repair nanites.',
    rarity: 'common',
    value: 50,
    tags: ['healing', 'medical'],
    stats: { hpRestore: 40 }
  });

  content.items.register({
    id: 'plasma_cell',
    name: 'High-Density Plasma Core',
    category: 'material',
    description: 'Volatile energy matrix used to supercharge munitions.',
    rarity: 'rare',
    value: 120,
    tags: ['energy', 'crafting']
  });

  // 3. Sci-Fi Weapons
  content.weapons.register({
    baseType: 'PlasmaRifle' as any,
    name: 'Mark IV Plasma Carbine',
    description: 'Fires coherent pulses of ionized hydrogen.',
    baseDamage: 12,
    baseCrit: 0.15,
    range: 5,
    manaCost: 0,
    icon: '🔫',
    isTwoHanded: true
  });

  content.weapons.register({
    baseType: 'StunBaton' as any,
    name: 'Shockwave Stun Baton',
    description: 'Non-lethal high-voltage melee compliance rod.',
    baseDamage: 7,
    baseCrit: 0.25,
    range: 1,
    manaCost: 0,
    icon: '⚡',
    isTwoHanded: false
  });

  // 4. Sci-Fi Abilities
  content.abilities.register({
    id: 'orbital_strike',
    name: 'Orbital Kinetic Bombardment',
    type: 'attack',
    targetType: 'area_tile',
    range: 8,
    radius: 3,
    cooldown: 12,
    basePower: 60,
    damageMultiplier: 2.5,
    element: 'Kinetic',
    icon: '🛰️',
    color: '#f43f5e',
    description: 'Coordinates satellite railgun impact from low planetary orbit.'
  });

  content.abilities.register({
    id: 'emp_discharge',
    name: 'EMP Burst',
    type: 'attack',
    targetType: 'self',
    range: 0,
    radius: 3,
    cooldown: 6,
    basePower: 15,
    element: 'Electric',
    effectId: 'emp_glitch',
    effectDuration: 3,
    icon: '💥',
    color: '#06b6d4',
    description: 'Emits a localized electromagnetic pulse short-circuiting synths.'
  });

  // 5. Sci-Fi Effects
  content.effects.register({
    id: 'emp_glitch',
    name: 'System Malfunction',
    type: 'debuff',
    icon: '⚡',
    color: '#38bdf8',
    description: 'Sensory feedback overloaded, immobilizing robotic guidance.',
    defaultDuration: 3,
    maxStacks: 1,
    stacking: 'refresh',
    inhibitsActions: true,
    tags: ['emp', 'tech', 'stun']
  });

  // 6. Sci-Fi Station Rooms
  content.rooms.register({
    id: 'reactor_core_chamber',
    name: 'Station Fusion Core',
    type: 'boss',
    shape: 'circular',
    minWidth: 10,
    maxWidth: 14,
    minHeight: 10,
    maxHeight: 14,
    weight: 1,
    tags: ['core', 'radiation', 'hazard']
  });

  content.rooms.register({
    id: 'airlock_decompression',
    name: 'Primary Airlock Threshold',
    type: 'entrance',
    shape: 'rectangle',
    minWidth: 5,
    maxWidth: 7,
    minHeight: 5,
    maxHeight: 7,
    weight: 1,
    tags: ['safe', 'airlock']
  });

  return content;
}
