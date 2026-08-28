import React from 'react';
import { GameState, GameLogMessage } from '../types';
import { useEquipmentCrafting } from './crafting/useEquipmentCrafting';
import { useSurvivalCrafting } from './crafting/useSurvivalCrafting';
import { useUtilityCrafting } from './crafting/useUtilityCrafting';

export interface UseCraftingEngineProps {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: GameLogMessage['type']) => void;
  setActiveTab: (tab: any) => void;
  gameState: GameState;
}

export function useCraftingEngine(props: UseCraftingEngineProps) {
  const equipment = useEquipmentCrafting(props);
  const survival = useSurvivalCrafting(props);
  const utility = useUtilityCrafting(props);

  return {
    ...equipment,
    ...survival,
    ...utility,
  };
}

export * from './crafting';
