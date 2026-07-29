import { useEffect, useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { GameState } from '../types';

const DEFAULT_SAVE_KEY = 'shadow_over_oakhaven_save_v1';

export interface UseSaveLoadParams {
  gameStateRef: MutableRefObject<GameState>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage?: (text: string, type?: string) => void;
  autoSaveIntervalMs?: number;
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
        playerStats: gs.playerStats,
        equipmentInventory: gs.equipmentInventory,
        materialsInventory: gs.materialsInventory,
        equippedWeapon: gs.currentWeapon,
        equippedArmor: gs.equippedArmor,
        equippedHelmet: gs.equippedHelmet,
        equippedGloves: gs.equippedGloves,
        equippedBoots: gs.equippedBoots,
        equippedShield: gs.equippedShield,
        equippedAmulet: gs.equippedAmulet,
        currentChunkX: gs.currentChunkX,
        currentChunkY: gs.currentChunkY,
        chaosScore: gs.chaosScore,
        townReputation: gs.townReputation,
        dungeonDepth: gs.playerStats?.depth ?? 0,
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
      if (!parsed || typeof parsed !== 'object') return null;

      setGameState((prev) => ({
        ...prev,
        playerX: parsed.playerX ?? prev.playerX,
        playerY: parsed.playerY ?? prev.playerY,
        playerStats: {
          ...prev.playerStats,
          ...(parsed.playerStats || {}),
        },
        equipmentInventory: parsed.equipmentInventory ?? prev.equipmentInventory,
        materialsInventory: parsed.materialsInventory ?? prev.materialsInventory,
        currentWeapon: parsed.equippedWeapon ?? prev.currentWeapon,
        equippedArmor: parsed.equippedArmor ?? prev.equippedArmor,
        equippedHelmet: parsed.equippedHelmet ?? prev.equippedHelmet,
        equippedGloves: parsed.equippedGloves ?? prev.equippedGloves,
        equippedBoots: parsed.equippedBoots ?? prev.equippedBoots,
        equippedShield: parsed.equippedShield ?? prev.equippedShield,
        equippedAmulet: parsed.equippedAmulet ?? prev.equippedAmulet,
        currentChunkX: parsed.currentChunkX ?? prev.currentChunkX,
        currentChunkY: parsed.currentChunkY ?? prev.currentChunkY,
        chaosScore: parsed.chaosScore ?? prev.chaosScore,
        townReputation: parsed.townReputation ?? prev.townReputation,
      }));

      if (addLogMessage) {
        addLogMessage('📂 Game progress successfully loaded.', 'system');
      }
      return parsed;
    } catch (err) {
      console.warn('Failed to load game state from LocalStorage:', err);
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
