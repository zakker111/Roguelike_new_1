/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, TileType } from '../types';
import { lightingEngine } from './lightingEngine';

export interface BloomEmitter {
  x: number;
  y: number;
  radius: number;
  colorType: 'fire' | 'magic' | 'shock' | 'frost' | 'poison' | 'white';
  intensity: number;
}

export class BloomEngine {
  private static instance: BloomEngine;

  private stampsInitialized = false;
  private bloomStamps: Map<string, HTMLCanvasElement> = new Map();
  private isEnabled = true;

  private constructor() {}

  public static getInstance(): BloomEngine {
    if (!BloomEngine.instance) {
      BloomEngine.instance = new BloomEngine();
    }
    return BloomEngine.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Initializes pre-rendered soft gaussian-like radial gradient stamps in memory.
   * Blitting these via drawImage with additive 'lighter' blending achieves high-end
   * luminous HDR bloom at 60 FPS without costly GPU frame buffer convolutions.
   */
  private initStamps(): void {
    if (this.stampsInitialized || typeof document === 'undefined') return;

    const createStamp = (
      innerRgba: string,
      midRgba: string,
      outerRgba: string
    ): HTMLCanvasElement => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      grad.addColorStop(0, innerRgba);
      grad.addColorStop(0.35, midRgba);
      grad.addColorStop(0.75, outerRgba);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      return canvas;
    };

    // 1. Warm Fire / Torch Bloom (amber-orange)
    this.bloomStamps.set(
      'fire',
      createStamp(
        'rgba(254, 243, 199, 0.75)',
        'rgba(245, 158, 11, 0.35)',
        'rgba(217, 119, 6, 0.08)'
      )
    );

    // 2. Arcane Magic Bloom (violet-magenta)
    this.bloomStamps.set(
      'magic',
      createStamp(
        'rgba(245, 208, 254, 0.75)',
        'rgba(192, 132, 252, 0.38)',
        'rgba(147, 51, 234, 0.09)'
      )
    );

    // 3. Shock / Electric Bloom (cyan-azure)
    this.bloomStamps.set(
      'shock',
      createStamp(
        'rgba(224, 242, 254, 0.85)',
        'rgba(56, 189, 248, 0.42)',
        'rgba(2, 132, 199, 0.09)'
      )
    );

    // 4. Frost / Cryo Bloom (pale arctic blue)
    this.bloomStamps.set(
      'frost',
      createStamp(
        'rgba(240, 249, 255, 0.75)',
        'rgba(186, 230, 253, 0.32)',
        'rgba(56, 189, 248, 0.08)'
      )
    );

    // 5. Poison / Bio-luminescence Bloom (lime-emerald)
    this.bloomStamps.set(
      'poison',
      createStamp(
        'rgba(236, 252, 203, 0.75)',
        'rgba(132, 204, 22, 0.35)',
        'rgba(22, 101, 52, 0.08)'
      )
    );

    // 6. White Core High-Intensity Bloom
    this.bloomStamps.set(
      'white',
      createStamp(
        'rgba(255, 255, 255, 0.90)',
        'rgba(241, 245, 249, 0.35)',
        'rgba(148, 163, 184, 0.06)'
      )
    );

    this.stampsInitialized = true;
  }

  /**
   * Renders the additive HDR bloom pass for high-luminance light emitters,
   * magic spells, torches, elemental fields, and lava pools.
   */
  public renderBloomPass(
    ctx: CanvasRenderingContext2D,
    gameState: GameState,
    camX: number,
    camY: number,
    dimensions: { width: number; height: number },
    tileSize: number = 28
  ): void {
    if (!this.isEnabled || typeof document === 'undefined') return;

    this.initStamps();

    const now = Date.now();
    const timeSec = now * 0.002;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const renderEmitter = (emitter: BloomEmitter) => {
      const screenX = Math.round(emitter.x * tileSize + tileSize * 0.5 - camX);
      const screenY = Math.round(emitter.y * tileSize + tileSize * 0.5 - camY);

      // Frustum culling
      if (
        screenX + emitter.radius < 0 ||
        screenX - emitter.radius > dimensions.width ||
        screenY + emitter.radius < 0 ||
        screenY - emitter.radius > dimensions.height
      ) {
        return;
      }

      const stamp = this.bloomStamps.get(emitter.colorType) ?? this.bloomStamps.get('fire');
      if (!stamp) return;

      ctx.globalAlpha = Math.min(1.0, Math.max(0, emitter.intensity));
      const r = emitter.radius;
      ctx.drawImage(stamp, screenX - r, screenY - r, r * 2, r * 2);
    };

    // 1. Player Lantern / Torch Bloom
    const playerFlicker = Math.sin(timeSec * 3.5) * 0.05 + Math.cos(timeSec * 5.1) * 0.03;
    renderEmitter({
      x: gameState.playerX,
      y: gameState.playerY,
      radius: tileSize * 2.8 * (1 + playerFlicker),
      colorType: 'fire',
      intensity: 0.35 + playerFlicker * 0.4,
    });

    // 2. Visible Map Light Sources (Fireplaces, Anvils, Shrines, Lava)
    const map = gameState.map;
    const vis = gameState.visible;
    const startX = Math.max(0, Math.floor(camX / tileSize) - 1);
    const endX = Math.min(gameState.levelWidth, Math.ceil((camX + dimensions.width) / tileSize) + 1);
    const startY = Math.max(0, Math.floor(camY / tileSize) - 1);
    const endY = Math.min(gameState.levelHeight, Math.ceil((camY + dimensions.height) / tileSize) + 1);

    for (let y = startY; y < endY; y++) {
      const mapRow = map[y];
      const visRow = vis[y];
      if (!mapRow) continue;

      for (let x = startX; x < endX; x++) {
        if (!visRow?.[x]) continue;

        const tile = mapRow[x];
        if (tile === TileType.Fireplace) {
          const flk = Math.sin(timeSec * 4 + x * 2) * 0.06;
          renderEmitter({
            x,
            y,
            radius: tileSize * 2.4 * (1 + flk),
            colorType: 'fire',
            intensity: 0.42 + flk,
          });
        }
      }
    }

    // 3. Active Elemental Fields Bloom (Fire, Shock, Steam, Poison Gas)
    if (gameState.elementalFields && gameState.elementalFields.length > 0) {
      for (const field of gameState.elementalFields) {
        if (field.duration <= 0) continue;

        // Check visibility
        if (vis[field.y]?.[field.x]) {
          if (field.element === 'fire') {
            const flk = Math.sin(timeSec * 6 + field.x * 3) * 0.08;
            renderEmitter({
              x: field.x,
              y: field.y,
              radius: tileSize * (1.6 + field.intensity * 0.5) * (1 + flk),
              colorType: 'fire',
              intensity: Math.min(0.55, 0.25 + field.intensity * 0.1),
            });
          } else if (field.element === 'shock') {
            const arc = Math.random() < 0.4 ? 0.5 : 0.2;
            renderEmitter({
              x: field.x,
              y: field.y,
              radius: tileSize * 1.8,
              colorType: 'shock',
              intensity: 0.35 + arc * 0.3,
            });
          } else if (field.element === 'poison_gas') {
            renderEmitter({
              x: field.x,
              y: field.y,
              radius: tileSize * 1.5,
              colorType: 'poison',
              intensity: 0.18 + Math.sin(timeSec * 2 + field.x) * 0.05,
            });
          } else if (field.element === 'ice') {
            renderEmitter({
              x: field.x,
              y: field.y,
              radius: tileSize * 1.3,
              colorType: 'frost',
              intensity: 0.22,
            });
          }
        }
      }
    }

    ctx.restore();
  }
}

export const bloomEngine = BloomEngine.getInstance();
