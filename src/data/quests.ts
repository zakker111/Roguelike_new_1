/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import questsJson from './quests.json';

export interface Quest {
  id: string;
  townName: string;
  type: 'encounter' | 'gather';
  title: string;
  description: string;
  rewardGold: number;
  status: 'available' | 'active' | 'completed';
  targetItem?: string;
  targetCount?: number;
  currentCount?: number;
}

export const QUESTS_CATALOG: Quest[] = questsJson as unknown as Quest[];

export function getQuestById(id: string): Quest | undefined {
  return QUESTS_CATALOG.find(q => q.id === id);
}

export function getQuestsByTown(townName: string): Quest[] {
  return QUESTS_CATALOG.filter(q => q.townName.toLowerCase() === townName.toLowerCase());
}

export function getAvailableQuests(): Quest[] {
  return QUESTS_CATALOG.filter(q => q.status === 'available');
}
