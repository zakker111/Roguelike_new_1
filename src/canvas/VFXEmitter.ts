import { VisualFxParticleSystem } from './visualFxParticleSystem';

export interface VFXEvent {
  id: string;
  type: 'spell_burst' | 'combat_slash' | 'weather_anomaly' | 'ember';
  x: number;
  y: number;
  color?: string;
  count?: number;
}

export class VFXEmitter {
  private static instance: VFXEmitter;
  private queue: VFXEvent[] = [];
  private particleSystem: VisualFxParticleSystem = VisualFxParticleSystem.getInstance();

  public static getInstance(): VFXEmitter {
    if (!VFXEmitter.instance) {
      VFXEmitter.instance = new VFXEmitter();
    }
    return VFXEmitter.instance;
  }

  public emitSpellBurst(x: number, y: number, color: string = '#f59e0b', count: number = 14) {
    this.queue.push({
      id: `vfx_${Date.now()}_${Math.random()}`,
      type: 'spell_burst',
      x,
      y,
      color,
      count,
    });
  }

  public emitCombatSlash(x: number, y: number, color: string = '#ef4444') {
    this.queue.push({
      id: `vfx_${Date.now()}_${Math.random()}`,
      type: 'combat_slash',
      x,
      y,
      color,
      count: 8,
    });
  }

  public emitEmber(x: number, y: number) {
    this.queue.push({
      id: `vfx_${Date.now()}_${Math.random()}`,
      type: 'ember',
      x,
      y,
    });
  }

  public emitWaterRipple(x: number, y: number, color: string = 'rgba(56, 189, 248, 0.75)') {
    this.particleSystem.spawnWaterRipple(x, y, color);
  }

  public emitFootstepSplash(x: number, y: number, count: number = 6) {
    this.particleSystem.spawnFootstepSplash(x, y, count);
  }

  public flushAndRender(ctx: CanvasRenderingContext2D, dt: number) {
    // Process queued events
    while (this.queue.length > 0) {
      const evt = this.queue.shift();
      if (!evt) break;

      if (evt.type === 'spell_burst' || evt.type === 'combat_slash') {
        this.particleSystem.spawnSpellBurst(evt.x, evt.y, evt.color || '#f59e0b', evt.count || 12);
      } else if (evt.type === 'ember') {
        this.particleSystem.spawnEmber(evt.x, evt.y);
      }
    }

    // Render active continuous particle system tick
    this.particleSystem.updateAndRender(ctx, dt);
  }
}

export const vfxEmitter = VFXEmitter.getInstance();
