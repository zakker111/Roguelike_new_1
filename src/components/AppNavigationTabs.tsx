import React from 'react';
import { Swords, Sparkles, Skull, Package, Castle, BookOpen, ShoppingBag } from 'lucide-react';
import { GameState } from '../types';

interface AppNavigationTabsProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  activeMobileView: boolean;
  gameState: GameState;
  playSound: (sound: string) => void;
  scrollTabBar: (direction: 'left' | 'right') => void;
}

export const AppNavigationTabs: React.FC<AppNavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  activeMobileView,
  gameState,
  playSound,
  scrollTabBar
}) => {
  return (
    <div className="relative flex items-center bg-slate-950/90 border-b border-slate-800/80 px-2 sm:px-4 py-2 shadow-lg select-none shrink-0 backdrop-blur-sm">
      <button 
        onClick={() => scrollTabBar('left')}
        className="absolute left-1 z-10 bg-slate-900/95 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700/60 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold cursor-pointer transition-all shadow-md active:scale-95"
        title="Scroll Tabs Left"
      >
        ◀
      </button>

      <div id="tab-nav-container" className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth px-6 w-full">
        {/* Dungeon Expedition Tab */}
        <button
          id="tab-btn-dungeon"
          onClick={() => { playSound('click'); setActiveTab('dungeon'); }}
          className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
            activeTab === 'dungeon'
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
              : 'bg-slate-900/50 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Swords className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'dungeon' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>{activeMobileView ? 'Expedition' : 'DUNGEON EXPEDITION'}</span>
        </button>

        {/* Forge / Blacksmith Tab */}
        <button
          id="tab-btn-forge"
          onClick={() => { playSound('click'); setActiveTab('forge'); }}
          className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
            activeTab === 'forge'
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
              : 'bg-slate-900/50 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'forge' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>{activeMobileView ? 'Forge' : 'ARCANUM BLACKSMITH'}</span>
        </button>

        {/* Wilderness Bestiary Tab */}
        <button
          id="tab-btn-bestiary"
          onClick={() => { playSound('click'); setActiveTab('bestiary'); }}
          className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
            activeTab === 'bestiary'
              ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 shadow-sm'
              : 'bg-slate-900/50 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Skull className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'bestiary' ? 'text-rose-400' : 'text-slate-400'}`} />
          <span>{activeMobileView ? 'Bestiary' : 'WILDERNESS BESTIARY'}</span>
        </button>

        {/* Hero & Backpack Tab */}
        <button
          id="tab-btn-inventory"
          onClick={() => { playSound('click'); setActiveTab('inventory'); }}
          className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
            activeTab === 'inventory'
              ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 shadow-sm'
              : 'bg-slate-900/50 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Package className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'inventory' ? 'text-sky-400' : 'text-slate-400'}`} />
          <span>{activeMobileView ? 'Hero & Party' : 'HERO PROFILE, PARTY & BACKPACK'}</span>
        </button>

        {/* Guild & Factions Tab */}
        <button
          id="tab-btn-guild"
          onClick={() => { playSound('click'); setActiveTab('guild'); }}
          className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
            activeTab === 'guild'
              ? 'bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-sm'
              : 'bg-slate-900/50 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Castle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'guild' ? 'text-purple-400' : 'text-slate-400'}`} />
          <span>{activeMobileView ? 'Guild' : 'GUILD & FACTIONS'}</span>
        </button>

        {/* Chronicles & Lore Tab */}
        <button
          id="tab-btn-chronicles"
          onClick={() => { playSound('click'); setActiveTab('chronicles'); }}
          className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
            activeTab === 'chronicles'
              ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 shadow-sm'
              : 'bg-slate-900/50 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'chronicles' ? 'text-indigo-400' : 'text-slate-400'}`} />
          <span>{activeMobileView ? 'Chronicles' : 'CHRONICLES & LORE'}</span>
        </button>

        {/* Active NPC Trade Booth Tab */}
        {gameState.activeTradeNpcId && (
          <button
            id="tab-btn-market"
            onClick={() => { playSound('click'); setActiveTab('market'); }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              activeTab === 'market'
                ? 'bg-amber-500/25 border-amber-500/70 text-amber-300 shadow-md animate-pulse'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-300 hover:bg-amber-900/40'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>{activeMobileView ? 'Trade' : `TRADE BOOTH (${gameState.npcs?.find(n => n.id === gameState.activeTradeNpcId)?.name || 'Merchant'})`}</span>
          </button>
        )}
      </div>

      <button 
        onClick={() => scrollTabBar('right')}
        className="absolute right-1 z-10 bg-slate-900/95 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700/60 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold cursor-pointer transition-all shadow-md active:scale-95"
        title="Scroll Tabs Right"
      >
        ▶
      </button>
    </div>
  );
};

