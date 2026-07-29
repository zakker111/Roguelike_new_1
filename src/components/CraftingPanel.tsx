/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Hammer, Flame, Sparkles, Compass, Swords, ArrowRight, Check, RotateCw, Sparkle, HelpCircle, Shuffle, ChefHat, CupSoda, Lock, TrendingUp, Info } from 'lucide-react';
import { Material, Catalyst, WeaponBaseType, CraftedWeapon, EquipmentItem, GameState } from '../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS, WEAPON_TEMPLATES } from '../utils/itemsData';
import { SPELL_SCROLLS } from '../utils/spellScrolls';
import { COOKING_RECIPES, BREWING_RECIPES, CookingRecipe, BrewingRecipe } from '../data/recipes';
import { MutationSynergyPanel } from './MutationSynergyPanel';
import { OverforgeGauge } from './OverforgeGauge';
import { CookingTab } from './crafting/CookingTab';
import { AlchemyTab } from './crafting/AlchemyTab';

interface CraftingPanelProps {
  inventoryMaterials: { [materialId: string]: number };
  inventoryCatalysts: { [catalystId: string]: number };
  onCraftWeapon: (
    baseType: WeaponBaseType,
    materialId: string,
    catalystId: string,
    category?: 'weapon' | 'armor',
    armorSubType?: string,
    overforgeHeat?: number
  ) => void;
  currentWeapon: CraftedWeapon | null;
  onPlaceCampfire?: () => void;
  onPlaceAnvil?: () => void;
  onCookMeat?: () => void;
  onCookFish?: () => void;
  onCookPrimeMeat?: () => void;
  onCraftFishingPole?: () => void;
  onCraftLockpicks?: () => void;
  onCraftHatchet?: () => void;
  onCraftPickaxe?: () => void;
  onRestCampfire?: () => void;
  isNextToCampfire?: boolean;
  isNextToAnvil?: boolean;
  equipmentInventory?: EquipmentItem[];
  onMutateItem?: (targetId: 'current_weapon' | string, materialId: string, catalystId: string, overforgeHeat?: number) => void;
  onUpgradeItem?: (targetId: 'current_weapon' | string, materialId: string, overforgeHeat?: number) => void;
  blacksmithForgeLevel?: number;
  onCraftRecallScroll?: () => void;
  onCraftSpellScroll?: (scrollTemplateId: string) => void;
  gameState: GameState;
  onCookRecipe: (
    recipeId: string,
    restoringHp: number,
    restoringMp: number,
    buff: {
      name: string;
      description: string;
      atkBonus: number;
      defBonus: number;
      critBonus: number;
      speedBonus: number;
      turnsRemaining: number;
    } | null,
    costMaterials: { [matId: string]: number },
    costCatalysts: { [catId: string]: number },
    successLog: string
  ) => void;
  onBrewPotion: (
    recipeId: string,
    restoringHp: number,
    restoringMp: number,
    permanentStats: {
      str?: number;
      int?: number;
      def?: number;
      lck?: number;
      exhaustionReduction?: number;
    },
    costMaterials: { [matId: string]: number },
    costCatalysts: { [catId: string]: number },
    successLog: string
  ) => void;
  onUpgradeApothecary: () => void;
}

export interface ArmorTemplate {
  subType: string;
  name: string;
  description: string;
  baseDefense: number;
  icon: string;
}

export const ARMOR_TEMPLATES: ArmorTemplate[] = [
  { subType: 'Shield', name: 'Guardian Greatshield', description: 'A sturdy shield that deflects incoming physical damage and heavy strikes.', baseDefense: 3, icon: '🛡️' },
  { subType: 'HeavyArmor', name: 'Alloy Plate Mail', description: 'Re-enforced full body mail with high defense blocks against blunt impacts.', baseDefense: 5, icon: '👕' },
  { subType: 'Helmet', name: 'Centurion Greathelm', description: 'Thick metal skull protection to defuse frontal trauma and skull fractures.', baseDefense: 2, icon: '🪖' },
  { subType: 'Gloves', name: 'Vanguard Gauntlets', description: 'Fortified steel-reinforced gloves to guard wrists and improve swings.', baseDefense: 1, icon: '🧤' },
  { subType: 'Amulet', name: 'Vanguard Neck Piece', description: 'Fortified amulet to guard against throat strikes and improve concentration.', baseDefense: 1, icon: '📿' },
  { subType: 'Boots', name: 'Armored Greaves', description: 'Steel plate plating for lower leg protection and stability in muddy biome fields.', baseDefense: 1, icon: '🥾' }
];

function CraftingPanelComponent({
  inventoryMaterials,
  inventoryCatalysts,
  onCraftWeapon,
  currentWeapon,
  onPlaceCampfire,
  onPlaceAnvil,
  onCookMeat,
  onCookFish,
  onCookPrimeMeat,
  onCraftFishingPole,
  onCraftLockpicks,
  onCraftHatchet,
  onCraftPickaxe,
  onRestCampfire,
  isNextToCampfire = false,
  isNextToAnvil = false,
  equipmentInventory = [],
  onMutateItem,
  onUpgradeItem,
  blacksmithForgeLevel = 1,
  onCraftRecallScroll,
  onCraftSpellScroll,
  gameState,
  onCookRecipe,
  onBrewPotion,
  onUpgradeApothecary,
}: CraftingPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'weapons' | 'survival' | 'cooking' | 'brewing' | 'mutation' | 'upgrade'>('weapons');

  // Weapons & Armors Forging Local States
  const [craftCategory, setCraftCategory] = useState<'weapon' | 'armor'>('weapon');
  const [selectedBase, setSelectedBase] = useState<WeaponBaseType>(WeaponBaseType.Sword);
  const [selectedArmorSubType, setSelectedArmorSubType] = useState<string>('Shield');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('mat_iron');
  const [selectedCatalystId, setSelectedCatalystId] = useState<string>('cat_fire');

  // Mutation Tab Local States
  const [selectedMutationItem, setSelectedMutationItem] = useState<'current_weapon' | string>('current_weapon');
  const [selectedMutationMaterialId, setSelectedMutationMaterialId] = useState<string>('mat_iron');
  const [selectedMutationCatalystId, setSelectedMutationCatalystId] = useState<string>('cat_fire');

  // Upgrade Tab Local States
  const [selectedUpgradeItem, setSelectedUpgradeItem] = useState<'current_weapon' | string>('current_weapon');
  const [selectedUpgradeMaterialId, setSelectedUpgradeMaterialId] = useState<string>('mat_iron');

  // Over-Forging Heat State
  const [overforgeHeat, setOverforgeHeat] = useState<number>(0);

  const selectedMaterial = BASIC_MATERIALS.find((m) => m.id === selectedMaterialId) || BASIC_MATERIALS[0];
  const selectedCatalyst = ELEMENTAL_CATALYSTS.find((c) => c.id === selectedCatalystId) || ELEMENTAL_CATALYSTS[0];

  // Wood & Meat counts
  const scrapWoodCount = inventoryMaterials['mat_wood'] || 0;
  const ironCount = inventoryMaterials['mat_iron'] || 0;
  const lockpickCount = inventoryMaterials['mat_lockpick'] || 0;
  const rawMeatCount = inventoryMaterials['mat_raw_meat'] || 0;
  const cookedMeatCount = inventoryMaterials['mat_cooked_meat'] || 0;
  const rawPrimeMeatCount = inventoryMaterials['mat_prime_meat'] || 0;
  const cookedPrimeMeatCount = inventoryMaterials['mat_cooked_prime_meat'] || 0;
  const fishingPoleCount = inventoryMaterials['mat_fishing_pole'] || 0;
  const rawFishCount = inventoryMaterials['mat_raw_fish'] || 0;
  const cookedFishCount = inventoryMaterials['mat_cooked_fish'] || 0;

  const dragonScaleCount = inventoryMaterials['mat_dragonscale'] || 0;
  const feyBoneCount = inventoryMaterials['mat_feybone'] || 0;
  const shadowCatalystCount = inventoryCatalysts['cat_shadow'] || 0;
  const recallScrollCount = equipmentInventory?.filter(item => item.name.includes("Recall") || item.id.includes("recall_town")).length || 0;

  const obsidianCount = inventoryMaterials['mat_obsidian'] || 0;
  const fireCatCount = inventoryCatalysts['cat_fire'] || 0;
  const frostCatCount = inventoryCatalysts['cat_frost'] || 0;
  const poisonCatCount = inventoryCatalysts['cat_poison'] || 0;

  const fireScrollCount = equipmentInventory?.filter(item => item.id.includes("scroll_spell_pyro_firestorm")).length || 0;
  const waterScrollCount = equipmentInventory?.filter(item => item.id.includes("scroll_spell_tide_wave")).length || 0;
  const poisonScrollCount = equipmentInventory?.filter(item => item.id.includes("scroll_spell_noxious_swarm")).length || 0;

  // --- ALCHEMICAL BREWING & CAMPFIRE COOKING INTEGRATION ---
  const getMaterialCount = (matId: string) => inventoryMaterials[matId] || 0;
  const getCatalystCount = (catId: string) => inventoryCatalysts[catId] || 0;

  // Active lab tier
  const labTier = gameState?.apothecaryTier || 1;

  // Check if player has the materials and catalysts for a recipe
  const hasIngredients = (materials: { [matId: string]: number }, catalysts: { [catId: string]: number }) => {
    for (const [matId, qty] of Object.entries(materials)) {
      if (getMaterialCount(matId) < qty) return false;
    }
    for (const [catId, qty] of Object.entries(catalysts)) {
      if (getCatalystCount(catId) < qty) return false;
    }
    return true;
  };

  const handleCook = (recipe: CookingRecipe) => {
    if (!isNextToCampfire) return;
    if (!hasIngredients(recipe.materials, recipe.catalysts)) return;

    onCookRecipe(
      recipe.id,
      recipe.restoringHp,
      recipe.restoringMp,
      recipe.buff,
      recipe.materials,
      recipe.catalysts,
      `🍴 [GOURMET COOKING]: Prepared and consumed "${recipe.name}"! Restored ${recipe.restoringHp} HP and gained buff effects.`
    );
  };

  const handleBrew = (recipe: BrewingRecipe) => {
    if (labTier < recipe.requiredTier) return;
    if (!hasIngredients(recipe.materials, recipe.catalysts)) return;

    onBrewPotion(
      recipe.id,
      recipe.restoringHp,
      recipe.restoringMp,
      recipe.permanentStats,
      recipe.materials,
      recipe.catalysts,
      `🧪 [ALCHEMICAL BREWING]: Masterfully brewed and consumed "${recipe.name}"! Stats permanently boosted!`
    );
  };

  const handleUpgradeLab = () => {
    onUpgradeApothecary();
  };

  const nextUpgradeCost = labTier === 1 ? 150 : labTier === 2 ? 300 : 0;
  // --- END OF INTEGRATION ---

  // Helper to generate dynamic title
  function getMaterialAdj(mat: Material) {
    if (mat.id === 'mat_iron') return 'Iron';
    if (mat.id === 'mat_mithril') return 'Mithril';
    if (mat.id === 'mat_obsidian') return 'Obsidian';
    if (mat.id === 'mat_dragonscale') return 'Wyrmscale';
    if (mat.id === 'mat_feybone') return 'Relic-Bone';
    return mat.name.split(' ')[0];
  }

  function getCatalystPrefix(cat: Catalyst) {
    if (cat.type === 'Fire') return 'Volcanic';
    if (cat.type === 'Frost') return 'Chilled';
    if (cat.type === 'Poison') return 'Adder';
    if (cat.type === 'Lightning') return 'Sparking';
    if (cat.type === 'Shadow') return 'Umbrial';
    return cat.name.split(' ')[0];
  }

  // Active armor details
  const activeArmorTemplate = ARMOR_TEMPLATES.find(t => t.subType === selectedArmorSubType) || ARMOR_TEMPLATES[0];
  const baseTemplate = WEAPON_TEMPLATES[selectedBase];

  const craftedName = craftCategory === 'weapon'
    ? `${getCatalystPrefix(selectedCatalyst)} ${getMaterialAdj(selectedMaterial)} ${selectedBase}`
    : `${getCatalystPrefix(selectedCatalyst)} ${getMaterialAdj(selectedMaterial)} ${activeArmorTemplate.name}`;

  // Calculates previews
  const finalDamage = baseTemplate.baseDamage + selectedMaterial.baseDamageMod;
  const finalCrit = Math.min(1.0, baseTemplate.baseCrit + selectedMaterial.critMod);
  const finalRange = baseTemplate.range;
  const isSpecialProperty = selectedMaterial.extraProperty;

  // Calculates armor defense scaling
  let defenseBonus = 1;
  if (selectedMaterial.id === 'mat_iron') defenseBonus = 1;
  else if (selectedMaterial.id === 'mat_mithril' || selectedMaterial.id === 'mat_obsidian') defenseBonus = 2;
  else defenseBonus = 3;
  const finalDefense = activeArmorTemplate.baseDefense + defenseBonus;

  // Inventory quantities
  const materialCount = inventoryMaterials[selectedMaterialId] || 0;
  const catalystCount = inventoryCatalysts[selectedCatalystId] || 0;
  
  const currentSelectedBaseRequiredLevel = selectedBase === 'Staff' || selectedBase === 'Wand' || selectedBase === 'Crossbow'
    ? 2
    : selectedBase === 'Greatsword' || selectedBase === 'Warhammer'
      ? 3
      : 1;
  const isForgeAvailable = Boolean(isNextToAnvil || gameState?.isTown || gameState?.godMode);
  const isCurrentSelectedBaseLocked = craftCategory === 'weapon' && currentSelectedBaseRequiredLevel > blacksmithForgeLevel;
  const canCraft = materialCount > 0 && catalystCount > 0 && !isCurrentSelectedBaseLocked && isForgeAvailable;

  // Overforged stat multiplier preview
  const heatRatio = overforgeHeat / 100;
  const overforgePowerMult = 1.0 + (heatRatio * 1.25);
  const shatterChancePercent = Math.round(heatRatio * 65);
  const backfireDmgPreview = Math.floor(heatRatio * 15);

  const finalDamageOverforged = Math.round(finalDamage * overforgePowerMult);
  const finalCritOverforged = Math.min(0.95, parseFloat((finalCrit + (heatRatio * 0.25)).toFixed(2)));
  const finalDefenseOverforged = Math.round(finalDefense * overforgePowerMult);

  const getHeatTitle = (heat: number) => {
    if (heat >= 95) return { name: '⚡ GOD-FORGED', color: 'text-amber-300 border-amber-400 bg-amber-500/20 shadow-amber-500/30' };
    if (heat >= 75) return { name: '🌋 INFERNAL', color: 'text-rose-400 border-rose-500 bg-rose-500/20 shadow-rose-500/30' };
    if (heat >= 50) return { name: '🔥 INCANDESCENT', color: 'text-orange-400 border-orange-500 bg-orange-500/20 shadow-orange-500/30' };
    if (heat >= 25) return { name: '⚡ OVER-HEATED', color: 'text-yellow-400 border-yellow-500 bg-yellow-500/20' };
    return { name: '🛡️ SAFE ANVIL (0% HEAT)', color: 'text-slate-400 border-slate-700 bg-slate-900/50' };
  };

  const heatStatus = getHeatTitle(overforgeHeat);

  const renderOverforgeGauge = () => (
    <OverforgeGauge
      overforgeHeat={overforgeHeat}
      setOverforgeHeat={setOverforgeHeat}
      overforgePowerMult={overforgePowerMult}
      shatterChancePercent={shatterChancePercent}
      backfireDmgPreview={backfireDmgPreview}
    />
  );

  const handleCraft = () => {
    if (canCraft) {
      onCraftWeapon(selectedBase, selectedMaterialId, selectedCatalystId, craftCategory, selectedArmorSubType, overforgeHeat);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full text-slate-100 min-h-[500px]">
      {/* Header and Subtab Selector */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 px-5 py-3 border-b border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          <Hammer className="w-5 h-5 text-amber-500 animate-pulse" />
          <h2 className="text-sm font-sans tracking-wide font-semibold text-slate-100 uppercase">
            CRAFTING ARCANUM WORKBENCH
          </h2>
        </div>

        {/* Top Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1 flex-wrap">
          <button
            onClick={() => setActiveSubTab('weapons')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'weapons'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡️ Forge Equipment
          </button>
          <button
            onClick={() => setActiveSubTab('survival')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'survival'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⛺ Camp & Tools
          </button>
          <button
            onClick={() => setActiveSubTab('cooking')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'cooking'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🍳 Campfire Cooking
          </button>
          <button
            onClick={() => setActiveSubTab('brewing')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'brewing'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🧪 Alchemical Brewing
          </button>
          <button
            onClick={() => setActiveSubTab('mutation')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-305 ${
              activeSubTab === 'mutation'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold shadow-md shadow-purple-900/40 border border-purple-400/40 scale-102 font-mono'
                : 'text-slate-400 hover:text-purple-300 border border-transparent'
            }`}
          >
            🌀 Mutation Forge
          </button>
          <button
            onClick={() => setActiveSubTab('upgrade')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-300 ${
              activeSubTab === 'upgrade'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-900/40 border border-emerald-400/40 scale-102 font-mono'
                : 'text-slate-400 hover:text-emerald-300 border border-transparent'
            }`}
          >
            ✨ Upgrade Gear
          </button>
        </div>
      </div>

      {activeSubTab === 'weapons' && (
        /* ==================== GENERAL EQUIPMENT FORGING TAB ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 flex-1 overflow-y-auto">
          {/* Step 1: Base Equipment Archetype */}
          <div className="lg:col-span-4 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-red-600/30 text-red-400 font-mono font-bold">1</span>
                <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Select Gear Class</h3>
              </div>

              {/* Weapon vs Armor selection button */}
              <div className="flex bg-slate-950 p-0.5 rounded border border-slate-850 gap-0.5">
                <button
                  onClick={() => setCraftCategory('weapon')}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    craftCategory === 'weapon'
                      ? 'bg-red-900/40 text-red-400 border border-red-900/30 font-black'
                      : 'text-slate-400'
                  }`}
                >
                  Weapons
                </button>
                <button
                  onClick={() => setCraftCategory('armor')}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    craftCategory === 'armor'
                      ? 'bg-blue-900/40 text-blue-400 border border-blue-900/30 font-black'
                      : 'text-slate-400'
                  }`}
                >
                  Armors
                </button>
              </div>
            </div>

            {craftCategory === 'weapon' ? (
              <div className="grid grid-cols-1 gap-2 flex-1 max-h-[460px] overflow-y-auto pr-1">
                {Object.values(WEAPON_TEMPLATES).map((tmpl) => {
                  const isSelected = selectedBase === tmpl.baseType;
                  const reqLevel = tmpl.baseType === 'Staff' || tmpl.baseType === 'Wand' || tmpl.baseType === 'Crossbow'
                    ? 2
                    : tmpl.baseType === 'Greatsword' || tmpl.baseType === 'Warhammer'
                      ? 3
                      : 1;
                  const isLocked = reqLevel > blacksmithForgeLevel;

                  return (
                    <button
                      key={tmpl.baseType}
                      id={`craft-base-${tmpl.baseType}`}
                      disabled={isLocked}
                      onClick={() => !isLocked && setSelectedBase(tmpl.baseType)}
                      className={`flex items-start gap-3 p-3 rounded-lg text-left border transition-all duration-200 ${
                        isLocked
                          ? 'bg-slate-950/20 border-slate-900 opacity-50 cursor-not-allowed'
                          : isSelected
                            ? 'bg-red-950/20 border-red-500/60 shadow-lg shadow-red-950/20'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700/80'
                      }`}
                    >
                      <span className="text-2xl mt-0.5">{tmpl.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-100">{tmpl.baseType}</span>
                          {isLocked ? (
                            <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/40 border border-rose-900/35 px-1.5 py-0.5 rounded">🔒 Forge T{reqLevel}</span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400">Range: {tmpl.range}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal mt-1">{tmpl.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-amber-400">
                          <span>Dmg: {tmpl.baseDamage}</span>
                          <span>Crit: {(tmpl.baseCrit * 100).toFixed(0)}%</span>
                          {tmpl.manaCost > 0 && <span className="text-blue-400">MP Cost: {tmpl.manaCost}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 flex-1 max-h-[460px] overflow-y-auto pr-1">
                {ARMOR_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedArmorSubType === tmpl.subType;
                  return (
                    <button
                      key={tmpl.subType}
                      id={`craft-armor-${tmpl.subType}`}
                      onClick={() => setSelectedArmorSubType(tmpl.subType)}
                      className={`flex items-start gap-3 p-3 rounded-lg text-left border transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-950/20 border-blue-500/60 shadow-lg shadow-blue-950/20'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700/80'
                      }`}
                    >
                      <span className="text-2xl mt-0.5">{tmpl.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-100">{tmpl.name}</span>
                          <span className="text-[10.5px] font-mono bg-blue-950/40 text-blue-400 font-bold px-1 rounded">
                            {tmpl.subType.replace('Heavy', 'Heavy ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal mt-1">{tmpl.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-blue-400">
                          <span>Base Def: +{tmpl.baseDefense}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Alloys & Catalysts */}
          <div className="lg:col-span-4 p-5 flex flex-col gap-5">
            {/* Metal Alloy */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-amber-600/30 text-amber-400 font-mono font-bold">2</span>
                  <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase font-sans">Affix Core Material</h3>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {BASIC_MATERIALS.map((mat) => {
                  const isSelected = selectedMaterialId === mat.id;
                  const qty = inventoryMaterials[mat.id] || 0;
                  return (
                    <button
                      key={mat.id}
                      id={`craft-mat-${mat.id}`}
                      onClick={() => setSelectedMaterialId(mat.id)}
                      className={`flex items-start justify-between p-2.5 rounded-lg text-left border text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-950/15 border-amber-600/60'
                          : 'bg-slate-950/30 border-slate-800 hover:border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: mat.color }}
                        />
                        <div>
                          <div className="font-medium text-slate-200">{mat.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{mat.description}</div>
                          <div className="flex gap-2.5 mt-1 text-[9px] font-mono text-slate-400">
                            {craftCategory === 'weapon' ? (
                              <>
                                <span className="text-emerald-400">Dmg Mod +{mat.baseDamageMod}</span>
                                <span className="text-blue-400">Crit +{(mat.critMod * 100).toFixed(0)}%</span>
                              </>
                            ) : (
                              <span className="text-blue-400">Armoring Def Bonus +{mat.id === 'mat_iron' ? '1' : (mat.id === 'mat_mithril' || mat.id === 'mat_obsidian') ? '2' : '3'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right pl-3 shrink-0">
                        <span className={`font-mono font-bold text-[11px] ${qty > 0 ? 'text-slate-200' : 'text-rose-500 font-bold'}`}>
                          Qty: {qty}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Elemental Catalyst */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-blue-600/30 text-blue-400 font-mono font-bold">3</span>
                  <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase font-sans">Fuse Catalyst Crystal</h3>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {ELEMENTAL_CATALYSTS.map((cat) => {
                  const isSelected = selectedCatalystId === cat.id;
                  const qty = inventoryCatalysts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      id={`craft-cat-${cat.id}`}
                      onClick={() => setSelectedCatalystId(cat.id)}
                      className={`flex items-start justify-between p-2.5 rounded-lg text-left border text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-950/15 border-blue-600/60'
                          : 'bg-slate-950/30 border-slate-800 hover:border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Flame className="w-4 h-4 mt-0.5 shrink-0" style={{ color: cat.color }} />
                        <div>
                          <div className="font-medium text-slate-200">{cat.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{cat.description}</div>
                          <div className="flex gap-2.5 mt-1 text-[9px] font-mono text-slate-400">
                            <span style={{ color: cat.color }}>Effect: {cat.damageType}</span>
                            <span className="text-slate-400">Chance: {(cat.statusEffectChance * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right pl-3 shrink-0">
                        <span className={`font-mono font-bold text-[11px] ${qty > 0 ? 'text-slate-200' : 'text-rose-500'}`}>
                          Qty: {qty}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3: Forge Output */}
          <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-950/30">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Arriving Core Craft</h3>
              </div>

              {/* Simulated Recipe Result Graphic */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 flex flex-col items-center justify-center relative my-2 overflow-hidden bg-radial-gradient">
                <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-500 uppercase">
                  Prototype Output
                </div>

                {/* Render icon */}
                <div className="relative h-18 w-18 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full shadow-inner mb-4">
                  <span className="text-5xl drop-shadow-lg scale-115 rotate-45">
                    {craftCategory === 'weapon' ? baseTemplate.icon : activeArmorTemplate.icon}
                  </span>
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-15"
                    style={{ backgroundColor: selectedCatalyst.color }}
                  />
                </div>

                {/* Dynamic Name */}
                <div
                  className="text-center font-semibold text-xs tracking-wide px-3 uppercase text-shadow-glow"
                  style={{ color: selectedCatalyst.color }}
                >
                  {craftedName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-wider">
                  Custom {craftCategory === 'weapon' ? selectedBase : activeArmorTemplate.subType} Class
                </div>
              </div>

              {/* Performance Stat Preview */}
              <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 text-xs flex flex-col gap-2.5">
                <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 border-b border-slate-800 pb-1.5 flex justify-between">
                  <span>Attributes & Enhancements</span>
                  <span>Active Values</span>
                </div>
                {craftCategory === 'weapon' ? (
                  <>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Attack Damage</span>
                      <span className="font-mono text-white font-semibold flex items-center gap-1.5">
                        <span className="text-slate-400">{baseTemplate.baseDamage}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-red-400 font-bold">
                          {overforgeHeat > 0 ? (
                            <span>{finalDamage} ➔ <span className="text-amber-400 underline">{finalDamageOverforged}</span></span>
                          ) : (
                            finalDamage
                          )}
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Critical Hit Rate</span>
                      <span className="font-mono text-white font-semibold flex items-center gap-1.5">
                        <span className="text-slate-400">{(baseTemplate.baseCrit * 100).toFixed(0)}%</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-amber-400 font-bold">
                          {overforgeHeat > 0 ? (
                            <span>{(finalCrit * 100).toFixed(0)}% ➔ <span className="text-amber-300 underline">{(finalCritOverforged * 100).toFixed(0)}%</span></span>
                          ) : (
                            `${(finalCrit * 100).toFixed(0)}%`
                          )}
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Maximum Range</span>
                      <span className="font-mono text-white font-semibold">
                        {finalRange} {finalRange > 1 ? 'Tiles' : 'Tile'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Block Defense</span>
                    <span className="font-mono text-white font-semibold flex items-center gap-1.5">
                      <span className="text-slate-400">{activeArmorTemplate.baseDefense}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-blue-400 font-bold">
                        {overforgeHeat > 0 ? (
                          <span>+{finalDefense} ➔ <span className="text-amber-300 underline">+{finalDefenseOverforged} DEF</span></span>
                        ) : (
                          `+${finalDefense} DEF`
                        )}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-300">
                  <span>Catalyst Injection</span>
                  <span className="font-semibold text-[11px]" style={{ color: selectedCatalyst.color }}>
                    {selectedCatalyst.damageType} Infusion
                  </span>
                </div>

                {craftCategory === 'weapon' && isSpecialProperty && (
                  <div className="mt-1 bg-amber-500/5 border border-amber-500/20 rounded p-2 text-[10px] text-amber-400 leading-normal">
                    <span className="font-mono font-bold text-[9px]">CORE TRAIT: </span>
                    {selectedMaterial.extraProperty === 'CRIT_HEAVY' && 'Devastating critical strikes. Crits deal +150% extra damage instead of standard double.'}
                    {selectedMaterial.extraProperty === 'DRAGON_FORCE' && 'Flame burst. Crits ignite a small ring of nearby spaces.'}
                    {selectedMaterial.extraProperty === 'VAMPIRISM' && 'Siphoning blade. Heals 15% of your direct attacks physical damage.'}
                  </div>
                )}
              </div>

              {/* Over-Forging Heat Bellows & Risk Gauge */}
              {renderOverforgeGauge()}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {!isForgeAvailable && (
                <div className="bg-amber-950/60 border border-amber-500/50 text-amber-200 p-3 rounded-lg text-xs flex items-center gap-3 mb-1">
                  <span className="text-2xl shrink-0">⚒️</span>
                  <div>
                    <span className="font-bold text-amber-300 block">Blacksmith Anvil Required</span>
                    <span>Stand adjacent to a placed <strong>Portable Blacksmith Anvil (⚒️)</strong> or visit Town to forge new gear! Build an Anvil in the <em>Survival</em> tab or spawn one via Cheats.</span>
                  </div>
                </div>
              )}
              {!canCraft && isForgeAvailable && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded text-[11px] text-center mb-1 leading-normal">
                  You do not have all required components. Gather {materialCount === 0 ? selectedMaterial.name : ''} {materialCount === 0 && catalystCount === 0 ? 'and' : ''} {catalystCount === 0 ? selectedCatalyst.name : ''} in the overworld or dungeon cells.
                </div>
              )}

              <button
                id="craft-assemble-button"
                disabled={!canCraft}
                onClick={handleCraft}
                className={`w-full py-3.5 rounded-lg text-xs font-bold select-none flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                  canCraft
                    ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 hover:shadow-amber-500/10 cursor-pointer active:scale-[0.98]'
                    : 'bg-slate-900 text-slate-500 border-slate-800/80 cursor-not-allowed'
                }`}
              >
                <Hammer className="w-4 h-4 shrink-0" />
                <span>FORGE PACK INVENTORY ITEM</span>
              </button>

              <div className="text-[10px] text-center text-slate-500 mt-2 font-mono">
                Item will be forged directly into your <strong className="text-slate-400">Backpack Inventory</strong> bag!
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'survival' && (
        /* ==================== SURVIVAL CAMPING & TOOLS TAB ==================== */
        <div className="flex-1 overflow-y-auto p-5 space-y-6" id="survival_camping_tab">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-xl">⛺</span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Camp & Survival Tools Assembly</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Prepare structures, resource harvesting gear, and teleportation scrolls for the wilderness</p>
              </div>
            </div>

            {/* Informative tutorial panel */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 flex items-start gap-3">
              <Compass className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-[11px] leading-relaxed text-slate-300">
                <p>
                  <strong className="text-amber-400 font-sans">Tree Chopping Survival Guide:</strong> Stand next to any pine tree or lush vegetation <span className="text-emerald-400 font-bold">🌲</span> in the Overworld and walk into it to chop it down!
                </p>
                <p className="mt-1">
                  Chopping down a tree removes the tile and awards you <strong className="text-amber-400 font-mono">1x Scrap Wood</strong>.
                </p>
              </div>
            </div>

            {/* Grid of Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Assemble Campfire */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>🔥</span>
                    <span>Campfire Structure</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Deploys a permanent Campfire tile (🔥) adjacent to you. Used for resting and campfire gourmet cooking.</p>
                  
                  <div className="mb-4">
                    <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                    <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                      scrapWoodCount >= 3 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                    }`}>
                      <span>Scrap Wood ({scrapWoodCount}/3)</span>
                      {scrapWoodCount >= 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onPlaceCampfire}
                  disabled={scrapWoodCount < 3}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                    scrapWoodCount >= 3
                      ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 hover:shadow-amber-500/10 cursor-pointer active:scale-[0.98]'
                      : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                  }`}
                >
                  <Flame className="w-4 h-4 text-orange-950" />
                  <span>Build Campfire At Adjacent Field</span>
                </button>
              </div>

              {/* Card 1B: Portable Blacksmith Anvil */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>⚒️</span>
                    <span>Portable Blacksmith Anvil</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Deploys an Anvil tile (⚒️) adjacent to you. Allows forging, mutating, and upgrading gear anywhere in the field!</p>
                  
                  <div className="mb-4">
                    <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                        ironCount >= 5 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                      }`}>
                        <span>Tempered Iron ({ironCount}/5)</span>
                        {ironCount >= 5 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                      </span>
                      <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                        scrapWoodCount >= 2 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                      }`}>
                        <span>Scrap Wood ({scrapWoodCount}/2)</span>
                        {scrapWoodCount >= 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onPlaceAnvil}
                  disabled={ironCount < 5 || scrapWoodCount < 2}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                    ironCount >= 5 && scrapWoodCount >= 2
                      ? 'bg-slate-200 text-slate-950 border-white hover:bg-white hover:shadow-slate-400/20 cursor-pointer active:scale-[0.98]'
                      : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                  }`}
                >
                  <Hammer className="w-4 h-4 text-slate-950" />
                  <span>Build Anvil At Adjacent Field</span>
                </button>
              </div>

              {/* Card 2: Ancient Fishing Pole */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>🎣</span>
                    <span>Ancient Fishing Pole</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Enables fishing in rivers, ponds, and deep ocean shores to capture Raw Fish ingredients.</p>
                  
                  <div className="mb-4">
                    <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                    <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                      scrapWoodCount >= 3 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                    }`}>
                      <span>Scrap Wood ({scrapWoodCount}/3)</span>
                      {scrapWoodCount >= 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onCraftFishingPole}
                  disabled={scrapWoodCount < 3}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                    scrapWoodCount >= 3
                      ? 'bg-indigo-600 text-white border-indigo-505 hover:bg-indigo-500 hover:shadow-indigo-500/10 cursor-pointer active:scale-[0.98]'
                      : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                  }`}
                >
                  <span>Craft Ancient Fishing Pole</span>
                </button>
              </div>

              {/* Card 3: Tension Lockpicks */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>🔑</span>
                    <span>Tension Lockpicks (x3)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">High-tensile picks used to pick locked iron chests and dungeon grates discovered during exploration.</p>
                  
                  <div className="mb-4">
                    <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                    <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border w-max ${
                      ironCount >= 1 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                    }`}>
                      <span>Tempered Iron ({ironCount}/1)</span>
                      {ironCount >= 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onCraftLockpicks}
                  disabled={ironCount < 1}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                    ironCount >= 1
                      ? 'bg-amber-600 text-white border-amber-500 hover:bg-amber-500 hover:shadow-amber-500/10 cursor-pointer active:scale-[0.98]'
                      : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                  }`}
                >
                  <span>Craft Tension Lockpicks</span>
                </button>
              </div>

              {/* Card 3B: Lumberjack Hatchet */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>🪓</span>
                    <span>Lumberjack Hatchet</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Harvests wood and logs automatically from inventory or hand when chopping trees. Unrepairable.</p>
                  
                  <div className="mb-4">
                    <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border ${
                        scrapWoodCount >= 2 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                      }`}>
                        <span>Scrap Wood ({scrapWoodCount}/2)</span>
                        {scrapWoodCount >= 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                      </span>
                      <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border ${
                        ironCount >= 1 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                      }`}>
                        <span>Tempered Iron ({ironCount}/1)</span>
                        {ironCount >= 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onCraftHatchet}
                  disabled={scrapWoodCount < 2 || ironCount < 1}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                    scrapWoodCount >= 2 && ironCount >= 1
                      ? 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:shadow-slate-500/10 cursor-pointer active:scale-[0.98]'
                      : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                  }`}
                >
                  <span>Craft Lumberjack Hatchet</span>
                </button>
              </div>

              {/* Card 3C: Prospector Pickaxe */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>⛏️</span>
                    <span>Prospector Pickaxe</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Mines copper and iron ore veins automatically from inventory or hand when striking ore. Unrepairable.</p>
                  
                  <div className="mb-4">
                    <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border ${
                        scrapWoodCount >= 2 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                      }`}>
                        <span>Scrap Wood ({scrapWoodCount}/2)</span>
                        {scrapWoodCount >= 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                      </span>
                      <span className={`px-2 py-1 rounded text-xxs font-mono flex items-center space-x-1 border ${
                        ironCount >= 2 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                      }`}>
                        <span>Tempered Iron ({ironCount}/2)</span>
                        {ironCount >= 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onCraftPickaxe}
                  disabled={scrapWoodCount < 2 || ironCount < 2}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                    scrapWoodCount >= 2 && ironCount >= 2
                      ? 'bg-amber-600 text-white border-amber-500 hover:bg-amber-500 hover:shadow-amber-500/10 cursor-pointer active:scale-[0.98]'
                      : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                  }`}
                >
                  <span>Craft Prospector Pickaxe</span>
                </button>
              </div>

              {/* Card 4: Scroll of Recall */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>📜</span>
                    <span>Scroll of Recall</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Teleports you instantly back to Oakhaven Town Square from anywhere in the wilderness or dungeon floor.</p>
                  
                  <div className="mb-4">
                    <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Materials:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-xxs font-mono flex items-center space-x-1 border ${
                        dragonScaleCount >= 1 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                      }`}>
                        <span>Wyrmscale ({dragonScaleCount}/1)</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xxs font-mono flex items-center space-x-1 border ${
                        feyBoneCount >= 1 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                      }`}>
                        <span>Fey Bone ({feyBoneCount}/1)</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xxs font-mono flex items-center space-x-1 border ${
                        shadowCatalystCount >= 1 ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                      }`}>
                        <span>Echo Stone ({shadowCatalystCount}/1)</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onCraftRecallScroll}
                  disabled={dragonScaleCount < 1 || feyBoneCount < 1 || shadowCatalystCount < 1}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 ${
                    dragonScaleCount >= 1 && feyBoneCount >= 1 && shadowCatalystCount >= 1
                      ? 'bg-sky-500 text-slate-950 border-sky-400 hover:bg-sky-450 hover:shadow-sky-500/10 cursor-pointer active:scale-[0.98]'
                      : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                  }`}
                >
                  <span>Craft Scroll of Recall</span>
                </button>
              </div>

              {/* Dynamic Spell Scroll Cards */}
              {SPELL_SCROLLS.map((template) => {
                const hasMaterials = Object.entries(template.recipe.materials).every(
                  ([matId, req]) => (inventoryMaterials[matId] || 0) >= req.required
                );
                const hasCatalysts = Object.entries(template.recipe.catalysts).every(
                  ([catId, req]) => (inventoryCatalysts[catId] || 0) >= req.required
                );
                const canCraft = hasMaterials && hasCatalysts;
                const ownedCount = equipmentInventory?.filter(item => item.id.includes(template.id)).length || 0;

                return (
                  <div key={template.id} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <span>✨</span>
                        <span>{template.name}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Scribe a magic scroll to unleash powerful spell effects in battles.</p>
                      
                      <div className="mb-4">
                        <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Ingredients:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(template.recipe.materials).map(([matId, req]) => {
                            const owned = inventoryMaterials[matId] || 0;
                            return (
                              <span key={matId} className={`px-1.5 py-0.5 rounded text-xxs font-mono border ${
                                owned >= req.required ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                              }`}>
                                {req.name} ({owned}/{req.required})
                              </span>
                            );
                          })}
                          {Object.entries(template.recipe.catalysts).map(([catId, req]) => {
                            const owned = inventoryCatalysts[catId] || 0;
                            return (
                              <span key={catId} className={`px-1.5 py-0.5 rounded text-xxs font-mono border ${
                                owned >= req.required ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                              }`}>
                                {req.name} ({owned}/{req.required})
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onCraftSpellScroll?.(template.id)}
                      disabled={!canCraft}
                      className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 select-none cursor-pointer"
                      style={{
                        backgroundColor: canCraft ? `${template.color}15` : '#0f172a',
                        borderColor: canCraft ? template.color : '#1e293b',
                        color: canCraft ? template.color : '#64748b',
                      }}
                    >
                      <span>Scribe {template.name.replace("Scroll of ", "")}</span>
                    </button>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1.5 px-1 font-mono">
                      <span>Owned: x{ownedCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'mutation' && (
        /* ==================== MUTATION FORGE TAB ==================== */
        (() => {
          const mutatableItems = [
            ...(currentWeapon ? [{ id: 'current_weapon', name: currentWeapon.name, subType: currentWeapon.baseType, desc: `Base Dmg: ${currentWeapon.damage}, Range: ${currentWeapon.range}`, icon: '⚔️', isCurrent: true }] : []),
            ...equipmentInventory.filter(item => item.type !== 'scroll').map(item => ({
              id: item.id,
              name: item.name,
              subType: item.subType,
              desc: item.type === 'weapon' ? `Dmg: ${item.damage}, Crit: ${(item.critChance * 100).toFixed(0)}%` : `Def: ${item.defense}`,
              icon: item.subType === 'Shield' ? '🛡️' : item.type === 'weapon' ? '⚔️' : '👕',
              isCurrent: false
            }))
          ];

          const selectedItemObj = mutatableItems.find(item => item.id === selectedMutationItem) || mutatableItems[0];
          const selectedTargetEquipment = selectedItemObj?.id === 'current_weapon'
            ? currentWeapon
            : equipmentInventory.find(item => item.id === selectedItemObj?.id);

          const selectedMutMaterial = BASIC_MATERIALS.find(m => m.id === selectedMutationMaterialId) || BASIC_MATERIALS[0];
          const selectedMutCatalyst = ELEMENTAL_CATALYSTS.find(c => c.id === selectedMutationCatalystId) || ELEMENTAL_CATALYSTS[0];

          const mutMaterialQty = inventoryMaterials[selectedMutationMaterialId] || 0;
          const mutCatalystQty = inventoryCatalysts[selectedMutationCatalystId] || 0;
          const canMutate = Boolean(selectedItemObj && mutMaterialQty > 0 && mutCatalystQty > 0 && isForgeAvailable);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 flex-1 overflow-y-auto">
              {/* Column A: Select Item to Mutate */}
              <div className="lg:col-span-4 p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-400 font-mono font-bold font-sans">1</span>
                  <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Select Target Gear</h3>
                </div>

                {mutatableItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    <span className="text-4xl animate-bounce">📦</span>
                    <strong className="text-xs text-slate-300 mt-3 font-sans block">Zero Equipments Detected</strong>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      You need weapons, shields, armor, or helmets in your possession or actively forged to initiate chaos mutations!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 flex-1 max-h-[380px] overflow-y-auto pr-1">
                    {mutatableItems.map((item) => {
                      const isSelected = selectedMutationItem === item.id || (selectedMutationItem === 'current_weapon' && item.id === 'current_weapon');
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedMutationItem(item.id)}
                          className={`flex items-start gap-3 p-3 rounded-lg text-left border transition-all duration-150 ${
                            isSelected
                              ? 'bg-purple-950/25 border-purple-500/60 shadow-lg shadow-purple-950/20'
                              : 'bg-slate-950/40 border-slate-805 hover:border-slate-800 hover:bg-slate-950/70'
                          }`}
                        >
                          <span className="text-2xl mt-0.5">{item.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-slate-200">{item.name}</span>
                              {item.isCurrent && (
                                <span className="text-[8px] bg-red-950/50 text-red-400 font-mono font-bold px-1.5 py-0.5 rounded border border-red-900/30">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-purple-400 mt-1 uppercase tracking-tight">
                              Class: {String(item.subType)}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Column B: Fuel Selection */}
              <div className="lg:col-span-4 p-5 flex flex-col gap-5">
                {/* Catalyst fuel selection */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-400 font-mono font-bold">2</span>
                    <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Inject Chaos Catalyst</h3>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {ELEMENTAL_CATALYSTS.map((cat) => {
                      const isSelected = selectedMutationCatalystId === cat.id;
                      const count = inventoryCatalysts[cat.id] || 0;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedMutationCatalystId(cat.id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg text-left border text-xs transition-all ${
                            isSelected
                              ? 'bg-purple-900/10 border-purple-600/50'
                              : 'bg-slate-950/30 border-slate-800 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="inline-block text-base animate-pulse">🔮</span>
                            <div>
                              <div className="font-medium text-slate-300 text-xs">{cat.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono">Infusion: {cat.damageType}</div>
                            </div>
                          </div>
                          <span className={`font-mono text-xs font-bold ${count > 0 ? 'text-purple-400' : 'text-slate-500'}`}>
                            Qty: {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Material fuel selection */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-400 font-mono font-bold">3</span>
                    <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Inject Core Alloy</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {BASIC_MATERIALS.map((mat) => {
                      const isSelected = selectedMutationMaterialId === mat.id;
                      const count = inventoryMaterials[mat.id] || 0;
                      return (
                        <button
                          key={mat.id}
                          onClick={() => setSelectedMutationMaterialId(mat.id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg text-left border text-xs transition-all ${
                            isSelected
                              ? 'bg-pink-900/10 border-pink-600/50'
                              : 'bg-slate-950/30 border-slate-800 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full block mt-0.5 shrink-0" style={{ backgroundColor: mat.color }} />
                            <div className="font-medium text-slate-300 text-xs">{mat.name}</div>
                          </div>
                          <span className={`font-mono text-xs font-bold ${count > 0 ? 'text-pink-400' : 'text-slate-500'}`}>
                            Qty: {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Column C: Render Mutate Action */}
              <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-950/30">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-purple-950 pb-2">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                    <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Forge Projection</h3>
                  </div>

                  {selectedItemObj ? (
                    <div className="bg-slate-950/80 border border-purple-900/40 rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-radial-gradient opacity-10 animate-pulse" />
                      <div className="absolute top-2 right-2 text-[8px] font-mono text-purple-400 uppercase tracking-widest animate-pulse">
                        Chaos Grid Stable
                      </div>

                      <div className="relative h-14 w-14 flex items-center justify-center bg-slate-900 border border-purple-800/50 rounded-full shadow-inner mb-3">
                        <span className="text-3xl rotate-45 scale-110 drop-shadow-md animate-bounce" style={{ animationDuration: '3s' }}>
                          {selectedItemObj.icon}
                        </span>
                        <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-ping" />
                      </div>

                      <div className="text-center font-bold text-xs uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {selectedItemObj.name}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase">
                        Current level variables loaded
                      </div>

                      <div className="w-full h-px bg-purple-950/50 my-3" />

                      {/* Display prospective prefixes */}
                      <div className="w-full text-[10px] space-y-1 text-slate-400 font-mono">
                        <div className="flex justify-between">
                          <span>Injected Catalyst:</span>
                          <span className="text-purple-400 font-bold">{selectedMutCatalyst.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Injected Core:</span>
                          <span className="text-pink-400 font-bold">{selectedMutMaterial.name}</span>
                        </div>
                        <div className="flex justify-between border-t border-purple-950/40 pt-1.5 mt-1.5">
                          <span className="text-slate-300">Chaos Mult Factor:</span>
                          <span className="text-yellow-400 font-bold">0.85x to 1.55x</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 italic pt-1 text-center font-sans tracking-wide">
                          Provides prefix: "Void", "Volcan", or "Chaos"
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-6 rounded-lg text-center font-mono text-[10px] text-slate-500">
                      Load an item in Column 1 to compute projection vectors.
                    </div>
                  )}

                  <div className="bg-purple-950/10 border border-purple-900/30 p-2.5 rounded-lg text-[10px] text-slate-300 leading-normal flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">💡</span>
                    <span>
                      <strong>Forge Rule:</strong> Consumes 1 material & catalyst. Stats undergo chaotic realignment with high tier suffixes!
                    </span>
                  </div>

                  {/* Over-Forging Heat Gauge */}
                  {renderOverforgeGauge()}

                  {/* Unstable Mutation Synergy Panel */}
                  {selectedItemObj && (
                    <MutationSynergyPanel
                      existingCatalysts={selectedTargetEquipment?.synergyCatalysts || (selectedTargetEquipment?.color ? [selectedMutCatalyst.type] : [])}
                      selectedCatalystType={selectedMutCatalyst.type}
                      mutationCount={selectedTargetEquipment?.mutationCount || 0}
                      overforgeHeat={overforgeHeat}
                    />
                  )}
                </div>

                <div className="mt-3">
                  {!isForgeAvailable && (
                    <div className="bg-amber-950/60 border border-amber-500/50 text-amber-200 p-2.5 rounded text-[11px] flex items-center gap-2 mb-2">
                      <span className="text-xl shrink-0">⚒️</span>
                      <div>
                        <strong className="text-amber-300 block">Anvil Required:</strong>
                        <span>Stand adjacent to an Anvil (⚒️) or visit Town to trigger mutation chains!</span>
                      </div>
                    </div>
                  )}
                  {!canMutate && isForgeAvailable && selectedItemObj && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 text-[10px] text-center mb-2 rounded font-sans leading-normal">
                      ⚠️ Insufficient fuel to trigger mutation. Ensure you have 1x {selectedMutMaterial.name} and 1x {selectedMutCatalyst.name} inside your pack assets.
                    </div>
                  )}

                  <button
                    disabled={!canMutate || !onMutateItem}
                    onClick={() => {
                      if (canMutate && onMutateItem && selectedItemObj) {
                        onMutateItem(selectedItemObj.id, selectedMutationMaterialId, selectedMutationCatalystId, overforgeHeat);
                      }
                    }}
                    className={`w-full py-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg cursor-pointer transition-all active:scale-[0.98] ${
                      canMutate
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-purple-500 shadow-purple-950/40'
                        : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                    }`}
                  >
                    <Shuffle className="w-4 h-4 animate-spin text-purple-200" style={{ animationDuration: '6s' }} />
                    <span>MUTATE EQUIPMENT PROPERTIES</span>
                  </button>
                  <p className="text-[8px] text-zinc-500 font-mono text-center mt-1.5 uppercase tracking-wide">
                    Cosmic forge mutation is 100% permanent
                  </p>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {activeSubTab === 'upgrade' && (
        /* ==================== UPGRADE GEAR TAB ==================== */
        (() => {
          const upgradableItems = [
            ...(currentWeapon ? [{ id: 'current_weapon', name: currentWeapon.name, subType: currentWeapon.baseType, desc: `Base Dmg: ${currentWeapon.damage}, Crit: ${(currentWeapon.critChance * 100).toFixed(0)}%`, icon: '⚔️', type: 'weapon', upgradeLevel: currentWeapon.upgradeLevel ?? 0, rating: currentWeapon.damage }] : []),
            ...equipmentInventory.filter(item => item.type !== 'scroll').map(item => ({
              id: item.id,
              name: item.name,
              subType: item.subType,
              desc: item.type === 'weapon' ? `Dmg: ${item.damage}, Crit: ${(item.critChance * 100).toFixed(0)}%` : `Def: ${item.defense}`,
              icon: item.subType === 'Shield' ? '🛡️' : item.type === 'weapon' ? '⚔️' : '👕',
              type: item.type,
              upgradeLevel: item.upgradeLevel ?? 0,
              rating: item.type === 'weapon' ? item.damage : item.defense
            }))
          ];

          const selectedItemObj = upgradableItems.find(item => item.id === selectedUpgradeItem) || upgradableItems[0];
          const selectedUpgMaterial = BASIC_MATERIALS.find(m => m.id === selectedUpgradeMaterialId) || BASIC_MATERIALS[0];

          const upgMaterialQty = inventoryMaterials[selectedUpgradeMaterialId] || 0;
          const currentLvl = selectedItemObj ? (selectedItemObj.upgradeLevel ?? 0) : 0;
          const targetLvl = currentLvl + 1;
          const successRate = Math.max(0.4, 1.0 - (currentLvl * 0.15));

          const canUpgrade = Boolean(selectedItemObj && upgMaterialQty > 0 && isForgeAvailable);

          // Compute prospective upgrade stats
          let prospectiveDmgBonus = 0;
          let prospectiveDefBonus = 0;
          let prospectiveCritBonus = 0;
          let materialFeatureName = "None";
          let materialAbilityDesc = "";

          if (selectedItemObj) {
            const isWeapon = selectedItemObj.type === 'weapon';
            if (selectedUpgradeMaterialId === 'mat_iron') {
              prospectiveDmgBonus = isWeapon ? 2 : 0;
              prospectiveDefBonus = !isWeapon ? 1 : 0;
              materialFeatureName = "Tempered Guard";
              materialAbilityDesc = "Solid reliability. +5% block rate.";
            } else if (selectedUpgradeMaterialId === 'mat_mithril') {
              prospectiveDmgBonus = isWeapon ? 3 : 0;
              prospectiveDefBonus = !isWeapon ? 1 : 0;
              prospectiveCritBonus = 0.04;
              materialFeatureName = "Swift Strike / Nimble Step";
              materialAbilityDesc = "Featherlight. Higher critical rate & speed.";
            } else if (selectedUpgradeMaterialId === 'mat_obsidian') {
              prospectiveDmgBonus = isWeapon ? 5 : 0;
              prospectiveDefBonus = !isWeapon ? 2 : 0;
              materialFeatureName = "Retribution Spikes";
              materialAbilityDesc = "Glassy razor-sharp finish. Reflects 3 damage.";
            } else if (selectedUpgradeMaterialId === 'mat_dragonscale') {
              prospectiveDmgBonus = isWeapon ? 6 : 0;
              prospectiveDefBonus = !isWeapon ? 2 : 0;
              prospectiveCritBonus = 0.02;
              materialFeatureName = "Primal Fireburst";
              materialAbilityDesc = "Ignites enemies on critical physical strikes.";
            } else if (selectedUpgradeMaterialId === 'mat_feybone') {
              prospectiveDmgBonus = isWeapon ? 4 : 0;
              prospectiveDefBonus = !isWeapon ? 1 : 0;
              materialFeatureName = "Vampiric Siphon";
              materialAbilityDesc = "Life absorption. Drain 2 HP on landing physical hits.";
            }
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 flex-1 overflow-y-auto">
              {/* Column 1: Select Target Item */}
              <div className="lg:col-span-4 p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-teal-900/40 border border-teal-500/30 text-teal-400 font-mono font-bold">1</span>
                  <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Select Target Gear</h3>
                </div>

                {upgradableItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    <span className="text-4xl animate-bounce">📦</span>
                    <strong className="text-xs text-slate-300 mt-3 font-sans block">No Upgradable Equipment Found</strong>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Erect some weapons, shields, or armors in the Forge Equipment tab first to begin upgrading!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 flex-1 max-h-[380px] overflow-y-auto pr-1">
                    {upgradableItems.map((item) => {
                      const isSelected = selectedUpgradeItem === item.id || (selectedUpgradeItem === 'current_weapon' && item.id === 'current_weapon');
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedUpgradeItem(item.id)}
                          className={`flex items-start gap-3 p-3 rounded-lg text-left border transition-all duration-150 ${
                            isSelected
                              ? 'border-teal-500/60 bg-teal-950/20 shadow-lg shadow-teal-950/20'
                              : 'bg-slate-950/40 border-slate-805 hover:border-slate-800 hover:bg-slate-950/70'
                          }`}
                        >
                          <span className="text-2xl mt-0.5">{item.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-slate-200">{item.name}</span>
                              <span className="text-[9px] bg-slate-800 text-teal-400 font-mono font-bold px-1.5 py-0.5 rounded border border-teal-900/30">
                                +{item.upgradeLevel}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Column 2: Select Specific Upgrade Material */}
              <div className="lg:col-span-4 p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-teal-900/40 border border-teal-500/30 text-teal-400 font-mono font-bold">2</span>
                  <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Select Upgrading Material</h3>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  Each material imprints unique stat boosts, custom names, and a permanent passive ability!
                </p>

                <div className="grid grid-cols-1 gap-1.5 flex-1 max-h-[340px] overflow-y-auto pr-1">
                  {BASIC_MATERIALS.filter(m => ['mat_iron', 'mat_mithril', 'mat_obsidian', 'mat_dragonscale', 'mat_feybone'].includes(m.id)).map((mat) => {
                    const isSelected = selectedUpgradeMaterialId === mat.id;
                    const count = inventoryMaterials[mat.id] || 0;
                    return (
                      <button
                        key={mat.id}
                        onClick={() => setSelectedUpgradeMaterialId(mat.id)}
                        className={`flex items-start justify-between p-2.5 rounded-lg text-left border text-xs transition-all ${
                          isSelected
                            ? 'bg-teal-950/15 border-teal-500/60'
                            : 'bg-slate-950/30 border-slate-800 hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full block mt-1.5 shrink-0" style={{ backgroundColor: mat.color }} />
                          <div>
                            <div className="font-semibold text-slate-200 text-xs">{mat.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{mat.description}</div>
                            <div className="text-[9px] mt-1 font-bold text-teal-400 font-mono uppercase">
                              {mat.id === 'mat_iron' && "Standard Physical Reinforce"}
                              {mat.id === 'mat_mithril' && "Swift strike & critical scaling"}
                              {mat.id === 'mat_obsidian' && "Heavy blow & razor retribution"}
                              {mat.id === 'mat_dragonscale' && "Primal thermal burst strike"}
                              {mat.id === 'mat_feybone' && "Vampiric health lifesteal"}
                            </div>
                          </div>
                        </div>
                        <span className={`font-mono text-xs font-bold pl-2 shrink-0 ${count > 0 ? 'text-teal-400' : 'text-rose-500'}`}>
                          x{count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: Stats Forecast and Assembly */}
              <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-950/30">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-teal-950 pb-2">
                    <Sparkles className="w-4 h-4 text-teal-400 animate-spin" style={{ animationDuration: '4s' }} />
                    <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Upgrade Forecast</h3>
                  </div>

                  {selectedItemObj ? (
                    <div className="bg-slate-950/95 border border-teal-900/40 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute top-2 right-2 text-[8px] font-mono text-teal-400 uppercase tracking-widest animate-pulse">
                        Forecast Stable
                      </div>

                      <div className="relative h-12 w-12 flex items-center justify-center bg-slate-900 border border-teal-800/50 rounded-full mb-2">
                        <span className="text-2xl rotate-45 scale-110 drop-shadow-md animate-bounce" style={{ animationDuration: '4s' }}>
                          {selectedItemObj.icon}
                        </span>
                      </div>

                      <div className="text-center font-bold text-xs uppercase text-slate-200">
                        {selectedItemObj.name.replace(/\s\+\d+$/, "")} +{targetLvl}
                      </div>
                      <div className="text-[9px] text-teal-400 font-mono mt-0.5">
                        Upgrade Quality: Level T{targetLvl}
                      </div>

                      <div className="w-full h-px bg-teal-950/50 my-2" />

                      {/* Stat comparisons */}
                      <div className="w-full text-[10.5px] space-y-1.5 text-slate-300 font-mono">
                        <div className="flex justify-between items-center">
                          <span>Success Probability:</span>
                          <span className="text-teal-400 font-bold bg-teal-950/50 border border-teal-900/40 px-1 py-0.5 rounded">{(successRate * 100).toFixed(0)}% Success Rate</span>
                        </div>
                        
                        {selectedItemObj.type === 'weapon' ? (
                          <>
                            <div className="flex justify-between items-center border-t border-slate-900 pt-1.5 mt-1.5">
                              <span>Damage Modifier:</span>
                              <span className="flex items-center gap-1 font-bold">
                                <span>{selectedItemObj.rating}</span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                                <span className="text-emerald-400">+{prospectiveDmgBonus}</span>
                              </span>
                            </div>
                            {prospectiveCritBonus > 0 && (
                              <div className="flex justify-between items-center">
                                <span>Crit Rate Chance:</span>
                                <span className="text-emerald-400 font-bold">+{prospectiveCritBonus * 100}%</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex justify-between items-center border-t border-slate-900 pt-1.5 mt-1.5">
                            <span>Defense Armor Modifier:</span>
                            <span className="flex items-center gap-1 font-bold">
                              <span>{selectedItemObj.rating}</span>
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                              <span className="text-blue-400">+{prospectiveDefBonus}</span>
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between border-t border-slate-900 pt-1.5 mt-1.5">
                          <span>Upgrade Material:</span>
                          <span className="font-bold text-white" style={{ color: selectedUpgMaterial.color }}>{selectedUpgMaterial.name}</span>
                        </div>

                        {/* Passive ability unlock preview */}
                        <div className="bg-teal-950/20 border border-teal-900/30 rounded p-2 text-[9.5px] text-slate-300 font-sans mt-2">
                          <span className="font-mono text-teal-400 font-bold">✨ GRANTS PASSIVE ABILITY:</span>
                          <div className="font-bold text-white mt-0.5">{materialFeatureName}</div>
                          <p className="text-slate-400 text-[9px] leading-normal">{materialAbilityDesc}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-6 rounded-lg text-center font-mono text-[10px] text-slate-500">
                      Load an item in Column 1 to compute projection vectors.
                    </div>
                  )}

                  <div className="bg-teal-950/15 border border-teal-900/30 p-2.5 rounded-lg text-[9.5px] text-slate-300 leading-normal flex items-start gap-1.5">
                    <span className="text-teal-400 mt-0.5">💡</span>
                    <span>
                      <strong>Safe Upgrading:</strong> Consumes 1x material. On failure, material is lost but <strong>the item is NEVER destroyed or degraded</strong>. High level heat increases failure risk and anvil backfire damage, but grants huge stat bonuses!
                    </span>
                  </div>

                  {/* Over-Forging Heat Gauge */}
                  {renderOverforgeGauge()}
                </div>

                <div className="mt-3">
                  {!isForgeAvailable && (
                    <div className="bg-amber-950/60 border border-amber-500/50 text-amber-200 p-2.5 rounded text-[11px] flex items-center gap-2 mb-2">
                      <span className="text-xl shrink-0">⚒️</span>
                      <div>
                        <strong className="text-amber-300 block">Anvil Required:</strong>
                        <span>Stand adjacent to an Anvil (⚒️) or visit Town to upgrade gear!</span>
                      </div>
                    </div>
                  )}
                  {!canUpgrade && isForgeAvailable && selectedItemObj && (
                    <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 p-2 text-[10px] text-center mb-2 rounded font-sans leading-normal">
                      ⚠️ Insufficient material stock inside your pack to initiate upgrade. Gather more {selectedUpgMaterial.name} from resource veins in the overworld or dungeons!
                    </div>
                  )}

                  <button
                    disabled={!canUpgrade || !onUpgradeItem}
                    onClick={() => {
                      if (canUpgrade && onUpgradeItem && selectedItemObj) {
                        onUpgradeItem(selectedItemObj.id, selectedUpgradeMaterialId, overforgeHeat);
                      }
                    }}
                    className={`w-full py-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg cursor-pointer transition-all active:scale-[0.98] ${
                      canUpgrade
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 border-teal-400 font-black shadow-emerald-950/40'
                        : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                    }`}
                  >
                    <Hammer className="w-4 h-4 animate-bounce text-slate-950" />
                    <span>INITIATE EQUIPMENT UPGRADE (+{targetLvl})</span>
                  </button>
                  <p className="text-[8px] text-zinc-500 font-mono text-center mt-1.5 uppercase tracking-wide">
                    Upgrading consumes 1x chosen material
                  </p>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {activeSubTab === 'cooking' && (
        <CookingTab
          isNextToCampfire={isNextToCampfire}
          onRestCampfire={onRestCampfire}
          getMaterialCount={getMaterialCount}
          getCatalystCount={getCatalystCount}
          hasIngredients={hasIngredients}
          handleCook={handleCook}
        />
      )}

      {activeSubTab === 'brewing' && (
        <AlchemyTab
          labTier={labTier}
          nextUpgradeCost={nextUpgradeCost}
          playerGold={gameState?.playerStats?.gold || 0}
          handleUpgradeLab={handleUpgradeLab}
          getMaterialCount={getMaterialCount}
          getCatalystCount={getCatalystCount}
          hasIngredients={hasIngredients}
          handleBrew={handleBrew}
        />
      )}
    </div>
  );
}

export const CraftingPanel = React.memo(CraftingPanelComponent);
export default CraftingPanel;
