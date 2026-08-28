import React from 'react';
import { Trophy, Download, RefreshCcw } from 'lucide-react';
import { GameState } from '../../types';

export interface VictoryScreenProps {
  gameState: GameState;
  onDownloadLogs: () => void;
  onStartNewGame: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  gameState,
  onDownloadLogs,
  onStartNewGame,
}) => {
  return (
    <div id="victory-screen" className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center select-none">
      <div className="max-w-sm bg-slate-900 border border-amber-500/30 rounded-xl p-8 shadow-2xl relative overflow-hidden animate-glow">
        <div className="mx-auto w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-4">
          <Trophy className="w-6 h-6 text-yellow-400" />
        </div>

        <h2 className="text-md uppercase font-bold tracking-widest text-yellow-500">Legend Retrieved</h2>
        <p className="text-xs text-slate-400 leading-relaxed mt-2.5 font-sans">
          You conquered the 5 floors of the Forge Sanctum, constructed legendary alloys, and retrieved the artifact!
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 my-4 text-left font-mono text-[11px] flex flex-col gap-1.5 text-slate-300">
          <div className="text-slate-500 border-b border-slate-800/80 pb-1 uppercase text-[10px] font-semibold text-center mb-1">
            Final Statistics
          </div>
          <div className="flex justify-between">
            <span>Sanctity Level:</span>
            <span className="text-green-400 font-semibold">Max Lvl {gameState.playerStats.level}</span>
          </div>
          <div className="flex justify-between">
            <span>Turns Elapsed:</span>
            <span className="text-white font-semibold">{gameState.playerStats.turnsPlayed}</span>
          </div>
          <div className="flex justify-between">
            <span>Ultimate Weapon:</span>
            <span className="font-semibold" style={{ color: gameState.currentWeapon?.color }}>
              {gameState.currentWeapon?.name}
            </span>
          </div>
        </div>

        <button
          id="victory-download-logs-button"
          onClick={onDownloadLogs}
          className="w-full py-3 mb-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>DOWNLOAD PLAYTHROUGH LOGS</span>
        </button>

        <button
          id="victory-again-btn"
          onClick={onStartNewGame}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Conquer Again</span>
        </button>
      </div>
    </div>
  );
};

export default VictoryScreen;
