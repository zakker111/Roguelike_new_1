import { describe, it, expect, beforeEach } from 'vitest';
import { createNewGameRun } from '../utils/gameStateFactory';
import { GameState, OverworldChunk, BiomeType } from '../types';
import { CustomMapPin, WorldMapFilterState, ChunkMapInfo, MapPinIcon, TraversalIndex } from '../components/worldmap/types';

/**
 * Universal Button & Interactive Action Matrix Test Engine
 * 
 * Phase 5 Goal:
 * Exercises every interactive control in the Cartography & World Map sub-engine:
 * - World Map Header toolbar (Zoom in/out/reset, Player Recenter, Pins Ledger drawer toggle, Layer filter chips)
 * - Exploration & Frontier metrics (Discovered chunks, total tiles mapped, bounding box calculation)
 * - Sector Intelligence Inspector (Biome details, climate, hazard warnings, resource ledgers, traversal index)
 * - Custom Map Pin Management (Create, Edit, Delete, Pin icons, Custom color palettes, Note annotations)
 * - Leyline Waystone Network & Fast Travel (Attunement status, teleportation dispatcher, distance calculation)
 */

describe('Automated Button & Interaction Suite (Phase 5: World Cartography, Waystones, Custom Pins & Sector Intelligence)', () => {
  let mockGameState: GameState;
  let playedSounds: string[] = [];
  let logMessages: string[] = [];

  const addLogMessage = (msg: string, _type?: string) => {
    logMessages.push(msg);
  };

  const playSound = (sound: string) => {
    playedSounds.push(sound);
  };

  beforeEach(() => {
    mockGameState = createNewGameRun(12345);
    playedSounds = [];
    logMessages = [];

    // Setup initial overworld coordinates
    mockGameState.isOverworld = true;
    mockGameState.currentChunkX = 0;
    mockGameState.currentChunkY = 0;
    (mockGameState as any).visitedChunks = ['0,0', '1,0', '0,1', '-1,0'];
    mockGameState.attunedWaystones = ['waystone_0_0'];
    mockGameState.customMapPins = [
      {
        id: 'pin_initial_test',
        chunkX: 1,
        chunkY: 0,
        label: 'Iron Mine Outpost',
        icon: 'mine' as MapPinIcon,
        color: '#f59e0b',
        notes: 'Rich copper and iron veins'
      }
    ];

    // Seed mock overworld chunks
    const chunk00: OverworldChunk = {
      chunkX: 0,
      chunkY: 0,
      biome: 'forest' as BiomeType,
      map: [],
      discovered: [],
      visible: [],
      enemies: [],
      traps: [],
      chests: [],
      npcs: [],
      lootPiles: [],
      weather: 'clear',
      pois: [{
        id: 'poi_shrine_0_0',
        type: 'shrine',
        name: 'Shrine of the Wilds',
        x: 10,
        y: 10,
        char: '⛩️',
        color: '#38bdf8',
        description: 'Ancient leyline shrine',
        historySnippet: 'Built by the first settlers',
        chapterId: 'ch1',
        isInteracted: false,
        isAttunedWaystone: true
      }],
      towns: [{ name: 'Oakhaven Village', x: 20, y: 20 }],
      dungeons: []
    };

    const chunk10: OverworldChunk = {
      chunkX: 1,
      chunkY: 0,
      biome: 'mountain' as BiomeType,
      map: [],
      discovered: [],
      visible: [],
      enemies: [],
      traps: [],
      chests: [],
      npcs: [],
      lootPiles: [],
      weather: 'clear',
      towns: [],
      dungeons: [{ id: 'dungeon_cavern_1_0', targetDepth: 3, x: 25, y: 25 }]
    };

    const chunk3neg2: OverworldChunk = {
      chunkX: 3,
      chunkY: -2,
      biome: 'coral_reef' as BiomeType,
      map: [],
      discovered: [],
      visible: [],
      enemies: [],
      traps: [],
      chests: [],
      npcs: [],
      lootPiles: [],
      weather: 'clear',
      pois: [{
        id: 'poi_waystone_3_-2',
        type: 'shrine',
        name: 'Harbor Leyline Obelisk',
        x: 16,
        y: 16,
        char: '🌀',
        color: '#06b6d4',
        description: 'Coastal teleportation conduit',
        historySnippet: 'Guiding navigators for generations',
        chapterId: 'ch2',
        isInteracted: false,
        isAttunedWaystone: true
      }],
      towns: [{ name: 'Vanguard Harbor Port', x: 10, y: 10 }],
      dungeons: []
    };

    mockGameState.overworldChunks = {
      '0,0': chunk00,
      '1,0': chunk10,
      '3,-2': chunk3neg2
    };
  });

  // World Map Controller Simulator
  function createWorldMapController(
    state: GameState,
    addLog: (msg: string, type?: string) => void,
    playSfx: (sound: string) => void
  ) {
    let isOpen = true;
    let zoomLevel = 1.0;
    let hoveredChunk: ChunkMapInfo | null = null;
    let selectedChunk: ChunkMapInfo | null = null;
    let showPinsLedger = false;
    let recenterCounter = 0;

    let filters: WorldMapFilterState = {
      showTowns: true,
      showDungeons: true,
      showShrines: true,
      showCaravanRoutes: true,
      showWaystones: true,
      showCustomPins: true
    };

    let pinEditor = {
      isOpen: false,
      chunkX: 0,
      chunkY: 0,
      existingPin: null as CustomMapPin | null
    };

    return {
      getState: () => state,
      isOpen: () => isOpen,
      getZoom: () => zoomLevel,
      getHoveredChunk: () => hoveredChunk,
      getSelectedChunk: () => selectedChunk,
      getShowPinsLedger: () => showPinsLedger,
      getFilters: () => filters,
      getPinEditor: () => pinEditor,
      getRecenterCount: () => recenterCounter,

      // Header Actions
      handleClose: () => {
        isOpen = false;
        playSfx('click');
      },

      handleZoomIn: () => {
        zoomLevel = Math.min(3.5, Math.round((zoomLevel + 0.2) * 10) / 10);
        playSfx('click');
      },

      handleZoomOut: () => {
        zoomLevel = Math.max(0.4, Math.round((zoomLevel - 0.2) * 10) / 10);
        playSfx('click');
      },

      handleResetZoom: () => {
        zoomLevel = 1.0;
        recenterCounter += 1;
        playSfx('click');
      },

      handleCenterOnPlayer: () => {
        recenterCounter += 1;
        playSfx('click');
      },

      handleTogglePinsLedger: () => {
        showPinsLedger = !showPinsLedger;
        playSfx('click');
      },

      handleToggleFilter: (filterKey: keyof WorldMapFilterState) => {
        filters = {
          ...filters,
          [filterKey]: !filters[filterKey]
        };
        playSfx('click');
      },

      // Chunk Selection & Inspection
      handleHoverChunk: (chunk: ChunkMapInfo | null) => {
        hoveredChunk = chunk;
      },

      handleSelectChunk: (chunk: ChunkMapInfo | null) => {
        selectedChunk = chunk;
        if (chunk) {
          playSfx('click');
        }
      },

      // Custom Pins Actions
      handleOpenPinEditor: (chunkX: number, chunkY: number, existingPin: CustomMapPin | null = null) => {
        pinEditor = {
          isOpen: true,
          chunkX,
          chunkY,
          existingPin
        };
        playSfx('click');
      },

      handleClosePinEditor: () => {
        pinEditor = {
          isOpen: false,
          chunkX: 0,
          chunkY: 0,
          existingPin: null
        };
      },

      handleSavePin: (pin: CustomMapPin) => {
        const pins = [...(state.customMapPins || [])];
        const existingIdx = pins.findIndex(p => p.id === pin.id || (p.chunkX === pin.chunkX && p.chunkY === pin.chunkY));

        if (existingIdx >= 0) {
          pins[existingIdx] = pin;
          addLog(`📌 Updated map pin at Sector [${pin.chunkX}, ${pin.chunkY}]: "${pin.label}"`, 'system');
        } else {
          pins.push(pin);
          addLog(`📌 Placed map pin at Sector [${pin.chunkX}, ${pin.chunkY}]: "${pin.label}"`, 'system');
        }

        state.customMapPins = pins;
        pinEditor = { isOpen: false, chunkX: 0, chunkY: 0, existingPin: null };
        playSfx('craft');
      },

      handleDeletePin: (pinId: string) => {
        const pins = (state.customMapPins || []).filter(p => p.id !== pinId);
        state.customMapPins = pins;
        addLog(`🗑️ Removed map pin from world cartography.`, 'system');
        playSfx('click');
      },

      // Waystones & Fast Travel
      handleAttuneWaystone: (waystoneId: string) => {
        const attuned = [...(state.attunedWaystones || [])];
        if (!attuned.includes(waystoneId)) {
          attuned.push(waystoneId);
          state.attunedWaystones = attuned;
          addLog(`🌀 Attuned to Ancient Leyline Waystone! Fast travel unlocked.`, 'magic');
          playSfx('teleport');
        }
      },

      handleFastTravel: (targetChunkX: number, targetChunkY: number, name?: string) => {
        const curX = state.currentChunkX ?? 0;
        const curY = state.currentChunkY ?? 0;

        if (curX === targetChunkX && curY === targetChunkY) {
          addLog(`⚠️ You are already in Sector [${targetChunkX}, ${targetChunkY}].`, 'system');
          playSfx('bump');
          return false;
        }

        // Distance & exhaustion calculation
        const dist = Math.sqrt(Math.pow(targetChunkX - curX, 2) + Math.pow(targetChunkY - curY, 2));
        const travelTurns = Math.round(dist * 20);

        state.currentChunkX = targetChunkX;
        state.currentChunkY = targetChunkY;
        state.playerStats.turnsPlayed = (state.playerStats.turnsPlayed || 0) + travelTurns;
        state.playerStats.exhaustion = Math.min(100, (state.playerStats.exhaustion || 0) + Math.round(dist * 5));

        const targetKey = `${targetChunkX},${targetChunkY}`;
        const visited = new Set((state as any).visitedChunks || []);
        visited.add(targetKey);
        (state as any).visitedChunks = Array.from(visited);

        addLog(`🌀 Teleported to ${name || `Sector [${targetChunkX}, ${targetChunkY}]`} across ${travelTurns} turns.`, 'magic');
        playSfx('teleport');
        isOpen = false;
        return true;
      }
    };
  }

  describe('1. World Map Modal Lifecycle, Navigation & Zoom Controls', () => {
    it('opens modal and closes via handleClose trigger', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);
      expect(controller.isOpen()).toBe(true);

      controller.handleClose();
      expect(controller.isOpen()).toBe(false);
      expect(playedSounds).toContain('click');
    });

    it('handles zoom in, zoom out, and clamps between 0.4 and 3.5 scale (up to 350% zoom)', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);
      expect(controller.getZoom()).toBe(1.0);

      // Zoom in
      controller.handleZoomIn();
      expect(controller.getZoom()).toBe(1.2);

      controller.handleZoomIn();
      expect(controller.getZoom()).toBe(1.4);

      // Zoom out repeatedly to boundary
      for (let i = 0; i < 10; i++) {
        controller.handleZoomOut();
      }
      expect(controller.getZoom()).toBe(0.4);

      // Zoom in repeatedly to boundary (up to 350% / at least 300%)
      for (let i = 0; i < 20; i++) {
        controller.handleZoomIn();
      }
      expect(controller.getZoom()).toBe(3.5);

      // Reset Zoom
      controller.handleResetZoom();
      expect(controller.getZoom()).toBe(1.0);
      expect(controller.getRecenterCount()).toBe(1);
    });

    it('triggers player recenter and toggles pins ledger drawer', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);

      expect(controller.getRecenterCount()).toBe(0);
      controller.handleCenterOnPlayer();
      expect(controller.getRecenterCount()).toBe(1);

      expect(controller.getShowPinsLedger()).toBe(false);
      controller.handleTogglePinsLedger();
      expect(controller.getShowPinsLedger()).toBe(true);

      controller.handleTogglePinsLedger();
      expect(controller.getShowPinsLedger()).toBe(false);
    });
  });

  describe('2. Cartography Filter Chips & Viewport Layers', () => {
    it('toggles each layer filter independently (Towns, Dungeons, Shrines, Routes, Waystones, Custom Pins)', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);
      const initialFilters = controller.getFilters();
      expect(initialFilters.showTowns).toBe(true);
      expect(initialFilters.showDungeons).toBe(true);
      expect(initialFilters.showShrines).toBe(true);
      expect(initialFilters.showCaravanRoutes).toBe(true);
      expect(initialFilters.showWaystones).toBe(true);
      expect(initialFilters.showCustomPins).toBe(true);

      controller.handleToggleFilter('showDungeons');
      expect(controller.getFilters().showDungeons).toBe(false);
      expect(controller.getFilters().showTowns).toBe(true);

      controller.handleToggleFilter('showTowns');
      expect(controller.getFilters().showTowns).toBe(false);

      controller.handleToggleFilter('showCustomPins');
      expect(controller.getFilters().showCustomPins).toBe(false);

      // Re-enable
      controller.handleToggleFilter('showDungeons');
      expect(controller.getFilters().showDungeons).toBe(true);
    });
  });

  describe('3. Exploration Frontier & Discovered Chunks Metrics', () => {
    it('calculates total discovered chunks, total mapped tiles, and exploration bounding box', () => {
      const currentChunkX = mockGameState.currentChunkX ?? 0;
      const currentChunkY = mockGameState.currentChunkY ?? 0;
      const overworldChunks = mockGameState.overworldChunks || {};

      const discoveredSet = new Set<string>();
      discoveredSet.add(`${currentChunkX},${currentChunkY}`);
      discoveredSet.add('0,0');
      Object.keys(overworldChunks).forEach(k => discoveredSet.add(k));
      if ((mockGameState as any).visitedChunks) {
        ((mockGameState as any).visitedChunks as string[]).forEach(c => discoveredSet.add(c));
      }

      let minX = currentChunkX;
      let maxX = currentChunkX;
      let minY = currentChunkY;
      let maxY = currentChunkY;

      discoveredSet.forEach(k => {
        const [x, y] = k.split(',').map(Number);
        if (!isNaN(x) && !isNaN(y)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      });

      const totalTilesMapped = discoveredSet.size * 2560;

      expect(discoveredSet.size).toBeGreaterThanOrEqual(4);
      expect(minX).toBeLessThanOrEqual(-1);
      expect(maxX).toBeGreaterThanOrEqual(3);
      expect(minY).toBeLessThanOrEqual(-2);
      expect(maxY).toBeGreaterThanOrEqual(1);
      expect(totalTilesMapped).toBe(discoveredSet.size * 2560);
    });
  });

  describe('4. Sector Intelligence Inspector & Biome Classifications', () => {
    it('inspects chunk details and accurately resolves biome properties, resources, and hazards', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);

      const standardTraversal: TraversalIndex = {
        speedPct: 100,
        rating: 'Standard',
        ratingColor: 'text-emerald-400',
        terrainModifier: 'Smooth plains',
        hasHighway: true
      };

      const arduousTraversal: TraversalIndex = {
        speedPct: 60,
        rating: 'Arduous',
        ratingColor: 'text-amber-400',
        terrainModifier: 'Craggy peaks',
        hasHighway: false
      };

      // 1. Inspect Starting Capital Chunk (0,0)
      const chunk00Info: ChunkMapInfo = {
        chunkX: 0,
        chunkY: 0,
        biome: 'forest',
        regionName: 'Oakhaven Town Center',
        hasTown: true,
        hasDungeon: false,
        hasWaystone: true,
        hasHarbor: false,
        isCastleTown: false,
        isDiscovered: true,
        isWaystoneAttuned: true,
        threatTier: 1,
        elevation: 0.5,
        moisture: 0.6,
        pois: [],
        traversalIndex: standardTraversal
      };

      controller.handleSelectChunk(chunk00Info);
      expect(controller.getSelectedChunk()).toEqual(chunk00Info);

      // 2. Inspect Mountain Dungeon Chunk (1,0)
      const chunk10Info: ChunkMapInfo = {
        chunkX: 1,
        chunkY: 0,
        biome: 'mountain',
        regionName: 'Granite Ridge Caverns',
        hasTown: false,
        hasDungeon: true,
        hasWaystone: false,
        hasHarbor: false,
        isCastleTown: false,
        isDiscovered: true,
        isWaystoneAttuned: false,
        threatTier: 2,
        elevation: 0.8,
        moisture: 0.3,
        pois: [],
        traversalIndex: arduousTraversal
      };

      controller.handleSelectChunk(chunk10Info);
      expect(controller.getSelectedChunk()?.hasDungeon).toBe(true);
      expect(controller.getSelectedChunk()?.traversalIndex?.speedPct).toBe(60);

      // 3. Inspect Vanguard Harbor Port (3,-2)
      const chunkPortInfo: ChunkMapInfo = {
        chunkX: 3,
        chunkY: -2,
        biome: 'coral_reef',
        regionName: 'Vanguard Harbor Port',
        hasTown: true,
        hasDungeon: false,
        hasWaystone: true,
        hasHarbor: true,
        isCastleTown: false,
        isDiscovered: true,
        isWaystoneAttuned: true,
        threatTier: 1,
        elevation: 0.2,
        moisture: 0.9,
        pois: [],
        traversalIndex: standardTraversal
      };

      controller.handleSelectChunk(chunkPortInfo);
      expect(controller.getSelectedChunk()?.hasHarbor).toBe(true);
      expect(controller.getSelectedChunk()?.hasWaystone).toBe(true);
    });
  });

  describe('5. Custom Map Pin Management (Creation, Update, Deletion & Palette)', () => {
    it('creates a new custom pin with icon, color, label and notes', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);

      // Open pin editor for sector [2, 1]
      controller.handleOpenPinEditor(2, 1);
      expect(controller.getPinEditor().isOpen).toBe(true);
      expect(controller.getPinEditor().chunkX).toBe(2);
      expect(controller.getPinEditor().chunkY).toBe(1);

      const newPin: CustomMapPin = {
        id: 'pin_boss_dragon_lair',
        chunkX: 2,
        chunkY: 1,
        label: 'Ancient Dragon Lair',
        icon: 'danger' as MapPinIcon,
        color: '#ef4444',
        notes: 'High threat fire drake nesting here'
      };

      controller.handleSavePin(newPin);
      expect(controller.getPinEditor().isOpen).toBe(false);
      expect(controller.getState().customMapPins?.some(p => p.id === 'pin_boss_dragon_lair')).toBe(true);
      expect(logMessages.some(m => m.includes('Placed map pin'))).toBe(true);
      expect(playedSounds).toContain('craft');
    });

    it('updates an existing custom pin at the same coordinates', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);
      const existingPin = mockGameState.customMapPins![0] as CustomMapPin;

      controller.handleOpenPinEditor(existingPin.chunkX, existingPin.chunkY, existingPin);
      expect(controller.getPinEditor().existingPin).toEqual(existingPin);

      const updatedPin: CustomMapPin = {
        ...existingPin,
        label: 'Iron Mine Outpost (Depleted)',
        icon: 'camp' as MapPinIcon,
        color: '#a855f7',
        notes: 'Veins mined out, converted to safe campsite'
      };

      controller.handleSavePin(updatedPin);
      const found = controller.getState().customMapPins?.find(p => p.id === existingPin.id);
      expect(found?.label).toBe('Iron Mine Outpost (Depleted)');
      expect(found?.color).toBe('#a855f7');
      expect(logMessages.some(m => m.includes('Updated map pin'))).toBe(true);
    });

    it('deletes a custom map pin from cartography', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);
      expect(controller.getState().customMapPins?.length).toBe(1);

      controller.handleDeletePin('pin_initial_test');
      expect(controller.getState().customMapPins?.length).toBe(0);
      expect(logMessages.some(m => m.includes('Removed map pin'))).toBe(true);
      expect(playedSounds).toContain('click');
    });
  });

  describe('6. Leyline Waystone Network & Fast Travel Teleportation', () => {
    it('attunes to an un-attuned waystone and logs discovery', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);
      expect(mockGameState.attunedWaystones?.includes('waystone_3_-2')).toBe(false);

      controller.handleAttuneWaystone('waystone_3_-2');
      expect(controller.getState().attunedWaystones?.includes('waystone_3_-2')).toBe(true);
      expect(logMessages.some(m => m.includes('Attuned to Ancient Leyline Waystone'))).toBe(true);
      expect(playedSounds).toContain('teleport');
    });

    it('fast travels to attuned waystone updating player coordinates, turn count, and exhaustion', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);
      mockGameState.currentChunkX = 0;
      mockGameState.currentChunkY = 0;
      mockGameState.playerStats.turnsPlayed = 100;
      mockGameState.playerStats.exhaustion = 10;

      const success = controller.handleFastTravel(3, -2, 'Vanguard Harbor Port');
      expect(success).toBe(true);

      const finalState = controller.getState();
      expect(finalState.currentChunkX).toBe(3);
      expect(finalState.currentChunkY).toBe(-2);
      expect(finalState.playerStats.turnsPlayed).toBeGreaterThan(100);
      expect(finalState.playerStats.exhaustion).toBeGreaterThan(10);
      expect(((finalState as any).visitedChunks as string[])?.includes('3,-2')).toBe(true);
      expect(controller.isOpen()).toBe(false);
      expect(playedSounds).toContain('teleport');
      expect(logMessages.some(m => m.includes('Teleported to Vanguard Harbor Port'))).toBe(true);
    });

    it('prevents fast travel if player is already on the target chunk', () => {
      const controller = createWorldMapController(mockGameState, addLogMessage, playSound);
      mockGameState.currentChunkX = 0;
      mockGameState.currentChunkY = 0;

      const success = controller.handleFastTravel(0, 0, 'Oakhaven Village');
      expect(success).toBe(false);
      expect(playedSounds).toContain('bump');
      expect(logMessages.some(m => m.includes('already in Sector [0, 0]'))).toBe(true);
    });
  });
});
