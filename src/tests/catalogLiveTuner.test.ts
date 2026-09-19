/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { catalogLiveTuner } from '../utils/catalogLiveTuner';
import { WEAPON_TEMPLATES } from '../data/items';
import { MONSTER_ENTRIES } from '../data/monsters';
import { SPELLS } from '../utils/spellsAndEquipment';
import { BALANCE_CONFIG } from '../data/balance';
import { WeaponBaseType } from '../types';

describe('In-Game Data Catalog Live Tuner Engine', () => {
  beforeEach(() => {
    // Reset tuner to stock state before every test
    catalogLiveTuner.resetAll();
  });

  it('initializes with stock defaults and zero overrides', () => {
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(0);
    const profile = catalogLiveTuner.getProfile();
    expect(Object.keys(profile.weapons).length).toBe(0);
    expect(Object.keys(profile.monsters).length).toBe(0);
    expect(Object.keys(profile.spells).length).toBe(0);
    expect(Object.keys(profile.balance).length).toBe(0);
  });

  it('tunes weapon base damage and crit chance dynamically', () => {
    const stockDamage = catalogLiveTuner.getStockWeapons()[WeaponBaseType.Sword]?.damage || 5;
    expect(WEAPON_TEMPLATES[WeaponBaseType.Sword].baseDamage).toBe(stockDamage);

    // Apply live damage override
    catalogLiveTuner.setWeaponOverride(WeaponBaseType.Sword, 'damage', 25);
    catalogLiveTuner.setWeaponOverride(WeaponBaseType.Sword, 'critChance', 0.5);

    expect(WEAPON_TEMPLATES[WeaponBaseType.Sword].baseDamage).toBe(25);
    expect(WEAPON_TEMPLATES[WeaponBaseType.Sword].baseCrit).toBe(0.5);
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(2);

    // Revert single weapon
    catalogLiveTuner.resetWeapon(WeaponBaseType.Sword);
    expect(WEAPON_TEMPLATES[WeaponBaseType.Sword].baseDamage).toBe(stockDamage);
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(0);
  });

  it('tunes bestiary monster stats in real time', () => {
    const wolf = MONSTER_ENTRIES.find((m) => m.key.toLowerCase() === 'wolf');
    expect(wolf).toBeDefined();
    const stockWolfHp = catalogLiveTuner.getStockMonsters()['wolf']?.baseHp || 18;

    catalogLiveTuner.setMonsterOverride('wolf', 'baseHp', 150);
    catalogLiveTuner.setMonsterOverride('wolf', 'baseAtk', 30);

    expect(wolf!.baseHp).toBe(150);
    expect(wolf!.baseAtk).toBe(30);
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(2);

    // Reset monster category
    catalogLiveTuner.resetCategory('monsters');
    expect(wolf!.baseHp).toBe(stockWolfHp);
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(0);
  });

  it('tunes spell mana costs and damage multipliers', () => {
    const firstSpell = SPELLS[0];
    expect(firstSpell).toBeDefined();
    const stockCost = catalogLiveTuner.getStockSpells()[firstSpell.id]?.manaCost || 8;

    catalogLiveTuner.setSpellOverride(firstSpell.id, 'manaCost', 1);
    catalogLiveTuner.setSpellOverride(firstSpell.id, 'damageMultiplier', 5.0);

    expect(firstSpell.manaCost).toBe(1);
    expect(firstSpell.damageMultiplier).toBe(5.0);
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(2);

    // Revert spell
    catalogLiveTuner.resetSpell(firstSpell.id);
    expect(firstSpell.manaCost).toBe(stockCost);
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(0);
  });

  it('tunes global balance constants directly', () => {
    const stockCritMult = catalogLiveTuner.getStockBalance().critMultiplier;

    catalogLiveTuner.setBalanceOverride('critMultiplier', 3.5);
    catalogLiveTuner.setBalanceOverride('baseAttackPower', 50);

    expect(BALANCE_CONFIG.BASE_CRIT_MULTIPLIER).toBe(3.5);
    expect(BALANCE_CONFIG.BASE_ATTACK_POWER).toBe(50);
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(2);

    // Reset balance category
    catalogLiveTuner.resetCategory('balance');
    expect(BALANCE_CONFIG.BASE_CRIT_MULTIPLIER).toBe(stockCritMult);
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(0);
  });

  it('exports and imports balance patch profiles via JSON', () => {
    catalogLiveTuner.setWeaponOverride(WeaponBaseType.Dagger, 'damage', 12);
    catalogLiveTuner.setBalanceOverride('critMultiplier', 2.8);

    const exportedJson = catalogLiveTuner.exportProfileJson();
    expect(exportedJson).toContain('"damage": 12');
    expect(exportedJson).toContain('"critMultiplier": 2.8');

    // Clear all
    catalogLiveTuner.resetAll();
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(0);

    // Re-import
    const importRes = catalogLiveTuner.importProfileJson(exportedJson);
    expect(importRes.success).toBe(true);
    expect(WEAPON_TEMPLATES[WeaponBaseType.Dagger].baseDamage).toBe(12);
    expect(BALANCE_CONFIG.BASE_CRIT_MULTIPLIER).toBe(2.8);
    expect(catalogLiveTuner.getActiveOverrideCount()).toBe(2);
  });

  it('subscribes to live tuner changes and notifies listeners', () => {
    const listener = vi.fn();
    const unsubscribe = catalogLiveTuner.subscribe(listener);

    catalogLiveTuner.setWeaponOverride(WeaponBaseType.Hammer, 'damage', 40);
    expect(listener).toHaveBeenCalledTimes(1);

    catalogLiveTuner.resetWeapon(WeaponBaseType.Hammer);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    catalogLiveTuner.setWeaponOverride(WeaponBaseType.Hammer, 'damage', 45);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
