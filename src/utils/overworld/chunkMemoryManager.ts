/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OverworldChunk, TileType } from '../../types';

export const ACTIVE_CHUNK_WINDOW_RADIUS = 2; // 5x5 grid = 25 chunks
export const MAX_ACTIVE_CHUNKS = 25;
export const MAX_TOTAL_CACHED_CHUNKS = 120;

/**
 * Compresses an 80x80 TileType 2D matrix into a compact Run-Length Encoded (RLE) string.
 * Reduces 6,400 array slots to ~50-100 tokens (~400 bytes).
 */
export function compressTileMap(grid?: TileType[][]): string {
  if (!grid || grid.length === 0 || !grid[0] || grid[0].length === 0) return '';
  const height = grid.length;
  const width = grid[0].length;
  const tokens: string[] = [`${width}x${height}`];

  let currentVal = grid[0][0];
  let currentCount = 0;

  for (let y = 0; y < height; y++) {
    const row = grid[y];
    for (let x = 0; x < width; x++) {
      const val = row[x];
      if (val === currentVal) {
        currentCount++;
      } else {
        tokens.push(`${currentCount}:${currentVal}`);
        currentVal = val;
        currentCount = 1;
      }
    }
  }

  if (currentCount > 0) {
    tokens.push(`${currentCount}:${currentVal}`);
  }

  return tokens.join(',');
}

/**
 * Decompresses an RLE string back into a full 2D TileType matrix.
 */
export function decompressTileMap(compressed?: string): TileType[][] {
  if (!compressed) return [];
  const tokens = compressed.split(',');
  if (tokens.length < 2) return [];

  const [wStr, hStr] = tokens[0].split('x');
  const width = parseInt(wStr, 10) || 80;
  const height = parseInt(hStr, 10) || 80;

  const grid: TileType[][] = Array.from({ length: height }, () => new Array(width).fill(TileType.Empty));
  let curY = 0;
  let curX = 0;

  for (let i = 1; i < tokens.length; i++) {
    const colonIdx = tokens[i].indexOf(':');
    if (colonIdx === -1) continue;
    const count = parseInt(tokens[i].slice(0, colonIdx), 10);
    const val = tokens[i].slice(colonIdx + 1) as TileType;

    for (let c = 0; c < count; c++) {
      grid[curY][curX] = val;
      curX++;
      if (curX >= width) {
        curX = 0;
        curY++;
        if (curY >= height) break;
      }
    }
    if (curY >= height) break;
  }

  return grid;
}

/**
 * Compresses an 80x80 boolean 2D matrix into a compact RLE string.
 */
export function compressBoolGrid(grid?: boolean[][]): string {
  if (!grid || grid.length === 0 || !grid[0] || grid[0].length === 0) return '';
  const height = grid.length;
  const width = grid[0].length;
  const tokens: string[] = [`${width}x${height}`];

  let currentVal = grid[0][0] ? 1 : 0;
  let currentCount = 0;

  for (let y = 0; y < height; y++) {
    const row = grid[y];
    for (let x = 0; x < width; x++) {
      const val = row[x] ? 1 : 0;
      if (val === currentVal) {
        currentCount++;
      } else {
        tokens.push(`${currentCount}:${currentVal}`);
        currentVal = val;
        currentCount = 1;
      }
    }
  }

  if (currentCount > 0) {
    tokens.push(`${currentCount}:${currentVal}`);
  }

  return tokens.join(',');
}

/**
 * Decompresses an RLE string back into a full 2D boolean matrix.
 */
export function decompressBoolGrid(compressed?: string): boolean[][] {
  if (!compressed) return [];
  const tokens = compressed.split(',');
  if (tokens.length < 2) return [];

  const [wStr, hStr] = tokens[0].split('x');
  const width = parseInt(wStr, 10) || 80;
  const height = parseInt(hStr, 10) || 80;

  const grid: boolean[][] = Array.from({ length: height }, () => new Array(width).fill(false));
  let curY = 0;
  let curX = 0;

  for (let i = 1; i < tokens.length; i++) {
    const colonIdx = tokens[i].indexOf(':');
    if (colonIdx === -1) continue;
    const count = parseInt(tokens[i].slice(0, colonIdx), 10);
    const val = tokens[i].slice(colonIdx + 1) === '1';

    for (let c = 0; c < count; c++) {
      grid[curY][curX] = val;
      curX++;
      if (curX >= width) {
        curX = 0;
        curY++;
        if (curY >= height) break;
      }
    }
    if (curY >= height) break;
  }

  return grid;
}

/**
 * Compresses an OverworldChunk by serializing its heavy 2D grids (map, discovered, secondFloorMap)
 * into lightweight strings and removing the 2D arrays from RAM.
 */
export function compressChunk(chunk: OverworldChunk): OverworldChunk {
  if (chunk.isCompressed && chunk.compressedData) {
    return chunk;
  }

  const compressedData = {
    compressedMap: compressTileMap(chunk.map),
    compressedDiscovered: compressBoolGrid(chunk.discovered),
    compressedSecondFloorMap: chunk.secondFloorMap ? compressTileMap(chunk.secondFloorMap) : undefined,
    compressedSecondFloorDiscovered: chunk.secondFloorDiscovered ? compressBoolGrid(chunk.secondFloorDiscovered) : undefined,
  };

  return {
    ...chunk,
    isCompressed: true,
    compressedData,
    // Clear heavy 2D arrays to free memory
    map: [] as any,
    discovered: [] as any,
    visible: [] as any,
    secondFloorMap: undefined,
    secondFloorDiscovered: undefined,
    secondFloorVisible: undefined,
  };
}

/**
 * Decompresses a compressed OverworldChunk back into its full 2D array representation.
 */
export function decompressChunk(chunk: OverworldChunk): OverworldChunk {
  if (!chunk.isCompressed || !chunk.compressedData) {
    return chunk;
  }

  const decompressedMap = decompressTileMap(chunk.compressedData.compressedMap);
  const decompressedDiscovered = decompressBoolGrid(chunk.compressedData.compressedDiscovered);
  const decompressedSecondFloorMap = chunk.compressedData.compressedSecondFloorMap
    ? decompressTileMap(chunk.compressedData.compressedSecondFloorMap)
    : undefined;
  const decompressedSecondFloorDiscovered = chunk.compressedData.compressedSecondFloorDiscovered
    ? decompressBoolGrid(chunk.compressedData.compressedSecondFloorDiscovered)
    : undefined;

  const height = decompressedMap.length || 80;
  const width = decompressedMap[0]?.length || 80;

  return {
    ...chunk,
    isCompressed: false,
    compressedData: undefined,
    map: decompressedMap,
    discovered: decompressedDiscovered,
    visible: Array.from({ length: height }, () => new Array(width).fill(false)),
    secondFloorMap: decompressedSecondFloorMap,
    secondFloorDiscovered: decompressedSecondFloorDiscovered,
  };
}

/**
 * Ensures a chunk is decompressed. Idempotent.
 */
export function ensureChunkDecompressed(chunk: OverworldChunk): OverworldChunk {
  if (chunk.isCompressed && chunk.compressedData) {
    return decompressChunk(chunk);
  }
  return chunk;
}

/**
 * Helper to safely extract a tile map from either a compressed or uncompressed chunk.
 */
export function getChunkMapGrid(chunk: OverworldChunk): TileType[][] {
  if (chunk.map && chunk.map.length > 0) {
    return chunk.map;
  }
  if (chunk.compressedData?.compressedMap) {
    return decompressTileMap(chunk.compressedData.compressedMap);
  }
  return [];
}

/**
 * Evaluates Chebyshev distance between two chunk coordinates.
 */
export function getChunkDistance(cx1: number, cy1: number, cx2: number, cy2: number): number {
  return Math.max(Math.abs(cx1 - cx2), Math.abs(cy1 - cy2));
}

/**
 * Enforces the active in-memory window of the 25 nearest chunks around the player.
 * - Nearest 25 chunks (5x5 Chebyshev radius <= 2) are kept uncompressed in memory.
 * - Distant chunks beyond the 25 nearest are serialized & compressed into RLE strings.
 * - If total cached chunks exceed `maxTotalCached` (e.g. 120), distant unvisited chunks are pruned to protect heap limits.
 */
export function manageActiveChunkWindow(
  chunks: Record<string, OverworldChunk>,
  playerCx: number,
  playerCy: number,
  maxActiveWindow: number = MAX_ACTIVE_CHUNKS,
  maxTotalCached: number = MAX_TOTAL_CACHED_CHUNKS
): Record<string, OverworldChunk> {
  const keys = Object.keys(chunks);
  if (keys.length <= 1) {
    return chunks;
  }

  // Calculate distance from current player chunk
  const chunksWithDist: Array<{ key: string; dist: number; chunk: OverworldChunk }> = [];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const c = chunks[k];
    if (!c) continue;
    const dist = getChunkDistance(c.chunkX, c.chunkY, playerCx, playerCy);
    chunksWithDist.push({ key: k, dist, chunk: c });
  }

  // Sort ascending by distance (closest first)
  chunksWithDist.sort((a, b) => a.dist - b.dist);

  let hasModifications = false;
  const nextChunks: Record<string, OverworldChunk> = {};

  for (let i = 0; i < chunksWithDist.length; i++) {
    const { key, dist, chunk } = chunksWithDist[i];

    // LRU Pruning of distant, unmodified chunks if over total limit
    if (i >= maxTotalCached) {
      const hasPlayerAssets = (chunk.npcs && chunk.npcs.some((n) => n.id?.startsWith('follower_'))) ||
        (chunk.watchtower && chunk.watchtower.isClaimed);
      if (!hasPlayerAssets) {
        // Prune distant chunk from memory
        hasModifications = true;
        continue;
      }
    }

    // Nearest 25 chunks: keep uncompressed
    if (i < maxActiveWindow && dist <= ACTIVE_CHUNK_WINDOW_RADIUS) {
      if (chunk.isCompressed) {
        nextChunks[key] = decompressChunk(chunk);
        hasModifications = true;
      } else {
        nextChunks[key] = chunk;
      }
    } else {
      // Distant chunks beyond 25: compress to reduce RAM footprint
      if (!chunk.isCompressed) {
        nextChunks[key] = compressChunk(chunk);
        hasModifications = true;
      } else {
        nextChunks[key] = chunk;
      }
    }
  }

  return hasModifications ? nextChunks : chunks;
}

export interface ChunkMemoryStats {
  totalLoaded: number;
  uncompressed: number;
  compressed: number;
  uncompressedPercent: number;
  estimatedMemoryKb: number;
  savedMemoryKb: number;
}

/**
 * Returns memory footprint and compression metrics across loaded overworld chunks.
 */
export function getChunkMemoryStats(chunks?: Record<string, OverworldChunk>): ChunkMemoryStats {
  if (!chunks) {
    return {
      totalLoaded: 0,
      uncompressed: 0,
      compressed: 0,
      uncompressedPercent: 0,
      estimatedMemoryKb: 0,
      savedMemoryKb: 0,
    };
  }

  const chunkList = Object.values(chunks);
  const totalLoaded = chunkList.length;
  let uncompressed = 0;
  let compressed = 0;

  for (let i = 0; i < totalLoaded; i++) {
    if (chunkList[i].isCompressed) {
      compressed++;
    } else {
      uncompressed++;
    }
  }

  // An uncompressed 80x80 chunk has 6,400 tile ints + discovery and visibility boolean arrays (~64KB heap)
  // A compressed RLE string chunk consumes ~0.4KB
  const rawKb = uncompressed * 64;
  const compKb = compressed * 0.4;
  const savedKb = compressed * (64 - 0.4);

  return {
    totalLoaded,
    uncompressed,
    compressed,
    uncompressedPercent: totalLoaded > 0 ? Math.round((uncompressed / totalLoaded) * 100) : 0,
    estimatedMemoryKb: Math.round(rawKb + compKb),
    savedMemoryKb: Math.round(savedKb),
  };
}
