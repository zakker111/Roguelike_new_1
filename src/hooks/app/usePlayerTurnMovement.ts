/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  GameState,
  TileType,
  Enemy,
  EnemyType,
  EnemyState,
  Follower,
  OverworldChunk,
  GameLogMessage,
  NPC
} from '../../types';
import {
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
  findNearestSafePlayerTile,
  isLunarBlessingActive,
  getEffectiveAttribute
} from '../../utils/gameUtils';
import {
  getCurrentWeight,
  getMaxWeight,
  getItemWeight,
  getMaterialUnitWeight
} from '../../utils/itemWeight';
import {
  WEATHER_EFFECTS,
  getValidWeatherForBiome
} from '../../utils/weatherEngine';
import {
  generateOverworldChunk,
  hasTownAtChunk,
  getDeterministicTownName,
  prng,
  formatGameTime
} from '../../utils/overworld';
import { spawnFollowersOnLevelLoadByReset } from '../../utils/dungeon';
import { computeFOV } from '../../utils/ai';
import { getSiegeCombatants } from '../../utils/siegeUtils';
import { isPlayerIndoors } from '../../utils/buildingAudio';
import { isPlayerInvincible } from '../../utils/invincibility';
import { evaluateScarAcquisition } from '../../utils/scars';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../../utils/itemsData';
import gameConfig from '../../data/gameConfig.json';

interface UsePlayerTurnMovementProps {
  isPlaying: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound: (sound: any, options?: any) => void;
  addLogMessage: (text: string, type?: any) => void;
  executeEnemiesTurn: (px: number, py: number) => void;
  setIsGameOver: (gameOver: boolean) => void;
  setShakeTrigger: React.Dispatch<React.SetStateAction<number>>;
  setActiveTab: (tab: any) => void;
  setActiveLockpickingChestIndex: (idx: number | null) => void;
  setIsLockpickingOpen: (open: boolean) => void;
  setUnlawfulGuardTarget: (target: any) => void;
  handleOverworldStairsTransition: (x: number, y: number, dir: 'up' | 'down') => void;
  handleResourceHarvest: (tile: TileType, x: number, y: number, state: GameState) => boolean;
  handleOpenDoor: (x: number, y: number, state: GameState) => void;
  descendToDungeonFirstFloor: () => void;
  advanceToNextDepth: () => void;
  interactWithNpc: (npc: NPC) => void;
  performPlayerAttack: (enemy: Enemy, index: number, pathPoints: any[]) => boolean;
  handleOpenChest: (chestIndex: number, isMimic: boolean) => void;
  hasEquippedTrait: (state: GameState, trait: string) => boolean;
}

export function usePlayerTurnMovement({
  isPlaying,
  isGameOver,
  isVictory,
  gameState,
  setGameState,
  playSound,
  addLogMessage,
  executeEnemiesTurn,
  setIsGameOver,
  setShakeTrigger,
  setActiveTab,
  setActiveLockpickingChestIndex,
  setIsLockpickingOpen,
  setUnlawfulGuardTarget,
  handleOverworldStairsTransition,
  handleResourceHarvest,
  handleOpenDoor,
  descendToDungeonFirstFloor,
  advanceToNextDepth,
  interactWithNpc,
  performPlayerAttack,
  handleOpenChest,
  hasEquippedTrait,
}: UsePlayerTurnMovementProps) {

  const makeMove = (dx: number, dy: number) => {
    if (!isPlaying || isGameOver || isVictory) return;

    // Overburdened sluggish/stagger checks
    const currentW = getCurrentWeight(gameState);
    const maxW = getMaxWeight(gameState);
    if (currentW > maxW && (dx !== 0 || dy !== 0)) {
      const staggerChance = gameState.season === 'winter' ? 0.65 : 0.45;
      if (Math.random() < staggerChance) {
        playSound('bump');
        const winterExt = gameState.season === 'winter' ? ' Glacial blizzards worsen overburden strain!' : '';
        addLogMessage(`⚠️ OVERBURDENED! You are carrying too much heavy gear (${currentW}/${maxW} kg).${winterExt} You stagger and stumble!`, 'danger');
        executeEnemiesTurn(gameState.playerX, gameState.playerY);
        return;
      }
    }

    // Weather & Seasonal Fatigue Movement Checks
    if (gameState.isOverworld && (dx !== 0 || dy !== 0)) {
      const weather = gameState.weather || 'clear';
      const effect = WEATHER_EFFECTS[weather];
      if (effect && effect.movementPenaltyChance > 0) {
        let isImmune = false;
        let genericFatigueLog = effect.fatigueLog;
        if (weather === 'rainy') {
          isImmune = hasEquippedTrait(gameState, 'SWAMP_GLIDE') || hasEquippedTrait(gameState, 'NON_SLIPPERY');
          genericFatigueLog = '🌧️ [MUDDY PATHS]: You slip and slide on the muddy wet ground, wasting your turn recovering your footing. (Tip: Equip forged Non-Slippery shoes or Swamp-Glide boots!)';
        } else if (weather === 'sandstorm') {
          isImmune = hasEquippedTrait(gameState, 'DESERT_IMMUNITY');
          genericFatigueLog = '🌪️ [SANDSTORM DUST]: Swirling sand fills your eyes, making you stumble blindly! You lose a turn trying to clear your vision. (Tip: Equip forged Desert-Immune visor or dune boots!)';
        } else if (weather === 'blizzard') {
          isImmune = hasEquippedTrait(gameState, 'WORG_FORCE') || hasEquippedTrait(gameState, 'NON_SLIPPERY');
          genericFatigueLog = '🌨️ [BLIZZARD FREEZE]: A savage winter blizzard gale sweeps over you! You shiver from cold fatigue and lose a turn. (Tip: Equip forged Non-Slippery shoes or heavy Worg-Spiked gear!)';
        }

        if (!isImmune && Math.random() < effect.movementPenaltyChance) {
          playSound('bump');
          addLogMessage(genericFatigueLog, 'danger');
          const coldEv = new CustomEvent('spawn-game-effect', {
            detail: { x: gameState.playerX, y: gameState.playerY, text: effect.fatigueText, type: 'dmg' },
          });
          window.dispatchEvent(coldEv);
          executeEnemiesTurn(gameState.playerX, gameState.playerY);
          return;
        }
      } else if (gameState.season === 'winter' && (gameState.biome === 'tundra' || Math.random() < 0.05)) {
        if (Math.random() < 0.04) {
          playSound('bump');
          addLogMessage(`❄️ [WINTER CHILL]: A frosty blast of freezing wind locks up your muscles! You shiver from frostbite fatigue and waste a turn.`, 'danger');
          const coldEv = new CustomEvent('spawn-game-effect', {
            detail: { x: gameState.playerX, y: gameState.playerY, text: `🥶 SHIVER`, type: 'dmg' },
          });
          window.dispatchEvent(coldEv);
          executeEnemiesTurn(gameState.playerX, gameState.playerY);
          return;
        }
      }
    }

    const stats = gameState.playerStats;
    const targetX = gameState.playerX + dx;
    const targetY = gameState.playerY + dy;

    // Check overworld infinite coordinate crossover boundary limits
    if (gameState.isOverworld) {
      let nextCx = gameState.currentChunkX;
      let nextCy = gameState.currentChunkY;
      let crossed = false;
      let newPx = targetX;
      let newPy = targetY;

      if (targetX < 0) {
        nextCx = gameState.currentChunkX - 1;
        newPx = LEVEL_WIDTH - 1;
        crossed = true;
      } else if (targetX >= LEVEL_WIDTH) {
        nextCx = gameState.currentChunkX + 1;
        newPx = 0;
        crossed = true;
      }

      if (targetY < 0) {
        nextCy = gameState.currentChunkY - 1;
        newPy = LEVEL_HEIGHT - 1;
        crossed = true;
      } else if (targetY >= LEVEL_HEIGHT) {
        nextCy = gameState.currentChunkY + 1;
        newPy = 0;
        crossed = true;
      }

      if (crossed) {
        playSound('levelUp');
        addLogMessage(`🗺️ Traversing boundary to Chunk (${nextCx}, ${nextCy}). The infinite horizon expands...`, 'system');

        setTimeout(() => {
          document.getElementById('dungeon-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);

        let finalPx = newPx;
        let finalPy = newPy;

        setGameState((prev) => {
          const currentChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
          const oldChunk = prev.overworldChunks[currentChunkKey];
          const isSecondFloorActive = prev.isOverworld && prev.overworldZ === 1;

          const currentChunkCopy: OverworldChunk = {
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
            dungeons: oldChunk?.dungeons || [],
            towns: oldChunk?.towns || [],
            biome: prev.biome,
            weather: prev.weather,
            watchtower: oldChunk?.watchtower,
            pois: oldChunk?.pois
          };

          const updatedChunks = {
            ...prev.overworldChunks,
            [currentChunkKey]: currentChunkCopy
          };

          const targetChunkKey = `${nextCx},${nextCy}`;
          let targetChunk = updatedChunks[targetChunkKey];
          let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
          let hasSeppoOnLoad = false;
          let newlyDiscoveredTown = false;
          const newMsgs: GameLogMessage[] = [];
          if (!targetChunk) {
            targetChunk = generateOverworldChunk(nextCx, nextCy, LEVEL_WIDTH, LEVEL_HEIGHT, nextSpawnedCats, prev.spawnedSeppo, prev.playerStats, prev.currentWeapon);
            if (hasTownAtChunk(nextCx, nextCy)) {
              newlyDiscoveredTown = true;
            }
            targetChunk.npcs.forEach(n => {
              if (n.id?.startsWith('npc_cat_')) {
                const catName = n.name.split(' (')[0];
                if (!nextSpawnedCats.includes(catName)) {
                  nextSpawnedCats.push(catName);
                }
              }
            });
            hasSeppoOnLoad = targetChunk.npcs.some(n => n.id === 'npc_seppo');
          }

          if (targetChunk.watchtower && targetChunk.watchtower.siegeState?.isUnderSiege) {
            const hasSiegeEnemies = targetChunk.enemies.some(e => e.id.startsWith('siege_attacker_') || e.id.startsWith('wt_ally_attacker_'));
            if (!hasSiegeEnemies) {
              const wtX = targetChunk.watchtower.x;
              const wtY = targetChunk.watchtower.y;
              const attacker = targetChunk.watchtower.siegeState.attacker;
              const defender = targetChunk.watchtower.siegeState.defender;
              const playerFaction = prev.faction || 'neutral';
              const reputation = prev.factionReputation || { syndicate: 0, vanguard: 0, bandits: 0 };

              const siegeEnemies = getSiegeCombatants(
                wtX,
                wtY,
                nextCx,
                nextCy,
                attacker,
                defender,
                playerFaction,
                reputation
              );

              targetChunk.enemies = [...targetChunk.enemies, ...siegeEnemies];
            }
          }

          if (targetChunk.watchtower && !targetChunk.watchtower.siegeState?.isUnderSiege) {
            const controller = targetChunk.watchtower.controller || 'neutral';
            const playerFaction = prev.faction || 'neutral';
            const isFriendlyWatchtower = targetChunk.watchtower.isClaimed && controller === playerFaction;

            if (!isFriendlyWatchtower && !targetChunk.watchtower.garrisonDefeated) {
              const hasWatchtowerAllies = targetChunk.enemies.some(e => e.id.startsWith('wt_ally_assault_'));
              if (!hasWatchtowerAllies) {
                const wtX = targetChunk.watchtower.x;
                const wtY = targetChunk.watchtower.y;

                const assaultAllies: Enemy[] = [];
                const allyCoords = [
                  { dx: 2, dy: 6, isRanged: false },
                  { dx: 6, dy: 6, isRanged: false },
                  { dx: 4, dy: 7, isRanged: true }
                ];

                let allyName = 'Allied Rebel';
                let allyColor = '#fbbf24';
                let allyChar = '⚔️';

                if (playerFaction === 'vanguard') {
                  allyName = 'Vanguard Vanguardian';
                  allyColor = '#38bdf8';
                } else if (playerFaction === 'syndicate') {
                  allyName = 'Syndicate Operative';
                  allyColor = '#c084fc';
                  allyChar = '☠️';
                } else if (playerFaction === 'bandits') {
                  allyName = 'Outlaw Pillager';
                  allyColor = '#f97316';
                  allyChar = '🪓';
                }

                allyCoords.forEach((offset, idx) => {
                  const nameStr = offset.isRanged ? `🏹 [ALLY] ${allyName} Marksman` : `⚔️ [ALLY] ${allyName}`;
                  assaultAllies.push({
                    id: `wt_ally_assault_${idx}_${nextCx}_${nextCy}`,
                    x: wtX + offset.dx,
                    y: wtY + offset.dy,
                    type: offset.isRanged ? EnemyType.SkeletonMage : EnemyType.Bandit,
                    name: nameStr,
                    hp: offset.isRanged ? 140 : 180,
                    maxHp: offset.isRanged ? 140 : 180,
                    atk: offset.isRanged ? 12 : 15,
                    def: offset.isRanged ? 3 : 6,
                    range: offset.isRanged ? 3 : 1,
                    speed: 1.0,
                    color: allyColor,
                    char: offset.isRanged ? '🏹' : allyChar,
                    state: EnemyState.Chasing,
                    isElite: true,
                    isFollower: true,
                    debuffs: [],
                    patrolPath: [],
                    patrolIndex: 0
                  });
                });

                targetChunk.enemies = [...targetChunk.enemies, ...assaultAllies];
                newMsgs.push({
                  id: `wt_ally_spawn_${Date.now()}`,
                  text: `⚔️ [ASSAULT IN PROGRESS]: Your faction forces have launched a raid on the watchtower! Move in and assist them in defeating the garrison!`,
                  type: 'combat',
                  timestamp: 'MILITARY ALERT'
                });
              }
            }
          }

          const safePlayerPos = findNearestSafePlayerTile(newPx, newPy, targetChunk.map);
          finalPx = safePlayerPos.x;
          finalPy = safePlayerPos.y;

          const fov = computeFOV(finalPx, finalPy, targetChunk.map, 6);
          const discovered = targetChunk.map.map((row, y) =>
            row.map((cell, x) => ((targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
          );

          const nextVisited = { ...prev.visitedTiles };
          nextVisited[`${finalPx},${finalPy},${nextCx},${nextCy}`] = true;

          if (newlyDiscoveredTown) {
            const townName = prng(nextCx, nextCy, 123) < 0.3 ? "Port Royal Town" : getDeterministicTownName(nextCx, nextCy);
            newMsgs.push({
              id: `discover_town_${Date.now()}`,
              text: `🏘️ [DISCOVERY REWARD]: You have discovered the magnificent town of ${townName}! The Sunder Guild drops a rare Scroll of Recall 📜 into your backpack to mark this landmark event!`,
              type: 'loot',
              timestamp: 'SYSTEM'
            });
          }
          const hasCaravanAmbush = targetChunk.npcs.some(n => n.id?.startsWith('ambushed_merchant_'));
          const ambushCleared = prev.caravanAmbushState?.[`${nextCx},${nextCy}`] === 'success';
          if (hasCaravanAmbush && !ambushCleared) {
            newMsgs.push({
              id: `sos_caravan_${Date.now()}_1`,
              text: `🚨 [EMERGENCY S.O.S.]: You spot a merchant caravan wagon ambushed by ruthless bandits nearby! Defend the caravan and defeat all bandits to claim your reward!`,
              type: 'combat',
              timestamp: 'SYSTEM'
            });
          }

          const hasCampSentry = targetChunk.enemies.some(e => e.id.includes('camp_guard_'));
          const campCleared = prev.clearedCamps?.includes(`camp_${nextCx}_${nextCy}`);
          if (hasCampSentry && !campCleared) {
            newMsgs.push({
              id: `sos_camp_${Date.now()}_2`,
              text: `🏕️ [WILD CAMP DETECTED]: Your scout instincts flare! A heavily fortified Hostile Raider Camp is positioned in this chunk, guarding a locked treasure chest!`,
              type: 'danger',
              timestamp: 'SYSTEM'
            });
          }

          const activeAlarm = prev.activeEscapeAlarm;
          if (activeAlarm) {
            newMsgs.push({
              id: `escaped_alarm_${Date.now()}`,
              text: `💨 [ESCAPED]: You have crossed the chunk border and successfully slipped away from the pursuing ${activeAlarm === 'syndicate' ? 'Moonshadow Syndicate' : (activeAlarm === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')} forces! The alarm has deactivated.`,
              type: 'info',
              timestamp: 'SYSTEM'
            });
          }

          const truncatedLogs = prev.logs.length > 35 ? prev.logs.slice(newMsgs.length) : prev.logs;

          return {
            ...prev,
            playerX: finalPx,
            playerY: finalPy,
            currentChunkX: nextCx,
            currentChunkY: nextCy,
            overworldZ: 0,
            overworldChunks: {
              ...updatedChunks,
              [targetChunkKey]: targetChunk
            },
            spawnedCats: nextSpawnedCats,
            spawnedSeppo: prev.spawnedSeppo || hasSeppoOnLoad,
            map: targetChunk.map,
            discovered: discovered,
            visible: fov,
            enemies: spawnFollowersOnLevelLoadByReset(targetChunk.enemies, prev.followers, finalPx, finalPy, targetChunk.map),
            traps: targetChunk.traps,
            chests: targetChunk.chests,
            npcs: targetChunk.npcs,
            lootPiles: targetChunk.lootPiles || [],
            equipmentInventory: newlyDiscoveredTown ? [
              ...prev.equipmentInventory,
              {
                id: `scroll_recall_town_${Date.now()}_${Math.random()}`,
                name: "Scroll of Recall 📜",
                type: 'scroll' as any,
                subType: 'Scroll' as any,
                defense: 0,
                damage: 0,
                critChance: 0,
                range: 0,
                color: '#38bdf8',
                description: "A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!",
                value: 200,
                durability: 100,
                maxDurability: 100
              }
            ] : prev.equipmentInventory,
            logs: [...truncatedLogs, ...newMsgs],
            visitedTiles: nextVisited,
            biome: targetChunk.biome,
            weather: getValidWeatherForBiome(targetChunk.biome, targetChunk.weather),
            activeEscapeAlarm: null,
            playerStats: {
              ...prev.playerStats,
              turnsPlayed: prev.playerStats.turnsPlayed + 1
            }
          };
        });

        executeEnemiesTurn(finalPx, finalPy);
        return;
      }
    }

    // Standard dungeon map check bounds
    if (targetX < 0 || targetX >= LEVEL_WIDTH || targetY < 0 || targetY >= LEVEL_HEIGHT) {
      return;
    }

    const tile = gameState.map[targetY][targetX];

    // Multi-floor Overworld Stairs climb
    if (gameState.isOverworld) {
      if (tile === TileType.StairsUp) {
        handleOverworldStairsTransition(targetX, targetY, 'up');
        return;
      }

      if (tile === TileType.StairsDown) {
        handleOverworldStairsTransition(targetX, targetY, 'down');
        return;
      }
    }

    // Wait Action (Skip turn)
    if (dx === 0 && dy === 0) {
      addLogMessage(`⏳ You stand alert, recovering a drip of Mana.`, 'system');

      setGameState((prev) => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + 2),
        },
      }));

      executeEnemiesTurn(gameState.playerX, gameState.playerY);
      return;
    }

    // Resource Harvesting
    if (tile === TileType.Tree || tile === TileType.PineTree || tile === TileType.BirchTree || tile === TileType.CopperVein || tile === TileType.IronVein) {
      if (handleResourceHarvest(tile, targetX, targetY, gameState)) {
        return;
      }
    }

    // Collision Blocks
    const isUnderworldLava = !gameState.isOverworld && gameState.playerStats.depth >= 6;
    const isWaterWalkable = gameState.season === 'winter' || hasEquippedTrait(gameState, 'SWAMP_GLIDE') || isUnderworldLava;
    const collides = tile === TileType.Wall || tile === TileType.Window || tile === TileType.Tree || tile === TileType.PineTree || tile === TileType.BirchTree || tile === TileType.CopperVein || tile === TileType.IronVein || (tile === TileType.Water && !isWaterWalkable) || tile === TileType.Table || tile === TileType.WatchtowerWall || tile === TileType.WatchtowerSlit || tile === TileType.WatchtowerBarricade;
    if (collides) {
      playSound('bump');
      return;
    }

    if (tile === TileType.Water && isWaterWalkable) {
      if (isUnderworldLava) {
        if (isPlayerInvincible(gameState, gameState.playerStats)) {
          addLogMessage(`🛡️ [GOD MODE]: Molten lava pools swirl harmlessly beneath your feet! (0 damage)`, 'info');
          playSound('shield');
        } else {
          const lavaDamage = 8;
          addLogMessage(`🔥 [LAVA POOL]: Searing magma burns your boots! You take ${lavaDamage} Fire Damage!`, 'danger');
          playSound('bump');

          const finalHp = Math.max(0, gameState.playerStats.hp - lavaDamage);
          setGameState((prev) => ({
            ...prev,
            playerStats: {
              ...prev.playerStats,
              hp: finalHp,
            },
          }));

          const shakeEv = new CustomEvent('spawn-game-effect', {
            detail: { x: targetX, y: targetY, text: `🔥 -${lavaDamage} HP`, type: 'dmg' },
          });
          window.dispatchEvent(shakeEv);

          if (finalHp <= 0) {
            playSound('defeat');
            setIsGameOver(true);
            return;
          }
        }
      } else if (hasEquippedTrait(gameState, 'SWAMP_GLIDE')) {
        addLogMessage(`🐊 [BAYOU SLIDE]: Your Swamp-Glide gear allows you to glide effortlessly through the murky water!`, 'system');
        const iceEv = new CustomEvent('spawn-game-effect', {
          detail: { x: targetX, y: targetY, text: `🐊 Glide!`, type: 'heal' },
        });
        window.dispatchEvent(iceEv);
      } else {
        addLogMessage(`⛸️ [ICY SHORES]: You slide gracefully across the frozen water ice platform!`, 'system');
        const iceEv = new CustomEvent('spawn-game-effect', {
          detail: { x: targetX, y: targetY, text: `⛸️ Slide!`, type: 'heal' },
        });
        window.dispatchEvent(iceEv);
      }
    }

    if (tile === TileType.Door) {
      handleOpenDoor(targetX, targetY, gameState);
      return;
    }

    if (tile === TileType.DungeonEntrance) {
      descendToDungeonFirstFloor();
      return;
    }

    if (tile === TileType.TownGate) {
      playSound('bump');
      addLogMessage('∏ You approach the wooden Village gateway arch.', 'system');
    }

    if (tile === TileType.StairsDown) {
      advanceToNextDepth();
      return;
    }

    // NPC check
    if (gameState.isOverworld && gameState.npcs) {
      const npcIndex = gameState.npcs.findIndex((n) => n.x === targetX && n.y === targetY);
      if (npcIndex !== -1) {
        interactWithNpc(gameState.npcs[npcIndex]);
        return;
      }
    }

    // Enemy check
    const enemyIndex = gameState.enemies.findIndex((e) => e.x === targetX && e.y === targetY);
    if (enemyIndex !== -1) {
      const activeEnemy = gameState.enemies[enemyIndex];

      if (activeEnemy.isFollower || (activeEnemy.isCaptive && activeEnemy.isFreed)) {
        const prevPx = gameState.playerX;
        const prevPy = gameState.playerY;

        setGameState((prev) => {
          const updatedEnemies = prev.enemies.map((e, idx) => {
            if (idx === enemyIndex) {
              return { ...e, x: prevPx, y: prevPy };
            }
            return e;
          });

          return {
            ...prev,
            playerX: targetX,
            playerY: targetY,
            enemies: updatedEnemies
          };
        });

        addLogMessage(`🐾 You step past ${activeEnemy.name}, swapping places smoothly.`, 'system');
        executeEnemiesTurn(targetX, targetY);
        return;
      }

      if (activeEnemy.isCaptive && !activeEnemy.isFreed) {
        const rawName = activeEnemy.name.replace('🔒 ', '');
        const hasRoom = gameState.followers.length < 3;

        setGameState((prev) => {
          let archetypeId: 'guard' | 'thief' | 'cat' | 'merchant_guard' = 'thief';
          let char = '🧍';
          let color = '#10b981';
          let personality = `Freed from a dark dungeon cage. Loyal to the Sunder Champion who broke their chains.`;

          if (rawName.includes('Cleric')) {
            archetypeId = 'guard';
            char = '⚕️';
            color = '#38bdf8';
            personality = `A holy healer freed from dungeon captivity. Sworn to restore and safeguard the Champion.`;
          } else if (rawName.includes('Miner')) {
            archetypeId = 'thief';
            char = '⛏️';
            color = '#fbbf24';
            personality = `An industrious cavern miner rescued from captivity. Gladly lends heavy pick utility.`;
          } else if (rawName.includes('Merchant')) {
            archetypeId = 'merchant_guard';
            char = '💰';
            color = '#f59e0b';
            personality = `A wealthy trader's guard trapped in the deep. Gratefully pledges commercial and physical aid.`;
          } else if (rawName.includes('Wanderer')) {
            archetypeId = 'thief';
            char = '🏹';
            color = '#c084fc';
            personality = `An agile rogue ranger caught scouting these deep chambers. Ready to strike from behind.`;
          } else if (rawName.includes('Peasant')) {
            archetypeId = 'thief';
            char = '🧍';
            color = '#94a3b8';
            personality = `A humble laborer who was locked up by dungeons. Indebted to follow you to safety.`;
          }

          const followerId = `fol_freed_${Date.now()}`;
          const nextEnemies = [...prev.enemies];

          if (prev.followers.length < 3) {
            const nextFollower: Follower = {
              id: followerId,
              name: rawName,
              archetypeId,
              role: 'follower',
              char,
              color,
              hp: activeEnemy.hp * 3,
              maxHp: activeEnemy.maxHp * 3,
              atk: activeEnemy.atk + 2,
              def: activeEnemy.def + 2,
              level: 1,
              xp: 0,
              xpNext: 100,
              mode: 'follow',
              equipment: { weapon: null, armor: null },
              inventory: [],
              injuries: [],
              personality,
              temperament: 'Grateful'
            };

            nextEnemies[enemyIndex] = {
              ...activeEnemy,
              id: `actor_${followerId}`,
              isFreed: true,
              isFollower: true,
              followerId: followerId,
              name: rawName,
              hp: nextFollower.hp,
              maxHp: nextFollower.maxHp,
              atk: nextFollower.atk,
              def: nextFollower.def,
              char,
              color,
              state: EnemyState.Chasing
            };

            return {
              ...prev,
              enemies: nextEnemies,
              followers: [...prev.followers, nextFollower]
            };
          } else {
            nextEnemies[enemyIndex] = {
              ...activeEnemy,
              isFreed: true,
              isFollower: true,
              name: `${rawName} (Floor Ally)`,
              hp: activeEnemy.hp * 2,
              maxHp: activeEnemy.maxHp * 2,
              char,
              color,
              state: EnemyState.Chasing
            };

            return {
              ...prev,
              enemies: nextEnemies
            };
          }
        });

        playSound('levelUp');

        if (hasRoom) {
          addLogMessage(`🔓 You break open the cage and free the ${rawName}!`, 'loot');
          addLogMessage(`👥 COMPANION JOINED: ${rawName} has pledged their life to you as a permanent companion!`, 'info');
          addLogMessage(`🗣️ ${rawName}: "Thank you adventurer! I was trapped here forever. My steel is yours — I will follow you to the ends of Sunder!"`, 'info');
        } else {
          addLogMessage(`🔓 You break open the cage and free the ${rawName}!`, 'loot');
          addLogMessage(`👥 PARTY FULL: Since your companion list is full (max 3), ${rawName} joins you as a floor ally!`, 'system');
          addLogMessage(`🗣️ ${rawName}: "Thank you for rescuing me! I see you already have a full crew, but I will help you clear out the beasts of this floor!"`, 'info');
        }

        const effectEv = new CustomEvent('spawn-game-effect', {
          detail: { x: targetX, y: targetY, text: "🔓 FREED!", type: 'heal' },
        });
        window.dispatchEvent(effectEv);

        executeEnemiesTurn(gameState.playerX, gameState.playerY);
        return;
      }

      if (activeEnemy.isTownGuard && !gameState.areGuardsHostile) {
        setUnlawfulGuardTarget({ enemy: activeEnemy, index: enemyIndex, pathPoints: [] });
        return;
      }
      const acted = performPlayerAttack(activeEnemy, enemyIndex, []);
      if (acted) {
        executeEnemiesTurn(gameState.playerX, gameState.playerY);
      }
      return;
    }

    // Chest check
    const chestIndex = gameState.chests.findIndex((c) => c.x === targetX && c.y === targetY && !c.isOpened);
    if (chestIndex !== -1) {
      const chest = gameState.chests[chestIndex];

      if (chest.keyRequired) {
        const hasKeyCount = gameState.inventoryMaterials[chest.keyRequired] || 0;
        const hasSkeletonKey = (gameState.inventoryMaterials['mat_skeleton_key'] || 0) > 0;
        const hasLockpicks = (gameState.inventoryMaterials['mat_lockpick'] || 0) > 0;

        if (hasKeyCount > 0) {
          setGameState((prev) => {
            const nextMats = { ...prev.inventoryMaterials };
            nextMats[chest.keyRequired!] = Math.max(0, (nextMats[chest.keyRequired!] || 0) - 1);
            return {
              ...prev,
              inventoryMaterials: nextMats
            };
          });

          addLogMessage(`🔑 [KEY USED]: You inserted the Faction Watchtower Key into the massive padlock! It turns with a heavy, satisfying metallic CLANK!`, 'loot');
          handleOpenChest(chestIndex, false);
          return;
        } else if (hasSkeletonKey) {
          setGameState((prev) => {
            const nextMats = { ...prev.inventoryMaterials };
            nextMats['mat_skeleton_key'] = Math.max(0, (nextMats['mat_skeleton_key'] || 0) - 1);
            return {
              ...prev,
              inventoryMaterials: nextMats
            };
          });

          addLogMessage(`💀 [SKELETON KEY USED]: You bypassed the Faction Padlock using a rare Grim Skeleton Key!`, 'loot');
          handleOpenChest(chestIndex, false);
          return;
        } else if (hasLockpicks) {
          addLogMessage(`🔒 You encountered a locked Faction Tribute Chest! Pulling out Tension Lockpicks...`, 'system');
          setActiveLockpickingChestIndex(chestIndex);
          setIsLockpickingOpen(true);
          return;
        } else {
          playSound('deny');
          addLogMessage(`🔒 [KEY OR LOCKPICKS REQUIRED]: The Faction Tribute Chest is sealed shut! Defeat the Watchtower Commander for the key, craft Tension Lockpicks, or use a Skeleton Key!`, 'danger');
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: targetX, y: targetY, text: `🔒 Key or Lockpicks Required`, type: 'text' },
          });
          window.dispatchEvent(ev);
          return;
        }
      }

      playSound('loot');
      let nameStr = "Locked Chest";
      if (chest.id?.includes("camp_chest")) {
        nameStr = "🔒 Locked Camp Chest";
      } else if (chest.id?.includes("ruined_chest")) {
        nameStr = "🏺 Ancient Ruined Vault Chest";
      } else if (chest.id?.includes("oasis_chest")) {
        nameStr = "🌴 Hidden Oasis Sarcophagus";
      } else if (chest.id?.startsWith("chest_")) {
        nameStr = "🕸️ Locked Dungeon Depth Chest";
      }

      addLogMessage(`🔒 You encountered a locked ${nameStr}! Pulling out Tension Lockpicks...`, 'system');
      setActiveLockpickingChestIndex(chestIndex);
      setIsLockpickingOpen(true);
      return;
    }

    let isPoisonedMove = false;
    let nextHp = stats.hp;
    let activeMoveScars = stats.scars ? [...stats.scars] : [];

    const steppedTrapIndex = gameState.traps.findIndex((t) => t.x === targetX && t.y === targetY);
    let nextTraps = [...gameState.traps];

    let currentScoutingLvl = stats.scoutingLevel || 1;
    let currentScoutingXp = stats.scoutingXp || 0;

    if (steppedTrapIndex !== -1 && !isLunarBlessingActive(gameState, 'new_moon')) {
      const activeTrap = gameState.traps[steppedTrapIndex];
      if (!activeTrap.triggered || activeTrap.type === 'FireVent') {
        if (activeTrap.detected && !activeTrap.triggered) {
          const roll = Math.floor(Math.random() * 20) + 1;
          const disarmSkill = (stats.dex || 10) + currentScoutingLvl * 4;
          const difficulty = activeTrap.type === 'FireVent' ? 18 : activeTrap.type === 'PoisonGas' ? 14 : 12;

          if (roll + disarmSkill >= difficulty) {
            playSound('loot');
            const xpGained = 25;
            currentScoutingXp += xpGained;
            let levelUpText = '';
            if (currentScoutingXp >= currentScoutingLvl * 100) {
              currentScoutingXp -= currentScoutingLvl * 100;
              currentScoutingLvl += 1;
              levelUpText = ` 🎓 [SCOUTING UPGRADE]: Your Trap Detection & Scouting level increased to Level ${currentScoutingLvl}!`;
              setTimeout(() => playSound('levelUp'), 150);
            }

            addLogMessage(`🔧 [DISARM SUCCESS]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) You disarmed the ${activeTrap.type}! (+25 Scouting XP)${levelUpText}`, 'loot');

            nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };

            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: targetX, y: targetY, text: `🔧 DISARMED`, type: 'heal' },
            });
            window.dispatchEvent(ev);
          } else {
            const luckRoll = Math.random();
            const effectiveLck = getEffectiveAttribute(gameState, 'lck');
            const evadeChance = Math.min(0.75, Math.max(0.05, effectiveLck * 0.02));
            if (luckRoll < evadeChance) {
              playSound('loot');
              addLogMessage(`🍀 [LUCK EVADE]: (Disarm Failed) You slipped up, but your incredible luck (${stats.lck || 10} LCK) saved you! You dodged the springing parts of the ${activeTrap.type} trap! (+10 Scouting XP)`, 'loot');
              nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
              currentScoutingXp += 10;
              const ev = new CustomEvent('spawn-game-effect', {
                detail: { x: targetX, y: targetY, text: `🍀 EVADED!`, type: 'heal' },
              });
              window.dispatchEvent(ev);
            } else {
              let trapDamage = 6;
              let trapLog = '';
              if (activeTrap.type === 'Spikes') {
                trapDamage = Math.floor(Math.random() * 5) + 6;
                trapLog = `💥 [DISARM FAIL]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) Your fingers slip! Spikes snap! Sustained -${trapDamage} HP.`;
                nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
              } else if (activeTrap.type === 'PoisonGas') {
                trapDamage = 4;
                trapLog = `🧪 [DISARM FAIL]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) Gas nozzle explodes! Sustained -${trapDamage} HP & poison.`;
                isPoisonedMove = true;
              } else if (activeTrap.type === 'FireVent') {
                trapDamage = 12;
                trapLog = `🔥 [DISARM FAIL]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) Searing volcanic fumes burst! Sustained -${trapDamage} HP burning.`;
              } else if (activeTrap.type === 'Geyser') {
                trapDamage = 10;
                trapLog = `🌊 [DISARM FAIL]: High-pressure tidal geyser erupts! Sustained -${trapDamage} HP water damage.`;
              } else if (activeTrap.type === 'MagmaEruption') {
                trapDamage = 16;
                trapLog = `🌋 [DISARM FAIL]: Molten magma fissure detonates! Sustained -${trapDamage} HP searing burn damage.`;
              } else if (activeTrap.type === 'FrostbiteVent') {
                trapDamage = 8;
                trapLog = `❄️ [DISARM FAIL]: Cryogenic glacial vent blasts freezing frost! Sustained -${trapDamage} HP frost damage.`;
              } else if (activeTrap.type === 'FallingIcicle') {
                trapDamage = 11;
                trapLog = `🧊 [DISARM FAIL]: Heavy razor icicle crashes down! Sustained -${trapDamage} HP crushing damage.`;
              } else if (activeTrap.type === 'SulfurVent') {
                trapDamage = 6;
                trapLog = `☠️ [DISARM FAIL]: Choking noxious sulfur gas leaks! Sustained -${trapDamage} HP & poison.`;
                isPoisonedMove = true;
              }

              if (isPlayerInvincible(gameState, gameState.playerStats)) {
                trapDamage = 0;
                isPoisonedMove = false;
                addLogMessage(`🛡️ [GOD MODE]: You triggered a ${activeTrap.type} trap, but divine invulnerability shields you completely! (0 damage)`, 'info');
                playSound('shield');
                const ev = new CustomEvent('spawn-game-effect', {
                  detail: { x: targetX, y: targetY, text: `🛡️ IMMUNE`, type: 'heal' },
                });
                window.dispatchEvent(ev);
              } else {
                playSound('trap');
                nextHp -= trapDamage;
                addLogMessage(trapLog, 'danger');
                setShakeTrigger((s) => s + 1);

                const ev = new CustomEvent('spawn-game-effect', {
                  detail: { x: targetX, y: targetY, text: `💥 TRAP! -${trapDamage} HP`, type: 'dmg' },
                });
                window.dispatchEvent(ev);

                const scarResult = evaluateScarAcquisition(trapDamage, nextHp, stats.maxHp, activeMoveScars, stats.turnsPlayed + 1);
                if (scarResult) {
                  activeMoveScars.push(scarResult.scar);
                  addLogMessage(scarResult.logText, 'danger');
                  setTimeout(() => { playSound('trap'); }, 40);
                  const evSc = new CustomEvent('spawn-game-effect', {
                    detail: { x: targetX, y: targetY, text: `🤕 SCARRED!`, type: 'heal' },
                  });
                  window.dispatchEvent(evSc);
                }
              }
            }
          }
        } else {
          const luckRoll = Math.random();
          const effectiveLck = getEffectiveAttribute(gameState, 'lck');
          const evadeChance = Math.min(0.75, Math.max(0.05, effectiveLck * 0.02));
          if (luckRoll < evadeChance) {
            playSound('loot');
            addLogMessage(`🍀 [LUCK EVADE]: You stepped on a hidden ${activeTrap.type}, but your incredible luck (${stats.lck || 10} LCK) saved you! You avoided taking any damage! (+10 Scouting XP)`, 'loot');
            nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
            currentScoutingXp += 10;
            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: targetX, y: targetY, text: `🍀 EVADED!`, type: 'heal' },
            });
            window.dispatchEvent(ev);
          } else {
            playSound('trap');
            let trapDamage = 6;
            let trapLog = '';

            if (activeTrap.type === 'Spikes') {
              trapDamage = Math.floor(Math.random() * 5) + 6;
              trapLog = `💥 SNAP! You stumbled onto hidden floor spikes! Sustained -${trapDamage} HP.`;
              nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
            } else if (activeTrap.type === 'PoisonGas') {
              trapDamage = 4;
              trapLog = `🧪 GAS! You stepped on an invisible poison gas vent! Sustained -${trapDamage} HP & poison.`;
              isPoisonedMove = true;
            } else if (activeTrap.type === 'FireVent' && activeTrap.isActive) {
              trapDamage = 12;
              trapLog = `🔥 BLAZE! You walked into a hidden Fire Vent! Sustained -${trapDamage} HP burning.`;
            } else if (activeTrap.type === 'Geyser') {
              trapDamage = 10;
              trapLog = `🌊 SURGE! A high-pressure tidal geyser detonates under your feet! Sustained -${trapDamage} HP water damage.`;
              nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
            } else if (activeTrap.type === 'MagmaEruption' && activeTrap.isActive) {
              trapDamage = 16;
              trapLog = `🌋 MAGMA! You walked into an active volcanic fissure! Sustained -${trapDamage} HP heavy burn.`;
            } else if (activeTrap.type === 'FrostbiteVent') {
              trapDamage = 8;
              trapLog = `❄️ FROSTBITE! A freezing cryogenic glacial vent blasts your boots! Sustained -${trapDamage} HP frost damage.`;
              nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
            } else if (activeTrap.type === 'FallingIcicle') {
              trapDamage = 11;
              trapLog = `🧊 CRASH! A razor-sharp stalactite icicle falls from the ceiling! Sustained -${trapDamage} HP crushing damage.`;
              nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
            } else if (activeTrap.type === 'SulfurVent') {
              trapDamage = 6;
              trapLog = `☠️ CHOKE! You inhale toxic sulfur fumes from a volcanic vent! Sustained -${trapDamage} HP & poison.`;
              isPoisonedMove = true;
            } else {
              trapDamage = 0;
            }

            if (isPlayerInvincible(gameState, gameState.playerStats)) {
              trapDamage = 0;
              isPoisonedMove = false;
              addLogMessage(`🛡️ [GOD MODE]: You stepped on a ${activeTrap.type} trap, but divine invulnerability shields you completely! (0 damage)`, 'info');
              playSound('shield');
              const ev = new CustomEvent('spawn-game-effect', {
                detail: { x: targetX, y: targetY, text: `🛡️ IMMUNE`, type: 'heal' },
              });
              window.dispatchEvent(ev);
            } else if (trapDamage > 0) {
              nextHp -= trapDamage;
              addLogMessage(trapLog, 'danger');
              setShakeTrigger((s) => s + 1);

              const scarResult = evaluateScarAcquisition(trapDamage, nextHp, stats.maxHp, activeMoveScars, stats.turnsPlayed + 1);
              if (scarResult) {
                activeMoveScars.push(scarResult.scar);
                addLogMessage(scarResult.logText, 'danger');
                setTimeout(() => { playSound('trap'); }, 40);
                const evSc = new CustomEvent('spawn-game-effect', {
                  detail: { x: targetX, y: targetY, text: `🤕 SCARRED!`, type: 'heal' },
                });
                window.dispatchEvent(evSc);
              }

              const ev = new CustomEvent('spawn-game-effect', {
                detail: { x: targetX, y: targetY, text: `-${trapDamage} TRAP`, type: 'dmg' },
              });
              window.dispatchEvent(ev);
            }
          }
        }
      }
    } else if (steppedTrapIndex !== -1 && isLunarBlessingActive(gameState, 'new_moon')) {
      addLogMessage(`🌑 [SHADOW VEIL]: You drift over a hidden ${gameState.traps[steppedTrapIndex].type} trap without triggering it!`, 'info');
    }

    const scanRadius = stats.int >= 30 ? 4 : stats.int >= 18 ? 3 : 2;
    let detectedCount = 0;
    let detectedViaIntellect = 0;
    let scoutingXpEarned = 0;

    nextTraps = nextTraps.map((trap) => {
      if (trap.detected || trap.triggered) return trap;

      const dist = Math.max(Math.abs(trap.x - targetX), Math.abs(trap.y - targetY));
      if (dist <= scanRadius) {
        const baseChance = 0.20 + (stats.dex * 0.01) + (stats.lck * 0.01) + (stats.int * 0.015) + currentScoutingLvl * 0.10;
        if (Math.random() < baseChance) {
          detectedCount++;
          if (dist > 2 || stats.int >= 15) {
            detectedViaIntellect++;
          }
          scoutingXpEarned += 15;
          return { ...trap, detected: true, hidden: false };
        }
      }
      return trap;
    });

    if (detectedCount > 0) {
      playSound('spell');
      currentScoutingXp += scoutingXpEarned;
      let levelUpText = '';
      if (currentScoutingXp >= currentScoutingLvl * 100) {
        currentScoutingXp -= currentScoutingLvl * 100;
        currentScoutingLvl += 1;
        levelUpText = ` 🎓 [SCOUTING UPGRADE]: Your Trap Detection & Scouting level increased to Level ${currentScoutingLvl}!`;
        setTimeout(() => playSound('levelUp'), 150);
      }

      let logMessage = `👁️ [PERCEPTION]: Spot ${detectedCount} hidden trap${detectedCount > 1 ? 's' : ''}! (+${scoutingXpEarned} Scouting XP)${levelUpText}`;
      if (detectedViaIntellect > 0) {
        logMessage = `🧠 [INTELLECT DISCOVERY]: Your high intellect (${stats.int} INT) reveals ${detectedCount} hidden trap${detectedCount > 1 ? 's' : ''} from a distance! (+${scoutingXpEarned} Scouting XP)${levelUpText}`;
      }
      addLogMessage(logMessage, 'info');
    }

    let nextLootPiles = gameState.lootPiles ? [...gameState.lootPiles] : [];
    const lootIndex = nextLootPiles.findIndex(l => l.x === targetX && l.y === targetY);
    let collectedGold = 0;

    if (lootIndex !== -1) {
      playSound('loot');
      const pile = nextLootPiles[lootIndex];
      collectedGold = pile.gold;

      addLogMessage(`💰 Collected loot pile: +${pile.gold} Gold!`, 'loot');

      pile.materials.forEach(mid => {
        const uWeight = getMaterialUnitWeight(mid);
        if (mid === 'mat_wood') {
          addLogMessage(`  + Gathered: Scrap Wood 🌲 (Weight: ${uWeight} kg)`, 'loot');
        } else if (mid === 'mat_raw_meat') {
          addLogMessage(`  + Acquired: Raw Meat 🥩 (Weight: ${uWeight} kg)`, 'loot');
        } else if (mid === 'mat_cooked_meat') {
          addLogMessage(`  + Acquired: Cooked Meat 🍖 (Weight: ${uWeight} kg)`, 'loot');
        } else {
          const mat = BASIC_MATERIALS.find(m => m.id === mid);
          if (mat) addLogMessage(`  + Metal Material: ${mat.name} (${uWeight} kg)`, 'loot');
        }
      });

      pile.catalysts.forEach(cid => {
        const uWeight = getMaterialUnitWeight(cid);
        const cat = ELEMENTAL_CATALYSTS.find(c => c.id === cid);
        if (cat) addLogMessage(`  + Crystal Catalyst: ${cat.name} (${uWeight} kg)`, 'loot');
      });

      pile.equipment.forEach(equip => {
        const uWeight = getItemWeight(equip);
        addLogMessage(`  + Unlocked Equipment: ${equip.name} (${equip.type === 'weapon' ? `ATK: ${equip.damage}` : `DEF: ${equip.defense}`} · ${uWeight} kg)`, 'loot');
      });
    }

    const nextFov = computeFOV(targetX, targetY, gameState.map, 6);
    const nextDiscovered = gameState.discovered.map((row, y) =>
      row.map((cell, x) => cell || nextFov[y][x])
    );

    const nextVisited = { ...gameState.visitedTiles };
    nextVisited[`${targetX},${targetY},${gameState.currentChunkX},${gameState.currentChunkY}`] = true;

    const wasIndoors = isPlayerIndoors(gameState);
    const nowIndoors = isPlayerIndoors({
      isOverworld: gameState.isOverworld,
      map: gameState.map,
      playerX: targetX,
      playerY: targetY,
    });

    if (!wasIndoors && nowIndoors) {
      playSound('door_open', { volume: 0.7 });
      playSound('indoor_entry', { volume: 0.5 });
      addLogMessage('🏠 [INDOOR SHELTER]: You step inside the building shelter. Outdoor atmospheric sound muffles.', 'system');
    } else if (wasIndoors && !nowIndoors) {
      playSound('door_close', { volume: 0.6 });
      addLogMessage('🌲 [OUTDOOR AIR]: You step outside into the open atmosphere.', 'system');
    } else if (nowIndoors) {
      const stepTile = gameState.map[targetY]?.[targetX];
      const isStone = stepTile === TileType.StairsUp || stepTile === TileType.StairsDown || stepTile === TileType.Anvil;
      playSound(isStone ? 'stone_footstep' : 'wood_footstep', { volume: 0.08 });

      if (stepTile === TileType.Anvil) {
        addLogMessage('⚒️ [BLACKSMITH ANVIL]: You step right beside the heavy steel anvil! Open the Forge panel to forge, upgrade, and mutate gear.', 'craft');
        setActiveTab('forge');
      } else if (stepTile === TileType.Fireplace) {
        addLogMessage('🔥 [FORGE HEARTH]: Searing heat radiates from the roaring forge hearth, warming you and cleansing chill.', 'system');
        setGameState((prev) => ({
          ...prev,
          playerStats: {
            ...prev.playerStats,
            exhaustion: Math.max(0, (prev.playerStats.exhaustion || 0) - 10),
            hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + 5)
          }
        }));
      } else if (stepTile === TileType.Chair) {
        addLogMessage('🪑 [SEATED REST]: You sit down comfortably on the wooden chair/stool to rest your feet and catch your breath.', 'system');
      } else if (stepTile === TileType.Bed) {
        addLogMessage('🛏️ [COT REST]: You lie down on the comfortable cot to rest up. Restored +20 HP!', 'system');
        setGameState((prev) => ({
          ...prev,
          playerStats: {
            ...prev.playerStats,
            hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + 20),
            exhaustion: Math.max(0, (prev.playerStats.exhaustion || 0) - 25)
          }
        }));
      }
    } else {
      playSound('grass_step', { volume: 0.06 });
    }

    setGameState((prev) => {
      let activeEffectsList = prev.playerStats.activeEffects ? [...prev.playerStats.activeEffects] : [];
      if (isPoisonedMove) {
        activeEffectsList = activeEffectsList.filter(e => e.id !== 'poison');
        activeEffectsList.push({
          id: 'poison',
          name: 'Poisoned',
          type: 'debuff',
          icon: '🤢',
          description: 'Sustained toxic damage over time. Deals -2 HP per turn.',
          turnsRemaining: 15,
          color: '#10b981',
          damagePerTurn: 2
        });
      }

      let updatedMaterials = prev.inventoryMaterials;
      let updatedCatalysts = prev.inventoryCatalysts;
      let updatedEquipment = prev.equipmentInventory;
      let updatedLootPiles = prev.lootPiles ? [...prev.lootPiles] : [];

      if (lootIndex !== -1) {
        const pile = updatedLootPiles[lootIndex];
        const nextMats = { ...prev.inventoryMaterials };
        const nextCats = { ...prev.inventoryCatalysts };
        const nextEquipment = [...prev.equipmentInventory];

        pile.materials.forEach(mid => {
          nextMats[mid] = (nextMats[mid] || 0) + 1;
        });
        pile.catalysts.forEach(cid => {
          nextCats[cid] = (nextCats[cid] || 0) + 1;
        });
        pile.equipment.forEach(equip => {
          nextEquipment.push(equip);
        });

        updatedLootPiles.splice(lootIndex, 1);
        updatedMaterials = nextMats;
        updatedCatalysts = nextCats;
        updatedEquipment = nextEquipment;
      }

      let nextOverworldChunks = { ...prev.overworldChunks };
      let finalHp = Math.min(prev.playerStats.maxHp, nextHp);
      let finalXp = prev.playerStats.xp;
      let finalLevel = prev.playerStats.level;
      let finalNextLevelXp = prev.playerStats.nextLevelXp;
      let finalMaxHp = prev.playerStats.maxHp;
      let finalMaxMp = prev.playerStats.maxMp;
      let finalMp = prev.playerStats.mp;
      let finalAtk = prev.playerStats.atk;
      let finalDef = prev.playerStats.def;
      let finalUnspentPoints = prev.playerStats.unspentPoints || 0;
      let finalGold = prev.playerStats.gold + collectedGold;
      let finalFactionRep = prev.factionReputation ? { ...prev.factionReputation } : { syndicate: 0, vanguard: 0, bandits: 0 };
      const nextLogs = [...prev.logs];

      const currentChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const currentChunkObj = prev.overworldChunks[currentChunkKey];

      if (prev.isOverworld && currentChunkObj && prev.map[targetY]?.[targetX] === TileType.WatchtowerFlag) {
        const wt = currentChunkObj.watchtower;
        if (wt) {
          if (!wt.isClaimed) {
            const garrisonAlive = prev.enemies.some(e =>
              (e.id?.includes(`_${prev.currentChunkX}_${prev.currentChunkY}`) &&
               (e.id?.startsWith('wt_commander_') || e.id?.startsWith('wt_knight') || e.id?.startsWith('wt_ranger_')))
            );

            if (garrisonAlive) {
              playSound('deny');
              nextLogs.push({
                id: `garrison_active_${Date.now()}`,
                text: `🛡️ [GARRISON ACTIVE]: Watchtower Sentinel Garrison is actively defending! Defeat all sentries and the Commander before claiming the flag.`,
                type: 'danger',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });
            } else {
              const nextPercent = Math.min(100, wt.claimPercent + 25);
              const updatedWt = { ...wt, claimPercent: nextPercent };

              if (nextPercent >= 100) {
                const playerFaction = prev.faction || 'neutral';
                updatedWt.isClaimed = true;
                updatedWt.controller = playerFaction;
                updatedWt.garrisonDefeated = true;

                setTimeout(() => playSound('levelUp'), 150);
                nextLogs.push({
                  id: `wt_secured_${Date.now()}`,
                  text: `👑 [WATCHTOWER SECURED]: Captured for ${playerFaction === 'syndicate' ? 'Moonshadow Syndicate' : (playerFaction === 'vanguard' ? 'Dawn Vanguard' : (playerFaction === 'bandits' ? 'Rust-Raider Bandits' : 'Independent Renegades'))}! (+150 XP)`,
                  type: 'loot',
                  timestamp: formatGameTime(prev.gameTime).timeStr
                });

                let updatedXp = finalXp + 150;
                const bonuses = gameConfig.levelUpBonuses;
                while (updatedXp >= finalNextLevelXp) {
                  finalLevel += 1;
                  updatedXp -= finalNextLevelXp;
                  finalNextLevelXp = Math.floor(finalNextLevelXp * bonuses.xpThresholdMultiplier);
                  finalMaxHp += bonuses.maxHp;
                  finalHp = finalMaxHp;
                  finalMaxMp += bonuses.maxMp;
                  finalMp = finalMaxMp;
                  finalAtk += bonuses.atk;
                  finalDef += bonuses.def;
                  finalUnspentPoints += bonuses.attributePoints;

                  nextLogs.push({
                    id: `lvl_up_wt_${Date.now()}_${finalLevel}`,
                    text: `🌟 LEVEL UP! You reached Level ${finalLevel}! (+${bonuses.attributePoints} Stat Points, +${bonuses.maxHp} Max HP)`,
                    type: 'quest',
                    timestamp: formatGameTime(prev.gameTime).timeStr
                  });
                }
                finalXp = updatedXp;

                if (playerFaction !== 'neutral') {
                  const currentRep = finalFactionRep[playerFaction] || 0;
                  finalFactionRep[playerFaction] = Math.min(100, currentRep + 30);
                  nextLogs.push({
                    id: `wt_rep_${Date.now()}`,
                    text: `⚖️ [REPUTATION GAINED]: Secured a strategic stronghold! +30 Standing with ${playerFaction === 'syndicate' ? 'Moonshadow Syndicate' : (playerFaction === 'vanguard' ? 'Dawn Vanguard' : 'Rust-Raider Bandits')} (Current: ${finalFactionRep[playerFaction]})`,
                    type: 'info',
                    timestamp: formatGameTime(prev.gameTime).timeStr
                  });
                }
              } else {
                playSound('loot');
                nextLogs.push({
                  id: `wt_capturing_${Date.now()}`,
                  text: `🚩 [CAPTURING FLAG]: Securing the Faction Watchtower... (${nextPercent}% Captured)`,
                  type: 'info',
                  timestamp: formatGameTime(prev.gameTime).timeStr
                });
              }

              nextOverworldChunks[currentChunkKey] = {
                ...currentChunkObj,
                watchtower: updatedWt
              };
            }
          } else {
            if (wt.taxGoldAccumulated > 0) {
              playSound('loot');
              finalGold += wt.taxGoldAccumulated;
              nextLogs.push({
                id: `tax_collected_${Date.now()}`,
                text: `💰 [TAX COLLECTED]: Collected +${wt.taxGoldAccumulated} Gold in tribute tax from the watchtower garrison!`,
                type: 'loot',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });

              nextOverworldChunks[currentChunkKey] = {
                ...currentChunkObj,
                watchtower: {
                  ...wt,
                  taxGoldAccumulated: 0
                }
              };
            }
          }
        }
      }

      const currentTurns = prev.playerStats.turnsPlayed + 1;
      if (currentTurns % 30 === 0) {
        Object.keys(nextOverworldChunks).forEach(key => {
          const chunk = nextOverworldChunks[key];
          if (chunk.watchtower && chunk.watchtower.isClaimed) {
            nextOverworldChunks[key] = {
              ...chunk,
              watchtower: {
                ...chunk.watchtower,
                taxGoldAccumulated: (chunk.watchtower.taxGoldAccumulated || 0) + 25
              }
            };
          }
        });
      }

      return {
        ...prev,
        playerX: targetX,
        playerY: targetY,
        visible: nextFov,
        discovered: nextDiscovered,
        traps: nextTraps,
        lootPiles: updatedLootPiles,
        visitedTiles: nextVisited,
        inventoryMaterials: updatedMaterials,
        inventoryCatalysts: updatedCatalysts,
        equipmentInventory: updatedEquipment,
        overworldChunks: nextOverworldChunks,
        logs: nextLogs,
        playerStats: {
          ...prev.playerStats,
          hp: finalHp,
          xp: finalXp,
          level: finalLevel,
          nextLevelXp: finalNextLevelXp,
          maxHp: finalMaxHp,
          maxMp: finalMaxMp,
          mp: finalMp,
          atk: finalAtk,
          def: finalDef,
          unspentPoints: finalUnspentPoints,
          gold: finalGold,
          turnsPlayed: currentTurns,
          scars: activeMoveScars,
          activeEffects: activeEffectsList,
          scoutingLevel: currentScoutingLvl,
          scoutingXp: currentScoutingXp,
        },
        factionReputation: finalFactionRep
      };
    });

    if (nextHp <= 0) {
      playSound('defeat');
      setIsGameOver(true);
      return;
    }

    executeEnemiesTurn(targetX, targetY);
  };

  return { makeMove };
}
