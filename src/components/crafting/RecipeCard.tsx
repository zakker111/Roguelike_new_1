/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, X, Sparkles } from 'lucide-react';

export interface IngredientRequirement {
  id: string;
  name: string;
  required: number;
  owned: number;
  icon?: string;
}

export interface RecipeStatPreview {
  label: string;
  value: string | number;
  color?: string;
}

export interface RecipeCardProps {
  id: string;
  title: string;
  icon?: React.ReactNode | string;
  description: string;
  categoryBadge?: string;
  tierBadge?: string;
  tierBadgeColor?: string;
  materials: IngredientRequirement[];
  catalysts?: IngredientRequirement[];
  statsPreview?: RecipeStatPreview[];
  canCraft: boolean;
  onCraft: (quantity: number) => void;
  craftButtonLabel?: string;
  ownedCount?: number;
  disabledReason?: string;
  themeColor?: 'amber' | 'emerald' | 'purple' | 'sky' | 'teal' | 'rose' | 'pink';
  allowBatch?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  id,
  title,
  icon,
  description,
  categoryBadge,
  tierBadge,
  tierBadgeColor,
  materials,
  catalysts = [],
  statsPreview = [],
  canCraft,
  onCraft,
  craftButtonLabel = 'Craft Item',
  ownedCount,
  disabledReason,
  themeColor = 'amber',
  allowBatch = false,
}) => {
  const [craftQuantity, setCraftQuantity] = useState<number>(1);

  // Determine maximum possible crafts given ingredients
  const maxCraftPossible = Math.min(
    ...materials.map((m) => Math.floor(m.owned / (m.required || 1))),
    ...catalysts.map((c) => Math.floor(c.owned / (c.required || 1))),
    99
  );

  const effectiveMax = Math.max(1, maxCraftPossible);

  const handleCraftClick = () => {
    if (canCraft) {
      onCraft(craftQuantity);
    }
  };

  const getThemeStyles = () => {
    switch (themeColor) {
      case 'emerald':
        return {
          borderActive: 'border-emerald-500/40 hover:border-emerald-400/60 shadow-emerald-950/30',
          badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
          btnActive: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black border-emerald-400/40',
          ringFocus: 'focus:ring-emerald-500',
        };
      case 'purple':
        return {
          borderActive: 'border-purple-500/40 hover:border-purple-400/60 shadow-purple-950/30',
          badgeBg: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
          btnActive: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black border-purple-400/40',
          ringFocus: 'focus:ring-purple-500',
        };
      case 'sky':
        return {
          borderActive: 'border-sky-500/40 hover:border-sky-400/60 shadow-sky-950/30',
          badgeBg: 'bg-sky-950/60 text-sky-300 border-sky-500/30',
          btnActive: 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-slate-950 font-black border-sky-400/40',
          ringFocus: 'focus:ring-sky-500',
        };
      case 'pink':
        return {
          borderActive: 'border-pink-500/40 hover:border-pink-400/60 shadow-pink-950/30',
          badgeBg: 'bg-pink-950/60 text-pink-300 border-pink-500/30',
          btnActive: 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black border-pink-400/40',
          ringFocus: 'focus:ring-pink-500',
        };
      case 'teal':
        return {
          borderActive: 'border-teal-500/40 hover:border-teal-400/60 shadow-teal-950/30',
          badgeBg: 'bg-teal-950/60 text-teal-300 border-teal-500/30',
          btnActive: 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black border-teal-400/40',
          ringFocus: 'focus:ring-teal-500',
        };
      case 'amber':
      default:
        return {
          borderActive: 'border-amber-500/40 hover:border-amber-400/60 shadow-amber-950/30',
          badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
          btnActive: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black border-amber-400/40',
          ringFocus: 'focus:ring-amber-500',
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div
      className={`p-4 bg-slate-950/80 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-xl ${
        canCraft
          ? `${styles.borderActive} shadow-lg`
          : 'border-slate-800/80 opacity-90'
      }`}
    >
      <div>
        {/* Header line with Title, Icon & Badges */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0 shadow-inner">
                {icon}
              </div>
            )}
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>{title}</span>
              </h4>
              {categoryBadge && (
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {categoryBadge}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {tierBadge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border ${
                  tierBadgeColor || styles.badgeBg
                }`}
              >
                {tierBadge}
              </span>
            )}
            {typeof ownedCount === 'number' && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400">
                x{ownedCount} Owned
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
          {description}
        </p>

        {/* Stats Preview Grid (if any) */}
        {statsPreview.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 mb-3 font-mono text-[10px]">
            {statsPreview.map((stat, idx) => (
              <div key={idx} className="flex justify-between items-center px-1">
                <span className="text-slate-400">{stat.label}:</span>
                <span className={`font-bold ${stat.color || 'text-slate-200'}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Required Ingredients Ledger */}
        <div className="mb-4">
          <span className="text-[9.5px] font-bold text-slate-400 font-mono tracking-wider uppercase block mb-1.5">
            Required Ingredients:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {/* Materials */}
            {materials.map((mat) => {
              const reqTotal = mat.required * craftQuantity;
              const hasEnough = mat.owned >= reqTotal;
              return (
                <span
                  key={mat.id}
                  className={`px-2.5 py-1 rounded-xl text-[9.5px] font-mono flex items-center gap-1.5 border transition-all ${
                    hasEnough
                      ? 'bg-slate-900 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-900/30 text-rose-300'
                  }`}
                  title={`${mat.name}: Owned ${mat.owned}, Need ${reqTotal}`}
                >
                  {mat.icon && <span>{mat.icon}</span>}
                  <span>
                    {mat.name} ({mat.owned}/{reqTotal})
                  </span>
                  {hasEnough ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-rose-400 shrink-0" />
                  )}
                </span>
              );
            })}

            {/* Catalysts */}
            {catalysts.map((cat) => {
              const reqTotal = cat.required * craftQuantity;
              const hasEnough = cat.owned >= reqTotal;
              return (
                <span
                  key={cat.id}
                  className={`px-2.5 py-1 rounded-xl text-[9.5px] font-mono flex items-center gap-1.5 border transition-all ${
                    hasEnough
                      ? 'bg-slate-900 border-purple-500/30 text-purple-300'
                      : 'bg-rose-950/20 border-rose-900/30 text-rose-300'
                  }`}
                  title={`${cat.name}: Owned ${cat.owned}, Need ${reqTotal}`}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>
                    {cat.name} ({cat.owned}/{reqTotal})
                  </span>
                  {hasEnough ? (
                    <Check className="w-3 h-3 text-purple-400 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-rose-400 shrink-0" />
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action / Batch section */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
        {allowBatch && maxCraftPossible > 1 && (
          <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-[10px] font-mono">
            <span className="text-slate-400 px-1">Quantity:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCraftQuantity(Math.max(1, craftQuantity - 1))}
                disabled={craftQuantity <= 1}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold flex items-center justify-center cursor-pointer transition-all"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-amber-400">
                {craftQuantity}
              </span>
              <button
                type="button"
                onClick={() => setCraftQuantity(Math.min(effectiveMax, craftQuantity + 1))}
                disabled={craftQuantity >= effectiveMax}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold flex items-center justify-center cursor-pointer transition-all"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setCraftQuantity(effectiveMax)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold cursor-pointer transition-all ml-1"
              >
                Max ({effectiveMax})
              </button>
            </div>
          </div>
        )}

        <button
          id={`btn-craft-${id}`}
          onClick={handleCraftClick}
          disabled={!canCraft}
          className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border shadow-lg transition-all duration-200 cursor-pointer ${
            canCraft
              ? `${styles.btnActive} hover:scale-[1.01] active:scale-[0.98]`
              : 'bg-slate-950 text-slate-600 border-slate-850 cursor-not-allowed opacity-60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {craftButtonLabel}
            {craftQuantity > 1 ? ` (x${craftQuantity})` : ''}
          </span>
        </button>

        {disabledReason && !canCraft && (
          <p className="text-[9.5px] font-mono text-rose-400/90 text-center">
            ⚠️ {disabledReason}
          </p>
        )}
      </div>
    </div>
  );
};
