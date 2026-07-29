import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Enemy, Trap, GameLogMessage } from '../types';

export interface CombatState {
  enemies: Enemy[];
  traps: Trap[];
  logs: GameLogMessage[];
  isBraced: boolean;
  areGuardsHostile: boolean;
}

export type CombatAction =
  | { type: 'SET_ENEMIES'; payload: Enemy[] }
  | { type: 'UPDATE_ENEMY'; payload: { enemyId: string; updates: Partial<Enemy> } }
  | { type: 'REMOVE_ENEMY'; payload: { enemyId: string } }
  | { type: 'ADD_ENEMY'; payload: Enemy }
  | { type: 'SET_TRAPS'; payload: Trap[] }
  | { type: 'ADD_LOG_MESSAGE'; payload: { text: string; type?: GameLogMessage['type'] } }
  | { type: 'CLEAR_LOGS' }
  | { type: 'SET_BRACED'; payload: boolean }
  | { type: 'SET_GUARDS_HOSTILE'; payload: boolean }
  | { type: 'SET_COMBAT_STATE'; payload: Partial<CombatState> };

export const initialCombatState: CombatState = {
  enemies: [],
  traps: [],
  logs: [
    {
      id: 'init-1',
      text: '⚔️ Welcome to Sunder: The Shattered Realm. Explore, craft, fight, and survive.',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
    },
  ],
  isBraced: false,
  areGuardsHostile: false,
};

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  switch (action.type) {
    case 'SET_ENEMIES':
      return { ...state, enemies: action.payload };

    case 'UPDATE_ENEMY':
      return {
        ...state,
        enemies: state.enemies.map((e) =>
          e.id === action.payload.enemyId ? { ...e, ...action.payload.updates } : e
        ),
      };

    case 'REMOVE_ENEMY':
      return {
        ...state,
        enemies: state.enemies.filter((e) => e.id !== action.payload.enemyId),
      };

    case 'ADD_ENEMY':
      return { ...state, enemies: [...state.enemies, action.payload] };

    case 'SET_TRAPS':
      return { ...state, traps: action.payload };

    case 'ADD_LOG_MESSAGE': {
      const newLog: GameLogMessage = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: action.payload.text,
        timestamp: new Date().toLocaleTimeString(),
        type: action.payload.type || 'info',
      };
      return {
        ...state,
        logs: [newLog, ...state.logs.slice(0, 99)], // keep last 100 logs
      };
    }

    case 'CLEAR_LOGS':
      return { ...state, logs: [] };

    case 'SET_BRACED':
      return { ...state, isBraced: action.payload };

    case 'SET_GUARDS_HOSTILE':
      return { ...state, areGuardsHostile: action.payload };

    case 'SET_COMBAT_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

interface CombatContextType {
  state: CombatState;
  dispatch: React.Dispatch<CombatAction>;
  addLogMessage: (text: string, type?: GameLogMessage['type']) => void;
}

const CombatContext = createContext<CombatContextType | undefined>(undefined);

export const CombatProvider: React.FC<{ children: ReactNode; initialState?: Partial<CombatState> }> = ({
  children,
  initialState,
}) => {
  const [state, dispatch] = useReducer(combatReducer, {
    ...initialCombatState,
    ...initialState,
  });

  const addLogMessage = (text: string, type?: GameLogMessage['type']) => {
    dispatch({ type: 'ADD_LOG_MESSAGE', payload: { text, type } });
  };

  return (
    <CombatContext.Provider value={{ state, dispatch, addLogMessage }}>
      {children}
    </CombatContext.Provider>
  );
};

export const useCombatContext = () => {
  const context = useContext(CombatContext);
  if (!context) {
    throw new Error('useCombatContext must be used within a CombatProvider');
  }
  return context;
};
