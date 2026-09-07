/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FactionId =
  | 'iron_vanguard'
  | 'shadow_syndicate'
  | 'outlaw_bandits'
  | 'orc_clans'
  | 'undead_scourge'
  | 'town_guard'
  | 'wild_beasts'
  | 'ancient_guardians'
  | 'unaligned'
  // Legacy & Alias IDs
  | 'vanguard'
  | 'syndicate'
  | 'bandits'
  | 'outlaw'
  | 'goblin'
  | string;

export type FactionDisposition =
  | 'allied'     // +70 to +100: Protects, assists in combat, shares buffs
  | 'friendly'   // +30 to +69: Will not attack, offers trade discounts
  | 'neutral'    // -10 to +29: Ignores unless provoked
  | 'unfriendly' // -29 to -11: Suspicious, higher prices, quick to anger
  | 'hostile'    // -69 to -30: Attacks on sight
  | 'nemesis';   // -100 to -70: Relentless pursuit, priority target

export type FactionAlignment =
  | 'lawful_good'
  | 'lawful_neutral'
  | 'neutral'
  | 'chaotic_neutral'
  | 'chaotic_evil'
  | 'lawful_evil'
  | 'unaligned';

export type FactionRank =
  | 'grunt'
  | 'scout'
  | 'soldier'
  | 'captain'
  | 'warlord'
  | 'shaman'
  | 'assassin'
  | 'champion'
  | 'leader';

export interface FactionBountyLoot {
  currency: string;
  rate: number;
  items?: string[];
}

export interface FactionDefinition {
  id: FactionId;
  name: string;
  shortName: string;
  description: string;
  bannerEmoji: string;
  primaryColor: string;
  secondaryColor: string;
  alignment: FactionAlignment;
  headquarters?: string;
  motto?: string;
  preferredBiomes: string[];
  enemyTypes: string[];
  defaultRelationships: Record<string, FactionDisposition>;
  tactics: string[];
  bountyLoot: FactionBountyLoot;
  lore: string;
}

export type FactionStandingTier =
  | 'Hated'       // -100 to -60
  | 'Unfriendly'  // -59 to -20
  | 'Neutral'     // -19 to +19
  | 'Friendly'    // +20 to +59
  | 'Honored'     // +60 to +89
  | 'Revered';    // +90 to +100

export interface FactionStandingInfo {
  factionId: FactionId;
  name: string;
  score: number; // -100 to 100
  tier: FactionStandingTier;
  disposition: FactionDisposition;
  perks: string[];
  unlockedShops: boolean;
  unlockedSafehouse: boolean;
}

export interface EntityFactionTag {
  factionId: FactionId;
  factionRank?: FactionRank;
  isLeader?: boolean;
}

export interface InterFactionCombatEvent {
  attackerId: string;
  attackerName: string;
  attackerFaction: FactionId;
  targetId: string;
  targetName: string;
  targetFaction: FactionId;
  damage: number;
  isCrit: boolean;
  isKill: boolean;
  x: number;
  y: number;
}
