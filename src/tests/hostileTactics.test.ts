/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { TileType, Enemy, EnemyType, EnemyState, GameState } from '../types';
import {
  isRangedKiterUnit,
  executeKitingMovement,
  isPackUnit,
  executeFlankingMovement,
  executeSupportTactics,
  resolveTelegraphedAttack,
  checkTelegraphWindup,
  executeDefenderCombatTactics,
  checkElitePerceptionWarning,
  AITacticContext
} from '../hooks/ai/tactics';
import { SpatialEntityGrid } from '../utils/spatial';

describe('Hostile AI Tactics & Strategy Pattern Suite', () => {
  const createMockGameState = (): GameState =>
    ({
      map: Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => TileType.Floor)),
      visible: Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => true)),
      isBraced: false,
      playerStats: { level: 1, maxHp: 50, hp: 50, str: 10, dex: 10, int: 10, def: 0 },
      followers: []
    } as unknown as GameState);

  describe('Kiting Tactics Strategy', () => {
    it('accurately identifies ranged kiter archetypes', () => {
      const archer: Enemy = { id: 'a1', name: 'Goblin Archer', type: EnemyType.Goblin, range: 4 } as Enemy;
      const mage: Enemy = { id: 'm1', name: 'Skeleton Mage', type: EnemyType.SkeletonMage, range: 3 } as Enemy;
      const warrior: Enemy = { id: 'w1', name: 'Orc Warrior', type: EnemyType.OrcBrute, range: 1 } as Enemy;

      expect(isRangedKiterUnit(archer)).toBe(true);
      expect(isRangedKiterUnit(mage)).toBe(true);
      expect(isRangedKiterUnit(warrior)).toBe(false);
    });

    it('kites backwards when target is within melee range (<= 2 tiles)', () => {
      const mockPrev = createMockGameState();
      const kiter: Enemy = {
        id: 'k1',
        name: 'Skeleton Archer',
        type: EnemyType.SkeletonMage,
        x: 5,
        y: 5,
        range: 4,
        hp: 20,
        maxHp: 20
      } as Enemy;

      const moved = executeKitingMovement({
        e: kiter,
        i: 0,
        px: 4,
        py: 5, // 1 tile away (melee)
        chaseTargetX: 4,
        chaseTargetY: 5,
        prev: mockPrev,
        nextEnemies: [kiter],
        updatedEnemiesList: [],
        staticLogs: []
      });

      expect(moved).toBe(true);
      // Archer should have retreated away from (4, 5), increasing distance
      const newDist = Math.abs(kiter.x - 4) + Math.abs(kiter.y - 5);
      expect(newDist).toBeGreaterThan(1);
    });
  });

  describe('Flanking Tactics Strategy', () => {
    it('identifies pack units (goblins, bandits, wolves)', () => {
      const goblin: Enemy = { id: 'g1', name: 'Goblin Sneak', type: EnemyType.Goblin } as Enemy;
      const bandit: Enemy = { id: 'b1', name: 'Bandit Cutthroat', type: EnemyType.Bandit } as Enemy;
      const slime: Enemy = { id: 's1', name: 'Green Slime', type: EnemyType.Slime } as Enemy;

      expect(isPackUnit(goblin)).toBe(true);
      expect(isPackUnit(bandit)).toBe(true);
      expect(isPackUnit(slime)).toBe(false);
    });

    it('maneuvers to flank when attacking target', () => {
      const mockPrev = createMockGameState();
      const packUnit: Enemy = {
        id: 'p1',
        name: 'Pack Wolf',
        type: EnemyType.Bandit,
        x: 5,
        y: 5,
        hp: 20,
        maxHp: 20
      } as Enemy;

      const moved = executeFlankingMovement({
        e: packUnit,
        i: 0,
        px: 10,
        py: 10,
        chaseTargetX: 10,
        chaseTargetY: 10,
        prev: mockPrev,
        nextEnemies: [packUnit],
        updatedEnemiesList: []
      });

      expect(moved).toBe(true);
      expect(packUnit.x !== 5 || packUnit.y !== 5).toBe(true);
    });
  });

  describe('Support Tactics Strategy', () => {
    it('heals wounded allies within 6 tiles', () => {
      const mockPrev = createMockGameState();
      const healer: Enemy = {
        id: 'h1',
        name: 'Goblin Shaman',
        type: EnemyType.Goblin,
        aiRole: 'support_healer',
        x: 5,
        y: 5,
        atk: 8,
        hp: 25,
        maxHp: 25
      } as Enemy;

      const woundedAlly: Enemy = {
        id: 'w1',
        name: 'Orc Brute',
        type: EnemyType.OrcBrute,
        x: 6,
        y: 5,
        hp: 10,
        maxHp: 50 // 20% HP -> critically wounded
      } as Enemy;

      const staticLogs: string[] = [];
      const playSound = vi.fn();

      const context: AITacticContext = {
        e: healer,
        i: 0,
        px: 15,
        py: 15,
        playerHp: 50,
        prev: mockPrev,
        nextGuardsHostile: false,
        nextEnemies: [healer, woundedAlly],
        updatedEnemiesList: [woundedAlly],
        updatedStats: {},
        activeScars: [],
        updatedEffects: [],
        nextDefeatedCounts: {},
        incomingPlayerDamage: 0,
        incomingPlayerHits: 0,
        hadPlayerCrit: false,
        hadPlayerBrace: false,
        staticLogs,
        playSound,
        applyDamageToEnemy: vi.fn(),
        allActiveEntities: [woundedAlly],
        entitySpatialGrid: SpatialEntityGrid.fromEnemies([woundedAlly]),
        isHostile: true,
        sameZ: true,
        distToPlayer: 20,
        dxToPlayer: 10,
        dyToPlayer: 10,
        hasLOS: true,
        enemyRange: 1,
        isWithinAttackRange: false
      };

      const result = executeSupportTactics(context);
      expect(result?.handled).toBe(true);
      expect(woundedAlly.hp).toBeGreaterThan(10);
      expect(staticLogs.some((l) => l.includes('[SUPPORT HEAL]'))).toBe(true);
    });
  });

  describe('Telegraph Attack Strategy', () => {
    it('charges up telegraphed attack and executes when turns expire', () => {
      const mockPrev = createMockGameState();
      const brute: Enemy = {
        id: 'b1',
        name: 'Orc Warlord',
        type: EnemyType.OrcBrute,
        isBoss: true,
        x: 5,
        y: 5,
        atk: 20,
        hp: 100,
        maxHp: 100,
        telegraphedAttack: {
          targetX: 5,
          targetY: 6,
          turnsRemaining: 1,
          damage: 32,
          name: 'Sunder Titan Slam'
        }
      } as Enemy;

      const staticLogs: string[] = [];
      const playSound = vi.fn();

      // Case 1: Player is at (5, 6) when telegraphed attack lands
      const context: AITacticContext = {
        e: brute,
        i: 0,
        px: 5,
        py: 6,
        playerHp: 50,
        prev: mockPrev,
        nextGuardsHostile: false,
        nextEnemies: [brute],
        updatedEnemiesList: [],
        updatedStats: {},
        activeScars: [],
        updatedEffects: [],
        nextDefeatedCounts: {},
        incomingPlayerDamage: 0,
        incomingPlayerHits: 0,
        hadPlayerCrit: false,
        hadPlayerBrace: false,
        staticLogs,
        playSound,
        applyDamageToEnemy: vi.fn(),
        allActiveEntities: [],
        entitySpatialGrid: SpatialEntityGrid.fromEnemies([]),
        isHostile: true,
        sameZ: true,
        distToPlayer: 1,
        dxToPlayer: 0,
        dyToPlayer: 1,
        hasLOS: true,
        enemyRange: 1,
        isWithinAttackRange: true
      };

      const result = resolveTelegraphedAttack(context);
      expect(result?.handled).toBe(true);
      expect(result?.actionResult?.playerHp).toBe(50 - 32);
      expect(brute.telegraphedAttack).toBeNull();
      expect(staticLogs.some((l) => l.includes('[TELEGRAPHED IMPACT]'))).toBe(true);
    });
  });

  describe('Boss Perception Strategy', () => {
    it('alerts companion follower when elite or boss monster is perceived', () => {
      const mockPrev = createMockGameState();
      mockPrev.followers = [{ name: 'Aapo the Hound' } as any];
      const boss: Enemy = {
        id: 'b1',
        name: 'Ancient Lich Commander',
        type: EnemyType.Necromancer,
        isBoss: true,
        maxHp: 150,
        hasWarnedElite: false
      } as Enemy;

      const staticLogs: string[] = [];
      checkElitePerceptionWarning({ e: boss, prev: mockPrev, staticLogs });

      expect(boss.hasWarnedElite).toBe(true);
      expect(staticLogs.some((l) => l.includes('Aapo the Hound'))).toBe(true);
    });
  });
});
