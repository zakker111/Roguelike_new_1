/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, ShieldAlert, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export interface OverforgeGaugeProps {
  overforgeHeat?: number;
  heat?: number;
  setOverforgeHeat?: (heat: number | ((prev: number) => number)) => void;
  setHeat?: (heat: number | ((prev: number) => number)) => void;
  overforgePowerMult?: number;
  shatterChancePercent?: number;
  backfireDmgPreview?: number;
  isAvailable?: boolean;
}

export const OverforgeGauge = React.memo<OverforgeGaugeProps>(({
  overforgeHeat,
  heat,
  setOverforgeHeat,
  setHeat,
  overforgePowerMult,
  shatterChancePercent,
  backfireDmgPreview,
  isAvailable = true,
}) => {
  const currentHeat = typeof overforgeHeat === 'number' ? overforgeHeat : typeof heat === 'number' ? heat : 0;
  const updateHeat = setOverforgeHeat || setHeat || (() => {});
  const heatRatio = Math.min(1.0, Math.max(0, currentHeat / 100));
  const powerMult = typeof overforgePowerMult === 'number' ? overforgePowerMult : (1.0 + heatRatio * 0.5);
  const shatterRisk = typeof shatterChancePercent === 'number' ? shatterChancePercent : Math.round(heatRatio * 65);
  const backfireDmg = typeof backfireDmgPreview === 'number' ? backfireDmgPreview : Math.floor(heatRatio * 15);

  const getHeatTitle = (val: number) => {
    if (val >= 95) return { name: '⚡ GOD-FORGED', color: 'text-amber-300 border-amber-400/60 bg-amber-500/20 shadow-amber-500/30' };
    if (val >= 75) return { name: '🌋 INFERNAL', color: 'text-rose-400 border-rose-500/60 bg-rose-500/20 shadow-rose-500/30' };
    if (val >= 50) return { name: '🔥 INCANDESCENT', color: 'text-orange-400 border-orange-500/60 bg-orange-500/20 shadow-orange-500/30' };
    if (val >= 25) return { name: '⚡ OVER-HEATED', color: 'text-yellow-400 border-yellow-500/60 bg-yellow-500/20' };
    return { name: '🛡️ SAFE ANVIL (0% HEAT)', color: 'text-slate-400 border-slate-700 bg-slate-900/70' };
  };

  const heatStatus = getHeatTitle(currentHeat);

  return (
    <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col gap-3 my-2.5 relative overflow-hidden">
      {/* Background radiant glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-2xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, ${heatRatio * 0.28}), transparent 75%)`,
        }}
      />

      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-950/50 border border-amber-500/30 flex items-center justify-center">
            <Flame className={`w-3.5 h-3.5 ${currentHeat > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div>
            <span className="text-xs font-black tracking-wider uppercase text-slate-100 flex items-center gap-1.5">
              <span>Over-Forging Risk / Reward Gauge</span>
            </span>
          </div>
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold border shadow-sm ${heatStatus.color}`}>
          {heatStatus.name}
        </div>
      </div>

      {/* Preset Heat Buttons */}
      <div className="grid grid-cols-5 gap-1.5 relative z-10">
        {[
          { label: '0% Safe', heat: 0, icon: '🛡️' },
          { label: '25% Warm', heat: 25, icon: '🔥' },
          { label: '50% Hot', heat: 50, icon: '🌋' },
          { label: '75% Extreme', heat: 75, icon: '⚡' },
          { label: '100% GOD', heat: 100, icon: '✨' },
        ].map((preset) => (
          <button
            key={preset.heat}
            type="button"
            onClick={() => updateHeat(preset.heat)}
            className={`py-1.5 px-1 rounded-xl text-[9.5px] font-mono font-bold transition-all border cursor-pointer ${
              currentHeat === preset.heat
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-300 shadow-md scale-[1.02]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {preset.icon} {preset.label}
          </button>
        ))}
      </div>

      {/* Interactive Heat Slider & Bellows Pump */}
      <div className="flex items-center gap-3 relative z-10 my-0.5">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Anvil Heat Level</span>
            <span className={`font-bold ${currentHeat > 50 ? 'text-rose-400' : currentHeat > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {currentHeat}% Temperature
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={currentHeat}
              onChange={(e) => updateHeat(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-900 rounded-lg border border-slate-800"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => updateHeat((prev: any) => Math.min(100, typeof prev === 'number' ? prev + 15 : 15))}
          className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-slate-950 font-black text-[10px] rounded-xl border border-amber-400 hover:brightness-110 active:scale-95 shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
        >
          <Flame className="w-3.5 h-3.5 text-slate-950" />
          <span>Pump Bellows (+15%)</span>
        </button>
      </div>

      {/* Live Forecast Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 border border-slate-800/90 p-2.5 rounded-xl text-[10px] font-mono relative z-10 shadow-inner">
        <div className="flex flex-col bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
          <span className="text-slate-400 text-[8.5px] uppercase font-bold">Power Boost</span>
          <span className={`font-bold text-xs ${currentHeat > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {powerMult.toFixed(2)}x (+{Math.round((powerMult - 1) * 100)}%)
          </span>
        </div>

        <div className="flex flex-col bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
          <span className="text-slate-400 text-[8.5px] uppercase font-bold">Shatter Risk</span>
          <span className={`font-bold text-xs ${shatterRisk > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {shatterRisk > 0 ? `💀 ${shatterRisk}% Risk` : '100% Safe'}
          </span>
        </div>

        <div className="flex flex-col bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
          <span className="text-slate-400 text-[8.5px] uppercase font-bold">Heat Recoil</span>
          <span className={`font-bold text-xs ${backfireDmg > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
            {backfireDmg > 0 ? `🔥 -${backfireDmg} HP` : '0 HP'}
          </span>
        </div>

        <div className="flex flex-col bg-slate-950/60 p-1.5 rounded-lg border border-slate-850">
          <span className="text-slate-400 text-[8.5px] uppercase font-bold">Shatter Salvage</span>
          <span className="text-emerald-400 font-bold text-xs">1x Scrap Mat</span>
        </div>
      </div>
    </div>
  );
});

export default OverforgeGauge;
