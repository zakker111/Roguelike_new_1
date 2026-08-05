import React from 'react';
import { SPELL_SCROLLS } from '../../utils/spellScrolls';
import { EquipmentItem } from '../../types';

interface ScrollScriptoriumTabProps {
  inventoryMaterials: { [matId: string]: number };
  inventoryCatalysts: { [catId: string]: number };
  equipmentInventory?: EquipmentItem[];
  onCraftSpellScroll?: (templateId: string) => void;
}

export const ScrollScriptoriumTab: React.FC<ScrollScriptoriumTabProps> = ({
  inventoryMaterials,
  inventoryCatalysts,
  equipmentInventory = [],
  onCraftSpellScroll,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-xl">✨</span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Spell Scroll Scriptorium</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Inscribe magical scrolls with rare components to unleash devastating spells in battle</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SPELL_SCROLLS.map((template) => {
            const hasMaterials = Object.entries(template.recipe.materials).every(
              ([matId, req]) => (inventoryMaterials[matId] || 0) >= req.required
            );
            const hasCatalysts = Object.entries(template.recipe.catalysts).every(
              ([catId, req]) => (inventoryCatalysts[catId] || 0) >= req.required
            );
            const canCraft = hasMaterials && hasCatalysts;
            const ownedCount = equipmentInventory.filter(item => item.id.includes(template.id)).length;

            return (
              <div key={template.id} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>✨</span>
                    <span>{template.name}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Scribe a magic scroll to unleash powerful spell effects in battles.</p>
                  
                  <div className="mb-4">
                    <span className="text-xxs font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Ingredients:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(template.recipe.materials).map(([matId, req]) => {
                        const owned = inventoryMaterials[matId] || 0;
                        return (
                          <span key={matId} className={`px-1.5 py-0.5 rounded text-xxs font-mono border ${
                            owned >= req.required ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                          }`}>
                            {req.name} ({owned}/{req.required})
                          </span>
                        );
                      })}
                      {Object.entries(template.recipe.catalysts).map(([catId, req]) => {
                        const owned = inventoryCatalysts[catId] || 0;
                        return (
                          <span key={catId} className={`px-1.5 py-0.5 rounded text-xxs font-mono border ${
                            owned >= req.required ? 'bg-slate-900 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                          }`}>
                            {req.name} ({owned}/{req.required})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onCraftSpellScroll?.(template.id)}
                  disabled={!canCraft}
                  className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border shadow-lg transition-all duration-300 select-none cursor-pointer"
                  style={{
                    backgroundColor: canCraft ? `${template.color}15` : '#0f172a',
                    borderColor: canCraft ? template.color : '#1e293b',
                    color: canCraft ? template.color : '#64748b',
                  }}
                >
                  <span>Scribe {template.name.replace("Scroll of ", "")}</span>
                </button>
                <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1.5 px-1 font-mono">
                  <span>Owned: x{ownedCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
