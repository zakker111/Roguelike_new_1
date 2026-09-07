/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CameraState {
  x: number;
  y: number;
  shakeX: number;
  shakeY: number;
  shakeIntensity: number;
}

export class CameraController {
  private static instance: CameraController;
  private x = 0;
  private y = 0;
  private shakeX = 0;
  private shakeY = 0;
  private shakeIntensity = 0;
  private isInitialized = false;

  public static getInstance(): CameraController {
    if (!CameraController.instance) {
      CameraController.instance = new CameraController();
    }
    return CameraController.instance;
  }

  /**
   * Triggers a screen shake impulse (pixels of maximum offset)
   */
  public triggerShake(intensity: number = 10): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  /**
   * Updates camera position smoothly following target coordinates and decaying shake
   */
  public update(
    targetX: number,
    targetY: number,
    viewportWidth: number,
    viewportHeight: number,
    tileSize: number,
    forceInstant: boolean = false
  ): CameraState {
    const targetCamX = targetX * tileSize - viewportWidth / 2 + tileSize / 2;
    const targetCamY = targetY * tileSize - viewportHeight / 2 + tileSize / 2;

    if (!this.isInitialized || forceInstant) {
      this.x = targetCamX;
      this.y = targetCamY;
      this.isInitialized = true;
    } else {
      const dist = Math.hypot(targetCamX - this.x, targetCamY - this.y);
      if (dist > 160) {
        // Snap if target teleported far away
        this.x = targetCamX;
        this.y = targetCamY;
      } else {
        // Smooth exponential moving average follow
        this.x += (targetCamX - this.x) * 0.35;
        this.y += (targetCamY - this.y) * 0.35;
      }
    }

    // Process screen shake physics
    if (this.shakeIntensity > 0.1) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.85; // Damping
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }

    return {
      x: this.x,
      y: this.y,
      shakeX: this.shakeX,
      shakeY: this.shakeY,
      shakeIntensity: this.shakeIntensity,
    };
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public reset(): void {
    this.isInitialized = false;
    this.shakeIntensity = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }
}

export const cameraController = CameraController.getInstance();
