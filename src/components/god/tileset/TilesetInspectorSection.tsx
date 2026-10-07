/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { assetPreloader } from '../../../canvas/AssetPreloader';
import { TilesetSourceType, TILESET_SOURCES } from '../../../canvas/types';
import { MockupPaletteTheme } from '../../../canvas/MockupAtlasGenerator';

interface TilesetInspectorSectionProps {
  inspectorSource: TilesetSourceType;
  selectedAtlasKey: string;
  atlasZoom: number;
  showGridOverlay: boolean;
  hoveredTileInfo: { col: number; row: number; px: number; py: number } | null;
  spriteSize: number;
  refreshTrigger: number;
  currentTheme: MockupPaletteTheme;
  onInspectorSourceChange: (source: TilesetSourceType) => void;
  onSelectAtlasKey: (key: string) => void;
  onSetShowGridOverlay: (show: boolean) => void;
  onSetAtlasZoom: React.Dispatch<React.SetStateAction<number>>;
  onHoverTileInfo: (info: { col: number; row: number; px: number; py: number } | null) => void;
  onDownloadAtlasPng: () => void;
}

export function TilesetInspectorSection({
  inspectorSource,
  selectedAtlasKey,
  atlasZoom,
  showGridOverlay,
  hoveredTileInfo,
  spriteSize,
  refreshTrigger,
  currentTheme,
  onInspectorSourceChange,
  onSelectAtlasKey,
  onSetShowGridOverlay,
  onSetAtlasZoom,
  onHoverTileInfo,
  onDownloadAtlasPng
}: TilesetInspectorSectionProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Atlas in Inspector Canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const atlasSource = assetPreloader.getAtlasSource(selectedAtlasKey, inspectorSource);
    if (!atlasSource) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Atlas '${selectedAtlasKey}' not loaded for ${TILESET_SOURCES[inspectorSource].name}`,
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    const imgWidth = (atlasSource as HTMLImageElement).naturalWidth || (atlasSource as HTMLCanvasElement).width || 512;
    const imgHeight = (atlasSource as HTMLImageElement).naturalHeight || (atlasSource as HTMLCanvasElement).height || 512;

    canvas.width = imgWidth * atlasZoom;
    canvas.height = imgHeight * atlasZoom;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlasSource, 0, 0, canvas.width, canvas.height);

    // Draw grid overlay
    if (showGridOverlay) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      const cellPx = spriteSize * atlasZoom;

      for (let x = 0; x <= canvas.width; x += cellPx) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y <= canvas.height; y += cellPx) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
      }
    }

    // Draw hover box
    if (hoveredTileInfo) {
      const cellPx = spriteSize * atlasZoom;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hoveredTileInfo.col * cellPx,
        hoveredTileInfo.row * cellPx,
        cellPx,
        cellPx
      );
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.fillRect(
        hoveredTileInfo.col * cellPx,
        hoveredTileInfo.row * cellPx,
        cellPx,
        cellPx
      );
    }
  }, [selectedAtlasKey, atlasZoom, showGridOverlay, hoveredTileInfo, refreshTrigger, currentTheme, spriteSize, inspectorSource]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        {/* Source & Atlas Key Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Inspect Source */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase px-1.5">Source:</span>
            <button
              onClick={() => onInspectorSourceChange('classic_png')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                inspectorSource === 'classic_png'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Instinct (PNG)
            </button>
            <button
              onClick={() => onInspectorSourceChange('classic_code')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                inspectorSource === 'classic_code'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Instinct (Code)
            </button>
          </div>

          {/* Atlas Key */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Atlas:</span>
            {['main_tileset', 'entity_tileset', 'boss_tileset', 'items_tileset'].map((k) => (
              <button
                key={k}
                onClick={() => {
                  onSelectAtlasKey(k);
                  onHoverTileInfo(null);
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedAtlasKey === k
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showGridOverlay}
              onChange={(e) => onSetShowGridOverlay(e.target.checked)}
              className="accent-amber-400"
            />
            <span>Grid Overlay</span>
          </label>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetAtlasZoom((z) => Math.max(0.5, z - 0.25))}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded cursor-pointer"
            >
              -
            </button>
            <span className="text-xs font-mono px-2 text-amber-300">{atlasZoom.toFixed(2)}x</span>
            <button
              onClick={() => onSetAtlasZoom((z) => Math.min(4.0, z + 0.25))}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            onClick={onDownloadAtlasPng}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative border border-slate-800 rounded-xl bg-slate-950 overflow-auto max-h-[480px] p-4 flex items-center justify-center">
        <canvas
          ref={previewCanvasRef}
          onMouseMove={(e) => {
            const canvas = previewCanvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const cellPx = spriteSize * atlasZoom;
            const col = Math.floor(mouseX / cellPx);
            const row = Math.floor(mouseY / cellPx);
            onHoverTileInfo({ col, row, px: mouseX, py: mouseY });
          }}
          onMouseLeave={() => onHoverTileInfo(null)}
          className="border border-slate-700/50 shadow-2xl rounded cursor-crosshair"
        />
      </div>

      {/* Inspection Info Bar */}
      {hoveredTileInfo && (
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-300">
          <span>
            Tile Coordinate: <b className="text-amber-400">Col {hoveredTileInfo.col}</b>, <b className="text-amber-400">Row {hoveredTileInfo.row}</b>
          </span>
          <span>
            Atlas Pixel: <b className="text-cyan-400">X: {hoveredTileInfo.col * spriteSize}px</b>, <b className="text-cyan-400">Y: {hoveredTileInfo.row * spriteSize}px</b> (Size: {spriteSize}x{spriteSize}px)
          </span>
        </div>
      )}
    </div>
  );
}
