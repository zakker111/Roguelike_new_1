/**
 * Analytics & Play-Tracking Utilities
 * ------------------------------------------------------------------
 * Two independent systems live here:
 *
 * 1. FIRST-PARTY COOKIES (`dcr_play_stats`)
 *    A durable cookie on the game's start screen that records:
 *      - timesPlayed  : how many runs the player has started
 *      - firstSeen    : ISO date of the very first visit
 *      - lastPlayed   : ISO date of the most recent run start
 *      - referrer     : where the player came from (document.referrer)
 *      - utmSource / utmMedium / utmCampaign : marketing tags from the URL
 *      - visits       : total page loads of the app
 *
 * 2. GOOGLE ANALYTICS 4 (GA4) via gtag.js
 *    Every event above is mirrored as a GA4 event so you can build
 *    reports/audiences in the GA4 UI. Falls back to a no-op queue when
 *    no Measurement ID is configured, so local dev never errors out.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayStats {
  timesPlayed: number;   // number of game runs started
  visits: number;        // number of page loads
  firstSeen: string;     // ISO timestamp of first ever visit
  lastPlayed: string;    // ISO timestamp of the latest run start
  referrer: string;      // full referring URL ("" for direct)
  referrerDomain: string; // e.g. "reddit.com", "twitch.tv"
  utmSource: string;     // ?utm_source=...
  utmMedium: string;     // ?utm_medium=...
  utmCampaign: string;   // ?utm_campaign=...
}

const COOKIE_NAME = 'dcr_play_stats';
const COOKIE_MAX_AGE_DAYS = 365;

// ---------------------------------------------------------------------------
// Low-level cookie helpers (no external dependencies)
// ---------------------------------------------------------------------------

export function setCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(value);
  // SameSite=Lax keeps the cookie usable after redirects from links/socials,
  // Secure ensures it is only sent over HTTPS in production.
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encoded}; Path=/; Max-Age=${Math.round(maxAgeDays * 24 * 60 * 60)}; SameSite=Lax${secure}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Attribution helpers (works around SSR / test environments)
// ---------------------------------------------------------------------------

function safeReferrer(): string {
  try {
    return typeof document !== 'undefined' ? document.referrer || '' : '';
  } catch {
    return '';
  }
}

function safeSearchParam(key: string): string {
  try {
    return new URLSearchParams(window.location.search).get(key) || '';
  } catch {
    return '';
  }
}

function domainOf(url: string): string {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, '') : '';
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Play-stats cookie store
// ---------------------------------------------------------------------------

function emptyStats(): PlayStats {
  return {
    timesPlayed: 0,
    visits: 0,
    firstSeen: '',
    lastPlayed: '',
    referrer: '',
    referrerDomain: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
  };
}

/** Reads and parses the play-stats cookie (returns defaults if missing/corrupt). */
export function readPlayStats(): PlayStats {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return emptyStats();
  try {
    const parsed = JSON.parse(raw) as Partial<PlayStats>;
    return { ...emptyStats(), ...parsed };
  } catch {
    return emptyStats();
  }
}

function writePlayStats(stats: PlayStats): void {
  setCookie(COOKIE_NAME, JSON.stringify(stats), COOKIE_MAX_AGE_DAYS);
}

/**
 * Call once at app startup. Counts a page visit and captures attribution
 * (referrer + UTM tags) fresh from the current URL on every load.
 */
export function recordVisit(): PlayStats {
  const stats = readPlayStats();
  const now = new Date().toISOString();

  stats.visits += 1;
  if (!stats.firstSeen) stats.firstSeen = now;

  // Attribution: prefer fresh values on each visit so returning players who
  // arrive from a new channel are re-tagged correctly.
  const ref = safeReferrer();
  if (ref) {
    stats.referrer = ref;
    stats.referrerDomain = domainOf(ref);
  }
  stats.utmSource = safeSearchParam('utm_source') || stats.utmSource;
  stats.utmMedium = safeSearchParam('utm_medium') || stats.utmMedium;
  stats.utmCampaign = safeSearchParam('utm_campaign') || stats.utmCampaign;

  writePlayStats(stats);
  return stats;
}

/**
 * Call when the player presses "DESCEND THE FORGE CHAMBERS" (start of a run).
 * Increments timesPlayed, stamps lastPlayed, then mirrors the moment to GA4.
 */
export function recordGameStart(): PlayStats {
  const stats = readPlayStats();
  stats.timesPlayed += 1;
  stats.lastPlayed = new Date().toISOString();
  writePlayStats(stats);

  trackEvent('game_start', {
    times_played: stats.timesPlayed,
    visits: stats.visits,
    referrer_domain: stats.referrerDomain || 'direct',
    utm_source: stats.utmSource || '(none)',
    utm_medium: stats.utmMedium || '(none)',
    utm_campaign: stats.utmCampaign || '(none)',
  });

  return stats;
}

// ---------------------------------------------------------------------------
// Google Analytics 4 (gtag.js) bridge
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sends a custom event to GA4. Safe no-op when gtag.js hasn't loaded. */
export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}): void {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    } else {
      // Buffer until gtag.js boots (the standard async snippet supports this).
      (window.dataLayer = window.dataLayer || []).push(['event', name, params]);
    }
  } catch {
    // Analytics must never break gameplay.
  }
}

/** Fires a GA4 page_view manually (useful for SPA route/screen changes). */
export function trackScreen(screenName: string): void {
  trackEvent('page_view', { page_title: screenName, page_location: typeof location !== 'undefined' ? location.href : '' });
}
