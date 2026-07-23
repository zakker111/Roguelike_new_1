/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Award, Shield, Swords, Flame, Heart, Cpu } from 'lucide-react';
import { SanctumRelic } from '../utils/relics';
import { playSound } from '../utils/audio';

interface SanctumRelicsDraftOverlayProps {
  draft: SanctumRelic[];
  onSelectRelic: (relic: SanctumRelic) => void;
}

export default function SanctumRelicsDraftOverlay({ draft, onSelectRelic }: SanctumRelicsDraftOverlayProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSelect = (relic: SanctumRelic) => {
    playSound('levelUp');
    onSelectRelic(relic);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in overflow-y-auto">
      {/* Decorative stars and blueprint mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px] opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-y-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col items-center text-center space-y-6">
        
        {/* Glow accent at the top */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* Header */}
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold tracking-widest px-3 py-1 rounded-full uppercase animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Divine Sanctum Selection</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-sans uppercase">
            Choose a Sanctum Relic
          </h2>
          <p className="text-xs text-slate-400 max-w-lg leading-relaxed font-sans">
            Your level has elevated, unlocking the cosmic gateway. Choose one legendary artifact from the ancient vault to fuse permanently into your soul.
          </p>
        </div>

        {/* Draft Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-4 z-10">
          {draft.map((relic, idx) => {
            const isHovered = hoveredIndex === idx;
            
            let rarityStyle = 'text-slate-400 bg-slate-950 border-slate-850';
            let bgGlow = 'from-slate-900 to-slate-950';
            if (relic.rarity === 'Rare') {
              rarityStyle = 'text-amber-400 bg-amber-950/40 border-amber-900/40';
              bgGlow = 'from-slate-900 via-slate-950 to-amber-950/10';
            } else if (relic.rarity === 'Legendary') {
              rarityStyle = 'text-rose-400 bg-rose-950/40 border-rose-900/40';
              bgGlow = 'from-slate-900 via-slate-950 to-rose-950/15 animate-pulse-slow';
            }

            return (
              <div
                id={`relic-card-${relic.id}`}
                key={relic.id}
                onMouseEnter={() => {
                  setHoveredIndex(idx);
                  playSound('loot');
                }}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleSelect(relic)}
                className={`group relative border rounded-xl p-5 cursor-pointer text-left transition-all duration-300 flex flex-col justify-between space-y-4 select-none min-h-[250px] ${
                  isHovered 
                    ? `${relic.borderColor} bg-slate-900 shadow-xl scale-[1.02] -translate-y-1` 
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-950'
                }`}
                style={{
                  boxShadow: isHovered ? `0 10px 25px -5px rgba(245, 158, 11, 0.15)` : 'none'
                }}
              >
                {/* Rarity & Icon Row */}
                <div className="flex justify-between items-start">
                  <div className="text-3xl filter drop-shadow group-hover:scale-110 transition-transform duration-300">
                    {relic.icon}
                  </div>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest border px-2 py-0.5 rounded ${rarityStyle}`}>
                    {relic.rarity}
                  </span>
                </div>

                {/* Info block */}
                <div className="space-y-1.5 flex-1 pt-3">
                  <h3 className={`font-bold text-sm tracking-wide font-sans group-hover:text-amber-400 transition-colors ${relic.color}`}>
                    {relic.name}
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed">
                    {relic.description}
                  </p>
                </div>

                {/* Effect Details Panel */}
                <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-[10px] font-mono text-amber-300 leading-normal flex items-start gap-1.5 mt-2">
                  <span className="text-xs pt-0.5">⚡</span>
                  <span>{relic.details}</span>
                </div>

                {/* Choose Button visual */}
                <div className={`text-center font-bold text-[10px] uppercase font-mono tracking-widest py-1.5 rounded transition-all mt-4 border ${
                  isHovered 
                    ? 'bg-amber-500 text-slate-950 border-amber-600 font-black' 
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  Select Artifact
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer warning */}
        <div className="text-[10px] text-slate-500 font-mono z-10">
          ⚠️ Relic selections are fused permanently for this game run. Pick wisely to synergize with your current class build.
        </div>
      </div>
    </div>
  );
}
