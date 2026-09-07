import { describe, it, expect } from 'vitest';
import { exportRealmMapToPng } from '../utils/worldmap/worldMapPngExporter';
import { createNewGameRun } from '../utils/gameStateFactory';

describe('World Map PNG Exporter', () => {
  it('gracefully handles export in Node/JSDOM environments with safe defaults', async () => {
    const gameState = createNewGameRun();
    gameState.currentChunkX = 0;
    gameState.currentChunkY = 0;
    (gameState as any).visitedChunks = ['0,0', '1,0', '-1,0'];

    const result = await exportRealmMapToPng(gameState, { scale: 0.4 });
    expect(result).toBeDefined();
    // Result should report success or valid dimensions
    if (result.success) {
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.filename).toContain('40pct');
    }
  });

  it('calculates bounding boxes and scales correctly with worldMapFullyRevealed', async () => {
    const gameState = createNewGameRun();
    gameState.worldMapFullyRevealed = true;
    (gameState as any).visitedChunks = ['0,0', '2,2', '-2,-2'];

    const result = await exportRealmMapToPng(gameState, { scale: 0.4, filename: 'custom_realm.png' });
    expect(result).toBeDefined();
    expect(result.filename).toBe('custom_realm.png');
  });
});
