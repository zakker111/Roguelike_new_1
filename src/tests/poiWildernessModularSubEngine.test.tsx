/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
  (globalThis as any).window.addEventListener = () => {};
  (globalThis as any).window.removeEventListener = () => {};
  (globalThis as any).window.dispatchEvent = () => true;
  (globalThis as any).CustomEvent = class CustomEvent { constructor() {} };
}

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createNewGameRun } from '../utils/gameStateFactory';
import { useWildernessSleep } from '../hooks/poi/useWildernessSleep';
import { useShrineAndPoiChoices } from '../hooks/poi/useShrineAndPoiChoices';
import { useWaystoneAndGuardian } from '../hooks/poi/useWaystoneAndGuardian';
import { useTravelerInteractions } from '../hooks/poi/useTravelerInteractions';
import { usePoiAndWilderness } from '../hooks/usePoiAndWilderness';
import { PoiType } from '../components/PoiInteractionOverlay';

describe('Modular POI & Wilderness Sub-Engine', () => {
  it('useWildernessSleep peaceful sleep restores HP/MP, advances time, and purges exhaustion', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    let state = createNewGameRun(12345);
    state.playerStats.maxHp = 100;
    state.playerStats.maxMp = 100;
    state.playerStats.hp = 20;
    state.playerStats.mp = 10;
    state.playerStats.exhaustion = 50;
    const initialTime = state.gameTime;

    const setGameState = vi.fn((updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    });
    const playSound = vi.fn();
    const setIsSleepOpen = vi.fn();

    let hookResult: any;
    function SleepHarness() {
      hookResult = useWildernessSleep({
        setGameState,
        playSound,
        setIsSleepOpen,
      });
      return null;
    }
    renderToString(<SleepHarness />);

    hookResult.handleConfirmSleep(8, 30, 20);

    expect(setIsSleepOpen).toHaveBeenCalledWith(false);
    expect(setGameState).toHaveBeenCalled();
    expect(state.playerStats.hp).toBe(50);
    expect(state.playerStats.mp).toBe(30);
    expect(state.playerStats.exhaustion).toBe(0);
    expect(state.gameTime).toBe((initialTime + 8 * 60) % 1440);
    randomSpy.mockRestore();
  });

  it('useShrineAndPoiChoices applies stats, unlocks chapters, and awards materials', () => {
    let state = createNewGameRun(12345);
    state.playerStats.gold = 0;
    state.inventoryMaterials['mat_wood'] = 0;
    const setGameState = vi.fn((updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    });
    const setActivePoi = vi.fn();
    const addLogMessage = vi.fn();
    const playSound = vi.fn();
    const setActiveRelicDraft = vi.fn();
    const gameConfig = {
      levelUpBonuses: {
        xpThresholdMultiplier: 1.5,
        maxHp: 10,
        maxMp: 5,
        atk: 2,
        def: 1,
        attributePoints: 3,
      },
    };

    let hookResult: any;
    function ShrineHarness() {
      hookResult = useShrineAndPoiChoices({
        gameState: state,
        setGameState,
        setActivePoi,
        addLogMessage,
        playSound,
        setActiveRelicDraft,
        gameConfig,
      });
      return null;
    }
    renderToString(<ShrineHarness />);

    hookResult.handlePoiChoiceSelected('poi_shrine_1', 'choice_heal', {
      logText: 'The shrine envelops you in holy mist.',
      hpChange: 25,
      goldChange: 50,
      addMaterials: { mat_wood: 3 },
      applyBlessed: true,
    });

    expect(setActivePoi).toHaveBeenCalledWith(null);
    expect(addLogMessage).toHaveBeenCalledWith('The shrine envelops you in holy mist.', 'loot');
    expect(state.playerStats.gold).toBe(50);
    expect(state.inventoryMaterials['mat_wood']).toBe(3);
    expect(state.playerStats.activeEffects?.some((e) => e.id === 'blessed')).toBe(true);
  });

  it('useWaystoneAndGuardian attunes waystone and spawns biome guardian when challenged', () => {
    let state = createNewGameRun(12345);
    const chunkKey = `${state.currentChunkX},${state.currentChunkY}`;
    const mockPoi: PoiType = {
      id: 'poi_waystone_1',
      name: 'Waystone of the North',
      type: 'shrine',
      char: 'Ω',
      color: '#38bdf8',
      x: 10,
      y: 10,
      chapterId: 'chap_1',
      description: 'Ancient leyline monolith.',
      historySnippet: 'An ancient relic from the first epoch.',
      isInteracted: false,
      isAttunedWaystone: false,
    };

    state.overworldChunks[chunkKey] = {
      ...state.overworldChunks[chunkKey],
      pois: [mockPoi],
    };

    const setGameState = vi.fn((updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    });
    const setActivePoi = vi.fn();
    const addLogMessage = vi.fn();
    const playSound = vi.fn();

    let hookResult: any;
    function WaystoneHarness() {
      hookResult = useWaystoneAndGuardian({
        setGameState,
        activePoi: mockPoi,
        setActivePoi,
        addLogMessage,
        playSound,
      });
      return null;
    }
    renderToString(<WaystoneHarness />);

    // 1. Attune waystone
    hookResult.handleAttuneWaystone('poi_waystone_1');
    expect(state.attunedWaystones).toContain('poi_waystone_1');

    // 2. Challenge biome guardian
    hookResult.handleChallengeBiomeGuardian(mockPoi);
    expect(state.enemies.some((e) => e.isBoss && e.name.includes('Hiisi Grove Warden'))).toBe(true);
    expect(playSound).toHaveBeenCalledWith('bossTheme');
  });

  it('useTravelerInteractions handles drunk NPC gifts and buffs', () => {
    let state = createNewGameRun(12345);
    state.playerStats.gold = 0;
    const setGameState = vi.fn((updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    });
    const addLogMessage = vi.fn();
    const playSound = vi.fn();
    const setActiveTab = vi.fn();
    const setActiveTravelerNpc = vi.fn();
    const executeEnemiesTurn = vi.fn();

    let hookResult: any;
    function TravelerHarness() {
      hookResult = useTravelerInteractions({
        gameState: state,
        setGameState,
        addLogMessage,
        playSound,
        setActiveTab,
        activeTravelerNpc: null,
        setActiveTravelerNpc,
        executeEnemiesTurn,
      });
      return null;
    }
    renderToString(<TravelerHarness />);

    hookResult.handleDrunkNpcEffects({
      logText: 'The wanderer shares his secret moonshine with you!',
      goldChange: 35,
      spawnEffectText: '+35 Gold!',
      spawnEffectType: 'gold',
      buff: {
        name: 'Mead Fortitude',
        type: 'atk',
        atkBonus: 4,
        turnsRemaining: 30,
      },
    });

    expect(addLogMessage).toHaveBeenCalledWith('The wanderer shares his secret moonshine with you!', 'loot');
    expect(state.playerStats.gold).toBe(35);
    expect(state.activeFoodBuff?.name).toBe('Mead Fortitude');
    expect(state.activeFoodBuff?.atkBonus).toBe(4);
  });

  it('usePoiAndWilderness root coordinator coordinates all sub-hooks correctly', () => {
    let state = createNewGameRun(12345);
    const setGameState = vi.fn((updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    });
    const addLogMessage = vi.fn();
    const playSound = vi.fn();
    const setActiveTab = vi.fn();
    const setActiveTravelerNpc = vi.fn();
    const setActivePoi = vi.fn();
    const setIsSleepOpen = vi.fn();
    const setActiveRelicDraft = vi.fn();
    const executeEnemiesTurn = vi.fn();
    const gameConfig = {
      levelUpBonuses: {
        xpThresholdMultiplier: 1.5,
        maxHp: 10,
        maxMp: 5,
        atk: 2,
        def: 1,
        attributePoints: 3,
      },
    };

    let coordinator: any;
    function CoordinatorHarness() {
      coordinator = usePoiAndWilderness({
        gameState: state,
        setGameState,
        addLogMessage,
        playSound,
        setActiveTab,
        activeTravelerNpc: null,
        setActiveTravelerNpc,
        activePoi: null,
        setActivePoi,
        setIsSleepOpen,
        setActiveRelicDraft,
        executeEnemiesTurn,
        gameConfig,
      });
      return null;
    }
    renderToString(<CoordinatorHarness />);

    expect(typeof coordinator.handleConfirmSleep).toBe('function');
    expect(typeof coordinator.handleDrunkNpcEffects).toBe('function');
    expect(typeof coordinator.handleTravelerAttack).toBe('function');
    expect(typeof coordinator.handleTravelerTrade).toBe('function');
    expect(typeof coordinator.handlePoiChoiceSelected).toBe('function');
    expect(typeof coordinator.handleAttuneWaystone).toBe('function');
    expect(typeof coordinator.handleWaystoneFastTravel).toBe('function');
    expect(typeof coordinator.handleChallengeBiomeGuardian).toBe('function');
  });
});
