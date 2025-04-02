<route>
meta:
  title: BilloAI - Smart Business Card Manager
</route>

<template lang="pug">
main(class="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex flex-col")
  //- Pre-login Hero Section
  .flex-1.w-full(v-if="!user")
    .max-w-7xl.mx-auto(class="px-4 sm:px-6 lg:px-8")
      //- Navigation
      nav.py-6.flex.items-center.justify-between
        .flex.items-center.gap-2
          h1.text-2xl.font-bold(class="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent") BilloAI
        .flex.items-center.gap-4
          select(
            v-model="selectedEventFilter"
            class="bg-white text-gray-900 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          )
            option(value="null") All Events
            option(
              v-for="event in events"
              :key="event.id"
              :value="event.id"
            ) {{ event.name }}
          button.flex.items-center.gap-2(
            class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-6 py-2.5 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            @click="signIn"
          )
            VaIcon(name="login" size="20px")
            span(class="font-medium") Sign In

      //- Hero Content
      .mt-24.mb-32.text-center
        h1.text-7xl.font-bold.mb-6
          span(class="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent") Transform
          span.text-gray-900  Your Network
        p.text-xl.text-gray-600.max-w-2xl.mx-auto.mb-12 Turn business cards into meaningful relationships with AI-powered networking tools and smart contact management.
        
        // CTA Button
        button(
          class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg rounded-2xl px-12 py-6 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-3 mx-auto shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          @click="signIn"
        )
          VaIcon(name="rocket_launch" size="24px")
          span(class="font-medium") Get Started with Google

        // Trust Indicators
        .mt-16.grid.grid-cols-3.gap-8.max-w-3xl.mx-auto
          .text-center
            .text-4xl.font-bold.bg-gradient-to-r.from-emerald-600.to-teal-500.bg-clip-text.text-transparent 10x
            p.text-gray-600.mt-2 Faster Networking
          .text-center
            .text-4xl.font-bold.bg-gradient-to-r.from-emerald-600.to-teal-500.bg-clip-text.text-transparent 100%
            p.text-gray-600.mt-2 Secure & Private
          .text-center
            .text-4xl.font-bold.bg-gradient-to-r.from-emerald-600.to-teal-500.bg-clip-text.text-transparent 24/7
            p.text-gray-600.mt-2 AI Assistance

      // Features Grid
      .grid.mt-24(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8")
        // Feature Cards
        .feature-card.bg-white.rounded-2xl.p-8.shadow-lg.border.border-gray-100.transform.transition-all.duration-300(
          v-for="feature in features"
          :key="feature.title"
          class="hover:-translate-y-1 hover:shadow-xl"
        )
          .bg-emerald-100.w-12.h-12.rounded-xl.flex.items-center.justify-center.mb-6
            VaIcon(:name="feature.icon" size="24px" class="text-emerald-600")
          h3.text-xl.font-bold.text-gray-900.mb-3 {{ feature.title }}
          p.text-gray-600 {{ feature.description }}

  // Post-login Dashboard
  .flex-1.w-full.flex.flex-col(v-else)
    //- Top Navigation Bar (Fixed)
    .w-full.bg-white.border-b.border-gray-100.fixed.top-0.z-50
      .max-w-7xl.mx-auto(class="px-4 sm:px-6 lg:px-8")
        .flex.items-center.justify-between.h-16
          .flex.items-center.gap-4
            img(:src="user?.photoURL" class="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-100")
            .flex.flex-col
              h2.text-lg.font-semibold.text-gray-900 {{ user?.displayName }}
              p.text-sm.text-gray-500 {{ user?.email }}
          .flex.items-center.gap-4
            //- User Menu
            .relative
              button(
                class="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl transition-all duration-200"
                @click="toggleUserMenu"
              )
                img(
                  :src="user.photoURL"
                  class="w-8 h-8 rounded-full"
                  alt="Profile picture"
                )
                span.font-medium {{ user.displayName }}
                VaIcon(name="expand_more" size="18px" class="text-gray-400")
              .absolute.right-0.mt-2.w-64.bg-white.rounded-xl.shadow-lg.border.border-gray-100.overflow-hidden(
                v-if="showUserMenu"
              )
                .p-2
                  a(
                    class="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-colors"
                    :href="`/profile/${user.uid}`"
                  )
                    VaIcon(name="person" size="18px")
                    span(class="font-medium") View Public Profile
                  button(
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    @click="router.push('/profile-setup')"
                  )
                    .flex.items-center.gap-2
                      VaIcon(name="settings" size="18px")
                      span Profile Settings
                  button(
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    @click="signOut"
                  )
                    .flex.items-center.gap-2
                      VaIcon(name="logout" size="18px")
                      span Sign Out

    //- Main Content Area (With top padding for fixed header)
    .flex-1.w-full(class="pt-16")
      .max-w-7xl.mx-auto(class="px-4 sm:px-6 lg:px-8 py-8")
        //- Quick Actions Bar
        .bg-gradient-to-r.from-emerald-500.to-teal-500.rounded-2xl.shadow-lg.p-6.mb-8
          .flex.flex-col.gap-4(class="sm:flex-row sm:items-center sm:justify-between")
            h3.text-xl.font-semibold.text-white Your Networking Hub
            .flex.flex-col.gap-4(class="sm:flex-row sm:items-center")
              // Event Selector
              .relative.flex.items-center.w-full(class="sm:w-auto")
                select(
                  v-model="selectedEventFilter"
                  class="w-full bg-white text-gray-900 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm appearance-none pr-8"
                )
                  option(value="null") All Events
                  option(
                    v-for="event in events"
                    :key="event.id"
                    :value="event.id"
                  ) {{ event.name }}
                VaIcon(name="expand_more" size="16px" class="text-gray-500 absolute right-3 pointer-events-none")
              .flex.items-center.gap-2.w-full(class="sm:w-auto")
                button(
                  class="flex-1 bg-white text-emerald-600 hover:bg-gray-50 transition-all duration-200 px-4 py-2 rounded-xl flex items-center justify-center gap-2 sm:flex-initial"
                  @click="showCreateEventModal = true"
                )
                  VaIcon(name="add" size="18px")
                  span.text-sm.font-medium New Event
                button(
                  class="flex-1 bg-white text-emerald-600 hover:bg-gray-50 transition-all duration-200 px-4 py-2 rounded-xl flex items-center justify-center gap-2 sm:flex-initial"
                  @click="$refs.fileInput.click()"
                )
                  VaIcon(name="upload" size="18px")
                  span.text-sm.font-medium Upload Card

        //- Hidden File Input
        input(
          type="file"
          ref="fileInput"
          class="hidden"
          accept="image/*"
          @change="handleFileSelect"
        )

        //- Upload Area
        .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-8.mb-8(v-if="!uploading")
          .border-2.border-dashed.border-gray-200.rounded-xl.p-8.transition-all.duration-300(
            class="hover:border-emerald-500"
            @dragover.prevent
            @drop.prevent="handleDrop"
          )
            .flex.flex-col.items-center.justify-center.text-center
              VaIcon(name="upload" size="48px" class="text-emerald-400 mb-4")
              h3.text-2xl.font-bold.text-gray-900.mb-2 Upload Business Cards
              p.text-gray-600.mb-6 Drag and drop your business cards or click to browse
              button(
                class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                @click="$refs.fileInput.click()"
              )
                VaIcon(name="file_upload" size="20px")
                span.font-medium Browse Files

        //- Upload Progress
        .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-8.mb-8(v-else)
          .flex.flex-col.items-center.justify-center
            .loading-spinner.mb-4
            p.text-lg.font-medium.text-gray-900.mb-2 Processing...
            p.text-gray-600 {{ processingStatus }}
            .mt-4(v-if="error")
              p.text-red-600.font-medium {{ error }}

        // Main Content Area
        .grid(class="grid-cols-1")
          // Business Cards Section
          div
            .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-6
              .flex.items-center.justify-between.mb-6
                h3.text-xl.font-semibold.text-gray-900 Business Cards
                .flex.items-center.gap-4
                  select(
                    v-model="selectedEventFilter"
                    class="border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  )
                    option(value="null") All Events
                    option(v-for="event in events" :key="event.id" :value="event.id") {{ event.name }}
                  button(
                    class="bg-emerald-500 text-white rounded-xl px-4 py-2 hover:bg-emerald-600 transition-all duration-200 flex items-center gap-2"
                    @click="loadCards"
                  )
                    VaIcon(name="refresh" size="18px")
                    span.text-sm.font-medium apply filters

              // Cards Grid
              .grid(
                class="grid-cols-1 gap-8 mt-6"
                class="md:grid-cols-2 md:gap-6"
              )
                .card-container(
                  v-for="card in sortedBusinessCards"
                  :key="card.id"
                  class="rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
                  :style=`{
                    backgroundColor: card.style?.backgroundColor || '#ffffff',
                    color: getContrastColor(card.style?.backgroundColor || '#ffffff'),
                    fontFamily: getFontFamily(card.style?.fontStyle),
                    borderColor: card.style?.secondaryColor || '#e5e7eb',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }`
                )
                  // Top Action Bar
                  .bg-gray-50.px-6.py-4.flex.flex-col.gap-3.border-b.border-gray-100(class="sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:py-3")
                    button(
                      class="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all duration-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                      @click.stop="confirmGenerateEmail(card)"
                      :disabled="generatingDraft === card.id || loadingDrafts[card.id]"
                      class="sm:w-auto"
                    )
                      VaIcon(name="smart_toy" size="16px")
                      span.font-medium Generate AI Email
                    .flex.items-center.gap-2.w-full.justify-end(class="sm:w-auto")
                      button(
                        class="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all duration-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                        @click="openMoveToEventModal(card)"
                        class="sm:flex-initial"
                      )
                        VaIcon(name="event" size="14px")
                        span.font-medium {{ card.eventId ? 'Change Event' : 'Add to Event' }}
                      button(
                        class="flex-1 bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                        @click.stop="confirmDeleteCard(card)"
                        class="sm:flex-initial"
                      )
                        VaIcon(name="delete" size="16px")
                        span.font-medium Delete

                  // Card Content
                  .flex-1.flex.flex-col.gap-6.p-8
                    // Name and Title
                    .space-y-2
                      h3.text-2xl.font-bold(:style="{ color: card.style?.primaryColor || '#1f2937' }") {{ card.name }}
                      p.text-gray-600.text-lg {{ card.title }}

                    // Contact Info
                    .space-y-3
                      // Emails
                      .relative.flex.items-center.gap-3(v-if="card.emails?.length > 0")
                        VaIcon(name="email" size="18px" :style="{ color: card.style?.secondaryColor || '#4B5563' }")
                        .flex.flex-col.w-full
                          .flex.items-center.justify-between.w-full
                            a.text-base(:style="{ color: card.style?.secondaryColor || '#4B5563' }" :href="'mailto:' + card.emails[0]") {{ card.emails[0] }}
                            button.p-1.rounded-lg.transition-colors(
                              v-if="card.emails.length > 1"
                              @click="toggleContactDropdown('email', card.id)"
                              class="hover:bg-gray-100"
                            )
                              VaIcon(name="expand_more" size="18px" class="text-gray-400")
                          .mt-1.w-full.bg-white.rounded-lg.shadow-lg.border.border-gray-200.overflow-hidden(
                            v-if="card.emails.length > 1 && expandedContact.type === 'email' && expandedContact.cardId === card.id"
                          )
                            a.block.px-4.py-2.text-sm.transition-colors(
                              v-for="email in card.emails.slice(1)"
                              :key="email"
                              :href="'mailto:' + email"
                              :style="{ color: card.style?.secondaryColor || '#4B5563' }"
                              class="hover:bg-gray-50"
                            ) {{ email }}

                      // Phone Numbers
                      .relative.flex.items-center.gap-3(v-if="card.phones?.length > 0")
                        VaIcon(name="phone" size="18px" :style="{ color: card.style?.secondaryColor || '#4B5563' }")
                        .flex.flex-col.w-full
                          .flex.items-center.justify-between.w-full
                            a.text-base(:style="{ color: card.style?.secondaryColor || '#4B5563' }" :href="'tel:' + card.phones[0]") {{ card.phones[0] }}
                            button.p-1.rounded-lg.transition-colors(
                              v-if="card.phones.length > 1"
                              @click="toggleContactDropdown('phone', card.id)"
                              class="hover:bg-gray-100"
                            )
                              VaIcon(name="expand_more" size="18px" class="text-gray-400")
                          .mt-1.w-full.bg-white.rounded-lg.shadow-lg.border.border-gray-200.overflow-hidden(
                            v-if="card.phones.length > 1 && expandedContact.type === 'phone' && expandedContact.cardId === card.id"
                          )
                            a.block.px-4.py-2.text-sm.transition-colors(
                              v-for="phone in card.phones.slice(1)"
                              :key="phone"
                              :href="'tel:' + phone"
                              :style="{ color: card.style?.secondaryColor || '#4B5563' }"
                              class="hover:bg-gray-50"
                            ) {{ phone }}

                      // Websites
                      .relative.flex.items-center.gap-3(v-if="card.websites?.length > 0")
                        VaIcon(name="language" size="18px" :style="{ color: card.style?.secondaryColor || '#4B5563' }")
                        .flex.flex-col.w-full
                          .flex.items-center.justify-between.w-full
                            a.text-base(
                              :style="{ color: card.style?.secondaryColor || '#4B5563' }"
                              :href="formatWebsiteUrl(card.websites[0])"
                              target="_blank"
                              rel="noopener noreferrer"
                            ) {{ card.websites[0] }}
                            button.p-1.rounded-lg.transition-colors(
                              v-if="card.websites.length > 1"
                              @click="toggleContactDropdown('website', card.id)"
                              class="hover:bg-gray-100"
                            )
                              VaIcon(name="expand_more" size="18px" class="text-gray-400")
                          .mt-1.w-full.bg-white.rounded-lg.shadow-lg.border.border-gray-200.overflow-hidden(
                            v-if="card.websites.length > 1 && expandedContact.type === 'website' && expandedContact.cardId === card.id"
                          )
                            a.block.px-4.py-2.text-sm.transition-colors(
                              v-for="website in card.websites.slice(1)"
                              :key="website"
                              :href="formatWebsiteUrl(website)"
                              target="_blank"
                              rel="noopener noreferrer"
                              :style="{ color: card.style?.secondaryColor || '#4B5563' }"
                              class="hover:bg-gray-50"
                            ) {{ website }}

                      // Company (unchanged)
                      .flex.items-center.gap-3(v-if="card.company")
                        VaIcon(name="business" size="18px" :style="{ color: card.style?.secondaryColor || '#4B5563' }")
                        span.text-base(:style="{ color: card.style?.secondaryColor || '#4B5563' }") {{ card.company }}

                    // Event Tag
                    .mt-auto.pt-6
                      .inline-flex.items-center.gap-2.px-4.py-2.rounded-full.text-base(
                        :class=`card.eventId ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'`
                      )
                        VaIcon(name="event" size="16px" :class="card.eventId ? 'text-emerald-600' : 'text-gray-600'")
                        span {{ getEventName(card.eventId) || 'No Event' }}

                  // Bottom Action Bar
                  .bg-gray-50.px-6.py-4.flex.items-center.justify-between.border-t.border-gray-100
                    .flex.items-center.gap-4
                      button(
                        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                        @click="openDraftsListModal(card)"
                      )
                        VaIcon(name="description" size="18px")
                        span.text-base.font-medium Message Drafts
                        span(class="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-lg ml-1") {{ cardDrafts[card.id]?.length || 0 }}
                      button(
                        class="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg"
                        @click="saveContact(card)"
                      )
                        VaIcon(name="person_add" size="18px")
                        span.text-sm.font-medium Save Contact

        // Stats Grid (Moved to bottom)
        .grid.mt-8(class="grid-cols-1 md:grid-cols-3 gap-6")
          .stat-card.bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-6(
            v-for="stat in stats"
            :key="stat.label"
          )
            .flex.items-center.gap-4
              .bg-emerald-100.p-3.rounded-xl
                VaIcon(:name="stat.icon" size="24px" class="text-emerald-600")
              .space-y-1
                p.text-2xl.font-bold.text-gray-900 {{ stat.value }}
                p.text-sm.text-gray-600 {{ stat.label }}

    // Modals section
    template(v-if="user")
      // Message Drafts List Modal
      VaModal(
        v-model="showDraftsListModal"
        :hide-default-actions="true"
        class="rounded-2xl"
      )
        .p-8
          .flex.items-center.justify-between.mb-8
            .flex.items-center.gap-3
              h3.text-2xl.font-bold Message Drafts
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
                v-model="newEventName"
                type="text"
                placeholder="Enter event name"
                class="w-full border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              )
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Event Date
              input(
                v-model="newEventDate"
                type="date"
                class="w-full border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              )
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Location
              input(
                v-model="newEventLocation"
                type="text"
                placeholder="Enter event location"
                class="w-full border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              )
          .flex.justify-end.gap-4.mt-8
            button(
              class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              @click="showCreateEventModal = false"
            ) Cancel
            button(
              class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
              @click="createEvent"
              :disabled="!newEventName"
            )
              VaIcon(name="event" size="16px")
              span(class="font-medium") Create Event

      // Delete Card Confirmation Modal
      VaModal(
        v-model="showDeleteModal"
        :hide-default-actions="true"
        class="rounded-2xl"
      )
        .p-8
          h3.text-2xl.font-bold.mb-4 Delete Business Card
          p.text-gray-600.mb-6.text-lg(class="font-light") Are you sure you want to delete this business card? This action cannot be undone.
          .flex.justify-end.gap-4
            button(
              class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              @click="showDeleteModal = false"
            ) Cancel
            button(
              class="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
              @click="deleteCard"
              :disabled="deletingCard"
            )
              .loading-spinner.w-4.h-4.border-2(v-if="deletingCard")
              VaIcon(v-else name="delete" size="16px")
              span(class="font-medium") {{ deletingCard ? 'Deleting...' : 'Delete Card' }}

      // QR Code Section
      .mt-12.bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-8
        .text-center.mb-8
          h2.text-2xl.font-bold.text-gray-900 Share Your Info
          p.text-gray-600.mt-2 Let others easily connect with you by scanning your QR code
        
        .flex.flex-col.items-center.gap-6
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
          .flex.items-center.gap-4
            button(
              type="button"
              class="text-emerald-600 hover:text-emerald-700 flex items-center gap-2 text-sm font-medium transition-all duration-300"
              :class="{ 'text-green-600': copiedLink }"
              @click="copyProfileUrl"
            )
              VaIcon(name="content_copy" size="18px" :class="{ 'transform scale-110': copiedLink }")
              span {{ copiedLink ? 'Copied!' : 'Copy Profile Link' }}
            button(
              type="button"
              class="text-emerald-600 hover:text-emerald-700 flex items-center gap-2 text-sm font-medium"
              @click="downloadQRCode"
            )
              VaIcon(name="download" size="18px")
              span Download QR Code
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { businessCardService } from '../../services/businessCardService';
import { authService } from '../../services/authService';
import { useRouter } from 'vue-router';
import { storage } from '../../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import QrcodeVue from 'qrcode.vue';

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
const showDeleteModal = ref(false);
const selectedCardForDelete = ref(null);
const deletingCard = ref(false);
const expandedContact = ref({ type: null, cardId: null });
const showUserMenu = ref(false);
const copiedLink = ref(false);

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
    if (!newEventName.value.trim()) {
      error.value = 'Event name is required';
      return;
    }

    const event = await businessCardService.createEvent({
      name: newEventName.value.trim(),
      date: newEventDate.value || null,
      location: newEventLocation.value?.trim() || null
    });
    
    // Add the new event to the list
    events.value.unshift(event);
    
    // Set the new event as selected
    selectedEventFilter.value = event.id;
    
    // Reset form and close modal
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

// Features data for landing page
const features = [
  {
    icon: 'smart_toy',
    title: 'AI-Powered Organization',
    description: 'Automatically categorize and organize your business cards with intelligent event tagging.'
  },
  {
    icon: 'email',
    title: 'Smart Message Drafts',
    description: 'Generate personalized follow-up messages with AI assistance in seconds.'
  },
  {
    icon: 'event',
    title: 'Event Management',
    description: 'Organize contacts by events and conferences for better networking.'
  },
  {
    icon: 'qr_code',
    title: 'Smart Card Scanning',
    description: 'Instantly digitize business cards with advanced OCR technology.'
  },
  {
    icon: 'security',
    title: 'Enterprise Security',
    description: 'Bank-level encryption and security for your business data.'
  },
  {
    icon: 'analytics',
    title: 'Network Analytics',
    description: 'Get insights into your professional network and connections.'
  }
];

// Stats data
const stats = computed(() => [
  {
    icon: 'qr_code',
    value: businessCards.value.length,
    label: 'Business Cards'
  },
  {
    icon: 'event',
    value: events.value.length,
    label: 'Events'
  },
  {
    icon: 'email',
    value: Object.keys(cardDrafts.value).length,
    label: 'Message Drafts'
  }
]);

// Add watcher for selectedEventFilter
watch(selectedEventFilter, (newValue) => {
  loadCards();
});

function getContrastColor(hexcolor) {
  // Remove the hash if present
  hexcolor = hexcolor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
}

function confirmDeleteCard(card) {
  selectedCardForDelete.value = card;
  showDeleteModal.value = true;
}

async function deleteCard() {
  if (!selectedCardForDelete.value) return;
  
  try {
    deletingCard.value = true;
    error.value = '';
    
    await businessCardService.deleteCard(selectedCardForDelete.value.id);
    
    // Remove the card from the local state
    const index = businessCards.value.findIndex(c => c.id === selectedCardForDelete.value.id);
    if (index !== -1) {
      businessCards.value.splice(index, 1);
    }
    
    // Close the modal
    showDeleteModal.value = false;
    selectedCardForDelete.value = null;
  } catch (err) {
    error.value = 'Error deleting business card';
    console.error(err);
  } finally {
    deletingCard.value = false;
  }
}

function toggleContactDropdown(type, cardId) {
  if (expandedContact.value.type === type && expandedContact.value.cardId === cardId) {
    expandedContact.value = { type: null, cardId: null };
  } else {
    expandedContact.value = { type, cardId };
  }
}

function formatWebsiteUrl(url) {
  if (!url) return '#';
  return url.startsWith('http') ? url : `https://${url}`;
}

function saveContact(card) {
  // Create vCard content
  const vCard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.name}`,
    `N:${card.name.split(' ').reverse().join(';')}`,
    card.title ? `TITLE:${card.title}` : '',
    card.company ? `ORG:${card.company}` : '',
    ...(card.emails || []).map(email => `EMAIL;type=INTERNET:${email}`),
    ...(card.phones || []).map(phone => `TEL;type=WORK:${phone}`),
    ...(card.websites || []).map(website => `URL:${formatWebsiteUrl(website)}`),
    card.address ? `ADR;type=WORK:;;${card.address}` : '',
    'END:VCARD'
  ].filter(Boolean).join('\n');

  // Create blob and download link
  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${card.name.replace(/\s+/g, '_')}.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Add this computed property after the other computed properties
const sortedBusinessCards = computed(() => {
  return [...businessCards.value].sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
    return dateB - dateA;
  });
});

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
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
    copiedLink.value = true;
    setTimeout(() => {
      copiedLink.value = false;
    }, 2000);
  } catch (err) {
    console.error('Error copying URL:', err);
  }
}

// Download QR Code as PNG
function downloadQRCode() {
  // Get the SVG element directly from the QrcodeVue component
  const svgElement = document.querySelector('.bg-white.p-4.rounded-xl.border.border-gray-100 svg');
  if (!svgElement) return;

  // Convert SVG to data URL
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  img.onload = () => {
    // Set canvas size to match the QR code size
    canvas.width = 200;
    canvas.height = 200;
    ctx.drawImage(img, 0, 0);
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'profile-qr-code.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
}
</script>

<style scoped>
/* Full screen setup */
main {
  min-height: 100vh;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Fixed header styles */
.fixed-header {
  backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.9);
}

/* Content area scrolling */
.content-area {
  height: calc(100vh - 4rem); /* Subtract header height */
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom scrollbar */
.content-area::-webkit-scrollbar {
  width: 8px;
}

.content-area::-webkit-scrollbar-track {
  background: transparent;
}

.content-area::-webkit-scrollbar-thumb {
  background: #E5E7EB;
  border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: #D1D5DB;
}

/* Loading spinner animation */
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

/* Card and draft item styles */
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

/* Hover effects */
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
.group .opacity-0 {
  opacity: 0;
}

/* Tooltip styles */
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

/* Text truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Card animations */
.feature-card {
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Gradient animation */
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.bg-gradient-animate {
  background-size: 200% 200%;
  animation: gradient 15s ease infinite;
}
</style>
