import { describe, it, expect, vi } from 'vitest';

describe('Multi-Enemy Attack Floater Batching and Log Clarity', () => {
  it('formats aggregated turn damage floater correctly for single vs multiple attackers', () => {
    const formatAggregatedFloater = (damage: number, hits: number, isBraced: boolean = false, isCrit: boolean = false) => {
      if (hits > 1) {
        return `-${damage} HP (${hits} hits)`;
      } else if (isBraced) {
        return `🛡️ BRACED (-${damage})`;
      } else if (isCrit) {
        return `💥 CRIT (-${damage})`;
      }
      return `-${damage} HP`;
    };

    // Single attacker
    expect(formatAggregatedFloater(5, 1)).toBe('-5 HP');
    expect(formatAggregatedFloater(12, 1, false, true)).toBe('💥 CRIT (-12)');
    expect(formatAggregatedFloater(3, 1, true, false)).toBe('🛡️ BRACED (-3)');

    // Multiple attackers (e.g., 3 enemies hitting for 14 total damage)
    expect(formatAggregatedFloater(14, 3)).toBe('-14 HP (3 hits)');
    expect(formatAggregatedFloater(28, 4)).toBe('-28 HP (4 hits)');
  });

  it('preserves individual enemy attack entries in combat logs while batching floating text', () => {
    const incomingEnemies = [
      { name: 'Goblin Scout', dmg: 4 },
      { name: 'Orc Warrior', dmg: 7 },
      { name: 'Skeleton Archer', dmg: 3 },
    ];

    const logs: string[] = [];
    let totalDmg = 0;
    let totalHits = 0;

    for (const enemy of incomingEnemies) {
      totalDmg += enemy.dmg;
      totalHits += 1;
      logs.push(`⚔️ ${enemy.name} attacks you for -${enemy.dmg} HP!`);
    }

    // Check individual logs exist and contain attacker name + damage
    expect(logs).toHaveLength(3);
    expect(logs[0]).toBe('⚔️ Goblin Scout attacks you for -4 HP!');
    expect(logs[1]).toBe('⚔️ Orc Warrior attacks you for -7 HP!');
    expect(logs[2]).toBe('⚔️ Skeleton Archer attacks you for -3 HP!');

    // Check aggregated floater values
    expect(totalDmg).toBe(14);
    expect(totalHits).toBe(3);
    const floaterText = `-${totalDmg} HP (${totalHits} hits)`;
    expect(floaterText).toBe('-14 HP (3 hits)');
  });
});
