/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Enemy, NPC, TileType } from '../../types';

export type RuinedCityTurfZone =
  | 'orc_warcamp'         // Savage Orc Clan stronghold
  | 'bandit_hideout'      // Shadow Bandit hideout & ambush perches
  | 'contested_plaza'     // Central no-man's land where factions skirmish
  | 'collapsed_vault'     // Forgotten treasury with locked iron vault
  | 'forgotten_shrine'    // Overgrown altar of ancient deities
  | 'residential_rubble';  // Collapsed domestic housing and overgrown alleys

export interface RuinedCitySector {
  id: string;
  zone: RuinedCityTurfZone;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  controllingFaction: 'orc_clans' | 'outlaw_bandits' | 'contested' | 'ancient_guardians';
  dangerLevel: number;
}

export interface RuinedCityProp {
  x: number;
  y: number;
  char: string;
  color: string;
  name: string;
  type: 'totem' | 'bonfire' | 'tripwire' | 'vault_door' | 'barricade' | 'chest' | 'shrine' | 'rubble';
  interactive?: boolean;
}

export interface GeneratedRuinedCity {
  chunkX: number;
  chunkY: number;
  name: string;
  tiles: TileType[][];
  enemies: Enemy[];
  npcs: NPC[];
  props: RuinedCityProp[];
  sectors: RuinedCitySector[];
  hasVault: boolean;
  vaultCoord?: { x: number; y: number };
}
