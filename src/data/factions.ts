/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import factionsJson from './factions.json';
import type { FactionDefinition, FactionId } from '../factions/types';

export const FACTIONS_DATABASE: FactionDefinition[] = factionsJson as FactionDefinition[];

export const FACTIONS_MAP: Record<string, FactionDefinition> = FACTIONS_DATABASE.reduce(
  (acc, faction) => {
    acc[faction.id] = faction;
    return acc;
  },
  {} as Record<string, FactionDefinition>
);

export function getAllFactions(): FactionDefinition[] {
  return FACTIONS_DATABASE;
}

export function getFactionDefinition(id: FactionId): FactionDefinition | undefined {
  if (!id) return undefined;
  // Normalized lookup
  const normalized = normalizeFactionId(id);
  return FACTIONS_MAP[normalized] || FACTIONS_MAP[id];
}

/**
 * Normalizes legacy or shorthand faction strings to canonical FactionId
 */
export function normalizeFactionId(id?: string): FactionId {
  if (!id) return 'unaligned';
  const lower = id.toLowerCase().trim();
  switch (lower) {
    case 'vanguard':
    case 'iron_vanguard':
      return 'iron_vanguard';
    case 'syndicate':
    case 'shadow_syndicate':
      return 'shadow_syndicate';
    case 'bandits':
    case 'outlaw':
    case 'outlaws':
    case 'outlaw_bandits':
      return 'outlaw_bandits';
    case 'orc':
    case 'orcs':
    case 'orc_clans':
    case 'goblin':
    case 'goblins':
      return 'orc_clans';
    case 'undead':
    case 'scourge':
    case 'undead_scourge':
    case 'skeletons':
      return 'undead_scourge';
    case 'guard':
    case 'guards':
    case 'town_guard':
    case 'townguard':
      return 'town_guard';
    case 'wildlife':
    case 'beast':
    case 'beasts':
    case 'animal':
    case 'animals':
    case 'wild_beasts':
      return 'wild_beasts';
    case 'construct':
    case 'constructs':
    case 'golem':
    case 'ancient_guardians':
      return 'ancient_guardians';
    case 'neutral':
    case 'unaligned':
      return 'unaligned';
    default:
      return lower;
  }
}
