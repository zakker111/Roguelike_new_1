import { visualFxParticleSystem } from './visualFxParticleSystem';

export type MeleeSlashType =
  | 'steel_arc'
  | 'heavy_smash'
  | 'dagger_thrust'
  | 'fire_cleave'
  | 'frost_cleave'
  | 'poison_strike'
  | 'holy_smite';

export type DecalType = 'blood_splatter' | 'scorch_mark' | 'frost_patch' | 'stone_crack';

export interface MeleeSlashSpawnParams {
  id?: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  type?: MeleeSlashType;
  color?: string;
  isCrit?: boolean;
  durationFrames?: number;
}

export interface ActiveMeleeSlash {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  type: MeleeSlashType;
  color: string;
  isCrit: boolean;
  angle: number;
  progress: number; // 0.0 to 1.0
  maxFrames: number;
  currentFrame: number;
}

export interface ActiveGroundDecal {
  id: string;
  x: number;
  y: number;
  type: DecalType;
  color: string;
  size: number;
  rotation: number;
  alpha: number;
  decayRate: number;
}

export class MeleeVfxEngine {
  private static instance: MeleeVfxEngine;

  private readonly slashCapacity: number = 16;
  private activeSlashes: ActiveMeleeSlash[];
  private activeSlashCount: number = 0;
  private nextSlashId: number = 1;

  private readonly decalCapacity: number = 48;
  private groundDecals: ActiveGroundDecal[];
  private activeDecalCount: number = 0;
  private nextDecalId: number = 1;

  constructor() {
    this.activeSlashes = new Array(this.slashCapacity);
    for (let i = 0; i < this.slashCapacity; i++) {
      this.activeSlashes[i] = {
        id: `slash_slot_${i}`,
        sourceX: 0,
        sourceY: 0,
        targetX: 0,
        targetY: 0,
        type: 'steel_arc',
        color: '#ffffff',
        isCrit: false,
        angle: 0,
        progress: 0,
        maxFrames: 10,
        currentFrame: 0,
      };
    }

    this.groundDecals = new Array(this.decalCapacity);
    for (let i = 0; i < this.decalCapacity; i++) {
      this.groundDecals[i] = {
        id: `decal_slot_${i}`,
        x: 0,
        y: 0,
        type: 'blood_splatter',
        color: 'rgba(185, 28, 28, 0.75)',
        size: 14,
        rotation: 0,
        alpha: 0,
        decayRate: 0.003,
      };
    }
  }

  public static getInstance(): MeleeVfxEngine {
    if (!MeleeVfxEngine.instance) {
      MeleeVfxEngine.instance = new MeleeVfxEngine();
    }
    return MeleeVfxEngine.instance;
  }

  public getActiveSlashCount(): number {
    return this.activeSlashCount;
  }

  public getActiveDecalCount(): number {
    return this.activeDecalCount;
  }

  public clear(): void {
    this.activeSlashCount = 0;
    this.activeDecalCount = 0;
  }

  /**
   * Spawns a directional melee swipe arc or thrust animation using pre-allocated pool slots.
   */
  public spawnSlash(params: MeleeSlashSpawnParams): ActiveMeleeSlash {
    const dx = params.targetX - params.sourceX;
    const dy = params.targetY - params.sourceY;
    const angle = Math.atan2(dy, dx);

    const type = params.type || (params.isCrit ? 'heavy_smash' : 'steel_arc');
    let color = params.color;
    if (!color) {
      if (type === 'fire_cleave') color = '#f97316';
      else if (type === 'frost_cleave') color = '#38bdf8';
      else if (type === 'poison_strike') color = '#22c55e';
      else if (type === 'holy_smite') color = '#fbbf24';
      else if (type === 'heavy_smash') color = '#f59e0b';
      else color = params.isCrit ? '#fbbf24' : '#e2e8f0';
    }

    let slash: ActiveMeleeSlash;
    if (this.activeSlashCount < this.slashCapacity) {
      slash = this.activeSlashes[this.activeSlashCount];
      this.activeSlashCount++;
    } else {
      // Steal oldest slash at index 0 and rotate
      slash = this.activeSlashes[0];
      for (let i = 0; i < this.slashCapacity - 1; i++) {
        this.activeSlashes[i] = this.activeSlashes[i + 1];
      }
      this.activeSlashes[this.slashCapacity - 1] = slash;
    }

    slash.id = params.id || `slash_${this.nextSlashId++}`;
    slash.sourceX = params.sourceX;
    slash.sourceY = params.sourceY;
    slash.targetX = params.targetX;
    slash.targetY = params.targetY;
    slash.type = type;
    slash.color = color;
    slash.isCrit = !!params.isCrit;
    slash.angle = angle;
    slash.progress = 0;
    slash.maxFrames = params.durationFrames || 10;
    slash.currentFrame = 0;

    // Spawn associated particle bursts along the slash line
    const midX = (params.sourceX + params.targetX) * 0.5 * 32 + 16;
    const midY = (params.sourceY + params.targetY) * 0.5 * 32 + 16;
    if (type === 'fire_cleave') {
      visualFxParticleSystem.spawnSpellBurst(midX, midY, '#f97316', 8);
    } else if (type === 'frost_cleave') {
      visualFxParticleSystem.spawnSpellBurst(midX, midY, '#38bdf8', 6);
    }

    return slash;
  }

  /**
   * Spawns a persistent fading ground impact decal using a bounded FIFO ring buffer.
   */
  public spawnDecal(x: number, y: number, type: DecalType = 'blood_splatter', color?: string): void {
    let defaultColor = 'rgba(185, 28, 28, 0.75)'; // blood red
    if (type === 'scorch_mark') defaultColor = 'rgba(30, 27, 24, 0.8)';
    else if (type === 'frost_patch') defaultColor = 'rgba(56, 189, 248, 0.65)';
    else if (type === 'stone_crack') defaultColor = 'rgba(15, 23, 42, 0.7)';

    let decal: ActiveGroundDecal;
    if (this.activeDecalCount < this.decalCapacity) {
      decal = this.groundDecals[this.activeDecalCount];
      this.activeDecalCount++;
    } else {
      // Bounded capacity: FIFO steal oldest decal at index 0 and rotate
      decal = this.groundDecals[0];
      for (let i = 0; i < this.decalCapacity - 1; i++) {
        this.groundDecals[i] = this.groundDecals[i + 1];
      }
      this.groundDecals[this.decalCapacity - 1] = decal;
    }

    decal.id = `decal_${this.nextDecalId++}`;
    decal.x = x;
    decal.y = y;
    decal.type = type;
    decal.color = color || defaultColor;
    decal.size = 14 + Math.random() * 10;
    decal.rotation = Math.random() * Math.PI * 2;
    decal.alpha = 0.85;
    decal.decayRate = 0.003 + Math.random() * 0.002;
  }

  public update(): void {
    // Update slashes with O(1) swap-and-pop
    for (let i = this.activeSlashCount - 1; i >= 0; i--) {
      const s = this.activeSlashes[i];
      s.currentFrame++;
      s.progress = s.currentFrame / s.maxFrames;
      if (s.currentFrame >= s.maxFrames) {
        this.activeSlashCount--;
        if (i !== this.activeSlashCount) {
          const dead = this.activeSlashes[i];
          this.activeSlashes[i] = this.activeSlashes[this.activeSlashCount];
          this.activeSlashes[this.activeSlashCount] = dead;
        }
      }
    }

    // Update ground decals with O(1) swap-and-pop
    for (let i = this.activeDecalCount - 1; i >= 0; i--) {
      const d = this.groundDecals[i];
      d.alpha -= d.decayRate;
      if (d.alpha <= 0) {
        this.activeDecalCount--;
        if (i !== this.activeDecalCount) {
          const dead = this.groundDecals[i];
          this.groundDecals[i] = this.groundDecals[this.activeDecalCount];
          this.groundDecals[this.activeDecalCount] = dead;
        }
      }
    }
  }

  /**
   * Renders ground decals (rendered underneath entities and actors)
   */
  public renderGroundDecals(ctx: CanvasRenderingContext2D, camX: number, camY: number, tileSize: number): void {
    if (this.activeDecalCount === 0) return;

    for (let i = 0; i < this.activeDecalCount; i++) {
      const d = this.groundDecals[i];
      const rx = d.x * tileSize - camX + tileSize / 2;
      const ry = d.y * tileSize - camY + tileSize / 2;

      ctx.save();
      ctx.globalAlpha = Math.max(0, d.alpha);
      ctx.translate(rx, ry);
      ctx.rotate(d.rotation);

      if (d.type === 'blood_splatter') {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(0, 0, d.size * 0.35, 0, Math.PI * 2);
        ctx.arc(d.size * 0.4, d.size * 0.2, d.size * 0.2, 0, Math.PI * 2);
        ctx.arc(-d.size * 0.3, -d.size * 0.25, d.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'scorch_mark') {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, d.size * 0.5);
        grad.addColorStop(0, '#1c1917');
        grad.addColorStop(0.7, '#44403c');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, d.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'frost_patch') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)';
        ctx.lineWidth = 1.5;
        for (let a = 0; a < 6; a++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(d.size * 0.45, 0);
          ctx.stroke();
        }
      } else {
        // Stone crack
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-d.size * 0.4, -d.size * 0.3);
        ctx.lineTo(0, 0);
        ctx.lineTo(d.size * 0.35, -d.size * 0.2);
        ctx.moveTo(0, 0);
        ctx.lineTo(d.size * 0.2, d.size * 0.4);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  /**
   * Renders active directional slash animations on top of actors
   */
  public renderSlashes(ctx: CanvasRenderingContext2D, camX: number, camY: number, tileSize: number): void {
    if (this.activeSlashCount === 0) return;

    for (let i = 0; i < this.activeSlashCount; i++) {
      const s = this.activeSlashes[i];
      const targetScreenX = s.targetX * tileSize - camX + tileSize / 2;
      const targetScreenY = s.targetY * tileSize - camY + tileSize / 2;

      ctx.save();
      ctx.translate(targetScreenX, targetScreenY);
      ctx.rotate(s.angle);

      const alpha = Math.sin(s.progress * Math.PI); // Smooth fade in and out curve
      ctx.globalAlpha = alpha;

      if (s.type === 'heavy_smash') {
        // Expanding circular ground shockwave ring
        const radius = (s.progress * 1.2 + 0.3) * tileSize;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = Math.max(1, (1 - s.progress) * 4);
        ctx.shadowBlur = 12;
        ctx.shadowColor = s.color;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.type === 'dagger_thrust') {
        // High-velocity linear thrust kinetic streak
        const len = tileSize * 1.2;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = s.color;

        ctx.beginPath();
        ctx.moveTo(-len * 0.5, 0);
        ctx.lineTo(len * (s.progress - 0.2), 0);
        ctx.stroke();
      } else {
        // Directional crescent blade slash arc
        const arcRadius = tileSize * 0.85;
        const startAngle = -Math.PI * 0.45;
        const endAngle = Math.PI * 0.45;
        const currentAngle = startAngle + (endAngle - startAngle) * s.progress;

        ctx.shadowBlur = s.isCrit ? 16 : 8;
        ctx.shadowColor = s.color;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.isCrit ? 3.5 : 2.2;

        ctx.beginPath();
        ctx.arc(-tileSize * 0.25, 0, arcRadius, startAngle, currentAngle);
        ctx.stroke();

        // White hot cutting blade edge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(-tileSize * 0.25, 0, arcRadius * 0.95, startAngle + 0.1, currentAngle);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}

export const meleeVfxEngine = MeleeVfxEngine.getInstance();
