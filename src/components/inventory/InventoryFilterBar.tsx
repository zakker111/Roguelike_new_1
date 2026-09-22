/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export type InventoryBagSubTab = 'allies' | 'gear' | 'food' | 'resources';

export interface InventoryFilterBarProps {
  bagSubTab: InventoryBagSubTab;
  setBagSubTab: (tab: InventoryBagSubTab) => void;
  totalFollowers: number;
  totalGear: number;
  totalFood: number;
  totalMats: number;
  onSortInventory: () => void;
  isSortedFeedback: boolean;
  playSound: (soundId: string) => void;
}

export const InventoryFilterBar: React.FC<InventoryFilterBarProps> = ({
  bagSubTab,
  setBagSubTab,
  totalFollowers,
  totalGear,
  totalFood,
  totalMats,
  onSortInventory,
  isSortedFeedback,
  playSound,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Inventory Actions Header */}
      <div className="flex justify-between items-center py-2 px-3 bg-slate-950/80 rounded-xl border border-slate-800 mt-1">
        <span className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span>🎒 Inventory Stash</span>
        </span>
        <button
          id="btn-sort-inventory"
          onClick={onSortInventory}
          className={`flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-bold text-[10px] rounded-lg shadow-md cursor-pointer active:scale-95 transition-all duration-150 border border-amber-400/30 ${
            isSortedFeedback ? 'ring-2 ring-emerald-400 border-emerald-400' : ''
          }`}
          title="Group and Sort stashed items by Type and Rarity"
        >
          <ArrowUpDown className={`w-3 h-3 ${isSortedFeedback ? 'animate-spin' : ''}`} />
          <span>{isSortedFeedback ? 'Organized!' : 'Sort & Group'}</span>
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/90 rounded-xl border border-slate-800 mt-1">
        <button
          id="tab-inventory-allies"
          onClick={() => {
            playSound('click');
            setBagSubTab('allies');
          }}
          className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            bagSubTab === 'allies'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <span>👥 ALLIES ({totalFollowers})</span>
        </button>
        <button
          id="tab-inventory-gear"
          onClick={() => {
            playSound('click');
            setBagSubTab('gear');
          }}
          className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            bagSubTab === 'gear'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <span>🎒 GEAR ({totalGear})</span>
        </button>
        <button
          id="tab-inventory-food"
          onClick={() => {
            playSound('click');
            setBagSubTab('food');
          }}
          className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            bagSubTab === 'food'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <span>🍲 FOOD ({totalFood})</span>
        </button>
        <button
          id="tab-inventory-resources"
          onClick={() => {
            playSound('click');
            setBagSubTab('resources');
          }}
          className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            bagSubTab === 'resources'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <span>💎 MATS ({totalMats})</span>
        </button>
      </div>
    </div>
  );
};
