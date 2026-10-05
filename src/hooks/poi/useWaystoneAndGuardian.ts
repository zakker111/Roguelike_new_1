/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { GameState, Enemy, EnemyState, EnemyType, TileType, OverworldChunk } from '../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT, findNearestSafePlayerTile } from '../../utils/gameUtils';
import { computeFOV } from '../../utils/ai';
import { generateOverworldChunk } from '../../utils/overworld';
import { spawnFollowersOnLevelLoadByReset } from '../../utils/dungeon';
import { combatVfxEngine } from '../../canvas/combatVfxEngine';
import { PoiType } from '../../components/PoiInteractionOverlay';

export interface UseWaystoneAndGuardianParams {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  activePoi: PoiType | null;
  setActivePoi: (poi: PoiType | null) => void;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
}

export function useWaystoneAndGuardian({
  setGameState,
  activePoi,
  setActivePoi,
  addLogMessage,
  playSound,
}: UseWaystoneAndGuardianParams) {
  const handleAttuneWaystone = useCallback((poiId: string) => {
    setGameState((prev) => {
      const currentAttuned = prev.attunedWaystones || [];
      if (currentAttuned.includes(poiId)) return prev;
      const nextAttuned = [...currentAttuned, poiId];
      const nextChunks = { ...prev.overworldChunks };
      Object.keys(nextChunks).forEach((ckey) => {
        const chunk = nextChunks[ckey];
        if (chunk.pois) {
          chunk.pois = chunk.pois.map((p) => (p.id === poiId ? { ...p, isAttunedWaystone: true } : p));
        }
      });
      return {
        ...prev,
        attunedWaystones: nextAttuned,
        overworldChunks: nextChunks,
      };
    });
    if (activePoi && activePoi.id === poiId) {
      setActivePoi({ ...activePoi, isAttunedWaystone: true });
    }
  }, [activePoi, setActivePoi, setGameState]);

  const handleWaystoneFastTravel = useCallback((
    targetChunkX: number,
    targetChunkY: number,
    targetX: number,
    targetY: number,
    targetName: string
  ) => {
    setActivePoi(null);
    setGameState((prev) => {
      const currentChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const oldChunk = prev.overworldChunks[currentChunkKey];
      const isSecondFloorActive = (prev.overworldZ || 0) === 1;

      // Preserve origin overworld chunk if fast traveling from overworld
      const updatedChunks: Record<string, OverworldChunk> = { ...prev.overworldChunks };
      if (prev.isOverworld) {
        updatedChunks[currentChunkKey] = {
          chunkX: prev.currentChunkX,
          chunkY: prev.currentChunkY,
          map: isSecondFloorActive ? (oldChunk?.map || prev.map) : prev.map,
          discovered: isSecondFloorActive ? (oldChunk?.discovered || prev.discovered) : prev.discovered,
          visible: isSecondFloorActive ? (oldChunk?.visible || prev.visible) : prev.visible,
          secondFloorMap: isSecondFloorActive ? prev.map : oldChunk?.secondFloorMap,
          secondFloorDiscovered: isSecondFloorActive ? prev.discovered : oldChunk?.secondFloorDiscovered,
          secondFloorVisible: isSecondFloorActive ? prev.visible : oldChunk?.secondFloorVisible,
          enemies: prev.enemies,
          traps: prev.traps,
          chests: prev.chests,
          npcs: prev.npcs,
          lootPiles: prev.lootPiles || [],
          corpses: prev.corpses || [],
          bloodSplatters: prev.bloodSplatters || [],
          props: prev.dungeonProps || [],
          dungeons: oldChunk?.dungeons || [],
          towns: oldChunk?.towns || [],
          biome: prev.biome,
          weather: prev.weather,
          watchtower: oldChunk?.watchtower,
          pois: oldChunk?.pois,
        };
      }

      const targetChunkKey = `${targetChunkX},${targetChunkY}`;
      let destChunk = updatedChunks[targetChunkKey];

      if (!destChunk) {
        destChunk = generateOverworldChunk(
          targetChunkX,
          targetChunkY,
          LEVEL_WIDTH,
          LEVEL_HEIGHT,
          prev.spawnedCats || [],
          prev.spawnedSeppo,
          prev.playerStats,
          prev.currentWeapon
        );
        updatedChunks[targetChunkKey] = destChunk;
      }

      const safePlayerPos = findNearestSafePlayerTile(targetX, targetY, destChunk.map);
      const finalPx = safePlayerPos.x;
      const finalPy = safePlayerPos.y;
      const fov = computeFOV(finalPx, finalPy, destChunk.map, 8);
      const discovered = destChunk.map.map((row, y) =>
        row.map((cell, x) => (destChunk.discovered && destChunk.discovered[y] && destChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false)
      );

      const nextVisited = { ...prev.visitedTiles };
      nextVisited[`${finalPx},${finalPy},${targetChunkX},${targetChunkY}`] = true;

      const updatedDiscoveredChunks = prev.discoveredChunks instanceof Set
        ? new Set(prev.discoveredChunks).add(targetChunkKey)
        : Array.isArray(prev.discoveredChunks)
        ? [...new Set([...prev.discoveredChunks, targetChunkKey])]
        : { ...(prev.discoveredChunks || {}), [targetChunkKey]: true };

      const nextEnemies = spawnFollowersOnLevelLoadByReset(
        destChunk.enemies,
        prev.followers,
        finalPx,
        finalPy,
        destChunk.map
      );

      addLogMessage(`🌀 [LEYLINE FAST TRAVEL]: Materialized at ${targetName} (${targetChunkX}, ${targetChunkY})!`, 'loot');
      playSound('spell');

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: finalPx, y: finalPy, text: `🌀 TELEPORTED!`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        isOverworld: true,
        overworldZ: 0,
        dungeonLevel: 0,
        isStairsModalOpen: false,
        pendingStairsAction: null,
        currentChunkX: targetChunkX,
        currentChunkY: targetChunkY,
        playerX: finalPx,
        playerY: finalPy,
        map: destChunk.map,
        discovered,
        visible: fov,
        enemies: nextEnemies,
        traps: destChunk.traps,
        chests: destChunk.chests,
        npcs: destChunk.npcs || [],
        lootPiles: destChunk.lootPiles || [],
        corpses: destChunk.corpses || [],
        bloodSplatters: destChunk.bloodSplatters || [],
        dungeonProps: destChunk.props || [],
        overworldChunks: updatedChunks,
        discoveredChunks: updatedDiscoveredChunks,
        visitedTiles: nextVisited,
        biome: destChunk.biome,
        weather: destChunk.weather,
      };
    });

    combatVfxEngine.clearAll();
  }, [setActivePoi, setGameState, addLogMessage, playSound]);

  const handleChallengeBiomeGuardian = useCallback((poi: PoiType) => {
    setActivePoi(null);
    setGameState((prev) => {
      const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const activeChunk = prev.overworldChunks[chunkKey];
      if (!activeChunk) return prev;

      const spawnOffsets = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 },
      ];
      let bossX = poi.x + 1;
      let bossY = poi.y;
      for (const off of spawnOffsets) {
        const tx = poi.x + off.dx;
        const ty = poi.y + off.dy;
        if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
          const t = activeChunk.map[ty]?.[tx];
          if (t === TileType.Floor || t === TileType.Grass || t === TileType.Path) {
            bossX = tx;
            bossY = ty;
            break;
          }
        }
      }

      const guardianTypes: { [key: string]: { name: string; hp: number; atk: number; def: number; char: string; color: string } } = {
        shrine: { name: '🌲 Hiisi Grove Warden', hp: 280, atk: 18, def: 8, char: '👹', color: '#10b981' },
        hearth: { name: "🔥 Ilmarinen's Iron Golem", hp: 340, atk: 22, def: 12, char: '🗿', color: '#f97316' },
        monolith: { name: "⚡ Ukko's Storm Sentinel", hp: 320, atk: 21, def: 10, char: '🌩️', color: '#a855f7' },
        sunken_keep: { name: '💀 Tuonela River Wraith', hp: 260, atk: 20, def: 7, char: '👻', color: '#38bdf8' },
        fossil: { name: '🦴 Tectonic Bone Automaton', hp: 300, atk: 19, def: 9, char: '🦕', color: '#e2e8f0' },
      };

      const gData = guardianTypes[poi.type] || guardianTypes.monolith;

      const guardianEnemy: Enemy = {
        id: `guardian_${poi.id}_${Date.now()}`,
        x: bossX,
        y: bossY,
        type: EnemyType.DreadKnight,
        name: gData.name,
        hp: gData.hp,
        maxHp: gData.hp,
        atk: gData.atk,
        def: gData.def,
        range: 1,
        speed: 1,
        state: EnemyState.Chasing,
        isElite: true,
        isBoss: true,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: [],
        char: gData.char,
        color: gData.color,
        dropMaterials: ['mat_mithril', 'mat_ember_core', 'mat_dragonscale'],
        dropCatalysts: ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'],
      };

      const nextEnemies = [...prev.enemies, guardianEnemy];
      const updatedPois = (activeChunk.pois || []).map((p) => (p.id === poi.id ? { ...p, guardianSpawned: true } : p));
      const nextChunks = {
        ...prev.overworldChunks,
        [chunkKey]: {
          ...activeChunk,
          pois: updatedPois,
          enemies: [...(activeChunk.enemies || []), guardianEnemy],
        },
      };

      addLogMessage(`⚔️ [GUARDIAN TRIAL AWAKENED]: You challenged ${gData.name}! The ancient spirit materializes at (${bossX}, ${bossY})! Prepare for battle!`, 'danger');
      playSound('bossTheme');

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: bossX, y: bossY, text: `⚔️ BOSS AWAKENED!`, type: 'damage' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        enemies: nextEnemies,
        overworldChunks: nextChunks,
      };
    });
  }, [setActivePoi, setGameState, addLogMessage, playSound]);

  return {
    handleAttuneWaystone,
    handleWaystoneFastTravel,
    handleChallengeBiomeGuardian,
  };
}
