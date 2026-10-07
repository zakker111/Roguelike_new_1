/**
 * High-performance, priority-ordered Event Bus engine for the roguelike system.
 * Features safe error boundaries, async & sync dispatch, wildcard prefixes, and telemetry.
 */

import {
  EventPriority,
  GameEventPayloadMap,
  EventListenerRegistration,
  EventSubscription,
  EventTelemetryRecord,
  PRIORITY_WEIGHTS,
  CancellableEvent,
} from '../types';

let nextListenerId = 1;
let nextTelemetryId = 1;

export class GameEventBusEngine {
  private listeners: Map<string, EventListenerRegistration[]> = new Map();
  private wildcardListeners: EventListenerRegistration[] = [];
  private telemetryHistory: EventTelemetryRecord[] = [];
  private maxTelemetryHistory = 50;
  private totalDispatched = 0;
  private recentDispatchTimestamps: number[] = [];
  private currentDispatchDepth = 0;
  private maxDispatchDepth = 20;

  /**
   * Register an event listener.
   */
  public on<K extends string>(
    eventType: K,
    callback: (payload: K extends keyof GameEventPayloadMap ? GameEventPayloadMap[K] : any) => void | Promise<void>,
    options: { priority?: EventPriority; tag?: string } = {}
  ): EventSubscription {
    const priority = options.priority || 'NORMAL';
    const weight = PRIORITY_WEIGHTS[priority] ?? 0;
    const registration: EventListenerRegistration = {
      id: `listener_${nextListenerId++}`,
      eventType,
      callback: callback as (payload: unknown) => void | Promise<void>,
      priority,
      weight,
      once: false,
      tag: options.tag,
    };

    if (eventType.includes('*')) {
      this.wildcardListeners.push(registration);
      this.wildcardListeners.sort((a, b) => b.weight - a.weight);
    } else {
      const list = this.listeners.get(eventType) || [];
      list.push(registration);
      list.sort((a, b) => b.weight - a.weight);
      this.listeners.set(eventType, list);
    }

    return {
      unsubscribe: () => {
        this.offById(registration.id, eventType);
      },
    };
  }

  /**
   * Register a one-time event listener that auto-unsubscribes after first invocation.
   */
  public once<K extends string>(
    eventType: K,
    callback: (payload: K extends keyof GameEventPayloadMap ? GameEventPayloadMap[K] : any) => void | Promise<void>,
    options: { priority?: EventPriority; tag?: string } = {}
  ): EventSubscription {
    const priority = options.priority || 'NORMAL';
    const weight = PRIORITY_WEIGHTS[priority] ?? 0;
    const registration: EventListenerRegistration = {
      id: `listener_${nextListenerId++}`,
      eventType,
      callback: callback as (payload: unknown) => void | Promise<void>,
      priority,
      weight,
      once: true,
      tag: options.tag,
    };

    if (eventType.includes('*')) {
      this.wildcardListeners.push(registration);
      this.wildcardListeners.sort((a, b) => b.weight - a.weight);
    } else {
      const list = this.listeners.get(eventType) || [];
      list.push(registration);
      list.sort((a, b) => b.weight - a.weight);
      this.listeners.set(eventType, list);
    }

    return {
      unsubscribe: () => {
        this.offById(registration.id, eventType);
      },
    };
  }

  /**
   * Unsubscribe a listener by its ID or callback reference.
   */
  public off(eventType: string, callbackOrId: string | Function): void {
    if (typeof callbackOrId === 'string') {
      this.offById(callbackOrId, eventType);
      return;
    }

    if (eventType.includes('*')) {
      this.wildcardListeners = this.wildcardListeners.filter(
        (reg) => reg.callback !== callbackOrId
      );
    } else {
      const list = this.listeners.get(eventType);
      if (list) {
        this.listeners.set(
          eventType,
          list.filter((reg) => reg.callback !== callbackOrId)
        );
      }
    }
  }

  private offById(id: string, eventType: string): void {
    if (eventType.includes('*')) {
      this.wildcardListeners = this.wildcardListeners.filter((reg) => reg.id !== id);
    } else {
      const list = this.listeners.get(eventType);
      if (list) {
        this.listeners.set(
          eventType,
          list.filter((reg) => reg.id !== id)
        );
      }
    }
  }

  /**
   * Helper to initialize cancellation flags if payload implements CancellableEvent
   */
  public makeCancellable<T extends object>(payload: T): T & CancellableEvent {
    const p = payload as T & CancellableEvent;
    if (p.isCancelled === undefined) {
      p.isCancelled = false;
      p.cancel = (reason?: string) => {
        p.isCancelled = true;
        p.cancelReason = reason;
      };
    }
    return p;
  }

  /**
   * Synchronously emit an event to all subscribers in strict priority order.
   */
  public emit<K extends string, P = K extends keyof GameEventPayloadMap ? GameEventPayloadMap[K] : any>(
    eventType: K,
    payload: P
  ): P {
    if (this.currentDispatchDepth > this.maxDispatchDepth) {
      console.warn(`[EventBus] Max dispatch depth (${this.maxDispatchDepth}) exceeded for event: ${eventType}`);
      return payload;
    }

    this.currentDispatchDepth++;
    const startTime = performance.now();
    const listenersToCall = this.collectApplicableListeners(eventType);
    const toRemoveIds: string[] = [];

    try {
      for (const reg of listenersToCall) {
        try {
          reg.callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error executing listener '${reg.id}' for event '${eventType}':`, err);
        }

        if (reg.once) {
          toRemoveIds.push(reg.id);
        }
      }

      // Cleanup one-time listeners
      for (const id of toRemoveIds) {
        this.offById(id, eventType);
      }
    } finally {
      this.currentDispatchDepth--;
      const durationMs = performance.now() - startTime;
      this.recordTelemetry(eventType, durationMs, listenersToCall.length, payload);
    }

    return payload;
  }

  /**
   * Asynchronously emit an event, awaiting any promise-returning subscribers in priority order.
   */
  public async emitAsync<K extends string, P = K extends keyof GameEventPayloadMap ? GameEventPayloadMap[K] : any>(
    eventType: K,
    payload: P
  ): Promise<P> {
    if (this.currentDispatchDepth > this.maxDispatchDepth) {
      console.warn(`[EventBus] Max dispatch depth (${this.maxDispatchDepth}) exceeded for event: ${eventType}`);
      return payload;
    }

    this.currentDispatchDepth++;
    const startTime = performance.now();
    const listenersToCall = this.collectApplicableListeners(eventType);
    const toRemoveIds: string[] = [];

    try {
      for (const reg of listenersToCall) {
        try {
          const res = reg.callback(payload);
          if (res instanceof Promise) {
            await res;
          }
        } catch (err) {
          console.error(`[EventBus] Async error executing listener '${reg.id}' for '${eventType}':`, err);
        }

        if (reg.once) {
          toRemoveIds.push(reg.id);
        }
      }

      for (const id of toRemoveIds) {
        this.offById(id, eventType);
      }
    } finally {
      this.currentDispatchDepth--;
      const durationMs = performance.now() - startTime;
      this.recordTelemetry(eventType, durationMs, listenersToCall.length, payload);
    }

    return payload;
  }

  /**
   * Gather matching exact and wildcard listeners, ordered by weight descending.
   */
  private collectApplicableListeners(eventType: string): EventListenerRegistration[] {
    const direct = this.listeners.get(eventType) || [];
    const wildcards = this.wildcardListeners.filter((reg) => {
      if (reg.eventType === '*') return true;
      if (reg.eventType.endsWith(':*')) {
        const prefix = reg.eventType.slice(0, -2);
        return eventType.startsWith(prefix);
      }
      return false;
    });

    if (wildcards.length === 0) {
      return [...direct];
    }

    const combined = [...direct, ...wildcards];
    combined.sort((a, b) => b.weight - a.weight);
    return combined;
  }

  private recordTelemetry(eventType: string, durationMs: number, subscriberCount: number, payload: unknown): void {
    const now = performance.now();
    this.totalDispatched++;
    this.recentDispatchTimestamps.push(now);

    // Keep rolling timestamps to last 3 seconds
    const cutoff = now - 3000;
    while (this.recentDispatchTimestamps.length > 0 && this.recentDispatchTimestamps[0] < cutoff) {
      this.recentDispatchTimestamps.shift();
    }

    let payloadSummary = '';
    try {
      if (typeof payload === 'object' && payload !== null) {
        payloadSummary = JSON.stringify(payload, (_k, v) => {
          if (typeof v === 'function') return '[Function]';
          return v;
        }).slice(0, 150);
      } else {
        payloadSummary = String(payload);
      }
    } catch {
      payloadSummary = '[Object]';
    }

    const wasCancelled = Boolean((payload as any)?.isCancelled);

    const record: EventTelemetryRecord = {
      id: `tel_${nextTelemetryId++}`,
      event: eventType,
      timestamp: Date.now(),
      durationMs: Number(durationMs.toFixed(3)),
      subscriberCount,
      payloadSummary,
      wasCancelled,
    };

    this.telemetryHistory.unshift(record);
    if (this.telemetryHistory.length > this.maxTelemetryHistory) {
      this.telemetryHistory.pop();
    }
  }

  // -------------------------------------------------------------
  // Diagnostic and Inspection APIs
  // -------------------------------------------------------------

  public getTelemetryHistory(): EventTelemetryRecord[] {
    return [...this.telemetryHistory];
  }

  public clearTelemetry(): void {
    this.telemetryHistory = [];
  }

  public getListenerCount(eventType?: string): number {
    if (eventType) {
      return (this.listeners.get(eventType)?.length || 0) +
        this.wildcardListeners.filter(w => w.eventType === eventType).length;
    }
    let count = this.wildcardListeners.length;
    for (const list of this.listeners.values()) {
      count += list.length;
    }
    return count;
  }

  public getActiveListeners(): Array<{ id: string; event: string; priority: EventPriority; tag?: string }> {
    const result: Array<{ id: string; event: string; priority: EventPriority; tag?: string }> = [];
    for (const [event, list] of this.listeners.entries()) {
      for (const reg of list) {
        result.push({ id: reg.id, event, priority: reg.priority, tag: reg.tag });
      }
    }
    for (const reg of this.wildcardListeners) {
      result.push({ id: reg.id, event: reg.eventType, priority: reg.priority, tag: reg.tag });
    }
    return result;
  }

  public getThroughputStats(): { totalDispatched: number; eventsPerSec: number } {
    const count = this.recentDispatchTimestamps.length;
    const eventsPerSec = Number((count / 3).toFixed(1));
    return {
      totalDispatched: this.totalDispatched,
      eventsPerSec,
    };
  }

  /**
   * Reset all listeners (primarily for unit tests).
   */
  public reset(): void {
    this.listeners.clear();
    this.wildcardListeners = [];
    this.telemetryHistory = [];
    this.recentDispatchTimestamps = [];
    this.totalDispatched = 0;
  }
}

export const gameEventBus = new GameEventBusEngine();
