import React from 'react';
import { Heart } from 'lucide-react';
import { GameState, getMoonPhase } from '../../types';
import { formatGameTime } from '../../utils/overworld';

export interface MobileHudBarProps {
  gameState: GameState;
  effectiveMaxHp: number;
}

export const MobileHudBar: React.FC<MobileHudBarProps> = ({
  gameState,
  effectiveMaxHp,
}) => {
  const moonPhase = getMoonPhase(gameState.playerStats.turnsPlayed || 0);

  return (
    <div id="mobile-hud-bar" className="relative flex flex-col gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-900 shadow-xl select-none">
      {/* COMPACT MOBILE HUD */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 shadow grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono animate-fade-in">
        {/* HP HUD */}
        <div className="flex flex-col gap-1 bg-slate-950/60 p-2 rounded border border-slate-850">
          <div className="flex justify-between items-center text-[9px] text-slate-400">
            <span className="flex items-center gap-1 font-sans font-bold text-[8.5px] uppercase text-rose-400">
              <Heart className="w-3 h-3 text-rose-500" /> Vitals HP
            </span>
            <span className="text-slate-100 font-bold">{gameState.playerStats.hp}/{effectiveMaxHp}</span>
          </div>
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (gameState.playerStats.hp / effectiveMaxHp) * 100)}%` }}
            />
          </div>
        </div>

        {/* MP HUD */}
        <div className="flex flex-col gap-1 bg-slate-950/60 p-2 rounded border border-slate-850">
          <div className="flex justify-between items-center text-[9px] text-slate-400">
            <span className="flex items-center gap-1 font-sans font-bold text-[8.5px] uppercase text-sky-400">
              ⚡ Focus MP
            </span>
            <span className="text-slate-100 font-bold">{gameState.playerStats.mp}/{gameState.playerStats.maxMp}</span>
          </div>
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(gameState.playerStats.mp / gameState.playerStats.maxMp) * 100}%` }}
            />
          </div>
        </div>

        {/* GOLD */}
        <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded border border-slate-850 px-3">
          <span className="text-[9.5px] font-sans font-bold text-amber-500 uppercase flex items-center gap-1">🪙 Gold</span>
          <span className="text-amber-300 font-bold font-mono">{gameState.playerStats.gold}</span>
        </div>

        {/* XP / LEVEL HUD */}
        <div className="flex flex-col gap-1 bg-slate-950/60 p-2 rounded border border-slate-850">
          <div className="flex justify-between items-center text-[9px] text-slate-400">
            <span className="font-sans font-bold text-[8.5px] uppercase text-emerald-400">⭐ LVL {gameState.playerStats.level}</span>
            <span className="text-slate-300 font-bold">{gameState.playerStats.xp}/{gameState.playerStats.nextLevelXp}</span>
          </div>
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(gameState.playerStats.xp / gameState.playerStats.nextLevelXp) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* SUB BAR: Position, Time, and Moon Phase */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-lg px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <span>📍</span>
          <span className="text-slate-200 font-semibold font-sans">
            {gameState.isOverworld ? 'Sunder Wilderness' : `Dungeon Floor ${gameState.playerStats.depth}`}
          </span>
          <span className="text-slate-500">({gameState.playerX}, {gameState.playerY})</span>
        </div>

        {gameState.isOverworld && (
          <div className="flex items-center gap-1.5">
            <span>⚖️ Rep:</span>
            <span className={`font-bold ${(gameState.townReputation ?? 100) >= 80 ? 'text-emerald-400' : (gameState.townReputation ?? 100) >= 50 ? 'text-teal-400' : 'text-rose-400'}`}>
              {Math.round(gameState.townReputation ?? 100)}%
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-slate-300">
          <span>🕒 {formatGameTime(gameState.gameTime).timeStr}</span>
          <span title={moonPhase.description} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1 text-[9px] text-indigo-300 font-sans font-medium">
            {moonPhase.emoji} {moonPhase.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MobileHudBar;
