/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Enemy,
  EnemyState,
  EnemyType,
  CatalystType
} from '../../types';
import { hasLineOfSight } from '../../utils/ai';
import { getEnemyFleeQuote } from '../../utils/fleeQuotes';
import { incrementDefeatedEnemyCount } from '../../utils/bestiary';
import { isHostileBetween } from '../../factions/FactionMatrix';
import { SpatialEntityGrid } from '../../utils/spatial';
import { checkDesperateSurrender } from './factionMorale';
import {
  HostileAIParams,
  HostileActionResult,
  AITacticContext,
  safeDispatchEffect,
  executeSupportTactics,
  resolveTelegraphedAttack,
  checkTelegraphWindup,
  executeDefenderCombatTactics,
  executePlayerAttackTactics,
  isRangedKiterUnit,
  executeKitingMovement,
  executeFlankingMovement,
  executeRetreatTactics,
  executePatrolTactics,
  checkElitePerceptionWarning
} from './tactics';

export type { HostileAIParams, HostileActionResult };

/**
 * Master Turn Processor for Hostile AI entities.
 * Coordinates status debuffs, stagger states, support spells, telegraphed attacks,
 * morale breaks, target selection, combat tactics, and tactical positioning.
 */
export function processHostileTurn(params: HostileAIParams): HostileActionResult {
  const {
    i,
    px,
    py,
    prev,
    nextGuardsHostile,
    nextEnemies,
    updatedEnemiesList,
    staticLogs,
    playSound
  } = params;

  let e = { ...params.e };
  let playerHp = params.playerHp;
  let nextArmor = params.nextArmor;
  let nextHelmet = params.nextHelmet;
  let nextGloves = params.nextGloves;
  let nextBoots = params.nextBoots;
  let nextShield = params.nextShield;
  const activeScars = [...params.activeScars];
  const updatedEffects = [...params.updatedEffects];
  let nextCaravanTravel = params.nextCaravanTravel;
  let nextDefeatedCounts = { ...params.nextDefeatedCounts };
  let incomingPlayerDamage = params.incomingPlayerDamage;
  let incomingPlayerHits = params.incomingPlayerHits;
  let hadPlayerCrit = params.hadPlayerCrit;
  let hadPlayerBrace = params.hadPlayerBrace;
  let lastAttackerX = params.lastAttackerX;
  let lastAttackerY = params.lastAttackerY;

  // 1. Process enemy debuffs
  let isStunned = false;
  if (e.debuffs && e.debuffs.length > 0) {
    const nextDebuffs = [];
    for (const d of e.debuffs) {
      const dType = String(d.type || '');
      const turns = (d as any).turnsRemaining ?? (d as any).duration ?? 1;
      if (dType === 'stun' || dType === 'freeze' || dType === CatalystType.Frost || dType === CatalystType.Shadow) {
        isStunned = true;
      } else if (
        dType === 'burn' ||
        dType === 'poison' ||
        dType === CatalystType.Fire ||
        dType === CatalystType.Poison ||
        dType === CatalystType.Lightning
      ) {
        const tickVal = d.damagePerTurn || 3;
        e.hp -= tickVal;
        if (prev.visible[e.y]?.[e.x]) {
          staticLogs.push(`🔥 ${e.name} takes -${tickVal} damage from status affliction!`);
          safeDispatchEffect({ x: e.x, y: e.y, text: `-${tickVal}`, type: 'dmg' });
        }
      }
      if (turns > 1) {
        nextDebuffs.push({ ...d, duration: turns - 1, turnsRemaining: turns - 1 });
      }
    }
    e.debuffs = nextDebuffs;
  }

  if (e.hp <= 0) {
    if (prev.visible[e.y]?.[e.x]) {
      staticLogs.push(`💀 ${e.name} succumbed to status ailments!`);
    }
    nextDefeatedCounts = incrementDefeatedEnemyCount(nextDefeatedCounts, e.name, e.type, Boolean(e.isBoss));
    return {
      e: null,
      playerHp,
      nextArmor,
      nextHelmet,
      nextGloves,
      nextBoots,
      nextShield,
      activeScars,
      updatedEffects,
      nextCaravanTravel,
      nextDefeatedCounts,
      incomingPlayerDamage,
      incomingPlayerHits,
      hadPlayerCrit,
      hadPlayerBrace,
      lastAttackerX,
      lastAttackerY
    };
  }

  if (isStunned) {
    if (prev.visible[e.y]?.[e.x]) {
      staticLogs.push(`💫 ${e.name} is stunned/frozen and skips their turn!`);
    }
    return {
      e,
      playerHp,
      nextArmor,
      nextHelmet,
      nextGloves,
      nextBoots,
      nextShield,
      activeScars,
      updatedEffects,
      nextCaravanTravel,
      nextDefeatedCounts,
      incomingPlayerDamage,
      incomingPlayerHits,
      hadPlayerCrit,
      hadPlayerBrace,
      lastAttackerX,
      lastAttackerY
    };
  }

  // 2. Stagger / Posture Recovery
  if (e.isStaggered) {
    e.staggerTurns = (e.staggerTurns || 1) - 1;
    if (e.staggerTurns <= 0) {
      e.isStaggered = false;
      e.staggerMeter = 0;
      if (prev.visible[e.y]?.[e.x]) {
        staticLogs.push(`🛡️ ${e.name} recovers their posture and stance!`);
      }
    } else {
      if (prev.visible[e.y]?.[e.x]) {
        staticLogs.push(`💫 ${e.name} is STAGGERED and helpless!`);
      }
      return {
        e,
        playerHp,
        nextArmor,
        nextHelmet,
        nextGloves,
        nextBoots,
        nextShield,
        activeScars,
        updatedEffects,
        nextCaravanTravel,
        nextDefeatedCounts,
        incomingPlayerDamage,
        incomingPlayerHits,
        hadPlayerCrit,
        hadPlayerBrace,
        lastAttackerX,
        lastAttackerY
      };
    }
  }

  let isHostile = !e.isFollower && (!e.isTownGuard || nextGuardsHostile);

  // 3. Build spatial perception and context
  const sameZ = (e.z ?? 0) === ((prev as any).overworldZ ?? 0);
  const distToPlayer = Math.abs(e.x - px) + Math.abs(e.y - py);
  const enemyRange = e.range || 1;
  const dxToPlayer = Math.abs(e.x - px);
  const dyToPlayer = Math.abs(e.y - py);
  const hasLOS = hasLineOfSight(e.x, e.y, px, py, prev.map);
  const isWithinAttackRange =
    sameZ &&
    dxToPlayer <= enemyRange &&
    dyToPlayer <= enemyRange &&
    (dxToPlayer > 0 || dyToPlayer > 0) &&
    (enemyRange === 1 || hasLOS);

  // Build unified registry and spatial index of active entities
  const updatedMap = new Map<string, Enemy>();
  for (const ue of updatedEnemiesList) {
    updatedMap.set(ue.id, ue);
  }
  const allActiveEntities = nextEnemies
    .map((ne) => updatedMap.get(ne.id) || ne)
    .filter((item) => item && item.hp > 0 && item.id !== e.id);
  const entitySpatialGrid = SpatialEntityGrid.fromEnemies(allActiveEntities);

  const tacticCtx: AITacticContext = {
    ...params,
    e,
    playerHp,
    nextArmor,
    nextHelmet,
    nextGloves,
    nextBoots,
    nextShield,
    activeScars,
    updatedEffects,
    nextCaravanTravel,
    nextDefeatedCounts,
    incomingPlayerDamage,
    incomingPlayerHits,
    hadPlayerCrit,
    hadPlayerBrace,
    lastAttackerX,
    lastAttackerY,
    allActiveEntities,
    entitySpatialGrid,
    isHostile,
    sameZ,
    distToPlayer,
    dxToPlayer,
    dyToPlayer,
    hasLOS,
    enemyRange,
    isWithinAttackRange
  };

  // 4. Support Healer / Buffer AI Phase
  const supportResult = executeSupportTactics(tacticCtx);
  if (supportResult?.handled && supportResult.actionResult) {
    return supportResult.actionResult;
  }

  // 5. Telegraphed Attack Resolution
  const telegraphResult = resolveTelegraphedAttack(tacticCtx);
  if (telegraphResult?.handled && telegraphResult.actionResult) {
    return telegraphResult.actionResult;
  }

  // 6. Morale Break and Desperate Surrender Evaluation
  if (e.isSurrendered) {
    e.surrenderTurns = (e.surrenderTurns || 1) - 1;
    if (e.surrenderTurns <= 0) {
      e.isSurrendered = false;
    }
    e.state = EnemyState.Retreating;
    isHostile = false;
  } else if (e.isPanicked) {
    e.panicTurns = (e.panicTurns || 1) - 1;
    if (e.panicTurns <= 0) {
      e.isPanicked = false;
    }
    e.state = EnemyState.Retreating;
    isHostile = false;
  } else if (isHostile) {
    const surrenderResult = checkDesperateSurrender(
      e,
      nextEnemies,
      (msg) => staticLogs.push(msg),
      (x, y, txt, col) => safeDispatchEffect({ x, y, text: txt, color: col, type: 'heal' }),
      playSound
    );
    if (surrenderResult.didSurrender) {
      e = surrenderResult.enemy;
      isHostile = false;
    }
  }

  // Update hostility in context
  tacticCtx.isHostile = isHostile;
  tacticCtx.e = e;

  // 7. Perception check & Boss/Elite alert
  const isInPerceptionRange = distToPlayer <= 10;
  if (sameZ && isInPerceptionRange && isHostile && (enemyRange === 1 || hasLOS)) {
    e.state = EnemyState.Chasing;
    checkElitePerceptionWarning({ e, prev, staticLogs });
  }

  // Autonomous Inter-Faction Skirmish Perception: detect rival factions within 8 tiles
  let detectedRivalFaction: Enemy | null = null;
  if (
    e.faction &&
    isHostile &&
    e.state !== EnemyState.Fleeing &&
    e.state !== EnemyState.Surrendered &&
    e.state !== EnemyState.Retreating
  ) {
    const nearbyPotentialRivals = entitySpatialGrid.getNearby(e.x, e.y, 8);
    for (const other of nearbyPotentialRivals) {
      if (other.id !== e.id && other.hp > 0 && isHostileBetween(e.faction, other.faction)) {
        if (hasLineOfSight(e.x, e.y, other.x, other.y, prev.map)) {
          detectedRivalFaction = other;
          break;
        }
      }
    }
    if (detectedRivalFaction && e.state !== EnemyState.Chasing) {
      e.state = EnemyState.Chasing;
    }
  }

  // 8. Defender Combat & Caravan Targeting
  const defenderResult = executeDefenderCombatTactics(tacticCtx);
  if (defenderResult?.handled && defenderResult.actionResult) {
    return defenderResult.actionResult;
  }

  // 9. Hostile Attacks Player
  const isRangedKiter = isRangedKiterUnit(e);
  const isTooCloseInMeleeToKite = isRangedKiter && distToPlayer <= 2;
  const shouldAttackNow = isHostile && isWithinAttackRange && !isTooCloseInMeleeToKite;

  if (shouldAttackNow) {
    // Check if heavy monster winds up a telegraphed strike
    const windupResult = checkTelegraphWindup(tacticCtx);
    if (windupResult?.handled && windupResult.actionResult) {
      return windupResult.actionResult;
    }

    // Execute direct attack on the player
    const attackResult = executePlayerAttackTactics(tacticCtx);
    if (attackResult.handled && attackResult.actionResult) {
      return attackResult.actionResult;
    }
  }

  // 10. Wounded Retreat State Trigger
  if (e.state === EnemyState.Chasing && !e.isBoss && (e.hp < e.maxHp * 0.25 || e.type === EnemyType.LootGoblin)) {
    e.state = EnemyState.Retreating;
    if (Math.random() < 0.35) {
      staticLogs.push(getEnemyFleeQuote(e.name, e.type));
    }
  }

  // 11. Tactical Movement & Navigation
  if (e.state === EnemyState.Chasing && isHostile) {
    let chaseTargetX = px;
    let chaseTargetY = py;
    let minDefenderDist = Math.abs(px - e.x) + Math.abs(py - e.y);

    if (nextCaravanTravel?.active && (nextCaravanTravel.wagonHp ?? 100) > 0) {
      const wagonX = 12;
      const wagonY = 9;
      const wagonDist = Math.abs(wagonX - e.x) + Math.abs(wagonY - e.y);
      if (wagonDist < minDefenderDist) {
        minDefenderDist = wagonDist;
        chaseTargetX = wagonX;
        chaseTargetY = wagonY;
      }
    }

    for (const defender of allActiveEntities) {
      if (defender.hp > 0 && (defender.isFollower || (defender.isTownGuard && !nextGuardsHostile))) {
        const defDist = Math.abs(defender.x - e.x) + Math.abs(defender.y - e.y);
        const isDefenderWoundedOrFleeing =
          defender.state === EnemyState.Retreating || defender.hp < defender.maxHp * 0.4;

        if (isDefenderWoundedOrFleeing ? defDist <= minDefenderDist + 2 : defDist <= minDefenderDist) {
          minDefenderDist = defDist;
          chaseTargetX = defender.x;
          chaseTargetY = defender.y;
        }
      } else if (defender.hp > 0 && defender.id !== e.id && isHostileBetween(e.faction, defender.faction)) {
        const rivalDist = Math.abs(defender.x - e.x) + Math.abs(defender.y - e.y);
        if (rivalDist <= 7 && hasLineOfSight(e.x, e.y, defender.x, defender.y, prev.map)) {
          if (rivalDist < minDefenderDist) {
            minDefenderDist = rivalDist;
            chaseTargetX = defender.x;
            chaseTargetY = defender.y;
          }
        }
      }
    }

    if (isRangedKiter) {
      executeKitingMovement({
        e,
        i,
        px,
        py,
        chaseTargetX,
        chaseTargetY,
        prev,
        nextEnemies,
        updatedEnemiesList,
        staticLogs
      });
    } else {
      executeFlankingMovement({
        e,
        i,
        px,
        py,
        chaseTargetX,
        chaseTargetY,
        prev,
        nextEnemies,
        updatedEnemiesList
      });
    }
  } else if (e.state === EnemyState.Retreating) {
    executeRetreatTactics({
      e,
      i,
      px,
      py,
      prev,
      nextEnemies,
      updatedEnemiesList,
      staticLogs,
      playSound
    });
  } else if (e.state === EnemyState.Patrolling && e.patrolPath && e.patrolPath.length > 0) {
    executePatrolTactics({
      e,
      i,
      px,
      py,
      prev,
      nextEnemies,
      updatedEnemiesList
    });
  }

  return {
    e,
    playerHp,
    nextArmor,
    nextHelmet,
    nextGloves,
    nextBoots,
    nextShield,
    activeScars,
    updatedEffects,
    nextCaravanTravel,
    nextDefeatedCounts,
    incomingPlayerDamage,
    incomingPlayerHits,
    hadPlayerCrit,
    hadPlayerBrace,
    lastAttackerX,
    lastAttackerY
  };
}
