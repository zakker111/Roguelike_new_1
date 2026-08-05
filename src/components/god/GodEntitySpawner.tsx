/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState } from '../../types';
import { Swords, Plus, RotateCw, Trash2, Sliders, Check } from 'lucide-react';

export interface GodEntitySpawnerProps {
  customEnemiesState: any[];
  selectedEnemyIndex: number | null;
  selectEnemyTemplate: (idx: number) => void;
  createNewEnemyTemplate: () => void;
  deleteEnemyTemplate: (idx: number, ev: React.MouseEvent) => void;
  saveEnemyTemplate: () => void;
  handleResetEnemies: () => void;
  handleApplyEnemiesJson: () => void;
  formType: string;
  setFormType: (v: string) => void;
  formName: string;
  setFormName: (v: string) => void;
  formChar: string;
  setFormChar: (v: string) => void;
  formColor: string;
  setFormColor: (v: string) => void;
  formBaseHp: number;
  setFormBaseHp: (v: number) => void;
  formBaseAtk: number;
  setFormBaseAtk: (v: number) => void;
  formBaseDef: number;
  setFormBaseDef: (v: number) => void;
  formRange: number;
  setFormRange: (v: number) => void;
  formSpeed: number;
  setFormSpeed: (v: number) => void;
  enemiesJsonText: string;
  setEnemiesJsonText: (v: string) => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerSuccessLog: (msg: string) => void;
  playSound: (s: any) => void;
}

export const GodEntitySpawner: React.FC<GodEntitySpawnerProps> = ({
  customEnemiesState,
  selectedEnemyIndex,
  selectEnemyTemplate,
  createNewEnemyTemplate,
  deleteEnemyTemplate,
  saveEnemyTemplate,
  handleResetEnemies,
  handleApplyEnemiesJson,
  formType,
  setFormType,
  formName,
  setFormName,
  formChar,
  setFormChar,
  formColor,
  setFormColor,
  formBaseHp,
  setFormBaseHp,
  formBaseAtk,
  setFormBaseAtk,
  formBaseDef,
  setFormBaseDef,
  formRange,
  setFormRange,
  formSpeed,
  setFormSpeed,
  enemiesJsonText,
  setEnemiesJsonText,
}) => {
  return (
    <div className="space-y-4 font-mono">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div>
          <h4 className="font-bold text-slate-350 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-indigo-400" />
            <span>Visual Enemy Coders & Blueprint Laboratory</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Create, edit, and fine-tune enemy presets visually with instant hot-swaps. Changes compile immediately!
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={createNewEnemyTemplate}
            className="py-1 px-2.5 bg-indigo-950/40 border border-indigo-800 hover:border-indigo-700 hover:bg-indigo-900/50 rounded text-indigo-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
          >
            <Plus className="w-3 h-3 text-indigo-400" />
            <span>New Blank</span>
          </button>
          <button
            onClick={handleResetEnemies}
            className="py-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded text-slate-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
          >
            <RotateCw className="w-3 h-3 text-red-500" />
            <span>Restore Defaults</span>
          </button>
        </div>
      </div>

      {/* Visual summaries of active blueprints */}
      <div>
        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5 flex items-center justify-between">
          <span>🧬 Click Blueprint Card to Select & Edit:</span>
          <span className="text-[8px] text-slate-400">{customEnemiesState.length} Templates Active</span>
        </span>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {customEnemiesState.map((e: any, index: number) => {
            const isSelected = selectedEnemyIndex === index;
            return (
              <div 
                key={`${e.type}_${index}`} 
                onClick={() => selectEnemyTemplate(index)}
                className={`group relative p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-[64px] ${
                  isSelected 
                    ? 'bg-indigo-950/20 border-indigo-500 shadow' 
                    : 'bg-slate-950/30 border-slate-800 hover:border-slate-700 hover:bg-slate-950/60'
                }`}
              >
                <div className="flex items-start justify-between min-w-0">
                  <span style={{ color: e.color || '#f43f5e' }} className="font-bold text-base font-mono leading-none">{e.char || '?'}</span>
                  <button
                    onClick={(ev) => deleteEnemyTemplate(index, ev)}
                    title="Delete this template blueprint"
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all leading-none focus:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-[10px] text-slate-200">{e.name}</div>
                  <div className="text-[8px] text-slate-500 font-mono">HP:{e.baseHp ?? e.hp ?? 10} ATK:{e.baseAtk ?? e.atk ?? 3} RNG:{e.range ?? 1}</div>
                </div>
              </div>
            );
          })}

          <button
            onClick={createNewEnemyTemplate}
            className="border border-dashed border-slate-800 hover:border-indigo-800/80 hover:bg-indigo-955/10 rounded-lg text-slate-500 hover:text-indigo-400 flex flex-col items-center justify-center gap-1 h-[64px] transition-all cursor-pointer text-center text-[10px]"
          >
            <Plus className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
            <span>Add Pattern</span>
          </button>
        </div>
      </div>

      {/* Form Editor Block */}
      <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
          <span className="font-bold text-[10px] text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>{selectedEnemyIndex !== null ? `Modify: "${formName}" (${formType})` : 'Forge a New Monster Pattern'}</span>
          </span>
          {selectedEnemyIndex !== null ? (
            <span className="text-[8px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono uppercase">
              Editing slot #{selectedEnemyIndex + 1}
            </span>
          ) : (
            <span className="text-[8px] bg-amber-950/30 border border-amber-900/40 px-1.5 py-0.5 rounded text-amber-400 font-mono uppercase">
              Creative Canvas active
            </span>
          )}
        </div>

        {/* Form Input fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Type ID string */}
          <div>
            <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Type ID Reference</label>
            <input
              type="text"
              value={formType}
              placeholder="e.g. MinotaurCrusher"
              onChange={(e) => setFormType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-indigo-600 focus:outline-none"
            />
            <span className="text-[8px] text-slate-500 mt-1 block">Unique alphanumeric system ID</span>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Display Name</label>
            <input
              type="text"
              value={formName}
              placeholder="e.g. Abyssal Skullcleaver"
              onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-indigo-600 focus:outline-none"
            />
            <span className="text-[8px] text-slate-500 mt-1 block">Human readable combat log identifier</span>
          </div>

          {/* Icon character symbol & color accent */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Icon Char</label>
              <input
                type="text"
                maxLength={2}
                value={formChar}
                placeholder="💀"
                onChange={(e) => setFormChar(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono text-center focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Hex Color</label>
              <input
                type="text"
                value={formColor}
                placeholder="#ea580c"
                onChange={(e) => setFormColor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono text-center focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Color Presets selection row */}
        <div>
          <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest block mb-1">Color Palette presets:</span>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { hex: '#f43f5e', name: 'Scarl' },
              { hex: '#f97316', name: 'Flame' },
              { hex: '#eab308', name: 'Amber' },
              { hex: '#22c55e', name: 'Emerald' },
              { hex: '#06b6d4', name: 'Cyan' },
              { hex: '#3b82f6', name: 'Azure' },
              { hex: '#a855f7', name: 'Mage' },
              { hex: '#ec4899', name: 'Pink' },
              { hex: '#94a3b8', name: 'Slate' },
              { hex: '#ffffff', name: 'Ghost' },
            ].map((item) => (
              <button
                key={item.hex}
                type="button"
                onClick={() => setFormColor(item.hex)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  formColor.toLowerCase() === item.hex.toLowerCase()
                    ? 'bg-slate-950 border-indigo-500 text-slate-100'
                    : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-350 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.hex }} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Attributes Sliders Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
          {/* Base HP */}
          <div className="p-2.5 bg-slate-950/20 border border-slate-850 rounded">
            <div className="flex justify-between font-mono text-[9px] mb-1">
              <span className="text-slate-400">❤️ Max Vitality HP</span>
              <span className="text-indigo-400 font-bold font-mono">{formBaseHp} hp</span>
            </div>
            <input
              type="range"
              min="1"
              max="300"
              step="1"
              value={formBaseHp}
              onChange={(e) => setFormBaseHp(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Base Attack */}
          <div className="p-2.5 bg-slate-950/20 border border-slate-850 rounded">
            <div className="flex justify-between font-mono text-[9px] mb-1">
              <span className="text-slate-400">🗡️ Attack Melee/Ranged Atk</span>
              <span className="text-indigo-400 font-bold font-mono">{formBaseAtk} dmg</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={formBaseAtk}
              onChange={(e) => setFormBaseAtk(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Base Defense */}
          <div className="p-2.5 bg-slate-950/20 border border-slate-850 rounded">
            <div className="flex justify-between font-mono text-[9px] mb-1">
              <span className="text-slate-400">🛡️ Defense Mitigation</span>
              <span className="text-indigo-400 font-bold font-mono">{formBaseDef} def</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={formBaseDef}
              onChange={(e) => setFormBaseDef(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Range & Speed Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-1 px-2 bg-slate-950/30 border border-slate-800 rounded">
              <label className="text-[8px] text-slate-500 block">Attack Range</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formRange}
                onChange={(e) => setFormRange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-transparent text-slate-200 text-xs font-bold focus:outline-none"
              />
              <span className="text-[7px] text-indigo-400 block mt-0.5">1=Melee, 2-10=Ranged spells</span>
            </div>

            <div className="p-1 px-2 bg-slate-950/30 border border-slate-800 rounded">
              <label className="text-[8px] text-slate-500 block">Move Speed mult</label>
              <input
                type="number"
                min="0.5"
                max="3.0"
                step="0.1"
                value={formSpeed}
                onChange={(e) => setFormSpeed(Math.max(0.1, parseFloat(e.target.value) || 1.0))}
                className="w-full bg-transparent text-slate-200 text-xs font-bold focus:outline-none"
              />
              <span className="text-[7px] text-indigo-400 block mt-0.5">1.0=Standard, 1.5=Fast stalker</span>
            </div>
          </div>
        </div>

        {/* Form saving validation button */}
        <button
          type="button"
          onClick={saveEnemyTemplate}
          className="w-full py-2 bg-indigo-950 hover:bg-slate-850 hover:border-indigo-500/80 border border-indigo-800 text-slate-200 font-bold rounded-lg text-center transition-all cursor-pointer text-[11px] flex items-center justify-center gap-1.5 shadow"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{selectedEnemyIndex !== null ? 'Save and Commit Selected Blueprint!' : 'Inject Brand New Blueprint into active codex'}</span>
        </button>
      </div>

      {/* Collapsed Back-up raw JSON editing console */}
      <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-lg space-y-2">
        <span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest block">🗃️ RAW CONFIGURATION FILE BACKUP (JSON EDITOR)</span>
        <textarea
          value={enemiesJsonText}
          onChange={(e) => setEnemiesJsonText(e.target.value)}
          className="w-full h-24 p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] leading-relaxed text-indigo-300 focus:border-indigo-600 focus:outline-none"
          spellCheck="false"
          placeholder="[{ 'type': 'Rat', 'name': 'Giant Plague Rat', ... }]"
        />
        <button
          onClick={handleApplyEnemiesJson}
          className="py-1 px-3 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800 rounded text-slate-300 text-[9px] font-bold cursor-pointer transition-all flex items-center gap-1"
        >
          <span>Compile edited Raw JSON back into memory</span>
        </button>
      </div>
    </div>
  );
};
