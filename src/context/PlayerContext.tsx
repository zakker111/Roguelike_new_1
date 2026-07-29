import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { PlayerStats, EquipmentItem, CraftedWeapon } from '../types';

export interface PlayerState {
  playerX: number;
  playerY: number;
  playerStats: PlayerStats;
  currentWeapon: CraftedWeapon | null;
  equipmentInventory: EquipmentItem[];
  equippedArmor: EquipmentItem | null;
  equippedHelmet: EquipmentItem | null;
  equippedGloves: EquipmentItem | null;
  equippedBoots: EquipmentItem | null;
  equippedShield: EquipmentItem | null;
  equippedAmulet: EquipmentItem | null;
  inventoryMaterials: { [materialId: string]: number };
  inventoryCatalysts: { [catalystId: string]: number };
}

export type PlayerAction =
  | { type: 'SET_POSITION'; payload: { x: number; y: number } }
  | { type: 'UPDATE_STATS'; payload: Partial<PlayerStats> }
  | { type: 'HEAL'; payload: { amount: number } }
  | { type: 'TAKE_DAMAGE'; payload: { amount: number } }
  | { type: 'EQUIP_ITEM'; payload: { item: EquipmentItem; slot: 'armor' | 'helmet' | 'gloves' | 'boots' | 'shield' | 'amulet' | 'weapon' } }
  | { type: 'UNEQUIP_ITEM'; payload: { slot: 'armor' | 'helmet' | 'gloves' | 'boots' | 'shield' | 'amulet' | 'weapon' } }
  | { type: 'ADD_MATERIAL'; payload: { materialId: string; amount: number } }
  | { type: 'REMOVE_MATERIAL'; payload: { materialId: string; amount: number } }
  | { type: 'ADD_CATALYST'; payload: { catalystId: string; amount: number } }
  | { type: 'ADD_EQUIPMENT'; payload: { item: EquipmentItem } }
  | { type: 'REMOVE_EQUIPMENT'; payload: { itemId: string } }
  | { type: 'SET_PLAYER_STATE'; payload: Partial<PlayerState> };

export const initialPlayerState: PlayerState = {
  playerX: 20,
  playerY: 20,
  playerStats: {
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    gold: 50,
    atk: 10,
    def: 2,
    depth: 0,
    turnsPlayed: 0,
    realTimeSeconds: 0,
    str: 10,
    dex: 10,
    int: 10,
    cha: 10,
    lck: 10,
    unspentPoints: 0,
    scars: [],
    exhaustion: 0,
    activeEffects: [],
  },
  currentWeapon: null,
  equipmentInventory: [],
  equippedArmor: null,
  equippedHelmet: null,
  equippedGloves: null,
  equippedBoots: null,
  equippedShield: null,
  equippedAmulet: null,
  inventoryMaterials: {},
  inventoryCatalysts: {},
};

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_POSITION':
      return { ...state, playerX: action.payload.x, playerY: action.payload.y };

    case 'UPDATE_STATS':
      return {
        ...state,
        playerStats: { ...state.playerStats, ...action.payload },
      };

    case 'HEAL': {
      const newHp = Math.min(state.playerStats.maxHp, state.playerStats.hp + action.payload.amount);
      return {
        ...state,
        playerStats: { ...state.playerStats, hp: newHp },
      };
    }

    case 'TAKE_DAMAGE': {
      const newHp = Math.max(0, state.playerStats.hp - action.payload.amount);
      return {
        ...state,
        playerStats: { ...state.playerStats, hp: newHp },
      };
    }

    case 'EQUIP_ITEM': {
      const { item, slot } = action.payload;
      const keyMap: Record<string, keyof PlayerState> = {
        armor: 'equippedArmor',
        helmet: 'equippedHelmet',
        gloves: 'equippedGloves',
        boots: 'equippedBoots',
        shield: 'equippedShield',
        amulet: 'equippedAmulet',
      };
      const stateKey = keyMap[slot];
      if (!stateKey) return state;
      return {
        ...state,
        [stateKey]: item,
        equipmentInventory: state.equipmentInventory.filter((it) => it.id !== item.id),
      };
    }

    case 'UNEQUIP_ITEM': {
      const { slot } = action.payload;
      const keyMap: Record<string, keyof PlayerState> = {
        armor: 'equippedArmor',
        helmet: 'equippedHelmet',
        gloves: 'equippedGloves',
        boots: 'equippedBoots',
        shield: 'equippedShield',
        amulet: 'equippedAmulet',
      };
      const stateKey = keyMap[slot];
      const unequipped = state[stateKey] as EquipmentItem | null;
      if (!unequipped) return state;
      return {
        ...state,
        [stateKey]: null,
        equipmentInventory: [...state.equipmentInventory, unequipped],
      };
    }

    case 'ADD_MATERIAL': {
      const current = state.inventoryMaterials[action.payload.materialId] || 0;
      return {
        ...state,
        inventoryMaterials: {
          ...state.inventoryMaterials,
          [action.payload.materialId]: current + action.payload.amount,
        },
      };
    }

    case 'REMOVE_MATERIAL': {
      const current = state.inventoryMaterials[action.payload.materialId] || 0;
      const nextVal = Math.max(0, current - action.payload.amount);
      return {
        ...state,
        inventoryMaterials: {
          ...state.inventoryMaterials,
          [action.payload.materialId]: nextVal,
        },
      };
    }

    case 'ADD_CATALYST': {
      const current = state.inventoryCatalysts[action.payload.catalystId] || 0;
      return {
        ...state,
        inventoryCatalysts: {
          ...state.inventoryCatalysts,
          [action.payload.catalystId]: current + action.payload.amount,
        },
      };
    }

    case 'ADD_EQUIPMENT':
      return {
        ...state,
        equipmentInventory: [...state.equipmentInventory, action.payload.item],
      };

    case 'REMOVE_EQUIPMENT':
      return {
        ...state,
        equipmentInventory: state.equipmentInventory.filter((it) => it.id !== action.payload.itemId),
      };

    case 'SET_PLAYER_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

interface PlayerContextType {
  state: PlayerState;
  dispatch: React.Dispatch<PlayerAction>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode; initialState?: Partial<PlayerState> }> = ({
  children,
  initialState,
}) => {
  const [state, dispatch] = useReducer(playerReducer, {
    ...initialPlayerState,
    ...initialState,
  });

  return <PlayerContext.Provider value={{ state, dispatch }}>{children}</PlayerContext.Provider>;
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};
