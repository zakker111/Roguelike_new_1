import React, { useCallback } from "react";
import { GameState, GameLogMessage, EquipmentItem, WeaponBaseType } from "../../types";
import { playSound } from "../../utils/audio";
import { formatGameTime } from "../../utils/overworld";
import { addEquipmentItemToInventory } from "../../utils/scrollUtils";
import { CraftingSubEngineProps } from "./types";
const WOOD_KEYS = ['mat_wood', 'mat_pine_log', 'mat_birch_log', 'mat_ship_pitch'];
const METAL_KEYS = ['mat_iron', 'mat_iron_ore', 'mat_steel', 'mat_copper_ore', 'mat_royal_iron', 'mat_mithril', 'mat_obsidian'];

function getTotalWoodCount(materials: Record<string, number>): number {
  return WOOD_KEYS.reduce((sum, key) => sum + (materials[key] || 0), 0);
}

function deductWoodCount(materials: Record<string, number>, required: number): Record<string, number> {
  const next = { ...materials };
  let needed = required;
  for (const key of WOOD_KEYS) {
    if (needed <= 0) break;
    const have = next[key] || 0;
    if (have > 0) {
      const take = Math.min(have, needed);
      next[key] = have - take;
      needed -= take;
    }
  }
  return next;
}

function getTotalMetalCount(materials: Record<string, number>): number {
  return METAL_KEYS.reduce((sum, key) => sum + (materials[key] || 0), 0);
}

function deductMetalCount(materials: Record<string, number>, required: number): Record<string, number> {
  const next = { ...materials };
  let needed = required;
  for (const key of METAL_KEYS) {
    if (needed <= 0) break;
    const have = next[key] || 0;
    if (have > 0) {
      const take = Math.min(have, needed);
      next[key] = have - take;
      needed -= take;
    }
  }
  return next;
}

export function useUtilityCrafting({
  setGameState,
  addLogMessage,
  setActiveTab,
  gameState,
}: CraftingSubEngineProps) {
  const handleBrewPotion = useCallback((
    recipeId: string,
    restoringHp: number,
    restoringMp: number,
    permanentStats: {
      str?: number;
      int?: number;
      def?: number;
      lck?: number;
      exhaustionReduction?: number;
    },
    costMaterials: { [matId: string]: number },
    costCatalysts: { [catId: string]: number },
    successLog: string
  ) => {
    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };
      for (const [matId, qty] of Object.entries(costMaterials)) {
        nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - qty);
      }
      
      const nextCats = { ...prev.inventoryCatalysts };
      for (const [catId, qty] of Object.entries(costCatalysts)) {
        nextCats[catId] = Math.max(0, (nextCats[catId] || 0) - qty);
      }

      const nextStats = {
        ...prev.playerStats,
        hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + restoringHp),
        mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + restoringMp),
        str: prev.playerStats.str + (permanentStats.str || 0),
        int: prev.playerStats.int + (permanentStats.int || 0),
        def: prev.playerStats.def + (permanentStats.def || 0),
        lck: prev.playerStats.lck + (permanentStats.lck || 0),
        exhaustion: Math.max(0, (prev.playerStats.exhaustion || 0) - (permanentStats.exhaustionReduction || 0))
      };

      const formattedTime = formatGameTime(prev.gameTime).timeStr;
      const nextLogs = [
        ...prev.logs,
        {
          id: `brew_${Date.now()}`,
          text: successLog,
          type: 'loot' as const,
          timestamp: formattedTime
        }
      ];

      playSound('spell');
      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `🧪 STAT INCREASED!`, type: 'heal' },
      });
      setTimeout(() => window.dispatchEvent(ev), 10);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        playerStats: nextStats,
        logs: nextLogs
      };
    });
  }, [setGameState]);


  const handleCraftFishingPole = useCallback(() => {
    setGameState((prev) => {
      const woodCount = getTotalWoodCount(prev.inventoryMaterials);
      const metalCount = getTotalMetalCount(prev.inventoryMaterials);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (woodCount < 2 || metalCount < 1) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need 2x Wood and 1x Metal to assemble an Ancient Fishing Pole!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      let nextMats = deductMetalCount(prev.inventoryMaterials, 1);
      nextMats = deductWoodCount(nextMats, 2);
      nextMats['mat_fishing_pole'] = (nextMats['mat_fishing_pole'] || 0) + 1;

      playSound('craft');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🎣 You successfully shape wood and metal into an Ancient Fishing Pole! Feel free to angle next to lakes or rivers!`,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Fishing Pole`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  }, [setGameState]);

  const handleCraftLockpicks = useCallback(() => {
    setGameState((prev) => {
      const metalCount = getTotalMetalCount(prev.inventoryMaterials);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (metalCount < 1) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need at least 1 Metal or Iron bar to fashion Tension Lockpicks!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      let nextMats = deductMetalCount(prev.inventoryMaterials, 1);
      nextMats['mat_lockpick'] = (nextMats['mat_lockpick'] || 0) + 3;

      playSound('craft');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🔑 You successfully forge metal into 3x Tension Lockpicks! Ready to crack open dungeon caches.`,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+3 Lockpicks`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  }, [setGameState]);

  const handleCraftHatchet = useCallback(() => {
    setGameState((prev) => {
      const woodCount = getTotalWoodCount(prev.inventoryMaterials);
      const metalCount = getTotalMetalCount(prev.inventoryMaterials);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (woodCount < 2 || metalCount < 1) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need 2x Wood and 1x Metal or Iron to forge a Lumberjack Hatchet!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      let nextMats = deductMetalCount(prev.inventoryMaterials, 1);
      nextMats = deductWoodCount(nextMats, 2);

      const newHatchet: EquipmentItem = {
        id: `tool_hatchet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: 'Lumberjack Hatchet 🪓',
        type: 'weapon',
        subType: WeaponBaseType.Sword,
        defense: 0,
        damage: 6,
        critChance: 0.10,
        range: 1,
        color: '#94a3b8',
        description: 'A sturdy handaxe for chopping down trees and harvesting timber. Works automatically from inventory or equipped! Cannot be repaired.',
        value: 15,
        durability: 100,
        maxDurability: 100,
        isTool: true,
        isRepairable: false,
      };

      playSound('craft');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🪓 Forged a Lumberjack Hatchet! It works automatically from your inventory or equipped slot for chopping trees.`,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Hatchet`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        equipmentInventory: [...prev.equipmentInventory, newHatchet],
        logs: [...truncatedLogs, successMsg]
      };
    });
  }, [setGameState]);

  const handleCraftPickaxe = useCallback(() => {
    setGameState((prev) => {
      const woodCount = getTotalWoodCount(prev.inventoryMaterials);
      const metalCount = getTotalMetalCount(prev.inventoryMaterials);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (woodCount < 2 || metalCount < 2) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need 2x Wood and 2x Metal or Iron to forge a Prospector Pickaxe!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      let nextMats = deductMetalCount(prev.inventoryMaterials, 2);
      nextMats = deductWoodCount(nextMats, 2);

      const newPickaxe: EquipmentItem = {
        id: `tool_pickaxe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: 'Prospector Pickaxe ⛏️',
        type: 'weapon',
        subType: WeaponBaseType.Hammer,
        defense: 0,
        damage: 5,
        critChance: 0.05,
        range: 1,
        color: '#f59e0b',
        description: 'A heavy iron pickaxe for mining copper and iron mineral veins. Works automatically from inventory or equipped! Cannot be repaired.',
        value: 15,
        durability: 100,
        maxDurability: 100,
        isTool: true,
        isRepairable: false,
      };

      playSound('craft');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `⛏️ Forged a Prospector Pickaxe! It works automatically from your inventory or equipped slot for mining mineral veins.`,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Pickaxe`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        equipmentInventory: [...prev.equipmentInventory, newPickaxe],
        logs: [...truncatedLogs, successMsg]
      };
    });
  }, [setGameState]);

  const handleCraftRecallScroll = useCallback(() => {
    setGameState((prev) => {
      const dragonScaleCount = prev.inventoryMaterials['mat_dragonscale'] || 0;
      const feyBoneCount = prev.inventoryMaterials['mat_feybone'] || 0;
      const shadowCatalystCount = prev.inventoryCatalysts['cat_shadow'] || 0;

      const normTime = prev.gameTime % 1440;
      const { timeStr } = formatGameTime(normTime);
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (dragonScaleCount < 1 || feyBoneCount < 1 || shadowCatalystCount < 1) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You lack the rare elements (Primal Dragon Scale, Withered Fey Bone, Null Echo Stone) to craft a Scroll of Recall!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_dragonscale': dragonScaleCount - 1,
        'mat_feybone': feyBoneCount - 1,
      };

      const nextCatalysts = {
        ...prev.inventoryCatalysts,
        'cat_shadow': shadowCatalystCount - 1,
      };

      const newScroll: EquipmentItem = {
        id: `scroll_recall_town_${Date.now()}_${Math.random()}`,
        name: 'Scroll of Recall 📜',
        type: 'scroll' as any,
        subType: 'Scroll' as any,
        defense: 0,
        damage: 0,
        critChance: 0,
        range: 0,
        color: '#38bdf8',
        description: 'A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!',
        value: 200,
        durability: 100,
        maxDurability: 100
      };

      playSound('spell');

      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `📜 [ARCANUM CRAFT]: You weave ancient Ley-line magical energy, fusing a Primal Dragon Scale, Withered Fey Bone, and Null Echo Stone into a sparkling Scroll of Recall!`,
        type: 'craft',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Recall Scroll 📜`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCatalysts,
        equipmentInventory: addEquipmentItemToInventory(prev.equipmentInventory, newScroll),
        logs: [...truncatedLogs, successMsg]
      };
    });
  }, [setGameState]);

  return {
    handleBrewPotion,
    handleCraftFishingPole,
    handleCraftLockpicks,
    handleCraftHatchet,
    handleCraftPickaxe,
    handleCraftRecallScroll,
  };
}
