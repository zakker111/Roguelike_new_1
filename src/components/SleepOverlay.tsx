import React, { useState } from 'react';
import { X, Moon, Clock, Heart, Sparkles, Coffee } from 'lucide-react';
import { PlayerStats } from '../types';
import { formatGameTime } from '../utils/overworld';
import { playSound } from '../utils/audio';

interface SleepOverlayProps {
  playerStats: PlayerStats;
  currentGameTime: number; // in-game minutes
  onClose: () => void;
  onConfirmSleep: (hours: number, hpToHeal: number, mpToHeal: number) => void;
}

export default function SleepOverlay({
  playerStats,
  currentGameTime,
  onClose,
  onConfirmSleep,
}: SleepOverlayProps) {
  const [hours, setHours] = useState<number>(8); // Default to a standard 8 hours of sleep

  // Each hour restores 15% of Max HP (min 8) and 15% of Max MP (min 3)
  const hpHealedPerHour = Math.max(8, Math.round(playerStats.maxHp * 0.15));
  const mpHealedPerHour = Math.max(3, Math.round(playerStats.maxMp * 0.15));

  const totalHpHealed = Math.min(playerStats.maxHp - playerStats.hp, hours * hpHealedPerHour);
  const totalMpHealed = Math.min(playerStats.maxMp - playerStats.mp, hours * mpHealedPerHour);

  const finalHp = playerStats.hp + totalHpHealed;
  const finalMp = playerStats.mp + totalMpHealed;

  const currentFormatted = formatGameTime(currentGameTime);
  const futureGameTimeMinutes = currentGameTime + hours * 60;
  const futureFormatted = formatGameTime(futureGameTimeMinutes % 1440);
  const daysAdvanced = Math.floor(futureGameTimeMinutes / 1440);

  const incrementHours = () => {
    setHours((prev) => Math.min(24, prev + 1));
    playSound('loot');
  };

  const decrementHours = () => {
    setHours((prev) => Math.max(1, prev - 1));
    playSound('loot');
  };

  const selectPreset = (numHours: number) => {
    setHours(numHours);
    playSound('loot');
  };

  const handleConfirm = () => {
    // Call confirmation callback
    playSound('levelUp');
    onConfirmSleep(hours, totalHpHealed, totalMpHealed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
      <div 
        id="sleep-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full flex flex-col overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 border-amber-500/20"
      >
        {/* Header */}
        <div className="border-b border-slate-800 p-4.5 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <Moon className="w-5 h-5 text-amber-500 animate-pulse" />
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-slate-200">Cozy Inn Bed REST</span>
              <p className="text-[10px] text-slate-500 font-medium font-mono">CHOOSE SLEEP PASSAGE TIME</p>
            </div>
          </div>
          <button 
            id="close-sleep-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-slate-300 font-sans text-left">
          
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rest presets</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'Snooze', h: 1, icon: '☕' },
                { name: 'Catnap', h: 3, icon: '🐱' },
                { name: 'Night Rest', h: 8, icon: '🌌' },
                { name: 'Deep Slumber', h: 12, icon: '💤' }
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => selectPreset(preset.h)}
                  className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                    hours === preset.h
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-semibold'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/30 hover:border-slate-700'
                  }`}
                >
                  <span className="text-lg mb-1">{preset.icon}</span>
                  <span className="text-[10px] font-mono whitespace-nowrap">{preset.h}h</span>
                  <span className="text-[9px] scale-90 text-slate-500">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Dial Selector */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4.5 flex flex-col items-center justify-center space-y-3.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Configure Rest Hours</span>
            
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={decrementHours}
                disabled={hours <= 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-slate-900 cursor-pointer font-bold text-lg select-none"
              >
                -
              </button>
              
              <div className="text-center w-24">
                <span className="text-3xl font-bold font-mono text-amber-400">{hours}</span>
                <span className="text-xs font-medium text-slate-500 ml-1">Hour{hours > 1 && 's'}</span>
              </div>
              
              <button
                type="button"
                onClick={incrementHours}
                disabled={hours >= 24}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-slate-900 cursor-pointer font-bold text-lg select-none"
              >
                +
              </button>
            </div>
          </div>

          {/* Stat Restorations & Time Travel Previews */}
          <div className="space-y-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Restoration Forecast</span>

            <div className="grid grid-cols-2 gap-3.5">
              {/* HP restoration preview */}
              <div className="bg-slate-950/30 border border-slate-800/80 rounded-xl p-3 flex flex-col space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vitality (HP)</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-slate-500">
                    {playerStats.hp} <span className="text-[10px]">/ {playerStats.maxHp}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-slate-500">→</span>
                    <span className="text-sm font-mono text-emerald-400 font-bold">{finalHp}</span>
                  </div>
                </div>
                {totalHpHealed > 0 ? (
                  <span className="text-[9px] font-semibold text-emerald-500 font-mono">
                    +{totalHpHealed} HP (Restores +{hpHealedPerHour}/hr)
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500 font-mono">Already fully healed</span>
                )}
              </div>

              {/* MP restoration preview */}
              <div className="bg-slate-950/30 border border-slate-800/80 rounded-xl p-3 flex flex-col space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mana (MP)</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-slate-500">
                    {playerStats.mp} <span className="text-[10px]">/ {playerStats.maxMp}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-slate-500">→</span>
                    <span className="text-sm font-mono text-cyan-400 font-bold">{finalMp}</span>
                  </div>
                </div>
                {totalMpHealed > 0 ? (
                  <span className="text-[9px] font-semibold text-cyan-500 font-mono">
                    +{totalMpHealed} MP (Restores +{mpHealedPerHour}/hr)
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500 font-mono">Already full mana</span>
                )}
              </div>
            </div>

            {/* Time Passage preview */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Travel Passage</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {currentFormatted.timeStr} ({currentFormatted.period})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-amber-400 font-bold block">
                  → {futureFormatted.timeStr} ({futureFormatted.period})
                </span>
                {daysAdvanced > 0 && (
                  <span className="text-[9px] font-bold font-mono text-amber-400 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">
                    +{daysAdvanced} Day{daysAdvanced > 1 && 's'} Passed!
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Action Button Footer */}
        <div className="border-t border-slate-800 p-4 flex gap-3 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-800/30 transition-all cursor-pointer font-sans"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black tracking-wide shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer font-sans flex items-center justify-center gap-1.5 border border-amber-400/20"
          >
            <Moon className="w-4 h-4" />
            <span>Drift Into Sleep</span>
          </button>
        </div>

      </div>
    </div>
  );
}
