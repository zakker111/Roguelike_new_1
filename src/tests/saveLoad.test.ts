import { describe, it, expect } from 'vitest';
import { 
  validateSaveData, 
  migrateSaveData, 
  normalizeMaterialStorage, 
  normalizeEquippedItem,
  CURRENT_SAVE_VERSION 
} from '../hooks/useSaveLoad';

describe('12.4 Save File Serialization & Backward Compatibility Suite', () => {
  it('serializes game state payload into valid JSON', () => {
    const mockSaveState = {
      version: 'v4.0.3',
      timestamp: Date.now(),
      playerX: 15,
      playerY: 20,
      playerStats: {
        hp: 40,
        maxHp: 50,
        gold: 150,
        level: 3,
        scars: []
      },
      equipmentInventory: [
        { id: 'axe_steel', name: 'Recruit Hatchet', type: 'weapon', damage: 5 }
      ],
      currentChunkX: 0,
      currentChunkY: 0
    };

    const serialized = JSON.stringify(mockSaveState);
    expect(serialized).toBeTypeOf('string');

    const parsed = JSON.parse(serialized);
    expect(parsed.playerX).toBe(15);
    expect(parsed.playerStats.hp).toBe(40);
    expect(parsed.equipmentInventory.length).toBe(1);
  });

  it('deserializes legacy save payload with fallback defaults safely', () => {
    // Legacy save payload missing new fields (e.g. chaosScore, townReputation)
    const legacyRawJson = JSON.stringify({
      version: 'v1.0.0',
      playerX: 10,
      playerY: 10,
      playerStats: { hp: 30, maxHp: 30 }
    });

    const parsed = JSON.parse(legacyRawJson);
    const migrated = migrateSaveData(parsed);

    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.playerX).toBe(10);
    expect(migrated.chaosScore).toBe(0);
    expect(migrated.townReputation).toBe(50);
    expect(migrated.playerStats.scars).toEqual([]);
    expect(migrated.attunedWaystones).toEqual(['waystone_0_0']);
  });

  it('normalizes legacy material storage from arrays and dictionaries', () => {
    // Array of objects
    const arrayMats = [
      { id: 'mat_wood', count: 5 },
      { id: 'mat_iron', count: 2 },
      { materialId: 'mat_copper', count: 3 }
    ];
    const normalizedArray = normalizeMaterialStorage(arrayMats);
    expect(normalizedArray.mat_wood).toBe(5);
    expect(normalizedArray.mat_iron).toBe(2);
    expect(normalizedArray.mat_copper).toBe(3);

    // Array of string keys
    const stringArray = ['mat_wood', 'mat_wood', 'mat_stone'];
    const normalizedStrings = normalizeMaterialStorage(stringArray);
    expect(normalizedStrings.mat_wood).toBe(2);
    expect(normalizedStrings.mat_stone).toBe(1);

    // Dictionary with floats/negative numbers
    const dictMats = { mat_wood: 10.8, mat_iron: -5, mat_silver: 4 };
    const normalizedDict = normalizeMaterialStorage(dictMats);
    expect(normalizedDict.mat_wood).toBe(10);
    expect(normalizedDict.mat_silver).toBe(4);
    expect(normalizedDict.mat_iron).toBeUndefined();
  });

  it('normalizes equipment durability and clamps values cleanly', () => {
    const itemNoDurability = { id: 'iron_blade', name: 'Iron Blade', type: 'weapon' } as any;
    const normalized = normalizeEquippedItem(itemNoDurability);
    expect(normalized.currentDurability).toBe(50);
    expect(normalized.maxDurability).toBe(50);

    const itemExceeding = { id: 'shield_iron', name: 'Iron Shield', type: 'shield', currentDurability: 120, maxDurability: 80 } as any;
    const clamped = normalizeEquippedItem(itemExceeding);
    expect(clamped.currentDurability).toBe(80);
    expect(clamped.maxDurability).toBe(80);
  });

  it('handles corrupted JSON strings gracefully without throwing unhandled exceptions', () => {
    const invalidJson = "{ bad_json: undefined, ";

    let parseResult = null;
    let parseError = false;

    try {
      parseResult = JSON.parse(invalidJson);
    } catch (err) {
      parseError = true;
    }

    expect(parseError).toBe(true);
    expect(parseResult).toBeNull();
  });

  it('throws diagnostic error when validateSaveData receives corrupted save payload', () => {
    expect(() => validateSaveData(null)).toThrow('[useSaveLoad] Save data is null or not a valid JSON object.');
    expect(() => validateSaveData({ playerX: 'invalid' })).toThrow('[useSaveLoad] Save data missing valid player coordinate numbers');
    expect(() => validateSaveData({ playerX: 10, playerY: 10 })).toThrow('[useSaveLoad] Save data missing playerStats object.');
    expect(validateSaveData({ playerX: 10, playerY: 10, playerStats: { hp: 30 } })).toBe(true);
  });
});

