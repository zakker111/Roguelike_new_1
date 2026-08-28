import { Dispatch, SetStateAction, useCallback } from 'react';
import { GameState, Quest } from '../types';

export interface UseQuestsAndGuildParams {
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLog: (msg: string) => void;
  playSound: (soundId: string) => void;
}

export function useQuestsAndGuild({ setGameState, addLog, playSound }: UseQuestsAndGuildParams) {
  const acceptGuildQuest = useCallback((quest: Quest) => {
    setGameState((prev) => {
      const activeQuests = prev.quests || [];
      if (activeQuests.some((q) => q.id === quest.id)) {
        addLog(`📜 Quest "${quest.title}" is already accepted.`);
        return prev;
      }

      addLog(`⚔️ Guild Contract Accepted: "${quest.title}". ${quest.description}`);
      playSound('quest_complete');

      return {
        ...prev,
        quests: [...activeQuests, { ...quest, status: 'active' }],
      };
    });
  }, [setGameState, addLog, playSound]);

  const claimQuestReward = useCallback((questId: string) => {
    setGameState((prev) => {
      const activeQuests = prev.quests || [];
      const quest = activeQuests.find((q) => q.id === questId);
      if (!quest || quest.status !== 'completed') return prev;

      addLog(`🏆 Quest Complete! "${quest.title}". Claimed +${quest.rewardGold}g and +${quest.rewardXp} XP.`);
      playSound('level_up');

      const remainingQuests = activeQuests.filter((q) => q.id !== questId);
      const nextXp = (prev.playerStats?.xp ?? 0) + quest.rewardXp;
      const nextGold = (prev.playerStats?.gold ?? 0) + quest.rewardGold;

      return {
        ...prev,
        quests: remainingQuests,
        playerStats: {
          ...prev.playerStats,
          gold: nextGold,
          xp: nextXp,
        },
      };
    });
  }, [setGameState, addLog, playSound]);

  return {
    acceptGuildQuest,
    claimQuestReward,
  };
}


