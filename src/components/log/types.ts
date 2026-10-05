/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameLogMessage } from '../../types';

export type LogFilterCategory = 'all' | 'combat' | 'story' | 'loot' | 'craft' | 'system';

export interface CollapsedLogEntry {
  log: GameLogMessage;
  count: number;
}

export interface EncounterTally {
  damageDealt: number;
  damageTaken: number;
  damageBlocked: number;
  enemiesDefeated: number;
  goldLooted: number;
  itemsLooted: number;
  lastCombatTime?: string;
}

export type PipCategory = 'danger' | 'combat' | 'heal' | 'story' | 'loot' | 'craft' | 'system' | 'neutral';
