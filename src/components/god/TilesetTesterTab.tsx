/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Eye,
  Play,
  Sliders,
  Grid
} from 'lucide-react';
import { mockupAtlasGenerator, MockupPaletteTheme } from '../../canvas/MockupAtlasGenerator';
import { assetPreloader } from '../../canvas/AssetPreloader';
import { tilesetAtlasManager } from '../../canvas/TilesetAtlasManager';
import { hybridGraphicsEngine } from '../../canvas/HybridGraphicsEngine';
import { TilesetSourceType, TILESET_SOURCES } from '../../canvas/types';
import { GameState, TileType, EnemyType } from '../../types';
import { playSound } from '../../utils/audio';
import {
  TilesetOverviewSection,
  TilesetInspectorSection,
  TilesetAnimatorSection,
  TilesetAutotilingSection
} from './tileset';

interface TilesetTesterTabProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage?: (msg: string, type?: string) => void;
}

export function TilesetTesterTab({ gameState, setGameState, addLogMessage }: TilesetTesterTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'inspector' | 'animator' | 'autotiling'>('overview');
  const [currentMode, setCurrentMode] = useState<'classic_glyph' | 'animated_tileset'>(() => hybridGraphicsEngine.getMode());
  const [currentSource, setCurrentSource] = useState<TilesetSourceType>(() => assetPreloader.getSource());
  const [inspectorSource, setInspectorSource] = useState<TilesetSourceType>(() => assetPreloader.getSource());
  const [currentTheme, setCurrentTheme] = useState<MockupPaletteTheme>(() => mockupAtlasGenerator.getTheme());
  const [spriteSize, setSpriteSize] = useState<number>(() => tilesetAtlasManager.getSpriteSize());
  const [selectedAtlasKey, setSelectedAtlasKey] = useState<string>('main_tileset');
  const [atlasZoom, setAtlasZoom] = useState<number>(1.5);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [hoveredTileInfo, setHoveredTileInfo] = useState<{ col: number; row: number; px: number; py: number } | null>(null);

  // Animation test preview state
  const [animEntity, setAnimEntity] = useState<string>('player');
  const [animDirection, setAnimDirection] = useState<'south' | 'west' | 'east' | 'north'>('south');
  const [animState, setAnimState] = useState<'idle' | 'walk' | 'attack' | 'hurt' | 'cast'>('idle');
  const [animIsPlaying, setAnimIsPlaying] = useState<boolean>(true);
  const [animFrame, setAnimFrame] = useState<number>(0);
  const [animFps, setAnimFps] = useState<number>(6);

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Ensure both tileset sources are ready on mount
  useEffect(() => {
    if (assetPreloader.getSource() === 'classic_png') {
      assetPreloader.preloadAllPngs().then(() => setRefreshTrigger((t) => t + 1));
    }
    if (!assetPreloader.isCodeLoaded('main_tileset')) {
      mockupAtlasGenerator.generateAllAtlases(currentTheme, spriteSize);
    }
  }, []);

  // Animation preview loop
  useEffect(() => {
    if (!animIsPlaying) return;
    const interval = setInterval(() => {
      setAnimFrame((prev) => (prev + 1) % 4);
    }, 1000 / animFps);
    return () => clearInterval(interval);
  }, [animIsPlaying, animFps]);

  const handleModeToggle = (mode: 'classic_glyph' | 'animated_tileset') => {
    hybridGraphicsEngine.setMode(mode);
    setCurrentMode(mode);
    playSound('ui_click');
    addLogMessage?.(`🎨 Switched graphics visual mode to: ${mode.toUpperCase()}`, 'system');
  };

  const handleSourceChange = async (source: TilesetSourceType) => {
    await hybridGraphicsEngine.setTilesetSource(source);
    setCurrentSource(source);
    setInspectorSource(source);
    setRefreshTrigger((prev) => prev + 1);
    playSound('ui_click');
    addLogMessage?.(`🎨 Switched active tileset source to: ${TILESET_SOURCES[source].name}`, 'system');
  };

  const handlePreloadPngs = async () => {
    playSound('ui_click');
    addLogMessage?.('⏳ Preloading all static mockup PNG files from public/tilesets/...', 'system');
    await assetPreloader.preloadAllPngs();
    setRefreshTrigger((prev) => prev + 1);
    playSound('magic_cast');
    addLogMessage?.('✅ All static mockup PNG files verified & loaded into cache!', 'system');
  };

  const handleThemeChange = (theme: MockupPaletteTheme) => {
    setCurrentTheme(theme);
    mockupAtlasGenerator.setTheme(theme);
    setRefreshTrigger((prev) => prev + 1);
    playSound('magic_cast');
    addLogMessage?.(`🎨 Regenerated procedural atlases with theme: ${theme.toUpperCase()}`, 'system');
  };

  const handleSpriteSizeChange = (newSize: number) => {
    const clamped = Math.max(16, Math.min(128, newSize));
    setSpriteSize(clamped);
    mockupAtlasGenerator.setBaseSpriteSize(clamped);
    setRefreshTrigger((prev) => prev + 1);
    playSound('ui_click');
    addLogMessage?.(`📐 Reconfigured atlas base sprite size: ${clamped}px`, 'system');
  };

  const handleDownloadAtlasPng = () => {
    const source = assetPreloader.getAtlasSource(selectedAtlasKey, inspectorSource);
    if (!source) return;

    let dataUrl = '';
    if (source instanceof HTMLCanvasElement) {
      dataUrl = source.toDataURL('image/png');
    } else if (source instanceof HTMLImageElement) {
      const offscreen = document.createElement('canvas');
      offscreen.width = source.naturalWidth;
      offscreen.height = source.naturalHeight;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(source, 0, 0);
        dataUrl = offscreen.toDataURL('image/png');
      }
    }

    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${selectedAtlasKey}_${inspectorSource}_${spriteSize}px.png`;
    a.click();
    playSound('loot_pickup');
  };

  const handleSpawnEntityNextToPlayer = (entityId: string, isBoss: boolean = false) => {
    const px = gameState.playerX;
    const py = gameState.playerY;
    const neighbors = [
      { x: px + 1, y: py },
      { x: px - 1, y: py },
      { x: px, y: py + 1 },
      { x: px, y: py - 1 },
      { x: px + 1, y: py + 1 }
    ];

    const spawnPos = neighbors.find((pos) => {
      const tile = gameState.map?.[pos.y]?.[pos.x];
      const isBlocked = gameState.enemies.some((e) => e.x === pos.x && e.y === pos.y);
      return tile && tile !== TileType.Wall && tile !== TileType.Water && !isBlocked;
    }) || neighbors[0];

    const newEnemy = {
      id: `spawned_${entityId}_${Date.now()}`,
      x: spawnPos.x,
      y: spawnPos.y,
      type: (isBoss ? EnemyType.Dragon : EnemyType.Bandit) as any,
      hp: isBoss ? 250 : 45,
      maxHp: isBoss ? 250 : 45,
      damage: isBoss ? 22 : 8,
      defense: isBoss ? 8 : 2,
      xp: isBoss ? 350 : 25,
      symbol: isBoss ? 'B' : entityId[0].toUpperCase(),
      name: isBoss ? `High ${entityId.toUpperCase()}` : `Test ${entityId.toUpperCase()}`,
      color: isBoss ? '#ef4444' : '#38bdf8',
      level: isBoss ? 10 : 3
    };

    setGameState((prev) => ({
      ...prev,
      enemies: [...prev.enemies, newEnemy as any]
    }));

    playSound('boss_roar');
    addLogMessage?.(`⚔️ Spawned ${newEnemy.name} at (${spawnPos.x}, ${spawnPos.y}) for live testing!`, 'combat');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-y-auto p-4 space-y-6">
      {/* Top Banner & Quick Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-wider text-slate-100 uppercase flex items-center gap-2">
              <span>Tileset & Mockup Sprite Engine Studio</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO-DEV SUITE
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Hot-swap themes, test multi-size sprite atlases (16–128px), preview animations, inspect Wang bitmasks, and spawn oversized bosses.
            </p>
          </div>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => handleModeToggle('classic_glyph')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentMode === 'classic_glyph'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📜 Classic Glyph / ASCII</span>
          </button>
          <button
            onClick={() => handleModeToggle('animated_tileset')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentMode === 'animated_tileset'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🖼️ HD Animated Tileset</span>
          </button>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
        {[
          { id: 'overview', label: 'Theme & Size Controls', icon: Sliders },
          { id: 'inspector', label: 'Atlas Sheet Inspector', icon: Eye },
          { id: 'animator', label: 'Character & Boss Animator', icon: Play },
          { id: 'autotiling', label: 'Wang Autotiling 16-Grid', icon: Grid }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub Tab Views */}
      {activeSubTab === 'overview' && (
        <TilesetOverviewSection
          currentSource={currentSource}
          currentTheme={currentTheme}
          spriteSize={spriteSize}
          onPreloadPngs={handlePreloadPngs}
          onSourceChange={handleSourceChange}
          onThemeChange={handleThemeChange}
          onSpriteSizeChange={handleSpriteSizeChange}
          onSpawnEntity={handleSpawnEntityNextToPlayer}
        />
      )}

      {activeSubTab === 'inspector' && (
        <TilesetInspectorSection
          inspectorSource={inspectorSource}
          selectedAtlasKey={selectedAtlasKey}
          atlasZoom={atlasZoom}
          showGridOverlay={showGridOverlay}
          hoveredTileInfo={hoveredTileInfo}
          spriteSize={spriteSize}
          refreshTrigger={refreshTrigger}
          currentTheme={currentTheme}
          onInspectorSourceChange={setInspectorSource}
          onSelectAtlasKey={setSelectedAtlasKey}
          onSetShowGridOverlay={setShowGridOverlay}
          onSetAtlasZoom={setAtlasZoom}
          onHoverTileInfo={setHoveredTileInfo}
          onDownloadAtlasPng={handleDownloadAtlasPng}
        />
      )}

      {activeSubTab === 'animator' && (
        <TilesetAnimatorSection
          currentSource={currentSource}
          currentTheme={currentTheme}
          spriteSize={spriteSize}
          refreshTrigger={refreshTrigger}
          animEntity={animEntity}
          animDirection={animDirection}
          animState={animState}
          animIsPlaying={animIsPlaying}
          animFrame={animFrame}
          animFps={animFps}
          onSetAnimEntity={setAnimEntity}
          onSetAnimDirection={setAnimDirection}
          onSetAnimState={setAnimState}
          onSetAnimIsPlaying={setAnimIsPlaying}
          onSetAnimFps={setAnimFps}
        />
      )}

      {activeSubTab === 'autotiling' && (
        <TilesetAutotilingSection />
      )}
    </div>
  );
}
