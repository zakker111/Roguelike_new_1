import React from 'react';
import { AlertCircle, Download, RefreshCcw } from 'lucide-react';
import { GameState } from '../../types';

export interface GameOverScreenProps {
  gameState: GameState;
  onDownloadLogs: () => void;
  onStartNewGame: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  gameState,
  onDownloadLogs,
  onStartNewGame,
}) => {
  return (
    <div id="game-over-screen" className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center select-none">
      <div className="max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
        <div className="mx-auto w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        
        <h2 className="text-md uppercase font-bold tracking-widest text-[#ef444499]">The Void Claims You</h2>
        <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
          Your vital patterns disintegrated in the depths of Abyssal Floor {gameState.playerStats.depth}. 
          The chaos elements outpaced your survival.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 my-4 text-left font-mono text-[11px] flex flex-col gap-1.5 text-slate-300">
          <div className="text-slate-500 border-b border-slate-800 pb-1 uppercase text-[10px] font-semibold text-center mb-1">
            Sanctum Run Assessment
          </div>
          <div className="flex justify-between">
            <span>Floors Cleared:</span>
            <span className="text-white font-semibold">{gameState.playerStats.depth}</span>
          </div>
          <div className="flex justify-between">
            <span>Turns Kept:</span>
            <span className="text-blue-400 font-semibold">{gameState.playerStats.turnsPlayed}</span>
          </div>
          <div className="flex justify-between">
            <span>Gold Plundered:</span>
            <span className="text-yellow-400 font-semibold">{gameState.playerStats.gold}</span>
          </div>
          <div className="flex justify-between">
            <span>Forged Masterpiece:</span>
            <span className="font-semibold" style={{ color: gameState.currentWeapon?.color }}>
              {gameState.currentWeapon?.name}
            </span>
          </div>
        </div>

        <button
          id="download-logs-button"
          onClick={onDownloadLogs}
          className="w-full py-3 mb-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>DOWNLOAD PLAYTHROUGH LOGS</span>
        </button>

        <button
          id="try-again-button"
          onClick={onStartNewGame}
          className="w-full py-3 bg-slate-100 hover:bg-white text-slate-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>FORGE NEW DESCENT</span>
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
