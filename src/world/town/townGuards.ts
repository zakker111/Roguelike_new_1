/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, EnemyType, EnemyState, TileType } from '../../types';

export function setupBarracksBeds(map: TileType[][], barracksHouse: any): void {
  if (barracksHouse && map) {
    const bY = barracksHouse.y + 1;
    if (bY > 0 && bY < map.length - 1) {
      [2, 4, 6, 8].forEach(offsetX => {
        const bX = barracksHouse.x + offsetX;
        if (bX > 0 && bX < map[0].length - 1) {
          map[bY][bX] = TileType.Bed;
        }
      });
    }
  }
}

export function spawnTownGuards(
  enemies: Enemy[],
  chunkX: number,
  chunkY: number,
  width: number,
  height: number,
  midX: number,
  midY: number,
  isCastleTown: boolean,
  barracksHouse: any
): void {
  const bBed1 = { x: barracksHouse.x + 2, y: barracksHouse.y + 1 };
  const bBed2 = { x: barracksHouse.x + 4, y: barracksHouse.y + 1 };
  const bBed3 = { x: barracksHouse.x + 6, y: barracksHouse.y + 1 };

  if (isCastleTown) {
    const guardPositions = [
      { x: 3, y: midY - 2, role: 'Archer', name: 'Castle Archer Sentry', shift: 'sentry' as const, bed: bBed1 },
      { x: width - 6, y: midY - 2, role: 'Archer', name: 'Castle Archer Sentry', shift: 'sentry' as const, bed: bBed2 },
      { x: midX - 3, y: 3, role: 'Crossbowman', name: 'Gate Crossbow Sentry', shift: 'sentry' as const, bed: bBed3 },
      { x: midX + 3, y: height - 4, role: 'Crossbowman', name: 'Gate Crossbow Sentry', shift: 'sentry' as const, bed: bBed1 },
      { x: midX - 4, y: midY, role: 'Swordsman', name: 'Courtyard Day Guard', shift: 'day' as const, bed: bBed2 },
      { x: barracksHouse.x + 4, y: barracksHouse.y - 1, role: 'Swordsman', name: 'Keep Night Guard', shift: 'night' as const, bed: bBed3 }
    ];

    guardPositions.forEach((g, idx) => {
      let hp = 45;
      let atk = 6;
      let def = 4;
      let range = 1;
      let speed = 1;
      let color = '#3b82f6';
      let char = '🛡';

      if (g.role === 'Archer') {
        hp = 42;
        atk = 8;
        def = 3;
        range = 4;
        speed = 1;
        color = '#10b981';
        char = '🏹';
      } else if (g.role === 'Crossbowman') {
        hp = 52;
        atk = 12;
        def = 4;
        range = 3;
        speed = 2;
        color = '#a855f7';
        char = '🏹';
      } else {
        hp = 65;
        atk = 9;
        def = 7;
        range = 1;
        speed = 1;
        color = '#2563eb';
        char = '⚔️';
      }

      enemies.push({
        id: `castle_guard_${chunkX}_${chunkY}_${idx + 1}`,
        x: g.x,
        y: g.y,
        type: EnemyType.Goblin,
        name: g.name,
        hp,
        maxHp: hp,
        atk,
        def,
        range,
        speed,
        color,
        char,
        originalChar: char,
        state: EnemyState.Patrolling,
        isElite: false,
        shift: g.shift,
        barracksBed: g.bed,
        patrolPath: [
          { x: g.x, y: g.y },
          { x: g.x + (g.role === 'Swordsman' ? 6 : 2), y: g.y },
          { x: g.x, y: g.y },
          { x: g.x - (g.role === 'Swordsman' ? 6 : 2), y: g.y }
        ],
        patrolIndex: 0,
        debuffs: [],
        isTownGuard: true
      } as any);
    });
  } else {
    // Village standard guards
    enemies.push({
      id: `town_guard_${chunkX}_${chunkY}_1`,
      x: midX - 3,
      y: midY,
      type: EnemyType.Goblin,
      name: "Day Patrol Guard",
      hp: 45,
      maxHp: 45,
      atk: 6,
      def: 4,
      range: 1,
      speed: 1,
      color: '#3b82f6',
      char: '🛡',
      originalChar: '🛡',
      state: EnemyState.Patrolling,
      isElite: false,
      shift: 'day',
      barracksBed: bBed1,
      patrolPath: [
        { x: midX - 8, y: midY },
        { x: midX + 8, y: midY },
        { x: midX, y: midY - 4 },
        { x: midX, y: midY + 4 }
      ],
      patrolIndex: 0,
      debuffs: [],
      isTownGuard: true
    } as any);

    enemies.push({
      id: `town_guard_${chunkX}_${chunkY}_2`,
      x: midX + 3,
      y: midY + 1,
      type: EnemyType.Goblin,
      name: "Night Patrol Guard",
      hp: 45,
      maxHp: 45,
      atk: 6,
      def: 4,
      range: 1,
      speed: 1,
      color: '#3b82f6',
      char: '🛡',
      originalChar: '🛡',
      state: EnemyState.Patrolling,
      isElite: false,
      shift: 'night',
      barracksBed: bBed2,
      patrolPath: [
        { x: midX + 5, y: midY + 5 },
        { x: midX - 5, y: midY - 5 },
        { x: midX + 5, y: midY - 5 },
        { x: midX - 5, y: midY + 5 }
      ],
      patrolIndex: 0,
      debuffs: [],
      isTownGuard: true
    } as any);

    enemies.push({
      id: `town_guard_${chunkX}_${chunkY}_3`,
      x: midX,
      y: midY + 5,
      type: EnemyType.Goblin,
      name: "Gate Sentry",
      hp: 50,
      maxHp: 50,
      atk: 7,
      def: 5,
      range: 1,
      speed: 1,
      color: '#2563eb',
      char: '🛡',
      originalChar: '🛡',
      state: EnemyState.Patrolling,
      isElite: false,
      shift: 'sentry',
      barracksBed: bBed3,
      patrolPath: [
        { x: midX - 3, y: midY + 5 },
        { x: midX + 3, y: midY + 5 }
      ],
      patrolIndex: 0,
      debuffs: [],
      isTownGuard: true
    } as any);
  }
}
