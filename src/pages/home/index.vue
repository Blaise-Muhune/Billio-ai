<route>
meta:
  title: BilloAI - Smart Business Card Manager
</route>

<template lang="pug">
main(class="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex flex-col")
  // Premium Status Indicator
  .fixed.top-4.right-4.z-30
    router-link(
      to="/subscription"
      class="group inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300"
      :class="[user?.isPremium ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white hover:from-amber-500 hover:to-amber-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
    )
      VaIcon(
        :name="user?.isPremium ? 'workspace_premium' : 'diamond'"
        size="20px"
        :class="user?.isPremium ? 'text-white' : 'text-gray-600'"
      )
      span.font-medium {{ user?.isPremium ? `Premium (${user?.subscriptionPlan || 'PRO'})` : 'Upgrade' }}

  //- App Interface (Always visible)
  .flex-1.w-full.flex.flex-col
    //- Top Navigation Bar (Fixed)
    .w-full.bg-white.border-b.border-gray-100.fixed.top-0.z-30.shadow-sm
      .max-w-7xl.mx-auto(class="px-4 sm:px-6 lg:px-8")
        .flex.items-center.justify-between.h-16
          //- Logo and Brand
          .flex.items-center.gap-4
            h1.text-2xl.font-bold(class="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent") BilloAI
          
          //- Right Side Actions
          .flex.items-center.gap-6
            //- Navigation Links (Hidden on mobile)
            .hidden(class="md:flex items-center gap-6")
              a(
                v-if="user"
                class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
                :href="`/profile/${user.uid}`"
                target="_blank"
              )
                VaIcon(name="person" size="18px")
                span(class="font-medium") View Profile
              button(
                v-if="user"
                class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
                @click="router.push('/profile-setup')"
              )
                VaIcon(name="settings" size="18px")
                span(class="font-medium") Edit Profile
              button(
                class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
                @click="scrollToQRCode"
              )
                VaIcon(name="qr_code" size="18px")
                span(class="font-medium") QR Code
              
              //- Subscription Plan Badge
              router-link(
                v-if="user"
                to="/subscription"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors duration-200"
                :class="[user?.isPremium ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100']"
              )
                VaIcon(
                  :name="user?.isPremium ? 'workspace_premium' : 'diamond'"
                  size="16px"
                )
                span.text-sm.font-medium {{ user?.isPremium ? `${user?.subscriptionPlan || 'PRO'}` : '' }}
            
            //- User Profile Picture (if logged in)
            .relative(v-if="user")
              .relative.cursor-pointer.profile-pic(@click.stop="toggleUserMenu")
                template(v-if="user.photoURL")
                  img(
                    :src="user.photoURL"
                    class="w-10 h-10 rounded-full object-cover border-2 border-emerald-100 shadow-sm hover:border-emerald-200 transition-colors duration-200"
                    alt="Profile picture"
                  )
                template(v-else)
                  div(
                    class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-100 shadow-sm hover:border-emerald-200 transition-colors duration-200"
                  )
                    span.text-emerald-600.font-semibold {{ user.displayName ? user.displayName.charAt(0).toUpperCase() : '?' }}
                //- Premium Badge (if premium)
                .absolute.-bottom-1.-right-1.bg-amber-500.text-white.p-1.rounded-full.shadow-md(
                  v-if="user.isPremium"
                )
                  VaIcon(name="diamond" size="12px")
              
              //- User Menu Dropdown
              .absolute.right-0.mt-2.w-48.bg-white.rounded-xl.shadow-lg.border.border-gray-100.overflow-hidden.transform.transition-all.duration-200.ease-in-out.user-menu(
                v-if="showUserMenu"
                class="origin-top-right z-50"
                @click.stop
              )
                .py-1
                  router-link(
                    to="/profile-setup"
                    class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    @click="showUserMenu = false"
                  )
                    VaIcon(name="settings" size="18px")
                    span.font-medium Edit Profile
                  
                  button(
                    class="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full transition-colors duration-200"
                    @click="signOut"
                  )
                    VaIcon(name="logout" size="18px")
                    span.font-medium Sign Out
            
            //- Mobile Menu Button
            button(
              class="md:hidden flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
              @click="toggleMobileMenu"
            )
              VaIcon(name="menu" size="24px")
            
            //- Mobile Menu Overlay
            .fixed.inset-0.bg-black.bg-opacity-50.z-40.transition-opacity.duration-300(
              v-if="showMobileMenu"
              @click="showMobileMenu = false"
            )
            .fixed.inset-y-0.left-0.w-64.bg-white.shadow-lg.transform(
              :class="showMobileMenu ? 'translate-x-0' : '-translate-x-full'"
              class="transition-transform duration-300 ease-in-out z-50"
            )
              //- Menu Header with Close Button
              .flex.items-center.justify-between.px-4.py-3.border-b.border-gray-100
                h3.text-lg.font-semibold.text-gray-900 Menu
                button(
                  class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  @click="showMobileMenu = false"
                )
                  VaIcon(name="close" size="20px" class="text-gray-600")

              //- Navigation Links
              nav.py-2
                //- Menu Items
                .space-y-1.px-2
                  //- Public Profile
                  a(
                    v-if="user"
                    :href="`/profile/${user.uid}`"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    @click="showMobileMenu = false"
                    target="_blank"
                  )
                    VaIcon(name="person" size="20px")
                    span Public Profile

                  //- Profile Settings
                  router-link(
                    v-if="user"
                    to="/profile-setup"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    @click="showMobileMenu = false"
                  )
                    VaIcon(name="settings" size="20px")
                    span Profile Settings

                  //- Premium Status (if not premium)
                  router-link(
                    v-if="!user?.isPremium"
                    to="/subscription"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    @click="showMobileMenu = false"
                  )
                    VaIcon(name="diamond" size="20px")
                    span Upgrade to Premium

                  //- Sign In Button (if not signed in)
                  router-link(
                    v-if="!user"
                    to="/auth"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    @click="showMobileMenu = false"
                  )
                    VaIcon(name="login" size="20px")
                    span Sign In

                //- Divider and Sign Out (only shown when user is signed in)
                template(v-if="user")
                  .my-2.border-t.border-gray-100
                  .px-2
                    button(
                      class="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      @click="signOut"
                    )
                      VaIcon(name="logout" size="20px")
                      span Sign Out

    //- Main Content Area (With top padding for fixed header)
    .flex-1.w-full(class="pt-16")
      .max-w-7xl.mx-auto(class="px-4 sm:px-6 lg:px-8 py-8")
        //- Quick Actions Bar
        .bg-white.rounded-2xl.shadow-lg.border.border-emerald-100.p-6.mb-8
          .flex.flex-col.gap-4(class="sm:flex-row sm:items-center sm:justify-between")
            .flex.items-center.gap-3
              h3.text-xl.font-semibold.text-gray-900 Your Networking Hub
              span.text-sm.text-emerald-600.bg-emerald-50.px-3.py-1.rounded-lg.font-medium {{ businessCards.length }} cards
            .flex.flex-col.gap-4(class="sm:flex-row sm:items-center")
              // Event Selector
              .relative.flex.items-center.w-full(class="sm:w-auto")
                select(
                  v-model="selectedEventFilter"
                  class="w-full bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm appearance-none pr-8 shadow-sm hover:border-gray-300 transition-all duration-200"
                  :disabled="!user"
                  @change="handleEventChange"
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
                  class="flex-1 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all duration-200 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:border-gray-300 sm:flex-initial"
                  @click="handleCreateEvent"
                  :disabled="!user || !user.emailVerified"
                  :title="!user?.emailVerified ? 'Please verify your email to create events' : ''"
                )
                  VaIcon(name="add" size="18px")
                  span New Event
                button(
                  class="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md sm:flex-initial"
                  @click="handleUploadCard"
                  :disabled="!user || !user.emailVerified"
                  :title="!user?.emailVerified ? 'Please verify your email to upload cards' : ''"
                )
                  VaIcon(name="upload" size="18px")
                  span Upload Card

        // Email Verification Notice
        .bg-amber-50.border-l-4.border-amber-400.p-4.rounded-xl.mb-8(
          v-if="user && !user.emailVerified"
        )
          .flex
            .flex-shrink-0
              VaIcon(name="info" size="20px" class="text-amber-500")
            .ml-3
              p.text-sm.text-amber-700.font-medium Please verify your email
              p.text-sm.text-amber-600.mt-1 To start uploading business cards and creating events, please verify your email address. Check your inbox for the verification link.
              button.mt-2.text-sm.font-medium.text-amber-700.hover_text-amber-800.underline(
                @click="resendVerification"
                :disabled="loading"
              ) Resend verification email

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
          .border-2.border-dashed.border-emerald-200.rounded-xl.p-8.transition-all.duration-300.bg-emerald-50.bg-opacity-30(
            class="hover:border-emerald-400 hover:bg-emerald-50"
            @dragover.prevent
            @drop.prevent="handleDrop"
          )
            .flex.flex-col.items-center.justify-center.text-center
              VaIcon(name="upload" size="48px" class="text-emerald-400 mb-4")
              h3.text-2xl.font-bold.text-gray-900.mb-2 Upload Business Cards
              p.text-gray-600.mb-6 Drag and drop your business cards or click to browse
              button(
                class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all duration-200 px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:border-gray-300"
                @click="handleUploadCard"
              )
                VaIcon(name="file_upload" size="20px")
                span Browse Files

        //- Upload Progress
        .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-8.mb-8(v-else)
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

        // Main Content Area
        .grid(class="grid-cols-1")
          // Business Cards Section
          div
            .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-6
              // Search Bar Section
              .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-6.mb-6
                .flex.flex-col.gap-4
                  // Search Header
                  .flex.items-center.justify-between.mb-2
                    h3.text-lg.font-medium.text-gray-900 Search Business Cards
                    span.text-sm.text-emerald-600.bg-emerald-50.px-3.py-1.rounded-lg.font-medium {{ sortedBusinessCards.length }} results
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

              // Cards Grid
              .grid(
                class="grid-cols-1 gap-8 mt-6"
                class="md:grid-cols-2 md:gap-6"
              )
                // Empty State
                .empty-state(
                  v-if="!user"
                  class="col-span-full flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
                )
                  VaIcon(name="person" size="48px" class="text-gray-400 mb-4")
                  p.text-gray-500.text-center.mb-2 Sign in to manage your business cards
                  p.text-sm.text-gray-400.text-center Upload, organize, and connect with your network
                  button(
                    class="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    @click="router.push('/auth')"
                  )
                    VaIcon(name="login" size="20px")
                    span.font-medium Sign In to Get Started
                
                .card-container(
                  v-else
                  v-for="card in sortedBusinessCards"
                  :key="card.id"
                  class="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] group"
                  :style=`{
                    backgroundColor: card.style?.backgroundColor || '#ffffff',
                    color: getContrastColor(card.style?.backgroundColor || '#ffffff'),
                    fontFamily: getFontFamily(card.style?.fontStyle),
                  }`
                )
                  // Top Action Bar with Glass Effect
                  .bg-white.bg-opacity-90.backdrop-blur-md.px-6.py-4.flex.flex-col.gap-3.border-b.border-gray-100(
                    class="sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:py-3"
                  )
                    .flex.items-center.gap-2.w-full(class="sm:w-auto")
                      .relative.group.w-full(class="sm:w-auto")
                        button(
                          class="md:invisible md:group-hover:visible visible w-full bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-400 transition-all duration-200 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md hover:border-emerald-500 sm:w-auto"
                          @click="saveContact(card)"
                        )
                          VaIcon(name="person_add" size="18px")
                          span.font-medium Save Contact
                      .relative.group.w-full(class="sm:w-auto")
                        button(
                          class="md:invisible md:group-hover:visible visible w-full bg-transparent hover:bg-white text-gray-700 border border-gray-200 transition-all duration-200 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:shadow-sm hover:border-gray-300"
                          @click.stop="confirmGenerateEmail(card)"
                          :disabled="generatingDraft === card.id || loadingDrafts[card.id]"
                        )
                          VaIcon(name="smart_toy" size="16px")
                          span AI message

                  // Card Content with Modern Layout
                  .flex-1.flex.flex-col.gap-8.p-8(class="sm:p-10")
                    // Name and Title Section
                    .space-y-3
                      h3.text-2xl(
                        class="sm:text-3xl font-bold tracking-tight"
                        :style="{ color: card.style?.primaryColor || '#1f2937' }"
                      ) {{ card.name }}
                      p.text-lg(
                        class="sm:text-xl"
                        :style="{ color: card.style?.secondaryColor || '#4B5563' }"
                      ) {{ card.title }}

                    // Contact Info with Modern Grid
                    .grid.gap-4(class="grid-cols-1 sm:grid-cols-2")
                      // Emails
                      .relative.flex.items-center.gap-3(
                        v-if="card.emails?.length > 0"
                        class="col-span-full sm:col-span-1"
                      )
                        VaIcon(name="email" size="18px" :style="{ color: card.style?.secondaryColor || '#4B5563' }")
                        .flex.flex-col.w-full
                          .flex.items-center.justify-between.w-full
                            a.text-base.truncate(
                              :style="{ color: card.style?.secondaryColor || '#4B5563' }"
                              :href="'mailto:' + card.emails[0]"
                              class="hover:underline"
                            ) {{ card.emails[0] }}
                            button.p-1.rounded-lg.transition-colors(
                              v-if="card.emails.length > 1"
                              @click="toggleContactDropdown('email', card.id)"
                              class="hover:bg-black/5"
                            )
                              VaIcon(name="expand_more" size="18px" class="text-gray-400")
                          
                          // Dropdown (using HTML-like syntax instead of Pug's dot notation)
                          div(
                            v-if="expandedContact.type === 'email' && expandedContact.cardId === card.id"
                            class="bg-white shadow-lg rounded-lg p-2 z-10 mt-1 w-full absolute top-full left-0"
                          )
                            div(v-for="(email, idx) in card.emails.slice(1)")
                              div(class="py-1")
                                a(
                                  :href="'mailto:' + email"
                                  class="block px-3 py-2 rounded-lg text-gray-700 text-sm hover:bg-gray-100 transition-colors"
                                ) {{ email }}

                      // Phone Numbers
                      .relative.flex.items-center.gap-3(
                        v-if="card.phones?.length > 0"
                        class="col-span-full sm:col-span-1"
                      )
                        VaIcon(name="phone" size="18px" :style="{ color: card.style?.secondaryColor || '#4B5563' }")
                        .flex.flex-col.w-full
                          .flex.items-center.justify-between.w-full
                            a.text-base.truncate(
                              :style="{ color: card.style?.secondaryColor || '#4B5563' }"
                              :href="'tel:' + card.phones[0]"
                              class="hover:underline"
                            ) {{ card.phones[0] }}
                            button.p-1.rounded-lg.transition-colors(
                              v-if="card.phones.length > 1"
                              @click="toggleContactDropdown('phone', card.id)"
                              class="hover:bg-black/5"
                            )
                              VaIcon(name="expand_more" size="18px" class="text-gray-400")
                          
                          // Dropdown
                          div(
                            v-if="expandedContact.type === 'phone' && expandedContact.cardId === card.id"
                            class="bg-white shadow-lg rounded-lg p-2 z-10 mt-1 w-full absolute top-full left-0"
                          )
                            div(v-for="(phone, idx) in card.phones.slice(1)")
                              div(class="py-1")
                                a(
                                  :href="'tel:' + phone"
                                  class="block px-3 py-2 rounded-lg text-gray-700 text-sm hover:bg-gray-100 transition-colors"
                                ) {{ phone }}

                      // Websites
                      .relative.flex.items-center.gap-3(
                        v-if="card.websites?.length > 0"
                        class="col-span-full"
                      )
                        VaIcon(name="language" size="18px" :style="{ color: card.style?.secondaryColor || '#4B5563' }")
                        .flex.flex-col.w-full
                          .flex.items-center.justify-between.w-full
                            a.text-base.truncate(
                              :style="{ color: card.style?.secondaryColor || '#4B5563' }"
                              :href="formatWebsiteUrl(card.websites[0])"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="hover:underline"
                            ) {{ card.websites[0] }}
                            button.p-1.rounded-lg.transition-colors(
                              v-if="card.websites.length > 1"
                              @click="toggleContactDropdown('website', card.id)"
                              class="hover:bg-black/5"
                            )
                              VaIcon(name="expand_more" size="18px" class="text-gray-400")
                          
                          // Dropdown
                          div(
                            v-if="expandedContact.type === 'website' && expandedContact.cardId === card.id"
                            class="bg-white shadow-lg rounded-lg p-2 z-10 mt-1 w-full absolute top-full left-0"
                          )
                            div(v-for="(website, idx) in card.websites.slice(1)")
                              div(class="py-1")
                                a(
                                  :href="formatWebsiteUrl(website)"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="block px-3 py-2 rounded-lg text-gray-700 text-sm hover:bg-gray-100 transition-colors"
                                ) {{ website }}

                      // Company with Icon
                      .flex.items-center.gap-3.col-span-full(v-if="card.company")
                        VaIcon(name="business" size="18px" :style="{ color: card.style?.secondaryColor || '#4B5563' }")
                        span.text-base.truncate(:style="{ color: card.style?.secondaryColor || '#4B5563' }") {{ card.company }}

                    // Event Tag with Modern Design (Now Clickable)
                    .mt-auto.pt-6
                      button.w-full(
                        @click="openMoveToEventModal(card)"
                        class="group transition-all duration-200"
                      )
                        .inline-flex.items-center.gap-2.px-4.py-2.rounded-full.text-base.shadow-sm.w-full.justify-center.transition-all.duration-200(
                          :class=`[
                            card.eventId ? 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200' : 'bg-gray-100 text-gray-800 group-hover:bg-gray-200'
                          ]`
                        )
                          VaIcon(name="event" size="16px" :class="card.eventId ? 'text-emerald-600' : 'text-gray-600'")
                          span {{ getEventName(card.eventId) || 'Add to Event' }}
                          VaIcon(
                            name="edit"
                            size="14px"
                            :class="card.eventId ? 'text-emerald-600 opacity-0 group-hover:opacity-100' : 'text-gray-600 opacity-0 group-hover:opacity-100'"
                            class="ml-1 transition-opacity duration-200"
                          )

                  // Bottom Action Bar with Glass Effect
                  .bg-white.bg-opacity-90.backdrop-blur-md.px-6.py-4.flex.items-center.justify-end.gap-2.border-t.border-gray-100
                    .relative.group
                      button(
                        class="md:invisible md:group-hover:visible visible p-2 text-gray-400 hover:text-emerald-600 transition-all duration-200 rounded-full hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200"
                        @click.stop="openEditCardModal(card)"
                      )
                        VaIcon(name="edit" size="20px")
                        span(class="font-medium ml-1") Edit

      // Edit Card Modal
      VaModal(
        v-model="showEditCardModal"
        :hide-default-actions="true"
        class="rounded-2xl"
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

          // Edit Card Modal Actions
          .flex.items-center.justify-between.gap-4.mt-8
            button(
              class="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-6 rounded-xl transition-colors duration-200 flex items-center gap-2"
              @click="confirmDeleteCard(editCardData)"
            )
              VaIcon(name="delete" size="18px")
              span
            .flex.items-center.gap-4
              button(
                class="bg-gray-100 text-gray-700 px-6 py-6 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                @click="showEditCardModal = false"
              ) Cancel
              button(
                class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-6 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                @click="saveCardChanges"
                :disabled="saving"
              )
                .loading-spinner.w-4.h-4.border-2(v-if="saving")
                VaIcon(v-else name="save" size="16px")
                span(class="font-medium") {{ saving ? 'Saving...' : '' }}

        // Stats Grid (Moved to bottom)
        
          .stat-card.bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-6(
            v-for="stat in stats"
            :key="stat.label"
          )
            .flex.items-center.gap-4
              .bg-emerald-100.p-3.rounded-xl
                VaIcon(:name="stat.icon" size="24px" class="text-emerald-600")
              .space-y-1
                p.text-2xl.font-bold.text-gray-900 {{ user ? stat.value : '0' }}
                p.text-sm.text-gray-600 {{ stat.label }}

    // Modals section
    template(v-if="user")
      // Message Drafts List Modal
      VaModal(
        v-model="showDraftsListModal"
        :hide-default-actions="true"
        class="rounded-2xl z-[100] modal-container"
      )
        .p-6.relative
          .flex.items-center.justify-between.mb-6
            h3.text-lg.font-medium Message Drafts
            .flex.items-center.gap-3
              span.text-sm.text-gray-600.bg-gray-100.px-2.py-1.rounded {{ cardDrafts[selectedCardForDrafts?.id]?.length || 0 }} drafts
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
                span.text-sm.font-medium New Draft
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
              p.text-gray-500.text-center.mb-2 No email drafts yet
              p.text-sm.text-gray-400.text-center Click "Generate New Draft" to create your first email
            
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
        class="rounded-2xl z-[100] modal-container"
      )
        .p-8.relative(class="sm:mt-0 mt-16")
          button.absolute.top-4.right-4.p-2.rounded-lg(
            class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            @click="showEmailModal = false"
          )
            VaIcon(name="close" size="24px")
          .flex.items-center.justify-between.mb-6
            h3.text-2xl.font-bold Email Draft
          .bg-gray-50.p-6.rounded-xl.mb-6
            pre.whitespace-pre-wrap.text-base.leading-relaxed {{ emailDraft }}
          .flex.justify-end.gap-4
            button(
              class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-gray-300"
              @click="showEmailModal = false"
            ) Close
            button(
              class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-gray-300 flex items-center gap-2"
              @click="copyEmailDraft"
            )
              VaIcon(name="content_copy" size="16px")
              span {{ copiedEmailDraft ? 'Copied!' : 'Copy' }}
            button(
              class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-gray-300 flex items-center gap-2"
              @click="sendSMSDraft"
              :disabled="!selectedCardForDrafts?.phones?.length"
              :title="!selectedCardForDrafts?.phones?.length ? 'No phone number available' : ''"
            )
              VaIcon(name="sms" size="16px")
              span Send SMS
            button(
              class="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex items-center gap-2"
              @click="sendEmailDraft"
              :disabled="!selectedCardForDrafts?.emails?.length"
              :title="!selectedCardForDrafts?.emails?.length ? 'No email address available' : ''"
            )
              VaIcon(name="send" size="16px")
              span Send Email

      // Confirmation Modal
      VaModal(
        v-model="showConfirmModal"
        :hide-default-actions="true"
        class="rounded-2xl z-[100] modal-container"
      )
        .p-8.relative(class="sm:mt-0 mt-16")
          button.absolute.top-4.right-4.p-2.rounded-lg(
            class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            @click="showConfirmModal = false"
          )
            VaIcon(name="close" size="24px")
          .flex.items-center.justify-between.mb-6
            h3.text-2xl.font-bold Message Drafts
          
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
              p.text-gray-500.text-center.mb-2 No email drafts yet
              p.text-sm.text-gray-400.text-center Click "Generate New Draft" to create your first email
            
            // Loading State
            .loading-state(
              v-if="loadingDrafts[selectedCardForGeneration?.id]"
              class="flex justify-center py-12"
            )
              .loading-spinner

          // Bottom Actions
          .flex.justify-end.gap-4.mt-6.pt-4.border-t.border-gray-100
            button(
              class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:border-gray-300"
              @click="showConfirmModal = false"
            ) Close
            button(
              class="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex items-center gap-2"
              @click="proceedWithGeneration"
              :disabled="generatingDraft === selectedCardForGeneration?.id"
            )
              .loading-spinner.w-3.h-3.border-2.border-white(v-if="generatingDraft === selectedCardForGeneration?.id")
              VaIcon(v-else name="smart_toy" size="16px")
              span {{ generatingDraft === selectedCardForGeneration?.id ? 'Generating...' : 'Generate New Draft' }}

      // Move to Event Modal
      VaModal(
        v-model="showMoveToEventModal"
        :hide-default-actions="true"
        class="rounded-2xl z-50"
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
        class="rounded-2xl z-50"
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
        class="rounded-2xl z-50"
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
        
        .flex.flex-col.items-center.gap-8
          // QR Code Display
          .relative.bg-white.p-6.rounded-xl.shadow-lg.border.border-gray-100#qr-code-container
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
          .flex.flex-col.items-center.gap-3(class="sm:flex-row sm:justify-center")
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

      // Plan Limit Modal
      PlanLimitModal(
        :show="showPlanLimitModal"
        :message="planLimitMessage"
        :current-card-id="selectedCardForGeneration?.id"
        @close="hidePlanLimitModal"
      )

    // Login Prompt Modal
    VaModal(
      v-model="showLoginPrompt"
      :hide-default-actions="true"
      class="rounded-2xl z-50"
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
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { businessCardService } from '../../services/businessCardService';
import { authService } from '../../services/authService';
import { paymentService } from '../../services/paymentService';
import { walletService } from '../../services/walletService';
import { useRouter } from 'vue-router';
import { storage } from '../../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import QrcodeVue from 'qrcode.vue';
import PlanLimitModal from '../../components/PlanLimitModal.vue';

const router = useRouter();
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
const showMobileMenu = ref(false);
const showUserMenu = ref(false);
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

const STORAGE_KEY = 'selectedEvent';

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
  websites: []
});
const saving = ref(false);

// Add these functions after other functions
function openEditCardModal(card) {
  editCardData.value = {
    id: card.id,
    name: card.name || '',
    title: card.title || '',
    company: card.company || '',
    emails: [...(card.emails || [])],
    phones: [...(card.phones || [])],
    websites: [...(card.websites || [])]
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
      websites: editCardData.value.websites.filter(website => website.trim())
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
  const unsubscribe = authService.onAuthStateChanged((currentUser) => {
    user.value = currentUser;
    if (currentUser) {
      loadCards();
      loadEvents();
      // Check premium status
      checkPremiumStatus();
      // Load saved event selection
      const savedEvent = localStorage.getItem(STORAGE_KEY);
      if (savedEvent) {
        selectedEventFilter.value = savedEvent;
      }
    }
  });

  // Cleanup subscription
  return () => unsubscribe();
});

async function signOut() {
  try {
    await authService.signOut();
    businessCards.value = [];
    router.push('/auth');
  } catch (err) {
    error.value = 'Error signing out';
    console.error('Error signing out:', err);
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
    // Clear the file input even for invalid file type
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    return;
  }

  uploading.value = true;
  error.value = '';
  successMessage.value = '';
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
    // Set success message
    successMessage.value = card.message;
    
    // Clear the file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    
    // Auto-hide success message and reset states after 5 seconds
    setTimeout(() => {
      uploading.value = false;
      successMessage.value = '';
      processingStatus.value = '';
    }, 5000);
  } catch (err) {
    error.value = err.message || 'Error uploading business card';
    console.error(err);
    
    // Clear the file input even on error
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    
    // Auto-hide error and reset states after 5 seconds
    setTimeout(() => {
      uploading.value = false;
      error.value = '';
      processingStatus.value = '';
    }, 5000);
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
    
    // Set the selected card and draft
    selectedCardForDrafts.value = card;
    selectedDraft.value = draft;
    
    // Show the new draft and close the confirmation modal
    emailDraft.value = draft.content;
    showEmailModal.value = true;
    showConfirmModal.value = false;
  } catch (err) {
    console.error('Error generating draft:', err);
    if (err.type === 'PLAN_LIMIT') {
      showPlanLimitError(err.message);
    } else {
      error.value = 'Error generating email draft';
    }
  } finally {
    generatingDraft.value = null;
    selectedCardForGeneration.value = null;
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
  showConfirmModal.value = true;
}

async function proceedWithGeneration() {
  if (selectedCardForGeneration.value) {
    try {
      generatingDraft.value = selectedCardForGeneration.value.id;
      error.value = '';
      
      const draft = await businessCardService.generateEmailDraft(selectedCardForGeneration.value);
      console.log('Generated draft:', draft);
      
      // Reload drafts for this card
      await loadDrafts(selectedCardForGeneration.value.id);
      
      // Set the selected card and draft
      selectedCardForDrafts.value = selectedCardForGeneration.value;
      selectedDraft.value = draft;
      
      // Show the new draft and close the confirmation modal
      emailDraft.value = draft.content;
      showEmailModal.value = true;
      showConfirmModal.value = false;
    } catch (err) {
      console.error('Error generating draft:', err);
      if (err.type === 'PLAN_LIMIT') {
        showPlanLimitError(err.message);
      } else {
        error.value = 'Error generating email draft';
      }
    } finally {
      generatingDraft.value = null;
      selectedCardForGeneration.value = null;
    }
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
    eventNameError.value = '';
    
    if (!newEventName.value.trim()) {
      eventNameError.value = 'Event name is required';
      return;
    }

    // Check for duplicate event names (case insensitive)
    const isDuplicate = events.value.some(
      event => event.name.toLowerCase() === newEventName.value.trim().toLowerCase()
    );

    if (isDuplicate) {
      eventNameError.value = 'An event with this name already exists';
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
    console.error('Error creating event:', err);
    if (err.type === 'PLAN_LIMIT') {
      showPlanLimitError(err.message);
      showCreateEventModal.value = false;
    } else {
      error.value = 'Error creating event: ' + err.message;
    }
  }
}

function getEventName(eventId) {
  const event = events.value.find(e => e.id === eventId);
  return event ? event.name : 'unspecified Event';
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
  if (selectedEventFilter.value && selectedEventFilter.value !== 'null') {
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
  let filtered = [...businessCards.value];
  
  // Apply search filter if there's a query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(card => {
      // Get event name for the card
      const eventName = getEventName(card.eventId)?.toLowerCase() || '';
      
      return (
        card.name?.toLowerCase().includes(query) ||
        card.company?.toLowerCase().includes(query) ||
        card.emails?.some(email => email.toLowerCase().includes(query)) ||
        card.phones?.some(phone => phone.includes(query)) ||
        card.title?.toLowerCase().includes(query) ||
        eventName.includes(query)
      );
    });
  }
  
  // Sort by creation date
  return filtered.sort((a, b) => {
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
    ctx.fillText('billoAI', canvas.width - 60, 60);
    
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
    const profileUrl = `${window.location.origin}/profile/${user.value?.uid || 'username'}`;
    ctx.fillStyle = '#0f766e'; // teal-700
    ctx.fillRect(textX - 24, contactY + (2 * lineHeight) - 14, 18, 14);
    ctx.fillStyle = '#475569'; // slate-600
    ctx.fillText(profileUrl, textX, contactY + (2 * lineHeight));
    
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

// Add scrollToQRCode function
function scrollToQRCode() {
  const qrSection = document.querySelector('.mt-12.bg-white.rounded-2xl');
  if (qrSection) {
    qrSection.scrollIntoView({ behavior: 'smooth' });
  }
  showUserMenu.value = false; // Close the menu after clicking
}

// Add toggleMobileMenu function
function toggleMobileMenu() {
  showMobileMenu.value = !showMobileMenu.value;
  if (showMobileMenu.value) {
    showUserMenu.value = false;
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
function handleCreateEvent() {
  if (!user.value) {
    router.push('/auth');
    return;
  }

  if (!user.value.emailVerified) {
    alert('Please verify your email address before creating events.');
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
    alert('Please verify your email address before uploading cards.');
    return;
  }

  fileInput.value.click();
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

// Add click outside handler
onMounted(() => {
  // Add click outside handler for user menu
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  // Remove click outside handler
  document.removeEventListener('click', handleClickOutside);
});

// Add this function to handle clicks outside the user menu
function handleClickOutside(event) {
  const userMenu = document.querySelector('.user-menu');
  const profilePic = document.querySelector('.profile-pic');
  
  if (showUserMenu.value && 
      !event.target.closest('.user-menu') && 
      !event.target.closest('.profile-pic')) {
    showUserMenu.value = false;
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

// Add this function in the script section after copyEmailDraft function
function sendEmailDraft() {
  if (!selectedCardForDrafts?.value?.emails?.length) return;
  
  const email = selectedCardForDrafts.value.emails[0];
  const subject = selectedDraft.value?.subject || `Follow-up: ${selectedCardForDrafts.value.name} from ${selectedCardForDrafts.value.company || 'our meeting'}`;
  const body = `${selectedDraft.value?.body || emailDraft.value} \n\n${selectedDraft.value?.signature || ''}`;
  
  // Create mailto URL with encoded parameters
  const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // Open default email client
  window.open(mailtoUrl, '_blank');
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

/* Mobile menu styles */
@media (max-width: 768px) {
  .user-menu {
    position: fixed;
    top: 4rem;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    z-index: 40;
    overflow-y: auto;
  }
}

/* Add these styles to the existing <style> section */
.card-container {
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card-container:hover {
  box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.15);
}

@media (max-width: 640px) {
  .card-container {
    margin-left: -1rem;
    margin-right: -1rem;
    border-radius: 0;
  }
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

/* Add these new styles at the end of the style section */
@media (max-width: 640px) {
  .modal-container :deep(.va-modal__dialog) {
    margin-top: 0;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-container :deep(.va-modal__content) {
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}

@media (max-width: 640px) {
  .flex.flex-col.items-center.gap-3 {
    gap: 4px;
  }
  button {
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
  }
  .group.relative {
    margin-bottom: 8px;
  }
}
</style>
