import { describe, it, expect } from 'vitest';
import { SPELLS, getSpellById } from '../utils/spellsAndEquipment';
import { SPELL_SCROLLS, getSpellScrollAsEquipmentItem } from '../utils/spellScrolls';

describe('Phase 6: Spells, Mana & Scroll Systems Suite', () => {
  it('validates active spells list and getSpellById helper', () => {
    expect(SPELLS.length).toBeGreaterThan(0);
    const arcaneBolt = getSpellById('arcane_bolt');
    expect(arcaneBolt.name).toBe('Arcane Bolt');
    expect(arcaneBolt.manaCost).toBeGreaterThan(0);
    expect(arcaneBolt.damageMultiplier).toBeGreaterThan(0);

    expect(() => getSpellById('invalid_spell_xyz')).toThrow('[spellsAndEquipment] Invalid spell ID requested');
  });

  it('validates spell scroll templates and combo effects', () => {
    expect(SPELL_SCROLLS.length).toBeGreaterThan(0);
    SPELL_SCROLLS.forEach((scroll) => {
      expect(scroll.id).toBeDefined();
      expect(scroll.name).toBeDefined();
      expect(scroll.mpCost).toBeGreaterThan(0);
      expect(scroll.baseDamage).toBeGreaterThan(0);
      expect(scroll.recipe).toBeDefined();
      expect(scroll.combos).toBeDefined();
    });
  });

  it('converts spell scroll template into an inventory EquipmentItem correctly', () => {
    const template = SPELL_SCROLLS[0];
    const equip = getSpellScrollAsEquipmentItem(template, 'test_123');
    expect(equip.id).toBe(`${template.id}_test_123`);
    expect(equip.type).toBe('scroll');
    expect(equip.name).toBe(template.name);
    expect(equip.durability).toBe(100);
  });
});
