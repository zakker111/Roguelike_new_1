import React, { useEffect, useState } from 'react';
import { Swords, Play, BookOpen } from 'lucide-react';
import { readPlayStats, recordGameStart, type PlayStats } from '../../utils/analytics';

export interface StartScreenProps {
  onStartNewGame: () => void;
}

const fmtDate = (iso: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

export const StartScreen: React.FC<StartScreenProps> = ({ onStartNewGame }) => {
  const [stats, setStats] = useState<PlayStats | null>(null);

  // Read the play-tracking cookie every time the start screen mounts.
  useEffect(() => {
    setStats(readPlayStats());
  }, []);

  // Handle "DESCEND": bump the cookie (times played + last played), then start the run.
  const handleDescend = () => {
    setStats(recordGameStart());
    onStartNewGame();
  };

  return (
    <div id="start-screen-menu" className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-950 text-center select-none">
      <div className="max-w-md bg-slate-900/40 p-8 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur relative overflow-hidden">
        {/* Ambient gold glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
        
        <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-5">
          <Swords className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>

        <h2 className="text-xl font-bold tracking-tight uppercase font-sans mb-1 text-slate-100">
          Assemble the Ultimate Alloy
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Enter modular chambers populated with strategic Goblins, Orcs, spellcasters, and spikes. 
          Gather Mithril, Obsidian blocks, and elemental crystals on the floor to construct fully custom physical properties.
        </p>

        <button
          id="start-running-btn"
          onClick={handleDescend}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold tracking-wide rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-amber-500/10 flex items-center justify-center gap-2 font-sans active:scale-[0.98]"
        >
          <Play className="w-4 h-4" />
          <span>DESCEND THE FORGE CHAMBERS</span>
        </button>

        {/* Play-tracking cookie summary (times played, last played, where you came from) */}
        {stats && (
          <div
            id="play-stats-card"
            className="mt-5 w-full text-left text-[10px] text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5 font-sans"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wide text-slate-300">Adventurer Log</span>
              <span className="text-amber-400 font-semibold">{stats.timesPlayed > 0 ? `${stats.timesPlayed} run${stats.timesPlayed === 1 ? '' : 's'} played` : 'First descent awaits'}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span>🕒 Last played: <strong className="text-slate-200">{fmtDate(stats.lastPlayed)}</strong></span>
              <span>📅 First seen: <strong className="text-slate-200">{fmtDate(stats.firstSeen)}</strong></span>
              <span className="col-span-2">
                🌍 Came from:{' '}
                <strong className="text-slate-200">
                  {stats.utmSource
                    ? `${stats.utmSource}${stats.utmCampaign ? ` (${stats.utmCampaign})` : ''}`
                    : stats.referrerDomain || 'Direct visit'}
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Manual Instructions Card */}
        <div className="mt-8 border-t border-slate-800/80 pt-5 text-left text-[11px] text-slate-400 flex flex-col gap-2.5">
          <div className="font-semibold text-slate-300 uppercase font-sans flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Tactical Primer:
          </div>
          <p>🖯 Move using <kbd className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-slate-200">WASD</kbd> or <kbd className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-slate-200">Numpad</kbd>, or clicking adjoining canvas tiles.</p>
          <p>⚔️ Stand close to enemies to slash, or stand away to fire magic projectiles.</p>
          <p>🎁 Pop treasure caches and break barrels to gather alloys, and avoid floor traps.</p>
          <p>⚠️ <strong>Scalable Challenge Limit:</strong> Spawning intensities, adversary damage capabilities, and elite perks scale progressively the longer you remain and the deeper you push.</p>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
