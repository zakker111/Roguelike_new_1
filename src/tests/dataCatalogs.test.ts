import { describe, it, expect } from 'vitest';
import { SOUND_CATALOG } from '../data/soundCatalog';
import { MONSTER_ENTRIES } from '../data/monsters';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS, WEAPON_TEMPLATES, RELIC_CATALOG, SPELL_SCROLL_CATALOG } from '../data/items';
import { WeaponBaseType } from '../types';

describe('Data Catalogs & Isolation Integrity Tests', () => {
  it('soundCatalog defines valid audio presets for all sound types', () => {
    expect(SOUND_CATALOG).toBeDefined();
    expect(SOUND_CATALOG.length).toBeGreaterThan(10);
    const slash = SOUND_CATALOG.find(s => s.id === 'slash');
    expect(slash).toBeDefined();
    expect(slash?.name).toBe('Weapon Slash');
  });

  it('monsters catalog contains valid entries for standard, wildlife, and bosses', () => {
    expect(MONSTER_ENTRIES.length).toBeGreaterThan(5);
    const rat = MONSTER_ENTRIES.find(m => m.key === 'Rat');
    expect(rat).toBeDefined();
    expect(rat?.name).toBe('Giant Plague Rat');
    expect(rat?.baseHp).toBeGreaterThan(0);
    expect(rat?.lootTable.length).toBeGreaterThan(0);
  });

  it('items catalog correctly loads materials, catalysts, weapon templates, relics, and scrolls', () => {
    expect(BASIC_MATERIALS.length).toBeGreaterThan(0);
    expect(BASIC_MATERIALS.find(m => m.id === 'mat_iron')).toBeDefined();

    expect(ELEMENTAL_CATALYSTS.length).toBeGreaterThan(0);
    expect(ELEMENTAL_CATALYSTS.find(c => c.id === 'cat_fire')).toBeDefined();

    expect(WEAPON_TEMPLATES[WeaponBaseType.Sword]).toBeDefined();
    expect(WEAPON_TEMPLATES[WeaponBaseType.Sword].name).toBe('Recruits Broadsword');

    expect(RELIC_CATALOG.length).toBeGreaterThan(0);
    expect(SPELL_SCROLL_CATALOG.length).toBeGreaterThan(0);
  });
});
