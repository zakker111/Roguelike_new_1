import React, { useState } from 'react';
import { Sliders, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import { GameState, CatalystType } from '../../types';
import { SCAR_DATABASE } from '../../utils/scars';
import { SPELL_SCROLLS, SpellScrollTemplate, getSpellScrollAsEquipmentItem } from '../../utils/spellScrolls';
import { GodStatEditor } from './GodStatEditor';
import { MATERIAL_LABELS, CATALYST_LABELS } from './GodItemCreatorTab';

export interface GodAdminEditorTabProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerSuccessLog: (msg: string) => void;
}

export const GodAdminEditorTab: React.FC<GodAdminEditorTabProps> = ({
  gameState,
  setGameState,
  triggerSuccessLog,
}) => {
  const [selectedScrollIndex, setSelectedScrollIndex] = useState<number | null>(0);
  const [spellScrollListVersion, setSpellScrollListVersion] = useState<number>(0);

  const initialScroll = SPELL_SCROLLS[0];
  const initialMatEntry = initialScroll?.recipe?.materials ? Object.entries(initialScroll.recipe.materials)[0] : null;
  const initialCatEntry = initialScroll?.recipe?.catalysts ? Object.entries(initialScroll.recipe.catalysts)[0] : null;

  const [spellId, setSpellId] = useState<string>(initialScroll?.id || '');
  const [spellName, setSpellName] = useState<string>(initialScroll?.name || '');
  const [spellColor, setSpellColor] = useState<string>(initialScroll?.color || '#38bdf8');
  const [spellDamage, setSpellDamage] = useState<number>(initialScroll?.baseDamage || 25);
  const [spellMpCost, setSpellMpCost] = useState<number>(initialScroll?.mpCost || 10);
  const [spellValue, setSpellValue] = useState<number>(initialScroll?.value || 120);
  const [spellElement, setSpellElement] = useState<CatalystType>(initialScroll?.element || CatalystType.Fire);
  const [spellDebuffDuration, setSpellDebuffDuration] = useState<number>(initialScroll?.debuff?.duration || 3);
  const [spellDebuffDmg, setSpellDebuffDmg] = useState<number>(initialScroll?.debuff?.damagePerTurn || 5);
  const [spellMatId, setSpellMatId] = useState<string>(initialMatEntry ? initialMatEntry[0] : 'mat_iron');
  const [spellMatQty, setSpellMatQty] = useState<number>(initialMatEntry ? initialMatEntry[1].required : 3);
  const [spellCatId, setSpellCatId] = useState<string>(initialCatEntry ? initialCatEntry[0] : 'cat_fire');
  const [spellCatQty, setSpellCatQty] = useState<number>(initialCatEntry ? initialCatEntry[1].required : 1);
  const [spellDesc, setSpellDesc] = useState<string>(initialScroll?.description || '');

  const selectScrollTemplate = (idx: number) => {
    const t = SPELL_SCROLLS[idx];
    if (!t) return;
    setSelectedScrollIndex(idx);
    setSpellId(t.id);
    setSpellName(t.name);
    setSpellColor(t.color);
    setSpellDamage(t.baseDamage);
    setSpellMpCost(t.mpCost);
    setSpellValue(t.value);
    setSpellElement(t.element);
    setSpellDebuffDuration(t.debuff?.duration ?? 3);
    setSpellDebuffDmg(t.debuff?.damagePerTurn ?? 5);

    const matEntry = t.recipe?.materials ? Object.entries(t.recipe.materials)[0] : null;
    const catEntry = t.recipe?.catalysts ? Object.entries(t.recipe.catalysts)[0] : null;

    setSpellMatId(matEntry ? matEntry[0] : 'mat_iron');
    setSpellMatQty(matEntry ? matEntry[1].required : 3);
    setSpellCatId(catEntry ? catEntry[0] : 'cat_fire');
    setSpellCatQty(catEntry ? catEntry[1].required : 1);
    setSpellDesc(t.description);
  };

  const createNewScrollTemplate = () => {
    setSelectedScrollIndex(null);
    const newId = `scroll_spell_custom_${Date.now()}`;
    setSpellId(newId);
    setSpellName('Scroll of Arcane Burst ✨');
    setSpellColor('#c084fc');
    setSpellDamage(45);
    setSpellMpCost(15);
    setSpellValue(250);
    setSpellElement(CatalystType.Shadow);
    setSpellDebuffDuration(3);
    setSpellDebuffDmg(8);
    setSpellMatId('mat_obsidian');
    setSpellMatQty(5);
    setSpellCatId('cat_shadow');
    setSpellCatQty(2);
    setSpellDesc('A newly constructed spell blueprint capable of obliterating foes with raw concentrated mana.');
  };

  const saveScrollTemplate = () => {
    if (!spellId.trim() || !spellName.trim()) {
      alert("Spell ID and Spell Display Name are required.");
      return;
    }

    const matLabel = MATERIAL_LABELS[spellMatId] || spellMatId;
    const catLabel = CATALYST_LABELS[spellCatId] || spellCatId;

    const templateObj: SpellScrollTemplate = {
      id: spellId.trim(),
      name: spellName.trim(),
      color: spellColor,
      baseDamage: spellDamage,
      mpCost: spellMpCost,
      value: spellValue,
      element: spellElement,
      description: spellDesc,
      debuff: {
        type: spellElement,
        duration: spellDebuffDuration,
        damagePerTurn: spellDebuffDmg,
      },
      combos: [],
      recipe: {
        materials: {
          [spellMatId]: {
            name: matLabel,
            required: spellMatQty,
          },
        },
        catalysts: {
          [spellCatId]: {
            name: catLabel,
            required: spellCatQty,
          },
        },
      },
      successMsgText: `📜 [ARCANUM CRAFT]: You crafted ${spellName.trim()}!`,
    };

    if (selectedScrollIndex !== null && SPELL_SCROLLS[selectedScrollIndex]) {
      SPELL_SCROLLS[selectedScrollIndex] = templateObj;
      triggerSuccessLog(`Updated Spell Blueprint: ${spellName}!`);
    } else {
      SPELL_SCROLLS.push(templateObj);
      setSelectedScrollIndex(SPELL_SCROLLS.length - 1);
      triggerSuccessLog(`Added New Spell Blueprint: ${spellName}!`);
    }

    setSpellScrollListVersion((prev) => prev + 1);
  };

  const deleteScrollTemplate = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (SPELL_SCROLLS.length <= 1) {
      alert("Cannot delete the last remaining spell scroll template.");
      return;
    }
    const removed = SPELL_SCROLLS.splice(idx, 1)[0];
    if (selectedScrollIndex === idx) {
      selectScrollTemplate(0);
    } else if (selectedScrollIndex !== null && selectedScrollIndex > idx) {
      setSelectedScrollIndex(selectedScrollIndex - 1);
    }
    setSpellScrollListVersion((prev) => prev + 1);
    triggerSuccessLog(`Deleted Spell Blueprint: ${removed?.name}`);
  };

  return (
    <div className="space-y-6 font-mono">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div>
          <h4 className="font-bold text-slate-350 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Sovereign Admin Panel & Universal Editor</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Edit player parameters, teleport coordinates, and visually sculpt custom craftable Spell Scrolls in real-time.
          </p>
        </div>
      </div>

      {/* SECTION 1: Direct Player Parameters */}
      <GodStatEditor gameState={gameState} setGameState={setGameState} scarDatabase={SCAR_DATABASE} />

      {/* SECTION 2: Visual Spell Scrolls & Recipes Laboratory */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
          <span className="font-bold text-[10px] text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
            📜 Interactive Spell Scroll & Recipes Blueprint Laboratory
          </span>
          <div className="flex gap-2">
            <button
              onClick={createNewScrollTemplate}
              className="py-1 px-2.5 bg-rose-955/40 border border-rose-850 hover:border-rose-600 hover:bg-rose-900/50 rounded text-rose-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Spell Blueprint</span>
            </button>
          </div>
        </div>

        {/* Grid list of active blueprints */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">
            🧬 Click Spell Blueprint to Load & Edit:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {SPELL_SCROLLS.map((template, idx) => {
              const isSelected = selectedScrollIndex === idx;
              return (
                <div
                  key={`${template.id}_${idx}_${spellScrollListVersion}`}
                  onClick={() => selectScrollTemplate(idx)}
                  className={`group relative p-2.5 rounded-lg border text-left cursor-pointer flex flex-col justify-between h-[72px] transition-all ${
                    isSelected
                      ? 'bg-rose-955/20 border-rose-500 shadow-md shadow-rose-950/20'
                      : 'bg-slate-950/30 border-slate-850 hover:border-slate-700 hover:bg-slate-950/60'
                  }`}
                >
                  <div className="flex justify-between items-start min-w-0">
                    <span style={{ color: template.color }} className="font-bold text-[10.5px] font-mono leading-none truncate pr-3">
                      {template.name}
                    </span>
                    <button
                      onClick={(e) => deleteScrollTemplate(idx, e)}
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all leading-none focus:opacity-100"
                      title="Delete this scroll template blueprint"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[8.5px] text-slate-400 truncate mt-0.5 leading-snug">{template.description}</p>
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-900/40">
                      <span>DMG: {template.baseDamage}</span>
                      <span>MP: {template.mpCost}</span>
                      <span className="uppercase" style={{ color: template.color }}>{template.element}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form editor block for chosen Spell Scroll */}
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4">
          <span className="font-bold text-[10px] text-rose-455 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
            🧪 {selectedScrollIndex !== null ? `Modify Blueprint: "${spellName}"` : 'Forge a New Spell Blueprint'}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Spell ID */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Spell ID Reference</label>
              <input
                type="text"
                value={spellId}
                onChange={(e) => setSpellId(e.target.value)}
                placeholder="e.g. scroll_spell_frost_spike"
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
              />
              <span className="text-[8px] text-slate-500 mt-1 block">System identifier (must be unique)</span>
            </div>

            {/* Spell Name */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Spell Display Name</label>
              <input
                type="text"
                value={spellName}
                onChange={(e) => setSpellName(e.target.value)}
                placeholder="e.g. Scroll of Frost Spike ❄️"
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
              />
            </div>

            {/* Spell Color */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Accent Theme Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={spellColor}
                  onChange={(e) => setSpellColor(e.target.value)}
                  className="h-9 w-12 bg-slate-950 border border-slate-850 p-1 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={spellColor}
                  onChange={(e) => setSpellColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Base Damage */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Spell Base Damage</label>
              <input
                type="number"
                value={spellDamage}
                onChange={(e) => setSpellDamage(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
              />
            </div>

            {/* MP Cost */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">MP Casting Cost</label>
              <input
                type="number"
                value={spellMpCost}
                onChange={(e) => setSpellMpCost(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
              />
            </div>

            {/* Value */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Sovereign Gold Value</label>
              <input
                type="number"
                value={spellValue}
                onChange={(e) => setSpellValue(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
              />
            </div>

            {/* Element / Catalyst Type */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Elemental Core</label>
              <select
                value={spellElement}
                onChange={(e) => setSpellElement(e.target.value as CatalystType)}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none h-9"
              >
                {Object.values(CatalystType).map((type) => (
                  <option key={type} value={type}>
                    {type} Core Magic
                  </option>
                ))}
              </select>
            </div>

            {/* Debuff Duration */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Status Duration (turns)</label>
              <input
                type="number"
                value={spellDebuffDuration}
                onChange={(e) => setSpellDebuffDuration(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
              />
            </div>

            {/* Debuff damage */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Status Damage/Turn</label>
              <input
                type="number"
                value={spellDebuffDmg}
                onChange={(e) => setSpellDebuffDmg(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
              />
            </div>

            {/* Material requirement */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Recipe: Material Component</label>
              <select
                value={spellMatId}
                onChange={(e) => setSpellMatId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none h-9"
              >
                {Object.entries(MATERIAL_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Material Quantity Required</label>
              <input
                type="number"
                value={spellMatQty}
                onChange={(e) => setSpellMatQty(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
              />
            </div>

            <div className="hidden sm:block"></div>

            {/* Catalyst requirement */}
            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Recipe: Catalyst Component</label>
              <select
                value={spellCatId}
                onChange={(e) => setSpellCatId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none h-9"
              >
                {Object.entries(CATALYST_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Catalyst Quantity Required</label>
              <input
                type="number"
                value={spellCatQty}
                onChange={(e) => setSpellCatQty(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Spell Description */}
          <div>
            <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Spell Lore Description</label>
            <textarea
              value={spellDesc}
              onChange={(e) => setSpellDesc(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-200 text-xs font-mono focus:border-rose-600 focus:outline-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-800/40">
            <button
              onClick={saveScrollTemplate}
              className="flex-1 py-2 bg-gradient-to-r from-rose-955/70 to-slate-900 hover:from-rose-900 hover:to-slate-800 border border-rose-800 hover:border-rose-600 text-rose-300 font-bold text-[10.5px] rounded-lg tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{selectedScrollIndex !== null ? 'Save Blueprint Updates' : 'Add to Constructor Recipes'}</span>
            </button>

            <button
              onClick={() => {
                const template = SPELL_SCROLLS[selectedScrollIndex ?? (SPELL_SCROLLS.length - 1)];
                if (!template) return;
                const item = getSpellScrollAsEquipmentItem(template, Date.now());
                setGameState((prev) => ({
                  ...prev,
                  equipmentInventory: [...prev.equipmentInventory, item],
                  logs: [
                    ...prev.logs,
                    {
                      id: `admin_inject_scroll_${Date.now()}`,
                      text: `🎁 ADMIN INJECT: Deposited ${template.name} directly into your backpack inventory bag!`,
                      type: 'system',
                      timestamp: 'GOD'
                    }
                  ]
                }));
                window.dispatchEvent(new CustomEvent('spawn-game-effect', {
                  detail: { x: gameState.playerX, y: gameState.playerY, text: `+1 ${template.name}`, type: 'heal' },
                }));
                triggerSuccessLog(`Manifested ${template.name}!`);
              }}
              className="flex-1 py-2 bg-gradient-to-r from-emerald-955/70 to-slate-900 hover:from-emerald-900 hover:to-slate-800 border border-emerald-800 hover:border-emerald-600 text-emerald-300 font-bold text-[10.5px] rounded-lg tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manifest 1x & Deposit directly to Inventory Backpack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
