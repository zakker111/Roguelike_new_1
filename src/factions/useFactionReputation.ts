/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { FACTIONS_DATABASE, normalizeFactionId } from '../data/factions';
import { factionMatrix } from './FactionMatrix';
import type { FactionId, FactionStandingInfo, FactionStandingTier } from './types';

export interface UseFactionReputationProps {
  factionReputation?: Record<string, number>;
  onReputationChange?: (factionId: FactionId, delta: number, newScore: number) => void;
  addLogMessage?: (message: string, type?: 'system' | 'combat' | 'lore' | 'loot') => void;
}

export function useFactionReputation({
  factionReputation = {},
  onReputationChange,
  addLogMessage,
}: UseFactionReputationProps = {}) {
  /**
   * Retrieves player's numerical score (-100 to 100) with a specific faction
   */
  const getReputationScore = useCallback(
    (factionId: FactionId): number => {
      const norm = normalizeFactionId(factionId);
      // Fallback aliases
      if (factionReputation[norm] !== undefined) return factionReputation[norm];
      if (norm === 'iron_vanguard' && factionReputation['vanguard'] !== undefined) return factionReputation['vanguard'];
      if (norm === 'shadow_syndicate' && factionReputation['syndicate'] !== undefined) return factionReputation['syndicate'];
      if (norm === 'outlaw_bandits' && factionReputation['bandits'] !== undefined) return factionReputation['bandits'];
      if (norm === 'outlaw_bandits' && factionReputation['outlaw'] !== undefined) return factionReputation['outlaw'];
      return 0;
    },
    [factionReputation]
  );

  /**
   * Retrieves full structured standing info for a specific faction
   */
  const getStanding = useCallback(
    (factionId: FactionId): FactionStandingInfo => {
      const score = getReputationScore(factionId);
      return factionMatrix.getStandingInfo(factionId, score);
    },
    [getReputationScore]
  );

  /**
   * Retrieves comprehensive standings for all registered factions
   */
  const allStandings = useMemo<FactionStandingInfo[]>(() => {
    return FACTIONS_DATABASE.map(faction => {
      const score = getReputationScore(faction.id);
      return factionMatrix.getStandingInfo(faction.id, score);
    });
  }, [getReputationScore]);

  /**
   * Modifies player reputation with a faction and logs narrative feedback
   */
  const modifyReputation = useCallback(
    (factionId: FactionId, delta: number, reason?: string): number => {
      const norm = normalizeFactionId(factionId);
      const currentScore = getReputationScore(norm);
      const oldTier = factionMatrix.getStandingTier(currentScore);
      const newScore = Math.max(-100, Math.min(100, currentScore + delta));
      const newTier = factionMatrix.getStandingTier(newScore);

      if (onReputationChange) {
        onReputationChange(norm, delta, newScore);
      }

      if (addLogMessage) {
        const sign = delta > 0 ? `+${delta}` : `${delta}`;
        const factionDef = factionMatrix.getStandingInfo(norm);
        const reasonSuffix = reason ? ` (${reason})` : '';

        if (newTier !== oldTier) {
          const isPromotion = newScore > currentScore;
          const tierIcon = isPromotion ? '⭐' : '⚠️';
          addLogMessage(
            `${tierIcon} [FACTION STANDING SHIFT]: Your reputation with ${factionDef.name} is now **${newTier}** (${sign} -> ${newScore})${reasonSuffix}!`,
            isPromotion ? 'lore' : 'combat'
          );
        } else if (Math.abs(delta) >= 5) {
          addLogMessage(
            `🚩 [REPUTATION]: ${factionDef.name} ${sign} (${newScore}/100)${reasonSuffix}.`,
            delta > 0 ? 'lore' : 'combat'
          );
        }
      }

      return newScore;
    },
    [getReputationScore, onReputationChange, addLogMessage]
  );

  /**
   * Checks if player is treated as hostile by this faction
   */
  const isPlayerHostileTo = useCallback(
    (factionId: FactionId): boolean => {
      const standing = getStanding(factionId);
      return standing.tier === 'Hated';
    },
    [getStanding]
  );

  /**
   * Calculates merchant price discount multiplier based on reputation (0.75x to 1.30x)
   */
  const getPriceMultiplier = useCallback(
    (factionId: FactionId): number => {
      const standing = getStanding(factionId);
      switch (standing.tier) {
        case 'Revered':
          return 0.75; // -25% discount
        case 'Honored':
          return 0.85; // -15% discount
        case 'Friendly':
          return 0.90; // -10% discount
        case 'Neutral':
          return 1.0;
        case 'Unfriendly':
          return 1.25; // +25% markup
        case 'Hated':
          return 1.50; // Refuse trade / +50% black-market extortion
      }
    },
    [getStanding]
  );

  return {
    getReputationScore,
    getStanding,
    allStandings,
    modifyReputation,
    isPlayerHostileTo,
    getPriceMultiplier,
  };
}
