<route>
meta:
  title: BilloAI — Get ready to follow up
  description: Set your name in under a minute, then scan your first card and send a warm follow-up from Gmail or Outlook.
  requiresAuth: true
  hideAppNav: true
</route>

<template lang="pug">
.billo-onboard(v-if="loading")
  .billo-onboard__loader
    .loading-spinner

.billo-onboard(v-else)
  .billo-onboard__atmosphere(aria-hidden="true")
  .billo-onboard__grain(aria-hidden="true")

  .billo-onboard__shell
    header.billo-onboard__brand
      Logo(classes="block h-8 w-auto sm:h-9")
      p.billo-onboard__eyebrow Follow-up for networking

    transition(
      mode="out-in"
      enter-active-class="billo-onboard-enter"
      leave-active-class="billo-onboard-leave"
    )
      //- Step 1 — identity (minimum to start)
      section.billo-onboard__stage(v-if="step === 1" key="identity")
        h1.billo-onboard__title
          span.block Send the follow-up
          span.block.billo-onboard__title-accent before you forget.
        p.billo-onboard__lede
          | One name. Optional photo. Then scan a card or contact screenshot.

        .billo-onboard__panel
          .billo-onboard__avatar-row
            button.billo-onboard__avatar(
              type="button"
              @click="imageInput?.click()"
              :aria-label="photoPreview ? 'Change photo' : 'Add a photo'"
            )
              img(
                v-if="photoPreview && !avatarBroken"
                :src="photoPreview"
                alt=""
                @error="avatarBroken = true"
              )
              span(v-else) {{ initials }}
              span.billo-onboard__avatar-badge
                VaIcon(name="photo_camera" size="16px")
            input(
              ref="imageInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="onPickPhoto"
            )
            .billo-onboard__avatar-copy
              p.font-semibold.text-slate-900 Photo optional
              p.text-sm.text-slate-600 Helps people recognize you later. Skip if you’re in a hurry.

          .billo-onboard__field
            label(for="ob-name") Your name
              span.req *
            input#ob-name.billo-input(
              v-model="displayName"
              type="text"
              autocomplete="name"
              placeholder="Alex Rivera"
              maxlength="80"
              @keydown.enter.prevent="goReady"
            )
          .billo-onboard__field-grid
            .billo-onboard__field
              label(for="ob-title") Title
                span.opt optional
              input#ob-title.billo-input(
                v-model="title"
                type="text"
                autocomplete="organization-title"
                placeholder="Founder"
                maxlength="80"
              )
            .billo-onboard__field
              label(for="ob-company") Company
                span.opt optional
              input#ob-company.billo-input(
                v-model="company"
                type="text"
                autocomplete="organization"
                placeholder="Acme"
                maxlength="80"
              )

          p.billo-onboard__hint(v-if="error" role="alert") {{ error }}

          button.billo-onboard__cta(
            type="button"
            :disabled="saving"
            @click="goReady"
          )
            span {{ saving ? 'One moment…' : 'Continue' }}
            VaIcon(name="arrow_forward" size="20px")

          p.billo-onboard__micro Only your name is required. Public profile links come later.

      //- Step 2 — ready for aha moment
      section.billo-onboard__stage(v-else key="ready")
        h1.billo-onboard__title
          span.block You’re set, {{ firstName }}.
          span.block.billo-onboard__title-accent Scan someone next.
        p.billo-onboard__lede
          | Billo drafts a short note. You open it in Gmail or Outlook — from you, not a random SaaS.

        ol.billo-onboard__path(aria-label="How Billo works")
          li
            span.num 1
            .copy
              strong Scan a card or screenshot
              span Desk photo, contact screen, LinkedIn — whatever you captured.
          li
            span.num 2
            .copy
              strong Get a human draft
              span Warm, short, grounded in who they are.
          li
            span.num 3
            .copy
              strong Send in one tap
              span Gmail or Outlook opens prefilled. You hit send.

        .billo-onboard__actions
          button.billo-onboard__cta(
            type="button"
            :disabled="saving"
            @click="finish({ startScan: true })"
          )
            VaIcon(name="photo_camera" size="20px")
            span {{ saving ? 'Saving…' : 'Scan my first card' }}

          button.billo-onboard__ghost(
            type="button"
            :disabled="saving"
            @click="finish({ startScan: false })"
          ) Explore the app first

        p.billo-onboard__micro
          | Public profile links & socials live in settings later — never required to follow up.
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import Logo from '../../components/Logo.vue';
import { authService } from '../../services/authService';
import { uploadImageToAzure } from '../../services/azureUploadService';
import { displayNameInitials } from '../../utils/publicProfileSlug';

const router = useRouter();
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const step = ref(1);
const user = ref(null);

const displayName = ref('');
const title = ref('');
const company = ref('');
const imageFile = ref(null);
const photoPreview = ref('');
const avatarBroken = ref(false);
const imageInput = ref(null);

const firstName = computed(() => {
  const n = displayName.value.trim();
  if (!n) return 'there';
  return n.split(/\s+/)[0];
});

const initials = computed(() => displayNameInitials(displayName.value || user.value?.displayName));

function getNameFromEmail(email) {
  if (!email) return '';
  return email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function getCompanyFromEmail(email) {
  if (!email) return '';
  const domain = email.split('@')[1];
  if (!domain) return '';
  const common = new Set([
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'live.com',
    'msn.com'
  ]);
  if (common.has(domain.toLowerCase())) return '';
  return domain
    .split('.')[0]
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function onPickPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    error.value = 'Please choose an image file.';
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'Keep the photo under 10MB.';
    return;
  }
  error.value = '';
  avatarBroken.value = false;
  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    photoPreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function goReady() {
  if (!displayName.value.trim()) {
    error.value = 'Add your name so drafts can sound like you.';
    return;
  }
  error.value = '';
  step.value = 2;
  nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

async function finish({ startScan }) {
  if (!displayName.value.trim()) {
    step.value = 1;
    error.value = 'Add your name so drafts can sound like you.';
    return;
  }
  if (!user.value) {
    router.push('/auth');
    return;
  }

  try {
    saving.value = true;
    error.value = '';

    let photoURL = user.value.photoURL || '';
    if (imageFile.value) {
      photoURL = await uploadImageToAzure(imageFile.value, 'profile-images');
    }

    const name = displayName.value.trim();
    await authService.updateProfile({
      displayName: name,
      photoURL: photoURL || ''
    });

    await authService.saveUserProfile({
      displayName: name,
      title: title.value.trim() || '',
      company: company.value.trim() || '',
      photoURL: photoURL || '',
      email: user.value.email || '',
      profileCompleted: true,
      onboardingVersion: 2,
      profileEnrichmentPending: true,
      firstRunChecklist: true,
      updatedAt: new Date(),
      visibility: {
        nameTitle: true,
        company: true,
        title: true,
        bio: true,
        email: true,
        phone: false,
        address: false,
        linkedin: true,
        github: true,
        twitter: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        spotify: true,
        soundcloud: true,
        youtubeMusic: true,
        appleMusic: true,
        otherLink: true,
        customLinks: {}
      }
    });

    try {
      localStorage.setItem('billo_first_run', '1');
      if (startScan) localStorage.setItem('billo_start_scan', '1');
    } catch {
      /* ignore */
    }

    router.push(startScan ? { path: '/home', query: { start: 'scan' } } : '/home');
  } catch (err) {
    console.error('Onboarding save failed:', err);
    error.value = err.message || 'Could not save. Please try again.';
    step.value = 1;
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    const current = authService.getCurrentUser();
    if (!current) {
      router.replace('/auth');
      return;
    }
    user.value = current;

    const profile = await authService.getUserProfile();
    if (profile?.profileCompleted) {
      router.replace('/home');
      return;
    }

    displayName.value =
      current.displayName || profile?.displayName || getNameFromEmail(current.email) || '';
    title.value = profile?.title || '';
    company.value = profile?.company || getCompanyFromEmail(current.email) || '';
    photoPreview.value = current.photoURL || profile?.photoURL || '';
  } catch (err) {
    console.error(err);
    error.value = 'Could not load your account.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.billo-onboard {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  color: #0f172a;
  font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  overflow-x: hidden;
}

.billo-onboard__atmosphere {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 90% 55% at 10% -10%, rgb(16 185 129 / 0.22), transparent 55%),
    radial-gradient(ellipse 70% 50% at 95% 15%, rgb(45 212 191 / 0.18), transparent 50%),
    radial-gradient(ellipse 60% 40% at 50% 100%, rgb(15 118 110 / 0.1), transparent 55%),
    linear-gradient(165deg, #f8fafc 0%, #ffffff 42%, #ecfdf5 100%);
  pointer-events: none;
}

.billo-onboard__grain {
  position: absolute;
  inset: 0;
  opacity: 0.035;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.billo-onboard__shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 40rem;
  margin: 0 auto;
  padding: clamp(1.5rem, 4vw, 2.75rem) 1.25rem 3rem;
}

.billo-onboard__brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.65rem;
  margin-bottom: clamp(1.75rem, 5vw, 2.75rem);
  animation: billo-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.billo-onboard__eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #0f766e;
}

.billo-onboard__stage {
  animation: billo-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.billo-onboard__title {
  margin: 0 0 0.85rem;
  font-family: 'Instrument Sans', 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(2rem, 6vw, 2.85rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.035em;
  color: #0f172a;
}

.billo-onboard__title-accent {
  color: #0f766e;
}

.billo-onboard__lede {
  margin: 0 0 1.75rem;
  max-width: 34rem;
  font-size: 1.05rem;
  line-height: 1.55;
  color: #475569;
}

.billo-onboard__panel {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: 1.35rem 1.25rem 1.5rem;
  border-radius: 1.35rem;
  background: rgb(255 255 255 / 0.88);
  border: 1px solid rgb(226 232 240 / 0.95);
  box-shadow:
    0 1px 0 rgb(255 255 255 / 0.8) inset,
    0 18px 40px -28px rgb(15 23 42 / 0.35);
  backdrop-filter: blur(8px);
}

.billo-onboard__avatar-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.billo-onboard__avatar {
  position: relative;
  flex-shrink: 0;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 999px;
  overflow: hidden;
  border: 0;
  padding: 0;
  cursor: pointer;
  background: linear-gradient(145deg, #134e4a, #0f766e);
  color: #fff;
  font-weight: 700;
  font-size: 1.15rem;
  box-shadow: 0 10px 24px -12px rgb(15 118 110 / 0.65);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.billo-onboard__avatar:hover {
  transform: translateY(-2px) scale(1.02);
}

.billo-onboard__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.billo-onboard__avatar-badge {
  position: absolute;
  right: 0.15rem;
  bottom: 0.15rem;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: #fff;
  color: #0f766e;
  box-shadow: 0 2px 8px rgb(15 23 42 / 0.15);
}

.billo-onboard__avatar-copy p {
  margin: 0;
}

.billo-onboard__avatar-copy p + p {
  margin-top: 0.2rem;
}

.billo-onboard__field label {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  margin-bottom: 0.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.billo-onboard__field .req {
  color: #dc2626;
}

.billo-onboard__field .opt {
  font-weight: 500;
  font-size: 0.75rem;
  color: #94a3b8;
}

.billo-onboard__field-grid {
  display: grid;
  gap: 0.9rem;
}

@media (min-width: 640px) {
  .billo-onboard__field-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.billo-onboard__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 3.15rem;
  margin-top: 0.35rem;
  padding: 0.85rem 1.25rem;
  border: 0;
  border-radius: 0.95rem;
  background: linear-gradient(105deg, #059669, #0d9488);
  color: #fff;
  font-size: 1rem;
  font-weight: 650;
  cursor: pointer;
  box-shadow: 0 14px 28px -16px rgb(5 150 105 / 0.9);
  transition:
    transform 0.2s ease,
    filter 0.2s ease,
    opacity 0.2s ease;
}

.billo-onboard__cta:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.billo-onboard__cta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.billo-onboard__ghost {
  width: 100%;
  min-height: 2.85rem;
  margin-top: 0.65rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.95rem;
  background: rgb(255 255 255 / 0.7);
  color: #334155;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.billo-onboard__ghost:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.billo-onboard__micro {
  margin: 0.85rem 0 0;
  text-align: center;
  font-size: 0.8rem;
  line-height: 1.45;
  color: #64748b;
}

.billo-onboard__hint {
  margin: 0;
  font-size: 0.875rem;
  color: #b91c1c;
}

.billo-onboard__path {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.billo-onboard__path li {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.82);
  border: 1px solid #e2e8f0;
  animation: billo-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.billo-onboard__path li:nth-child(2) {
  animation-delay: 0.08s;
}

.billo-onboard__path li:nth-child(3) {
  animation-delay: 0.16s;
}

.billo-onboard__path .num {
  flex-shrink: 0;
  width: 1.85rem;
  height: 1.85rem;
  display: grid;
  place-items: center;
  border-radius: 0.65rem;
  background: #ecfdf5;
  color: #0f766e;
  font-weight: 700;
  font-size: 0.85rem;
}

.billo-onboard__path .copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.billo-onboard__path strong {
  font-size: 0.98rem;
  color: #0f172a;
}

.billo-onboard__path span:not(.num) {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.4;
}

.billo-onboard__actions {
  display: flex;
  flex-direction: column;
}

.billo-onboard__link {
  color: #0f766e;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.billo-onboard__loader {
  min-height: 100dvh;
  display: grid;
  place-items: center;
}

.billo-onboard-enter {
  animation: billo-rise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.billo-onboard-leave {
  animation: billo-fade-out 0.22s ease both;
}

@keyframes billo-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes billo-fade-out {
  to {
    opacity: 0;
    transform: translateY(-6px);
  }
}
</style>
