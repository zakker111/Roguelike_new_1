/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  Download,
  Upload,
  Search,
  Check,
  AlertCircle,
  Copy,
  Swords,
  Skull,
  Sparkles,
  Scale
} from 'lucide-react';
import { catalogLiveTuner } from '../../utils/catalogLiveTuner';
import { WEAPON_TEMPLATES } from '../../data/items';
import { MONSTER_ENTRIES } from '../../data/monsters';
import { SPELLS } from '../../utils/spellsAndEquipment';

type TunerCategory = 'weapons' | 'monsters' | 'spells' | 'balance';

export const GodCatalogLiveTuner: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<TunerCategory>('weapons');
  const [searchTerm, setSearchTerm] = useState('');
  const [overrideCount, setOverrideCount] = useState(catalogLiveTuner.getActiveOverrideCount());
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonModalMode, setJsonModalMode] = useState<'export' | 'import'>('export');
  const [jsonText, setJsonText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to tuner changes to trigger re-renders
  useEffect(() => {
    const unsubscribe = catalogLiveTuner.subscribe(() => {
      setOverrideCount(catalogLiveTuner.getActiveOverrideCount());
    });
    return unsubscribe;
  }, []);

  // Close JSON modal on Escape key
  useEffect(() => {
    if (!showJsonModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowJsonModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showJsonModal]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenExport = () => {
    setJsonText(catalogLiveTuner.exportProfileJson());
    setJsonModalMode('export');
    setShowJsonModal(true);
  };

  const handleOpenImport = () => {
    setJsonText('');
    setJsonModalMode('import');
    setShowJsonModal(true);
  };

  const handleApplyImport = () => {
    const res = catalogLiveTuner.importProfileJson(jsonText);
    if (res.success) {
      triggerToast('Balance profile successfully imported and applied!');
      setShowJsonModal(false);
    } else {
      triggerToast(`Import error: ${res.error}`);
    }
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(jsonText);
    triggerToast('JSON balance patch copied to clipboard!');
  };

  const stockWeapons = catalogLiveTuner.getStockWeapons();
  const stockMonsters = catalogLiveTuner.getStockMonsters();
  const stockSpells = catalogLiveTuner.getStockSpells();
  const stockBalance = catalogLiveTuner.getStockBalance();
  const profile = catalogLiveTuner.getProfile();

  return (
    <div className="space-y-4 text-slate-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-emerald-500/80 text-emerald-300 px-4 py-2 rounded shadow-xl flex items-center gap-2 text-xs font-mono animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              In-Game Data Catalog Live Tuner
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                overrideCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {overrideCount > 0 ? `${overrideCount} Active Overrides` : 'Stock Defaults'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tune weapons, monsters, spells, and global balance constants in real-time. Changes affect combat and gameplay immediately without reloads.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenExport}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition"
            title="Export custom balance patch as JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Patch</span>
          </button>
          <button
            onClick={handleOpenImport}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition"
            title="Import custom balance patch JSON"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import Patch</span>
          </button>
          <button
            onClick={() => {
              catalogLiveTuner.resetCategory(activeCategory);
              triggerToast(`Reset ${activeCategory} to stock defaults!`);
            }}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-xs font-semibold flex items-center gap-1.5 transition"
            title="Reset current category to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Category</span>
          </button>
          {overrideCount > 0 && (
            <button
              onClick={() => {
                catalogLiveTuner.resetAll();
                triggerToast('All catalog tunings reverted to stock defaults!');
              }}
              className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-xs font-semibold flex items-center gap-1.5 transition"
              title="Reset everything to defaults"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800/80">
          {[
            { id: 'weapons' as const, label: 'Weapons', icon: Swords },
            { id: 'monsters' as const, label: 'Bestiary', icon: Skull },
            { id: 'spells' as const, label: 'Spells', icon: Sparkles },
            { id: 'balance' as const, label: 'Global Balance', icon: Scale }
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {activeCategory !== 'balance' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeCategory}...`}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        )}
      </div>

      {/* Category Content: Weapons */}
      {activeCategory === 'weapons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {Object.entries(WEAPON_TEMPLATES)
            .filter(([baseType, tmpl]) => {
              const q = searchTerm.toLowerCase();
              return baseType.toLowerCase().includes(q) || tmpl.name.toLowerCase().includes(q);
            })
            .map(([baseType, tmpl]) => {
              const stock = stockWeapons[baseType] || { damage: 5, critChance: 0.05, range: 1, durability: 100 };
              const override = profile.weapons[baseType] || {};
              const isModified = Object.keys(override).length > 0;

              return (
                <div
                  key={baseType}
                  className={`p-3 rounded-lg border bg-slate-950/60 flex flex-col justify-between gap-2.5 transition ${
                    isModified ? 'border-amber-500/50 shadow-sm shadow-amber-500/10' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tmpl.icon || '⚔️'}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{tmpl.name}</h4>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                          {baseType}
                        </span>
                      </div>
                    </div>
                    {isModified && (
                      <button
                        onClick={() => {
                          catalogLiveTuner.resetWeapon(baseType);
                          triggerToast(`Reset ${tmpl.name} to stock defaults`);
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Revert</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-800/60">
                    {/* Damage */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Base Damage</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={tmpl.baseDamage ?? (tmpl as any).damage ?? stock.damage}
                          onChange={(e) =>
                            catalogLiveTuner.setWeaponOverride(baseType, 'damage', Math.max(1, Number(e.target.value)))
                          }
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-bold text-slate-100"
                        />
                        <span className="text-[10px] text-slate-500">
                          (Def: {stock.damage})
                        </span>
                      </div>
                    </div>

                    {/* Crit Chance */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Crit Rate %</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          value={tmpl.baseCrit ?? (tmpl as any).critChance ?? stock.critChance}
                          onChange={(e) =>
                            catalogLiveTuner.setWeaponOverride(baseType, 'critChance', Math.max(0, Math.min(1, Number(e.target.value))))
                          }
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-bold text-slate-100"
                        />
                        <span className="text-[10px] text-slate-500">
                          (Def: {Math.round(stock.critChance * 100)}%)
                        </span>
                      </div>
                    </div>

                    {/* Range */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Range (Tiles)</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={tmpl.range ?? stock.range}
                          onChange={(e) =>
                            catalogLiveTuner.setWeaponOverride(baseType, 'range', Math.max(1, Number(e.target.value)))
                          }
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-bold text-slate-100"
                        />
                        <span className="text-[10px] text-slate-500">
                          (Def: {stock.range})
                        </span>
                      </div>
                    </div>

                    {/* Durability */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Max Durability</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={(tmpl as any).durability ?? stock.durability}
                          onChange={(e) =>
                            catalogLiveTuner.setWeaponOverride(baseType, 'durability', Math.max(10, Number(e.target.value)))
                          }
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-bold text-slate-100"
                        />
                        <span className="text-[10px] text-slate-500">
                          (Def: {stock.durability})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Category Content: Bestiary Monsters */}
      {activeCategory === 'monsters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {MONSTER_ENTRIES.filter((m) => {
            const q = searchTerm.toLowerCase();
            return m.name.toLowerCase().includes(q) || m.key.toLowerCase().includes(q);
          }).map((m) => {
            const lowerKey = m.key.toLowerCase();
            const stock = stockMonsters[lowerKey] || { baseHp: 20, baseAtk: 5, baseDef: 2, speed: 10, range: 1 };
            const override = profile.monsters[lowerKey] || {};
            const isModified = Object.keys(override).length > 0;

            return (
              <div
                key={m.key}
                className={`p-3 rounded-lg border bg-slate-950/60 flex flex-col justify-between gap-2.5 transition ${
                  isModified ? 'border-amber-500/50 shadow-sm shadow-amber-500/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-sm"
                      style={{ color: m.color, backgroundColor: `${m.color}15` }}
                    >
                      {m.char}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{m.name}</h4>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        {m.category} • {m.key}
                      </span>
                    </div>
                  </div>
                  {isModified && (
                    <button
                      onClick={() => {
                        catalogLiveTuner.resetMonster(m.key);
                        triggerToast(`Reset ${m.name} to stock defaults`);
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Revert</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 border-t border-slate-800/60">
                  {/* HP */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Base HP</label>
                    <input
                      type="number"
                      value={m.baseHp}
                      onChange={(e) =>
                        catalogLiveTuner.setMonsterOverride(m.key, 'baseHp', Math.max(1, Number(e.target.value)))
                      }
                      className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-bold text-slate-100"
                    />
                    <span className="text-[9px] text-slate-500 block text-center mt-0.5">
                      Def: {stock.baseHp}
                    </span>
                  </div>

                  {/* ATK */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Base ATK</label>
                    <input
                      type="number"
                      value={m.baseAtk}
                      onChange={(e) =>
                        catalogLiveTuner.setMonsterOverride(m.key, 'baseAtk', Math.max(1, Number(e.target.value)))
                      }
                      className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-bold text-slate-100"
                    />
                    <span className="text-[9px] text-slate-500 block text-center mt-0.5">
                      Def: {stock.baseAtk}
                    </span>
                  </div>

                  {/* DEF */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Base DEF</label>
                    <input
                      type="number"
                      value={m.baseDef}
                      onChange={(e) =>
                        catalogLiveTuner.setMonsterOverride(m.key, 'baseDef', Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-bold text-slate-100"
                    />
                    <span className="text-[9px] text-slate-500 block text-center mt-0.5">
                      Def: {stock.baseDef}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Content: Spells */}
      {activeCategory === 'spells' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {SPELLS.filter((s) => {
            const q = searchTerm.toLowerCase();
            return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
          }).map((s) => {
            const stock = stockSpells[s.id] || { manaCost: 10, damageMultiplier: 1.0 };
            const override = profile.spells[s.id] || {};
            const isModified = Object.keys(override).length > 0;

            return (
              <div
                key={s.id}
                className={`p-3 rounded-lg border bg-slate-950/60 flex flex-col justify-between gap-2.5 transition ${
                  isModified ? 'border-amber-500/50 shadow-sm shadow-amber-500/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.icon || '✨'}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{s.name}</h4>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        {s.element} • {s.id}
                      </span>
                    </div>
                  </div>
                  {isModified && (
                    <button
                      onClick={() => {
                        catalogLiveTuner.resetSpell(s.id);
                        triggerToast(`Reset ${s.name} to stock defaults`);
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Revert</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-800/60">
                  {/* Mana Cost */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Mana Cost</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={s.manaCost}
                        onChange={(e) =>
                          catalogLiveTuner.setSpellOverride(s.id, 'manaCost', Math.max(1, Number(e.target.value)))
                        }
                        className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-bold text-slate-100"
                      />
                      <span className="text-[10px] text-slate-500">
                        (Def: {stock.manaCost})
                      </span>
                    </div>
                  </div>

                  {/* Damage Multiplier */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Damage Multiplier</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        value={s.damageMultiplier}
                        onChange={(e) =>
                          catalogLiveTuner.setSpellOverride(s.id, 'damageMultiplier', Math.max(0.1, Number(e.target.value)))
                        }
                        className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-xs font-bold text-slate-100"
                      />
                      <span className="text-[10px] text-slate-500">
                        (Def: {stock.damageMultiplier}x)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Content: Global Balance */}
      {activeCategory === 'balance' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {/* Base Attack Power */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200">Base Unarmed Attack Power</h4>
              <span className="text-[10px] font-mono text-slate-500">Stock: {stockBalance.baseAttackPower}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={profile.balance.baseAttackPower ?? stockBalance.baseAttackPower}
                onChange={(e) =>
                  catalogLiveTuner.setBalanceOverride('baseAttackPower', Math.max(1, Number(e.target.value)))
                }
                className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono font-bold text-slate-100"
              />
              <span className="text-[11px] text-slate-400">Baseline melee strength</span>
            </div>
          </div>

          {/* Crit Multiplier */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200">Critical Strike Damage Multiplier</h4>
              <span className="text-[10px] font-mono text-slate-500">Stock: {stockBalance.critMultiplier}x</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={profile.balance.critMultiplier ?? stockBalance.critMultiplier}
                onChange={(e) =>
                  catalogLiveTuner.setBalanceOverride('critMultiplier', Math.max(1.0, Number(e.target.value)))
                }
                className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono font-bold text-slate-100"
              />
              <span className="text-[11px] text-slate-400">Damage multiplier on critical hits</span>
            </div>
          </div>

          {/* Armor Mitigation Cap */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200">Armor Mitigation Cap %</h4>
              <span className="text-[10px] font-mono text-slate-500">Stock: {Math.round(stockBalance.armorMitigationCap * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.05"
                value={profile.balance.armorMitigationCap ?? stockBalance.armorMitigationCap}
                onChange={(e) =>
                  catalogLiveTuner.setBalanceOverride('armorMitigationCap', Math.max(0.1, Math.min(0.95, Number(e.target.value))))
                }
                className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono font-bold text-slate-100"
              />
              <span className="text-[11px] text-slate-400">Maximum damage absorbed by armor</span>
            </div>
          </div>

          {/* Level XP Multiplier */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200">Level XP Curve Multiplier</h4>
              <span className="text-[10px] font-mono text-slate-500">Stock: {stockBalance.levelXpMultiplier}x</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.05"
                value={profile.balance.levelXpMultiplier ?? stockBalance.levelXpMultiplier}
                onChange={(e) =>
                  catalogLiveTuner.setBalanceOverride('levelXpMultiplier', Math.max(1.05, Number(e.target.value)))
                }
                className="w-24 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono font-bold text-slate-100"
              />
              <span className="text-[11px] text-slate-400">Steepness of XP required per level</span>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import/Export Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-full max-w-lg shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {jsonModalMode === 'export' ? (
                  <>
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Export Live Balance Patch</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Import Balance Patch JSON</span>
                  </>
                )}
              </h4>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              readOnly={jsonModalMode === 'export'}
              placeholder={jsonModalMode === 'import' ? 'Paste balance patch JSON here...' : ''}
              className="w-full h-64 p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-emerald-300 focus:outline-none focus:border-amber-500/60"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold"
              >
                Close
              </button>
              {jsonModalMode === 'export' ? (
                <button
                  onClick={handleCopyExport}
                  className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-xs font-semibold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
              ) : (
                <button
                  onClick={handleApplyImport}
                  className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Patch</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
