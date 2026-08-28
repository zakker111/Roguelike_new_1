/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Hammer, Flame, ChefHat, Sparkles, Wand2, Compass, Shield, Search } from 'lucide-react';

export type CraftingSubTab =
  | 'weapons'
  | 'survival'
  | 'cooking'
  | 'brewing'
  | 'scriptorium'
  | 'mutation'
  | 'upgrade';

export interface CraftingHeaderProps {
  activeSubTab: CraftingSubTab;
  setActiveSubTab: (tab: CraftingSubTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  blacksmithForgeLevel: number;
  apothecaryTier: number;
  isNextToCampfire?: boolean;
  isNextToAnvil?: boolean;
}

export const CraftingHeader: React.FC<CraftingHeaderProps> = ({
  activeSubTab,
  setActiveSubTab,
  searchQuery,
  setSearchQuery,
  blacksmithForgeLevel,
  apothecaryTier,
  isNextToCampfire,
  isNextToAnvil,
}) => {
  const tabs: Array<{
    id: CraftingSubTab;
    label: string;
    icon: string;
    color: string;
    activeClass: string;
    badge?: string;
  }> = [
    {
      id: 'weapons',
      label: 'Forge Equipment',
      icon: '🛡️',
      color: 'amber',
      activeClass: 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20',
      badge: `Lvl ${blacksmithForgeLevel}`,
    },
    {
      id: 'survival',
      label: 'Camp & Tools',
      icon: '⛺',
      color: 'orange',
      activeClass: 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20',
    },
    {
      id: 'cooking',
      label: 'Campfire Cooking',
      icon: '🍳',
      color: 'emerald',
      activeClass: 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20',
      badge: isNextToCampfire ? '🔥 Lit' : undefined,
    },
    {
      id: 'brewing',
      label: 'Alchemical Brewing',
      icon: '🧪',
      color: 'purple',
      activeClass: 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/30',
      badge: `Tier ${apothecaryTier}`,
    },
    {
      id: 'scriptorium',
      label: 'Spell Scriptorium',
      icon: '✨',
      color: 'sky',
      activeClass: 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20',
    },
    {
      id: 'mutation',
      label: 'Mutation Forge',
      icon: '🌀',
      color: 'pink',
      activeClass: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black shadow-md shadow-pink-600/30',
    },
    {
      id: 'upgrade',
      label: 'Upgrade Gear',
      icon: '⚡',
      color: 'teal',
      activeClass: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black shadow-md shadow-teal-500/30',
    },
  ];

  return (
    <div className="bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-3 border-b border-slate-800/80 flex flex-col gap-3 select-none">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Hammer className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-sans tracking-wide font-black text-slate-100 uppercase flex items-center gap-2">
              <span>CRAFTING ARCANUM WORKBENCH</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Forge armaments, brew elixirs, inscribe arcane scrolls, and cook gourmet rations
            </p>
          </div>
        </div>

        {/* Live Search bar */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recipes & gear..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold font-mono"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Discipline Navigation Tabs */}
      <div className="flex bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all duration-150 shrink-0 ${
                isActive
                  ? tab.activeClass
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                    isActive
                      ? 'bg-slate-950/40 border-slate-900/40 text-current'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
