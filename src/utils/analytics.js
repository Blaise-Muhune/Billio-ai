/**
 * Lightweight funnel events (Vercel Analytics when available).
 */
import { track } from '@vercel/analytics';

export function trackFunnel(event, props = {}) {
  try {
    track(event, props);
  } catch {
    /* analytics optional */
  }
  try {
    if (import.meta.env.DEV) {
      console.debug('[funnel]', event, props);
    }
  } catch {
    /* ignore */
  }
}
