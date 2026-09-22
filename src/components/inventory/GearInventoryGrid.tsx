/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Package } from 'lucide-react';
import { EquipmentItem, isTwoHandedWeapon } from '../../types';
import { getItemWeight } from '../../utils/itemWeight';
import { getItemRarityValue, DiscardLongPressHandler, DiscardClickHandler } from './types';
import { renderItemDurability } from './EquipmentPaperdoll';

export interface GearInventoryGridProps {
  equipmentInventory: EquipmentItem[];
  handleEquipItem: (item: EquipmentItem, hand?: 'right' | 'left') => void;
  startDiscardLongPress: DiscardLongPressHandler;
  cancelDiscardLongPress: () => void;
  handleDiscardClick: DiscardClickHandler;
}

export const GearInventoryGrid: React.FC<GearInventoryGridProps> = ({
  equipmentInventory,
  handleEquipItem,
  startDiscardLongPress,
  cancelDiscardLongPress,
  handleDiscardClick,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-slate-300">
      {equipmentInventory.length > 0 ? (
        equipmentInventory.map((item) => (
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
  );
};
