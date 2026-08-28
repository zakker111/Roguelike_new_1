import { Dispatch, SetStateAction, MutableRefObject, useCallback } from 'react';
import { GameState, TileType, DungeonLevelState, Enemy, DungeonProp, Follower, OverworldChunk } from '../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT, findStairsOrWalkablePosition } from '../utils/gameUtils';
import { computeFOV } from '../utils/ai';
import { generateOverworldChunk } from '../utils/overworld';
import { generateLevel } from '../utils/dungeon';

export interface UsePlayerMovementParams {
  gameStateRef: MutableRefObject<GameState>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
  executeEnemiesTurn: (px: number, py: number) => void;
  setActiveTab: Dispatch<SetStateAction<'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary'>>;
  hasEquippedTrait: (gs: GameState, traitKey: string) => boolean;
  spawnFollowersOnLevelLoadByReset: (enemies: Enemy[], followers: Follower[], targetX: number, targetY: number, map: TileType[][], activeCompanionQuestsList?: any[]) => Enemy[];
  generateDungeonProps: (map: TileType[][], depth: number) => DungeonProp[];
}

export function usePlayerMovement({
  gameStateRef,
  setGameState,
  addLogMessage,
  playSound,
  setActiveTab,
  spawnFollowersOnLevelLoadByReset,
  generateDungeonProps,
}: UsePlayerMovementParams) {

  /**
   * Climb stairs up from Depth 1 back to the Overworld
   */
  const climbStairsUpToOverworld = useCallback(() => {
    const gameState = gameStateRef.current;
    if (gameState.isOverworld || gameState.playerStats.depth !== 1) {
      addLogMessage(`❌ There are no overworld stairs here. You are too deep in the dungeon.`, 'system');
      return;
    }

    playSound('levelUp');
    addLogMessage(`🪜 You climbed back out of the cave depths into the fresh air of the Overworld!`, 'system');

    setGameState((prev) => {
      const exChunkX = prev.dungeonEntranceChunkX ?? 0;
      const exChunkY = prev.dungeonEntranceChunkY ?? 0;
      const exPlayerX = prev.dungeonEntrancePlayerX ?? 25;
      const exPlayerY = prev.dungeonEntrancePlayerY ?? 15;

      // Save current Depth 1 dungeon state
      const currentDepth = prev.playerStats.depth;
      const key = `${exChunkX},${exChunkY}_depth-${currentDepth}`;

      const saved: DungeonLevelState = {
        depth: currentDepth,
        chunkX: exChunkX,
        chunkY: exChunkY,
        map: prev.map,
        discovered: prev.discovered,
        visible: prev.visible,
        enemies: prev.enemies,
        traps: prev.traps,
        chests: prev.chests,
        lootPiles: prev.lootPiles || [],
        corpses: prev.corpses || [],
        bloodSplatters: prev.bloodSplatters || [],
        props: prev.dungeonProps || [],
      };

      const updatedDungeonLevels = {
        ...prev.dungeonLevels,
        [key]: saved,
      };

      const targetChunkKey = `${exChunkX},${exChunkY}`;
      let targetChunk = prev.overworldChunks[targetChunkKey];
      let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
      let nextOverworldChunks = { ...prev.overworldChunks };

      if (!targetChunk) {
        targetChunk = generateOverworldChunk(exChunkX, exChunkY, LEVEL_WIDTH, LEVEL_HEIGHT, nextSpawnedCats, false, prev.playerStats, prev.currentWeapon);
        targetChunk.npcs.forEach(n => {
          if (n.id?.startsWith('npc_cat_')) {
            const catName = n.name.split(' (')[0];
            if (!nextSpawnedCats.includes(catName)) {
              nextSpawnedCats.push(catName);
            }
          }
        });
        nextOverworldChunks[targetChunkKey] = targetChunk;
      }

      const fov = computeFOV(exPlayerX, exPlayerY, targetChunk.map, 6);
      const discovered = targetChunk.map.map((row, y) =>
        row.map((cell, x) => ((targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
      );

      return {
        ...prev,
        isOverworld: true,
        isArena: false,
        currentChunkX: exChunkX,
        currentChunkY: exChunkY,
        playerX: exPlayerX,
        playerY: exPlayerY,
        map: targetChunk.map,
        discovered: discovered,
        visible: fov,
        enemies: spawnFollowersOnLevelLoadByReset(targetChunk.enemies, prev.followers, exPlayerX, exPlayerY, targetChunk.map, prev.activeCompanionQuests),
        traps: targetChunk.traps,
        chests: targetChunk.chests,
        npcs: targetChunk.npcs,
        lootPiles: targetChunk.lootPiles || [],
        corpses: [],
        bloodSplatters: [],
        dungeonProps: [],
        dungeonLevels: updatedDungeonLevels,
        overworldChunks: nextOverworldChunks,
        spawnedCats: nextSpawnedCats,
        playerStats: {
          ...prev.playerStats,
          depth: 0,
        }
      };
    });

    setActiveTab('dungeon');
    setTimeout(() => {
      document.getElementById('dungeon-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, [gameStateRef, setGameState, addLogMessage, playSound, setActiveTab]);

  /**
   * Climb back up to previous depth in abyss
   */
  const climbToPreviousDepth = useCallback(() => {
    const gameState = gameStateRef.current;
    if (gameState.isOverworld || gameState.playerStats.depth <= 1) {
      addLogMessage(`❌ You cannot climb to a previous depth.`, 'system');
      return;
    }

    playSound('levelUp');
    const nextDepth = gameState.playerStats.depth - 1;
    addLogMessage(`🪜 You climbed back up the stairs to Abyss Floor ${nextDepth}.`, 'system');

    setGameState((prev) => {
      const chunkX = prev.dungeonEntranceChunkX ?? prev.currentChunkX;
      const chunkY = prev.dungeonEntranceChunkY ?? prev.currentChunkY;
      const currentDepth = prev.playerStats.depth;
      const key = `${chunkX},${chunkY}_depth-${currentDepth}`;

      const saved: DungeonLevelState = {
        depth: currentDepth,
        chunkX,
        chunkY,
        map: prev.map,
        discovered: prev.discovered,
        visible: prev.visible,
        enemies: prev.enemies,
        traps: prev.traps,
        chests: prev.chests,
        lootPiles: prev.lootPiles || [],
        corpses: prev.corpses || [],
        bloodSplatters: prev.bloodSplatters || [],
        props: prev.dungeonProps || [],
      };

      const updatedDungeonLevels = {
        ...prev.dungeonLevels,
        [key]: saved,
      };

      const prevKey = `${chunkX},${chunkY}_depth-${nextDepth}`;
      const existing = updatedDungeonLevels[prevKey];

      if (existing) {
        const { x: stairsDownX, y: stairsDownY } = findStairsOrWalkablePosition(existing.map, TileType.StairsDown, `Dungeon Depth ${nextDepth}`);

        const syncedEnemies = spawnFollowersOnLevelLoadByReset(
          existing.enemies,
          prev.followers,
          stairsDownX,
          stairsDownY,
          existing.map,
          prev.activeCompanionQuests
        );

        const fov = computeFOV(stairsDownX, stairsDownY, existing.map, 6);
        const discovered = existing.map.map((row, y) =>
          row.map((cell, x) => (existing.discovered?.[y]?.[x] || fov?.[y]?.[x] || false))
        );

        return {
          ...prev,
          playerX: stairsDownX,
          playerY: stairsDownY,
          map: existing.map,
          visible: fov,
          discovered: discovered,
          enemies: syncedEnemies,
          traps: existing.traps,
          chests: existing.chests,
          lootPiles: existing.lootPiles || [],
          corpses: existing.corpses || [],
          bloodSplatters: existing.bloodSplatters || [],
          dungeonProps: existing.props || [],
          dungeonLevels: updatedDungeonLevels,
          playerStats: {
            ...prev.playerStats,
            depth: nextDepth,
          },
        };
      } else {
        const prevLvl = generateLevel(
          LEVEL_WIDTH,
          LEVEL_HEIGHT,
          nextDepth,
          prev.playerStats.turnsPlayed,
          prev.playerStats.realTimeSeconds,
          prev.playerStats,
          prev.currentWeapon,
          prev.defeatedEnemiesCount,
          prev.clearedCamps?.length || 0
        );

        const fov = computeFOV(prevLvl.playerX, prevLvl.playerY, prevLvl.map, 6);
        const discovered = prevLvl.map.map((row, y) => row.map((_, x) => fov[y][x]));
        const props = generateDungeonProps(prevLvl.map, nextDepth);

        return {
          ...prev,
          playerX: prevLvl.playerX,
          playerY: prevLvl.playerY,
          map: prevLvl.map,
          visible: fov,
          discovered: discovered,
          enemies: prevLvl.enemies,
          traps: prevLvl.traps,
          chests: prevLvl.chests,
          lootPiles: [],
          corpses: [],
          bloodSplatters: [],
          dungeonProps: props,
          dungeonLevels: updatedDungeonLevels,
          playerStats: {
            ...prev.playerStats,
            depth: nextDepth,
          },
        };
      }
    });

    setActiveTab('dungeon');
    setTimeout(() => {
      document.getElementById('dungeon-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, [gameStateRef, setGameState, addLogMessage, playSound, setActiveTab]);

  /**
   * Advance down to next depth in dungeon
   */
  const advanceToNextDepth = useCallback(() => {
    playSound('levelUp');
    const gameState = gameStateRef.current;
    const nextDepth = gameState.playerStats.depth + 1;
    addLogMessage(`🪜 You descended deeper into the dark abyss... Floor ${nextDepth}! Spikes, traps, and demonic forge pieces await!`, 'system');

    setGameState((prev) => {
      const chunkX = prev.dungeonEntranceChunkX ?? prev.currentChunkX;
      const chunkY = prev.dungeonEntranceChunkY ?? prev.currentChunkY;
      const currentDepth = prev.playerStats.depth;
      const key = `${chunkX},${chunkY}_depth-${currentDepth}`;

      const saved: DungeonLevelState = {
        depth: currentDepth,
        chunkX,
        chunkY,
        map: prev.map,
        discovered: prev.discovered,
        visible: prev.visible,
        enemies: prev.enemies,
        traps: prev.traps,
        chests: prev.chests,
        lootPiles: prev.lootPiles || [],
        corpses: prev.corpses || [],
        bloodSplatters: prev.bloodSplatters || [],
        props: prev.dungeonProps || [],
      };

      const nextDungeonLevels = {
        ...prev.dungeonLevels,
        [key]: saved,
      };

      const nextKey = `${chunkX},${chunkY}_depth-${nextDepth}`;
      const existing = nextDungeonLevels[nextKey];

      if (existing) {
        const { x: stairsUpX, y: stairsUpY } = findStairsOrWalkablePosition(existing.map, TileType.StairsUp, `Dungeon Depth ${nextDepth}`);

        const syncedEnemies = spawnFollowersOnLevelLoadByReset(
          existing.enemies,
          prev.followers,
          stairsUpX,
          stairsUpY,
          existing.map,
          prev.activeCompanionQuests
        );

        const fov = computeFOV(stairsUpX, stairsUpY, existing.map, 6);
        const discovered = existing.map.map((row, y) =>
          row.map((cell, x) => (existing.discovered?.[y]?.[x] || fov?.[y]?.[x] || false))
        );

        return {
          ...prev,
          playerX: stairsUpX,
          playerY: stairsUpY,
          map: existing.map,
          visible: fov,
          discovered: discovered,
          enemies: syncedEnemies,
          traps: existing.traps,
          chests: existing.chests,
          lootPiles: existing.lootPiles || [],
          corpses: existing.corpses || [],
          bloodSplatters: existing.bloodSplatters || [],
          dungeonProps: existing.props || [],
          dungeonLevels: nextDungeonLevels,
          playerStats: {
            ...prev.playerStats,
            depth: nextDepth,
          },
        };
      } else {
        const nextLvl = generateLevel(
          LEVEL_WIDTH,
          LEVEL_HEIGHT,
          nextDepth,
          prev.playerStats.turnsPlayed,
          prev.playerStats.realTimeSeconds,
          prev.playerStats,
          prev.currentWeapon,
          prev.defeatedEnemiesCount,
          prev.clearedCamps?.length || 0
        );

        const fov = computeFOV(nextLvl.playerX, nextLvl.playerY, nextLvl.map, 6);
        const discovered = nextLvl.map.map((row, y) => row.map((_, x) => fov[y][x]));
        const props = generateDungeonProps(nextLvl.map, nextDepth);

        const boss = nextLvl.enemies.find(e => e.isBoss);
        if (boss) {
          setTimeout(() => {
            addLogMessage(`👑 WARNING: An ancient, powerful presence commands this chamber... ${boss.name} awaits!`, 'danger');
          }, 100);
        }

        return {
          ...prev,
          playerX: nextLvl.playerX,
          playerY: nextLvl.playerY,
          map: nextLvl.map,
          visible: fov,
          discovered: discovered,
          enemies: spawnFollowersOnLevelLoadByReset(nextLvl.enemies, prev.followers, nextLvl.playerX, nextLvl.playerY, nextLvl.map, prev.activeCompanionQuests),
          traps: nextLvl.traps,
          chests: nextLvl.chests,
          lootPiles: [],
          corpses: [],
          bloodSplatters: [],
          dungeonProps: props,
          dungeonLevels: nextDungeonLevels,
          playerStats: {
            ...prev.playerStats,
            depth: nextDepth,
          },
        };
      }
    });

    setActiveTab('dungeon');
  }, [gameStateRef, setGameState, addLogMessage, playSound, setActiveTab, spawnFollowersOnLevelLoadByReset, generateDungeonProps]);

  /**
   * Descend from overworld entrance into Depth 1
   */
  const descendToDungeonFirstFloor = useCallback(() => {
    playSound('levelUp');
    addLogMessage(`🪜 You descend into the black cave opening... Abyss Floor 1! Spikes, traps, and demonic forge pieces await!`, 'system');

    setGameState((prev) => {
      const currentChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const currentChunkCopy: OverworldChunk = {
        chunkX: prev.currentChunkX,
        chunkY: prev.currentChunkY,
        map: prev.map,
        discovered: prev.discovered,
        visible: prev.visible,
        enemies: prev.enemies,
        traps: prev.traps,
        chests: prev.chests,
        npcs: prev.npcs,
        lootPiles: prev.lootPiles || [],
        dungeons: [],
        towns: [],
        biome: prev.biome,
        weather: prev.weather,
      };

      const chunkX = prev.currentChunkX;
      const chunkY = prev.currentChunkY;
      const dungeonKey = `${chunkX},${chunkY}_depth-1`;
      const dungeonLevelsSafe = prev.dungeonLevels || {};
      const existing = dungeonLevelsSafe[dungeonKey];

      if (existing) {
        const { x: stairsUpX, y: stairsUpY } = findStairsOrWalkablePosition(existing.map, TileType.StairsUp, `Dungeon Depth 1`);

        const syncedEnemies = spawnFollowersOnLevelLoadByReset(
          existing.enemies,
          prev.followers,
          stairsUpX,
          stairsUpY,
          existing.map,
          prev.activeCompanionQuests
        );

        const fov = computeFOV(stairsUpX, stairsUpY, existing.map, 6);
        const discovered = existing.map.map((row, y) =>
          row.map((cell, x) => (existing.discovered?.[y]?.[x] || fov?.[y]?.[x] || false))
        );

        return {
          ...prev,
          isOverworld: false,
          dungeonEntranceChunkX: chunkX,
          dungeonEntranceChunkY: chunkY,
          dungeonEntrancePlayerX: prev.playerX,
          dungeonEntrancePlayerY: prev.playerY,
          overworldChunks: {
            ...prev.overworldChunks,
            [currentChunkKey]: currentChunkCopy
          },
          playerX: stairsUpX,
          playerY: stairsUpY,
          map: existing.map,
          visible: fov,
          discovered: discovered,
          enemies: syncedEnemies,
          traps: existing.traps,
          chests: existing.chests,
          npcs: [],
          lootPiles: existing.lootPiles || [],
          corpses: existing.corpses || [],
          bloodSplatters: existing.bloodSplatters || [],
          dungeonProps: existing.props || [],
          playerStats: {
            ...prev.playerStats,
            depth: 1
          }
        };
      } else {
        const nextDepth = 1;
        const nextLvl = generateLevel(LEVEL_WIDTH, LEVEL_HEIGHT, nextDepth, prev.playerStats.turnsPlayed, prev.playerStats.realTimeSeconds, prev.playerStats, prev.currentWeapon, prev.defeatedEnemiesCount, prev.clearedCamps?.length || 0);
        const fov = computeFOV(nextLvl.playerX, nextLvl.playerY, nextLvl.map, 6);
        const discovered = nextLvl.map.map((row, y) => row.map((_, x) => fov[y][x]));
        const props = generateDungeonProps(nextLvl.map, nextDepth);

        const boss = nextLvl.enemies.find(e => e.isBoss);
        if (boss) {
          setTimeout(() => {
            addLogMessage(`👑 WARNING: An ancient, powerful presence commands this chamber... ${boss.name} awaits!`, 'danger');
          }, 100);
        }

        const nextDungeonLevels = {
          ...dungeonLevelsSafe,
          [dungeonKey]: {
            depth: nextDepth,
            chunkX,
            chunkY,
            map: nextLvl.map,
            discovered,
            visible: fov,
            enemies: nextLvl.enemies,
            traps: nextLvl.traps,
            chests: nextLvl.chests,
            lootPiles: [],
            corpses: [],
            bloodSplatters: [],
            props
          }
        };

        return {
          ...prev,
          isOverworld: false,
          dungeonEntranceChunkX: chunkX,
          dungeonEntranceChunkY: chunkY,
          dungeonEntrancePlayerX: prev.playerX,
          dungeonEntrancePlayerY: prev.playerY,
          overworldChunks: {
            ...prev.overworldChunks,
            [currentChunkKey]: currentChunkCopy
          },
          playerX: nextLvl.playerX,
          playerY: nextLvl.playerY,
          map: nextLvl.map,
          visible: fov,
          discovered: discovered,
          enemies: spawnFollowersOnLevelLoadByReset(nextLvl.enemies, prev.followers, nextLvl.playerX, nextLvl.playerY, nextLvl.map, prev.activeCompanionQuests),
          traps: nextLvl.traps,
          chests: nextLvl.chests,
          npcs: [],
          lootPiles: [],
          corpses: [],
          bloodSplatters: [],
          dungeonProps: props,
          dungeonLevels: nextDungeonLevels,
          playerStats: {
            ...prev.playerStats,
            depth: 1
          }
        };
      }
    });

    setActiveTab('dungeon');
    setTimeout(() => {
      document.getElementById('dungeon-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, [gameStateRef, setGameState, addLogMessage, playSound, setActiveTab, spawnFollowersOnLevelLoadByReset, generateDungeonProps]);

  return {
    climbStairsUpToOverworld,
    climbToPreviousDepth,
    advanceToNextDepth,
    descendToDungeonFirstFloor,
  };
}
