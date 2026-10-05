/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { GameState, NPC, Enemy, EnemyState } from '../../types';
import { formatGameTime } from '../../utils/overworld';
import { DrunkNpcEffects } from './types';

export interface UseTravelerInteractionsParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary' | 'chronicles'>>;
  activeTravelerNpc: NPC | null;
  setActiveTravelerNpc: (npc: NPC | null) => void;
  executeEnemiesTurn: (px: number, py: number) => void;
}

export function useTravelerInteractions({
  gameState,
  setGameState,
  addLogMessage,
  playSound,
  setActiveTab,
  activeTravelerNpc,
  setActiveTravelerNpc,
  executeEnemiesTurn,
}: UseTravelerInteractionsParams) {
  const handleDrunkNpcEffects = useCallback((effects: DrunkNpcEffects) => {
    addLogMessage(effects.logText, 'loot');

    if (effects.spawnEffectText) {
      const ev = new CustomEvent('spawn-game-effect', {
        detail: {
          x: gameState.playerX,
          y: gameState.playerY,
          text: effects.spawnEffectText,
          type: effects.spawnEffectType || 'heal',
        },
      });
      window.dispatchEvent(ev);
    }

    setGameState((prev) => {
      const nextStats = { ...prev.playerStats };
      nextStats.gold = Math.max(0, nextStats.gold + effects.goldChange);
      if (effects.hpChange) {
        nextStats.hp = Math.min(nextStats.maxHp, Math.max(1, nextStats.hp + effects.hpChange));
      }
      if (effects.mpChange) {
        nextStats.mp = Math.min(nextStats.maxMp, Math.max(0, nextStats.mp + effects.mpChange));
      }

      const nextMats = { ...prev.inventoryMaterials };
      if (effects.addMaterials) {
        Object.entries(effects.addMaterials).forEach(([matId, qty]) => {
          nextMats[matId] = (nextMats[matId] || 0) + qty;
        });
      }

      const nextCats = { ...prev.inventoryCatalysts };
      if (effects.addCatalysts) {
        Object.entries(effects.addCatalysts).forEach(([catId, qty]) => {
          nextCats[catId] = (nextCats[catId] || 0) + qty;
        });
      }

      const nextFoodBuff = effects.buff
        ? {
            name: effects.buff.name,
            description: `Culinary & brewing blessing (+${effects.buff.atkBonus || effects.buff.defBonus || effects.buff.critBonus || 0})`,
            atkBonus: effects.buff.atkBonus || 0,
            defBonus: effects.buff.defBonus || 0,
            critBonus: effects.buff.critBonus || 0,
            speedBonus: 0,
            turnsRemaining: effects.buff.turnsRemaining,
          }
        : prev.activeFoodBuff;

      return {
        ...prev,
        playerStats: nextStats,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        activeFoodBuff: nextFoodBuff,
      };
    });
  }, [gameState.playerX, gameState.playerY, addLogMessage, setGameState]);

  const handleTravelerAttack = useCallback((witnessed: boolean) => {
    if (!activeTravelerNpc) return;
    const traveler = activeTravelerNpc;
    setActiveTravelerNpc(null);

    playSound('slash');

    setGameState((prev) => {
      let hp = 50;
      let maxHp = 50;
      let atk = 7;
      let def = 2;
      let range = 1;
      const color = traveler.color;
      const char = traveler.char;

      if (traveler.role === 'traveler_herbalist') {
        hp = 45;
        maxHp = 45;
        atk = 5;
        def = 1;
        range = 1;
      } else if (traveler.role === 'traveler_hunter') {
        hp = 60;
        maxHp = 60;
        atk = 9;
        def = 3;
        range = 4;
      } else if (traveler.role === 'traveler_pilgrim') {
        hp = 50;
        maxHp = 50;
        atk = 7;
        def = 2;
        range = 1;
      }

      const newEnemy: Enemy = {
        id: `enemy_traveler_${Date.now()}`,
        x: traveler.x,
        y: traveler.y,
        type: 'Goblin',
        name: traveler.name.split(' (')[0],
        hp,
        maxHp,
        atk,
        def,
        range,
        speed: 1,
        color,
        char,
        state: EnemyState.Chasing,
        isElite: false,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: [],
      };

      const updatedNpcs = prev.npcs.filter((n) => n.id !== traveler.id);
      const currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      let nextRep = currentRep;
      const nextLogs = [...prev.logs];

      let questIdToFail = '';
      if (traveler.role === 'traveler_herbalist') questIdToFail = 'q_traveler_herbalist_mushrooms';
      else if (traveler.role === 'traveler_hunter') questIdToFail = 'q_traveler_hunter_pelts';
      else if (traveler.role === 'traveler_pilgrim') questIdToFail = 'q_traveler_pilgrim_relic';

      const updatedQuests = prev.quests.map((q) => {
        if (q.id === questIdToFail && (q.status === 'active' || q.status === 'available')) {
          return { ...q, status: 'failed' as const };
        }
        return q;
      });

      const associatedQuest = prev.quests.find((q) => q.id === questIdToFail);
      if (associatedQuest && (associatedQuest.status === 'active' || associatedQuest.status === 'available')) {
        nextLogs.push({
          id: `quest_failed_${Date.now()}`,
          text: `❌ QUEST FAILED: "${associatedQuest.title}" has failed because you chose to assault the quest giver!`,
          type: 'danger' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      }

      if (witnessed) {
        nextRep = Math.max(0, currentRep - 35);
        nextLogs.push({
          id: `unlawful_traveler_${Date.now()}`,
          text: `⚖️ [WITNESSED CRIME]: You assaulted ${newEnemy.name} in broad daylight! Nearby witnesses reported your crime to the authorities! Your reputation with Sunder settlements plummeted (-35 Town Rep)!`,
          type: 'danger' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      } else {
        nextLogs.push({
          id: `stealth_traveler_${Date.now()}`,
          text: `🤫 [UNWITNESSED ASSAULT]: You assault ${newEnemy.name} in absolute silence. Sunder's cold mountain winds swallow their cries... No witnesses are around to report your crime.`,
          type: 'info' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr,
        });
      }

      return {
        ...prev,
        npcs: updatedNpcs,
        enemies: [...prev.enemies, newEnemy],
        townReputation: nextRep,
        logs: nextLogs,
        quests: updatedQuests,
      };
    });

    setTimeout(() => {
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
    }, 100);
  }, [activeTravelerNpc, gameState.playerX, gameState.playerY, setActiveTravelerNpc, playSound, setGameState, executeEnemiesTurn]);

  const handleTravelerTrade = useCallback(() => {
    if (!activeTravelerNpc) return;
    const traveler = activeTravelerNpc;

    setGameState((prev) => ({
      ...prev,
      activeTradeNpcId: traveler.id,
    }));
    setActiveTab('market');
    addLogMessage(`🛒 Trading store opened with ${traveler.name}! Buy equipment or sell materials and excess gear.`, 'craft');
  }, [activeTravelerNpc, setGameState, setActiveTab, addLogMessage]);

  return {
    handleDrunkNpcEffects,
    handleTravelerAttack,
    handleTravelerTrade,
  };
}
