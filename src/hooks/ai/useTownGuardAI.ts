import { Enemy, GameState, TileType } from '../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../utils/gameUtils';
import { getNextStepTowards, hasLineOfSight } from '../../utils/ai';
import { incrementDefeatedEnemyCount } from '../../utils/bestiary';
import { TownGuardAIParams, TownGuardActionResult } from './types';

function safeDispatchEffect(detail: any) {
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    const ev = new CustomEvent('spawn-game-effect', { detail });
    window.dispatchEvent(ev);
  }
}

export function processTownGuardTurn(params: TownGuardAIParams): TownGuardActionResult {
  const {
    i,
    px,
    py,
    prev,
    nextEnemies,
    updatedEnemiesList,
    staticLogs,
    playSound,
    applyDamageToEnemy,
  } = params;

  let e = { ...params.e };
  let nextDefeatedCounts = { ...params.nextDefeatedCounts };

  // Identify nearby hostile threats targeting the town
  let nearestThreat: Enemy | null = null;
  let minThreatDist = 999;

  for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
    if (targetIdx === i) continue;
    const target = nextEnemies[targetIdx];
    if (target.hp > 0 && !target.isFollower && !target.isTownGuard) {
      const d = Math.abs(target.x - e.x) + Math.abs(target.y - e.y);
      if (d < minThreatDist) {
        minThreatDist = d;
        nearestThreat = target;
      }
    }
  }

  let attackedThreat = false;
  if (nearestThreat) {
    const target = nearestThreat;
    const dx = Math.abs(target.x - e.x);
    const dy = Math.abs(target.y - e.y);
    const inRange = dx <= 1 && dy <= 1 && (dx > 0 || dy > 0);

    if (inRange) {
      const guardDmg = Math.max(2, e.atk - (target.def || 0));
      const isKilled = applyDamageToEnemy(target, guardDmg);
      const isActionVisible = (prev.visible[target.y]?.[target.x] ?? false) || (prev.visible[e.y]?.[e.x] ?? false);

      if (isActionVisible) {
        staticLogs.push(`🛡️ [TOWN DEFENSE]: Town Guard strikes hostile ${target.name} for ${guardDmg} damage!`);
        playSound('slash', { x: target.x, y: target.y, playerX: px, playerY: py });
        safeDispatchEffect({ x: target.x, y: target.y, sourceX: e.x, sourceY: e.y, text: `-${guardDmg}`, type: 'dmg' });
      }

      attackedThreat = true;
      if (isKilled) {
        if (isActionVisible) {
          staticLogs.push(`☠️ [TOWN SENTRY]: Guard eliminated hostile ${target.name}!`);
        }
        nextDefeatedCounts = incrementDefeatedEnemyCount(nextDefeatedCounts, target.name, target.type, !!target.isBoss);
      }
    }
  }

  if (!attackedThreat) {
    if (nearestThreat && minThreatDist <= 12) {
      // Alarm broadcast to nearby guards if not already alerted
      if (!e.hasSoundedAlarm && (prev.visible[e.y]?.[e.x] ?? false)) {
        e.hasSoundedAlarm = true;
        staticLogs.push(`🚨 [TOWN ALARM]: ${e.name} sounds the town horn! "Hostile intruder spotted at (${nearestThreat.x}, ${nearestThreat.y})!"`);
        playSound('alert');

        // Alert all fellow guards within 30 tiles
        for (const otherGuard of nextEnemies) {
          if (otherGuard.isTownGuard && otherGuard.id !== e.id) {
            const guardDist = Math.abs(otherGuard.x - e.x) + Math.abs(otherGuard.y - e.y);
            if (guardDist <= 30) {
              otherGuard.guardTargetX = nearestThreat.x;
              otherGuard.guardTargetY = nearestThreat.y;
            }
          }
        }
      }

      // Intercept intruder
      const nextStep = getNextStepTowards(e.x, e.y, nearestThreat.x, nearestThreat.y, prev.map, true, updatedEnemiesList);
      if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
        const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                     nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
        const isTileWalkable = prev.map[nextStep.y]?.[nextStep.x] !== TileType.Wall && prev.map[nextStep.y]?.[nextStep.x] !== TileType.Water;
        if (!isTileBlockedByEnemy && isTileWalkable) {
          e.x = nextStep.x;
          e.y = nextStep.y;
        }
      }
    } else if (e.guardTargetX !== undefined && e.guardTargetY !== undefined) {
      // Move towards the sounded alarm coordinate
      const nextStep = getNextStepTowards(e.x, e.y, e.guardTargetX, e.guardTargetY, prev.map, true, updatedEnemiesList);
      if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
        const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                     nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
        const isTileWalkable = prev.map[nextStep.y]?.[nextStep.x] !== TileType.Wall && prev.map[nextStep.y]?.[nextStep.x] !== TileType.Water;
        if (!isTileBlockedByEnemy && isTileWalkable) {
          e.x = nextStep.x;
          e.y = nextStep.y;
        }
      }
      if (e.x === e.guardTargetX && e.y === e.guardTargetY) {
        delete e.guardTargetX;
        delete e.guardTargetY;
        e.hasSoundedAlarm = false;
      }
    } else {
      // Guard Shift Routine: Day Patrol vs Night Barracks Rest
      const currentHour = Math.floor(((prev.gameTime || 0) % 1440) / 60);
      const isNight = currentHour >= 20 || currentHour < 6;
      const isDayShift = e.shift === 'day';
      const isNightShift = e.shift === 'night';

      let guardTargetTile: { x: number; y: number } | null = null;

      if ((isDayShift && isNight) || (isNightShift && !isNight)) {
        // Off duty: sleep in guard barracks bed
        if (e.barracksBedX !== undefined && e.barracksBedY !== undefined) {
          guardTargetTile = { x: e.barracksBedX, y: e.barracksBedY };
          if (e.x === guardTargetTile.x && e.y === guardTargetTile.y) {
            e.char = '😴';
            return { e, nextDefeatedCounts };
          }
        }
      } else {
        // On duty: patrol post / route
        e.char = e.originalChar || '🛡️';
        if (e.patrolPath && e.patrolPath.length > 0) {
          let currentPatrolIdx = e.patrolIndex || 0;
          let pTile = e.patrolPath[currentPatrolIdx];
          if (pTile && e.x === pTile.x && e.y === pTile.y) {
            currentPatrolIdx = (currentPatrolIdx + 1) % e.patrolPath.length;
            e.patrolIndex = currentPatrolIdx;
            pTile = e.patrolPath[currentPatrolIdx];
          }
          guardTargetTile = pTile;
        } else if (e.patrolPostX !== undefined && e.patrolPostY !== undefined) {
          guardTargetTile = { x: e.patrolPostX, y: e.patrolPostY };
        }
      }

      if (guardTargetTile) {
        const nextStep = getNextStepTowards(e.x, e.y, guardTargetTile.x, guardTargetTile.y, prev.map, true, updatedEnemiesList);
        if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
          const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                       nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
          const isTileWalkable = prev.map[nextStep.y]?.[nextStep.x] !== TileType.Wall && prev.map[nextStep.y]?.[nextStep.x] !== TileType.Water;
          if (!isTileBlockedByEnemy && isTileWalkable) {
            e.x = nextStep.x;
            e.y = nextStep.y;
          }
        }
      }
    }
  }

  return {
    e,
    nextDefeatedCounts
  };
}
