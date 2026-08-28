import React from 'react';
import { GameState, EnemyState, EnemyType } from '../../types';

interface UseQuestAndGuildHandlersProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export function useQuestAndGuildHandlers({
  gameState,
  setGameState,
}: UseQuestAndGuildHandlersProps) {
  const handleAcceptQuest = (questId: string) => {
    setGameState((prev) => {
      const updatedQuests = prev.quests.map((q) => {
        if (q.id === questId) {
          return { ...q, status: 'active' as const };
        }
        return q;
      });

      const updatedLogs = [
        ...prev.logs,
        {
          id: `q_accept_${Date.now()}`,
          text: `📜 QUEST ACCEPTED: Accepted "${prev.quests.find((q) => q.id === questId)?.title}"! Check goals at the local Quest Board or complete it with the quest giver.`,
          type: 'info' as const,
          timestamp: 'QUEST',
        },
      ];

      let nextEnemies = [...prev.enemies];
      if (questId === 'q_bandit_raid') {
        const pX = prev.playerX;
        const pY = prev.playerY;
        const offsets = [
          { dx: -4, dy: -4 },
          { dx: 4, dy: -3 },
          { dx: -5, dy: 4 },
        ];

        offsets.forEach((off, idx) => {
          const ex = pX + off.dx;
          const ey = pY + off.dy;
          nextEnemies.push({
            id: `quest_bandit_${idx}_${Date.now()}`,
            x: ex,
            y: ey,
            type: 'Brute' as any,
            name: `Bandit Raider #${idx + 1}`,
            hp: 25,
            maxHp: 25,
            atk: 5,
            def: 1,
            range: 1,
            speed: 1,
            color: '#ef4444',
            char: '⚔',
            state: EnemyState.Chasing,
            isElite: false,
            patrolPath: [],
            patrolIndex: 0,
            debuffs: [],
          });
        });

        updatedLogs.push({
          id: `q_spawn_${Date.now()}`,
          text: `⚠️ WARN: 3 hostile Bandit Raiders have appeared in the village outskirts! Defeat them!`,
          type: 'danger' as const,
          timestamp: 'AMBUSH',
        });
      } else if (questId === 'q_pest_control') {
        const pX = prev.playerX;
        const pY = prev.playerY;
        const offsets = [
          { dx: -3, dy: -2 },
          { dx: 3, dy: -2 },
          { dx: -2, dy: 3 },
        ];

        offsets.forEach((off, idx) => {
          const ex = pX + off.dx;
          const ey = pY + off.dy;
          nextEnemies.push({
            id: `quest_rat_${idx}_${Date.now()}`,
            x: ex,
            y: ey,
            type: EnemyType.Rat,
            name: `Quest Sewer Rat #${idx + 1}`,
            hp: 10,
            maxHp: 10,
            atk: 2,
            def: 0,
            range: 1,
            speed: 0.8,
            color: '#808080',
            char: '🐀',
            state: EnemyState.Chasing,
            isElite: false,
            patrolPath: [],
            patrolIndex: 0,
            debuffs: [],
          } as any);
        });

        updatedLogs.push({
          id: `q_pest_spawn_${Date.now()}`,
          text: `⚠️ WARN: 3 weak Quest Sewer Rats have scurried into your immediate vicinity! Click on them to strike them down!`,
          type: 'danger' as const,
          timestamp: 'AMBUSH',
        });
      }

      return {
        ...prev,
        quests: updatedQuests,
        enemies: nextEnemies,
        logs: updatedLogs,
      };
    });
  };

  const handleTurnInQuest = (questId: string) => {
    const quest = gameState.quests.find((q) => q.id === questId);
    if (!quest) return;

    if (quest.id === 'q_outlaw_pardon') {
      const currentGold = gameState.playerStats.gold;
      const cost = quest.targetCount || 200;
      if (currentGold < cost) {
        setGameState((prev) => ({
          ...prev,
          logs: [
            ...prev.logs,
            {
              id: `q_err_${Date.now()}`,
              text: `❌ ERROR: Insufficient Gold! You need ${cost} Gold to donate to the poorbox.`,
              type: 'system' as const,
              timestamp: 'QUEST',
            },
          ],
        }));
        return;
      }

      setGameState((prev) => {
        const updatedQuests = prev.quests.map((q) => {
          if (q.id === questId) return { ...q, status: 'turned_in' as const };
          return q;
        });

        const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const nextRep = Math.min(100, prevRep + 35);

        const nextStats = {
          ...prev.playerStats,
          gold: Math.max(0, prev.playerStats.gold - cost),
        };

        const nextLogs = [
          ...prev.logs,
          {
            id: `q_complete_${Date.now()}`,
            text: `⚖️ PARDON GRANTED: You donated ${cost} Gold to the Church. Your crimes are pardoned! (+35 Town Reputation)`,
            type: 'loot' as const,
            timestamp: 'QUEST',
          },
        ];

        return {
          ...prev,
          quests: updatedQuests,
          playerStats: nextStats,
          townReputation: nextRep,
          logs: nextLogs,
        };
      });
      return;
    }

    if (quest.type === 'gather') {
      const itemKey = quest.targetItem || 'mat_iron';
      const userCount = gameState.inventoryMaterials[itemKey] || 0;
      const needed = quest.targetCount || 5;

      if (userCount < needed) {
        setGameState((prev) => ({
          ...prev,
          logs: [
            ...prev.logs,
            {
              id: `q_err_${Date.now()}`,
              text: `❌ ERROR: Insufficient materials! You need ${needed}x items, you only carry ${userCount} in your bag.`,
              type: 'system' as const,
              timestamp: 'QUEST',
            },
          ],
        }));
        return;
      }

      setGameState((prev) => {
        const nextMats = { ...prev.inventoryMaterials };
        nextMats[itemKey] = Math.max(0, nextMats[itemKey] - needed);

        const updatedQuests = prev.quests.map((q) => {
          if (q.id === questId) return { ...q, status: 'turned_in' as const };
          return q;
        });

        const repReward =
          questId === 'q_iron_gather' ? 15 : questId === 'q_apothecary_supply' ? 12 : questId === 'q_mithril_heist' ? 25 : 10;
        const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const nextRep = Math.min(100, prevRep + repReward);

        const nextStats = {
          ...prev.playerStats,
          gold: prev.playerStats.gold + quest.rewardGold,
        };

        const nextLogs = [
          ...prev.logs,
          {
            id: `q_complete_${Date.now()}`,
            text: `🎉 QUEST COMPLETED: Delivered materials! You received +${quest.rewardGold} Gold and +${repReward} Town Reputation!`,
            type: 'loot' as const,
            timestamp: 'QUEST',
          },
        ];

        return {
          ...prev,
          inventoryMaterials: nextMats,
          quests: updatedQuests,
          playerStats: nextStats,
          townReputation: nextRep,
          logs: nextLogs,
        };
      });
    } else if (quest.type === 'encounter') {
      const isPestQuest = quest.id === 'q_pest_control';
      const searchName = isPestQuest ? 'Quest Sewer Rat' : 'Bandit Raider';
      const activeTargets = gameState.enemies.filter((e) => e.name.includes(searchName));

      if (activeTargets.length > 0) {
        setGameState((prev) => ({
          ...prev,
          logs: [
            ...prev.logs,
            {
              id: `q_err_${Date.now()}`,
              text: isPestQuest
                ? `❌ ERROR: Quest Sewer Rats are still active! You must defeat all 3 rats in the town map.`
                : `❌ ERROR: Bandit Raiders are still active! You must defeat all 3 raiders in the town map.`,
              type: 'system' as const,
              timestamp: 'QUEST',
            },
          ],
        }));
        return;
      }

      setGameState((prev) => {
        const updatedQuests = prev.quests.map((q) => {
          if (q.id === questId) return { ...q, status: 'turned_in' as const };
          return q;
        });

        const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const repReward = isPestQuest ? 10 : 25;
        const nextRep = Math.min(100, prevRep + repReward);

        const nextStats = {
          ...prev.playerStats,
          gold: prev.playerStats.gold + quest.rewardGold,
        };

        const nextLogs = [
          ...prev.logs,
          {
            id: `q_complete_${Date.now()}`,
            text: isPestQuest
              ? `🎉 QUEST COMPLETED: Outskirts cleaned of pests! Grom rewards you with +${quest.rewardGold} Gold and +${repReward} Town Reputation!`
              : `🎉 QUEST COMPLETED: Town secured! Grom rewards you with +${quest.rewardGold} Gold and +${repReward} Town Reputation!`,
            type: 'loot' as const,
            timestamp: 'QUEST',
          },
        ];

        return {
          ...prev,
          quests: updatedQuests,
          playerStats: nextStats,
          townReputation: nextRep,
          logs: nextLogs,
        };
      });
    }
  };

  return {
    handleAcceptQuest,
    handleTurnInQuest,
  };
}
