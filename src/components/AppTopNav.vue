<template>
  <header class="app-top-nav" aria-label="Site">
    <div
      class="w-full border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/75"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-12 min-w-0 items-center justify-between gap-2 sm:h-14 sm:gap-2.5">
          <router-link
            to="/home"
            class="flex min-w-0 max-w-[42%] shrink-0 items-center rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 min-[400px]:max-w-none sm:gap-2"
            aria-label="BilloAI home"
          >
            <h1
              class="truncate bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-xl"
            >
              BilloAI
            </h1>
          </router-link>

          <nav
            v-if="user"
            class="ml-1 hidden items-center gap-1 border-l border-slate-200 pl-4 md:flex"
            aria-label="Main"
          >
            <router-link to="/dashboard" class="nav-home-link">
              <VaIcon name="contacts" size="16px" class="text-slate-500" />
              <span>Contacts</span>
            </router-link>
            <a :href="profileUrl" class="nav-home-link" target="_blank" rel="noopener noreferrer">
              <VaIcon name="open_in_new" size="16px" class="text-slate-500" />
              <span>Live profile</span>
            </a>
            <button type="button" class="nav-home-link" title="Scroll to QR code" @click="goToQrSection">
              <VaIcon name="qr_code" size="16px" class="text-slate-500" />
              <span>QR</span>
            </button>
          </nav>

          <div class="hidden min-w-0 md:flex md:flex-1" />

          <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <router-link
              v-if="user"
              to="/subscription"
              class="nav-home-plan"
              :class="isPaidPlan ? 'nav-home-plan--premium' : 'nav-home-plan--free'"
              :title="isPaidPlan ? 'Manage your plan' : 'Plans and upgrade'"
            >
              <VaIcon
                class="nav-home-plan__icon"
                :name="isPaidPlan ? 'workspace_premium' : 'payments'"
                size="14px"
              />
              <span class="nav-home-plan__label hidden sm:inline">
                {{ isPaidPlan ? subscriptionPlanLabel : 'Upgrade' }}
              </span>
            </router-link>

            <div v-if="user" class="relative shrink-0">
              <div
                class="profile-pic relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-emerald-200/90 bg-emerald-50/90 shadow-sm transition-colors hover:border-emerald-300"
                role="button"
                tabindex="0"
                aria-label="Account menu"
                :aria-expanded="showUserMenu ? 'true' : 'false'"
                aria-haspopup="true"
                @click.stop="toggleUserMenu"
                @keydown.enter.prevent="toggleUserMenu"
                @keydown.space.prevent="toggleUserMenu"
              >
                <img
                  v-if="user.photoURL && !navAvatarImgFailed"
                  :src="user.photoURL"
                  class="absolute inset-0 h-full w-full rounded-full object-cover"
                  alt=""
                  referrerpolicy="no-referrer"
                  decoding="async"
                  @error="navAvatarImgFailed = true"
                />
                <span
                  v-if="!user.photoURL || navAvatarImgFailed"
                  class="relative z-10 text-[11px] font-bold leading-none text-emerald-800"
                  aria-hidden="true"
                >
                  {{ displayNameInitials(user.displayName || user.email || '') }}
                </span>
                <div
                  v-if="isPaidPlan"
                  class="absolute -bottom-0.5 -right-0.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-2 ring-white"
                >
                  <VaIcon name="diamond" size="10px" />
                </div>
              </div>

              <div
                v-if="showUserMenu"
                class="user-menu absolute right-0 z-50 mt-2 w-52 origin-top-right transform overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl ring-1 ring-white/60 backdrop-blur-md transition-all duration-200 ease-in-out"
                @click.stop
              >
                <div class="py-1">
                  <a
                    :href="profileUrl"
                    class="nav-home-menu-item"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click="showUserMenu = false"
                  >
                    <VaIcon name="open_in_new" size="18px" />
                    <span>Live profile</span>
                  </a>
                  <router-link to="/profile-setup" class="nav-home-menu-item" @click="showUserMenu = false">
                    <VaIcon name="tune" size="18px" />
                    <span>Profile &amp; settings</span>
                  </router-link>
                  <router-link to="/subscription" class="nav-home-menu-item" @click="showUserMenu = false">
                    <VaIcon name="payments" size="18px" />
                    <span>Plan &amp; billing</span>
                  </router-link>
                  <button type="button" class="nav-home-menu-item nav-home-menu-item--danger" @click="onSignOut">
                    <VaIcon name="logout" size="18px" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
              aria-label="Open menu"
              @click="toggleMobileMenu"
            >
              <VaIcon name="menu" size="22px" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showMobileMenu"
      class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden"
      @click="showMobileMenu = false"
    />
    <aside
      class="fixed inset-y-0 left-0 z-50 flex min-h-screen w-[min(20rem,100vw-1rem)] max-w-[calc(100vw-1.5rem)] flex-col border-r border-slate-200/90 bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden"
      :class="showMobileMenu ? 'translate-x-0' : '-translate-x-full'"
    >
      <div
        class="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-white px-4 py-3.5"
      >
        <span class="text-xs font-bold uppercase tracking-widest text-emerald-900/80">Menu</span>
        <button
          type="button"
          class="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Close menu"
          @click="showMobileMenu = false"
        >
          <VaIcon name="close" size="22px" />
        </button>
      </div>
      <nav class="flex flex-col gap-1 p-3">
        <p class="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Work</p>
        <router-link v-if="user" to="/dashboard" class="nav-home-drawer-link" @click="showMobileMenu = false">
          <VaIcon name="contacts" size="20px" />
          <span>Contacts</span>
        </router-link>
        <button
          v-if="user"
          type="button"
          class="nav-home-drawer-link w-full text-left"
          @click="showMobileMenu = false; goToQrSection()"
        >
          <VaIcon name="qr_code" size="20px" />
          <span>QR code</span>
        </button>
        <p class="mt-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Your page</p>
        <a
          v-if="user"
          :href="profileUrl"
          class="nav-home-drawer-link"
          target="_blank"
          rel="noopener noreferrer"
          @click="showMobileMenu = false"
        >
          <VaIcon name="open_in_new" size="20px" />
          <span>Live profile</span>
        </a>
        <router-link v-if="user" to="/profile-setup" class="nav-home-drawer-link" @click="showMobileMenu = false">
          <VaIcon name="tune" size="20px" />
          <span>Profile &amp; settings</span>
        </router-link>
        <p class="mt-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Account</p>
        <router-link v-if="user" to="/subscription" class="nav-home-drawer-link" @click="showMobileMenu = false">
          <VaIcon name="payments" size="20px" />
          <span>{{ isPaidPlan ? 'Manage plan' : 'Upgrade plan' }}</span>
        </router-link>
        <router-link v-if="!user" to="/auth" class="nav-home-drawer-link" @click="showMobileMenu = false">
          <VaIcon name="login" size="20px" />
          <span>Sign in</span>
        </router-link>
      </nav>
      <div v-if="user" class="mt-auto border-t border-slate-100 p-3">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          @click="onSignOut"
        >
          <VaIcon name="logout" size="20px" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { paymentService } from '../services/paymentService';
import { buildProfileShareUrl, displayNameInitials } from '../utils/publicProfileSlug';

const route = useRoute();
const router = useRouter();

const user = ref(null);
const firestoreProfileSlug = ref('');
const showMobileMenu = ref(false);
const showUserMenu = ref(false);
const navAvatarImgFailed = ref(false);
const subscriptionPlan = ref('FREE');

watch(
  () => user.value?.photoURL,
  () => {
    navAvatarImgFailed.value = false;
  }
);

const profileUrl = computed(() => {
  if (!user.value?.uid) return '';
  return buildProfileShareUrl(user.value.uid, firestoreProfileSlug.value);
});

const isPaidPlan = computed(() => subscriptionPlan.value && subscriptionPlan.value !== 'FREE');

const subscriptionPlanLabel = computed(() => {
  const p = subscriptionPlan.value;
  if (p === 'BASIC' || p === 'PRO') return p.charAt(0) + p.slice(1).toLowerCase();
  return 'Premium';
});

async function refreshFirestoreProfileSlug() {
  firestoreProfileSlug.value = '';
  try {
    const p = await authService.getUserProfile();
    firestoreProfileSlug.value = (p && p.publicProfileSlug) || '';
  } catch {
    firestoreProfileSlug.value = '';
  }
}

async function refreshSubscriptionPlan() {
  if (!user.value) {
    subscriptionPlan.value = 'FREE';
    return;
  }
  try {
    const status = await paymentService.getSubscriptionStatus();
    subscriptionPlan.value = status.plan || 'FREE';
  } catch {
    subscriptionPlan.value = 'FREE';
  }
}

let unsubscribeAuth = null;

onMounted(() => {
  unsubscribeAuth = authService.onAuthStateChanged(async (currentUser) => {
    user.value = currentUser;
    if (currentUser) {
      await refreshFirestoreProfileSlug();
      await refreshSubscriptionPlan();
    } else {
      firestoreProfileSlug.value = '';
      subscriptionPlan.value = 'FREE';
    }
  });
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (typeof unsubscribeAuth === 'function') {
    unsubscribeAuth();
  }
  document.removeEventListener('click', handleClickOutside);
});

function handleClickOutside(event) {
  if (
    showUserMenu.value &&
    !event.target.closest('.user-menu') &&
    !event.target.closest('.profile-pic')
  ) {
    showUserMenu.value = false;
  }
}

function toggleMobileMenu() {
  showMobileMenu.value = !showMobileMenu.value;
  if (showMobileMenu.value) {
    showUserMenu.value = false;
  }
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
  if (showUserMenu.value) {
    showMobileMenu.value = false;
  }
}

function goToQrSection() {
  showUserMenu.value = false;
  showMobileMenu.value = false;
  if (route.path === '/home') {
    document.querySelector('#billo-qr-share')?.scrollIntoView({ behavior: 'smooth' });
  } else {
    router.push({ path: '/home', hash: '#billo-qr-share' });
  }
}

async function onSignOut() {
  try {
    showUserMenu.value = false;
    showMobileMenu.value = false;
    await authService.signOut();
    router.push('/auth');
  } catch (e) {
    console.error('Sign out failed', e);
  }
}
</script>

<style scoped>
.app-top-nav {
  @apply fixed left-0 right-0 top-0 z-30;
}
</style>
