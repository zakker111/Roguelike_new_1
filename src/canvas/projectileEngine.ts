import { visualFxParticleSystem } from './visualFxParticleSystem';

export type ProjectileTrajectoryType = 'linear' | 'parabolic_arc' | 'serpentine' | 'spiral';

export type ProjectileKind =
  | 'arrow'
  | 'fireball'
  | 'pyroblast'
  | 'frostbolt'
  | 'frostbite_lance'
  | 'electric_wand'
  | 'chain_lightning'
  | 'void_siphon'
  | 'shadow_orb'
  | 'magic_staff'
  | 'skeleton_bolt'
  | 'nature_dart'
  | 'throwable'
  | 'enemy_spell';

export interface ProjectileSpawnParams {
  id?: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color?: string;
  projectileType?: ProjectileKind | string;
  trajectory?: ProjectileTrajectoryType;
  arcHeight?: number; // In grid tiles
  speed?: number; // Progress per frame (e.g. 0.05 - 0.15)
  impactText?: string;
  impactType?: 'dmg' | 'crit' | 'heal' | 'mana';
  impactHealingText?: string | null;
  onImpact?: (p: ActiveProjectile) => void;
}

export interface ActiveProjectile {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
  kind: ProjectileKind;
  trajectory: ProjectileTrajectoryType;
  arcHeight: number;
  speed: number;
  progress: number; // 0.0 to 1.0
  currentX: number;
  currentY: number;
  angle: number;
  rotation: number;
  impactText?: string;
  impactType?: 'dmg' | 'crit' | 'heal' | 'mana';
  impactHealingText?: string | null;
  onImpact?: (p: ActiveProjectile) => void;
  trailTimer: number;
}

export class ProjectileEngine {
  private static instance: ProjectileEngine;
  private readonly capacity: number = 32;
  private projectiles: ActiveProjectile[];
  private activeCount: number = 0;
  private nextProjId: number = 1;

  constructor() {
    this.projectiles = new Array(this.capacity);
    for (let i = 0; i < this.capacity; i++) {
      this.projectiles[i] = {
        id: `proj_slot_${i}`,
        startX: 0,
        startY: 0,
        targetX: 0,
        targetY: 0,
        color: '#38bdf8',
        kind: 'arrow',
        trajectory: 'linear',
        arcHeight: 0,
        speed: 0.1,
        progress: 0,
        currentX: 0,
        currentY: 0,
        angle: 0,
        rotation: 0,
        trailTimer: 0,
      };
    }
  }

  public static getInstance(): ProjectileEngine {
    if (!ProjectileEngine.instance) {
      ProjectileEngine.instance = new ProjectileEngine();
    }
    return ProjectileEngine.instance;
  }

  /**
   * Spawns a new arcane or physical projectile into the physics queue using pre-allocated pool slots.
   */
  public spawn(params: ProjectileSpawnParams): ActiveProjectile {
    const kind = (params.projectileType as ProjectileKind) || 'arrow';
    
    // Auto-select fitting trajectory if not explicitly given
    let trajectory: ProjectileTrajectoryType = params.trajectory || 'linear';
    let arcHeight = params.arcHeight ?? 0;
    let speed = params.speed;

    if (!params.trajectory) {
      if (kind === 'arrow' || kind === 'throwable') {
        trajectory = 'parabolic_arc';
        arcHeight = Math.min(2.5, Math.hypot(params.targetX - params.startX, params.targetY - params.startY) * 0.25);
      } else if (kind === 'electric_wand' || kind === 'chain_lightning') {
        trajectory = 'serpentine';
      } else if (kind === 'void_siphon' || kind === 'shadow_orb') {
        trajectory = 'spiral';
      }
    }

    if (!speed) {
      if (kind === 'electric_wand' || kind === 'chain_lightning') speed = 0.14;
      else if (kind === 'arrow') speed = 0.11;
      else if (kind === 'throwable') speed = 0.09;
      else if (kind === 'fireball' || kind === 'pyroblast') speed = 0.08;
      else if (kind === 'frostbolt' || kind === 'frostbite_lance') speed = 0.085;
      else if (kind === 'void_siphon') speed = 0.07;
      else speed = 0.08;
    }

    let defaultColor = '#38bdf8';
    if (kind === 'fireball' || kind === 'pyroblast') defaultColor = '#f97316';
    else if (kind === 'frostbolt' || kind === 'frostbite_lance') defaultColor = '#38bdf8';
    else if (kind === 'electric_wand' || kind === 'chain_lightning') defaultColor = '#fbbf24';
    else if (kind === 'void_siphon' || kind === 'shadow_orb') defaultColor = '#c084fc';
    else if (kind === 'nature_dart') defaultColor = '#4ade80';
    else if (kind === 'arrow') defaultColor = '#d97706';

    const dx = params.targetX - params.startX;
    const dy = params.targetY - params.startY;
    const initialAngle = Math.atan2(dy, dx);

    let proj: ActiveProjectile;
    if (this.activeCount < this.capacity) {
      proj = this.projectiles[this.activeCount];
      this.activeCount++;
    } else {
      // FIFO steal oldest projectile at index 0 and rotate
      proj = this.projectiles[0];
      for (let i = 0; i < this.capacity - 1; i++) {
        this.projectiles[i] = this.projectiles[i + 1];
      }
      this.projectiles[this.capacity - 1] = proj;
    }

    proj.id = params.id || `proj_${this.nextProjId++}`;
    proj.startX = params.startX;
    proj.startY = params.startY;
    proj.targetX = params.targetX;
    proj.targetY = params.targetY;
    proj.color = params.color || defaultColor;
    proj.kind = kind;
    proj.trajectory = trajectory;
    proj.arcHeight = arcHeight;
    proj.speed = speed;
    proj.progress = 0;
    proj.currentX = params.startX;
    proj.currentY = params.startY;
    proj.angle = initialAngle;
    proj.rotation = 0;
    proj.impactText = params.impactText;
    proj.impactType = params.impactType;
    proj.impactHealingText = params.impactHealingText;
    proj.onImpact = params.onImpact;
    proj.trailTimer = 0;

    return proj;
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public clear(): void {
    this.activeCount = 0;
  }

  /**
   * Updates projectile positions, calculates Bezier / parabolic arcs,
   * emits particle trails, and triggers impact callbacks with O(1) swap-and-pop removal.
   */
  public update(onImpactCallback?: (p: ActiveProjectile) => void): void {
    const particleSystem = visualFxParticleSystem;

    for (let i = this.activeCount - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.progress += p.speed;

      const t = Math.min(1.0, p.progress);
      
      // Calculate position based on trajectory
      const linearX = p.startX + (p.targetX - p.startX) * t;
      const linearY = p.startY + (p.targetY - p.startY) * t;

      let offsetX = 0;
      let offsetY = 0;

      if (p.trajectory === 'parabolic_arc') {
        // Parabolic arc: height peaks at t = 0.5
        const arc = 4 * p.arcHeight * t * (1 - t);
        offsetY -= arc;
      } else if (p.trajectory === 'serpentine') {
        // High frequency sine wave perpendicular to travel direction
        const perpAngle = p.angle + Math.PI / 2;
        const wave = Math.sin(t * Math.PI * 8) * 0.35 * (1 - t * 0.5);
        offsetX += Math.cos(perpAngle) * wave;
        offsetY += Math.sin(perpAngle) * wave;
      } else if (p.trajectory === 'spiral') {
        const spiralRadius = Math.sin(t * Math.PI) * 0.45;
        const spiralAngle = t * Math.PI * 10;
        offsetX += Math.cos(spiralAngle) * spiralRadius;
        offsetY += Math.sin(spiralAngle) * spiralRadius;
      }

      const prevX = p.currentX;
      const prevY = p.currentY;
      p.currentX = linearX + offsetX;
      p.currentY = linearY + offsetY;

      // Calculate tangent angle along velocity vector
      const vdx = p.currentX - prevX;
      const vdy = p.currentY - prevY;
      if (Math.hypot(vdx, vdy) > 0.001) {
        p.angle = Math.atan2(vdy, vdx);
      }

      p.rotation += 0.35;
      p.trailTimer += 1;

      // Emit particle trails during flight
      this.emitTrailParticles(p, particleSystem);

      // Check for impact arrival
      if (p.progress >= 1.0) {
        p.currentX = p.targetX;
        p.currentY = p.targetY;

        // Trigger impact burst particles
        this.emitImpactParticles(p, particleSystem);

        if (p.onImpact) {
          p.onImpact(p);
        }
        if (onImpactCallback) {
          onImpactCallback(p);
        }

        this.activeCount--;
        if (i !== this.activeCount) {
          const dead = this.projectiles[i];
          this.projectiles[i] = this.projectiles[this.activeCount];
          this.projectiles[this.activeCount] = dead;
        }
      }
    }
  }

  /**
   * Renders all active projectiles onto canvas
   */
  public render(ctx: CanvasRenderingContext2D, camX: number, camY: number, tileSize: number): void {
    if (this.activeCount === 0) return;

    for (let i = 0; i < this.activeCount; i++) {
      const p = this.projectiles[i];
      const rx = p.currentX * tileSize - camX + tileSize / 2;
      const ry = p.currentY * tileSize - camY + tileSize / 2;

      ctx.save();
      ctx.translate(rx, ry);

      if (p.kind === 'throwable') {
        ctx.rotate(p.rotation * 4);
        this.renderThrowable(ctx);
      } else {
        ctx.rotate(p.angle);
        this.renderProjectileBody(ctx, p);
      }

      ctx.restore();
    }
  }

  private emitTrailParticles(p: ActiveProjectile, ps: typeof visualFxParticleSystem) {
    if (p.kind === 'fireball' || p.kind === 'pyroblast') {
      ps.spawnEmber(p.currentX * 32, p.currentY * 32);
    } else if (p.kind === 'electric_wand' || p.kind === 'chain_lightning') {
      if (Math.random() < 0.7) {
        ps.spawnLightningBurst(p.currentX * 32, p.currentY * 32, 2);
      }
    } else if (p.kind === 'frostbolt' || p.kind === 'frostbite_lance') {
      if (Math.random() < 0.6) {
        ps.spawnFootstepSplash(p.currentX * 32, p.currentY * 32, 2);
      }
    }
  }

  private emitImpactParticles(p: ActiveProjectile, ps: typeof visualFxParticleSystem) {
    const px = p.targetX * 32 + 16;
    const py = p.targetY * 32 + 16;

    if (p.kind === 'fireball' || p.kind === 'pyroblast') {
      ps.spawnSpellBurst(px, py, '#f97316', 16);
    } else if (p.kind === 'electric_wand' || p.kind === 'chain_lightning') {
      ps.spawnLightningBurst(px, py, 18);
    } else if (p.kind === 'frostbolt' || p.kind === 'frostbite_lance') {
      ps.spawnSpellBurst(px, py, '#38bdf8', 14);
    } else if (p.kind === 'void_siphon' || p.kind === 'shadow_orb') {
      ps.spawnSpellBurst(px, py, '#a855f7', 16);
    } else {
      ps.spawnSpellBurst(px, py, p.color, 8);
    }
  }

  private renderProjectileBody(ctx: CanvasRenderingContext2D, p: ActiveProjectile): void {
    if (p.kind === 'arrow') {
      // Sleek wooden arrow with steel broadhead and feathers
      ctx.strokeStyle = '#92400e'; // Shaft
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();

      // Steel arrowhead
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(1, -3.5);
      ctx.lineTo(1, 3.5);
      ctx.closePath();
      ctx.fill();

      // Red fletching feathers
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(-15, -3);
      ctx.moveTo(-8, 0);
      ctx.lineTo(-12, -3);
      ctx.moveTo(-11, 0);
      ctx.lineTo(-15, 3);
      ctx.moveTo(-8, 0);
      ctx.lineTo(-12, 3);
      ctx.stroke();
    } else if (p.kind === 'fireball' || p.kind === 'pyroblast') {
      // Blazing fireball with pulsing core and flame tail
      const pulse = 1.0 + Math.sin(p.progress * Math.PI * 8) * 0.2;
      const r = (p.kind === 'pyroblast' ? 7 : 5) * pulse;

      ctx.shadowBlur = 14;
      ctx.shadowColor = '#f97316';

      // Blazing flame tail
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(-r * 2.5, -r * 0.9);
      ctx.lineTo(-r * 3.5, 0);
      ctx.lineTo(-r * 2.5, r * 0.9);
      ctx.closePath();
      ctx.fill();

      // Core radial gradient
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#fef08a');
      grad.addColorStop(0.7, '#f97316');
      grad.addColorStop(1, '#dc2626');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (p.kind === 'frostbolt' || p.kind === 'frostbite_lance') {
      // Crystalline frost spear
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';

      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-2, -4);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-2, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Frost core glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (p.kind === 'electric_wand' || p.kind === 'chain_lightning') {
      // Crackling lightning bolt
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3.0;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#eab308';

      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-5, -4);
      ctx.lineTo(0, 5);
      ctx.lineTo(6, -2);
      ctx.lineTo(10, 0);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (p.kind === 'void_siphon' || p.kind === 'shadow_orb') {
      // Dark matter swirling vortex
      const r = 6;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#a855f7';

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#c084fc');
      grad.addColorStop(0.8, '#581c87');
      grad.addColorStop(1, '#0f172a');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting void rings
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (p.kind === 'nature_dart') {
      // Toxic thorn dart
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -3);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-6, 3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'skeleton_bolt') {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#0ea5e9';

      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.moveTo(0, -6);
      ctx.lineTo(0, 6);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Generic magical staff sphere
      ctx.fillStyle = p.color || '#ec4899';
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color || '#ec4899';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private renderThrowable(ctx: CanvasRenderingContext2D): void {
    // Spinning throwing axe / dagger
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(6, -2);
    ctx.lineTo(8, -7);
    ctx.lineTo(8, 7);
    ctx.lineTo(6, 2);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wooden handle
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-12, 0);
    ctx.stroke();
  }
}

export const projectileEngine = ProjectileEngine.getInstance();
