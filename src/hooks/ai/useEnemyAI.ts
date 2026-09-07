import { useCallback } from 'react';
import { Enemy, EnemyState, EnemyType } from '../../types';
import { syncCaravanState } from '../../utils/caravanAndTerritory';
import { UseEnemyAIParams } from './types';
import { resolvePlayerStatusAndEnvironment } from './aiTurnEnvironment';
import { processFollowerTurn } from './useFollowerAI';
import { processTownGuardTurn } from './useTownGuardAI';
import { processHostileTurn } from './useHostileAI';
import { resolveCivilianNpcTurns } from './useCivilianAI';
import { emitAggregatedDamageFloater, checkTacticalCaravanVictory } from './aiCombatAggregator';
import { appendBoundedLogs } from '../../utils/logBuffer';

export function useEnemyAI({
  setGameState,
  playSound,
  hasEquippedTrait,
}: UseEnemyAIParams) {

  // Pathfinding and AI solver for dungeon monsters, followers, guards, and Overworld villagers
  const executeEnemiesTurn = useCallback((px: number, py: number) => {
    setGameState((prev) => {
      // 1. Resolve Player Status Effects, Environment, Weather, Seasons, and Roaming Monster Spawns
      const envRes = resolvePlayerStatusAndEnvironment(prev, px, py, hasEquippedTrait);
      let {
        playerHp,
        playerMp,
        updatedStats,
        updatedEffects,
        nextFoodBuff,
        activeScars,
        nextWeather,
        nextTimeVal,
        nextRep,
        nextGuardsHostile,
        nextRestockTime,
        merchantGoldUpdate,
        merchantStockUpdate,
        nextCorpses,
        nextSplatters,
        gmStateUpdates,
        staticLogs,
        nextEnemies
      } = envRes;

      let nextCaravanTravel = prev.caravanTravel;
      let nextDefeatedCounts = prev.defeatedEnemiesCount ? { ...prev.defeatedEnemiesCount } : {};
      let nextArmor = prev.equippedArmor;
      let nextHelmet = prev.equippedHelmet;
      let nextGloves = prev.equippedGloves;
      let nextBoots = prev.equippedBoots;
      let nextShield = prev.equippedShield;
      let nextNpcs = prev.npcs ? [...prev.npcs] : [];
      let nextFollowers = prev.followers ? prev.followers.map(f => ({ ...f })) : [];
      const nextTraps = prev.traps ? [...prev.traps] : [];

      // 2. Sync Caravan and Roaming Merchants
      const caravanState = syncCaravanState(prev, nextTimeVal, nextNpcs, nextEnemies);
      nextNpcs = caravanState.npcs;
      nextEnemies = caravanState.enemies;

      // 3. Tavern Brawl Random Encounters
      const nextTurnsPlayed = updatedStats.turnsPlayed;
      if (prev.isOverworld && nextTurnsPlayed % 160 === 0 && Math.random() < 0.15) {
        const eventId = Math.floor(Math.random() * 5);
        if (eventId === 0) {
          const brawlX = 20 + Math.floor(Math.random() * 5);
          const brawlY = 4 + Math.floor(Math.random() * 3);
          nextEnemies.push({
            id: `brawler_${Date.now()}`,
            name: "Drunk Brawler (Bandit)",
            char: "B",
            color: "#f43f5e",
            type: EnemyType.Bandit,
            hp: 20,
            maxHp: 20,
            atk: 4,
            def: 1,
            x: brawlX,
            y: brawlY,
            state: EnemyState.Chasing,
            isElite: false,
            patrolPath: [],
            patrolIndex: 0,
            debuffs: [],
            speed: 1.0,
            range: 1
          });
          staticLogs.push(`🍺 EVENT: A loud brawling fight breaks out at the Inn Tavern! Angry drunkards take to the floor!`);
        }
      }

      // 4. Enemy, Follower & Town Guard Action Processing
      const updatedEnemiesList: Enemy[] = [];
      let incomingPlayerDamage = 0;
      let incomingPlayerHits = 0;
      let hadPlayerCrit = false;
      let hadPlayerBrace = false;
      let lastAttackerX: number | undefined = undefined;
      let lastAttackerY: number | undefined = undefined;

      // Helper to apply damage to an enemy and synchronously update both nextEnemies, updatedEnemiesList, and followers
      const applyDamageToEnemy = (target: Enemy, damage: number): boolean => {
        target.hp -= damage;
        const ne = nextEnemies.find(item => item.id === target.id);
        if (ne) ne.hp = target.hp;
        const ueIndex = updatedEnemiesList.findIndex(item => item.id === target.id);
        if (ueIndex !== -1) {
          updatedEnemiesList[ueIndex].hp = target.hp;
          if (target.hp <= 0) {
            updatedEnemiesList.splice(ueIndex, 1);
          }
        }
        if (target.isFollower) {
          const fol = nextFollowers.find(f => f.id === target.followerId || target.id.includes(f.id));
          if (fol) {
            fol.hp = target.hp;
          }
          if (target.hp <= 0) {
            nextCorpses.push({ x: target.x, y: target.y, char: '%', color: '#94a3b8', name: `${target.name} (Corpse)` });
            nextSplatters.push({ x: target.x, y: target.y, color: '#ef4444' });
          }
        }
        return target.hp <= 0;
      };

      for (let i = 0; i < nextEnemies.length; i++) {
        const e = { ...nextEnemies[i] };
        if (e.hp <= 0) {
          continue;
        }

        if (e.isFollower) {
          // Process Follower Turn
          const folRes = processFollowerTurn({
            e,
            i,
            px,
            py,
            prev,
            nextGuardsHostile,
            nextEnemies,
            updatedEnemiesList,
            updatedStats,
            nextDefeatedCounts,
            staticLogs,
            playSound,
            applyDamageToEnemy,
          });
          nextDefeatedCounts = folRes.nextDefeatedCounts;
          updatedEnemiesList.push(folRes.e);
        } else if (e.isTownGuard && !nextGuardsHostile) {
          // Process Town Guard Turn
          const guardRes = processTownGuardTurn({
            e,
            i,
            px,
            py,
            prev,
            nextEnemies,
            updatedEnemiesList,
            nextDefeatedCounts,
            staticLogs,
            playSound,
            applyDamageToEnemy,
          });
          nextDefeatedCounts = guardRes.nextDefeatedCounts;
          updatedEnemiesList.push(guardRes.e);
        } else {
          // Process Hostile Monster Turn
          const hostileRes = processHostileTurn({
            e,
            i,
            px,
            py,
            playerHp,
            prev,
            nextGuardsHostile,
            nextEnemies,
            updatedEnemiesList,
            updatedStats,
            nextArmor,
            nextHelmet,
            nextGloves,
            nextBoots,
            nextShield,
            activeScars,
            updatedEffects,
            nextCaravanTravel,
            nextDefeatedCounts,
            incomingPlayerDamage,
            incomingPlayerHits,
            hadPlayerCrit,
            hadPlayerBrace,
            lastAttackerX,
            lastAttackerY,
            staticLogs,
            playSound,
            applyDamageToEnemy,
          });

          playerHp = hostileRes.playerHp;
          nextArmor = hostileRes.nextArmor;
          nextHelmet = hostileRes.nextHelmet;
          nextGloves = hostileRes.nextGloves;
          nextBoots = hostileRes.nextBoots;
          nextShield = hostileRes.nextShield;
          activeScars = hostileRes.activeScars;
          updatedEffects = hostileRes.updatedEffects;
          nextCaravanTravel = hostileRes.nextCaravanTravel;
          nextDefeatedCounts = hostileRes.nextDefeatedCounts;
          incomingPlayerDamage = hostileRes.incomingPlayerDamage;
          incomingPlayerHits = hostileRes.incomingPlayerHits;
          hadPlayerCrit = hostileRes.hadPlayerCrit;
          hadPlayerBrace = hostileRes.hadPlayerBrace;
          lastAttackerX = hostileRes.lastAttackerX;
          lastAttackerY = hostileRes.lastAttackerY;

          if (hostileRes.e) {
            updatedEnemiesList.push(hostileRes.e);
          }
        }
      }

      nextEnemies = updatedEnemiesList;

      // 5. Aggregated Incoming Combat Floater Dispatch
      emitAggregatedDamageFloater({
        px,
        py,
        incomingPlayerDamage,
        incomingPlayerHits,
        hadPlayerCrit,
        hadPlayerBrace,
        lastAttackerX,
        lastAttackerY
      });

      // 6. NPC & Civilian Schedule & Routine Movement
      nextNpcs = resolveCivilianNpcTurns({
        nextNpcs,
        nextEnemies,
        updatedEnemiesList,
        prev,
        px,
        py,
        nextGuardsHostile,
        staticLogs,
        applyDamageToEnemy
      });

      // 7. Tactical Caravan Combat Victory Check
      const caravanVictory = checkTacticalCaravanVictory(
        nextCaravanTravel,
        nextEnemies,
        updatedStats,
        staticLogs,
        playSound
      );
      nextCaravanTravel = caravanVictory.nextCaravanTravel;
      updatedStats = caravanVictory.updatedStats;
      const restoredOverworld = caravanVictory.savedOverworldState;

      // 8. Format Game Event Logs
      let finalLogs = prev.logs;
      if (staticLogs.length > 0) {
        const formattedLogs = staticLogs.map((text, idx) => ({
          id: `ai_log_${Date.now()}_${idx}_${Math.random()}`,
          text,
          type: 'system' as const,
          timestamp: 'TURN'
        }));
        finalLogs = appendBoundedLogs(prev.logs, formattedLogs, 200);
      }

      return {
        ...prev,
        ...gmStateUpdates,
        ...(restoredOverworld ? {
          map: restoredOverworld.map,
          discovered: restoredOverworld.discovered,
          visible: restoredOverworld.visible,
          enemies: restoredOverworld.enemies,
          dungeonProps: restoredOverworld.dungeonProps,
          playerX: restoredOverworld.playerX,
          playerY: restoredOverworld.playerY,
          currentChunkX: restoredOverworld.currentChunkX,
          currentChunkY: restoredOverworld.currentChunkY,
        } : {}),
        isBraced: false,
        equippedArmor: nextArmor,
        equippedHelmet: nextHelmet,
        equippedGloves: nextGloves,
        equippedBoots: nextBoots,
        equippedShield: nextShield,
        defeatedEnemiesCount: nextDefeatedCounts,
        gameTime: nextTimeVal,
        weather: nextWeather,
        townReputation: nextRep,
        areGuardsHostile: nextGuardsHostile,
        lastRestockTime: nextRestockTime,
        merchantGold: merchantGoldUpdate,
        merchantStock: merchantStockUpdate,
        activeFoodBuff: nextFoodBuff,
        corpses: nextCorpses,
        bloodSplatters: nextSplatters,
        caravanTravel: nextCaravanTravel,
        followers: nextFollowers.filter(f => f && f.hp > 0),
        enemies: nextEnemies,
        npcs: nextNpcs,
        traps: nextTraps,
        logs: finalLogs,
        playerStats: {
          ...updatedStats,
          hp: Math.max(0, playerHp),
          mp: Math.min(updatedStats.maxMp, Math.max(0, playerMp)),
          scars: activeScars,
          activeEffects: updatedEffects,
        },
      };
    });
  }, [setGameState, hasEquippedTrait]);

  return {
    executeEnemiesTurn,
  };
}
