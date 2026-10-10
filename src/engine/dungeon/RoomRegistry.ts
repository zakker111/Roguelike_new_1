/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomTemplate, DungeonRoomType, DungeonRoomShape } from './types';

/**
 * Standard built-in room templates representing classic dungeon room archetypes
 */
const DEFAULT_ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: 'entrance_hall',
    name: 'Entrance Hall',
    type: 'entrance',
    shape: 'rectangle',
    minWidth: 5,
    maxWidth: 7,
    minHeight: 5,
    maxHeight: 7,
    weight: 1,
    tags: ['safe', 'start', 'spawns'],
    description: 'A modest stone threshold providing safe entry into subterranean depths.',
    maxPerFloor: 1
  },
  {
    id: 'exit_sanctum',
    name: 'Exit Sanctum',
    type: 'exit',
    shape: 'circular',
    minWidth: 6,
    maxWidth: 9,
    minHeight: 6,
    maxHeight: 9,
    weight: 1,
    tags: ['portal', 'stairs_down', 'milestone'],
    description: 'An ancient archway housing descents into deeper dungeon strata.',
    maxPerFloor: 1
  },
  {
    id: 'combat_chamber',
    name: 'Combat Chamber',
    type: 'encounter',
    shape: 'rectangle',
    minWidth: 6,
    maxWidth: 10,
    minHeight: 6,
    maxHeight: 10,
    weight: 10,
    tags: ['hostile', 'tactical'],
    description: 'A standard subterranean room populated by roaming monsters and sentries.'
  },
  {
    id: 'pillared_arena',
    name: 'Pillared Arena',
    type: 'encounter',
    shape: 'pillared',
    minWidth: 8,
    maxWidth: 12,
    minHeight: 8,
    maxHeight: 12,
    weight: 6,
    tags: ['hostile', 'cover', 'tactical'],
    description: 'A grand hall lined with stone colonnades providing tactical line-of-sight cover.'
  },
  {
    id: 'treasure_vault',
    name: 'Treasure Vault',
    type: 'treasure',
    shape: 'rectangle',
    minWidth: 5,
    maxWidth: 7,
    minHeight: 5,
    maxHeight: 7,
    weight: 3,
    tags: ['loot', 'chests', 'rewards'],
    description: 'A secure alcove containing locked chests, gold urns, and relics.',
    maxPerFloor: 2
  },
  {
    id: 'mystic_shrine',
    name: 'Mystic Shrine',
    type: 'shrine',
    shape: 'circular',
    minWidth: 5,
    maxWidth: 8,
    minHeight: 5,
    maxHeight: 8,
    weight: 2,
    tags: ['divine', 'blessing', 'altar'],
    description: 'A hallowed sanctum with a glowing altar offering boons or trials.',
    maxPerFloor: 1
  },
  {
    id: 'dungeon_shop',
    name: 'Wandering Merchant Outpost',
    type: 'shop',
    shape: 'rectangle',
    minWidth: 6,
    maxWidth: 8,
    minHeight: 6,
    maxHeight: 8,
    weight: 2,
    tags: ['trade', 'safe', 'merchant'],
    description: 'A fortified stall where a fearless underworld trader peddles rare wares.',
    maxPerFloor: 1
  },
  {
    id: 'boss_throne',
    name: 'Boss Throne Room',
    type: 'boss',
    shape: 'pillared',
    minWidth: 10,
    maxWidth: 14,
    minHeight: 10,
    maxHeight: 14,
    weight: 1,
    tags: ['climax', 'boss', 'deadly'],
    description: 'A menacing high-ceiling arena where floor champions mount their stand.',
    maxPerFloor: 1
  },
  {
    id: 'secret_alcove',
    name: 'Secret Hidden Alcove',
    type: 'secret',
    shape: 'rectangle',
    minWidth: 4,
    maxWidth: 5,
    minHeight: 4,
    maxHeight: 5,
    weight: 1,
    tags: ['hidden', 'valuable', 'rare'],
    description: 'A concealed compartment masked behind illusionary brickwork.',
    maxPerFloor: 2
  },
  {
    id: 'corridor_hub',
    name: 'Intersection Hub',
    type: 'corridor_hub',
    shape: 'cross',
    minWidth: 5,
    maxWidth: 7,
    minHeight: 5,
    maxHeight: 7,
    weight: 4,
    tags: ['crossroad', 'transit'],
    description: 'A crossroads connecting multiple gallery corridors.'
  },
  {
    id: 'cavern_den',
    name: 'Underground Cavern Den',
    type: 'encounter',
    shape: 'cavern',
    minWidth: 7,
    maxWidth: 12,
    minHeight: 7,
    maxHeight: 12,
    weight: 5,
    tags: ['organic', 'cavern', 'uneven'],
    description: 'A naturally hollowed stone cavern with jagged perimeters.'
  }
];

/**
 * Singleton RoomRegistry managing data-driven room templates.
 * Conforms to Step 7 & Section 8 of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md).
 */
export class RoomRegistry {
  private static instance: RoomRegistry | null = null;
  private templates: Map<string, RoomTemplate> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): RoomRegistry {
    if (!RoomRegistry.instance) {
      RoomRegistry.instance = new RoomRegistry();
    }
    return RoomRegistry.instance;
  }

  /**
   * Resets registry to initial state (for clean test isolation)
   */
  public static resetInstance(): void {
    RoomRegistry.instance = null;
  }

  private registerDefaults(): void {
    for (const t of DEFAULT_ROOM_TEMPLATES) {
      this.register(t);
    }
  }

  /**
   * Registers a room template
   */
  public register(template: RoomTemplate): void {
    this.templates.set(template.id, { ...template });
  }

  /**
   * Batch registers multiple room templates
   */
  public registerMany(templates: RoomTemplate[]): void {
    for (const t of templates) {
      this.register(t);
    }
  }

  /**
   * Retrieves a template by ID
   */
  public get(id: string): RoomTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Checks whether a template ID exists
   */
  public has(id: string): boolean {
    return this.templates.has(id);
  }

  /**
   * Returns all registered templates
   */
  public getAll(): RoomTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Retrieves all templates of a specific room semantic type
   */
  public getByType(type: DungeonRoomType): RoomTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type);
  }

  /**
   * Retrieves all templates matching a specific tag
   */
  public getByTag(tag: string): RoomTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.tags && t.tags.includes(tag));
  }

  /**
   * Samples a random template of the specified type weighted by template weight
   */
  public getRandomByType(type: DungeonRoomType, rand: () => number = Math.random): RoomTemplate | undefined {
    const candidates = this.getByType(type);
    if (candidates.length === 0) return undefined;
    if (candidates.length === 1) return candidates[0];

    const totalWeight = candidates.reduce((sum, c) => sum + (c.weight || 1), 0);
    let roll = rand() * totalWeight;

    for (const candidate of candidates) {
      roll -= (candidate.weight || 1);
      if (roll <= 0) {
        return candidate;
      }
    }

    return candidates[candidates.length - 1];
  }

  /**
   * Samples concrete dimensions and shape based on a template
   */
  public sampleDimensions(
    templateId: string,
    rand: () => number = Math.random
  ): { width: number; height: number; shape: DungeonRoomShape } | undefined {
    const template = this.get(templateId);
    if (!template) return undefined;

    const widthSpan = template.maxWidth - template.minWidth;
    const heightSpan = template.maxHeight - template.minHeight;

    const width = template.minWidth + (widthSpan > 0 ? Math.floor(rand() * (widthSpan + 1)) : 0);
    const height = template.minHeight + (heightSpan > 0 ? Math.floor(rand() * (heightSpan + 1)) : 0);

    return {
      width,
      height,
      shape: template.shape
    };
  }

  /**
   * Total number of registered templates
   */
  public count(): number {
    return this.templates.size;
  }
}
