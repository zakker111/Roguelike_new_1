/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy } from '../../../types';
import { hasLineOfSight } from '../../../utils/ai';
import { isHostileBetween } from '../../../factions/FactionMatrix';
import { triggerSquadMoraleBreakOnLeaderDeath } from '../factionMorale';
import { AITacticContext, AITacticResult, safeDispatchEffect } from './types';

/**
 * AI Strategy: Defender Combat & Caravan Interception.
 * Handles hostility towards merchant wagons, companions/followers, town guards, and rival faction enemies.
 */
export function executeDefenderCombatTactics(ctx: AITacticContext): AITacticResult | null {
  const {
    e,
    px,
    py,
    prev,
    nextGuardsHostile,
    nextEnemies,
    entitySpatialGrid,
    allActiveEntities,
    isHostile,
    isWithinAttackRange,
    distToPlayer,
    staticLogs,
    playSound,
    applyDamageToEnemy
  } = ctx;

  let nextCaravanTravel = ctx.nextCaravanTravel;

  // 1. Wagon Attack Targeting in caravan skirmishes
  if (isHostile && nextCaravanTravel?.active && (nextCaravanTravel.wagonHp ?? 100) > 0) {
    const wagonX = 12;
    const wagonY = 9;
    const wDistX = Math.abs(wagonX - e.x);
    const wDistY = Math.abs(wagonY - e.y);
    const atkRange = e.range || 1;
    const inWagonRange =
      atkRange === 1 ? wDistX <= 1 && wDistY <= 1 : wDistX <= atkRange && wDistY <= atkRange;

    if (inWagonRange && Math.random() < 0.6) {
      const rawWagonDmg = Math.max(5, Math.round(e.atk * 0.85));
      const currentWagonHp = nextCaravanTravel.wagonHp ?? 100;
      const updatedWagonHp = Math.max(0, currentWagonHp - rawWagonDmg);
      nextCaravanTravel = {
        ...nextCaravanTravel,
        wagonHp: updatedWagonHp
      };
      staticLogs.push(
        `💥 [WAGON DAMAGED]: ${e.name} strikes the Merchant Wagon for -${rawWagonDmg} Hull Damage! (${updatedWagonHp}/${
          nextCaravanTravel.maxWagonHp || 100
        } HP remaining)`
      );
      playSound('metal_hit');
      safeDispatchEffect({ x: wagonX, y: wagonY, text: `-${rawWagonDmg} Wagon`, type: 'dmg' });

      if (updatedWagonHp <= 0) {
        staticLogs.push(`💥 [CARGO DESTROYED]: The merchant wagon frame was shattered! Cargo has been lost!`);
      }

      return {
        handled: true,
        actionResult: {
          e,
          playerHp: ctx.playerHp,
          nextArmor: ctx.nextArmor,
          nextHelmet: ctx.nextHelmet,
          nextGloves: ctx.nextGloves,
          nextBoots: ctx.nextBoots,
          nextShield: ctx.nextShield,
          activeScars: ctx.activeScars,
          updatedEffects: ctx.updatedEffects,
          nextCaravanTravel,
          nextDefeatedCounts: ctx.nextDefeatedCounts,
          incomingPlayerDamage: ctx.incomingPlayerDamage,
          incomingPlayerHits: ctx.incomingPlayerHits,
          hadPlayerCrit: ctx.hadPlayerCrit,
          hadPlayerBrace: ctx.hadPlayerBrace,
          lastAttackerX: ctx.lastAttackerX,
          lastAttackerY: ctx.lastAttackerY
        }
      };
    }
  }

  // 2. Target Defenders (Followers, Town Guards & Rival Faction Enemies)
  let targetDefender: Enemy | null = null;
  let isRivalFactionCombat = false;
  let bestDefenderPriority = Infinity;

  if (isHostile) {
    const atkRange = e.range || 1;
    const localCandidates = entitySpatialGrid.getNearby(e.x, e.y, atkRange);

    // 2a. Check followers and friendly town guards within reach
    for (const defender of localCandidates) {
      if ((defender.isFollower || (defender.isTownGuard && !nextGuardsHostile)) && defender.hp > 0) {
        const fDistX = Math.abs(defender.x - e.x);
        const fDistY = Math.abs(defender.y - e.y);
        const inAtkRange =
          atkRange === 1
            ? fDistX <= 1 && fDistY <= 1 && (fDistX > 0 || fDistY > 0)
            : fDistX <= atkRange && fDistY <= atkRange && (fDistX > 0 || fDistY > 0);
        if (inAtkRange) {
          if (atkRange === 1 || hasLineOfSight(e.x, e.y, defender.x, defender.y, prev.map)) {
            const dist = fDistX + fDistY;
            const priority = dist + defender.hp / defender.maxHp;
            if (priority < bestDefenderPriority) {
              bestDefenderPriority = priority;
              targetDefender = defender;
              isRivalFactionCombat = false;
            }
          }
        }
      }
    }

    // 2b. If no friendly defender found, check for hostile rival faction enemies within attack range
    if (!targetDefender) {
      for (const rival of localCandidates) {
        if (rival.id !== e.id && rival.hp > 0 && isHostileBetween(e.faction, rival.faction)) {
          const rDistX = Math.abs(rival.x - e.x);
          const rDistY = Math.abs(rival.y - e.y);
          const inAtkRange =
            atkRange === 1
              ? rDistX <= 1 && rDistY <= 1 && (rDistX > 0 || rDistY > 0)
              : rDistX <= atkRange && rDistY <= atkRange && (rDistX > 0 || rDistY > 0);
          if (inAtkRange) {
            if (atkRange === 1 || hasLineOfSight(e.x, e.y, rival.x, rival.y, prev.map)) {
              targetDefender = rival;
              isRivalFactionCombat = true;
              break;
            }
          }
        }
      }
    }
  }

  // 3. Dynamic target swapping between player, followers, town guards, and rivals
  let shouldAttackDefender = false;
  if (targetDefender) {
    if (!isWithinAttackRange) {
      // Player is not in reach, but defender is: attack defender immediately!
      shouldAttackDefender = true;
    } else {
      // Both player and defender/follower are within attack reach: swap targets dynamically!
      const distToDefender = Math.abs(targetDefender.x - e.x) + Math.abs(targetDefender.y - e.y);
      const isDefenderWounded = targetDefender.hp < targetDefender.maxHp * 0.5;

      if (distToDefender < distToPlayer) {
        shouldAttackDefender = Math.random() < 0.75;
      } else if (isDefenderWounded) {
        shouldAttackDefender = Math.random() < 0.65;
      } else {
        shouldAttackDefender = Math.random() < 0.5;
      }
    }
  }

  if (isHostile && targetDefender && shouldAttackDefender) {
    const fDmg = Math.max(1, e.atk - (targetDefender.def || 0));
    const isKilled = applyDamageToEnemy(targetDefender, fDmg);
    const isVisible =
      (prev.visible[targetDefender.y]?.[targetDefender.x] ?? false) || (prev.visible[e.y]?.[e.x] ?? false);
    if (isVisible) {
      if (isRivalFactionCombat) {
        staticLogs.push(
          `⚔️ [FACTION SKIRMISH]: ${e.name} strikes rival ${targetDefender.name} for -${fDmg} HP! (${Math.max(
            0,
            targetDefender.hp
          )}/${targetDefender.maxHp} HP remaining)`
        );
      } else {
        const defLabel = targetDefender.isTownGuard ? 'Town Guard' : 'companion';
        staticLogs.push(
          `⚔️ [HOSTILE ATTACK]: ${e.name} strikes ${defLabel} ${targetDefender.name} for -${fDmg} HP! (${Math.max(
            0,
            targetDefender.hp
          )}/${targetDefender.maxHp} HP remaining)`
        );
      }
      playSound('injury');
      safeDispatchEffect({
        x: targetDefender.x,
        y: targetDefender.y,
        sourceX: e.x,
        sourceY: e.y,
        text: `-${fDmg} HP`,
        type: 'dmg'
      });
    }

    if (isKilled) {
      if (isVisible) {
        if (isRivalFactionCombat) {
          staticLogs.push(`💀 [TURF CASUALTY]: ${targetDefender.name} was slain by ${e.name} in the faction clash!`);
        } else if (targetDefender.isTownGuard) {
          staticLogs.push(`☠️ [TOWN GUARD FALLEN]: ${targetDefender.name} was slain defending the town!`);
        } else {
          staticLogs.push(`💔 [COMPANION FALLEN]: ${targetDefender.name} has been slain in combat!`);
        }
      }

      // Check if the fallen entity was a faction leader
      const moraleResult = triggerSquadMoraleBreakOnLeaderDeath(
        targetDefender,
        nextEnemies,
        (msg) => staticLogs.push(msg),
        (x, y, txt, col) => safeDispatchEffect({ x, y, text: txt, color: col, type: 'heal' }),
        playSound
      );
      if (moraleResult.panickedCount > 0) {
        for (let m = 0; m < nextEnemies.length; m++) {
          const updated = moraleResult.updatedEnemies.find((ue) => ue.id === nextEnemies[m].id);
          if (updated) {
            nextEnemies[m] = updated;
          }
        }
      }
    }

    return {
      handled: true,
      actionResult: {
        e,
        playerHp: ctx.playerHp,
        nextArmor: ctx.nextArmor,
        nextHelmet: ctx.nextHelmet,
        nextGloves: ctx.nextGloves,
        nextBoots: ctx.nextBoots,
        nextShield: ctx.nextShield,
        activeScars: ctx.activeScars,
        updatedEffects: ctx.updatedEffects,
        nextCaravanTravel,
        nextDefeatedCounts: ctx.nextDefeatedCounts,
        incomingPlayerDamage: ctx.incomingPlayerDamage,
        incomingPlayerHits: ctx.incomingPlayerHits,
        hadPlayerCrit: ctx.hadPlayerCrit,
        hadPlayerBrace: ctx.hadPlayerBrace,
        lastAttackerX: ctx.lastAttackerX,
        lastAttackerY: ctx.lastAttackerY
      }
    };
  }

  return null;
}
