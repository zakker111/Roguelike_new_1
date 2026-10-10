/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EntityRegistry,
  EntityManager,
  BaseEntity,
  PlayerEntity,
  EnemyEntity,
  NpcEntity,
  AnimalEntity,
  SummonEntity,
  TrapEntity,
  ProjectileEntity,
  ItemEntity,
  InteractableEntity
} from '../../engine/entities';
import { EffectManager } from '../../engine/effects';

describe('Roguelike Engine - Step 4: Generic Entity System', () => {
  let manager: EntityManager;

  beforeEach(() => {
    manager = new EntityManager();
    EntityRegistry.initDefaults();
  });

  describe('1. Entity Kinds & Definitions in EntityRegistry', () => {
    it('initializes default blueprints for traps, summons, animals, interactables, and projectiles', () => {
      expect(EntityRegistry.has('spike_trap')).toBe(true);
      expect(EntityRegistry.has('bear_trap')).toBe(true);
      expect(EntityRegistry.has('skeleton_minion')).toBe(true);
      expect(EntityRegistry.has('flame_wisp')).toBe(true);
      expect(EntityRegistry.has('cave_rat')).toBe(true);
      expect(EntityRegistry.has('wooden_chest')).toBe(true);
      expect(EntityRegistry.has('arrow')).toBe(true);
    });

    it('filters registered definitions by entity kind', () => {
      const traps = EntityRegistry.getByKind('trap');
      expect(traps.length).toBeGreaterThanOrEqual(3);
      expect(traps.every(t => t.kind === 'trap')).toBe(true);

      const summons = EntityRegistry.getByKind('summon');
      expect(summons.length).toBeGreaterThanOrEqual(2);
      expect(summons.every(s => s.kind === 'summon')).toBe(true);
    });

    it('allows registering custom game-specific entity blueprints', () => {
      EntityRegistry.register({
        id: 'cyber_turret',
        kind: 'summon',
        name: 'Auto-Turret 3000',
        char: 'T',
        color: '#06b6d4',
        baseHp: 40,
        baseAtk: 8,
        baseDef: 5,
        isBlocking: true,
        tags: ['mechanical', 'turret'],
        defaultData: { lifespanTurns: 10 }
      });

      expect(EntityRegistry.has('cyber_turret')).toBe(true);
      const turret = EntityRegistry.create('cyber_turret', { x: 5, y: 5 }) as SummonEntity;
      expect(turret.kind).toBe('summon');
      expect(turret.name).toBe('Auto-Turret 3000');
      expect(turret.hp).toBe(40);
      expect(turret.lifespanTurns).toBe(10);
    });

    it('creates all 9 canonical entity kinds properly', () => {
      // 1. Player
      const player = EntityRegistry.createPlayer({ name: 'Vanguard', x: 0, y: 0 });
      expect(player.kind).toBe('player');
      expect(player.isBlocking).toBe(true);

      // 2. Enemy
      const enemy = EntityRegistry.createEnemy({ name: 'Orc Warrior', x: 1, y: 1, hp: 30, atk: 5, def: 2, char: 'o', color: '#16a34a' });
      expect(enemy.kind).toBe('enemy');
      expect(enemy.hp).toBe(30);

      // 3. NPC
      const npc = EntityRegistry.createNPC({ name: 'Blacksmith Donald', role: 'blacksmith', x: 2, y: 2 });
      expect(npc.kind).toBe('npc');
      expect(npc.isInteractable).toBe(true);

      // 4. Animal
      const animal = EntityRegistry.create('cave_rat', { x: 3, y: 3 }) as AnimalEntity;
      expect(animal.kind).toBe('animal');
      expect(animal.diet).toBe('omnivore');

      // 5. Summon
      const summon = EntityRegistry.create('skeleton_minion', { x: 4, y: 4, ownerId: player.id }) as SummonEntity;
      expect(summon.kind).toBe('summon');
      expect(summon.ownerId).toBe(player.id);

      // 6. Trap
      const trap = EntityRegistry.create('spike_trap', { x: 5, y: 5 }) as TrapEntity;
      expect(trap.kind).toBe('trap');
      expect(trap.isBlocking).toBe(false);
      expect(trap.triggerOnStep).toBe(true);

      // 7. Projectile
      const proj = EntityRegistry.create('arrow', { x: 6, y: 6, ownerId: player.id }) as ProjectileEntity;
      expect(proj.kind).toBe('projectile');
      expect(proj.isBlocking).toBe(false);

      // 8. Item
      const item = EntityRegistry.createItem({ itemId: 'iron_dagger', name: 'Iron Dagger', x: 7, y: 7 });
      expect(item.kind).toBe('item');
      expect(item.isBlocking).toBe(false);

      // 9. Interactable
      const chest = EntityRegistry.create('wooden_chest', { x: 8, y: 8 }) as InteractableEntity;
      expect(chest.kind).toBe('interactable');
      expect(chest.interactType).toBe('chest');
    });
  });

  describe('2. EntityManager Spatial Indexing & Queries', () => {
    it('adds and indexes entities by coordinates and tags', () => {
      const rat = EntityRegistry.create('cave_rat', { x: 10, y: 15 });
      manager.add(rat);

      expect(manager.get(rat.id)).toBeDefined();
      expect(manager.getAt(10, 15)).toHaveLength(1);
      expect(manager.getAt(10, 15)[0].id).toBe(rat.id);
      expect(manager.getByTag('beast')).toHaveLength(1);
    });

    it('identifies blocking entities at coordinates', () => {
      const orc = EntityRegistry.createEnemy({ name: 'Orc', x: 4, y: 4, hp: 20, atk: 4, def: 1, char: 'o', color: '#22c55e' });
      const item = EntityRegistry.createItem({ itemId: 'potion_heal', name: 'Healing Potion', x: 4, y: 4 });

      manager.add(orc);
      manager.add(item);

      expect(manager.getAt(4, 4)).toHaveLength(2);
      const blocker = manager.getBlockingAt(4, 4);
      expect(blocker).toBeDefined();
      expect(blocker?.id).toBe(orc.id);
    });

    it('handles entity movement and updates spatial index', () => {
      const player = EntityRegistry.createPlayer({ name: 'Hero', x: 2, y: 2 });
      manager.add(player);

      expect(manager.getAt(2, 2)).toHaveLength(1);
      expect(manager.getAt(3, 2)).toHaveLength(0);

      const moved = manager.move(player.id, 3, 2);
      expect(moved).toBe(true);
      expect(player.x).toBe(3);
      expect(player.y).toBe(2);
      expect(manager.getAt(2, 2)).toHaveLength(0);
      expect(manager.getAt(3, 2)).toHaveLength(1);
    });

    it('prevents movement into tiles blocked by other blocking entities', () => {
      const hero = EntityRegistry.createPlayer({ name: 'Hero', x: 1, y: 1 });
      const guard = EntityRegistry.createEnemy({ name: 'Guard', x: 2, y: 1, hp: 30, atk: 2, def: 2, char: 'G', color: '#ef4444' });

      manager.add(hero);
      manager.add(guard);

      const moved = manager.move(hero.id, 2, 1);
      expect(moved).toBe(false);
      expect(hero.x).toBe(1);
    });

    it('queries entities within a radial distance', () => {
      const p1 = EntityRegistry.createPlayer({ name: 'Center', x: 10, y: 10 });
      const n1 = EntityRegistry.create('cave_rat', { x: 11, y: 10 }); // Dist 1
      const n2 = EntityRegistry.create('cave_rat', { x: 12, y: 12 }); // Dist 2
      const far = EntityRegistry.create('cave_rat', { x: 20, y: 20 }); // Dist 10

      manager.add(p1);
      manager.add(n1);
      manager.add(n2);
      manager.add(far);

      const nearby = manager.getInRadius(10, 10, 2);
      expect(nearby).toHaveLength(3); // Center, n1, n2
      expect(nearby.map(e => e.id)).not.toContain(far.id);
    });
  });

  describe('3. Lifecycle & Turn Ticking', () => {
    it('decays summons each turn and cleans them up when lifespan expires', () => {
      const summon = EntityRegistry.create('skeleton_minion', { x: 5, y: 5 }) as SummonEntity;
      summon.lifespanTurns = 2;
      manager.add(summon);

      // Turn 1
      const rep1 = manager.tick({ currentTurn: 1 });
      expect(summon.lifespanTurns).toBe(1);
      expect(rep1.expiredSummonIds).toHaveLength(0);
      expect(manager.get(summon.id)).toBeDefined();

      // Turn 2: should expire
      const rep2 = manager.tick({ currentTurn: 2 });
      expect(rep2.expiredSummonIds).toContain(summon.id);
      expect(manager.get(summon.id)).toBeUndefined();
    });

    it('ticks active status effects on living entities and handles deaths', () => {
      const goblin = EntityRegistry.createEnemy({ name: 'Goblin Scout', x: 2, y: 2, hp: 8, atk: 2, def: 0, char: 'g', color: '#16a34a' });
      manager.add(goblin);

      // Apply 5-damage poison per turn
      EffectManager.applyEffect(goblin, 'poison', { damagePerTurn: 5, duration: 3 });

      // Turn 1: 8 HP - 5 = 3 HP
      const rep1 = manager.tick({ currentTurn: 1 });
      expect(goblin.hp).toBe(3);
      expect(rep1.deadEntityIds).toHaveLength(0);

      // Turn 2: 3 HP - 5 = 0 HP (lethal)
      const rep2 = manager.tick({ currentTurn: 2 });
      expect(goblin.hp).toBe(0);
      expect(rep2.deadEntityIds).toContain(goblin.id);
      expect(manager.get(goblin.id)).toBeUndefined();
    });

    it('triggers traps when an entity steps on them', () => {
      const trap = EntityRegistry.create('bear_trap', { x: 4, y: 4 }) as TrapEntity;
      manager.add(trap);

      const hero = EntityRegistry.createPlayer({ name: 'Hero', x: 4, y: 4, hp: 50 });
      manager.add(hero);

      const triggerResult = manager.checkTrapTrigger(hero);
      expect(triggerResult.triggeredTrap).toBeDefined();
      expect(triggerResult.damage).toBe(15);
      expect(hero.hp).toBe(35);
      expect(trap.isTriggered).toBe(true);
      expect(trap.isRevealed).toBe(true);

      // Verify that bear trap inflicted stun
      expect(hero.activeEffects?.some(e => e.id === 'stun')).toBe(true);
    });

    it('steps ballistic projectiles, hits targets, deals damage, and self-destructs', () => {
      const enemy = EntityRegistry.createEnemy({ name: 'Target Dummy', x: 10, y: 5, hp: 20, atk: 0, def: 0, char: 'D', color: '#94a3b8' });
      manager.add(enemy);

      // Projectile launched from (8, 5) towards (10, 5)
      const arrow = EntityRegistry.create('arrow', {
        x: 8,
        y: 5,
        ownerId: 'player',
        customData: { targetX: 10, targetY: 5, damage: 12 }
      }) as ProjectileEntity;
      manager.add(arrow);

      // Tick 1: moves from (8, 5) -> (9, 5)
      manager.tick({ currentTurn: 1 });
      expect(arrow.x).toBe(9);
      expect(enemy.hp).toBe(20);

      // Tick 2: moves from (9, 5) -> (10, 5), hits dummy
      const rep2 = manager.tick({ currentTurn: 2 });
      expect(enemy.hp).toBe(8); // 20 - 12 = 8
      expect(manager.get(arrow.id)).toBeUndefined(); // Destroyed on impact
    });
  });

  describe('4. Legacy Game State Adapters', () => {
    it('converts between existing Enemy interface and EnemyEntity losslessly', () => {
      const legacyEnemy = {
        id: 'legacy_orc_1',
        name: 'Ironhide Orc',
        char: 'O',
        color: '#15803d',
        x: 6,
        y: 8,
        z: 1,
        hp: 45,
        maxHp: 45,
        atk: 9,
        def: 4,
        speed: 1.0,
        level: 3,
        isElite: true,
        eliteEffect: 'berserk',
        faction: 'ironhide_clan',
        aiRole: 'melee' as const,
        abilities: ['cleave']
      };

      const entity = manager.fromEnemy(legacyEnemy as any);
      expect(entity.kind).toBe('enemy');
      expect(entity.id).toBe('legacy_orc_1');
      expect(entity.isElite).toBe(true);
      expect(entity.atk).toBe(9);

      const convertedBack = manager.toEnemy(entity);
      expect(convertedBack.id).toBe(legacyEnemy.id);
      expect(convertedBack.name).toBe(legacyEnemy.name);
      expect(convertedBack.isElite).toBe(true);
      expect(convertedBack.eliteEffect).toBe('berserk');
    });

    it('converts legacy NPC and PlayerStats into generic entities', () => {
      const legacyNpc = {
        id: 'npc_smith_1',
        name: 'Goran the Smith',
        role: 'blacksmith',
        char: 'S',
        color: '#f59e0b',
        x: 12,
        y: 14,
        homeX: 12,
        homeY: 14,
        workX: 12,
        workY: 14,
        dialogue: ['Need your blade sharpened?'],
        scheduleState: 'work' as const
      };

      const npcEntity = manager.fromNPC(legacyNpc as any);
      expect(npcEntity.kind).toBe('npc');
      expect(npcEntity.role).toBe('blacksmith');
      expect(npcEntity.dialogue[0]).toBe('Need your blade sharpened?');

      const legacyStats = {
        hp: 85,
        maxHp: 100,
        mp: 25,
        maxMp: 30,
        atk: 14,
        def: 8,
        level: 2,
        gold: 150,
        xp: 320,
        turnsPlayed: 140
      };

      const playerEntity = manager.fromPlayer(legacyStats as any, { x: 3, y: 7 });
      expect(playerEntity.kind).toBe('player');
      expect(playerEntity.hp).toBe(85);
      expect(playerEntity.gold).toBe(150);
      expect(playerEntity.x).toBe(3);
      expect(playerEntity.y).toBe(7);
    });
  });
});
