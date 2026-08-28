/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameState, EquipmentItem, isTwoHandedWeapon } from '../../types';
import { ArrowUpDown, Package } from 'lucide-react';
import {
  getCurrentWeight,
  getMaxWeight,
  getItemWeight,
  getMaterialUnitWeight,
} from '../../utils/itemWeight';
import {
  getItemRarityValue,
  getFoodRarityValue,
  getMaterialRarityValue,
  DiscardLongPressHandler,
  DiscardClickHandler,
} from './types';
import { renderItemDurability } from './EquipmentPaperdoll';

interface BackpackSlotGridProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  handleEquipItem: (item: EquipmentItem, hand?: 'right' | 'left') => void;
  handleEatMeat: (foodKey: string) => void;
  playSound: (soundId: string) => void;
  startDiscardLongPress: DiscardLongPressHandler;
  cancelDiscardLongPress: () => void;
  handleDiscardClick: DiscardClickHandler;
}

export const BackpackSlotGrid: React.FC<BackpackSlotGridProps> = ({
  gameState,
  setGameState,
  handleEquipItem,
  handleEatMeat,
  playSound,
  startDiscardLongPress,
  cancelDiscardLongPress,
  handleDiscardClick,
}) => {
  const [bagSubTab, setBagSubTab] = useState<'allies' | 'gear' | 'food' | 'resources'>('gear');
  const [isSortedFeedback, setIsSortedFeedback] = useState<boolean>(false);

  const handleSortInventory = () => {
    playSound('item');
    setIsSortedFeedback(true);
    setTimeout(() => setIsSortedFeedback(false), 800);

    setGameState((prev) => {
      const sortedGear = [...prev.equipmentInventory].sort((a, b) => {
        const typeOrder: Record<string, number> = { weapon: 1, armor: 2, other: 3 };
        const orderA = typeOrder[a.type] || 4;
        const orderB = typeOrder[b.type] || 4;
        if (orderA !== orderB) return orderA - orderB;

        const subOrder: Record<string, number> = {
          Sword: 1,
          Dagger: 2,
          Axe: 3,
          Mace: 4,
          Bow: 5,
          Staff: 6,
          Shield: 7,
          Helmet: 8,
          Plate: 9,
          Boots: 10,
          Gauntlets: 11,
          Amulet: 12,
          Scroll: 13,
        };
        const subA = subOrder[a.subType || ''] || 99;
        const subB = subOrder[b.subType || ''] || 99;
        if (subA !== subB) return subA - subB;

        const rA = getItemRarityValue(a);
        const rB = getItemRarityValue(b);
        if (rA !== rB) return rB - rA;

        return a.name.localeCompare(b.name);
      });

      return {
        ...prev,
        equipmentInventory: sortedGear,
      };
    });
  };

  const totalFoodCount = Object.entries(gameState.inventoryMaterials).reduce(
    (sum: number, [id, qty]: [string, any]) => {
      const isFood = [
        'mat_bread',
        'mat_cooked_meat',
        'mat_cooked_prime_meat',
        'mat_cooked_pie',
        'mat_cooked_fish',
        'mat_berry',
        'mat_beer',
        'mat_seppo_hooch',
        'mat_raw_fish',
        'mat_prime_meat',
        'mat_raw_meat',
      ].includes(id);
      return isFood ? sum + (qty || 0) : sum;
    },
    0
  );

  const totalMatsCount =
    Object.entries(gameState.inventoryMaterials).reduce(
      (sum: number, [id, qty]: [string, any]) => {
        const isFood = [
          'mat_bread',
          'mat_cooked_meat',
          'mat_cooked_prime_meat',
          'mat_cooked_pie',
          'mat_cooked_fish',
          'mat_berry',
          'mat_beer',
          'mat_seppo_hooch',
          'mat_raw_fish',
          'mat_prime_meat',
          'mat_raw_meat',
        ].includes(id);
        return !isFood ? sum + (qty || 0) : sum;
      },
      0
    ) +
    Object.values(gameState.inventoryCatalysts).reduce(
      (sum: number, qty: any) => sum + (qty || 0),
      0
    );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col flex-1 min-h-[350px] overflow-hidden">
      <div className="border-b border-slate-800/80 pb-2.5 mb-3 flex flex-col gap-2">
        {/* Interactive Carrying Weight Bar */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1.5 font-mono text-[10px] shadow-inner">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">
              Carrying Weight Limit:
            </span>
            <span
              className={`font-bold text-[11px] ${
                getCurrentWeight(gameState) > getMaxWeight(gameState)
                  ? 'text-rose-500 animate-pulse font-extrabold'
                  : getCurrentWeight(gameState) > getMaxWeight(gameState) * 0.8
                  ? 'text-amber-400'
                  : 'text-teal-400'
              }`}
            >
              {getCurrentWeight(gameState).toFixed(1)} / {getMaxWeight(gameState)} kg
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                getCurrentWeight(gameState) > getMaxWeight(gameState)
                  ? 'bg-rose-500'
                  : getCurrentWeight(gameState) > getMaxWeight(gameState) * 0.8
                  ? 'bg-amber-500'
                  : 'bg-teal-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (getCurrentWeight(gameState) / getMaxWeight(gameState)) * 100
                )}%`,
              }}
            />
          </div>
          {getCurrentWeight(gameState) > getMaxWeight(gameState) && (
            <div className="text-[9px] text-rose-400 animate-pulse font-bold bg-rose-950/40 p-1.5 rounded-lg border border-rose-500/30 mt-0.5">
              ⚠️ OVERBURDENED! You are too heavy to move swiftly. Stagger rate is active (45% chance to
              lose movement turns)! Discard or sell items!
            </div>
          )}
        </div>

        {/* Inventory Actions Header */}
        <div className="flex justify-between items-center py-2 px-3 bg-slate-950/80 rounded-xl border border-slate-800 mt-1">
          <span className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>🎒 Inventory Stash</span>
          </span>
          <button
            id="btn-sort-inventory"
            onClick={handleSortInventory}
            className={`flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-bold text-[10px] rounded-lg shadow-md cursor-pointer active:scale-95 transition-all duration-150 border border-amber-400/30 ${
              isSortedFeedback ? 'ring-2 ring-emerald-400 border-emerald-400' : ''
            }`}
            title="Group and Sort stashed items by Type and Rarity"
          >
            <ArrowUpDown className={`w-3 h-3 ${isSortedFeedback ? 'animate-spin' : ''}`} />
            <span>{isSortedFeedback ? 'Organized!' : 'Sort & Group'}</span>
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/90 rounded-xl border border-slate-800 mt-1">
          <button
            onClick={() => {
              playSound('click');
              setBagSubTab('allies');
            }}
            className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              bagSubTab === 'allies'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>👥 ALLIES ({gameState.followers.length})</span>
          </button>
          <button
            onClick={() => {
              playSound('click');
              setBagSubTab('gear');
            }}
            className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              bagSubTab === 'gear'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>🎒 GEAR ({gameState.equipmentInventory.length})</span>
          </button>
          <button
            onClick={() => {
              playSound('click');
              setBagSubTab('food');
            }}
            className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              bagSubTab === 'food'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>🍲 FOOD ({totalFoodCount})</span>
          </button>
          <button
            onClick={() => {
              playSound('click');
              setBagSubTab('resources');
            }}
            className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              bagSubTab === 'resources'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>💎 MATS ({totalMatsCount})</span>
          </button>
        </div>
      </div>

      {/* Content Area rendering based on Sub-tab */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* Allies tab content */}
        {bagSubTab === 'allies' && (
          <div className="flex flex-col gap-3">
            {gameState.followers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                {gameState.followers.map((f) => (
                  <div
                    key={f.id}
                    className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-all text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold border border-slate-700 text-white font-mono shadow-inner shrink-0"
                          style={{ backgroundColor: `${f.color}20`, borderColor: f.color }}
                        >
                          {f.char || '👤'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-100 text-xs block">{f.name}</span>
                          <div className="flex gap-2 text-[9px] text-slate-500 font-mono">
                            <span>LVL {f.level}</span>
                            <span>•</span>
                            <span className="capitalize text-emerald-400 font-bold">
                              {f.archetypeId}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold font-mono uppercase bg-slate-900 text-slate-400 border border-slate-800">
                        {f.mode || 'FIGHT'}ING
                      </span>
                    </div>

                    <div className="flex gap-1.5 border-t border-slate-900 mt-3 pt-2.5">
                      <button
                        onClick={() => {
                          playSound('click');
                          setGameState((prev) => ({
                            ...prev,
                            activeFollowerIdForInspect: f.id,
                          }));
                        }}
                        className="flex-grow py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase rounded-lg cursor-pointer transition-all hover:scale-[1.01] text-center shadow-sm"
                      >
                        Inspect & Equip Gear 🛡️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-600 italic bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">👥</span>
                <span>
                  No companions in your active group. Recruitment mercenaries can be hired at town
                  taverns!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Gear Tab content */}
        {bagSubTab === 'gear' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-slate-300">
            {gameState.equipmentInventory.length > 0 ? (
              gameState.equipmentInventory.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all text-xs"
                >
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="font-bold text-slate-100 truncate"
                          style={{ color: item.color }}
                        >
                          {item.name}
                        </span>
                        {item.quantity && item.quantity > 1 && (
                          <span className="text-[9px] bg-slate-900 border border-slate-800 text-amber-400 font-bold px-1.5 py-0.5 rounded font-mono shrink-0">
                            x{item.quantity}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(() => {
                          const rVal = getItemRarityValue(item);
                          const rLabels = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
                          const rColors = [
                            'text-slate-400 bg-slate-950 border-slate-900',
                            'text-emerald-400 bg-emerald-950/30 border-emerald-900/30',
                            'text-sky-400 bg-sky-950/30 border-sky-900/30',
                            'text-purple-400 bg-purple-950/30 border-purple-900/30',
                            'text-rose-400 bg-rose-950/30 border-rose-900/30',
                          ];
                          return (
                            <span
                              className={`text-[7.5px] px-1 py-0.5 rounded font-mono font-bold uppercase border ${
                                rColors[rVal]
                              } ${rVal === 4 ? 'animate-pulse' : ''}`}
                            >
                              {rLabels[rVal]}
                            </span>
                          );
                        })()}
                        <span className="text-[8px] bg-slate-900 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono text-slate-400">
                          {item.subType}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900 gap-2">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {item.subType === 'Scroll'
                          ? `CONSUMABLE`
                          : item.type === 'weapon'
                          ? `ATK: +${item.damage}`
                          : `DEF: +${item.defense}`}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Weight: {(getItemWeight(item) * (item.quantity || 1)).toFixed(1)} kg
                      </span>
                      {item.subType !== 'Scroll' &&
                        renderItemDurability(item.durability, item.maxDurability, item)}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {item.subType === 'Scroll' ? (
                        <button
                          onClick={() => handleEquipItem(item)}
                          className="px-3 py-1 bg-pink-500 hover:bg-pink-400 text-slate-950 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          🔮 READ SCROLL
                        </button>
                      ) : isTwoHandedWeapon(item) ? (
                        <button
                          onClick={() => handleEquipItem(item, 'right')}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
                          title="Equip 2-Handed weapon (requires both hands)"
                        >
                          👐 EQUIP (2-HAND)
                        </button>
                      ) : item.type === 'weapon' ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEquipItem(item, 'right')}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] font-bold rounded-lg cursor-pointer transition-colors"
                            title="Equip to Right Hand"
                          >
                            ⚡ R-HAND
                          </button>
                          <button
                            onClick={() => handleEquipItem(item, 'left')}
                            className="px-2 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 text-[9px] font-bold rounded-lg cursor-pointer transition-colors"
                            title="Equip to Left Hand (Dual Wield)"
                          >
                            🗡️ L-HAND
                          </button>
                        </div>
                      ) : item.subType === 'Shield' ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEquipItem(item, 'left')}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] font-bold rounded-lg cursor-pointer transition-colors"
                            title="Equip Shield to Left Hand"
                          >
                            🛡️ L-HAND
                          </button>
                          <button
                            onClick={() => handleEquipItem(item, 'right')}
                            className="px-2 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 text-[9px] font-bold rounded-lg cursor-pointer transition-colors"
                            title="Equip Shield to Right Hand"
                          >
                            ⚡ R-HAND
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEquipItem(item)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          ⚡ EQUIP
                        </button>
                      )}
                      <button
                        onMouseDown={() =>
                          startDiscardLongPress(
                            'item',
                            item.id,
                            item.name,
                            item.subType === 'Scroll'
                              ? '📜'
                              : item.type === 'weapon'
                              ? '⚔️'
                              : '🛡️',
                            item.color,
                            item.quantity || 1,
                            getItemWeight(item)
                          )
                        }
                        onMouseUp={cancelDiscardLongPress}
                        onMouseLeave={cancelDiscardLongPress}
                        onTouchStart={() =>
                          startDiscardLongPress(
                            'item',
                            item.id,
                            item.name,
                            item.subType === 'Scroll'
                              ? '📜'
                              : item.type === 'weapon'
                              ? '⚔️'
                              : '🛡️',
                            item.color,
                            item.quantity || 1,
                            getItemWeight(item)
                          )
                        }
                        onTouchEnd={cancelDiscardLongPress}
                        onClick={(e) =>
                          handleDiscardClick(
                            e,
                            'item',
                            item.id,
                            item.name,
                            item.subType === 'Scroll'
                              ? '📜'
                              : item.type === 'weapon'
                              ? '⚔️'
                              : '🛡️',
                            item.color,
                            item.quantity || 1,
                            getItemWeight(item)
                          )
                        }
                        className="px-3 py-0.5 bg-rose-955/25 hover:bg-rose-900/60 border border-rose-900/50 text-rose-450 text-[9px] font-mono rounded cursor-pointer transition-all text-center select-none"
                        title={
                          (item.quantity || 1) > 1
                            ? 'Click or long-press to choose quantity to discard'
                            : 'Discard 1 unit (Hold for Discard Gump)'
                        }
                      >
                        DISCARD
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-xs text-slate-600 italic bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
                <Package className="w-8 h-8 text-slate-700" />
                <span>Your backpack has no stashed gear pieces. Hire scouts or buy equipment.</span>
              </div>
            )}
          </div>
        )}

        {/* Food Tab content */}
        {bagSubTab === 'food' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
            {(() => {
              const eatablesList = [
                {
                  id: 'mat_bread',
                  name: 'Fresh Hearth Bread',
                  icon: '🍞',
                  color: '#f59e0b',
                  desc: 'Warm village core loaf. Soft and filling.',
                  recovery: '+20 HP',
                  actionLabel: 'EAT',
                },
                {
                  id: 'mat_cooked_meat',
                  name: 'Cooked Savory Meat',
                  icon: '🍖',
                  color: '#10b981',
                  desc: 'Flame-grilled game meat. Relieves hunger.',
                  recovery: '+25 HP / +5 MP',
                  actionLabel: 'EAT',
                },
                {
                  id: 'mat_cooked_prime_meat',
                  name: 'Prime Flame-Grilled Steak',
                  icon: '🥩',
                  color: '#f43f5e',
                  desc: 'Superb thick cut of marbled ribeye.',
                  recovery: '+60 HP / +15 MP',
                  actionLabel: 'EAT',
                },
                {
                  id: 'mat_cooked_pie',
                  name: 'Savory Berry Pie',
                  icon: '🥧',
                  color: '#a855f7',
                  desc: 'Hearth-baked fresh woodland berry pie.',
                  recovery: '+40 HP / +15 MP',
                  actionLabel: 'EAT',
                },
                {
                  id: 'mat_cooked_fish',
                  name: 'Campfire Grilled Fish',
                  icon: '🐟',
                  color: '#06b6d4',
                  desc: 'Succulent river trout smoked over oakwood.',
                  recovery: '+45 HP / +30 MP',
                  actionLabel: 'EAT',
                },
                {
                  id: 'mat_berry',
                  name: 'Wild Berries',
                  icon: '🍓',
                  color: '#ec4899',
                  desc: 'Freshly plucked woodland berries.',
                  recovery: '+5 HP',
                  actionLabel: 'EAT',
                },
                {
                  id: 'mat_beer',
                  name: 'Frothy Tavern Beer',
                  icon: '🍺',
                  color: '#eab308',
                  desc: 'Ice-cold stout, served in a heavy tavern mug.',
                  recovery: '+15 HP / +5 MP',
                  actionLabel: 'DRINK',
                },
                {
                  id: 'mat_seppo_hooch',
                  name: "Seppo's Special Hooch",
                  icon: '🍶',
                  color: '#8b5cf6',
                  desc: 'Potent home-distilled moonshine elixir.',
                  recovery: '+75 HP / +40 MP',
                  actionLabel: 'DRINK',
                },
                {
                  id: 'potion_hp',
                  name: 'Apothecary Elixir (HP)',
                  icon: '🧪',
                  color: '#ec4899',
                  desc: 'Restores 35 HP on instant intake.',
                  recovery: '+35 HP',
                  actionLabel: 'DRINK',
                },
                {
                  id: 'potion_mp',
                  name: 'Aether Beverage (MP)',
                  icon: '🧪',
                  color: '#3b82f6',
                  desc: 'Restores 15 MP on instant intake.',
                  recovery: '+15 MP',
                  actionLabel: 'DRINK',
                },
                {
                  id: 'potion_medium_hp',
                  name: 'Rejuvenating Potion (Medium HP)',
                  icon: '🧪',
                  color: '#ec4899',
                  desc: 'Restores 60 HP on instant intake.',
                  recovery: '+60 HP',
                  actionLabel: 'DRINK',
                },
                {
                  id: 'potion_medium_mp',
                  name: 'Rejuvenating Beverage (Medium MP)',
                  icon: '🧪',
                  color: '#3b82f6',
                  desc: 'Restores 30 MP on instant intake.',
                  recovery: '+30 MP',
                  actionLabel: 'DRINK',
                },
                {
                  id: 'potion_full_rejuv',
                  name: 'Elixir of Full Restoration',
                  icon: '🧪',
                  color: '#eab308',
                  desc: 'Restores all HP and MP instantly.',
                  recovery: 'Full HP & MP',
                  actionLabel: 'DRINK',
                },
                {
                  id: 'potion_full_rejuvenation',
                  name: 'Royal Champion Rejuvenation Elixir',
                  icon: '🧪',
                  color: '#ff4b72',
                  desc: 'Super-enriched royal mixture. Full HP & MP restore.',
                  recovery: 'Full HP & MP',
                  actionLabel: 'DRINK',
                },
                {
                  id: 'scroll_recall',
                  name: 'Scroll of Escape 📜',
                  icon: '📜',
                  color: '#f43f5e',
                  desc: 'Teleports you instantly out of any dungeon and returns you to the surface entrance!',
                  recovery: 'Flee Dungeon',
                  actionLabel: 'READ',
                },
                {
                  id: 'mat_raw_fish',
                  name: 'Raw River Fish',
                  icon: '🐟',
                  color: '#64748b',
                  desc: 'Uncooked raw fish. Best cooked at fires.',
                  recovery: '+10 HP / +2 MP',
                  actionLabel: 'EAT',
                },
                {
                  id: 'mat_prime_meat',
                  name: 'Raw Prime Wild Meat',
                  icon: '🥩',
                  color: '#fda4af',
                  desc: 'Raw premium meat. Cook first at campfires.',
                  recovery: '+15 HP',
                  actionLabel: 'EAT',
                },
                {
                  id: 'mat_raw_meat',
                  name: 'Raw Wild Meat',
                  icon: '🥩',
                  color: '#f87171',
                  desc: 'Uncooked game meat.',
                  recovery: '+25 HP / +5 MP',
                  actionLabel: 'EAT',
                },
              ];

              const availableEatables = eatablesList.filter(
                (item) => (gameState.inventoryMaterials[item.id] || 0) > 0
              );
              const sortedEatables = [...availableEatables].sort((a, b) => {
                const rA = getFoodRarityValue(a.id);
                const rB = getFoodRarityValue(b.id);
                if (rA !== rB) return rB - rA;
                return a.name.localeCompare(b.name);
              });

              if (sortedEatables.length > 0) {
                return sortedEatables.map((item) => {
                  const qty = gameState.inventoryMaterials[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all text-xs"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <div className="font-semibold text-slate-100 flex items-center gap-1">
                            <span>{item.icon}</span>
                            <span style={{ color: item.color }}>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const rVal = getFoodRarityValue(item.id);
                              if (rVal > 0) {
                                const rLabels = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
                                const rColors = [
                                  'text-slate-400 bg-slate-950 border-slate-900',
                                  'text-emerald-400 bg-emerald-950/30 border-emerald-900/30',
                                  'text-sky-400 bg-sky-950/30 border-sky-900/30',
                                  'text-purple-400 bg-purple-950/30 border-purple-900/30',
                                  'text-rose-400 bg-rose-950/30 border-rose-900/30',
                                ];
                                return (
                                  <span
                                    className={`text-[7px] px-1 py-0.5 rounded font-mono font-bold uppercase border ${
                                      rColors[rVal]
                                    } ${rVal === 4 ? 'animate-pulse' : ''}`}
                                  >
                                    {rLabels[rVal]}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded font-mono text-amber-400 font-bold">
                              x{qty}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">
                          {item.desc}
                        </p>
                        <div className="text-[9px] text-emerald-400 font-mono mt-1 font-bold">
                          Effect: {item.recovery}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900 gap-2">
                        <span className="text-[9px] text-slate-500 font-mono">
                          Weight: {(getMaterialUnitWeight(item.id) * qty).toFixed(1)} kg
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEatMeat(item.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase rounded-lg cursor-pointer transition-all hover:scale-[1.02]"
                          >
                            {item.actionLabel}
                          </button>
                          <button
                            onMouseDown={() =>
                              startDiscardLongPress(
                                'material',
                                item.id,
                                item.name,
                                item.icon,
                                item.color,
                                qty,
                                getMaterialUnitWeight(item.id)
                              )
                            }
                            onMouseUp={cancelDiscardLongPress}
                            onMouseLeave={cancelDiscardLongPress}
                            onTouchStart={() =>
                              startDiscardLongPress(
                                'material',
                                item.id,
                                item.name,
                                item.icon,
                                item.color,
                                qty,
                                getMaterialUnitWeight(item.id)
                              )
                            }
                            onTouchEnd={cancelDiscardLongPress}
                            onClick={(e) =>
                              handleDiscardClick(
                                e,
                                'material',
                                item.id,
                                item.name,
                                item.icon,
                                item.color,
                                qty,
                                getMaterialUnitWeight(item.id)
                              )
                            }
                            className="px-2 py-1 bg-rose-955/25 hover:bg-rose-900/60 border border-rose-900/50 text-rose-450 text-[9px] font-mono rounded-lg cursor-pointer transition-all select-none"
                            title={
                              qty > 1
                                ? 'Click or hold to choose discard quantity'
                                : 'Discard 1x unit (Hold for Discard Gump)'
                            }
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                });
              } else {
                return (
                  <div className="col-span-2 text-center py-12 text-xs text-slate-600 italic bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <span>
                      🍲 Your provisions stash is empty. Gather wild berries or cook raw meat to
                      nourish your body.
                    </span>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Mats Tab content */}
        {bagSubTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            {/* Alloys Column */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-2 block border-b border-slate-800 pb-1 text-left">
                Alloys & Crafting Materials:
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'mat_wood', label: 'Scrap Wood logs', icon: '🌲' },
                  { id: 'mat_iron', label: 'Scrap Iron metal', icon: '⛓️' },
                  { id: 'mat_mithril', label: 'Mithril pieces', icon: '💎' },
                  { id: 'mat_obsidian', label: 'Obsidian Stone', icon: '🌋' },
                  { id: 'mat_dragonscale', label: 'Elder Dragon Scale', icon: '🔥' },
                  { id: 'mat_feybone', label: 'Fossil Feybone', icon: '🦴' },
                  { id: 'mat_thick_hide', label: 'Thick Wild Hide', icon: '🟤' },
                  { id: 'mat_fishing_pole', label: 'Solid Fishing Pole', icon: '🎣' },
                  { id: 'mat_lockpick', label: 'Tension Lockpick', icon: '🔑' },
                  { id: 'mat_skeleton_key', label: 'Grim Skeleton Key', icon: '💀' },
                ]
                  .sort((a, b) => {
                    const rA = getMaterialRarityValue(a.id);
                    const rB = getMaterialRarityValue(b.id);
                    if (rA !== rB) return rB - rA;
                    return a.label.localeCompare(b.label);
                  })
                  .map((mat) => {
                    const qty = gameState.inventoryMaterials[mat.id] || 0;
                    return (
                      <div
                        key={mat.id}
                        className="flex justify-between items-center h-7 font-mono text-[10px] border-b border-slate-900/50 pb-0.5 last:border-b-0"
                      >
                        <span className="truncate">
                          {mat.icon} {mat.label}:
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-amber-400">
                          x{qty}
                          {qty > 0 && (
                            <button
                              onMouseDown={() =>
                                startDiscardLongPress(
                                  'material',
                                  mat.id,
                                  mat.label,
                                  mat.icon,
                                  undefined,
                                  qty,
                                  getMaterialUnitWeight(mat.id)
                                )
                              }
                              onMouseUp={cancelDiscardLongPress}
                              onMouseLeave={cancelDiscardLongPress}
                              onTouchStart={() =>
                                startDiscardLongPress(
                                  'material',
                                  mat.id,
                                  mat.label,
                                  mat.icon,
                                  undefined,
                                  qty,
                                  getMaterialUnitWeight(mat.id)
                                )
                              }
                              onTouchEnd={cancelDiscardLongPress}
                              onClick={(e) =>
                                handleDiscardClick(
                                  e,
                                  'material',
                                  mat.id,
                                  mat.label,
                                  mat.icon,
                                  undefined,
                                  qty,
                                  getMaterialUnitWeight(mat.id)
                                )
                              }
                              className="px-1 py-0.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/30 text-rose-400 hover:text-white rounded text-[8px] transition-colors cursor-pointer select-none"
                              title={
                                qty > 1
                                  ? 'Click or hold to choose discard quantity'
                                  : 'Discard 1x unit (Hold for Discard Gump)'
                              }
                            >
                              🗑️
                            </button>
                          )}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Catalysts Column */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-2 block border-b border-slate-800 pb-1 text-left">
                Elemental Shards:
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'cat_fire', label: 'Fire Shards', icon: '🔥' },
                  { id: 'cat_frost', label: 'Frost Shards', icon: '❄️' },
                  { id: 'cat_poison', label: 'Poison Shards', icon: '☣️' },
                  { id: 'cat_lightning', label: 'Spark Shards', icon: '⚡' },
                  { id: 'cat_shadow', label: 'Shadow Shards', icon: '🔮' },
                ]
                  .sort((a, b) => {
                    const rA = a.id === 'cat_shadow' ? 2 : 1;
                    const rB = b.id === 'cat_shadow' ? 2 : 1;
                    if (rA !== rB) return rB - rA;
                    return a.label.localeCompare(b.label);
                  })
                  .map((cat) => {
                    const qty = gameState.inventoryCatalysts[cat.id] || 0;
                    return (
                      <div
                        key={cat.id}
                        className="flex justify-between items-center h-7 font-mono text-[10px] border-b border-slate-900/50 pb-0.5 last:border-b-0"
                      >
                        <span className="truncate">
                          {cat.icon} {cat.label}:
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-amber-400">
                          x{qty}
                          {qty > 0 && (
                            <button
                              onMouseDown={() =>
                                startDiscardLongPress(
                                  'catalyst',
                                  cat.id,
                                  cat.label,
                                  cat.icon,
                                  undefined,
                                  qty,
                                  getMaterialUnitWeight(cat.id)
                                )
                              }
                              onMouseUp={cancelDiscardLongPress}
                              onMouseLeave={cancelDiscardLongPress}
                              onTouchStart={() =>
                                startDiscardLongPress(
                                  'catalyst',
                                  cat.id,
                                  cat.label,
                                  cat.icon,
                                  undefined,
                                  qty,
                                  getMaterialUnitWeight(cat.id)
                                )
                              }
                              onTouchEnd={cancelDiscardLongPress}
                              onClick={(e) =>
                                handleDiscardClick(
                                  e,
                                  'catalyst',
                                  cat.id,
                                  cat.label,
                                  cat.icon,
                                  undefined,
                                  qty,
                                  getMaterialUnitWeight(cat.id)
                                )
                              }
                              className="px-1 py-0.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/30 text-rose-400 hover:text-white rounded text-[8px] transition-colors cursor-pointer select-none"
                              title={
                                qty > 1
                                  ? 'Click or hold to choose discard quantity'
                                  : 'Discard 1x unit (Hold for Discard Gump)'
                              }
                            >
                              🗑️
                            </button>
                          )}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
