/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceMonitor, PerformanceMonitor } from '../utils/performanceMonitor';
import { getChunkMemoryStats, compressChunk } from '../utils/overworld/chunkMemoryManager';
import { GameState, TileType, OverworldChunk } from '../types';

describe('Real-Time Performance & Resource Telemetry Engine', () => {
  beforeEach(() => {
    let store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = String(val); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    };
    performanceMonitor.resetMetrics();
  });

  it('initializes with default metrics and empty frame history', () => {
    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.frame.fps).toBeGreaterThanOrEqual(0);
    expect(metrics.frame.frameTimeMs).toBeGreaterThanOrEqual(0);
    expect(metrics.frame.frameHistory).toBeInstanceOf(Array);
    expect(metrics.frame.frameHistory.length).toBe(0);
  });

  it('records frames and computes moving average frame time and FPS', () => {
    // Record multiple frames simulating ~60 FPS (16.6ms per frame)
    performanceMonitor.recordFrame(16.5, 42, 3, 1000);
    performanceMonitor.recordFrame(16.7, 45, 3, 1016.6);
    performanceMonitor.recordFrame(16.6, 50, 3, 1033.3);

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.frame.frameHistory.length).toBe(3);
    expect(metrics.frame.frameTimeMs).toBeCloseTo(16.6, 1);
    expect(metrics.frame.fps).toBeGreaterThan(50);
    expect(metrics.frame.fps).toBeLessThan(70);
    expect(metrics.frame.activeParticles).toBe(50);
  });

  it('limits frame history buffer to maximum 30 samples', () => {
    for (let i = 0; i < 50; i++) {
      performanceMonitor.recordFrame(16.0, i, 3, 1000 + i * 16.6);
    }
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.frame.frameHistory.length).toBe(30);
    expect(metrics.frame.activeParticles).toBe(49);
  });

  it('correctly tracks min and max frame times', () => {
    performanceMonitor.recordFrame(12.0, 10, 3, 1000);
    performanceMonitor.recordFrame(33.0, 20, 3, 1016.6);
    performanceMonitor.recordFrame(16.0, 15, 3, 1033.3);

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.frame.minFps).toBeGreaterThanOrEqual(0);
    expect(metrics.frame.peakFrameTimeMs).toBe(33.0);
  });

  it('correctly calculates chunk memory stats for uncompressed and compressed chunks', () => {
    const mockTileGrid = Array.from({ length: 80 }, () => Array.from({ length: 80 }, () => TileType.Grass));
    const mockDiscovered = Array.from({ length: 80 }, () => Array.from({ length: 80 }, () => true));

    const uncompressedChunk: OverworldChunk = {
      chunkX: 0,
      chunkY: 0,
      map: mockTileGrid,
      discovered: mockDiscovered,
      visible: mockDiscovered,
      npcs: [],
      enemies: [],
      chests: [],
      traps: [],
      lootPiles: [],
      dungeons: [],
      towns: [],
      biome: 'forest',
      weather: 'clear',
    };

    const compressedChunk = compressChunk(uncompressedChunk);

    const chunksMap: Record<string, OverworldChunk> = {
      '0,0': uncompressedChunk,
      '1,0': compressedChunk,
    };

    const stats = getChunkMemoryStats(chunksMap);
    expect(stats.totalLoaded).toBe(2);
    expect(stats.uncompressed).toBe(1);
    expect(stats.compressed).toBe(1);
    expect(stats.estimatedMemoryKb).toBeGreaterThan(0);
    expect(stats.savedMemoryKb).toBeGreaterThan(0);
    expect(stats.uncompressedPercent).toBe(50);
  });

  it('toggles HUD state and persists to localStorage', () => {
    expect(performanceMonitor.isHudOpen()).toBe(false);

    const state1 = performanceMonitor.toggleHud();
    expect(state1).toBe(true);
    expect(performanceMonitor.isHudOpen()).toBe(true);
    expect(localStorage.getItem('abyss_perf_hud_open')).toBe('true');

    const state2 = performanceMonitor.toggleHud();
    expect(state2).toBe(false);
    expect(performanceMonitor.isHudOpen()).toBe(false);
    expect(localStorage.getItem('abyss_perf_hud_open')).toBe('false');
  });

  it('toggles collapsed mode and cycles HUD position', () => {
    expect(performanceMonitor.isHudCollapsed()).toBe(false);
    performanceMonitor.setHudCollapsed(true);
    expect(performanceMonitor.isHudCollapsed()).toBe(true);
    expect(localStorage.getItem('abyss_perf_hud_collapsed')).toBe('true');

    const initialPos = performanceMonitor.getPosition();
    const nextPos = performanceMonitor.cyclePosition();
    expect(nextPos).not.toBe(initialPos);
    expect(performanceMonitor.getPosition()).toBe(nextPos);
  });

  it('notifies subscribers on state updates and cleans up listeners', () => {
    const listener = vi.fn();
    const unsubscribe = performanceMonitor.subscribe(listener);

    performanceMonitor.setHudOpen(true);
    expect(listener).toHaveBeenCalledTimes(1);

    performanceMonitor.setHudCollapsed(true);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    listener.mockClear();

    performanceMonitor.setHudOpen(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
