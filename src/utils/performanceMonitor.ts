/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState } from '../types';
import { getChunkMemoryStats, ChunkMemoryStats } from './overworld/chunkMemoryManager';
import { getVoiceManager } from './audio/voiceManager';
import { hybridGraphicsEngine } from '../canvas/HybridGraphicsEngine';

export interface PerformanceFrameMetrics {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  frameTimeMs: number;
  avgFrameTimeMs: number;
  peakFrameTimeMs: number;
  drawCalls: number;
  activeParticles: number;
  frameHistory: number[]; // Last 30 frame times in ms for sparkline
}

export interface SystemResourceMetrics {
  frame: PerformanceFrameMetrics;
  chunks: ChunkMemoryStats;
  audio: {
    maxVoices: number;
    activeVoices: number;
    totalAllocations: number;
    voiceThefts: number;
    throttledCount: number;
    activeSounds: string[];
  };
  spatial: {
    totalEntities: number;
    hostileEnemies: number;
    alliesAndFollowers: number;
    civiliansAndGuards: number;
    corpsesOnFloor: number;
    trapsAndChests: number;
  };
  engine: {
    visualMode: string;
    turnsCount: number;
    gameTime: string;
    weather: string;
    biome: string;
    locationStr: string;
    playerCoord: string;
    viewportRes: string;
    dpr: number;
  };
}

export type PerformanceHudPosition = 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  private frameTimes: number[] = [];
  private frameDurations: number[] = [];
  private readonly maxSamples: number = 60;
  private lastFrameTimestamp: number = 0;

  private currentFps: number = 60;
  private avgFps: number = 60;
  private minFps: number = 60;
  private maxFps: number = 60;
  private frameTimeMs: number = 0;
  private avgFrameTimeMs: number = 0;
  private peakFrameTimeMs: number = 0;
  private currentDrawCalls: number = 3;
  private currentParticles: number = 0;

  private isEnabled: boolean = false;
  private isCollapsed: boolean = false;
  private position: PerformanceHudPosition = 'top-right';
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('abyss_perf_hud_open');
        this.isEnabled = saved === 'true';
        const savedCollapsed = localStorage.getItem('abyss_perf_hud_collapsed');
        this.isCollapsed = savedCollapsed === 'true';
        const savedPos = localStorage.getItem('abyss_perf_hud_pos') as PerformanceHudPosition;
        if (savedPos && ['top-right', 'bottom-right', 'top-left', 'bottom-left'].includes(savedPos)) {
          this.position = savedPos;
        }
      } catch (e) {
        // Ignore storage access errors
      }
    }
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Called by render loop on every frame to record elapsed render duration.
   */
  public recordFrame(
    renderDurationMs: number,
    activeParticles: number = 0,
    drawCalls: number = 3,
    customTimestampMs?: number
  ): void {
    const now = customTimestampMs ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
    this.frameTimeMs = Number(renderDurationMs.toFixed(2));
    this.currentParticles = activeParticles;
    this.currentDrawCalls = drawCalls;

    if (this.lastFrameTimestamp > 0) {
      const delta = now - this.lastFrameTimestamp;
      if (delta > 0) {
        const instantFps = Math.min(144, Math.max(1, Math.round(1000 / delta)));
        this.currentFps = instantFps;

        this.frameTimes.push(instantFps);
        if (this.frameTimes.length > this.maxSamples) {
          this.frameTimes.shift();
        }

        let sumFps = 0;
        let min = 999;
        let max = 0;
        for (let i = 0; i < this.frameTimes.length; i++) {
          const f = this.frameTimes[i];
          sumFps += f;
          if (f < min) min = f;
          if (f > max) max = f;
        }
        this.avgFps = Math.round(sumFps / this.frameTimes.length);
        this.minFps = min === 999 ? this.currentFps : min;
        this.maxFps = max === 0 ? this.currentFps : max;
      }
    }
    this.lastFrameTimestamp = now;

    this.frameDurations.push(renderDurationMs);
    if (this.frameDurations.length > 30) {
      this.frameDurations.shift();
    }

    let sumDur = 0;
    let peak = 0;
    for (let i = 0; i < this.frameDurations.length; i++) {
      const d = this.frameDurations[i];
      sumDur += d;
      if (d > peak) peak = d;
    }
    this.avgFrameTimeMs = Number((sumDur / this.frameDurations.length).toFixed(2));
    this.peakFrameTimeMs = Number(peak.toFixed(2));
  }

  /**
   * Resets frame history and peak metrics.
   */
  public resetMetrics(): void {
    this.frameDurations = [];
    this.currentFps = 60;
    this.avgFps = 60;
    this.minFps = 60;
    this.maxFps = 60;
    this.frameTimeMs = 16.6;
    this.avgFrameTimeMs = 16.6;
    this.peakFrameTimeMs = 16.6;
    this.currentParticles = 0;
    this.currentDrawCalls = 1;
  }

  /**
   * Generates a complete snapshot of real-time performance and system resources.
   */
  public getMetrics(gameState?: GameState): SystemResourceMetrics {
    const voiceStats = getVoiceManager().getStats();
    const chunkStats = getChunkMemoryStats(gameState?.overworldChunks);

    let hostileEnemies = 0;
    let alliesAndFollowers = 0;
    let civiliansAndGuards = 0;
    let totalEntities = 0;

    if (gameState?.enemies) {
      totalEntities = gameState.enemies.length;
      for (let i = 0; i < totalEntities; i++) {
        const e = gameState.enemies[i];
        if (e.hp <= 0) continue;
        if (e.isFollower || (e.isCaptive && e.isFreed)) {
          alliesAndFollowers++;
        } else if (e.isTownGuard || e.isAnimal || e.animalType) {
          civiliansAndGuards++;
        } else {
          hostileEnemies++;
        }
      }
    }

    const currentMode = hybridGraphicsEngine.getMode();
    const isOverworld = gameState?.isOverworld ?? true;
    const locationStr = isOverworld
      ? `Overworld (${gameState?.currentChunkX ?? 0}, ${gameState?.currentChunkY ?? 0})`
      : `Dungeon Depth ${gameState?.playerStats?.depth ?? 1}`;

    const playerCoord = gameState ? `(${gameState.playerX}, ${gameState.playerY})` : '(0, 0)';

    let viewportRes = '1280x720';
    let dpr = 1.0;
    if (typeof window !== 'undefined') {
      viewportRes = `${window.innerWidth}x${window.innerHeight}`;
      dpr = window.devicePixelRatio || 1.0;
    }

    return {
      frame: {
        fps: this.currentFps,
        avgFps: this.avgFps,
        minFps: this.minFps,
        maxFps: this.maxFps,
        frameTimeMs: this.frameTimeMs,
        avgFrameTimeMs: this.avgFrameTimeMs,
        peakFrameTimeMs: this.peakFrameTimeMs,
        drawCalls: this.currentDrawCalls,
        activeParticles: this.currentParticles,
        frameHistory: [...this.frameDurations],
      },
      chunks: chunkStats,
      audio: {
        maxVoices: voiceStats.maxVoices,
        activeVoices: voiceStats.activeVoices,
        totalAllocations: voiceStats.totalAllocations,
        voiceThefts: voiceStats.voiceThefts,
        throttledCount: voiceStats.throttledCount,
        activeSounds: voiceStats.activeChannelSounds || [],
      },
      spatial: {
        totalEntities,
        hostileEnemies,
        alliesAndFollowers,
        civiliansAndGuards,
        corpsesOnFloor: gameState?.corpses?.length || 0,
        trapsAndChests: (gameState?.traps?.length || 0) + (gameState?.chests?.length || 0),
      },
      engine: {
        visualMode: currentMode ? currentMode.replace(/_/g, ' ').toUpperCase() : 'CANVAS',
        turnsCount: gameState?.playerStats?.turnsPlayed || 0,
        gameTime: gameState?.gameTime ? `${Math.floor(gameState.gameTime / 60)}h` : '0h',
        weather: gameState?.weather || 'clear',
        biome: gameState?.biome || 'grassland',
        locationStr,
        playerCoord,
        viewportRes,
        dpr: Number(dpr.toFixed(1)),
      },
    };
  }

  // --- Toggle, Collapse & Position Handlers ---

  public isHudOpen(): boolean {
    return this.isEnabled;
  }

  public setHudOpen(open: boolean): void {
    this.isEnabled = open;
    try {
      localStorage.setItem('abyss_perf_hud_open', String(open));
    } catch (e) {
      // Ignore
    }
    this.notify();
  }

  public toggleHud(): boolean {
    const next = !this.isEnabled;
    this.setHudOpen(next);
    return next;
  }

  public isHudCollapsed(): boolean {
    return this.isCollapsed;
  }

  public setHudCollapsed(collapsed: boolean): void {
    this.isCollapsed = collapsed;
    try {
      localStorage.setItem('abyss_perf_hud_collapsed', String(collapsed));
    } catch (e) {
      // Ignore
    }
    this.notify();
  }

  public toggleCollapsed(): boolean {
    const next = !this.isCollapsed;
    this.setHudCollapsed(next);
    return next;
  }

  public getPosition(): PerformanceHudPosition {
    return this.position;
  }

  public setPosition(pos: PerformanceHudPosition): void {
    this.position = pos;
    try {
      localStorage.setItem('abyss_perf_hud_pos', pos);
    } catch (e) {
      // Ignore
    }
    this.notify();
  }

  public cyclePosition(): PerformanceHudPosition {
    const order: PerformanceHudPosition[] = ['top-right', 'bottom-right', 'bottom-left', 'top-left'];
    const nextIdx = (order.indexOf(this.position) + 1) % order.length;
    this.setPosition(order[nextIdx]);
    return this.position;
  }

  // --- Subscriptions ---

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        // Ignore subscriber errors
      }
    }
  }

  /**
   * Resets metrics (useful for test runs)
   */
  public reset(): void {
    this.frameTimes = [];
    this.frameDurations = [];
    this.currentFps = 60;
    this.avgFps = 60;
    this.minFps = 60;
    this.maxFps = 60;
    this.frameTimeMs = 0;
    this.avgFrameTimeMs = 0;
    this.peakFrameTimeMs = 0;
    this.lastFrameTimestamp = 0;
    this.notify();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
