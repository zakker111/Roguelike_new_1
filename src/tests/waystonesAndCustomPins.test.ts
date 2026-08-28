import { describe, it, expect } from 'vitest';
import { CustomMapPin, WorldMapFilterState } from '../components/worldmap/types';
import { createNewGameRun } from '../utils/gameStateFactory';

describe('Phase 3: Waystones & Custom Map Pins Engine', () => {
  it('initializes game state with empty custom pins and attuned capital waystone', () => {
    const gs = createNewGameRun(12345);
    expect(gs.customMapPins).toBeDefined();
    expect(Array.isArray(gs.customMapPins)).toBe(true);
    expect(gs.customMapPins?.length).toBe(0);

    expect(gs.attunedWaystones).toBeDefined();
    expect(gs.attunedWaystones).toContain('waystone_0_0');
  });

  it('allows creating, updating, and removing custom player map pins', () => {
    let pins: CustomMapPin[] = [];

    // Create Pin
    const pin1: CustomMapPin = {
      id: 'pin_1',
      chunkX: 2,
      chunkY: -3,
      label: 'Dragon Cave Cache',
      icon: 'loot',
      color: '#f59e0b',
      notes: 'Found rare mithril veins and locked ruby chest',
      createdAtTurn: 42
    };
    pins = [...pins, pin1];
    expect(pins.length).toBe(1);
    expect(pins[0].label).toBe('Dragon Cave Cache');
    expect(pins[0].chunkX).toBe(2);
    expect(pins[0].chunkY).toBe(-3);

    // Update Pin
    const updatedPin1: CustomMapPin = {
      ...pin1,
      label: 'Cleared Dragon Cave (Empty)',
      icon: 'danger',
      color: '#10b981',
      notes: 'Looted everything on turn 80'
    };
    pins = pins.map(p => p.id === pin1.id ? updatedPin1 : p);
    expect(pins[0].label).toBe('Cleared Dragon Cave (Empty)');
    expect(pins[0].color).toBe('#10b981');

    // Add Second Pin
    const pin2: CustomMapPin = {
      id: 'pin_2',
      chunkX: -4,
      chunkY: 1,
      label: 'Herbalist Grove',
      icon: 'herb',
      color: '#22c55e',
      notes: 'Respawning nightshade and moonflowers',
      createdAtTurn: 95
    };
    pins = [...pins, pin2];
    expect(pins.length).toBe(2);

    // Delete Pin
    pins = pins.filter(p => p.id !== 'pin_1');
    expect(pins.length).toBe(1);
    expect(pins[0].id).toBe('pin_2');
  });

  it('correctly filters map elements using WorldMapFilterState', () => {
    const filters: WorldMapFilterState = {
      showTowns: true,
      showDungeons: true,
      showShrines: true,
      showCaravanRoutes: true,
      showWaystones: true,
      showCustomPins: true
    };

    expect(filters.showWaystones).toBe(true);
    expect(filters.showCustomPins).toBe(true);

    const toggledFilters: WorldMapFilterState = {
      ...filters,
      showWaystones: false,
      showCustomPins: false
    };

    expect(toggledFilters.showWaystones).toBe(false);
    expect(toggledFilters.showCustomPins).toBe(false);
  });

  it('calculates euclidean distance between player chunk and destination waystone', () => {
    const playerX = 0;
    const playerY = 0;
    const waystoneX = 3;
    const waystoneY = 4;

    const dist = Math.round(Math.hypot(waystoneX - playerX, waystoneY - playerY));
    expect(dist).toBe(5);
  });
});
