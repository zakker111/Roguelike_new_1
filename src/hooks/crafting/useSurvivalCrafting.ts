import React, { useCallback } from "react";
import { TileType, GameState, GameLogMessage } from "../../types";
import { playSound } from "../../utils/audio";
import { LEVEL_WIDTH, LEVEL_HEIGHT } from "../../utils/gameUtils";
import { formatGameTime } from "../../utils/overworld";
import { CraftingSubEngineProps } from "./types";

const WOOD_KEYS = ['mat_wood', 'mat_pine_log', 'mat_birch_log', 'mat_ship_pitch'];
const METAL_KEYS = ['mat_iron', 'mat_iron_ore', 'mat_steel', 'mat_royal_iron', 'mat_copper_ore', 'mat_mithril', 'mat_obsidian'];

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

export function useSurvivalCrafting({
  setGameState,
  addLogMessage,
  setActiveTab,
  gameState,
}: CraftingSubEngineProps) {
  const handlePlaceCampfire = useCallback(() => {
    setGameState((prev) => {
      const woodCount = getTotalWoodCount(prev.inventoryMaterials);
      if (woodCount < 3) {
        addLogMessage("❌ You do not have enough Wood or Timber (3 required) to place a campfire!", "system");
        return prev;
      }

      const px = prev.playerX;
      const py = prev.playerY;
      const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ];

      let targetX = -1;
      let targetY = -1;

      for (const d of dirs) {
        const nx = px + d.dx;
        const ny = py + d.dy;
        if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
          const t = prev.map[ny][nx];
          if (
            t === TileType.Floor ||
            t === TileType.Grass ||
            t === TileType.Path
          ) {
            const hasEnemy = prev.enemies.some(e => e.x === nx && e.y === ny);
            const hasNpc = prev.npcs.some(n => n.x === nx && n.y === ny);
            const hasChest = prev.chests.some(c => c.x === nx && c.y === ny);
            if (!hasEnemy && !hasNpc && !hasChest) {
              targetX = nx;
              targetY = ny;
              break;
            }
          }
        }
      }

      if (targetX === -1 || targetY === -1) {
        addLogMessage("⚠️ Could not find a suitable empty space next to you to build a campfire! Move to clear ground.", "system");
        return prev;
      }

      const nextMap = prev.map.map((row) => [...row]);
      nextMap[targetY][targetX] = TileType.Campfire;

      const nextMats = deductWoodCount(prev.inventoryMaterials, 3);

      playSound('spell');
      addLogMessage(`🔥 You successfully assembled a warm, crackling Campfire at [X:${targetX}, Y:${targetY}]. Stand adjacent to it to cook!`, 'craft');

      const cmdEv = new CustomEvent('spawn-game-effect', {
        detail: { x: targetX, y: targetY, text: `🔥 CAMPFIRE`, type: 'heal' },
      });
      window.dispatchEvent(cmdEv);

      return {
        ...prev,
        map: nextMap,
        inventoryMaterials: nextMats
      };
    });
  }, [setGameState, addLogMessage]);

  const handlePlaceAnvil = useCallback(() => {
    setGameState((prev) => {
      const totalMetalCount = getTotalMetalCount(prev.inventoryMaterials);
      const woodCount = getTotalWoodCount(prev.inventoryMaterials);

      if (totalMetalCount < 5 || woodCount < 2) {
        addLogMessage("❌ You need 5x Metal/Iron and 2x Wood to assemble a Portable Anvil!", "system");
        return prev;
      }

      const px = prev.playerX;
      const py = prev.playerY;
      const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ];

      let targetX = -1;
      let targetY = -1;

      for (const d of dirs) {
        const nx = px + d.dx;
        const ny = py + d.dy;
        if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
          const t = prev.map[ny][nx];
          if (
            t === TileType.Floor ||
            t === TileType.Grass ||
            t === TileType.Path
          ) {
            const hasEnemy = prev.enemies.some(e => e.x === nx && e.y === ny);
            const hasNpc = prev.npcs.some(n => n.x === nx && n.y === ny);
            const hasChest = prev.chests.some(c => c.x === nx && c.y === ny);
            if (!hasEnemy && !hasNpc && !hasChest) {
              targetX = nx;
              targetY = ny;
              break;
            }
          }
        }
      }

      if (targetX === -1 || targetY === -1) {
        addLogMessage("⚠️ Could not find a suitable empty space next to you to place an Anvil! Move to clear ground.", "system");
        return prev;
      }

      const nextMap = prev.map.map((row) => [...row]);
      nextMap[targetY][targetX] = TileType.Anvil;

      let nextMats = deductMetalCount(prev.inventoryMaterials, 5);
      nextMats = deductWoodCount(nextMats, 2);

      playSound('equip');
      addLogMessage(`⚒️ You successfully assembled a heavy Portable Blacksmith Anvil at [X:${targetX}, Y:${targetY}]. Stand adjacent to it to forge, mutate, and upgrade equipment!`, 'craft');

      const cmdEv = new CustomEvent('spawn-game-effect', {
        detail: { x: targetX, y: targetY, text: `⚒️ ANVIL`, type: 'crit' },
      });
      window.dispatchEvent(cmdEv);

      return {
        ...prev,
        map: nextMap,
        inventoryMaterials: nextMats
      };
    });
  }, [setGameState, addLogMessage]);

  const handlePlaceBedroll = useCallback(() => {
    setGameState((prev) => {
      const woodCount = getTotalWoodCount(prev.inventoryMaterials);

      if (woodCount < 2) {
        addLogMessage("❌ You need at least 2x Wood or Timber to unroll and pitch a Survival Bedroll!", "system");
        return prev;
      }

      const px = prev.playerX;
      const py = prev.playerY;
      const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ];

      let targetX = -1;
      let targetY = -1;

      for (const d of dirs) {
        const nx = px + d.dx;
        const ny = py + d.dy;
        if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
          const t = prev.map[ny][nx];
          if (
            t === TileType.Floor ||
            t === TileType.Grass ||
            t === TileType.Path
          ) {
            const hasEnemy = prev.enemies.some(e => e.x === nx && e.y === ny);
            const hasNpc = prev.npcs.some(n => n.x === nx && n.y === ny);
            const hasChest = prev.chests.some(c => c.x === nx && c.y === ny);
            if (!hasEnemy && !hasNpc && !hasChest) {
              targetX = nx;
              targetY = ny;
              break;
            }
          }
        }
      }

      if (targetX === -1 || targetY === -1) {
        addLogMessage("⚠️ Could not find an empty space adjacent to you to deploy a bedroll! Move to clear ground.", "system");
        return prev;
      }

      const nextMap = prev.map.map((row) => [...row]);
      nextMap[targetY][targetX] = TileType.Bedroll;

      const nextMats = deductWoodCount(prev.inventoryMaterials, 2);

      playSound('loot');
      addLogMessage(`🛏️ You unrolled and staked a Traveler's Survival Bedroll at [X:${targetX}, Y:${targetY}]. Stand adjacent to it and press [G] or interact to rest and sleep!`, 'craft');

      const cmdEv = new CustomEvent('spawn-game-effect', {
        detail: { x: targetX, y: targetY, text: `🛏️ BEDROLL`, type: 'heal' },
      });
      window.dispatchEvent(cmdEv);

      return {
        ...prev,
        map: nextMap,
        inventoryMaterials: nextMats
      };
    });
  }, [setGameState, addLogMessage]);

  const handlePlaceFieldTent = useCallback(() => {
    setGameState((prev) => {
      const woodCount = getTotalWoodCount(prev.inventoryMaterials);
      const metalCount = getTotalMetalCount(prev.inventoryMaterials);

      if (woodCount < 4 || metalCount < 1) {
        addLogMessage("❌ You need 4x Wood and 1x Metal/Iron to pitch an Expedition Field Tent!", "system");
        return prev;
      }

      const px = prev.playerX;
      const py = prev.playerY;
      const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ];

      let targetX = -1;
      let targetY = -1;

      for (const d of dirs) {
        const nx = px + d.dx;
        const ny = py + d.dy;
        if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
          const t = prev.map[ny][nx];
          if (
            t === TileType.Floor ||
            t === TileType.Grass ||
            t === TileType.Path
          ) {
            const hasEnemy = prev.enemies.some(e => e.x === nx && e.y === ny);
            const hasNpc = prev.npcs.some(n => n.x === nx && n.y === ny);
            const hasChest = prev.chests.some(c => c.x === nx && c.y === ny);
            if (!hasEnemy && !hasNpc && !hasChest) {
              targetX = nx;
              targetY = ny;
              break;
            }
          }
        }
      }

      if (targetX === -1 || targetY === -1) {
        addLogMessage("⚠️ Could not find an empty space adjacent to you to pitch a field tent! Move to clear ground.", "system");
        return prev;
      }

      const nextMap = prev.map.map((row) => [...row]);
      nextMap[targetY][targetX] = TileType.FieldTent;

      let nextMats = deductWoodCount(prev.inventoryMaterials, 4);
      nextMats = deductMetalCount(nextMats, 1);

      playSound('equip');
      addLogMessage(`⛺ You successfully pitched an insulated Expedition Field Tent at [X:${targetX}, Y:${targetY}]! Provides +25% rest recovery, 100% weather insulation, and cuts ambush risk by 50%!`, 'craft');

      const cmdEv = new CustomEvent('spawn-game-effect', {
        detail: { x: targetX, y: targetY, text: `⛺ EXPEDITION TENT`, type: 'heal' },
      });
      window.dispatchEvent(cmdEv);

      return {
        ...prev,
        map: nextMap,
        inventoryMaterials: nextMats
      };
    });
  }, [setGameState, addLogMessage]);

  const handleCookMeat = useCallback(() => {
    setGameState((prev) => {
      const rawCount = prev.inventoryMaterials['mat_raw_meat'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (rawCount <= 0) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You don't have any Raw Meat to cook!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const hasAdjacentCampfire = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ].some(d => {
        const nx = prev.playerX + d.dx;
        const ny = prev.playerY + d.dy;
        return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && prev.map[ny]?.[nx] === TileType.Campfire;
      });

      if (!hasAdjacentCampfire) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ Stand adjacent to a Campfire (🔥) to cook raw meat!",
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
        'mat_raw_meat': rawCount - 1,
        'mat_cooked_meat': (prev.inventoryMaterials['mat_cooked_meat'] || 0) + 1
      };

      playSound('loot');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🍖 You slow-cook a Raw Meat over the hot flames. It sizzles beautifully and becomes nutritional Cooked Meat!`,
        type: 'loot',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Cooked Meat`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  }, [setGameState]);

  const handleCookPrimeMeat = useCallback(() => {
    setGameState((prev) => {
      const rawCount = prev.inventoryMaterials['mat_prime_meat'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (rawCount <= 0) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You don't have any Prime Wild Meat to cook!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const hasAdjacentCampfire = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ].some(d => {
        const nx = prev.playerX + d.dx;
        const ny = prev.playerY + d.dy;
        return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && prev.map[ny]?.[nx] === TileType.Campfire;
      });

      if (!hasAdjacentCampfire) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ Stand adjacent to a Campfire (🔥) to cook raw prime meat!",
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
        'mat_prime_meat': rawCount - 1,
        'mat_cooked_prime_meat': (prev.inventoryMaterials['mat_cooked_prime_meat'] || 0) + 1
      };

      playSound('loot');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🥩 You slow-grill high-quality Prime Wild Meat. It sizzles with delicious juices and becomes a mouth-watering Flame-Grilled Steak!`,
        type: 'loot',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Grilled Steak`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  }, [setGameState]);

  const handleRestCampfire = useCallback(() => {
    setGameState((prev) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      const hasNearbyHostiles = prev.enemies.some(e => {
        if (e.hp <= 0 || e.isFollower) return false;
        if (e.isTownGuard && !e.isHostile) return false;
        const dist = Math.max(Math.abs(e.x - prev.playerX), Math.abs(e.y - prev.playerY));
        return dist <= 8;
      });

      if (hasNearbyHostiles) {
        playSound('bump');
        const combatMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "⚔️ Cannot rest at the campfire while hostile enemies are nearby!",
          type: "danger",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, combatMsg]
        };
      }

      const hasAdjacentCampfire = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ].some(d => {
        const nx = prev.playerX + d.dx;
        const ny = prev.playerY + d.dy;
        return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && prev.map[ny]?.[nx] === TileType.Campfire;
      });

      if (!hasAdjacentCampfire) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ Stand adjacent to a Campfire (🔥) to rest!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const stats = prev.playerStats;
      const nextStats = {
        ...stats,
        exhaustion: 0,
        hp: Math.min(stats.maxHp, stats.hp + Math.round(stats.maxHp * 0.15)),
        mp: Math.min(stats.maxMp, stats.mp + Math.round(stats.maxMp * 0.15))
      };

      playSound('levelUp');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🔥 You sit by the campfire warmth and rest. Your exhaustion is completely purged, and you feel refreshed! (+15% HP and MP)`,
        type: 'loot',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `Refreshed! 💤`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        playerStats: nextStats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  }, [setGameState]);

  const handleCookRecipe = useCallback((
    recipeId: string,
    restoringHp: number,
    restoringMp: number,
    buff: any,
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
        mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + restoringMp)
      };

      if (recipeId === 'shadow_smoked_jerky') {
        nextStats.exhaustion = 0;
      }

      const formattedTime = formatGameTime(prev.gameTime).timeStr;
      const nextLogs = [
        ...prev.logs,
        {
          id: `cook_${Date.now()}`,
          text: successLog,
          type: 'loot' as const,
          timestamp: formattedTime
        }
      ];

      playSound('spell');
      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `🍴 GOURMET MEAL!`, type: 'heal' },
      });
      setTimeout(() => window.dispatchEvent(ev), 10);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        playerStats: nextStats,
        activeFoodBuff: buff ? { ...buff, turnsRemaining: buff.turnsRemaining } : prev.activeFoodBuff,
        logs: nextLogs
      };
    });
  }, [setGameState]);


  const handleCookFish = useCallback(() => {
    setGameState((prev) => {
      const rawCount = prev.inventoryMaterials['mat_raw_fish'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (rawCount <= 0) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You don't have any Raw Fish to cook!",
          type: "system",
          timestamp: timeStr,
        };
        return {
          ...prev,
          logs: [...truncatedLogs, errorMsg]
        };
      }

      const hasAdjacentCampfire = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
      ].some(d => {
        const nx = prev.playerX + d.dx;
        const ny = prev.playerY + d.dy;
        return nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT && prev.map[ny]?.[nx] === TileType.Campfire;
      });

      if (!hasAdjacentCampfire) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ Stand adjacent to a Campfire (🔥) to grill raw fish!",
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
        'mat_raw_fish': rawCount - 1,
        'mat_cooked_fish': (prev.inventoryMaterials['mat_cooked_fish'] || 0) + 1
      };

      playSound('loot');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🍣 You slow-grill fresh raw fish over the hot campfire coals. It is beautifully toasted to a rich Grilled Fish!`,
        type: 'loot',
        timestamp: timeStr,
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `+1 Grilled Fish`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        logs: [...truncatedLogs, successMsg]
      };
    });
  }, [setGameState]);


  const handleCatchFish = useCallback((fishName: string, id: string) => {
    setGameState((prev) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      const nextMats = {
        ...prev.inventoryMaterials,
        [id]: (prev.inventoryMaterials[id] || 0) + 1
      };

      const prevDurability = prev.fishingPoleDurability !== undefined ? prev.fishingPoleDurability : 7;
      const nextDurability = prevDurability - 1;

      let logMsg: GameLogMessage;
      if (nextDurability <= 0) {
        nextMats['mat_fishing_pole'] = Math.max(0, (nextMats['mat_fishing_pole'] || 0) - 1);
        playSound('bump');
        logMsg = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `💥 OH NO! Your Ancient Fishing Pole snapped and broke under the heavy load of [${fishName}]! You need to craft or buy another one!`,
          type: 'danger',
          timestamp: timeStr,
        };
      } else {
        logMsg = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `🎣 You successfully captured a [${fishName}]! Raw fish added to your food storage. (Fishing Pole: ${nextDurability} / 7 Uses Left)`,
          type: 'loot',
          timestamp: timeStr,
        };
      }

      return {
        ...prev,
        inventoryMaterials: nextMats,
        fishingPoleDurability: nextDurability <= 0 ? 7 : nextDurability,
        logs: [...truncatedLogs, logMsg]
      };
    });
  }, [setGameState]);

  const handleFailFish = useCallback(() => {
    setGameState((prev) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      const prevDurability = prev.fishingPoleDurability !== undefined ? prev.fishingPoleDurability : 7;
      const nextDurability = prevDurability - 1;

      const nextMats = { ...prev.inventoryMaterials };
      let logMsg: GameLogMessage;

      if (nextDurability <= 0) {
        nextMats['mat_fishing_pole'] = Math.max(0, (nextMats['mat_fishing_pole'] || 0) - 1);
        playSound('bump');
        logMsg = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `💥 OH NO! Your Ancient Fishing Pole snapped and broke on the snagged rock! You need to craft or buy another one!`,
          type: 'danger',
          timestamp: timeStr,
        };
      } else {
        playSound('bump');
        logMsg = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `🌊 The fish pulled away and got free! (Fishing Pole: ${nextDurability} / 7 Uses Left)`,
          type: 'system',
          timestamp: timeStr,
        };
      }

      return {
        ...prev,
        inventoryMaterials: nextMats,
        fishingPoleDurability: nextDurability <= 0 ? 7 : nextDurability,
        logs: [...truncatedLogs, logMsg]
      };
    });
  }, [setGameState]);

  return {
    handlePlaceCampfire,
    handlePlaceAnvil,
    handlePlaceBedroll,
    handlePlaceFieldTent,
    handleCookMeat,
    handleCookPrimeMeat,
    handleRestCampfire,
    handleCookRecipe,
    handleCookFish,
    handleCatchFish,
    handleFailFish,
  };
}
