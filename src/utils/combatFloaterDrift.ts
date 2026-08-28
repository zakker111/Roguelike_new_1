/**
 * Combat Floating Text Directional Outward Drift Engine
 *
 * Implements outward drift arcs away from attack vectors to keep line of sight (LOS)
 * over entity sprites, health bars, and telegraph markers clear.
 */

export interface FloaterDriftParams {
  targetX: number;
  targetY: number;
  sourceX?: number;
  sourceY?: number;
  isCrit?: boolean;
  randomSeed?: number;
}

export interface FloaterDriftResult {
  spawnX: number;
  spawnY: number;
  vx: number;
  vy: number;
}

/**
 * Calculates spawn coordinates and velocity vectors for directional outward drift.
 * - When source (attacker) coordinates are provided, drifts outward along the impact vector.
 * - When source is omitted or identical to target, drifts outward to the side flanks.
 */
export function calculateDirectionalDrift(params: FloaterDriftParams): FloaterDriftResult {
  const { targetX, targetY, sourceX, sourceY, isCrit = false } = params;
  const speed = isCrit ? 0.08 : 0.06;

  if (sourceX !== undefined && sourceY !== undefined && (sourceX !== targetX || sourceY !== targetY)) {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    const normX = dx / len;
    const normY = dy / len;

    // Outward offset so text starts outside the entity's central sprite & overhead health bar
    const spawnOffsetX = 0.5 + Math.sign(normX || 1) * 0.32;
    const spawnOffsetY = 0.12 + (normY > 0 ? 0.20 : -0.20);

    const vx = normX * speed;
    const vy = -0.052 + normY * 0.025;

    return {
      spawnX: targetX + spawnOffsetX,
      spawnY: targetY + spawnOffsetY,
      vx,
      vy,
    };
  }

  // Flank outward drift (diverges left/right to keep central sprite unobstructed)
  const seed = params.randomSeed ?? Math.random();
  const side = seed > 0.5 ? 1 : -1;
  return {
    spawnX: targetX + 0.5 + side * 0.32,
    spawnY: targetY + 0.12,
    vx: side * (0.045 + (seed * 0.02)),
    vy: -0.055,
  };
}
