/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponBaseType } from '../../types/items';

export type { WeaponTemplate } from '../../types/items';

/**
 * Semantic item category taxonomy
 */
export type ItemCategory =
  | 'material'
  | 'catalyst'
  | 'weapon'
  | 'armor'
  | 'relic'
  | 'scroll'
  | 'consumable'
  | 'key'
  | 'quest'
  | 'misc';

/**
 * Standard item rarity tiers
 */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Universal data-driven definition of an item in the engine.
 * Unifies materials, catalysts, equipment, scrolls, relics, and consumables.
 */
export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  rarity?: ItemRarity;
  value: number;
  weight?: number;
  stackable?: boolean;
  maxStack?: number;
  icon?: string;
  color?: string;
  tags?: string[];
  stats?: {
    atk?: number;
    def?: number;
    critChance?: number;
    speedMod?: number;
    range?: number;
    manaCost?: number;
    hpRestore?: number;
    mpRestore?: number;
    [key: string]: any;
  };
  customData?: Record<string, any>;
}

/**
 * Options when creating an instantiated runtime item
 */
export interface CreateItemOptions {
  quantity?: number;
  rarity?: ItemRarity;
  overrides?: Partial<ItemDefinition>;
}

/**
 * Weapon Blueprint and Template Contract
 */
export interface WeaponTemplateDefinition {
  baseType: WeaponBaseType | string;
  name: string;
  description: string;
  baseDamage: number;
  baseCrit: number;
  range: number;
  manaCost: number;
  icon: string;
  isTwoHanded?: boolean;
  color?: string;
  tags?: string[];
  statBonuses?: {
    str?: number;
    dex?: number;
    int?: number;
    lck?: number;
    cha?: number;
  };
}
