/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CombatEngine,
  InventoryEngine,
  GridMap,
  Pathfinder,
  TurnEngine,
  ContentRegistry
} from '../../engine';
import {
  bootstrapGame,
  bootstrapSciFiRoguelike,
  GameBalance
} from '../../game';

describe('Roguelike Engine: Engine / Game Separation (Step 8)', () => {
  describe('Generic CombatEngine (Engine Layer)', () => {
    it('resolves damage calculation and critical strikes without game-specific assumptions', () => {
      const combat = new CombatEngine({ minDamage: 1, defenseDivisor: 2, randomVariance: 0 });

      const attacker = {
        id: 'att_1',
        name: 'Generic Attacker',
        hp: 50,
        maxHp: 50,
        atk: 20,
        def: 5,
        critChance: 1.0, // Guaranteed crit
        critMultiplier: 2.0
      };

      const defender = {
        id: 'def_1',
        name: 'Generic Defender',
        hp: 30,
        maxHp: 30,
        atk: 10,
        def: 6 // 6 / 2 = 3 armor mitigation
      };

      // Raw: 20 * 2 = 40. Mitigated: 40 - 3 = 37. Remaining HP: 0 (defeated)
      const result = combat.resolveAttack(attacker, defender);

      expect(result.hit).toBe(true);
      expect(result.isCritical).toBe(true);
      expect(result.finalDamage).toBe(37);
      expect(result.defenderDied).toBe(true);
      expect(result.remainingHp).toBe(0);
      expect(result.overkill).toBe(7);
    });

    it('handles dodge mechanics and armor penetration', () => {
      const combat = new CombatEngine({ randomVariance: 0 });

      const attacker = {
        id: 'att_2',
        name: 'Attacker',
        hp: 20,
        maxHp: 20,
        atk: 15,
        def: 0
      };

      const agileDefender = {
        id: 'def_2',
        name: 'Agile Target',
        hp: 20,
        maxHp: 20,
        atk: 5,
        def: 10,
        dodgeChance: 1.0 // 100% dodge
      };

      // Mock random returning 0.5 (below 1.0 dodge chance)
      const dodgedResult = combat.resolveAttack(attacker, agileDefender, {}, () => 0.5);
      expect(dodgedResult.hit).toBe(false);
      expect(dodgedResult.isDodged).toBe(true);
      expect(dodgedResult.finalDamage).toBe(0);

      // Undodgeable attack with armor penetration
      const penResult = combat.resolveAttack(attacker, agileDefender, {
        cannotDodge: true,
        armorPenetration: 10 // ignores all armor
      }, () => 0.5);

      expect(penResult.hit).toBe(true);
      expect(penResult.finalDamage).toBe(15);
    });
  });

  describe('Generic InventoryEngine (Engine Layer)', () => {
    it('manages item stacking, slot distribution, and weight caps', () => {
      const inventory = new InventoryEngine({ capacity: 4, maxWeight: 50 });

      // Add stackable items
      const item1 = {
        id: 'potion_1',
        definitionId: 'pot_heal',
        name: 'Potion',
        quantity: 5,
        maxStack: 10,
        weight: 1
      };

      const result1 = inventory.addItem(item1);
      expect(result1.success).toBe(true);
      expect(inventory.countItem('pot_heal')).toBe(5);

      // Add more of same stackable item -> should group into same slot
      const result2 = inventory.addItem({ ...item1, quantity: 4 });
      expect(result2.success).toBe(true);
      expect(inventory.countItem('pot_heal')).toBe(9);
      expect(inventory.getOccupiedSlots().length).toBe(1);

      // Check weight
      expect(inventory.getTotalWeight()).toBe(9);

      // Exceed weight cap
      const heavyItem = {
        id: 'anvil',
        definitionId: 'anvil',
        name: 'Heavy Anvil',
        quantity: 1,
        maxStack: 1,
        weight: 100
      };
      const heavyResult = inventory.addItem(heavyItem);
      expect(heavyResult.success).toBe(false);
      expect(heavyResult.message).toContain('weight limit');
    });

    it('transfers items between two independent inventory containers', () => {
      const playerInv = new InventoryEngine({ capacity: 5 });
      const chestInv = new InventoryEngine({ capacity: 5 });

      playerInv.addItem({
        id: 'gold_coin',
        definitionId: 'coin',
        name: 'Gold Coin',
        quantity: 50,
        maxStack: 999
      });

      expect(playerInv.hasItem('coin', 50)).toBe(true);
      expect(chestInv.hasItem('coin', 1)).toBe(false);

      // Transfer 20 coins into chest
      const transferSuccess = playerInv.transferTo(chestInv, 'coin', 20);
      expect(transferSuccess).toBe(true);
      expect(playerInv.countItem('coin')).toBe(30);
      expect(chestInv.countItem('coin')).toBe(20);
    });
  });

  describe('Generic Map & Pathfinder (Engine Layer)', () => {
    it('performs Bresenham line-of-sight and field of view raycasting', () => {
      const map = new GridMap(10, 10, true);

      // Clear sight line
      const clearRay = map.hasLOS(1, 1, 5, 5);
      expect(clearRay.hasLos).toBe(true);

      // Add wall in between
      map.setTransparent(3, 3, false);
      const blockedRay = map.hasLOS(1, 1, 5, 5);
      expect(blockedRay.hasLos).toBe(false);
      expect(blockedRay.blockingPoint).toEqual({ x: 3, y: 3 });

      // Field of view
      const visible = map.computeFOV(1, 1, 4);
      expect(visible.has('1,1')).toBe(true);
      expect(visible.has('2,2')).toBe(true);
    });

    it('finds shortest path around obstacles using generic A* pathfinding', () => {
      const map = new GridMap(8, 8, true);

      // Build wall barrier at x=3, y=0 to y=6 (leave opening at y=7)
      for (let y = 0; y <= 6; y++) {
        map.setWalkable(3, y, false);
      }

      const start = { x: 1, y: 3 };
      const goal = { x: 5, y: 3 };

      const path = Pathfinder.findPath(map, start, goal);
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual(start);
      expect(path[path.length - 1]).toEqual(goal);

      // Verify path navigates around the wall
      expect(path.some(p => p.y >= 7)).toBe(true);
    });
  });

  describe('Generic TurnEngine (Engine Layer)', () => {
    it('allocates turn frequency based on speed energy accumulation', () => {
      const turnEngine = new TurnEngine();

      turnEngine.addParticipant({
        id: 'fast_actor',
        name: 'Fast Rogue',
        speed: 2.0, // Twice as fast
        energy: 0,
        isAlive: true
      });

      turnEngine.addParticipant({
        id: 'slow_actor',
        name: 'Slow Golem',
        speed: 1.0,
        energy: 0,
        isAlive: true
      });

      const turns: string[] = [];

      for (let i = 0; i < 6; i++) {
        const step = turnEngine.nextActor();
        expect(step).toBeDefined();
        turns.push(step!.actor.id);
        turnEngine.consumeAction(step!.actor.id);
      }

      // Fast actor should get more turns than slow actor
      const fastCount = turns.filter(id => id === 'fast_actor').length;
      const slowCount = turns.filter(id => id === 'slow_actor').length;
      expect(fastCount).toBeGreaterThan(slowCount);
    });
  });

  describe('Game Bootstrap & Content Separation (Game Layer)', () => {
    beforeEach(() => {
      ContentRegistry.getInstance().resetAll();
    });

    it('bootstraps full fantasy game content into generic ContentRegistry', () => {
      const content = ContentRegistry.getInstance();
      bootstrapGame(content);

      // Verify fantasy content populated
      expect(content.enemies.getAll().length).toBeGreaterThan(10);
      expect(content.items.count()).toBeGreaterThan(20);
      expect(content.weapons.count()).toBeGreaterThanOrEqual(5);
      expect(content.abilities.has('infernal_cataclysm')).toBe(true);
      expect(content.effects.has('abyssal_curse')).toBe(true);

      const summary = content.getSummary();
      expect(summary.total).toBeGreaterThan(50);
    });

    it('calculates game balance progression curves', () => {
      expect(GameBalance.getRequiredXp(1)).toBe(50);
      expect(GameBalance.getRequiredXp(5)).toBeGreaterThan(GameBalance.getRequiredXp(2));
      expect(GameBalance.getDepthThreatMultiplier(1)).toBe(1.0);
      expect(GameBalance.getDepthThreatMultiplier(4)).toBe(1.75);
    });
  });

  describe('Final Test: Hot-Swapping To Completely Different Game (Sci-Fi Roguelike)', () => {
    it('runs an entirely different game genre using the exact same generic engine without engine modifications', () => {
      const content = ContentRegistry.getInstance();

      // Bootstrap Sci-Fi Roguelike
      bootstrapSciFiRoguelike(content);

      // 1. Content matches Sci-Fi game
      expect(content.enemies.has('cyber_drone')).toBe(true);
      expect(content.enemies.has('xeno_stalker')).toBe(true);
      expect(content.weapons.has('PlasmaRifle')).toBe(true);
      expect(content.abilities.has('orbital_strike')).toBe(true);
      expect(content.effects.has('emp_glitch')).toBe(true);

      // 2. Generic CombatEngine resolves battle between Sci-Fi drone and alien
      const combat = new CombatEngine({ randomVariance: 0 });
      const droneDef = content.enemies.get('cyber_drone')!;
      const xenoDef = content.enemies.get('xeno_stalker')!;

      const droneCombatant = {
        id: 'drone_1',
        name: droneDef.name,
        hp: droneDef.baseHp,
        maxHp: droneDef.baseHp,
        atk: droneDef.baseAtk,
        def: droneDef.baseDef
      };

      const xenoCombatant = {
        id: 'xeno_1',
        name: xenoDef.name,
        hp: xenoDef.baseHp,
        maxHp: xenoDef.baseHp,
        atk: xenoDef.baseAtk,
        def: xenoDef.baseDef
      };

      const battleResult = combat.resolveAttack(xenoCombatant, droneCombatant);
      expect(battleResult.hit).toBe(true);
      expect(battleResult.finalDamage).toBeGreaterThan(0);
      expect(battleResult.remainingHp).toBeLessThan(droneDef.baseHp);

      // 3. Generic Inventory holds Sci-Fi items
      const spaceInventory = new InventoryEngine();
      const medInjector = content.items.get('nanomed_injector')!;
      spaceInventory.addItem({
        id: 'med_1',
        definitionId: medInjector.id,
        name: medInjector.name,
        quantity: 3,
        maxStack: 10
      });

      expect(spaceInventory.hasItem('nanomed_injector', 3)).toBe(true);
    });
  });
});
