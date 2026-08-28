/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import storyEventsJson from './storyEvents.json';

export interface ChaosSurgeEntry {
  roll: number;
  effName: string;
  effDesc: string;
  effType: string;
  logText: string;
  spawnText: string;
  flavorPool: string[];
}

export interface StoryEncounterEntry {
  id: string;
  name: string;
  description: string;
  dangerLevel?: number;
  flavorPool: string[];
}

export const CHAOS_SURGES: ChaosSurgeEntry[] = storyEventsJson.chaosSurges as ChaosSurgeEntry[];
export const STORY_ENCOUNTERS: StoryEncounterEntry[] = storyEventsJson.encounters as StoryEncounterEntry[];
export const STORY_EVENTS_DATA = storyEventsJson;

export function getChaosSurgeByRoll(roll: number): ChaosSurgeEntry | undefined {
  return CHAOS_SURGES.find(s => s.roll === roll);
}

export function getStoryEncounterById(id: string): StoryEncounterEntry | undefined {
  return STORY_ENCOUNTERS.find(e => e.id === id);
}
