import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { ChunkMapInfo, WorldMapFilterState, CustomMapPin, TraversalIndex } from './types';
import { getContinuousTerrainMetrics } from '../../world/organic/biomeNoiseEngine';
import { getOrganicBiome } from '../../world/overworldBiomes';
import { hasTownAtChunk, getDeterministicTownName, isCastleTownAtChunk } from '../../world/overworldStructures';
import { OverworldChunk } from '../../types';
import { useWorldMapViewport } from './useWorldMapViewport';
import {
  renderWorldMapBackground,
  renderWorldMapTerrain,
  renderWorldMapHud,
} from './worldMapTerrainRenderer';
import { renderWorldMapStaticPins } from './worldMapPinsRenderer';
import { WorldMapPinsOverlay } from './WorldMapPinsOverlay';
import { WorldMapControls } from './WorldMapControls';

export interface WorldMapCanvasProps {
  currentChunkX: number;
  currentChunkY: number;
  discoveredChunks: Set<string>;
  overworldChunks?: Record<string, OverworldChunk>;
  zoomLevel: number;
  setZoomLevel?: React.Dispatch<React.SetStateAction<number>>;
  filters: WorldMapFilterState;
  customPins?: CustomMapPin[];
  attunedWaystones?: string[];
  recenterTrigger?: number;
  isOverworld?: boolean;
  dungeonLevel?: number;
  selectedChunkCoord?: { x: number; y: number } | null;
  onHoverChunk: (chunk: ChunkMapInfo | null) => void;
  onSelectChunk: (chunk: ChunkMapInfo) => void;
  onRightClickChunk?: (chunkX: number, chunkY: number) => void;
}

export const WorldMapCanvas: React.FC<WorldMapCanvasProps> = ({
  currentChunkX,
  currentChunkY,
  discoveredChunks,
  overworldChunks = {},
  zoomLevel,
  setZoomLevel,
  filters,
  customPins = [],
  attunedWaystones = [],
  recenterTrigger = 0,
  isOverworld = true,
  dungeonLevel = 0,
  selectedChunkCoord = null,
  onHoverChunk,
  onSelectChunk,
  onRightClickChunk,
}) => {
  // Safe normalized discovered chunks set
  const safeDiscoveredSet = useMemo<Set<string>>(() => {
    if (discoveredChunks instanceof Set) return discoveredChunks as Set<string>;
    if (Array.isArray(discoveredChunks)) return new Set<string>(discoveredChunks);
    if (discoveredChunks && typeof discoveredChunks === 'object') return new Set<string>(Object.keys(discoveredChunks));
    return new Set<string>();
  }, [discoveredChunks]);

  // Compute dynamic expanding realm frontier bounding box
  const realmBounds = useMemo(() => {
    let minX = currentChunkX;
    let maxX = currentChunkX;
    let minY = currentChunkY;
    let maxY = currentChunkY;

    safeDiscoveredSet.forEach((k: string) => {
      const [x, y] = k.split(',').map(Number);
      if (!isNaN(x) && !isNaN(y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });

    Object.keys(overworldChunks || {}).forEach(k => {
      const [x, y] = k.split(',').map(Number);
      if (!isNaN(x) && !isNaN(y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });

    const buffer = 4;
    const renderMinX = Math.min(-8, minX - buffer);
    const renderMaxX = Math.max(8, maxX + buffer);
    const renderMinY = Math.min(-8, minY - buffer);
    const renderMaxY = Math.max(8, maxY + buffer);

    return {
      minX, maxX, minY, maxY,
      renderMinX, renderMaxX, renderMinY, renderMaxY,
    };
  }, [safeDiscoveredSet, overworldChunks, currentChunkX, currentChunkY]);

  // Chunk data memoization cache to avoid recalculating procedural biomes & metrics every frame
  const chunkDataCacheRef = useRef<Map<string, ChunkMapInfo>>(new Map());

  // Clear cache whenever chunks, discovered set, or pins change
  useEffect(() => {
    chunkDataCacheRef.current.clear();
  }, [discoveredChunks, overworldChunks, customPins, attunedWaystones]);

  // Compute info for a chunk coordinate
  const getChunkData = useCallback((cx: number, cy: number): ChunkMapInfo => {
    const key = `${cx},${cy}`;
    const cached = chunkDataCacheRef.current.get(key);
    if (cached) return cached;

    const isDiscovered =
      safeDiscoveredSet.has(key) ||
      (cx === currentChunkX && cy === currentChunkY) ||
      (cx === 0 && cy === 0) ||
      Boolean(overworldChunks?.[key]);

    const metrics = getContinuousTerrainMetrics(cx * 64, cy * 40);
    const existingChunk = overworldChunks[key];

    let biome: string = 'forest';
    let hasTown = false;
    let townName = '';
    let isCastleTown = false;
    let isPortTown = false;
    let hasDungeon = false;
    const pois: ChunkMapInfo['pois'] = [];

    const mapPrng = (x: number, y: number, seed: number = 8675309) => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
      return n - Math.floor(n);
    };

    if (existingChunk) {
      biome = existingChunk.biome;
      hasTown = Boolean(existingChunk.towns && existingChunk.towns.length > 0) || (cx === 0 && cy === 0) || hasTownAtChunk(cx, cy, mapPrng);
      townName = existingChunk.towns?.[0]?.name || (cx === 0 && cy === 0 ? 'Oakhaven Village' : getDeterministicTownName(cx, cy, 8675309, mapPrng));
      isCastleTown = isCastleTownAtChunk(cx, cy, mapPrng);
      isPortTown = (cx !== 0 || cy !== 0) && ((cx === 3 && cy === -2) || townName.toLowerCase().includes('port') || townName.toLowerCase().includes('harbor'));
      hasDungeon = Boolean(existingChunk.dungeons && existingChunk.dungeons.length > 0);

      if (existingChunk.pois && existingChunk.pois.length > 0) {
        existingChunk.pois.forEach((poi: any) => {
          pois.push({
            id: poi.id || `poi_${cx}_${cy}_${pois.length}`,
            name: poi.name || poi.title || 'Point of Interest',
            type: poi.type || 'shrine',
            chunkX: cx,
            chunkY: cy,
            hasWaystone: poi.hasWaystone || poi.type === 'waystone' || poi.type === 'town',
            isAttunedWaystone: attunedWaystones.includes(poi.id) || (cx === 0 && cy === 0),
          });
        });
      }
    } else {
      // Procedural prediction
      hasTown = (cx === 0 && cy === 0) || hasTownAtChunk(cx, cy, mapPrng);
      townName = cx === 0 && cy === 0 ? 'Oakhaven Village' : (hasTown ? getDeterministicTownName(cx, cy, 8675309, mapPrng) : '');
      isCastleTown = isCastleTownAtChunk(cx, cy, mapPrng);
      isPortTown = (cx !== 0 || cy !== 0) && ((cx === 3 && cy === -2) || townName.toLowerCase().includes('port') || townName.toLowerCase().includes('harbor'));
      biome = hasTown ? 'town' : getOrganicBiome(cx, cy);
      hasDungeon = !hasTown && ((Math.abs(cx) * 3 + Math.abs(cy) * 7) % 6 === 2);
    }

    const hasHarbor = isPortTown;
    const hasWaystone = hasTown || ((Math.abs(cx * 3 + cy * 5) % 7 === 1) && !hasDungeon);
    const waystoneId = cx === 0 && cy === 0 ? 'waystone_0_0' : `waystone_${cx}_${cy}`;
    const isWaystoneAttuned = cx === 0 && cy === 0 ? true : (attunedWaystones.includes(waystoneId) || attunedWaystones.includes(`poi_waystone_${cx}_${cy}`));

    let regionName = 'Whispering Wilds';
    if (cx === 0 && cy === 0) regionName = 'Oakhaven Village [0, 0]';
    else if (hasTown) regionName = `${townName} [${cx}, ${cy}]`;
    else if (hasDungeon) regionName = `Catacombs of Ruin [${cx}, ${cy}]`;
    else if (biome === 'tundra') regionName = `Frozen Reaches [${cx}, ${cy}]`;
    else if (biome === 'desert') regionName = `Sunscorched Dunes [${cx}, ${cy}]`;
    else if (biome === 'swamp') regionName = `Mire Marshlands [${cx}, ${cy}]`;
    else if (biome === 'mountain') regionName = `Granite Peaks [${cx}, ${cy}]`;
    else if (biome === 'coral_reef') regionName = `Sunken Coral Shallows [${cx}, ${cy}]`;
    else if (biome === 'volcanic') regionName = `Obsidian Caldera [${cx}, ${cy}]`;
    else if (biome === 'glacial') regionName = `Glacial Ice Caverns [${cx}, ${cy}]`;
    else if (biome === 'forest') regionName = `Verdant Sunderwood [${cx}, ${cy}]`;

    if (hasTown && !pois.some(p => p.type === 'town' || p.type === 'harbor')) {
      pois.push({
        id: `town_${cx}_${cy}`,
        name: cx === 0 && cy === 0 ? 'Oakhaven Village' : townName || 'Sunder Hamlet',
        type: hasHarbor ? 'harbor' : 'town',
        chunkX: cx,
        chunkY: cy,
        hasWaystone: true,
        isAttunedWaystone: isWaystoneAttuned,
      });
    }

    if (hasDungeon && !pois.some(p => p.type === 'dungeon')) {
      pois.push({
        id: `dungeon_${cx}_${cy}`,
        name: `Dungeon Vault [Floor ${Math.abs(cx) + Math.abs(cy) + 1}]`,
        type: 'dungeon',
        chunkX: cx,
        chunkY: cy,
        threatTier: Math.min(5, Math.floor(Math.hypot(cx, cy) * 0.8) + 1),
      });
    }

    if (hasWaystone && !hasTown && !pois.some(p => p.hasWaystone)) {
      pois.push({
        id: waystoneId,
        name: `Leyline Obelisk [${cx}, ${cy}]`,
        type: 'shrine',
        chunkX: cx,
        chunkY: cy,
        hasWaystone: true,
        isAttunedWaystone: isWaystoneAttuned,
      });
    }

    const chunkPins = customPins.filter(p => p.chunkX === cx && p.chunkY === cy);
    const distance = Math.hypot(cx, cy);
    const threatTier = Math.min(5, Math.max(1, Math.floor(distance * 0.75) + 1));

    // Sector Traversal Index Calculation
    const isHighway = (cx % 4 === 0 || cy % 4 === 0) || hasTown;
    let baseSpeed = 80;
    let terrainName = 'Woodland Canopy';

    switch (biome) {
      case 'town':
        baseSpeed = 100;
        terrainName = 'Paved Cobblestones';
        break;
      case 'forest':
        baseSpeed = 85;
        terrainName = 'Woodland Foothills';
        break;
      case 'desert':
        baseSpeed = 65;
        terrainName = 'Shifting Sand Dunes';
        break;
      case 'tundra':
        baseSpeed = 60;
        terrainName = 'Frostbitten Taiga';
        break;
      case 'swamp':
        baseSpeed = 50;
        terrainName = 'Mire Bogs & Peat';
        break;
      case 'mountain':
        baseSpeed = 45;
        terrainName = 'Steep Granite Crags';
        break;
      case 'coral_reef':
        baseSpeed = 55;
        terrainName = 'Tidal Lagoons & Shallows';
        break;
      case 'volcanic':
        baseSpeed = 40;
        terrainName = 'Igneous Cinder & Slag';
        break;
      case 'glacial':
        baseSpeed = 35;
        terrainName = 'Slippery Glacier Ice';
        break;
      default:
        baseSpeed = 75;
        terrainName = 'Wilderness Foothills';
    }

    if (metrics.elevation > 0.7) {
      baseSpeed -= 15;
      terrainName += ' (High Altitude)';
    } else if (metrics.elevation < 0.3 && (biome === 'swamp' || biome === 'coral_reef')) {
      baseSpeed -= 10;
      terrainName += ' (Lowland Basin)';
    }

    if (isHighway) {
      baseSpeed += 25;
    }

    const speedPct = Math.min(125, Math.max(25, baseSpeed));
    let rating: 'Swift' | 'Standard' | 'Arduous' | 'Treacherous' = 'Standard';
    let ratingColor = 'text-yellow-400';

    if (speedPct >= 90) {
      rating = 'Swift';
      ratingColor = 'text-emerald-400';
    } else if (speedPct >= 70) {
      rating = 'Standard';
      ratingColor = 'text-amber-300';
    } else if (speedPct >= 45) {
      rating = 'Arduous';
      ratingColor = 'text-orange-400';
    } else {
      rating = 'Treacherous';
      ratingColor = 'text-rose-400';
    }

    const traversalIndex: TraversalIndex = {
      speedPct,
      rating,
      ratingColor,
      terrainModifier: isHighway ? `${terrainName} • Highway Expedited (+25%)` : terrainName,
      hasHighway: isHighway,
    };

    const result: ChunkMapInfo = {
      chunkX: cx,
      chunkY: cy,
      biome,
      hasTown,
      hasDungeon,
      hasHarbor,
      isCastleTown,
      hasWaystone,
      isWaystoneAttuned,
      waystoneId,
      waystoneName: hasTown ? `${townName || 'Town'} Waystone` : `Leyline Obelisk [${cx}, ${cy}]`,
      isDiscovered,
      threatTier,
      elevation: metrics.elevation,
      moisture: metrics.moisture,
      traversalIndex,
      pois,
      regionName,
      customPins: chunkPins,
    };

    chunkDataCacheRef.current.set(key, result);
    return result;
  }, [safeDiscoveredSet, overworldChunks, currentChunkX, currentChunkY, customPins, attunedWaystones]);

  // Viewport Sub-Hook: Coordinates, Pan, Drag, Inertia, Pinch-to-Zoom, and Projection
  const {
    containerRef,
    canvasRef,
    dynamicCanvasRef,
    panOffset,
    pulseAnim,
    showMobileNav,
    setShowMobileNav,
    chunkSize,
    smoothPanBy,
    centerOnChunk,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleDoubleClick,
    handleContextMenu,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useWorldMapViewport({
    currentChunkX,
    currentChunkY,
    zoomLevel,
    setZoomLevel,
    recenterTrigger,
    realmBounds,
    getChunkData,
    onHoverChunk,
    onSelectChunk,
    onRightClickChunk,
  });

  // Calculate visible chunk bounds within viewport
  const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;

  // Main Canvas Render Loop (Terrain, Roads, Borders, Static POIs, HUD)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep rich antique nautical cartography background
    renderWorldMapBackground(ctx, width, height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    const visibleMinX = Math.max(renderMinX, Math.floor((-panOffset.x - 100) / chunkSize));
    const visibleMaxX = Math.min(renderMaxX, Math.ceil((width - panOffset.x + 100) / chunkSize));
    const visibleMinY = Math.max(renderMinY, Math.floor((-panOffset.y - 100) / chunkSize));
    const visibleMaxY = Math.min(renderMaxY, Math.ceil((height - panOffset.y + 100) / chunkSize));

    // First Pass: Render All Visible Chunk Terrains (Micro-Tile Maps and Fog)
    renderWorldMapTerrain({
      ctx,
      visibleMinX,
      visibleMaxX,
      visibleMinY,
      visibleMaxY,
      chunkSize,
      zoomLevel,
      getChunkData,
      overworldChunks,
      filters,
    });

    // Second Pass: Render High-Visibility Markers & Icons On Top of Tiles
    renderWorldMapStaticPins({
      ctx,
      visibleMinX,
      visibleMaxX,
      visibleMinY,
      visibleMaxY,
      chunkSize,
      zoomLevel,
      getChunkData,
      filters,
      currentChunkX,
      currentChunkY,
      isOverworld,
      dungeonLevel,
      pulseAnim,
    });

    ctx.restore();

    // HUD: Render Nautical Compass Rose & Scale Bar
    renderWorldMapHud(ctx, width, height, chunkSize);

    ctx.restore();
  }, [
    canvasRef,
    panOffset,
    chunkSize,
    zoomLevel,
    currentChunkX,
    currentChunkY,
    filters,
    getChunkData,
    realmBounds,
    overworldChunks,
    isOverworld,
    dungeonLevel,
    pulseAnim,
    renderMinX,
    renderMaxX,
    renderMinY,
    renderMaxY,
  ]);

  const visibleMinX = Math.max(renderMinX, Math.floor((-panOffset.x - 100) / chunkSize));
  const visibleMaxX = Math.min(renderMaxX, Math.ceil(((containerRef.current?.clientWidth || 800) - panOffset.x + 100) / chunkSize));
  const visibleMinY = Math.max(renderMinY, Math.floor((-panOffset.y - 100) / chunkSize));
  const visibleMaxY = Math.min(renderMaxY, Math.ceil(((containerRef.current?.clientHeight || 500) - panOffset.y + 100) / chunkSize));

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[450px] md:h-[540px] bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Layer 1: Static Terrain, Roads & High-Visibility POI Markers */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />

      {/* Layer 2: Dynamic Animated FX (Hero Beacon Pulse & Leyline Auras & Selected Chunk Reticle) */}
      <WorldMapPinsOverlay
        dynamicCanvasRef={dynamicCanvasRef}
        panOffset={panOffset}
        visibleMinX={visibleMinX}
        visibleMaxX={visibleMaxX}
        visibleMinY={visibleMinY}
        visibleMaxY={visibleMaxY}
        chunkSize={chunkSize}
        zoomLevel={zoomLevel}
        getChunkData={getChunkData}
        filters={filters}
        currentChunkX={currentChunkX}
        currentChunkY={currentChunkY}
        selectedChunkCoord={selectedChunkCoord}
        pulseAnim={pulseAnim}
      />

      {/* Floating Mobile Navigator & Precision Controls (Top-Right) */}
      <WorldMapControls
        showMobileNav={showMobileNav}
        setShowMobileNav={setShowMobileNav}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        chunkSize={chunkSize}
        currentChunkX={currentChunkX}
        currentChunkY={currentChunkY}
        smoothPanBy={smoothPanBy}
        centerOnChunk={centerOnChunk}
      />
    </div>
  );
};
