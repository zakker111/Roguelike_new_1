/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EquipmentItem } from '../../types';
import { BASIC_MATERIALS } from '../../data/items';
import { Hammer, Sparkles, ArrowRight } from 'lucide-react';

export interface GearUpgradeTabProps {
  currentWeapon: EquipmentItem | null;
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
}) => {
  const upgradableItems = [
    ...(currentWeapon ? [{ id: 'current_weapon', name: currentWeapon.name, subType: currentWeapon.baseType, desc: `Base Dmg: ${currentWeapon.damage}, Crit: ${((currentWeapon.critChance || 0) * 100).toFixed(0)}%`, icon: '⚔️', type: 'weapon', upgradeLevel: currentWeapon.upgradeLevel ?? 0, rating: currentWeapon.damage }] : []),
    ...equipmentInventory.filter(item => item.type !== 'scroll').map(item => ({
      id: item.id,
      name: item.name,
      subType: item.subType,
      desc: item.type === 'weapon' ? `Dmg: ${item.damage}, Crit: ${((item.critChance || 0) * 100).toFixed(0)}%` : `Def: ${item.defense}`,
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
};
