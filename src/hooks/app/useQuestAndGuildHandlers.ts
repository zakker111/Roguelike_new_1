import React from 'react';
import { GameState, EnemyState, EnemyType } from '../../types';
import { QuestEngine } from '../../engine/quests';
import { applyPlayerXpAndLevelUps } from '../../utils/levelUp';
import { playSound } from '../../utils/audio';

interface UseQuestAndGuildHandlersProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export function useQuestAndGuildHandlers({
  gameState,
  setGameState,
}: UseQuestAndGuildHandlersProps) {
  const questEngine = QuestEngine.getInstance();

  const handleAcceptQuest = (questId: string) => {
    setGameState((prev) => {
      const targetQuest = prev.quests.find((q) => q.id === questId);
      if (!targetQuest || targetQuest.status !== 'available') {
        return prev;
      }
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
          text: `📜 QUEST ACCEPTED: Accepted "${targetQuest?.title || questId}"! Check goals at the local Quest Board or complete it with the quest giver.`,
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

    // Validate turn in with QuestEngine
    const validation = questEngine.canTurnIn(
      quest,
      gameState.inventoryMaterials,
      gameState.playerStats.gold,
      gameState.enemies
    );

    if (!validation.canTurnIn) {
      setGameState((prev) => ({
        ...prev,
        logs: [
          ...prev.logs,
          {
            id: `q_err_${Date.now()}`,
            text: `❌ ERROR: ${validation.reason || 'Quest objectives not yet completed.'}`,
            type: 'system' as const,
            timestamp: 'QUEST',
          },
        ],
      }));
      return;
    }

    // Resolve rewards with QuestEngine
    const rewards = questEngine.claimRewards(quest);

    setGameState((prev) => {
      // Deduct materials or gold
      let nextMats = { ...prev.inventoryMaterials };
      let nextGold = prev.playerStats.gold;

      if (rewards.deductedItemKey === 'gold' && rewards.deductedItemCount) {
        nextGold = Math.max(0, nextGold - rewards.deductedItemCount);
      } else if (rewards.deductedItemKey && rewards.deductedItemCount) {
        nextMats[rewards.deductedItemKey] = Math.max(
          0,
          (nextMats[rewards.deductedItemKey] || 0) - rewards.deductedItemCount
        );
      }

      // Add reward gold
      nextGold += rewards.goldGained;

      // Update quests status
      let updatedQuests = prev.quests.map((q) => {
        if (q.id === questId) return { ...q, status: 'turned_in' as const };
        return q;
      });

      // Replenish town board if available quests drop low
      const context = {
        playerLevel: prev.playerStats.level || 1,
        currentChunkX: prev.currentChunkX,
        currentChunkY: prev.currentChunkY,
        townName: 'Oakhaven Hamlet',
        townReputation: prev.townReputation ?? 100,
      };
      updatedQuests = questEngine.replenishTownBoard(updatedQuests, context, 4);

      const prevRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      const nextRep = Math.min(100, prevRep + rewards.repGained);

      const { nextStats: leveledStats, levelsGained, levelUpLogs } = applyPlayerXpAndLevelUps(
        { ...prev.playerStats, gold: nextGold },
        rewards.xpGained
      );

      if (levelsGained > 0) {
        setTimeout(() => playSound('levelUp'), 120);
      } else {
        setTimeout(() => playSound('loot'), 50);
      }

      const nextLogs = [
        ...prev.logs,
        {
          id: `q_complete_${Date.now()}`,
          text: rewards.completionLog,
          type: 'loot' as const,
          timestamp: 'QUEST',
        },
        ...levelUpLogs.map((msg, idx) => ({
          id: `q_lvl_${Date.now()}_${idx}`,
          text: msg,
          type: 'craft' as const,
          timestamp: 'LEVEL UP',
        })),
      ];

      return {
        ...prev,
        inventoryMaterials: nextMats,
        quests: updatedQuests,
        playerStats: leveledStats,
        townReputation: nextRep,
        logs: nextLogs,
      };
    });
  };

  return {
    handleAcceptQuest,
    handleTurnInQuest,
  };
}
