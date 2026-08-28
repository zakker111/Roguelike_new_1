import { Enemy, CaravanTravelState, PlayerStats } from '../../types';

export interface CombatAggregatorParams {
  px: number;
  py: number;
  incomingPlayerDamage: number;
  incomingPlayerHits: number;
  hadPlayerCrit: boolean;
  hadPlayerBrace: boolean;
  lastAttackerX?: number;
  lastAttackerY?: number;
}

export function emitAggregatedDamageFloater({
  px,
  py,
  incomingPlayerDamage,
  incomingPlayerHits,
  hadPlayerCrit,
  hadPlayerBrace,
  lastAttackerX,
  lastAttackerY,
}: CombatAggregatorParams) {
  if (incomingPlayerHits <= 0) return;

  let effectText = `-${incomingPlayerDamage} HP`;
  if (incomingPlayerHits > 1) {
    effectText = `-${incomingPlayerDamage} HP (${incomingPlayerHits} hits)`;
  } else if (hadPlayerBrace) {
    effectText = `🛡️ BRACED (-${incomingPlayerDamage})`;
  } else if (hadPlayerCrit) {
    effectText = `💥 CRIT (-${incomingPlayerDamage})`;
  }

  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    const effectEv = new CustomEvent('spawn-game-effect', {
      detail: {
        x: px,
        y: py,
        sourceX: lastAttackerX,
        sourceY: lastAttackerY,
        text: effectText,
        type: hadPlayerCrit ? 'crit' : 'dmg'
      }
    });
    window.dispatchEvent(effectEv);
  }
}

export function checkTacticalCaravanVictory(
  nextCaravanTravel: CaravanTravelState | undefined,
  nextEnemies: Enemy[],
  updatedStats: PlayerStats,
  staticLogs: string[],
  playSound: (soundName: string, options?: any) => void
): {
  nextCaravanTravel?: CaravanTravelState;
  updatedStats: PlayerStats;
} {
  if (!nextCaravanTravel?.active || !nextCaravanTravel.isTacticalCombat) {
    return { nextCaravanTravel, updatedStats };
  }

  const hostilesAlive = nextEnemies.filter(e => !e.isFollower && !e.isTownGuard && e.hp > 0);
  if (hostilesAlive.length === 0) {
    const curEnc = nextCaravanTravel.currentEncounter;
    if (curEnc && !curEnc.resolved) {
      const bonusGold = curEnc.isBossAmbush ? 250 : 125;
      const bonusXp = curEnc.isBossAmbush ? 200 : 100;
      staticLogs.push(`🏆 [TACTICAL VICTORY]: All attackers defeated! The merchant wagon was triumphantly defended! (+${bonusGold} Gold, +${bonusXp} XP)`);
      playSound('victory');
      
      const newStats = {
        ...updatedStats,
        gold: updatedStats.gold + bonusGold,
        xp: updatedStats.xp + bonusXp
      };

      const updatedTravel: CaravanTravelState = {
        ...nextCaravanTravel,
        isTacticalCombat: false,
        rewardGold: nextCaravanTravel.rewardGold + bonusGold,
        currentEncounter: {
          ...curEnc,
          resolved: true,
          resultLog: `🏆 TACTICAL VICTORY! Slew all ambushers on the skirmish map! Hull HP preserved: ${nextCaravanTravel.wagonHp || 100}/${nextCaravanTravel.maxWagonHp || 100}`
        }
      };

      return {
        nextCaravanTravel: updatedTravel,
        updatedStats: newStats
      };
    }
  }

  return { nextCaravanTravel, updatedStats };
}
