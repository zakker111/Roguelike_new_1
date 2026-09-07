import { describe, it, expect, vi } from 'vitest';
import { TileType, Enemy, EnemyType, EnemyState, GameState } from '../types';
import { findNearestSafePlayerTile } from '../utils/gameUtils';
import { calculateGlobalThreatFactor, spawnDungeonStandardEnemies } from '../world/dungeon/dungeonEntities';
import { processHostileTurn } from '../hooks/ai/useHostileAI';

describe('Border Carving & Combat Balance Suite', () => {
  describe('Chunk Border Carving System', () => {
    it('carves woods/trees in-place instead of spiral warping the player away', () => {
      // 5x5 map with trees everywhere except (4,4)
      const map: TileType[][] = Array.from({ length: 5 }, () =>
        Array.from({ length: 5 }, () => TileType.Tree)
      );
      map[4][4] = TileType.Floor;

      // When player enters at (0, 0) where there is a tree:
      const result = findNearestSafePlayerTile(0, 0, map, true);

      // Player should carve out (0, 0) and land on it, NOT warp to (4, 4)
      expect(result).toEqual({ x: 0, y: 0 });
      expect(map[0][0]).toBe(TileType.Grass);
    });

    it('carves bushes and mineral veins at entry point', () => {
      const map: TileType[][] = [
        [TileType.Bush, TileType.Wall],
        [TileType.IronVein, TileType.Floor]
      ];

      const resBush = findNearestSafePlayerTile(0, 0, map, true);
      expect(resBush).toEqual({ x: 0, y: 0 });
      expect(map[0][0]).toBe(TileType.Grass);

      const resVein = findNearestSafePlayerTile(0, 1, map, true);
      expect(resVein).toEqual({ x: 0, y: 1 });
      expect(map[1][0]).toBe(TileType.Grass);
    });
  });

  describe('Dungeon Enemy Balance', () => {
    it('provides accessible threat factor and defense for depth 1 dungeons', () => {
      const threatFactor = calculateGlobalThreatFactor(
        1, // depth 1
        150, // turnsPlayed
        600, // realTimeSeconds
        { level: 1, str: 10, dex: 10, int: 10, cha: 10, lck: 10 },
        { damage: 6, name: 'Iron Sword' }
      );

      // Depth 1 threat factor must remain fair and killable (<= 1.20)
      expect(threatFactor).toBeLessThanOrEqual(1.20);
      expect(threatFactor).toBeGreaterThanOrEqual(0.9);
    });

    it('spawns killable standard enemies in depth 1 with DEF <= 1', () => {
      const rooms = [
        { x: 2, y: 2, w: 6, h: 6 },
        { x: 12, y: 12, w: 8, h: 8 }
      ];

      const enemies = spawnDungeonStandardEnemies(
        rooms,
        1, // depth 1
        5, 5,
        [],
        [],
        1.1,
        0,
        { level: 1, str: 10, dex: 10, int: 10, cha: 10, lck: 10 }
      );

      expect(enemies.length).toBeGreaterThan(0);
      for (const e of enemies) {
        if (!e.isElite) {
          // Standard enemies in depth 1 should have DEF capped at 1 so player deals real damage
          expect(e.def).toBeLessThanOrEqual(1);
          // And reasonable HP (capped at 38 even for brutes)
          expect(e.hp).toBeLessThanOrEqual(38);
        }
      }
    });
  });

  describe('Follower Damage & Enemy Target Swapping', () => {
    it('allows hostile enemies to target and damage followers in melee range', () => {
      const hostile: Enemy = {
        id: 'orc_1',
        name: 'Orc Warrior',
        char: 'o',
        color: '#22c55e',
        type: EnemyType.OrcBrute,
        hp: 30,
        maxHp: 30,
        atk: 8,
        def: 2,
        x: 5,
        y: 5,
        state: EnemyState.Chasing,
        isElite: false,
        range: 1,
        speed: 1.0,
        debuffs: [],
        patrolPath: [],
        patrolIndex: 0
      };

      const follower: Enemy = {
        id: 'fol_cat_1',
        name: 'Sir Paws (Companion)',
        char: '🐱',
        color: '#f59e0b',
        type: EnemyType.Goblin,
        hp: 40,
        maxHp: 40,
        atk: 5,
        def: 1,
        x: 6,
        y: 5, // adjacent to hostile
        state: EnemyState.Chasing,
        isElite: true,
        isFollower: true,
        followerId: 'cat_1',
        range: 1,
        speed: 1.0,
        debuffs: [],
        patrolPath: [],
        patrolIndex: 0
      };

      let followerDamaged = false;
      const mockApplyDamage = vi.fn((target: Enemy, dmg: number) => {
        if (target.id === follower.id) {
          followerDamaged = true;
          target.hp -= dmg;
        }
        return target.hp <= 0;
      });

      const mockPrev = {
        map: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => TileType.Floor)),
        visible: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => true)),
        isBraced: false,
        playerStats: { level: 1, maxHp: 50, hp: 50 }
      } as unknown as GameState;

      // Player is at (1, 1), out of melee range of hostile (5, 5). Follower is at (6, 5), adjacent!
      const result = processHostileTurn({
        e: hostile,
        i: 0,
        px: 1,
        py: 1,
        playerHp: 50,
        prev: mockPrev,
        nextGuardsHostile: false,
        nextEnemies: [hostile, follower],
        updatedEnemiesList: [],
        updatedStats: { maxHp: 50, turnsPlayed: 10 },
        activeScars: [],
        updatedEffects: [],
        nextDefeatedCounts: {},
        incomingPlayerDamage: 0,
        incomingPlayerHits: 0,
        hadPlayerCrit: false,
        hadPlayerBrace: false,
        staticLogs: [],
        playSound: vi.fn(),
        applyDamageToEnemy: mockApplyDamage
      });

      // Hostile should attack the adjacent follower!
      expect(mockApplyDamage).toHaveBeenCalled();
      expect(followerDamaged).toBe(true);
      expect(follower.hp).toBeLessThan(40);
      // Player was out of range, so player took 0 damage
      expect(result.incomingPlayerDamage).toBe(0);
    });
  });
});
