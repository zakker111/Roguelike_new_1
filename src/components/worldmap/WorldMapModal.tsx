import React, { useState, useMemo } from 'react';
import { WorldMapHeader } from './WorldMapHeader';
import { WorldMapCanvas } from './WorldMapCanvas';
import { WorldMapChunkTooltip } from './WorldMapChunkTooltip';
import { WorldMapLegend } from './WorldMapLegend';
import { CustomPinEditorModal } from './CustomPinEditorModal';
import { WorldMapPinsList } from './WorldMapPinsList';
import { ChunkMapInfo, WorldMapFilterState, CustomMapPin } from './types';
import { GameState, OverworldChunk } from '../../types';
import { getOrganicBiome } from '../../world/overworldBiomes';
import { asyncChunkBatcher } from '../../utils/overworld';

interface WorldMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onFastTravelToChunk?: (targetChunkX: number, targetChunkY: number, name?: string) => void;
  onAddPin?: (pin: CustomMapPin) => void;
  onUpdatePin?: (pin: CustomMapPin) => void;
  onDeletePin?: (pinId: string) => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onFastTravelToChunk,
  onAddPin,
  onUpdatePin,
  onDeletePin
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [hoveredChunk, setHoveredChunk] = useState<ChunkMapInfo | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<ChunkMapInfo | null>(null);
  const [showPinsLedger, setShowPinsLedger] = useState<boolean>(false);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

  // Custom Pin Editor state
  const [pinEditor, setPinEditor] = useState<{
    isOpen: boolean;
    chunkX: number;
    chunkY: number;
    existingPin: CustomMapPin | null;
  }>({
    isOpen: false,
    chunkX: 0,
    chunkY: 0,
    existingPin: null
  });

  const [filters, setFilters] = useState<WorldMapFilterState>({
    showTowns: true,
    showDungeons: true,
    showShrines: true,
    showCaravanRoutes: true,
    showWaystones: true,
    showCustomPins: true
  });

  if (!isOpen) return null;

  const currentChunkX = gameState.currentChunkX ?? 0;
  const currentChunkY = gameState.currentChunkY ?? 0;
  const customPins = gameState.customMapPins || [];
  const attunedWaystones = gameState.attunedWaystones || [];
  const overworldChunks = (gameState.overworldChunks || {}) as Record<string, OverworldChunk>;

  // Track discovered chunks from game state:
  // 1. Current chunk
  // 2. Starting capital chunk (0,0)
  // 3. All loaded/generated overworld chunks
  // 4. Any visited chunks explicitly logged in gameState.visitedChunks
  const discoveredSet = useMemo(() => {
    const set = new Set<string>();
    set.add(`${currentChunkX},${currentChunkY}`);
    set.add('0,0'); // Capital is always charted

    Object.keys(overworldChunks).forEach(k => set.add(k));

    if (gameState.visitedChunks) {
      if (Array.isArray(gameState.visitedChunks)) {
        gameState.visitedChunks.forEach((c: string) => set.add(c));
      } else if (gameState.visitedChunks instanceof Set) {
        gameState.visitedChunks.forEach((c: string) => set.add(c));
      } else if (typeof gameState.visitedChunks === 'object') {
        Object.keys(gameState.visitedChunks).forEach((c: string) => set.add(c));
      }
    }

    if (gameState.worldMapFullyRevealed) {
      for (let cx = -25; cx <= 25; cx++) {
        for (let cy = -25; cy <= 25; cy++) {
          set.add(`${cx},${cy}`);
        }
      }
    }

    // Proactively pre-cache surrounding chunks for fast rendering
    asyncChunkBatcher.pregenerateSurroundingChunks(currentChunkX, currentChunkY, 2);

    return set;
  }, [currentChunkX, currentChunkY, overworldChunks, gameState.visitedChunks, gameState.worldMapFullyRevealed]);

  const frontierStats = useMemo(() => {
    let minX = currentChunkX;
    let maxX = currentChunkX;
    let minY = currentChunkY;
    let maxY = currentChunkY;

    discoveredSet.forEach((k: string) => {
      const [x, y] = k.split(',').map(Number);
      if (!isNaN(x) && !isNaN(y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });

    return {
      frontierMinX: minX,
      frontierMaxX: maxX,
      frontierMinY: minY,
      frontierMaxY: maxY,
      totalTilesMapped: discoveredSet.size * 2560
    };
  }, [discoveredSet, currentChunkX, currentChunkY]);

  // Build full registry of known waystones
  const allWaystonesList = useMemo(() => {
    const waystonesMap = new Map<string, { id: string; name: string; chunkX: number; chunkY: number; isAttuned: boolean }>();

    // Oakhaven Village is always present & attuned
    waystonesMap.set('waystone_0_0', {
      id: 'waystone_0_0',
      name: 'Oakhaven Village',
      chunkX: 0,
      chunkY: 0,
      isAttuned: true
    });

    // Extract from overworld chunks
    Object.entries(overworldChunks).forEach(([k, chunk]) => {
      const [cx, cy] = k.split(',').map(Number);
      if (chunk.towns && chunk.towns.length > 0) {
        const id = `waystone_${cx}_${cy}`;
        const isAttuned = cx === 0 && cy === 0 ? true : (attunedWaystones.includes(id) || attunedWaystones.includes(`poi_waystone_${cx}_${cy}`));
        waystonesMap.set(id, {
          id,
          name: chunk.towns[0]?.name ? `${chunk.towns[0].name} Waystone` : `Town Waystone [${cx}, ${cy}]`,
          chunkX: cx,
          chunkY: cy,
          isAttuned
        });
      }
      if (chunk.pois) {
        chunk.pois.forEach((poi: any) => {
          if (poi.hasWaystone || poi.type === 'waystone' || poi.type === 'shrine') {
            const id = poi.id || `waystone_${cx}_${cy}`;
            const isAttuned = cx === 0 && cy === 0 ? true : (attunedWaystones.includes(id) || attunedWaystones.includes(`poi_waystone_${cx}_${cy}`));
            waystonesMap.set(id, {
              id,
              name: poi.name || `Leyline Obelisk [${cx}, ${cy}]`,
              chunkX: cx,
              chunkY: cy,
              isAttuned
            });
          }
        });
      }
    });

    // Include any other attuned waystones
    attunedWaystones.forEach(id => {
      if (!waystonesMap.has(id)) {
        const parts = id.split('_');
        const cx = parseInt(parts[parts.length - 2], 10) || 0;
        const cy = parseInt(parts[parts.length - 1], 10) || 0;
        waystonesMap.set(id, {
          id,
          name: `Attuned Waystone [${cx}, ${cy}]`,
          chunkX: cx,
          chunkY: cy,
          isAttuned: true
        });
      }
    });

    return Array.from(waystonesMap.values());
  }, [overworldChunks, attunedWaystones]);

  const activeInspectedChunk = hoveredChunk || selectedChunk;
  const isCurrentHeroChunk = activeInspectedChunk?.chunkX === currentChunkX && activeInspectedChunk?.chunkY === currentChunkY;

  // Handler to open pin editor
  const handleOpenPinEditor = (cx: number, cy: number, existingPin: CustomMapPin | null = null) => {
    setPinEditor({
      isOpen: true,
      chunkX: cx,
      chunkY: cy,
      existingPin
    });
  };

  // Handler to save pin
  const handleSavePin = (pin: CustomMapPin) => {
    if (pinEditor.existingPin && onUpdatePin) {
      onUpdatePin(pin);
    } else if (onAddPin) {
      onAddPin(pin);
    }
    setPinEditor({ isOpen: false, chunkX: 0, chunkY: 0, existingPin: null });
  };

  // Fast travel handler
  const handleFastTravel = (targetChunkX: number, targetChunkY: number, name?: string) => {
    if (onFastTravelToChunk) {
      onFastTravelToChunk(targetChunkX, targetChunkY, name);
      onClose();
    }
  };

  // Keyboard shortcut listener for desktop convenience
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If pin editor is open, let pin editor's handler manage it
      if (pinEditor.isOpen) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // If user is typing in an input field, ignore letter hotkeys
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        setZoomLevel(z => Math.min(3.5, Math.round((z + 0.2) * 10) / 10));
      } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        setZoomLevel(z => Math.max(0.4, Math.round((z - 0.2) * 10) / 10));
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setRecenterTrigger(c => c + 1);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setShowPinsLedger(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pinEditor.isOpen, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl bg-slate-950 border-2 border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh] ring-1 ring-amber-500/10">
        {/* Header Bar */}
        <WorldMapHeader
          currentChunkX={currentChunkX}
          currentChunkY={currentChunkY}
          hoveredChunk={activeInspectedChunk ? { x: activeInspectedChunk.chunkX, y: activeInspectedChunk.chunkY, name: activeInspectedChunk.regionName } : null}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          filters={filters}
          setFilters={setFilters}
          stats={{
            discoveredChunksCount: discoveredSet.size,
            attunedWaystonesCount: allWaystonesList.filter(w => w.isAttuned).length,
            totalWaystonesCount: allWaystonesList.length,
            discoveredTownsCount: Array.from(discoveredSet).filter((k: string) => Boolean(overworldChunks[k]?.towns && overworldChunks[k]?.towns!.length > 0)).length || 1,
            discoveredDungeonsCount: Array.from(discoveredSet).filter((k: string) => Boolean(overworldChunks[k]?.dungeons && overworldChunks[k]?.dungeons!.length > 0)).length || 0,
            customPinsCount: customPins.length,
            ...frontierStats
          }}
          isPinsListOpen={showPinsLedger}
          setIsPinsListOpen={setShowPinsLedger}
          onClose={onClose}
          onCenterOnPlayer={() => {
            setRecenterTrigger(c => c + 1);
          }}
        />

        {/* Map Canvas & Side Drawer */}
        <div className="relative flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          <div className="relative flex-1 min-h-[380px] md:min-h-[480px]">
            <WorldMapCanvas
              currentChunkX={currentChunkX}
              currentChunkY={currentChunkY}
              discoveredChunks={discoveredSet}
              overworldChunks={overworldChunks}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              filters={filters}
              customPins={customPins}
              attunedWaystones={attunedWaystones}
              recenterTrigger={recenterTrigger}
              isOverworld={gameState.isOverworld}
              dungeonLevel={gameState.dungeonLevel}
              selectedChunkCoord={activeInspectedChunk ? { x: activeInspectedChunk.chunkX, y: activeInspectedChunk.chunkY } : null}
              onHoverChunk={setHoveredChunk}
              onSelectChunk={setSelectedChunk}
              onRightClickChunk={(cx, cy) => {
                const existing = customPins.find(p => p.chunkX === cx && p.chunkY === cy) || null;
                handleOpenPinEditor(cx, cy, existing);
              }}
            />

            {/* Floating Chunk Tooltip Inspector */}
            {activeInspectedChunk && (
              <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-auto sm:max-w-md pointer-events-auto z-20 animate-fade-in">
                <WorldMapChunkTooltip
                  chunk={activeInspectedChunk}
                  isCurrentHeroChunk={isCurrentHeroChunk}
                  currentChunkX={currentChunkX}
                  currentChunkY={currentChunkY}
                  onFastTravel={handleFastTravel}
                  onOpenPinEditor={(cx, cy, pin) => handleOpenPinEditor(cx, cy, pin)}
                  onClose={() => {
                    setSelectedChunk(null);
                    setHoveredChunk(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Collapsible Waystone & Pins Drawer Ledger */}
          {showPinsLedger && (
            <div className="w-full md:w-84 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 p-3 flex flex-col max-h-[280px] md:max-h-full overflow-hidden animate-fade-in z-20">
              <WorldMapPinsList
                pins={customPins}
                allWaystones={allWaystonesList}
                currentChunkX={currentChunkX}
                currentChunkY={currentChunkY}
                onSelectPin={(pin) => {
                  const determinedBiome = pin.chunkX === 0 && pin.chunkY === 0 ? 'town' : getOrganicBiome(pin.chunkX, pin.chunkY);
                  setSelectedChunk({
                    chunkX: pin.chunkX,
                    chunkY: pin.chunkY,
                    biome: determinedBiome,
                    hasTown: pin.chunkX === 0 && pin.chunkY === 0,
                    hasDungeon: false,
                    hasHarbor: (pin.chunkX === 3 && pin.chunkY === -2) || (pin.label?.toLowerCase().includes('harbor') ?? false),
                    hasWaystone: false,
                    isWaystoneAttuned: false,
                    isDiscovered: true,
                    threatTier: Math.min(5, Math.floor(Math.hypot(pin.chunkX, pin.chunkY) * 0.8) + 1),
                    elevation: 0.5,
                    moisture: 0.5,
                    pois: [],
                    regionName: `Pin: ${pin.label} [${pin.chunkX}, ${pin.chunkY}]`,
                    customPins: [pin]
                  });
                }}
                onFastTravel={handleFastTravel}
                onEditPin={(pin) => handleOpenPinEditor(pin.chunkX, pin.chunkY, pin)}
                onDeletePin={(pinId) => onDeletePin && onDeletePin(pinId)}
              />
            </div>
          )}
        </div>

        {/* Footer Legend */}
        <WorldMapLegend />

        {/* Custom Pin Creation & Edit Modal */}
        <CustomPinEditorModal
          isOpen={pinEditor.isOpen}
          chunkX={pinEditor.chunkX}
          chunkY={pinEditor.chunkY}
          existingPin={pinEditor.existingPin}
          onSavePin={handleSavePin}
          onDeletePin={(pinId) => {
            if (onDeletePin) {
              onDeletePin(pinId);
            }
            setPinEditor({ isOpen: false, chunkX: 0, chunkY: 0, existingPin: null });
          }}
          onClose={() => setPinEditor({ isOpen: false, chunkX: 0, chunkY: 0, existingPin: null })}
        />
      </div>
    </div>
  );
};

