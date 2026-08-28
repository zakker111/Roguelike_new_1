/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import soundCatalogData from './soundCatalog.json';

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

export const SOUND_CATALOG: SoundMetadata[] = soundCatalogData as SoundMetadata[];
