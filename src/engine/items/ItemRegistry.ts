/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemDefinition, ItemCategory, ItemRarity, CreateItemOptions } from './types';
import materialsJson from '../../data/materials.json';
import catalystsJson from '../../data/catalysts.json';
import relicsJson from '../../data/relics.json';
import spellScrollsJson from '../../data/spellScrolls.json';

/**
 * Standard baseline consumable definitions for roguelike play
 */
const DEFAULT_CONSUMABLES: ItemDefinition[] = [
  {
    id: 'potion_healing',
    name: 'Health Potion',
    category: 'consumable',
    description: 'A crimson flask restoring vital bodily health.',
    rarity: 'common',
    value: 25,
    stackable: true,
    maxStack: 20,
    icon: '🧪',
    color: '#ef4444',
    tags: ['heal', 'vitality', 'potion'],
    stats: { hpRestore: 30 }
  },
  {
    id: 'potion_mana',
    name: 'Mana Draft',
    category: 'consumable',
    description: 'A luminescent azure tincture replenishing magical reserves.',
    rarity: 'common',
    value: 30,
    stackable: true,
    maxStack: 20,
    icon: '🧪',
    color: '#3b82f6',
    tags: ['mana', 'magic', 'potion'],
    stats: { mpRestore: 25 }
  },
  {
    id: 'ration_bread',
    name: 'Travel Bread',
    category: 'consumable',
    description: 'Hearty baked travel ration staving off exhaustion.',
    rarity: 'common',
    value: 10,
    stackable: true,
    maxStack: 50,
    icon: '🍞',
    color: '#d97706',
    tags: ['food', 'survival'],
    stats: { hpRestore: 12 }
  },
  {
    id: 'remedy_antidote',
    name: 'Herbal Antidote',
    category: 'consumable',
    description: 'Neutralizes venoms, toxins, and venomous blood.',
    rarity: 'uncommon',
    value: 35,
    stackable: true,
    maxStack: 20,
    icon: '🌿',
    color: '#10b981',
    tags: ['cure', 'cleanse', 'herbal'],
    stats: { hpRestore: 10 }
  },
  {
    id: 'key_rusty_iron',
    name: 'Rusty Iron Key',
    category: 'key',
    description: 'A heavy iron key capable of opening locked dungeon grates.',
    rarity: 'common',
    value: 15,
    stackable: true,
    maxStack: 10,
    icon: '🗝️',
    color: '#78716c',
    tags: ['key', 'utility']
  }
];

/**
 * Singleton ItemRegistry providing data-driven item definitions.
 * Conforms to Step 7 & Section 8 of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md).
 */
export class ItemRegistry {
  private static instance: ItemRegistry | null = null;
  private items: Map<string, ItemDefinition> = new Map();
  private initialized = false;

  private constructor() {
    this.initFromCatalog();
  }

  public static getInstance(): ItemRegistry {
    if (!ItemRegistry.instance) {
      ItemRegistry.instance = new ItemRegistry();
    }
    return ItemRegistry.instance;
  }

  /**
   * Resets registry instance (for testing isolation)
   */
  public static resetInstance(): void {
    ItemRegistry.instance = null;
  }

  /**
   * Loads all catalogs into standard ItemDefinition structures
   */
  public initFromCatalog(): void {
    if (this.initialized) return;

    // 1. Load consumables and baseline keys
    for (const consumable of DEFAULT_CONSUMABLES) {
      this.register(consumable);
    }

    // 2. Load materials
    if (Array.isArray(materialsJson)) {
      for (const mat of materialsJson as any[]) {
        let rarity: ItemRarity = 'common';
        if (mat.category === 'Tier2') rarity = 'rare';
        if (mat.category === 'Tier3') rarity = 'legendary';

        this.register({
          id: mat.id,
          name: mat.name,
          category: 'material',
          description: mat.description || 'Crafting material.',
          rarity,
          value: mat.category === 'Tier3' ? 80 : mat.category === 'Tier2' ? 40 : 15,
          color: mat.color || '#9ca3af',
          icon: '⛏️',
          stackable: true,
          tags: ['crafting', 'material', (mat.category || '').toLowerCase()],
          stats: {
            atk: mat.baseDamageMod,
            critChance: mat.critMod,
            speedMod: mat.speedMod
          },
          customData: mat
        });
      }
    }

    // 3. Load catalysts
    if (Array.isArray(catalystsJson)) {
      for (const cat of catalystsJson as any[]) {
        this.register({
          id: cat.id,
          name: cat.name,
          category: 'catalyst',
          description: cat.description || 'Elemental infusion catalyst.',
          rarity: 'rare',
          value: 60,
          color: cat.color || '#f97316',
          icon: '✨',
          stackable: true,
          tags: ['crafting', 'catalyst', 'infusion', (cat.type || '').toLowerCase()],
          stats: {
            element: cat.type,
            statusChance: cat.statusEffectChance,
            statusDuration: cat.statusDuration
          },
          customData: cat
        });
      }
    }

    // 4. Load relics
    if (Array.isArray(relicsJson)) {
      for (const relic of relicsJson as any[]) {
        this.register({
          id: relic.id,
          name: relic.name,
          category: 'relic',
          description: relic.description || 'Sanctum relic offering sacred boons.',
          rarity: relic.tier === 3 ? 'legendary' : relic.tier === 2 ? 'epic' : 'rare',
          value: relic.goldCost || (relic.tier ? relic.tier * 75 : 100),
          color: relic.color || '#eab308',
          icon: relic.icon || '🏺',
          stackable: false,
          tags: ['relic', 'passive', 'sanctum'],
          customData: relic
        });
      }
    }

    // 5. Load spell scrolls
    if (Array.isArray(spellScrollsJson)) {
      for (const scroll of spellScrollsJson as any[]) {
        this.register({
          id: scroll.id,
          name: scroll.name,
          category: 'scroll',
          description: scroll.description || 'An enchanted spell scroll.',
          rarity: scroll.tier >= 3 ? 'epic' : scroll.tier === 2 ? 'rare' : 'uncommon',
          value: scroll.value || 80,
          color: scroll.color || '#a855f7',
          icon: '📜',
          stackable: true,
          tags: ['scroll', 'magic', 'spell', (scroll.element || '').toLowerCase()],
          stats: {
            manaCost: scroll.mpCost,
            basePower: scroll.baseDamage
          },
          customData: scroll
        });
      }
    }

    this.initialized = true;
  }

  /**
   * Registers or updates an item definition
   */
  public register(item: ItemDefinition): void {
    this.items.set(item.id, { ...item });
  }

  /**
   * Batch registers multiple item definitions
   */
  public registerMany(items: ItemDefinition[]): void {
    for (const item of items) {
      this.register(item);
    }
  }

  /**
   * Retrieves an item definition by ID
   */
  public get(id: string): ItemDefinition | undefined {
    return this.items.get(id);
  }

  /**
   * Checks if an item ID exists
   */
  public has(id: string): boolean {
    return this.items.has(id);
  }

  /**
   * Returns all registered item definitions
   */
  public getAll(): ItemDefinition[] {
    return Array.from(this.items.values());
  }

  /**
   * Retrieves items filtered by category
   */
  public getByCategory(category: ItemCategory): ItemDefinition[] {
    return Array.from(this.items.values()).filter(i => i.category === category);
  }

  /**
   * Retrieves items matching a specific tag
   */
  public getByTag(tag: string): ItemDefinition[] {
    return Array.from(this.items.values()).filter(i => i.tags && i.tags.includes(tag));
  }

  /**
   * Retrieves items filtered by rarity tier
   */
  public getByRarity(rarity: ItemRarity): ItemDefinition[] {
    return Array.from(this.items.values()).filter(i => i.rarity === rarity);
  }

  /**
   * General search query matching arbitrary predicates
   */
  public find(predicate: (item: ItemDefinition) => boolean): ItemDefinition[] {
    return Array.from(this.items.values()).filter(predicate);
  }

  /**
   * Instantiates an item definition with optional runtime overrides
   */
  public createItem(id: string, options?: CreateItemOptions): ItemDefinition {
    const base = this.get(id);
    if (!base) {
      throw new Error(`ItemRegistry: cannot instantiate unknown item ID "${id}"`);
    }

    return {
      ...base,
      rarity: options?.rarity ?? base.rarity,
      ...options?.overrides
    };
  }

  /**
   * Total number of registered items
   */
  public count(): number {
    return this.items.size;
  }
}
