/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrewingRecipe, BREWING_RECIPES } from '../../data/recipes';
import { TrendingUp, Check, Beaker } from 'lucide-react';

export interface AlchemyTabProps {
  labTier: number;
  nextUpgradeCost: number;
  playerGold: number;
  handleUpgradeLab: () => void;
  getMaterialCount: (matId: string) => number;
  getCatalystCount: (catId: string) => number;
  hasIngredients: (materials: { [matId: string]: number }, catalysts: { [catId: string]: number }) => boolean;
  handleBrew: (recipe: BrewingRecipe) => void;
}

export const AlchemyTab: React.FC<AlchemyTabProps> = ({
  labTier,
  nextUpgradeCost,
  playerGold,
  handleUpgradeLab,
  getMaterialCount,
  getCatalystCount,
  hasIngredients,
  handleBrew,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4" id="alchemical_brewing_subtab">
      {/* Laboratory Tier Upgrader Header */}
      <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="font-bold text-xs font-mono text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>Apothecary Alchemical Lab Upgrades</span>
          </h3>
          <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
            Unlock superior recipes by upgrading your laboratory. Current Laboratory Tier: <strong className="text-purple-300">{labTier} / 3</strong>
          </p>
        </div>

        {labTier < 3 ? (
          <button
            disabled={playerGold < nextUpgradeCost}
            onClick={handleUpgradeLab}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all border ${
              playerGold >= nextUpgradeCost
                ? 'bg-purple-600 border-purple-500 hover:bg-purple-700 text-white cursor-pointer active:scale-95'
                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Upgrade to Tier {labTier + 1} ({nextUpgradeCost} Gold)
          </button>
        ) : (
          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] font-mono text-purple-400 font-bold">
            ★ Maximum Lab Tier Unlocked
          </span>
        )}
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BREWING_RECIPES.map((recipe) => {
          const owned = hasIngredients(recipe.materials, recipe.catalysts);
          const hasTier = labTier >= recipe.requiredTier;
          const isUsable = owned && hasTier;

          return (
            <div
              key={recipe.id}
              className={`p-4 bg-slate-950/40 rounded-xl border transition-all flex flex-col justify-between ${
                isUsable
                  ? 'border-purple-500/30 bg-purple-950/5'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Name & Lab Tier Badges */}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-100">{recipe.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${
                    hasTier
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    Required Tier {recipe.requiredTier}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-normal">{recipe.description}</p>

                {/* Ingredients list */}
                <div className="mb-4">
                  <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1">Required Ingredients:</span>
                  <div className="flex flex-wrap gap-2">
                    {/* Materials */}
                    {Object.entries(recipe.materials).map(([matId, qty]) => {
                      const count = getMaterialCount(matId);
                      const name = matId === 'mat_birch_log' ? 'Birch Log' : matId === 'mat_pine_log' ? 'Pine Log' : matId === 'mat_iron_ore' ? 'Iron Ore' : matId === 'mat_copper_ore' ? 'Copper Ore' : 'Berry';
                      return (
                        <span
                          key={matId}
                          className={`px-2 py-1 rounded text-[9px] font-mono flex items-center gap-1 border ${
                            count >= qty
                              ? 'bg-slate-900 border-purple-500/20 text-purple-300'
                              : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                          }`}
                        >
                          <span>{name} ({count}/{qty})</span>
                          {count >= qty ? <Check className="w-3 h-3 text-purple-400" /> : <span className="text-rose-400">✗</span>}
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
                              ? 'bg-slate-900 border-purple-500/20 text-purple-300'
                              : 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                          }`}
                        >
                          <span>{name} ({count}/{qty})</span>
                          {count >= qty ? <Check className="w-3 h-3 text-purple-400" /> : <span className="text-rose-400">✗</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                disabled={!isUsable}
                onClick={() => handleBrew(recipe)}
                className={`w-full py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  isUsable
                    ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer active:scale-[0.98] shadow-lg shadow-purple-500/10'
                    : 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-850'
                }`}
              >
                <Beaker className="w-3.5 h-3.5" />
                <span>{!hasTier ? `Requires Lab Tier ${recipe.requiredTier}` : !owned ? 'Missing Ingredients' : 'Distill Elixir'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
