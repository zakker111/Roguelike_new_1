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
import { CampAndToolsTab } from './crafting/CampAndToolsTab';
import { ScrollScriptoriumTab } from './crafting/ScrollScriptoriumTab';
import { WeaponForgingTab } from './crafting/WeaponForgingTab';
import { MutationCatalystTab } from './crafting/MutationCatalystTab';
import { GearUpgradeTab } from './crafting/GearUpgradeTab';

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
  const metalKeys = ['mat_iron', 'mat_iron_ore', 'mat_steel', 'mat_royal_iron', 'mat_copper_ore', 'mat_mithril', 'mat_obsidian'];
  const ironCount = metalKeys.reduce((sum, k) => sum + (inventoryMaterials[k] || 0), 0);
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
        <WeaponForgingTab
          craftCategory={craftCategory}
          setCraftCategory={setCraftCategory}
          selectedBase={selectedBase}
          setSelectedBase={setSelectedBase}
          selectedArmorSubType={selectedArmorSubType}
          setSelectedArmorSubType={setSelectedArmorSubType}
          blacksmithForgeLevel={blacksmithForgeLevel}
          armorTemplates={ARMOR_TEMPLATES}
          selectedMaterialId={selectedMaterialId}
          setSelectedMaterialId={setSelectedMaterialId}
          inventoryMaterials={inventoryMaterials}
          selectedCatalystId={selectedCatalystId}
          setSelectedCatalystId={setSelectedCatalystId}
          inventoryCatalysts={inventoryCatalysts}
          baseTemplate={baseTemplate}
          activeArmorTemplate={activeArmorTemplate}
          selectedCatalyst={selectedCatalyst}
          craftedName={craftedName}
          selectedMaterial={selectedMaterial}
          overforgeHeat={overforgeHeat}
          finalDamage={finalDamage}
          finalDamageOverforged={finalDamageOverforged}
          finalCrit={finalCrit}
          finalCritOverforged={finalCritOverforged}
          finalRange={finalRange}
          finalDefense={finalDefense}
          finalDefenseOverforged={finalDefenseOverforged}
          isSpecialProperty={isSpecialProperty}
          renderOverforgeGauge={renderOverforgeGauge}
          isForgeAvailable={isForgeAvailable}
          canCraft={canCraft}
          materialCount={materialCount}
          catalystCount={catalystCount}
          handleCraft={handleCraft}
        />
      )}

      {activeSubTab === 'survival' && (
        <CampAndToolsTab
          scrapWoodCount={scrapWoodCount}
          ironCount={ironCount}
          dragonScaleCount={dragonScaleCount}
          feyBoneCount={feyBoneCount}
          shadowCatalystCount={shadowCatalystCount}
          onPlaceCampfire={onPlaceCampfire}
          onPlaceAnvil={onPlaceAnvil}
          onCraftFishingPole={onCraftFishingPole}
          onCraftLockpicks={onCraftLockpicks}
          onCraftHatchet={onCraftHatchet}
          onCraftPickaxe={onCraftPickaxe}
          onCraftRecallScroll={onCraftRecallScroll}
        />
      )}

      {activeSubTab === 'mutation' && (
        <MutationCatalystTab
          currentWeapon={currentWeapon}
          equipmentInventory={equipmentInventory}
          selectedMutationItem={selectedMutationItem}
          setSelectedMutationItem={setSelectedMutationItem}
          selectedMutationMaterialId={selectedMutationMaterialId}
          setSelectedMutationMaterialId={setSelectedMutationMaterialId}
          selectedMutationCatalystId={selectedMutationCatalystId}
          setSelectedMutationCatalystId={setSelectedMutationCatalystId}
          inventoryMaterials={inventoryMaterials}
          inventoryCatalysts={inventoryCatalysts}
          isForgeAvailable={isForgeAvailable}
          overforgeHeat={overforgeHeat}
          renderOverforgeGauge={renderOverforgeGauge}
          onMutateItem={onMutateItem}
        />
      )}

      {activeSubTab === 'upgrade' && (
        <GearUpgradeTab
          currentWeapon={currentWeapon}
          equipmentInventory={equipmentInventory}
          selectedUpgradeItem={selectedUpgradeItem}
          setSelectedUpgradeItem={setSelectedUpgradeItem}
          selectedUpgradeMaterialId={selectedUpgradeMaterialId}
          setSelectedUpgradeMaterialId={setSelectedUpgradeMaterialId}
          inventoryMaterials={inventoryMaterials}
          isForgeAvailable={isForgeAvailable}
          overforgeHeat={overforgeHeat}
          renderOverforgeGauge={renderOverforgeGauge}
          onUpgradeItem={onUpgradeItem}
        />
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
