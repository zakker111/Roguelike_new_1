/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum MaterialCategory {
  Tier1 = 'Common',
  Tier2 = 'Rare',
  Tier3 = 'Legendary',
}

export interface Material {
  id: string;
  name: string;
  description: string;
  category: MaterialCategory;
  color: string;
  baseDamageMod: number; // Modifies attack power
  critMod: number;       // Base crit rate modification
  speedMod: number;      // Turn delay or bonus stats
  extraProperty?: string;
}

export enum CatalystType {
  Fire = 'Fire',
  Frost = 'Frost',
  Poison = 'Poison',
  Lightning = 'Lightning',
  Shadow = 'Shadow',
}

export interface Catalyst {
  id: string;
  name: string;
  description: string;
  type: CatalystType;
  color: string;
  damageType: string;
  statusEffectChance: number;
  statusDuration: number;
}

export enum WeaponBaseType {
  Sword = 'Sword',   // Balanced range 1, 15% crit, moderate damage
  Spear = 'Spear',   // Range 2 (piercing linear), good reach
  Dagger = 'Dagger', // Range 1, double strike chance, high speed/crit
  Hammer = 'Hammer', // Range 1, knockback chance, stun chance, high damage
  Staff = 'Staff',   // Range 3 (magic projectile), costs Mana to shoot
  Bow = 'Bow',       // Range 4 (arrows), physical ranged weapon
  Wand = 'Wand',     // Range 3 (arcane spark), magic ranged weapon
  Crossbow = 'Crossbow', // 2-Handed: heavy bolt action
  Greatsword = 'Greatsword', // 2-Handed: sweeping arc damage
  Warhammer = 'Warhammer', // 2-Handed: armor shattering hammer
}

export interface WeaponTemplate {
  baseType: WeaponBaseType;
  name: string;
  description: string;
  baseDamage: number;
  baseCrit: number;
  range: number;
  manaCost: number;
  icon: string;
  isTwoHanded?: boolean;
}

export function isTwoHandedWeapon(item: { subType?: string; baseType?: string; isTwoHanded?: boolean } | null | undefined): boolean {
  if (!item) return false;
  if (item.isTwoHanded !== undefined) return item.isTwoHanded;
  const sub = item.subType || item.baseType;
  return (
    sub === WeaponBaseType.Spear ||
    sub === WeaponBaseType.Bow ||
    sub === WeaponBaseType.Staff ||
    sub === WeaponBaseType.Crossbow ||
    sub === WeaponBaseType.Greatsword ||
    sub === WeaponBaseType.Warhammer
  );
}

export interface CraftedWeapon {
  id: string;
  name: string;
  baseType: WeaponBaseType;
  materialUsed: Material;
  catalystUsed: Catalyst;
  damage: number;
  critChance: number;
  range: number;
  manaCost?: number;
  effectDescription: string;
  color: string;
  durability?: number;
  maxDurability?: number;
  upgradeLevel?: number;
  isMutated?: boolean;
  mutationCount?: number;
  synergyCatalysts?: string[];
  synergyTitle?: string;
  mutationStrain?: number;
  isOverforged?: boolean;
  overforgeHeat?: number;
  traits?: string[];
  defense?: number;
  type?: 'weapon' | 'armor';
  isTwoHanded?: boolean;
  isTool?: boolean;
  isRepairable?: boolean;
  statBonuses?: {
    str?: number;
    dex?: number;
    int?: number;
    lck?: number;
    cha?: number;
  };
}

export type ArmorSubType = 'LightArmor' | 'HeavyArmor' | 'Shield' | 'Helmet' | 'Gloves' | 'Boots';

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'scroll';
  subType: WeaponBaseType | 'LightArmor' | 'HeavyArmor' | 'Shield' | 'Helmet' | 'Gloves' | 'Boots' | 'Scroll' | 'Amulet' | string;
  defense: number;
  damage: number;
  critChance: number;
  range: number;
  color: string;
  description: string;
  value: number; // Buy/Sell gold cost
  quantity?: number; // Stack quantity for stackable items (like scrolls)
  durability?: number;
  currentDurability?: number;
  maxDurability?: number;
  upgradeLevel?: number;
  isMutated?: boolean;
  mutationCount?: number;
  synergyCatalysts?: string[];
  synergyTitle?: string;
  mutationStrain?: number;
  isOverforged?: boolean;
  overforgeHeat?: number;
  traits?: string[];
  isTwoHanded?: boolean;
  isTool?: boolean;
  isRepairable?: boolean;
  statBonuses?: {
    str?: number;
    dex?: number;
    int?: number;
    lck?: number;
    cha?: number;
  };
}

export interface Chest {
  id: string;
  x: number;
  y: number;
  isOpened: boolean;
  materials: string[]; // Material IDs inside
  catalysts: string[]; // Catalyst IDs inside
  gold: number;
  isLocked?: boolean;
  keyRequired?: string; // name of the item required, e.g. "Watchtower Key"
}

export interface LootPile {
  id: string;
  x: number;
  y: number;
  gold: number;
  materials: string[]; // material IDs
  catalysts: string[]; // catalyst IDs
  equipment: EquipmentItem[];
}

export function isToolItem(
  item: EquipmentItem | CraftedWeapon | null | undefined,
  kind?: 'hatchet' | 'pickaxe'
): boolean {
  if (!item) return false;
  const name = item.name.toLowerCase();
  if (kind === 'hatchet') {
    return item.isTool || name.includes('hatchet') || name.includes('axe');
  }
  if (kind === 'pickaxe') {
    return item.isTool || name.includes('pickaxe') || name.includes('pick');
  }
  return item.isTool === true || name.includes('hatchet') || name.includes('axe') || name.includes('pickaxe') || name.includes('pick');
}

export function isItemRepairable(item: EquipmentItem | CraftedWeapon | null | undefined): boolean {
  if (!item) return false;
  if (item.isRepairable === false) return false;
  if (isToolItem(item)) return false; // Tools break when used and cannot be repaired
  return true;
}
