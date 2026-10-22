/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Key } from 'lucide-react';
import { playSound } from '../../../utils/audio';
import { GameState } from '../../../types';

export interface GodLockpickingCardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onTriggerLockpicking?: () => void;
  onMinimizeGodPanel?: () => void;
  addLogMessage?: (msg: string, type?: string) => void;
  triggerSuccessLog?: (msg: string) => void;
  setLastTestOutcome: (msg: string | null) => void;
}

export const GodLockpickingCard: React.FC<GodLockpickingCardProps> = ({
  gameState,
  setGameState,
  onTriggerLockpicking,
  onMinimizeGodPanel,
  addLogMessage,
  triggerSuccessLog,
  setLastTestOutcome,
}) => {
  const [inlinePickAngle, setInlinePickAngle] = useState<number>(90);
  const [inlineTargetAngle] = useState<number>(68); // Sweet spot
  const [inlineTensionHolding, setInlineTensionHolding] = useState<boolean>(false);
  const [inlinePickDurability, setInlinePickDurability] = useState<number>(100);
  const [inlineCylinderRot, setInlineCylinderRot] = useState<number>(0);
  const [inlineLockSolved, setInlineLockSolved] = useState<boolean>(false);

  const lockpickCount = gameState.inventoryMaterials['mat_lockpick'] || 0;

  useEffect(() => {
    let interval: any;
    if (inlineTensionHolding && !inlineLockSolved) {
      interval = setInterval(() => {
        const offset = Math.abs(inlinePickAngle - inlineTargetAngle);
        const isSweetSpot = offset <= 10;

        if (isSweetSpot) {
          setInlineCylinderRot(rot => {
            const next = Math.min(90, rot + 3.5);
            if (next >= 90) {
              playSound('chest_open');
              setInlineLockSolved(true);
              setInlineTensionHolding(false);
              setLastTestOutcome('🔑 CLICK! Lock Tumbler Solved & Opened! (Sweet Spot Hit)');
              if (triggerSuccessLog) triggerSuccessLog('Lock Tumbler Solved Successfully!');
            }
            return next;
          });
        } else {
          playSound('bump');
          setInlinePickDurability(dur => {
            const next = Math.max(0, dur - 3.5);
            if (next <= 0) {
              playSound('defeat');
              setInlineTensionHolding(false);
              setLastTestOutcome('💥 Snap! Tension pick broke due to misaligned angle.');
            }
            return next;
          });
        }
      }, 40);
    } else if (!inlineTensionHolding && !inlineLockSolved && inlineCylinderRot > 0) {
      interval = setInterval(() => {
        setInlineCylinderRot(rot => Math.max(0, rot - 5));
      }, 30);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [inlineTensionHolding, inlinePickAngle, inlineTargetAngle, inlineLockSolved, inlineCylinderRot, triggerSuccessLog, setLastTestOutcome]);

  const handleResetInlineLock = () => {
    playSound('ui_click');
    setInlinePickDurability(100);
    setInlineCylinderRot(0);
    setInlineLockSolved(false);
    setInlineTensionHolding(false);
    setLastTestOutcome('🔄 Lock tumbler reset to 0° with fresh tension pick (100% durability).');
  };

  const handleAlignSweetSpot = () => {
    playSound('ui_click');
    setInlinePickAngle(inlineTargetAngle);
    setLastTestOutcome(`🎯 Pick snapped to sweet spot angle (${inlineTargetAngle}°)! Ready to turn.`);
  };

  const handlePulseTensionOneSec = () => {
    if (inlineLockSolved) {
      handleResetInlineLock();
    }
    playSound('ui_click');
    setInlineTensionHolding(true);
    setTimeout(() => {
      setInlineTensionHolding(false);
    }, 1200);
  };

  const handleInstantUnlockCheat = () => {
    playSound('chest_open');
    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        gold: prev.playerStats.gold + 150,
        xp: prev.playerStats.xp + 40
      }
    }));
    const msg = 'Instant Unlock: Opened Sovereign Vault! +150 Gold & +40 XP awarded.';
    setLastTestOutcome(msg);
    if (triggerSuccessLog) triggerSuccessLog(msg);
    if (addLogMessage) addLogMessage(`🔑 [DEV CHEAT] ${msg}`, 'loot');
  };

  const handleGrantLockpicks = () => {
    playSound('craft');
    setGameState(prev => ({
      ...prev,
      inventoryMaterials: {
        ...prev.inventoryMaterials,
        mat_lockpick: (prev.inventoryMaterials['mat_lockpick'] || 0) + 10,
        mat_skeleton_key: (prev.inventoryMaterials['mat_skeleton_key'] || 0) + 2
      }
    }));
    if (triggerSuccessLog) triggerSuccessLog('Granted +10 Tension Lockpicks and +2 Skeleton Keys!');
  };

  const handleLaunchLockpicking = () => {
    playSound('ui_click');
    setLastTestOutcome('Launched Lockpicking Tumbler Foreground Modal!');
    if (triggerSuccessLog) triggerSuccessLog('Launched Lockpicking Tumbler! Active in foreground.');
    if (addLogMessage) addLogMessage('🔑 [DEV] Launched Lockpicking Tumbler Modal.', 'system');
    if (onTriggerLockpicking) {
      onTriggerLockpicking();
    }
    if (onMinimizeGodPanel) {
      onMinimizeGodPanel();
    }
  };

  return (
    <div className="p-4 bg-slate-950/70 border border-purple-500/40 rounded-xl space-y-3 flex flex-col justify-between hover:border-purple-500/70 transition-all">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-300">Lockpicking Tumbler</h4>
              <span className="text-[10px] text-slate-400 font-mono">Tension Cylinder Physics</span>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-950 text-purple-300 border border-purple-800">
            Angle: {inlinePickAngle}°
          </span>
        </div>

        {/* In-Tab Interactive Simulator */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Live In-Tab Cylinder & Tension Simulator:
          </span>

          {/* Slider Steering */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Steer Pick Angle (0° - 180°):</span>
              <span className="font-bold text-purple-300">{inlinePickAngle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={inlinePickAngle}
              onChange={(e) => setInlinePickAngle(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Tension Hold Button */}
          <button
            onMouseDown={() => setInlineTensionHolding(true)}
            onMouseUp={() => setInlineTensionHolding(false)}
            onMouseLeave={() => setInlineTensionHolding(false)}
            onTouchStart={() => setInlineTensionHolding(true)}
            onTouchEnd={() => setInlineTensionHolding(false)}
            onTouchCancel={() => setInlineTensionHolding(false)}
            className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase border transition-all cursor-pointer select-none flex items-center justify-center gap-2 ${
              inlineLockSolved
                ? 'bg-emerald-600 text-slate-950 border-emerald-400 shadow'
                : inlineTensionHolding
                ? 'bg-purple-600 text-white border-purple-400 animate-pulse'
                : 'bg-slate-950 text-purple-300 border-purple-500/40 hover:bg-purple-950/40'
            }`}
          >
            <span>🔑 {inlineLockSolved ? 'LOCK UNLOCKED! (100%)' : inlineTensionHolding ? 'APPLYING TENSION...' : 'HOLD TO APPLY TENSION'}</span>
          </button>

          {/* Instant Test Helpers */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={handleAlignSweetSpot}
              className="py-1.5 px-2 bg-slate-950 hover:bg-purple-950/60 text-purple-300 border border-purple-800/60 rounded text-[10px] font-bold transition-all cursor-pointer truncate"
              title="Align angle exactly to sweet spot (68°)"
            >
              🎯 Snap 68°
            </button>
            <button
              type="button"
              onClick={handlePulseTensionOneSec}
              className="py-1.5 px-2 bg-slate-950 hover:bg-purple-950/60 text-purple-300 border border-purple-800/60 rounded text-[10px] font-bold transition-all cursor-pointer truncate"
              title="Test tension for 1.2s automatically"
            >
              ⚡ Pulse 1s
            </button>
            <button
              type="button"
              onClick={handleResetInlineLock}
              className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] font-bold transition-all cursor-pointer truncate"
              title="Reset cylinder and durability"
            >
              🔄 Reset
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
            <span>Picks: <strong className="text-purple-300">{lockpickCount}</strong></span>
            <span>Durability: <strong className="text-emerald-400">{inlinePickDurability}%</strong></span>
            <span>Cylinder Rot: <strong className="text-amber-400">{Math.round(inlineCylinderRot)}°</strong></span>
          </div>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            id="btn-launch-lockpicking-test"
            onClick={handleLaunchLockpicking}
            className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Foreground Modal</span>
          </button>
          <button
            onClick={handleInstantUnlockCheat}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Instant Unlock Sovereign Vault"
          >
            Instant Unlock 🔑
          </button>
          <button
            onClick={handleGrantLockpicks}
            className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            title="Grant +10 Picks & +2 Skeleton Keys"
          >
            +Picks
          </button>
        </div>
      </div>
    </div>
  );
};
