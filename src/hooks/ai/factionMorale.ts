/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, EnemyState } from '../../types';
import { getLeaderPanicQuote, getSurrenderQuote } from '../../utils/fleeQuotes';

export interface MoraleBreakResult {
  updatedEnemies: Enemy[];
  droppedPiles: Array<{ x: number; y: number; gold: number; materials: string[] }>;
  panickedCount: number;
}

/**
 * Determines whether an enemy holds a leadership position in their faction squad or wildlife pack.
 */
export function isFactionLeader(enemy: Enemy, allEnemies?: Enemy[]): boolean {
  if (!enemy) return false;
  if (enemy.factionRank === 'warlord' || enemy.factionRank === 'leader' || enemy.factionRank === 'captain') {
    return true;
  }
  if (enemy.isBoss) {
    return true;
  }
  const nameLower = enemy.name.toLowerCase();
  if (
    nameLower.includes('warlord') ||
    nameLower.includes('bandit leader') ||
    nameLower.includes('chieftain') ||
    nameLower.includes('squad captain') ||
    nameLower.includes('kingpin') ||
    nameLower.includes('alpha') ||
    nameLower.includes('dire wolf')
  ) {
    return true;
  }
  if (allEnemies && allEnemies.some((o) => o.packLeaderId === enemy.id)) {
    return true;
  }
  return false;
}

/**
 * Triggers squad morale check when a faction leader or pack alpha is defeated.
 * Grunts, scouts, and pack members panic, drop partial loot in desperation, and break into retreat.
 */
export function triggerSquadMoraleBreakOnLeaderDeath(
  leader: Enemy,
  allEnemies: Enemy[],
  addLogMessage?: (msg: string, type?: string) => void,
  addFloater?: (x: number, y: number, text: string, color?: string) => void,
  playSound?: (name: string) => void
): MoraleBreakResult {
  const droppedPiles: Array<{ x: number; y: number; gold: number; materials: string[] }> = [];
  const isLeader = isFactionLeader(leader, allEnemies) || !!leader.packId || allEnemies.some((e) => e.packLeaderId === leader.id);
  if (!isLeader) {
    return { updatedEnemies: allEnemies, droppedPiles, panickedCount: 0 };
  }

  let panickedCount = 0;
  const leaderFaction = leader.faction;
  const leaderPackId = leader.packId;

  const updatedEnemies = allEnemies.map((enemy) => {
    if (
      enemy.id === leader.id ||
      enemy.hp <= 0 ||
      enemy.isFollower ||
      enemy.isTownGuard
    ) {
      return enemy;
    }

    // Check linkage: explicit pack leader, shared pack ID, or shared faction
    const isDirectSubordinate = enemy.packLeaderId === leader.id;
    const isPackMember = leaderPackId && enemy.packId === leaderPackId;
    const isFactionSubordinate = leaderFaction && leaderFaction !== 'unaligned' && enemy.faction === leaderFaction;

    if (!isDirectSubordinate && !isPackMember && !isFactionSubordinate) {
      return enemy;
    }

    // Distance check: up to 10 tiles for pack/squad mates
    const dist = Math.max(Math.abs(enemy.x - leader.x), Math.abs(enemy.y - leader.y));
    if (dist > 10) {
      return enemy;
    }

    // Bosses and elites rarely break morale
    if (enemy.isBoss) {
      return enemy;
    }

    const breakChance = enemy.isElite ? 0.35 : 0.85;
    if (Math.random() < breakChance) {
      panickedCount++;
      const updatedEnemy: Enemy = {
        ...enemy,
        state: EnemyState.Retreating,
        isPanicked: true,
        panicTurns: 6 + Math.floor(Math.random() * 4),
      };

      // Drop panic loot (scattered coins & scrap) if not dropped yet
      if (!enemy.droppedMoraleLoot) {
        updatedEnemy.droppedMoraleLoot = true;
        droppedPiles.push({
          x: enemy.x,
          y: enemy.y,
          gold: Math.floor(Math.random() * 4) + 2,
          materials: ['mat_tempered_scrap'],
        });
      }

      if (addFloater) {
        addFloater(enemy.x, enemy.y, '😱 PANIC!', '#f59e0b');
      }

      return updatedEnemy;
    }

    return enemy;
  });

  if (panickedCount > 0) {
    const factionLabel = (leaderFaction || leaderPackId || 'pack').replace('_', ' ').toUpperCase();
    const panicBark = getLeaderPanicQuote();
    if (addLogMessage) {
      addLogMessage(
        `😱 [MORALE BROKEN]: With ${leader.name} cut down, ${panickedCount} nearby ${factionLabel} fighters break formation in terror! "${panicBark}"`,
        'combat'
      );
    }
    if (playSound) {
      playSound('flee');
    }
  }

  return { updatedEnemies, droppedPiles, panickedCount };
}

/**
 * Checks if a wounded, isolated hostile decides to throw down their weapons and surrender.
 */
export function checkDesperateSurrender(
  enemy: Enemy,
  allLivingEnemies: Enemy[],
  addLogMessage?: (msg: string, type?: string) => void,
  addFloater?: (x: number, y: number, text: string, color?: string) => void,
  playSound?: (name: string) => void
): { enemy: Enemy; didSurrender: boolean; droppedLoot?: { x: number; y: number; gold: number; materials: string[] } } {
  // Only non-boss, non-animal, non-follower humanoids can surrender
  if (
    enemy.isBoss ||
    enemy.isFollower ||
    enemy.isTownGuard ||
    enemy.isAnimal ||
    enemy.isSurrendered ||
    enemy.hp <= 0
  ) {
    return { enemy, didSurrender: false };
  }

  // Must be critically injured (<22% HP)
  if (enemy.hp > enemy.maxHp * 0.22) {
    return { enemy, didSurrender: false };
  }

  // Must be isolated (no living faction allies within 4 tiles)
  if (enemy.faction && enemy.faction !== 'unaligned') {
    const nearbyAllies = allLivingEnemies.filter(
      (other) =>
        other.id !== enemy.id &&
        other.hp > 0 &&
        other.faction === enemy.faction &&
        Math.max(Math.abs(other.x - enemy.x), Math.abs(other.y - enemy.y)) <= 4
    );
    if (nearbyAllies.length > 0) {
      return { enemy, didSurrender: false }; // Has nearby allies, will fight on
    }
  }

  // 35% chance to surrender when isolated & low HP
  if (Math.random() < 0.35) {
    const quote = getSurrenderQuote();
    const updatedEnemy: Enemy = {
      ...enemy,
      isSurrendered: true,
      surrenderTurns: 12,
      state: EnemyState.Retreating,
    };

    let droppedLoot: { x: number; y: number; gold: number; materials: string[] } | undefined;
    if (!enemy.droppedMoraleLoot) {
      updatedEnemy.droppedMoraleLoot = true;
      droppedLoot = {
        x: enemy.x,
        y: enemy.y,
        gold: Math.floor(Math.random() * 4) + 2,
        materials: ['mat_tempered_scrap'],
      };
    }

    if (addLogMessage) {
      addLogMessage(
        `🏳️ [SURRENDER]: ${enemy.name} yields: "${quote}"`,
        'combat'
      );
    }
    if (addFloater) {
      addFloater(enemy.x, enemy.y, '🏳️ SURRENDERED!', '#e2e8f0');
    }
    if (playSound) {
      playSound('loot');
    }

    return { enemy: updatedEnemy, didSurrender: true, droppedLoot };
  }

  return { enemy, didSurrender: false };
}
