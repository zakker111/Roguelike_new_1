/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, EnemyType, GameState } from '../../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../../utils/gameUtils';
import { getNextStepTowards, hasLineOfSight, isTileWalkableForEntity } from '../../../utils/ai';

/**
 * Checks if the entity is a ranged kiting/skirmishing unit.
 */
export function isRangedKiterUnit(e: Enemy): boolean {
  return (
    Boolean(e.range && e.range > 1) ||
    e.aiRole === 'skirmisher_kiting' ||
    e.type === EnemyType.SkeletonMage ||
    e.type === EnemyType.Necromancer ||
    e.type === EnemyType.Tidecaller ||
    e.type === EnemyType.AbyssalSiren ||
    e.type === EnemyType.Trapmaster ||
    /archer|bowman|ranger|marksman|sorcerer|mage|wizard|warlock|shaman|tidecaller|spellflinger|trapsmith/i.test(
      e.name
    )
  );
}

export interface KitingMovementParams {
  e: Enemy;
  i: number;
  px: number;
  py: number;
  chaseTargetX: number;
  chaseTargetY: number;
  prev: GameState;
  nextEnemies: Enemy[];
  updatedEnemiesList: Enemy[];
  staticLogs: string[];
}

/**
 * AI Strategy: Ranged Kiting & Standoff Maneuvers.
 * Steps backward when threatened in melee, holds ground in optimal firing sweet spot with clear LOS,
 * and repositions towards targets when out of range or obstructed by walls.
 */
export function executeKitingMovement(params: KitingMovementParams): boolean {
  const {
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
  } = params;

  const preferredRange = Math.min(4, Math.max(3, e.range || 3));
  const curDistToTarget = Math.abs(chaseTargetX - e.x) + Math.abs(chaseTargetY - e.y);
  const targetHasLOS = hasLineOfSight(e.x, e.y, chaseTargetX, chaseTargetY, prev.map);

  // If target is too close in melee (<= 2 tiles), kite backwards/away to maintain firing distance
  if (curDistToTarget <= 2) {
    const retreatDirs = [
      {
        x: e.x + (e.x > chaseTargetX ? 1 : e.x < chaseTargetX ? -1 : 0),
        y: e.y + (e.y > chaseTargetY ? 1 : e.y < chaseTargetY ? -1 : 0)
      },
      { x: e.x + (e.x > chaseTargetX ? 1 : -1), y: e.y },
      { x: e.x, y: e.y + (e.y > chaseTargetY ? 1 : -1) },
      { x: e.x + 1, y: e.y },
      { x: e.x - 1, y: e.y },
      { x: e.x, y: e.y + 1 },
      { x: e.x, y: e.y - 1 }
    ];

    let bestKiteStep: { x: number; y: number } | null = null;
    let maxKiteDist = curDistToTarget;

    for (const step of retreatDirs) {
      if (step.x >= 0 && step.x < LEVEL_WIDTH && step.y >= 0 && step.y < LEVEL_HEIGHT) {
        const tile = prev.map[step.y]?.[step.x];
        const isWalkable = isTileWalkableForEntity(tile, {
          isWaterWalkable: e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso,
          canOpenDoors: false
        });
        const isBlocked =
          (step.x === px && step.y === py) ||
          updatedEnemiesList.some((other) => other.x === step.x && other.y === step.y) ||
          nextEnemies.some((other, idx) => idx > i && other.x === step.x && other.y === step.y);
        if (isWalkable && !isBlocked) {
          const newDist = Math.abs(chaseTargetX - step.x) + Math.abs(chaseTargetY - step.y);
          if (newDist > maxKiteDist) {
            maxKiteDist = newDist;
            bestKiteStep = step;
          }
        }
      }
    }

    if (bestKiteStep) {
      e.x = bestKiteStep.x;
      e.y = bestKiteStep.y;
      if (Math.random() < 0.2 && prev.visible[e.y]?.[e.x]) {
        staticLogs.push(`🏹 [TACTICAL KITE]: ${e.name} steps backward to maintain firing distance!`);
      }
      return true;
    }
  } else if (curDistToTarget >= 3 && curDistToTarget <= preferredRange && targetHasLOS) {
    // Ideal sweet spot firing position with clear line-of-sight: hold ground to shoot rather than walking into melee
    return true;
  } else {
    // Outside firing range or LOS broken by obstacles: advance towards firing range
    const nextStep = getNextStepTowards(e.x, e.y, chaseTargetX, chaseTargetY, prev.map, false, updatedEnemiesList, false);
    if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
      const isTileBlockedByEnemy =
        updatedEnemiesList.some((other) => other.x === nextStep.x && other.y === nextStep.y) ||
        nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
      const isTileWalkable = isTileWalkableForEntity(prev.map[nextStep.y]?.[nextStep.x], {
        isWaterWalkable: false,
        canOpenDoors: false
      });
      if (!isTileBlockedByEnemy && isTileWalkable) {
        e.x = nextStep.x;
        e.y = nextStep.y;
        return true;
      }
    }
  }

  return false;
}
