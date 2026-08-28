/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, CombatArchetype, EnemyType, PlayerStats, EnemyAffix } from '../types';
import { calculateWorldThreatTier, getThreatTierInfo, getAffixMeta } from './worldThreat';

export interface GoldenTriangleProfile {
  resilience: number;  // 0.0 to 1.0+ (Defensive HP/armor density)
  damage: number;      // 0.0 to 1.0+ (Offensive attack power & lethality)
  speed: number;       // 0.0 to 1.0+ (Turn speed coefficient; higher = acts more frequently)
  archetype: CombatArchetype;
  title: string;
  trait: string;
  isAnomaly?: boolean; // Boss or GM Storyteller cheat flag (sum > 1.0)
}

/**
 * Maps every enemy in the game to its precise position in the Golden Triangle.
 * Golden Triangle Rule:
 * - Juggernaut (Resilience + Damage, Slow Speed)
 * - Glass Cannon (Speed + Damage, Low Resilience)
 * - Skirmisher (Speed + Resilience, Low Direct Damage, Status Harasser)
 * - Interior / Hybrid (Balancing attributes anywhere inside the triangle)
 * - Boss / Apex & GM Anomalies (Transcends / Cheats the triangle boundaries!)
 */
export function getGoldenTriangleProfile(type: EnemyType | string, isBoss?: boolean): GoldenTriangleProfile {
  const typeStr = String(type);

  // --- 1. BOSSES / APEX TITANS (CHEAT THE TRIANGLE) ---
  if (isBoss || ['Otso', 'Louhi', 'IkuTurso', 'AbyssalDragon', 'Dragon', 'Kalma', 'Surtur'].includes(typeStr)) {
    return {
      resilience: 1.40,
      damage: 1.35,
      speed: 0.90,
      archetype: 'boss_apex',
      title: '👑 Apex Titan',
      trait: '👑 Apex Overlord: Transcends Golden Triangle limits & Phase 2 Enrage (<50% HP)',
      isAnomaly: true,
    };
  }

  // --- 2. JUGGERNAUTS (Resilience + Damage, Slow Speed) ---
  if (['OrcBrute', 'Brute', 'DreadKnight', 'Troll', 'Hiisi'].includes(typeStr)) {
    return {
      resilience: 0.85,
      damage: 0.70,
      speed: 0.30,
      archetype: 'juggernaut',
      title: '🛡️ Ironclad Juggernaut',
      trait: '🛡️ Ironclad Armor (-20% incoming direct damage, slow heavy strikes)',
    };
  }

  // --- 3. GLASS CANNONS (Speed + Damage, Low Resilience) ---
  if (['SkeletonMage', 'Mage', 'Vampire', 'Necromancer', 'ShadowStalker', 'Demon'].includes(typeStr)) {
    return {
      resilience: 0.25,
      damage: 0.90,
      speed: 0.85,
      archetype: 'glass_cannon',
      title: '⚡ Unstable Glass Cannon',
      trait: '⚡ Unstable Burst (+50% critical strike devastation, fragile defense)',
    };
  }

  // --- 4. SKIRMISHERS (Speed + Resilience, Status Harassers) ---
  if (['Goblin', 'Scavenger Goblin', 'Bandit', 'Trapmaster', 'Wolf', 'Rat', 'Slime', 'Nakki'].includes(typeStr)) {
    return {
      resilience: 0.45,
      damage: 0.35,
      speed: 0.85,
      archetype: 'skirmisher',
      title: '🗡️ Harassing Skirmisher',
      trait: '🗡️ Harasser: Fast movement, high evasion, applies Bleed/Poison debuffs on hit',
    };
  }

  // --- 5. HYBRIDS & INTERIOR TRIANGLE POSITIONS ---
  if (['Wraith', 'Ghost'].includes(typeStr)) {
    return {
      resilience: 0.75,
      damage: 0.45,
      speed: 0.65,
      archetype: 'skirmisher',
      title: '👻 Ethereal Wraith Hybrid',
      trait: '👻 Ethereal Shield: Physical resistance & floating evasive movement',
    };
  }

  if (['Cultist', 'Outlaw'].includes(typeStr)) {
    return {
      resilience: 0.40,
      damage: 0.60,
      speed: 0.70,
      archetype: 'glass_cannon',
      title: '🔮 Dark Cultist Duelist',
      trait: '🔮 Arcane Infusion: Blends swift spellwork with dark sacrifice',
    };
  }

  // Wildlife Animals
  if (['WildlifeGoat', 'WildlifeBoar', 'WildlifeDeer', 'Boar', 'Deer', 'Goat'].includes(typeStr)) {
    return {
      resilience: 0.50,
      damage: 0.30,
      speed: 0.75,
      archetype: 'skirmisher',
      title: '🐗 Wilderness Game',
      trait: '🌿 Wild instinct: Evasive fleeing and pack instincts',
    };
  }

  // Default Centroid
  return {
    resilience: 0.50,
    damage: 0.50,
    speed: 0.50,
    archetype: 'skirmisher',
    title: '⚔️ Balanced Fighter',
    trait: '⚔️ Versatile Tactics: Standard balanced combat capabilities',
  };
}

/**
 * Legacy compatibility resolver.
 */
export function getEnemyArchetype(type: EnemyType | string, isBoss?: boolean): CombatArchetype {
  return getGoldenTriangleProfile(type, isBoss).archetype;
}

/**
 * Applies Golden Triangle positioning, stat scaling, and dynamic Chaos Matrix progression.
 */
export function applyCombatArchetypeAndChaosScaling(
  enemy: Enemy,
  chaosScore: number = 0,
  playerStats?: Partial<PlayerStats>,
  depth: number = 0
): Enemy {
  const isBoss = enemy.isBoss || enemy.archetype === 'boss_apex';
  const profile = getGoldenTriangleProfile(enemy.type, isBoss);

  // --- 1. GOLDEN TRIANGLE STAT CALCULATIONS ---
  const hpMultiplier = 0.6 + profile.resilience * 1.35;
  const atkMultiplier = 0.65 + profile.damage * 1.25;
  const defBonus = Math.floor(profile.resilience * 4);

  let speedVal = enemy.speed || 1.0;
  if (profile.archetype === 'juggernaut') {
    speedVal = Math.max(1.1, speedVal * 1.2);
  } else if (profile.archetype === 'glass_cannon' || profile.archetype === 'skirmisher') {
    speedVal = Math.min(0.85, speedVal * 0.8);
  }

  // --- 2. DYNAMIC CHAOS MATRIX & WORLD THREAT PROGRESSION SCALING ---
  const playerLvl = playerStats?.level || 1;
  const turnsPlayed = playerStats?.turnsPlayed || 0;
  const turnsScale = Math.min(2.0, (turnsPlayed / 150) * 0.05); // Scales steadily over long runs!
  
  const calculatedTier = calculateWorldThreatTier(playerStats, chaosScore);
  const threatInfo = getThreatTierInfo(calculatedTier);

  const chaosFactor = Math.max(0, chaosScore) * 0.018;
  const levelFactor = Math.max(0, playerLvl - 1) * 0.045;
  const depthFactor = Math.max(0, depth) * 0.06;

  const difficultyTier = enemy.difficultyTier || (isBoss ? 'apex' : enemy.isElite ? 'tough' : 'standard');

  let tierStatMult = 1.0;
  if (difficultyTier === 'easy') {
    tierStatMult = 0.55; // Easy/Fodder enemies: light HP, fast satisfying kills (1-2 hits)
  } else if (difficultyTier === 'standard') {
    tierStatMult = 0.95; // Standard roamers
  } else if (difficultyTier === 'tough') {
    tierStatMult = 1.45; // Tough veterans: substantial HP, heavy strikes
  } else if (difficultyTier === 'apex') {
    tierStatMult = 2.2; // Apex champions: formidable challenge
  }

  let totalScale = (1.0 + chaosFactor + levelFactor + depthFactor + turnsScale) * threatInfo.statMultiplier * tierStatMult;

  // --- 3. GM CHEAT / ANOMALY OVERRIDE ---
  let isAnomaly = enemy.isAnomaly || profile.isAnomaly || false;
  
  if (!isAnomaly && !isBoss && difficultyTier !== 'easy' && (chaosScore >= 50 || calculatedTier >= 3) && Math.random() < 0.15) {
    isAnomaly = true;
  }

  if (isAnomaly && !isBoss) {
    totalScale *= 1.35;
  }

  let chaosTier = 0;
  if (chaosScore >= 75) chaosTier = 3;
  else if (chaosScore >= 50) chaosTier = 2;
  else if (chaosScore >= 25) chaosTier = 1;

  const rawBaseHp = enemy.maxHp || enemy.hp || 15;
  const rawBaseAtk = enemy.atk || 4;
  const rawBaseDef = enemy.def || 0;

  // Non-linear ATK scaling so late game high-tier armor doesn't trivialize combat
  let scaledHp = Math.max(1, Math.floor(rawBaseHp * hpMultiplier * totalScale));
  let scaledAtk = Math.max(1, Math.floor(rawBaseAtk * atkMultiplier * Math.pow(totalScale, 0.82)));
  let scaledDef = Math.max(0, Math.floor(rawBaseDef + defBonus + (chaosTier * 1) + Math.floor(calculatedTier * 0.8)));

  // Difficulty Tier Bounds Enforcement
  if (difficultyTier === 'easy') {
    // Easy critters/scouts: 5-15 HP, 1-3 ATK, 0-1 DEF max to ensure accessible, fast kills
    scaledHp = Math.max(3, Math.min(16, Math.floor(rawBaseHp * 0.75)));
    scaledAtk = Math.max(1, Math.min(3, Math.floor(rawBaseAtk * 0.75)));
    scaledDef = Math.min(1, rawBaseDef);
  } else if (difficultyTier === 'tough') {
    scaledHp = Math.max(35, scaledHp);
    scaledAtk = Math.max(5, scaledAtk);
    scaledDef = Math.max(2, scaledDef);
  }

  // Armor penetration calculation (up to 50% for high threat levels)
  const armorPen = difficultyTier === 'easy' ? 0 : Math.min(0.50, Math.max(0, (calculatedTier * 0.05) + (isBoss ? 0.15 : enemy.isElite ? 0.10 : 0)));

  // --- 4. CORRUPTED AFFIX ROLL FOR LONG RUNS / ELITES / HIGH THREAT ---
  // Prevent early-game affix roll until Player Level >= 3 or Dungeon Depth >= 2 (unless explicitly set or Boss)
  const isEarlyGame = (playerLvl < 3 && depth < 2);
  const assignedAffixes: EnemyAffix[] = [...(enemy.affixes || [])];
  const maxAffixes = isBoss ? 2 : enemy.isElite ? 1 : 1;
  const rollAffixChance = (difficultyTier === 'easy' || (isEarlyGame && !isBoss))
    ? 0
    : Math.min(0.85, threatInfo.affixChance + (enemy.isElite ? 0.35 : 0) + (isBoss ? 0.50 : 0));

  if (!isEarlyGame || isBoss) {
    if (assignedAffixes.length < maxAffixes && (enemy.isElite || isBoss || Math.random() < rollAffixChance)) {
      const pool: EnemyAffix[] = ['vampiric', 'shieldbreaker', 'venomous', 'thorns', 'arcane_pulse', 'berserker', 'phasing'];
      // Filter out already assigned
      const available = pool.filter(a => !assignedAffixes.includes(a));
      if (available.length > 0) {
        const rolled = available[Math.floor(Math.random() * available.length)];
        assignedAffixes.push(rolled);
      }
    }
  }

  // Format prefix titles in enemy name if affixes present
  let nameWithAffix = enemy.name;
  if (assignedAffixes.length > 0 && !nameWithAffix.includes('⚡') && !nameWithAffix.includes('🩸') && !nameWithAffix.includes('🧛') && !nameWithAffix.includes('☠️')) {
    const prefixes = assignedAffixes.map(a => getAffixMeta(a).icon + ' ' + getAffixMeta(a).name).join(' ');
    nameWithAffix = `${prefixes} ${enemy.name}`;
  }

  let traitDescription = profile.trait;
  if (assignedAffixes.length > 0) {
    const affixDesc = assignedAffixes.map(a => `${getAffixMeta(a).icon} ${getAffixMeta(a).name}`).join(', ');
    traitDescription += ` | Affixes: ${affixDesc}`;
  }
  if (isAnomaly && !isBoss) {
    traitDescription = `⚡ [TRIANGLE ANOMALY]: GM Storyteller corrupted entity cheating Golden Triangle constraints (+35% stats & feral power)!`;
  }

  return {
    ...enemy,
    name: nameWithAffix,
    hp: scaledHp,
    maxHp: scaledHp,
    atk: scaledAtk,
    def: scaledDef,
    speed: speedVal,
    archetype: profile.archetype,
    archetypeTrait: traitDescription,
    chaosTier,
    difficultyTier,
    isAnomaly,
    affixes: assignedAffixes,
    armorPenetrationPercent: armorPen
  };
}

/**
 * Checks for Boss Phase 2 Enrage when boss HP drops below 50%.
 */
export function checkBossPhaseEnrage(
  enemy: Enemy
): { isEnragedNow: boolean; updatedEnemy: Enemy; logMessage?: string } {
  if (!enemy.isBoss && enemy.archetype !== 'boss_apex') {
    return { isEnragedNow: false, updatedEnemy: enemy };
  }

  if (enemy.isEnraged) {
    return { isEnragedNow: true, updatedEnemy: enemy };
  }

  const hpRatio = enemy.hp / enemy.maxHp;
  if (hpRatio <= 0.5) {
    const updated: Enemy = {
      ...enemy,
      isEnraged: true,
      atk: Math.floor(enemy.atk * 1.30),
      speed: Math.max(0.55, enemy.speed - 0.20),
      color: '#ef4444' // Crimson glowing aura
    };

    const logMessage = `🔥 [BOSS PHASE 2 ENRAGE]: ${enemy.name} breaks Golden Triangle boundaries as health falls below 50%! Attack surges +30% and speed accelerates!`;

    return { isEnragedNow: true, updatedEnemy: updated, logMessage };
  }

  return { isEnragedNow: false, updatedEnemy: enemy };
}

/**
 * Calculates Golden Triangle damage passives and damage adjustments during combat hits.
 */
export function calculateArchetypeDamageAdjustment(
  attacker: { archetype?: CombatArchetype; isCrit?: boolean; isAnomaly?: boolean } | null,
  defender: { archetype?: CombatArchetype; def?: number; isAnomaly?: boolean } | null,
  rawDamage: number
): { damage: number; logNote?: string } {
  let damage = rawDamage;
  let logNote: string | undefined = undefined;

  // 1. GM Triangle Anomaly Cheater Attacker: +25% unmitigated chaos damage
  if (attacker?.isAnomaly) {
    damage = Math.floor(damage * 1.25);
    logNote = '⚡ [TRIANGLE ANOMALY]: GM Cheater strikes with unmitigated Chaos power!';
  }

  // 2. Juggernaut Defender passive: Ironclad Resilience (-20% direct damage)
  if (defender?.archetype === 'juggernaut') {
    damage = Math.max(1, Math.floor(damage * 0.8));
    logNote = '🛡️ [IRONCLAD]: Juggernaut heavy armor absorbs 20% impact damage!';
  }

  // 3. Glass Cannon Attacker passive: Unstable Burst (+50% critical strike bonus)
  if (attacker?.archetype === 'glass_cannon' && attacker.isCrit) {
    damage = Math.floor(damage * 1.5);
    logNote = '⚡ [UNSTABLE BURST]: Glass Cannon critical strike explodes with 1.5x devastation!';
  }

  return { damage, logNote };
}

/**
 * Allows the GM AI Storyteller to explicitly spawn a GM Triangle Cheater / Anomaly.
 */
export function createGMTriangleCheaterEnemy(
  baseEnemy: Enemy,
  anomalyTitle: string = 'Abyssal Chaos Mutant'
): Enemy {
  return {
    ...baseEnemy,
    name: `${anomalyTitle} (${baseEnemy.name})`,
    isAnomaly: true,
    hp: Math.floor(baseEnemy.maxHp * 1.5),
    maxHp: Math.floor(baseEnemy.maxHp * 1.5),
    atk: Math.floor(baseEnemy.atk * 1.4),
    speed: Math.max(0.5, baseEnemy.speed * 0.7),
    color: '#c084fc', // Purple glowing anomaly aura
    archetypeTrait: `⚡ [GM TRIANGLE CHEATER]: Mutated by GM Storyteller. Defies Golden Triangle balance!`,
  };
}
