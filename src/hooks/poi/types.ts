/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch, SetStateAction } from 'react';
import { GameState, NPC } from '../../types';
import { PoiType } from '../../components/PoiInteractionOverlay';

export interface UsePoiAndWildernessParams {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
  setActiveTab: Dispatch<SetStateAction<'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary' | 'chronicles'>>;
  activeTravelerNpc: NPC | null;
  setActiveTravelerNpc: (npc: NPC | null) => void;
  activePoi: PoiType | null;
  setActivePoi: (poi: PoiType | null) => void;
  setIsSleepOpen: (open: boolean) => void;
  setActiveRelicDraft: (draft: any) => void;
  executeEnemiesTurn: (px: number, py: number) => void;
  gameConfig: {
    levelUpBonuses: {
      xpThresholdMultiplier: number;
      maxHp: number;
      maxMp: number;
      atk: number;
      def: number;
      attributePoints: number;
    };
  };
}

export interface PoiChoiceEffects {
  logText: string;
  hpChange?: number;
  mpChange?: number;
  maxHpChange?: number;
  maxMpChange?: number;
  xpChange?: number;
  goldChange?: number;
  defChange?: number;
  unspentPointsChange?: number;
  reputationChange?: number;
  addMaterials?: { [matId: string]: number };
  addCatalysts?: { [catId: string]: number };
  spawnEffectText?: string;
  spawnEffectType?: 'heal' | 'damage' | 'xp' | 'gold';
  applyBlessed?: boolean;
  applyShielded?: boolean;
}

export interface DrunkNpcEffects {
  logText: string;
  goldChange: number;
  hpChange?: number;
  mpChange?: number;
  addMaterials?: { [matId: string]: number };
  addCatalysts?: { [catId: string]: number };
  spawnEffectText: string;
  spawnEffectType: 'heal' | 'damage' | 'xp' | 'gold' | 'loot';
  buff?: {
    name: string;
    type: 'atk' | 'crit' | 'def' | 'speed';
    atkBonus?: number;
    critBonus?: number;
    defBonus?: number;
    turnsRemaining: number;
  };
}
