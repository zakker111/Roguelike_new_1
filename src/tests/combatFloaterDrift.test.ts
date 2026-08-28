import { describe, it, expect } from 'vitest';
import { calculateDirectionalDrift } from '../utils/combatFloaterDrift';

describe('Combat Floating Text Directional Outward Drift', () => {
  it('drifts to the right when attacked from the left (dx > 0)', () => {
    const result = calculateDirectionalDrift({
      targetX: 10,
      targetY: 10,
      sourceX: 9,
      sourceY: 10,
      isCrit: false,
    });

    expect(result.vx).toBeGreaterThan(0);
    expect(result.spawnX).toBeGreaterThan(10.5); // pushed to the right flank
  });

  it('drifts to the left when attacked from the right (dx < 0)', () => {
    const result = calculateDirectionalDrift({
      targetX: 10,
      targetY: 10,
      sourceX: 11,
      sourceY: 10,
      isCrit: false,
    });

    expect(result.vx).toBeLessThan(0);
    expect(result.spawnX).toBeLessThan(10.5); // pushed to the left flank
  });

  it('drifts downward/outward with upward buoyancy when struck from above', () => {
    const result = calculateDirectionalDrift({
      targetX: 10,
      targetY: 10,
      sourceX: 10,
      sourceY: 9,
      isCrit: false,
    });

    expect(result.spawnY).toBeGreaterThan(10.12);
  });

  it('scales speed up on critical strikes', () => {
    const regular = calculateDirectionalDrift({
      targetX: 10,
      targetY: 10,
      sourceX: 8,
      sourceY: 10,
      isCrit: false,
    });

    const crit = calculateDirectionalDrift({
      targetX: 10,
      targetY: 10,
      sourceX: 8,
      sourceY: 10,
      isCrit: true,
    });

    expect(crit.vx).toBeGreaterThan(regular.vx);
  });

  it('diverges to flanks when attacker source is omitted (clear line of sight)', () => {
    const leftDrift = calculateDirectionalDrift({
      targetX: 10,
      targetY: 10,
      randomSeed: 0.2, // < 0.5 -> left
    });

    const rightDrift = calculateDirectionalDrift({
      targetX: 10,
      targetY: 10,
      randomSeed: 0.8, // > 0.5 -> right
    });

    expect(leftDrift.vx).toBeLessThan(0);
    expect(leftDrift.spawnX).toBeLessThan(10.5);

    expect(rightDrift.vx).toBeGreaterThan(0);
    expect(rightDrift.spawnX).toBeGreaterThan(10.5);
  });
});
