import {
  GameState,
  Enemy,
  EnemyState,
  EnemyType,
  TileType,
  PlayerEffect
} from '../../types';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../utils/gameUtils';
import { getEnemyTemplate } from '../../utils/dungeon';
import { tickActiveGMStoryteller } from '../../utils/gmStoryteller';
import { getGMPointOfInterestNudge } from '../../utils/gmNarrator';
import { getCompanionAdvice } from '../../utils/companionAdvice';
import { BIOME_VALID_WEATHERS, getValidWeatherForBiome } from '../../utils/weatherEngine';
import { isPlayerInvincible } from '../../utils/invincibility';
import { TurnEnvironmentResult, FoodBuff } from './types';

function safeDispatchEffect(detail: any) {
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    const ev = new CustomEvent('spawn-game-effect', { detail });
    window.dispatchEvent(ev);
  }
}

export function resolvePlayerStatusAndEnvironment(
  prev: GameState,
  px: number,
  py: number,
  hasEquippedTrait: (gs: GameState, traitKey: string) => boolean
): TurnEnvironmentResult {
  let nextEnemies = [...prev.enemies];
  let playerHp = prev.playerStats.hp;
  let playerMp = prev.playerStats.mp;
  const staticLogs: string[] = [];
  const updatedStats = { ...prev.playerStats, turnsPlayed: prev.playerStats.turnsPlayed + 1 };

  // Process Player Status Effects (Active Effects)
  const nextActiveEffects = prev.playerStats.activeEffects ? [...prev.playerStats.activeEffects] : [];
  const updatedEffects: PlayerEffect[] = [];

  for (const eff of nextActiveEffects) {
    const turnsLeft = eff.turnsRemaining - 1;

    // Ticking effect values
    if (eff.damagePerTurn) {
      let tickDmg = eff.damagePerTurn;
      if (isPlayerInvincible(prev, prev.playerStats)) {
        tickDmg = 0;
      } else {
        if (prev.factionTerritories?.['swamp_of_whispers']?.controller === prev.faction) {
          tickDmg = Math.max(1, tickDmg - 3);
        }
        playerHp = Math.max(0, playerHp - tickDmg);
        staticLogs.push(`🤢 You suffer -${tickDmg} toxic damage from ${eff.name}.`);
        safeDispatchEffect({ x: px, y: py, text: `-${tickDmg} Poison`, type: 'dmg' });
      }
    }
    if (eff.healPerTurn) {
      if (playerHp < updatedStats.maxHp) {
        const actualHeal = Math.min(eff.healPerTurn, updatedStats.maxHp - playerHp);
        playerHp = Math.min(updatedStats.maxHp, playerHp + eff.healPerTurn);
        if (eff.healPerTurn >= 5 || updatedStats.turnsPlayed % 5 === 0 || turnsLeft === 1) {
          staticLogs.push(`✨ You heal +${actualHeal} HP from ${eff.name}.`);
          safeDispatchEffect({ x: px, y: py, text: `+${actualHeal} HP`, type: 'heal' });
        }
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

  let nextFoodBuff: FoodBuff | undefined = prev.activeFoodBuff;
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
  const activeScars = updatedStats.scars ? [...updatedStats.scars] : [];

  // Crimson Heart Relic regeneration check (batched to 20 HP per 10 turns)
  if (updatedStats.relics?.includes('crimson_heart') && playerHp > 0 && playerHp < updatedStats.maxHp) {
    if (updatedStats.turnsPlayed % 10 === 0) {
      const healAmt = Math.min(20, updatedStats.maxHp - playerHp);
      playerHp = Math.min(updatedStats.maxHp, playerHp + 20);
      staticLogs.push(`❤️ [CRIMSON HEART]: A concentrated surge of blood magic pulses from your Sanctum Relic, restoring +${healAmt} HP!`);
      safeDispatchEffect({ x: px, y: py, text: `+${healAmt} HP`, type: 'heal' });
    }
  }

  // Passive Mana (MP) Meditation & Mental Recovery (1 MP every 8 turns, scaled faster with Intelligence)
  const intStat = updatedStats.int || 10;
  const mpRegenInterval = Math.max(4, 10 - Math.floor((intStat - 10) / 4));
  if (playerMp < updatedStats.maxMp && updatedStats.turnsPlayed % mpRegenInterval === 0) {
    playerMp = Math.min(updatedStats.maxMp, playerMp + 1);
    if (updatedStats.turnsPlayed % (mpRegenInterval * 4) === 0) {
      safeDispatchEffect({ x: px, y: py, text: `+1 MP 💧`, type: 'heal' });
    }
  }

  const currentRep = prev.townReputation !== undefined ? prev.townReputation : 100;
  let nextRep = currentRep;
  if (currentRep < 100) {
    nextRep = Math.min(100, currentRep + 0.35);
  }
  let nextGuardsHostile = prev.areGuardsHostile !== undefined ? prev.areGuardsHostile : false;
  if (nextGuardsHostile && nextRep >= 100) {
    nextGuardsHostile = false;
    staticLogs.push(`⚖️ [TOWN NOTICE]: Your crimes have been pardoned over time. The town guards are no longer hostile.`);
  }

  // Instant Death Aura - Sandbox Tweak
  if (typeof window !== 'undefined' && (window as any).arenaDeathAuraActive) {
    nextEnemies = nextEnemies.filter((e) => {
      const dist = Math.abs(e.x - px) + Math.abs(e.y - py);
      if (dist <= 2 && !e.isFollower && !e.isTownGuard) {
        staticLogs.push(`⚡ DEATH AURA: ${e.name} was smitten dead instantly!`);
        safeDispatchEffect({ x: e.x, y: e.y, text: "Smite!", type: 'dmg' });
        return false;
      }
      return true;
    });
  }

  const nextCorpses = prev.corpses ? [...prev.corpses] : [];
  const nextSplatters = (prev.bloodSplatters || [])
    .map((spl) => {
      if (Math.random() < 0.04) {
        return { ...spl, intensity: spl.intensity - 1 };
      }
      return spl;
    })
    .filter((spl) => spl.intensity > 0);

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
  const nextTimeVal = (prev.gameTime + timeCost) % 1440;

  const lastRestock = prev.lastRestockTime !== undefined ? prev.lastRestockTime : 480;
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
    if (gmRes.didIntervene) {
      if (gmRes.logMessages && gmRes.logMessages.length > 0) {
        gmRes.logMessages.forEach(msg => staticLogs.push(msg.text));
      } else if (gmRes.logMessage) {
        staticLogs.push(gmRes.logMessage.text);
      }
    }
    if (gmRes.stateUpdates) {
      gmStateUpdates = gmRes.stateUpdates;
    }
    if (gmRes.effectSpawn) {
      safeDispatchEffect(gmRes.effectSpawn);
    }
  }

  let nextWeather = prev.weather;
  const currentBiome = prev.biome || 'forest';
  if (prev.isOverworld && (prev.gmAutonomousWeather ?? true) && updatedStats.turnsPlayed > 0 && updatedStats.turnsPlayed % (prev.gmWeatherInterval || 120) === 0) {
    const allowedWeathers = BIOME_VALID_WEATHERS[currentBiome] || BIOME_VALID_WEATHERS.forest;
    const candidates = allowedWeathers.filter(w => w !== prev.weather);
    const randomWeather = candidates.length > 0 
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : allowedWeathers[0];
    nextWeather = randomWeather;
    
    const wLabel = nextWeather === 'clear' ? '☀️ Clear Skies'
                 : nextWeather === 'rainy' ? '🌧️ Pouring Rain & Storms'
                 : nextWeather === 'foggy' ? '🌫️ Dense Fog'
                 : nextWeather === 'snowy' ? '❄️ Gentle Snow'
                 : nextWeather === 'sandstorm' ? '🌪️ Swirling Sandstorm'
                 : '🌨️ Frostbite Blizzard';
                 
    const ritualNames: Record<string, string> = {
      clear: '☀️ Divine Solar Cleansing Ritual',
      rainy: '🌧️ Cosmic Torrent Storm Calling',
      foggy: '🌫️ Ethereal Shadow-Weave Fog Chant',
      snowy: '❄️ Celestial Gentle Frostfall',
      sandstorm: '🌪️ Arid Great Dune Sandstorm',
      blizzard: '🌨️ Glacial Eternal Blizzard Channelling'
    };
    const rName = ritualNames[nextWeather] || 'Divine Weather Alteration';

    staticLogs.push(`🌌 SOVEREIGN GM RITUAL: The autonomous Game Master has invoked "${rName}"! The regional ${currentBiome.toUpperCase()} climate transitioned to ${wLabel}.`);
  } else if (prev.isOverworld && !prev.gmAutonomousWeather && updatedStats.turnsPlayed % (prev.gmWeatherInterval || 120) === 0) {
    const roll = Math.random();
    if (currentBiome === 'desert') {
      nextWeather = roll > 0.70 ? 'sandstorm' : (roll > 0.50 ? 'foggy' : 'clear');
    } else if (currentBiome === 'tundra') {
      nextWeather = roll > 0.75 ? 'blizzard' : (roll > 0.40 ? 'snowy' : 'clear');
    } else if (currentBiome === 'swamp') {
      nextWeather = roll > 0.60 ? 'rainy' : (roll > 0.40 ? 'foggy' : 'clear');
    } else if (currentBiome === 'town') {
      nextWeather = roll > 0.70 ? 'rainy' : (roll > 0.45 ? 'foggy' : 'clear');
    } else {
      nextWeather = roll > 0.70 ? 'rainy' : (roll > 0.50 ? 'foggy' : 'clear');
    }
    nextWeather = getValidWeatherForBiome(currentBiome, nextWeather);

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

    safeDispatchEffect({ x: px, y: py, text: `${nextSeason.toUpperCase()} TIME!`, type: 'heal' });
  }

  if (prev.isOverworld && nextSeason === 'summer') {
    if (updatedStats.turnsPlayed % 15 === 0) {
      playerMp = Math.max(0, playerMp - 1);
      staticLogs.push(`☀️ [SUMMER HEAT]: The blazing sun saps your concentration! You lose 1 Focus (MP) to dehydration.`);
      safeDispatchEffect({ x: px, y: py, text: `-1 MP (Heat) ☀️`, type: 'dmg' });
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

  // Roaming Monster Procedural Spawn Logic
  const pLevel = updatedStats.level || 1;
  const weaponVal = prev.currentWeapon ? Math.max(0, prev.currentWeapon.damage) : 0;
  const armorVal = (prev.equippedArmor?.defense || 0) + 
                   (prev.equippedHelmet?.defense || 0) + 
                   (prev.equippedGloves?.defense || 0) + 
                   (prev.equippedBoots?.defense || 0) + 
                   (prev.equippedShield?.defense || 0);

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
        if (prev.playerStats.depth && prev.playerStats.depth >= 6 || updatedStats.turnsPlayed > 400) {
          if (innerRoll > 0.90) spawnedType = EnemyType.Louhi;
          else if (innerRoll > 0.80) spawnedType = EnemyType.IkuTurso;
          else if (innerRoll > 0.70) spawnedType = EnemyType.Otso;
          else if (innerRoll > 0.50) spawnedType = EnemyType.Dragon;
          else if (innerRoll > 0.35) spawnedType = EnemyType.Kalma;
          else spawnedType = EnemyType.DreadKnight;
        } else if (prev.playerStats.depth && prev.playerStats.depth > 3) {
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

      const enemyHpMultiplier = typeof window !== 'undefined' ? ((window as any).arenaEnemyHpMultiplier || 1.0) : 1.0;
      const enemyDmgMultiplier = typeof window !== 'undefined' ? ((window as any).arenaEnemyDamageMultiplier || 1.0) : 1.0;

      const newRoamingEnemy: Enemy = {
        id: `gm_spawned_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
        x: spawnedCoordinate.x,
        y: spawnedCoordinate.y,
        type: spawnedType,
        name: isBoss ? `👑 Roaming ${enemyTemplate.name}` : `Roaming ${enemyTemplate.name}`,
        hp: Math.round(enemyTemplate.baseHp * playerScaleCoeff * hpMult * enemyHpMultiplier),
        maxHp: Math.round(enemyTemplate.baseHp * playerScaleCoeff * hpMult * enemyHpMultiplier),
        atk: Math.round(enemyTemplate.baseAtk * atkScaleCoeff * atkMult * enemyDmgMultiplier),
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

  return {
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
  };
}
