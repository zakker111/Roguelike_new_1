import { EquipmentItem, WeaponBaseType, GameState } from '../types';
import { getEffectiveStats } from './scars';

/**
 * Global Configuration for the Inventory Weight System.
 * Modify these limits and individual component weights here to instantly calibrate.
 */
export const WEIGHT_CONFIG = {
  // Base carrying capacity. Total carrying capacity is: baseMaxWeight + (strength * strengthMultiplier)
  baseMaxWeight: 80.0,
  strengthMultiplier: 4.0, // strength increases carrying limit by 4.0 per point

  // Equipment Weights (governed by type and physical equipment subType)
  equipmentWeights: {
    // Weapons (based on structural size / type)
    [WeaponBaseType.Sword]: 5.0,     // Heavy Steel Blade
    [WeaponBaseType.Spear]: 6.5,     // Long wooden/metal shafts
    [WeaponBaseType.Dagger]: 1.2,    // Ultra-light concealment tool
    [WeaponBaseType.Hammer]: 14.0,   // Gigantic stone/iron skullcleaver
    [WeaponBaseType.Staff]: 3.5,     // Enchanted crystal stave
    [WeaponBaseType.Bow]: 4.0,       // Bound fiber recurve bow
    [WeaponBaseType.Wand]: 1.5,      // Pocket energy focus
    [WeaponBaseType.Crossbow]: 8.0,  // Heavy mechanical iron/timber bow
    [WeaponBaseType.Greatsword]: 12.0, // Colossal steel zweihander
    [WeaponBaseType.Warhammer]: 16.0,  // Gigantic iron plate crusher
    
    // Armaments & Utilities
    'HeavyArmor': 22.0,   // Full metal knight plate
    'LightArmor': 6.0,    // Hardened leather vestments
    'Shield': 10.0,       // Plated defensive heater shield
    'Helmet': 4.0,        // Steel visor kettle helmet
    'Gloves': 1.5,        // Studded leather mittens
    'Boots': 3.0,         // Bound steel travel greaves
    'Scroll': 0.2,        // Lightweight parchment scrolls
  } as Record<string, number>,

  // Raw Alloys, Timber, and Edible Materials (per individual unit weight)
  materialWeights: {
    'mat_iron': 1.5,        // Solid alloy scrap
    'mat_mithril': 0.4,     // Ethereal ultra-light stately metal
    'mat_obsidian': 2.5,    // Heavy volcanic dense obsidian slab
    'mat_dragonscale': 1.2, // Reinforced reptilian warm shield scale
    'mat_feybone': 0.7,     // Magic-resonant brittle bone shards
    'mat_wood': 1.0,        // High-density timber branch bundle
    'mat_raw_meat': 1.0,    // Dripping prime animal carcass cut
    'mat_cooked_meat': 0.8, // Cooked, cured moisture-reduced steak
    'mat_berry': 0.05,      // Handful of ripe small woodland berries
    'mat_cooked_pie': 0.7,  // Hearth-baked full meal pie dish
    'mat_beer': 0.6,        // Loaded thick glass beverage draft mug
    'mat_seppo_hooch': 0.5, // Seppo's Secret Hooch bottle
    'mat_bread': 0.4,       // Soft baked field yeast dough loaf
    'mat_fishing_pole': 1.5, // Lightweight wood and line fishing pole
    'mat_lockpick': 0.1,     // Extremely lightweight tension wire pick
    'mat_skeleton_key': 0.2, // Solid ancient iron skull-headed key
    'mat_raw_fish': 0.8,    // Fresh raw ocean/lake fish
    'mat_cooked_fish': 0.6, // Succulent grilled campfire fish
    'potion_hp': 0.3,       // Standard health potion bottle
    'potion_mp': 0.3,       // Standard mana potion bottle
    'potion_medium_hp': 0.3, // Medium health potion bottle
    'potion_medium_mp': 0.3, // Medium mana potion bottle
    'potion_full_rejuv': 0.3, // Rejuvenation elixir bottle
    'potion_full_rejuvenation': 0.3, // Royal rejuvenation bottle
    'scroll_recall': 0.1,   // Lightweight escape parchment
  } as Record<string, number>,

  // Sorcerous Elemental Catalysts (per individual unit weight)
  catalystWeights: {
    'cat_fire': 0.3,      // Sealed active fiery core
    'cat_frost': 0.3,     // Glacial icy amber shard
    'cat_poison': 0.3,    // Corked venom fluid container
    'cat_lightning': 0.3, // static volt clumping rock
    'cat_shadow': 0.3,    // Lightless hollow void pebble
  } as Record<string, number>,

  // Fallbacks
  fallbackEquipmentWeight: 3.0,
  fallbackMaterialWeight: 0.1,
};

/**
 * Calculates the current player's maximum carrying capacity based on their attributes.
 */
export function getMaxWeight(gameState: GameState): number {
  // Let the God Panel or sandboxes deactivate weight rules easily via custom settings
  const bypass = (window as any).bypassWeightLimit;
  const effStats = getEffectiveStats(gameState.playerStats);
  if (bypass === true || effStats.str >= 999) {
    return 9999.0;
  }

  // Allow customizable override value in memory (from developer sandbox UI)
  const customLimit = (window as any).customBaseMaxWeight;
  const base = customLimit !== undefined ? customLimit : WEIGHT_CONFIG.baseMaxWeight;

  return base + (effStats.str * WEIGHT_CONFIG.strengthMultiplier);
}

/**
 * Calculates current accumulated inventory weight.
 */
export function getCurrentWeight(gameState: GameState): number {
  let total = 0.0;

  // 1. Equipment Inventory Items
  if (gameState.equipmentInventory) {
    for (const item of gameState.equipmentInventory) {
      const typeWeight = WEIGHT_CONFIG.equipmentWeights[item.subType] ?? WEIGHT_CONFIG.equipmentWeights[item.type];
      const baseW = typeWeight !== undefined ? typeWeight : WEIGHT_CONFIG.fallbackEquipmentWeight;
      const qty = item.quantity || 1;
      total += baseW * qty;
    }
  }

  // 2. Materials Stocks
  if (gameState.inventoryMaterials) {
    for (const [id, qty] of Object.entries(gameState.inventoryMaterials)) {
      if (qty && qty > 0) {
        const itemWeight = WEIGHT_CONFIG.materialWeights[id] ?? WEIGHT_CONFIG.fallbackMaterialWeight;
        total += itemWeight * qty;
      }
    }
  }

  // 3. Catalysts Elements
  if (gameState.inventoryCatalysts) {
    for (const [id, qty] of Object.entries(gameState.inventoryCatalysts)) {
      if (qty && qty > 0) {
        const itemWeight = WEIGHT_CONFIG.catalystWeights[id] ?? WEIGHT_CONFIG.fallbackMaterialWeight;
        total += itemWeight * qty;
      }
    }
  }

  // Return float formatted to 1 decimal place
  return Math.round(total * 10) / 10;
}

/**
 * Calculates the hypothetical weight if an item or additional count were added to verify capacity.
 */
export function checkWeightCapacity(gameState: GameState, additionalWeight: number): boolean {
  const current = getCurrentWeight(gameState);
  const max = getMaxWeight(gameState);
  return (current + additionalWeight) <= max;
}

/**
 * Retrieve specific weight of a single EquipmentItem based on subType/type size rules.
 */
export function getItemWeight(item: { type: string; subType: string }): number {
  const weight = WEIGHT_CONFIG.equipmentWeights[item.subType] ?? WEIGHT_CONFIG.equipmentWeights[item.type];
  return weight !== undefined ? weight : WEIGHT_CONFIG.fallbackEquipmentWeight;
}

/**
 * Retrieve specific unit weight of material or catalyst keys.
 */
export function getMaterialUnitWeight(id: string): number {
  return WEIGHT_CONFIG.materialWeights[id] ?? WEIGHT_CONFIG.catalystWeights[id] ?? WEIGHT_CONFIG.fallbackMaterialWeight;
}
