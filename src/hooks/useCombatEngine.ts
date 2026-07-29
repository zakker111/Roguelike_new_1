import { Dispatch, SetStateAction, MutableRefObject, useCallback } from 'react';
import { GameState } from '../types';

export interface UseCombatEngineParams {
  gameStateRef?: MutableRefObject<GameState>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addLogMessage?: (text: string, type?: string) => void;
  playSound: (soundName: string) => void;
  makeMove: (dx: number, dy: number) => void;
}

export function useCombatEngine({
  setGameState,
  playSound,
  makeMove,
}: UseCombatEngineParams) {

  /**
   * Brace defensively to double block power for the current turn
   */
  const handleBraceDefense = useCallback(() => {
    playSound('shield');
    setGameState((prev) => {
      const nextLogs = [...prev.logs, {
        id: `brace_${Date.now()}`,
        text: "🛡️ You brace defensively! Your block power is doubled for this turn.",
        type: 'system' as const,
        timestamp: 'BRACE'
      }];
      return {
        ...prev,
        isBraced: true,
        logs: nextLogs
      };
    });
    makeMove(0, 0); // Consumes a pass turn
  }, [setGameState, playSound, makeMove]);

  return {
    handleBraceDefense,
  };
}
