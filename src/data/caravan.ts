/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import caravanEventsJson from './caravanEvents.json';
import caravanBossesJson from './caravanBosses.json';

export interface CaravanOption {
  id: string;
  text: string;
  statCheck?: string;
  difficulty?: number;
  costGold?: number;
}

export interface CaravanEventTemplate {
  type: string;
  title: string;
  desc: string;
  options: CaravanOption[];
}

export interface CaravanEventEntry {
  threshold: number;
  template: CaravanEventTemplate;
}

export interface CaravanBossEntry {
  bossName: string;
  title: string;
  desc: string;
  bossAffixes: string[];
  wagonDamagePenalty: number;
  options: CaravanOption[];
}

export const CARAVAN_EVENTS: CaravanEventEntry[] = caravanEventsJson as unknown as CaravanEventEntry[];
export const CARAVAN_BOSSES: CaravanBossEntry[] = caravanBossesJson as unknown as CaravanBossEntry[];

export function getCaravanEventByThreshold(roll: number): CaravanEventEntry | undefined {
  return CARAVAN_EVENTS.find(e => roll <= e.threshold);
}

export function getRandomCaravanBoss(): CaravanBossEntry {
  const idx = Math.floor(Math.random() * CARAVAN_BOSSES.length);
  return CARAVAN_BOSSES[idx];
}
