import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const WorldMapLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900/90 border-t border-slate-800 select-none text-[11px] text-slate-400">
      {/* Mobile Toggle Bar */}
      <div className="flex sm:hidden items-center justify-between px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/40">
        <button
          onClick={() => setIsExpanded(e => !e)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400/90 hover:text-amber-300 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{isExpanded ? 'Hide Cartography Legend' : 'Show Map Legend & Biomes'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <span className="text-[9px] text-slate-500 font-mono">Tap Sector to Inspect</span>
      </div>

      {/* Legend Items */}
      <div className={`${isExpanded ? 'flex' : 'hidden sm:flex'} items-center gap-x-4 gap-y-1.5 flex-wrap px-3 sm:px-4 py-2 justify-between`}>
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
          <span className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">Legend:</span>
          
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-300 animate-ping inline-block" />
            <strong className="text-amber-300">Hero Location</strong>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-yellow-400">🏡</span>
            <span className="text-yellow-200">Village / Town</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-amber-400">🏰</span>
            <span className="text-amber-200">Fortified Citadel</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-sky-400">⛵</span>
            <span className="text-sky-200">Harbor Port</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-purple-400">⚔️</span>
            <span className="text-purple-200">Dungeon</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-cyan-400">🌀</span>
            <span className="text-cyan-200">Leyline Waystone</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-cyan-400">✨</span>
            <span className="text-cyan-200">Shrines</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-emerald-400">🌲</span>
            <span className="text-emerald-200">Forest</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-amber-400">🏜️</span>
            <span className="text-amber-200">Desert</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-sky-400">❄️</span>
            <span className="text-sky-200">Tundra</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-lime-400">🌿</span>
            <span className="text-lime-200">Swamp</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-cyan-400">🪸</span>
            <span className="text-cyan-200">Coral Reef</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-red-400">🌋</span>
            <span className="text-red-200">Volcanic</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-blue-300">🧊</span>
            <span className="text-blue-200">Glacial</span>
          </span>
        </div>

        <div className="hidden lg:block text-[10px] text-slate-500 font-mono">
          Drag/Swipe to Pan • Pinch/Scroll to Zoom • Tap Sector to Inspect
        </div>
      </div>
    </div>
  );
};
