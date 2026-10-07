if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
  (globalThis as any).window.addEventListener = () => {};
  (globalThis as any).window.removeEventListener = () => {};
  (globalThis as any).window.dispatchEvent = () => true;
  (globalThis as any).CustomEvent = class CustomEvent { constructor() {} };
}

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AppModalRouter } from '../components/modals/AppModalRouter';
import { createNewGameRun } from '../utils/gameStateFactory';
import { initCustomRegistries } from '../utils/customRegistryInit';

describe('AppModalRouter Component', () => {
  beforeAll(() => {
    initCustomRegistries();
  });
  const baseGameState = createNewGameRun(999);
  const defaultProps = {
    isHelpOpen: false,
    setIsHelpOpen: vi.fn(),
    isGodPanelOpen: false,
    setIsGodPanelOpen: vi.fn(),
    isGmPanelOpen: false,
    setIsGmPanelOpen: vi.fn(),
    isSleepOpen: false,
    setIsSleepOpen: vi.fn(),
    isBestiaryOpen: false,
    setIsBestiaryOpen: vi.fn(),
    isFishingOpen: false,
    setIsFishingOpen: vi.fn(),
    isLockpickingOpen: false,
    setIsLockpickingOpen: vi.fn(),
    activeLockpickingChestIndex: null,
    setActiveLockpickingChestIndex: vi.fn(),
    activePoi: null,
    setActivePoi: vi.fn(),
    activeDrunkNpc: null,
    setActiveDrunkNpc: vi.fn(),
    activeTravelerNpc: null,
    setActiveTravelerNpc: vi.fn(),
    unlawfulGuardTarget: null,
    setUnlawfulGuardTarget: vi.fn(),
    activeRelicDraft: null,
    setActiveRelicDraft: vi.fn(),
    activeRecallScroll: null,
    setActiveRecallScroll: vi.fn(),
    isAutoplayActive: false,
    setIsAutoplayActive: vi.fn(),
    gameState: baseGameState,
    setGameState: vi.fn(),
    addLogMessage: vi.fn(),
    handleRegenerateCurrentLocation: vi.fn(),
    handleConfirmSleep: vi.fn(),
    handleCatchFish: vi.fn(),
    handleFailFish: vi.fn(),
    handleOpenChest: vi.fn(),
    handleConsumeLockpick: vi.fn(),
    handlePoiChoiceSelected: vi.fn(),
    handleDrunkNpcEffects: vi.fn(),
    handleTravelerTrade: vi.fn(),
    handleTravelerAttack: vi.fn(),
    handleAcceptQuest: vi.fn(),
    handleTurnInQuest: vi.fn(),
    handleConfirmUnlawfulAttack: vi.fn(),
    handleRecallTeleport: vi.fn(),
  };

  it('renders without crashing when all modal flags are false', () => {
    const html = renderToString(<AppModalRouter {...defaultProps} />);
    expect(html).toBeDefined();
  });

  it('renders HelpOverlay when isHelpOpen is true', () => {
    const html = renderToString(<AppModalRouter {...defaultProps} isHelpOpen={true} />);
    expect(html).toMatch(/Keyboard Controls|Guide|Help/i);
  });

  it('renders BestiaryOverlay when isBestiaryOpen is true', () => {
    const html = renderToString(<AppModalRouter {...defaultProps} isBestiaryOpen={true} />);
    expect(html).toMatch(/Bestiary/i);
  });

  it('renders SleepOverlay when isSleepOpen is true', () => {
    const html = renderToString(<AppModalRouter {...defaultProps} isSleepOpen={true} />);
    expect(html).toMatch(/Sleep|Rest|Camp/i);
  });

  it('renders GodPanelOverlay when isGodPanelOpen is true', () => {
    const html = renderToString(<AppModalRouter {...defaultProps} isGodPanelOpen={true} />);
    expect(html).toMatch(/Developer|Sovereign|Cheats|God/i);
  });

  it('renders GmPanelOverlay when isGmPanelOpen is true', () => {
    const html = renderToString(<AppModalRouter {...defaultProps} isGmPanelOpen={true} />);
    expect(html).toMatch(/Game Master|Storyteller|Chaos/i);
  });
});
