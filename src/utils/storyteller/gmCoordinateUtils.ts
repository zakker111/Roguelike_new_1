/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, TileType } from '../../types';

/**
 * Calculates direction string from player coordinate to target coordinate to nudge players.
 */
export function getDirectionString(px: number, py: number, tx: number, ty: number): string {
  const dx = tx - px;
  const dy = ty - py;
  
  if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
    return 'nearby';
  }
  
  let dir = '';
  if (dy < 0) dir += 'North';
  else if (dy > 0) dir += 'South';
  
  if (dx > 0) dir += dir ? '-East' : 'East';
  else if (dx < 0) dir += dir ? '-West' : 'West';
  
  return dir;
}

/**
 * Finds a walkable spot along the outer edges/perimeter of a town map
 * so that attacking enemies appear to invade from outside the town bounds!
 */
export function findTownEdgeWalkableSpot(gameState: GameState): { x: number; y: number } | null {
  const map = gameState.map;
  if (!map || map.length === 0) return null;
  const w = gameState.levelWidth || map[0].length;
  const h = gameState.levelHeight || map.length;
  const px = gameState.playerX;
  const py = gameState.playerY;

  const candidateSpots: { x: number; y: number }[] = [];

  // Edge margin: 1 to 6 tiles from border
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const isTownEdge = x <= 6 || x >= w - 7 || y <= 6 || y >= h - 7;
      if (!isTownEdge) continue;

      const tile = map[y]?.[x];
      const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
      const isPlayer = x === px && y === py;
      const hasEnemy = gameState.enemies.some(e => e.x === x && e.y === y);
      const hasNpc = gameState.npcs && gameState.npcs.some(n => n.x === x && n.y === y);

      if (isWalkable && !isPlayer && !hasEnemy && !hasNpc) {
        candidateSpots.push({ x, y });
      }
    }
  }

  if (candidateSpots.length > 0) {
    return candidateSpots[Math.floor(Math.random() * candidateSpots.length)];
  }

  return null;
}

/**
 * Searches expanding rings around the player, preferentially starting further out
 * (e.g. radius 5 to 11, out of player vicinity) to spawn entities, falling back
 * to closer rings (radius 1 to 4) if no empty space exists there.
 * If in a town environment, hostile enemies preferentially spawn along town edges.
 */
export function findWalkableSpotNearPlayer(
  gameState: GameState,
  minRadius: number = 5,
  maxRadius: number = 11,
  forHostileEnemy: boolean = false
): { x: number; y: number } | null {
  const isTown = gameState.biome === 'town' || ((gameState as any).towns && (gameState as any).towns.length > 0) || (gameState as any).overworldLocation === 'town';
  if (isTown || forHostileEnemy) {
    const townEdgeSpot = findTownEdgeWalkableSpot(gameState);
    if (townEdgeSpot) return townEdgeSpot;
  }

  const px = gameState.playerX;
  const py = gameState.playerY;
  const map = gameState.map;
  const w = gameState.levelWidth;
  const h = gameState.levelHeight;

  // 1. First choice: Search out of vicinity (5 to 11 tiles away)
  for (let r = minRadius; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const tx = px + dx;
        const ty = py + dy;
        if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
          const tile = map[ty]?.[tx];
          const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
          
          const isPlayer = tx === px && ty === py;
          const hasEnemy = gameState.enemies.some(e => e.x === tx && e.y === ty);
          const hasNpc = gameState.npcs && gameState.npcs.some(n => n.x === tx && n.y === ty);
          
          if (isWalkable && !isPlayer && !hasEnemy && !hasNpc) {
            return { x: tx, y: ty };
          }
        }
      }
    }
  }

  // 2. Backup choice: Fallback to closer vicinity (1 to 4 tiles away) if requested range has no room
  for (let r = 1; r <= 4; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const tx = px + dx;
        const ty = py + dy;
        if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
          const tile = map[ty]?.[tx];
          const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
          
          const isPlayer = tx === px && ty === py;
          const hasEnemy = gameState.enemies.some(e => e.x === tx && e.y === ty);
          const hasNpc = gameState.npcs && gameState.npcs.some(n => n.x === tx && n.y === ty);
          
          if (isWalkable && !isPlayer && !hasEnemy && !hasNpc) {
            return { x: tx, y: ty };
          }
        }
      }
    }
  }

  return null;
}
