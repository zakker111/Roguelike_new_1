import { Dispatch, SetStateAction, useCallback } from 'react';
import { TileType, Enemy, GameState, PlayerEffect, EnemyState, EnemyType, CatalystType } from '../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT, isLunarBlessingActive } from '../utils/gameUtils';
import { getNextStepTowards } from '../utils/ai';
import { getEnemyTemplate } from '../utils/dungeon';
import { syncCaravanState } from '../utils/caravanAndTerritory';
import { getGMPointOfInterestNudge } from '../utils/gmNarrator';
import { incrementDefeatedEnemyCount } from '../utils/bestiary';
import { evaluateScarAcquisition, getEffectiveStats } from '../utils/scars';
import { getItemDurabilityDecay } from '../utils/spellsAndEquipment';
import { tickActiveGMStoryteller } from '../utils/gmStoryteller';

export interface UseEnemyAIParams {
  gameStateRef?: any;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
  hasEquippedTrait: (gs: GameState, traitKey: string) => boolean;
}

export function useEnemyAI({
  setGameState,
  playSound,
  hasEquippedTrait,
}: UseEnemyAIParams) {

  // Pathfinding and AI solver for dungeon monsters and Overworld villagers schedules
  const executeEnemiesTurn = useCallback((px: number, py: number) => {
    setGameState((prev) => {
      let nextEnemies = [...prev.enemies];
      let nextDefeatedCounts = prev.defeatedEnemiesCount ? { ...prev.defeatedEnemiesCount } : {};
      let playerHp = prev.playerStats.hp;
      let playerMp = prev.playerStats.mp;
      const staticLogs: string[] = [];
      const updatedStats = { ...prev.playerStats, turnsPlayed: prev.playerStats.turnsPlayed + 1 };

      // Process Player Status Effects (Active Effects)
      let nextActiveEffects = prev.playerStats.activeEffects ? [...prev.playerStats.activeEffects] : [];
      const updatedEffects: PlayerEffect[] = [];
      
      for (const eff of nextActiveEffects) {
        let turnsLeft = eff.turnsRemaining - 1;
        
        // Ticking effect values
        if (eff.damagePerTurn) {
          let tickDmg = eff.damagePerTurn;
          if (prev.factionTerritories?.['swamp_of_whispers']?.controller === prev.faction) {
            tickDmg = Math.max(1, tickDmg - 3);
          }
          playerHp = Math.max(0, playerHp - tickDmg);
          staticLogs.push(`🤢 You suffer -${tickDmg} toxic damage from ${eff.name}.`);
          const ev = new CustomEvent('spawn-game-effect', {
            detail: { x: px, y: py, text: `-${tickDmg} Poison`, type: 'dmg' },
          });
          window.dispatchEvent(ev);
        }
        if (eff.healPerTurn) {
          if (playerHp < updatedStats.maxHp) {
            playerHp = Math.min(updatedStats.maxHp, playerHp + eff.healPerTurn);
            staticLogs.push(`✨ You heal +${eff.healPerTurn} HP from ${eff.name}.`);
            const ev = new CustomEvent('spawn-game-effect', {
              detail: { x: px, y: py, text: `+${eff.healPerTurn} HP`, type: 'heal' },
            });
            window.dispatchEvent(ev);
          }
        }

        if (turnsLeft > 0) {
          updatedEffects.push({
            ...eff,
            turnsRemaining: turnsLeft
          });
        } else {
          staticLogs.push(`✨ [EFFECT EXPIRED]: Your ${eff.name} effect has expired.`);
        }
      }

      let nextFoodBuff = prev.activeFoodBuff;
      if (nextFoodBuff) {
        if (nextFoodBuff.turnsRemaining <= 1) {
          nextFoodBuff = undefined;
          staticLogs.push(`🍴 [BUFF EXPIRED]: Your culinary buff "${prev.activeFoodBuff?.name}" has expired.`);
        } else {
          nextFoodBuff = {
            ...nextFoodBuff,
            turnsRemaining: nextFoodBuff.turnsRemaining - 1
          };
        }
      }
      let activeScars = updatedStats.scars ? [...updatedStats.scars] : [];

      // Crimson Heart Relic regeneration check
      if (updatedStats.relics?.includes('crimson_heart') && playerHp > 0 && playerHp < updatedStats.maxHp) {
        playerHp = Math.min(updatedStats.maxHp, playerHp + 2);
        staticLogs.push(`❤️ [CRIMSON HEART]: Regenerated +2 HP from your Sanctum Relic.`);
        const ev = new CustomEvent('spawn-game-effect', {
          detail: { x: px, y: py, text: `+2 HP`, type: 'heal' },
        });
        window.dispatchEvent(ev);
      }

      let currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
      let nextRep = currentRep;
      if (currentRep < 100) {
        nextRep = Math.min(100, currentRep + 0.35);
      }
      let nextGuardsHostile = prev.areGuardsHostile !== undefined ? prev.areGuardsHostile : false;
      if (nextGuardsHostile && nextRep >= 100) {
        nextGuardsHostile = false;
        staticLogs.push(`⚖️ [TOWN NOTICE]: Your crimes have been pardoned over time. The town guards are no longer hostile.`);
      }

      // -----------------------------------------------------------
      // INSTANT DEATH AURA - Sandbox Tweak
      // -----------------------------------------------------------
      if ((window as any).arenaDeathAuraActive) {
        nextEnemies = nextEnemies.filter((e) => {
          const dist = Math.abs(e.x - px) + Math.abs(e.y - py);
          if (dist <= 2 && !e.isFollower && !e.isTownGuard) {
            staticLogs.push(`⚡ DEATH AURA: ${e.name} was smitten dead instantly!`);
            const effectEv = new CustomEvent('spawn-game-effect', {
              detail: { x: e.x, y: e.y, text: "Smite!", type: 'dmg' },
            });
            window.dispatchEvent(effectEv);
            return false;
          }
          return true;
        });
      }

      const nextCorpses = prev.corpses ? [...prev.corpses] : [];
      let nextSplatters = (prev.bloodSplatters || [])
        .map((spl) => {
          if (Math.random() < 0.04) {
            return { ...spl, intensity: spl.intensity - 1 };
          }
          return spl;
        })
        .filter((spl) => spl.intensity > 0);

      let nextArmor = prev.equippedArmor;
      let nextHelmet = prev.equippedHelmet;
      let nextGloves = prev.equippedGloves;
      let nextBoots = prev.equippedBoots;
      let nextShield = prev.equippedShield;

      let timeCost = 4;
      if (prev.isOverworld) {
        if (hasEquippedTrait(prev, 'SWAMP_GLIDE') && prev.biome === 'swamp') {
          timeCost = 2;
        } else if (hasEquippedTrait(prev, 'DESERT_IMMUNITY') && prev.biome === 'desert') {
          timeCost = 2;
        } else if (hasEquippedTrait(prev, 'STALLION_SPEED')) {
          timeCost = 3;
        }
      }
      let nextTimeVal = (prev.gameTime + timeCost) % 1440;
      let nextNpcs = prev.npcs ? [...prev.npcs] : [];
      let nextTraps = prev.traps ? [...prev.traps] : [];

      let lastRestock = prev.lastRestockTime !== undefined ? prev.lastRestockTime : 480;
      let nextRestockTime = lastRestock;
      let merchantGoldUpdate = prev.merchantGold ? { ...prev.merchantGold } : {};
      let merchantStockUpdate = prev.merchantStock ? { ...prev.merchantStock } : {};

      let restockDiff = 0;
      if (nextTimeVal >= lastRestock) {
        restockDiff = nextTimeVal - lastRestock;
      } else {
        restockDiff = (1440 - lastRestock) + nextTimeVal;
      }
      if (restockDiff >= 300) {
        nextRestockTime = nextTimeVal;
        merchantGoldUpdate = {};
        merchantStockUpdate = {};
      }

      let gmStateUpdates: Partial<GameState> = {};
      if (prev.gmAutonomousWeather ?? true) {
        const gmRes = tickActiveGMStoryteller(prev);
        if (gmRes.logMessage && gmRes.didIntervene) {
          staticLogs.push(gmRes.logMessage.text);
        }
        if (gmRes.stateUpdates) {
          gmStateUpdates = gmRes.stateUpdates;
        }
        if (gmRes.effectSpawn) {
          const sEv = new CustomEvent('spawn-game-effect', {
            detail: gmRes.effectSpawn,
          });
          window.dispatchEvent(sEv);
        }
      }

      let nextWeather = prev.weather;
      if (prev.isOverworld && (prev.gmAutonomousWeather ?? true) && updatedStats.turnsPlayed > 0 && updatedStats.turnsPlayed % (prev.gmWeatherInterval || 25) === 0) {
        const weathers: ('clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard')[] = ['clear', 'rainy', 'foggy', 'snowy', 'sandstorm', 'blizzard'];
        const candidates = weathers.filter(w => w !== prev.weather);
        const randomWeather = candidates[Math.floor(Math.random() * candidates.length)];
        nextWeather = randomWeather;
        
        const wLabel = nextWeather === 'clear' ? '☀️ Clear Skies'
                     : nextWeather === 'rainy' ? '🌧️ Pouring Rain & Storms'
                     : nextWeather === 'foggy' ? '🌫️ Dense Fog'
                     : nextWeather === 'snowy' ? '❄️ Gentle Snow'
                     : nextWeather === 'sandstorm' ? '🌪️ Swirling Sandstorm'
                     : '🌨️ Frostbite Blizzard';
                     
        const ritualNames = {
          clear: '☀️ Divine Solar Cleansing Ritual',
          rainy: '🌧️ Cosmic Torrent Storm Calling',
          foggy: '🌫️ Ethereal Shadow-Weave Fog Chant',
          snowy: '❄️ Celestial Gentle Frostfall',
          sandstorm: '🌪️ Arid Great Dune Sandstorm',
          blizzard: '🌨️ Glacial Eternal Blizzard Channelling'
        };
        const rName = ritualNames[nextWeather] || 'Divine Weather Alteration';

        staticLogs.push(`🌌 SOVEREIGN GM RITUAL: The autonomous Game Master has invoked "${rName}"! The global climate has transitioned to ${wLabel}.`);
      } else if (prev.isOverworld && !prev.gmAutonomousWeather && updatedStats.turnsPlayed % 40 === 0) {
        const roll = Math.random();
        if (prev.biome === 'desert') {
          nextWeather = roll > 0.70 ? 'sandstorm' : (roll > 0.50 ? 'foggy' : 'clear');
        } else if (prev.biome === 'tundra') {
          nextWeather = roll > 0.75 ? 'blizzard' : (roll > 0.40 ? 'snowy' : 'clear');
        } else if (prev.biome === 'swamp') {
          nextWeather = roll > 0.60 ? 'rainy' : (roll > 0.40 ? 'foggy' : 'clear');
        } else {
          nextWeather = roll > 0.70 ? 'rainy' : (roll > 0.50 ? 'foggy' : 'clear');
        }

        if (nextWeather !== prev.weather) {
          const wLabel = nextWeather === 'clear' ? '☀️ Clear Skies'
                       : nextWeather === 'rainy' ? '🌧️ Pouring Rain & Storms'
                       : nextWeather === 'foggy' ? '🌫️ Dense Fog'
                       : nextWeather === 'snowy' ? '❄️ Gentle Snow'
                       : nextWeather === 'sandstorm' ? '🌪️ Swirling Sandstorm'
                       : '🌨️ Frostbite Blizzard';
          staticLogs.push(`☁️ The weather shifts! The area is now covered in ${wLabel}.`);
        }
      }

      const getSeasonFromTurns = (turns: number): 'spring' | 'summer' | 'autumn' | 'winter' => {
        const cycle = Math.floor(turns / 250) % 4;
        if (cycle === 0) return 'spring';
        if (cycle === 1) return 'summer';
        if (cycle === 2) return 'autumn';
        return 'winter';
      };

      const currentSeason = getSeasonFromTurns(prev.playerStats.turnsPlayed);
      const nextSeason = getSeasonFromTurns(updatedStats.turnsPlayed);

      if (nextSeason !== currentSeason) {
        let msg = '';
        if (nextSeason === 'spring') {
          msg = '🌸 [SEASON TRANSITION]: The cycle of life turns. Fresh blossoms bloom under gentle skies! Lowland fields are rich with double-yield Wild Berries.';
        } else if (nextSeason === 'summer') {
          msg = '☀️ [SEASON TRANSITION]: The midyear sun peaks! Severe drought heatwaves slow traveling speeds and slowly sap 1 Focus (MP) every 15 turns.';
        } else if (nextSeason === 'autumn') {
          msg = '🍂 [SEASON TRANSITION]: Leaves turn amber. Thick shrouds of mist cover the land, reducing vision by 50% but boosting stealth critical strikes by +40%.';
        } else if (nextSeason === 'winter') {
          msg = '❄️ [SEASON TRANSITION]: Solstice freeze! Glacial winter blizzards sweep the land. Overworld lakes and puddles freeze into solid walkable ice platforms, but your carrying weight penalties are 1.5x more severe and berry gathering is frozen barren!';
        }
        staticLogs.push(msg);

        const sEv = new CustomEvent('spawn-game-effect', {
          detail: { x: px, y: py, text: `${nextSeason.toUpperCase()} TIME!`, type: 'heal' },
        });
        window.dispatchEvent(sEv);
      }

      if (prev.isOverworld && nextSeason === 'summer') {
        if (updatedStats.turnsPlayed % 15 === 0) {
          playerMp = Math.max(0, playerMp - 1);
          staticLogs.push(`☀️ [SUMMER HEAT]: The blazing sun saps your concentration! You lose 1 Focus (MP) to dehydration.`);
          const heatEv = new CustomEvent('spawn-game-effect', {
            detail: { x: px, y: py, text: `-1 MP (Heat) ☀️`, type: 'dmg' },
          });
          window.dispatchEvent(heatEv);
        }
      }

      const hoursPrev = Math.floor(prev.gameTime / 60);
      const hoursNext = Math.floor(nextTimeVal / 60);
      if (hoursPrev !== hoursNext) {
        if (hoursNext === 18) {
          staticLogs.push(`🌇 Sunset approaches. The skies burn with warm amber twilight.`);
        } else if (hoursNext === 20) {
          staticLogs.push(`🌙 Night has fallen. Wilderness shadows grow deep, and town gates close.`);
        } else if (hoursNext === 4) {
          staticLogs.push(`🌅 Dawn rises with soft lavender hues. Light begins to bleed into the horizon.`);
        } else if (hoursNext === 6) {
          staticLogs.push(`☀️ Morning has arrived. A fresh day of overworld travel begins!`);
        }
      }

      if (prev.isOverworld && updatedStats.turnsPlayed > 0 && updatedStats.turnsPlayed % 55 === 22) {
        const nudgeMsg = getGMPointOfInterestNudge(prev.currentChunkX, prev.currentChunkY, updatedStats.turnsPlayed);
        if (nudgeMsg) {
          staticLogs.push(nudgeMsg);
        }
      }

      const pLevel = updatedStats.level || 1;
      const weaponVal = prev.currentWeapon ? Math.max(0, prev.currentWeapon.damage) : 0;
      const armorVal = (nextArmor?.defense || 0) + 
                       (nextHelmet?.defense || 0) + 
                       (nextGloves?.defense || 0) + 
                       (nextBoots?.defense || 0) + 
                       (nextShield?.defense || 0);

      const gearRating = weaponVal + armorVal;

      const totalStats = (updatedStats.str || 10) + 
                          (updatedStats.dex || 10) + 
                          (updatedStats.int || 10) + 
                          (updatedStats.cha || 10) + 
                          (updatedStats.lck || 10);
      const statExcess = Math.max(0, totalStats - 50);

      const gearBonusFactor = Math.max(0, gearRating - 4) * 0.03;
      const statBonusFactor = statExcess * 0.01;
      const levelBonusFactor = Math.max(0, pLevel - 1) * 0.05;

      const playerScaleCoeff = 1.0 + levelBonusFactor + gearBonusFactor + statBonusFactor;
      const atkScaleCoeff = 1.0 + (playerScaleCoeff - 1.0) * 0.35;

      const activeMonstersCount = nextEnemies.filter(e => !e.isFollower && !e.isTownGuard).length;
      const gmSpawnInterval = updatedStats.turnsPlayed > 300 ? 35 : 45;
      const maxActiveRoaming = updatedStats.turnsPlayed > 300 ? 8 : 6;

      if (updatedStats.turnsPlayed % gmSpawnInterval === 0 && activeMonstersCount < maxActiveRoaming) {
        let spawnedCoordinate: { x: number; y: number } | null = null;
        for (let attempt = 0; attempt < 40; attempt++) {
          const dx = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 11) + 20);
          const dy = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 11) + 20);
          const rx = px + dx;
          const ry = py + dy;

          if (rx >= 0 && rx < LEVEL_WIDTH && ry >= 0 && ry < LEVEL_HEIGHT) {
            const levelTile = prev.map[ry]?.[rx];
            const isBlocked = nextEnemies.some(e => e.x === rx && e.y === ry) || (px === rx && py === ry);
            if (!isBlocked && (levelTile === TileType.Floor || levelTile === TileType.Grass || levelTile === TileType.Path)) {
              spawnedCoordinate = { x: rx, y: ry };
              break;
            }
          }
        }

        if (spawnedCoordinate) {
          const roll = Math.random();
          let spawnedType = EnemyType.Rat;
          if (roll < 0.08) {
            spawnedType = EnemyType.LootGoblin;
          } else {
            const innerRoll = Math.random();
            if (prev.playerStats.depth >= 6 || updatedStats.turnsPlayed > 400) {
              if (innerRoll > 0.90) spawnedType = EnemyType.Louhi;
              else if (innerRoll > 0.80) spawnedType = EnemyType.IkuTurso;
              else if (innerRoll > 0.70) spawnedType = EnemyType.Otso;
              else if (innerRoll > 0.50) spawnedType = EnemyType.Dragon;
              else if (innerRoll > 0.35) spawnedType = EnemyType.Kalma;
              else spawnedType = EnemyType.DreadKnight;
            } else if (prev.playerStats.depth > 3) {
              if (innerRoll > 0.85) spawnedType = EnemyType.Hiisi;
              else if (innerRoll > 0.70) spawnedType = EnemyType.Nakki;
              else if (innerRoll > 0.50) spawnedType = EnemyType.OrcBrute;
              else if (innerRoll > 0.30) spawnedType = EnemyType.SkeletonMage;
              else spawnedType = EnemyType.Goblin;
            } else {
              if (innerRoll > 0.85) spawnedType = EnemyType.Nakki;
              else if (innerRoll > 0.70) spawnedType = EnemyType.Hiisi;
              else if (innerRoll > 0.50) spawnedType = EnemyType.SkeletonMage;
              else if (innerRoll > 0.30) spawnedType = EnemyType.Goblin;
              else spawnedType = EnemyType.Rat;
            }
          }

          const enemyTemplate = getEnemyTemplate(spawnedType);
          const isBoss = spawnedType === EnemyType.Otso || spawnedType === EnemyType.Louhi || spawnedType === EnemyType.IkuTurso;
          const hpMult = isBoss ? 5.0 : 1.0;
          const atkMult = isBoss ? 2.0 : 1.0;

          const newRoamingEnemy: Enemy = {
            id: `gm_spawned_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
            x: spawnedCoordinate.x,
            y: spawnedCoordinate.y,
            type: spawnedType,
            name: isBoss ? `👑 Roaming ${enemyTemplate.name}` : `Roaming ${enemyTemplate.name}`,
            hp: Math.round(enemyTemplate.baseHp * playerScaleCoeff * hpMult * ((window as any).arenaEnemyHpMultiplier || 1.0)),
            maxHp: Math.round(enemyTemplate.baseHp * playerScaleCoeff * hpMult * ((window as any).arenaEnemyHpMultiplier || 1.0)),
            atk: Math.round(enemyTemplate.baseAtk * atkScaleCoeff * atkMult * ((window as any).arenaEnemyDamageMultiplier || 1.0)),
            def: Math.round((enemyTemplate.baseDef + (isBoss ? 5 : 0)) * atkScaleCoeff),
            range: enemyTemplate.range || 1,
            speed: enemyTemplate.speed || 1,
            color: enemyTemplate.color,
            char: enemyTemplate.char,
            state: EnemyState.Chasing,
            isElite: Math.random() > 0.80 || isBoss,
            isBoss: isBoss,
            patrolPath: [{ x: spawnedCoordinate.x, y: spawnedCoordinate.y }],
            patrolIndex: 0,
            debuffs: []
          };

          nextEnemies.push(newRoamingEnemy);
          if (isBoss) {
            staticLogs.push(`🚨 [GM WARN]: The Game Master has spawned a roaming BOSS: ${enemyTemplate.name}! Defeat it for legendary drops!`);
          } else {
            staticLogs.push(`⚠️ [GM SYSTEM]: A hostile Roaming ${enemyTemplate.name} has spawned far away (20-30 tiles)! Adaptive scaling sets its HP to ${newRoamingEnemy.hp} due to your strength!`);
          }
        }
      }

      const caravanState = syncCaravanState(prev, nextTimeVal, nextNpcs, nextEnemies);
      nextNpcs = caravanState.npcs;
      nextEnemies = caravanState.enemies;

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

      // -----------------------------------------------------------
      // ENEMY & NPC TURN ACTIONS (Movement, AI, and Attacks)
      // -----------------------------------------------------------
      const updatedEnemiesList: Enemy[] = [];

      for (let i = 0; i < nextEnemies.length; i++) {
        let e = { ...nextEnemies[i] };
        
        // Skip dead enemies
        if (e.hp <= 0) {
          continue;
        }

        // Process enemy debuffs (e.g. burn, poison, stun, freeze)
        let isStunned = false;
        if (e.debuffs && e.debuffs.length > 0) {
          const nextDebuffs = [];
          for (const d of e.debuffs) {
            const dType = String(d.type || '');
            const turns = (d as any).turnsRemaining ?? (d as any).duration ?? 1;
            if (dType === 'stun' || dType === 'freeze' || dType === CatalystType.Frost || dType === CatalystType.Shadow) {
              isStunned = true;
            } else if (dType === 'burn' || dType === 'poison' || dType === CatalystType.Fire || dType === CatalystType.Poison || dType === CatalystType.Lightning) {
              const tickVal = d.damagePerTurn || 3;
              e.hp -= tickVal;
              staticLogs.push(`🔥 ${e.name} takes -${tickVal} damage from status affliction!`);
              const eff = new CustomEvent('spawn-game-effect', {
                detail: { x: e.x, y: e.y, text: `-${tickVal}`, type: 'dmg' },
              });
              window.dispatchEvent(eff);
            }
            if (turns > 1) {
              nextDebuffs.push({ ...d, duration: turns - 1, turnsRemaining: turns - 1 });
            }
          }
          e.debuffs = nextDebuffs;
        }

        if (e.hp <= 0) {
          staticLogs.push(`💀 ${e.name} succumbed to status ailments!`);
          nextDefeatedCounts = incrementDefeatedEnemyCount(nextDefeatedCounts, e.name, e.type, !!e.isBoss);
          continue;
        }

        if (isStunned) {
          staticLogs.push(`💫 ${e.name} is stunned/frozen and skips their turn!`);
          updatedEnemiesList.push(e);
          continue;
        }

        const distToPlayer = Math.abs(e.x - px) + Math.abs(e.y - py);
        const enemyRange = e.range || 1;
        const dxToPlayer = Math.abs(e.x - px);
        const dyToPlayer = Math.abs(e.y - py);
        const isWithinAttackRange = dxToPlayer <= enemyRange && dyToPlayer <= enemyRange && (dxToPlayer > 0 || dyToPlayer > 0);

        const isHostile = !e.isFollower && (!e.isTownGuard || nextGuardsHostile);

        // FOV / Perception check (is enemy alert to player?)
        const isInPerceptionRange = distToPlayer <= 10;
        if (isInPerceptionRange && isHostile) {
          e.state = EnemyState.Chasing;
        }

        // --- 1. FOLLOWER LOGIC ---
        if (e.isFollower) {
          let attackedEnemy = false;
          for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
            if (targetIdx === i) continue;
            const target = nextEnemies[targetIdx];
            const isTargetHostileToPlayer = !target.isFollower && (!target.isTownGuard || nextGuardsHostile);
            if (target.hp > 0 && isTargetHostileToPlayer) {
              const targetDist = Math.abs(target.x - e.x) + Math.abs(target.y - e.y);
              if (targetDist <= enemyRange) {
                const followerDmg = Math.max(1, e.atk - target.def);
                target.hp -= followerDmg;
                staticLogs.push(`🛡️ [COMPANION]: ${e.name} strikes ${target.name} for ${followerDmg} damage!`);
                playSound('slash');
                const eff = new CustomEvent('spawn-game-effect', {
                  detail: { x: target.x, y: target.y, text: `-${followerDmg}`, type: 'dmg' },
                });
                window.dispatchEvent(eff);
                attackedEnemy = true;
                if (target.hp <= 0) {
                  staticLogs.push(`☠️ [COMPANION KILL]: ${e.name} defeated ${target.name}!`);
                  nextDefeatedCounts = incrementDefeatedEnemyCount(nextDefeatedCounts, target.name, target.type, !!target.isBoss);
                }
                break;
              }
            }
          }

          if (!attackedEnemy) {
            if (distToPlayer > 1) {
              const nextPos = getNextStepTowards(e.x, e.y, px, py, prev.map, true, updatedEnemiesList, e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso);
              if (nextPos && (nextPos.x !== px || nextPos.y !== py)) {
                const blocked = updatedEnemiesList.some(other => other.x === nextPos.x && other.y === nextPos.y);
                if (!blocked) {
                  e.x = nextPos.x;
                  e.y = nextPos.y;
                }
              }
            } else if (distToPlayer === 1 && Math.random() < 0.35) {
              // Idle jitter: Followers step to adjacent open tiles to prevent trapping player in corners/doors
              const dirs = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
              ].sort(() => Math.random() - 0.5);

              for (const d of dirs) {
                const tx = e.x + d.dx;
                const ty = e.y + d.dy;
                if (tx >= 0 && tx < LEVEL_WIDTH && ty >= 0 && ty < LEVEL_HEIGHT) {
                  const tile = prev.map[ty]?.[tx];
                  const walkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
                  const blocked = (tx === px && ty === py) || updatedEnemiesList.some(other => other.x === tx && other.y === ty);
                  const newDistToPlayer = Math.abs(tx - px) + Math.abs(ty - py);
                  if (walkable && !blocked && newDistToPlayer <= 2) {
                    e.x = tx;
                    e.y = ty;
                    break;
                  }
                }
              }
            }
          }
          updatedEnemiesList.push(e);
          continue;
        }

        // --- 1.5 TOWN GUARD SHIFT, PATROL & DEFENSE LOGIC ---
        if (e.isTownGuard && !nextGuardsHostile) {
          let attackedThreat = false;
          let nearestThreat: Enemy | null = null;
          let minThreatDist = 999;

          // 1. Threat Detection (Guards prioritize town defense!)
          for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
            if (targetIdx === i) continue;
            const target = nextEnemies[targetIdx];
            if (target.hp > 0 && !target.isFollower && !target.isTownGuard) {
              const targetDist = Math.abs(target.x - e.x) + Math.abs(target.y - e.y);
              if (targetDist < minThreatDist) {
                minThreatDist = targetDist;
                nearestThreat = target;
              }
              if (targetDist <= enemyRange) {
                // If guard was sleeping, wake up to attack threat!
                if (e.state === EnemyState.Sleeping) {
                  e.state = EnemyState.Patrolling;
                  if (e.originalChar) e.char = e.originalChar;
                }
                const guardDmg = Math.max(1, e.atk - target.def);
                target.hp -= guardDmg;
                staticLogs.push(`🛡️ [TOWN GUARD]: ${e.name} strikes hostile ${target.name} for ${guardDmg} damage!`);
                playSound('slash');
                const eff = new CustomEvent('spawn-game-effect', {
                  detail: { x: target.x, y: target.y, text: `-${guardDmg}`, type: 'dmg' },
                });
                window.dispatchEvent(eff);
                attackedThreat = true;
                if (target.hp <= 0) {
                  staticLogs.push(`⚔️ [TOWN SECURED]: Town Guard defeated ${target.name}!`);
                  nextDefeatedCounts = incrementDefeatedEnemyCount(nextDefeatedCounts, target.name, target.type, !!target.isBoss);
                }
                break;
              }
            }
          }

          // 2. Chase nearby threat if within range <= 12
          if (!attackedThreat && nearestThreat && minThreatDist <= 12) {
            if (e.state === EnemyState.Sleeping) {
              e.state = EnemyState.Patrolling;
              if (e.originalChar) e.char = e.originalChar;
              staticLogs.push(`🛡️ [TOWN GUARD ALARM]: ${e.name} wakes from barracks bed to intercept hostile ${nearestThreat.name}!`);
            }
            const nextPos = getNextStepTowards(e.x, e.y, nearestThreat.x, nearestThreat.y, prev.map, true, updatedEnemiesList, false);
            if (nextPos && (nextPos.x !== px || nextPos.y !== py)) {
              const blocked = updatedEnemiesList.some(other => other.x === nextPos.x && other.y === nextPos.y);
              if (!blocked) {
                e.x = nextPos.x;
                e.y = nextPos.y;
              }
            }
          } else if (!attackedThreat) {
            // 3. Shift Schedule & Sleeping vs Patrol Logic
            const minutes = prev.gameTime || 0;
            const hour = Math.floor((minutes % 1440) / 60);
            const isDaytime = hour >= 6 && hour < 18;

            const shift = e.shift || (i % 2 === 0 ? 'day' : 'night');
            let isOnShift = true;
            if (shift === 'day') {
              isOnShift = isDaytime;
            } else if (shift === 'night') {
              isOnShift = !isDaytime;
            } else if (shift === 'sentry') {
              isOnShift = true; // Sentries are on watch 24/7
            }

            if (!isOnShift) {
              // --- OFF SHIFT: HEAD TO BARRACKS BED & SLEEP ---
              let bedX = e.barracksBed?.x;
              let bedY = e.barracksBed?.y;

              // Fallback search for nearest Bed tile if barracksBed not assigned
              if (bedX === undefined || bedY === undefined) {
                let nearestBedDist = 999;
                for (let ry = 0; ry < prev.map.length; ry++) {
                  for (let rx = 0; rx < prev.map[0].length; rx++) {
                    if (prev.map[ry][rx] === TileType.Bed) {
                      const d = Math.abs(rx - e.x) + Math.abs(ry - e.y);
                      if (d < nearestBedDist) {
                        nearestBedDist = d;
                        bedX = rx;
                        bedY = ry;
                      }
                    }
                  }
                }
              }

              if (bedX !== undefined && bedY !== undefined) {
                if (e.x === bedX && e.y === bedY) {
                  // Reached bed in Barracks -> Sleep!
                  if (e.state !== EnemyState.Sleeping) {
                    e.state = EnemyState.Sleeping;
                    if (!e.originalChar) e.originalChar = e.char;
                    e.char = '😴';
                  }
                } else {
                  // Walking to Barracks Bed
                  if (e.state === EnemyState.Sleeping) {
                    e.state = EnemyState.Patrolling;
                  }
                  const nextPos = getNextStepTowards(e.x, e.y, bedX, bedY, prev.map, true, updatedEnemiesList, false);
                  if (nextPos && (nextPos.x !== px || nextPos.y !== py)) {
                    const blocked = updatedEnemiesList.some(other => other.x === nextPos.x && other.y === nextPos.y);
                    if (!blocked) {
                      e.x = nextPos.x;
                      e.y = nextPos.y;
                    }
                  }
                }
              } else {
                // If no bed exists in map, sleep where standing off-shift
                if (e.state !== EnemyState.Sleeping) {
                  e.state = EnemyState.Sleeping;
                  if (!e.originalChar) e.originalChar = e.char;
                  e.char = '😴';
                }
              }
            } else {
              // --- ON SHIFT: ACTIVE DUTY PATROL & WATCH ---
              if (e.state === EnemyState.Sleeping) {
                e.state = EnemyState.Patrolling;
                if (e.originalChar) e.char = e.originalChar;
              }

              if (e.patrolPath && e.patrolPath.length > 0) {
                let currentIdx = e.patrolIndex || 0;
                let targetPt = e.patrolPath[currentIdx % e.patrolPath.length];

                if (targetPt && e.x === targetPt.x && e.y === targetPt.y) {
                  currentIdx = (currentIdx + 1) % e.patrolPath.length;
                  e.patrolIndex = currentIdx;
                  targetPt = e.patrolPath[currentIdx % e.patrolPath.length];
                }

                if (targetPt) {
                  const nextPos = getNextStepTowards(e.x, e.y, targetPt.x, targetPt.y, prev.map, true, updatedEnemiesList, false);
                  if (nextPos && (nextPos.x !== px || nextPos.y !== py)) {
                    const blocked = updatedEnemiesList.some(other => other.x === nextPos.x && other.y === nextPos.y);
                    if (!blocked) {
                      e.x = nextPos.x;
                      e.y = nextPos.y;
                    }
                  }
                }
              } else {
                // Occasional local wandering step on town paths/floors
                if (Math.random() < 0.35) {
                  const dirs = [
                    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                    { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
                  ];
                  const d = dirs[Math.floor(Math.random() * dirs.length)];
                  const nx = e.x + d.dx;
                  const ny = e.y + d.dy;
                  if (nx >= 0 && nx < prev.map[0].length && ny >= 0 && ny < prev.map.length) {
                    const tile = prev.map[ny][nx];
                    const isWalkable = tile === TileType.Floor || tile === TileType.Path || tile === TileType.Grass || tile === TileType.Door;
                    const blocked = updatedEnemiesList.some(other => other.x === nx && other.y === ny) || (nx === px && ny === py);
                    if (isWalkable && !blocked) {
                      e.x = nx;
                      e.y = ny;
                    }
                  }
                }
              }
            }
          }

          updatedEnemiesList.push(e);
          continue;
        }

        // --- 2. HOSTILE ATTACK LOGIC ---
        if (isHostile && isWithinAttackRange) {
          let lunarDodgeBonus = 0;
          if (isLunarBlessingActive(prev, 'new_moon')) lunarDodgeBonus = 0.15;
          else if (isLunarBlessingActive(prev, 'waxing_crescent')) lunarDodgeBonus = 0.10;

          const effectiveDex = getEffectiveStats(prev.playerStats).dex || 10;
          const dodgeChance = Math.min(0.5, Math.max(0, (effectiveDex - 10) * 0.02 + lunarDodgeBonus));

          if (Math.random() < dodgeChance) {
            staticLogs.push(`💨 You dodged ${e.name}'s attack!`);
            playSound('bump');
          } else {
            const baseAtk = e.atk;
            const effectiveDef = getEffectiveStats(prev.playerStats).def || 0;
            const totalArmorDef = (nextArmor?.defense || 0) + 
                             (nextHelmet?.defense || 0) + 
                             (nextGloves?.defense || 0) + 
                             (nextBoots?.defense || 0) + 
                             (nextShield?.defense || 0) + 
                             effectiveDef;
            
            let braceMult = prev.isBraced ? 2.0 : 1.0;
            const absorbedDef = Math.floor(totalArmorDef * braceMult);
            const strikeDmg = Math.max(1, baseAtk - absorbedDef);

            playerHp = Math.max(0, playerHp - strikeDmg);
            staticLogs.push(`⚔️ ${e.name} attacks you for -${strikeDmg} HP!`);
            playSound('injury');

            const effectEv = new CustomEvent('spawn-game-effect', {
              detail: { x: px, y: py, text: `-${strikeDmg} HP`, type: 'dmg' },
            });
            window.dispatchEvent(effectEv);

            if (nextArmor && Math.random() < 0.25) {
              const decayAmt = getItemDurabilityDecay(nextArmor, 1);
              const curDur = nextArmor.durability ?? nextArmor.maxDurability ?? 100;
              const newDur = Math.max(0, curDur - decayAmt);
              nextArmor = { ...nextArmor, durability: newDur };
              if (newDur === 0) {
                staticLogs.push(`🛡️ [EQUIPMENT BROKEN]: Your ${nextArmor.name} has broken!`);
              }
            }
            if (nextShield && Math.random() < 0.25) {
              const decayAmt = getItemDurabilityDecay(nextShield, 1);
              const curDur = nextShield.durability ?? nextShield.maxDurability ?? 100;
              const newDur = Math.max(0, curDur - decayAmt);
              nextShield = { ...nextShield, durability: newDur };
              if (newDur === 0) {
                staticLogs.push(`🛡️ [EQUIPMENT BROKEN]: Your ${nextShield.name} has broken!`);
              }
            }

            const scarResult = evaluateScarAcquisition(strikeDmg, playerHp, updatedStats.maxHp, activeScars, updatedStats.turnsPlayed);
            if (scarResult) {
              activeScars.push(scarResult.scar);
              staticLogs.push(scarResult.logText);
            }
          }
          updatedEnemiesList.push(e);
          continue;
        }

        // --- 3. MOVEMENT & PATHFINDING LOGIC ---
        if (e.state === EnemyState.Chasing && isHostile) {
          const nextStep = getNextStepTowards(e.x, e.y, px, py, prev.map, true, updatedEnemiesList, e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso);
          if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
            const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                         nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
            const isTileWalkable = prev.map[nextStep.y]?.[nextStep.x] !== TileType.Wall && prev.map[nextStep.y]?.[nextStep.x] !== TileType.Water;
            if (!isTileBlockedByEnemy && isTileWalkable) {
              e.x = nextStep.x;
              e.y = nextStep.y;
            }
          }
        } else if (e.state === EnemyState.Patrolling && e.patrolPath && e.patrolPath.length > 0) {
          let currentPatrolIdx = e.patrolIndex || 0;
          let targetTile = e.patrolPath[currentPatrolIdx];
          
          // If already at target tile, advance to next node in patrol route
          if (targetTile && e.x === targetTile.x && e.y === targetTile.y) {
            currentPatrolIdx = (currentPatrolIdx + 1) % e.patrolPath.length;
            e.patrolIndex = currentPatrolIdx;
            targetTile = e.patrolPath[currentPatrolIdx];
          }

          if (targetTile) {
            const nextStep = getNextStepTowards(e.x, e.y, targetTile.x, targetTile.y, prev.map, true, updatedEnemiesList, e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso);
            if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
              const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                           nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
              const isTileWalkable = prev.map[nextStep.y]?.[nextStep.x] !== TileType.Wall && prev.map[nextStep.y]?.[nextStep.x] !== TileType.Water;
              if (!isTileBlockedByEnemy && isTileWalkable) {
                e.x = nextStep.x;
                e.y = nextStep.y;
              }
            }
          }
        }

        updatedEnemiesList.push(e);
      }

      nextEnemies = updatedEnemiesList;

      // --- 4. NPC & CAT WANDERING MOVEMENT ---
      if (nextNpcs && nextNpcs.length > 0) {
        const moveDirs = [
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        nextNpcs = nextNpcs.map((npc) => {
          if (!npc) return npc;
          const isCat = npc.id?.startsWith('npc_cat_') || npc.role === 'special_cat';
          const isWanderingVillager = npc.role === 'villager' || npc.role === 'peasant' || npc.role === 'bard';
          if ((isCat || isWanderingVillager) && Math.random() < (isCat ? 0.6 : 0.35)) {
            const dir = moveDirs[Math.floor(Math.random() * moveDirs.length)];
            const nx = npc.x + dir.dx;
            const ny = npc.y + dir.dy;
            if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
              const tile = prev.map[ny]?.[nx];
              const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
              const isOccupiedByPlayer = nx === px && ny === py;
              const isOccupiedByEnemy = nextEnemies.some(e => e.x === nx && e.y === ny);
              if (isWalkable && !isOccupiedByPlayer && !isOccupiedByEnemy) {
                return { ...npc, x: nx, y: ny };
              }
            }
          }
          return npc;
        });
      }

      // Process logs & state update return
      let finalLogs = prev.logs;
      if (staticLogs.length > 0) {
        const formattedLogs = staticLogs.map((text, idx) => ({
          id: `ai_log_${Date.now()}_${idx}_${Math.random()}`,
          text,
          type: 'system' as const,
          timestamp: 'TURN'
        }));
        finalLogs = [...prev.logs, ...formattedLogs].slice(-45);
      }

      return {
        ...prev,
        ...gmStateUpdates,
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
