/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CookingRecipe, COOKING_RECIPES } from '../../data/recipes';
import { getMaterialById, getCatalystById } from '../../data/items';
import { Flame, Check, Utensils } from 'lucide-react';
import { RecipeCard, IngredientRequirement, RecipeStatPreview } from './RecipeCard';

export interface CookingTabProps {
  isNextToCampfire: boolean;
  onRestCampfire?: () => void;
  getMaterialCount: (matId: string) => number;
  getCatalystCount: (catId: string) => number;
  hasIngredients: (materials: { [matId: string]: number }, catalysts: { [catId: string]: number }) => boolean;
  handleCook: (recipe: CookingRecipe) => void;
  onCookMeat?: () => void;
  onCookPrimeMeat?: () => void;
  onCookFish?: () => void;
  searchQuery?: string;
}

export const CookingTab = React.memo<CookingTabProps>(({
  isNextToCampfire,
  onRestCampfire,
  getMaterialCount,
  getCatalystCount,
  hasIngredients,
  handleCook,
  onCookMeat,
  onCookPrimeMeat,
  onCookFish,
  searchQuery = '',
}) => {
  const rawMeatCount = getMaterialCount('mat_raw_meat');
  const primeMeatCount = getMaterialCount('mat_prime_meat');
  const rawFishCount = getMaterialCount('mat_raw_fish');

  const filteredRecipes = COOKING_RECIPES.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      (r.buff?.name && r.buff.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5" id="campfire_gourmet_cooking_subtab">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Column 1: Campfire Heat Status & Rest Controls (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4 pr-0 lg:pr-4 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-4 lg:pb-0">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-2">
            <div className="w-6 h-6 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center">
              <Flame className={`w-3.5 h-3.5 ${isNextToCampfire ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Campfire Proximity</h3>
              <p className="text-[10px] text-slate-400 font-mono">Lit embers required for grilling & culinary rations</p>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all shadow-xl ${
              isNextToCampfire
                ? 'bg-amber-950/20 border-amber-500/40 shadow-amber-500/5'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div
              className={`p-3.5 rounded-2xl ${
                isNextToCampfire ? 'bg-amber-500/20 text-amber-400 animate-pulse border border-amber-500/30' : 'bg-slate-900 text-slate-600 border border-slate-800'
              }`}
            >
              <Flame className="w-7 h-7" />
            </div>

            <div>
              <span
                className={`text-xs font-black uppercase tracking-wider block ${
                  isNextToCampfire ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {isNextToCampfire ? '🔥 Standing Next to Lit Fire' : '❄️ No Active Campfire Nearby'}
              </span>
              <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                {isNextToCampfire
                  ? 'Warmth radiates softly. Culinary recipes, raw meat roasting, and stamina rests are active!'
                  : 'Locate or build a Campfire (Camp & Tools tab) on adjacent ground to unlock cooking.'}
              </p>
            </div>

            <div className="w-full pt-2.5 border-t border-slate-800/80 flex flex-col gap-1.5">
              <span className="text-[9.5px] uppercase font-mono font-bold text-slate-400">Campfire Rest Action</span>
              <button
                onClick={onRestCampfire}
                disabled={!isNextToCampfire}
                className={`w-full py-2 px-3 rounded-xl text-[10px] uppercase font-black font-mono transition-all border ${
                  isNextToCampfire
                    ? 'bg-amber-500 border-amber-400 text-slate-950 hover:bg-amber-400 hover:scale-[1.02] cursor-pointer shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                Rest at Fire (Restore Stamina)
              </button>
            </div>
          </div>

          {/* Quick Spit-Roasting Cards in sidebar */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
              <span className="text-base">🥩</span>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Wilderness Spit-Roasting</h4>
            </div>

            <div className="space-y-2">
              {/* Roast Raw Meat */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">🍖 Roast Raw Meat</span>
                  <span className="text-[9.5px] font-mono text-slate-400">
                    Stock: <strong className={rawMeatCount >= 1 ? 'text-emerald-400' : 'text-rose-400'}>{rawMeatCount}/1</strong> (+25 HP)
                  </span>
                </div>
                <button
                  onClick={onCookMeat}
                  disabled={!isNextToCampfire || rawMeatCount < 1}
                  className={`px-3 py-1.5 rounded-lg text-[9.5px] font-mono font-bold uppercase border transition-all ${
                    isNextToCampfire && rawMeatCount >= 1
                      ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 cursor-pointer shadow'
                      : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                  }`}
                >
                  Roast
                </button>
              </div>

              {/* Flame-Grill Prime Meat */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">🥩 Grill Prime Meat</span>
                  <span className="text-[9.5px] font-mono text-slate-400">
                    Stock: <strong className={primeMeatCount >= 1 ? 'text-emerald-400' : 'text-rose-400'}>{primeMeatCount}/1</strong> (+45 HP)
                  </span>
                </div>
                <button
                  onClick={onCookPrimeMeat}
                  disabled={!isNextToCampfire || primeMeatCount < 1}
                  className={`px-3 py-1.5 rounded-lg text-[9.5px] font-mono font-bold uppercase border transition-all ${
                    isNextToCampfire && primeMeatCount >= 1
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 cursor-pointer shadow'
                      : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                  }`}
                >
                  Grill
                </button>
              </div>

              {/* Grill Raw Fish */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">🐟 Grill Raw Fish</span>
                  <span className="text-[9.5px] font-mono text-slate-400">
                    Stock: <strong className={rawFishCount >= 1 ? 'text-emerald-400' : 'text-rose-400'}>{rawFishCount}/1</strong> (+30 HP)
                  </span>
                </div>
                <button
                  onClick={onCookFish}
                  disabled={!isNextToCampfire || rawFishCount < 1}
                  className={`px-3 py-1.5 rounded-lg text-[9.5px] font-mono font-bold uppercase border transition-all ${
                    isNextToCampfire && rawFishCount >= 1
                      ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400 cursor-pointer shadow'
                      : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                  }`}
                >
                  Grill
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Campfire Gourmet Recipes (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍳</span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Gourmet Culinary Rations</h3>
                <p className="text-[10px] text-slate-400 font-mono">Synthesize hearty rations with powerful long-lasting status buffs</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Showing {filteredRecipes.length} recipes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecipes.map((recipe) => {
              const owned = hasIngredients(recipe.materials, recipe.catalysts || {});
              const canCook = owned && isNextToCampfire;

              // Format materials for RecipeCard
              const matList: IngredientRequirement[] = Object.entries(recipe.materials).map(([matId, qty]) => {
                const count = getMaterialCount(matId);
                const matData = getMaterialById(matId);
                return {
                  id: matId,
                  name: matData?.name || matId,
                  required: qty,
                  owned: count,
                  icon: (matData as any)?.icon,
                };
              });

              // Format catalysts
              const catList: IngredientRequirement[] = Object.entries(recipe.catalysts || {}).map(([catId, qty]) => {
                const count = getCatalystCount(catId);
                const catData = getCatalystById(catId);
                return {
                  id: catId,
                  name: catData?.name || catId,
                  required: qty,
                  owned: count,
                  icon: (catData as any)?.icon,
                };
              });

              // Stats preview
              const stats: RecipeStatPreview[] = [
                { label: 'HP Recovery', value: `+${recipe.restoringHp} HP`, color: 'text-rose-400 font-bold' },
                ...(recipe.restoringMp ? [{ label: 'MP Recovery', value: `+${recipe.restoringMp} MP`, color: 'text-sky-400 font-bold' }] : []),
                ...(recipe.buff ? [{ label: 'Duration', value: `${recipe.buff.turnsRemaining} Turns`, color: 'text-emerald-400 font-bold' }] : []),
              ];

              return (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.name}
                  icon="🍳"
                  description={recipe.description}
                  categoryBadge="Culinary Meal"
                  tierBadge={recipe.buff ? `Buff: ${recipe.buff.name}` : undefined}
                  materials={matList}
                  catalysts={catList}
                  statsPreview={stats}
                  canCraft={canCook}
                  onCraft={() => handleCook(recipe)}
                  craftButtonLabel="Cook & Consume"
                  disabledReason={!isNextToCampfire ? 'Must be standing next to campfire' : !owned ? 'Missing ingredients' : undefined}
                  themeColor="emerald"
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default CookingTab;
