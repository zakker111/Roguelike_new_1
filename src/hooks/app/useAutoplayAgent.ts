/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { GameState, TileType } from '../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../utils/gameUtils';

interface UseAutoplayAgentProps {
  isAutoplayActive: boolean;
  isPlaying: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  makeMove: (dx: number, dy: number) => void;
}

export function useAutoplayAgent({
  isAutoplayActive,
  isPlaying,
  isGameOver,
  isVictory,
  gameState,
  setGameState,
  makeMove,
}: UseAutoplayAgentProps) {
  useEffect(() => {
    if (!isAutoplayActive || !isPlaying || isGameOver || isVictory) return;

    const interval = setInterval(() => {
      const pX = gameState.playerX;
      const pY = gameState.playerY;
      const map = gameState.map;
      const enemies = gameState.enemies || [];
      const isWaterWalkable = gameState.playerStats?.activeEffects?.some(e => e.name.toLowerCase().includes('water')) || false;

      // 1. Check health/mana: heal automatically if needed and possible
      if (gameState.playerStats.hp < (gameState.playerStats.maxHp * 0.3) && gameState.playerStats.mp >= 15) {
        setGameState(prev => {
          const stats = { ...prev.playerStats };
          stats.hp = Math.min(stats.maxHp, stats.hp + 25);
          stats.mp -= 15;
          return {
            ...prev,
            playerStats: stats,
            logs: [{
              id: `auto_heal_${Date.now()}`,
              text: "✨ AUTONOMOUS: Cast minor Healing spell to restore +25 HP!",
              type: 'info',
              timestamp: 'AUTO'
            }, ...prev.logs].slice(0, 200)
          };
        });
        makeMove(0, 0); // Pass turn
        return;
      }

      // 2. Look for nearby enemies (within radius of 8 tiles)
      let targetEnemy: any = null;
      let minEnemyDist = Infinity;
      for (const enemy of enemies) {
        const dist = Math.max(Math.abs(enemy.x - pX), Math.abs(enemy.y - pY));
        if (dist < minEnemyDist && dist <= 8) {
          minEnemyDist = dist;
          targetEnemy = enemy;
        }
      }

      if (targetEnemy) {
        // Attack or step towards the enemy
        const dx = Math.sign(targetEnemy.x - pX);
        const dy = Math.sign(targetEnemy.y - pY);
        makeMove(dx, dy);
        return;
      }

      // 3. Look for nearby chests or loot piles (within radius of 8 tiles)
      const chests = gameState.chests || [];
      const lootPiles = gameState.lootPiles || [];
      let targetFeature: { x: number; y: number } | null = null;
      let minFeatureDist = Infinity;

      for (const chest of chests) {
        if (!chest.isOpened) {
          const dist = Math.max(Math.abs(chest.x - pX), Math.abs(chest.y - pY));
          if (dist < minFeatureDist && dist <= 8) {
            minFeatureDist = dist;
            targetFeature = { x: chest.x, y: chest.y };
          }
        }
      }

      for (const loot of lootPiles) {
        const dist = Math.max(Math.abs(loot.x - pX), Math.abs(loot.y - pY));
        if (dist < minFeatureDist && dist <= 8) {
          minFeatureDist = dist;
          targetFeature = { x: loot.x, y: loot.y };
        }
      }

      if (targetFeature) {
        const dx = Math.sign(targetFeature.x - pX);
        const dy = Math.sign(targetFeature.y - pY);
        makeMove(dx, dy);
        return;
      }

      // 4. Otherwise: wander randomly on walkable neighbor tiles
      const dirs = [
        [0, -1], [0, 1], [-1, 0], [1, 0],
        [-1, -1], [1, -1], [-1, 1], [1, 1]
      ];

      const walkableDirs = dirs.filter(([dx, dy]) => {
        const tx = pX + dx;
        const ty = pY + dy;
        if (tx < 0 || tx >= LEVEL_WIDTH || ty < 0 || ty >= LEVEL_HEIGHT) return false;
        const tile = map[ty]?.[tx];
        if (!tile) return false;

        const collides = 
          tile === TileType.Wall || 
          tile === TileType.Window || 
          tile === TileType.Tree || 
          tile === TileType.PineTree || 
          tile === TileType.BirchTree || 
          tile === TileType.CopperVein || 
          tile === TileType.IronVein || 
          (tile === TileType.Water && !isWaterWalkable) || 
          tile === TileType.Table;

        return !collides;
      });

      if (walkableDirs.length > 0) {
        const [dx, dy] = walkableDirs[Math.floor(Math.random() * walkableDirs.length)];
        makeMove(dx, dy);
      } else {
        // Pass turn if fully trapped
        makeMove(0, 0);
      }
    }, 350);

    return () => clearInterval(interval);
  }, [isAutoplayActive, isPlaying, isGameOver, isVictory, gameState.playerX, gameState.playerY, gameState.enemies, gameState.chests, gameState.lootPiles, gameState.map, gameState.playerStats]);
}
