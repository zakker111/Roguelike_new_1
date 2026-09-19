import React, { useCallback } from 'react';
import { GameState, GameLogMessage, OverworldChunk, TileType, EquipmentItem, CraftedWeapon, isToolItem } from '../types';
import { playSound } from '../utils/audio';
import { computeFOV } from '../utils/ai';
import { harvestWorldResource } from '../utils/harvestEngine';
import { chunkBackgroundCache } from '../canvas/chunkBackgroundCache';
import { invalidateChunkCanvasCache } from '../components/worldmap/chunkTileRasterizer';

export interface UseWorldInteractionProps {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: GameLogMessage['type']) => void;
  executeEnemiesTurn: (px: number, py: number) => void;
  setIsGameOver?: (over: boolean) => void;
  setShakeTrigger?: React.Dispatch<React.SetStateAction<number>>;
}

export function useWorldInteraction({
  setGameState,
  addLogMessage,
  executeEnemiesTurn,
}: UseWorldInteractionProps) {

  /**
   * Handles multi-floor overworld stairs transitions (ground floor <-> 2nd floor).
   */
  const handleOverworldStairsTransition = useCallback((targetX: number, targetY: number, direction: 'up' | 'down') => {
    playSound('levelUp');
    const isUp = direction === 'up';
    addLogMessage(`🪜 You climb ${isUp ? 'up' : 'down'} the stairs to the ${isUp ? 'second' : 'ground'} floor.`, 'system');

    setGameState((prev) => {
      const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const currentChunk = prev.overworldChunks[chunkKey];
      if (!currentChunk) return prev;

      const isGoingToSecond = isUp;
      const updatedChunk: OverworldChunk = {
        ...currentChunk,
        map: isGoingToSecond ? prev.map : (currentChunk.map || prev.map),
        discovered: isGoingToSecond ? prev.discovered : (currentChunk.discovered || prev.discovered),
        visible: isGoingToSecond ? prev.visible : (currentChunk.visible || prev.visible),
        secondFloorMap: isGoingToSecond ? (currentChunk.secondFloorMap || prev.map) : prev.map,
        secondFloorDiscovered: isGoingToSecond ? (currentChunk.secondFloorDiscovered || prev.discovered) : prev.discovered,
        secondFloorVisible: isGoingToSecond ? (currentChunk.secondFloorVisible || prev.visible) : prev.visible,
      };

      const nextOverworldChunks = {
        ...prev.overworldChunks,
        [chunkKey]: updatedChunk
      };

      const targetMap = isGoingToSecond
        ? (currentChunk.secondFloorMap || currentChunk.map)
        : currentChunk.map;
      const targetDiscovered = isGoingToSecond
        ? (currentChunk.secondFloorDiscovered || currentChunk.discovered)
        : currentChunk.discovered;

      const fov = computeFOV(targetX, targetY, targetMap, 6);
      const nextDiscovered = targetMap.map((row, y) =>
        row.map((cell, x) => (targetDiscovered[y]?.[x] || fov[y]?.[x] || false))
      );

      return {
        ...prev,
        overworldZ: isGoingToSecond ? 1 : 0,
        map: targetMap,
        discovered: nextDiscovered,
        visible: fov,
        playerX: targetX,
        playerY: targetY,
        overworldChunks: nextOverworldChunks
      };
    });

    executeEnemiesTurn(targetX, targetY);
  }, [setGameState, addLogMessage, executeEnemiesTurn]);

  /**
   * Handles harvesting resources like trees (wood) and ore veins (copper/iron).
   */
  const handleResourceHarvest = useCallback((
    tile: TileType,
    targetX: number,
    targetY: number,
    gameState: GameState
  ): boolean => {
    const result = harvestWorldResource(tile, targetX, targetY, gameState);
    if (!result.handled) return false;

    if (result.soundToPlay) {
      playSound(result.soundToPlay);
    }
    if (result.logMessage) {
      addLogMessage(result.logMessage, result.logType || 'system');
    }
    if (result.effectText) {
      const ev = new CustomEvent('spawn-game-effect', {
        detail: {
          x: targetX,
          y: targetY,
          text: result.effectText,
          type: result.isBroken ? 'damage' : 'heal'
        },
      });
      window.dispatchEvent(ev);
    }

    if (result.success && result.newState) {
      chunkBackgroundCache.invalidate();
      invalidateChunkCanvasCache(gameState.currentChunkX, gameState.currentChunkY);
      setGameState(result.newState);
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
    }

    return true;
  }, [setGameState, addLogMessage, executeEnemiesTurn]);

  /**
   * Opening doors in corridors/buildings.
   */
  const handleOpenDoor = useCallback((targetX: number, targetY: number, gameState: GameState) => {
    playSound('door_open', { x: targetX, y: targetY, playerX: gameState.playerX, playerY: gameState.playerY });
    const nextMap = gameState.map.map((row, y) =>
      row.map((cell, x) => (x === targetX && y === targetY ? TileType.Floor : cell))
    );
    chunkBackgroundCache.invalidate();
    invalidateChunkCanvasCache(gameState.currentChunkX, gameState.currentChunkY);
    setGameState((prev) => ({ ...prev, map: nextMap }));
    addLogMessage('🚪 You opened a heavy building door with a creak and latch release.', 'system');
    executeEnemiesTurn(gameState.playerX, gameState.playerY);
  }, [setGameState, addLogMessage, executeEnemiesTurn]);

  return {
    handleOverworldStairsTransition,
    handleResourceHarvest,
    handleOpenDoor,
  };
}
