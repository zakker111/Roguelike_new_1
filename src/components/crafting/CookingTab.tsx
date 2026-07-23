/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CookingRecipe, COOKING_RECIPES } from '../../data/recipes';
import { Flame, Check } from 'lucide-react';

export interface CookingTabProps {
  isNextToCampfire: boolean;
  onRestCampfire: () => void;
  getMaterialCount: (matId: string) => number;
  getCatalystCount: (catId: string) => number;
  hasIngredients: (materials: { [matId: string]: number }, catalysts: { [catId: string]: number }) => boolean;
  handleCook: (recipe: CookingRecipe) => void;
}

export const CookingTab: React.FC<CookingTabProps> = ({
  isNextToCampfire,
  onRestCampfire,
  getMaterialCount,
  getCatalystCount,
  hasIngredients,
  handleCook,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4" id="campfire_gourmet_cooking_subtab">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Column 1: Campfire Heat Status & Rest Controls (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4 pr-0 lg:pr-6 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Flame className={`w-4 h-4 ${isNextToCampfire ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Campfire Proximity</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Cooking gourmet rations requires standing adjacent to a lit campfire</p>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border flex flex-col items-center text-center gap-3 transition-all ${
              isNextToCampfire
                ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div
              className={`p-3 rounded-full ${
                isNextToCampfire ? 'bg-amber-500/20 text-amber-400 animate-bounce' : 'bg-slate-800/40 text-slate-600'
              }`}
            >
              <Flame className="w-8 h-8" />
            </div>

            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider block ${
                  isNextToCampfire ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {isNextToCampfire ? '🔥 Standing Next to Lit Fire' : '❄️ No Active Campfire Nearby'}
              </span>
              <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                {isNextToCampfire
                  ? 'Warmth radiates softly. Culinary recipes and stamina rests are fully unlocked!'
                  : 'Locate or build a Campfire on adjacent ground to unlock culinary rations & rest buffs.'}
              </p>
            </div>

            <div className="w-full pt-2 border-t border-slate-800/60 flex flex-col gap-1.5">
              <span className="text-[9.5px] uppercase font-mono font-bold text-slate-500">Campfire Rest Action</span>
              <button
                onClick={onRestCampfire}
                disabled={!isNextToCampfire}
                className={`w-full py-1.5 px-3 rounded text-[10px] uppercase font-black transition-all ${
                  isNextToCampfire
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer'
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                }`}
              >
                Rest at Fire
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Campfire Gourmet Cooking (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xl">🍳</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Campfire Gourmet Cooking</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Synthesize premium meals with powerful long-lasting status buffs</p>
            </div>
          </div>

          {/* Recipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COOKING_RECIPES.map((recipe) => {
              const owned = hasIngredients(recipe.materials, recipe.catalysts);

              return (
                <div
                  key={recipe.id}
                  className={`p-4 bg-slate-950/40 rounded-xl border transition-all flex flex-col justify-between ${
                    owned && isNextToCampfire
                      ? 'border-emerald-500/30 bg-emerald-950/5'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Name & Buff Badges */}
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm text-slate-100">{recipe.name}</h4>
                      {recipe.buff && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-bold font-mono text-emerald-400">
                          BUFF +25 Turns
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-3 leading-normal">{recipe.description}</p>

                    {/* Ingredients list */}
                    <div className="mb-4">
                      <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Ingredients:</span>
                      <div className="flex flex-wrap gap-2">
                        {/* Materials */}
                        {Object.entries(recipe.materials).map(([matId, qty]) => {
                          const count = getMaterialCount(matId);
                          const name = matId === 'mat_raw_fish' ? 'Raw Fish' : matId === 'mat_berry' ? 'Berries' : matId === 'mat_raw_meat' ? 'Raw Meat' : 'Wood Log';
                          return (
                            <span
                              key={matId}
                              className={`px-2 py-1 rounded text-[9px] font-mono flex items-center gap-1 border ${
                                count >= qty
                                  ? 'bg-slate-900 border-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                              }`}
                            >
                              <span>{name} ({count}/{qty})</span>
                              {count >= qty ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                            </span>
                          );
                        })}
                        {/* Catalysts */}
                        {Object.entries(recipe.catalysts).map(([catId, qty]) => {
                          const count = getCatalystCount(catId);
                          const name = catId === 'cat_lightning' ? '⚡ Lightning' : catId === 'cat_fire' ? '🔥 Fire' : catId === 'cat_frost' ? '❄️ Frost' : '🌙 Shadow';
                          return (
                            <span
                              key={catId}
                              className={`px-2 py-1 rounded text-[9px] font-mono flex items-center gap-1 border ${
                                count >= qty
                                  ? 'bg-slate-900 border-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                              }`}
                            >
                              <span>{name} ({count}/{qty})</span>
                              {count >= qty ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="text-rose-400">✗</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    disabled={!owned || !isNextToCampfire}
                    onClick={() => handleCook(recipe)}
                    className={`w-full py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      owned && isNextToCampfire
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 cursor-pointer active:scale-[0.98] shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-850'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{isNextToCampfire ? 'Prepare & Consume Gourmet' : 'Requires Campfire To Cook'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
