/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SoundType =
  | 'bump'
  | 'slash'
  | 'spell'
  | 'loot'
  | 'trap'
  | 'levelUp'
  | 'injury'
  | 'hurt'
  | 'defeat'
  | 'victory'
  | 'craft'
  | 'forge'
  | 'mutate'
  | 'lockpick_click'
  | 'lockpick_snap'
  | 'unlock'
  | 'eat'
  | 'drink'
  | 'click'
  | 'deny'
  | 'heal'
  | 'shield'
  | 'footstep'
  | 'wood_footstep'
  | 'stone_footstep'
  | 'grass_step'
  | 'door_open'
  | 'door_close'
  | 'wood_creak'
  | 'clock_tick'
  | 'indoor_entry'
  | 'monster_growl'
  | 'water_drip'
  | 'bird_chirp'
  | 'cricket_chirp'
  | 'owl_hoot'
  | 'heartbeat'
  | 'arrow_fly'
  | 'chest_open'
  | 'boss_roar'
  | 'lightning_strike'
  | 'critical_hit'
  | 'equip'
  | 'tab_click'
  | 'potion_drink'
  | (string & {});

export interface SoundMetadata {
  id: SoundType;
  name: string;
  category: 'combat' | 'movement' | 'environment' | 'crafting' | 'ui';
  description: string;
}

export const SOUND_CATALOG: SoundMetadata[] = [
  // Combat
  { id: 'slash', name: 'Weapon Slash', category: 'combat', description: 'Metallic sword swoop sound' },
  { id: 'bump', name: 'Shield Bump', category: 'combat', description: 'Blunt force shield hit' },
  { id: 'spell', name: 'Arcane Spell', category: 'combat', description: 'Magic spell cast resonant shimmer' },
  { id: 'hurt', name: 'Player Hurt', category: 'combat', description: 'Damage hit reaction' },
  { id: 'critical_hit', name: 'Critical Hit', category: 'combat', description: 'High frequency critical strike chime' },
  { id: 'injury', name: 'Severe Injury', category: 'combat', description: 'Heavy thud injury trigger' },
  { id: 'defeat', name: 'Defeat', category: 'combat', description: 'Descending death chime' },
  { id: 'heal', name: 'Healing Pulse', category: 'combat', description: 'Ascending restorative harmonics' },
  { id: 'shield', name: 'Magical Shield', category: 'combat', description: 'Barrier deflection tone' },
  { id: 'arrow_fly', name: 'Arrow Flight', category: 'combat', description: 'High frequency bow whistle' },
  { id: 'monster_growl', name: 'Monster Growl', category: 'combat', description: 'Low frequency beast guttural growl' },
  { id: 'boss_roar', name: 'Boss Roar', category: 'combat', description: 'Deep reverberating boss roar' },
  { id: 'lightning_strike', name: 'Lightning Bolt', category: 'combat', description: 'Crackling electric discharge' },

  // Movement
  { id: 'footstep', name: 'Dirt Footstep', category: 'movement', description: 'Standard soil step noise' },
  { id: 'stone_footstep', name: 'Stone Footstep', category: 'movement', description: 'Dungeon cobblestone step sound' },
  { id: 'wood_footstep', name: 'Wood Footstep', category: 'movement', description: 'Building interior timber step sound' },
  { id: 'grass_step', name: 'Grass Footstep', category: 'movement', description: 'Wilderness rustling grass step' },

  // Environment
  { id: 'door_open', name: 'Door Latch Open', category: 'environment', description: 'Timber door unlatch sound' },
  { id: 'door_close', name: 'Door Latch Close', category: 'environment', description: 'Thud door latch lock sound' },
  { id: 'wood_creak', name: 'Timber Creak', category: 'environment', description: 'Building floorboard ambient creak' },
  { id: 'clock_tick', name: 'Grandfather Clock', category: 'environment', description: 'Pendulum pendulum tick sound' },
  { id: 'indoor_entry', name: 'Building Transition', category: 'environment', description: 'Indoor atmospheric entry tone' },
  { id: 'water_drip', name: 'Cavern Drip', category: 'environment', description: 'Cavern water droplets sound' },
  { id: 'bird_chirp', name: 'Forest Birds Chirping', category: 'environment', description: 'Melodic outdoor songbird chirping' },
  { id: 'cricket_chirp', name: 'Night Cricket', category: 'environment', description: 'Gentle night cricket chirp' },
  { id: 'owl_hoot', name: 'Midnight Owl', category: 'environment', description: 'Hollow forest owl hoot' },
  { id: 'heartbeat', name: 'Low Health Heartbeat', category: 'environment', description: 'Rhythmic heart thump' },

  // Crafting
  { id: 'craft', name: 'General Craft', category: 'crafting', description: 'Workbench crafting assembly sound' },
  { id: 'forge', name: 'Arcanum Hammer', category: 'crafting', description: 'Blacksmith anvil hammer strike' },
  { id: 'mutate', name: 'Alchemy Mutate', category: 'crafting', description: 'Bubbling cauldron mutation splash' },
  { id: 'lockpick_click', name: 'Lockpick Click', category: 'crafting', description: 'Tumbler pin click sound' },
  { id: 'lockpick_snap', name: 'Lockpick Snap', category: 'crafting', description: 'Pick breakage snap sound' },
  { id: 'unlock', name: 'Lock Unlocked', category: 'crafting', description: 'Chest tumbler click & slide' },
  { id: 'chest_open', name: 'Chest Opening', category: 'crafting', description: 'Heavy treasure lid opening' },

  // UI
  { id: 'click', name: 'UI Click', category: 'ui', description: 'Standard button feedback' },
  { id: 'tab_click', name: 'Tab Switch', category: 'ui', description: 'Navigational tab transition click' },
  { id: 'deny', name: 'Action Denied', category: 'ui', description: 'Invalid action buzz' },
  { id: 'loot', name: 'Loot Pickup', category: 'ui', description: 'Gold chimes & item grab' },
  { id: 'levelUp', name: 'Level Up', category: 'ui', description: 'Triumphant fan fare chime' },
  { id: 'victory', name: 'Expedition Victory', category: 'ui', description: 'Victory fanfare blast' },
  { id: 'eat', name: 'Eat Rations', category: 'ui', description: 'Crunchy food consumption' },
  { id: 'drink', name: 'Drink Water', category: 'ui', description: 'Liquid gulping sound' },
  { id: 'potion_drink', name: 'Potion Gulp', category: 'ui', description: 'Glass vial uncork and drink' },
  { id: 'equip', name: 'Gear Equip', category: 'ui', description: 'Armor strap & sword sheath clank' }
];
