/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyType } from '../../../types';
import { isLunarBlessingActive } from '../../../utils/gameUtils';
import { getEffectiveStats, evaluateScarAcquisition } from '../../../utils/scars';
import { getItemDurabilityDecay } from '../../../utils/spellsAndEquipment';
import { calculateArchetypeDamageAdjustment } from '../../../utils/combatArchetypes';
import { isPlayerInvincible } from '../../../utils/invincibility';
import { AITacticContext, AITacticResult, safeDispatchEffect, safeDispatchProjectile } from './types';

/**
 * AI Strategy: Direct Player Attack Execution.
 * Resolves evasion, damage mitigation, critical strikes, projectile dispatch, vampiric leech, venom, durability, and scars.
 */
export function executePlayerAttackTactics(ctx: AITacticContext): AITacticResult {
  const {
    e,
    px,
    py,
    prev,
    updatedStats,
    staticLogs,
    playSound
  } = ctx;

  let playerHp = ctx.playerHp;
  let nextArmor = ctx.nextArmor;
  let nextHelmet = ctx.nextHelmet;
  let nextGloves = ctx.nextGloves;
  let nextBoots = ctx.nextBoots;
  let nextShield = ctx.nextShield;
  const activeScars = [...ctx.activeScars];
  const updatedEffects = [...ctx.updatedEffects];
  let incomingPlayerDamage = ctx.incomingPlayerDamage;
  let incomingPlayerHits = ctx.incomingPlayerHits;
  let hadPlayerCrit = ctx.hadPlayerCrit;
  let hadPlayerBrace = ctx.hadPlayerBrace;
  let lastAttackerX = ctx.lastAttackerX;
  let lastAttackerY = ctx.lastAttackerY;

  let lunarDodgeBonus = 0;
  if (isLunarBlessingActive(prev, 'new_moon')) lunarDodgeBonus = 0.15;
  else if (isLunarBlessingActive(prev, 'waxing_crescent')) lunarDodgeBonus = 0.1;

  const effectiveDex = getEffectiveStats(prev.playerStats).dex || 10;
  const dodgeChance = Math.min(0.5, Math.max(0, (effectiveDex - 10) * 0.02 + lunarDodgeBonus));

  if (Math.random() < dodgeChance) {
    staticLogs.push(`💨 You dodged ${e.name}'s attack!`);
    playSound('bump');
  } else {
    let baseAtk = e.atk;
    if (e.affixes?.includes('berserker') && e.hp < e.maxHp * 0.5) {
      baseAtk = Math.round(baseAtk * 1.5);
      staticLogs.push(`🩸 [BERSERKER RAGE]: ${e.name} strikes with frenzied rage (+50% DMG)!`);
    }

    const effectiveDef = getEffectiveStats(prev.playerStats).def || 0;
    const totalArmorDef =
      (nextArmor?.defense || 0) +
      (nextHelmet?.defense || 0) +
      (nextGloves?.defense || 0) +
      (nextBoots?.defense || 0) +
      (nextShield?.defense || 0) +
      effectiveDef;

    let penPercent = (e.armorPenetrationPercent || 0) + (e.affixes?.includes('shieldbreaker') ? 0.5 : 0);
    penPercent = Math.min(0.85, penPercent);

    const braceMult = prev.isBraced ? 2.0 : 1.0;
    const netArmorDef = Math.floor(totalArmorDef * (1.0 - penPercent));
    const absorbedDef = Math.floor(netArmorDef * braceMult);
    const rawStrike = Math.max(1, baseAtk - absorbedDef);

    if (isPlayerInvincible(prev, prev.playerStats)) {
      staticLogs.push(`🛡️ [GOD MODE]: ${e.name}'s attack strikes your divine shield for 0 damage!`);
      playSound('shield');
      safeDispatchEffect({ x: px, y: py, text: `🛡️ IMMUNE`, type: 'heal' });
      return {
        handled: true,
        actionResult: {
          e,
          playerHp,
          nextArmor,
          nextHelmet,
          nextGloves,
          nextBoots,
          nextShield,
          activeScars,
          updatedEffects,
          nextCaravanTravel: ctx.nextCaravanTravel,
          nextDefeatedCounts: ctx.nextDefeatedCounts,
          incomingPlayerDamage: 0,
          incomingPlayerHits: 0,
          hadPlayerCrit: false,
          hadPlayerBrace: false,
          lastAttackerX: e.x,
          lastAttackerY: e.y
        }
      };
    }

    if (penPercent > 0) {
      staticLogs.push(`⚡ [ARMOR PENETRATION]: ${e.name}'s strike bypassed ${Math.round(penPercent * 100)}% of your armor!`);
    }

    const isCritHit = Math.random() < 0.15;
    const archetypeAdj = calculateArchetypeDamageAdjustment(
      { archetype: e.archetype, isCrit: isCritHit },
      null,
      rawStrike
    );
    let sniperBonus = 0;
    const distToP = Math.hypot(px - e.x, py - e.y);
    if (e.isHighGroundSniper && distToP > 1.5) {
      sniperBonus = 2;
      staticLogs.push(`🏹 [HIGH-GROUND SNIPER]: ${e.name} fires a precision bolt from the elevated barricade perch! (+2 Pierce DMG)`);
    }

    const strikeDmg = archetypeAdj.damage + sniperBonus;
    if (archetypeAdj.logNote) {
      staticLogs.push(archetypeAdj.logNote);
    }

    playerHp = Math.max(0, playerHp - strikeDmg);
    incomingPlayerDamage += strikeDmg;
    incomingPlayerHits += 1;
    lastAttackerX = e.x;
    lastAttackerY = e.y;
    if (isCritHit) hadPlayerCrit = true;
    if (prev.isBraced) hadPlayerBrace = true;

    staticLogs.push(`⚔️ ${e.name} attacks you for -${strikeDmg} HP!`);
    playSound('injury');

    if (distToP > 1.5) {
      let enemyProjType = 'arrow';
      let enemyProjColor = '#d97706';
      if (e.type === EnemyType.SkeletonMage || /mage|wizard|sorcerer|spell/i.test(e.name)) {
        enemyProjType = 'skeleton_bolt';
        enemyProjColor = '#38bdf8';
      } else if (e.type === EnemyType.Necromancer || /void|warlock|cultist|shadow/i.test(e.name)) {
        enemyProjType = 'void_siphon';
        enemyProjColor = '#a855f7';
      } else if (/fire|dragon|imp|demon/i.test(e.name)) {
        enemyProjType = 'fireball';
        enemyProjColor = '#f97316';
      }

      safeDispatchProjectile({
        startX: e.x,
        startY: e.y,
        targetX: px,
        targetY: py,
        color: enemyProjColor,
        projectileType: enemyProjType,
        impactText: isCritHit ? `CRIT! -${strikeDmg} HP` : `-${strikeDmg} HP`,
        impactType: isCritHit ? 'crit' : 'dmg'
      });
    }

    if (e.affixes?.includes('vampiric') && strikeDmg > 0) {
      const leech = Math.max(1, Math.floor(strikeDmg * 0.4));
      e.hp = Math.min(e.maxHp, e.hp + leech);
      staticLogs.push(`🧛 [VAMPIRIC DRAIN]: ${e.name} drained +${leech} HP from you!`);
    }

    if (e.affixes?.includes('venomous') && Math.random() < 0.75) {
      updatedEffects.push({
        id: 'venom_dot_' + Date.now() + Math.random(),
        name: 'Toxic Venom',
        type: 'debuff',
        icon: '☠️',
        description: 'Infected with toxic venom (-3 HP/turn)',
        turnsRemaining: 3,
        color: '#10b981',
        damagePerTurn: 3
      });
      staticLogs.push(`☠️ [VENOMOUS STRIKE]: ${e.name} infected you with toxic venom! (-3 HP/turn)`);
    }

    if (nextArmor && Math.random() < 0.25) {
      const decayAmt = getItemDurabilityDecay(nextArmor, 1);
      const curDur = nextArmor.durability ?? nextArmor.maxDurability ?? 100;
      const newDur = Math.max(0, curDur - decayAmt);
      nextArmor = { ...nextArmor, durability: newDur };
      if (newDur === 0) {
        staticLogs.push(`🛡️ [EQUIPMENT BROKEN]: Your ${nextArmor.name} has broken!`);
      }
    }
    if (nextShield && Math.random() < 0.25) {
      const decayAmt = getItemDurabilityDecay(nextShield, 1);
      const curDur = nextShield.durability ?? nextShield.maxDurability ?? 100;
      const newDur = Math.max(0, curDur - decayAmt);
      nextShield = { ...nextShield, durability: newDur };
      if (newDur === 0) {
        staticLogs.push(`🛡️ [EQUIPMENT BROKEN]: Your ${nextShield.name} has broken!`);
      }
    }

    const scarResult = evaluateScarAcquisition(
      strikeDmg,
      playerHp,
      updatedStats.maxHp,
      activeScars,
      updatedStats.turnsPlayed
    );
    if (scarResult) {
      activeScars.push(scarResult.scar);
      staticLogs.push(scarResult.logText);
    }
  }

  return {
    handled: true,
    actionResult: {
      e,
      playerHp,
      nextArmor,
      nextHelmet,
      nextGloves,
      nextBoots,
      nextShield,
      activeScars,
      updatedEffects,
      nextCaravanTravel: ctx.nextCaravanTravel,
      nextDefeatedCounts: ctx.nextDefeatedCounts,
      incomingPlayerDamage,
      incomingPlayerHits,
      hadPlayerCrit,
      hadPlayerBrace,
      lastAttackerX,
      lastAttackerY
    }
  };
}
