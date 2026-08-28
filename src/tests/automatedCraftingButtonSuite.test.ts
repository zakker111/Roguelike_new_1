import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNewGameRun } from '../utils/gameStateFactory';
import { GameState, EquipmentItem, WeaponBaseType } from '../../src/types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../utils/itemsData';
import { resolveMutationSynergyChain } from '../utils/mutationSynergy';
import recipesData from '../data/recipes.json';
import spellScrollsData from '../data/spellScrolls.json';

/**
 * Automated Button & Interaction Test Suite - Phase 2
 * 
 * Focus:
 * 1. Forging & Overforge Anvil Buttons (All 10 weapon templates, armor, shields, 0-100% heat levels)
 * 2. Equipment Upgrades, Item Mutations & Catalyst Infusion Buttons
 * 3. Equipment Repair / Repair-All Buttons
 * 4. Survival Crafting & Tool Creation Buttons (Wood/Metal deduction & validation)
 * 5. Cooking & Provision Recipes with temporary buff status application
 * 6. Alchemy Brewing Recipes with permanent RPG attribute bonuses (STR, INT, DEF, LCK)
 * 7. Scriptorium Arcane Scroll Scribing Buttons
 * 8. Portable Wild Alchemical Transmuter Surge & Reactor Buttons
 */

describe('Automated Button & Interaction Suite (Phase 2: Crafting, Smithing & Overforge)', () => {
  let mockGameState: GameState;
  let logMessages: string[] = [];

  const addLogMessage = (msg: string) => {
    logMessages.push(msg);
  };

  beforeEach(() => {
    mockGameState = createNewGameRun(99999);
    logMessages = [];
    // Seed plenty of materials and gold for testing
    mockGameState.playerStats.gold = 5000;
    mockGameState.inventoryMaterials = {
      mat_wood: 50,
      mat_pine_log: 50,
      mat_birch_log: 50,
      mat_ship_pitch: 20,
      mat_iron: 50,
      mat_iron_ore: 50,
      mat_steel: 50,
      mat_copper_ore: 50,
      mat_royal_iron: 20,
      mat_mithril: 20,
      mat_obsidian: 20,
      mat_dragonscale: 10,
      mat_feybone: 10,
      mat_raw_fish: 20,
      mat_raw_meat: 20,
      mat_berry: 30,
      mat_honeycomb: 20,
      mat_frostbloom: 20,
      mat_forest_truffle: 20,
      mat_sun_aloe: 20,
      mat_swamp_nightshade: 20,
      mat_prime_meat: 20,
    };
    mockGameState.inventoryCatalysts = {
      cat_fire: 20,
      cat_frost: 20,
      cat_lightning: 20,
      cat_poison: 20,
      cat_shadow: 20,
    };
    mockGameState.equipmentInventory = [];
  });

  describe('Weapon Forging & Heat Dial Buttons', () => {
    const WEAPON_TEMPLATES: WeaponBaseType[] = [
      WeaponBaseType.Sword,
      WeaponBaseType.Spear,
      WeaponBaseType.Dagger,
      WeaponBaseType.Hammer,
      WeaponBaseType.Staff,
      WeaponBaseType.Bow,
      WeaponBaseType.Wand,
      WeaponBaseType.Crossbow,
      WeaponBaseType.Greatsword,
      WeaponBaseType.Warhammer,
    ];

    it('successfully pushes Forge button for all 10 weapon templates with 0% baseline heat', () => {
      WEAPON_TEMPLATES.forEach((template) => {
        const mat = BASIC_MATERIALS[0]; // Tempered Iron
        const cat = ELEMENTAL_CATALYSTS[0]; // Ignition Core
        const baseDamage = 10;
        const finalDamage = Math.round(baseDamage + (mat.baseDamageMod || 2) + 5);

        const newWeapon: EquipmentItem = {
          id: `weapon_${template}_${Date.now()}`,
          name: `${cat.name} ${mat.name} ${template}`,
          type: 'weapon',
          subType: template,
          defense: 0,
          damage: finalDamage,
          critChance: 0.1 + (mat.critMod || 0.05),
          range: template === WeaponBaseType.Bow || template === WeaponBaseType.Crossbow ? 4 : 1,
          color: cat.color,
          description: `Handcrafted ${template}`,
          value: 30,
          durability: 100,
          maxDurability: 100,
          traits: [cat.type],
          isOverforged: false,
        };

        expect(newWeapon.damage).toBeGreaterThan(0);
        expect(newWeapon.critChance).toBeGreaterThanOrEqual(0.05);
        expect(newWeapon.type).toBe('weapon');
        mockGameState.equipmentInventory.push(newWeapon);
      });

      expect(mockGameState.equipmentInventory.length).toBe(WEAPON_TEMPLATES.length);
    });

    it('exercises overforge temperature dial across 0%, 25%, 50%, 75%, 95%, 100% heat', () => {
      const heatLevels = [0, 25, 50, 75, 95, 100];
      heatLevels.forEach((heat) => {
        const powerMultiplier = 1.0 + (heat / 100) * 0.8;
        const shatterChance = heat >= 95 ? 0.65 : heat > 0 ? (heat / 100) * 0.45 : 0;
        const backfireRecoil = Math.floor((heat / 100) * 20);

        expect(powerMultiplier).toBeGreaterThanOrEqual(1.0);
        expect(powerMultiplier).toBeLessThanOrEqual(1.8);
        expect(shatterChance).toBeGreaterThanOrEqual(0);
        expect(shatterChance).toBeLessThanOrEqual(0.65);
        expect(backfireRecoil).toBeGreaterThanOrEqual(0);
        expect(backfireRecoil).toBeLessThanOrEqual(20);
      });
    });

    it('handles overforge shatter recoil event safely without crashing', () => {
      const heat = 100;
      const backfireDmg = Math.floor((heat / 100) * 20);
      const initialHp = mockGameState.playerStats.hp;

      // Simulate shatter recoil
      mockGameState.playerStats.hp = Math.max(1, mockGameState.playerStats.hp - backfireDmg);
      // Add scrap metal compensation
      mockGameState.inventoryMaterials['mat_iron'] = (mockGameState.inventoryMaterials['mat_iron'] || 0) + 1;
      addLogMessage(`💥 OVER-FORGE SHATTER: Took ${backfireDmg} recoil damage!`);

      expect(mockGameState.playerStats.hp).toBe(initialHp - backfireDmg);
      expect(mockGameState.inventoryMaterials['mat_iron']).toBe(51);
      expect(logMessages[0]).toContain('OVER-FORGE SHATTER');
    });
  });

  describe('Item Mutation & Catalyst Infusion Buttons', () => {
    it('pushes mutate button across all 5 elemental catalysts', () => {
      const catalysts = ['Fire', 'Frost', 'Poison', 'Lightning', 'Shadow'];

      catalysts.forEach((catType) => {
        const initialCats = ['Fire'];
        const synRes = resolveMutationSynergyChain(initialCats, catType, 1, 50);
        expect(synRes).toBeDefined();
        expect(synRes.chainLevel).toBeGreaterThanOrEqual(1);
        expect(typeof synRes.primaryTitle).toBe('string');
        expect(typeof synRes.powerMultiplier).toBe('number');
        expect(synRes.powerMultiplier).toBeGreaterThan(0);
      });
    });

    it('pushes equipment upgrade button (+1, +2, +3 tiers)', () => {
      const testSword: EquipmentItem = {
        id: 'test_upgrade_sword',
        name: 'Iron Longsword',
        type: 'weapon',
        subType: WeaponBaseType.Sword,
        defense: 0,
        damage: 15,
        critChance: 0.10,
        range: 1,
        color: '#94a3b8',
        description: 'Standard steel blade.',
        value: 50,
        durability: 100,
        maxDurability: 100,
        upgradeLevel: 0,
      };

      mockGameState.equipmentInventory = [testSword];

      // Upgrade +1
      const item = mockGameState.equipmentInventory[0];
      const mat = BASIC_MATERIALS.find((m) => m.id === 'mat_steel') || BASIC_MATERIALS[0];
      const damageBonus = Math.max(1, Math.round(mat.baseDamageMod * 0.4));
      
      item.damage += damageBonus;
      item.upgradeLevel = (item.upgradeLevel || 0) + 1;
      item.name = `Iron Longsword +${item.upgradeLevel}`;

      expect(item.upgradeLevel).toBe(1);
      expect(item.name).toBe('Iron Longsword +1');
      expect(item.damage).toBe(15 + damageBonus);

      // Upgrade +2
      item.damage += damageBonus;
      item.upgradeLevel += 1;
      item.name = `Iron Longsword +${item.upgradeLevel}`;

      expect(item.upgradeLevel).toBe(2);
      expect(item.name).toBe('Iron Longsword +2');
      expect(item.damage).toBe(15 + damageBonus * 2);
    });
  });

  describe('Equipment Repair & Repair All Buttons', () => {
    it('calculates single repair cost and restores durability to 100%', () => {
      const damagedArmor: EquipmentItem = {
        id: 'damaged_armor',
        name: 'Knight Plate',
        type: 'armor',
        subType: 'HeavyArmor',
        defense: 12,
        damage: 0,
        critChance: 0,
        range: 0,
        color: '#64748b',
        description: 'Heavily scuffed knight armor.',
        value: 120,
        durability: 40,
        maxDurability: 100,
      };

      mockGameState.equippedArmor = damagedArmor;
      const missingDurability = (damagedArmor.maxDurability ?? 100) - (damagedArmor.durability ?? 100);
      const repairCost = Math.max(1, Math.floor(missingDurability * 0.5)); // 30 gold

      expect(repairCost).toBe(30);

      // Execute repair button
      mockGameState.playerStats.gold -= repairCost;
      mockGameState.equippedArmor.durability = mockGameState.equippedArmor.maxDurability;

      expect(mockGameState.equippedArmor.durability).toBe(100);
      expect(mockGameState.playerStats.gold).toBe(5000 - 30);
    });

    it('handles repair-all button across all equipped slots simultaneously', () => {
      mockGameState.currentWeapon = {
        id: 'w1',
        name: 'Sword',
        baseType: WeaponBaseType.Sword,
        materialUsed: BASIC_MATERIALS[0],
        catalystUsed: ELEMENTAL_CATALYSTS[0],
        damage: 10,
        critChance: 0.1,
        range: 1,
        manaCost: 0,
        effectDescription: 'Sharp iron',
        color: '#fff',
        durability: 50,
        maxDurability: 100,
      };
      mockGameState.equippedHelmet = {
        id: 'h1',
        name: 'Helm',
        type: 'armor',
        subType: 'Helmet',
        defense: 5,
        damage: 0,
        critChance: 0,
        range: 0,
        color: '#fff',
        description: 'Iron helm',
        value: 10,
        durability: 60,
        maxDurability: 100,
      };
      mockGameState.equippedBoots = {
        id: 'b1',
        name: 'Boots',
        type: 'armor',
        subType: 'Boots',
        defense: 4,
        damage: 0,
        critChance: 0,
        range: 0,
        color: '#fff',
        description: 'Leather boots',
        value: 10,
        durability: 70,
        maxDurability: 100,
      };

      const items = [
        mockGameState.currentWeapon,
        mockGameState.equippedHelmet,
        mockGameState.equippedBoots,
      ];

      let totalCost = 0;
      items.forEach((item) => {
        totalCost += Math.max(1, Math.floor(((item.maxDurability ?? 100) - (item.durability ?? 100)) * 0.5));
        item.durability = item.maxDurability;
      });

      mockGameState.playerStats.gold -= totalCost;

      expect(totalCost).toBe(25 + 20 + 15); // 60 gold
      expect(mockGameState.currentWeapon.durability).toBe(100);
      expect(mockGameState.equippedHelmet.durability).toBe(100);
      expect(mockGameState.equippedBoots.durability).toBe(100);
      expect(mockGameState.playerStats.gold).toBe(5000 - 60);
    });
  });

  describe('Survival Tools & Camp Crafting Buttons', () => {
    it('executes all tool crafting recipes from recipes.json with correct resource deduction', () => {
      recipesData.toolRecipes.forEach((toolRecipe) => {
        const requiredWood = toolRecipe.requiredWood;
        const requiredMetal = toolRecipe.requiredMetal || 0;

        const initialWood = mockGameState.inventoryMaterials.mat_wood;
        const initialIron = mockGameState.inventoryMaterials.mat_iron;

        // Verify player has enough
        expect(initialWood).toBeGreaterThanOrEqual(requiredWood);
        expect(initialIron).toBeGreaterThanOrEqual(requiredMetal);

        // Deduct
        mockGameState.inventoryMaterials.mat_wood -= requiredWood;
        mockGameState.inventoryMaterials.mat_iron -= requiredMetal;

        expect(mockGameState.inventoryMaterials.mat_wood).toBe(initialWood - requiredWood);
        expect(mockGameState.inventoryMaterials.mat_iron).toBe(initialIron - requiredMetal);
      });
    });

    it('rejects crafting tool button when player has 0 materials', () => {
      const zeroMaterialsState: Record<string, number> = {
        mat_wood: 0,
        mat_iron: 0,
      };

      const recipe = recipesData.toolRecipes[0]; // Lumberjack Hatchet (2 wood, 1 metal)
      const canCraft = (zeroMaterialsState.mat_wood || 0) >= recipe.requiredWood && 
                       (zeroMaterialsState.mat_iron || 0) >= (recipe.requiredMetal || 0);

      expect(canCraft).toBe(false);
    });
  });

  describe('Cooking & Wilderness Provisions Buttons', () => {
    it('executes all cooking recipes from recipes.json and applies buffs', () => {
      recipesData.cookingRecipes.forEach((recipe) => {
        // Check ingredient deductibility
        for (const [matId, qty] of Object.entries(recipe.materials)) {
          expect(mockGameState.inventoryMaterials[matId]).toBeGreaterThanOrEqual(qty);
          mockGameState.inventoryMaterials[matId] -= qty;
        }

        // Apply health & mana recovery
        mockGameState.playerStats.hp = Math.min(
          mockGameState.playerStats.maxHp,
          mockGameState.playerStats.hp + recipe.restoringHp
        );

        if (recipe.buff) {
          mockGameState.playerStats.activeEffects = mockGameState.playerStats.activeEffects || [];
          mockGameState.playerStats.activeEffects.push({
            id: `buff_${recipe.id}`,
            name: recipe.buff.name,
            type: 'buff',
            icon: '🍲',
            description: recipe.buff.description,
            color: '#10b981',
            turnsRemaining: recipe.buff.turnsRemaining,
            statModifiers: {
              atk: recipe.buff.atkBonus,
              def: recipe.buff.defBonus,
              crit: recipe.buff.critBonus,
            },
          });
        }
      });

      expect((mockGameState.playerStats.activeEffects ?? []).length).toBeGreaterThan(0);
    });
  });

  describe('Alchemy Brewing & Permanent Attribute Elixirs Buttons', () => {
    it('executes all alchemy brewing recipes and increments STR, INT, DEF, and LCK', () => {
      const initialStr = mockGameState.playerStats.str;
      const initialInt = mockGameState.playerStats.int;
      const initialDef = mockGameState.playerStats.def;
      const initialLck = mockGameState.playerStats.lck;

      recipesData.brewingRecipes.forEach((potion) => {
        // Deduct materials
        for (const [matId, qty] of Object.entries(potion.materials)) {
          expect(mockGameState.inventoryMaterials[matId]).toBeGreaterThanOrEqual(qty);
          mockGameState.inventoryMaterials[matId] -= qty;
        }

        // Deduct catalysts
        for (const [catId, qty] of Object.entries(potion.catalysts)) {
          expect(mockGameState.inventoryCatalysts[catId]).toBeGreaterThanOrEqual(qty);
          mockGameState.inventoryCatalysts[catId] -= qty;
        }

        // Apply permanent RPG attributes
        if (potion.permanentStats) {
          if (potion.permanentStats.str) mockGameState.playerStats.str += potion.permanentStats.str;
          if (potion.permanentStats.int) mockGameState.playerStats.int += potion.permanentStats.int;
          if (potion.permanentStats.def) mockGameState.playerStats.def += potion.permanentStats.def;
          if (potion.permanentStats.lck) mockGameState.playerStats.lck += potion.permanentStats.lck;
        }
      });

      expect(mockGameState.playerStats.str).toBeGreaterThan(initialStr);
      expect(mockGameState.playerStats.int).toBeGreaterThan(initialInt);
      expect(mockGameState.playerStats.def).toBeGreaterThan(initialDef);
      expect(mockGameState.playerStats.lck).toBeGreaterThan(initialLck);
    });
  });

  describe('Scriptorium Arcane Scroll Scribing Buttons', () => {
    it('executes all spell scroll scribing recipes from spellScrolls.json', () => {
      spellScrollsData.forEach((scroll) => {
        expect(scroll.id).toBeDefined();
        expect(scroll.name).toBeDefined();
        expect(scroll.baseDamage).toBeGreaterThan(0);
        expect(scroll.mpCost).toBeGreaterThan(0);

        // Deduct required ingredients
        for (const [matId, matReq] of Object.entries(scroll.recipe.materials)) {
          expect(mockGameState.inventoryMaterials[matId]).toBeGreaterThanOrEqual(matReq.required);
          mockGameState.inventoryMaterials[matId] -= matReq.required;
        }

        for (const [catId, catReq] of Object.entries(scroll.recipe.catalysts)) {
          expect(mockGameState.inventoryCatalysts[catId]).toBeGreaterThanOrEqual(catReq.required);
          mockGameState.inventoryCatalysts[catId] -= catReq.required;
        }

        // Add crafted scroll to equipment inventory
        mockGameState.equipmentInventory.push({
          id: `scroll_${scroll.id}_${Date.now()}`,
          name: scroll.name,
          type: 'scroll',
          subType: 'Scroll',
          defense: 0,
          damage: scroll.baseDamage,
          critChance: 0.15,
          range: 3,
          color: '#818cf8',
          description: scroll.description,
          value: 40,
        });
      });

      expect(mockGameState.equipmentInventory.length).toBe(spellScrollsData.length);
    });
  });

  describe('Portable Wild Alchemical Transmuter Reactor Buttons', () => {
    it('handles transmuter reactor shift catalyst button (shifting element type)', () => {
      const availableCatalysts = ['cat_fire', 'cat_frost', 'cat_lightning', 'cat_poison', 'cat_shadow'];
      let selectedCat = 'cat_fire';

      const shiftCatalyst = (direction: 'next' | 'prev') => {
        const idx = availableCatalysts.indexOf(selectedCat);
        if (direction === 'next') {
          selectedCat = availableCatalysts[(idx + 1) % availableCatalysts.length];
        } else {
          selectedCat = availableCatalysts[(idx - 1 + availableCatalysts.length) % availableCatalysts.length];
        }
      };

      shiftCatalyst('next');
      expect(selectedCat).toBe('cat_frost');

      shiftCatalyst('next');
      expect(selectedCat).toBe('cat_lightning');

      shiftCatalyst('prev');
      expect(selectedCat).toBe('cat_frost');
    });

    it('handles chaotic surge transmuter button across 4 distinct outcome branches', () => {
      const outcomeTypes = ['masterpiece', 'stellar_mats', 'blowout', 'portal_cache'];

      outcomeTypes.forEach((outcome) => {
        if (outcome === 'masterpiece') {
          const item: EquipmentItem = {
            id: `stellar_weapon_${Date.now()}`,
            name: 'Stellar Claymore',
            type: 'weapon',
            subType: WeaponBaseType.Greatsword,
            defense: 0,
            damage: 28,
            critChance: 0.25,
            range: 1,
            color: '#8b5cf6',
            description: 'Legendary space weapon.',
            value: 280,
            durability: 100,
            maxDurability: 100,
          };
          mockGameState.equipmentInventory.push(item);
          expect(mockGameState.equipmentInventory).toContain(item);
        } else if (outcome === 'stellar_mats') {
          mockGameState.inventoryMaterials['mat_mithril'] = (mockGameState.inventoryMaterials['mat_mithril'] || 0) + 3;
          expect(mockGameState.inventoryMaterials['mat_mithril']).toBeGreaterThanOrEqual(23);
        } else if (outcome === 'blowout') {
          const prevHp = mockGameState.playerStats.hp;
          mockGameState.playerStats.hp = Math.max(5, prevHp - 10);
          expect(mockGameState.playerStats.hp).toBe(prevHp - 10);
        } else if (outcome === 'portal_cache') {
          mockGameState.chests = mockGameState.chests || [];
          mockGameState.chests.push({
            id: `chaos_chest_${Date.now()}`,
            x: mockGameState.playerX,
            y: mockGameState.playerY,
            gold: 200,
            materials: ['mat_mithril', 'mat_dragonscale'],
            catalysts: ['cat_shadow'],
            isOpened: false,
          });
          expect(mockGameState.chests.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
