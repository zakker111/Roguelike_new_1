import React from 'react';
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
import { MIN_ZOOM, MAX_ZOOM } from './useWorldMapViewport';

export interface WorldMapControlsProps {
  showMobileNav: boolean;
  setShowMobileNav: React.Dispatch<React.SetStateAction<boolean>>;
  zoomLevel: number;
  setZoomLevel?: React.Dispatch<React.SetStateAction<number>>;
  chunkSize: number;
  currentChunkX: number;
  currentChunkY: number;
  smoothPanBy: (deltaX: number, deltaY: number) => void;
  centerOnChunk: (cx: number, cy: number) => void;
}

export const WorldMapControls: React.FC<WorldMapControlsProps> = ({
  showMobileNav,
  setShowMobileNav,
  zoomLevel,
  setZoomLevel,
  chunkSize,
  currentChunkX,
  currentChunkY,
  smoothPanBy,
  centerOnChunk,
}) => {
  return (
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
                  onClick={() => setZoomLevel(prev => Math.min(MAX_ZOOM, Math.round((prev + 0.25) * 100) / 100))}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-sky-300 border border-slate-800 rounded-lg cursor-pointer transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(MIN_ZOOM, Math.round((prev - 0.25) * 100) / 100))}
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
  );
};
