/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Volume2,
  Minimize2,
  Maximize2,
  X,
  RotateCcw,
  Move,
  ChevronDown,
  ChevronUp,
  Zap,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { GameState } from '../types';
import { performanceMonitor, SystemResourceMetrics, PerformanceHudPosition } from '../utils/performanceMonitor';

interface PerformanceHudProps {
  gameState?: GameState;
  onClose?: () => void;
}

export const PerformanceHud: React.FC<PerformanceHudProps> = ({ gameState, onClose }) => {
  const [metrics, setMetrics] = useState<SystemResourceMetrics>(() => performanceMonitor.getMetrics(gameState));
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => performanceMonitor.isHudCollapsed());
  const [position, setPosition] = useState<PerformanceHudPosition>(() => performanceMonitor.getPosition());

  // Update telemetry at a steady 5Hz (200ms) interval to minimize React overhead while keeping metrics fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics(gameState));
    }, 200);

    const unsubscribe = performanceMonitor.subscribe(() => {
      setIsCollapsed(performanceMonitor.isHudCollapsed());
      setPosition(performanceMonitor.getPosition());
      setMetrics(performanceMonitor.getMetrics(gameState));
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [gameState]);

  const handleToggleCollapse = () => {
    const next = performanceMonitor.toggleCollapsed();
    setIsCollapsed(next);
  };

  const handleCyclePosition = () => {
    const next = performanceMonitor.cyclePosition();
    setPosition(next);
  };

  const handleClose = () => {
    performanceMonitor.setHudOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleResetMetrics = () => {
    performanceMonitor.reset();
    setMetrics(performanceMonitor.getMetrics(gameState));
  };

  // Position class mapping
  const positionClasses: Record<PerformanceHudPosition, string> = {
    'top-right': 'top-16 right-3 sm:right-5',
    'bottom-right': 'bottom-16 right-3 sm:right-5',
    'top-left': 'top-16 left-3 sm:left-5',
    'bottom-left': 'bottom-16 left-3 sm:left-5',
  };

  const fpsColor =
    metrics.frame.fps >= 55
      ? 'text-emerald-400'
      : metrics.frame.fps >= 30
      ? 'text-amber-400'
      : 'text-rose-400';

  const fpsBgColor =
    metrics.frame.fps >= 55
      ? 'bg-emerald-500/10 border-emerald-500/30'
      : metrics.frame.fps >= 30
      ? 'bg-amber-500/10 border-amber-500/30'
      : 'bg-rose-500/10 border-rose-500/30';

  // Render Collapsed Minimalist Pill Mode
  if (isCollapsed) {
    return (
      <div
        id="performance-hud-collapsed"
        className={`fixed z-50 ${positionClasses[position]} select-none font-mono transition-all duration-150`}
      >
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl backdrop-blur-md text-[11px] text-slate-300">
          <button
            onClick={handleToggleCollapse}
            className="flex items-center gap-2 cursor-pointer group"
            title="Expand Full Performance HUD [F3]"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className={`font-bold ${fpsColor}`}>{metrics.frame.fps} FPS</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-300">{metrics.frame.frameTimeMs}ms</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-400">{metrics.chunks.totalLoaded} Chk</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-sky-400">{metrics.audio.activeVoices}/8 Vox</span>
            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">F3</span>
            <Maximize2 className="w-3 h-3 text-slate-400 group-hover:text-amber-300 ml-0.5" />
          </button>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-rose-400 p-0.5 rounded ml-1 transition-colors"
            title="Close Performance HUD"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Render Full Telemetry Panel
  return (
    <div
      id="performance-hud-panel"
      className={`fixed z-50 ${positionClasses[position]} w-[330px] sm:w-[360px] max-w-[95vw] select-none font-mono text-slate-200 transition-all duration-150 animate-in fade-in zoom-in-95 duration-100`}
    >
      <div className="bg-slate-950/95 border border-slate-800/90 rounded-xl shadow-2xl backdrop-blur-lg overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-amber-500/10 border border-amber-500/30">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">Performance HUD</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  F3
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Dock Position Cycler */}
            <button
              onClick={handleCyclePosition}
              className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
              title={`Cycle Screen Dock Position (Current: ${position})`}
            >
              <Move className="w-3.5 h-3.5" />
            </button>

            {/* Reset Metrics */}
            <button
              onClick={handleResetMetrics}
              className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors"
              title="Reset Frame and FPS Statistics"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Minimize / Collapse */}
            <button
              onClick={handleToggleCollapse}
              className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
              title="Minimize to Compact Bar"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Close Performance HUD [F3]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3 text-[11px] max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* 1. FPS & RENDER ENGINE TELEMETRY */}
          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-amber-400" />
                <span>Render Pipeline & Frame Latency</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {metrics.engine.visualMode}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 items-center mb-2 text-center">
              {/* Main FPS Card */}
              <div className={`col-span-2 py-1.5 px-2 rounded-lg border flex flex-col items-center justify-center ${fpsBgColor}`}>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black leading-none ${fpsColor}`}>{metrics.frame.fps}</span>
                  <span className="text-[10px] text-slate-400 font-bold">FPS</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-1 flex gap-2">
                  <span>Avg: <strong className="text-slate-200">{metrics.frame.avgFps}</strong></span>
                  <span>Min: <strong className="text-slate-200">{metrics.frame.minFps}</strong></span>
                  <span>Max: <strong className="text-slate-200">{metrics.frame.maxFps}</strong></span>
                </div>
              </div>

              {/* Frame Latency Card */}
              <div className="col-span-2 py-1.5 px-2 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col items-center justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-sky-400 leading-none">{metrics.frame.frameTimeMs}</span>
                  <span className="text-[10px] text-slate-400">ms</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-1 flex gap-2">
                  <span>Avg: <strong className="text-slate-200">{metrics.frame.avgFrameTimeMs}ms</strong></span>
                  <span>Peak: <strong className="text-slate-200">{metrics.frame.peakFrameTimeMs}ms</strong></span>
                </div>
              </div>
            </div>

            {/* Frame history sparkline */}
            {metrics.frame.frameHistory.length > 0 && (
              <div className="mt-1 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                <span>Viewport: {metrics.engine.viewportRes} @ {metrics.engine.dpr}x DPR</span>
                <span>Particles: <strong className="text-amber-300">{metrics.frame.activeParticles}</strong></span>
              </div>
            )}
          </div>

          {/* 2. CHUNK MEMORY & RLE CACHE */}
          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-sky-400" />
                <span>Chunk Memory & Cache Window</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                +{metrics.chunks.savedMemoryKb} KB Saved
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                <div className="text-slate-400">Loaded Chunks</div>
                <div className="text-sm font-bold text-slate-100 flex items-center justify-between">
                  <span>{metrics.chunks.totalLoaded} total</span>
                  <span className="text-[10px] font-normal text-emerald-400">{metrics.chunks.uncompressed} uncompressed</span>
                </div>
              </div>

              <div className="bg-slate-950/70 p-2 rounded border border-slate-800/80">
                <div className="text-slate-400">Compression (RLE)</div>
                <div className="text-sm font-bold text-slate-100 flex items-center justify-between">
                  <span>{metrics.chunks.compressed} distant</span>
                  <span className="text-[10px] font-normal text-sky-400">~{metrics.chunks.estimatedMemoryKb} KB RAM</span>
                </div>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden flex border border-slate-800">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${metrics.chunks.uncompressedPercent}%` }}
                title={`Active 5x5 Window: ${metrics.chunks.uncompressed} chunks (${metrics.chunks.uncompressedPercent}%)`}
              />
              <div
                className="bg-sky-500 h-full transition-all duration-300"
                style={{ width: `${100 - metrics.chunks.uncompressedPercent}%` }}
                title={`RLE Compressed Chunks: ${metrics.chunks.compressed} chunks`}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active 5x5 Window (Uncompressed)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Distant (Compressed)
              </span>
            </div>
          </div>

          {/* 3. SPATIAL GRID & ENTITIES */}
          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-purple-400" />
                <span>Spatial Index & Entities</span>
              </span>
              <span className="text-[10px] text-purple-300 font-bold">
                {metrics.spatial.totalEntities} on Map
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                <div className="text-rose-400 font-bold text-xs">{metrics.spatial.hostileEnemies}</div>
                <div className="text-slate-400 text-[9px]">Hostiles</div>
              </div>
              <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                <div className="text-emerald-400 font-bold text-xs">{metrics.spatial.alliesAndFollowers}</div>
                <div className="text-slate-400 text-[9px]">Allies/Pets</div>
              </div>
              <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                <div className="text-sky-400 font-bold text-xs">{metrics.spatial.civiliansAndGuards}</div>
                <div className="text-slate-400 text-[9px]">Guards/Civs</div>
              </div>
            </div>

            <div className="mt-1.5 flex justify-between text-[9px] text-slate-400">
              <span>Ground Corpses: <strong className="text-slate-300">{metrics.spatial.corpsesOnFloor}</strong></span>
              <span>Chests & Traps: <strong className="text-slate-300">{metrics.spatial.trapsAndChests}</strong></span>
            </div>
          </div>

          {/* 4. WEBAUDIO VOICE CHANNELS */}
          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>WebAudio Voice Channels</span>
              </span>
              <span className="text-[10px] font-bold text-amber-400">
                {metrics.audio.activeVoices}/{metrics.audio.maxVoices} Active
              </span>
            </div>

            {/* 8-Voice Concurrency Meter */}
            <div className="grid grid-cols-8 gap-1 mb-1.5">
              {Array.from({ length: metrics.audio.maxVoices }).map((_, idx) => {
                const isActive = idx < metrics.audio.activeVoices;
                return (
                  <div
                    key={idx}
                    className={`h-3 rounded-sm border transition-all ${
                      isActive
                        ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                    title={`Voice Channel ${idx + 1}: ${isActive ? 'PLAYING' : 'IDLE'}`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-400">
              <span>Total Allocations: <strong className="text-slate-200">{metrics.audio.totalAllocations}</strong></span>
              <span>Voice Thefts: <strong className="text-rose-400">{metrics.audio.voiceThefts}</strong></span>
              <span>Throttled: <strong className="text-amber-400">{metrics.audio.throttledCount}</strong></span>
            </div>

            {metrics.audio.activeSounds.length > 0 && (
              <div className="mt-1.5 pt-1 border-t border-slate-800 flex items-center gap-1 flex-wrap text-[9px]">
                <span className="text-slate-400">Playing:</span>
                {metrics.audio.activeSounds.map((snd, idx) => (
                  <span
                    key={idx}
                    className="px-1 py-0.2 bg-amber-950/60 border border-amber-800/60 text-amber-300 rounded font-bold"
                  >
                    {snd}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 5. WORLD & ENGINE STATE */}
          <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/80 text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Location:</span>
              <span className="text-slate-200 font-bold">{metrics.engine.locationStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Player Coord:</span>
              <span className="text-slate-200 font-bold">{metrics.engine.playerCoord}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Weather & Biome:</span>
              <span className="text-amber-300">{metrics.engine.weather} &bull; {metrics.engine.biome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Turns Processed:</span>
              <span className="text-slate-200">{metrics.engine.turnsCount} turns</span>
            </div>
          </div>
        </div>

        {/* Footer info & Hotkey reminder */}
        <div className="bg-slate-900/90 px-3 py-1.5 border-t border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Toggle with hotkey <strong className="text-amber-300">F3</strong></span>
          </span>
          <button
            onClick={handleToggleCollapse}
            className="text-amber-400 hover:text-amber-300 cursor-pointer font-bold"
          >
            Minimize &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
