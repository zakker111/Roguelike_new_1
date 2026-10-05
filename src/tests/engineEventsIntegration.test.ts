/**
 * Integration test verifying EventBus and Storyteller reactivity.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { gameEventBus } from '../events/core/EventBus';
import { initStorytellerEventListeners } from '../utils/storyteller/storytellerEventListener';
import { getGMStorytellerState, setGMStorytellerState } from '../utils/storyteller/types';

describe('Engine Event Bus Integration', () => {
  beforeEach(() => {
    gameEventBus.reset();
  });

  it('updates GM Storyteller tension and boredom reactively on kill events', () => {
    const cleanup = initStorytellerEventListeners();

    // Set initial GM state
    const initialGM = getGMStorytellerState();
    initialGM.tension = 50;
    initialGM.boredom = 50;
    initialGM.thoughts = [];
    setGMStorytellerState(initialGM);

    // Emit standard enemy kill
    gameEventBus.emit('combat:kill', {
      killerId: 'player',
      victimId: 'goblin_1',
      victimName: 'Goblin Scout',
      isVictimBoss: false,
      xpAwarded: 20,
      goldAwarded: 5,
    });

    let currentGM = getGMStorytellerState();
    expect(currentGM.boredom).toBeLessThan(50); // Action relieves boredom

    // Emit boss kill
    gameEventBus.emit('combat:kill', {
      killerId: 'player',
      victimId: 'boss_dragon',
      victimName: 'Infernal Wyrm',
      isVictimBoss: true,
      xpAwarded: 500,
      goldAwarded: 250,
    });

    currentGM = getGMStorytellerState();
    expect(currentGM.tension).toBeLessThanOrEqual(20); // Boss victory breaks combat tension
    expect(currentGM.thoughts.some((t) => t.includes('Infernal Wyrm'))).toBe(true);

    cleanup();
  });

  it('reacts to weather and chaos events via event bus', () => {
    const cleanup = initStorytellerEventListeners();

    gameEventBus.emit('weather:changed', {
      previousWeather: 'clear',
      newWeather: 'blizzard',
    });

    let gm = getGMStorytellerState();
    expect(gm.thoughts.some((t) => t.includes('blizzard'))).toBe(true);

    gameEventBus.emit('chaos:surged', {
      previousScore: 20,
      newScore: 45,
      surgeTitle: 'Blood Moon Awakening',
      intensity: 3,
    });

    gm = getGMStorytellerState();
    expect(gm.thoughts.some((t) => t.includes('Blood Moon Awakening'))).toBe(true);

    cleanup();
  });
});
