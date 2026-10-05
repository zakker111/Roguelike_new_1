/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { GameState } from '../../types';
import { formatGameTime } from '../../utils/overworld';
import { analyzeCampsiteSurroundings, rollWildernessAmbush } from '../../utils/wildernessCamping';

export interface UseWildernessSleepParams {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound: (soundName: string) => void;
  setIsSleepOpen: (open: boolean) => void;
}

export function useWildernessSleep({
  setGameState,
  playSound,
  setIsSleepOpen,
}: UseWildernessSleepParams) {
  const handleConfirmSleep = useCallback((hours: number, hpHealed: number, mpHealed: number) => {
    setIsSleepOpen(false);

    setGameState((prev) => {
      const analysis = analyzeCampsiteSurroundings(prev);
      const ambushResult = rollWildernessAmbush(prev, hours, analysis);

      if (ambushResult.isAmbushed) {
        // Sleep interrupted by nocturnal ambush!
        const passedHours = ambushResult.interruptedHour;
        const advancedTime = (prev.gameTime + passedHours * 60) % 1440;
        const formattedTime = formatGameTime(advancedTime).timeStr;

        const partialHpRatio = passedHours / hours;
        const partialHp = Math.max(1, Math.round(hpHealed * partialHpRatio));
        const partialMp = Math.max(1, Math.round(mpHealed * partialHpRatio));

        const nextStats = {
          ...prev.playerStats,
          hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + partialHp),
          mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + partialMp),
          exhaustion: Math.max(0, (prev.playerStats.exhaustion || 0) - passedHours * 20),
        };

        playSound('bump');
        const nextLogs = [...prev.logs];
        nextLogs.push({
          id: `ambush_${Date.now()}`,
          text: ambushResult.alertMessage,
          type: 'danger' as const,
          timestamp: formattedTime,
        });

        // Add ambush predators to room
        const nextEnemies = [...prev.enemies, ...ambushResult.enemies];

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `💥 AMBUSH!`, type: 'crit' },
        });
        window.dispatchEvent(ev);

        return {
          ...prev,
          playerStats: nextStats,
          gameTime: advancedTime,
          enemies: nextEnemies,
          logs: nextLogs,
        };
      }

      // Peaceful sleep completed!
      const advancedTime = (prev.gameTime + hours * 60) % 1440;
      const formattedTime = formatGameTime(advancedTime).timeStr;

      const nextStats = {
        ...prev.playerStats,
        hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + hpHealed),
        mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + mpHealed),
        exhaustion: 0, // Fully purges exhaustion!
      };
      const currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      const nextRep = Math.min(100, currentRep + hours * 10);
      let nextGuardsHostile = prev.areGuardsHostile;
      const nextLogs = [...prev.logs];
      if (nextGuardsHostile && nextRep >= 50) {
        nextGuardsHostile = false;
        nextLogs.push({
          id: `pardon_${Date.now()}`,
          text: `⚖️ [TOWN NOTICE]: Your crimes have been pardoned over your period of rest! Town guards are no longer hostile.`,
          type: 'info' as const,
          timestamp: formattedTime,
        });
      }

      // Add positive resting buff based on shelter
      let restingBuff = prev.activeFoodBuff;
      if (analysis.shelterType === 'field_tent') {
        restingBuff = {
          name: '⛺ Insulated Field Rest',
          description: 'Refreshed and insulated from the elements. +2 Defense and +1 Movement Speed.',
          atkBonus: 0,
          defBonus: 2,
          critBonus: 0,
          speedBonus: 1,
          turnsRemaining: 50,
        };
      } else if (analysis.shelterType === 'campfire') {
        restingBuff = {
          name: '🔥 Campfire Hearth Warmth',
          description: 'Basked in the soothing heat of the campfire. +3 Attack Power.',
          atkBonus: 3,
          defBonus: 0,
          critBonus: 0.05,
          speedBonus: 0,
          turnsRemaining: 40,
        };
      }

      playSound('loot');
      nextLogs.push({
        id: `rest_${Date.now()}`,
        text: `🛏️ [${analysis.title}]: You slept peacefully for ${hours} hour(s) until ${formattedTime}. Restored +${hpHealed} HP and +${mpHealed} MP!`,
        type: 'loot' as const,
        timestamp: formattedTime,
      });

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `Rested +${hpHealed} HP! 💤`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        playerStats: nextStats,
        gameTime: advancedTime,
        townReputation: nextRep,
        areGuardsHostile: nextGuardsHostile,
        activeFoodBuff: restingBuff,
        logs: nextLogs,
      };
    });
  }, [setIsSleepOpen, setGameState, playSound]);

  return {
    handleConfirmSleep,
  };
}
