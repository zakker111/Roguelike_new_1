import React from 'react';
import { Skull, Activity } from 'lucide-react';
import { GameState } from '../../types';
import { BESTIARY_ENTRIES } from '../../utils/bestiary';

interface GodBestiaryTabProps {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerSuccessLog: (msg: string) => void;
  isAutoplayActive?: boolean;
  setIsAutoplayActive?: (active: boolean) => void;
}

export const GodBestiaryTab: React.FC<GodBestiaryTabProps> = ({
  setGameState,
  triggerSuccessLog,
  isAutoplayActive = false,
  setIsAutoplayActive,
}) => {
  return (
    <div className="space-y-4 font-mono pb-6 text-slate-200">
      <div className="border-b border-slate-800 pb-1.5 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-rose-400 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Skull className="w-4 h-4 text-rose-500" />
            <span>Bestiary & Telemetry Verification Lab</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
            Trigger artificial enemy kills, wipe counts, or fully unlock the Bestiary to test and verify UI layouts, lore footnotes, and loot tables.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel A: Global Unlock Cheats */}
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
          <span className="text-rose-400 font-bold text-[10px] uppercase tracking-wider block border-b border-slate-800/60 pb-1.5">
            📂 Global Unlock / Lock Controls
          </span>
          <p className="text-[10px] text-slate-400 leading-normal font-sans">
            Instantly unlock or lock entries. These controls directly manipulate the live state of `defeatedEnemiesCount` to test full completion.
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                const newCounts: { [key: string]: number } = {};
                BESTIARY_ENTRIES.forEach((entry: any) => {
                  newCounts[entry.key] = 1;
                });
                setGameState((prev) => ({
                  ...prev,
                  defeatedEnemiesCount: newCounts
                }));
                triggerSuccessLog("Bestiary Telemetry: Unlocked all entries with 1 kill each!");
              }}
              className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800 text-rose-300 text-xs font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔓 Unlock Entire Bestiary (1 Kill)</span>
            </button>

            <button
              onClick={() => {
                const newCounts: { [key: string]: number } = {};
                BESTIARY_ENTRIES.forEach((entry: any) => {
                  newCounts[entry.key] = 15;
                });
                setGameState((prev) => ({
                  ...prev,
                  defeatedEnemiesCount: newCounts
                }));
                triggerSuccessLog("Bestiary Telemetry: Unlocked all entries with 15 kills each!");
              }}
              className="w-full py-2 bg-rose-900/30 hover:bg-rose-800/40 border border-rose-700/60 text-rose-200 text-xs font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔥 Unlock All (15 Kills - Veteran Telemetry)</span>
            </button>

            <button
              onClick={() => {
                setGameState((prev) => ({
                  ...prev,
                  defeatedEnemiesCount: {}
                }));
                triggerSuccessLog("Bestiary Telemetry: Reset and locked all creature files!");
              }}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔒 Reset / Relock Entire Bestiary</span>
            </button>
          </div>
        </div>

        {/* Panel B: Selective Category Unlock */}
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
          <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wider block border-b border-slate-800/60 pb-1.5">
            🎯 Selective Category Enabler
          </span>
          <p className="text-[10px] text-slate-400 leading-normal font-sans">
            Unlock specific groups of creatures to verify targeted list behaviors and dynamic filtering in the main overlay.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => {
                setGameState((prev) => {
                  const counts = { ...(prev.defeatedEnemiesCount || {}) };
                  BESTIARY_ENTRIES.filter(e => e.category === 'Standard').forEach(e => {
                    counts[e.key] = (counts[e.key] || 0) + 1;
                  });
                  return { ...prev, defeatedEnemiesCount: counts };
                });
                triggerSuccessLog("Bestiary: Added +1 kill to all Standard Foes!");
              }}
              className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded cursor-pointer text-center"
            >
              <span>⚔️ Foes (+1)</span>
            </button>

            <button
              onClick={() => {
                setGameState((prev) => {
                  const counts = { ...(prev.defeatedEnemiesCount || {}) };
                  BESTIARY_ENTRIES.filter(e => e.category === 'Wildlife').forEach(e => {
                    counts[e.key] = (counts[e.key] || 0) + 1;
                  });
                  return { ...prev, defeatedEnemiesCount: counts };
                });
                triggerSuccessLog("Bestiary: Added +1 kill to all Wildlife Beasts!");
              }}
              className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded cursor-pointer text-center"
            >
              <span>🦌 Beasts (+1)</span>
            </button>

            <button
              onClick={() => {
                setGameState((prev) => {
                  const counts = { ...(prev.defeatedEnemiesCount || {}) };
                  BESTIARY_ENTRIES.filter(e => e.category === 'Bosses').forEach(e => {
                    counts[e.key] = (counts[e.key] || 0) + 1;
                  });
                  return { ...prev, defeatedEnemiesCount: counts };
                });
                triggerSuccessLog("Bestiary: Added +1 kill to all Legendary Bosses!");
              }}
              className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded cursor-pointer text-center"
            >
              <span>👑 Bosses (+1)</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/60">
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Target Specific Creature:</label>
            <div className="flex gap-2">
              <select
                id="test-creature-select"
                className="flex-1 bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:outline-none"
              >
                {BESTIARY_ENTRIES.map(e => (
                  <option key={e.key} value={e.key}>
                    {e.char} {e.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const sel = document.getElementById('test-creature-select') as HTMLSelectElement;
                  if (sel && sel.value) {
                    const val = sel.value;
                    setGameState((prev) => {
                      const counts = { ...(prev.defeatedEnemiesCount || {}) };
                      counts[val] = (counts[val] || 0) + 1;
                      return { ...prev, defeatedEnemiesCount: counts };
                    });
                    triggerSuccessLog(`Bestiary: Defeated 1x ${val}! Count incremented.`);
                  }
                }}
                className="px-4 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800 text-rose-300 text-xs font-bold rounded cursor-pointer transition-all"
              >
                Vanquish!
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel C: Autonomous Autoplay Playtest Agent */}
      <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
        <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
          <span className="text-teal-400 font-bold text-[10px] uppercase tracking-wider block">
            🤖 Autonomous Autoplay & Playtest Agent
          </span>
          <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold ${
            isAutoplayActive 
              ? 'bg-teal-950 text-teal-400 border border-teal-500/20' 
              : 'bg-slate-950 text-slate-500 border border-slate-800'
          }`}>
            {isAutoplayActive ? 'LIVE ACTIVE' : 'STANDBY'}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal font-sans">
          Enable the self-driving playtest agent! The player will autonomously roam, seek out and engage closest hostiles, navigate map constraints, disarm traps, open chests, and accumulate real game variables.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={() => {
              if (setIsAutoplayActive) {
                setIsAutoplayActive(!isAutoplayActive);
                triggerSuccessLog(isAutoplayActive ? "Autonomous Autoplay Deactivated." : "Autonomous Autoplay Agent Engaged!");
              }
            }}
            className={`flex-1 py-3 px-4 font-bold text-xs rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              isAutoplayActive
                ? 'bg-teal-950 border-teal-700 text-teal-300 hover:bg-teal-900'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className={`w-4 h-4 ${isAutoplayActive ? 'animate-pulse text-teal-400' : ''}`} />
            <span>{isAutoplayActive ? 'Halt Autoplay AI Agent' : 'Engage Autonomous AI Agent'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
