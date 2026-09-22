/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, GameState } from '../../../types';

export interface BossPerceptionParams {
  e: Enemy;
  prev: GameState;
  staticLogs: string[];
}

/**
 * AI Strategy: Boss & Elite Perception Shouts and Phase Warnings.
 * Triggers companion tactical alerts when confronting terrifying elite or boss monsters.
 */
export function checkElitePerceptionWarning(params: BossPerceptionParams): void {
  const { e, prev, staticLogs } = params;

  if (
    !e.hasWarnedElite &&
    (e.isBoss ||
      e.maxHp >= 75 ||
      e.name.toLowerCase().includes('commander') ||
      e.name.toLowerCase().includes('elite')) &&
    prev.followers &&
    prev.followers.length > 0
  ) {
    e.hasWarnedElite = true;
    const folName = prev.followers[0].name;
    staticLogs.push(`🛡️ ${folName}: "Master, heads up! An elite foe (${e.name}) is bearing down on us!"`);
  }
}
