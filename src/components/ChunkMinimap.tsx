/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { TileType } from '../types';
import { PoiType } from './PoiInteractionOverlay';

interface ChunkMinimapProps {
  playerX: number;
  playerY: number;
  currentChunkX: number;
  currentChunkY: number;
  visitedTiles: Record<string, boolean>;
  discovered: boolean[][];
  map: TileType[][];
  pois?: PoiType[];
  attunedWaystones?: string[];
  onOpenWorldMap?: () => void;
}

function ChunkMinimapComponent({
  playerX,
  playerY,
  currentChunkX,
  currentChunkY,
  visitedTiles,
  discovered,
  map,
  pois = [],
  attunedWaystones = [],
  onOpenWorldMap
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

        // Check if there is a POI at (gX, gY)
        const matchedPoi = pois.find(p => p.x === gX && p.y === gY);

        let hexColor = '#020617'; // slate-950 default unexplored

        if (gX < 0 || gX >= w || gY < 0 || gY >= h) {
          hexColor = '#0f172a'; // boundary slate-900
        } else if (isPlayer) {
          hexColor = '#fbbf24'; // player gold
        } else if (matchedPoi && (isDiscovered || isVisited)) {
          // Distinct glowing landmark colors
          if (matchedPoi.isAttunedWaystone || attunedWaystones.includes(matchedPoi.id)) {
            hexColor = '#06b6d4'; // Cyan for attuned waystones
          } else {
            switch (matchedPoi.type) {
              case 'shrine': hexColor = '#10b981'; break; // emerald green
              case 'hearth': hexColor = '#f97316'; break; // amber orange
              case 'monolith': hexColor = '#a855f7'; break; // purple
              case 'sunken_keep': hexColor = '#38bdf8'; break; // sky blue
              case 'fossil': hexColor = '#e2e8f0'; break; // white
              default: hexColor = '#ec4899'; break;
            }
          }
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
          } else if (t === TileType.Tree || t === TileType.PineTree || t === TileType.BirchTree) {
            hexColor = '#065f46'; // emerald-800
          } else if (t === TileType.TreeStump) {
            hexColor = '#78350f'; // wood amber-900
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

        // Render extra glowing border if POI
        if (matchedPoi && (isDiscovered || isVisited) && !isPlayer) {
          ctx.strokeStyle = matchedPoi.isAttunedWaystone || attunedWaystones.includes(matchedPoi.id) ? '#38bdf8' : '#e0e7ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(cIdx * step - 0.5, rIdx * step - 0.5, cellSize + 1, cellSize + 1);
        }
      }
    }
  }, [playerX, playerY, currentChunkX, currentChunkY, visitedTiles, discovered, map, pois, attunedWaystones]);

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col gap-2 transition-all">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
        <span className="flex items-center gap-1">
          <span>🗺️ CHUNK MINIMAP</span>
        </span>
        <span className="text-[9px] font-mono text-slate-500">[{currentChunkX}, {currentChunkY}]</span>
      </div>
      <div 
        onClick={onOpenWorldMap}
        className={`bg-slate-950 p-2 rounded-lg border border-slate-850 mx-auto select-none flex flex-col gap-1.5 items-center transition-all ${
          onOpenWorldMap ? 'cursor-pointer hover:border-amber-500/50 hover:bg-slate-950/80 group' : ''
        }`}
        title={onOpenWorldMap ? "Click to open Realm Cartography World Map [M]" : `Minimap centered on (${playerX}, ${playerY})`}
      >
        <canvas
          ref={canvasRef}
          width={126}
          height={126}
          className="rounded-[2px] block group-hover:opacity-95 transition-opacity"
        />
        {/* Map Legend */}
        <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-900 w-full">
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>Grove</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>Forge</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>Rune</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>Waystone</span>
        </div>

        {onOpenWorldMap && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenWorldMap();
            }}
            className="w-full mt-0.5 py-1 px-2 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 rounded text-[9px] font-bold text-amber-300 flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span>🗺️ World Map</span>
            <span className="text-[8px] bg-amber-500/20 px-1 rounded text-amber-200 font-mono">M</span>
          </button>
        )}
      </div>
    </div>
  );
}

export const ChunkMinimap = React.memo(ChunkMinimapComponent);
