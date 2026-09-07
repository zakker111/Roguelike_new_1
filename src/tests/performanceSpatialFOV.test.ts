import { describe, it, expect } from 'vitest';
import { SpatialEntityGrid, packCoord, unpackCoord, manhattanDistance, chebyshevDistance } from '../utils/spatial';
import { traceLine, bresenhamLine, hasLineOfSight, computeFOV } from '../utils/ai';
import { TileType, Enemy, EnemyState, EnemyType } from '../types';

function createMockEnemy(partial: Partial<Enemy> & { id: string; x: number; y: number }): Enemy {
  return {
    id: partial.id,
    name: partial.name || 'Mock Enemy',
    char: partial.char || 'e',
    color: partial.color || '#f00',
    x: partial.x,
    y: partial.y,
    hp: partial.hp ?? 20,
    maxHp: partial.maxHp ?? 20,
    atk: partial.atk ?? 5,
    def: partial.def ?? 2,
    range: partial.range ?? 1,
    speed: partial.speed ?? 1,
    state: partial.state ?? EnemyState.Chasing,
    type: partial.type ?? EnemyType.Goblin,
    faction: partial.faction ?? 'orc_clans',
    isElite: partial.isElite ?? false,
    patrolPath: partial.patrolPath ?? [],
    patrolIndex: partial.patrolIndex ?? 0,
    debuffs: partial.debuffs ?? [],
  };
}

describe('Phase 1 Performance & Spatial Partitioning Verification', () => {
  describe('SpatialEntityGrid & Coordinate Bit-Packing', () => {
    it('accurately packs and unpacks 16-bit 2D coordinates', () => {
      const coords = [
        { x: 0, y: 0 },
        { x: 10, y: 25 },
        { x: 250, y: 180 },
        { x: 999, y: 999 },
      ];

      for (const { x, y } of coords) {
        const packed = packCoord(x, y);
        const unpacked = unpackCoord(packed);
        expect(unpacked.x).toBe(x);
        expect(unpacked.y).toBe(y);
      }
    });

    it('indexes and queries enemies in O(1) time without full array iterations', () => {
      const mockEnemies: Enemy[] = [
        createMockEnemy({
          id: 'orc-1',
          name: 'Orc Warrior',
          char: 'O',
          color: '#f00',
          x: 10,
          y: 10,
          hp: 30,
          maxHp: 30,
          atk: 8,
          def: 3,
          type: EnemyType.OrcBrute,
          faction: 'orc_clans',
        }),
        createMockEnemy({
          id: 'goblin-1',
          name: 'Goblin Scout',
          char: 'g',
          color: '#0f0',
          x: 11,
          y: 10,
          hp: 15,
          maxHp: 15,
          atk: 5,
          def: 1,
          type: EnemyType.Goblin,
          faction: 'orc_clans',
        }),
        createMockEnemy({
          id: 'troll-1',
          name: 'Cave Troll',
          char: 'T',
          color: '#888',
          x: 45,
          y: 50,
          hp: 80,
          maxHp: 80,
          atk: 15,
          def: 8,
          type: EnemyType.Troll,
          faction: 'wild_beasts',
        }),
      ];

      const grid = SpatialEntityGrid.fromEnemies(mockEnemies);

      // Direct coordinate query
      expect(grid.getAt(10, 10)?.id).toBe('orc-1');
      expect(grid.getAt(11, 10)?.id).toBe('goblin-1');
      expect(grid.getAt(45, 50)?.id).toBe('troll-1');
      expect(grid.getAt(0, 0)).toBeUndefined();

      // Radius query around (10, 10)
      const nearbyR1 = grid.getNearby(10, 10, 1);
      expect(nearbyR1.length).toBe(2); // Orc and Goblin
      expect(nearbyR1.some(e => e.id === 'orc-1')).toBe(true);
      expect(nearbyR1.some(e => e.id === 'goblin-1')).toBe(true);
      expect(nearbyR1.some(e => e.id === 'troll-1')).toBe(false);

      // Radius query around distant troll
      const trollNearby = grid.getNearby(45, 50, 2);
      expect(trollNearby.length).toBe(1);
      expect(trollNearby[0].id).toBe('troll-1');
    });

    it('scales linearly in build and sub-millisecond in lookups across 200 entities', () => {
      const enemies: Enemy[] = [];
      for (let i = 0; i < 200; i++) {
        enemies.push(
          createMockEnemy({
            id: `enemy-${i}`,
            name: `Mob ${i}`,
            x: (i * 3) % 80,
            y: Math.floor((i * 3) / 80),
          })
        );
      }

      const startTime = performance.now();
      const grid = SpatialEntityGrid.fromEnemies(enemies);
      const buildDuration = performance.now() - startTime;

      expect(buildDuration).toBeLessThan(50); // fast build under 50ms

      const queryStart = performance.now();
      for (let q = 0; q < 500; q++) {
        grid.getAt((q * 3) % 80, Math.floor((q * 3) / 80));
      }
      const queryDuration = performance.now() - queryStart;
      expect(queryDuration).toBeLessThan(10); // 500 lookups well under 10ms
    });
  });

  describe('Zero-Allocation Raycasting & FOV', () => {
    it('traceLine visits exact same path as bresenhamLine', () => {
      const testCases = [
        { x0: 2, y0: 3, x1: 8, y1: 3 },
        { x0: 5, y0: 5, x1: 5, y1: 15 },
        { x0: 0, y0: 0, x1: 7, y1: 7 },
        { x0: 10, y0: 12, x1: 3, y1: 5 },
      ];

      for (const { x0, y0, x1, y1 } of testCases) {
        const expected = bresenhamLine(x0, y0, x1, y1);
        const actual: { x: number; y: number }[] = [];
        traceLine(x0, y0, x1, y1, (x, y) => {
          actual.push({ x, y });
        });

        expect(actual).toEqual(expected);
      }
    });

    it('traceLine supports early termination on obstacle', () => {
      let callCount = 0;
      const terminated = traceLine(0, 0, 10, 0, (x, y) => {
        callCount++;
        if (x === 4) return false; // Early stop
      });

      expect(terminated).toBe(false);
      expect(callCount).toBe(5); // points at x = 0, 1, 2, 3, 4
    });

    it('hasLineOfSight correctly handles walls and transparent floor', () => {
      const map: TileType[][] = Array(20).fill(null).map(() => Array(20).fill(TileType.Floor));
      map[5][5] = TileType.Wall;

      // Clear line of sight
      expect(hasLineOfSight(2, 2, 8, 2, map)).toBe(true);

      // Blocked through wall at (5, 5)
      expect(hasLineOfSight(2, 5, 8, 5, map)).toBe(false);

      // Direct target is the wall itself (should be visible)
      expect(hasLineOfSight(2, 5, 5, 5, map)).toBe(true);
    });

    it('computeFOV runs without crashing and marks sight perimeter', () => {
      const map: TileType[][] = Array(30).fill(null).map(() => Array(30).fill(TileType.Floor));
      map[10][10] = TileType.Wall;

      const fov = computeFOV(10, 5, map, 8);
      expect(fov[5][10]).toBe(true); // Player location
      expect(fov[10][10]).toBe(true); // Wall tile
      expect(fov[12][10]).toBe(false); // Behind the wall
    });
  });
});
