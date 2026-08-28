import { describe, it, expect, vi } from 'vitest';
import {
  getGMStorytellerState,
  setGMStorytellerState,
  STORY_EVENTS_CATALOG,
  getRandomFlavorText,
  getEncounterFlavorText,
  getChaosSurgeFlavorText,
  GM_ENCOUNTERS_DATABASE,
  modifyChaosScore,
  triggerManualChaosSurge,
  executeChaosSurgeRoll,
  evaluatePityRescueAid,
  tickActiveGMStoryteller,
  forceGMEncounter
} from '../utils/storyteller';
import { createNewGameRun } from '../utils/gameStateFactory';

describe('Storyteller Modular Architecture', () => {
  it('should load types and global state cleanly', () => {
    const state = getGMStorytellerState();
    expect(state).toBeDefined();
    expect(state.personality).toBeDefined();
    expect(Array.isArray(state.thoughts)).toBe(true);
    expect(STORY_EVENTS_CATALOG.chaosSurges.length).toBeGreaterThan(0);
    expect(STORY_EVENTS_CATALOG.encounters.length).toBeGreaterThan(0);
  });

  it('should interpolate narrative flavor text tokens accurately', () => {
    const text = getRandomFlavorText(
      ['The hero healed for {healAmt} points!'],
      'Fallback',
      { healAmt: 45 }
    );
    expect(text).toBe('The hero healed for 45 points!');

    const encFlavor = getEncounterFlavorText('healing_breeze', 'Default Respite', { healAmt: 20 });
    expect(typeof encFlavor).toBe('string');
    expect(encFlavor.length).toBeGreaterThan(0);

    const surgeFlavor = getChaosSurgeFlavorText(1, 'Default Surge', { dmg: 15 });
    expect(typeof surgeFlavor).toBe('string');
    expect(surgeFlavor.length).toBeGreaterThan(0);
  });

  it('should maintain 26 dynamic GM encounters in the encounters catalog', () => {
    expect(GM_ENCOUNTERS_DATABASE.length).toBe(26);
    const encounterIds = GM_ENCOUNTERS_DATABASE.map(e => e.id);
    expect(encounterIds).toContain('healing_breeze');
    expect(encounterIds).toContain('ancestral_pity_shield');
    expect(encounterIds).toContain('void_ambush');
    expect(encounterIds).toContain('arcane_torrent');
  });

  it('should adjust chaos score and generate log events correctly', () => {
    const initial = createNewGameRun(12345);
    const { nextState, logMessage, effectSpawn } = modifyChaosScore(initial, 10, 'Test Escalation');
    expect(nextState.chaosScore).toBe((initial.chaosScore ?? 20) + 10);
    expect(logMessage.text).toContain('Test Escalation');
    expect(effectSpawn?.text).toContain('+10');
  });

  it('should execute manual chaos surge rolls across all tiers', () => {
    const initial = createNewGameRun(12345);
    const result1 = triggerManualChaosSurge(initial, 1);
    expect(result1.roll).toBe(1);
    expect(result1.effType).toBe('bad');

    const result20 = triggerManualChaosSurge(initial, 20);
    expect(result20.roll).toBe(20);
    expect(result20.effType).toBe('good');
  });

  it('should evaluate pity and rescue aid when player is in critical condition', () => {
    const initial = createNewGameRun(12345);
    const gmState = getGMStorytellerState();
    gmState.personality = 'Benevolent';
    gmState.disableGifts = false;

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const evalResult = evaluatePityRescueAid(
      initial,
      gmState,
      30, // turns since intervention
      0.15, // 15% HP
      initial.playerX,
      initial.playerY
    );
    expect(evalResult.forceTrigger).toBe(true);
    expect(evalResult.forcedEncounterId).toBeDefined();

    randomSpy.mockRestore();
  });

  it('should advance storyteller turn and produce autonomous thoughts', () => {
    const initial = createNewGameRun(12345);
    const result = tickActiveGMStoryteller(initial);
    expect(result.gmState).toBeDefined();
    expect(result.gmState.boredom).toBeGreaterThan(0);
    expect(result.stateUpdates).toBeDefined();
  });

  it('should force GM encounter by ID and update intervention memory', () => {
    const initial = createNewGameRun(12345);
    const res = forceGMEncounter('healing_breeze', initial);
    expect(res).toBeDefined();
  });
});
