/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CatalystType } from './items';
import type { EquipmentItem } from './items';

export interface Scar {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  severity: 'Minor' | 'Major' | 'Grave' | 'Legendary';
  acquiredTurn: number;
}

export interface PlayerEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  icon: string; // Emoji
  description: string;
  turnsRemaining: number;
  color: string; // HEX color or tailwind name
  statModifiers?: {
    atk?: number;
    def?: number;
    crit?: number;
    lck?: number;
  };
  damagePerTurn?: number;
  healPerTurn?: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  gold: number;
  atk: number;
  def: number;
  depth: number;
  turnsPlayed: number;
  realTimeSeconds: number;
  str: number;
  dex: number;
  int: number;
  cha: number;
  lck: number;
  unspentPoints: number;
  scars?: Scar[];
  exhaustion?: number; // 0 to 100 representing percentage physical exhaustion
  activeEffects?: PlayerEffect[];
  scoutingLevel?: number;
  scoutingXp?: number;
  relics?: string[];
  hasCatLover?: boolean;
}

export enum EnemyState {
  Patrolling = 'Patrolling',
  Chasing = 'Chasing',
  Retreating = 'Retreating',
  Sleeping = 'Sleeping',
}

export enum EnemyType {
  Rat = 'Rat',             // Fast, low HP, scurries
  Goblin = 'Goblin',       // standard melee
  SkeletonMage = 'Mage',   // shoots fireballs from range 4, runs away if close
  OrcBrute = 'Brute',      // heavy melee, high hps and delay
  Trapmaster = 'Trapmaster', // Places traps, lures players towards them, shoots poison darts
  Bandit = 'Bandit',       // Roaming outlaw
  Troll = 'Troll',         // Cave beast
  WildlifeDeer = 'Deer',   // Non-hostile, flees
  WildlifeBoar = 'Boar',   // Neutral/passive, attacks only if hit or just flees
  WildlifeGoat = 'Goat',   // Non-hostile, climbs/flees
  LootGoblin = 'LootGoblin', // Non-aggressive wandering sprite
  Ghost = 'Ghost',           // Spectral, high evasion
  Vampire = 'Vampire',       // Lifesteals, fast
  Slime = 'Slime',           // Splitting or acid pool leaving slime
  Spider = 'Spider',         // Webs/snare shooters
  Necromancer = 'Necromancer', // Summons reinforcements
  DreadKnight = 'DreadKnight', // Heavily armored tank
  Dragon = 'Dragon',           // Mythical dragon: breathing fire, high health, range-based firebreather
  Hiisi = 'Hiisi',             // Finnish mythological forest demon/spirit (melee, curses)
  Nakki = 'Nakki',             // Finnish mythological water spirit (lures, slows)
  Otso = 'Otso',               // Finnish mythological sacred bear boss
  Louhi = 'Louhi',             // Finnish mythological Mistress of Pohjola boss
  IkuTurso = 'IkuTurso',       // Finnish mythological ancient sea kraken boss
  Kalma = 'Kalma',             // Finnish mythological goddess of grave decay and sweet rot
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  type: EnemyType | string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  range: number;
  speed: number; // turns to act (e.g., 1 is normal, 2 is slow/acts every other turn)
  color: string;
  char: string;
  state: EnemyState;
  isElite: boolean;
  eliteEffect?: string;
  patrolPath: { x: number; y: number }[];
  patrolIndex: number;
  debuffs: { type: CatalystType; duration: number; damagePerTurn: number }[];
  isFollower?: boolean; // Follower flag
  followerId?: string; // Links active fighter to state party details
  isTownGuard?: boolean; // Town Guard flag
  isAnimal?: boolean;    // Is harmless overworld animal
  isCaptive?: boolean;   // Captive flag
  isFreed?: boolean;     // Freed flag
  animalType?: 'deer' | 'boar' | 'sheep'; // Type of animal
  isBoss?: boolean;      // Boss flag
  faction?: 'syndicate' | 'vanguard' | 'outlaw' | 'goblin' | 'bandits';
  shift?: 'day' | 'night' | 'sentry'; // Guard duty shift schedule
  barracksBed?: { x: number; y: number; z?: number }; // Target bed tile in barracks
  originalChar?: string; // Original icon character before sleeping
}

export interface NPC {
  id: string;
  name: string;
  role: 'villager' | 'blacksmith' | 'merchant' | 'apothecary' | 'companion_hire' | 'quest_board' | 'harbor_captain' | 'special_cat' | 'merchant_seppo' | 'faction_syndicate' | 'faction_vanguard' | 'traveler_herbalist' | 'traveler_hunter' | 'traveler_pilgrim';
  char: string;
  color: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  workX: number;
  workY: number;
  dialogue: string[];
  scheduleState: 'home' | 'work' | 'leisure';
  isHomeSameAsShop?: boolean;
  isAsleep?: boolean;
  originalChar?: string;
  z?: number;
  homeZ?: number;
  workZ?: number;
}

export interface Follower {
  id: string;
  name: string;
  archetypeId: 'guard' | 'thief' | 'cat' | 'merchant_guard';
  role: string;
  char: string;
  color: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  level: number;
  xp: number;
  xpNext: number;
  mode: 'follow' | 'wait';
  equipment: {
    weapon: EquipmentItem | null;
    armor: EquipmentItem | null;
  };
  inventory: EquipmentItem[];
  injuries: { name: string; durationTurns: number; healable: boolean }[];
  personality: string;
  temperament: string;
}

export interface Corpse {
  id: string;
  x: number;
  y: number;
  char: string;
  name: string;
  color: string;
  type: 'enemy' | 'animal' | 'npc' | 'follower';
  isElite?: boolean;
}

export interface BloodSplatter {
  id: string;
  x: number;
  y: number;
  intensity: number; // 3 down to 1, decays over turns
  color: string;
}
