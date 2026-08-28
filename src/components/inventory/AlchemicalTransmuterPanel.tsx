/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState } from '../../types';

interface AlchemicalTransmuterPanelProps {
  gameState: GameState;
  handleShiftCatalyst: (id: string) => void;
  handleUnstableReactorSurge: () => void;
}

export const AlchemicalTransmuterPanel: React.FC<AlchemicalTransmuterPanelProps> = ({
  gameState,
  handleShiftCatalyst,
  handleUnstableReactorSurge,
}) => {
  const totalShards = Object.values(gameState.inventoryCatalysts).reduce<number>(
    (sum, qty) => sum + (Number(qty) || 0),
    0
  );

  if (!gameState.hasTransmuter) {
    return (
      <div className="bg-slate-950/30 border border-slate-800/80 border-dashed rounded-2xl p-4 flex flex-col gap-2.5 items-center justify-center text-center">
        <div className="w-9 h-9 rounded-full bg-slate-900/60 flex items-center justify-center text-slate-500 text-base border border-slate-800/60">
          🧪
        </div>
        <div className="max-w-md">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Alchemical Transmuter Offline
          </h4>
          <p className="text-[9px] text-slate-500 leading-normal mt-1">
            Synthesize alloy grades and shift elemental alignments anywhere on the fly. Explore deep
            dungeon chests, wait for Game Master events, or trade with Seppo in the deep forest to
            secure this wild magic flask!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3.5 animate-fade-in">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-950/40 border border-pink-500/30 flex items-center justify-center text-base">
            🧪
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black text-pink-400 tracking-wider">
              PORTABLE WILD ALCHEMICAL TRANSMUTER
            </h4>
            <p className="text-[9px] text-slate-400 leading-normal">
              Shift catalyst alignments or initiate a chaotic stable Reactor Surge!
            </p>
          </div>
        </div>
        <span className="text-[8px] px-2 py-0.5 rounded-full font-mono font-bold bg-pink-950/40 text-pink-400 border border-pink-500/30 animate-pulse">
          ● CHARGED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Shift */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 shadow-inner">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-900 pb-1 text-left">
            Alignment Shorter:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'cat_fire', name: 'Fire 🔥' },
              { id: 'cat_frost', name: 'Frost ❄️' },
              { id: 'cat_poison', name: 'Poison ☣️' },
              { id: 'cat_lightning', name: 'Spark ⚡' },
              { id: 'cat_shadow', name: 'Shadow 🔮' },
            ].map((cat) => {
              const qty = gameState.inventoryCatalysts[cat.id] || 0;
              const canShift = qty >= 1 && gameState.playerStats.gold >= 10;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleShiftCatalyst(cat.id)}
                  disabled={!canShift}
                  className={`p-2 border rounded-xl text-left flex justify-between items-center transition-all cursor-pointer ${
                    canShift
                      ? 'bg-slate-900 border-slate-800 hover:border-pink-500 hover:scale-[1.02] text-slate-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                  title={`Shift 1x ${cat.name} to a random shard for 10 gold`}
                >
                  <span className="truncate text-xs font-semibold">
                    {cat.name}: <strong className="text-amber-400">x{qty}</strong>
                  </span>
                  <span className="text-[7.5px] font-extrabold bg-pink-950/50 border border-pink-500/20 px-1.5 py-0.5 rounded text-pink-300">
                    SHIFT
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reactor */}
        <div className="bg-gradient-to-br from-slate-950 to-pink-950/30 border border-pink-900/40 p-3.5 rounded-xl flex flex-col gap-2 relative overflow-hidden text-left justify-between shadow-inner">
          <div className="flex flex-col">
            <span className="text-[10px] text-pink-400 uppercase tracking-widest font-black flex items-center gap-1.5">
              <span>🔮 Unstable Wild Reactor</span>
            </span>
            <span className="text-[8.5px] text-slate-400 mt-1 leading-relaxed">
              Fuse 2x shards + 100g for a chaotic surge event!
            </span>
          </div>

          <div className="flex justify-between items-center mt-2 pt-2 border-t border-pink-950/50">
            <div className="text-[8.5px] text-slate-400 font-mono flex flex-col gap-0.5">
              <span>
                Gold:{' '}
                <strong className={gameState.playerStats.gold >= 100 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                  {gameState.playerStats.gold} / 100g
                </strong>
              </span>
              <span>
                Shards:{' '}
                <strong className={totalShards >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                  {totalShards} / 2
                </strong>
              </span>
            </div>
            <button
              onClick={handleUnstableReactorSurge}
              disabled={gameState.playerStats.gold < 100 || totalShards < 2}
              className={`px-3.5 py-1.5 text-[10px] font-black rounded-lg cursor-pointer transition-all ${
                gameState.playerStats.gold >= 100 && totalShards >= 2
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg animate-pulse hover:scale-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              SURGE ⚡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
