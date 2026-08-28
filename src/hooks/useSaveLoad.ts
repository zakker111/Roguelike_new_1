import { useEffect, useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { GameState, EquipmentItem, CraftedWeapon } from '../types';

export const CURRENT_SAVE_VERSION = 'v7.7.4';
export const DEFAULT_SAVE_KEY = 'shadow_over_oakhaven_save_v1';

export interface UseSaveLoadParams {
  gameStateRef: MutableRefObject<GameState>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage?: (text: string, type?: string) => void;
  autoSaveIntervalMs?: number;
}

export interface SaveFilePayload {
  version: string;
  timestamp: number;
  playerX: number;
  playerY: number;
  playerZ?: number;
  isOverworld?: boolean;
  overworldZ?: number;
  currentChunkX: number;
  currentChunkY: number;
  playerStats: Record<string, any>;
  equipmentInventory: EquipmentItem[];
  inventoryMaterials: Record<string, number>;
  materialsInventory: Record<string, number>;
  inventoryCatalysts: Record<string, number>;
  equippedWeapon?: CraftedWeapon | EquipmentItem | null;
  equippedArmor?: EquipmentItem | null;
  equippedHelmet?: EquipmentItem | null;
  equippedGloves?: EquipmentItem | null;
  equippedBoots?: EquipmentItem | null;
  equippedShield?: EquipmentItem | null;
  equippedAmulet?: EquipmentItem | null;
  followers?: any[];
  quests?: any[];
  chaosScore?: number;
  townReputation?: number;
  dungeonDepth?: number;
  relics?: any[];
  unlockedRecipes?: string[];
  gameTime?: string;
  season?: string;
  weather?: string;
  customMapPins?: any[];
  attunedWaystones?: string[];
}

/**
 * Normalizes raw material representations (arrays, string lists, or objects) into a strict Record<string, number>
 */
export function normalizeMaterialStorage(rawMats: unknown): Record<string, number> {
  const result: Record<string, number> = {};
  if (!rawMats) return result;

  if (Array.isArray(rawMats)) {
    // Array of objects { id, count } or strings ['mat_wood', 'mat_wood']
    rawMats.forEach((item) => {
      if (typeof item === 'string') {
        result[item] = (result[item] || 0) + 1;
      } else if (item && typeof item === 'object') {
        const entry = item as Record<string, unknown>;
        const id = typeof entry.id === 'string' ? entry.id : typeof entry.materialId === 'string' ? entry.materialId : '';
        const count = typeof entry.count === 'number' && !isNaN(entry.count) ? entry.count : 1;
        if (id) {
          result[id] = (result[id] || 0) + count;
        }
      }
    });
  } else if (typeof rawMats === 'object') {
    // Standard key-value dict
    Object.entries(rawMats as Record<string, unknown>).forEach(([key, val]) => {
      const num = typeof val === 'number' && !isNaN(val) ? Math.max(0, Math.floor(val)) : 0;
      if (num > 0) {
        result[key] = num;
      }
    });
  }

  return result;
}

/**
 * Normalizes equipment objects and ensures durability integrity
 */
export function normalizeEquippedItem<T extends EquipmentItem | CraftedWeapon | null | undefined>(item: T): T {
  if (!item || typeof item !== 'object') return null as T;
  const clone = { ...item } as any;
  if (typeof clone.currentDurability !== 'number' || isNaN(clone.currentDurability)) {
    clone.currentDurability = clone.maxDurability || 50;
  }
  if (typeof clone.maxDurability !== 'number' || isNaN(clone.maxDurability)) {
    clone.maxDurability = 50;
  }
  clone.currentDurability = Math.max(0, Math.min(clone.maxDurability, clone.currentDurability));
  return clone as T;
}

/**
 * Robust Migration Engine: Converts any legacy, partial, or corrupted save payload into a safe modern GameState subset
 */
export function migrateSaveData(raw: unknown): SaveFilePayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('[useSaveLoad] Cannot migrate null or non-object save payload.');
  }

  const obj = raw as Record<string, any>;
  const version = typeof obj.version === 'string' ? obj.version : 'v1.0.0';

  // 1. Coordinates Sanitization
  let playerX = typeof obj.playerX === 'number' && !isNaN(obj.playerX) ? Math.floor(obj.playerX) : 15;
  let playerY = typeof obj.playerY === 'number' && !isNaN(obj.playerY) ? Math.floor(obj.playerY) : 15;
  playerX = Math.max(0, Math.min(128, playerX));
  playerY = Math.max(0, Math.min(128, playerY));

  const currentChunkX = typeof obj.currentChunkX === 'number' && !isNaN(obj.currentChunkX) ? Math.floor(obj.currentChunkX) : 0;
  const currentChunkY = typeof obj.currentChunkY === 'number' && !isNaN(obj.currentChunkY) ? Math.floor(obj.currentChunkY) : 0;

  // 2. Player Stats Sanitization & Default Backfilling
  const rawStats = obj.playerStats && typeof obj.playerStats === 'object' ? obj.playerStats : {};
  const maxHp = typeof rawStats.maxHp === 'number' && !isNaN(rawStats.maxHp) ? Math.max(1, rawStats.maxHp) : 40;
  const hp = typeof rawStats.hp === 'number' && !isNaN(rawStats.hp) ? Math.max(1, Math.min(maxHp, rawStats.hp)) : maxHp;
  const maxMp = typeof rawStats.maxMp === 'number' && !isNaN(rawStats.maxMp) ? Math.max(0, rawStats.maxMp) : 25;
  const mp = typeof rawStats.mp === 'number' && !isNaN(rawStats.mp) ? Math.max(0, Math.min(maxMp, rawStats.mp)) : maxMp;
  const gold = typeof rawStats.gold === 'number' && !isNaN(rawStats.gold) ? Math.max(0, Math.floor(rawStats.gold)) : 0;
  const level = typeof rawStats.level === 'number' && !isNaN(rawStats.level) ? Math.max(1, Math.floor(rawStats.level)) : 1;
  const xp = typeof rawStats.xp === 'number' && !isNaN(rawStats.xp) ? Math.max(0, Math.floor(rawStats.xp)) : 0;
  const depth = typeof rawStats.depth === 'number' && !isNaN(rawStats.depth) ? Math.max(0, Math.floor(rawStats.depth)) : (typeof obj.dungeonDepth === 'number' ? obj.dungeonDepth : 0);
  const turnsPlayed = typeof rawStats.turnsPlayed === 'number' && !isNaN(rawStats.turnsPlayed) ? Math.max(0, Math.floor(rawStats.turnsPlayed)) : 0;

  const playerStats = {
    ...rawStats,
    hp,
    maxHp,
    mp,
    maxMp,
    gold,
    level,
    xp,
    depth,
    turnsPlayed,
    scars: Array.isArray(rawStats.scars) ? rawStats.scars : [],
    attributes: {
      strength: 10,
      agility: 10,
      intelligence: 10,
      charisma: 10,
      luck: 10,
      ...(rawStats.attributes || {}),
    },
  };

  // 3. Materials & Catalysts Format Migration
  const materials = normalizeMaterialStorage(obj.inventoryMaterials || obj.materialsInventory);
  const catalysts = normalizeMaterialStorage(obj.inventoryCatalysts);

  // 4. Equipment Array & Paperdoll Normalization
  const equipmentInventory = Array.isArray(obj.equipmentInventory) 
    ? obj.equipmentInventory.map(item => normalizeEquippedItem(item)).filter(Boolean)
    : [];

  const equippedWeapon = normalizeEquippedItem(obj.equippedWeapon || obj.currentWeapon);
  const equippedArmor = normalizeEquippedItem(obj.equippedArmor);
  const equippedHelmet = normalizeEquippedItem(obj.equippedHelmet);
  const equippedGloves = normalizeEquippedItem(obj.equippedGloves);
  const equippedBoots = normalizeEquippedItem(obj.equippedBoots);
  const equippedShield = normalizeEquippedItem(obj.equippedShield);
  const equippedAmulet = normalizeEquippedItem(obj.equippedAmulet);

  // 5. Waystones & Custom Pins Validation
  const attunedWaystones = Array.isArray(obj.attunedWaystones) && obj.attunedWaystones.length > 0
    ? obj.attunedWaystones.filter((w: unknown) => typeof w === 'string')
    : ['waystone_0_0'];

  const customMapPins = Array.isArray(obj.customMapPins)
    ? obj.customMapPins.filter((p: unknown) => p && typeof p === 'object')
    : [];

  return {
    version: CURRENT_SAVE_VERSION,
    timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
    playerX,
    playerY,
    playerZ: typeof obj.playerZ === 'number' ? obj.playerZ : 0,
    isOverworld: typeof obj.isOverworld === 'boolean' ? obj.isOverworld : true,
    overworldZ: typeof obj.overworldZ === 'number' ? obj.overworldZ : 0,
    currentChunkX,
    currentChunkY,
    playerStats,
    equipmentInventory,
    inventoryMaterials: materials,
    materialsInventory: materials,
    inventoryCatalysts: catalysts,
    equippedWeapon,
    equippedArmor,
    equippedHelmet,
    equippedGloves,
    equippedBoots,
    equippedShield,
    equippedAmulet,
    followers: Array.isArray(obj.followers) ? obj.followers : [],
    quests: Array.isArray(obj.quests) ? obj.quests : [],
    chaosScore: typeof obj.chaosScore === 'number' && !isNaN(obj.chaosScore) ? Math.max(0, obj.chaosScore) : 0,
    townReputation: typeof obj.townReputation === 'number' && !isNaN(obj.townReputation) ? Math.max(0, Math.min(100, obj.townReputation)) : 50,
    dungeonDepth: depth,
    relics: Array.isArray(obj.relics) ? obj.relics : [],
    unlockedRecipes: Array.isArray(obj.unlockedRecipes) ? obj.unlockedRecipes : [],
    gameTime: typeof obj.gameTime === 'string' ? obj.gameTime : '12:00',
    season: typeof obj.season === 'string' ? obj.season : 'Summer',
    weather: typeof obj.weather === 'string' ? obj.weather : 'Clear',
    customMapPins,
    attunedWaystones,
  };
}

export function validateSaveData(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    throw new Error('[useSaveLoad] Save data is null or not a valid JSON object.');
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.playerX !== 'number' || typeof obj.playerY !== 'number') {
    throw new Error('[useSaveLoad] Save data missing valid player coordinate numbers (playerX, playerY).');
  }
  if (!obj.playerStats || typeof obj.playerStats !== 'object') {
    throw new Error('[useSaveLoad] Save data missing playerStats object.');
  }
  return true;
}

export function useSaveLoad({
  gameStateRef,
  setGameState,
  addLogMessage,
  autoSaveIntervalMs = 60000, // Default auto-save every 60 seconds
}: UseSaveLoadParams) {

  /**
   * Save current GameState into localStorage
   */
  const saveGame = useCallback((slotKey: string = DEFAULT_SAVE_KEY) => {
    try {
      const gs = gameStateRef.current;
      if (!gs) return false;

      const payload: SaveFilePayload = {
        version: CURRENT_SAVE_VERSION,
        timestamp: Date.now(),
        playerX: gs.playerX,
        playerY: gs.playerY,
        playerZ: (gs as any).playerZ ?? 0,
        isOverworld: gs.isOverworld ?? true,
        overworldZ: (gs as any).overworldZ ?? 0,
        currentChunkX: gs.currentChunkX,
        currentChunkY: gs.currentChunkY,
        playerStats: gs.playerStats,
        equipmentInventory: gs.equipmentInventory || [],
        inventoryMaterials: gs.inventoryMaterials || {},
        materialsInventory: gs.inventoryMaterials || {},
        inventoryCatalysts: gs.inventoryCatalysts || {},
        equippedWeapon: gs.currentWeapon,
        equippedArmor: gs.equippedArmor,
        equippedHelmet: gs.equippedHelmet,
        equippedGloves: gs.equippedGloves,
        equippedBoots: gs.equippedBoots,
        equippedShield: gs.equippedShield,
        equippedAmulet: gs.equippedAmulet,
        followers: gs.followers || [],
        quests: gs.quests || [],
        chaosScore: gs.chaosScore,
        townReputation: gs.townReputation,
        dungeonDepth: gs.playerStats?.depth ?? 0,
        relics: (gs as any).relics || gs.sanctumRelics || [],
        unlockedRecipes: (gs as any).unlockedRecipes || [],
        gameTime: typeof gs.gameTime === 'string' ? gs.gameTime : String(gs.gameTime ?? '12:00'),
        season: gs.season,
        weather: gs.weather,
        customMapPins: gs.customMapPins || [],
        attunedWaystones: gs.attunedWaystones || ['waystone_0_0'],
      };

      const serialized = JSON.stringify(payload);
      localStorage.setItem(slotKey, serialized);
      if (addLogMessage) {
        addLogMessage('💾 Game progress saved to local storage.', 'system');
      }
      return true;
    } catch (err) {
      console.warn('Failed to save game state to LocalStorage:', err);
      return false;
    }
  }, [gameStateRef, addLogMessage]);

  /**
   * Load GameState from localStorage with automatic migration
   */
  const loadGame = useCallback((slotKey: string = DEFAULT_SAVE_KEY) => {
    try {
      const raw = localStorage.getItem(slotKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      
      // Auto-migrate legacy or partial save payloads
      const migrated = migrateSaveData(parsed);

      const mats = migrated.inventoryMaterials || {};

      setGameState((prev) => ({
        ...prev,
        playerX: migrated.playerX,
        playerY: migrated.playerY,
        playerZ: migrated.playerZ ?? 0,
        isOverworld: migrated.isOverworld ?? true,
        overworldZ: migrated.overworldZ ?? 0,
        currentChunkX: migrated.currentChunkX,
        currentChunkY: migrated.currentChunkY,
        playerStats: {
          ...prev.playerStats,
          ...migrated.playerStats,
        },
        equipmentInventory: migrated.equipmentInventory,
        inventoryMaterials: mats,
        inventoryCatalysts: migrated.inventoryCatalysts,
        currentWeapon: (migrated.equippedWeapon as CraftedWeapon) || prev.currentWeapon,
        equippedArmor: migrated.equippedArmor,
        equippedHelmet: migrated.equippedHelmet,
        equippedGloves: migrated.equippedGloves,
        equippedBoots: migrated.equippedBoots,
        equippedShield: migrated.equippedShield,
        equippedAmulet: migrated.equippedAmulet,
        followers: migrated.followers || [],
        quests: migrated.quests || [],
        chaosScore: migrated.chaosScore ?? 0,
        townReputation: migrated.townReputation ?? 50,
        relics: migrated.relics || [],
        unlockedRecipes: migrated.unlockedRecipes || [],
        gameTime: typeof migrated.gameTime === 'number' ? migrated.gameTime : 720,
        season: (migrated.season ? migrated.season.toLowerCase() : 'summer') as any,
        weather: (migrated.weather ? migrated.weather.toLowerCase() : 'clear') as any,
        customMapPins: migrated.customMapPins || [],
        attunedWaystones: migrated.attunedWaystones || ['waystone_0_0'],
      }));

      if (addLogMessage) {
        addLogMessage('📂 Game progress successfully loaded.', 'system');
      }
      return migrated;
    } catch (err) {
      console.error('[DEV ERROR] Failed to load game state from LocalStorage due to corruption or validation failure:', err);
      if (addLogMessage) {
        addLogMessage('⚠️ Failed to load save file: save data is corrupted or invalid.', 'danger');
      }
      return null;
    }
  }, [setGameState, addLogMessage]);

  /**
   * Import save data from raw JSON string with full migration
   */
  const importSaveFromString = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const migrated = migrateSaveData(parsed);
      localStorage.setItem(DEFAULT_SAVE_KEY, JSON.stringify(migrated));
      return loadGame(DEFAULT_SAVE_KEY);
    } catch (err) {
      console.error('[DEV ERROR] Import save from string failed:', err);
      if (addLogMessage) {
        addLogMessage('⚠️ Failed to import save data: invalid JSON structure.', 'danger');
      }
      return null;
    }
  }, [loadGame, addLogMessage]);

  /**
   * Export Save File as JSON download
   */
  const exportSaveToFile = useCallback((filename = 'sunder_sanctum_save.json') => {
    try {
      const gs = gameStateRef.current;
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      if (addLogMessage) {
        addLogMessage('📥 Save file exported to your device.', 'system');
      }
    } catch (err) {
      console.error('Failed to export save file:', err);
    }
  }, [gameStateRef, addLogMessage]);

  /**
   * Setup Periodic Auto-Save Timer
   */
  useEffect(() => {
    if (autoSaveIntervalMs <= 0) return;

    const interval = setInterval(() => {
      saveGame(DEFAULT_SAVE_KEY);
    }, autoSaveIntervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [autoSaveIntervalMs, saveGame]);

  return {
    saveGame,
    loadGame,
    importSaveFromString,
    exportSaveToFile,
  };
}
