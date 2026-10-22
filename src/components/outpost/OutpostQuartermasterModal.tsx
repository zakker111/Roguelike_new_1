/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { GameState, EquipmentItem } from '../../types';
import type { OutpostQuartermasterState, OutpostQuartermasterItem, FactionId } from '../../types/worldEvents';
import { getQuartermasterPrice } from '../../world/outposts/outpostQuartermaster';
import { getFactionDisplayName } from '../../world/outposts/territoryEngine';
import { formatGameTime } from '../../utils/overworld';

export interface OutpostQuartermasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  quartermaster: OutpostQuartermasterState;
  chunkX?: number;
  chunkY?: number;
  outpostName?: string;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound?: (sound: any) => void;
  addLogMessage?: (text: string, type?: any) => void;
}

export const OutpostQuartermasterModal: React.FC<OutpostQuartermasterModalProps> = ({
  isOpen,
  onClose,
  quartermaster,
  chunkX,
  chunkY,
  outpostName,
  gameState,
  setGameState,
  playSound,
  addLogMessage
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'bounty' | 'barracks'>('shop');

  if (!isOpen) return null;

  const playerStanding =
    (gameState.factionReputation as any)?.[quartermaster.factionId] ??
    (quartermaster.factionId === 'vanguard'
      ? (gameState.factionReputation as any)?.vanguard ?? 0
      : quartermaster.factionId === 'syndicate'
      ? (gameState.factionReputation as any)?.syndicate ?? 0
      : (gameState.factionReputation as any)?.bandits ?? 0);

  const factionTitle = getFactionDisplayName(quartermaster.factionId);

  // Check if player can afford rest
  const restCost = quartermaster.restCostGold || 25;

  const handleBuyItem = (item: OutpostQuartermasterItem) => {
    const { price, isRefused } = getQuartermasterPrice(item.costGold, quartermaster.factionId, playerStanding);

    if (isRefused) {
      playSound('deny');
      addLogMessage(`❌ The Quartermaster sneers: "We don't sell to enemy spies. Leave before our guards run you through!"`, 'danger');
      return;
    }

    if (gameState.playerStats.gold < price) {
      playSound('bump');
      addLogMessage(`❌ Not enough gold! "${item.name}" costs ${price} Gold (You have: ${gameState.playerStats.gold}g).`, 'system');
      return;
    }

    if (item.stock <= 0) {
      playSound('bump');
      addLogMessage(`❌ "${item.name}" is currently out of stock.`, 'system');
      return;
    }

    // Process purchase
    setGameState((prev) => {
      const nextGold = prev.playerStats.gold - price;
      const nextEquip = [...(prev.equipmentInventory || [])];
      const nextMaterials = { ...(prev.inventoryMaterials || {}) };
      const nextCatalysts = { ...(prev.inventoryCatalysts || {}) };
      const nextStats = { ...prev.playerStats, gold: nextGold };

      if (item.type === 'weapon' || item.type === 'armor') {
        const newGear: EquipmentItem = {
          id: `gear_${item.id}_${Date.now()}`,
          name: item.name,
          type: item.type === 'weapon' ? 'weapon' : 'armor',
          subType: item.id.includes('shield')
            ? 'Shield'
            : item.type === 'weapon'
            ? 'Sword'
            : 'HeavyArmor',
          defense: item.id.includes('shield') ? 8 : item.id.includes('plate') ? 12 : item.id.includes('cowl') ? 5 : item.id.includes('jerkin') ? 7 : 0,
          damage: item.id.includes('stiletto') ? 10 : item.id.includes('crossbow') ? 11 : 0,
          critChance: item.id.includes('stiletto') ? 0.25 : 0.05,
          range: item.id.includes('crossbow') ? 6 : 1,
          color: item.factionExclusive === 'vanguard' ? '#38bdf8' : item.factionExclusive === 'syndicate' ? '#c084fc' : '#f97316',
          description: item.description,
          value: price,
          durability: 120,
          maxDurability: 120
        };
        nextEquip.push(newGear);
      } else if (item.type === 'catalyst') {
        nextCatalysts[item.id] = (nextCatalysts[item.id] || 0) + 1;
      } else {
        // Consumables and materials stored in materials bag
        nextMaterials[item.id] = (nextMaterials[item.id] || 0) + 1;
      }

      // Decrement stock in chunk watchtower
      const chunkKey = `${chunkX},${chunkY}`;
      const chunk = prev.overworldChunks[chunkKey];
      let updatedChunks = prev.overworldChunks;

      if (chunk && chunk.watchtower && chunk.watchtower.quartermaster) {
        const updatedItems = chunk.watchtower.quartermaster.items.map((i) =>
          i.id === item.id ? { ...i, stock: Math.max(0, i.stock - 1) } : i
        );
        updatedChunks = {
          ...prev.overworldChunks,
          [chunkKey]: {
            ...chunk,
            watchtower: {
              ...chunk.watchtower,
              quartermaster: {
                ...chunk.watchtower.quartermaster,
                items: updatedItems
              }
            }
          }
        };
      }

      return {
        ...prev,
        playerStats: nextStats,
        equipmentInventory: nextEquip,
        inventoryMaterials: nextMaterials,
        inventoryCatalysts: nextCatalysts,
        overworldChunks: updatedChunks
      };
    });

    playSound('loot');
    addLogMessage(`🛍️ Purchased "${item.name}" for ${price} Gold!`, 'loot');
  };

  const handleClaimBounty = () => {
    if (!quartermaster.bountyClaimAvailable) {
      playSound('bump');
      addLogMessage(`ℹ️ No unclaimed bounty purse at this outpost.`, 'system');
      return;
    }

    const bounty = quartermaster.bountyRewardGold || 200;

    setGameState((prev) => {
      const nextGold = prev.playerStats.gold + bounty;
      const chunkKey = `${chunkX},${chunkY}`;
      const chunk = prev.overworldChunks[chunkKey];
      let updatedChunks = prev.overworldChunks;

      if (chunk && chunk.watchtower && chunk.watchtower.quartermaster) {
        updatedChunks = {
          ...prev.overworldChunks,
          [chunkKey]: {
            ...chunk,
            watchtower: {
              ...chunk.watchtower,
              quartermaster: {
                ...chunk.watchtower.quartermaster,
                bountyClaimAvailable: false
              }
            }
          }
        };
      }

      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          gold: nextGold
        },
        overworldChunks: updatedChunks
      };
    });

    playSound('levelUp');
    addLogMessage(`🏆 BOUNTY CLAIMED: The Quartermaster handed you a heavy purse of ${bounty} Gold for defending the outpost!`, 'quest');
  };

  const handleRestAtOutpost = () => {
    if (gameState.playerStats.gold < restCost) {
      playSound('bump');
      addLogMessage(`❌ Not enough gold to rest in the barracks (${restCost} Gold required).`, 'system');
      return;
    }

    setGameState((prev) => {
      const nextGold = prev.playerStats.gold - restCost;
      const nextHp = prev.playerStats.maxHp;
      const nextMp = prev.playerStats.maxMp;
      const nextTime = (prev.gameTime + 360) % 1440; // 6 hours rest

      return {
        ...prev,
        gameTime: nextTime,
        playerStats: {
          ...prev.playerStats,
          hp: nextHp,
          mp: nextMp,
          gold: nextGold,
          exhaustion: 0
        },
        logs: [
          ...prev.logs,
          {
            id: `barracks_rest_${Date.now()}`,
            text: `🛏️ You slept soundly in the garrison barracks. HP and MP fully restored, exhaustion cleared! (-${restCost} Gold)`,
            type: 'info',
            timestamp: formatGameTime(nextTime).timeStr
          }
        ]
      };
    });

    playSound('potion');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100 font-sans">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-slate-800/80 rounded-xl border border-slate-700">🏰</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-amber-300 tracking-wide">{outpostName}</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                  {factionTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Quartermaster: <span className="text-slate-200 font-medium">{quartermaster.name}</span> · Standing:{' '}
                <span
                  className={
                    playerStanding >= 25
                      ? 'text-emerald-400 font-bold'
                      : playerStanding <= -25
                      ? 'text-red-400 font-bold'
                      : 'text-amber-400 font-bold'
                  }
                >
                  {playerStanding > 0 ? `+${playerStanding}` : playerStanding}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400">Purse</span>
              <p className="text-sm font-mono font-bold text-amber-400">🪙 {gameState.playerStats.gold}g</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Narrative Dialogue */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/60 text-xs italic text-slate-300">
          "{quartermaster.dialogueGreeting}"
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
              activeTab === 'shop'
                ? 'bg-slate-800 text-amber-300 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡️ Garrison Armory & Supplies
          </button>
          <button
            onClick={() => setActiveTab('bounty')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all relative ${
              activeTab === 'bounty'
                ? 'bg-slate-800 text-amber-300 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏆 Outpost Bounty
            {quartermaster.bountyClaimAvailable && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-amber-500 text-black font-extrabold rounded-full animate-pulse">
                CLAIM
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('barracks')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
              activeTab === 'barracks'
                ? 'bg-slate-800 text-amber-300 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🛏️ Garrison Barracks (Rest)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-4">
          {activeTab === 'shop' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quartermaster.items.map((item) => {
                  const { price, discountPercent, isRefused } = getQuartermasterPrice(
                    item.costGold,
                    quartermaster.factionId,
                    playerStanding
                  );
                  const canAfford = gameState.playerStats.gold >= price;

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl p-2 bg-slate-900 rounded-lg border border-slate-800">{item.icon}</span>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-100">{item.name}</h4>
                            <span className="text-xs font-mono font-bold text-amber-400">
                              🪙 {price}g
                              {discountPercent > 0 && (
                                <span className="ml-1 text-[10px] text-emerald-400">(-{discountPercent}%)</span>
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                          {item.effectDescription && (
                            <p className="text-[11px] text-sky-400 font-medium mt-1">✨ {item.effectDescription}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Stock: {item.stock}</span>
                        <button
                          disabled={!canAfford || item.stock <= 0 || isRefused}
                          onClick={() => handleBuyItem(item)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                            isRefused
                              ? 'bg-red-900/40 text-red-400 border border-red-800/50 cursor-not-allowed'
                              : item.stock <= 0
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isRefused ? 'Hostile Refusal' : item.stock <= 0 ? 'Out of Stock' : 'Purchase'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'bounty' && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-center space-y-4">
              <span className="text-4xl inline-block p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                🏆
              </span>
              <div>
                <h4 className="text-base font-bold text-amber-300">Frontier Defense Bounty Station</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  When this outpost falls under siege, any brave warrior who assists the garrison in vanquishing the
                  enemy raiders is awarded a generous bounty purse funded by the regional council.
                </p>
              </div>

              {quartermaster.bountyClaimAvailable ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl max-w-md mx-auto">
                  <p className="text-sm font-bold text-emerald-400">✅ Unclaimed Victory Bounty Available!</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Your valor during the recent siege was officially noted by the outpost commander.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <span className="text-lg font-mono font-bold text-amber-400">
                      🪙 {quartermaster.bountyRewardGold} Gold
                    </span>
                    <button
                      onClick={handleClaimBounty}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-950/50"
                    >
                      Claim Bounty Purse
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl max-w-md mx-auto">
                  <p className="text-xs text-slate-400">
                    No bounties pending at this time. Return when a rival faction attacks the sector!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'barracks' && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-center space-y-4">
              <span className="text-4xl inline-block p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl">🛏️</span>
              <div>
                <h4 className="text-base font-bold text-sky-300">Garrison Bunkhouse & Rest Haven</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Enjoy a warm fire, clean bunks, and fortified stone walls away from roaming wilderness horrors. A six-hour
                  rest fully rejuvenates your health and clears exhaustion.
                </p>
              </div>

              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl max-w-sm mx-auto space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Rest Fee:</span>
                  <span className="font-mono font-bold text-amber-400">🪙 {restCost} Gold</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Effect:</span>
                  <span className="text-emerald-400 font-medium">100% HP & MP, -100% Exhaustion</span>
                </div>
                <button
                  onClick={handleRestAtOutpost}
                  disabled={gameState.playerStats.gold < restCost}
                  className={`w-full py-2 rounded-xl font-bold text-xs transition-colors ${
                    gameState.playerStats.gold >= restCost
                      ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-950/50'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Rest in Garrison ({restCost}g)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
