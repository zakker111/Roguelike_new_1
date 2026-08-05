export type AnimationState = 'idle' | 'walk' | 'attack' | 'hurt' | 'cast' | 'death';
export type Direction = 'north' | 'south' | 'east' | 'west';

export interface EntitySpriteState {
  state: AnimationState;
  direction: Direction;
  frameIndex: number;
  lastFrameTime: number;
  frameDuration: number; // in milliseconds
  maxFrames: Record<AnimationState, number>;
}

export class SpriteAnimationManager {
  private static instance: SpriteAnimationManager;
  private entityStates: Map<string, EntitySpriteState> = new Map();

  private defaultMaxFrames: Record<AnimationState, number> = {
    idle: 4,
    walk: 6,
    attack: 4,
    hurt: 2,
    cast: 5,
    death: 6
  };

  private defaultFrameDurations: Record<AnimationState, number> = {
    idle: 200,
    walk: 120,
    attack: 80,
    hurt: 150,
    cast: 100,
    death: 250
  };

  public static getInstance(): SpriteAnimationManager {
    if (!SpriteAnimationManager.instance) {
      SpriteAnimationManager.instance = new SpriteAnimationManager();
    }
    return SpriteAnimationManager.instance;
  }

  public getOrCreateState(entityId: string): EntitySpriteState {
    let state = this.entityStates.get(entityId);
    if (!state) {
      state = {
        state: 'idle',
        direction: 'south',
        frameIndex: 0,
        lastFrameTime: performance.now(),
        frameDuration: this.defaultFrameDurations['idle'],
        maxFrames: { ...this.defaultMaxFrames }
      };
      this.entityStates.set(entityId, state);
    }
    return state;
  }

  public updateAnimation(entityId: string, now: number): EntitySpriteState {
    const animState = this.getOrCreateState(entityId);
    const elapsed = now - animState.lastFrameTime;

    if (elapsed >= animState.frameDuration) {
      const max = animState.maxFrames[animState.state] || 4;
      animState.frameIndex = (animState.frameIndex + 1) % max;
      animState.lastFrameTime = now;
      
      // If one-shot animation like hurt or attack, revert to idle upon loop completion
      if (animState.frameIndex === 0 && (animState.state === 'attack' || animState.state === 'hurt' || animState.state === 'cast')) {
        animState.state = 'idle';
        animState.frameDuration = this.defaultFrameDurations['idle'];
      }
    }

    return animState;
  }

  public setAnimationState(entityId: string, newState: AnimationState, direction?: Direction) {
    const animState = this.getOrCreateState(entityId);
    if (animState.state !== newState || (direction && animState.direction !== direction)) {
      animState.state = newState;
      if (direction) animState.direction = direction;
      animState.frameIndex = 0;
      animState.lastFrameTime = performance.now();
      animState.frameDuration = this.defaultFrameDurations[newState] || 150;
    }
  }

  public getDirectionRow(dir: Direction): number {
    switch (dir) {
      case 'south': return 0;
      case 'west': return 1;
      case 'east': return 2;
      case 'north': return 3;
      default: return 0;
    }
  }
}

export const spriteAnimationManager = SpriteAnimationManager.getInstance();
