import React from 'react';
import { GameState, EquipmentItem } from '../../types';
import {
  MERCHANT_RESOURCES,
  getBlacksmithItems,
  getMerchantConfig,
  getApothecaryItems,
  TAVERN_SHOP_ITEMS,
  SEPPO_SHOP_ITEMS,
  SEPPO_RESOURCES,
  BASIC_MATERIALS,
  ELEMENTAL_CATALYSTS
} from '../../utils/shopData';
import { getBiomePriceMultiplier } from '../../utils/tradeEconomy';
import { getCharismaDiscountMultiplier } from '../../utils/gameUtils';
import { hasTownAtChunk, getDeterministicTownName } from '../../utils/overworld';
import { AlertCircle, ShoppingBag, X } from 'lucide-react';

export interface TradeModalProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setActiveTab: (tab: string) => void;
  handleStartCaravanTravel: (x: number, y: number, name: string) => void;
  handleRepairAll: () => void;
  handleRepairItem: (keyOrId: string, item: any, isEquipped: boolean) => void;
  handleUpgradeBlacksmith: () => void;
  handleUpgradeApothecary: () => void;
  handleBuyRumor: () => void;
  handleTavernRest: () => void;
  handleHireMercenary: (type: 'novice' | 'veteran' | 'champion' | 'merchant_guard') => void;
  handleBuyEnchantedGear: (type: 'horse' | 'camel' | 'worg' | 'crocodile', price: number, name: string) => void;
  handleBuyEquipment: (item: EquipmentItem) => void;
  handleBuyResource: (type: 'material' | 'potion' | 'catalyst', id: string, price: number) => void;
  handleSellEquipment: (item: EquipmentItem) => void;
  handleSellResource: (type: 'material' | 'catalyst', id: string, baseValue: number) => void;
  playSound: (soundName: string) => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  gameState,
  setGameState,
  setActiveTab,
  handleStartCaravanTravel,
  handleRepairAll,
  handleRepairItem,
  handleUpgradeBlacksmith,
  handleUpgradeApothecary,
  handleBuyRumor,
  handleTavernRest,
  handleHireMercenary,
  handleBuyEnchantedGear,
  handleBuyEquipment,
  handleBuyResource,
  handleSellEquipment,
  handleSellResource,
  playSound
}) => {
  const activeTradeNpcId = gameState.activeTradeNpcId;
  const activeNpc = gameState.npcs?.find(n => n.id === activeTradeNpcId);
  const activeRole = activeNpc?.role || 
    (activeTradeNpcId?.includes('herbalist') ? 'traveler_herbalist' :
     activeTradeNpcId?.includes('hunter') ? 'traveler_hunter' :
     activeTradeNpcId?.includes('pilgrim') ? 'traveler_pilgrim' :
     activeTradeNpcId?.includes('caravan') || activeTradeNpcId?.includes('traveler') || activeTradeNpcId?.includes('wandering') ? 'traveler_merchant' :
     activeTradeNpcId === 'npc_caravan_merchant' ? 'merchant_caravan' : '');

  const isBlacksmith = activeRole === 'npc_blacksmith' || activeRole.includes('blacksmith') || activeTradeNpcId === 'npc_shop_blacksmith';
  const isMerchant = activeRole === 'npc_merchant' || activeRole.includes('merchant') || activeTradeNpcId === 'npc_shop_merchant' || activeRole === 'traveler_hunter' || activeRole === 'traveler_pilgrim' || activeRole === 'traveler_merchant' || activeRole.includes('traveler') || activeRole.includes('wandering') || activeRole.includes('caravan');
  const isApothecary = activeRole === 'npc_apothecary' || activeRole.includes('apothecary') || activeTradeNpcId === 'npc_shop_apothecary' || activeRole === 'traveler_herbalist';
  const isTavernMaster = activeRole === 'npc_innkeeper' || activeRole.includes('innkeeper') || activeTradeNpcId === 'npc_shop_innkeeper';
  const isSeppo = activeTradeNpcId === 'npc_seppo' || activeNpc?.name === 'Seppo the Smith' || activeRole === 'merchant_seppo';

  const isTraveler = 
    activeRole.startsWith('traveler_') ||
    activeRole.includes('caravan') ||
    activeRole.includes('wandering') ||
    activeRole === 'merchant_seppo' ||
    (activeTradeNpcId ? (activeTradeNpcId.includes('traveler') || activeTradeNpcId.includes('wandering') || activeTradeNpcId.includes('caravan')) : false);

  // Traveling merchants charge 30% wilderness markup for bringing supplies into dangerous lands
  const travelerPriceMarkup = isTraveler ? 1.30 : 1.0;

  const getStock = (id: string, defaultVal: number = 3) => {
    const activeId = gameState.activeTradeNpcId || 'npc_shop';
    const mConfig = getMerchantConfig(activeRole, activeId);
    
    return gameState.merchantStock?.[activeId]?.[id] !== undefined
      ? gameState.merchantStock[activeId][id]
      : (mConfig.defaultStock[id] !== undefined ? mConfig.defaultStock[id] : defaultVal);
  };

  return (
    <div className="flex-grow flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow min-h-[420px]">
      {/* Trader Banner header */}
      <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center bg-slate-950/30 p-3 rounded-lg border border-slate-850">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏪</span>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              {activeNpc?.name || 'Town Armorer'}'s Trading Counter
            </h3>
            <p className="text-[11px] text-slate-400">
              Role: <strong className="text-emerald-400 capitalize">{activeRole.replace('npc_', '') || 'Merchant'}</strong> | Closes at night (8:00 PM - 8:00 AM)
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('dungeon')}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-100 rounded cursor-pointer transition-all border border-slate-700 flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit Trading</span>
        </button>
      </div>

      {/* Caravan Journey & Escort Service Widget */}
      {(() => {
        const isCaravanMerchant = 
          activeTradeNpcId === 'npc_caravan_merchant' || 
          activeTradeNpcId?.includes('caravan') ||
          activeTradeNpcId?.includes('wandering') ||
          activeTradeNpcId?.includes('traveler') ||
          activeTradeNpcId?.includes('merchant') ||
          activeNpc?.role === 'merchant_caravan' ||
          activeNpc?.role === ('merchant_caravan_ambushed' as any) ||
          activeNpc?.role === 'traveler_merchant' ||
          (activeNpc?.role && typeof activeNpc.role === 'string' && (activeNpc.role.includes('caravan') || activeNpc.role.includes('merchant'))) ||
          (activeNpc?.name && (
            activeNpc.name.toLowerCase().includes('caravan') ||
            activeNpc.name.toLowerCase().includes('sledger') ||
            activeNpc.name.toLowerCase().includes('barger') ||
            activeNpc.name.toLowerCase().includes('caravaneer') ||
            activeNpc.name.toLowerCase().includes('trader') ||
            activeNpc.name.toLowerCase().includes('merchant')
          ));
        if (!isCaravanMerchant) return null;
        return (
          <div className="mb-4 bg-blue-950/20 border border-blue-500/30 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center gap-2 border-b border-blue-950/40 pb-2">
              <span className="text-2xl">🗺️</span>
              <div className="text-left">
                <h4 className="text-xs font-black uppercase text-blue-400 font-sans tracking-wider flex items-center gap-2">
                  <span>CARAVAN ROUTES & ESCORT FAST TRAVEL</span>
                  <span className="text-[9px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded font-mono font-normal">Wilderness & Town Routes</span>
                </h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Sign up as a Caravan Guard to accompany wilderness and regional trade wagons across overworld chunks. Face random road encounters, protect wagon cargo from bandits, and claim major gold payouts upon arrival!
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <h5 className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wide text-left flex justify-between items-center">
                <span>Available Regional Caravan Destinations:</span>
                <span className="text-slate-500 font-mono text-[9px] font-normal">Current Chunk: ({gameState.currentChunkX}, {gameState.currentChunkY})</span>
              </h5>
              {(() => {
                const currentCx = gameState.currentChunkX;
                const currentCy = gameState.currentChunkY;
                const destinations: Array<{ x: number; y: number; name: string; dist: number; theme: string }> = [];
                
                // 1. Scan nearby chunks for procedural towns (-4 to +4)
                for (let dx = -4; dx <= 4; dx++) {
                  for (let dy = -4; dy <= 4; dy++) {
                    const tx = currentCx + dx;
                    const ty = currentCy + dy;
                    if (tx === currentCx && ty === currentCy) continue;
                    if (hasTownAtChunk(tx, ty)) {
                      const name = getDeterministicTownName(tx, ty);
                      const dist = Math.max(Math.abs(dx), Math.abs(dy));
                      destinations.push({ x: tx, y: ty, name, dist, theme: '🏘️ Regional Settlement' });
                    }
                  }
                }
                
                // 2. Major Capital & Wilderness Outpost Trade Hubs
                const majorHubs = [
                  { x: 0, y: 0, name: 'Oakhaven Village', theme: '🌲 Forest Capital' },
                  { x: 3, y: -2, name: 'Vanguard Harbor Port', theme: '⛵ Coastal Citadel' },
                  { x: -3, y: 3, name: 'Ironforge Stronghold', theme: '🏔️ Mountain Fortress' },
                  { x: 4, y: 4, name: 'Sunfire Oasis Outpost', theme: '🏜️ Desert Bazaar' },
                  { x: -4, y: -4, name: 'Frostpeak Sledge Haven', theme: '❄️ Tundra Outpost' },
                  { x: -2, y: 2, name: 'Shadowfen Barge Dock', theme: '🐊 Swamp Dock' },
                  { x: 5, y: -3, name: 'Stormwatch Citadel', theme: '⚡ Highlands Watchtower' }
                ];

                for (const hub of majorHubs) {
                  if (hub.x === currentCx && hub.y === currentCy) continue;
                  if (!destinations.some(t => t.x === hub.x && t.y === hub.y)) {
                    const dist = Math.max(Math.abs(currentCx - hub.x), Math.abs(currentCy - hub.y));
                    destinations.push({
                      x: hub.x,
                      y: hub.y,
                      name: hub.name,
                      dist,
                      theme: hub.theme
                    });
                  }
                }

                if (destinations.length === 0) {
                  return <p className="text-[10px] text-slate-500 italic">No alternative towns discovered in nearby regions.</p>;
                }

                // Sort by distance
                destinations.sort((a, b) => a.dist - b.dist);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {destinations.map((dest, idx) => {
                      const reward = 100 + dest.dist * 80;
                      const riskLevel = dest.dist <= 2 ? '🟢 Low Risk' : dest.dist <= 4 ? '🟡 Moderate Risk' : '👑🔴 High Hazard (Boss Ambush Risk!)';

                      return (
                        <div key={idx} className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 p-3 rounded-lg flex flex-col justify-between gap-2 transition-all">
                          <div className="text-left">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-100 text-[11px] truncate">{dest.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono shrink-0">{dest.theme}</span>
                            </div>
                            <div className="text-[9px] text-slate-400 mt-1 flex justify-between items-center font-mono">
                              <span>Region: ({dest.x}, {dest.y})</span>
                              <span className="text-blue-400 font-semibold">{dest.dist} {dest.dist === 1 ? 'region' : 'regions'} away</span>
                            </div>
                            <div className="text-[8.5px] text-slate-500 mt-0.5 flex justify-between">
                              <span>Route Safety: {riskLevel}</span>
                              <span className="text-yellow-400/90 font-bold">Reward: +{reward}g</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleStartCaravanTravel(dest.x, dest.y, dest.name)}
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] text-slate-50 font-bold text-[9px] rounded-md transition-all flex justify-center items-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <span>🛡️ Escort Caravan Wagon</span>
                            <span className="text-yellow-300 font-mono font-bold">(Payout: +{reward}g)</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* Blacksmith Forge repair bay widget */}
      {isBlacksmith && (
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
              onClick={handleRepairAll}
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
                    onClick={() => handleRepairItem('currentWeapon', item, true)}
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
                    onClick={() => handleRepairItem(slotKey, item, true)}
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
                      onClick={() => handleRepairItem(item.id, item, false)}
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
                <span className="font-bold text-amber-500 uppercase font-sans tracking-wide">🔥 Forge Tier Level: {(gameState.blacksmithForgeLevel ?? 1) === 3 ? '3 (Maximum)' : gameState.blacksmithForgeLevel ?? 1}</span>
                <p className="text-[10px] text-slate-400">
                  {(gameState.blacksmithForgeLevel ?? 1) === 1 && "Tier 1: Basic recipes. Upgrade to Tier 2 to craft Staves, Wands, and Crossbows."}
                  {(gameState.blacksmithForgeLevel ?? 1) === 2 && "Tier 2: Advanced recipes. Upgrade to Tier 3 to craft Greatswords and Warhammers."}
                  {(gameState.blacksmithForgeLevel ?? 1) === 3 && "Tier 3: Ultimate templates unlocked! Elite Legendary templates are active."}
                </p>
              </div>
              {(gameState.blacksmithForgeLevel ?? 1) < 3 ? (
                <button
                  onClick={handleUpgradeBlacksmith}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center gap-1"
                >
                  <span>Upgrade Forge</span>
                  <span className="text-[9px] text-amber-900">
                    ({(gameState.blacksmithForgeLevel ?? 1) === 1 ? '250g + 5x Iron' : '400g + 5x Mithril'})
                  </span>
                </button>
              ) : (
                <span className="text-[10px] text-amber-400 font-bold font-sans">⚔️ Fully Upgraded</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apothecary Laboratory Upgrade Panel */}
      {isApothecary && (
        <div className="mb-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-left text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧪</span>
              <div>
                <h4 className="text-xs font-bold uppercase text-emerald-400 font-sans tracking-wide">Apothecary Laboratory — Upgrade Station</h4>
                <span className="font-bold text-slate-300">Laboratory Tier: {(gameState.apothecaryTier ?? 1) === 3 ? '3 (Maximum)' : gameState.apothecaryTier ?? 1}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {(gameState.apothecaryTier ?? 1) === 1 && "Tier 1: Basic catalyst/elixirs. Upgrade to Tier 2 to unlock Medium Health & Mana potions."}
                  {(gameState.apothecaryTier ?? 1) === 2 && "Tier 2: Advanced mixtures. Upgrade to Tier 3 to unlock Elixirs of Full Restoration & Chaos Catalysts."}
                  {(gameState.apothecaryTier ?? 1) === 3 && "Tier 3: Ultimate laboratory unlocked! Elite Apothecary options are active."}
                </p>
              </div>
            </div>
            {(gameState.apothecaryTier ?? 1) < 3 ? (
              <button
                onClick={handleUpgradeApothecary}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center gap-1.5"
              >
                <span>Upgrade Laboratory</span>
                <span className="text-[9px] text-emerald-900">
                  ({(gameState.apothecaryTier ?? 1) === 1 ? '150g + 10x Berries' : '300g + 20x Berries + 2x Catalysts'})
                </span>
              </button>
            ) : (
              <span className="text-[10px] text-emerald-400 font-bold font-sans">🧪 Fully Upgraded</span>
            )}
          </div>
        </div>
      )}

      {/* Tavern Gossip & Mercenary Recruitment Board */}
      {isTavernMaster && (
        <div className="mb-4 bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center text-left text-[11px] border-b border-amber-950/40 pb-2.5 gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase text-amber-500 font-sans tracking-wide font-sans">🍻 Tavern Master — Rumor Mongering & Gossip</h4>
              <p className="text-[10px] text-slate-400">Buy a round for the bartender to gain valuable coordinates of wild riches.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleBuyRumor}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center justify-center gap-1.5 self-start sm:self-auto"
              >
                🍺 Buy Gossip Round <span className="text-[9px] text-amber-900">(40g)</span>
              </button>
              <button
                onClick={handleTavernRest}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-100 font-bold text-[10px] rounded cursor-pointer transition-all shadow flex items-center justify-center gap-1.5 self-start sm:self-auto"
              >
                🛏️ Rent Cozy Room <span className="text-[9px] text-amber-200">(15g)</span>
              </button>
            </div>
          </div>

          <div className="text-left text-[11px]">
            <h4 className="text-xs font-bold uppercase text-amber-500 font-sans tracking-wide mb-2">👥 Wandering Mercenaries For Hire</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* Novice Mercenary */}
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between gap-2">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sky-400">🗡️ Novice Swordsman</span>
                    <span className="text-[9px] font-mono text-slate-400">Lvl 2</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Basic cutthroat. Restores damage swings with 35 HP, +6 ATK.</p>
                </div>
                <button
                  onClick={() => handleHireMercenary('novice')}
                  className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
                >
                  <span>Hire Novice</span>
                  <span className="text-amber-500 font-mono">(180g)</span>
                </button>
              </div>

              {/* Veteran Mercenary */}
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between gap-2">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400">⚔️ Veteran Raider</span>
                    <span className="text-[9px] font-mono text-slate-400">Lvl 4</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Heavy sellsword. Strong defenses with 55 HP, +9 ATK, 4 DEF.</p>
                </div>
                <button
                  onClick={() => handleHireMercenary('veteran')}
                  className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
                >
                  <span>Hire Veteran</span>
                  <span className="text-amber-500 font-mono">(280g)</span>
                </button>
              </div>

              {/* Champion Gladiator */}
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between gap-2">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-400">🏆 Champion Gladiator</span>
                    <span className="text-[9px] font-mono text-slate-400">Lvl 6</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Gladiator. Unstoppable tanking with 85 HP, +14 ATK, 7 DEF.</p>
                </div>
                <button
                  onClick={() => handleHireMercenary('champion')}
                  className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
                >
                  <span>Hire Champion</span>
                  <span className="text-amber-500 font-mono">(450g)</span>
                </button>
              </div>

              {/* Merchant Guard */}
              <div className="bg-slate-950/80 border border-purple-500/30 p-2.5 rounded-lg flex flex-col justify-between gap-2">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-400">💂 Merchant Guard</span>
                    <span className="text-[9px] font-mono text-slate-400">Lvl 3</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">Outpost defender. Essential for establishing and guarding wilderness safehouses.</p>
                </div>
                <button
                  onClick={() => handleHireMercenary('merchant_guard')}
                  className="w-full py-1 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/20 font-bold text-[9px] rounded transition-all flex justify-center items-center gap-1 cursor-pointer"
                >
                  <span>Hire Guard</span>
                  <span className="text-amber-500 font-mono">(250g)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Twin Columns: Buy on Left, Sell on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto">
        {/* BUY COLUMN */}
        <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl flex flex-col min-h-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3">
            🛍️ Buy Shop Stock
          </h4>
          <div className="flex-grow flex flex-col gap-2.5 text-[11px]">
            {/* Enchanted Artificer & Exotic Gear Shop */}
            {(activeTradeNpcId === 'npc_caravan_merchant' || activeTradeNpcId?.includes('caravan') || activeTradeNpcId?.includes('wandering_merchant') || activeNpc?.role === 'merchant_caravan' || activeNpc?.role === ('merchant_caravan_ambushed' as any)) && (
              <div className="flex flex-col gap-2.5 w-full border border-teal-500/20 bg-teal-950/10 p-3 rounded-xl mb-3">
                <h5 className="text-[10px] font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5 border-b border-teal-950/40 pb-1.5">
                  <span>🛡️</span> ENCHANTED ARTIFICER & EXOTIC GEAR
                </h5>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'horse', name: 'Stallion-Sprung Greaves 🥾', price: 350, desc: 'Enchanted heavy Sabatons. Grants Stallion Speed (overworld speed upgraded to 3m/turn).' },
                    { id: 'camel', name: 'Dune-Treader Sabatons 🐫', price: 400, desc: 'Enchanted desert boots. Complete immunity to sandstorms, sand-blindness, and overworld heat fatigue.' },
                    { id: 'worg', name: 'Worg-Spiked Gauntlets 🧤', price: 550, desc: 'Enchanted heavy gauntlets. Adds +3 damage to all physical attacks and pacifies wild Wolves.' },
                    { id: 'crocodile', name: 'Crocodile Bayou Sabatons 🐊', price: 300, desc: 'Enchanted swamp boots. Move through swamps at extreme speed (2m/turn) and walk safely on water.' }
                  ].map((gear) => {
                    const reputation = gameState.townReputation ?? 100;
                    const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
                    const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
                    const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
                    const chaMult = getCharismaDiscountMultiplier(gameState);
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
                          onClick={() => handleBuyEnchantedGear(gear.id as any, gear.price, gear.name)}
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
              getBlacksmithItems(gameState.townReputation ?? 100).map((item) => {
                const stock = getStock(item.id, 2);
                const reputation = gameState.townReputation ?? 100;
                const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
                const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
                const chaMult = getCharismaDiscountMultiplier(gameState);
                const finalPrice = Math.round(item.value * discountMult * chaMult);
                return (
                  <div key={item.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-2.5 rounded-lg hover:border-slate-700 transition-all text-left">
                    <div className="flex flex-col max-w-[200px] truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200" style={{ color: item.color }}>{item.name}</span>
                        <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded shrink-0 ${stock > 0 ? 'bg-slate-850 text-emerald-400 border border-emerald-950/40' : 'bg-red-950 text-red-400 border border-red-900/40'}`}>
                          {stock > 0 ? `Stock: ${stock}` : 'OUT'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 italic mt-0.5 leading-normal">{item.description}</span>
                      <span className="text-[9px] text-[#38bdf8] font-mono mt-0.5 font-bold">
                        {item.type === 'weapon' ? `Attack: +${item.damage} ATK` : `Armor blocks: +${item.defense} DEF`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleBuyEquipment(item)}
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
                const reputation = gameState.townReputation ?? 100;
                const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
                const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
                const biomeMult = getBiomePriceMultiplier(res.id, gameState.biome);
                const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
                const chaMult = getCharismaDiscountMultiplier(gameState);
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
                      onClick={() => handleBuyResource('material', res.id, res.price)}
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
              getApothecaryItems(gameState.apothecaryTier ?? 1, gameState.townReputation ?? 100).map((cat) => {
                const reputation = gameState.townReputation ?? 100;
                const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
                const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
                const biomeMult = getBiomePriceMultiplier(cat.id, gameState.biome);
                const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
                const chaMult = getCharismaDiscountMultiplier(gameState);
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
                          handleBuyResource('potion', cat.id, cat.price);
                        } else {
                          handleBuyResource('catalyst', cat.id, cat.price);
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
            {(isTavernMaster || activeTradeNpcId === 'npc_caravan_merchant' || activeTradeNpcId?.includes('caravan')) &&
              TAVERN_SHOP_ITEMS.map((item) => {
                const reputation = gameState.townReputation ?? 100;
                const hasChampionDiscount = gameState.hasActiveCaravanLicense || reputation >= 81;
                const discountMult = hasChampionDiscount ? 0.8 : (reputation >= 51 ? 0.9 : 1.0);
                const biomeMult = getBiomePriceMultiplier(item.id, gameState.biome);
                const upgradedDiscountMult = 1.0 - (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.05;
                const chaMult = getCharismaDiscountMultiplier(gameState);
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
                      onClick={() => handleBuyResource('material', item.id, item.price)}
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
                        onClick={() => handleBuyEquipment(item)}
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
                        onClick={() => handleBuyResource('material', item.id, item.price)}
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

        {/* SELL COLUMN */}
        <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl flex flex-col min-h-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3">
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
                      onClick={() => handleSellEquipment(item)}
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
                const upgradedSellMult = 1.0 + (gameState.guildUpgrades?.['up_supply_deals'] || 0) * 0.20;
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
                      onClick={() => handleSellResource('material', mat.id, sellVal)}
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
                const upgradedSellMult = 1.0 + (gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 0.20;
                const baseAdjustedPayout = Math.round(sellVal * biomeMult * upgradedSellMult);
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
                      onClick={() => handleSellResource('catalyst', cat.id, sellVal)}
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
      </div>
    </div>
  );
};

export default TradeModal;
