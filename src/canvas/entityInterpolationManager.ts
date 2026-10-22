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

interface AttackLungeState {
  targetX: number;
  targetY: number;
  startTime: number;
  durationMs: number;
}

const STORAGE_KEY = 'roguelike_smooth_movement';

export class EntityInterpolationManager {
  private static instance: EntityInterpolationManager;
  private motionStates = new Map<string, EntityMotionState>();
  private attackLunges = new Map<string, AttackLungeState>();
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
   * Triggers a kinetic attack lunge towards target coordinates and snaps back with elastic easing
   */
  public triggerAttackLunge(
    id: string,
    targetX: number,
    targetY: number,
    durationMs: number = 150
  ): void {
    const now = performance.now();
    this.attackLunges.set(id, {
      targetX,
      targetY,
      startTime: now,
      durationMs,
    });

    const existing = this.motionStates.get(id);
    const sourceX = existing ? existing.targetX : targetX;
    const sourceY = existing ? existing.targetY : targetY;
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    let facing: 'north' | 'south' | 'east' | 'west' = existing ? existing.facing : 'south';
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx > 0) facing = 'east';
      else if (dx < 0) facing = 'west';
    } else {
      if (dy > 0) facing = 'south';
      else if (dy < 0) facing = 'north';
    }
    if (existing) {
      existing.facing = facing;
    }
  }

  public isAttackLunging(id: string): boolean {
    const lunge = this.attackLunges.get(id);
    if (!lunge) return false;
    return (performance.now() - lunge.startTime) < lunge.durationMs;
  }

  /**
   * Computes the current interpolated visual position
   */
  public getRenderPosition(
    id: string,
    logicalX: number,
    logicalY: number
  ): InterpolatedPosition {
    const now = performance.now();

    // Calculate attack lunge offset if active
    let lungeOffsetX = 0;
    let lungeOffsetY = 0;
    let isLunging = false;
    let lungeFacing: 'north' | 'south' | 'east' | 'west' | null = null;
    const lunge = this.attackLunges.get(id);
    if (lunge) {
      const elapsedLunge = now - lunge.startTime;
      if (elapsedLunge < lunge.durationMs) {
        const t = Math.max(0, Math.min(1, elapsedLunge / lunge.durationMs));
        const lungeMagnitude = Math.sin(t * Math.PI) * 0.38;
        lungeOffsetX = (lunge.targetX - logicalX) * lungeMagnitude;
        lungeOffsetY = (lunge.targetY - logicalY) * lungeMagnitude;
        isLunging = true;
        const ldx = lunge.targetX - logicalX;
        const ldy = lunge.targetY - logicalY;
        if (Math.abs(ldx) >= Math.abs(ldy)) {
          lungeFacing = ldx > 0 ? 'east' : 'west';
        } else {
          lungeFacing = ldy > 0 ? 'south' : 'north';
        }
      } else {
        this.attackLunges.delete(id);
      }
    }

    if (!this.smoothMovement) {
      return {
        renderX: logicalX + lungeOffsetX,
        renderY: logicalY + lungeOffsetY,
        isMoving: isLunging,
        facing: lungeFacing || 'south',
        progress: 1.0,
      };
    }

    let state = this.motionStates.get(id);

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
        renderX: state.targetX + lungeOffsetX,
        renderY: state.targetY + lungeOffsetY,
        isMoving: isLunging,
        facing: lungeFacing || state.facing,
        progress: 1.0,
      };
    }

    const elapsed = now - state.startTime;
    const rawT = Math.min(1.0, Math.max(0.0, elapsed / state.durationMs));

    // Ease-out quadratic: 1 - (1 - t)^2
    const easedT = 1 - (1 - rawT) * (1 - rawT);

    const renderX = state.startX + (state.targetX - state.startX) * easedT + lungeOffsetX;
    const renderY = state.startY + (state.targetY - state.startY) * easedT + lungeOffsetY;
    const isMoving = rawT < 1.0 || isLunging;

    return {
      renderX,
      renderY,
      isMoving,
      facing: lungeFacing || state.facing,
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
        this.attackLunges.delete(id);
      }
    }
  }

  /**
   * Resets all interpolation states (e.g., when loading a new level or save game)
   */
  public reset(): void {
    this.motionStates.clear();
    this.attackLunges.clear();
  }
}

export const entityInterpolationManager = EntityInterpolationManager.getInstance();
