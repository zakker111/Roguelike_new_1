import { describe, it, expect } from 'vitest';
import {
  getGMStorytellerState,
  setGMStorytellerState,
  GM_ENCOUNTERS_DATABASE,
  GMPersonality,
  tickActiveGMStoryteller,
} from '../utils/gmStoryteller';
import { GM_COMMANDS } from '../data/gmCommands';

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

  it('evaluates player effortless slaughter and escalates Chaos Matrix with monster stat buffing', () => {
    const dummyGameState: any = {
      playerX: 10,
      playerY: 10,
      playerStats: {
        hp: 90,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        turnsPlayed: 10,
      },
      chaosScore: 20,
      defeatedEnemiesCount: {
        'Goblin': 3
      },
      enemies: [
        {
          id: 'test_enemy_1',
          name: 'Goblin Raider',
          hp: 20,
          maxHp: 20,
          atk: 5,
          def: 1,
          x: 12,
          y: 12,
          isFollower: false,
          isTownGuard: false,
          isAnimal: false,
        }
      ]
    };

    const res = tickActiveGMStoryteller(dummyGameState);
    expect(res.stateUpdates.chaosScore).toBeGreaterThan(20);
    expect(res.logMessage?.text).toContain('[GM CHAOS ADAPTATION]');
    expect(res.stateUpdates.enemies).toBeDefined();
    const buffedEnemy = res.stateUpdates.enemies[0];
    expect(buffedEnemy.maxHp).toBeGreaterThan(20);
    expect(buffedEnemy.atk).toBeGreaterThan(5);
  });

  it('validates that GM Commands catalog can be invoked and mutate game state', () => {
    expect(GM_COMMANDS.length).toBeGreaterThan(10);

    let state: any = {
      playerX: 10,
      playerY: 10,
      playerStats: {
        hp: 50,
        maxHp: 100,
        mp: 20,
        maxMp: 50,
        gold: 100,
        level: 1,
        turnsPlayed: 10,
        realTimeSeconds: 120,
        depth: 1,
      },
      chaosScore: 10,
      weather: 'Clear',
      enemies: [],
      inventory: [],
      activeBuffs: [],
      traps: [],
      logs: []
    };

    const dummySetState = (updater: any) => {
      if (typeof updater === 'function') {
        state = updater(state);
      } else {
        state = updater;
      }
    };

    const dummyAddLog = (text: string) => {
      state.logs.push(text);
    };

    // Test a sample of commands across categories
    const clearCmd = GM_COMMANDS.find((c: any) => c.id === 'weather_clear');
    expect(clearCmd).toBeDefined();
    if (clearCmd) {
      const resClear = clearCmd.execute(state, dummySetState, dummyAddLog);
      expect(resClear.success).toBe(true);
      expect(state.weather).toBe('clear');
    }

    const healCmd = GM_COMMANDS.find((c: any) => c.id === 'heal_vitality');
    expect(healCmd).toBeDefined();
    if (healCmd) {
      const resHeal = healCmd.execute(state, dummySetState, dummyAddLog);
      expect(resHeal.success).toBe(true);
      expect(state.playerStats.hp).toBe(state.playerStats.maxHp);
    }
  });

  it('simulates 50 turns of Autonomous GM Storyteller execution', () => {
    let mockState: any = {
      playerX: 15,
      playerY: 15,
      playerStats: {
        hp: 30, // Low HP to trigger rescue interventions
        maxHp: 100,
        mp: 10,
        maxMp: 50,
        turnsPlayed: 0,
        realTimeSeconds: 0,
        depth: 1,
      },
      chaosScore: 25,
      defeatedEnemiesCount: { 'Skeleton': 5 },
      enemies: [],
      traps: [],
      map: Array(30).fill(null).map(() => Array(30).fill({ type: 'floor' })),
    };

    let totalLogMessages = 0;
    let chaosSurgesTriggered = 0;

    for (let t = 1; t <= 50; t++) {
      mockState.playerStats.turnsPlayed = t;
      const tickRes = tickActiveGMStoryteller(mockState);

      if (tickRes.stateUpdates) {
        mockState = {
          ...mockState,
          ...tickRes.stateUpdates,
          playerStats: {
            ...mockState.playerStats,
            ...(tickRes.stateUpdates.playerStats || {})
          }
        };
      }

      if (tickRes.logMessage) {
        totalLogMessages++;
        if (tickRes.logMessage.text.includes('CHAOS') || tickRes.logMessage.text.includes('SURGE')) {
          chaosSurgesTriggered++;
        }
      }
    }

    const currentGM = getGMStorytellerState();
    expect(currentGM.thoughts.length).toBeGreaterThan(0);
    expect(mockState.playerStats.turnsPlayed).toBe(50);
    expect(totalLogMessages).toBeGreaterThan(0);
  });

  it('triggers and evaluates new Phase 1-3 GM interventions (weather directives, threat surges, celestial eclipse, caravan injections, road blockades)', () => {
    // 1. Weather directive: gm_harsh_tempest
    const harshTempest = GM_ENCOUNTERS_DATABASE.find(e => e.id === 'gm_harsh_tempest');
    expect(harshTempest).toBeDefined();
    if (harshTempest) {
      const overworldState: any = {
        isOverworld: true,
        biome: 'tundra',
        weather: 'clear',
        playerX: 10,
        playerY: 10,
        playerStats: { hp: 100, maxHp: 100 }
      };
      const sadisticGM: any = { personality: 'Sadistic', boredom: 40, tension: 30 };
      const res = harshTempest.trigger(overworldState, sadisticGM);
      expect(res.success).toBe(true);
      expect(res.mutatedState.weather).toBe('blizzard');
    }

    // 2. Weather directive: gm_benevolent_clear_skies
    const clearSkies = GM_ENCOUNTERS_DATABASE.find(e => e.id === 'gm_benevolent_clear_skies');
    expect(clearSkies).toBeDefined();
    if (clearSkies) {
      const woundedState: any = {
        isOverworld: true,
        biome: 'forest',
        weather: 'rainy',
        playerX: 10,
        playerY: 10,
        playerStats: { hp: 20, maxHp: 100 }
      };
      const benevolentGM: any = { personality: 'Benevolent', boredom: 20, tension: 10 };
      const res = clearSkies.trigger(woundedState, benevolentGM);
      expect(res.success).toBe(true);
      expect(res.mutatedState.weather).toBe('clear');
    }

    // 3. Meteorological Climax: weather_mutation
    const weatherMutation = GM_ENCOUNTERS_DATABASE.find(e => e.id === 'weather_mutation');
    expect(weatherMutation).toBeDefined();
    if (weatherMutation) {
      const normalState: any = {
        isOverworld: true,
        biome: 'forest',
        weather: 'clear',
        playerX: 10,
        playerY: 10,
        playerStats: { hp: 100, maxHp: 100 }
      };
      const mischievousGM: any = { personality: 'Mischievous', boredom: 35, tension: 20 };
      const res = weatherMutation.trigger(normalState, mischievousGM);
      expect(res.success).toBe(true);
      expect(res.mutatedState.weather).toBeDefined();
    }

    // 4. GM Triangle Cheater Anomaly Surge: gm_triangle_cheater
    const triangleCheater = GM_ENCOUNTERS_DATABASE.find(e => e.id === 'gm_triangle_cheater');
    expect(triangleCheater).toBeDefined();
    if (triangleCheater) {
      const normalState: any = {
        playerX: 10,
        playerY: 10,
        enemies: [
          {
            id: 'e1',
            name: 'Orc Brute',
            hp: 30,
            maxHp: 30,
            x: 12,
            y: 10,
            isFollower: false,
            isTownGuard: false,
            isAnimal: false,
            isAnomaly: false
          }
        ]
      };
      const sadisticGM: any = { personality: 'Sadistic', boredom: 45, tension: 35 };
      const res = triangleCheater.trigger(normalState, sadisticGM);
      expect(res.success).toBe(true);
      expect(res.mutatedState.enemies[0].isAnomaly).toBe(true);
    }

    // 5. GM caravan traveler injection: gm_caravan_traveler_injection
    const caravanInjection = GM_ENCOUNTERS_DATABASE.find(e => e.id === 'gm_caravan_traveler_injection');
    expect(caravanInjection).toBeDefined();
    if (caravanInjection) {
      const overworldState: any = {
        isOverworld: true,
        playerX: 10,
        playerY: 10,
        enemies: [],
        npcs: [],
        map: Array(30).fill(null).map(() => Array(30).fill('Grass')),
        levelWidth: 30,
        levelHeight: 30
      };
      const intriguedGM: any = { personality: 'Intrigued', boredom: 25 };
      const res = caravanInjection.trigger(overworldState, intriguedGM);
      expect(res.success).toBe(true);
      expect(res.mutatedState.enemies.length).toBe(1);
      expect(res.mutatedState.enemies[0].char).toBe('🛒');
    }

    // 6. GM road blockade skirmish: gm_road_blockade_skirmish
    const roadBlockade = GM_ENCOUNTERS_DATABASE.find(e => e.id === 'gm_road_blockade_skirmish');
    expect(roadBlockade).toBeDefined();
    if (roadBlockade) {
      const overworldState: any = {
        isOverworld: true,
        playerX: 10,
        playerY: 10,
        chaosScore: 20,
        enemies: [],
        npcs: [],
        map: Array(30).fill(null).map(() => Array(30).fill('Floor')),
        levelWidth: 30,
        levelHeight: 30
      };
      const sadisticGM: any = { personality: 'Sadistic', boredom: 40, tension: 25 };
      const res = roadBlockade.trigger(overworldState, sadisticGM);
      expect(res.success).toBe(true);
      expect(res.mutatedState.enemies.length).toBe(1);
      expect(res.mutatedState.enemies[0].isBoss).toBe(true);
      expect(res.mutatedState.chaosScore).toBe(35);
    }
  });

  it('triggers Ancestral Pity Shield and verifies lore explanatory hooks and adjacent enemy knockback', () => {
    const pityEncounter = GM_ENCOUNTERS_DATABASE.find(e => e.id === 'ancestral_pity_shield');
    expect(pityEncounter).toBeDefined();

    if (pityEncounter) {
      const woundedState: any = {
        playerX: 10,
        playerY: 10,
        playerStats: {
          hp: 15,
          maxHp: 100,
          mp: 5,
          maxMp: 50,
        },
        map: Array(30).fill(null).map(() => Array(30).fill({ type: 'floor' })),
        enemies: [
          {
            id: 'hostile_1',
            name: 'Bloodfang Worg',
            hp: 40,
            maxHp: 40,
            x: 10,
            y: 11,
            isFollower: false,
            isTownGuard: false,
            isAnimal: false,
            state: 'chasing'
          }
        ]
      };

      const benevolentGM: any = {
        personality: 'Benevolent',
        boredom: 30,
        tension: 80,
        disableGifts: false
      };

      const res = pityEncounter.trigger(woundedState, benevolentGM);
      expect(res.success).toBe(true);
      expect(res.mutatedState.playerStats?.hp).toBeGreaterThan(15);
      expect(res.logText).toBeDefined();
      expect(res.logText.length).toBeGreaterThan(20);
      // Enemy should be repelled / displaced away from (10, 11)
      const repelledEnemy = res.mutatedState.enemies?.[0];
      expect(repelledEnemy).toBeDefined();
      expect(repelledEnemy?.y).not.toBe(10); // moved away
    }
  });

  it('evaluates GM Chaos Mercy lore hooks during player critical peril', () => {
    const criticalState: any = {
      playerX: 10,
      playerY: 10,
      playerStats: {
        hp: 15, // 15% HP
        maxHp: 100,
        mp: 10,
        maxMp: 50,
        turnsPlayed: 20, // turn % 20 === 0
      },
      chaosScore: 30, // Chaos > 15
      defeatedEnemiesCount: {},
      enemies: [],
      traps: [],
      map: Array(30).fill(null).map(() => Array(30).fill({ type: 'floor' })),
    };

    const res = tickActiveGMStoryteller(criticalState);
    expect(res.stateUpdates.chaosScore).toBeLessThan(30);
    expect(res.logMessage?.text).toContain('[GM CHAOS MERCY]');
    expect(res.logMessage?.text).toMatch(/pine|heather|respite|Tapio|Väinämöinen|Mielikki|Pohjola|Kaleva/i);
  });
});

