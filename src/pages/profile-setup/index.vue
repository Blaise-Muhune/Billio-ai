<route>
meta:
  title: BilloAI - Complete Your Profile
</route>

<template lang="pug">
main.p-8.max-w-2xl.mx-auto
  .bg-white.rounded-xl.shadow-lg.p-6
    .text-center.mb-8
      h1.text-3xl.font-bold.text-emerald-600 {{ isEditing ? 'Edit Profile' : 'Complete Your Profile' }}
      p.text-gray-600.mt-2 {{ isEditing ? 'Update your information' : "Let's get to know you better" }}
    
    form(@submit.prevent="saveProfile").space-y-6
      // Profile Picture
      .flex.flex-col.items-center.gap-4
        .relative
          img(
            :src="profileImage || user?.photoURL"
            class="w-32 h-32 rounded-full object-cover ring-4 ring-emerald-100"
          )
          button(
            type="button"
            class="absolute bottom-0 right-0 bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 transition-colors duration-200"
            @click="$refs.imageInput.click()"
          )
            VaIcon(name="camera" size="20px")
          input(
            type="file"
            ref="imageInput"
            class="hidden"
            accept="image/*"
            @change="handleImageSelect"
          )
        p.text-sm.text-gray-500 Upload a profile picture (optional)

      // Name
      .space-y-2
        label.block.text-sm.font-medium.text-gray-700
          | Full Name
          span.text-red-500.ml-1 *
        input(
          type="text"
          v-model="formData.displayName"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          required
        )

      // Email
      .space-y-2
        label.block.text-sm.font-medium.text-gray-700
          | Email
          span.text-red-500.ml-1 *
        input(
          type="email"
          v-model="formData.email"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          required
        )

      // Company
      .space-y-2
        label.block.text-sm.font-medium.text-gray-700
          | Company
          span.text-gray-500.text-sm.ml-1 (optional)
        input(
          type="text"
          v-model="formData.company"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        )

      // Title
      .space-y-2
        label.block.text-sm.font-medium.text-gray-700
          | Job Title
          span.text-gray-500.text-sm.ml-1 (optional)
        input(
          type="text"
          v-model="formData.title"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        )

      // Phone Number
      .space-y-2
        label.block.text-sm.font-medium.text-gray-700
          | Phone Number
          span.text-gray-500.text-sm.ml-1 (optional)
        input(
          type="tel"
          v-model="formData.phone"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="+1 (555) 555-5555"
        )

      // Address
      .space-y-4
        label.block.text-sm.font-medium.text-gray-700
          | Address
          span.text-gray-500.text-sm.ml-1 (optional)
        .space-y-3
          // Address Line 1
          input(
            type="text"
            v-model="formData.addressLine1"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Street address"
          )

          // Address Line 2 (Optional)
          input(
            type="text"
            v-model="formData.addressLine2"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Apartment, suite, unit, etc. (optional)"
          )

          // City, State, ZIP
          .grid.grid-cols-3.gap-4
            input(
              type="text"
              v-model="formData.city"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="City"
            )
            input(
              type="text"
              v-model="formData.state"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="State"
            )
            input(
              type="text"
              v-model="formData.zipCode"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="ZIP code"
            )

      // Required fields note
      .text-sm.text-gray-500
        span.text-red-500 * 
        | Required fields

      // Error message
      .text-red-500.text-sm(v-if="error") {{ error }}

      // QR Code Section
      .mt-8.pt-8.border-t.border-gray-100
        .text-center.mb-6
          h2.text-xl.font-semibold.text-gray-900 Your Info QR Code
          p.text-gray-600.mt-2 Share your Info easily by scanning this QR code
        
        .flex.flex-col.items-center.gap-4
          .bg-white.p-4.rounded-xl.border.border-gray-100
            QrcodeVue(
              :value="profileUrl"
              :size="200"
              level="H"
              render-as="svg"
              class="mx-auto"
            )
          .flex.items-center.gap-2.text-sm.text-gray-600
            VaIcon(name="qr_code" size="18px")
            span {{ profileUrl }}
          button(
            type="button"
            class="text-emerald-600 hover:text-emerald-700 flex items-center gap-2 text-sm font-medium"
            @click="copyProfileUrl"
          )
            VaIcon(name="content_copy" size="18px")
            span Copy Profile Link

      button(
        type="submit"
        class="w-full bg-emerald-500 text-white rounded-lg px-6 py-3 hover:bg-emerald-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="saving"
      )
        VaIcon(name="check" size="20px")
        | {{ saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Complete Profile') }}
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authService } from '../../services/authService';
import { storage } from '../../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import QrcodeVue from 'qrcode.vue';

const router = useRouter();
const route = useRoute();
const user = ref(null);
const error = ref('');
const saving = ref(false);
const imageInput = ref(null);
const profileImage = ref(null);
const isEditing = ref(false);

const formData = ref({
  displayName: '',
  email: '',
  company: '',
  title: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: ''
});

onMounted(async () => {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    router.push('/');
    return;
  }

  user.value = currentUser;
  
  // Check if we're editing or completing profile
  const userProfile = await authService.getUserProfile();
  isEditing.value = !!userProfile?.profileCompleted;

  if (isEditing.value) {
    // Load existing profile data
    formData.value = {
      displayName: currentUser.displayName || '',
      email: currentUser.email || '',
      company: userProfile.company || '',
      title: userProfile.title || '',
      phone: userProfile.phone || '',
      addressLine1: userProfile.addressLine1 || '',
      addressLine2: userProfile.addressLine2 || '',
      city: userProfile.city || '',
      state: userProfile.state || '',
      zipCode: userProfile.zipCode || ''
    };
  } else {
    // New user setup
    formData.value = {
      displayName: currentUser.displayName || '',
      email: currentUser.email || '',
      company: '',
      title: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: ''
    };
  }
});

async function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        profileImage.value = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error reading image:', err);
      error.value = 'Error processing image';
    }
  }
}

async function saveProfile() {
  try {
    saving.value = true;
    error.value = '';

    // Upload profile image if selected
    let photoURL = user.value.photoURL;
    if (profileImage.value) {
      const imageFile = await fetch(profileImage.value).then(r => r.blob());
      const imageRef = storageRef(storage, `profile-images/${user.value.uid}`);
      await uploadBytes(imageRef, imageFile);
      photoURL = await getDownloadURL(imageRef);
    }

    // Update user profile
    await authService.updateProfile({
      displayName: formData.value.displayName,
      photoURL,
      email: formData.value.email
    });

    // Save additional profile data to Firestore
    await authService.saveUserProfile({
      company: formData.value.company,
      title: formData.value.title,
      phone: formData.value.phone,
      addressLine1: formData.value.addressLine1,
      addressLine2: formData.value.addressLine2,
      city: formData.value.city,
      state: formData.value.state,
      zipCode: formData.value.zipCode
    });

    // Redirect to main page
    router.push('/');
  } catch (err) {
    console.error('Error saving profile:', err);
    error.value = 'Error saving profile. Please try again.';
  } finally {
    saving.value = false;
  }
}

// Compute profile URL
const profileUrl = computed(() => {
  if (!user.value?.uid) return '';
  return `${window.location.origin}/profile/${user.value.uid}`;
});

// Copy profile URL to clipboard
async function copyProfileUrl() {
  try {
    await navigator.clipboard.writeText(profileUrl.value);
    // You could add a toast notification here
  } catch (err) {
    console.error('Error copying URL:', err);
  }
}
</script> 