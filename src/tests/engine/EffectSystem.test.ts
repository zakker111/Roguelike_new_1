/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EffectRegistry } from '../../engine/effects/EffectRegistry';
import { EffectManager } from '../../engine/effects/EffectManager';
import { EffectTarget, EffectDefinition } from '../../engine/effects/types';

describe('Generic Effect System (ENGINEPLAN.md Step 3)', () => {
  let registry: EffectRegistry;
  let manager: EffectManager;

  beforeEach(() => {
    registry = new EffectRegistry();
    manager = new EffectManager(registry);
  });

  describe('Default Registry Catalog', () => {
    it('has all 8 core effects specified in ENGINEPLAN.md', () => {
      const requiredEffects = [
        'poison',
        'burning',
        'bleeding',
        'freezing',
        'stun',
        'slow',
        'shield',
        'regeneration',
      ];

      for (const id of requiredEffects) {
        expect(registry.hasEffect(id), `Missing required effect: ${id}`).toBe(true);
        const def = registry.getEffect(id);
        expect(def).toBeDefined();
        expect(def?.name).toBeTruthy();
        expect(def?.type).toMatch(/^(buff|debuff)$/);
      }
    });

    it('allows dynamic registration of custom effects', () => {
      const customDef: EffectDefinition = {
        id: 'corrosion',
        name: 'Acid Corrosion',
        type: 'debuff',
        icon: '🧪',
        color: '#84cc16',
        description: 'Eats away at armor.',
        defaultDuration: 3,
        statModifiers: { def: -10 },
      };

      registry.registerEffect(customDef);
      expect(registry.hasEffect('corrosion')).toBe(true);
      expect(registry.getEffect('corrosion')?.name).toBe('Acid Corrosion');
    });
  });

  describe('Applying Effects Across Generic Entities', () => {
    it('applies effects seamlessly to player, enemy, follower, and NPC entities', () => {
      const player: EffectTarget = { id: 'player', name: 'Hero', hp: 100, maxHp: 100, isPlayer: true };
      const enemy: EffectTarget = { id: 'enemy_1', name: 'Orc Warrior', hp: 60, maxHp: 60 };
      const follower: EffectTarget = { id: 'follower_1', name: 'Aria', hp: 50, maxHp: 50 };
      const npc: EffectTarget = { id: 'npc_1', name: 'Blacksmith', hp: 40, maxHp: 40 };

      const resPlayer = manager.applyEffect(player, 'regeneration');
      const resEnemy = manager.applyEffect(enemy, 'burning');
      const resFollower = manager.applyEffect(follower, 'shield');
      const resNpc = manager.applyEffect(npc, 'blessed');

      expect(resPlayer.applied).toBe(true);
      expect(manager.hasEffect(player, 'regeneration')).toBe(true);

      expect(resEnemy.applied).toBe(true);
      expect(manager.hasEffect(enemy, 'burning')).toBe(true);

      expect(resFollower.applied).toBe(true);
      expect(manager.hasEffect(follower, 'shield')).toBe(true);

      expect(resNpc.applied).toBe(true);
      expect(manager.hasEffect(npc, 'blessed')).toBe(true);
    });

    it('correctly handles stack_intensity stacking behavior (e.g. Poison)', () => {
      const target: EffectTarget = { id: 'goblin', name: 'Goblin', hp: 30, maxHp: 30 };

      manager.applyEffect(target, 'poison');
      let effect = manager.getEffect(target, 'poison');
      expect(effect?.stacks).toBe(1);

      // Apply second poison stack
      manager.applyEffect(target, 'poison');
      effect = manager.getEffect(target, 'poison');
      expect(effect?.stacks).toBe(2);

      // Stacks up to maxStacks (5)
      manager.applyEffect(target, 'poison');
      manager.applyEffect(target, 'poison');
      manager.applyEffect(target, 'poison');
      manager.applyEffect(target, 'poison'); // 6th attempt
      effect = manager.getEffect(target, 'poison');
      expect(effect?.stacks).toBe(5);
    });

    it('correctly handles refresh stacking behavior (e.g. Burning)', () => {
      const target: EffectTarget = { id: 'troll', name: 'Cave Troll', hp: 100, maxHp: 100 };

      manager.applyEffect(target, 'burning', { duration: 3 });
      manager.tickEffects(target); // duration becomes 2

      let effect = manager.getEffect(target, 'burning');
      expect(effect?.duration).toBe(2);

      manager.applyEffect(target, 'burning', { duration: 3 }); // refreshes back to 3
      effect = manager.getEffect(target, 'burning');
      expect(effect?.duration).toBe(3);
    });
  });

  describe('Turn Ticks: DoTs, HoTs & Expiration', () => {
    it('inflicts DoT damage multiplied by stacks and updates entity HP', () => {
      const target: EffectTarget = { id: 'target', name: 'Target Dummy', hp: 50, maxHp: 50 };

      // Apply poison (damagePerTurn: 3) with 2 stacks -> 6 damage per turn
      manager.applyEffect(target, 'poison');
      manager.applyEffect(target, 'poison');

      const tickResult = manager.tickEffects(target);

      expect(tickResult.damageTaken).toBe(6);
      expect(target.hp).toBe(44);
      expect(tickResult.isEntityDead).toBe(false);
    });

    it('restores HoT health up to maxHp', () => {
      const target: EffectTarget = { id: 'wounded', name: 'Wounded Guard', hp: 20, maxHp: 30 };

      // Regeneration heals 4 HP per turn
      manager.applyEffect(target, 'regeneration');

      const tickResult = manager.tickEffects(target);
      expect(tickResult.healingReceived).toBe(4);
      expect(target.hp).toBe(24);

      // Second tick heals 4 HP, capped at maxHp 30 (so +6 total, 24 + 4 = 28)
      manager.tickEffects(target);
      expect(target.hp).toBe(28);

      // Third tick capped at 30
      manager.tickEffects(target);
      expect(target.hp).toBe(30);
    });

    it('flags entity death when DoT damage reduces HP to 0 or below', () => {
      const target: EffectTarget = { id: 'fragile_bat', name: 'Fragile Bat', hp: 3, maxHp: 10 };

      manager.applyEffect(target, 'burning'); // 5 fire damage per turn
      const tickResult = manager.tickEffects(target);

      expect(target.hp).toBe(0);
      expect(tickResult.isEntityDead).toBe(true);
    });

    it('expires effects when duration drops to 0 and invokes onExpireLog', () => {
      const target: EffectTarget = { id: 'hero', name: 'Knight', hp: 100, maxHp: 100 };

      manager.applyEffect(target, 'stun', { duration: 1 });
      expect(manager.hasEffect(target, 'stun')).toBe(true);

      const tickResult = manager.tickEffects(target);
      expect(tickResult.expiredEffectIds).toContain('stun');
      expect(manager.hasEffect(target, 'stun')).toBe(false);
      expect(tickResult.logs.some((log) => log.includes('shakes off the stun'))).toBe(true);
    });
  });

  describe('Protective Shield Absorption', () => {
    it('absorbs incoming damage before health is lost', () => {
      const target: EffectTarget = { id: 'mage', name: 'Mage', hp: 50, maxHp: 50 };

      // Apply Aegis shield with 20 shield pool
      manager.applyEffect(target, 'shield', { shieldAmount: 20 });

      // Take 12 damage
      const absorb1 = manager.absorbDamageWithShield(target, 12);
      expect(absorb1.absorbedDamage).toBe(12);
      expect(absorb1.remainingDamage).toBe(0);
      expect(target.hp).toBe(50); // HP unaffected

      const shieldEffect = manager.getEffect(target, 'shield');
      expect(shieldEffect?.shieldCurrent).toBe(8);

      // Take another 15 damage -> absorbs 8, shatters, 7 spills over
      const absorb2 = manager.absorbDamageWithShield(target, 15);
      expect(absorb2.absorbedDamage).toBe(8);
      expect(absorb2.remainingDamage).toBe(7);
      expect(manager.hasEffect(target, 'shield')).toBe(false); // Shattered
    });
  });

  describe('Crowd Control & Action Inhibitions', () => {
    it('correctly evaluates action inhibitions for Stun and Freeze', () => {
      const normalTarget: EffectTarget = { id: 'normal', name: 'Fighter', hp: 50, maxHp: 50 };
      expect(manager.checkInhibitions(normalTarget)).toEqual({
        canMove: true,
        canAttack: true,
        canCast: true,
        canUseItems: true,
        isStunned: false,
        isFrozen: false,
        isSlowed: false,
      });

      // Apply Stun
      manager.applyEffect(normalTarget, 'stun');
      const stunnedState = manager.checkInhibitions(normalTarget);
      expect(stunnedState.canMove).toBe(false);
      expect(stunnedState.canAttack).toBe(false);
      expect(stunnedState.canCast).toBe(false);
      expect(stunnedState.canUseItems).toBe(false);
      expect(stunnedState.isStunned).toBe(true);

      // Remove Stun and apply Freezing
      manager.removeEffect(normalTarget, 'stun');
      manager.applyEffect(normalTarget, 'freezing');
      const frozenState = manager.checkInhibitions(normalTarget);
      expect(frozenState.canMove).toBe(false);
      expect(frozenState.canAttack).toBe(false);
      expect(frozenState.isFrozen).toBe(true);

      // Remove Freezing and apply Slow
      manager.removeEffect(normalTarget, 'freezing');
      manager.applyEffect(normalTarget, 'slow');
      const slowedState = manager.checkInhibitions(normalTarget);
      expect(slowedState.canMove).toBe(true);
      expect(slowedState.canAttack).toBe(true);
      expect(slowedState.isSlowed).toBe(true);
    });
  });

  describe('Stat Modifier Aggregation & Dispel', () => {
    it('aggregates stat modifiers from multiple concurrent buffs and debuffs', () => {
      const target: EffectTarget = { id: 'berserker', name: 'Berserker', hp: 80, maxHp: 80 };

      manager.applyEffect(target, 'blessed'); // atk +5, crit +5
      manager.applyEffect(target, 'bloodlust'); // atk +4, crit +15
      manager.applyEffect(target, 'weakened'); // atk -4
      manager.applyEffect(target, 'shield'); // def +4

      const stats = manager.aggregateStatModifiers(target);
      expect(stats.atk).toBe(5 + 4 - 4); // 5
      expect(stats.crit).toBe(5 + 15); // 20
      expect(stats.def).toBe(4);
    });

    it('dispels only debuffs or only buffs when filtering clearEffects', () => {
      const target: EffectTarget = { id: 'unit', name: 'Paladin', hp: 70, maxHp: 70 };

      manager.applyEffect(target, 'poison');
      manager.applyEffect(target, 'burning');
      manager.applyEffect(target, 'blessed');

      // Clear all debuffs (cleanse)
      const removedDebuffs = manager.clearEffects(target, 'debuff');
      expect(removedDebuffs).toEqual(['poison', 'burning']);
      expect(manager.hasEffect(target, 'poison')).toBe(false);
      expect(manager.hasEffect(target, 'burning')).toBe(false);
      expect(manager.hasEffect(target, 'blessed')).toBe(true); // Buff remains intact
    });
  });
});
