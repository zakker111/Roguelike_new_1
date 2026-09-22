import React from 'react';
import { GameState, EquipmentItem } from '../../../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../../../utils/shopData';
import { getBiomePriceMultiplier } from '../../../utils/tradeEconomy';

export interface TradeSellStashGridProps {
  gameState: GameState;
  onSellEquipment: (item: EquipmentItem) => void;
  onSellResource: (type: 'material' | 'catalyst', id: string, baseValue: number) => void;
}

export const TradeSellStashGrid: React.FC<TradeSellStashGridProps> = ({
  gameState,
  onSellEquipment,
  onSellResource
}) => {
  const upgradedSellMult = 1.0 + (gameState.guildUpgrades?.['up_supply_deals'] || 0) * 0.20;
  const upgradedDiscountMult = 1.0 + (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.20;

  return (
    <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl flex flex-col min-h-0">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3 text-left">
        💰 Liquidate Stash
      </h4>

      <div className="flex-grow flex flex-col gap-4 text-[11px] text-left">
        {/* Sellable Equipment */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Loot & Gear Items:</span>
          {gameState.equipmentInventory.length > 0 ? (
            gameState.equipmentInventory.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-slate-900/50 border border-slate-850 p-2 rounded-lg">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                  <span className="text-[9px] text-slate-500">{item.subType === 'Scroll' ? 'Consumable' : (item.type === 'weapon' ? `Damage: +${item.damage}` : `Blocks: +${item.defense}`)}</span>
                </div>
                <button
                  onClick={() => onSellEquipment(item)}
                  className="px-2.5 py-1 bg-emerald-950/20 hover:bg-emerald-950/50 border border-emerald-900 text-emerald-400 font-bold text-[9px] rounded cursor-pointer"
                >
                  Sell: +{item.value}g
                </button>
              </div>
            ))
          ) : (
            <div className="text-[10px] text-slate-600 italic py-2 text-center bg-slate-900/10 rounded border border-slate-850">No unequipped items to sell.</div>
          )}
        </div>

        {/* Sellable Materials */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-sans">Raw Materials:</span>
          {BASIC_MATERIALS.map((mat) => {
            const count = gameState.inventoryMaterials[mat.id] || 0;
            const sellVal = mat.id === 'mat_wood' ? 8 : 6;
            const biomeMult = getBiomePriceMultiplier(mat.id, gameState.biome);
            const baseAdjustedPayout = Math.round(sellVal * biomeMult * upgradedSellMult);
            const finalPayout = gameState.hasActiveCaravanLicense ? Math.round(baseAdjustedPayout * 1.30) : baseAdjustedPayout;

            return (
              <div key={mat.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-850 p-1.5 px-2 rounded-lg">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-300 font-medium">{mat.name} (x{count})</span>
                    {biomeMult !== 1.0 && (
                      <span className={`text-[7px] font-bold px-1 py-0.2 rounded font-mono ${biomeMult > 1.0 ? 'bg-red-950/50 text-red-400' : 'bg-emerald-950/50 text-emerald-400'}`}>
                        {biomeMult > 1.0 ? `▲ ${(biomeMult * 100 - 100).toFixed(0)}%` : `▼ ${(100 - biomeMult * 100).toFixed(0)}%`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  disabled={count <= 0}
                  onClick={() => onSellResource('material', mat.id, sellVal)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${count > 0 ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 cursor-pointer' : 'opacity-30 border border-slate-800 text-slate-600'}`}
                >
                  Sell: +{finalPayout}g
                </button>
              </div>
            );
          })}
        </div>

        {/* Sellable Catalysts */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Alchemical Shards:</span>
          {ELEMENTAL_CATALYSTS.map((cat) => {
            const count = gameState.inventoryCatalysts[cat.id] || 0;
            const sellVal = 8;
            const biomeMult = getBiomePriceMultiplier(cat.id, gameState.biome);
            const baseAdjustedPayout = Math.round(sellVal * biomeMult * upgradedDiscountMult);
            const finalPayout = gameState.hasActiveCaravanLicense ? Math.round(baseAdjustedPayout * 1.30) : baseAdjustedPayout;

            return (
              <div key={cat.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-850 p-1.5 px-2 rounded-lg">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-300" style={{ color: cat.color }}>✸ {cat.name} (x{count})</span>
                    {biomeMult !== 1.0 && (
                      <span className={`text-[7px] font-bold px-1 py-0.2 rounded font-mono ${biomeMult > 1.0 ? 'bg-red-950/50 text-red-400' : 'bg-emerald-950/50 text-emerald-400'}`}>
                        {biomeMult > 1.0 ? `▲ ${(biomeMult * 100 - 100).toFixed(0)}%` : `▼ ${(100 - biomeMult * 100).toFixed(0)}%`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  disabled={count <= 0}
                  onClick={() => onSellResource('catalyst', cat.id, sellVal)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${count > 0 ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 cursor-pointer' : 'opacity-30 border border-slate-800 text-slate-600'}`}
                >
                  Sell: +{finalPayout}g
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
