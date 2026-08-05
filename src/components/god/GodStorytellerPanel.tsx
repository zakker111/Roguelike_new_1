import React, { useState } from 'react';
import { Sparkles, Brain, AlertTriangle, Shield, Heart, Zap, RefreshCw, Eye } from 'lucide-react';
import { GameState } from '../../types';
import { getGMStorytellerState, setGMStorytellerState, GMPersonality, GM_ENCOUNTERS_DATABASE } from '../../utils/gmStoryteller';

interface GodStorytellerPanelProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerSuccessLog: (msg: string) => void;
}

export const GodStorytellerPanel: React.FC<GodStorytellerPanelProps> = ({
  gameState,
  setGameState,
  triggerSuccessLog,
}) => {
  const [gmState, setGmState] = useState(() => getGMStorytellerState());

  const handleSetPersonality = (personality: GMPersonality) => {
    const next = { ...gmState, personality };
    setGMStorytellerState(next);
    setGmState(next);
    triggerSuccessLog(`GM Storyteller personality updated to ${personality}`);
  };

  const handleToggleGifts = () => {
    const next = { ...gmState, disableGifts: !gmState.disableGifts };
    setGMStorytellerState(next);
    setGmState(next);
    triggerSuccessLog(`GM Gift Distribution ${next.disableGifts ? 'Disabled 🚫' : 'Enabled 🎁'}`);
  };

  const handleAdjustBoredom = (delta: number) => {
    const next = { ...gmState, boredom: Math.min(100, Math.max(0, gmState.boredom + delta)) };
    setGMStorytellerState(next);
    setGmState(next);
  };

  const handleAdjustTension = (delta: number) => {
    const next = { ...gmState, tension: Math.min(100, Math.max(0, gmState.tension + delta)) };
    setGMStorytellerState(next);
    setGmState(next);
  };

  const handleTriggerEncounter = (encounterId: string) => {
    const enc = GM_ENCOUNTERS_DATABASE.find((e) => e.id === encounterId);
    if (!enc) return;

    const res = enc.trigger(gameState, gmState);
    if (res.success && res.mutatedState) {
      setGameState((prev) => ({
        ...prev,
        ...res.mutatedState,
      }));
      triggerSuccessLog(`Triggered GM Encounter: "${enc.name}"!`);
    } else {
      triggerSuccessLog(`Encounter "${enc.name}" condition failed or disabled gifts!`);
    }
  };

  return (
    <div className="space-y-4 font-mono pb-4">
      <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-indigo-400 uppercase tracking-widest text-xs flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>Autonomous AI Storyteller GM Console</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Monitor and adjust dynamic GM mood, encounter triggers, tension level, and decision logic.
          </p>
        </div>
      </div>

      {/* Mood & Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Personality Selector */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">GM Archetype Personality</span>
          <div className="grid grid-cols-1 gap-1">
            {(['Benevolent', 'Intrigued', 'Mischievous', 'Sadistic', 'Apathetic'] as GMPersonality[]).map((p) => {
              const isCurrent = gmState.personality === p;
              return (
                <button
                  key={p}
                  onClick={() => handleSetPersonality(p)}
                  className={`px-2.5 py-1.5 rounded text-xs font-bold text-left transition-all border ${
                    isCurrent
                      ? 'bg-indigo-950/70 border-indigo-600 text-indigo-300'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span>{p === 'Benevolent' ? '😇' : p === 'Intrigued' ? '🧐' : p === 'Mischievous' ? '😼' : p === 'Sadistic' ? '💀' : '😐'} {p}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Gauges */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Storyteller Diagnostics</span>
          
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-400">Boredom Level:</span>
              <span className="text-amber-400 font-bold">{gmState.boredom}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded overflow-hidden border border-slate-800">
              <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${gmState.boredom}%` }} />
            </div>
            <div className="flex gap-1 mt-1">
              <button onClick={() => handleAdjustBoredom(-15)} className="px-2 py-0.5 bg-slate-900 text-[9px] rounded text-slate-400 hover:text-white border border-slate-800">-15%</button>
              <button onClick={() => handleAdjustBoredom(15)} className="px-2 py-0.5 bg-slate-900 text-[9px] rounded text-amber-400 hover:text-white border border-slate-800">+15%</button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-400">Tension Level:</span>
              <span className="text-rose-400 font-bold">{gmState.tension}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded overflow-hidden border border-slate-800">
              <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${gmState.tension}%` }} />
            </div>
            <div className="flex gap-1 mt-1">
              <button onClick={() => handleAdjustTension(-15)} className="px-2 py-0.5 bg-slate-900 text-[9px] rounded text-slate-400 hover:text-white border border-slate-800">-15%</button>
              <button onClick={() => handleAdjustTension(15)} className="px-2 py-0.5 bg-slate-900 text-[9px] rounded text-rose-400 hover:text-white border border-slate-800">+15%</button>
            </div>
          </div>

          <button
            onClick={handleToggleGifts}
            className={`w-full py-1.5 px-2 rounded text-[10px] font-bold border transition-all ${
              gmState.disableGifts
                ? 'bg-rose-950/40 border-rose-800 text-rose-400'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            }`}
          >
            {gmState.disableGifts ? '🚫 Gifts Restricted' : '🎁 Gifts Allowed'}
          </button>
        </div>

        {/* Manual Encounter Trigger Panel */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Manual Encounter Triggers</span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {GM_ENCOUNTERS_DATABASE.map((enc) => (
              <button
                key={enc.id}
                onClick={() => handleTriggerEncounter(enc.id)}
                className="w-full text-left p-2 bg-slate-900/60 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800 rounded text-[10px] transition-all group"
              >
                <div className="font-bold text-slate-300 group-hover:text-indigo-300">{enc.name}</div>
                <div className="text-[9px] text-slate-500 truncate">{enc.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Internal GM Log Terminal */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span>Internal GM Cognitive Log Feed:</span>
        </span>
        <div className="w-full h-36 bg-black/90 border border-slate-800 rounded-lg p-2.5 overflow-y-auto font-mono text-[10px] text-indigo-300 space-y-1">
          {gmState.thoughts && gmState.thoughts.length > 0 ? (
            gmState.thoughts.map((t, idx) => (
              <div key={idx} className="text-indigo-300">
                • {t}
              </div>
            ))
          ) : (
            <div className="text-slate-600 italic">No GM cognitive logs logged.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GodStorytellerPanel;
