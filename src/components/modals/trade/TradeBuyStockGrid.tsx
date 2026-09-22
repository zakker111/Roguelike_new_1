import React from 'react';
import { GameState, EquipmentItem } from '../../../types';
import {
  MERCHANT_RESOURCES,
  getBlacksmithItems,
  getApothecaryItems,
  TAVERN_SHOP_ITEMS,
  SEPPO_SHOP_ITEMS,
  SEPPO_RESOURCES
} from '../../../utils/shopData';
import { getBiomePriceMultiplier } from '../../../utils/tradeEconomy';
import { getCharismaDiscountMultiplier } from '../../../utils/gameUtils';
import { TradeRoleContext, EnchantedGearOption } from './types';

const ENCHANTED_GEAR: EnchantedGearOption[] = [
  { id: 'horse', name: 'Stallion-Sprung Greaves 🥾', price: 350, desc: 'Enchanted heavy Sabatons. Grants Stallion Speed (overworld speed upgraded to 3m/turn).' },
  { id: 'camel', name: 'Dune-Treader Sabatons 🐫', price: 400, desc: 'Enchanted desert boots. Complete immunity to sandstorms, sand-blindness, and overworld heat fatigue.' },
  { id: 'worg', name: 'Worg-Spiked Gauntlets 🧤', price: 550, desc: 'Enchanted heavy gauntlets. Adds +3 damage to all physical attacks and pacifies wild Wolves.' },
  { id: 'crocodile', name: 'Crocodile Bayou Sabatons 🐊', price: 300, desc: 'Enchanted swamp boots. Move through swamps at extreme speed (2m/turn) and walk safely on water.' }
];

export interface TradeBuyStockGridProps {
  gameState: GameState;
  roleContext: TradeRoleContext;
  getStock: (id: string, defaultVal?: number) => number;
  onBuyEnchantedGear: (type: 'horse' | 'camel' | 'worg' | 'crocodile', price: number, name: string) => void;
  onBuyEquipment: (item: EquipmentItem) => void;
  onBuyResource: (type: 'material' | 'potion' | 'catalyst', id: string, price: number) => void;
}

export const TradeBuyStockGrid: React.FC<TradeBuyStockGridProps> = ({
  gameState,
  roleContext,
  getStock,
  onBuyEnchantedGear,
  onBuyEquipment,
  onBuyResource
}) => {
  const { isBlacksmith, isMerchant, isApothecary, isTavernMaster, isSeppo, isCaravanMerchant } = roleContext;
  const reputation = gameState.townReputation ?? 100;
  const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
  const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
  const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
  const chaMult = getCharismaDiscountMultiplier(gameState);

  return (
    <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl flex flex-col min-h-0">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3 text-left">
        🛍️ Buy Shop Stock
      </h4>
      <div className="flex-grow flex flex-col gap-2.5 text-[11px]">
        {/* Enchanted Artificer & Exotic Gear Shop */}
        {isCaravanMerchant && (
          <div className="flex flex-col gap-2.5 w-full border border-teal-500/20 bg-teal-950/10 p-3 rounded-xl mb-3">
            <h5 className="text-[10px] font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5 border-b border-teal-950/40 pb-1.5 text-left">
              <span>🛡️</span> ENCHANTED ARTIFICER & EXOTIC GEAR
            </h5>
            <div className="flex flex-col gap-2">
              {ENCHANTED_GEAR.map((gear) => {
                const baseAdjustedPrice = Math.round(gear.price * upgradedDiscountMult);
                const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);
                const hasAlready = gameState.equipmentInventory.some(it => it.name.substring(0, 10) === gear.name.substring(0, 10)) ||
                                  gameState.equippedBoots?.name.substring(0, 10) === gear.name.substring(0, 10) ||
                                  gameState.equippedGloves?.name.substring(0, 10) === gear.name.substring(0, 10);

                return (
                  <div key={gear.id} className="flex justify-between items-center bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg hover:border-slate-700 transition-all text-left">
                    <div className="flex flex-col flex-grow pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100">{gear.name}</span>
                        {hasAlready && (
                          <span className="text-[8px] bg-teal-500 text-white font-mono font-bold px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0">Owned</span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">{gear.desc}</span>
                    </div>
                    <button
                      onClick={() => onBuyEnchantedGear(gear.id, gear.price, gear.name)}
                      className="px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer shrink-0 transition-colors bg-teal-600 hover:bg-teal-500 text-white shadow-md"
                    >
                      Buy: {finalPrice}g
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Blacksmith Stock */}
        {isBlacksmith &&
          getBlacksmithItems(reputation).map((item) => {
            const stock = getStock(item.id, 2);
            const finalPrice = Math.round(item.value * discountMult * chaMult);
            return (
              <div key={item.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left">
                <div className="flex flex-col max-w-[200px] truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                    <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-855 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                      {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 italic mt-0.5 leading-normal">{item.description}</span>
                  <span className="text-[9px] text-[#38bdf8] font-mono mt-0.5 font-bold">
                    {item.type === 'weapon' ? `Attack: +${item.damage} ATK` : `Armor blocks: +${item.defense} DEF`}
                  </span>
                </div>
                <button
                  onClick={() => onBuyEquipment(item)}
                  disabled={stock <= 0}
                  className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer flex items-center gap-1 shrink-0 transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                >
                  <span>Buy: {finalPrice}g</span>
                </button>
              </div>
            );
          })}

        {/* Supply Merchant Stock */}
        {isMerchant &&
          MERCHANT_RESOURCES.map((res) => {
            const biomeMult = getBiomePriceMultiplier(res.id, gameState.biome);
            const baseAdjustedPrice = Math.round(res.price * biomeMult * upgradedDiscountMult);
            const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);
            const stock = getStock(res.id, 3);
            return (
              <div key={res.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-200" style={{ color: res.color }}>{res.name}</span>
                    {biomeMult !== 1.0 && (
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono shrink-0 ${biomeMult > 1.0 ? 'bg-red-950/80 text-red-400 border border-red-900/40' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40'}`}>
                        {biomeMult > 1.0 ? `▲ ${(biomeMult * 100 - 100).toFixed(0)}% High` : `▼ ${(100 - biomeMult * 100).toFixed(0)}% Low`}
                      </span>
                    )}
                    <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                      {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5">{res.desc}</span>
                </div>
                <button
                  onClick={() => onBuyResource('material', res.id, res.price)}
                  disabled={stock <= 0}
                  className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer shrink-0 transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                >
                  Buy: {finalPrice}g
                </button>
              </div>
            );
          })}

        {/* Apothecary Stock */}
        {isApothecary &&
          getApothecaryItems(gameState.apothecaryTier ?? 1, reputation).map((cat) => {
            const biomeMult = getBiomePriceMultiplier(cat.id, gameState.biome);
            const baseAdjustedPrice = Math.round(cat.price * biomeMult * upgradedDiscountMult);
            const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);
            const stock = getStock(cat.id, 3);
            return (
              <div key={cat.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left">
                <div className="flex flex-col max-w-[200px] truncate">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-200" style={{ color: cat.color }}>✸ {cat.name}</span>
                    {biomeMult !== 1.0 && (
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono shrink-0 ${biomeMult > 1.0 ? 'bg-red-950/80 text-red-400 border border-red-900/40' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40'}`}>
                        {biomeMult > 1.0 ? `▲ ${(biomeMult * 100 - 100).toFixed(0)}% High` : `▼ ${(100 - biomeMult * 100).toFixed(0)}% Low`}
                      </span>
                    )}
                    <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                      {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 whitespace-normal leading-tight">{cat.desc}</span>
                </div>
                <button
                  onClick={() => {
                    if (cat.id?.startsWith('potion_') || cat.id?.startsWith('scroll_')) {
                      onBuyResource('potion', cat.id, cat.price);
                    } else {
                      onBuyResource('catalyst', cat.id, cat.price);
                    }
                  }}
                  disabled={stock <= 0}
                  className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer shrink-0 transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                >
                  Buy: {finalPrice}g
                </button>
              </div>
            );
          })}

        {/* Tavern Master & Caravan Stock */}
        {(isTavernMaster || isCaravanMerchant) &&
          TAVERN_SHOP_ITEMS.map((item) => {
            const biomeMult = getBiomePriceMultiplier(item.id, gameState.biome);
            const baseAdjustedPrice = Math.round(item.price * biomeMult * upgradedDiscountMult);
            const finalPrice = Math.round(baseAdjustedPrice * discountMult * chaMult);
            const stock = getStock(item.id, 3);
            return (
              <div key={item.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                    {biomeMult !== 1.0 && (
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono shrink-0 ${biomeMult > 1.0 ? 'bg-red-950/80 text-red-400 border border-red-900/40' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40'}`}>
                        {biomeMult > 1.0 ? `▲ ${(biomeMult * 100 - 100).toFixed(0)}% High` : `▼ ${(100 - biomeMult * 100).toFixed(0)}% Low`}
                      </span>
                    )}
                    <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                      {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5">{item.desc}</span>
                </div>
                <button
                  onClick={() => onBuyResource('material', item.id, item.price)}
                  disabled={stock <= 0}
                  className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer shrink-0 transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                >
                  Buy: {finalPrice}g
                </button>
              </div>
            );
          })}

        {/* Seppo's Unique Stock */}
        {isSeppo && (
          <div className="flex flex-col gap-2.5 w-full">
            {SEPPO_SHOP_ITEMS.map((item) => {
              const stock = getStock(item.id, 1);
              return (
                <div key={item.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left animate-fade-in">
                  <div className="flex flex-col max-w-[200px] truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                      <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                        {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 italic mt-0.5 leading-normal whitespace-normal">{item.description}</span>
                    <span className="text-[9px] text-[#38bdf8] font-mono mt-0.5 font-bold">
                      {item.type === 'weapon' ? `Attack: +${item.damage} ATK` : `Armor blocks: +${item.defense} DEF`}
                    </span>
                  </div>
                  <button
                    onClick={() => onBuyEquipment(item)}
                    disabled={stock <= 0}
                    className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer flex items-center gap-1 shrink-0 font-mono transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                  >
                    Buy: {item.value}g
                  </button>
                </div>
              );
            })}
            {SEPPO_RESOURCES.map((item) => {
              const stock = getStock(item.id, 3);
              return (
                <div key={item.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left animate-fade-in">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                      <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                        {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">{item.desc}</span>
                  </div>
                  <button
                    onClick={() => onBuyResource('material', item.id, item.price)}
                    disabled={stock <= 0}
                    className={`px-3 py-1.5 font-bold rounded text-[10px] cursor-pointer shrink-0 font-mono transition-colors ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                  >
                    Buy: {item.price}g
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
