import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TileType, OverworldChunk, DungeonLevelState, DungeonProp, Corpse, BloodSplatter, NPC, Chest, LootPile } from '../types';

export interface WorldState {
  isOverworld: boolean;
  overworldZ: number;
  currentChunkX: number;
  currentChunkY: number;
  overworldChunks: { [coordString: string]: OverworldChunk };
  levelWidth: number;
  levelHeight: number;
  map: TileType[][];
  discovered: boolean[][];
  visible: boolean[][];
  visitedTiles: { [coordString: string]: boolean };
  gameTime: number;
  gameDurationHours: number;
  biome: 'forest' | 'desert' | 'tundra' | 'swamp' | 'town';
  weather: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  gmAutonomousWeather?: boolean;
  gmWeatherInterval?: number;
  dungeonProps: DungeonProp[];
  dungeonLevels: { [key: string]: DungeonLevelState };
  corpses: Corpse[];
  bloodSplatters: BloodSplatter[];
  npcs: NPC[];
  chests: Chest[];
  lootPiles: LootPile[];
}

export type WorldAction =
  | { type: 'SET_TIME'; payload: { time: number } }
  | { type: 'ADVANCE_TIME'; payload: { minutes: number } }
  | { type: 'SET_WEATHER'; payload: { weather: WorldState['weather'] } }
  | { type: 'SET_BIOME'; payload: { biome: WorldState['biome'] } }
  | { type: 'SET_CHUNK'; payload: { chunkX: number; chunkY: number; chunkData?: OverworldChunk } }
  | { type: 'UPDATE_CHUNK'; payload: { coordKey: string; chunkData: Partial<OverworldChunk> } }
  | { type: 'MARK_VISITED_TILE'; payload: { tileKey: string } }
  | { type: 'ADD_BLOOD_SPLATTER'; payload: BloodSplatter }
  | { type: 'ADD_CORPSE'; payload: Corpse }
  | { type: 'UPDATE_NPCS'; payload: NPC[] }
  | { type: 'SET_WORLD_STATE'; payload: Partial<WorldState> };

export const initialWorldState: WorldState = {
  isOverworld: true,
  overworldZ: 0,
  currentChunkX: 0,
  currentChunkY: 0,
  overworldChunks: {},
  levelWidth: 40,
  levelHeight: 40,
  map: [],
  discovered: [],
  visible: [],
  visitedTiles: {},
  gameTime: 480, // 8:00 AM
  gameDurationHours: 0,
  biome: 'forest',
  weather: 'clear',
  season: 'spring',
  gmAutonomousWeather: true,
  gmWeatherInterval: 120,
  dungeonProps: [],
  dungeonLevels: {},
  corpses: [],
  bloodSplatters: [],
  npcs: [],
  chests: [],
  lootPiles: [],
};

export function worldReducer(state: WorldState, action: WorldAction): WorldState {
  switch (action.type) {
    case 'SET_TIME':
      return { ...state, gameTime: action.payload.time % 1440 };

    case 'ADVANCE_TIME': {
      const nextTime = (state.gameTime + action.payload.minutes) % 1440;
      const addedHours = action.payload.minutes / 60;
      return {
        ...state,
        gameTime: nextTime,
        gameDurationHours: state.gameDurationHours + addedHours,
      };
    }

    case 'SET_WEATHER':
      return { ...state, weather: action.payload.weather };

    case 'SET_BIOME':
      return { ...state, biome: action.payload.biome };

    case 'SET_CHUNK': {
      const { chunkX, chunkY, chunkData } = action.payload;
      const coordKey = `${chunkX},${chunkY}`;
      return {
        ...state,
        currentChunkX: chunkX,
        currentChunkY: chunkY,
        overworldChunks: chunkData
          ? { ...state.overworldChunks, [coordKey]: chunkData }
          : state.overworldChunks,
      };
    }

    case 'UPDATE_CHUNK': {
      const existing = state.overworldChunks[action.payload.coordKey];
      if (!existing) return state;
      return {
        ...state,
        overworldChunks: {
          ...state.overworldChunks,
          [action.payload.coordKey]: { ...existing, ...action.payload.chunkData },
        },
      };
    }

    case 'MARK_VISITED_TILE':
      return {
        ...state,
        visitedTiles: { ...state.visitedTiles, [action.payload.tileKey]: true },
      };

    case 'ADD_BLOOD_SPLATTER':
      return {
        ...state,
        bloodSplatters: [...state.bloodSplatters, action.payload],
      };

    case 'ADD_CORPSE':
      return {
        ...state,
        corpses: [...state.corpses, action.payload],
      };

    case 'UPDATE_NPCS':
      return { ...state, npcs: action.payload };

    case 'SET_WORLD_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

interface WorldContextType {
  state: WorldState;
  dispatch: React.Dispatch<WorldAction>;
}

const WorldContext = createContext<WorldContextType | undefined>(undefined);

export const WorldProvider: React.FC<{ children: ReactNode; initialState?: Partial<WorldState> }> = ({
  children,
  initialState,
}) => {
  const [state, dispatch] = useReducer(worldReducer, {
    ...initialWorldState,
    ...initialState,
  });

  return <WorldContext.Provider value={{ state, dispatch }}>{children}</WorldContext.Provider>;
};

export const useWorldContext = () => {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error('useWorldContext must be used within a WorldProvider');
  }
  return context;
};
