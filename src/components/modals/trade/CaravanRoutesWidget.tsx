import React, { useMemo } from 'react';
import { CaravanDestination } from './types';
import { hasTownAtChunk, getDeterministicTownName } from '../../../utils/overworld';

export interface CaravanRoutesWidgetProps {
  currentChunkX: number;
  currentChunkY: number;
  onStartCaravanTravel: (x: number, y: number, name: string) => void;
}

export const CaravanRoutesWidget: React.FC<CaravanRoutesWidgetProps> = ({
  currentChunkX,
  currentChunkY,
  onStartCaravanTravel
}) => {
  const destinations = useMemo(() => {
    const list: CaravanDestination[] = [];

    // 1. Scan nearby chunks for procedural towns (-4 to +4)
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -4; dy <= 4; dy++) {
        const tx = currentChunkX + dx;
        const ty = currentChunkY + dy;
        if (tx === currentChunkX && ty === currentChunkY) continue;
        if (hasTownAtChunk(tx, ty)) {
          const name = getDeterministicTownName(tx, ty);
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          list.push({ x: tx, y: ty, name, dist, theme: '🏘️ Regional Settlement' });
        }
      }
    }

    // 2. Major Capital & Wilderness Outpost Trade Hubs
    const majorHubs = [
      { x: 0, y: 0, name: 'Oakhaven Village', theme: '🌲 Forest Capital' },
      { x: 3, y: -2, name: 'Vanguard Harbor Port', theme: '⛵ Coastal Citadel' },
      { x: -3, y: 3, name: 'Ironforge Stronghold', theme: '🏔️ Mountain Fortress' },
      { x: 4, y: 4, name: 'Sunfire Oasis Outpost', theme: '🏜️ Desert Bazaar' },
      { x: -4, y: -4, name: 'Frostpeak Sledge Haven', theme: '❄️ Tundra Outpost' },
      { x: -2, y: 2, name: 'Shadowfen Barge Dock', theme: '🐊 Swamp Dock' },
      { x: 5, y: -3, name: 'Stormwatch Citadel', theme: '⚡ Highlands Watchtower' }
    ];

    for (const hub of majorHubs) {
      if (hub.x === currentChunkX && hub.y === currentChunkY) continue;
      if (!list.some(t => t.x === hub.x && t.y === hub.y)) {
        const dist = Math.max(Math.abs(currentChunkX - hub.x), Math.abs(currentChunkY - hub.y));
        list.push({
          x: hub.x,
          y: hub.y,
          name: hub.name,
          dist,
          theme: hub.theme
        });
      }
    }

    // Sort by distance
    list.sort((a, b) => a.dist - b.dist);
    return list;
  }, [currentChunkX, currentChunkY]);

  return (
    <div className="mb-4 bg-blue-950/20 border border-blue-500/30 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center gap-2 border-b border-blue-950/40 pb-2">
        <span className="text-2xl">🗺️</span>
        <div className="text-left">
          <h4 className="text-xs font-black uppercase text-blue-400 font-sans tracking-wider flex items-center gap-2">
            <span>CARAVAN ROUTES & ESCORT FAST TRAVEL</span>
            <span className="text-[9px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded font-mono font-normal">Wilderness & Town Routes</span>
          </h4>
          <p className="text-[10px] text-slate-400 leading-normal">
            Sign up as a Caravan Guard to accompany wilderness and regional trade wagons across overworld chunks. Face random road encounters, protect wagon cargo from bandits, and claim major gold payouts upon arrival!
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <h5 className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide text-left flex justify-between items-center">
          <span>Available Regional Caravan Destinations:</span>
          <span className="text-slate-500 font-mono text-[9px] font-normal">Current Chunk: ({currentChunkX}, {currentChunkY})</span>
        </h5>

        {destinations.length === 0 ? (
          <p className="text-[10px] text-slate-500 italic">No alternative towns discovered in nearby regions.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {destinations.map((dest, idx) => {
              const reward = 100 + dest.dist * 80;
              const riskLevel = dest.dist <= 2 ? '🟢 Low Risk' : dest.dist <= 4 ? '🟡 Moderate Risk' : '👑🔴 High Hazard (Boss Ambush Risk!)';

              return (
                <div key={idx} className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 p-3 rounded-lg flex flex-col justify-between gap-2 transition-all">
                  <div className="text-left">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-100 text-[11px] truncate">{dest.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">{dest.theme}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 flex justify-between items-center font-mono">
                      <span>Region: ({dest.x}, {dest.y})</span>
                      <span className="text-blue-400 font-semibold">{dest.dist} {dest.dist === 1 ? 'region' : 'regions'} away</span>
                    </div>
                    <div className="text-[8.5px] text-slate-500 mt-0.5 flex justify-between">
                      <span>Route Safety: {riskLevel}</span>
                      <span className="text-yellow-400/90 font-bold">Reward: +{reward}g</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onStartCaravanTravel(dest.x, dest.y, dest.name)}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] text-slate-50 font-bold text-[9px] rounded-md transition-all flex justify-center items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>🛡️ Escort Caravan Wagon</span>
                    <span className="text-yellow-300 font-mono font-bold">(Payout: +{reward}g)</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
