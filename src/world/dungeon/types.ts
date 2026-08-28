/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, Trap, Chest, Enemy, EnemyType, Follower, DungeonProp } from '../../types';

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  type?: 'standard' | 'circular' | 'pillared' | 'basin' | 'composite';
}

export interface BossTemplate {
  name: string;
  type: EnemyType;
  char: string;
  color: string;
  hpMultiplier: number;
  atkMultiplier: number;
  defBonus: number;
  speed: number;
  description: string;
}

export interface GeneratedDungeonLevel {
  map: TileType[][];
  playerX: number;
  playerY: number;
  traps: Trap[];
  chests: Chest[];
  enemies: Enemy[];
}
