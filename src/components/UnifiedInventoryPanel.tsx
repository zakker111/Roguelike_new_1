import React, { useState, useRef } from 'react';
import { GameState, EquipmentItem, CraftedWeapon, isTwoHandedWeapon } from '../types';
import { getItemWeight, getMaterialUnitWeight, getCurrentWeight, getMaxWeight } from '../utils/itemWeight';
import { User, Shield, Package, Plus, Sparkles, AlertCircle, ShoppingBag, Trash2, ArrowUpDown } from 'lucide-react';
import { SCAR_DATABASE, getScarStatus, getEffectiveStats } from '../utils/scars';
import { getItemDurabilityDecay } from '../utils/spellsAndEquipment';
import { DiscardGumpModal, DiscardGumpData } from './DiscardGumpModal';

interface UnifiedInventoryPanelProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  handleEatMeat: (foodKey: string) => void;
  handleEquipItem: (item: EquipmentItem, hand?: 'right' | 'left') => void;
  handleDiscardItem: (id: string, qty?: number) => void;
  handleDiscardMaterial: (id: string, qty?: number) => void;
  handleDiscardCatalyst: (id: string, qty?: number) => void;
  handleShiftCatalyst: (id: string) => void;
  handleUnstableReactorSurge: () => void;
  handleUnequipHelmet: () => void;
  handleUnequipArmor: () => void;
  handleUnequipBoots: () => void;
  handleUnequipWeapon: () => void;
  handleUnequipShield: () => void;
  handleUnequipGloves: () => void;
  handleUnequipAmulet: () => void;
  handleAdjustAttribute: (attr: 'str' | 'dex' | 'int' | 'cha' | 'lck', amount: number) => void;
  playSound: (soundId: string) => void;
}

export default function UnifiedInventoryPanel({
  gameState,
  setGameState,
  handleEatMeat,
  handleEquipItem,
  handleDiscardItem,
  handleDiscardMaterial,
  handleDiscardCatalyst,
  handleShiftCatalyst,
  handleUnstableReactorSurge,
  handleUnequipHelmet,
  handleUnequipArmor,
  handleUnequipBoots,
  handleUnequipWeapon,
  handleUnequipShield,
  handleUnequipGloves,
  handleUnequipAmulet,
  handleAdjustAttribute,
  playSound
}: UnifiedInventoryPanelProps) {
  const [bagSubTab, setBagSubTab] = useState<'allies' | 'gear' | 'food' | 'resources'>('allies');
  const [isSortedFeedback, setIsSortedFeedback] = useState(false);
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
      else if (type === 'catalyst') handleDiscardCatalyst(id, 1);
    }
  };

  const handleConfirmDiscardFromGump = (data: DiscardGumpData, qty: number) => {
    if (data.type === 'item') handleDiscardItem(data.id, qty);
    else if (data.type === 'material') handleDiscardMaterial(data.id, qty);
    else if (data.type === 'catalyst') handleDiscardCatalyst(data.id, qty);
  };

  const effStats = getEffectiveStats(gameState.playerStats);

  const getItemRarityValue = (item: EquipmentItem): number => {
    const color = item.color?.toLowerCase() || '';
    if (color === '#f43f5e' || color === '#f97316' || color.includes('orange') || color.includes('rose') || color === '#ef4444' || color === '#f87171') return 4;
    if (color === '#a855f7' || color.includes('purple') || color === '#c084fc') return 3;
    if (color === '#38bdf8' || color.includes('blue') || color.includes('sky')) return 2;
    if (color === '#34d399' || color.includes('green') || color.includes('emerald') || color === '#10b981') return 1;
    return 0;
  };

  const getFoodRarityValue = (id: string): number => {
    const FOOD_POTION_RARITY_VALUES: Record<string, number> = {
      'potion_full_rejuvenation': 4,
      'potion_full_rejuv': 4,
      'mat_seppo_hooch': 3,
      'potion_medium_hp': 2,
      'potion_medium_mp': 2,
      'mat_cooked_prime_meat': 2,
      'mat_cooked_pie': 2,
      'potion_hp': 1,
      'potion_mp': 1,
      'mat_cooked_fish': 1,
      'mat_cooked_meat': 1,
      'scroll_recall': 3,
      'mat_bread': 0,
      'mat_berry': 0,
      'mat_beer': 0,
      'mat_raw_fish': 0,
      'mat_prime_meat': 0,
      'mat_raw_meat': 0
    };
    return FOOD_POTION_RARITY_VALUES[id] || 0;
  };

  const getMaterialRarityValue = (id: string): number => {
    const MATERIAL_RARITY_VALUES: Record<string, number> = {
      'mat_dragonscale': 4,
      'mat_feybone': 3,
      'mat_mithril': 3,
      'mat_obsidian': 2,
      'mat_skeleton_key': 2,
      'mat_iron': 1,
      'mat_thick_hide': 1,
      'mat_lockpick': 1,
      'mat_fishing_pole': 0,
      'mat_wood': 0
    };
    return MATERIAL_RARITY_VALUES[id] || 0;
  };

  const handleSortInventory = () => {
    playSound('loot');
    
    setGameState((prev: any) => {
      const sortedEquip = [...(prev.equipmentInventory || [])].sort((a, b) => {
        // Group by type: gear (weapons, armors, etc.) (0) first, then consumables/Scrolls (1)
        const typeOrderA = a.subType === 'Scroll' || a.type === 'scroll' ? 1 : 0;
        const typeOrderB = b.subType === 'Scroll' || b.type === 'scroll' ? 1 : 0;
        
        if (typeOrderA !== typeOrderB) {
          return typeOrderA - typeOrderB;
        }
        
        // Then sort by rarity descending (high tier first)
        const rarityA = getItemRarityValue(a);
        const rarityB = getItemRarityValue(b);
        if (rarityA !== rarityB) {
          return rarityB - rarityA;
        }
        
        // Then by subType
        if (a.subType !== b.subType) {
          return a.subType.localeCompare(b.subType);
        }
        
        // Finally by name
        return a.name.localeCompare(b.name);
      });

      const nextLogs = [
        {
          id: `sort_log_${Date.now()}`,
          text: `🎒 BAG ORGANIZED: Stashed gear and consumables sorted by type and rarity!`,
          type: 'loot' as const,
          turn: prev.playerStats.turnsPlayed
        },
        ...(prev.logs || [])
      ];

      return {
        ...prev,
        equipmentInventory: sortedEquip,
        logs: nextLogs
      };
    });

    setIsSortedFeedback(true);
    setTimeout(() => setIsSortedFeedback(false), 1500);
  };

  const triggerTestScar = () => {
    const currentScars = gameState.playerStats.scars || [];
    const existingNames = new Set(currentScars.map(s => s.name));
    const available = SCAR_DATABASE.filter(s => !existingNames.has(s.name));
    
    if (available.length === 0) {
      playSound('bump');
      return;
    }
    
    const template = available[Math.floor(Math.random() * available.length)];
    const newScar = {
      id: `scar_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: template.name,
      description: template.description,
      icon: template.icon,
      severity: template.severity,
      acquiredTurn: gameState.playerStats.turnsPlayed
    };
    
    setGameState((prev: any) => {
      const updatedStats = {
        ...prev.playerStats,
        scars: [...(prev.playerStats.scars || []), newScar]
      };
      
      const nextLogs = [
        {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `🩹 Permanent scar: [${newScar.name}] (${newScar.severity}) sustained! "${newScar.description}"`,
          type: 'craft' as const,
          turn: prev.playerStats.turnsPlayed
        },
        ...(prev.logs || [])
      ];

      return {
        ...prev,
        playerStats: updatedStats,
        logs: nextLogs
      };
    });
    playSound('heal');
  };

  // Compute stats
  const isRightHandBroken = gameState.currentWeapon !== null && gameState.currentWeapon.durability !== undefined && gameState.currentWeapon.durability <= 0;
  const rightHandDamage = gameState.currentWeapon !== null
    ? (isRightHandBroken ? 1 : (gameState.currentWeapon.damage ?? 0))
    : 4;

  const isLeftHandBroken = gameState.equippedShield !== null && gameState.equippedShield.durability !== undefined && gameState.equippedShield.durability <= 0;
  const leftHandDamage = gameState.equippedShield !== null
    ? (isLeftHandBroken ? 0 : (gameState.equippedShield.damage ?? 0))
    : 0;

  const isWeaponBroken = isRightHandBroken;
  const effectiveWeaponDamage = rightHandDamage + leftHandDamage;

  let brokenArmorDefReduction = 0;
  const armorSlotsKeysStr = ['equippedArmor', 'equippedHelmet', 'equippedGloves', 'equippedBoots', 'equippedShield', 'equippedAmulet'] as const;
  armorSlotsKeysStr.forEach(slot => {
    const item = gameState[slot];
    if (item && item.durability !== undefined && item.durability <= 0) {
      brokenArmorDefReduction += item.defense;
    }
  });

  let activeEffectsDefBonus = 0;
  if (gameState.playerStats.activeEffects) {
    gameState.playerStats.activeEffects.forEach(eff => {
      if (eff.statModifiers?.def) activeEffectsDefBonus += eff.statModifiers.def;
    });
  }
  const effectivePlayerDef = Math.max(0, effStats.def - brokenArmorDefReduction + activeEffectsDefBonus);

  const renderItemDurability = (dur: number | undefined, max: number | undefined, item?: EquipmentItem | CraftedWeapon) => {
    if (dur === undefined || max === undefined) return null;
    const pct = max > 0 ? (dur / max) * 100 : 100;
    const finalPct = Math.min(100, Math.max(0, pct));
    let colorClass = 'text-emerald-400';
    if (dur === 0) colorClass = 'text-rose-500 font-bold';
    else if (finalPct < 25) colorClass = 'text-amber-500 font-semibold animate-pulse';
    else if (finalPct < 60) colorClass = 'text-yellow-400';
    
    // Calculate wear/decay factor if item is provided
    let decayMultiplier = 1;
    if (item) {
      decayMultiplier = getItemDurabilityDecay(item, 1);
    }
    
    return (
      <div className="flex flex-col w-full px-1 items-center mt-0.5" title={decayMultiplier > 1 ? `Wear Rate: ${decayMultiplier}x. Powerful, upgraded, or mutated gear decays faster in combat.` : undefined}>
        <span className={`text-[7px] font-mono leading-none ${colorClass} flex items-center justify-center gap-0.5`}>
          {dur === 0 ? '🛠️ BROKEN' : `⚡ ${dur}/${max}`}
          {decayMultiplier > 1 && (
            <span className="text-[6.5px] font-bold text-rose-400" title={`Wear factor: ${decayMultiplier}x. This gear is fragile!`}>
              ({decayMultiplier}x ⚠️)
            </span>
          )}
        </span>
        <div className="w-full h-[2.5px] bg-slate-950 rounded-full mt-0.5 overflow-hidden border border-slate-900">
          <div 
            className={`h-full transition-all duration-300 ${dur === 0 ? 'bg-rose-500' : finalPct < 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${finalPct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto">
      {/* LEFT COLUMN: HERO PROFILE & PAPERDOLL CHARACTER SHEET */}
      <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 select-none">
        
        {/* Identity block */}
        <div className="border-b border-slate-800/80 pb-2 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold tracking-wider text-slate-100 uppercase">HERO PROFILE & BIOMETRICS</h3>
          </div>
          <span className="text-[9px] font-mono text-emerald-500 animate-pulse">● SYNCHRONIZED</span>
        </div>

        {/* Level and XP progress bar */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 flex flex-col gap-2 font-mono text-xs text-slate-300">
          <div className="flex justify-between items-center">
            <span className="font-bold text-amber-400">LVL {gameState.playerStats.level} HERO</span>
            <span className="text-[10px] text-slate-500">XP: {gameState.playerStats.xp} / {gameState.playerStats.nextLevelXp}</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full border border-slate-800/80 overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (gameState.playerStats.xp / gameState.playerStats.nextLevelXp) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 uppercase mt-0.5">
            <span>Health: <strong className="text-rose-400 font-bold">{gameState.playerStats.hp}/{gameState.playerStats.maxHp}</strong></span>
            <span>Focus MP: <strong className="text-sky-400 font-bold">{gameState.playerStats.mp}/{gameState.playerStats.maxMp}</strong></span>
          </div>
        </div>

        {/* Attribute Spend Allocation section */}
        <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1.5">
              <span>🧬 Core RPG Attributes</span>
            </span>
            {gameState.playerStats.unspentPoints > 0 ? (
              <span className="text-[10px] font-bold text-amber-400 animate-pulse bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                🌟 {gameState.playerStats.unspentPoints} Unspent Points
              </span>
            ) : (
              <span className="text-[8px] font-mono text-slate-500">
                Level up to earn stat points!
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
            {[
              { key: 'str', label: 'STR', name: 'Strength', color: 'text-red-400', desc: '+Max HP & Parry' },
              { key: 'dex', label: 'DEX', name: 'Dexterity', color: 'text-emerald-400', desc: '+Crit & Speed' },
              { key: 'int', label: 'INT', name: 'Intellect', color: 'text-sky-400', desc: '+Max MP & Spell' },
              { key: 'cha', label: 'CHA', name: 'Charisma', color: 'text-purple-400', desc: 'Hire cost & Buffs' },
              { key: 'lck', label: 'LCK', name: 'Luck', color: 'text-amber-400', desc: '+Loot & Chests' },
            ].map((attr) => {
              const val = gameState.playerStats[attr.key as 'str' | 'dex' | 'int' | 'cha' | 'lck'] || 10;
              const effVal = effStats[attr.key as 'str' | 'dex' | 'int' | 'cha' | 'lck'] || 10;
              const diff = effVal - val;
              return (
                <div key={attr.key} className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-900 flex flex-col items-center justify-between gap-1">
                  <span className={`text-[9px] font-bold ${attr.color}`} title={attr.name}>{attr.label}</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-bold text-slate-100">{effVal}</span>
                    {diff !== 0 && (
                      <span className={`text-[8.5px] font-bold ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`} title={`Base: ${val}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </div>
                  {gameState.playerStats.unspentPoints > 0 ? (
                    <button
                      onClick={() => handleAdjustAttribute(attr.key as 'str' | 'dex' | 'int' | 'cha' | 'lck', 1)}
                      className="w-5 h-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded flex items-center justify-center font-bold text-xs cursor-pointer shadow-md active:scale-90"
                      title={`Allocate point to ${attr.name}`}
                    >
                      +
                    </button>
                  ) : (
                    <span className="text-[7.5px] text-slate-500 font-sans leading-tight mt-0.5">{attr.desc}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Paperdoll slots */}
        <div className="grid grid-cols-12 gap-3 items-center justify-center bg-slate-900/20 p-2 rounded-xl border border-slate-800/40">
          {/* Left Column equipment slots: Head, Body, Feet */}
          <div className="col-span-3 flex flex-col gap-3">
            {/* Helmet slot */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 uppercase font-mono font-bold mb-1">Helmet</span>
              {gameState.equippedHelmet ? (
                <button
                  onClick={handleUnequipHelmet}
                  className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center"
                  title="Click to unequip helmet"
                >
                  <span className="text-lg">🪖</span>
                  <span className="text-[7.5px] text-slate-300 font-semibold truncate w-full" style={{ color: gameState.equippedHelmet.color }}>
                    {gameState.equippedHelmet.name}
                  </span>
                  {renderItemDurability(gameState.equippedHelmet.durability, gameState.equippedHelmet.maxDurability, gameState.equippedHelmet)}
                </button>
              ) : (
                <div className="w-14 h-14 border border-dashed border-slate-800 bg-slate-950/40 rounded-xl flex flex-col items-center justify-center text-slate-600">
                  <span className="text-base">🪖</span>
                  <span className="text-[6.5px] font-mono mt-0.5 text-slate-600">Empty</span>
                </div>
              )}
            </div>

            {/* Chest/Armor slot */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 uppercase font-mono font-bold mb-1">Plate</span>
              {gameState.equippedArmor ? (
                <button
                  onClick={handleUnequipArmor}
                  className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center"
                  title="Click to unequip body armor"
                >
                  <span className="text-lg">🛡️</span>
                  <span className="text-[7.5px] text-slate-300 font-semibold truncate w-full" style={{ color: gameState.equippedArmor.color }}>
                    {gameState.equippedArmor.name}
                  </span>
                  {renderItemDurability(gameState.equippedArmor.durability, gameState.equippedArmor.maxDurability, gameState.equippedArmor)}
                </button>
              ) : (
                <div className="w-14 h-14 border border-dashed border-slate-800 bg-slate-950/40 rounded-xl flex flex-col items-center justify-center text-slate-600">
                  <span className="text-base">🛡️</span>
                  <span className="text-[6.5px] font-mono mt-0.5 text-slate-600">Empty</span>
                </div>
              )}
            </div>

            {/* Boots slot */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 uppercase font-mono font-bold mb-1">Boots</span>
              {gameState.equippedBoots ? (
                <button
                  onClick={handleUnequipBoots}
                  className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center"
                  title="Click to unequip boots"
                >
                  <span className="text-lg">🥾</span>
                  <span className="text-[7.5px] text-slate-300 font-semibold truncate w-full" style={{ color: gameState.equippedBoots.color }}>
                    {gameState.equippedBoots.name}
                  </span>
                  {renderItemDurability(gameState.equippedBoots.durability, gameState.equippedBoots.maxDurability, gameState.equippedBoots)}
                </button>
              ) : (
                <div className="w-14 h-14 border border-dashed border-slate-800 bg-slate-950/40 rounded-xl flex flex-col items-center justify-center text-slate-600">
                  <span className="text-base">🥾</span>
                  <span className="text-[6.5px] font-mono mt-0.5 text-slate-600">Empty</span>
                </div>
              )}
            </div>
          </div>

          {/* CENTER PICTURE CARD: Humanoid Avatar Wireframe */}
          <div className="col-span-6 flex flex-col items-center justify-center relative bg-slate-900/50 rounded-2xl border border-slate-800/80 p-3 h-full min-h-[190px] overflow-hidden">
            {/* Circular glow grids behind humanoid */}
            <div className="absolute w-32 h-32 rounded-full border border-teal-500/10 animate-spin" style={{ animationDuration: '24s' }} />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-sky-500/5" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-sky-500/5" />

            {/* Scars overlay badge in avatar box */}
            {gameState.playerStats.scars && gameState.playerStats.scars.length > 0 && (
              <div className="absolute top-2 right-2 bg-rose-950/70 border border-rose-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse z-10">
                <span className="text-[8px] text-rose-400 font-mono font-bold">
                  🩹 {gameState.playerStats.scars.length} {gameState.playerStats.scars.length === 1 ? 'SCAR' : 'SCARS'}
                </span>
              </div>
            )}

            {/* Battle Scar Scratch overlays on top of the character avatar */}
            {gameState.playerStats.scars && gameState.playerStats.scars.length > 0 && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-60 z-20">
                {gameState.playerStats.scars.map((scar, i) => (
                  <div 
                    key={scar.id} 
                    className="absolute text-rose-500/90 font-mono font-extrabold text-[10px]"
                    style={{
                      top: `${35 + (i * 12) % 40}%`,
                      left: `${40 + (i * 18) % 25}%`,
                      transform: `rotate(${((i * 45) % 90) - 45}deg)`
                    }}
                    title={scar.name}
                  >
                    ⚡
                  </div>
                ))}
              </div>
            )}

            {/* Adventurer Humanoid Character Wireframe */}
            <div className="relative text-teal-400/80 font-mono leading-none select-none text-[8px] whitespace-pre text-center z-10 antialiased my-2">
              {`      /\_/\      
    /  ^ ^  \    
   (  = ' =  )   
    /\__*__/     
   /|_|___|_|\   
  /   |   |   \  
 | (__)   (__) | 
  \__________/  
    |_|   |_|    
    | |   | |    
   (_/     \_)   `}
            </div>

            {/* Biometrics Status Tracker */}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center text-[7.5px] font-mono text-slate-500 uppercase px-1.5 py-0.5 bg-slate-950/85 rounded border border-slate-900 z-10">
              <span>ACTIVE STATUS</span>
              <span className="text-amber-400 animate-pulse font-bold">LVL {gameState.playerStats.level}</span>
              <span>STABLE</span>
            </div>
          </div>

          {/* Right Column equipment slots: R-Hand, L-Hand, Gauntlets, Necklace */}
          <div className="col-span-3 flex flex-col gap-3">
            {/* Weapon (R-Hand) slot */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 uppercase font-mono font-bold mb-1">R-Hand</span>
              {gameState.currentWeapon ? (
                <button
                  onClick={handleUnequipWeapon}
                  className="w-14 h-14 bg-slate-900 border border-slate-705 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center"
                  title="Click to unequip from R-Hand"
                >
                  <span className="text-lg">
                    {gameState.currentWeapon.type === 'armor' || (gameState.currentWeapon.baseType as any) === 'Shield' ? '🛡️' : '⚔️'}
                  </span>
                  <span className="text-[7.5px] text-slate-300 font-semibold truncate w-full" style={{ color: gameState.currentWeapon.color }}>
                    {gameState.currentWeapon.name}
                  </span>
                  {renderItemDurability(gameState.currentWeapon.durability, gameState.currentWeapon.maxDurability, gameState.currentWeapon)}
                </button>
              ) : (
                <div className="w-14 h-14 border border-dashed border-slate-800 bg-slate-950/40 rounded-xl flex flex-col items-center justify-center text-slate-500" title="Empty Right Hand">
                  <span className="text-base">🗡️</span>
                  <span className="text-[6.5px] font-mono mt-0.5 text-slate-500">Belted Shiv</span>
                </div>
              )}
            </div>

            {/* Shield / Left-Hand slot */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 uppercase font-mono font-bold mb-1">L-Hand</span>
              {gameState.equippedShield ? (
                <button
                  onClick={handleUnequipShield}
                  className="w-14 h-14 bg-slate-900 border border-slate-705 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center"
                  title="Click to unequip from L-Hand"
                >
                  <span className="text-lg">
                    {gameState.equippedShield.type === 'weapon' ? '⚔️' : '🛡️'}
                  </span>
                  <span className="text-[7.5px] text-slate-300 font-semibold truncate w-full" style={{ color: gameState.equippedShield.color }}>
                    {gameState.equippedShield.name}
                  </span>
                  {renderItemDurability(gameState.equippedShield.durability, gameState.equippedShield.maxDurability, gameState.equippedShield)}
                </button>
              ) : isTwoHandedWeapon(gameState.currentWeapon) ? (
                <div className="w-14 h-14 border border-amber-900/50 bg-amber-950/20 rounded-xl flex flex-col items-center justify-center text-amber-500 p-0.5 text-center" title="Occupied by 2-Handed weapon">
                  <span className="text-sm">👐</span>
                  <span className="text-[6px] font-mono font-bold leading-none text-amber-400 mt-0.5">2-Handed</span>
                  <span className="text-[5.5px] font-mono text-amber-500/70">Occupied</span>
                </div>
              ) : (
                <div className="w-14 h-14 border border-dashed border-slate-800 bg-slate-950/40 rounded-xl flex flex-col items-center justify-center text-slate-600" title="Empty Left Hand">
                  <span className="text-base">🛡️</span>
                  <span className="text-[6.5px] font-mono mt-0.5 text-slate-600">Empty</span>
                </div>
              )}
            </div>

            {/* Gauntlets slot */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 uppercase font-mono font-bold mb-1">Gauntlets</span>
              {gameState.equippedGloves ? (
                <button
                  onClick={handleUnequipGloves}
                  className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center"
                  title="Click to unequip gauntlets"
                >
                  <span className="text-lg">🧤</span>
                  <span className="text-[7.5px] text-slate-300 font-semibold truncate w-full" style={{ color: gameState.equippedGloves.color }}>
                    {gameState.equippedGloves.name}
                  </span>
                  {renderItemDurability(gameState.equippedGloves.durability, gameState.equippedGloves.maxDurability, gameState.equippedGloves)}
                </button>
              ) : (
                <div className="w-14 h-14 border border-dashed border-slate-800 bg-slate-950/40 rounded-xl flex flex-col items-center justify-center text-slate-600" title="Equip Gauntlets here">
                  <span className="text-base">🧤</span>
                  <span className="text-[6.5px] font-mono mt-0.5 text-slate-600">Empty</span>
                </div>
              )}
            </div>

            {/* Neck Piece / Amulet slot */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 uppercase font-mono font-bold mb-1">Neck Piece</span>
              {gameState.equippedAmulet ? (
                <button
                  onClick={handleUnequipAmulet}
                  className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center"
                  title="Click to unequip neck piece"
                >
                  <span className="text-lg">📿</span>
                  <span className="text-[7.5px] text-slate-300 font-semibold truncate w-full" style={{ color: gameState.equippedAmulet.color }}>
                    {gameState.equippedAmulet.name}
                  </span>
                  {renderItemDurability(gameState.equippedAmulet.durability, gameState.equippedAmulet.maxDurability, gameState.equippedAmulet)}
                </button>
              ) : (
                <div className="w-14 h-14 border border-dashed border-slate-800 bg-slate-950/40 rounded-xl flex flex-col items-center justify-center text-slate-600" title="Equip Neck Piece here">
                  <span className="text-base">📿</span>
                  <span className="text-[6.5px] font-mono mt-0.5 text-slate-600">Empty</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Integrated Total Stat summaries inside inventory tab */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="flex flex-col gap-1 text-slate-400">
            <div className="flex justify-between border-b border-slate-800 pb-0.5">
              <span>Max HP:</span>
              <span className="text-rose-400 font-bold">
                {effStats.maxHp}
                {effStats.maxHp !== gameState.playerStats.maxHp && (
                  <span className={`text-[9.5px] font-bold ml-1 ${effStats.maxHp > gameState.playerStats.maxHp ? 'text-emerald-400' : 'text-rose-500'}`}>
                    ({effStats.maxHp > gameState.playerStats.maxHp ? '+' : ''}{effStats.maxHp - gameState.playerStats.maxHp})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-0.5">
              <span>Max MP:</span>
              <span className="text-sky-400 font-bold">
                {effStats.maxMp}
                {effStats.maxMp !== gameState.playerStats.maxMp && (
                  <span className={`text-[9.5px] font-bold ml-1 ${effStats.maxMp > gameState.playerStats.maxMp ? 'text-emerald-400' : 'text-rose-500'}`}>
                    ({effStats.maxMp > gameState.playerStats.maxMp ? '+' : ''}{effStats.maxMp - gameState.playerStats.maxMp})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between pb-0.5">
              <span>Attack Power:</span>
              <span className="text-red-400 font-bold">
                {effStats.atk + effectiveWeaponDamage}
                {effStats.atk !== gameState.playerStats.atk && (
                  <span className={`text-[9.5px] font-bold ml-1 ${effStats.atk > gameState.playerStats.atk ? 'text-emerald-400' : 'text-rose-500'}`}>
                    ({effStats.atk > gameState.playerStats.atk ? '+' : ''}{effStats.atk - gameState.playerStats.atk})
                  </span>
                )}
                {isWeaponBroken && <span className="text-rose-500 text-[9px] ml-1 font-bold animate-pulse" title="Weapon is broken! damage reduced to 1">(BROKEN)</span>}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-slate-400">
            <div className="flex justify-between border-b border-slate-800 pb-0.5">
              <span>Armor Def:</span>
              <span className="text-emerald-400 font-bold">
                {effectivePlayerDef} DEF
                {brokenArmorDefReduction > 0 && <span className="text-rose-500 text-[9px] ml-1 font-bold animate-pulse" title="Armor defense lost from broken gear">(-{brokenArmorDefReduction})</span>}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-0.5">
              <span>Critical:</span>
              <span className="text-amber-500 font-bold">{((gameState.currentWeapon?.critChance || 0.1) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between pb-0.5">
              <span>Rng Reach:</span>
              <span className="text-slate-300 font-bold">{gameState.currentWeapon?.range || 1} Tiles</span>
            </div>
          </div>
        </div>

        {/* Cat Lover Status section */}
        {gameState.playerStats.hasCatLover && (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2 shadow-lg shadow-emerald-500/5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <span>🐱 SPECIAL TRAIT: CAT LOVER</span>
            </span>
            <div className="text-[11px] text-emerald-300 font-sans leading-relaxed">
              In memory of our beloved feline companions. You have met <span className="font-bold text-emerald-100">Jekku</span>, <span className="font-bold text-emerald-100">Pulla</span>, <span className="font-bold text-emerald-100">Alli</span>, and <span className="font-bold text-emerald-100">Leevi</span>.
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-[10px] text-emerald-400 font-mono flex justify-between items-center">
              <span>✦ Luck Modifier Boost</span>
              <strong className="font-black text-xs text-emerald-300">+10 LCK</strong>
            </div>
          </div>
        )}

        {/* Permanent Battle Scars section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1.5">
              <span>🩹 PERMANENT BATTLE SCARS ({gameState.playerStats.scars?.length || 0})</span>
            </span>
            <button
              onClick={triggerTestScar}
              className="text-[8px] bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded font-mono transition-all cursor-pointer active:scale-95"
              title="Simulate acquiring a permanent battle scar for testing purposes."
            >
              + Simulate Scar
            </button>
          </div>

          {(!gameState.playerStats.scars || gameState.playerStats.scars.length === 0) ? (
            <div className="text-center py-4 bg-slate-950/40 rounded-lg border border-slate-900/60 flex flex-col items-center gap-1">
              <span className="text-lg">✨</span>
              <p className="text-[10px] text-slate-400 font-mono">Unblemished Hero (0 Scars)</p>
              <p className="text-[8px] text-slate-500 font-mono max-w-[200px] leading-relaxed mx-auto text-center">
                Surmounting near-fatal hits or trap damage has a chance of leaving permanent scars.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {gameState.playerStats.scars.map((scar) => {
                let severityColor = "text-blue-400 bg-blue-950/30 border-blue-900/40";
                if (scar.severity === "Major") severityColor = "text-amber-400 bg-amber-950/30 border-amber-900/40";
                else if (scar.severity === "Grave") severityColor = "text-rose-400 bg-rose-950/30 border-rose-900/40";
                else if (scar.severity === "Legendary") severityColor = "text-purple-400 bg-purple-950/30 border-purple-900/40 animate-pulse";

                const status = getScarStatus(scar, gameState.playerStats.turnsPlayed || 0);
                const statusBadgeColor = status.isFresh 
                  ? "text-rose-400 bg-rose-950/30 border-rose-900/40" 
                  : "text-emerald-400 bg-emerald-950/30 border-emerald-900/40";

                return (
                  <div key={scar.id} className="bg-slate-950/50 p-2 rounded-lg border border-slate-900 flex gap-2.5 items-start text-left">
                    <span className="text-base leading-none pt-0.5">{scar.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-slate-200 font-mono truncate" title={scar.name}>{scar.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[6.5px] font-mono font-bold uppercase px-1 py-0.2 rounded border ${statusBadgeColor}`}>
                            {status.isFresh ? "FRESH" : "HEALED"}
                          </span>
                          <span className={`text-[6.5px] font-mono font-bold uppercase px-1 py-0.2 rounded border ${severityColor}`}>
                            {scar.severity}
                          </span>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono leading-tight mb-1">
                        {scar.description}
                      </p>
                      <div className="bg-slate-900/40 p-1 rounded border border-slate-800/40 text-[8px] font-mono leading-tight mb-1">
                        <span className="text-slate-500">Active Effect: </span>
                        <span className={status.isFresh ? "text-rose-400 font-medium" : "text-emerald-400 font-medium"}>
                          {status.effectDesc}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[7.5px] text-slate-500 font-mono">
                        <span>Acquired on Turn {scar.acquiredTurn}</span>
                        {status.isFresh && (
                          <span className="text-rose-400/80">Heals in {25 - ((gameState.playerStats.turnsPlayed || 0) - scar.acquiredTurn)} turns</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: AVAILABLE STORAGE BAGS & RETINUE */}
      <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden">
        {/* BAG EQUIPMENT CONTAINER - COMPACT SINGLE LAYOUT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow flex flex-col flex-1 min-h-[350px] overflow-hidden">
          <div className="border-b border-slate-800 pb-2 mb-3 flex flex-col gap-2">
            
            {/* Interactive Carrying Weight Bar */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex flex-col gap-1.5 font-mono text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">Carrying Weight Limit:</span>
                <span className={`font-bold text-[11px] ${getCurrentWeight(gameState) > getMaxWeight(gameState) ? 'text-rose-500 animate-pulse font-extrabold' : getCurrentWeight(gameState) > getMaxWeight(gameState) * 0.8 ? 'text-amber-400' : 'text-teal-400'}`}>
                  {getCurrentWeight(gameState).toFixed(1)} / {getMaxWeight(gameState)} kg
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-300 ${getCurrentWeight(gameState) > getMaxWeight(gameState) ? 'bg-rose-500' : getCurrentWeight(gameState) > getMaxWeight(gameState) * 0.8 ? 'bg-amber-500' : 'bg-teal-500'}`}
                  style={{ width: `${Math.min(100, (getCurrentWeight(gameState) / getMaxWeight(gameState)) * 100)}%` }}
                />
              </div>
              {getCurrentWeight(gameState) > getMaxWeight(gameState) && (
                <div className="text-[9px] text-rose-400 animate-pulse">
                  ⚠️ OVERBURDENED! You are too heavy to move swiftly. Stagger rate is active (45% chance to lose movement turns)! Discard or sell items!
                </div>
              )}
            </div>

            {/* Inventory Actions Header */}
            <div className="flex justify-between items-center py-1.5 px-1 bg-slate-950/40 rounded-xl border border-slate-850/60 mt-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                🎒 Inventory Stash
              </span>
              <button
                id="btn-sort-inventory"
                onClick={handleSortInventory}
                className={`flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-bold text-[10px] rounded-lg shadow-md cursor-pointer active:scale-95 transition-all duration-150 border border-amber-400/20 ${isSortedFeedback ? 'ring-2 ring-emerald-400 border-emerald-400' : ''}`}
                title="Group and Sort stashed items by Type and Rarity"
              >
                <ArrowUpDown className={`w-3 h-3 ${isSortedFeedback ? 'animate-spin' : ''}`} />
                <span>{isSortedFeedback ? 'Organized!' : 'Sort & Group'}</span>
              </button>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-850 mt-1">
              <button
                onClick={() => { playSound('click'); setBagSubTab('allies'); }}
                className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  bagSubTab === 'allies'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>👥 ALLIES ({gameState.followers.length})</span>
              </button>
              <button
                onClick={() => { playSound('click'); setBagSubTab('gear'); }}
                className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  bagSubTab === 'gear'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>🎒 GEAR ({gameState.equipmentInventory.length})</span>
              </button>
              <button
                onClick={() => { playSound('click'); setBagSubTab('food'); }}
                className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  bagSubTab === 'food'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>🍲 FOOD ({
                  Object.entries(gameState.inventoryMaterials).reduce((sum: number, [id, qty]: [string, any]) => {
                    const isFood = [
                      'mat_bread', 'mat_cooked_meat', 'mat_cooked_prime_meat', 'mat_cooked_pie',
                      'mat_cooked_fish', 'mat_berry', 'mat_beer', 'mat_seppo_hooch', 'mat_raw_fish', 'mat_prime_meat', 'mat_raw_meat'
                    ].includes(id);
                    return isFood ? sum + (qty || 0) : sum;
                  }, 0)
                })</span>
              </button>
              <button
                onClick={() => { playSound('click'); setBagSubTab('resources'); }}
                className={`py-2 rounded-lg text-[9px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  bagSubTab === 'resources'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>💎 MATS ({
                  Object.entries(gameState.inventoryMaterials).reduce((sum: number, [id, qty]: [string, any]) => {
                    const isFood = [
                      'mat_bread', 'mat_cooked_meat', 'mat_cooked_prime_meat', 'mat_cooked_pie',
                      'mat_cooked_fish', 'mat_berry', 'mat_beer', 'mat_seppo_hooch', 'mat_raw_fish', 'mat_prime_meat', 'mat_raw_meat'
                    ].includes(id);
                    return !isFood ? sum + (qty || 0) : sum;
                  }, 0) + Object.values(gameState.inventoryCatalysts).reduce((sum: number, qty: any) => sum + (qty || 0), 0)
                })</span>
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
                      <div key={f.id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-all text-xs">
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
                                <span className="capitalize text-emerald-400 font-bold">{f.archetypeId}</span>
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
                              setGameState(prev => ({ ...prev, activeFollowerIdForInspect: f.id }));
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
                    <span>No companions in your active group. Recruitment mercenaries can be hired at town taverns!</span>
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
                            <span className="font-bold text-slate-100 truncate" style={{ color: item.color }}>
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
                                'text-rose-400 bg-rose-950/30 border-rose-900/30'
                              ];
                              return (
                                <span className={`text-[7.5px] px-1 py-0.5 rounded font-mono font-bold uppercase border ${rColors[rVal]} ${rVal === 4 ? 'animate-pulse' : ''}`}>
                                  {rLabels[rVal]}
                                </span>
                              );
                            })()}
                            <span className="text-[8px] bg-slate-900 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono text-slate-400">
                              {item.subType}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">{item.description}</p>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900 gap-2">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            {item.subType === 'Scroll' ? `CONSUMABLE` : (item.type === 'weapon' ? `ATK: +${item.damage}` : `DEF: +${item.defense}`)}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                            Weight: {(getItemWeight(item) * (item.quantity || 1)).toFixed(1)} kg
                          </span>
                          {item.subType !== 'Scroll' && renderItemDurability(item.durability, item.maxDurability, item)}
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
                            onMouseDown={() => startDiscardLongPress('item', item.id, item.name, item.subType === 'Scroll' ? '📜' : (item.type === 'weapon' ? '⚔️' : '🛡️'), item.color, item.quantity || 1, getItemWeight(item))}
                            onMouseUp={cancelDiscardLongPress}
                            onMouseLeave={cancelDiscardLongPress}
                            onTouchStart={() => startDiscardLongPress('item', item.id, item.name, item.subType === 'Scroll' ? '📜' : (item.type === 'weapon' ? '⚔️' : '🛡️'), item.color, item.quantity || 1, getItemWeight(item))}
                            onTouchEnd={cancelDiscardLongPress}
                            onClick={(e) => handleDiscardClick(e, 'item', item.id, item.name, item.subType === 'Scroll' ? '📜' : (item.type === 'weapon' ? '⚔️' : '🛡️'), item.color, item.quantity || 1, getItemWeight(item))}
                            className="px-3 py-0.5 bg-rose-955/25 hover:bg-rose-900/60 border border-rose-900/50 text-rose-450 text-[9px] font-mono rounded cursor-pointer transition-all text-center select-none"
                            title={(item.quantity || 1) > 1 ? "Click or long-press to choose quantity to discard" : "Discard 1 unit (Hold for Discard Gump)"}
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
                    { id: 'mat_bread', name: 'Fresh Hearth Bread', icon: '🍞', color: '#f59e0b', desc: 'Warm village core loaf. Soft and filling.', recovery: '+20 HP', actionLabel: 'EAT' },
                    { id: 'mat_cooked_meat', name: 'Cooked Savory Meat', icon: '🍖', color: '#10b981', desc: 'Flame-grilled game meat. Relieves hunger.', recovery: '+25 HP / +5 MP', actionLabel: 'EAT' },
                    { id: 'mat_cooked_prime_meat', name: 'Prime Flame-Grilled Steak', icon: '🥩', color: '#f43f5e', desc: 'Superb thick cut of marbled ribeye.', recovery: '+60 HP / +15 MP', actionLabel: 'EAT' },
                    { id: 'mat_cooked_pie', name: 'Savory Berry Pie', icon: '🥧', color: '#a855f7', desc: 'Hearth-baked fresh woodland berry pie.', recovery: '+40 HP / +15 MP', actionLabel: 'EAT' },
                    { id: 'mat_cooked_fish', name: 'Campfire Grilled Fish', icon: '🐟', color: '#06b6d4', desc: 'Succulent river trout smoked over oakwood.', recovery: '+45 HP / +30 MP', actionLabel: 'EAT' },
                    { id: 'mat_berry', name: 'Wild Berries', icon: '🍓', color: '#ec4899', desc: 'Freshly plucked woodland berries.', recovery: '+5 HP', actionLabel: 'EAT' },
                    { id: 'mat_beer', name: 'Frothy Tavern Beer', icon: '🍺', color: '#eab308', desc: 'Ice-cold stout, served in a heavy tavern mug.', recovery: '+15 HP / +5 MP', actionLabel: 'DRINK' },
                    { id: 'mat_seppo_hooch', name: "Seppo's Special Hooch", icon: '🍶', color: '#8b5cf6', desc: 'Potent home-distilled moonshine elixir.', recovery: '+75 HP / +40 MP', actionLabel: 'DRINK' },
                    { id: 'potion_hp', name: 'Apothecary Elixir (HP)', icon: '🧪', color: '#ec4899', desc: 'Restores 35 HP on instant intake.', recovery: '+35 HP', actionLabel: 'DRINK' },
                    { id: 'potion_mp', name: 'Aether Beverage (MP)', icon: '🧪', color: '#3b82f6', desc: 'Restores 15 MP on instant intake.', recovery: '+15 MP', actionLabel: 'DRINK' },
                    { id: 'potion_medium_hp', name: 'Rejuvenating Potion (Medium HP)', icon: '🧪', color: '#ec4899', desc: 'Restores 60 HP on instant intake.', recovery: '+60 HP', actionLabel: 'DRINK' },
                    { id: 'potion_medium_mp', name: 'Rejuvenating Beverage (Medium MP)', icon: '🧪', color: '#3b82f6', desc: 'Restores 30 MP on instant intake.', recovery: '+30 MP', actionLabel: 'DRINK' },
                    { id: 'potion_full_rejuv', name: 'Elixir of Full Restoration', icon: '🧪', color: '#eab308', desc: 'Restores all HP and MP instantly.', recovery: 'Full HP & MP', actionLabel: 'DRINK' },
                    { id: 'potion_full_rejuvenation', name: 'Royal Champion Rejuvenation Elixir', icon: '🧪', color: '#ff4b72', desc: 'Super-enriched royal mixture. Full HP & MP restore.', recovery: 'Full HP & MP', actionLabel: 'DRINK' },
                    { id: 'scroll_recall', name: 'Scroll of Escape 📜', icon: '📜', color: '#f43f5e', desc: 'Teleports you instantly out of any dungeon and returns you to the surface entrance!', recovery: 'Flee Dungeon', actionLabel: 'READ' },
                    { id: 'mat_raw_fish', name: 'Raw River Fish', icon: '🐟', color: '#64748b', desc: 'Uncooked raw fish. Best cooked at fires.', recovery: '+10 HP / +2 MP', actionLabel: 'EAT' },
                    { id: 'mat_prime_meat', name: 'Raw Prime Wild Meat', icon: '🥩', color: '#fda4af', desc: 'Raw premium meat. Cook first at campfires.', recovery: '+15 HP', actionLabel: 'EAT' },
                    { id: 'mat_raw_meat', name: 'Raw Wild Meat', icon: '🥩', color: '#f87171', desc: 'Uncooked game meat.', recovery: '+25 HP / +5 MP', actionLabel: 'EAT' }
                  ];

                  const availableEatables = eatablesList.filter(item => (gameState.inventoryMaterials[item.id] || 0) > 0);
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
                                      'text-rose-400 bg-rose-950/30 border-rose-900/30'
                                    ];
                                    return (
                                      <span className={`text-[7px] px-1 py-0.5 rounded font-mono font-bold uppercase border ${rColors[rVal]} ${rVal === 4 ? 'animate-pulse' : ''}`}>
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
                            <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">{item.desc}</p>
                            <div className="text-[9px] text-emerald-400 font-mono mt-1 font-bold">Effect: {item.recovery}</div>
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900 gap-2">
                            <span className="text-[9px] text-slate-500 font-mono">Weight: {(getMaterialUnitWeight(item.id) * qty).toFixed(1)} kg</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleEatMeat(item.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-white font-bold text-[9px] uppercase rounded-lg cursor-pointer transition-all hover:scale-[1.02]"
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
                                className="px-2 py-1 bg-rose-955/25 hover:bg-rose-900/60 border border-rose-900/50 text-rose-450 text-[9px] font-mono rounded-lg cursor-pointer transition-all select-none"
                                title={qty > 1 ? "Click or hold to choose discard quantity" : "Discard 1x unit (Hold for Discard Gump)"}
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
                        <span>🍲 Your provisions stash is empty. Gather wild berries or cook raw meat to nourish your body.</span>
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
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-2 block border-b border-slate-800 pb-1 text-left">Alloys & Crafting Materials:</span>
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
                      { id: 'mat_skeleton_key', label: 'Grim Skeleton Key', icon: '💀' }
                    ].sort((a, b) => {
                      const rA = getMaterialRarityValue(a.id);
                      const rB = getMaterialRarityValue(b.id);
                      if (rA !== rB) return rB - rA;
                      return a.label.localeCompare(b.label);
                    }).map((mat) => {
                      const qty = gameState.inventoryMaterials[mat.id] || 0;
                      return (
                        <div key={mat.id} className="flex justify-between items-center h-7 font-mono text-[10px] border-b border-slate-900/50 pb-0.5 last:border-b-0">
                          <span className="truncate">{mat.icon} {mat.label}:</span>
                          <span className="flex items-center gap-1.5 font-bold text-amber-400">
                            x{qty}
                            {qty > 0 && (
                              <button
                                onMouseDown={() => startDiscardLongPress('material', mat.id, mat.label, mat.icon, undefined, qty, getMaterialUnitWeight(mat.id))}
                                onMouseUp={cancelDiscardLongPress}
                                onMouseLeave={cancelDiscardLongPress}
                                onTouchStart={() => startDiscardLongPress('material', mat.id, mat.label, mat.icon, undefined, qty, getMaterialUnitWeight(mat.id))}
                                onTouchEnd={cancelDiscardLongPress}
                                onClick={(e) => handleDiscardClick(e, 'material', mat.id, mat.label, mat.icon, undefined, qty, getMaterialUnitWeight(mat.id))}
                                className="px-1 py-0.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/30 text-rose-400 hover:text-white rounded text-[8px] transition-colors cursor-pointer select-none"
                                title={qty > 1 ? "Click or hold to choose discard quantity" : "Discard 1x unit (Hold for Discard Gump)"}
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
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-2 block border-b border-slate-800 pb-1 text-left">Elemental Shards:</span>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: 'cat_fire', label: 'Fire Shards', icon: '🔥' },
                      { id: 'cat_frost', label: 'Frost Shards', icon: '❄️' },
                      { id: 'cat_poison', label: 'Poison Shards', icon: '☣️' },
                      { id: 'cat_lightning', label: 'Spark Shards', icon: '⚡' },
                      { id: 'cat_shadow', label: 'Shadow Shards', icon: '🔮' }
                    ].sort((a, b) => {
                      const rA = a.id === 'cat_shadow' ? 2 : 1;
                      const rB = b.id === 'cat_shadow' ? 2 : 1;
                      if (rA !== rB) return rB - rA;
                      return a.label.localeCompare(b.label);
                    }).map((cat) => {
                      const qty = gameState.inventoryCatalysts[cat.id] || 0;
                      return (
                        <div key={cat.id} className="flex justify-between items-center h-7 font-mono text-[10px] border-b border-slate-900/50 pb-0.5 last:border-b-0">
                          <span className="truncate">{cat.icon} {cat.label}:</span>
                          <span className="flex items-center gap-1.5 font-bold text-amber-400">
                            x{qty}
                            {qty > 0 && (
                              <button
                                onMouseDown={() => startDiscardLongPress('catalyst', cat.id, cat.label, cat.icon, undefined, qty, getMaterialUnitWeight(cat.id))}
                                onMouseUp={cancelDiscardLongPress}
                                onMouseLeave={cancelDiscardLongPress}
                                onTouchStart={() => startDiscardLongPress('catalyst', cat.id, cat.label, cat.icon, undefined, qty, getMaterialUnitWeight(cat.id))}
                                onTouchEnd={cancelDiscardLongPress}
                                onClick={(e) => handleDiscardClick(e, 'catalyst', cat.id, cat.label, cat.icon, undefined, qty, getMaterialUnitWeight(cat.id))}
                                className="px-1 py-0.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/30 text-rose-400 hover:text-white rounded text-[8px] transition-colors cursor-pointer select-none"
                                title={qty > 1 ? "Click or hold to choose discard quantity" : "Discard 1x unit (Hold for Discard Gump)"}
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

        {/* Alchemical Transmuter Panel */}
        {gameState.hasTransmuter ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow flex flex-col gap-3.5 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🧪</span>
                <div className="text-left">
                  <h4 className="text-xs font-black text-pink-400 tracking-wider">PORTABLE WILD ALCHEMICAL TRANSMUTER</h4>
                  <p className="text-[9px] text-slate-400 leading-normal">Shift catalyst alignments or initiate a chaotic stable Reactor Surge!</p>
                </div>
              </div>
              <span className="text-[8px] px-1.5 py-0.5 rounded font-mono font-bold bg-pink-950/30 text-pink-400 border border-pink-500/20">CHARGED</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Shift */}
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex flex-col gap-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-900 pb-1 text-left">Alignment Shorter:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'cat_fire', name: 'Fire 🔥' },
                    { id: 'cat_frost', name: 'Frost ❄️' },
                    { id: 'cat_poison', name: 'Poison ☣️' },
                    { id: 'cat_lightning', name: 'Spark ⚡' },
                    { id: 'cat_shadow', name: 'Shadow 🔮' }
                  ].map((cat) => {
                    const qty = gameState.inventoryCatalysts[cat.id] || 0;
                    const canShift = qty >= 1 && gameState.playerStats.gold >= 10;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleShiftCatalyst(cat.id)}
                        disabled={!canShift}
                        className={`p-1.5 border rounded text-left flex justify-between items-center transition-all cursor-pointer ${canShift ? 'bg-slate-900 border-slate-800 hover:border-pink-500 text-slate-200' : 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'}`}
                        title={`Shift 1x ${cat.name} to a random shard for 10 gold`}
                      >
                        <span className="truncate">{cat.name}: <strong>x{qty}</strong></span>
                        <span className="text-[7px] font-extrabold bg-pink-950/30 px-1 rounded text-pink-400">SHIFT</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reactor */}
              <div className="bg-gradient-to-r from-slate-950 to-pink-950/20 border border-pink-900/30 p-3 rounded-xl flex flex-col gap-1.5 relative overflow-hidden text-left justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] text-pink-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                    🔮 Unstable Wild Reactor
                  </span>
                  <span className="text-[8px] text-slate-500 mt-0.5 leading-tight">Fuse 2x shards + 100g for a chaotic surge event!</span>
                </div>
                
                <div className="flex justify-between items-center mt-1 pt-1 border-t border-pink-950/30">
                  <div className="text-[8px] text-slate-500 font-mono flex flex-col">
                    <span>Gold: <strong className={gameState.playerStats.gold >= 100 ? "text-emerald-400" : ""}>{gameState.playerStats.gold} / 100g</strong></span>
                    <span>Shards: <strong className={Object.values(gameState.inventoryCatalysts).reduce<number>((sum, qty) => sum + (Number(qty) || 0), 0) >= 2 ? "text-emerald-400" : ""}>{Object.values(gameState.inventoryCatalysts).reduce<number>((sum, qty) => sum + (Number(qty) || 0), 0)} / 2</strong></span>
                  </div>
                  <button
                    onClick={handleUnstableReactorSurge}
                    disabled={gameState.playerStats.gold < 100 || Object.values(gameState.inventoryCatalysts).reduce<number>((sum, qty) => sum + (Number(qty) || 0), 0) < 2}
                    className={`px-3 py-1 text-[9px] font-extrabold rounded-lg cursor-pointer transition-all ${
                      gameState.playerStats.gold >= 100 && Object.values(gameState.inventoryCatalysts).reduce<number>((sum, qty) => sum + (Number(qty) || 0), 0) >= 2
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg animate-pulse'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    SURGE
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/30 border border-slate-800/80 border-dashed rounded-2xl p-4 flex flex-col gap-2.5 items-center justify-center text-center">
            <div className="w-9 h-9 rounded-full bg-slate-900/60 flex items-center justify-center text-slate-500 text-base border border-slate-800/60">
              🧪
            </div>
            <div className="max-w-md">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alchemical Transmuter Offline</h4>
              <p className="text-[9px] text-slate-500 leading-normal mt-1">
                Synthesize alloy grades and shift elemental alignments anywhere on the fly. Explore deep dungeon chests, wait for Game Master events, or trade with Seppo in the deep forest to secure this wild magic flask!
              </p>
            </div>
          </div>
        )}
      </div>

      <DiscardGumpModal
        data={discardGumpData}
        onClose={() => setDiscardGumpData(null)}
        onConfirm={handleConfirmDiscardFromGump}
      />
    </div>
  );
}
