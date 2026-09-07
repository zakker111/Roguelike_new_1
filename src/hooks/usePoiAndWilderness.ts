import { Dispatch, SetStateAction, useCallback } from 'react';
import { GameState, NPC, Enemy, EnemyState, EnemyType, TileType, OverworldChunk } from '../types';
import { PoiType } from '../components/PoiInteractionOverlay';
import { LEVEL_WIDTH, LEVEL_HEIGHT, findNearestSafePlayerTile } from '../utils/gameUtils';
import { computeFOV } from '../utils/ai';
import { generateOverworldChunk, formatGameTime } from '../utils/overworld';
import { getRandomRelicDraft, SanctumRelic } from '../utils/relics';
import { analyzeCampsiteSurroundings, rollWildernessAmbush } from '../utils/wildernessCamping';
import { spawnFollowersOnLevelLoadByReset } from '../utils/dungeon';
import { combatVfxEngine } from '../canvas/combatVfxEngine';

export interface UsePoiAndWildernessParams {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
  setActiveTab: Dispatch<SetStateAction<'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary' | 'chronicles'>>;
  activeTravelerNpc: NPC | null;
  setActiveTravelerNpc: (npc: NPC | null) => void;
  activePoi: PoiType | null;
  setActivePoi: (poi: PoiType | null) => void;
  setIsSleepOpen: (open: boolean) => void;
  setActiveRelicDraft: (draft: any) => void;
  executeEnemiesTurn: (px: number, py: number) => void;
  gameConfig: {
    levelUpBonuses: {
      xpThresholdMultiplier: number;
      maxHp: number;
      maxMp: number;
      atk: number;
      def: number;
      attributePoints: number;
    };
  };
}

export function usePoiAndWilderness({
  gameState,
  setGameState,
  addLogMessage,
  playSound,
  setActiveTab,
  activeTravelerNpc,
  setActiveTravelerNpc,
  activePoi,
  setActivePoi,
  setIsSleepOpen,
  setActiveRelicDraft,
  executeEnemiesTurn,
  gameConfig,
}: UsePoiAndWildernessParams) {

  const handleConfirmSleep = useCallback((hours: number, hpHealed: number, mpHealed: number) => {
    setIsSleepOpen(false);

    setGameState((prev) => {
      const analysis = analyzeCampsiteSurroundings(prev);
      const ambushResult = rollWildernessAmbush(prev, hours, analysis);

      if (ambushResult.isAmbushed) {
        // Sleep interrupted by nocturnal ambush!
        const passedHours = ambushResult.interruptedHour;
        const advancedTime = (prev.gameTime + passedHours * 60) % 1440;
        const formattedTime = formatGameTime(advancedTime).timeStr;

        const partialHpRatio = passedHours / hours;
        const partialHp = Math.max(1, Math.round(hpHealed * partialHpRatio));
        const partialMp = Math.max(1, Math.round(mpHealed * partialHpRatio));

        const nextStats = {
          ...prev.playerStats,
          hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + partialHp),
          mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + partialMp),
          exhaustion: Math.max(0, (prev.playerStats.exhaustion || 0) - passedHours * 20),
        };

        playSound('bump');
        const nextLogs = [...prev.logs];
        nextLogs.push({
          id: `ambush_${Date.now()}`,
          text: ambushResult.alertMessage,
          type: 'danger' as const,
          timestamp: formattedTime
        });

        // Add ambush predators to room
        const nextEnemies = [...prev.enemies, ...ambushResult.enemies];

        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: prev.playerX, y: prev.playerY, text: `💥 AMBUSH!`, type: 'crit' },
        });
        window.dispatchEvent(ev);

        return {
          ...prev,
          playerStats: nextStats,
          gameTime: advancedTime,
          enemies: nextEnemies,
          logs: nextLogs,
        };
      }

      // Peaceful sleep completed!
      const advancedTime = (prev.gameTime + hours * 60) % 1440;
      const formattedTime = formatGameTime(advancedTime).timeStr;

      const nextStats = {
        ...prev.playerStats,
        hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + hpHealed),
        mp: Math.min(prev.playerStats.maxMp, prev.playerStats.mp + mpHealed),
        exhaustion: 0, // Fully purges exhaustion!
      };
      const currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      const nextRep = Math.min(100, currentRep + hours * 10);
      let nextGuardsHostile = prev.areGuardsHostile;
      const nextLogs = [...prev.logs];
      if (nextGuardsHostile && nextRep >= 50) {
        nextGuardsHostile = false;
        nextLogs.push({
          id: `pardon_${Date.now()}`,
          text: `⚖️ [TOWN NOTICE]: Your crimes have been pardoned over your period of rest! Town guards are no longer hostile.`,
          type: 'info' as const,
          timestamp: formattedTime
        });
      }

      // Add positive resting buff based on shelter
      let restingBuff = prev.activeFoodBuff;
      if (analysis.shelterType === 'field_tent') {
        restingBuff = {
          name: '⛺ Insulated Field Rest',
          description: 'Refreshed and insulated from the elements. +2 Defense and +1 Movement Speed.',
          atkBonus: 0,
          defBonus: 2,
          critBonus: 0,
          speedBonus: 1,
          turnsRemaining: 50
        };
      } else if (analysis.shelterType === 'campfire') {
        restingBuff = {
          name: '🔥 Campfire Hearth Warmth',
          description: 'Basked in the soothing heat of the campfire. +3 Attack Power.',
          atkBonus: 3,
          defBonus: 0,
          critBonus: 0.05,
          speedBonus: 0,
          turnsRemaining: 40
        };
      }

      playSound('loot');
      nextLogs.push({
        id: `rest_${Date.now()}`,
        text: `🛏️ [${analysis.title}]: You slept peacefully for ${hours} hour(s) until ${formattedTime}. Restored +${hpHealed} HP and +${mpHealed} MP!`,
        type: 'loot' as const,
        timestamp: formattedTime
      });

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: prev.playerX, y: prev.playerY, text: `Rested +${hpHealed} HP! 💤`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        playerStats: nextStats,
        gameTime: advancedTime,
        townReputation: nextRep,
        areGuardsHostile: nextGuardsHostile,
        activeFoodBuff: restingBuff,
        logs: nextLogs,
      };
    });
  }, [setIsSleepOpen, setGameState, playSound]);

  const handleDrunkNpcEffects = useCallback((effects: {
    logText: string;
    goldChange: number;
    hpChange?: number;
    mpChange?: number;
    addMaterials?: { [matId: string]: number };
    addCatalysts?: { [catId: string]: number };
    spawnEffectText: string;
    spawnEffectType: 'heal' | 'damage' | 'xp' | 'gold' | 'loot';
    buff?: {
      name: string;
      type: 'atk' | 'crit' | 'def' | 'speed';
      atkBonus?: number;
      critBonus?: number;
      defBonus?: number;
      turnsRemaining: number;
    };
  }) => {
    addLogMessage(effects.logText, 'loot');

    if (effects.spawnEffectText) {
      const ev = new CustomEvent('spawn-game-effect', {
        detail: {
          x: gameState.playerX,
          y: gameState.playerY,
          text: effects.spawnEffectText,
          type: effects.spawnEffectType || 'heal'
        },
      });
      window.dispatchEvent(ev);
    }

    setGameState((prev) => {
      const nextStats = { ...prev.playerStats };
      nextStats.gold = Math.max(0, nextStats.gold + effects.goldChange);
      if (effects.hpChange) {
        nextStats.hp = Math.min(nextStats.maxHp, Math.max(1, nextStats.hp + effects.hpChange));
      }
      if (effects.mpChange) {
        nextStats.mp = Math.min(nextStats.maxMp, Math.max(0, nextStats.mp + effects.mpChange));
      }

      const nextMats = { ...prev.inventoryMaterials };
      if (effects.addMaterials) {
        Object.entries(effects.addMaterials).forEach(([matId, qty]) => {
          nextMats[matId] = (nextMats[matId] || 0) + qty;
        });
      }

      const nextCats = { ...prev.inventoryCatalysts };
      if (effects.addCatalysts) {
        Object.entries(effects.addCatalysts).forEach(([catId, qty]) => {
          nextCats[catId] = (nextCats[catId] || 0) + qty;
        });
      }

      const nextFoodBuff = effects.buff
        ? {
            name: effects.buff.name,
            description: `Culinary & brewing blessing (+${effects.buff.atkBonus || effects.buff.defBonus || effects.buff.critBonus || 0})`,
            atkBonus: effects.buff.atkBonus || 0,
            defBonus: effects.buff.defBonus || 0,
            critBonus: effects.buff.critBonus || 0,
            speedBonus: 0,
            turnsRemaining: effects.buff.turnsRemaining,
          }
        : prev.activeFoodBuff;

      return {
        ...prev,
        playerStats: nextStats,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        activeFoodBuff: nextFoodBuff,
      };
    });
  }, [gameState.playerX, gameState.playerY, addLogMessage, setGameState]);

  const handleTravelerAttack = useCallback((witnessed: boolean) => {
    if (!activeTravelerNpc) return;
    const traveler = activeTravelerNpc;
    setActiveTravelerNpc(null);

    playSound('slash');

    setGameState((prev) => {
      let hp = 50;
      let maxHp = 50;
      let atk = 7;
      let def = 2;
      let range = 1;
      let color = traveler.color;
      let char = traveler.char;

      if (traveler.role === 'traveler_herbalist') {
        hp = 45;
        maxHp = 45;
        atk = 5;
        def = 1;
        range = 1;
      } else if (traveler.role === 'traveler_hunter') {
        hp = 60;
        maxHp = 60;
        atk = 9;
        def = 3;
        range = 4;
      } else if (traveler.role === 'traveler_pilgrim') {
        hp = 50;
        maxHp = 50;
        atk = 7;
        def = 2;
        range = 1;
      }

      const newEnemy: Enemy = {
        id: `enemy_traveler_${Date.now()}`,
        x: traveler.x,
        y: traveler.y,
        type: 'Goblin',
        name: traveler.name.split(' (')[0],
        hp,
        maxHp,
        atk,
        def,
        range,
        speed: 1,
        color,
        char,
        state: EnemyState.Chasing,
        isElite: false,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      };

      const updatedNpcs = prev.npcs.filter(n => n.id !== traveler.id);
      let currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      let nextRep = currentRep;
      const nextLogs = [...prev.logs];

      let questIdToFail = '';
      if (traveler.role === 'traveler_herbalist') questIdToFail = 'q_traveler_herbalist_mushrooms';
      else if (traveler.role === 'traveler_hunter') questIdToFail = 'q_traveler_hunter_pelts';
      else if (traveler.role === 'traveler_pilgrim') questIdToFail = 'q_traveler_pilgrim_relic';

      const updatedQuests = prev.quests.map((q) => {
        if (q.id === questIdToFail && (q.status === 'active' || q.status === 'available')) {
          return { ...q, status: 'failed' as const };
        }
        return q;
      });

      const associatedQuest = prev.quests.find(q => q.id === questIdToFail);
      if (associatedQuest && (associatedQuest.status === 'active' || associatedQuest.status === 'available')) {
        nextLogs.push({
          id: `quest_failed_${Date.now()}`,
          text: `❌ QUEST FAILED: "${associatedQuest.title}" has failed because you chose to assault the quest giver!`,
          type: 'danger' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      if (witnessed) {
        nextRep = Math.max(0, currentRep - 35);
        nextLogs.push({
          id: `unlawful_traveler_${Date.now()}`,
          text: `⚖️ [WITNESSED CRIME]: You assaulted ${newEnemy.name} in broad daylight! Nearby witnesses reported your crime to the authorities! Your reputation with Sunder settlements plummeted (-35 Town Rep)!`,
          type: 'danger' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      } else {
        nextLogs.push({
          id: `stealth_traveler_${Date.now()}`,
          text: `🤫 [UNWITNESSED ASSAULT]: You assault ${newEnemy.name} in absolute silence. Sunder's cold mountain winds swallow their cries... No witnesses are around to report your crime.`,
          type: 'info' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      return {
        ...prev,
        npcs: updatedNpcs,
        enemies: [...prev.enemies, newEnemy],
        townReputation: nextRep,
        logs: nextLogs,
        quests: updatedQuests
      };
    });

    setTimeout(() => {
      executeEnemiesTurn(gameState.playerX, gameState.playerY);
    }, 100);
  }, [activeTravelerNpc, gameState.playerX, gameState.playerY, setActiveTravelerNpc, playSound, setGameState, executeEnemiesTurn]);

  const handleTravelerTrade = useCallback(() => {
    if (!activeTravelerNpc) return;
    const traveler = activeTravelerNpc;

    setGameState(prev => ({
      ...prev,
      activeTradeNpcId: traveler.id
    }));
    setActiveTab('market');
    addLogMessage(`🛒 Trading store opened with ${traveler.name}! Buy equipment or sell materials and excess gear.`, 'craft');
  }, [activeTravelerNpc, setGameState, setActiveTab, addLogMessage]);

  const handlePoiChoiceSelected = useCallback((
    poiId: string,
    choiceId: string,
    effects: {
      logText: string;
      hpChange?: number;
      mpChange?: number;
      maxHpChange?: number;
      maxMpChange?: number;
      xpChange?: number;
      goldChange?: number;
      defChange?: number;
      unspentPointsChange?: number;
      reputationChange?: number;
      addMaterials?: { [matId: string]: number };
      addCatalysts?: { [catId: string]: number };
      spawnEffectText?: string;
      spawnEffectType?: 'heal' | 'damage' | 'xp' | 'gold';
    }
  ) => {
    setActivePoi(null);

    // Add log message
    addLogMessage(effects.logText, 'loot');

    // Spawn event effect if specified
    if (effects.spawnEffectText) {
      const ev = new CustomEvent('spawn-game-effect', {
        detail: {
          x: gameState.playerX,
          y: gameState.playerY,
          text: effects.spawnEffectText,
          type: effects.spawnEffectType || 'heal'
        },
      });
      window.dispatchEvent(ev);
    }

    setGameState((prev) => {
      // 1. Update POI isInteracted state in the current chunk
      const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const activeChunk = prev.overworldChunks[chunkKey];
      let nextChunks = { ...prev.overworldChunks };
      if (activeChunk && activeChunk.pois) {
        const updatedPois = activeChunk.pois.map((poi) => {
          if (poi.id === poiId) {
            return { ...poi, isInteracted: true };
          }
          return poi;
        });
        nextChunks[chunkKey] = {
          ...activeChunk,
          pois: updatedPois
        };
      }

      // 2. Unlock History Scroll Chapter
      const currentChapters = prev.unlockedChapters || [];
      const matchedPoi = activeChunk?.pois?.find(p => p.id === poiId);
      const nextChapters = matchedPoi && !currentChapters.includes(matchedPoi.chapterId)
        ? [...currentChapters, matchedPoi.chapterId]
        : currentChapters;

      // 3. Update player stats (HP, MP, MaxHP, MaxMP, XP, Gold, DEF, Unspent Points, Level-up)
      const bonuses = gameConfig.levelUpBonuses;
      let maxHp = prev.playerStats.maxHp + (effects.maxHpChange || 0);
      let maxMp = prev.playerStats.maxMp + (effects.maxMpChange || 0);
      let hp = Math.min(maxHp, Math.max(1, prev.playerStats.hp + (effects.hpChange || 0)));
      let mp = Math.min(maxMp, Math.max(0, prev.playerStats.mp + (effects.mpChange || 0)));
      let xp = prev.playerStats.xp + (effects.xpChange || 0);
      let gold = Math.max(0, prev.playerStats.gold + (effects.goldChange || 0));
      let def = prev.playerStats.def + (effects.defChange || 0);
      let unspent = (prev.playerStats.unspentPoints || 0) + (effects.unspentPointsChange || 0);
      let level = prev.playerStats.level;
      let nextThreshold = prev.playerStats.nextLevelXp;
      let atk = prev.playerStats.atk;

      while (xp >= nextThreshold) {
        level += 1;
        xp -= nextThreshold;
        nextThreshold = Math.floor(nextThreshold * bonuses.xpThresholdMultiplier);
        maxHp += bonuses.maxHp;
        hp = maxHp;
        maxMp += bonuses.maxMp;
        mp = maxMp;
        atk += bonuses.atk;
        def += bonuses.def;
        unspent += bonuses.attributePoints;
        addLogMessage(`🌟 LEVEL UP! You reached Level ${level}! Got +${bonuses.attributePoints} Attribute Points to spend! (+${bonuses.maxHp} Max HP, +${bonuses.maxMp} Max MP, +${bonuses.def} DEF, +${bonuses.atk} ATK)`, 'craft');
        
        // Spawn graphic / sound
        setTimeout(() => {
          playSound('levelUp');
        }, 120);

        // Trigger Sanctum Relics Draft
        setTimeout(() => {
          setGameState(current => {
            const currentRelics = current.playerStats.relics || [];
            const draft = getRandomRelicDraft(3, currentRelics);
            setActiveRelicDraft(draft);
            return current;
          });
        }, 300);
      }

      // 4. Update Town Reputation
      const currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      const nextRep = Math.min(100, Math.max(0, currentRep + (effects.reputationChange || 0)));
      let nextGuardsHostile = prev.areGuardsHostile;
      const nextLogs = [...prev.logs];
      if (nextGuardsHostile && nextRep >= 50) {
        nextGuardsHostile = false;
        nextLogs.push({
          id: `pardon_${Date.now()}`,
          text: `⚖️ [TOWN NOTICE]: Your crimes have been pardoned over reputation restoration! Town guards are no longer hostile.`,
          type: 'info' as const,
          timestamp: formatGameTime(prev.gameTime).timeStr
        });
      }

      // 5. Update Materials inventory
      const nextMats = { ...prev.inventoryMaterials };
      if (effects.addMaterials) {
        Object.entries(effects.addMaterials).forEach(([matId, count]) => {
          nextMats[matId] = (nextMats[matId] || 0) + count;
        });
      }

      // 6. Update Catalysts inventory
      const nextCats = { ...prev.inventoryCatalysts };
      if (effects.addCatalysts) {
        Object.entries(effects.addCatalysts).forEach(([catId, count]) => {
          nextCats[catId] = (nextCats[catId] || 0) + count;
        });
      }

      let activeEffectsList = prev.playerStats.activeEffects ? [...prev.playerStats.activeEffects] : [];
      if ((effects as any).applyBlessed) {
        activeEffectsList = activeEffectsList.filter(e => e.id !== 'blessed');
        activeEffectsList.push({
          id: 'blessed',
          name: 'Blessed',
          type: 'buff',
          icon: '✨',
          description: 'Blessed by ley-well spirits. Increases critical strike rate by +10% and luck by +5.',
          turnsRemaining: 30,
          color: '#38bdf8',
          statModifiers: {
            crit: 0.10,
            lck: 5
          }
        });
      }
      if ((effects as any).applyShielded) {
        activeEffectsList = activeEffectsList.filter(e => e.id !== 'shielded');
        activeEffectsList.push({
          id: 'shielded',
          name: 'Shielded',
          type: 'buff',
          icon: '🛡️',
          description: 'A magical kinetic barrier absorbs hits. Increases defense by +3.',
          turnsRemaining: 25,
          color: '#2dd4bf',
          statModifiers: {
            def: 3
          }
        });
      }

      return {
        ...prev,
        overworldChunks: nextChunks,
        unlockedChapters: nextChapters,
        townReputation: nextRep,
        areGuardsHostile: nextGuardsHostile,
        inventoryMaterials: nextMats,
        inventoryCatalysts: nextCats,
        logs: nextLogs,
        playerStats: {
          ...prev.playerStats,
          level,
          xp,
          nextLevelXp: nextThreshold,
          hp,
          maxHp,
          mp,
          maxMp,
          gold,
          atk,
          def,
          unspentPoints: unspent,
          activeEffects: activeEffectsList
        }
      };
    });
  }, [
    gameState.playerX,
    gameState.playerY,
    setActivePoi,
    addLogMessage,
    gameConfig,
    playSound,
    setActiveRelicDraft,
    setGameState,
  ]);

  const handleAttuneWaystone = useCallback((poiId: string) => {
    setGameState(prev => {
      const currentAttuned = prev.attunedWaystones || [];
      if (currentAttuned.includes(poiId)) return prev;
      const nextAttuned = [...currentAttuned, poiId];
      const nextChunks = { ...prev.overworldChunks };
      Object.keys(nextChunks).forEach(ckey => {
        const chunk = nextChunks[ckey];
        if (chunk.pois) {
          chunk.pois = chunk.pois.map(p => p.id === poiId ? { ...p, isAttunedWaystone: true } : p);
        }
      });
      return {
        ...prev,
        attunedWaystones: nextAttuned,
        overworldChunks: nextChunks
      };
    });
    if (activePoi && activePoi.id === poiId) {
      setActivePoi({ ...activePoi, isAttunedWaystone: true });
    }
  }, [activePoi, setActivePoi, setGameState]);

  const handleWaystoneFastTravel = useCallback((
    targetChunkX: number,
    targetChunkY: number,
    targetX: number,
    targetY: number,
    targetName: string
  ) => {
    setActivePoi(null);
    setGameState((prev) => {
      const currentChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const oldChunk = prev.overworldChunks[currentChunkKey];
      const isSecondFloorActive = (prev.overworldZ || 0) === 1;

      // Preserve origin overworld chunk if fast traveling from overworld
      let updatedChunks: Record<string, OverworldChunk> = { ...prev.overworldChunks };
      if (prev.isOverworld) {
        updatedChunks[currentChunkKey] = {
          chunkX: prev.currentChunkX,
          chunkY: prev.currentChunkY,
          map: isSecondFloorActive ? (oldChunk?.map || prev.map) : prev.map,
          discovered: isSecondFloorActive ? (oldChunk?.discovered || prev.discovered) : prev.discovered,
          visible: isSecondFloorActive ? (oldChunk?.visible || prev.visible) : prev.visible,
          secondFloorMap: isSecondFloorActive ? prev.map : oldChunk?.secondFloorMap,
          secondFloorDiscovered: isSecondFloorActive ? prev.discovered : oldChunk?.secondFloorDiscovered,
          secondFloorVisible: isSecondFloorActive ? prev.visible : oldChunk?.secondFloorVisible,
          enemies: prev.enemies,
          traps: prev.traps,
          chests: prev.chests,
          npcs: prev.npcs,
          lootPiles: prev.lootPiles || [],
          corpses: prev.corpses || [],
          bloodSplatters: prev.bloodSplatters || [],
          props: prev.dungeonProps || [],
          dungeons: oldChunk?.dungeons || [],
          towns: oldChunk?.towns || [],
          biome: prev.biome,
          weather: prev.weather,
          watchtower: oldChunk?.watchtower,
          pois: oldChunk?.pois
        };
      }

      const targetChunkKey = `${targetChunkX},${targetChunkY}`;
      let destChunk = updatedChunks[targetChunkKey];

      if (!destChunk) {
        destChunk = generateOverworldChunk(
          targetChunkX,
          targetChunkY,
          LEVEL_WIDTH,
          LEVEL_HEIGHT,
          prev.spawnedCats || [],
          prev.spawnedSeppo,
          prev.playerStats,
          prev.currentWeapon
        );
        updatedChunks[targetChunkKey] = destChunk;
      }

      const safePlayerPos = findNearestSafePlayerTile(targetX, targetY, destChunk.map);
      const finalPx = safePlayerPos.x;
      const finalPy = safePlayerPos.y;
      const fov = computeFOV(finalPx, finalPy, destChunk.map, 8);
      const discovered = destChunk.map.map((row, y) =>
        row.map((cell, x) => ((destChunk.discovered && destChunk.discovered[y] && destChunk.discovered[y][x]) || (fov && fov[y] && fov[y][x]) || false))
      );

      const nextVisited = { ...prev.visitedTiles };
      nextVisited[`${finalPx},${finalPy},${targetChunkX},${targetChunkY}`] = true;

      const updatedDiscoveredChunks = prev.discoveredChunks instanceof Set
        ? new Set(prev.discoveredChunks).add(targetChunkKey)
        : Array.isArray(prev.discoveredChunks)
        ? [...new Set([...prev.discoveredChunks, targetChunkKey])]
        : { ...(prev.discoveredChunks || {}), [targetChunkKey]: true };

      const nextEnemies = spawnFollowersOnLevelLoadByReset(
        destChunk.enemies,
        prev.followers,
        finalPx,
        finalPy,
        destChunk.map
      );

      addLogMessage(`🌀 [LEYLINE FAST TRAVEL]: Materialized at ${targetName} (${targetChunkX}, ${targetChunkY})!`, 'loot');
      playSound('spell');

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: finalPx, y: finalPy, text: `🌀 TELEPORTED!`, type: 'heal' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        isOverworld: true,
        overworldZ: 0,
        dungeonLevel: 0,
        isStairsModalOpen: false,
        pendingStairsAction: null,
        currentChunkX: targetChunkX,
        currentChunkY: targetChunkY,
        playerX: finalPx,
        playerY: finalPy,
        map: destChunk.map,
        discovered: discovered,
        visible: fov,
        enemies: nextEnemies,
        traps: destChunk.traps,
        chests: destChunk.chests,
        npcs: destChunk.npcs || [],
        lootPiles: destChunk.lootPiles || [],
        corpses: destChunk.corpses || [],
        bloodSplatters: destChunk.bloodSplatters || [],
        dungeonProps: destChunk.props || [],
        overworldChunks: updatedChunks,
        discoveredChunks: updatedDiscoveredChunks,
        visitedTiles: nextVisited,
        biome: destChunk.biome,
        weather: destChunk.weather,
      };
    });

    combatVfxEngine.clearAll();
  }, [setActivePoi, setGameState, addLogMessage, playSound]);

  const handleChallengeBiomeGuardian = useCallback((poi: PoiType) => {
    setActivePoi(null);
    setGameState((prev) => {
      const chunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
      const activeChunk = prev.overworldChunks[chunkKey];
      if (!activeChunk) return prev;

      const spawnOffsets = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
      ];
      let bossX = poi.x + 1;
      let bossY = poi.y;
      for (const off of spawnOffsets) {
        const tx = poi.x + off.dx;
        const ty = poi.y + off.dy;
        if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
          const t = activeChunk.map[ty]?.[tx];
          if (t === TileType.Floor || t === TileType.Grass || t === TileType.Path) {
            bossX = tx;
            bossY = ty;
            break;
          }
        }
      }

      const guardianTypes: { [key: string]: { name: string; hp: number; atk: number; def: number; char: string; color: string } } = {
        shrine: { name: "🌲 Hiisi Grove Warden", hp: 280, atk: 18, def: 8, char: "👹", color: "#10b981" },
        hearth: { name: "🔥 Ilmarinen's Iron Golem", hp: 340, atk: 22, def: 12, char: "🗿", color: "#f97316" },
        monolith: { name: "⚡ Ukko's Storm Sentinel", hp: 320, atk: 21, def: 10, char: "🌩️", color: "#a855f7" },
        sunken_keep: { name: "💀 Tuonela River Wraith", hp: 260, atk: 20, def: 7, char: "👻", color: "#38bdf8" },
        fossil: { name: "🦴 Tectonic Bone Automaton", hp: 300, atk: 19, def: 9, char: "🦕", color: "#e2e8f0" }
      };

      const gData = guardianTypes[poi.type] || guardianTypes.monolith;

      const guardianEnemy: Enemy = {
        id: `guardian_${poi.id}_${Date.now()}`,
        x: bossX,
        y: bossY,
        type: EnemyType.DreadKnight,
        name: gData.name,
        hp: gData.hp,
        maxHp: gData.hp,
        atk: gData.atk,
        def: gData.def,
        range: 1,
        speed: 1,
        state: EnemyState.Chasing,
        isElite: true,
        isBoss: true,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: [],
        char: gData.char,
        color: gData.color,
        dropMaterials: ['mat_mithril', 'mat_ember_core', 'mat_dragonscale'],
        dropCatalysts: ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'],
      };

      const nextEnemies = [...prev.enemies, guardianEnemy];
      const updatedPois = (activeChunk.pois || []).map(p => p.id === poi.id ? { ...p, guardianSpawned: true } : p);
      const nextChunks = {
        ...prev.overworldChunks,
        [chunkKey]: {
          ...activeChunk,
          pois: updatedPois,
          enemies: [...(activeChunk.enemies || []), guardianEnemy]
        }
      };

      addLogMessage(`⚔️ [GUARDIAN TRIAL AWAKENED]: You challenged ${gData.name}! The ancient spirit materializes at (${bossX}, ${bossY})! Prepare for battle!`, 'danger');
      playSound('bossTheme');

      const ev = new CustomEvent('spawn-game-effect', {
        detail: { x: bossX, y: bossY, text: `⚔️ BOSS AWAKENED!`, type: 'damage' },
      });
      window.dispatchEvent(ev);

      return {
        ...prev,
        enemies: nextEnemies,
        overworldChunks: nextChunks
      };
    });
  }, [setActivePoi, setGameState, addLogMessage, playSound]);

  return {
    handleConfirmSleep,
    handleDrunkNpcEffects,
    handleTravelerAttack,
    handleTravelerTrade,
    handlePoiChoiceSelected,
    handleAttuneWaystone,
    handleWaystoneFastTravel,
    handleChallengeBiomeGuardian,
  };
}
