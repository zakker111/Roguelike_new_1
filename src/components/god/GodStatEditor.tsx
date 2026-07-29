/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameState, Scar } from '../../types';
import { Plus } from 'lucide-react';
import { SCAR_DATABASE } from '../../utils/scars';

export interface GodStatEditorProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  scarDatabase?: Scar[];
}

export const GodStatEditor: React.FC<GodStatEditorProps> = ({
  gameState,
  setGameState,
  scarDatabase = SCAR_DATABASE,
}) => {
  const scarList = scarDatabase || SCAR_DATABASE;
  const [selectedScarName, setSelectedScarName] = useState<string>(
    scarList[0]?.name || ''
  );

  const handleModifyAttribute = (key: string, delta: number) => {
    setGameState((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        [key]: Math.max(0, (prev.playerStats[key as keyof typeof prev.playerStats] as number || 0) + delta)
      }
    }));
  };

  const handleInjectScar = (scarName: string) => {
    const targetScar = scarList.find((s) => s.name === scarName);
    if (!targetScar) return;

    setGameState((prev) => {
      const currentScars = prev.playerStats.scars || [];
      const newScar = { ...targetScar, acquiredTurn: prev.playerStats.turnsPlayed || 1 };
      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          scars: [...currentScars, newScar]
        },
        logs: [
          ...prev.logs,
          {
            id: `scar_inj_${Date.now()}`,
            text: `🩹 GOD INJECTION: Inscribed battle trauma "${targetScar.name}" onto player ledger!`,
            type: 'system',
            timestamp: 'GOD'
          }
        ]
      };
    });
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel 1A: Battle Scars Spawning */}
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
            <span className="text-rose-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              🩹 Physical Trauma & Battle SCARS Spawning
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal font-sans">
            Spawn any scar from the trauma database directly into the character's active trauma ledger. Test stat penalties and cosmetic scarring immediately.
          </p>

          <div className="space-y-2">
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
              Select Trauma Pattern:
            </label>
            <select
              value={selectedScarName}
              onChange={(e) => setSelectedScarName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
            >
              {scarList.map((scar) => (
                <option key={scar.name} value={scar.name}>
                  {scar.icon} {scar.name} ({scar.severity}) — {scar.description.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleInjectScar(selectedScarName)}
            className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inscribe Physical Trauma Scar onto Player</span>
          </button>

          {/* Active scars indicator */}
          <div className="pt-2">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">
              Active Player Scars Count:
            </span>
            <div className="flex flex-wrap gap-1">
              {gameState.playerStats.scars && gameState.playerStats.scars.length > 0 ? (
                gameState.playerStats.scars.map((s, idx) => (
                  <span
                    key={`${s.id}_${idx}`}
                    className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-bold rounded text-slate-300 flex items-center gap-1"
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </span>
                ))
              ) : (
                <span className="text-[9px] text-slate-500 italic font-sans animate-pulse">
                  No scars currently inscribed on player stats.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Panel 1B: Player Attribute Boosts */}
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
            <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              📊 Custom Attribute Boosters & Stat Editor
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal font-sans">
            Instantly add or subtract points to raw attributes to playtest dynamic scaling. Overwrite points directly.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'str', label: '💪 Strength', color: 'text-red-400' },
              { key: 'dex', label: '🏹 Dexterity', color: 'text-emerald-400' },
              { key: 'int', label: '🪄 Intelligence', color: 'text-sky-400' },
              { key: 'cha', label: '👑 Charisma', color: 'text-purple-400' },
              { key: 'lck', label: '🍀 Luck', color: 'text-yellow-400' },
              { key: 'unspentPoints', label: '✨ Stat Points', color: 'text-pink-400' },
            ].map((item) => {
              const curVal = (gameState.playerStats as any)[item.key] || 0;
              return (
                <div
                  key={item.key}
                  className="p-2 bg-slate-950/60 border border-slate-800 rounded flex items-center justify-between"
                >
                  <div>
                    <span className={`text-[9px] font-bold block ${item.color}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-white font-mono font-bold animate-pulse">
                      {curVal}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleModifyAttribute(item.key, -5)}
                      className="px-1 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white rounded cursor-pointer leading-none"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleModifyAttribute(item.key, 5)}
                      className="px-1 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white rounded cursor-pointer leading-none"
                    >
                      +5
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-2 bg-amber-950/15 border border-amber-900/35 rounded text-[9px] text-amber-500 font-semibold leading-relaxed font-sans">
            💡 Modifying Stats live automatically propagates secondary attributes like armor class block rate, critical damage bonus, and magic spell potency!
          </div>
        </div>
      </div>
    </div>
  );
};
