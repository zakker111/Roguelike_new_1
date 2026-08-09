import { Dispatch, SetStateAction, useCallback } from 'react';
import { TileType, Enemy, GameState, PlayerEffect, EnemyState, EnemyType, CatalystType } from '../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT, isLunarBlessingActive } from '../utils/gameUtils';
import { getNextStepTowards, hasLineOfSight } from '../utils/ai';
import { findNearestSafeNpcTile } from '../utils/overworld';
import { getEnemyTemplate } from '../utils/dungeon';
import { syncCaravanState } from '../utils/caravanAndTerritory';
import { getGMPointOfInterestNudge } from '../utils/gmNarrator';
import { getCompanionAdvice } from '../utils/companionAdvice';
import { getEnemyFleeQuote } from '../utils/fleeQuotes';
import { incrementDefeatedEnemyCount } from '../utils/bestiary';
import { evaluateScarAcquisition, getEffectiveStats } from '../utils/scars';
import { getItemDurabilityDecay } from '../utils/spellsAndEquipment';
import { calculateArchetypeDamageAdjustment } from '../utils/combatArchetypes';
import { tickActiveGMStoryteller } from '../utils/gmStoryteller';
import { getWeatherAmbientBark, getTavernDrinkingBark, getCampfireDialogueBark, getBlizzardShelterBark } from '../utils/npcDialogue';

export interface UseEnemyAIParams {
  gameStateRef?: any;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string, options?: any) => void;
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

      // Periodic Companion Tactical Bark
      if (prev.followers && prev.followers.length > 0 && updatedStats.turnsPlayed > 0 && updatedStats.turnsPlayed % 60 === 35) {
        const activeFol = prev.followers[0];
        const tempGs: GameState = { ...prev, playerStats: updatedStats };
        const advice = getCompanionAdvice(tempGs, activeFol);
        if (advice) {
          staticLogs.push(advice);
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
          const hpMult = isBoss ? 2.8 : 1.0;
          const atkMult = isBoss ? 1.8 : 1.0;

          const newRoamingEnemy: Enemy = {
            id: `gm_spawned_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
            x: spawnedCoordinate.x,
            y: spawnedCoordinate.y,
            type: spawnedType,
            name: isBoss ? `👑 Roaming ${enemyTemplate.name}` : `Roaming ${enemyTemplate.name}`,
            hp: Math.round(enemyTemplate.baseHp * playerScaleCoeff * hpMult * ((window as any).arenaEnemyHpMultiplier || 1.0)),
            maxHp: Math.round(enemyTemplate.baseHp * playerScaleCoeff * hpMult * ((window as any).arenaEnemyHpMultiplier || 1.0)),
            atk: Math.round(enemyTemplate.baseAtk * atkScaleCoeff * atkMult * ((window as any).arenaEnemyDamageMultiplier || 1.0)),
            def: Math.round((enemyTemplate.baseDef + (isBoss ? 3 : 0)) * Math.min(1.4, atkScaleCoeff)),
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
              if (prev.visible[e.y]?.[e.x]) {
                staticLogs.push(`🔥 ${e.name} takes -${tickVal} damage from status affliction!`);
                const eff = new CustomEvent('spawn-game-effect', {
                  detail: { x: e.x, y: e.y, text: `-${tickVal}`, type: 'dmg' },
                });
                window.dispatchEvent(eff);
              }
            }
            if (turns > 1) {
              nextDebuffs.push({ ...d, duration: turns - 1, turnsRemaining: turns - 1 });
            }
          }
          e.debuffs = nextDebuffs;
        }

        if (e.hp <= 0) {
          if (prev.visible[e.y]?.[e.x]) {
            staticLogs.push(`💀 ${e.name} succumbed to status ailments!`);
          }
          nextDefeatedCounts = incrementDefeatedEnemyCount(nextDefeatedCounts, e.name, e.type, !!e.isBoss);
          continue;
        }

        if (isStunned) {
          if (prev.visible[e.y]?.[e.x]) {
            staticLogs.push(`💫 ${e.name} is stunned/frozen and skips their turn!`);
          }
          updatedEnemiesList.push(e);
          continue;
        }

        // PHASE 3: STAGGER / GUARD BAR RECOVERY & TURN SKIPPING
        if (e.isStaggered) {
          e.staggerTurns = (e.staggerTurns || 1) - 1;
          if (e.staggerTurns <= 0) {
            e.isStaggered = false;
            e.staggerMeter = 0;
            if (prev.visible[e.y]?.[e.x]) {
              staticLogs.push(`🛡️ ${e.name} recovers their posture and stance!`);
            }
          } else {
            if (prev.visible[e.y]?.[e.x]) {
              staticLogs.push(`💫 ${e.name} is STAGGERED and helpless!`);
            }
            updatedEnemiesList.push(e);
            continue;
          }
        }

        // PHASE 3: TELEGRAPHED ATTACK RESOLUTION
        if (e.telegraphedAttack) {
          const attack = e.telegraphedAttack;
          attack.turnsRemaining -= 1;
          if (attack.turnsRemaining <= 0) {
            const tx = attack.targetX;
            const ty = attack.targetY;
            const dmg = attack.damage;

            if (px === tx && py === ty) {
              if (prev.isBraced) {
                const reducedDmg = Math.max(1, Math.floor(dmg * 0.25));
                playerHp = Math.max(0, playerHp - reducedDmg);
                const curStagger = e.staggerMeter || 0;
                const maxStag = e.maxStaggerMeter || (e.isBoss ? 120 : e.isElite ? 75 : 45);
                e.staggerMeter = Math.min(maxStag, curStagger + 35);
                if (e.staggerMeter >= maxStag && !e.isStaggered) {
                  e.isStaggered = true;
                  e.staggerTurns = 2;
                }
                staticLogs.push(`🛡️ [PERFECT BRACE]: You braced firmly against ${e.name}'s ${attack.name}! Absorbed 75% of damage (-${reducedDmg} HP) and counter-staggered the attacker!`);
                playSound('shield');
                const eff = new CustomEvent('spawn-game-effect', {
                  detail: { x: px, y: py, text: `🛡️ BRACED (-${reducedDmg})`, type: 'heal' },
                });
                window.dispatchEvent(eff);
              } else {
                playerHp = Math.max(0, playerHp - dmg);
                staticLogs.push(`💥 [TELEGRAPHED IMPACT]: ${e.name}'s heavy ${attack.name} smashes you at (${tx}, ${ty}) for -${dmg} HP!`);
                playSound('injury');
                const eff = new CustomEvent('spawn-game-effect', {
                  detail: { x: px, y: py, text: `💥 CRUSHED (-${dmg})`, type: 'dmg' },
                });
                window.dispatchEvent(eff);
              }
            } else {
              staticLogs.push(`💨 [TACTICAL DODGE]: ${e.name}'s ${attack.name} smashes empty ground at (${tx}, ${ty}) as you dodged out of danger!`);
              playSound('bump');
              const eff = new CustomEvent('spawn-game-effect', {
                detail: { x: tx, y: ty, text: `💨 DODGED!`, type: 'heal' },
              });
              window.dispatchEvent(eff);
            }
            e.telegraphedAttack = null;
            updatedEnemiesList.push(e);
            continue;
          }
        }

        const sameZ = (e.z ?? 0) === (prev.playerZ ?? 0);
        const distToPlayer = Math.abs(e.x - px) + Math.abs(e.y - py);
        const enemyRange = e.range || 1;
        const dxToPlayer = Math.abs(e.x - px);
        const dyToPlayer = Math.abs(e.y - py);
        const hasLOS = hasLineOfSight(e.x, e.y, px, py, prev.map);
        const isWithinAttackRange = sameZ && dxToPlayer <= enemyRange && dyToPlayer <= enemyRange && (dxToPlayer > 0 || dyToPlayer > 0) && (enemyRange === 1 || hasLOS);

        const isHostile = !e.isFollower && (!e.isTownGuard || nextGuardsHostile);

        // FOV / Perception check (is enemy alert to player?)
        const isInPerceptionRange = distToPlayer <= 10;
        if (sameZ && isInPerceptionRange && isHostile && (enemyRange === 1 || hasLOS)) {
          e.state = EnemyState.Chasing;
          if (!e.hasWarnedElite && (e.isBoss || e.maxHp >= 75 || e.name.toLowerCase().includes('commander') || e.name.toLowerCase().includes('elite')) && prev.followers && prev.followers.length > 0) {
            e.hasWarnedElite = true;
            const folName = prev.followers[0].name;
            staticLogs.push(`🛡️ ${folName}: "Master, heads up! An elite foe (${e.name}) is bearing down on us!"`);
          }
        }

        // --- 1. FOLLOWER LOGIC ---
        if (e.isFollower) {
          let attackedEnemy = false;
          let nearestHostile: Enemy | null = null;
          let minHostileDist = 999;

          // Determine effective attack range & style for this follower
          let followerRange = e.range || 1;
          let rangedType: 'bow' | 'magic' | 'spear' | 'melee' = 'melee';

          if (e.followerId) {
            const linkedFol = prev.followers?.find(f => f.id === e.followerId);
            if (linkedFol) {
              const weapon = linkedFol.equipment?.weapon;
              if (weapon?.range && weapon.range > 1) {
                followerRange = weapon.range;
              } else if (['Bow', 'Crossbow'].includes(weapon?.subType as string)) {
                followerRange = 4;
              } else if (['Staff', 'Wand'].includes(weapon?.subType as string)) {
                followerRange = 3;
              } else if (weapon?.subType === 'Spear') {
                followerRange = 2;
              } else if (['Mage', 'Archer', 'Ranger', 'Hunter', 'Crossbowman', 'Sorcerer'].includes(linkedFol.role)) {
                followerRange = ['Archer', 'Ranger', 'Hunter', 'Crossbowman'].includes(linkedFol.role) ? 4 : 3;
              }

              if (weapon?.subType === 'Bow' || weapon?.subType === 'Crossbow' || ['Archer', 'Ranger', 'Hunter', 'Crossbowman'].includes(linkedFol.role)) {
                rangedType = 'bow';
              } else if (weapon?.subType === 'Staff' || weapon?.subType === 'Wand' || ['Mage', 'Sorcerer'].includes(linkedFol.role)) {
                rangedType = 'magic';
              } else if (weapon?.subType === 'Spear') {
                rangedType = 'spear';
              }
            }
          }

          // 1. Identify nearest hostile target to follower
          for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
            if (targetIdx === i) continue;
            const target = nextEnemies[targetIdx];
            const isTargetHostileToPlayer = !target.isFollower && (!target.isTownGuard || nextGuardsHostile);
            if (target.hp > 0 && isTargetHostileToPlayer) {
              const targetDist = Math.abs(target.x - e.x) + Math.abs(target.y - e.y);
              if (targetDist < minHostileDist) {
                minHostileDist = targetDist;
                nearestHostile = target;
              }
            }
          }

          // 2. Check if player is fleeing
          let isPlayerFleeing = false;
          if (nearestHostile) {
            const playerDistToHostile = Math.abs(nearestHostile.x - px) + Math.abs(nearestHostile.y - py);
            const playerDistToFollower = distToPlayer;
            const playerHpPercent = updatedStats.hp / updatedStats.maxHp;

            if (
              playerDistToFollower >= 3 ||
              playerDistToHostile >= 4 ||
              (playerDistToHostile > minHostileDist && playerDistToFollower >= 2) ||
              playerHpPercent <= 0.3
            ) {
              isPlayerFleeing = true;
            }
          }

          // 3. Ranged / Melee Attack if hostile target is within followerRange
          if (nearestHostile) {
            const dx = Math.abs(nearestHostile.x - e.x);
            const dy = Math.abs(nearestHostile.y - e.y);
            const inAttackRange = followerRange === 1 ? (dx + dy <= 1) : (dx <= followerRange && dy <= followerRange && (dx > 0 || dy > 0));

            if (inAttackRange) {
              const target = nearestHostile;
              const followerDmg = Math.max(1, e.atk - target.def);
              target.hp -= followerDmg;
              const isActionVisible = (prev.visible[target.y]?.[target.x] ?? false) || (prev.visible[e.y]?.[e.x] ?? false);

              if (isActionVisible) {
                if (rangedType === 'bow') {
                  staticLogs.push(`🏹 [COMPANION RANGED]: ${e.name} shoots an arrow at ${target.name} for ${followerDmg} damage!`);
                  playSound('arrow', { x: target.x, y: target.y, playerX: px, playerY: py });
                } else if (rangedType === 'magic') {
                  staticLogs.push(`✨ [COMPANION SPELL]: ${e.name} launches an elemental bolt at ${target.name} for ${followerDmg} damage!`);
                  playSound('spell', { x: target.x, y: target.y, playerX: px, playerY: py });
                } else if (rangedType === 'spear') {
                  staticLogs.push(`🔱 [COMPANION REACH]: ${e.name} thrusts their spear at ${target.name} for ${followerDmg} damage!`);
                  playSound('slash', { x: target.x, y: target.y, playerX: px, playerY: py });
                } else {
                  staticLogs.push(`🛡️ [COMPANION]: ${e.name} strikes ${target.name} for ${followerDmg} damage!`);
                  playSound('slash', { x: target.x, y: target.y, playerX: px, playerY: py });
                }

                const eff = new CustomEvent('spawn-game-effect', {
                  detail: { x: target.x, y: target.y, text: `-${followerDmg}`, type: 'dmg' },
                });
                window.dispatchEvent(eff);
              }

              attackedEnemy = true;
              if (target.hp <= 0) {
                if (isActionVisible) {
                  staticLogs.push(`☠️ [COMPANION KILL]: ${e.name} defeated ${target.name}!`);
                }
                nextDefeatedCounts = incrementDefeatedEnemyCount(nextDefeatedCounts, target.name, target.type, !!target.isBoss);
              }
            }
          }

          // 4. Autonomous Movement: Engage nearby hostile, shoot from range, or Flee with Player
          if (!attackedEnemy) {
            if (isPlayerFleeing) {
              // Player is fleeing! Follower flees towards the player to fall back together
              if (distToPlayer > 8) {
                const safeSpot = findNearestSafeNpcTile(px, py, prev.map);
                const isOccupied = (safeSpot.x === px && safeSpot.y === py) || updatedEnemiesList.some(other => other.x === safeSpot.x && other.y === safeSpot.y);
                if (!isOccupied) {
                  e.x = safeSpot.x;
                  e.y = safeSpot.y;
                }
              } else if (distToPlayer > 1) {
                const nextPos = getNextStepTowards(e.x, e.y, px, py, prev.map, true, updatedEnemiesList, e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso);
                if (nextPos && (nextPos.x !== px || nextPos.y !== py)) {
                  const blocked = updatedEnemiesList.some(other => other.x === nextPos.x && other.y === nextPos.y);
                  if (!blocked) {
                    e.x = nextPos.x;
                    e.y = nextPos.y;
                  }
                }
              }
            } else if (nearestHostile && minHostileDist <= 10) {
              const dx = Math.abs(nearestHostile.x - e.x);
              const dy = Math.abs(nearestHostile.y - e.y);
              const alreadyInRange = dx <= followerRange && dy <= followerRange;

              if (!alreadyInRange) {
                // Player is standing ground! Move towards hostile until in shooting range
                const nextPos = getNextStepTowards(e.x, e.y, nearestHostile.x, nearestHostile.y, prev.map, true, updatedEnemiesList, false);
                if (nextPos && (nextPos.x !== px || nextPos.y !== py)) {
                  const blocked = updatedEnemiesList.some(other => other.x === nextPos.x && other.y === nextPos.y);
                  if (!blocked) {
                    e.x = nextPos.x;
                    e.y = nextPos.y;
                  }
                }
              }
            } else {
              // Normal following or idle jitter
              if (distToPlayer > 8) {
                const safeSpot = findNearestSafeNpcTile(px, py, prev.map);
                const isOccupied = (safeSpot.x === px && safeSpot.y === py) || updatedEnemiesList.some(other => other.x === safeSpot.x && other.y === safeSpot.y);
                if (!isOccupied) {
                  e.x = safeSpot.x;
                  e.y = safeSpot.y;
                }
              } else if (distToPlayer > 1) {
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
                const isGuardActionVisible = (prev.visible[target.y]?.[target.x] ?? false) || (prev.visible[e.y]?.[e.x] ?? false);
                if (isGuardActionVisible) {
                  staticLogs.push(`🛡️ [TOWN GUARD]: ${e.name} strikes hostile ${target.name} for ${guardDmg} damage!`);
                  playSound('slash', { x: target.x, y: target.y, playerX: px, playerY: py });
                  const eff = new CustomEvent('spawn-game-effect', {
                    detail: { x: target.x, y: target.y, text: `-${guardDmg}`, type: 'dmg' },
                  });
                  window.dispatchEvent(eff);
                }
                attackedThreat = true;
                if (target.hp <= 0) {
                  if (isGuardActionVisible) {
                    staticLogs.push(`⚔️ [TOWN SECURED]: Town Guard defeated ${target.name}!`);
                  }
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
              if (prev.visible[e.y]?.[e.x]) {
                staticLogs.push(`🛡️ [TOWN GUARD ALARM]: ${e.name} wakes from barracks bed to intercept hostile ${nearestThreat.name}!`);
              }
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
        let targetFollower: Enemy | null = null;
        if (isHostile) {
          for (const fol of updatedEnemiesList) {
            if (fol.isFollower && fol.hp > 0) {
              const fDistX = Math.abs(fol.x - e.x);
              const fDistY = Math.abs(fol.y - e.y);
              const folRange = e.range || 1;
              if (fDistX <= folRange && fDistY <= folRange && (fDistX > 0 || fDistY > 0)) {
                if (folRange === 1 || hasLineOfSight(e.x, e.y, fol.x, fol.y, prev.map)) {
                  targetFollower = fol;
                  break;
                }
              }
            }
          }
        }

        if (isHostile && targetFollower && (!isWithinAttackRange || Math.random() < 0.5)) {
          const fDmg = Math.max(1, e.atk - (targetFollower.def || 0));
          targetFollower.hp = Math.max(0, targetFollower.hp - fDmg);
          const isVisible = (prev.visible[targetFollower.y]?.[targetFollower.x] ?? false) || (prev.visible[e.y]?.[e.x] ?? false);
          if (isVisible) {
            staticLogs.push(`⚔️ [HOSTILE ATTACK]: ${e.name} strikes companion ${targetFollower.name} for -${fDmg} HP! (${targetFollower.hp}/${targetFollower.maxHp} HP remaining)`);
            playSound('injury');
            const eff = new CustomEvent('spawn-game-effect', {
              detail: { x: targetFollower.x, y: targetFollower.y, text: `-${fDmg} HP`, type: 'dmg' },
            });
            window.dispatchEvent(eff);
          }
          if (targetFollower.hp <= 0 && isVisible) {
            staticLogs.push(`💔 [COMPANION FALLEN]: ${targetFollower.name} has been wounded and fell in combat!`);
          }
          updatedEnemiesList.push(e);
          continue;
        }

        if (isHostile && isWithinAttackRange) {
          // Telegraphed Attack Wind-Up Initiation
          const isHeavy = e.isBoss || e.isElite || e.type === EnemyType.OrcBrute || e.type === EnemyType.Dragon || e.type === EnemyType.DreadKnight || e.type === EnemyType.Louhi || e.type === EnemyType.IkuTurso;
          const telegraphChance = isHeavy ? 0.35 : 0.18;

          if (!e.telegraphedAttack && Math.random() < telegraphChance) {
            const atkName = e.isBoss ? 'Sunder Titan Slam' : isHeavy ? 'Brutal Heavy Cleave' : 'Heavy Ground Strike';
            e.telegraphedAttack = {
              targetX: px,
              targetY: py,
              turnsRemaining: 1,
              damage: Math.round(e.atk * 1.6),
              name: atkName
            };
            staticLogs.push(`⚠️ [TELEGRAPH WARNING]: ${e.name} winds up ${atkName} targeting (${px}, ${py})! Move away or BRACE (B) to block!`);
            playSound('alert');
            const eff = new CustomEvent('spawn-game-effect', {
              detail: { x: e.x, y: e.y, text: `⚠️ TELEGRAPHING!`, type: 'dmg' },
            });
            window.dispatchEvent(eff);
            updatedEnemiesList.push(e);
            continue; // Skip standard attack this turn as enemy winds up!
          }

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
            let rawStrike = Math.max(1, baseAtk - absorbedDef);

            const isCritHit = Math.random() < 0.15;
            const archetypeAdj = calculateArchetypeDamageAdjustment(
              { archetype: e.archetype, isCrit: isCritHit },
              null,
              rawStrike
            );
            const strikeDmg = archetypeAdj.damage;
            if (archetypeAdj.logNote) {
              staticLogs.push(archetypeAdj.logNote);
            }

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

        // Check if cowardly/wounded enemy should enter Retreating state
        if (e.state === EnemyState.Chasing && !e.isBoss && (e.hp < e.maxHp * 0.25 || e.type === EnemyType.LootGoblin)) {
          e.state = EnemyState.Retreating;
          if (Math.random() < 0.35) {
            staticLogs.push(getEnemyFleeQuote(e.name, e.type));
          }
        }

        // --- 3. MOVEMENT & PATHFINDING LOGIC ---
        if (e.state === EnemyState.Chasing && isHostile) {
          let chaseTargetX = px;
          let chaseTargetY = py;

          // Pack Flanking AI: Goblins, Wolves, Bandits, Orcs try to flank from orthogonal angles
          const isPackUnit = [EnemyType.Goblin, EnemyType.Bandit, EnemyType.LootGoblin, EnemyType.OrcBrute, EnemyType.Hiisi].includes(e.type) ||
                             /goblin|wolf|bandit|outlaw|raider|pack|beast|rogue|hiisi|orc/i.test(e.name);

          if (isPackUnit) {
            // Orthogonal & diagonal angles around player: N, E, S, W, NE, SE, SW, NW
            const flankAngles = [
              { x: px, y: py - 1 },
              { x: px + 1, y: py },
              { x: px, y: py + 1 },
              { x: px - 1, y: py },
              { x: px + 1, y: py - 1 },
              { x: px + 1, y: py + 1 },
              { x: px - 1, y: py + 1 },
              { x: px - 1, y: py - 1 }
            ];

            let chosenFlank: { x: number; y: number } | null = null;
            for (const pos of flankAngles) {
              if (pos.x >= 0 && pos.x < LEVEL_WIDTH && pos.y >= 0 && pos.y < LEVEL_HEIGHT) {
                const tile = prev.map[pos.y]?.[pos.x];
                const isWall = tile === TileType.Wall || tile === TileType.Water;
                if (!isWall) {
                  const isOccupied = updatedEnemiesList.some(other => other.x === pos.x && other.y === pos.y) ||
                                     nextEnemies.some((other, idx) => idx > i && other.x === pos.x && other.y === pos.y);
                  if (!isOccupied) {
                    chosenFlank = pos;
                    break;
                  }
                }
              }
            }

            if (chosenFlank) {
              chaseTargetX = chosenFlank.x;
              chaseTargetY = chosenFlank.y;
            }
          }

          const nextStep = getNextStepTowards(e.x, e.y, chaseTargetX, chaseTargetY, prev.map, true, updatedEnemiesList, e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso);
          if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
            const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                         nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
            const isTileWalkable = prev.map[nextStep.y]?.[nextStep.x] !== TileType.Wall && prev.map[nextStep.y]?.[nextStep.x] !== TileType.Water;
            if (!isTileBlockedByEnemy && isTileWalkable) {
              e.x = nextStep.x;
              e.y = nextStep.y;
            }
          }
        } else if (e.state === EnemyState.Retreating) {
          // Call for Reinforcements: Cowardly/severely wounded enemies seek nearby dormant monster groups to alert them!
          let nearestDormant: Enemy | null = null;
          let minDormantDist = 999;

          if (!e.hasAlertedBackup) {
            for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
              if (targetIdx === i) continue;
              const target = nextEnemies[targetIdx];
              if (target.hp > 0 && !target.isFollower && !target.isTownGuard) {
                const isDormant = target.state === EnemyState.Sleeping || target.state === EnemyState.Patrolling || target.state !== EnemyState.Chasing;
                if (isDormant) {
                  const d = Math.abs(target.x - e.x) + Math.abs(target.y - e.y);
                  if (d < minDormantDist) {
                    minDormantDist = d;
                    nearestDormant = target;
                  }
                }
              }
            }
          }

          let retreatTargetX = e.x;
          let retreatTargetY = e.y;

          if (nearestDormant && minDormantDist <= 18) {
            // Move toward dormant monster group to call for backup
            retreatTargetX = nearestDormant.x;
            retreatTargetY = nearestDormant.y;

            if (minDormantDist <= 2) {
              e.hasAlertedBackup = true;
              nearestDormant.state = EnemyState.Chasing;
              if (nearestDormant.originalChar) nearestDormant.char = nearestDormant.originalChar;

              // Alert all nearby dormant monsters in radius 6 of the dormant leader
              for (let targetIdx = 0; targetIdx < nextEnemies.length; targetIdx++) {
                const nearby = nextEnemies[targetIdx];
                if (nearby.hp > 0 && !nearby.isFollower && !nearby.isTownGuard) {
                  const distToGroup = Math.abs(nearby.x - nearestDormant.x) + Math.abs(nearby.y - nearestDormant.y);
                  if (distToGroup <= 6) {
                    nearby.state = EnemyState.Chasing;
                    if (nearby.originalChar) nearby.char = nearby.originalChar;
                  }
                }
              }

              const isActionVisible = (prev.visible[e.y]?.[e.x] ?? false) || (prev.visible[nearestDormant.y]?.[nearestDormant.x] ?? false);
              if (isActionVisible) {
                staticLogs.push(`📢 [REINFORCEMENTS]: Wounded ${e.name} yells for backup, alerting nearby ${nearestDormant.name} to attack!`);
                playSound('bump', { x: e.x, y: e.y, playerX: px, playerY: py });
              }
            }
          } else {
            // Flee in opposite direction from player
            const dirX = Math.sign(e.x - px) || (Math.random() < 0.5 ? 1 : -1);
            const dirY = Math.sign(e.y - py) || (Math.random() < 0.5 ? 1 : -1);
            retreatTargetX = Math.max(0, Math.min(LEVEL_WIDTH - 1, e.x + dirX * 5));
            retreatTargetY = Math.max(0, Math.min(LEVEL_HEIGHT - 1, e.y + dirY * 5));
          }

          const nextStep = getNextStepTowards(e.x, e.y, retreatTargetX, retreatTargetY, prev.map, true, updatedEnemiesList, e.type === EnemyType.Nakki || e.type === EnemyType.IkuTurso);
          if (nextStep && (nextStep.x !== px || nextStep.y !== py)) {
            const isTileBlockedByEnemy = updatedEnemiesList.some(other => other.x === nextStep.x && other.y === nextStep.y) ||
                                         nextEnemies.some((other, idx) => idx > i && other.x === nextStep.x && other.y === nextStep.y);
            const isTileWalkable = prev.map[nextStep.y]?.[nextStep.x] !== TileType.Wall && prev.map[nextStep.y]?.[nextStep.x] !== TileType.Water;
            if (!isTileBlockedByEnemy && isTileWalkable) {
              e.x = nextStep.x;
              e.y = nextStep.y;
            }
          }
          if (Math.random() < 0.10) {
            staticLogs.push(getEnemyFleeQuote(e.name, e.type));
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

      // --- 4. NPC & CAT ROUTINE & SCHEDULE MOVEMENT ---
      if (nextNpcs && nextNpcs.length > 0) {
        const moveDirs = [
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        const currentMinutes = prev.gameTime || 0;
        const currentHour = Math.floor((currentMinutes % 1440) / 60);
        const currentW = prev.weather || 'clear';

        const tavernNpc = nextNpcs.find(n => n.id?.startsWith('npc_tavernmaster_'));

        // Find outdoor Campfire tiles on map for dusk gathering
        let mapCampfire: { x: number; y: number } | null = null;
        if (prev.map) {
          for (let ry = 0; ry < prev.map.length; ry++) {
            for (let rx = 0; rx < prev.map[0].length; rx++) {
              if (prev.map[ry]?.[rx] === TileType.Campfire) {
                mapCampfire = { x: rx, y: ry };
                break;
              }
            }
            if (mapCampfire) break;
          }
        }

        // Build fast spatial lookup sets for enemies and NPCs
        const enemyPosSet = new Set<string>();
        if (nextEnemies && nextEnemies.length > 0) {
          for (let i = 0; i < nextEnemies.length; i++) {
            const e = nextEnemies[i];
            if (e) enemyPosSet.add(`${e.x},${e.y}`);
          }
        }

        const npcPosSet = new Set<string>();
        if (nextNpcs && nextNpcs.length > 0) {
          for (let i = 0; i < nextNpcs.length; i++) {
            const n = nextNpcs[i];
            if (n) npcPosSet.add(`${n.id}:${n.x},${n.y}`);
          }
        }

        nextNpcs = nextNpcs.map((npc) => {
          if (!npc) return npc;
          const isCat = npc.id?.startsWith('npc_cat_') || npc.role === 'special_cat';

          // Cats use playful random wandering
          if (isCat) {
            if (Math.random() < 0.6) {
              const dir = moveDirs[Math.floor(Math.random() * moveDirs.length)];
              const nx = npc.x + dir.dx;
              const ny = npc.y + dir.dy;
              if (nx >= 0 && nx < LEVEL_WIDTH && ny >= 0 && ny < LEVEL_HEIGHT) {
                const tile = prev.map[ny]?.[nx];
                const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
                const isOccupiedByPlayer = nx === px && ny === py;
                const isOccupiedByEnemy = enemyPosSet.has(`${nx},${ny}`);
                if (isWalkable && !isOccupiedByPlayer && !isOccupiedByEnemy) {
                  return { ...npc, x: nx, y: ny };
                }
              }
            }
            return npc;
          }

          // Human Town NPCs follow structured day/night schedule routines
          const origChar = npc.originalChar || npc.char;

          // Short-circuit sleeping NPCs during nighttime hours
          if (npc.isAsleep && (currentHour >= 20 || currentHour < 7) && npc.scheduleState === 'home') {
            return npc;
          }

          const isBlizzard = currentW === 'blizzard' || currentW === 'snowy';

          // Occasional ambient weather or blizzard shelter reaction bark if outdoors near player
          if (!npc.isAsleep) {
            const dist = Math.abs(npc.x - px) + Math.abs(npc.y - py);
            if (dist <= 6) {
              if (isBlizzard && Math.random() < 0.04) {
                staticLogs.push(`🗣️ ${getBlizzardShelterBark(npc)}`);
              } else if ((currentW === 'rainy' || currentW === 'sandstorm' || currentW === 'foggy') && Math.random() < 0.03) {
                const bark = getWeatherAmbientBark(npc, currentW, currentHour >= 20 || currentHour < 7 ? 'night' : 'day');
                staticLogs.push(`🗣️ ${bark}`);
              }
            }
          }

          // Determine schedule state (work, leisure, home, campfire)
          let targetSched: 'home' | 'work' | 'leisure' | 'campfire' = 'work';
          const isDusk = currentHour >= 17 && currentHour < 20;

          if (currentHour >= 20 || currentHour < 7) {
            targetSched = 'home';
          } else if (isBlizzard) {
            // Heavy blizzards force villagers into indoor house or tavern shelter!
            const isTavernVisitor = [
              'villager', 'apothecary', 'companion_hire', 'merchant',
              'dockworker', 'sailor', 'patron', 'townsperson', 'guard', 'fishmonger', 'blacksmith'
            ].includes(npc.role);
            targetSched = isTavernVisitor ? 'leisure' : 'home';
          } else if (isDusk && mapCampfire && currentW !== 'blizzard') {
            // Gather around outdoor campfires at dusk for cozy socialization!
            targetSched = 'campfire';
          } else if (
            currentW === 'rainy' ||
            (currentHour >= 12 && currentHour < 13) ||
            (currentHour >= 16 && currentHour < 20)
          ) {
            const isTavernVisitor = [
              'villager', 'apothecary', 'companion_hire', 'merchant',
              'dockworker', 'sailor', 'patron', 'townsperson', 'guard', 'fishmonger', 'blacksmith'
            ].includes(npc.role);
            targetSched = isTavernVisitor ? 'leisure' : 'home';
          }

          // Resolve target coordinate (tx, ty)
          let tx = npc.workX ?? npc.x;
          let ty = npc.workY ?? npc.y;

          if (targetSched === 'home') {
            tx = npc.homeX ?? npc.x;
            ty = npc.homeY ?? npc.y;
          } else if (targetSched === 'leisure') {
            if (tavernNpc) {
              const offset = Math.abs(((npc.name || '').charCodeAt(0) * 3) % 4) - 2;
              tx = tavernNpc.homeX + offset;
              ty = tavernNpc.homeY + 2;
            } else {
              tx = npc.homeX ?? npc.x;
              ty = npc.homeY ?? npc.y;
            }
          } else if (targetSched === 'campfire' && mapCampfire) {
            const seed = Math.abs((npc.id || npc.name).charCodeAt(0));
            const offsets = [
              { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
              { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
            ];
            const chosen = offsets[seed % offsets.length];
            tx = Math.max(0, Math.min(LEVEL_WIDTH - 1, mapCampfire.x + chosen.dx));
            ty = Math.max(0, Math.min(LEVEL_HEIGHT - 1, mapCampfire.y + chosen.dy));
          }

          // Check if NPC has reached target coordinate
          if (npc.x === tx && npc.y === ty) {
            if (targetSched === 'home' && (currentHour >= 20 || currentHour < 7)) {
              // Resting in building bed
              return {
                ...npc,
                scheduleState: 'home',
                isAsleep: true,
                isSitting: false,
                isDrinking: false,
                originalChar: origChar,
                char: '😴'
              };
            }
            if (targetSched === 'leisure') {
              // Sitting in tavern/bar drinking ale/mead
              const dist = Math.abs(npc.x - px) + Math.abs(npc.y - py);
              if (dist <= 6 && Math.random() < 0.04) {
                staticLogs.push(`🗣️ ${getTavernDrinkingBark(npc)}`);
              }
              return {
                ...npc,
                scheduleState: 'leisure',
                isAsleep: false,
                isSitting: true,
                isDrinking: true,
                originalChar: origChar,
                char: '🍻'
              };
            }
            if (targetSched === 'campfire') {
              // Sitting around outdoor campfire at dusk
              const dist = Math.abs(npc.x - px) + Math.abs(npc.y - py);
              if (dist <= 6 && Math.random() < 0.05) {
                staticLogs.push(`🗣️ ${getCampfireDialogueBark(npc)}`);
              }
              return {
                ...npc,
                scheduleState: 'campfire',
                isAsleep: false,
                isSitting: true,
                isDrinking: false,
                originalChar: origChar,
                char: '🔥'
              };
            }
            if (targetSched === 'home') {
              // Resting sitting at home
              return {
                ...npc,
                scheduleState: 'home',
                isAsleep: false,
                isSitting: true,
                isDrinking: false,
                originalChar: origChar,
                char: '🪑'
              };
            }
            return {
              ...npc,
              scheduleState: targetSched,
              isAsleep: false,
              isSitting: false,
              isDrinking: false,
              char: origChar
            };
          }

          // NPC is traveling along path to building/workstation/bed
          const nextStep = getNextStepTowards(npc.x, npc.y, tx, ty, prev.map, true, []);
          if (nextStep) {
            const posKey = `${nextStep.x},${nextStep.y}`;
            const isBlockedByPlayer = nextStep.x === px && nextStep.y === py;
            const isBlockedByEnemy = enemyPosSet.has(posKey);
            let isBlockedByNpc = false;
            for (let i = 0; i < nextNpcs.length; i++) {
              const other = nextNpcs[i];
              if (other && other.id !== npc.id && other.x === nextStep.x && other.y === nextStep.y) {
                isBlockedByNpc = true;
                break;
              }
            }

            if (!isBlockedByPlayer && !isBlockedByEnemy && !isBlockedByNpc) {
              return {
                ...npc,
                x: nextStep.x,
                y: nextStep.y,
                scheduleState: targetSched,
                isAsleep: false,
                originalChar: origChar,
                char: origChar
              };
            }
          }

          return {
            ...npc,
            scheduleState: targetSched,
            isAsleep: false,
            originalChar: origChar,
            char: origChar
          };
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
