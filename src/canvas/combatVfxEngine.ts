import { projectileEngine, ProjectileSpawnParams, ActiveProjectile } from './projectileEngine';
import { meleeVfxEngine, MeleeSlashSpawnParams } from './meleeVfxEngine';
import { calculateDirectionalDrift } from '../utils/combatFloaterDrift';

export interface FloatingCombatText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  isCrit: boolean;
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
        text: '',
        color: '#ffffff',
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1.0,
        size: 12,
        isCrit: false,
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
  public spawnProjectile(params: ProjectileSpawnParams, onScreenShake?: (intensity: number) => void): ActiveProjectile {
    const defaultImpact = params.onImpact;
    return projectileEngine.spawn({
      ...params,
      onImpact: (p) => {
        if (defaultImpact) defaultImpact(p);
        
        // Spawn impact floating text if provided
        if (p.impactText) {
          const isCrit = p.impactType === 'crit';
          let col = '#f87171';
          if (p.impactType === 'crit') col = '#fbbf24';
          else if (p.impactType === 'heal') col = '#22c55e';
          else if (p.impactType === 'mana') col = '#60a5fa';

          this.spawnFloatingText({
            x: p.targetX,
            y: p.targetY,
            sourceX: p.startX,
            sourceY: p.startY,
            text: p.impactText,
            color: col,
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
            color: '#22c55e',
            isCrit: false,
          });
        }
      },
    });
  }

  /**
   * Dispatches a directional melee weapon slash arc
   */
  public spawnMeleeSlash(params: MeleeSlashSpawnParams, onScreenShake?: (intensity: number) => void): void {
    meleeVfxEngine.spawnSlash(params);

    if (params.isCrit) {
      meleeVfxEngine.spawnDecal(params.targetX, params.targetY, 'blood_splatter');
      if (onScreenShake) onScreenShake(10);
    }
  }

  /**
   * Spawns floating combat damage / crit / heal text with organic directional drift
   * utilizing zero-allocation pre-allocated ring-buffer pooling.
   */
  public spawnFloatingText(params: {
    x: number;
    y: number;
    sourceX?: number;
    sourceY?: number;
    text: string;
    color?: string;
    isCrit?: boolean;
  }): void {
    const isCrit = !!params.isCrit;
    const drift = calculateDirectionalDrift({
      targetX: params.x,
      targetY: params.y,
      sourceX: params.sourceX,
      sourceY: params.sourceY,
      isCrit,
    });

    const col = params.color || (isCrit ? '#fbbf24' : '#f87171');

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
    floater.text = params.text;
    floater.color = col;
    floater.vx = drift.vx;
    floater.vy = drift.vy;
    floater.life = 1.0;
    floater.maxLife = 1.0;
    floater.size = isCrit ? 15 : 12;
    floater.isCrit = isCrit;
  }

  /**
   * Unified dispatcher handling combat effects triggered anywhere in the game
   */
  public dispatchEffect(options: SpawnCombatEffectOptions): void {
    const isCrit = options.type === 'crit';
    let color = '#f87171';

    if (options.type === 'crit') color = '#f59e0b';
    else if (options.type === 'heal') color = '#22c55e';
    else if (options.type === 'mana') color = '#60a5fa';
    else if (options.type === 'status') color = '#a78bfa';

    // Melee slash visual if source and target coordinates exist
    if (options.sourceX !== undefined && options.sourceY !== undefined && (options.sourceX !== options.x || options.sourceY !== options.y)) {
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
        color,
        isCrit,
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

    // Update floating combat numbers in-place with O(1) swap-and-pop removal
    for (let i = this.activeFloaterCount - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.x += t.vx;
      t.y += t.vy;
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
  public renderUnderLayer(ctx: CanvasRenderingContext2D, camX: number, camY: number, tileSize: number): void {
    meleeVfxEngine.renderGroundDecals(ctx, camX, camY, tileSize);
  }

  /**
   * Render active projectiles, slashes, and floating text layer (Over entities)
   */
  public renderOverLayer(ctx: CanvasRenderingContext2D, camX: number, camY: number, tileSize: number): void {
    meleeVfxEngine.renderSlashes(ctx, camX, camY, tileSize);
    projectileEngine.render(ctx, camX, camY, tileSize);
    this.renderFloatingTexts(ctx, camX, camY, tileSize);
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D, camX: number, camY: number, tileSize: number): void {
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

      ctx.font = t.isCrit
        ? 'bold 15px "Space Grotesk", system-ui, sans-serif'
        : '900 13px "Inter", system-ui, sans-serif';

      // Crisp dark text outline for readability
      ctx.lineWidth = t.isCrit ? 3.5 : 2.5;
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.92)';
      ctx.strokeText(t.text, rx, ry);

      // Vibrant fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, rx, ry);

      ctx.restore();
    }
  }
}

export const combatVfxEngine = CombatVfxEngine.getInstance();
