/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InterpolatedPosition {
  renderX: number;
  renderY: number;
  isMoving: boolean;
  facing: 'north' | 'south' | 'east' | 'west';
  progress: number;
}

interface EntityMotionState {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startTime: number;
  durationMs: number;
  facing: 'north' | 'south' | 'east' | 'west';
}

const STORAGE_KEY = 'roguelike_smooth_movement';

export class EntityInterpolationManager {
  private static instance: EntityInterpolationManager;
  private motionStates = new Map<string, EntityMotionState>();
  private defaultDurationMs = 125; // 125ms smooth gliding ease
  private smoothMovement = true;

  private constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        this.smoothMovement = saved === 'true';
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  public static getInstance(): EntityInterpolationManager {
    if (!EntityInterpolationManager.instance) {
      EntityInterpolationManager.instance = new EntityInterpolationManager();
    }
    return EntityInterpolationManager.instance;
  }

  public isSmoothMovementEnabled(): boolean {
    return this.smoothMovement;
  }

  public isEnabled(): boolean {
    return this.smoothMovement;
  }

  public setSmoothMovementEnabled(enabled: boolean): void {
    this.smoothMovement = enabled;
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Ignore localStorage errors
    }
  }

  public setEnabled(enabled: boolean): void {
    this.setSmoothMovementEnabled(enabled);
  }

  public toggleSmoothMovement(): boolean {
    this.setSmoothMovementEnabled(!this.smoothMovement);
    return this.smoothMovement;
  }

  /**
   * Updates or initiates a lerp motion tween towards logical coordinates
   */
  public updateEntityPosition(
    id: string,
    targetX: number,
    targetY: number,
    forceInstant: boolean = false
  ): void {
    const existing = this.motionStates.get(id);
    const now = performance.now();

    if (!existing) {
      this.motionStates.set(id, {
        startX: targetX,
        startY: targetY,
        targetX,
        targetY,
        startTime: now,
        durationMs: this.defaultDurationMs,
        facing: 'south',
      });
      return;
    }

    if (existing.targetX === targetX && existing.targetY === targetY) {
      return;
    }

    // Determine directional facing
    let facing: 'north' | 'south' | 'east' | 'west' = existing.facing;
    const dx = targetX - existing.targetX;
    const dy = targetY - existing.targetY;
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx > 0) facing = 'east';
      else if (dx < 0) facing = 'west';
    } else {
      if (dy > 0) facing = 'south';
      else if (dy < 0) facing = 'north';
    }

    // If distance is large (teleport, stairs, chunk shift) or instant requested, snap immediately
    const dist = Math.hypot(dx, dy);
    if (forceInstant || dist > 3.5 || !this.smoothMovement) {
      this.motionStates.set(id, {
        startX: targetX,
        startY: targetY,
        targetX,
        targetY,
        startTime: now,
        durationMs: 0,
        facing,
      });
      return;
    }

    // Get current interpolated position as the new start position to prevent snapping mid-stride
    const current = this.getRenderPosition(id, existing.targetX, existing.targetY);

    this.motionStates.set(id, {
      startX: current.renderX,
      startY: current.renderY,
      targetX,
      targetY,
      startTime: now,
      durationMs: this.defaultDurationMs,
      facing,
    });
  }

  /**
   * Computes the current interpolated visual position
   */
  public getRenderPosition(
    id: string,
    logicalX: number,
    logicalY: number
  ): InterpolatedPosition {
    if (!this.smoothMovement) {
      return {
        renderX: logicalX,
        renderY: logicalY,
        isMoving: false,
        facing: 'south',
        progress: 1.0,
      };
    }

    let state = this.motionStates.get(id);
    const now = performance.now();

    if (!state) {
      this.updateEntityPosition(id, logicalX, logicalY, true);
      state = this.motionStates.get(id)!;
    }

    if (state.targetX !== logicalX || state.targetY !== logicalY) {
      this.updateEntityPosition(id, logicalX, logicalY);
      state = this.motionStates.get(id)!;
    }

    if (state.durationMs <= 0) {
      return {
        renderX: state.targetX,
        renderY: state.targetY,
        isMoving: false,
        facing: state.facing,
        progress: 1.0,
      };
    }

    const elapsed = now - state.startTime;
    const rawT = Math.min(1.0, Math.max(0.0, elapsed / state.durationMs));

    // Ease-out quadratic: 1 - (1 - t)^2
    const easedT = 1 - (1 - rawT) * (1 - rawT);

    const renderX = state.startX + (state.targetX - state.startX) * easedT;
    const renderY = state.startY + (state.targetY - state.startY) * easedT;
    const isMoving = rawT < 1.0;

    return {
      renderX,
      renderY,
      isMoving,
      facing: state.facing,
      progress: easedT,
    };
  }

  /**
   * Cleans up motion states for entities no longer present in current map
   */
  public cleanupStale(activeIds: Set<string>): void {
    for (const id of this.motionStates.keys()) {
      if (id !== 'player' && !activeIds.has(id)) {
        this.motionStates.delete(id);
      }
    }
  }

  /**
   * Resets all interpolation states (e.g., when loading a new level or save game)
   */
  public reset(): void {
    this.motionStates.clear();
  }
}

export const entityInterpolationManager = EntityInterpolationManager.getInstance();
