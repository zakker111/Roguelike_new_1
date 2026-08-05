import React from 'react';
import { GameState, EquipmentItem, FactionTerritory } from '../../types';
import { 
  GUILD_UPGRADES, 
  GUILD_DECORS, 
  SYNDICATE_GEAR, 
  VANGUARD_GEAR, 
  BANDIT_GEAR,
  GuildUpgrade, 
  GuildDecor,
  FactionGear 
} from '../../utils/tradeEconomy';

interface GuildTreasuryPanelProps {
  gameState: GameState;
  isTownCenter: boolean;
  chunkKey: string;
  guildOwned: boolean;
  activeSubTab: 'hq' | 'sanctuary' | 'factions';
  handlePurchaseHQ: () => void;
  handleBuyUpgrade: (upgrade: GuildUpgrade) => void;
  handleBuyDecor: (decor: GuildDecor) => void;
  handleForgeFactionGear: (gear: FactionGear) => void;
  handleClaimTaxes: (territoryId: string) => void;
  handleContributeGold: (amount: number) => void;
  handleBuyTactic: (tacticName: string, costGold: number, territoryId: string) => void;
}

export const GuildTreasuryPanel: React.FC<GuildTreasuryPanelProps> = ({
  gameState,
  isTownCenter,
  chunkKey,
  guildOwned,
  activeSubTab,
  handlePurchaseHQ,
  handleBuyUpgrade,
  handleBuyDecor,
  handleForgeFactionGear,
  handleClaimTaxes,
  handleContributeGold,
  handleBuyTactic,
}) => {
  return (
    <>
      {/* VIEW 1: HQ Purchase & Research */}
      {activeSubTab === 'hq' && (
        <div className="flex-1 flex flex-col justify-start text-left select-none gap-4">
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
      )}

      {/* VIEW 2: Sanctuary Decor */}
      {activeSubTab === 'sanctuary' && guildOwned && (
        <div className="flex-1 flex flex-col justify-start text-left gap-4 select-none animate-fade-in">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sanctuary Custom Installments & Trophies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GUILD_DECORS.map((decor) => {
              const purchased = gameState.guildSanctuary?.includes(decor.id);
              return (
                <div key={decor.id} className="bg-slate-950/40 border border-slate-850 rounded-xl p-3.5 flex justify-between items-start">
                  <div className="flex gap-3 items-start">
                    <span className="text-3xl p-1 bg-slate-900 border border-slate-800 rounded-lg">{decor.icon}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-200 text-xs">{decor.name}</span>
                      <span className="text-[10px] text-slate-450 font-mono">{decor.desc}</span>
                      <span className="text-[9px] font-bold text-purple-400 mt-1 font-sans">{decor.bonusText}</span>
                    </div>
                  </div>
                  <button
                    disabled={purchased || gameState.playerStats.gold < decor.costGold}
                    onClick={() => handleBuyDecor(decor)}
                    className={`px-2.5 py-1.5 rounded text-[10px] font-bold shrink-0 font-sans ${
                      purchased
                        ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/40'
                        : (gameState.playerStats.gold >= decor.costGold ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed')
                    }`}
                  >
                    {purchased ? 'Installed ✔' : `Install: ${decor.costGold}g`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: Factions & Blueprints */}
      {activeSubTab === 'factions' && guildOwned && (
        <div className="flex-1 flex flex-col justify-start text-left gap-4 select-none animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
            {/* Faction Gear Blueprint Crafting */}
            <div className="lg:col-span-12 flex flex-col gap-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faction Exclusive Armaments & Blueprint Blueprints</h3>
              
              {!gameState.faction ? (
                <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl text-center text-[10px] font-mono text-amber-400">
                  ⚠️ You must declare allegiance to either the Syndicate or Vanguard at any Town Hall to unlock faction gear crafting.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(gameState.faction === 'syndicate' ? SYNDICATE_GEAR : (gameState.faction === 'vanguard' ? VANGUARD_GEAR : BANDIT_GEAR)).map((gear) => {
                    const rep = gameState.factionReputation?.[gameState.faction!] || 0;
                    const requiredRep = 40;
                    const metRep = rep >= requiredRep;
                    const metGold = gameState.playerStats.gold >= gear.costGold;
                    
                    let metMats = true;
                    for (const [matId, qty] of Object.entries(gear.costMaterials)) {
                      if ((gameState.inventoryMaterials[matId] || 0) < qty) {
                        metMats = false;
                        break;
                      }
                    }

                    const canForge = metRep && metGold && metMats;

                    return (
                      <div key={gear.id} className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between gap-3 hover:border-slate-800 transition-all">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs font-sans" style={{ color: gear.color }}>{gear.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                              {gear.subType}
                            </span>
                          </div>
                          <span className="text-[9.5px] text-slate-450 font-mono leading-relaxed mt-0.5">{gear.desc}</span>

                          <div className="mt-2 text-[9px] font-mono flex flex-col gap-1 text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-850">
                            <div>• Required Faction Standing: <strong className={metRep ? 'text-emerald-400' : 'text-rose-400'}>{requiredRep} Rep</strong> (Current: {rep})</div>
                            <div>• Gold Cost: <strong className={metGold ? 'text-amber-400' : 'text-rose-400'}>{gear.costGold} Gold</strong></div>
                            <div>• Required Materials:</div>
                            <div className="pl-2 flex flex-col gap-0.5">
                              {Object.entries(gear.costMaterials).map(([matId, qty]) => {
                                const count = gameState.inventoryMaterials[matId] || 0;
                                return (
                                  <span key={matId} className={count >= qty ? 'text-emerald-400' : 'text-rose-400'}>
                                    - {qty}x {matId.replace('mat_', '').toUpperCase()} ({count}/{qty})
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={!canForge}
                          onClick={() => handleForgeFactionGear(gear)}
                          className={`w-full py-1.5 rounded text-[10px] font-bold font-sans transition-all ${
                            canForge
                              ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-md'
                              : 'bg-slate-850 text-slate-600 cursor-not-allowed border border-slate-800/40'
                          }`}
                        >
                          {canForge ? 'Forge Faction Armament' : 'Requirements Unmet'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Faction War Treasury & Tactics */}
            <div className="lg:col-span-12 flex flex-col gap-3 mt-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faction War Treasury & Directives Command</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* War Treasury overview */}
                <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl flex flex-col gap-2.5">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <span className="font-bold text-slate-200 text-xs font-sans">Faction War Coffers</span>
                    <span className="text-[9px] font-mono text-purple-400 uppercase font-bold">
                      {gameState.faction ? `${gameState.faction} War Fund` : 'Unaligned'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">🌙 Syndicate War Treasury:</span>
                      <strong className="text-amber-400">🪙 {gameState.factionWarTreasury?.syndicateGold || 0} Gold</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">☀️ Vanguard War Treasury:</span>
                      <strong className="text-amber-400">🪙 {gameState.factionWarTreasury?.vanguardGold || 0} Gold</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-850 pt-1.5">
                      <span className="text-slate-400">Your Lifetime Contribution:</span>
                      <strong className="text-purple-300">
                        🪙 {gameState.faction === 'syndicate' ? (gameState.factionWarTreasury?.playerContributionSyndicate || 0) : (gameState.factionWarTreasury?.playerContributionVanguard || 0)} Gold
                      </strong>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleContributeGold(100)}
                      disabled={!gameState.faction || gameState.playerStats.gold < 100}
                      className="flex-1 py-1.5 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 text-[9.5px] font-bold rounded cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Contribute 100 Gold (+5 Rep)
                    </button>
                    <button
                      onClick={() => handleContributeGold(500)}
                      disabled={!gameState.faction || gameState.playerStats.gold < 500}
                      className="flex-1 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-700/60 text-[9.5px] font-bold rounded cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Contribute 500 Gold (+30 Rep)
                    </button>
                  </div>
                </div>

                {/* Directives */}
                <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl flex flex-col gap-2.5">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <span className="font-bold text-slate-200 text-xs font-sans">Tactical Campaign Directives</span>
                    <span className="text-[9px] font-mono text-slate-500">Fund via War Coffers</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleBuyTactic('Oakhaven Patrol Offensive', 100, 'chunk_0_0')}
                      disabled={!gameState.faction}
                      className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-left text-[10px] font-mono flex justify-between items-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-200 font-sans">1. Fund Oakhaven Patrol Offensive</span>
                        <span className="text-[9px] font-mono text-slate-550">Cost: 100 Faction Gold. Gain +20% control in Oakhaven.</span>
                      </div>
                      <span className="font-bold text-amber-400">Deploy</span>
                    </button>

                    <button
                      onClick={() => handleBuyTactic('Cove Supply Raid', 150, 'chunk_1_0')}
                      disabled={!gameState.faction}
                      className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-left text-[10px] font-mono flex justify-between items-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-200 font-sans">2. Fund Cove Supply Raid</span>
                        <span className="text-[9px] font-mono text-slate-550">Cost: 150 Faction Gold. Gain +20% control in Cove.</span>
                      </div>
                      <span className="font-bold text-amber-400">Deploy</span>
                    </button>
                  </div>

                  <div className="mt-2.5 border-t border-slate-850 pt-2 flex flex-col gap-1.5">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-slate-500 font-mono">Recent Orders Log:</span>
                    <div className="flex flex-col gap-1">
                      {gameState.factionWarTreasury?.activeTactics && gameState.factionWarTreasury.activeTactics.length > 0 ? (
                        gameState.factionWarTreasury.activeTactics.map((tac, idx) => (
                          <div key={idx} className="text-[9.5px] font-mono text-purple-300 flex items-center gap-1">
                            <span className="text-slate-600">•</span> {tac}
                          </div>
                        ))
                      ) : (
                        <span className="text-[9px] italic text-slate-600 font-mono">No tactical directives deployed in this campaign yet.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Faction Territories & Passive Buffs List */}
                <div className="lg:col-span-12 flex flex-col gap-3 mt-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-350">🌍 Active Conquest Map Territories & Tax Coffers</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(gameState.factionTerritories || {}).map(([id, terr]: [string, FactionTerritory]) => {
                      const isAlliedControl = terr.controller === gameState.faction;
                      const barColor = terr.controller === 'syndicate' 
                        ? 'bg-purple-500' 
                        : (terr.controller === 'vanguard' ? 'bg-amber-400' : 'bg-slate-500');
                      
                      const controllerLabel = terr.controller === 'syndicate' 
                        ? '🌙 Syndicate' 
                        : (terr.controller === 'vanguard' ? '☀️ Vanguard' : '🛡️ Neutral');

                      const hasTaxes = (terr.taxGoldAccumulated || 0) > 0 || (terr.taxMaterialCountAccumulated || 0) > 0;

                      return (
                        <div key={id} className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl flex flex-col gap-3 hover:border-slate-800 transition-all">
                          <div className="flex justify-between items-start border-b border-slate-850 pb-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-200 text-xs font-sans">{terr.name}</span>
                              <span className="text-[9px] font-mono text-slate-550">Region Sectors Campaign</span>
                            </div>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              terr.controller === 'syndicate' 
                                ? 'bg-purple-950/70 border border-purple-800/40 text-purple-300' 
                                : (terr.controller === 'vanguard' ? 'bg-amber-950/70 border border-amber-800/40 text-amber-300' : 'bg-slate-900 border border-slate-800 text-slate-400')
                            }`}>
                              {controllerLabel}
                            </span>
                          </div>

                          {/* Progress bar for control */}
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                              <span>Control Strength:</span>
                              <strong className="text-slate-300">{terr.controlPercent}%</strong>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                              <div 
                                className={`h-full ${barColor} transition-all duration-500`} 
                                style={{ width: `${terr.controlPercent}%` }} 
                              />
                            </div>
                          </div>

                          {/* Active Passive Buff status */}
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 flex flex-col gap-1 text-[9.5px]">
                            <div className="flex justify-between items-center border-b border-slate-800/60 pb-1">
                              <span className="text-slate-450 font-mono">Territory Bonus Buff:</span>
                              <span className={`font-sans font-bold text-[8.5px] px-1.5 rounded ${
                                isAlliedControl ? 'bg-emerald-950/60 border border-emerald-800/30 text-emerald-400' : 'bg-slate-900 text-slate-500'
                              }`}>
                                {isAlliedControl ? 'ACTIVE ✔' : 'INACTIVE ✖'}
                              </span>
                            </div>
                            <span className={`font-mono leading-relaxed font-bold ${isAlliedControl ? 'text-purple-300' : 'text-slate-500'}`}>
                              {terr.bonusDescription}
                            </span>
                          </div>

                          {/* Accumulated Taxes coffers */}
                          <div className="flex flex-col gap-2 mt-1">
                            <div className="flex justify-between items-center text-[9.5px] font-mono bg-slate-900/40 p-2 rounded border border-slate-850/40">
                              <span className="text-slate-450">Accumulated Coffers Taxes:</span>
                              <span className="text-amber-400 font-sans font-bold flex flex-col items-end text-right">
                                <span>🪙 {terr.taxGoldAccumulated || 0} Gold</span>
                                {terr.taxMaterialCountAccumulated !== undefined && terr.taxMaterialCountAccumulated > 0 && (
                                  <span className="text-purple-300 font-mono text-[8px] mt-0.5">
                                    📦 +{terr.taxMaterialCountAccumulated}x {terr.taxMaterialIdAccumulated?.replace('mat_', '').toUpperCase()}
                                  </span>
                                )}
                              </span>
                            </div>

                            <button
                              onClick={() => handleClaimTaxes(id)}
                              disabled={!isAlliedControl || !hasTaxes}
                              className={`w-full py-1.5 rounded text-[10px] font-bold font-sans transition-all ${
                                isAlliedControl && hasTaxes
                                  ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-md'
                                  : 'bg-slate-850 text-slate-600 cursor-not-allowed border border-slate-800/40'
                              }`}
                            >
                              Claim Local Coffers Dividends
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
