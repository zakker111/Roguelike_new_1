/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FactionId } from '../factions/types';
export type { FactionId };

export type OutpostStatus = 'peace' | 'contested' | 'liberated';

export interface OutpostQuartermasterItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material' | 'catalyst';
  costGold: number;
  icon: string;
  description: string;
  factionExclusive?: FactionId;
  stock: number;
  effectDescription?: string;
}

export interface OutpostQuartermasterState {
  npcId: string;
  name: string;
  factionId: FactionId;
  items: OutpostQuartermasterItem[];
  restCostGold: number;
  restAvailable: boolean;
  bountyClaimAvailable: boolean;
  bountyRewardGold: number;
  dialogueGreeting: string;
}

export interface OutpostSiegeState {
  isUnderSiege: boolean;
  attacker: FactionId;
  defender: FactionId;
  turnsRemaining: number;
  maxTurns: number;
  bountyGold: number;
  attackerSquadCount: number;
  defenderSquadCount: number;
  playerAssistedDefender: boolean;
  playerAssistedAttacker: boolean;
  siegeBannerX: number;
  siegeBannerY: number;
  lastTurnUpdated?: number;
}

export interface OutpostTerritoryState {
  id: string;
  name: string;
  chunkX: number;
  chunkY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  controller: FactionId;
  status: OutpostStatus;
  defenseTier: 1 | 2 | 3;
  siegeState?: OutpostSiegeState;
  quartermaster?: OutpostQuartermasterState;
  bountyPurse: number;
  lastEventTurn: number;
  taxGoldAccumulated: number;
  conquestCount?: number;
}

export interface OutpostSiegeEventPayload {
  outpostId: string;
  outpostName: string;
  chunkX: number;
  chunkY: number;
  attacker: FactionId;
  defender: FactionId;
  bountyGold: number;
}

export interface OutpostLiberatedEventPayload {
  outpostId: string;
  outpostName: string;
  chunkX: number;
  chunkY: number;
  victor: FactionId;
  playerAssisted: boolean;
  bountyAwarded: number;
  reputationGain: number;
}

export interface FactionAssistEventPayload {
  factionId: FactionId;
  allyName: string;
  reputationChange: number;
  reason: string;
}
