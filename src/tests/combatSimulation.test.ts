import { describe, it, expect } from 'vitest';
import { calculateNetDamage, calculateCritDamage } from '../data/balance';
import { WeaponBaseType } from '../types';

interface CombatArchetype {
  name: string;
  level: number;
  str: number;
  atk: number;
  def: number;
  weapon: {
    name: string;
    damage: number;
    critChance: number;
    type: WeaponBaseType;
  };
  shieldDef?: number;
}

interface EnemyArchetype {
  name: string;
  hp: number;
  atk: number;
  def: number;
}

export function simulateCombatMatch(player: CombatArchetype, enemy: EnemyArchetype) {
  let enemyHp = enemy.hp;
  let playerHp = 50 + player.level * 10;
  const maxPlayerHp = playerHp;
  let turns = 0;
  let playerCrits = 0;
  let totalDamageDealt = 0;

  const totalPlayerDef = player.def + (player.shieldDef || 0);

  while (enemyHp > 0 && playerHp > 0 && turns < 100) {
    turns++;
    
    // Player turn
    const isCrit = Math.random() < player.weapon.critChance;
    if (isCrit) playerCrits++;

    const baseHit = player.atk + player.weapon.damage;
    const rawHit = isCrit ? calculateCritDamage(baseHit, 1.5 + player.weapon.critChance) : baseHit;
    
    // Crit penetrates 50% armor
    const effectiveArmor = isCrit ? Math.floor(enemy.def * 0.5) : enemy.def;
    const dmgToEnemy = calculateNetDamage(rawHit, effectiveArmor);
    
    enemyHp -= dmgToEnemy;
    totalDamageDealt += dmgToEnemy;

    if (enemyHp <= 0) break;

    // Enemy turn
    const dmgToPlayer = calculateNetDamage(enemy.atk, totalPlayerDef);
    playerHp -= dmgToPlayer;
  }

  return {
    victor: enemyHp <= 0 ? 'Player' : 'Enemy',
    turns,
    playerCrits,
    avgDamagePerTurn: Math.round(totalDamageDealt / turns),
    remainingPlayerHpPercent: Math.max(0, Math.round((playerHp / maxPlayerHp) * 100))
  };
}

describe('31.4 Combat Balance & Pacing Simulation Matrix', () => {
  const NOVICE: CombatArchetype = {
    name: 'Novice Adventurer',
    level: 1,
    str: 10,
    atk: 5,
    def: 2,
    weapon: { name: 'Recruit Dagger', damage: 3, critChance: 0.05, type: WeaponBaseType.Dagger }
  };

  const VETERAN: CombatArchetype = {
    name: 'Veteran Flame-Knight',
    level: 8,
    str: 18,
    atk: 14,
    def: 8,
    shieldDef: 4,
    weapon: { name: 'Volcanic Longsword', damage: 12, critChance: 0.18, type: WeaponBaseType.Sword }
  };

  const HIGH_LORD: CombatArchetype = {
    name: 'High Lord Sunder Champion',
    level: 15,
    str: 26,
    atk: 28,
    def: 15,
    shieldDef: 8,
    weapon: { name: 'Cosmic Wildfire Blade', damage: 22, critChance: 0.35, type: WeaponBaseType.Sword }
  };

  const RAT: EnemyArchetype = { name: 'Giant Plague Rat', hp: 8, atk: 2, def: 0 };
  const ORC: EnemyArchetype = { name: 'Orc Skullbreaker', hp: 30, atk: 6, def: 3 };
  const DRAGON: EnemyArchetype = { name: 'Sunder Ashwyrm Dragon', hp: 120, atk: 11, def: 6 };

  it('Simulates Novice vs Plague Rat (Quick early encounter: 1-2 hits)', () => {
    const res = simulateCombatMatch(NOVICE, RAT);
    expect(res.victor).toBe('Player');
    expect(res.turns).toBeLessThanOrEqual(2);
  });

  it('Simulates Veteran vs Orc Skullbreaker (Tactical mid-game combat: 1-5 turns)', () => {
    const res = simulateCombatMatch(VETERAN, ORC);
    expect(res.victor).toBe('Player');
    expect(res.turns).toBeGreaterThanOrEqual(1);
    expect(res.turns).toBeLessThanOrEqual(5);
  });

  it('Simulates High Lord vs Sunder Ashwyrm Dragon (Epic Boss fight: 2-8 turns)', () => {
    const res = simulateCombatMatch(HIGH_LORD, DRAGON);
    expect(res.victor).toBe('Player');
    expect(res.turns).toBeGreaterThanOrEqual(2);
    expect(res.turns).toBeLessThanOrEqual(8);
  });
});
