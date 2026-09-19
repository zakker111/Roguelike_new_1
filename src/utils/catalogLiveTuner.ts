/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponBaseType } from '../types';
import { WEAPON_TEMPLATES } from '../data/items';
import { MONSTER_ENTRIES, BestiaryEntry } from '../data/monsters';
import { SPELLS, Spell } from './spellsAndEquipment';
import { BALANCE_CONFIG } from '../data/balance';
import weaponTemplatesJson from '../data/weaponTemplates.json';
import bestiaryJson from '../data/bestiary.json';
import spellsCatalogJson from '../data/spellsCatalog.json';

export interface WeaponTuningOverride {
  damage?: number;
  critChance?: number;
  range?: number;
  durability?: number;
}

export interface MonsterTuningOverride {
  baseHp?: number;
  baseAtk?: number;
  baseDef?: number;
  speed?: number;
  range?: number;
}

export interface SpellTuningOverride {
  manaCost?: number;
  damageMultiplier?: number;
}

export interface BalanceTuningOverride {
  baseAttackPower?: number;
  critMultiplier?: number;
  armorMitigationCap?: number;
  levelXpMultiplier?: number;
  shopMarkupMultiplier?: number;
  caravanTariffRate?: number;
}

export interface TuningProfile {
  version: string;
  lastModified: string;
  weapons: Record<string, WeaponTuningOverride>;
  monsters: Record<string, MonsterTuningOverride>;
  spells: Record<string, SpellTuningOverride>;
  balance: BalanceTuningOverride;
}

const STORAGE_KEY = 'abyss_catalog_live_tuner_v1';

// Default snapshot caches for computing live deltas and restoring stock values
const STOCK_WEAPONS: Record<string, { damage: number; critChance: number; range: number; durability: number }> = {};
Object.entries(weaponTemplatesJson).forEach(([key, val]: [string, any]) => {
  STOCK_WEAPONS[key] = {
    damage: val.baseDamage ?? val.damage ?? 5,
    critChance: val.baseCrit ?? val.critChance ?? 0.05,
    range: val.range ?? 1,
    durability: val.durability ?? 100
  };
});

const STOCK_MONSTERS: Record<string, { baseHp: number; baseAtk: number; baseDef: number; speed: number; range: number }> = {};
(bestiaryJson as any[]).forEach((m) => {
  STOCK_MONSTERS[m.key.toLowerCase()] = {
    baseHp: m.baseHp ?? 20,
    baseAtk: m.baseAtk ?? 5,
    baseDef: m.baseDef ?? 2,
    speed: m.speed ?? 10,
    range: m.range ?? 1
  };
});

const STOCK_SPELLS: Record<string, { manaCost: number; damageMultiplier: number }> = {};
(spellsCatalogJson as any[]).forEach((s) => {
  STOCK_SPELLS[s.id] = {
    manaCost: s.manaCost ?? 10,
    damageMultiplier: s.damageMultiplier ?? 1.0
  };
});

const STOCK_BALANCE = {
  baseAttackPower: BALANCE_CONFIG.BASE_ATTACK_POWER,
  critMultiplier: BALANCE_CONFIG.BASE_CRIT_MULTIPLIER,
  armorMitigationCap: BALANCE_CONFIG.ARMOR_MITIGATION_CAP,
  levelXpMultiplier: BALANCE_CONFIG.LEVEL_XP_MULTIPLIER,
  shopMarkupMultiplier: 1.0,
  caravanTariffRate: 0.15
};

class CatalogLiveTuner {
  private profile: TuningProfile;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Ensure all WEAPON_TEMPLATES have damage and critChance mapped to baseDamage and baseCrit
    Object.values(WEAPON_TEMPLATES).forEach((tmpl) => {
      if (tmpl) {
        if ((tmpl as any).damage === undefined) (tmpl as any).damage = tmpl.baseDamage;
        if ((tmpl as any).critChance === undefined) (tmpl as any).critChance = tmpl.baseCrit;
      }
    });

    this.profile = this.loadFromStorage();
    this.applyAllOverrides();
  }

  private getDefaultProfile(): TuningProfile {
    return {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      weapons: {},
      monsters: {},
      spells: {},
      balance: {}
    };
  }

  private loadFromStorage(): TuningProfile {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return {
              version: parsed.version || '1.0.0',
              lastModified: parsed.lastModified || new Date().toISOString(),
              weapons: parsed.weapons || {},
              monsters: parsed.monsters || {},
              spells: parsed.spells || {},
              balance: parsed.balance || {}
            };
          }
        }
      }
    } catch {
      // LocalStorage unavailable or corrupt
    }
    return this.getDefaultProfile();
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        this.profile.lastModified = new Date().toISOString();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      }
    } catch {
      // Storage quota or error
    }
  }

  private notify(): void {
    this.saveToStorage();
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[CatalogLiveTuner] Listener error:', err);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getProfile(): TuningProfile {
    return this.profile;
  }

  public getStockWeapons() {
    return STOCK_WEAPONS;
  }

  public getStockMonsters() {
    return STOCK_MONSTERS;
  }

  public getStockSpells() {
    return STOCK_SPELLS;
  }

  public getStockBalance() {
    return STOCK_BALANCE;
  }

  // --- Weapon Overrides ---
  public setWeaponOverride(baseType: string, field: keyof WeaponTuningOverride, value: number): void {
    if (!this.profile.weapons[baseType]) {
      this.profile.weapons[baseType] = {};
    }
    this.profile.weapons[baseType][field] = value;
    this.applyWeaponOverride(baseType);
    this.notify();
  }

  public resetWeapon(baseType: string): void {
    delete this.profile.weapons[baseType];
    this.restoreStockWeapon(baseType);
    this.notify();
  }

  private applyWeaponOverride(baseType: string): void {
    const override = this.profile.weapons[baseType];
    const tmpl = WEAPON_TEMPLATES[baseType as WeaponBaseType];
    if (!tmpl || !override) return;

    if (override.damage !== undefined) {
      tmpl.baseDamage = override.damage;
      (tmpl as any).damage = override.damage;
    }
    if (override.critChance !== undefined) {
      tmpl.baseCrit = override.critChance;
      (tmpl as any).critChance = override.critChance;
    }
    if (override.range !== undefined) tmpl.range = override.range;
    if (override.durability !== undefined) {
      (tmpl as any).durability = override.durability;
      (tmpl as any).maxDurability = override.durability;
    }
  }

  private restoreStockWeapon(baseType: string): void {
    const stock = STOCK_WEAPONS[baseType];
    const tmpl = WEAPON_TEMPLATES[baseType as WeaponBaseType];
    if (!tmpl || !stock) return;

    tmpl.baseDamage = stock.damage;
    (tmpl as any).damage = stock.damage;
    tmpl.baseCrit = stock.critChance;
    (tmpl as any).critChance = stock.critChance;
    tmpl.range = stock.range;
    (tmpl as any).durability = stock.durability;
    (tmpl as any).maxDurability = stock.durability;
  }

  // --- Monster Overrides ---
  public setMonsterOverride(key: string, field: keyof MonsterTuningOverride, value: number): void {
    const lowerKey = key.toLowerCase();
    if (!this.profile.monsters[lowerKey]) {
      this.profile.monsters[lowerKey] = {};
    }
    this.profile.monsters[lowerKey][field] = value;
    this.applyMonsterOverride(lowerKey);
    this.notify();
  }

  public resetMonster(key: string): void {
    const lowerKey = key.toLowerCase();
    delete this.profile.monsters[lowerKey];
    this.restoreStockMonster(lowerKey);
    this.notify();
  }

  private applyMonsterOverride(key: string): void {
    const override = this.profile.monsters[key];
    const monster = MONSTER_ENTRIES.find((m) => m.key.toLowerCase() === key);
    if (!monster || !override) return;

    if (override.baseHp !== undefined) monster.baseHp = override.baseHp;
    if (override.baseAtk !== undefined) monster.baseAtk = override.baseAtk;
    if (override.baseDef !== undefined) monster.baseDef = override.baseDef;
    if (override.speed !== undefined) monster.speed = override.speed;
    if (override.range !== undefined) monster.range = override.range;
  }

  private restoreStockMonster(key: string): void {
    const stock = STOCK_MONSTERS[key];
    const monster = MONSTER_ENTRIES.find((m) => m.key.toLowerCase() === key);
    if (!monster || !stock) return;

    monster.baseHp = stock.baseHp;
    monster.baseAtk = stock.baseAtk;
    monster.baseDef = stock.baseDef;
    monster.speed = stock.speed;
    monster.range = stock.range;
  }

  // --- Spell Overrides ---
  public setSpellOverride(id: string, field: keyof SpellTuningOverride, value: number): void {
    if (!this.profile.spells[id]) {
      this.profile.spells[id] = {};
    }
    this.profile.spells[id][field] = value;
    this.applySpellOverride(id);
    this.notify();
  }

  public resetSpell(id: string): void {
    delete this.profile.spells[id];
    this.restoreStockSpell(id);
    this.notify();
  }

  private applySpellOverride(id: string): void {
    const override = this.profile.spells[id];
    const spell = SPELLS.find((s) => s.id === id);
    if (!spell || !override) return;

    if (override.manaCost !== undefined) spell.manaCost = override.manaCost;
    if (override.damageMultiplier !== undefined) spell.damageMultiplier = override.damageMultiplier;
  }

  private restoreStockSpell(id: string): void {
    const stock = STOCK_SPELLS[id];
    const spell = SPELLS.find((s) => s.id === id);
    if (!spell || !stock) return;

    spell.manaCost = stock.manaCost;
    spell.damageMultiplier = stock.damageMultiplier;
  }

  // --- Balance Overrides ---
  public setBalanceOverride(field: keyof BalanceTuningOverride, value: number): void {
    this.profile.balance[field] = value;
    this.applyBalanceOverride(field);
    this.notify();
  }

  private applyBalanceOverride(field: keyof BalanceTuningOverride): void {
    const val = this.profile.balance[field];
    if (val === undefined) return;

    switch (field) {
      case 'baseAttackPower':
        BALANCE_CONFIG.BASE_ATTACK_POWER = val;
        break;
      case 'critMultiplier':
        BALANCE_CONFIG.BASE_CRIT_MULTIPLIER = val;
        break;
      case 'armorMitigationCap':
        BALANCE_CONFIG.ARMOR_MITIGATION_CAP = val;
        break;
      case 'levelXpMultiplier':
        BALANCE_CONFIG.LEVEL_XP_MULTIPLIER = val;
        break;
      default:
        break;
    }
  }

  private restoreStockBalance(): void {
    BALANCE_CONFIG.BASE_ATTACK_POWER = STOCK_BALANCE.baseAttackPower;
    BALANCE_CONFIG.BASE_CRIT_MULTIPLIER = STOCK_BALANCE.critMultiplier;
    BALANCE_CONFIG.ARMOR_MITIGATION_CAP = STOCK_BALANCE.armorMitigationCap;
    BALANCE_CONFIG.LEVEL_XP_MULTIPLIER = STOCK_BALANCE.levelXpMultiplier;
  }

  // --- Batch Operations ---
  public applyAllOverrides(): void {
    Object.keys(this.profile.weapons).forEach((baseType) => this.applyWeaponOverride(baseType));
    Object.keys(this.profile.monsters).forEach((key) => this.applyMonsterOverride(key));
    Object.keys(this.profile.spells).forEach((id) => this.applySpellOverride(id));
    Object.keys(this.profile.balance).forEach((field) =>
      this.applyBalanceOverride(field as keyof BalanceTuningOverride)
    );
  }

  public resetCategory(category: 'weapons' | 'monsters' | 'spells' | 'balance'): void {
    switch (category) {
      case 'weapons':
        Object.keys(this.profile.weapons).forEach((baseType) => this.restoreStockWeapon(baseType));
        this.profile.weapons = {};
        break;
      case 'monsters':
        Object.keys(this.profile.monsters).forEach((key) => this.restoreStockMonster(key));
        this.profile.monsters = {};
        break;
      case 'spells':
        Object.keys(this.profile.spells).forEach((id) => this.restoreStockSpell(id));
        this.profile.spells = {};
        break;
      case 'balance':
        this.restoreStockBalance();
        this.profile.balance = {};
        break;
    }
    this.notify();
  }

  public resetAll(): void {
    this.resetCategory('weapons');
    this.resetCategory('monsters');
    this.resetCategory('spells');
    this.resetCategory('balance');
  }

  public getActiveOverrideCount(): number {
    const weaponCount = Object.values(this.profile.weapons).reduce(
      (acc, w) => acc + Object.keys(w).length,
      0
    );
    const monsterCount = Object.values(this.profile.monsters).reduce(
      (acc, m) => acc + Object.keys(m).length,
      0
    );
    const spellCount = Object.values(this.profile.spells).reduce(
      (acc, s) => acc + Object.keys(s).length,
      0
    );
    const balanceCount = Object.keys(this.profile.balance).length;
    return weaponCount + monsterCount + spellCount + balanceCount;
  }

  public exportProfileJson(): string {
    return JSON.stringify(this.profile, null, 2);
  }

  public importProfileJson(jsonStr: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON format' };
      }
      this.resetAll();
      this.profile = {
        version: parsed.version || '1.0.0',
        lastModified: new Date().toISOString(),
        weapons: parsed.weapons || {},
        monsters: parsed.monsters || {},
        spells: parsed.spells || {},
        balance: parsed.balance || {}
      };
      this.applyAllOverrides();
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to parse JSON' };
    }
  }
}

export const catalogLiveTuner = new CatalogLiveTuner();
