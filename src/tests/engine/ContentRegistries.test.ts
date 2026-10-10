/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ItemRegistry,
  WeaponRegistry,
  RoomRegistry,
  ContentRegistry,
  ItemDefinition,
  WeaponTemplate,
  RoomTemplate
} from '../../engine';

describe('Roguelike Engine: Content Registries (Step 7)', () => {
  beforeEach(() => {
    ContentRegistry.getInstance().resetAll();
  });

  describe('ItemRegistry', () => {
    it('initializes automatically from JSON catalogs and default consumables', () => {
      const registry = ItemRegistry.getInstance();
      expect(registry.count()).toBeGreaterThan(20);

      // Verify materials loaded
      expect(registry.has('mat_iron')).toBe(true);
      const iron = registry.get('mat_iron');
      expect(iron?.category).toBe('material');
      expect(iron?.name).toBe('Tempered Iron');

      // Verify catalysts loaded
      expect(registry.has('cat_fire')).toBe(true);
      const fireCat = registry.get('cat_fire');
      expect(fireCat?.category).toBe('catalyst');

      // Verify consumables loaded
      expect(registry.has('potion_healing')).toBe(true);
      const hpPot = registry.get('potion_healing');
      expect(hpPot?.category).toBe('consumable');
      expect(hpPot?.stats?.hpRestore).toBe(30);

      // Verify relics loaded
      const relics = registry.getByCategory('relic');
      expect(relics.length).toBeGreaterThan(0);

      // Verify scrolls loaded
      const scrolls = registry.getByCategory('scroll');
      expect(scrolls.length).toBeGreaterThan(0);
    });

    it('allows registering and retrieving custom items', () => {
      const registry = ItemRegistry.getInstance();
      const customRing: ItemDefinition = {
        id: 'ring_of_flames',
        name: 'Ring of Eternal Flames',
        category: 'misc',
        description: 'A glowing ruby band radiating heat.',
        rarity: 'epic',
        value: 250,
        tags: ['ring', 'jewelry', 'fire'],
        stats: { atk: 4 }
      };

      registry.register(customRing);
      expect(registry.has('ring_of_flames')).toBe(true);
      expect(registry.get('ring_of_flames')?.name).toBe('Ring of Eternal Flames');

      const fireTagged = registry.getByTag('fire');
      expect(fireTagged.some(i => i.id === 'ring_of_flames')).toBe(true);
    });

    it('filters items by category, tag, and rarity', () => {
      const registry = ItemRegistry.getInstance();
      const materials = registry.getByCategory('material');
      expect(materials.length).toBeGreaterThan(0);
      expect(materials.every(m => m.category === 'material')).toBe(true);

      const rareItems = registry.getByRarity('rare');
      expect(rareItems.length).toBeGreaterThan(0);
      expect(rareItems.every(r => r.rarity === 'rare')).toBe(true);
    });

    it('instantiates runtime items with overrides and handles errors', () => {
      const registry = ItemRegistry.getInstance();
      const instance = registry.createItem('potion_healing', {
        overrides: { value: 100 }
      });

      expect(instance.id).toBe('potion_healing');
      expect(instance.value).toBe(100);
      expect(instance.stats?.hpRestore).toBe(30);

      expect(() => {
        registry.createItem('unknown_nonexistent_item_id');
      }).toThrow();
    });
  });

  describe('WeaponRegistry', () => {
    it('initializes default weapon templates from weaponTemplates.json', () => {
      const weapons = WeaponRegistry.getInstance();
      expect(weapons.count()).toBeGreaterThanOrEqual(5);

      expect(weapons.has('Sword')).toBe(true);
      expect(weapons.has('Bow')).toBe(true);
      expect(weapons.has('Spear')).toBe(true);

      const sword = weapons.get('Sword');
      expect(sword?.baseDamage).toBeGreaterThan(0);
      expect(sword?.range).toBe(1);

      const bow = weapons.get('Bow');
      expect(bow?.range).toBeGreaterThanOrEqual(3);
    });

    it('filters weapons by range and handedness', () => {
      const weapons = WeaponRegistry.getInstance();
      const meleeWeapons = weapons.getByRange(1, 1);
      expect(meleeWeapons.length).toBeGreaterThan(0);
      expect(meleeWeapons.every(w => w.range === 1)).toBe(true);

      const rangedWeapons = weapons.getByRange(2);
      expect(rangedWeapons.length).toBeGreaterThan(0);
      expect(rangedWeapons.every(w => w.range >= 2)).toBe(true);

      const twoHanded = weapons.getByHandedness(true);
      expect(twoHanded.length).toBeGreaterThan(0);
      expect(twoHanded.every(w => w.isTwoHanded === true)).toBe(true);
    });

    it('crafts customized weapon instances with material and catalyst attributes', () => {
      const weapons = WeaponRegistry.getInstance();
      const crafted = weapons.createCraftedWeapon({
        baseType: 'Sword',
        name: 'Mithril Sunblade',
        material: {
          id: 'mat_custom_mithril',
          name: 'Sun Mithril',
          description: 'Radiant metal.',
          category: 'Rare' as any,
          color: '#fbbf24',
          baseDamageMod: 5,
          critMod: 0.15,
          speedMod: 1.2
        },
        catalyst: {
          id: 'cat_custom_sun',
          name: 'Solar Flare Core',
          description: 'Burns radiant holy flame.',
          type: 'Fire' as any,
          color: '#f59e0b',
          damageType: 'Holy Fire',
          statusEffectChance: 0.5,
          statusDuration: 3
        }
      });

      expect(crafted.name).toBe('Mithril Sunblade');
      expect(crafted.baseType).toBe('Sword');
      expect(crafted.damage).toBeGreaterThan(5);
      expect(crafted.critChance).toBeGreaterThan(0.1);
      expect(crafted.materialUsed.name).toBe('Sun Mithril');
      expect(crafted.catalystUsed.name).toBe('Solar Flare Core');
    });

    it('registers custom weapon templates', () => {
      const weapons = WeaponRegistry.getInstance();
      const scythe: WeaponTemplate = {
        baseType: 'Scythe' as any,
        name: 'Reaper Scythe',
        description: 'Sweeping curved blade harvesting souls.',
        baseDamage: 9,
        baseCrit: 0.2,
        range: 1,
        manaCost: 0,
        icon: '🪓',
        isTwoHanded: true
      };

      weapons.register(scythe);
      expect(weapons.has('Scythe')).toBe(true);
      expect(weapons.get('Scythe')?.baseDamage).toBe(9);
    });
  });

  describe('RoomRegistry', () => {
    it('initializes default semantic room templates', () => {
      const rooms = RoomRegistry.getInstance();
      expect(rooms.count()).toBeGreaterThanOrEqual(8);

      expect(rooms.has('entrance_hall')).toBe(true);
      expect(rooms.has('exit_sanctum')).toBe(true);
      expect(rooms.has('combat_chamber')).toBe(true);
      expect(rooms.has('treasure_vault')).toBe(true);
      expect(rooms.has('boss_throne')).toBe(true);
      expect(rooms.has('mystic_shrine')).toBe(true);
    });

    it('queries templates by semantic type and tags', () => {
      const rooms = RoomRegistry.getInstance();
      const encounters = rooms.getByType('encounter');
      expect(encounters.length).toBeGreaterThan(0);
      expect(encounters.every(r => r.type === 'encounter')).toBe(true);

      const hostileRooms = rooms.getByTag('hostile');
      expect(hostileRooms.length).toBeGreaterThan(0);

      const safeRooms = rooms.getByTag('safe');
      expect(safeRooms.length).toBeGreaterThan(0);
    });

    it('samples random room templates with weights', () => {
      const rooms = RoomRegistry.getInstance();
      const sampled = rooms.getRandomByType('encounter');
      expect(sampled).toBeDefined();
      expect(sampled?.type).toBe('encounter');
    });

    it('samples concrete room dimensions within bounded min/max constraints', () => {
      const rooms = RoomRegistry.getInstance();
      const dims = rooms.sampleDimensions('combat_chamber');
      expect(dims).toBeDefined();

      const template = rooms.get('combat_chamber')!;
      expect(dims!.width).toBeGreaterThanOrEqual(template.minWidth);
      expect(dims!.width).toBeLessThanOrEqual(template.maxWidth);
      expect(dims!.height).toBeGreaterThanOrEqual(template.minHeight);
      expect(dims!.height).toBeLessThanOrEqual(template.maxHeight);
      expect(dims!.shape).toBe(template.shape);
    });

    it('allows registering custom room templates', () => {
      const rooms = RoomRegistry.getInstance();
      const customRoom: RoomTemplate = {
        id: 'lava_forge_chamber',
        name: 'Molten Lava Forge',
        type: 'treasure',
        shape: 'pillared',
        minWidth: 8,
        maxWidth: 12,
        minHeight: 8,
        maxHeight: 12,
        weight: 2,
        tags: ['forge', 'fire', 'anvil']
      };

      rooms.register(customRoom);
      expect(rooms.has('lava_forge_chamber')).toBe(true);
      expect(rooms.get('lava_forge_chamber')?.name).toBe('Molten Lava Forge');
    });
  });

  describe('ContentRegistry Master Coordinator', () => {
    it('provides unified access to all 8 core roguelike registries', () => {
      const master = ContentRegistry.getInstance();

      // 1. Enemies
      expect(master.enemies).toBeDefined();
      expect(master.enemies.getAll().length).toBeGreaterThan(0);

      // 2. Items
      expect(master.items).toBeDefined();
      expect(master.items.count()).toBeGreaterThan(0);

      // 3. Weapons
      expect(master.weapons).toBeDefined();
      expect(master.weapons.count()).toBeGreaterThan(0);

      // 4. Abilities
      expect(master.abilities).toBeDefined();
      expect(master.abilities.getAll().length).toBeGreaterThan(0);

      // 5. Effects
      expect(master.effects).toBeDefined();
      expect(master.effects.getAll().length).toBeGreaterThan(0);

      // 6. Rooms
      expect(master.rooms).toBeDefined();
      expect(master.rooms.count()).toBeGreaterThan(0);

      // 7. Generators
      expect(master.generators).toBeDefined();
      expect(master.generators.getAll().length).toBeGreaterThan(0);

      // 8. AI Strategies
      expect(master.aiStrategies).toBeDefined();
      expect(master.aiStrategies.getAll().length).toBeGreaterThan(0);

      // 9. Generic Entities
      expect(master.entities).toBeDefined();
      expect(master.entities.count()).toBeGreaterThan(0);
    });

    it('computes accurate content summary counts across the entire engine', () => {
      const master = ContentRegistry.getInstance();
      master.initAll();

      const summary = master.getSummary();
      expect(summary.enemies).toBeGreaterThan(0);
      expect(summary.items).toBeGreaterThan(0);
      expect(summary.weapons).toBeGreaterThan(0);
      expect(summary.abilities).toBeGreaterThan(0);
      expect(summary.effects).toBeGreaterThan(0);
      expect(summary.rooms).toBeGreaterThan(0);
      expect(summary.generators).toBeGreaterThan(0);
      expect(summary.aiStrategies).toBeGreaterThan(0);
      expect(summary.entities).toBeGreaterThan(0);
      expect(summary.total).toBe(
        summary.enemies +
        summary.items +
        summary.weapons +
        summary.abilities +
        summary.effects +
        summary.rooms +
        summary.generators +
        summary.aiStrategies +
        summary.entities
      );
    });

    it('performs validation across content registries and returns clean validation status', () => {
      const master = ContentRegistry.getInstance();
      master.initAll();

      const validation = master.validateContent();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('detects broken parameters in content validation', () => {
      const master = ContentRegistry.getInstance();
      master.rooms.register({
        id: 'broken_room',
        name: 'Broken Dimensions Room',
        type: 'standard',
        shape: 'rectangle',
        minWidth: 20,
        maxWidth: 10, // Invalid: min > max
        minHeight: 5,
        maxHeight: 10,
        weight: 1
      });

      const validation = master.validateContent();
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('broken_room'))).toBe(true);
    });
  });
});
