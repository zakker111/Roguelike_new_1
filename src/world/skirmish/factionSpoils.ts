/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EquipmentItem, WeaponBaseType } from '../../types';

export const FACTION_SPOILS_ITEMS: Record<string, EquipmentItem> = {
  orc_goreaxe_cleaver: {
    id: 'orc_goreaxe_cleaver',
    name: 'Goreaxe War Cleaver 🪓',
    type: 'weapon',
    subType: WeaponBaseType.Greatsword,
    damage: 15,
    defense: 1,
    critChance: 0.18,
    range: 1,
    color: '#ef4444',
    description: 'A massive serrated war cleaver salvaged from an Orc Blood-Warlord. Cleaves targets with devastating momentum and +18% critical strike chance.',
    value: 180,
    durability: 120,
    currentDurability: 120,
    maxDurability: 120,
    isRepairable: true,
    statBonuses: {
      str: 4,
      dex: 1,
    },
  },
  orc_spiked_buckler: {
    id: 'orc_spiked_buckler',
    name: 'Goreaxe Spiked Buckler 🛡️',
    type: 'armor',
    subType: 'Shield',
    damage: 3,
    defense: 7,
    critChance: 0.05,
    range: 1,
    color: '#f97316',
    description: 'A heavy iron buckler studded with jagged steel spikes. Deflects frontal strikes while retaliating with blunt physical puncture.',
    value: 160,
    durability: 140,
    currentDurability: 140,
    maxDurability: 140,
    isRepairable: true,
    statBonuses: {
      str: 2,
    },
  },
  bandit_stalker_leather: {
    id: 'bandit_stalker_leather',
    name: 'Outlaw Stalker Leather 🥋',
    type: 'armor',
    subType: 'LightArmor',
    damage: 0,
    defense: 5,
    critChance: 0.12,
    range: 0,
    color: '#3b82f6',
    description: 'Supple midnight leather armor favored by outlaw highwaymen and sharpshooters. Grants agile movement and +12% critical hit chance.',
    value: 190,
    durability: 110,
    currentDurability: 110,
    maxDurability: 110,
    isRepairable: true,
    statBonuses: {
      dex: 4,
      lck: 2,
    },
  },
  syndicate_shadow_satchel: {
    id: 'syndicate_shadow_satchel',
    name: 'Syndicate Shadow Satchel 🎒',
    type: 'armor',
    subType: 'Amulet',
    damage: 0,
    defense: 3,
    critChance: 0.06,
    range: 0,
    color: '#a855f7',
    description: 'A hidden smuggler pouch reinforced with spatial shadow runes. Greatly boosts loot finds and carrying ease.',
    value: 210,
    durability: 150,
    currentDurability: 150,
    maxDurability: 150,
    isRepairable: true,
    statBonuses: {
      lck: 5,
      dex: 2,
    },
  },
  vanguard_crusader_cuirass: {
    id: 'vanguard_crusader_cuirass',
    name: 'Dawn Vanguard Crusader Plate 🛡️',
    type: 'armor',
    subType: 'HeavyArmor',
    damage: 0,
    defense: 10,
    critChance: 0.02,
    range: 0,
    color: '#eab308',
    description: 'Heavy sun-forged steel plate consecrated by Dawn Vanguard clerics. Bestows formidable protection against all forms of physical and dark harm.',
    value: 240,
    durability: 160,
    currentDurability: 160,
    maxDurability: 160,
    isRepairable: true,
    statBonuses: {
      str: 3,
    },
  },
};

/**
 * Returns a specific faction gear item by its ID.
 */
export function getFactionSpoilsItem(id: string): EquipmentItem | undefined {
  const item = FACTION_SPOILS_ITEMS[id];
  if (!item) return undefined;
  return JSON.parse(JSON.stringify(item));
}

/**
 * Returns a random faction gear item, optionally weighted by faction type.
 */
export function getRandomFactionSpoils(faction?: string): EquipmentItem {
  if (faction === 'orc_clan' || faction === 'orcs') {
    const orcPool = ['orc_goreaxe_cleaver', 'orc_spiked_buckler'];
    const chosen = orcPool[Math.floor(Math.random() * orcPool.length)];
    return getFactionSpoilsItem(chosen)!;
  }
  if (faction === 'outlaws' || faction === 'bandits') {
    return getFactionSpoilsItem('bandit_stalker_leather')!;
  }
  if (faction === 'syndicate') {
    return getFactionSpoilsItem('syndicate_shadow_satchel')!;
  }
  if (faction === 'vanguard') {
    return getFactionSpoilsItem('vanguard_crusader_cuirass')!;
  }

  const allKeys = Object.keys(FACTION_SPOILS_ITEMS);
  const randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];
  return getFactionSpoilsItem(randomKey)!;
}
