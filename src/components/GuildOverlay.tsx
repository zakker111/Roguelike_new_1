import React, { useState } from 'react';
import { GameState, EquipmentItem, Follower, TileType } from '../types';
import safehousePreset from '../data/safehouse.json';
import { hasTownAtChunk } from '../utils/overworld';
import { 
  GUILD_UPGRADES, 
  GUILD_DECORS, 
  COMPANION_QUEST_BOARD, 
  SYNDICATE_GEAR, 
  VANGUARD_GEAR,
  BANDIT_GEAR,
  getBiomePriceMultiplier,
  GuildUpgrade,
  GuildDecor,
  CompanionQuest,
  FactionGear
} from '../utils/tradeEconomy';
import { Coins, Shield, Swords, Sparkles, Plus, Minus, Check, Lock, ChevronRight, Package, RefreshCw, UserCheck } from 'lucide-react';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../utils/itemsData';
import { GuildTreasuryPanel } from './guild/GuildTreasuryPanel';
import { GuildMissionBoard } from './guild/GuildMissionBoard';
import { GuildStashPanel } from './guild/GuildStashPanel';

interface GuildOverlayProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type: 'system' | 'combat' | 'loot' | 'danger' | 'craft') => void;
  playSound: (soundName: string) => void;
}

export default function GuildOverlay({ gameState, setGameState, addLogMessage, playSound }: GuildOverlayProps) {
  const [activeSubTab, setActiveSubTab] = useState<'hq' | 'sanctuary' | 'stash' | 'factions' | 'dispatch'>('hq');
  const [selectedFollowerId, setSelectedFollowerId] = useState<string>('');
  const [selectedQuestId, setSelectedQuestId] = useState<string>('');

  const chunkKey = `${gameState.currentChunkX},${gameState.currentChunkY}`;
  const isTownCenter = gameState.currentChunkX === 0 && gameState.currentChunkY === 0;
  const isTown = hasTownAtChunk(gameState.currentChunkX, gameState.currentChunkY);

  const guildOwned = !!gameState.guildOwned;
  const safehousePurchased = !!gameState.safehouses?.[chunkKey]?.purchased;

  const isUsingGuildHQStash = isTownCenter && guildOwned;
  const hasStorageAccess = safehousePurchased || isUsingGuildHQStash;

  // Initialize safehouse/HQ state for current chunk if not existing
  const currentSafehouseStash = isUsingGuildHQStash
    ? (gameState.guildStash || {
        equipment: [],
        materials: {},
        catalysts: {},
        potions: {}
      })
    : (gameState.safehouses?.[chunkKey]?.stash || {
        equipment: [],
        materials: {},
        catalysts: {},
        potions: {}
      });

  // 1. Purchase Guild Headquarters
  const handlePurchaseHQ = () => {
    if (!isTownCenter) {
      playSound('bump');
      addLogMessage('❌ The Guild Headquarters can only be founded inside the Oakhaven Town Center (Chunk 0,0).', 'system');
      return;
    }
    if (gameState.playerStats.gold < 500) {
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
  };

  // 2. Buy Safehouse in current Chunk
  const handlePurchaseSafehouse = () => {
    if (gameState.playerStats.gold < 300) {
      playSound('bump');
      addLogMessage('❌ You need 300 Gold to purchase this property deed.', 'system');
      return;
    }

    const isTown = hasTownAtChunk(gameState.currentChunkX, gameState.currentChunkY);
    const guardFollower = isTown 
      ? null 
      : (gameState.followers[0] || null);

    if (!isTown && !guardFollower) {
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

      // Create a deep copy of map and discovered arrays
      const nextMap = prev.map.map(row => [...row]);
      const nextDiscovered = prev.discovered ? prev.discovered.map(row => [...row]) : prev.map.map(() => []);

      let nextNpcs = [...(prev.npcs || [])];
      let nextFollowers = [...prev.followers];
      let nextEnemies = [...prev.enemies];

      if (isTown) {
        // Spawn a friendly Guild Agent/Merchant NPC in the center of the Town Guild House (x=42, y=7)
        const agentX = 42;
        const agentY = 7;
        const guildAgentId = `npc_guild_agent_${chunkKey}`;
        
        // Remove existing if any
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

        // Ensure the spot on the map has a floor tile
        if (nextMap[agentY] && nextMap[agentY][agentX]) {
          nextMap[agentY][agentX] = TileType.Floor;
        }
      } else if (guardFollower) {
        const width = safehousePreset.width;
        const height = safehousePreset.height;

        // Center the structure on the player's position
        let targetX = prev.playerX - Math.floor(width / 2);
        let targetY = prev.playerY - Math.floor(height / 2);

        // Clamp so it fits perfectly if the player is near the edge of the map
        targetX = Math.max(0, Math.min(prev.levelWidth - width, targetX));
        targetY = Math.max(0, Math.min(prev.levelHeight - height, targetY));

        // Carve the safehouse structure tiles onto the map
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
            // Make it fully discovered so it instantly pops up visually!
            if (nextDiscovered[ty]) {
              nextDiscovered[ty][tx] = true;
            }
          }
        }

        // Place the Guard inside the safehouse center (targetX + 2, targetY + 2)
        const guardX = targetX + 2;
        const guardY = targetY + 2;
        const guardNpcId = `safehouse_guard_${chunkKey}`;

        // Ensure the tile is Floor
        if (nextMap[guardY]) {
          nextMap[guardY][guardX] = TileType.Floor;
        }

        // Remove the guard follower from active party and map entities
        if (guardFollower) {
          nextFollowers = nextFollowers.filter(f => f.id !== guardFollower.id);
          nextEnemies = nextEnemies.filter(e => e.followerId !== guardFollower.id);
        }

        // Add them as a stationary merchant NPC guarding the safehouse
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

      // Sync current chunk's npcs back to overworldChunks cache so they persist!
      const nextChunks = { ...prev.overworldChunks };
      if (nextChunks[chunkKey]) {
        nextChunks[chunkKey] = {
          ...nextChunks[chunkKey],
          map: nextMap,
          discovered: nextDiscovered,
          npcs: nextNpcs,
          enemies: nextEnemies
        };
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
        overworldChunks: nextChunks,
        equipmentInventory: [...prev.equipmentInventory, recallScrollReward],
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold - 300
        }
      };
    });

    if (isTown) {
      addLogMessage(`🏰 Purchased the Town Guild House in Oakhaven Center [${chunkKey}]! Regional ledger storage is now unlocked.`, 'craft');
    } else {
      const assignedName = guardFollower ? (guardFollower as any).name : 'companion follower';
      addLogMessage(`🏕️ Assigned your companion ${assignedName} to defend the Wilderness Safehouse in [${chunkKey}]! Access deep storage chest functions.`, 'craft');
    }
    addLogMessage(`🎁 [RECONNAISSANCE REWARD]: The Sunder Guild delivers a rare Scroll of Recall 📜 directly into your backpack to easily teleport back to any safe area!`, 'loot');
  };

  const handleSafehouseRest = () => {
    playSound('levelUp');
    setGameState(prev => {
      const stats = prev.playerStats;
      const nextStats = {
        ...stats,
        exhaustion: 0, // Fully purges exhaustion!
        hp: Math.min(stats.maxHp, stats.hp + Math.round(stats.maxHp * 0.30)), // Heals 30% HP
        mp: Math.min(stats.maxMp, stats.mp + Math.round(stats.maxMp * 0.30))  // Heals 30% MP
      };

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `Fully Purged! 💤`, type: 'heal' as const },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        playerStats: nextStats
      };
    });
    addLogMessage(`⛺ You rest in your cozy wilderness safehouse. All combat exhaustion is fully purged, and you feel refreshed! (+30% HP and MP)`, 'loot');
  };

  // 3. Purchase Guild HQ Upgrade
  const handleBuyUpgrade = (upgrade: GuildUpgrade) => {
    const currentLevel = gameState.guildUpgrades?.[upgrade.id] || 0;
    if (currentLevel >= upgrade.maxLevel) {
      playSound('bump');
      addLogMessage('❌ This Guild Research is already at maximum rank!', 'system');
      return;
    }

    // Check Gold
    if (gameState.playerStats.gold < upgrade.costGold) {
      playSound('bump');
      addLogMessage(`❌ You need ${upgrade.costGold} Gold to finance this Guild Research.`, 'system');
      return;
    }

    // Check Materials
    for (const [matId, qty] of Object.entries(upgrade.costMaterials)) {
      const playerQty = gameState.inventoryMaterials[matId] || 0;
      if (playerQty < qty) {
        playSound('bump');
        addLogMessage(`❌ Insufficient materials! Missing ${qty}x ${matId.replace('mat_', '').toUpperCase()}.`, 'system');
        return;
      }
    }

    // Spend gold and materials, increment upgrade
    playSound('craft');
    setGameState(prev => {
      const nextMats = { ...prev.inventoryMaterials };
      for (const [matId, qty] of Object.entries(upgrade.costMaterials)) {
        nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - qty);
      }
      const nextUpgrades = { ...(prev.guildUpgrades || {}) };
      nextUpgrades[upgrade.id] = currentLevel + 1;

      return {
        ...prev,
        inventoryMaterials: nextMats,
        guildUpgrades: nextUpgrades,
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold - upgrade.costGold
        }
      };
    });
    addLogMessage(`⚙️ Guild Research Completed: ${upgrade.name} upgraded to Rank ${currentLevel + 1}!`, 'craft');
  };

  // 4. Buy Sanctuary Decoration
  const handleBuyDecor = (decor: GuildDecor) => {
    if (gameState.guildSanctuary?.includes(decor.id)) {
      playSound('bump');
      addLogMessage('❌ You have already installed this sanctuary decoration!', 'system');
      return;
    }

    if (gameState.playerStats.gold < decor.costGold) {
      playSound('bump');
      addLogMessage(`❌ You need ${decor.costGold} Gold to purchase this sanctuary installment.`, 'system');
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
    addLogMessage(`✨ Installed Sanctuary Decor: ${decor.name} ${decor.icon}! ${decor.bonusText}`, 'craft');
  };

  // 5. Safehouse Storage (Stashing) Mechanics
  const handleStashMaterial = (matId: string, deposit: boolean) => {
    setGameState(prev => {
      const nextSafehouses = { ...(prev.safehouses || {}) };
      const currentStash = isUsingGuildHQStash 
        ? { ...(prev.guildStash || { equipment: [], materials: {}, catalysts: {}, potions: {} }) }
        : { ...(nextSafehouses[chunkKey]?.stash || { equipment: [], materials: {}, catalysts: {}, potions: {} }) };

      if (deposit) {
        const count = prev.inventoryMaterials[matId] || 0;
        if (count <= 0) return prev;
        
        const nextMats = { ...prev.inventoryMaterials, [matId]: count - 1 };
        const nextStashMats = { ...currentStash.materials, [matId]: (currentStash.materials[matId] || 0) + 1 };
        
        currentStash.materials = nextStashMats;
        
        if (isUsingGuildHQStash) {
          addLogMessage(`📥 Deposited 1x ${matId.replace('mat_', '').toUpperCase()} into Guild HQ vault.`, 'system');
          return { ...prev, inventoryMaterials: nextMats, guildStash: currentStash };
        } else {
          nextSafehouses[chunkKey] = { purchased: true, stash: currentStash };
          addLogMessage(`📥 Deposited 1x ${matId.replace('mat_', '').toUpperCase()} into safehouse stash.`, 'system');
          return { ...prev, inventoryMaterials: nextMats, safehouses: nextSafehouses };
        }
      } else {
        const stashCount = currentStash.materials[matId] || 0;
        if (stashCount <= 0) return prev;

        const nextMats = { ...prev.inventoryMaterials, [matId]: (prev.inventoryMaterials[matId] || 0) + 1 };
        const nextStashMats = { ...currentStash.materials, [matId]: stashCount - 1 };

        currentStash.materials = nextStashMats;
        
        if (isUsingGuildHQStash) {
          addLogMessage(`📤 Retracted 1x ${matId.replace('mat_', '').toUpperCase()} from Guild HQ vault.`, 'system');
          return { ...prev, inventoryMaterials: nextMats, guildStash: currentStash };
        } else {
          nextSafehouses[chunkKey] = { purchased: true, stash: currentStash };
          addLogMessage(`📤 Retracted 1x ${matId.replace('mat_', '').toUpperCase()} from safehouse stash.`, 'system');
          return { ...prev, inventoryMaterials: nextMats, safehouses: nextSafehouses };
        }
      }
    });
    playSound('loot');
  };

  const handleStashCatalyst = (catId: string, deposit: boolean) => {
    setGameState(prev => {
      const nextSafehouses = { ...(prev.safehouses || {}) };
      const currentStash = isUsingGuildHQStash 
        ? { ...(prev.guildStash || { equipment: [], materials: {}, catalysts: {}, potions: {} }) }
        : { ...(nextSafehouses[chunkKey]?.stash || { equipment: [], materials: {}, catalysts: {}, potions: {} }) };

      if (deposit) {
        const count = prev.inventoryCatalysts[catId] || 0;
        if (count <= 0) return prev;
        
        const nextCats = { ...prev.inventoryCatalysts, [catId]: count - 1 };
        const nextStashCats = { ...currentStash.catalysts, [catId]: (currentStash.catalysts[catId] || 0) + 1 };
        
        currentStash.catalysts = nextStashCats;
        
        if (isUsingGuildHQStash) {
          addLogMessage(`📥 Deposited 1x ${catId.replace('cat_', '').toUpperCase()} Catalyst into Guild HQ vault.`, 'system');
          return { ...prev, inventoryCatalysts: nextCats, guildStash: currentStash };
        } else {
          nextSafehouses[chunkKey] = { purchased: true, stash: currentStash };
          addLogMessage(`📥 Deposited 1x ${catId.replace('cat_', '').toUpperCase()} Catalyst into safehouse stash.`, 'system');
          return { ...prev, inventoryCatalysts: nextCats, safehouses: nextSafehouses };
        }
      } else {
        const stashCount = currentStash.catalysts[catId] || 0;
        if (stashCount <= 0) return prev;

        const nextCats = { ...prev.inventoryCatalysts, [catId]: (prev.inventoryCatalysts[catId] || 0) + 1 };
        const nextStashCats = { ...currentStash.catalysts, [catId]: stashCount - 1 };

        currentStash.catalysts = nextStashCats;
        
        if (isUsingGuildHQStash) {
          addLogMessage(`📤 Retracted 1x ${catId.replace('cat_', '').toUpperCase()} Catalyst from Guild HQ vault.`, 'system');
          return { ...prev, inventoryCatalysts: nextCats, guildStash: currentStash };
        } else {
          nextSafehouses[chunkKey] = { purchased: true, stash: currentStash };
          addLogMessage(`📤 Retracted 1x ${catId.replace('cat_', '').toUpperCase()} Catalyst from safehouse stash.`, 'system');
          return { ...prev, inventoryCatalysts: nextCats, safehouses: nextSafehouses };
        }
      }
    });
    playSound('loot');
  };

  const handleStashEquipment = (item: EquipmentItem, deposit: boolean) => {
    setGameState(prev => {
      const nextSafehouses = { ...(prev.safehouses || {}) };
      const currentStash = isUsingGuildHQStash 
        ? { ...(prev.guildStash || { equipment: [], materials: {}, catalysts: {}, potions: {} }) }
        : { ...(nextSafehouses[chunkKey]?.stash || { equipment: [], materials: {}, catalysts: {}, potions: {} }) };

      if (deposit) {
        // Remove from inventory
        const nextEquip = prev.equipmentInventory.filter(e => e.id !== item.id);
        const nextStashEquip = [...currentStash.equipment, item];

        currentStash.equipment = nextStashEquip;
        
        if (isUsingGuildHQStash) {
          addLogMessage(`📥 Deposited gear [${item.name}] into Guild HQ vault.`, 'system');
          return { ...prev, equipmentInventory: nextEquip, guildStash: currentStash };
        } else {
          nextSafehouses[chunkKey] = { purchased: true, stash: currentStash };
          addLogMessage(`📥 Deposited gear [${item.name}] into safehouse safechest.`, 'system');
          return { ...prev, equipmentInventory: nextEquip, safehouses: nextSafehouses };
        }
      } else {
        // Retrieve
        const nextStashEquip = currentStash.equipment.filter(e => e.id !== item.id);
        const nextEquip = [...prev.equipmentInventory, item];

        currentStash.equipment = nextStashEquip;
        
        if (isUsingGuildHQStash) {
          addLogMessage(`📤 Retracted gear [${item.name}] from Guild HQ vault.`, 'system');
          return { ...prev, equipmentInventory: nextEquip, guildStash: currentStash };
        } else {
          nextSafehouses[chunkKey] = { purchased: true, stash: currentStash };
          addLogMessage(`📤 Retracted gear [${item.name}] from safehouse chest.`, 'system');
          return { ...prev, equipmentInventory: nextEquip, safehouses: nextSafehouses };
        }
      }
    });
    playSound('loot');
  };

  const handleStashAll = () => {
    setGameState(prev => {
      const totalMats = Object.values(prev.inventoryMaterials || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
      const totalCats = Object.values(prev.inventoryCatalysts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
      const totalEquip = (prev.equipmentInventory || []).length;

      if (totalMats === 0 && totalCats === 0 && totalEquip === 0) {
        playSound('bump');
        addLogMessage('⚠️ Nothing to stash in your inventory.', 'system');
        return prev;
      }

      const nextSafehouses = { ...(prev.safehouses || {}) };
      const currentStash = isUsingGuildHQStash 
        ? { ...(prev.guildStash || { equipment: [], materials: {}, catalysts: {}, potions: {} }) }
        : { ...(nextSafehouses[chunkKey]?.stash || { equipment: [], materials: {}, catalysts: {}, potions: {} }) };

      const nextStashMaterials = { ...(currentStash.materials || {}) };
      const nextStashCatalysts = { ...(currentStash.catalysts || {}) };
      const nextStashEquipment = [...(currentStash.equipment || [])];

      const playerMaterials = { ...(prev.inventoryMaterials || {}) };
      const playerCatalysts = { ...(prev.inventoryCatalysts || {}) };
      const playerEquipment = [...(prev.equipmentInventory || [])];

      let itemsStashedCount = 0;

      // Stash all materials
      Object.entries(playerMaterials).forEach(([matId, val]) => {
        const qty = Number(val) || 0;
        if (qty > 0) {
          nextStashMaterials[matId] = (Number(nextStashMaterials[matId]) || 0) + qty;
          playerMaterials[matId] = 0;
          itemsStashedCount += qty;
        }
      });

      // Stash all catalysts
      Object.entries(playerCatalysts).forEach(([catId, val]) => {
        const qty = Number(val) || 0;
        if (qty > 0) {
          nextStashCatalysts[catId] = (Number(nextStashCatalysts[catId]) || 0) + qty;
          playerCatalysts[catId] = 0;
          itemsStashedCount += qty;
        }
      });

      // Stash all equipment
      if (playerEquipment.length > 0) {
        nextStashEquipment.push(...playerEquipment);
        itemsStashedCount += playerEquipment.length;
        playerEquipment.length = 0;
      }

      currentStash.materials = nextStashMaterials;
      currentStash.catalysts = nextStashCatalysts;
      currentStash.equipment = nextStashEquipment;

      if (isUsingGuildHQStash) {
        addLogMessage(`📥 Bulk deposited ${itemsStashedCount} items into Guild HQ vault.`, 'system');
        return {
          ...prev,
          inventoryMaterials: playerMaterials,
          inventoryCatalysts: playerCatalysts,
          equipmentInventory: playerEquipment,
          guildStash: currentStash
        };
      } else {
        nextSafehouses[chunkKey] = { purchased: true, stash: currentStash };
        addLogMessage(`📥 Bulk deposited ${itemsStashedCount} items into safehouse stash.`, 'system');
        return {
          ...prev,
          inventoryMaterials: playerMaterials,
          inventoryCatalysts: playerCatalysts,
          equipmentInventory: playerEquipment,
          safehouses: nextSafehouses
        };
      }
    });
    playSound('loot');
  };

  // 6. Join Faction (Syndicate or Vanguard or Bandits)
  const handleJoinFaction = (factionName: 'syndicate' | 'vanguard' | 'bandits') => {
    const rep = gameState.factionReputation?.[factionName] || 0;
    if (rep < 40) {
      playSound('bump');
      addLogMessage(`❌ ALLEGIANCE LOCKED: You need at least 40 Reputation with the ${factionName.toUpperCase()} faction. Current: ${rep}`, 'system');
      return;
    }

    playSound('loot');
    setGameState(prev => ({
      ...prev,
      faction: factionName
    }));
    addLogMessage(`🛡️ FACTION ALLEGIANCE DECLARED: You have officially joined the ${factionName.toUpperCase()}! Specialized blueprints and traits are now active!`, 'craft');
  };

  // 7. Craft Faction Blueprint Gear
  const handleCraftFactionGear = (gear: FactionGear) => {
    const gearFaction = gear.id.includes('syndicate') ? 'syndicate' : (gear.id.includes('vanguard') ? 'vanguard' : 'bandits');
    if (gameState.faction !== gearFaction) {
      playSound('bump');
      addLogMessage('❌ Blueprint Locked: You must join the corresponding faction to craft this heavy gear.', 'system');
      return;
    }

    if (gameState.playerStats.gold < gear.costGold) {
      playSound('bump');
      addLogMessage(`❌ Insufficient gold! Forging requires ${gear.costGold} Gold.`, 'system');
      return;
    }

    for (const [matId, qty] of Object.entries(gear.costMaterials)) {
      const playerQty = gameState.inventoryMaterials[matId] || 0;
      if (playerQty < qty) {
        playSound('bump');
        addLogMessage(`❌ Insufficient materials! Forging requires ${qty}x ${matId.replace('mat_', '').toUpperCase()}.`, 'system');
        return;
      }
    }

    // Deduct and Craft
    playSound('craft');
    setGameState(prev => {
      const nextMats = { ...prev.inventoryMaterials };
      for (const [matId, qty] of Object.entries(gear.costMaterials)) {
        nextMats[matId] = Math.max(0, (nextMats[matId] || 0) - qty);
      }

      const item: EquipmentItem = {
        id: `${gear.id}_${Date.now()}`,
        name: gear.name,
        type: (gear.type === 'shield' ? 'armor' : gear.type) as any,
        subType: gear.subType as any,
        damage: gear.damage || 0,
        defense: gear.defense || 0,
        critChance: gear.critChance || 0,
        range: gear.range || 0,
        color: gear.color,
        description: gear.desc,
        value: Math.round(gear.costGold * 0.8)
      };

      return {
        ...prev,
        inventoryMaterials: nextMats,
        equipmentInventory: [...prev.equipmentInventory, item],
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold - gear.costGold
        }
      };
    });
    addLogMessage(`🔨 Arcane Faction Gear Forged: [${gear.name}] added to your equipment backpack!`, 'craft');
  };

  // 7b. Faction Territory Taxes & Contributions
  const handleClaimTaxes = (territoryId: string) => {
    const territory = gameState.factionTerritories?.[territoryId];
    if (!territory) return;

    if (territory.controller !== gameState.faction) {
      playSound('bump');
      addLogMessage(`❌ You can only claim taxes from territories controlled by your faction (${gameState.faction?.toUpperCase()}).`, 'system');
      return;
    }

    const goldAmt = territory.taxGoldAccumulated || 0;
    const matId = territory.taxMaterialIdAccumulated;
    const matAmt = territory.taxMaterialCountAccumulated || 0;

    if (goldAmt <= 0 && (matAmt <= 0 || !matId)) {
      playSound('bump');
      addLogMessage(`❌ There are no accumulated tax revenues to claim from ${territory.name} at this time.`, 'system');
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
      if (matId && matAmt > 0) {
        nextMats[matId] = (nextMats[matId] || 0) + matAmt;
      }

      return {
        ...prev,
        factionTerritories: nextTerritories,
        inventoryMaterials: nextMats,
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold + goldAmt
        }
      };
    });

    const matLabel = matAmt > 0 ? `, and +${matAmt}x ${matId.replace('mat_', '').toUpperCase()}` : '';
    addLogMessage(`🪙 [TAX CLAIMED]: Collected 🪙 ${goldAmt} Gold Coins${matLabel} from the local coffers of ${territory.name}!`, 'loot');
  };

  const handleContributeGold = (amount: number) => {
    if (!gameState.faction) {
      playSound('bump');
      addLogMessage('❌ You must join a faction first before contributing to the war treasury.', 'system');
      return;
    }

    if (gameState.playerStats.gold < amount) {
      playSound('bump');
      addLogMessage(`❌ You do not have ${amount} Gold Coins to contribute to the war effort.`, 'system');
      return;
    }

    playSound('levelUp');
    const repReward = amount === 100 ? 5 : 30;

    setGameState(prev => {
      const nextTreasury = { ...(prev.factionWarTreasury || { syndicateGold: 200, vanguardGold: 200, playerContributionSyndicate: 0, playerContributionVanguard: 0, activeTactics: [] }) };
      const nextRep = { ...(prev.factionReputation || {}) };

      if (prev.faction === 'syndicate') {
        nextTreasury.syndicateGold = (nextTreasury.syndicateGold || 0) + amount;
        nextTreasury.playerContributionSyndicate = (nextTreasury.playerContributionSyndicate || 0) + amount;
        nextRep.syndicate = (nextRep.syndicate || 0) + repReward;
      } else if (prev.faction === 'vanguard') {
        nextTreasury.vanguardGold = (nextTreasury.vanguardGold || 0) + amount;
        nextTreasury.playerContributionVanguard = (nextTreasury.playerContributionVanguard || 0) + amount;
        nextRep.vanguard = (nextRep.vanguard || 0) + repReward;
      }

      return {
        ...prev,
        factionWarTreasury: nextTreasury,
        factionReputation: nextRep,
        playerStats: {
          ...prev.playerStats,
          gold: prev.playerStats.gold - amount
        }
      };
    });

    addLogMessage(`⚔️ [CONTRIBUTION]: You contributed 🪙 ${amount} Gold to the ${gameState.faction.toUpperCase()} War Chest! Reputation increased by +${repReward}!`, 'craft');
  };

  const handleBuyTactic = (tacticName: string, costGold: number, territoryId: string) => {
    if (!gameState.faction) return;

    const treasury = gameState.factionWarTreasury || { syndicateGold: 200, vanguardGold: 200, playerContributionSyndicate: 0, playerContributionVanguard: 0, activeTactics: [] };
    const factionGold = gameState.faction === 'syndicate' ? (treasury.syndicateGold || 0) : (treasury.vanguardGold || 0);

    if (factionGold < costGold) {
      playSound('bump');
      addLogMessage(`❌ The Faction War Treasury does not have enough Gold reserves (${costGold} required). Contribute gold to fund this directive!`, 'system');
      return;
    }

    playSound('loot');
    setGameState(prev => {
      const nextTreasury = { ...(prev.factionWarTreasury || { syndicateGold: 200, vanguardGold: 200, playerContributionSyndicate: 0, playerContributionVanguard: 0, activeTactics: [] }) };
      const nextTerritories = { ...(prev.factionTerritories || {}) };

      if (prev.faction === 'syndicate') {
        nextTreasury.syndicateGold = Math.max(0, (nextTreasury.syndicateGold || 0) - costGold);
      } else {
        nextTreasury.vanguardGold = Math.max(0, (nextTreasury.vanguardGold || 0) - costGold);
      }

      nextTreasury.activeTactics = [...(nextTreasury.activeTactics || []), `${tacticName} (${prev.faction.toUpperCase()})`].slice(-4);

      if (nextTerritories[territoryId]) {
        const terr = nextTerritories[territoryId];
        let newControl = terr.controlPercent;
        if (terr.controller === prev.faction) {
          newControl = Math.min(100, terr.controlPercent + 20);
        } else {
          newControl = terr.controlPercent - 20;
          if (newControl < 0) {
            newControl = Math.abs(newControl);
          }
          // Flipping!
          const otherController = prev.faction;
          nextTerritories[territoryId] = {
            ...terr,
            controller: otherController,
            controlPercent: Math.max(5, newControl),
            contested: true
          };
        }
      }

      return {
        ...prev,
        factionWarTreasury: nextTreasury,
        factionTerritories: nextTerritories
      };
    });

    addLogMessage(`⚔️ [DIRECTIVE DEPLOYED]: Ordered "${tacticName}" using Faction Funds! Control of ${gameState.factionTerritories?.[territoryId]?.name || territoryId} boosted!`, 'combat');
  };

  // 8. Companion Dispatch System (Autonomous Follower Quests)
  const handleDispatchFollower = () => {
    if (!selectedFollowerId || !selectedQuestId) {
      playSound('bump');
      addLogMessage('❌ Select both an idle companion and a dispatch mission from the ledger.', 'system');
      return;
    }

    const follower = gameState.followers.find(f => f.id === selectedFollowerId);
    const mission = COMPANION_QUEST_BOARD.find(q => q.id === selectedQuestId);

    if (!follower || !mission) return;

    if (follower.hp <= 0) {
      playSound('bump');
      addLogMessage('❌ Dead companions cannot go on wilderness quests!', 'system');
      return;
    }

    // Check if follower is already dispatched
    const activeDispatch = gameState.activeCompanionQuests?.find(c => c.followerId === follower.id);
    if (activeDispatch) {
      playSound('bump');
      addLogMessage(`❌ ${follower.name} is already dispatched on a mission!`, 'system');
      return;
    }

    // Dispatching! Let's modify turnsRequired based on research: up_expeditions reduces duration by 25% per tier (max level 3)
    const expeditionRank = gameState.guildUpgrades?.['up_expeditions'] || 0;
    const speedMultiplier = 1.0 - expeditionRank * 0.25;
    const dynamicTurns = Math.max(10, Math.round(mission.turnsRequired * speedMultiplier));

    playSound('loot');
    setGameState(prev => {
      const nextActiveCompanionQuests = [...(prev.activeCompanionQuests || [])];
      nextActiveCompanionQuests.push({
        followerId: follower.id,
        questId: mission.id,
        title: mission.title,
        durationTurns: dynamicTurns,
        rewardGold: mission.rewardGold,
        rewardXp: mission.rewardXp,
        rewardMaterials: mission.rewardMaterials
      });

      // Temporary update follower mode to wait so they don't fight on screen during dispatch
      const nextFollowers = prev.followers.map(f => {
        if (f.id === follower.id) {
          return { ...f, mode: 'wait' as const };
        }
        return f;
      });

      return {
        ...prev,
        activeCompanionQuests: nextActiveCompanionQuests,
        followers: nextFollowers
      };
    });

    addLogMessage(`🚀 DISPATCHED: ${follower.name} has set off on the quest [${mission.title}]! Expected completion in ${dynamicTurns} overland steps.`, 'craft');
    setSelectedFollowerId('');
    setSelectedQuestId('');
  };

  // Claim finished dispatch
  const handleClaimDispatchRewards = (followerId: string) => {
    const dispatch = gameState.activeCompanionQuests?.find(c => c.followerId === followerId);
    if (!dispatch || dispatch.durationTurns > 0) return;

    playSound('loot');
    setGameState(prev => {
      // Reward Gold & XP
      const nextStats = {
        ...prev.playerStats,
        gold: prev.playerStats.gold + dispatch.rewardGold,
        xp: prev.playerStats.xp + dispatch.rewardXp
      };

      // Add materials
      const nextMats = { ...prev.inventoryMaterials };
      if (dispatch.rewardMaterials) {
        for (const [matId, qty] of Object.entries(dispatch.rewardMaterials)) {
          nextMats[matId] = (nextMats[matId] || 0) + qty;
        }
      }

      // Remove dispatch
      const nextCompanionQuests = (prev.activeCompanionQuests || []).filter(c => c.followerId !== followerId);

      // Restore follower state to active/healthy
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

    const followerName = gameState.followers.find(f => f.id === followerId)?.name || 'Follower';
    addLogMessage(`✅ EXPEDITION COMPLETE: ${followerName} has successfully returned from exploration! Earned +${dispatch.rewardGold} Gold, +${dispatch.rewardXp} XP!`, 'loot');
  };

  return (
    <div className="flex-grow flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow min-h-[420px]">
      {/* Tab Header bar */}
      <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏰</span>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-100 font-sans">Sunder Guild Headquarters & Wilderness Trade Safehouses</h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Manage modular research upgrades, safehouse storage, and autonomous follower expeditions.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 md:mt-0 font-sans">
          <button 
            onClick={() => setActiveSubTab('hq')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded ${activeSubTab === 'hq' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-100'}`}
          >
            Guild HQ
          </button>
          <button 
            disabled={!guildOwned}
            onClick={() => setActiveSubTab('sanctuary')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded ${!guildOwned ? 'opacity-30 cursor-not-allowed' : ''} ${activeSubTab === 'sanctuary' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-100'}`}
          >
            HQ Sanctuary
          </button>
          <button 
            disabled={!guildOwned}
            onClick={() => setActiveSubTab('dispatch')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded ${!guildOwned ? 'opacity-30 cursor-not-allowed' : ''} ${activeSubTab === 'dispatch' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-100'}`}
          >
            Companion Dispatch
          </button>
          <button 
            disabled={!guildOwned}
            onClick={() => setActiveSubTab('factions')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded ${!guildOwned ? 'opacity-30 cursor-not-allowed' : ''} ${activeSubTab === 'factions' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-100'}`}
          >
            Factions & Blueprints
          </button>
          <button 
            onClick={() => setActiveSubTab('stash')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded ${activeSubTab === 'stash' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-100'}`}
          >
            Safehouse Storage
          </button>
        </div>
      </div>

      {/* Main viewport */}
      <div className="flex-grow flex flex-col min-h-0">
        {/* Treasury Panel (HQ, Sanctuary Decor, Factions & War Treasury) */}
        {(activeSubTab === 'hq' || activeSubTab === 'sanctuary' || activeSubTab === 'factions') && (
          <GuildTreasuryPanel
            gameState={gameState}
            isTownCenter={isTownCenter}
            chunkKey={chunkKey}
            guildOwned={guildOwned}
            activeSubTab={activeSubTab}
            handlePurchaseHQ={handlePurchaseHQ}
            handleBuyUpgrade={handleBuyUpgrade}
            handleBuyDecor={handleBuyDecor}
            handleForgeFactionGear={handleCraftFactionGear}
            handleClaimTaxes={handleClaimTaxes}
            handleContributeGold={handleContributeGold}
            handleBuyTactic={handleBuyTactic}
          />
        )}



        {/* Companion Dispatch / Mission Board */}
        {activeSubTab === 'dispatch' && guildOwned && (
          <GuildMissionBoard
            gameState={gameState}
            selectedFollowerId={selectedFollowerId}
            setSelectedFollowerId={setSelectedFollowerId}
            selectedQuestId={selectedQuestId}
            setSelectedQuestId={setSelectedQuestId}
            handleDispatchFollower={handleDispatchFollower}
            handleClaimDispatchRewards={handleClaimDispatchRewards}
          />
        )}



        {/* VIEW 5: Safehouse Wilderness Storage */}
        {activeSubTab === 'stash' && (
          <GuildStashPanel
            hasStorageAccess={hasStorageAccess}
            isTown={isTown}
            chunkKey={chunkKey}
            isTownCenter={isTownCenter}
            guildOwned={guildOwned}
            isUsingGuildHQStash={isUsingGuildHQStash}
            gameState={gameState}
            handlePurchaseSafehouse={handlePurchaseSafehouse}
            handleSafehouseRest={handleSafehouseRest}
            handleStashAll={handleStashAll}
            handleStashMaterial={handleStashMaterial}
            handleStashCatalyst={handleStashCatalyst}
            handleStashEquipment={handleStashEquipment}
            currentSafehouseStash={currentSafehouseStash}
            setActiveSubTab={setActiveSubTab}
          />
        )}
      </div>
    </div>
  );
}
