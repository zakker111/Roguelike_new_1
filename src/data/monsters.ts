/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import bestiaryData from './bestiary.json';
import enemyBlueprintsData from './enemyBlueprints.json';

export interface LootItem {
  name: string;
  chance: string;
  description: string;
  color: string;
}

export interface BestiaryEntry {
  key: string;
  name: string;
  char: string;
  color: string;
  category: 'Standard' | 'Wildlife' | 'Bosses';
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  range: number;
  speed: number;
  description: string;
  lootTable: LootItem[];
}

export interface BossTemplate {
  id: string;
  name: string;
  type: string;
  char: string;
  color: string;
  hpMultiplier: number;
  atkMultiplier: number;
  defBonus: number;
  speed: number;
  description: string;
}

export interface SquadBlueprint {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  members: Array<{
    type: string;
    count: number;
    isElite: boolean;
  }>;
}

export const MONSTER_ENTRIES: BestiaryEntry[] = bestiaryData as BestiaryEntry[];
export const BOSS_TEMPLATES: BossTemplate[] = enemyBlueprintsData.bossTemplates as BossTemplate[];
export const SQUAD_BLUEPRINTS: SquadBlueprint[] = enemyBlueprintsData.squadBlueprints as SquadBlueprint[];

export function getMonsterDefinitionByKey(key: string): BestiaryEntry | undefined {
  return MONSTER_ENTRIES.find(entry => entry.key.toLowerCase() === key.toLowerCase());
}

export function getMonstersByCategory(category: 'Standard' | 'Wildlife' | 'Bosses'): BestiaryEntry[] {
  return MONSTER_ENTRIES.filter(entry => entry.category === category);
}


