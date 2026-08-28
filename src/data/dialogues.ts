/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dialoguesJson from './dialogues.json';
import fleeQuotesJson from './fleeQuotes.json';

export type NpcDialogueCategory = 
  | 'merchant'
  | 'blacksmith'
  | 'apothecary'
  | 'tavern_master'
  | 'guard'
  | 'scholar'
  | 'harbor_master'
  | 'drunk'
  | 'drunk_insults'
  | 'companion_hire'
  | 'companion_barks'
  | 'cat_meows'
  | 'npc_wander_barks'
  | 'innkeeper_welcome'
  | 'quest_giver_intro'
  | 'sanctuary_keeper';

export const DIALOGUES_CATALOG: Record<string, string[]> = dialoguesJson.dialogues as Record<string, string[]>;
export const FLEE_QUOTES_DATA = fleeQuotesJson;

export function getDialoguesForCategory(category: NpcDialogueCategory): string[] {
  return DIALOGUES_CATALOG[category] || [];
}

export function getRandomDialogue(category: NpcDialogueCategory): string {
  const pool = getDialoguesForCategory(category);
  if (!pool || pool.length === 0) return '...';
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

export function getRandomFleeQuote(): string {
  const general = fleeQuotesJson.general || [];
  if (!general || general.length === 0) return 'I must retreat!';
  const idx = Math.floor(Math.random() * general.length);
  return general[idx];
}
