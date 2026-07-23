import React from 'react';
import { X, Shield, Swords, UserCheck, RefreshCw, Zap } from 'lucide-react';
import { GameState, Follower, EquipmentItem } from '../types';

interface FollowerInspectOverlayProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  followerId: string;
  onClose: () => void;
}

export default function FollowerInspectOverlay({ gameState, setGameState, followerId, onClose }: FollowerInspectOverlayProps) {
  const f = gameState.followers.find((fol) => fol.id === followerId);
  if (!f) return null;

  const handleToggleMode = () => {
    setGameState((prev) => {
      const nextFollowers = prev.followers.map((fol) => {
        if (fol.id === followerId) {
          const nextMode = fol.mode === 'follow' ? 'wait' : 'follow';
          return { ...fol, mode: nextMode as any };
        }
        return fol;
      });
      return {
        ...prev,
        followers: nextFollowers
      };
    });
  };

  const handleGiveItem = (item: EquipmentItem) => {
    setGameState((prev) => {
      // Remove from player inventory
      const nextPlayerInv = prev.equipmentInventory.filter((it) => it.id !== item.id);
      
      // Add to follower inventory
      const nextFollowers = prev.followers.map((fol) => {
        if (fol.id === followerId) {
          return {
            ...fol,
            inventory: [...fol.inventory, item]
          };
        }
        return fol;
      });

      return {
        ...prev,
        equipmentInventory: nextPlayerInv,
        followers: nextFollowers
      };
    });
  };

  const handleTakeItem = (item: EquipmentItem) => {
    setGameState((prev) => {
      // Add to player inventory
      const nextPlayerInv = [...prev.equipmentInventory, item];

      // Remove from follower inventory
      const nextFollowers = prev.followers.map((fol) => {
        if (fol.id === followerId) {
          return {
            ...fol,
            inventory: fol.inventory.filter((it) => it.id !== item.id)
          };
        }
        return fol;
      });

      return {
        ...prev,
        equipmentInventory: nextPlayerInv,
        followers: nextFollowers
      };
    });
  };

  const handleEquipFollower = (item: EquipmentItem) => {
    setGameState((prev) => {
      const nextFollowers = prev.followers.map((fol) => {
        if (fol.id === followerId) {
          let updatedInv = fol.inventory.filter((it) => it.id !== item.id);
          let prevEquip: EquipmentItem | null = null;
          let nextWeapon = fol.equipment.weapon;
          let nextArmor = fol.equipment.armor;

          if (item.type === 'weapon') {
            prevEquip = fol.equipment.weapon;
            nextWeapon = item;
          } else if (item.type === 'armor') {
            prevEquip = fol.equipment.armor;
            nextArmor = item;
          }

          if (prevEquip) {
            updatedInv.push(prevEquip);
          }

          // Recalculate stats: baseline 5 + gear
          const baseAtk = fol.archetypeId === 'thief' ? 4 : 6;
          const baseDef = fol.archetypeId === 'thief' ? 1 : 3;

          const finalAtk = baseAtk + (nextWeapon ? nextWeapon.damage : 0);
          const finalDef = baseDef + (nextArmor ? nextArmor.defense : 0);

          return {
            ...fol,
            equipment: {
              weapon: nextWeapon,
              armor: nextArmor
            },
            inventory: updatedInv,
            atk: finalAtk,
            def: finalDef
          };
        }
        return fol;
      });

      return {
        ...prev,
        followers: nextFollowers
      };
    });
  };

  const handleUnequipFollower = (slot: 'weapon' | 'armor') => {
    setGameState((prev) => {
      const nextFollowers = prev.followers.map((fol) => {
        if (fol.id === followerId) {
          const item = fol.equipment[slot];
          if (!item) return fol;

          const updatedInv = [...fol.inventory, item];
          const nextWeapon = slot === 'weapon' ? null : fol.equipment.weapon;
          const nextArmor = slot === 'armor' ? null : fol.equipment.armor;

          const baseAtk = fol.archetypeId === 'thief' ? 4 : 6;
          const baseDef = fol.archetypeId === 'thief' ? 1 : 3;

          const finalAtk = baseAtk + (nextWeapon ? nextWeapon.damage : 0);
          const finalDef = baseDef + (nextArmor ? nextArmor.defense : 0);

          return {
            ...fol,
            equipment: {
              weapon: nextWeapon,
              armor: nextArmor
            },
            inventory: updatedInv,
            atk: finalAtk,
            def: finalDef
          };
        }
        return fol;
      });

      return {
        ...prev,
        followers: nextFollowers
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs font-sans text-left">
      <div 
        id="follower-modal"
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in duration-100"
      >
        {/* Header */}
        <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold uppercase tracking-wider text-slate-200">Follower Inspector: {f.name}</span>
          </div>
          <button 
            id="close-follower-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body split: stats vs inventory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 overflow-y-auto">
          
          {/* Col 1: Attributes & commands */}
          <div className="space-y-4">
            
            {/* Stat Box */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 justify-between">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Combative Attributes</span>
                <span className="text-[9px] font-mono bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">LVL {f.level}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-805 text-center">
                  <span className="text-slate-500 text-[10px] uppercase">Attack ATK</span>
                  <strong className="text-amber-500 text-lg flex items-center justify-center gap-1"><Swords className="w-4 h-4" /> {f.atk}</strong>
                </div>
                <div className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-805 text-center">
                  <span className="text-slate-500 text-[10px] uppercase">Defense DEF</span>
                  <strong className="text-blue-500 text-lg flex items-center justify-center gap-1"><Shield className="w-4 h-4" /> {f.def}</strong>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Constitutions HP:</span>
                  <span className="text-slate-200 font-bold">{f.hp} / {f.maxHp}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${(f.hp / f.maxHp) * 100}%` }} />
                </div>
                <div className="flex justify-between text-slate-500 text-[9px] font-mono pt-1">
                  <span>Experience Points:</span>
                  <span>{f.xp}/{f.xpNext} XP</span>
                </div>
              </div>
            </div>

            {/* Personality & Temperament */}
            <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-lg space-y-2">
              <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block">Retainer Persona Traits</span>
              <div className="text-xs space-y-2">
                <div className="flex flex-col bg-slate-900/40 p-2 rounded border border-slate-850/60">
                  <span className="text-[8px] text-slate-500 uppercase font-mono font-bold">Personality</span>
                  <span className="font-semibold text-amber-300 mt-0.5">{f.personality || 'Standard'}</span>
                </div>
                <div className="flex flex-col bg-slate-900/40 p-2 rounded border border-slate-850/60">
                  <span className="text-[8px] text-slate-500 uppercase font-mono font-bold">Temperament</span>
                  <span className="font-semibold text-indigo-300 mt-0.5">{f.temperament || 'Neutral'}</span>
                </div>
              </div>
            </div>

            {/* AI Command Stance */}
            <div className="bg-slate-950/30 border border-slate-850 p-3 rounded-lg flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-bold text-slate-350 uppercase tracking-widest text-[9px]">Stance Directive:</span>
                <span className="text-slate-400 text-[11px] capitalize">Companion is currently: <strong>{f.mode}ing</strong></span>
              </div>
              <button
                onClick={handleToggleMode}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold uppercase rounded flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Toggle Stand</span>
              </button>
            </div>

            {/* Active Gear Slot card */}
            <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-lg space-y-2 text-xs">
              <span className="font-bold text-[9px] text-slate-500 uppercase tracking-wider block">Equipped Retainer Slots</span>
              
              {/* Weapon slot */}
              <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-2 rounded">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-slate-500">Left-Hand Weapon:</span>
                  <span className="font-bold text-slate-200" style={{ color: f.equipment.weapon?.color }}>{f.equipment.weapon?.name || 'Default Strike'}</span>
                </div>
                {f.equipment.weapon && (
                  <button 
                    onClick={() => handleUnequipFollower('weapon')}
                    className="text-[9px] bg-red-950/20 border border-red-900 text-red-400 font-bold px-2 py-0.5 rounded cursor-pointer"
                  >
                    Unequip
                  </button>
                )}
              </div>

              {/* Armor slot */}
              <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-2 rounded">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-slate-500">Worn Armor Set:</span>
                  <span className="font-bold text-slate-200" style={{ color: f.equipment.armor?.color }}>{f.equipment.armor?.name || 'Standard Jerkin'}</span>
                </div>
                {f.equipment.armor && (
                  <button 
                    onClick={() => handleUnequipFollower('armor')}
                    className="text-[9px] bg-red-950/20 border border-red-900 text-red-400 font-bold px-2 py-0.5 rounded cursor-pointer"
                  >
                    Unequip
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Col 2: Inventory Transfer */}
          <div className="space-y-4">
            
            {/* Follower Bag Pack */}
            <div className="bg-slate-950/40 p-3.5 border border-slate-850 rounded-lg space-y-2 flex flex-col min-h-[160px] max-h-48 overflow-y-auto text-xs">
              <span className="font-bold text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 flex justify-between">
                <span>🎒 Retainer Bag</span>
                <span>{f.inventory.length} items</span>
              </span>
              
              {f.inventory.length > 0 ? (
                <div className="space-y-2">
                  {f.inventory.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-2 rounded">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-200 text-[11px] leading-tight" style={{ color: item.color }}>{item.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{item.type === 'weapon' ? `Attack: +${item.damage} ATK` : `Armor: +${item.defense} DEF`}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEquipFollower(item)}
                          className="px-2 py-0.5 bg-blue-950/30 border border-blue-900 text-blue-400 font-bold text-[9px] rounded cursor-pointer hover:bg-blue-900/30"
                        >
                          Equip
                        </button>
                        <button
                          onClick={() => handleTakeItem(item)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] rounded cursor-pointer"
                        >
                          Take
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11.5px] text-slate-600 italic py-6 text-center my-auto">Follower bag is empty. Give them weapons/armors.</div>
              )}
            </div>

            {/* Player Bag Selection */}
            <div className="bg-slate-950/40 p-3.5 border border-slate-850 rounded-lg space-y-2 flex flex-col min-h-[160px] max-h-48 overflow-y-auto text-xs">
              <span className="font-bold text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 flex justify-between">
                <span>🧳 Your Loot Stash</span>
                <span>{gameState.equipmentInventory.length} items</span>
              </span>

              {gameState.equipmentInventory.length > 0 ? (
                <div className="space-y-2">
                  {gameState.equipmentInventory.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-900/50 border border-slate-850 p-2 rounded">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-200 text-[11px] leading-tight" style={{ color: item.color }}>{item.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{item.type === 'weapon' ? `ATK: +${item.damage}` : `DEF: +${item.defense}`}</span>
                      </div>
                      <button
                        onClick={() => handleGiveItem(item)}
                        className="px-2 py-0.5 bg-emerald-950/30 border border-emerald-900 text-emerald-400 font-bold text-[9px] rounded cursor-pointer hover:font-black hover:bg-emerald-900/30"
                      >
                        Give Item
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11.5px] text-slate-600 italic py-6 text-center my-auto">No equipment items in your loot stash.</div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-850 p-4 bg-slate-950/40 text-[10px] text-slate-500 text-center font-mono">
          Items transferred drop on their corpse if they fall in dungeons.
        </div>

      </div>
    </div>
  );
}
