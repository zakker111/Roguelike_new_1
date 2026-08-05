import { GameState, EquipmentItem, Quest } from '../types';

// Raw wood material definition
export interface MaterialItem {
  id: string;
  name: string;
  price: number;
  color: string;
  desc: string;
}

export const WOOD_MATERIAL: MaterialItem = {
  id: 'mat_wood',
  name: 'Oakhaven Timber 🪵',
  price: 8,
  color: '#b45309',
  desc: 'Sturdy harvested forest timber. Highly demanded in woodless desert biomes.'
};

// Guild HQ Upgrades
export interface GuildUpgrade {
  id: string;
  name: string;
  desc: string;
  costGold: number;
  costMaterials: { [matId: string]: number };
  maxLevel: number;
}

export const GUILD_UPGRADES: GuildUpgrade[] = [
  {
    id: 'up_supply_deals',
    name: 'Sunder Logistics Deals',
    desc: 'Permanently increases all raw material sell values by +20% per tier.',
    costGold: 550,
    costMaterials: { 'mat_iron': 4 },
    maxLevel: 3
  },
  {
    id: 'up_expeditions',
    name: 'Expedition Map Room',
    desc: 'Reduces companion dispatch quest durations by 25% per tier.',
    costGold: 450,
    costMaterials: { 'mat_berry': 8 },
    maxLevel: 3
  },
  {
    id: 'up_guild_discounts',
    name: 'Cooperative Bargaining',
    desc: 'Unlocks a passive 5% discount on merchant purchases per tier.',
    costGold: 650,
    costMaterials: { 'mat_mithril': 2 },
    maxLevel: 3
  }
];

// Guild HQ Sanctuary Decor
export interface GuildDecor {
  id: string;
  name: string;
  desc: string;
  costGold: number;
  icon: string;
  bonusText: string;
}

export const GUILD_DECORS: GuildDecor[] = [
  {
    id: 'dec_trophy',
    name: 'Champion Trophy Pedestal',
    desc: 'Display a shining emblem of heroic achievements.',
    costGold: 320,
    icon: '🏆',
    bonusText: '+15 Town Reputation and +10% maximum Renown gains.'
  },
  {
    id: 'dec_hearth',
    name: 'Ambient Leystone Hearth',
    desc: 'A glowing warm central fire pit infused with restorative magic.',
    costGold: 480,
    icon: '🔥',
    bonusText: '+10 Max HP and complete immunity to winter freezing while outdoors.'
  },
  {
    id: 'dec_crystal',
    name: 'Oracle Crystal Orb',
    desc: 'A swirling cyan orb predicting weather patterns.',
    costGold: 560,
    icon: '🔮',
    bonusText: '+10 Max MP and reveals adjacent hidden chests on the world map.'
  },
  {
    id: 'dec_banner',
    name: 'Royal Sunder Vanguard Banner',
    desc: 'A heavy embroidered banner representing safety and law.',
    costGold: 390,
    icon: '🚩',
    bonusText: 'Grants +2 passive Defense and +10% Attack against hostile Goblins.'
  }
];

// Companion Dispatch Quest
export interface CompanionQuest {
  id: string;
  title: string;
  desc: string;
  turnsRequired: number;
  rewardGold: number;
  rewardXp: number;
  rewardMaterials?: { [matId: string]: number };
}

export const COMPANION_QUEST_BOARD: CompanionQuest[] = [
  {
    id: 'cq_patrol',
    title: '🛡️ Border Patrol Sweep',
    desc: 'Clear out creeping spiders and scout bandits surrounding Oakhaven Hamlet.',
    turnsRequired: 40,
    rewardGold: 120,
    rewardXp: 100,
    rewardMaterials: { 'mat_iron': 2 }
  },
  {
    id: 'cq_mining',
    title: '⛏️ Crimson Canyon Excavation',
    desc: 'Gather rare volcanic minerals and raw iron ore from unstable rock beds.',
    turnsRequired: 60,
    rewardGold: 80,
    rewardXp: 150,
    rewardMaterials: { 'mat_iron': 5, 'mat_obsidian': 2 }
  },
  {
    id: 'cq_harvest',
    title: '🍓 Wilds Apothecary Supply',
    desc: 'Forage for deep forest wild berries and sample local swamp flora.',
    turnsRequired: 30,
    rewardGold: 70,
    rewardXp: 80,
    rewardMaterials: { 'mat_berry': 12 }
  },
  {
    id: 'cq_monster_hunt',
    title: '⚔️ High-Danger Beast Extermination',
    desc: 'Hunt a rare wild alpha predator terrorizing local nomadic farmers.',
    turnsRequired: 75,
    rewardGold: 250,
    rewardXp: 220,
    rewardMaterials: { 'mat_dragonscale': 1, 'mat_thick_hide': 3 }
  }
];

// Faction blueprints and gear
export interface FactionGear {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield';
  subType: string;
  damage?: number;
  defense?: number;
  critChance?: number;
  range?: number;
  costGold: number;
  costMaterials: { [matId: string]: number };
  desc: string;
  color: string;
}

export const SYNDICATE_GEAR: FactionGear[] = [
  {
    id: 'fac_syndicate_dirk',
    name: 'Moonshadow Assassin Dirk',
    type: 'weapon',
    subType: 'Sword',
    damage: 13,
    critChance: 0.35,
    range: 1,
    costGold: 300,
    costMaterials: { 'mat_iron': 3, 'mat_obsidian': 1 },
    desc: 'Highly toxic, weighted silent dagger crafted from black obsidian steel.',
    color: '#a78bfa'
  },
  {
    id: 'fac_syndicate_cloak',
    name: 'Syndicate Shadow Cowl',
    type: 'armor',
    subType: 'Helmet',
    defense: 4,
    costGold: 220,
    costMaterials: { 'mat_thick_hide': 4 },
    desc: 'Conceals features in pitch darkness. Sells for massive gold among outlaws.',
    color: '#8b5cf6'
  }
];

export const VANGUARD_GEAR: FactionGear[] = [
  {
    id: 'fac_vanguard_shield',
    name: 'Dawn Vanguard Aegis Shield',
    type: 'shield',
    subType: 'Shield',
    defense: 8,
    costGold: 320,
    costMaterials: { 'mat_iron': 5, 'mat_mithril': 1 },
    desc: 'Holy crested steel shield glowing with persistent restorative light.',
    color: '#fbbf24'
  },
  {
    id: 'fac_vanguard_plate',
    name: 'Dawn Vanguard Sunplate',
    type: 'armor',
    subType: 'HeavyArmor',
    defense: 11,
    costGold: 430,
    costMaterials: { 'mat_iron': 8, 'mat_mithril': 2 },
    desc: 'Imposing golden steel battle armor forged with the power of the morning sun.',
    color: '#fbbf24'
  }
];

export const BANDIT_GEAR: FactionGear[] = [
  {
    id: 'fac_bandit_cleaver',
    name: 'Rust-Raider Spiked Cleaver',
    type: 'weapon',
    subType: 'Sword',
    damage: 15,
    critChance: 0.22,
    range: 1,
    costGold: 280,
    costMaterials: { 'mat_iron': 4, 'mat_wood': 2 },
    desc: 'Hefty crude cleaver welded with rusty metal teeth. Deadly in raw strength encounters.',
    color: '#f97316'
  },
  {
    id: 'fac_bandit_vest',
    name: 'Outlaw Spiked Harness',
    type: 'armor',
    subType: 'LightArmor',
    defense: 6,
    costGold: 240,
    costMaterials: { 'mat_thick_hide': 4, 'mat_iron': 2 },
    desc: 'Reinforced leather vest lined with rusted iron spikes. Protects the torso and intimidates foes.',
    color: '#ea580c'
  }
];

/**
 * Calculates dynamic biome-based trade multipliers for buying and selling items.
 * @param itemId The unique ID of the item or material being traded
 * @param biome The current chunk biome ('forest', 'desert', 'tundra', 'swamp')
 * @returns A multiplier to be applied to the base value
 */
export const getBiomePriceMultiplier = (itemId: string, biome: 'forest' | 'desert' | 'tundra' | 'swamp'): number => {
  // 1. Wood values skyrocket in Arid Deserts (3.5x) and Tundras (1.5x)
  if (itemId === 'mat_wood') {
    if (biome === 'desert') return 3.5;
    if (biome === 'tundra') return 1.5;
    if (biome === 'swamp') return 0.8; // damp swamp has soggy wood
    return 1.0;
  }

  // 2. Liquid, Beer, or Hooch values surge in Freezing Tundras (2.5x)
  if (itemId === 'mat_beer' || itemId === 'potion_hp' || itemId === 'potion_medium_hp' || itemId === 'potion_mp' || itemId === 'potion_medium_mp' || itemId === 'potion_full_rejuv') {
    if (biome === 'tundra') return 2.2;
    if (biome === 'desert') return 1.5; // hydration
    return 1.0;
  }

  // 3. Raw or cooked fish and harbor catches sell for massive gold in Deserts (2.5x) due to scarcity
  if (itemId === 'mat_raw_fish' || itemId === 'mat_cooked_fish' || itemId === 'mat_fresh_catch' || itemId === 'mat_salted_cod') {
    if (biome === 'desert') return 2.5;
    if (biome === 'tundra') return 1.6;
    if (biome === 'swamp') return 0.7; // extremely common in swamps
    return 1.0;
  }

  // 3.5 Harbor Whale Oil, Sea Charts, and Ship Pitch
  if (itemId === 'mat_whale_oil') {
    if (biome === 'tundra') return 2.8; // arctic lantern fuel & warmth
    if (biome === 'swamp') return 1.8;
    return 1.0;
  }
  if (itemId === 'mat_nautical_chart') {
    if (biome === 'desert') return 2.2; // arid inland navigators pay premium
    if (biome === 'forest') return 1.6;
    return 1.0;
  }
  if (itemId === 'mat_ship_pitch') {
    if (biome === 'swamp') return 2.0; // waterproofing swamp boats & boots
    if (biome === 'tundra') return 1.5;
    return 1.0;
  }

  // 4. Metals and obsidian are heavily valued in Swamps (1.8x) due to rusty mines,
  // whereas Obsidian is common in deserts/volcanic zones and rare in Tundras (2.0x)
  if (itemId === 'mat_iron' || itemId === 'mat_mithril') {
    if (biome === 'swamp') return 1.8;
    if (biome === 'desert') return 0.9;
    return 1.0;
  }
  if (itemId === 'mat_obsidian') {
    if (biome === 'tundra') return 2.2;
    if (biome === 'forest') return 1.4;
    if (biome === 'desert') return 0.7; // common volcanic zones
    return 1.0;
  }

  // 5. Catalysts represent regional magical essence
  if (itemId === 'cat_fire') {
    if (biome === 'tundra') return 2.5; // rare fire in cold
    if (biome === 'desert') return 0.6; // abundant heat
    return 1.0;
  }
  if (itemId === 'cat_frost') {
    if (biome === 'desert') return 2.5; // rare ice in desert
    if (biome === 'tundra') return 0.6; // abundant snow
    return 1.0;
  }
  if (itemId === 'cat_poison') {
    if (biome === 'swamp') return 0.5; // abundant swamp toxins
    if (biome === 'tundra') return 1.8; // rare decay in frost
    return 1.0;
  }

  return 1.0;
};

/**
 * Returns a list of active price reports for the current biome
 */
export const getPriceReports = (biome: 'forest' | 'desert' | 'tundra' | 'swamp') => {
  const reports: { itemName: string; multiplier: number; direction: 'high' | 'low' | 'normal'; reason: string }[] = [];

  // Wood
  const woodMult = getBiomePriceMultiplier('mat_wood', biome);
  if (woodMult > 1.2) {
    reports.push({ itemName: 'Oakhaven Timber', multiplier: woodMult, direction: 'high', reason: 'Wood Scarcity (Import Premium)' });
  } else if (woodMult < 0.9) {
    reports.push({ itemName: 'Oakhaven Timber', multiplier: woodMult, direction: 'low', reason: 'Damp Swamplands Surplus' });
  }

  // Liquids / Alcohol
  const beerMult = getBiomePriceMultiplier('mat_beer', biome);
  if (beerMult > 1.2) {
    reports.push({ itemName: 'Potions & Brews', multiplier: beerMult, direction: 'high', reason: 'Biting Weather Exposure (Warmth Demand)' });
  }

  // Fish
  const fishMult = getBiomePriceMultiplier('mat_raw_fish', biome);
  if (fishMult > 1.2) {
    reports.push({ itemName: 'Nomadic Wildlife Fish', multiplier: fishMult, direction: 'high', reason: 'Arid Wasteland Scarcity' });
  } else if (fishMult < 0.9) {
    reports.push({ itemName: 'Nomadic Wildlife Fish', multiplier: fishMult, direction: 'low', reason: 'Local Lagoon Abundance' });
  }

  // Metals
  const ironMult = getBiomePriceMultiplier('mat_iron', biome);
  if (ironMult > 1.2) {
    reports.push({ itemName: 'Scrap Iron & Metals', multiplier: ironMult, direction: 'high', reason: 'Flooded / Water-logged Mines' });
  }

  // Fire Catalysts
  const fireMult = getBiomePriceMultiplier('cat_fire', biome);
  if (fireMult > 1.2) {
    reports.push({ itemName: 'Pyrotactile Fire Catalyst', multiplier: fireMult, direction: 'high', reason: 'Subzero Climatic Inversion' });
  } else if (fireMult < 0.8) {
    reports.push({ itemName: 'Pyrotactile Fire Catalyst', multiplier: fireMult, direction: 'low', reason: 'Intense Sunlight Saturation' });
  }

  // Frost Catalysts
  const frostMult = getBiomePriceMultiplier('cat_frost', biome);
  if (frostMult > 1.2) {
    reports.push({ itemName: 'Cryo-forged Ice Catalyst', multiplier: frostMult, direction: 'high', reason: 'Scorching Desert Climate Premium' });
  } else if (frostMult < 0.8) {
    reports.push({ itemName: 'Cryo-forged Ice Catalyst', multiplier: frostMult, direction: 'low', reason: 'Frostfield Glacial Abundance' });
  }

  return reports;
};
