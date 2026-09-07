import {
  GameState,
  OverworldChunk,
  GameLogMessage,
  Enemy,
  EnemyType,
  EnemyState,
  TileType
} from '../../../types';
import {
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
  findNearestSafePlayerTile
} from '../../../utils/gameUtils';
import { chunkBackgroundCache } from '../../../canvas/chunkBackgroundCache';
import {
  generateOverworldChunk,
  hasTownAtChunk,
  getDeterministicTownName,
  prng,
  asyncChunkBatcher,
  manageActiveChunkWindow,
  ensureChunkDecompressed
} from '../../../utils/overworld';
import { appendBoundedLogs } from '../../../utils/logBuffer';
import { getValidWeatherForBiome } from '../../../utils/weatherEngine';
import { spawnFollowersOnLevelLoadByReset } from '../../../utils/dungeon';
import { computeFOV } from '../../../utils/ai';
import { getSiegeCombatants } from '../../../utils/siegeUtils';
import { combatVfxEngine } from '../../../canvas/combatVfxEngine';

export function handleChunkBorderCrossing(
  gameState: GameState,
  targetX: number,
  targetY: number,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  playSound: (sound: any) => void,
  addLogMessage: (text: string, type?: any) => void,
  executeEnemiesTurn: (px: number, py: number) => void
): boolean {
  if (!gameState.isOverworld) return false;

  let nextCx = gameState.currentChunkX;
  let nextCy = gameState.currentChunkY;
  let crossed = false;
  let newPx = targetX;
  let newPy = targetY;

  if (targetX < 0) {
    nextCx = gameState.currentChunkX - 1;
    newPx = LEVEL_WIDTH - 1;
    crossed = true;
  } else if (targetX >= LEVEL_WIDTH) {
    nextCx = gameState.currentChunkX + 1;
    newPx = 0;
    crossed = true;
  }

  if (targetY < 0) {
    nextCy = gameState.currentChunkY - 1;
    newPy = LEVEL_HEIGHT - 1;
    crossed = true;
  } else if (targetY >= LEVEL_HEIGHT) {
    nextCy = gameState.currentChunkY + 1;
    newPy = 0;
    crossed = true;
  }

  if (!crossed) return false;

  playSound('levelUp');
  addLogMessage(
    `🗺️ Traversing boundary to Chunk (${nextCx}, ${nextCy}). The infinite horizon expands...`,
    'system'
  );

  setTimeout(() => {
    document.getElementById('dungeon-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 150);

  let finalPx = newPx;
  let finalPy = newPy;

  setGameState((prev) => {
    const currentChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
    const oldChunk = prev.overworldChunks[currentChunkKey];
    const isSecondFloorActive = prev.isOverworld && prev.overworldZ === 1;

    const currentChunkCopy: OverworldChunk = {
      chunkX: prev.currentChunkX,
      chunkY: prev.currentChunkY,
      map: isSecondFloorActive ? oldChunk?.map || prev.map : prev.map,
      discovered: isSecondFloorActive ? oldChunk?.discovered || prev.discovered : prev.discovered,
      visible: isSecondFloorActive ? oldChunk?.visible || prev.visible : prev.visible,
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

    const updatedChunks = {
      ...prev.overworldChunks,
      [currentChunkKey]: currentChunkCopy
    };

    const targetChunkKey = `${nextCx},${nextCy}`;
    let targetChunk = updatedChunks[targetChunkKey];
    if (targetChunk) {
      targetChunk = ensureChunkDecompressed(targetChunk);
    }
    let nextSpawnedCats = prev.spawnedCats ? [...prev.spawnedCats] : [];
    let hasSeppoOnLoad = false;
    let newlyDiscoveredTown = false;
    const newMsgs: GameLogMessage[] = [];
    if (!targetChunk) {
      if (asyncChunkBatcher.hasCachedChunk(nextCx, nextCy)) {
        targetChunk = ensureChunkDecompressed(asyncChunkBatcher.getCachedChunkSync(nextCx, nextCy)!);
      } else {
        targetChunk = generateOverworldChunk(
          nextCx,
          nextCy,
          LEVEL_WIDTH,
          LEVEL_HEIGHT,
          nextSpawnedCats,
          prev.spawnedSeppo,
          prev.playerStats,
          prev.currentWeapon
        );
        asyncChunkBatcher.storeChunkInCache(targetChunk);
      }

      if (hasTownAtChunk(nextCx, nextCy)) {
        newlyDiscoveredTown = true;
      }
      targetChunk.npcs.forEach((n) => {
        if (n.id?.startsWith('npc_cat_')) {
          const catName = n.name.split(' (')[0];
          if (!nextSpawnedCats.includes(catName)) {
            nextSpawnedCats.push(catName);
          }
        }
      });
      hasSeppoOnLoad = targetChunk.npcs.some((n) => n.id === 'npc_seppo');
    }

    asyncChunkBatcher.pregenerateSurroundingChunks(nextCx, nextCy, 1, {
      spawnedCats: nextSpawnedCats,
      spawnedSeppo: prev.spawnedSeppo || hasSeppoOnLoad,
      playerStats: prev.playerStats,
      currentWeapon: prev.currentWeapon
    });

    if (targetChunk.watchtower && targetChunk.watchtower.siegeState?.isUnderSiege) {
      const hasSiegeEnemies = targetChunk.enemies.some(
        (e) => e.id.startsWith('siege_attacker_') || e.id.startsWith('wt_ally_attacker_')
      );
      if (!hasSiegeEnemies) {
        const wtX = targetChunk.watchtower.x;
        const wtY = targetChunk.watchtower.y;
        const attacker = targetChunk.watchtower.siegeState.attacker;
        const defender = targetChunk.watchtower.siegeState.defender;
        const playerFaction = prev.faction || 'neutral';
        const reputation = prev.factionReputation || { syndicate: 0, vanguard: 0, bandits: 0 };

        const siegeEnemies = getSiegeCombatants(
          wtX,
          wtY,
          nextCx,
          nextCy,
          attacker,
          defender,
          playerFaction,
          reputation
        );

        targetChunk.enemies = [...targetChunk.enemies, ...siegeEnemies];
      }
    }

    if (targetChunk.watchtower && !targetChunk.watchtower.siegeState?.isUnderSiege) {
      const controller = targetChunk.watchtower.controller || 'neutral';
      const playerFaction = prev.faction || 'neutral';
      const isFriendlyWatchtower = targetChunk.watchtower.isClaimed && controller === playerFaction;

      if (!isFriendlyWatchtower && !targetChunk.watchtower.garrisonDefeated) {
        const hasWatchtowerAllies = targetChunk.enemies.some((e) => e.id.startsWith('wt_ally_assault_'));
        if (!hasWatchtowerAllies) {
          const wtX = targetChunk.watchtower.x;
          const wtY = targetChunk.watchtower.y;

          const assaultAllies: Enemy[] = [];
          const allyCoords = [
            { dx: 2, dy: 6, isRanged: false },
            { dx: 6, dy: 6, isRanged: false },
            { dx: 4, dy: 7, isRanged: true }
          ];

          let allyName = 'Allied Rebel';
          let allyColor = '#fbbf24';
          let allyChar = '⚔️';

          if (playerFaction === 'vanguard') {
            allyName = 'Vanguard Vanguardian';
            allyColor = '#38bdf8';
          } else if (playerFaction === 'syndicate') {
            allyName = 'Syndicate Operative';
            allyColor = '#c084fc';
            allyChar = '☠️';
          } else if (playerFaction === 'bandits') {
            allyName = 'Outlaw Pillager';
            allyColor = '#f97316';
            allyChar = '🪓';
          }

          allyCoords.forEach((offset, idx) => {
            const nameStr = offset.isRanged ? `🏹 [ALLY] ${allyName} Marksman` : `⚔️ [ALLY] ${allyName}`;
            assaultAllies.push({
              id: `wt_ally_assault_${idx}_${nextCx}_${nextCy}`,
              x: wtX + offset.dx,
              y: wtY + offset.dy,
              type: offset.isRanged ? EnemyType.SkeletonMage : EnemyType.Bandit,
              name: nameStr,
              hp: offset.isRanged ? 140 : 180,
              maxHp: offset.isRanged ? 140 : 180,
              atk: offset.isRanged ? 12 : 15,
              def: offset.isRanged ? 3 : 6,
              range: offset.isRanged ? 3 : 1,
              speed: 1.0,
              color: allyColor,
              char: offset.isRanged ? '🏹' : allyChar,
              state: EnemyState.Chasing,
              isElite: true,
              isFollower: true,
              debuffs: [],
              patrolPath: [],
              patrolIndex: 0
            });
          });

          targetChunk.enemies = [...targetChunk.enemies, ...assaultAllies];
          newMsgs.push({
            id: `wt_ally_spawn_${Date.now()}`,
            text: `⚔️ [ASSAULT IN PROGRESS]: Your faction forces have launched a raid on the watchtower! Move in and assist them in defeating the garrison!`,
            type: 'combat',
            timestamp: 'MILITARY ALERT'
          });
        }
      }
    }

    const tileAtEntry = targetChunk.map[newPy]?.[newPx];
    const isCarvableVegetation = (
      tileAtEntry === TileType.Tree ||
      tileAtEntry === TileType.PineTree ||
      tileAtEntry === TileType.BirchTree ||
      tileAtEntry === TileType.Bush ||
      tileAtEntry === TileType.CopperVein ||
      tileAtEntry === TileType.IronVein ||
      tileAtEntry === TileType.TreeStump
    );

    if (isCarvableVegetation) {
      targetChunk.map[newPy][newPx] = TileType.Grass;
      chunkBackgroundCache.invalidate();
      finalPx = newPx;
      finalPy = newPy;
      newMsgs.push({
        id: `carve_border_${Date.now()}`,
        text: `🌲 [PATH CLEARED]: You bushwhack through the dense border brush, carving a safe passage into the new territory!`,
        type: 'craft',
        timestamp: 'SURVIVAL'
      });
    } else {
      const safePlayerPos = findNearestSafePlayerTile(newPx, newPy, targetChunk.map, true);
      finalPx = safePlayerPos.x;
      finalPy = safePlayerPos.y;
    }

    const fov = computeFOV(finalPx, finalPy, targetChunk.map, 6);
    const discovered = targetChunk.map.map((row, y) =>
      row.map(
        (cell, x) =>
          (targetChunk.discovered && targetChunk.discovered[y] && targetChunk.discovered[y][x]) ||
          (fov && fov[y] && fov[y][x]) ||
          false
      )
    );

    const nextVisited = { ...prev.visitedTiles };
    nextVisited[`${finalPx},${finalPy},${nextCx},${nextCy}`] = true;

    if (newlyDiscoveredTown) {
      const townName =
        prng(nextCx, nextCy, 123) < 0.3 ? 'Port Royal Town' : getDeterministicTownName(nextCx, nextCy);
      newMsgs.push({
        id: `discover_town_${Date.now()}`,
        text: `🏘️ [DISCOVERY REWARD]: You have discovered the magnificent town of ${townName}! The Sunder Guild drops a rare Scroll of Recall 📜 into your backpack to mark this landmark event!`,
        type: 'loot',
        timestamp: 'SYSTEM'
      });
    }
    const hasCaravanAmbush = targetChunk.npcs.some((n) => n.id?.startsWith('ambushed_merchant_'));
    const ambushCleared = prev.caravanAmbushState?.[`${nextCx},${nextCy}`] === 'success';
    if (hasCaravanAmbush && !ambushCleared) {
      newMsgs.push({
        id: `sos_caravan_${Date.now()}_1`,
        text: `🚨 [EMERGENCY S.O.S.]: You spot a merchant caravan wagon ambushed by ruthless bandits nearby! Defend the caravan and defeat all bandits to claim your reward!`,
        type: 'combat',
        timestamp: 'SYSTEM'
      });
    }

    const hasCampSentry = targetChunk.enemies.some((e) => e.id.includes('camp_guard_'));
    const campCleared = prev.clearedCamps?.includes(`camp_${nextCx}_${nextCy}`);
    if (hasCampSentry && !campCleared) {
      newMsgs.push({
        id: `sos_camp_${Date.now()}_2`,
        text: `🏕️ [WILD CAMP DETECTED]: Your scout instincts flare! A heavily fortified Hostile Raider Camp is positioned in this chunk, guarding a locked treasure chest!`,
        type: 'danger',
        timestamp: 'SYSTEM'
      });
    }

    const activeAlarm = prev.activeEscapeAlarm;
    if (activeAlarm) {
      newMsgs.push({
        id: `escaped_alarm_${Date.now()}`,
        text: `💨 [ESCAPED]: You have crossed the chunk border and successfully slipped away from the pursuing ${
          activeAlarm === 'syndicate'
            ? 'Moonshadow Syndicate'
            : activeAlarm === 'vanguard'
            ? 'Dawn Vanguard'
            : 'Rust-Raider Bandits'
        } forces! The alarm has deactivated.`,
        type: 'info',
        timestamp: 'SYSTEM'
      });
    }

    const truncatedLogs = appendBoundedLogs(prev.logs, newMsgs, 200);
    const managedChunks = manageActiveChunkWindow(
      {
        ...updatedChunks,
        [targetChunkKey]: targetChunk
      },
      nextCx,
      nextCy,
      25
    );

    return {
      ...prev,
      playerX: finalPx,
      playerY: finalPy,
      currentChunkX: nextCx,
      currentChunkY: nextCy,
      overworldZ: 0,
      overworldChunks: managedChunks,
      spawnedCats: nextSpawnedCats,
      spawnedSeppo: prev.spawnedSeppo || hasSeppoOnLoad,
      map: targetChunk.map,
      discovered: discovered,
      visible: fov,
      enemies: spawnFollowersOnLevelLoadByReset(
        targetChunk.enemies,
        prev.followers,
        finalPx,
        finalPy,
        targetChunk.map
      ),
      traps: targetChunk.traps,
      chests: targetChunk.chests,
      npcs: targetChunk.npcs,
      lootPiles: targetChunk.lootPiles || [],
      corpses: targetChunk.corpses || [],
      bloodSplatters: targetChunk.bloodSplatters || [],
      dungeonProps: targetChunk.props || [],
      equipmentInventory: newlyDiscoveredTown
        ? [
            ...prev.equipmentInventory,
            {
              id: `scroll_recall_town_${Date.now()}_${Math.random()}`,
              name: 'Scroll of Recall 📜',
              type: 'scroll' as any,
              subType: 'Scroll' as any,
              defense: 0,
              damage: 0,
              critChance: 0,
              range: 0,
              color: '#38bdf8',
              description:
                'A magic-imbued scroll of high-tier displacement. Read it to instantly teleport to any discovered town, city, or remote wilderness safehouse!',
              value: 200,
              durability: 100,
              maxDurability: 100
            }
          ]
        : prev.equipmentInventory,
      logs: [...truncatedLogs, ...newMsgs],
      visitedTiles: nextVisited,
      biome: targetChunk.biome,
      weather: getValidWeatherForBiome(targetChunk.biome, targetChunk.weather),
      activeEscapeAlarm: null,
      playerStats: {
        ...prev.playerStats,
        turnsPlayed: prev.playerStats.turnsPlayed + 1
      }
    };
  });

  combatVfxEngine.clearAll();
  executeEnemiesTurn(finalPx, finalPy);
  return true;
}
