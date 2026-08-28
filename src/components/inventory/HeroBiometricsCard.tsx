/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState } from '../../types';
import { User } from 'lucide-react';
import { getEffectiveStats } from '../../utils/scars';

interface HeroBiometricsCardProps {
  gameState: GameState;
  handleAdjustAttribute: (attr: 'str' | 'dex' | 'int' | 'cha' | 'lck', amount: number) => void;
}

export const HeroBiometricsCard: React.FC<HeroBiometricsCardProps> = ({
  gameState,
  handleAdjustAttribute,
}) => {
  const effStats = getEffectiveStats(gameState.playerStats);

  return (
    <>
      {/* Identity block */}
      <div className="border-b border-slate-800/80 pb-2.5 flex justify-between items-center bg-slate-950/40 -mx-4 -mt-4 p-4 rounded-t-2xl mb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <User className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-wider text-slate-100 uppercase">
              HERO PROFILE & BIOMETRICS
            </h3>
            <span className="text-[9px] font-mono text-slate-400">Sunder Guild Registered Explorer</span>
          </div>
        </div>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
          ● SYNCHRONIZED
        </span>
      </div>

      {/* Level and XP progress bar */}
      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-2 font-mono text-xs text-slate-300 shadow-inner">
        <div className="flex justify-between items-center">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <span className="text-sm">⭐</span>
            <span>LEVEL {gameState.playerStats.level} HERO</span>
          </span>
          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            XP: <strong className="text-amber-300">{gameState.playerStats.xp}</strong> / {gameState.playerStats.nextLevelXp}
          </span>
        </div>
        <div className="w-full bg-slate-900 h-2.5 rounded-full border border-slate-800/90 overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500 shadow-sm"
            style={{
              width: `${Math.min(
                100,
                (gameState.playerStats.xp / gameState.playerStats.nextLevelXp) * 100
              )}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 uppercase mt-0.5">
          <span className="flex items-center gap-1">
            <span>❤️ Health:</span>
            <strong className="text-rose-400 font-bold">
              {gameState.playerStats.hp}/{gameState.playerStats.maxHp}
            </strong>
          </span>
          <span className="flex items-center gap-1">
            <span>🔮 Focus MP:</span>
            <strong className="text-sky-400 font-bold">
              {gameState.playerStats.mp}/{gameState.playerStats.maxMp}
            </strong>
          </span>
        </div>
      </div>

      {/* Attribute Spend Allocation section */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-inner">
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
          <span className="text-[10px] uppercase font-bold text-slate-300 font-mono flex items-center gap-1.5">
            <span>🧬 Core RPG Attributes</span>
          </span>
          {gameState.playerStats.unspentPoints > 0 ? (
            <span className="text-[10px] font-bold text-amber-300 animate-pulse bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/40 shadow-sm">
              🌟 {gameState.playerStats.unspentPoints} Unspent Points
            </span>
          ) : (
            <span className="text-[9px] font-mono text-slate-500">
              Level up to allocate points!
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
          {[
            { key: 'str', label: 'STR', name: 'Strength', color: 'text-rose-400', desc: '+Max HP & Parry' },
            { key: 'dex', label: 'DEX', name: 'Dexterity', color: 'text-emerald-400', desc: '+Crit & Speed' },
            { key: 'int', label: 'INT', name: 'Intellect', color: 'text-sky-400', desc: '+Max MP & Spell' },
            { key: 'cha', label: 'CHA', name: 'Charisma', color: 'text-purple-400', desc: 'Hire cost & Buffs' },
            { key: 'lck', label: 'LCK', name: 'Luck', color: 'text-amber-400', desc: '+Loot & Chests' },
          ].map((attr) => {
            const val =
              gameState.playerStats[attr.key as 'str' | 'dex' | 'int' | 'cha' | 'lck'] || 10;
            const effVal = effStats[attr.key as 'str' | 'dex' | 'int' | 'cha' | 'lck'] || 10;
            const diff = effVal - val;
            return (
              <div
                key={attr.key}
                className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-between gap-1 shadow-sm hover:border-slate-700 transition-colors"
              >
                <span className={`text-[9.5px] font-bold ${attr.color}`} title={attr.name}>
                  {attr.label}
                </span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs font-black text-slate-100">{effVal}</span>
                  {diff !== 0 && (
                    <span
                      className={`text-[8.5px] font-bold ${
                        diff > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                      title={`Base: ${val}`}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  )}
                </div>
                {gameState.playerStats.unspentPoints > 0 ? (
                  <button
                    onClick={() =>
                      handleAdjustAttribute(attr.key as 'str' | 'dex' | 'int' | 'cha' | 'lck', 1)
                    }
                    className="w-5 h-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer shadow-md active:scale-90 transition-transform"
                    title={`Allocate point to ${attr.name}`}
                  >
                    +
                  </button>
                ) : (
                  <span className="text-[7.5px] text-slate-400 font-sans leading-tight mt-0.5">
                    {attr.desc}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
