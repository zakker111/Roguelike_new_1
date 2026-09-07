import { describe, it, expect, beforeEach } from 'vitest';
import { asyncChunkBatcher } from '../utils/overworld/asyncChunkBatcher';
import { generateOverworldChunk } from '../utils/overworld/overworldChunkGen';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../utils/gameUtils';

describe('Async Chunk Batcher & Background Pre-generation', () => {
  beforeEach(() => {
    asyncChunkBatcher.clearCache();
  });

  it('generates and caches chunks asynchronously', async () => {
    expect(asyncChunkBatcher.hasCachedChunk(0, 0)).toBe(false);

    const chunkPromise = asyncChunkBatcher.getOrGenerateChunkAsync(0, 0);
    expect(chunkPromise).toBeInstanceOf(Promise);

    const chunk = await chunkPromise;
    expect(chunk).toBeDefined();
    expect(chunk.chunkX).toBe(0);
    expect(chunk.chunkY).toBe(0);
    expect(chunk.map.length).toBe(LEVEL_HEIGHT);
    expect(chunk.map[0].length).toBe(LEVEL_WIDTH);

    expect(asyncChunkBatcher.hasCachedChunk(0, 0)).toBe(true);
    const cached = asyncChunkBatcher.getCachedChunkSync(0, 0);
    expect(cached).toBe(chunk);
  });

  it('stores and retrieves pre-generated chunks without recalculation', () => {
    const chunk = generateOverworldChunk(2, 3, LEVEL_WIDTH, LEVEL_HEIGHT);
    asyncChunkBatcher.storeChunkInCache(chunk);

    expect(asyncChunkBatcher.hasCachedChunk(2, 3)).toBe(true);
    const retrieved = asyncChunkBatcher.getCachedChunkSync(2, 3);
    expect(retrieved).toBe(chunk);
  });

  it('schedules surrounding chunks for non-blocking pre-generation', async () => {
    asyncChunkBatcher.pregenerateSurroundingChunks(5, 5, 1);

    // Wait a brief tick for async batch processing
    await new Promise(r => setTimeout(r, 60));

    // At least one or more surrounding chunks should be cached
    const hasAnySurrounding = [
      asyncChunkBatcher.hasCachedChunk(4, 5),
      asyncChunkBatcher.hasCachedChunk(6, 5),
      asyncChunkBatcher.hasCachedChunk(5, 4),
      asyncChunkBatcher.hasCachedChunk(5, 6),
    ].some(Boolean);

    expect(hasAnySurrounding).toBe(true);
  });
});
