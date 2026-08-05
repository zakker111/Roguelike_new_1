import React from 'react';
import { History, Play, Pause, SkipBack, SkipForward, Activity, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { GameState } from '../../types';

interface GodReplaySimulatorProps {
  gameState: GameState;
  replayPayload?: {
    snapshots: GameState[];
    actions: string[];
  };
  currentReplayIdx: number;
  setCurrentReplayIdx: (idx: number) => void;
  replayIsPlaying: boolean;
  setReplayIsPlaying: (playing: boolean) => void;
  replaySpeed: number;
  setReplaySpeed: (speed: number) => void;
  onRunSmokeTests?: () => void;
  smokeTestResults?: Array<{ name: string; status: 'passed' | 'failed' | 'pending'; details?: string }>;
}

export const GodReplaySimulator: React.FC<GodReplaySimulatorProps> = ({
  gameState,
  replayPayload,
  currentReplayIdx,
  setCurrentReplayIdx,
  replayIsPlaying,
  setReplayIsPlaying,
  replaySpeed,
  setReplaySpeed,
  onRunSmokeTests,
  smokeTestResults = []
}) => {
  const maxSnapshots = replayPayload?.snapshots.length || 0;

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
        <div>
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Turn-by-Turn Action Replay & Simulator</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Scrub back in time to inspect tile matrices, enemy positioning, and player decisions step-by-step.
          </p>
        </div>
        {onRunSmokeTests && (
          <button
            onClick={onRunSmokeTests}
            className="px-3 py-1.5 bg-teal-950 hover:bg-teal-900 border border-teal-700/60 text-teal-300 font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>Run Automated Smoke Suite</span>
          </button>
        )}
      </div>

      {maxSnapshots > 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              Snapshot Frame #{currentReplayIdx + 1} / {maxSnapshots}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              Speed: {replaySpeed}ms / turn
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentReplayIdx(Math.max(0, currentReplayIdx - 1));
                setReplayIsPlaying(false);
              }}
              disabled={currentReplayIdx === 0}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded disabled:opacity-30 cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setReplayIsPlaying(!replayIsPlaying)}
              className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                replayIsPlaying ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {replayIsPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setCurrentReplayIdx(Math.min(maxSnapshots - 1, currentReplayIdx + 1));
                setReplayIsPlaying(false);
              }}
              disabled={currentReplayIdx >= maxSnapshots - 1}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded disabled:opacity-30 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="0"
              max={maxSnapshots - 1}
              value={currentReplayIdx}
              onChange={(e) => {
                setCurrentReplayIdx(parseInt(e.target.value));
                setReplayIsPlaying(false);
              }}
              className="flex-1 accent-emerald-500 cursor-ew-resize h-1.5"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
            <span>Replay Playback Speed:</span>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={replaySpeed}
              onChange={(e) => setReplaySpeed(parseInt(e.target.value))}
              className="w-32 accent-amber-500 cursor-ew-resize h-1.5"
            />
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg text-center space-y-1">
          <p className="text-xs text-slate-300 font-bold">No Active Turn Recording Loaded</p>
          <p className="text-[11px] text-slate-400">
            Take movement steps, attack enemies, or cast spell scrolls in the main game view to generate historic replay frames automatically.
          </p>
        </div>
      )}

      {/* Smoke Test Suite Results */}
      {smokeTestResults.length > 0 && (
        <div className="space-y-2 border-t border-slate-800/80 pt-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>Automated Suite Verification Matrix</span>
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {smokeTestResults.map((t, idx) => (
              <div
                key={idx}
                className={`p-2 rounded border text-xs flex items-center justify-between ${
                  t.status === 'passed'
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                    : t.status === 'failed'
                    ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {t.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : t.status === 'failed' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Activity className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
                  )}
                  <span className="font-bold">{t.name}</span>
                </div>
                {t.details && <span className="text-[10px] font-mono opacity-80">{t.details}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
