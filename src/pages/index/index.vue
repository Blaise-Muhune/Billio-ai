<route>
meta:
  title: BilloAI - Smart Business Card Manager
</route>

<template lang="pug">
main.p-8.max-w-7xl.mx-auto(class="bg-gradient-to-b from-gray-50 to-white min-h-screen")
  .flex.flex-col.gap-8
    // Header section
    header.text-center.mb-12
      h1.text-6xl.font-bold(class="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent") BilloAI
      p.text-gray-600.mt-4.text-xl(class="font-light") Transform your business connections into meaningful relationships
    
    // Auth section
    .bg-white.rounded-2xl.shadow-xl.p-8.text-center(v-if="!user" class="border border-gray-100")
      p.text-gray-600.mb-8.text-xl(class="font-light") Join BilloAI to revolutionize your networking experience
      button(
        class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-10 py-4 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        @click="signIn"
      )
        VaIcon(name="google" size="24px")
        span(class="font-medium") Sign in with Google
    
    // Main content (only shown when logged in)
    template(v-else)
      // User's Business Card
      .bg-white.rounded-2xl.shadow-xl.p-8(class="border border-gray-100")
        .flex.items-center.justify-between.mb-6
          h3.text-xl.font-semibold Your Profile
          .flex.items-center.gap-3
            button(
              class="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all duration-200 px-4 py-2 rounded-xl flex items-center gap-2"
              @click="editProfile"
            )
              VaIcon(name="edit" size="18px")
              span.text-sm.font-medium Edit Profile
            button(
              class="text-gray-600 hover:text-gray-800 transition-all duration-200 p-2 rounded-xl hover:bg-gray-100"
              @click="signOut"
            )
              VaIcon(name="logout" size="20px")
        .flex.items-start.gap-8
          .flex-shrink-0
            img(:src="user?.photoURL" class="w-32 h-32 rounded-2xl object-cover ring-4 ring-emerald-100")
          .flex-1
            h4.text-3xl.font-bold(
              :style=`{
                color: '#111827',
                fontFamily: getFontFamily('modern')
              }`
            ) {{ user?.displayName }}
            p.text-xl(
              :style=`{
                color: '#4B5563',
                fontFamily: getFontFamily('modern')
              }`
            ) {{ user?.company || 'Company Name' }}
            p.text-lg.mt-1(
              :style=`{
                color: '#6B7280',
                fontFamily: getFontFamily('modern')
              }`
            ) {{ user?.title || 'Your Title' }}
            .mt-6.grid.gap-4(class="grid-cols-1 md:grid-cols-2")
              a.flex.items-center.gap-3.text-base(class="text-emerald-600 hover:text-emerald-700 transition-colors duration-200")(
                v-if="user?.email"
                :href="'mailto:' + user.email"
              )
                VaIcon(name="email" size="18px")
                | {{ user.email }}
              a.flex.items-center.gap-3.text-base(class="text-emerald-600 hover:text-emerald-700 transition-colors duration-200")(
                v-if="user?.phone"
                :href="'tel:' + user.phone"
              )
                VaIcon(name="phone" size="18px")
                | {{ user?.phone }}
              a.flex.items-center.gap-3.text-base(class="text-emerald-600 hover:text-emerald-700 transition-colors duration-200")(
                v-if="user?.website"
                :href="user.website.startsWith('http') ? user.website : 'https://' + user.website"
                target="_blank"
                rel="noopener noreferrer"
              )
                VaIcon(name="language" size="18px")
                | {{ user.website }}
              p.flex.items-center.gap-3.text-base(class="text-gray-600")(
                v-if="user?.address"
              )
                VaIcon(name="location_on" size="18px")
                | {{ user.address }}
    
    // Upload section (moved outside template block)
    .bg-white.rounded-2xl.shadow-xl.p-8(class="border border-gray-100" v-if="user")
      // Event Selection (Optional)
      .mb-8
        h3.text-2xl.font-bold.mb-4 Select Event (Optional)
        .flex.flex-col.gap-4
          .flex.items-center.gap-4
            select(
              v-model="selectedEvent"
              class="flex-1 border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              @change="handleEventChange"
            )
              option(value="") No Event
              option(v-for="event in events" :key="event.id" :value="event.id") {{ event.name }}
            button(
              class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-8 py-3 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              @click="showCreateEventModal = true"
            )
              VaIcon(name="add" size="18px")
              span(class="font-medium") Create New Event
          
          // Event Selection Notice
          .bg-emerald-50.rounded-xl.p-4.flex.items-center.gap-3(v-if="selectedEvent")
            VaIcon(name="info" size="20px" class="text-emerald-600")
            .flex-1
              p.text-emerald-800.font-medium Next upload will be saved to:
              p.text-emerald-600 {{ getEventName(selectedEvent) }}

      div(
        class="border-2 border-dashed border-gray-200 rounded-2xl p-12 hover:border-emerald-500 transition-all duration-300"
        @dragover.prevent
        @drop.prevent="handleDrop"
      )
        VaIcon(name="image" size="72px").text-emerald-400.mx-auto.mb-6
        h3.text-3xl.font-bold.mb-4 Upload Business Cards
        p.text-gray-600.mb-8.text-lg(class="font-light") Drag and drop your business cards or click to upload
        input(
          type="file"
          ref="fileInput"
          class="hidden"
          accept="image/*"
          @change="handleFileSelect"
        )
        button(
          class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-10 py-4 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$refs.fileInput.click()"
          :disabled="uploading"
        )
          VaIcon(name="upload" size="20px")
          span(class="font-medium") {{ uploading ? 'Processing...' : 'Select Files' }}
        .mt-8(v-if="uploading").flex.flex-col.items-center.gap-4
          .loading-spinner
          p.text-base.text-gray-600.font-medium {{ processingStatus }}

        .mt-6(v-if="error").text-red-500.bg-red-50.p-4.rounded-xl.text-base {{ error }}

      // Create Event Modal
      VaModal(
        v-model="showCreateEventModal"
        :hide-default-actions="true"
        class="rounded-2xl"
      )
        .p-8
          h3.text-2xl.font-bold.mb-6 Create New Event
          .space-y-4
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Event Name
              input(
                type="text"
                v-model="newEventName"
                class="w-full border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
                placeholder="Enter event name"
              )
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Event Date
              input(
                type="date"
                v-model="newEventDate"
                class="w-full border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              )
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Event Location
              input(
                type="text"
                v-model="newEventLocation"
                class="w-full border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
                placeholder="Enter event location"
              )
          .flex.justify-end.gap-4.mt-8
            button(
              class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              @click="showCreateEventModal = false"
            ) Cancel
            button(
              class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
              @click="createEvent"
              :disabled="!newEventName || !newEventDate"
            )
              VaIcon(name="add" size="16px")
              span(class="font-medium") Create Event

    // Event filter
    .bg-white.rounded-2xl.shadow-xl.p-6(class="border border-gray-100" v-if="user")
      .flex.items-center.gap-4
        select(
          v-model="selectedEventFilter"
          class="flex-1 border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
        )
          option(value="null") All Events
          option(v-for="event in events" :key="event.id" :value="event.id") {{ event.name }}
        button(
          class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-8 py-3 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          @click="loadCards"
        )
          VaIcon(name="search" size="18px")
          span(class="font-medium") Apply Filter

    // Cards list section
    .grid.gap-8(class="md:grid-cols-2 lg:grid-cols-3" v-if="user")
      .card-item(
        v-for="card in businessCards"
        :key="card.id"
        :class=`[
          'rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1',
          card.style?.layoutStyle === 'minimal' ? 'space-y-4' : 'space-y-3'
        ]`
        :style=`{
          backgroundColor: card.style?.backgroundColor || 'white',
          borderColor: card.style?.secondaryColor,
          borderWidth: '1px',
          borderStyle: 'solid'
        }`
      )
        // Action Buttons at the top
        .flex.items-center.justify-end.gap-2.mb-4
          button(
            class="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all duration-200 p-2 rounded-xl flex items-center tooltip-container shrink-0"
            @click.stop="confirmGenerateEmail(card)"
            :disabled="generatingDraft === card.id || loadingDrafts[card.id]"
          )
            VaIcon(name="smart_toy" size="20px")
            .tooltip.bg-gray-800.text-white.text-xs.px-2.py-1.rounded-lg.absolute.-top-8.-left-4.whitespace-nowrap
              | Generate AI Email
          button(
            class="flex items-center gap-2 px-3 py-1 rounded-lg"
            :style=`{
              backgroundColor: card.style?.backgroundColor === 'white' ? '#FEF3C7' : 
                            card.style?.backgroundColor === '#FEF3C7' ? '#FDE68A' :
                            card.style?.backgroundColor === '#FDE68A' ? '#FCD34D' :
                            card.style?.backgroundColor === '#FCD34D' ? '#FBBF24' :
                            card.style?.backgroundColor === '#FBBF24' ? '#F59E0B' :
                            card.style?.backgroundColor === '#F59E0B' ? '#D97706' :
                            card.style?.backgroundColor === '#D97706' ? '#B45309' :
                            card.style?.backgroundColor === '#B45309' ? '#92400E' :
                            card.style?.backgroundColor === '#92400E' ? '#78350F' :
                            card.style?.backgroundColor === '#78350F' ? '#451A03' :
                            '#FEF3C7',
              color: card.style?.primaryColor || '#059669'
            }`
            @click="openMoveToEventModal(card)"
          )
            VaIcon(name="event" size="16px")
            span.text-sm {{ card.eventId ? 'Change Event' : 'Add to Event' }}

        // Card Content
        .flex-1
          h3.text-2xl.font-bold(
            :style=`{
              color: card.style?.primaryColor || '#111827',
              fontFamily: getFontFamily(card.style?.fontStyle)
            }`
          ) {{ card.name }}
          p.text-lg(
            :style=`{
              color: card.style?.secondaryColor || '#4B5563',
              fontFamily: getFontFamily(card.style?.fontStyle)
            }`
          ) {{ card.company }}
          p.text-base.mt-1(
            v-if="card.title"
            :style=`{
              color: card.style?.secondaryColor || '#6B7280',
              fontFamily: getFontFamily(card.style?.fontStyle)
            }`
          ) {{ card.title }}
          
          // Contact Information
          .mt-6(class="space-y-3")
            template(v-for="(item, index) in contactItems(card)" :key="index")
              a.flex.items-center.gap-2.text-base(class="hover:opacity-80 transition-opacity duration-200")(
                v-if="item.link"
                :href="item.link"
                :target="item.external ? '_blank' : undefined"
                :rel="item.external ? 'noopener noreferrer' : undefined"
                :style=`{
                  color: card.style?.primaryColor || '#059669',
                  fontFamily: getFontFamily(card.style?.fontStyle)
                }`
              )
                VaIcon(:name="item.icon" size="16px")
                | {{ item.text }}
              
              p.flex.items-center.gap-2.text-base(
                v-else
                :style=`{
                  color: card.style?.secondaryColor || '#6B7280',
                  fontFamily: getFontFamily(card.style?.fontStyle)
                }`
              )
                VaIcon(:name="item.icon" size="16px")
                | {{ item.text }}

          // Event Information
          .mt-4(v-if="card.eventId")
            p.text-emerald-600.text-base.flex.items-center.gap-2
              VaIcon(name="calendar" size="16px")
              | {{ getEventName(card.eventId) }}

        // Email Drafts Button at the bottom
        .mt-6.border-t.border-gray-100.pt-4
          button(
            class="w-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 px-6 py-3 rounded-xl flex items-center justify-between"
            @click="openDraftsListModal(card)"
          )
            .flex.items-center.gap-3
              VaIcon(name="description" size="20px" class="text-emerald-600")
              h4.font-medium.text-gray-800 Email Drafts
            .flex.items-center.gap-2
              span.text-sm.text-gray-500.bg-white.px-2.py-1.rounded-lg {{ cardDrafts[card.id]?.length || 0 }}
              VaIcon(name="chevron_right" size="20px" class="text-gray-400")

    // Modals section
    template(v-if="user")
      // Email Drafts List Modal
      VaModal(
        v-model="showDraftsListModal"
        :hide-default-actions="true"
        class="rounded-2xl"
      )
        .p-8
          .flex.items-center.justify-between.mb-8
            .flex.items-center.gap-3
              h3.text-2xl.font-bold Email Drafts
              span.text-sm.text-gray-500.px-2.py-1.bg-gray-100.rounded-lg {{ cardDrafts[selectedCardForDrafts?.id]?.length || 0 }} drafts
            button(
              class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              @click="confirmGenerateEmail(selectedCardForDrafts)"
              :disabled="generatingDraft === selectedCardForDrafts?.id || loadingDrafts[selectedCardForDrafts?.id]"
            )
              .loading-spinner.w-4.h-4.border-2(v-if="generatingDraft === selectedCardForDrafts?.id")
              VaIcon(v-else name="smart_toy" size="16px")
              span.text-sm.font-medium {{ generatingDraft === selectedCardForDrafts?.id ? 'Generating...' : 'Generate New Draft' }}
          
          // Card Info Section
          .bg-gray-50.rounded-xl.p-4.mb-6.flex.items-center.gap-4
            VaIcon(name="person" size="24px" class="text-emerald-600")
            .flex-1
              p.font-medium.text-gray-900 {{ selectedCardForDrafts?.name }}
              p.text-sm.text-gray-600 {{ selectedCardForDrafts?.company }}
          
          // Drafts List
          .space-y-4.overflow-y-auto(style="max-height: 50vh")
            .draft-item(
              v-for="draft in cardDrafts[selectedCardForDrafts?.id]"
              :key="draft.id"
              class="bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-500 transition-all duration-200 cursor-pointer"
              @click="showDraftDetails(draft)"
            )
              .flex.items-start.justify-between.gap-4
                .flex-1
                  .flex.items-center.gap-2.mb-2
                    VaIcon(name="schedule" size="16px" class="text-gray-400")
                    p.text-sm.text-gray-500 {{ new Date(draft.createdAt.toDate()).toLocaleString() }}
                  p.text-base.text-gray-700.line-clamp-2 {{ draft.content }}
                .flex.flex-col.gap-2
                  button(
                    class="text-emerald-600 hover:text-emerald-700 transition-colors duration-200 p-2 rounded-lg hover:bg-emerald-50 tooltip-container"
                    @click.stop="copyDraft(draft.content)"
                  )
                    VaIcon(name="copy" size="16px")
                    .tooltip.bg-gray-800.text-white.text-xs.px-2.py-1.rounded-lg.absolute.-left-16.top-2.whitespace-nowrap
                      | Copy to clipboard
            
            // Empty State
            .empty-state(
              v-if="!cardDrafts[selectedCardForDrafts?.id]?.length"
              class="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
            )
              VaIcon(name="description" size="48px" class="text-gray-400 mb-4")
              p.text-gray-500.text-center.mb-2 No email drafts yet
              p.text-sm.text-gray-400.text-center Click "Generate New Draft" to create your first email
            
            // Loading State
            .loading-state(
              v-if="loadingDrafts[selectedCardForDrafts?.id]"
              class="flex justify-center py-12"
            )
              .loading-spinner
          
          // Footer
          .flex.justify-end.mt-6.pt-4.border-t.border-gray-200
            button(
              class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              @click="showDraftsListModal = false"
            ) Close

      // Email Draft Modal
      VaModal(
        v-model="showEmailModal"
        :hide-default-actions="true"
        class="rounded-2xl"
      )
        .p-8
          .flex.items-center.justify-between.mb-6
            h3.text-2xl.font-bold Email Draft
            .flex.items-center.gap-2
              p.text-sm.text-gray-500 {{ new Date(selectedDraft?.createdAt?.toDate()).toLocaleString() }}
          .bg-gray-50.p-6.rounded-xl.mb-6
            pre.whitespace-pre-wrap.text-base.leading-relaxed {{ emailDraft }}
          .flex.justify-end.gap-4
            button(
              class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              @click="showEmailModal = false"
            ) Close
            button(
              class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
              @click="copyEmailDraft"
            )
              VaIcon(name="copy" size="16px")
              span(class="font-medium") Copy

      // Confirmation Modal
      VaModal(
        v-model="showConfirmModal"
        :hide-default-actions="true"
        class="rounded-2xl"
      )
        .p-8
          h3.text-2xl.font-bold.mb-4 Generate AI Email
          p.text-gray-600.mb-6.text-lg(class="font-light") Our AI will generate a personalized email draft based on the business card information. Would you like to proceed?
          .flex.justify-end.gap-4
            button(
              class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              @click="showConfirmModal = false"
            ) Cancel
            button(
              class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
              @click="proceedWithGeneration"
            )
              VaIcon(name="smart_toy" size="16px")
              span(class="font-medium") Generate with AI

      // Move to Event Modal
      VaModal(
        v-model="showMoveToEventModal"
        :hide-default-actions="true"
        class="rounded-2xl"
      )
        .p-8
          h3.text-2xl.font-bold.mb-6 {{ selectedCardForMove?.eventId ? 'Change Event' : 'Add to Event' }}
          .space-y-4
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Select Event
              select(
                v-model="selectedEventForMove"
                class="w-full border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              )
                option(value="") No Event
                option(v-for="event in events" :key="event.id" :value="event.id") {{ event.name }}
          .flex.justify-end.gap-4.mt-8
            button(
              class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              @click="showMoveToEventModal = false"
            ) Cancel
            button(
              class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
              @click="moveCardToEvent"
              :disabled="!selectedEventForMove && selectedCardForMove?.eventId"
            )
              VaIcon(name="event" size="16px")
              span(class="font-medium") {{ selectedCardForMove?.eventId ? 'Change Event' : 'Add to Event' }}
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { businessCardService } from '../../services/businessCardService';
import { authService } from '../../services/authService';
import { useRouter } from 'vue-router';

const user = ref(null);
const businessCards = ref([]);
const uploading = ref(false);
const processingStatus = ref('');
const error = ref('');
const fileInput = ref(null);
const selectedEventFilter = ref('null');
const showEmailModal = ref(false);
const emailDraft = ref('');
const showDraftsModal = ref(false);
const emailDrafts = ref([]);
const cardDrafts = ref({});
const generatingDraft = ref(null);
const loadingDrafts = ref({});
const expandedDrafts = ref({});
const router = useRouter();
const showConfirmModal = ref(false);
const selectedCardForGeneration = ref(null);
const events = ref([]);
const selectedEvent = ref('');
const showCreateEventModal = ref(false);
const newEventName = ref('');
const newEventDate = ref('');
const newEventLocation = ref('');
const showMoveToEventModal = ref(false);
const selectedCardForMove = ref(null);
const selectedEventForMove = ref('');
const showDraftsListModal = ref(false);
const selectedCardForDrafts = ref(null);
const selectedDraft = ref(null);

const STORAGE_KEY = 'selectedEvent';

// Auth state management
onMounted(() => {
  authService.onAuthStateChange((newUser) => {
    user.value = newUser;
    if (newUser) {
      loadCards();
      loadEvents();
      // Load saved event selection
      const savedEvent = localStorage.getItem(STORAGE_KEY);
      if (savedEvent) {
        selectedEvent.value = savedEvent;
      }
    }
  });
});

async function signIn() {
  try {
    await authService.signInWithGoogle();
  } catch (err) {
    error.value = 'Error signing in';
    console.error(err);
  }
}

async function signOut() {
  try {
    await authService.signOut();
    businessCards.value = [];
  } catch (err) {
    error.value = 'Error signing out';
    console.error(err);
  }
}

async function loadCards() {
  try {
    businessCards.value = await businessCardService.getCards(selectedEventFilter.value === 'null' ? null : selectedEventFilter.value);
    // Initialize expandedDrafts for each card
    businessCards.value.forEach(card => {
      expandedDrafts.value[card.id] = false;
    });
    // Load drafts for all cards
    for (const card of businessCards.value) {
      await loadDrafts(card.id);
    }
  } catch (err) {
    error.value = 'Error loading business cards';
    console.error(err);
  }
}

async function handleFileSelect(event) {
  const files = event.target.files;
  if (files.length > 0) {
    await uploadFile(files[0]);
  }
}

async function handleDrop(event) {
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    await uploadFile(files[0]);
  }
}

async function uploadFile(file) {
  if (!file.type.startsWith('image/')) {
    error.value = 'Please upload an image file';
    return;
  }

  uploading.value = true;
  error.value = '';
  processingStatus.value = 'Starting upload...';

  try {
    const card = await businessCardService.uploadCard(
      file, 
      selectedEvent.value || null,
      (status) => {
        processingStatus.value = status;
      }
    );
    businessCards.value.unshift(card);
    // Initialize expandedDrafts for the new card
    expandedDrafts.value[card.id] = false;
  } catch (err) {
    error.value = 'Error uploading business card';
    console.error(err);
  } finally {
    uploading.value = false;
    processingStatus.value = '';
  }
}

async function generateEmailDraft(card) {
  try {
    generatingDraft.value = card.id;
    error.value = '';
    
    const draft = await businessCardService.generateEmailDraft(card);
    console.log('Generated draft:', draft);
    
    // Reload drafts for this card
    await loadDrafts(card.id);
    
    // Show the new draft
    emailDraft.value = draft.content;
    showEmailModal.value = true;
  } catch (err) {
    console.error('Error generating draft:', err);
    error.value = 'Error generating email draft';
  } finally {
    generatingDraft.value = null;
  }
}

async function loadDrafts(cardId) {
  try {
    loadingDrafts.value[cardId] = true;
    const drafts = await businessCardService.getEmailDrafts(cardId);
    cardDrafts.value[cardId] = drafts;
    console.log('Loaded drafts for card:', cardId, drafts);
  } catch (err) {
    console.error('Error loading drafts:', err);
    error.value = 'Error loading email drafts';
  } finally {
    loadingDrafts.value[cardId] = false;
  }
}

function copyEmailDraft() {
  navigator.clipboard.writeText(emailDraft.value);
  // You could add a toast notification here
}

function editProfile() {
  router.push('/profile-setup');
}

function copyDraft(content) {
  navigator.clipboard.writeText(content);
  // You could add a toast notification here
}

function showDraftDetails(draft) {
  selectedDraft.value = draft;
  emailDraft.value = draft.content;
  showEmailModal.value = true;
  showDraftsListModal.value = false; // Close the drafts list modal
}

function toggleDrafts(cardId) {
  expandedDrafts.value[cardId] = !expandedDrafts.value[cardId];
}

function confirmGenerateEmail(card) {
  selectedCardForGeneration.value = card;
  showConfirmModal.value = true;
}

async function proceedWithGeneration() {
  if (selectedCardForGeneration.value) {
    showConfirmModal.value = false;
    await generateEmailDraft(selectedCardForGeneration.value);
    selectedCardForGeneration.value = null;
  }
}

function getFontFamily(fontStyle) {
  switch (fontStyle?.toLowerCase()) {
    case 'modern':
      return 'Inter, system-ui, sans-serif';
    case 'traditional':
      return 'Georgia, serif';
    case 'elegant':
      return 'Playfair Display, serif';
    default:
      return 'system-ui, sans-serif';
  }
}

function contactItems(card) {
  return [
    card.email && {
      icon: 'email',
      text: card.email,
      link: `mailto:${card.email}`
    },
    card.phone && {
      icon: 'phone',
      text: card.phone,
      link: `tel:${card.phone}`
    },
    card.website && {
      icon: 'language',
      text: card.website,
      link: card.website.startsWith('http') ? card.website : `https://${card.website}`,
      external: true
    },
    card.address && {
      icon: 'location_on',
      text: card.address
    }
  ].filter(Boolean);
}

async function loadEvents() {
  try {
    events.value = await businessCardService.getEvents();
    console.log('Loaded events:', events.value);
  } catch (err) {
    error.value = 'Error loading events';
    console.error('Error loading events:', err);
  }
}

async function createEvent() {
  try {
    error.value = '';
    const event = await businessCardService.createEvent({
      name: newEventName.value,
      date: newEventDate.value,
      location: newEventLocation.value
    });
    
    // Add the new event to the list
    events.value.unshift(event);
    
    // Reset form and close modal
    selectedEvent.value = event.id;
    showCreateEventModal.value = false;
    newEventName.value = '';
    newEventDate.value = '';
    newEventLocation.value = '';
    
    // Reload cards to ensure everything is in sync
    await loadCards();
    
    console.log('Event created successfully:', event);
  } catch (err) {
    error.value = 'Error creating event: ' + err.message;
    console.error('Error creating event:', err);
  }
}

function getEventName(eventId) {
  const event = events.value.find(e => e.id === eventId);
  return event ? event.name : 'Unknown Event';
}

function openMoveToEventModal(card) {
  selectedCardForMove.value = card;
  selectedEventForMove.value = card.eventId || '';
  showMoveToEventModal.value = true;
}

async function moveCardToEvent() {
  try {
    error.value = '';
    await businessCardService.updateCardEvent(selectedCardForMove.value.id, selectedEventForMove.value);
    
    // Update the card in the local state
    const cardIndex = businessCards.value.findIndex(c => c.id === selectedCardForMove.value.id);
    if (cardIndex !== -1) {
      businessCards.value[cardIndex] = {
        ...businessCards.value[cardIndex],
        eventId: selectedEventForMove.value
      };
    }
    
    showMoveToEventModal.value = false;
    selectedCardForMove.value = null;
    selectedEventForMove.value = '';
  } catch (err) {
    error.value = 'Error updating card event';
    console.error(err);
  }
}

// Add computed property for event options
const eventOptions = computed(() => {
  return [
    { id: null, name: 'All Events', date: '' },
    ...events.value.map(event => ({
      id: event.id,
      name: event.name,
      date: new Date(event.date).toLocaleDateString()
    }))
  ];
});

function openDraftsListModal(card) {
  selectedCardForDrafts.value = card;
  showDraftsListModal.value = true;
}

function handleEventChange() {
  // Save the selection to localStorage
  if (selectedEvent.value) {
    localStorage.setItem(STORAGE_KEY, selectedEvent.value);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
</script>

<style scoped>
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.w-4 {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.draft-item {
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.draft-item:hover {
  border-color: #10B981;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.draft-preview {
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.draft-preview:hover {
  border-color: #10B981;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
.group .opacity-0 {
  opacity: 0;
}

.tooltip-container {
  position: relative;
}

.tooltip-container:hover .tooltip {
  display: block;
}

.tooltip {
  display: none;
  z-index: 10;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
