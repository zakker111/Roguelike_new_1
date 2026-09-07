/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, TileType, getMoonPhase } from '../types';

export interface PointLight {
  id: string;
  gridX: number;
  gridY: number;
  radius: number; // in world pixels
  baseColor: string; // Hex or rgba
  coreColor?: string;
  intensity: number; // 0.0 to 1.0
  flickerSpeed: number;
  flickerMagnitude: number; // e.g. 0.08 for +/- 8%
  type: 'player_lantern' | 'torch' | 'campfire' | 'fireplace' | 'lava' | 'shrine' | 'magic' | 'poi';
  phaseOffset: number;
}

export class LightingEngine {
  private static instance: LightingEngine;

  // Pre-allocated point light pool (eliminates per-frame garbage collection)
  private readonly lightCapacity: number = 64;
  private lightsPool: PointLight[];
  private activeLightCount: number = 0;

  // Persistent offscreen canvas for darkness mask rendering
  private darknessCanvas: HTMLCanvasElement | null = null;
  private darkCtx: CanvasRenderingContext2D | null = null;

  // Pre-rendered radial gradient cookie stamps (hardware accelerated drawImage blitting)
  private stampsInitialized: boolean = false;
  private cutoutStamp: HTMLCanvasElement | null = null;
  private lanternHaloStamp: HTMLCanvasElement | null = null;
  private fireHaloStamp: HTMLCanvasElement | null = null;
  private magicHaloStamp: HTMLCanvasElement | null = null;
  private lavaHaloStamp: HTMLCanvasElement | null = null;

  private constructor() {
    this.lightsPool = new Array(this.lightCapacity);
    for (let i = 0; i < this.lightCapacity; i++) {
      this.lightsPool[i] = {
        id: `light_slot_${i}`,
        gridX: 0,
        gridY: 0,
        radius: 32,
        baseColor: '#f59e0b',
        coreColor: '#fde68a',
        intensity: 0.5,
        flickerSpeed: 1.0,
        flickerMagnitude: 0.04,
        type: 'torch',
        phaseOffset: 0,
      };
    }
  }

  public static getInstance(): LightingEngine {
    if (!LightingEngine.instance) {
      LightingEngine.instance = new LightingEngine();
    }
    return LightingEngine.instance;
  }

  /**
   * Generates reusable 128x128 radial gradient cookie stamps once in memory.
   * This bypasses calling createRadialGradient() and vector arc path rasterization 40+ times per frame.
   */
  private initStamps(): void {
    if (this.stampsInitialized || typeof document === 'undefined') return;

    const createStampCanvas = (): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      return { canvas, ctx };
    };

    // 1. Cutout Stamp (Radial Alpha Falloff for Destination-Out blending)
    const cutout = createStampCanvas();
    const cutGrad = cutout.ctx.createRadialGradient(64, 64, 64 * 0.12, 64, 64, 64);
    cutGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    cutGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.85)');
    cutGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.45)');
    cutGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cutout.ctx.fillStyle = cutGrad;
    cutout.ctx.beginPath();
    cutout.ctx.arc(64, 64, 64, 0, Math.PI * 2);
    cutout.ctx.fill();
    this.cutoutStamp = cutout.canvas;

    // 2. Player Lantern Halo Stamp
    const lantern = createStampCanvas();
    const lanGrad = lantern.ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    lanGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    lanGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.15)');
    lanGrad.addColorStop(0.75, 'rgba(245, 158, 11, 0.05)');
    lanGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    lantern.ctx.fillStyle = lanGrad;
    lantern.ctx.beginPath();
    lantern.ctx.arc(64, 64, 64, 0, Math.PI * 2);
    lantern.ctx.fill();
    this.lanternHaloStamp = lantern.canvas;

    // 3. Fire / Campfire / Torch Halo Stamp
    const fire = createStampCanvas();
    const fireGrad = fire.ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    fireGrad.addColorStop(0, 'rgba(254, 240, 138, 0.50)');
    fireGrad.addColorStop(0.35, 'rgba(249, 115, 22, 0.25)');
    fireGrad.addColorStop(0.75, 'rgba(245, 158, 11, 0.08)');
    fireGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    fire.ctx.fillStyle = fireGrad;
    fire.ctx.beginPath();
    fire.ctx.arc(64, 64, 64, 0, Math.PI * 2);
    fire.ctx.fill();
    this.fireHaloStamp = fire.canvas;

    // 4. Magic / Shrine Halo Stamp
    const magic = createStampCanvas();
    const magicGrad = magic.ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    magicGrad.addColorStop(0, 'rgba(224, 242, 254, 0.50)');
    magicGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.25)');
    magicGrad.addColorStop(0.75, 'rgba(129, 140, 248, 0.08)');
    magicGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    magic.ctx.fillStyle = magicGrad;
    magic.ctx.beginPath();
    magic.ctx.arc(64, 64, 64, 0, Math.PI * 2);
    magic.ctx.fill();
    this.magicHaloStamp = magic.canvas;

    // 5. Lava / Trap Fire Halo Stamp
    const lava = createStampCanvas();
    const lavaGrad = lava.ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    lavaGrad.addColorStop(0, 'rgba(254, 215, 170, 0.50)');
    lavaGrad.addColorStop(0.35, 'rgba(239, 68, 68, 0.25)');
    lavaGrad.addColorStop(0.75, 'rgba(185, 28, 28, 0.08)');
    lavaGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    lava.ctx.fillStyle = lavaGrad;
    lava.ctx.beginPath();
    lava.ctx.arc(64, 64, 64, 0, Math.PI * 2);
    lava.ctx.fill();
    this.lavaHaloStamp = lava.canvas;

    this.stampsInitialized = true;
  }

  private getHaloStampForType(type: PointLight['type']): HTMLCanvasElement | null {
    if (type === 'player_lantern') return this.lanternHaloStamp;
    if (type === 'torch' || type === 'campfire' || type === 'fireplace') return this.fireHaloStamp;
    if (type === 'shrine' || type === 'magic' || type === 'poi') return this.magicHaloStamp;
    if (type === 'lava') return this.lavaHaloStamp;
    return this.fireHaloStamp;
  }

  /**
   * Calculates procedural multi-frequency harmonic flicker for organic, alive flame lighting.
   */
  public calculateFlicker(timeMs: number, speed: number, magnitude: number, phase: number): { radiusMultiplier: number; intensityMultiplier: number } {
    const t = timeMs * 0.003 * speed;
    
    // Harmonic frequencies
    const wave1 = Math.sin(t * 1.7 + phase);
    const wave2 = Math.cos(t * 3.1 + phase * 1.5);
    const wave3 = Math.sin(t * 6.3 + phase * 2.3);

    const combined = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
    
    const radiusMultiplier = 1.0 + combined * magnitude;
    const intensityMultiplier = 1.0 + combined * (magnitude * 0.85);

    return {
      radiusMultiplier: Math.max(0.7, Math.min(1.3, radiusMultiplier)),
      intensityMultiplier: Math.max(0.65, Math.min(1.25, intensityMultiplier)),
    };
  }

  /**
   * Evaluates the ambient darkness level based on time of day, location (overworld vs dungeon), and weather.
   */
  public getAmbientDarkness(gameState: GameState, lightningFlashAlpha: number = 0): {
    darknessAlpha: number;
    ambientTint: string;
    isDark: boolean;
  } {
    // If lightning flash is active, darkness is instantly blown out by celestial bolt illumination
    if (lightningFlashAlpha > 0.05) {
      const remainingDark = Math.max(0, 1.0 - lightningFlashAlpha * 1.5);
      return {
        darknessAlpha: 0.15 * remainingDark,
        ambientTint: 'rgba(224, 242, 254, 0.9)',
        isDark: remainingDark > 0.3,
      };
    }

    if (!gameState.isOverworld) {
      // Dungeon Darkness scaling with depth
      const depth = gameState.playerStats?.depth || 1;
      const isUnderworld = depth >= 6;
      
      let dungeonDarkness = Math.min(0.88, 0.62 + depth * 0.04);
      let ambientColor = 'rgba(2, 6, 23, 0.88)'; // Deep abyssal crypt slate

      if (isUnderworld) {
        // Fiery underworld crimson darkness
        ambientColor = 'rgba(20, 2, 2, 0.85)';
        dungeonDarkness = 0.82;
      }

      return {
        darknessAlpha: dungeonDarkness,
        ambientTint: ambientColor,
        isDark: true,
      };
    }

    // Overworld: Day-Night Cycle
    const rawMins = ((gameState.gameTime || 720) % 1440 + 1440) % 1440;
    let lightCoeff = 1.0;

    if (rawMins < 360) {
      // Night (00:00 to 06:00)
      lightCoeff = 0.22 + (rawMins / 360) * 0.35;
    } else if (rawMins >= 360 && rawMins < 480) {
      // Dawn (06:00 to 08:00)
      lightCoeff = 0.57 + ((rawMins - 360) / 120) * 0.43;
    } else if (rawMins >= 480 && rawMins < 1080) {
      // Midday (08:00 to 18:00)
      lightCoeff = 1.0;
    } else if (rawMins >= 1080 && rawMins < 1200) {
      // Dusk (18:00 to 20:00)
      lightCoeff = 1.0 - ((rawMins - 1080) / 120) * 0.45;
    } else {
      // Evening (20:00 to 24:00)
      lightCoeff = 0.55 - ((rawMins - 1200) / 240) * 0.33;
    }

    // Weather dimming (e.g. storms and blizzards dim daylight)
    if (gameState.weather === 'rainy' || (gameState.weather as string) === 'stormy' || gameState.weather === 'ashfall') {
      lightCoeff *= 0.78;
    } else if (gameState.weather === 'foggy') {
      lightCoeff *= 0.85;
    } else if (gameState.weather === 'blizzard') {
      lightCoeff *= 0.72;
    }

    const darknessAlpha = Math.max(0, Math.min(0.85, (1.0 - lightCoeff) * 0.92));
    
    // Moon phase ambient tint at night
    const moonPhase = getMoonPhase(gameState.playerStats?.turnsPlayed || 0);
    let ambientTint = 'rgba(15, 23, 42, 0.85)'; // Slate navy

    if (moonPhase.id === 'full_moon') {
      ambientTint = 'rgba(199, 210, 254, 0.65)'; // Ethereal moonlight silver
    } else if (moonPhase.id === 'blood_moon' || (gameState.bloodMoonTurnsLeft && gameState.bloodMoonTurnsLeft > 0)) {
      ambientTint = 'rgba(69, 10, 10, 0.85)'; // Blood moon crimson gloom
    } else if (moonPhase.id === 'new_moon') {
      ambientTint = 'rgba(2, 6, 23, 0.92)'; // Pitch void black
    } else if (moonPhase.id === 'waxing_crescent') {
      ambientTint = 'rgba(25, 20, 45, 0.82)'; // Deep purple starlight
    }

    return {
      darknessAlpha,
      ambientTint,
      isDark: darknessAlpha > 0.12,
    };
  }

  private pushLightToPool(
    id: string,
    gridX: number,
    gridY: number,
    radius: number,
    baseColor: string,
    coreColor: string | undefined,
    intensity: number,
    flickerSpeed: number,
    flickerMagnitude: number,
    type: PointLight['type'],
    phaseOffset: number
  ): void {
    if (this.activeLightCount >= this.lightCapacity) return;
    const slot = this.lightsPool[this.activeLightCount];
    slot.id = id;
    slot.gridX = gridX;
    slot.gridY = gridY;
    slot.radius = radius;
    slot.baseColor = baseColor;
    slot.coreColor = coreColor;
    slot.intensity = intensity;
    slot.flickerSpeed = flickerSpeed;
    slot.flickerMagnitude = flickerMagnitude;
    slot.type = type;
    slot.phaseOffset = phaseOffset;
    this.activeLightCount++;
  }

  /**
   * Discovers and registers active point lights into the internal pre-allocated light pool.
   * Returns active light count with zero heap allocations.
   */
  public populatePointLights(
    gameState: GameState,
    camX: number,
    camY: number,
    dimensions: { width: number; height: number },
    tileSize: number
  ): number {
    this.activeLightCount = 0;
    const bufferTiles = 6;

    const startX = Math.max(0, Math.floor(camX / tileSize) - bufferTiles);
    const endX = Math.min(gameState.levelWidth, Math.ceil((camX + dimensions.width) / tileSize) + bufferTiles);
    const startY = Math.max(0, Math.floor(camY / tileSize) - bufferTiles);
    const endY = Math.min(gameState.levelHeight, Math.ceil((camY + dimensions.height) / tileSize) + bufferTiles);

    // 1. Player Personal Lantern / Torch (Soft, natural ambient illumination)
    this.pushLightToPool(
      'player_lantern',
      gameState.playerX,
      gameState.playerY,
      tileSize * 2.8,
      '#f59e0b',
      '#fde68a',
      0.40,
      0.8,
      0.02,
      'player_lantern',
      0.5
    );

    // 2. Scan tiles in viewport for light-emitting structures and props
    for (let y = startY; y < endY; y++) {
      const row = gameState.map[y];
      if (!row) continue;

      for (let x = startX; x < endX; x++) {
        const tile = row[x];
        const phase = (x * 37 + y * 73) % 100 * 0.0628;

        if (tile === TileType.Campfire || tile === TileType.Fireplace) {
          this.pushLightToPool(
            `fire_${x}_${y}`,
            x,
            y,
            tileSize * 4.8,
            '#f97316',
            '#fed7aa',
            0.65,
            1.6,
            0.06,
            'campfire',
            phase
          );
        } else if (tile === TileType.Torch) {
          this.pushLightToPool(
            `torch_${x}_${y}`,
            x,
            y,
            tileSize * 3.2,
            '#f59e0b',
            '#fef3c7',
            0.55,
            1.4,
            0.05,
            'torch',
            phase
          );
        } else if (tile === TileType.DungeonEntrance) {
          this.pushLightToPool(
            `dungeon_glow_${x}_${y}`,
            x,
            y,
            tileSize * 2.8,
            '#818cf8',
            '#c7d2fe',
            0.45,
            0.8,
            0.03,
            'magic',
            phase
          );
        }
      }
    }

    // 3. Shrines and Interactive Props / POIs
    if (gameState.dungeonProps) {
      for (const prop of gameState.dungeonProps) {
        if (prop.x >= startX && prop.x <= endX && prop.y >= startY && prop.y <= endY) {
          const phase = (prop.x * 19 + prop.y * 53) % 100 * 0.0628;
          const isShrine = prop.name?.toLowerCase().includes('shrine') || prop.name?.toLowerCase().includes('altar') || prop.name?.toLowerCase().includes('crystal');
          if (isShrine) {
            this.pushLightToPool(
              `prop_${prop.id || `${prop.x}_${prop.y}`}`,
              prop.x,
              prop.y,
              tileSize * 3.4,
              '#38bdf8',
              '#e0f2fe',
              0.50,
              0.6,
              0.04,
              'shrine',
              phase
            );
          }
        }
      }
    }

    // Check chunk POIs if on overworld
    if (gameState.isOverworld) {
      const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
      const chunkPois = gameState.overworldChunks?.[chunkKey]?.pois;
      if (chunkPois) {
        for (const poi of chunkPois) {
          if (poi.x >= startX && poi.x <= endX && poi.y >= startY && poi.y <= endY) {
            const phase = (poi.x * 23 + poi.y * 47) % 100 * 0.0628;
            this.pushLightToPool(
              `chunk_poi_${poi.id || `${poi.x}_${poi.y}`}`,
              poi.x,
              poi.y,
              tileSize * 3.2,
              '#38bdf8',
              '#bae6fd',
              0.48,
              0.7,
              0.03,
              'poi',
              phase
            );
          }
        }
      }
    }

    // 4. Traps with glowing elements (FireVent, MagmaEruption, SulfurVent)
    if (gameState.traps) {
      for (const trap of gameState.traps) {
        if (trap.x >= startX && trap.x <= endX && trap.y >= startY && trap.y <= endY) {
          if (trap.type === 'FireVent' || trap.type === 'MagmaEruption') {
            this.pushLightToPool(
              `trap_fire_${trap.id}`,
              trap.x,
              trap.y,
              tileSize * 2.6,
              '#ef4444',
              '#fed7aa',
              0.50,
              2.0,
              0.08,
              'lava',
              trap.x * 0.5
            );
          }
        }
      }
    }

    return this.activeLightCount;
  }

  /**
   * Dynamically discovers and registers all active point light sources within the camera viewport.
   * Backward-compatible method returning array slice.
   */
  public collectPointLights(
    gameState: GameState,
    camX: number,
    camY: number,
    dimensions: { width: number; height: number },
    tileSize: number
  ): PointLight[] {
    this.populatePointLights(gameState, camX, camY, dimensions, tileSize);
    return this.lightsPool.slice(0, this.activeLightCount);
  }

  /**
   * Renders the complete 2D multi-light radial shader pass onto the canvas.
   * Utilizes a persistent offscreen canvas and pre-rendered radial cookie stamps
   * for zero-allocation 60 FPS hardware-accelerated composition.
   */
  public renderLightingPass(
    ctx: CanvasRenderingContext2D,
    gameState: GameState,
    camX: number,
    camY: number,
    dimensions: { width: number; height: number },
    tileSize: number,
    lightningFlashAlpha: number = 0
  ) {
    const ambient = this.getAmbientDarkness(gameState, lightningFlashAlpha);
    if (!ambient.isDark && lightningFlashAlpha <= 0) return;

    if (typeof document === 'undefined') {
      return;
    }

    this.initStamps();
    const lightCount = this.populatePointLights(gameState, camX, camY, dimensions, tileSize);
    const now = Date.now();

    ctx.save();

    // 1. Maintain persistent reusable darkness canvas
    if (!this.darknessCanvas) {
      this.darknessCanvas = document.createElement('canvas');
      this.darknessCanvas.width = dimensions.width;
      this.darknessCanvas.height = dimensions.height;
      this.darkCtx = this.darknessCanvas.getContext('2d');
    } else if (this.darknessCanvas.width !== dimensions.width || this.darknessCanvas.height !== dimensions.height) {
      this.darknessCanvas.width = dimensions.width;
      this.darknessCanvas.height = dimensions.height;
    }

    const darkCtx = this.darkCtx;
    if (!darkCtx) {
      ctx.restore();
      return;
    }

    // Fill darkness layer with ambient color & opacity
    darkCtx.globalCompositeOperation = 'source-over';
    darkCtx.globalAlpha = 1.0;
    darkCtx.fillStyle = ambient.ambientTint;
    darkCtx.fillRect(0, 0, dimensions.width, dimensions.height);

    // 2. Cut out radial light cones using pre-rendered stamp and 'destination-out' blending
    darkCtx.globalCompositeOperation = 'destination-out';

    for (let i = 0; i < lightCount; i++) {
      const light = this.lightsPool[i];
      const screenX = Math.round(light.gridX * tileSize + tileSize / 2 - camX);
      const screenY = Math.round(light.gridY * tileSize + tileSize / 2 - camY);

      // Skip lights completely outside viewport
      if (
        screenX + light.radius < 0 ||
        screenX - light.radius > dimensions.width ||
        screenY + light.radius < 0 ||
        screenY - light.radius > dimensions.height
      ) {
        continue;
      }

      const flicker = this.calculateFlicker(now, light.flickerSpeed, light.flickerMagnitude, light.phaseOffset);
      const curRadius = light.radius * flicker.radiusMultiplier;
      const curIntensity = light.intensity * flicker.intensityMultiplier;

      darkCtx.globalAlpha = Math.min(1.0, curIntensity);
      if (this.cutoutStamp) {
        darkCtx.drawImage(
          this.cutoutStamp,
          screenX - curRadius,
          screenY - curRadius,
          curRadius * 2,
          curRadius * 2
        );
      }
    }

    // 3. Draw carved darkness mask onto main game canvas
    ctx.drawImage(this.darknessCanvas, 0, 0);

    // 4. Layer warm additive colored light halos on top using 'screen' blending
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < lightCount; i++) {
      const light = this.lightsPool[i];
      const screenX = Math.round(light.gridX * tileSize + tileSize / 2 - camX);
      const screenY = Math.round(light.gridY * tileSize + tileSize / 2 - camY);

      if (
        screenX + light.radius < 0 ||
        screenX - light.radius > dimensions.width ||
        screenY + light.radius < 0 ||
        screenY - light.radius > dimensions.height
      ) {
        continue;
      }

      const flicker = this.calculateFlicker(now, light.flickerSpeed, light.flickerMagnitude, light.phaseOffset);
      const curRadius = light.radius * flicker.radiusMultiplier;
      const curIntensity = light.intensity * flicker.intensityMultiplier;

      const isPlayerLantern = light.type === 'player_lantern';
      const haloRadiusFactor = isPlayerLantern ? 0.65 : 0.85;
      const haloRadius = curRadius * haloRadiusFactor;

      const stamp = this.getHaloStampForType(light.type);
      if (stamp) {
        ctx.globalAlpha = Math.min(1.0, curIntensity);
        ctx.drawImage(
          stamp,
          screenX - haloRadius,
          screenY - haloRadius,
          haloRadius * 2,
          haloRadius * 2
        );
      }
    }

    ctx.restore();
  }
}

export const lightingEngine = LightingEngine.getInstance();
