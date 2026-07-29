/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { TileType } from '../types';

interface ChunkMinimapProps {
  playerX: number;
  playerY: number;
  currentChunkX: number;
  currentChunkY: number;
  visitedTiles: Record<string, boolean>;
  discovered: boolean[][];
  map: TileType[][];
}

function ChunkMinimapComponent({
  playerX,
  playerY,
  currentChunkX,
  currentChunkY,
  visitedTiles,
  discovered,
  map
}: ChunkMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = map[0]?.length || 64;
    const h = map.length || 40;

    // Clear background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, 126, 126);

    const cellSize = 5;
    const gap = 1;
    const step = cellSize + gap;

    for (let rIdx = 0; rIdx < 21; rIdx++) {
      const gY = playerY - 10 + rIdx;
      for (let cIdx = 0; cIdx < 21; cIdx++) {
        const gX = playerX - 10 + cIdx;
        const isPlayer = gX === playerX && gY === playerY;
        const key = `${gX},${gY},${currentChunkX},${currentChunkY}`;
        const isVisited = visitedTiles && visitedTiles[key];
        const isDiscovered = discovered && discovered[gY] && discovered[gY][gX];

        let hexColor = '#020617'; // slate-950 default unexplored

        if (gX < 0 || gX >= w || gY < 0 || gY >= h) {
          hexColor = '#0f172a'; // boundary slate-900
        } else if (isPlayer) {
          hexColor = '#fbbf24'; // player gold
        } else if (isDiscovered || isVisited) {
          const t = map[gY] ? map[gY][gX] : null;
          if (t === TileType.Wall) {
            hexColor = '#334155'; // slate-700
          } else if (t === TileType.Water) {
            hexColor = '#2563eb'; // blue-600
          } else if (t === TileType.DungeonEntrance) {
            hexColor = '#9333ea'; // purple-600
          } else if (t === TileType.Path) {
            hexColor = '#92400e'; // amber-800
          } else if (t === TileType.TownGate) {
            hexColor = '#10b981'; // emerald-500
          } else if (t === TileType.Tree) {
            hexColor = '#065f46'; // emerald-800
          } else if (t === TileType.Grass) {
            hexColor = '#022c22'; // emerald-950
          } else if (t === TileType.Campfire) {
            hexColor = '#ef4444'; // red-500
          } else if (t === TileType.Anvil) {
            hexColor = '#94a3b8'; // slate-400
          } else if (t === TileType.Door) {
            hexColor = '#78350f'; // amber-900
          } else if (t === TileType.StairsDown) {
            hexColor = '#6d28d9'; // violet-700
          } else if (t === TileType.StairsUp) {
            hexColor = '#a78bfa'; // violet-400
          } else {
            hexColor = '#1e293b'; // floor slate-800
          }
        }

        ctx.fillStyle = hexColor;
        ctx.fillRect(cIdx * step, rIdx * step, cellSize, cellSize);
      }
    }
  }, [playerX, playerY, currentChunkX, currentChunkY, visitedTiles, discovered, map]);

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col gap-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
        <span>🗺️ CHUNK MINIMAP</span>
        <span className="text-[9px] font-mono text-slate-550">Chunk {currentChunkX},{currentChunkY}</span>
      </div>
      <div className="bg-slate-950 p-2 rounded border border-slate-850 mx-auto select-none">
        <canvas
          ref={canvasRef}
          width={126}
          height={126}
          className="rounded-[2px] block"
          title={`Minimap centered on (${playerX}, ${playerY})`}
        />
      </div>
    </div>
  );
}

export const ChunkMinimap = React.memo(ChunkMinimapComponent);
