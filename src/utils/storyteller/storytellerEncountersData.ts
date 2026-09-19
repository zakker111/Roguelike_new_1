import { GameState, Enemy, EnemyState, EnemyType, TileType, EquipmentItem, CatalystType, Follower, TrapType, Trap } from "../../types";
import { BIOME_VALID_WEATHERS, getValidWeatherForBiome } from "../weatherEngine";
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from "../itemsData";
import { findWalkableSpotNearPlayer, getDirectionString } from "./gmCoordinateUtils";
import { createGMTriangleCheaterEnemy } from "../combatArchetypes";
import { playSound } from "../audio";
import { GMEncounter } from "./types";
import { getEncounterFlavorText } from "./storytellerFlavor";

export const GM_ENCOUNTERS_DATABASE: GMEncounter[] = [
  {
    id: 'healing_breeze',
    name: 'Seraphic Healing Breeze',
    description: 'Ancient spirits sense critical player exhaustion and weave a protective rejuvenation aura.',
    requiredMood: ['Benevolent', 'Intrigued'],
    minBoredom: 20,
    maxTension: 100,
    minTension: 60, // Only trigger if player is in tight situation
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      const hpPercent = gameState.playerStats.hp / gameState.playerStats.maxHp;
      if (hpPercent > 0.45) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      const healAmt = Math.round(gameState.playerStats.maxHp * 0.4);
      const nextHp = Math.min(gameState.playerStats.maxHp, gameState.playerStats.hp + healAmt);

      const updatedStats = {
        ...gameState.playerStats,
        hp: nextHp,
        mp: Math.min(gameState.playerStats.maxMp, gameState.playerStats.mp + 10)
      };

      return {
        success: true,
        mutatedState: { playerStats: updatedStats },
        logText: getEncounterFlavorText(
          'healing_breeze',
          `✨ [SERAPHIC RESPITE]: A warm breeze carrying the scent of pine and heather revitalizes your failing strength—the spirits of the ancient grove grant you respite (+${healAmt} HP, +10 MP)!`,
          { healAmt }
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `+${healAmt} Grove Respite!`, type: 'heal' }
      };
    }
  },
  {
    id: 'ancestral_pity_shield',
    name: 'Ancestral Grove Emergency Ward',
    description: 'Spirits of the ancient grove unleash a pine-scented shockwave that heals the player and repels adjacent hostiles when near death.',
    requiredMood: ['Benevolent', 'Intrigued', 'Apathetic'],
    minBoredom: 10,
    maxTension: 100,
    minTension: 60,
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      const hpPercent = gameState.playerStats.hp / gameState.playerStats.maxHp;
      if (hpPercent > 0.45) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      const healAmt = Math.round(gameState.playerStats.maxHp * 0.35);
      const nextHp = Math.min(gameState.playerStats.maxHp, gameState.playerStats.hp + healAmt);

      const updatedStats = {
        ...gameState.playerStats,
        hp: nextHp,
        mp: Math.min(gameState.playerStats.maxMp, gameState.playerStats.mp + 15)
      };

      // Displace / repel adjacent enemies (dist <= 2.2)
      const px = gameState.playerX;
      const py = gameState.playerY;
      let mutatedEnemies = gameState.enemies;

      if (gameState.enemies && gameState.enemies.length > 0) {
        mutatedEnemies = gameState.enemies.map(enemy => {
          const dist = Math.hypot(enemy.x - px, enemy.y - py);
          if (dist <= 2.2 && !enemy.isFollower && !enemy.isTownGuard && !enemy.isAnimal) {
            const dx = enemy.x - px;
            const dy = enemy.y - py;
            const stepX = dx !== 0 ? Math.sign(dx) : (Math.random() < 0.5 ? 1 : -1);
            const stepY = dy !== 0 ? Math.sign(dy) : (Math.random() < 0.5 ? 1 : -1);
            const targetX = enemy.x + stepX;
            const targetY = enemy.y + stepY;

            let canPush = true;
            if (gameState.map && gameState.map[targetY] && gameState.map[targetY][targetX]) {
              const tile = gameState.map[targetY][targetX] as any;
              if (tile) {
                const tType = typeof tile === 'object' ? tile.type : tile;
                if (tType === 'wall' || tType === 'water' || tType === 'void') {
                  canPush = false;
                }
              }
            }
            if (canPush) {
              return {
                ...enemy,
                x: targetX,
                y: targetY,
                state: EnemyState.Patrolling
              };
            }
          }
          return enemy;
        });
      }

      return {
        success: true,
        mutatedState: {
          playerStats: updatedStats,
          enemies: mutatedEnemies
        },
        logText: getEncounterFlavorText(
          'ancestral_pity_shield',
          `🌿 [ANCESTRAL GROVE RESCUE]: A warm breeze carrying the scent of pine and heather revitalizes your failing strength—the spirits of the ancient grove grant you respite! A burst of emerald light knits your wounds (+${healAmt} HP) and repels surrounding hostiles!`,
          { healAmt }
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `🌿 +${healAmt} Pine Grove Respite!`, type: 'heal' }
      };
    }
  },
  {
    id: 'void_ambush',
    name: 'Sovereign Rift Ambush',
    description: 'A subterranean planar tear ruptures space, unleashing an elite Void-Torn brute to hunt.',
    requiredMood: ['Mischievous', 'Sadistic', 'Intrigued'],
    minBoredom: 50,
    maxTension: 60, // Do not trigger if already overwhelmed
    trigger: (gameState, gmState) => {
      // Find empty spot out of player vicinity
      const spot = findWalkableSpotNearPlayer(gameState, 5, 11);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };

      const sx = spot.x;
      const sy = spot.y;

      // Make a scary Goblin Void-Raider elite monster
      const newEnemy: Enemy = {
        id: `gm_rift_goblin_${Date.now()}`,
        x: sx,
        y: sy,
        type: EnemyType.Goblin,
        name: 'Void-Torn Goblin Gladiator',
        hp: Math.round(35 * (1 + gameState.playerStats.level * 0.15)),
        maxHp: Math.round(35 * (1 + gameState.playerStats.level * 0.15)),
        atk: Math.round(6 + gameState.playerStats.level * 0.8),
        def: 3,
        range: 1,
        speed: 1,
        color: '#a855f7', // pulsing purple color
        char: 'G',
        state: EnemyState.Chasing,
        isElite: true,
        eliteEffect: 'Void Aegis (+3 Defense)',
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      };

      const updatedEnemies = [...gameState.enemies, newEnemy];
      const direction = getDirectionString(gameState.playerX, gameState.playerY, sx, sy);

      return {
        success: true,
        mutatedState: { enemies: updatedEnemies },
        logText: getEncounterFlavorText(
          'void_ambush',
          `⚠️ [VOID RIFT INCURSION]: Prolonged stagnation and dimensional friction crack the fragile fabric of space! An unstable purple rift tears open to the [${direction.toUpperCase()}], allowing a ravenous ${newEnemy.name} to burst into the mortal plane to hunt!`,
          { direction: direction.toUpperCase(), enemyName: newEnemy.name }
        ),
        effectSpawn: { x: sx, y: sy, text: `Void Rift Tear! [${direction}]`, type: 'dmg' }
      };
    }
  },
  {
    id: 'alchemy_gift',
    name: 'Alchemical Drop',
    description: 'A playful etheric wisp manifest carrying shimmering alchemical catalysts.',
    requiredMood: ['Benevolent', 'Intrigued', 'Apathetic'],
    minBoredom: 35,
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      // Find walkable spot near player
      const spot = findWalkableSpotNearPlayer(gameState, 2, 5);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };

      const rx = spot.x;
      const ry = spot.y;

      const alchemicalSprite: Enemy = {
        id: `gm_alchemical_sprite_${Date.now()}`,
        x: rx,
        y: ry,
        type: EnemyType.LootGoblin,
        name: 'Volatile Alchemical Sprite',
        hp: Math.round(20 * (1 + gameState.playerStats.level * 0.1)),
        maxHp: Math.round(20 * (1 + gameState.playerStats.level * 0.1)),
        atk: 0,
        def: 2,
        range: 1,
        speed: 1,
        color: '#e879f9', // vibrant pink/cyan
        char: '✧',
        state: EnemyState.Patrolling,
        isElite: true,
        eliteEffect: 'Prismatic Agility (Fast & High Evasion)',
        patrolPath: [],
        patrolIndex: 0,
        debuffs: [],
      };

      const updatedEnemies = [...gameState.enemies, alchemicalSprite];
      const direction = getDirectionString(gameState.playerX, gameState.playerY, rx, ry);

      return {
        success: true,
        mutatedState: { enemies: updatedEnemies },
        logText: getEncounterFlavorText(
          'alchemy_gift',
          `✨ [ALCHEMICAL VAPOR CONDENSATION]: Residual volatile catalyst vapors pooling in the damp cavern air suddenly condense into a playful Volatile Alchemical Sprite to the [${direction.toUpperCase()}], darting merrily with pockets brimming with rare reagents!`,
          { direction: direction.toUpperCase() }
        ),
        effectSpawn: { x: rx, y: ry, text: `✧ Sprite Spawned! [${direction}]`, type: 'loot' }
      };
    }
  },
  {
    id: 'smite_nearest',
    name: 'Lightning Bolt Smite',
    description: 'A divine blast of sky-fire strikes down to purge a nearby hostile monster.',
    requiredMood: ['Mischievous', 'Benevolent', 'Intrigued'],
    minBoredom: 40,
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      const hostileEnemies = gameState.enemies.filter(
        e => e.hp > 0 && !e.isFollower && !e.isTownGuard && !e.isAnimal
      );

      if (hostileEnemies.length === 0) return { success: false, mutatedState: {}, logText: "" };

      // Target closest hostile
      hostileEnemies.sort((a,b) => {
        const distA = Math.abs(a.x - gameState.playerX) + Math.abs(a.y - gameState.playerY);
        const distB = Math.abs(b.x - gameState.playerX) + Math.abs(b.y - gameState.playerY);
        return distA - distB;
      });

      const target = hostileEnemies[0];
      const targetIdx = gameState.enemies.findIndex(e => e.id === target.id);
      if (targetIdx === -1) return { success: false, mutatedState: {}, logText: "" };

      const smiteDmg = 25;
      const nextHp = Math.max(0, target.hp - smiteDmg);
      
      const updatedEnemies = [...gameState.enemies];
      if (nextHp === 0) {
        updatedEnemies.splice(targetIdx, 1);
      } else {
        updatedEnemies[targetIdx] = { ...target, hp: nextHp };
      }

      const direction = getDirectionString(gameState.playerX, gameState.playerY, target.x, target.y);

      return {
        success: true,
        mutatedState: { enemies: updatedEnemies },
        logText: getEncounterFlavorText(
          'smite_nearest',
          `⚡ [UKKO'S CELESTIAL WRATH]: From the highest sky-vault, Ukko Ylijumala detects the foul stench of ${target.name} and unleashes an explosive spear of celestial lightning to the [${direction.toUpperCase()}], striking for ${smiteDmg} holy sky-fire damage!`,
          { enemyName: target.name, direction: direction.toUpperCase(), dmg: smiteDmg }
        ),
        effectSpawn: { x: target.x, y: target.y, text: `-${smiteDmg} Smite! [${direction}]`, type: 'dmg' }
      };
    }
  },
  {
    id: 'trap_shower',
    name: 'Acoustic Hazard Alarm',
    description: 'Ancient dungeon pressure mechanisms click and prime mechanical spike traps.',
    requiredMood: ['Mischievous', 'Sadistic'],
    minBoredom: 60,
    maxTension: 50,
    trigger: (gameState, gmState) => {
      // Find empty spot out of player vicinity
      const px = gameState.playerX;
      const py = gameState.playerY;
      const spot = findWalkableSpotNearPlayer(gameState, 4, 8);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };
      const tx = spot.x;
      const ty = spot.y;

      // Add a spike trap
      const newTrap = {
        id: `gm_spike_${Date.now()}`,
        x: tx,
        y: ty,
        type: 'Spikes' as any,
        isActive: true,
        triggered: false
      };

      const updatedTraps = [...gameState.traps, newTrap];
      const direction = getDirectionString(px, py, tx, ty);
      return {
        success: true,
        mutatedState: { traps: updatedTraps },
        logText: getEncounterFlavorText(
          'trap_shower',
          `⚠️ [ANCIENT DUNGEON MECHANISM]: Tectonic weight shifts trigger ancient subterranean clockwork counterweights! A resounding iron click echoes through the floor as concealed spike pins arm themselves to the [${direction.toUpperCase()}]!`,
          { direction: direction.toUpperCase() }
        ),
        effectSpawn: { x: tx, y: ty, text: `Trap Grafted! [${direction}]`, type: 'dmg' }
      };
    }
  },
  {
    id: 'weather_mutation',
    name: 'Meteorological Climax',
    description: 'GM rapidly forces an overworld environmental phase transition to high elemental tension.',
    requiredMood: ['Mischievous', 'Intrigued', 'Apathetic'],
    minBoredom: 10,
    trigger: (gameState, gmState) => {
      if (!gameState.isOverworld) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      const allowedWeathers = BIOME_VALID_WEATHERS[gameState.biome || 'forest'] || BIOME_VALID_WEATHERS.forest;
      const filteredWeathers = allowedWeathers.filter(w => w !== gameState.weather);
      const chosenWeather = filteredWeathers.length > 0
        ? filteredWeathers[Math.floor(Math.random() * filteredWeathers.length)]
        : allowedWeathers[0];

      if (typeof window !== 'undefined') {
        try { playSound('mutate', { volume: 0.6 }); } catch (e) { /* silent fallback */ }
      }

      return {
        success: true,
        mutatedState: { weather: chosenWeather },
        logText: getEncounterFlavorText(
          'weather_mutation',
          `☁️ [CELESTIAL WIND GATE SHIFT]: Cosmic planetary air currents and atmospheric pressure gates shift over the realm, altering the overworld weather to [${chosenWeather.toUpperCase()}]!`,
          { weather: chosenWeather.toUpperCase() }
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `🌤️ Weather: ${chosenWeather}!`, type: 'heal' }
      };
    }
  },
  {
    id: 'gm_harsh_tempest',
    name: 'GM Tempest Escalation',
    description: 'Sadistic or Mischievous GM summons severe storm conditions (Blizzard, Sandstorm, or Pouring Rain) to test player survival skills.',
    requiredMood: ['Sadistic', 'Mischievous'],
    minBoredom: 25,
    minTension: 20,
    trigger: (gameState, gmState) => {
      if (!gameState.isOverworld) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      const biome = gameState.biome || 'forest';
      let harshWeather: 'blizzard' | 'sandstorm' | 'rainy' = 'rainy';
      if (biome === 'tundra') harshWeather = 'blizzard';
      else if (biome === 'desert') harshWeather = 'sandstorm';
      else harshWeather = 'rainy';

      if (gameState.weather === harshWeather) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      if (typeof window !== 'undefined') {
        try { playSound('spell', { volume: 0.7 }); } catch (e) { /* silent fallback */ }
      }

      const weatherIcons = { blizzard: '❄️', sandstorm: '🌪️', rainy: '⛈️' };
      const icon = weatherIcons[harshWeather] || '⛈️';

      return {
        success: true,
        mutatedState: { weather: harshWeather },
        logText: getEncounterFlavorText(
          'gm_harsh_tempest',
          `${icon} [TEMPEST OF POHJOLA]: The icy malice of the Northern Wastes brews into a violent squall! Howling gale winds roar across the plains as the weather rapidly turns into [${harshWeather.toUpperCase()}], testing your survival fortitude!`,
          { icon, weather: harshWeather.toUpperCase() }
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `${icon} Tempest: ${harshWeather}!`, type: 'dmg' }
      };
    }
  },
  {
    id: 'gm_benevolent_clear_skies',
    name: 'GM Seraphic Cleansing Sky',
    description: 'Benevolent GM dispels harsh weather conditions to Clear Skies or protective Fog when the player is exhausted or low HP.',
    requiredMood: ['Benevolent', 'Intrigued'],
    minBoredom: 15,
    trigger: (gameState, gmState) => {
      if (!gameState.isOverworld) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      const hpPercent = gameState.playerStats.hp / gameState.playerStats.maxHp;
      if (hpPercent > 0.50 && gameState.weather === 'clear') {
        return { success: false, mutatedState: {}, logText: "" };
      }

      const calmWeather = hpPercent < 0.35 ? 'clear' : 'foggy';
      if (gameState.weather === calmWeather) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      if (typeof window !== 'undefined') {
        try { playSound('levelUp', { volume: 0.4 }); } catch (e) { /* silent fallback */ }
      }

      return {
        success: true,
        mutatedState: { weather: calmWeather },
        logText: getEncounterFlavorText(
          'gm_benevolent_clear_skies',
          `☀️ [PÄIVÄTÄR'S GOLDEN DAWN]: Sensing your weary, wounded footsteps, Päivätär parts the dark tempest clouds with warm solar rays, granting you protective [${calmWeather.toUpperCase()}]!`,
          { weather: calmWeather.toUpperCase() }
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `☀️ Skies Cleared!`, type: 'heal' }
      };
    }
  },
  {
    id: 'gm_caravan_traveler_injection',
    name: 'GM Merchant Caravan Manifestation',
    description: 'Benevolent or Intrigued GM manifests a traveling merchant caravan or guard wagon in overworld wilderness chunks to offer emergency supplies.',
    requiredMood: ['Benevolent', 'Intrigued', 'Apathetic'],
    minBoredom: 20,
    trigger: (gameState, gmState) => {
      if (!gameState.isOverworld) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      if (gameState.caravanTravel?.active) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      const spot = findWalkableSpotNearPlayer(gameState, 4, 8);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };

      const px = gameState.playerX;
      const py = gameState.playerY;
      const direction = getDirectionString(px, py, spot.x, spot.y);

      // Create a merchant caravan wagon actor
      const wagonActor: Enemy = {
        id: `gm_wagon_${Date.now()}`,
        x: spot.x,
        y: spot.y,
        type: 'Merchant Caravan',
        name: "Travelling Merchant Wagon",
        hp: 120,
        maxHp: 120,
        atk: 0,
        def: 8,
        isElite: true,
        range: 1,
        speed: 0,
        color: '#f59e0b',
        char: '🛒',
        state: EnemyState.Patrolling,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      };

      if (typeof window !== 'undefined') {
        try { playSound('loot', { volume: 0.6 }); } catch (e) { /* silent fallback */ }
      }

      return {
        success: true,
        mutatedState: {
          enemies: [...gameState.enemies, wagonActor]
        },
        logText: getEncounterFlavorText(
          'gm_caravan_traveler_injection',
          `🛒 [WAYWARD MERCHANT REFUGEE]: Forced off the king's highway by roving monsters, a sturdy Travelling Merchant Wagon diverts onto your trail to the [${direction.toUpperCase()}], seeking safety in numbers and offering emergency provisions!`,
          { direction: direction.toUpperCase() }
        ),
        effectSpawn: { x: spot.x, y: spot.y, text: `🛒 Merchant Wagon [${direction}]`, type: 'heal' }
      };
    }
  },
  {
    id: 'gm_road_blockade_skirmish',
    name: 'GM Outlaw Road Blockade',
    description: 'Sadistic or Mischievous GM sets up an unexpected highwayman road blockade and bandit ambush on overworld trade routes.',
    requiredMood: ['Sadistic', 'Mischievous'],
    minBoredom: 35,
    minTension: 20,
    trigger: (gameState, gmState) => {
      if (!gameState.isOverworld) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      const spot = findWalkableSpotNearPlayer(gameState, 3, 6);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };

      const px = gameState.playerX;
      const py = gameState.playerY;
      const direction = getDirectionString(px, py, spot.x, spot.y);

      // Create highway baron blockade chief
      const blockadeBaron: Enemy = {
        id: `gm_blockade_chief_${Date.now()}`,
        x: spot.x,
        y: spot.y,
        type: 'Highway Baron',
        name: "Corrupted Road Baron",
        hp: 140,
        maxHp: 140,
        atk: 18,
        def: 10,
        isElite: true,
        isBoss: true,
        affixes: ['shieldbreaker', 'vampiric'],
        range: 1,
        speed: 1,
        color: '#dc2626',
        char: '🥷',
        state: EnemyState.Chasing,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      };

      if (typeof window !== 'undefined') {
        try { playSound('trap', { volume: 0.8 }); } catch (e) { /* silent fallback */ }
      }

      return {
        success: true,
        mutatedState: {
          enemies: [...gameState.enemies, blockadeBaron],
          chaosScore: (gameState.chaosScore || 20) + 15
        },
        logText: getEncounterFlavorText(
          'gm_road_blockade_skirmish',
          `🚧 [OUTLAW TOLL AMBUSH]: Corrupted highway outlaws, alerted to a well-equipped traveler on these desolate roads, erect a heavy spiked timber blockade to the [${direction.toUpperCase()}], stepping forward with drawn steel to demand tribute!`,
          { direction: direction.toUpperCase() }
        ),
        effectSpawn: { x: spot.x, y: spot.y, text: `🚧 BLOCKADE AMBUSH!`, type: 'dmg' }
      };
    }
  },
  {
    id: 'gm_triangle_cheater',
    name: 'GM Triangle Anomaly Surge',
    description: 'The GM Storyteller intentionally cheats Golden Triangle balance, corrupting a nearby enemy into an omnipotent Anomaly.',
    requiredMood: ['Mischievous', 'Sadistic', 'Intrigued'],
    minBoredom: 35,
    trigger: (gameState, gmState) => {
      const hostileEnemies = gameState.enemies.filter(
        e => e.hp > 0 && !e.isFollower && !e.isTownGuard && !e.isAnimal && !e.isAnomaly
      );

      if (hostileEnemies.length === 0) return { success: false, mutatedState: {}, logText: "" };

      // Select enemy closest to player
      hostileEnemies.sort((a,b) => {
        const distA = Math.abs(a.x - gameState.playerX) + Math.abs(a.y - gameState.playerY);
        const distB = Math.abs(b.x - gameState.playerX) + Math.abs(b.y - gameState.playerY);
        return distA - distB;
      });

      const target = hostileEnemies[0];
      const targetIdx = gameState.enemies.findIndex(e => e.id === target.id);
      if (targetIdx === -1) return { success: false, mutatedState: {}, logText: "" };

      const corruptedEnemy = createGMTriangleCheaterEnemy(target, 'Abyssal Chaos Mutant');
      const updatedEnemies = [...gameState.enemies];
      updatedEnemies[targetIdx] = corruptedEnemy;

      const direction = getDirectionString(gameState.playerX, gameState.playerY, target.x, target.y);

      return {
        success: true,
        mutatedState: { enemies: updatedEnemies },
        logText: getEncounterFlavorText(
          'gm_triangle_cheater',
          `⚡ [CHAOTIC LEYLINE WARP]: An unstable primordial mana surge ruptures the Golden Triangle equilibrium! The chaotic backlash infuses ${target.name} to the [${direction.toUpperCase()}], corrupting it into an Anomaly Mutation that defies mortal combat limits!`,
          { enemyName: target.name, direction: direction.toUpperCase() }
        ),
        effectSpawn: { x: target.x, y: target.y, text: `⚡ TRIANGLE CHEATER! [${direction}]`, type: 'dmg' }
      };
    }
  },
  {
    id: 'arcane_torrent',
    name: 'Arcane Gale Torrent',
    description: 'Ancient leyline fissures crack open to recharge depleted mana reservoirs with pure ether.',
    requiredMood: ['Benevolent', 'Intrigued', 'Apathetic'],
    minBoredom: 10,
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      const mpRatio = gameState.playerStats.mp / gameState.playerStats.maxMp;
      if (mpRatio > 0.35) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      const restoreAmt = Math.round(gameState.playerStats.maxMp * 0.5);
      const nextMp = Math.min(gameState.playerStats.maxMp, gameState.playerStats.mp + restoreAmt);

      const catalysts = { ...gameState.inventoryCatalysts };
      const randomCat = ['cat_fire', 'cat_frost', 'cat_lightning'][Math.floor(Math.random() * 3)];
      catalysts[randomCat] = (catalysts[randomCat] || 0) + 1;

      return {
        success: true,
        mutatedState: {
          playerStats: {
            ...gameState.playerStats,
            mp: nextMp
          },
          inventoryCatalysts: catalysts
        },
        logText: getEncounterFlavorText(
          'arcane_torrent',
          `🔮 [ETHERIC RESERVOIR]: The cavern floor cracks to reveal a dormant crystalline mana geode! As etheric vapor washes over you, your drained mana reservoir absorbs +${restoreAmt} Focus (MP) alongside a radiant catalyst!`,
          { restoreAmt }
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `+${restoreAmt} Mana Infused!`, type: 'heal' }
      };
    }
  },
  {
    id: 'guardian_summon',
    name: 'Sovereign Light-Guardian',
    description: 'A consecrated celestial templar spirit manifests from the astral plane to guard you.',
    requiredMood: ['Benevolent'],
    minBoredom: 55,
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      if (gameState.followers.length >= 3) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      const px = gameState.playerX;
      const py = gameState.playerY;
      const spot = findWalkableSpotNearPlayer(gameState, 5, 11);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };
      
      const sx = spot.x;
      const sy = spot.y;

      const folId = `fol_guardian_gm_${Date.now()}`;
      const newFollowerMeta: Follower = {
        id: folId,
        name: "Ethereal Light-Guardian",
        archetypeId: 'guard',
        role: 'follower',
        char: '🛡',
        color: '#fbbf24',
        hp: 55,
        maxHp: 55,
        atk: 9,
        def: 4,
        level: gameState.playerStats.level,
        xp: 0,
        xpNext: 100,
        mode: 'follow',
        equipment: { weapon: null, armor: null },
        inventory: [],
        injuries: [],
        personality: "Ethereal templar summoned autonomously by the GM",
        temperament: 'Loyal'
      };

      const newFollowerActor: Enemy = {
        id: `actor_guardian_gm_${Date.now()}`,
        followerId: folId,
        isFollower: true,
        x: sx,
        y: sy,
        type: 'Goblin',
        name: "Ethereal Light-Guardian",
        hp: 55,
        maxHp: 55,
        atk: 9,
        def: 4,
        isElite: false,
        range: 1,
        speed: 1,
        color: '#fbbf24',
        char: '🛡',
        state: EnemyState.Chasing,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      };

      const updatedEnemies = [...gameState.enemies, newFollowerActor];
      const updatedFollowers = [...gameState.followers, newFollowerMeta];
      const direction = getDirectionString(px, py, sx, sy);

      return {
        success: true,
        mutatedState: {
          enemies: updatedEnemies,
          followers: updatedFollowers
        },
        logText: getEncounterFlavorText(
          'guardian_summon',
          `🛡️ [DIVINE INTERVENTION]: In response to the perilous trials of the deep, a consecrated templar spirit materializes from the astral plane to the [${direction.toUpperCase()}], pledging its blade to protect you!`,
          { direction: direction.toUpperCase() }
        ),
        effectSpawn: { x: sx, y: sy, text: `Guardian Summoned! [${direction}]`, type: 'heal' }
      };
    }
  },
  {
    id: 'gilded_bounty',
    name: 'Primal Resource Bounty',
    description: "An elusive subterranean Ore Thief drops from the ceiling hoarding raw smelting alloys.",
    requiredMood: ['Benevolent', 'Intrigued', 'Apathetic'],
    minBoredom: 15,
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      // Find walkable spot near player
      const spot = findWalkableSpotNearPlayer(gameState, 2, 5);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };

      const rx = spot.x;
      const ry = spot.y;

      const oreThief: Enemy = {
        id: `gm_ore_thief_${Date.now()}`,
        x: rx,
        y: ry,
        type: EnemyType.LootGoblin,
        name: "Ilmarinen's Ore Thief",
        hp: Math.round(25 * (1 + gameState.playerStats.level * 0.1)),
        maxHp: Math.round(25 * (1 + gameState.playerStats.level * 0.1)),
        atk: 0,
        def: 3,
        range: 1,
        speed: 1,
        color: '#fbbf24', // golden yellow
        char: 'g',
        state: EnemyState.Patrolling,
        isElite: true,
        eliteEffect: 'Forge Thief (Drops solid raw alloys and metal flakes)',
        patrolPath: [],
        patrolIndex: 0,
        debuffs: [],
      };

      const updatedEnemies = [...gameState.enemies, oreThief];
      const direction = getDirectionString(gameState.playerX, gameState.playerY, rx, ry);

      return {
        success: true,
        mutatedState: { enemies: updatedEnemies },
        logText: getEncounterFlavorText(
          'gilded_bounty',
          `💰 [ROGUE FORGE THIEF]: Drawn by the scent of subterranean ore veins, an elusive Gilded Ore Thief drops from the cavern ceiling to the [${direction.toUpperCase()}], hoarding raw smelting metals!`,
          { direction: direction.toUpperCase() }
        ),
        effectSpawn: { x: rx, y: ry, text: `💰 Ore Thief! [${direction}]`, type: 'loot' }
      };
    }
  },
  {
    id: 'mana_leak',
    name: 'Alchemical Mana Leak',
    description: 'Volatile reagent vapor reacts unstably, draining Focus (MP).',
    requiredMood: ['Mischievous', 'Sadistic'],
    minBoredom: 25,
    trigger: (gameState, gmState) => {
      if (gameState.playerStats.mp <= 5) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      const drainAmt = Math.min(gameState.playerStats.mp, Math.floor(Math.random() * 5) + 3);
      const nextMp = Math.max(0, gameState.playerStats.mp - drainAmt);

      return {
        success: true,
        mutatedState: {
          playerStats: {
            ...gameState.playerStats,
            mp: nextMp
          }
        },
        logText: getEncounterFlavorText(
          'mana_leak',
          `⚠️ [ALCHEMICAL INSTABILITY]: Unstable catalyst vapor reacts violently within your pouch, releasing an electrical pop that burns away -${drainAmt} Focus (MP)!`,
          { drainAmt }
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `-${drainAmt} Focus (MP)`, type: 'dmg' }
      };
    }
  },
  {
    id: 'goblins_greed',
    name: "Goblin's Hidden Toll",
    description: "Greedy poltergeists and dungeon shades siphon gold coins from your pouch.",
    requiredMood: ['Sadistic', 'Mischievous'],
    minBoredom: 30,
    trigger: (gameState, gmState) => {
      if (gameState.playerStats.gold < 40) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      const goldToll = Math.floor(gameState.playerStats.gold * 0.15);
      const nextGold = Math.max(0, gameState.playerStats.gold - goldToll);

      return {
        success: true,
        mutatedState: {
          playerStats: {
            ...gameState.playerStats,
            gold: nextGold
          }
        },
        logText: getEncounterFlavorText(
          'goblins_greed',
          `💸 [PHANTOM TOLL]: Lingering dungeon shades and greedy poltergeists phase through the gloom, siphoning -${goldToll} Gold coins from your overburdened coinpurse!`,
          { goldToll }
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `-${goldToll} Gold!`, type: 'dmg' }
      };
    }
  },
  {
    id: 'acidic_smog',
    name: 'Acidic Alloy Tarnish',
    description: 'Corrosive sulfuric vapors erode the durability of equipped combat gear.',
    requiredMood: ['Sadistic'],
    minBoredom: 40,
    trigger: (gameState, gmState) => {
      let tarnishApplied = false;
      let nextWeapon = gameState.currentWeapon ? { ...gameState.currentWeapon } : null;
      let nextShield = gameState.equippedShield ? { ...gameState.equippedShield } : null;

      let logText = "";
      if (nextWeapon && (nextWeapon.durability ?? 100) > 15) {
        nextWeapon.durability = Math.max(10, (nextWeapon.durability ?? 100) - 15);
        tarnishApplied = true;
        logText += `Your equipped weapon (${nextWeapon.name}) suffers -15 durability strain. `;
      }
      if (nextShield && (nextShield.durability ?? 100) > 15) {
        nextShield.durability = Math.max(10, (nextShield.durability ?? 100) - 15);
        tarnishApplied = true;
        logText += `Your equipped shield (${nextShield.name}) suffers -15 durability strain. `;
      }

      if (!tarnishApplied) {
        return { success: false, mutatedState: {}, logText: "" };
      }

      return {
        success: true,
        mutatedState: {
          currentWeapon: nextWeapon,
          equippedShield: nextShield
        },
        logText: getEncounterFlavorText(
          'acidic_smog',
          `⚠️ [CORROSIVE VAPOR]: Noxious sulfur vents spew acidic fog across the stones, tarnishing and eroding the durability of your exposed equipment! ${logText}`,
          { details: logText }
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `Durability Strain!`, type: 'dmg' }
      };
    }
  },
  {
    id: 'earthquake_tremor',
    name: 'Tectonic Earthquake Tremor',
    description: 'Deep subterranean fault lines fracture violently, shaking the dungeon.',
    requiredMood: ['Sadistic', 'Mischievous', 'Apathetic'],
    minBoredom: 25,
    trigger: (gameState, gmState) => {
      const px = gameState.playerX;
      const py = gameState.playerY;

      // Minor direct strain to player
      const nextHp = Math.max(2, gameState.playerStats.hp - 5);
      const updatedStats = {
        ...gameState.playerStats,
        hp: nextHp
      };

      // Also damage all active hostiles
      let damagedAny = false;
      const updatedEnemies = gameState.enemies.map(e => {
        if (!e.isFollower && !e.isTownGuard && e.hp > 0) {
          damagedAny = true;
          return { ...e, hp: Math.max(1, e.hp - 8) };
        }
        return e;
      });

      return {
        success: true,
        mutatedState: {
          playerStats: updatedStats,
          enemies: updatedEnemies
        },
        logText: getEncounterFlavorText(
          'earthquake_tremor',
          `🌋 [TECTONIC TREMOR]: Deep subterranean fault lines fracture violently! A violent seismic shudder rocks the foundation, dealing -5 strain damage to you and rattling nearby hostiles for -8 HP!`,
          {}
        ),
        effectSpawn: { x: px, y: py, text: `Earth Tremor!`, type: 'dmg' }
      };
    }
  },
  {
    id: 'dimensional_blur',
    name: 'Dimensional Phase Blur',
    description: 'A transient reality glitch blurs coordinate spaces, pushing nearby hostiles 1 tile away.',
    requiredMood: ['Mischievous', 'Intrigued', 'Apathetic'],
    minBoredom: 20,
    trigger: (gameState, gmState) => {
      const px = gameState.playerX;
      const py = gameState.playerY;
      
      let pushedAny = false;
      const updatedEnemies = gameState.enemies.map(e => {
        if (!e.isFollower && !e.isTownGuard && Math.abs(e.x - px) <= 2 && Math.abs(e.y - py) <= 2) {
          const dx = Math.sign(e.x - px);
          const dy = Math.sign(e.y - py);
          const nx = e.x + (dx !== 0 ? dx : (Math.random() > 0.5 ? 1 : -1));
          const ny = e.y + (dy !== 0 ? dy : (Math.random() > 0.5 ? 1 : -1));
          
          if (nx >= 0 && nx < gameState.levelWidth && ny >= 0 && ny < gameState.levelHeight) {
            const tile = gameState.map[ny]?.[nx];
            const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
            if (isWalkable) {
              pushedAny = true;
              return { ...e, x: nx, y: ny, state: EnemyState.Patrolling };
            }
          }
        }
        return e;
      });

      if (!pushedAny) return { success: false, mutatedState: {}, logText: "" };

      return {
        success: true,
        mutatedState: { enemies: updatedEnemies },
        logText: getEncounterFlavorText(
          'dimensional_blur',
          `🌀 [SPATIAL DISTORTION]: A momentary rupture in the physical plane warps space-time coordinates, scattering and disorienting nearby hostiles 1 tile outward!`,
          {}
        ),
        effectSpawn: { x: px, y: py, text: `Grid Phase Blur!`, type: 'heal' }
      };
    }
  },
  {
    id: 'mystical_resonance',
    name: 'Leyline Acoustic Resonance',
    description: 'An acoustic wave of ancient ley energy restores 15 focus mana points to the player.',
    requiredMood: ['Benevolent', 'Intrigued'],
    minBoredom: 10,
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      if (gameState.playerStats.mp >= gameState.playerStats.maxMp - 5) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      const nextMp = Math.min(gameState.playerStats.maxMp, gameState.playerStats.mp + 15);
      return {
        success: true,
        mutatedState: {
          playerStats: {
            ...gameState.playerStats,
            mp: nextMp
          }
        },
        logText: getEncounterFlavorText(
          'mystical_resonance',
          `🔮 [LEYLINE RESONANCE]: The ancient cavern slate vibrates at a harmonic frequency, channeling +15 Focus (MP) directly into your spirit!`,
          {}
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `+15 MP Resonance!`, type: 'heal' }
      };
    }
  },
  {
    id: 'wild_beast_pack',
    name: 'Wilderness Fauna Spawn',
    description: 'A passive woodland beast wanders onto the active coordinate matrix.',
    requiredMood: ['Intrigued', 'Benevolent', 'Apathetic'],
    minBoredom: 15,
    trigger: (gameState, gmState) => {
      const spot = findWalkableSpotNearPlayer(gameState, 4, 8);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };

      const isBoar = Math.random() > 0.5;
      const animal: Enemy = {
        id: `gm_animal_${Date.now()}`,
        x: spot.x,
        y: spot.y,
        type: EnemyType.Rat,
        name: isBoar ? '🐗 Forest Boar' : '🐇 Fluffy Wild Rabbit',
        hp: isBoar ? 20 : 8,
        maxHp: isBoar ? 20 : 8,
        atk: isBoar ? 3 : 0,
        def: 1,
        range: 1,
        speed: 1,
        color: isBoar ? '#854d0e' : '#cbd5e1',
        char: isBoar ? 'b' : 'r',
        state: EnemyState.Patrolling,
        isElite: false,
        isAnimal: true,
        patrolPath: [],
        patrolIndex: 0,
        debuffs: []
      };

      const updatedEnemies = [...gameState.enemies, animal];
      const direction = getDirectionString(gameState.playerX, gameState.playerY, spot.x, spot.y);

      return {
        success: true,
        mutatedState: { enemies: updatedEnemies },
        logText: getEncounterFlavorText(
          'wild_beast_pack',
          `🐇 [WILDLIFE SIGHTING]: Rustling leaves and snapped twigs herald the arrival of a wild ${animal.name} grazing peacefully to the [${direction.toUpperCase()}]!`,
          { animalName: animal.name, direction: direction.toUpperCase() }
        ),
        effectSpawn: { x: spot.x, y: spot.y, text: `Fauna Spawned!`, type: 'heal' }
      };
    }
  },
  {
    id: 'ukko_thunder',
    name: "Ukko's Golden Bolt",
    description: "Ukko Ylijumala strikes a massive golden lightning bolt, purging nearest enemy and infusing player with sky-sparks.",
    requiredMood: ['Benevolent', 'Intrigued'],
    minBoredom: 30,
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      const hostiles = gameState.enemies.filter(e => e.hp > 0 && !e.isFollower && !e.isTownGuard && !e.isAnimal);
      if (hostiles.length === 0) return { success: false, mutatedState: {}, logText: "" };
      
      hostiles.sort((a,b) => {
        const distA = Math.abs(a.x - gameState.playerX) + Math.abs(a.y - gameState.playerY);
        const distB = Math.abs(b.x - gameState.playerX) + Math.abs(b.y - gameState.playerY);
        return distA - distB;
      });
      
      const target = hostiles[0];
      const targetIdx = gameState.enemies.findIndex(e => e.id === target.id);
      if (targetIdx === -1) return { success: false, mutatedState: {}, logText: "" };
      
      const lightningDmg = 35;
      const nextHp = Math.max(0, target.hp - lightningDmg);
      const updatedEnemies = [...gameState.enemies];
      if (nextHp === 0) {
        updatedEnemies.splice(targetIdx, 1);
      } else {
        updatedEnemies[targetIdx] = { ...target, hp: nextHp };
      }
      
      const nextMp = Math.min(gameState.playerStats.maxMp, gameState.playerStats.mp + 10);
      
      return {
        success: true,
        mutatedState: {
          enemies: updatedEnemies,
          playerStats: {
            ...gameState.playerStats,
            mp: nextMp
          }
        },
        logText: getEncounterFlavorText(
          'ukko_thunder',
          `⚡ [UKKO'S GOLDEN THUNDER]: Ukko Ylijumala hurls an incandescent thunderbolt from the upper heavens, incinerating ${target.name} for ${lightningDmg} Damage and releasing energized static that restores +10 MP!`,
          { enemyName: target.name, dmg: lightningDmg }
        ),
        effectSpawn: { x: target.x, y: target.y, text: `⚡ Ukko's Strike!`, type: 'dmg' }
      };
    }
  },
  {
    id: 'vainamoinen_song',
    name: "Väinämöinen's Rune-Song",
    description: "Väinämöinen sings the ancient runes of creation, putting all nearby enemies to sleep/calm and healing the player.",
    requiredMood: ['Benevolent', 'Intrigued', 'Apathetic'],
    minBoredom: 20,
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      const healAmt = 25;
      const nextHp = Math.min(gameState.playerStats.maxHp, gameState.playerStats.hp + healAmt);
      
      const updatedEnemies = gameState.enemies.map(e => {
        if (!e.isFollower && !e.isTownGuard && e.state === EnemyState.Chasing) {
          return { ...e, state: EnemyState.Patrolling };
        }
        return e;
      });
      
      return {
        success: true,
        mutatedState: {
          playerStats: {
            ...gameState.playerStats,
            hp: nextHp
          },
          enemies: updatedEnemies
        },
        logText: getEncounterFlavorText(
          'vainamoinen_song',
          `🎵 [RUNIC HARMONY]: The eternal melodies of Väinämöinen echo through the stone. Your wounds knit for +${healAmt} HP, while hostile creatures pause spellbound as their fury is pacified!`,
          { healAmt }
        ),
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `🎵 Song of Calm!`, type: 'heal' }
      };
    }
  },
  {
    id: 'mielikki_gift',
    name: "Mielikki's Honey Drop",
    description: "Mielikki, Queen of the Forest, spawns a glowing Honey-Glazed Boar that flees from the player, dropping cooked meats and honey.",
    requiredMood: ['Benevolent', 'Intrigued'],
    minBoredom: 10,
    trigger: (gameState, gmState) => {
      if (gmState.disableGifts) {
        return { success: false, mutatedState: {}, logText: "" };
      }
      // Find walkable spot near player
      const spot = findWalkableSpotNearPlayer(gameState, 2, 5);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };

      const rx = spot.x;
      const ry = spot.y;

      const honeyBoar: Enemy = {
        id: `gm_honey_boar_${Date.now()}`,
        x: rx,
        y: ry,
        type: EnemyType.LootGoblin, // will scurry and flee, dropping delicious food!
        name: "Mielikki's Honey-Glazed Boar",
        hp: Math.round(30 * (1 + gameState.playerStats.level * 0.12)),
        maxHp: Math.round(30 * (1 + gameState.playerStats.level * 0.12)),
        atk: 0,
        def: 1,
        range: 1,
        speed: 1,
        color: '#f59e0b', // warm honey amber
        char: '🐗',
        state: EnemyState.Patrolling,
        isElite: true,
        eliteEffect: "Honey-Glazed (Drops delicious cooked steaks & fish upon defeat!)",
        patrolPath: [],
        patrolIndex: 0,
        debuffs: [],
      };

      const updatedEnemies = [...gameState.enemies, honeyBoar];
      const direction = getDirectionString(gameState.playerX, gameState.playerY, rx, ry);

      return {
        success: true,
        mutatedState: { enemies: updatedEnemies },
        logText: getEncounterFlavorText(
          'mielikki_gift',
          `🐗 [FOREST QUEEN'S FAVOR]: Mielikki blesses the trail with a magical Honey-Glazed Boar to the [${direction.toUpperCase()}], offering wholesome roasted meats and trail honey if hunted!`,
          { direction: direction.toUpperCase() }
        ),
        effectSpawn: { x: rx, y: ry, text: `🐗 Honey Boar! [${direction}]`, type: 'loot' }
      };
    }
  },
  {
    id: 'story_bandit_camp',
    name: "Roaming Outlaw Camp",
    description: "Outlaw raiders establish a fortified wilderness campfire to ambush travelers.",
    requiredMood: ['Mischievous', 'Sadistic', 'Intrigued'],
    minBoredom: 30,
    trigger: (gameState, gmState) => {
      // Find walkable spot near player
      const spot = findWalkableSpotNearPlayer(gameState, 5, 11);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };

      // We clone and modify the map to set the campfire at the center
      const nextMap = gameState.map.map(row => [...row]);
      nextMap[spot.y][spot.x] = TileType.Campfire;

      const nextVisible = gameState.visible ? gameState.visible.map(row => [...row]) : undefined;
      const nextDiscovered = gameState.discovered ? gameState.discovered.map(row => [...row]) : undefined;
      
      // Exposing a 3x3 around the camp
      if (nextVisible && nextDiscovered) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ty = spot.y + dy;
            const tx = spot.x + dx;
            if (tx >= 0 && tx < gameState.levelWidth && ty >= 0 && ty < gameState.levelHeight) {
              if (nextVisible[ty]) nextVisible[ty][tx] = true;
              if (nextDiscovered[ty]) nextDiscovered[ty][tx] = true;
            }
          }
        }
      }

      const nextEnemies = [...gameState.enemies];
      const count = Math.floor(Math.random() * 2) + 2; // 2 or 3 bandits
      const timestamp = Date.now();
      let spawnedCount = 0;

      const neighbors = [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: -1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: 1, dy: 1 }
      ];

      const shuffledNeighbors = [...neighbors].sort(() => Math.random() - 0.5);

      for (const offset of shuffledNeighbors) {
        if (spawnedCount >= count) break;
        const ex = spot.x + offset.dx;
        const ey = spot.y + offset.dy;

        if (ex >= 0 && ex < gameState.levelWidth && ey >= 0 && ey < gameState.levelHeight) {
          const tile = nextMap[ey][ex];
          const isWalkable = tile === TileType.Floor || tile === TileType.Grass || tile === TileType.Path;
          const isPlayer = ex === gameState.playerX && ey === gameState.playerY;
          const hasExistingEnemy = nextEnemies.some(e => e.x === ex && e.y === ey);
          const hasExistingNpc = gameState.npcs && gameState.npcs.some(n => n.x === ex && n.y === ey);

          if (isWalkable && !isPlayer && !hasExistingEnemy && !hasExistingNpc) {
            nextEnemies.push({
              id: `story_bandit_mob_${timestamp}_${spawnedCount}`,
              x: ex,
              y: ey,
              type: EnemyType.Bandit,
              name: spawnedCount === 0 ? 'Outlaw Bandit Leader' : 'Exile Camp Bandit',
              hp: spawnedCount === 0 ? 85 : 55,
              maxHp: spawnedCount === 0 ? 85 : 55,
              atk: spawnedCount === 0 ? 11 : 8,
              def: spawnedCount === 0 ? 4 : 2,
              range: 1,
              speed: 1,
              color: spawnedCount === 0 ? '#b91c1c' : '#d97706',
              char: '👤',
              state: EnemyState.Chasing, // Aggressive chase so they engage!
              isElite: spawnedCount === 0,
              patrolPath: [],
              patrolIndex: 0,
              debuffs: []
            });
            spawnedCount++;
          }
        }
      }

      const direction = getDirectionString(gameState.playerX, gameState.playerY, spot.x, spot.y);

      return {
        success: true,
        mutatedState: {
          map: nextMap,
          visible: nextVisible,
          discovered: nextDiscovered,
          enemies: nextEnemies
        },
        logText: getEncounterFlavorText(
          'story_bandit_camp',
          `🔥 [BANDIT OUTPOST]: Smoke curls above the tree line as a gang of ruthless outlaws sets up a fortified campfire to the [${direction.toUpperCase()}], plotting ambushes on passing travelers!`,
          { direction: direction.toUpperCase() }
        ),
        effectSpawn: { x: spot.x, y: spot.y, text: `🔥 Bandit Camp! [${direction}]`, type: 'dmg' }
      };
    }
  }
];;
