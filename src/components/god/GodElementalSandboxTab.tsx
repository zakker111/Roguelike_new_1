/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Flame, Droplets, Zap, Wind, Snowflake, Play, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { ElementType } from '../../types/elemental';
import { playSound } from '../../utils/audio';

export interface GodElementalSandboxTabProps {
  triggerSuccessLog?: (msg: string) => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

interface SandboxCell {
  terrain: 'grass' | 'water' | 'ice' | 'stone' | 'ash';
  element?: ElementType;
  intensity?: number;
}

const GRID_SIZE = 12;

export const GodElementalSandboxTab: React.FC<GodElementalSandboxTabProps> = ({
  triggerSuccessLog,
  addLogMessage
}) => {
  const [selectedBrush, setSelectedBrush] = useState<ElementType | 'water_terrain' | 'grass_terrain' | 'clear'>('fire');
  const [grid, setGrid] = useState<SandboxCell[][]>(() => {
    const initial: SandboxCell[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: SandboxCell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x >= 4 && x <= 7 && y >= 4 && y <= 7) {
          row.push({ terrain: 'water' });
        } else if (y === 0 || y === GRID_SIZE - 1 || x === 0 || x === GRID_SIZE - 1) {
          row.push({ terrain: 'stone' });
        } else {
          row.push({ terrain: 'grass' });
        }
      }
      initial.push(row);
    }
    return initial;
  });

  const [stepCount, setStepCount] = useState(0);
  const [simLog, setSimLog] = useState<string>('Sandbox ready. Click any cell to apply elements, or click "Simulate Step".');

  const handleCellClick = (x: number, y: number) => {
    playSound('ui_click');
    setGrid(prev => {
      const copy = prev.map(r => r.map(c => ({ ...c })));
      const cell = copy[y][x];

      if (selectedBrush === 'clear') {
        cell.element = undefined;
        cell.intensity = undefined;
        if (cell.terrain === 'ash') cell.terrain = 'grass';
      } else if (selectedBrush === 'water_terrain') {
        cell.terrain = 'water';
        cell.element = undefined;
      } else if (selectedBrush === 'grass_terrain') {
        cell.terrain = 'grass';
        cell.element = undefined;
      } else {
        cell.element = selectedBrush as ElementType;
        cell.intensity = 2;
        if (selectedBrush === 'fire') playSound('spell');
        if (selectedBrush === 'shock') playSound('spell');
      }
      return copy;
    });
  };

  const handleSimulateStep = () => {
    playSound('craft');
    setGrid(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })));
      let reactions: string[] = [];

      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const cell = prev[y][x];

          // 1. Fire on grass -> burns grass to ash and spreads
          if (cell.element === 'fire') {
            if (cell.terrain === 'grass') {
              next[y][x].terrain = 'ash';
              next[y][x].element = undefined;
              reactions.push(`Cell (${x},${y}) vegetation consumed into ash!`);
            } else if (cell.terrain === 'ice') {
              next[y][x].terrain = 'water';
              next[y][x].element = 'steam';
              reactions.push(`Fire melted ice at (${x},${y}) into water & steam!`);
            }

            // Fire spreads to adjacent grass
            const neighbors = [
              [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
            ];
            neighbors.forEach(([nx, ny]) => {
              if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                if (prev[ny][nx].terrain === 'grass' && Math.random() < 0.6) {
                  next[ny][nx].element = 'fire';
                  next[ny][nx].intensity = 1;
                }
                if (prev[ny][nx].element === 'poison_gas') {
                  next[ny][nx].element = 'fire';
                  reactions.push(`Deflagration explosion ignited toxic gas at (${nx},${ny})!`);
                }
              }
            });
          }

          // 2. Shock on water -> electrifies contiguous pool
          if (cell.element === 'shock') {
            const neighbors = [
              [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
            ];
            neighbors.forEach(([nx, ny]) => {
              if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                if (prev[ny][nx].terrain === 'water' && next[ny][nx].element !== 'shock') {
                  next[ny][nx].element = 'shock';
                  reactions.push(`Contiguous water pool conducted shock to (${nx},${ny})!`);
                }
              }
            });
          }

          // 3. Ice on water -> freezes into walkable ice
          if (cell.element === 'ice' && cell.terrain === 'water') {
            next[y][x].terrain = 'ice';
            next[y][x].element = undefined;
            reactions.push(`Water froze into crystalline Ice at (${x},${y})!`);
          }
        }
      }

      setStepCount(s => s + 1);
      const logText = reactions.length > 0 ? reactions.slice(0, 3).join(' ') : 'Elements stabilized. No new chemical reactions.';
      setSimLog(logText);
      return next;
    });
  };

  const handleResetGrid = () => {
    playSound('ui_click');
    const initial: SandboxCell[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: SandboxCell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x >= 4 && x <= 7 && y >= 4 && y <= 7) {
          row.push({ terrain: 'water' });
        } else if (y === 0 || y === GRID_SIZE - 1 || x === 0 || x === GRID_SIZE - 1) {
          row.push({ terrain: 'stone' });
        } else {
          row.push({ terrain: 'grass' });
        }
      }
      initial.push(row);
    }
    setGrid(initial);
    setStepCount(0);
    setSimLog('Sandbox grid reset to default vegetation and water pool.');
  };

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300">
      {/* Header */}
      <div className="p-4 bg-slate-950/80 border border-emerald-500/30 rounded-xl flex items-start justify-between shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
                Elemental Cellular Automata Sandbox (Pillar 2)
              </h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold">
                PHYSICS LAB
              </span>
            </div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Interactive testbed for cellular automata fire spread, ice freezing, shock water conduction, toxic gas deflagration explosions, and steam LoS obscuration.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetGrid}
          className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-[10px] cursor-pointer"
        >
          Reset Grid
        </button>
      </div>

      {/* Tool Brushes */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase">Brush:</span>
        {[
          { id: 'fire', label: 'Fire 🔥', icon: Flame, color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' },
          { id: 'water', label: 'Water 💧', icon: Droplets, color: 'text-sky-400 border-sky-500/40 bg-sky-950/40' },
          { id: 'ice', label: 'Ice ❄️', icon: Snowflake, color: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40' },
          { id: 'shock', label: 'Shock ⚡', icon: Zap, color: 'text-yellow-300 border-yellow-500/40 bg-yellow-950/40' },
          { id: 'poison_gas', label: 'Toxic Gas ☠️', icon: Wind, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' },
          { id: 'steam', label: 'Steam 💨', icon: Wind, color: 'text-slate-300 border-slate-600 bg-slate-800/40' },
          { id: 'water_terrain', label: 'Terrain: Water Pool', icon: Droplets, color: 'text-blue-400 border-blue-500/40 bg-blue-950/40' },
          { id: 'grass_terrain', label: 'Terrain: Grass Brush', icon: Layers, color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40' },
          { id: 'clear', label: 'Clear Eraser', icon: RefreshCw, color: 'text-slate-400 border-slate-700 bg-slate-900' }
        ].map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedBrush(b.id as any)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              selectedBrush === b.id ? 'ring-2 ring-amber-400 shadow ' + b.color : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Grid Canvas Simulator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="md:col-span-2 p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col items-center shadow-inner">
          <div className="grid grid-cols-12 gap-1 max-w-sm w-full aspect-square">
            {grid.map((row, y) =>
              row.map((cell, x) => {
                let bg = 'bg-emerald-950/60 border-emerald-800/40';
                let char = '🌱';

                if (cell.terrain === 'water') {
                  bg = 'bg-sky-950/90 border-sky-700/60';
                  char = '🌊';
                } else if (cell.terrain === 'ice') {
                  bg = 'bg-cyan-900/80 border-cyan-400/80';
                  char = '🧊';
                } else if (cell.terrain === 'stone') {
                  bg = 'bg-slate-900 border-slate-700';
                  char = '🧱';
                } else if (cell.terrain === 'ash') {
                  bg = 'bg-stone-900 border-stone-800 text-stone-500';
                  char = '🪨';
                }

                if (cell.element === 'fire') {
                  bg = 'bg-amber-600/80 border-amber-400 animate-pulse';
                  char = '🔥';
                } else if (cell.element === 'shock') {
                  bg = 'bg-yellow-500/80 border-yellow-300 animate-pulse';
                  char = '⚡';
                } else if (cell.element === 'poison_gas') {
                  bg = 'bg-emerald-600/70 border-emerald-400 animate-pulse';
                  char = '☠️';
                } else if (cell.element === 'steam') {
                  bg = 'bg-slate-400/60 border-slate-200';
                  char = '💨';
                }

                return (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    className={`w-full aspect-square rounded flex items-center justify-center text-[10px] select-none border transition-colors cursor-pointer hover:scale-105 ${bg}`}
                    title={`(${x},${y}) Terrain: ${cell.terrain}, Element: ${cell.element || 'None'}`}
                  >
                    {char}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-4 flex items-center gap-3 w-full justify-between border-t border-slate-800/80 pt-3">
            <span className="text-slate-400 text-[11px]">Simulation Tick: <strong className="text-amber-400">{stepCount}</strong></span>
            <button
              onClick={handleSimulateStep}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Step (Next Tick)</span>
            </button>
          </div>
        </div>

        {/* Reaction Telemetry & Rules Reference */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Live Reaction Telemetry</span>
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans">
              {simLog}
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-[11px] text-slate-400">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">Interaction Rules (Pillar 2):</span>
            <ul className="space-y-1 list-disc list-inside text-slate-300">
              <li><strong className="text-amber-400">Fire + Grass</strong> ➔ Flammable spread, leaves Ash.</li>
              <li><strong className="text-sky-400">Ice + Water</strong> ➔ Freezes into walkable Ice tiles.</li>
              <li><strong className="text-yellow-400">Shock + Water</strong> ➔ Conducts through contiguous pool.</li>
              <li><strong className="text-amber-400">Fire + Toxic Gas</strong> ➔ Deflagration explosion (AoE 3x3).</li>
              <li><strong className="text-slate-300">Steam</strong> ➔ Obscures raycast Line-of-Sight.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GodElementalSandboxTab;
