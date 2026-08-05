/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EquipmentItem } from '../../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../../data/items';
import { MutationSynergyPanel } from '../MutationSynergyPanel';
import { Sparkles, Shuffle } from 'lucide-react';

export interface MutationCatalystTabProps {
  currentWeapon: EquipmentItem | null;
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
}) => {
  const mutatableItems = [
    ...(currentWeapon ? [{ id: 'current_weapon', name: currentWeapon.name, subType: currentWeapon.baseType, desc: `Base Dmg: ${currentWeapon.damage}, Range: ${currentWeapon.range}`, icon: '⚔️', isCurrent: true }] : []),
    ...equipmentInventory.filter(item => item.type !== 'scroll').map(item => ({
      id: item.id,
      name: item.name,
      subType: item.subType,
      desc: item.type === 'weapon' ? `Dmg: ${item.damage}, Crit: ${((item.critChance || 0) * 100).toFixed(0)}%` : `Def: ${item.defense}`,
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
};
