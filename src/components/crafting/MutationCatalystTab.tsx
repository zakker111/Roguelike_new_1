/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EquipmentItem } from '../../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../../data/items';
import { MutationSynergyPanel } from '../MutationSynergyPanel';
import { Sparkles, Shuffle, Flame } from 'lucide-react';

export interface MutationCatalystTabProps {
  currentWeapon: any;
  equipmentInventory: EquipmentItem[];
  selectedMutationItem: string;
  setSelectedMutationItem: (id: string) => void;
  selectedMutationMaterialId: string;
  setSelectedMutationMaterialId: (id: string) => void;
  selectedMutationCatalystId: string;
  setSelectedMutationCatalystId: (id: string) => void;
  inventoryMaterials: { [key: string]: number };
  inventoryCatalysts: { [key: string]: number };
  isForgeAvailable: boolean;
  overforgeHeat: number;
  renderOverforgeGauge: () => React.ReactNode;
  onMutateItem?: (itemId: string, matId: string, catId: string, overforgeHeat?: number) => void;
  searchQuery?: string;
}

export const MutationCatalystTab: React.FC<MutationCatalystTabProps> = ({
  currentWeapon,
  equipmentInventory,
  selectedMutationItem,
  setSelectedMutationItem,
  selectedMutationMaterialId,
  setSelectedMutationMaterialId,
  selectedMutationCatalystId,
  setSelectedMutationCatalystId,
  inventoryMaterials,
  inventoryCatalysts,
  isForgeAvailable,
  overforgeHeat,
  renderOverforgeGauge,
  onMutateItem,
  searchQuery = '',
}) => {
  const mutatableItems = [
    ...(currentWeapon ? [{ id: 'current_weapon', name: currentWeapon.name, subType: (currentWeapon as any).baseType || currentWeapon.subType || 'Weapon', desc: `Base Dmg: ${currentWeapon.damage}, Range: ${currentWeapon.range}`, icon: '⚔️', isCurrent: true }] : []),
    ...equipmentInventory.filter(item => item.type !== 'scroll').map(item => ({
      id: item.id,
      name: item.name,
      subType: item.subType,
      desc: item.type === 'weapon' ? `Dmg: ${item.damage}, Crit: ${((item.critChance || 0) * 100).toFixed(0)}%` : `Def: ${item.defense}`,
      icon: item.subType === 'Shield' ? '🛡️' : item.type === 'weapon' ? '⚔️' : '👕',
      isCurrent: false,
    }))
  ];

  const filteredMutatableItems = mutatableItems.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || String(item.subType).toLowerCase().includes(q);
  });

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
    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 flex-1 overflow-y-auto">
      {/* Column A: Select Item to Mutate (lg:col-span-4) */}
      <div className="lg:col-span-4 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 font-mono font-black">1</span>
          <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Select Target Gear</h3>
        </div>

        {mutatableItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
            <span className="text-4xl animate-bounce">📦</span>
            <strong className="text-xs text-slate-300 mt-3 font-sans block">Zero Equipments Detected</strong>
            <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
              Equip or carry weapons, shields, armor, or helmets in your backpack to initiate chaos mutations!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 flex-1 max-h-[500px] overflow-y-auto pr-1">
            {filteredMutatableItems.map((item) => {
              const isSelected = selectedMutationItem === item.id || (selectedMutationItem === 'current_weapon' && item.id === 'current_weapon');
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedMutationItem(item.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl text-left border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{item.name}</span>
                      {item.isCurrent && (
                        <span className="text-[8.5px] bg-amber-950/50 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-purple-400 mt-1 uppercase tracking-wider font-bold">
                      Class: {String(item.subType)}
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-1 font-mono">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Column B: Fuel Selection (lg:col-span-4) */}
      <div className="lg:col-span-4 p-5 flex flex-col gap-5">
        {/* Catalyst fuel selection */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
            <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 font-mono font-black">2</span>
            <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Inject Chaos Catalyst</h3>
          </div>

          <div className="flex flex-col gap-2">
            {ELEMENTAL_CATALYSTS.map((cat) => {
              const isSelected = selectedMutationCatalystId === cat.id;
              const count = inventoryCatalysts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedMutationCatalystId(cat.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl text-left border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/25 border-purple-500/60 shadow-md shadow-purple-950/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Flame className="w-4 h-4 shrink-0" style={{ color: cat.color }} />
                    <div>
                      <div className="font-bold text-slate-200 text-xs">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Infusion: {cat.damageType}</div>
                    </div>
                  </div>
                  <span className={`font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                    count > 0 ? 'bg-slate-900 border-purple-500/30 text-purple-300' : 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                  }`}>
                    Stock: {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Material fuel selection */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
            <span className="flex items-center justify-center text-xs h-5 w-5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-400 font-mono font-black">3</span>
            <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Inject Ingot Material</h3>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {BASIC_MATERIALS.map((mat) => {
              const isSelected = selectedMutationMaterialId === mat.id;
              const count = inventoryMaterials[mat.id] || 0;
              return (
                <button
                  key={mat.id}
                  onClick={() => setSelectedMutationMaterialId(mat.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl text-left border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-pink-950/25 border-pink-500/60 shadow-md shadow-pink-950/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full block shrink-0" style={{ backgroundColor: mat.color }} />
                    <div className="font-bold text-slate-200 text-xs">{mat.name}</div>
                  </div>
                  <span className={`font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                    count > 0 ? 'bg-slate-900 border-pink-500/30 text-pink-300' : 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                  }`}>
                    Stock: {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Column C: Render Mutate Action (lg:col-span-4) */}
      <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-950/40">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            <h3 className="text-xs font-black tracking-wider font-sans text-slate-100 uppercase">Chaos Mutation Projection</h3>
          </div>

          {selectedItemObj ? (
            <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
              <div className="absolute top-2.5 right-3 text-[8.5px] font-mono text-purple-400 uppercase tracking-widest font-bold">
                GRID HARMONIZED
              </div>

              <div className="relative h-14 w-14 flex items-center justify-center bg-slate-900 border border-purple-500/30 rounded-2xl shadow-inner mb-2.5">
                <span className="text-3xl drop-shadow-md">
                  {selectedItemObj.icon}
                </span>
                <div className="absolute inset-0 rounded-2xl bg-purple-500/10 animate-ping" />
              </div>

              <div className="text-center font-black text-xs uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {selectedItemObj.name}
              </div>

              <div className="w-full h-px bg-slate-800 my-2.5" />

              {/* Display prospective prefixes */}
              <div className="w-full text-[10.5px] space-y-1.5 text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Injected Catalyst:</span>
                  <span className="text-purple-300 font-bold">{selectedMutCatalyst.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Injected Core:</span>
                  <span className="text-pink-300 font-bold">{selectedMutMaterial.name}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5">
                  <span className="text-slate-400">Chaos Mult Factor:</span>
                  <span className="text-amber-300 font-bold">0.85x to 1.55x</span>
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

        <div className="mt-4">
          {!isForgeAvailable && (
            <div className="bg-amber-950/60 border border-amber-500/50 text-amber-200 p-3 rounded-2xl text-xs flex items-center gap-3 mb-2 shadow-lg">
              <span className="text-2xl shrink-0">⚒️</span>
              <div>
                <strong className="text-amber-300 block font-bold">Blacksmith Anvil Required</strong>
                <span className="text-[11px] text-amber-200/90 leading-relaxed">
                  Stand adjacent to an Anvil (⚒️) or visit Town to trigger mutation chains!
                </span>
              </div>
            </div>
          )}
          {!canMutate && isForgeAvailable && selectedItemObj && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 text-[11px] text-center mb-2 rounded-xl font-mono leading-normal">
              ⚠️ Missing fuel: Need 1x {selectedMutMaterial.name} and 1x {selectedMutCatalyst.name} in backpack.
            </div>
          )}

          <button
            disabled={!canMutate || !onMutateItem}
            onClick={() => {
              if (canMutate && onMutateItem && selectedItemObj) {
                onMutateItem(selectedItemObj.id, selectedMutationMaterialId, selectedMutationCatalystId, overforgeHeat);
              }
            }}
            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border shadow-xl cursor-pointer transition-all active:scale-[0.98] ${
              canMutate
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-purple-400 shadow-purple-950/50'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
            }`}
          >
            <Shuffle className="w-4 h-4 animate-spin text-purple-200" style={{ animationDuration: '6s' }} />
            <span>MUTATE EQUIPMENT PROPERTIES</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MutationCatalystTab;
