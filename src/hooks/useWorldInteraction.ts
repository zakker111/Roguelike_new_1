import React, { useCallback } from 'react';
import { GameState, GameLogMessage, OverworldChunk, TileType, EquipmentItem, CraftedWeapon, isToolItem } from '../types';
import { playSound } from '../utils/audio';
import { computeFOV } from '../utils/ai';

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
    const isTree = tile === TileType.Tree || tile === TileType.PineTree || tile === TileType.BirchTree;
    const isOre = tile === TileType.CopperVein || tile === TileType.IronVein;

    if (!isTree && !isOre) return false;

    const toolType = isTree ? 'hatchet' : 'pickaxe';
    let toolInfo: { location: 'right' | 'left' | 'inventory'; item: EquipmentItem | CraftedWeapon; index?: number } | null = null;

    if (isToolItem(gameState.currentWeapon, toolType)) {
      toolInfo = { location: 'right', item: gameState.currentWeapon! };
    } else if (isToolItem(gameState.equippedShield, toolType)) {
      toolInfo = { location: 'left', item: gameState.equippedShield! };
    } else {
      const invIdx = gameState.equipmentInventory.findIndex((it) => isToolItem(it, toolType));
      if (invIdx !== -1) {
        toolInfo = { location: 'inventory', item: gameState.equipmentInventory[invIdx], index: invIdx };
      }
    }

    if (!toolInfo) {
      playSound('bump');
      if (isTree) {
        addLogMessage(`🌲 This tree requires a Hatchet or Axe in your inventory or hand to chop down! (Craft one under Crafting -> Survival)`, 'system');
      } else {
        addLogMessage(`⛏️ This ore vein requires a Pickaxe in your inventory or hand to mine! (Craft one under Crafting -> Survival)`, 'system');
      }
      return true; // Handled (blocked)
    }

    // Perform harvesting
    const nextMap = gameState.map.map((row, y) =>
      row.map((cell, x) => (x === targetX && y === targetY ? TileType.Grass : cell))
    );

    const curDurability = toolInfo.item.durability ?? 100;
    const maxDurability = toolInfo.item.maxDurability ?? 100;
    const newDurability = Math.max(0, curDurability - 20);
    const isBroken = newDurability <= 0;

    let resourceName = '';
    let resId = '';

    if (isTree) {
      resId = tile === TileType.PineTree ? 'mat_pine_log' : (tile === TileType.BirchTree ? 'mat_birch_log' : 'mat_wood');
      resourceName = tile === TileType.PineTree ? 'Aromatic Pine Log 🌲' : (tile === TileType.BirchTree ? 'Pale Birch Log 🌳' : 'Scrap Wood 🌲');
    } else {
      resId = tile === TileType.CopperVein ? 'mat_copper_ore' : 'mat_iron_ore';
      resourceName = tile === TileType.CopperVein ? 'Raw Copper Ore ⛋' : 'Raw Iron Ore ⛋';
    }

    setGameState((prev) => {
      const nextMats = {
        ...prev.inventoryMaterials,
        [resId]: (prev.inventoryMaterials[resId] || 0) + 1
      };
      if (isTree) {
        nextMats['mat_wood'] = (prev.inventoryMaterials['mat_wood'] || 0) + 1;
      }

      const nextChunks = { ...prev.overworldChunks };
      const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      if (prev.isOverworld && nextChunks[chunkKey]) {
        nextChunks[chunkKey] = {
          ...nextChunks[chunkKey],
          map: nextMap
        };
      }

      let nextCurrentWeapon = prev.currentWeapon;
      let nextEquippedShield = prev.equippedShield;
      let nextEquipmentInventory = [...prev.equipmentInventory];

      if (toolInfo!.location === 'right') {
        if (isBroken) {
          nextCurrentWeapon = null;
        } else if (nextCurrentWeapon) {
          nextCurrentWeapon = { ...nextCurrentWeapon, durability: newDurability };
        }
      } else if (toolInfo!.location === 'left') {
        if (isBroken) {
          nextEquippedShield = null;
        } else if (nextEquippedShield) {
          nextEquippedShield = { ...nextEquippedShield, durability: newDurability };
        }
      } else if (toolInfo!.location === 'inventory' && toolInfo!.index !== undefined) {
        if (isBroken) {
          nextEquipmentInventory.splice(toolInfo!.index, 1);
        } else {
          nextEquipmentInventory[toolInfo!.index] = {
            ...nextEquipmentInventory[toolInfo!.index],
            durability: newDurability
          };
        }
      }

      return {
        ...prev,
        map: nextMap,
        overworldChunks: nextChunks,
        inventoryMaterials: nextMats,
        currentWeapon: nextCurrentWeapon,
        equippedShield: nextEquippedShield,
        equipmentInventory: nextEquipmentInventory,
      };
    });

    playSound('spell');
    if (isBroken) {
      playSound('bump');
      addLogMessage(`💥 TOOL BROKE: Your ${toolInfo.item.name} broke into pieces from wear and was destroyed! (+1 ${resourceName})`, 'danger');
    } else {
      addLogMessage(`${isTree ? '🪓' : '⛏️'} You harvested ${resourceName} using your ${toolInfo.item.name}! [Durability: ${newDurability}/${maxDurability}]`, 'loot');
    }

    const ev = new CustomEvent('spawn-game-effect', {
      detail: { x: targetX, y: targetY, text: isBroken ? `💥 Tool Broke!` : `${isTree ? '🪓' : '⛏️'} +1 Harvest`, type: isBroken ? 'damage' : 'heal' },
    });
    window.dispatchEvent(ev);

    executeEnemiesTurn(gameState.playerX, gameState.playerY);
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
