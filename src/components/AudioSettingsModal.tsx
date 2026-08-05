import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sliders, Music, Disc, Activity } from 'lucide-react';
import {
  getAudioSettings,
  setMasterVolume,
  setSfxVolume,
  setAmbientVolume,
  setAudioMuted,
} from '../utils/audio';
import { AudioOscilloscopeStudio } from './AudioOscilloscopeStudio';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(getAudioSettings());
  const [activeTab, setActiveTab] = useState<'volume' | 'studio'>('volume');

  useEffect(() => {
    if (isOpen) {
      setSettings(getAudioSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMasterVolume(val);
    setSettings((prev) => ({ ...prev, masterVolume: val }));
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVolume(val);
    setSettings((prev) => ({ ...prev, sfxVolume: val }));
  };

  const handleAmbientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAmbientVolume(val);
    setSettings((prev) => ({ ...prev, ambientVolume: val }));
  };

  const handleMuteToggle = () => {
    const nextMuted = !settings.isAudioMuted;
    setAudioMuted(nextMuted);
    setSettings((prev) => ({ ...prev, isAudioMuted: nextMuted }));
  };

  return (
    <div
      id="audio-settings-overlay"
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="audio-settings-modal"
        className={`bg-slate-900 border border-emerald-500/30 shadow-2xl rounded-xl w-full p-6 text-slate-100 relative max-h-[90vh] overflow-y-auto transition-all ${
          activeTab === 'studio' ? 'max-w-4xl' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 mb-5 gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold font-serif tracking-wide text-emerald-300">
              Procedural Audio & Soundscapes
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('volume')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'volume'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Volume Controls
              </button>
              <button
                onClick={() => setActiveTab('studio')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'studio'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Studio & Oscilloscope
              </button>
            </div>

            <button
              id="btn-close-audio-settings"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {activeTab === 'studio' ? (
          <AudioOscilloscopeStudio />
        ) : (
          <>
            {/* Proximity notice */}
            <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-3 mb-5 text-xs text-emerald-200/90 leading-relaxed">
              <span className="font-semibold text-emerald-400">⚡ Spatial Proximity Audio:</span> Sound effects & distant actions are localized in 2D space. Off-screen events beyond your hearing range are muted.
            </div>

            <div className="space-y-5">
              {/* Mute Toggle */}
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  {settings.isAudioMuted ? (
                    <VolumeX className="w-5 h-5 text-red-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium">Global Audio State</div>
                    <div className="text-xs text-slate-400">
                      {settings.isAudioMuted ? 'Muted' : 'Audio Active'}
                    </div>
                  </div>
                </div>
                <button
                  id="btn-toggle-audio-mute"
                  onClick={handleMuteToggle}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    settings.isAudioMuted
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {settings.isAudioMuted ? 'Unmute Audio' : 'Mute All'}
                </button>
              </div>

              {/* Master Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-400" /> Master Volume
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {Math.round(settings.masterVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={handleMasterChange}
                  disabled={settings.isAudioMuted}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
                />
              </div>

              {/* SFX Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Disc className="w-4 h-4 text-amber-400" /> Sound Effects (SFX)
                  </span>
                  <span className="text-amber-400 font-mono">
                    {Math.round(settings.sfxVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={handleSfxChange}
                  disabled={settings.isAudioMuted}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
                />
              </div>

              {/* Ambient Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-cyan-400" /> Dynamic Soundscapes
                  </span>
                  <span className="text-cyan-400 font-mono">
                    {Math.round(settings.ambientVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.ambientVolume}
                  onChange={handleAmbientChange}
                  disabled={settings.isAudioMuted}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-40"
                />
              </div>

              {/* Open Studio Button */}
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('studio')}
                  className="w-full py-2 bg-slate-950 hover:bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  Launch Live WebAudio Oscilloscope & Synth Studio
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                id="btn-done-audio-settings"
                onClick={onClose}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-semibold rounded-lg text-sm transition-colors shadow-md"
              >
                Apply & Return
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
