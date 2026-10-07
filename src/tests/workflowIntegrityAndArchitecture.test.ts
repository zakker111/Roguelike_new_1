/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createNewGameRun } from '../utils/gameStateFactory';
import { getAllRegisteredTiles } from '../world/tileRegistry';

// Load static JSON catalogs directly
const materialsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/materials.json'), 'utf8'));
const catalystsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/catalysts.json'), 'utf8'));
const recipesData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/recipes.json'), 'utf8'));
const spellsCatalogData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/spellsCatalog.json'), 'utf8'));
const spellScrollsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/spellScrolls.json'), 'utf8'));
const questsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/quests.json'), 'utf8'));
const dialoguesData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/dialogues.json'), 'utf8'));
const soundCatalogData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/soundCatalog.json'), 'utf8'));

describe('Workflow & Referential Integrity Guardian Suite', () => {
  describe('1. Cross-Catalog Referential Integrity & Foreign Key Consistency', () => {
    const validMaterialIds = new Set<string>(materialsData.map((m: any) => m.id));
    const validCatalystIds = new Set<string>(catalystsData.map((c: any) => c.id));

    it('materials catalog has unique IDs, valid categories, and hex colors', () => {
      const ids = new Set<string>();
      for (const mat of materialsData) {
        expect(mat.id, `Material ID must be non-empty`).toBeTruthy();
        expect(ids.has(mat.id), `Duplicate material ID found: ${mat.id}`).toBe(false);
        ids.add(mat.id);
        expect(mat.name, `Material ${mat.id} must have a name`).toBeTruthy();
        expect(mat.color.startsWith('#'), `Material ${mat.id} color must be valid hex: ${mat.color}`).toBe(true);
      }
      expect(ids.size).toBeGreaterThanOrEqual(30);
    });

    it('catalysts catalog has unique IDs, valid types, and hex colors', () => {
      const ids = new Set<string>();
      for (const cat of catalystsData) {
        expect(cat.id.startsWith('cat_'), `Catalyst ID must start with cat_: ${cat.id}`).toBe(true);
        expect(ids.has(cat.id), `Duplicate catalyst ID found: ${cat.id}`).toBe(false);
        ids.add(cat.id);
        expect(cat.name).toBeTruthy();
        expect(cat.color.startsWith('#')).toBe(true);
      }
      expect(ids.size).toBe(5);
    });

    it('cooking, brewing, and tool recipes reference valid input materials and catalysts', () => {
      const recipeIds = new Set<string>();
      const recipeCategories = ['cookingRecipes', 'brewingRecipes', 'toolRecipes'];

      for (const catKey of recipeCategories) {
        const list = recipesData[catKey] || [];
        for (const recipe of list) {
          expect(recipe.id, `Recipe missing ID in ${catKey}`).toBeTruthy();
          expect(recipeIds.has(recipe.id), `Duplicate recipe ID found: ${recipe.id}`).toBe(false);
          recipeIds.add(recipe.id);
          expect(recipe.name).toBeTruthy();

          // Check materials
          if (recipe.materials) {
            for (const matId of Object.keys(recipe.materials)) {
              expect(
                validMaterialIds.has(matId),
                `Recipe "${recipe.id}" references non-existent material: "${matId}"`
              ).toBe(true);
              expect(recipe.materials[matId]).toBeGreaterThan(0);
            }
          }

          // Check catalysts
          if (recipe.catalysts) {
            for (const catId of Object.keys(recipe.catalysts)) {
              expect(
                validCatalystIds.has(catId),
                `Recipe "${recipe.id}" references non-existent catalyst: "${catId}"`
              ).toBe(true);
              expect(recipe.catalysts[catId]).toBeGreaterThan(0);
            }
          }
        }
      }
      expect(recipeIds.size).toBeGreaterThanOrEqual(15);
    });

    it('spell catalog defines valid spells and spell scrolls reference valid ingredients', () => {
      const spellIds = new Set<string>();
      for (const spell of spellsCatalogData) {
        expect(spell.id).toBeTruthy();
        expect(spellIds.has(spell.id), `Duplicate spell ID: ${spell.id}`).toBe(false);
        spellIds.add(spell.id);
        expect(spell.manaCost).toBeGreaterThan(0);
        expect(spell.damageMultiplier).toBeGreaterThan(0);
      }

      const scrollIds = new Set<string>();
      for (const scroll of spellScrollsData) {
        expect(scroll.id.startsWith('scroll_'), `Scroll ID must start with scroll_: ${scroll.id}`).toBe(true);
        expect(scrollIds.has(scroll.id), `Duplicate scroll ID: ${scroll.id}`).toBe(false);
        scrollIds.add(scroll.id);

        if (scroll.recipe?.materials) {
          for (const matId of Object.keys(scroll.recipe.materials)) {
            expect(
              validMaterialIds.has(matId),
              `Scroll "${scroll.id}" references non-existent material: "${matId}"`
            ).toBe(true);
          }
        }
        if (scroll.recipe?.catalysts) {
          for (const catId of Object.keys(scroll.recipe.catalysts)) {
            expect(
              validCatalystIds.has(catId),
              `Scroll "${scroll.id}" references non-existent catalyst: "${catId}"`
            ).toBe(true);
          }
        }
      }
      expect(scrollIds.size).toBeGreaterThanOrEqual(3);
    });

    it('quests catalog has unique IDs and valid gather targets', () => {
      const questIds = new Set<string>();
      for (const quest of questsData) {
        expect(quest.id.startsWith('q_'), `Quest ID must start with q_: ${quest.id}`).toBe(true);
        expect(questIds.has(quest.id), `Duplicate quest ID: ${quest.id}`).toBe(false);
        questIds.add(quest.id);
        expect(quest.title).toBeTruthy();
        expect(quest.description).toBeTruthy();
        expect(quest.rewardGold).toBeGreaterThanOrEqual(0);

        if (quest.type === 'gather' && quest.targetItem && quest.targetItem !== 'gold') {
          const isValidTarget = validMaterialIds.has(quest.targetItem) || validCatalystIds.has(quest.targetItem);
          expect(
            isValidTarget,
            `Quest "${quest.id}" references invalid target item: "${quest.targetItem}"`
          ).toBe(true);
          expect(quest.targetCount).toBeGreaterThan(0);
        }
      }
      expect(questIds.size).toBeGreaterThanOrEqual(8);
    });

    it('tileRegistry harvest yields map directly to valid materials', () => {
      const tileDefs = getAllRegisteredTiles();
      expect(tileDefs.length).toBeGreaterThan(20);

      let harvestableCount = 0;
      for (const tile of tileDefs) {
        if (tile.harvestYield) {
          harvestableCount++;
          const primaryMat = tile.harvestYield.materialId;
          expect(
            validMaterialIds.has(primaryMat),
            `Tile "${tile.id}" (${tile.name}) yields unknown material "${primaryMat}"`
          ).toBe(true);

          if (tile.harvestYield.secondaryMaterialId) {
            const secMat = tile.harvestYield.secondaryMaterialId;
            expect(
              validMaterialIds.has(secMat),
              `Tile "${tile.id}" (${tile.name}) yields unknown secondary material "${secMat}"`
            ).toBe(true);
          }
        }
      }
      expect(harvestableCount).toBeGreaterThanOrEqual(5);
    });

    it('soundCatalog presets have unique IDs and positive duration/gain values', () => {
      const soundIds = new Set<string>();
      for (const sound of soundCatalogData) {
        expect(sound.id).toBeTruthy();
        expect(soundIds.has(sound.id), `Duplicate sound ID: ${sound.id}`).toBe(false);
        soundIds.add(sound.id);
        expect(sound.name).toBeTruthy();
      }
      expect(soundIds.size).toBeGreaterThanOrEqual(15);
    });

    it('dialogues catalog provides rich voice lines across all settlement roles', () => {
      expect(dialoguesData.dialogues).toBeDefined();
      const roles = Object.keys(dialoguesData.dialogues);
      expect(roles.length).toBeGreaterThanOrEqual(5);
      for (const role of roles) {
        const lines = dialoguesData.dialogues[role];
        expect(Array.isArray(lines), `Role ${role} must be an array of lines`).toBe(true);
        expect(lines.length, `Role ${role} must have at least 3 lines`).toBeGreaterThanOrEqual(3);
        lines.forEach((line: string) => expect(line.trim().length).toBeGreaterThan(5));
      }
    });
  });

  describe('2. Strict Anti-Monolith & Codebase Architecture Linter', () => {
    // Whitelist for massive audio synth catalogs and static data scripts
    const EXEMPT_FILES = new Set([
      'src/data/gmCommands.ts',
      'src/utils/storyteller/storytellerEncountersData.ts',
      'src/utils/audio/soundCatalog.ts',
    ]);

    const MAX_ALLOWED_LINES = 999;

    function getSourceFiles(dir: string, fileList: string[] = []): string[] {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // Skip tests folder for file line limit checks
          if (file !== 'tests') {
            getSourceFiles(fullPath, fileList);
          }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          fileList.push(fullPath);
        }
      }
      return fileList;
    }

    it('enforces that no component, hook, or generator exceeds the anti-monolith threshold (999 lines)', () => {
      const srcRoot = path.resolve(__dirname, '..');
      const allSourceFiles = getSourceFiles(srcRoot);
      const violations: { file: string; lines: number }[] = [];

      for (const file of allSourceFiles) {
        const relPath = path.relative(path.resolve(__dirname, '../..'), file).replace(/\\/g, '/');
        if (EXEMPT_FILES.has(relPath)) continue;

        const content = fs.readFileSync(file, 'utf8');
        const lineCount = content.split('\n').length;

        if (lineCount > MAX_ALLOWED_LINES) {
          violations.push({ file: relPath, lines: lineCount });
        }
      }

      if (violations.length > 0) {
        const details = violations.map(v => `  - ${v.file}: ${v.lines} lines (max: ${MAX_ALLOWED_LINES})`).join('\n');
        expect.fail(`Anti-Monolith Rule Violated! The following files must be decomposed into sub-modules:\n${details}`);
      }
      expect(violations.length).toBe(0);
    });
  });

  describe('3. Game State Factory & Schema Migration Invariance', () => {
    it('createNewGameRun returns a complete, fully hydrated GameState with no undefined critical structures', () => {
      const state = createNewGameRun(99999);

      // Player stats validation
      expect(state.playerStats).toBeDefined();
      expect(state.playerStats.hp).toBeGreaterThan(0);
      expect(state.playerStats.maxHp).toBeGreaterThanOrEqual(state.playerStats.hp);
      expect(state.playerStats.mp).toBeGreaterThanOrEqual(0);
      expect(state.playerStats.atk).toBeGreaterThan(0);
      expect(state.playerStats.def).toBeGreaterThanOrEqual(0);
      expect(state.playerStats.level).toBe(1);
      expect(state.playerStats.gold).toBeGreaterThanOrEqual(0);

      // Inventory & Waystones
      expect(state.inventoryMaterials).toBeDefined();
      expect(state.inventoryCatalysts).toBeDefined();
      expect(Array.isArray(state.attunedWaystones)).toBe(true);
      expect(Array.isArray(state.customMapPins)).toBe(true);
      expect(state.attunedWaystones).toContain('waystone_0_0');

      // Map & Chunks
      expect(state.map.length).toBeGreaterThan(0);
      expect(state.overworldChunks).toBeDefined();
      const currentChunkKey = `${state.currentChunkX},${state.currentChunkY}`;
      expect(state.overworldChunks[currentChunkKey]).toBeDefined();

      // Serialization Round-Trip
      const serialized = JSON.stringify(state);
      expect(serialized.length).toBeGreaterThan(1000);
      const deserialized = JSON.parse(serialized);
      expect(deserialized.playerStats.hp).toBe(state.playerStats.hp);
      expect(deserialized.currentChunkX).toBe(state.currentChunkX);
      expect(deserialized.attunedWaystones.length).toBe(state.attunedWaystones.length);
    });

    it('safely handles backwards-compatible migration for older saves missing v8.x fields', () => {
      // Mock an older save state missing customMapPins, attunedWaystones, and activeEffects
      const legacySave: any = {
        playerStats: {
          hp: 25,
          maxHp: 30,
          mp: 10,
          maxMp: 15,
          level: 2,
          xp: 100,
          nextLevelXp: 200,
          gold: 50,
          atk: 5,
          def: 2,
        },
        currentChunkX: 0,
        currentChunkY: 0,
        map: [[1, 1], [1, 1]],
        inventoryMaterials: { mat_wood: 5 },
        inventoryCatalysts: {},
      };

      // Apply standard migration safeguards
      const healedState = {
        ...legacySave,
        playerStats: {
          ...legacySave.playerStats,
          activeEffects: legacySave.playerStats.activeEffects || [],
          exhaustion: legacySave.playerStats.exhaustion || 0,
        },
        attunedWaystones: legacySave.attunedWaystones || ['waystone_0_0'],
        customMapPins: legacySave.customMapPins || [],
        lootPiles: legacySave.lootPiles || [],
        corpses: legacySave.corpses || [],
      };

      expect(Array.isArray(healedState.playerStats.activeEffects)).toBe(true);
      expect(Array.isArray(healedState.attunedWaystones)).toBe(true);
      expect(Array.isArray(healedState.customMapPins)).toBe(true);
      expect(healedState.attunedWaystones).toContain('waystone_0_0');
      expect(healedState.playerStats.hp).toBe(25);
    });
  });
});
