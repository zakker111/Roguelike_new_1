/**
 * Centralized Game Balance Constants & Formulas for Sunder: The Shattered Realm
 */

export const BALANCE_CONFIG = {
  // XP & Leveling
  BASE_XP_NEXT_LEVEL: 100,
  LEVEL_XP_MULTIPLIER: 1.5,

  // Combat Formulas
  BASE_ATTACK_POWER: 10,
  BASE_ARMOR_DEFENSE: 0,
  ARMOR_MITIGATION_CAP: 0.75, // Max 75% damage reduction from armor

  // Critical Hits
  BASE_CRIT_CHANCE: 0.05,
  BASE_CRIT_MULTIPLIER: 1.5,

  // Exhaustion & Stamina
  EXHAUSTION_PER_TURN: 0.1,
  REST_EXHAUSTION_RECOVERY: 25,

  // Overforge Heat
  OVERFORGE_SAFE_HEAT_LIMIT: 80,
  OVERFORGE_MAX_HEAT: 100,
};

/**
 * Calculates XP required for next level
 */
export function getXpForLevel(level: number): number {
  return Math.floor(BALANCE_CONFIG.BASE_XP_NEXT_LEVEL * Math.pow(BALANCE_CONFIG.LEVEL_XP_MULTIPLIER, level - 1));
}

/**
 * Calculates net physical damage after armor mitigation
 */
export function calculateNetDamage(rawDamage: number, targetArmor: number): number {
  if (rawDamage <= 0) return 0;
  // Standard diminishing returns mitigation formula
  const mitigationFraction = Math.min(
    BALANCE_CONFIG.ARMOR_MITIGATION_CAP,
    targetArmor / (targetArmor + 40)
  );
  const netDamage = rawDamage * (1 - mitigationFraction);
  return Math.max(1, Math.round(netDamage));
}

/**
 * Calculates critical hit damage
 */
export function calculateCritDamage(baseDamage: number, critMultiplier: number = BALANCE_CONFIG.BASE_CRIT_MULTIPLIER): number {
  return Math.round(baseDamage * critMultiplier);
}
