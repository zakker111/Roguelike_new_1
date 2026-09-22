/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback, useRef } from 'react';
import {
  TileType,
  Enemy,
  GameState,
  GameLogMessage,
  EquipmentItem,
  NPC
} from '../../types';
import { STARTING_WEAPON } from '../../utils/spellsAndEquipment';
import { SPELL_SCROLLS } from '../../utils/spellScrolls';
import { bresenhamLine } from '../../utils/ai';
import { appendBoundedLogs } from '../../utils/logBuffer';
import { formatGameTime } from '../../utils/overworld';
import { useGameLoop } from '../useGameLoop';
import { useEnemyAI } from '../useEnemyAI';
import { useCombatEngine } from '../useCombatEngine';
import { usePlayerTurnMovement } from './usePlayerTurnMovement';
import { useAutoplayAgent } from './useAutoplayAgent';
import { AppModalState } from './useAppModalState';

export interface UseAppTurnCoordinatorProps {
  isPlaying: boolean;
  isGameOver: boolean;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  isVictory: boolean;
  gameState: GameState;
  gameStateRef?: React.MutableRefObject<GameState>;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound: (soundName: string) => void;
  addLogMessage: (text: string, type?: GameLogMessage['type']) => void;
  hasEquippedTrait: (gs: GameState, traitKey: string) => boolean;
  setShakeTrigger?: React.Dispatch<React.SetStateAction<number>>;
  setActiveTab?: (tab: any) => void;

  // AI & Action Callbacks
  executeEnemiesTurn?: (px: number, py: number) => void;
  handleOverworldStairsTransition: (targetX: number, targetY: number, direction: 'up' | 'down') => void;
  handleResourceHarvest: (tile: TileType, targetX: number, targetY: number, gameState: GameState) => boolean;
  handleOpenDoor: (targetX: number, targetY: number, gameState: GameState) => void;
  descendToDungeonFirstFloor: () => void;
  advanceToNextDepth: () => void;
  interactWithNpc: (npc: NPC) => void;
  performPlayerAttack: (enemy: Enemy, index: number, pathPoints?: any[]) => boolean;
  handleOpenChest: (chestIndex: number, isMimic: boolean) => void;
  interactWithFollower: (follower: Enemy) => void;
  executeSpellScrollCast?: (tx: number, ty: number, gs: GameState, scroll: EquipmentItem, mp: number) => boolean;

  // Modal & Target State
  modalState: AppModalState;
}

export interface UseAppTurnCoordinatorReturn {
  makeMove: (dx: number, dy: number) => void;
  handleWaitTurn: () => void;
  handleBraceDefense: () => void;
  handleTileClick: (tx: number, ty: number) => void;
  handleConfirmUnlawfulAttack: () => void;
  executeEnemiesTurn: (px: number, py: number) => void;
}

/**
 * useAppTurnCoordinator
 *
 * Coordinates turn step sequencing, player movement dispatching, game loop difficulty ticks,
 * enemy AI turns, tactical brace defense, automated autoplay steps, and tile targeting.
 */
export function useAppTurnCoordinator(props: UseAppTurnCoordinatorProps): UseAppTurnCoordinatorReturn {
  const {
    isPlaying,
    isGameOver,
    setIsGameOver,
    isVictory,
    gameState,
    gameStateRef: externalGameStateRef,
    setGameState,
    playSound,
    addLogMessage,
    hasEquippedTrait,
    setShakeTrigger,
    setActiveTab,
    executeEnemiesTurn: externalExecuteEnemiesTurn,
    handleOverworldStairsTransition,
    handleResourceHarvest,
    handleOpenDoor,
    descendToDungeonFirstFloor,
    advanceToNextDepth,
    interactWithNpc,
    performPlayerAttack,
    handleOpenChest,
    interactWithFollower,
    executeSpellScrollCast,
    modalState,
  } = props;

  // Fallback internal ref if none provided
  const internalGameStateRef = useRef<GameState>(gameState);
  internalGameStateRef.current = gameState;
  const activeGameStateRef = externalGameStateRef || internalGameStateRef;

  // Cleanly handle player death to prevent React side-effect state update crashes
  useEffect(() => {
    if (isPlaying && !isGameOver && !isVictory && gameState.playerStats && gameState.playerStats.hp <= 0) {
      playSound('defeat');
      setIsGameOver(true);
    }
  }, [gameState.playerStats?.hp, isPlaying, isGameOver, isVictory, playSound, setIsGameOver]);

  // Real-time difficulty ticking game loop hook
  useGameLoop({
    isPlaying,
    isGameOver,
    isVictory,
    setGameState,
  });

  // Enemy AI hook (fallback if external executeEnemiesTurn is not provided)
  const enemyAi = useEnemyAI({
    gameStateRef: activeGameStateRef,
    setGameState,
    addLogMessage,
    playSound,
    hasEquippedTrait,
  });
  const resolvedExecuteEnemiesTurn = externalExecuteEnemiesTurn || enemyAi.executeEnemiesTurn;

  // Turn movement hook
  const { makeMove } = usePlayerTurnMovement({
    isPlaying,
    isGameOver,
    isVictory,
    gameState,
    setGameState,
    playSound,
    addLogMessage,
    executeEnemiesTurn: resolvedExecuteEnemiesTurn,
    setIsGameOver,
    setShakeTrigger,
    setActiveTab,
    setActiveLockpickingChestIndex: modalState.setActiveLockpickingChestIndex,
    setIsLockpickingOpen: modalState.setIsLockpickingOpen,
    setUnlawfulGuardTarget: modalState.setUnlawfulGuardTarget,
    handleOverworldStairsTransition,
    handleResourceHarvest,
    handleOpenDoor,
    descendToDungeonFirstFloor,
    advanceToNextDepth,
    interactWithNpc,
    performPlayerAttack,
    handleOpenChest,
    hasEquippedTrait,
  });

  // Pass / Wait a single turn
  const handleWaitTurn = useCallback(() => {
    makeMove(0, 0);
  }, [makeMove]);

  // Combat defensive bracing (consumes 1 pass turn)
  const { handleBraceDefense } = useCombatEngine({
    gameStateRef: activeGameStateRef,
    setGameState,
    addLogMessage,
    playSound,
    makeMove,
  });

  // Tile click interaction handler (adjacent step, ranged attack, targeted scroll cast)
  const handleTileClick = useCallback((tx: number, ty: number) => {
    const dx = tx - gameState.playerX;
    const dy = ty - gameState.playerY;

    // 1. Targeted Spell Scroll Casting
    if (modalState.activeTargetedScroll && executeSpellScrollCast) {
      const activeScroll = modalState.activeTargetedScroll;
      const template = SPELL_SCROLLS.find((t) => activeScroll.id.includes(t.id));
      const isMasterwork = activeScroll.isMasterwork || activeScroll.name?.includes('Masterwork');
      const requiredMp = isMasterwork ? 0 : (template ? template.mpCost : 20);

      if (gameState.playerStats.mp < requiredMp) {
        addLogMessage(`❌ Insufficient Mana! You need at least ${requiredMp} MP to channel the scroll.`, 'system');
        modalState.setActiveTargetedScroll(null);
        return;
      }

      const success = executeSpellScrollCast(tx, ty, gameState, activeScroll, requiredMp);
      if (success) {
        resolvedExecuteEnemiesTurn(gameState.playerX, gameState.playerY);
      }
      return;
    }

    // 2. Adjacent step / standard move / melee strike
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
      makeMove(dx, dy);
      return;
    }

    // 3. Ranged active assault
    const weapon = gameState.currentWeapon || STARTING_WEAPON;
    const targetEnemyIdx = gameState.enemies.findIndex((e) => e.x === tx && e.y === ty);

    if (targetEnemyIdx !== -1) {
      const enemy = gameState.enemies[targetEnemyIdx];
      const distance = Math.floor(Math.sqrt(dx ** 2 + dy ** 2));

      if (distance <= weapon.range) {
        // Direct Line of Sight check
        const bresenline = bresenhamLine(gameState.playerX, gameState.playerY, tx, ty);
        let obscured = false;

        for (let i = 1; i < bresenline.length - 1; i++) {
          const pt = bresenline[i];
          const tile = gameState.map[pt.y][pt.x];
          if (tile === TileType.Wall || tile === TileType.Door) {
            obscured = true;
            break;
          }
        }

        if (!obscured) {
          // Follower or freed companion check
          if (enemy.isFollower || (enemy.isCaptive && enemy.isFreed)) {
            interactWithFollower(enemy);
            return;
          }

          // Non-hostile town guard prompt
          if (enemy.isTownGuard && !gameState.areGuardsHostile) {
            modalState.setUnlawfulGuardTarget({ enemy, index: targetEnemyIdx, pathPoints: bresenline });
            return;
          }

          // Execute ranged attack
          const acted = performPlayerAttack(enemy, targetEnemyIdx, bresenline);
          if (acted) {
            resolvedExecuteEnemiesTurn(gameState.playerX, gameState.playerY);
          }
        } else {
          addLogMessage(`❌ Direct vision trajectory is obscured by wall barriers.`, 'system');
        }
      } else {
        addLogMessage(`❌ Enemy resides outside this weapon's active assault reach (${weapon.range} tiles).`, 'system');
      }
    } else {
      addLogMessage(`❌ Click Adjacent cells to walk. Distance is too great.`, 'system');
    }
  }, [
    gameState,
    modalState,
    executeSpellScrollCast,
    addLogMessage,
    resolvedExecuteEnemiesTurn,
    makeMove,
    interactWithFollower,
    performPlayerAttack
  ]);

  // Unlawful assault confirmation on non-hostile town guard
  const handleConfirmUnlawfulAttack = useCallback(() => {
    if (!modalState.unlawfulGuardTarget) return;
    const { enemy, index, pathPoints } = modalState.unlawfulGuardTarget;
    modalState.setUnlawfulGuardTarget(null);

    setGameState((prev) => ({
      ...prev,
      areGuardsHostile: true,
      logs: appendBoundedLogs(prev.logs, {
        id: `unlawful_${Date.now()}`,
        text: `⚖️ [CRIMINAL OFFENSE]: You have assaulted a peacekeeper of the crown! Town guards are now hostile!`,
        type: 'danger' as const,
        timestamp: formatGameTime(prev.gameTime).timeStr,
      }, 200),
    }));

    const acted = performPlayerAttack(enemy, index, pathPoints);
    if (acted) {
      resolvedExecuteEnemiesTurn(gameState.playerX, gameState.playerY);
    }
  }, [
    modalState,
    setGameState,
    performPlayerAttack,
    resolvedExecuteEnemiesTurn,
    gameState.playerX,
    gameState.playerY
  ]);

  // Autonomous playtesting agent hook
  useAutoplayAgent({
    isAutoplayActive: modalState.isAutoplayActive,
    isPlaying,
    isGameOver,
    isVictory,
    gameState,
    setGameState,
    makeMove,
  });

  return {
    makeMove,
    handleWaitTurn,
    handleBraceDefense,
    handleTileClick,
    handleConfirmUnlawfulAttack,
    executeEnemiesTurn: resolvedExecuteEnemiesTurn,
  };
}
