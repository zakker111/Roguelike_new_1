/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SPELL_SCROLLS } from '../../utils/spellScrolls';
import { EquipmentItem } from '../../types';
import { RecipeCard, IngredientRequirement, RecipeStatPreview } from './RecipeCard';

export interface ScrollScriptoriumTabProps {
  inventoryMaterials: { [matId: string]: number };
  inventoryCatalysts: { [catId: string]: number };
  equipmentInventory?: EquipmentItem[];
  onCraftSpellScroll?: (templateId: string) => void;
  onCraftRecallScroll?: () => void;
  searchQuery?: string;
}

export const ScrollScriptoriumTab: React.FC<ScrollScriptoriumTabProps> = ({
  inventoryMaterials,
  inventoryCatalysts,
  equipmentInventory = [],
  onCraftSpellScroll,
  onCraftRecallScroll,
  searchQuery = '',
}) => {
  const filteredScrolls = SPELL_SCROLLS.filter((scroll) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return scroll.name.toLowerCase().includes(q) || scroll.description.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✨</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Spell Scroll Scriptorium
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Inscribe magical scrolls with rare components to unleash devastating spells in battle
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Showing {filteredScrolls.length} scrolls
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScrolls.map((template) => {
            const hasMaterials = Object.entries(template.recipe.materials).every(
              ([matId, req]) => (inventoryMaterials[matId] || 0) >= req.required
            );
            const hasCatalysts = Object.entries(template.recipe.catalysts).every(
              ([catId, req]) => (inventoryCatalysts[catId] || 0) >= req.required
            );
            const canCraft = hasMaterials && hasCatalysts;
            const ownedCount = equipmentInventory.filter((item) =>
              item.id.includes(template.id)
            ).length;

            const matList: IngredientRequirement[] = Object.entries(template.recipe.materials).map(
              ([matId, req]) => ({
                id: matId,
                name: req.name,
                required: req.required,
                owned: inventoryMaterials[matId] || 0,
              })
            );

            const catList: IngredientRequirement[] = Object.entries(template.recipe.catalysts).map(
              ([catId, req]) => ({
                id: catId,
                name: req.name,
                required: req.required,
                owned: inventoryCatalysts[catId] || 0,
              })
            );

            const spellLevel = (template as any).spellLevel || (template.baseDamage > 25 ? 3 : template.baseDamage > 12 ? 2 : 1);
            const stats: RecipeStatPreview[] = [
              { label: 'Element', value: template.element, color: 'text-sky-400 font-bold' },
              { label: 'Spell Level', value: `Lvl ${spellLevel}`, color: 'text-amber-400 font-bold' },
            ];

            return (
              <RecipeCard
                key={template.id}
                id={template.id}
                title={template.name}
                icon="📜"
                description={template.description || 'Scribe a magic parchment to cast supreme spells during encounters.'}
                categoryBadge="Arcane Scroll"
                tierBadge={`Lvl ${spellLevel}`}
                materials={matList}
                catalysts={catList}
                statsPreview={stats}
                canCraft={canCraft}
                onCraft={() => onCraftSpellScroll?.(template.id)}
                craftButtonLabel={`Scribe ${template.name.replace('Scroll of ', '')}`}
                ownedCount={ownedCount}
                disabledReason={!canCraft ? 'Missing parchment or catalyst elements' : undefined}
                themeColor="sky"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScrollScriptoriumTab;
