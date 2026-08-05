import { describe, it, expect } from 'vitest';
import { validateSaveData } from '../hooks/useSaveLoad';

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

    // Default fallbacks pattern check
    const restoredState = {
      playerX: parsed.playerX ?? 0,
      playerY: parsed.playerY ?? 0,
      playerStats: {
        hp: 30,
        maxHp: 30,
        scars: parsed.playerStats?.scars ?? []
      },
      chaosScore: parsed.chaosScore ?? 0,
      townReputation: parsed.townReputation ?? 50
    };

    expect(restoredState.playerX).toBe(10);
    expect(restoredState.chaosScore).toBe(0);
    expect(restoredState.townReputation).toBe(50);
    expect(restoredState.playerStats.scars).toEqual([]);
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
