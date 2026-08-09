import { GameState, Enemy, EnemyState, EnemyType, TileType, EquipmentItem, GameLogMessage, CatalystType, Follower, TrapType, Trap } from '../types';
import { BIOME_VALID_WEATHERS, getValidWeatherForBiome } from './weatherEngine';
import { BASIC_MATERIALS, ELEMENTAL_CATALYSTS } from './itemsData';
import { findWalkableSpotNearPlayer, getDirectionString } from '../data/gmCommands';
import { createGMTriangleCheaterEnemy } from './combatArchetypes';
import storyEventsData from '../data/storyEvents.json';

export interface StoryEventsCatalog {
  chaosSurges: Array<{
    roll: number;
    effName: string;
    effDesc: string;
    effType: 'good' | 'bad' | 'neutral';
    logText: string;
    spawnText: string;
  }>;
  encounters: Array<{
    id: string;
    name: string;
    description: string;
    requiredMood?: string[];
    minBoredom: number;
    minTension?: number;
    maxTension?: number;
  }>;
  narrativePrompts: Record<GMPersonality, string>;
}

export const STORY_EVENTS_CATALOG: StoryEventsCatalog = storyEventsData as StoryEventsCatalog;

export type GMPersonality = 'Mischievous' | 'Sadistic' | 'Benevolent' | 'Intrigued' | 'Apathetic';

export interface GMMemory {
  lastPlayerX: number;
  lastPlayerY: number;
  idleTurns: number;
  monstersSlain: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  chestsOpened: number;
  lastInterventionTurn: number;
  lastChaosRollTurn?: number;
}

export interface GMState {
  personality: GMPersonality;
  boredom: number; // 0 to 100
  tension: number; // 0 to 100 (high tension when player is low HP or fighting bosses)
  memories: GMMemory;
  thoughts: string[]; // Recent internally logged thoughts
  disableGifts?: boolean; // Restrict item & resource gifts
  lastChaosRoll?: number;
  lastChaosEffectName?: string;
  lastChaosEffectDesc?: string;
  chaosHistory?: Array<{ turn: number; roll: number; name: string; type: 'good' | 'bad' | 'neutral' }>;
}

export interface GMEncounter {
  id: string;
  name: string;
  description: string;
  requiredMood?: GMPersonality[];
  minBoredom: number;
  minTension?: number;
  maxTension?: number;
  trigger: (
    gameState: GameState,
    gmState: GMState
  ) => {
    success: boolean;
    mutatedState: Partial<GameState>;
    logText: string;
    effectSpawn?: { x: number; y: number; text: string; type: 'heal' | 'dmg' | 'loot' };
  };
}

// Global GM state tracker
let globalGMState: GMState = {
  personality: 'Intrigued',
  boredom: 30,
  tension: 0,
  memories: {
    lastPlayerX: 0,
    lastPlayerY: 0,
    idleTurns: 0,
    monstersSlain: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    chestsOpened: 0,
    lastInterventionTurn: 0,
  },
  thoughts: [
    "Sovereign matrix initialized. Player coords registered. Autonomous GM active and monitoring...",
  ],
  disableGifts: false
};

export function getGMStorytellerState(): GMState {
  if (typeof window !== 'undefined') {
    if (!(window as any).sovereignGMState) {
      (window as any).sovereignGMState = globalGMState;
    }
    return (window as any).sovereignGMState;
  }
  return globalGMState;
}

export function setGMStorytellerState(state: GMState) {
  if (typeof window !== 'undefined') {
    (window as any).sovereignGMState = state;
  }
  globalGMState = state;
}

// Modular encoutners database
export const GM_ENCOUNTERS_DATABASE: GMEncounter[] = [
  {
    id: 'healing_breeze',
    name: 'Seraphic Healing Breeze',
    description: 'GM notices the player is in near-lethal danger and casts a protective divine aura.',
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
        logText: `✨ A sudden warm Seraphic Healing Breeze whispers through the air, mending your wounds for +${healAmt} HP!`,
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `+${healAmt} Holy HP!`, type: 'heal' }
      };
    }
  },
  {
    id: 'void_ambush',
    name: 'Sovereign Rift Ambush',
    description: 'GM gets high irritation from idling or over-preparedness, tearing open a void rift spawning custom monsters.',
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
        logText: `⚠️ The air snaps as a spatial Rift tears open out of vicinity far to the [${direction.toUpperCase()}], spawning an elite ${newEnemy.name}!`,
        effectSpawn: { x: sx, y: sy, text: `Void Rift Tear! [${direction}]`, type: 'dmg' }
      };
    }
  },
  {
    id: 'alchemy_gift',
    name: 'Alchemical Drop',
    description: 'The storyteller summons a Volatile Alchemical Sprite near the player, loaded with premium alchemical catalysts.',
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
        logText: `✨ A glowing, hyper-active Alchemical Sprite materializes from the ambient ether to the [${direction.toUpperCase()}], squeaking playfully as it darts around!`,
        effectSpawn: { x: rx, y: ry, text: `✧ Sprite Spawned! [${direction}]`, type: 'loot' }
      };
    }
  },
  {
    id: 'smite_nearest',
    name: 'Lightning Bolt Smite',
    description: 'The storyteller strikes lightning on a hostile enemy when feeling charitable or seeking explosive balance.',
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
        logText: `⚡ Searing lightning strikes down from above, blasting ${target.name} to the [${direction.toUpperCase()}] for ${smiteDmg} raw energy damage!`,
        effectSpawn: { x: target.x, y: target.y, text: `-${smiteDmg} Smite! [${direction}]`, type: 'dmg' }
      };
    }
  },
  {
    id: 'trap_shower',
    name: 'Acoustic Hazard Alarm',
    description: 'Sadistic or mischievous storytelling spawns dynamic spike traps beneath the feet of neighboring spaces.',
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
        logText: `⚠️ You hear a mechanical click as active spike traps are deployed in the distance to the [${direction.toUpperCase()}]!`,
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

      return {
        success: true,
        mutatedState: { weather: chosenWeather },
        logText: `☁️ The wind turns sharply and the clouds shift. Overworld weather alters to [${chosenWeather.toUpperCase()}]!`,
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `Skies shift!`, type: 'heal' }
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
        logText: `⚡ [GM TRIANGLE CHEATER]: The GM Storyteller bends reality! ${target.name} to the [${direction.toUpperCase()}] undergoes an Anomaly Mutation, transcending Golden Triangle limits!`,
        effectSpawn: { x: target.x, y: target.y, text: `⚡ TRIANGLE CHEATER! [${direction}]`, type: 'dmg' }
      };
    }
  },
  {
    id: 'arcane_torrent',
    name: 'Arcane Gale Torrent',
    description: 'When the player depletes their mana reservoir, the storyteller channels a dense stream of raw ether directly to them.',
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
        logText: `🔮 An Arcane Gale Torrent sweeps through your consciousness, replenishing +${restoreAmt} MP and condensing a catalytic element from the air into your pack!`,
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `+${restoreAmt} Mana Infused!`, type: 'heal' }
      };
    }
  },
  {
    id: 'guardian_summon',
    name: 'Sovereign Light-Guardian',
    description: 'GM spawns an Ethereal Holy Paladin ally nearby to aid the player in moments of heavy battlefield stress or boss showdowns.',
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
        logText: `🛡️ A radiant, golden light glows on the stone, summoning an Ethereal Sovereign Guardian far to the [${direction.toUpperCase()}], rushing to your side!`,
        effectSpawn: { x: sx, y: sy, text: `Guardian Summoned! [${direction}]`, type: 'heal' }
      };
    }
  },
  {
    id: 'gilded_bounty',
    name: 'Primal Resource Bounty',
    description: "The storyteller manifests Ilmarinen's rogue Ore Thief nearby, a fast goblin carrying premium metals and ores.",
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
        logText: `💰 A heavy thud echoes as an elusive, gilded Ore Thief drops from the shadows above to the [${direction.toUpperCase()}], carrying precious alloys!`,
        effectSpawn: { x: rx, y: ry, text: `💰 Ore Thief! [${direction}]`, type: 'loot' }
      };
    }
  },
  {
    id: 'mana_leak',
    name: 'Alchemical Mana Leak',
    description: 'A mischievous GM causes the player to lose some Mana (MP) because of alchemical leakage.',
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
        logText: `⚠️ A sudden high-voltage sparkle leaks from your reagent pouch! You lose -${drainAmt} Focus (MP) to volatile mana radiation!`,
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `-${drainAmt} Focus (MP)`, type: 'dmg' }
      };
    }
  },
  {
    id: 'goblins_greed',
    name: "Goblin's Hidden Toll",
    description: "The GM directly drains some gold from the player's pockets because they are carrying too much treasure.",
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
        logText: `💸 A ghostly chuckle echoes as a phantom spirit pickpockets -${goldToll} Gold from your heavy coinpurse!`,
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `-${goldToll} Gold!`, type: 'dmg' }
      };
    }
  },
  {
    id: 'acidic_smog',
    name: 'Acidic Alloy Tarnish',
    description: 'An acidic environmental smog causes the durability of the players equipped weapon or shields to decay.',
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
        logText: `⚠️ A corrosive, acidic alloy-tarnishing vapor sweeps across the chamber! ${logText}`,
        effectSpawn: { x: gameState.playerX, y: gameState.playerY, text: `Durability Strain!`, type: 'dmg' }
      };
    }
  },
  {
    id: 'earthquake_tremor',
    name: 'Tectonic Earthquake Tremor',
    description: 'A sudden seismic shockwave deals minor strain damage to both you and active hostile monsters.',
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
        logText: `🌋 Deep seismic plates shift! A sudden localized Tectonic Earthquake rumbles through the stone, shaking you for -5 HP and nearby hostiles for -8 HP!`,
        effectSpawn: { x: px, y: py, text: `Earth Tremor!`, type: 'dmg' }
      };
    }
  },
  {
    id: 'dimensional_blur',
    name: 'Dimensional Phase Blur',
    description: 'A transient reality glitch blurs coordinate spaces, pushing nearby hostiles 1 tile away from the player.',
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
        logText: `🌀 Reality blurs momentarily as spatial coordinate fields shift! A Dimensional Phase Blur shuffles and repels adjacent hostile monsters!`,
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
        logText: `🔮 The ancient cavernous slate hums with deep magical energy. A Leyline Acoustic Resonance channels +15 Focus (MP) into your core consciousness!`,
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
        logText: `🐇 Rustling noises echo from the undergrowth. A wild ${animal.name} enters the area to the [${direction.toUpperCase()}]!`,
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
        logText: `⚡ A radiant, golden bolt of pure thunder strikes down from the heavens, blasting ${target.name} for ${lightningDmg} Damage and leaving behind a spark that restores +10 MP!`,
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
        logText: `🎵 An ancient, soothing runic melody of creation echoes through the halls. You are healed for +${healAmt} HP, and nearby hostiles pause, their rage pacified by the magical verses!`,
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
        logText: `🐗 The warm scent of honey and wild herbs fills the air. A magical, sweet Honey-Glazed Boar darts onto the path far to the [${direction.toUpperCase()}], offering grand sustenance if pursued!`,
        effectSpawn: { x: rx, y: ry, text: `🐗 Honey Boar! [${direction}]`, type: 'loot' }
      };
    }
  },
  {
    id: 'story_bandit_camp',
    name: "Roaming Outlaw Camp",
    description: "The GM spawns a small camp of 2-3 Outlaw Bandits around a newly lit wood campfire nearby, accompanied by a dynamic lore announcement.",
    requiredMood: ['Mischievous', 'Sadistic', 'Intrigued'],
    minBoredom: 30,
    trigger: (gameState, gmState) => {
      // Find walkable spot near player
      const spot = findWalkableSpotNearPlayer(gameState, 5, 11);
      if (!spot) return { success: false, mutatedState: {}, logText: "" };

      // We clone and modify the map to set the campfire at the center
      const nextMap = gameState.map.map(row => [...row]);
      nextMap[spot.y][spot.x] = TileType.Campfire;

      const nextVisible = gameState.visible.map(row => [...row]);
      const nextDiscovered = gameState.discovered.map(row => [...row]);
      
      // Exposing a 3x3 around the camp
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ty = spot.y + dy;
          const tx = spot.x + dx;
          if (tx >= 0 && tx < gameState.levelWidth && ty >= 0 && ty < gameState.levelHeight) {
            nextVisible[ty][tx] = true;
            nextDiscovered[ty][tx] = true;
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
        logText: `🔥 LORE MONOLOGUE: You hear rowdy laughter and crackling wood nearby... A small Bandit Camp has set up campfire far to the [${direction.toUpperCase()}]! Go disperse them!`,
        effectSpawn: { x: spot.x, y: spot.y, text: `🔥 Bandit Camp! [${direction}]`, type: 'dmg' }
      };
    }
  }
];

// Principal tick function executed per player action step
export function tickActiveGMStoryteller(
  gameState: GameState
): {
  gmState: GMState;
  stateUpdates: Partial<GameState>;
  didIntervene: boolean;
  logMessage?: GameLogMessage;
  effectSpawn?: { x: number; y: number; text: string; type: 'heal' | 'dmg' | 'loot' };
} {
  const currentGM = getGMStorytellerState();
  const px = gameState.playerX;
  const py = gameState.playerY;

  // 1. Memory tracking
  const mem = { ...currentGM.memories };
  if (px === mem.lastPlayerX && py === mem.lastPlayerY) {
    mem.idleTurns += 1;
  } else {
    mem.idleTurns = 0;
  }
  
  mem.lastPlayerX = px;
  mem.lastPlayerY = py;

  // Track dynamic tension level (0 to 100)
  // Low player HP increases tension. High monster count near player increases tension.
  const hpRatio = gameState.playerStats.hp / gameState.playerStats.maxHp;
  const surroundingEnemies = gameState.enemies.filter(
    e => Math.abs(e.x - px) + Math.abs(e.y - py) <= 5 && !e.isFollower && !e.isTownGuard && e.hp > 0
  ).length;

  const calculatedTension = Math.max(0, Math.min(100, Math.round(
    (1 - hpRatio) * 60 + surroundingEnemies * 12
  )));

  // Calculate dynamic boredom/chaos metric
  // If player is in close combat, combat keeps GM engaged (boredom decreases).
  // If player is idling in one spot (idleTurns > 3), boredom rises slightly.
  // During peaceful / non-combat turns, Chaos/Boredom automatically drifts down toward 20% baseline!
  let boredomDelta = 0;
  if (surroundingEnemies > 0) {
    boredomDelta = -2; // kept engaged by close combat!
  } else if (mem.idleTurns > 3) {
    boredomDelta = 2; // extended idling gently increases boredom
  } else {
    // Peaceful or non-combat active turns: natural decay toward 20% baseline
    if (currentGM.boredom > 20) {
      boredomDelta = -1; // drift down toward 20%
    } else if (currentGM.boredom < 20) {
      boredomDelta = 1; // drift up toward 20%
    }
  }

  const calculatedBoredom = Math.max(10, Math.min(100, currentGM.boredom + boredomDelta));

  // Determine current GM mood flavor
  let nextPersonality = currentGM.personality;
  if (currentGM.disableGifts && nextPersonality === 'Benevolent') {
    nextPersonality = 'Intrigued';
  }
  // Dynamic temporary thoughts and personality shifts
  if (calculatedBoredom > 75 && Math.random() < 0.15) {
    const list: GMPersonality[] = currentGM.disableGifts
      ? ['Mischievous', 'Sadistic']
      : ['Mischievous', 'Sadistic', 'Intrigued'];
    nextPersonality = list[Math.floor(Math.random() * list.length)];
  } else if (hpRatio < 0.25 && Math.random() < 0.2) {
    const list: GMPersonality[] = currentGM.disableGifts
      ? ['Sadistic', 'Intrigued']
      : ['Benevolent', 'Intrigued', 'Sadistic'];
    nextPersonality = list[Math.floor(Math.random() * list.length)];
  }

  const thoughts = [...currentGM.thoughts];
  const turn = gameState.playerStats.turnsPlayed;

  // Log internal monologue occasionally
  if (turn % 7 === 0) {
    const promptTemplate = STORY_EVENTS_CATALOG.narrativePrompts[nextPersonality] || STORY_EVENTS_CATALOG.narrativePrompts.Intrigued;
    let thought = `Turn ${turn}: "${promptTemplate}"`;
    if (nextPersonality === 'Sadistic') {
      thought = `Turn ${turn}: "HP ratio is at ${(hpRatio*100).toFixed(0)}%. ${promptTemplate}"`;
    } else if (nextPersonality === 'Intrigued' || nextPersonality === 'Apathetic') {
      thought = `Turn ${turn}: "Watching coordinate vector (${px},${py}). Boredom coefficient is ${calculatedBoredom} pts. ${promptTemplate}"`;
    }
    thoughts.unshift(thought);
    if (thoughts.length > 20) thoughts.pop();
  }

  const updatedGM: GMState = {
    personality: nextPersonality,
    boredom: calculatedBoredom,
    tension: calculatedTension,
    memories: mem,
    thoughts: thoughts,
    lastChaosRoll: currentGM.lastChaosRoll,
    lastChaosEffectName: currentGM.lastChaosEffectName,
    lastChaosEffectDesc: currentGM.lastChaosEffectDesc,
    chaosHistory: currentGM.chaosHistory ? [...currentGM.chaosHistory] : []
  };

  // --- GM Chaos Matrix Integration & Adaptive Combat Evaluation ---
  // Chaos Matrix evaluates player performance dynamically.
  let currentChaos = gameState.chaosScore ?? 20;
  let chaosStateUpdates: Partial<GameState> = { chaosScore: currentChaos };
  let chaosLogMessage: GameLogMessage | undefined = undefined;
  let chaosEffectSpawn: any = undefined;
  let didChaosTrigger = false;

  // Track total monsters slain
  const totalSlain = Object.values(gameState.defeatedEnemiesCount || {}).reduce((a, b) => a + b, 0);
  const slainInInterval = Math.max(0, totalSlain - (mem.monstersSlain || 0));

  // GM Steamroll / Effortless Slaughter Check:
  // If player defeated 1+ enemies recently while keeping high HP (>= 60%), or if player is idling/steamrolling with zero resistance
  const isEffortlessSlaughter = (slainInInterval > 0 && hpRatio >= 0.60) || (turn > 0 && turn % 25 === 0 && surroundingEnemies === 0 && hpRatio > 0.85 && calculatedBoredom > 50);

  if (isEffortlessSlaughter && currentChaos < 95) {
    const slainMultiplier = Math.max(1, slainInInterval);
    const delta = Math.min(15, 6 + slainMultiplier * 2);
    const oldScore = currentChaos;
    currentChaos = Math.min(100, currentChaos + delta);
    chaosStateUpdates.chaosScore = currentChaos;
    mem.monstersSlain = totalSlain;

    // Empower active enemies dynamically!
    let mutatedEnemiesCount = 0;
    const updatedEnemies = gameState.enemies.map(enemy => {
      if (!enemy.isFollower && !enemy.isTownGuard && !enemy.isAnimal && enemy.hp > 0) {
        mutatedEnemiesCount++;
        const hpBoost = Math.max(6, Math.floor(enemy.maxHp * 0.30));
        const newMaxHp = enemy.maxHp + hpBoost;
        const newHp = enemy.hp + hpBoost;
        const newAtk = enemy.atk + 2;
        const newDef = enemy.def + 1;
        const newChaosTier = Math.min(3, (enemy.chaosTier || 0) + 1);

        let isNowElite = enemy.isElite;
        let enemyName = enemy.name;
        let eliteEffect = enemy.eliteEffect;

        if (!enemy.isElite && !enemy.isBoss && Math.random() < 0.45) {
          isNowElite = true;
          if (!enemyName.includes('Chaos-Empowered')) {
            enemyName = `Chaos-Empowered ${enemyName}`;
          }
          eliteEffect = '⚡ Abyssal Ferocity (+30% HP, +2 ATK, Heavy Stagger)';
        }

        return {
          ...enemy,
          hp: newHp,
          maxHp: newMaxHp,
          atk: newAtk,
          def: newDef,
          chaosTier: newChaosTier,
          isElite: isNowElite,
          name: enemyName,
          eliteEffect
        };
      }
      return enemy;
    });

    if (mutatedEnemiesCount > 0) {
      chaosStateUpdates.enemies = updatedEnemies;
    }

    const logText = `🔮 [GM CHAOS ADAPTATION]: The Game Master evaluates your effortless slaughter! "${slainInInterval > 0 ? `Slain ${slainInInterval} foes without breaking a sweat?` : 'Experiencing zero resistance?'} Let us test your true steel!" Chaos Matrix +${delta} (${oldScore} → ${currentChaos})! Active monsters gain +30% HP, +2 ATK, and aggressive stances!`;
    
    thoughts.unshift(`Turn ${turn}: "Player steamrolling effortlessly (${slainInInterval} recent kills, HP ${(hpRatio*100).toFixed(0)}%). Escalating Chaos Matrix by +${delta} to ${currentChaos} pts and reinforcing ${mutatedEnemiesCount} active monsters."`);
    
    chaosLogMessage = {
      id: `gm_chaos_steamroll_${Date.now()}_${Math.random()}`,
      text: logText,
      type: 'danger',
      timestamp: 'CHAOS'
    };
    
    chaosEffectSpawn = { x: px, y: py, text: `🔮 Chaos +${delta} (Effortless Slaughter)`, type: 'dmg' };
    didChaosTrigger = true;
  }
  // GM Chaos Mercy:
  // If player is in severe peril (HP < 25%, high tension) and Chaos > 15
  else if (turn > 0 && turn % 20 === 0 && hpRatio < 0.25 && currentChaos > 15) {
    const delta = 6;
    const oldScore = currentChaos;
    currentChaos = Math.max(0, currentChaos - delta);
    chaosStateUpdates.chaosScore = currentChaos;
    const logText = `✨ [GM CHAOS MATRIX]: ${oldScore} → ${currentChaos} (-${delta}) — GM Mercy: Providing atmospheric pressure relief during critical survival peril!`;
    thoughts.unshift(`Turn ${turn}: "Player HP critical (${(hpRatio * 100).toFixed(0)}%). Lowering Chaos Matrix by -${delta} points."`);
    chaosLogMessage = {
      id: `gm_chaos_down_${Date.now()}`,
      text: logText,
      type: 'loot',
      timestamp: 'CHAOS'
    };
    chaosEffectSpawn = { x: px, y: py, text: `✨ Chaos -${delta} (GM Mercy)`, type: 'heal' };
  }

  if (false) { // Passive surges disabled - GM now dynamically controls Chaos Matrix
    mem.lastChaosRollTurn = turn;
    didChaosTrigger = true;
    let roll = Math.floor(Math.random() * 20) + 1;
    if (updatedGM.disableGifts && roll >= 11) {
      // Convert positive gifting rolls (11-20) to challenging hazard rolls (1-10)
      roll = Math.floor(Math.random() * 10) + 1;
    }
    updatedGM.lastChaosRoll = roll;

    let effName = "";
    let effDesc = "";
    let effType: 'good' | 'bad' | 'neutral' = 'neutral';
    let logText = "";

    if (roll === 1) {
      effName = "Dimensional Rupture (Critical Failure)";
      effDesc = "Unstable tectonic rift ruptures. -15 HP damage!";
      effType = 'bad';
      logText = `⚠️ THE CHAOS CORE RUPTURED (Roll 1): Dynamic tectonic rifts snap directly under your coordinates! Spikes burst forth, inflicting -15 HP damage!`;
      
      const px = gameState.playerX;
      const py = gameState.playerY;
      const newTrap: Trap = {
        id: `chaos_spike_crit_${Date.now()}`,
        x: px,
        y: py,
        type: TrapType.Spikes,
        isActive: true,
        triggered: true,
        hidden: false,
        detected: true
      };
      
      chaosStateUpdates = {
        traps: [...gameState.traps, newTrap],
        playerStats: {
          ...gameState.playerStats,
          hp: Math.max(5, gameState.playerStats.hp - 15)
        }
      };
      chaosEffectSpawn = { x: px, y: py, text: "💥 Rupture!", type: 'dmg' };

    } else if (roll === 2) {
      effName = "Poison Spore Seepage";
      effDesc = "Toxic spore pods explode in the vicinity. Inflicts -12 HP damage and spawns an active hazard.";
      effType = 'bad';
      const spot = findWalkableSpotNearPlayer(gameState, 1, 3);
      let nextTraps = [...gameState.traps];
      if (spot) {
        nextTraps.push({
          id: `chaos_spore_vent_${Date.now()}`,
          x: spot.x,
          y: spot.y,
          type: TrapType.FireVent,
          isActive: true,
          triggered: false,
          hidden: false,
          detected: true
        });
      }
      logText = `⚠️ CHAOS SURGE (Roll 2): Ruptured toxic spore vents spray toxic fumes! Inflicted -12 HP damage and activated a volatile vent trap nearby!`;
      chaosStateUpdates = {
        traps: nextTraps,
        playerStats: {
          ...gameState.playerStats,
          hp: Math.max(5, gameState.playerStats.hp - 12)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🤢 Poison Gas!", type: 'dmg' };

    } else if (roll === 3) {
      effName = "Corrosive Acid Fog";
      effDesc = "Corrosive fog dissolves equipment. Weapons and equipped armor decay by -20 durability!";
      effType = 'bad';
      let updatedWeapon = gameState.currentWeapon ? { ...gameState.currentWeapon } : null;
      if (updatedWeapon && updatedWeapon.durability !== undefined) {
        updatedWeapon.durability = Math.max(0, updatedWeapon.durability - 20);
      }
      let updatedArmor = gameState.equippedArmor ? { ...gameState.equippedArmor } : null;
      if (updatedArmor && updatedArmor.durability !== undefined) {
        updatedArmor.durability = Math.max(0, updatedArmor.durability - 20);
      }
      let updatedShield = gameState.equippedShield ? { ...gameState.equippedShield } : null;
      if (updatedShield && updatedShield.durability !== undefined) {
        updatedShield.durability = Math.max(0, updatedShield.durability - 20);
      }
      let extraDmg = 0;
      if (!updatedWeapon || (updatedWeapon.durability ?? 0) <= 0) extraDmg += 5;
      if (!updatedArmor || (updatedArmor.durability ?? 0) <= 0) extraDmg += 5;

      logText = `⚠️ CHAOS SURGE (Roll 3): Heavy acid mist rolls through. Current weapon and armor decayed by -20 durability! Raw corrosion dealed -${extraDmg} HP direct damage.`;
      chaosStateUpdates = {
        currentWeapon: updatedWeapon,
        equippedArmor: updatedArmor,
        equippedShield: updatedShield,
        playerStats: {
          ...gameState.playerStats,
          hp: Math.max(5, gameState.playerStats.hp - extraDmg)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🧪 Acid Decay!", type: 'dmg' };

    } else if (roll === 4) {
      effName = "Void-Static Ambush";
      effDesc = "An unstable static discharge drains -15 Focus (MP) and summons a Void Rat.";
      effType = 'bad';
      const spot = findWalkableSpotNearPlayer(gameState, 2, 4);
      if (spot) {
        const voidRat: Enemy = {
          id: `chaos_void_rat_${Date.now()}`,
          x: spot.x,
          y: spot.y,
          type: EnemyType.Rat,
          name: 'Void-Crazed Static Rat',
          hp: Math.round(15 * (1 + gameState.playerStats.level * 0.12)),
          maxHp: Math.round(15 * (1 + gameState.playerStats.level * 0.12)),
          atk: 3,
          def: 1,
          range: 1,
          speed: 1,
          color: '#a855f7',
          char: 'r',
          state: EnemyState.Chasing,
          isElite: true,
          eliteEffect: 'Void Static (Drains MP on strike)',
          patrolPath: [],
          patrolIndex: 0,
          debuffs: []
        };
        const direction = getDirectionString(gameState.playerX, gameState.playerY, spot.x, spot.y);
        logText = `⚠️ CHAOS SURGE (Roll 4): Static discharge drains -15 Focus (MP) and conjures a Void-Crazed Static Rat to the [${direction.toUpperCase()}]!`;
        chaosStateUpdates = {
          enemies: [...gameState.enemies, voidRat],
          playerStats: {
            ...gameState.playerStats,
            mp: Math.max(0, gameState.playerStats.mp - 15)
          }
        };
        chaosEffectSpawn = { x: spot.x, y: spot.y, text: "👾 Void Portal!", type: 'dmg' };
      } else {
        logText = `⚠️ CHAOS SURGE (Roll 4): Void static sweeps the chamber, draining -15 Focus (MP)!`;
        chaosStateUpdates = {
          playerStats: {
            ...gameState.playerStats,
            mp: Math.max(0, gameState.playerStats.mp - 15)
          }
        };
      }

    } else if (roll === 5) {
      effName = "Sunder Thief Raid";
      effDesc = "Sunder outlaws pickpocket your coinpurse. Drains up to -30 Gold directly!";
      effType = 'bad';
      const stolenGold = Math.min(30, gameState.playerStats.gold);
      const remainder = 30 - stolenGold;
      const hpPenalty = remainder > 0 ? Math.round(remainder * 0.3) : 0;
      logText = `⚠️ CHAOS SURGE (Roll 5): Phantom bandits steal -${stolenGold} Gold from your pouch! You take -${hpPenalty} physical stress damage.`;
      chaosStateUpdates = {
        playerStats: {
          ...gameState.playerStats,
          gold: Math.max(0, gameState.playerStats.gold - 30),
          hp: Math.max(5, gameState.playerStats.hp - hpPenalty)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "💸 Stolen!", type: 'dmg' };

    } else if (roll === 6) {
      effName = "Unstable Magic Bleed";
      effDesc = "Atmospheric friction backfires on your spell cells. Drains -25 Focus (MP)!";
      effType = 'bad';
      logText = `⚠️ CHAOS SURGE (Roll 6): Magical feedback backfires in your core cells, burning away -25 Focus (MP)!`;
      chaosStateUpdates = {
        playerStats: {
          ...gameState.playerStats,
          mp: Math.max(0, gameState.playerStats.mp - 25)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "⚡ MP Burn!", type: 'dmg' };

    } else if (roll === 7) {
      effName = "Frostbite Chill";
      effDesc = "A localized freezing wind drains your stamina. -10 HP and -10 Focus (MP) damage.";
      effType = 'bad';
      logText = `⚠️ CHAOS SURGE (Roll 7): Absolute zero cold drafts freeze your joints! Drained -10 HP and -10 Focus (MP) simultaneously.`;
      chaosStateUpdates = {
        playerStats: {
          ...gameState.playerStats,
          hp: Math.max(5, gameState.playerStats.hp - 10),
          mp: Math.max(0, gameState.playerStats.mp - 10)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "❄️ Chill!", type: 'dmg' };

    } else if (roll === 8) {
      effName = "Tectonic Trap Shift";
      effDesc = "Vibrations in the ground move tectonic rifts, spawning 2 volatile active hazard traps nearby!";
      effType = 'neutral';
      const spots = [
        findWalkableSpotNearPlayer(gameState, 1, 3),
        findWalkableSpotNearPlayer(gameState, 2, 4)
      ];
      let nextTraps = [...gameState.traps];
      spots.forEach((spot, i) => {
        if (spot) {
          nextTraps.push({
            id: `chaos_shift_trap_${Date.now()}_${i}`,
            x: spot.x,
            y: spot.y,
            type: i % 2 === 0 ? TrapType.Spikes : TrapType.FireVent,
            isActive: true,
            triggered: false,
            hidden: false,
            detected: true
          });
        }
      });
      logText = `⚡ CHAOS SURGE (Roll 8): Tectonic stress shifts the ground beneath! Activated 2 volatile hazard traps adjacent to your position!`;
      chaosStateUpdates = { traps: nextTraps };
      const representativeSpot = spots[0] || { x: gameState.playerX, y: gameState.playerY };
      chaosEffectSpawn = { x: representativeSpot.x, y: representativeSpot.y, text: "⚠️ Traps!", type: 'dmg' };

    } else if (roll === 9) {
      effName = "Prismatic Monster Mutation";
      effDesc = "Aetheric feedback triggers genetic advancement. Mutates an active monster to an Elite form!";
      effType = 'neutral';
      const mutateTargetIdx = gameState.enemies.findIndex(e => !e.isBoss && !e.isElite && !e.isFollower && !e.isTownGuard && e.hp > 0);
      if (mutateTargetIdx !== -1) {
        const nextEnemies = [...gameState.enemies];
        const original = nextEnemies[mutateTargetIdx];
        const mutated: Enemy = {
          ...original,
          isElite: true,
          name: `Prismatic Mutant ${original.name}`,
          hp: Math.round(original.hp * 1.5),
          maxHp: Math.round(original.maxHp * 1.5),
          atk: original.atk + 3,
          def: original.def + 1,
          color: '#ec4899',
          char: '★',
          eliteEffect: 'Chaotic Regeneration (+2 HP/turn)'
        };
        nextEnemies[mutateTargetIdx] = mutated;
        logText = `⚡ CHAOS SURGE (Roll 9): Magical aether overflows! Mutant energy surges through ${original.name}, advancing it to an elite Star-marked form (+50% HP, +3 ATK)!`;
        chaosStateUpdates = { enemies: nextEnemies };
        chaosEffectSpawn = { x: original.x, y: original.y, text: "⚡ Mutated!", type: 'dmg' };
      } else {
        const spot = findWalkableSpotNearPlayer(gameState, 2, 4);
        if (spot) {
          const newTrap: Trap = {
            id: `chaos_fire_trap_${Date.now()}`,
            x: spot.x,
            y: spot.y,
            type: TrapType.FireVent,
            isActive: true,
            triggered: false,
            hidden: false,
            detected: true
          };
          logText = `🔥 CHAOS SURGE (Roll 9): No targets to mutate. Tectonic vents split open instead, spawning an active FireVent trap adjacent to your coordinates!`;
          chaosStateUpdates = { traps: [...gameState.traps, newTrap] };
          chaosEffectSpawn = { x: spot.x, y: spot.y, text: "🔥 Vent!", type: 'dmg' };
        } else {
          logText = `⚡ CHAOS SURGE (Roll 9): Atmospheric static crackles harmlessly in empty halls.`;
        }
      }

    } else if (roll === 10) {
      effName = "Unstable Volatile Catalyst";
      effDesc = "A crystal catalyst reacts violently. Explodes for -6 HP, but drops raw wood/iron residue in your pack!";
      effType = 'neutral';
      const nextMats = { ...gameState.inventoryMaterials };
      nextMats['mat_wood'] = (nextMats['mat_wood'] || 0) + 2;
      nextMats['mat_iron'] = (nextMats['mat_iron'] || 0) + 1;
      logText = `⚡ CHAOS SURGE (Roll 10): An unstable crystal catalyst detonates! Dealed -6 HP damage, but molecular fallout added +2 Wood and +1 Iron to your pack!`;
      chaosStateUpdates = {
        inventoryMaterials: nextMats,
        playerStats: {
          ...gameState.playerStats,
          hp: Math.max(5, gameState.playerStats.hp - 6)
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "💥 Residue!", type: 'dmg' };

    } else if (roll >= 11 && roll <= 12) {
      effName = "Alchemical Condensation";
      effDesc = "Pure elements condense directly into a rare Catalyst.";
      effType = 'good';
      
      const catalysts = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
      const chosen = catalysts[Math.floor(Math.random() * catalysts.length)];
      const nextCats = { ...gameState.inventoryCatalysts };
      nextCats[chosen] = (nextCats[chosen] || 0) + 1;
      
      const label = chosen.replace('cat_', '').toUpperCase();
      logText = `🔮 CHAOS SURGE (Roll ${roll}): Rare elements condense out of thin air. Gained 1x ${label} Catalyst in your pack!`;
      
      chaosStateUpdates = { inventoryCatalysts: nextCats };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: `✨ +1 ${label}!`, type: 'loot' };

    } else if (roll === 13) {
      effName = "Mielikki's Forage";
      effDesc = "Sweet berries grow. Adds +3 Wild Berries and +1 Bread to your pack.";
      effType = 'good';
      const nextMats = { ...gameState.inventoryMaterials };
      nextMats['mat_berry'] = (nextMats['mat_berry'] || 0) + 3;
      nextMats['mat_bread'] = (nextMats['mat_bread'] || 0) + 1;
      logText = `✨ CHAOS SURGE (Roll 13): Woodland elements condense. Added +3 Wild Berries and +1 Bread to your food inventory!`;
      chaosStateUpdates = { inventoryMaterials: nextMats };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🍓 +3 Berries!", type: 'loot' };

    } else if (roll === 14) {
      effName = "Gilded Spark";
      effDesc = "Atmospheric copper coins fuse together. Grants +45 Gold directly.";
      effType = 'good';
      logText = `✨ CHAOS SURGE (Roll 14): Flashing aurum particles fuse! Added +45 Gold to your inventory.`;
      chaosStateUpdates = {
        playerStats: {
          ...gameState.playerStats,
          gold: gameState.playerStats.gold + 45
        }
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🪙 +45 Gold!", type: 'loot' };

    } else if (roll === 15) {
      effName = "Abyssal Treasure Shard";
      effDesc = "A localized spatial rift spawns wood and iron. Adds +2 Wood and +2 Iron to your materials.";
      effType = 'good';
      const nextMats = { ...gameState.inventoryMaterials };
      nextMats['mat_wood'] = (nextMats['mat_wood'] || 0) + 2;
      nextMats['mat_iron'] = (nextMats['mat_iron'] || 0) + 2;
      logText = `✨ CHAOS SURGE (Roll 15): A minor spatial rift deposits crafting supplies. Gained +2 Wood and +2 Iron!`;
      chaosStateUpdates = { inventoryMaterials: nextMats };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "📦 +4 Mats!", type: 'loot' };

    } else if (roll === 16) {
      effName = "Locksmith's Blessing";
      effDesc = "Aetheric particles solidify into lockpicks. Adds +2 Lockpicks to your inventory.";
      effType = 'good';
      const nextMats = { ...gameState.inventoryMaterials };
      nextMats['mat_lockpick'] = (nextMats['mat_lockpick'] || 0) + 2;
      logText = `✨ CHAOS SURGE (Roll 16): Metallic static aligns into functional shapes. Gained +2 Lockpicks in your storage pack!`;
      chaosStateUpdates = { inventoryMaterials: nextMats };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🔑 +2 Lockpicks!", type: 'loot' };

    } else if (roll === 17) {
      effName = "Harmonic Abyssal Restoration";
      effDesc = "Heals +25 HP, restores +15 Mana, and disperses surrounding map fog.";
      effType = 'good';
      
      const nextHp = Math.min(gameState.playerStats.maxHp, gameState.playerStats.hp + 25);
      const nextMp = Math.min(gameState.playerStats.maxMp, gameState.playerStats.mp + 15);
      
      const nextDiscovered = gameState.discovered.map(row => [...row]);
      const px = gameState.playerX;
      const py = gameState.playerY;
      const r = 5;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = px + dx;
          const ty = py + dy;
          if (tx >= 0 && tx < gameState.levelWidth && ty >= 0 && ty < gameState.levelHeight) {
            if (nextDiscovered[ty]) {
              nextDiscovered[ty][tx] = true;
            }
          }
        }
      }

      logText = `✨ CHAOS SURGE (Roll 17): Peaceful dynamic waves wash over you. Restored +25 HP and +15 Focus, and fully charted nearby terrain!`;
      
      chaosStateUpdates = {
        discovered: nextDiscovered,
        playerStats: {
          ...gameState.playerStats,
          hp: nextHp,
          mp: nextMp
        }
      };
      chaosEffectSpawn = { x: px, y: py, text: "💖 Rejuvenation!", type: 'heal' };

    } else if (roll === 18) {
      effName = "Scout's Clairvoyance";
      effDesc = "A flash of pure light reveals hidden traps and grants +35 Scouting XP.";
      effType = 'good';
      const nextTraps = gameState.traps.map(t => ({ ...t, detected: true }));
      const scoutingXpGain = 35;
      const updatedStats = {
        ...gameState.playerStats,
        scoutingXp: (gameState.playerStats.scoutingXp || 0) + scoutingXpGain
      };
      logText = `✨ CHAOS SURGE (Roll 18): Cosmic foresight floods your awareness. All hidden traps in the level have been detected, and gained +35 Scouting XP!`;
      chaosStateUpdates = {
        traps: nextTraps,
        playerStats: updatedStats
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "👁️ Insight!", type: 'heal' };

    } else if (roll === 19) {
      effName = "Abyssal Forge Blessing";
      effDesc = "Dungeon static aligns with iron molecules, repairing equipped weapon and armor durability by +50!";
      effType = 'good';
      let updatedWeapon = gameState.currentWeapon ? { ...gameState.currentWeapon } : null;
      if (updatedWeapon) {
        const maxD = updatedWeapon.maxDurability ?? 100;
        updatedWeapon.durability = Math.min(maxD, (updatedWeapon.durability ?? 100) + 50);
      }
      let updatedArmor = gameState.equippedArmor ? { ...gameState.equippedArmor } : null;
      if (updatedArmor) {
        const maxD = updatedArmor.maxDurability ?? 100;
        updatedArmor.durability = Math.min(maxD, (updatedArmor.durability ?? 100) + 50);
      }
      let updatedShield = gameState.equippedShield ? { ...gameState.equippedShield } : null;
      if (updatedShield) {
        const maxD = updatedShield.maxDurability ?? 100;
        updatedShield.durability = Math.min(maxD, (updatedShield.durability ?? 100) + 50);
      }
      logText = `✨ CHAOS SURGE (Roll 19): Tectonic forge light shines upon you. Repaired +50 durability on your equipped weapon, armor, and shield!`;
      chaosStateUpdates = {
        currentWeapon: updatedWeapon,
        equippedArmor: updatedArmor,
        equippedShield: updatedShield
      };
      chaosEffectSpawn = { x: gameState.playerX, y: gameState.playerY, text: "🔧 Repaired!", type: 'heal' };

    } else {
      effName = "Cosmic Perfect Alignment";
      effDesc = "Full HP & MP restored, +100 Gold awarded, and a Glazed Boar spawned.";
      effType = 'good';
      
      const px = gameState.playerX;
      const py = gameState.playerY;
      const nextHp = gameState.playerStats.maxHp;
      const nextMp = gameState.playerStats.maxMp;
      const nextGold = gameState.playerStats.gold + 100;
      
      let nextEnemies = [...gameState.enemies];
      const spot = findWalkableSpotNearPlayer(gameState, 1, 3);
      let boarTxt = "";
      if (spot) {
        const honeyBoar: Enemy = {
          id: `chaos_perfect_boar_${Date.now()}`,
          x: spot.x,
          y: spot.y,
          type: EnemyType.LootGoblin,
          name: "Mielikki's Glazed Boar",
          hp: 30,
          maxHp: 30,
          atk: 0,
          def: 1,
          range: 1,
          speed: 1,
          color: '#f59e0b',
          char: '🐗',
          state: EnemyState.Patrolling,
          isElite: true,
          eliteEffect: "Honey-Glazed (Drops prime roasts & fish)",
          patrolPath: [],
          patrolIndex: 0,
          debuffs: []
        };
        nextEnemies.push(honeyBoar);
        const direction = getDirectionString(px, py, spot.x, spot.y);
        boarTxt = ` alongside a succulent Honey-Glazed Boar spawned to the [${direction.toUpperCase()}]!`;
      }

      logText = `☄️ CHAOS SURGE (Roll 20 - PERFECT HARMONY): The cosmic matrix reaches absolute focus! Fully restored HP and MP, and added +100 Gold${boarTxt}!`;
      
      chaosStateUpdates = {
        enemies: nextEnemies,
        playerStats: {
          ...gameState.playerStats,
          hp: nextHp,
          mp: nextMp,
          gold: nextGold
        }
      };
      chaosEffectSpawn = { x: px, y: py, text: "☄️ Cosmic Harmony!", type: 'heal' };
    }

    updatedGM.lastChaosEffectName = effName;
    updatedGM.lastChaosEffectDesc = effDesc;
    if (!updatedGM.chaosHistory) updatedGM.chaosHistory = [];
    updatedGM.chaosHistory.unshift({ turn, roll, name: effName, type: effType });
    if (updatedGM.chaosHistory.length > 5) updatedGM.chaosHistory.pop();

    chaosLogMessage = {
      id: `chaos_surge_${Date.now()}`,
      text: logText,
      type: effType === 'good' ? 'loot' : effType === 'bad' ? 'danger' : 'info',
      timestamp: 'CHAOS'
    };
  }

  // Evaluate interventions
  // GMs intervene when sufficiently bored or tension matches requirement, and cooldown is met.
  // Dynamic, situation-aware cooldown limits are evaluated here for high autonomy responsiveness.
  const turnsSinceIntervention = turn - mem.lastInterventionTurn;
  
  let dynamicCooldownThreshold = 120; // Toned down from 15 to 120 for peaceful normal play
  const bossesExist = gameState.enemies.some(e => e.isBoss && e.hp > 0);
  if (bossesExist) {
    dynamicCooldownThreshold = 40; // Toned down from 5 to 40
  } else if (hpRatio < 0.25) {
    dynamicCooldownThreshold = 45; // Toned down from 7 to 45
  }

  const isCooledDown = turnsSinceIntervention > dynamicCooldownThreshold;
  let forcedImmediateEncounterId: string | null = null;
  let forceImmediateTrigger = false;

  // Let the autonomous GM monitor situation every turn and instantly override wait times for amazing story arcs!
  if (turnsSinceIntervention > 100) { // Toned down from 4 to 100 turns
    // A) Critical life-saving intervention: if HP is extremely low and we're benevolent/intrigued
    if (hpRatio <= 0.15 && Math.random() < 0.50 && ['Benevolent', 'Intrigued', 'Apathetic'].includes(nextPersonality) && !updatedGM.disableGifts) {
      forcedImmediateEncounterId = 'healing_breeze';
      forceImmediateTrigger = true;
    } 
    // B) Idle reaction: if player is idle for extremely long
    else if (mem.idleTurns >= 25 && ['Sadistic', 'Mischievous', 'Intrigued'].includes(nextPersonality)) {
      forcedImmediateEncounterId = Math.random() > 0.5 ? 'void_ambush' : 'trap_shower';
      forceImmediateTrigger = true;
    }
    // C) Magical backup: if player spends all mana
    if (gameState.playerStats.mp === 0 && gameState.playerStats.maxMp >= 30 && Math.random() < 0.15 && !updatedGM.disableGifts) {
      forcedImmediateEncounterId = 'arcane_torrent';
      forceImmediateTrigger = true;
    }
  }

  let chosenEncounter: typeof GM_ENCOUNTERS_DATABASE[0] | undefined;

  // If a chaos surge already triggered, bypass normal random interventions to avoid chaotic overlap, unless there is an emergency force trigger!
  if (forceImmediateTrigger && forcedImmediateEncounterId) {
    chosenEncounter = GM_ENCOUNTERS_DATABASE.find(enc => enc.id === forcedImmediateEncounterId);
  } else if (!didChaosTrigger && isCooledDown && calculatedBoredom >= 95 && Math.random() < 0.005) { // Toned down: boredom >= 95 and chance 0.5% (from 3%)
    // Regular randomized search
    const eligibleEncounters = GM_ENCOUNTERS_DATABASE.filter(enc => {
      if (calculatedBoredom < enc.minBoredom) return false;
      if (enc.requiredMood && !enc.requiredMood.includes(nextPersonality)) return false;
      if (enc.minTension && calculatedTension < enc.minTension) return false;
      if (enc.maxTension && calculatedTension > enc.maxTension) return false;
      return true;
    });

    if (eligibleEncounters.length > 0) {
      chosenEncounter = eligibleEncounters[Math.floor(Math.random() * eligibleEncounters.length)];
    }
  }

  if (chosenEncounter) {
    const result = chosenEncounter.trigger(gameState, updatedGM);

    if (result.success) {
      // Log action
      mem.lastInterventionTurn = turn;
      updatedGM.boredom = Math.max(10, calculatedBoredom - 30); // relieve boredom!
      
      const logPrefix = forceImmediateTrigger ? `Turn ${turn}: EMERGENCY OVERRIDE INTERVENTION: ` : `Turn ${turn}: AUTONOMOUS INTERVENTION: `;
      updatedGM.thoughts.unshift(`${logPrefix}${chosenEncounter.name}`);
      
      const logMsg: GameLogMessage = {
        id: `gm_intervene_${Date.now()}`,
        text: result.logText,
        type: 'danger', // distinct purple color in formatting
        timestamp: 'STORY'
      };

      // Merge state updates
      const finalStateUpdates = {
        ...result.mutatedState,
        ...chaosStateUpdates
      };

      setGMStorytellerState(updatedGM);

      return {
        gmState: updatedGM,
        stateUpdates: finalStateUpdates,
        didIntervene: true,
        logMessage: chaosLogMessage || logMsg,
        effectSpawn: chaosEffectSpawn || result.effectSpawn
      };
    }
  }

  setGMStorytellerState(updatedGM);

  return {
    gmState: updatedGM,
    stateUpdates: chaosStateUpdates,
    didIntervene: didChaosTrigger,
    logMessage: chaosLogMessage,
    effectSpawn: chaosEffectSpawn
  };
}

export function forceGMEncounter(encounterId: string, gameState: GameState) {
  const enc = GM_ENCOUNTERS_DATABASE.find(e => e.id === encounterId);
  if (!enc) {
    return { success: false, logText: "Encounter not found", mutatedState: {}, effectSpawn: undefined };
  }

  const currentGM = getGMStorytellerState();
  const res = enc.trigger(gameState, currentGM);
  if (res.success) {
    const turn = gameState.playerStats.turnsPlayed;
    currentGM.thoughts.unshift(`Turn ${turn}: GM FORCED INTERVENTION: ${enc.name}!`);
    currentGM.boredom = Math.max(10, currentGM.boredom - 25);
    currentGM.memories.lastInterventionTurn = turn;
    setGMStorytellerState(currentGM);
  }
  return res;
}

/**
 * Modifies the Chaos Score in GameState, enforcing 0-100 clamping,
 * creating an explicit GameLogMessage formatted with [CHAOS MATRIX],
 * and returning the updated GameState along with effectSpawn for visual feedback.
 */
export function modifyChaosScore(
  gameState: GameState,
  delta: number,
  reason: string
): {
  nextState: GameState;
  logMessage: GameLogMessage;
  effectSpawn?: { x: number; y: number; text: string; type: 'heal' | 'dmg' | 'loot' };
} {
  const oldScore = gameState.chaosScore ?? 20;
  const newScore = Math.max(0, Math.min(100, oldScore + delta));
  const actualDelta = newScore - oldScore;

  const icon = actualDelta > 0 ? '🔮' : actualDelta < 0 ? '✨' : '⚖️';
  const sign = actualDelta > 0 ? '+' : '';
  const logText = `${icon} [CHAOS MATRIX]: ${oldScore} → ${newScore} (${sign}${actualDelta}) — ${reason}`;

  const nextState: GameState = {
    ...gameState,
    chaosScore: newScore,
  };

  const logMessage: GameLogMessage = {
    id: `chaos_shift_${Date.now()}_${Math.random()}`,
    text: logText,
    type: actualDelta > 0 ? 'danger' : actualDelta < 0 ? 'loot' : 'info',
    timestamp: 'CHAOS'
  };

  const effectSpawn = {
    x: gameState.playerX,
    y: gameState.playerY,
    text: `Chaos ${sign}${actualDelta} (${reason})`,
    type: (actualDelta > 0 ? 'dmg' : 'heal') as 'dmg' | 'heal' | 'loot'
  };

  return { nextState, logMessage, effectSpawn };
}
