import {
  GameState,
  TileType,
  Enemy,
  Follower,
  NPC
} from '../../../types';

export interface UsePlayerTurnMovementProps {
  isPlaying: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound: (sound: any, options?: any) => void;
  addLogMessage: (text: string, type?: any) => void;
  executeEnemiesTurn: (px: number, py: number) => void;
  setIsGameOver: (gameOver: boolean) => void;
  setShakeTrigger: React.Dispatch<React.SetStateAction<number>>;
  setActiveTab: (tab: any) => void;
  setActiveLockpickingChestIndex: (idx: number | null) => void;
  setIsLockpickingOpen: (open: boolean) => void;
  setUnlawfulGuardTarget: (target: any) => void;
  handleOverworldStairsTransition: (x: number, y: number, dir: 'up' | 'down') => void;
  handleResourceHarvest: (tile: TileType, x: number, y: number, state: GameState) => boolean;
  handleOpenDoor: (x: number, y: number, state: GameState) => void;
  descendToDungeonFirstFloor: () => void;
  advanceToNextDepth: () => void;
  interactWithNpc: (npc: NPC) => void;
  performPlayerAttack: (enemy: Enemy, index: number, pathPoints: any[]) => boolean;
  handleOpenChest: (chestIndex: number, isMimic: boolean) => void;
  hasEquippedTrait: (state: GameState, trait: string) => boolean;
}
