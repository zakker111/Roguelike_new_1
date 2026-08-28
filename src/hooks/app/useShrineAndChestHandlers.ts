import React from 'react';
import { GameState, DungeonProp } from '../../types';
import { handleDecorInteraction } from '../../utils/decorEngine';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../../utils/itemsData';
import { getMaterialUnitWeight } from '../../utils/itemWeight';
import { getEffectiveAttribute, generateRandomLootGear } from '../../utils/gameUtils';
import gameConfig from '../../data/gameConfig.json';
import { formatGameTime } from '../../utils/overworld';

interface UseShrineAndChestHandlersProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound: (sound: any) => void;
  addLogMessage: (text: string, type?: any) => void;
  executeEnemiesTurn: (px: number, py: number) => void;
}

export function useShrineAndChestHandlers({
  gameState,
  setGameState,
  playSound,
  addLogMessage,
  executeEnemiesTurn,
}: UseShrineAndChestHandlersProps) {
  const handleInteractWithDungeonShrine = (shrine: DungeonProp) => {
    if (shrine.description.includes('(EXHAUSTED)')) return;

    playSound('spell');

    let effectType = '';
    if (shrine.id.includes('forbidden_strength')) effectType = 'forbidden_strength';
    else if (shrine.id.includes('blind_oracle')) effectType = 'blind_oracle';
    else if (shrine.id.includes('blood_transfusion')) effectType = 'blood_transfusion';
    else if (shrine.id.includes('covetous_greed')) effectType = 'covetous_greed';
    else if (shrine.id.includes('reckless_berserker')) effectType = 'reckless_berserker';
    else if (shrine.id.includes('chrono_shift')) effectType = 'chrono_shift';

    if (!effectType) {
      if (shrine.name.includes('Strength')) effectType = 'forbidden_strength';
      else if (shrine.name.includes('Oracle')) effectType = 'blind_oracle';
      else if (shrine.name.includes('Transfusion')) effectType = 'blood_transfusion';
      else if (shrine.name.includes('Greed')) effectType = 'covetous_greed';
      else if (shrine.name.includes('Berserker')) effectType = 'reckless_berserker';
      else if (shrine.name.includes('Chrono-Shift')) effectType = 'chrono_shift';
    }

    setGameState((prev) => {
      if (!effectType) {
        const decorRes = handleDecorInteraction(shrine);
        const { updatedProp, statChanges, logs: decorLogs, effectText, effectType: efType } = decorRes;

        const nextProps = (prev.dungeonProps || []).map((p) => (p.id === shrine.id ? updatedProp : p));
        const nextStats = { ...prev.playerStats };
        const nextMats = { ...prev.inventoryMaterials };

        if (statChanges.hpChange) {
          nextStats.hp = Math.min(nextStats.maxHp, nextStats.hp + statChanges.hpChange);
        }
        if (statChanges.mpChange) {
          nextStats.mp = Math.min(nextStats.maxMp, nextStats.mp + statChanges.mpChange);
        }
        if (statChanges.goldChange) {
          nextStats.gold += statChanges.goldChange;
        }
        if (statChanges.expChange) {
          nextStats.xp += statChanges.expChange;
        }
        if (statChanges.strChange) nextStats.str += statChanges.strChange;
        if (statChanges.intChange) nextStats.int += statChanges.intChange;
        if (statChanges.dexChange) nextStats.dex += statChanges.dexChange;
        if (statChanges.exhaustionChange && nextStats.exhaustion !== undefined) {
          nextStats.exhaustion = Math.max(0, Math.min(100, nextStats.exhaustion + statChanges.exhaustionChange));
        }
        if (statChanges.addMaterial) {
          const { id, count } = statChanges.addMaterial;
          nextMats[id] = (nextMats[id] || 0) + count;
        }

        if (effectText) {
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: prev.playerX, y: prev.playerY, text: effectText, type: efType },
          });
          window.dispatchEvent(ev);
        }

        const nextLogs = [...prev.logs];
        decorLogs.forEach((msg) => {
          nextLogs.push({
            id: `log_decor_${Date.now()}_${Math.random()}`,
            text: msg,
            type: 'info',
            timestamp: new Date().toLocaleTimeString().split(' ')[0],
          });
        });

        return {
          ...prev,
          dungeonProps: nextProps,
          playerStats: nextStats,
          inventoryMaterials: nextMats,
          logs: nextLogs,
        };
      }

      const nextProps = prev.dungeonProps.map((p) => {
        if (p.id === shrine.id) {
          return {
            ...p,
            description: `${p.description.split(' Pray to')[0].split(' Touch to')[0]} (EXHAUSTED) - You have claimed this power.`,
          };
        }
        return p;
      });

      let nextStats = { ...prev.playerStats };
      let nextActiveEffects = nextStats.activeEffects ? [...nextStats.activeEffects] : [];
      const nextDiscovered = prev.discovered ? prev.discovered.map((row) => [...row]) : [];

      const logs: string[] = [];

      if (effectType === 'forbidden_strength') {
        nextStats.str += 4;
        nextStats.hp = Math.max(1, nextStats.hp - 15);

        nextActiveEffects = nextActiveEffects.filter((e) => e.id !== 'curse_vulnerability');
        nextActiveEffects.push({
          id: 'curse_vulnerability',
          name: 'Curse of Vulnerability',
          type: 'debuff',
          icon: '💀',
          description: 'Your physical defenses are withered. Reduces physical Defense by 5.',
          turnsRemaining: 40,
          color: '#f87171',
          statModifiers: {
            def: -5,
          },
        });

        logs.push(`⛧ [SHRINE]: You pray at the Shrine of Forbidden Strength. Your body surges with raw power! Permanent Strength increased by +4.`);
        logs.push(`💀 [CURSE]: The Altar drains -15 HP and inflicts the Curse of Vulnerability (-5 Def for 40 turns).`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `💪 +4 STR`, type: 'heal' },
        });
        window.dispatchEvent(ev);
        setTimeout(() => {
          const ev2 = new CustomEvent('spawn-game-effect', {
            detail: { x: prev.playerX, y: prev.playerY, text: `💔 -15 HP`, type: 'dmg' },
          });
          window.dispatchEvent(ev2);
        }, 150);
      } else if (effectType === 'blind_oracle') {
        nextStats.int += 3;

        const height = prev.map.length;
        const width = prev.map[0]?.length || 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            nextDiscovered[y][x] = true;
          }
        }

        nextActiveEffects = nextActiveEffects.filter((e) => e.id !== 'cursed_sight');
        nextActiveEffects.push({
          id: 'cursed_sight',
          name: 'Cursed Sight',
          type: 'debuff',
          icon: '🔮',
          description: 'Your eyes burn with chronomantic light. Reduces Attack by 5 and Critical Chance by 15%.',
          turnsRemaining: 45,
          color: '#c084fc',
          statModifiers: {
            atk: -5,
            crit: -0.15,
          },
        });

        logs.push(`🔮 [SHRINE]: You touch the swirling purple orb. Deep ancestral knowledge enters your mind! Permanent Intellect increased by +3, and the dungeon layout is fully revealed.`);
        logs.push(`👁️ [CURSE]: The ethereal blast blinds you. Inflicted Cursed Sight (-5 Atk, -15% Crit for 45 turns).`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `👁️ MAP REVEALED`, type: 'heal' },
        });
        window.dispatchEvent(ev);
      } else if (effectType === 'blood_transfusion') {
        nextStats.maxMp += 12;
        nextStats.mp = nextStats.maxMp;
        nextStats.hp = Math.max(1, nextStats.hp - 15);

        logs.push(`🧪 [SHRINE]: You bleed into the Ley-well. Ethereal forces flow into your veins! Permanent Max MP increased by +12 and Mana fully restored.`);
        logs.push(`🩸 [CURSE]: Siphoned -15 HP instantly in blood sacrifice.`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `🧪 MANA RESTORED`, type: 'heal' },
        });
        window.dispatchEvent(ev);
        setTimeout(() => {
          const ev2 = new CustomEvent('spawn-game-effect', {
            detail: { x: prev.playerX, y: prev.playerY, text: `💔 -15 HP`, type: 'dmg' },
          });
          window.dispatchEvent(ev2);
        }, 150);
      } else if (effectType === 'covetous_greed') {
        nextStats.gold += 250;

        nextActiveEffects = nextActiveEffects.filter((e) => e.id !== 'cursed_weight');
        nextActiveEffects.push({
          id: 'cursed_weight',
          name: 'Cursed Weight',
          type: 'debuff',
          icon: '🏺',
          description: 'Your gear feels extremely heavy and worn. Reduces Attack by 2 and Defense by 2.',
          turnsRemaining: 30,
          color: '#facc15',
          statModifiers: {
            atk: -2,
            def: -2,
          },
        });

        logs.push(`🪙 [SHRINE]: You reach into the golden vessel. It overflows with heavy gold coins! Gained +250 Gold instantly.`);
        logs.push(`⚖️ [CURSE]: Your equipment grows leaden. Inflicted Cursed Weight (-2 Strength, -2 Dexterity for 30 turns).`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `🪙 +250 GOLD`, type: 'heal' },
        });
        window.dispatchEvent(ev);
      } else if (effectType === 'reckless_berserker') {
        nextStats.maxHp = Math.max(10, nextStats.maxHp - 20);
        if (nextStats.hp > nextStats.maxHp) nextStats.hp = nextStats.maxHp;

        nextActiveEffects = nextActiveEffects.filter((e) => e.id !== 'permanent_berserker_rage');
        nextActiveEffects.push({
          id: 'permanent_berserker_rage',
          name: 'Berserker Bloodlust',
          type: 'buff',
          icon: '⚔️',
          description: 'A permanent combat blessing. Increases Critical Strike Chance by +15%.',
          turnsRemaining: 999999,
          color: '#fb923c',
          statModifiers: {
            crit: 0.15,
          },
        });

        logs.push(`⚔️ [SHRINE]: You swear the oath of the Berserker. Your eyes redline with battle rage! Permanent Critical Strike Chance increased by +15%.`);
        logs.push(`💀 [CURSE]: Your life essence is consumed. Permanent Max HP decreased by -20.`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `💥 CRIT +15%`, type: 'heal' },
        });
        window.dispatchEvent(ev);
      } else if (effectType === 'chrono_shift') {
        nextStats.dex += 3;
        nextStats.exhaustion = Math.min(100, (nextStats.exhaustion || 0) + 30);

        logs.push(`🌀 [SHRINE]: Ethereal sapphire rings snap around your ankles. Your speed multiplies! Permanent Dexterity increased by +3.`);
        logs.push(`💤 [CURSE]: The temporal distortion drains your energy. Gained +30 physical exhaustion points immediately.`);

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `⚡ +3 DEX`, type: 'heal' },
        });
        window.dispatchEvent(ev);
      }

      nextStats.activeEffects = nextActiveEffects;

      const nextLogs = [...prev.logs];
      logs.forEach((msg) => {
        nextLogs.push({
          id: `log_shrine_${Date.now()}_${Math.random()}`,
          text: msg,
          type: msg.includes('[CURSE]') ? 'danger' : 'info',
          timestamp: new Date().toLocaleTimeString().split(' ')[0],
        });
      });

      return {
        ...prev,
        dungeonProps: nextProps,
        playerStats: nextStats,
        discovered: nextDiscovered,
        logs: nextLogs,
      };
    });
  };

  const handleConsumeLockpick = () => {
    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };
      nextMats['mat_lockpick'] = Math.max(0, (nextMats['mat_lockpick'] || 0) - 1);
      return {
        ...prev,
        inventoryMaterials: nextMats,
      };
    });
  };

  const handleOpenChest = (chestIndex: number, isPerfect: boolean) => {
    playSound('loot');
    const chest = gameState.chests[chestIndex];
    if (!chest) return;

    const goldMult = (window as any).arenaGoldMultiplier || 1.0;
    let calculatedGold = Math.round(chest.gold * goldMult);
    if (isPerfect) {
      calculatedGold += 25;
    }

    addLogMessage(`🎁 You popped open a dusty treasure cache!`, 'loot');
    addLogMessage(`💰 Obtained: ${calculatedGold} Gold!${isPerfect ? ' (⭐ Perfect Lockpicking Bonus +25g)' : ''}`, 'loot');

    setGameState((prev) => {
      const nextMats = { ...prev.inventoryMaterials };
      const nextCats = { ...prev.inventoryCatalysts };

      chest.materials.forEach((mid) => {
        const matItem = BASIC_MATERIALS.find((m) => m.id === mid);
        if (matItem) {
          const uWeight = getMaterialUnitWeight(mid);
          nextMats[mid] = (nextMats[mid] || 0) + 1;
          addLogMessage(`  + Metal: ${matItem.name} (${uWeight} kg)`, 'loot');
        }
      });

      chest.catalysts.forEach((cid) => {
        const catItem = ELEMENTAL_CATALYSTS.find((c) => c.id === cid);
        if (catItem) {
          const uWeight = getMaterialUnitWeight(cid);
          nextCats[cid] = (nextCats[cid] || 0) + 1;
          addLogMessage(`  + Catalyst: ${catItem.name} (${uWeight} kg)`, 'loot');
        }
      });

      if (isPerfect) {
        const randomCat = ELEMENTAL_CATALYSTS[Math.floor(Math.random() * ELEMENTAL_CATALYSTS.length)];
        if (randomCat) {
          nextCats[randomCat.id] = (nextCats[randomCat.id] || 0) + 1;
          addLogMessage(`  ⭐ Perfect Unlock Catalyst Bonus: ${randomCat.name}!`, 'loot');
        }
      }

      const nextChests = [...prev.chests];
      nextChests[chestIndex] = { ...chest, isOpened: true };

      let nextActiveEscapeAlarm = prev.activeEscapeAlarm;
      const nextFactionReputation = prev.factionReputation ? { ...prev.factionReputation } : { syndicate: 0, vanguard: 0, bandits: 0 };
      const nextLogs = [...prev.logs];

      if (chest.id?.startsWith('syndicate_chest_')) {
        if (prev.faction !== 'syndicate') {
          nextActiveEscapeAlarm = 'syndicate';
          const curRep = nextFactionReputation.syndicate ?? 0;
          const nextRep = Math.max(-100, curRep - 20);
          nextFactionReputation.syndicate = nextRep;
          nextLogs.push({
            id: `alarm_${Date.now()}`,
            text: `🚨 [ESCAPE ALARM ACTIVE]: You have raided the Moonshadow Syndicate Vault without alignment! Silas's agents have been alerted and will pursue you across the chunk! Standing decreased by -20. (Standing: ${nextRep})`,
            type: 'danger',
            timestamp: formatGameTime(prev.gameTime).timeStr,
          });
        } else {
          nextLogs.push({
            id: `vault_access_${Date.now()}`,
            text: `⚖️ [FACTION PREROGATIVE]: Silas permits your access to this vault due to your Syndicate Alliance.`,
            type: 'info',
            timestamp: formatGameTime(prev.gameTime).timeStr,
          });
        }
      } else if (chest.id?.startsWith('vanguard_chest_')) {
        if (prev.faction !== 'vanguard') {
          nextActiveEscapeAlarm = 'vanguard';
          const curRep = nextFactionReputation.vanguard ?? 0;
          const nextRep = Math.max(-100, curRep - 20);
          nextFactionReputation.vanguard = nextRep;
          nextLogs.push({
            id: `alarm_${Date.now()}`,
            text: `🚨 [ESCAPE ALARM ACTIVE]: You have raided the Dawn Vanguard Holy Vault without alignment! Captain Valerius's sentries have been alerted and will pursue you across the chunk! Standing decreased by -20. (Standing: ${nextRep})`,
            type: 'danger',
            timestamp: formatGameTime(prev.gameTime).timeStr,
          });
        } else {
          nextLogs.push({
            id: `vault_access_${Date.now()}`,
            text: `⚖️ [FACTION PREROGATIVE]: Valerius permits your access to this vault due to your Vanguard Alliance.`,
            type: 'info',
            timestamp: formatGameTime(prev.gameTime).timeStr,
          });
        }
      } else if (chest.id?.startsWith('bandits_chest_')) {
        if (prev.faction !== 'bandits') {
          nextActiveEscapeAlarm = 'bandits';
          const curRep = nextFactionReputation.bandits ?? 0;
          const nextRep = Math.max(-100, curRep - 20);
          nextFactionReputation.bandits = nextRep;
          nextLogs.push({
            id: `alarm_${Date.now()}`,
            text: `🚨 [ESCAPE ALARM ACTIVE]: You have raided the Rust-Raider Bandits Cache without alignment! Outlaw cutthroats have been alerted and will pursue you! Standing decreased by -20. (Standing: ${nextRep})`,
            type: 'danger',
            timestamp: formatGameTime(prev.gameTime).timeStr,
          });
        } else {
          nextLogs.push({
            id: `vault_access_${Date.now()}`,
            text: `⚖️ [FACTION PREROGATIVE]: The Bandit King permits your access to this cache due to your Raider Alliance.`,
            type: 'info',
            timestamp: formatGameTime(prev.gameTime).timeStr,
          });
        }
      }

      if (chest.id?.startsWith('tribute_chest_')) {
        nextLogs.push({
          id: `tribute_opened_${Date.now()}`,
          text: `👑 [TRIBUTE CLAIMED]: You have unlocked the Faction Tribute Chest! Pristine alchemical catalysts, rare metal alloys, and tribute gold are yours!`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      }

      let nextHasTransmuter = prev.hasTransmuter;
      if (!prev.hasTransmuter && Math.random() < 0.12) {
        nextHasTransmuter = true;
        nextLogs.push({
          id: `trans_found_${Date.now()}`,
          text: `🧪 [LUCKY FIND]: You discover a Portable Alchemical Transmuter (Wild Magic Flask) stashed in a secret compartment of the chest! The Transmute panel has been unlocked in your backpack!`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      }

      const nextEquip = [...prev.equipmentInventory];
      const chestLck = getEffectiveAttribute(prev, 'lck');
      const chestLuckBonus = Math.max(0, chestLck - 10) * (gameConfig.worldRates?.equipmentDropRateBonusPerLuck ?? 0.03);
      const finalChestGearChance = Math.min(0.9, 0.3 + chestLuckBonus);
      if (Math.random() < finalChestGearChance) {
        const gear = generateRandomLootGear(false, false, 'Chest Loot');
        nextEquip.push(gear);
        if (gear.subType === 'Amulet') {
          nextLogs.push({
            id: `amulet_found_${Date.now()}`,
            text: `💎 [RARE LOOT DETECTED]: You found a rare necklace inside the treasure cache! "${gear.name}" (${Object.entries(gear.statBonuses || {}).map(([s, v]) => `+${v} ${s.toUpperCase()}`).join(', ')})`,
            type: 'loot',
            timestamp: formatGameTime(prev.gameTime).timeStr,
          });
        } else {
          nextLogs.push({
            id: `gear_found_${Date.now()}`,
            text: `🛡️ [EQUIPMENT ACQUIRED]: You found a piece of gear inside the treasure cache: "${gear.name}"!`,
            type: 'loot',
            timestamp: formatGameTime(prev.gameTime).timeStr,
          });
        }
      }

      if (Math.random() < 0.05) {
        const recallScroll = {
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
          maxDurability: 100,
        };
        nextEquip.push(recallScroll);
        nextLogs.push({
          id: `recall_scroll_chest_${Date.now()}`,
          text: `📜 [RARE LOOT DETECTED]: You found an incredibly rare Scroll of Recall inside the treasure cache!`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      }

      if (Math.random() < 0.1) {
        nextMats['mat_skeleton_key'] = (nextMats['mat_skeleton_key'] || 0) + 1;
        nextLogs.push({
          id: `skeleton_key_chest_${Date.now()}`,
          text: `💀 [RARE LOOT DETECTED]: You found an incredibly rare Grim Skeleton Key inside the chest! This key instantly unlocks any chest.`,
          type: 'loot',
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      }

      return {
        ...prev,
        chests: nextChests,
        equipmentInventory: nextEquip,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        activeEscapeAlarm: nextActiveEscapeAlarm,
        factionReputation: nextFactionReputation,
        hasTransmuter: nextHasTransmuter,
        logs: nextLogs,
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold + calculatedGold,
          xp: prev.playerStats.xp + 40,
        },
      };
    });

    executeEnemiesTurn(gameState.playerX, gameState.playerY);
  };

  return {
    handleInteractWithDungeonShrine,
    handleConsumeLockpick,
    handleOpenChest,
  };
}
