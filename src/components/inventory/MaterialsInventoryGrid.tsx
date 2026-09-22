/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getMaterialUnitWeight } from '../../utils/itemWeight';
import { getMaterialRarityValue, DiscardLongPressHandler, DiscardClickHandler } from './types';

export interface MaterialsInventoryGridProps {
  inventoryMaterials: Record<string, number>;
  inventoryCatalysts: Record<string, number>;
  startDiscardLongPress: DiscardLongPressHandler;
  cancelDiscardLongPress: () => void;
  handleDiscardClick: DiscardClickHandler;
}

export const CRAFTING_MATERIALS_LIST = [
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
];

export const ELEMENTAL_CATALYSTS_LIST = [
  { id: 'cat_fire', label: 'Fire Shards', icon: '🔥' },
  { id: 'cat_frost', label: 'Frost Shards', icon: '❄️' },
  { id: 'cat_poison', label: 'Poison Shards', icon: '☣️' },
  { id: 'cat_lightning', label: 'Spark Shards', icon: '⚡' },
  { id: 'cat_shadow', label: 'Shadow Shards', icon: '🔮' },
];

export const MaterialsInventoryGrid: React.FC<MaterialsInventoryGridProps> = ({
  inventoryMaterials,
  inventoryCatalysts,
  startDiscardLongPress,
  cancelDiscardLongPress,
  handleDiscardClick,
}) => {
  const sortedMaterials = [...CRAFTING_MATERIALS_LIST].sort((a, b) => {
    const rA = getMaterialRarityValue(a.id);
    const rB = getMaterialRarityValue(b.id);
    if (rA !== rB) return rB - rA;
    return a.label.localeCompare(b.label);
  });

  const sortedCatalysts = [...ELEMENTAL_CATALYSTS_LIST].sort((a, b) => {
    const rA = a.id === 'cat_shadow' ? 2 : 1;
    const rB = b.id === 'cat_shadow' ? 2 : 1;
    if (rA !== rB) return rB - rA;
    return a.label.localeCompare(b.label);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
      {/* Alloys Column */}
      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850">
        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-2 block border-b border-slate-800 pb-1 text-left">
          Alloys & Crafting Materials:
        </span>
        <div className="flex flex-col gap-1.5">
          {sortedMaterials.map((mat) => {
            const qty = inventoryMaterials[mat.id] || 0;
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
          {sortedCatalysts.map((cat) => {
            const qty = inventoryCatalysts[cat.id] || 0;
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
  );
};
