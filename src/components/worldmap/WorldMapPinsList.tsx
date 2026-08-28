import React from 'react';
import { CustomMapPin, ChunkMapInfo } from './types';
import { MapPin, Navigation, Trash2, Edit3, Compass, Sparkles } from 'lucide-react';

interface WorldMapPinsListProps {
  pins: CustomMapPin[];
  allWaystones: { id: string; name: string; chunkX: number; chunkY: number; isAttuned: boolean }[];
  currentChunkX: number;
  currentChunkY: number;
  onSelectPin: (pin: CustomMapPin) => void;
  onEditPin: (pin: CustomMapPin) => void;
  onDeletePin: (pinId: string) => void;
  onFastTravel: (chunkX: number, chunkY: number, name: string) => void;
}

export const WorldMapPinsList: React.FC<WorldMapPinsListProps> = ({
  pins,
  allWaystones,
  currentChunkX,
  currentChunkY,
  onSelectPin,
  onEditPin,
  onDeletePin,
  onFastTravel
}) => {
  const getIconEmoji = (icon: string) => {
    switch (icon) {
      case 'sword': return '⚔️';
      case 'shield': return '🛡️';
      case 'mine': return '⛏️';
      case 'gem': return '💎';
      case 'danger': return '💀';
      case 'camp': return '🏕️';
      case 'loot': return '📦';
      case 'herb': return '🌿';
      case 'portal': return '🌀';
      default: return '⭐';
    }
  };

  return (
    <div className="space-y-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs select-none max-h-72 overflow-y-auto">
      {/* Waystones Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Leyline Waystone Network</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            {allWaystones.filter(w => w.isAttuned).length} / {allWaystones.length} Attuned
          </span>
        </div>

        {allWaystones.length === 0 ? (
          <p className="text-slate-500 italic text-[11px]">
            No ancient waystones discovered yet. Discover obelisks in wilderness sectors.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {allWaystones.map((w) => {
              const isCurrent = w.chunkX === currentChunkX && w.chunkY === currentChunkY;
              return (
                <div
                  key={w.id}
                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                    w.isAttuned
                      ? 'bg-sky-950/40 border-sky-500/30 text-sky-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base">{w.isAttuned ? '🌀' : '⚪'}</span>
                    <div className="truncate">
                      <div className="font-bold truncate text-[11px] flex items-center gap-1">
                        <span>{w.name}</span>
                        {isCurrent && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">HERE</span>}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">
                        Sector [{w.chunkX}, {w.chunkY}]
                      </div>
                    </div>
                  </div>

                  {w.isAttuned && !isCurrent && (
                    <button
                      onClick={() => onFastTravel(w.chunkX, w.chunkY, w.name)}
                      className="px-2 py-1 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-[10px] rounded transition-transform cursor-pointer shrink-0 shadow flex items-center gap-1"
                      title="Fast travel to this Leyline Waystone"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Teleport</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 pt-2" />

      {/* Custom Map Pins Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Custom Cartographer Pins</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            {pins.length} Placed
          </span>
        </div>

        {pins.length === 0 ? (
          <p className="text-slate-500 italic text-[11px]">
            No custom pins placed. Right-click on the map or click "Place Pin" on any inspected sector.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {pins.map((pin) => (
              <div
                key={pin.id}
                className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
              >
                <div
                  className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                  onClick={() => onSelectPin(pin)}
                  title="Click to center on map"
                >
                  <span className="text-base">{getIconEmoji(pin.icon)}</span>
                  <div className="truncate">
                    <div className="font-bold text-slate-200 text-[11px] truncate flex items-center gap-1">
                      <span style={{ color: pin.color }}>●</span>
                      <span>{pin.label}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                      <span>[{pin.chunkX}, {pin.chunkY}]</span>
                      {pin.notes && <span className="truncate italic text-slate-500">— {pin.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEditPin(pin)}
                    className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                    title="Edit Pin"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeletePin(pin.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                    title="Delete Pin"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
