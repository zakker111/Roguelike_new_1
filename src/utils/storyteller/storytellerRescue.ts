import { GameState } from '../../types';
import { GMState } from './types';

export interface RescueEvaluationResult {
  forceTrigger: boolean;
  forcedEncounterId: string | null;
}

/**
 * Evaluates whether the autonomous GM Storyteller should immediately intervene
 * to rescue a player in critical peril, wake an idle wanderer, or restore depleted mana.
 */
export function evaluatePityRescueAid(
  gameState: GameState,
  gmState: GMState,
  turnsSinceIntervention: number,
  hpRatio: number,
  px: number,
  py: number
): RescueEvaluationResult {
  const nextPersonality = gmState.personality;
  const mem = gmState.memories;

  if (turnsSinceIntervention > 60 || (hpRatio <= 0.20 && turnsSinceIntervention > 25)) {
    // A) Critical life-saving pity & rescue intervention: if HP is low/near death and not disabled
    if (
      hpRatio <= 0.20 &&
      Math.random() < 0.60 &&
      ['Benevolent', 'Intrigued', 'Apathetic'].includes(nextPersonality) &&
      !gmState.disableGifts
    ) {
      const adjacentEnemies = gameState.enemies.filter(
        e => !e.isFollower && !e.isTownGuard && Math.hypot(e.x - px, e.y - py) <= 2.2
      );
      return {
        forceTrigger: true,
        forcedEncounterId: adjacentEnemies.length > 0 ? 'ancestral_pity_shield' : 'healing_breeze'
      };
    }
    // B) Idle reaction: if player is idle for extremely long
    else if (mem.idleTurns >= 25 && ['Sadistic', 'Mischievous', 'Intrigued'].includes(nextPersonality)) {
      return {
        forceTrigger: true,
        forcedEncounterId: Math.random() > 0.5 ? 'void_ambush' : 'trap_shower'
      };
    }
    // C) Magical backup: if player spends all mana
    else if (
      gameState.playerStats.mp === 0 &&
      gameState.playerStats.maxMp >= 30 &&
      Math.random() < 0.15 &&
      !gmState.disableGifts
    ) {
      return {
        forceTrigger: true,
        forcedEncounterId: 'arcane_torrent'
      };
    }
  }

  return {
    forceTrigger: false,
    forcedEncounterId: null
  };
}
