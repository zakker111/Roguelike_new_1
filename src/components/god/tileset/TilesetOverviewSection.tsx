/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Layers,
  RefreshCw,
  Sparkles,
  Maximize2,
  Zap,
  Check
} from 'lucide-react';
import { MockupPaletteTheme } from '../../../canvas/MockupAtlasGenerator';
import { assetPreloader, PNG_MOCKUP_URLS } from '../../../canvas/AssetPreloader';
import { TilesetSourceType } from '../../../canvas/types';
import {
  PALETTE_THEMES,
  PRESET_SPRITE_SIZES,
  TEST_ENTITIES,
  TEST_BOSSES
} from './tilesetTesterTypes';

interface TilesetOverviewSectionProps {
  currentSource: TilesetSourceType;
  currentTheme: MockupPaletteTheme;
  spriteSize: number;
  onPreloadPngs: () => void;
  onSourceChange: (source: TilesetSourceType) => void;
  onThemeChange: (theme: MockupPaletteTheme) => void;
  onSpriteSizeChange: (size: number) => void;
  onSpawnEntity: (entityId: string, isBoss?: boolean) => void;
}

export function TilesetOverviewSection({
  currentSource,
  currentTheme,
  spriteSize,
  onPreloadPngs,
  onSourceChange,
  onThemeChange,
  onSpriteSizeChange,
  onSpawnEntity
}: TilesetOverviewSectionProps) {
  return (
    <div className="space-y-6">
      {/* Dual Tileset Sources (Instinct) */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Tileset Engine Sources (Instinct)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Dual Pipeline
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Two distinct, verified sources for tilesets: pre-rendered static mockup PNG files from <code className="text-amber-300 font-mono">public/tilesets/</code> or procedural code synthesized on offscreen HTML5 canvases.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPreloadPngs}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
              title="Force reload all static PNG files from public/tilesets/"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reload PNG Files</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Source 1: Classic PNG Mockups */}
          <div
            onClick={() => onSourceChange('classic_png')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              currentSource === 'classic_png'
                ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-400/80 shadow-lg shadow-indigo-950/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-300 uppercase">1. Instinct Classic (PNG Mockups)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    public/tilesets/*.png
                  </span>
                </div>
                {currentSource === 'classic_png' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>ACTIVE</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">Click to activate</span>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-3">
                Instinct pre-rendered static mockup PNG files loaded directly from filesystem assets. Deterministic, authentic pixel art.
              </p>

              {/* Checklist of files */}
              <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 space-y-1 text-[11px] font-mono">
                {Object.entries(PNG_MOCKUP_URLS).map(([key]) => {
                  const isLoaded = assetPreloader.isPngLoaded(key);
                  return (
                    <div key={key} className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">{key}.png</span>
                      <span className={isLoaded ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {isLoaded ? '● Ready' : '○ Standby'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Pipeline: HTTP Fetch & Image Cache</span>
              <button
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  currentSource === 'classic_png'
                    ? 'bg-indigo-600 text-white font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {currentSource === 'classic_png' ? 'Active Tileset Source' : 'Switch to PNG Source'}
              </button>
            </div>
          </div>

          {/* Source 2: Classic Procedural Code */}
          <div
            onClick={() => onSourceChange('classic_code')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              currentSource === 'classic_code'
                ? 'bg-purple-950/50 border-purple-500 ring-2 ring-purple-400/80 shadow-lg shadow-purple-950/50'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-purple-300 uppercase">2. Instinct Classic (Procedural Code)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    MockupAtlasGenerator.ts
                  </span>
                </div>
                {currentSource === 'classic_code' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>ACTIVE</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">Click to activate</span>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-3">
                Instinct procedural pixel art generated dynamically in real-time on offscreen HTML5 canvases.
              </p>

              {/* Feature highlights */}
              <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 space-y-1 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Themes</span>
                  <span className="text-purple-300 font-bold">3 (Classic, Forest, Infernal)</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Resolution</span>
                  <span className="text-purple-300 font-bold">{spriteSize}px (Scale 16–128px)</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Memory State</span>
                  <span className={assetPreloader.isCodeLoaded('main_tileset') ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {assetPreloader.isCodeLoaded('main_tileset') ? '● Canvas Active' : '○ Standby'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Autotiling</span>
                  <span className="text-emerald-400 font-bold">16-Grid Bitmask Wang</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Pipeline: Offscreen HTML5 Canvas</span>
              <button
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  currentSource === 'classic_code'
                    ? 'bg-purple-600 text-white font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {currentSource === 'classic_code' ? 'Active Tileset Source' : 'Switch to Code Source'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Palette Switcher */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Select Procedural Mockup Theme</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PALETTE_THEMES.map((th) => {
            const isSelected = currentTheme === th.id;
            return (
              <div
                key={th.id}
                onClick={() => onThemeChange(th.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${th.bg} ring-2 ring-amber-400 shadow-lg scale-[1.02]`
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black ${th.color}`}>{th.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{th.desc}</p>
                </div>
                <button
                  className={`mt-3 py-1 px-2.5 rounded text-[10px] font-bold uppercase tracking-wider text-center transition-colors ${
                    isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isSelected ? 'Active Theme' : 'Apply Theme'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sprite Sizing Scaler */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Base Sprite Dimension (Grid Cell Size)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Adapts rendering engine math and re-slices tileset atlas coordinate buffers.
            </p>
          </div>
          <span className="px-3 py-1 bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-black rounded-lg">
            {spriteSize} × {spriteSize} px
          </span>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-2 font-mono">Presets:</span>
          {PRESET_SPRITE_SIZES.map((sz) => (
            <button
              key={sz}
              onClick={() => onSpriteSizeChange(sz)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                spriteSize === sz
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {sz}px
            </button>
          ))}
        </div>

        {/* Custom Range Slider */}
        <div className="flex items-center gap-4 pt-2">
          <span className="text-xs text-slate-400 font-mono">16px</span>
          <input
            type="range"
            min="16"
            max="64"
            step="8"
            value={spriteSize}
            onChange={(e) => onSpriteSizeChange(parseInt(e.target.value))}
            className="flex-1 accent-cyan-400 cursor-pointer"
          />
          <span className="text-xs text-slate-400 font-mono">64px</span>
        </div>
      </div>

      {/* Quick Spawn Buttons for Testing */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Live In-Game Entity Spawner (Next to Player)</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {TEST_ENTITIES.slice(0, 8).map((ent) => (
            <button
              key={ent.id}
              onClick={() => onSpawnEntity(ent.id, false)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
            >
              <span className="text-amber-400 font-mono">[{ent.char}]</span>
              <span>Spawn {ent.label}</span>
            </button>
          ))}
          {TEST_BOSSES.map((boss) => (
            <button
              key={boss.id}
              onClick={() => onSpawnEntity(boss.id, true)}
              className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 rounded text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
            >
              <span>👑 Spawn {boss.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
