/**
 * Tests for the start-screen play-tracking cookie + GA4 bridge.
 * Uses a minimal in-memory document.cookie shim (no jsdom dependency).
 */

// --- Minimal cookie-enabled environment shim (must run before imports use it) ---
const g = globalThis as any;
if (typeof g.document === 'undefined') {
  g.document = {};
}
if (typeof g.window === 'undefined') {
  g.window = g;
}
if (typeof location === 'undefined') {
  g.location = { search: '', protocol: 'http:', href: 'http://localhost/' };
}
if (!Object.getOwnPropertyDescriptor(g.document, 'cookie')) {
  let jar = '';
  Object.defineProperty(g.document, 'cookie', {
    configurable: true,
    get() { return jar; },
    set(v: string) { jar = v; },
  });
}
g.document.referrer = 'https://www.reddit.com/r/roguelikes/post123';

import { describe, it, expect, beforeEach } from 'vitest';
import {
  readPlayStats,
  recordVisit,
  recordGameStart,
  trackEvent,
  deleteCookie,
} from '../utils/analytics';

describe('Start screen play-tracking cookie', () => {
  beforeEach(() => {
    deleteCookie('dcr_play_stats');
    g.document.cookie = '';
  });

  it('returns zeroed defaults when no cookie exists', () => {
    const stats = readPlayStats();
    expect(stats.timesPlayed).toBe(0);
    expect(stats.visits).toBe(0);
    expect(stats.firstSeen).toBe('');
  });

  it('recordVisit stores referrer domain and firstSeen timestamp', () => {
    const stats = recordVisit();
    expect(stats.visits).toBe(1);
    expect(stats.firstSeen).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(stats.referrerDomain).toBe('reddit.com');
    expect(stats.referrer).toContain('reddit.com');
  });

  it('recordGameStart increments times played and stamps last played', () => {
    recordVisit();
    let stats = recordGameStart();
    expect(stats.timesPlayed).toBe(1);
    stats = recordGameStart();
    expect(stats.timesPlayed).toBe(2);
    expect(stats.lastPlayed).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Cookie persists across reads
    expect(readPlayStats().timesPlayed).toBe(2);
  });

  it('tracks UTM parameters for "where from" attribution', () => {
    g.location.search = '?utm_source=twitch&utm_medium=stream&utm_campaign=launch';
    const stats = recordVisit();
    expect(stats.utmSource).toBe('twitch');
    expect(stats.utmMedium).toBe('stream');
    expect(stats.utmCampaign).toBe('launch');
    g.location.search = '';
  });

  it('buffers GA4 events into dataLayer when gtag.js is absent', () => {
    g.dataLayer = [];
    delete g.gtag;
    trackEvent('game_start', { times_played: 1 });
    expect(g.dataLayer.length).toBeGreaterThan(0);
  });

  it('forwards GA4 events to window.gtag when present', () => {
    const calls: unknown[][] = [];
    g.gtag = (...args: unknown[]) => calls.push(args);
    recordGameStart();
    const gameStartCall = calls.find((c) => c[0] === 'event' && c[1] === 'game_start');
    expect(gameStartCall).toBeTruthy();
    expect((gameStartCall as any)[2].times_played).toBeGreaterThanOrEqual(1);
    delete g.gtag;
  });
});
