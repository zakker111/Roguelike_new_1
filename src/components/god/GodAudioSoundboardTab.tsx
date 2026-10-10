import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Search,
  Activity,
  Radio,
  Sliders,
  Sparkles,
  StopCircle,
  Clock,
  Zap,
} from 'lucide-react';
import {
  playSound,
  getAudioContext,
  getAudioWaveformData,
  getAudioFrequencyData,
  getAudioSettings,
  setMasterVolume,
  setSfxVolume,
  toggleAudioMute,
  getVoiceManager,
  playCustomSynthesizer,
  VoiceManagerStats,
} from '../../utils/audio';
import { SOUND_CATALOG, SoundMetadata, SoundType } from '../../data/soundCatalog';

export interface GodAudioSoundboardTabProps {
  triggerSuccessLog?: (msg: string) => void;
}

type SoundCategoryFilter = 'all' | 'combat' | 'movement' | 'environment' | 'crafting' | 'ui';

interface TriggerLogItem {
  id: string;
  soundId: string;
  name: string;
  timestamp: string;
  pitch: number;
  volume: number;
  distance: number;
}

export const GodAudioSoundboardTab: React.FC<GodAudioSoundboardTabProps> = ({
  triggerSuccessLog,
}) => {
  // Category & search filter
  const [activeCategory, setActiveCategory] = useState<SoundCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Audio modulation settings
  const [pitch, setPitch] = useState<number>(1.0);
  const [volumeMultiplier, setVolumeMultiplier] = useState<number>(1.0);
  const [simulatedDistance, setSimulatedDistance] = useState<number>(0);
  const [stereoPan, setStereoPan] = useState<number>(0);
  const [isIndoorEvent, setIsIndoorEvent] = useState<boolean>(false);

  // Audio system settings
  const [audioSettings, setAudioSettings] = useState(() => getAudioSettings());

  // Voice allocation telemetry
  const [voiceStats, setVoiceStats] = useState<VoiceManagerStats>(() =>
    getVoiceManager().getStats()
  );

  // Trigger history log
  const [triggerLog, setTriggerLog] = useState<TriggerLogItem[]>([]);
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);

  // Canvas visualizer mode
  const [visualizerMode, setVisualizerMode] = useState<'waveform' | 'spectrum'>('waveform');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Custom synth mini-tester
  const [customOscType, setCustomOscType] = useState<OscillatorType | 'noise'>('sawtooth');
  const [customFreq, setCustomFreq] = useState<number>(440);

  // Poll voice manager stats
  useEffect(() => {
    const interval = setInterval(() => {
      setVoiceStats(getVoiceManager().getStats());
      setAudioSettings(getAudioSettings());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Canvas oscilloscope render loop
  useEffect(() => {
    let animId: number;
    const waveData = new Uint8Array(512);

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, width, height);

          // Grid lines
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.stroke();

          if (visualizerMode === 'waveform') {
            getAudioWaveformData(waveData);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#38bdf8';
            ctx.beginPath();

            const sliceWidth = width / waveData.length;
            let x = 0;

            for (let i = 0; i < waveData.length; i++) {
              const v = waveData[i] / 128.0;
              const y = (v * height) / 2;

              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
              x += sliceWidth;
            }

            ctx.stroke();
          } else {
            getAudioFrequencyData(waveData);

            const barCount = 48;
            const barWidth = width / barCount;

            for (let i = 0; i < barCount; i++) {
              const dataIdx = Math.floor((i / barCount) * (waveData.length / 2));
              const barHeight = (waveData[dataIdx] / 255.0) * (height - 4);
              const x = i * barWidth;
              const y = height - barHeight;

              const hue = 180 + (i / barCount) * 120;
              ctx.fillStyle = `hsl(${hue}, 85%, 55%)`;
              ctx.fillRect(x, y, barWidth - 1, barHeight);
            }
          }
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [visualizerMode]);

  // Handle Play Sound
  const handlePlaySound = (sound: SoundMetadata) => {
    // Ensure context is running on user interaction
    getAudioContext();

    // Map simulated distance and pan to coordinates
    // player at (0, 0), sound at (distance * cos(pan), distance * sin(pan))
    const rad = (stereoPan * Math.PI) / 4;
    const soundX = Math.round(simulatedDistance * Math.cos(rad));
    const soundY = Math.round(simulatedDistance * Math.sin(rad));

    playSound(sound.id as SoundType, {
      volume: volumeMultiplier,
      pitch,
      x: simulatedDistance > 0 ? soundX : undefined,
      y: simulatedDistance > 0 ? soundY : undefined,
      playerX: simulatedDistance > 0 ? 0 : undefined,
      playerY: simulatedDistance > 0 ? 0 : undefined,
      isIndoor: isIndoorEvent,
      maxDistance: 14,
    });

    setLastPlayedId(sound.id);
    setTimeout(() => {
      setLastPlayedId((prev) => (prev === sound.id ? null : prev));
    }, 400);

    const timeStr = new Date().toLocaleTimeString();
    setTriggerLog((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        soundId: sound.id,
        name: sound.name,
        timestamp: timeStr,
        pitch,
        volume: volumeMultiplier,
        distance: simulatedDistance,
      },
      ...prev.slice(0, 7),
    ]);

    if (triggerSuccessLog) {
      triggerSuccessLog(`Triggered sound: [${sound.name}] (Pitch: ${pitch}x)`);
    }
  };

  const handleTestCustomSynth = () => {
    getAudioContext();
    playCustomSynthesizer({
      type: customOscType,
      startFreq: customFreq,
      endFreq: customFreq * 0.75,
      freqRampType: 'exponential',
      attack: 0.02,
      decay: 0.1,
      sustain: 0.3,
      release: 0.2,
      volume: 0.35 * volumeMultiplier,
      filterType: isIndoorEvent ? 'lowpass' : 'none',
      filterFreq: isIndoorEvent ? 750 : 20000,
      filterQ: 1.5,
    });
  };

  const handleResetModulations = () => {
    setPitch(1.0);
    setVolumeMultiplier(1.0);
    setSimulatedDistance(0);
    setStereoPan(0);
    setIsIndoorEvent(false);
  };

  const filteredSounds = SOUND_CATALOG.filter((sound) => {
    const matchesCategory = activeCategory === 'all' || sound.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      sound.name.toLowerCase().includes(q) ||
      sound.id.toLowerCase().includes(q) ||
      sound.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const categories: { id: SoundCategoryFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All SFX', count: SOUND_CATALOG.length },
    { id: 'combat', label: 'Combat', count: SOUND_CATALOG.filter((s) => s.category === 'combat').length },
    { id: 'movement', label: 'Movement', count: SOUND_CATALOG.filter((s) => s.category === 'movement').length },
    { id: 'environment', label: 'Environment', count: SOUND_CATALOG.filter((s) => s.category === 'environment').length },
    { id: 'crafting', label: 'Crafting', count: SOUND_CATALOG.filter((s) => s.category === 'crafting').length },
    { id: 'ui', label: 'UI & Fanfares', count: SOUND_CATALOG.filter((s) => s.category === 'ui').length },
  ];

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-3 sm:p-5 text-slate-200">
      {/* Top Banner: Master Audio Bar & Voice Allocation Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Panel 1: Master Controls */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Audio Engine Master
              </h3>
            </div>
            <button
              onClick={() => {
                const nextMute = toggleAudioMute();
                setAudioSettings((prev) => ({ ...prev, isAudioMuted: nextMute }));
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                audioSettings.isAudioMuted
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                  : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              }`}
            >
              {audioSettings.isAudioMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              <span>{audioSettings.isAudioMuted ? 'MUTED' : 'UNMUTED'}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Master Volume</span>
                <span className="font-mono text-sky-300">{Math.round(audioSettings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.masterVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMasterVolume(val);
                  setAudioSettings((prev) => ({ ...prev, masterVolume: val }));
                }}
                className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>SFX Channel Volume</span>
                <span className="font-mono text-sky-300">{Math.round(audioSettings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.sfxVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSfxVolume(val);
                  setAudioSettings((prev) => ({ ...prev, sfxVolume: val }));
                }}
                className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Panel 2: Voice Allocation Telemetry */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Voice Concurrency Telemetry
              </h3>
            </div>
            <button
              onClick={() => {
                getVoiceManager().stopAllVoices();
                setVoiceStats(getVoiceManager().getStats());
              }}
              className="px-2 py-0.5 rounded text-[10px] font-bold border border-rose-700/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer flex items-center gap-1"
              title="Cut off all currently active synthesized voices"
            >
              <StopCircle className="w-3 h-3" />
              <span>Kill All</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-slate-400">Active Voices</div>
              <div className="text-sm font-mono font-bold text-emerald-400">
                {voiceStats.activeVoices} <span className="text-[10px] text-slate-500">{`/ ${voiceStats.maxVoices}`}</span>
              </div>
            </div>
            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-slate-400">Allocations</div>
              <div className="text-sm font-mono font-bold text-sky-400">
                {voiceStats.totalAllocations}
              </div>
            </div>
            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-slate-400">Voice Thefts</div>
              <div className="text-sm font-mono font-bold text-amber-400">
                {voiceStats.voiceThefts}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 truncate mt-1">
            Active: {voiceStats.activeChannelSounds.length > 0 ? voiceStats.activeChannelSounds.join(', ') : 'None (idle graph)'}
          </div>
        </div>

        {/* Panel 3: Live Oscilloscope / Spectrum Visualizer */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Oscilloscope Visualizer
              </span>
            </div>
            <div className="flex gap-1 text-[10px]">
              <button
                onClick={() => setVisualizerMode('waveform')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  visualizerMode === 'waveform' ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Wave
              </button>
              <button
                onClick={() => setVisualizerMode('spectrum')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  visualizerMode === 'spectrum' ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Spectrum
              </button>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={280}
            height={68}
            className="w-full h-16 rounded border border-slate-800 bg-slate-950"
          />
        </div>
      </div>

      {/* Modulation Parameter Controls Bar */}
      <div className="bg-slate-950/90 border border-sky-500/30 rounded-xl p-3 sm:p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
              Live Audition Modulation Parameters
            </h3>
          </div>
          <button
            onClick={handleResetModulations}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset Sliders</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Pitch */}
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Pitch Multiplier</span>
              <span className="font-mono text-sky-300">{pitch.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="2.5"
              step="0.05"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Volume Multiplier */}
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Audition Volume</span>
              <span className="font-mono text-sky-300">{Math.round(volumeMultiplier * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={volumeMultiplier}
              onChange={(e) => setVolumeMultiplier(parseFloat(e.target.value))}
              className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Spatial Distance */}
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Distance Falloff</span>
              <span className="font-mono text-amber-300">
                {simulatedDistance === 0 ? 'Point-Blank (0m)' : `${simulatedDistance} tiles`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="18"
              step="1"
              value={simulatedDistance}
              onChange={(e) => setSimulatedDistance(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Stereo Panning */}
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Stereo Pan</span>
              <span className="font-mono text-cyan-300">
                {stereoPan === 0 ? 'Center' : stereoPan < 0 ? `${Math.abs(Math.round(stereoPan * 100))}% Left` : `${Math.round(stereoPan * 100)}% Right`}
              </span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.1"
              value={stereoPan}
              onChange={(e) => setStereoPan(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Acoustic Occlusion */}
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between text-slate-400">
              <span>Acoustic Filter</span>
              <span className="font-mono text-emerald-300">{isIndoorEvent ? 'Indoor Muffle' : 'Clear Line'}</span>
            </div>
            <button
              onClick={() => setIsIndoorEvent((prev) => !prev)}
              className={`w-full py-1 text-xs font-bold rounded cursor-pointer transition-colors mt-1 border ${
                isIndoorEvent
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isIndoorEvent ? '🚪 Indoor (650Hz Lowpass)' : '🌲 Outdoor (Unmuffled)'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Soundboard Header: Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                activeCategory === cat.id
                  ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search sound ID, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Soundboard Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {filteredSounds.map((sound) => {
          const isRecentlyPlayed = lastPlayedId === sound.id;
          const categoryColors: Record<string, string> = {
            combat: 'border-rose-900/40 hover:border-rose-500/60 bg-rose-950/10',
            movement: 'border-amber-900/40 hover:border-amber-500/60 bg-amber-950/10',
            environment: 'border-emerald-900/40 hover:border-emerald-500/60 bg-emerald-950/10',
            crafting: 'border-purple-900/40 hover:border-purple-500/60 bg-purple-950/10',
            ui: 'border-sky-900/40 hover:border-sky-500/60 bg-sky-950/10',
          };

          return (
            <div
              key={sound.id}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                categoryColors[sound.category] || 'border-slate-800 bg-slate-950'
              } ${isRecentlyPlayed ? 'ring-2 ring-sky-400 scale-[1.02]' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-slate-200 truncate" title={sound.name}>
                    {sound.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 shrink-0">
                    {sound.category}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-sky-400/80 mb-1 truncate">
                  id: {sound.id}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                  {sound.description}
                </p>
              </div>

              <button
                onClick={() => handlePlaySound(sound)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow ${
                  isRecentlyPlayed
                    ? 'bg-sky-500 text-white shadow-sky-500/30'
                    : 'bg-slate-900 hover:bg-sky-600 text-slate-200 hover:text-white border border-slate-700 hover:border-sky-500'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Audition SFX</span>
              </button>
            </div>
          );
        })}
      </div>

      {filteredSounds.length === 0 && (
        <div className="text-center py-10 text-slate-500 text-xs">
          No sound effects match query "{searchQuery}" in category "{activeCategory}".
        </div>
      )}

      {/* Bottom Section: Custom Synth Waveform Generator & Trigger History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2">
        {/* Custom Oscillator Waveform Player */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Raw Oscillator Synth Sandbox
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Oscillator Shape</label>
              <select
                value={customOscType}
                onChange={(e) => setCustomOscType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
              >
                <option value="sawtooth">Sawtooth (Aggressive / Synth Lead)</option>
                <option value="square">Square (8-Bit Retro Pulse)</option>
                <option value="triangle">Triangle (Flute / Sub)</option>
                <option value="sine">Sine (Pure Harmonic Tone)</option>
                <option value="noise">White Noise (Impact / Burst)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Center Frequency</span>
                <span className="font-mono text-amber-400">{customFreq} Hz</span>
              </div>
              <input
                type="range"
                min="60"
                max="1800"
                step="20"
                value={customFreq}
                onChange={(e) => setCustomFreq(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleTestCustomSynth}
            className="w-full py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Play Procedural Synth Tone</span>
          </button>
        </div>

        {/* Live Trigger History */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Recent Audition Log
            </h4>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-32 text-xs font-mono">
            {triggerLog.length === 0 ? (
              <div className="text-slate-600 text-[11px] italic py-2">
                No sounds auditioned in this session yet. Click any sound above to test!
              </div>
            ) : (
              triggerLog.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/60 text-[11px]"
                >
                  <span className="text-sky-300 truncate">{log.name}</span>
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] shrink-0">
                    <span>{log.pitch}x</span>
                    <span>{log.distance > 0 ? `${log.distance}m` : '0m'}</span>
                    <span className="text-slate-600">{log.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GodAudioSoundboardTab;
