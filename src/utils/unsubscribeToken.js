/**
 * Client helper — tokens are minted server-side; this only builds the settings deep link.
 */
export function emailPrefsUrl(origin = typeof window !== 'undefined' ? window.location.origin : '') {
  return `${origin}/profile-setup#email-prefs`;
}
