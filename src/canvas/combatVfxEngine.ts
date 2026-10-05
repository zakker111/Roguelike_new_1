/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { projectileEngine, ProjectileSpawnParams, ActiveProjectile } from './projectileEngine';
import { meleeVfxEngine, MeleeSlashSpawnParams } from './meleeVfxEngine';
import {
  calculateDirectionalDrift,
  resolveFloaterArchetype,
  getArchetypeVisuals,
  FloaterArchetype,
} from '../utils/combatFloaterDrift';

export interface FloatingCombatText {
  id: string;
  x: number;
  y: number;
  baseX: number;
  text: string;
  color: string;
  strokeColor: string;
  shadowColor: string;
  shadowBlur: number;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  maxLife: number;
  size: number;
  scale: number;
  isCrit: boolean;
  archetype: FloaterArchetype;
  tremorIntensity: number;
  waveFrequency: number;
  timeAlive: number;
}

export interface SpawnFloatingTextOptions {
  x: number;
  y: number;
  sourceX?: number;
  sourceY?: number;
  text: string;
  color?: string;
  isCrit?: boolean;
  type?: string;
  isPlayerTarget?: boolean;
}

export interface SpawnCombatEffectOptions {
  x: number;
  y: number;
  sourceX?: number;
  sourceY?: number;
  text?: string;
  type?: 'dmg' | 'crit' | 'heal' | 'mana' | 'status' | 'damage';
  weaponType?: string;
  element?: string;
  onImpactShake?: (intensity: number) => void;
  isPlayerTarget?: boolean;
}

export class CombatVfxEngine {
  private static instance: CombatVfxEngine;
  private readonly floaterCapacity: number = 64;
  private floatingTexts: FloatingCombatText[];
  private activeFloaterCount: number = 0;
  private nextFloaterId: number = 1;

  constructor() {
    this.floatingTexts = new Array(this.floaterCapacity);
    for (let i = 0; i < this.floaterCapacity; i++) {
      this.floatingTexts[i] = {
        id: `floater_slot_${i}`,
        x: 0,
        y: 0,
        baseX: 0,
        text: '',
        color: '#ffffff',
        strokeColor: 'rgba(2, 6, 23, 0.92)',
        shadowColor: 'rgba(0, 0, 0, 0)',
        shadowBlur: 0,
        vx: 0,
        vy: 0,
        gravity: 0,
        life: 0,
        maxLife: 1.0,
        size: 13,
        scale: 1.0,
        isCrit: false,
        archetype: 'enemy_damage',
        tremorIntensity: 0,
        waveFrequency: 14,
        timeAlive: 0,
      };
    }
  }

  public static getInstance(): CombatVfxEngine {
    if (!CombatVfxEngine.instance) {
      CombatVfxEngine.instance = new CombatVfxEngine();
    }
    return CombatVfxEngine.instance;
  }

  public getActiveFloaterCount(): number {
    return this.activeFloaterCount;
  }

  public getFloatingTexts(): readonly FloatingCombatText[] {
    return this.floatingTexts.slice(0, this.activeFloaterCount);
  }

  public clearFloaters(): void {
    for (let i = 0; i < this.activeFloaterCount; i++) {
      this.floatingTexts[i].life = 0;
    }
    this.activeFloaterCount = 0;
  }

  public clearDecals(): void {
    meleeVfxEngine.clear();
  }

  public clearAll(): void {
    this.clearFloaters();
    meleeVfxEngine.clear();
  }

  /**
   * Dispatches a ranged projectile with full bezier flight & impact physics
   */
  public spawnProjectile(
    params: ProjectileSpawnParams,
    onScreenShake?: (intensity: number) => void
  ): ActiveProjectile {
    const defaultImpact = params.onImpact;
    return projectileEngine.spawn({
      ...params,
      onImpact: (p) => {
        if (defaultImpact) defaultImpact(p);

        // Spawn impact floating text if provided
        if (p.impactText) {
          const isCrit = p.impactType === 'crit';
          this.spawnFloatingText({
            x: p.targetX,
            y: p.targetY,
            sourceX: p.startX,
            sourceY: p.startY,
            text: p.impactText,
            type: p.impactType,
            isCrit,
          });

          // Spawn ground impact decal based on projectile kind
          if (p.kind === 'fireball' || p.kind === 'pyroblast') {
            meleeVfxEngine.spawnDecal(p.targetX, p.targetY, 'scorch_mark');
          } else if (p.kind === 'frostbolt' || p.kind === 'frostbite_lance') {
            meleeVfxEngine.spawnDecal(p.targetX, p.targetY, 'frost_patch');
          } else if (isCrit) {
            meleeVfxEngine.spawnDecal(p.targetX, p.targetY, 'blood_splatter');
          }

          if (onScreenShake) {
            onScreenShake(isCrit ? 12 : 6);
          }
        }

        if (p.impactHealingText) {
          this.spawnFloatingText({
            x: p.startX,
            y: p.startY - 0.2,
            text: p.impactHealingText,
            type: 'heal',
            isCrit: false,
          });
        }
      },
    });
  }

  /**
   * Dispatches a directional melee weapon slash arc
   */
  public spawnMeleeSlash(
    params: MeleeSlashSpawnParams,
    onScreenShake?: (intensity: number) => void
  ): void {
    meleeVfxEngine.spawnSlash(params);

    if (params.isCrit) {
      meleeVfxEngine.spawnDecal(params.targetX, params.targetY, 'blood_splatter');
      if (onScreenShake) onScreenShake(10);
    }
  }

  /**
   * Spawns floating combat damage / crit / heal text with organic directional drift,
   * anti-overlap radial stagger, and domain-native visual archetypes.
   */
  public spawnFloatingText(params: SpawnFloatingTextOptions): void {
    // 1. Calculate active floaters nearby on this target tile for anti-overlap staggering
    let nearbyActiveCount = 0;
    for (let j = 0; j < this.activeFloaterCount; j++) {
      const active = this.floatingTexts[j];
      if (
        Math.hypot(active.x - params.x, active.y - params.y) < 1.1 &&
        active.life > 0.15
      ) {
        nearbyActiveCount++;
      }
    }

    // 2. Resolve visual & physics archetype
    const archetype = resolveFloaterArchetype(params.type, params.text, params.isPlayerTarget);
    const visuals = getArchetypeVisuals(archetype);
    const isCrit = !!params.isCrit || archetype === 'crit';

    // 3. Directional drift with anti-overlap stagger
    const drift = calculateDirectionalDrift({
      targetX: params.x,
      targetY: params.y,
      sourceX: params.sourceX,
      sourceY: params.sourceY,
      isCrit,
      staggerIndex: nearbyActiveCount,
      archetype,
    });

    const col = params.color || visuals.primaryColor;

    // 4. Zero-allocation ring buffer pooling
    let floater: FloatingCombatText;
    if (this.activeFloaterCount < this.floaterCapacity) {
      floater = this.floatingTexts[this.activeFloaterCount];
      this.activeFloaterCount++;
    } else {
      // FIFO steal oldest floater at index 0 and rotate
      floater = this.floatingTexts[0];
      for (let i = 0; i < this.floaterCapacity - 1; i++) {
        this.floatingTexts[i] = this.floatingTexts[i + 1];
      }
      this.floatingTexts[this.floaterCapacity - 1] = floater;
    }

    floater.id = `floater_${this.nextFloaterId++}`;
    floater.x = drift.spawnX;
    floater.y = drift.spawnY;
    floater.baseX = drift.spawnX;
    floater.text = params.text;
    floater.color = col;
    floater.strokeColor = visuals.strokeColor;
    floater.shadowColor = visuals.shadowColor;
    floater.shadowBlur = visuals.shadowBlur;
    floater.vx = drift.vx;
    floater.vy = drift.vy;
    floater.gravity = visuals.gravity;
    floater.life = 1.0;
    floater.maxLife = 1.0;
    floater.size = visuals.defaultSize;
    floater.scale = visuals.initialScale;
    floater.isCrit = isCrit;
    floater.archetype = archetype;
    floater.tremorIntensity = visuals.tremorIntensity;
    floater.waveFrequency = 12 + (this.nextFloaterId % 5);
    floater.timeAlive = 0;
  }

  /**
   * Unified dispatcher handling combat effects triggered anywhere in the game
   */
  public dispatchEffect(options: SpawnCombatEffectOptions): void {
    const isCrit = options.type === 'crit';

    // Melee slash visual if source and target coordinates exist
    if (
      options.sourceX !== undefined &&
      options.sourceY !== undefined &&
      (options.sourceX !== options.x || options.sourceY !== options.y)
    ) {
      const dist = Math.hypot(options.x - options.sourceX, options.y - options.sourceY);
      if (dist <= 1.8) {
        let slashType: any = isCrit ? 'heavy_smash' : 'steel_arc';
        if (options.element === 'Fire') slashType = 'fire_cleave';
        else if (options.element === 'Frost') slashType = 'frost_cleave';
        else if (options.element === 'Poison') slashType = 'poison_strike';
        else if (options.element === 'Lightning') slashType = 'holy_smite';

        meleeVfxEngine.spawnSlash({
          sourceX: options.sourceX,
          sourceY: options.sourceY,
          targetX: options.x,
          targetY: options.y,
          type: slashType,
          isCrit,
        });

        if (isCrit) {
          meleeVfxEngine.spawnDecal(options.x, options.y, 'blood_splatter');
        }
      }
    }

    if (options.text) {
      this.spawnFloatingText({
        x: options.x,
        y: options.y,
        sourceX: options.sourceX,
        sourceY: options.sourceY,
        text: options.text,
        type: options.type,
        isCrit,
        isPlayerTarget: options.isPlayerTarget,
      });
    }

    if (options.onImpactShake) {
      options.onImpactShake(isCrit ? 12 : 5);
    }
  }

  /**
   * Updates all active combat VFX systems (Projectiles, Slashes, Decals, Floating Texts, Particles)
   * with zero array splicing.
   */
  public update(): void {
    projectileEngine.update();
    meleeVfxEngine.update();

    const dt = 0.016;

    // Update floating combat numbers in-place with O(1) swap-and-pop removal
    for (let i = this.activeFloaterCount - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.timeAlive += dt;

      // Archetype-specific physics routines
      switch (t.archetype) {
        case 'crit':
          // Parabolic bouncing arc: initial upward pop, downward gravity
          t.x += t.vx;
          t.vy += t.gravity;
          t.y += t.vy;
          // Scale pop zooms in and settles to 1.0
          t.scale = Math.max(1.0, t.scale - 0.045);
          break;

        case 'player_damage':
          // Crimson tremor: shudders horizontally around baseX while floating upward
          t.baseX += t.vx;
          t.y += t.vy;
          {
            const tremorDecay = t.life / t.maxLife;
            const tremorOffset = Math.sin(t.timeAlive * 36) * (t.tremorIntensity * tremorDecay);
            t.x = t.baseX + tremorOffset;
          }
          break;

        case 'burning':
          // Flickering rising ember drift: wavering horizontal sine-wave
          t.baseX += t.vx;
          t.y += t.vy;
          t.x = t.baseX + Math.sin(t.timeAlive * t.waveFrequency) * 0.022;
          break;

        case 'poison':
          // Acid dripping/bubbling: sluggish slow drift
          t.baseX += t.vx;
          t.vy += t.gravity;
          t.y += t.vy;
          t.x = t.baseX + Math.sin(t.timeAlive * 7) * 0.012;
          break;

        case 'dodge':
          // Swift diagonal glide
          t.x += t.vx;
          t.y += t.vy;
          t.scale = Math.max(0.9, t.scale - 0.015);
          break;

        case 'shield':
          // Firm metallic deflection pop
          t.x += t.vx;
          t.y += t.vy;
          t.scale = Math.max(1.0, t.scale - 0.04);
          break;

        case 'shock':
          // High-frequency electric jitter
          t.baseX += t.vx;
          t.y += t.vy;
          t.x = t.baseX + (Math.random() - 0.5) * t.tremorIntensity;
          break;

        case 'heal':
        case 'mana':
        case 'enemy_damage':
        default:
          t.x += t.vx;
          t.y += t.vy;
          break;
      }

      t.life -= 0.025; // Gentle float life decay

      if (t.life <= 0) {
        this.activeFloaterCount--;
        if (i !== this.activeFloaterCount) {
          const dead = this.floatingTexts[i];
          this.floatingTexts[i] = this.floatingTexts[this.activeFloaterCount];
          this.floatingTexts[this.activeFloaterCount] = dead;
        }
      }
    }
  }

  /**
   * Render ground decals layer (Under entities)
   */
  public renderUnderLayer(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    tileSize: number
  ): void {
    meleeVfxEngine.renderGroundDecals(ctx, camX, camY, tileSize);
  }

  /**
   * Render active projectiles, slashes, and floating text layer (Over entities)
   */
  public renderOverLayer(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    tileSize: number
  ): void {
    meleeVfxEngine.renderSlashes(ctx, camX, camY, tileSize);
    projectileEngine.render(ctx, camX, camY, tileSize);
    this.renderFloatingTexts(ctx, camX, camY, tileSize);
  }

  private renderFloatingTexts(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    tileSize: number
  ): void {
    if (this.activeFloaterCount === 0) return;

    for (let i = 0; i < this.activeFloaterCount; i++) {
      const t = this.floatingTexts[i];
      const rx = t.x * tileSize - camX;
      const ry = t.y * tileSize - camY;

      ctx.save();
      const alpha = Math.min(1.0, Math.max(0, Math.pow(t.life, 0.75)));
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Dynamic Archetype Typography
      const fontSize = Math.round(t.size * t.scale);
      if (t.archetype === 'crit') {
        ctx.font = `900 ${fontSize}px "Space Grotesk", system-ui, sans-serif`;
      } else if (t.archetype === 'dodge') {
        ctx.font = `italic 800 ${fontSize}px "Inter", system-ui, sans-serif`;
      } else if (t.archetype === 'player_damage' || t.archetype === 'shock') {
        ctx.font = `900 ${fontSize}px "Space Grotesk", system-ui, sans-serif`;
      } else {
        ctx.font = `800 ${fontSize}px "Inter", system-ui, sans-serif`;
      }

      // Archetype Luminous Shadow Glow
      if (t.shadowBlur > 0) {
        ctx.shadowColor = t.shadowColor;
        ctx.shadowBlur = t.shadowBlur;
      }

      // Crisp dark text outline for readability
      ctx.lineWidth = t.isCrit ? 4.0 : 2.8;
      ctx.strokeStyle = t.strokeColor;
      ctx.strokeText(t.text, rx, ry);

      // Vibrant Fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, rx, ry);

      ctx.restore();
    }
  }
}

export const combatVfxEngine = CombatVfxEngine.getInstance();
