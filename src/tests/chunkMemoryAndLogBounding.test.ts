/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  compressTileMap,
  decompressTileMap,
  compressBoolGrid,
  decompressBoolGrid,
  compressChunk,
  decompressChunk,
  manageActiveChunkWindow,
  getChunkMapGrid,
} from '../utils/overworld/chunkMemoryManager';
import { appendBoundedLogs, MAX_GAME_LOGS, createGameLogMessage } from '../utils/logBuffer';
import { OverworldChunk, TileType, GameLogMessage } from '../types';

describe('Phase 5.1: LRU Active Overworld Chunk Eviction Window & Compression', () => {
  it('correctly compresses and decompresses an 80x80 TileType grid with lossless fidelity', () => {
    // Create an 80x80 grid with natural patches
    const grid: TileType[][] = Array.from({ length: 80 }, (_, y) =>
      Array.from({ length: 80 }, (_, x) => {
        if (y < 20) return TileType.Water;
        if (x < 10) return TileType.Path;
        if (x > 60 && y > 60) return TileType.Wall;
        return TileType.Grass;
      })
    );

    const compressed = compressTileMap(grid);
    expect(compressed.length).toBeGreaterThan(0);
    // Uncompressed 80x80 stringified is >50,000 bytes; compressed RLE should be under 2000 bytes (>95% reduction)
    expect(compressed.length).toBeLessThan(2000);

    const decompressed = decompressTileMap(compressed);
    expect(decompressed.length).toBe(80);
    expect(decompressed[0].length).toBe(80);

    for (let y = 0; y < 80; y++) {
      for (let x = 0; x < 80; x++) {
        expect(decompressed[y][x]).toBe(grid[y][x]);
      }
    }
  });

  it('correctly compresses and decompresses an 80x80 boolean discovery grid', () => {
    const grid: boolean[][] = Array.from({ length: 80 }, (_, y) =>
      Array.from({ length: 80 }, (_, x) => (x + y) % 3 === 0)
    );

    const compressed = compressBoolGrid(grid);
    const decompressed = decompressBoolGrid(compressed);

    expect(decompressed.length).toBe(80);
    expect(decompressed[0].length).toBe(80);

    for (let y = 0; y < 80; y++) {
      for (let x = 0; x < 80; x++) {
        expect(decompressed[y][x]).toBe(grid[y][x]);
      }
    }
  });

  it('compresses a full OverworldChunk, clearing heavy 2D matrices, and restores them losslessly', () => {
    const originalChunk: OverworldChunk = {
      chunkX: 5,
      chunkY: 5,
      map: Array.from({ length: 80 }, () => new Array(80).fill(TileType.Grass)),
      discovered: Array.from({ length: 80 }, () => new Array(80).fill(false)),
      visible: Array.from({ length: 80 }, () => new Array(80).fill(false)),
      enemies: [],
      chests: [],
      traps: [],
      npcs: [],
      lootPiles: [],
      towns: [],
      dungeons: [],
      pois: [],
      biome: 'forest',
      weather: 'clear',
    };

    const compressed = compressChunk(originalChunk);
    expect(compressed.isCompressed).toBe(true);
    expect(compressed.compressedData).toBeDefined();
    // Memory arrays are cleared
    expect(compressed.map.length).toBe(0);

    // Can still read map via getChunkMapGrid helper
    const readMap = getChunkMapGrid(compressed);
    expect(readMap.length).toBe(80);
    expect(readMap[0][0]).toBe(TileType.Grass);

    // Fully decompress
    const restored = decompressChunk(compressed);
    expect(restored.isCompressed).toBe(false);
    expect(restored.map.length).toBe(80);
    expect(restored.map[0][0]).toBe(TileType.Grass);
  });

  it('enforces the 25 nearest chunks active window (keeping them uncompressed) and compresses distant sectors', () => {
    // Generate a 7x7 grid of chunks (49 chunks total) centered at (0, 0)
    const chunks: Record<string, OverworldChunk> = {};
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const key = `${dx},${dy}`;
        chunks[key] = {
          chunkX: dx,
          chunkY: dy,
          map: Array.from({ length: 80 }, () => new Array(80).fill(TileType.Grass)),
          discovered: Array.from({ length: 80 }, () => new Array(80).fill(false)),
          visible: Array.from({ length: 80 }, () => new Array(80).fill(false)),
          enemies: [],
          chests: [],
          traps: [],
          npcs: [],
          lootPiles: [],
          towns: [],
          dungeons: [],
          pois: [],
          biome: 'forest',
          weather: 'clear',
        };
      }
    }

    // Manage active chunk window with player at (0, 0)
    const managed = manageActiveChunkWindow(chunks, 0, 0, 25, 60);

    // Check center 5x5 window (25 chunks): Chebyshev dist <= 2
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const key = `${dx},${dy}`;
        expect(managed[key].isCompressed).toBeFalsy();
        expect(managed[key].map.length).toBe(80);
      }
    }

    // Check outer perimeter chunks (dist = 3): should be compressed to save RAM!
    const outerChunk = managed['3,3'];
    expect(outerChunk.isCompressed).toBe(true);
    expect(outerChunk.map.length).toBe(0);
    expect(outerChunk.compressedData).toBeDefined();
  });
});

describe('Phase 5.2: Game Log Memory Bounding & Virtualized View', () => {
  it('strictly caps in-memory logs to MAX_GAME_LOGS (200) with FIFO pruning', () => {
    let logs: GameLogMessage[] = [];

    // Push 300 logs sequentially
    for (let i = 0; i < 300; i++) {
      const msg = createGameLogMessage(`Action event ${i}`);
      logs = appendBoundedLogs(logs, msg, MAX_GAME_LOGS);
    }

    expect(logs.length).toBe(200);
    // Oldest 100 messages (0..99) should be pruned; message 100 should now be first
    expect(logs[0].text).toBe('Action event 100');
    expect(logs[logs.length - 1].text).toBe('Action event 299');
  });

  it('efficiently batches multiple logs while enforcing the 200 cap', () => {
    const initialLogs: GameLogMessage[] = Array.from({ length: 190 }, (_, i) =>
      createGameLogMessage(`Initial log ${i}`)
    );

    const incomingLogs: GameLogMessage[] = Array.from({ length: 30 }, (_, i) =>
      createGameLogMessage(`New combat event ${i}`)
    );

    const bounded = appendBoundedLogs(initialLogs, incomingLogs, 200);
    expect(bounded.length).toBe(200);
    // 190 + 30 = 220 -> 20 dropped from front
    expect(bounded[0].text).toBe('Initial log 20');
    expect(bounded[bounded.length - 1].text).toBe('New combat event 29');
  });
});
