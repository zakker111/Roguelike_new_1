import { EquipmentItem, WeaponBaseType } from '../types';
import { SPELL_SCROLLS, getSpellScrollAsEquipmentItem } from './spellScrolls';
import shopsJson from '../data/shops.json';
export { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from './itemsData';

export const BLACKSMITH_SHOP_ITEMS: EquipmentItem[] = shopsJson.blacksmithItems as unknown as EquipmentItem[];

export const MERCHANT_RESOURCES = shopsJson.merchantResources;

export const TAVERN_SHOP_ITEMS = shopsJson.tavernItems;

export const SEPPO_SHOP_ITEMS: EquipmentItem[] = [
  {
    id: 'shop_seppo_club',
    name: 'Finnish Sisu Hammer 🪵',
    type: 'weapon',
    subType: WeaponBaseType.Hammer,
    defense: 0,
    damage: 15,
    critChance: 0.22,
    range: 1,
    color: '#ff4b72',
    description: "A heavy, iron-spiked birch log with a copper bottle opener welded onto the end. Smashes skulls with ultimate Sisu energy!",
    value: 260,
    durability: 100,
    maxDurability: 100
  },
  {
    id: 'shop_seppo_flask',
    name: 'Ever-Burning Flask 🧪',
    type: 'armor',
    subType: 'Shield',
    defense: 5,
    damage: 0,
    critChance: 0,
    range: 0,
    color: '#fbbf24',
    description: "An ancient insulated brass flask filled with Seppo's self-replenishing fire-water. Blocks blows and keeps you toast-warm!",
    value: 165,
    durability: 100,
    maxDurability: 100
  },
  {
    id: 'scroll_town_recall',
    name: 'Scroll of Recall 📜',
    type: 'scroll',
    subType: 'Scroll',
    defense: 0,
    damage: 0,
    critChance: 0,
    range: 0,
    color: '#38bdf8',
    description: "An ancient teleportation scroll. Read it to tear open a space-time rift and warp instantly to Oakhaven or any other discovered town or outpost!",
    value: 500,
    durability: 100,
    maxDurability: 100
  },
  // Dynamically mapped spell scrolls
  ...SPELL_SCROLLS.map(template => getSpellScrollAsEquipmentItem(template, 'template'))
];

export const SEPPO_RESOURCES = [
  {
    id: 'mat_seppo_hooch',
    name: "Seppo's Secret Hooch 🍶",
    price: 40,
    color: '#a78bfa',
    desc: "Distilled in a copper tub deep in the woods. Restores 75 HP and 40 MP. *Hic!*"
  },
  {
    id: 'mat_transmuter',
    name: "Wild Magic Transmuter 🧪",
    price: 320,
    color: '#ec4899',
    desc: "A portable copper-ringed transmuter flask. Unlocks alchemical shifting and chaotic surges!"
  }
];

export const APOTHECARY_ITEMS = shopsJson.apothecaryItems;

export const MERCHANT_INITIALS: { [role: string]: { gold: number, stock: { [itemId: string]: number } } } = {
  'npc_blacksmith': {
    gold: 380,
    stock: {
      'shop_steel_broadsword': 4,
      'shop_titanium_mace': 3,
      'shop_arcane_wand': 3,
      'shop_hunter_bow': 4,
      'shop_apprentice_wand': 3,
      'shop_steel_cuirass': 2,
      'shop_iron_helm': 3,
      'shop_leather_gloves': 5,
      'shop_stone_pendant': 4,
      'shop_heavy_boots': 4,
      'shop_heater_shield': 4
    }
  },
  'npc_merchant': {
    gold: 550,
    stock: {
      'mat_wood': 25,
      'mat_iron': 18,
      'mat_mithril': 10,
      'mat_obsidian': 8,
      'mat_dragonscale': 4,
      'mat_feybone': 4,
      'mat_thick_hide': 12,
      'mat_lockpick': 15
    }
  },
  'npc_apothecary': {
    gold: 450,
    stock: {
      'cat_fire': 8,
      'cat_frost': 8,
      'cat_poison': 8,
      'cat_lightning': 6,
      'cat_shadow': 6,
      'potion_hp': 12,
      'potion_mp': 12,
      'scroll_recall': 6
    }
  },
  'tavern_master': {
    gold: 350,
    stock: {
      'mat_beer': 20,
      'mat_bread': 25,
      'mat_berry': 20,
      'mat_berry_pie': 12,
      'mat_fishing_pole': 8,
      'mat_cooked_fish': 10,
      'mat_lockpick': 15
    }
  },
  'merchant': {
    gold: 700,
    stock: {
      'mat_wood': 15,
      'mat_beer': 15,
      'mat_bread': 15,
      'mat_iron': 10,
      'mat_mithril': 6,
      'mat_fishing_pole': 6,
      'mat_cooked_fish': 8,
      'mat_thick_hide': 8,
      'mat_lockpick': 18,
      'potion_hp': 10,
      'scroll_recall': 6
    }
  },
  'traveler_herbalist': {
    gold: 350,
    stock: {
      'potion_hp': 8,
      'potion_mp': 8,
      'cat_fire': 5,
      'cat_frost': 5,
      'cat_poison': 5,
      'mat_berry': 15,
      'mat_seppo_hooch': 4,
      'scroll_recall': 4
    }
  },
  'traveler_hunter': {
    gold: 400,
    stock: {
      'mat_thick_hide': 12,
      'mat_cooked_fish': 10,
      'shop_hunter_bow': 2,
      'shop_leather_gloves': 3,
      'mat_lockpick': 12,
      'mat_wood': 15
    }
  },
  'traveler_pilgrim': {
    gold: 300,
    stock: {
      'scroll_recall': 6,
      'shop_stone_pendant': 2,
      'mat_bread': 15,
      'potion_hp': 6,
      'cat_shadow': 4
    }
  },
  'traveler_merchant': {
    gold: 600,
    stock: {
      'potion_hp': 10,
      'potion_mp': 8,
      'scroll_recall': 5,
      'mat_lockpick': 15,
      'mat_bread': 15,
      'mat_beer': 12,
      'mat_iron': 10,
      'mat_wood': 15,
      'shop_steel_broadsword': 2,
      'shop_heater_shield': 2
    }
  },
  'merchant_caravan': {
    gold: 750,
    stock: {
      'potion_hp': 10,
      'potion_mp': 10,
      'scroll_recall': 6,
      'mat_lockpick': 15,
      'mat_bread': 15,
      'mat_beer': 12,
      'mat_iron': 10,
      'mat_wood': 15,
      'shop_steel_broadsword': 3,
      'shop_heater_shield': 3
    }
  },
  'merchant_seppo': {
    gold: 950,
    stock: {
      'mat_seppo_hooch': 10,
      'shop_seppo_club': 1,
      'shop_seppo_flask': 1,
      'mat_transmuter': 1,
      'scroll_town_recall': 2,
      'scroll_spell_pyro_firestorm': 2,
      'scroll_spell_tide_wave': 2,
      'scroll_spell_noxious_swarm': 2
    }
  },
  'fishmonger': {
    gold: 480,
    stock: {
      'mat_fresh_catch': 18,
      'mat_salted_cod': 25,
      'mat_cooked_fish': 14,
      'mat_fishing_pole': 8
    }
  },
  'harbor_master': {
    gold: 750,
    stock: {
      'mat_nautical_chart': 8,
      'mat_ship_pitch': 12,
      'mat_whale_oil': 10,
      'scroll_recall': 6,
      'mat_salted_cod': 15
    }
  },
  'sailor': {
    gold: 320,
    stock: {
      'mat_salted_cod': 12,
      'mat_beer': 15,
      'mat_fresh_catch': 8,
      'mat_thick_hide': 6
    }
  },
  'dockworker': {
    gold: 280,
    stock: {
      'mat_ship_pitch': 10,
      'mat_wood': 20,
      'mat_iron': 10,
      'mat_beer': 10
    }
  },
  'ferried_navigator': {
    gold: 600,
    stock: {
      'mat_nautical_chart': 10,
      'scroll_recall': 8,
      'mat_whale_oil': 6,
      'mat_salted_cod': 10
    }
  }
};

export const getBlacksmithItems = (reputation: number) => {
  const list = [...BLACKSMITH_SHOP_ITEMS];
  if (reputation >= 81) {
    list.push(
      { id: 'shop_legendary_excalibur', name: '👑 Royal Champion Claymore', type: 'weapon', subType: WeaponBaseType.Sword, defense: 0, damage: 16, critChance: 0.25, range: 1, color: '#f59e0b', description: 'Legendary broadsword forged for royal peacekeepers.', value: 320 },
      { id: 'shop_champion_plate', name: '👑 Champion Heavy Aegis Plate', type: 'armor', subType: 'HeavyArmor', defense: 10, damage: 0, critChance: 0, range: 0, color: '#f59e0b', description: 'Legendary steel plate that grants unrivaled defense blocks.', value: 280 }
    );
  }
  return list;
};

export const getApothecaryItems = (tier: number, reputation: number) => {
  const list = [
    { id: 'cat_fire', name: 'Pyrotactile Fire Catalyst', price: 45, color: '#ef4444', desc: 'Infuses burn fire afflictions.' },
    { id: 'cat_frost', name: 'Cryo-forged Ice Catalyst', price: 45, color: '#3b82f6', desc: 'Infuses freeze ice ralentiss.' },
    { id: 'cat_poison', name: 'Venom-stung Gas Catalyst', price: 45, color: '#10b981', desc: 'Infuses poison damage over turns.' },
    { id: 'cat_lightning', name: 'Super-charged Spark Catalyst', price: 45, color: '#eab308', desc: 'Infuses chain electro sparks.' },
    { id: 'cat_shadow', name: 'Void-gazing Dark Catalyst', price: 45, color: '#8b5cf6', desc: 'Infuses deep decay debuffs.' },
    { id: 'potion_hp', name: 'Apothecary Elixir (HP)', price: 35, color: '#ec4899', desc: 'Restores 35 HP on instant intake.' },
    { id: 'potion_mp', name: 'Aether Beverage (MP)', price: 28, color: '#3b82f6', desc: 'Restores 15 MP on instant intake.' },
    { id: 'scroll_recall', name: 'Scroll of Escape', price: 55, color: '#f43f5e', desc: 'Teleports you instantly out of any dungeon and returns you to the surface entrance!' }
  ];
  if (tier >= 2) {
    list.push(
      { id: 'potion_medium_hp', name: 'Rejuvenating Potion (Medium HP)', price: 55, color: '#ec4899', desc: 'Restores 60 HP on instant intake.' },
      { id: 'potion_medium_mp', name: 'Rejuvenating Beverage (Medium MP)', price: 45, color: '#3b82f6', desc: 'Restores 30 MP on instant intake.' }
    );
  }
  if (tier >= 3) {
    list.push(
      { id: 'potion_full_rejuv', name: 'Elixir of Full Restoration', price: 120, color: '#eab308', desc: 'Restores all HP and MP instantly.' },
      { id: 'cat_chaos', name: 'Catalyst of Chaos', price: 95, color: '#f59e0b', desc: 'Unlocks ultimate chaotic transformations.' }
    );
  }
  if (reputation >= 81) {
    list.push(
      { id: 'potion_full_rejuvenation', name: 'Royal Champion Rejuvenation Elixir', price: 95, color: '#ff4b72', desc: 'Super-enriched royal mixture. Full HP & MP restore.' },
      { id: 'cat_cosmic', name: 'Cosmic Void Catalyst', price: 105, color: '#8b5cf6', desc: 'Infuses +5 ATK and deep status decay.' }
    );
  }
  return list;
};

export const getMerchantConfig = (role: string, id: string): { maxGold: number, defaultStock: { [itemId: string]: number } } => {
  const isCaravan = id === 'npc_caravan_merchant' || id.includes('caravan') || role.includes('caravan');
  let mappedRole = role;
  if (role === 'blacksmith') mappedRole = 'npc_blacksmith';
  else if (role === 'merchant') mappedRole = 'npc_merchant';
  else if (role === 'apothecary') mappedRole = 'npc_apothecary';
  else if (role === 'merchant_seppo') mappedRole = 'merchant_seppo';
  else if (role === 'traveler_herbalist') mappedRole = 'traveler_herbalist';
  else if (role === 'traveler_hunter') mappedRole = 'traveler_hunter';
  else if (role === 'traveler_pilgrim') mappedRole = 'traveler_pilgrim';
  else if (role.includes('traveler') || role.includes('wandering') || isCaravan) mappedRole = 'traveler_merchant';
  else if (role === 'fishmonger' || role === 'harbor_master' || role === 'sailor' || role === 'dockworker' || role === 'ferried_navigator') mappedRole = role;

  const config = MERCHANT_INITIALS[mappedRole] || MERCHANT_INITIALS['merchant'];
  return {
    maxGold: config.gold,
    defaultStock: config.stock
  };
};

