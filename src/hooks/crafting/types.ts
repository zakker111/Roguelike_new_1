import React from "react";
import { GameState, GameLogMessage } from "../../types";

export interface CraftingSubEngineProps {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLogMessage: (text: string, type?: GameLogMessage["type"]) => void;
  setActiveTab: (tab: any) => void;
  gameState: GameState;
}
