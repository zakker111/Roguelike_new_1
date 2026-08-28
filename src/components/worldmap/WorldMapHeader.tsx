import React from 'react';
import { WorldMapFilterState, CartographyStats } from './types';
import { Compass, ZoomIn, ZoomOut, X, MapPin, Sparkles, BookOpen } from 'lucide-react';

interface WorldMapHeaderProps {
  currentChunkX: number;
  currentChunkY: number;
  hoveredChunk: { x: number; y: number; name?: string } | null;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  filters: WorldMapFilterState;
  setFilters: React.Dispatch<React.SetStateAction<WorldMapFilterState>>;
  stats?: CartographyStats;
  isPinsListOpen?: boolean;
  setIsPinsListOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onCenterOnPlayer: () => void;
}

export const WorldMapHeader: React.FC<WorldMapHeaderProps> = ({
  currentChunkX,
  currentChunkY,
  hoveredChunk,
  zoomLevel,
  setZoomLevel,
  filters,
  setFilters,
  stats,
  isPinsListOpen,
  setIsPinsListOpen,
  onClose,
  onCenterOnPlayer
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-3 sm:p-4 bg-slate-900 border-b border-slate-800 text-slate-100 select-none">
      <div className="flex items-center gap-3">
        <div className="bg-amber-500/10 p-2 border border-amber-500/30 rounded-lg text-amber-400">
          <Compass className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <span>Cartographer's World Realm Map</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                [M]
              </span>
            </h2>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
            <span>Hero Chunk: <strong className="text-amber-400 font-mono">({currentChunkX}, {currentChunkY})</strong></span>
            {hoveredChunk && (
              <>
                <span className="text-slate-600">•</span>
                <span>Inspecting: <strong className="text-sky-400 font-mono">({hoveredChunk.x}, {hoveredChunk.y})</strong> {hoveredChunk.name ? `— ${hoveredChunk.name}` : ''}</span>
              </>
            )}
            {stats && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-mono text-[10px]">
                  Mapped: {stats.discoveredChunksCount} Sectors ({stats.totalTilesMapped ? `${stats.totalTilesMapped.toLocaleString()} Tiles` : `${stats.discoveredChunksCount * 2560} Tiles`})
                </span>
                {typeof stats.frontierMinX === 'number' && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-400/80 font-mono text-[10px]">
                      Frontier: [{stats.frontierMinX},{stats.frontierMinY}]..[{stats.frontierMaxX},{stats.frontierMaxY}]
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
        {/* Ledger & Pins Toggle */}
        {setIsPinsListOpen && (
          <button
            onClick={() => setIsPinsListOpen(p => !p)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPinsListOpen
                ? 'bg-sky-600 border-sky-400 text-white shadow'
                : 'bg-slate-950/80 border-slate-800 text-sky-300 hover:bg-slate-800'
            }`}
            title="Toggle Waystones & Map Pins Ledger [P]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Leyline & Pins</span>
            <span className="text-[9px] font-mono opacity-70 bg-black/20 px-1 rounded">P</span>
          </button>
        )}

        {/* Filter Toggles */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 border border-slate-800 rounded-lg text-[10px] overflow-x-auto max-w-full">
          <button
            onClick={() => setFilters(f => ({ ...f, showTowns: !f.showTowns }))}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${filters.showTowns ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            title="Toggle Town & Settlement Markers"
          >
            🏰 Settlements
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, showDungeons: !f.showDungeons }))}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${filters.showDungeons ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            title="Toggle Dungeon & Catacomb Markers"
          >
            ⚔️ Dungeons
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, showWaystones: !f.showWaystones }))}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${filters.showWaystones ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            title="Toggle Leyline Waystones"
          >
            🌀 Waystones
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, showCustomPins: !f.showCustomPins }))}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${filters.showCustomPins ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            title="Toggle Custom Player Map Pins"
          >
            📍 Custom Pins
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, showShrines: !f.showShrines }))}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${filters.showShrines ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            title="Toggle Ancient Shrines & Camps"
          >
            ✨ Shrines
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, showCaravanRoutes: !f.showCaravanRoutes }))}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${filters.showCaravanRoutes ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            title="Toggle Trade Caravan Road Highways"
          >
            🛣️ Trade Roads
          </button>
        </div>

        {/* Zoom & Recenter Controls */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 border border-slate-800 rounded-lg">
          <button
            onClick={() => setZoomLevel(z => Math.max(0.4, Math.round((z - 0.2) * 10) / 10))}
            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded transition-colors cursor-pointer flex items-center gap-0.5"
            title="Zoom Out [-]"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold text-amber-400 px-1.5 min-w-[36px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(z => Math.min(3.5, Math.round((z + 0.2) * 10) / 10))}
            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded transition-colors cursor-pointer flex items-center gap-0.5"
            title="Zoom In [+]"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onCenterOnPlayer}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold text-sky-400 rounded ml-1 transition-colors border border-sky-500/20 cursor-pointer flex items-center gap-1"
            title="Center View on Current Hero Location [R / 0]"
          >
            <span>📍 Find Hero</span>
            <span className="text-[8px] font-mono opacity-70 bg-black/20 px-1 rounded">R</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          title="Close World Map (ESC / M)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
