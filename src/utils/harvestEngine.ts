/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, TileType, EquipmentItem, CraftedWeapon, isToolItem } from '../types';
import {
  getTileDefinition,
  getTileHarvestReplacement
} from '../world/tileRegistry';

export interface HarvestResult {
  handled: boolean;
  success: boolean;
  newState?: GameState;
  logMessage?: string;
  logType?: 'system' | 'loot' | 'danger' | 'craft';
  soundToPlay?: string;
  effectText?: string;
  isBroken?: boolean;
}

/**
 * Harvests a resource tile (tree, ore vein, etc.) from the game world based on declarative definitions
 * registered in the authoritative tile registry.
 */
export function harvestWorldResource(
  tile: TileType,
  targetX: number,
  targetY: number,
  gameState: GameState
): HarvestResult {
  const tileDef = getTileDefinition(tile);
  if (!tileDef || !tileDef.isHarvestable || !tileDef.harvestTool || tileDef.harvestTool === 'none') {
    return { handled: false, success: false };
  }

  const toolType = tileDef.harvestTool; // 'hatchet' | 'pickaxe'
  const isTree = toolType === 'hatchet';
  let toolInfo: { location: 'right' | 'left' | 'inventory'; item: EquipmentItem | CraftedWeapon; index?: number } | null = null;
  let brokenToolFound: EquipmentItem | CraftedWeapon | null = null;

  const isUsableTool = (item: EquipmentItem | CraftedWeapon | null | undefined): boolean => {
    if (!item || !isToolItem(item, toolType)) return false;
    const isBroken = item.durability !== undefined && item.durability <= 0;
    if (isBroken) {
      if (!brokenToolFound) brokenToolFound = item;
      return false;
    }
    return true;
  };

  if (isUsableTool(gameState.currentWeapon)) {
    toolInfo = { location: 'right', item: gameState.currentWeapon! };
  } else if (isUsableTool(gameState.equippedShield)) {
    toolInfo = { location: 'left', item: gameState.equippedShield! };
  } else {
    const invIdx = gameState.equipmentInventory.findIndex((it) => isUsableTool(it));
    if (invIdx !== -1) {
      toolInfo = { location: 'inventory', item: gameState.equipmentInventory[invIdx], index: invIdx };
    }
  }

  if (!toolInfo) {
    if (brokenToolFound) {
      const toolLabel = isTree ? 'hatchet/axe' : 'pickaxe';
      return {
        handled: true,
        success: false,
        soundToPlay: 'bump',
        logMessage: `❌ Your ${brokenToolFound.name} is broken (0 Durability)! You cannot ${isTree ? 'chop wood' : 'mine ore'} with a broken ${toolLabel}. Craft a new one under Crafting -> Survival.`,
        logType: 'danger'
      };
    } else {
      return {
        handled: true,
        success: false,
        soundToPlay: 'bump',
        logMessage: isTree
          ? `🌲 This tree requires a Hatchet or Axe in your inventory or hand to chop down! (Craft one under Crafting -> Survival)`
          : `⛏️ This ore vein requires a Pickaxe in your inventory or hand to mine! (Craft one under Crafting -> Survival)`,
        logType: 'system'
      };
    }
  }

  // Perform harvesting with declarative replacement tile
  const replacementTile = getTileHarvestReplacement(tile, gameState.isOverworld);

  const nextMap = gameState.map.map((row, y) =>
    row.map((cell, x) => (x === targetX && y === targetY ? replacementTile : cell))
  );

  const curDurability = toolInfo.item.durability ?? 100;
  const maxDurability = toolInfo.item.maxDurability ?? 100;
  const newDurability = Math.max(0, curDurability - 20);
  const isBroken = newDurability <= 0;

  // Declarative yield resolution from tileRegistry
  const yieldDef = tileDef.harvestYield || {
    materialId: isTree ? 'mat_wood' : 'mat_copper_ore',
    name: tileDef.name,
    count: 1
  };
  const resId = yieldDef.materialId;
  const count = yieldDef.count ?? 1;
  const resourceName = yieldDef.name;

  const nextMats = {
    ...gameState.inventoryMaterials,
    [resId]: (gameState.inventoryMaterials[resId] || 0) + count
  };

  if (yieldDef.secondaryMaterialId) {
    const secCount = yieldDef.secondaryCount ?? 1;
    nextMats[yieldDef.secondaryMaterialId] = (gameState.inventoryMaterials[yieldDef.secondaryMaterialId] || 0) + secCount;
  }

  const nextChunks = { ...gameState.overworldChunks };
  const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
  if (gameState.isOverworld && nextChunks[chunkKey]) {
    nextChunks[chunkKey] = {
      ...nextChunks[chunkKey],
      map: nextMap
    };
  }

  let nextCurrentWeapon = gameState.currentWeapon;
  let nextEquippedShield = gameState.equippedShield;
  let nextEquipmentInventory = [...gameState.equipmentInventory];

  if (toolInfo.location === 'right') {
    if (isBroken) {
      nextCurrentWeapon = null;
    } else if (nextCurrentWeapon) {
      nextCurrentWeapon = { ...nextCurrentWeapon, durability: newDurability };
    }
  } else if (toolInfo.location === 'left') {
    if (isBroken) {
      nextEquippedShield = null;
    } else if (nextEquippedShield) {
      nextEquippedShield = { ...nextEquippedShield, durability: newDurability };
    }
  } else if (toolInfo.location === 'inventory' && toolInfo.index !== undefined) {
    if (isBroken) {
      nextEquipmentInventory.splice(toolInfo.index, 1);
    } else {
      nextEquipmentInventory[toolInfo.index] = {
        ...nextEquipmentInventory[toolInfo.index],
        durability: newDurability
      };
    }
  }

  const nextDungeonLevels = { ...(gameState.dungeonLevels || {}) };
  const dungeonKey = `${gameState.dungeonEntranceChunkX ?? gameState.currentChunkX ?? 0},${gameState.dungeonEntranceChunkY ?? gameState.currentChunkY ?? 0}_depth-${gameState.playerStats.depth}`;
  if (!gameState.isOverworld && nextDungeonLevels[dungeonKey]) {
    nextDungeonLevels[dungeonKey] = {
      ...nextDungeonLevels[dungeonKey],
      map: nextMap
    };
  }

  const nextState: GameState = {
    ...gameState,
    map: nextMap,
    overworldChunks: nextChunks,
    dungeonLevels: nextDungeonLevels,
    inventoryMaterials: nextMats,
    currentWeapon: nextCurrentWeapon,
    equippedShield: nextEquippedShield,
    equipmentInventory: nextEquipmentInventory,
  };

  return {
    handled: true,
    success: true,
    newState: nextState,
    isBroken,
    soundToPlay: isBroken ? 'bump' : 'spell',
    logMessage: isBroken
      ? `💥 TOOL BROKE: Your ${toolInfo.item.name} broke into pieces from wear and was destroyed! (+${count} ${resourceName})`
      : `${isTree ? '🪓' : '⛏️'} You harvested ${resourceName} using your ${toolInfo.item.name}! [Durability: ${newDurability}/${maxDurability}]`,
    logType: isBroken ? 'danger' : 'loot',
    effectText: isBroken ? `💥 Tool Broke!` : `${isTree ? '🪓' : '⛏️'} +${count} Harvest`
  };
}
