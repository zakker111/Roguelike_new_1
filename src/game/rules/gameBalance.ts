/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Game-specific balance formulas and progression curves
 */
export class GameBalance {
  /**
   * Calculates required XP to reach the next level
   */
  public static getRequiredXp(level: number): number {
    return Math.round(50 * Math.pow(level, 1.6));
  }

  /**
   * Calculates scaling threat multiplier for floor depth
   */
  public static getDepthThreatMultiplier(depth: number): number {
    return 1.0 + Math.max(0, depth - 1) * 0.25;
  }

  /**
   * Calculates gold reward from enemy defeat
   */
  public static calculateGoldReward(baseReward: number, depth: number, luck: number = 10): number {
    const depthBonus = 1 + (depth - 1) * 0.15;
    const luckBonus = 1 + Math.max(0, luck - 10) * 0.03;
    return Math.max(1, Math.round(baseReward * depthBonus * luckBonus));
  }
}
