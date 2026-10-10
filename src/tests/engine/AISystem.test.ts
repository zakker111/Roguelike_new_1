/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AIStrategyRegistry,
  AIManager,
  MeleeStrategy,
  RangedStrategy,
  KitingStrategy,
  CowardStrategy,
  AggressiveStrategy,
  DefensiveStrategy,
  SummonerStrategy,
  PatrolStrategy,
  BossStrategy,
  manhattanDistance,
  getStepTowards,
  getStepAway,
  checkBresenhamLOS,
  AIStrategyContext,
  AISpatialQueryContext
} from '../../engine/ai';
import { LivingEntity } from '../../engine/entities';

describe('AI Strategies Engine (Step 5)', () => {
  let mockSpatial: AISpatialQueryContext;

  beforeEach(() => {
    // 20x20 open room with walls at x=10, y=10
    mockSpatial = {
      isPassable: (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= 20 || y >= 20) return false;
        if (x === 10 && y === 10) return false; // single obstacle
        return true;
      },
      hasLineOfSight: (x1: number, y1: number, x2: number, y2: number) => {
        return checkBresenhamLOS(x1, y1, x2, y2, mockSpatial.isPassable);
      }
    };
  });

  describe('AI Navigation & Distance Math', () => {
    it('calculates Manhattan distance properly', () => {
      expect(manhattanDistance(0, 0, 3, 4)).toBe(7);
      expect(manhattanDistance(5, 5, 5, 5)).toBe(0);
    });

    it('navigates greedy step towards target avoiding obstacles', () => {
      const step = getStepTowards(0, 0, 3, 0, mockSpatial);
      expect(step).toEqual({ dx: 1, dy: 0 });
    });

    it('navigates step away from threat', () => {
      const step = getStepAway(5, 5, 5, 4, mockSpatial);
      // Threat is at (5, 4) North; step away should be South (dy: 1)
      expect(step).toEqual({ dx: 0, dy: 1 });
    });

    it('detects clear vs blocked line of sight', () => {
      expect(checkBresenhamLOS(5, 5, 5, 9, mockSpatial.isPassable)).toBe(true);
      // Ray passing directly through obstacle at (10, 10)
      expect(checkBresenhamLOS(10, 8, 10, 12, mockSpatial.isPassable)).toBe(false);
    });
  });

  describe('AIStrategyRegistry', () => {
    it('registers all standard strategies and aliases', () => {
      const registry = AIStrategyRegistry.getInstance();
      const ids = registry.listIds();

      expect(ids).toContain('melee');
      expect(ids).toContain('ranged');
      expect(ids).toContain('kiting');
      expect(ids).toContain('coward');
      expect(ids).toContain('aggressive');
      expect(ids).toContain('defensive');
      expect(ids).toContain('summoner');
      expect(ids).toContain('patrol');
      expect(ids).toContain('boss');

      // Aliases
      expect(registry.has('ambusher')).toBe(true);
      expect(registry.has('skirmisher_kiting')).toBe(true);
      expect(registry.has('coward_flee')).toBe(true);
      expect(registry.has('tank')).toBe(true);
    });

    it('resolves strategies cleanly with fallback', () => {
      const registry = AIStrategyRegistry.getInstance();
      expect(registry.resolve('kiting')).toBeInstanceOf(KitingStrategy);
      expect(registry.resolve('non_existent')).toBeInstanceOf(MeleeStrategy);
    });
  });

  describe('MeleeStrategy', () => {
    const melee = new MeleeStrategy();

    it('attacks adjacent target within range', () => {
      const actor: LivingEntity = {
        id: 'orc_1',
        kind: 'enemy',
        name: 'Orc',
        char: 'o',
        color: '#00ff00',
        x: 2,
        y: 2,
        hp: 30,
        maxHp: 30,
        atk: 5,
        def: 2,
        speed: 1,
        level: 1,
        isBlocking: true,
        isInteractable: false,
        isAlive: true,
        tags: []
      };
      const target: LivingEntity = {
        id: 'player_1',
        kind: 'player',
        name: 'Hero',
        char: '@',
        color: '#ffffff',
        x: 2,
        y: 3,
        hp: 50,
        maxHp: 50,
        atk: 10,
        def: 5,
        speed: 1,
        level: 1,
        isBlocking: true,
        isInteractable: false,
        isAlive: true,
        tags: []
      };

      const decision = melee.decide({ actor, target, spatial: mockSpatial });
      expect(decision.type).toBe('attack');
      expect(decision.targetEntityId).toBe('player_1');
    });

    it('moves closer if target is beyond melee range', () => {
      const actor: LivingEntity = {
        id: 'orc_1',
        kind: 'enemy',
        name: 'Orc',
        char: 'o',
        color: '#00ff00',
        x: 2,
        y: 2,
        hp: 30,
        maxHp: 30,
        atk: 5,
        def: 2,
        speed: 1,
        level: 1,
        isBlocking: true,
        isInteractable: false,
        isAlive: true,
        tags: []
      };
      const target: LivingEntity = {
        id: 'player_1',
        kind: 'player',
        name: 'Hero',
        char: '@',
        color: '#ffffff',
        x: 6,
        y: 2,
        hp: 50,
        maxHp: 50,
        atk: 10,
        def: 5,
        speed: 1,
        level: 1,
        isBlocking: true,
        isInteractable: false,
        isAlive: true,
        tags: []
      };

      const decision = melee.decide({ actor, target, spatial: mockSpatial });
      expect(decision.type).toBe('move');
      expect(decision.delta).toEqual({ dx: 1, dy: 0 });
    });
  });

  describe('RangedStrategy', () => {
    const ranged = new RangedStrategy();

    it('fires ranged attack when target is in range and LOS is clear', () => {
      const actor: any = {
        id: 'archer_1',
        kind: 'enemy',
        name: 'Skeleton Archer',
        x: 2,
        y: 2,
        range: 5,
        hp: 20,
        maxHp: 20,
        abilities: ['shoot']
      };
      const target: any = {
        id: 'player_1',
        kind: 'player',
        name: 'Hero',
        x: 2,
        y: 5,
        hp: 50,
        maxHp: 50
      };

      const decision = ranged.decide({ actor, target, spatial: mockSpatial });
      expect(decision.type).toBe('ability');
      expect(decision.abilityId).toBe('shoot');
    });
  });

  describe('KitingStrategy', () => {
    const kiter = new KitingStrategy(3, 5);

    it('kites backwards when target gets too close (< min safe distance)', () => {
      const actor: any = {
        id: 'skirmisher_1',
        kind: 'enemy',
        name: 'Elf Ranger',
        x: 5,
        y: 5,
        range: 5,
        hp: 25,
        maxHp: 25
      };
      // Target is only 1 tile away!
      const target: any = {
        id: 'player_1',
        kind: 'player',
        name: 'Hero',
        x: 5,
        y: 4,
        hp: 50,
        maxHp: 50
      };

      const decision = kiter.decide({ actor, target, spatial: mockSpatial });
      expect(decision.type).toBe('move');
      // Should retreat away (South: dy: 1)
      expect(decision.delta?.dy).toBeGreaterThan(0);
    });

    it('attacks when positioned within sweet spot', () => {
      const actor: any = {
        id: 'skirmisher_1',
        kind: 'enemy',
        name: 'Elf Ranger',
        x: 5,
        y: 5,
        range: 5,
        hp: 25,
        maxHp: 25
      };
      // Distance is 4 tiles (within 3..5)
      const target: any = {
        id: 'player_1',
        kind: 'player',
        name: 'Hero',
        x: 5,
        y: 9,
        hp: 50,
        maxHp: 50
      };

      const decision = kiter.decide({ actor, target, spatial: mockSpatial });
      expect(decision.type).toBe('attack');
    });
  });

  describe('CowardStrategy', () => {
    const coward = new CowardStrategy(6);

    it('flees when threat enters detection radius', () => {
      const actor: any = {
        id: 'goblin_1',
        kind: 'enemy',
        name: 'Cowardly Goblin',
        x: 4,
        y: 4,
        hp: 8,
        maxHp: 8
      };
      const target: any = {
        id: 'player_1',
        kind: 'player',
        name: 'Hero',
        x: 4,
        y: 2,
        hp: 50,
        maxHp: 50
      };

      const decision = coward.decide({ actor, target, spatial: mockSpatial });
      expect(decision.type).toBe('flee');
      expect(decision.delta?.dy).toBeGreaterThan(0);
    });

    it('waits peacefully when threat is beyond panic radius', () => {
      const actor: any = {
        id: 'rabbit_1',
        kind: 'animal',
        name: 'Rabbit',
        x: 0,
        y: 0,
        hp: 4,
        maxHp: 4
      };
      const target: any = {
        id: 'player_1',
        kind: 'player',
        name: 'Hero',
        x: 18,
        y: 18,
        hp: 50,
        maxHp: 50
      };

      const decision = coward.decide({ actor, target, spatial: mockSpatial });
      expect(decision.type).toBe('wait');
    });
  });

  describe('DefensiveStrategy', () => {
    const defensive = new DefensiveStrategy(3);

    it('holds ground when target is outside guard zone', () => {
      const actor: any = {
        id: 'guard_1',
        kind: 'npc',
        name: 'Gate Sentry',
        x: 5,
        y: 5,
        range: 1,
        hp: 60,
        maxHp: 60
      };
      const target: any = {
        id: 'intruder_1',
        kind: 'enemy',
        name: 'Bandit',
        x: 12,
        y: 12,
        hp: 30,
        maxHp: 30
      };

      const decision = defensive.decide({
        actor,
        target,
        spatial: mockSpatial,
        blackboard: { anchorX: 5, anchorY: 5 }
      });
      expect(decision.type).toBe('wait');
    });

    it('strikes intruder when entering guard perimeter', () => {
      const actor: any = {
        id: 'guard_1',
        kind: 'npc',
        name: 'Gate Sentry',
        x: 5,
        y: 5,
        range: 1,
        hp: 60,
        maxHp: 60
      };
      const target: any = {
        id: 'intruder_1',
        kind: 'enemy',
        name: 'Bandit',
        x: 5,
        y: 6,
        hp: 30,
        maxHp: 30
      };

      const decision = defensive.decide({
        actor,
        target,
        spatial: mockSpatial,
        blackboard: { anchorX: 5, anchorY: 5 }
      });
      expect(decision.type).toBe('attack');
    });
  });

  describe('SummonerStrategy', () => {
    const summoner = new SummonerStrategy(3);

    it('summons minions when minion count is below threshold', () => {
      const actor: any = {
        id: 'necro_1',
        kind: 'enemy',
        name: 'Necromancer',
        x: 10,
        y: 5,
        hp: 40,
        maxHp: 40,
        abilities: ['summon_skeleton']
      };
      const target: any = {
        id: 'hero',
        kind: 'player',
        name: 'Hero',
        x: 15,
        y: 5,
        hp: 50,
        maxHp: 50
      };

      const decision = summoner.decide({
        actor,
        target,
        spatial: mockSpatial,
        visibleEntities: []
      });
      expect(decision.type).toBe('ability');
      expect(decision.abilityId).toBe('summon_skeleton');
    });
  });

  describe('PatrolStrategy', () => {
    const waypoints = [
      { x: 2, y: 2 },
      { x: 6, y: 2 },
      { x: 6, y: 6 }
    ];
    const patrol = new PatrolStrategy(waypoints, 4);

    it('patrols towards the designated waypoint route', () => {
      const actor: any = {
        id: 'patrol_1',
        kind: 'npc',
        name: 'Town Watchman',
        x: 2,
        y: 4,
        hp: 40,
        maxHp: 40
      };

      const blackboard = { currentWaypointIndex: 0 };
      const decision = patrol.decide({
        actor,
        spatial: mockSpatial,
        blackboard
      });
      expect(decision.type).toBe('move');
      // Moving North towards (2, 2)
      expect(decision.delta).toEqual({ dx: 0, dy: -1 });
    });
  });

  describe('BossStrategy', () => {
    const boss = new BossStrategy();

    it('dynamically adapts behavior across health phases', () => {
      // Phase 1 (> 60% HP)
      const actorPhase1: any = {
        id: 'boss_1',
        kind: 'enemy',
        name: 'Dragon Lord',
        x: 5,
        y: 5,
        hp: 90,
        maxHp: 100,
        range: 1,
        abilities: ['summon_drakes', 'fireball', 'nova']
      };
      const target: any = {
        id: 'hero',
        kind: 'player',
        name: 'Hero',
        x: 7,
        y: 5,
        hp: 50,
        maxHp: 50
      };

      const decision1 = boss.decide({ actor: actorPhase1, target, spatial: mockSpatial });
      expect(decision1.type).toBe('ability');
      expect(decision1.abilityId).toBe('summon_drakes');

      // Phase 3 (< 30% HP frenzy)
      const actorPhase3: any = {
        ...actorPhase1,
        hp: 20
      };
      const decision3 = boss.decide({ actor: actorPhase3, target, spatial: mockSpatial });
      expect(decision3.type).toBe('ability');
      expect(decision3.abilityId).toBe('nova');
      expect(decision3.metadata?.phase).toBe(3);
    });
  });

  describe('AIManager Coordinator', () => {
    it('executes planned movement callback seamlessly', () => {
      const manager = AIManager.getInstance();
      const actor: any = {
        id: 'orc_1',
        kind: 'enemy',
        name: 'Orc',
        x: 1,
        y: 1,
        hp: 20,
        maxHp: 20,
        aiRole: 'melee'
      };
      const target: any = {
        id: 'player_1',
        kind: 'player',
        name: 'Hero',
        x: 5,
        y: 1,
        hp: 50,
        maxHp: 50
      };

      let movedTo: { x: number; y: number } | null = null;
      const result = manager.executeTurn(
        { actor, target, spatial: mockSpatial },
        {
          onMove: (act, newX, newY) => {
            movedTo = { x: newX, y: newY };
          }
        }
      );

      expect(result.executed).toBe(true);
      expect(movedTo).toEqual({ x: 2, y: 1 });
    });
  });
});
