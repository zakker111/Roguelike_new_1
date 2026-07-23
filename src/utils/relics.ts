/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import relicsJson from '../data/relics.json';

export interface SanctumRelic {
  id: string;
  name: string;
  description: string;
  details: string;
  icon: string; // Emoji
  rarity: 'Common' | 'Rare' | 'Legendary';
  color: string; // Tailwind text color class
  borderColor: string; // Tailwind border color class
  bgColor: string; // Tailwind bg color class
}

export const SANCTUM_RELICS: SanctumRelic[] = relicsJson as SanctumRelic[];

export function getRandomRelicDraft(count: number = 3, existingRelicIds: string[] = []): SanctumRelic[] {
  // Exclude already owned relics to make draft unique
  const available = SANCTUM_RELICS.filter(relic => !existingRelicIds.includes(relic.id));
  
  // If we don't have enough available, fallback to any available
  const listToDraw = available.length >= count ? available : SANCTUM_RELICS;
  
  const shuffled = [...listToDraw].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
