import React from 'react';
import { AlertCircle } from 'lucide-react';
import { GameState } from '../../../types';

export interface BlacksmithRepairStationProps {
  gameState: GameState;
  onRepairAll: () => void;
  onRepairItem: (keyOrId: string, item: any, isEquipped: boolean) => void;
  onUpgradeBlacksmith: () => void;
}

export const BlacksmithRepairStation: React.FC<BlacksmithRepairStationProps> = ({
  gameState,
  onRepairAll,
  onRepairItem,
  onUpgradeBlacksmith
}) => {
  const forgeLevel = gameState.blacksmithForgeLevel ?? 1;

  return (
    <div className="mb-4 bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-2.5">
      <div className="flex justify-between items-center border-b border-amber-950/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔨</span>
          <div>
            <h4 className="text-xs font-bold uppercase text-amber-500 font-sans tracking-wide">Blacksmith Forge — Repair Station</h4>
            <p className="text-[10px] text-slate-400">Repairs cost approximately 0.5 Gold per durability point lost.</p>
          </div>
        </div>
        <button
          onClick={onRepairAll}
          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all flex items-center gap-1.5 shadow"
        >
          🔨 Repair All Gear
        </button>
      </div>

      {/* Flex wrapper for equipped/bag items repair buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
        {/* 1. Weapon */}
        {(() => {
          const item = gameState.currentWeapon;
          if (!item) return null;
          const dur = item.durability ?? 100;
          const max = item.maxDurability ?? 100;
          const cost = Math.max(1, Math.floor((max - dur) * 0.5));
          const isBroken = dur === 0;
          return (
            <div className={`p-2 rounded-lg flex justify-between items-center gap-2 text-[10px] transition-all ${
              isBroken 
                ? 'bg-red-950/40 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)]' 
                : 'bg-slate-950/80 border border-slate-800'
            }`}>
              <div className="flex flex-col min-w-0 flex-1 text-left">
                <span className="font-bold truncate text-slate-200 flex items-center gap-1" style={{ color: item.color }}>
                  {isBroken && <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />}
                  ⚔️ {item.name}
                  {isBroken && <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-0.1 rounded font-mono border border-red-500/30 ml-1">BROKEN</span>}
                </span>
                <span className={`text-[9px] ${isBroken ? 'text-red-400 font-semibold animate-pulse' : 'text-slate-400'}`}>Durability: {dur}/{max}</span>
              </div>
              <button
                disabled={dur >= max}
                onClick={() => onRepairItem('currentWeapon', item, true)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                  isBroken 
                    ? 'bg-red-500 hover:bg-red-400 text-white cursor-pointer animate-pulse' 
                    : dur < max 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {dur >= max ? 'Pristine' : `${cost}g`}
              </button>
            </div>
          );
        })()}

        {/* 2. Equipped Armors slots */}
        {(['equippedArmor', 'equippedHelmet', 'equippedGloves', 'equippedBoots', 'equippedShield', 'equippedAmulet'] as const).map(slotKey => {
          const item = gameState[slotKey];
          if (!item) return null;
          const dur = item.durability ?? 100;
          const max = item.maxDurability ?? 100;
          const cost = Math.max(1, Math.floor((max - dur) * 0.5));
          const emoji = slotKey === 'equippedHelmet' ? '🪖' : slotKey === 'equippedArmor' ? '👕' : slotKey === 'equippedGloves' ? '🧤' : slotKey === 'equippedAmulet' ? '📿' : slotKey === 'equippedBoots' ? '🥾' : '🛡️';
          const isBroken = dur === 0;
          return (
            <div key={slotKey} className={`p-2 rounded-lg flex justify-between items-center gap-2 text-[10px] transition-all ${
              isBroken 
                ? 'bg-red-950/40 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)]' 
                : 'bg-slate-950/80 border border-slate-800'
            }`}>
              <div className="flex flex-col min-w-0 flex-1 text-left">
                <span className="font-bold truncate text-slate-200 flex items-center gap-1" style={{ color: item.color }}>
                  {isBroken && <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />}
                  {emoji} {item.name}
                  {isBroken && <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-0.1 rounded font-mono border border-red-500/30 ml-1">BROKEN</span>}
                </span>
                <span className={`text-[9px] ${isBroken ? 'text-red-400 font-semibold animate-pulse' : 'text-slate-400'}`}>Durability: {dur}/{max}</span>
              </div>
              <button
                disabled={dur >= max}
                onClick={() => onRepairItem(slotKey, item, true)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                  isBroken 
                    ? 'bg-red-500 hover:bg-red-400 text-white cursor-pointer animate-pulse' 
                    : dur < max 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {dur >= max ? 'Pristine' : `${cost}g`}
              </button>
            </div>
          );
        })}

        {/* 3. Items in pack bag */}
        {[...gameState.equipmentInventory]
          .sort((a, b) => {
            const aBroken = (a.durability ?? 100) === 0;
            const bBroken = (b.durability ?? 100) === 0;
            if (aBroken && !bBroken) return -1;
            if (!aBroken && bBroken) return 1;

            const aDamaged = (a.durability ?? 100) < (a.maxDurability ?? 100);
            const bDamaged = (b.durability ?? 100) < (b.maxDurability ?? 100);
            if (aDamaged && !bDamaged) return -1;
            if (!aDamaged && bDamaged) return 1;
            return 0;
          })
          .map(item => {
            const dur = item.durability ?? 100;
            const max = item.maxDurability ?? 100;
            const cost = Math.max(1, Math.floor((max - dur) * 0.5));
            const emoji = item.type === 'weapon' ? '⚔️' : '🛡️';
            const isBroken = dur === 0;
            return (
              <div key={item.id} className={`p-2 rounded-lg flex justify-between items-center gap-2 text-[10px] transition-all ${
                isBroken 
                  ? 'bg-red-950/40 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse' 
                  : 'bg-slate-950/80 border border-slate-800'
              }`}>
                <div className="flex flex-col min-w-0 flex-1 text-left">
                  <span className="font-bold truncate text-slate-300 flex items-center gap-1" style={{ color: item.color }}>
                    {isBroken && <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />}
                    {emoji} {item.name} (Bag)
                    {isBroken && <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-0.1 rounded font-mono border border-red-500/30 ml-1">BROKEN</span>}
                  </span>
                  <span className={`text-[9px] ${isBroken ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>Durability: {dur}/{max}</span>
                </div>
                <button
                  disabled={dur >= max}
                  onClick={() => onRepairItem(item.id, item, false)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                    isBroken 
                      ? 'bg-red-500 hover:bg-red-400 text-white cursor-pointer animate-pulse' 
                      : dur < max 
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {dur >= max ? 'Pristine' : `${cost}g`}
                </button>
              </div>
            );
          })}
      </div>

      {/* Forge Upgrade Section */}
      <div className="border-t border-amber-950/40 pt-2 flex flex-col gap-1.5 text-left">
        <div className="flex justify-between items-center text-[11px]">
          <div>
            <span className="font-bold text-amber-500 uppercase font-sans tracking-wide">🔥 Forge Tier Level: {forgeLevel === 3 ? '3 (Maximum)' : forgeLevel}</span>
            <p className="text-[10px] text-slate-400">
              {forgeLevel === 1 && "Tier 1: Basic recipes. Upgrade to Tier 2 to craft Staves, Wands, and Crossbows."}
              {forgeLevel === 2 && "Tier 2: Advanced recipes. Upgrade to Tier 3 to craft Greatswords and Warhammers."}
              {forgeLevel === 3 && "Tier 3: Ultimate templates unlocked! Elite Legendary templates are active."}
            </p>
          </div>
          {forgeLevel < 3 ? (
            <button
              onClick={onUpgradeBlacksmith}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center gap-1"
            >
              <span>Upgrade Forge</span>
              <span className="text-[9px] text-amber-900">
                ({forgeLevel === 1 ? '250g + 5x Iron' : '400g + 5x Mithril'})
              </span>
            </button>
          ) : (
            <span className="text-[10px] text-amber-400 font-bold font-sans">⚔️ Fully Upgraded</span>
          )}
        </div>
      </div>
    </div>
  );
};
