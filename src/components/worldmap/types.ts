export type WorldBiome = 'forest' | 'desert' | 'tundra' | 'swamp' | 'town' | 'mountain' | 'coral_reef' | 'volcanic' | 'glacial';

export type MapPinIcon = 'star' | 'mine' | 'danger' | 'camp' | 'loot' | 'herb' | 'portal' | 'sword' | 'shield' | 'gem' | string;

export interface CustomMapPin {
  id: string;
  chunkX: number;
  chunkY: number;
  label: string;
  icon: MapPinIcon;
  color: string;
  notes?: string;
  createdAtTurn?: number;
}

export interface WorldMapPOI {
  id: string;
  name: string;
  type: 'town' | 'harbor' | 'dungeon' | 'shrine' | 'camp' | 'watchtower' | 'ruin';
  chunkX: number;
  chunkY: number;
  localX?: number;
  localY?: number;
  threatTier?: number;
  description?: string;
  hasWaystone?: boolean;
  isAttunedWaystone?: boolean;
}

export interface TraversalIndex {
  speedPct: number;
  rating: 'Swift' | 'Standard' | 'Arduous' | 'Treacherous';
  ratingColor: string;
  terrainModifier: string;
  hasHighway: boolean;
}

export interface ChunkMapInfo {
  chunkX: number;
  chunkY: number;
  biome: string;
  hasTown: boolean;
  hasDungeon: boolean;
  hasHarbor: boolean;
  isCastleTown?: boolean;
  hasWaystone: boolean;
  isWaystoneAttuned: boolean;
  waystoneId?: string;
  waystoneName?: string;
  isDiscovered: boolean;
  threatTier: number;
  elevation: number;
  moisture: number;
  traversalIndex?: TraversalIndex;
  pois: WorldMapPOI[];
  regionName: string;
  customPins?: CustomMapPin[];
}

export interface WorldMapFilterState {
  showTowns: boolean;
  showDungeons: boolean;
  showShrines: boolean;
  showCaravanRoutes: boolean;
  showWaystones: boolean;
  showCustomPins: boolean;
}

export interface CartographyStats {
  discoveredChunksCount: number;
  attunedWaystonesCount: number;
  totalWaystonesCount: number;
  discoveredTownsCount: number;
  discoveredDungeonsCount: number;
  customPinsCount: number;
  frontierMinX?: number;
  frontierMaxX?: number;
  frontierMinY?: number;
  frontierMaxY?: number;
  totalTilesMapped?: number;
}
