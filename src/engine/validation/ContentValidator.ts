/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentRegistry } from '../registry/ContentRegistry';
import { ValidationIssue, ValidationReport } from './types';

/**
 * Sovereign Content Validator Engine.
 * Conforms to Step 9 & Section 10 of ROGUELIKE ENGINE ROADMAP (ENGINEPLAN.md):
 * "Add automatic validation for content.
 *  Detect things like:
 *  - duplicate IDs
 *  - missing values
 *  - invalid AI roles
 *  - invalid abilities
 *  - broken references
 *  - invalid spawn tables
 *  Bad content should produce clear errors."
 */
export class ContentValidator {
  /**
   * Performs an exhaustive content validation across all registries
   */
  public static validateAll(content: ContentRegistry = ContentRegistry.getInstance()): ValidationReport {
    const issues: ValidationIssue[] = [];

    const checkedCounts: Record<string, number> = {
      enemies: content.enemies.getAll().length,
      items: content.items.count(),
      weapons: content.weapons.count(),
      abilities: content.abilities.getAll().length,
      effects: content.effects.getAll().length,
      rooms: content.rooms.count(),
      spawnTables: content.spawnTables.getAll().length
    };

    issues.push(...this.validateEnemies(content));
    issues.push(...this.validateItems(content));
    issues.push(...this.validateWeapons(content));
    issues.push(...this.validateAbilities(content));
    issues.push(...this.validateEffects(content));
    issues.push(...this.validateRooms(content));
    issues.push(...this.validateSpawnTables(content));

    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checkedCounts,
      timestamp: Date.now()
    };
  }

  /**
   * Validates enemies catalog
   */
  public static validateEnemies(content: ContentRegistry): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const enemies = content.enemies.getAll();
    const seenIds = new Set<string>();

    for (const enemy of enemies) {
      // 1. Duplicate IDs
      if (seenIds.has(enemy.id)) {
        issues.push({
          severity: 'error',
          category: 'enemies',
          code: 'DUPLICATE_ID',
          targetId: enemy.id,
          message: `Duplicate enemy ID "${enemy.id}" detected.`
        });
      }
      seenIds.add(enemy.id);

      // 2. Missing required fields
      if (!enemy.name || enemy.name.trim() === '') {
        issues.push({
          severity: 'error',
          category: 'enemies',
          code: 'MISSING_FIELD',
          targetId: enemy.id,
          field: 'name',
          message: `Enemy "${enemy.id}" is missing a valid name.`
        });
      }

      if (enemy.baseHp === undefined || enemy.baseHp <= 0) {
        issues.push({
          severity: 'error',
          category: 'enemies',
          code: 'INVALID_VALUE',
          targetId: enemy.id,
          field: 'baseHp',
          message: `Enemy "${enemy.id}" has invalid baseHp (${enemy.baseHp}). Must be > 0.`
        });
      }

      if (enemy.baseAtk === undefined || enemy.baseAtk < 0) {
        issues.push({
          severity: 'error',
          category: 'enemies',
          code: 'INVALID_VALUE',
          targetId: enemy.id,
          field: 'baseAtk',
          message: `Enemy "${enemy.id}" has invalid baseAtk (${enemy.baseAtk}). Cannot be negative.`
        });
      }

      if (enemy.speed === undefined || enemy.speed <= 0) {
        issues.push({
          severity: 'error',
          category: 'enemies',
          code: 'INVALID_VALUE',
          targetId: enemy.id,
          field: 'speed',
          message: `Enemy "${enemy.id}" has invalid speed (${enemy.speed}). Must be > 0.`
        });
      }

      if (enemy.range === undefined || enemy.range < 1) {
        issues.push({
          severity: 'error',
          category: 'enemies',
          code: 'INVALID_VALUE',
          targetId: enemy.id,
          field: 'range',
          message: `Enemy "${enemy.id}" has invalid attack range (${enemy.range}). Must be >= 1.`
        });
      }

      // 3. Invalid AI Roles
      if (enemy.aiRole) {
        if (!content.aiStrategies.has(enemy.aiRole)) {
          issues.push({
            severity: 'error',
            category: 'enemies',
            code: 'INVALID_AI_ROLE',
            targetId: enemy.id,
            field: 'aiRole',
            message: `Enemy "${enemy.id}" specifies unknown AI role "${enemy.aiRole}". No matching strategy in AIStrategyRegistry.`
          });
        }
      }

      // 4. Invalid Abilities
      if (enemy.abilities && Array.isArray(enemy.abilities)) {
        for (const abilityId of enemy.abilities) {
          if (!content.abilities.has(abilityId)) {
            issues.push({
              severity: 'error',
              category: 'enemies',
              code: 'INVALID_ABILITY',
              targetId: enemy.id,
              field: 'abilities',
              details: { abilityId },
              message: `Enemy "${enemy.id}" references unknown ability "${abilityId}". Not found in AbilityRegistry.`
            });
          }
        }
      }

      // 5. Broken Material Drops
      if (enemy.dropMaterials && Array.isArray(enemy.dropMaterials)) {
        for (const matId of enemy.dropMaterials) {
          if (!content.items.has(matId)) {
            issues.push({
              severity: 'warning',
              category: 'crossReference',
              code: 'BROKEN_REFERENCE',
              targetId: enemy.id,
              field: 'dropMaterials',
              details: { materialId: matId },
              message: `Enemy "${enemy.id}" drops unknown material "${matId}". Not found in ItemRegistry.`
            });
          }
        }
      }

      // 6. Broken Catalyst Drops
      if (enemy.dropCatalysts && Array.isArray(enemy.dropCatalysts)) {
        for (const catId of enemy.dropCatalysts) {
          if (!content.items.has(catId)) {
            issues.push({
              severity: 'warning',
              category: 'crossReference',
              code: 'BROKEN_REFERENCE',
              targetId: enemy.id,
              field: 'dropCatalysts',
              details: { catalystId: catId },
              message: `Enemy "${enemy.id}" drops unknown catalyst "${catId}". Not found in ItemRegistry.`
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Validates items catalog
   */
  public static validateItems(content: ContentRegistry): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const items = content.items.getAll();
    const seenIds = new Set<string>();

    for (const item of items) {
      // 1. Duplicate IDs
      if (seenIds.has(item.id)) {
        issues.push({
          severity: 'error',
          category: 'items',
          code: 'DUPLICATE_ID',
          targetId: item.id,
          message: `Duplicate item ID "${item.id}" detected.`
        });
      }
      seenIds.add(item.id);

      // 2. Missing fields
      if (!item.name || item.name.trim() === '') {
        issues.push({
          severity: 'error',
          category: 'items',
          code: 'MISSING_FIELD',
          targetId: item.id,
          field: 'name',
          message: `Item "${item.id}" is missing a valid name.`
        });
      }

      if (!item.category) {
        issues.push({
          severity: 'error',
          category: 'items',
          code: 'MISSING_FIELD',
          targetId: item.id,
          field: 'category',
          message: `Item "${item.id}" is missing a category classification.`
        });
      }

      if (item.value !== undefined && item.value < 0) {
        issues.push({
          severity: 'error',
          category: 'items',
          code: 'INVALID_VALUE',
          targetId: item.id,
          field: 'value',
          message: `Item "${item.id}" has negative gold value (${item.value}).`
        });
      }
    }

    return issues;
  }

  /**
   * Validates weapon templates
   */
  public static validateWeapons(content: ContentRegistry): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const weapons = content.weapons.getAll();
    const seenTypes = new Set<string>();

    for (const weapon of weapons) {
      if (seenTypes.has(weapon.baseType)) {
        issues.push({
          severity: 'error',
          category: 'weapons',
          code: 'DUPLICATE_ID',
          targetId: weapon.baseType,
          message: `Duplicate weapon baseType "${weapon.baseType}" registered.`
        });
      }
      seenTypes.add(weapon.baseType);

      if (!weapon.name) {
        issues.push({
          severity: 'error',
          category: 'weapons',
          code: 'MISSING_FIELD',
          targetId: weapon.baseType,
          field: 'name',
          message: `Weapon "${weapon.baseType}" is missing a name.`
        });
      }

      if (weapon.baseDamage === undefined || weapon.baseDamage <= 0) {
        issues.push({
          severity: 'error',
          category: 'weapons',
          code: 'INVALID_VALUE',
          targetId: weapon.baseType,
          field: 'baseDamage',
          message: `Weapon "${weapon.baseType}" has invalid baseDamage (${weapon.baseDamage}). Must be > 0.`
        });
      }

      if (weapon.range === undefined || weapon.range < 1) {
        issues.push({
          severity: 'error',
          category: 'weapons',
          code: 'INVALID_RANGE',
          targetId: weapon.baseType,
          field: 'range',
          message: `Weapon "${weapon.baseType}" has invalid range (${weapon.range}). Must be >= 1.`
        });
      }

      if (weapon.baseCrit !== undefined && (weapon.baseCrit < 0 || weapon.baseCrit > 1)) {
        issues.push({
          severity: 'error',
          category: 'weapons',
          code: 'INVALID_VALUE',
          targetId: weapon.baseType,
          field: 'baseCrit',
          message: `Weapon "${weapon.baseType}" has invalid baseCrit (${weapon.baseCrit}). Must be between 0.0 and 1.0.`
        });
      }
    }

    return issues;
  }

  /**
   * Validates abilities catalog
   */
  public static validateAbilities(content: ContentRegistry): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const abilities = content.abilities.getAll();
    const seenIds = new Set<string>();

    for (const ability of abilities) {
      if (seenIds.has(ability.id)) {
        issues.push({
          severity: 'error',
          category: 'abilities',
          code: 'DUPLICATE_ID',
          targetId: ability.id,
          message: `Duplicate ability ID "${ability.id}" registered.`
        });
      }
      seenIds.add(ability.id);

      if (!ability.name) {
        issues.push({
          severity: 'error',
          category: 'abilities',
          code: 'MISSING_FIELD',
          targetId: ability.id,
          field: 'name',
          message: `Ability "${ability.id}" is missing a name.`
        });
      }

      if (ability.range < 0) {
        issues.push({
          severity: 'error',
          category: 'abilities',
          code: 'INVALID_RANGE',
          targetId: ability.id,
          field: 'range',
          message: `Ability "${ability.id}" has negative range (${ability.range}).`
        });
      }

      if (ability.cooldown < 0) {
        issues.push({
          severity: 'error',
          category: 'abilities',
          code: 'INVALID_VALUE',
          targetId: ability.id,
          field: 'cooldown',
          message: `Ability "${ability.id}" has negative cooldown (${ability.cooldown}).`
        });
      }

      // Check effect references
      if (ability.effectId && !content.effects.has(ability.effectId)) {
        issues.push({
          severity: 'error',
          category: 'abilities',
          code: 'INVALID_EFFECT',
          targetId: ability.id,
          field: 'effectId',
          details: { effectId: ability.effectId },
          message: `Ability "${ability.id}" applies unknown effectId "${ability.effectId}". Not found in EffectRegistry.`
        });
      }

      // Check summon references
      if (ability.type === 'summon' && ability.summonEntityId) {
        const enemyExists = content.enemies.has(ability.summonEntityId);
        const blueprintExists = content.entities.has(ability.summonEntityId);
        if (!enemyExists && !blueprintExists) {
          issues.push({
            severity: 'error',
            category: 'abilities',
            code: 'BROKEN_REFERENCE',
            targetId: ability.id,
            field: 'summonEntityId',
            details: { summonEntityId: ability.summonEntityId },
            message: `Ability "${ability.id}" summons unknown entity "${ability.summonEntityId}". Not found in EnemyRegistry or EntityRegistry.`
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validates status effects catalog
   */
  public static validateEffects(content: ContentRegistry): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const effects = content.effects.getAll();
    const seenIds = new Set<string>();

    for (const effect of effects) {
      if (seenIds.has(effect.id)) {
        issues.push({
          severity: 'error',
          category: 'effects',
          code: 'DUPLICATE_ID',
          targetId: effect.id,
          message: `Duplicate effect ID "${effect.id}" registered.`
        });
      }
      seenIds.add(effect.id);

      if (!effect.name) {
        issues.push({
          severity: 'error',
          category: 'effects',
          code: 'MISSING_FIELD',
          targetId: effect.id,
          field: 'name',
          message: `Effect "${effect.id}" is missing a name.`
        });
      }

      if (effect.defaultDuration === undefined || effect.defaultDuration <= 0) {
        issues.push({
          severity: 'error',
          category: 'effects',
          code: 'INVALID_VALUE',
          targetId: effect.id,
          field: 'defaultDuration',
          message: `Effect "${effect.id}" has invalid defaultDuration (${effect.defaultDuration}). Must be > 0.`
        });
      }
    }

    return issues;
  }

  /**
   * Validates room templates
   */
  public static validateRooms(content: ContentRegistry): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const rooms = content.rooms.getAll();
    const seenIds = new Set<string>();

    for (const room of rooms) {
      if (seenIds.has(room.id)) {
        issues.push({
          severity: 'error',
          category: 'rooms',
          code: 'DUPLICATE_ID',
          targetId: room.id,
          message: `Duplicate room template ID "${room.id}" registered.`
        });
      }
      seenIds.add(room.id);

      // Dimension checks
      if (room.minWidth > room.maxWidth) {
        issues.push({
          severity: 'error',
          category: 'rooms',
          code: 'INVALID_DIMENSIONS',
          targetId: room.id,
          field: 'minWidth',
          message: `Room template "${room.id}" has minWidth (${room.minWidth}) > maxWidth (${room.maxWidth}).`
        });
      }

      if (room.minHeight > room.maxHeight) {
        issues.push({
          severity: 'error',
          category: 'rooms',
          code: 'INVALID_DIMENSIONS',
          targetId: room.id,
          field: 'minHeight',
          message: `Room template "${room.id}" has minHeight (${room.minHeight}) > maxHeight (${room.maxHeight}).`
        });
      }

      if (room.minWidth < 3 || room.minHeight < 3) {
        issues.push({
          severity: 'error',
          category: 'rooms',
          code: 'INVALID_DIMENSIONS',
          targetId: room.id,
          message: `Room template "${room.id}" dimensions must be at least 3x3.`
        });
      }

      if (room.weight !== undefined && room.weight <= 0) {
        issues.push({
          severity: 'error',
          category: 'rooms',
          code: 'INVALID_VALUE',
          targetId: room.id,
          field: 'weight',
          message: `Room template "${room.id}" has non-positive spawn weight (${room.weight}).`
        });
      }
    }

    return issues;
  }

  /**
   * Validates spawn tables
   */
  public static validateSpawnTables(content: ContentRegistry): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const tables = content.spawnTables.getAll();
    const seenIds = new Set<string>();

    for (const table of tables) {
      if (seenIds.has(table.id)) {
        issues.push({
          severity: 'error',
          category: 'spawnTables',
          code: 'DUPLICATE_ID',
          targetId: table.id,
          message: `Duplicate spawn table ID "${table.id}" registered.`
        });
      }
      seenIds.add(table.id);

      if (!table.entries || table.entries.length === 0) {
        issues.push({
          severity: 'error',
          category: 'spawnTables',
          code: 'EMPTY_COLLECTION',
          targetId: table.id,
          message: `Spawn table "${table.id}" has no spawn entries.`
        });
        continue;
      }

      let totalWeight = 0;
      for (let i = 0; i < table.entries.length; i++) {
        const entry = table.entries[i];

        // 1. Broken enemy references
        if (!content.enemies.has(entry.enemyId)) {
          issues.push({
            severity: 'error',
            category: 'spawnTables',
            code: 'BROKEN_REFERENCE',
            targetId: table.id,
            details: { entryIndex: i, enemyId: entry.enemyId },
            message: `Spawn table "${table.id}" references unknown enemy "${entry.enemyId}". Not found in EnemyRegistry.`
          });
        }

        // 2. Weight validity
        if (entry.weight <= 0) {
          issues.push({
            severity: 'error',
            category: 'spawnTables',
            code: 'INVALID_SPAWN_TABLE',
            targetId: table.id,
            details: { entryIndex: i, weight: entry.weight },
            message: `Spawn table "${table.id}" entry #${i} for "${entry.enemyId}" has non-positive weight (${entry.weight}).`
          });
        }
        totalWeight += entry.weight;

        // 3. Depth sanity
        if (
          entry.minDepth !== undefined &&
          entry.maxDepth !== undefined &&
          entry.minDepth > entry.maxDepth
        ) {
          issues.push({
            severity: 'error',
            category: 'spawnTables',
            code: 'INVALID_SPAWN_TABLE',
            targetId: table.id,
            details: { entryIndex: i, minDepth: entry.minDepth, maxDepth: entry.maxDepth },
            message: `Spawn table "${table.id}" entry for "${entry.enemyId}" has minDepth (${entry.minDepth}) > maxDepth (${entry.maxDepth}).`
          });
        }
      }

      if (totalWeight <= 0) {
        issues.push({
          severity: 'error',
          category: 'spawnTables',
          code: 'INVALID_SPAWN_TABLE',
          targetId: table.id,
          message: `Spawn table "${table.id}" has total cumulative weight <= 0.`
        });
      }
    }

    return issues;
  }

  /**
   * Formats report into human-readable terminal output
   */
  public static formatReport(report: ValidationReport): string {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push('         ROGUELIKE ENGINE CONTENT VALIDATION REPORT');
    lines.push('═══════════════════════════════════════════════════════════════════');

    lines.push('\n📊 Scanned Catalogs:');
    for (const [cat, count] of Object.entries(report.checkedCounts)) {
      lines.push(`  • ${cat.padEnd(14)}: ${count} entries`);
    }

    if (report.valid) {
      lines.push(`\n✅ STATUS: PASSED - All content verified clean (0 errors, ${report.warnings.length} warnings)`);
    } else {
      lines.push(`\n❌ STATUS: FAILED - ${report.errors.length} fatal content errors detected!`);
      lines.push('\n🚨 Errors:');
      for (const err of report.errors) {
        lines.push(`  [${err.category.toUpperCase()} / ${err.code}] ${err.targetId}: ${err.message}`);
      }
    }

    if (report.warnings.length > 0) {
      lines.push('\n⚠️  Warnings:');
      for (const warn of report.warnings) {
        lines.push(`  [${warn.category.toUpperCase()} / ${warn.code}] ${warn.targetId}: ${warn.message}`);
      }
    }

    lines.push('═══════════════════════════════════════════════════════════════════\n');
    return lines.join('\n');
  }
}
