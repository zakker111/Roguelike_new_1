import React from 'react';
import { GameState, EquipmentItem, DungeonLevelState, isTwoHandedWeapon } from '../types';
import { playSound } from '../utils/audio';
import { SPELL_SCROLLS } from '../utils/spellScrolls';
import { consumeItemFromInventory } from '../utils/scrollUtils';
import { getItemWeight, getMaterialUnitWeight } from '../utils/itemWeight';

export interface UseEquipmentHandlersParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: string) => void;
  setActiveTargetedScroll: (item: EquipmentItem | null) => void;
  setActiveTab: (tab: 'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary') => void;
  setActiveRecallScroll: (item: EquipmentItem | null) => void;
}

export function useEquipmentHandlers({
  gameState,
  setGameState,
  addLogMessage,
  setActiveTargetedScroll,
  setActiveTab,
  setActiveRecallScroll,
}: UseEquipmentHandlersParams) {

  const handleEquipItem = (item: EquipmentItem, hand?: 'right' | 'left') => {
    if (!item) return;
    playSound('loot');
    
    setGameState((prev) => {
      let updatedStats = { ...prev.playerStats };
      let itemRemoved = false;
      let updatedInventory = prev.equipmentInventory.filter((it) => {
        if (!itemRemoved && (it === item || it.id === item.id)) {
          itemRemoved = true;
          return false;
        }
        return true;
      });
      let nextArmor = prev.equippedArmor;
      let nextHelmet = prev.equippedHelmet;
      let nextGloves = prev.equippedGloves;
      let nextBoots = prev.equippedBoots;
      let nextShield = prev.equippedShield;
      let nextAmulet = prev.equippedAmulet;
      let nextWeapon = prev.currentWeapon;

      if (item?.subType === 'Scroll') {
        if (item.id?.includes("scroll_spell_")) {
          const template = SPELL_SCROLLS.find(t => item.id?.includes(t.id));
          const requiredMp = template ? template.mpCost : 20;
          if (prev.playerStats.mp < requiredMp) {
            setTimeout(() => {
              addLogMessage(`❌ Insufficient Mana! You need at least ${requiredMp} MP to channel the elemental forces of ${item.name}. (Current MP: ${prev.playerStats.mp}/${prev.playerStats.maxMp})`, 'system');
            }, 50);
            return prev;
          }
          setTimeout(() => {
            setActiveTargetedScroll(item);
            setActiveTab('dungeon');
            addLogMessage(`✨ [SPELL SCROLL READY]: Click any enemy on the board to cast ${item.name}! (Cost: ${requiredMp} MP. Tap ESC or Cancel to abort)`, 'info');
          }, 50);
          return prev;
        }

        if (item.name?.includes("Recall") || item.id?.includes("recall_town")) {
          if (prev.playerStats.mp < 15) {
            setTimeout(() => {
              addLogMessage(`❌ Insufficient Mana! You need at least 15 MP to channel the dimensional magic of the Scroll of Recall. (Current MP: ${prev.playerStats.mp}/${prev.playerStats.maxMp})`, 'system');
            }, 50);
            return prev;
          }
          setTimeout(() => {
            setActiveRecallScroll(item);
          }, 50);
          return prev;
        }

        if (prev.isOverworld) {
          setTimeout(() => {
            addLogMessage(`❌ The Scroll of Escape can only be read inside a dark dungeon to flee back to the surface entrance!`, 'system');
          }, 50);
          return prev;
        }

        setTimeout(() => {
          playSound('spell');
          addLogMessage(`🔮 You read the Scroll of Escape! Bright protective portals of stardust wrap around you and rip you out of the Abyss back to the safety of the surface entrance!`, 'danger');
        }, 50);

        const exChunkX = prev.dungeonEntranceChunkX ?? 0;
        const exChunkY = prev.dungeonEntranceChunkY ?? 0;
        const exPlayerX = prev.dungeonEntrancePlayerX ?? 25;
        const exPlayerY = prev.dungeonEntrancePlayerY ?? 15;

        // Save current Dungeon Level state before discarding active play coordinates
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

        const targetChunk = prev.overworldChunks[`${exChunkX},${exChunkY}`];
        const nextOverworldChunks = { ...prev.overworldChunks };
        if (targetChunk) {
          nextOverworldChunks[`${exChunkX},${exChunkY}`] = {
            ...targetChunk,
            visitedTiles: prev.visitedTiles,
          };
        }

        return {
          ...prev,
          isOverworld: true,
          overworldZ: 0,
          isArena: false,
          currentChunkX: exChunkX,
          currentChunkY: exChunkY,
          playerX: exPlayerX,
          playerY: exPlayerY,
          overworldChunks: nextOverworldChunks,
          map: targetChunk ? targetChunk.map : [],
          discovered: targetChunk ? targetChunk.discovered : [],
          visible: [],
          enemies: [],
          traps: [],
          chests: [],
          lootPiles: [],
          corpses: [],
          bloodSplatters: [],
          props: [],
          visitedTiles: targetChunk ? targetChunk.visitedTiles || {} : {},
          dungeonLevels: {
            ...(prev.dungeonLevels || {}),
            [key]: saved,
          },
          equipmentInventory: consumeItemFromInventory(prev.equipmentInventory, item.id),
          playerStats: {
            ...prev.playerStats,
            depth: 0,
          },
        };
      }

      // Standard Gear Equip Logic
      const applyStatBonuses = (gear: EquipmentItem, isEquip: boolean) => {
        if (!gear.statBonuses) return;
        const mult = isEquip ? 1 : -1;
        if (gear.statBonuses.str) updatedStats.str = (updatedStats.str || 10) + gear.statBonuses.str * mult;
        if (gear.statBonuses.dex) updatedStats.dex = (updatedStats.dex || 10) + gear.statBonuses.dex * mult;
        if (gear.statBonuses.int) updatedStats.int = (updatedStats.int || 10) + gear.statBonuses.int * mult;
        if (gear.statBonuses.lck) updatedStats.lck = (updatedStats.lck || 10) + gear.statBonuses.lck * mult;
        if (gear.statBonuses.cha) updatedStats.cha = (updatedStats.cha || 10) + gear.statBonuses.cha * mult;
      };

      if ((item.subType as string) === 'HeavyArmor' || (item.subType as string) === 'LightArmor' || (item.subType as string) === 'Armor' || (item.type === 'armor' && item.subType !== 'Shield')) {
        if (item.subType === 'Helmet') {
          if (nextHelmet) {
            updatedInventory.push(nextHelmet);
            updatedStats.def = Math.max(0, updatedStats.def - nextHelmet.defense);
            applyStatBonuses(nextHelmet, false);
          }
          nextHelmet = item;
          updatedStats.def += item.defense;
          applyStatBonuses(item, true);
        } else if (item.subType === 'Gloves') {
          if (nextGloves) {
            updatedInventory.push(nextGloves);
            updatedStats.def = Math.max(0, updatedStats.def - nextGloves.defense);
            applyStatBonuses(nextGloves, false);
          }
          nextGloves = item;
          updatedStats.def += item.defense;
          applyStatBonuses(item, true);
        } else if (item.subType === 'Boots') {
          if (nextBoots) {
            updatedInventory.push(nextBoots);
            updatedStats.def = Math.max(0, updatedStats.def - nextBoots.defense);
            applyStatBonuses(nextBoots, false);
          }
          nextBoots = item;
          updatedStats.def += item.defense;
          applyStatBonuses(item, true);
        } else if (item.subType === 'Amulet') {
          if (nextAmulet) {
            updatedInventory.push(nextAmulet);
            updatedStats.def = Math.max(0, updatedStats.def - nextAmulet.defense);
            applyStatBonuses(nextAmulet, false);
          }
          nextAmulet = item;
          updatedStats.def += item.defense;
          applyStatBonuses(item, true);
        } else {
          // Body Armor
          if (nextArmor) {
            updatedInventory.push(nextArmor);
            updatedStats.def = Math.max(0, updatedStats.def - nextArmor.defense);
            applyStatBonuses(nextArmor, false);
          }
          nextArmor = item;
          updatedStats.def += item.defense;
          applyStatBonuses(item, true);
        }
      } else if (item.type === 'weapon' || item.subType === 'Shield') {
        const targetHand = hand || (item.subType === 'Shield' ? 'left' : 'right');

        if (targetHand === 'left') {
          // Equipping to Left Hand (offhand / shield)
          // 1. If currently wielding a 2-handed weapon in Right Hand, unequip it
          if (nextWeapon && isTwoHandedWeapon(nextWeapon)) {
            const returnedWeapon: EquipmentItem = {
              id: nextWeapon.id,
              name: nextWeapon.name,
              type: (nextWeapon.type as any) || 'weapon',
              subType: (nextWeapon.baseType as any) || 'Sword',
              defense: nextWeapon.defense ?? 0,
              damage: nextWeapon.damage,
              critChance: nextWeapon.critChance,
              range: nextWeapon.range,
              color: nextWeapon.color,
              description: nextWeapon.effectDescription,
              value: (nextWeapon as any).value ?? 25,
              durability: nextWeapon.durability ?? 100,
              maxDurability: nextWeapon.maxDurability ?? 100,
              upgradeLevel: nextWeapon.upgradeLevel,
              isMutated: nextWeapon.isMutated,
              mutationCount: nextWeapon.mutationCount,
              traits: nextWeapon.traits,
              statBonuses: nextWeapon.statBonuses,
            };
            updatedInventory.push(returnedWeapon);
            applyStatBonuses(returnedWeapon, false);
            if (nextWeapon.defense) updatedStats.def = Math.max(0, updatedStats.def - nextWeapon.defense);
            nextWeapon = null;
            addLogMessage(`👐 Unequipped 2-handed ${returnedWeapon.name} to wield offhand shield.`, 'system');
          }

          // 2. If Left Hand already has an item/shield, unequip it to inventory
          if (nextShield) {
            updatedInventory.push(nextShield);
            applyStatBonuses(nextShield, false);
            if (nextShield.defense) updatedStats.def = Math.max(0, updatedStats.def - nextShield.defense);
          }

          // 3. Equip new item into Left Hand
          nextShield = item;
          applyStatBonuses(item, true);
          if (item.defense) updatedStats.def += item.defense;
          addLogMessage(`🛡️ Equipped ${item.name} into Offhand / Shield slot (+${item.defense || 0} DEF).`, 'system');

        } else {
          // Equipping to Right Hand (main hand)
          const is2Handed = isTwoHandedWeapon(item);
          if (is2Handed && nextShield) {
            updatedInventory.push(nextShield);
            applyStatBonuses(nextShield, false);
            if (nextShield.defense) updatedStats.def = Math.max(0, updatedStats.def - nextShield.defense);
            addLogMessage(`👐 Unequipped offhand ${nextShield.name} to wield 2-handed ${item.name}.`, 'system');
            nextShield = null;
          }

          if (nextWeapon) {
            const returnedItem: EquipmentItem = {
              id: nextWeapon.id,
              name: nextWeapon.name,
              type: (nextWeapon.type as any) || 'weapon',
              subType: (nextWeapon.baseType as any) || 'Sword',
              defense: nextWeapon.defense ?? 0,
              damage: nextWeapon.damage,
              critChance: nextWeapon.critChance,
              range: nextWeapon.range,
              color: nextWeapon.color,
              description: nextWeapon.effectDescription,
              value: (nextWeapon as any).value ?? 25,
              durability: nextWeapon.durability ?? 100,
              maxDurability: nextWeapon.maxDurability ?? 100,
              upgradeLevel: nextWeapon.upgradeLevel,
              isMutated: nextWeapon.isMutated,
              mutationCount: nextWeapon.mutationCount,
              traits: nextWeapon.traits,
              statBonuses: nextWeapon.statBonuses,
            };
            updatedInventory.push(returnedItem);
            applyStatBonuses(returnedItem, false);
            if (nextWeapon.defense) {
              updatedStats.def = Math.max(0, updatedStats.def - nextWeapon.defense);
            }
          }

          nextWeapon = {
            id: item.id,
            name: item.name,
            baseType: item.subType as any,
            type: (item.type === 'armor' ? 'armor' : 'weapon') as 'weapon' | 'armor',
            damage: item.damage,
            critChance: item.critChance,
            range: item.range,
            color: item.color,
            effectDescription: item.description,
            durability: item.durability ?? 100,
            maxDurability: item.maxDurability ?? 100,
            defense: item.defense,
            upgradeLevel: item.upgradeLevel,
            isMutated: item.isMutated,
            mutationCount: item.mutationCount,
            traits: item.traits,
            statBonuses: item.statBonuses,
            materialUsed: (item as any).materialUsed || { id: 'mat_iron', name: 'Scrap Iron', color: '#475569', baseDamageMod: 0, critMod: 0, extraProperty: 'NONE' },
            catalystUsed: (item as any).catalystUsed || { id: 'cat_plain', type: 'Shadow', name: 'Normal', statusEffectChance: 0, statusDuration: 0, color: '#94a3b8', damageType: 'Physical' },
          };
          applyStatBonuses(item, true);
          if (item.defense) {
            updatedStats.def += item.defense;
          }
          addLogMessage(`⚔️ Equipped ${item.name} into Right Hand (+${item.damage || 0} ATK).`, 'system');
        }
      }

      return {
        ...prev,
        equippedArmor: nextArmor,
        equippedHelmet: nextHelmet,
        equippedGloves: nextGloves,
        equippedBoots: nextBoots,
        equippedShield: nextShield,
        equippedAmulet: nextAmulet,
        currentWeapon: nextWeapon,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
  };

  const handleUnequipArmor = () => {
    playSound('loot');
    let unequippedName = '';
    
    setGameState((prev) => {
      if (!prev.equippedArmor) return prev;
      const armor = prev.equippedArmor;
      unequippedName = armor.name;
      const updatedInventory = [...prev.equipmentInventory, armor];
      const updatedStats = { ...prev.playerStats };
      updatedStats.def = Math.max(0, updatedStats.def - armor.defense);
      if (armor.statBonuses) {
        if (armor.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - armor.statBonuses.str);
        if (armor.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - armor.statBonuses.dex);
        if (armor.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - armor.statBonuses.int);
        if (armor.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - armor.statBonuses.lck);
        if (armor.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - armor.statBonuses.cha);
      }

      return {
        ...prev,
        equippedArmor: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    if (unequippedName) addLogMessage(`🛡️ Unequipped ${unequippedName}.`, 'system');
  };

  const handleUnequipHelmet = () => {
    playSound('loot');
    let unequippedName = '';
    
    setGameState((prev) => {
      if (!prev.equippedHelmet) return prev;
      const helmet = prev.equippedHelmet;
      unequippedName = helmet.name;
      const updatedInventory = [...prev.equipmentInventory, helmet];
      const updatedStats = { ...prev.playerStats };
      updatedStats.def = Math.max(0, updatedStats.def - helmet.defense);
      if (helmet.statBonuses) {
        if (helmet.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - helmet.statBonuses.str);
        if (helmet.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - helmet.statBonuses.dex);
        if (helmet.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - helmet.statBonuses.int);
        if (helmet.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - helmet.statBonuses.lck);
        if (helmet.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - helmet.statBonuses.cha);
      }

      return {
        ...prev,
        equippedHelmet: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    if (unequippedName) addLogMessage(`🛡️ Unequipped ${unequippedName}.`, 'system');
  };

  const handleUnequipGloves = () => {
    playSound('loot');
    let unequippedName = '';
    
    setGameState((prev) => {
      if (!prev.equippedGloves) return prev;
      const gloves = prev.equippedGloves;
      unequippedName = gloves.name;
      const updatedInventory = [...prev.equipmentInventory, gloves];
      const updatedStats = { ...prev.playerStats };
      updatedStats.def = Math.max(0, updatedStats.def - gloves.defense);
      if (gloves.statBonuses) {
        if (gloves.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - gloves.statBonuses.str);
        if (gloves.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - gloves.statBonuses.dex);
        if (gloves.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - gloves.statBonuses.int);
        if (gloves.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - gloves.statBonuses.lck);
        if (gloves.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - gloves.statBonuses.cha);
      }

      return {
        ...prev,
        equippedGloves: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    if (unequippedName) addLogMessage(`🛡️ Unequipped ${unequippedName}.`, 'system');
  };

  const handleUnequipBoots = () => {
    playSound('loot');
    let unequippedName = '';
    
    setGameState((prev) => {
      if (!prev.equippedBoots) return prev;
      const boots = prev.equippedBoots;
      unequippedName = boots.name;
      const updatedInventory = [...prev.equipmentInventory, boots];
      const updatedStats = { ...prev.playerStats };
      updatedStats.def = Math.max(0, updatedStats.def - boots.defense);
      if (boots.statBonuses) {
        if (boots.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - boots.statBonuses.str);
        if (boots.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - boots.statBonuses.dex);
        if (boots.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - boots.statBonuses.int);
        if (boots.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - boots.statBonuses.lck);
        if (boots.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - boots.statBonuses.cha);
      }

      return {
        ...prev,
        equippedBoots: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    if (unequippedName) addLogMessage(`🛡️ Unequipped ${unequippedName}.`, 'system');
  };

  const handleUnequipShield = () => {
    playSound('loot');
    let unequippedName = '';
    
    setGameState((prev) => {
      if (!prev.equippedShield) return prev;
      const shield = prev.equippedShield;
      unequippedName = shield.name;
      const updatedInventory = [...prev.equipmentInventory, shield];
      const updatedStats = { ...prev.playerStats };
      if (shield.defense) {
        updatedStats.def = Math.max(0, updatedStats.def - shield.defense);
      }
      if (shield.statBonuses) {
        if (shield.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - shield.statBonuses.str);
        if (shield.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - shield.statBonuses.dex);
        if (shield.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - shield.statBonuses.int);
        if (shield.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - shield.statBonuses.lck);
        if (shield.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - shield.statBonuses.cha);
      }

      return {
        ...prev,
        equippedShield: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    if (unequippedName) addLogMessage(`🛡️ Unequipped ${unequippedName}.`, 'system');
  };

  const handleUnequipAmulet = () => {
    playSound('loot');
    let unequippedName = '';
    
    setGameState((prev) => {
      if (!prev.equippedAmulet) return prev;
      const amulet = prev.equippedAmulet;
      unequippedName = amulet.name;
      const updatedInventory = [...prev.equipmentInventory, amulet];
      const updatedStats = { ...prev.playerStats };
      if (amulet.defense) {
        updatedStats.def = Math.max(0, updatedStats.def - amulet.defense);
      }
      if (amulet.statBonuses) {
        if (amulet.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - amulet.statBonuses.str);
        if (amulet.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - amulet.statBonuses.dex);
        if (amulet.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - amulet.statBonuses.int);
        if (amulet.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - amulet.statBonuses.lck);
        if (amulet.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - amulet.statBonuses.cha);
      }

      return {
        ...prev,
        equippedAmulet: null,
        equipmentInventory: updatedInventory,
        playerStats: updatedStats
      };
    });
    if (unequippedName) addLogMessage(`🛡️ Unequipped ${unequippedName}.`, 'system');
  };

  const handleUnequipWeapon = () => {
    playSound('loot');
    let unequippedName = '';

    setGameState((prev) => {
      if (!prev.currentWeapon) return prev;
      const weapon = prev.currentWeapon;
      unequippedName = weapon.name;

      const returnedItem: EquipmentItem = {
        id: weapon.id,
        name: weapon.name,
        type: (weapon.type as any) || 'weapon',
        subType: (weapon.baseType as any) || 'Sword',
        defense: weapon.defense ?? 0,
        damage: weapon.damage,
        critChance: weapon.critChance,
        range: weapon.range,
        color: weapon.color,
        description: weapon.effectDescription,
        value: (weapon as any).value ?? 25,
        durability: weapon.durability ?? 100,
        maxDurability: weapon.maxDurability ?? 100,
        upgradeLevel: weapon.upgradeLevel,
        isMutated: weapon.isMutated,
        mutationCount: weapon.mutationCount,
        traits: weapon.traits,
        statBonuses: weapon.statBonuses,
      };

      const updatedStats = { ...prev.playerStats };
      if (weapon.statBonuses) {
        if (weapon.statBonuses.str) updatedStats.str = Math.max(1, (updatedStats.str || 10) - weapon.statBonuses.str);
        if (weapon.statBonuses.dex) updatedStats.dex = Math.max(1, (updatedStats.dex || 10) - weapon.statBonuses.dex);
        if (weapon.statBonuses.int) updatedStats.int = Math.max(1, (updatedStats.int || 10) - weapon.statBonuses.int);
        if (weapon.statBonuses.lck) updatedStats.lck = Math.max(1, (updatedStats.lck || 10) - weapon.statBonuses.lck);
        if (weapon.statBonuses.cha) updatedStats.cha = Math.max(1, (updatedStats.cha || 10) - weapon.statBonuses.cha);
      }
      if (weapon.defense) {
        updatedStats.def = Math.max(0, updatedStats.def - weapon.defense);
      }

      return {
        ...prev,
        currentWeapon: null,
        equipmentInventory: [...prev.equipmentInventory, returnedItem],
        playerStats: updatedStats
      };
    });
    if (unequippedName) addLogMessage(`⚔️ Stashed away ${unequippedName} into inventory bag.`, 'system');
  };

  const handleDiscardItem = (id: string, qty: number = 1) => {
    setGameState((prev) => {
      const item = prev.equipmentInventory.find(i => i.id === id);
      if (!item) return prev;
      const itemQty = item.quantity || 1;
      const discardCount = Math.min(itemQty, Math.max(1, qty));
      const totalSaved = (getItemWeight(item) * discardCount).toFixed(1);
      addLogMessage(`🗑️ Discarded ${discardCount}x ${item.name} into the abyss to lighten your load (Saved: ${totalSaved} kg).`, 'system');
      return {
        ...prev,
        equipmentInventory: consumeItemFromInventory(prev.equipmentInventory, id, discardCount)
      };
    });
  };

  const handleDiscardMaterial = (id: string, qty: number = 1) => {
    setGameState((prev) => {
      const count = prev.inventoryMaterials[id] || 0;
      if (count <= 0) return prev;
      const discardCount = Math.min(count, Math.max(1, qty));
      const totalSaved = (getMaterialUnitWeight(id) * discardCount).toFixed(1);
      addLogMessage(`🗑️ Discarded ${discardCount}x material unit(s) to lighten weight (Saved: ${totalSaved} kg).`, 'system');
      return {
        ...prev,
        inventoryMaterials: { ...prev.inventoryMaterials, [id]: count - discardCount }
      };
    });
  };

  const handleDiscardCatalyst = (id: string, qty: number = 1) => {
    setGameState((prev) => {
      const count = prev.inventoryCatalysts[id] || 0;
      if (count <= 0) return prev;
      const discardCount = Math.min(count, Math.max(1, qty));
      const totalSaved = (getMaterialUnitWeight(id) * discardCount).toFixed(1);
      addLogMessage(`🗑️ Discarded ${discardCount}x catalyst unit(s) to lighten weight (Saved: ${totalSaved} kg).`, 'system');
      return {
        ...prev,
        inventoryCatalysts: { ...prev.inventoryCatalysts, [id]: count - discardCount }
      };
    });
  };

  return {
    handleEquipItem,
    handleUnequipArmor,
    handleUnequipHelmet,
    handleUnequipGloves,
    handleUnequipBoots,
    handleUnequipShield,
    handleUnequipAmulet,
    handleUnequipWeapon,
    handleDiscardItem,
    handleDiscardMaterial,
    handleDiscardCatalyst,
  };
}
