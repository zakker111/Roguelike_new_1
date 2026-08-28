/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WeaponBaseType, ArmorSubType, Material, Catalyst } from '../../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS, WEAPON_TEMPLATES } from '../../data/items';
import { Hammer, Sparkles, ArrowRight, Flame, Shield, Swords, Lock } from 'lucide-react';

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
  selectedArmorSubType: any;
  setSelectedArmorSubType: (subType: any) => void;
  blacksmithForgeLevel: number;
  armorTemplates: any[];
  selectedMaterialId: string;
  setSelectedMaterialId: (id: string) => void;
  inventoryMaterials: { [key: string]: number };
  selectedCatalystId: string;
  setSelectedCatalystId: (id: string) => void;
  inventoryCatalysts: { [key: string]: number };
  baseTemplate: any;
  activeArmorTemplate: any;
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
  isSpecialProperty: any;
  renderOverforgeGauge: () => React.ReactNode;
  isForgeAvailable: boolean;
  canCraft: boolean;
  materialCount: number;
  catalystCount: number;
  handleCraft: () => void;
  searchQuery?: string;
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
  searchQuery = '',
}) => {
  const filteredWeaponTemplates = Object.values(WEAPON_TEMPLATES).filter((tmpl) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return tmpl.baseType.toLowerCase().includes(q) || tmpl.description.toLowerCase().includes(q);
  });

  const filteredArmorTemplates = armorTemplates.filter((tmpl) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return tmpl.name.toLowerCase().includes(q) || tmpl.description.toLowerCase().includes(q) || tmpl.subType.toLowerCase().includes(q);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 flex-1 overflow-y-auto">
      {/* Step 1: Base Equipment Archetype (lg:col-span-4) */}
      <div className="lg:col-span-4 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-black border border-amber-500/30">1</span>
            <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Select Gear Blueprint</h3>
          </div>

          {/* Weapon vs Armor selection button */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
            <button
              onClick={() => setCraftCategory('weapon')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                craftCategory === 'weapon'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="w-3 h-3" />
              <span>Weapons</span>
            </button>
            <button
              onClick={() => setCraftCategory('armor')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                craftCategory === 'armor'
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Armors</span>
            </button>
          </div>
        </div>

        {craftCategory === 'weapon' ? (
          <div className="grid grid-cols-1 gap-2.5 flex-1 max-h-[520px] overflow-y-auto pr-1">
            {filteredWeaponTemplates.map((tmpl) => {
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
                  className={`flex items-start gap-3 p-3.5 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                    isLocked
                      ? 'bg-slate-950/40 border-slate-900 opacity-40 cursor-not-allowed'
                      : isSelected
                        ? 'bg-amber-950/25 border-amber-500/60 shadow-lg shadow-amber-950/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
                    {tmpl.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{tmpl.baseType}</span>
                      {isLocked ? (
                        <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/40 border border-rose-900/35 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Forge T{reqLevel}
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-mono text-slate-400">Range: {tmpl.range}</span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-normal mt-1">{tmpl.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
                      <span className="text-amber-400 font-bold">Dmg: {tmpl.baseDamage}</span>
                      <span className="text-emerald-400 font-bold">Crit: {(tmpl.baseCrit * 100).toFixed(0)}%</span>
                      {tmpl.manaCost > 0 && <span className="text-sky-400 font-bold">MP Cost: {tmpl.manaCost}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 flex-1 max-h-[520px] overflow-y-auto pr-1">
            {filteredArmorTemplates.map((tmpl) => {
              const isSelected = selectedArmorSubType === tmpl.subType;
              return (
                <button
                  key={tmpl.subType}
                  id={`craft-armor-${tmpl.subType}`}
                  onClick={() => setSelectedArmorSubType(tmpl.subType)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-950/25 border-sky-500/60 shadow-lg shadow-sky-950/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
                    {tmpl.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{tmpl.name}</span>
                      <span className="text-[9.5px] font-mono bg-sky-950/50 text-sky-400 border border-sky-500/30 font-bold px-2 py-0.5 rounded-full">
                        {tmpl.subType.replace('Heavy', 'Heavy ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-normal mt-1">{tmpl.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-sky-400 font-bold">
                      <span>Base Armor: +{tmpl.baseDefense} DEF</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2: Alloys & Catalysts (lg:col-span-4) */}
      <div className="lg:col-span-4 p-5 flex flex-col gap-5">
        {/* Metal Alloy */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-black border border-amber-500/30">2</span>
              <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Affix Ingot Material</h3>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {BASIC_MATERIALS.map((mat) => {
              const isSelected = selectedMaterialId === mat.id;
              const qty = inventoryMaterials[mat.id] || 0;
              return (
                <button
                  key={mat.id}
                  id={`craft-mat-${mat.id}`}
                  onClick={() => setSelectedMaterialId(mat.id)}
                  className={`flex items-start justify-between p-3 rounded-2xl text-left border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-500/60 shadow-md shadow-amber-950/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="inline-block w-3 h-3 rounded-full mt-0.5 shrink-0 shadow-sm"
                      style={{ backgroundColor: mat.color }}
                    />
                    <div>
                      <div className="font-bold text-slate-200 text-xs">{mat.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{mat.description}</div>
                      <div className="flex gap-2.5 mt-1.5 text-[9.5px] font-mono">
                        {craftCategory === 'weapon' ? (
                          <>
                            <span className="text-emerald-400 font-bold">Dmg Mod +{mat.baseDamageMod}</span>
                            <span className="text-sky-400 font-bold">Crit +{(mat.critMod * 100).toFixed(0)}%</span>
                          </>
                        ) : (
                          <span className="text-sky-400 font-bold">Armoring Def Bonus +{mat.id === 'mat_iron' ? '1' : (mat.id === 'mat_mithril' || mat.id === 'mat_obsidian') ? '2' : '3'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <span className={`font-mono font-bold text-[10.5px] px-2 py-0.5 rounded-full border ${
                      qty > 0 ? 'bg-slate-900 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                    }`}>
                      Stock: {qty}
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
              <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-purple-500/20 text-purple-400 font-mono font-black border border-purple-500/30">3</span>
              <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Fuse Catalyst Crystal</h3>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {ELEMENTAL_CATALYSTS.map((cat) => {
              const isSelected = selectedCatalystId === cat.id;
              const qty = inventoryCatalysts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  id={`craft-cat-${cat.id}`}
                  onClick={() => setSelectedCatalystId(cat.id)}
                  className={`flex items-start justify-between p-3 rounded-2xl text-left border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/20 border-purple-500/60 shadow-md shadow-purple-950/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Flame className="w-4 h-4 mt-0.5 shrink-0" style={{ color: cat.color }} />
                    <div>
                      <div className="font-bold text-slate-200 text-xs">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{cat.description}</div>
                      <div className="flex gap-2.5 mt-1.5 text-[9.5px] font-mono">
                        <span style={{ color: cat.color }} className="font-bold">Infusion: {cat.damageType}</span>
                        <span className="text-slate-400">Trigger: {(cat.statusEffectChance * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <span className={`font-mono font-bold text-[10.5px] px-2 py-0.5 rounded-full border ${
                      qty > 0 ? 'bg-slate-900 border-purple-500/30 text-purple-300' : 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                    }`}>
                      Stock: {qty}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step 3: Forge Output (lg:col-span-4) */}
      <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-950/40">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Forged Blueprint Preview</h3>
          </div>

          {/* Result Graphic */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative my-1 overflow-hidden shadow-xl">
            <div className="absolute top-2.5 right-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              PROTOTYPE PREVIEW
            </div>

            {/* Render icon */}
            <div className="relative h-18 w-18 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl shadow-inner mb-3">
              <span className="text-5xl drop-shadow-lg scale-110">
                {craftCategory === 'weapon' ? (baseTemplate?.icon || '⚔️') : (activeArmorTemplate?.icon || '🛡️')}
              </span>
              <div
                className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                style={{ backgroundColor: selectedCatalyst.color }}
              />
            </div>

            {/* Dynamic Name */}
            <div
              className="text-center font-black text-sm tracking-wide px-3 uppercase text-shadow-glow"
              style={{ color: selectedCatalyst.color }}
            >
              {craftedName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-wider">
              Custom {craftCategory === 'weapon' ? selectedBase : activeArmorTemplate.subType} Class
            </div>
          </div>

          {/* Performance Stat Preview */}
          <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 text-xs flex flex-col gap-2.5 shadow-inner">
            <div className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-slate-400 border-b border-slate-800 pb-1.5 flex justify-between">
              <span>Attributes & Infusions</span>
              <span>Calculated Values</span>
            </div>
            {craftCategory === 'weapon' ? (
              <>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Attack Damage</span>
                  <span className="font-mono text-white font-semibold flex items-center gap-1.5">
                    <span className="text-slate-400">{baseTemplate.baseDamage}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className="text-rose-400 font-bold">
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
                  <span className="text-sky-400 font-bold">
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
              <span className="font-bold text-[11px]" style={{ color: selectedCatalyst.color }}>
                {selectedCatalyst.damageType} Infusion
              </span>
            </div>

            {craftCategory === 'weapon' && isSpecialProperty && (
              <div className="mt-1 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-[10px] text-amber-300 leading-normal">
                <span className="font-mono font-bold text-[9px] text-amber-400">CORE TRAIT: </span>
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
            <div className="bg-amber-950/60 border border-amber-500/50 text-amber-200 p-3 rounded-2xl text-xs flex items-center gap-3 mb-1 shadow-lg">
              <span className="text-2xl shrink-0">⚒️</span>
              <div>
                <span className="font-bold text-amber-300 block">Blacksmith Anvil Required</span>
                <span className="text-[11px] text-amber-200/90 leading-relaxed">
                  Stand adjacent to a placed <strong>Portable Blacksmith Anvil (⚒️)</strong> or visit Town to forge new gear!
                </span>
              </div>
            </div>
          )}
          {!canCraft && isForgeAvailable && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl text-[11px] text-center mb-1 leading-normal font-mono">
              Missing components: {materialCount === 0 ? selectedMaterial.name : ''} {materialCount === 0 && catalystCount === 0 ? 'and' : ''} {catalystCount === 0 ? selectedCatalyst.name : ''}
            </div>
          )}

          <button
            id="craft-assemble-button"
            disabled={!canCraft}
            onClick={handleCraft}
            className={`w-full py-3.5 rounded-2xl text-xs font-black select-none flex items-center justify-center gap-2 border shadow-xl transition-all duration-300 uppercase tracking-wider ${
              canCraft
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-300 hover:from-amber-400 hover:to-amber-500 cursor-pointer active:scale-[0.98]'
                : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
            }`}
          >
            <Hammer className="w-4 h-4 shrink-0" />
            <span>FORGE EQUIPMENT INTO BACKPACK</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeaponForgingTab;
