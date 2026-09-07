/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WeaponBaseType, CraftedWeapon, EquipmentItem, GameState } from '../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS, WEAPON_TEMPLATES } from '../utils/itemsData';
import { OverforgeGauge } from './OverforgeGauge';
import { CookingTab } from './crafting/CookingTab';
import { AlchemyTab } from './crafting/AlchemyTab';
import { CampAndToolsTab } from './crafting/CampAndToolsTab';
import { ScrollScriptoriumTab } from './crafting/ScrollScriptoriumTab';
import { WeaponForgingTab } from './crafting/WeaponForgingTab';
import { MutationCatalystTab } from './crafting/MutationCatalystTab';
import { GearUpgradeTab } from './crafting/GearUpgradeTab';
import { CraftingHeader, CraftingSubTab } from './crafting/CraftingHeader';

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
  onPlaceBedroll?: () => void;
  onPlaceFieldTent?: () => void;
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
  onTriggerScriptorium?: (scrollTemplateId: string) => void;
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
  onPlaceBedroll,
  onPlaceFieldTent,
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
  onTriggerScriptorium,
  gameState,
  onCookRecipe,
  onBrewPotion,
  onUpgradeApothecary,
}: CraftingPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<CraftingSubTab>('weapons');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Wood & Metal counts
  const woodKeys = ['mat_wood', 'mat_pine_log', 'mat_birch_log', 'mat_ship_pitch'];
  const scrapWoodCount = woodKeys.reduce((sum, k) => sum + (inventoryMaterials[k] || 0), 0);
  const metalKeys = ['mat_iron', 'mat_iron_ore', 'mat_steel', 'mat_royal_iron', 'mat_copper_ore', 'mat_mithril', 'mat_obsidian'];
  const ironCount = metalKeys.reduce((sum, k) => sum + (inventoryMaterials[k] || 0), 0);

  const dragonScaleCount = inventoryMaterials['mat_dragonscale'] || 0;
  const feyBoneCount = inventoryMaterials['mat_feybone'] || 0;
  const shadowCatalystCount = inventoryCatalysts['cat_shadow'] || 0;

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

  const handleCook = (
    recipe: any
  ) => {
    if (onCookRecipe && recipe) {
      onCookRecipe(
        recipe.id,
        recipe.restoringHp || 0,
        recipe.restoringMp || 0,
        recipe.buff || null,
        recipe.costMaterials || {},
        recipe.costCatalysts || {},
        `Cooked ${recipe.name}! (+${recipe.restoringHp || 0} HP, +${recipe.restoringMp || 0} MP)`
      );
    }
  };

  const handleBrew = (
    recipe: any
  ) => {
    if (onBrewPotion && recipe) {
      onBrewPotion(
        recipe.id,
        recipe.restoringHp || 0,
        recipe.restoringMp || 0,
        recipe.permanentStats || {},
        recipe.costMaterials || {},
        recipe.costCatalysts || {},
        `Brewed ${recipe.name}!`
      );
    }
  };

  const nextUpgradeCost = labTier === 1 ? 150 : labTier === 2 ? 350 : 800;
  const handleUpgradeLab = () => {
    if (onUpgradeApothecary) {
      onUpgradeApothecary();
    }
  };

  const baseTemplate = (WEAPON_TEMPLATES as any)[selectedBase];
  const activeArmorTemplate = ARMOR_TEMPLATES.find((a) => a.subType === selectedArmorSubType) || ARMOR_TEMPLATES[0];

  const materialCount = inventoryMaterials[selectedMaterialId] || 0;
  const catalystCount = inventoryCatalysts[selectedCatalystId] || 0;
  const isForgeAvailable = isNextToAnvil;
  const canCraft = materialCount > 0 && catalystCount > 0 && isForgeAvailable;

  const baseDamage = baseTemplate?.baseDamage || (baseTemplate as any)?.damage || 5;
  const matDmgMult = (selectedMaterial as any).damageMultiplier ?? (selectedMaterial as any).baseDamageMod ?? 1.0;
  const catDmgBonus = (selectedCatalyst as any).damageBonus ?? 2;
  const finalDamage = Math.round(baseDamage * matDmgMult + catDmgBonus);
  const matCritBonus = (selectedMaterial as any).critBonus ?? (selectedMaterial as any).critMod ?? 0.05;
  const finalCrit = (baseTemplate?.baseCrit || (baseTemplate as any)?.critChance || 0.05) + matCritBonus;
  const finalRange = baseTemplate?.range || 1;

  const baseDef = activeArmorTemplate?.baseDefense || 3;
  const matDefMult = (selectedMaterial as any).defenseMultiplier ?? (selectedMaterial as any).baseDamageMod ?? 1.0;
  const finalDefense = Math.round(baseDef * matDefMult);

  // Overforging stat multipliers
  const heatMultiplier = 1 + (overforgeHeat / 100) * 0.5;
  const finalDamageOverforged = Math.round(finalDamage * heatMultiplier);
  const finalCritOverforged = Math.min(1.0, finalCrit + (overforgeHeat / 100) * 0.15);
  const finalDefenseOverforged = Math.round(finalDefense * heatMultiplier);

  const craftedName =
    craftCategory === 'weapon'
      ? `${selectedCatalyst.name.replace(' Catalyst', '')} ${selectedMaterial.name.replace(' Ingot', '').replace(' Log', '')} ${baseTemplate?.name || 'Weapon'}`
      : `${selectedCatalyst.name.replace(' Catalyst', '')} ${selectedMaterial.name.replace(' Ingot', '').replace(' Log', '')} ${activeArmorTemplate?.name || 'Armor'}`;

  const isSpecialProperty =
    selectedMaterial.id === 'mat_mithril' && selectedCatalyst.id === 'cat_lightning'
      ? 'Static Shock'
      : selectedMaterial.id === 'mat_obsidian' && selectedCatalyst.id === 'cat_fire'
        ? 'Magma Burst'
        : selectedMaterial.id === 'mat_dragonscale' && selectedCatalyst.id === 'cat_void'
          ? 'Abyssal Maw'
          : null;

  const handleCraft = () => {
    if (canCraft) {
      onCraftWeapon(selectedBase, selectedMaterialId, selectedCatalystId, craftCategory, selectedArmorSubType, overforgeHeat);
    }
  };

  const renderOverforgeGauge = () => (
    <OverforgeGauge
      overforgeHeat={overforgeHeat}
      heat={overforgeHeat}
      setOverforgeHeat={setOverforgeHeat}
      setHeat={setOverforgeHeat}
      overforgePowerMult={heatMultiplier}
      shatterChancePercent={Math.round((overforgeHeat / 100) * 65)}
      backfireDmgPreview={Math.floor((overforgeHeat / 100) * 15)}
      isAvailable={isForgeAvailable}
    />
  );

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full text-slate-100 min-h-[520px]">
      {/* Universal Themed Crafting Header with integrated search and subtab switcher */}
      <CraftingHeader
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        blacksmithForgeLevel={blacksmithForgeLevel}
        apothecaryTier={labTier}
        isNextToCampfire={isNextToCampfire}
        isNextToAnvil={isNextToAnvil}
      />

      {/* Subtab Content Viewports */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
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
            onPlaceBedroll={onPlaceBedroll}
            onPlaceFieldTent={onPlaceFieldTent}
            onCraftFishingPole={onCraftFishingPole}
            onCraftLockpicks={onCraftLockpicks}
            onCraftHatchet={onCraftHatchet}
            onCraftPickaxe={onCraftPickaxe}
            onCraftRecallScroll={onCraftRecallScroll}
            searchQuery={searchQuery}
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
            onCookMeat={onCookMeat}
            onCookPrimeMeat={onCookPrimeMeat}
            onCookFish={onCookFish}
            searchQuery={searchQuery}
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
            searchQuery={searchQuery}
          />
        )}

        {activeSubTab === 'scriptorium' && (
          <ScrollScriptoriumTab
            inventoryMaterials={inventoryMaterials}
            inventoryCatalysts={inventoryCatalysts}
            onCraftSpellScroll={onCraftSpellScroll}
            onCraftRecallScroll={onCraftRecallScroll}
            onTriggerScriptorium={onTriggerScriptorium}
            searchQuery={searchQuery}
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
            searchQuery={searchQuery}
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
            searchQuery={searchQuery}
          />
        )}
      </div>
    </div>
  );
}

export const CraftingPanel = React.memo(CraftingPanelComponent);
export default CraftingPanel;
