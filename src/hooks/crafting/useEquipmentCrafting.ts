import React, { useCallback } from "react";
import { GameState, GameLogMessage, WeaponBaseType, EquipmentItem, CraftedWeapon, isItemRepairable } from "../../types";
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS, WEAPON_TEMPLATES } from "../../utils/itemsData";
import { playSound } from "../../utils/audio";
import { addEquipmentItemToInventory } from "../../utils/scrollUtils";
import { resolveMutationSynergyChain } from "../../utils/mutationSynergy";
import { CraftingSubEngineProps } from "./types";

export function useEquipmentCrafting({
  setGameState,
  addLogMessage,
  setActiveTab,
  gameState,
}: CraftingSubEngineProps) {
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
      const baseTmpl = WEAPON_TEMPLATES[base] || WEAPON_TEMPLATES[WeaponBaseType.Sword] || Object.values(WEAPON_TEMPLATES)[0] || {
        baseDamage: 5,
        baseCrit: 0.1,
        range: 1,
        name: 'Sword',
        description: 'A standard blade'
      };
      customName = `${getCatalystPrefix(catalyst)} ${getMaterialAdj(material)} ${base || 'Sword'}`;
      scoreDamage = (baseTmpl.baseDamage ?? 5) + (material.baseDamageMod ?? 2);
      scoreCrit = Math.min(1.0, (baseTmpl.baseCrit ?? 0.1) + (material.critMod ?? 0.05));
      scoreRange = baseTmpl.range ?? 1;
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
      const nextMats = { ...(prev.inventoryMaterials || {}) };
      const nextCats = { ...(prev.inventoryCatalysts || {}) };

      // Deduct items used
      nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - 1);
      nextCats[catId] = Math.max(0, (nextCats[catId] || 0) - 1);

      return {
        ...prev,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        equipmentInventory: [...(prev.equipmentInventory || []), newItem],
      };
    });

    const craftLogPrefix = overforgeHeat >= 95 ? "⚡ GOD-FORGED MASTERPIECE" : overforgeHeat > 0 ? "⚡ OVER-FORGED CRAFT" : "🔨 BLACKSMITH ARCANUM";
    addLogMessage(`${craftLogPrefix}: Forged "${customName}"! Added directly to your inventory!`, 'craft');
    setActiveTab('dungeon');
  }, [setGameState, addLogMessage, setActiveTab, gameState.playerX, gameState.playerY]);


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
        currentWeapon: nextCurrentWeapon,
        equipmentInventory: nextEquipmentInventory,
        logs: [logMsg, ...prev.logs].slice(0, 200)
      };
    });
    setActiveTab("dungeon");
  }, [setGameState, setActiveTab, gameState.playerX, gameState.playerY]);

  
  const handleUpgradeItem = useCallback((targetId: string, materialId: string) => {
    playSound("forge");
    setGameState((prev) => {
      const matQty = prev.inventoryMaterials[materialId] || 0;
      if (matQty <= 0) return prev;

      const material = BASIC_MATERIALS.find(m => m.id === materialId) || ELEMENTAL_CATALYSTS.find(c => c.id === materialId);
      if (!material) return prev;

      const nextMats = { ...prev.inventoryMaterials };
      if (nextMats[materialId] > 1) {
        nextMats[materialId]--;
      } else {
        delete nextMats[materialId];
      }

      let nextCurrentWeapon = prev.currentWeapon;
      let nextEquipmentInventory = [...prev.equipmentInventory];
      let logMessageText = "";

      const isCurrentWeapon = prev.currentWeapon && prev.currentWeapon.id === targetId;

      const cur = isCurrentWeapon ? prev.currentWeapon! : null;
      const nextLevel = ((cur ? cur.upgradeLevel : 0) || (nextEquipmentInventory.find(i => i.id === targetId)?.upgradeLevel || 0)) + 1;

      const damageBonus = Math.max(1, Math.round(((material as any).value || (material as any).baseDamageMod || 5) * 0.4));
      const critBonus = 0.02;
      const defenseBonus = Math.max(1, Math.round(((material as any).value || (material as any).baseDamageMod || 5) * 0.3));

      const abilityName = `${material.name} Infusion`;
      const abilityDesc = `Grants +${damageBonus} Bonus Power via ${material.name}.`;

      const rawName = cur ? cur.name.replace(/\s*\+\d+$/, "") : (nextEquipmentInventory.find(i => i.id === targetId)?.name.replace(/\s*\+\d+$/, "") || "Item");
      const finalName = `${rawName} +${nextLevel}`;

      if (isCurrentWeapon && cur) {
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
        if (idx !== -1) {
          const item = nextEquipmentInventory[idx];
          if (item.type === "weapon") {
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
      }

      const logMsg: GameLogMessage = {
        id: `upgrade_success_${Date.now()}`,
        text: logMessageText,
        type: "craft",
        timestamp: "FORGE"
      };

      return {
        ...prev,
        inventoryMaterials: nextMats,
        currentWeapon: nextCurrentWeapon,
        equipmentInventory: nextEquipmentInventory,
        logs: [logMsg, ...prev.logs].slice(0, 200)
      };
    });
    setActiveTab("dungeon");
  }, [setGameState, setActiveTab, gameState.playerX, gameState.playerY]);

  return {
    handleCraftComplete,
    handleRepairItem,
    handleRepairAll,
    handleMutateItem,
    handleUpgradeItem,
  };
}
