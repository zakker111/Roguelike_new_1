/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getMaterialUnitWeight } from '../../utils/itemWeight';
import { getFoodRarityValue, DiscardLongPressHandler, DiscardClickHandler } from './types';

export interface ProvisionsInventoryGridProps {
  inventoryMaterials: Record<string, number>;
  handleEatMeat: (foodKey: string) => void;
  startDiscardLongPress: DiscardLongPressHandler;
  cancelDiscardLongPress: () => void;
  handleDiscardClick: DiscardClickHandler;
}

export interface EatableItemDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
  recovery: string;
  actionLabel: string;
}

export const EATABLES_CATALOG: EatableItemDef[] = [
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

export const ProvisionsInventoryGrid: React.FC<ProvisionsInventoryGridProps> = ({
  inventoryMaterials,
  handleEatMeat,
  startDiscardLongPress,
  cancelDiscardLongPress,
  handleDiscardClick,
}) => {
  const availableEatables = EATABLES_CATALOG.filter(
    (item) => (inventoryMaterials[item.id] || 0) > 0
  );

  const sortedEatables = [...availableEatables].sort((a, b) => {
    const rA = getFoodRarityValue(a.id);
    const rB = getFoodRarityValue(b.id);
    if (rA !== rB) return rB - rA;
    return a.name.localeCompare(b.name);
  });

  if (sortedEatables.length === 0) {
    return (
      <div className="col-span-2 text-center py-12 text-xs text-slate-600 italic bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
        <span>
          🍲 Your provisions stash is empty. Gather wild berries or cook raw meat to nourish your body.
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
      {sortedEatables.map((item) => {
        const qty = inventoryMaterials[item.id] || 0;
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
      })}
    </div>
  );
};
