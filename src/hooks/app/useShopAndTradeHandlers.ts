import React from 'react';
import { GameState, EquipmentItem, DungeonLevelState } from '../../types';
import { getMerchantConfig } from '../../utils/shopData';
import { getCharismaDiscountMultiplier } from '../../utils/gameUtils';
import { getItemWeight, checkWeightCapacity, getMaxWeight, getMaterialUnitWeight } from '../../utils/itemWeight';
import { getBiomePriceMultiplier } from '../../utils/tradeEconomy';
import { formatGameTime, generateOverworldChunk } from '../../utils/overworld';
import { findNearestSafePlayerTile } from '../../utils/gameUtils';
import { consumeItemFromInventory } from '../../utils/scrollUtils';
import { computeFOV } from '../../utils/ai';
import { spawnFollowersOnLevelLoadByReset } from '../../utils/dungeon';

interface UseShopAndTradeHandlersProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound: (sound: any) => void;
  addLogMessage: (text: string, type?: any) => void;
  activeRecallScroll: EquipmentItem | null;
  setActiveRecallScroll: (item: EquipmentItem | null) => void;
  levelWidth: number;
  levelHeight: number;
}

export function useShopAndTradeHandlers({
  gameState,
  setGameState,
  playSound,
  addLogMessage,
  activeRecallScroll,
  setActiveRecallScroll,
  levelWidth,
  levelHeight,
}: UseShopAndTradeHandlersProps) {
  const handleBuyEquipment = (item: EquipmentItem) => {
    const activeId = gameState.activeTradeNpcId || 'npc_shop';
    const activeNpc = gameState.npcs?.find((n) => n.id === activeId);
    const activeRole = activeNpc?.role || (activeId === 'npc_caravan_merchant' || activeId.includes('caravan') ? 'merchant' : '');
    const mConfig = getMerchantConfig(activeRole, activeId);

    const reputation = gameState.townReputation ?? 100;
    if (reputation <= 20 && activeRole !== 'merchant_seppo') {
      playSound('bump');
      addLogMessage(`❌ REFUSED: Town merchants refuse to trade with a notorious Sunder Outlaw!`, 'system');
      return;
    }

    const currentStock =
      gameState.merchantStock?.[activeId]?.[item.id] !== undefined
        ? gameState.merchantStock[activeId][item.id]
        : mConfig.defaultStock[item.id] !== undefined
        ? mConfig.defaultStock[item.id]
        : 2;

    if (currentStock <= 0) {
      playSound('bump');
      addLogMessage(`❌ "${item.name}" is currently OUT OF STOCK! Wait for the next trade restock phase.`, 'system');
      return;
    }

    const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
    const discountMult = hasChampionDiscount ? 0.8 : reputation >= 51 ? 0.9 : 1.0;
    const chaMult = getCharismaDiscountMultiplier(gameState);
    const itemValue = Math.round(item.value * discountMult * chaMult);

    if (gameState.playerStats.gold < itemValue) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold to buy "${item.name}". You need ${itemValue} Gold!`, 'system');
      return;
    }

    const weight = getItemWeight(item);
    if (!checkWeightCapacity(gameState, weight)) {
      playSound('bump');
      addLogMessage(
        `❌ Cannot buy "${item.name}": Exceeds carry weight capacity (Max: ${getMaxWeight(gameState)} kg, Item: ${weight} kg). Discard or sell items first!`,
        'danger'
      );
      return;
    }

    playSound('loot');
    setGameState((prev) => {
      const nextInv = [
        ...prev.equipmentInventory,
        {
          ...item,
          id: `buy_${item.id}_${Date.now()}_${Math.random()}`,
          durability: item.durability ?? 100,
          maxDurability: item.maxDurability ?? 100,
        },
      ];
      const nextStats = { ...prev.playerStats, gold: prev.playerStats.gold - itemValue };

      const updatedStockCopy = prev.merchantStock ? { ...prev.merchantStock } : {};
      if (!updatedStockCopy[activeId]) {
        updatedStockCopy[activeId] = { ...mConfig.defaultStock };
      }
      updatedStockCopy[activeId][item.id] = Math.max(0, currentStock - 1);

      return {
        ...prev,
        equipmentInventory: nextInv,
        playerStats: nextStats,
        merchantStock: updatedStockCopy,
      };
    });
    addLogMessage(`🛒 Purchased ${item.name} for ${itemValue} Gold! Added to your inventory stash.`, 'loot');
    if (activeRole === 'merchant_seppo') {
      const drunkLogs = [
        `🥴 Seppo: "Ah, yes... *hic*... a fine purchase! This gold will fund my next double-fermentation round!"`,
        `🥴 Seppo: "Treat it well... *burp*... it was forged with direct blood, sweat, and sauna steam!"`,
        `🥴 Seppo: "Sisu, traveler! Sisu is... *hic*... the key to everything!"`,
      ];
      addLogMessage(drunkLogs[Math.floor(Math.random() * drunkLogs.length)], 'loot');
    }
  };

  const handleBuyResource = (type: 'material' | 'catalyst' | 'potion', id: string, price: number) => {
    const activeId = gameState.activeTradeNpcId || 'npc_shop';
    const activeNpc = gameState.npcs?.find((n) => n.id === activeId);
    const activeRole = activeNpc?.role || (activeId === 'npc_caravan_merchant' || activeId.includes('caravan') ? 'merchant' : '');
    const mConfig = getMerchantConfig(activeRole, activeId);

    const reputation = gameState.townReputation ?? 100;
    if (reputation <= 20 && activeRole !== 'merchant_seppo') {
      playSound('bump');
      addLogMessage(`❌ REFUSED: Town merchants refuse to trade with a notorious Sunder Outlaw!`, 'system');
      return;
    }

    const currentStock =
      gameState.merchantStock?.[activeId]?.[id] !== undefined
        ? gameState.merchantStock[activeId][id]
        : mConfig.defaultStock[id] !== undefined
        ? mConfig.defaultStock[id]
        : 3;

    if (currentStock <= 0) {
      playSound('bump');
      addLogMessage(`❌ This item is currently OUT OF STOCK! Please wait for the next market restock.`, 'system');
      return;
    }

    const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
    const discountMult = hasChampionDiscount ? 0.8 : reputation >= 51 ? 0.9 : 1.0;
    const chaMult = getCharismaDiscountMultiplier(gameState);

    // Apply dynamic trade economy biome multipliers and guild discount research
    const biomeMult = getBiomePriceMultiplier(id, gameState.biome);
    const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
    const baseAdjustedPrice = Math.round(price * biomeMult * upgradedDiscountMult);
    const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);

    if (gameState.playerStats.gold < finalPrice) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold to purchase this shop item!`, 'system');
      return;
    }

    if (type !== 'potion') {
      const weight = getMaterialUnitWeight(id);
      if (!checkWeightCapacity(gameState, weight)) {
        playSound('bump');
        addLogMessage(
          `❌ Cannot purchase this resource: Exceeds carry weight capacity (Unit: ${weight} kg). Discard or sell items first!`,
          'danger'
        );
        return;
      }
    }

    playSound('loot');
    setGameState((prev) => {
      const nextStats = { ...prev.playerStats, gold: prev.playerStats.gold - finalPrice };

      const updatedStockCopy = prev.merchantStock ? { ...prev.merchantStock } : {};
      if (!updatedStockCopy[activeId]) {
        updatedStockCopy[activeId] = { ...mConfig.defaultStock };
      }
      updatedStockCopy[activeId][id] = Math.max(0, currentStock - 1);

      let nextPoleDurability = prev.fishingPoleDurability;
      if (id === 'mat_fishing_pole') {
        nextPoleDurability = 7;
        addLogMessage(`🎣 Purchased a solid new fishing pole! Sturdy and ready with 7 uses left!`, 'loot');
      }

      if (type === 'material') {
        if (id === 'mat_transmuter') {
          addLogMessage(`🧪 Purchased the Portable Alchemical Transmuter (Wild Magic Flask)! Option unlocked in backpack.`, 'loot');
          return {
            ...prev,
            hasTransmuter: true,
            playerStats: nextStats,
            fishingPoleDurability: nextPoleDurability,
            merchantStock: updatedStockCopy,
          };
        }
        const nextMats = { ...prev.inventoryMaterials };
        nextMats[id] = (nextMats[id] || 0) + 1;
        addLogMessage(`🛒 Purchased Alloys material: 1x ${id.replace('mat_', '').toUpperCase()} for ${finalPrice} Gold.`, 'loot');
        return {
          ...prev,
          inventoryMaterials: nextMats,
          playerStats: nextStats,
          fishingPoleDurability: nextPoleDurability,
          merchantStock: updatedStockCopy,
        };
      } else if (type === 'catalyst') {
        const nextCats = { ...prev.inventoryCatalysts };
        nextCats[id] = (nextCats[id] || 0) + 1;
        addLogMessage(`🛒 Purchased Elemental Shard: 1x ${id.replace('cat_', '').toUpperCase()} Catalyst for ${finalPrice} Gold.`, 'loot');
        return {
          ...prev,
          inventoryCatalysts: nextCats,
          playerStats: nextStats,
          merchantStock: updatedStockCopy,
        };
      } else {
        const nextMats = { ...prev.inventoryMaterials };
        nextMats[id] = (nextMats[id] || 0) + 1;

        const itemNames: { [k: string]: string } = {
          potion_hp: 'Apothecary Elixir (HP)',
          potion_mp: 'Aether Beverage (MP)',
          potion_medium_hp: 'Rejuvenating Potion (Medium HP)',
          potion_medium_mp: 'Rejuvenating Beverage (Medium MP)',
          potion_full_rejuv: 'Elixir of Full Restoration',
          potion_full_rejuvenation: 'Royal Champion Rejuvenation Elixir',
          scroll_recall: 'Scroll of Escape',
        };
        const displayName = itemNames[id] || id.replace('potion_', '').replace('scroll_', '').toUpperCase();
        addLogMessage(`🛒 Purchased: 1x ${displayName} (added to your backpack provisions stash).`, 'loot');

        return {
          ...prev,
          inventoryMaterials: nextMats,
          playerStats: nextStats,
          merchantStock: updatedStockCopy,
        };
      }
    });
    if (activeRole === 'merchant_seppo') {
      const drunkLogs = [
        `🥴 Seppo: "That's the real stuff... *hic*! Warm sauna spirit in a bottle!"`,
        `🥴 Seppo: "Don't drink it all at once! Or do... *burp*... I have more copper tubs running!"`,
        `🥴 Seppo: "May the forest spirits... *hic*... bless your kidneys!"`,
      ];
      addLogMessage(drunkLogs[Math.floor(Math.random() * drunkLogs.length)], 'loot');
    }
  };

  const handleBuyEnchantedGear = (gearId: 'horse' | 'camel' | 'worg' | 'crocodile', price: number, gearName: string) => {
    const reputation = gameState.townReputation ?? 100;
    const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
    const discountMult = hasChampionDiscount ? 0.8 : reputation >= 51 ? 0.9 : 1.0;
    const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
    const chaMult = getCharismaDiscountMultiplier(gameState);
    const baseAdjustedPrice = Math.round(price * upgradedDiscountMult);
    const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);

    if (gameState.playerStats.gold < finalPrice) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold to purchase ${gearName}! Costs ${finalPrice} Gold.`, 'system');
      return;
    }

    let item: EquipmentItem;
    if (gearId === 'horse') {
      item = {
        id: `purchased_enchanted_horse_${Date.now()}`,
        name: 'Stallion-Sprung Greaves',
        type: 'armor',
        subType: 'Boots',
        defense: 2,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#f97316',
        description: 'Pre-enchanted Sabatons. [Enchanted: Stallion Speed. Overworld travel speed increased (3m/turn travel time cost).]',
        value: Math.round(price / 2),
        durability: 120,
        maxDurability: 120,
        traits: ['STALLION_SPEED'],
      };
    } else if (gearId === 'camel') {
      item = {
        id: `purchased_enchanted_camel_${Date.now()}`,
        name: 'Dune-Treader Sabatons',
        type: 'armor',
        subType: 'Boots',
        defense: 2,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#eab308',
        description: 'Pre-enchanted Sabatons. [Enchanted: Dune Desert Immunity. Complete immunity to sandstorms, sand-blindness, and heat fatigue!]',
        value: Math.round(price / 2),
        durability: 120,
        maxDurability: 120,
        traits: ['DESERT_IMMUNITY'],
      };
    } else if (gearId === 'worg') {
      item = {
        id: `purchased_enchanted_worg_${Date.now()}`,
        name: 'Worg-Spiked Gauntlets',
        type: 'armor',
        subType: 'Gloves',
        defense: 2,
        damage: 3,
        critChance: 0.05,
        range: 1,
        color: '#9333ea',
        description: 'Pre-enchanted Gauntlets. [Enchanted: Worg Force. Adds +3 damage to physical attacks and pacifies wild Wolves!]',
        value: Math.round(price / 2),
        durability: 120,
        maxDurability: 120,
        traits: ['WORG_FORCE'],
      };
    } else {
      item = {
        id: `purchased_enchanted_crocodile_${Date.now()}`,
        name: 'Crocodile Bayou Sabatons',
        type: 'armor',
        subType: 'Boots',
        defense: 2,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#16a34a',
        description: 'Pre-enchanted Sabatons. [Enchanted: Swamp-Glide. Move through swamp paths at extreme speed (2m/turn) and walk safely on water!]',
        value: Math.round(price / 2),
        durability: 120,
        maxDurability: 120,
        traits: ['SWAMP_GLIDE'],
      };
    }

    playSound('levelUp');
    setGameState((prev) => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        gold: prev.playerStats.gold - finalPrice,
      },
      equipmentInventory: [...prev.equipmentInventory, item],
    }));

    addLogMessage(`🛡️ [ENCHANTED GEAR PURCHASED]: You bought ${item.name}! Added directly to your backpack. Equip it from your Gear tab!`, 'loot');

    const ev = new CustomEvent('spawn-game-effect', {
      detail: { x: gameState.playerX, y: gameState.playerY, text: `🛡️ Purchased!`, type: 'heal' },
    });
    window.dispatchEvent(ev);
  };

  const handleRecallTeleport = (destX: number, destY: number, destName: string) => {
    if (!activeRecallScroll) return;
    const scrollId = activeRecallScroll.id;
    setActiveRecallScroll(null);

    playSound('spell');
    setGameState((prev) => {
      if (prev.playerStats.mp < 15) {
        const errorMsgs = [...prev.logs];
        errorMsgs.push({
          id: `recall_fail_mana_${Date.now()}`,
          text: `❌ [CAST FAIL]: Your attempt to read the Scroll of Recall failed due to insufficient Mana!`,
          type: 'system',
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
        return {
          ...prev,
          logs: errorMsgs,
        };
      }

      const updatedInventory = consumeItemFromInventory(prev.equipmentInventory, scrollId, 1);

      let updatedDungeonLevels = prev.dungeonLevels || {};
      if (!prev.isOverworld) {
        const exChunkX = prev.currentChunkX;
        const exChunkY = prev.currentChunkY;
        const currentDepth = prev.playerStats.depth;
        const key = `${exChunkX},${exChunkY}_depth-${currentDepth}`;

        const saved: DungeonLevelState = {
          depth: currentDepth,
          chunkX: exChunkX,
          chunkY: exChunkY,
          map: prev.map,
          discovered: prev.discovered,
          visible: prev.visible,
          enemies: prev.enemies,
          traps: prev.traps,
          chests: prev.chests,
          lootPiles: prev.lootPiles || [],
          corpses: prev.corpses || [],
          bloodSplatters: prev.bloodSplatters || [],
          props: prev.dungeonProps || [],
        };

        updatedDungeonLevels = {
          ...updatedDungeonLevels,
          [key]: saved,
        };
      }

      const targetChunkKey = `${destX},${destY}`;
      let updatedChunks = prev.overworldChunks ? { ...prev.overworldChunks } : {};
      let targetChunk = updatedChunks[targetChunkKey];
      const nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
      let hasSeppoOnLoad = false;

      const newPx = Math.floor(levelWidth / 2);
      const newPy = Math.floor(levelHeight / 2) + 2;

      if (!targetChunk) {
        targetChunk = generateOverworldChunk(destX, destY, levelWidth, levelHeight, nextSpawnedCats, prev.spawnedSeppo, prev.playerStats, prev.currentWeapon);
        targetChunk.npcs.forEach((n) => {
          if (n.id?.startsWith('npc_cat_')) {
            const catName = n.name.split(' (')[0];
            if (!nextSpawnedCats.includes(catName)) {
              nextSpawnedCats.push(catName);
            }
          }
        });
        hasSeppoOnLoad = targetChunk.npcs.some((n) => n.id === 'npc_seppo');
      }

      const safePlayerPos = findNearestSafePlayerTile(newPx, newPy, targetChunk.map);
      const finalPx = safePlayerPos.x;
      const finalPy = safePlayerPos.y;

      const fov = computeFOV(finalPx, finalPy, targetChunk.map, 6);
      const discovered = targetChunk.map.map((row, y) =>
        row.map((cell, x) => (targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false)
      );

      const nextVisited = { ...prev.visitedTiles };
      nextVisited[`${finalPx},${finalPy},${destX},${destY}`] = true;

      const newMsgs = [...prev.logs];
      newMsgs.push({
        id: `recall_teleport_${Date.now()}`,
        text: `🔮 [RECALL PORTAL ACTIVATED]: You read the Scroll of Recall! Blazing leyline sigils erupt around your feet, warping space and time. You instantly dematerialize and reappear in the safety of ${destName}!`,
        type: 'loot',
        timestamp: formatGameTime(prev.gameTime).timeStr,
      });

      return {
        ...prev,
        isOverworld: true,
        playerX: finalPx,
        playerY: finalPy,
        currentChunkX: destX,
        currentChunkY: destY,
        overworldChunks: {
          ...updatedChunks,
          [targetChunkKey]: targetChunk,
        },
        spawnedCats: nextSpawnedCats,
        spawnedSeppo: prev.spawnedSeppo || hasSeppoOnLoad,
        map: targetChunk.map,
        discovered: discovered,
        visible: fov,
        enemies: spawnFollowersOnLevelLoadByReset(targetChunk.enemies, prev.followers, finalPx, finalPy, targetChunk.map),
        traps: targetChunk.traps,
        chests: targetChunk.chests,
        npcs: targetChunk.npcs,
        lootPiles: targetChunk.lootPiles || [],
        corpses: [],
        bloodSplatters: [],
        dungeonProps: [],
        dungeonLevels: updatedDungeonLevels,
        equipmentInventory: updatedInventory,
        logs: newMsgs,
        playerStats: {
          ...prev.playerStats,
          depth: 0,
          mp: Math.max(0, prev.playerStats.mp - 15),
        },
      };
    });
  };

  const handleSellEquipment = (item: EquipmentItem) => {
    const activeId = gameState.activeTradeNpcId || 'npc_shop';
    const activeNpc = gameState.npcs?.find((n) => n.id === activeId);
    const activeRole = activeNpc?.role || (activeId === 'npc_caravan_merchant' || activeId.includes('caravan') ? 'merchant' : '');

    const reputation = gameState.townReputation ?? 100;
    if (reputation <= 20 && activeRole !== 'merchant_seppo') {
      playSound('bump');
      addLogMessage(`❌ REFUSED: Town merchants refuse to trade with a notorious Sunder Outlaw!`, 'system');
      return;
    }

    const mConfig = getMerchantConfig(activeRole, activeId);
    const currentGold = gameState.merchantGold?.[activeId] !== undefined ? gameState.merchantGold[activeId] : mConfig.maxGold;

    const finalPayout = gameState.hasActiveCaravanLicense ? Math.round(item.value * 1.3) : item.value;

    if (currentGold < finalPayout) {
      playSound('bump');
      addLogMessage(
        `❌ ${activeNpc?.name || 'The merchant'} does not have enough Gold coins! Merchant has ${currentGold} Gold, you want to sell for ${finalPayout} Gold.`,
        'system'
      );
      return;
    }

    playSound('loot');
    setGameState((prev) => {
      const nextInv = prev.equipmentInventory.filter((it) => it.id !== item.id);
      const nextStats = { ...prev.playerStats, gold: prev.playerStats.gold + finalPayout };
      const updatedGoldCopy = prev.merchantGold ? { ...prev.merchantGold } : {};
      updatedGoldCopy[activeId] = Math.max(0, currentGold - finalPayout);

      return {
        ...prev,
        equipmentInventory: nextInv,
        playerStats: nextStats,
        merchantGold: updatedGoldCopy,
      };
    });
    addLogMessage(`💰 Sold "${item.name}" for +${finalPayout} Gold back to shop keeper!`, 'loot');
  };

  const handleSellResource = (type: 'material' | 'catalyst', id: string, payout: number) => {
    const activeId = gameState.activeTradeNpcId || 'npc_shop';
    const activeNpc = gameState.npcs?.find((n) => n.id === activeId);
    const activeRole = activeNpc?.role || (activeId === 'npc_caravan_merchant' || activeId.includes('caravan') ? 'merchant' : '');

    const reputation = gameState.townReputation ?? 100;
    if (reputation <= 20 && activeRole !== 'merchant_seppo') {
      playSound('bump');
      addLogMessage(`❌ REFUSED: Town merchants refuse to trade with a notorious Sunder Outlaw!`, 'system');
      return;
    }

    const mConfig = getMerchantConfig(activeRole, activeId);
    const currentGold = gameState.merchantGold?.[activeId] !== undefined ? gameState.merchantGold[activeId] : mConfig.maxGold;

    // Apply dynamic trade economy biome multipliers and guild logistics sell bonuses
    const biomeMult = getBiomePriceMultiplier(id, gameState.biome);
    const upgradedSellMult = 1.0 + (gameState.guildUpgrades?.['up_supply_deals'] || 0) * 0.2;
    const baseAdjustedPayout = Math.round(payout * biomeMult * upgradedSellMult);
    const finalPayout = gameState.hasActiveCaravanLicense ? Math.round(baseAdjustedPayout * 1.3) : baseAdjustedPayout;

    if (currentGold < finalPayout) {
      playSound('bump');
      addLogMessage(
        `❌ ${activeNpc?.name || 'The merchant'} does not have enough Gold coins! Merchant has ${currentGold} Gold, you want to sell for ${finalPayout} Gold.`,
        'system'
      );
      return;
    }

    playSound('loot');
    setGameState((prev) => {
      const nextStats = { ...prev.playerStats, gold: prev.playerStats.gold + finalPayout };
      const updatedGoldCopy = prev.merchantGold ? { ...prev.merchantGold } : {};
      updatedGoldCopy[activeId] = Math.max(0, currentGold - finalPayout);

      if (type === 'material') {
        const count = prev.inventoryMaterials[id] || 0;
        if (count <= 0) return prev;
        const nextMats = { ...prev.inventoryMaterials, [id]: count - 1 };
        addLogMessage(`💰 Sold 1x ${id.replace('mat_', '').toUpperCase()} Material back for +${finalPayout} Gold.`, 'loot');
        return {
          ...prev,
          inventoryMaterials: nextMats,
          playerStats: nextStats,
          merchantGold: updatedGoldCopy,
        };
      } else {
        const count = prev.inventoryCatalysts[id] || 0;
        if (count <= 0) return prev;
        const nextCats = { ...prev.inventoryCatalysts, [id]: count - 1 };
        addLogMessage(`💰 Sold 1x ${id.replace('cat_', '').toUpperCase()} Catalyst back for +${finalPayout} Gold.`, 'loot');
        return {
          ...prev,
          inventoryCatalysts: nextCats,
          playerStats: nextStats,
          merchantGold: updatedGoldCopy,
        };
      }
    });
  };

  return {
    handleBuyEquipment,
    handleBuyResource,
    handleBuyEnchantedGear,
    handleRecallTeleport,
    handleSellEquipment,
    handleSellResource,
  };
}
