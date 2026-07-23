import { CatalystType, EquipmentItem } from '../types';
import spellScrollsJson from '../data/spellScrolls.json';

export interface ScrollRecipe {
  materials: { [materialId: string]: { name: string; required: number } };
  catalysts: { [catalystId: string]: { name: string; required: number } };
}

export interface ScrollComboEffect {
  onDebuff: CatalystType;
  bonusDamage: number;
  effectText: string;
  logMessage: string;
}

export interface SpellScrollTemplate {
  id: string; // e.g. "scroll_spell_pyro_firestorm"
  name: string;
  color: string;
  description: string;
  value: number; // buy gold value
  mpCost: number;
  baseDamage: number;
  element: CatalystType;
  debuff: {
    type: CatalystType;
    duration: number;
    damagePerTurn: number;
  };
  combos: ScrollComboEffect[];
  recipe: ScrollRecipe;
  successMsgText: string;
}

export const SPELL_SCROLLS: SpellScrollTemplate[] = (spellScrollsJson as any[]).map(spell => ({
  ...spell,
  element: spell.element as CatalystType,
  debuff: {
    ...spell.debuff,
    type: spell.debuff.type as CatalystType
  },
  combos: spell.combos.map((c: any) => ({
    ...c,
    onDebuff: c.onDebuff as CatalystType
  }))
}));


export function getSpellScrollAsEquipmentItem(template: SpellScrollTemplate, instanceIdSuffix: string | number): EquipmentItem {
  return {
    id: `${template.id}_${instanceIdSuffix}`,
    name: template.name,
    type: 'scroll',
    subType: 'Scroll',
    defense: 0,
    damage: 0,
    critChance: 0,
    range: 0,
    color: template.color,
    description: template.description,
    value: template.value,
    durability: 100,
    maxDurability: 100
  };
}
