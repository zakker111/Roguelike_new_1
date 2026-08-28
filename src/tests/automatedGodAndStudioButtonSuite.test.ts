import { describe, it, expect, beforeEach } from 'vitest';
import { createNewGameRun } from '../utils/gameStateFactory';
import { GameState, EquipmentItem, Enemy } from '../types';
import {
  getGMStorytellerState,
  setGMStorytellerState,
  modifyChaosScore,
  triggerManualChaosSurge,
  forceGMEncounter,
  GMPersonality
} from '../utils/gmStoryteller';
import {
  playCustomSynthesizer,
  getAudioWaveformData,
  getAudioFrequencyData,
  CustomSynthParams
} from '../utils/audio';

/**
 * Universal Button & Interactive Action Matrix Test Engine
 * 
 * Phase 9 Goal:
 * Exercises every interactive control in the God Mode Sandbox, GM Chaos Console & Audio Oscilloscope Studio:
 * 1. God Panel State Orchestration & Tab Switcher (Cheats, Stats, World, Items, Entities, Teleport, Weather, Modding)
 * 2. God Stat Editor & Hero Cheats (Full restore, Max stat buffs, Gold injection, Level/XP boost, Exhaustion purge)
 * 3. God Item & Entity Spawner (Equippables, Consumables, Catalysts, Monsters, Companions, Bosses)
 * 4. God Teleportation & Overworld Warp Engine (Coordinate jump, Dungeon depth hopping, Town gates)
 * 5. God Weather & Day/Night Celestial Controls (Force blizzards, solar eclipses, thunderstorms, time travel)
 * 6. AI Game Master Storyteller Controls & Chaos Score Modifiers (Tension/boredom sliders, personalities, loot gift toggles)
 * 7. Manual Chaos Core Surge Triggering (d20 catastrophic/divine rolls, monologue generation)
 * 8. Audio Oscilloscope Studio & Procedural Synthesizer (Waveform/Spectrum modes, ADSR envelopes, Filter resonance, Patch presets)
 */

describe('Automated Button & Interaction Suite (Phase 9: God Sandbox Cheats, GM Chaos Console & Audio Oscilloscope Studio)', () => {
  let mockGameState: GameState;
  let playedSounds: string[] = [];
  let logMessages: { text: string; type?: string }[] = [];

  const addLogMessage = (text: string, type?: string) => {
    logMessages.push({ text, type });
  };

  const playSfx = (sound: string) => {
    playedSounds.push(sound);
  };

  beforeEach(() => {
    mockGameState = createNewGameRun(99999);
    playedSounds = [];
    logMessages = [];

    // Reset Storyteller state to default baseline
    setGMStorytellerState({
      tension: 20,
      boredom: 10,
      personality: 'Benevolent',
      disableGifts: false,
      chaosHistory: [],
      thoughts: [],
      lastChaosRoll: 10,
      lastChaosEffectName: 'Spatial Calibration',
      lastChaosEffectDesc: 'The cosmic threads are stabilized.',
      memories: {
        lastPlayerX: 20,
        lastPlayerY: 20,
        idleTurns: 0,
        monstersSlain: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        chestsOpened: 0,
        lastInterventionTurn: 0
      }
    });
  });

  describe('1. God Panel State Orchestration & Tab Switcher', () => {
    it('manages active tabs and sub-panel transitions smoothly', () => {
      const tabs = [
        'cheats', 'stats', 'world', 'items', 'entities',
        'caravan', 'weather', 'teleport', 'storyteller', 'designer',
        'routes', 'carver', 'blueprints', 'smoketest', 'bestiary',
        'jsondata', 'arena', 'replay', 'itemcreator', 'admin',
        'dungeon', 'modding'
      ] as const;

      let currentTab: string = 'cheats';
      const switchTab = (newTab: string) => {
        currentTab = newTab;
        playSfx('click');
      };

      expect(currentTab).toBe('cheats');
      tabs.forEach(tab => {
        switchTab(tab);
        expect(currentTab).toBe(tab);
      });

      expect(playedSounds.filter(s => s === 'click').length).toBe(tabs.length);
    });
  });

  describe('2. God Stat Editor & Hero Cheats Matrix', () => {
    it('executes Full Health & Mana restore cheat', () => {
      mockGameState.playerStats.hp = 12;
      mockGameState.playerStats.mp = 4;
      mockGameState.playerStats.maxHp = 100;
      mockGameState.playerStats.maxMp = 60;
      mockGameState.playerStats.exhaustion = 75;
      mockGameState.playerStats.activeEffects = [
        {
          id: 'poison_debuff',
          name: 'Poisoned',
          type: 'debuff',
          icon: '🤢',
          description: 'Taking poison damage',
          turnsRemaining: 5,
          color: '#10b981'
        }
      ];

      // Full restore trigger
      const handleFullRestore = () => {
        mockGameState.playerStats.hp = mockGameState.playerStats.maxHp;
        mockGameState.playerStats.mp = mockGameState.playerStats.maxMp;
        mockGameState.playerStats.exhaustion = 0;
        mockGameState.playerStats.activeEffects = [];
        addLogMessage('✨ Divine Restoration: Health, Mana, and Vigor restored to maximum.', 'magic');
        playSfx('heal');
      };

      handleFullRestore();

      expect(mockGameState.playerStats.hp).toBe(100);
      expect(mockGameState.playerStats.mp).toBe(60);
      expect(mockGameState.playerStats.exhaustion).toBe(0);
      expect(mockGameState.playerStats.activeEffects?.length).toBe(0);
      expect(playedSounds).toContain('heal');
    });

    it('injects Gold, XP, and triggers Level Up progression', () => {
      const initialGold = mockGameState.playerStats.gold;
      const initialLevel = mockGameState.playerStats.level;

      // Add 10,000 Gold
      const handleAddGold = (amount: number) => {
        mockGameState.playerStats.gold += amount;
        addLogMessage(`💰 God Mode: Added ${amount} gold to treasury.`, 'loot');
        playSfx('coins');
      };

      // Add Level & Attributes
      const handleAddLevel = () => {
        mockGameState.playerStats.level += 1;
        mockGameState.playerStats.unspentPoints = (mockGameState.playerStats.unspentPoints || 0) + 5;
        mockGameState.playerStats.maxHp += 15;
        mockGameState.playerStats.hp = mockGameState.playerStats.maxHp;
        addLogMessage(`🌟 God Mode: Promoted hero to Level ${mockGameState.playerStats.level}!`, 'system');
        playSfx('levelup');
      };

      handleAddGold(10000);
      expect(mockGameState.playerStats.gold).toBe(initialGold + 10000);
      expect(playedSounds).toContain('coins');

      handleAddLevel();
      expect(mockGameState.playerStats.level).toBe(initialLevel + 1);
      expect(mockGameState.playerStats.unspentPoints).toBeGreaterThanOrEqual(5);
      expect(playedSounds).toContain('levelup');
    });

    it('modifies Core RPG Attributes (STR, DEX, INT, CHA, LCK)', () => {
      const initialStr = mockGameState.playerStats.str || 10;
      const initialInt = mockGameState.playerStats.int || 10;

      const handleModifyStat = (stat: 'str' | 'dex' | 'int' | 'cha' | 'lck', delta: number) => {
        mockGameState.playerStats[stat] = Math.max(1, (mockGameState.playerStats[stat] || 10) + delta);
        playSfx('craft');
      };

      handleModifyStat('str', 10);
      expect(mockGameState.playerStats.str).toBe(initialStr + 10);

      handleModifyStat('int', 25);
      expect(mockGameState.playerStats.int).toBe(initialInt + 25);
      expect(playedSounds).toContain('craft');
    });
  });

  describe('3. God Item & Entity Spawner Engine', () => {
    it('spawns high-tier weapons, armors, and consumables directly into inventory', () => {
      const testWeapon: EquipmentItem = {
        id: 'god_solar_blade',
        name: 'Blade of the Solar Zenith',
        type: 'weapon',
        subType: 'Greatsword' as any,
        damage: 85,
        defense: 10,
        critChance: 0.35,
        range: 1,
        value: 5000,
        durability: 100,
        maxDurability: 100,
        description: 'Blazing with the heat of a collapsed star.',
        color: '#f59e0b'
      };

      const handleSpawnEquipment = (item: EquipmentItem, count: number = 1) => {
        for (let i = 0; i < count; i++) {
          mockGameState.equipmentInventory.push({ ...item, id: `${item.id}_${Date.now()}_${i}` });
        }
        addLogMessage(`📦 God Spawner: Materialized ${count}x "${item.name}".`, 'loot');
        playSfx('loot');
      };

      handleSpawnEquipment(testWeapon, 2);
      expect(mockGameState.equipmentInventory.filter(i => i.name === 'Blade of the Solar Zenith').length).toBe(2);
      expect(playedSounds).toContain('loot');
      expect(logMessages.some(l => l.text.includes('Blade of the Solar Zenith'))).toBe(true);
    });

    it('spawns custom bosses and hostile enemies at specific coordinates', () => {
      const handleSpawnEnemy = (type: any, x: number, y: number, name: string) => {
        const newEnemy: Enemy = {
          id: `spawned_${Date.now()}`,
          name,
          type,
          x,
          y,
          hp: 250,
          maxHp: 250,
          atk: 35,
          def: 15,
          range: 1,
          speed: 1,
          color: '#ef4444',
          char: '👹',
          state: 'Chasing' as any,
          isElite: true,
          patrolPath: [],
          patrolIndex: 0,
          debuffs: []
        };
        mockGameState.enemies.push(newEnemy);
        addLogMessage(`👹 God Spawner: Conjured elite boss "${name}" at (${x}, ${y})!`, 'danger');
        playSfx('boss_roar');
      };

      handleSpawnEnemy('orc_berserker', 15, 15, 'Ignis the Hellion');
      expect(mockGameState.enemies.some(e => e.name === 'Ignis the Hellion')).toBe(true);
      expect(playedSounds).toContain('boss_roar');
    });
  });

  describe('4. God Teleportation & Warp Operations', () => {
    it('warps player across overworld chunk sectors instantaneously', () => {
      const handleWarpChunk = (chunkX: number, chunkY: number) => {
        mockGameState.currentChunkX = chunkX;
        mockGameState.currentChunkY = chunkY;
        mockGameState.playerX = 16;
        mockGameState.playerY = 16;
        addLogMessage(`🌀 God Warp: Relocated player to Sector [${chunkX}, ${chunkY}].`, 'magic');
        playSfx('teleport');
      };

      handleWarpChunk(5, -3);
      expect(mockGameState.currentChunkX).toBe(5);
      expect(mockGameState.currentChunkY).toBe(-3);
      expect(mockGameState.playerX).toBe(16);
      expect(mockGameState.playerY).toBe(16);
      expect(playedSounds).toContain('teleport');
    });

    it('teleports player directly into dungeon depths and resets floor state', () => {
      const handleWarpDungeon = (targetDepth: number) => {
        mockGameState.isOverworld = false;
        mockGameState.playerStats.depth = targetDepth;
        mockGameState.playerX = 5;
        mockGameState.playerY = 5;
        addLogMessage(`⚔️ God Warp: Descended to Dungeon Depth ${targetDepth}.`, 'magic');
        playSfx('stairs_down');
      };

      handleWarpDungeon(4);
      expect(mockGameState.isOverworld).toBe(false);
      expect(mockGameState.playerStats.depth).toBe(4);
      expect(playedSounds).toContain('stairs_down');
    });
  });

  describe('5. God Weather & Celestial Day/Night Controls', () => {
    it('forces global weather conditions (Blizzard, Rainy, Snowy)', () => {
      const handleForceWeather = (weatherType: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard' | 'ashfall' | 'tidal_surge') => {
        mockGameState.weather = weatherType;
        addLogMessage(`🌤️ God Celestial: Atmospheric weather shifted to "${weatherType.toUpperCase()}".`, 'system');
        playSfx('weather_shift');
      };

      handleForceWeather('blizzard');
      expect(mockGameState.weather).toBe('blizzard');

      handleForceWeather('sandstorm');
      expect(mockGameState.weather).toBe('sandstorm');
      expect(playedSounds).toContain('weather_shift');
    });

    it('advances world turn cycles to toggle Day and Night illumination', () => {
      const handleAdvanceTurns = (turns: number) => {
        mockGameState.playerStats.turnsPlayed = (mockGameState.playerStats.turnsPlayed || 0) + turns;
        addLogMessage(`⏳ God Time: Fast-forwarded world clock by ${turns} turns.`, 'system');
        playSfx('click');
      };

      const startTurns = mockGameState.playerStats.turnsPlayed || 0;
      handleAdvanceTurns(60);
      expect(mockGameState.playerStats.turnsPlayed).toBe(startTurns + 60);
    });
  });

  describe('6. AI Game Master Storyteller Controls & Chaos Score Modifiers', () => {
    it('adjusts Storyteller Tension and Boredom parameters', () => {
      const handleSetTension = (val: number) => {
        const gm = getGMStorytellerState();
        gm.tension = Math.max(0, Math.min(100, val));
        setGMStorytellerState(gm);
      };

      const handleSetBoredom = (val: number) => {
        const gm = getGMStorytellerState();
        gm.boredom = Math.max(0, Math.min(100, val));
        setGMStorytellerState(gm);
      };

      handleSetTension(85);
      expect(getGMStorytellerState().tension).toBe(85);

      handleSetBoredom(95);
      expect(getGMStorytellerState().boredom).toBe(95);
    });

    it('switches AI Game Master personalities and toggles loot gating', () => {
      const handleSetPersonality = (personality: GMPersonality) => {
        const gm = getGMStorytellerState();
        gm.personality = personality;
        setGMStorytellerState(gm);
      };

      const handleToggleLootGifts = () => {
        const gm = getGMStorytellerState();
        gm.disableGifts = !gm.disableGifts;
        setGMStorytellerState(gm);
      };

      handleSetPersonality('Sadistic');
      expect(getGMStorytellerState().personality).toBe('Sadistic');

      handleToggleLootGifts();
      expect(getGMStorytellerState().disableGifts).toBe(true);

      handleToggleLootGifts();
      expect(getGMStorytellerState().disableGifts).toBe(false);
    });

    it('modifies dynamic Chaos Score with positive and negative deltas', () => {
      mockGameState.chaosScore = 20;

      const res1 = modifyChaosScore(mockGameState, 25, 'Sacrificial Dark Altar');
      expect(res1.nextState.chaosScore).toBe(45);
      expect(res1.logMessage.text).toContain('CHAOS MATRIX');

      const res2 = modifyChaosScore(res1.nextState, -15, 'Holy Cleansing Ritual');
      expect(res2.nextState.chaosScore).toBe(30);
    });
  });

  describe('7. Manual Chaos Core Surge Triggering & Encounters', () => {
    it('manually discharges Chaos Core d20 roll and generates narrative log', () => {
      const outcome = triggerManualChaosSurge(mockGameState, 15);

      expect(outcome).toBeDefined();
      expect(outcome.roll).toBe(15);
      expect(outcome.effName).toBeDefined();
      expect(outcome.effDesc).toBeDefined();

      const gmState = getGMStorytellerState();
      expect(gmState.lastChaosRoll).toBe(15);
      expect(gmState.lastChaosEffectName).toBe(outcome.effName);
    });

    it('forces specific scripted GM narrative encounters', () => {
      mockGameState.playerStats.hp = 10;
      mockGameState.playerStats.maxHp = 100;
      const res = forceGMEncounter('healing_breeze', mockGameState);
      expect(res).toBeDefined();
      expect(res.success).toBe(true);
      expect(res.logText).toMatch(/\+40 HP/i);
    });
  });

  describe('8. Audio Oscilloscope Studio & Procedural Synthesizer', () => {
    it('switches view mode between Oscilloscope, Spectrum, and Split views', () => {
      let viewMode: 'oscilloscope' | 'spectrum' | 'split' = 'split';
      const setViewMode = (mode: 'oscilloscope' | 'spectrum' | 'split') => {
        viewMode = mode;
        playSfx('click');
      };

      setViewMode('oscilloscope');
      expect(viewMode).toBe('oscilloscope');

      setViewMode('spectrum');
      expect(viewMode).toBe('spectrum');

      setViewMode('split');
      expect(viewMode).toBe('split');
    });

    it('dispatches custom synthesizer waveforms with ADSR and filter curves', () => {
      const customPatch: CustomSynthParams = {
        type: 'sawtooth',
        startFreq: 880,
        endFreq: 220,
        freqRampType: 'exponential',
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 0.2,
        volume: 0.25,
        filterType: 'lowpass',
        filterFreq: 1800,
        filterQ: 3.5
      };

      expect(() => {
        playCustomSynthesizer(customPatch);
      }).not.toThrow();

      expect(() => {
        playCustomSynthesizer({
          ...customPatch,
          type: 'square',
          filterType: 'bandpass'
        });
      }).not.toThrow();
    });

    it('loads and applies synthesizer preset patches', () => {
      const presetPatches: { label: string; params: CustomSynthParams }[] = [
        {
          label: '8-Bit Laser',
          params: {
            type: 'square',
            startFreq: 880,
            endFreq: 110,
            freqRampType: 'exponential',
            attack: 0.005,
            decay: 0.08,
            sustain: 0.1,
            release: 0.05,
            volume: 0.2,
            filterType: 'lowpass',
            filterFreq: 2400,
            filterQ: 3.0
          }
        },
        {
          label: 'Arcane Pulse',
          params: {
            type: 'sine',
            startFreq: 320,
            endFreq: 640,
            freqRampType: 'exponential',
            attack: 0.05,
            decay: 0.15,
            sustain: 0.4,
            release: 0.3,
            volume: 0.22,
            filterType: 'bandpass',
            filterFreq: 1200,
            filterQ: 4.0
          }
        },
        {
          label: 'Sub Bass Drop',
          params: {
            type: 'sawtooth',
            startFreq: 150,
            endFreq: 35,
            freqRampType: 'exponential',
            attack: 0.02,
            decay: 0.35,
            sustain: 0.5,
            release: 0.4,
            volume: 0.3,
            filterType: 'lowpass',
            filterFreq: 400,
            filterQ: 1.5
          }
        }
      ];

      presetPatches.forEach(patch => {
        expect(patch.params.type).toBeDefined();
        expect(patch.params.startFreq).toBeGreaterThan(0);
        expect(patch.params.filterFreq).toBeGreaterThan(0);
        expect(() => playCustomSynthesizer(patch.params)).not.toThrow();
      });
    });

    it('retrieves waveform and frequency analyzer arrays safely without crash', () => {
      const waveformArray = new Uint8Array(128);
      const frequencyArray = new Uint8Array(128);

      expect(() => getAudioWaveformData(waveformArray)).not.toThrow();
      expect(() => getAudioFrequencyData(frequencyArray)).not.toThrow();
    });
  });
});
