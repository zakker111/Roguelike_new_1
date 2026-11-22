/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerStats } from '../types/entities';
import gameConfig from '../data/gameConfig.json';

export interface LevelUpResolutionResult {
  nextStats: PlayerStats;
  levelsGained: number;
  levelUpLogs: string[];
}

/**
 * Canonical XP addition and multi-level-up resolution engine.
 * Ensures melee combat, spell scrolls, quest turn-ins, and caravan rewards
 * share identical stat scaling, threshold curves, and HP/MP restoration.
 */
export function applyPlayerXpAndLevelUps(
  stats: PlayerStats,
  xpGained: number
): LevelUpResolutionResult {
  const safeGain = Math.max(0, Math.floor(xpGained || 0));
  let updatedXp = (stats.xp || 0) + safeGain;
  let level = stats.level || 1;
  let nextThreshold = stats.nextLevelXp || stats.xpNext || 100;
  let hp = stats.hp;
  let maxHp = stats.maxHp;
  let mp = stats.mp;
  let maxMp = stats.maxMp;
  let atk = stats.atk;
  let def = stats.def;
  let unspentPoints = stats.unspentPoints || 0;

  let levelsGained = 0;
  const levelUpLogs: string[] = [];
  const bonuses = gameConfig.levelUpBonuses;

  while (updatedXp >= nextThreshold) {
    level += 1;
    levelsGained += 1;
    updatedXp -= nextThreshold;
    nextThreshold = Math.floor(nextThreshold * bonuses.xpThresholdMultiplier);
    maxHp += bonuses.maxHp;
    hp = maxHp;
    maxMp += bonuses.maxMp;
    mp = maxMp;
    atk += bonuses.atk;
    def += bonuses.def;
    unspentPoints += bonuses.attributePoints;

    levelUpLogs.push(
      `🌟 LEVEL UP! You reached Level ${level}! Got +${bonuses.attributePoints} Attribute Points to spend! (+${bonuses.maxHp} Max HP, +${bonuses.maxMp} Max MP, +${bonuses.def} DEF, +${bonuses.atk} ATK)`
    );
  }

  return {
    nextStats: {
      ...stats,
      xp: updatedXp,
      level,
      nextLevelXp: nextThreshold,
      xpNext: nextThreshold,
      hp,
      maxHp,
      mp,
      maxMp,
      atk,
      def,
      unspentPoints,
    },
    levelsGained,
    levelUpLogs,
  };
}
