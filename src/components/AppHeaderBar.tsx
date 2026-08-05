import React from 'react';
import { Swords } from 'lucide-react';
import { GameState } from '../types';

interface AppHeaderBarProps {
  isPlaying: boolean;
  activeMobileView: boolean;
  gameState: GameState;
  formatGameTime: (time: number) => { timeStr: string; period: string };
  climbStairsUpToOverworld: () => void;
  climbToPreviousDepth: () => void;
  forceLayoutMode: 'auto' | 'mobile' | 'desktop';
  setForceLayoutMode: React.Dispatch<React.SetStateAction<'auto' | 'mobile' | 'desktop'>>;
  isMuted: boolean;
  toggleAudioMute: () => boolean;
  setIsMuted: (muted: boolean) => void;
  getAudioSettings: () => { isAudioMuted: boolean };
  setIsAudioSettingsOpen: (open: boolean) => void;
  setIsHelpOpen: (open: boolean) => void;
  playSound: (sound: string) => void;
  setActiveTab: (tab: any) => void;
  setIsGodPanelOpen: (open: boolean) => void;
  setIsGmPanelOpen: (open: boolean) => void;
  setIsGameOver: (gameOver: boolean) => void;
}

export const AppHeaderBar: React.FC<AppHeaderBarProps> = ({
  isPlaying,
  activeMobileView,
  gameState,
  formatGameTime,
  climbStairsUpToOverworld,
  climbToPreviousDepth,
  forceLayoutMode,
  setForceLayoutMode,
  isMuted,
  toggleAudioMute,
  setIsMuted,
  getAudioSettings,
  setIsAudioSettingsOpen,
  setIsHelpOpen,
  playSound,
  setActiveTab,
  setIsGodPanelOpen,
  setIsGmPanelOpen,
  setIsGameOver
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 py-3 px-4 lg:py-3.5 lg:px-6 flex flex-col md:flex-row gap-3.5 items-center justify-between shadow-md select-none">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="bg-amber-500/10 p-1.5 border border-amber-500/20 rounded-lg">
          <Swords className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wider font-sans uppercase text-slate-100 flex items-center gap-1.5">
            <span>Dungeon Crafting Roguelike</span>
            {activeMobileView && <span className="text-[9px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded-full font-bold">MOBILE MODE</span>}
          </h1>
          <p className="text-[10px] text-slate-400 leading-normal">
            Classical turn-based grid RPG with modular alloy assembly systems
          </p>
        </div>
      </div>

      {isPlaying && (
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
          {/* Clock ticker HUD representation */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 select-none shadow-inner w-full sm:w-auto justify-center">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
            {gameState.isArena ? (
              <span className="text-red-400 font-bold tracking-wider animate-pulse">⚔️ SANDBOX ARENA</span>
            ) : gameState.isOverworld ? (
              <span className="text-amber-500 font-bold">🌍 OVERWORLD</span>
            ) : (
              <span className="text-purple-400 font-bold">DUNGEON {gameState.playerStats.depth}F</span>
            )}
            <span className="text-slate-700">|</span>
            <span className="text-amber-400 font-extrabold text-[13px] md:text-[14px] bg-slate-900 border border-slate-750 px-2.5 py-0.5 rounded shadow tracking-wide animate-pulse">
              {(() => {
                const formatted = formatGameTime(gameState.gameTime);
                return `${formatted.timeStr} (${formatted.period})`;
              })()}
            </span>
            <span className="text-slate-700">|</span>
            {/* Season Display Badge */}
            <span className={`px-2.5 py-0.5 rounded border text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1 shadow-sm select-none ${
              gameState.season === 'spring' 
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-400' 
                : gameState.season === 'summer' 
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-400 animate-pulse' 
                : gameState.season === 'autumn'
                ? 'bg-orange-950/40 border-orange-500/30 text-orange-400'
                : 'bg-sky-950/40 border-sky-500/30 text-sky-300 animate-pulse'
            }`}>
              {gameState.season === 'spring' && '🌸 Spring'}
              {gameState.season === 'summer' && '☀️ Summer'}
              {gameState.season === 'autumn' && '🍂 Autumn'}
              {gameState.season === 'winter' && '❄️ Winter'}
            </span>
            <span className="text-slate-700">|</span>
            <span>Turns: <strong>{gameState.playerStats.turnsPlayed}</strong></span>
          </div>

          {/* Stairs climb up helper */}
          {!gameState.isOverworld && gameState.playerStats.depth >= 1 && (
            <button
              id="climb-up-stairs-btn"
              onClick={gameState.playerStats.depth === 1 ? climbStairsUpToOverworld : climbToPreviousDepth}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1 shadow animate-pulse w-full sm:w-auto justify-center"
              title={gameState.playerStats.depth === 1 ? "Climb back out onto the Overworld" : "Climb back up to the previous dungeon floor"}
            >
              {gameState.playerStats.depth === 1 ? "🪜 Exit to Overworld" : `🪜 Climb to Floor ${gameState.playerStats.depth - 1}`}
            </button>
          )}

          {/* Quick Panel HUD Buttons */}
          <div className="flex gap-1 bg-slate-950/40 p-1 border border-slate-800 rounded-lg w-full sm:w-auto justify-center flex-wrap">
            <button
              onClick={() => {
                setForceLayoutMode(prev => prev === 'mobile' ? 'desktop' : 'mobile');
              }}
              className={`px-2 py-1 text-[10px] rounded border flex items-center gap-1 cursor-pointer font-bold transition-all ${
                activeMobileView 
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 font-extrabold shadow-sm' 
                  : 'bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-800'
              }`}
              title={`Layout mode: ${forceLayoutMode}. Click to toggle.`}
            >
              <span>{activeMobileView ? '📱 Mobile View' : '💻 Windows View'}</span>
            </button>

            <button
              id="quick-mute-btn"
              onClick={() => {
                const newMuteState = toggleAudioMute();
                setIsMuted(newMuteState);
              }}
              className={`px-2 py-1 text-[10px] rounded border flex items-center gap-1 cursor-pointer font-bold transition-all ${
                isMuted
                  ? 'bg-red-950/90 border-red-500/60 text-red-300 hover:bg-red-900 shadow animate-pulse'
                  : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
              }`}
              title={isMuted ? "Unmute All Sounds" : "Instant 1-Click Mute All Sounds"}
            >
              <span>{isMuted ? '🔇 Muted' : '🔊 Mute'}</span>
            </button>

            <button
              onClick={() => {
                setIsMuted(getAudioSettings().isAudioMuted);
                setIsAudioSettingsOpen(true);
              }}
              className="px-2 py-1 bg-slate-900 hover:bg-emerald-950/60 text-[10px] text-emerald-400 rounded border border-emerald-500/20 flex items-center gap-1 cursor-pointer font-bold"
              title="Procedural Spatial Audio & Dynamic Soundscape Settings Sliders"
            >
              <span>⚙️ Audio</span>
            </button>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 rounded border border-slate-750 flex items-center gap-1 cursor-pointer font-medium"
              title="Help manual overlay"
            >
              <span>Help</span>
              <span className="text-[8px] bg-slate-800 px-1 rounded text-slate-500 font-mono hidden sm:inline">F1</span>
            </button>

            <button
              onClick={() => { playSound('click'); setActiveTab('chaos'); }}
              className="px-2 py-1 bg-slate-900 hover:bg-amber-950/60 text-[10px] text-amber-400 rounded border border-amber-500/20 flex items-center gap-1 cursor-pointer font-bold"
              title="Chaos Matrix parameters and difficulty tracker"
            >
              <span>🌀 Chaos Matrix</span>
              <span className="text-[8px] bg-amber-950 px-1 rounded text-amber-400 font-mono hidden sm:inline">Y</span>
            </button>

            <button
              onClick={() => setIsGodPanelOpen(true)}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] text-amber-500 rounded border border-amber-500/20 flex items-center gap-1 cursor-pointer font-medium"
              title="God Mode panel"
            >
              <span>Dev Docs</span>
              <span className="text-[8px] bg-amber-500/10 px-1 rounded text-amber-500/50 font-mono hidden sm:inline">P</span>
            </button>

            <button
              onClick={() => setIsGmPanelOpen(true)}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] text-purple-400 rounded border border-purple-500/20 flex items-center gap-1 cursor-pointer font-medium animate-pulse"
              title="GM parameters panel"
            >
              <span>GM Metrics</span>
              <span className="text-[8px] bg-purple-500/10 px-1 rounded text-purple-400/50 font-mono hidden sm:inline">O</span>
            </button>
          </div>

          <button
            id="give-up-header-btn"
            onClick={() => setIsGameOver(true)}
            className="px-3 py-1 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/50 text-[10px] font-semibold text-rose-400 rounded cursor-pointer transition-all w-full sm:w-auto"
          >
            Forfeit Run
          </button>
        </div>
      )}
    </header>
  );
};
