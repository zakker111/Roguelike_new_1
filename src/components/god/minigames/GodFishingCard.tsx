/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Anchor } from 'lucide-react';
import { playSound } from '../../../utils/audio';
import { GameState } from '../../../types';

export interface GodFishingCardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onTriggerFishing?: () => void;
  onMinimizeGodPanel?: () => void;
  addLogMessage?: (msg: string, type?: string) => void;
  triggerSuccessLog?: (msg: string) => void;
  setLastTestOutcome: (msg: string | null) => void;
}

export const GodFishingCard: React.FC<GodFishingCardProps> = ({
  gameState,
  setGameState,
  onTriggerFishing,
  onMinimizeGodPanel,
  addLogMessage,
  triggerSuccessLog,
  setLastTestOutcome,
}) => {
  const [inlineFishState, setInlineFishState] = useState<'IDLE' | 'CAST' | 'BITE' | 'REELING' | 'CAUGHT'>('IDLE');
  const [inlineReelProgress, setInlineReelProgress] = useState<number>(35);
  const [inlineReelingHold, setInlineReelingHold] = useState<boolean>(false);

  const fishingPoleCount = gameState.inventoryMaterials['mat_fishing_pole'] || 0;

  const handleInlineCast = () => {
    playSound('craft');
    setInlineFishState('CAST');
    setInlineReelProgress(35);
    setTimeout(() => {
      playSound('spell');
      setInlineFishState('BITE');
    }, 1200);
  };

  const handleInlineHookBite = () => {
    playSound('loot');
    setInlineFishState('REELING');
  };

  useEffect(() => {
    let interval: any;
    if (inlineFishState === 'REELING') {
      interval = setInterval(() => {
        setInlineReelProgress(prg => {
          const delta = inlineReelingHold ? 4 : -2.5;
          const next = Math.max(0, Math.min(100, prg + delta));
          if (next >= 100) {
            playSound('victory');
            setInlineFishState('CAUGHT');
            setLastTestOutcome('🎣 Landed Oakhaven Mirror Carp! Raw fish added.');
            if (triggerSuccessLog) triggerSuccessLog('Landed Oakhaven Mirror Carp!');
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [inlineFishState, inlineReelingHold, triggerSuccessLog, setLastTestOutcome]);

  const handleInstantCatchCheat = () => {
    playSound('victory');
    setGameState(prev => ({
      ...prev,
      inventoryMaterials: {
        ...prev.inventoryMaterials,
        mat_raw_fish: (prev.inventoryMaterials['mat_raw_fish'] || 0) + 1
      }
    }));
    const msg = 'Instant Catch: +1 Raw Fish added to materials storage!';
    setLastTestOutcome(msg);
    if (triggerSuccessLog) triggerSuccessLog(msg);
    if (addLogMessage) addLogMessage(`🎣 [DEV CHEAT] ${msg}`, 'loot');
  };

  const handleGrantFishingGear = () => {
    playSound('craft');
    setGameState(prev => ({
      ...prev,
      inventoryMaterials: {
        ...prev.inventoryMaterials,
        mat_fishing_pole: (prev.inventoryMaterials['mat_fishing_pole'] || 0) + 1
      },
      fishingPoleDurability: 10
    }));
    if (triggerSuccessLog) triggerSuccessLog('Granted +1 Solid Fishing Pole (10/10 Durability)!');
  };

  const handleLaunchFishing = () => {
    playSound('craft');
    setLastTestOutcome('Launched Wilderness Fishing Foreground Modal!');
    if (triggerSuccessLog) triggerSuccessLog('Launched Fishing Modal! Active in foreground.');
    if (addLogMessage) addLogMessage('🎣 [DEV] Launched Wilderness Fishing Modal.', 'system');
    if (onTriggerFishing) {
      onTriggerFishing();
    }
    if (onMinimizeGodPanel) {
      onMinimizeGodPanel();
    }
  };

  return (
    <div className="p-4 bg-slate-950/70 border border-sky-500/40 rounded-xl space-y-3 flex flex-col justify-between hover:border-sky-500/70 transition-all">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <Anchor className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-sky-300">Wilderness Fishing</h4>
              <span className="text-[10px] text-slate-400 font-mono">Bobber Strike & Reel Bar</span>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-950 text-sky-300 border border-sky-800">
            {inlineFishState}
          </span>
        </div>

        {/* In-Tab Interactive Simulator */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Live In-Tab Cast & Reel Simulator:
          </span>

          {inlineFishState === 'IDLE' && (
            <button
              onClick={handleInlineCast}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Cast Bobber into Water</span>
            </button>
          )}

          {inlineFishState === 'CAST' && (
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-center text-sky-300 animate-pulse">
              🏮 Bobber drifting on current... Waiting for strike...
            </div>
          )}

          {inlineFishState === 'BITE' && (
            <button
              onClick={handleInlineHookBite}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-lg text-xs animate-bounce cursor-pointer uppercase tracking-wider"
            >
              💥 BITE! HOOK FISH NOW!
            </button>
          )}

          {(inlineFishState === 'REELING' || inlineFishState === 'CAUGHT') && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Reel Tension:</span>
                <span className="font-bold text-sky-400">{Math.round(inlineReelProgress)}% / 100%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-sky-500 transition-all duration-100"
                  style={{ width: `${inlineReelProgress}%` }}
                />
              </div>
              {inlineFishState === 'REELING' && (
                <button
                  onMouseDown={() => setInlineReelingHold(true)}
                  onMouseUp={() => setInlineReelingHold(false)}
                  onMouseLeave={() => setInlineReelingHold(false)}
                  onTouchStart={() => setInlineReelingHold(true)}
                  onTouchEnd={() => setInlineReelingHold(false)}
                  onTouchCancel={() => setInlineReelingHold(false)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs cursor-pointer select-none"
                >
                  ⚓ {inlineReelingHold ? 'REELING TIGHT...' : 'HOLD TO REEL IN'}
                </button>
              )}
              {inlineFishState === 'CAUGHT' && (
                <button
                  onClick={() => {
                    setInlineFishState('IDLE');
                    setInlineReelProgress(35);
                  }}
                  className="w-full py-2 bg-emerald-600 text-slate-950 font-bold rounded text-xs cursor-pointer"
                >
                  🏆 Capture Complete! Reset Reel
                </button>
              )}
            </div>
          )}

          {/* Fishing Quick Test Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                playSound('trap');
                setInlineFishState('BITE');
                setLastTestOutcome('⚡ Fish biting immediately!');
              }}
              className="py-1.5 px-2 bg-slate-950 hover:bg-sky-950/60 text-sky-300 border border-sky-800/60 rounded text-[10px] font-bold transition-all cursor-pointer truncate"
              title="Force immediate fish bite"
            >
              💥 Force Bite
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('loot');
                setInlineFishState('REELING');
                setInlineReelProgress(80);
                setLastTestOutcome('🎣 Auto-advanced to 80% tension.');
              }}
              className="py-1.5 px-2 bg-slate-950 hover:bg-sky-950/60 text-sky-300 border border-sky-800/60 rounded text-[10px] font-bold transition-all cursor-pointer truncate"
              title="Jump to 80% reel progress"
            >
              ⚡ Jump 80%
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('ui_click');
                setInlineFishState('IDLE');
                setInlineReelProgress(35);
                setInlineReelingHold(false);
                setLastTestOutcome('🔄 Fishing rod line reset.');
              }}
              className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] font-bold transition-all cursor-pointer truncate"
              title="Reset fishing state"
            >
              🔄 Reset
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
            <span>Poles: <strong className="text-sky-300">{fishingPoleCount}</strong></span>
            <span>Durability: <strong className="text-emerald-400">{gameState.fishingPoleDurability ?? 7}/7</strong></span>
          </div>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            id="btn-launch-fishing-test"
            onClick={handleLaunchFishing}
            className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 active:scale-98 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Foreground Modal</span>
          </button>
          <button
            onClick={handleInstantCatchCheat}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Instant Fish Catch"
          >
            Instant Catch 🐟
          </button>
          <button
            onClick={handleGrantFishingGear}
            className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            title="Grant +1 Fishing Pole"
          >
            +Rod
          </button>
        </div>
      </div>
    </div>
  );
};
