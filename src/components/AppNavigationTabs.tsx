import React from 'react';
import { Swords, Sparkles, Skull, Package, BookOpen, ShoppingBag } from 'lucide-react';
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
    <div className="relative flex items-center bg-slate-900 border-b border-slate-800 px-3 py-2 shadow-inner select-none shrink-0">
      <button 
        onClick={() => scrollTabBar('left')}
        className="absolute left-1.5 z-10 bg-slate-950/95 hover:bg-slate-900 text-amber-500 hover:text-amber-400 border border-slate-800/80 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold cursor-pointer transition-all shadow-lg active:scale-95"
        title="Scroll Tabs Left"
      >
        ◀
      </button>

      <div id="tab-nav-container" className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth px-6 w-full">
        <button
          id="tab-btn-dungeon"
          onClick={() => { playSound('click'); setActiveTab('dungeon'); }}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'dungeon'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{activeMobileView ? 'Expedition' : 'DUNGEON EXPEDITION'}</span>
        </button>

        <button
          id="tab-btn-forge"
          onClick={() => { playSound('click'); setActiveTab('forge'); }}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'forge'
              ? 'bg-amber-500 text-slate-950 font-bold shadow animate-pulse'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
          <span>{activeMobileView ? 'Forge' : 'ARCANUM BLACKSMITH'}</span>
        </button>

        <button
          id="tab-btn-bestiary"
          onClick={() => { playSound('click'); setActiveTab('bestiary'); }}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'bestiary'
              ? 'bg-rose-950 text-rose-400 font-bold border border-rose-500/30 shadow'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <Skull className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 animate-pulse" />
          <span>{activeMobileView ? 'Bestiary' : 'WILDERNESS BESTIARY'}</span>
        </button>

        <button
          id="tab-btn-inventory"
          onClick={() => { playSound('click'); setActiveTab('inventory'); }}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'inventory'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
          <span>{activeMobileView ? 'Hero & Party' : 'HERO PROFILE, PARTY & BACKPACK'}</span>
        </button>

        <button
          id="tab-btn-guild"
          onClick={() => { playSound('click'); setActiveTab('guild'); }}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'guild'
              ? 'bg-purple-600 text-white font-bold shadow-lg border border-purple-500'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <span className="text-xs">🏰</span>
          <span>{activeMobileView ? 'Guild' : 'GUILD & FACTIONS'}</span>
        </button>

        <button
          id="tab-btn-chronicles"
          onClick={() => { playSound('click'); setActiveTab('chronicles'); }}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'chronicles'
              ? 'bg-indigo-600 text-white font-bold shadow-lg border border-indigo-500'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          <span>{activeMobileView ? 'Chronicles' : 'CHRONICLES & LORE'}</span>
        </button>

        {gameState.activeTradeNpcId && (
          <button
            id="tab-btn-market"
            onClick={() => { playSound('click'); setActiveTab('market'); }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-500/30 shrink-0 ${
              activeTab === 'market'
                ? 'bg-amber-500 text-slate-950 font-bold shadow animate-bounce'
                : 'text-amber-400 hover:text-amber-100 bg-amber-500/10'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{activeMobileView ? 'Trade' : `TRADE BOOTH (${gameState.npcs?.find(n => n.id === gameState.activeTradeNpcId)?.name || 'Merchant'})`}</span>
          </button>
        )}
      </div>

      <button 
        onClick={() => scrollTabBar('right')}
        className="absolute right-1.5 z-10 bg-slate-950/95 hover:bg-slate-900 text-amber-500 hover:text-amber-400 border border-slate-800/80 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold cursor-pointer transition-all shadow-lg active:scale-95"
        title="Scroll Tabs Right"
      >
        ▶
      </button>
    </div>
  );
};
