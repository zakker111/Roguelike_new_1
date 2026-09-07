import { ParticlePool, PooledParticle } from './particlePool';

export type { PooledParticle as Particle };

export class VisualFxParticleSystem {
  private static instance: VisualFxParticleSystem;
  private pool: ParticlePool = new ParticlePool(300);

  public static getInstance(): VisualFxParticleSystem {
    if (!VisualFxParticleSystem.instance) {
      VisualFxParticleSystem.instance = new VisualFxParticleSystem();
    }
    return VisualFxParticleSystem.instance;
  }

  public getParticlePool(): ParticlePool {
    return this.pool;
  }

  public getActiveCount(): number {
    return this.pool.getActiveCount();
  }

  public spawnSpellBurst(x: number, y: number, color: string = '#f59e0b', count: number = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      this.pool.acquire({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.02,
        maxLife: 30 + Math.random() * 20,
        shape: Math.random() > 0.4 ? 'spark' : 'circle',
      });
    }
  }

  public spawnLightningBurst(x: number, y: number, count: number = 20) {
    const colors = ['#ffffff', '#38bdf8', '#60a5fa', '#c084fc', '#a855f7'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.5;
      this.pool.acquire({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: 1.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.04 + Math.random() * 0.03,
        maxLife: 20 + Math.random() * 15,
        shape: Math.random() > 0.3 ? 'spark' : 'circle',
      });
    }
  }

  public spawnEmber(x: number, y: number) {
    this.pool.acquire({
      x: x + (Math.random() - 0.5) * 16,
      y,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -0.8 - Math.random() * 1.2,
      size: 1.5 + Math.random() * 2,
      color: '#ef4444',
      alpha: 0.9,
      decay: 0.02,
      maxLife: 40,
      shape: 'ember',
    });
  }

  public spawnWaterRipple(x: number, y: number, color: string = 'rgba(56, 189, 248, 0.75)') {
    this.pool.acquire({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 4,
      color,
      alpha: 0.85,
      decay: 0.025,
      maxLife: 35,
      shape: 'ring',
    });
  }

  public spawnFootstepSplash(x: number, y: number, count: number = 6) {
    const colors = ['#38bdf8', '#7dd3fc', '#60a5fa', '#93c5fd'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.2;
      const speed = 1.0 + Math.random() * 2.2;
      this.pool.acquire({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.2 + Math.random() * 1.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        decay: 0.04 + Math.random() * 0.02,
        maxLife: 22 + Math.random() * 10,
        shape: 'circle',
      });
    }
  }

  public updateAndRender(ctx: CanvasRenderingContext2D, _dt?: number) {
    const activeCount = this.pool.getActiveCount();
    if (activeCount === 0) return;

    for (let i = activeCount - 1; i >= 0; i--) {
      const p = this.pool.getParticleAt(i);
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.life++;

      if (p.alpha <= 0 || p.life >= p.maxLife) {
        this.pool.releaseAt(i);
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.moveTo(p.x - p.size, p.y);
        ctx.lineTo(p.x + p.size, p.y);
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (p.shape === 'ember') {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const rx = p.size + p.life * 0.65;
        const ry = (p.size + p.life * 0.65) * 0.5;
        ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1.0;
  }

  public clear() {
    this.pool.clear();
  }
}

export const visualFxParticleSystem = VisualFxParticleSystem.getInstance();
