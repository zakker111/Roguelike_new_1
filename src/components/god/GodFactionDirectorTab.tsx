/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { GameState } from '../../types';
import { playSound } from '../../utils/audio';

export interface GodFactionDirectorTabProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerSuccessLog?: (msg: string) => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

interface FactionData {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

const FACTION_LIST: FactionData[] = [
  {
    id: 'town_guard',
    name: 'Crown Knights & Town Guard',
    icon: '🛡️',
    description: 'Castle Sentries, gate wardens, and fortress halberdiers. Protectors of Oakhaven order.',
    color: 'text-sky-400'
  },
  {
    id: 'iron_vanguard',
    name: 'Iron Vanguard Guild',
    icon: '⚔️',
    description: 'Elite mercenary guild and blacksmith brotherhood. Controls fortress trade and bounties.',
    color: 'text-amber-400'
  },
  {
    id: 'shadow_syndicate',
    name: 'Shadow Syndicate',
    icon: '🗡️',
    description: 'Underworld rogues, black market fences, and poison-blade assassins hiding in back alleys.',
    color: 'text-purple-400'
  },
  {
    id: 'outlaw_bandits',
    name: 'Wilderness Outlaws & Bandits',
    icon: '💀',
    description: 'Renegade marauders occupying forest camps, highway ambushes, and ruined watchtowers.',
    color: 'text-rose-400'
  },
  {
    id: 'orc_clans',
    name: 'Ironcrag Orc Clans',
    icon: '🪓',
    description: 'Fierce highland clan warriors and battle-shamans battling for mountain territory.',
    color: 'text-red-400'
  },
  {
    id: 'ancient_guardians',
    name: 'Ancient Ley Guardians',
    icon: '🗿',
    description: 'Arcane stone constructs and sentinel wardens protecting forgotten dungeon waystones.',
    color: 'text-emerald-400'
  }
];

export const GodFactionDirectorTab: React.FC<GodFactionDirectorTabProps> = ({
  gameState,
  setGameState,
  triggerSuccessLog,
  addLogMessage
}) => {
  const [factionsStanding, setFactionsStanding] = useState<{ [id: string]: number }>({
    town_guard: gameState.townReputation ?? 100,
    iron_vanguard: 50,
    shadow_syndicate: -20,
    outlaw_bandits: -80,
    orc_clans: -60,
    ancient_guardians: 10
  });

  const getTier = (score: number) => {
    if (score >= 70) return { label: 'ALLIED (+)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50' };
    if (score >= 30) return { label: 'FRIENDLY', color: 'text-teal-400 bg-teal-950/60 border-teal-500/50' };
    if (score >= -10) return { label: 'NEUTRAL', color: 'text-slate-400 bg-slate-900 border-slate-700' };
    if (score >= -50) return { label: 'UNFRIENDLY', color: 'text-amber-400 bg-amber-950/60 border-amber-500/50' };
    if (score >= -80) return { label: 'HOSTILE', color: 'text-rose-400 bg-rose-950/60 border-rose-500/50' };
    return { label: 'NEMESIS (WAR)', color: 'text-red-500 bg-red-950 border-red-500 font-black' };
  };

  const handleSetStanding = (factionId: string, delta: number) => {
    playSound('ui_click');
    setFactionsStanding(prev => {
      const current = prev[factionId] ?? 0;
      const next = Math.max(-100, Math.min(100, current + delta));
      if (factionId === 'town_guard') {
        setGameState(g => ({ ...g, townReputation: next }));
      }
      return { ...prev, [factionId]: next };
    });
  };

  const handleSetExact = (factionId: string, val: number) => {
    playSound('craft');
    setFactionsStanding(prev => {
      const next = val;
      if (factionId === 'town_guard') {
        setGameState(g => ({ ...g, townReputation: next }));
      }
      return { ...prev, [factionId]: next };
    });
    const msg = `Updated reputation with ${factionId} to ${val}.`;
    if (triggerSuccessLog) triggerSuccessLog(msg);
    if (addLogMessage) addLogMessage(`👑 [FACTION] ${msg}`, 'system');
  };

  const handleMakeAllies = () => {
    playSound('victory');
    const updated: { [id: string]: number } = {};
    FACTION_LIST.forEach(f => { updated[f.id] = 100; });
    setFactionsStanding(updated);
    setGameState(prev => ({ ...prev, townReputation: 100 }));
    if (triggerSuccessLog) triggerSuccessLog('Peace treaty ratified: ALL factions set to ALLIED (+100)!');
    if (addLogMessage) addLogMessage('🕊️ [DEV] Player is revered and allied with all mortal factions.', 'loot');
  };

  const handleDeclareTotalWar = () => {
    playSound('defeat');
    const updated: { [id: string]: number } = {};
    FACTION_LIST.forEach(f => { updated[f.id] = -100; });
    setFactionsStanding(updated);
    setGameState(prev => ({ ...prev, townReputation: -100 }));
    if (triggerSuccessLog) triggerSuccessLog('Total War declared: ALL factions set to NEMESIS (-100)!');
    if (addLogMessage) addLogMessage('⚔️ [DEV] Public Enemy #1! Every guard and faction will attack on sight.', 'danger');
  };

  const handleResetDefaults = () => {
    playSound('ui_click');
    setFactionsStanding({
      town_guard: 100,
      iron_vanguard: 50,
      shadow_syndicate: -20,
      outlaw_bandits: -80,
      orc_clans: -60,
      ancient_guardians: 10
    });
    setGameState(prev => ({ ...prev, townReputation: 100 }));
    if (triggerSuccessLog) triggerSuccessLog('Faction standings reset to default starting balance.');
  };

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300">
      {/* Header */}
      <div className="p-4 bg-slate-950/80 border border-sky-500/30 rounded-xl flex items-start justify-between shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
                Faction Standing & Hostility Director
              </h3>
              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded text-[10px] font-bold">
                REPUTATION MATRIX
              </span>
            </div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Real-time standing inspector across Crown guards, criminal syndicates, mountain clans, and outlaw encampments. Tweak discounts, safehouse privileges, and turf hostility.
            </p>
          </div>
        </div>

        {/* Global Bulk Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleMakeAllies}
            className="py-1.5 px-2.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded font-bold text-[10px] cursor-pointer"
            title="Set all factions to +100"
          >
            Peace Treaty 🕊️
          </button>
          <button
            onClick={handleDeclareTotalWar}
            className="py-1.5 px-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded font-bold text-[10px] cursor-pointer"
            title="Set all factions to -100"
          >
            Total War ⚔️
          </button>
          <button
            onClick={handleResetDefaults}
            className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-[10px] cursor-pointer"
            title="Restore default starting scores"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Factions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FACTION_LIST.map(faction => {
          const score = factionsStanding[faction.id] ?? 0;
          const tier = getTier(score);
          return (
            <div
              key={faction.id}
              className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{faction.icon}</span>
                  <div>
                    <h4 className={`font-bold text-sm ${faction.color}`}>{faction.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {faction.id}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${tier.color}`}>
                  {tier.label}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{faction.description}</p>

              {/* Score Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Reputation Score:</span>
                  <span className={`font-bold font-mono ${score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {score > 0 ? `+${score}` : score} / 100
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-150 ${score >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.abs(score)}%` }}
                  />
                </div>
              </div>

              {/* Quick Steppers & Preset Overrides */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSetStanding(faction.id, -25)}
                    className="px-2 py-1 bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-500 text-rose-300 rounded text-[10px] font-bold cursor-pointer"
                  >
                    -25
                  </button>
                  <button
                    onClick={() => handleSetStanding(faction.id, 25)}
                    className="px-2 py-1 bg-slate-900 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500 text-emerald-300 rounded text-[10px] font-bold cursor-pointer"
                  >
                    +25
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSetExact(faction.id, 100)}
                    className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 rounded text-[10px] font-bold cursor-pointer"
                  >
                    Allied (+100)
                  </button>
                  <button
                    onClick={() => handleSetExact(faction.id, 0)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                  >
                    Neutral (0)
                  </button>
                  <button
                    onClick={() => handleSetExact(faction.id, -100)}
                    className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-300 rounded text-[10px] font-bold cursor-pointer"
                  >
                    Hostile (-100)
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default GodFactionDirectorTab;
