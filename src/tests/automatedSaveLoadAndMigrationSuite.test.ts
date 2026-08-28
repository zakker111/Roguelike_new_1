import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  migrateSaveData, 
  validateSaveData, 
  normalizeMaterialStorage, 
  normalizeEquippedItem, 
  CURRENT_SAVE_VERSION,
  DEFAULT_SAVE_KEY,
  SaveFilePayload
} from '../hooks/useSaveLoad';
import { exportAndDownloadGameLogs } from '../utils/logExporter';
import { GameState, GameLogMessage } from '../types';

describe('Phase 8: Save/Load & State Migration Resilience Matrix', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('8.1 Multi-Version Schema Migration Engine', () => {
    it('migrates v1.0.0 minimalist save to modern schema v7.7.4', () => {
      const v1Payload = {
        version: 'v1.0.0',
        playerX: 12,
        playerY: 18,
        playerStats: {
          hp: 25,
          maxHp: 30,
          gold: 50,
        },
      };

      const migrated = migrateSaveData(v1Payload);

      expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
      expect(migrated.playerX).toBe(12);
      expect(migrated.playerY).toBe(18);
      expect(migrated.playerStats.hp).toBe(25);
      expect(migrated.playerStats.maxHp).toBe(30);
      expect(migrated.playerStats.mp).toBe(25); // Default maxMp backfill
      expect(migrated.playerStats.attributes.strength).toBe(10);
      expect(migrated.attunedWaystones).toEqual(['waystone_0_0']);
      expect(migrated.chaosScore).toBe(0);
      expect(migrated.townReputation).toBe(50);
      expect(migrated.equipmentInventory).toEqual([]);
    });

    it('migrates v2.0.0 save with array materials to normalized dictionary', () => {
      const v2Payload = {
        version: 'v2.0.0',
        playerX: 15,
        playerY: 15,
        playerStats: { hp: 40, maxHp: 40 },
        inventoryMaterials: [
          { id: 'mat_wood', count: 12 },
          { id: 'mat_iron', count: 4 },
          { materialId: 'mat_copper', count: 6 },
        ],
        inventoryCatalysts: [
          { id: 'cat_fire', count: 2 }
        ],
        equipmentInventory: [
          { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', currentDurability: 45, maxDurability: 50 }
        ]
      };

      const migrated = migrateSaveData(v2Payload);

      expect(migrated.inventoryMaterials).toEqual({
        mat_wood: 12,
        mat_iron: 4,
        mat_copper: 6,
      });
      expect(migrated.inventoryCatalysts).toEqual({
        cat_fire: 2,
      });
      expect(migrated.equipmentInventory).toHaveLength(1);
      expect(migrated.equipmentInventory[0].id).toBe('iron_sword');
      expect(migrated.equipmentInventory[0].currentDurability).toBe(45);
    });

    it('migrates v3.0.0 and v4.0.0 saves with missing depth, custom pins, and recipe lists', () => {
      const v4Payload = {
        version: 'v4.0.3',
        playerX: 20,
        playerY: 25,
        playerStats: {
          hp: 55,
          maxHp: 60,
          gold: 500,
          depth: 3,
          scars: ['battle_scar_1'],
        },
        chaosScore: 45,
        townReputation: 80,
      };

      const migrated = migrateSaveData(v4Payload);

      expect(migrated.dungeonDepth).toBe(3);
      expect(migrated.playerStats.scars).toEqual(['battle_scar_1']);
      expect(migrated.chaosScore).toBe(45);
      expect(migrated.townReputation).toBe(80);
      expect(migrated.customMapPins).toEqual([]);
      expect(migrated.unlockedRecipes).toEqual([]);
    });

    it('migrates future and unversioned payloads safely without breaking', () => {
      const unversionedPayload = {
        playerX: 30,
        playerY: 35,
        playerStats: { hp: 50, maxHp: 50 },
      };

      const migrated = migrateSaveData(unversionedPayload);
      expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
      expect(migrated.playerX).toBe(30);
      expect(migrated.playerY).toBe(35);
    });
  });

  describe('8.2 Corrupted & Out-Of-Bounds State Sanitization', () => {
    it('clamps out-of-bounds player coordinates to valid world grid boundaries', () => {
      const outOfBoundsPayload = {
        playerX: -999,
        playerY: 500,
        playerStats: { hp: 30, maxHp: 30 },
      };

      const migrated = migrateSaveData(outOfBoundsPayload);
      expect(migrated.playerX).toBe(0);
      expect(migrated.playerY).toBe(128);
    });

    it('recovers from NaN coordinates and stats gracefully', () => {
      const nanPayload = {
        playerX: NaN,
        playerY: NaN,
        playerStats: {
          hp: NaN,
          maxHp: NaN,
          gold: NaN,
        },
        chaosScore: NaN,
        townReputation: NaN,
      };

      const migrated = migrateSaveData(nanPayload);
      expect(migrated.playerX).toBe(15);
      expect(migrated.playerY).toBe(15);
      expect(migrated.playerStats.hp).toBe(40);
      expect(migrated.playerStats.maxHp).toBe(40);
      expect(migrated.playerStats.gold).toBe(0);
      expect(migrated.chaosScore).toBe(0);
      expect(migrated.townReputation).toBe(50);
    });

    it('sanitizes equipment items with missing or invalid durabilities', () => {
      const corruptedGear = {
        id: 'mystic_robe',
        name: 'Mystic Robe',
        type: 'armor',
        currentDurability: NaN,
        maxDurability: undefined as any,
      };

      const normalized = normalizeEquippedItem(corruptedGear as any);
      expect(normalized.currentDurability).toBe(50);
      expect(normalized.maxDurability).toBe(50);
    });

    it('throws expected diagnostic error on non-object save inputs', () => {
      expect(() => migrateSaveData(null)).toThrow('[useSaveLoad] Cannot migrate null or non-object save payload.');
      expect(() => migrateSaveData('invalid string')).toThrow('[useSaveLoad] Cannot migrate null or non-object save payload.');
      expect(() => migrateSaveData(undefined)).toThrow('[useSaveLoad] Cannot migrate null or non-object save payload.');
    });
  });

  describe('8.3 Save Import, Export & LocalStorage Persistence', () => {
    it('serializes and round-trips a complete game state through JSON', () => {
      const sampleState: SaveFilePayload = {
        version: CURRENT_SAVE_VERSION,
        timestamp: 1700000000000,
        playerX: 18,
        playerY: 22,
        currentChunkX: 1,
        currentChunkY: -1,
        playerStats: {
          hp: 75,
          maxHp: 80,
          mp: 40,
          maxMp: 50,
          gold: 1250,
          level: 5,
          xp: 850,
          depth: 2,
          turnsPlayed: 320,
          attributes: { strength: 14, agility: 12, intelligence: 10, charisma: 10, luck: 11 },
          scars: ['burn_scar'],
        },
        equipmentInventory: [
          { id: 'axe_iron', name: 'Iron Hatchet', type: 'weapon', currentDurability: 40, maxDurability: 50 } as any
        ],
        inventoryMaterials: { mat_wood: 25, mat_iron: 8 },
        materialsInventory: { mat_wood: 25, mat_iron: 8 },
        inventoryCatalysts: { cat_lightning: 1 },
        equippedWeapon: { id: 'spear_bronze', name: 'Bronze Spear', type: 'weapon', currentDurability: 50, maxDurability: 50 } as any,
        equippedArmor: { id: 'leather_armor', name: 'Leather Tunic', type: 'armor', currentDurability: 45, maxDurability: 50 } as any,
        followers: [],
        quests: [],
        chaosScore: 15,
        townReputation: 65,
        dungeonDepth: 2,
        relics: ['relic_phoenix_feather'],
        unlockedRecipes: ['recipe_steel_sword'],
        gameTime: '14:30',
        season: 'Autumn',
        weather: 'Rain',
        customMapPins: [{ id: 'pin_1', x: 20, y: 20, label: 'Secret Cave' }],
        attunedWaystones: ['waystone_0_0', 'waystone_1_-1'],
      };

      const serialized = JSON.stringify(sampleState);
      expect(typeof serialized).toBe('string');

      const parsed = JSON.parse(serialized);
      const migrated = migrateSaveData(parsed);

      expect(migrated.playerStats.gold).toBe(1250);
      expect(migrated.relics).toContain('relic_phoenix_feather');
      expect(migrated.unlockedRecipes).toContain('recipe_steel_sword');
      expect(migrated.attunedWaystones).toHaveLength(2);
      expect(migrated.inventoryMaterials.mat_wood).toBe(25);
    });
  });

  describe('8.4 Run Logs, Replay Telemetry & Dev Log Exporter', () => {
    it('formats adventure log and telemetry simulation replay payload accurately', () => {
      const mockGameState: Partial<GameState> = {
        playerX: 15,
        playerY: 15,
        currentWeapon: { id: 'axe_steel', name: 'Steel Battleaxe', baseType: 'Hammer' as any, materialUsed: {} as any, catalystUsed: {} as any, damage: 15, critChance: 0.1, range: 1, manaCost: 0, effectDescription: '', color: '#fff', durability: 50, maxDurability: 50 },
        playerStats: {
          hp: 60,
          maxHp: 60,
          mp: 30,
          maxMp: 30,
          gold: 320,
          level: 4,
          xp: 450,
          depth: 2,
          turnsPlayed: 150,
          realTimeSeconds: 420,
          exhaustion: 5,
        } as any,
        logs: [],
      };

      const mockLogs: GameLogMessage[] = [
        { id: 'log_1', text: 'Entered Oakhaven Town Center.', type: 'system', timestamp: '12:00:00' },
        { id: 'log_2', text: 'You struck Goblin Scout for [14 DMG · Steel Battleaxe].', type: 'combat', timestamp: '12:00:05' },
        { id: 'log_3', text: 'Found [50 Gold] in an ancient chest!', type: 'loot', timestamp: '12:00:12' },
        { id: 'log_4', text: 'Crafted [Iron Plated Gauntlets] at the forge.', type: 'craft', timestamp: '12:00:20' },
      ];

      const mockSnapshots = [
        { turn: 1, gameTimeStr: '12:00', state: mockGameState as GameState },
        { turn: 2, gameTimeStr: '12:01', state: mockGameState as GameState },
      ];

      // Export logs without throwing in headless Node test environment
      expect(() => {
        exportAndDownloadGameLogs({
          gameState: mockGameState as GameState,
          sessionLogs: mockLogs,
          sessionSnapshots: mockSnapshots,
        });
      }).not.toThrow();
    });

    it('parses embedded replay telemetry blocks from exported text files cleanly', () => {
      const exportedFileContent = `
======================================================================
                SUNDER SANCTUM PLAYTHROUGH ADVENTURE LOGS
======================================================================
Time of Demise/Victory: 8/26/2026, 12:00:00 PM
World Seed:       1337
Floors Cleared:   3
Turns Kept:       210
Gold Plundered:   450 Gold coins
Final Masterpiece: Silver Rapier
----------------------------------------------------------------------

CHRONOLOGICAL RUN JOURNAL:
[12:00:01] [SYSTEM] Welcome to Sunder Sanctum.
[12:00:15] [COMBAT] You struck Skeleton Warrior for [18 DMG · Silver Rapier].
[12:00:30] [LOOT] Acquired 150 Gold coins.

======================================================================
                 --- COMPREHENSIVE SIMULATOR REPLAY DATA ---          
======================================================================
{
  "appletId": "e743f047-96de-4fc7-8cf6-cc907f6ee5bd",
  "gameName": "Sunder Sanctum",
  "seed": 1337,
  "finalStats": {
    "depth": 3,
    "turnsPlayed": 210,
    "gold": 450,
    "level": 5,
    "hp": 55,
    "maxHp": 60
  },
  "journalLogsCount": 3,
  "snapshotsCount": 2,
  "snapshots": [
    { "turn": 1, "gameTimeStr": "12:00", "state": {} },
    { "turn": 2, "gameTimeStr": "12:01", "state": {} }
  ]
}
======================================================================
                   --- END OF SIMULATOR REPLAY DATA ---               
======================================================================
`;

      const startMarker = "--- COMPREHENSIVE SIMULATOR REPLAY DATA ---";
      const endMarker = "--- END OF SIMULATOR REPLAY DATA ---";

      let searchSource = exportedFileContent;
      const startIdx = exportedFileContent.indexOf(startMarker);
      if (startIdx !== -1) {
        const afterStart = exportedFileContent.substring(startIdx + startMarker.length);
        const endIdx = afterStart.indexOf(endMarker);
        searchSource = endIdx !== -1 ? afterStart.substring(0, endIdx) : afterStart;
      }

      const firstBrace = searchSource.indexOf('{');
      const lastBrace = searchSource.lastIndexOf('}');
      const jsonText = searchSource.substring(firstBrace, lastBrace + 1).trim();
      const telemetry = JSON.parse(jsonText);

      expect(telemetry.gameName).toBe("Sunder Sanctum");
      expect(telemetry.seed).toBe(1337);
      expect(telemetry.finalStats.depth).toBe(3);
      expect(telemetry.finalStats.gold).toBe(450);
      expect(telemetry.snapshots).toHaveLength(2);
    });
  });
});
