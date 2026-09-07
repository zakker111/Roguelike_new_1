import { Dispatch, SetStateAction, useCallback } from 'react';
import { GameState, NPC, Follower, Enemy, EnemyState } from '../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../utils/gameUtils';
import { computeFOV } from '../utils/ai';
import { generateOverworldChunk, formatGameTime } from '../utils/overworld';
import { combatVfxEngine } from '../canvas/combatVfxEngine';

export interface UseNpcInteractionParams {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
  setActiveTab: Dispatch<SetStateAction<'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary' | 'chronicles'>>;
  setActiveDialogueNpc: (npc: NPC | null) => void;
  setActiveTravelerNpc: (npc: NPC | null) => void;
  setActiveDrunkNpc: (npc: NPC | null) => void;
  spawnFollowersOnLevelLoadByReset: (
    enemies: Enemy[],
    followers: Follower[],
    targetX: number,
    targetY: number,
    map: any[][],
    activeCompanionQuestsList?: any[]
  ) => Enemy[];
}

export function useNpcInteraction({
  gameState,
  setGameState,
  addLogMessage,
  playSound,
  setActiveTab,
  setActiveDialogueNpc,
  setActiveTravelerNpc,
  setActiveDrunkNpc,
  spawnFollowersOnLevelLoadByReset,
}: UseNpcInteractionParams) {

  const handleOpenNpcTrade = useCallback((npcId: string) => {
    const npc = gameState.npcs?.find(n => n.id === npcId);
    const rep = gameState.townReputation !== undefined ? gameState.townReputation : 100;
    if (rep <= 20 && npc?.role !== 'merchant_seppo') {
      playSound('deny');
      addLogMessage(`😡 ${npc?.name || 'The merchant'} spits on the ground: "I don't deal with infamous Sunder Outlaws! Scram before I call the guards!"`, 'danger');
    } else {
      setGameState(prev => ({ ...prev, activeTradeNpcId: npcId }));
      setActiveTab('market');
      addLogMessage(`🛒 Trading store opened with ${npc?.name || 'Merchant'}! Buy equipment or sell materials and excess gear.`, 'craft');
    }
  }, [gameState.npcs, gameState.townReputation, playSound, addLogMessage, setGameState, setActiveTab]);

  const interactWithFollower = useCallback((follower: Enemy) => {
    const linkedFollower = gameState.followers.find(f => f.id === follower.followerId);
    const archetype = linkedFollower?.archetypeId || 'generic';
    
    // Choose appropriate sound
    if (archetype === 'cat') {
      playSound('levelUp');
    } else {
      playSound('loot');
    }

    const lowercaseName = follower.name.toLowerCase();
    let quote = '';
    let effectText = '💬 Chat!';

    if (archetype === 'cat' || lowercaseName.includes('cat') || lowercaseName.includes('purr') || lowercaseName.includes('whiskers') || lowercaseName.includes('meow')) {
      const catQuotes = [
        `"Meow! 🐾 *rubs happily against your boots*"`,
        `"Prrr... *stares into your soul with brilliant, round eyes*"`,
        `"Meow? *playfully bats at your shiny weapon straps*"`,
        `"*stretches gracefully on the floor, letting out a soft purr*"`,
        `"Meow! *chirps excitedly and points its whiskers toward hidden corridors*"`
      ];
      quote = catQuotes[Math.floor(Math.random() * catQuotes.length)];
      effectText = '🐾 Purr!';
    } else if (archetype === 'guard' || archetype === 'merchant_guard' || lowercaseName.includes('guard') || lowercaseName.includes('shield')) {
      const guardQuotes = [
        `"Watching your back, commander! Let no raider ambush us."`,
        `"My heavy shield stands ready. No blade shall touch you while I draw breath!"`,
        `"Stay sharp, friend. The ambient flow of this dungeon feels dangerous."`,
        `"I've got your flank fully covered. Lead the way!"`,
        `"Ready for the next clash. Just give the order!"`
      ];
      quote = guardQuotes[Math.floor(Math.random() * guardQuotes.length)];
      effectText = '🛡️ Shield!';
    } else if (archetype === 'thief' || lowercaseName.includes('thief') || lowercaseName.includes('rogue')) {
      const thiefQuotes = [
        `"Keep it quiet... we don't want to alert the whole dungeon floor."`,
        `"Always scanning the dark. Say, spotted any locked chests nearby?"`,
        `"My daggers are clean, oiled, and ready. Let me know if you need lockpicks!"`,
        `"Slinking through the shadows is my specialty. What's our next move?"`,
        `"Shh! I heard a scuttle... or maybe it was just the wind."`
      ];
      quote = thiefQuotes[Math.floor(Math.random() * thiefQuotes.length)];
      effectText = '🗡️ Rogue!';
    } else if (follower.isCaptive && follower.isFreed) {
      quote = `"Thank you again for releasing me from that cage! Let's cleanse these dark ruins together!"`;
      effectText = '🔓 Freed!';
    } else {
      const genericQuotes = [
        `"With you to the end, adventurer! Let's conquer these levels."`,
        `"Lead on! I'll be right behind you to watch our rear."`,
        `"An honor to fight by your side. What's our next target?"`,
        `"We make quite the team, don't we? Let's find some legendary treasure!"`,
        `"We've survived this far. Together, we're completely unstoppable!"`
      ];
      quote = genericQuotes[Math.floor(Math.random() * genericQuotes.length)];
      effectText = '🤝 Ally!';
    }

    // Add speech message to the log
    const normTime = gameState.gameTime % 1440;
    const { timeStr } = formatGameTime(normTime);
    
    setGameState(prev => {
      const truncatedLogs = prev.logs.length > 35 ? prev.logs.slice(1) : prev.logs;
      return {
        ...prev,
        logs: [
          ...truncatedLogs,
          {
            id: `talk_fol_${Date.now()}_${Math.random()}`,
            text: `🗣️ [Companion] ${follower.name} says: ${quote}`,
            type: 'info',
            timestamp: timeStr
          }
        ]
      };
    });

    // Spawn floating interaction text
    const talkEvent = new CustomEvent('spawn-game-effect', {
      detail: { x: follower.x, y: follower.y, text: effectText, type: 'heal' },
    });
    window.dispatchEvent(talkEvent);
  }, [gameState.followers, gameState.gameTime, playSound, setGameState]);

  const interactWithNpc = useCallback((npc: NPC) => {
    playSound('loot');
    const normTime = gameState.gameTime % 1440;
    const hr = Math.floor(normTime / 60);
    const isNight = hr >= 21 || hr < 7;
    let text = '';
    
    // 1. QUEST BOARD
    if (npc.role === ('quest_board' as any)) {
      setGameState(prev => ({ ...prev, activeQuestBoardOpen: true }));
      addLogMessage('📜 You examine the Oakhaven notice Quest Board.', 'system');
      return;
    }

    // 2. COMPANION HIRE
    if (npc.role === ('companion_hire' as any)) {
      if (gameState.followers.length >= 3) {
        addLogMessage('🗣| Sade says: "Your party is full! You can only manage up to 3 companions."', 'system');
        return;
      }

      const cost = 180;
      if (gameState.playerStats.gold < cost) {
        addLogMessage(`🗣| ${npc.name} says: "I require ${cost} Gold to pledge my steel. You look a bit short on pouch."`, 'system');
        return;
      }

      // Process hire
      setGameState((prev) => {
        const isGuard = npc.char === '🛡';
        const rep = prev.townReputation !== undefined ? prev.townReputation : 100;
        const isEliteGuard = isGuard && rep >= 81;

        const nextFollower: Follower = {
          id: `fol_${Date.now()}`,
          name: isEliteGuard ? `${npc.name.split(' (')[0]} (Elite Shield Guard)` : npc.name.split(' (')[0],
          archetypeId: isGuard ? 'guard' : 'thief',
          role: 'follower',
          char: npc.char,
          color: isEliteGuard ? '#f59e0b' : npc.color,
          hp: isEliteGuard ? 65 : (isGuard ? 40 : 30),
          maxHp: isEliteGuard ? 65 : (isGuard ? 40 : 30),
          atk: isEliteGuard ? 10 : (isGuard ? 6 : 5),
          def: isEliteGuard ? 6 : (isGuard ? 3 : 1),
          level: isEliteGuard ? 4 : 1,
          xp: 0,
          xpNext: 100,
          mode: 'follow',
          equipment: { weapon: null, armor: null },
          inventory: [],
          injuries: [],
          personality: isEliteGuard 
            ? 'Elite heavy-plate peacekeeper sworn to defend the Sunder Champion.' 
            : (isGuard ? 'Shield-bearer defender' : 'Agile critical lockpicker'),
          temperament: 'Loyal'
        };

        // Remove from town npcs lists
        const nextNpcs = prev.npcs.filter(n => n.id !== npc.id);

        const newActor: Enemy = {
          id: `actor_${nextFollower.id}`,
          x: npc.x,
          y: npc.y,
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
          isElite: isEliteGuard,
          patrolPath: [],
          patrolIndex: 0,
          debuffs: [],
          isFollower: true,
          followerId: nextFollower.id
        };

        const logsText = isEliteGuard 
          ? `👥 COMPANION JOINED: ${nextFollower.name} pledged heavy plate steel to the Champion! (-${cost} Gold)`
          : `👥 COMPANION JOINED: ${nextFollower.name} joins your party! (-${cost} Gold)`;

        return {
          ...prev,
          playerStats: {
            ...prev.playerStats,
            gold: Math.max(0, prev.playerStats.gold - cost)
          },
          followers: [...prev.followers, nextFollower],
          enemies: [...prev.enemies, newActor],
          npcs: nextNpcs,
          logs: [...prev.logs, {
            id: `hire_${Date.now()}`,
            text: logsText,
            type: 'loot',
            timestamp: 'RECRUIT'
          }]
        };
      });

      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: npc.x, y: npc.y, text: `👥 Allied!`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);
      return;
    }

    // 2.5 SPECIAL CAT HIRE
    if (npc.role === 'special_cat') {
      if (gameState.followers.length >= 3) {
        addLogMessage(`🐈 ${npc.name} meows softly: "Your party is full! You can only manage up to 3 companions."`, 'system');
        return;
      }

      setGameState((prev) => {
        const catName = npc.name.split(' (')[0];
        let catPersonality = 'Elusive Legendary Town Cat';
        let catTemperament = 'Loyal but Flee-prone';
        let catHp = 15;
        let catAtk = 2;
        let catDef = 0;

        if (catName === 'Alli') {
          catPersonality = 'Royal Silver Cat';
          catTemperament = 'Dignified & Regal';
          catHp = 15;
          catAtk = 2;
          catDef = 1;
        } else if (catName === 'Leevi') {
          catPersonality = 'Eternally Angry Battle Cat';
          catTemperament = 'Fierce, Aggressive & Grumpy';
          catHp = 12;
          catAtk = 5;
          catDef = 0;
        } else if (catName === 'Pulla') {
          catPersonality = 'True Loyal Companion';
          catTemperament = 'Warm, Trusting & Obedient';
          catHp = 18;
          catAtk = 2;
          catDef = 1;
        } else if (catName === 'Jekku') {
          catPersonality = 'Playful Orange Trickster';
          catTemperament = 'Mischievous & Energetic';
          catHp = 15;
          catAtk = 3;
          catDef = 0;
        }

        const nextFollower: Follower = {
          id: `fol_${Date.now()}`,
          name: catName,
          archetypeId: 'cat',
          role: 'follower',
          char: npc.char,
          color: npc.color,
          hp: catHp,
          maxHp: catHp,
          atk: catAtk,
          def: catDef,
          level: 1,
          xp: 0,
          xpNext: 100,
          mode: 'follow',
          equipment: { weapon: null, armor: null },
          inventory: [],
          injuries: [],
          personality: catPersonality,
          temperament: catTemperament
        };

        const nextNpcs = prev.npcs.filter(n => n.id !== npc.id);

        const newActor: Enemy = {
          id: `actor_${nextFollower.id}`,
          x: npc.x,
          y: npc.y,
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
          isElite: false,
          patrolPath: [],
          patrolIndex: 0,
          debuffs: [],
          isFollower: true,
          followerId: nextFollower.id
        };

        const catSpawns = prev.spawnedCats ? [...prev.spawnedCats] : [];
        if (!catSpawns.includes(catName)) {
          catSpawns.push(catName);
        }

        return {
          ...prev,
          followers: [...prev.followers, nextFollower],
          enemies: [...prev.enemies, newActor],
          npcs: nextNpcs,
          spawnedCats: catSpawns,
          logs: [...prev.logs, {
            id: `hire_cat_${Date.now()}`,
            text: `🐈 LEGENDARY COMPANION JOINED: ${nextFollower.name} decides to accompany you on your adventure!`,
            type: 'loot',
            timestamp: 'RECRUIT'
          }]
        };
      });

      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: npc.x, y: npc.y, text: `🐾 Purr!`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);
      return;
    }

    // 3. BOAT JOURNEY PASSAGE
    if (npc.role === ('harbor_captain' as any)) {
      if (gameState.playerStats.gold < 200) {
        addLogMessage(`🗣️ Captain Jack says: "Paid passage fare is 200 Gold coins. No free loading!"`, 'system');
        return;
      }

      const inHarbor = (gameState.currentChunkX === 3 && gameState.currentChunkY === -2);
      const targetCx = inHarbor ? 0 : 3;
      const targetCy = inHarbor ? 0 : -2;
      const destName = inHarbor ? 'Oakhaven Hamlet' : 'Vanguard Harbor Port';

      setGameState((prev) => {
        // Advanced game clock 8 hours (480 minutes)
        const advancedTime = (prev.gameTime + 480) % 1440;
        const nextLogs = [...prev.logs, {
          id: `sail_${Date.now()}`,
          text: `⛵ Captain Jack hoists the anchors! You sail across cresting waves to ${destName}... (-400 Gold, 8 hours passage time)`,
          type: 'info' as const,
          timestamp: 'VOYAGE'
        }];

        const curKey = `${prev.currentChunkX},${prev.currentChunkY}`;
        const nextOverworldChunks = prev.overworldChunks ? { ...prev.overworldChunks } : {};
        if (nextOverworldChunks[curKey]) {
          nextOverworldChunks[curKey] = {
            ...nextOverworldChunks[curKey],
            enemies: prev.enemies,
            corpses: prev.corpses || [],
            bloodSplatters: prev.bloodSplatters || [],
            props: prev.dungeonProps || []
          };
        }

        const targetChunkKey = `${targetCx},${targetCy}`;
        let targetChunk = prev.overworldChunks?.[targetChunkKey];
        let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
        let nextOverworldChunksUpdated = { ...nextOverworldChunks };
        if (!targetChunk) {
          targetChunk = generateOverworldChunk(targetCx, targetCy, LEVEL_WIDTH, LEVEL_HEIGHT, nextSpawnedCats, prev.spawnedSeppo, prev.playerStats, prev.currentWeapon);
          nextOverworldChunksUpdated[targetChunkKey] = targetChunk;
        }

        const destPx = 10;
        const destPy = 12;
        const fov = computeFOV(destPx, destPy, targetChunk.map, 6);
        const discovered = targetChunk.map.map((row, y) =>
          row.map((cell, x) => ((targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
        );

        return {
          ...prev,
          currentChunkX: targetCx,
          currentChunkY: targetCy,
          playerX: destPx, 
          playerY: destPy,
          isOverworld: true,
          overworldChunks: nextOverworldChunksUpdated,
          map: targetChunk.map,
          discovered: discovered,
          visible: fov,
          enemies: spawnFollowersOnLevelLoadByReset(targetChunk.enemies, prev.followers, destPx, destPy, targetChunk.map, prev.activeCompanionQuests),
          traps: targetChunk.traps,
          chests: targetChunk.chests,
          npcs: targetChunk.npcs,
          lootPiles: targetChunk.lootPiles || [],
          corpses: targetChunk.corpses || [],
          bloodSplatters: targetChunk.bloodSplatters || [],
          dungeonProps: targetChunk.props || [],
          gameTime: advancedTime,
          playerStats: {
            ...prev.playerStats,
            gold: Math.max(0, prev.playerStats.gold - 400)
          },
          logs: nextLogs
        };
      });

      combatVfxEngine.clearAll();

      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: npc.x, y: npc.y, text: `⛵ Set Sail!`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);
      return;
    }

    if (npc.role === 'traveler_herbalist' || npc.role === 'traveler_hunter' || npc.role === 'traveler_pilgrim') {
      setActiveTravelerNpc(npc);
      addLogMessage(`🧭 You approach ${npc.name} resting in the Sunder wilderness.`, 'system');
      return;
    }

    if ((npc.role as any) === 'drunk_villager') {
      setActiveDrunkNpc(npc);
      addLogMessage(`🍻 You pull up a wooden stool to sit with ${npc.name}.`, 'system');
      return;
    }

    if (isNight && npc.isAsleep) {
      text = npc.dialogue?.[3] || "Zzz... resting after a long day...";
      addLogMessage(`🗣️ ${npc.name} dreams: "${text}"`, 'system');
      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: npc.x, y: npc.y, text: `💤 Zzz...`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);
    } else {
      setActiveDialogueNpc(npc);
      addLogMessage(`🗣️ You strike up a conversation with ${npc.name}.`, 'system');
      const talkEvent = new CustomEvent('spawn-game-effect', {
        detail: { x: npc.x, y: npc.y, text: `🗣️ Hello!`, type: 'heal' },
      });
      window.dispatchEvent(talkEvent);
    }
  }, [
    gameState.gameTime,
    gameState.followers.length,
    gameState.playerStats.gold,
    gameState.currentChunkX,
    gameState.currentChunkY,
    playSound,
    addLogMessage,
    setGameState,
    setActiveTravelerNpc,
    setActiveDrunkNpc,
    setActiveDialogueNpc,
    spawnFollowersOnLevelLoadByReset,
  ]);

  return {
    handleOpenNpcTrade,
    interactWithNpc,
    interactWithFollower,
  };
}
