/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame } from 'lucide-react';

export interface OverforgeGaugeProps {
  overforgeHeat: number;
  setOverforgeHeat: (heat: number | ((prev: number) => number)) => void;
  overforgePowerMult: number;
  shatterChancePercent: number;
  backfireDmgPreview: number;
}

export const OverforgeGauge = React.memo<OverforgeGaugeProps>(({
  overforgeHeat,
  setOverforgeHeat,
  overforgePowerMult,
  shatterChancePercent,
  backfireDmgPreview,
}) => {
  const heatRatio = overforgeHeat / 100;

  const getHeatTitle = (heat: number) => {
    if (heat >= 95) return { name: '⚡ GOD-FORGED', color: 'text-amber-300 border-amber-400 bg-amber-500/20 shadow-amber-500/30' };
    if (heat >= 75) return { name: '🌋 INFERNAL', color: 'text-rose-400 border-rose-500 bg-rose-500/20 shadow-rose-500/30' };
    if (heat >= 50) return { name: '🔥 INCANDESCENT', color: 'text-orange-400 border-orange-500 bg-orange-500/20 shadow-orange-500/30' };
    if (heat >= 25) return { name: '⚡ OVER-HEATED', color: 'text-yellow-400 border-yellow-500 bg-yellow-500/20' };
    return { name: '🛡️ SAFE ANVIL (0% HEAT)', color: 'text-slate-400 border-slate-700 bg-slate-900/50' };
  };

  const heatStatus = getHeatTitle(overforgeHeat);

  return (
    <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-3.5 shadow-lg flex flex-col gap-2.5 my-2.5 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, ${heatRatio * 0.25}), transparent 70%)`
        }}
      />

      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 relative z-10">
        <div className="flex items-center gap-1.5">
          <Flame className={`w-3.5 h-3.5 ${overforgeHeat > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-200">
            ⚡ Over-Forging Risk / Reward Gauge
          </span>
        </div>
        <div className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border shadow-sm ${heatStatus.color}`}>
          {heatStatus.name}
        </div>
      </div>

      {/* Preset Heat Buttons */}
      <div className="grid grid-cols-5 gap-1 relative z-10">
        {[
          { label: '0% Safe', heat: 0, icon: '🛡️' },
          { label: '25% Warm', heat: 25, icon: '🔥' },
          { label: '50% Hot', heat: 50, icon: '🌋' },
          { label: '75% Extreme', heat: 75, icon: '⚡' },
          { label: '100% GOD', heat: 100, icon: '⚡' },
        ].map((preset) => (
          <button
            key={preset.heat}
            type="button"
            onClick={() => setOverforgeHeat(preset.heat)}
            className={`py-1 px-1 rounded text-[9.5px] font-mono font-bold transition-all border cursor-pointer ${
              overforgeHeat === preset.heat
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md scale-102'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {preset.icon} {preset.label}
          </button>
        ))}
      </div>

      {/* Interactive Heat Slider & Bellows Pump */}
      <div className="flex items-center gap-2.5 relative z-10 my-0.5">
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="flex justify-between text-[9.5px] font-mono text-slate-400">
            <span>Anvil Temperature</span>
            <span className="text-amber-400 font-bold">{overforgeHeat}% Heat</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={overforgeHeat}
            onChange={(e) => setOverforgeHeat(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg border border-slate-800"
          />
        </div>

        <button
          type="button"
          onClick={() => setOverforgeHeat((prev) => Math.min(100, typeof prev === 'number' ? prev + 15 : 15))}
          className="px-2 py-1 bg-gradient-to-r from-amber-600 to-orange-600 text-slate-950 font-bold text-[9.5px] rounded border border-amber-400 hover:brightness-110 active:scale-95 shadow-md flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Flame className="w-3 h-3 text-slate-950" />
          <span>Pump Bellows (+15%)</span>
        </button>
      </div>

      {/* Live Forecast Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-900/90 border border-slate-800/90 p-2 rounded-lg text-[9.5px] font-mono relative z-10">
        <div className="flex flex-col">
          <span className="text-slate-500 text-[8.5px] uppercase">Power Boost</span>
          <span className={`font-bold ${overforgeHeat > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {overforgePowerMult.toFixed(2)}x (+{Math.round((overforgePowerMult - 1) * 100)}%)
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-500 text-[8.5px] uppercase">Shatter Risk</span>
          <span className={`font-bold ${shatterChancePercent > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {shatterChancePercent > 0 ? `💀 ${shatterChancePercent}% Risk` : '100% Safe'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-500 text-[8.5px] uppercase">Heat Recoil</span>
          <span className={`font-bold ${backfireDmgPreview > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
            {backfireDmgPreview > 0 ? `🔥 -${backfireDmgPreview} HP` : '0 HP'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-500 text-[8.5px] uppercase">Shatter Salvage</span>
          <span className="text-emerald-400 font-bold">1x Scrap Mat</span>
        </div>
      </div>
    </div>
  );
});

export default OverforgeGauge;
