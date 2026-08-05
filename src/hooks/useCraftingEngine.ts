import React, { useCallback } from 'react';
import { TileType, GameState, GameLogMessage, WeaponBaseType, EquipmentItem, CraftedWeapon, isItemRepairable } from '../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS, WEAPON_TEMPLATES } from '../utils/itemsData';
import { playSound } from '../utils/audio';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../utils/gameUtils';
import { formatGameTime } from '../utils/overworld';
import { addEquipmentItemToInventory } from '../utils/scrollUtils';
import { resolveMutationSynergyChain } from '../utils/mutationSynergy';

export interface UseCraftingEngineProps {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: GameLogMessage['type']) => void;
  setActiveTab: (tab: any) => void;
  gameState: GameState;
}

export function useCraftingEngine({
  setGameState,
  addLogMessage,
  setActiveTab,
  gameState,
}: UseCraftingEngineProps) {

  // Craft completion callback for weapons & armor
  const handleCraftComplete = useCallback((
    base: WeaponBaseType,
    matId: string,
    catId: string,
    category?: 'weapon' | 'armor',
    armorSubType?: string,
    overforgeHeat: number = 0
  ) => {
    playSound('forge');

    const material = BASIC_MATERIALS.find((m) => m.id === matId) || BASIC_MATERIALS[0];
    const catalyst = ELEMENTAL_CATALYSTS.find((c) => c.id === catId) || ELEMENTAL_CATALYSTS[0];

    // Over-Forging risk roll
    const heatRatio = Math.min(1.0, Math.max(0, overforgeHeat / 100));
    if (heatRatio > 0) {
      const shatterChance = heatRatio * 0.65; // Up to 65% shatter risk at 100% heat
      if (Math.random() < shatterChance) {
        playSound('bump');
        const backfireDmg = Math.floor(heatRatio * 15);

        setGameState((prev) => {
          const nextMats = { ...prev.inventoryMaterials };
          const nextCats = { ...prev.inventoryCatalysts };

          // Deduct materials
          nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - 1);
          nextCats[catId] = Math.max(0, (nextCats[catId] || 0) - 1);

          // Salvage: 1x Scrap Iron or Wood
          const salvageId = matId === 'mat_wood' ? 'mat_wood' : 'mat_iron';
          nextMats[salvageId] = (nextMats[salvageId] || 0) + 1;

          // Backfire damage
          const currentHp = prev.playerStats.hp;
          const newHp = Math.max(1, currentHp - backfireDmg);

          return {
            ...prev,
            inventoryMaterials: nextMats,
            inventoryCatalysts: nextCats,
            playerStats: {
              ...prev.playerStats,
              hp: newHp
            }
          };
        });

        const spawnX = gameState.playerX;
        const spawnY = gameState.playerY;
        const effectEv = new CustomEvent('spawn-game-effect', {
          detail: { x: spawnX, y: spawnY, text: `💥 OVER-FORGE SHATTER! (-${backfireDmg} HP)`, type: 'damage' },
        });
        window.dispatchEvent(effectEv);

        addLogMessage(`💥 OVER-FORGE SHATTER: The anvil detonated under ${overforgeHeat}% heat! The ${base} shattered into slag remnants. You took ${backfireDmg} heat blast recoil damage! (Salvaged 1x Scrap Material)`, 'danger');
        setActiveTab('dungeon');
        return;
      }
    }

    function getMaterialAdj(mat: typeof material) {
      if (mat.id === 'mat_iron') return 'Iron-Clasped';
      if (mat.id === 'mat_mithril') return 'Mithril-Core';
      if (mat.id === 'mat_obsidian') return 'Volcanic Obsidian';
      if (mat.id === 'mat_dragonscale') return 'Astral Wyrmscale';
      if (mat.id === 'mat_feybone') return 'Ancient Feybone';
      return mat.name.split(' ')[0];
    }

    function getCatalystPrefix(cat: typeof catalyst) {
      if (cat.type === 'Fire') return 'Pyrotactile';
      if (cat.type === 'Frost') return 'Cryo-forged';
      if (cat.type === 'Poison') return 'Venom-stung';
      if (cat.type === 'Lightning') return 'Super-charged';
      if (cat.type === 'Shadow') return 'Void-gazing';
      return cat.name;
    }

    let customName = '';
    let description = '';
    let scoreDamage = 0;
    let scoreDefense = 0;
    let scoreCrit = 0;
    let scoreRange = 1;
    let maxDur = 100;

    const isWeapon = !category || category === 'weapon';

    if (isWeapon) {
      const baseTmpl = WEAPON_TEMPLATES[base];
      customName = `${getCatalystPrefix(catalyst)} ${getMaterialAdj(material)} ${base}`;
      scoreDamage = baseTmpl.baseDamage + material.baseDamageMod;
      scoreCrit = Math.min(1.0, baseTmpl.baseCrit + material.critMod);
      scoreRange = baseTmpl.range;
      description = `Fused alloy combining physical properties of ${material.name} and elemental kinetic discharge of ${catalyst.name}. Range: ${scoreRange}.`;
      maxDur = 150;
    } else {
      // It is an armor piece
      const baseArmorNames: { [key: string]: { name: string, baseDef: number, maxDur: number } } = {
        'Shield': { name: 'Greatshield', baseDef: 3, maxDur: 150 },
        'HeavyArmor': { name: 'Plate Mail', baseDef: 5, maxDur: 120 },
        'Helmet': { name: 'Visor Helm', baseDef: 2, maxDur: 100 },
        'Gloves': { name: 'Gauntlets', baseDef: 1, maxDur: 100 },
        'Amulet': { name: 'Neck Piece', baseDef: 1, maxDur: 100 },
        'Boots': { name: 'Sabatons', baseDef: 1, maxDur: 100 },
      };

      const armorDetail = baseArmorNames[armorSubType || 'Shield'] || { name: 'Shield', baseDef: 2, maxDur: 100 };
      customName = `${getCatalystPrefix(catalyst)} ${getMaterialAdj(material)} ${armorDetail.name}`;
      
      let defenseBonus = 1;
      if (material.id === 'mat_iron') defenseBonus = 1;
      else if (material.id === 'mat_mithril' || material.id === 'mat_obsidian') defenseBonus = 2;
      else defenseBonus = 3;

      scoreDefense = armorDetail.baseDef + defenseBonus;
      description = `Impenetrable alloy of infused ${material.name} containing protective ${catalyst.type} sparks. Block rate enhanced.`;
      maxDur = armorDetail.maxDur;
    }

    const traits: string[] = [];
    if (!isWeapon) {
      if (armorSubType === 'Boots') {
        if (catalyst.id === 'cat_frost') {
          traits.push('NON_SLIPPERY');
          description += ' [Enchanted: Non-Slippery Ice Tread. Immune to slipping and blizzard freezing fatigue!]';
        } else if (catalyst.id === 'cat_fire' || catalyst.id === 'cat_lightning') {
          traits.push('STALLION_SPEED');
          description += ' [Enchanted: Stallion Speed. Overworld travel speed increased (3m/turn travel time cost).]';
        } else if (catalyst.id === 'cat_poison') {
          traits.push('SWAMP_GLIDE');
          description += ' [Enchanted: Swamp-Glide. Move through swamp paths at extreme speed (2m/turn) and walk safely on water!]';
        }
      } else if (armorSubType === 'Helmet' || armorSubType === 'HeavyArmor') {
        if (catalyst.id === 'cat_lightning' || catalyst.id === 'cat_plain') {
          traits.push('DESERT_IMMUNITY');
          description += ' [Enchanted: Dune Desert Immunity. Complete immunity to sandstorms, sand-blindness, and heat fatigue!]';
        }
      } else if (armorSubType === 'Gloves' || armorSubType === 'Shield' || armorSubType === 'Amulet') {
        if (catalyst.id === 'cat_shadow' || catalyst.id === 'cat_fire') {
          traits.push('WORG_FORCE');
          description += ' [Enchanted: Worg Force. Adds +3 damage to physical attacks and pacifies wild Wolves!]';
        }
      }
    } else {
      if (catalyst.id === 'cat_shadow' || material.id === 'mat_obsidian') {
        traits.push('WORG_FORCE');
        description += ' [Enchanted: Worg Force. Adds +3 damage to physical attacks and pacifies wild Wolves!]';
      }
    }

    if (overforgeHeat > 0) {
      const heatRatio = overforgeHeat / 100;
      const statMult = 1.0 + (heatRatio * 1.25); // Up to 2.25x power!
      const bonusCrit = heatRatio * 0.25;

      let heatPrefix = 'Over-Heated';
      if (overforgeHeat >= 95) heatPrefix = '⚡ GOD-FORGED';
      else if (overforgeHeat >= 75) heatPrefix = 'Infernal';
      else if (overforgeHeat >= 50) heatPrefix = 'Incandescent';

      customName = `${heatPrefix} ${customName}`;
      scoreDamage = Math.round(scoreDamage * statMult);
      scoreDefense = Math.round(scoreDefense * statMult);
      scoreCrit = Math.min(0.95, parseFloat((scoreCrit + bonusCrit).toFixed(2)));
      description += ` [⚡ OVER-FORGED HEAT: ${overforgeHeat}% (+${Math.round((statMult - 1) * 100)}% Power Boost)]`;
    }

    const newItem: EquipmentItem = {
      id: `crafted_${Date.now()}`,
      name: customName,
      type: isWeapon ? 'weapon' : 'armor',
      subType: (isWeapon ? base : (armorSubType || 'Shield')) as any,
      defense: scoreDefense,
      damage: scoreDamage,
      critChance: scoreCrit,
      range: scoreRange,
      color: catalyst.color,
      description: description,
      value: isWeapon ? 30 : 25,
      durability: maxDur,
      maxDurability: maxDur,
      traits: traits,
      isOverforged: overforgeHeat > 0,
      overforgeHeat: overforgeHeat > 0 ? overforgeHeat : undefined
    };

    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };
      const nextCats = { ...prev.inventoryCatalysts };

      // Deduct items used
      nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - 1);
      nextCats[catId] = Math.max(0, (nextCats[catId] || 0) - 1);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        equipmentInventory: [...prev.equipmentInventory, newItem],
      };
    });

    const craftLogPrefix = overforgeHeat >= 95 ? "⚡ GOD-FORGED MASTERPIECE" : overforgeHeat > 0 ? "⚡ OVER-FORGED CRAFT" : "🔨 BLACKSMITH ARCANUM";
    addLogMessage(`${craftLogPrefix}: Forged "${customName}"! Added directly to your inventory!`, 'craft');
    setActiveTab('dungeon');
  }, [setGameState, addLogMessage, setActiveTab, gameState.playerX, gameState.playerY]);

  const handlePlaceCampfire = useCallback(() => {
    setGameState((prev) => {
      const woodCount = prev.inventoryMaterials['mat_wood'] || 0;
      if (woodCount < 3) {
        addLogMessage("❌ You do not have enough Scrap Wood (3 required) to place a campfire!", "system");
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

      const nextMats = {
        ...prev.inventoryMaterials,
        'mat_wood': woodCount - 3
      };

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
      const metalKeys = ['mat_iron', 'mat_iron_ore', 'mat_steel', 'mat_royal_iron', 'mat_copper_ore', 'mat_mithril', 'mat_obsidian'];
      let totalMetalCount = 0;
      for (const key of metalKeys) {
        totalMetalCount += prev.inventoryMaterials[key] || 0;
      }
      const woodCount = prev.inventoryMaterials['mat_wood'] || 0;

      if (totalMetalCount < 5 || woodCount < 2) {
        addLogMessage("❌ You need 5x Iron/Metal (any Iron Ore, Tempered Iron, Steel, Mithril, or Obsidian) and 2x Scrap Wood to assemble a Portable Anvil!", "system");
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

      const nextMats = { ...prev.inventoryMaterials };
      nextMats['mat_wood'] = Math.max(0, woodCount - 2);

      let remainingDeduct = 5;
      for (const key of metalKeys) {
        const cur = nextMats[key] || 0;
        if (cur > 0) {
          const take = Math.min(cur, remainingDeduct);
          nextMats[key] = cur - take;
          remainingDeduct -= take;
          if (remainingDeduct <= 0) break;
        }
      }

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

  const handleCraftFishingPole = useCallback(() => {
    setGameState((prev) => {
      const woodCount = prev.inventoryMaterials['mat_wood'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (woodCount < 3) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need at least 3 Scrap Wood logs to assemble a Fishing Pole!",
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
        'mat_wood': woodCount - 3,
        'mat_fishing_pole': (prev.inventoryMaterials['mat_fishing_pole'] || 0) + 1
      };

      playSound('craft');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🎣 You successfully shape 3x Scrap Wood into an Ancient Fishing Pole! Feel free to angle next to lakes or rivers!`,
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
      const ironCount = prev.inventoryMaterials['mat_iron'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (ironCount < 1) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need at least 1 Tempered Iron to fashion Tension Lockpicks!",
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
        'mat_iron': ironCount - 1,
        'mat_lockpick': (prev.inventoryMaterials['mat_lockpick'] || 0) + 3
      };

      playSound('craft');
      
      const successMsg: GameLogMessage = {
        id: `log_${Date.now()}_${Math.random()}`,
        text: `🔑 You successfully forge 1x Tempered Iron into 3x Tension Lockpicks! Ready to crack open dungeon caches.`,
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
      const woodCount = prev.inventoryMaterials['mat_wood'] || 0;
      const ironCount = prev.inventoryMaterials['mat_iron'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (woodCount < 2 || ironCount < 1) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need 2x Scrap Wood and 1x Tempered Iron to forge a Lumberjack Hatchet!",
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
        'mat_wood': woodCount - 2,
        'mat_iron': ironCount - 1,
      };

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
      const woodCount = prev.inventoryMaterials['mat_wood'] || 0;
      const ironCount = prev.inventoryMaterials['mat_iron'] || 0;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const truncatedLogs = prev.logs.length > 40 ? prev.logs.slice(1) : prev.logs;

      if (woodCount < 2 || ironCount < 2) {
        const errorMsg: GameLogMessage = {
          id: `log_${Date.now()}_${Math.random()}`,
          text: "❌ You need 2x Scrap Wood and 2x Tempered Iron to forge a Prospector Pickaxe!",
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
        'mat_wood': woodCount - 2,
        'mat_iron': ironCount - 2,
      };

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

  const handleRepairItem = useCallback((slotOrId: string, item: any, isEquipped: boolean) => {
    if (!isItemRepairable(item)) {
      playSound('bump');
      addLogMessage(`❌ "${item.name}" is a resource harvesting tool and cannot be repaired! Craft a new one when it breaks.`, 'system');
      return;
    }

    const cost = Math.max(1, Math.floor(((item.maxDurability ?? 100) - (item.durability ?? 100)) * 0.5));
    if (gameState.playerStats.gold < cost) {
      playSound('bump');
      addLogMessage(`❌ Insufficient Gold! Repairing "${item.name}" costs ${cost} Gold.`, 'system');
      return;
    }

    playSound('loot');
    setGameState((prev) => {
      const nextGold = prev.playerStats.gold - cost;
      const updatedStats = { ...prev.playerStats, gold: nextGold };

      if (isEquipped) {
        if (slotOrId === 'currentWeapon') {
          const repaired = prev.currentWeapon ? { ...prev.currentWeapon, durability: prev.currentWeapon.maxDurability ?? 100 } : null;
          return { ...prev, currentWeapon: repaired, playerStats: updatedStats };
        } else {
          const slotKey = slotOrId as 'equippedArmor' | 'equippedHelmet' | 'equippedGloves' | 'equippedBoots' | 'equippedShield' | 'equippedAmulet';
          const repaired = prev[slotKey] ? { ...prev[slotKey], durability: prev[slotKey]!.maxDurability ?? 100 } : null;
          return { ...prev, [slotKey]: repaired, playerStats: updatedStats };
        }
      } else {
        const nextInv = prev.equipmentInventory.map((it) => {
          if (it.id === slotOrId) {
            return { ...it, durability: it.maxDurability ?? 100 };
          }
          return it;
        });
        return { ...prev, equipmentInventory: nextInv, playerStats: updatedStats };
      }
    });

    addLogMessage(`🔨 Blacksmith restored "${item.name}" durability! (-${cost} Gold)`, 'craft');
  }, [gameState.playerStats.gold, setGameState, addLogMessage]);

  const handleRepairAll = useCallback(() => {
    let totalCost = 0;
    const itemsToRepair: { slotOrId: string; item: any; isEquipped: boolean }[] = [];

    const checkItem = (slotOrId: string, item: any, isEquipped: boolean) => {
      if (item && isItemRepairable(item) && item.durability !== undefined && item.maxDurability !== undefined && item.durability < item.maxDurability) {
        const cost = Math.max(1, Math.floor((item.maxDurability - item.durability) * 0.5));
        totalCost += cost;
        itemsToRepair.push({ slotOrId, item, isEquipped });
      }
    };

    checkItem('currentWeapon', gameState.currentWeapon, true);
    checkItem('equippedArmor', gameState.equippedArmor, true);
    checkItem('equippedHelmet', gameState.equippedHelmet, true);
    checkItem('equippedGloves', gameState.equippedGloves, true);
    checkItem('equippedBoots', gameState.equippedBoots, true);
    checkItem('equippedShield', gameState.equippedShield, true);
    checkItem('equippedAmulet', gameState.equippedAmulet, true);

    gameState.equipmentInventory.forEach((it) => {
      checkItem(it.id, it, false);
    });

    if (itemsToRepair.length === 0) {
      addLogMessage(`🛠️ All of your equipment is in pristine 100% condition!`, 'system');
      return;
    }

    if (gameState.playerStats.gold < totalCost) {
      playSound('bump');
      addLogMessage(`❌ Repairing all items costs ${totalCost} Gold. You only have ${gameState.playerStats.gold} Gold!`, 'system');
      return;
    }

    playSound('loot');
    setGameState((prev) => {
      const nextGold = prev.playerStats.gold - totalCost;
      let nextWeapon = prev.currentWeapon;
      let nextArmor = prev.equippedArmor;
      let nextHelmet = prev.equippedHelmet;
      let nextGloves = prev.equippedGloves;
      let nextBoots = prev.equippedBoots;
      let nextShield = prev.equippedShield;
      let nextAmulet = prev.equippedAmulet;

      if (nextWeapon && nextWeapon.durability !== undefined && nextWeapon.maxDurability !== undefined) {
        nextWeapon = { ...nextWeapon, durability: nextWeapon.maxDurability };
      }
      if (nextArmor && nextArmor.durability !== undefined && nextArmor.maxDurability !== undefined) {
        nextArmor = { ...nextArmor, durability: nextArmor.maxDurability };
      }
      if (nextHelmet && nextHelmet.durability !== undefined && nextHelmet.maxDurability !== undefined) {
        nextHelmet = { ...nextHelmet, durability: nextHelmet.maxDurability };
      }
      if (nextGloves && nextGloves.durability !== undefined && nextGloves.maxDurability !== undefined) {
        nextGloves = { ...nextGloves, durability: nextGloves.maxDurability };
      }
      if (nextBoots && nextBoots.durability !== undefined && nextBoots.maxDurability !== undefined) {
        nextBoots = { ...nextBoots, durability: nextBoots.maxDurability };
      }
      if (nextShield && nextShield.durability !== undefined && nextShield.maxDurability !== undefined) {
        nextShield = { ...nextShield, durability: nextShield.maxDurability };
      }
      if (nextAmulet && nextAmulet.durability !== undefined && nextAmulet.maxDurability !== undefined) {
        nextAmulet = { ...nextAmulet, durability: nextAmulet.maxDurability };
      }

      const nextInv = prev.equipmentInventory.map((it) => {
        if (it.durability !== undefined && it.maxDurability !== undefined && it.durability < it.maxDurability) {
          return { ...it, durability: it.maxDurability };
        }
        return it;
      });

      return {
        ...prev,
        currentWeapon: nextWeapon,
        equippedArmor: nextArmor,
        equippedHelmet: nextHelmet,
        equippedGloves: nextGloves,
        equippedBoots: nextBoots,
        equippedShield: nextShield,
        equippedAmulet: nextAmulet,
        equipmentInventory: nextInv,
        playerStats: {
          ...prev.playerStats,
          gold: nextGold
        }
      };
    });

    addLogMessage(`🔨 Blacksmith sharpened and repaired ALL of your gear! (-${totalCost} Gold)`, 'craft');
  }, [gameState, setGameState, addLogMessage]);

  const handleMutateItem = useCallback((
    targetId: string,
    matId: string,
    catId: string,
    overforgeHeat: number = 0
  ) => {
    playSound('mutate');

    const material = BASIC_MATERIALS.find((m) => m.id === matId) || BASIC_MATERIALS[0];
    const catalyst = ELEMENTAL_CATALYSTS.find((c) => c.id === catId) || ELEMENTAL_CATALYSTS[0];

    const heatRatio = Math.min(1.0, Math.max(0, overforgeHeat / 100));
    if (heatRatio > 0 && Math.random() < heatRatio * 0.60) {
      playSound('bump');
      const backfireDmg = Math.floor(heatRatio * 15);

      setGameState((prev) => {
        const nextMats = { ...prev.inventoryMaterials };
        const nextCats = { ...prev.inventoryCatalysts };

        nextMats[matId] = Math.max(0, (nextMats[matId] ?? 0) - 1);
        nextCats[catId] = Math.max(0, (nextCats[catId] ?? 0) - 1);

        const currentHp = prev.playerStats.hp;
        const newHp = Math.max(1, currentHp - backfireDmg);

        return {
          ...prev,
          inventoryMaterials: nextMats,
          inventoryCatalysts: nextCats,
          playerStats: {
            ...prev.playerStats,
            hp: newHp
          }
        };
      });

      const spawnX = gameState.playerX;
      const spawnY = gameState.playerY;
      const effectEv = new CustomEvent('spawn-game-effect', {
        detail: { x: spawnX, y: spawnY, text: `💥 CHAOS MELTDOWN! (-${backfireDmg} HP)`, type: 'damage' },
      });
      window.dispatchEvent(effectEv);

      addLogMessage(`💥 CHAOS MELTDOWN: Supercritical mutation collapsed under ${overforgeHeat}% heat! The forge detonated, dealing ${backfireDmg} fire damage!`, 'danger');
      setActiveTab('dungeon');
      return;
    }

    function getMutPrefix(catType: string) {
      if (overforgeHeat >= 95) return '⚡ GOD-MUTATED';
      if (overforgeHeat >= 50) return 'Over-Charged';
      if (catType === 'Fire') return 'Pyromagnetic';
      if (catType === 'Frost') return 'Cryo-warped';
      if (catType === 'Poison') return 'Venom-veined';
      if (catType === 'Lightning') return 'Flux-pulsing';
      if (catType === 'Shadow') return 'Void-stitched';
      return 'Chaos-touched';
    }

    function getMutSuffix(matName: string) {
      const core = matName.split(' ')[0];
      return `of ${core} Chaos`;
    }

    const spawnX = gameState.playerX;
    const spawnY = gameState.playerY;
    const effectEv = new CustomEvent('spawn-game-effect', {
      detail: { x: spawnX, y: spawnY, text: "🌀 Mutated!", type: 'heal' },
    });
    window.dispatchEvent(effectEv);

    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };
      const nextCats = { ...prev.inventoryCatalysts };

      nextMats[matId] = Math.max(0, (nextMats[matId] ?? 0) - 1);
      nextCats[catId] = Math.max(0, (nextCats[catId] ?? 0) - 1);

      let logMessageText = "";
      let nextCurrentWeapon = prev.currentWeapon;
      let nextEquipmentInventory = [...prev.equipmentInventory];

      const heatMult = 1.0 + (overforgeHeat / 100) * 0.8;
      const chaosMultiplier = parseFloat(((0.85 + Math.random() * 0.70) * heatMult).toFixed(2));
      const prefix = getMutPrefix(catalyst.type);

      if (targetId === 'current_weapon') {
        if (!prev.currentWeapon) {
          return prev;
        }
        const cur = prev.currentWeapon;
        const existingCats = cur.synergyCatalysts || (cur.color ? [catalyst.type] : []);
        const synRes = resolveMutationSynergyChain(existingCats, catalyst.type, cur.mutationCount || 0, overforgeHeat);
        const finalMult = parseFloat((chaosMultiplier * synRes.powerMultiplier).toFixed(2));

        const nextDamage = Math.max(5, Math.round(cur.damage * finalMult));
        const nextCrit = Math.max(0.05, Math.min(0.95, parseFloat((cur.critChance * (0.85 + Math.random() * 0.4)).toFixed(2))));
        const mutatedName = synRes.isOmegaResonance 
          ? `🌌 ${synRes.primaryTitle} ${cur.name}` 
          : `${prefix} ${cur.name} (${synRes.primaryTitle})`;
        
        nextCurrentWeapon = {
          ...cur,
          name: mutatedName,
          damage: nextDamage,
          critChance: nextCrit,
          color: catalyst.color,
          isMutated: true,
          mutationCount: synRes.chainLevel,
          synergyCatalysts: synRes.catalysts,
          synergyTitle: synRes.primaryTitle,
          mutationStrain: synRes.unstableStrain,
          traits: Array.from(new Set([...(cur.traits || []), ...synRes.traits])),
          effectDescription: `[Chain Lv ${synRes.chainLevel}] ${synRes.description} (Power Mult: ${finalMult}x). Fueled with core kinetic residue of ${material.name}.`
        };

        logMessageText = `🌀 MUTATION FORGE: Active weapon "${cur.name}" mutated (Chain Lv ${synRes.chainLevel})! Forged: "${mutatedName}" (Dmg: ${cur.damage} ➔ ${nextDamage}, Power: ${finalMult}x, Strain: ${synRes.unstableStrain}%)!`;
      } else {
        const itemIdx = nextEquipmentInventory.findIndex(item => item.id === targetId);
        if (itemIdx === -1) {
          return prev;
        }
        const item = nextEquipmentInventory[itemIdx];
        const existingCats = item.synergyCatalysts || (item.color ? [catalyst.type] : []);
        const synRes = resolveMutationSynergyChain(existingCats, catalyst.type, item.mutationCount || 0, overforgeHeat);
        const finalMult = parseFloat((chaosMultiplier * synRes.powerMultiplier).toFixed(2));

        const mutatedName = synRes.isOmegaResonance 
          ? `🌌 ${synRes.primaryTitle} ${item.name}` 
          : `${prefix} ${item.name} (${synRes.primaryTitle})`;

        if (item.type === 'weapon') {
          const nextDamage = Math.max(5, Math.round(item.damage * finalMult));
          const nextCrit = Math.max(0.05, Math.min(0.95, parseFloat((item.critChance * (0.85 + Math.random() * 0.4)).toFixed(2))));
          
          nextEquipmentInventory[itemIdx] = {
            ...item,
            name: mutatedName,
            damage: nextDamage,
            critChance: nextCrit,
            color: catalyst.color,
            isMutated: true,
            mutationCount: synRes.chainLevel,
            synergyCatalysts: synRes.catalysts,
            synergyTitle: synRes.primaryTitle,
            mutationStrain: synRes.unstableStrain,
            traits: Array.from(new Set([...(item.traits || []), ...synRes.traits])),
            description: `[Chain Lv ${synRes.chainLevel}] ${synRes.description} Power Multiplier: ${finalMult}x.`
          };

          logMessageText = `🌀 MUTATION FORGE: Bag weapon "${item.name}" mutated (Chain Lv ${synRes.chainLevel})! Forged: "${mutatedName}" (Dmg: ${item.damage} ➔ ${nextDamage}, Power: ${finalMult}x)!`;
        } else {
          const nextDefense = Math.max(1, Math.round(item.defense * finalMult));
          
          nextEquipmentInventory[itemIdx] = {
            ...item,
            name: mutatedName,
            defense: nextDefense,
            color: catalyst.color,
            isMutated: true,
            mutationCount: synRes.chainLevel,
            synergyCatalysts: synRes.catalysts,
            synergyTitle: synRes.primaryTitle,
            mutationStrain: synRes.unstableStrain,
            traits: Array.from(new Set([...(item.traits || []), ...synRes.traits])),
            description: `[Chain Lv ${synRes.chainLevel}] ${synRes.description} Power Multiplier: ${finalMult}x.`
          };

          logMessageText = `🌀 MUTATION FORGE: Defensive gear "${item.name}" mutated (Chain Lv ${synRes.chainLevel})! Realignment: "${mutatedName}" (Def: ${item.defense} ➔ ${nextDefense})!`;
        }
      }

      const logMsg: GameLogMessage = {
        id: `mutation_forge_${Date.now()}`,
        text: logMessageText,
        type: 'craft',
        timestamp: 'FORGE'
      };

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        currentWeapon: nextCurrentWeapon,
        equipmentInventory: nextEquipmentInventory,
        logs: [logMsg, ...prev.logs].slice(0, 200)
      };
    });

    setActiveTab('dungeon');
  }, [setGameState, addLogMessage, setActiveTab, gameState.playerX, gameState.playerY]);

  const handleUpgradeItem = useCallback((
    targetId: string,
    materialId: string,
    overforgeHeat: number = 0
  ) => {
    playSound('mutate');

    const material = BASIC_MATERIALS.find((m) => m.id === materialId) || BASIC_MATERIALS[0];

    const spawnX = gameState.playerX;
    const spawnY = gameState.playerY;
    const effectEv = new CustomEvent('spawn-game-effect', {
      detail: { x: spawnX, y: spawnY, text: overforgeHeat >= 95 ? "⚡ GOD-UPGRADED!" : "✨ Upgraded!", type: 'heal' },
    });
    window.dispatchEvent(effectEv);

    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };

      nextMats[materialId] = Math.max(0, (nextMats[materialId] ?? 0) - 1);

      let logMessageText = "";
      let nextCurrentWeapon = prev.currentWeapon;
      let nextEquipmentInventory = [...prev.equipmentInventory];

      let currentLevel = 0;
      let itemName = "";
      let itemType: 'weapon' | 'armor' = 'weapon';

      if (targetId === 'current_weapon') {
        if (!prev.currentWeapon) return prev;
        currentLevel = prev.currentWeapon.upgradeLevel ?? 0;
        itemName = prev.currentWeapon.name;
        itemType = 'weapon';
      } else {
        const idx = nextEquipmentInventory.findIndex(item => item.id === targetId);
        if (idx === -1) return prev;
        currentLevel = nextEquipmentInventory[idx].upgradeLevel ?? 0;
        itemName = nextEquipmentInventory[idx].name;
        itemType = nextEquipmentInventory[idx].type === 'weapon' ? 'weapon' : 'armor';
      }

      const nextLevel = currentLevel + 1;
      const heatRatio = Math.min(1.0, Math.max(0, overforgeHeat / 100));
      const baseChance = Math.max(0.4, 1.0 - (currentLevel * 0.15));
      const successChance = Math.max(0.15, baseChance - (heatRatio * 0.45));
      const rolled = Math.random() < successChance;

      if (!rolled) {
        const backfireDmg = Math.floor(heatRatio * 12);
        const currentHp = prev.playerStats.hp;
        const newHp = backfireDmg > 0 ? Math.max(1, currentHp - backfireDmg) : currentHp;

        const logMsgFailure: GameLogMessage = {
          id: `upgrade_fail_${Date.now()}`,
          text: `🔨 OVER-FORGE UPGRADE FAILURE: Attempt on "${itemName}" to +${nextLevel} under ${overforgeHeat}% heat failed! Materials consumed.${backfireDmg > 0 ? ` Anvil backfire dealt ${backfireDmg} heat damage!` : ''}`,
          type: 'danger',
          timestamp: 'FORGE'
        };
        return {
          ...prev,
          inventoryMaterials: nextMats,
          playerStats: backfireDmg > 0 ? { ...prev.playerStats, hp: newHp } : prev.playerStats,
          logs: [logMsgFailure, ...prev.logs].slice(0, 200)
        };
      }

      let damageBonus = 0;
      let defenseBonus = 0;
      let critBonus = 0;
      let abilityName = "";
      let abilityDesc = "";

      const heatBonusMult = 1.0 + (overforgeHeat / 100) * 1.0;

      if (materialId === 'mat_iron') {
        damageBonus = Math.round((itemType === 'weapon' ? 2 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 1 : 0) * heatBonusMult);
        abilityName = "Tempered Guard";
        abilityDesc = "Solid reliability. +5% block chance.";
      } else if (materialId === 'mat_mithril') {
        damageBonus = Math.round((itemType === 'weapon' ? 3 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 1 : 0) * heatBonusMult);
        critBonus = 0.04 * heatBonusMult;
        abilityName = "Swift Strike / Nimble Step";
        abilityDesc = "Featherlight design. Increases critical hit rate and speed.";
      } else if (materialId === 'mat_obsidian') {
        damageBonus = Math.round((itemType === 'weapon' ? 5 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 2 : 0) * heatBonusMult);
        abilityName = "Retribution Spikes";
        abilityDesc = "Glassy razor-sharp finish. Reflects 3 physical damage back to attackers.";
      } else if (materialId === 'mat_dragonscale') {
        damageBonus = Math.round((itemType === 'weapon' ? 6 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 2 : 0) * heatBonusMult);
        critBonus = 0.02 * heatBonusMult;
        abilityName = "Primal Fireburst";
        abilityDesc = "Erupts with dragon fire. Crits ignite targets for 3 turns.";
      } else if (materialId === 'mat_feybone') {
        damageBonus = Math.round((itemType === 'weapon' ? 4 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 1 : 0) * heatBonusMult);
        abilityName = "Vampiric Siphon";
        abilityDesc = "Vitality siphon. Reclaims 2 HP upon striking enemies.";
      } else {
        damageBonus = Math.round((itemType === 'weapon' ? 1 : 0) * heatBonusMult);
        defenseBonus = Math.round((itemType === 'armor' ? 1 : 0) * heatBonusMult);
        abilityName = "Reinforced";
        abilityDesc = "Treated log reinforcement. Standard physical defense.";
      }

      let cleanBaseName = itemName.replace(/\s\+\d+$/, "");
      const finalName = `${cleanBaseName} +${nextLevel}`;

      if (targetId === 'current_weapon') {
        const cur = prev.currentWeapon!;
        nextCurrentWeapon = {
          ...cur,
          name: finalName,
          damage: cur.damage + damageBonus,
          critChance: Math.min(0.95, cur.critChance + critBonus),
          upgradeLevel: nextLevel,
          color: material.color,
          effectDescription: `${cur.effectDescription || "Custom Gear."}\n[UPGRADE +${nextLevel}] Passive: ${abilityName} - ${abilityDesc}`
        };

        logMessageText = `🔨 FORGE SUCCESS: Upgraded "${cur.name}" to "${finalName}" using ${material.name}! (+${damageBonus} Damage, +${(critBonus * 100).toFixed(0)}% Crit, Passive: ${abilityName})`;
      } else {
        const idx = nextEquipmentInventory.findIndex(item => item.id === targetId);
        const item = nextEquipmentInventory[idx];

        if (item.type === 'weapon') {
          nextEquipmentInventory[idx] = {
            ...item,
            name: finalName,
            damage: item.damage + damageBonus,
            critChance: Math.min(0.95, item.critChance + critBonus),
            upgradeLevel: nextLevel,
            color: material.color,
            description: `${item.description || "Custom Weapon."} [UPGRADE +${nextLevel}] Passive: ${abilityName} - ${abilityDesc}`
          };
          logMessageText = `🔨 FORGE SUCCESS: Upgraded bag weapon "${item.name}" to "${finalName}" using ${material.name}! (+${damageBonus} Damage, Passive: ${abilityName})`;
        } else {
          nextEquipmentInventory[idx] = {
            ...item,
            name: finalName,
            defense: item.defense + defenseBonus,
            upgradeLevel: nextLevel,
            color: material.color,
            description: `${item.description || "Custom Armor."} [UPGRADE +${nextLevel}] Passive: ${abilityName} - ${abilityDesc}`
          };
          logMessageText = `🔨 FORGE SUCCESS: Upgraded defensive gear "${item.name}" to "${finalName}" using ${material.name}! (+${defenseBonus} Defense, Passive: ${abilityName})`;
        }
      }

      const logMsg: GameLogMessage = {
        id: `upgrade_success_${Date.now()}`,
        text: logMessageText,
        type: 'craft',
        timestamp: 'FORGE'
      };

      return {
        ...prev,
        inventoryMaterials: nextMats,
        currentWeapon: nextCurrentWeapon,
        equipmentInventory: nextEquipmentInventory,
        logs: [logMsg, ...prev.logs].slice(0, 200)
      };
    });

    setActiveTab('dungeon');
  }, [setGameState, setActiveTab, gameState.playerX, gameState.playerY]);

  return {
    handleCraftComplete,
    handlePlaceCampfire,
    handlePlaceAnvil,
    handleCookMeat,
    handleCookPrimeMeat,
    handleRestCampfire,
    handleCookRecipe,
    handleBrewPotion,
    handleCookFish,
    handleCraftFishingPole,
    handleCraftLockpicks,
    handleCraftHatchet,
    handleCraftPickaxe,
    handleCraftRecallScroll,
    handleCatchFish,
    handleFailFish,
    handleRepairItem,
    handleRepairAll,
    handleMutateItem,
    handleUpgradeItem,
  };
}
