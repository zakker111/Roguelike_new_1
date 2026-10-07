/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, Chest, Trap, DungeonProp } from '../../types';

export type SkirmishScenarioType = 'active_plaza_melee' | 'high_ground_ambush' | 'base_siege_redoubt';

export interface EmergentSkirmishConfig {
  chunkX: number;
  chunkY: number;
  width: number;
  height: number;
  playerLevel?: number;
  chaosScore?: number;
}

export interface EmergentSkirmishResult {
  scenario: SkirmishScenarioType;
  name: string;
  description: string;
  enemies: Enemy[];
  chests: Chest[];
  traps: Trap[];
  props: DungeonProp[];
  centerX: number;
  centerY: number;
  factionA?: string;
  factionB?: string;
}
