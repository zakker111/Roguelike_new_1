import React from 'react';
import { Check, Lock } from 'lucide-react';
import { GameState, EquipmentItem } from '../../types';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../../utils/itemsData';

interface GuildStashPanelProps {
  hasStorageAccess: boolean;
  isTown: boolean;
  chunkKey: string;
  isTownCenter: boolean;
  guildOwned: boolean;
  isUsingGuildHQStash: boolean;
  gameState: GameState;
  handlePurchaseSafehouse: () => void;
  handleSafehouseRest: () => void;
  handleStashAll: () => void;
  handleStashMaterial: (matId: string, deposit: boolean) => void;
  handleStashCatalyst: (catId: string, deposit: boolean) => void;
  handleStashEquipment: (item: EquipmentItem, deposit: boolean) => void;
  currentSafehouseStash: {
    equipment: EquipmentItem[];
    materials: { [id: string]: number };
    catalysts: { [id: string]: number };
  };
  setActiveSubTab: (tab: 'hq' | 'sanctuary' | 'stash' | 'factions' | 'dispatch') => void;
}

export const GuildStashPanel: React.FC<GuildStashPanelProps> = ({
  hasStorageAccess,
  isTown,
  chunkKey,
  isTownCenter,
  guildOwned,
  isUsingGuildHQStash,
  gameState,
  handlePurchaseSafehouse,
  handleSafehouseRest,
  handleStashAll,
  handleStashMaterial,
  handleStashCatalyst,
  handleStashEquipment,
  currentSafehouseStash,
  setActiveSubTab,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-start text-left gap-4 select-none animate-fade-in">
      {!hasStorageAccess ? (
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center p-8 bg-slate-950/60 border border-slate-850 rounded-2xl gap-4">
          <span className="text-4xl">{isTown ? '🏰' : '🏕️'}</span>
          <h3 className="font-bold text-slate-200 text-xs uppercase tracking-widest font-sans">
            {isTown ? 'Establish Town Guild House' : 'Establish Wilderness Safehouse'}
          </h3>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed max-w-sm">
            {isTown 
              ? `Purchase the deed for the empty Guild House in this town chunk [${chunkKey}]. Since it is built within secured city walls, no active follower is required to guard it!`
              : `Establish a hidden underground escape safehouse in the current chunk [${chunkKey}] to unlock infinite safe chest storage. This requires any active companion follower in your party to guard the site.`}
          </p>
          {isTownCenter && !guildOwned ? (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] text-amber-400 font-mono">
                Please establish your primary Sunder Guild Headquarters under the "Guild HQ" tab first to unlock this central vault.
              </p>
              <button
                onClick={() => setActiveSubTab('hq')}
                className="px-4 py-2 text-xs font-bold rounded-lg shadow-md transition-all bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
              >
                Go to Guild HQ Tab
              </button>
            </div>
          ) : (
            <>
              <div className="text-[9px] text-slate-500 font-mono flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-lg border border-slate-800/40 w-full max-w-xs text-left">
                <div className="flex justify-between">
                  <span>• Price:</span>
                  <strong className="text-amber-400">300 Gold Coins</strong>
                </div>
                {!isTown && (
                  <div className="flex justify-between items-center gap-1">
                    <span>• Guard Requirement:</span>
                    {gameState.followers.length > 0 ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Ready ({gameState.followers[0].name})
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold flex items-center gap-0.5">
                        <Lock className="w-3 h-3" /> Companion Follower Required
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handlePurchaseSafehouse}
                disabled={gameState.playerStats.gold < 300 || (!isTown && gameState.followers.length === 0)}
                className={`px-4 py-2 text-xs font-bold rounded-lg shadow-md transition-all ${
                  gameState.playerStats.gold >= 300 && (isTown || gameState.followers.length > 0)
                    ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                {isTown ? 'Buy Guild House Deed' : 'Buy Safehouse Deed'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {/* Safehouse Rest Panel */}
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 select-none">
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase text-purple-400 font-sans tracking-wide">
                {isUsingGuildHQStash ? '🏰 Guild HQ Storage Vault' : '⛺ Cozy Safehouse Shelter'}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isUsingGuildHQStash 
                  ? 'Your central high-security vault at Oakhaven Headquarters. Store and organize items across your characters safely.'
                  : 'Your personal fortified wilderness sanctuary. Rest safely to purge all physical combat exhaustion and recover vitality.'}
              </p>
            </div>
            {!isUsingGuildHQStash && (
              <button
                onClick={handleSafehouseRest}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all shadow flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto justify-center"
              >
                💤 Cozy Camp Rest <span className="text-[9px] text-purple-200">(FREE)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-0 text-[11px]">
          
          {/* Backpack (Deposit Column) */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col gap-3 min-h-[300px]">
            <h4 className="font-bold text-slate-300 border-b border-slate-850 pb-1.5 flex justify-between items-center">
              <span>🎒 Deposit from Backpack</span>
              <button
                id="guild-stash-all-btn"
                onClick={handleStashAll}
                className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[9.5px] rounded transition-all shadow-sm cursor-pointer flex items-center gap-1 border border-purple-500/20 active:scale-95"
              >
                <span>Stash All</span>
                <span>📥</span>
              </button>
            </h4>

            <div className="flex-grow overflow-y-auto max-h-[320px] flex flex-col gap-3 pr-1">
              {/* Raw materials */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Materials:</span>
                {BASIC_MATERIALS.map(mat => {
                  const qty = gameState.inventoryMaterials[mat.id] || 0;
                  return (
                    <div key={mat.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-850/60 p-1.5 rounded text-[10px] font-mono">
                      <span className="text-slate-350">{mat.name} (x{qty})</span>
                      <button
                        disabled={qty <= 0}
                        onClick={() => handleStashMaterial(mat.id, true)}
                        className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 font-bold border border-purple-800/40 rounded text-[9px]"
                      >
                        Stash 📥
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Catalysts */}
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Catalysts:</span>
                {ELEMENTAL_CATALYSTS.map(cat => {
                  const qty = gameState.inventoryCatalysts[cat.id] || 0;
                  return (
                    <div key={cat.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-850/60 p-1.5 rounded text-[10px] font-mono">
                      <span style={{ color: cat.color }}>✸ {cat.name} (x{qty})</span>
                      <button
                        disabled={qty <= 0}
                        onClick={() => handleStashCatalyst(cat.id, true)}
                        className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 font-bold border border-purple-800/40 rounded text-[9px]"
                      >
                        Stash 📥
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Weapons & Armor */}
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Loot & Equipment:</span>
                {gameState.equipmentInventory.length > 0 ? (
                  gameState.equipmentInventory.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-850/60 p-1.5 rounded text-[10px] font-mono">
                      <span style={{ color: item.color }} className="truncate max-w-[150px]">{item.name}</span>
                      <button
                        onClick={() => handleStashEquipment(item, true)}
                        className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 font-bold border border-purple-800/40 rounded text-[9px]"
                      >
                        Stash 📥
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-[9.5px] italic text-slate-650 pl-1">No unequipped gear to stash.</span>
                )}
              </div>
            </div>
          </div>

          {/* Safehouse Chest (Withdraw Column) */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col gap-3 min-h-[300px]">
            <h4 className="font-bold text-purple-400 border-b border-slate-850 pb-1.5 flex justify-between items-center">
              <span>📦 Safehouse Storage Chest</span>
              <span className="text-[9.5px] font-mono text-slate-500">Hidden safe vault</span>
            </h4>

            <div className="flex-grow overflow-y-auto max-h-[320px] flex flex-col gap-3 pr-1">
              {/* Materials */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Stashed Materials:</span>
                {Object.keys(currentSafehouseStash.materials).some(id => (currentSafehouseStash.materials[id] || 0) > 0) ? (
                  Object.entries(currentSafehouseStash.materials).map(([id, qty]) => {
                    if (!qty) return null;
                    const name = BASIC_MATERIALS.find(m => m.id === id)?.name || id;
                    return (
                      <div key={id} className="flex justify-between items-center bg-slate-900/50 border border-slate-850/80 p-1.5 rounded text-[10px] font-mono">
                        <span className="text-slate-300">{name} (x{qty})</span>
                        <button
                          onClick={() => handleStashMaterial(id, false)}
                          className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-bold border border-emerald-800/40 rounded text-[9px]"
                        >
                          Retrieve 📤
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-[9.5px] italic text-slate-650 pl-1">No materials inside.</span>
                )}
              </div>

              {/* Catalysts */}
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Stashed Catalysts:</span>
                {Object.keys(currentSafehouseStash.catalysts).some(id => (currentSafehouseStash.catalysts[id] || 0) > 0) ? (
                  Object.entries(currentSafehouseStash.catalysts).map(([id, qty]) => {
                    if (!qty) return null;
                    const name = ELEMENTAL_CATALYSTS.find(c => c.id === id)?.name || id;
                    const color = ELEMENTAL_CATALYSTS.find(c => c.id === id)?.color || '#9ca3af';
                    return (
                      <div key={id} className="flex justify-between items-center bg-slate-900/50 border border-slate-850/80 p-1.5 rounded text-[10px] font-mono">
                        <span style={{ color }}>✸ {name} (x{qty})</span>
                        <button
                          onClick={() => handleStashCatalyst(id, false)}
                          className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-bold border border-emerald-800/40 rounded text-[9px]"
                        >
                          Retrieve 📤
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-[9.5px] italic text-slate-650 pl-1">No catalysts inside.</span>
                )}
              </div>

              {/* Equipment */}
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Stashed Loot & Gear:</span>
                {currentSafehouseStash.equipment && currentSafehouseStash.equipment.length > 0 ? (
                  currentSafehouseStash.equipment.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-900/50 border border-slate-850/80 p-1.5 rounded text-[10px] font-mono">
                      <span style={{ color: item.color }} className="truncate max-w-[150px]">{item.name}</span>
                      <button
                        onClick={() => handleStashEquipment(item, false)}
                        className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-bold border border-emerald-800/40 rounded text-[9px]"
                      >
                        Retrieve 📤
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-[9.5px] italic text-slate-650 pl-1">No equipment stashed here.</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
      )}
    </div>
  );
};
