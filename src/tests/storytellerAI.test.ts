import { describe, it, expect } from 'vitest';
import {
  getGMStorytellerState,
  setGMStorytellerState,
  GM_ENCOUNTERS_DATABASE,
  GMPersonality,
} from '../utils/gmStoryteller';

describe('Phase 6: Storyteller AI Engine Suite', () => {
  it('manages global GM Storyteller state getters and setters', () => {
    const initialState = getGMStorytellerState();
    expect(initialState).toBeDefined();
    expect(initialState.personality).toBeDefined();

    const updatedState = {
      ...initialState,
      personality: 'Mischievous' as GMPersonality,
      boredom: 75,
      tension: 40,
    };
    setGMStorytellerState(updatedState);

    const checkState = getGMStorytellerState();
    expect(checkState.personality).toBe('Mischievous');
    expect(checkState.boredom).toBe(75);
    expect(checkState.tension).toBe(40);
  });

  it('validates GM encounter database integrity and trigger structures', () => {
    expect(GM_ENCOUNTERS_DATABASE.length).toBeGreaterThan(0);
    GM_ENCOUNTERS_DATABASE.forEach((enc) => {
      expect(enc.id).toBeDefined();
      expect(enc.name).toBeDefined();
      expect(enc.minBoredom).toBeGreaterThanOrEqual(0);
      expect(typeof enc.trigger).toBe('function');
    });
  });

  it('evaluates Healing Breeze encounter conditions correctly when gifts are disabled or HP is high', () => {
    const healingEncounter = GM_ENCOUNTERS_DATABASE.find((e) => e.id === 'healing_breeze');
    expect(healingEncounter).toBeDefined();

    if (!healingEncounter) return;

    const dummyGameState: any = {
      playerStats: {
        hp: 100,
        maxHp: 100,
        mp: 20,
        maxMp: 20,
      },
      enemies: [],
    };

    const dummyGMState: any = {
      personality: 'Benevolent',
      boredom: 50,
      tension: 70,
      disableGifts: true,
    };

    // When gifts are disabled, trigger returns success: false
    const resDisabled = healingEncounter.trigger(dummyGameState, dummyGMState);
    expect(resDisabled.success).toBe(false);

    // When gifts enabled but player HP > 45%, trigger returns success: false
    dummyGMState.disableGifts = false;
    const resFullHp = healingEncounter.trigger(dummyGameState, dummyGMState);
    expect(resFullHp.success).toBe(false);

    // When player HP is low (<= 45%), trigger returns success: true and heals player
    dummyGameState.playerStats.hp = 20;
    const resLowHp = healingEncounter.trigger(dummyGameState, dummyGMState);
    expect(resLowHp.success).toBe(true);
    expect(resLowHp.mutatedState.playerStats?.hp).toBeGreaterThan(20);
  });
});
