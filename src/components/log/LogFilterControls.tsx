/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Swords, Sparkles, Coins, Hammer, Search, X } from 'lucide-react';
import { LogFilterCategory } from './types';

interface LogFilterControlsProps {
  activeFilter: LogFilterCategory;
  onSelectFilter: (category: LogFilterCategory) => void;
  categoryCounts: {
    all: number;
    combat: number;
    story: number;
    loot: number;
    craft: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const LogFilterControls: React.FC<LogFilterControlsProps> = ({
  activeFilter,
  onSelectFilter,
  categoryCounts,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap min-w-0">
      {/* Tactical Category Filter Segmented Control */}
      <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 shrink-0 select-none">
        <button
          onClick={() => onSelectFilter('all')}
          className={`px-2 py-0.5 rounded-md text-[9.5px] uppercase font-bold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          {`All `}<span className="opacity-60 text-[8.5px]">{`(${categoryCounts.all})`}</span>
        </button>

        <button
          onClick={() => onSelectFilter('combat')}
          className={`px-2 py-0.5 rounded-md text-[9.5px] uppercase font-bold transition-all flex items-center gap-1 cursor-pointer ${
            activeFilter === 'combat'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Swords className="w-2.5 h-2.5 text-rose-400" />
          {`Combat `}<span className="opacity-60 text-[8.5px]">{`(${categoryCounts.combat})`}</span>
        </button>

        <button
          onClick={() => onSelectFilter('story')}
          className={`px-2 py-0.5 rounded-md text-[9.5px] uppercase font-bold transition-all flex items-center gap-1 cursor-pointer ${
            activeFilter === 'story'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
          {`Story `}<span className="opacity-60 text-[8.5px]">{`(${categoryCounts.story})`}</span>
        </button>

        <button
          onClick={() => onSelectFilter('loot')}
          className={`px-2 py-0.5 rounded-md text-[9.5px] uppercase font-bold transition-all flex items-center gap-1 cursor-pointer ${
            activeFilter === 'loot'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Coins className="w-2.5 h-2.5 text-yellow-400" />
          {`Loot `}<span className="opacity-60 text-[8.5px]">{`(${categoryCounts.loot})`}</span>
        </button>

        <button
          onClick={() => onSelectFilter('craft')}
          className={`px-2 py-0.5 rounded-md text-[9.5px] uppercase font-bold transition-all flex items-center gap-1 cursor-pointer ${
            activeFilter === 'craft'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Hammer className="w-2.5 h-2.5 text-teal-400" />
          {`Craft `}<span className="opacity-60 text-[8.5px]">{`(${categoryCounts.craft})`}</span>
        </button>
      </div>

      {/* Inline Search Filter Input */}
      <div className="relative flex items-center shrink-0">
        <Search className="w-3 h-3 text-slate-500 absolute left-2 pointer-events-none" />
        <input
          type="text"
          placeholder="Filter logs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-6 py-0.5 text-[10px] text-slate-200 placeholder-slate-500 font-mono w-24 sm:w-32 focus:w-44 transition-all focus:outline-none focus:border-amber-500/50"
          aria-label="Filter logs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-1.5 text-slate-500 hover:text-slate-300 cursor-pointer"
            title="Clear search"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
};
