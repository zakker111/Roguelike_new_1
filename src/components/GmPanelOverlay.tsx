import React, { useState, useEffect } from 'react';
import { 
  X, Cpu, Star, Sun, CloudRain, CloudFog, Snowflake, Heart, 
  Coins, Sparkles, ShieldAlert, Users, Swords, Skull, Flame, 
  Gem, Bomb, CheckCircle2, AlertCircle, Sparkle, RefreshCw, Sliders, MessageSquare, Terminal,
  Zap, Clock, Shield, Brain, Activity
} from 'lucide-react';
import { GameState, GameLogMessage } from '../types';
import { GM_COMMANDS, GmCommand } from '../data/gmCommands';
import { playSound } from '../utils/audio';
import { 
  getGMStorytellerState, 
  setGMStorytellerState, 
  forceGMEncounter, 
  GM_ENCOUNTERS_DATABASE,
  modifyChaosScore,
  triggerManualChaosSurge
} from '../utils/gmStoryteller';
import DifficultyTracker from './DifficultyTracker';

interface GmPanelOverlayProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: GameLogMessage['type']) => void;
  onClose: () => void;
  initialTab?: 'Chaos Matrix' | 'Weather Control' | 'Hero Blessings' | 'Spawning Actions' | 'Tactical Smites' | 'Autonomous GM';
}

// Map command icon string names to premium Lucide component instances
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun,
  CloudRain,
  CloudFog,
  Snowflake,
  Heart,
  Coins,
  Sparkles,
  ShieldAlert,
  Users,
  Swords,
  Skull,
  Flame,
  Gem,
  Bomb,
  RefreshCw,
  Clock
};

export default function GmPanelOverlay({ 
  gameState, 
  setGameState, 
  addLogMessage, 
  onClose,
  initialTab = 'Chaos Matrix'
}: GmPanelOverlayProps) {
  const [activeTab, setActiveTab] = useState<'Chaos Matrix' | 'Weather Control' | 'Hero Blessings' | 'Spawning Actions' | 'Tactical Smites' | 'Autonomous GM'>(initialTab);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Close GM Panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  // Read live Storyteller configuration state
  const currentGMObj = getGMStorytellerState();
  const [localBoredom, setLocalBoredom] = useState(currentGMObj.boredom);
  const [localTension, setLocalTension] = useState(currentGMObj.tension);
  const [localPersonality, setLocalPersonality] = useState(currentGMObj.personality);
  const [localDisableGifts, setLocalDisableGifts] = useState(!!currentGMObj.disableGifts);

  const updateStorytellerBoredom = (newVal: number) => {
    const val = Math.max(0, Math.min(100, newVal));
    setLocalBoredom(val);
    const gm = getGMStorytellerState();
    gm.boredom = val;
    setGMStorytellerState(gm);
  };

  const updateStorytellerTension = (newVal: number) => {
    const val = Math.max(0, Math.min(100, newVal));
    setLocalTension(val);
    const gm = getGMStorytellerState();
    gm.tension = val;
    setGMStorytellerState(gm);
  };

  const updateStorytellerPersonality = (pers: typeof localPersonality) => {
    setLocalPersonality(pers);
    const gm = getGMStorytellerState();
    gm.personality = pers;
    setGMStorytellerState(gm);
  };

  const toggleDisableGifts = () => {
    const nextVal = !localDisableGifts;
    setLocalDisableGifts(nextVal);
    const gm = getGMStorytellerState();
    gm.disableGifts = nextVal;
    setGMStorytellerState(gm);
    playSound('loot');
    setSessionLogs(prev => [
      `[${new Date().toLocaleTimeString()}] GM adjusted Loot Gifting constraint: ${nextVal ? "BLOCKED" : "ALLOWED"}.`,
      ...prev
    ]);
  };

  const [sessionLogs, setSessionLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] GM session established. Connected to live Oakhaven matrix.`
  ]);

  const stats = gameState.playerStats;
  const totalTurns = stats.turnsPlayed;
  
  // Calculate dynamic boredom metric based on turns & level
  const baseBoredom = Math.max(10, Math.min(100, 30 + (totalTurns % 45) - (stats.level * 4)));
  // Allow session commands to temporarily influence current panel reading
  const [bonusBoredomOffset, setBonusBoredomOffset] = useState(0);
  const boredomLevel = Math.max(0, Math.min(100, baseBoredom + bonusBoredomOffset));

  let gmMood = 'Observing';
  let moodColor = 'text-blue-400 border-blue-500/20';
  if (boredomLevel < 35) {
    gmMood = 'Thrilled';
    moodColor = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
  } else if (boredomLevel > 70) {
    gmMood = 'Restless';
    moodColor = 'text-amber-400 border-amber-500/20 bg-amber-500/5';
  } else {
    gmMood = 'Intrigued';
    moodColor = 'text-purple-400 border-purple-500/20 bg-purple-500/5';
  }

  // Derive heroic status titles
  const traits: string[] = [];
  if (stats.level >= 4) traits.push('Elder Paragon');
  else if (stats.level >= 2) traits.push('Valiant Crusader');
  if (stats.gold >= 250) traits.push('Royal Investor');
  if (gameState.followers.length > 0) traits.push('Vanguard General');
  if (gameState.biome === 'desert') traits.push('Desert Wanderer');
  if (traits.length === 0) traits.push('Aspirant Hero');

  // Chaos Matrix parameters & stats
  const chaosScore = gameState.chaosScore ?? 20;
  let chaosTierName = 'Tier 0: Calibrated';
  let chaosTierColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
  if (chaosScore >= 75) {
    chaosTierName = 'Tier 3: Abyssal Chaos';
    chaosTierColor = 'text-rose-400 bg-rose-950/60 border-rose-500/40 animate-pulse';
  } else if (chaosScore >= 50) {
    chaosTierName = 'Tier 2: High Surge';
    chaosTierColor = 'text-purple-400 bg-purple-950/60 border-purple-500/30';
  } else if (chaosScore >= 25) {
    chaosTierName = 'Tier 1: Volatile';
    chaosTierColor = 'text-amber-400 bg-amber-950/60 border-amber-500/30';
  }

  const abyssalCoeff = (1 + chaosScore * 0.015).toFixed(2);
  const hpBonusPct = Math.floor(chaosScore * 0.5);
  const atkBonus = Math.floor(chaosScore * 0.05);
  const mutationChancePct = Math.floor(chaosScore * 0.4);

  const cycleLength = 15;
  const turnsSinceLastCycle = totalTurns % cycleLength;
  const turnsUntilNextSurge = cycleLength - turnsSinceLastCycle;
  const surgeProgressPercent = (turnsSinceLastCycle / cycleLength) * 100;

  // Handlers for Chaos Matrix actions
  const handleModifyChaos = (delta: number, reason: string) => {
    playSound('spell');
    const { nextState, logMessage } = modifyChaosScore(gameState, delta, reason);
    setGameState(nextState);
    addLogMessage(logMessage.text, logMessage.type);
    setNotification({
      type: delta >= 0 ? 'error' : 'success',
      text: logMessage.text
    });
    setSessionLogs(prev => [
      `[${new Date().toLocaleTimeString()}] CHAOS ADJUSTMENT (${delta > 0 ? '+' : ''}${delta}): ${reason}`,
      ...prev
    ]);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleForceSurgeRoll = () => {
    playSound('spell');
    const surgeRes = triggerManualChaosSurge(gameState);
    if (surgeRes.mutatedState) {
      setGameState(prev => ({
        ...prev,
        ...surgeRes.mutatedState
      }));
    }
    addLogMessage(surgeRes.logText, surgeRes.effType === 'good' ? 'loot' : surgeRes.effType === 'bad' ? 'danger' : 'info');
    setNotification({
      type: surgeRes.effType === 'good' ? 'success' : 'error',
      text: `Surge d20 Roll [${surgeRes.roll}]: ${surgeRes.effName}`
    });
    setSessionLogs(prev => [
      `[${new Date().toLocaleTimeString()}] CHAOS SURGE DISCHARGE (d20 Roll ${surgeRes.roll}): ${surgeRes.effName}`,
      ...prev
    ]);
    setTimeout(() => setNotification(null), 4000);
  };

  // Trigger command sequence
  const handleExecuteCommand = (cmd: GmCommand) => {
    playSound('spell');
    
    // Execute logic on state
    const result = cmd.execute(gameState, setGameState, addLogMessage);

    const timestamp = new Date().toLocaleTimeString();
    if (result.success) {
      setNotification({ type: 'success', text: result.message });
      setSessionLogs(prev => [
        `[${timestamp}] SUCCESS: Spoke command "${cmd.name}".`,
        ...prev
      ]);
      // Update local boredom rating
      setBonusBoredomOffset(prev => prev + cmd.costBoredom);

      // Temporary popup duration
      setTimeout(() => {
        setNotification(null);
      }, 4000);
    } else {
      setNotification({ type: 'error', text: result.message });
      setSessionLogs(prev => [
        `[${timestamp}] REJECT: "${cmd.name}" failed: ${result.message}`,
        ...prev
      ]);
      playSound('bump');
      setTimeout(() => {
        setNotification(null);
      }, 4000);
    }
  };

  const filteredCommands = GM_COMMANDS.filter(cmd => cmd.category === activeTab);

  return (
    <div className="fixed inset-y-0 right-0 w-96 z-40 bg-slate-900/98 border-l border-slate-800 shadow-3xl p-5 flex flex-col gap-4 text-xs text-slate-300 font-mono animate-in slide-in-from-right duration-150 backdrop-blur-md">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-500 animate-spin-slow" />
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-200 block">Game Master Console</span>
            <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest leading-none">REAL-TIME SIMULATION ACCESS</p>
          </div>
        </div>
        <button 
          id="close-gm-btn"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Floating Instant Event Toast inside overlay */}
      {notification && (
        <div className={`p-3 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 animate-in fade-in slide-in-from-top-3 duration-200 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/45 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/45 border-rose-500/30 text-rose-300'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block uppercase tracking-wide">
              {notification.type === 'success' ? 'Command Accomplished' : 'Command Denied'}
            </span>
            <span>{notification.text}</span>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3.5 overflow-y-auto pr-1 scrollbar-thin">
        
        {/* State Indicators & Mood combined (4-metric HUD) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-500 uppercase font-bold block">GM SENTIMENT:</span>
            <div className={`text-center py-0.5 rounded border font-bold uppercase text-[9px] ${moodColor}`}>
              {gmMood}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-500 uppercase font-bold block">BOREDOM LEVEL:</span>
            <div className="py-0.5 flex flex-col items-center justify-center">
              <span className="font-bold text-purple-400 font-mono text-[10px]">{boredomLevel}%</span>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300" 
                  style={{ width: `${boredomLevel}%` }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-500 uppercase font-bold block">TENSION LEVEL:</span>
            <div className="py-0.5 flex flex-col items-center justify-center">
              <span className="font-bold text-rose-400 font-mono text-[10px]">{localTension}%</span>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                <div 
                  className="h-full bg-rose-500 transition-all duration-300" 
                  style={{ width: `${localTension}%` }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-500 uppercase font-bold block">CHAOS MATRIX:</span>
            <div className="py-0.5 flex flex-col items-center justify-center">
              <span className="font-bold text-amber-400 font-mono text-[10px]">{chaosScore} / 100 ({abyssalCoeff}x)</span>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-300" 
                  style={{ width: `${chaosScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reputation Traits Badges */}
        <div className="space-y-1">
          <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block">Acquired Heroic Traits</span>
          <div className="flex flex-wrap gap-1 font-sans">
            {traits.map((t, idx) => (
              <div 
                key={idx} 
                className="bg-slate-950/60 border border-slate-850 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[8px] text-slate-300 hover:border-amber-500/20 transition-all"
              >
                <Star className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Tab Selector */}
        <div className="space-y-1">
          <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block">Spell & Engine Categories</span>
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850/60 font-sans">
            {(['Chaos Matrix', 'Weather Control', 'Hero Blessings', 'Spawning Actions', 'Tactical Smites', 'Autonomous GM'] as const).map((cat) => {
              const labelMap: Record<string, string> = {
                'Chaos Matrix': '🌀 Chaos Matrix',
                'Weather Control': '⛅ Weather',
                'Hero Blessings': '✨ Blessings',
                'Spawning Actions': '🧟 Spawns',
                'Tactical Smites': '💥 Smites',
                'Autonomous GM': '🔮 Storyteller Engine'
              };
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveTab(cat);
                    playSound('loot');
                  }}
                  className={`py-1.5 rounded-lg text-center font-bold text-[8.5px] uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === cat
                      ? cat === 'Chaos Matrix'
                        ? 'bg-gradient-to-r from-amber-600 via-purple-600 to-pink-600 border border-amber-400 text-white font-black shadow-md shadow-purple-900/20'
                        : cat === 'Autonomous GM'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-400 text-white font-black shadow-md shadow-purple-900/20'
                        : 'bg-purple-600 border border-purple-500 text-white font-black shadow-md shadow-purple-900/15'
                      : 'border border-transparent text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                  }`}
                >
                  {labelMap[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'Chaos Matrix' ? (
          /* ==================== CHAOS MATRIX DASHBOARD ==================== */
          <div className="space-y-3">
            {/* Global Threat & Difficulty Matrix */}
            <div className="max-h-64 overflow-y-auto">
              <DifficultyTracker
                turnsPlayed={gameState.playerStats.turnsPlayed}
                realTimeSeconds={gameState.playerStats.realTimeSeconds}
                depth={gameState.playerStats.depth}
                defeatedEnemiesCount={gameState.defeatedEnemiesCount}
                clearedCampsCount={gameState.clearedCamps?.length || 0}
                playerStats={gameState.playerStats}
                currentWeapon={gameState.currentWeapon}
              />
            </div>

            {/* Live Chaos Matrix Dial & Adjusters */}
            <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-3 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold uppercase text-[9.5px]">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>Abyssal Chaos Matrix Gauge</span>
                </div>
                <span className={`text-[8px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${chaosTierColor}`}>
                  {chaosTierName}
                </span>
              </div>

              {/* Chaos Gauge Visual Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9.5px] font-mono">
                  <span className="text-slate-400">Atmospheric Chaos:</span>
                  <span className="font-extrabold text-purple-300">{chaosScore} / 100 pts ({abyssalCoeff}x Threat)</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div 
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                    style={{ width: `${Math.max(4, chaosScore)}%` }}
                  />
                </div>
              </div>

              {/* Quick Adjustment Controls */}
              <div className="space-y-1 pt-1">
                <span className="text-[8.5px] text-slate-500 uppercase font-black block">Direct Matrix Modulators</span>
                <div className="grid grid-cols-5 gap-1 font-sans">
                  <button
                    onClick={() => handleModifyChaos(-10, "GM Stability Adjustment")}
                    className="py-1 px-1 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 rounded text-[8.5px] font-bold text-emerald-300 transition-all cursor-pointer text-center"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleModifyChaos(10, "GM Surge Boost")}
                    className="py-1 px-1 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/30 rounded text-[8.5px] font-bold text-amber-300 transition-all cursor-pointer text-center"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleModifyChaos(25, "GM Heavy Escalation")}
                    className="py-1 px-1 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 rounded text-[8.5px] font-bold text-purple-300 transition-all cursor-pointer text-center"
                  >
                    +25
                  </button>
                  <button
                    onClick={() => handleModifyChaos(-chaosScore, "GM Calibration to Zero")}
                    className="py-1 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[8.5px] font-bold text-slate-300 transition-all cursor-pointer text-center"
                  >
                    Reset 0
                  </button>
                  <button
                    onClick={() => handleModifyChaos(100 - chaosScore, "GM Overcharge")}
                    className="py-1 px-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 rounded text-[8.5px] font-bold text-rose-300 transition-all cursor-pointer text-center"
                  >
                    Max 100
                  </button>
                </div>
              </div>
            </div>

            {/* Aetheric Surge Countdown & Manual Trigger */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] text-purple-400 font-bold uppercase font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Aetheric Core Accumulator
                </span>
                <span className="text-[9.5px] font-mono text-purple-300 font-bold">
                  {turnsUntilNextSurge} turn{turnsUntilNextSurge > 1 ? 's' : ''} to Surge
                </span>
              </div>

              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div 
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(4, surgeProgressPercent))}%` }}
                />
              </div>

              <button
                onClick={handleForceSurgeRoll}
                className="w-full py-2 bg-gradient-to-r from-purple-900/80 via-pink-900/80 to-purple-900/80 hover:from-purple-800 hover:to-pink-800 border border-purple-500/40 rounded-lg text-white font-extrabold text-[9.5px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-purple-950/50 flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Force Cosmic Chaos Surge (d20 Roll)</span>
              </button>
            </div>

            {/* Active Matrix Stat Boosts & Mitigations */}
            <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-2.5 space-y-1.5">
              <span className="text-[8.5px] text-amber-400 font-bold uppercase tracking-wider block font-sans">
                Active Abyssal Mutators & Threat Scaling
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[7.5px] uppercase">Monster HP Boost</span>
                  <span className="font-extrabold text-purple-300 font-mono">+{hpBonusPct}% HP</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[7.5px] uppercase">Monster ATK Bonus</span>
                  <span className="font-extrabold text-rose-400 font-mono">+{atkBonus} ATK</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[7.5px] uppercase">Elite Mutation Rate</span>
                  <span className="font-extrabold text-amber-400 font-mono">{mutationChancePct}%</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[7.5px] uppercase">Threat Multiplier</span>
                  <span className="font-extrabold text-emerald-400 font-mono">{abyssalCoeff}x</span>
                </div>
              </div>
            </div>

            {/* Chaos Spells / Interventions */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center bg-slate-950/30 p-1 px-2 rounded-lg border border-slate-850/40">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">Chaos Intervention Spells</span>
                <span className="text-[8.5px] text-purple-400 font-bold uppercase">{filteredCommands.length} Spells</span>
              </div>

              <div className="space-y-1.5">
                {filteredCommands.map((command) => {
                  const CmdIcon = IconMap[command.iconName] || Cpu;
                  return (
                    <div 
                      key={command.id}
                      className="bg-slate-950/40 border border-slate-850/80 rounded-xl p-2.5 hover:border-purple-500/30 transition-all flex flex-col gap-1.5 relative overflow-hidden group hover:bg-slate-950/70"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-purple-400 shrink-0 group-hover:bg-purple-950/15 group-hover:border-purple-500/20 transition-all">
                          <CmdIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-200 tracking-wide text-[10px] block truncate group-hover:text-purple-300 transition-colors">
                            {command.name}
                          </span>
                          <p className="text-[9px] font-sans text-slate-400 leading-snug mt-0.5">
                            {command.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                        <div className="flex items-center gap-1 text-[8.5px] text-slate-500 uppercase font-sans">
                          <span>Shift:</span>
                          <span className="text-purple-400 font-mono font-bold">{command.costBoredom} pts</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExecuteCommand(command)}
                          className="py-0.5 px-2 bg-purple-900/40 hover:bg-purple-800/80 border border-purple-700/50 rounded text-slate-200 hover:text-white font-bold text-[8.5px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                        >
                          Trigger Spell
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chaos History Feed */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 space-y-1.5">
              <span className="text-[8.5px] text-purple-400 font-bold uppercase tracking-wider block font-mono flex items-center gap-1">
                <Activity className="w-3 h-3" /> Recent Core Discharges
              </span>
              <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[8.5px] scrollbar-thin">
                {currentGMObj.chaosHistory && currentGMObj.chaosHistory.length > 0 ? (
                  currentGMObj.chaosHistory.map((hist, idx) => (
                    <div 
                      key={idx}
                      className={`p-1 rounded border flex items-center justify-between ${
                        hist.type === 'good'
                          ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300'
                          : hist.type === 'bad'
                          ? 'bg-rose-950/30 border-rose-500/20 text-rose-300'
                          : 'bg-slate-900/50 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="truncate flex items-center gap-1">
                        <span className="px-1 py-0.25 bg-slate-900 rounded text-slate-400 font-bold text-[7.5px]">
                          T.{hist.turn}
                        </span>
                        <span className="font-bold">{hist.name}</span>
                      </div>
                      <span className="font-extrabold px-1 rounded bg-slate-900/80 shrink-0 text-[8px]">
                        d{hist.roll}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic text-center py-1.5 text-[8.5px]">
                    No recent Chaos discharges logged.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'Autonomous GM' ? (
          /* ==================== AUTONOMOUS GM STORYTELLER DASHBOARD ==================== */
          <div className="space-y-4">
            <div className="bg-slate-950/50 border border-purple-500/20 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-905 pb-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-slate-200 text-[10px] uppercase">Engine State Adjusters</span>
              </div>

              {/* Personality dropdown selector */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-black block">Storyteller Base Personality</label>
                <div className="grid grid-cols-5 gap-1">
                  {(['Mischievous', 'Sadistic', 'Benevolent', 'Intrigued', 'Apathetic'] as const).map((pers) => (
                    <button
                      key={pers}
                      onClick={() => {
                        updateStorytellerPersonality(pers);
                        playSound('loot');
                      }}
                      className={`py-1.5 rounded text-[8px] font-sans font-bold border transition-all cursor-pointer ${
                        localPersonality === pers
                          ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                          : 'bg-slate-950 border-slate-905 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pers.slice(0, 4)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Boredom & Tension adjusters */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Boredom: {localBoredom}%</span>
                  <div className="flex bg-slate-950 border border-slate-905 rounded p-0.5 font-sans">
                    <button
                      onClick={() => updateStorytellerBoredom(localBoredom - 10)}
                      className="px-2 py-0.5 text-zinc-500 hover:text-white cursor-pointer font-bold"
                    >
                      -10
                    </button>
                    <div className="flex-1 text-center font-bold font-mono py-0.5 text-[10px] text-slate-300">
                      Change
                    </div>
                    <button
                      onClick={() => updateStorytellerBoredom(localBoredom + 10)}
                      className="px-2 py-0.5 text-zinc-500 hover:text-white cursor-pointer font-bold"
                    >
                      +10
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Tension: {localTension}%</span>
                  <div className="flex bg-slate-950 border border-slate-905 rounded p-0.5 font-sans">
                    <button
                      onClick={() => updateStorytellerTension(localTension - 10)}
                      className="px-2 py-0.5 text-zinc-500 hover:text-white cursor-pointer font-bold"
                    >
                      -10
                    </button>
                    <div className="flex-1 text-center font-bold font-mono py-0.5 text-[10px] text-slate-300">
                      Change
                    </div>
                    <button
                      onClick={() => updateStorytellerTension(localTension + 10)}
                      className="px-2 py-0.5 text-zinc-500 hover:text-white cursor-pointer font-bold"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>

              {/* Restrict Loot Gifting Toggle */}
              <div className="pt-3 border-t border-slate-900/50 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-zinc-400 uppercase font-bold block">Restrict Item & Resource Gifts</span>
                  <span className="text-[8px] text-slate-500 block leading-tight">If active, GM won't spawn item drops or gold packages.</span>
                </div>
                <button
                  type="button"
                  onClick={toggleDisableGifts}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-all cursor-pointer relative shrink-0 ${
                    localDisableGifts ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <div 
                    className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-all absolute top-0.5 ${
                      localDisableGifts ? 'left-5' : 'left-0.5'
                    }`} 
                  />
                </button>
              </div>
            </div>

            {/* GM Internal Thoughts Terminal Feed */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-purple-400 font-mono text-[9px] uppercase font-bold">
                <Terminal className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                <span>Storyteller Thoughts Feed (Decisions Log)</span>
              </div>
              <div className="h-28 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1.5 p-1 bg-slate-950 border border-slate-905 rounded select-text leading-normal scrollbar-thin">
                {currentGMObj.thoughts && currentGMObj.thoughts.length > 0 ? (
                  currentGMObj.thoughts.slice(0, 8).map((thought, idx) => (
                    <div key={idx} className="border-b border-slate-900 pb-1 text-purple-300">
                      <span className="text-pink-500 font-bold font-sans">» </span>{thought}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 italic">No thoughts compiled yet. Perform active turns to generate logs...</div>
                )}
              </div>
            </div>

            {/* Manual Encounter Invoker Buttons */}
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-950/30 p-1 px-2.5 rounded-lg border border-slate-850/40">
                <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wider font-sans">Debug Force Intervention</span>
                <span className="text-[9px] text-purple-400 font-bold uppercase">{GM_ENCOUNTERS_DATABASE.length} Events Loaded</span>
              </div>

              <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-0.5">
                {GM_ENCOUNTERS_DATABASE.map((enc) => (
                  <button
                    key={enc.id}
                    onClick={() => {
                      playSound('spell');
                      const debugRes = forceGMEncounter(enc.id, gameState);
                      if (debugRes.success) {
                        setNotification({ type: 'success', text: `Triggered Encounter: ${enc.name}` });
                        if (debugRes.mutatedState) {
                          setGameState(prev => ({
                            ...prev,
                            ...debugRes.mutatedState
                          }));
                        }
                        if (debugRes.logText) {
                          addLogMessage(debugRes.logText, 'danger');
                        }
                      } else {
                        setNotification({ type: 'error', text: `Rejected: Conditions unmet (e.g. Health ratio)` });
                      }
                    }}
                    className="w-full text-left bg-slate-950 hover:bg-slate-950/85 hover:border-purple-500/40 border border-slate-855 p-2 rounded-lg text-slate-300 hover:text-white flex items-center justify-between transition-all group font-mono text-[9px] cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block group-hover:text-purple-300">
                        ⚡ {enc.name}
                      </span>
                      <span className="text-[8px] text-slate-500 leading-none block mt-0.5">
                        {enc.description.slice(0, 52)}...
                      </span>
                    </div>
                    <span className="text-[8px] bg-purple-950/65 group-hover:bg-purple-900 border border-purple-900/30 px-1.5 py-0.5 rounded text-purple-400 font-black shrink-0 transition-colors">
                      FORCE
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ==================== Available Categorized Commands Listing ==================== */
          <div className="space-y-2.5">
            <div className="flex justify-between items-center bg-slate-950/30 p-1 px-2.5 rounded-lg border border-slate-850/40">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Available Intervention Spells</span>
              <span className="text-[9px] text-purple-400 font-bold uppercase">{filteredCommands.length} Spells</span>
            </div>

            <div className="space-y-2">
              {filteredCommands.map((command) => {
                const CmdIcon = IconMap[command.iconName] || Cpu;
                return (
                  <div 
                    key={command.id}
                    className="bg-slate-950/40 border border-slate-850/80 rounded-xl p-3 hover:border-purple-500/30 transition-all flex flex-col gap-2 relative overflow-hidden group hover:bg-slate-950/70"
                  >
                    {/* Subtle hover background highlight */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0.03 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {/* Header info of command */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-purple-400 shrink-0 group-hover:bg-purple-950/15 group-hover:border-purple-500/20 transition-all">
                        <CmdIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-200 tracking-wide text-[11px] block truncate group-hover:text-purple-300 transition-colors">
                          {command.name}
                        </span>
                        <p className="text-[10px] font-sans text-slate-400 leading-relaxed mt-0.5">
                          {command.description}
                        </p>
                      </div>
                    </div>

                    {/* Action trigger & cost indices */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-900 mt-0.5">
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-sans">
                        <span>Boredom shift:</span>
                        <span className="text-purple-400 font-mono font-bold">{command.costBoredom} pts</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExecuteCommand(command)}
                        className="py-1 px-2.5 bg-purple-900 bg-opacity-40 hover:bg-opacity-80 border border-purple-800 rounded-lg text-slate-200 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow-purple-500/10 active:scale-95"
                      >
                        Trigger Spell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Intent Emission History Log */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[10px] text-purple-400 uppercase tracking-wider block">Simulated Emission Stream</span>
            <button 
              type="button"
              onClick={() => {
                setSessionLogs([`[${new Date().toLocaleTimeString()}] Logs purged. Matrix listening intact.`]);
                playSound('loot');
              }}
              className="text-[8px] text-slate-500 hover:text-slate-300 transition-colors font-bold uppercase tracking-wider cursor-pointer"
            >
              Clear Logs
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto bg-slate-950/80 rounded-xl border border-slate-850 p-2 text-[9px] space-y-1 font-mono text-slate-400 leading-relaxed scrollbar-thin">
            {sessionLogs.map((log, idx) => (
              <div 
                key={idx} 
                className="hover:text-amber-200 transition-colors py-0.5 first:text-purple-400 border-b border-slate-950/40 last:border-b-0"
              >
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer information */}
      <div className="border-t border-slate-850 pt-3 text-[9px] font-mono text-slate-500 text-center flex flex-col gap-1">
        <div className="flex items-center justify-between p-1 bg-slate-950/30 rounded border border-slate-850">
          <span>Simulation Connection:</span>
          <span className="text-emerald-500 font-bold uppercase tracking-wider">● LIVE STREAM</span>
        </div>
        <span>Trigger spells to instantly reshape Oakhaven's world rules.</span>
      </div>

    </div>
  );
}
