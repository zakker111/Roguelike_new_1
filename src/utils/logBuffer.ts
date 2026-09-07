/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameLogMessage } from '../types';

/**
 * Strict FIFO memory cap for in-memory game logs.
 * Prevents unbounded React state growth during marathon sessions.
 */
export const MAX_GAME_LOGS = 200;

/**
 * Creates a unique, structured GameLogMessage with timestamp.
 */
export function createGameLogMessage(
  text: string,
  type: GameLogMessage['type'] = 'info',
  timestampOverride?: string
): GameLogMessage {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text,
    type,
    timestamp:
      timestampOverride ||
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

/**
 * Appends one or multiple log entries to an existing log list,
 * enforcing a strict FIFO limit (default 200 items).
 */
export function appendBoundedLogs(
  existingLogs: GameLogMessage[] = [],
  newLogs: GameLogMessage | GameLogMessage[],
  maxLogs: number = MAX_GAME_LOGS
): GameLogMessage[] {
  const incoming = Array.isArray(newLogs) ? newLogs : [newLogs];
  if (incoming.length === 0) return existingLogs;

  const combined = [...existingLogs, ...incoming];
  if (combined.length <= maxLogs) {
    return combined;
  }

  // FIFO pruning: discard oldest items from the front
  return combined.slice(combined.length - maxLogs);
}

/**
 * Bounds any given log list to the maximum allowed entries.
 */
export function boundLogList(
  logs: GameLogMessage[] = [],
  maxLogs: number = MAX_GAME_LOGS
): GameLogMessage[] {
  if (logs.length <= maxLogs) return logs;
  return logs.slice(logs.length - maxLogs);
}
