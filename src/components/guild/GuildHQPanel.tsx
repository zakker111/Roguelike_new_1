import React from 'react';
import { GUILD_UPGRADES, GuildUpgrade } from '../../utils/tradeEconomy';
import { GuildHQPanelProps } from './types';

export const GuildHQPanel: React.FC<GuildHQPanelProps> = ({
  gameState,
  isTownCenter,
  chunkKey,
  guildOwned,
  handlePurchaseHQ,
  handleBuyUpgrade,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-start text-left select-none gap-4 animate-fade-in">
      {!guildOwned ? (
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center p-8 bg-slate-950/60 border border-slate-850 rounded-2xl gap-4">
          <span className="text-4xl">🏰</span>
          <h3 className="font-bold text-slate-200 text-xs uppercase tracking-widest font-sans">Establish Sunder Guild Headquarters</h3>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed max-w-sm">
            Acquire a lasting home base property in Oakhaven Town (Chunk 0,0) to pioneer active guild research upgrades, custom decorations, and autonomous companion expeditions.
          </p>
          <div className="text-[9px] text-slate-500 font-mono flex flex-col gap-1">
            <div>• Price: <strong className="text-amber-400">500 Gold Coins</strong></div>
            <div>• Current location chunk: <strong className="text-slate-200">[{chunkKey}]</strong> {isTownCenter ? '(Within Port Town ✔)' : '(Wilderness ✖)'}</div>
          </div>
          <button
            onClick={handlePurchaseHQ}
            disabled={!isTownCenter || gameState.playerStats.gold < 500}
            className={`px-4 py-2 text-xs font-bold rounded-lg shadow-md transition-all ${
              isTownCenter && gameState.playerStats.gold >= 500
                ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            Acquire Guild Headquarters Deed
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0">
          {/* Upgrade list */}
          <div className="md:col-span-8 flex flex-col gap-3.5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modular Laboratory Guild Research Upgrades</h3>
            <div className="flex flex-col gap-2.5">
              {GUILD_UPGRADES.map((upgrade) => {
                const level = gameState.guildUpgrades?.[upgrade.id] || 0;
                const isMax = level >= upgrade.maxLevel;
                return (
                  <div key={upgrade.id} className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex justify-between items-center hover:border-slate-800 transition-all">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 font-sans text-xs">{upgrade.name}</span>
                        <span className="text-[8px] font-bold font-mono px-1.5 py-0.2 bg-purple-950/70 border border-purple-800/40 text-purple-300 rounded-full">
                          Rank {level} / {upgrade.maxLevel}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-450 leading-relaxed font-mono">{upgrade.desc}</span>
                      {!isMax && (
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-slate-500">
                          <span className="flex items-center gap-1">🪙 Cost: <strong className="text-amber-400">{upgrade.costGold}g</strong></span>
                          <span className="flex items-center gap-1.5">
                            🧱 Mats: {Object.entries(upgrade.costMaterials).map(([matId, qty]) => {
                              const count = gameState.inventoryMaterials[matId] || 0;
                              return (
                                <span key={matId} className={count >= qty ? 'text-emerald-400' : 'text-rose-400'}>
                                  {qty}x {matId.replace('mat_', '').toUpperCase()} ({count}/{qty})
                                </span>
                              );
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      disabled={isMax || gameState.playerStats.gold < upgrade.costGold}
                      onClick={() => handleBuyUpgrade(upgrade)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold shrink-0 transition-all ${
                        isMax 
                          ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/40 opacity-80 cursor-default'
                          : (gameState.playerStats.gold >= upgrade.costGold ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed')
                      }`}
                    >
                      {isMax ? 'Fully Researched' : 'Research Upgrade'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HQ stats */}
          <div className="md:col-span-4 bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 font-mono text-[10px] text-slate-450">
            <h3 className="font-bold font-sans text-slate-300 text-[10px] uppercase border-b border-slate-850 pb-1.5">Guild Registry Info</h3>
            <div className="flex justify-between">
              <span>HQ Status:</span>
              <strong className="text-emerald-400 font-sans">Active & Operating</strong>
            </div>
            <div className="flex justify-between">
              <span>Base City:</span>
              <strong className="text-slate-200">Oakhaven Town</strong>
            </div>
            <div className="flex justify-between">
              <span>Sunder Logistics Rank:</span>
              <strong className="text-slate-200">{gameState.guildUpgrades?.['up_supply_deals'] || 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Expedition Desk Level:</span>
              <strong className="text-slate-200">{gameState.guildUpgrades?.['up_expeditions'] || 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Bargaining Cooperative:</span>
              <strong className="text-slate-200">{gameState.guildUpgrades?.['up_guild_discounts'] || 0}</strong>
            </div>
            <div className="border-t border-slate-850 pt-2.5 mt-1.5 flex flex-col gap-1.5 text-[9px]">
              <div className="text-slate-300 font-bold font-sans">Current passive guild stats:</div>
              <div>• Material Sale Price: <strong className="text-emerald-400 font-sans">+{(gameState.guildUpgrades?.['up_supply_deals'] || 0) * 20}%</strong></div>
              <div>• Caravan Purchase Discount: <strong className="text-emerald-400 font-sans">-{(gameState.guildUpgrades?.['up_guild_discounts'] || 0) * 5}%</strong></div>
              <div>• Dispatch Mission Speed: <strong className="text-emerald-400 font-sans">+{(gameState.guildUpgrades?.['up_expeditions'] || 0) * 25}% Speed</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
