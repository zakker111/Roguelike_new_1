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
        nextFollowers = nextFollowers.filter(f => f.id !== guardFollower.id);
        nextEnemies = nextEnemies.filter(e => e.followerId !== guardFollower.id);

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

        {/* VIEW 3: Companion dispatch list */}
        {activeSubTab === 'dispatch' && guildOwned && (
          <div className="flex-1 flex flex-col justify-start text-left gap-4 select-none animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
              
              {/* Mission ledger */}
              <div className="lg:col-span-8 flex flex-col gap-3">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wilderness Autonomous Dispatch Quests Ledger</h3>
                <div className="flex flex-col gap-2">
                  {COMPANION_QUEST_BOARD.map((mission) => {
                    const isSelected = selectedQuestId === mission.id;
                    const expeditionRank = gameState.guildUpgrades?.['up_expeditions'] || 0;
                    const speedMultiplier = 1.0 - expeditionRank * 0.25;
                    const dynamicTurns = Math.max(10, Math.round(mission.turnsRequired * speedMultiplier));

                    return (
                      <div 
                        key={mission.id} 
                        onClick={() => setSelectedQuestId(mission.id)}
                        className={`bg-slate-950/40 border p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                          isSelected ? 'border-purple-500 bg-purple-950/10' : 'border-slate-850 hover:border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 max-w-[450px]">
                          <span className="font-bold text-slate-200 text-xs">{mission.title}</span>
                          <span className="text-[10px] text-slate-450 leading-relaxed font-mono mt-0.5">{mission.desc}</span>
                          <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-slate-500">
                            <span>⏳ Duration: <strong className="text-slate-350">{dynamicTurns} Turns</strong></span>
                            <span>🪙 Gold Reward: <strong className="text-amber-400">+{mission.rewardGold}g</strong></span>
                            <span>🌟 XP: <strong className="text-emerald-400">+{mission.rewardXp}</strong></span>
                            {mission.rewardMaterials && (
                              <span className="text-purple-400 font-sans">
                                🎁 Loot: {Object.entries(mission.rewardMaterials).map(([matId, qty]) => `${qty}x ${matId.replace('mat_', '').toUpperCase()}`).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-500 transition-all ${isSelected ? 'transform rotate-90 text-purple-400' : ''}`} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Idle companions & dispatch actions */}
              <div className="lg:col-span-4 flex flex-col gap-3.5">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ready Companion Staff</h3>
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex flex-col gap-1 text-[10px] font-sans text-slate-300">
                    <label className="font-bold">1. Select Companion:</label>
                    <select
                      value={selectedFollowerId}
                      onChange={(e) => setSelectedFollowerId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 p-2 text-[10.5px] rounded text-slate-200 font-mono mt-1 w-full"
                    >
                      <option value="">-- Choose standby Follower --</option>
                      {gameState.followers.filter(f => f.hp > 0).map(f => {
                        const isDispatched = gameState.activeCompanionQuests?.some(q => q.followerId === f.id);
                        return (
                          <option key={f.id} value={f.id} disabled={isDispatched}>
                            {f.name} {isDispatched ? '(Dispatched ⚔️)' : `(Idle - Level ${f.level})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    onClick={handleDispatchFollower}
                    disabled={!selectedFollowerId || !selectedQuestId}
                    className={`mt-2 w-full py-2.5 text-[11px] font-bold rounded-lg shadow-md transition-all ${
                      selectedFollowerId && selectedQuestId
                        ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Dispatch Expedition
                  </button>

                  {/* Active scouts list */}
                  <div className="mt-3.5 border-t border-slate-850 pt-3.5 flex flex-col gap-2.5">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Current active expeditions:</span>
                    {gameState.activeCompanionQuests && gameState.activeCompanionQuests.length > 0 ? (
                      gameState.activeCompanionQuests.map((quest) => {
                        const companion = gameState.followers.find(f => f.id === quest.followerId);
                        const turnsLeft = quest.durationTurns;
                        return (
                          <div key={quest.followerId} className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-[10px] font-mono flex justify-between items-center animate-fade-in">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-200">{companion?.name}</span>
                              <span className="text-[9px] text-slate-500">{quest.title}</span>
                              <span className="text-[9.5px] text-purple-400 font-bold mt-0.5">
                                {turnsLeft > 0 ? `⏳ Steps Left: ${turnsLeft}` : '✅ Completed! Ready for claim.'}
                              </span>
                            </div>
                            {turnsLeft <= 0 && (
                              <button
                                onClick={() => handleClaimDispatchRewards(quest.followerId)}
                                className="px-2.5 py-1 bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400 border border-emerald-800/50 rounded font-bold text-[9.5px]"
                              >
                                Collect
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[9px] italic text-slate-600 text-center py-2">No active scout assignments.</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 4: Factions relations & blueprints */}
        {activeSubTab === 'factions' && guildOwned && (
          <div className="flex-1 flex flex-col justify-start text-left gap-4 select-none animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Left Side: Moonshadow Syndicate */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col gap-3.5">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌙</span>
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">Moonshadow Syndicate</h4>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Underground Criminal Ring</span>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-bold font-mono text-slate-350">
                    Rep: {gameState.factionReputation?.syndicate || 0}
                  </span>
                </div>

                <div className="text-[9.5px] text-slate-400 font-mono leading-relaxed">
                  The Moonshadow Syndicate controls illegal smuggling routes, lethal lockpicks, and swift poison-bladed weapons. They operate outside Sunder law.
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-purple-500" 
                    style={{ width: `${Math.min(100, Math.max(0, (gameState.factionReputation?.syndicate || 0) + 50))}%` }} 
                  />
                </div>

                {gameState.faction !== 'syndicate' ? (
                  <button
                    disabled={(gameState.factionReputation?.syndicate || 0) < 40}
                    onClick={() => handleJoinFaction('syndicate')}
                    className={`mt-2 py-1.5 text-[10px] font-bold rounded ${
                      (gameState.factionReputation?.syndicate || 0) >= 40 
                        ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {(gameState.factionReputation?.syndicate || 0) >= 40 ? 'Declare Allegiance to Syndicate' : 'Join: Need 40 reputation'}
                  </button>
                ) : (
                  <div className="mt-2 text-center text-xs text-purple-400 font-bold bg-purple-950/20 border border-purple-900/40 p-1 rounded">
                    ★ Loyal Syndicate Assassin ★
                  </div>
                )}

                {/* Crafting Blueprints list */}
                <div className="mt-3 border-t border-slate-850 pt-3 flex flex-col gap-2">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Exclusive Syndicate Blueprints:</span>
                  {SYNDICATE_GEAR.map((gear) => (
                    <div key={gear.id} className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg flex justify-between items-center text-[10px] font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold" style={{ color: gear.color }}>{gear.name}</span>
                        <span className="text-[9px] text-slate-500">{gear.desc}</span>
                        <div className="flex gap-2.5 mt-1 text-[8.5px] text-slate-400">
                          <span>🪙 Cost: <strong className="text-amber-400">{gear.costGold}g</strong></span>
                          <span>🧱 {Object.entries(gear.costMaterials).map(([matId, qty]) => `${qty}x ${matId.replace('mat_', '').toUpperCase()}`).join(', ')}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCraftFactionGear(gear)}
                        disabled={gameState.faction !== 'syndicate' || gameState.playerStats.gold < gear.costGold}
                        className={`px-2.5 py-1 text-[9.5px] font-bold rounded font-sans ${
                          gameState.faction === 'syndicate' && gameState.playerStats.gold >= gear.costGold
                            ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Forge
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Dawn Vanguard */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col gap-3.5">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">☀️</span>
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">Dawn Vanguard</h4>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Holy Protective Chivalry</span>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-bold font-mono text-slate-350">
                    Rep: {gameState.factionReputation?.vanguard || 0}
                  </span>
                </div>

                <div className="text-[9.5px] text-slate-400 font-mono leading-relaxed">
                  The Vanguard is the militant order of Oakhaven, seeking order, holy armor smithing, and defensive shield blueprints to secure port cities.
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: `${Math.min(100, Math.max(0, (gameState.factionReputation?.vanguard || 0) + 50))}%` }} 
                  />
                </div>

                {gameState.faction !== 'vanguard' ? (
                  <button
                    disabled={(gameState.factionReputation?.vanguard || 0) < 40}
                    onClick={() => handleJoinFaction('vanguard')}
                    className={`mt-2 py-1.5 text-[10px] font-bold rounded ${
                      (gameState.factionReputation?.vanguard || 0) >= 40 
                        ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {(gameState.factionReputation?.vanguard || 0) >= 40 ? 'Declare Allegiance to Vanguard' : 'Join: Need 40 reputation'}
                  </button>
                ) : (
                  <div className="mt-2 text-center text-xs text-amber-400 font-bold bg-amber-950/20 border border-amber-900/40 p-1 rounded">
                    ★ Devoted Vanguard Knight ★
                  </div>
                )}

                {/* Crafting Blueprints list */}
                <div className="mt-3 border-t border-slate-850 pt-3 flex flex-col gap-2">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Exclusive Vanguard Blueprints:</span>
                  {VANGUARD_GEAR.map((gear) => (
                    <div key={gear.id} className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg flex justify-between items-center text-[10px] font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold" style={{ color: gear.color }}>{gear.name}</span>
                        <span className="text-[9px] text-slate-500">{gear.desc}</span>
                        <div className="flex gap-2.5 mt-1 text-[8.5px] text-slate-400">
                          <span>🪙 Cost: <strong className="text-amber-400">{gear.costGold}g</strong></span>
                          <span>🧱 {Object.entries(gear.costMaterials).map(([matId, qty]) => `${qty}x ${matId.replace('mat_', '').toUpperCase()}`).join(', ')}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCraftFactionGear(gear)}
                        disabled={gameState.faction !== 'vanguard' || gameState.playerStats.gold < gear.costGold}
                        className={`px-2.5 py-1 text-[9.5px] font-bold rounded font-sans ${
                          gameState.faction === 'vanguard' && gameState.playerStats.gold >= gear.costGold
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Forge
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Third Column: Rust-Raider Bandits */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col gap-3.5">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏴‍☠️</span>
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs font-sans">Rust-Raider Bandits</h4>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Primal Wilderness Outlaws</span>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-bold font-mono text-slate-350">
                    Rep: {gameState.factionReputation?.bandits || 0}
                  </span>
                </div>

                <div className="text-[9.5px] text-slate-400 font-mono leading-relaxed">
                  The Rust-Raiders rule the lawless borders, crafting serrated spiked cleavers and spiked leather armor. They value raw individual dominance.
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-orange-500" 
                    style={{ width: `${Math.min(100, Math.max(0, (gameState.factionReputation?.bandits || 0) + 50))}%` }} 
                  />
                </div>

                {gameState.faction !== 'bandits' ? (
                  <button
                    disabled={(gameState.factionReputation?.bandits || 0) < 40}
                    onClick={() => handleJoinFaction('bandits')}
                    className={`mt-2 py-1.5 text-[10px] font-bold rounded ${
                      (gameState.factionReputation?.bandits || 0) >= 40 
                        ? 'bg-orange-600 hover:bg-orange-500 text-white' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {(gameState.factionReputation?.bandits || 0) >= 40 ? 'Declare Allegiance to Bandits' : 'Join: Need 40 reputation'}
                  </button>
                ) : (
                  <div className="mt-2 text-center text-xs text-orange-400 font-bold bg-orange-950/20 border border-orange-900/40 p-1 rounded">
                    ★ Renowned Outlaw Raider ★
                  </div>
                )}

                {/* Crafting Blueprints list */}
                <div className="mt-3 border-t border-slate-850 pt-3 flex flex-col gap-2">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Exclusive Raider Blueprints:</span>
                  {BANDIT_GEAR.map((gear) => (
                    <div key={gear.id} className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg flex justify-between items-center text-[10px] font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold" style={{ color: gear.color }}>{gear.name}</span>
                        <span className="text-[9px] text-slate-500">{gear.desc}</span>
                        <div className="flex gap-2.5 mt-1 text-[8.5px] text-slate-400">
                          <span>🪙 Cost: <strong className="text-amber-400">{gear.costGold}g</strong></span>
                          <span>🧱 {Object.entries(gear.costMaterials).map(([matId, qty]) => `${qty}x ${matId.replace('mat_', '').toUpperCase()}`).join(', ')}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCraftFactionGear(gear)}
                        disabled={gameState.faction !== 'bandits' || gameState.playerStats.gold < gear.costGold}
                        className={`px-2.5 py-1 text-[9.5px] font-bold rounded font-sans ${
                          gameState.faction === 'bandits' && gameState.playerStats.gold >= gear.costGold
                            ? 'bg-orange-600 hover:bg-orange-500 text-white cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Forge
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Faction Wars & Territory Conquest Dashboard (v3.5.0) */}
              <div className="col-span-full border-t border-slate-800 pt-5 mt-3 flex flex-col gap-4 font-sans text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚔️</span>
                    <div>
                      <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">Faction War Room & Territory Conquest (v3.5.0)</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Defeat opposing faction guards in overworld sectors to shift control, accumulate gold/material dividends, and claim passive combat buffs.</p>
                    </div>
                  </div>
                </div>

                {!gameState.faction ? (
                  <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl text-center max-w-lg mx-auto flex flex-col items-center gap-3">
                    <span className="text-3xl">🛡️</span>
                    <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider">War Room Locked</h4>
                    <p className="text-[10px] text-slate-500 font-mono">You must declare allegiance to either the Moonshadow Syndicate or Dawn Vanguard above to unlock the strategic War Room, claim territory tax dividends, and command active tactical military directives.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* War Treasury Chest & Contributions */}
                    <div className="lg:col-span-4 bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-3">
                      <div className="border-b border-slate-850 pb-2 flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                          💰 Faction War Treasury
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/40 text-purple-300 font-mono font-bold uppercase">
                          {gameState.faction} Chest
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 font-mono text-[10px] text-slate-450 mt-1">
                        <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded">
                          <span>Allied Treasury Balance:</span>
                          <span className="text-amber-400 font-sans font-bold flex items-center gap-1">
                            🪙 {gameState.faction === 'syndicate' 
                              ? (gameState.factionWarTreasury?.syndicateGold || 0) 
                              : (gameState.factionWarTreasury?.vanguardGold || 0)
                            } Gold
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded">
                          <span>Your Lifetime Contributions:</span>
                          <span className="text-slate-200 font-sans font-bold">
                            🪙 {gameState.faction === 'syndicate' 
                              ? (gameState.factionWarTreasury?.playerContributionSyndicate || 0) 
                              : (gameState.factionWarTreasury?.playerContributionVanguard || 0)
                            } Gold
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        <span className="font-bold text-[9px] uppercase tracking-wider text-slate-450">Fund Faction War Chest:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleContributeGold(100)}
                            disabled={gameState.playerStats.gold < 100}
                            className={`py-1.5 rounded text-[10px] font-bold font-sans flex flex-col items-center justify-center transition-all ${
                              gameState.playerStats.gold >= 100
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                                : 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed'
                            }`}
                          >
                            <span>Donate 🪙 100g</span>
                            <span className="text-[8px] font-mono text-emerald-400 mt-0.5">+5 Reputation</span>
                          </button>
                          <button
                            onClick={() => handleContributeGold(500)}
                            disabled={gameState.playerStats.gold < 500}
                            className={`py-1.5 rounded text-[10px] font-bold font-sans flex flex-col items-center justify-center transition-all ${
                              gameState.playerStats.gold >= 500
                                ? 'bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 border border-purple-800/40'
                                : 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed'
                            }`}
                          >
                            <span>Donate 🪙 500g</span>
                            <span className="text-[8px] font-mono text-emerald-400 mt-0.5">+30 Reputation</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Active War Room Tactical Directives */}
                    <div className="lg:col-span-4 bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-3">
                      <div className="border-b border-slate-850 pb-2 flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                          📜 Deploy Tactical Directives
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 mt-1">
                        <button
                          onClick={() => handleBuyTactic('Borderlands Skirmish', 150, 'borderlands')}
                          className="w-full text-left bg-slate-900/80 border border-slate-850 hover:border-slate-700 p-2.5 rounded-lg flex justify-between items-center text-[10px] transition-all"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-200 font-sans">1. Fund Borderlands Incursion</span>
                            <span className="text-[9px] font-mono text-slate-550">Cost: 150 Faction Gold. Gain +20% control in Borderlands.</span>
                          </div>
                          <span className="font-bold text-amber-400">Deploy</span>
                        </button>

                        <button
                          onClick={() => handleBuyTactic('Cove Supply Blockade', 150, 'moonshadow_cove')}
                          className="w-full text-left bg-slate-900/80 border border-slate-850 hover:border-slate-700 p-2.5 rounded-lg flex justify-between items-center text-[10px] transition-all"
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
                        {Object.entries(gameState.factionTerritories || {}).map(([id, terr]) => {
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
                )}
              </div>

            </div>
          </div>
        )}

        {/* VIEW 5: Safehouse Wilderness Storage */}
        {activeSubTab === 'stash' && (
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
        )}
      </div>
    </div>
  );
}
