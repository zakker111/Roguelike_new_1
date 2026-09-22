import React from 'react';
import { GameState } from '../../../types';

export interface ApothecaryStationProps {
  gameState: GameState;
  onUpgradeApothecary: () => void;
}

export const ApothecaryStation: React.FC<ApothecaryStationProps> = ({
  gameState,
  onUpgradeApothecary
}) => {
  const apothecaryTier = gameState.apothecaryTier ?? 1;

  return (
    <div className="mb-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2.5">
      <div className="flex justify-between items-center text-left text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧪</span>
          <div>
            <h4 className="text-xs font-bold uppercase text-emerald-400 font-sans tracking-wide">Apothecary Laboratory — Upgrade Station</h4>
            <span className="font-bold text-slate-300">Laboratory Tier: {apothecaryTier === 3 ? '3 (Maximum)' : apothecaryTier}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {apothecaryTier === 1 && "Tier 1: Basic catalyst/elixirs. Upgrade to Tier 2 to unlock Medium Health & Mana potions."}
              {apothecaryTier === 2 && "Tier 2: Advanced mixtures. Upgrade to Tier 3 to unlock Elixirs of Full Restoration & Chaos Catalysts."}
              {apothecaryTier === 3 && "Tier 3: Ultimate laboratory unlocked! Elite Apothecary options are active."}
            </p>
          </div>
        </div>
        {apothecaryTier < 3 ? (
          <button
            onClick={onUpgradeApothecary}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center gap-1.5"
          >
            <span>Upgrade Laboratory</span>
            <span className="text-[9px] text-emerald-900">
              ({apothecaryTier === 1 ? '150g + 10x Berries' : '300g + 20x Berries + 2x Catalysts'})
            </span>
          </button>
        ) : (
          <span className="text-[10px] text-emerald-400 font-bold font-sans">🧪 Fully Upgraded</span>
        )}
      </div>
    </div>
  );
};
