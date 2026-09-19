import React, { useEffect } from 'react';
import { X, MapPin, Sparkles, Compass, DoorOpen } from 'lucide-react';
import { playSound } from '../utils/audio';
import { hasTownAtChunk, getDeterministicTownName, getOrganicBiome } from '../utils/overworld';

interface RecallScrollOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: any;
  onTeleport: (destX: number, destY: number, destName: string) => void;
}

export default function RecallScrollOverlay({
  isOpen,
  onClose,
  gameState,
  onTeleport,
}: RecallScrollOverlayProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Let's gather all available recall targets.
  // 1. Oakhaven Village (always available, at 0,0)
  const recallLocations: Array<{
    type: 'town' | 'safehouse';
    name: string;
    chunkX: number;
    chunkY: number;
    key: string;
    biome: string;
  }> = [
    {
      type: 'town',
      name: 'Oakhaven Village (Starting Town)',
      chunkX: 0,
      chunkY: 0,
      key: '0,0',
      biome: getOrganicBiome(0, 0),
    }
  ];

  // 2. Discover from overworldChunks
  const chunkKeys = Object.keys(gameState.overworldChunks || {});
  for (const key of chunkKeys) {
    if (key === '0,0') continue; // Already added Oakhaven
    const [cxStr, cyStr] = key.split(',');
    const cx = parseInt(cxStr, 10);
    const cy = parseInt(cyStr, 10);

    if (hasTownAtChunk(cx, cy)) {
      const name = getDeterministicTownName(cx, cy);
      recallLocations.push({
        type: 'town',
        name,
        chunkX: cx,
        chunkY: cy,
        key,
        biome: getOrganicBiome(cx, cy),
      });
    }
  }

  // 3. Add remote wilderness safehouses from safehouses state
  if (gameState.safehouses) {
    for (const [key, val] of Object.entries(gameState.safehouses)) {
      if (val && (val as any).purchased) {
        if (recallLocations.some((loc) => loc.key === key)) continue; // avoid duplication

        const [cxStr, cyStr] = key.split(',');
        const cx = parseInt(cxStr, 10);
        const cy = parseInt(cyStr, 10);

        recallLocations.push({
          type: 'safehouse',
          name: `Wilderness Outpost Safehouse`,
          chunkX: cx,
          chunkY: cy,
          key,
          biome: getOrganicBiome(cx, cy),
        });
      }
    }
  }

  const handleSelect = (cx: number, cy: number, name: string) => {
    playSound('levelUp');
    onTeleport(cx, cy, name);
  };

  const getBiomeColor = (biome: string) => {
    switch (biome) {
      case 'forest':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40';
      case 'desert':
        return 'text-amber-400 bg-amber-950/40 border-amber-900/40';
      case 'tundra':
        return 'text-sky-400 bg-sky-950/40 border-sky-900/40';
      case 'swamp':
        return 'text-purple-400 bg-purple-950/40 border-purple-900/40';
      default:
        return 'text-slate-400 bg-slate-950/40 border-slate-900/40';
    }
  };

  return (
    <div id="recall-scroll-overlay-bg" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div id="recall-scroll-container" className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div id="recall-scroll-header" className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" id="recall-scroll-icon-spark">🔮</span>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-500 font-sans" id="recall-scroll-title">Scroll of Recall</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5" id="recall-scroll-subtitle">Consumable Interdimensional Teleportation</p>
            </div>
          </div>
          <button
            id="recall-scroll-close-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div id="recall-scroll-description-box" className="p-4 bg-amber-500/5 border-b border-slate-800/60 text-left">
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            Reading this high-tier arcane scroll allows you to instantly warp space and tear open a dimensional rift. Select any previously discovered town, harbor port, or remote wilderness outpost to instantly teleport you and your active companions there.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2.5 items-center">
            <div className="flex items-center gap-1 text-[9px] text-amber-400 font-mono font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Once read, the scroll is permanently consumed.</span>
            </div>
            <div className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 bg-sky-950/60 text-sky-400 border border-sky-800/60 rounded flex items-center gap-1">
              <span>⚡ Mana Cost: 15 MP</span>
              <span className="text-slate-500">|</span>
              <span className={gameState.playerStats.mp >= 15 ? "text-emerald-400" : "text-rose-400 font-extrabold"}>
                Current: {gameState.playerStats.mp}/{gameState.playerStats.maxMp} MP
              </span>
            </div>
          </div>
        </div>

        {/* Targets List */}
        <div id="recall-scroll-target-list" className="p-4 flex-1 overflow-y-auto flex flex-col gap-2.5 min-h-0 bg-slate-950/25">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block text-left" id="recall-scroll-list-header">
            Available Rift Destinations:
          </span>

          {recallLocations.map((loc) => {
            const distance = Math.max(
              Math.abs(loc.chunkX - gameState.currentChunkX),
              Math.abs(loc.chunkY - gameState.currentChunkY)
            );
            const isCurrent = loc.chunkX === gameState.currentChunkX && loc.chunkY === gameState.currentChunkY;
            const hasEnoughMp = gameState.playerStats.mp >= 15;

            return (
              <div
                key={loc.key}
                id={`recall-loc-${loc.key.replace(',', '-')}`}
                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-slate-900/40 border-amber-500/20 opacity-75'
                    : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className={`p-2 rounded-lg ${loc.type === 'town' ? 'bg-amber-950/30 text-amber-400' : 'bg-blue-950/30 text-blue-400'}`}>
                    {loc.type === 'town' ? <MapPin className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-200">{loc.name}</span>
                      {isCurrent && (
                        <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.2 rounded font-mono">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-400 font-mono">Chunk: [{loc.chunkX}, {loc.chunkY}]</span>
                      <span className="text-[9px] text-slate-600">•</span>
                      <span className={`text-[9px] uppercase font-bold font-mono px-1.5 py-0.2 border rounded shrink-0 ${getBiomeColor(loc.biome)}`}>
                        {loc.biome}
                      </span>
                      {distance > 0 && (
                        <>
                          <span className="text-[9px] text-slate-600">•</span>
                          <span className="text-[9px] text-sky-400 font-bold font-mono">{distance} Region{distance > 1 ? 's' : ''} Away</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  id={`recall-teleport-btn-${loc.key.replace(',', '-')}`}
                  onClick={() => handleSelect(loc.chunkX, loc.chunkY, loc.name)}
                  disabled={isCurrent || !hasEnoughMp}
                  className={`mt-2.5 sm:mt-0 w-full sm:w-auto px-3.5 py-2 font-bold rounded-lg text-[10px] font-mono flex items-center justify-center gap-1.5 transition-all ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                      : !hasEnoughMp
                      ? 'bg-slate-950 text-rose-500/80 border border-rose-900/30 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:scale-[1.01] shadow cursor-pointer'
                  }`}
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>{isCurrent ? "Already Here" : !hasEnoughMp ? "Insufficient MP" : "Warp Region"}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div id="recall-scroll-footer" className="p-3 border-t border-slate-800 bg-slate-950/40 text-center flex justify-end">
          <button
            id="recall-scroll-cancel-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-700 hover:border-slate-600 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 font-bold text-[10px] rounded-lg transition-colors cursor-pointer font-sans"
          >
            Cancel & Keep Scroll
          </button>
        </div>

      </div>
    </div>
  );
}
