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
  exp?: number;
  nextLevelXp?: number;
  xpNext?: number;
  gold: number;
  atk: number;
  def: number;
  depth?: number;
  turnsPlayed: number;
  realTimeSeconds?: number;
  str: number;
  dex: number;
  int: number;
  cha: number;
  lck: number;
  unspentPoints?: number;
  enemiesDefeated?: number;
  scars?: Scar[];
  exhaustion?: number; // 0 to 100 representing percentage physical exhaustion
  activeEffects?: PlayerEffect[];
  statuses?: any[];
  statPoints?: number;
  xpToNextLevel?: number;
  scoutingLevel?: number;
  scoutingXp?: number;
  relics?: string[];
  hasCatLover?: boolean;
  isInvincible?: boolean; // God mode / Cheat: prevents all incoming damage from enemies, traps, and hazards
  worldThreatLevel?: number; // Calculated or custom Threat Tier (0 = Normal up to 10 = Eclipse Overlord)
  customThreatBonus?: number; // Player selected Ascension challenge level modifier
}

export enum EnemyState {
  Patrolling = 'Patrolling',
  Chasing = 'Chasing',
  Retreating = 'Retreating',
  Sleeping = 'Sleeping',
  Fleeing = 'Fleeing',
  Surrendered = 'Surrendered',
  Dead = 'Dead',
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
  Wolf = 'Wolf',           // Predator wolf
  Rabbit = 'Rabbit',       // Small prey rabbit/hare
  Bear = 'Bear',           // Apex forest predator
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
  CoralGolem = 'CoralGolem',   // Sunken ruins living reef defender (high def, tide bash)
  AbyssalSiren = 'AbyssalSiren', // Sunken ruins seductive siren (ranged water darts, confusion)
  Tidecaller = 'Tidecaller',   // Sunken ruins aquatic shaman (summons whirlpools & geysers)
  Kraken = 'Kraken',           // Sunken ruins legendary dread kraken apex boss
  MagmaWurm = 'MagmaWurm',     // Volcanic caldera burrowing lava worm (fire spit, burning trail)
  CinderFiend = 'CinderFiend', // Volcanic caldera fast pyro-demon (high crit, flame burst)
  ObsidianBehemoth = 'ObsidianBehemoth', // Volcanic caldera armored titan (earthquake slam)
  IgnisWyrm = 'IgnisWyrm',     // Volcanic caldera legendary molten wyrm apex boss
  CryoStalker = 'CryoStalker', // Glacial ice caverns stealth hunter (leaps, frost slow)
  GlacialColossus = 'GlacialColossus', // Glacial ice caverns massive ice golem (freezing aura)
  FrostbiteSpider = 'FrostbiteSpider', // Glacial ice caverns rime web spinner (snare, chill)
  FrostfangTitan = 'FrostfangTitan', // Glacial ice caverns legendary apex titan boss
}

export type CombatArchetype = 'juggernaut' | 'glass_cannon' | 'skirmisher' | 'boss_apex';

export type EnemyAffix = 
  | 'vampiric'      // 🧛 Restores HP equal to 40% of damage dealt
  | 'shieldbreaker' // ⚡ Ignores 50% armor defense
  | 'venomous'      // ☠️ Applies stackable poison DOT on strike
  | 'thorns'        // 🛡️ Reflects 25% physical damage taken back
  | 'arcane_pulse'  // 🔮 Emits a 2-tile magic shockwave every 3 turns
  | 'berserker'     // 🩸 +50% ATK when HP < 50%
  | 'phasing';      // 👻 25% chance to dodge physical hits

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
  isHostile?: boolean;   // Is hostile to player
  isCaptive?: boolean;   // Captive flag
  isFreed?: boolean;     // Freed flag
  animalType?: 'deer' | 'boar' | 'sheep'; // Type of animal
  isBoss?: boolean;      // Boss flag
  difficultyTier?: 'easy' | 'standard' | 'tough' | 'apex'; // Wilderness/dungeon threat classification
  dropMaterials?: string[];
  dropCatalysts?: string[];
  isAnomaly?: boolean;   // GM Triangle Cheater / Anomaly override flag
  archetype?: CombatArchetype; // Golden Triangle archetype
  archetypeTrait?: string;      // Archetype specific passives/traits
  chaosTier?: number;          // Dynamic Chaos Matrix tier modifier
  isEnraged?: boolean;          // Boss Phase 2 Enrage state override
  affixes?: EnemyAffix[];       // Corrupted long-run / high threat affixes
  armorPenetrationPercent?: number; // Ignores portion of player defense (0.0 to 0.6)
  faction?: 'syndicate' | 'vanguard' | 'outlaw' | 'goblin' | 'bandits' | 'iron_vanguard' | 'shadow_syndicate' | 'outlaw_bandits' | 'orc_clans' | 'undead_scourge' | 'town_guard' | 'wild_beasts' | 'ancient_guardians' | 'unaligned' | string;
  factionRank?: 'grunt' | 'scout' | 'soldier' | 'captain' | 'warlord' | 'shaman' | 'assassin' | 'champion' | 'leader';
  factionId?: string;           // Canonical FactionId reference
  shift?: 'day' | 'night' | 'sentry'; // Guard duty shift schedule
  barracksBed?: { x: number; y: number; z?: number }; // Target bed tile in barracks
  barracksBedX?: number;
  barracksBedY?: number;
  patrolPostX?: number;
  patrolPostY?: number;
  guardTargetX?: number;
  guardTargetY?: number;
  hasSoundedAlarm?: boolean;
  originalChar?: string; // Original icon character before sleeping
  hasAlertedBackup?: boolean; // Flag if wounded enemy has called for reinforcements
  hasWarnedElite?: boolean;   // Companion warning trigger
  z?: number;                 // Level elevation Z index
  telegraphedAttack?: {
    targetX: number;
    targetY: number;
    turnsRemaining: number;
    damage: number;
    name: string;
  } | null;
  staggerMeter?: number;       // Current Stagger/Guard buildup (0 to maxStaggerMeter)
  maxStaggerMeter?: number;   // Max Stagger threshold before stance breaks
  isStaggered?: boolean;      // True if guard/posture is currently shattered (vulnerable)
  staggerTurns?: number;      // Remaining turns of stagger stun
  aiRole?: 'melee' | 'skirmisher_kiting' | 'support_healer' | 'support_buffer' | 'tank' | 'ambusher'; // Advanced behavioral AI archetype
  supportSpellCooldown?: number; // Cooldown turns before support healing/buffing spells can be re-cast
  isPanicked?: boolean;          // Flag when leader falls and squad breaks formation
  panicTurns?: number;           // Remaining turns of panicked retreat
  isSurrendered?: boolean;       // True if low-HP isolated hostile dropped weapons and yielded
  surrenderTurns?: number;       // Turns until hostile cowers or flees peacefully
  droppedMoraleLoot?: boolean;   // Ensures dropped panic/surrender loot spawns only once
  homeCampX?: number;            // Camp origin coordinate for retreat routing
  homeCampY?: number;
  isHighGroundSniper?: boolean;  // Elevated barricade/perch sniper with enhanced range and cover
  packId?: string;               // Faction squad or wildlife pack membership ID
  packLeaderId?: string;         // Explicit pack leader or commander ID
  diet?: 'herbivore' | 'carnivore' | 'omnivore'; // Ecological diet classification
  hungerLevel?: number;          // Predator hunger level (0 to 100)
}

export interface NPC {
  id: string;
  name: string;
  role: 'villager' | 'blacksmith' | 'merchant' | 'apothecary' | 'companion_hire' | 'quest_board' | 'harbor_captain' | 'special_cat' | 'merchant_seppo' | 'faction_syndicate' | 'faction_vanguard' | 'traveler_herbalist' | 'traveler_hunter' | 'traveler_pilgrim' | 'dockworker' | 'harbor_master' | 'sailor' | 'fishmonger' | 'ferried_navigator' | 'drunk_villager' | 'patron' | 'merchant_caravan' | 'traveler_merchant' | 'innkeeper' | 'npc_blacksmith' | 'npc_merchant' | 'npc_apothecary' | 'npc_innkeeper' | string;
  char: string;
  color: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  workX: number;
  workY: number;
  dialogue: string[];
  scheduleState: 'home' | 'work' | 'leisure' | 'campfire';
  factionId?: string;
  factionRank?: string;
  isHomeSameAsShop?: boolean;
  isAsleep?: boolean;
  isSitting?: boolean;
  isDrinking?: boolean;
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
  decayTurns?: number;
}

export interface BloodSplatter {
  id: string;
  x: number;
  y: number;
  intensity: number; // 3 down to 1, decays over turns
  color: string;
}
