import { Dispatch, SetStateAction } from 'react';
import { GameState, Enemy, CraftedWeapon } from '../../types';
import { SanctumRelic } from '../../utils/relics';

export interface UsePlayerAttackParams {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
  selectedSpellId: string;
  interactWithFollower: (followerEnemy: Enemy) => void;
  setUnlawfulGuardTarget: (target: { enemy: Enemy; index: number; pathPoints: any[] } | null) => void;
  setActiveRelicDraft: (draft: SanctumRelic[] | null) => void;
  gameConfig: {
    levelUpBonuses: {
      xpThresholdMultiplier: number;
      maxHp: number;
      maxMp: number;
      def: number;
      atk: number;
      attributePoints: number;
    };
    worldRates?: {
      equipmentDropRateBonusPerLuck?: number;
    };
  };
}
