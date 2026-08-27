<route>
meta:
  title: Profile - BilloAI
</route>

<template lang="pug">
main.public-profile.min-h-screen.font-sans
  .mx-auto.max-w-lg(class="px-4 py-10 sm:px-6 sm:py-14")
    .flex.min-h-60.items-center.justify-center(v-if="loading")
      .loading-spinner

    .text-center.py-12(v-else-if="error")
      VaIcon(name="person_off" size="48px" class="mx-auto mb-4 text-slate-400")
      h1.mb-2.text-2xl.font-bold.text-slate-900 {{ error }}
      p.mb-6.text-slate-600 {{ errorHint }}
      .flex.flex-wrap.items-center.justify-center.gap-3
        router-link(
          v-if="isOwnerPreviewBlocked"
          to="/profile-setup#go-live"
          class="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        ) Finish Go live
        button(
          type="button"
          class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="router.push(user ? '/home' : '/')"
        ) {{ user ? 'Back home' : 'BilloAI home' }}

    article.contact-card(v-else-if="profile")
      header.contact-card__hero
        .contact-card__avatar
          img(
            v-if="showProfilePhoto"
            :src="profile.photoURL"
            alt=""
            referrerpolicy="no-referrer"
            @error="onProfileAvatarError"
          )
          span(v-else aria-hidden="true") {{ profileInitials }}
        h1.contact-card__name {{ profile.displayName || 'Contact' }}
        p.contact-card__role(v-if="roleLine") {{ roleLine }}
        p.contact-card__bio(v-if="profile.bio") {{ profile.bio }}
        p.contact-card__owner(v-if="isOwner") This is how others see your live card
          router-link.contact-card__owner-link(to="/profile-setup") Edit profile

      .contact-card__cta
        button.contact-card__primary(
          type="button"
          @click="saveContact"
        )
          VaIcon(name="person_add" size="20px")
          span Add me to contacts
        .contact-card__quick(v-if="hasQuickActions")
          a.contact-card__chip(
            v-if="profile.email"
            :href="'mailto:' + profile.email"
          )
            VaIcon(name="email" size="18px")
            span Email
          a.contact-card__chip(
            v-if="profile.phone"
            :href="'tel:' + profile.phone"
          )
            VaIcon(name="phone" size="18px")
            span Call
          a.contact-card__chip(
            v-if="profile.linkedin"
            :href="formatSocialLink(profile.linkedin, 'linkedin')"
            target="_blank"
            rel="noopener noreferrer"
          )
            VaIcon(name="link" size="18px")
            span LinkedIn

      ul.contact-card__details(v-if="hasDetailRows")
        li(v-if="profile.email")
          span.label Email
          a(:href="'mailto:' + profile.email") {{ profile.email }}
        li(v-if="profile.phone")
          span.label Phone
          a(:href="'tel:' + profile.phone") {{ profile.phone }}
        li(v-if="hasAddress")
          span.label Address
          span {{ formattedAddress }}

      ul.contact-card__links(v-if="visibleLinks.length")
        li(v-for="link in visibleLinks" :key="link.key")
          a(:href="link.href" target="_blank" rel="noopener noreferrer")
            span {{ link.label }}
            VaIcon(name="open_in_new" size="14px")

      footer.contact-card__foot
        a(href="https://www.billoai.com" target="_blank" rel="noopener noreferrer") BilloAI
        span · network → follow up
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '../../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  displayNameInitials,
  looksLikeFirebaseUid,
  normalizePublicProfileSlug,
  toPublicProfileDTO,
  applyPublicProfileDocumentMeta,
  isPublicProfileLive
} from '../../utils/publicProfile';

const route = useRoute();
const router = useRouter();
const user = ref(null);
const profile = ref(null);
const loading = ref(true);
const error = ref('');
const errorHint = ref("We couldn't find this profile. It might be private or no longer available.");
const isOwnerPreviewBlocked = ref(false);
const profileAvatarBroken = ref(false);
let unsubAuth = null;

const profileInitials = computed(() => displayNameInitials(profile.value?.displayName));
const showProfilePhoto = computed(
  () => !!(profile.value?.photoURL && !profileAvatarBroken.value)
);

const isOwner = computed(() => {
  return !!(user.value?.uid && profile.value?.id && user.value.uid === profile.value.id);
});

const roleLine = computed(() => {
  if (!profile.value) return '';
  return [profile.value.title, profile.value.company].filter(Boolean).join(' · ');
});

const hasAddress = computed(() => {
  const p = profile.value;
  return !!(p?.addressLine1 || p?.city || p?.state || p?.zipCode);
});

const formattedAddress = computed(() => {
  if (!profile.value) return '';
  return [
    profile.value.addressLine1,
    profile.value.addressLine2,
    profile.value.city,
    profile.value.state,
    profile.value.zipCode
  ]
    .filter(Boolean)
    .join(', ');
});

const hasQuickActions = computed(() => {
  const p = profile.value;
  return !!(p?.email || p?.phone || p?.linkedin);
});

const hasDetailRows = computed(() => {
  const p = profile.value;
  return !!(p?.email || p?.phone || hasAddress.value);
});

const LINK_DEFS = [
  { key: 'linkedin', label: 'LinkedIn', platform: 'linkedin' },
  { key: 'twitter', label: 'X / Twitter', platform: 'twitter' },
  { key: 'instagram', label: 'Instagram', platform: 'instagram' },
  { key: 'facebook', label: 'Facebook', platform: 'facebook' },
  { key: 'tiktok', label: 'TikTok', platform: 'tiktok' },
  { key: 'github', label: 'GitHub', platform: 'github' },
  { key: 'otherLink', label: 'Website', platform: 'other' }
];

const visibleLinks = computed(() => {
  const p = profile.value;
  if (!p) return [];
  const out = [];
  for (const def of LINK_DEFS) {
    const raw = p[def.key];
    if (!raw) continue;
    // LinkedIn already in quick actions
    if (def.key === 'linkedin') continue;
    out.push({
      key: def.key,
      label: def.label,
      href: formatSocialLink(raw, def.platform)
    });
  }
  if (Array.isArray(p.customLinks)) {
    p.customLinks.forEach((link, i) => {
      if (!link?.url) return;
      out.push({
        key: `custom-${link.id || i}`,
        label: link.title || 'Link',
        href: formatSocialLink(link.url, 'other')
      });
    });
  }
  return out;
});

watch(
  () => [profile.value?.id, profile.value?.photoURL],
  () => {
    profileAvatarBroken.value = false;
  }
);

function onProfileAvatarError() {
  profileAvatarBroken.value = true;
}

function formatSocialLink(url, platform) {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  switch (platform) {
    case 'tiktok':
      return `https://tiktok.com/${url.startsWith('@') ? url.slice(1) : url}`;
    case 'twitter':
      return `https://twitter.com/${url.startsWith('@') ? url.slice(1) : url}`;
    case 'instagram':
      return `https://instagram.com/${url.startsWith('@') ? url.slice(1) : url}`;
    case 'linkedin':
      return `https://linkedin.com/in/${url}`;
    case 'github':
      return `https://github.com/${url}`;
    default:
      return `https://${url}`;
  }
}

async function loadOwnerDoc(param) {
  const uid = user.value?.uid;
  if (!uid) return null;

  if (param === uid || looksLikeFirebaseUid(param)) {
    if (param !== uid) return null;
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { id: snap.id, data: snap.data() };
  }

  const slug = normalizePublicProfileSlug(param.toLowerCase());
  if (!slug) return null;
  const own = await getDoc(doc(db, 'users', uid));
  if (!own.exists()) return null;
  const data = own.data();
  if (normalizePublicProfileSlug(data.publicProfileSlug || '') === slug) {
    return { id: own.id, data };
  }
  return null;
}

async function loadPublicViaApi(param) {
  const res = await fetch(`/api/public-profile/${encodeURIComponent(param)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('api_failed');
  return res.json();
}

async function loadProfile() {
  try {
    loading.value = true;
    error.value = '';
    errorHint.value = "We couldn't find this profile. It might be private or no longer available.";
    isOwnerPreviewBlocked.value = false;
    profile.value = null;

    const param = String(route.params.username || '').trim();
    if (!param) {
      error.value = 'Profile not found';
      return;
    }

    // Owner can always open their own card (even before go-live) via Firestore
    const owned = await loadOwnerDoc(param);
    if (owned) {
      const dto = toPublicProfileDTO(owned.id, owned.data);
      if (dto) {
        profile.value = dto;
      } else {
        // Not live yet — still show a private preview for the owner
        const v = owned.data.visibility || {};
        profile.value = {
          id: owned.id,
          slug: normalizePublicProfileSlug(owned.data.publicProfileSlug || ''),
          live: false,
          displayName: owned.data.displayName || '',
          title: owned.data.title || '',
          company: owned.data.company || '',
          bio: owned.data.bio || '',
          photoURL: owned.data.photoURL || '',
          email: v.email !== false ? owned.data.email || user.value?.email || '' : '',
          phone: v.phone !== false ? owned.data.phone || '' : '',
          addressLine1: v.address !== false ? owned.data.addressLine1 || '' : '',
          addressLine2: v.address !== false ? owned.data.addressLine2 || '' : '',
          city: v.address !== false ? owned.data.city || '' : '',
          state: v.address !== false ? owned.data.state || '' : '',
          zipCode: v.address !== false ? owned.data.zipCode || '' : '',
          linkedin: v.linkedin !== false ? owned.data.linkedin || '' : '',
          twitter: v.twitter !== false ? owned.data.twitter || '' : '',
          instagram: v.instagram !== false ? owned.data.instagram || '' : '',
          facebook: v.facebook !== false ? owned.data.facebook || '' : '',
          tiktok: v.tiktok !== false ? owned.data.tiktok || '' : '',
          github: v.github !== false ? owned.data.github || '' : '',
          otherLink: v.otherLink !== false ? owned.data.otherLink || '' : '',
          customLinks: Array.isArray(owned.data.customLinks) ? owned.data.customLinks : [],
          profileCompleted: !!owned.data.profileCompleted
        };
        if (!isPublicProfileLive(owned.data)) {
          errorHint.value =
            'Your profile is not live yet. Finish the checklist so others can open this link.';
        }
      }
      if (profile.value.slug && param === profile.value.id) {
        await router.replace(`/profile/${profile.value.slug}`);
      }
      applyPublicProfileDocumentMeta(
        profile.value,
        typeof window !== 'undefined' ? window.location.href : ''
      );
      return;
    }

    // Visitors: server projection only (works with rules + no client permission errors)
    const publicProfile = await loadPublicViaApi(param);
    if (!publicProfile) {
      error.value = 'Profile not found';
      // If a logged-in user hit a dead UID link that is themself without slug path handled above
      if (user.value?.uid && param === user.value.uid) {
        isOwnerPreviewBlocked.value = true;
        error.value = 'Your profile is not live';
        errorHint.value = 'Set a public link and go live so people can open your card.';
      }
      return;
    }

    profile.value = publicProfile;
    if (publicProfile.slug && looksLikeFirebaseUid(param)) {
      await router.replace(`/profile/${publicProfile.slug}`);
    }
    applyPublicProfileDocumentMeta(
      profile.value,
      typeof window !== 'undefined' ? window.location.href : ''
    );
  } catch (err) {
    console.error('Error loading profile:', err);
    error.value = 'Failed to load profile';
    errorHint.value = 'Please try again in a moment.';
  } finally {
    loading.value = false;
  }
}

async function saveContact() {
  try {
    if (!profile.value) return;
    const photoUrl =
      profile.value.photoURL && !profileAvatarBroken.value ? profile.value.photoURL : '';
    const name = profile.value.displayName || 'Contact';
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${name}`,
      `N:${name.split(' ').reverse().join(';')}`,
      profile.value.title ? `TITLE:${profile.value.title}` : '',
      profile.value.company ? `ORG:${profile.value.company}` : '',
      profile.value.email ? `EMAIL;type=INTERNET:${profile.value.email}` : '',
      profile.value.phone ? `TEL;type=CELL:${profile.value.phone}` : '',
      hasAddress.value ? `ADR;type=WORK:;;${formattedAddress.value}` : '',
      photoUrl ? `PHOTO;VALUE=URL:${photoUrl}` : '',
      profile.value.linkedin
        ? `URL;type=LinkedIn:${formatSocialLink(profile.value.linkedin, 'linkedin')}`
        : '',
      profile.value.otherLink ? `URL:${formatSocialLink(profile.value.otherLink, 'other')}` : '',
      'END:VCARD'
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${name.replace(/\s+/g, '_')}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error saving contact:', err);
    error.value = 'Failed to save contact';
  }
}

onMounted(() => {
  unsubAuth = authService.onAuthStateChanged(async (newUser) => {
    user.value = newUser;
    await loadProfile();
  });
});

onUnmounted(() => {
  if (typeof unsubAuth === 'function') unsubAuth();
});

watch(
  () => route.params.username,
  () => {
    loadProfile();
  }
);
</script>

<style scoped>
.public-profile {
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(16, 185, 129, 0.12), transparent 55%),
    radial-gradient(900px 500px at 100% 0%, rgba(20, 184, 166, 0.1), transparent 50%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(15, 23, 42, 0.12);
  border-top-color: #0f766e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.contact-card {
  overflow: hidden;
  border-radius: 1.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 18px 40px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(8px);
}

.contact-card__hero {
  padding: 2rem 1.5rem 1.25rem;
  text-align: center;
  background: linear-gradient(160deg, #0f766e 0%, #134e4a 55%, #0b3b36 100%);
  color: #fff;
}

.contact-card__avatar {
  margin: 0 auto 1rem;
  display: flex;
  height: 5.5rem;
  width: 5.5rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 1.25rem;
  border: 3px solid rgba(255, 255, 255, 0.85);
  background: linear-gradient(145deg, #115e59, #042f2e);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
}

.contact-card__avatar img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.contact-card__name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.contact-card__role {
  margin: 0.4rem 0 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.88);
}

.contact-card__bio {
  margin: 0.85rem auto 0;
  max-width: 28rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}

.contact-card__owner {
  margin: 1rem 0 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

.contact-card__owner-link {
  margin-left: 0.35rem;
  font-weight: 600;
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.contact-card__cta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem 1.25rem 0.5rem;
}

.contact-card__primary {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(90deg, #059669, #0d9488);
  padding: 0.9rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 8px 20px rgba(5, 150, 105, 0.28);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.contact-card__primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(5, 150, 105, 0.35);
}

.contact-card__primary:active {
  transform: scale(0.98);
}

.contact-card__quick {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.contact-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #f8fafc;
  padding: 0.45rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
}

.contact-card__chip:hover {
  background: #f1f5f9;
}

.contact-card__details {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0 1.25rem;
}

.contact-card__details li {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  padding: 0.75rem 0;
  font-size: 0.9rem;
  color: #0f172a;
}

.contact-card__details .label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.contact-card__details a {
  color: #0f766e;
  text-decoration: none;
  word-break: break-all;
}

.contact-card__links {
  list-style: none;
  margin: 0;
  padding: 0.25rem 1.25rem 1rem;
}

.contact-card__links a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  padding: 0.7rem 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #0f172a;
  text-decoration: none;
}

.contact-card__links a:hover {
  color: #0f766e;
}

.contact-card__foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  padding: 0.85rem 1rem 1.1rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.contact-card__foot a {
  font-weight: 600;
  color: #0f766e;
  text-decoration: none;
}
</style>
