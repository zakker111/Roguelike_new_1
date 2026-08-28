/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, NPC, Enemy, Chest } from '../../types';
import { OverworldGenContext } from '../../utils/overworld/types';

export interface TownBuildingCoord {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
