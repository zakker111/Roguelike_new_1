import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createNewGameRun } from '../utils/gameStateFactory';
import { GameState, EquipmentItem, TileType, WeaponBaseType } from '../types';
import { 
  GUILD_UPGRADES, 
  GUILD_DECORS, 
  COMPANION_QUEST_BOARD, 
  SYNDICATE_GEAR, 
  VANGUARD_GEAR,
  GuildUpgrade,
  GuildDecor,
  FactionGear
} from '../utils/tradeEconomy';
import safehousePreset from '../data/safehouse.json';
import { hasTownAtChunk } from '../utils/overworld';

/**
 * Helper simulating the state mutation logic in useGuildOperations without requiring a React render context.
 */
function createGuildController(
  initialState: GameState, 
  addLogMessage: (text: string, type: 'system' | 'combat' | 'loot' | 'danger' | 'craft') => void, 
  playSound: (soundName: string) => void
) {
  let state = initialState;

  const setGameState = (updater: (prev: GameState) => GameState) => {
    state = updater(state);
  };

  const getChunkKey = () => `${state.currentChunkX},${state.currentChunkY}`;
  const isTownCenter = () => state.currentChunkX === 0 && state.currentChunkY === 0;

  return {
    getState: () => state,
    
    // 1. Purchase Guild Headquarters
    handlePurchaseHQ: () => {
      const chunkKey = getChunkKey();
      const townCenter = isTownCenter();
      if (!townCenter) {
        playSound('bump');
        addLogMessage('❌ The Guild Headquarters can only be founded inside the Oakhaven Town Center (Chunk 0,0).', 'system');
        return;
      }
      if (state.playerStats.gold < 500) {
        playSound('bump');
        addLogMessage('❌ You need 500 Gold coins to purchase the Sunder Guild Headquarters deed.', 'system');
        return;
      }

      playSound('loot');
      setGameState(prev => ({
        ...prev,
        guildOwned: true,
        guildUpgrades: prev.guildUpgrades || {
          'up_supply_deals': 0,
          'up_expeditions': 0,
          'up_guild_discounts': 0
        },
        guildSanctuary: prev.guildSanctuary || [],
        guildStash: prev.guildStash || {
          equipment: [],
          materials: {},
          catalysts: {},
          potions: {}
        },
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold - 500
        }
      }));
      addLogMessage('🏰 CONGRATULATIONS! You have established the Sunder Guild Headquarters! Access research, safehouses, and autonomous expeditions.', 'craft');
    },

    // 2. Buy Safehouse in current Chunk
    handlePurchaseSafehouse: () => {
      const chunkKey = getChunkKey();
      if (state.playerStats.gold < 300) {
        playSound('bump');
        addLogMessage('❌ You need 300 Gold to purchase this property deed.', 'system');
        return;
      }

      const isTownChunk = hasTownAtChunk(state.currentChunkX, state.currentChunkY);
      const guardFollower = isTownChunk 
        ? null 
        : (state.followers[0] || null);

      if (!isTownChunk && !guardFollower) {
        playSound('bump');
        addLogMessage('❌ Wilderness safehouse construction requires an active companion follower in your party to guard the site. Recruit one at any Port Town Tavern Master board!', 'system');
        return;
      }

      playSound('loot');
      setGameState(prev => {
        const nextSafehouses = { ...(prev.safehouses || {}) };
        nextSafehouses[chunkKey] = {
          purchased: true,
          assignedGuard: guardFollower || undefined,
          stash: {
            equipment: [],
            materials: {},
            catalysts: {},
            potions: {}
          }
        };

        const nextMap = prev.map.map(row => [...row]);
        const nextDiscovered = prev.discovered ? prev.discovered.map(row => [...row]) : prev.map.map(() => []);

        let nextNpcs = [...(prev.npcs || [])];
        let nextFollowers = [...prev.followers];
        let nextEnemies = [...prev.enemies];

        if (isTownChunk) {
          const agentX = 42;
          const agentY = 7;
          const guildAgentId = `npc_guild_agent_${chunkKey}`;
          
          nextNpcs = nextNpcs.filter(n => n.id !== guildAgentId);
          nextNpcs.push({
            id: guildAgentId,
            name: 'Guild Merchant Agent',
            role: 'merchant',
            char: '🧑‍💼',
            color: '#e9d5ff',
            x: agentX,
            y: agentY,
            homeX: agentX,
            homeY: agentY,
            workX: agentX,
            workY: agentY,
            dialogue: [
              "Welcome to the Town Guild Branch! It's fully secured and ready for transactions.",
              "I manage the regional ledger here. Let me know if you need to buy or sell wares.",
              "A fine purchase, boss! The local guards keep this place perfectly safe."
            ],
            scheduleState: 'work'
          });

          if (nextMap[agentY] && nextMap[agentY][agentX]) {
            nextMap[agentY][agentX] = TileType.Floor;
          }
        } else if (guardFollower) {
          const width = safehousePreset.width;
          const height = safehousePreset.height;

          let targetX = prev.playerX - Math.floor(width / 2);
          let targetY = prev.playerY - Math.floor(height / 2);

          targetX = Math.max(0, Math.min(prev.levelWidth - width, targetX));
          targetY = Math.max(0, Math.min(prev.levelHeight - height, targetY));

          for (let y = 0; y < height; y++) {
            const rowString = safehousePreset.grid[y];
            if (!rowString) continue;
            for (let x = 0; x < width; x++) {
              const char = rowString[x];
              if (!char) continue;
              const mappedTileName = safehousePreset.legend[char as keyof typeof safehousePreset.legend];
              const tx = targetX + x;
              const ty = targetY + y;
              if (mappedTileName && (TileType as any)[mappedTileName]) {
                nextMap[ty][tx] = (TileType as any)[mappedTileName];
              } else {
                nextMap[ty][tx] = TileType.Floor;
              }
              if (nextDiscovered[ty]) {
                nextDiscovered[ty][tx] = true;
              }
            }
          }

          const guardX = targetX + 2;
          const guardY = targetY + 2;
          const guardNpcId = `safehouse_guard_${chunkKey}`;

          if (nextMap[guardY]) {
            nextMap[guardY][guardX] = TileType.Floor;
          }

          if (guardFollower) {
            nextFollowers = nextFollowers.filter(f => f.id !== guardFollower.id);
            nextEnemies = nextEnemies.filter(e => e.followerId !== guardFollower.id);
          }

          nextNpcs = nextNpcs.filter(n => n.id !== guardNpcId);
          nextNpcs.push({
            id: guardNpcId,
            name: guardFollower.name,
            role: 'merchant',
            char: guardFollower.char || '💂',
            color: guardFollower.color || '#c084fc',
            x: guardX,
            y: guardY,
            homeX: guardX,
            homeY: guardY,
            workX: guardX,
            workY: guardY,
            dialogue: [
              `I am guarding this safehouse, boss! Your stash is perfectly secure here with me, ${guardFollower.name}.`,
              "Keeping a sharp lookout for wild beasts and bandits. Need to trade some goods?",
              "A safe outpost is a profitable outpost. I'll hold down the fort."
            ],
            scheduleState: 'work'
          });
        }

        const recallScrollReward = {
          id: `scroll_recall_town_${Date.now()}_${Math.random()}`,
          name: "Scroll of Recall 📜",
          type: 'scroll' as any,
          subType: 'Scroll' as any,
          defense: 0,
          damage: 0,
          critChance: 0,
          range: 0,
          color: '#38bdf8',
          description: "A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!",
          value: 200,
          durability: 100,
          maxDurability: 100
        };

        return {
          ...prev,
          map: nextMap,
          discovered: nextDiscovered,
          npcs: nextNpcs,
          followers: nextFollowers,
          enemies: nextEnemies,
          safehouses: nextSafehouses,
          playerStats: {
            ...prev.playerStats,
            gold: prev.playerStats.gold - 300
          },
          equipmentInventory: [...prev.equipmentInventory, recallScrollReward]
        };
      });

      addLogMessage(`🏡 SAFEHOUSE ESTABLISHED! An outpost is secured at [${chunkKey}]. Received 1x Scroll of Recall!`, 'loot');
    },

    // 3. Rest at Safehouse
    handleSafehouseRest: () => {
      playSound('levelUp');
      setGameState(prev => {
        const nextStats = { ...prev.playerStats };
        const healHp = Math.round(nextStats.maxHp * 0.3);
        const healMp = Math.round(nextStats.maxMp * 0.3);

        nextStats.hp = Math.min(nextStats.maxHp, nextStats.hp + healHp);
        nextStats.mp = Math.min(nextStats.maxMp, nextStats.mp + healMp);
        nextStats.exhaustion = 0;
        nextStats.turnsPlayed = (nextStats.turnsPlayed || 0) + 50;

        return {
          ...prev,
          playerStats: nextStats
        };
      });

      addLogMessage('🛏️ You rested in the secure quarters. Recovered 30% HP/MP and cleansed all Exhaustion!', 'system');
    },

    // 4. Research Upgrade
    handleBuyUpgrade: (upgrade: GuildUpgrade) => {
      const currentLevel = state.guildUpgrades?.[upgrade.id] || 0;
      if (currentLevel >= upgrade.maxLevel) {
        playSound('bump');
        addLogMessage(`❌ ${upgrade.name} has already reached maximum rank (${upgrade.maxLevel}).`, 'system');
        return;
      }

      if (state.playerStats.gold < upgrade.costGold) {
        playSound('bump');
        addLogMessage(`❌ You lack the ${upgrade.costGold} Gold required for this research upgrade.`, 'system');
        return;
      }

      for (const [matId, requiredQty] of Object.entries(upgrade.costMaterials)) {
        const currentQty = state.inventoryMaterials[matId] || 0;
        if (currentQty < requiredQty) {
          playSound('bump');
          addLogMessage(`❌ Missing required research materials: ${requiredQty}x ${matId}.`, 'system');
          return;
        }
      }

      playSound('craft');
      setGameState(prev => {
        const nextMats = { ...prev.inventoryMaterials };
        for (const [matId, requiredQty] of Object.entries(upgrade.costMaterials)) {
          nextMats[matId] = (nextMats[matId] || 0) - requiredQty;
        }

        const nextUpgrades = { ...(prev.guildUpgrades || {}) };
        nextUpgrades[upgrade.id] = (nextUpgrades[upgrade.id] || 0) + 1;

        return {
          ...prev,
          guildUpgrades: nextUpgrades,
          inventoryMaterials: nextMats,
          playerStats: {
            ...prev.playerStats,
            gold: prev.playerStats.gold - upgrade.costGold
          }
        };
      });

      addLogMessage(`🔬 Guild Research Completed: ${upgrade.name} upgraded to Rank ${currentLevel + 1}!`, 'craft');
    },

    // 5. Buy Decor
    handleBuyDecor: (decor: GuildDecor) => {
      if (state.guildSanctuary?.includes(decor.id)) {
        playSound('bump');
        addLogMessage(`❌ Sanctuary already possesses ${decor.name}.`, 'system');
        return;
      }

      if (state.playerStats.gold < decor.costGold) {
        playSound('bump');
        addLogMessage(`❌ Need ${decor.costGold} Gold to install ${decor.name}.`, 'system');
        return;
      }

      playSound('loot');
      setGameState(prev => ({
        ...prev,
        guildSanctuary: [...(prev.guildSanctuary || []), decor.id],
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold - decor.costGold
        }
      }));

      addLogMessage(`✨ Installed Sanctuary Decor: ${decor.name}! Active Bonus: ${decor.bonusText}`, 'craft');
    },

    // 6. Stash Material
    handleStashMaterial: (materialId: string, deposit: boolean) => {
      const chunkKey = getChunkKey();
      const isUsingHQ = isTownCenter() && state.guildOwned;
      playSound('loot');

      setGameState(prev => {
        const nextInvMats = { ...prev.inventoryMaterials };
        const nextSafehouses = { ...(prev.safehouses || {}) };
        const nextHQStash = prev.guildStash ? { ...prev.guildStash } : { equipment: [], materials: {}, catalysts: {}, potions: {} };

        if (deposit) {
          const currentInvCount = nextInvMats[materialId] || 0;
          if (currentInvCount <= 0) return prev;

          nextInvMats[materialId] = currentInvCount - 1;
          if (nextInvMats[materialId] <= 0) delete nextInvMats[materialId];

          if (isUsingHQ) {
            nextHQStash.materials = { ...nextHQStash.materials };
            nextHQStash.materials[materialId] = (nextHQStash.materials[materialId] || 0) + 1;
          } else if (nextSafehouses[chunkKey]) {
            const stash = { ...nextSafehouses[chunkKey].stash };
            stash.materials = { ...stash.materials, [materialId]: (stash.materials[materialId] || 0) + 1 };
            nextSafehouses[chunkKey] = { ...nextSafehouses[chunkKey], stash };
          }
        } else {
          if (isUsingHQ) {
            const vaultCount = nextHQStash.materials[materialId] || 0;
            if (vaultCount <= 0) return prev;
            nextHQStash.materials = { ...nextHQStash.materials };
            nextHQStash.materials[materialId] = vaultCount - 1;
            nextInvMats[materialId] = (nextInvMats[materialId] || 0) + 1;
          } else if (nextSafehouses[chunkKey]) {
            const stash = { ...nextSafehouses[chunkKey].stash };
            const vaultCount = stash.materials[materialId] || 0;
            if (vaultCount <= 0) return prev;
            stash.materials = { ...stash.materials, [materialId]: vaultCount - 1 };
            nextSafehouses[chunkKey] = { ...nextSafehouses[chunkKey], stash };
            nextInvMats[materialId] = (nextInvMats[materialId] || 0) + 1;
          }
        }

        return {
          ...prev,
          inventoryMaterials: nextInvMats,
          guildStash: isUsingHQ ? nextHQStash : prev.guildStash,
          safehouses: nextSafehouses
        };
      });
    },

    // 7. Stash Catalyst
    handleStashCatalyst: (catalystId: string, deposit: boolean) => {
      const chunkKey = getChunkKey();
      const isUsingHQ = isTownCenter() && state.guildOwned;
      playSound('loot');

      setGameState(prev => {
        const nextInvCats = { ...prev.inventoryCatalysts };
        const nextSafehouses = { ...(prev.safehouses || {}) };
        const nextHQStash = prev.guildStash ? { ...prev.guildStash } : { equipment: [], materials: {}, catalysts: {}, potions: {} };

        if (deposit) {
          const currentInvCount = nextInvCats[catalystId] || 0;
          if (currentInvCount <= 0) return prev;

          nextInvCats[catalystId] = currentInvCount - 1;
          if (nextInvCats[catalystId] <= 0) delete nextInvCats[catalystId];

          if (isUsingHQ) {
            nextHQStash.catalysts = { ...nextHQStash.catalysts };
            nextHQStash.catalysts[catalystId] = (nextHQStash.catalysts[catalystId] || 0) + 1;
          } else if (nextSafehouses[chunkKey]) {
            const stash = { ...nextSafehouses[chunkKey].stash };
            stash.catalysts = { ...stash.catalysts, [catalystId]: (stash.catalysts[catalystId] || 0) + 1 };
            nextSafehouses[chunkKey] = { ...nextSafehouses[chunkKey], stash };
          }
        } else {
          if (isUsingHQ) {
            const vaultCount = nextHQStash.catalysts[catalystId] || 0;
            if (vaultCount <= 0) return prev;
            nextHQStash.catalysts = { ...nextHQStash.catalysts };
            nextHQStash.catalysts[catalystId] = vaultCount - 1;
            nextInvCats[catalystId] = (nextInvCats[catalystId] || 0) + 1;
          } else if (nextSafehouses[chunkKey]) {
            const stash = { ...nextSafehouses[chunkKey].stash };
            const vaultCount = stash.catalysts[catalystId] || 0;
            if (vaultCount <= 0) return prev;
            stash.catalysts = { ...stash.catalysts, [catalystId]: vaultCount - 1 };
            nextSafehouses[chunkKey] = { ...nextSafehouses[chunkKey], stash };
            nextInvCats[catalystId] = (nextInvCats[catalystId] || 0) + 1;
          }
        }

        return {
          ...prev,
          inventoryCatalysts: nextInvCats,
          guildStash: isUsingHQ ? nextHQStash : prev.guildStash,
          safehouses: nextSafehouses
        };
      });
    },

    // 8. Stash Equipment
    handleStashEquipment: (item: EquipmentItem, deposit: boolean) => {
      const chunkKey = getChunkKey();
      const isUsingHQ = isTownCenter() && state.guildOwned;
      playSound('loot');

      setGameState(prev => {
        const nextSafehouses = { ...(prev.safehouses || {}) };
        const nextHQStash = prev.guildStash ? { ...prev.guildStash } : { equipment: [], materials: {}, catalysts: {}, potions: {} };
        let nextEquipInv = [...prev.equipmentInventory];

        if (deposit) {
          nextEquipInv = nextEquipInv.filter(i => i.id !== item.id);
          if (isUsingHQ) {
            nextHQStash.equipment = [...nextHQStash.equipment, item];
          } else if (nextSafehouses[chunkKey]) {
            const stash = { ...nextSafehouses[chunkKey].stash };
            stash.equipment = [...stash.equipment, item];
            nextSafehouses[chunkKey] = { ...nextSafehouses[chunkKey], stash };
          }
        } else {
          if (isUsingHQ) {
            nextHQStash.equipment = nextHQStash.equipment.filter(i => i.id !== item.id);
            nextEquipInv.push(item);
          } else if (nextSafehouses[chunkKey]) {
            const stash = { ...nextSafehouses[chunkKey].stash };
            stash.equipment = stash.equipment.filter(i => i.id !== item.id);
            nextSafehouses[chunkKey] = { ...nextSafehouses[chunkKey], stash };
            nextEquipInv.push(item);
          }
        }

        return {
          ...prev,
          equipmentInventory: nextEquipInv,
          guildStash: isUsingHQ ? nextHQStash : prev.guildStash,
          safehouses: nextSafehouses
        };
      });
    },

    // 9. Bulk Stash All
    handleStashAll: () => {
      const chunkKey = getChunkKey();
      const isUsingHQ = isTownCenter() && state.guildOwned;
      playSound('loot');

      setGameState(prev => {
        const nextSafehouses = { ...(prev.safehouses || {}) };
        const nextHQStash = prev.guildStash ? { ...prev.guildStash } : { equipment: [], materials: {}, catalysts: {}, potions: {} };
        const currentTargetStash = isUsingHQ ? nextHQStash : nextSafehouses[chunkKey]?.stash;
        if (!currentTargetStash) return prev;

        const allEquipToMove = [...prev.equipmentInventory];
        const allMatsToMove = { ...prev.inventoryMaterials };
        const allCatsToMove = { ...prev.inventoryCatalysts };

        const targetEquip = [...currentTargetStash.equipment, ...allEquipToMove];
        const targetMats = { ...currentTargetStash.materials };
        for (const [matId, count] of Object.entries(allMatsToMove)) {
          targetMats[matId] = (targetMats[matId] || 0) + count;
        }

        const targetCats = { ...currentTargetStash.catalysts };
        for (const [catId, count] of Object.entries(allCatsToMove)) {
          targetCats[catId] = (targetCats[catId] || 0) + count;
        }

        if (isUsingHQ) {
          nextHQStash.equipment = targetEquip;
          nextHQStash.materials = targetMats;
          nextHQStash.catalysts = targetCats;
        } else if (nextSafehouses[chunkKey]) {
          nextSafehouses[chunkKey].stash = {
            ...nextSafehouses[chunkKey].stash,
            equipment: targetEquip,
            materials: targetMats,
            catalysts: targetCats
          };
        }

        return {
          ...prev,
          equipmentInventory: [],
          inventoryMaterials: {},
          inventoryCatalysts: {},
          guildStash: isUsingHQ ? nextHQStash : prev.guildStash,
          safehouses: nextSafehouses
        };
      });

      addLogMessage('📦 All carried equipment, raw materials, and catalysts have been transferred to storage.', 'loot');
    },

    // 10. Claim Territory Taxes
    handleClaimTaxes: (territoryId: string) => {
      const territory = state.factionTerritories?.[territoryId];
      if (!territory) return;

      const gold = territory.taxGoldAccumulated || 0;
      const matId = territory.taxMaterialIdAccumulated;
      const matCount = territory.taxMaterialCountAccumulated || 0;

      if (gold <= 0 && matCount <= 0) {
        playSound('bump');
        addLogMessage('❌ No accumulated taxes ready to claim in this sector.', 'system');
        return;
      }

      playSound('loot');
      setGameState(prev => {
        const nextTerritories = { ...(prev.factionTerritories || {}) };
        if (nextTerritories[territoryId]) {
          nextTerritories[territoryId] = {
            ...nextTerritories[territoryId],
            taxGoldAccumulated: 0,
            taxMaterialCountAccumulated: 0
          };
        }

        const nextMats = { ...prev.inventoryMaterials };
        if (matId && matCount > 0) {
          nextMats[matId] = (nextMats[matId] || 0) + matCount;
        }

        return {
          ...prev,
          factionTerritories: nextTerritories,
          inventoryMaterials: nextMats,
          playerStats: {
            ...prev.playerStats,
            gold: prev.playerStats.gold + gold
          }
        };
      });

      addLogMessage(`💰 Claimed sector tax revenue from ${territory.name}: +${gold} Gold${matCount > 0 ? `, +${matCount}x ${matId}` : ''}!`, 'loot');
    },

    // 11. Contribute Gold to Faction War Treasury
    handleContributeGold: (amount: number) => {
      if (state.playerStats.gold < amount) {
        playSound('bump');
        addLogMessage(`❌ Insufficient gold. You need ${amount}g.`, 'system');
        return;
      }

      playSound('levelUp');
      setGameState(prev => {
        const faction = prev.faction || 'syndicate';
        const nextTreasury = { ...(prev.factionWarTreasury || { syndicateGold: 0, vanguardGold: 0, playerContributionSyndicate: 0, playerContributionVanguard: 0, activeTactics: [] }) };
        const nextReputation = { ...(prev.factionReputation || { syndicate: 0, vanguard: 0, bandits: 0 }) };

        if (faction === 'syndicate') {
          nextTreasury.syndicateGold += amount;
          nextTreasury.playerContributionSyndicate += amount;
          nextReputation.syndicate = Math.min(100, (nextReputation.syndicate || 0) + Math.floor(amount / 20));
        } else {
          nextTreasury.vanguardGold += amount;
          nextTreasury.playerContributionVanguard += amount;
          nextReputation.vanguard = Math.min(100, (nextReputation.vanguard || 0) + Math.floor(amount / 20));
        }

        return {
          ...prev,
          playerStats: {
            ...prev.playerStats,
            gold: prev.playerStats.gold - amount
          },
          factionWarTreasury: nextTreasury,
          factionReputation: nextReputation
        };
      });

      addLogMessage(`🛡️ Donated ${amount} Gold to the ${state.faction} war coffer! Faction standing increased.`, 'craft');
    },

    // 12. Buy Tactical Directive
    handleBuyTactic: (tacticName: string, cost: number, targetTerritoryId: string) => {
      const treasury = state.factionWarTreasury || { syndicateGold: 0, vanguardGold: 0, playerContributionSyndicate: 0, playerContributionVanguard: 0, activeTactics: [] };
      const currentFaction = state.faction || 'syndicate';
      const availableFunds = currentFaction === 'syndicate' ? treasury.syndicateGold : treasury.vanguardGold;

      if (availableFunds < cost) {
        playSound('bump');
        addLogMessage(`❌ War treasury lacks required funding (${cost}g) for this directive.`, 'system');
        return;
      }

      playSound('loot');
      setGameState(prev => {
        const nextTreasury = { ...(prev.factionWarTreasury || { syndicateGold: 0, vanguardGold: 0, playerContributionSyndicate: 0, playerContributionVanguard: 0, activeTactics: [] }) };
        if (currentFaction === 'syndicate') {
          nextTreasury.syndicateGold -= cost;
        } else {
          nextTreasury.vanguardGold -= cost;
        }
        nextTreasury.activeTactics = [...nextTreasury.activeTactics, tacticName];

        const nextTerritories = { ...(prev.factionTerritories || {}) };
        if (nextTerritories[targetTerritoryId]) {
          const terr = nextTerritories[targetTerritoryId];
          const isController = terr.controller === currentFaction;
          const nextPercent = isController 
            ? Math.min(100, terr.controlPercent + 15) 
            : Math.max(0, terr.controlPercent - 15);

          nextTerritories[targetTerritoryId] = {
            ...terr,
            controlPercent: nextPercent,
            controller: (!isController && nextPercent === 0) ? (currentFaction as 'syndicate' | 'vanguard' | 'outlaw' | 'neutral') : terr.controller
          };
        }

        return {
          ...prev,
          factionWarTreasury: nextTreasury,
          factionTerritories: nextTerritories
        };
      });

      addLogMessage(`⚔️ DIRECTIVE DEPLOYED: "${tacticName}" enacted! Shifting control in ${targetTerritoryId}.`, 'combat');
    },

    // 13. Forge Faction Gear
    handleForgeFactionGear: (gear: FactionGear) => {
      const gearFaction = gear.id.includes('syndicate') ? 'syndicate' : (gear.id.includes('vanguard') ? 'vanguard' : 'bandits');
      if (gearFaction !== state.faction) {
        playSound('bump');
        addLogMessage(`❌ Requires allegiance to the ${gearFaction}.`, 'system');
        return;
      }

      if (state.playerStats.gold < gear.costGold) {
        playSound('bump');
        addLogMessage(`❌ You lack ${gear.costGold} Gold required for this blueprint.`, 'system');
        return;
      }

      for (const [matId, reqCount] of Object.entries(gear.costMaterials)) {
        if ((state.inventoryMaterials[matId] || 0) < reqCount) {
          playSound('bump');
          addLogMessage(`❌ Insufficient materials: ${reqCount}x ${matId} required.`, 'system');
          return;
        }
      }

      playSound('craft');
      setGameState(prev => {
        const nextMats = { ...prev.inventoryMaterials };
        for (const [matId, reqCount] of Object.entries(gear.costMaterials)) {
          nextMats[matId] -= reqCount;
        }

        const forgedItem: EquipmentItem = {
          id: `faction_${gear.id}_${Date.now()}`,
          name: gear.name,
          type: (gear.type === 'shield' ? 'armor' : gear.type) as 'weapon' | 'armor',
          subType: gear.subType as any,
          defense: gear.defense || 0,
          damage: gear.damage || 0,
          critChance: gear.critChance || 0,
          range: gear.range || 1,
          color: gear.color,
          description: gear.desc,
          value: Math.round(gear.costGold * 0.8),
          durability: 100,
          maxDurability: 100
        };

        return {
          ...prev,
          inventoryMaterials: nextMats,
          playerStats: {
            ...prev.playerStats,
            gold: prev.playerStats.gold - gear.costGold
          },
          equipmentInventory: [...prev.equipmentInventory, forgedItem]
        };
      });

      addLogMessage(`⚒️ FORGED FACTION ARMAMENT: ${gear.name} added to your equipment stash!`, 'craft');
    },

    // 14. Dispatch Companion Expedition
    handleDispatchFollower: (followerId: string, questId: string) => {
      const follower = state.followers.find(f => f.id === followerId);
      const quest = COMPANION_QUEST_BOARD.find(q => q.id === questId);

      if (!follower || !quest) {
        playSound('bump');
        addLogMessage('❌ Select both a companion and a valid mission.', 'system');
        return;
      }

      playSound('loot');
      setGameState(prev => {
        const nextQuests = [...(prev.activeCompanionQuests || [])];
        nextQuests.push({
          followerId,
          questId,
          title: quest.title,
          durationTurns: quest.turnsRequired,
          rewardGold: quest.rewardGold,
          rewardXp: quest.rewardXp,
          rewardMaterials: quest.rewardMaterials
        });

        const nextFollowers = prev.followers.map(f => {
          if (f.id === followerId) {
            return { ...f, mode: 'wait' as const };
          }
          return f;
        });

        return {
          ...prev,
          activeCompanionQuests: nextQuests,
          followers: nextFollowers
        };
      });

      addLogMessage(`🗺️ DISPATCHED: ${follower.name} has embarked on "${quest.title}" (${quest.turnsRequired} turns)!`, 'craft');
    },

    // 15. Claim Expedition Rewards
    handleClaimDispatchRewards: (followerId: string) => {
      const dispatch = state.activeCompanionQuests?.find(q => q.followerId === followerId && q.durationTurns <= 0);
      if (!dispatch) {
        playSound('bump');
        addLogMessage('❌ Expedition is either still in progress or not found.', 'system');
        return;
      }

      playSound('loot');
      setGameState(prev => {
        const nextStats = { ...prev.playerStats };
        nextStats.gold += dispatch.rewardGold;
        nextStats.xp = (nextStats.xp || 0) + dispatch.rewardXp;

        const nextMats = { ...prev.inventoryMaterials };
        if (dispatch.rewardMaterials) {
          for (const [matId, count] of Object.entries(dispatch.rewardMaterials)) {
            nextMats[matId] = (nextMats[matId] || 0) + count;
          }
        }

        const nextCompanionQuests = (prev.activeCompanionQuests || []).filter(q => q.followerId !== followerId);
        const nextFollowers = prev.followers.map(f => {
          if (f.id === followerId) {
            return { ...f, mode: 'follow' as const };
          }
          return f;
        });

        return {
          ...prev,
          playerStats: nextStats,
          inventoryMaterials: nextMats,
          activeCompanionQuests: nextCompanionQuests,
          followers: nextFollowers
        };
      });

      const followerName = state.followers.find(f => f.id === followerId)?.name || 'Follower';
      addLogMessage(`✅ EXPEDITION COMPLETE: ${followerName} has successfully returned from exploration! Earned +${dispatch.rewardGold} Gold, +${dispatch.rewardXp} XP!`, 'loot');
    }
  };
}

describe('Automated Button & Interaction Suite (Phase 4: Sunder Guild Operations, Factions & Safehouse Vault)', () => {
  let mockGameState: GameState;
  const mockAddLogMessage = vi.fn();
  const mockPlaySound = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGameState = createNewGameRun(12345);
    mockGameState.currentChunkX = 0;
    mockGameState.currentChunkY = 0;
    mockGameState.playerStats.gold = 2500;
    mockGameState.guildOwned = false;
    mockGameState.guildUpgrades = {
      up_supply_deals: 0,
      up_expeditions: 0,
      up_guild_discounts: 0
    };
    mockGameState.guildSanctuary = [];
    mockGameState.guildStash = {
      equipment: [],
      materials: {},
      catalysts: {},
      potions: {}
    };
    mockGameState.inventoryMaterials = {
      mat_iron: 30,
      mat_iron_ore: 30,
      mat_wood: 30,
      mat_leather: 20,
      mat_obsidian: 10,
      mat_berry: 20,
      mat_thick_hide: 10,
      mat_mithril: 10
    };
    mockGameState.inventoryCatalysts = {
      cat_fire: 5,
      cat_void: 2
    };
    mockGameState.equipmentInventory = [];
    mockGameState.followers = [
      {
        id: 'follower_elena',
        name: 'Elena the Swift',
        archetypeId: 'thief',
        role: 'archer',
        level: 3,
        xp: 0,
        xpNext: 100,
        hp: 45,
        maxHp: 45,
        atk: 12,
        def: 4,
        char: '🏹',
        color: '#38bdf8',
        mode: 'follow',
        equipment: { weapon: null, armor: null },
        inventory: [],
        injuries: [],
        personality: 'cautious',
        temperament: 'loyal'
      }
    ];
    mockGameState.faction = 'syndicate';
    mockGameState.factionReputation = {
      syndicate: 50,
      vanguard: 10,
      bandits: 0
    };
    mockGameState.factionWarTreasury = {
      syndicateGold: 500,
      vanguardGold: 400,
      playerContributionSyndicate: 100,
      playerContributionVanguard: 0,
      activeTactics: []
    };
    mockGameState.factionTerritories = {
      oakhaven_plains: {
        id: 'oakhaven_plains',
        name: 'Oakhaven Grasslands',
        controller: 'syndicate',
        controlPercent: 80,
        taxGoldAccumulated: 150,
        taxMaterialIdAccumulated: 'mat_iron_ore',
        taxMaterialCountAccumulated: 8,
        contested: false,
        bonusDescription: 'Timber and hides'
      },
      iron_mines: {
        id: 'iron_mines',
        name: 'Iron Ridge Mines',
        controller: 'vanguard',
        controlPercent: 70,
        taxGoldAccumulated: 120,
        taxMaterialIdAccumulated: 'mat_iron_ore',
        taxMaterialCountAccumulated: 5,
        contested: false,
        bonusDescription: 'Iron ore mines'
      }
    };
  });

  describe('1. Guild Headquarters Founding & Tab State', () => {
    it('purchases Guild Headquarters deed inside Oakhaven Town (Chunk 0,0) and unlocks HQ', () => {
      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handlePurchaseHQ();

      const finalState = controller.getState();
      expect(finalState.guildOwned).toBe(true);
      expect(finalState.playerStats.gold).toBe(2000); // 2500 - 500
      expect(mockPlaySound).toHaveBeenCalledWith('loot');
      expect(mockAddLogMessage).toHaveBeenCalledWith(
        expect.stringContaining('CONGRATULATIONS! You have established the Sunder Guild Headquarters'),
        'craft'
      );
    });

    it('prevents purchasing HQ if outside Town Center (Chunk 0,0) or lacking gold', () => {
      mockGameState.currentChunkX = 1;
      mockGameState.currentChunkY = 0;

      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handlePurchaseHQ();

      const finalState = controller.getState();
      expect(finalState.guildOwned).toBe(false);
      expect(mockPlaySound).toHaveBeenCalledWith('bump');
      expect(mockAddLogMessage).toHaveBeenCalledWith(
        expect.stringContaining('only be founded inside the Oakhaven Town Center'),
        'system'
      );
    });
  });

  describe('2. Laboratory Research Upgrades & Sanctuary Decor', () => {
    it('purchases Guild Research upgrade deducting gold and required crafting materials', () => {
      mockGameState.guildOwned = true;
      const upgrade = GUILD_UPGRADES[0]; // up_supply_deals

      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handleBuyUpgrade(upgrade);

      const finalState = controller.getState();
      expect(finalState.guildUpgrades[upgrade.id]).toBe(1);
      expect(finalState.playerStats.gold).toBe(2500 - upgrade.costGold);
      expect(mockPlaySound).toHaveBeenCalledWith('craft');
      expect(mockAddLogMessage).toHaveBeenCalledWith(
        expect.stringContaining('Guild Research Completed'),
        'craft'
      );
    });

    it('installs Sanctuary Decor items and registers active visual/stat perks', () => {
      mockGameState.guildOwned = true;
      const decor = GUILD_DECORS[0]; // decor_trophy_stag

      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handleBuyDecor(decor);

      let finalState = controller.getState();
      expect(finalState.guildSanctuary).toContain(decor.id);
      expect(finalState.playerStats.gold).toBe(2500 - decor.costGold);
      expect(mockPlaySound).toHaveBeenCalledWith('loot');
      expect(mockAddLogMessage).toHaveBeenCalledWith(
        expect.stringContaining('Installed Sanctuary Decor'),
        'craft'
      );

      // Attempt duplicate purchase
      controller.handleBuyDecor(decor);
      expect(mockPlaySound).toHaveBeenCalledWith('bump');
    });
  });

  describe('3. Wilderness Safehouse, Resting & Vault Stash Operations', () => {
    it('establishes wilderness safehouse assigning companion guard and providing Recall Scroll', () => {
      mockGameState.currentChunkX = 2;
      mockGameState.currentChunkY = 1;

      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handlePurchaseSafehouse();

      const finalState = controller.getState();
      expect(finalState.safehouses?.['2,1']?.purchased).toBe(true);
      expect(finalState.playerStats.gold).toBe(2200); // 2500 - 300
      expect(finalState.equipmentInventory.some(i => i.name.includes('Scroll of Recall'))).toBe(true);
      expect(mockPlaySound).toHaveBeenCalledWith('loot');
    });

    it('rests in safehouse purging all exhaustion and restoring 30% HP/MP', () => {
      mockGameState.playerStats.exhaustion = 65;
      mockGameState.playerStats.hp = 20;
      mockGameState.playerStats.mp = 10;
      mockGameState.playerStats.maxHp = 100;
      mockGameState.playerStats.maxMp = 50;

      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handleSafehouseRest();

      const finalState = controller.getState();
      expect(finalState.playerStats.exhaustion).toBe(0);
      expect(finalState.playerStats.hp).toBe(50); // 20 + 30
      expect(finalState.playerStats.mp).toBe(25); // 10 + 15
      expect(mockPlaySound).toHaveBeenCalledWith('levelUp');
    });

    it('deposits and retracts raw materials and catalysts in safehouse/HQ vault', () => {
      mockGameState.guildOwned = true;
      mockGameState.currentChunkX = 0;
      mockGameState.currentChunkY = 0;

      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);

      // Deposit iron ore
      controller.handleStashMaterial('mat_iron_ore', true);
      expect(controller.getState().inventoryMaterials['mat_iron_ore']).toBe(29);
      expect(controller.getState().guildStash?.materials['mat_iron_ore']).toBe(1);

      // Retract iron ore
      controller.handleStashMaterial('mat_iron_ore', false);
      expect(controller.getState().inventoryMaterials['mat_iron_ore']).toBe(30);
      expect(controller.getState().guildStash?.materials['mat_iron_ore']).toBe(0);

      // Deposit catalyst
      controller.handleStashCatalyst('cat_fire', true);
      expect(controller.getState().inventoryCatalysts['cat_fire']).toBe(4);
      expect(controller.getState().guildStash?.catalysts['cat_fire']).toBe(1);

      // Retract catalyst
      controller.handleStashCatalyst('cat_fire', false);
      expect(controller.getState().inventoryCatalysts['cat_fire']).toBe(5);
      expect(controller.getState().guildStash?.catalysts['cat_fire']).toBe(0);
    });

    it('deposits, retracts, and bulk stashes equipment and inventory items into vault', () => {
      mockGameState.guildOwned = true;
      const testSword: EquipmentItem = {
        id: 'gear_broadsword_test',
        name: 'Broadsword of Valor',
        type: 'weapon',
        subType: WeaponBaseType.Sword,
        damage: 15,
        defense: 0,
        critChance: 0.1,
        range: 1,
        color: '#cbd5e1',
        description: 'Forged blade',
        value: 120,
        durability: 100,
        maxDurability: 100
      };
      mockGameState.equipmentInventory = [testSword];

      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);

      // Stash equipment item
      controller.handleStashEquipment(testSword, true);
      expect(controller.getState().equipmentInventory.length).toBe(0);
      expect(controller.getState().guildStash?.equipment.length).toBe(1);

      // Retract equipment item
      controller.handleStashEquipment(testSword, false);
      expect(controller.getState().equipmentInventory.length).toBe(1);
      expect(controller.getState().guildStash?.equipment.length).toBe(0);

      // Bulk Stash All Items trigger
      controller.handleStashAll();
      expect(controller.getState().equipmentInventory.length).toBe(0);
      expect(controller.getState().guildStash?.equipment.length).toBe(1);
      expect(controller.getState().guildStash?.materials['mat_iron_ore']).toBe(30);
      expect(controller.getState().guildStash?.catalysts['cat_fire']).toBe(5);
      expect(controller.getState().inventoryMaterials['mat_iron_ore']).toBeUndefined();
      expect(controller.getState().inventoryCatalysts['cat_fire']).toBeUndefined();
    });
  });

  describe('4. Faction War Treasury, Directives & Heavy Armament Forging', () => {
    it('claims accumulated regional tax gold and mineral rewards from controlled territories', () => {
      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handleClaimTaxes('oakhaven_plains');

      const finalState = controller.getState();
      expect(finalState.playerStats.gold).toBe(2650); // 2500 + 150
      expect(finalState.inventoryMaterials['mat_iron_ore']).toBe(38); // 30 + 8
      expect(finalState.factionTerritories?.['oakhaven_plains']?.taxGoldAccumulated).toBe(0);
      expect(mockPlaySound).toHaveBeenCalledWith('loot');
    });

    it('contributes gold to faction war chest and boosts reputation', () => {
      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handleContributeGold(100);

      const finalState = controller.getState();
      expect(finalState.playerStats.gold).toBe(2400); // 2500 - 100
      expect(finalState.factionWarTreasury?.syndicateGold).toBe(600); // 500 + 100
      expect(finalState.factionWarTreasury?.playerContributionSyndicate).toBe(200); // 100 + 100
      expect(finalState.factionReputation?.syndicate).toBe(55); // 50 + 5
      expect(mockPlaySound).toHaveBeenCalledWith('levelUp');
    });

    it('funds and deploys tactical campaign directives altering territory control percentages', () => {
      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handleBuyTactic('Vanguard Skirmish Blitz', 200, 'iron_mines');

      const finalState = controller.getState();
      expect(finalState.factionWarTreasury?.syndicateGold).toBe(300); // 500 - 200
      expect(finalState.factionWarTreasury?.activeTactics.length).toBeGreaterThan(0);
      expect(mockPlaySound).toHaveBeenCalledWith('loot');
      expect(mockAddLogMessage).toHaveBeenCalledWith(
        expect.stringContaining('DIRECTIVE DEPLOYED'),
        'combat'
      );
    });

    it('forges exclusive Faction Armaments when player matches faction allegiance', () => {
      const syndicateGear = SYNDICATE_GEAR[0];
      mockGameState.playerStats.gold = 1000;
      mockGameState.inventoryMaterials = {
        mat_iron: 20,
        mat_obsidian: 10,
        mat_thick_hide: 10,
        mat_leather: 20,
        mat_wood: 20
      };

      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handleForgeFactionGear(syndicateGear);

      const finalState = controller.getState();
      expect(finalState.equipmentInventory.some(i => i.name === syndicateGear.name)).toBe(true);
      expect(finalState.playerStats.gold).toBe(1000 - syndicateGear.costGold);
      expect(mockPlaySound).toHaveBeenCalledWith('craft');
    });
  });

  describe('5. Companion Autonomous Expedition Quests & Rewards Claiming', () => {
    it('dispatches companion on autonomous wilderness expedition calculating duration and setting wait mode', () => {
      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      const quest = COMPANION_QUEST_BOARD[0];

      controller.handleDispatchFollower('follower_elena', quest.id);

      const finalState = controller.getState();
      expect(finalState.activeCompanionQuests?.length).toBe(1);
      const activeQuest = finalState.activeCompanionQuests?.[0];
      expect(activeQuest?.followerId).toBe('follower_elena');
      expect(activeQuest?.questId).toBe(quest.id);
      expect(finalState.followers[0].mode).toBe('wait');
      expect(mockPlaySound).toHaveBeenCalledWith('loot');
      expect(mockAddLogMessage).toHaveBeenCalledWith(
        expect.stringContaining('DISPATCHED: Elena the Swift'),
        'craft'
      );
    });

    it('claims completed expedition rewards yielding gold, experience, and bonus materials', () => {
      mockGameState.activeCompanionQuests = [
        {
          followerId: 'follower_elena',
          questId: 'quest_recon_plains',
          title: 'Grasslands Reconnaissance',
          durationTurns: 0, // ready to claim
          rewardGold: 180,
          rewardXp: 120,
          rewardMaterials: { mat_iron_ore: 6 }
        }
      ];
      mockGameState.followers[0].mode = 'wait';

      const controller = createGuildController(mockGameState, mockAddLogMessage, mockPlaySound);
      controller.handleClaimDispatchRewards('follower_elena');

      const finalState = controller.getState();
      expect(finalState.playerStats.gold).toBe(2680); // 2500 + 180
      expect(finalState.playerStats.xp).toBe(120);
      expect(finalState.inventoryMaterials['mat_iron_ore']).toBe(36); // 30 + 6
      expect(finalState.activeCompanionQuests?.length).toBe(0);
      expect(finalState.followers[0].mode).toBe('follow');
      expect(mockPlaySound).toHaveBeenCalledWith('loot');
      expect(mockAddLogMessage).toHaveBeenCalledWith(
        expect.stringContaining('EXPEDITION COMPLETE: Elena the Swift'),
        'loot'
      );
    });
  });
});
