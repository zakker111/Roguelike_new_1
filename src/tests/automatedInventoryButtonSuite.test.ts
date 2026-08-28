/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState, EquipmentItem, WeaponBaseType } from '../types';
import { createNewGameRun } from '../utils/gameStateFactory';
import { useEquipmentHandlers } from '../hooks/useEquipmentHandlers';
import { useConsumablesAndCatalysts } from '../hooks/app/useConsumablesAndCatalysts';

// Mock audio
vi.mock('../utils/audio', () => ({
  playSound: vi.fn(),
}));

describe('Automated Button & Interaction Suite (Phase 3: Inventory, Equipment & RPG Attributes)', () => {
  let mockGameState: GameState;
  let mockSetGameState: (updater: (prev: GameState) => GameState) => void;
  let logs: string[] = [];

  const addLogMessage = (text: string) => {
    logs.push(text);
  };

  beforeEach(() => {
    logs = [];
    mockGameState = createNewGameRun();
    mockGameState.equipmentInventory = [];
    mockGameState.inventoryMaterials = {};
    mockGameState.inventoryCatalysts = {};
    mockGameState.equippedArmor = null;
    mockGameState.equippedHelmet = null;
    mockGameState.equippedGloves = null;
    mockGameState.equippedBoots = null;
    mockGameState.equippedShield = null;
    mockGameState.equippedAmulet = null;
    mockGameState.currentWeapon = null;
    mockGameState.playerStats.unspentPoints = 5;
    mockGameState.playerStats.gold = 1000;
    mockGameState.playerStats.str = 10;
    mockGameState.playerStats.dex = 10;
    mockGameState.playerStats.int = 10;
    mockGameState.playerStats.cha = 10;
    mockGameState.playerStats.lck = 10;
    mockGameState.playerStats.def = 0;
    mockGameState.playerStats.hp = 100;
    mockGameState.playerStats.maxHp = 100;
    mockGameState.playerStats.mp = 30;
    mockGameState.playerStats.maxMp = 30;

    mockSetGameState = (updater) => {
      mockGameState = updater(mockGameState);
    };
  });

  describe('Core RPG Attribute Allocation Buttons', () => {
    it('allocates unspent attribute points across STR, DEX, INT, CHA, LCK', () => {
      const { handleAdjustAttribute } = useConsumablesAndCatalysts({
        gameState: mockGameState,
        setGameState: mockSetGameState as any,
        playSound: vi.fn(),
        addLogMessage,
        levelWidth: 60,
        levelHeight: 40,
      });

      // Spend 1 point into STR (Strength -> +Max HP and +STR)
      handleAdjustAttribute('str', 1);
      expect(mockGameState.playerStats.str).toBe(11);
      expect(mockGameState.playerStats.maxHp).toBe(105);
      expect(mockGameState.playerStats.hp).toBe(105);
      expect(mockGameState.playerStats.unspentPoints).toBe(4);

      // Spend 1 point into DEX (Dexterity -> +ATK and +DEX)
      const baseAtk = mockGameState.playerStats.atk || 5;
      handleAdjustAttribute('dex', 1);
      expect(mockGameState.playerStats.dex).toBe(11);
      expect(mockGameState.playerStats.atk).toBe(baseAtk + 1);
      expect(mockGameState.playerStats.unspentPoints).toBe(3);

      // Spend 1 point into INT (Intellect -> +Max MP and +INT)
      handleAdjustAttribute('int', 1);
      expect(mockGameState.playerStats.int).toBe(11);
      expect(mockGameState.playerStats.maxMp).toBe(33);
      expect(mockGameState.playerStats.mp).toBe(33);
      expect(mockGameState.playerStats.unspentPoints).toBe(2);

      // Spend 1 point into CHA (Charisma)
      handleAdjustAttribute('cha', 1);
      expect(mockGameState.playerStats.cha).toBe(11);
      expect(mockGameState.playerStats.unspentPoints).toBe(1);

      // Spend 1 point into LCK (Luck)
      handleAdjustAttribute('lck', 1);
      expect(mockGameState.playerStats.lck).toBe(11);
      expect(mockGameState.playerStats.unspentPoints).toBe(0);
    });

    it('rejects attribute allocation when player has 0 unspent points', () => {
      mockGameState.playerStats.unspentPoints = 0;
      const { handleAdjustAttribute } = useConsumablesAndCatalysts({
        gameState: mockGameState,
        setGameState: mockSetGameState as any,
        playSound: vi.fn(),
        addLogMessage,
        levelWidth: 60,
        levelHeight: 40,
      });

      handleAdjustAttribute('str', 1);
      expect(mockGameState.playerStats.str).toBe(10);
      expect(mockGameState.playerStats.unspentPoints).toBe(0);
    });
  });

  describe('Equipment Paperdoll & 8-Slot Gear Buttons', () => {
    it('equips Helmet, Armor, Gloves, Boots, and Amulet into proper paperdoll slots and adds defense', () => {
      const {
        handleEquipItem,
        handleUnequipHelmet,
        handleUnequipArmor,
        handleUnequipGloves,
        handleUnequipBoots,
        handleUnequipAmulet,
      } = useEquipmentHandlers({
        gameState: mockGameState,
        setGameState: mockSetGameState as any,
        addLogMessage,
        setActiveTargetedScroll: vi.fn(),
        setActiveTab: vi.fn(),
        setActiveRecallScroll: vi.fn(),
      });

      const testHelmet: EquipmentItem = {
        id: 'helm_1',
        name: 'Iron Full Helm',
        type: 'armor',
        subType: 'Helmet',
        defense: 4,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#94a3b8',
        description: 'Sturdy iron helmet',
        value: 50,
        durability: 100,
        maxDurability: 100,
      };

      const testChest: EquipmentItem = {
        id: 'chest_1',
        name: 'Knight Cuirass',
        type: 'armor',
        subType: 'HeavyArmor',
        defense: 12,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#64748b',
        description: 'Hardened plate armor',
        value: 120,
        durability: 100,
        maxDurability: 100,
      };

      const testGloves: EquipmentItem = {
        id: 'gloves_1',
        name: 'Steel Gauntlets',
        type: 'armor',
        subType: 'Gloves',
        defense: 3,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#94a3b8',
        description: 'Reinforced gauntlets',
        value: 40,
        durability: 100,
        maxDurability: 100,
      };

      const testBoots: EquipmentItem = {
        id: 'boots_1',
        name: 'Greaves of Haste',
        type: 'armor',
        subType: 'Boots',
        defense: 3,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#94a3b8',
        description: 'Nimble iron sabatons',
        value: 45,
        durability: 100,
        maxDurability: 100,
      };

      const testAmulet: EquipmentItem = {
        id: 'amulet_1',
        name: 'Talisman of Iron Skin',
        type: 'armor',
        subType: 'Amulet',
        defense: 2,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#eab308',
        description: 'Enchanted amulet',
        value: 80,
        durability: 100,
        maxDurability: 100,
      };

      mockGameState.equipmentInventory = [testHelmet, testChest, testGloves, testBoots, testAmulet];

      // Equip Helmet
      handleEquipItem(testHelmet);
      expect(mockGameState.equippedHelmet?.name).toBe('Iron Full Helm');
      expect(mockGameState.playerStats.def).toBe(4);

      // Equip Chest Armor
      handleEquipItem(testChest);
      expect(mockGameState.equippedArmor?.name).toBe('Knight Cuirass');
      expect(mockGameState.playerStats.def).toBe(16);

      // Equip Gloves
      handleEquipItem(testGloves);
      expect(mockGameState.equippedGloves?.name).toBe('Steel Gauntlets');
      expect(mockGameState.playerStats.def).toBe(19);

      // Equip Boots
      handleEquipItem(testBoots);
      expect(mockGameState.equippedBoots?.name).toBe('Greaves of Haste');
      expect(mockGameState.playerStats.def).toBe(22);

      // Equip Amulet
      handleEquipItem(testAmulet);
      expect(mockGameState.equippedAmulet?.name).toBe('Talisman of Iron Skin');
      expect(mockGameState.playerStats.def).toBe(24);

      // Verify inventory is empty
      expect(mockGameState.equipmentInventory.length).toBe(0);

      // Unequip all items one by one
      handleUnequipHelmet();
      expect(mockGameState.equippedHelmet).toBeNull();
      expect(mockGameState.playerStats.def).toBe(20);

      handleUnequipArmor();
      expect(mockGameState.equippedArmor).toBeNull();
      expect(mockGameState.playerStats.def).toBe(8);

      handleUnequipGloves();
      expect(mockGameState.equippedGloves).toBeNull();
      expect(mockGameState.playerStats.def).toBe(5);

      handleUnequipBoots();
      expect(mockGameState.equippedBoots).toBeNull();
      expect(mockGameState.playerStats.def).toBe(2);

      handleUnequipAmulet();
      expect(mockGameState.equippedAmulet).toBeNull();
      expect(mockGameState.playerStats.def).toBe(0);

      expect(mockGameState.equipmentInventory.length).toBe(5);
    });

    it('handles 1-Handed Weapon + Shield duel-wielding setup', () => {
      const { handleEquipItem } = useEquipmentHandlers({
        gameState: mockGameState,
        setGameState: mockSetGameState as any,
        addLogMessage,
        setActiveTargetedScroll: vi.fn(),
        setActiveTab: vi.fn(),
        setActiveRecallScroll: vi.fn(),
      });

      const sword: EquipmentItem = {
        id: 'sword_1',
        name: 'Broadsword',
        type: 'weapon',
        subType: WeaponBaseType.Sword,
        defense: 0,
        damage: 12,
        critChance: 0.1,
        range: 1,
        color: '#e2e8f0',
        description: 'Single-handed sword',
        value: 60,
        durability: 100,
        maxDurability: 100,
      };

      const shield: EquipmentItem = {
        id: 'shield_1',
        name: 'Tower Shield',
        type: 'armor',
        subType: 'Shield',
        defense: 8,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#475569',
        description: 'Heavy protective barrier',
        value: 70,
        durability: 100,
        maxDurability: 100,
      };

      mockGameState.equipmentInventory = [sword, shield];

      // Equip 1H sword in main hand (right)
      handleEquipItem(sword, 'right');
      expect(mockGameState.currentWeapon?.name).toBe('Broadsword');
      expect(mockGameState.currentWeapon?.damage).toBe(12);

      // Equip Shield in off hand (left)
      handleEquipItem(shield, 'left');
      expect(mockGameState.equippedShield?.name).toBe('Tower Shield');
      expect(mockGameState.playerStats.def).toBe(8);

      expect(mockGameState.equipmentInventory.length).toBe(0);
    });

    it('enforces 2-Handed weapon occupancy rule (automatically unequips offhand shield when wielding Greatsword)', () => {
      const { handleEquipItem } = useEquipmentHandlers({
        gameState: mockGameState,
        setGameState: mockSetGameState as any,
        addLogMessage,
        setActiveTargetedScroll: vi.fn(),
        setActiveTab: vi.fn(),
        setActiveRecallScroll: vi.fn(),
      });

      const shield: EquipmentItem = {
        id: 'shield_test',
        name: 'Kite Shield',
        type: 'armor',
        subType: 'Shield',
        defense: 6,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#475569',
        description: 'Shield',
        value: 50,
        durability: 100,
        maxDurability: 100,
      };

      const greatsword: EquipmentItem = {
        id: 'greatsword_1',
        name: 'Zweihander of Doom',
        type: 'weapon',
        subType: WeaponBaseType.Greatsword,
        defense: 0,
        damage: 25,
        critChance: 0.15,
        range: 1,
        color: '#ef4444',
        description: 'Massive two-handed greatsword',
        value: 150,
        durability: 100,
        maxDurability: 100,
      };

      mockGameState.equippedShield = shield;
      mockGameState.playerStats.def = 6;
      mockGameState.equipmentInventory = [greatsword];

      // Equipping the 2-handed greatsword MUST automatically unequip the shield back to inventory!
      handleEquipItem(greatsword, 'right');

      expect(mockGameState.currentWeapon?.name).toBe('Zweihander of Doom');
      expect(mockGameState.equippedShield).toBeNull();
      expect(mockGameState.playerStats.def).toBe(0);
      expect(mockGameState.equipmentInventory.some((it) => it.id === 'shield_test')).toBe(true);
    });

    it('enforces 2-Handed weapon replacement when equipping a shield (unequips 2-handed weapon to offhand)', () => {
      const { handleEquipItem } = useEquipmentHandlers({
        gameState: mockGameState,
        setGameState: mockSetGameState as any,
        addLogMessage,
        setActiveTargetedScroll: vi.fn(),
        setActiveTab: vi.fn(),
        setActiveRecallScroll: vi.fn(),
      });

      const greatsword: EquipmentItem = {
        id: 'greatsword_active',
        name: 'Colossal Greatsword',
        type: 'weapon',
        subType: WeaponBaseType.Greatsword,
        defense: 0,
        damage: 28,
        critChance: 0.2,
        range: 1,
        color: '#ef4444',
        description: 'Two-handed blade',
        value: 180,
        durability: 100,
        maxDurability: 100,
      };

      const roundShield: EquipmentItem = {
        id: 'round_shield',
        name: 'Oak Buckler',
        type: 'armor',
        subType: 'Shield',
        defense: 5,
        damage: 0,
        critChance: 0,
        range: 1,
        color: '#854d0e',
        description: 'Small shield',
        value: 35,
        durability: 100,
        maxDurability: 100,
      };

      // Equip greatsword into right hand
      handleEquipItem(greatsword, 'right');
      expect(mockGameState.currentWeapon?.name).toBe('Colossal Greatsword');

      // Now equip the shield to offhand (left) -> Greatsword must be removed from right hand!
      handleEquipItem(roundShield, 'left');
      expect(mockGameState.equippedShield?.name).toBe('Oak Buckler');
      expect(mockGameState.currentWeapon).toBeNull();
      expect(mockGameState.equipmentInventory.some((it) => it.name === 'Colossal Greatsword')).toBe(true);
    });
  });

  describe('Consumables, Potions, Foods & Provisions Buttons', () => {
    it('consumes HP Potions, MP Potions, and Full Rejuvenation Elixirs restoring vitality', () => {
      const { handleEatMeat } = useConsumablesAndCatalysts({
        gameState: mockGameState,
        setGameState: mockSetGameState as any,
        playSound: vi.fn(),
        addLogMessage,
        levelWidth: 60,
        levelHeight: 40,
      });

      // Damage player
      mockGameState.playerStats.hp = 20;
      mockGameState.playerStats.mp = 5;
      mockGameState.inventoryMaterials = {
        potion_hp: 2,
        potion_mp: 2,
        potion_full_rejuv: 1,
      };

      // Drink HP potion (+35 HP)
      handleEatMeat('potion_hp');
      expect(mockGameState.playerStats.hp).toBe(55);
      expect(mockGameState.inventoryMaterials['potion_hp']).toBe(1);

      // Drink MP beverage (+15 MP)
      handleEatMeat('potion_mp');
      expect(mockGameState.playerStats.mp).toBe(20);
      expect(mockGameState.inventoryMaterials['potion_mp']).toBe(1);

      // Drink Full Rejuv Potion (100% HP and 100% MP)
      handleEatMeat('potion_full_rejuv');
      expect(mockGameState.playerStats.hp).toBe(mockGameState.playerStats.maxHp);
      expect(mockGameState.playerStats.mp).toBe(mockGameState.playerStats.maxMp);
      expect(mockGameState.inventoryMaterials['potion_full_rejuv']).toBe(0);
    });

    it('consumes wilderness food provisions (Hearth Bread, Flame-Grilled Steak, Baked Berry Pie, Seppo Hooch)', () => {
      const { handleEatMeat } = useConsumablesAndCatalysts({
        gameState: mockGameState,
        setGameState: mockSetGameState as any,
        playSound: vi.fn(),
        addLogMessage,
        levelWidth: 60,
        levelHeight: 40,
      });

      mockGameState.playerStats.hp = 10;
      mockGameState.playerStats.mp = 0;
      mockGameState.inventoryMaterials = {
        mat_bread: 1,
        mat_cooked_prime_meat: 1,
        mat_cooked_pie: 1,
        mat_seppo_hooch: 1,
      };

      // Eat Bread (+20 HP)
      handleEatMeat('mat_bread');
      expect(mockGameState.playerStats.hp).toBe(30);

      // Eat Flame-Grilled Steak (+60 HP, +15 MP)
      handleEatMeat('mat_cooked_prime_meat');
      expect(mockGameState.playerStats.hp).toBe(90);
      expect(mockGameState.playerStats.mp).toBe(15);

      // Eat Pie (+40 HP, +15 MP) -> caps at maxHp 100
      handleEatMeat('mat_cooked_pie');
      expect(mockGameState.playerStats.hp).toBe(100);
      expect(mockGameState.playerStats.mp).toBe(30);

      // Drink Seppo Hooch (+75 HP, +40 MP)
      mockGameState.playerStats.hp = 10;
      mockGameState.playerStats.mp = 0;
      handleEatMeat('mat_seppo_hooch');
      expect(mockGameState.playerStats.hp).toBe(85);
      expect(mockGameState.playerStats.mp).toBe(30); // Capped at maxMp 30
    });
  });

  describe('Inventory Discard & Sorting Buttons', () => {
    it('discards equipment gear from inventory', () => {
      const { handleDiscardItem } = useEquipmentHandlers({
        gameState: mockGameState,
        setGameState: mockSetGameState as any,
        addLogMessage,
        setActiveTargetedScroll: vi.fn(),
        setActiveTab: vi.fn(),
        setActiveRecallScroll: vi.fn(),
      });

      const junkSword: EquipmentItem = {
        id: 'junk_sword_1',
        name: 'Rusty Shortsword',
        type: 'weapon',
        subType: WeaponBaseType.Sword,
        defense: 0,
        damage: 4,
        critChance: 0.05,
        range: 1,
        color: '#71717a',
        description: 'Old rusty blade',
        value: 5,
        durability: 20,
        maxDurability: 50,
      };

      mockGameState.equipmentInventory = [junkSword];
      expect(mockGameState.equipmentInventory.length).toBe(1);

      handleDiscardItem(junkSword.id, 1);
      expect(mockGameState.equipmentInventory.length).toBe(0);
    });

    it('discards raw materials and catalysts in fractional or bulk batches', () => {
      const { handleDiscardMaterial, handleDiscardCatalyst } = useEquipmentHandlers({
        gameState: mockGameState,
        setGameState: mockSetGameState as any,
        addLogMessage,
        setActiveTargetedScroll: vi.fn(),
        setActiveTab: vi.fn(),
        setActiveRecallScroll: vi.fn(),
      });

      mockGameState.inventoryMaterials = {
        mat_copper: 10,
        mat_iron: 5,
      };
      mockGameState.inventoryCatalysts = {
        cat_fire: 4,
      };

      // Discard 3 copper
      handleDiscardMaterial('mat_copper', 3);
      expect(mockGameState.inventoryMaterials['mat_copper']).toBe(7);

      // Discard all 5 iron
      handleDiscardMaterial('mat_iron', 5);
      expect(mockGameState.inventoryMaterials['mat_iron']).toBe(0);

      // Discard 2 fire catalysts
      handleDiscardCatalyst('cat_fire', 2);
      expect(mockGameState.inventoryCatalysts['cat_fire']).toBe(2);
    });
  });
});
