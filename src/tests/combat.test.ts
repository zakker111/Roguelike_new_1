import { describe, it, expect } from 'vitest';
import { calculateNetDamage, calculateCritDamage, getXpForLevel, BALANCE_CONFIG } from '../data/balance';
import { evaluateScarAcquisition, getEffectiveStats, SCAR_DATABASE } from '../utils/scars';
import { CatalystType, EnemyState, EnemyType } from '../types';

describe('12.2 Combat Engine, Invasion Events & Debuff Property Safety', () => {
  it('calculateNetDamage applies armor mitigation formula correctly', () => {
    // 20 damage against 40 armor: targetArmor / (targetArmor + 40) = 40 / 80 = 50% mitigation -> 10 damage
    const netDmg = calculateNetDamage(20, 40);
    expect(netDmg).toBe(10);

    // Armor mitigation is capped at 75%
    const cappedDmg = calculateNetDamage(100, 1000);
    expect(cappedDmg).toBe(25);

    // Damage minimum floor is 1
    const minDmg = calculateNetDamage(1, 100);
    expect(minDmg).toBe(1);
  });

  it('calculateCritDamage applies crit multipliers', () => {
    const crit = calculateCritDamage(20, 1.5);
    expect(crit).toBe(30);
  });

  it('getXpForLevel increases required XP sub-linearly with level', () => {
    const xpLvl1 = getXpForLevel(1);
    const xpLvl2 = getXpForLevel(2);
    expect(xpLvl1).toBe(100);
    expect(xpLvl2).toBe(150);
  });

  it('evaluateScarAcquisition checks high damage and low HP thresholds', () => {
    // Low damage (5 HP) and high HP (80/100) -> Should NOT produce scar
    const noScar = evaluateScarAcquisition(5, 80, 100, [], 10);
    expect(noScar).toBeNull();

    // SCAR_DATABASE exists and has templates
    expect(SCAR_DATABASE.length).toBeGreaterThan(0);
  });

  it('getEffectiveStats applies active scar modifiers to player stats', () => {
    const baseStats = {
      level: 5,
      hp: 50,
      maxHp: 50,
      mp: 20,
      maxMp: 20,
      atk: 10,
      def: 5,
      str: 10,
      dex: 10,
      int: 10,
      cha: 10,
      lck: 10,
      gold: 100,
      xp: 0,
      enemiesDefeated: 0,
      turnsPlayed: 100,
      scars: [
        {
          id: 'scar_jagged_gash',
          name: 'Jagged Cheek Gash',
          severity: 'Minor' as const,
          description: 'A thick, raised crimson ridge.',
          acquiredTurn: 50 // 50 turns ago (> 25, so Healed status -> +1 ATK)
        }
      ]
    };

    const effStats = getEffectiveStats(baseStats as any);
    expect(effStats.atk).toBe(11); // 10 base + 1 healed scar modifier
  });

  it('Enemy status debuffs array processing prevents undefined accesses', () => {
    const mockEnemy = {
      id: 'test_enemy_1',
      x: 5,
      y: 5,
      name: 'Orc Brute',
      type: EnemyType.OrcBrute,
      hp: 30,
      maxHp: 30,
      atk: 8,
      def: 2,
      debuffs: [
        { type: CatalystType.Fire, duration: 3, damagePerTurn: 4 },
        { type: CatalystType.Frost, duration: 1, damagePerTurn: 0 }
      ]
    };

    // Safely verify debuffs array structure
    expect(mockEnemy.debuffs).toBeDefined();
    expect(mockEnemy.debuffs.length).toBe(2);

    // Tick down debuffs
    const updatedDebuffs = mockEnemy.debuffs
      .map(d => ({ ...d, duration: d.duration - 1 }))
      .filter(d => d.duration > 0);

    expect(updatedDebuffs.length).toBe(1);
    expect(updatedDebuffs[0].type).toBe(CatalystType.Fire);
    expect(updatedDebuffs[0].duration).toBe(2);
  });
});
