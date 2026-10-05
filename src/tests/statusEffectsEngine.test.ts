import { describe, it, expect } from 'vitest';
import {
  STATUS_EFFECT_REGISTRY,
  getStatusEffectDefinition,
} from '../effects/statusEffectRegistry';
import {
  createActiveStatus,
  applyStatusToList,
  removeStatusFromList,
  hasStatusInList,
  aggregateStatusModifiers,
} from '../effects/statusEngine';
import { PlayerEffect } from '../types/entities';

describe('Unified Status Effects & Buffs Sub-Engine', () => {
  describe('StatusEffectRegistry', () => {
    it('contains definitions for core debuffs and buffs', () => {
      const coreIds = ['poison', 'bleeding', 'burning', 'frozen', 'stunned', 'weakened', 'blessed', 'shielded', 'regeneration', 'bloodlust', 'clarity'];
      for (const id of coreIds) {
        const def = getStatusEffectDefinition(id);
        expect(def, `Missing status effect: ${id}`).toBeDefined();
        expect(def?.id).toBe(id);
        expect(def?.name).toBeTruthy();
        expect(def?.icon).toBeTruthy();
        expect(def?.type).toMatch(/^(buff|debuff)$/);
      }
    });

    it('frozen and stunned correctly specify preventsAction flag', () => {
      expect(getStatusEffectDefinition('frozen')?.preventsAction).toBe(true);
      expect(getStatusEffectDefinition('stunned')?.preventsAction).toBe(true);
      expect(getStatusEffectDefinition('poison')?.preventsAction).toBeFalsy();
    });
  });

  describe('Status Engine List Operations', () => {
    it('creates an active PlayerEffect from registry template', () => {
      const effect = createActiveStatus('poison');
      expect(effect.id).toBe('poison');
      expect(effect.name).toBe('Poisoned');
      expect(effect.turnsRemaining).toBe(5);
      expect(effect.damagePerTurn).toBe(3);
    });

    it('allows overriding duration and potency during creation', () => {
      const custom = createActiveStatus('burning', { duration: 8, damagePerTurn: 10 });
      expect(custom.turnsRemaining).toBe(8);
      expect(custom.damagePerTurn).toBe(10);
    });

    it('applies and replaces status without duplicating list entries', () => {
      let list: PlayerEffect[] = [];
      list = applyStatusToList(list, 'poison', { duration: 5 });
      expect(list.length).toBe(1);
      expect(list[0].turnsRemaining).toBe(5);

      // Refresh poison with new duration
      list = applyStatusToList(list, 'poison', { duration: 10 });
      expect(list.length).toBe(1);
      expect(list[0].turnsRemaining).toBe(10);

      // Add a distinct buff
      list = applyStatusToList(list, 'blessed');
      expect(list.length).toBe(2);
      expect(hasStatusInList(list, 'blessed')).toBe(true);
    });

    it('removes status from list cleanly', () => {
      let list: PlayerEffect[] = [
        createActiveStatus('poison'),
        createActiveStatus('shielded'),
      ];
      list = removeStatusFromList(list, 'poison');
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('shielded');
      expect(hasStatusInList(list, 'poison')).toBe(false);
    });

    it('aggregates stat modifiers across active buffs and debuffs', () => {
      const list: PlayerEffect[] = [
        createActiveStatus('blessed'), // atk: 5, crit: 5
        createActiveStatus('shielded'), // def: 6
        createActiveStatus('weakened'), // atk: -4
      ];
      const mods = aggregateStatusModifiers(list);
      expect(mods.atk).toBe(1); // 5 - 4
      expect(mods.def).toBe(6);
      expect(mods.crit).toBe(5);
    });
  });
});
