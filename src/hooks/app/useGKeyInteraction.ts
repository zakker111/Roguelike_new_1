/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState, TileType, NPC, DungeonProp } from '../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../utils/gameUtils';
import { hasTownAtChunk, getDeterministicTownName, getOrganicBiome, prng } from '../../utils/overworld';
import { PoiType } from '../../components/PoiInteractionOverlay';
import { chunkBackgroundCache } from '../../canvas/chunkBackgroundCache';
import { invalidateChunkCanvasCache } from '../../components/worldmap/chunkTileRasterizer';

interface UseGKeyInteractionProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound: (sound: any) => void;
  addLogMessage: (text: string, type?: any) => void;
  descendToDungeonFirstFloor: () => void;
  advanceToNextDepth: () => void;
  climbStairsUpToOverworld: () => void;
  climbToPreviousDepth: () => void;
  setActivePoi: (poi: PoiType | null) => void;
  setIsSleepOpen: (open: boolean) => void;
  interactWithNpc: (npc: NPC) => void;
  handleInteractWithDungeonShrine: (prop: DungeonProp) => void;
}

export function useGKeyInteraction({
  gameState,
  setGameState,
  playSound,
  addLogMessage,
  descendToDungeonFirstFloor,
  advanceToNextDepth,
  climbStairsUpToOverworld,
  climbToPreviousDepth,
  setActivePoi,
  setIsSleepOpen,
  interactWithNpc,
  handleInteractWithDungeonShrine,
}: UseGKeyInteractionProps) {

  const handleGKeyInteract = () => {
    const px = gameState.playerX;
    const py = gameState.playerY;
    const currentTile = gameState.map[py]?.[px];
    if (!currentTile) return;

    if (currentTile === TileType.DungeonEntrance) {
      descendToDungeonFirstFloor();
      return;
    }
    if (currentTile === TileType.StairsDown) {
      advanceToNextDepth();
      return;
    }
    if (currentTile === TileType.StairsUp) {
      if (gameState.playerStats.depth === 1) {
        climbStairsUpToOverworld();
      } else {
        climbToPreviousDepth();
      }
      return;
    }

    const adjacentPoints = [
      { dx: 0, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: -1 },
      { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    // 0. Check adjacent Points of Interest (POIs)
    if (gameState.isOverworld) {
      const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
      const activeChunk = gameState.overworldChunks[chunkKey];
      if (activeChunk && activeChunk.pois) {
        const matchedPoi = activeChunk.pois.find(poi => {
          return Math.abs(px - poi.x) <= 1 && Math.abs(py - poi.y) <= 1;
        });

        if (matchedPoi && !matchedPoi.isInteracted) {
          setActivePoi(matchedPoi);
          playSound('loot');
          addLogMessage(`📖 Landmark discovered: [${matchedPoi.name}]`, 'loot');
          addLogMessage(`📜 Chronicle Lore: "${matchedPoi.historySnippet}"`, 'craft');

          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: matchedPoi.x, y: matchedPoi.y, text: `📖 ${matchedPoi.name}`, type: 'heal' },
          });
          window.dispatchEvent(ev);
          return;
        }
      }
    }

    // 1. Check signs adjacent/underneath
    for (const off of adjacentPoints) {
      const tx = px + off.dx;
      const ty = py + off.dy;
      if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
        if (gameState.map[ty][tx] === TileType.Sign) {
          playSound('loot');

          if (!gameState.isOverworld) {
            addLogMessage(`🪧 Dungeon Marker: "Warning! Danger below. Tread carefully, adventurer."`, "danger");
            return;
          }

          const currentCx = gameState.currentChunkX;
          const currentCy = gameState.currentChunkY;
          const currentHasTown = hasTownAtChunk(currentCx, currentCy);
          const currentTownName = currentHasTown ? getDeterministicTownName(currentCx, currentCy) : '';

          // Special Guild Signpost check
          if (currentHasTown && tx >= 41 && tx <= 45 && ty >= 10 && ty <= 12) {
            addLogMessage(`🪧 Guild House Sign: "RESERVED REAL ESTATE: This empty property has been secured for the Sunder Merchants Guild. Ready to be purchased! Open your Guild/Safehouse tab to buy it."`, 'craft');
            const signEvent = new CustomEvent('spawn-game-effect', {
              detail: { x: tx, y: ty, text: `🪧 Guild House`, type: 'heal' },
            });
            window.dispatchEvent(signEvent);
            return;
          }

          if (currentHasTown) {
            addLogMessage(`🪧 Signpost in ${currentTownName} (Reading pointing arrows...):`, 'craft');
          } else {
            addLogMessage(`🪧 Wilderness Signpost at path intersection (Reading pointing arrows...):`, 'craft');
          }

          // Scan all 4 cardinal directions up to 6 chunks away
          const dirs = [
            { name: 'NORTH ⬆️', dx: 0, dy: -1 },
            { name: 'SOUTH ⬇️', dx: 0, dy: 1 },
            { name: 'WEST ⬅️', dx: -1, dy: 0 },
            { name: 'EAST ➡️', dx: 1, dy: 0 }
          ];

          for (const dir of dirs) {
            let townFound: { name: string; dist: number } | null = null;
            let ruinsFound: { name: string; dist: number } | null = null;
            let dungeonFound: { name: string; dist: number } | null = null;

            for (let dist = 1; dist <= 6; dist++) {
              const nx = currentCx + dir.dx * dist;
              const ny = currentCy + dir.dy * dist;

              if (hasTownAtChunk(nx, ny)) {
                if (!townFound) {
                  townFound = {
                    name: getDeterministicTownName(nx, ny),
                    dist
                  };
                }
              } else {
                const bName = getOrganicBiome(nx, ny);

                let dungName = 'Deepwood Crypts';
                if (bName === 'desert') dungName = 'Bonesand Tomb';
                else if (bName === 'tundra') dungName = 'Frostbite Caverns';
                else if (bName === 'swamp') dungName = 'Soggy Marsh Abyss';

                if (!dungeonFound) {
                  dungeonFound = { name: dungName, dist };
                }

                const spawnRuins = prng(nx, ny, 150) > 0.55;
                if (spawnRuins && !ruinsFound) {
                  let ruinsName = 'Forgotten Wild Temple';
                  if (bName === 'desert') ruinsName = 'Sun-Baked Obelisk';
                  else if (bName === 'tundra') ruinsName = 'Frozen Cairn Ruins';
                  else if (bName === 'swamp') ruinsName = 'Sunken Keep Ruins';

                  ruinsFound = { name: ruinsName, dist };
                }
              }
            }

            let lineMsg = `   ${dir.name}: `;
            if (townFound) {
              const distLabel = townFound.dist === 1 ? 'next region' : `${townFound.dist} regions ahead`;
              lineMsg += `🏡 ${townFound.name} (${distLabel})`;
            } else if (ruinsFound && ruinsFound.dist <= 3) {
              const distLabel = ruinsFound.dist === 1 ? 'next region' : `${ruinsFound.dist} regions ahead`;
              lineMsg += `🏛️ ${ruinsFound.name} (${distLabel})`;
            } else if (dungeonFound) {
              const distLabel = dungeonFound.dist === 1 ? 'next region' : `${dungeonFound.dist} regions ahead`;
              lineMsg += `💀 ${dungeonFound.name} (${distLabel})`;
            } else {
              lineMsg += `🌲 Uncharted Lands`;
            }

            addLogMessage(lineMsg, 'loot');
          }

          const hasCaravanHere = gameState.npcs?.some(n =>
            (n.role as any) === 'merchant_caravan' ||
            (n.role as any) === 'merchant_caravan_ambushed' ||
            (n.name && (n.name.toLowerCase().includes('caravan') || n.name.toLowerCase().includes('caravaneer') || n.name.toLowerCase().includes('sledger') || n.name.toLowerCase().includes('barger')))
          );
          if (hasCaravanHere) {
            addLogMessage('🚚 CARAVAN DEPOT: Caravaneers at this camp offer escort routes to regional settlements for gold payouts! Speak with the Caravaneer or open Trading to begin your escort journey.', 'craft');
          }
          return;
        }
      }
    }

    // 2. Check beds, bedrolls, field tents, and campfires for resting & sleep
    for (const off of adjacentPoints) {
      const tx = px + off.dx;
      const ty = py + off.dy;
      if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
        const t = gameState.map[ty][tx];
        if (t === TileType.Bed || t === TileType.Bedroll || t === TileType.FieldTent || t === TileType.Campfire) {
          setIsSleepOpen(true);
          return;
        }
      }
    }

    // 3. Harvest sweet berries, wild herbs, truffles, honeycombs, and desert succulents from Bushes
    for (const off of adjacentPoints) {
      const tx = px + off.dx;
      const ty = py + off.dy;
      if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
        if (gameState.map[ty][tx] === TileType.Bush) {
          const biome = gameState.biome || 'forest';
          let gatheredId = 'mat_berry';
          let gatheredName = 'Wild Berries 🍓';
          let gatheredQty = Math.floor(Math.random() * 3) + 1;
          let effectIcon = '🍓';

          if (biome === 'tundra') {
            gatheredId = 'mat_frostbloom';
            gatheredName = 'Glacial Frostbloom ❄️🌸';
            gatheredQty = Math.floor(Math.random() * 2) + 1;
            effectIcon = '❄️';
          } else if (biome === 'desert') {
            gatheredId = 'mat_sun_aloe';
            gatheredName = 'Sun-Blossom Aloe 🌵🪻';
            gatheredQty = Math.floor(Math.random() * 2) + 1;
            effectIcon = '🌵';
          } else if (biome === 'swamp') {
            gatheredId = 'mat_swamp_nightshade';
            gatheredName = 'Bioluminescent Nightshade 🌿✨';
            gatheredQty = Math.floor(Math.random() * 2) + 1;
            effectIcon = '🌿';
          } else {
            // Forest biome: roll between Berries, Wild Honeycomb, and Earthy Truffle
            const roll = Math.random();
            if (roll > 0.70) {
              gatheredId = 'mat_forest_truffle';
              gatheredName = 'Earthy Forest Truffle 🍄';
              gatheredQty = 1;
              effectIcon = '🍄';
            } else if (roll > 0.40) {
              gatheredId = 'mat_honeycomb';
              gatheredName = 'Wild Gold Honeycomb 🍯';
              gatheredQty = 1;
              effectIcon = '🍯';
            } else {
              gatheredId = 'mat_berry';
              gatheredName = 'Sweet Wild Berries 🍓';
              gatheredQty = Math.floor(Math.random() * 3) + 1;
              effectIcon = '🍓';
            }
          }

          setGameState((prev) => {
            const nextMap = prev.map.map(row => [...row]);
            nextMap[ty][tx] = prev.isOverworld ? TileType.Grass : TileType.Floor;
            const nextMats = { ...prev.inventoryMaterials };
            nextMats[gatheredId] = (nextMats[gatheredId] || 0) + gatheredQty;

            const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
            const nextChunks = { ...prev.overworldChunks };
            if (prev.isOverworld && nextChunks[chunkKey]) {
              nextChunks[chunkKey] = {
                ...nextChunks[chunkKey],
                map: nextMap
              };
            }

            const nextDungeonLevels = { ...(prev.dungeonLevels || {}) };
            const dungeonKey = `${prev.dungeonEntranceChunkX ?? prev.currentChunkX ?? 0},${prev.dungeonEntranceChunkY ?? prev.currentChunkY ?? 0}_depth-${prev.playerStats.depth}`;
            if (!prev.isOverworld && nextDungeonLevels[dungeonKey]) {
              nextDungeonLevels[dungeonKey] = {
                ...nextDungeonLevels[dungeonKey],
                map: nextMap
              };
            }

            return { ...prev, map: nextMap, overworldChunks: nextChunks, dungeonLevels: nextDungeonLevels, inventoryMaterials: nextMats };
          });

          chunkBackgroundCache.invalidate();
          invalidateChunkCanvasCache(gameState.currentChunkX, gameState.currentChunkY);
          playSound('loot');
          addLogMessage(`🌿 Foraging: You gathered +${gatheredQty} ${gatheredName} from the wilderness!`, "loot");
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: tx, y: ty, text: `+${gatheredQty} ${effectIcon}`, type: 'heal' },
          });
          window.dispatchEvent(ev);
          return;
        }
      }
    }

    // 3.4. Check Adjacent/Underfoot Tree Stump Digging & Root Clearing
    for (const pt of adjacentPoints) {
      const tx = px + pt.dx;
      const ty = py + pt.dy;
      if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
        if (gameState.map[ty]?.[tx] === TileType.TreeStump) {
          setGameState((prev) => {
            const nextMap = prev.map.map((row, y) =>
              row.map((cell, x) => (x === tx && y === ty ? (prev.isOverworld ? TileType.Grass : TileType.Floor) : cell))
            );
            const nextMats = {
              ...prev.inventoryMaterials,
              mat_wood: (prev.inventoryMaterials['mat_wood'] || 0) + 1,
            };
            const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
            const nextChunks = { ...prev.overworldChunks };
            if (prev.isOverworld && nextChunks[chunkKey]) {
              nextChunks[chunkKey] = {
                ...nextChunks[chunkKey],
                map: nextMap
              };
            }
            return { ...prev, map: nextMap, overworldChunks: nextChunks, inventoryMaterials: nextMats };
          });

          chunkBackgroundCache.invalidate();
          invalidateChunkCanvasCache(gameState.currentChunkX, gameState.currentChunkY);
          playSound('craft_forge');
          addLogMessage('🪵 [STUMP CLEARED]: You dig up the remaining tree stump roots, leveling the ground and salvaging +1 Scrap Wood!', 'craft');
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: tx, y: ty, text: '+1 Scrap Wood 🪵', type: 'heal' },
          });
          window.dispatchEvent(ev);
          return;
        }
      }
    }

    // 3.5. Check Adjacent Surrendered Enemies (Phase E2: Parley & Surrender Mercy)
    if (gameState.enemies && gameState.enemies.length > 0) {
      const adjacentSurrendered = gameState.enemies.find(
        (e) => e.isSurrendered && e.hp > 0 && Math.abs(px - e.x) <= 1 && Math.abs(py - e.y) <= 1
      );
      if (adjacentSurrendered) {
        const bribeGold = Math.floor(Math.random() * 25) + 15;
        const potentialMats = ['mat_tempered_scrap', 'mat_steel_ingot', 'mat_leather_strip', 'mat_herb'];
        const chosenMat = potentialMats[Math.floor(Math.random() * potentialMats.length)];

        setGameState((prev) => {
          const nextEnemies = prev.enemies.filter((e) => e.id !== adjacentSurrendered.id);
          const nextMats = { ...prev.inventoryMaterials };
          nextMats[chosenMat] = (nextMats[chosenMat] || 0) + 1;

          return {
            ...prev,
            enemies: nextEnemies,
            playerStats: {
              ...prev.playerStats,
              gold: prev.playerStats.gold + bribeGold,
            },
            inventoryMaterials: nextMats,
          };
        });

        playSound('loot');
        addLogMessage(
          `🏳️ [PARLEY ACCEPTED]: You spare ${adjacentSurrendered.name}! They gratefully surrender +${bribeGold} Gold and a ${chosenMat.replace('mat_', '').replace('_', ' ')} before retreating peacefully into the wilderness!`,
          'loot'
        );
        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: adjacentSurrendered.x, y: adjacentSurrendered.y, text: `+${bribeGold}g 🏳️`, type: 'heal' },
        });
        window.dispatchEvent(ev);
        return;
      }
    }

    // 4. Check NPCs
    for (const off of adjacentPoints) {
      const tx = px + off.dx;
      const ty = py + off.dy;
      if (gameState.isOverworld && gameState.npcs) {
        const foundNpc = gameState.npcs.find((n) => n.x === tx && n.y === ty);
        if (foundNpc) {
          interactWithNpc(foundNpc);
          return;
        }
      }
    }

    // 5. Check adjacent Level Decor / Dungeon Props
    if (gameState.dungeonProps && gameState.dungeonProps.length > 0) {
      const adjacentProp = gameState.dungeonProps.find((prop) => {
        return Math.abs(px - prop.x) <= 1 && Math.abs(py - prop.y) <= 1;
      });

      if (adjacentProp) {
        if (adjacentProp.isInteracted || adjacentProp.description.includes('(EXHAUSTED)')) {
          addLogMessage(`⚠️ [EXHAUSTED]: The ${adjacentProp.name} has already been used and exhausted.`, 'system');
        } else {
          handleInteractWithDungeonShrine(adjacentProp);
        }
        return;
      }
    }

    addLogMessage("🔍 Nothing here to adjacent search or interact with.", "system");
  };

  return { handleGKeyInteract };
}
