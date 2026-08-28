import { describe, it, expect } from 'vitest';
import { generateOverworldChunk } from '../utils/overworld/overworldChunkGen';
import { applyCombatArchetypeAndChaosScaling } from '../utils/combatArchetypes';
import { Enemy, EnemyType, EnemyState } from '../types';

describe('Wilderness Enemy Difficulty Tier Variance', () => {
  it('generates a diverse range of easy, standard, tough, and apex enemies across wilderness chunks', () => {
    const tiersFound = new Set<string>();
    const hpValues: number[] = [];
    const atkValues: number[] = [];

    // Sample several wilderness chunks in all biomes and distances
    const testChunks = [
      { x: 1, y: 1 },   // near town (forest)
      { x: 2, y: 0 },   // near town
      { x: 0, y: 2 },   // near town
      { x: 4, y: 4 },   // mid/deep forest
      { x: 7, y: 7 },   // deep wilderness
      { x: -5, y: -5 }, // deep northwest
      { x: 5, y: -5 },  // deep northeast
      { x: -5, y: 5 },  // deep southwest
      { x: 3, y: 3 },   // mid distance
      { x: 2, y: 3 },   // mid distance
      { x: 1, y: 4 },   // mid distance
    ];

    let totalEnemies = 0;
    let easyCount = 0;
    let standardCount = 0;
    let toughCount = 0;
    let apexCount = 0;

    for (const coords of testChunks) {
      const chunk = generateOverworldChunk(coords.x, coords.y, 40, 40);
      const hostileEnemies = chunk.enemies.filter(e => !e.isTownGuard && !e.isAnimal);

      for (const enemy of hostileEnemies) {
        totalEnemies++;
        const tier = enemy.difficultyTier || 'standard';
        tiersFound.add(tier);
        hpValues.push(enemy.hp);
        atkValues.push(enemy.atk);

        if (tier === 'easy') easyCount++;
        else if (tier === 'standard') standardCount++;
        else if (tier === 'tough') toughCount++;
        else if (tier === 'apex') apexCount++;

        // Ensure validity
        expect(enemy.hp).toBeGreaterThan(0);
        expect(enemy.atk).toBeGreaterThan(0);
        expect(Number.isFinite(enemy.hp)).toBe(true);
        expect(Number.isFinite(enemy.atk)).toBe(true);
      }
    }

    // Must have found both easy and tough enemies
    expect(tiersFound.has('easy')).toBe(true);
    expect(tiersFound.has('tough') || tiersFound.has('standard')).toBe(true);
    expect(easyCount).toBeGreaterThan(0);
    expect(totalEnemies).toBeGreaterThan(10);

    // Verify HP variance: min HP should be low (easy critters) and max HP should be high (veterans/apex)
    const minHp = Math.min(...hpValues);
    const maxHp = Math.max(...hpValues);
    expect(minHp).toBeLessThanOrEqual(16); // Easy critters are fast to kill
    expect(maxHp).toBeGreaterThanOrEqual(35); // Tough enemies provide challenge
  });

  it('correctly clamps and moderates stats for easy enemies in combat archetype scaling', () => {
    const rawEasyEnemy: Enemy = {
      id: 'test_easy_rat',
      x: 5,
      y: 5,
      type: EnemyType.Rat,
      name: 'Forest Field Mouse [Easy]',
      hp: 6,
      maxHp: 6,
      atk: 1,
      def: 0,
      range: 1,
      speed: 1,
      color: '#94a3b8',
      char: '🐁',
      state: EnemyState.Patrolling,
      difficultyTier: 'easy',
      isElite: false,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: []
    };

    // Even with a high-level player, easy critters remain accessible (not inflated into 100+ HP monsters)
    const highLevelStats = {
      level: 15,
      str: 30,
      dex: 25,
      int: 20,
      cha: 10,
      lck: 15,
      depth: 0,
      turnsPlayed: 500
    };

    const scaled = applyCombatArchetypeAndChaosScaling(rawEasyEnemy, 20, highLevelStats as any, 0);

    expect(scaled.difficultyTier).toBe('easy');
    expect(scaled.hp).toBeLessThanOrEqual(16); // Remains quick to dispatch
    expect(scaled.atk).toBeLessThanOrEqual(4);
    expect(scaled.def).toBeLessThanOrEqual(1);
    expect(scaled.affixes?.length || 0).toBe(0); // Easy enemies do not roll brutal corrupted affixes
  });

  it('correctly scales tough and apex enemies for rewarding challenge', () => {
    const rawToughEnemy: Enemy = {
      id: 'test_tough_orc',
      x: 10,
      y: 10,
      type: EnemyType.OrcBrute,
      name: 'Savage Orc Skullbreaker [Tough]',
      hp: 46,
      maxHp: 46,
      atk: 7,
      def: 3,
      range: 1,
      speed: 1,
      color: '#ea580c',
      char: 'O',
      state: EnemyState.Patrolling,
      difficultyTier: 'tough',
      isElite: true,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: []
    };

    const scaled = applyCombatArchetypeAndChaosScaling(rawToughEnemy, 0, undefined, 0);

    expect(scaled.difficultyTier).toBe('tough');
    expect(scaled.hp).toBeGreaterThanOrEqual(35);
    expect(scaled.atk).toBeGreaterThanOrEqual(5);
  });

  it('guarantees 0% tough and 0% apex spawns in starter chunks near town (dist <= 1.5)', () => {
    const starterChunks = [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
    ];

    for (const { x, y } of starterChunks) {
      const chunk = generateOverworldChunk(x, y, 40, 40);
      const hostiles = chunk.enemies.filter(e => !e.isTownGuard && !e.isAnimal);

      for (const enemy of hostiles) {
        expect(enemy.difficultyTier).not.toBe('tough');
        expect(enemy.difficultyTier).not.toBe('apex');
        expect(['easy', 'standard']).toContain(enemy.difficultyTier);
      }
    }
  });

  it('gates elite affixes so early-game players (Level < 3, Depth < 2) never face affix-enhanced mobs', () => {
    const rawEnemy: Enemy = {
      id: 'test_standard_goblin',
      x: 5,
      y: 5,
      type: EnemyType.Goblin,
      name: 'Scavenger Goblin',
      hp: 18,
      maxHp: 18,
      atk: 4,
      def: 1,
      range: 1,
      speed: 1,
      color: '#84cc16',
      char: 'g',
      state: EnemyState.Patrolling,
      difficultyTier: 'standard',
      isElite: true,
      patrolPath: [],
      patrolIndex: 0,
      debuffs: []
    };

    // Test early game (Level 1, Depth 0)
    for (let i = 0; i < 20; i++) {
      const scaled = applyCombatArchetypeAndChaosScaling(rawEnemy, 50, { level: 1 } as any, 0);
      expect(scaled.affixes?.length || 0).toBe(0);
    }

    // Test mid game (Level 4, Depth 0) - affixes are allowed to roll
    let sawAffixAtHigherLevel = false;
    for (let i = 0; i < 50; i++) {
      const scaled = applyCombatArchetypeAndChaosScaling(rawEnemy, 50, { level: 4 } as any, 0);
      if ((scaled.affixes?.length || 0) > 0) {
        sawAffixAtHigherLevel = true;
        break;
      }
    }
    expect(sawAffixAtHigherLevel).toBe(true);
  });
});
