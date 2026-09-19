/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState } from '../types';

export class VignetteRenderer {
  private static instance: VignetteRenderer;
  private isEnabled = true;

  private constructor() {}

  public static getInstance(): VignetteRenderer {
    if (!VignetteRenderer.instance) {
      VignetteRenderer.instance = new VignetteRenderer();
    }
    return VignetteRenderer.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Renders dynamic atmospheric vignette shading around the viewport perimeter.
   * Deepens in subterranean dungeons and night cycles; softens in daylight;
   * and adapts to blood moon or blizzard atmospheric states.
   */
  public renderVignettePass(
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number; height: number },
    gameState: GameState
  ): void {
    if (!this.isEnabled) return;

    const { width, height } = dimensions;
    if (width <= 0 || height <= 0) return;

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const maxRadius = Math.hypot(centerX, centerY);

    // Subtle breathing pulsation synchronized with lantern flicker
    const nowSec = Date.now() * 0.002;
    const lanternBreath = Math.sin(nowSec * 2.8) * 0.02;

    // Base inner radius (where vignette begins fading in)
    const innerRadius = maxRadius * (0.48 + lanternBreath);

    // Contextual darkness factor
    let outerDarkness = 0.35; // Standard overworld daytime subtle framing
    let rimColor = '0, 0, 0';

    if (!gameState.isOverworld) {
      // Subterranean dungeon depth scaling: deeper levels feel heavier and more claustrophobic
      const depth = gameState.currentDungeonDepth || gameState.dungeonLevel || 1;
      outerDarkness = Math.min(0.72, 0.48 + depth * 0.07);
    } else {
      // Overworld day / night / weather adjustments based on gameTime (0-1439 mins)
      const gameTime = gameState.gameTime ?? 480;
      const isNight = gameTime < 360 || gameTime >= 1260;
      const isTwilight = (gameTime >= 360 && gameTime < 480) || (gameTime >= 1080 && gameTime < 1260);

      if (isNight) {
        outerDarkness = 0.62;
      } else if (isTwilight) {
        outerDarkness = 0.45;
      }

      if (gameState.weather === 'blizzard' || gameState.weather === 'foggy' || gameState.weather === 'sandstorm') {
        outerDarkness = Math.min(0.68, outerDarkness + 0.12);
      }
    }

    // Atmospheric special state tints
    const isBloodMoon = (gameState.bloodMoonTurnsLeft ?? 0) > 0;
    const isBlizzard = gameState.weather === 'snowy' && gameState.biome === 'tundra';

    ctx.save();

    const vignetteGrad = ctx.createRadialGradient(
      centerX,
      centerY,
      innerRadius,
      centerX,
      centerY,
      maxRadius
    );

    if (isBloodMoon) {
      vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGrad.addColorStop(0.65, `rgba(80, 7, 7, ${(outerDarkness * 0.4).toFixed(3)})`);
      vignetteGrad.addColorStop(1, `rgba(40, 2, 2, ${outerDarkness.toFixed(3)})`);
    } else if (isBlizzard) {
      vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGrad.addColorStop(0.7, `rgba(224, 242, 254, ${(outerDarkness * 0.25).toFixed(3)})`);
      vignetteGrad.addColorStop(1, `rgba(15, 23, 42, ${outerDarkness.toFixed(3)})`);
    } else {
      vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGrad.addColorStop(0.75, `rgba(${rimColor}, ${(outerDarkness * 0.5).toFixed(3)})`);
      vignetteGrad.addColorStop(1, `rgba(${rimColor}, ${outerDarkness.toFixed(3)})`);
    }

    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}

export const vignetteRenderer = VignetteRenderer.getInstance();
