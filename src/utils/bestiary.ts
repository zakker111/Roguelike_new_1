/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MONSTER_ENTRIES, BestiaryEntry, LootItem, getMonsterDefinitionByKey, getMonstersByCategory } from '../data/monsters';

export type { LootItem, BestiaryEntry };
export { getMonsterDefinitionByKey, getMonstersByCategory };
export const BESTIARY_ENTRIES: BestiaryEntry[] = MONSTER_ENTRIES;

export const incrementDefeatedEnemyCount = (
  defeatedEnemiesCount: { [key: string]: number } | undefined,
  enemyName: string | undefined,
  enemyType: string | undefined,
  isBoss: boolean
): { [key: string]: number } => {
  const counts = { ...(defeatedEnemiesCount || {}) };
  
  let key = enemyType || 'Unknown';
  if (isBoss && enemyName) {
    // Strip the boss symbols like "👑 " or "★ " or " ★"
    key = enemyName.replace('👑 ', '').replace('★ ', '').replace(' ★', '').trim();
    // Also handle special names like Surtur
    if (key.includes("Surtur")) {
      key = "Surtur the Magma Arch-demon";
    } else if (key.includes("Morgath")) {
      key = "Morgath the Voidbringer";
    } else if (key.includes("Grommash")) {
      key = "Grommash the Undying Troll";
    } else if (key.includes("Krosh")) {
      key = "Warlord Krosh Skullbreaker";
    } else if (key.includes("Scurry")) {
      key = "King Scurry the Plague Swarm";
    } else if (key.includes("Malakar")) {
      key = "Malakar the Phantom Trapsmith";
    } else if (key.includes("Otso")) {
      key = "Otso";
    } else if (key.includes("Louhi")) {
      key = "Louhi";
    }
  }

  // If standard name includes elite prefixes, match by base type
  if (!isBoss && key && typeof key === 'string' && (key.startsWith('★') || (enemyName && typeof enemyName === 'string' && enemyName.includes('★')))) {
    key = enemyType || 'Unknown';
  }

  counts[key] = (counts[key] || 0) + 1;
  return counts;
};
