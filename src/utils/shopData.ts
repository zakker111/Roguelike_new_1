import { EquipmentItem, WeaponBaseType, CatalystType } from '../types';
import { SPELL_SCROLLS, getSpellScrollAsEquipmentItem } from './spellScrolls';

export const BLACKSMITH_SHOP_ITEMS: EquipmentItem[] = [
  { id: 'shop_steel_broadsword', name: 'Alloy Broadsword', type: 'weapon', subType: WeaponBaseType.Sword, defense: 0, damage: 9, critChance: 0.12, range: 1, color: '#38bdf8', description: 'Finely-forged steel with edge sharpness.', value: 95 },
  { id: 'shop_titanium_mace', name: 'Granite heavy Hammer', type: 'weapon', subType: WeaponBaseType.Hammer, defense: 0, damage: 13, critChance: 0.05, range: 1, color: '#34d399', description: 'Extremely blunt and causes knocks away targets.', value: 140 },
  { id: 'shop_arcane_wand', name: 'Ancient Staff', type: 'weapon', subType: WeaponBaseType.Staff, defense: 0, damage: 8, critChance: 0.15, range: 4, color: '#a78bfa', description: 'Requires 4 MP to project arcane bullets.', value: 120 },
  { id: 'shop_hunter_bow', name: 'Rangers Longbow', type: 'weapon', subType: WeaponBaseType.Bow, defense: 0, damage: 7, critChance: 0.18, range: 4, color: '#22c55e', description: 'Graceful flexible wood with rapid flight arrow string.', value: 110 },
  { id: 'shop_apprentice_wand', name: 'Spark Electric Wand', type: 'weapon', subType: WeaponBaseType.Wand, defense: 0, damage: 6, critChance: 0.10, range: 3, color: '#f59e0b', description: 'Requires 3 MP to cast voltage crackles.', value: 85 },
  { id: 'shop_steel_cuirass', name: 'Steel Plate Chest', type: 'armor', subType: 'HeavyArmor', defense: 6, damage: 0, critChance: 0, range: 0, color: '#f43f5e', description: 'Forged solid plate lining.', value: 130 },
  { id: 'shop_iron_helm', name: 'Iron Winged Helm', type: 'armor', subType: 'Helmet', defense: 3, damage: 0, critChance: 0, range: 0, color: '#f43f5e', description: 'Heavy iron helm with side reinforcement flaps.', value: 65 },
  { id: 'shop_leather_gloves', name: 'Gauntlets of Might', type: 'armor', subType: 'Gloves', defense: 2, damage: 0, critChance: 0, range: 0, color: '#38bdf8', description: 'Boiled leather and iron plated hand protection.', value: 45 },
  { id: 'shop_stone_pendant', name: 'Amulet of Might', type: 'armor', subType: 'Amulet', defense: 2, damage: 0, critChance: 0, range: 0, color: '#a78bfa', description: 'Engraved stone necklace boosting the wearer\'s fortitude.', value: 50 },
  { id: 'shop_heavy_boots', name: 'Sturdy Steel Soles', type: 'armor', subType: 'Boots', defense: 2, damage: 0, critChance: 0, range: 0, color: '#34d399', description: 'Reinforced knee-high leg protection.', value: 55 },
  { id: 'shop_heater_shield', name: 'Kite Guard Shield', type: 'armor', subType: 'Shield', defense: 4, damage: 0, critChance: 0, range: 0, color: '#eab308', description: 'Reinforced heater guard shield.', value: 75 }
];

export const MERCHANT_RESOURCES = [
  { id: 'mat_wood', name: 'Oakhaven Timber 🪵', price: 18, color: '#b45309', desc: 'Sturdy harvested forest timber. High desert demand.' },
  { id: 'mat_iron', name: 'Scrap Iron Iron', price: 32, color: '#4d5569', desc: 'Base alloy metal material.' },
  { id: 'mat_mithril', name: 'Glimmering Mithril', price: 75, color: '#38bdf8', desc: 'Rare light arcane metal.' },
  { id: 'mat_obsidian', name: 'Dark Volcanic Obsidian', price: 110, color: '#334155', desc: 'Highly brittle volcanic stone.' },
  { id: 'mat_dragonscale', name: 'Crimson Dragonscale', price: 160, color: '#f43f5e', desc: 'Fire-resistant protective shell.' },
  { id: 'mat_feybone', name: 'Ancient Feybone Scaffold', price: 195, color: '#10b981', desc: 'Enchanted fossil structure.' },
  { id: 'mat_thick_hide', name: 'Thick Wild Hide 🟤', price: 20, color: '#78350f', desc: 'Tough, insulated leather hide. Ideal for armor reinforcement.' },
  { id: 'mat_lockpick', name: 'Tension Lockpick 🔑', price: 15, color: '#eab308', desc: 'Used to crack open locked treasure chests.' },
  { id: 'mat_skeleton_key', name: 'Grim Skeleton Key 💀', price: 250, color: '#c084fc', desc: 'A rare single-use skull-headed key. Instantly opens any locked chest.' }
];

export const TAVERN_SHOP_ITEMS = [
  { id: 'mat_beer', name: 'Frothy Beer Mug 🍺', price: 15, color: '#fbbf24', desc: 'Satisfies and heals you! Restores 15 HP and 5 MP.' },
  { id: 'mat_bread', name: 'Fresh Hearth Bread 🍞', price: 10, color: '#f59e0b', desc: 'Warm village core loaf. Restores 20 HP.' },
  { id: 'mat_berry', name: 'Wild Berries 🍓', price: 8, color: '#f43f5e', desc: 'Sweet, harvested forest berries.' },
  { id: 'mat_berry_pie', name: 'Baked Berry Pie 🥧', price: 22, color: '#ec4899', desc: 'Enriched berry pie! Restores 40 HP and 15 MP.' },
  { id: 'mat_fishing_pole', name: 'Solid Fishing Pole 🎣', price: 35, color: '#06b6d4', desc: 'A resilient flexible rod. Cast into flowing river waters to catch wild fish!' },
  { id: 'mat_cooked_fish', name: 'Salt-Baked Fish 🐟', price: 20, color: '#38bdf8', desc: 'Deliciously cured over smoke. Restores 30 HP.' },
  { id: 'mat_lockpick', name: 'Tension Lockpick 🔑', price: 15, color: '#eab308', desc: 'Used to crack open locked treasure chests.' }
];

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

export const APOTHECARY_ITEMS = [
  { id: 'cat_fire', name: 'Pyrotactile Fire Catalyst', price: 20, color: '#ef4444', desc: 'Infuses burn fire afflictions.' },
  { id: 'cat_frost', name: 'Cryo-forged Ice Catalyst', price: 20, color: '#3b82f6', desc: 'Infuses freeze ice ralentiss.' },
  { id: 'cat_poison', name: 'Venom-stung Gas Catalyst', price: 20, color: '#10b981', desc: 'Infuses poison damage over turns.' },
  { id: 'cat_lightning', name: 'Super-charged Spark Catalyst', price: 20, color: '#eab308', desc: 'Infuses chain electro sparks.' },
  { id: 'cat_shadow', name: 'Void-gazing Dark Catalyst', price: 20, color: '#8b5cf6', desc: 'Infuses deep decay debuffs.' },
  { id: 'potion_hp', name: 'Apothecary Elixir (HP)', price: 15, color: '#ec4899', desc: 'Restores 35 HP on instant intake.' },
  { id: 'potion_mp', name: 'Aether Beverage (MP)', price: 12, color: '#3b82f6', desc: 'Restores 15 MP on instant intake.' },
  { id: 'scroll_recall', name: 'Scroll of Escape', price: 25, color: '#f43f5e', desc: 'Teleports you instantly out of any dungeon and returns you to the surface entrance!' }
];

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
  const isCaravan = id === 'npc_caravan_merchant' || id.includes('caravan');
  if (isCaravan) {
    return {
      maxGold: 240,
      defaultStock: MERCHANT_INITIALS['merchant'].stock
    };
  }
  let mappedRole = role;
  if (role === 'blacksmith') mappedRole = 'npc_blacksmith';
  else if (role === 'merchant') mappedRole = 'npc_merchant';
  else if (role === 'apothecary') mappedRole = 'npc_apothecary';
  else if (role === 'merchant_seppo') mappedRole = 'merchant_seppo';
  else if (role === 'traveler_herbalist') mappedRole = 'npc_apothecary';
  else if (role === 'traveler_hunter' || role === 'traveler_pilgrim') mappedRole = 'npc_merchant';

  const config = MERCHANT_INITIALS[mappedRole] || MERCHANT_INITIALS['tavern_master'];
  return {
    maxGold: config.gold,
    defaultStock: config.stock
  };
};
