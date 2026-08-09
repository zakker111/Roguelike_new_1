import { TileType, NPC, Enemy, Chest, Trap, WatchtowerState } from '../../types';

export interface OverworldGenContext {
  chunkX: number;
  chunkY: number;
  width: number;
  height: number;
  spawnedCats?: string[];
  spawnedSeppo?: boolean;
  playerStats?: { level: number; str: number; dex: number; int: number; cha: number; lck: number };
  currentWeapon?: { damage: number; name?: string } | null;
  biome: 'forest' | 'desert' | 'tundra' | 'swamp';
  weather: 'clear' | 'rainy' | 'foggy' | 'snowy';
  map: TileType[][];
  npcs: NPC[];
  enemies: Enemy[];
  chests: Chest[];
  traps: Trap[];
  dungeons: { x: number; y: number; id: string; targetDepth: number }[];
  towns: { x: number; y: number; name: string }[];
  watchtower?: WatchtowerState;
  secondFloorMap?: TileType[][];
  secondFloorDiscovered?: boolean[][];
  secondFloorVisible?: boolean[][];
  poisList: any[];
  hasTown: boolean;
  townName: string;
  isPortTown: boolean;
  isCastleTown: boolean;
}
