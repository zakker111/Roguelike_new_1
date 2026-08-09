import { useEffect, useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { GameState } from '../types';

const DEFAULT_SAVE_KEY = 'shadow_over_oakhaven_save_v1';

export interface UseSaveLoadParams {
  gameStateRef: MutableRefObject<GameState>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage?: (text: string, type?: string) => void;
  autoSaveIntervalMs?: number;
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
      if (!gs || !gs.isPlaying) return false;

      const serialized = JSON.stringify({
        version: 'v4.0.3',
        timestamp: Date.now(),
        playerX: gs.playerX,
        playerY: gs.playerY,
        playerZ: gs.playerZ ?? 0,
        isOverworld: gs.isOverworld ?? true,
        overworldZ: gs.overworldZ ?? 0,
        currentChunkX: gs.currentChunkX,
        currentChunkY: gs.currentChunkY,
        playerStats: gs.playerStats,
        equipmentInventory: gs.equipmentInventory || [],
        inventoryMaterials: gs.inventoryMaterials || {},
        materialsInventory: gs.materialsInventory || gs.inventoryMaterials || {},
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
        relics: gs.relics || [],
        unlockedRecipes: gs.unlockedRecipes || [],
        gameTime: gs.gameTime,
        season: gs.season,
        weather: gs.weather,
      });

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
   * Load GameState from localStorage
   */
  const loadGame = useCallback((slotKey: string = DEFAULT_SAVE_KEY) => {
    try {
      const raw = localStorage.getItem(slotKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      
      // Validate save integrity before applying
      validateSaveData(parsed);

      const mats = parsed.inventoryMaterials || parsed.materialsInventory || {};

      setGameState((prev) => ({
        ...prev,
        playerX: parsed.playerX ?? prev.playerX,
        playerY: parsed.playerY ?? prev.playerY,
        playerZ: parsed.playerZ ?? prev.playerZ ?? 0,
        isOverworld: parsed.isOverworld ?? prev.isOverworld ?? true,
        overworldZ: parsed.overworldZ ?? prev.overworldZ ?? 0,
        currentChunkX: parsed.currentChunkX ?? prev.currentChunkX,
        currentChunkY: parsed.currentChunkY ?? prev.currentChunkY,
        playerStats: {
          ...prev.playerStats,
          ...(parsed.playerStats || {}),
        },
        equipmentInventory: parsed.equipmentInventory ?? prev.equipmentInventory,
        inventoryMaterials: mats,
        materialsInventory: mats,
        inventoryCatalysts: parsed.inventoryCatalysts ?? prev.inventoryCatalysts ?? {},
        currentWeapon: parsed.equippedWeapon ?? prev.currentWeapon,
        equippedArmor: parsed.equippedArmor ?? prev.equippedArmor,
        equippedHelmet: parsed.equippedHelmet ?? prev.equippedHelmet,
        equippedGloves: parsed.equippedGloves ?? prev.equippedGloves,
        equippedBoots: parsed.equippedBoots ?? prev.equippedBoots,
        equippedShield: parsed.equippedShield ?? prev.equippedShield,
        equippedAmulet: parsed.equippedAmulet ?? prev.equippedAmulet,
        followers: parsed.followers ?? prev.followers ?? [],
        quests: parsed.quests ?? prev.quests ?? [],
        chaosScore: parsed.chaosScore ?? prev.chaosScore,
        townReputation: parsed.townReputation ?? prev.townReputation,
        relics: parsed.relics ?? prev.relics ?? [],
        unlockedRecipes: parsed.unlockedRecipes ?? prev.unlockedRecipes ?? [],
        gameTime: parsed.gameTime ?? prev.gameTime,
        season: parsed.season ?? prev.season,
        weather: parsed.weather ?? prev.weather,
      }));

      if (addLogMessage) {
        addLogMessage('📂 Game progress successfully loaded.', 'system');
      }
      return parsed;
    } catch (err) {
      console.error('[DEV ERROR] Failed to load game state from LocalStorage due to corruption or validation failure:', err);
      if (addLogMessage) {
        addLogMessage('⚠️ Failed to load save file: save data is corrupted or invalid.', 'danger');
      }
      return null;
    }
  }, [setGameState, addLogMessage]);

  /**
   * Export Save File as JSON download
   */
  const exportSaveToFile = useCallback((filename = 'shadow_over_oakhaven_save.json') => {
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
    exportSaveToFile,
  };
}
