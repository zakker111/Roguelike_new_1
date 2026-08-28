import { GameState, EquipmentItem, Quest, BiomeType } from '../types';
import economyData from '../data/economy.json';
import guildJson from '../data/guildData.json';

export const ECONOMY_CONFIG = economyData;

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

export const GUILD_UPGRADES: GuildUpgrade[] = guildJson.guildUpgrades as GuildUpgrade[];

// Guild HQ Sanctuary Decor
export interface GuildDecor {
  id: string;
  name: string;
  desc: string;
  costGold: number;
  icon: string;
  bonusText: string;
}

export const GUILD_DECORS: GuildDecor[] = guildJson.guildDecors as GuildDecor[];

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

export const COMPANION_QUEST_BOARD: CompanionQuest[] = guildJson.companionQuests as CompanionQuest[];

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

export const SYNDICATE_GEAR: FactionGear[] = guildJson.syndicateGear as FactionGear[];
export const VANGUARD_GEAR: FactionGear[] = guildJson.vanguardGear as FactionGear[];
export const BANDIT_GEAR: FactionGear[] = guildJson.banditGear as FactionGear[];

/**
 * Calculates dynamic biome-based trade multipliers for buying and selling items.
 * @param itemId The unique ID of the item or material being traded
 * @param biome The current chunk biome ('forest', 'desert', 'tundra', 'swamp')
 * @returns A multiplier to be applied to the base value
 */
export const getBiomePriceMultiplier = (itemId: string, biome: BiomeType): number => {
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
export const getPriceReports = (biome: 'forest' | 'desert' | 'tundra' | 'swamp' | 'town') => {
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
