/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState } from '../types';
import { generateOverworldChunk } from './overworld';
import { generateLevel } from './dungeon';
import { computeFOV } from './ai';
import { appendBoundedLogs } from './logBuffer';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from './gameUtils';

/**
 * Regenerates the player's current location (Overworld chunk or Dungeon level) on the fly.
 * Used by Developer/God Mode live-tuning.
 */
export function regenerateCurrentLocation(gameState: GameState): Partial<GameState> {
  if (gameState.isOverworld) {
    const updatedChunk = generateOverworldChunk(
      gameState.currentChunkX,
      gameState.currentChunkY,
      LEVEL_WIDTH,
      LEVEL_HEIGHT,
      gameState.spawnedCats,
      gameState.spawnedSeppo,
      gameState.playerStats,
      gameState.currentWeapon
    );
    const visibleMask = computeFOV(gameState.playerX, gameState.playerY, updatedChunk.map, 6);
    const nextLogs = appendBoundedLogs(gameState.logs, {
      id: `regen_${Date.now()}`,
      text: `⚡ SYSTEM: Live-regenerated Overworld Chunk (${gameState.currentChunkX}, ${gameState.currentChunkY}) using modified JSON configurations!`,
      type: 'system',
      timestamp: 'GOD',
    }, 200);

    const nextSpawnedCats = gameState.spawnedCats ? [...gameState.spawnedCats] : [];
    updatedChunk.npcs.forEach((n) => {
      if (n.id?.startsWith('npc_cat_')) {
        const catName = n.name.split(' (')[0];
        if (!nextSpawnedCats.includes(catName)) {
          nextSpawnedCats.push(catName);
        }
      }
    });
    const hasSeppo = updatedChunk.npcs.some((n) => n.id === 'npc_seppo');

    return {
      map: updatedChunk.map,
      npcs: updatedChunk.npcs,
      enemies: updatedChunk.enemies,
      chests: updatedChunk.chests,
      traps: updatedChunk.traps,
      discovered: visibleMask,
      visible: visibleMask,
      spawnedCats: nextSpawnedCats,
      spawnedSeppo: gameState.spawnedSeppo || hasSeppo,
      overworldChunks: {
        ...gameState.overworldChunks,
        [`${gameState.currentChunkX},${gameState.currentChunkY}`]: updatedChunk,
      },
      logs: nextLogs,
    };
  } else {
    const newDungeon = generateLevel(
      LEVEL_WIDTH,
      LEVEL_HEIGHT,
      gameState.playerStats.depth,
      gameState.playerStats.turnsPlayed,
      gameState.playerStats.realTimeSeconds,
      gameState.playerStats,
      gameState.currentWeapon,
      gameState.defeatedEnemiesCount,
      gameState.clearedCamps?.length || 0
    );
    const visibleMask = computeFOV(newDungeon.playerX, newDungeon.playerY, newDungeon.map, 6);
    const nextLogs = appendBoundedLogs(gameState.logs, {
      id: `regen_${Date.now()}`,
      text: `⚡ SYSTEM: Live-regenerated Dungeon Level ${gameState.playerStats.depth} using modified JSON enemy templates!`,
      type: 'system',
      timestamp: 'GOD',
    }, 200);

    return {
      map: newDungeon.map,
      playerX: newDungeon.playerX,
      playerY: newDungeon.playerY,
      enemies: newDungeon.enemies,
      chests: newDungeon.chests,
      traps: newDungeon.traps,
      discovered: visibleMask,
      visible: visibleMask,
      logs: nextLogs,
    };
  }
}
