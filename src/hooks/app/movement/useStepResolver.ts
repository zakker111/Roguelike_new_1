import {
  GameState,
  TileType,
  Enemy,
  EnemyType,
  EnemyState,
  Follower
} from '../../../types';
import {
  isLunarBlessingActive,
  getEffectiveAttribute
} from '../../../utils/gameUtils';
import {
  getItemWeight,
  getMaterialUnitWeight
} from '../../../utils/itemWeight';
import { formatGameTime } from '../../../utils/overworld';
import { computeFOV } from '../../../utils/ai';
import { isPlayerIndoors } from '../../../utils/buildingAudio';
import { isPlayerInvincible } from '../../../utils/invincibility';
import { evaluateScarAcquisition } from '../../../utils/scars';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from '../../../utils/itemsData';
import gameConfig from '../../../data/gameConfig.json';
import { UsePlayerTurnMovementProps } from './types';

export function resolveStepEffects(
  targetX: number,
  targetY: number,
  props: UsePlayerTurnMovementProps
) {
  const {
    gameState,
    setGameState,
    playSound,
    addLogMessage,
    setIsGameOver,
    setShakeTrigger,
    setActiveTab,
    executeEnemiesTurn
  } = props;

  const stats = gameState.playerStats;
  let isPoisonedMove = false;
  let nextHp = stats.hp;
  let activeMoveScars = stats.scars ? [...stats.scars] : [];

  const steppedTrapIndex = gameState.traps.findIndex((t) => t.x === targetX && t.y === targetY);
  let nextTraps = [...gameState.traps];

  let currentScoutingLvl = stats.scoutingLevel || 1;
  let currentScoutingXp = stats.scoutingXp || 0;

  if (steppedTrapIndex !== -1 && !isLunarBlessingActive(gameState, 'new_moon')) {
    const activeTrap = gameState.traps[steppedTrapIndex];
    if (!activeTrap.triggered || activeTrap.type === 'FireVent') {
      if (activeTrap.detected && !activeTrap.triggered) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const disarmSkill = (stats.dex || 10) + currentScoutingLvl * 4;
        const difficulty = activeTrap.type === 'FireVent' ? 18 : activeTrap.type === 'PoisonGas' ? 14 : 12;

        if (roll + disarmSkill >= difficulty) {
          playSound('loot');
          const xpGained = 25;
          currentScoutingXp += xpGained;
          let levelUpText = '';
          if (currentScoutingXp >= currentScoutingLvl * 100) {
            currentScoutingXp -= currentScoutingLvl * 100;
            currentScoutingLvl += 1;
            levelUpText = ` 🎓 [SCOUTING UPGRADE]: Your Trap Detection & Scouting level increased to Level ${currentScoutingLvl}!`;
            setTimeout(() => playSound('levelUp'), 150);
          }

          addLogMessage(
            `🔧 [DISARM SUCCESS]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) You disarmed the ${activeTrap.type}! (+25 Scouting XP)${levelUpText}`,
            'loot'
          );

          nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };

          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: targetX, y: targetY, text: `🔧 DISARMED`, type: 'heal' }
          });
          window.dispatchEvent(ev);
        } else {
          const luckRoll = Math.random();
          const effectiveLck = getEffectiveAttribute(gameState, 'lck');
          const evadeChance = Math.min(0.75, Math.max(0.05, effectiveLck * 0.02));
          if (luckRoll < evadeChance) {
            playSound('loot');
            addLogMessage(
              `🍀 [LUCK EVADE]: (Disarm Failed) You slipped up, but your incredible luck (${
                stats.lck || 10
              } LCK) saved you! You dodged the springing parts of the ${activeTrap.type} trap! (+10 Scouting XP)`,
              'loot'
            );
            nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
            currentScoutingXp += 10;
            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: targetX, y: targetY, text: `🍀 EVADED!`, type: 'heal' }
            });
            window.dispatchEvent(ev);
          } else {
            let trapDamage = 6;
            let trapLog = '';
            if (activeTrap.type === 'Spikes') {
              trapDamage = Math.floor(Math.random() * 5) + 6;
              trapLog = `💥 [DISARM FAIL]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) Your fingers slip! Spikes snap! Sustained -${trapDamage} HP.`;
              nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
            } else if (activeTrap.type === 'PoisonGas') {
              trapDamage = 4;
              trapLog = `🧪 [DISARM FAIL]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) Gas nozzle explodes! Sustained -${trapDamage} HP & poison.`;
              isPoisonedMove = true;
            } else if (activeTrap.type === 'FireVent') {
              trapDamage = 12;
              trapLog = `🔥 [DISARM FAIL]: (Roll ${roll} + Skill ${disarmSkill} vs DC ${difficulty}) Searing volcanic fumes burst! Sustained -${trapDamage} HP burning.`;
            } else if (activeTrap.type === 'Geyser') {
              trapDamage = 10;
              trapLog = `🌊 [DISARM FAIL]: High-pressure tidal geyser erupts! Sustained -${trapDamage} HP water damage.`;
            } else if (activeTrap.type === 'MagmaEruption') {
              trapDamage = 16;
              trapLog = `🌋 [DISARM FAIL]: Molten magma fissure detonates! Sustained -${trapDamage} HP searing burn damage.`;
            } else if (activeTrap.type === 'FrostbiteVent') {
              trapDamage = 8;
              trapLog = `❄️ [DISARM FAIL]: Cryogenic glacial vent blasts freezing frost! Sustained -${trapDamage} HP frost damage.`;
            } else if (activeTrap.type === 'FallingIcicle') {
              trapDamage = 11;
              trapLog = `🧊 [DISARM FAIL]: Heavy razor icicle crashes down! Sustained -${trapDamage} HP crushing damage.`;
            } else if (activeTrap.type === 'SulfurVent') {
              trapDamage = 6;
              trapLog = `☠️ [DISARM FAIL]: Choking noxious sulfur gas leaks! Sustained -${trapDamage} HP & poison.`;
              isPoisonedMove = true;
            }

            if (isPlayerInvincible(gameState, gameState.playerStats)) {
              trapDamage = 0;
              isPoisonedMove = false;
              addLogMessage(
                `🛡️ [GOD MODE]: You triggered a ${activeTrap.type} trap, but divine invulnerability shields you completely! (0 damage)`,
                'info'
              );
              playSound('shield');
              const ev = new CustomEvent('spawn-game-effect', {
                detail: { x: targetX, y: targetY, text: `🛡️ IMMUNE`, type: 'heal' }
              });
              window.dispatchEvent(ev);
            } else {
              playSound('trap');
              nextHp -= trapDamage;
              addLogMessage(trapLog, 'danger');
              setShakeTrigger((s) => s + 1);

              const ev = new CustomEvent('spawn-game-effect', {
                detail: { x: targetX, y: targetY, text: `💥 TRAP! -${trapDamage} HP`, type: 'dmg' }
              });
              window.dispatchEvent(ev);

              const scarResult = evaluateScarAcquisition(
                trapDamage,
                nextHp,
                stats.maxHp,
                activeMoveScars,
                stats.turnsPlayed + 1
              );
              if (scarResult) {
                activeMoveScars.push(scarResult.scar);
                addLogMessage(scarResult.logText, 'danger');
                setTimeout(() => {
                  playSound('trap');
                }, 40);
                const evSc = new CustomEvent('spawn-game-effect', {
                  detail: { x: targetX, y: targetY, text: `🤕 SCARRED!`, type: 'heal' }
                });
                window.dispatchEvent(evSc);
              }
            }
          }
        }
      } else {
        const luckRoll = Math.random();
        const effectiveLck = getEffectiveAttribute(gameState, 'lck');
        const evadeChance = Math.min(0.75, Math.max(0.05, effectiveLck * 0.02));
        if (luckRoll < evadeChance) {
          playSound('loot');
          addLogMessage(
            `🍀 [LUCK EVADE]: Your incredible luck (${stats.lck || 10} LCK) saved you! You stepped on a ${
              activeTrap.type
            } trap, but it jammed and failed to fire! (+15 Scouting XP)`,
            'loot'
          );
          nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
          currentScoutingXp += 15;
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: targetX, y: targetY, text: `🍀 EVADED!`, type: 'heal' }
          });
          window.dispatchEvent(ev);
        } else {
          playSound('trap');
          let trapDamage = 6;
          let trapLog = '';
          if (activeTrap.type === 'Spikes') {
            trapDamage = Math.floor(Math.random() * 5) + 6;
            trapLog = `💥 SNAP! Hidden iron spikes impale you! Sustained -${trapDamage} HP.`;
            nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
          } else if (activeTrap.type === 'PoisonGas') {
            trapDamage = 4;
            trapLog = `🧪 HISS! Toxic poison gas billows around you! Sustained -${trapDamage} HP & poison.`;
            isPoisonedMove = true;
          } else if (activeTrap.type === 'FireVent') {
            trapDamage = 12;
            trapLog = `🔥 FWOOSH! Searing flame burst scorches you! Sustained -${trapDamage} HP burning.`;
          } else if (activeTrap.type === 'Geyser') {
            trapDamage = 10;
            trapLog = `🌊 SPLASH! High pressure tidal geyser knocks you back! Sustained -${trapDamage} HP water damage.`;
          } else if (activeTrap.type === 'MagmaEruption') {
            trapDamage = 16;
            trapLog = `🌋 BOOM! Molten magma fissure erupts! Sustained -${trapDamage} HP searing burn damage.`;
          } else if (activeTrap.type === 'FrostbiteVent') {
            trapDamage = 8;
            trapLog = `❄️ FREEZE! Cryogenic glacial vent blasts freezing frost! Sustained -${trapDamage} HP frost damage.`;
          } else if (activeTrap.type === 'FallingIcicle') {
            trapDamage = 11;
            trapLog = `🧊 CRASH! A razor-sharp stalactite icicle falls from the ceiling! Sustained -${trapDamage} HP crushing damage.`;
            nextTraps[steppedTrapIndex] = { ...activeTrap, triggered: true, detected: true, hidden: false };
          } else if (activeTrap.type === 'SulfurVent') {
            trapDamage = 6;
            trapLog = `☠️ CHOKE! You inhale toxic sulfur fumes from a volcanic vent! Sustained -${trapDamage} HP & poison.`;
            isPoisonedMove = true;
          }

          if (isPlayerInvincible(gameState, gameState.playerStats)) {
            trapDamage = 0;
            isPoisonedMove = false;
            addLogMessage(
              `🛡️ [GOD MODE]: You stepped on a ${activeTrap.type} trap, but divine invulnerability shields you completely! (0 damage)`,
              'info'
            );
            playSound('shield');
            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: targetX, y: targetY, text: `🛡️ IMMUNE`, type: 'heal' }
            });
            window.dispatchEvent(ev);
          } else if (trapDamage > 0) {
            nextHp -= trapDamage;
            addLogMessage(trapLog, 'danger');
            setShakeTrigger((s) => s + 1);

            const scarResult = evaluateScarAcquisition(
              trapDamage,
              nextHp,
              stats.maxHp,
              activeMoveScars,
              stats.turnsPlayed + 1
            );
            if (scarResult) {
              activeMoveScars.push(scarResult.scar);
              addLogMessage(scarResult.logText, 'danger');
              setTimeout(() => {
                playSound('trap');
              }, 40);
              const evSc = new CustomEvent('spawn-game-effect', {
                detail: { x: targetX, y: targetY, text: `🤕 SCARRED!`, type: 'heal' }
              });
              window.dispatchEvent(evSc);
            }

            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: targetX, y: targetY, text: `-${trapDamage} TRAP`, type: 'dmg' }
            });
            window.dispatchEvent(ev);
          }
        }
      }
    }
  } else if (steppedTrapIndex !== -1 && isLunarBlessingActive(gameState, 'new_moon')) {
    addLogMessage(
      `🌑 [SHADOW VEIL]: You drift over a hidden ${gameState.traps[steppedTrapIndex].type} trap without triggering it!`,
      'info'
    );
  }

  const scanRadius = stats.int >= 30 ? 4 : stats.int >= 18 ? 3 : 2;
  let detectedCount = 0;
  let detectedViaIntellect = 0;
  let scoutingXpEarned = 0;

  nextTraps = nextTraps.map((trap) => {
    if (trap.detected || trap.triggered) return trap;

    const dist = Math.max(Math.abs(trap.x - targetX), Math.abs(trap.y - targetY));
    if (dist <= scanRadius) {
      const baseChance =
        0.2 + stats.dex * 0.01 + stats.lck * 0.01 + stats.int * 0.015 + currentScoutingLvl * 0.1;
      if (Math.random() < baseChance) {
        detectedCount++;
        if (dist > 2 || stats.int >= 15) {
          detectedViaIntellect++;
        }
        scoutingXpEarned += 15;
        return { ...trap, detected: true, hidden: false };
      }
    }
    return trap;
  });

  if (detectedCount > 0) {
    playSound('spell');
    currentScoutingXp += scoutingXpEarned;
    let levelUpText = '';
    if (currentScoutingXp >= currentScoutingLvl * 100) {
      currentScoutingXp -= currentScoutingLvl * 100;
      currentScoutingLvl += 1;
      levelUpText = ` 🎓 [SCOUTING UPGRADE]: Your Trap Detection & Scouting level increased to Level ${currentScoutingLvl}!`;
      setTimeout(() => playSound('levelUp'), 150);
    }

    let logMessage = `👁️ [PERCEPTION]: Spot ${detectedCount} hidden trap${
      detectedCount > 1 ? 's' : ''
    }! (+${scoutingXpEarned} Scouting XP)${levelUpText}`;
    if (detectedViaIntellect > 0) {
      logMessage = `🧠 [INTELLECT DISCOVERY]: Your high intellect (${stats.int} INT) reveals ${detectedCount} hidden trap${
        detectedCount > 1 ? 's' : ''
      } from a distance! (+${scoutingXpEarned} Scouting XP)${levelUpText}`;
    }
    addLogMessage(logMessage, 'info');
  }

  let nextLootPiles = gameState.lootPiles ? [...gameState.lootPiles] : [];
  const lootIndex = nextLootPiles.findIndex((l) => l.x === targetX && l.y === targetY);
  let collectedGold = 0;

  if (lootIndex !== -1) {
    playSound('loot');
    const pile = nextLootPiles[lootIndex];
    collectedGold = pile.gold;

    addLogMessage(`💰 Collected loot pile: +${pile.gold} Gold!`, 'loot');

    pile.materials.forEach((mid) => {
      const uWeight = getMaterialUnitWeight(mid);
      if (mid === 'mat_wood') {
        addLogMessage(`  + Gathered: Scrap Wood 🌲 (Weight: ${uWeight} kg)`, 'loot');
      } else if (mid === 'mat_raw_meat') {
        addLogMessage(`  + Acquired: Raw Meat 🥩 (Weight: ${uWeight} kg)`, 'loot');
      } else if (mid === 'mat_cooked_meat') {
        addLogMessage(`  + Acquired: Cooked Meat 🍖 (Weight: ${uWeight} kg)`, 'loot');
      } else {
        const mat = BASIC_MATERIALS.find((m) => m.id === mid);
        if (mat) addLogMessage(`  + Metal Material: ${mat.name} (${uWeight} kg)`, 'loot');
      }
    });

    pile.catalysts.forEach((cid) => {
      const uWeight = getMaterialUnitWeight(cid);
      const cat = ELEMENTAL_CATALYSTS.find((c) => c.id === cid);
      if (cat) addLogMessage(`  + Crystal Catalyst: ${cat.name} (${uWeight} kg)`, 'loot');
    });

    pile.equipment.forEach((equip) => {
      const uWeight = getItemWeight(equip);
      addLogMessage(
        `  + Unlocked Equipment: ${equip.name} (${
          equip.type === 'weapon' ? `ATK: ${equip.damage}` : `DEF: ${equip.defense}`
        } · ${uWeight} kg)`,
        'loot'
      );
    });
  }

  const nextFov = computeFOV(targetX, targetY, gameState.map, 6);
  const nextDiscovered = gameState.discovered.map((row, y) =>
    row.map((cell, x) => cell || nextFov[y][x])
  );

  const nextVisited = { ...gameState.visitedTiles };
  nextVisited[`${targetX},${targetY},${gameState.currentChunkX},${gameState.currentChunkY}`] = true;

  const wasIndoors = isPlayerIndoors(gameState);
  const nowIndoors = isPlayerIndoors({
    isOverworld: gameState.isOverworld,
    map: gameState.map,
    playerX: targetX,
    playerY: targetY
  });

  if (!wasIndoors && nowIndoors) {
    playSound('door_open', { volume: 0.7 });
    playSound('indoor_entry', { volume: 0.5 });
    addLogMessage('🏠 [INDOOR SHELTER]: You step inside the building shelter. Outdoor atmospheric sound muffles.', 'system');
  } else if (wasIndoors && !nowIndoors) {
    playSound('door_close', { volume: 0.6 });
    addLogMessage('🌲 [OUTDOOR AIR]: You step outside into the open atmosphere.', 'system');
  } else if (nowIndoors) {
    const stepTile = gameState.map[targetY]?.[targetX];
    const isStone =
      stepTile === TileType.StairsUp ||
      stepTile === TileType.StairsDown ||
      stepTile === TileType.Anvil;
    playSound(isStone ? 'stone_footstep' : 'wood_footstep', { volume: 0.08 });

    if (stepTile === TileType.Anvil) {
      addLogMessage(
        '⚒️ [BLACKSMITH ANVIL]: You step right beside the heavy steel anvil! Open the Forge panel to forge, upgrade, and mutate gear.',
        'craft'
      );
      setActiveTab('forge');
    } else if (stepTile === TileType.Fireplace) {
      addLogMessage('🔥 [FORGE HEARTH]: Searing heat radiates from the roaring forge hearth, warming you and cleansing chill.', 'system');
      setGameState((prev) => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          exhaustion: Math.max(0, (prev.playerStats.exhaustion || 0) - 10),
          hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + 5)
        }
      }));
    } else if (stepTile === TileType.Chair) {
      addLogMessage('🪑 [SEATED REST]: You sit down comfortably on the wooden chair/stool to rest your feet and catch your breath.', 'system');
    } else if (stepTile === TileType.Bed) {
      addLogMessage('🛏️ [COT REST]: You lie down on the comfortable cot to rest up. Restored +20 HP!', 'system');
      setGameState((prev) => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          hp: Math.min(prev.playerStats.maxHp, prev.playerStats.hp + 20),
          exhaustion: Math.max(0, (prev.playerStats.exhaustion || 0) - 25)
        }
      }));
    }
  } else {
    playSound('grass_step', { volume: 0.06 });
  }

  setGameState((prev) => {
    let activeEffectsList = prev.playerStats.activeEffects ? [...prev.playerStats.activeEffects] : [];
    if (isPoisonedMove) {
      activeEffectsList = activeEffectsList.filter((e) => e.id !== 'poison');
      activeEffectsList.push({
        id: 'poison',
        name: 'Poisoned',
        type: 'debuff',
        icon: '🤢',
        description: 'Sustained toxic damage over time. Deals -2 HP per turn.',
        turnsRemaining: 15,
        color: '#10b981',
        damagePerTurn: 2
      });
    }

    let updatedMaterials = prev.inventoryMaterials;
    let updatedCatalysts = prev.inventoryCatalysts;
    let updatedEquipment = prev.equipmentInventory;
    let updatedLootPiles = prev.lootPiles ? [...prev.lootPiles] : [];

    if (lootIndex !== -1) {
      const pile = updatedLootPiles[lootIndex];
      const nextMats = { ...prev.inventoryMaterials };
      const nextCats = { ...prev.inventoryCatalysts };
      const nextEquipment = [...prev.equipmentInventory];

      pile.materials.forEach((mid) => {
        nextMats[mid] = (nextMats[mid] || 0) + 1;
      });
      pile.catalysts.forEach((cid) => {
        nextCats[cid] = (nextCats[cid] || 0) + 1;
      });
      pile.equipment.forEach((equip) => {
        nextEquipment.push(equip);
      });

      updatedLootPiles.splice(lootIndex, 1);
      updatedMaterials = nextMats;
      updatedCatalysts = nextCats;
      updatedEquipment = nextEquipment;
    }

    let nextOverworldChunks = { ...prev.overworldChunks };
    let finalHp = Math.min(prev.playerStats.maxHp, nextHp);
    let finalXp = prev.playerStats.xp;
    let finalLevel = prev.playerStats.level;
    let finalNextLevelXp = prev.playerStats.nextLevelXp;
    let finalMaxHp = prev.playerStats.maxHp;
    let finalMaxMp = prev.playerStats.maxMp;
    let finalMp = prev.playerStats.mp;
    let finalAtk = prev.playerStats.atk;
    let finalDef = prev.playerStats.def;
    let finalUnspentPoints = prev.playerStats.unspentPoints || 0;
    let finalGold = prev.playerStats.gold + collectedGold;
    let finalFactionRep = prev.factionReputation
      ? { ...prev.factionReputation }
      : { syndicate: 0, vanguard: 0, bandits: 0 };
    const nextLogs = [...prev.logs];

    const currentChunkKey = `${prev.currentChunkX},${prev.currentChunkY}`;
    const currentChunkObj = prev.overworldChunks[currentChunkKey];

    if (prev.isOverworld && currentChunkObj && prev.map[targetY]?.[targetX] === TileType.WatchtowerFlag) {
      const wt = currentChunkObj.watchtower;
      if (wt) {
        if (!wt.isClaimed) {
          const garrisonAlive = prev.enemies.some(
            (e) =>
              e.id?.includes(`_${prev.currentChunkX}_${prev.currentChunkY}`) &&
              (e.id?.startsWith('wt_commander_') ||
                e.id?.startsWith('wt_knight') ||
                e.id?.startsWith('wt_ranger_'))
          );

          if (garrisonAlive) {
            playSound('deny');
            nextLogs.push({
              id: `garrison_active_${Date.now()}`,
              text: `🛡️ [GARRISON ACTIVE]: Watchtower Sentinel Garrison is actively defending! Defeat all sentries and the Commander before claiming the flag.`,
              type: 'danger',
              timestamp: formatGameTime(prev.gameTime).timeStr
            });
          } else {
            const nextPercent = Math.min(100, wt.claimPercent + 25);
            const updatedWt = { ...wt, claimPercent: nextPercent };

            if (nextPercent >= 100) {
              const playerFaction = prev.faction || 'neutral';
              updatedWt.isClaimed = true;
              updatedWt.controller = playerFaction;
              updatedWt.garrisonDefeated = true;

              setTimeout(() => playSound('levelUp'), 150);
              nextLogs.push({
                id: `wt_secured_${Date.now()}`,
                text: `👑 [WATCHTOWER SECURED]: Captured for ${
                  playerFaction === 'syndicate'
                    ? 'Moonshadow Syndicate'
                    : playerFaction === 'vanguard'
                    ? 'Dawn Vanguard'
                    : playerFaction === 'bandits'
                    ? 'Rust-Raider Bandits'
                    : 'Independent Renegades'
                }! (+150 XP)`,
                type: 'loot',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });

              let updatedXp = finalXp + 150;
              const bonuses = gameConfig.levelUpBonuses;
              while (updatedXp >= finalNextLevelXp) {
                finalLevel += 1;
                updatedXp -= finalNextLevelXp;
                finalNextLevelXp = Math.floor(finalNextLevelXp * bonuses.xpThresholdMultiplier);
                finalMaxHp += bonuses.maxHp;
                finalHp = finalMaxHp;
                finalMaxMp += bonuses.maxMp;
                finalMp = finalMaxMp;
                finalAtk += bonuses.atk;
                finalDef += bonuses.def;
                finalUnspentPoints += bonuses.attributePoints;

                nextLogs.push({
                  id: `lvl_up_wt_${Date.now()}_${finalLevel}`,
                  text: `🌟 LEVEL UP! You reached Level ${finalLevel}! (+${bonuses.attributePoints} Stat Points, +${bonuses.maxHp} Max HP)`,
                  type: 'quest',
                  timestamp: formatGameTime(prev.gameTime).timeStr
                });
              }
              finalXp = updatedXp;

              if (playerFaction !== 'neutral') {
                const currentRep = finalFactionRep[playerFaction] || 0;
                finalFactionRep[playerFaction] = Math.min(100, currentRep + 30);
                nextLogs.push({
                  id: `wt_rep_${Date.now()}`,
                  text: `⚖️ [REPUTATION GAINED]: Secured a strategic stronghold! +30 Standing with ${
                    playerFaction === 'syndicate'
                      ? 'Moonshadow Syndicate'
                      : playerFaction === 'vanguard'
                      ? 'Dawn Vanguard'
                      : 'Rust-Raider Bandits'
                  } (Current: ${finalFactionRep[playerFaction]})`,
                  type: 'info',
                  timestamp: formatGameTime(prev.gameTime).timeStr
                });
              }
            } else {
              playSound('loot');
              nextLogs.push({
                id: `wt_capturing_${Date.now()}`,
                text: `🚩 [CAPTURING FLAG]: Securing the Faction Watchtower... (${nextPercent}% Captured)`,
                type: 'info',
                timestamp: formatGameTime(prev.gameTime).timeStr
              });
            }

            nextOverworldChunks[currentChunkKey] = {
              ...currentChunkObj,
              watchtower: updatedWt
            };
          }
        } else {
          if (wt.taxGoldAccumulated > 0) {
            playSound('loot');
            finalGold += wt.taxGoldAccumulated;
            nextLogs.push({
              id: `tax_collected_${Date.now()}`,
              text: `💰 [TAX COLLECTED]: Collected +${wt.taxGoldAccumulated} Gold in tribute tax from the watchtower garrison!`,
              type: 'loot',
              timestamp: formatGameTime(prev.gameTime).timeStr
            });

            nextOverworldChunks[currentChunkKey] = {
              ...currentChunkObj,
              watchtower: {
                ...wt,
                taxGoldAccumulated: 0
              }
            };
          }
        }
      }
    }

    const currentTurns = prev.playerStats.turnsPlayed + 1;
    if (currentTurns % 30 === 0) {
      Object.keys(nextOverworldChunks).forEach((key) => {
        const chunk = nextOverworldChunks[key];
        if (chunk.watchtower && chunk.watchtower.isClaimed) {
          nextOverworldChunks[key] = {
            ...chunk,
            watchtower: {
              ...chunk.watchtower,
              taxGoldAccumulated: (chunk.watchtower.taxGoldAccumulated || 0) + 25
            }
          };
        }
      });
    }

    return {
      ...prev,
      playerX: targetX,
      playerY: targetY,
      visible: nextFov,
      discovered: nextDiscovered,
      traps: nextTraps,
      lootPiles: updatedLootPiles,
      visitedTiles: nextVisited,
      inventoryMaterials: updatedMaterials,
      inventoryCatalysts: updatedCatalysts,
      equipmentInventory: updatedEquipment,
      overworldChunks: nextOverworldChunks,
      logs: nextLogs,
      playerStats: {
        ...prev.playerStats,
        hp: finalHp,
        xp: finalXp,
        level: finalLevel,
        nextLevelXp: finalNextLevelXp,
        maxHp: finalMaxHp,
        maxMp: finalMaxMp,
        mp: finalMp,
        atk: finalAtk,
        def: finalDef,
        unspentPoints: finalUnspentPoints,
        gold: finalGold,
        turnsPlayed: currentTurns,
        scars: activeMoveScars,
        activeEffects: activeEffectsList,
        scoutingLevel: currentScoutingLvl,
        scoutingXp: currentScoutingXp
      },
      factionReputation: finalFactionRep
    };
  });

  if (nextHp <= 0) {
    playSound('defeat');
    setIsGameOver(true);
    return;
  }

  executeEnemiesTurn(targetX, targetY);
}
