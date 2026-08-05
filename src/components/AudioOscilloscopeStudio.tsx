import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Zap,
  Play,
  Copy,
  Check,
  Radio,
  Sliders,
  Maximize2,
  Volume2,
  Compass,
} from 'lucide-react';
import {
  playSound,
  getAudioWaveformData,
  getAudioFrequencyData,
  playCustomSynthesizer,
  CustomSynthParams,
} from '../utils/audio';

type ViewMode = 'oscilloscope' | 'spectrum' | 'split';

interface AudioOscilloscopeStudioProps {
  onClose?: () => void;
}

export const AudioOscilloscopeStudio: React.FC<AudioOscilloscopeStudioProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // Soundboard Test Parameters
  const [testPitch, setTestPitch] = useState<number>(1.0);
  const [testPan, setTestPan] = useState<number>(0);
  const [testDistance, setTestDistance] = useState<number>(0);

  // Custom Synthesizer Controls
  const [synthParams, setSynthParams] = useState<CustomSynthParams>({
    type: 'square',
    startFreq: 440,
    endFreq: 110,
    freqRampType: 'exponential',
    attack: 0.01,
    decay: 0.08,
    sustain: 0.2,
    release: 0.15,
    volume: 0.2,
    filterType: 'lowpass',
    filterFreq: 1200,
    filterQ: 2.0,
  });

  const [copied, setCopied] = useState(false);
  const [peakDb, setPeakDb] = useState<number>(-60);
  const [isAmbientDroneActive, setIsAmbientDroneActive] = useState(false);

  // Preset Patches
  const PRESET_PATCHES: { label: string; icon: string; params: CustomSynthParams }[] = [
    {
      label: '8-Bit Laser',
      icon: '👾',
      params: {
        type: 'square',
        startFreq: 880,
        endFreq: 110,
        freqRampType: 'exponential',
        attack: 0.005,
        decay: 0.08,
        sustain: 0.1,
        release: 0.05,
        volume: 0.2,
        filterType: 'lowpass',
        filterFreq: 2400,
        filterQ: 3.0,
      },
    },
    {
      label: 'Arcane Pulse',
      icon: '🔮',
      params: {
        type: 'sine',
        startFreq: 320,
        endFreq: 640,
        freqRampType: 'exponential',
        attack: 0.05,
        decay: 0.15,
        sustain: 0.4,
        release: 0.3,
        volume: 0.22,
        filterType: 'bandpass',
        filterFreq: 1200,
        filterQ: 4.0,
      },
    },
    {
      label: 'Sub Bass Drop',
      icon: '🌋',
      params: {
        type: 'sawtooth',
        startFreq: 150,
        endFreq: 35,
        freqRampType: 'exponential',
        attack: 0.02,
        decay: 0.3,
        sustain: 0.5,
        release: 0.4,
        volume: 0.25,
        filterType: 'lowpass',
        filterFreq: 300,
        filterQ: 2.5,
      },
    },
    {
      label: 'Crystal Chime',
      icon: '💎',
      params: {
        type: 'triangle',
        startFreq: 1200,
        endFreq: 1200,
        freqRampType: 'linear',
        attack: 0.01,
        decay: 0.4,
        sustain: 0.2,
        release: 0.6,
        volume: 0.18,
        filterType: 'highpass',
        filterFreq: 1000,
        filterQ: 1.5,
      },
    },
    {
      label: 'Ethereal Drone',
      icon: '🌌',
      params: {
        type: 'sawtooth',
        startFreq: 220,
        endFreq: 225,
        freqRampType: 'linear',
        attack: 0.3,
        decay: 0.4,
        sustain: 0.7,
        release: 0.8,
        volume: 0.15,
        filterType: 'lowpass',
        filterFreq: 1400,
        filterQ: 5.0,
      },
    },
  ];

  // 60 FPS Visualizer Animation Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const waveBuffer = new Uint8Array(512);
    const freqBuffer = new Uint8Array(128);

    const render = () => {
      animId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      // Dark oscilloscope canvas clear with trail fade
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Grid background
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gridStep = 32;
      for (let x = 0; x < width; x += gridStep) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Center baseline
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Fetch WebAudio Analyser data
      getAudioWaveformData(waveBuffer);
      getAudioFrequencyData(freqBuffer);

      // Calculate Peak Level
      let maxAmplitude = 0;
      for (let i = 0; i < waveBuffer.length; i++) {
        const diff = Math.abs(waveBuffer[i] - 128);
        if (diff > maxAmplitude) maxAmplitude = diff;
      }
      const normAmp = maxAmplitude / 128;
      const currentDb = normAmp > 0.001 ? Math.round(20 * Math.log10(normAmp)) : -60;
      setPeakDb((prev) => Math.max(currentDb, prev * 0.9));

      if (viewMode === 'oscilloscope' || viewMode === 'split') {
        const targetH = viewMode === 'split' ? height * 0.55 : height;

        // Draw Time-Domain Waveform Trace
        ctx.shadowColor = '#00f6ff';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sliceWidth = width / waveBuffer.length;
        let x = 0;

        for (let i = 0; i < waveBuffer.length; i++) {
          const v = waveBuffer[i] / 128.0;
          const y = (v * targetH) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (viewMode === 'spectrum' || viewMode === 'split') {
        const startY = viewMode === 'split' ? height * 0.55 : 0;
        const specH = viewMode === 'split' ? height * 0.45 : height;

        // Spectrum Divider
        if (viewMode === 'split') {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
          ctx.beginPath();
          ctx.moveTo(0, startY);
          ctx.lineTo(width, startY);
          ctx.stroke();
        }

        // Draw Frequency Spectrum Bars
        const barCount = 48;
        const barWidth = (width / barCount) - 2;

        for (let i = 0; i < barCount; i++) {
          const value = freqBuffer[i * 2] || 0;
          const barHeight = (value / 255) * (specH - 10);
          const bx = i * (barWidth + 2) + 2;
          const by = height - barHeight;

          const grad = ctx.createLinearGradient(0, height, 0, startY);
          grad.addColorStop(0, '#06b6d4');
          grad.addColorStop(0.6, '#10b981');
          grad.addColorStop(1, '#f59e0b');

          ctx.fillStyle = grad;
          ctx.fillRect(bx, by, barWidth, barHeight);
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [viewMode]);

  const handlePlaySoundboard = (type: any) => {
    // Calculate synthetic dx for panning test
    const playerX = 10;
    const playerY = 10;
    const soundX = playerX + Math.round(testPan * 6);
    const soundY = playerY + testDistance;

    playSound(type, {
      x: soundX,
      y: soundY,
      playerX,
      playerY,
      pitch: testPitch,
    });
  };

  const handleTestCustomSynth = () => {
    playCustomSynthesizer(synthParams);
  };

  const handleCopySnippet = () => {
    const code = `// WebAudio Procedural Synth Patch
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = '${synthParams.type}';
osc.frequency.setValueAtTime(${synthParams.startFreq}, now);
osc.frequency.${synthParams.freqRampType}RampToValueAtTime(${synthParams.endFreq}, now + ${
      synthParams.attack + synthParams.decay + synthParams.release
    });
gain.gain.setValueAtTime(0.0001, now);
gain.gain.linearRampToValueAtTime(${synthParams.volume}, now + ${synthParams.attack});
gain.gain.exponentialRampToValueAtTime(0.0001, now + ${
      synthParams.attack + synthParams.decay + synthParams.release
    });
${
  synthParams.filterType !== 'none'
    ? `const filter = ctx.createBiquadFilter();
filter.type = '${synthParams.filterType}';
filter.frequency.setValueAtTime(${synthParams.filterFreq}, now);
filter.Q.setValueAtTime(${synthParams.filterQ}, now);
osc.connect(filter);
filter.connect(gain);`
    : `osc.connect(gain);`
}
gain.connect(destNode);
osc.start(now);
osc.stop(now + ${synthParams.attack + synthParams.decay + synthParams.release + 0.05});`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="oscilloscope-studio-container"
      className="bg-slate-950 border border-emerald-500/30 rounded-xl p-5 text-slate-100 shadow-2xl space-y-5 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-emerald-300 font-serif tracking-wide flex items-center gap-2">
              WebAudio Oscilloscope & Synthesizer Studio
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                Live DSP v4.3.6
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time vector waveform trace, FFT spectrum analyzer & synth patch designer
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('oscilloscope')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              viewMode === 'oscilloscope'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Waveform
          </button>
          <button
            onClick={() => setViewMode('spectrum')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              viewMode === 'spectrum'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Spectrum
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              viewMode === 'split'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dual View
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Visualizer Display */}
      <div className="relative bg-slate-900 border border-emerald-500/20 rounded-xl overflow-hidden shadow-inner">
        <canvas ref={canvasRef} width={768} height={200} className="w-full h-[200px] block" />

        {/* Real-time Peak Level & Specs Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Radio className="w-3.5 h-3.5" />
            <span>Scope: {viewMode.toUpperCase()}</span>
          </div>
          <div className="text-slate-500">|</div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Peak Level:</span>
            <span
              className={`font-bold ${
                peakDb > -6 ? 'text-red-400' : peakDb > -18 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {peakDb.toFixed(1)} dBFS
            </span>
          </div>
        </div>
      </div>

      {/* Soundboard Test Matrix & Spatial Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Spatial Test Sliders */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Compass className="w-4 h-4" /> Spatial & Pitch Modulator
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Pitch Multiplier:</span>
                <span className="text-emerald-300 font-mono">{testPitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={testPitch}
                onChange={(e) => setTestPitch(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-slate-800 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Stereo Panning:</span>
                <span className="text-cyan-300 font-mono">
                  {testPan === 0 ? 'Center' : testPan < 0 ? `L ${Math.abs(testPan)}` : `R ${testPan}`}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={testPan}
                onChange={(e) => setTestPan(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Distance Attenuation:</span>
                <span className="text-amber-300 font-mono">{testDistance} tiles</span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="1"
                value={testDistance}
                onChange={(e) => setTestDistance(parseInt(e.target.value))}
                className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
              />
            </div>
          </div>
        </div>

        {/* Soundboard Quick Catalog Grid */}
        <div className="md:col-span-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" /> Procedural Sound Catalog Soundboard
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click to trigger sound</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'door_open', label: '🚪 Door Open' },
              { id: 'door_close', label: '🚪 Door Close' },
              { id: 'wood_footstep', label: '🪵 Wood Step' },
              { id: 'stone_footstep', label: '🪨 Stone Step' },
              { id: 'wood_creak', label: '🏚️ Wood Creak' },
              { id: 'clock_tick', label: '⏰ Clock Tick' },
              { id: 'indoor_entry', label: '🏠 Room Entry' },
              { id: 'fire_crackle', label: '🔥 Fire Crackle' },
              { id: 'slash', label: '⚔️ Blade Slash' },
              { id: 'spell', label: '✨ Arcane Spell' },
              { id: 'critical_hit', label: '💥 Crit Hit' },
              { id: 'lightning_strike', label: '⚡ Lightning' },
              { id: 'boss_roar', label: '🐉 Boss Roar' },
              { id: 'chest_open', label: '📦 Open Chest' },
              { id: 'loot', label: '💰 Gold Coins' },
              { id: 'lute_pluck', label: '🪕 Lute Pluck' },
            ].map((sfx) => (
              <button
                key={sfx.id}
                onClick={() => handlePlaySoundboard(sfx.id)}
                className="px-2.5 py-1.5 bg-slate-950 hover:bg-emerald-950/80 hover:border-emerald-500/50 text-slate-200 rounded border border-slate-800 text-left truncate transition-colors font-mono text-[11px]"
              >
                {sfx.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive WebAudio Synthesizer Workbench */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-emerald-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Sliders className="w-4 h-4" /> Live WebAudio Custom Synthesizer Studio
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySnippet}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Code!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Code Snippet
                </>
              )}
            </button>

            <button
              onClick={handleTestCustomSynth}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Play Custom Patch
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span>✨</span> Procedural Synth Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PATCHES.map((patch) => (
              <button
                key={patch.label}
                onClick={() => setSynthParams(patch.params)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950/80 border border-slate-700 hover:border-emerald-500/50 text-slate-200 text-xs rounded font-mono transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{patch.icon}</span>
                <span>{patch.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Waveform & Sweep */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-emerald-400 block mb-1">Oscillator & Sweep</span>
            <div>
              <label className="text-slate-400 block mb-1">Waveform:</label>
              <select
                value={synthParams.type}
                onChange={(e) =>
                  setSynthParams({ ...synthParams, type: e.target.value as any })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              >
                <option value="sine">Sine Wave</option>
                <option value="square">Square Wave</option>
                <option value="sawtooth">Sawtooth Wave</option>
                <option value="triangle">Triangle Wave</option>
                <option value="noise">White Noise</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-400">
                <span>Start Freq:</span>
                <span className="text-emerald-300 font-mono">{synthParams.startFreq} Hz</span>
              </div>
              <input
                type="range"
                min="40"
                max="2000"
                step="10"
                value={synthParams.startFreq}
                onChange={(e) =>
                  setSynthParams({ ...synthParams, startFreq: parseInt(e.target.value) })
                }
                className="w-full accent-emerald-500 h-1 bg-slate-800 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400">
                <span>End Freq:</span>
                <span className="text-emerald-300 font-mono">{synthParams.endFreq} Hz</span>
              </div>
              <input
                type="range"
                min="20"
                max="2000"
                step="10"
                value={synthParams.endFreq}
                onChange={(e) =>
                  setSynthParams({ ...synthParams, endFreq: parseInt(e.target.value) })
                }
                className="w-full accent-emerald-500 h-1 bg-slate-800 rounded"
              />
            </div>
          </div>

          {/* Envelope ADSR */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-amber-400 block mb-1">Envelope (ADSR)</span>
            <div>
              <div className="flex justify-between text-slate-400">
                <span>Attack:</span>
                <span className="text-amber-300 font-mono">{synthParams.attack.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.5"
                step="0.01"
                value={synthParams.attack}
                onChange={(e) =>
                  setSynthParams({ ...synthParams, attack: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400">
                <span>Decay:</span>
                <span className="text-amber-300 font-mono">{synthParams.decay.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={synthParams.decay}
                onChange={(e) =>
                  setSynthParams({ ...synthParams, decay: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400">
                <span>Release:</span>
                <span className="text-amber-300 font-mono">{synthParams.release.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="1.0"
                step="0.02"
                value={synthParams.release}
                onChange={(e) =>
                  setSynthParams({ ...synthParams, release: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 h-1 bg-slate-800 rounded"
              />
            </div>
          </div>

          {/* Biquad Filter */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-cyan-400 block mb-1">Biquad Filter</span>
            <div>
              <label className="text-slate-400 block mb-1">Filter Type:</label>
              <select
                value={synthParams.filterType}
                onChange={(e) =>
                  setSynthParams({ ...synthParams, filterType: e.target.value as any })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              >
                <option value="none">Disabled (Bypass)</option>
                <option value="lowpass">Lowpass Filter</option>
                <option value="highpass">Highpass Filter</option>
                <option value="bandpass">Bandpass Filter</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-400">
                <span>Cutoff Freq:</span>
                <span className="text-cyan-300 font-mono">{synthParams.filterFreq} Hz</span>
              </div>
              <input
                type="range"
                min="100"
                max="8000"
                step="100"
                value={synthParams.filterFreq}
                onChange={(e) =>
                  setSynthParams({ ...synthParams, filterFreq: parseInt(e.target.value) })
                }
                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400">
                <span>Resonance Q:</span>
                <span className="text-cyan-300 font-mono">{synthParams.filterQ.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={synthParams.filterQ}
                onChange={(e) =>
                  setSynthParams({ ...synthParams, filterQ: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded"
              />
            </div>
          </div>

          {/* Output Gain & Volume */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-purple-400 block mb-1">Patch Volume</span>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Volume Gain:</span>
                <span className="text-purple-300 font-mono">
                  {Math.round(synthParams.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.02"
                value={synthParams.volume}
                onChange={(e) =>
                  setSynthParams({ ...synthParams, volume: parseFloat(e.target.value) })
                }
                className="w-full accent-purple-500 h-1 bg-slate-800 rounded"
              />
            </div>

            <div className="p-2 bg-slate-900 rounded text-[11px] text-slate-400 leading-relaxed border border-slate-800">
              💡 <span className="text-slate-200">Tip:</span> Adjust parameters live while triggering sounds to watch the green oscilloscope trace respond in real time!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
