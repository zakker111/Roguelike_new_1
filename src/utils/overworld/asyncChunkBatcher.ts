/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OverworldChunk, LEVEL_WIDTH, LEVEL_HEIGHT } from '../../types';
import { generateOverworldChunk } from './overworldChunkGen';

export interface ChunkGeneratorOptions {
  spawnedCats?: string[];
  spawnedSeppo?: boolean;
  playerStats?: { level: number; str: number; dex: number; int: number; cha: number; lck: number };
  currentWeapon?: { damage: number; name?: string } | null;
  priority?: number; // Higher numbers get processed first
}

interface QueuedChunkTask {
  chunkX: number;
  chunkY: number;
  options?: ChunkGeneratorOptions;
  resolve: (chunk: OverworldChunk) => void;
  reject: (err: any) => void;
}

/**
 * High-performance non-blocking asynchronous chunk streaming and background pre-generation queue.
 * Ensures chunk calculations are batched in micro-tasks / requestIdleCallback time slices,
 * preventing any frame stutter during rapid world exploration or full map reveals.
 */
class AsyncChunkBatcherService {
  private queue: QueuedChunkTask[] = [];
  private inFlightTasks = new Set<string>();
  private cache = new Map<string, OverworldChunk>();
  private isProcessing = false;
  private maxCacheSize = 250;
  private timeSliceMs = 8; // Milliseconds allowed per frame/task slice

  /**
   * Request a chunk asynchronously. If already cached or precomputed, returns immediately.
   */
  public async getOrGenerateChunkAsync(
    chunkX: number,
    chunkY: number,
    options?: ChunkGeneratorOptions
  ): Promise<OverworldChunk> {
    const key = `${chunkX},${chunkY}`;

    // 1. Return from memory cache if ready
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // 2. Queue for background generator
    return new Promise<OverworldChunk>((resolve, reject) => {
      this.queue.push({
        chunkX,
        chunkY,
        options,
        resolve,
        reject,
      });

      // Sort queue by priority if needed
      if (options?.priority) {
        this.queue.sort((a, b) => (b.options?.priority || 0) - (a.options?.priority || 0));
      }

      this.scheduleProcessQueue();
    });
  }

  /**
   * Proactively pre-generates adjacent ring of chunks surrounding the player's active sector.
   * Runs at low priority in background idle slices.
   */
  public pregenerateSurroundingChunks(
    centerChunkX: number,
    centerChunkY: number,
    radius: number = 1,
    options?: ChunkGeneratorOptions
  ): void {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx === 0 && dy === 0) continue; // Current chunk is already loaded
        const cx = centerChunkX + dx;
        const cy = centerChunkY + dy;
        const key = `${cx},${cy}`;

        if (!this.cache.has(key) && !this.inFlightTasks.has(key)) {
          // Distance from center as inverse priority (closer = higher priority)
          const dist = Math.abs(dx) + Math.abs(dy);
          const priority = 10 - dist;

          this.getOrGenerateChunkAsync(cx, cy, {
            ...options,
            priority,
          }).catch(() => {
            // Background pre-gen errors silently caught
          });
        }
      }
    }
  }

  /**
   * Stores an already-known chunk into cache to avoid duplicate background generation
   */
  public storeChunkInCache(chunk: OverworldChunk): void {
    const key = `${chunk.chunkX},${chunk.chunkY}`;
    this.setCache(key, chunk);
  }

  /**
   * Checks if a chunk is already cached
   */
  public hasCachedChunk(chunkX: number, chunkY: number): boolean {
    return this.cache.has(`${chunkX},${chunkY}`);
  }

  /**
   * Retrieves a cached chunk synchronously if present
   */
  public getCachedChunkSync(chunkX: number, chunkY: number): OverworldChunk | undefined {
    return this.cache.get(`${chunkX},${chunkY}`);
  }

  /**
   * Clears or flushes cached chunks to manage memory
   */
  public clearCache(): void {
    this.cache.clear();
    this.inFlightTasks.clear();
    this.queue = [];
  }

  private setCache(key: string, chunk: OverworldChunk): void {
    // Evict oldest if cache exceeded
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, chunk);
  }

  private scheduleProcessQueue(): void {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(
        (deadline: { timeRemaining: () => number; didTimeout: boolean }) => {
          this.processQueueSlice(deadline);
        },
        { timeout: 50 }
      );
    } else {
      setTimeout(() => {
        this.processQueueSlice();
      }, 0);
    }
  }

  private processQueueSlice(deadline?: { timeRemaining: () => number; didTimeout: boolean }): void {
    const startTime = performance.now();

    while (this.queue.length > 0) {
      // Check time limit
      const timeRemaining = deadline ? deadline.timeRemaining() : this.timeSliceMs - (performance.now() - startTime);
      if (timeRemaining <= 1 && (!deadline || !deadline.didTimeout)) {
        break; // Yield back to main event loop / render frame
      }

      const task = this.queue.shift();
      if (!task) break;

      const key = `${task.chunkX},${task.chunkY}`;
      this.inFlightTasks.add(key);

      try {
        let chunk: OverworldChunk;
        if (this.cache.has(key)) {
          chunk = this.cache.get(key)!;
        } else {
          chunk = generateOverworldChunk(
            task.chunkX,
            task.chunkY,
            LEVEL_WIDTH,
            LEVEL_HEIGHT,
            task.options?.spawnedCats,
            task.options?.spawnedSeppo,
            task.options?.playerStats,
            task.options?.currentWeapon
          );
          this.setCache(key, chunk);
        }

        this.inFlightTasks.delete(key);
        task.resolve(chunk);
      } catch (err) {
        this.inFlightTasks.delete(key);
        task.reject(err);
      }
    }

    this.isProcessing = false;

    if (this.queue.length > 0) {
      this.scheduleProcessQueue();
    }
  }
}

export const asyncChunkBatcher = new AsyncChunkBatcherService();
