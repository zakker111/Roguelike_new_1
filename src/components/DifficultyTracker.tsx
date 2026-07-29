/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Clock, RefreshCw, AlertTriangle, ShieldAlert, Skull, Shield } from 'lucide-react';

interface DifficultyTrackerProps {
  turnsPlayed: number;
  realTimeSeconds: number;
  depth: number;
  defeatedEnemiesCount?: { [key: string]: number };
  clearedCampsCount?: number;
  playerStats?: { level: number; str: number; dex: number; int: number; cha: number; lck: number };
  currentWeapon?: { damage: number; name?: string } | null;
}

function DifficultyTrackerComponent({ 
  turnsPlayed, 
  realTimeSeconds, 
  depth,
  defeatedEnemiesCount,
  clearedCampsCount,
  playerStats,
  currentWeapon
}: DifficultyTrackerProps) {
  // Escalation math matching the spawn logic:
  const timeHours = realTimeSeconds / 3600;
  const turnIntensity = turnsPlayed / 100; // escalates difficulty every 100 turns
  
  let baseThreatFactor = 1.0 + (depth - 1) * 0.32 + turnIntensity * 0.06 + timeHours * 0.3;

  // Active player-driven Chaos suppression/mitigation!
  let chaosMitigation = 0;
  let bossesKilled = 0;
  let standardKilled = 0;
  if (defeatedEnemiesCount) {
    bossesKilled = defeatedEnemiesCount['Bosses'] || 0;
    standardKilled = defeatedEnemiesCount['Standard'] || 0;
    chaosMitigation += bossesKilled * 0.35;
    chaosMitigation += Math.floor(standardKilled / 10) * 0.05;
  }
  const campsCount = clearedCampsCount || 0;
  chaosMitigation += campsCount * 0.15;

  const baseThreatBeforeMitigation = baseThreatFactor;
  
  // Apply active suppression to lower the base threat level, keeping a floor of 0.70x
  baseThreatFactor = Math.max(0.70, baseThreatFactor - chaosMitigation);

  // Dynamic scaling: Scale enemy difficulty based on player stats and currently equipped weapon
  let playerScaleCoeff = 1.0;
  if (playerStats) {
    const pLevel = playerStats.level || 1;
    const totalStats = (playerStats.str || 10) + 
                        (playerStats.dex || 10) + 
                        (playerStats.int || 10) + 
                        (playerStats.cha || 10) + 
                        (playerStats.lck || 10);
    const statExcess = Math.max(0, totalStats - 50);
    const statBonusFactor = statExcess * 0.015; // +1.5% difficulty per allocated stat point above base 50
    const levelBonusFactor = Math.max(0, pLevel - 1) * 0.08; // +8% difficulty per level above level 1
    playerScaleCoeff += levelBonusFactor + statBonusFactor;
  }
  
  if (currentWeapon) {
    const weaponVal = Math.max(0, currentWeapon.damage || 0);
    const weaponBonusFactor = weaponVal * 0.04; // +4% difficulty per point of weapon damage
    playerScaleCoeff += weaponBonusFactor;
  }

  const globalThreatFactor = baseThreatFactor * playerScaleCoeff;

  // Format stopwatch clock
  const hours = Math.floor(realTimeSeconds / 3600);
  const minutes = Math.floor((realTimeSeconds % 3600) / 60);
  const seconds = realTimeSeconds % 60;
  const watchString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Calculated active indices
  const threatTier = Math.floor(globalThreatFactor);
  let threatLabel = 'Muted';
  let threatColor = 'text-green-400 border-green-500/10 bg-green-500/5';
  
  if (globalThreatFactor >= 4.0) {
    threatLabel = 'Cataclysmic Apocalypse';
    threatColor = 'text-red-500 border-red-500/30 bg-red-500/10 animate-pulse font-extrabold';
  } else if (globalThreatFactor >= 2.5) {
    threatLabel = 'Dreadful Hazard';
    threatColor = 'text-orange-500 border-orange-500/20 bg-orange-500/5 font-bold';
  } else if (globalThreatFactor >= 1.5) {
    threatLabel = 'Unstable Tension';
    threatColor = 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5 font-semibold';
  }

  // Active Global Escalations
  const escalations = [
    {
      id: 'depth_scaling',
      label: `Base Abyssal Depth (Floor ${depth})`,
      desc: `Monsters spawn with +${((depth - 1) * 32).toFixed(0)}% scaling Health & Attack statistics.`,
      active: depth > 1,
      icon: <Skull className="w-3.5 h-3.5 text-slate-400" />,
    },
    {
      id: 'turns_played',
      label: `Dread Exhaustion (${turnsPlayed} turns taken)`,
      desc: `Monsters gain +${(turnIntensity * 6).toFixed(0)}% damage. Attack speed thresholds compress.`,
      active: turnsPlayed >= 50,
      icon: <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />,
    },
    {
      id: 'time_played',
      label: `Void Contamination (${watchString} duration)`,
      desc: `Ancients invoke +${(timeHours * 30).toFixed(0)}% attack intensity. Special elite attributes unlocked.`,
      active: realTimeSeconds >= 120, // 2 minutes threshold for demo scaling
      icon: <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-xl text-slate-100 h-full">
      {/* Head */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Flame className="w-4.5 h-4.5 text-red-500 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider font-sans">
            Threat & Difficulty Matrix
          </h3>
        </div>
        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
          <span>Continuous Dynamic Scale</span>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500">
            Realtime Clock
          </span>
          <span className="text-sm font-bold font-mono text-amber-400 tracking-wider">
            {watchString}
          </span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500">
            Current Turns
          </span>
          <span className="text-sm font-bold font-mono text-blue-400">
            {turnsPlayed}
          </span>
        </div>
      </div>

      {/* Chaos Rating Card */}
      <div className={`p-3 rounded-lg border flex items-center justify-between transition-all ${threatColor}`}>
        <div className="flex flex-col">
          <div className="text-[9px] uppercase font-mono tracking-widest text-[#94a3b899]">
            Abyssal Chaos Coeff
          </div>
          <div className="text-sm tracking-wide mt-0.5">{threatLabel}</div>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-lg font-black font-mono tracking-tight text-white">
            {globalThreatFactor.toFixed(2)}x
          </span>
          <span className="text-[8px] font-mono text-slate-400">Threat Rating</span>
        </div>
      </div>

      {/* Active Player Suppression (Mitigation) Card */}
      <div className="bg-slate-950/60 rounded-lg p-3 border border-emerald-900/30 flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
          <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Active Chaos Suppression
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-400">
            -{chaosMitigation.toFixed(2)}x Threat Mitigation
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800/60 flex flex-col items-center text-center">
            <span className="text-slate-400">Bosses Slain</span>
            <span className="text-amber-400 font-bold text-xs mt-0.5">{bossesKilled}</span>
            <span className="text-[7.5px] text-slate-500 mt-0.5">-{ (bossesKilled * 0.35).toFixed(2) }x</span>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800/60 flex flex-col items-center text-center">
            <span className="text-slate-400">Camps Cleared</span>
            <span className="text-blue-400 font-bold text-xs mt-0.5">{campsCount}</span>
            <span className="text-[7.5px] text-slate-500 mt-0.5">-{ (campsCount * 0.15).toFixed(2) }x</span>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800/60 flex flex-col items-center text-center">
            <span className="text-slate-400">Foes Defeated</span>
            <span className="text-rose-400 font-bold text-xs mt-0.5">{standardKilled}</span>
            <span className="text-[7.5px] text-slate-500 mt-0.5">-{ (Math.floor(standardKilled / 10) * 0.05).toFixed(2) }x</span>
          </div>
        </div>
        <p className="text-[9px] text-slate-400 italic leading-normal text-center mt-0.5">
          Fight back! Clear wilderness camps and slay dungeon bosses to actively force down the Abyssal Chaos Coefficient.
        </p>
      </div>

      {/* Escalation log checklist */}
      <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
        <span className="text-[8px] font-mono uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-500" /> Escalation Status:
        </span>

        {escalations.map((esc) => (
          <div
            key={esc.id}
            className={`p-2.5 rounded border transition-colors flex items-start gap-2.5 ${
              esc.active
                ? 'bg-slate-950 border-red-500/20 opacity-100'
                : 'bg-slate-950/20 border-slate-800/40 opacity-40'
            }`}
          >
            <div className="mt-0.5 shrink-0">{esc.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-slate-200 flex justify-between">
                <span>{esc.label}</span>
                {esc.active && (
                  <span className="text-[8px] bg-red-950 text-red-400 border border-red-500/20 px-1 rounded uppercase tracking-wider font-mono font-bold animate-pulse">
                    Escalating
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-snug mt-1">{esc.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const DifficultyTracker = React.memo(DifficultyTrackerComponent);
export default DifficultyTracker;
