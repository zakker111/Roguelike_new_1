import React from 'react';
import { 
  Sparkles, ShieldAlert, Sparkle, 
  Activity, Zap, Compass, Shield, 
  Eye, Trophy, EyeOff, Brain, Clock, HelpCircle, AlertTriangle
} from 'lucide-react';
import { GameState } from '../types';
import { getGMStorytellerState } from '../utils/gmStoryteller';

interface ChaosConsoleProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: 'combat' | 'info' | 'loot' | 'system' | 'danger' | 'craft') => void;
}

export default function ChaosConsole({ gameState }: ChaosConsoleProps) {
  // Read current passive GM Storyteller / Chaos state
  const gmState = getGMStorytellerState();
  const turnsPlayed = gameState.playerStats.turnsPlayed || 0;
  
  // Chaos runs on a passive 15-turn periodic cycle
  const cycleLength = 15;
  const turnsSinceLastCycle = turnsPlayed % cycleLength;
  const turnsUntilNextSurge = cycleLength - turnsSinceLastCycle;
  const surgeProgressPercent = (turnsSinceLastCycle / cycleLength) * 100;

  // Read latest passive values from state
  const lastRoll = gmState.lastChaosRoll ?? null;
  const lastEffectName = gmState.lastChaosEffectName ?? 'Aetheric Sleep Mode';
  const lastEffectDesc = gmState.lastChaosEffectDesc ?? 'The spatial matrix is stable. Moving through Sunder corridors will accumulate raw atmospheric charge.';
  const history = gmState.chaosHistory ?? [];
  const thoughts = gmState.thoughts ?? [];

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 flex flex-col gap-4 shadow-2xl text-slate-100 h-full select-none">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider font-sans">
            PASSIVE CHAOS CORE & GM MONOCLE
          </h3>
        </div>
        <span className="text-[9px] font-mono text-purple-400 font-bold bg-purple-950/40 border border-purple-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
          AUTONOMOUS MONITOR
        </span>
      </div>

      {/* Countdown Visualizer */}
      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" /> Aetheric Charge Accumulator
          </span>
          <span className="text-[10px] font-mono font-bold text-purple-300">
            {turnsUntilNextSurge} turn{turnsUntilNextSurge > 1 ? 's' : ''} to Passive Surge
          </span>
        </div>

        {/* Dynamic progress bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div 
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
            style={{ width: `${Math.min(100, Math.max(4, surgeProgressPercent))}%` }}
          />
        </div>

        <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans">
          The Chaos Core gathers kinetic resonance as you step. Every <span className="text-purple-400 font-bold font-mono">15 turns</span>, it discharges automatically, rolling a cosmic d20 to trigger environmental catastrophes or divine graces.
        </p>
      </div>

      {/* Two Columns for Roll Outcome vs GM Live Monologue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Col: Core Roll details */}
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-850 flex flex-col gap-2.5 justify-between min-h-[160px]">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-mono tracking-widest text-purple-400 font-black">
              LATEST CORE DISCHARGE
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center font-mono font-extrabold text-base text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                {lastRoll !== null ? `d${lastRoll}` : '--'}
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold text-slate-200 truncate uppercase tracking-wide">
                  {lastEffectName}
                </div>
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                  AUTONOMOUS DISCHARGE
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 leading-relaxed italic border-t border-slate-850/60 pt-2 flex-grow">
            "{lastEffectDesc}"
          </p>
        </div>

        {/* Right Col: GM Storyteller Status */}
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-850 flex flex-col gap-2.5 justify-between min-h-[160px]">
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-mono tracking-widest text-amber-500 font-black flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-amber-400" /> STORYTELLER DISPOSITION
            </span>
            
            <div className="grid grid-cols-3 gap-1.5 pt-1.5">
              <div className="bg-slate-900/80 rounded-lg p-1.5 border border-slate-800 text-center">
                <div className="text-[8px] font-mono text-slate-500 uppercase font-bold">Personality</div>
                <div className="text-[10px] font-extrabold text-amber-400 truncate">{gmState.personality}</div>
              </div>
              <div className="bg-slate-900/80 rounded-lg p-1.5 border border-slate-800 text-center">
                <div className="text-[8px] font-mono text-slate-500 uppercase font-bold">Boredom</div>
                <div className="text-[10px] font-extrabold text-blue-400">{gmState.boredom} / 100</div>
              </div>
              <div className="bg-slate-900/80 rounded-lg p-1.5 border border-slate-800 text-center">
                <div className="text-[8px] font-mono text-slate-500 uppercase font-bold">Tension</div>
                <div className="text-[10px] font-extrabold text-rose-500">{gmState.tension} / 100</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-850/60 pt-2 text-[9.5px] text-slate-400 leading-snug">
            The Game Master operates with total tactical autonomy, observing your health, combat behavior, and exploration pacing to inject direct adjustments.
          </div>
        </div>

      </div>

      {/* Bottom Layout: Split into Historical Chronology & GM Thoughts Monologue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow min-h-0">
        
        {/* Chaos History Feed (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-1.5 min-h-[150px]">
          <span className="text-[9px] font-mono uppercase tracking-widest text-purple-400 border-b border-slate-800 pb-1 flex items-center gap-1 font-bold">
            <Activity className="w-3.5 h-3.5" /> Core Surge Chronology
          </span>
          <div className="flex-1 overflow-y-auto bg-slate-950/30 border border-slate-850/50 rounded-lg p-1.5 space-y-1 max-h-[160px] lg:max-h-none">
            {history.length === 0 ? (
              <div className="text-[10px] text-slate-500 text-center italic py-4">
                No automatic surges registered yet...
              </div>
            ) : (
              history.map((hist, idx) => (
                <div 
                  key={idx} 
                  className={`p-1.5 rounded text-[9.5px] border font-mono flex items-center justify-between ${
                    hist.type === 'good' 
                      ? 'bg-emerald-950/20 border-emerald-500/10 text-emerald-400' 
                      : hist.type === 'bad' 
                      ? 'bg-rose-950/20 border-rose-500/10 text-rose-400' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-1 truncate">
                    <span className="text-[8px] font-bold px-1 py-0.25 bg-slate-800/80 rounded text-slate-400">
                      T.{hist.turn}
                    </span>
                    <span className="truncate">{hist.name}</span>
                  </div>
                  <span className="shrink-0 font-bold font-mono text-[8px] bg-slate-850 px-1 py-0.25 rounded text-slate-400 ml-1.5">
                    Roll {hist.roll}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* GM Subconscious Monologue (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-1.5 min-h-[150px]">
          <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500 border-b border-slate-800 pb-1 flex items-center gap-1 font-bold">
            <Brain className="w-3.5 h-3.5" /> Storyteller Internal Monologue
          </span>
          <div className="flex-grow overflow-y-auto bg-slate-950/30 border border-slate-850/50 rounded-lg p-2 font-mono text-[9px] text-slate-400 space-y-2 max-h-[160px] lg:max-h-none select-text">
            {thoughts.slice(0, 10).map((thought, idx) => (
              <div 
                key={idx} 
                className={`pb-1.5 border-b border-slate-850/40 last:border-0 leading-relaxed ${
                  thought.includes("EMERGENCY") || thought.includes("CRITICAL")
                    ? 'text-rose-400 font-semibold'
                    : thought.includes("AUTONOMOUS INTERVENTION")
                    ? 'text-purple-400 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {thought}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
