import React, { useState } from 'react';
import { Swords, Compass, Volume2, VolumeX, Sliders, HelpCircle, ShieldAlert, Sparkles, LogOut, Radio, Palette, Activity } from 'lucide-react';
import { GameState } from '../types';
import { calculateWorldThreatTier, getThreatTierInfo } from '../utils/worldThreat';
import { hybridGraphicsEngine } from '../canvas/HybridGraphicsEngine';
import { entityInterpolationManager } from '../canvas/entityInterpolationManager';

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
  toggleAudioMute: () => boolean | void;
  setIsMuted: (muted: boolean) => void;
  getAudioSettings: () => { isAudioMuted: boolean };
  setIsAudioSettingsOpen: (open: boolean) => void;
  setIsHelpOpen: (open: boolean) => void;
  setIsWorldThreatOpen?: (open: boolean) => void;
  setIsWorldMapOpen?: (open: boolean) => void;
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
  setIsWorldThreatOpen,
  setIsWorldMapOpen,
  playSound,
  setIsGodPanelOpen,
  setIsGmPanelOpen,
  setIsGameOver
}) => {
  const [, setGraphicsTick] = useState(0);
  const threatTier = calculateWorldThreatTier(gameState.playerStats, gameState.chaosScore);
  const threatInfo = getThreatTierInfo(threatTier);

  return (
    <header className="bg-slate-950/95 border-b border-slate-800/90 py-2.5 px-3 sm:px-4 lg:px-6 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl select-none backdrop-blur-md relative z-30">
      {/* LEFT: Game Title & Subtitle Branding */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-2 border border-amber-500/30 rounded-xl shadow-inner flex items-center justify-center">
            <Swords className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-100 flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 bg-clip-text text-transparent">DUNGEON CRAFTING</span>
                <span className="text-slate-400 font-medium">ROGUELIKE</span>
              </h1>
              {activeMobileView && (
                <span className="text-[9px] bg-sky-500/15 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded-full font-bold">
                  MOBILE
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Alloy Assembly &bull; Procedural Realm Cartography &bull; Turn-Based Tactical RPG
            </p>
          </div>
        </div>

        {/* Mobile-only World Map Quick Trigger */}
        {isPlaying && setIsWorldMapOpen && (
          <button
            onClick={() => { playSound('click'); setIsWorldMapOpen(true); }}
            className="md:hidden px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Open World Map"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
        )}
      </div>

      {isPlaying && (
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* CENTER: Chrono & Regional Location Hub */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-slate-800/90 rounded-xl px-2.5 py-1 text-[11px] font-mono text-slate-300 shadow-inner flex-wrap sm:flex-nowrap justify-center">
            {/* Realm Location Tag with Map Launch Trigger */}
            <button
              onClick={() => {
                if (setIsWorldMapOpen) {
                  playSound('click');
                  setIsWorldMapOpen(true);
                }
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/70 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-[10px] font-bold transition-all cursor-pointer group"
              title="Click to view Sector on World Map [M]"
            >
              <Compass className="w-3 h-3 text-amber-400 group-hover:rotate-45 transition-transform" />
              {gameState.isArena ? (
                <span className="text-red-400 font-bold tracking-wider">ARENA</span>
              ) : gameState.isOverworld ? (
                <span className="text-amber-300">
                  OVERWORLD [{gameState.currentChunkX},{gameState.currentChunkY}]
                </span>
              ) : (
                <span className="text-purple-300">
                  DEPTH {gameState.playerStats.depth}F
                </span>
              )}
            </button>

            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* Time of Day Clock */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-950/80 border border-slate-800 rounded text-amber-400 font-extrabold text-[11px] shadow-sm">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              <span>
                {(() => {
                  const formatted = formatGameTime(gameState.gameTime);
                  return `${formatted.timeStr} ${formatted.period}`;
                })()}
              </span>
            </div>

            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* Season Badge */}
            <span
              className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 select-none ${
                gameState.season === 'spring'
                  ? 'bg-rose-950/50 border-rose-500/30 text-rose-300'
                  : gameState.season === 'summer'
                  ? 'bg-amber-950/50 border-amber-500/30 text-amber-300'
                  : gameState.season === 'autumn'
                  ? 'bg-orange-950/50 border-orange-500/30 text-orange-300'
                  : 'bg-sky-950/50 border-sky-500/30 text-sky-300'
              }`}
            >
              {gameState.season === 'spring' && '🌸 Spring'}
              {gameState.season === 'summer' && '☀️ Summer'}
              {gameState.season === 'autumn' && '🍂 Autumn'}
              {gameState.season === 'winter' && '❄️ Winter'}
            </span>

            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* Turns Counter */}
            <span className="text-slate-400 text-[10px] hidden sm:inline">
              Turn <strong className="text-slate-200">{gameState.playerStats.turnsPlayed}</strong>
            </span>
          </div>

          {/* Dungeon Stairs Climb Helper */}
          {!gameState.isOverworld && gameState.playerStats.depth >= 1 && (
            <button
              id="climb-up-stairs-btn"
              onClick={gameState.playerStats.depth === 1 ? climbStairsUpToOverworld : climbToPreviousDepth}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-md animate-pulse active:scale-95"
              title={gameState.playerStats.depth === 1 ? "Climb back out onto the Overworld" : "Climb back up to previous dungeon floor"}
            >
              <span>{gameState.playerStats.depth === 1 ? "🪜 Overworld Exit" : `🪜 Depth ${gameState.playerStats.depth - 1}F`}</span>
            </button>
          )}

          {/* RIGHT: High-Utility Navigation & Settings Toolbar */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 border border-slate-800 rounded-xl shadow-inner flex-wrap sm:flex-nowrap">
            {/* World Map Primary Button */}
            {setIsWorldMapOpen && (
              <button
                id="header-world-map-btn"
                onClick={() => { playSound('click'); setIsWorldMapOpen(true); }}
                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-[10px] text-amber-300 rounded-lg border border-amber-500/40 flex items-center gap-1.5 cursor-pointer font-bold transition-all shadow-sm active:scale-95"
                title="Interactive Realm Cartography World Map [M]"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>World Map</span>
                <span className="text-[8px] bg-amber-500/20 px-1 rounded text-amber-200 font-mono hidden sm:inline">M</span>
              </button>
            )}

            {/* Graphics Visual Mode Toggle (Classic ASCII vs Classic PNG vs Classic Code) */}
            <button
              onClick={() => {
                hybridGraphicsEngine.cycleVisualMode();
                playSound('click');
                setGraphicsTick(t => t + 1);
              }}
              className={`px-2 py-1 text-[10px] rounded-lg border flex items-center gap-1 cursor-pointer font-bold transition-all ${
                !hybridGraphicsEngine.isTilesetMode()
                  ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : hybridGraphicsEngine.getTilesetSource() === 'classic_png'
                  ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 shadow-sm'
                  : 'bg-purple-950/60 border-purple-500/40 text-purple-300 shadow-sm'
              }`}
              title={`Visual Mode: ${hybridGraphicsEngine.getModeLabel()} [F8 / Alt+T]. Click to cycle modes (ASCII -> Classic PNG -> Classic Code).`}
            >
              <Palette className={`w-3 h-3 ${
                !hybridGraphicsEngine.isTilesetMode()
                  ? 'text-slate-400'
                  : hybridGraphicsEngine.getTilesetSource() === 'classic_png'
                  ? 'text-indigo-400'
                  : 'text-purple-400'
              }`} />
              <span>{hybridGraphicsEngine.getShortModeLabel()}</span>
            </button>

            {/* Smooth Movement Lerp Toggle */}
            <button
              onClick={() => {
                const newState = !entityInterpolationManager.isEnabled();
                entityInterpolationManager.setEnabled(newState);
                playSound('click');
                setGraphicsTick(t => t + 1);
              }}
              className={`px-2 py-1 text-[10px] rounded-lg border flex items-center gap-1 cursor-pointer font-bold transition-all ${
                entityInterpolationManager.isEnabled()
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
              title={`Movement Style: ${entityInterpolationManager.isEnabled() ? 'Smooth Interpolation (Lerp)' : 'Instant Turn-Based Grid Snapping'}. Click to toggle.`}
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>{entityInterpolationManager.isEnabled() ? '⚡ Smooth' : '⏹ Snap'}</span>
            </button>

            {/* Layout Mode Toggle */}
            <button
              onClick={() => {
                setForceLayoutMode(prev => prev === 'mobile' ? 'desktop' : 'mobile');
              }}
              className={`px-2 py-1 text-[10px] rounded-lg border flex items-center gap-1 cursor-pointer font-bold transition-all ${
                activeMobileView
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              title={`Layout mode: ${forceLayoutMode}. Click to toggle.`}
            >
              <span>{activeMobileView ? '📱 Mobile' : '💻 PC'}</span>
            </button>

            {/* Quick Audio Mute Toggle */}
            <button
              id="quick-mute-btn"
              onClick={() => {
                const newMuteState = toggleAudioMute();
                if (typeof newMuteState === 'boolean') {
                  setIsMuted(newMuteState);
                } else {
                  setIsMuted(Boolean(getAudioSettings().isAudioMuted));
                }
              }}
              className={`px-2 py-1 text-[10px] rounded-lg border flex items-center gap-1 cursor-pointer font-bold transition-all ${
                isMuted
                  ? 'bg-red-950/80 border-red-500/50 text-red-300 animate-pulse'
                  : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50'
              }`}
              title={isMuted ? "Unmute All Audio" : "Instant Mute Audio"}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
              <span>{isMuted ? 'Muted' : 'Sound'}</span>
            </button>

            {/* Audio Settings Panel */}
            <button
              onClick={() => {
                setIsMuted(getAudioSettings().isAudioMuted);
                setIsAudioSettingsOpen(true);
              }}
              className="p-1.5 bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              title="Spatial Audio & Dynamic Soundscape Sliders"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Threat Level Matrix */}
            {setIsWorldThreatOpen && (
              <button
                onClick={() => { playSound('bump'); setIsWorldThreatOpen(true); }}
                className={`px-2 py-1 text-[10px] rounded-lg border flex items-center gap-1 cursor-pointer font-bold transition-all ${
                  threatTier >= 3
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse shadow-sm'
                    : 'bg-slate-950/60 border-amber-500/30 text-amber-300 hover:bg-slate-800'
                }`}
                title="World Threat Level & Ascension Matrix"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Tier {threatTier}</span>
              </button>
            )}

            {/* Help / Guide */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              title="Guide & Hotkeys [F1]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Dev Docs / God Mode */}
            <button
              onClick={() => setIsGodPanelOpen(true)}
              className="px-2 py-1 bg-slate-950/60 hover:bg-slate-800 text-[10px] text-amber-400 rounded-lg border border-amber-500/20 flex items-center gap-1 cursor-pointer font-medium"
              title="Developer Sandbox & Cheat Console [P]"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Dev</span>
            </button>

            {/* GM Metrics Panel */}
            <button
              onClick={() => setIsGmPanelOpen(true)}
              className="p-1.5 bg-slate-950/60 hover:bg-purple-950/50 text-purple-400 rounded-lg border border-purple-500/20 transition-colors cursor-pointer"
              title="Autonomous Game Master & Chaos Matrix [O]"
            >
              <Radio className="w-3.5 h-3.5 text-purple-400" />
            </button>
          </div>

          {/* Forfeit Run Button */}
          <button
            id="give-up-header-btn"
            onClick={() => setIsGameOver(true)}
            className="p-1.5 sm:px-2.5 sm:py-1 bg-rose-950/25 hover:bg-rose-950/60 border border-rose-800/40 text-[10px] font-bold text-rose-400 hover:text-rose-300 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm active:scale-95"
            title="Forfeit Current Hero Run"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Forfeit</span>
          </button>
        </div>
      )}
    </header>
  );
};

