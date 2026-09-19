/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { Enemy, EnemyType, EnemyState, TileType, GameState } from '../types';
import { isFactionLeader, triggerSquadMoraleBreakOnLeaderDeath, checkDesperateSurrender } from '../hooks/ai/factionMorale';

function mockEnemy(overrides: Partial<Enemy>): Enemy {
  return {
    id: 'mock_enemy',
    name: 'Mock Enemy',
    type: EnemyType.Goblin,
    hp: 20,
    maxHp: 20,
    atk: 5,
    def: 1,
    range: 1,
    speed: 1,
    x: 0,
    y: 0,
    char: 'e',
    color: '#ffffff',
    state: EnemyState.Patrolling,
    isElite: false,
    patrolPath: [],
    patrolIndex: 0,
    debuffs: [],
    ...overrides,
  };
}

describe('Phase E2: Morale, Fear & Surrender Sub-Engine', () => {
  it('E2.1: Correctly identifies pack leaders, warlords, alphas, and linked pack masters', () => {
    const warlord: Enemy = mockEnemy({
      id: 'warlord_1',
      name: 'Orc Warlord',
      type: EnemyType.OrcBrute,
      hp: 150,
      maxHp: 150,
      atk: 25,
      def: 12,
      x: 10,
      y: 10,
      char: 'O',
      color: '#ef4444',
      state: EnemyState.Chasing,
      faction: 'orc_clans',
      factionRank: 'warlord',
    });

    const grunt: Enemy = mockEnemy({
      id: 'grunt_1',
      name: 'Orc Grunt',
      type: EnemyType.OrcBrute,
      hp: 40,
      maxHp: 40,
      atk: 10,
      def: 2,
      x: 11,
      y: 10,
      char: 'o',
      color: '#f87171',
      state: EnemyState.Chasing,
      faction: 'orc_clans',
      packLeaderId: 'warlord_1',
    });

    const wolfAlpha: Enemy = mockEnemy({
      id: 'wolf_alpha',
      name: 'Dire Wolf Alpha',
      type: 'wolf' as any,
      hp: 80,
      maxHp: 80,
      atk: 18,
      def: 6,
      x: 20,
      y: 20,
      char: 'w',
      color: '#94a3b8',
      state: EnemyState.Chasing,
      packId: 'wolf_pack_1',
    });

    expect(isFactionLeader(warlord)).toBe(true);
    expect(isFactionLeader(wolfAlpha)).toBe(true);
    expect(isFactionLeader(grunt)).toBe(false);
    expect(isFactionLeader(warlord, [grunt])).toBe(true);
  });

  it('E2.2: Slaying pack leader triggers squad/pack morale break on linked subordinates', () => {
    const alpha: Enemy = mockEnemy({
      id: 'alpha_1',
      name: 'Dire Wolf Alpha',
      type: 'wolf' as any,
      hp: 0,
      maxHp: 80,
      atk: 18,
      def: 6,
      x: 15,
      y: 15,
      char: 'W',
      color: '#94a3b8',
      state: EnemyState.Chasing,
      packId: 'pack_winter',
    });

    const pup1: Enemy = mockEnemy({
      id: 'pup_1',
      name: 'Timber Wolf',
      type: 'wolf' as any,
      hp: 30,
      maxHp: 30,
      atk: 8,
      def: 2,
      x: 16,
      y: 15,
      char: 'w',
      color: '#cbd5e1',
      state: EnemyState.Chasing,
      packId: 'pack_winter',
      packLeaderId: 'alpha_1',
    });

    const pup2: Enemy = mockEnemy({
      id: 'pup_2',
      name: 'Timber Wolf',
      type: 'wolf' as any,
      hp: 30,
      maxHp: 30,
      atk: 8,
      def: 2,
      x: 17,
      y: 16,
      char: 'w',
      color: '#cbd5e1',
      state: EnemyState.Chasing,
      packId: 'pack_winter',
      packLeaderId: 'alpha_1',
    });

    const unrelatedEnemy: Enemy = mockEnemy({
      id: 'goblin_1',
      name: 'Cave Goblin',
      type: EnemyType.Goblin,
      hp: 25,
      maxHp: 25,
      atk: 6,
      def: 1,
      x: 18,
      y: 18,
      char: 'g',
      color: '#22c55e',
      state: EnemyState.Chasing,
      faction: 'goblin',
    });

    const enemies = [alpha, pup1, pup2, unrelatedEnemy];
    const logSpy = vi.fn();
    const floaterSpy = vi.fn();

    // Mock Math.random to guarantee morale break
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const result = triggerSquadMoraleBreakOnLeaderDeath(
      alpha,
      enemies,
      logSpy,
      floaterSpy
    );

    randomSpy.mockRestore();

    expect(result.panickedCount).toBe(2);
    expect(result.droppedPiles.length).toBeGreaterThanOrEqual(1);

    const updatedPup1 = result.updatedEnemies.find((e) => e.id === 'pup_1')!;
    const updatedGoblin = result.updatedEnemies.find((e) => e.id === 'goblin_1')!;

    expect(updatedPup1.isPanicked).toBe(true);
    expect(updatedPup1.state).toBe(EnemyState.Retreating);
    expect(updatedPup1.droppedMoraleLoot).toBe(true);
    expect(updatedGoblin.isPanicked).toBeUndefined();
    expect(logSpy).toHaveBeenCalled();
  });

  it('E2.3: Isolated, critically wounded humanoid hostiles surrender and drop loot', () => {
    const woundedBandit: Enemy = mockEnemy({
      id: 'bandit_isolated',
      name: 'Bandit Scavenger',
      type: EnemyType.Bandit,
      hp: 4, // 4 out of 40 = 10% HP (critically wounded)
      maxHp: 40,
      atk: 10,
      def: 2,
      x: 12,
      y: 12,
      char: 'b',
      color: '#f59e0b',
      state: EnemyState.Chasing,
      faction: 'outlaw_bandits',
    });

    // No living faction allies nearby
    const livingEnemies = [woundedBandit];
    const logSpy = vi.fn();
    const floaterSpy = vi.fn();

    // Mock Math.random to guarantee surrender trigger
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const result = checkDesperateSurrender(
      woundedBandit,
      livingEnemies,
      logSpy,
      floaterSpy
    );

    randomSpy.mockRestore();

    expect(result.didSurrender).toBe(true);
    expect(result.enemy.isSurrendered).toBe(true);
    expect(result.enemy.state).toBe(EnemyState.Retreating);
    expect(result.droppedLoot).toBeDefined();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('SURRENDER'), 'combat');
  });

  it('E2.4: Wounded hostiles DO NOT surrender if they have living allies nearby', () => {
    const woundedBandit: Enemy = mockEnemy({
      id: 'bandit_1',
      name: 'Bandit Scavenger',
      type: EnemyType.Bandit,
      hp: 4,
      maxHp: 40,
      atk: 10,
      def: 2,
      x: 12,
      y: 12,
      char: 'b',
      color: '#f59e0b',
      state: EnemyState.Chasing,
      faction: 'outlaw_bandits',
    });

    const healthyBanditAlly: Enemy = mockEnemy({
      id: 'bandit_2',
      name: 'Bandit Raider',
      type: EnemyType.Bandit,
      hp: 35,
      maxHp: 35,
      atk: 12,
      def: 3,
      x: 13,
      y: 12, // Adjacent ally!
      char: 'B',
      color: '#f59e0b',
      state: EnemyState.Chasing,
      faction: 'outlaw_bandits',
    });

    const livingEnemies = [woundedBandit, healthyBanditAlly];
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const result = checkDesperateSurrender(
      woundedBandit,
      livingEnemies
    );

    randomSpy.mockRestore();

    expect(result.didSurrender).toBe(false);
    expect(result.enemy.isSurrendered).toBeUndefined();
  });

  it('E2.5: G-Key parley interaction accepts surrender and grants gold bribe and materials', () => {
    const surrenderedEnemy: Enemy = mockEnemy({
      id: 'bandit_yield',
      name: 'Surrendered Bandit',
      type: EnemyType.Bandit,
      hp: 5,
      maxHp: 40,
      atk: 10,
      def: 2,
      x: 10,
      y: 11, // Adjacent to player at (10, 10)
      char: 'b',
      color: '#f59e0b',
      state: EnemyState.Retreating,
      isSurrendered: true,
      surrenderTurns: 10,
    });

    let state: any = {
      playerX: 10,
      playerY: 10,
      map: [[TileType.Grass]],
      enemies: [surrenderedEnemy],
      inventoryMaterials: {},
      playerStats: { gold: 100 },
    };

    const setState = (updater: any) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    };

    const px = state.playerX;
    const py = state.playerY;

    // Simulate G-Key surrender interaction
    const adjacentSurrendered = state.enemies.find(
      (e: any) => e.isSurrendered && e.hp > 0 && Math.abs(px - e.x) <= 1 && Math.abs(py - e.y) <= 1
    );

    expect(adjacentSurrendered).toBeDefined();

    if (adjacentSurrendered) {
      const bribeGold = 25;
      const chosenMat = 'mat_steel_ingot';

      setState((prev: any) => {
        const nextEnemies = prev.enemies.filter((e: any) => e.id !== adjacentSurrendered.id);
        const nextMats = { ...prev.inventoryMaterials };
        nextMats[chosenMat] = (nextMats[chosenMat] || 0) + 1;

        return {
          ...prev,
          enemies: nextEnemies,
          playerStats: {
            ...prev.playerStats,
            gold: prev.playerStats.gold + bribeGold,
          },
          inventoryMaterials: nextMats,
        };
      });
    }

    expect(state.enemies.length).toBe(0);
    expect(state.playerStats.gold).toBe(125);
    expect(state.inventoryMaterials['mat_steel_ingot']).toBe(1);
  });
});
