/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, PlayerStats } from '../types';

/**
 * Checks if the player is currently in god mode or invincible state.
 * When true, the player is completely immune to damage from enemy attacks,
 * environmental hazards (traps, lava, spikes), status afflictions (DoTs),
 * and self-inflicted recoil.
 */
export function isPlayerInvincible(
  gameState?: Partial<GameState> | null,
  playerStats?: Partial<PlayerStats> | null
): boolean {
  if (typeof window !== 'undefined') {
    if ((window as any).arenaGodModeActive || (window as any).isInvincibleActive) {
      return true;
    }
  }
  if (gameState?.godMode || gameState?.isInvincible) {
    return true;
  }
  if (playerStats?.isInvincible || gameState?.playerStats?.isInvincible) {
    return true;
  }
  return false;
}
