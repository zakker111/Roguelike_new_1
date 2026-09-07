import React, { useEffect, useRef } from 'react';
import { GameState, GameLogMessage } from '../types';

export interface UseWorldEventHandlersParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  isPlaying: boolean;
  formatGameTime: (minutes: number) => string;
}

export function useWorldEventHandlers({
  gameState,
  setGameState,
  isPlaying,
  formatGameTime,
}: UseWorldEventHandlersParams) {
  const allSessionLogsRef = useRef<GameLogMessage[]>([]);
  const allSessionStateSnapshotsRef = useRef<any[]>([]);
  const lastCapturedFingerprintRef = useRef<string>("");

  const resetSession = () => {
    allSessionLogsRef.current = [];
    allSessionStateSnapshotsRef.current = [];
    lastCapturedFingerprintRef.current = "";
  };

  // Check for Cat Lover Trait
  useEffect(() => {
    if (!gameState.spawnedCats) return;
    const cats = ['Jekku', 'Pulla', 'Alli', 'Leevi'];
    const hasAll = cats.every(c => gameState.spawnedCats?.includes(c));
    if (hasAll && !gameState.playerStats.hasCatLover) {
      setGameState(prev => {
        if (prev.playerStats.hasCatLover) return prev;
        return {
          ...prev,
          playerStats: {
            ...prev.playerStats,
            hasCatLover: true
          },
          logs: [
            ...prev.logs,
            {
              id: `cat_lover_${Date.now()}`,
              text: "🐈 [DEVELOPER MEMORIAL]: In memory of my cats, you have met them all! You have received the special trait 'Cat Lover' that grants +10 to Luck!",
              type: 'loot' as any,
              timestamp: 'TRAIT'
            }
          ]
        };
      });
    }
  }, [gameState.spawnedCats, gameState.playerStats.hasCatLover, setGameState]);

  // Sync all session logs for replay / download (bounded to last 500 entries)
  useEffect(() => {
    if (gameState.logs && gameState.logs.length > 0) {
      const seenIds = new Set(allSessionLogsRef.current.map((l) => l.id));
      const newLogs = gameState.logs.filter((l) => !seenIds.has(l.id));
      if (newLogs.length > 0) {
        const combined = [...allSessionLogsRef.current, ...newLogs];
        allSessionLogsRef.current = combined.length > 500 ? combined.slice(combined.length - 500) : combined;
      }
    }
  }, [gameState.logs]);

  // Record playthrough state snapshots (bounded to last 50 snapshots for session stability)
  useEffect(() => {
    if (!isPlaying) return;
    
    const fingerprint = `${gameState.playerStats.turnsPlayed}_${gameState.playerX}_${gameState.playerY}_${gameState.playerStats.depth}_${gameState.playerStats.hp}_${gameState.playerStats.mp}_${gameState.playerStats.gold}_${gameState.playerStats.xp}_${gameState.playerStats.level}_${gameState.currentWeapon?.id || ''}_${gameState.equippedArmor?.id || ''}_${gameState.equippedHelmet?.id || ''}_${gameState.equippedGloves?.id || ''}_${gameState.equippedBoots?.id || ''}_${gameState.equippedShield?.id || ''}_${gameState.equippedAmulet?.id || ''}_${gameState.logs?.length || 0}_${gameState.isOverworld}_${gameState.currentChunkX}_${gameState.currentChunkY}_${gameState.quests?.length || 0}_${gameState.followers?.length || 0}_${gameState.activeTradeNpcId || ''}`;

    if (fingerprint !== lastCapturedFingerprintRef.current) {
      lastCapturedFingerprintRef.current = fingerprint;
      const formatted = formatGameTime(gameState.gameTime);
      
      allSessionStateSnapshotsRef.current.push({
        turn: gameState.playerStats.turnsPlayed,
        timestamp: formatted,
        gameTimeStr: formatted,
        playerHP: gameState.playerStats.hp,
        playerMaxHP: gameState.playerStats.maxHp,
        gold: gameState.playerStats.gold,
        depth: gameState.playerStats.depth,
        isOverworld: gameState.isOverworld,
        state: {
          playerX: gameState.playerX,
          playerY: gameState.playerY,
          playerStats: { ...gameState.playerStats },
          isOverworld: gameState.isOverworld,
          currentChunkX: gameState.currentChunkX,
          currentChunkY: gameState.currentChunkY,
          logs: gameState.logs ? gameState.logs.slice(-50) : [],
          enemies: gameState.enemies ? gameState.enemies.length : 0,
        }
      });

      // Keep only the last 50 snapshots
      if (allSessionStateSnapshotsRef.current.length > 50) {
        allSessionStateSnapshotsRef.current = allSessionStateSnapshotsRef.current.slice(-50);
      }
    }
  }, [isPlaying, gameState, formatGameTime]);

  return {
    allSessionLogsRef,
    allSessionStateSnapshotsRef,
    resetSession,
  };
}

export default useWorldEventHandlers;
