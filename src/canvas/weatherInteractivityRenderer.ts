/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, TileType } from '../types';

export interface PuddleRipple {
  x: number; // grid x
  y: number; // grid y
  screenX: number;
  screenY: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

export interface RainSplashParticle {
  screenX: number;
  screenY: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

class WeatherInteractivityManager {
  private ripples: PuddleRipple[] = [];
  private splashes: RainSplashParticle[] = [];
  private lastRippleSpawn = 0;

  /**
   * Updates and renders rain puddle ripples, ground splash bursts, and snow accumulation.
   */
  public renderInteractivity(
    ctx: CanvasRenderingContext2D,
    gameState: GameState,
    camX: number,
    camY: number,
    dimensions: { width: number; height: number },
    tileSize: number
  ) {
    const weather = gameState.weather || 'clear';
    const isRaining = weather === 'rainy' || (weather as string) === 'stormy' || weather === 'tidal_surge';
    const isSnowing = weather === 'snowy' || weather === 'blizzard';
    const isOverworld = gameState.isOverworld;

    if (!isOverworld && !isRaining && !isSnowing) {
      return;
    }

    const now = Date.now();

    // 1. Rain Puddle Ripples & Droplet Splashes
    if (isRaining) {
      this.updateAndRenderRainEffects(ctx, gameState, camX, camY, dimensions, tileSize, now, (weather as string) === 'stormy');
    }

    // 2. Snow & Frost Accumulation on Roofs, Walls, and Trees
    if (isSnowing || gameState.season === 'winter' || gameState.biome === 'tundra' || gameState.biome === 'glacial') {
      this.renderSnowAccumulation(ctx, gameState, camX, camY, dimensions, tileSize, isSnowing);
    }
  }

  private updateAndRenderRainEffects(
    ctx: CanvasRenderingContext2D,
    gameState: GameState,
    camX: number,
    camY: number,
    dimensions: { width: number; height: number },
    tileSize: number,
    now: number,
    isStormy: boolean
  ) {
    // Spawn new puddle ripples periodically on walkable floor/path/grass tiles
    const spawnInterval = isStormy ? 60 : 120;
    if (now - this.lastRippleSpawn > spawnInterval && this.ripples.length < 40) {
      this.lastRippleSpawn = now;

      // Pick a random spot in viewport
      const spawnScreenX = Math.random() * dimensions.width;
      const spawnScreenY = Math.random() * dimensions.height;
      const gridX = Math.floor((spawnScreenX + camX) / tileSize);
      const gridY = Math.floor((spawnScreenY + camY) / tileSize);

      if (gridX >= 0 && gridX < gameState.levelWidth && gridY >= 0 && gridY < gameState.levelHeight) {
        const tile = gameState.map[gridY]?.[gridX];
        // Only spawn ripples on ground surfaces (grass, path, floor)
        if (tile === TileType.Grass || tile === TileType.Path || tile === TileType.Floor) {
          const rx = gridX * tileSize + (Math.random() * 0.7 + 0.15) * tileSize - camX;
          const ry = gridY * tileSize + (Math.random() * 0.7 + 0.15) * tileSize - camY;

          this.ripples.push({
            x: gridX,
            y: gridY,
            screenX: rx,
            screenY: ry,
            radius: 1.5,
            maxRadius: 6.0 + Math.random() * 5.0,
            alpha: 0.65,
            speed: 0.18 + Math.random() * 0.1,
          });

          // Spawn 2-3 splash droplets
          const splashCount = isStormy ? 3 : 2;
          for (let s = 0; s < splashCount; s++) {
            this.splashes.push({
              screenX: rx,
              screenY: ry,
              vx: (Math.random() - 0.5) * 1.2,
              vy: -Math.random() * 1.8 - 0.5,
              life: 1.0,
              maxLife: 1.0,
              color: 'rgba(186, 230, 253, 0.85)',
            });
          }
        }
      }
    }

    ctx.save();

    // Render expanding circular puddle ripples
    ctx.lineWidth = 1.0;
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += rip.speed;
      const progress = rip.radius / rip.maxRadius;
      rip.alpha = (1.0 - progress) * 0.55;

      if (rip.alpha <= 0.02 || rip.radius >= rip.maxRadius) {
        this.ripples.splice(i, 1);
        continue;
      }

      ctx.strokeStyle = `rgba(186, 230, 253, ${rip.alpha.toFixed(2)})`;
      ctx.beginPath();
      // Render slightly squashed perspective oval
      ctx.ellipse(rip.screenX, rip.screenY, rip.radius, rip.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render splash droplets
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const splash = this.splashes[i];
      splash.screenX += splash.vx;
      splash.screenY += splash.vy;
      splash.vy += 0.15; // gravity
      splash.life -= 0.06;

      if (splash.life <= 0) {
        this.splashes.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `rgba(186, 230, 253, ${splash.life.toFixed(2)})`;
      ctx.fillRect(splash.screenX, splash.screenY, 1.5, 1.5);
    }

    ctx.restore();
  }

  private renderSnowAccumulation(
    ctx: CanvasRenderingContext2D,
    gameState: GameState,
    camX: number,
    camY: number,
    dimensions: { width: number; height: number },
    tileSize: number,
    isActivelySnowing: boolean
  ) {
    const startX = Math.max(0, Math.floor(camX / tileSize));
    const endX = Math.min(gameState.levelWidth, Math.ceil((camX + dimensions.width) / tileSize));
    const startY = Math.max(0, Math.floor(camY / tileSize));
    const endY = Math.min(gameState.levelHeight, Math.ceil((camY + dimensions.height) / tileSize));

    const snowOpacity = isActivelySnowing ? 0.75 : 0.45;

    ctx.save();
    ctx.fillStyle = `rgba(241, 245, 249, ${snowOpacity})`;

    for (let y = startY; y < endY; y++) {
      const row = gameState.map[y];
      const visRow = gameState.visible[y];
      if (!row) continue;

      const ry = y * tileSize - camY;

      for (let x = startX; x < endX; x++) {
        if (!visRow || !visRow[x]) continue;

        const tile = row[x];
        const rx = x * tileSize - camX;

        if (tile === TileType.Tree || tile === TileType.PineTree || tile === TileType.BirchTree) {
          // Delicate snow cap on top of tree foliage
          ctx.beginPath();
          ctx.ellipse(rx + tileSize / 2, ry + 4, tileSize * 0.38, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TileType.Wall || tile === TileType.WatchtowerWall) {
          // Frosted top edge line on stone walls
          ctx.fillRect(rx + 2, ry + 1, tileSize - 4, 2.0);
        } else if (tile === TileType.Sign || tile === TileType.Anvil || tile === TileType.Bush) {
          // Small snow ridge on top
          ctx.fillRect(rx + 4, ry + 2, tileSize - 8, 1.5);
        }
      }
    }

    ctx.restore();
  }
}

export const weatherInteractivityManager = new WeatherInteractivityManager();
