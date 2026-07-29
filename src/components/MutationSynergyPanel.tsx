import React from 'react';
import { Sparkles, Flame, Zap, Shield, AlertTriangle, Atom } from 'lucide-react';
import { DUAL_ELEMENT_SYNERGIES, resolveMutationSynergyChain } from '../utils/mutationSynergy';

interface MutationSynergyPanelProps {
  existingCatalysts?: string[];
  selectedCatalystType: string;
  mutationCount?: number;
  overforgeHeat?: number;
  compact?: boolean;
}

export const MutationSynergyPanel = React.memo<MutationSynergyPanelProps>(({
  existingCatalysts = [],
  selectedCatalystType,
  mutationCount = 0,
  overforgeHeat = 0,
  compact = false,
}) => {
  const result = resolveMutationSynergyChain(
    existingCatalysts,
    selectedCatalystType,
    mutationCount,
    overforgeHeat
  );

  const getStrainColor = (strain: number) => {
    if (strain >= 80) return { bg: 'bg-rose-500 animate-pulse', text: 'text-rose-400', border: 'border-rose-500/50' };
    if (strain >= 50) return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/50' };
    if (strain >= 25) return { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/50' };
    return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/50' };
  };

  const strainStyle = getStrainColor(result.unstableStrain);

  const getElementBadge = (type: string) => {
    switch (type) {
      case 'Fire': return { icon: '🔥', label: 'Fire', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
      case 'Frost': return { icon: '❄️', label: 'Frost', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'Lightning': return { icon: '⚡', label: 'Lightning', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' };
      case 'Shadow': return { icon: '🌑', label: 'Shadow', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'Poison': return { icon: '☠️', label: 'Poison', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      default: return { icon: '✨', label: type, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="bg-slate-950/90 border border-purple-500/30 rounded-xl p-3 shadow-xl my-2 flex flex-col gap-2.5 relative overflow-hidden">
      {/* Background Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 70% 30%, rgba(168, 85, 247, ${result.unstableStrain / 300}), transparent 70%)`
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 relative z-10">
        <div className="flex items-center gap-1.5">
          <Atom className="w-4 h-4 text-purple-400 animate-spin-slow" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-purple-200">
            ⚡ Unstable Mutation Synergy Chain
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm">
            Chain Lv {result.chainLevel}
          </span>
          {result.isOmegaResonance && (
            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400 shadow-sm animate-pulse">
              🌌 OMEGA
            </span>
          )}
        </div>
      </div>

      {/* Element Catalysts Stack */}
      <div className="flex flex-wrap items-center gap-1.5 relative z-10">
        <span className="text-[9.5px] font-mono text-slate-400">Infused Matrix:</span>
        {result.catalysts.map((cat, idx) => {
          const badge = getElementBadge(cat);
          return (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold border flex items-center gap-1 shadow-sm ${badge.color}`}
            >
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </span>
          );
        })}
      </div>

      {/* Active Dual-Element Synergies */}
      {result.activeSynergies.length > 0 ? (
        <div className="flex flex-col gap-1.5 relative z-10 bg-slate-900/80 border border-purple-900/40 p-2 rounded-lg">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Synergy Traits Unlocked:</span>
          </div>
          {result.activeSynergies.map((syn) => (
            <div key={syn.id} className="flex flex-col gap-0.5 text-[9.5px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <span>{syn.icon}</span>
                  <span>{syn.traitName}</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">+{syn.bonusPowerPct}% Power</span>
              </div>
              <p className="text-slate-400 text-[9px] leading-tight">{syn.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[9.5px] font-mono text-slate-400 italic bg-slate-900/50 p-1.5 rounded border border-slate-800 relative z-10">
          💡 Tip: Mutate this item with a second elemental catalyst type to unlock dual-element Synergy Traits!
        </div>
      )}

      {/* Mutagenic Strain Gauge */}
      <div className="flex flex-col gap-1 relative z-10">
        <div className="flex justify-between text-[9.5px] font-mono">
          <span className="text-slate-400">Mutagenic Strain Gauge:</span>
          <span className={`font-bold ${strainStyle.text}`}>
            {result.unstableStrain}% Strain {result.unstableStrain >= 80 ? '🔥 SUPERCRITICAL' : ''}
          </span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full border border-slate-800 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 rounded-full ${strainStyle.bg}`}
            style={{ width: `${result.unstableStrain}%` }}
          />
        </div>
      </div>

      {/* Forecast Matrix */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-[9.5px] font-mono relative z-10">
        <div className="flex flex-col">
          <span className="text-slate-500 text-[8.5px] uppercase">Synergy Multiplier</span>
          <span className="text-purple-300 font-bold">{result.powerMultiplier}x Power</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 text-[8.5px] uppercase">Surge Tier</span>
          <span className="text-amber-400 font-bold">
            {result.isOmegaResonance ? '🌌 OMEGA' : result.isSupercritical ? '⚡ Supercritical' : '🌀 Standard'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 text-[8.5px] uppercase">Synergy Count</span>
          <span className="text-emerald-400 font-bold">{result.activeSynergies.length} Dual Synergy</span>
        </div>
      </div>
    </div>
  );
});

export default MutationSynergyPanel;
