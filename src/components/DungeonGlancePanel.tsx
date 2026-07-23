import React, { useState, useRef } from 'react';
import { GameState, EquipmentItem } from '../types';
import { getItemWeight, getMaterialUnitWeight } from '../utils/itemWeight';
import { DiscardGumpModal, DiscardGumpData } from './DiscardGumpModal';

interface DungeonGlancePanelProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  handleEatMeat: (foodKey: string) => void;
  handleEquipItem: (item: EquipmentItem) => void;
  handleDiscardItem: (id: string, qty?: number) => void;
  handleDiscardMaterial: (id: string, qty?: number) => void;
  playSound?: (soundId: string) => void;
}

export default function DungeonGlancePanel({
  gameState,
  setGameState,
  handleEatMeat,
  handleEquipItem,
  handleDiscardItem,
  handleDiscardMaterial,
  playSound
}: DungeonGlancePanelProps) {

  const [discardGumpData, setDiscardGumpData] = useState<DiscardGumpData | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const startDiscardLongPress = (
    type: 'item' | 'material' | 'catalyst',
    id: string,
    name: string,
    icon: string,
    color: string | undefined,
    maxQuantity: number,
    unitWeight: number
  ) => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setDiscardGumpData({ type, id, name, icon, color, maxQuantity, unitWeight });
    }, 350);
  };

  const cancelDiscardLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDiscardClick = (
    e: React.MouseEvent,
    type: 'item' | 'material' | 'catalyst',
    id: string,
    name: string,
    icon: string,
    color: string | undefined,
    maxQuantity: number,
    unitWeight: number
  ) => {
    e.stopPropagation();
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    cancelDiscardLongPress();

    if (maxQuantity > 1) {
      setDiscardGumpData({ type, id, name, icon, color, maxQuantity, unitWeight });
    } else {
      if (type === 'item') handleDiscardItem(id, 1);
      else if (type === 'material') handleDiscardMaterial(id, 1);
    }
  };

  const handleConfirmDiscardFromGump = (data: DiscardGumpData, qty: number) => {
    if (data.type === 'item') handleDiscardItem(data.id, qty);
    else if (data.type === 'material') handleDiscardMaterial(data.id, qty);
  };

  // List of all possible eatables to check inventory
  const eatablesList = [
    { id: 'mat_bread', name: 'Fresh Hearth Bread', icon: '🍞', color: '#f59e0b', desc: 'Warm village core loaf. Soft and filling.', recovery: '+20 HP', actionLabel: 'EAT' },
    { id: 'mat_cooked_meat', name: 'Cooked Savory Meat', icon: '🍖', color: '#10b981', desc: 'Flame-grilled game meat. Relieves hunger.', recovery: '+25 HP / +5 MP', actionLabel: 'EAT' },
    { id: 'mat_cooked_prime_meat', name: 'Prime Flame-Grilled Steak', icon: '🥩', color: '#f43f5e', desc: 'Superb thick cut of marbled ribeye.', recovery: '+60 HP / +15 MP', actionLabel: 'EAT' },
    { id: 'mat_cooked_pie', name: 'Savory Berry Pie', icon: '🥧', color: '#a855f7', desc: 'Hearth-baked fresh woodland berry pie.', recovery: '+40 HP / +15 MP', actionLabel: 'EAT' },
    { id: 'mat_cooked_fish', name: 'Campfire Grilled Fish', icon: '🐟', color: '#06b6d4', desc: 'Succulent river trout smoked over oakwood.', recovery: '+45 HP / +30 MP', actionLabel: 'EAT' },
    { id: 'mat_berry', name: 'Wild Berries', icon: '🍓', color: '#ec4899', desc: 'Freshly plucked sweet woodland berries.', recovery: '+5 HP', actionLabel: 'EAT' },
    { id: 'mat_beer', name: 'Frothy Tavern Beer', icon: '🍺', color: '#eab308', desc: 'An ice-cold stout, served in a heavy mug.', recovery: '+15 HP / +5 MP', actionLabel: 'DRINK' },
    { id: 'mat_seppo_hooch', name: "Seppo's Special Hooch", icon: '🍶', color: '#8b5cf6', desc: 'Potent home-distilled moonshine elixir.', recovery: '+75 HP / +40 MP', actionLabel: 'DRINK' },
    { id: 'mat_raw_fish', name: 'Raw River Fish', icon: '🐟', color: '#64748b', desc: 'Uncooked fresh fish. Cook at campfires.', recovery: '+10 HP / +2 MP', actionLabel: 'EAT' },
    { id: 'mat_prime_meat', name: 'Raw Prime Wild Meat', icon: '🥩', color: '#fda4af', desc: 'Raw premium meat. Best cooked first.', recovery: '+15 HP', actionLabel: 'EAT' },
    { id: 'mat_raw_meat', name: 'Raw Wild Meat', icon: '🥩', color: '#f87171', desc: 'Uncooked game meat. Parasite risk.', recovery: '+25 HP / +5 MP', actionLabel: 'EAT' }
  ];

  const availableEatables = eatablesList.filter(item => (gameState.inventoryMaterials[item.id] || 0) > 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5 min-h-0 shadow-2xl select-none animate-fade-in w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-amber-500 uppercase tracking-widest text-sm flex items-center gap-2">
            <span>🎒 RETINUE & GEAR GLANCE PANEL</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Complete live status check and quick-action dashboard</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-500 block">PARTY CAPACITY</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {gameState.followers.length} / 3 Followers
          </span>
        </div>
      </div>

      {/* Main Grid Layout (2 Columns on medium/large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-y-auto max-h-[70vh] pr-1 custom-scrollbar">
        
        {/* LEFT COLUMN: Allies & Food */}
        <div className="flex flex-col gap-5">
          
          {/* Section 1: 👥 Companion Retainers & Allies */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <span>👥 Party Members & Allies</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Active Count: {gameState.followers.length}
              </span>
            </div>

            {gameState.followers.length > 0 ? (
              <div className="flex flex-col gap-2">
                {gameState.followers.map((f) => (
                  <div key={f.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col gap-2.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold border border-slate-700 text-white font-mono shadow-inner shrink-0"
                          style={{ backgroundColor: `${f.color}20`, borderColor: f.color }}
                        >
                          {f.char}
                        </div>
                        <div>
                          <span className="font-bold text-slate-100 text-xs block">{f.name}</span>
                          <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                            <span>LVL {f.level}</span>
                            <span>•</span>
                            <span className="capitalize text-emerald-400 font-bold">{f.archetypeId}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded font-bold font-mono uppercase bg-slate-950 text-slate-400 border border-slate-800">
                        {f.mode}ing
                      </span>
                    </div>
                    <div className="flex gap-1.5 border-t border-slate-950 pt-2">
                      <button
                        onClick={() => {
                          if (playSound) playSound('click');
                          setGameState(prev => ({ ...prev, activeFollowerIdForInspect: f.id }));
                        }}
                        className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase rounded cursor-pointer transition-colors text-center shadow-sm"
                      >
                        Inspect & Gear 🛡️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic py-8 text-center border border-dashed border-slate-850 bg-slate-900/10 rounded-lg flex flex-col items-center justify-center gap-1">
                <span>No companions in active group.</span>
                <span className="text-[10px] text-slate-600 font-mono">Recruit helpful allies at Town Inns!</span>
              </div>
            )}
          </div>

          {/* Section 2: 🍲 Rations & Provisions / Food */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <span>🍲 Provisions & Consumables</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Items: {availableEatables.length}
              </span>
            </div>

            {availableEatables.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableEatables.map((item) => {
                  const qty = gameState.inventoryMaterials[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between text-xs hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <div className="font-semibold text-slate-100 flex items-center gap-1 text-[11px]">
                            <span>{item.icon}</span>
                            <span style={{ color: item.color }} className="truncate max-w-[100px]">{item.name}</span>
                          </div>
                          <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded font-mono text-amber-400 font-bold border border-slate-800">
                            x{qty}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 italic mt-1 leading-snug line-clamp-2">{item.desc}</p>
                        <div className="text-[9.5px] text-emerald-400 font-mono mt-1 font-bold">Effect: {item.recovery}</div>
                      </div>

                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-950 gap-2">
                        <span className="text-[8px] text-slate-500 font-mono">Weight: {(getMaterialUnitWeight(item.id) * qty).toFixed(1)} kg</span>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => {
                              if (playSound) playSound('click');
                              handleEatMeat(item.id);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase rounded cursor-pointer transition-all shadow-sm"
                          >
                            {item.actionLabel}
                          </button>
                          <button
                            onMouseDown={() => startDiscardLongPress('material', item.id, item.name, item.icon, item.color, qty, getMaterialUnitWeight(item.id))}
                            onMouseUp={cancelDiscardLongPress}
                            onMouseLeave={cancelDiscardLongPress}
                            onTouchStart={() => startDiscardLongPress('material', item.id, item.name, item.icon, item.color, qty, getMaterialUnitWeight(item.id))}
                            onTouchEnd={cancelDiscardLongPress}
                            onClick={(e) => handleDiscardClick(e, 'material', item.id, item.name, item.icon, item.color, qty, getMaterialUnitWeight(item.id))}
                            className="px-1.5 py-1 bg-rose-950/20 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 text-[9px] font-mono rounded cursor-pointer transition-all select-none"
                            title={qty > 1 ? "Click or hold to choose discard quantity" : "Discard 1 Unit (Hold for Discard Gump)"}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic py-8 text-center border border-dashed border-slate-850 bg-slate-900/10 rounded-lg flex flex-col items-center justify-center gap-1">
                <span>No edible items found in inventory.</span>
                <span className="text-[10px] text-slate-600 font-mono">Cook raw wild meats at campfire nodes!</span>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Gear & Materials Ledger */}
        <div className="flex flex-col gap-5">
          
          {/* Section 3: 🎒 Weapons, Shields & Scrolls */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <span>🎒 Stashed Armaments & Scrolls</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Pieces: {gameState.equipmentInventory.length}
              </span>
            </div>

            {gameState.equipmentInventory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {gameState.equipmentInventory.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-bold truncate text-[11px]" style={{ color: item.color }}>
                            {item.subType === 'Scroll' ? '📜' : item.type === 'weapon' ? '⚔️' : item.subType === 'Helmet' ? '🪖' : '🛡️'} {item.name}
                          </span>
                          {item.quantity && item.quantity > 1 && (
                            <span className="text-[9px] bg-slate-950 px-1 py-0.5 rounded font-mono text-amber-400 font-bold border border-slate-800 shrink-0">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono text-slate-500 shrink-0">
                          {item.subType}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 mt-1 leading-snug line-clamp-2">{item.description}</p>
                    </div>

                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-950 gap-2">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[9.5px] font-mono text-emerald-400 font-bold leading-none">
                          {item.subType === 'Scroll' ? `MAGIC SCROLL` : (item.type === 'weapon' ? `ATK: +${item.damage}` : `DEF: +${item.defense}`)}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono mt-1">Weight: {(getItemWeight(item) * (item.quantity || 1)).toFixed(1)} kg</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => {
                            if (playSound) playSound('click');
                            handleEquipItem(item);
                          }}
                          className={`px-2.5 py-1 text-slate-950 text-[9.5px] font-bold rounded cursor-pointer transition-colors shadow-sm ${
                            item.subType === 'Scroll' ? 'bg-pink-500 hover:bg-pink-400' : 'bg-emerald-500 hover:bg-emerald-400'
                          }`}
                        >
                          {item.subType === 'Scroll' ? 'READ' : 'EQUIP'}
                        </button>
                        <button
                          onMouseDown={() => startDiscardLongPress('item', item.id, item.name, item.subType === 'Scroll' ? '📜' : (item.type === 'weapon' ? '⚔️' : '🛡️'), item.color, item.quantity || 1, getItemWeight(item))}
                          onMouseUp={cancelDiscardLongPress}
                          onMouseLeave={cancelDiscardLongPress}
                          onTouchStart={() => startDiscardLongPress('item', item.id, item.name, item.subType === 'Scroll' ? '📜' : (item.type === 'weapon' ? '⚔️' : '🛡️'), item.color, item.quantity || 1, getItemWeight(item))}
                          onTouchEnd={cancelDiscardLongPress}
                          onClick={(e) => handleDiscardClick(e, 'item', item.id, item.name, item.subType === 'Scroll' ? '📜' : (item.type === 'weapon' ? '⚔️' : '🛡️'), item.color, item.quantity || 1, getItemWeight(item))}
                          className="px-1.5 py-1 bg-rose-950/20 hover:bg-rose-900/60 border border-rose-900/40 text-rose-400 text-[9px] font-mono rounded cursor-pointer transition-all select-none"
                          title={(item.quantity || 1) > 1 ? "Click or hold to choose discard quantity" : "Discard Item (Hold for Discard Gump)"}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic py-8 text-center border border-dashed border-slate-850 bg-slate-900/10 rounded-lg flex flex-col items-center justify-center gap-1">
                <span>Your bag has no stashed gear pieces.</span>
                <span className="text-[10px] text-slate-600 font-mono">Collect rare loot or craft new gear!</span>
              </div>
            )}
          </div>

          {/* Section 4: 💎 Raw Materials & Element Shard Ledger */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <span>💎 Crafting Materials & Element Shards</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Resource Bank</span>
            </div>

            <div className="space-y-3">
              {/* Alloys Ledger */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>⚒️ Alloys & Minerals</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                  {[
                    { id: 'mat_iron', name: 'Scrap Iron', color: '#475569', char: '⛏️' },
                    { id: 'mat_mithril', name: 'Mithril Ore', color: '#38bdf8', char: '✨' },
                    { id: 'mat_obsidian', name: 'Obsidian', color: '#8b5cf6', char: '🌋' },
                    { id: 'mat_dragonscale', name: 'Dragonscale', color: '#f43f5e', char: '🐉' },
                    { id: 'mat_feybone', name: 'Feybone Shard', color: '#22c55e', char: '🌿' },
                    { id: 'mat_wood', name: 'Wood Lumber', color: '#b45309', char: '🪵' },
                    { id: 'mat_thick_hide', name: 'Thick Hide', color: '#a1a1aa', char: '🧥' }
                  ].map((mat) => {
                    const qty = gameState.inventoryMaterials[mat.id] || 0;
                    return (
                      <div key={mat.id} className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
                        <span className="truncate pr-1 text-slate-300" style={{ color: qty > 0 ? mat.color : '#52525b' }}>
                          {mat.char} {mat.name}
                        </span>
                        <span className={`font-bold font-mono text-xs ${qty > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{qty}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Catalysts Ledger */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🧪 Elemental Shards</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                  {[
                    { id: 'cat_fire', name: 'Fire Shard', color: '#ef4444', char: '🔥' },
                    { id: 'cat_frost', name: 'Frost Shard', color: '#3b82f6', char: '❄️' },
                    { id: 'cat_poison', name: 'Venom Shard', color: '#10b981', char: '🧪' },
                    { id: 'cat_lightning', name: 'Volt Shard', color: '#eab308', char: '⚡' },
                    { id: 'cat_shadow', name: 'Umbral Shard', color: '#8b5cf6', char: '🌌' }
                  ].map((cat) => {
                    const qty = gameState.inventoryCatalysts[cat.id] || 0;
                    return (
                      <div key={cat.id} className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
                        <span className="truncate pr-1 text-slate-300" style={{ color: qty > 0 ? cat.color : '#52525b' }}>
                          {cat.char} {cat.name}
                        </span>
                        <span className={`font-bold font-mono text-xs ${qty > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{qty}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <DiscardGumpModal
        data={discardGumpData}
        onClose={() => setDiscardGumpData(null)}
        onConfirm={handleConfirmDiscardFromGump}
      />
    </div>
  );
}
