/**
 * Live public profile helpers — share only when deliberately live.
 */

import { normalizePublicProfileSlug } from './publicProfileSlug.js';

export { normalizePublicProfileSlug, buildProfilePublicPath, buildProfileShareUrl, displayNameInitials } from './publicProfileSlug.js';

/** Firebase Auth UIDs are typically 28 URL-safe chars without hyphens. */
export function looksLikeFirebaseUid(param) {
  const s = String(param || '').trim();
  return /^[A-Za-z0-9]{20,128}$/.test(s) && !s.includes('-');
}

export function isPublicProfileLive(data) {
  if (!data || typeof data !== 'object') return false;
  const slug = normalizePublicProfileSlug(data.publicProfileSlug || '');
  if (!slug) return false;
  // Explicit opt-out
  if (data.publicProfileLive === false) return false;
  // Explicit live, or legacy docs that only had a vanity slug
  return data.publicProfileLive === true || data.publicProfileLive == null;
}

/**
 * Share URL only when profile is live with a vanity slug.
 * Returns '' if not shareable (callers should deep-link to setup instead).
 */
export function buildLiveProfileShareUrl(uid, dataOrSlug, liveFlag) {
  const origin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  let slug = '';
  let live = false;
  if (dataOrSlug && typeof dataOrSlug === 'object') {
    slug = normalizePublicProfileSlug(dataOrSlug.publicProfileSlug || '');
    live = isPublicProfileLive(dataOrSlug);
  } else {
    slug = normalizePublicProfileSlug(dataOrSlug || '');
    live = liveFlag === true && !!slug;
  }
  if (!live || !slug) return '';
  return `${origin}/profile/${slug}`;
}

export function getGoLiveChecklist(form) {
  const f = form || {};
  const slug = normalizePublicProfileSlug(f.publicProfileSlug || '');
  const hasName = !!(f.displayName || '').trim();
  const hasPhoto = !!(f.photoURL || '').trim();
  const v = f.visibility || {};
  const hasReachable =
    (!!(f.email || '').trim() && v.email !== false) ||
    (!!(f.phone || '').trim() && v.phone !== false) ||
    (!!(f.linkedin || '').trim() && v.linkedin !== false);

  return [
    { id: 'name', label: 'Your name', done: hasName, required: true },
    { id: 'slug', label: 'Public link (vanity URL)', done: !!slug, required: true },
    {
      id: 'contact',
      label: 'At least one way to reach you (email, phone, or LinkedIn — visible)',
      done: hasReachable,
      required: true
    },
    { id: 'photo', label: 'Profile photo', done: hasPhoto, required: false }
  ];
}

export function canGoLive(form) {
  return getGoLiveChecklist(form).filter((c) => c.required).every((c) => c.done);
}

/**
 * Sanitize a users/{uid} doc into a visitor-safe DTO.
 * Returns null if not live.
 */
export function toPublicProfileDTO(id, data) {
  if (!isPublicProfileLive(data)) return null;
  const v = data.visibility || {};
  const showIdentity = v.nameTitle !== false;

  const customLinks = Array.isArray(data.customLinks)
    ? data.customLinks
        .filter((link) => {
          if (!link || !(link.url || '').trim()) return false;
          const key = link.id || link.url;
          if (v.customLinks && typeof v.customLinks === 'object' && key in v.customLinks) {
            return v.customLinks[key] !== false;
          }
          return true;
        })
        .map((link) => ({
          id: link.id || '',
          title: String(link.title || '').trim(),
          url: String(link.url || '').trim(),
          iconUrl: String(link.iconUrl || '').trim()
        }))
    : [];

  return {
    id,
    slug: normalizePublicProfileSlug(data.publicProfileSlug),
    live: true,
    displayName: showIdentity ? String(data.displayName || '').trim() : '',
    title: showIdentity && v.title !== false ? String(data.title || '').trim() : '',
    company: showIdentity && v.company !== false ? String(data.company || '').trim() : '',
    bio: v.bio !== false ? String(data.bio || '').trim() : '',
    photoURL: String(data.photoURL || '').trim(),
    email: v.email !== false ? String(data.email || '').trim() : '',
    phone: v.phone !== false ? String(data.phone || '').trim() : '',
    addressLine1: v.address !== false ? String(data.addressLine1 || '').trim() : '',
    addressLine2: v.address !== false ? String(data.addressLine2 || '').trim() : '',
    city: v.address !== false ? String(data.city || '').trim() : '',
    state: v.address !== false ? String(data.state || '').trim() : '',
    zipCode: v.address !== false ? String(data.zipCode || '').trim() : '',
    linkedin: v.linkedin !== false ? String(data.linkedin || '').trim() : '',
    twitter: v.twitter !== false ? String(data.twitter || '').trim() : '',
    instagram: v.instagram !== false ? String(data.instagram || '').trim() : '',
    facebook: v.facebook !== false ? String(data.facebook || '').trim() : '',
    tiktok: v.tiktok !== false ? String(data.tiktok || '').trim() : '',
    github: v.github !== false ? String(data.github || '').trim() : '',
    otherLink: v.otherLink !== false ? String(data.otherLink || '').trim() : '',
    customLinks,
    profileCompleted: !!data.profileCompleted
  };
}

export function applyPublicProfileDocumentMeta(profile, pageUrl) {
  if (typeof document === 'undefined' || !profile) return;
  const name = profile.displayName || 'Profile';
  const roleBits = [profile.title, profile.company].filter(Boolean).join(' · ');
  const title = roleBits ? `${name} · ${roleBits}` : `${name} · BilloAI`;
  const description =
    (profile.bio && String(profile.bio).slice(0, 160)) ||
    (roleBits ? `${name} — ${roleBits}` : `Connect with ${name} on BilloAI`);

  document.title = title;

  const ensureMeta = (attr, key, content) => {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  ensureMeta('property', 'og:type', 'profile');
  ensureMeta('property', 'og:title', title);
  ensureMeta('property', 'og:description', description);
  if (pageUrl) ensureMeta('property', 'og:url', pageUrl);
  if (profile.photoURL) ensureMeta('property', 'og:image', profile.photoURL);
  ensureMeta('name', 'twitter:card', profile.photoURL ? 'summary_large_image' : 'summary');
  ensureMeta('name', 'twitter:title', title);
  ensureMeta('name', 'twitter:description', description);
  if (profile.photoURL) ensureMeta('name', 'twitter:image', profile.photoURL);
  ensureMeta('name', 'description', description);
}
