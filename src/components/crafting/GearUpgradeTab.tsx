/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EquipmentItem } from '../../types';
import { BASIC_MATERIALS } from '../../data/items';
import { Hammer, Sparkles, ArrowRight } from 'lucide-react';

export interface GearUpgradeTabProps {
  currentWeapon: any;
  equipmentInventory: EquipmentItem[];
  selectedUpgradeItem: string;
  setSelectedUpgradeItem: (id: string) => void;
  selectedUpgradeMaterialId: string;
  setSelectedUpgradeMaterialId: (id: string) => void;
  inventoryMaterials: { [key: string]: number };
  isForgeAvailable: boolean;
  overforgeHeat: number;
  renderOverforgeGauge: () => React.ReactNode;
  onUpgradeItem?: (itemId: string, materialId: string, overforgeHeat?: number) => void;
  searchQuery?: string;
}

export const GearUpgradeTab: React.FC<GearUpgradeTabProps> = ({
  currentWeapon,
  equipmentInventory,
  selectedUpgradeItem,
  setSelectedUpgradeItem,
  selectedUpgradeMaterialId,
  setSelectedUpgradeMaterialId,
  inventoryMaterials,
  isForgeAvailable,
  overforgeHeat,
  renderOverforgeGauge,
  onUpgradeItem,
  searchQuery = '',
}) => {
  const upgradableItems = [
    ...(currentWeapon ? [{ id: 'current_weapon', name: currentWeapon.name, subType: (currentWeapon as any).baseType || currentWeapon.subType || 'Weapon', desc: `Base Dmg: ${currentWeapon.damage}, Crit: ${((currentWeapon.critChance || 0) * 100).toFixed(0)}%`, icon: '⚔️', type: 'weapon', upgradeLevel: currentWeapon.upgradeLevel ?? 0, rating: currentWeapon.damage }] : []),
    ...equipmentInventory.filter(item => item.type !== 'scroll').map(item => ({
      id: item.id,
      name: item.name,
      subType: item.subType,
      desc: item.type === 'weapon' ? `Dmg: ${item.damage}, Crit: ${((item.critChance || 0) * 100).toFixed(0)}%` : `Def: ${item.defense}`,
      icon: item.subType === 'Shield' ? '🛡️' : item.type === 'weapon' ? '⚔️' : '👕',
      type: item.type,
      upgradeLevel: item.upgradeLevel ?? 0,
      rating: item.type === 'weapon' ? item.damage : item.defense,
    }))
  ];

  const filteredUpgradableItems = upgradableItems.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || String(item.subType).toLowerCase().includes(q);
  });

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
  let materialFeatureName = 'None';
  let materialAbilityDesc = '';

  if (selectedItemObj) {
    const isWeapon = selectedItemObj.type === 'weapon';
    if (selectedUpgradeMaterialId === 'mat_iron') {
      prospectiveDmgBonus = isWeapon ? 2 : 0;
      prospectiveDefBonus = !isWeapon ? 1 : 0;
      materialFeatureName = 'Tempered Guard';
      materialAbilityDesc = 'Solid reliability. +5% block rate.';
    } else if (selectedUpgradeMaterialId === 'mat_mithril') {
      prospectiveDmgBonus = isWeapon ? 3 : 0;
      prospectiveDefBonus = !isWeapon ? 1 : 0;
      prospectiveCritBonus = 0.04;
      materialFeatureName = 'Swift Strike / Nimble Step';
      materialAbilityDesc = 'Featherlight. Higher critical rate & speed.';
    } else if (selectedUpgradeMaterialId === 'mat_obsidian') {
      prospectiveDmgBonus = isWeapon ? 5 : 0;
      prospectiveDefBonus = !isWeapon ? 2 : 0;
      materialFeatureName = 'Retribution Spikes';
      materialAbilityDesc = 'Glassy razor-sharp finish. Reflects 3 damage.';
    } else if (selectedUpgradeMaterialId === 'mat_dragonscale') {
      prospectiveDmgBonus = isWeapon ? 6 : 0;
      prospectiveDefBonus = !isWeapon ? 2 : 0;
      prospectiveCritBonus = 0.02;
      materialFeatureName = 'Primal Fireburst';
      materialAbilityDesc = 'Ignites enemies on critical physical strikes.';
    } else if (selectedUpgradeMaterialId === 'mat_feybone') {
      prospectiveDmgBonus = isWeapon ? 4 : 0;
      prospectiveDefBonus = !isWeapon ? 1 : 0;
      materialFeatureName = 'Vampiric Siphon';
      materialAbilityDesc = 'Life absorption. Drain 2 HP on landing physical hits.';
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 flex-1 overflow-y-auto">
      {/* Column 1: Select Target Item (lg:col-span-4) */}
      <div className="lg:col-span-4 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 font-mono font-black">1</span>
          <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Select Target Gear</h3>
        </div>

        {upgradableItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
            <span className="text-4xl animate-bounce">📦</span>
            <strong className="text-xs text-slate-300 mt-3 font-sans block">No Upgradable Equipment Found</strong>
            <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
              Forge some weapons, shields, or armors in the Forge Equipment tab first to begin upgrading!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 flex-1 max-h-[500px] overflow-y-auto pr-1">
            {filteredUpgradableItems.map((item) => {
              const isSelected = selectedUpgradeItem === item.id || (selectedUpgradeItem === 'current_weapon' && item.id === 'current_weapon');
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedUpgradeItem(item.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl text-left border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-teal-500/60 bg-teal-950/25 shadow-lg shadow-teal-950/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{item.name}</span>
                      <span className="text-[9.5px] bg-teal-950/60 text-teal-300 border border-teal-500/30 font-mono font-bold px-2 py-0.5 rounded-full">
                        +{item.upgradeLevel}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-1 font-mono">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Column 2: Select Specific Upgrade Material (lg:col-span-4) */}
      <div className="lg:col-span-4 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 font-mono font-black">2</span>
          <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Select Reinforcing Ingot</h3>
        </div>

        <p className="text-[10.5px] text-slate-400 leading-relaxed font-mono">
          Each metal imprints unique stat boosts, tempered bonuses, and permanent passive abilities!
        </p>

        <div className="grid grid-cols-1 gap-2 flex-1 max-h-[460px] overflow-y-auto pr-1">
          {BASIC_MATERIALS.filter(m => ['mat_iron', 'mat_mithril', 'mat_obsidian', 'mat_dragonscale', 'mat_feybone'].includes(m.id)).map((mat) => {
            const isSelected = selectedUpgradeMaterialId === mat.id;
            const count = inventoryMaterials[mat.id] || 0;
            return (
              <button
                key={mat.id}
                onClick={() => setSelectedUpgradeMaterialId(mat.id)}
                className={`flex items-start justify-between p-3 rounded-2xl text-left border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-950/25 border-teal-500/60 shadow-md shadow-teal-950/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-full block mt-1 shrink-0 shadow-sm" style={{ backgroundColor: mat.color }} />
                  <div>
                    <div className="font-bold text-slate-200 text-xs">{mat.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{mat.description}</div>
                    <div className="text-[9.5px] mt-1 font-bold text-teal-300 font-mono uppercase">
                      {mat.id === 'mat_iron' && 'Standard Physical Reinforce'}
                      {mat.id === 'mat_mithril' && 'Swift strike & critical scaling'}
                      {mat.id === 'mat_obsidian' && 'Heavy blow & razor retribution'}
                      {mat.id === 'mat_dragonscale' && 'Primal thermal burst strike'}
                      {mat.id === 'mat_feybone' && 'Vampiric health lifesteal'}
                    </div>
                  </div>
                </div>
                <span className={`font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  count > 0 ? 'bg-slate-900 border-teal-500/30 text-teal-300' : 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                }`}>
                  Stock: {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Column 3: Stats Forecast and Assembly (lg:col-span-4) */}
      <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-950/40">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <Sparkles className="w-4 h-4 text-teal-400 animate-spin" style={{ animationDuration: '4s' }} />
            <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Upgrade Forecast</h3>
          </div>

          {selectedItemObj ? (
            <div className="bg-slate-950 border border-teal-500/30 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
              <div className="absolute top-2.5 right-3 text-[8.5px] font-mono text-teal-400 uppercase tracking-widest font-bold">
                FORECAST READY
              </div>

              <div className="relative h-12 w-12 flex items-center justify-center bg-slate-900 border border-teal-500/30 rounded-2xl mb-2">
                <span className="text-2xl drop-shadow-md">
                  {selectedItemObj.icon}
                </span>
              </div>

              <div className="text-center font-bold text-xs uppercase text-slate-100">
                {selectedItemObj.name.replace(/\s\+\d+$/, '')} +{targetLvl}
              </div>
              <div className="text-[9.5px] text-teal-400 font-mono mt-0.5 font-bold">
                Tier Level: T{targetLvl}
              </div>

              <div className="w-full h-px bg-slate-800 my-2.5" />

              {/* Stat comparisons */}
              <div className="w-full text-[10.5px] space-y-1.5 text-slate-300 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Success Probability:</span>
                  <span className="text-teal-300 font-bold bg-teal-950/50 border border-teal-500/30 px-2 py-0.5 rounded-full">{(successRate * 100).toFixed(0)}% Rate</span>
                </div>
                
                {selectedItemObj.type === 'weapon' ? (
                  <>
                    <div className="flex justify-between items-center border-t border-slate-800 pt-1.5 mt-1.5">
                      <span className="text-slate-400">Damage Modifier:</span>
                      <span className="flex items-center gap-1 font-bold">
                        <span className="text-slate-400">{selectedItemObj.rating}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-emerald-400">+{prospectiveDmgBonus}</span>
                      </span>
                    </div>
                    {prospectiveCritBonus > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Crit Rate Chance:</span>
                        <span className="text-emerald-400 font-bold">+{prospectiveCritBonus * 100}%</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between items-center border-t border-slate-800 pt-1.5 mt-1.5">
                    <span className="text-slate-400">Defense Armor Modifier:</span>
                    <span className="flex items-center gap-1 font-bold">
                      <span className="text-slate-400">{selectedItemObj.rating}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-sky-400">+{prospectiveDefBonus} DEF</span>
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1.5">
                  <span className="text-slate-400">Upgrade Material:</span>
                  <span className="font-bold text-white" style={{ color: selectedUpgMaterial.color }}>{selectedUpgMaterial.name}</span>
                </div>

                {/* Passive ability unlock preview */}
                <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-2.5 text-[10px] text-slate-300 font-sans mt-2">
                  <span className="font-mono text-teal-300 font-bold text-[9px]">✨ GRANTS PASSIVE ABILITY:</span>
                  <div className="font-bold text-white mt-0.5">{materialFeatureName}</div>
                  <p className="text-slate-400 text-[9.5px] leading-normal">{materialAbilityDesc}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center font-mono text-[10px] text-slate-500">
              Select an item in Column 1 to compute projection vectors.
            </div>
          )}

          {/* Over-Forging Heat Gauge */}
          {renderOverforgeGauge()}
        </div>

        <div className="mt-4">
          {!isForgeAvailable && (
            <div className="bg-amber-950/60 border border-amber-500/50 text-amber-200 p-3 rounded-2xl text-xs flex items-center gap-3 mb-2 shadow-lg">
              <span className="text-2xl shrink-0">⚒️</span>
              <div>
                <strong className="text-amber-300 block font-bold">Blacksmith Anvil Required</strong>
                <span className="text-[11px] text-amber-200/90 leading-relaxed">
                  Stand adjacent to an Anvil (⚒️) or visit Town to upgrade gear!
                </span>
              </div>
            </div>
          )}
          {!canUpgrade && isForgeAvailable && selectedItemObj && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 text-[11px] text-center mb-2 rounded-xl font-mono leading-normal">
              ⚠️ Missing material: Gather more {selectedUpgMaterial.name} in overworld or dungeons.
            </div>
          )}

          <button
            disabled={!canUpgrade || !onUpgradeItem}
            onClick={() => {
              if (canUpgrade && onUpgradeItem && selectedItemObj) {
                onUpgradeItem(selectedItemObj.id, selectedUpgradeMaterialId, overforgeHeat);
              }
            }}
            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border shadow-xl cursor-pointer transition-all active:scale-[0.98] ${
              canUpgrade
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 border-teal-300 shadow-teal-950/50'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
            }`}
          >
            <Hammer className="w-4 h-4 text-slate-950" />
            <span>INITIATE EQUIPMENT UPGRADE (+{targetLvl})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GearUpgradeTab;
