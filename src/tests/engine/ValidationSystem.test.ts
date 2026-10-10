/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContentRegistry,
  ContentValidator
} from '../../engine';
import { bootstrapGame } from '../../game';

describe('Roguelike Engine: Content Validation Tools (Step 9)', () => {
  beforeEach(() => {
    ContentRegistry.getInstance().resetAll();
  });

  it('validates default game content and reports clean status', () => {
    const content = ContentRegistry.getInstance();
    bootstrapGame(content);

    const report = ContentValidator.validateAll(content);
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.checkedCounts.enemies).toBeGreaterThan(0);
    expect(report.checkedCounts.items).toBeGreaterThan(0);
    expect(report.checkedCounts.weapons).toBeGreaterThan(0);

    const formatted = ContentValidator.formatReport(report);
    expect(formatted).toContain('PASSED');
    expect(formatted).toContain('0 errors');
  });

  describe('Detects Duplicate IDs', () => {
    it('detects duplicate enemy IDs', () => {
      const content = ContentRegistry.getInstance();
      content.enemies.register({
        id: 'dup_enemy',
        name: 'First Enemy',
        baseHp: 10,
        baseAtk: 2,
        baseDef: 0,
        speed: 1.0,
        range: 1
      });

      // Manually simulate duplicate entry in the map
      const issues = ContentValidator.validateEnemies({
        ...content,
        enemies: {
          ...content.enemies,
          getAll: () => [
            { id: 'dup_enemy', name: 'First Enemy', baseHp: 10, baseAtk: 2, baseDef: 0, speed: 1.0, range: 1 },
            { id: 'dup_enemy', name: 'Second Duplicate Enemy', baseHp: 15, baseAtk: 3, baseDef: 1, speed: 1.0, range: 1 }
          ]
        }
      } as any);

      const dupError = issues.find(i => i.code === 'DUPLICATE_ID');
      expect(dupError).toBeDefined();
      expect(dupError?.message).toContain('dup_enemy');
    });

    it('detects duplicate item IDs', () => {
      const issues = ContentValidator.validateItems({
        items: {
          getAll: () => [
            { id: 'dup_item', name: 'Item A', category: 'material', value: 10, description: 'Test' },
            { id: 'dup_item', name: 'Item B', category: 'material', value: 20, description: 'Test' }
          ]
        }
      } as any);

      const dupError = issues.find(i => i.code === 'DUPLICATE_ID');
      expect(dupError).toBeDefined();
      expect(dupError?.targetId).toBe('dup_item');
    });
  });

  describe('Detects Missing and Invalid Values', () => {
    it('detects missing name, non-positive HP, non-positive speed, and invalid range on enemies', () => {
      const issues = ContentValidator.validateEnemies({
        aiStrategies: { has: () => true },
        abilities: { has: () => true },
        items: { has: () => true },
        enemies: {
          getAll: () => [
            {
              id: 'broken_enemy',
              name: '', // missing
              baseHp: 0, // invalid <= 0
              baseAtk: -5, // invalid < 0
              speed: 0, // invalid <= 0
              range: 0 // invalid < 1
            }
          ]
        }
      } as any);

      expect(issues.some(i => i.field === 'name')).toBe(true);
      expect(issues.some(i => i.field === 'baseHp')).toBe(true);
      expect(issues.some(i => i.field === 'baseAtk')).toBe(true);
      expect(issues.some(i => i.field === 'speed')).toBe(true);
      expect(issues.some(i => i.field === 'range')).toBe(true);
    });

    it('detects missing fields and invalid bounds on weapons', () => {
      const issues = ContentValidator.validateWeapons({
        weapons: {
          getAll: () => [
            {
              baseType: 'BrokenWep',
              name: '',
              baseDamage: 0,
              range: 0,
              baseCrit: 1.5 // > 1.0
            }
          ]
        }
      } as any);

      expect(issues.some(i => i.code === 'MISSING_FIELD')).toBe(true);
      expect(issues.some(i => i.code === 'INVALID_VALUE' && i.field === 'baseDamage')).toBe(true);
      expect(issues.some(i => i.code === 'INVALID_RANGE')).toBe(true);
      expect(issues.some(i => i.code === 'INVALID_VALUE' && i.field === 'baseCrit')).toBe(true);
    });
  });

  describe('Detects Invalid AI Roles', () => {
    it('catches unknown AI roles not registered in AIStrategyRegistry', () => {
      const content = ContentRegistry.getInstance();
      content.enemies.register({
        id: 'alien_sorcerer',
        name: 'Alien Sorcerer',
        baseHp: 20,
        baseAtk: 4,
        baseDef: 1,
        speed: 1.0,
        range: 3,
        aiRole: 'nonexistent_space_wizard' as any
      });

      const issues = ContentValidator.validateEnemies(content);
      const aiError = issues.find(i => i.targetId === 'alien_sorcerer' && i.code === 'INVALID_AI_ROLE');
      expect(aiError).toBeDefined();
      expect(aiError?.message).toContain('nonexistent_space_wizard');
    });
  });

  describe('Detects Invalid Abilities and Broken Effect References', () => {
    it('catches enemies referencing non-existent abilities', () => {
      const content = ContentRegistry.getInstance();
      content.enemies.register({
        id: 'super_boss',
        name: 'Super Boss',
        baseHp: 100,
        baseAtk: 10,
        baseDef: 5,
        speed: 1.0,
        range: 1,
        abilities: ['hyper_beam_omega_blast']
      });

      const issues = ContentValidator.validateEnemies(content);
      const abilityError = issues.find(i => i.targetId === 'super_boss' && i.code === 'INVALID_ABILITY');
      expect(abilityError).toBeDefined();
      expect(abilityError?.message).toContain('hyper_beam_omega_blast');
    });

    it('catches abilities referencing unknown status effect IDs', () => {
      const content = ContentRegistry.getInstance();
      content.abilities.register({
        id: 'curse_spell',
        name: 'Curse Spell',
        type: 'attack',
        targetType: 'single_enemy',
        range: 4,
        cooldown: 3,
        effectId: 'mythical_petrify_curse' // Does not exist in EffectRegistry
      });

      const issues = ContentValidator.validateAbilities(content);
      const effectError = issues.find(i => i.targetId === 'curse_spell' && i.code === 'INVALID_EFFECT');
      expect(effectError).toBeDefined();
      expect(effectError?.message).toContain('mythical_petrify_curse');
    });

    it('catches abilities summoning unknown entities', () => {
      const content = ContentRegistry.getInstance();
      content.abilities.register({
        id: 'summon_dragon',
        name: 'Summon Great Wyrm',
        type: 'summon',
        targetType: 'self',
        range: 0,
        cooldown: 10,
        summonEntityId: 'UnknownAncientGoldDragon' // Not in EnemyRegistry or EntityRegistry
      });

      const issues = ContentValidator.validateAbilities(content);
      const summonError = issues.find(i => i.targetId === 'summon_dragon' && i.code === 'BROKEN_REFERENCE');
      expect(summonError).toBeDefined();
      expect(summonError?.message).toContain('UnknownAncientGoldDragon');
    });
  });

  describe('Detects Invalid Spawn Tables', () => {
    it('detects spawn tables referencing non-existent enemies', () => {
      const content = ContentRegistry.getInstance();
      content.spawnTables.register({
        id: 'broken_table',
        name: 'Broken Table',
        entries: [
          { enemyId: 'PhantomNonExistentGhost', weight: 50 }
        ]
      });

      const issues = ContentValidator.validateSpawnTables(content);
      const brokenRef = issues.find(i => i.targetId === 'broken_table' && i.code === 'BROKEN_REFERENCE');
      expect(brokenRef).toBeDefined();
      expect(brokenRef?.message).toContain('PhantomNonExistentGhost');
    });

    it('detects non-positive weights and inverted depth parameters in spawn tables', () => {
      const content = ContentRegistry.getInstance();
      content.enemies.register({
        id: 'ValidGoblin',
        name: 'Valid Goblin',
        baseHp: 10,
        baseAtk: 2,
        baseDef: 0,
        speed: 1.0,
        range: 1
      });

      content.spawnTables.register({
        id: 'invalid_params_table',
        name: 'Invalid Params Table',
        entries: [
          { enemyId: 'ValidGoblin', weight: -10 },
          { enemyId: 'ValidGoblin', weight: 20, minDepth: 5, maxDepth: 2 } // min > max
        ]
      });

      const issues = ContentValidator.validateSpawnTables(content);
      expect(issues.some(i => i.message.includes('non-positive weight'))).toBe(true);
      expect(issues.some(i => i.message.includes('minDepth (5) > maxDepth (2)'))).toBe(true);
    });
  });

  describe('Detects Invalid Room Templates', () => {
    it('catches room templates with minWidth > maxWidth or dimensions < 3', () => {
      const content = ContentRegistry.getInstance();
      content.rooms.register({
        id: 'impossible_room',
        name: 'Impossible Room',
        type: 'standard',
        shape: 'rectangle',
        minWidth: 15,
        maxWidth: 5, // inverted
        minHeight: 1, // < 3
        maxHeight: 2,
        weight: 1
      });

      const issues = ContentValidator.validateRooms(content);
      expect(issues.some(i => i.code === 'INVALID_DIMENSIONS')).toBe(true);
    });
  });
});
