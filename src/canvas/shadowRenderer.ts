import { TileType } from '../types';
import { isTileShadowCaster, getTileShadowType } from '../world/tileRegistry';

export interface ShadowRendererConfig {
  enabled: boolean;
  opacityMultiplier: number;
  lengthMultiplier: number;
}

class ShadowConfigManager {
  private static instance: ShadowConfigManager;
  private enabled = true;
  private opacityMultiplier = 1.0;
  private lengthMultiplier = 1.0;

  private constructor() {}

  public static getInstance(): ShadowConfigManager {
    if (!ShadowConfigManager.instance) {
      ShadowConfigManager.instance = new ShadowConfigManager();
    }
    return ShadowConfigManager.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.enabled;
  }

  public setOpacityMultiplier(multiplier: number): void {
    this.opacityMultiplier = Math.max(0, multiplier);
  }

  public getOpacityMultiplier(): number {
    return this.opacityMultiplier;
  }

  public setLengthMultiplier(multiplier: number): void {
    this.lengthMultiplier = Math.max(0, multiplier);
  }

  public getLengthMultiplier(): number {
    return this.lengthMultiplier;
  }

  public reset(): void {
    this.enabled = true;
    this.opacityMultiplier = 1.0;
    this.lengthMultiplier = 1.0;
  }
}

export const shadowConfig = ShadowConfigManager.getInstance();

export interface ShadowParams {
  dx: number;
  dy: number;
  lengthRatio: number;
  blur: number;
  color: string;
  isNight: boolean;
  shadowAngle: number;
}

/**
 * Calculates dynamic sun and moon directional drop shadow parameters based on in-game time (0..1440 minutes).
 */
export function getDirectionalShadowParams(gameTime: number = 720, weather?: string): ShadowParams {
  if (!shadowConfig.getIsEnabled()) {
    return {
      dx: 0,
      dy: 0,
      lengthRatio: 0,
      blur: 0,
      color: 'rgba(0, 0, 0, 0)',
      isNight: false,
      shadowAngle: 0,
    };
  }

  const normMin = ((gameTime % 1440) + 1440) % 1440;
  const isNight = normMin >= 1200 || normMin < 360; // 20:00 to 06:00

  let shadowAngle = 0;
  let lengthRatio = 0.5;
  let opacity = 0.35;
  let color = 'rgba(15, 23, 42, 0.4)';

  if (!isNight) {
    // Daytime: 06:00 (360m) to 20:00 (1200m)
    const dayProgress = (normMin - 360) / 840; // 0.0 at dawn, 0.5 at noon, 1.0 at dusk
    // Sun rises in East (dawn) -> shadow points Northwest (dx < 0, dy < 0)
    // Sun in South (noon) -> shadow points North (dx = 0, dy < 0)
    // Sun sets in West (dusk) -> shadow points Northeast (dx > 0, dy < 0)
    shadowAngle = -Math.PI * 0.5 + (dayProgress - 0.5) * (Math.PI * 0.7);

    // Altitude factor: sin curve peaking at noon (13:00)
    const sunAlt = Math.sin(dayProgress * Math.PI); // 0 at dawn/dusk, 1.0 at noon

    // Long shadows at dawn & dusk (0.8 - 1.25), compact grounded shadows at noon (0.25)
    lengthRatio = (0.25 + (1.0 - sunAlt) * 0.85) * shadowConfig.getLengthMultiplier();

    // Adjust shadow intensity for active weather
    const weatherDim = weather === 'foggy' ? 0.4 : weather === 'rainy' || weather === 'blizzard' || weather === 'sandstorm' ? 0.5 : 1.0;
    opacity = Math.max(0.05, 0.40 * Math.max(0.4, sunAlt) * weatherDim * shadowConfig.getOpacityMultiplier());
    color = `rgba(15, 23, 42, ${opacity.toFixed(2)})`;
  } else {
    // Nighttime: 20:00 (1200m) to 06:00 (360m)
    const nightProgress = (normMin >= 1200 ? normMin - 1200 : normMin + 240) / 600;
    shadowAngle = -Math.PI * 0.5 + (nightProgress - 0.5) * (Math.PI * 0.6);

    const moonAlt = Math.sin(nightProgress * Math.PI);
    lengthRatio = (0.3 + (1.0 - moonAlt) * 0.5) * shadowConfig.getLengthMultiplier();
    opacity = Math.max(0.04, 0.22 * Math.max(0.3, moonAlt) * shadowConfig.getOpacityMultiplier());
    color = `rgba(30, 41, 59, ${opacity.toFixed(2)})`; // Cool slate blue moonlight shadow
  }

  const dx = Math.cos(shadowAngle) * (16 * lengthRatio);
  const dy = Math.sin(shadowAngle) * (16 * lengthRatio);

  return {
    dx,
    dy,
    lengthRatio,
    blur: Math.max(2, 6 * lengthRatio),
    color,
    isNight,
    shadowAngle,
  };
}

/**
 * Checks whether a given tile type casts an environmental directional drop shadow.
 */
export function isShadowCastingTile(tile: TileType): boolean {
  return isTileShadowCaster(tile);
}

/**
 * Renders a directional drop shadow for environmental structures and trees.
 */
export function renderTileDirectionalShadow(
  ctx: CanvasRenderingContext2D,
  rx: number,
  ry: number,
  tileSize: number,
  tile: TileType,
  shadowParams: ShadowParams
) {
  if (!shadowConfig.getIsEnabled()) return;
  ctx.save();
  ctx.fillStyle = shadowParams.color;

  const shadowType = getTileShadowType(tile);
  const isTree = shadowType === 'tree';
  const isWallOrStructure = shadowType === 'wall';

  if (isTree) {
    // Tree canopy shadow: soft slanted oval extending in shadow direction
    ctx.beginPath();
    const shadowCenterX = rx + tileSize / 2 + shadowParams.dx;
    const shadowCenterY = ry + tileSize * 0.75 + shadowParams.dy * 0.8;
    const radiusX = Math.max(4, tileSize * 0.42 * shadowParams.lengthRatio);
    const radiusY = Math.max(2, tileSize * 0.22);
    ctx.ellipse(shadowCenterX, shadowCenterY, radiusX, radiusY, shadowParams.shadowAngle, 0, Math.PI * 2);
    ctx.fill();
  } else if (isWallOrStructure) {
    // Wall shadow: projection polygon offset in shadow vector
    ctx.beginPath();
    ctx.moveTo(rx, ry + tileSize);
    ctx.lineTo(rx + tileSize, ry + tileSize);
    ctx.lineTo(rx + tileSize + shadowParams.dx, ry + tileSize + shadowParams.dy);
    ctx.lineTo(rx + shadowParams.dx, ry + tileSize + shadowParams.dy);
    ctx.closePath();
    ctx.fill();
  } else {
    // Compact grounded object shadow (Sign, Bush, Anvil, Gate)
    ctx.beginPath();
    const shadowCenterX = rx + tileSize / 2 + shadowParams.dx * 0.7;
    const shadowCenterY = ry + tileSize * 0.85 + shadowParams.dy * 0.7;
    const radiusX = Math.max(3, tileSize * 0.3 * shadowParams.lengthRatio);
    const radiusY = Math.max(2, tileSize * 0.16);
    ctx.ellipse(shadowCenterX, shadowCenterY, radiusX, radiusY, shadowParams.shadowAngle, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders a soft grounded directional drop shadow underneath living entities (Player, NPCs, Enemies).
 */
export function renderEntityDirectionalShadow(
  ctx: CanvasRenderingContext2D,
  rx: number,
  ry: number,
  tileSize: number,
  shadowParams: ShadowParams,
  scale: number = 1.0
) {
  if (!shadowConfig.getIsEnabled()) return;
  ctx.save();
  ctx.fillStyle = shadowParams.color;
  ctx.beginPath();
  const shadowCenterX = rx + tileSize / 2 + shadowParams.dx * 0.6;
  const shadowCenterY = ry + tileSize * 0.85 + shadowParams.dy * 0.5;
  const radiusX = Math.max(3, tileSize * 0.35 * scale * shadowParams.lengthRatio);
  const radiusY = Math.max(2, tileSize * 0.18 * scale);
  ctx.ellipse(shadowCenterX, shadowCenterY, radiusX, radiusY, shadowParams.shadowAngle, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
