/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AbilityDefinition, AbilityExecutionContext, AbilityExecutionResult } from './types';

/**
 * Default core abilities catalog built into the engine
 * Covers the archetypes requested in ENGINEPLAN.md:
 * fireball, heal, poison, dash, summon, teleport, explode, shoot, buff, debuff
 */
const DEFAULT_ABILITIES: AbilityDefinition[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    type: 'attack',
    targetType: 'area_tile',
    range: 6,
    radius: 1,
    cooldown: 3,
    manaCost: 6,
    basePower: 12,
    damageMultiplier: 1.35,
    effectId: 'burning',
    effectDuration: 3,
    element: 'Fire',
    icon: '🔥',
    color: '#f97316',
    description: 'Launches an explosive orb of fire that detonates in a 1-tile radius and ignites enemies.',
    soundEffect: 'fireball'
  },
  {
    id: 'shoot',
    name: 'Ranged Shot',
    type: 'attack',
    targetType: 'single_enemy',
    range: 5,
    radius: 0,
    cooldown: 0,
    manaCost: 0,
    basePower: 5,
    damageMultiplier: 1.0,
    element: 'Physical',
    icon: '🏹',
    color: '#e2e8f0',
    description: 'Fires an accurate ranged projectile at an enemy in line of sight.',
    soundEffect: 'arrow_shoot'
  },
  {
    id: 'heal',
    name: 'Restorative Surge',
    type: 'heal',
    targetType: 'self',
    range: 0,
    radius: 0,
    cooldown: 4,
    manaCost: 8,
    basePower: 15,
    icon: '💖',
    color: '#10b981',
    description: 'Channels soothing energy to restore health.',
    soundEffect: 'heal'
  },
  {
    id: 'ally_heal',
    name: 'Support Heal',
    type: 'heal',
    targetType: 'single_ally',
    range: 4,
    radius: 0,
    cooldown: 3,
    manaCost: 6,
    basePower: 12,
    icon: '✨',
    color: '#34d399',
    description: 'Channels restorative life force into a wounded ally.',
    soundEffect: 'heal'
  },
  {
    id: 'poison_dart',
    name: 'Poison Dart',
    type: 'debuff',
    targetType: 'single_enemy',
    range: 4,
    radius: 0,
    cooldown: 3,
    manaCost: 4,
    basePower: 4,
    effectId: 'poison',
    effectDuration: 5,
    icon: '🤢',
    color: '#22c55e',
    description: 'Spits a venomous dart that afflicts the target with lingering poison.',
    soundEffect: 'poison_hit'
  },
  {
    id: 'dash',
    name: 'Quick Dash',
    type: 'dash',
    targetType: 'direction',
    range: 2,
    cooldown: 3,
    manaCost: 3,
    icon: '💨',
    color: '#67e8f9',
    description: 'Quickly propels forward 2 tiles, passing harmlessly through open ground.',
    soundEffect: 'dash'
  },
  {
    id: 'teleport',
    name: 'Blink Teleport',
    type: 'teleport',
    targetType: 'area_tile',
    range: 5,
    cooldown: 6,
    manaCost: 10,
    icon: '🌀',
    color: '#a855f7',
    description: 'Instantly dematerializes and shifts to any visible floor tile within range.',
    soundEffect: 'teleport'
  },
  {
    id: 'summon_minions',
    name: 'Summon Swarm',
    type: 'summon',
    targetType: 'self',
    range: 0,
    radius: 2,
    cooldown: 8,
    manaCost: 15,
    summonEntityId: 'Giant Plague Rat',
    summonCount: 2,
    icon: '🐀',
    color: '#78716c',
    description: 'Summons reinforcements to swarm and harass opponents.',
    soundEffect: 'summon'
  },
  {
    id: 'explode',
    name: 'Self-Destruct Detonation',
    type: 'explode',
    targetType: 'self',
    range: 0,
    radius: 2,
    cooldown: 0,
    basePower: 25,
    element: 'Fire',
    icon: '💥',
    color: '#ef4444',
    description: 'Detonates with tremendous force, heavily damaging all nearby entities.',
    soundEffect: 'explosion'
  },
  {
    id: 'buff_bloodlust',
    name: 'Bloodlust Howl',
    type: 'buff',
    targetType: 'self',
    range: 0,
    radius: 0,
    cooldown: 5,
    effectId: 'bloodlust',
    effectDuration: 5,
    icon: '🩸',
    color: '#dc2626',
    description: 'Unleashes a ferocious battle cry, boosting attack and ferocity.',
    soundEffect: 'roar'
  },
  {
    id: 'shield_barrier',
    name: 'Aegis Barrier',
    type: 'buff',
    targetType: 'self',
    range: 0,
    cooldown: 6,
    manaCost: 6,
    effectId: 'shielded',
    effectDuration: 6,
    icon: '🛡️',
    color: '#38bdf8',
    description: 'Creates a shimmering barrier that bolsters defense against attacks.',
    soundEffect: 'shield_cast'
  }
];

/**
 * Singleton Registry managing all data-driven ability definitions in the engine.
 */
export class AbilityRegistry {
  private static instance: AbilityRegistry | null = null;
  private abilities: Map<string, AbilityDefinition> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): AbilityRegistry {
    if (!AbilityRegistry.instance) {
      AbilityRegistry.instance = new AbilityRegistry();
    }
    return AbilityRegistry.instance;
  }

  /**
   * Resets registry to initial state (useful in test suites)
   */
  public static resetInstance(): void {
    AbilityRegistry.instance = null;
  }

  private registerDefaults(): void {
    for (const ability of DEFAULT_ABILITIES) {
      this.register(ability);
    }
  }

  /**
   * Registers a new ability or updates an existing one
   */
  public register(ability: AbilityDefinition): void {
    if (!ability.id) {
      throw new Error('[AbilityRegistry] Ability definition must have a valid non-empty id.');
    }
    this.abilities.set(ability.id, ability);
  }

  /**
   * Retrieves an ability definition by ID
   */
  public get(id: string): AbilityDefinition | undefined {
    return this.abilities.get(id);
  }

  /**
   * Checks if an ability is registered
   */
  public has(id: string): boolean {
    return this.abilities.has(id);
  }

  /**
   * Returns all registered ability definitions
   */
  public getAll(): AbilityDefinition[] {
    return Array.from(this.abilities.values());
  }

  /**
   * Returns all abilities matching a specific type
   */
  public getByType(type: AbilityDefinition['type']): AbilityDefinition[] {
    return this.getAll().filter(a => a.type === type);
  }

  /**
   * Executes an ability using the unified pipeline
   */
  public execute(abilityId: string, ctx: AbilityExecutionContext): AbilityExecutionResult {
    const ability = this.get(abilityId);
    if (!ability) {
      return {
        success: false,
        abilityId,
        message: `Ability '${abilityId}' not found in AbilityRegistry.`
      };
    }

    // Custom execution override if defined
    if (ability.customExecute) {
      return ability.customExecute(ctx);
    }

    // Built-in resolution logic based on ability type
    return this.resolveStandardAbility(ability, ctx);
  }

  /**
   * Standard execution handler for universal abilities
   */
  private resolveStandardAbility(ability: AbilityDefinition, ctx: AbilityExecutionContext): AbilityExecutionResult {
    const { source, target, targetPos, mapContext } = ctx;

    switch (ability.type) {
      case 'heal': {
        const healTarget = ability.targetType === 'single_ally' ? target || source : source;
        const healAmt = ability.basePower || 10;
        const oldHp = healTarget.hp;
        healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + healAmt);
        const actualHealed = healTarget.hp - oldHp;

        return {
          success: true,
          abilityId: ability.id,
          healingDone: actualHealed,
          message: `${source.name} casts ${ability.name} on ${healTarget.name}, restoring ${actualHealed} HP!`,
          vfx: {
            type: 'burst',
            color: ability.color || '#10b981',
            targetX: healTarget.x,
            targetY: healTarget.y,
            radius: 1
          }
        };
      }

      case 'attack':
      case 'explode': {
        const basePower = ability.basePower || (source.atk || 5);
        const multiplier = ability.damageMultiplier || 1.0;
        const rawDmg = Math.round(basePower * multiplier);

        if (target) {
          const def = target.def || 0;
          const finalDmg = Math.max(1, rawDmg - Math.floor(def / 2));
          target.hp = Math.max(0, target.hp - finalDmg);

          return {
            success: true,
            abilityId: ability.id,
            damageDealt: finalDmg,
            effectApplied: ability.effectId,
            targetsHitCount: 1,
            message: `${source.name} uses ${ability.name} on ${target.name} for ${finalDmg} damage!`,
            vfx: {
              type: ability.targetType === 'area_tile' ? 'aoe_circle' : 'projectile',
              color: ability.color || '#ef4444',
              startX: source.x,
              startY: source.y,
              targetX: target.x,
              targetY: target.y,
              radius: ability.radius || 0
            }
          };
        }

        // Area tile targeting or self explosion
        const hitX = targetPos?.x ?? source.x;
        const hitY = targetPos?.y ?? source.y;
        return {
          success: true,
          abilityId: ability.id,
          damageDealt: rawDmg,
          targetsHitCount: 1,
          message: `${source.name} detonates ${ability.name} at (${hitX}, ${hitY})!`,
          vfx: {
            type: 'aoe_circle',
            color: ability.color || '#ef4444',
            targetX: hitX,
            targetY: hitY,
            radius: ability.radius || 1
          }
        };
      }

      case 'dash':
      case 'teleport': {
        const dest = targetPos || { x: source.x, y: source.y };
        if (mapContext?.isBlocked && mapContext.isBlocked(dest.x, dest.y)) {
          return {
            success: false,
            abilityId: ability.id,
            message: `Destination (${dest.x}, ${dest.y}) is blocked.`
          };
        }

        return {
          success: true,
          abilityId: ability.id,
          newPosition: dest,
          message: `${source.name} uses ${ability.name} to move to (${dest.x}, ${dest.y})!`,
          vfx: {
            type: 'teleport_flash',
            color: ability.color || '#a855f7',
            startX: source.x,
            startY: source.y,
            targetX: dest.x,
            targetY: dest.y
          }
        };
      }

      case 'buff':
      case 'debuff': {
        const effectTarget = ability.type === 'buff' ? source : (target || source);
        return {
          success: true,
          abilityId: ability.id,
          effectApplied: ability.effectId,
          message: `${source.name} afflicts ${effectTarget.name} with ${ability.name}!`,
          vfx: {
            type: 'burst',
            color: ability.color || '#eab308',
            targetX: effectTarget.x,
            targetY: effectTarget.y
          }
        };
      }

      case 'summon': {
        const count = ability.summonCount || 1;
        const entityId = ability.summonEntityId || 'Giant Plague Rat';
        return {
          success: true,
          abilityId: ability.id,
          summonedIds: Array(count).fill(entityId),
          message: `${source.name} summons ${count}x ${entityId}!`,
          vfx: {
            type: 'burst',
            color: ability.color || '#78716c',
            targetX: source.x,
            targetY: source.y,
            radius: 2
          }
        };
      }

      default:
        return {
          success: true,
          abilityId: ability.id,
          message: `${source.name} activates ${ability.name}.`
        };
    }
  }
}
