import React from 'react';
import { GameState, Follower, Enemy, EnemyState } from '../types';

interface UseTownServicesOptions {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (msg: string, type?: string) => void;
  playSound: (sound: string) => void;
}

export function useTownServices({ setGameState, addLogMessage, playSound }: UseTownServicesOptions) {
  const handleUpgradeBlacksmith = () => {
    setGameState((gameState) => {
      const level = gameState.blacksmithForgeLevel ?? 1;
      if (level >= 3) return gameState;

      if (level === 1) {
        const goldCost = 250;
        const ironCount = gameState.inventoryMaterials['mat_iron'] || 0;
        if (gameState.playerStats.gold < goldCost || ironCount < 5) {
          playSound('bump');
          addLogMessage(`❌ Insufficient materials to upgrade Forge to Tier 2! Needs 250 Gold and 5 Scrap Iron.`, 'system');
          return gameState;
        }
        const prevRep = gameState.townReputation !== undefined ? gameState.townReputation : 100;
        const nextRep = Math.min(100, prevRep + 10);
        playSound('loot');
        addLogMessage(`🔨 FORGE UPGRADED: The town Blacksmith forge is now Tier 2! Advanced crafting templates (Staff, Wand, Crossbow) are unlocked! (+10 Town Reputation)`, 'loot');
        return {
          ...gameState,
          blacksmithForgeLevel: 2,
          townReputation: nextRep,
          playerStats: {
            ...gameState.playerStats,
            gold: gameState.playerStats.gold - goldCost
          },
          inventoryMaterials: {
            ...gameState.inventoryMaterials,
            'mat_iron': ironCount - 5
          }
        };
      } else if (level === 2) {
        const goldCost = 400;
        const mithrilCount = gameState.inventoryMaterials['mat_mithril'] || 0;
        if (gameState.playerStats.gold < goldCost || mithrilCount < 5) {
          playSound('bump');
          addLogMessage(`❌ Insufficient materials to upgrade Forge to Tier 3! Needs 400 Gold and 5 Glimmering Mithril.`, 'system');
          return gameState;
        }
        const prevRep = gameState.townReputation !== undefined ? gameState.townReputation : 100;
        const nextRep = Math.min(100, prevRep + 15);
        playSound('loot');
        addLogMessage(`🔥 FORGE MAXED: The town Blacksmith forge is now Tier 3! Elite legendary crafting templates (Greatsword, Warhammer) are unlocked! (+15 Town Reputation)`, 'loot');
        return {
          ...gameState,
          blacksmithForgeLevel: 3,
          townReputation: nextRep,
          playerStats: {
            ...gameState.playerStats,
            gold: gameState.playerStats.gold - goldCost
          },
          inventoryMaterials: {
            ...gameState.inventoryMaterials,
            'mat_mithril': mithrilCount - 5
          }
        };
      }
      return gameState;
    });
  };

  const handleUpgradeApothecary = () => {
    setGameState((gameState) => {
      const tier = gameState.apothecaryTier ?? 1;
      if (tier >= 3) return gameState;

      if (tier === 1) {
        const goldCost = 150;
        const berryCount = gameState.inventoryMaterials['mat_berry'] || 0;
        if (gameState.playerStats.gold < goldCost || berryCount < 10) {
          playSound('bump');
          addLogMessage(`❌ Insufficient materials to upgrade Apothecary to Tier 2! Needs 150 Gold and 10x Wild Berries.`, 'system');
          return gameState;
        }
        const prevRep = gameState.townReputation !== undefined ? gameState.townReputation : 100;
        const nextRep = Math.min(100, prevRep + 8);
        playSound('loot');
        addLogMessage(`🧪 LABORATORY UPGRADED: The Apothecary Laboratory is now Tier 2! Medium HP/MP restorative mixtures are now in stock! (+8 Town Reputation)`, 'loot');
        return {
          ...gameState,
          apothecaryTier: 2,
          townReputation: nextRep,
          playerStats: {
            ...gameState.playerStats,
            gold: gameState.playerStats.gold - goldCost
          },
          inventoryMaterials: {
            ...gameState.inventoryMaterials,
            'mat_berry': berryCount - 10
          }
        };
      } else if (tier === 2) {
        const goldCost = 300;
        const berryCount = gameState.inventoryMaterials['mat_berry'] || 0;
        
        const totalCats = Object.keys(gameState.inventoryCatalysts).reduce((sum, key) => sum + (gameState.inventoryCatalysts[key] || 0), 0);
        if (gameState.playerStats.gold < goldCost || berryCount < 20 || totalCats < 2) {
          playSound('bump');
          addLogMessage(`❌ Insufficient materials to upgrade Apothecary to Tier 3! Needs 300 Gold, 20x Wild Berries, and any 2x Catalyst Shards.`, 'system');
          return gameState;
        }
        
        const nextCats = { ...gameState.inventoryCatalysts };
        let deducted = 0;
        for (const catId of Object.keys(nextCats)) {
          if (nextCats[catId] > 0) {
            const take = Math.min(nextCats[catId], 2 - deducted);
            nextCats[catId] -= take;
            deducted += take;
            if (deducted >= 2) break;
          }
        }
        const prevRep = gameState.townReputation !== undefined ? gameState.townReputation : 100;
        const nextRep = Math.min(100, prevRep + 12);
        playSound('loot');
        addLogMessage(`🔥 LABORATORY MAXED: The Apothecary Laboratory is now Tier 3! Elixir of Full Restoration and Chaos Catalysts are now in stock! (+12 Town Reputation)`, 'loot');
        return {
          ...gameState,
          apothecaryTier: 3,
          townReputation: nextRep,
          playerStats: {
            ...gameState.playerStats,
            gold: gameState.playerStats.gold - goldCost
          },
          inventoryMaterials: {
            ...gameState.inventoryMaterials,
            'mat_berry': berryCount - 20
          },
          inventoryCatalysts: nextCats
        };
      }
      return gameState;
    });
  };

  const handleBuyRumor = () => {
    setGameState((gameState) => {
      const cost = 80;
      if (gameState.playerStats.gold < cost) {
        playSound('bump');
        addLogMessage(`❌ Insufficient Gold! You need 80 Gold to buy Frothy Beer Mug for Bartender Gossip.`, 'system');
        return gameState;
      }

      const rumorPools = [
        { type: 'chest', text: `A merchant caravan dropped a heavy iron lockbox at coordinate ({x}, {y}) in chunk ({cx}, {cy})! It's buried in the trees.` },
        { type: 'boss', text: `A seasoned ranger reported a deep dungeon entrance or dangerous beast den around coordinate ({x}, {y}) in chunk ({cx}, {cy})!` },
        { type: 'cat', text: `A local shepherd swears they saw a mystical legendary cat resting near coordinate ({x}, {y}) in chunk ({cx}, {cy})!` }
      ];

      const randomType = rumorPools[Math.floor(Math.random() * rumorPools.length)];
      const rx = Math.floor(Math.random() * 16) + 2;
      const ry = Math.floor(Math.random() * 16) + 2;
      const rcx = gameState.currentChunkX + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2);
      const rcy = gameState.currentChunkY + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2);

      const rumorMsg = randomType.text
        .replace('{x}', rx.toString())
        .replace('{y}', ry.toString())
        .replace('{cx}', rcx.toString())
        .replace('{cy}', rcy.toString());

      const activeRumors = gameState.purchasedRumors ? [...gameState.purchasedRumors] : [];
      activeRumors.push(rumorMsg);

      playSound('loot');
      addLogMessage(`🍻 Bartender slides over a Frothy Beer: "Drink up, friend! Let me tell you..."`, 'loot');
      addLogMessage(`📜 GOSSIP: "${rumorMsg}"`, 'system');

      return {
        ...gameState,
        purchasedRumors: activeRumors,
        playerStats: {
          ...gameState.playerStats,
          gold: Math.max(0, gameState.playerStats.gold - cost)
        }
      };
    });
  };

  const handleTavernRest = () => {
    setGameState((gameState) => {
      const cost = 15;
      if (gameState.playerStats.gold < cost) {
        playSound('bump');
        addLogMessage(`❌ Insufficient Gold! You need 15 Gold to rent a cozy room at the Inn.`, 'system');
        return gameState;
      }

      const stats = gameState.playerStats;
      const nextStats = {
        ...stats,
        gold: Math.max(0, stats.gold - cost),
        exhaustion: 0, // Fully purges exhaustion!
        hp: stats.maxHp, // fully heals HP
        mp: stats.maxMp  // fully heals MP
      };

      playSound('levelUp');
      addLogMessage(`🛌 You rent a cozy room upstairs, tuck into a warm featherbed, and rest deeply. Your physical exhaustion is fully purged and you feel at your fighting peak! (HP & MP Fully Restored)`, 'loot');

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: gameState.playerX, y: gameState.playerY, text: `Fully Restored! 💤`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...gameState,
        playerStats: nextStats
      };
    });
  };

  const handleHireMercenary = (type: 'novice' | 'veteran' | 'champion' | 'merchant_guard') => {
    setGameState((gameState) => {
      if (gameState.followers.length >= 3) {
        addLogMessage('🗣️ Bartender: "Your party is full! You can only manage up to 3 companions."', 'system');
        return gameState;
      }

      const reputation = gameState.townReputation ?? 100;
      if (reputation <= 20) {
        playSound('bump');
        addLogMessage('🗣️ Bartender whispers: "No mercenary here will fight for a wanted outlaw! Clean your name first!"', 'system');
        return gameState;
      }

      let cost = 180;
      let name = "Sunder Recruit";
      let hp = 35;
      let atk = 6;
      let def = 2;
      let char = '🗡';
      let color = '#38bdf8';
      let level = 2;
      let desc = "Novice cutthroat hired from the local tavern.";

      if (type === 'veteran') {
        cost = 280;
        name = "Sunder Veteran";
        hp = 55;
        atk = 9;
        def = 4;
        char = '⚔️';
        color = '#34d399';
        level = 4;
        desc = "Veteran sellsword with reinforced chainmail and a broadsword.";
      } else if (type === 'champion') {
        cost = 450;
        name = "Champion Gladiator";
        hp = 85;
        atk = 14;
        def = 7;
        char = '🏆';
        color = '#f59e0b';
        level = 6;
        desc = "Elite gladiator with high-impact strike shields and master training.";
      } else if (type === 'merchant_guard') {
        cost = 250;
        name = "Merchant Guard";
        hp = 60;
        atk = 8;
        def = 5;
        char = '💂';
        color = '#c084fc'; // medium purple
        level = 3;
        desc = "A heavily armed merchant guard. Specialized in safehouse protection and outpost defense.";
      }

      if (gameState.playerStats.gold < cost) {
        playSound('bump');
        addLogMessage(`❌ Insufficient Gold! Hiring ${name} requires ${cost} Gold.`, 'system');
        return gameState;
      }

      const nextFollower: Follower = {
        id: `fol_${Date.now()}`,
        name: name,
        archetypeId: type === 'champion' ? 'guard' : type === 'merchant_guard' ? 'merchant_guard' : 'thief',
        role: 'follower',
        char: char,
        color: color,
        hp: hp,
        maxHp: hp,
        atk: atk,
        def: def,
        level: level,
        xp: 0,
        xpNext: 150,
        mode: 'follow',
        equipment: { weapon: null, armor: null },
        inventory: [],
        injuries: [],
        personality: desc,
        temperament: 'Loyal'
      };

      const newActor: Enemy = {
        id: `actor_${nextFollower.id}`,
        x: gameState.playerX,
        y: gameState.playerY,
        type: 'Goblin' as any,
        name: nextFollower.name,
        hp: nextFollower.hp,
        maxHp: nextFollower.maxHp,
        atk: nextFollower.atk,
        def: nextFollower.def,
        range: 1,
        speed: 1,
        color: nextFollower.color,
        char: nextFollower.char,
        state: EnemyState.Chasing,
        isElite: type === 'champion',
        patrolPath: [],
        patrolIndex: 0,
        debuffs: [],
        isFollower: true,
        followerId: nextFollower.id
      };

      playSound('loot');
      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: gameState.playerX, y: gameState.playerY, text: `⚔️ Hired!`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);

      return {
        ...gameState,
        playerStats: {
          ...gameState.playerStats,
          gold: Math.max(0, gameState.playerStats.gold - cost)
        },
        followers: [...gameState.followers, nextFollower],
        enemies: [...gameState.enemies, newActor],
        logs: [
          ...gameState.logs,
          {
            id: `hire_merc_${Date.now()}`,
            text: `👥 MERCENARY HIRED: ${nextFollower.name} (Lvl ${level}) pledges their sword to you! (-${cost} Gold)`,
            type: 'loot',
            timestamp: 'RECRUIT'
          }
        ]
      };
    });
  };

  return {
    handleUpgradeBlacksmith,
    handleUpgradeApothecary,
    handleBuyRumor,
    handleTavernRest,
    handleHireMercenary,
  };
}
