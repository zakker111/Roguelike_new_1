/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Scroll } from 'lucide-react';
import { playSound } from '../../../utils/audio';
import { GameState } from '../../../types';
import { SPELL_SCROLLS, getSpellScrollAsEquipmentItem } from '../../../utils/spellScrolls';

export interface GodScriptoriumCardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onTriggerScriptorium?: (scrollTemplateId?: string) => void;
  onMinimizeGodPanel?: () => void;
  addLogMessage?: (msg: string, type?: string) => void;
  triggerSuccessLog?: (msg: string) => void;
  setLastTestOutcome: (msg: string | null) => void;
}

export const GodScriptoriumCard: React.FC<GodScriptoriumCardProps> = ({
  gameState,
  setGameState,
  onTriggerScriptorium,
  onMinimizeGodPanel,
  addLogMessage,
  triggerSuccessLog,
  setLastTestOutcome,
}) => {
  const [selectedScrollTemplate, setSelectedScrollTemplate] = useState<string>(SPELL_SCROLLS[0]?.id || 'scroll_fireball');
  const [inlineScriptStage, setInlineScriptStage] = useState<number>(1);
  const [inlineConnectedNodes, setInlineConnectedNodes] = useState<number[]>([]);
  const [inlineInstability, setInlineInstability] = useState<number>(0);
  const [inlineHarmonics, setInlineHarmonics] = useState<number>(1);

  const parchmentCount = gameState.inventoryMaterials['mat_parchment'] || gameState.inventoryMaterials['mat_leather'] || 0;

  const handleInlineNodeClick = (nodeIndex: number) => {
    playSound('spell');
    if (inlineConnectedNodes.includes(nodeIndex)) return;

    const nextNodes = [...inlineConnectedNodes, nodeIndex];
    setInlineConnectedNodes(nextNodes);
    setInlineHarmonics(h => h + 1);
    setInlineInstability(inst => Math.min(100, inst + 12));

    if (nextNodes.length >= 4) {
      playSound('victory');
      setLastTestOutcome('✨ Masterwork Rune Scribed! Harmonic links: ' + (inlineHarmonics + 1) + 'x');
      setTimeout(() => {
        setInlineConnectedNodes([]);
        setInlineInstability(0);
        setInlineHarmonics(1);
        setInlineScriptStage(st => (st >= 4 ? 1 : st + 1));
      }, 1500);
    }
  };

  const handleResetScriptNodes = () => {
    playSound('ui_click');
    setInlineConnectedNodes([]);
    setInlineInstability(0);
    setInlineHarmonics(1);
    setLastTestOutcome('🔄 Rune trace slate cleared.');
  };

  const handleAutoTraceGlyph = () => {
    playSound('spell');
    setInlineConnectedNodes([1, 2, 3, 4]);
    setInlineHarmonics(4);
    setInlineInstability(48);
    playSound('victory');
    setLastTestOutcome(`✨ Instant Resonance: Completed Stage ${inlineScriptStage} Glyph!`);
    setTimeout(() => {
      setInlineConnectedNodes([]);
      setInlineInstability(0);
      setInlineHarmonics(1);
      setInlineScriptStage(st => (st >= 4 ? 1 : st + 1));
    }, 1500);
  };

  const handleInstantScribeCheat = () => {
    playSound('victory');
    const template = SPELL_SCROLLS.find(s => s.id === selectedScrollTemplate) || SPELL_SCROLLS[0];
    if (template) {
      const scroll = getSpellScrollAsEquipmentItem(template, Date.now());
      setGameState(prev => ({
        ...prev,
        equipmentInventory: [...(prev.equipmentInventory || []), scroll]
      }));
      const msg = `Instant Masterwork Scribe: Added [${scroll.name}] to equipment inventory!`;
      setLastTestOutcome(msg);
      if (triggerSuccessLog) triggerSuccessLog(msg);
      if (addLogMessage) addLogMessage(`📜 [DEV CHEAT] ${msg}`, 'loot');
    }
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
      },
      inventoryCatalysts: {
        ...prev.inventoryCatalysts,
        cat_shadow: (prev.inventoryCatalysts['cat_shadow'] || 0) + 5,
        cat_fire: (prev.inventoryCatalysts['cat_fire'] || 0) + 5,
        cat_frost: (prev.inventoryCatalysts['cat_frost'] || 0) + 5,
        cat_lightning: (prev.inventoryCatalysts['cat_lightning'] || 0) + 5,
      }
    }));
    if (triggerSuccessLog) triggerSuccessLog('Granted Scriptorium Reagents: +10 Parchment, +5 Dragonscale, +5 Catalysts!');
  };

  const handleLaunchScriptorium = () => {
    playSound('spell');
    setLastTestOutcome(`Launched Arcane Scriptorium Foreground Modal (${selectedScrollTemplate})!`);
    if (triggerSuccessLog) triggerSuccessLog('Launched Scriptorium Modal! Active in foreground.');
    if (addLogMessage) addLogMessage(`📜 [DEV] Launched Scriptorium Minigame (${selectedScrollTemplate}).`, 'system');
    if (onTriggerScriptorium) {
      onTriggerScriptorium(selectedScrollTemplate);
    }
    if (onMinimizeGodPanel) {
      onMinimizeGodPanel();
    }
  };

  return (
    <div className="p-4 bg-slate-950/70 border border-amber-500/40 rounded-xl space-y-3 flex flex-col justify-between hover:border-amber-500/70 transition-all">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Scroll className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">Arcane Scriptorium</h4>
              <span className="text-[10px] text-slate-400 font-mono">Glyph Tracing & Resonance</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setInlineScriptStage(s => Math.max(1, s - 1))}
              className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
              title="Previous Stage"
            >
              ◀
            </button>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-950 text-amber-300 border border-amber-800">
              Stage {inlineScriptStage} / 4
            </span>
            <button
              type="button"
              onClick={() => setInlineScriptStage(s => Math.min(4, s + 1))}
              className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
              title="Next Stage"
            >
              ▶
            </button>
          </div>
        </div>

        {/* In-Tab Interactive Simulator */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Live In-Tab Rune Tracing Simulator:
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((nodeId) => {
              const isLinked = inlineConnectedNodes.includes(nodeId);
              return (
                <button
                  key={nodeId}
                  onClick={() => handleInlineNodeClick(nodeId)}
                  className={`py-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    isLinked
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105'
                      : 'bg-slate-950 border-slate-700 hover:border-amber-500 text-amber-300 hover:scale-102'
                  }`}
                >
                  <span>Node {nodeId}</span>
                  <span className="text-[9px]">{isLinked ? 'LINKED ✨' : 'Click'}</span>
                </button>
              );
            })}
          </div>

          {/* Scriptorium Quick Test Buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={handleAutoTraceGlyph}
              className="py-1.5 px-2 bg-slate-950 hover:bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded text-[10px] font-bold transition-all cursor-pointer truncate"
              title="Auto-trace full rune glyph instantly"
            >
              ✨ Auto-Trace Glyph
            </button>
            <button
              type="button"
              onClick={handleResetScriptNodes}
              className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] font-bold transition-all cursor-pointer truncate"
              title="Clear traced rune nodes"
            >
              🔄 Clear Nodes
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
            <span>Parchment: <strong className="text-amber-300">{parchmentCount}</strong></span>
            <span>Instability: <strong className="text-rose-400">{inlineInstability}%</strong></span>
            <span>Harmonics: <strong className="text-sky-400">{inlineHarmonics}x</strong></span>
          </div>
        </div>

        {/* Template Selector */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400">Target Spell Scroll:</label>
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

      {/* Action Triggers */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            id="btn-launch-scriptorium-test"
            onClick={handleLaunchScriptorium}
            className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 active:scale-98 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Foreground Modal</span>
          </button>
          <button
            onClick={handleInstantScribeCheat}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Instant Masterwork Inscription (+1 Scroll)"
          >
            Instant Scribe 🌟
          </button>
          <button
            onClick={handleGrantScriptoriumReagents}
            className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            title="Grant Reagents (+10 Inks, +5 Catalysts)"
          >
            +Reagents
          </button>
        </div>
      </div>
    </div>
  );
};
