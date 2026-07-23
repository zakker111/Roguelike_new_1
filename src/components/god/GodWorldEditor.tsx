/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameState, TileType, TrapType } from '../../types';
import { Hammer, Flame, ShieldAlert, CloudRain } from 'lucide-react';

export interface GodWorldEditorProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setJsonError?: (err: string | null) => void;
}

export const GodWorldEditor: React.FC<GodWorldEditorProps> = ({
  gameState,
  setGameState,
  setJsonError,
}) => {
  const [selectedWeather, setSelectedWeather] = useState<'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard'>(
    gameState.weather || 'clear'
  );

  const handleSpawnAdjacentObject = (
    type: 'chest' | 'campfire' | 'anvil' | 'trap_spikes' | 'trap_fire' | 'trap_poison'
  ) => {
    let tx = -1;
    let ty = -1;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const targetX = gameState.playerX + dx;
        const targetY = gameState.playerY + dy;
        if (
          targetX >= 0 &&
          targetX < gameState.levelWidth &&
          targetY >= 0 &&
          targetY < gameState.levelHeight
        ) {
          const tile = gameState.map[targetY][targetX];
          const hasCollider =
            gameState.enemies.some((e) => e.x === targetX && e.y === targetY) ||
            gameState.chests.some((c) => c.x === targetX && c.y === targetY);
          if (
            tile === TileType.Floor ||
            tile === TileType.Grass ||
            tile === TileType.Path
          ) {
            if (!hasCollider) {
              tx = targetX;
              ty = targetY;
              break;
            }
          }
        }
      }
      if (tx !== -1) break;
    }

    if (tx === -1 || ty === -1) {
      if (setJsonError) {
        setJsonError('No adjacent free walkable tiles available nearby! Stand on open ground.');
        setTimeout(() => setJsonError(null), 4000);
      }
      return;
    }

    setGameState((prev) => {
      const nextMap = prev.map.map((row) => [...row]);
      let nextChests = prev.chests ? [...prev.chests] : [];
      let nextTraps = prev.traps ? [...prev.traps] : [];
      let sysLogText = '';

      if (type === 'campfire') {
        nextMap[ty][tx] = TileType.Campfire;
        sysLogText = `🔥 REALM CARVE: Materialized a warming ambient Campfire directly at coords (${tx}, ${ty})!`;
      } else if (type === 'anvil') {
        nextMap[ty][tx] = TileType.Anvil;
        sysLogText = `⚒️ REALM CARVE: Materialized a Portable Blacksmith Anvil directly at coords (${tx}, ${ty})!`;
      } else if (type === 'chest') {
        nextChests.push({
          id: `god_chest_${Date.now()}`,
          x: tx,
          y: ty,
          isOpened: false,
          materials: ['mat_iron_ore', 'mat_birch_log'],
          catalysts: ['cat_fire'],
          gold: 150,
        });
        sysLogText = `🎁 REALM CARVE: Materialized a Legendary Loot Chest at coords (${tx}, ${ty})!`;
      } else if (type.startsWith('trap_')) {
        let trapType = TrapType.Spikes;
        if (type === 'trap_fire') trapType = TrapType.FireVent;
        if (type === 'trap_poison') trapType = TrapType.PoisonGas;

        nextTraps.push({
          id: `god_trap_${Date.now()}`,
          x: tx,
          y: ty,
          type: trapType,
          isActive: true,
          triggered: false,
          detected: true,
        });
        sysLogText = `⚠️ REALM CARVE: Materialized a lethal ${trapType} Hazard at coords (${tx}, ${ty})!`;
      }

      return {
        ...prev,
        map: nextMap,
        chests: nextChests,
        traps: nextTraps,
        logs: [
          ...prev.logs,
          {
            id: `dev_obj_${Date.now()}`,
            text: sysLogText,
            type: 'system',
            timestamp: 'GOD',
          },
        ],
      };
    });
  };

  const handleWeatherChange = (w: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard') => {
    setSelectedWeather(w);
    setGameState((prev) => ({
      ...prev,
      weather: w,
      logs: [
        ...prev.logs,
        {
          id: `weather_${Date.now()}`,
          text: `🌩️ REALM CLIMATE: Shifted atmospheric weather to "${w.toUpperCase()}"!`,
          type: 'system',
          timestamp: 'GOD',
        },
      ],
    }));
  };

  return (
    <div className="space-y-4 font-mono p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
        <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
          <Hammer className="w-4 h-4 text-amber-500" />
          <span>Sovereign World Editor & Object Deployment</span>
        </span>
      </div>

      <p className="text-[10px] text-slate-400 font-sans leading-normal">
        Materialize crafting stations, loot chests, or hazardous traps directly on adjacent open tiles relative to the player.
      </p>

      {/* Object Spawning Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          onClick={() => handleSpawnAdjacentObject('anvil')}
          className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-amber-500/50 rounded-lg text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
            <span>⚒️ Anvil Station</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 font-sans">
            Spawns deployable Blacksmith Anvil tile for field crafting & mutations.
          </p>
        </button>

        <button
          onClick={() => handleSpawnAdjacentObject('campfire')}
          className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-orange-500/50 rounded-lg text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-orange-400 font-bold text-[11px]">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Campfire</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 font-sans">
            Spawns a cooking campfire tile for resting and preparing rations.
          </p>
        </button>

        <button
          onClick={() => handleSpawnAdjacentObject('chest')}
          className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-yellow-500/50 rounded-lg text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-[11px]">
            <span>🎁 Loot Chest</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 font-sans">
            Spawns a chest filled with raw materials, catalysts, and gold.
          </p>
        </button>

        <button
          onClick={() => handleSpawnAdjacentObject('trap_spikes')}
          className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-rose-500/50 rounded-lg text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-rose-400 font-bold text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Spike Trap</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 font-sans">
            Spawns a physical spike hazard on an adjacent tile.
          </p>
        </button>

        <button
          onClick={() => handleSpawnAdjacentObject('trap_fire')}
          className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-orange-500/50 rounded-lg text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-orange-400 font-bold text-[11px]">
            <span>🔥 Fire Vent</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 font-sans">
            Spawns a thermal fire vent hazard.
          </p>
        </button>

        <button
          onClick={() => handleSpawnAdjacentObject('trap_poison')}
          className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-emerald-500/50 rounded-lg text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
            <span>🧪 Poison Gas</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 font-sans">
            Spawns a toxic gas cloud trap.
          </p>
        </button>
      </div>

      {/* Climate & Weather Controls */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[10px] uppercase">
          <CloudRain className="w-3.5 h-3.5" />
          <span>Atmospheric Climate Controller</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
          {(['clear', 'rainy', 'foggy', 'snowy', 'sandstorm', 'blizzard'] as const).map((w) => (
            <button
              key={w}
              onClick={() => handleWeatherChange(w)}
              className={`py-1.5 px-2 rounded text-[9.5px] font-mono font-bold capitalize transition-all border cursor-pointer ${
                selectedWeather === w
                  ? 'bg-sky-500 text-slate-950 border-sky-300 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
