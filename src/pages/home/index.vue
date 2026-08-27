<route>
meta:
  title: BilloAI — Follow up before you forget
  requiresAuth: true
</route>

<template lang="pug">
main.page-home(class="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/90 flex flex-col")
  //- App Interface (Always visible)
  .flex-1.w-full.flex.flex-col
    //- Main content (global top nav + offset live in App.vue)
    .flex-1.w-full
      .max-w-7xl.mx-auto(class="px-4 sm:px-6 lg:px-8 py-6 sm:py-8")
        //- Mode switcher — Capture vs Follow-ups (one job at a time)
        .billo-home-modes.mb-6
          .billo-home-modes__rail(role="tablist" aria-label="Home mode")
            button.billo-home-modes__tab(
              type="button"
              role="tab"
              :aria-selected="homeMode === 'capture'"
              :class="{ 'is-active': homeMode === 'capture' }"
              @click="homeMode = 'capture'"
            )
              VaIcon(name="photo_camera" size="18px")
              span Capture
            button.billo-home-modes__tab(
              type="button"
              role="tab"
              :aria-selected="homeMode === 'followups'"
              :class="{ 'is-active': homeMode === 'followups' }"
              @click="homeMode = 'followups'"
            )
              VaIcon(name="send" size="18px")
              span To send
              span.billo-home-modes__count(v-if="pendingFollowUpCount > 0") {{ pendingFollowUpCount }}
          p.billo-home-modes__hint
            template(v-if="homeMode === 'capture'") Snap a card or contact screenshot while you’re still talking.
            template(v-else) Contacts you’ve saved — follow up when you’re ready.

        // Soft verify notice (doesn't scream; still blocks capture actions)
        .billo-verify-soft.mb-6#billo-verify(v-if="user && !user.emailVerified")
          p
            strong Confirm your email
            |  to unlock capture. Check your inbox — or
            |
            button(type="button" @click="resendVerification" :disabled="loading") resend the link
            | .

        //- First-run coach — only when capturing or empty queue
        transition(
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        )
          .billo-first-run.mb-6(v-if="showFirstRunCoach && homeMode === 'capture'")
            .billo-first-run__inner
              .billo-first-run__copy
                p.billo-first-run__kicker Your first follow-up
                h2.billo-first-run__title Capture one person. Send before you leave.
                p.billo-first-run__lede Card photo or contact screenshot — draft opens in Gmail or Outlook.
              .billo-first-run__actions
                button.billo-first-run__cta(
                  type="button"
                  @click="handleCameraScan"
                  :disabled="!user?.emailVerified"
                )
                  VaIcon(name="photo_camera" size="18px")
                  span Scan now
                button.billo-first-run__dismiss(
                  type="button"
                  @click="dismissFirstRunCoach"
                ) Dismiss

        //- Hidden File Input (gallery)
        input(
          type="file"
          ref="fileInput"
          class="hidden"
          accept="image/*"
          @change="handleFileSelect"
          multiple
        )
        //- Camera capture for booth / hallway scans (mobile rear camera when available)
        input(
          type="file"
          ref="cameraInput"
          class="hidden"
          accept="image/*"
          capture="environment"
          @change="handleFileSelect"
        )
        
        //- Hidden VCF Input
        input(
          type="file"
          ref="vcfInput"
          class="hidden"
          accept=".vcf,.vcard"
          @change="handleVcfSelect"
          multiple
        )

        //- Capture mode
        template(v-if="showCaptureSurface")
          //- Upload Area (Initial State)
          .billo-capture.mb-8(v-if="!uploading && !selectedFiles.length && !showContactPreview")
            .billo-capture__stage(
              @dragover.prevent
              @drop.prevent="handleDrop"
            )
              h2.billo-capture__title Capture who you met
              p.billo-capture__lede Card, badge, or screenshot of a contact — auto-detected.
              button.billo-capture__primary(
                type="button"
                @click="handleCameraScan"
                :disabled="!user || !user.emailVerified"
              )
                VaIcon(name="photo_camera" size="22px")
                span Use camera
              .billo-capture__secondary
                button(
                  type="button"
                  @click="handleUploadCard"
                  :disabled="!user || !user.emailVerified"
                ) Gallery
                button(
                  type="button"
                  @click="handleCreateEvent"
                  :disabled="!user || !user.emailVerified"
                ) New event
                details.billo-capture__more
                  summary More
                  button(
                    type="button"
                    @click="handleImportContacts"
                    :disabled="!user || !user.emailVerified"
                  ) Import .vcf
              p.billo-capture__micro Compressed on-device. Screenshots work.

        //- File Preview Area
        .billo-panel-premium.billo-motion.mb-8.p-5(v-if="!uploading && selectedFiles.length > 0" class="sm:p-8")
          .flex.flex-col
            .flex.justify-between.items-center.mb-6
              h3.text-xl.font-bold.text-gray-900 Selected Files ({{ selectedFiles.length }})
              .flex.gap-3
                button(
                  class="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                  @click="clearSelectedFiles"
                ) 
                  .flex.items-center.gap-1
                    VaIcon(name="cancel" size="16px")
                    span Cancel
                button(
                  class="px-5 py-2 text-sm bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg shadow-sm hover:shadow-md transition-all"
                  @click="processSelectedFiles"
                )
                  .flex.items-center.gap-1
                    VaIcon(name="check" size="16px")
                    span Upload All
            
            //- Event Selection (single file — multi uses confirm popup)
            .bg-gradient-to-r.from-emerald-50.to-teal-50.p-3.rounded-lg.mb-4.border.border-emerald-200(
              v-if="selectedFiles.length === 1"
            )
              .flex.flex-col.sm_flex-row.items-center.gap-3
                .flex.items-center.gap-2.min-w-max
                  VaIcon(name="event" size="18px" class="text-emerald-500")
                  span.text-sm.font-medium.text-gray-700 Event (where you met):
                .flex-1.flex.flex-wrap.gap-2.items-center.w-full
                  select(
                    class="form-select rounded-lg border-emerald-200 py-1.5 px-2 text-sm flex-1 min-w-[200px] bg-white"
                    v-model="selectedPreviewEvent"
                  )
                    option(value="") -- Select Event (Optional) --
                    option(value="null") No event tagged
                    optgroup(v-if="meetingTypes.length" label="Defaults")
                      option(
                        v-for="type in meetingTypes"
                        :key="'mt-' + type.id"
                        :value="'mt:' + type.id"
                      ) {{ type.label }}
                    optgroup(v-if="realEvents.length" label="Your events")
                      option(
                        v-for="event in realEvents"
                        :key="event.id"
                        :value="event.id"
                      ) {{ event.name }} ({{ formatDate(event.date) }})
                  
                  button(
                    class="text-sm px-3 py-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-1 text-emerald-600"
                    @click="handleCreateEvent"
                  )
                    VaIcon(name="add" size="14px")  
                    span New Event

            //- Conversation context — single card only (batch notes don't apply cleanly)
            .mb-4.rounded-lg.border.border-slate-200.bg-white.p-3(
              v-if="selectedFiles.length === 1"
            )
              label.block.text-sm.font-medium.text-slate-700.mb-1 What did you talk about? (optional)
              textarea(
                v-model="scanMetNote"
                rows="2"
                maxlength="280"
                placeholder="e.g. Met at SaaStr booth — talked pricing for their sales team"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              )
              p.text-xs.text-slate-500.mt-1 Used in the follow-up so it sounds like you were there.

            p.text-sm.text-slate-600.mb-4(
              v-else
            ) You’ll confirm where you met these people before upload.

          //- Preview grid
          .grid.grid-cols-2.sm_grid-cols-3.md_grid-cols-4.lg_grid-cols-6.gap-3
            .relative.flex.flex-col.border.border-gray-200.rounded-lg.overflow-hidden.shadow-sm(
              v-for="(file, index) in selectedFiles" 
              :key="index"
            )
              //- Image preview
              .h-28.bg-gray-100.flex.items-center.justify-center.overflow-hidden
                img(:src="previewUrls[index]" class="object-cover w-full h-full" alt="Preview")
              
              //- File info
              .p-2
                .text-xs.font-medium.text-gray-900.truncate(:title="file.name") {{ file.name }}
                .text-xs.text-gray-500 {{ (file.size / 1024).toFixed(1) }} KB
              
              //- Remove button
              button(
                class="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm border border-gray-200 hover:bg-gray-100 transition-all"
                @click="removeFileFromSelection(index)"
                title="Remove"
              )
                VaIcon(name="close" size="14px" class="text-gray-700")

        //- Contact Files Preview Area
        .billo-panel-premium.billo-motion.mb-8.p-5(v-if="!uploading && showContactPreview && selectedContactFiles.length > 0" class="sm:p-8")
          .flex.flex-col
            .flex.justify-between.items-center.mb-6
              h3.text-xl.font-bold.text-gray-900 Selected Contacts ({{ selectedContactFiles.length }})
              .flex.gap-3
                button(
                  class="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                  @click="clearSelectedContactFiles"
                ) 
                  .flex.items-center.gap-1
                    VaIcon(name="cancel" size="16px")
                    span Cancel
                button(
                  class="px-5 py-2 text-sm bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg shadow-sm hover:shadow-md transition-all"
                  @click="processSelectedContactFiles"
                )
                  .flex.items-center.gap-1
                    VaIcon(name="check" size="16px")
                    span Upload All
            
            //- Event Selection
            .bg-gradient-to-r.from-emerald-50.to-teal-50.p-3.rounded-lg.mb-4.border.border-emerald-200
              .flex.flex-col.sm_flex-row.items-center.gap-3
                .flex.items-center.gap-2.min-w-max
                  VaIcon(name="event" size="18px" class="text-emerald-500")
                  span.text-sm.font-medium.text-gray-700 Event (where you met):
                .flex-1.flex.flex-wrap.gap-2.items-center.w-full
                  select(
                    class="form-select rounded-lg border-emerald-200 py-1.5 px-2 text-sm flex-1 min-w-[200px] bg-white"
                    v-model="selectedPreviewEvent"
                  )
                    option(value="") -- Select Event (Optional) --
                    option(value="null") No event tagged
                    optgroup(v-if="meetingTypes.length" label="Defaults")
                      option(
                        v-for="type in meetingTypes"
                        :key="'mt-contact-' + type.id"
                        :value="'mt:' + type.id"
                      ) {{ type.label }}
                    optgroup(v-if="realEvents.length" label="Your events")
                      option(
                        v-for="event in realEvents"
                        :key="event.id"
                        :value="event.id"
                      ) {{ event.name }} ({{ formatDate(event.date) }})
                  
                  button(
                    class="text-sm px-3 py-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-1 text-emerald-600"
                    @click="handleCreateEvent"
                  )
                    VaIcon(name="add" size="14px")  
                    span New Event

          //- Preview grid for contacts
          .grid.grid-cols-2.sm_grid-cols-3.md_grid-cols-4.lg_grid-cols-6.gap-3
            .relative.flex.flex-col.border.border-gray-200.rounded-lg.overflow-hidden.shadow-sm(
              v-for="(fileInfo, index) in contactFilesInfo" 
              :key="index"
            )
              //- Contact icon preview
              .h-28.bg-gray-100.flex.items-center.justify-center.overflow-hidden
                VaIcon(name="contact_page" size="48px" class="text-emerald-400")
              
              //- File info
              .p-2
                .text-xs.font-medium.text-gray-900.truncate(:title="fileInfo.fullName") {{ fileInfo.name }}
                .text-xs.text-gray-500 {{ (fileInfo.size / 1024).toFixed(1) }} KB
              
              //- Remove button
              button(
                class="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm border border-gray-200 hover:bg-gray-100 transition-all"
                @click="removeContactFileFromSelection(index)"
                title="Remove"
              )
                VaIcon(name="close" size="14px" class="text-gray-700")

        //- Upload Progress
        .billo-panel-premium.billo-motion.mb-8.p-5(v-else-if="uploading" class="sm:p-8")
          .flex.flex-col.items-center.justify-center
            template(v-if="!error")
              template(v-if="successMessage")
                .bg-emerald-100.text-emerald-800.p-4.rounded-xl.mb-4.flex.items-center.gap-3.w-full
                  VaIcon(name="check_circle" size="24px" class="text-emerald-600")
                  span.font-medium {{ successMessage }}
              template(v-else)
                .loading-spinner.mb-4
                p.text-lg.font-medium.text-gray-900.mb-2 Processing...
                p.text-gray-600 {{ processingStatus }}
            template(v-else)
              .mt-4
                p.text-red-600.font-medium {{ error }}

        //- Follow-ups queue
        template(v-if="showFollowUpsSurface")
          // Main Content Area
          .grid(class="grid-cols-1")
          // Business Cards Section
          div
            .billo-panel-premium.billo-motion.p-4(class="sm:p-6")
              // Pending vs followed-up tabs
              .mb-5.flex.flex-wrap.items-center.gap-2
                button(
                  type="button"
                  role="tab"
                  :aria-selected="followUpTab === 'pending'"
                  class="rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
                  :class="followUpTab === 'pending' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
                  @click="followUpTab = 'pending'"
                )
                  | To follow up
                  span.ml-2.rounded-full.bg-emerald-100.px-2.py-1.text-xs.font-bold.text-emerald-800 {{ pendingCardCount }}
                button(
                  type="button"
                  role="tab"
                  :aria-selected="followUpTab === 'done'"
                  class="rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
                  :class="followUpTab === 'done' ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
                  @click="followUpTab = 'done'"
                )
                  | Followed up
                  span.ml-2.rounded-full.px-2.py-1.text-xs.font-bold(
                    :class="followUpTab === 'done' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'"
                  ) {{ followedUpCardCount }}

              // Search Bar Section
              .mb-6.rounded-2xl.border.p-4(
                class="border-slate-200/70 bg-slate-50/40 sm:p-5"
              )
                .flex.flex-col.gap-4
                  // Search Header
                  .flex.flex-col.gap-2(class="sm:flex-row sm:items-center sm:justify-between sm:mb-0")
                    h3.text-base.font-semibold.tracking-tight(class="text-slate-900 sm:text-lg") Search Business Cards
                    .flex.items-center
                      span.inline-flex.items-center.rounded-full.border.bg-white.px-3.py-1.text-xs.font-semibold.text-emerald-800(
                        class="border-emerald-200/80 sm:text-sm"
                      ) {{ filteredCards.length }} results
                  
                  // Event Filter
                  .relative.flex.items-center.w-full.mb-3
                    .flex.items-center.gap-2.mb-1
                      VaIcon(name="event" size="16px" class="text-gray-500")
                      span.text-sm.font-medium.text-gray-700 Filter by Event:
                    select(
                      v-model="selectedEventFilter"
                      class="w-full bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm appearance-none pr-8 shadow-sm hover:border-gray-300 transition-all duration-200"
                      :disabled="!user"
                      @change="handleEventChange"
                    )
                      option(value="all") All contacts
                      option(value="null") No event tagged
                      option(
                        v-for="event in realEvents"
                        :key="event.id"
                        :value="event.id"
                      ) {{ event.name }}
                    VaIcon(name="expand_more" size="16px" class="text-gray-500 absolute right-3 bottom-2.5 pointer-events-none")
                  
                  // Enhanced Search Input
                  .relative.w-full.group
                    .absolute.inset-y-0.left-0.pl-4.flex.items-center.pointer-events-none
                      VaIcon(
                        name="search"
                        size="20px"
                        class="text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-200"
                      )
                    input(
                      v-model="searchQuery"
                      type="text"
                      placeholder="Search by name, company, email, phone, or event..."
                      class="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base placeholder:text-gray-400 transition-all duration-200 hover:bg-gray-100/50 focus:bg-white"
                    )
                    // Clear Search Button
                    button.absolute.inset-y-0.right-0.pr-4.flex.items-center(
                      v-if="searchQuery"
                      @click="searchQuery = ''"
                      class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    )
                      VaIcon(name="close" size="20px")

                  // Pagination Controls - Moved to top
                  .flex.items-center.justify-center.gap-2.mt-4(v-if="filteredCards.length > cardsPerPage")
                    // Previous Page Button
                    button(
                      class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      @click="prevPage"
                      :disabled="currentPage === 1"
                      aria-label="Previous page"
                    )
                      VaIcon(name="chevron_left" size="20px" class="text-gray-700")
                    
                    // Page Numbers
                    template(v-if="totalPages <= 7")
                      button(
                        v-for="page in totalPages"
                        :key="page"
                        @click="goToPage(page)"
                        class="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
                        :class="currentPage === page ? 'bg-emerald-500 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'"
                      ) {{ page }}
                    
                    template(v-else)
                      // First page
                      button(
                        @click="goToPage(1)"
                        class="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
                        :class="currentPage === 1 ? 'bg-emerald-500 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'"
                      ) 1
                      
                      // Ellipsis if needed before middle pages
                      .text-gray-400(v-if="currentPage > 3") ...
                      
                      // Middle pages
                      template(v-for="page in totalPages" :key="page")
                        button(
                          v-if="page !== 1 && page !== totalPages && (page === currentPage || page === currentPage - 1 || page === currentPage + 1)"
                          @click="goToPage(page)"
                          class="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
                          :class="currentPage === page ? 'bg-emerald-500 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'"
                        ) {{ page }}
                      
                      // Ellipsis if needed after middle pages
                      .text-gray-400(v-if="currentPage < totalPages - 2") ...
                      
                      // Last page
                      button(
                        @click="goToPage(totalPages)"
                        class="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
                        :class="currentPage === totalPages ? 'bg-emerald-500 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'"
                      ) {{ totalPages }}
                    
                    // Next Page Button
                    button(
                      class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      @click="nextPage"
                      :disabled="currentPage === totalPages"
                      aria-label="Next page"
                    )
                      VaIcon(name="chevron_right" size="20px" class="text-gray-700")
                    
                    // Page indicator
                    .text-sm.text-gray-600.ml-4
                      | Page {{ currentPage }} of {{ totalPages }}

              // Cards Grid
              div(id="cards-section")
                // Empty State
                .empty-state(
                  v-if="!user"
                  class="col-span-full flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
                )
                  VaIcon(name="person" size="48px" class="text-gray-400 mb-4")
                  p.text-gray-500.text-center.mb-2 Sign in to send follow-ups
                  p.text-sm.text-gray-400.text-center Scan a card or contact screenshot, get a note, open Gmail or Outlook in one tap
                  button(
                    class="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    @click="router.push('/auth')"
                  )
                    VaIcon(name="login" size="20px")
                    span.font-medium Sign In to Get Started
                
                // No cards message 
                .empty-state(
                  v-else-if="user && filteredCards.length === 0"
                  class="col-span-full flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 max-w-2xl mx-auto"
                )
                  VaIcon(name="search_off" size="48px" class="text-gray-400 mb-4")
                  template(v-if="followUpTab === 'done'")
                    p.text-gray-700.text-center.text-lg.font-semibold.mb-1 No followed-up contacts yet
                    p.text-sm.text-gray-500.text-center.mb-6.max-w-md
                      | After you send a follow-up and mark it sent, that contact moves here.
                    button(
                      class="mt-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
                      @click="followUpTab = 'pending'"
                    )
                      VaIcon(name="send" size="20px")
                      span.font-medium View to follow up
                  template(v-else)
                    p.text-gray-700.text-center.text-lg.font-semibold.mb-1 {{ searchQuery ? 'No matches' : 'No follow-ups waiting' }}
                    p.text-sm.text-gray-500.text-center(v-if="searchQuery")
                      | No people match your search. Try different keywords or clear the search.
                    template(v-else)
                      p.text-sm.text-gray-500.text-center.mb-6.max-w-md
                        | Scan someone you just met — card photo or contact screenshot — then write a follow-up when you’re ready.
                      ol.text-sm.text-gray-600.text-left.max-w-md.space-y-3.mb-8.list-decimal.pl-5
                        li
                          span.font-medium.text-gray-800 Scan
                          |  their card or a screenshot of their contact.
                        li
                          span.font-medium.text-gray-800 Add context
                          |  when you’re ready to write (where you met, what to aim for).
                        li
                          span.font-medium.text-gray-800 Send
                          |  from Gmail or Outlook in one tap.
                    button(
                      v-if="searchQuery"
                      class="mt-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
                      @click="searchQuery = ''"
                    )
                      VaIcon(name="clear" size="20px")
                      span.font-medium Clear Search
                    button(
                      v-else
                      class="mt-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                      @click="goToCapture"
                    )
                      VaIcon(name="photo_camera" size="20px")
                      span.font-medium Scan your first contact
                
                // Contact tiles → detail sheet
                div(v-else)
                  .mt-4.grid.gap-3(
                    class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
                  )
                    article.billo-person-tile.group.relative.cursor-pointer.overflow-hidden.rounded-2xl.border.border-slate-200.bg-white.text-left.shadow-sm.transition-all(
                      v-for="card in paginatedCards"
                      :key="card.id"
                      class="hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                      role="button"
                      tabindex="0"
                      :aria-label="'Open ' + (card.name || 'contact')"
                      @click="openContactSheet(card)"
                      @keydown.enter.prevent="openContactSheet(card)"
                      @keydown.space.prevent="openContactSheet(card)"
                    )
                      .absolute.inset-y-0.left-0.w-1(
                        :class="cardDrafts[card.id]?.length ? 'bg-emerald-500' : 'bg-slate-200'"
                        aria-hidden="true"
                      )
                      .flex.items-start.gap-3.p-4(class="pl-5")
                        .min-w-0.flex-1
                          .flex.min-w-0.items-start.justify-between.gap-2
                            h3.truncate.text-base.font-semibold.leading-snug.text-slate-900 {{ card.name || 'Unnamed' }}
                            VaIcon.shrink-0(
                              name="chevron_right"
                              size="20px"
                              class="mt-0.5 text-slate-300 transition-colors group-hover:text-emerald-600"
                            )
                          p.truncate.text-sm.text-slate-500(class="mt-0.5")
                            template(v-if="card.title || card.company") {{ [card.title, card.company].filter(Boolean).join(' · ') }}
                            template(v-else-if="card.emails?.[0]") {{ card.emails[0] }}
                            template(v-else) Tap to add details
                          .mt-2.flex.min-w-0.flex-wrap.items-center(
                            class="gap-1.5"
                          )
                            span.inline-flex.items-center.rounded-full.bg-slate-100.px-2.font-medium.text-slate-600(
                              v-if="cardEventLabel(card)"
                              class="py-0.5 text-[11px]"
                            ) {{ cardEventLabel(card) }}
                            span.inline-flex.items-center.rounded-full.bg-emerald-50.px-2.font-medium.text-emerald-800(
                              v-else-if="followUpTab === 'pending'"
                              class="py-0.5 text-[11px]"
                            ) Needs event
                            span.inline-flex.items-center.rounded-md.border.font-semibold.uppercase.tracking-wide(
                              v-if="card.source === 'screenshot'"
                              class="border-sky-200 bg-sky-50 text-sky-800 px-1.5 py-0.5 text-[10px]"
                            ) Shot
                            span.inline-flex.items-center.rounded-md.border.font-semibold.uppercase.tracking-wide(
                              v-else-if="card.source === 'manual' || card.importedContact"
                              class="border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0.5 text-[10px]"
                            ) Import
                          p.mt-1.font-medium.text-amber-700(
                            class="text-[11px]"
                            v-if="card.extractWarnings?.length || (card.confidence?.overall != null && card.confidence.overall < 0.55)"
                          ) {{ card.extractWarnings?.[0] || 'Quick check recommended' }}

        // Stats Grid
        .mt-8.grid.gap-4(class="grid-cols-1 sm:grid-cols-3")
          .stat-card.billo-card-elevated.billo-motion.p-5(
            v-for="stat in stats"
            :key="stat.label"
            class="sm:p-6"
          )
            .flex.items-center.gap-4
              .bg-emerald-100.p-3.rounded-xl
                VaIcon(:name="stat.icon" size="24px" class="text-emerald-600")
              .space-y-1
                p.text-2xl.font-bold.text-gray-900 {{ user ? stat.value : '0' }}
                p.text-sm.text-gray-600 {{ stat.label }}

    // Modals section
    template(v-if="user")
      // Multi-upload: confirm event before scanning
      VaModal(
        v-model="showUploadEventConfirm"
        :hide-default-actions="true"
        class="billio-modal modal-container rounded-2xl z-[120]"
      )
        .p-5(class="sm:p-6")
          h3.text-lg.font-semibold.text-slate-900.mb-1 Confirm where you met
          p.text-sm.text-slate-600.mb-4
            | You’re uploading {{ selectedFiles.length }} contacts. Pick one place for all of them — you can still edit per person later.
          label.block.text-sm.font-medium.text-slate-700(class="mb-1.5") Event
          select.w-full.rounded-xl.border.border-slate-200.bg-white.px-3.text-sm(
            v-model="uploadConfirmPlace"
            class="py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          )
            option(value="") -- Select Event (Optional) --
            option(value="null") No event tagged
            optgroup(v-if="meetingTypes.length" label="Defaults")
              option(
                v-for="type in meetingTypes"
                :key="'mt-confirm-' + type.id"
                :value="'mt:' + type.id"
              ) {{ type.label }}
            optgroup(v-if="realEvents.length" label="Your events")
              option(
                v-for="event in realEvents"
                :key="'confirm-' + event.id"
                :value="event.id"
              ) {{ event.name }} ({{ formatDate(event.date) }})
          button.mt-3.inline-flex.items-center.gap-1.text-sm.font-medium.text-emerald-700(
            type="button"
            class="hover:text-emerald-800"
            @click="handleCreateEvent"
          )
            VaIcon(name="add" size="16px")
            span New event
          .mt-5.flex.flex-wrap.justify-end.gap-2
            button(
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="showUploadEventConfirm = false"
            ) Cancel
            button(
              type="button"
              class="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
              @click="confirmMultiUpload"
            ) Upload {{ selectedFiles.length }} contacts

      // Contact detail sheet
      VaModal(
        v-model="showContactSheet"
        :hide-default-actions="true"
        class="billio-modal modal-container rounded-2xl z-[100]"
      )
        .p-5(class="sm:p-6" v-if="contactSheetCard")
          .flex.items-start.justify-between.gap-3.mb-5
            .min-w-0.flex-1
              h3.text-xl.font-semibold.leading-snug.text-slate-900.truncate {{ contactSheetCard.name || 'Contact' }}
              p.text-sm.text-slate-500.truncate(v-if="contactSheetCard.title || contactSheetCard.company")
                | {{ [contactSheetCard.title, contactSheetCard.company].filter(Boolean).join(' · ') }}
            button.rounded-lg.p-2.text-slate-400.transition-colors(
              type="button"
              class="hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
              @click="closeContactSheet"
            )
              VaIcon(name="close" size="22px")

          ul.space-y-3
            li.flex.items-start(
              class="gap-2.5"
              v-if="contactSheetCard.emails?.length"
            )
              VaIcon.shrink-0(name="email" size="18px" class="mt-0.5 text-slate-400")
              .min-w-0.flex-1
                a.text-sm.text-slate-800.break-words(
                  class="underline-offset-2 hover:underline"
                  :href="'mailto:' + contactSheetCard.emails[0]"
                ) {{ contactSheetCard.emails[0] }}
                button.ml-1.text-xs.font-medium.text-emerald-700(
                  v-if="contactSheetCard.emails.length > 1"
                  type="button"
                  @click="toggleContactDropdown('email', contactSheetCard.id)"
                ) +{{ contactSheetCard.emails.length - 1 }}
                .mt-1.space-y-1(v-if="expandedContact.type === 'email' && expandedContact.cardId === contactSheetCard.id")
                  a.block.text-sm.text-slate-600.break-words(
                    v-for="email in contactSheetCard.emails.slice(1)"
                    :key="email"
                    :href="'mailto:' + email"
                  ) {{ email }}
            li.flex.items-start(
              class="gap-2.5"
              v-if="contactSheetCard.phones?.length"
            )
              VaIcon.shrink-0(name="phone" size="18px" class="mt-0.5 text-slate-400")
              .min-w-0.flex-1
                a.text-sm.text-slate-800(
                  class="underline-offset-2 hover:underline"
                  :href="'tel:' + contactSheetCard.phones[0]"
                ) {{ contactSheetCard.phones[0] }}
                button.ml-1.text-xs.font-medium.text-emerald-700(
                  v-if="contactSheetCard.phones.length > 1"
                  type="button"
                  @click="toggleContactDropdown('phone', contactSheetCard.id)"
                ) +{{ contactSheetCard.phones.length - 1 }}
                .mt-1.space-y-1(v-if="expandedContact.type === 'phone' && expandedContact.cardId === contactSheetCard.id")
                  a.block.text-sm.text-slate-600(
                    v-for="phone in contactSheetCard.phones.slice(1)"
                    :key="phone"
                    :href="'tel:' + phone"
                  ) {{ phone }}
            li.flex.items-start(
              class="gap-2.5"
              v-if="contactSheetCard.websites?.length"
            )
              VaIcon.shrink-0(name="language" size="18px" class="mt-0.5 text-slate-400")
              a.min-w-0.flex-1.text-sm.text-slate-800.break-words(
                class="underline-offset-2 hover:underline"
                :href="formatWebsiteUrl(contactSheetCard.websites[0])"
                target="_blank"
                rel="noopener noreferrer"
              ) {{ contactSheetCard.websites[0] }}

          button.mt-4.flex.w-full.items-center.gap-2.rounded-xl.border.border-slate-200.bg-slate-50.px-3.text-left.transition-colors(
            type="button"
            class="py-2.5 hover:border-slate-300 hover:bg-white"
            @click="openMoveToEventModal(contactSheetCard)"
          )
            VaIcon.shrink-0(name="event" size="18px" class="text-slate-400")
            .min-w-0.flex-1
              p.font-medium.uppercase.tracking-wide.text-slate-400(class="text-[11px]") Event
              p.text-sm.font-medium.text-slate-800.truncate {{ cardEventLabel(contactSheetCard) || 'Tap to choose an event' }}
            VaIcon.shrink-0(name="chevron_right" size="18px" class="text-slate-400")

          .mt-3.rounded-xl.border.border-emerald-100.bg-emerald-50.px-3(
            class="py-2.5"
            v-if="contactSheetCard.followUpIntent"
          )
            p.font-medium.uppercase.tracking-wide(class="text-[11px] text-emerald-800/80") Follow-up aim
            p.text-sm.text-slate-800(class="mt-0.5") {{ getFollowUpIntentLabel(contactSheetCard.followUpIntent) }}

          .mt-3.rounded-xl.border.border-amber-100.bg-amber-50.px-3(
            class="py-2.5"
            v-if="contactSheetCard.metNote"
          )
            p.font-medium.uppercase.tracking-wide(class="text-[11px] text-amber-800/80") What you talked about
            p.text-sm.text-slate-800.break-words(class="mt-0.5") {{ contactSheetCard.metNote }}
          button.mt-3.flex.w-full.items-center.gap-2.rounded-xl.border.border-dashed.border-slate-300.bg-white.px-3.text-left.text-sm.text-slate-500.transition-colors(
            v-else
            type="button"
            class="py-2.5 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
            @click="openEditFromSheet"
          )
            VaIcon(name="chat" size="16px" class="shrink-0")
            span Add what you talked about

          button.mt-5.flex.h-12.w-full.items-center.justify-center.rounded-xl.bg-emerald-600.text-sm.font-semibold.text-white.shadow-sm.transition-colors(
            type="button"
            class="gap-2 hover:bg-emerald-500"
            :disabled="generatingDraft === contactSheetCard.id || loadingDrafts[contactSheetCard.id]"
            @click="openFollowUpFromSheet"
          )
            VaIcon(name="send" size="18px" class="shrink-0")
            span {{ cardPrimaryCtaLabel(contactSheetCard) }}

          .mt-3.flex.flex-wrap.items-center.gap-2
            button.inline-flex.h-10.items-center.rounded-lg.border.border-slate-200.bg-white.px-3.text-sm.font-medium.text-slate-700.transition-colors(
              type="button"
              class="gap-1.5 hover:bg-slate-50"
              @click="saveContact(contactSheetCard)"
            )
              VaIcon(name="person_add" size="16px" class="text-slate-500")
              span Save contact
            button.inline-flex.h-10.w-10.items-center.justify-center.rounded-lg.border.border-slate-200.bg-white.text-slate-600.transition-colors(
              type="button"
              title="Edit"
              aria-label="Edit card"
              class="hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              @click="openEditFromSheet"
            )
              VaIcon(name="edit" size="18px")
            button.inline-flex.h-10.w-10.items-center.justify-center.rounded-lg.border.border-slate-200.bg-white.text-slate-600.transition-colors(
              type="button"
              title="Delete"
              aria-label="Delete card"
              class="hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              @click="confirmDeleteFromSheet"
            )
              VaIcon(name="delete" size="18px")

      // Message Drafts List Modal
      VaModal(
        v-model="showDraftsListModal"
        :hide-default-actions="true"
        class="billio-modal modal-container rounded-2xl z-[100]"
      )
        .p-6.relative
          .flex.items-center.justify-between.mb-6
            h3.text-lg.font-medium Follow-ups
            .flex.items-center.gap-3
              span.text-sm.text-gray-600.bg-gray-100.px-2.py-1.rounded {{ cardDrafts[selectedCardForDrafts?.id]?.length || 0 }} notes
              button(
                class="bg-white border border-emerald-200 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed group relative"
                @click="confirmGenerateEmail(selectedCardForDrafts)"
                :disabled="generatingDraft === selectedCardForDrafts?.id || loadingDrafts[selectedCardForDrafts?.id]"
              )
                VaIcon(
                  name="smart_toy"
                  size="14px"
                  class="text-emerald-600"
                )
                span.text-sm.font-medium New follow-up
              button(
                class="p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                @click="showDraftsListModal = false"
              )
                VaIcon(name="close" size="18px")
          
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
                .flex.flex-col.gap-2
                  p.text-sm.text-gray-500 {{ new Date(draft.createdAt.toDate()).toLocaleString() }}
                  p.text-base.text-gray-700.line-clamp-2 {{ draft.content }}
                .flex.flex-col.gap-2
                  button(
                    class="text-emerald-600 hover:text-emerald-700 transition-colors duration-200 p-2 rounded-lg hover:bg-emerald-50 tooltip-container"
                    @click.stop="copyDraft(draft.content, draft.id)"
                  )
                    VaIcon(name="content_copy" size="18px")
                    span.tooltip {{ copiedDrafts[draft.id] ? 'Copied!' : 'copy?' }}
            
            // Empty State
            .empty-state(
              v-if="!cardDrafts[selectedCardForDrafts?.id]?.length"
              class="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
            )
              VaIcon(name="description" size="48px" class="text-gray-400 mb-4")
              p.text-gray-500.text-center.mb-2 No follow-ups yet
              p.text-sm.text-gray-400.text-center Click “New follow-up” to write your first note
            
            // Loading State
            .loading-state(
              v-if="loadingDrafts[selectedCardForDrafts?.id]"
              class="flex justify-center py-12"
            )
              .loading-spinner

          // Bottom Close Button
          .flex.justify-center.mt-6.pt-4.border-t.border-gray-100
            button(
              class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
              @click="showDraftsListModal = false"
            )
              VaIcon(name="close" size="18px")
              span Close

      // Email Draft Modal
      VaModal(
        v-model="showEmailModal"
        :hide-default-actions="true"
        class="billio-modal modal-container rounded-2xl z-[100]"
      )
        .p-8.relative(class="sm:mt-0 mt-16")
          button.absolute.top-4.right-4.p-2.rounded-lg(
            class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            @click="showEmailModal = false"
          )
            VaIcon(name="close" size="24px")
          .flex.items-center.justify-between.mb-6
            h3.text-2xl.font-bold Your follow-up
          p.text-sm.text-slate-500.mb-4(v-if="selectedDraft?.subject")
            span.font-medium.text-slate-700 Subject:
            |  {{ selectedDraft.subject }}
          .bg-gray-50.p-6.rounded-xl.mb-2
            pre.whitespace-pre-wrap.text-base.leading-relaxed {{ emailDraft }}{{ selectedDraft?.signature ? '\n\n' + selectedDraft.signature : '' }}
          .mb-6(v-if="previousDraftSnapshot")
            button(
              type="button"
              class="text-sm font-medium text-emerald-700 hover:text-emerald-800 underline-offset-2 hover:underline"
              @click="usePreviousDraft"
            ) Use previous version
          p.text-xs.text-amber-700.mb-4(
            v-if="!selectedCardForDrafts?.emails?.length"
          ) Add an email on this contact before you can open Gmail/Outlook. Edit the card, then come back.
          p.text-xs.text-slate-500.mb-4(v-else) Opens in your mail app with everything filled in—hit Send there. Then confirm below so we stop nudging you.
          .flex.flex-col.gap-3
            .rounded-xl.border.border-emerald-200.bg-emerald-50.p-3(
              v-if="selectedDraft?.status === 'compose_opened'"
            )
              p.text-sm.text-emerald-900.mb-2 Did you send it?
              .flex.flex-wrap.gap-2
                button(
                  type="button"
                  class="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                  @click="confirmDraftSent"
                ) Yes, mark sent
                button(
                  type="button"
                  class="bg-white border border-emerald-200 text-emerald-900 px-3 py-2 rounded-lg text-sm font-medium"
                  @click="showEmailModal = false"
                ) Still drafting
            .grid.gap-3(class="sm:grid-cols-2")
              button(
                class="bg-emerald-600 text-white hover:bg-emerald-500 px-4 py-3 rounded-lg transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                @click="sendFollowUp('gmail')"
                :disabled="!selectedCardForDrafts?.emails?.length"
                :title="!selectedCardForDrafts?.emails?.length ? 'No email on this card' : 'Open Gmail with this follow-up'"
              )
                VaIcon(name="mail" size="18px")
                span Send with Gmail
              button(
                class="bg-sky-700 text-white hover:bg-sky-600 px-4 py-3 rounded-lg transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                @click="sendFollowUp('outlook')"
                :disabled="!selectedCardForDrafts?.emails?.length"
                :title="!selectedCardForDrafts?.emails?.length ? 'No email on this card' : 'Open Outlook with this follow-up'"
              )
                VaIcon(name="forward_to_inbox" size="18px")
                span Send with Outlook
            .flex.flex-wrap.justify-end.gap-3
              button(
                class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-gray-300"
                @click="showEmailModal = false"
              ) Close
              button(
                class="bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-emerald-300 flex items-center gap-2 disabled:opacity-50"
                @click="rewriteFollowUp"
                :disabled="generatingDraft === selectedCardForDrafts?.id"
              )
                .loading-spinner.w-3.h-3.border-2(v-if="generatingDraft === selectedCardForDrafts?.id")
                VaIcon(v-else name="refresh" size="16px")
                span {{ generatingDraft === selectedCardForDrafts?.id ? 'Rewriting…' : 'Rewrite' }}
              button(
                class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-gray-300 flex items-center gap-2 disabled:opacity-50"
                @click="editFollowUpContext"
                :disabled="generatingDraft === selectedCardForDrafts?.id"
              )
                VaIcon(name="tune" size="16px")
                span Edit context
              button(
                class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-gray-300 flex items-center gap-2"
                @click="copyEmailDraft"
              )
                VaIcon(name="content_copy" size="16px")
                span {{ copiedEmailDraft ? 'Copied!' : 'Copy' }}
              button(
                class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-gray-300 flex items-center gap-2 disabled:opacity-50"
                @click="sendFollowUp('mailto')"
                :disabled="!selectedCardForDrafts?.emails?.length"
              )
                VaIcon(name="send" size="16px")
                span Other mail app
              button(
                class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-gray-300 flex items-center gap-2"
                @click="sendSMSDraft"
                :disabled="!selectedCardForDrafts?.phones?.length"
                :title="!selectedCardForDrafts?.phones?.length ? 'No phone number available' : ''"
              )
                VaIcon(name="sms" size="16px")
                span SMS

      // Pre-write context sheet (where + intent + optional note)
      VaModal(
        v-model="showContextSheetModal"
        :hide-default-actions="true"
        class="billio-modal modal-container rounded-2xl z-[110]"
      )
        .p-6(class="sm:p-8")
          h3.text-2xl.font-bold.mb-1 Quick context
          p.text-sm.text-slate-500.mb-5 Two taps make a better follow-up. Everything is optional.
          p.text-sm.font-medium.text-slate-800.mb-1 {{ selectedCardForGeneration?.name }}
          p.text-xs.text-slate-500.mb-5(v-if="selectedCardForGeneration?.company") {{ selectedCardForGeneration.company }}

          .mb-5
            p.text-sm.font-semibold.text-slate-800.mb-2 Where did you meet?
            .flex.flex-wrap.gap-2.mb-2(v-if="recentEventsForSheet.length")
              button(
                v-for="event in recentEventsForSheet"
                :key="event.id"
                type="button"
                class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                :class="contextSheet.eventId === event.id ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'"
                @click="selectContextEvent(event.id)"
              ) {{ event.name }}
            .flex.flex-wrap.gap-2.mb-2
              button(
                v-for="type in meetingTypes"
                :key="type.id"
                type="button"
                class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                :class="contextSheet.meetingType === type.id && !contextSheet.eventId && !contextSheet.namingNewEvent ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'"
                @click="selectContextMeetingType(type.id)"
              ) {{ type.label }}
            button(
              type="button"
              class="rounded-lg border border-dashed px-3 py-2 text-sm font-medium transition-colors"
              :class="contextSheet.namingNewEvent ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600 hover:border-emerald-300'"
              @click="startNamingNewEvent"
            ) + Name a new event
            input.mt-2.w-full.rounded-xl.border.border-slate-200.px-4.text-base(
              v-if="contextSheet.namingNewEvent"
              v-model="contextSheet.newEventName"
              type="text"
              maxlength="80"
              placeholder="e.g. SaaStr 2026"
              class="py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            )

          .mb-5
            p.text-sm.font-semibold.text-slate-800.mb-2 What’s this follow-up for?
            .flex.flex-wrap.gap-2
              button(
                v-for="intent in followUpIntents"
                :key="intent.id"
                type="button"
                class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                :class="contextSheet.followUpIntent === intent.id ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'"
                @click="contextSheet.followUpIntent = intent.id; clearContextSheetNudge()"
              ) {{ intent.label }}

          .mb-2
            label.block.text-sm.font-semibold.text-slate-800.mb-2 Anything you talked about? (optional)
            textarea(
              v-model="contextSheet.metNote"
              rows="2"
              maxlength="280"
              placeholder="e.g. Booth chat about pricing for their sales team"
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            )

          p.text-sm.text-amber-700.mt-3(
            v-if="contextSheetSoftNudge"
          ) {{ contextSheetSoftNudge }}
          p.text-sm.text-red-600.mt-3(v-if="draftGenError") {{ draftGenError }}
          .flex.flex-wrap.justify-end.gap-3.mt-6
            button(
              type="button"
              class="bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
              @click="showContextSheetModal = false; draftGenError = ''; contextSheetSoftNudge = ''"
              :disabled="!!generatingDraft"
            ) Cancel
            button(
              type="button"
              class="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              @click="submitContextSheet(false)"
              :disabled="!!generatingDraft"
            ) Skip & write
            button(
              type="button"
              class="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
              @click="submitContextSheet(true)"
              :disabled="!!generatingDraft"
            )
              .loading-spinner.w-3.h-3.border-2.border-white(v-if="generatingDraft")
              span {{ generatingDraft ? 'Writing…' : (contextSheetAllowEmpty ? 'Write anyway' : 'Write follow-up') }}

      // Confirmation Modal
      VaModal(
        v-model="showConfirmModal"
        :hide-default-actions="true"
        class="billio-modal modal-container rounded-2xl z-[100]"
      )
        .p-8.relative(class="sm:mt-0 mt-16")
          button.absolute.top-4.right-4.p-2.rounded-lg(
            class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            @click="showConfirmModal = false"
          )
            VaIcon(name="close" size="24px")
          .flex.items-center.justify-between.mb-6
            h3.text-2xl.font-bold Follow-ups
          
          // Card Info Section
          .bg-gray-50.rounded-xl.p-4.mb-6.flex.items-center.gap-4
            VaIcon(name="person" size="24px" class="text-emerald-600")
            .flex-1
              p.font-medium.text-gray-900 {{ selectedCardForGeneration?.name }}
              p.text-sm.text-gray-600 {{ selectedCardForGeneration?.company }}
          
          // Drafts List
          .space-y-4.overflow-y-auto(style="max-height: 50vh")
            .draft-item(
              v-for="draft in cardDrafts[selectedCardForGeneration?.id]"
              :key="draft.id"
              class="bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-500 transition-all duration-200 cursor-pointer"
              @click="showDraftDetails(draft)"
            )
              .flex.items-start.justify-between.gap-4
                .flex.flex-col.gap-2
                  p.text-sm.text-gray-500 {{ new Date(draft.createdAt.toDate()).toLocaleString() }}
                  p.text-base.text-gray-700.line-clamp-2 {{ draft.content }}
                .flex.flex-col.gap-2
                  button(
                    class="text-emerald-600 hover:text-emerald-700 transition-colors duration-200 p-2 rounded-lg hover:bg-emerald-50 tooltip-container"
                    @click.stop="copyDraft(draft.content, draft.id)"
                  )
                    VaIcon(name="content_copy" size="18px")
                    span.tooltip {{ copiedDrafts[draft.id] ? 'Copied!' : 'copy?' }}
            
            // Empty State
            .empty-state(
              v-if="!cardDrafts[selectedCardForGeneration?.id]?.length"
              class="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
            )
              VaIcon(name="description" size="48px" class="text-gray-400 mb-4")
              p.text-gray-500.text-center.mb-2 No follow-ups yet
              p.text-sm.text-gray-400.text-center Click “New follow-up” to write your first note
            
            // Loading State
            .loading-state(
              v-if="loadingDrafts[selectedCardForGeneration?.id]"
              class="flex justify-center py-12"
            )
              .loading-spinner

          // Bottom Actions
          .flex.justify-end.gap-4.mt-6.pt-4.border-t.border-gray-100
            p.text-sm.text-red-600.mr-auto.max-w-xs(
              v-if="draftGenError"
            ) {{ draftGenError }}
            button(
              class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-gray-300"
              @click="showConfirmModal = false; draftGenError = ''"
            ) Close
            button(
              class="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50"
              @click="proceedWithGeneration"
              :disabled="generatingDraft === selectedCardForGeneration?.id"
            )
              .loading-spinner.w-3.h-3.border-2.border-white(v-if="generatingDraft === selectedCardForGeneration?.id")
              VaIcon(v-else name="smart_toy" size="16px")
              span {{ generatingDraft === selectedCardForGeneration?.id ? 'Writing…' : 'Write new follow-up' }}

      // Move to Event Modal
      VaModal(
        v-model="showMoveToEventModal"
        :hide-default-actions="true"
        class="billio-modal modal-container rounded-2xl z-[100]"
      )
        .p-8
          h3.text-2xl.font-bold.mb-6 {{ selectedCardForMove?.eventId ? 'Change Event' : 'Add to Event' }}
          .space-y-4
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Select Event
              .flex.flex-wrap.items-center.gap-2
                select(
                  v-model="selectedEventForMove"
                  class="flex-1 border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
                )
                  option(value="") No Event
                  option(
                    v-for="event in events"
                    :key="event.id"
                    :value="event.id"
                  ) {{ event.name }} {{ event.date ? `(${formatDate(event.date)})` : '' }}
                button(
                  @click="openCreateEventFromModal"
                  class="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all flex items-center gap-1 text-gray-700"
                  title="Create New Event"
                )
                  VaIcon(name="add" size="18px")
                  span Create New
              
            // Display selected card info
            .bg-gray-50.rounded-xl.p-4.mt-3(v-if="selectedCardForMove")
              .flex.items-center.gap-3
                VaIcon(name="contact_page" size="24px" class="text-emerald-600")
                .flex.flex-col
                  .font-medium.text-gray-900 {{ selectedCardForMove.name }}
                  .text-sm.text-gray-600 {{ selectedCardForMove.company || selectedCardForMove.title || 'Contact' }}
          
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
        class="billio-modal modal-container rounded-2xl z-[100]"
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
                :class="eventNameError ? 'border-red-300 focus:ring-red-500' : ''"
              )
              .text-red-500.text-sm.mt-1(v-if="eventNameError") {{ eventNameError }}
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
        class="billio-modal modal-container rounded-2xl z-[100]"
      )
        .p-8
          h3.text-2xl.font-bold.mb-4 Delete Business Card
          p.text-gray-600.mb-4.text-lg(class="font-light") Are you sure you want to delete {{ selectedCardForDelete?.name || 'this contact' }}? This action cannot be undone.
          p.text-sm.text-red-600.mb-4(v-if="error && deletingCard === false && showDeleteModal") {{ error }}
          .flex.justify-end.gap-4
            button(
              class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              @click="showDeleteModal = false; error = ''"
              :disabled="deletingCard"
            ) Cancel
            button(
              class="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
              @click="deleteCard"
              :disabled="deletingCard"
            )
              .loading-spinner.w-4.h-4.border-2(v-if="deletingCard")
              VaIcon(v-else name="delete" size="16px")
              span(class="font-medium") {{ deletingCard ? 'Deleting...' : 'Delete Card' }}

      // QR Code Section — progressive; unlocked after first capture / send
      #billo-qr-share.billo-panel-premium.billo-motion.mt-12.p-5(v-if="showAdvancedShare" class="sm:p-8")
        .mb-8.text-center
          h2.text-xl.font-bold.tracking-tight(class="text-slate-900 sm:text-2xl") Share Your Info
          p.mt-2.text-sm(class="text-slate-600 sm:text-base")
            template(v-if="profileIsLive") Let others connect by scanning your live profile QR
            template(v-else) Finish Go live so your QR opens a real public contact card
        
        .flex.flex-col.items-center.gap-8(v-if="profileIsLive")
          // QR Code Display
          #qr-code-container.relative.rounded-2xl.border.bg-white.p-5.shadow-md(
            class="border-slate-200/80 sm:p-6"
          )
            QrcodeVue(
              :value="profileUrl"
              :size="200"
              level="H"
              render-as="svg"
              :margin="0"
              class="bg-white transition-all duration-300"
              ref="qrCodeRef"
            )
          
          // Download Options
          .home-qr-actions.flex.flex-col.items-center(class="sm:flex-row sm:justify-center sm:gap-3")
            button(
              class="w-full sm:w-auto bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base"
              @click="downloadQRCode()"
            )
              VaIcon(name="download" size="18px")
              VaIcon(name="qr_code" size="18px")
              span(class="font-medium") Download QR
            
            button(
              class="w-full sm:w-auto bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base"
              @click="downloadBusinessCard()"
            )
              VaIcon(name="download" size="18px")
              VaIcon(name="business_card" size="18px")
              span(class="font-medium") Download Card

            button(
              class="w-full sm:w-auto bg-black text-white hover:bg-gray-900 border border-black px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base relative group"
              @click="addToAppleWallet()"
              :disabled="!walletService.isAppleWalletSupported()"
              :class="!walletService.isAppleWalletSupported() ? 'opacity-50 cursor-not-allowed' : ''"
            )
              VaIcon(name="wallet" size="18px")
              span(class="font-medium") Add to Wallet
              span.text-xs.text-gray-400.ml-2 (Coming Soon)
              span(
                v-if="!walletService.isAppleWalletSupported()"
                class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
              ) Not supported on this device

            button(
              class="w-full sm:w-auto bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base group relative"
              @click="copyProfileUrl"
            )
              VaIcon(name="content_copy" size="18px")
              span(class="font-medium") {{ copiedLink ? 'Copied!' : 'Copy Link' }}
              span(
                class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
                v-if="!copiedLink"
              ) Copy profile link to clipboard

        .flex.flex-col.items-center.gap-4.text-center(v-else)
          p.text-sm.text-slate-600.max-w-md Set a public link, keep one contact method visible, then go live. Until then we won’t share a broken QR.
          router-link(
            to="/profile-setup#go-live"
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          )
            VaIcon(name="rocket_launch" size="18px")
            span Go live

      // Plan Limit Modal
      PlanLimitModal(
        :show="showPlanLimitModal"
        :message="planLimitMessage"
        :current-card-id="selectedCardForGeneration?.id"
        @close="hidePlanLimitModal"
      )

      // Edit Card Modal
      VaModal(
        v-model="showEditCardModal"
        :hide-default-actions="true"
        class="billio-modal modal-container rounded-2xl z-[100]"
      )
        .p-8
          h3.text-2xl.font-bold.mb-6 Edit Business Card
          .space-y-6
            // Name and Title Section
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Name
              input(
                v-model="editCardData.name"
                type="text"
                placeholder="Enter name"
                class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              )
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Title
              input(
                v-model="editCardData.title"
                type="text"
                placeholder="Enter title"
                class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              )
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Company
              input(
                v-model="editCardData.company"
                type="text"
                placeholder="Enter company"
                class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              )
            
            // Event Selection
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Event
              .flex.flex-wrap.items-center.gap-2
                select(
                  v-model="editCardData.eventId"
                  class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
                )
                  option(value="") No Event
                  option(
                    v-for="event in events"
                    :key="event.id"
                    :value="event.id"
                  ) {{ event.name }} {{ event.date ? `(${formatDate(event.date)})` : '' }}
                button(
                  @click="handleCreateEvent"
                  class="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all flex items-center gap-1 text-gray-700"
                  title="Create New Event"
                )
                  VaIcon(name="add" size="18px")
                  span.sm_block.hidden New Event

            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 What did you talk about?
              textarea(
                v-model="editCardData.metNote"
                rows="2"
                maxlength="280"
                placeholder="e.g. Booth chat about pricing / hiring / partnership"
                class="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              )

            // Contact Information
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Email Addresses
              .space-y-2
                .flex.items-center.gap-2(v-for="(email, index) in editCardData.emails" :key="index")
                  input(
                    v-model="editCardData.emails[index]"
                    type="email"
                    placeholder="Enter email"
                    class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
                  )
                  button(
                    @click="removeEmail(index)"
                    class="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  )
                    VaIcon(name="remove_circle" size="20px")
              button(
                @click="addEmail"
                class="mt-2 text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm"
              )
                VaIcon(name="add_circle" size="16px")
                span Add Email
                
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Phone Numbers
              .space-y-2
                .flex.items-center.gap-2(v-for="(phone, index) in editCardData.phones" :key="index")
                  input(
                    v-model="editCardData.phones[index]"
                    type="tel"
                    placeholder="Enter phone"
                    class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
                  )
                  button(
                    @click="removePhone(index)"
                    class="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  )
                    VaIcon(name="remove_circle" size="20px")
              button(
                @click="addPhone"
                class="mt-2 text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm"
              )
                VaIcon(name="add_circle" size="16px")
                span Add Phone
                
            .form-group
              label.block.text-sm.font-medium.text-gray-700.mb-1 Websites
              .space-y-2
                .flex.items-center.gap-2(v-for="(website, index) in editCardData.websites" :key="index")
                  input(
                    v-model="editCardData.websites[index]"
                    type="url"
                    placeholder="Enter website"
                    class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
                  )
                  button(
                    @click="removeWebsite(index)"
                    class="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  )
                    VaIcon(name="remove_circle" size="20px")
              button(
                @click="addWebsite"
                class="mt-2 text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm"
              )
                VaIcon(name="add_circle" size="16px")
                span Add Website
                
          // Action buttons
          .flex.justify-end.gap-4.mt-8
            button(
              class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              @click="showEditCardModal = false"
            ) Cancel
            button(
              class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
              @click="saveCardChanges"
              :disabled="saving"
            )
              .loading-spinner.w-4.h-4.border-2(v-if="saving")
              VaIcon(v-else name="save" size="16px")
              span(class="font-medium") {{ saving ? 'Saving...' : 'Save Changes' }}

    // Login Prompt Modal
    VaModal(
      v-model="showLoginPrompt"
      :hide-default-actions="true"
      class="billio-modal modal-container rounded-2xl z-[100]"
    )
      .p-8
        .text-center.mb-8
          VaIcon(name="login" size="48px" class="text-emerald-500 mb-4")
          h3.text-2xl.font-bold.text-gray-900 Sign In Required
          p.text-gray-600.mt-2 {{ loginPromptMessage }}
        
        .flex.justify-center.gap-4
          button(
            class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
            @click="showLoginPrompt = false"
          ) Cancel
          button(
            class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
            @click="router.push('/auth')"
          )
            VaIcon(name="login" size="16px")
            span(class="font-medium") Sign In

      // Pagination controls
      .flex.justify-center.items-center.gap-2.mt-8.pb-4(v-if="totalPages > 1")
        button(
          class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          @click="prevPage"
          :disabled="currentPage === 1"
          aria-label="Previous page"
        )
          VaIcon(name="chevron_left" size="20px" class="text-gray-700")
        
        // Page numbers
        template(v-if="totalPages <= 7")
          button(
            v-for="page in totalPages"
            :key="page"
            @click="goToPage(page)"
            class="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
            :class="currentPage === page ? 'bg-emerald-500 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'"
          ) {{ page }}
        
        // Truncated page numbers for many pages
        template(v-else)
          // First page
          button(
            @click="goToPage(1)"
            class="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
            :class="currentPage === 1 ? 'bg-emerald-500 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'"
          ) 1
          
          // Ellipsis if needed before middle pages
          .text-gray-400(v-if="currentPage > 3") ...
          
          // Middle pages
          template(v-for="page in totalPages" :key="page")
            button(
              v-if="page !== 1 && page !== totalPages && (page === currentPage || page === currentPage - 1 || page === currentPage + 1)"
              @click="goToPage(page)"
              class="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
              :class="currentPage === page ? 'bg-emerald-500 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'"
            ) {{ page }}
          
          // Ellipsis if needed after middle pages
          .text-gray-400(v-if="currentPage < totalPages - 2") ...
          
          // Last page
          button(
            @click="goToPage(totalPages)"
            class="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
            :class="currentPage === totalPages ? 'bg-emerald-500 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'"
          ) {{ totalPages }}
        
        button(
          class="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          @click="nextPage"
          :disabled="currentPage === totalPages"
          aria-label="Next page"
        )
          VaIcon(name="chevron_right" size="20px" class="text-gray-700")
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { businessCardService } from '../../services/businessCardService';
import { authService } from '../../services/authService';
import { paymentService } from '../../services/paymentService';
import { walletService } from '../../services/walletService';
import { useRouter, useRoute } from 'vue-router';
import QrcodeVue from 'qrcode.vue';
import PlanLimitModal from '../../components/PlanLimitModal.vue';
// Import formatDate from dateUtils
import { formatDate } from '../../utils/dateUtils';
import { buildLiveProfileShareUrl, isPublicProfileLive } from '../../utils/publicProfile';
import { buildFollowUpMessage, openFollowUpCompose } from '../../utils/followUpSend';
import { compressImageForScan } from '../../utils/compressImageForScan';
import {
  MEETING_TYPES,
  FOLLOW_UP_INTENTS,
  getMeetingTypeLabel,
  getFollowUpIntentLabel,
  cardHasDraftContext,
  loadFollowUpContextPrefs,
  saveFollowUpContextPrefs
} from '../../constants/followUpContext';

const router = useRouter();
const route = useRoute();
const user = ref(null);
const homeMode = ref('capture');
const followUpTab = ref('pending'); // 'pending' | 'done'
const firstRunCoachDismissed = ref(false);
const showProfileEnrichNudge = ref(false);
const shareUnlocked = ref(false);
const businessCards = ref([]);
const uploading = ref(false);
const processingStatus = ref('');
const error = ref('');
const fileInput = ref(null);
const cameraInput = ref(null);
const scanMetNote = ref('');
const showUploadEventConfirm = ref(false);
const uploadConfirmPlace = ref('');
const scanSourceMode = ref('auto');
const selectedEventFilter = ref('all');
const showEmailModal = ref(false);
const emailDraft = ref('');
const showDraftsModal = ref(false);
const emailDrafts = ref({});
const cardDrafts = ref({});
const generatingDraft = ref(null);
const draftGenError = ref('');
const loadingDrafts = ref({});
const expandedDrafts = ref({});
const showConfirmModal = ref(false);
const selectedCardForGeneration = ref(null);
const showContextSheetModal = ref(false);
const contextSheetSoftNudge = ref('');
const contextSheetAllowEmpty = ref(false);
const previousDraftSnapshot = ref(null);
const contextSheet = ref({
  eventId: '',
  meetingType: '',
  namingNewEvent: false,
  newEventName: '',
  followUpIntent: '',
  metNote: ''
});
const meetingTypes = MEETING_TYPES;
const followUpIntents = FOLLOW_UP_INTENTS;
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
const contactSheetCardId = ref(null);
const copiedLink = ref(false);
const showPlanLimitModal = ref(false);
const planLimitMessage = ref('');
const showLoginPrompt = ref(false);
const loginPromptMessage = ref('');
const isPremium = ref(false);
const showQR = ref(false);
const copiedEmailDraft = ref(false);
const copiedDrafts = ref({});
const eventNameError = ref('');
const searchQuery = ref('');
const firestoreProfileSlug = ref('');
const firestoreProfileLive = ref(false);

async function refreshFirestoreProfileSlug() {
  firestoreProfileSlug.value = '';
  firestoreProfileLive.value = false;
  try {
    const p = await authService.getUserProfile();
    firestoreProfileSlug.value = (p && p.publicProfileSlug) || '';
    firestoreProfileLive.value = isPublicProfileLive(p || {});
  } catch {
    firestoreProfileSlug.value = '';
    firestoreProfileLive.value = false;
  }
}

const STORAGE_KEY = 'selected_event_filter';

// Add successMessage ref
const successMessage = ref('');

// Add these refs after other refs
const showEditCardModal = ref(false);
const editCardData = ref({
  id: null,
  name: '',
  title: '',
  company: '',
  emails: [],
  phones: [],
  websites: [],
  eventId: null,
  metNote: '',
  meetingType: '',
  followUpIntent: ''
});
const saving = ref(false);

const showDeleteConfirm = ref(false);
const deletingCardId = ref(null);
const confirmTextVisible = ref(false);
const selectedFiles = ref([]);
const previewUrls = ref([]);
const selectedPreviewEvent = ref('');
// Add new refs for contact files
const selectedContactFiles = ref([]);
const contactFilesInfo = ref([]);
const showContactPreview = ref(false);
// Variable to store callback when creating an event from card
let eventCreationCallback = null;

// Pagination
const cardsPerPage = 12;
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCards.value.length / cardsPerPage)));
const paginatedCards = computed(() => {
  const startIndex = (currentPage.value - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  return filteredCards.value.slice(startIndex, endIndex);
});

const showContactSheet = computed({
  get: () => !!contactSheetCardId.value,
  set: (open) => {
    if (!open) {
      contactSheetCardId.value = null;
      expandedContact.value = { type: null, cardId: null };
    }
  }
});

const contactSheetCard = computed(() => {
  if (!contactSheetCardId.value) return null;
  return businessCards.value.find((c) => c.id === contactSheetCardId.value) || null;
});

// Update page when filters change — also watched with followUpTab near filteredCards
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    // Scroll to the top of the cards section
    document.getElementById('cards-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1);
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1);
  }
}

// Add these functions after other functions
function openEditCardModal(card) {
  editCardData.value = {
    id: card.id,
    name: card.name || '',
    title: card.title || '',
    company: card.company || '',
    emails: [...(card.emails || [])],
    phones: [...(card.phones || [])],
    websites: [...(card.websites || [])],
    eventId: card.eventId,
    metNote: card.metNote || '',
    meetingType: card.meetingType || '',
    followUpIntent: card.followUpIntent || ''
  };
  showEditCardModal.value = true;
}

function addEmail() {
  editCardData.value.emails.push('');
}

function removeEmail(index) {
  editCardData.value.emails.splice(index, 1);
}

function addPhone() {
  editCardData.value.phones.push('');
}

function removePhone(index) {
  editCardData.value.phones.splice(index, 1);
}

function addWebsite() {
  editCardData.value.websites.push('');
}

function removeWebsite(index) {
  editCardData.value.websites.splice(index, 1);
}

async function saveCardChanges() {
  try {
    saving.value = true;
    error.value = '';

    // Filter out empty values
    const updatedCard = {
      ...editCardData.value,
      emails: editCardData.value.emails.filter(email => email.trim()),
      phones: editCardData.value.phones.filter(phone => phone.trim()),
      websites: editCardData.value.websites.filter(website => website.trim()),
      eventId: editCardData.value.eventId || null,
      metNote: (editCardData.value.metNote || '').trim(),
      meetingType: (editCardData.value.meetingType || '').trim(),
      followUpIntent: (editCardData.value.followUpIntent || '').trim()
    };

    await businessCardService.updateCard(updatedCard);

    // Update the card in the local state
    const index = businessCards.value.findIndex(c => c.id === updatedCard.id);
    if (index !== -1) {
      businessCards.value[index] = {
        ...businessCards.value[index],
        ...updatedCard
      };
    }

    showEditCardModal.value = false;
  } catch (err) {
    console.error('Error updating card:', err);
    error.value = 'Error updating business card';
  } finally {
    saving.value = false;
  }
}

// Auth state management
onMounted(() => {
  try {
    firstRunCoachDismissed.value = localStorage.getItem('billo_first_run_dismissed') === '1';
  } catch {
    firstRunCoachDismissed.value = false;
  }

  const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
    user.value = currentUser;
    if (currentUser) {
      const startScanFlag = route.query.start === 'scan';
      const eventFromEmail =
        typeof route.query.event === 'string' && route.query.event ? route.query.event : '';

      const savedEvent = localStorage.getItem(STORAGE_KEY);
      if (eventFromEmail) {
        selectedEventFilter.value = eventFromEmail;
        selectedPreviewEvent.value = eventFromEmail;
      } else {
        selectedEventFilter.value = savedEvent || 'all';
      }

      refreshFirestoreProfileSlug();
      await loadCards();
      loadEvents();
      // Check premium status
      checkPremiumStatus();

      try {
        shareUnlocked.value = localStorage.getItem('billo_share_unlocked') === '1';
      } catch {
        shareUnlocked.value = false;
      }
      if (businessCards.value.length > 0) {
        unlockShareFeatures();
        homeMode.value = startScanFlag ? 'capture' : 'followups';
      } else {
        homeMode.value = 'capture';
      }

      try {
        const profile = await authService.getUserProfile();
        showProfileEnrichNudge.value = !!profile?.profileEnrichmentPending;
      } catch {
        showProfileEnrichNudge.value = false;
      }

      if (startScanFlag || eventFromEmail) {
        router.replace({ path: '/home' });
      }

      const shouldStartScan =
        startScanFlag ||
        (() => {
          try {
            return localStorage.getItem('billo_start_scan') === '1';
          } catch {
            return false;
          }
        })();

      if (shouldStartScan) {
        try {
          localStorage.removeItem('billo_start_scan');
        } catch {
          /* ignore */
        }
        nextTick(() => {
          if (currentUser.emailVerified) handleCameraScan();
        });
      }
    }
  });

  // Cleanup subscription
  return () => unsubscribe();
});

const firstRunHasCard = computed(() => businessCards.value.length > 0);
const firstRunHasDraft = computed(() =>
  Object.values(cardDrafts.value || {}).some((list) => Array.isArray(list) && list.length > 0) ||
  Object.keys(emailDrafts.value || {}).length > 0
);
const firstRunHasSent = computed(() => {
  const lists = Object.values(cardDrafts.value || {});
  return lists.some(
    (list) => Array.isArray(list) && list.some((d) => d?.status === 'sent' || d?.sentAt)
  );
});

function cardHasFollowedUp(card) {
  if (!card?.id) return false;
  const drafts = cardDrafts.value[card.id];
  if (!Array.isArray(drafts) || drafts.length === 0) return false;
  return drafts.some((d) => d?.status === 'sent' || d?.sentAt);
}

const pendingCardCount = computed(
  () => (businessCards.value || []).filter((c) => !cardHasFollowedUp(c)).length
);
const followedUpCardCount = computed(
  () => (businessCards.value || []).filter((c) => cardHasFollowedUp(c)).length
);
const pendingFollowUpCount = computed(() => pendingCardCount.value);
const showCaptureSurface = computed(
  () =>
    homeMode.value === 'capture' ||
    selectedFiles.value.length > 0 ||
    uploading.value ||
    (showContactPreview.value && selectedContactFiles.value.length > 0)
);
const showFollowUpsSurface = computed(
  () =>
    homeMode.value === 'followups' &&
    !selectedFiles.value.length &&
    !uploading.value &&
    !(showContactPreview.value && selectedContactFiles.value.length > 0)
);
/** Real Firestore events only — never meetingType labels. */
const realEvents = computed(() => (events.value || []).filter((e) => e?.id && e?.name));
const recentEventsForSheet = computed(() => (realEvents.value || []).slice(0, 6));
const showAdvancedShare = computed(() => shareUnlocked.value || firstRunHasSent.value);
const showFirstRunCoach = computed(() => {
  if (!user.value?.emailVerified) return false;
  if (firstRunCoachDismissed.value) return false;
  if (firstRunHasSent.value) return false;
  try {
    return localStorage.getItem('billo_first_run') === '1' || route.query.start === 'scan';
  } catch {
    return route.query.start === 'scan';
  }
});

function unlockShareFeatures() {
  shareUnlocked.value = true;
  try {
    localStorage.setItem('billo_share_unlocked', '1');
    window.dispatchEvent(new Event('billo-share-unlocked'));
  } catch {
    /* ignore */
  }
}

function dismissFirstRunCoach() {
  firstRunCoachDismissed.value = true;
  try {
    localStorage.setItem('billo_first_run_dismissed', '1');
    localStorage.removeItem('billo_first_run');
  } catch {
    /* ignore */
  }
}

async function loadCards() {
  try {
    // If selectedEventFilter is 'all', pass null to get all cards
    // If it's 'null', pass null to get only cards with no event
    // Otherwise pass the event ID
    const filterValue = 
      selectedEventFilter.value === 'all' ? null : 
      selectedEventFilter.value === 'null' ? null :
      selectedEventFilter.value;
    
    businessCards.value = await businessCardService.getCards(filterValue);
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
    // Preview files instead of uploading immediately
    previewSelectedFiles(files);
  }
}

async function handleDrop(event) {
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    // Separate image files and VCF files
    const imageFiles = [];
    const vcfFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      } else if (file.name.endsWith('.vcf') || file.name.endsWith('.vcard') || file.type === 'text/vcard') {
        vcfFiles.push(file);
      }
    }
    
    // Handle image files
    if (imageFiles.length > 0) {
      previewSelectedFiles(imageFiles);
    }
    
    // Handle VCF files - Modified to use preview instead of direct upload
    if (vcfFiles.length > 0) {
      previewSelectedContactFiles(vcfFiles);
    }
    
    // Show error if no valid files found
    if (imageFiles.length === 0 && vcfFiles.length === 0) {
      error.value = 'Please upload only image or VCF files';
    }
  }
}

async function previewSelectedFiles(files) {
  // Clear existing selection
  selectedFiles.value = [];
  previewUrls.value = [];
  homeMode.value = 'capture';
  scanSourceMode.value = 'auto';

  // Default event: active filter, else last used real event
  if (
    selectedEventFilter.value &&
    selectedEventFilter.value !== 'all' &&
    selectedEventFilter.value !== 'null'
  ) {
    selectedPreviewEvent.value = selectedEventFilter.value;
  } else {
    const prefs = loadFollowUpContextPrefs();
    if (prefs.eventId && (events.value || []).some((e) => e.id === prefs.eventId)) {
      selectedPreviewEvent.value = prefs.eventId;
    }
  }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue;
    try {
      const compressed = await compressImageForScan(file);
      const url = URL.createObjectURL(compressed);
      previewUrls.value.push(url);
      selectedFiles.value.push(compressed);
    } catch (err) {
      console.error('Image compress failed, using original:', err);
      const url = URL.createObjectURL(file);
      previewUrls.value.push(url);
      selectedFiles.value.push(file);
    }
  }
}

function previewSelectedContactFiles(files) {
  // Clear existing selection
  selectedContactFiles.value = [];
  contactFilesInfo.value = [];
  homeMode.value = 'capture';

  if (
    selectedEventFilter.value &&
    selectedEventFilter.value !== 'all' &&
    selectedEventFilter.value !== 'null'
  ) {
    selectedPreviewEvent.value = selectedEventFilter.value;
  } else {
    const prefs = loadFollowUpContextPrefs();
    if (prefs.eventId && (events.value || []).some((e) => e.id === prefs.eventId)) {
      selectedPreviewEvent.value = prefs.eventId;
    }
  }
  
  // Process VCF files
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Extract filename without extension for display
    const fileName = file.name.replace(/\.(vcf|vcard)$/i, '');
    
    contactFilesInfo.value.push({
      name: fileName,
      size: file.size,
      fullName: file.name
    });
    selectedContactFiles.value.push(file);
  }
  
  // Show the contact preview section
  showContactPreview.value = true;
}

function parsePreviewPlace(value) {
  const raw = value == null ? '' : String(value);
  if (!raw || raw === 'null') {
    return { eventId: null, meetingType: '' };
  }
  if (raw.startsWith('mt:')) {
    const meetingType = raw.slice(3);
    return { eventId: null, meetingType };
  }
  return { eventId: raw, meetingType: '' };
}

function resolveUploadPlace(preferred = '') {
  const fromPreferred = parsePreviewPlace(preferred);
  if (fromPreferred.eventId || fromPreferred.meetingType) return fromPreferred;

  const fromPreview = parsePreviewPlace(selectedPreviewEvent.value);
  if (fromPreview.eventId || fromPreview.meetingType) return fromPreview;

  if (
    selectedEventFilter.value &&
    selectedEventFilter.value !== 'all' &&
    selectedEventFilter.value !== 'null' &&
    realEvents.value.some((e) => e.id === selectedEventFilter.value)
  ) {
    return { eventId: selectedEventFilter.value, meetingType: '' };
  }

  return { eventId: null, meetingType: '' };
}

async function processSelectedFiles() {
  if (selectedFiles.value.length === 0) return;

  if (selectedFiles.value.length > 1) {
    uploadConfirmPlace.value = selectedPreviewEvent.value || '';
    showUploadEventConfirm.value = true;
    return;
  }

  await runSelectedFilesUpload(selectedPreviewEvent.value);
}

async function confirmMultiUpload() {
  selectedPreviewEvent.value = uploadConfirmPlace.value;
  showUploadEventConfirm.value = false;
  await runSelectedFilesUpload(uploadConfirmPlace.value);
}

async function runSelectedFilesUpload(placeValue) {
  const { eventId, meetingType } = resolveUploadPlace(placeValue);
  const note = selectedFiles.value.length === 1 ? scanMetNote.value : '';

  await uploadFiles(selectedFiles.value, eventId, note, {
    source: scanSourceMode.value === 'auto' ? undefined : scanSourceMode.value,
    meetingType
  });
  clearSelectedFiles();
}

function removeFileFromSelection(index) {
  // Release the URL to prevent memory leaks
  URL.revokeObjectURL(previewUrls.value[index]);
  
  // Remove the file from the arrays
  selectedFiles.value.splice(index, 1);
  previewUrls.value.splice(index, 1);
  
  // If no files left, reset the file input
  if (selectedFiles.value.length === 0 && fileInput.value) {
    fileInput.value.value = '';
  }
}

function clearSelectedFiles() {
  // Release all URLs to prevent memory leaks
  previewUrls.value.forEach(url => URL.revokeObjectURL(url));
  
  // Clear arrays
  selectedFiles.value = [];
  previewUrls.value = [];
  scanMetNote.value = '';
  scanSourceMode.value = 'auto';
  showUploadEventConfirm.value = false;
  uploadConfirmPlace.value = '';
  
  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  if (cameraInput.value) {
    cameraInput.value.value = '';
  }
}

async function uploadFiles(files, eventId = null, metNote = '', options = {}) {
  // No need to check file types again, already done in preview
  uploading.value = true;
  error.value = '';
  successMessage.value = '';
  processingStatus.value = `Preparing to scan ${files.length} contact${files.length > 1 ? 's' : ''}...`;

  try {
    const result = await businessCardService.uploadMultipleCards(
      files, 
      eventId,
      (status) => {
        processingStatus.value = status;
      },
      metNote,
      options
    );
    
    // Add all new cards to the beginning of the list
    if (result.success && result.success.length > 0) {
      result.success.forEach(card => {
        businessCards.value.unshift(card);
        // Initialize expandedDrafts for each new card
        expandedDrafts.value[card.id] = false;
      });
      unlockShareFeatures();
      homeMode.value = 'followups';
      followUpTab.value = 'pending';
    }
    
    // Set success message
    successMessage.value = result.message;
    
    // Auto-hide success message and reset states after 5 seconds
    setTimeout(() => {
      uploading.value = false;
      successMessage.value = '';
      processingStatus.value = '';
    }, 2500);
  } catch (err) {
    error.value = err.message || 'Error uploading business cards';
    console.error(err);
    
    // Auto-hide error and reset states after 5 seconds
    setTimeout(() => {
      uploading.value = false;
      error.value = '';
      processingStatus.value = '';
    }, 5000);
  }
}

async function uploadFile(file) {
  const fileArray = [file];
  await uploadFiles(fileArray);
}

async function generateEmailDraft(card) {
  await runDraftGeneration(card);
}

async function loadDrafts(cardId) {
  try {
    loadingDrafts.value[cardId] = true;
    const drafts = await businessCardService.getEmailDrafts(cardId);
    cardDrafts.value[cardId] = drafts;
    if(import.meta.env.VITE_APP_ENV === 'development') {
      console.log('Loaded drafts for card:', cardId, drafts);
    }
  } catch (err) {
    console.error('Error loading drafts:', err);
    error.value = 'Error loading email drafts';
  } finally {
    loadingDrafts.value[cardId] = false;
  }
}

function copyEmailDraft() {
  navigator.clipboard.writeText(emailDraft.value);
  copiedEmailDraft.value = true;
  setTimeout(() => {
    copiedEmailDraft.value = false;
  }, 2000);
}

function editProfile() {
  router.push('/profile-setup');
}

function copyDraft(content, draftId) {
  navigator.clipboard.writeText(content);
  copiedDrafts.value[draftId] = true;
  setTimeout(() => {
    copiedDrafts.value[draftId] = false;
  }, 2000);
}

function showDraftDetails(draft) {
  previousDraftSnapshot.value = null;
  selectedDraft.value = draft;
  emailDraft.value = draft.content;
  // Ensure we have the correct card selected when viewing from drafts list
  if (!selectedCardForDrafts.value) {
    const card = businessCards.value.find(c => c.id === draft.cardId);
    if (card) {
      selectedCardForDrafts.value = card;
    }
  }
  showEmailModal.value = true;
  showDraftsListModal.value = false; // Close the drafts list modal
}

function toggleDrafts(cardId) {
  expandedDrafts.value[cardId] = !expandedDrafts.value[cardId];
}

function confirmGenerateEmail(card) {
  selectedCardForGeneration.value = card;
  draftGenError.value = '';
  showConfirmModal.value = true;
}

/** Primary CTA: open latest draft if one exists, otherwise start a new write. */
async function openFollowUpOrGenerate(card) {
  if (!card?.id) return;
  draftGenError.value = '';
  selectedCardForGeneration.value = card;

  try {
    if (!Array.isArray(cardDrafts.value[card.id])) {
      await loadDrafts(card.id);
    }
    const drafts = cardDrafts.value[card.id] || [];
    if (drafts.length > 0) {
      selectedCardForDrafts.value = card;
      showDraftDetails(drafts[0]);
      return;
    }
    await beginDraftGeneration(card);
  } catch (err) {
    console.error('Error opening follow-up:', err);
    draftGenError.value = err?.message || 'Could not open follow-up';
    error.value = draftGenError.value;
  }
}

function patchLocalCard(cardId, patch) {
  const idx = businessCards.value.findIndex((c) => c.id === cardId);
  if (idx !== -1) {
    businessCards.value[idx] = { ...businessCards.value[idx], ...patch };
  }
  if (selectedCardForGeneration.value?.id === cardId) {
    selectedCardForGeneration.value = { ...selectedCardForGeneration.value, ...patch };
  }
  if (selectedCardForDrafts.value?.id === cardId) {
    selectedCardForDrafts.value = { ...selectedCardForDrafts.value, ...patch };
  }
  return idx !== -1
    ? businessCards.value[idx]
    : { ...(selectedCardForGeneration.value || {}), id: cardId, ...patch };
}

function resolvePreferredEventId(cardEventId = '') {
  if (cardEventId && realEvents.value.some((e) => e.id === cardEventId)) {
    return cardEventId;
  }
  const filterId = selectedEventFilter.value;
  if (filterId && filterId !== 'all' && filterId !== 'null') {
    if (realEvents.value.some((e) => e.id === filterId)) return filterId;
  }
  if (selectedPreviewEvent.value && selectedPreviewEvent.value !== 'null') {
    if (realEvents.value.some((e) => e.id === selectedPreviewEvent.value)) {
      return selectedPreviewEvent.value;
    }
  }
  const prefs = loadFollowUpContextPrefs();
  if (prefs.eventId && realEvents.value.some((e) => e.id === prefs.eventId)) {
    return prefs.eventId;
  }
  return '';
}

function openContextSheet(card) {
  const prefs = loadFollowUpContextPrefs();
  const preferredEventId = resolvePreferredEventId(card.eventId || '');
  const meetingType =
    preferredEventId
      ? ''
      : card.meetingType || prefs.meetingType || '';

  contextSheet.value = {
    eventId: preferredEventId,
    meetingType,
    namingNewEvent: false,
    newEventName: '',
    followUpIntent: card.followUpIntent || prefs.followUpIntent || '',
    metNote: card.metNote || ''
  };
  contextSheetSoftNudge.value = '';
  contextSheetAllowEmpty.value = false;
  draftGenError.value = '';
  showContextSheetModal.value = true;
}

function clearContextSheetNudge() {
  contextSheetSoftNudge.value = '';
  contextSheetAllowEmpty.value = false;
}

function selectContextEvent(eventId) {
  contextSheet.value.eventId = eventId;
  contextSheet.value.meetingType = '';
  contextSheet.value.namingNewEvent = false;
  contextSheet.value.newEventName = '';
  clearContextSheetNudge();
}

function selectContextMeetingType(typeId) {
  contextSheet.value.meetingType = typeId;
  contextSheet.value.eventId = '';
  contextSheet.value.namingNewEvent = false;
  contextSheet.value.newEventName = '';
  clearContextSheetNudge();
}

function startNamingNewEvent() {
  contextSheet.value.namingNewEvent = true;
  contextSheet.value.eventId = '';
  contextSheet.value.meetingType = '';
  clearContextSheetNudge();
}

/** Ask for place + intent when missing, then generate. */
async function beginDraftGeneration(card, { forceSheet = false, keepPrevious = false } = {}) {
  if (!card?.id) return;
  if (!keepPrevious) previousDraftSnapshot.value = null;
  selectedCardForGeneration.value = card;
  draftGenError.value = '';
  if (forceSheet || !cardHasDraftContext(card)) {
    openContextSheet(card);
    return;
  }
  await runDraftGeneration(card);
}

function snapshotDraft(draft, contentOverride = '') {
  if (!draft) return null;
  return {
    id: draft.id,
    subject: draft.subject || '',
    content: contentOverride || draft.content || '',
    signature: draft.signature || '',
    status: draft.status || 'draft'
  };
}

async function rewriteFollowUp() {
  const card = selectedCardForDrafts.value || selectedCardForGeneration.value;
  if (!card?.id) return;
  previousDraftSnapshot.value = snapshotDraft(selectedDraft.value, emailDraft.value);
  await beginDraftGeneration(card, { keepPrevious: true });
}

function usePreviousDraft() {
  if (!previousDraftSnapshot.value) return;
  const current = snapshotDraft(selectedDraft.value, emailDraft.value);
  const prev = previousDraftSnapshot.value;
  const drafts = cardDrafts.value[selectedCardForDrafts.value?.id] || [];
  const found = drafts.find((d) => d.id === prev.id);
  selectedDraft.value = found || { ...prev };
  emailDraft.value = prev.content || '';
  previousDraftSnapshot.value = current;
}

async function editFollowUpContext() {
  const card = selectedCardForDrafts.value || selectedCardForGeneration.value;
  if (!card?.id) return;
  selectedCardForGeneration.value = card;
  openContextSheet(card);
}

function contextSheetHasPlaceOrIntent() {
  const sheet = contextSheet.value;
  if (sheet.namingNewEvent && (sheet.newEventName || '').trim()) return true;
  if (sheet.eventId) return true;
  if (sheet.meetingType) return true;
  if (sheet.followUpIntent) return true;
  return false;
}

async function submitContextSheet(saveSelections) {
  const card = selectedCardForGeneration.value;
  if (!card?.id) return;

  try {
    draftGenError.value = '';
    let nextCard = { ...card };

    if (saveSelections) {
      if (!contextSheetHasPlaceOrIntent() && !contextSheetAllowEmpty.value) {
        contextSheetSoftNudge.value =
          'Add where you met for a sharper draft — or tap Write anyway.';
        contextSheetAllowEmpty.value = true;
        return;
      }

      const sheet = contextSheet.value;
      let eventId = sheet.eventId || null;
      let meetingType = sheet.meetingType || '';

      if (sheet.namingNewEvent) {
        const name = (sheet.newEventName || '').trim();
        if (!name) {
          draftGenError.value = 'Enter an event name, or pick a meeting type instead.';
          return;
        }
        const created = await businessCardService.createEvent({
          name,
          date: new Date().toISOString().slice(0, 10),
          location: ''
        });
        events.value.unshift(created);
        eventId = created.id;
        meetingType = '';
      }

      const patch = {
        eventId,
        meetingType: eventId ? '' : meetingType,
        followUpIntent: sheet.followUpIntent || '',
        metNote: (sheet.metNote || '').trim(),
        emails: card.emails || [],
        phones: card.phones || [],
        websites: card.websites || [],
        name: card.name,
        title: card.title,
        company: card.company
      };

      await businessCardService.updateCard({ ...card, ...patch });
      nextCard = patchLocalCard(card.id, {
        eventId: patch.eventId,
        meetingType: patch.meetingType,
        followUpIntent: patch.followUpIntent,
        metNote: patch.metNote
      });

      saveFollowUpContextPrefs({
        eventId: patch.eventId || '',
        meetingType: patch.meetingType || '',
        followUpIntent: patch.followUpIntent || ''
      });
    }

    showContextSheetModal.value = false;
    contextSheetSoftNudge.value = '';
    await runDraftGeneration(nextCard);
  } catch (err) {
    console.error('Error saving follow-up context:', err);
    if (err.type === 'PLAN_LIMIT') {
      showPlanLimitError(err.message);
      showContextSheetModal.value = false;
    } else {
      draftGenError.value = err?.message || 'Could not save context';
    }
  }
}

async function proceedWithGeneration() {
  if (!selectedCardForGeneration.value) return;
  await beginDraftGeneration(selectedCardForGeneration.value);
}

async function runDraftGeneration(card) {
  if (!card?.id) return;
  try {
    generatingDraft.value = card.id;
    error.value = '';
    draftGenError.value = '';

    const draft = await businessCardService.generateEmailDraft(card);
    if (import.meta.env.VITE_APP_ENV === 'development') {
      console.log('Generated draft:', draft);
    }

    await loadDrafts(card.id);

    selectedCardForDrafts.value = card;
    selectedDraft.value = draft;
    emailDraft.value = draft.content;
    showEmailModal.value = true;
    showConfirmModal.value = false;
    showContextSheetModal.value = false;
  } catch (err) {
    console.error('Error generating draft:', err);
    if (err.type === 'PLAN_LIMIT') {
      showPlanLimitError(err.message);
      showConfirmModal.value = false;
      showContextSheetModal.value = false;
    } else {
      const msg = err?.message || 'Error generating email draft';
      draftGenError.value = msg;
      error.value = msg;
    }
  } finally {
    generatingDraft.value = null;
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
    if(import.meta.env.VITE_APP_ENV === 'development') {
      console.log('Loaded events:', events.value);
    }
  } catch (err) {
    error.value = 'Error loading events';
    console.error('Error loading events:', err);
  }
}

async function createEvent() {
  if (!newEventName.value.trim()) {
    eventNameError.value = 'Event name is required';
    return;
  }

  try {
    eventNameError.value = '';
    // Create event object
    const eventData = {
      name: newEventName.value.trim(),
      date: newEventDate.value,
      location: newEventLocation.value,
    };

    const newEvent = await businessCardService.createEvent(eventData);
    
    // Add to events list
    events.value.unshift(newEvent);
    
    // Clear form
    newEventName.value = '';
    newEventDate.value = '';
    newEventLocation.value = '';
    
    // Close modal
    showCreateEventModal.value = false;

    selectedPreviewEvent.value = newEvent.id;
    if (showUploadEventConfirm.value) {
      uploadConfirmPlace.value = newEvent.id;
    }
    
    // If there's a callback from creating an event within card modal, execute it
    if (typeof eventCreationCallback === 'function') {
      eventCreationCallback(newEvent.id);
      eventCreationCallback = null;
    }
    
  } catch (err) {
    console.error('Error creating event:', err);
    if (err.type === 'PLAN_LIMIT') {
      showPlanLimitError(err.message);
    } else {
      eventNameError.value = 'Error creating event';
    }
  }
}

function getEventName(eventId) {
  if (!eventId) return '';
  const event = events.value.find(e => e.id === eventId);
  return event ? event.name : '';
}

function openMoveToEventModal(card) {
  selectedCardForMove.value = card;
  selectedEventForMove.value = card.eventId || '';
  showMoveToEventModal.value = true;
}

function openCreateEventFromModal() {
  // Store the current state to return to after creating event
  const cardToMove = selectedCardForMove.value;
  
  // Hide the current modal and show create event modal
  showMoveToEventModal.value = false;
  
  // Clear event creation form
  newEventName.value = '';
  newEventDate.value = '';
  newEventLocation.value = '';
  
  // Show create event modal
  showCreateEventModal.value = true;
  
  // Add a callback to return to the move modal with the new event selected
  eventCreationCallback = (newEventId) => {
    if (newEventId) {
      selectedCardForMove.value = cardToMove;
      selectedEventForMove.value = newEventId;
      showMoveToEventModal.value = true;
    }
  };
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
  if (selectedEventFilter.value) {
    localStorage.setItem(STORAGE_KEY, selectedEventFilter.value);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Load cards with the new filter
  loadCards();
}

// Features data for landing page
const features = [
  {
    icon: 'send',
    title: 'One-tap follow-up',
    description: 'Open a warm note in Gmail or Outlook—send from your real inbox before the lead goes cold.'
  },
  {
    icon: 'photo_camera',
    title: 'Scan the meet',
    description: 'Capture the card while you’re still talking. We pull the fields that matter.'
  },
  {
    icon: 'event',
    title: 'Event context',
    description: 'Group people by conference so Monday is a short list of follow-ups, not guesswork.'
  },
  {
    icon: 'qr_code',
    title: 'Share your link',
    description: 'Hand them your live profile + QR when they ask for yours.'
  }
];

// Stats data
const stats = computed(() => [
  {
    icon: 'groups',
    value: businessCards.value.length,
    label: 'People met'
  },
  {
    icon: 'event',
    value: events.value.length,
    label: 'Events'
  },
  {
    icon: 'send',
    value: Object.values(cardDrafts.value).reduce((n, list) => n + (list?.length || 0), 0),
    label: 'Follow-ups ready'
  }
]);

// Add watcher for selectedEventFilter
watch(selectedEventFilter, (newValue) => {
  loadCards();
});

function normalizeHexColor(color, fallback = '#ffffff') {
  const raw = String(color || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
  }
  return fallback;
}

function cardPrimaryColor(card) {
  return normalizeHexColor(card?.style?.primaryColor, '#1f2937');
}

function cardSecondaryColor(card) {
  return normalizeHexColor(card?.style?.secondaryColor, '#4B5563');
}

function cardDividerColor(card) {
  const secondary = cardSecondaryColor(card);
  // Soften divider against the card background
  return `${secondary}55`;
}

function cardChromeStyle(card) {
  const bg = normalizeHexColor(card?.style?.backgroundColor, '#ffffff');
  const border = normalizeHexColor(card?.style?.secondaryColor, '#e5e7eb');
  return {
    backgroundColor: bg,
    color: getContrastColor(bg),
    fontFamily: getFontFamily(card?.style?.fontStyle) || undefined,
    borderColor: border,
    borderWidth: '1px',
    borderStyle: 'solid'
  };
}

function cardNameStyle(card) {
  return {
    color: cardPrimaryColor(card),
    fontFamily: getFontFamily(card?.style?.fontStyle) || undefined
  };
}

function getContrastColor(hexcolor) {
  try {
    const hex = normalizeHexColor(hexcolor, '#ffffff').replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1f2937' : '#ffffff';
  } catch {
    return '#1f2937';
  }
}

function confirmDeleteCard(card) {
  if (!card?.id) return;
  selectedCardForDelete.value = card;
  showDeleteModal.value = true;
}

function openContactSheet(card) {
  if (!card?.id) return;
  contactSheetCardId.value = card.id;
  expandedContact.value = { type: null, cardId: null };
}

function closeContactSheet() {
  contactSheetCardId.value = null;
  expandedContact.value = { type: null, cardId: null };
}

function openEditFromSheet() {
  const card = contactSheetCard.value;
  if (!card) return;
  closeContactSheet();
  openEditCardModal(card);
}

function confirmDeleteFromSheet() {
  const card = contactSheetCard.value;
  if (!card) return;
  confirmDeleteCard(card);
}

async function openFollowUpFromSheet() {
  const card = contactSheetCard.value;
  if (!card) return;
  closeContactSheet();
  await openFollowUpOrGenerate(card);
}

function cardEventLabel(card) {
  if (!card) return '';
  return getEventName(card.eventId) || getMeetingTypeLabel(card.meetingType) || '';
}

function cardPrimaryCtaLabel(card) {
  if (!card) return 'Write follow-up';
  if (generatingDraft.value === card.id) return 'Writing follow-up…';
  if (followUpTab.value === 'done') return 'View follow-up';
  if (cardDrafts.value[card.id]?.length) return 'Send follow-up';
  return 'Write follow-up';
}

async function deleteCard() {
  const card = selectedCardForDelete.value;
  if (!card?.id) return;

  try {
    deletingCard.value = true;
    error.value = '';

    await businessCardService.deleteCard(card.id);

    // Remove the card from the local state
    const index = businessCards.value.findIndex((c) => c.id === card.id);
    if (index !== -1) {
      businessCards.value.splice(index, 1);
    }
    if (contactSheetCardId.value === card.id) {
      closeContactSheet();
    }
    if (cardDrafts.value[card.id]) {
      delete cardDrafts.value[card.id];
    }

    // Close the modal
    showDeleteModal.value = false;
    selectedCardForDelete.value = null;
  } catch (err) {
    error.value = err?.message || 'Error deleting business card';
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
  return filteredCards.value.sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
    return dateB - dateA;
  });
});

const profileUrl = computed(() => {
  if (!user.value?.uid) return '';
  return buildLiveProfileShareUrl(user.value.uid, {
    publicProfileSlug: firestoreProfileSlug.value,
    publicProfileLive: firestoreProfileLive.value
  });
});

const profileIsLive = computed(() => !!profileUrl.value);

// Copy profile URL to clipboard
async function copyProfileUrl() {
  try {
    if (!profileUrl.value) {
      router.push('/profile-setup#go-live');
      return;
    }
    await navigator.clipboard.writeText(profileUrl.value);
    copiedLink.value = true;
    setTimeout(() => {
      copiedLink.value = false;
    }, 2000);
  } catch (err) {
    console.error('Error copying URL:', err);
  }
}

// Add ref for QR code component
const qrCodeRef = ref(null);

// Update downloadQRCode function
async function downloadQRCode() {
  try {
    // Wait for next tick to ensure QR code is rendered
    await nextTick();
    
    // Get QR code SVG from ref
    const qrSvg = qrCodeRef.value?.$el;
    if (!qrSvg) {
      throw new Error('QR code SVG not found');
    }
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (200x200 for QR code + padding)
    canvas.width = 240;
    canvas.height = 240;
    
    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(qrSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Create image from SVG
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = svgUrl;
    });
    
    // Draw QR code on canvas with padding
    ctx.drawImage(img, 20, 20, 200, 200);
    
    // Convert canvas to PNG and download
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'billo-qr-code.png';
    link.href = pngUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(svgUrl);
  } catch (err) {
    console.error('Error downloading QR code:', err);
    error.value = 'Failed to download QR code';
  }
}

// Update downloadBusinessCard function
async function downloadBusinessCard() {
  try {
    // Wait for next tick to ensure QR code is rendered
    await nextTick();
    
    // Get QR code SVG from ref
    const qrSvg = qrCodeRef.value?.$el;
    if (!qrSvg) {
      throw new Error('QR code SVG not found');
    }
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to standard business card dimensions (3.5" x 2" at 300 DPI)
    canvas.width = 1050; // 3.5" * 300 DPI
    canvas.height = 600; // 2" * 300 DPI
    
    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f8fafc'); // slate-50
    gradient.addColorStop(1, '#f1f5f9'); // slate-100
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add a more professional accent color on the left side
    ctx.fillStyle = '#10b981'; // emerald-500
    ctx.fillRect(0, 0, 40, canvas.height);
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(qrSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Create image from SVG
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = svgUrl;
    });
    
    // Draw QR code on the right side (moved from center)
    const qrSize = 200;
    const qrX = canvas.width - qrSize - 60;
    const qrY = (canvas.height - qrSize) / 2;
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
    
    // Add subtle border around QR code
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
    
    // Add logo/brand at top-right
    ctx.fillStyle = '#10b981'; // emerald-500
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('BilloAI', canvas.width - 60, 60);
    
    // Add name and title on the left side
    const textX = 80; // Left aligned text starting point
    
    // Name (larger and bolder)
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.font = 'bold 40px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(user.value?.displayName || 'Your Name', textX, 120);
    
    // Title - Make sure to use the title from the user's profile
    ctx.font = '24px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.fillText(user.value?.title || 'Professional', textX, 160);
    
    // Company (if available)
    if (user.value?.company) {
      ctx.font = 'italic 20px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.fillText(user.value.company, textX, 190);
    }
    
    // Contact information section with icons
    const contactY = 250;
    const lineHeight = 35;
    ctx.font = '18px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#475569'; // slate-600
    
    // Email
    if (user.value?.email) {
      // Email icon (simplified)
      ctx.fillStyle = '#0f766e'; // teal-700
      ctx.fillRect(textX - 24, contactY - 14, 18, 14);
      ctx.fillStyle = '#475569'; // slate-600
      ctx.fillText(user.value.email, textX, contactY);
    }
    
    // Phone (if available)
    if (user.value?.phone) {
      // Phone icon (simplified)
      ctx.fillStyle = '#0f766e'; // teal-700
      ctx.beginPath();
      ctx.arc(textX - 15, contactY + lineHeight - 14, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#475569'; // slate-600
      ctx.fillText(user.value.phone, textX, contactY + lineHeight);
    }
    
    // Website/portfolio (if available)
    const cardShareUrl = profileUrl.value || '';
    ctx.fillStyle = '#0f766e'; // teal-700
    ctx.fillRect(textX - 24, contactY + (2 * lineHeight) - 14, 18, 14);
    ctx.fillStyle = '#475569'; // slate-600
    ctx.fillText(cardShareUrl, textX, contactY + (2 * lineHeight));
    
    // Footer with tagline
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.textAlign = 'left';
    ctx.fillText('Connect with me professionally', textX, canvas.height - 60);
    
    // QR scan hint
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.textAlign = 'right';
    ctx.fillText('Scan to view my profile', canvas.width - 60, qrY + qrSize + 40);
    
    // Add subtle border around the card
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Convert canvas to PNG and download
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'billo-business-card.png';
    link.href = pngUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(svgUrl);
  } catch (err) {
    console.error('Error downloading business card:', err);
    error.value = 'Failed to download business card';
  }
}

// Add these functions to handle the plan limit modal
function showPlanLimitError(message) {
  planLimitMessage.value = message;
  showPlanLimitModal.value = true;
}

function hidePlanLimitModal() {
  showPlanLimitModal.value = false;
}

// Add new methods for handling actions when not logged in
function promptEmailVerify() {
  try {
    document.getElementById('billo-verify')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {
    /* ignore */
  }
}

function goToCapture() {
  homeMode.value = 'capture';
  if (!user.value?.emailVerified) {
    promptEmailVerify();
    return;
  }
  handleCameraScan();
}

function handleCreateEvent() {
  if (!user.value) {
    router.push('/auth');
    return;
  }

  if (!user.value.emailVerified) {
    promptEmailVerify();
    return;
  }

  showCreateEventModal.value = true;
}

async function handleUploadCard() {
  if (!user.value) {
    router.push('/auth');
    return;
  }

  if (!user.value.emailVerified) {
    promptEmailVerify();
    return;
  }

  fileInput.value.click();
}

async function handleCameraScan() {
  if (!user.value) {
    router.push('/auth');
    return;
  }

  if (!user.value.emailVerified) {
    promptEmailVerify();
    return;
  }

  cameraInput.value?.click();
}

function handleRevealQR() {
  router.push('/subscription');
}

function handlePremiumPrompt(feature) {
  planLimitMessage.value = `Upgrade to Premium to ${feature}`;
  showPlanLimitModal.value = true;
}

async function checkPremiumStatus() {
  try {
    if (!user.value) return false;
    const status = await paymentService.getSubscriptionStatus();
    isPremium.value = status.plan !== 'FREE';
    if (user.value) {
      user.value.subscriptionPlan = status.plan;
    }
  } catch (err) {
    console.error('Error checking premium status:', err);
    isPremium.value = false;
  }
}

// Resend verification email
async function resendVerification() {
  try {
    loading.value = true;
    error.value = '';
    await authService.sendEmailVerification();
    // Show success message
    alert('Verification email sent! Please check your inbox.');
  } catch (err) {
    error.value = err.message;
    alert('Error sending verification email: ' + err.message);
  } finally {
    loading.value = false;
  }
}

// One-tap follow-up: open compose, mark as compose_opened (not sent until confirmed)
async function sendFollowUp(provider = 'gmail') {
  if (!selectedCardForDrafts?.value?.emails?.length) return;

  const message = buildFollowUpMessage(
    selectedDraft.value,
    selectedCardForDrafts.value,
    emailDraft.value
  );
  openFollowUpCompose(provider, message);

  if (selectedDraft.value?.id) {
    try {
      await businessCardService.markDraftComposeOpened(selectedDraft.value.id, provider);
      selectedDraft.value = {
        ...selectedDraft.value,
        status: 'compose_opened',
        composeOpenedVia: provider
      };
      unlockShareFeatures();
      await loadDrafts(selectedCardForDrafts.value.id);
    } catch (err) {
      console.error('Could not mark compose opened:', err);
    }
  }
}

async function confirmDraftSent() {
  if (!selectedDraft.value?.id) return;
  const provider = selectedDraft.value.composeOpenedVia || selectedDraft.value.sentVia || 'unknown';
  try {
    await businessCardService.markDraftSent(selectedDraft.value.id, provider);
    selectedDraft.value = { ...selectedDraft.value, status: 'sent', sentVia: provider };
    unlockShareFeatures();
    if (selectedCardForDrafts.value?.id) {
      await loadDrafts(selectedCardForDrafts.value.id);
    }
    showEmailModal.value = false;
  } catch (err) {
    console.error('Could not confirm sent:', err);
  }
}

function sendEmailDraft() {
  return sendFollowUp('mailto');
}

// Add this function in the script section after sendEmailDraft function
function sendSMSDraft() {
  if (!selectedCardForDrafts?.value?.phones?.length) return;
  
  const phone = selectedCardForDrafts.value.phones[0];
  const message = `${selectedDraft.value?.body || emailDraft.value}`;
  
  // Create sms URL with encoded parameters
  const smsUrl = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(message)}`;
  
  // Open default SMS client
  window.open(smsUrl, '_blank');
}

// Add the new function for Apple Wallet
async function addToAppleWallet() {
  try {
    if (!user.value) {
      router.push('/auth');
      return;
    }

    await walletService.generateAppleWalletPass({
      id: user.value.uid,
      name: user.value.displayName,
      title: user.value.title,
      company: user.value.company,
      emails: [user.value.email],
      phones: user.value.phone ? [user.value.phone] : [],
      websites: [profileUrl.value]
    });
  } catch (err) {
    console.error('Error adding to Apple Wallet:', err);
    error.value = 'Failed to add to Apple Wallet';
  }
}

// Filter cards by search, real event, and follow-up tab
const filteredCards = computed(() => {
  let filtered = businessCards.value || [];

  // Pending vs already followed up
  if (followUpTab.value === 'done') {
    filtered = filtered.filter((card) => cardHasFollowedUp(card));
  } else {
    filtered = filtered.filter((card) => !cardHasFollowedUp(card));
  }
  
  // Apply event filter — only Firestore eventId, never meetingType labels
  if (selectedEventFilter.value === 'all') {
    filtered = filtered;
  } else if (selectedEventFilter.value && selectedEventFilter.value !== 'null') {
    filtered = filtered.filter(card => card.eventId === selectedEventFilter.value);
  } else if (selectedEventFilter.value === 'null') {
    // Cards with no real event (meetingType-only still appears here)
    filtered = filtered.filter(card => !card.eventId);
  }
  
  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(card => 
      (card.name && card.name.toLowerCase().includes(query)) ||
      (card.company && card.company.toLowerCase().includes(query)) ||
      (card.title && card.title.toLowerCase().includes(query)) ||
      (card.emails && card.emails.some(email => email.toLowerCase().includes(query))) ||
      (card.phones && card.phones.some(phone => phone.includes(query))) ||
      (getMeetingTypeLabel(card.meetingType) || '').toLowerCase().includes(query) ||
      (getEventName(card.eventId) || '').toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

// Add watchers to reset pagination when filters change
watch([searchQuery, selectedEventFilter, followUpTab], () => {
  currentPage.value = 1;
  contactSheetCardId.value = null;
});

// Add these refs after other refs
const vcfInput = ref(null);
const selectedVcfFiles = ref([]);

// Add this function to handle importing contacts
function handleImportContacts() {
  // Trigger click event on the vcf input
  vcfInput.value.click();
}

async function handleVcfSelect(event) {
  const files = event.target.files;
  if (files.length > 0) {
    // Preview VCF files instead of uploading immediately
    previewSelectedContactFiles(files);
    // Reset input
    event.target.value = '';
  }
}

async function importVcfFiles(files, eventId = null) {
  uploading.value = true;
  error.value = '';
  successMessage.value = '';
  processingStatus.value = `Importing ${files.length} contact${files.length > 1 ? 's' : ''}...`;

  try {
    // Use the selected event from filter if available
    const eventId = selectedEventFilter.value === 'all' || selectedEventFilter.value === 'null' ? null : selectedEventFilter.value;
    
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        processingStatus.value = `Importing contact ${i + 1} of ${files.length}: ${file.name}`;
        
        // Import the contact using the businessCardService
        const result = await businessCardService.importVCard(file, eventId);
        
        // Add to results
        results.push(result);
        
        // Add to business cards
        businessCards.value.unshift(result);
        
        // Initialize expandedDrafts for this card
        expandedDrafts.value[result.id] = false;
      } catch (err) {
        console.error(`Error importing contact ${i + 1} (${file.name}):`, err);
        errors.push({
          fileName: file.name,
          error: err.message || 'Unknown error'
        });
      }
    }

    // Set success message
    successMessage.value = `Successfully imported ${results.length} of ${files.length} contacts.${errors.length > 0 ? ` Failed to import ${errors.length} contacts.` : ''}`;
    
    // Reload cards after import
    await loadCards();
    if (results.length > 0) {
      homeMode.value = 'followups';
      followUpTab.value = 'pending';
    }
    
    // Auto-hide success message and reset states after 5 seconds
    setTimeout(() => {
      uploading.value = false;
      successMessage.value = '';
      processingStatus.value = '';
    }, 5000);
  } catch (err) {
    error.value = err.message || 'Error importing contacts';
    console.error(err);
    
    // Auto-hide error and reset states after 5 seconds
    setTimeout(() => {
      uploading.value = false;
      error.value = '';
      processingStatus.value = '';
    }, 5000);
  }
}

function removeContactFileFromSelection(index) {
  // Remove the file from the arrays
  selectedContactFiles.value.splice(index, 1);
  contactFilesInfo.value.splice(index, 1);
  
  // If no files left, hide the preview and reset
  if (selectedContactFiles.value.length === 0) {
    clearSelectedContactFiles();
  }
}

function clearSelectedContactFiles() {
  // Clear arrays
  selectedContactFiles.value = [];
  contactFilesInfo.value = [];
  
  // Hide preview
  showContactPreview.value = false;
  
  // Reset file input if needed
  if (vcfInput.value) {
    vcfInput.value.value = '';
  }
}

async function processSelectedContactFiles() {
  if (selectedContactFiles.value.length === 0) return;
  
  // Use the selected event from preview if available, otherwise use the global filter
  const eventId = selectedPreviewEvent.value || selectedEvent.value || null;
  
  await importVcfFiles(selectedContactFiles.value, eventId);
  // Clear the selection after upload
  clearSelectedContactFiles();
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

/* Contact tiles + detail sheet */
.page-home .billo-person-tile {
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease;
}

.page-home .billo-person-tile:active {
  transform: scale(0.99);
}

.page-home .billo-contact-card {
  transition: box-shadow 0.25s ease, transform 0.25s ease, background-color 0.2s ease;
}

.page-home .billo-contact-card.billo-contact-card--styled {
  background-image: none;
}

.page-home .billo-contact-card:hover {
  box-shadow:
    var(--billo-shadow-lg),
    0 14px 32px -10px rgb(15 23 42 / 0.14);
}

/* Update button styles */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Button hover effects */
button:not(:disabled):hover {
  transform: translateY(-1px);
}

/* Button active state */
button:not(:disabled):active {
  transform: translateY(0);
}

/* Button focus styles */
button:focus {
  outline: none;
  ring-color: rgb(209, 213, 219);
  ring-offset-width: 2px;
}

/* Clean shadow effect */
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.shadow-sm:hover {
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}

.billo-first-run__inner {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: 1.25rem 1.25rem 1.35rem;
  border-radius: 1.25rem;
  background: linear-gradient(145deg, rgb(255 255 255 / 0.95), rgb(236 253 245 / 0.75));
  border: 1px solid rgb(167 243 208 / 0.7);
  box-shadow: 0 18px 40px -28px rgb(15 118 110 / 0.35);
}

@media (min-width: 768px) {
  .billo-first-run__inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }
}

.billo-first-run__kicker {
  margin: 0 0 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0f766e;
}

.billo-first-run__title {
  margin: 0 0 0.4rem;
  font-family: 'Instrument Sans', 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.billo-first-run__lede {
  margin: 0 0 0.85rem;
  max-width: 34rem;
  font-size: 0.92rem;
  line-height: 1.45;
  color: #475569;
}

.billo-first-run__steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.billo-first-run__steps li {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  background: rgb(255 255 255 / 0.9);
  border: 1px solid #e2e8f0;
}

.billo-first-run__steps li.done {
  color: #065f46;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.billo-first-run__actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex-shrink: 0;
  min-width: 11rem;
}

.billo-first-run__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.75rem;
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 0.85rem;
  background: linear-gradient(105deg, #059669, #0d9488);
  color: #fff;
  font-weight: 650;
  font-size: 0.92rem;
  cursor: pointer;
}

.billo-first-run__cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.billo-first-run__link,
.billo-first-run__dismiss {
  border: 0;
  background: transparent;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.billo-first-run__link {
  color: #0f766e;
}

.billo-first-run__dismiss {
  color: #94a3b8;
}

.billo-home-modes {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.billo-home-modes__rail {
  display: inline-flex;
  align-self: stretch;
  gap: 0.35rem;
  padding: 0.3rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.85);
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px -22px rgb(15 23 42 / 0.35);
  max-width: 28rem;
}

.billo-home-modes__tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.6rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 650;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.billo-home-modes__tab.is-active {
  background: linear-gradient(105deg, #059669, #0d9488);
  color: #fff;
  box-shadow: 0 8px 18px -12px rgb(5 150 105 / 0.9);
}

.billo-home-modes__count {
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.22);
  font-size: 0.7rem;
  line-height: 1.35rem;
  text-align: center;
}

.billo-home-modes__hint {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.4;
}

.billo-verify-soft {
  padding: 0.75rem 1rem;
  border-radius: 0.9rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  font-size: 0.875rem;
}

.billo-verify-soft button {
  border: 0;
  background: transparent;
  color: #b45309;
  font-weight: 650;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}

.billo-capture__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: clamp(2rem, 6vw, 3.5rem) 1.25rem;
  border-radius: 1.5rem;
  border: 1px solid rgb(167 243 208 / 0.7);
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgb(16 185 129 / 0.16), transparent 60%),
    linear-gradient(180deg, #fff 0%, #f0fdf4 100%);
  box-shadow: 0 22px 50px -36px rgb(15 118 110 / 0.45);
}

.billo-capture__title {
  margin: 0 0 0.5rem;
  font-family: 'Instrument Sans', 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.billo-capture__lede {
  margin: 0 0 1.5rem;
  max-width: 26rem;
  font-size: 0.98rem;
  line-height: 1.5;
  color: #475569;
}

.billo-capture__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3.25rem;
  min-width: min(100%, 18rem);
  padding: 0.85rem 1.4rem;
  border: 0;
  border-radius: 1rem;
  background: linear-gradient(105deg, #059669, #0d9488);
  color: #fff;
  font-size: 1.05rem;
  font-weight: 650;
  cursor: pointer;
  box-shadow: 0 16px 30px -16px rgb(5 150 105 / 0.95);
}

.billo-capture__primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.billo-capture__secondary {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.55rem;
  margin-top: 0.9rem;
}

.billo-capture__secondary > button,
.billo-capture__more > button {
  min-height: 2.5rem;
  padding: 0.45rem 0.95rem;
  border-radius: 0.8rem;
  border: 1px solid #e2e8f0;
  background: rgb(255 255 255 / 0.9);
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.billo-capture__more {
  position: relative;
}

.billo-capture__more summary {
  list-style: none;
  min-height: 2.5rem;
  padding: 0.45rem 0.95rem;
  border-radius: 0.8rem;
  border: 1px solid #e2e8f0;
  background: rgb(255 255 255 / 0.9);
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.billo-capture__more summary::-webkit-details-marker {
  display: none;
}

.billo-capture__more[open] > button {
  display: block;
  margin-top: 0.35rem;
  width: 100%;
}

.billo-capture__micro {
  margin: 1rem 0 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

</style>
