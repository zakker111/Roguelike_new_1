/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TileType, GameState } from '../types';

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
  return (
    <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col gap-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
        <span>🗺️ CHUNK MINIMAP</span>
        <span className="text-[9px] font-mono text-slate-550">Chunk {currentChunkX},{currentChunkY}</span>
      </div>
      <div 
        className="bg-slate-950 p-2 rounded border border-slate-850 mx-auto select-none"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(21, 5px)',
          gridTemplateRows: 'repeat(21, 5px)',
          gap: '1px',
          width: 'max-content'
        }}
      >
        {Array.from({ length: 21 }).flatMap((_, rIdx) => {
          const gY = playerY - 10 + rIdx;
          return Array.from({ length: 21 }).map((_, cIdx) => {
            const gX = playerX - 10 + cIdx;
            const isPlayer = gX === playerX && gY === playerY;
            const key = `${gX},${gY},${currentChunkX},${currentChunkY}`;
            const isVisited = visitedTiles && visitedTiles[key];
            const isDiscovered = discovered && discovered[gY] && discovered[gY][gX];

            const w = map[0]?.length || 64;
            const h = map.length || 40;

            let cellColor = 'bg-slate-950';
            let cellTitle = 'Unexplored';

            if (gX < 0 || gX >= w || gY < 0 || gY >= h) {
              cellColor = 'bg-slate-900/10 opacity-20';
              cellTitle = 'Boundary';
            } else if (isPlayer) {
              cellColor = 'bg-amber-400 animate-pulse';
              cellTitle = 'You';
            } else if (isDiscovered || isVisited) {
              // Color based on tile
              const t = map[gY] ? map[gY][gX] : null;
              if (t === TileType.Wall) {
                cellColor = 'bg-slate-700';
                cellTitle = 'Wall';
              } else if (t === TileType.Water) {
                cellColor = 'bg-blue-600';
                cellTitle = 'Water';
              } else if (t === TileType.DungeonEntrance) {
                cellColor = 'bg-purple-600';
                cellTitle = 'Dungeon Entrance';
              } else if (t === TileType.Path) {
                cellColor = 'bg-amber-800';
                cellTitle = 'Road';
              } else if (t === TileType.TownGate) {
                cellColor = 'bg-emerald-500';
                cellTitle = 'Village Gate';
              } else if (t === TileType.Tree) {
                cellColor = 'bg-emerald-800';
                cellTitle = 'Tree';
              } else if (t === TileType.Grass) {
                cellColor = 'bg-emerald-950';
                cellTitle = 'Grass';
              } else if (t === TileType.Campfire) {
                cellColor = 'bg-red-500';
                cellTitle = 'Campfire';
              } else if (t === TileType.Anvil) {
                cellColor = 'bg-slate-400';
                cellTitle = 'Blacksmith Anvil';
              } else if (t === TileType.Door) {
                cellColor = 'bg-amber-900';
                cellTitle = 'Door';
              } else if (t === TileType.StairsDown) {
                cellColor = 'bg-violet-750';
                cellTitle = 'Stairs Down';
              } else if (t === TileType.StairsUp) {
                cellColor = 'bg-violet-400';
                cellTitle = 'Stairs Up';
              } else {
                cellColor = 'bg-slate-800';
                cellTitle = 'Floor';
              }
            }

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`w-[5px] h-[5px] rounded-[1px] ${cellColor}`}
                title={cellTitle}
              />
            );
          });
        })}
      </div>
    </div>
  );
}

export const ChunkMinimap = React.memo(ChunkMinimapComponent);
