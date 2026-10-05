/**
 * React lifecycle hook for subscribing to GameEventBus events with automated cleanup.
 */

import { useEffect, useRef } from 'react';
import { gameEventBus, GameEventBusEngine } from './EventBus';
import { EventPriority, GameEventType, GameEventPayloadMap } from '../types';

export function useGameEvent<K extends keyof GameEventPayloadMap | string>(
  eventType: K,
  callback: (payload: K extends keyof GameEventPayloadMap ? GameEventPayloadMap[K] : any) => void,
  options: { priority?: EventPriority; tag?: string } = {}
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const subscription = gameEventBus.on(
      eventType as any,
      (payload) => {
        callbackRef.current(payload);
      },
      options
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [eventType, options.priority, options.tag]);
}

export function useEventBus(): GameEventBusEngine {
  return gameEventBus;
}
