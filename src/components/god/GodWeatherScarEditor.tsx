/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState } from '../../types';
import { triggerLightningStrike } from '../../canvas/weatherLightingRenderer';

export interface GodWeatherScarEditorProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerSuccessLog: (msg: string) => void;
  playSound: (s: any) => void;
  handleSetWeatherBiome: (weatherVal: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard', biomeVal?: 'forest' | 'desert' | 'tundra' | 'swamp' | 'town') => void;
}

export const GodWeatherScarEditor: React.FC<GodWeatherScarEditorProps> = ({
  gameState,
  setGameState,
  triggerSuccessLog,
  playSound,
  handleSetWeatherBiome,
}) => {
  return (
    <div className="space-y-3 font-mono">
      <h4 className="font-bold text-slate-350 uppercase tracking-widest text-[10px] border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
        <span>🌌 Sovereign Climate Rituals & Weather Engine</span>
      </h4>
      <p className="text-[10px] text-slate-400 leading-normal">
        Configure autonomous environmental shifts or channel high-tier elemental weather rituals instantly. All rituals cast for free under divine authority.
      </p>

      {/* Autonomous GM Weather Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
        <button
          onClick={() => {
            const currentVal = gameState.gmAutonomousWeather ?? true;
            const nextVal = !currentVal;
            setGameState(prev => ({ ...prev, gmAutonomousWeather: nextVal }));
            triggerSuccessLog(nextVal ? "Autonomous Weather Engine Engaged! 🌌" : "Autonomous Weather Engine Deactivated.");
            playSound('spell');
          }}
          className={`py-1.5 px-3 border rounded font-mono font-bold transition-all text-center cursor-pointer text-[10px] flex justify-between items-center ${
            (gameState.gmAutonomousWeather ?? true) 
              ? 'bg-indigo-950/50 border-indigo-500 text-indigo-300' 
              : 'bg-slate-950 border-slate-850 text-slate-400'
          }`}
        >
          <span>🌌 Autonomous GM Engine</span>
          <span>{(gameState.gmAutonomousWeather ?? true) ? 'ACTIVE (ON)' : 'OFF'}</span>
        </button>

        <div className="flex items-center justify-between bg-slate-950 border border-slate-850 p-1.5 px-2.5 rounded text-[10px] font-mono">
          <span className="text-slate-400">Ritual Turn Interval:</span>
          <select
            value={gameState.gmWeatherInterval || 120}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setGameState(prev => ({ ...prev, gmWeatherInterval: val }));
              triggerSuccessLog(`Ritual Turn Interval configured to ${val} turns`);
            }}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-1.5 py-0.5 outline-none cursor-pointer text-[10px] font-bold"
          >
            <option value="30">30 Turns (Short)</option>
            <option value="60">60 Turns (Medium)</option>
            <option value="120">120 Turns (Default - Long)</option>
            <option value="200">200 Turns (Extended)</option>
            <option value="300">300 Turns (Marathon)</option>
          </select>
        </div>
      </div>

      {/* Instant Divine Ritual Actions */}
      <span className="text-[9px] text-slate-500 font-bold block uppercase">✨ Instant Weather Alterations:</span>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
        <button
          onClick={() => handleSetWeatherBiome('clear')}
          className={`py-1.5 px-2 border rounded font-bold cursor-pointer transition-all ${
            gameState.weather === 'clear' ? 'bg-amber-950/40 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          ☀️ Clear Solar
        </button>

        <button
          onClick={() => handleSetWeatherBiome('rainy')}
          className={`py-1.5 px-2 border rounded font-bold cursor-pointer transition-all ${
            gameState.weather === 'rainy' ? 'bg-blue-950/40 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🌧️ Downpour Rain
        </button>

        <button
          onClick={() => handleSetWeatherBiome('foggy')}
          className={`py-1.5 px-2 border rounded font-bold cursor-pointer transition-all ${
            gameState.weather === 'foggy' ? 'bg-purple-950/40 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🌫️ Void Miasma Fog
        </button>

        <button
          onClick={() => handleSetWeatherBiome('snowy', 'tundra')}
          className={`py-1.5 px-2 border rounded font-bold cursor-pointer transition-all ${
            gameState.weather === 'snowy' ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          ❄️ Frostfall Snow
        </button>

        <button
          onClick={() => handleSetWeatherBiome('sandstorm', 'desert')}
          className={`py-1.5 px-2 border rounded font-bold cursor-pointer transition-all ${
            gameState.weather === 'sandstorm' ? 'bg-orange-950/40 border-orange-500 text-orange-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🏜️ Desert Sandstorm
        </button>

        <button
          onClick={() => handleSetWeatherBiome('blizzard', 'tundra')}
          className={`py-1.5 px-2 border rounded font-bold cursor-pointer transition-all ${
            gameState.weather === 'blizzard' ? 'bg-sky-950/40 border-sky-500 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🌨️ Glacial Blizzard
        </button>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[9px] text-slate-500 font-bold uppercase">⚡ Atmospheric Audio/Visual Test:</span>
        <button
          onClick={() => {
            triggerLightningStrike();
            triggerSuccessLog("⚡ Divine Lightning Strike summoned across the sky!");
          }}
          className="py-1 px-3 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/60 text-cyan-200 font-bold rounded text-[10px] cursor-pointer transition-all shadow-sm flex items-center gap-1"
        >
          <span>⚡ Strike Lightning Bolt</span>
        </button>
      </div>
    </div>
  );
};
