/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  Sliders,
  Eye,
  RotateCcw,
  Zap,
  Check,
  Compass,
  Palette,
  CloudRain
} from 'lucide-react';
import { GameState } from '../../types';
import { visualsConfig, VisualPreset } from '../../canvas/visualsConfig';
import { TimeOfDayPhase, VibrancyMode } from '../../canvas/colorGradingEngine';

export interface GodVisualsStudioTabProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerSuccessLog: (msg: string) => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

export const GodVisualsStudioTab: React.FC<GodVisualsStudioTabProps> = ({
  gameState,
  setGameState,
  triggerSuccessLog,
  addLogMessage,
}) => {
  // Local state reflecting visualsConfig to trigger component re-renders
  const [vibrancyMode, setVibrancyMode] = useState<VibrancyMode>(
    visualsConfig.colorGrading.getVibrancyMode()
  );
  const [activePreset, setActivePreset] = useState<VisualPreset | 'custom'>('vivid');

  // Sliders state
  const [godRayIntensity, setGodRayIntensity] = useState<number>(
    visualsConfig.colorGrading.getGodRayIntensityMultiplier()
  );
  const [gradeAlpha, setGradeAlpha] = useState<number>(1.0);
  const [bloomIntensity, setBloomIntensity] = useState<number>(
    visualsConfig.bloom.getIntensityMultiplier()
  );
  const [vignetteDarkness, setVignetteDarkness] = useState<number>(
    visualsConfig.vignette.getDarknessMultiplier()
  );
  const [shadowOpacity, setShadowOpacity] = useState<number>(
    visualsConfig.shadows.getOpacityMultiplier()
  );
  const [shadowLength, setShadowLength] = useState<number>(
    visualsConfig.shadows.getLengthMultiplier()
  );
  const [waterShimmerIntensity, setWaterShimmerIntensity] = useState<number>(
    visualsConfig.waterShimmer.getIntensityMultiplier()
  );
  const [waterCausticsIntensity, setWaterCausticsIntensity] = useState<number>(
    visualsConfig.waterCaustics.getIntensityMultiplier()
  );
  const [particleDensity, setParticleDensity] = useState<number>(
    visualsConfig.biomeAtmosphere.getDensityMultiplier()
  );

  // Toggles state
  const [colorGradingEnabled, setColorGradingEnabled] = useState<boolean>(
    visualsConfig.colorGrading.getIsEnabled()
  );
  const [bloomEnabled, setBloomEnabled] = useState<boolean>(
    visualsConfig.bloom.getIsEnabled()
  );
  const [vignetteEnabled, setVignetteEnabled] = useState<boolean>(
    visualsConfig.vignette.getIsEnabled()
  );
  const [shadowsEnabled, setShadowsEnabled] = useState<boolean>(
    visualsConfig.shadows.getIsEnabled()
  );
  const [waterShimmerEnabled, setWaterShimmerEnabled] = useState<boolean>(
    visualsConfig.waterShimmer.getIsEnabled()
  );
  const [waterCausticsEnabled, setWaterCausticsEnabled] = useState<boolean>(
    visualsConfig.waterCaustics.getIsEnabled()
  );
  const [particlesEnabled, setParticlesEnabled] = useState<boolean>(
    visualsConfig.biomeAtmosphere.getIsEnabled()
  );

  // Quick preset applicator
  const applyPreset = (preset: VisualPreset) => {
    visualsConfig.applyPreset(preset);
    setActivePreset(preset);

    // Sync local state
    setVibrancyMode(visualsConfig.colorGrading.getVibrancyMode());
    setColorGradingEnabled(visualsConfig.colorGrading.getIsEnabled());
    setGodRayIntensity(visualsConfig.colorGrading.getGodRayIntensityMultiplier());
    setBloomEnabled(visualsConfig.bloom.getIsEnabled());
    setBloomIntensity(visualsConfig.bloom.getIntensityMultiplier());
    setVignetteEnabled(visualsConfig.vignette.getIsEnabled());
    setVignetteDarkness(visualsConfig.vignette.getDarknessMultiplier());
    setShadowsEnabled(visualsConfig.shadows.getIsEnabled());
    setShadowOpacity(visualsConfig.shadows.getOpacityMultiplier());
    setShadowLength(visualsConfig.shadows.getLengthMultiplier());
    setWaterShimmerEnabled(visualsConfig.waterShimmer.getIsEnabled());
    setWaterShimmerIntensity(visualsConfig.waterShimmer.getIntensityMultiplier());
    setWaterCausticsEnabled(visualsConfig.waterCaustics.getIsEnabled());
    setWaterCausticsIntensity(visualsConfig.waterCaustics.getIntensityMultiplier());
    setParticlesEnabled(visualsConfig.biomeAtmosphere.getIsEnabled());
    setParticleDensity(visualsConfig.biomeAtmosphere.getDensityMultiplier());

    triggerSuccessLog(`Applied Visual Preset: ${preset.toUpperCase()}`);
    if (addLogMessage) {
      addLogMessage(`🎨 Visuals preset switched to ${preset.toUpperCase()}`, 'system');
    }
  };

  // Reset all
  const handleResetAll = () => {
    visualsConfig.resetAll();
    setActivePreset('vivid');
    setVibrancyMode('vivid');
    setColorGradingEnabled(true);
    setGodRayIntensity(1.0);
    setGradeAlpha(1.0);
    setBloomEnabled(true);
    setBloomIntensity(1.0);
    setVignetteEnabled(true);
    setVignetteDarkness(1.0);
    setShadowsEnabled(true);
    setShadowOpacity(1.0);
    setShadowLength(1.0);
    setWaterShimmerEnabled(true);
    setWaterShimmerIntensity(1.0);
    setWaterCausticsEnabled(true);
    setWaterCausticsIntensity(1.0);
    setParticlesEnabled(true);
    setParticleDensity(1.0);

    triggerSuccessLog('Reset all visual shaders and multipliers to defaults!');
  };

  // Astronomical Time Warper
  const setGameTimeTo = (minuteOfDay: number, name: string) => {
    setGameState((prev) => ({
      ...prev,
      gameTime: minuteOfDay,
    }));
    triggerSuccessLog(`Clock set to ${name} (${Math.floor(minuteOfDay / 60)}:${(minuteOfDay % 60).toString().padStart(2, '0')})`);
  };

  const currentMinute = gameState.gameTime ?? 720;
  const currentHour = Math.floor(currentMinute / 60);
  const currentMinsFormatted = (currentMinute % 60).toString().padStart(2, '0');
  const biomeProfile = visualsConfig.colorGrading.getBiomeProfile(gameState);
  const timeState = visualsConfig.colorGrading.calculateAtmosphericProfile(gameState);

  return (
    <div className="space-y-6 font-mono pb-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rose-900/50 gap-3">
        <div>
          <h3 className="text-sm font-black text-rose-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>VISUALS & SHADERS STUDIO</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time shader calibrator, astronomical time-of-day previewer, and visual pass profiler.
          </p>
        </div>

        <button
          onClick={handleResetAll}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* 1. Instant Preset Switcher */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Visual Presets</span>
          </label>
          <span className="text-[10px] text-slate-400">
            Active: <span className="text-amber-400 font-bold uppercase">{activePreset}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => applyPreset('vivid')}
            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
              activePreset === 'vivid'
                ? 'bg-amber-950/70 border-amber-500/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span>🌟 Vivid</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Rich fantasy colors, high bloom & god rays</div>
          </button>

          <button
            onClick={() => applyPreset('cinematic')}
            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
              activePreset === 'cinematic'
                ? 'bg-purple-950/70 border-purple-500/80 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span>🎬 Cinematic</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Subdued contrast, deep perimeter vignettes</div>
          </button>

          <button
            onClick={() => applyPreset('retro_clean')}
            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
              activePreset === 'retro_clean'
                ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span>🕹️ Retro Clean</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Pixel-pure tiles without shaders or bloom</div>
          </button>

          <button
            onClick={() => applyPreset('performance')}
            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
              activePreset === 'performance'
                ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span>⚡ Performance</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Maximum 60 FPS for low-power mobile</div>
          </button>
        </div>
      </div>

      {/* 2. Astronomical 24h Time-of-Day Quick Warper */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-yellow-400" />
            <span>Astronomical 24h Time-of-Day Quick Warper</span>
          </label>
          <span className="text-xs font-mono font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {currentHour}:{currentMinsFormatted} • Phase: <span className="uppercase text-rose-400">{timeState.phase}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <button
            onClick={() => setGameTimeTo(390, 'Dawn')} // 06:30
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-600/60 rounded text-center cursor-pointer transition-all"
          >
            <div className="flex items-center justify-center gap-1 text-amber-300 text-xs font-bold">
              <Sunrise className="w-3.5 h-3.5" />
              <span>Dawn</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">06:30</div>
          </button>

          <button
            onClick={() => setGameTimeTo(570, 'Morning')} // 09:30
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-yellow-500/60 rounded text-center cursor-pointer transition-all"
          >
            <div className="flex items-center justify-center gap-1 text-yellow-300 text-xs font-bold">
              <Sun className="w-3.5 h-3.5" />
              <span>Morning</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">09:30</div>
          </button>

          <button
            onClick={() => setGameTimeTo(780, 'Midday')} // 13:00
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/60 rounded text-center cursor-pointer transition-all"
          >
            <div className="flex items-center justify-center gap-1 text-orange-300 text-xs font-bold">
              <Sun className="w-3.5 h-3.5" />
              <span>Midday</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">13:00</div>
          </button>

          <button
            onClick={() => setGameTimeTo(1095, 'Golden Hour')} // 18:15
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 rounded text-center cursor-pointer transition-all"
          >
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold">
              <Sunset className="w-3.5 h-3.5" />
              <span>Golden</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">18:15</div>
          </button>

          <button
            onClick={() => setGameTimeTo(1230, 'Twilight')} // 20:30
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/60 rounded text-center cursor-pointer transition-all"
          >
            <div className="flex items-center justify-center gap-1 text-indigo-300 text-xs font-bold">
              <Moon className="w-3.5 h-3.5" />
              <span>Twilight</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">20:30</div>
          </button>

          <button
            onClick={() => setGameTimeTo(60, 'Midnight')} // 01:00
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/60 rounded text-center cursor-pointer transition-all"
          >
            <div className="flex items-center justify-center gap-1 text-blue-300 text-xs font-bold">
              <Moon className="w-3.5 h-3.5" />
              <span>Night</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">01:00</div>
          </button>
        </div>
      </div>

      {/* 3. Live Shader Multipliers & Pass Toggles */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-900">
          <Sliders className="w-3.5 h-3.5 text-rose-400" />
          <span>Live Shader Passes & Multipliers</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Volumetric Sunbeams / God Rays */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={colorGradingEnabled}
                  onChange={(e) => {
                    setColorGradingEnabled(e.target.checked);
                    visualsConfig.colorGrading.setEnabled(e.target.checked);
                    setActivePreset('custom');
                  }}
                  className="rounded border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <span>Volumetric Sunbeams & Dust</span>
              </label>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {godRayIntensity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={godRayIntensity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setGodRayIntensity(val);
                visualsConfig.colorGrading.setGodRayIntensityMultiplier(val);
                setActivePreset('custom');
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0.0x (Off)</span>
              <span>1.0x (Standard)</span>
              <span>3.0x (Ultra Intense)</span>
            </div>
          </div>

          {/* Luminous HDR Bloom */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-855 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-yellow-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bloomEnabled}
                  onChange={(e) => {
                    setBloomEnabled(e.target.checked);
                    visualsConfig.bloom.setEnabled(e.target.checked);
                    setActivePreset('custom');
                  }}
                  className="rounded border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <span>Luminous HDR Bloom Glow</span>
              </label>
              <span className="text-xs font-bold text-yellow-400 font-mono">
                {bloomIntensity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={bloomIntensity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setBloomIntensity(val);
                visualsConfig.bloom.setIntensityMultiplier(val);
                setActivePreset('custom');
              }}
              className="w-full accent-yellow-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0.0x (Off)</span>
              <span>1.0x (Standard)</span>
              <span>3.0x (Maximum Radiance)</span>
            </div>
          </div>

          {/* Atmospheric Perimeter Vignette */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={vignetteEnabled}
                  onChange={(e) => {
                    setVignetteEnabled(e.target.checked);
                    visualsConfig.vignette.setEnabled(e.target.checked);
                    setActivePreset('custom');
                  }}
                  className="rounded border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <span>Perimeter Vignette Darkness</span>
              </label>
              <span className="text-xs font-bold text-purple-400 font-mono">
                {vignetteDarkness.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2.5"
              step="0.05"
              value={vignetteDarkness}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVignetteDarkness(val);
                visualsConfig.vignette.setDarknessMultiplier(val);
                setActivePreset('custom');
              }}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0.0x (Clear)</span>
              <span>1.0x (Balanced)</span>
              <span>2.5x (Deep Darkness)</span>
            </div>
          </div>

          {/* Directional Sun/Moon Shadows */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shadowsEnabled}
                  onChange={(e) => {
                    setShadowsEnabled(e.target.checked);
                    visualsConfig.shadows.setEnabled(e.target.checked);
                    setActivePreset('custom');
                  }}
                  className="rounded border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <span>24h Sun / Moon Drop Shadows</span>
              </label>
              <span className="text-xs font-bold text-slate-400 font-mono">
                Op: {shadowOpacity.toFixed(2)}x • Len: {shadowLength.toFixed(2)}x
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Opacity:</span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={shadowOpacity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setShadowOpacity(val);
                    visualsConfig.shadows.setOpacityMultiplier(val);
                    setActivePreset('custom');
                  }}
                  className="w-full accent-slate-400 cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Length:</span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={shadowLength}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setShadowLength(val);
                    visualsConfig.shadows.setLengthMultiplier(val);
                    setActivePreset('custom');
                  }}
                  className="w-full accent-slate-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Water Caustics & Shimmer */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={waterCausticsEnabled}
                  onChange={(e) => {
                    setWaterCausticsEnabled(e.target.checked);
                    visualsConfig.waterCaustics.setEnabled(e.target.checked);
                    setActivePreset('custom');
                  }}
                  className="rounded border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <span>Underwater Caustic Webs</span>
              </label>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {waterCausticsIntensity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2.5"
              step="0.05"
              value={waterCausticsIntensity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setWaterCausticsIntensity(val);
                visualsConfig.waterCaustics.setIntensityMultiplier(val);
                setActivePreset('custom');
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0.0x (Flat)</span>
              <span>1.0x (Standard)</span>
              <span>2.5x (Bright Webbing)</span>
            </div>
          </div>

          {/* Biome Atmosphere Particles */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={particlesEnabled}
                  onChange={(e) => {
                    setParticlesEnabled(e.target.checked);
                    visualsConfig.biomeAtmosphere.setEnabled(e.target.checked);
                    setActivePreset('custom');
                  }}
                  className="rounded border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <span>Biome Micro-Atmosphere Motes</span>
              </label>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {particleDensity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={particleDensity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setParticleDensity(val);
                visualsConfig.biomeAtmosphere.setDensityMultiplier(val);
                setActivePreset('custom');
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0.0x (Off)</span>
              <span>1.0x (Standard)</span>
              <span>3.0x (Dense Blizzard/Swarm)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Biome Profile Inspector */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-900">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>Active Biome Lighting & Shader Profile</span>
          </label>
          <span className="text-xs font-mono font-bold text-teal-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 uppercase">
            Biome: {gameState.biome || 'forest'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Primary Tone Tint:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-200 font-mono text-[11px] truncate">{biomeProfile.primaryTint}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Accent Edge Tint:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-200 font-mono text-[11px] truncate">{biomeProfile.accentTint}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">God Ray Beam Color:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-200 font-mono text-[11px] truncate">{biomeProfile.godRayColor}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Dust Mote Color:</span>
            <div className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0"
                style={{ backgroundColor: biomeProfile.godRayDustColor }}
              />
              <span className="text-slate-200 font-mono text-[11px]">{biomeProfile.godRayDustColor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
