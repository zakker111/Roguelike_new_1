import React, { useState } from 'react';
import { Play, Sparkles, Key, Anchor, RefreshCw, Award, CheckCircle, ShieldAlert, Dice5, HelpCircle, Scroll, Flame, Zap } from 'lucide-react';
import { playSound } from '../../utils/audio';
import { GameState } from '../../types';
import { SPELL_SCROLLS } from '../../utils/spellScrolls';

export interface GodMinigamesTabProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onTriggerLockpicking?: () => void;
  onTriggerFishing?: () => void;
  onTriggerScriptorium?: (scrollTemplateId?: string) => void;
  addLogMessage?: (msg: string, type?: string) => void;
  triggerSuccessLog?: (msg: string) => void;
}

export const GodMinigamesTab: React.FC<GodMinigamesTabProps> = ({
  gameState,
  setGameState,
  onTriggerLockpicking,
  onTriggerFishing,
  onTriggerScriptorium,
  addLogMessage,
  triggerSuccessLog
}) => {
  const [lastTestOutcome, setLastTestOutcome] = useState<string | null>(null);
  const [selectedScrollTemplate, setSelectedScrollTemplate] = useState<string>(SPELL_SCROLLS[0]?.id || 'scroll_fireball');

  const lockpickCount = gameState.inventoryMaterials['mat_lockpick'] || 0;
  const skeletonKeyCount = gameState.inventoryMaterials['mat_skeleton_key'] || 0;
  const fishingPoleCount = gameState.inventoryMaterials['mat_fishing_pole'] || 0;
  const parchmentCount = gameState.inventoryMaterials['mat_parchment'] || gameState.inventoryMaterials['mat_leather'] || 0;
  const dragonScaleCount = gameState.inventoryMaterials['mat_dragonscale'] || 0;
  const feyBoneCount = gameState.inventoryMaterials['mat_feybone'] || 0;
  const shadowCatCount = gameState.inventoryCatalysts['cat_shadow'] || 0;
  const fireCatCount = gameState.inventoryCatalysts['cat_fire'] || 0;

  const handleGrantLockpicks = () => {
    playSound('craft');
    setGameState(prev => ({
      ...prev,
      inventoryMaterials: {
        ...prev.inventoryMaterials,
        mat_lockpick: (prev.inventoryMaterials['mat_lockpick'] || 0) + 10,
        mat_skeleton_key: (prev.inventoryMaterials['mat_skeleton_key'] || 0) + 2
      }
    }));
    if (triggerSuccessLog) triggerSuccessLog('Granted +10 Tension Lockpicks and +2 Master Skeleton Keys!');
    if (addLogMessage) addLogMessage('🔑 Granted +10 Tension Lockpicks and +2 Skeleton Keys to inventory.', 'loot');
  };

  const handleGrantFishingGear = () => {
    playSound('craft');
    setGameState(prev => ({
      ...prev,
      inventoryMaterials: {
        ...prev.inventoryMaterials,
        mat_fishing_pole: (prev.inventoryMaterials['mat_fishing_pole'] || 0) + 1
      },
      fishingPoleDurability: 10
    }));
    if (triggerSuccessLog) triggerSuccessLog('Granted +1 Solid Fishing Pole with 10/10 Durability!');
    if (addLogMessage) addLogMessage('🎣 Granted +1 Solid Fishing Pole (10 uses) to inventory.', 'loot');
  };

  const handleGrantScriptoriumReagents = () => {
    playSound('spell');
    setGameState(prev => ({
      ...prev,
      inventoryMaterials: {
        ...prev.inventoryMaterials,
        mat_parchment: (prev.inventoryMaterials['mat_parchment'] || 0) + 10,
        mat_leather: (prev.inventoryMaterials['mat_leather'] || 0) + 10,
        mat_dragonscale: (prev.inventoryMaterials['mat_dragonscale'] || 0) + 5,
        mat_feybone: (prev.inventoryMaterials['mat_feybone'] || 0) + 5,
        mat_obsidian: (prev.inventoryMaterials['mat_obsidian'] || 0) + 5,
      },
      inventoryCatalysts: {
        ...prev.inventoryCatalysts,
        cat_shadow: (prev.inventoryCatalysts['cat_shadow'] || 0) + 5,
        cat_fire: (prev.inventoryCatalysts['cat_fire'] || 0) + 5,
        cat_frost: (prev.inventoryCatalysts['cat_frost'] || 0) + 5,
        cat_lightning: (prev.inventoryCatalysts['cat_lightning'] || 0) + 5,
      }
    }));
    if (triggerSuccessLog) triggerSuccessLog('Granted Arcane Scriptorium Reagents: +10 Parchment, +5 Dragonscale, +5 Feybone, +5 Catalysts!');
    if (addLogMessage) addLogMessage('📜 Granted +10 Parchment, +5 Dragonscale, +5 Feybone, and +5 Elemental Catalysts.', 'loot');
  };

  return (
    <div id="god-minigames-tab" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-start gap-3 shadow-lg">
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg shrink-0 text-amber-400">
          <Dice5 className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
              Dedicated Minigame Testing Hub & Sandbox
            </h3>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono font-bold">
              DEV TESTBED
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Centralized hub for launching, testing, balancing, and auditing all interactive minigames in isolation. Launch any minigame anytime without needing specific dungeon chests or water tiles.
          </p>
        </div>
      </div>

      {/* Minigames Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Arcane Scriptorium Minigame Card */}
        <div className="p-4 bg-slate-950/60 border border-amber-500/30 rounded-xl space-y-4 flex flex-col justify-between hover:border-amber-500/50 transition-all">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                  <Scroll className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">Arcane Scriptorium Minigame</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Glyph Rune Tracing & Vector Slate</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-950 text-amber-300 border border-amber-800">
                Interactive
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Test vector rune node linking, arcane instability tremor gauge, harmonic pulsing audio resonance, multi-stage glyph chains, and Masterwork (+30% power, 0 MP cost) scroll inking.
            </p>

            <div className="space-y-2 pt-1 font-mono text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Parchment:</span>
                  <span className="text-amber-300 font-bold">{parchmentCount}</span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Catalysts:</span>
                  <span className="text-purple-300 font-bold">{shadowCatCount + fireCatCount}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Target Scroll Template:</label>
                <select
                  value={selectedScrollTemplate}
                  onChange={(e) => setSelectedScrollTemplate(e.target.value)}
                  className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                >
                  {SPELL_SCROLLS.map(scroll => (
                    <option key={scroll.id} value={scroll.id}>
                      {scroll.name} ({scroll.element})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                id="btn-launch-scriptorium-test"
                onClick={() => {
                  if (onTriggerScriptorium) {
                    onTriggerScriptorium(selectedScrollTemplate);
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-500 active:scale-98 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Scriptorium Test</span>
              </button>
              <button
                id="btn-grant-scriptorium-reagents-cheat"
                onClick={handleGrantScriptoriumReagents}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer hover:scale-105"
                title="Grant +10 Parchment & +5 Catalysts"
              >
                +10 Inks 📜
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Launches interactive rune drawing slate with full sandbox difficulty selectors.
            </p>
          </div>
        </div>

        {/* Lockpicking Minigame Card */}
        <div className="p-4 bg-slate-950/60 border border-purple-500/30 rounded-xl space-y-4 flex flex-col justify-between hover:border-purple-500/50 transition-all">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-300">Lockpicking Tumbler Minigame</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Tension Pick & Cylinder Physics</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-950 text-purple-300 border border-purple-800">
                Interactive
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Test cylinder angle rotation, pick durability decay, sweet-spot tension feedback, vibration/shake dynamics, lockpick breakage, and instant Master Skeleton Key bypasses.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Lockpicks:</span>
                <span className="text-purple-300 font-bold">{lockpickCount}</span>
              </div>
              <div className="p-2 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Skeleton Keys:</span>
                <span className="text-amber-300 font-bold">{skeletonKeyCount}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                id="btn-launch-lockpicking-test"
                onClick={() => {
                  if (onTriggerLockpicking) {
                    onTriggerLockpicking();
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Lockpicking Test</span>
              </button>
              <button
                id="btn-grant-lockpicks-cheat"
                onClick={handleGrantLockpicks}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer hover:scale-105"
                title="Grant +10 Lockpicks and +2 Skeleton Keys"
              >
                +10 Picks 🔑
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Testing mode provides unlimited lockpicks (99x) for smooth debugging.
            </p>
          </div>
        </div>

        {/* Fishing Minigame Card */}
        <div className="p-4 bg-slate-950/60 border border-sky-500/30 rounded-xl space-y-4 flex flex-col justify-between hover:border-sky-500/50 transition-all">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
                  <Anchor className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-sky-300">Wilderness Fishing Minigame</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Real-time Bobber Reel Bar</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-950 text-sky-300 border border-sky-800">
                Interactive
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Test casting mechanics, bite timer triggers, sweet-spot green bar tracking, tension progress building, catch loot roll tables, and line escape tolerances.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Fishing Poles:</span>
                <span className="text-sky-300 font-bold">{fishingPoleCount}</span>
              </div>
              <div className="p-2 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Pole Durability:</span>
                <span className="text-emerald-300 font-bold">{gameState.fishingPoleDurability ?? 7}/7</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                id="btn-launch-fishing-test"
                onClick={() => {
                  if (onTriggerFishing) {
                    onTriggerFishing();
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Fishing Test</span>
              </button>
              <button
                id="btn-grant-fishing-gear-cheat"
                onClick={handleGrantFishingGear}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer hover:scale-105"
                title="Grant +1 Solid Fishing Pole (10 durability)"
              >
                +1 Rod 🎣
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Launches active fishing sequence instantly with all loot rewards enabled.
            </p>
          </div>
        </div>
      </div>

      {/* Minigame Engine Info & Sandbox Diagnostics */}
      <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Minigame Subsystem Diagnostics & Keybinds</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>📜 Scriptorium Key Controls</span>
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-300">
              <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">0 - 9</kbd>: Quick-Hit Glyph Nodes by Index</li>
              <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Mouse / Touch Drag</kbd>: Trace Glowing Conduit Line</li>
              <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">R</kbd>: Reset Stroke / Re-align Leylines</li>
              <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Esc</kbd>: Exit Scriptorium</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="font-bold text-purple-300 flex items-center gap-1.5">
              <span>🔑 Lockpicking Key Controls</span>
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-300">
              <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">A</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">D</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Mouse Drag</kbd>: Rotate Pick Angle</li>
              <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">W</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Click & Hold</kbd>: Apply Cylinder Tension</li>
              <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">K</kbd>: Consume Master Skeleton Key</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <span>🎣 Fishing Key Controls</span>
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-300">
              <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Click & Hold</kbd>: Lift Reel Bar Upward</li>
              <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Release</kbd>: Allow Reel Bar to Sink Downward</li>
              <li><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Escape</kbd>: Abort and step away</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
