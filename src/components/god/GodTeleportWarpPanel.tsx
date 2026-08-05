/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameState } from '../../types';
import { Compass, Sparkles, Navigation } from 'lucide-react';

export interface GodTeleportWarpPanelProps {
  TeleportToChunk: (cx: number, cy: number, reason: string) => void;
  TeleportToEmptyArena: () => void;
  TeleportToDungeon: (targetDepth?: number) => void;
  TeleportToDungeonEntranceOverworld: () => void;
  gameState: GameState;
}

export const GodTeleportWarpPanel: React.FC<GodTeleportWarpPanelProps> = ({
  TeleportToChunk,
  TeleportToEmptyArena,
  TeleportToDungeon,
  TeleportToDungeonEntranceOverworld,
  gameState,
}) => {
  const [warpChunkX, setWarpChunkX] = useState<number>(0);
  const [warpChunkY, setWarpChunkY] = useState<number>(0);
  const [dungeonAbyssDepth, setDungeonAbyssDepth] = useState<number>(1);

  return (
    <div className="space-y-3 font-mono">
      <h4 className="font-bold text-slate-350 uppercase tracking-widest text-[10px] border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
        <Compass className="w-4 h-4 text-amber-400" />
        <span>Quantum Teleportation & Dimensional Portals</span>
      </h4>

      {/* Arena Quick Warp Card */}
      <div 
        onClick={TeleportToEmptyArena}
        className="p-3 bg-gradient-to-r from-red-950/30 via-slate-900/40 to-indigo-950/30 border border-indigo-500/30 hover:border-indigo-500/65 rounded-xl cursor-pointer transition-all hover:bg-slate-950/60 shadow-lg group flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-700/60 flex items-center justify-center text-sm animate-pulse">
            ⚔️
          </div>
          <div>
            <div className="font-bold text-slate-100 text-xs flex items-center gap-2">
              <span>Warp to Testing Arena</span>
              <span className="text-[8px] bg-indigo-800/80 text-indigo-200 px-1 py-0.5 rounded uppercase font-mono tracking-widest leading-none">TEST BED</span>
            </div>
            <p className="text-[9.5px] text-slate-400 font-sans">
              Instant boundary-walled sandbox arena to test combat, spells, and AI presets.
            </p>
          </div>
        </div>
        <div className="text-slate-400 group-hover:text-amber-400 transition-colors font-bold text-xs shrink-0 flex items-center gap-1">
          <span>WARP</span>
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Fast Warp Coordinates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Overworld Chunk Warp */}
        <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-2">
          <span className="font-bold text-[10px] text-amber-400 uppercase tracking-wider block flex items-center gap-1">
            <Navigation className="w-3 h-3 text-amber-400" />
            <span>Overworld Coordinate Warp</span>
          </span>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-850 px-2 rounded text-[10px]">
              <span className="text-slate-500">Chunk X:</span>
              <input
                type="number"
                value={warpChunkX}
                onChange={(e) => setWarpChunkX(parseInt(e.target.value) || 0)}
                className="w-12 bg-transparent text-slate-200 font-bold outline-none"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-850 px-2 rounded text-[10px]">
              <span className="text-slate-500">Chunk Y:</span>
              <input
                type="number"
                value={warpChunkY}
                onChange={(e) => setWarpChunkY(parseInt(e.target.value) || 0)}
                className="w-12 bg-transparent text-slate-200 font-bold outline-none"
              />
            </div>
            <button
              onClick={() => TeleportToChunk(warpChunkX, warpChunkY, `Direct God Warp to Chunk (${warpChunkX}, ${warpChunkY})`)}
              className="px-3 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-200 font-bold rounded text-[10px] cursor-pointer transition-all flex-1"
            >
              Warp
            </button>
          </div>
        </div>

        {/* Abyss Depth Portal */}
        <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-2">
          <span className="font-bold text-[10px] text-indigo-400 uppercase tracking-wider block">
            🌌 Dungeon Abyss Floor Warp
          </span>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-850 px-2 rounded text-[10px]">
              <span className="text-slate-500">Depth:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={dungeonAbyssDepth}
                onChange={(e) => setDungeonAbyssDepth(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 bg-transparent text-indigo-300 font-bold outline-none"
              />
            </div>
            <button
              onClick={() => TeleportToDungeon(dungeonAbyssDepth)}
              className="px-3 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-200 font-bold rounded text-[10px] cursor-pointer transition-all flex-1"
            >
              Descend Depth #{dungeonAbyssDepth}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
