import React, { useState } from 'react';
import { Sparkles, Heart, Sliders, Hammer, Zap, Eye, MapPin, ShieldAlert, ShieldCheck, Globe, Activity } from 'lucide-react';
import { GameState } from '../../types';
import { performanceMonitor } from '../../utils/performanceMonitor';

interface GodCheatsTabProps {
  gameState: GameState;
  handleHealPlayer: () => void;
  handleGoldBounty: () => void;
  handleGrantMaterials: () => void;
  handleGrantLevelBounty: () => void;
  handleMaxUpgradeEquipped: () => void;
  handleWipeEnemies: () => void;
  handleRevealFullMap: () => void;
  handleRevealWholeWorldMap?: () => void;
  handleExportWorldMapPng?: () => void;
  handleToggleInvinciblePlayer?: () => void;
  godModeActive?: boolean;
  TeleportToEmptyArena: () => void;
  handleSpawnDecorCluster?: () => void;
  handleResetLevelDecor?: () => void;
  handleFastForwardTime?: () => void;
  handlePurgeExhaustion?: () => void;
  isPerfHudOpen?: boolean;
  handleTogglePerfHud?: () => void;
  onClose: () => void;
}

export const GodCheatsTab: React.FC<GodCheatsTabProps> = ({
  gameState,
  handleHealPlayer,
  handleGoldBounty,
  handleGrantMaterials,
  handleGrantLevelBounty,
  handleMaxUpgradeEquipped,
  handleWipeEnemies,
  handleRevealFullMap,
  handleRevealWholeWorldMap,
  handleExportWorldMapPng,
  handleToggleInvinciblePlayer,
  godModeActive = false,
  TeleportToEmptyArena,
  handleSpawnDecorCluster,
  handleResetLevelDecor,
  handleFastForwardTime,
  handlePurgeExhaustion,
  isPerfHudOpen,
  handleTogglePerfHud,
  onClose
}) => {
  const [internalPerfHudActive, setInternalPerfHudActive] = useState(() => performanceMonitor.isHudOpen());
  const isPerfHudActive = isPerfHudOpen !== undefined ? isPerfHudOpen : internalPerfHudActive;

  const onToggleHudClick = () => {
    if (handleTogglePerfHud) {
      handleTogglePerfHud();
    } else {
      const next = performanceMonitor.toggleHud();
      setInternalPerfHudActive(next);
    }
  };

  const isInvincible =
    godModeActive ||
    gameState.godMode ||
    gameState.isInvincible ||
    gameState.playerStats.isInvincible ||
    (typeof window !== 'undefined' && ((window as any).arenaGodModeActive || (window as any).isInvincibleActive));

  return (
    <div className="space-y-4 font-mono">
      <div className="border-b border-amber-900/40 pb-2">
        <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>Sovereign God Mode & Cheat Suite</span>
        </h3>
        <p className="text-[11px] text-slate-400">
          Instant developer overrides for player invulnerability, currency, stats, world mapping, decor objects, and combat testing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Invincible Player God Cheat Button */}
        {handleToggleInvinciblePlayer && (
          <button
            onClick={handleToggleInvinciblePlayer}
            className={`py-2.5 px-3 rounded cursor-pointer transition-all text-left flex items-center justify-between col-span-1 sm:col-span-2 border ${
              isInvincible
                ? 'bg-gradient-to-r from-amber-950/80 via-yellow-950/70 to-amber-900/60 border-amber-400/90 text-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/60'
                : 'bg-slate-950/60 hover:bg-amber-950/30 border-amber-700/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${isInvincible ? 'text-yellow-300 animate-pulse' : 'text-amber-400'}`} />
              <div>
                <div className="font-bold text-xs flex items-center gap-2">
                  <span>Invincible Player (Take 0 Damage)</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide ${
                      isInvincible
                        ? 'bg-amber-400 text-amber-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isInvincible ? 'ACTIVE: 0 DMG' : 'OFF'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300/80 font-normal">
                  {isInvincible
                    ? 'Godmode Shield active: Immune to all attacks, traps, DoTs, and lava.'
                    : 'Toggle 100% damage immunity from all hostile enemies, traps, and hazards.'}
                </div>
              </div>
            </div>
            <span className="text-sm">{isInvincible ? '🛡️✨' : '🛡️'}</span>
          </button>
        )}

        {/* Real-Time Performance & Resource HUD Toggle Card */}
        <button
          onClick={onToggleHudClick}
          className={`py-2.5 px-3 rounded cursor-pointer transition-all text-left flex items-center justify-between col-span-1 sm:col-span-2 border ${
            isPerfHudActive
              ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-slate-900/60 border-emerald-400/90 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/60'
              : 'bg-slate-950/60 hover:bg-slate-900 border-slate-700/60 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isPerfHudActive ? 'text-emerald-300 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <div className="font-bold text-xs flex items-center gap-2">
                <span>Real-Time Performance & Resource HUD</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide ${
                    isPerfHudActive
                      ? 'bg-emerald-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isPerfHudActive ? 'ACTIVE (F3)' : 'OFF (F3)'}
                </span>
              </div>
              <div className="text-[10px] text-slate-300/80 font-normal">
                Live canvas FPS, frame latency ms, uncompressed vs RLE chunk cache window, 8-channel WebAudio voices, and spatial entity diagnostics.
              </div>
            </div>
          </div>
          <span className="text-sm">{isPerfHudActive ? '⚡🟢' : '⚡'}</span>
        </button>

        <button
          onClick={handleHealPlayer}
          className="py-2.5 px-3 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 text-rose-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Full HP & MP Restore</span>
          <Heart className="w-3.5 h-3.5 text-rose-500" />
        </button>

        <button
          onClick={handleGoldBounty}
          className="py-2.5 px-3 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/50 text-amber-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Add +500 Gold Bounty</span>
          <span>💰</span>
        </button>

        <button
          onClick={handleGrantMaterials}
          className="py-2.5 px-3 bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-800/50 text-indigo-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Grant 99x Crafting Alloys</span>
          <Hammer className="w-3.5 h-3.5 text-indigo-400" />
        </button>

        <button
          onClick={handleGrantLevelBounty}
          className="py-2.5 px-3 bg-teal-950/30 hover:bg-teal-900/40 border border-teal-800/50 text-teal-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Gain +5 Level-up (+25 pts)</span>
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
        </button>

        {handleSpawnDecorCluster && (
          <button
            onClick={handleSpawnDecorCluster}
            className="py-2.5 px-3 bg-purple-950/35 hover:bg-purple-900/40 border border-purple-800/50 text-purple-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
          >
            <span>Spawn Interactive Decor Cluster</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </button>
        )}

        {handleResetLevelDecor && (
          <button
            onClick={handleResetLevelDecor}
            className="py-2.5 px-3 bg-emerald-950/35 hover:bg-emerald-900/40 border border-emerald-800/50 text-emerald-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
          >
            <span>Reset Level Decor (Re-Loot)</span>
            <span>🔄</span>
          </button>
        )}

        {handleFastForwardTime && (
          <button
            onClick={handleFastForwardTime}
            className="py-2.5 px-3 bg-sky-950/35 hover:bg-sky-900/40 border border-sky-800/50 text-sky-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
          >
            <span>Fast-Forward Time (+6 Hours)</span>
            <span>⏰</span>
          </button>
        )}

        {handlePurgeExhaustion && (
          <button
            onClick={handlePurgeExhaustion}
            className="py-2.5 px-3 bg-emerald-950/35 hover:bg-emerald-900/40 border border-emerald-800/50 text-emerald-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
          >
            <span>Purge Fatigue & Statuses</span>
            <Heart className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        )}

        <button
          onClick={handleMaxUpgradeEquipped}
          className="py-2.5 px-3 bg-emerald-950/35 hover:bg-emerald-900/40 border border-emerald-850 text-emerald-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Max-Upgrade Equipped (+5)</span>
          <span>🐉</span>
        </button>

        <button
          onClick={handleRevealFullMap}
          className="py-2.5 px-3 bg-cyan-950/35 hover:bg-cyan-900/40 border border-cyan-850 text-cyan-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Reveal Local Chunk FOV</span>
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        {/* Reveal Whole World Map Button */}
        <button
          onClick={handleRevealWholeWorldMap || handleRevealFullMap}
          className="py-2.5 px-3 bg-gradient-to-r from-blue-950/50 to-indigo-950/50 hover:from-blue-900/60 hover:to-indigo-900/60 border border-blue-500/60 hover:border-blue-400 text-blue-200 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span>Reveal Whole World Map</span>
              <Globe className="w-3.5 h-3.5 text-cyan-300" />
            </div>
            <div className="text-[9px] text-blue-300/70 font-normal">Charts all 2,600+ world sectors</div>
          </div>
          <span className="text-xs">🗺️</span>
        </button>

        {/* Save Whole Map to PNG (40% Scale) Button */}
        {handleExportWorldMapPng && (
          <button
            onClick={handleExportWorldMapPng}
            className="py-2.5 px-3 bg-gradient-to-r from-emerald-950/60 via-teal-950/60 to-emerald-900/50 hover:from-emerald-900/70 hover:to-teal-900/70 border border-emerald-500/70 hover:border-emerald-400 text-emerald-200 font-bold rounded cursor-pointer transition-all text-left flex items-center justify-between shadow-md active:scale-95 col-span-1 sm:col-span-2"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-black">
                <span>📸 Save Whole Map to PNG (40% Scale)</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                  40% SCALE
                </span>
              </div>
              <div className="text-[10px] text-emerald-200/80 font-normal">
                High-fidelity full realm cartography export: renders all discovered and generated sectors, topography, roads, and settlements into a downloadable PNG image.
              </div>
            </div>
            <span className="text-base">🖼️</span>
          </button>
        )}

        <button
          onClick={TeleportToEmptyArena}
          className="py-2.5 px-3 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/60 text-amber-300 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between"
        >
          <span>Sandbox Testing Arena</span>
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
        </button>

        <button
          onClick={handleWipeEnemies}
          className="py-2.5 px-3 bg-slate-950/40 hover:bg-red-950/30 border border-red-900/30 text-rose-400 font-bold rounded cursor-pointer transition-colors text-left flex items-center justify-between col-span-1 sm:col-span-2"
        >
          <span>Clear All Active Chunk Enemies</span>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
        </button>
      </div>
    </div>
  );
};
