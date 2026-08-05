import React, { useState } from 'react';
import { Home, RotateCw, Hammer, Check, Play, Download, Copy, Code, Upload } from 'lucide-react';
import { GameState } from '../../types';
import { PALETTE_TILES } from '../GodPanelOverlay';
import { getAvailableStructures, StructurePreset } from '../../utils/structurePlacer';

export interface GodHouseDesignerProps {
  gameState: GameState;
  designerWidth: number;
  designerHeight: number;
  designerId: string;
  setDesignerId: (id: string) => void;
  designerName: string;
  setDesignerName: (name: string) => void;
  designerEmoji: string;
  setDesignerEmoji: (emoji: string) => void;
  designerDescription: string;
  setDesignerDescription: (desc: string) => void;
  designerPaintChar: string;
  setDesignerPaintChar: (char: string) => void;
  designerGrid: string[][];
  customX: number;
  setCustomX: (x: number) => void;
  customY: number;
  setCustomY: (y: number) => void;
  clearDesignerGrid: () => void;
  surroundDesignerWithWalls: () => void;
  handleLoadPresetToDesigner: (preset: StructurePreset) => void;
  adjustDesignerGridDimensions: (w: number, h: number) => void;
  paintCell: (x: number, y: number) => void;
  handleSaveCustomDesignerStructure: () => void;
  handlePlaceDesignerStructure: () => void;
  handleDownloadBlueprintJson: () => void;
  handleCopyBlueprintJson: () => void;
  handleCopyAsTsConstant: () => void;
  handleImportFile: (file: File) => void;
  triggerSuccessLog: (msg: string) => void;
}

export function GodHouseDesigner({
  gameState,
  designerWidth,
  designerHeight,
  designerId,
  setDesignerId,
  designerName,
  setDesignerName,
  designerEmoji,
  setDesignerEmoji,
  designerDescription,
  setDesignerDescription,
  designerPaintChar,
  setDesignerPaintChar,
  designerGrid,
  customX,
  setCustomX,
  customY,
  setCustomY,
  clearDesignerGrid,
  surroundDesignerWithWalls,
  handleLoadPresetToDesigner,
  adjustDesignerGridDimensions,
  paintCell,
  handleSaveCustomDesignerStructure,
  handlePlaceDesignerStructure,
  handleDownloadBlueprintJson,
  handleCopyBlueprintJson,
  handleCopyAsTsConstant,
  handleImportFile,
  triggerSuccessLog,
}: GodHouseDesignerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPaintMouseDown, setIsPaintMouseDown] = useState(false);

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="border-b border-slate-800 pb-1.5 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-slate-350 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Home className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Sovereign Visual Architect & House Designer</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Draw and carve custom buildings, houses, and dungeons cell-by-cell in real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearDesignerGrid}
            className="py-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded text-slate-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
          >
            <RotateCw className="w-3 h-3 text-red-500" />
            <span>Clear Floor</span>
          </button>
          <button
            onClick={surroundDesignerWithWalls}
            className="py-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded text-slate-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
          >
            <Hammer className="w-3 h-3 text-emerald-500" />
            <span>Boundary Wall shell</span>
          </button>
        </div>
      </div>

      {/* Template Quick Loader */}
      <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-2">
        <span className="font-bold text-[9px] text-slate-400 block uppercase tracking-wider">🧬 Quick-Load Template Blueprint:</span>
        <p className="text-[9px] text-slate-500 leading-normal">
          Select an existing preset structure template to edit, paint or customize further.
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto pr-1">
          {getAvailableStructures().map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPresetToDesigner(preset)}
              className="py-1 px-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded text-[10px] text-slate-300 cursor-pointer transition-all flex items-center gap-1"
            >
              <span>{preset.emoji}</span>
              <span>{preset.name}</span>
              <span className="text-[8px] text-slate-500">({preset.width}x{preset.height})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Structure metadata details */}
      <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-lg space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Structure ID Ref</label>
            <input
              type="text"
              value={designerId}
              onChange={(e) => setDesignerId(e.target.value.replace(/\s+/g, '_').toLowerCase())}
              placeholder="e.g. cozy_cabin"
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Display Name</label>
            <input
              type="text"
              value={designerName}
              onChange={(e) => setDesignerName(e.target.value)}
              placeholder="e.g. Cozy Cabin 🏡"
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Emoji Icon</label>
            <input
              type="text"
              value={designerEmoji}
              onChange={(e) => setDesignerEmoji(e.target.value)}
              placeholder="e.g. 🏡"
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Brief description</label>
            <input
              type="text"
              value={designerDescription}
              onChange={(e) => setDesignerDescription(e.target.value)}
              placeholder="A comfortable cottage"
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900/40">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Width Dimensions: {designerWidth}</label>
              <span className="text-[8px] text-slate-500">Min 3 • Max 12</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              value={designerWidth}
              onChange={(e) => adjustDesignerGridDimensions(parseInt(e.target.value) || 6, designerHeight)}
              className="w-full accent-emerald-500 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Height Dimensions: {designerHeight}</label>
              <span className="text-[8px] text-slate-500">Min 3 • Max 12</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              value={designerHeight}
              onChange={(e) => adjustDesignerGridDimensions(designerWidth, parseInt(e.target.value) || 6)}
              className="w-full accent-emerald-500 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Painting Studio Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Interactive Paint Palette */}
        <div className="md:col-span-5 p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-2">
          <span className="font-bold text-[9px] text-slate-400 block uppercase tracking-wider">🎨 Active Paintbrush Palette:</span>
          <div className="grid grid-cols-1 gap-1.5 max-h-[290px] overflow-y-auto pr-1">
            {PALETTE_TILES.map((t) => {
              const isActive = designerPaintChar === t.char;
              return (
                <button
                  key={t.char}
                  onClick={() => setDesignerPaintChar(t.char)}
                  className={`w-full p-2 rounded text-left border transition-all cursor-pointer flex items-center justify-between gap-2 text-[10px] ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-950/20 text-slate-100 shadow-sm'
                      : 'border-slate-900 bg-slate-950/20 hover:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center font-bold text-slate-200 border border-slate-800 text-xs"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.char}
                    </span>
                    <div>
                      <span className="font-bold text-slate-250 block">{t.name}</span>
                      <span className="text-[8.5px] text-slate-500 font-sans block leading-none mt-0.5">{t.desc}</span>
                    </div>
                  </div>
                  {isActive && <span className="text-[8px] uppercase font-bold text-emerald-400 bg-emerald-950 border border-emerald-900/60 px-1 py-0.5 rounded">Active</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Painting Grid Canvas */}
        <div className="md:col-span-7 p-4 bg-slate-950/40 border border-slate-800 rounded-lg flex flex-col justify-between items-center min-h-[340px]">
          <div className="text-center mb-3">
            <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block">🖌️ Grid Painting Canvas</span>
            <span className="text-[8.5px] text-slate-500 font-sans mt-0.5 block">Click/tap on cells to apply the selected brush style.</span>
          </div>

          {/* Grid Container */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850/60 shadow-inner flex items-center justify-center">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${designerWidth}, minmax(0, 1fr))`
              }}
              onMouseLeave={() => setIsPaintMouseDown(false)}
              onMouseUp={() => setIsPaintMouseDown(false)}
            >
              {designerGrid.map((row, y) => {
                return row.map((char, x) => {
                  const matchedTile = PALETTE_TILES.find(t => t.char === char);
                  const tileColor = matchedTile ? matchedTile.color : '#1e293b';
                  const displayEmoji = matchedTile ? matchedTile.name.split(' ').pop() : char;

                  return (
                    <button
                      key={`${y}-${x}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsPaintMouseDown(true);
                        paintCell(x, y);
                      }}
                      onMouseEnter={() => {
                        if (isPaintMouseDown) {
                          paintCell(x, y);
                        }
                      }}
                      onMouseUp={() => setIsPaintMouseDown(false)}
                      onDragStart={(e) => e.preventDefault()}
                      className="w-9 h-9 sm:w-10 sm:h-10 border border-slate-800/40 hover:border-emerald-500 rounded flex flex-col items-center justify-center font-bold text-[11px] relative cursor-crosshair transition-all overflow-hidden shadow-sm select-none"
                      style={{ backgroundColor: tileColor }}
                      title={`Coordinate (${x}, ${y}): ${matchedTile ? matchedTile.name : 'Unknown'}`}
                    >
                      <span className="text-sm select-none leading-none">{displayEmoji}</span>
                      <span className="text-[7.5px] text-slate-350 opacity-40 font-mono absolute bottom-0.5 right-0.5 leading-none select-none">{char}</span>
                    </button>
                  );
                });
              })}
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono text-center mt-3 pt-2 border-t border-slate-900/60 w-full">
            Structure Boundaries: {designerWidth} columns wide • {designerHeight} rows high
          </div>
        </div>
      </div>

      {/* Execution Actions */}
      <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
        <span className="font-bold text-[10px] text-slate-400 block uppercase tracking-wider border-b border-slate-850 pb-1">
          ⚡ Constructor Engine Operations:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleSaveCustomDesignerStructure}
            className="py-2.5 px-3 bg-gradient-to-r from-emerald-955/40 to-slate-900 hover:from-emerald-900/50 hover:to-slate-850 border border-emerald-800 hover:border-emerald-600 text-emerald-300 font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Compile Blueprint to Memory</span>
          </button>

          <div className="bg-slate-950 border border-slate-850 p-1.5 rounded-lg flex items-center justify-between gap-2">
            <div className="flex-1 text-center border-r border-slate-900">
              <span className="text-[8px] text-slate-500 block uppercase font-bold">Overworld X</span>
              <span className="text-xs font-bold text-slate-300 font-mono">{customX}</span>
            </div>
            <div className="flex-1 text-center border-r border-slate-900">
              <span className="text-[8px] text-slate-500 block uppercase font-bold">Overworld Y</span>
              <span className="text-xs font-bold text-slate-300 font-mono">{customY}</span>
            </div>
            <button
              onClick={() => {
                setCustomX(gameState.playerX);
                setCustomY(gameState.playerY);
                triggerSuccessLog("Snapped placement target to player's feet!");
              }}
              className="py-1 px-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[9.5px] text-slate-300 cursor-pointer font-bold leading-tight"
            >
              ⚓ Snap Feet
            </button>
          </div>

          <button
            onClick={handlePlaceDesignerStructure}
            className="py-2.5 px-3 bg-gradient-to-r from-rose-955/40 to-slate-900 hover:from-rose-900/50 hover:to-slate-850 border border-rose-800 hover:border-rose-600 text-rose-300 font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Carve House at Overworld Target</span>
          </button>
        </div>
      </div>

      {/* Developer Export & Integration Hub */}
      <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3">
        <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
          <span className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Export & Code Integration Hub</span>
          </span>
          <span className="text-[8px] text-slate-500 font-sans">FOR ROGUELIKE DEVELOPERS</span>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          Export your newly crafted structure blueprints to save them locally, share with other players, or merge directly into the permanent codebase.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={handleDownloadBlueprintJson}
            className="py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-700 text-slate-200 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download JSON File</span>
          </button>

          <button
            onClick={handleCopyBlueprintJson}
            className="py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-700 text-slate-200 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            <span>Copy Raw JSON Object</span>
          </button>

          <button
            onClick={handleCopyAsTsConstant}
            className="py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-700 text-slate-200 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Copy as TS Preset Code</span>
          </button>
        </div>

        {/* Drag-and-Drop & Click Importer */}
        <div className="mt-3.5 p-3.5 bg-slate-950/60 border border-slate-850 rounded-lg space-y-2">
          <div className="flex justify-between items-center pb-1 border-b border-slate-900">
            <span className="font-bold text-[9px] text-slate-450 uppercase tracking-wider flex items-center gap-1">
              <Upload className="w-3 h-3 text-emerald-400" />
              <span>Import & Load Existing Blueprint JSON</span>
            </span>
            <span className="text-[7.5px] text-slate-500 font-sans">RESTORE PREVIOUSLY DESIGNED HOUSES</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleImportFile(file);
            }}
            onClick={() => {
              document.getElementById('blueprint-file-input')?.click();
            }}
            className={`border border-dashed rounded-lg p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                : 'border-slate-800 hover:border-emerald-700/50 bg-slate-950/40 hover:bg-slate-950/70 text-slate-450'
            }`}
          >
            <input
              id="blueprint-file-input"
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
              }}
            />
            <Upload className={`w-5 h-5 ${isDragOver ? 'text-emerald-300' : 'text-slate-500'}`} />
            <span className="font-bold text-[10px] text-slate-350">
              Drag & Drop Blueprint JSON here
            </span>
            <span className="text-[8.5px] text-slate-500 font-sans leading-none">
              or click to select file from your computer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
