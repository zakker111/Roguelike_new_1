/**
 * Combat Floating Text Directional Outward Drift & Archetype Engine
 *
 * Implements outward drift arcs away from attack vectors to keep line of sight (LOS)
 * over entity sprites, health bars, and telegraph markers clear.
 * Adds anti-overlap radial stagger and distinct archetype physics (crit arcs,
 * crimson tremors, gliding dodges, metallic shields, and elemental ember drifts).
 */

export type FloaterArchetype =
  | 'crit'
  | 'player_damage'
  | 'enemy_damage'
  | 'heal'
  | 'dodge'
  | 'shield'
  | 'burning'
  | 'poison'
  | 'shock'
  | 'mana';

export interface FloaterDriftParams {
  targetX: number;
  targetY: number;
  sourceX?: number;
  sourceY?: number;
  isCrit?: boolean;
  randomSeed?: number;
  staggerIndex?: number;
  archetype?: FloaterArchetype;
}

export interface FloaterDriftResult {
  spawnX: number;
  spawnY: number;
  vx: number;
  vy: number;
  gravity?: number;
  scale?: number;
  tremorIntensity?: number;
}

export interface FloaterArchetypeVisuals {
  primaryColor: string;
  strokeColor: string;
  shadowColor: string;
  shadowBlur: number;
  defaultSize: number;
  gravity: number;
  initialScale: number;
  tremorIntensity: number;
  fontFamily: string;
  fontStyle: string;
}

/**
 * Resolves the visual archetype of floating combat text from action type,
 * message contents, and whether the player is receiving the hit.
 */
export function resolveFloaterArchetype(
  type?: string,
  text?: string,
  isPlayerTarget?: boolean
): FloaterArchetype {
  const safeText = (text || '').toLowerCase();

  // 1. Critical strikes
  if (type === 'crit' || safeText.includes('crit')) {
    return 'crit';
  }

  // 2. Dodges & Evades
  if (safeText.includes('dodge') || safeText.includes('evade') || safeText.includes('phase')) {
    return 'dodge';
  }

  // 3. Shields, Blocks & Bracing
  if (safeText.includes('shield') || safeText.includes('block') || safeText.includes('braced')) {
    return 'shield';
  }

  // 4. Elemental Damage Types
  if (safeText.includes('fire') || safeText.includes('burn') || safeText.includes('scorch') || safeText.includes('flame')) {
    return 'burning';
  }
  if (safeText.includes('poison') || safeText.includes('venom') || safeText.includes('acid') || safeText.includes('toxic')) {
    return 'poison';
  }
  if (safeText.includes('shock') || safeText.includes('spark') || safeText.includes('lightning') || safeText.includes('zap')) {
    return 'shock';
  }

  // 5. Healing & Recovery
  if (type === 'heal' || safeText.includes('heal') || safeText.includes('+hp') || safeText.includes('restored')) {
    return 'heal';
  }

  // 6. Mana
  if (type === 'mana' || safeText.includes('+mp') || safeText.includes('mana')) {
    return 'mana';
  }

  // 7. Player Damage vs Enemy Damage
  if (isPlayerTarget || safeText.includes('you took')) {
    return 'player_damage';
  }

  return 'enemy_damage';
}

/**
 * Returns rendering styling parameters for each floater archetype
 */
export function getArchetypeVisuals(archetype: FloaterArchetype): FloaterArchetypeVisuals {
  switch (archetype) {
    case 'crit':
      return {
        primaryColor: '#fbbf24',
        strokeColor: 'rgba(69, 26, 3, 0.95)',
        shadowColor: 'rgba(245, 158, 11, 0.85)',
        shadowBlur: 8,
        defaultSize: 16,
        gravity: 0.0035,
        initialScale: 1.45,
        tremorIntensity: 0,
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontStyle: '900',
      };

    case 'player_damage':
      return {
        primaryColor: '#ef4444',
        strokeColor: 'rgba(69, 10, 10, 0.95)',
        shadowColor: 'rgba(239, 68, 68, 0.8)',
        shadowBlur: 6,
        defaultSize: 14,
        gravity: 0,
        initialScale: 1.25,
        tremorIntensity: 0.045,
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontStyle: '900',
      };

    case 'dodge':
      return {
        primaryColor: '#38bdf8',
        strokeColor: 'rgba(8, 47, 73, 0.9)',
        shadowColor: 'rgba(56, 189, 248, 0.65)',
        shadowBlur: 6,
        defaultSize: 13,
        gravity: 0,
        initialScale: 1.15,
        tremorIntensity: 0,
        fontFamily: '"Inter", system-ui, sans-serif',
        fontStyle: 'italic 800',
      };

    case 'shield':
      return {
        primaryColor: '#2dd4bf',
        strokeColor: 'rgba(4, 47, 46, 0.95)',
        shadowColor: 'rgba(45, 212, 191, 0.75)',
        shadowBlur: 7,
        defaultSize: 13,
        gravity: 0,
        initialScale: 1.3,
        tremorIntensity: 0,
        fontFamily: '"Inter", system-ui, sans-serif',
        fontStyle: '900',
      };

    case 'burning':
      return {
        primaryColor: '#f97316',
        strokeColor: 'rgba(67, 20, 7, 0.9)',
        shadowColor: 'rgba(249, 115, 22, 0.85)',
        shadowBlur: 7,
        defaultSize: 12,
        gravity: 0,
        initialScale: 1.1,
        tremorIntensity: 0,
        fontFamily: '"Inter", system-ui, sans-serif',
        fontStyle: '800',
      };

    case 'poison':
      return {
        primaryColor: '#10b981',
        strokeColor: 'rgba(2, 44, 34, 0.9)',
        shadowColor: 'rgba(16, 185, 129, 0.8)',
        shadowBlur: 6,
        defaultSize: 12,
        gravity: 0.001,
        initialScale: 1.1,
        tremorIntensity: 0,
        fontFamily: '"Inter", system-ui, sans-serif',
        fontStyle: '800',
      };

    case 'shock':
      return {
        primaryColor: '#c084fc',
        strokeColor: 'rgba(59, 7, 100, 0.9)',
        shadowColor: 'rgba(192, 132, 252, 0.8)',
        shadowBlur: 7,
        defaultSize: 13,
        gravity: 0,
        initialScale: 1.2,
        tremorIntensity: 0.03,
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontStyle: '900',
      };

    case 'heal':
      return {
        primaryColor: '#22c55e',
        strokeColor: 'rgba(5, 46, 22, 0.9)',
        shadowColor: 'rgba(34, 197, 94, 0.75)',
        shadowBlur: 6,
        defaultSize: 13,
        gravity: 0,
        initialScale: 1.15,
        tremorIntensity: 0,
        fontFamily: '"Inter", system-ui, sans-serif',
        fontStyle: 'bold',
      };

    case 'mana':
      return {
        primaryColor: '#60a5fa',
        strokeColor: 'rgba(30, 58, 138, 0.9)',
        shadowColor: 'rgba(96, 165, 250, 0.75)',
        shadowBlur: 6,
        defaultSize: 12,
        gravity: 0,
        initialScale: 1.1,
        tremorIntensity: 0,
        fontFamily: '"Inter", system-ui, sans-serif',
        fontStyle: 'bold',
      };

    case 'enemy_damage':
    default:
      return {
        primaryColor: '#f87171',
        strokeColor: 'rgba(2, 6, 23, 0.92)',
        shadowColor: 'rgba(248, 113, 113, 0.65)',
        shadowBlur: 5,
        defaultSize: 13,
        gravity: 0,
        initialScale: 1.0,
        tremorIntensity: 0,
        fontFamily: '"Inter", system-ui, sans-serif',
        fontStyle: '900',
      };
  }
}

/**
 * Calculates spawn coordinates and velocity vectors for directional outward drift.
 * - When source (attacker) coordinates are provided, drifts outward along the impact vector.
 * - When source is omitted or identical to target, drifts outward to the side flanks.
 * - When staggerIndex > 0 (multiple recent hits on target), fans outward to prevent overlap.
 */
export function calculateDirectionalDrift(params: FloaterDriftParams): FloaterDriftResult {
  const { targetX, targetY, sourceX, sourceY, isCrit = false, staggerIndex = 0, archetype } = params;
  const speed = isCrit ? 0.08 : 0.06;

  // Stagger calculations for multi-attack overlap prevention
  const staggerSide = staggerIndex % 2 === 1 ? -1 : 1;
  const staggerMagnitude = Math.ceil(staggerIndex / 2);
  const staggerOffsetX = staggerIndex > 0 ? staggerSide * 0.16 * staggerMagnitude : 0;
  const staggerOffsetY = staggerIndex > 0 ? -0.18 * staggerMagnitude : 0;
  const staggerAngleJitter = staggerIndex > 0 ? staggerSide * 0.015 * staggerMagnitude : 0;

  if (sourceX !== undefined && sourceY !== undefined && (sourceX !== targetX || sourceY !== targetY)) {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    const normX = dx / len;
    const normY = dy / len;

    // Outward offset so text starts outside the entity's central sprite & overhead health bar
    const spawnOffsetX = 0.5 + Math.sign(normX || 1) * 0.32 + staggerOffsetX;
    const spawnOffsetY = 0.12 + (normY > 0 ? 0.20 : -0.20) + staggerOffsetY;

    const vx = normX * speed + staggerAngleJitter;
    let vy = -0.052 + normY * 0.025;

    // Critical strikes bounce in parabolic arc: launch upward higher
    if (isCrit || archetype === 'crit') {
      vy = -0.095;
    }

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
  const effectiveSide = staggerIndex > 0 ? (staggerIndex % 2 === 0 ? side : -side) : side;

  let vy = -0.055;
  if (isCrit || archetype === 'crit') {
    vy = -0.095;
  } else if (archetype === 'dodge') {
    vy = -0.04;
  }

  return {
    spawnX: targetX + 0.5 + effectiveSide * 0.32 + staggerOffsetX,
    spawnY: targetY + 0.12 + staggerOffsetY,
    vx: effectiveSide * (0.045 + seed * 0.02) + staggerAngleJitter,
    vy,
  };
}
