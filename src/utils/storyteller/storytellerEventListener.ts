/**
 * Reactive Event Bus listener for the AI Game Master Storyteller.
 * Automatically adapts GM tension, boredom, and narrative memories in response
 * to real-time combat, kills, weather, and world events without polling.
 */

import { gameEventBus } from '../../events/core/EventBus';
import { getGMStorytellerState, setGMStorytellerState } from './types';

let isInitialized = false;

export function initStorytellerEventListeners(): () => void {
  if (isInitialized) {
    return () => {};
  }
  isInitialized = true;

  const subKill = gameEventBus.on(
    'combat:kill',
    (payload) => {
      const gm = getGMStorytellerState();
      // Combat action relieves GM boredom
      gm.boredom = Math.max(5, gm.boredom - 4);
      if (payload.isVictimBoss) {
        gm.tension = Math.max(10, gm.tension - 30);
        gm.thoughts.unshift(`GM: Witnessed the epic slaying of ${payload.victimName}!`);
        if (gm.thoughts.length > 20) gm.thoughts.pop();
      }
      setGMStorytellerState(gm);
    },
    { tag: 'storyteller_reactive' }
  );

  const subWeather = gameEventBus.on(
    'weather:changed',
    (payload) => {
      const gm = getGMStorytellerState();
      gm.thoughts.unshift(`GM: Sky shifted from ${payload.previousWeather} to ${payload.newWeather}.`);
      if (gm.thoughts.length > 20) gm.thoughts.pop();
      setGMStorytellerState(gm);
    },
    { tag: 'storyteller_reactive' }
  );

  const subChaos = gameEventBus.on(
    'chaos:surged',
    (payload) => {
      const gm = getGMStorytellerState();
      gm.tension = Math.min(100, gm.tension + 15);
      gm.thoughts.unshift(`GM: Chaos Surge unleashed: ${payload.surgeTitle} (Intensity ${payload.intensity})!`);
      if (gm.thoughts.length > 20) gm.thoughts.pop();
      setGMStorytellerState(gm);
    },
    { tag: 'storyteller_reactive' }
  );

  return () => {
    subKill.unsubscribe();
    subWeather.unsubscribe();
    subChaos.unsubscribe();
    isInitialized = false;
  };
}
