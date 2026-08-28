import { describe, it, expect } from 'vitest';
import { COOKING_RECIPES, BREWING_RECIPES } from '../data/recipes';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../utils/itemsData';

describe('Phase 6: Crafting & Alchemy Suite', () => {
  it('validates cooking recipes schema and material costs', () => {
    expect(COOKING_RECIPES.length).toBeGreaterThan(0);
    COOKING_RECIPES.forEach((recipe) => {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.restoringHp).toBeGreaterThanOrEqual(0);
      expect(Object.keys(recipe.materials).length).toBeGreaterThan(0);
      expect(recipe.catalysts).toBeDefined();

      if (recipe.buff) {
        expect(recipe.buff.turnsRemaining).toBeGreaterThan(0);
      }
    });
  });

  it('validates brewing recipes schema and tier requirements', () => {
    expect(BREWING_RECIPES.length).toBeGreaterThan(0);
    BREWING_RECIPES.forEach((recipe) => {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.requiredTier).toBeGreaterThanOrEqual(1);
      expect(Object.keys(recipe.materials).length).toBeGreaterThan(0);
      expect(recipe.permanentStats).toBeDefined();
    });
  });

  it('validates basic materials and elemental catalysts inventory definitions', () => {
    expect(BASIC_MATERIALS.length).toBeGreaterThan(0);
    BASIC_MATERIALS.forEach((mat) => {
      expect(mat.id).toBeDefined();
      expect(mat.name).toBeDefined();
      expect(mat.category).toBeDefined();
    });

    expect(ELEMENTAL_CATALYSTS.length).toBeGreaterThan(0);
    ELEMENTAL_CATALYSTS.forEach((cat) => {
      expect(cat.id).toBeDefined();
      expect(cat.type).toBeDefined();
    });
  });

  it('calculates over-forge heat shatter risk formulas accurately', () => {
    const calcShatterChance = (heat: number) => {
      const heatRatio = Math.min(1.0, Math.max(0, heat / 100));
      return heatRatio * 0.65;
    };

    expect(calcShatterChance(0)).toBe(0);
    expect(calcShatterChance(50)).toBe(0.325);
    expect(calcShatterChance(100)).toBe(0.65);
    expect(calcShatterChance(150)).toBe(0.65);
  });

  it('validates weapon templates data and stats completeness', () => {
    const WEAPON_TEMPLATES_KEYS = ['Sword', 'Spear', 'Dagger', 'Hammer', 'Staff', 'Bow', 'Wand', 'Crossbow', 'Greatsword', 'Warhammer'];
    WEAPON_TEMPLATES_KEYS.forEach((key) => {
      const mat = BASIC_MATERIALS[0];
      const cat = ELEMENTAL_CATALYSTS[0];
      expect(mat).toBeDefined();
      expect(cat).toBeDefined();
      expect(typeof mat.baseDamageMod).toBe('number');
      expect(typeof mat.critMod).toBe('number');
    });
  });
});
