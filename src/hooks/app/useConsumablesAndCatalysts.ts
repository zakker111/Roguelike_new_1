import React from 'react';
import { GameState, WeaponBaseType, DungeonLevelState, EquipmentItem } from '../../types';
import { formatGameTime, generateOverworldChunk } from '../../utils/overworld';
import { computeFOV } from '../../utils/ai';
import { spawnFollowersOnLevelLoadByReset } from '../../utils/dungeon';

interface UseConsumablesAndCatalystsProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound: (sound: any) => void;
  addLogMessage: (text: string, type?: any) => void;
  levelWidth: number;
  levelHeight: number;
}

export function useConsumablesAndCatalysts({
  gameState,
  setGameState,
  playSound,
  addLogMessage,
  levelWidth,
  levelHeight,
}: UseConsumablesAndCatalystsProps) {
  const handleShiftCatalyst = (sourceCatId: string) => {
    playSound('mutate');
    setGameState((prev) => {
      const count = prev.inventoryCatalysts[sourceCatId] || 0;
      if (count < 1 || prev.playerStats.gold < 10) return prev;

      const nextCats = { ...prev.inventoryCatalysts };
      nextCats[sourceCatId] = count - 1;

      const catPool = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'].filter((id) => id !== sourceCatId);
      const targetCat = catPool[Math.floor(Math.random() * catPool.length)];
      nextCats[targetCat] = (nextCats[targetCat] || 0) + 1;

      const nextLogs = [...prev.logs];
      nextLogs.push({
        id: `shift_${Date.now()}`,
        text: `🔮 [ELEMENTAL SHIFT]: Reacted 1x ${sourceCatId.replace('cat_', '').toUpperCase()} with 10 Gold. Shifted into 1x ${targetCat.replace('cat_', '').toUpperCase()}!`,
        type: 'craft',
        timestamp: formatGameTime(prev.gameTime).timeStr,
      });

      return {
        ...prev,
        inventoryCatalysts: nextCats,
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold - 10,
        },
        logs: nextLogs,
      };
    });
  };

  const handleUnstableReactorSurge = () => {
    playSound('mutate');
    setGameState((prev) => {
      if (prev.playerStats.gold < 100) return prev;

      const nextCats = { ...prev.inventoryCatalysts };
      const totalCats: number = Object.values(nextCats).reduce<number>((sum, qty) => sum + (Number(qty) || 0), 0);
      if (totalCats < 2) return prev;

      let deductedCount = 0;
      const catKeys = Object.keys(nextCats);
      for (const key of catKeys) {
        while (nextCats[key] > 0 && deductedCount < 2) {
          nextCats[key]--;
          deductedCount++;
        }
        if (deductedCount >= 2) break;
      }

      const nextLogs = [...prev.logs];
      const roll = Math.random();
      const nextEquipment = [...prev.equipmentInventory];
      const nextMats = { ...prev.inventoryMaterials };
      let nextHp = prev.playerStats.hp;
      const nextChests = [...prev.chests];

      if (roll < 0.4) {
        const rareItems: EquipmentItem[] = [
          {
            id: 'axe_wild_magic',
            name: 'Cosmic Wildfire Blade',
            type: 'weapon' as const,
            subType: WeaponBaseType.Sword,
            defense: 0,
            damage: 16,
            critChance: 0.25,
            range: 1,
            color: '#ec4899',
            description: 'A surging blade infused with pure, volatile wild magic.',
            value: 240,
            durability: 100,
            maxDurability: 100,
          },
          {
            id: 'shield_chaos',
            name: 'Aegis of Discord',
            type: 'armor' as const,
            subType: 'Shield',
            defense: 9,
            damage: 0,
            critChance: 0,
            range: 0,
            color: '#a855f7',
            description: 'Blocks kinetic blows and channels energy back into raw aether sparks.',
            value: 180,
            durability: 100,
            maxDurability: 100,
          },
          {
            id: 'armor_void',
            name: 'Vestments of Void-Grip',
            type: 'armor' as const,
            subType: 'HeavyArmor',
            defense: 10,
            damage: 0,
            critChance: 0,
            range: 0,
            color: '#8b5cf6',
            description: 'Warped heavy armor plating crafted from space debris.',
            value: 260,
            durability: 100,
            maxDurability: 100,
          },
        ];
        const selectedItem = rareItems[Math.floor(Math.random() * rareItems.length)];
        nextEquipment.push({
          ...selectedItem,
          id: `${selectedItem.id}_${Date.now()}`,
        });
        nextLogs.push({
          id: `reactor_win_${Date.now()}`,
          text: `🎁 [REACTOR MASTERPIECE]: The wild magic flask surges and crystallizes! Out rolls a pristine, legendary equipment item: [${selectedItem.name}]!`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      } else if (roll < 0.7) {
        const rareMats = ['mat_mithril', 'mat_obsidian', 'mat_dragonscale', 'mat_feybone'];
        const count = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < count; i++) {
          const randMat = rareMats[Math.floor(Math.random() * rareMats.length)];
          nextMats[randMat] = (nextMats[randMat] || 0) + 1;
        }
        nextLogs.push({
          id: `reactor_mats_${Date.now()}`,
          text: `💎 [REACTOR SUCCESS]: The synthesis succeeds! Generated ${count}x rare stellar ore pieces inside your stash.`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      } else if (roll < 0.85) {
        nextHp = Math.max(5, nextHp - 10);
        nextMats['mat_obsidian'] = (nextMats['mat_obsidian'] || 0) + 2;
        nextCats['cat_fire'] = (nextCats['cat_fire'] || 0) + 2;
        nextLogs.push({
          id: `reactor_fail_${Date.now()}`,
          text: `💥 [REACTOR BLOWOUT]: CRITICAL OVERLOAD! The alchemical transmuter explodes with volatile steam! You take 10 Fire damage, but scoop 2x Obsidian and 2x Fire Shards from the blast.`,
          type: 'danger',
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      } else {
        nextChests.push({
          id: `chaos_chest_${Date.now()}`,
          x: prev.playerX,
          y: prev.playerY,
          gold: 200,
          materials: ['mat_mithril', 'mat_dragonscale'],
          catalysts: ['cat_shadow'],
          isOpened: false,
        });
        nextLogs.push({
          id: `reactor_portal_${Date.now()}`,
          text: `🌌 [REACTOR PORTAL]: The flask rips open an astral rift! A glistening ancient treasure cache materialized directly on your current coordinates!`,
          type: 'info',
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      }

      return {
        ...prev,
        inventoryCatalysts: nextCats,
        inventoryMaterials: nextMats,
        equipmentInventory: nextEquipment,
        chests: nextChests,
        playerStats: {
          ...prev.playerStats,
          hp: nextHp,
          gold: prev.playerStats.gold - 100,
        },
        logs: nextLogs,
      };
    });
  };

  const handleEatMeat = (foodKey: string = 'mat_cooked_meat') => {
    const isPotion = foodKey.startsWith('potion_');
    const isScroll = foodKey === 'scroll_recall';

    if (isPotion) {
      playSound('drink');
    } else if (isScroll) {
      // Don't play sound yet, because if overworld, it fails to read
    } else {
      playSound('eat');
    }

    let shouldConsume = true;

    setGameState((prev) => {
      const count = prev.inventoryMaterials[foodKey] || 0;
      if (count <= 0) {
        shouldConsume = false;
        return prev;
      }

      if (isScroll && prev.isOverworld) {
        shouldConsume = false;
        return prev;
      }

      const nextMats = {
        ...prev.inventoryMaterials,
        [foodKey]: count - 1,
      };

      if (isScroll) {
        // SCROLL OF ESCAPE TELEPORTATION LOGIC
        const exChunkX = prev.dungeonEntranceChunkX ?? 0;
        const exChunkY = prev.dungeonEntranceChunkY ?? 0;
        const exPlayerX = prev.dungeonEntrancePlayerX ?? 25;
        const exPlayerY = prev.dungeonEntrancePlayerY ?? 15;

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

        const updatedDungeonLevels = {
          ...prev.dungeonLevels,
          [key]: saved,
        };

        const targetChunkKey = `${exChunkX},${exChunkY}`;
        let targetChunk = prev.overworldChunks[targetChunkKey];
        const nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
        const nextOverworldChunks = { ...prev.overworldChunks };
        if (!targetChunk) {
          targetChunk = generateOverworldChunk(exChunkX, exChunkY, levelWidth, levelHeight, nextSpawnedCats, prev.spawnedSeppo, prev.playerStats, prev.currentWeapon);
          targetChunk.npcs.forEach((n) => {
            if (n.id?.startsWith('npc_cat_')) {
              const catName = n.name.split(' (')[0];
              if (!nextSpawnedCats.includes(catName)) {
                nextSpawnedCats.push(catName);
              }
            }
          });
          nextOverworldChunks[targetChunkKey] = targetChunk;
        }

        const fov = computeFOV(exPlayerX, exPlayerY, targetChunk.map, 6);
        const discovered = targetChunk.map.map((row, y) =>
          row.map((cell, x) => (targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false)
        );

        return {
          ...prev,
          isOverworld: true,
          currentChunkX: exChunkX,
          currentChunkY: exChunkY,
          overworldChunks: nextOverworldChunks,
          map: targetChunk.map,
          discovered: discovered,
          visible: fov,
          enemies: spawnFollowersOnLevelLoadByReset(targetChunk.enemies, prev.followers, exPlayerX, exPlayerY, targetChunk.map, prev.activeCompanionQuests),
          traps: targetChunk.traps,
          chests: targetChunk.chests,
          lootPiles: targetChunk.lootPiles || [],
          corpses: targetChunk.corpses || [],
          bloodSplatters: targetChunk.bloodSplatters || [],
          dungeonProps: targetChunk.props || [],
          spawnedCats: nextSpawnedCats,
          dungeonLevels: updatedDungeonLevels,
          inventoryMaterials: nextMats,
          playerStats: {
            ...prev.playerStats,
            x: exPlayerX,
            y: exPlayerY,
            depth: 0,
          },
        };
      }

      // POTIONS & FOODS LOGIC
      let hpVal = 25;
      let mpVal = 5;

      if (foodKey === 'potion_hp') {
        hpVal = 35;
        mpVal = 0;
      } else if (foodKey === 'potion_mp') {
        hpVal = 0;
        mpVal = 15;
      } else if (foodKey === 'potion_medium_hp') {
        hpVal = 60;
        mpVal = 0;
      } else if (foodKey === 'potion_medium_mp') {
        hpVal = 0;
        mpVal = 30;
      } else if (foodKey === 'potion_full_rejuv' || foodKey === 'potion_full_rejuvenation') {
        hpVal = prev.playerStats.maxHp;
        mpVal = prev.playerStats.maxMp;
      } else if (foodKey === 'mat_beer') {
        hpVal = 15;
        mpVal = 5;
      } else if (foodKey === 'mat_bread') {
        hpVal = 20;
        mpVal = 0;
      } else if (foodKey === 'mat_berry') {
        hpVal = 5;
        mpVal = 0;
      } else if (foodKey === 'mat_cooked_pie') {
        hpVal = 40;
        mpVal = 15;
      } else if (foodKey === 'mat_raw_fish') {
        hpVal = 10;
        mpVal = 2;
      } else if (foodKey === 'mat_cooked_fish') {
        hpVal = 45;
        mpVal = 30;
      } else if (foodKey === 'mat_prime_meat') {
        hpVal = 15;
        mpVal = 0;
      } else if (foodKey === 'mat_cooked_prime_meat') {
        hpVal = 60;
        mpVal = 15;
      } else if (foodKey === 'mat_seppo_hooch') {
        hpVal = 75;
        mpVal = 40;
      }

      const nextStats = {
        ...prev.playerStats,
        hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + hpVal),
        mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + mpVal),
      };

      let effectText = `+${hpVal} HP +${mpVal} MP`;
      if (foodKey === 'potion_full_rejuv' || foodKey === 'potion_full_rejuvenation') {
        effectText = 'Full Rejuv!';
      } else if (hpVal === 0) {
        effectText = `+${mpVal} MP`;
      } else if (mpVal === 0) {
        effectText = `+${hpVal} HP`;
      }

      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: effectText, type: 'heal' },
        });
        window.dispatchEvent(ev);
      }

      return {
        ...prev,
        inventoryMaterials: nextMats,
        playerStats: nextStats,
      };
    });

    setTimeout(() => {
      if (!shouldConsume) {
        if (isScroll) {
          playSound('bump');
          addLogMessage(`❌ The Scroll of Escape can only be read inside a dark dungeon to flee back to the surface entrance!`, 'system');
        }
        return;
      }

      if (isScroll) {
        playSound('spell');
        addLogMessage(`🔮 You read the Scroll of Escape! Bright protective portals of stardust wrap around you and rip you out of the Abyss back to the safety of the surface entrance!`, 'danger');
        return;
      }

      let hpVal = 25;
      let mpVal = 5;
      let label = 'savory Cooked Meat';
      let icon = '🍖';

      if (foodKey === 'potion_hp') {
        hpVal = 35;
        mpVal = 0;
        label = 'Apothecary Elixir (HP)';
        icon = '🧪';
      } else if (foodKey === 'potion_mp') {
        hpVal = 0;
        mpVal = 15;
        label = 'Aether Beverage (MP)';
        icon = '🧪';
      } else if (foodKey === 'potion_medium_hp') {
        hpVal = 60;
        mpVal = 0;
        label = 'Rejuvenating Potion (Medium HP)';
        icon = '🧪';
      } else if (foodKey === 'potion_medium_mp') {
        hpVal = 0;
        mpVal = 30;
        label = 'Rejuvenating Beverage (Medium MP)';
        icon = '🧪';
      } else if (foodKey === 'potion_full_rejuv') {
        hpVal = gameState.playerStats.maxHp;
        mpVal = gameState.playerStats.maxMp;
        label = 'Elixir of Full Restoration';
        icon = '🧪';
      } else if (foodKey === 'potion_full_rejuvenation') {
        hpVal = gameState.playerStats.maxHp;
        mpVal = gameState.playerStats.maxMp;
        label = 'Royal Champion Rejuvenation Elixir';
        icon = '🧪';
      } else if (foodKey === 'mat_beer') {
        hpVal = 15;
        mpVal = 5;
        label = 'Frothy Beer Mug';
        icon = '🍺';
      } else if (foodKey === 'mat_bread') {
        hpVal = 20;
        mpVal = 0;
        label = 'Fresh Hearth Bread';
        icon = '🍞';
      } else if (foodKey === 'mat_berry') {
        hpVal = 5;
        mpVal = 0;
        label = 'Wild Berries';
        icon = '🍓';
      } else if (foodKey === 'mat_cooked_pie') {
        hpVal = 40;
        mpVal = 15;
        label = 'Baked Berry Pie';
        icon = '🥧';
      } else if (foodKey === 'mat_raw_fish') {
        hpVal = 10;
        mpVal = 2;
        label = 'Raw River Fish';
        icon = '🐟';
      } else if (foodKey === 'mat_cooked_fish') {
        hpVal = 45;
        mpVal = 30;
        label = 'Campfire Grilled Fish';
        icon = '🐟';
      } else if (foodKey === 'mat_prime_meat') {
        hpVal = 15;
        mpVal = 0;
        label = 'Raw Prime Wild Meat';
        icon = '🥩';
      } else if (foodKey === 'mat_cooked_prime_meat') {
        hpVal = 60;
        mpVal = 15;
        label = 'Prime Flame-Grilled Steak';
        icon = '🥩';
      } else if (foodKey === 'mat_seppo_hooch') {
        hpVal = 75;
        mpVal = 40;
        label = "Seppo's Special Hooch (Unbelievably potent!)";
        icon = '🍶';
      }

      if (foodKey === 'mat_seppo_hooch') {
        const playerLogs = [
          `🥴 You down the entire flask of Seppo's Hooch... Your eyes water, your throat burns, and you feel absolutely invincible! *HIC!*`,
          `🥴 Gulp gulp gulp... Wow! That's practically rocket fuel. You can hear colors and see sound now. Excellent!`,
          `🥴 You take a swig of Seppo's secret blend. It smells like sauna birch wood and pure yeast. Truly, a warrior's drink!`,
        ];
        addLogMessage(playerLogs[Math.floor(Math.random() * playerLogs.length)], 'danger');
      } else {
        const recoverText =
          hpVal > 0 && mpVal > 0 ? `+${hpVal} HP and +${mpVal} MP` : hpVal > 0 ? `+${hpVal} HP` : `+${mpVal} MP`;
        addLogMessage(`${icon} You consume ${label}. Restored ${recoverText}!`, 'loot');
      }
    }, 50);
  };

  const handleAdjustAttribute = (attr: 'str' | 'dex' | 'int' | 'cha' | 'lck', amount: number) => {
    if (amount <= 0) return;
    const unspent = gameState.playerStats.unspentPoints || 0;
    if (unspent < amount) {
      playSound('bump');
      return;
    }

    playSound('loot');

    setGameState((prev) => {
      const pStats = { ...prev.playerStats };
      if ((pStats.unspentPoints || 0) < amount) return prev;

      pStats[attr] = Math.max(10, (pStats[attr] || 10) + amount);
      pStats.unspentPoints = Math.max(0, (pStats.unspentPoints || 0) - amount);

      if (attr === 'str') {
        pStats.maxHp = (pStats.maxHp || 100) + amount * 5;
        pStats.hp = (pStats.hp || 100) + amount * 5;
      } else if (attr === 'int') {
        pStats.maxMp = (pStats.maxMp || 30) + amount * 3;
        pStats.mp = (pStats.mp || 30) + amount * 3;
      } else if (attr === 'dex') {
        pStats.atk = (pStats.atk || 5) + amount;
      }

      return {
        ...prev,
        playerStats: pStats,
      };
    });

    const labels: Record<string, string> = {
      str: 'STR (Strength)',
      dex: 'DEX (Dexterity)',
      int: 'INT (Intellect)',
      cha: 'CHA (Charisma)',
      lck: 'LCK (Luck)',
    };
    addLogMessage(`🧬 Allocated attribute point: +${amount} to ${labels[attr]} (Remaining: ${unspent - amount})`, 'info');
  };

  return {
    handleShiftCatalyst,
    handleUnstableReactorSurge,
    handleEatMeat,
    handleAdjustAttribute,
  };
}
