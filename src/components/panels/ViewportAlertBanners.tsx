import React from 'react';
import { GameState, DungeonProp, TileType } from '../../types';
import { PoiType } from '../PoiInteractionOverlay';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../utils/gameUtils';

export interface ViewportAlertBannersProps {
  gameState: GameState;
  onOpenPoi: (poi: PoiType) => void;
  onInteractWithDungeonShrine: (prop: DungeonProp) => void;
  onOpenFishing: () => void;
  playSound: (sound: string) => void;
}

export const ViewportAlertBanners: React.FC<ViewportAlertBannersProps> = ({
  gameState,
  onOpenPoi,
  onInteractWithDungeonShrine,
  onOpenFishing,
  playSound,
}) => {
  // 1. POI Landmark Alert
  const renderPoiAlert = () => {
    if (!gameState.isOverworld) return null;
    const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
    const activeChunk = gameState.overworldChunks[chunkKey];
    if (!activeChunk || !activeChunk.pois) return null;
    const adjacentPoi = activeChunk.pois.find((poi) => {
      return (
        Math.abs(gameState.playerX - poi.x) <= 1 &&
        Math.abs(gameState.playerY - poi.y) <= 1
      );
    });

    if (!adjacentPoi) return null;

    const pIcons: { [key: string]: string } = {
      shrine: '⛲',
      hearth: '🔥',
      monolith: '📜',
      sunken_keep: '🏰',
      fossil: '🦴',
    };
    const poiIcon = pIcons[adjacentPoi.type] || '📍';

    return (
      <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/35 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none shadow-md animate-fade-in">
        <div className="flex items-center gap-2.5 text-left">
          <span className="text-3xl filter drop-shadow">{poiIcon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                {adjacentPoi.name}
              </h4>
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                  adjacentPoi.isInteracted
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10'
                }`}
              >
                {adjacentPoi.isInteracted ? 'EXHAUSTED' : 'READY TO INTERACT'}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-sans mt-0.5 max-w-md">
              "{adjacentPoi.description}"
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            onOpenPoi(adjacentPoi);
            playSound('loot');
          }}
          className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/35 border border-amber-400/20 cursor-pointer"
        >
          <span>
            {adjacentPoi.isInteracted ? '📖 READ CHRONICLE' : '⚡ EXAMINE LANDMARK'}
          </span>
        </button>
      </div>
    );
  };

  // 2. Dungeon Prop / Shrine Alert
  const renderPropAlert = () => {
    if (!gameState.dungeonProps || gameState.dungeonProps.length === 0) return null;
    const adjacentProp = gameState.dungeonProps.find((prop) => {
      return (
        Math.abs(gameState.playerX - prop.x) <= 1 &&
        Math.abs(gameState.playerY - prop.y) <= 1
      );
    });

    if (!adjacentProp) return null;

    const isUsed =
      adjacentProp.isInteracted ||
      adjacentProp.description.includes('(EXHAUSTED)');
    const actionText =
      adjacentProp.actionLabel ||
      (adjacentProp.name.toLowerCase().includes('shrine')
        ? 'ACCEPT SACRIFICE'
        : 'INTERACT');

    return (
      <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/35 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none shadow-md animate-fade-in">
        <div className="flex items-center gap-2.5 text-left">
          <span className="text-3xl filter drop-shadow animate-pulse">
            {adjacentProp.char}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest">
                {adjacentProp.name}
              </h4>
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                  isUsed
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/10'
                }`}
              >
                {isUsed ? 'EXHAUSTED' : 'TOUCHABLE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-sans mt-0.5 max-w-md">
              "{adjacentProp.description}"
            </p>
          </div>
        </div>

        <button
          disabled={isUsed}
          onClick={() => {
            onInteractWithDungeonShrine(adjacentProp);
          }}
          className={`w-full sm:w-auto py-2.5 px-6 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg border cursor-pointer ${
            isUsed
              ? 'bg-slate-800 text-slate-500 border-slate-750 cursor-not-allowed opacity-50'
              : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400/20 shadow-purple-950/35'
          }`}
        >
          <span>{isUsed ? 'EXHAUSTED' : `[E / G] ${actionText}`}</span>
        </button>
      </div>
    );
  };

  // 3. Fishing Alert
  const renderFishingAlert = () => {
    const hasPole = (gameState.inventoryMaterials['mat_fishing_pole'] || 0) > 0;
    const hasAdjacentWater = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: 1, dy: 1 },
    ].some((d) => {
      const nx = gameState.playerX + d.dx;
      const ny = gameState.playerY + d.dy;
      return (
        nx >= 0 &&
        nx < LEVEL_WIDTH &&
        ny >= 0 &&
        ny < LEVEL_HEIGHT &&
        gameState.map[ny]?.[nx] === TileType.Water
      );
    });

    if (!hasAdjacentWater) return null;

    return (
      <div className="bg-gradient-to-r from-sky-950/45 to-slate-900 border border-sky-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse duration-1000 select-none shadow-md">
        <div className="flex items-center gap-2.5 text-left">
          <span className="text-3xl animate-bounce">🌊</span>
          <div>
            <h4 className="text-xs font-black text-sky-400 uppercase tracking-widest">
              Quiet Water Hotspot
            </h4>
            <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
              {hasPole
                ? 'Water currents detected in your vicinity! Prime conditions for angling.'
                : 'You are exactly next to a water body. Craft an Ancient Fishing Pole under Survival tab to fish!'}
            </p>
          </div>
        </div>

        {hasPole ? (
          <button
            onClick={onOpenFishing}
            className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-sky-600 hover:bg-sky-500 text-white border border-sky-450 hover:border-sky-300 text-[11px] font-black uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-sky-950/20 cursor-pointer"
          >
            <span>🎣 START FISHING</span>
          </button>
        ) : (
          <div className="text-[10px] bg-slate-950/70 border border-slate-800 text-slate-400 py-1.5 px-3 rounded-lg font-semibold italic text-center w-full sm:w-auto">
            Rod Required 🎣
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {renderPoiAlert()}
      {renderPropAlert()}
      {renderFishingAlert()}
    </>
  );
};

export default ViewportAlertBanners;
