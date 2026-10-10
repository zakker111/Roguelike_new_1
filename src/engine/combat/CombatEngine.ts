/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Combatant, AttackInput, CombatResult, CombatFormulaConfig } from './types';

/**
 * Standard default formula configuration
 */
export const DEFAULT_COMBAT_CONFIG: CombatFormulaConfig = {
  minDamage: 1,
  defenseDivisor: 2,
  randomVariance: 0.1,
  defaultCritMultiplier: 1.5
};

/**
 * Generic, data-agnostic Combat Engine.
 * Conforms to Step 8 (Engine / Game Separation) of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md).
 * Contains no game-specific formulas or hardcoded monsters.
 */
export class CombatEngine {
  private config: CombatFormulaConfig;

  constructor(config: Partial<CombatFormulaConfig> = {}) {
    this.config = { ...DEFAULT_COMBAT_CONFIG, ...config };
  }

  /**
   * Resolves a combat interaction between attacker and defender.
   */
  public resolveAttack(
    attacker: Combatant,
    defender: Combatant,
    attack: AttackInput = {},
    rand: () => number = Math.random
  ): CombatResult {
    // 1. Accuracy and Dodge Check
    const dodgeRoll = rand();
    const defenderDodge = defender.dodgeChance ?? 0;
    const attackerAcc = attacker.accuracy ?? 1.0;
    const effectiveDodgeChance = Math.max(0, Math.min(0.95, defenderDodge - (attackerAcc - 1.0)));

    if (!attack.cannotDodge && dodgeRoll < effectiveDodgeChance) {
      return {
        hit: false,
        isDodged: true,
        isCritical: false,
        rawDamage: 0,
        mitigatedDamage: 0,
        finalDamage: 0,
        overkill: 0,
        defenderDied: false,
        remainingHp: defender.hp,
        logSummary: `${defender.name} dodged the attack from ${attacker.name}!`
      };
    }

    // 2. Base Power & Raw Damage
    const baseAtk = attack.baseDamage !== undefined ? attack.baseDamage : attacker.atk;
    const bonus = attack.bonusDamage ?? 0;
    let rawDamage = Math.max(0, baseAtk + bonus);

    // Variance (+/- randomVariance)
    if (this.config.randomVariance && this.config.randomVariance > 0) {
      const varianceFactor = 1.0 + (rand() * 2 - 1) * this.config.randomVariance;
      rawDamage = Math.round(rawDamage * varianceFactor);
    }

    // 3. Critical Strike Check
    const baseCrit = (attacker.critChance ?? 0.05) + (attack.critBonus ?? 0);
    const critRoll = rand();
    const isCritical = attack.guaranteedCrit || critRoll < baseCrit;
    const critMul = attacker.critMultiplier ?? this.config.defaultCritMultiplier ?? 1.5;

    if (isCritical) {
      rawDamage = Math.round(rawDamage * critMul);
    }

    // 4. Armor Mitigation & Penetration
    let effectiveArmor = Math.max(0, defender.def);
    if (attack.armorPenetrationPercent) {
      effectiveArmor = Math.round(effectiveArmor * (1 - attack.armorPenetrationPercent));
    }
    if (attack.armorPenetration) {
      effectiveArmor = Math.max(0, effectiveArmor - attack.armorPenetration);
    }

    // Flat reduction or divisor mitigation
    const armorReduction = Math.round(effectiveArmor / (this.config.defenseDivisor || 2));
    let finalDamage = Math.max(this.config.minDamage, rawDamage - armorReduction);

    // 5. Resistances and Vulnerabilities
    if (attack.damageType) {
      const res = defender.resistances?.[attack.damageType] ?? 0;
      const vuln = defender.vulnerabilities?.[attack.damageType] ?? 0;
      const multiplier = 1.0 - res + vuln;
      finalDamage = Math.max(this.config.minDamage, Math.round(finalDamage * Math.max(0, multiplier)));
    }

    // 6. Apply Damage to Defender
    const remainingHp = Math.max(0, defender.hp - finalDamage);
    const overkill = Math.max(0, finalDamage - defender.hp);
    const defenderDied = remainingHp === 0;

    const critText = isCritical ? ' (CRITICAL HIT!)' : '';
    const fatalText = defenderDied ? ` ${defender.name} was defeated!` : '';
    const logSummary = `${attacker.name} struck ${defender.name} for ${finalDamage} damage${critText}.${fatalText}`;

    return {
      hit: true,
      isDodged: false,
      isCritical,
      rawDamage,
      mitigatedDamage: rawDamage - finalDamage,
      finalDamage,
      overkill,
      defenderDied,
      remainingHp,
      logSummary
    };
  }

  /**
   * Updates configuration parameters
   */
  public updateConfig(newConfig: Partial<CombatFormulaConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Returns current combat formula config
   */
  public getConfig(): CombatFormulaConfig {
    return { ...this.config };
  }
}
