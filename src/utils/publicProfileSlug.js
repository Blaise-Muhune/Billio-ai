/** Route segments that cannot be used as public profile handles. */
const RESERVED_SLUGS = new Set([
  'home',
  'auth',
  'profile',
  'profile-setup',
  'onboarding',
  'subscription',
  'analytics',
  'api',
  'demo',
  'privacy-policy',
  'terms',
  'help',
  'admin',
  'login',
  'signup',
  'cards',
  'events',
  'wallet',
  'settings',
  'help',
  'support',
  'undefined',
  'null'
]);

/**
 * Normalize user-chosen handle: lowercase, a-z 0-9 hyphen, length 3–32, not reserved.
 * Returns empty string if invalid (caller treats as "no custom slug").
 */
export function normalizePublicProfileSlug(input) {
  if (input == null || typeof input !== 'string') return '';
  let s = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  s = s.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
  if (s.length < 3 || s.length > 32) return '';
  if (RESERVED_SLUGS.has(s)) return '';
  return s;
}

/** Public path: vanity slug only when provided — never advertise bare UID as “live”. */
export function buildProfilePublicPath(uid, slugRaw) {
  const slug = normalizePublicProfileSlug(slugRaw || '');
  if (slug) return `/profile/${slug}`;
  // Legacy fallback for owners previewing before go-live (not for public share)
  if (uid) return `/profile/${uid}`;
  return '/profile';
}

/** Full site URL for sharing (uses window when available). Prefer buildLiveProfileShareUrl. */
export function buildProfileShareUrl(uid, slugRaw) {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  return `${origin}${buildProfilePublicPath(uid, slugRaw)}`;
}

/** Two-letter style initials for avatar fallback. */
export function displayNameInitials(displayName) {
  if (!displayName || typeof displayName !== 'string') return '?';
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) {
    const w = parts[0];
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : w.charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
