/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quest } from '../../types';

export type QuestCategory =
  | 'bounty'
  | 'beast_hunt'
  | 'relic_delve'
  | 'supply_requisition'
  | 'escort'
  | 'faction_skirmish';

export type QuestDifficulty = 'novice' | 'adept' | 'veteran' | 'master' | 'legendary';

export type QuestStatus = 'available' | 'active' | 'completed' | 'turned_in' | 'failed' | 'expired';

export type QuestObjectiveType =
  | 'kill_enemy'
  | 'gather_material'
  | 'reach_depth'
  | 'explore_chunk'
  | 'defeat_boss'
  | 'donate_gold';

export interface QuestObjective {
  id: string;
  description: string;
  type: QuestObjectiveType;
  targetId: string; // Enemy ID, material ID, depth number
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

export interface QuestReward {
  gold: number;
  xp: number;
  reputation: number;
  materials?: { id: string; count: number }[];
  bonusItemName?: string;
  factionStanding?: { faction: string; points: number };
}

export interface RadiantQuestContract {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  giverName: string;
  giverRole: string;
  townName: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards: QuestReward;
  targetBiome?: string;
  targetChunkX?: number;
  targetChunkY?: number;
  targetDepth?: number;
  turnAccepted?: number;
  timeLimitTurns?: number;
  isRadiant: boolean;
  icon: string;
}

export interface QuestGenerationContext {
  playerLevel: number;
  currentChunkX: number;
  currentChunkY: number;
  townName: string;
  biome?: string;
  faction?: string;
  townReputation?: number;
  currentSeason?: string;
  seed?: number;
}

export interface QuestProgressEvent {
  type: QuestObjectiveType;
  targetId: string;
  amount?: number;
  chunkX?: number;
  chunkY?: number;
  depth?: number;
}

/**
 * Converts a modern RadiantQuestContract to the canonical Quest shape
 * for backwards compatibility with all UI panels and state serializers.
 */
export function contractToLegacyQuest(contract: RadiantQuestContract): Quest {
  const primaryObj = contract.objectives[0];
  const isGather = primaryObj?.type === 'gather_material' || primaryObj?.type === 'donate_gold';

  return {
    id: contract.id,
    townName: contract.townName,
    type: isGather ? 'gather' : 'encounter',
    title: contract.title,
    description: contract.description,
    targetItem: primaryObj ? primaryObj.targetId : undefined,
    targetCount: primaryObj ? primaryObj.targetCount : undefined,
    currentProgress: primaryObj ? primaryObj.currentCount : 0,
    targetChunkX: contract.targetChunkX,
    targetChunkY: contract.targetChunkY,
    rewardGold: contract.rewards.gold,
    rewardXp: contract.rewards.xp,
    status: contract.status as any,
    category: contract.category,
    difficulty: contract.difficulty,
    isRadiant: contract.isRadiant,
  };
}

/**
 * Converts a legacy Quest from quests.json into a structured RadiantQuestContract.
 */
export function legacyQuestToContract(legacy: Quest): RadiantQuestContract {
  const isGather = legacy.type === 'gather';
  const targetId = legacy.targetItem || (legacy.id.includes('pest') ? 'Rat' : 'Brute');
  const targetCount = legacy.targetCount || 3;
  const currentProgress =
    legacy.status === 'completed' || legacy.status === 'turned_in'
      ? targetCount
      : (legacy.currentProgress || 0);

  return {
    id: legacy.id,
    title: legacy.title,
    description: legacy.description,
    category: isGather ? 'supply_requisition' : 'beast_hunt',
    difficulty: legacy.rewardGold > 100 ? 'veteran' : legacy.rewardGold > 45 ? 'adept' : 'novice',
    giverName: legacy.townName ? `${legacy.townName} Elder` : 'Town Magistrate',
    giverRole: 'Magistrate',
    townName: legacy.townName || 'Oakhaven Hamlet',
    status: (legacy.status as QuestStatus) || 'available',
    objectives: [
      {
        id: `obj_${legacy.id}_1`,
        description: isGather
          ? `Deliver ${targetCount}x ${targetId}`
          : `Defeat ${targetCount}x ${targetId}`,
        type: isGather ? 'gather_material' : 'kill_enemy',
        targetId,
        targetCount,
        currentCount: currentProgress,
        completed: legacy.status === 'completed' || legacy.status === 'turned_in' || currentProgress >= targetCount,
      },
    ],
    rewards: {
      gold: legacy.rewardGold,
      xp: legacy.rewardXp || legacy.rewardGold * 2,
      reputation: legacy.rewardGold > 100 ? 25 : 15,
    },
    targetChunkX: legacy.targetChunkX,
    targetChunkY: legacy.targetChunkY,
    isRadiant: false,
    icon: legacy.title.slice(0, 2).trim() || '📜',
  };
}
