/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState } from '../../types';
import { getCurrentWeight, getMaxWeight } from '../../utils/itemWeight';

export interface InventoryWeightBarProps {
  gameState: GameState;
}

export const InventoryWeightBar: React.FC<InventoryWeightBarProps> = ({ gameState }) => {
  const currentWeight = getCurrentWeight(gameState);
  const maxWeight = getMaxWeight(gameState);
  const isOverburdened = currentWeight > maxWeight;
  const isNearCapacity = currentWeight > maxWeight * 0.8;

  return (
    <div
      id="inventory-weight-bar"
      className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1.5 font-mono text-[10px] shadow-inner"
    >
      <div className="flex justify-between items-center">
        <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">
          Carrying Weight Limit:
        </span>
        <span
          className={`font-bold text-[11px] ${
            isOverburdened
              ? 'text-rose-500 animate-pulse font-extrabold'
              : isNearCapacity
              ? 'text-amber-400'
              : 'text-teal-400'
          }`}
        >
          {currentWeight.toFixed(1)} / {maxWeight} kg
        </span>
      </div>
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 p-0.5">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isOverburdened
              ? 'bg-rose-500'
              : isNearCapacity
              ? 'bg-amber-500'
              : 'bg-teal-500'
          }`}
          style={{
            width: `${Math.min(100, (currentWeight / maxWeight) * 100)}%`,
          }}
        />
      </div>
      {isOverburdened && (
        <div className="text-[9px] text-rose-400 animate-pulse font-bold bg-rose-950/40 p-1.5 rounded-lg border border-rose-500/30 mt-0.5">
          ⚠️ OVERBURDENED! You are too heavy to move swiftly. Stagger rate is active (45% chance to
          lose movement turns)! Discard or sell items!
        </div>
      )}
    </div>
  );
};
