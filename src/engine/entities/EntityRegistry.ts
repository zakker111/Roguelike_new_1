/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AnimalEntity,
  BaseEntity,
  EnemyEntity,
  EntityDefinition,
  EntityKind,
  GenericEntity,
  InteractableEntity,
  ItemEntity,
  NpcEntity,
  PlayerEntity,
  ProjectileEntity,
  SummonEntity,
  TrapEntity
} from './types';

/**
 * Standard default entity blueprints available across the roguelike engine
 */
export const DEFAULT_ENTITY_DEFINITIONS: Record<string, EntityDefinition> = {
  // Traps
  spike_trap: {
    id: 'spike_trap',
    kind: 'trap',
    name: 'Spike Trap',
    char: '^',
    color: '#94a3b8',
    isBlocking: false,
    isInteractable: false,
    tags: ['trap', 'mechanical', 'floor'],
    defaultData: { damage: 10, triggerOnStep: true, disarmDifficulty: 12, isRevealed: false }
  },
  bear_trap: {
    id: 'bear_trap',
    kind: 'trap',
    name: 'Steel Bear Trap',
    char: 'Ω',
    color: '#cbd5e1',
    isBlocking: false,
    isInteractable: false,
    tags: ['trap', 'mechanical', 'snare'],
    defaultData: { damage: 15, triggerOnStep: true, disarmDifficulty: 15, inflictEffectId: 'stun', isRevealed: false }
  },
  poison_dart_trap: {
    id: 'poison_dart_trap',
    kind: 'trap',
    name: 'Poison Dart Plate',
    char: '∴',
    color: '#4ade80',
    isBlocking: false,
    isInteractable: false,
    tags: ['trap', 'poison', 'floor'],
    defaultData: { damage: 5, triggerOnStep: true, disarmDifficulty: 14, inflictEffectId: 'poison', isRevealed: false }
  },
  fire_rune: {
    id: 'fire_rune',
    kind: 'trap',
    name: 'Blazing Sigil',
    char: '☼',
    color: '#f97316',
    isBlocking: false,
    isInteractable: false,
    tags: ['trap', 'magic', 'fire'],
    defaultData: { damage: 20, triggerOnStep: true, disarmDifficulty: 18, inflictEffectId: 'burning', isRevealed: true }
  },

  // Summons
  skeleton_minion: {
    id: 'skeleton_minion',
    kind: 'summon',
    name: 'Skeleton Minion',
    char: 's',
    color: '#e2e8f0',
    baseHp: 20,
    baseAtk: 4,
    baseDef: 1,
    speed: 1.0,
    level: 1,
    isBlocking: true,
    isInteractable: false,
    tags: ['summon', 'undead', 'ally'],
    aiRole: 'melee',
    defaultData: { lifespanTurns: 6 }
  },
  flame_wisp: {
    id: 'flame_wisp',
    kind: 'summon',
    name: 'Flame Wisp',
    char: '•',
    color: '#fbbf24',
    baseHp: 15,
    baseAtk: 6,
    baseDef: 0,
    speed: 0.8,
    level: 1,
    isBlocking: true,
    isInteractable: false,
    tags: ['summon', 'elemental', 'fire'],
    aiRole: 'melee',
    abilities: ['fireball'],
    defaultData: { lifespanTurns: 5 }
  },
  healing_ward: {
    id: 'healing_ward',
    kind: 'summon',
    name: 'Healing Ward',
    char: '†',
    color: '#38bdf8',
    baseHp: 25,
    baseAtk: 0,
    baseDef: 3,
    speed: 1.0,
    level: 1,
    isBlocking: true,
    isInteractable: false,
    tags: ['summon', 'totem', 'support'],
    aiRole: 'support_healer',
    abilities: ['heal'],
    defaultData: { lifespanTurns: 8 }
  },

  // Animals
  cave_rat: {
    id: 'cave_rat',
    kind: 'animal',
    name: 'Cave Rat',
    char: 'r',
    color: '#78716c',
    baseHp: 8,
    baseAtk: 1,
    baseDef: 0,
    speed: 0.9,
    level: 1,
    isBlocking: true,
    isInteractable: false,
    tags: ['animal', 'beast', 'prey'],
    aiRole: 'passive',
    defaultData: { diet: 'omnivore', isPrey: true }
  },
  forest_deer: {
    id: 'forest_deer',
    kind: 'animal',
    name: 'Forest Stag',
    char: 'd',
    color: '#b45309',
    baseHp: 16,
    baseAtk: 2,
    baseDef: 1,
    speed: 0.7,
    level: 1,
    isBlocking: true,
    isInteractable: false,
    tags: ['animal', 'beast', 'prey'],
    aiRole: 'coward_flee',
    defaultData: { diet: 'herbivore', isPrey: true }
  },
  dire_wolf: {
    id: 'dire_wolf',
    kind: 'animal',
    name: 'Dire Wolf',
    char: 'w',
    color: '#64748b',
    baseHp: 24,
    baseAtk: 5,
    baseDef: 2,
    speed: 0.9,
    level: 2,
    isBlocking: true,
    isInteractable: false,
    tags: ['animal', 'beast', 'predator'],
    aiRole: 'melee',
    defaultData: { diet: 'carnivore', isPrey: false, isHostile: true }
  },

  // Interactables
  wooden_chest: {
    id: 'wooden_chest',
    kind: 'interactable',
    name: 'Wooden Chest',
    char: '■',
    color: '#d97706',
    isBlocking: true,
    isInteractable: true,
    tags: ['container', 'chest'],
    defaultData: { interactType: 'chest', isUsed: false, interactionPrompt: 'Open Chest' }
  },
  healing_shrine: {
    id: 'healing_shrine',
    kind: 'interactable',
    name: 'Shrine of Vitality',
    char: '⛩',
    color: '#60a5fa',
    isBlocking: true,
    isInteractable: true,
    tags: ['shrine', 'holy'],
    defaultData: { interactType: 'shrine', isUsed: false, interactionPrompt: 'Pray for Healing' }
  },
  dungeon_door: {
    id: 'dungeon_door',
    kind: 'interactable',
    name: 'Heavy Oak Door',
    char: '+',
    color: '#a16207',
    isBlocking: true,
    isInteractable: true,
    tags: ['door', 'structure'],
    defaultData: { interactType: 'door', state: 'closed', isUsed: false, interactionPrompt: 'Open Door' }
  },
  ancient_lever: {
    id: 'ancient_lever',
    kind: 'interactable',
    name: 'Ancient Lever',
    char: '/',
    color: '#94a3b8',
    isBlocking: false,
    isInteractable: true,
    tags: ['lever', 'mechanism'],
    defaultData: { interactType: 'lever', state: 'unpulled', isUsed: false, interactionPrompt: 'Pull Lever' }
  },

  // Projectiles
  arrow: {
    id: 'arrow',
    kind: 'projectile',
    name: 'Flight Arrow',
    char: '>',
    color: '#e2e8f0',
    isBlocking: false,
    isInteractable: false,
    tags: ['projectile', 'physical', 'piercing'],
    defaultData: { damage: 8, speed: 2, rangeRemaining: 6 }
  },
  fireball_orb: {
    id: 'fireball_orb',
    kind: 'projectile',
    name: 'Blazing Sphere',
    char: '*',
    color: '#ef4444',
    isBlocking: false,
    isInteractable: false,
    tags: ['projectile', 'magic', 'fire'],
    defaultData: { damage: 16, speed: 1.5, element: 'fire', inflictEffectId: 'burning', rangeRemaining: 8 }
  }
};

/**
 * Universal registry for entity definition blueprints across the roguelike engine
 */
export class EntityRegistryClass {
  private static instance: EntityRegistryClass | null = null;
  private definitions = new Map<string, EntityDefinition>();

  constructor() {
    this.initDefaults();
  }

  public static getInstance(): EntityRegistryClass {
    return EntityRegistry;
  }

  public static resetInstance(): void {
    EntityRegistry.initDefaults();
  }

  public resetInstance(): void {
    this.initDefaults();
  }

  public count(): number {
    return this.definitions.size;
  }

  /**
   * Reset and register default built-in blueprints
   */
  public initDefaults(): void {
    this.definitions.clear();
    for (const [key, def] of Object.entries(DEFAULT_ENTITY_DEFINITIONS)) {
      this.definitions.set(key, { ...def });
    }
  }

  /**
   * Register or overwrite an entity blueprint definition
   */
  public register(definition: EntityDefinition): void {
    this.definitions.set(definition.id, { ...definition });
  }

  /**
   * Lookup a definition by blueprint identifier
   */
  public get(id: string): EntityDefinition | undefined {
    return this.definitions.get(id);
  }

  /**
   * Check if a blueprint is registered
   */
  public has(id: string): boolean {
    return this.definitions.has(id);
  }

  /**
   * Return all registered definitions
   */
  public getAll(): EntityDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Query registered definitions filtered by entity kind
   */
  public getByKind(kind: EntityKind): EntityDefinition[] {
    return this.getAll().filter(def => def.kind === kind);
  }

  /**
   * Instantiate a runtime GenericEntity from a registered definition
   */
  public create(
    definitionId: string,
    options: {
      id?: string;
      x: number;
      y: number;
      z?: number;
      name?: string;
      faction?: string;
      ownerId?: string;
      ownerName?: string;
      customData?: Record<string, any>;
    }
  ): GenericEntity {
    const def = this.get(definitionId);
    if (!def) {
      throw new Error(`[EntityRegistry] Unknown entity blueprint: "${definitionId}"`);
    }

    const instanceId = options.id || `${def.id}_${Math.random().toString(36).substring(2, 9)}`;
    const base: BaseEntity = {
      id: instanceId,
      kind: def.kind,
      name: options.name || def.name,
      x: options.x,
      y: options.y,
      z: options.z ?? 0,
      char: def.char,
      color: def.color,
      spriteKey: def.spriteKey,
      tags: [...(def.tags || [])],
      faction: options.faction || def.faction || 'neutral',
      isBlocking: def.isBlocking ?? true,
      isInteractable: def.isInteractable ?? false,
      isAlive: true,
      data: { ...def.defaultData, ...options.customData }
    };

    switch (def.kind) {
      case 'trap': {
        const trap: TrapEntity = {
          ...base,
          kind: 'trap',
          isBlocking: false,
          isInteractable: false,
          trapType: def.id,
          damage: base.data?.damage ?? 10,
          inflictEffectId: base.data?.inflictEffectId,
          isTriggered: false,
          isRevealed: base.data?.isRevealed ?? false,
          triggerOnStep: base.data?.triggerOnStep ?? true,
          disarmDifficulty: base.data?.disarmDifficulty ?? 10
        };
        return trap;
      }

      case 'summon': {
        const summon: SummonEntity = {
          ...base,
          kind: 'summon',
          hp: def.baseHp ?? 15,
          maxHp: def.baseHp ?? 15,
          atk: def.baseAtk ?? 3,
          def: def.baseDef ?? 1,
          speed: def.speed ?? 1.0,
          level: def.level ?? 1,
          activeEffects: [],
          abilities: def.abilities ? [...def.abilities] : [],
          aiRole: def.aiRole || 'melee',
          ownerId: options.ownerId || 'unknown',
          ownerName: options.ownerName || 'Master',
          lifespanTurns: base.data?.lifespanTurns ?? 5,
          maxLifespanTurns: base.data?.lifespanTurns ?? 5
        };
        return summon;
      }

      case 'animal': {
        const animal: AnimalEntity = {
          ...base,
          kind: 'animal',
          hp: def.baseHp ?? 10,
          maxHp: def.baseHp ?? 10,
          atk: def.baseAtk ?? 1,
          def: def.baseDef ?? 0,
          speed: def.speed ?? 1.0,
          level: def.level ?? 1,
          activeEffects: [],
          aiRole: def.aiRole || 'passive',
          diet: base.data?.diet || 'herbivore',
          isPrey: base.data?.isPrey ?? true,
          isHostile: base.data?.isHostile ?? false
        };
        return animal;
      }

      case 'interactable': {
        const interactable: InteractableEntity = {
          ...base,
          kind: 'interactable',
          interactType: base.data?.interactType || 'custom',
          isUsed: base.data?.isUsed ?? false,
          interactionPrompt: base.data?.interactionPrompt || 'Interact',
          state: base.data?.state || 'default'
        };
        return interactable;
      }

      case 'projectile': {
        const projectile: ProjectileEntity = {
          ...base,
          kind: 'projectile',
          isBlocking: false,
          isInteractable: false,
          sourceEntityId: options.ownerId || 'source',
          sourceEntityName: options.ownerName,
          targetX: base.data?.targetX ?? base.x,
          targetY: base.data?.targetY ?? base.y,
          damage: base.data?.damage ?? 10,
          element: base.data?.element,
          speed: base.data?.speed ?? 1.0,
          rangeRemaining: base.data?.rangeRemaining ?? 6,
          piercing: base.data?.piercing ?? false,
          inflictEffectId: base.data?.inflictEffectId
        };
        return projectile;
      }

      default:
        return base;
    }
  }

  // Direct manual factory methods for runtime entity creation
  public createPlayer(options: {
    id?: string;
    name: string;
    x: number;
    y: number;
    z?: number;
    hp?: number;
    maxHp?: number;
    mp?: number;
    maxMp?: number;
    atk?: number;
    def?: number;
    gold?: number;
    xp?: number;
    char?: string;
    color?: string;
  }): PlayerEntity {
    return {
      id: options.id || 'player',
      kind: 'player',
      name: options.name,
      x: options.x,
      y: options.y,
      z: options.z ?? 0,
      char: options.char || '@',
      color: options.color || '#3b82f6',
      tags: ['player', 'hero'],
      faction: 'player',
      disposition: 'friendly',
      isBlocking: true,
      isInteractable: false,
      isAlive: true,
      hp: options.hp ?? 100,
      maxHp: options.maxHp ?? 100,
      mp: options.mp ?? 30,
      maxMp: options.maxMp ?? 30,
      atk: options.atk ?? 10,
      def: options.def ?? 5,
      speed: 1.0,
      level: 1,
      gold: options.gold ?? 0,
      xp: options.xp ?? 0,
      turnsPlayed: 0,
      activeEffects: [],
      abilities: []
    };
  }

  public createEnemy(options: {
    id?: string;
    name: string;
    x: number;
    y: number;
    z?: number;
    hp: number;
    maxHp?: number;
    atk: number;
    def: number;
    char: string;
    color: string;
    speed?: number;
    level?: number;
    faction?: string;
    aiRole?: any;
    abilities?: string[];
    isElite?: boolean;
    isBoss?: boolean;
  }): EnemyEntity {
    return {
      id: options.id || `enemy_${Math.random().toString(36).substring(2, 9)}`,
      kind: 'enemy',
      name: options.name,
      x: options.x,
      y: options.y,
      z: options.z ?? 0,
      char: options.char,
      color: options.color,
      tags: ['enemy', 'hostile'],
      faction: options.faction || 'hostile',
      disposition: 'hostile',
      isBlocking: true,
      isInteractable: false,
      isAlive: true,
      hp: options.hp,
      maxHp: options.maxHp ?? options.hp,
      atk: options.atk,
      def: options.def,
      speed: options.speed ?? 1.0,
      level: options.level ?? 1,
      isElite: options.isElite ?? false,
      isBoss: options.isBoss ?? false,
      activeEffects: [],
      abilities: options.abilities ? [...options.abilities] : [],
      aiRole: options.aiRole || 'melee'
    };
  }

  public createNPC(options: {
    id?: string;
    name: string;
    role: string;
    x: number;
    y: number;
    z?: number;
    char?: string;
    color?: string;
    dialogue?: string[];
    faction?: string;
  }): NpcEntity {
    return {
      id: options.id || `npc_${Math.random().toString(36).substring(2, 9)}`,
      kind: 'npc',
      name: options.name,
      role: options.role,
      x: options.x,
      y: options.y,
      z: options.z ?? 0,
      char: options.char || 'N',
      color: options.color || '#eab308',
      tags: ['npc', 'civilian'],
      faction: options.faction || 'town',
      disposition: 'neutral',
      isBlocking: true,
      isInteractable: true,
      isAlive: true,
      hp: 50,
      maxHp: 50,
      atk: 1,
      def: 2,
      speed: 1.0,
      level: 1,
      dialogue: options.dialogue || ['Greetings, traveler.'],
      homeX: options.x,
      homeY: options.y,
      workX: options.x,
      workY: options.y,
      scheduleState: 'home'
    };
  }

  public createItem(options: {
    id?: string;
    itemId: string;
    name: string;
    x: number;
    y: number;
    z?: number;
    quantity?: number;
    char?: string;
    color?: string;
    rarity?: string;
    value?: number;
  }): ItemEntity {
    return {
      id: options.id || `item_${Math.random().toString(36).substring(2, 9)}`,
      kind: 'item',
      itemId: options.itemId,
      name: options.name,
      x: options.x,
      y: options.y,
      z: options.z ?? 0,
      char: options.char || '?',
      color: options.color || '#e2e8f0',
      tags: ['item', 'loot'],
      isBlocking: false,
      isInteractable: true,
      isAlive: true,
      quantity: options.quantity ?? 1,
      rarity: options.rarity || 'common',
      value: options.value ?? 1
    };
  }
}

/**
 * Singleton instance of EntityRegistry
 */
export const EntityRegistry = new EntityRegistryClass();
