import React from 'react';
import { Hammer } from 'lucide-react';
import { GameState } from '../../types';
import { getAvailableStructures } from '../../utils/structurePlacer';

export interface GodStructureCarverProps {
  gameState: GameState;
  selectedPresetId: string;
  setSelectedPresetId: (id: string) => void;
  customX: number;
  setCustomX: (x: number) => void;
  customY: number;
  setCustomY: (y: number) => void;
  handlePlaceStructure: (offsetX: number, offsetY: number, label: string) => void;
  triggerSuccessLog: (msg: string) => void;
}

export function GodStructureCarver({
  gameState,
  selectedPresetId,
  setSelectedPresetId,
  customX,
  setCustomX,
  customY,
  setCustomY,
  handlePlaceStructure,
  triggerSuccessLog,
}: GodStructureCarverProps) {
  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="border-b border-slate-800 pb-1.5">
        <h4 className="font-bold text-slate-350 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
          <Hammer className="w-4 h-4 text-green-400" />
          <span>Prefabricated Building Assembler & Placer</span>
        </h4>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Select a preconfigured structural blueprint below, adjust position alignments, and instantly carve elements onto your active chunk.
        </p>
      </div>

      {/* List of presets */}
      <div className="grid grid-cols-1 gap-2.5">
        {getAvailableStructures().map((preset) => (
          <button
            key={preset.id}
            onClick={() => setSelectedPresetId(preset.id)}
            className={`p-3 rounded-lg text-left border transition-all cursor-pointer flex gap-3 ${
              selectedPresetId === preset.id
                ? 'border-green-500 bg-green-950/10 text-slate-100 shadow-md'
                : 'border-slate-800 bg-slate-950/20 hover:border-slate-700 text-slate-400'
            }`}
          >
            <span className="text-2xl mt-1">{preset.emoji}</span>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">{preset.name}</span>
                <span className="bg-slate-950 px-1.5 py-0.5 rounded font-bold font-mono text-[9px] border border-slate-850 text-slate-400">
                  {preset.width}x{preset.height} Tiles
                </span>
              </div>
              <p className="text-[10px] text-slate-450 mt-1 font-sans leading-relaxed">
                {preset.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Align coordinates configuration console */}
      <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-3">
        <span className="font-bold text-[10px] text-slate-400 block uppercase tracking-wider">Placement Coordinates Anchor (Top-Left):</span>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-[9px] text-slate-500 block mb-1">Target X coordinate</span>
            <input
              type="number"
              min="0"
              max={gameState.levelWidth - 1}
              value={customX}
              onChange={(e) => setCustomX(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono"
            />
          </div>

          <div>
            <span className="text-[9px] text-slate-500 block mb-1">Target Y coordinate</span>
            <input
              type="number"
              min="0"
              max={gameState.levelHeight - 1}
              value={customY}
              onChange={(e) => setCustomY(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setCustomX(gameState.playerX);
                setCustomY(gameState.playerY);
                triggerSuccessLog("Snapped placement target to exact player standing coord!");
              }}
              className="w-full py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded text-center transition-all cursor-pointer text-[10px]"
            >
              ⚓ Snap Player coords
            </button>
          </div>
        </div>

        {/* Instant placement directional actions */}
        <div className="space-y-2">
          <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-widest">Execute One-Click Placements:</span>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => handlePlaceStructure(0, 0, "Exact Player coords")}
              className="py-2.5 px-1 bg-green-950/30 hover:bg-green-900/40 border border-green-800/50 text-green-300 rounded font-bold transition-all text-center cursor-pointer text-[10px]"
            >
              Centered Here
            </button>
            <button
              onClick={() => handlePlaceStructure(0, -6, "6 Tiles North")}
              className="py-2.5 px-1 bg-slate-950/50 hover:bg-slate-850 border border-slate-800 text-slate-200 rounded font-bold transition-all text-center cursor-pointer text-[10px]"
            >
              ⬆️ North (-6 Y)
            </button>
            <button
              onClick={() => handlePlaceStructure(0, 6, "6 Tiles South")}
              className="py-2.5 px-1 bg-slate-950/50 hover:bg-slate-850 border border-slate-800 text-slate-200 rounded font-bold transition-all text-center cursor-pointer text-[10px]"
            >
              ⬇️ South (+6 Y)
            </button>
            <button
              onClick={() => handlePlaceStructure(-6, 0, "6 Tiles West")}
              className="py-2.5 px-1 bg-slate-950/50 hover:bg-slate-850 border border-slate-800 text-slate-200 rounded font-bold transition-all text-center cursor-pointer text-[10px]"
            >
              ⬅️ West (-6 X)
            </button>
            <button
              onClick={() => handlePlaceStructure(6, 0, "6 Tiles East")}
              className="py-2.5 px-1 bg-slate-950/50 hover:bg-slate-850 border border-slate-800 text-slate-200 rounded font-bold transition-all text-center cursor-pointer text-[10px]"
            >
              ➡️ East (+6 X)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
