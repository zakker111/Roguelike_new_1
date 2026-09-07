import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Layers,
  Eye,
  Download,
  RefreshCw,
  Play,
  Pause,
  Sliders,
  Sparkles,
  Maximize2,
  Grid,
  Zap,
  Check,
  Compass
} from 'lucide-react';
import { mockupAtlasGenerator, MockupPaletteTheme } from '../../canvas/MockupAtlasGenerator';
import { assetPreloader, PNG_MOCKUP_URLS } from '../../canvas/AssetPreloader';
import { tilesetAtlasManager, OversizedEntityConfig } from '../../canvas/TilesetAtlasManager';
import { hybridGraphicsEngine } from '../../canvas/HybridGraphicsEngine';
import { TilesetSourceType, TILESET_SOURCES } from '../../canvas/types';
import { GameState, TileType, EnemyType } from '../../types';
import { playSound } from '../../utils/audio';

interface TilesetTesterTabProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage?: (msg: string, type?: string) => void;
}

const PALETTE_THEMES: { id: MockupPaletteTheme; label: string; desc: string; color: string; bg: string }[] = [
  { id: 'classic', label: 'Classic Fantasy', desc: '16-bit earthen stones, verdant meadows, and steel gear', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/50' },
  { id: 'cyber', label: 'Cyber Synthwave', desc: 'Neon cyan gridlines, magenta energy, and holo-circuits', color: 'text-cyan-400', bg: 'bg-cyan-950/40 border-cyan-500/50' },
  { id: 'forest', label: 'Verdant Deepwood', desc: 'Lush mossy canopy, ancient pines, and emerald glades', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/50' },
  { id: 'infernal', label: 'Infernal Brimstone', desc: 'Volcanic magma stone, obsidian basalt, and hellfire embers', color: 'text-red-400', bg: 'bg-red-950/40 border-red-500/50' }
];

const PRESET_SPRITE_SIZES = [16, 24, 32, 48, 64];

const TEST_ENTITIES = [
  { id: 'player', label: 'Hero / Player', char: '@', defaultAnim: 'idle' },
  { id: 'warrior', label: 'Warrior', char: 'W', defaultAnim: 'walk' },
  { id: 'mage', label: 'Mage Arcane', char: 'M', defaultAnim: 'cast' },
  { id: 'rogue', label: 'Shadow Rogue', char: 'R', defaultAnim: 'attack' },
  { id: 'guard', label: 'Town Guard', char: 'g', defaultAnim: 'idle' },
  { id: 'goblin', label: 'Goblin Scout', char: 'G', defaultAnim: 'walk' },
  { id: 'skeleton', label: 'Skeleton', char: 'S', defaultAnim: 'attack' },
  { id: 'orc', label: 'Orc Berserker', char: 'O', defaultAnim: 'attack' },
  { id: 'spider', label: 'Venom Spider', char: 's', defaultAnim: 'walk' },
  { id: 'wolf', label: 'Dire Wolf', char: 'w', defaultAnim: 'walk' },
  { id: 'slime', label: 'Acid Slime', char: 'e', defaultAnim: 'idle' },
  { id: 'cat', label: 'Legendary Cat', char: 'c', defaultAnim: 'walk' }
];

const TEST_BOSSES = [
  { id: 'dragon', label: 'Fire Drake / Dragon', size: '2x2 (64px)', anchor: '0.90' },
  { id: 'golem', label: 'Titan Stone Golem', size: '2x2 (64px)', anchor: '0.95' },
  { id: 'demon_lord', label: 'Demon Lord / Behemoth', size: '3x3 (96px)', anchor: '0.95' }
];

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

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animCanvasRef = useRef<HTMLCanvasElement | null>(null);
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
      ctx.fillText(`Atlas '${selectedAtlasKey}' not loaded for ${TILESET_SOURCES[inspectorSource].name}`, canvas.width / 2, canvas.height / 2);
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
        if (((x / chkSize) + (y / chkSize)) % 2 === 0) {
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

      {/* ========================================================================= */}
      {/* 1. OVERVIEW: THEME & SIZE CONTROLS */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
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
                  onClick={handlePreloadPngs}
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
                onClick={() => handleSourceChange('classic_png')}
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
                onClick={() => handleSourceChange('classic_code')}
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
                      <span className="text-purple-300 font-bold">4 (Classic, Cyber, Forest, Infernal)</span>
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
                    onClick={() => handleThemeChange(th.id)}
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
                  onClick={() => handleSpriteSizeChange(sz)}
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
                onChange={(e) => handleSpriteSizeChange(parseInt(e.target.value))}
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
                  onClick={() => handleSpawnEntityNextToPlayer(ent.id, false)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                >
                  <span className="text-amber-400 font-mono">[{ent.char}]</span>
                  <span>Spawn {ent.label}</span>
                </button>
              ))}
              {TEST_BOSSES.map((boss) => (
                <button
                  key={boss.id}
                  onClick={() => handleSpawnEntityNextToPlayer(boss.id, true)}
                  className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 rounded text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                >
                  <span>👑 Spawn {boss.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INSPECTOR: ATLAS SHEET VIEWER */}
      {/* ========================================================================= */}
      {activeSubTab === 'inspector' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            {/* Source & Atlas Key Selector */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Inspect Source */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase px-1.5">Source:</span>
                <button
                  onClick={() => setInspectorSource('classic_png')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    inspectorSource === 'classic_png'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Instinct (PNG)
                </button>
                <button
                  onClick={() => setInspectorSource('classic_code')}
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
                      setSelectedAtlasKey(k);
                      setHoveredTileInfo(null);
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
                  onChange={(e) => setShowGridOverlay(e.target.checked)}
                  className="accent-amber-400"
                />
                <span>Grid Overlay</span>
              </label>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAtlasZoom((z) => Math.max(0.5, z - 0.25))}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-mono px-2 text-amber-300">{atlasZoom.toFixed(2)}x</span>
                <button
                  onClick={() => setAtlasZoom((z) => Math.min(4.0, z + 0.25))}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleDownloadAtlasPng}
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
                setHoveredTileInfo({ col, row, px: mouseX, py: mouseY });
              }}
              onMouseLeave={() => setHoveredTileInfo(null)}
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
      )}

      {/* ========================================================================= */}
      {/* 3. ANIMATOR: CHARACTER & BOSS PREVIEWER */}
      {/* ========================================================================= */}
      {activeSubTab === 'animator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Entity Archetype:
              </label>
              <select
                value={animEntity}
                onChange={(e) => setAnimEntity(e.target.value)}
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
                    onClick={() => setAnimDirection(dir)}
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
                    onClick={() => setAnimState(st)}
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
                  onClick={() => setAnimIsPlaying(!animIsPlaying)}
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
                  onChange={(e) => setAnimFps(parseInt(e.target.value))}
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
      )}

      {/* ========================================================================= */}
      {/* 4. AUTOTILING: 16-BITMASK MATRIX */}
      {/* ========================================================================= */}
      {activeSubTab === 'autotiling' && (
        <div className="space-y-4 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-1">
              <Grid className="w-3.5 h-3.5 text-amber-400" />
              <span>16-Neighbor Cardinal Wang Autotile Layout (N=1, E=2, S=4, W=8)</span>
            </h4>
            <p className="text-xs text-slate-400">
              The engine evaluates 4 cardinal neighbor bits to dynamically stitch seamless walls, rivers, and stone pathways.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { mask: 0, label: '0: Pillar / Isolated' },
              { mask: 1, label: '1: End North' },
              { mask: 2, label: '2: End East' },
              { mask: 3, label: '3: Corner NE' },
              { mask: 4, label: '4: End South' },
              { mask: 5, label: '5: Straight NS' },
              { mask: 6, label: '6: Corner SE' },
              { mask: 7, label: '7: T-Junction NES' },
              { mask: 8, label: '8: End West' },
              { mask: 9, label: '9: Corner NW' },
              { mask: 10, label: '10: Straight EW' },
              { mask: 11, label: '11: T-Junction NEW' },
              { mask: 12, label: '12: Corner SW' },
              { mask: 13, label: '13: T-Junction NSW' },
              { mask: 14, label: '14: T-Junction SEW' },
              { mask: 15, label: '15: Crossroad 4-Way' }
            ].map((bm) => {
              const coords = tilesetAtlasManager.getAutotileCoords(TileType.Wall, bm.mask);
              return (
                <div
                  key={bm.mask}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{bm.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Grid: Col {coords?.sx ?? 0}, Row {coords?.sy ?? 0}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono text-xs text-amber-300 font-black">
                    {bm.mask}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
