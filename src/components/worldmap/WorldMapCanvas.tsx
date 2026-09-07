import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ChunkMapInfo, WorldMapFilterState, CustomMapPin, TraversalIndex } from './types';
import { getContinuousTerrainMetrics } from '../../world/organic/biomeNoiseEngine';
import { getOrganicBiome } from '../../world/overworldBiomes';
import { hasTownAtChunk, getDeterministicTownName, isCastleTownAtChunk } from '../../world/overworldStructures';
import { OverworldChunk } from '../../types';
import { getOrCreateChunkCanvas, getOrCreateChunkMacroCanvas } from './chunkTileRasterizer';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Home,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface WorldMapCanvasProps {
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
  onRightClickChunk
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dynamicCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan offset in canvas coordinates
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pulseAnim, setPulseAnim] = useState<number>(0);
  const [showMobileNav, setShowMobileNav] = useState<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);
  const hoveredChunkRef = useRef<ChunkMapInfo | null>(null);

  // Animation and momentum frame tracker
  const inertiaRafRef = useRef<number | null>(null);

  // Touch tracking references
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    velocityX: number;
    velocityY: number;
    initialDistance: number;
    initialZoom: number;
    startTime: number;
    hasMoved: boolean;
  } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopInertia = useCallback(() => {
    if (inertiaRafRef.current) {
      cancelAnimationFrame(inertiaRafRef.current);
      inertiaRafRef.current = null;
    }
  }, []);

  // Dynamic Base Chunk Size scaled by zoom
  const baseChunkSize = 88; // Base pixel dimensions per chunk on map
  const chunkSize = baseChunkSize * zoomLevel;

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

    // Provide dynamic margin frontier
    const buffer = 4;
    const renderMinX = Math.min(-8, minX - buffer);
    const renderMaxX = Math.max(8, maxX + buffer);
    const renderMinY = Math.min(-8, minY - buffer);
    const renderMaxY = Math.max(8, maxY + buffer);

    return {
      minX, maxX, minY, maxY,
      renderMinX, renderMaxX, renderMinY, renderMaxY
    };
  }, [safeDiscoveredSet, overworldChunks, currentChunkX, currentChunkY]);

  // Center pan on player
  const centerOnPlayer = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setPanOffset({
        x: centerX - currentChunkX * chunkSize - chunkSize / 2,
        y: centerY - currentChunkY * chunkSize - chunkSize / 2
      });
    }
  }, [currentChunkX, currentChunkY, chunkSize]);

  useEffect(() => {
    centerOnPlayer();
  }, [recenterTrigger]);

  // Initial center on mount
  useEffect(() => {
    centerOnPlayer();
  }, []);

  // Animation ticker for glowing hero ring & leyline waystones (throttled to 30fps when map is active)
  useEffect(() => {
    let animId: number;
    let start = performance.now();
    let lastTick = 0;
    const loop = (now: number) => {
      if (now - lastTick >= 33) {
        setPulseAnim((now - start) / 1000);
        lastTick = now;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

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
    let dungeonsCount = 0;
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
      dungeonsCount = existingChunk.dungeons?.length || 0;

      if (existingChunk.pois && existingChunk.pois.length > 0) {
        existingChunk.pois.forEach((poi: any) => {
          pois.push({
            id: poi.id || `poi_${cx}_${cy}_${pois.length}`,
            name: poi.name || poi.title || 'Point of Interest',
            type: poi.type || 'shrine',
            chunkX: cx,
            chunkY: cy,
            hasWaystone: poi.hasWaystone || poi.type === 'waystone' || poi.type === 'town',
            isAttunedWaystone: attunedWaystones.includes(poi.id) || (cx === 0 && cy === 0)
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

    // Ensure town and dungeon are in POIs list
    if (hasTown && !pois.some(p => p.type === 'town' || p.type === 'harbor')) {
      pois.push({
        id: `town_${cx}_${cy}`,
        name: cx === 0 && cy === 0 ? 'Oakhaven Village' : townName || 'Sunder Hamlet',
        type: hasHarbor ? 'harbor' : 'town',
        chunkX: cx,
        chunkY: cy,
        hasWaystone: true,
        isAttunedWaystone: isWaystoneAttuned
      });
    }

    if (hasDungeon && !pois.some(p => p.type === 'dungeon')) {
      pois.push({
        id: `dungeon_${cx}_${cy}`,
        name: `Dungeon Vault [Floor ${Math.abs(cx) + Math.abs(cy) + 1}]`,
        type: 'dungeon',
        chunkX: cx,
        chunkY: cy,
        threatTier: Math.min(5, Math.floor(Math.hypot(cx, cy) * 0.8) + 1)
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
        isAttunedWaystone: isWaystoneAttuned
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
      hasHighway: isHighway
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
      customPins: chunkPins
    };

    chunkDataCacheRef.current.set(key, result);
    return result;
  }, [safeDiscoveredSet, overworldChunks, currentChunkX, currentChunkY, customPins, attunedWaystones]);

  // Main Render Loop for Canvas
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
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;

    // Strict frustum bounding box derived directly from viewport dimensions + 1 chunk safety buffer
    const visibleMinX = Math.max(renderMinX, Math.floor((-panOffset.x - 100) / chunkSize));
    const visibleMaxX = Math.min(renderMaxX, Math.ceil((width - panOffset.x + 100) / chunkSize));
    const visibleMinY = Math.max(renderMinY, Math.floor((-panOffset.y - 100) / chunkSize));
    const visibleMaxY = Math.min(renderMaxY, Math.ceil((height - panOffset.y + 100) / chunkSize));

    // First Pass: Render All Visible Chunk Terrains (Micro-Tile Maps and Fog)
    for (let cy = visibleMinY; cy <= visibleMaxY; cy++) {
      for (let cx = visibleMinX; cx <= visibleMaxX; cx++) {
        const x = cx * chunkSize;
        const y = cy * chunkSize;

        const info = getChunkData(cx, cy);
        const key = `${cx},${cy}`;
        const existingChunk = overworldChunks[key];

        if (!info.isDiscovered) {
          // Unexplored Fog of War Parchment with organic burnt edge effect
          ctx.fillStyle = '#060a12';
          ctx.fillRect(x, y, chunkSize, chunkSize);

          // Subtle antique cartographic contour stipples & parchment grain
          ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
          ctx.beginPath();
          ctx.arc(x + chunkSize * 0.28, y + chunkSize * 0.35, chunkSize * 0.18, 0, Math.PI * 2);
          ctx.arc(x + chunkSize * 0.72, y + chunkSize * 0.65, chunkSize * 0.22, 0, Math.PI * 2);
          ctx.fill();

          // Organic burnt edge perimeter border
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, chunkSize, chunkSize);

          // Uncharted coordinate watermark
          if (zoomLevel >= 1.0) {
            ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`? [${cx},${cy}]`, x + chunkSize / 2, y + chunkSize / 2);
          }

          // Custom pins in uncharted land
          if (filters.showCustomPins && info.customPins && info.customPins.length > 0) {
            const pin = info.customPins[0];
            ctx.fillStyle = pin.color || '#f59e0b';
            ctx.beginPath();
            ctx.arc(x + chunkSize / 2, y + chunkSize / 2, 3.5 * zoomLevel, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          continue;
        }

        // DISCOVERED CHUNK: High-Fidelity Micro-Tile vs LOD Macro Surface Map Rendering
        try {
          const chunkCanvas =
            zoomLevel < 0.75
              ? getOrCreateChunkMacroCanvas(cx, cy, existingChunk, info.biome)
              : getOrCreateChunkCanvas(cx, cy, existingChunk, info.biome);
          
          if (chunkCanvas && (chunkCanvas as HTMLCanvasElement).width > 0) {
            // Draw the raster map with integer pixel alignment
            ctx.imageSmoothingEnabled = zoomLevel < 0.75;
            ctx.drawImage(chunkCanvas, Math.round(x), Math.round(y), Math.round(chunkSize), Math.round(chunkSize));
          } else {
            ctx.fillStyle = info.biome === 'desert' ? '#ca8a04' : (info.biome === 'tundra' ? '#0f766e' : '#15803d');
            ctx.fillRect(Math.round(x), Math.round(y), Math.round(chunkSize), Math.round(chunkSize));
          }
        } catch {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(Math.round(x), Math.round(y), Math.round(chunkSize), Math.round(chunkSize));
        }

        // Elegant cartographic parchment border (only when moderately zoomed in)
        if (zoomLevel >= 0.6) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, chunkSize, chunkSize);
        }

        // Draw Trade Caravan Highway overlay if enabled
        if (filters.showCaravanRoutes) {
          const isMainHighwayX = cx % 4 === 0;
          const isMainHighwayY = cy % 4 === 0;

          if (isMainHighwayX || isMainHighwayY) {
            // Outer casing / atmospheric glow
            ctx.strokeStyle = 'rgba(180, 83, 9, 0.45)';
            ctx.lineWidth = Math.max(3, 4 * zoomLevel);
            ctx.beginPath();
            if (isMainHighwayX) {
              ctx.moveTo(x + chunkSize / 2, y);
              ctx.lineTo(x + chunkSize / 2, y + chunkSize);
            }
            if (isMainHighwayY) {
              ctx.moveTo(x, y + chunkSize / 2);
              ctx.lineTo(x + chunkSize, y + chunkSize / 2);
            }
            ctx.stroke();

            // Inner golden arterial trade highway line
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
            ctx.lineWidth = Math.max(1.5, 2 * zoomLevel);
            ctx.setLineDash([5 * zoomLevel, 3 * zoomLevel]);
            ctx.beginPath();
            if (isMainHighwayX) {
              ctx.moveTo(x + chunkSize / 2, y);
              ctx.lineTo(x + chunkSize / 2, y + chunkSize);
            }
            if (isMainHighwayY) {
              ctx.moveTo(x, y + chunkSize / 2);
              ctx.lineTo(x + chunkSize, y + chunkSize / 2);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Crossroads junction diamond on highway intersections
            if (isMainHighwayX && isMainHighwayY) {
              const jX = x + chunkSize / 2;
              const jY = y + chunkSize / 2;
              const r = Math.max(3, 4.5 * zoomLevel);

              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.moveTo(jX, jY - r);
              ctx.lineTo(jX + r, jY);
              ctx.lineTo(jX, jY + r);
              ctx.lineTo(jX - r, jY);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#fef08a';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }

        // Coordinate Label
        if (zoomLevel >= 0.8) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(`[${cx},${cy}]`, x + 3, y + 3);
        }
      }
    }

    // Second Pass: Render High-Visibility Markers & Icons On Top of Tiles
    for (let cy = visibleMinY; cy <= visibleMaxY; cy++) {
      for (let cx = visibleMinX; cx <= visibleMaxX; cx++) {
        const x = cx * chunkSize;
        const y = cy * chunkSize;

        const info = getChunkData(cx, cy);
        if (!info.isDiscovered) continue;

        // Render Settlement / Town Landmark
        if (filters.showTowns && info.hasTown) {
          const centerX = x + chunkSize / 2;
          const centerY = y + chunkSize * 0.44;

          // Plaque background badge
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(5, 7.5 * zoomLevel), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Icon: Harbor (⛵), Castle Stronghold (🏰), or Open Village/Hamlet (🏡)
          if (zoomLevel >= 0.6) {
            ctx.font = `${Math.max(8, Math.round(chunkSize * 0.14))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const townIcon = info.hasHarbor ? '⛵' : (info.isCastleTown ? '🏰' : '🏡');
            ctx.fillText(townIcon, centerX, centerY);
          } else {
            // Simplified gold pip at macro zoom
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Town Name Banner if Zoomed In
          if (zoomLevel >= 0.8) {
            const label = cx === 0 && cy === 0 ? 'Oakhaven Village' : info.regionName.split(' [')[0];
            ctx.font = 'bold 7.5px sans-serif';
            const metrics = ctx.measureText(label);
            const badgeW = metrics.width + 8;
            const badgeH = 11;
            const badgeY = y + chunkSize - 13;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.fillRect(centerX - badgeW / 2, badgeY, badgeW, badgeH);
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(centerX - badgeW / 2, badgeY, badgeW, badgeH);

            ctx.fillStyle = '#fef08a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, centerX, badgeY + badgeH / 2);
          }
        }
        // Render Dungeon Landmark
        else if (filters.showDungeons && info.hasDungeon) {
          const centerX = x + chunkSize / 2;
          const centerY = y + chunkSize * 0.44;

          ctx.fillStyle = 'rgba(24, 9, 39, 0.85)';
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(5, 7 * zoomLevel), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1;
          ctx.stroke();

          if (zoomLevel >= 0.6) {
            ctx.font = `${Math.max(7, Math.round(chunkSize * 0.13))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚔️', centerX, centerY);
          } else {
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          if (zoomLevel >= 0.9) {
            ctx.fillStyle = '#e9d5ff';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`Vault T${info.threatTier}`, centerX, y + chunkSize - 3);
          }
        }
        // Render Waystone Landmark
        else if (filters.showWaystones && info.hasWaystone) {
          const centerX = x + chunkSize / 2;
          const centerY = y + chunkSize * 0.44;

          if (info.isWaystoneAttuned) {
            // Animated pulsing Leyline aura (only when zoomed in enough)
            if (zoomLevel >= 0.75) {
              const waystonePulse = (4 + (pulseAnim * 5) % 6) * zoomLevel;
              const waystoneAlpha = Math.max(0, 0.8 - (waystonePulse / (10 * zoomLevel)));
              ctx.strokeStyle = `rgba(56, 189, 248, ${waystoneAlpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(centerX, centerY, waystonePulse, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Attuned runic core
            ctx.fillStyle = 'rgba(12, 74, 110, 0.85)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, Math.max(5, 7 * zoomLevel), 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.stroke();

            if (zoomLevel >= 0.6) {
              ctx.font = `${Math.max(7, Math.round(chunkSize * 0.13))}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('🌀', centerX, centerY);
            } else {
              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Dormant Obelisk
            ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, Math.max(4.5, 6 * zoomLevel), 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1;
            ctx.stroke();

            if (zoomLevel >= 0.6) {
              ctx.font = `${Math.max(6, Math.round(chunkSize * 0.11))}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('⚪', centerX, centerY);
            } else {
              ctx.fillStyle = '#94a3b8';
              ctx.beginPath();
              ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Render Custom Player Map Pins
        if (filters.showCustomPins && info.customPins && info.customPins.length > 0) {
          const pin = info.customPins[0];
          const pinX = x + chunkSize * 0.84;
          const pinY = y + chunkSize * 0.18;

          ctx.fillStyle = pin.color || '#f59e0b';
          ctx.beginPath();
          ctx.arc(pinX, pinY, Math.max(3, 4 * zoomLevel), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          if (zoomLevel >= 0.7) {
            const pinIconMap: Record<string, string> = {
              star: '⭐',
              sword: '⚔️',
              shield: '🛡️',
              mine: '⛏️',
              gem: '💎',
              danger: '💀',
              camp: '🏕️',
              loot: '📦',
              herb: '🌿',
              portal: '🌀'
            };
            const iconEmoji = pinIconMap[pin.icon] || '⭐';

            // Icon emoji centered inside pin
            ctx.font = `${Math.max(5, Math.round(5.5 * zoomLevel))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iconEmoji, pinX, pinY);
          }

          // Mini label if zoomed in
          if (zoomLevel >= 0.95) {
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(pin.label.slice(0, 12), x + chunkSize / 2, y + chunkSize - 3);
          }
        }

        // HERO MARKER: Static Base Dot (Dynamic pulses drawn on overlay canvas)
        if (cx === currentChunkX && cy === currentChunkY) {
          // Highlight border around hero chunk
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 1, y + 1, chunkSize - 2, chunkSize - 2);

          const heroX = x + chunkSize / 2;
          const heroY = y + chunkSize / 2;

          // Golden Beacon Center Core
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(heroX, heroY, 4 * zoomLevel, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Hero Reticle Crosshair
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(heroX - 6 * zoomLevel, heroY);
          ctx.lineTo(heroX + 6 * zoomLevel, heroY);
          ctx.moveTo(heroX, heroY - 6 * zoomLevel);
          ctx.lineTo(heroX, heroY + 6 * zoomLevel);
          ctx.stroke();

          if (zoomLevel >= 0.85) {
            ctx.fillStyle = isOverworld ? '#fbbf24' : '#c084fc';
            ctx.font = '900 7.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const heroLabel = !isOverworld && dungeonLevel > 0 ? `HERO (D${dungeonLevel})` : 'HERO';
            ctx.fillText(heroLabel, heroX, y + chunkSize - 3);
          }
        }
      }
    }

    ctx.restore();

    // HUD: Render Nautical Compass Rose & Scale Bar in bottom right
    const compassX = width - 48;
    const compassY = height - 48;

    ctx.save();
    ctx.translate(compassX, compassY);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // North arrow
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(5, -4);
    ctx.lineTo(-5, -4);
    ctx.closePath();
    ctx.fill();

    // South arrow
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(5, 4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -10);
    ctx.restore();

    // Scale Bar
    const scaleBarW = chunkSize;
    const scaleBarX = 14;
    const scaleBarY = height - 16;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(scaleBarX - 4, scaleBarY - 14, scaleBarW + 8, 20);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(scaleBarX, scaleBarY);
    ctx.lineTo(scaleBarX + scaleBarW, scaleBarY);
    ctx.moveTo(scaleBarX, scaleBarY - 4);
    ctx.lineTo(scaleBarX, scaleBarY + 4);
    ctx.moveTo(scaleBarX + scaleBarW, scaleBarY - 4);
    ctx.lineTo(scaleBarX + scaleBarW, scaleBarY + 4);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1 Sector (64x40)', scaleBarX + scaleBarW / 2, scaleBarY - 6);

    ctx.restore();
  }, [panOffset, chunkSize, zoomLevel, safeDiscoveredSet, currentChunkX, currentChunkY, filters, getChunkData, realmBounds, overworldChunks, isOverworld, dungeonLevel]);

  // Dynamic Layer Loop: Hero Beacon Pulse & Animated Leylines (Runs on dynamic top canvas)
  useEffect(() => {
    const canvas = dynamicCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;
    const visibleMinX = Math.max(renderMinX, Math.floor((-panOffset.x - 100) / chunkSize));
    const visibleMaxX = Math.min(renderMaxX, Math.ceil((width - panOffset.x + 100) / chunkSize));
    const visibleMinY = Math.max(renderMinY, Math.floor((-panOffset.y - 100) / chunkSize));
    const visibleMaxY = Math.min(renderMaxY, Math.ceil((height - panOffset.y + 100) / chunkSize));

    // Render animated leyline waystone pulses (only when zoomed in)
    if (filters.showWaystones && zoomLevel >= 0.75) {
      for (let cy = visibleMinY; cy <= visibleMaxY; cy++) {
        for (let cx = visibleMinX; cx <= visibleMaxX; cx++) {
          const info = getChunkData(cx, cy);
          if (info.isDiscovered && info.hasWaystone && info.isWaystoneAttuned) {
            const x = cx * chunkSize;
            const y = cy * chunkSize;
            const centerX = x + chunkSize * 0.22;
            const centerY = y + chunkSize * 0.44;
            const waystonePulse = (4 + (pulseAnim * 5) % 6) * zoomLevel;
            const waystoneAlpha = Math.max(0, 0.8 - (waystonePulse / (10 * zoomLevel)));
            ctx.strokeStyle = `rgba(56, 189, 248, ${waystoneAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, waystonePulse, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }

    // Render Hero Beacon Expanding Wave
    if (currentChunkX >= visibleMinX && currentChunkX <= visibleMaxX && currentChunkY >= visibleMinY && currentChunkY <= visibleMaxY) {
      const x = currentChunkX * chunkSize;
      const y = currentChunkY * chunkSize;
      const heroX = x + chunkSize / 2;
      const heroY = y + chunkSize / 2;

      // Animated pulse wave expanding outward
      const pulseRadius = (5 + (pulseAnim * 6) % 8) * zoomLevel;
      const pulseAlpha = Math.max(0, 1 - (pulseRadius / (14 * zoomLevel)));
      ctx.strokeStyle = `rgba(251, 191, 36, ${pulseAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(heroX, heroY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render Selected Chunk Reticle Frame
    if (selectedChunkCoord) {
      const { x: selX, y: selY } = selectedChunkCoord;
      if (selX >= visibleMinX && selX <= visibleMaxX && selY >= visibleMinY && selY <= visibleMaxY) {
        const x = selX * chunkSize;
        const y = selY * chunkSize;
        const cornerLen = Math.max(10, Math.min(22, 16 * zoomLevel));
        const pad = 2;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = Math.max(1.8, 2.4 * zoomLevel);
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(x - pad, y - pad + cornerLen);
        ctx.lineTo(x - pad, y - pad);
        ctx.lineTo(x - pad + cornerLen, y - pad);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + chunkSize + pad - cornerLen, y - pad);
        ctx.lineTo(x + chunkSize + pad, y - pad);
        ctx.lineTo(x + chunkSize + pad, y - pad + cornerLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x - pad, y + chunkSize + pad - cornerLen);
        ctx.lineTo(x - pad, y + chunkSize + pad);
        ctx.lineTo(x - pad + cornerLen, y + chunkSize + pad);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + chunkSize + pad - cornerLen, y + chunkSize + pad);
        ctx.lineTo(x + chunkSize + pad, y + chunkSize + pad);
        ctx.lineTo(x + chunkSize + pad, y + chunkSize + pad - cornerLen);
        ctx.stroke();

        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
    ctx.restore();
  }, [panOffset, chunkSize, zoomLevel, currentChunkX, currentChunkY, filters, pulseAnim, realmBounds, getChunkData, selectedChunkCoord]);

  // Smooth Pan Animation Helpers
  const smoothPanBy = useCallback((deltaX: number, deltaY: number) => {
    stopInertia();
    const startX = panOffset.x;
    const startY = panOffset.y;
    const targetX = startX + deltaX;
    const targetY = startY + deltaY;
    const startTime = performance.now();
    const duration = 240;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setPanOffset({
        x: startX + (targetX - startX) * ease,
        y: startY + (targetY - startY) * ease
      });
      if (progress < 1) {
        inertiaRafRef.current = requestAnimationFrame(animate);
      } else {
        inertiaRafRef.current = null;
      }
    };
    inertiaRafRef.current = requestAnimationFrame(animate);
  }, [panOffset.x, panOffset.y, stopInertia]);

  const centerOnChunk = useCallback((cx: number, cy: number) => {
    if (!containerRef.current) return;
    stopInertia();
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const targetX = w / 2 - (cx * chunkSize + chunkSize / 2);
    const targetY = h / 2 - (cy * chunkSize + chunkSize / 2);

    const startX = panOffset.x;
    const startY = panOffset.y;
    const startTime = performance.now();
    const duration = 260;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setPanOffset({
        x: startX + (targetX - startX) * ease,
        y: startY + (targetY - startY) * ease
      });
      if (progress < 1) {
        inertiaRafRef.current = requestAnimationFrame(animate);
      } else {
        inertiaRafRef.current = null;
      }
    };
    inertiaRafRef.current = requestAnimationFrame(animate);
  }, [chunkSize, panOffset.x, panOffset.y, stopInertia]);

  // Handle Drag & Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    stopInertia();
    if (e.button === 0 || e.button === 1) { // Left or middle click
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dist = Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y);
      if (dist > 4) {
        hasDraggedRef.current = true;
      }
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // Hover chunk evaluation (Desktop mouse only)
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - panOffset.x;
      const mouseY = e.clientY - rect.top - panOffset.y;

      const cx = Math.floor(mouseX / chunkSize);
      const cy = Math.floor(mouseY / chunkSize);

      const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;
      if (cx >= renderMinX && cx <= renderMaxX && cy >= renderMinY && cy <= renderMaxY) {
        onHoverChunk(getChunkData(cx, cy));
      } else {
        onHoverChunk(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // If the user was dragging the map, ignore the click
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - panOffset.x;
      const mouseY = e.clientY - rect.top - panOffset.y;

      const cx = Math.floor(mouseX / chunkSize);
      const cy = Math.floor(mouseY / chunkSize);

      const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;
      if (cx >= renderMinX && cx <= renderMaxX && cy >= renderMinY && cy <= renderMaxY) {
        const chunkData = getChunkData(cx, cy);
        onSelectChunk(chunkData);
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!setZoomLevel || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const targetZoom = zoomLevel >= 2.8 ? 0.8 : Math.min(3.5, Math.round((zoomLevel + 0.5) * 10) / 10);
    const scaleFactor = targetZoom / zoomLevel;
    const newPanX = mouseX - (mouseX - panOffset.x) * scaleFactor;
    const newPanY = mouseY - (mouseY - panOffset.y) * scaleFactor;

    setPanOffset({ x: newPanX, y: newPanY });
    setZoomLevel(targetZoom);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (canvasRef.current && onRightClickChunk) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - panOffset.x;
      const mouseY = e.clientY - rect.top - panOffset.y;

      const cx = Math.floor(mouseX / chunkSize);
      const cy = Math.floor(mouseY / chunkSize);

      const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;
      if (cx >= renderMinX && cx <= renderMaxX && cy >= renderMinY && cy <= renderMaxY) {
        onRightClickChunk(cx, cy);
      }
    }
  };

  // Wheel Zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!setZoomLevel || !containerRef.current) return;

    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    const newZoom = Math.min(3.5, Math.max(0.4, Math.round((zoomLevel + delta) * 100) / 100));

    if (newZoom !== zoomLevel) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust panOffset so point under mouse stays stationary
      const scaleFactor = newZoom / zoomLevel;
      const newPanX = mouseX - (mouseX - panOffset.x) * scaleFactor;
      const newPanY = mouseY - (mouseY - panOffset.y) * scaleFactor;

      setPanOffset({ x: newPanX, y: newPanY });
      setZoomLevel(newZoom);
    }
  };

  // Touch Gesture Handling: Pan, Tap-Select, Long-Press Pin, Pinch-to-Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    stopInertia();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = performance.now();
      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        lastX: touch.clientX,
        lastY: touch.clientY,
        lastTime: now,
        velocityX: 0,
        velocityY: 0,
        initialDistance: 0,
        initialZoom: zoomLevel,
        startTime: now,
        hasMoved: false
      };

      // Set long press timer for custom pin creation (500ms hold)
      if (onRightClickChunk && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const touchX = touch.clientX - rect.left - panOffset.x;
        const touchY = touch.clientY - rect.top - panOffset.y;
        const cx = Math.floor(touchX / chunkSize);
        const cy = Math.floor(touchY / chunkSize);

        longPressTimerRef.current = setTimeout(() => {
          if (touchStateRef.current && !touchStateRef.current.hasMoved) {
            onRightClickChunk(cx, cy);
          }
        }, 500);
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const now = performance.now();
      touchStateRef.current = {
        startX: (t1.clientX + t2.clientX) / 2,
        startY: (t1.clientY + t2.clientY) / 2,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        lastX: (t1.clientX + t2.clientX) / 2,
        lastY: (t1.clientY + t2.clientY) / 2,
        lastTime: now,
        velocityX: 0,
        velocityY: 0,
        initialDistance: dist,
        initialZoom: zoomLevel,
        startTime: now,
        hasMoved: true
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStateRef.current) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = performance.now();
      const dx = touch.clientX - touchStateRef.current.startX;
      const dy = touch.clientY - touchStateRef.current.startY;

      // Track movement threshold
      if (Math.hypot(dx, dy) > 6) {
        if (!touchStateRef.current.hasMoved) {
          touchStateRef.current.hasMoved = true;
          // Clear any hover tooltip immediately on touch drag so it doesn't get in the way
          onHoverChunk(null);
        }
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }

      // Calculate instantaneous touch velocity for momentum
      const dt = now - touchStateRef.current.lastTime;
      if (dt > 5) {
        const vx = (touch.clientX - touchStateRef.current.lastX) / dt;
        const vy = (touch.clientY - touchStateRef.current.lastY) / dt;
        touchStateRef.current.velocityX = touchStateRef.current.velocityX * 0.4 + vx * 0.6;
        touchStateRef.current.velocityY = touchStateRef.current.velocityY * 0.4 + vy * 0.6;
        touchStateRef.current.lastX = touch.clientX;
        touchStateRef.current.lastY = touch.clientY;
        touchStateRef.current.lastTime = now;
      }

      const newPanX = touchStateRef.current.startPanX + dx;
      const newPanY = touchStateRef.current.startPanY + dy;
      setPanOffset({ x: newPanX, y: newPanY });
      // NOTE: We deliberately do NOT call onHoverChunk here on mobile touch dragging
    } else if (e.touches.length === 2 && setZoomLevel && containerRef.current) {
      touchStateRef.current.hasMoved = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const initDist = touchStateRef.current.initialDistance;

      if (initDist > 0) {
        const scale = dist / initDist;
        const targetZoom = Math.min(3.5, Math.max(0.4, Math.round(touchStateRef.current.initialZoom * scale * 100) / 100));
        
        const rect = containerRef.current.getBoundingClientRect();
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

        const scaleFactor = targetZoom / zoomLevel;
        const newPanX = midX - (midX - panOffset.x) * scaleFactor;
        const newPanY = midY - (midY - panOffset.y) * scaleFactor;

        setPanOffset({ x: newPanX, y: newPanY });
        setZoomLevel(targetZoom);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (touchStateRef.current) {
      if (!touchStateRef.current.hasMoved && containerRef.current) {
        const duration = performance.now() - touchStateRef.current.startTime;
        if (duration < 350) {
          const rect = containerRef.current.getBoundingClientRect();
          const touchX = touchStateRef.current.startX - rect.left - panOffset.x;
          const touchY = touchStateRef.current.startY - rect.top - panOffset.y;
          const cx = Math.floor(touchX / chunkSize);
          const cy = Math.floor(touchY / chunkSize);

          const { renderMinX, renderMaxX, renderMinY, renderMaxY } = realmBounds;
          if (cx >= renderMinX && cx <= renderMaxX && cy >= renderMinY && cy <= renderMaxY) {
            const chunkData = getChunkData(cx, cy);
            onSelectChunk(chunkData);
          }
        }
      } else if (touchStateRef.current.hasMoved) {
        // Apply smooth inertia on release if velocity is noticeable
        const vx = touchStateRef.current.velocityX;
        const vy = touchStateRef.current.velocityY;
        const speed = Math.hypot(vx, vy);

        if (speed > 0.2) {
          let currentVx = vx * 12;
          let currentVy = vy * 12;
          let currentPanX = panOffset.x;
          let currentPanY = panOffset.y;

          const stepInertia = () => {
            currentVx *= 0.88;
            currentVy *= 0.88;
            currentPanX += currentVx;
            currentPanY += currentVy;
            setPanOffset({ x: currentPanX, y: currentPanY });

            if (Math.hypot(currentVx, currentVy) > 0.3) {
              inertiaRafRef.current = requestAnimationFrame(stepInertia);
            } else {
              inertiaRafRef.current = null;
            }
          };
          inertiaRafRef.current = requestAnimationFrame(stepInertia);
        }
      }
    }

    if (e.touches.length === 0) {
      touchStateRef.current = null;
    }
  };

  // Resize canvas to fill container with DPI scaling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current && dynamicCanvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;

        canvasRef.current.width = w * dpr;
        canvasRef.current.height = h * dpr;
        canvasRef.current.style.width = `${w}px`;
        canvasRef.current.style.height = `${h}px`;

        dynamicCanvasRef.current.width = w * dpr;
        dynamicCanvasRef.current.height = h * dpr;
        dynamicCanvasRef.current.style.width = `${w}px`;
        dynamicCanvasRef.current.style.height = `${h}px`;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      stopInertia();
    };
  }, [stopInertia]);

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
      <canvas ref={dynamicCanvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />

      {/* Floating Mobile Navigator & Precision Controls (Top-Right) */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10 select-none pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMobileNav(prev => !prev);
          }}
          className="p-1.5 sm:p-2 bg-slate-950/90 hover:bg-slate-900 active:scale-95 text-amber-400 border border-slate-800/90 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all"
          title={showMobileNav ? "Hide Map Controls" : "Show Map Controls"}
        >
          <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span className="text-[10px] sm:text-[11px] font-mono text-slate-200">
            {Math.round(zoomLevel * 100)}%
          </span>
          {showMobileNav ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
        </button>

        {showMobileNav && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col items-center gap-2 animate-fade-in"
          >
            {/* D-Pad Directional Controls */}
            <div className="grid grid-cols-3 gap-1 w-28 h-28 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div />
              <button
                onClick={() => smoothPanBy(0, chunkSize * 1.5)}
                className="w-full h-full bg-slate-800/90 hover:bg-amber-500/20 active:bg-amber-500/40 text-slate-200 hover:text-amber-300 rounded-lg flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
                title="Pan North"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div />

              <button
                onClick={() => smoothPanBy(chunkSize * 1.5, 0)}
                className="w-full h-full bg-slate-800/90 hover:bg-amber-500/20 active:bg-amber-500/40 text-slate-200 hover:text-amber-300 rounded-lg flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
                title="Pan West"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => centerOnChunk(currentChunkX, currentChunkY)}
                className="w-full h-full bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/50 text-amber-300 rounded-lg flex items-center justify-center font-bold transition-all active:scale-90 border border-amber-500/40 cursor-pointer"
                title="Center on Hero"
              >
                <Crosshair className="w-4 h-4" />
              </button>
              <button
                onClick={() => smoothPanBy(-chunkSize * 1.5, 0)}
                className="w-full h-full bg-slate-800/90 hover:bg-amber-500/20 active:bg-amber-500/40 text-slate-200 hover:text-amber-300 rounded-lg flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
                title="Pan East"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div />
              <button
                onClick={() => smoothPanBy(0, -chunkSize * 1.5)}
                className="w-full h-full bg-slate-800/90 hover:bg-amber-500/20 active:bg-amber-500/40 text-slate-200 hover:text-amber-300 rounded-lg flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer"
                title="Pan South"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <div />
            </div>

            {/* Quick Presets & Zoom Buttons */}
            <div className="flex items-center gap-1 w-full justify-between">
              <button
                onClick={() => centerOnChunk(0, 0)}
                className="flex-1 py-1 px-1 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-amber-300 border border-slate-800 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Center on Starting Town (Oakhaven [0,0])"
              >
                <Home className="w-3 h-3 text-amber-400" />
                <span>[0,0]</span>
              </button>

              {setZoomLevel && (
                <>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(3.5, Math.round((prev + 0.25) * 100) / 100))}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-sky-300 border border-slate-800 rounded-lg cursor-pointer transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.4, Math.round((prev - 0.25) * 100) / 100))}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-sky-300 border border-slate-800 rounded-lg cursor-pointer transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1.0)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-amber-300 border border-slate-800 rounded-lg cursor-pointer transition-colors"
                    title="Reset Zoom to 100%"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
