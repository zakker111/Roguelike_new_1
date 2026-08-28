/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrewingRecipe, BREWING_RECIPES } from '../../data/recipes';
import { getMaterialById, getCatalystById } from '../../data/items';
import { TrendingUp, Sparkles, Beaker } from 'lucide-react';
import { RecipeCard, IngredientRequirement, RecipeStatPreview } from './RecipeCard';

export interface AlchemyTabProps {
  labTier: number;
  nextUpgradeCost: number;
  playerGold: number;
  handleUpgradeLab: () => void;
  getMaterialCount: (matId: string) => number;
  getCatalystCount: (catId: string) => number;
  hasIngredients: (materials: { [matId: string]: number }, catalysts: { [catId: string]: number }) => boolean;
  handleBrew: (recipe: BrewingRecipe) => void;
  searchQuery?: string;
}

export const AlchemyTab = React.memo<AlchemyTabProps>(({
  labTier,
  nextUpgradeCost,
  playerGold,
  handleUpgradeLab,
  getMaterialCount,
  getCatalystCount,
  hasIngredients,
  handleBrew,
  searchQuery = '',
}) => {
  const filteredRecipes = BREWING_RECIPES.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5" id="alchemical_brewing_subtab">
      {/* Laboratory Tier Upgrader Header */}
      <div className="p-4 bg-slate-950/80 rounded-2xl border border-purple-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Beaker className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-xs font-mono text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Apothecary Alchemical Lab Upgrades</span>
            </h3>
            <p className="text-[10.5px] text-slate-400 mt-0.5 leading-relaxed font-mono">
              Unlock grandmaster elixirs by upgrading your laboratory. Current Laboratory Tier:{' '}
              <strong className="text-purple-300 font-bold">{labTier} / 3</strong>
            </p>
          </div>
        </div>

        {labTier < 3 ? (
          <button
            disabled={playerGold < nextUpgradeCost}
            onClick={handleUpgradeLab}
            className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all border shadow-md flex items-center gap-1.5 ${
              playerGold >= nextUpgradeCost
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95'
                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Upgrade to Tier {labTier + 1} ({nextUpgradeCost} Gold)</span>
          </button>
        ) : (
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[10px] font-mono text-purple-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>★ Maximum Lab Tier Unlocked</span>
          </span>
        )}
      </div>

      {/* Recipes Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧪</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Alchemical Concoctions & Stat Elixirs
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Brew potent draughts that restore vitality or grant permanent attribute boosts
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Showing {filteredRecipes.length} recipes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecipes.map((recipe) => {
            const owned = hasIngredients(recipe.materials, recipe.catalysts || {});
            const hasTier = labTier >= recipe.requiredTier;
            const canBrew = owned && hasTier;

            // Format materials
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
              ...(recipe.restoringHp ? [{ label: 'HP Recovery', value: `+${recipe.restoringHp} HP`, color: 'text-rose-400 font-bold' }] : []),
              ...(recipe.restoringMp ? [{ label: 'MP Recovery', value: `+${recipe.restoringMp} MP`, color: 'text-sky-400 font-bold' }] : []),
              ...(recipe.permanentStats?.str ? [{ label: 'Perm STR', value: `+${recipe.permanentStats.str}`, color: 'text-amber-400 font-bold' }] : []),
              ...(recipe.permanentStats?.int ? [{ label: 'Perm INT', value: `+${recipe.permanentStats.int}`, color: 'text-indigo-400 font-bold' }] : []),
              ...(recipe.permanentStats?.def ? [{ label: 'Perm DEF', value: `+${recipe.permanentStats.def}`, color: 'text-emerald-400 font-bold' }] : []),
              ...(recipe.permanentStats?.lck ? [{ label: 'Perm LCK', value: `+${recipe.permanentStats.lck}`, color: 'text-yellow-400 font-bold' }] : []),
            ];

            return (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.name}
                icon="🧪"
                description={recipe.description}
                categoryBadge="Alchemical Elixir"
                tierBadge={`Tier ${recipe.requiredTier}`}
                tierBadgeColor={hasTier ? 'bg-purple-950/60 text-purple-300 border-purple-500/40' : 'bg-rose-950/60 text-rose-300 border-rose-500/40'}
                materials={matList}
                catalysts={catList}
                statsPreview={stats}
                canCraft={canBrew}
                onCraft={() => handleBrew(recipe)}
                craftButtonLabel="Brew Elixir"
                disabledReason={!hasTier ? `Requires Apothecary Tier ${recipe.requiredTier}` : !owned ? 'Missing ingredients' : undefined}
                themeColor="purple"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default AlchemyTab;
