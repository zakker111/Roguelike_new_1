/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AnimalEntity,
  BaseEntity,
  EnemyEntity,
  EntityKind,
  EntityTickContext,
  EntityTickReport,
  GenericEntity,
  InteractableEntity,
  ItemEntity,
  LivingEntity,
  NpcEntity,
  PlayerEntity,
  ProjectileEntity,
  SummonEntity,
  TrapEntity
} from './types';
import { EffectManager } from '../effects/EffectManager';
import { Enemy, NPC, PlayerStats } from '../../types/entities';

/**
 * Universal manager responsible for orchestrating, indexing, and ticking
 * all generic entities within the game world.
 */
export class EntityManager {
  /** Map of entity id -> GenericEntity */
  private entities = new Map<string, GenericEntity>();

  /** Spatial index: "x,y,z" -> Set of entity IDs */
  private spatialIndex = new Map<string, Set<string>>();

  /** Tag index: tag -> Set of entity IDs */
  private tagIndex = new Map<string, Set<string>>();

  /**
   * Helper to format coordinate key
   */
  private coordKey(x: number, y: number, z: number = 0): string {
    return `${x},${y},${z}`;
  }

  /**
   * Register and place an entity into the manager
   */
  public add<T extends GenericEntity>(entity: T): T {
    if (this.entities.has(entity.id)) {
      this.remove(entity.id);
    }

    this.entities.set(entity.id, entity);

    // Update spatial index
    const key = this.coordKey(entity.x, entity.y, entity.z ?? 0);
    let cell = this.spatialIndex.get(key);
    if (!cell) {
      cell = new Set();
      this.spatialIndex.set(key, cell);
    }
    cell.add(entity.id);

    // Update tag index
    if (entity.tags && Array.isArray(entity.tags)) {
      for (const tag of entity.tags) {
        let tagSet = this.tagIndex.get(tag);
        if (!tagSet) {
          tagSet = new Set();
          this.tagIndex.set(tag, tagSet);
        }
        tagSet.add(entity.id);
      }
    }

    return entity;
  }

  /**
   * Remove an entity by ID
   */
  public remove(id: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    // Remove from spatial index
    const key = this.coordKey(entity.x, entity.y, entity.z ?? 0);
    const cell = this.spatialIndex.get(key);
    if (cell) {
      cell.delete(id);
      if (cell.size === 0) {
        this.spatialIndex.delete(key);
      }
    }

    // Remove from tag index
    if (entity.tags && Array.isArray(entity.tags)) {
      for (const tag of entity.tags) {
        const tagSet = this.tagIndex.get(tag);
        if (tagSet) {
          tagSet.delete(id);
          if (tagSet.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      }
    }

    this.entities.delete(id);
    return true;
  }

  /**
   * Retrieve an entity by ID
   */
  public get(id: string): GenericEntity | undefined {
    return this.entities.get(id);
  }

  /**
   * Retrieve all active entities
   */
  public getAll(): GenericEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Filter entities by kind
   */
  public getByKind<T extends GenericEntity>(kind: EntityKind): T[] {
    const results: T[] = [];
    for (const entity of this.entities.values()) {
      if (entity.kind === kind) {
        results.push(entity as T);
      }
    }
    return results;
  }

  /**
   * Get all entities at given coordinate
   */
  public getAt(x: number, y: number, z: number = 0): GenericEntity[] {
    const key = this.coordKey(x, y, z);
    const ids = this.spatialIndex.get(key);
    if (!ids || ids.size === 0) return [];

    const result: GenericEntity[] = [];
    for (const id of ids) {
      const ent = this.entities.get(id);
      if (ent) result.push(ent);
    }
    return result;
  }

  /**
   * Get first blocking entity at given coordinate
   */
  public getBlockingAt(x: number, y: number, z: number = 0): GenericEntity | undefined {
    const entities = this.getAt(x, y, z);
    return entities.find(e => e.isBlocking && e.isAlive !== false && !e.destroyed);
  }

  /**
   * Query all entities within a Chebyshev / Manhattan radius
   */
  public getInRadius(x: number, y: number, radius: number, z: number = 0): GenericEntity[] {
    const results: GenericEntity[] = [];
    for (const entity of this.entities.values()) {
      if ((entity.z ?? 0) !== z) continue;
      const dx = Math.abs(entity.x - x);
      const dy = Math.abs(entity.y - y);
      const dist = Math.max(dx, dy); // Chebyshev distance
      if (dist <= radius) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Query entities by tag
   */
  public getByTag(tag: string): GenericEntity[] {
    const ids = this.tagIndex.get(tag);
    if (!ids) return [];
    const results: GenericEntity[] = [];
    for (const id of ids) {
      const ent = this.entities.get(id);
      if (ent) results.push(ent);
    }
    return results;
  }

  /**
   * Query entities by faction
   */
  public getByFaction(faction: string): GenericEntity[] {
    return Array.from(this.entities.values()).filter(e => e.faction === faction);
  }

  /**
   * Get all living beings (creatures, players, summons, npcs)
   */
  public getLiving(): LivingEntity[] {
    return Array.from(this.entities.values()).filter(
      (e): e is LivingEntity =>
        'hp' in e && (e as LivingEntity).hp > 0 && e.isAlive !== false && !e.destroyed
    );
  }

  /**
   * Move an entity to a new coordinate with spatial index synchronization
   */
  public move(
    id: string,
    newX: number,
    newY: number,
    newZ: number = 0,
    options: { ignoreBlocking?: boolean } = {}
  ): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    // Check collision if blocking
    if (!options.ignoreBlocking && entity.isBlocking) {
      const blocker = this.getBlockingAt(newX, newY, newZ);
      if (blocker && blocker.id !== id) {
        return false;
      }
    }

    // Remove from old spatial coordinate
    const oldKey = this.coordKey(entity.x, entity.y, entity.z ?? 0);
    const oldCell = this.spatialIndex.get(oldKey);
    if (oldCell) {
      oldCell.delete(id);
      if (oldCell.size === 0) {
        this.spatialIndex.delete(oldKey);
      }
    }

    // Update entity coordinates
    entity.x = newX;
    entity.y = newY;
    entity.z = newZ;

    // Add to new spatial coordinate
    const newKey = this.coordKey(newX, newY, newZ);
    let newCell = this.spatialIndex.get(newKey);
    if (!newCell) {
      newCell = new Set();
      this.spatialIndex.set(newKey, newCell);
    }
    newCell.add(id);

    return true;
  }

  /**
   * Check and trigger any traps at an entity's current location
   */
  public checkTrapTrigger(steppingEntity: GenericEntity): { triggeredTrap?: TrapEntity; damage: number } {
    const traps = this.getAt(steppingEntity.x, steppingEntity.y, steppingEntity.z ?? 0)
      .filter((e): e is TrapEntity => e.kind === 'trap' && !(e as TrapEntity).isTriggered && (e as TrapEntity).triggerOnStep);

    if (traps.length === 0) {
      return { damage: 0 };
    }

    const trap = traps[0];
    trap.isTriggered = true;
    trap.isRevealed = true;

    // Apply damage if living entity
    if ('hp' in steppingEntity) {
      const living = steppingEntity as LivingEntity;
      living.hp = Math.max(0, living.hp - trap.damage);
      if (living.hp <= 0) {
        living.isAlive = false;
        living.destroyed = true;
      }

      // Inflict effect if trap has one
      if (trap.inflictEffectId) {
        EffectManager.applyEffect(living, trap.inflictEffectId);
      }
    }

    return { triggeredTrap: trap, damage: trap.damage };
  }

  /**
   * Advance simulation turn across all entities
   */
  public tick(context: EntityTickContext): EntityTickReport {
    const report: EntityTickReport = {
      turn: context.currentTurn,
      processedEntitiesCount: this.entities.size,
      expiredSummonIds: [],
      triggeredTrapIds: [],
      activeProjectileSteps: [],
      deadEntityIds: [],
      logs: []
    };

    const toRemove: string[] = [];

    for (const entity of Array.from(this.entities.values())) {
      if (entity.destroyed) {
        toRemove.push(entity.id);
        continue;
      }

      // 1. Process Summons lifespan decay
      if (entity.kind === 'summon') {
        const summon = entity as SummonEntity;
        summon.lifespanTurns -= 1;
        if (summon.lifespanTurns <= 0) {
          summon.isAlive = false;
          summon.destroyed = true;
          report.expiredSummonIds.push(summon.id);
          report.logs.push(`${summon.name} dissipated as its summon duration expired.`);
          toRemove.push(summon.id);
          continue;
        }
      }

      // 2. Process Status Effects on living entities
      if ('hp' in entity && (entity as LivingEntity).activeEffects && (entity as LivingEntity).activeEffects!.length > 0) {
        const living = entity as LivingEntity;
        const tickResult = EffectManager.tickEffects(living);
        if (tickResult.logs.length > 0) {
          report.logs.push(...tickResult.logs);
        }
        if (tickResult.isEntityDead || living.hp <= 0) {
          living.isAlive = false;
          living.destroyed = true;
          report.deadEntityIds.push(living.id);
          report.logs.push(`${living.name} perished from lingering status effects.`);
          toRemove.push(living.id);
          continue;
        }
      }

      // 3. Process Ballistic Projectiles traversal
      if (entity.kind === 'projectile') {
        const proj = entity as ProjectileEntity;
        // Calculate step towards target
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const stepX = dx === 0 ? 0 : Math.sign(dx);
        const stepY = dy === 0 ? 0 : Math.sign(dy);

        const nextX = proj.x + stepX;
        const nextY = proj.y + stepY;
        this.move(proj.id, nextX, nextY, proj.z ?? 0, { ignoreBlocking: true });
        proj.rangeRemaining -= 1;

        // Check if hit any entity at next location
        const hits = this.getAt(nextX, nextY, proj.z ?? 0).filter(
          e => e.id !== proj.id && e.id !== proj.sourceEntityId && 'hp' in e
        );

        let hitEntityId: string | undefined;
        if (hits.length > 0) {
          const victim = hits[0] as LivingEntity;
          victim.hp = Math.max(0, victim.hp - proj.damage);
          hitEntityId = victim.id;
          report.logs.push(`${proj.name} struck ${victim.name} for ${proj.damage} damage!`);

          if (proj.inflictEffectId) {
            EffectManager.applyEffect(victim, proj.inflictEffectId);
          }

          if (victim.hp <= 0) {
            victim.isAlive = false;
            victim.destroyed = true;
            report.deadEntityIds.push(victim.id);
            toRemove.push(victim.id);
          }

          if (!proj.piercing) {
            proj.destroyed = true;
            toRemove.push(proj.id);
          }
        } else if (proj.rangeRemaining <= 0 || (proj.x === proj.targetX && proj.y === proj.targetY)) {
          proj.destroyed = true;
          toRemove.push(proj.id);
        }

        report.activeProjectileSteps.push({
          projectileId: proj.id,
          newX: nextX,
          newY: nextY,
          hitEntityId
        });
      }
    }

    // Clean up destroyed entities
    for (const id of toRemove) {
      this.remove(id);
    }

    return report;
  }

  /**
   * Clear all entities
   */
  public clear(): void {
    this.entities.clear();
    this.spatialIndex.clear();
    this.tagIndex.clear();
  }

  // ==========================================
  // ADAPTER METHODS (Bridge to existing systems)
  // ==========================================

  /**
   * Convert an existing game Enemy instance into an EnemyEntity
   */
  public fromEnemy(enemy: Enemy): EnemyEntity {
    return {
      id: enemy.id,
      kind: 'enemy',
      name: enemy.name,
      x: enemy.x,
      y: enemy.y,
      z: enemy.z ?? 0,
      char: enemy.char,
      color: enemy.color,
      tags: ['enemy', 'hostile', ...(enemy.isElite ? ['elite'] : []), ...(enemy.isBoss ? ['boss'] : [])],
      faction: enemy.faction || 'hostile',
      disposition: 'hostile',
      isBlocking: true,
      isInteractable: false,
      isAlive: (enemy.hp ?? 1) > 0,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      atk: enemy.atk,
      def: enemy.def,
      speed: enemy.speed ?? 1.0,
      level: (enemy as any).level ?? 1,
      isElite: enemy.isElite,
      isBoss: enemy.isBoss,
      eliteEffect: enemy.eliteEffect,
      dropMaterials: enemy.dropMaterials,
      dropCatalysts: enemy.dropCatalysts,
      xpReward: (enemy as any).xpReward,
      abilities: (enemy as any).abilities ? [...(enemy as any).abilities] : [],
      aiRole: enemy.aiRole as any,
      state: enemy.state,
      data: { originalEnemy: enemy }
    };
  }

  /**
   * Convert an EnemyEntity back into an existing game Enemy
   */
  public toEnemy(entity: EnemyEntity): Enemy {
    const orig = entity.data?.originalEnemy || {};
    return {
      ...orig,
      id: entity.id,
      name: entity.name,
      x: entity.x,
      y: entity.y,
      z: entity.z,
      char: entity.char,
      color: entity.color,
      hp: entity.hp,
      maxHp: entity.maxHp,
      atk: entity.atk,
      def: entity.def,
      speed: entity.speed,
      level: entity.level,
      isElite: entity.isElite,
      isBoss: entity.isBoss,
      eliteEffect: entity.eliteEffect,
      dropMaterials: entity.dropMaterials,
      dropCatalysts: entity.dropCatalysts,
      xpReward: entity.xpReward,
      faction: entity.faction,
      aiRole: entity.aiRole as any,
      abilities: entity.abilities
    };
  }

  /**
   * Convert an existing game NPC into an NpcEntity
   */
  public fromNPC(npc: NPC): NpcEntity {
    return {
      id: npc.id,
      kind: 'npc',
      name: npc.name,
      role: npc.role,
      x: npc.x,
      y: npc.y,
      z: npc.z ?? 0,
      char: npc.char,
      color: npc.color,
      tags: ['npc', npc.role],
      faction: npc.factionId || 'town',
      disposition: 'neutral',
      isBlocking: true,
      isInteractable: true,
      isAlive: true,
      hp: 100,
      maxHp: 100,
      atk: 1,
      def: 5,
      speed: 1.0,
      level: 1,
      dialogue: [...npc.dialogue],
      homeX: npc.homeX,
      homeY: npc.homeY,
      workX: npc.workX,
      workY: npc.workY,
      scheduleState: npc.scheduleState,
      data: { originalNpc: npc }
    };
  }

  /**
   * Convert player stats and position into a PlayerEntity
   */
  public fromPlayer(
    stats: PlayerStats,
    position: { x: number; y: number; z?: number }
  ): PlayerEntity {
    return {
      id: 'player',
      kind: 'player',
      name: 'Player',
      x: position.x,
      y: position.y,
      z: position.z ?? 0,
      char: '@',
      color: '#38bdf8',
      tags: ['player', 'hero'],
      faction: 'player',
      disposition: 'friendly',
      isBlocking: true,
      isInteractable: false,
      isAlive: stats.hp > 0,
      hp: stats.hp,
      maxHp: stats.maxHp,
      mp: stats.mp,
      maxMp: stats.maxMp,
      atk: stats.atk,
      def: stats.def,
      speed: 1.0,
      level: stats.level,
      gold: stats.gold,
      xp: stats.xp,
      turnsPlayed: stats.turnsPlayed,
      activeEffects: [],
      data: { originalStats: stats }
    };
  }
}
