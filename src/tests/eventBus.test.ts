/**
 * Unit test suite for GameEventBus priority ordering, wildcards, error isolation, and telemetry.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEventBusEngine } from '../events/core/EventBus';

describe('GameEventBus Engine', () => {
  let bus: GameEventBusEngine;

  beforeEach(() => {
    bus = new GameEventBusEngine();
  });

  it('dispatches events to registered listeners in priority order', () => {
    const callOrder: string[] = [];

    bus.on('combat:attack', () => {
      callOrder.push('NORMAL');
    }, { priority: 'NORMAL' });

    bus.on('combat:attack', () => {
      callOrder.push('FIRST');
    }, { priority: 'FIRST' });

    bus.on('combat:attack', () => {
      callOrder.push('LAST');
    }, { priority: 'LAST' });

    bus.on('combat:attack', () => {
      callOrder.push('HIGH');
    }, { priority: 'HIGH' });

    bus.on('combat:attack', () => {
      callOrder.push('MONITOR');
    }, { priority: 'MONITOR' });

    bus.emit('combat:attack', {
      attackerId: 'p1',
      targetId: 'e1',
      isPlayerAttacker: true,
      rawDamage: 25,
      isCrit: false,
    });

    expect(callOrder).toEqual(['FIRST', 'HIGH', 'NORMAL', 'LAST', 'MONITOR']);
  });

  it('handles once() listeners by automatically unsubscribing after first call', () => {
    let callCount = 0;

    bus.once('weather:changed', () => {
      callCount++;
    });

    bus.emit('weather:changed', { previousWeather: 'clear', newWeather: 'rain' });
    bus.emit('weather:changed', { previousWeather: 'rain', newWeather: 'storm' });

    expect(callCount).toBe(1);
    expect(bus.getListenerCount('weather:changed')).toBe(0);
  });

  it('unsubscribes listeners via returned unsubscribe callback', () => {
    let called = false;
    const sub = bus.on('turn:completed', () => {
      called = true;
    });

    sub.unsubscribe();
    bus.emit('turn:completed', { turnNumber: 5 });

    expect(called).toBe(false);
  });

  it('dispatches to wildcard listeners matching prefix', () => {
    const hits: string[] = [];

    bus.on('combat:*', (payload: any) => {
      hits.push(`wildcard:${payload.rawDamage}`);
    });

    bus.emit('combat:attack', {
      attackerId: 'hero',
      targetId: 'goblin',
      isPlayerAttacker: true,
      rawDamage: 33,
      isCrit: false,
    });

    expect(hits).toEqual(['wildcard:33']);
  });

  it('isolates subscriber errors so subsequent listeners still execute', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const executionList: string[] = [];

    bus.on('item:used', () => {
      executionList.push('first');
    }, { priority: 'HIGH' });

    bus.on('item:used', () => {
      throw new Error('Plugin crash simulation');
    }, { priority: 'NORMAL' });

    bus.on('item:used', () => {
      executionList.push('third');
    }, { priority: 'LOW' });

    bus.emit('item:used', {
      actorId: 'player',
      itemId: 'health_potion',
      itemName: 'Health Potion',
      itemType: 'potion',
    });

    expect(executionList).toEqual(['first', 'third']);
    consoleSpy.mockRestore();
  });

  it('records rolling telemetry history with latency and subscriber counts', () => {
    bus.on('movement:step', () => {});
    bus.on('movement:step', () => {});

    bus.emit('movement:step', {
      actorId: 'player',
      fromX: 5,
      fromY: 5,
      toX: 6,
      toY: 5,
      distance: 1,
    });

    const history = bus.getTelemetryHistory();
    expect(history.length).toBe(1);
    expect(history[0].event).toBe('movement:step');
    expect(history[0].subscriberCount).toBe(2);
    expect(history[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('supports async dispatch awaiting promises sequentially', async () => {
    const log: string[] = [];

    bus.on('chaos:surged', async () => {
      await new Promise((r) => setTimeout(r, 5));
      log.push('async1');
    }, { priority: 'HIGH' });

    bus.on('chaos:surged', async () => {
      log.push('sync2');
    }, { priority: 'NORMAL' });

    await bus.emitAsync('chaos:surged', {
      previousScore: 10,
      newScore: 30,
      surgeTitle: 'Void Pulse',
      intensity: 1,
    });

    expect(log).toEqual(['async1', 'sync2']);
  });
});
