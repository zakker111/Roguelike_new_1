/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LockpickingStatus } from './types';

export interface TumblerCanvasRendererProps {
  dialRef: React.RefObject<HTMLDivElement | null>;
  cylinderRef: React.RefObject<HTMLDivElement | null>;
  wrenchRef: React.RefObject<HTMLDivElement | null>;
  pickRef: React.RefObject<HTMLDivElement | null>;
  durabilityBarRef: React.RefObject<HTMLDivElement | null>;
  durabilityTextRef: React.RefObject<HTMLSpanElement | null>;
  angleTextRef: React.RefObject<HTMLSpanElement | null>;
  sliderRef: React.RefObject<HTMLInputElement | null>;
  status: LockpickingStatus;
  activePicks: number;
  handleDialStart: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
  handleSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TumblerCanvasRenderer: React.FC<TumblerCanvasRendererProps> = ({
  dialRef,
  cylinderRef,
  wrenchRef,
  pickRef,
  durabilityBarRef,
  durabilityTextRef,
  angleTextRef,
  sliderRef,
  status,
  activePicks,
  handleDialStart,
  handleSliderChange,
}) => {
  return (
    <div className="flex flex-col items-center">
      {/* Graphic Interface Zone */}
      <div
        ref={dialRef}
        onMouseDown={handleDialStart}
        onTouchStart={handleDialStart}
        className="relative w-48 h-48 bg-slate-950/40 rounded-full border border-slate-800 shadow-inner flex items-center justify-center my-4 overflow-hidden cursor-crosshair select-none active:border-amber-500/50 transition-colors duration-150 touch-none"
      >
        {/* Center Lock Cylinder ring */}
        <div
          ref={cylinderRef}
          className="w-36 h-36 bg-slate-900 rounded-full border-4 border-slate-700 shadow-md flex items-center justify-center transition-transform relative"
          style={{
            transform: 'rotate(0deg)',
            left: '0px',
            top: '0px',
          }}
        >
          {/* Inner Keyhole Detail */}
          <div className="w-8 h-12 bg-slate-950 border-2 border-slate-600 rounded-full relative flex flex-col items-center justify-between py-1">
            <div className="w-3 h-3 bg-slate-800 rounded-full" />
            <div className="w-2 h-6 bg-slate-800 rounded-sm" />
          </div>

          {/* Decorative Lock Face Indicators */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-slate-800 rounded" />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-slate-800 rounded" />
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-1.5 bg-slate-800 rounded" />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-1.5 bg-slate-800 rounded" />
        </div>

        {/* Tension Screwdriver Wrench Representation */}
        <div
          ref={wrenchRef}
          className="absolute w-2 h-20 origin-bottom rounded bg-slate-400 shadow-lg pointer-events-none"
          style={{
            bottom: '50%',
            left: 'calc(50% - 4px)',
            transform: 'rotate(0deg)',
            transformOrigin: 'bottom center',
            transition: 'transform 0.05s linear',
          }}
        >
          <div className="w-4 h-4 -mt-1 -ml-1 bg-slate-500 rounded-full border border-slate-300" />
        </div>

        {/* Lockpick Representation */}
        <div
          ref={pickRef}
          className="absolute w-1 h-24 origin-bottom bg-amber-500/85 shadow-md pointer-events-none z-10"
          style={{
            bottom: '50%',
            left: 'calc(50% - 2px)',
            transform: 'rotate(0deg)',
            transformOrigin: 'bottom center',
          }}
        >
          <div className="absolute top-0 -left-1 w-3 h-3 bg-amber-400 rounded-full shadow border border-amber-300 animate-pulse" />
        </div>

        {/* Highlighted Alignment Feedback Zone */}
        <div className="absolute inset-0 border-2 border-transparent pointer-events-none rounded-full flex items-center justify-center">
          {status === 'SUCCESS' && (
            <div className="bg-emerald-500/20 text-emerald-400 p-2 text-[10px] rounded font-bold uppercase tracking-widest border border-emerald-500/30">
              Unlocked!
            </div>
          )}
          {status === 'NO_PICKS' && (
            <div className="bg-rose-500/20 text-rose-400 p-2 text-[10px] rounded font-bold uppercase tracking-widest border border-rose-500/30">
              No Picks
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls & States */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {/* Pick Rotation Slider */}
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-mono">
            <span>👈 LEFT</span>
            <span ref={angleTextRef} className="text-amber-400 font-bold">
              MOVE LOCKPICK ANGLE (90°)
            </span>
            <span>RIGHT 👉</span>
          </div>
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max="180"
            step="0.5"
            defaultValue="90"
            onChange={handleSliderChange}
            disabled={status === 'SUCCESS' || status === 'NO_PICKS' || status === 'SNAPPED'}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Lockpick Health & Active Quantity Stats */}
        <div className="flex gap-2 justify-between items-center text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-950/50 p-2 px-3 rounded border border-slate-850 select-none">
            <span className="text-slate-400 text-[10px]">REMAINING PICKS:</span>
            <span className={`font-bold ${activePicks > 0 ? 'text-amber-400' : 'text-rose-500'}`}>
              🔑 x{activePicks}
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-1 bg-slate-950/50 p-2 px-3 rounded border border-slate-850">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400 select-none">PICK DURABILITY:</span>
              <span ref={durabilityTextRef} className="font-bold text-emerald-400">
                100%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                ref={durabilityBarRef}
                className="h-full transition-all duration-75 bg-emerald-500"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
