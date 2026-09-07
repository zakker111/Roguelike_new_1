/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TileType, Follower, EnemyState } from '../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../utils/gameUtils';
import { isPlayerInvincible } from '../../utils/invincibility';
import {
  UsePlayerTurnMovementProps,
  checkOverburdenedMovement,
  checkWeatherMovementPenalties,
  handleChunkBorderCrossing,
  resolveStepEffects
} from './movement';

export type { UsePlayerTurnMovementProps };

export function usePlayerTurnMovement(props: UsePlayerTurnMovementProps) {
  const {
    isPlaying,
    isGameOver,
    isVictory,
    gameState,
    setGameState,
    playSound,
    addLogMessage,
    executeEnemiesTurn,
    setIsGameOver,
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
    hasEquippedTrait
  } = props;

  const makeMove = (dx: number, dy: number) => {
    if (!isPlaying || isGameOver || isVictory) return;

    // Overburdened sluggish/stagger checks
    if (checkOverburdenedMovement(gameState, dx, dy, playSound, addLogMessage, executeEnemiesTurn)) {
      return;
    }

    // Weather & Seasonal Fatigue Movement Checks
    if (
      checkWeatherMovementPenalties(
        gameState,
        dx,
        dy,
        hasEquippedTrait,
        playSound,
        addLogMessage,
        executeEnemiesTurn
      )
    ) {
      return;
    }

    const targetX = gameState.playerX + dx;
    const targetY = gameState.playerY + dy;

    // Check overworld infinite coordinate crossover boundary limits
    if (
      handleChunkBorderCrossing(
        gameState,
        targetX,
        targetY,
        setGameState,
        playSound,
        addLogMessage,
        executeEnemiesTurn
      )
    ) {
      return;
    }

    // Standard dungeon map check bounds
    if (targetX < 0 || targetX >= LEVEL_WIDTH || targetY < 0 || targetY >= LEVEL_HEIGHT) {
      return;
    }

    const tile = gameState.map[targetY]?.[targetX];

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
          mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + 2)
        }
      }));
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
      return;
    }

    // Resource Harvesting
    if (
      tile === TileType.Tree ||
      tile === TileType.PineTree ||
      tile === TileType.BirchTree ||
      tile === TileType.CopperVein ||
      tile === TileType.IronVein
    ) {
      if (handleResourceHarvest(tile, targetX, targetY, gameState)) {
        return;
      }
    }

    // Collision Blocks
    const isUnderworldLava = !gameState.isOverworld && gameState.playerStats.depth >= 6;
    const isWaterWalkable =
      gameState.season === 'winter' || hasEquippedTrait(gameState, 'SWAMP_GLIDE') || isUnderworldLava;
    const collides =
      tile === TileType.Wall ||
      tile === TileType.Window ||
      tile === TileType.Tree ||
      tile === TileType.PineTree ||
      tile === TileType.BirchTree ||
      tile === TileType.CopperVein ||
      tile === TileType.IronVein ||
      (tile === TileType.Water && !isWaterWalkable) ||
      tile === TileType.Table ||
      tile === TileType.WatchtowerWall ||
      tile === TileType.WatchtowerSlit ||
      tile === TileType.WatchtowerBarricade;
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
              hp: finalHp
            }
          }));

          const shakeEv = new CustomEvent('spawn-game-effect', {
            detail: { x: targetX, y: targetY, text: `🔥 -${lavaDamage} HP`, type: 'dmg' }
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
          detail: { x: targetX, y: targetY, text: `🐊 Glide!`, type: 'heal' }
        });
        window.dispatchEvent(iceEv);
      } else {
        addLogMessage(`⛸️ [ICY SHORES]: You slide gracefully across the frozen water ice platform!`, 'system');
        const iceEv = new CustomEvent('spawn-game-effect', {
          detail: { x: targetX, y: targetY, text: `⛸️ Slide!`, type: 'heal' }
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
          detail: { x: targetX, y: targetY, text: '🔓 FREED!', type: 'heal' }
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

          addLogMessage(
            `🔑 [KEY USED]: You inserted the Faction Watchtower Key into the massive padlock! It turns with a heavy, satisfying metallic CLANK!`,
            'loot'
          );
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
          addLogMessage(
            `🔒 [KEY OR LOCKPICKS REQUIRED]: The Faction Tribute Chest is sealed shut! Defeat the Watchtower Commander for the key, craft Tension Lockpicks, or use a Skeleton Key!`,
            'danger'
          );
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: targetX, y: targetY, text: `🔒 Key or Lockpicks Required`, type: 'text' }
          });
          window.dispatchEvent(ev);
          return;
        }
      }

      playSound('loot');
      let nameStr = 'Locked Chest';
      if (chest.id?.includes('camp_chest')) {
        nameStr = '🔒 Locked Camp Chest';
      } else if (chest.id?.includes('ruined_chest')) {
        nameStr = '🏺 Ancient Ruined Vault Chest';
      } else if (chest.id?.includes('oasis_chest')) {
        nameStr = '🌴 Hidden Oasis Sarcophagus';
      } else if (chest.id?.startsWith('chest_')) {
        nameStr = '🕸️ Locked Dungeon Depth Chest';
      }

      addLogMessage(`🔒 You encountered a locked ${nameStr}! Pulling out Tension Lockpicks...`, 'system');
      setActiveLockpickingChestIndex(chestIndex);
      setIsLockpickingOpen(true);
      return;
    }

    // Step resolution (traps, perception, loot piles, indoor/outdoor transitions, watchtowers, level up)
    resolveStepEffects(targetX, targetY, props);
  };

  return { makeMove };
}
