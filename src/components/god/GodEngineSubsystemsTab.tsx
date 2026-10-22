/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Layers,
  CheckCircle,
  Play,
  RotateCw,
  Swords,
  Database,
  Search
} from 'lucide-react';
import { ContentRegistry } from '../../engine/registry/ContentRegistry';
import { CombatEngine } from '../../engine/combat/CombatEngine';
import { playSound } from '../../utils/audio';

export interface GodEngineSubsystemsTabProps {
  triggerSuccessLog?: (msg: string) => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

export const GodEngineSubsystemsTab: React.FC<GodEngineSubsystemsTabProps> = ({
  triggerSuccessLog,
  addLogMessage
}) => {
  const contentRegistry = useMemo(() => ContentRegistry.getInstance(), []);
  const [summary, setSummary] = useState(() => contentRegistry.getSummary());
  const [validationReport, setValidationReport] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [inspectedRegistry, setInspectedRegistry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Combat Simulator State
  const [attackerAtk, setAttackerAtk] = useState(25);
  const [defenderDef, setDefenderDef] = useState(12);
  const [critEnabled, setCritEnabled] = useState(false);
  const [armorPenetration, setArmorPenetration] = useState(0);

  // Run live Content Validator
  const handleRunValidation = () => {
    playSound('spell');
    setIsValidating(true);
    setTimeout(() => {
      const result = contentRegistry.validateContent();
      setValidationReport(result);
      setIsValidating(false);
      const msg = result.valid
        ? '🎉 Live Content Validation PASSED: 0 errors, 0 warnings!'
        : `⚠️ Content Validation reported ${result.errors.length} errors, ${result.warnings.length} warnings.`;
      if (triggerSuccessLog) triggerSuccessLog(msg);
      if (addLogMessage) addLogMessage(`[ENGINE] ${msg}`, result.valid ? 'loot' : 'danger');
    }, 150);
  };

  // Re-fetch metrics
  const handleRefreshSummary = () => {
    playSound('ui_click');
    setSummary(contentRegistry.getSummary());
    if (triggerSuccessLog) triggerSuccessLog('Engine registries telemetry refreshed.');
  };

  // Live combat simulation math
  const combatEngine = useMemo(() => new CombatEngine(), []);
  const simulatedCombat = useMemo(() => {
    return combatEngine.resolveAttack(
      { id: 'attacker', name: 'Adventurer', hp: 100, maxHp: 100, atk: attackerAtk, def: 5, critChance: critEnabled ? 1 : 0 },
      { id: 'defender', name: 'Training Golem', hp: 80, maxHp: 80, atk: 10, def: defenderDef, dodgeChance: 0 },
      { armorPenetrationPercent: armorPenetration / 100 }
    );
  }, [combatEngine, attackerAtk, defenderDef, critEnabled, armorPenetration]);

  // Registry entries details
  const registryItems = useMemo(() => {
    if (!inspectedRegistry) return [];
    switch (inspectedRegistry) {
      case 'enemies':
        return contentRegistry.enemies.getAll().map(e => ({
          id: e.id,
          name: e.name,
          details: `HP: ${e.baseHp} | ATK: ${e.baseAtk} | DEF: ${e.baseDef} | Role: ${e.aiRole} | Glyph: '${e.char || '?'}'`
        }));
      case 'items':
        return contentRegistry.items.getAll().map(i => ({
          id: i.id,
          name: i.name,
          details: `Category: ${i.category} | Rarity: ${i.rarity || 'common'} | Value: ${i.value}g`
        }));
      case 'weapons':
        return contentRegistry.weapons.getAll().map(w => ({
          id: w.baseType,
          name: w.name,
          details: `Base: ${w.baseType} | DMG: ${w.baseDamage} | Crit: ${(w.baseCrit * 100).toFixed(0)}% | Range: ${w.range}`
        }));
      case 'abilities':
        return contentRegistry.abilities.getAll().map(a => ({
          id: a.id,
          name: a.name,
          details: `Cost: ${a.manaCost ?? 0} MP | Target: ${a.targetType} | Power: ${a.basePower ?? 0}`
        }));
      case 'effects':
        return contentRegistry.effects.getAll().map(ef => ({
          id: ef.id,
          name: ef.name,
          details: `Type: ${ef.type} | Default Duration: ${ef.defaultDuration} turns | Stacking: ${ef.stacking}`
        }));
      case 'rooms':
        return contentRegistry.rooms.getAll().map(r => ({
          id: r.id,
          name: r.name,
          details: `Archetype: ${r.type} | Dims: ${r.minWidth}x${r.minHeight} to ${r.maxWidth}x${r.maxHeight}`
        }));
      case 'generators':
        return contentRegistry.generators.getAll().map(g => ({
          id: g.id,
          name: g.name,
          details: `Description: ${g.description}`
        }));
      case 'aiStrategies':
        return contentRegistry.aiStrategies.getAll().map(s => ({
          id: s.id,
          name: s.id,
          details: `AI Behavior: ${s.description}`
        }));
      default:
        return [];
    }
  }, [contentRegistry, inspectedRegistry]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return registryItems;
    const q = searchQuery.toLowerCase();
    return registryItems.filter(item =>
      item.id.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q)
    );
  }, [registryItems, searchQuery]);

  return (
    <div id="god-engine-subsystems-tab" className="space-y-6 font-mono animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 bg-slate-950/90 border border-cyan-500/30 rounded-xl flex items-start justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg shrink-0 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
                Reusable Roguelike Engine Subsystems & Live Validator Lab
              </h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold">
                ENGINE V1.0 · STEP 10
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed font-sans text-xs">
              Direct telemetry inspection and real-time validation for all 10 engine subsystems. Strict architectural decoupling: Engine provides mechanics; Game provides catalogs.
            </p>
          </div>
        </div>

        <button
          onClick={handleRefreshSummary}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors shrink-0"
          title="Refresh Engine Metrics"
        >
          <RotateCw className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* Subsystem Metrics Matrix */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Master Content Registries Matrix (Total: {summary.total} Registered Blueprints)</span>
          </span>
          <span className="text-[10px] text-slate-500">Click any card to inspect entries</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            { id: 'enemies', label: 'Enemies', count: summary.enemies, color: 'border-red-500/40 text-red-400 bg-red-950/20' },
            { id: 'items', label: 'Items & Catalog', count: summary.items, color: 'border-amber-500/40 text-amber-400 bg-amber-950/20' },
            { id: 'weapons', label: 'Crafted Weapons', count: summary.weapons, color: 'border-orange-500/40 text-orange-400 bg-orange-950/20' },
            { id: 'abilities', label: 'Universal Abilities', count: summary.abilities, color: 'border-purple-500/40 text-purple-400 bg-purple-950/20' },
            { id: 'effects', label: 'Status Effects', count: summary.effects, color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' },
            { id: 'rooms', label: 'Room Archetypes', count: summary.rooms, color: 'border-sky-500/40 text-sky-400 bg-sky-950/20' },
            { id: 'generators', label: 'Dungeon Generators', count: summary.generators, color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20' },
            { id: 'aiStrategies', label: 'AI Strategies', count: summary.aiStrategies, color: 'border-teal-500/40 text-teal-400 bg-teal-950/20' },
            { id: 'entities', label: 'Entity Blueprints', count: summary.entities, color: 'border-pink-500/40 text-pink-400 bg-pink-950/20' },
          ].map((reg) => {
            const isSelected = inspectedRegistry === reg.id;
            return (
              <button
                key={reg.id}
                onClick={() => {
                  setInspectedRegistry(isSelected ? null : reg.id);
                  setSearchQuery('');
                  playSound('ui_click');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${reg.color} ${
                  isSelected ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase truncate">{reg.label}</span>
                  <Database className="w-3.5 h-3.5 opacity-60" />
                </div>
                <div className="text-xl font-black mt-2 font-mono">
                  {reg.count}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inspected Registry Modal / Panel */}
      {inspectedRegistry && (
        <div className="p-4 bg-slate-950/90 border border-cyan-500/40 rounded-xl space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-300 uppercase">
                Inspecting: {inspectedRegistry.toUpperCase()} ({filteredItems.length} entries)
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by ID or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 placeholder:text-slate-500"
                />
              </div>
              <button
                onClick={() => setInspectedRegistry(null)}
                className="py-1 px-2 text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin pr-1 text-xs">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No matching definitions found.</div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} className="p-2 bg-slate-900/80 rounded border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-bold">
                      {item.id}
                    </span>
                    <span className="font-bold text-slate-200 text-xs">{item.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans">{item.details}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Live Content Integrity Auditor */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Live Content Integrity & Referential Auditor</span>
            </h4>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Audits all registered blueprints for broken references, missing fields, duplicate keys, and invalid AI roles.
            </p>
          </div>
          <button
            onClick={handleRunValidation}
            disabled={isValidating}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isValidating ? 'Auditing...' : 'Run Content Integrity Audit'}</span>
          </button>
        </div>

        {validationReport && (
          <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">
                Audit Result: {validationReport.valid ? (
                  <span className="text-emerald-400">PASSED (0 Errors, 0 Warnings)</span>
                ) : (
                  <span className="text-rose-400">FAILED ({validationReport.errors.length} Errors)</span>
                )}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Checked at {new Date(validationReport.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {validationReport.errors.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-rose-400 font-bold">Errors:</span>
                <ul className="space-y-1 text-rose-300 text-[11px]">
                  {validationReport.errors.map((err: string, i: number) => (
                    <li key={i} className="p-1 bg-rose-950/40 rounded border border-rose-900">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationReport.warnings.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-amber-400 font-bold">Warnings:</span>
                <ul className="space-y-1 text-amber-300 text-[11px]">
                  {validationReport.warnings.map((w: string, i: number) => (
                    <li key={i} className="p-1 bg-amber-950/40 rounded border border-amber-900">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mathematical Combat Simulator */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
          <Swords className="w-4 h-4 text-blue-400" />
          <span>Mathematical Combat Formula Sandbox (CombatEngine)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inputs */}
          <div className="space-y-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Attacker Power (ATK):</span>
                <span className="text-amber-400 font-bold">{attackerAtk}</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={attackerAtk}
                onChange={(e) => setAttackerAtk(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Defender Armor (DEF):</span>
                <span className="text-sky-400 font-bold">{defenderDef}</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={defenderDef}
                onChange={(e) => setDefenderDef(parseInt(e.target.value, 10))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Armor Penetration:</span>
                <span className="text-purple-400 font-bold">{armorPenetration}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={armorPenetration}
                onChange={(e) => setArmorPenetration(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-slate-300">Simulate Critical Strike:</span>
              <button
                onClick={() => setCritEnabled(!critEnabled)}
                className={`px-3 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  critEnabled ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {critEnabled ? 'CRITICAL HIT (x1.5)' : 'NORMAL HIT'}
              </button>
            </div>
          </div>

          {/* Real-time Math Output */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex flex-col justify-between text-xs font-mono space-y-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">Combat Resolution Output</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Raw Damage:</span>
                  <span className="text-slate-200 font-bold">{simulatedCombat.rawDamage}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Mitigated:</span>
                  <span className="text-rose-400 font-bold">-{simulatedCombat.mitigatedDamage}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Critical:</span>
                  <span className={simulatedCombat.isCritical ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                    {simulatedCombat.isCritical ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Defender Rem. HP:</span>
                  <span className="text-emerald-400 font-bold">{simulatedCombat.remainingHp}/80</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-blue-500/40 rounded-lg flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">FINAL DEALT DAMAGE:</span>
              <span className="text-xl font-black text-amber-300 font-mono">
                {simulatedCombat.finalDamage} HP
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
