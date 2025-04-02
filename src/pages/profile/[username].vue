<route>
meta:
  title: Profile - BilloAI
</route>

<template lang="pug">
main(class="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-emerald-50")
  .max-w-2xl.mx-auto(class="px-4 sm:px-6 lg:px-8 py-8")
    //- Loading State
    .flex.justify-center.items-center(class="min-h-[60vh]" v-if="loading")
      .loading-spinner

    //- Error State
    .text-center.py-12(v-else-if="error")
      VaIcon(name="error" size="48px" class="text-red-500 mx-auto mb-4")
      h2.text-2xl.font-bold.text-gray-900.mb-2 {{ error }}
      p.text-gray-600.mb-6 We couldn't find this profile. It might have been removed or is no longer available.
      button(
        class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 mx-auto"
        @click="router.push('/')"
      )
        VaIcon(name="home" size="18px")
        span(class="font-medium") Return Home

    //- Profile Content
    template(v-else)
      //- Profile Header
      .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-6(class="sm:p-8")
        .flex.flex-col.items-center.text-center
          //- Profile Image
          .relative.mb-6
            img(
              :src="profile?.photoURL || '/default-avatar.png'"
              class="w-32 h-32 rounded-2xl object-cover ring-4 ring-emerald-100"
              alt="Profile picture"
            )
            .absolute.bottom-0.right-0.bg-emerald-500.text-white.p-2.rounded-full
              VaIcon(name="verified" size="20px")

          //- Profile Info
          .w-full
            h1.text-3xl.font-bold.text-gray-900.mb-2 {{ profile?.displayName }}
            p.text-gray-600.mb-6 {{ profile?.bio || 'No bio yet' }}
            
            //- Contact Information
            .space-y-4.mb-6
              .flex.items-center.justify-center.gap-2(v-if="profile?.email")
                VaIcon(name="email" size="18px" class="text-emerald-500")
                a.text-gray-700(:href="`mailto:${profile.email}`") {{ profile.email }}
              .flex.items-center.justify-center.gap-2(v-if="profile?.phone")
                VaIcon(name="phone" size="18px" class="text-emerald-500")
                a.text-gray-700(:href="`tel:${profile.phone}`") {{ profile.phone }}
              .flex.items-center.justify-center.gap-2(v-if="profile?.company")
                VaIcon(name="business" size="18px" class="text-emerald-500")
                span.text-gray-700 {{ profile.company }}
              .flex.items-center.justify-center.gap-2(v-if="profile?.title")
                VaIcon(name="work" size="18px" class="text-emerald-500")
                span.text-gray-700 {{ profile.title }}

            //- Save Contact Button
            button(
              class="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
              @click="saveContact"
            )
              VaIcon(name="person_add" size="18px")
              span(class="font-medium") Save Contact

            //- Call to Action for Non-Users
            .mt-6(v-if="!user")
              button(
                class="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
                @click="signIn"
              )
                VaIcon(name="rocket_launch" size="18px")
                span(class="font-medium") Join BilloAI to Connect

      //- Empty State
      .text-center.py-12(v-if="!loading && !profile")
        VaIcon(name="qr_code" size="48px" class="text-gray-400 mx-auto mb-4")
        h2.text-2xl.font-bold.text-gray-900.mb-2 No Business Cards Yet
        p.text-gray-600.mb-6 This user hasn't added any business cards to their profile yet.
        button(
          v-if="!user"
          class="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
          @click="signIn"
        )
          VaIcon(name="rocket_launch" size="18px")
          span(class="font-medium") Join BilloAI to Connect
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '../../services/authService';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const route = useRoute();
const router = useRouter();
const user = ref(null);
const profile = ref(null);
const loading = ref(true);
const error = ref('');

// Load profile data
async function loadProfile() {
  try {
    loading.value = true;
    error.value = '';
    
    // Get UID from route params
    const uid = route.params.username;
    
    // Get user profile directly by UID
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      error.value = 'Profile not found';
      return;
    }
    
    profile.value = {
      id: userDoc.id,
      ...userDoc.data()
    };
    
  } catch (err) {
    console.error('Error loading profile:', err);
    error.value = 'Failed to load profile';
  } finally {
    loading.value = false;
  }
}

// Auth functions
async function signIn() {
  try {
    await authService.signInWithGoogle();
    router.push('/');
  } catch (err) {
    console.error('Error signing in:', err);
    error.value = 'Failed to sign in';
  }
}

function saveContact() {
  // Create vCard content
  const vCard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.value.displayName}`,
    `N:${profile.value.displayName.split(' ').reverse().join(';')}`,
    profile.value.title ? `TITLE:${profile.value.title}` : '',
    profile.value.company ? `ORG:${profile.value.company}` : '',
    profile.value.email ? `EMAIL;type=INTERNET:${profile.value.email}` : '',
    profile.value.phone ? `TEL;type=WORK:${profile.value.phone}` : '',
    profile.value.addressLine1 ? `ADR;type=WORK:;;${profile.value.addressLine1}${profile.value.addressLine2 ? ',' + profile.value.addressLine2 : ''},${profile.value.city || ''},${profile.value.state || ''},${profile.value.zipCode || ''}` : '',
    'END:VCARD'
  ].filter(Boolean).join('\n');

  // Create blob and download link
  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${profile.value.displayName.replace(/\s+/g, '_')}.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Initialize
onMounted(async () => {
  // Check if user is logged in
  authService.onAuthStateChange((newUser) => {
    user.value = newUser;
  });
  
  // Load profile data
  await loadProfile();
});
</script>

<style scoped>
/* Loading spinner animation */
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 