import { CatalystType, CraftedWeapon, EquipmentItem, WeaponBaseType } from '../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from './itemsData';
import spellsCatalogData from '../data/spellsCatalog.json';

export interface Spell {
  id: string;
  name: string;
  icon: string;
  manaCost: number;
  damageMultiplier: number;
  element: CatalystType;
  description: string;
  effectDescription: string;
}

export const SPELLS: Spell[] = spellsCatalogData.map(spell => ({
  ...spell,
  element: spell.element as CatalystType
}));

export function getSpellById(id: string): Spell {
  const spell = SPELLS.find((s) => s.id === id);
  if (!spell) {
    throw new Error(`[spellsAndEquipment] Invalid spell ID requested: "${id}".`);
  }
  return spell;
}

// High contrast default starting weapon
export const STARTING_WEAPON: CraftedWeapon = {
  id: 'starter_weapon',
  name: 'Scavenger’s Broken Shiv',
  baseType: WeaponBaseType.Dagger,
  materialUsed: BASIC_MATERIALS[0], // Tempered Iron
  catalystUsed: ELEMENTAL_CATALYSTS[0], // Fire (for cool glow)
  damage: 4,
  critChance: 0.15,
  range: 1,
  manaCost: 0,
  effectDescription: 'A notched shiv of iron. Basic and rusty.',
  color: '#9ca3af',
  durability: 85,
  maxDurability: 85,
};

export const STARTING_ARMOR: EquipmentItem = {
  id: 'start_armor_cloth',
  name: 'Rugged Adventurer Vest',
  type: 'armor',
  subType: 'LightArmor',
  defense: 1,
  damage: 0,
  critChance: 0,
  range: 0,
  color: '#cbd5e1',
  description: 'Simple linen and boiled leather padding.',
  value: 10,
  durability: 100,
  maxDurability: 100,
};

/**
 * Calculates a dynamic durability decay value based on how powerful, upgraded, or mutated the gear is.
 * Highly mutated or upgraded gear undergoes extreme aetheric stress, wearing out faster to balance its ultimate power.
 */
export function getItemDurabilityDecay(item: EquipmentItem | CraftedWeapon, baseAmount: number = 1): number {
  let multiplier = 1.0;

  // 1. Mutation factor: each mutation adds a massive penalty to represent wild magic warping structural bonds
  if (item.isMutated) {
    const mutCount = item.mutationCount || 1;
    // Each mutation increases durability decay by 50%
    multiplier += mutCount * 0.50;
  }

  // 2. Upgrade level factor: pushing the metal to its limits via standard upgrades
  if (item.upgradeLevel && item.upgradeLevel > 0) {
    // Each upgrade level increases wear by 15%
    multiplier += item.upgradeLevel * 0.15;
  }

  // 3. Power Scaling: higher stats/damage/defense put intense structural stress on the gear
  if (item.type === 'weapon' || 'baseType' in item) {
    const extraDmg = Math.max(0, (item.damage ?? 0) - 5);
    // +10% durability decay rate per point of extra damage above baseline starter weapons
    multiplier += extraDmg * 0.10;
  } else {
    // Armor, Helmet, Boots, Gloves, Shield, etc.
    const defenseVal = 'defense' in item ? (item.defense ?? 0) : 0;
    const extraDef = Math.max(0, defenseVal - 3);
    // +15% durability decay rate per point of extra defense above baseline starter gear
    multiplier += extraDef * 0.15;
  }

  // 4. Traits / Special affixes
  if (item.traits && item.traits.length > 0) {
    multiplier += item.traits.length * 0.25;
  }

  // Apply decay multiplier, return a rounded integer, minimum of baseAmount
  return Math.max(baseAmount, Math.round(baseAmount * multiplier));
}
