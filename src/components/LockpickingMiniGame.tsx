/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Key, AlertTriangle, ShieldAlert, Award, RotateCcw } from 'lucide-react';
import {
  LockpickingMiniGameProps,
  useLockpickingPhysics,
  TumblerCanvasRenderer,
} from './minigames/lockpicking';

export { type LockpickingMiniGameProps };

export default function LockpickingMiniGame({
  onClose,
  onSuccess,
  onFail,
  lockpickCount,
  onConsumeLockpick,
  chestName = 'Locked Chest',
  skeletonKeyCount = 0,
  onUseSkeletonKey,
}: LockpickingMiniGameProps) {
  const {
    activePicks,
    status,
    dialRef,
    cylinderRef,
    wrenchRef,
    pickRef,
    durabilityBarRef,
    durabilityTextRef,
    angleTextRef,
    sliderRef,
    handleDialStart,
    handleSliderChange,
    resetAfterSnap,
    startPressingTension,
    stopPressingTension,
  } = useLockpickingPhysics({
    lockpickCount,
    onConsumeLockpick,
    onSuccess,
    onClose,
  });

  return (
    <div
      id="lockpicking-minigame-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col relative">
        {/* Header bar */}
        <div className="flex items-center justify-between p-3 px-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              PICKING LOCK: <span className="text-amber-400">{chestName}</span>
            </h3>
          </div>
          <button
            onClick={() => {
              if (onFail) onFail();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tumbler Canvas Interface */}
        <div className="p-4 flex flex-col items-center">
          <TumblerCanvasRenderer
            dialRef={dialRef}
            cylinderRef={cylinderRef}
            wrenchRef={wrenchRef}
            pickRef={pickRef}
            durabilityBarRef={durabilityBarRef}
            durabilityTextRef={durabilityTextRef}
            angleTextRef={angleTextRef}
            sliderRef={sliderRef}
            status={status}
            activePicks={activePicks}
            handleDialStart={handleDialStart}
            handleSliderChange={handleSliderChange}
          />

          {/* Interactive Controls & States */}
          <div className="w-full max-w-sm flex flex-col gap-3 mt-3">
            {/* Dynamic Status / Feedback Prompts */}
            <div className="min-h-[44px] flex items-center justify-center">
              {status === 'READY' && (
                <div className="text-[10px] text-slate-400 text-center font-mono">
                  ⌨️ Hold <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">SPACEBAR</kbd> or hold button below to apply tension.
                </div>
              )}
              {status === 'SHAKING' && (
                <div className="text-[11px] text-rose-400 font-bold text-center font-mono flex items-center gap-1.5 animate-bounce uppercase">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> LOCK JAMMED! RELEASE TENSION TO SAVE PICK!
                </div>
              )}
              {status === 'SNAPPED' && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-rose-500 font-bold uppercase font-mono tracking-wider">
                    💥 SNAP! Your lockpick snapped!
                  </span>
                  <button
                    onClick={resetAfterSnap}
                    className="mt-1 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold uppercase transition-all shadow cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Insert New Lockpick
                  </button>
                </div>
              )}
              {status === 'SUCCESS' && (
                <div className="text-center">
                  <span className="text-xs text-emerald-400 font-bold uppercase font-mono flex items-center gap-1 animate-pulse justify-center">
                    <Award className="w-4 h-4" /> SUCCESS! LOCK PICKED OPEN!
                  </span>
                </div>
              )}
              {status === 'NO_PICKS' && (
                <div className="text-center">
                  <span className="text-[11px] text-rose-400 font-bold uppercase font-mono flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 shrink-0" /> Out of lockpicks! Craft more in the Workbench!
                  </span>
                </div>
              )}
            </div>

            {/* Large Interactive Rotation Trigger Button */}
            <div className="grid grid-cols-1 gap-2">
              {skeletonKeyCount > 0 && onUseSkeletonKey && (
                <button
                  type="button"
                  onClick={onUseSkeletonKey}
                  className="py-3 bg-purple-950/70 hover:bg-purple-900 text-purple-300 hover:text-purple-100 rounded-lg text-xs font-bold uppercase border border-purple-500/40 hover:border-purple-500/80 transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] duration-200"
                >
                  💀 USE GRIM SKELETON KEY (INSTANT UNLOCK) (x{skeletonKeyCount})
                </button>
              )}

              <button
                onMouseDown={startPressingTension}
                onMouseUp={stopPressingTension}
                onMouseLeave={stopPressingTension}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startPressingTension();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopPressingTension();
                }}
                disabled={status === 'SUCCESS' || status === 'NO_PICKS' || status === 'SNAPPED'}
                className={`py-3.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 border transition-all select-none duration-150 touch-none ${
                  status === 'READY' || status === 'SHAKING'
                    ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 hover:border-slate-650 cursor-pointer active:scale-[0.98]'
                    : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                }`}
              >
                <span>🔑 APPLY TENSION (ROTATE LOCK)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-bold uppercase border border-slate-850 transition-all cursor-pointer text-center"
              >
                🚪 STEP AWAY FROM CHEST (CLOSE)
              </button>
            </div>
          </div>

          {/* Quick Manual & Instructions Footer */}
          <div className="mt-4 border-t border-slate-800/60 pt-3 w-full max-w-sm flex flex-col gap-1 text-[8px] text-slate-500 font-mono select-none">
            <div className="flex justify-between w-full">
              <span>💻 A/D or Arrows / Drag dial to steer</span>
              <span>📱 Touch & Drag lock dial to steer</span>
            </div>
            <div className="flex justify-between w-full mt-0.5">
              <span>⌨️ Spacebar / W to apply tension</span>
              <span>📱 Hold tension button to apply torque</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
