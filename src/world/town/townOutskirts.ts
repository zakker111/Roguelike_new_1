/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, EnemyType, EnemyState, TileType } from '../../types';
import { getEnemyTemplate } from '../dungeon';

export function spawnTownOutskirtPests(
  enemies: Enemy[],
  map: TileType[][],
  chunkX: number,
  chunkY: number,
  width: number,
  height: number
): void {
  const outskirtPests = [
    { type: EnemyType.Rat, name: "Outskirt Border Rat", x: 3, y: 3 },
    { type: EnemyType.Slime, name: "Town Border Slime", x: 4, y: height - 4 },
    { type: EnemyType.Goblin, name: "Scavenger Goblin Raider", x: width - 4, y: 4 },
    { type: EnemyType.Spider, name: "Grass Spider Infiltrator", x: width - 4, y: height - 4 },
    { type: EnemyType.Rat, name: "Outskirt Field Mouse", x: 3, y: Math.floor(height / 2) },
    { type: EnemyType.Slime, name: "Border Well Slime", x: width - 4, y: Math.floor(height / 2) }
  ];

  outskirtPests.forEach((pest, idx) => {
    let pxPos = pest.x;
    let pyPos = pest.y;
    let safeFound = false;

    for (let r = 0; r < 5 && !safeFound; r++) {
      for (let dx = -r; dx <= r && !safeFound; dx++) {
        for (let dy = -r; dy <= r && !safeFound; dy++) {
          const tx = pxPos + dx;
          const ty = pyPos + dy;
          if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
            if (map[ty][tx] === TileType.Grass) {
              pxPos = tx;
              pyPos = ty;
              safeFound = true;
            }
          }
        }
      }
    }

    if (safeFound) {
      const template = getEnemyTemplate(pest.type);
      const baseHp = template.baseHp; 
      const baseAtk = template.baseAtk;
      const baseDef = template.baseDef;

      enemies.push({
        id: `town_pest_${chunkX}_${chunkY}_${idx}`,
        x: pxPos,
        y: pyPos,
        type: pest.type,
        name: pest.name,
        hp: baseHp,
        maxHp: baseHp,
        atk: baseAtk,
        def: baseDef,
        range: template.range !== undefined ? template.range : 1,
        speed: template.speed !== undefined ? template.speed : 1.0,
        color: template.color,
        char: template.char,
        state: EnemyState.Patrolling,
        isElite: false,
        difficultyTier: 'easy',
        patrolPath: [
          { x: pxPos, y: pyPos },
          { x: Math.max(1, pxPos - 2), y: pyPos },
          { x: Math.max(1, pxPos - 2), y: Math.max(1, pyPos - 2) },
          { x: pxPos, y: Math.max(1, pyPos - 2) }
        ],
        patrolIndex: 0,
        debuffs: []
      } as any);
    }
  });
}
