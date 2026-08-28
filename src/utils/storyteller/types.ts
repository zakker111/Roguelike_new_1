import { GameState } from '../../types';
import storyEventsData from '../../data/storyEvents.json';

export type GMPersonality = 'Mischievous' | 'Sadistic' | 'Benevolent' | 'Intrigued' | 'Apathetic';

export interface StoryEventsCatalog {
  chaosSurges: Array<{
    roll: number;
    effName: string;
    effDesc: string;
    effType: 'good' | 'bad' | 'neutral';
    logText: string;
    spawnText: string;
    flavorPool?: string[];
  }>;
  encounters: Array<{
    id: string;
    name: string;
    description: string;
    requiredMood?: string[];
    minBoredom: number;
    minTension?: number;
    maxTension?: number;
    flavorPool?: string[];
  }>;
  narrativePrompts: Record<GMPersonality, string>;
}

export const STORY_EVENTS_CATALOG: StoryEventsCatalog = storyEventsData as StoryEventsCatalog;

export interface GMMemory {
  lastPlayerX: number;
  lastPlayerY: number;
  idleTurns: number;
  monstersSlain: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  chestsOpened: number;
  lastInterventionTurn: number;
  lastChaosRollTurn?: number;
}

export interface GMState {
  personality: GMPersonality;
  boredom: number; // 0 to 100
  tension: number; // 0 to 100 (high tension when player is low HP or fighting bosses)
  memories: GMMemory;
  thoughts: string[]; // Recent internally logged thoughts
  disableGifts?: boolean; // Restrict item & resource gifts
  lastChaosRoll?: number;
  lastChaosEffectName?: string;
  lastChaosEffectDesc?: string;
  chaosHistory?: Array<{ turn: number; roll: number; name: string; type: 'good' | 'bad' | 'neutral' }>;
}

export interface GMEncounter {
  id: string;
  name: string;
  description: string;
  requiredMood?: GMPersonality[];
  minBoredom: number;
  minTension?: number;
  maxTension?: number;
  trigger: (
    gameState: GameState,
    gmState: GMState
  ) => {
    success: boolean;
    mutatedState: Partial<GameState>;
    logText: string;
    effectSpawn?: { x: number; y: number; text: string; type: 'heal' | 'dmg' | 'loot' };
  };
}

// Global GM state tracker
let globalGMState: GMState = {
  personality: 'Intrigued',
  boredom: 30,
  tension: 0,
  memories: {
    lastPlayerX: 0,
    lastPlayerY: 0,
    idleTurns: 0,
    monstersSlain: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    chestsOpened: 0,
    lastInterventionTurn: 0,
  },
  thoughts: [
    "Sovereign matrix initialized. Player coords registered. Autonomous GM active and monitoring...",
  ],
  disableGifts: false
};

export function getGMStorytellerState(): GMState {
  if (typeof window !== 'undefined') {
    if (!(window as any).sovereignGMState) {
      (window as any).sovereignGMState = globalGMState;
    }
    return (window as any).sovereignGMState;
  }
  return globalGMState;
}

export function setGMStorytellerState(state: GMState) {
  if (typeof window !== 'undefined') {
    (window as any).sovereignGMState = state;
  }
  globalGMState = state;
}
