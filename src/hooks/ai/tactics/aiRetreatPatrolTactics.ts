/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, EnemyState, EnemyType, GameState } from '../../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../../utils/gameUtils';
import {
  getNextStepTowards,
  getNextStepAwayFrom,
  isTileWalkableForEntity,
  isTileBlockedForEntity
} from '../../../utils/ai';
import { getEnemyFleeQuote } from '../../../utils/fleeQuotes';

export interface RetreatMovementParams {
  e: Enemy;
  i: number;
  px: number;
  py: number;
  prev: GameState;
  nextEnemies: Enemy[];
  updatedEnemiesList: Enemy[];
  staticLogs: string[];
  playSound: (soundName: string, options?: any) => void;
}

/**
 * AI Strategy: Tactical Retreat & Reinforcement Alerting.
 * Wounded or panicked enemies flee toward dormant allies to yell for reinforcements,
 * run back to their home camps, or flee directly away from the player.
 */
export function executeRetreatTactics(params: RetreatMovementParams): void {
  const {
    e,
    i,
    px,
    py,
    prev,
    nextEnemies,
    updatedEnemiesList,
    staticLogs,
    playSound
  } = params;

  let nearestDormant: Enemy | null = null;
  let minDormantDist = 999;

  if (!e.hasAlertedBackup && !e.isPanicked && !e.isSurrendered) {
    for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
      if (targetIdx === i) continue;
      const target = nextEnemies[targetIdx];
      if (target.hp > 0 && !target.isFollower && !target.isTownGuard) {
        const isDormant =
          target.state === EnemyState.Sleeping ||
          target.state === EnemyState.Patrolling ||
          target.state !== EnemyState.Chasing;
        if (isDormant) {
          const d = Math.abs(target.x - e.x) + Math.abs(target.y - e.y);
          if (d < minDormantDist) {
            minDormantDist = d;
            nearestDormant = target;
          }
        }
      }
    }
  }

  let retreatTargetX = e.x;
  let retreatTargetY = e.y;

  if (nearestDormant && minDormantDist <= 18) {
    retreatTargetX = nearestDormant.x;
    retreatTargetY = nearestDormant.y;

    if (minDormantDist <= 2) {
      e.hasAlertedBackup = true;
      nearestDormant.state = EnemyState.Chasing;
      if (nearestDormant.originalChar) nearestDormant.char = nearestDormant.originalChar;

      for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
        const nearby = nextEnemies[targetIdx];
        if (nearby.hp > 0 && !nearby.isFollower && !nearby.isTownGuard) {
          const distToGroup = Math.abs(nearby.x - nearestDormant.x) + Math.abs(nearby.y - nearestDormant.y);
          if (distToGroup <= 6) {
            nearby.state = EnemyState.Chasing;
            if (nearby.originalChar) nearby.char = nearby.originalChar;
          }
        }
      }

      const isActionVisible =
        (prev.visible[e.y]?.[e.x] ?? false) || (prev.visible[nearestDormant.y]?.[nearestDormant.x] ?? false);
      if (isActionVisible) {
        staticLogs.push(
          `📢 [REINFORCEMENTS]: Wounded ${e.name} yells for backup, alerting nearby ${nearestDormant.name} to attack!`
        );
        playSound('bump', { x: e.x, y: e.y, playerX: px, playerY: py });
      }
    }
  } else if (e.homeCampX !== undefined && e.homeCampY !== undefined) {
    retreatTargetX = e.homeCampX;
    retreatTargetY = e.homeCampY;
  } else {
    const dirX = Math.sign(e.x - px) || (Math.random() < 0.5 ? 1 : -1);
    const dirY = Math.sign(e.y - py) || (Math.random() < 0.5 ? 1 : -1);
    retreatTargetX = Math.max(0, Math.min(LEVEL_WIDTH - 1, e.x + dirX * 5));
    retreatTargetY = Math.max(0, Math.min(LEVEL_HEIGHT - 1, e.y + dirY * 5));
  }

  const isWaterWalkable = e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso;
  let nextStep: { x: number; y: number } | null = null;
  const isTargetWalkable = isTileWalkableForEntity(prev.map[retreatTargetY]?.[retreatTargetX], {
    isWaterWalkable,
    canOpenDoors: false
  });
  if (isTargetWalkable) {
    nextStep = getNextStepTowards(e.x, e.y, retreatTargetX, retreatTargetY, prev.map, false, updatedEnemiesList, isWaterWalkable);
  }
  if (!nextStep) {
    nextStep = getNextStepAwayFrom(e.x, e.y, px, py, prev.map, false, updatedEnemiesList, isWaterWalkable);
  }
  if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
    const isTileBlockedByEnemy =
      updatedEnemiesList.some((other) => other.x === nextStep!.x && other.y === nextStep!.y) ||
      nextEnemies.some((other, idx) => idx > i && other.x === nextStep!.x && other.y === nextStep!.y);
    const isTileWalkable = isTileWalkableForEntity(prev.map[nextStep.y]?.[nextStep.x], {
      isWaterWalkable,
      canOpenDoors: false
    });
    if (!isTileBlockedByEnemy && isTileWalkable) {
      e.x = nextStep.x;
      e.y = nextStep.y;
    }
  }
  if (Math.random() < 0.1) {
    staticLogs.push(getEnemyFleeQuote(e.name, e.type));
  }
}

export interface PatrolMovementParams {
  e: Enemy;
  i: number;
  px: number;
  py: number;
  prev: GameState;
  nextEnemies: Enemy[];
  updatedEnemiesList: Enemy[];
}

/**
 * AI Strategy: Waypoint Patrol Navigation.
 * Cycles through ordered patrol waypoints and steps towards them.
 */
export function executePatrolTactics(params: PatrolMovementParams): void {
  const { e, i, px, py, prev, nextEnemies, updatedEnemiesList } = params;

  if (!e.patrolPath || e.patrolPath.length === 0) return;

  let currentPatrolIdx = e.patrolIndex || 0;
  let targetTile = e.patrolPath[currentPatrolIdx];
  const isWaterWalkable = e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso;

  // If waypoint is reached or waypoint tile itself is impassable, cycle to next waypoint
  const isTargetBlocked =
    targetTile &&
    isTileBlockedForEntity(prev.map[targetTile.y]?.[targetTile.x], {
      isWaterWalkable,
      canOpenDoors: false
    });

  if (targetTile && ((e.x === targetTile.x && e.y === targetTile.y) || isTargetBlocked)) {
    currentPatrolIdx = (currentPatrolIdx + 1) % e.patrolPath.length;
    e.patrolIndex = currentPatrolIdx;
    targetTile = e.patrolPath[currentPatrolIdx];
  }

  if (targetTile) {
    const nextStep = getNextStepTowards(
      e.x,
      e.y,
      targetTile.x,
      targetTile.y,
      prev.map,
      false,
      updatedEnemiesList,
      isWaterWalkable
    );
    if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
      const isTileBlockedByEnemy =
        updatedEnemiesList.some((other) => other.x === nextStep.x && other.y === nextStep.y) ||
        nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
      const isTileWalkable = isTileWalkableForEntity(prev.map[nextStep.y]?.[nextStep.x], {
        isWaterWalkable,
        canOpenDoors: false
      });
      if (!isTileBlockedByEnemy && isTileWalkable) {
        e.x = nextStep.x;
        e.y = nextStep.y;
      }
    }
  }
}
