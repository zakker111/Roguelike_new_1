export type ParticleShape = 'circle' | 'spark' | 'ring' | 'snowflake' | 'ember';

export interface PooledParticle {
  active: boolean;
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  life: number;
  maxLife: number;
  shape: ParticleShape;
}

export interface ParticleSpawnConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha?: number;
  decay?: number;
  maxLife?: number;
  shape?: ParticleShape;
}

/**
 * High-Performance Pre-Allocated Particle Ring-Buffer Object Pool.
 * Eliminates garbage collection pressure by pre-allocating all particle instances
 * and recycling them in O(1) via swap-and-pop array packing.
 */
export class ParticlePool {
  private particles: PooledParticle[];
  private activeCount: number = 0;
  private readonly capacity: number;
  private nextId: number = 1;

  constructor(capacity: number = 300) {
    this.capacity = capacity;
    this.particles = new Array(capacity);

    for (let i = 0; i < capacity; i++) {
      this.particles[i] = {
        active: false,
        id: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#ffffff',
        alpha: 1.0,
        decay: 0.03,
        life: 0,
        maxLife: 30,
        shape: 'circle',
      };
    }
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getParticleAt(index: number): PooledParticle {
    return this.particles[index];
  }

  /**
   * Acquires a particle from the pool, initializing its properties in-place without heap allocations.
   * If the pool is at maximum capacity, the oldest particle is recycled.
   */
  public acquire(config: ParticleSpawnConfig): PooledParticle {
    let p: PooledParticle;

    if (this.activeCount < this.capacity) {
      // Take next free slot in-place
      p = this.particles[this.activeCount];
      this.activeCount++;
    } else {
      // Pool full: FIFO steal oldest particle (index 0) and rotate
      p = this.particles[0];
      // Move oldest to end of active range
      for (let i = 0; i < this.capacity - 1; i++) {
        this.particles[i] = this.particles[i + 1];
      }
      this.particles[this.capacity - 1] = p;
    }

    p.active = true;
    p.id = this.nextId++;
    p.x = config.x;
    p.y = config.y;
    p.vx = config.vx;
    p.vy = config.vy;
    p.size = config.size;
    p.color = config.color;
    p.alpha = config.alpha ?? 1.0;
    p.decay = config.decay ?? 0.03;
    p.life = 0;
    p.maxLife = config.maxLife ?? 30;
    p.shape = config.shape ?? 'circle';

    return p;
  }

  /**
   * Releases particle at index by swapping with the last active particle (O(1) swap-and-pop).
   */
  public releaseAt(index: number): void {
    if (index < 0 || index >= this.activeCount) return;

    this.activeCount--;
    const dead = this.particles[index];
    dead.active = false;

    if (index !== this.activeCount) {
      // Swap active last particle into the vacated slot
      this.particles[index] = this.particles[this.activeCount];
      this.particles[this.activeCount] = dead;
    }
  }

  /**
   * Resets all particles to inactive state with zero array deallocations.
   */
  public clear(): void {
    for (let i = 0; i < this.activeCount; i++) {
      this.particles[i].active = false;
    }
    this.activeCount = 0;
  }
}
