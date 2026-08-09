/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WeaponBaseType, ArmorSubType, Material, Catalyst } from '../../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS, WEAPON_TEMPLATES } from '../../data/items';
import { Hammer, Sparkles, ArrowRight, Flame } from 'lucide-react';

export interface ArmorTemplateItem {
  name: string;
  subType: ArmorSubType;
  baseDefense: number;
  icon: string;
  description: string;
}

export interface WeaponForgingTabProps {
  craftCategory: 'weapon' | 'armor';
  setCraftCategory: (cat: 'weapon' | 'armor') => void;
  selectedBase: WeaponBaseType;
  setSelectedBase: (base: WeaponBaseType) => void;
  selectedArmorSubType: ArmorSubType;
  setSelectedArmorSubType: (subType: ArmorSubType) => void;
  blacksmithForgeLevel: number;
  armorTemplates: ArmorTemplateItem[];
  selectedMaterialId: string;
  setSelectedMaterialId: (id: string) => void;
  inventoryMaterials: { [key: string]: number };
  selectedCatalystId: string;
  setSelectedCatalystId: (id: string) => void;
  inventoryCatalysts: { [key: string]: number };
  baseTemplate: any;
  activeArmorTemplate: ArmorTemplateItem;
  selectedCatalyst: Catalyst;
  craftedName: string;
  selectedMaterial: Material;
  overforgeHeat: number;
  finalDamage: number;
  finalDamageOverforged: number;
  finalCrit: number;
  finalCritOverforged: number;
  finalRange: number;
  finalDefense: number;
  finalDefenseOverforged: number;
  isSpecialProperty: boolean;
  renderOverforgeGauge: () => React.ReactNode;
  isForgeAvailable: boolean;
  canCraft: boolean;
  materialCount: number;
  catalystCount: number;
  handleCraft: () => void;
}

export const WeaponForgingTab: React.FC<WeaponForgingTabProps> = ({
  craftCategory,
  setCraftCategory,
  selectedBase,
  setSelectedBase,
  selectedArmorSubType,
  setSelectedArmorSubType,
  blacksmithForgeLevel,
  armorTemplates,
  selectedMaterialId,
  setSelectedMaterialId,
  inventoryMaterials,
  selectedCatalystId,
  setSelectedCatalystId,
  inventoryCatalysts,
  baseTemplate,
  activeArmorTemplate,
  selectedCatalyst,
  craftedName,
  selectedMaterial,
  overforgeHeat,
  finalDamage,
  finalDamageOverforged,
  finalCrit,
  finalCritOverforged,
  finalRange,
  finalDefense,
  finalDefenseOverforged,
  isSpecialProperty,
  renderOverforgeGauge,
  isForgeAvailable,
  canCraft,
  materialCount,
  catalystCount,
  handleCraft,
}) => {
  return (
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
            {armorTemplates.map((tmpl) => {
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
              <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Affix Core Material</h3>
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
              <h3 className="text-xs font-bold tracking-wide font-sans text-slate-200 uppercase">Fuse Catalyst Crystal</h3>
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
                {craftCategory === 'weapon' ? (baseTemplate?.icon || '⚔️') : (activeArmorTemplate?.icon || '🛡️')}
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
  );
};
