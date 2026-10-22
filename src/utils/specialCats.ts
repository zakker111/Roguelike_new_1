/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Follower, GameState, GameLogMessage } from '../types';

export const SPECIAL_CAT_NAMES = ['Jekku', 'Pulla', 'Alli', 'Leevi'] as const;
export type SpecialCatName = typeof SPECIAL_CAT_NAMES[number];

export interface SpecialCatInfo {
  name: SpecialCatName;
  title: string;
  personality: string;
  temperament: string;
  char: string;
  color: string;
  hp: number;
  atk: number;
  def: number;
  specialPerk: string;
  quote: string;
}

export const SPECIAL_CATS_DATA: Record<SpecialCatName, SpecialCatInfo> = {
  Jekku: {
    name: 'Jekku',
    title: 'The Playful Orange Trickster',
    personality: 'Playful, nimble, and always looking for adventure',
    temperament: 'Mischievous & Energetic',
    char: '🐈',
    color: '#fb923c',
    hp: 15,
    atk: 3,
    def: 0,
    specialPerk: 'High Agility & Dodging: Quick strikes and playful misdirection',
    quote: "*Mew!* I am Jekku! Don't let those goblins pull my tail — I'll distract them while you strike!"
  },
  Pulla: {
    name: 'Pulla',
    title: 'The True Loyal Companion',
    personality: 'Warm, golden, loyal, and cuddly protector',
    temperament: 'Warm, Trusting & Obedient',
    char: '🐈',
    color: '#eab308',
    hp: 18,
    atk: 2,
    def: 1,
    specialPerk: 'Resilient Ward: Highest feline health, stays steadfast by your side',
    quote: "*Prrrt!* I am Pulla! (Rubs head on your boots) I feel safe with you, chief! Let's explore together!"
  },
  Alli: {
    name: 'Alli',
    title: 'The Mystical Silver Royal',
    personality: 'Dignified, mystical, and calm in the face of ancient horrors',
    temperament: 'Dignified, Regal & Arcane',
    char: '🐈',
    color: '#cbd5e1',
    hp: 15,
    atk: 2,
    def: 1,
    specialPerk: 'Arcane Radiance: Mystical awareness of dungeon depths and hidden secrets',
    quote: "*Miau!* I am Alli! The dark depths hold no fear for me. My silver fur tingles with ancient magic."
  },
  Leevi: {
    name: 'Leevi',
    title: 'The Eternally Angry Battle Cat',
    personality: 'Fierce, scrappy, irritable, but fiercely protective in battle',
    temperament: 'Fierce, Aggressive & Grumpy',
    char: '🐈',
    color: '#f43f5e',
    hp: 12,
    atk: 5,
    def: 0,
    specialPerk: 'Razor Claws: Highest attack power among companions, strikes relentlessly',
    quote: "*Hiss!* I am Leevi! Touch me and you lose a finger! Fine, I'll follow you — but keep up!"
  }
};

/**
 * Checks whether an entity or follower is one of the developer's beloved special cats.
 */
export function isSpecialCat(entity: { archetypeId?: string; name?: string; isSpecialCat?: boolean; char?: string } | null | undefined): boolean {
  if (!entity) return false;
  if (entity.isSpecialCat) return true;
  if (entity.archetypeId === 'cat') return true;
  if (entity.name && typeof entity.name === 'string') {
    const rawName = entity.name.replace(/^[🐈🐱🛡️⚔️🏹\s]+/, '').split(' (')[0].trim();
    if (SPECIAL_CAT_NAMES.some((c) => rawName.includes(c) || entity.name?.includes(c))) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the count of standard (humanoid/mercenary/captive) companions,
 * excluding the special cats which do not take up a companion slot.
 */
export function getStandardFollowerCount(followers: Follower[] | undefined): number {
  if (!followers || !Array.isArray(followers)) return 0;
  return followers.filter((f) => f && !isSpecialCat(f)).length;
}

/**
 * Returns the count of active special cats in the player's party.
 */
export function getSpecialCatFollowerCount(followers: Follower[] | undefined): number {
  if (!followers || !Array.isArray(followers)) return 0;
  return followers.filter((f) => f && isSpecialCat(f)).length;
}

/**
 * Retrieves the list of unique special cat names found/befriended so far.
 */
export function getAllFoundCatNames(gameState: { followers?: Follower[]; foundCats?: string[]; spawnedCats?: string[] }): string[] {
  const found = new Set<string>();

  // Check foundCats registry
  if (gameState.foundCats && Array.isArray(gameState.foundCats)) {
    gameState.foundCats.forEach((c) => {
      if (SPECIAL_CAT_NAMES.includes(c as SpecialCatName)) {
        found.add(c);
      }
    });
  }

  // Check currently active party followers
  if (gameState.followers && Array.isArray(gameState.followers)) {
    gameState.followers.forEach((f) => {
      if (isSpecialCat(f) && f.name) {
        const raw = f.name.replace(/^[🐈🐱🛡️⚔️🏹\s]+/, '').split(' (')[0].trim();
        for (const catName of SPECIAL_CAT_NAMES) {
          if (raw.includes(catName)) {
            found.add(catName);
          }
        }
      }
    });
  }

  return Array.from(found);
}

/**
 * Checks if the player has found and befriended all 4 special cats.
 */
export function hasFoundAllSpecialCats(gameState: { followers?: Follower[]; foundCats?: string[]; spawnedCats?: string[] }): boolean {
  const found = getAllFoundCatNames(gameState);
  return SPECIAL_CAT_NAMES.every((name) => found.includes(name));
}

/**
 * Builds the grand celebratory announcement log when all 4 special cats have been found.
 */
export function createAllCatsFoundCelebrationLog(): GameLogMessage {
  return {
    id: `all_special_cats_united_${Date.now()}`,
    text: `🐈🌟 [ALL 4 SPECIAL CATS REUNITED]: You have found and befriended all four legendary cats — Jekku, Pulla, Alli, and Leevi! In memory of the developer's beloved companions, they purr in joyful harmony! You have unlocked the permanent 'Cat Lover' trait (+10 Luck, +15 Max HP, and +5 Defense). The feline pride walks with you!`,
    type: 'quest',
    timestamp: 'MEMORIAL'
  };
}
