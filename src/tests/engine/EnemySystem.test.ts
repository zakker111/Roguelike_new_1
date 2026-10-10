/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { EnemyRegistry } from '../../engine/entities/EnemyRegistry';
import { SpawnTableRegistry } from '../../engine/entities/SpawnTable';
import { EnemyType } from '../../types';

describe('Roguelike Engine - Pillar 1: Enemy System & Registry', () => {
  it('initializes default enemies into EnemyRegistry from catalog', () => {
    expect(EnemyRegistry.has('Goblin')).toBe(true);
    expect(EnemyRegistry.has('Rat')).toBe(true);
    expect(EnemyRegistry.has('Troll')).toBe(true);
    expect(EnemyRegistry.has('captive')).toBe(true);
  });

  it('supports alias lookups case-insensitively', () => {
    const brute = EnemyRegistry.get('brute');
    expect(brute).toBeDefined();
    expect(brute?.id).toBe('OrcBrute');

    const mage = EnemyRegistry.get('MAGE');
    expect(mage).toBeDefined();
    expect(mage?.id).toBe('SkeletonMage');
  });

  it('allows registering custom or modded enemies seamlessly', () => {
    EnemyRegistry.register({
      id: 'CyberDrone',
      name: 'Cybernetic Security Drone',
      baseHp: 35,
      baseAtk: 6,
      baseDef: 4,
      range: 3,
      speed: 0.9,
      char: '🤖',
      color: '#06b6d4',
      aiRole: 'skirmisher_kiting',
      tags: ['sci-fi', 'mechanical', 'ranged']
    });

    const drone = EnemyRegistry.get('CyberDrone');
    expect(drone).toBeDefined();
    expect(drone?.name).toBe('Cybernetic Security Drone');
    expect(drone?.tags).toContain('sci-fi');
  });

  it('spawns a runtime Enemy with proper level and elite scaling', () => {
    const enemy = EnemyRegistry.createRuntimeEnemy('Goblin', {
      x: 10,
      y: 15,
      isElite: true,
      globalThreatFactor: 1.2
    });

    expect(enemy.name).toContain('Elite');
    expect(enemy.x).toBe(10);
    expect(enemy.y).toBe(15);
    expect(enemy.isElite).toBe(true);
    expect(enemy.hp).toBeGreaterThan(0);
    expect(enemy.maxHp).toBe(enemy.hp);
  });

  it('rolls valid enemy IDs from data-driven SpawnTableRegistry', () => {
    const shallowEnemy = SpawnTableRegistry.rollEnemy('dungeon_shallow', 1);
    expect(shallowEnemy).toBeDefined();
    expect(typeof shallowEnemy).toBe('string');

    const deepEnemy = SpawnTableRegistry.rollEnemy('dungeon_deep', 5);
    expect(deepEnemy).toBeDefined();
  });
});
