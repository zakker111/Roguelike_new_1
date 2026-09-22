/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, EnemyType } from '../../../types';
import { AITacticContext, AITacticResult, safeDispatchEffect } from './types';

/**
 * AI Strategy: Support Healer & Buffer Phase.
 * Channels restorative healing into wounded allies and casts bloodlust incantations on heavy/elite allies.
 */
export function executeSupportTactics(ctx: AITacticContext): AITacticResult | null {
  const {
    e,
    i,
    px,
    py,
    prev,
    nextEnemies,
    updatedEnemiesList,
    staticLogs,
    playSound,
    isHostile
  } = ctx;

  if (e.supportSpellCooldown && e.supportSpellCooldown > 0) {
    e.supportSpellCooldown -= 1;
  }

  const isSupportUnit =
    e.aiRole === 'support_healer' ||
    e.aiRole === 'support_buffer' ||
    e.type === EnemyType.Necromancer ||
    e.type === EnemyType.Tidecaller ||
    /shaman|cleric|priest|druid|healer|apothecary|witch/i.test(e.name);

  if (!isHostile || !isSupportUnit || (e.supportSpellCooldown && e.supportSpellCooldown > 0)) {
    return null;
  }

  // 1. Scan for wounded allies to heal
  let mostWoundedAlly: Enemy | null = null;
  let lowestHpRatio = 0.75;

  for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
    if (targetIdx === i) continue;
    const ally = nextEnemies[targetIdx];
    if (ally.hp > 0 && !ally.isFollower && !ally.isTownGuard) {
      const allyDist = Math.abs(ally.x - e.x) + Math.abs(ally.y - e.y);
      if (allyDist <= 6) {
        const ratio = ally.hp / ally.maxHp;
        if (ratio < lowestHpRatio) {
          lowestHpRatio = ratio;
          mostWoundedAlly = ally;
        }
      }
    }
  }

  if (mostWoundedAlly) {
    const healAmt = Math.max(8, Math.round(e.atk * 1.5 + (e.isBoss ? 25 : 8)));
    mostWoundedAlly.hp = Math.min(mostWoundedAlly.maxHp, mostWoundedAlly.hp + healAmt);

    const ueIdx = updatedEnemiesList.findIndex((item) => item.id === mostWoundedAlly!.id);
    if (ueIdx !== -1) {
      updatedEnemiesList[ueIdx].hp = mostWoundedAlly.hp;
    }

    e.supportSpellCooldown = 3;
    const isVisible =
      (prev.visible[e.y]?.[e.x] ?? false) || (prev.visible[mostWoundedAlly.y]?.[mostWoundedAlly.x] ?? false);
    if (isVisible) {
      staticLogs.push(`✨ [SUPPORT HEAL]: ${e.name} channels restorative healing into ${mostWoundedAlly.name} (+${healAmt} HP)!`);
      playSound('potion', { x: mostWoundedAlly.x, y: mostWoundedAlly.y, playerX: px, playerY: py });
      safeDispatchEffect({
        x: mostWoundedAlly.x,
        y: mostWoundedAlly.y,
        sourceX: e.x,
        sourceY: e.y,
        text: `+${healAmt} HP`,
        type: 'heal'
      });
    }

    return {
      handled: true,
      actionResult: {
        e,
        playerHp: ctx.playerHp,
        nextArmor: ctx.nextArmor,
        nextHelmet: ctx.nextHelmet,
        nextGloves: ctx.nextGloves,
        nextBoots: ctx.nextBoots,
        nextShield: ctx.nextShield,
        activeScars: ctx.activeScars,
        updatedEffects: ctx.updatedEffects,
        nextCaravanTravel: ctx.nextCaravanTravel,
        nextDefeatedCounts: ctx.nextDefeatedCounts,
        incomingPlayerDamage: ctx.incomingPlayerDamage,
        incomingPlayerHits: ctx.incomingPlayerHits,
        hadPlayerCrit: ctx.hadPlayerCrit,
        hadPlayerBrace: ctx.hadPlayerBrace,
        lastAttackerX: ctx.lastAttackerX,
        lastAttackerY: ctx.lastAttackerY
      }
    };
  }

  // 2. Scan for heavy/elite allies to buff
  if (Math.random() < 0.45) {
    let buffTarget: Enemy | null = null;
    for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
      const ally = nextEnemies[targetIdx];
      if (ally.hp > 0 && !ally.isFollower && !ally.isTownGuard) {
        const allyDist = Math.abs(ally.x - e.x) + Math.abs(ally.y - e.y);
        if (allyDist <= 5 && (ally.isBoss || ally.isElite || ally.maxHp >= 30 || ally.id === e.id)) {
          buffTarget = ally;
          break;
        }
      }
    }

    if (buffTarget) {
      buffTarget.atk = Math.round(buffTarget.atk + 2);
      buffTarget.def = Math.round(buffTarget.def + 2);
      e.supportSpellCooldown = 4;
      const isVisible =
        (prev.visible[e.y]?.[e.x] ?? false) || (prev.visible[buffTarget.y]?.[buffTarget.x] ?? false);
      if (isVisible) {
        staticLogs.push(`🔮 [SUPPORT BUFF]: ${e.name} chants an incantation of Bloodlust on ${buffTarget.name} (+2 ATK, +2 DEF)!`);
        playSound('magic', { x: buffTarget.x, y: buffTarget.y, playerX: px, playerY: py });
        safeDispatchEffect({
          x: buffTarget.x,
          y: buffTarget.y,
          sourceX: e.x,
          sourceY: e.y,
          text: `⚡ BUFFED!`,
          type: 'heal'
        });
      }

      return {
        handled: true,
        actionResult: {
          e,
          playerHp: ctx.playerHp,
          nextArmor: ctx.nextArmor,
          nextHelmet: ctx.nextHelmet,
          nextGloves: ctx.nextGloves,
          nextBoots: ctx.nextBoots,
          nextShield: ctx.nextShield,
          activeScars: ctx.activeScars,
          updatedEffects: ctx.updatedEffects,
          nextCaravanTravel: ctx.nextCaravanTravel,
          nextDefeatedCounts: ctx.nextDefeatedCounts,
          incomingPlayerDamage: ctx.incomingPlayerDamage,
          incomingPlayerHits: ctx.incomingPlayerHits,
          hadPlayerCrit: ctx.hadPlayerCrit,
          hadPlayerBrace: ctx.hadPlayerBrace,
          lastAttackerX: ctx.lastAttackerX,
          lastAttackerY: ctx.lastAttackerY
        }
      };
    }
  }

  return null;
}
