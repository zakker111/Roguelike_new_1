import { useEffect, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { GameState, TileType } from '../types';

export interface UseKeyboardInputParams {
  gameStateRef: MutableRefObject<GameState>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  isPlaying: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  isLockpickingOpen: boolean;
  isFishingOpen: boolean;
  isHelpOpen: boolean;
  setIsHelpOpen: Dispatch<SetStateAction<boolean>>;
  isGodPanelOpen: boolean;
  setIsGodPanelOpen: Dispatch<SetStateAction<boolean>>;
  isGmPanelOpen: boolean;
  setIsGmPanelOpen: Dispatch<SetStateAction<boolean>>;
  isHistoryBookOpen: boolean;
  setIsHistoryBookOpen: Dispatch<SetStateAction<boolean>>;
  isBestiaryOpen: boolean;
  setIsBestiaryOpen: Dispatch<SetStateAction<boolean>>;
  activeTab: 'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary';
  setActiveTab: Dispatch<SetStateAction<'dungeon' | 'forge' | 'chaos' | 'inventory' | 'market' | 'guild' | 'bestiary'>>;
  handleBraceDefense: () => void;
  climbStairsUpToOverworld: () => void;
  climbToPreviousDepth: () => void;
  advanceToNextDepth: () => void;
  descendToDungeonFirstFloor: () => void;
  handleGKeyInteract: () => void;
  makeMove: (dx: number, dy: number) => void;
  addLogMessage: (text: string, type?: string) => void;
}

export function useKeyboardInput({
  gameStateRef,
  setGameState,
  isPlaying,
  isGameOver,
  isVictory,
  isLockpickingOpen,
  isFishingOpen,
  isHelpOpen,
  setIsHelpOpen,
  isGodPanelOpen,
  setIsGodPanelOpen,
  isGmPanelOpen,
  setIsGmPanelOpen,
  isHistoryBookOpen,
  setIsHistoryBookOpen,
  isBestiaryOpen,
  setIsBestiaryOpen,
  activeTab,
  setActiveTab,
  handleBraceDefense,
  climbStairsUpToOverworld,
  climbToPreviousDepth,
  advanceToNextDepth,
  descendToDungeonFirstFloor,
  handleGKeyInteract,
  makeMove,
  addLogMessage,
}: UseKeyboardInputParams) {
  const handleKeyDownRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const handleKeyDownInstance = (e: KeyboardEvent) => {
    // 1. Ignore input if typing in an input, textarea, or contenteditable element
    if (
      document.activeElement &&
      (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.getAttribute('contenteditable') === 'true')
    ) {
      return;
    }

    const key = e.key.toLowerCase();

    // Handle Escape globally to close all modals and panels
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsHelpOpen(false);
      setIsGodPanelOpen(false);
      setIsGmPanelOpen(false);
      setIsHistoryBookOpen(false);
      setIsBestiaryOpen(false);
      setGameState((prev) => ({
        ...prev,
        activeQuestBoardOpen: false,
        activeFollowerIdForInspect: null,
      }));
      return;
    }

    // If game is not playing, or game over, or victory, ignore keyboard inputs
    if (!isPlaying || isGameOver || isVictory) return;

    // If lockpicking or fishing minigame is active, they handle their own key states
    if (isLockpickingOpen || isFishingOpen) return;

    // 2. Shortcut keys to toggle panels (accessible anytime while playing)
    switch (key) {
      case 'f1':
        e.preventDefault();
        setIsHelpOpen((p) => !p);
        return;
      case 'c':
        e.preventDefault();
        setActiveTab('inventory');
        return;
      case 'p':
        e.preventDefault();
        setIsGodPanelOpen((p) => !p);
        return;
      case 'o':
        e.preventDefault();
        setIsGmPanelOpen((p) => !p);
        return;
      case 'h':
        e.preventDefault();
        setIsHistoryBookOpen((p) => !p);
        return;
      case 'v':
      case 'k':
        e.preventDefault();
        setActiveTab((prev) => (prev === 'bestiary' ? 'dungeon' : 'bestiary'));
        return;
    }

    // 3. Prevent movement or interaction commands if ANY overlay panel is open, or if the player is in another tab (Forge, Market, etc.)
    const isAnyOverlayOpen =
      isHelpOpen ||
      isGodPanelOpen ||
      isGmPanelOpen ||
      isHistoryBookOpen ||
      isBestiaryOpen;

    if (isAnyOverlayOpen || activeTab !== 'dungeon') {
      return;
    }

    // Prevent browser default scroll for key inputs on active game screen
    if (
      [
        'arrowup',
        'arrowdown',
        'arrowleft',
        'arrowright',
        ' ',
        'w',
        's',
        'a',
        'd',
        'pageup',
        'pagedown',
        'home',
        'end',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
      ].includes(key)
    ) {
      e.preventDefault();
    }

    const currentGS = gameStateRef.current;

    // Core actions and movement (supporting WASD, Arrows, Top-row Numbers, and Numpad keys with NumLock ON/OFF)
    switch (key) {
      case 'b':
        e.preventDefault();
        handleBraceDefense();
        break;
      case '<':
        e.preventDefault();
        (() => {
          const px = currentGS.playerX;
          const py = currentGS.playerY;
          const currentTile = currentGS.map[py][px];
          if (currentTile === TileType.StairsUp) {
            if (currentGS.playerStats.depth === 1) {
              climbStairsUpToOverworld();
            } else {
              climbToPreviousDepth();
            }
          } else {
            addLogMessage('🪜 You need to stand on Stairs Up (<) to climb out / up.', 'system');
          }
        })();
        break;
      case '>':
        e.preventDefault();
        (() => {
          const px = currentGS.playerX;
          const py = currentGS.playerY;
          const currentTile = currentGS.map[py][px];
          if (currentTile === TileType.StairsDown) {
            advanceToNextDepth();
          } else if (currentTile === TileType.DungeonEntrance) {
            descendToDungeonFirstFloor();
          } else {
            addLogMessage('🪜 You need to stand on Stairs Down (>) or Dungeon Entrance to descend.', 'system');
          }
        })();
        break;
      case 'g':
        e.preventDefault();
        handleGKeyInteract();
        break;

      // Up / Orthogonal North
      case 'arrowup':
      case 'w':
      case '8':
        makeMove(0, -1);
        break;

      // Down / Orthogonal South
      case 'arrowdown':
      case 's':
      case '2':
        makeMove(0, 1);
        break;

      // Left / Orthogonal West
      case 'arrowleft':
      case 'a':
      case '4':
        makeMove(-1, 0);
        break;

      // Right / Orthogonal East
      case 'arrowright':
      case 'd':
      case '6':
        makeMove(1, 0);
        break;

      // Wait / Idle turn
      case ' ':
      case '.':
      case '5':
        makeMove(0, 0);
        break;

      // Up-Left / Diagonal North-West
      case '7':
      case 'home':
        makeMove(-1, -1);
        break;

      // Up-Right / Diagonal North-East
      case '9':
      case 'pageup':
        makeMove(1, -1);
        break;

      // Down-Left / Diagonal South-West
      case '1':
      case 'end':
        makeMove(-1, 1);
        break;

      // Down-Right / Diagonal South-East
      case '3':
      case 'pagedown':
        makeMove(1, 1);
        break;
    }
  };

  handleKeyDownRef.current = handleKeyDownInstance;

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (handleKeyDownRef.current) {
        handleKeyDownRef.current(e);
      }
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, []);
}
