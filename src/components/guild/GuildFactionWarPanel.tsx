import React from 'react';
import { FactionTerritory } from '../../types';
import { 
  SYNDICATE_GEAR, 
  VANGUARD_GEAR, 
  BANDIT_GEAR,
  FactionGear 
} from '../../utils/tradeEconomy';
import { GuildFactionWarPanelProps } from './types';

export const GuildFactionWarPanel: React.FC<GuildFactionWarPanelProps> = ({
  gameState,
  guildOwned,
  handleForgeFactionGear,
  handleClaimTaxes,
  handleContributeGold,
  handleBuyTactic,
}) => {
  if (!guildOwned) return null;

  return (
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
              {(gameState.faction === 'syndicate' ? SYNDICATE_GEAR : (gameState.faction === 'vanguard' ? VANGUARD_GEAR : BANDIT_GEAR)).map((gear: FactionGear) => {
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
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-400 uppercase">
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
                          : 'bg-slate-855 text-slate-600 cursor-not-allowed border border-slate-800/40'
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
                    <span className="text-[9px] font-mono text-slate-400">Cost: 100 Faction Gold. Gain +20% control in Oakhaven.</span>
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
                    <span className="text-[9px] font-mono text-slate-400">Cost: 150 Faction Gold. Gain +20% control in Cove.</span>
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
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">🌍 Active Conquest Map Territories & Tax Coffers</h4>
              
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
                          <span className="text-[9px] font-mono text-slate-400">Region Sectors Campaign</span>
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
                          <span className="text-slate-400 font-mono">Territory Bonus Buff:</span>
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
                          <span className="text-slate-400">Accumulated Coffers Taxes:</span>
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
  );
};
