import { GameState, TileType, EquipmentItem, CraftedWeapon, isToolItem } from '../types';

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

export function harvestWorldResource(
  tile: TileType,
  targetX: number,
  targetY: number,
  gameState: GameState
): HarvestResult {
  const isTree = tile === TileType.Tree || tile === TileType.PineTree || tile === TileType.BirchTree;
  const isOre = tile === TileType.CopperVein || tile === TileType.IronVein;

  if (!isTree && !isOre) {
    return { handled: false, success: false };
  }

  const toolType = isTree ? 'hatchet' : 'pickaxe';
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

  // Perform harvesting
  const replacementTile = isTree
    ? TileType.TreeStump
    : (gameState.isOverworld ? TileType.Grass : TileType.Floor);

  const nextMap = gameState.map.map((row, y) =>
    row.map((cell, x) => (x === targetX && y === targetY ? replacementTile : cell))
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

  const nextMats = {
    ...gameState.inventoryMaterials,
    [resId]: (gameState.inventoryMaterials[resId] || 0) + 1
  };
  if (isTree) {
    nextMats['mat_wood'] = (gameState.inventoryMaterials['mat_wood'] || 0) + 1;
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
      ? `💥 TOOL BROKE: Your ${toolInfo.item.name} broke into pieces from wear and was destroyed! (+1 ${resourceName})`
      : `${isTree ? '🪓' : '⛏️'} You harvested ${resourceName} using your ${toolInfo.item.name}! [Durability: ${newDurability}/${maxDurability}]`,
    logType: isBroken ? 'danger' : 'loot',
    effectText: isBroken ? `💥 Tool Broke!` : `${isTree ? '🪓' : '⛏️'} +1 Harvest`
  };
}
