/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyType } from '../../../types';
import { isPlayerInvincible } from '../../../utils/invincibility';
import { AITacticContext, AITacticResult, safeDispatchEffect } from './types';

/**
 * AI Strategy: Telegraphed Attack Resolution & Windup Mechanics.
 * Heavy bosses and brutes wind up high-damage ground strikes with a 1-turn warning, allowing the player to dodge or brace.
 */

/**
 * Resolves an active telegraphed attack if one is currently in progress.
 */
export function resolveTelegraphedAttack(ctx: AITacticContext): AITacticResult | null {
  const { e, px, py, prev, staticLogs, playSound } = ctx;

  if (!e.telegraphedAttack) {
    return null;
  }

  let playerHp = ctx.playerHp;
  let incomingPlayerDamage = ctx.incomingPlayerDamage;
  let incomingPlayerHits = ctx.incomingPlayerHits;
  let hadPlayerBrace = ctx.hadPlayerBrace;

  const attack = e.telegraphedAttack;
  attack.turnsRemaining -= 1;

  if (attack.turnsRemaining <= 0) {
    const tx = attack.targetX;
    const ty = attack.targetY;
    const dmg = attack.damage;

    if (px === tx && py === ty) {
      if (isPlayerInvincible(prev, prev.playerStats)) {
        staticLogs.push(`🛡️ [GOD MODE]: You are invincible! ${e.name}'s ${attack.name} strikes your divine shield for 0 damage!`);
        playSound('shield');
        safeDispatchEffect({ x: tx, y: ty, text: `🛡️ IMMUNE`, type: 'heal' });
      } else if (prev.isBraced) {
        const reducedDmg = Math.max(1, Math.floor(dmg * 0.25));
        playerHp = Math.max(0, playerHp - reducedDmg);
        incomingPlayerDamage += reducedDmg;
        incomingPlayerHits += 1;
        hadPlayerBrace = true;
        const curStagger = e.staggerMeter || 0;
        const maxStag = e.maxStaggerMeter || (e.isBoss ? 120 : e.isElite ? 75 : 45);
        e.staggerMeter = Math.min(maxStag, curStagger + 35);
        if (e.staggerMeter >= maxStag && !e.isStaggered) {
          e.isStaggered = true;
          e.staggerTurns = 2;
        }
        staticLogs.push(
          `🛡️ [PERFECT BRACE]: You braced firmly against ${e.name}'s ${attack.name}! Absorbed 75% of damage (-${reducedDmg} HP) and counter-staggered the attacker!`
        );
        playSound('shield');
      } else {
        playerHp = Math.max(0, playerHp - dmg);
        incomingPlayerDamage += dmg;
        incomingPlayerHits += 1;
        staticLogs.push(`💥 [TELEGRAPHED IMPACT]: ${e.name}'s heavy ${attack.name} smashes you at (${tx}, ${ty}) for -${dmg} HP!`);
        playSound('injury');
      }
    } else {
      staticLogs.push(`💨 [TACTICAL DODGE]: ${e.name}'s ${attack.name} smashes empty ground at (${tx}, ${ty}) as you dodged out of danger!`);
      playSound('bump');
      safeDispatchEffect({ x: tx, y: ty, text: `💨 DODGED!`, type: 'heal' });
    }

    e.telegraphedAttack = null;

    return {
      handled: true,
      actionResult: {
        e,
        playerHp,
        nextArmor: ctx.nextArmor,
        nextHelmet: ctx.nextHelmet,
        nextGloves: ctx.nextGloves,
        nextBoots: ctx.nextBoots,
        nextShield: ctx.nextShield,
        activeScars: ctx.activeScars,
        updatedEffects: ctx.updatedEffects,
        nextCaravanTravel: ctx.nextCaravanTravel,
        nextDefeatedCounts: ctx.nextDefeatedCounts,
        incomingPlayerDamage,
        incomingPlayerHits,
        hadPlayerCrit: ctx.hadPlayerCrit,
        hadPlayerBrace,
        lastAttackerX: ctx.lastAttackerX,
        lastAttackerY: ctx.lastAttackerY
      }
    };
  }

  return null;
}

/**
 * Evaluates whether a heavy or boss enemy winds up a telegraphed attack instead of a normal attack.
 */
export function checkTelegraphWindup(ctx: AITacticContext): AITacticResult | null {
  const { e, px, py, staticLogs, playSound } = ctx;

  const isHeavy =
    e.isBoss ||
    e.isElite ||
    e.type === EnemyType.OrcBrute ||
    e.type === EnemyType.Dragon ||
    e.type === EnemyType.DreadKnight ||
    e.type === EnemyType.Louhi ||
    e.type === EnemyType.IkuTurso;

  const telegraphChance = isHeavy ? 0.35 : 0.18;

  if (!e.telegraphedAttack && Math.random() < telegraphChance) {
    const atkName = e.isBoss ? 'Sunder Titan Slam' : isHeavy ? 'Brutal Heavy Cleave' : 'Heavy Ground Strike';
    e.telegraphedAttack = {
      targetX: px,
      targetY: py,
      turnsRemaining: 1,
      damage: Math.round(e.atk * 1.6),
      name: atkName
    };
    staticLogs.push(`⚠️ [TELEGRAPH WARNING]: ${e.name} winds up ${atkName} targeting (${px}, ${py})! Move away or BRACE (B) to block!`);
    playSound('alert');
    safeDispatchEffect({ x: e.x, y: e.y, text: `⚠️ TELEGRAPHING!`, type: 'dmg' });

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

  return null;
}
