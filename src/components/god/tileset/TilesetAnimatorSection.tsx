/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { tilesetAtlasManager } from '../../../canvas/TilesetAtlasManager';
import { assetPreloader } from '../../../canvas/AssetPreloader';
import { TilesetSourceType } from '../../../canvas/types';
import { MockupPaletteTheme } from '../../../canvas/MockupAtlasGenerator';
import { TEST_ENTITIES, TEST_BOSSES } from './tilesetTesterTypes';

interface TilesetAnimatorSectionProps {
  currentSource: TilesetSourceType;
  currentTheme: MockupPaletteTheme;
  spriteSize: number;
  refreshTrigger: number;
  animEntity: string;
  animDirection: 'south' | 'west' | 'east' | 'north';
  animState: 'idle' | 'walk' | 'attack' | 'hurt' | 'cast';
  animIsPlaying: boolean;
  animFrame: number;
  animFps: number;
  onSetAnimEntity: (entity: string) => void;
  onSetAnimDirection: (dir: 'south' | 'west' | 'east' | 'north') => void;
  onSetAnimState: (state: 'idle' | 'walk' | 'attack' | 'hurt' | 'cast') => void;
  onSetAnimIsPlaying: (playing: boolean) => void;
  onSetAnimFps: (fps: number) => void;
}

export function TilesetAnimatorSection({
  currentSource,
  currentTheme,
  spriteSize,
  refreshTrigger,
  animEntity,
  animDirection,
  animState,
  animIsPlaying,
  animFrame,
  animFps,
  onSetAnimEntity,
  onSetAnimDirection,
  onSetAnimState,
  onSetAnimIsPlaying,
  onSetAnimFps
}: TilesetAnimatorSectionProps) {
  const animCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Live Character / Boss Preview Canvas
  useEffect(() => {
    const canvas = animCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw checkered background
    const chkSize = 16;
    ctx.fillStyle = '#131b2e';
    for (let x = 0; x < canvas.width; x += chkSize) {
      for (let y = 0; y < canvas.height; y += chkSize) {
        if ((x / chkSize + y / chkSize) % 2 === 0) {
          ctx.fillRect(x, y, chkSize, chkSize);
        }
      }
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Check if oversized boss is selected
    const oversized = tilesetAtlasManager.getOversizedEntityConfig(animEntity);
    if (oversized) {
      const bossAtlas = assetPreloader.getAtlasSource(oversized.atlasKey, currentSource);
      if (bossAtlas) {
        const scale = 2.5;
        const dw = oversized.pixelWidth * scale;
        const dh = oversized.pixelHeight * scale;
        const dx = centerX - dw / 2;
        const dy = centerY - dh / 2;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          bossAtlas,
          oversized.sx,
          oversized.sy,
          oversized.pixelWidth,
          oversized.pixelHeight,
          dx,
          dy,
          dw,
          dh
        );

        // Ground shadow
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + dh * 0.45, dw * 0.4, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();
        return;
      }
    }

    // Regular entity preview
    const spriteCoords = tilesetAtlasManager.getSpriteCoords(
      animEntity,
      animState,
      animDirection,
      animFrame
    );

    const entityAtlas = assetPreloader.getAtlasSource('entity_tileset', currentSource);
    if (entityAtlas && spriteCoords) {
      const scale = 3.0;
      const dw = spriteCoords.sw * scale;
      const dh = spriteCoords.sh * scale;
      const dx = centerX - dw / 2;
      const dy = centerY - dh / 2;

      // Ground shadow
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + dh * 0.4, dw * 0.35, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        entityAtlas,
        spriteCoords.sx,
        spriteCoords.sy,
        spriteCoords.sw,
        spriteCoords.sh,
        dx,
        dy,
        dw,
        dh
      );
    }
  }, [animEntity, animDirection, animState, animFrame, animFps, refreshTrigger, currentTheme, spriteSize, currentSource]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Controls */}
      <div className="space-y-4 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Entity Archetype:
          </label>
          <select
            value={animEntity}
            onChange={(e) => onSetAnimEntity(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-100 cursor-pointer"
          >
            <optgroup label="Standard Characters">
              {TEST_ENTITIES.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.label} [{ent.char}]
                </option>
              ))}
            </optgroup>
            <optgroup label="Oversized Bosses (Multi-Tile)">
              {TEST_BOSSES.map((b) => (
                <option key={b.id} value={b.id}>
                  👑 {b.label} ({b.size})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Direction Selector */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Facing Direction:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['south', 'west', 'east', 'north'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => onSetAnimDirection(dir)}
                className={`py-1.5 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                  animDirection === dir
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>

        {/* Animation State */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Animation State:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {(['idle', 'walk', 'attack', 'hurt', 'cast'] as const).map((st) => (
              <button
                key={st}
                onClick={() => onSetAnimState(st)}
                className={`py-1.5 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                  animState === st
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetAnimIsPlaying(!animIsPlaying)}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                animIsPlaying ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {animIsPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{animIsPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>
            <span className="text-xs font-mono text-slate-400">
              Frame: <b className="text-amber-300">{animFrame} / 3</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{animFps} FPS</span>
            <input
              type="range"
              min="2"
              max="16"
              step="1"
              value={animFps}
              onChange={(e) => onSetAnimFps(parseInt(e.target.value))}
              className="w-24 accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Stage Viewport */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/80 border border-slate-800 rounded-xl relative">
        <canvas
          ref={animCanvasRef}
          width={240}
          height={240}
          className="border-2 border-slate-700 rounded-xl shadow-2xl"
        />
        <div className="mt-3 text-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            {animEntity} • {animState} ({animDirection})
          </span>
          <span className="text-[11px] text-slate-400">
            Procedural 4-directional sprite atlas rendering loop
          </span>
        </div>
      </div>
    </div>
  );
}
