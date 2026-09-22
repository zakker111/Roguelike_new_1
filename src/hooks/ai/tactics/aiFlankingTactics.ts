/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, EnemyType, GameState } from '../../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../../utils/gameUtils';
import { getNextStepTowards, isTileWalkableForEntity } from '../../../utils/ai';

const PACK_ENEMY_TYPES: (EnemyType | string)[] = [
  EnemyType.Goblin,
  EnemyType.Bandit,
  EnemyType.LootGoblin,
  EnemyType.OrcBrute,
  EnemyType.Hiisi
];

/**
 * Checks if the enemy belongs to a pack-hunting archetype (wolves, bandits, goblins, orcs).
 */
export function isPackUnit(e: Enemy): boolean {
  return (
    PACK_ENEMY_TYPES.includes(e.type) ||
    /goblin|wolf|bandit|outlaw|raider|pack|beast|rogue|hiisi|orc/i.test(e.name)
  );
}

export interface FlankingMovementParams {
  e: Enemy;
  i: number;
  px: number;
  py: number;
  chaseTargetX: number;
  chaseTargetY: number;
  prev: GameState;
  nextEnemies: Enemy[];
  updatedEnemiesList: Enemy[];
}

/**
 * AI Strategy: Pack Flanking & Coordinated Surrounding.
 * Evaluates unoccupied cardinal flank positions around the target to encircle them
 * instead of stacking into single-file bottlenecks.
 */
export function executeFlankingMovement(params: FlankingMovementParams): boolean {
  const {
    e,
    i,
    px,
    py,
    chaseTargetX: initialChaseTargetX,
    chaseTargetY: initialChaseTargetY,
    prev,
    nextEnemies,
    updatedEnemiesList
  } = params;

  let chaseTargetX = initialChaseTargetX;
  let chaseTargetY = initialChaseTargetY;

  if (isPackUnit(e)) {
    const flankAngles = [
      { x: chaseTargetX, y: chaseTargetY - 1 },
      { x: chaseTargetX + 1, y: chaseTargetY },
      { x: chaseTargetX, y: chaseTargetY + 1 },
      { x: chaseTargetX - 1, y: chaseTargetY }
    ];

    let chosenFlank: { x: number; y: number } | null = null;
    for (const pos of flankAngles) {
      if (pos.x >= 0 && pos.x < LEVEL_WIDTH && pos.y >= 0 && pos.y < LEVEL_HEIGHT) {
        const tile = prev.map[pos.y]?.[pos.x];
        const isWalkable = isTileWalkableForEntity(tile, {
          isWaterWalkable: e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso,
          canOpenDoors: false
        });
        if (isWalkable) {
          const isOccupied =
            updatedEnemiesList.some((other) => other.x === pos.x && other.y === pos.y) ||
            nextEnemies.some((other, idx) => idx > i && other.x === pos.x && other.y === pos.y);
          if (!isOccupied) {
            chosenFlank = pos;
            break;
          }
        }
      }
    }

    if (chosenFlank) {
      chaseTargetX = chosenFlank.x;
      chaseTargetY = chosenFlank.y;
    }
  }

  const isWaterWalkable = e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso;
  const nextStep = getNextStepTowards(
    e.x,
    e.y,
    chaseTargetX,
    chaseTargetY,
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
      return true;
    }
  }

  return false;
}
