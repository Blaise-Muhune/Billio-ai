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
        @click="router.push('/home')"
      )
        VaIcon(name="home" size="18px")
        span(class="font-medium") Return Home

    //- Profile Content
    .mt-8(v-else-if="profile")
      //- Profile Header Card
      .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.overflow-hidden
        //- Profile Header with Image
        .relative.bg-gradient-to-r.from-emerald-500.to-teal-500.px-6.pt-12.pb-24(class="sm:px-8")
          .absolute.inset-0.bg-black.opacity-10
          .relative.z-10.flex.flex-col.items-center
            //- Profile Image Container
            .relative.mb-4.group
              div(class="w-32 h-32 rounded-2xl overflow-hidden shadow-lg border-4 border-white transition-transform duration-200 group-hover:scale-105")
                img(
                  :src="profile?.photoURL || '/default-avatar.png'"
                  class="w-full h-full object-cover"
                  alt="Profile picture"
                  @error="handleImageError"
                )
              //- Verified Badge
              .absolute(
                class="-bottom-2 -right-2 bg-white text-emerald-500 p-1.5 rounded-xl shadow-lg"
                v-if="profile.profileCompleted"
              )
                VaIcon(name="verified" size="24px")
            
            //- Name and Title Section
            h1.text-3xl.font-bold.text-white.mb-2(v-if="isOwner || profile.visibility?.nameTitle") {{ profile.displayName }}
            .flex.items-center.gap-2.text-white.bg-black.bg-opacity-20.px-4.py-2.rounded-full(
              v-if="(profile.company || profile.title) && (isOwner || profile.visibility?.nameTitle)"
            )
              VaIcon(name="business" size="20px")
              span {{ [profile.title, profile.company].filter(Boolean).join(' at ') }}
              // Add visibility toggle for name/title
              button(
                v-if="isOwner"
                @click.stop.prevent="toggleVisibility('nameTitle')"
                class="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                :title="profile.visibility?.nameTitle ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="profile.visibility?.nameTitle ? 'visibility' : 'visibility_off'"
                  size="16px"
                  class="text-white"
                )
            
            //- Bio Section - Moved next to name and title
            .text-white.text-center.mt-4.mb-2.max-w-xl.mx-auto(v-if="profile.bio && (isOwner || profile.visibility?.bio)")
              .flex.items-center.justify-center.gap-2
                p.text-sm.leading-relaxed {{ profile.bio }}
                // Add visibility toggle for bio
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('bio')"
                  class="p-1 rounded-full hover:bg-white/10 transition-colors"
                  :title="profile.visibility?.bio ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.bio ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-white"
                  )

        //- Contact Information Section
        .px-6.py-4.-mt-12(
          class="sm:px-8" 
          v-if="isOwner || (profile.email && profile.visibility?.email) || (profile.phone && profile.visibility?.phone) || (hasAddress && profile.visibility?.address)"
        )
          //- Section Header
          .flex.items-center.justify-between.mb-3
            .flex.items-center.gap-2
              VaIcon(name="contact_page" size="18px" class="text-emerald-600")
              h3.text-base.font-medium.text-gray-900 Contact Information
            //- Edit Button for Owner
            button(
              v-if="isOwner"
              @click="router.push('/profile-setup')"
              class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            )
              VaIcon(name="edit" size="16px" class="text-gray-600")

          //- Save Contact Button
          .py-4
            button(
              class="save-contact-btn bg-gradient-to-r from-blue-500 to-indigo-600 text-white w-full max-w-md px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-xl mx-auto relative overflow-hidden group"
              @click="saveContact"
            )
              //- Animated pulse effect
              div(class="absolute inset-0 bg-white opacity-0 transition-opacity duration-500 pulse-animation")
              //- Download icon with animation
              div(class="relative z-10 flex items-center justify-center gap-3")
                VaIcon(
                  name="person_add" 
                  size="20px" 
                  class="transform transition-transform duration-300"
                )
                span.font-medium.text-base Save to Contacts
                VaIcon(
                  name="download" 
                  size="20px" 
                  class="transform transition-transform duration-300 download-icon"
                )
              
              //- Shine effect on hover
              div(class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 shine-container")
                div(class="absolute -inset-full h-[400%] w-[200%] top-0 -left-[100%] bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform rotate-45 shine-effect")

          //- Contact Cards - Minimal design
          .space-y-1.mt-2
            //- Email
            a(
              v-if="profile.email && (isOwner || profile.visibility?.email)"
              :href="'mailto:' + profile.email" 
              class="flex items-center p-2 hover:bg-gray-50 rounded-lg border border-gray-100"
            )
              VaIcon(name="email" size="16px" class="text-emerald-500 mr-2")
              span.text-sm.flex-1 {{ profile.email }}
              //- Visibility Toggle
              button(
                v-if="isOwner"
                @click.stop.prevent="toggleVisibility('email')"
                class="p-1"
                :title="profile.visibility?.email ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="profile.visibility?.email ? 'visibility' : 'visibility_off'"
                  size="16px"
                  class="text-gray-400"
                )

            //- Phone
            a(
              v-if="profile.phone && (isOwner || profile.visibility?.phone)"
              :href="'tel:' + profile.phone" 
              class="flex items-center p-2 hover:bg-gray-50 rounded-lg border border-gray-100"
            )
              VaIcon(name="phone" size="16px" class="text-emerald-500 mr-2")
              span.text-sm.flex-1 {{ profile.phone }}
              //- Visibility Toggle
              button(
                v-if="isOwner"
                @click.stop.prevent="toggleVisibility('phone')"
                class="p-1"
                :title="profile.visibility?.phone ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="profile.visibility?.phone ? 'visibility' : 'visibility_off'"
                  size="16px"
                  class="text-gray-400"
                )
              
            //- Address
            .flex.items-center.p-2.rounded-lg.border.border-gray-100(
              v-if="hasAddress && (isOwner || profile.visibility?.address)"
            )
              VaIcon(name="location_on" size="16px" class="text-emerald-500 mr-2")
              span.text-sm.flex-1 {{ formattedAddress }}
              //- Visibility Toggle
              button(
                v-if="isOwner"
                @click.stop.prevent="toggleVisibility('address')"
                class="p-1"
                :title="profile.visibility?.address ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="profile.visibility?.address ? 'visibility' : 'visibility_off'"
                  size="16px"
                  class="text-gray-400"
                )

        //- Contact information and links divider
        .px-6.pt-2.pb-4(class="sm:px-8")
          .flex.items-center.justify-center.gap-3.my-6
            .h-px.flex-grow.bg-gradient-to-r.from-transparent.via-gray-300.to-transparent
            .bg-white.p-2.rounded-full.shadow-sm
              VaIcon(name="link" size="18px" class="text-blue-500")
            .h-px.flex-grow.bg-gradient-to-r.from-transparent.via-gray-300.to-transparent

        //- Social and Music Links Container
        .px-6.pt-0.pb-8(
          class="sm:px-8" 
          v-if="hasSocialLinks || hasMusicLinks || (profile.github && (isOwner || profile.visibility?.github)) || (profile.otherLink && (isOwner || profile.visibility?.otherLink))"
        )
          .max-w-2xl.mx-auto
            //- Section Headers
            .flex.items-center.justify-between.mb-6
              .flex.items-center.gap-2
                VaIcon(name="share" size="24px" class="text-blue-600")
                h3.text-lg.font-semibold.text-gray-900 My Links
              .flex.items-center
                button(
                  v-if="isOwner"
                  @click="router.push('/profile-setup')"
                  class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                )
                  VaIcon(name="edit" size="18px" class="text-gray-600")

            //- Links Grid - Redesigned for better compact layout
            .grid(class="grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto")
              //- LinkedIn Link
              .rounded-lg.bg-white.border(
                class="border-[#0A66C2]/30 shadow-sm overflow-hidden"
                v-if="profile.linkedin && (isOwner || profile.visibility?.linkedin)"
              )
                a(:href="formatSocialLink(profile.linkedin, 'linkedin')" target="_blank" rel="noopener noreferrer" class="block h-full")
                  .flex.flex-col.items-center.py-3.px-2.text-center
                    .rounded-full(class="bg-[#0A66C2]/10 p-2 mb-2")
                      svg.w-5.h-5(class="text-[#0A66C2]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z")
                    .text-xs.font-medium.text-gray-900 LinkedIn
                    //- Visibility Toggle
                    button.mt-1(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('linkedin')"
                      class="bg-[#0A66C2]/5 rounded-full p-1 inline-flex"
                      :title="profile.visibility?.linkedin ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.linkedin ? 'visibility' : 'visibility_off'"
                        size="14px"
                        class="text-[#0A66C2]"
                      )

              //- Twitter Link
              .rounded-lg.bg-white.border(
                class="border-black/30 shadow-sm overflow-hidden"
                v-if="profile.twitter && (isOwner || profile.visibility?.twitter)"
              )
                a(:href="formatSocialLink(profile.twitter, 'twitter')" target="_blank" rel="noopener noreferrer" class="block h-full")
                  .flex.flex-col.items-center.py-3.px-2.text-center
                    .rounded-full(class="bg-black/10 p-2 mb-2")
                      svg.w-5.h-5(class="text-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z")
                    .text-xs.font-medium.text-gray-900 Twitter
                    //- Visibility Toggle
                    button.mt-1(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('twitter')"
                      class="bg-black/5 rounded-full p-1 inline-flex"
                      :title="profile.visibility?.twitter ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.twitter ? 'visibility' : 'visibility_off'"
                        size="14px"
                        class="text-gray-700"
                      )

              //- Instagram Link
              .rounded-lg.bg-white.border(
                class="border-[#E4405F]/30 shadow-sm overflow-hidden"
                v-if="profile.instagram && (isOwner || profile.visibility?.instagram)"
              )
                a(:href="formatSocialLink(profile.instagram, 'instagram')" target="_blank" rel="noopener noreferrer" class="block h-full")
                  .flex.flex-col.items-center.py-3.px-2.text-center
                    .rounded-full(class="bg-[#E4405F]/10 p-2 mb-2")
                      svg.w-5.h-5(class="text-[#E4405F]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(fill="currentColor" d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z")
                    .text-xs.font-medium.text-gray-900 Instagram
                    //- Visibility Toggle
                    button.mt-1(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('instagram')"
                      class="bg-[#E4405F]/5 rounded-full p-1 inline-flex"
                      :title="profile.visibility?.instagram ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.instagram ? 'visibility' : 'visibility_off'"
                        size="14px"
                        class="text-[#E4405F]"
                      )

              //- Facebook Link
              .rounded-lg.bg-white.border(
                class="border-[#1877F2]/30 shadow-sm overflow-hidden"
                v-if="profile.facebook && (isOwner || profile.visibility?.facebook)"
              )
                a(:href="formatSocialLink(profile.facebook, 'facebook')" target="_blank" rel="noopener noreferrer" class="block h-full")
                  .flex.flex-col.items-center.py-3.px-2.text-center
                    .rounded-full(class="bg-[#1877F2]/10 p-2 mb-2")
                      svg.w-5.h-5(class="text-[#1877F2]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z")
                    .text-xs.font-medium.text-gray-900 Facebook
                    //- Visibility Toggle
                    button.mt-1(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('facebook')"
                      class="bg-[#1877F2]/5 rounded-full p-1 inline-flex"
                      :title="profile.visibility?.facebook ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.facebook ? 'visibility' : 'visibility_off'"
                        size="14px"
                        class="text-[#1877F2]"
                      )

              //- GitHub Link
              .rounded-lg.bg-white.border(
                class="border-gray-900/30 shadow-sm overflow-hidden"
                v-if="profile.github && (isOwner || profile.visibility?.github)"
              )
                a(:href="formatSocialLink(profile.github, 'github')" target="_blank" rel="noopener noreferrer" class="block h-full")
                  .flex.flex-col.items-center.py-3.px-2.text-center
                    .rounded-full(class="bg-gray-900/10 p-2 mb-2")
                      svg.w-5.h-5(class="text-gray-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.022A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.291 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z")
                    .text-xs.font-medium.text-gray-900 GitHub
                    //- Visibility Toggle
                    button.mt-1(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('github')"
                      class="bg-gray-900/5 rounded-full p-1 inline-flex"
                      :title="profile.visibility?.github ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.github ? 'visibility' : 'visibility_off'"
                        size="14px"
                        class="text-gray-700"
                      )

              //- Spotify Link
              .rounded-lg.bg-white.border(
                class="border-[#1DB954]/30 shadow-sm overflow-hidden"
                v-if="profile.spotify && (isOwner || profile.visibility?.spotify)"
              )
                a(:href="formatSocialLink(profile.spotify, 'spotify')" target="_blank" rel="noopener noreferrer" class="block h-full")
                  .flex.flex-col.items-center.py-3.px-2.text-center
                    .rounded-full(class="bg-[#1DB954]/10 p-2 mb-2")
                      svg.w-5.h-5(class="text-[#1DB954]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.201.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z")
                    .text-xs.font-medium.text-gray-900 Spotify
                    //- Visibility Toggle
                    button.mt-1(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('spotify')"
                      class="bg-[#1DB954]/5 rounded-full p-1 inline-flex"
                      :title="profile.visibility?.spotify ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.spotify ? 'visibility' : 'visibility_off'"
                        size="14px"
                        class="text-[#1DB954]"
                      )

              //- SoundCloud Link
              .rounded-lg.bg-white.border(
                class="border-[#FF3300]/30 shadow-sm overflow-hidden"
                v-if="profile.soundcloud && (isOwner || profile.visibility?.soundcloud)"
              )
                a(:href="formatSocialLink(profile.soundcloud, 'soundcloud')" target="_blank" rel="noopener noreferrer" class="block h-full")
                  .flex.flex-col.items-center.py-3.px-2.text-center
                    .rounded-full(class="bg-[#FF3300]/10 p-2 mb-2")
                      svg.w-5.h-5(class="text-[#FF3300]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(fill="currentColor" d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.042.099-.098l.255-2.105-.255-2.154c-.009-.06-.049-.1-.099-.1m-.899-1.574c-.05 0-.091.042-.096.1l-.169 3.728.169 3.674c.005.058.046.1.096.1.049 0 .092-.042.097-.1l.192-3.674-.192-3.728c-.005-.058-.048-.1-.097-.1m2.85-2.375c-.062 0-.112.051-.119.116l-.203 6.08.203 6.016c.007.065.057.116.119.116.061 0 .111-.051.117-.116l.23-6.016-.23-6.08c-.006-.065-.056-.116-.117-.116m.994-1.147c-.076 0-.138.062-.14.144l-.187 7.198.187 7.128c.002.082.064.144.14.144.075 0 .136-.062.138-.144l.213-7.128-.213-7.198c-.002-.082-.063-.144-.138-.144m1.093-1.021c-.086 0-.155.07-.158.162l-.174 8.37.174 8.298c.003.092.072.162.158.162.086 0 .155-.07.157-.162l.199-8.298-.199-8.37c-.002-.092-.071-.162-.157-.162m1.192-1.115c-.098 0-.176.079-.18.18l-.16 9.467.16 9.398c.004.102.082.18.18.18.097 0 .175-.078.178-.18l.183-9.398-.183-9.467c-.003-.101-.081-.18-.178-.18m1.288-1.209c-.008-.104-.085-.183-.19-.183-.103 0-.183.079-.189.183l-.148 11.543.148 11.47c.006.104.086.183.189.183.104 0 .182-.079.19-.183l.169-11.47-.169-11.543m.837 23.198c.115 0 .208-.093.215-.208l.157-11.447-.157-11.55c-.007-.115-.1-.208-.215-.208-.116 0-.21.093-.217.208l-.139 11.55.139 11.447c.007.115.101.208.217.208m1.045 0c.125 0 .228-.1.236-.224l.146-11.431-.146-11.52c-.008-.124-.111-.224-.236-.224-.127 0-.231.1-.239.224l-.129 11.52.129 11.431c.008.124.112.224.239.224m1.057-.015c.137 0 .248-.111.256-.248l.135-11.392-.135-11.494c-.008-.137-.119-.248-.256-.248-.139 0-.25.111-.258.248l-.119 11.494.119 11.392c.008.137.119.248.258.248m1.063-.017c.148 0 .266-.119.275-.268l.124-11.355-.124-11.454c-.009-.149-.127-.268-.275-.268-.149 0-.268.119-.277.268l-.109 11.454.109 11.355c.009.149.128.268.277.268m1.076-.021c.159 0 .287-.128.296-.288l.114-11.314-.114-11.426c-.009-.16-.137-.288-.308-.296-.16 0-.288.128-.298.288l-.1 11.426.1 11.314c.01.16.138.288.298.288m1.086-.024c.17 0 .307-.137.315-.308l.104-11.271-.104-11.389c-.008-.171-.145-.308-.315-.308-.172 0-.31.137-.318.308l-.091 11.389.091 11.271c.008.171.146.308.318.308m1.099-.029c.181 0 .326-.146.336-.327l.094-11.227-.094-11.361c-.01-.181-.155-.327-.336-.327-.18 0-.327.146-.337.327l-.082 11.361.082 11.227c.01.181.157.327.337.327m1.107-.033c.192 0 .347-.154.357-.348l.084-11.173-.084-11.322c-.01-.193-.165-.348-.357-.348-.19 0-.346.155-.356.348l-.073 11.322.073 11.173c.01.194.166.348.356.348m1.118-.037c.202 0 .367-.164.377-.369l.074-11.115-.074-11.295c-.01-.204-.175-.368-.377-.368-.203 0-.368.164-.378.368l-.064 11.295.064 11.115c.01.205.175.369.378.369m1.127-.042c.213 0 .386-.173.397-.388l.065-11.054-.065-11.255c-.011-.214-.184-.387-.397-.397-.214 0-.387.173-.397.387l-.055 11.255.055 11.054c.01.215.183.388.397.388m1.137-.046c.224 0 .405-.182.416-.407l.055-10.989-.055-11.227c-.011-.225-.192-.407-.416-.407-.224 0-.407.182-.418.407l-.045 11.227.045 10.989c.011.225.194.407.418.407m1.148-.05c.234 0 .424-.19.435-.427l.046-10.919-.046-11.197c-.01-.236-.201-.426-.435-.426-.234 0-.426.19-.437.426l-.037 11.197.037 10.919c.01.237.203.427.437.427m1.735-.785l.001-10.612-.001-11.151c-.012-.247-.21-.445-.457-.445-.247 0-.445.198-.457.445l-.037 11.151.037 10.612c.012.248.21.445.457.445.247 0 .445-.197.457-.445M24 12.945V11.55c-.001-2.212-1.794-4.005-4.006-4.005-.856 0-1.658.27-2.327.736C17.27 4.836 14.51 2 11.036 2c-.723 0-1.431.144-2.047.414-.306.135-.386.252-.386.504v15.984c.002.276.224.499.5.499h10.889c2.212-.001 4.007-1.795 4.007-4.006v-.001l.001-.449z")
                    .text-xs.font-medium.text-gray-900 SoundCloud
                    //- Visibility Toggle
                    button.mt-1(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('soundcloud')"
                      class="bg-[#FF3300]/5 rounded-full p-1 inline-flex"
                      :title="profile.visibility?.soundcloud ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.soundcloud ? 'visibility' : 'visibility_off'"
                        size="14px"
                        class="text-[#FF3300]"
                      )

              //- YouTube Music Link
              .rounded-lg.bg-white.border(
                class="border-[#FF0000]/30 shadow-sm overflow-hidden"
                v-if="profile.youtubeMusic && (isOwner || profile.visibility?.youtubeMusic)"
              )
                a(:href="formatSocialLink(profile.youtubeMusic, 'youtubeMusic')" target="_blank" rel="noopener noreferrer" class="block h-full")
                  .flex.flex-col.items-center.py-3.px-2.text-center
                    .rounded-full(class="bg-[#FF0000]/10 p-2 mb-2")
                      svg.w-5.h-5(class="text-[#FF0000]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(fill="currentColor" d="M23.498 6.69a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z")
                    .text-xs.font-medium.text-gray-900 YouTube
                    //- Visibility Toggle
                    button.mt-1(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('youtubeMusic')"
                      class="bg-[#FF0000]/5 rounded-full p-1 inline-flex"
                      :title="profile.visibility?.youtubeMusic ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.youtubeMusic ? 'visibility' : 'visibility_off'"
                        size="14px"
                        class="text-[#FF0000]"
                      )

              //- Apple Music
              .rounded-lg.bg-white.border(
                class="border-[#FA2C55]/30 shadow-sm overflow-hidden"
                v-if="profile.appleMusic && (isOwner || profile.visibility?.appleMusic)"
              )
                a(:href="formatSocialLink(profile.appleMusic, 'appleMusic')" target="_blank" rel="noopener noreferrer" class="block h-full")
                  .flex.flex-col.items-center.py-3.px-2.text-center
                    .rounded-full(class="bg-[#FA2C55]/10 p-2 mb-2")
                      svg.w-5.h-5(class="text-[#FA2C55]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701")
                    .text-xs.font-medium.text-gray-900 Apple Music
                    //- Visibility Toggle
                    button.mt-1(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('appleMusic')"
                      class="bg-[#FA2C55]/5 rounded-full p-1 inline-flex"
                      :title="profile.visibility?.appleMusic ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.appleMusic ? 'visibility' : 'visibility_off'"
                        size="14px"
                        class="text-[#FA2C55]"
                      )

              //- Other Link
              .rounded-lg.bg-white.border(
                class="border-gray-900/30 shadow-sm overflow-hidden"
                v-if="profile.otherLink && (isOwner || profile.visibility?.otherLink)"
              )
                a(:href="formatSocialLink(profile.otherLink)" target="_blank" rel="noopener noreferrer" class="block h-full")
                  .flex.flex-col.items-center.py-3.px-2.text-center
                    .rounded-full(class="bg-gray-900/10 p-2 mb-2")
                      svg.w-5.h-5(class="text-gray-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z")
                    .text-xs.font-medium.text-gray-900 Other Link
                    //- Visibility Toggle
                    button.mt-1(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('otherLink')"
                      class="bg-gray-900/5 rounded-full p-1 inline-flex"
                      :title="profile.visibility?.otherLink ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.otherLink ? 'visibility' : 'visibility_off'"
                        size="14px"
                        class="text-gray-700"
                      )

              //- Custom Links Section
              template(v-if="profile.customLinks && profile.customLinks.length > 0")
                template(v-for="(link, index) in profile.customLinks" :key="index")
                  .rounded-lg.bg-white.border(
                    class="border-gray-900/30 shadow-sm overflow-hidden"
                    v-if="isOwner || profile.visibility?.customLinks[index] !== false"
                  )
                    a(:href="formatSocialLink(link.url)" target="_blank" rel="noopener noreferrer" class="block h-full")
                      .flex.flex-col.items-center.py-3.px-2.text-center
                        .rounded-full(class="bg-gray-900/10 p-2 mb-2" v-if="!link.iconUrl")
                          VaIcon(name="link" size="20px" class="text-gray-700")
                        .rounded-full(class="bg-white p-2 mb-2" v-if="link.iconUrl")
                          img(:src="link.iconUrl" class="w-5 h-5 object-contain" :alt="link.name")
                        .text-xs.font-medium.text-gray-900 {{ link.name }}
                        //- Visibility Toggle
                        button.mt-1(
                          v-if="isOwner"
                          @click.stop.prevent="toggleCustomLinkVisibility(index)"
                          class="bg-gray-900/5 rounded-full p-1 inline-flex"
                          :title="getCustomLinkVisibility(index) ? 'Hide from public' : 'Show to public'"
                        )
                          VaIcon(
                            :name="profile.visibility?.customLinks[index] !== false ? 'visibility' : 'visibility_off'"
                            size="14px"
                            class="text-gray-700"
                          )

    //- Call to Action (for non-subscribed users)
    .mt-6(v-if="!isPremium")
      .bg-gradient-to-br.from-emerald-50.to-teal-50.rounded-2xl.border.border-emerald-100.p-8
        //- Remove Button for Owner
        button(
          v-if="isOwner"
          @click="showUpgradePrompt = true"
          class="mb-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center gap-2"
        )
          VaIcon(name="delete" size="20px")
          span Remove

        //- Header
        .text-center.mb-8
          .inline-flex.items-center.justify-center.w-16.h-16.rounded-full.bg-emerald-500.bg-opacity-10.mb-4
            VaIcon(
              name="qr_code_2"
              size="32px"
              class="text-emerald-500"
            )
          h3.text-2xl.font-semibold.text-gray-900.mb-3 Create Your Own Digital Business Card
          p.text-gray-600.max-w-md.mx-auto Join BilloAI and unlock powerful networking tools

        //- Features Grid
        .grid.gap-6.mb-8(class="sm:grid-cols-3")
          //- Smart QR Feature
          .bg-white.rounded-xl.p-6.border.border-gray-100.text-center(
            class="shadow-sm hover:shadow-md transition-all duration-300"
          )
            .inline-flex.items-center.justify-center.w-14.h-14.rounded-xl.bg-emerald-50.mb-4.mx-auto
              VaIcon(name="qr_code_2" size="28px" class="text-emerald-500")
            h4.font-semibold.text-gray-900.mb-2 Smart QR Business Cards
            p.text-sm.text-gray-600.leading-relaxed Say goodbye to paper cards. Share your contact info instantly with a scannable QR code that never runs out
          
          //- Digital Profile Feature
          .bg-white.rounded-xl.p-6.border.border-gray-100.text-center(
            class="shadow-sm hover:shadow-md transition-all duration-300"
          )
            .inline-flex.items-center.justify-center.w-14.h-14.rounded-xl.bg-emerald-50.mb-4.mx-auto
              VaIcon(name="person" size="28px" class="text-emerald-500")
            h4.font-semibold.text-gray-900.mb-2 Professional Profile
            p.text-sm.text-gray-600.leading-relaxed Create a stunning digital presence that showcases your brand, contact info, and social links in one place
          
          //- Card Management Feature
          .bg-white.rounded-xl.p-6.border.border-gray-100.text-center(
            class="shadow-sm hover:shadow-md transition-all duration-300"
          )
            .inline-flex.items-center.justify-center.w-14.h-14.rounded-xl.bg-emerald-50.mb-4.mx-auto
              VaIcon(name="style" size="28px" class="text-emerald-500")
            h4.font-semibold.text-gray-900.mb-2 Organized Contacts
            p.text-sm.text-gray-600.leading-relaxed Keep all your business connections organized digitally - no more lost cards or outdated information

        //- CTA Button
        .text-center
          button(
            @click="router.push('/')"
            class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-3 mx-auto shadow-lg hover:shadow-xl group"
          )
            VaIcon(name="rocket_launch" size="24px")
            span.font-medium.text-lg Try BilloAI Free
            VaIcon(name="arrow_forward" size="24px" class="transition-transform duration-300 group-hover:translate-x-1")

    //- Upgrade Prompt Modal
    VaModal(
      v-model="showUpgradePrompt"
      :hide-default-actions="true"
      class="rounded-2xl z-50"
    )
      .p-8
        h3.text-2xl.font-bold.mb-6 Upgrade to Premium
        p.text-gray-600.mb-4 Enjoy more features by upgrading your plan.
        .flex.justify-end.gap-4.mt-8
          button(
            class="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
            @click="showUpgradePrompt = false"
          ) Cancel
          button(
            class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
            @click="router.push('/subscription')"
          )
            VaIcon(name="upgrade" size="16px")
            span(class="font-medium") Upgrade Now

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

  //- Sticky Create Button
  .fixed.bottom-8.right-8.z-50(v-if="!isPremium")
    button(
      class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
      @click="router.push('/')"
    )
      VaIcon(name="add" size="20px")
      span.font-medium Create Mine
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '../../services/authService';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { paymentService } from '../../services/paymentService';

const route = useRoute();
const router = useRouter();
const user = ref(null);
const profile = ref(null);
const loading = ref(true);
const error = ref('');
const showUpgradePrompt = ref(false);

// Add isOwner computed property
const isOwner = computed(() => {
  return user.value?.uid === route.params.username;
});

// Add toggleVisibility function
async function toggleVisibility(field) {
  try {
    if (!isOwner.value) return;
    
    // Initialize visibility object if it doesn't exist
    if (!profile.value.visibility) {
      profile.value.visibility = {
        nameTitle: true,
        bio: true,
        email: true,
        phone: true,
        address: true,
        linkedin: true,
        twitter: true,
        instagram: true,
        facebook: true,
        spotify: true,
        soundcloud: true,
        youtubeMusic: true,
        appleMusic: true
      };
    }
    
    // Toggle the visibility state
    profile.value.visibility[field] = !profile.value.visibility[field];
    
    // Update the profile in Firestore
    const userRef = doc(db, 'users', user.value.uid);
    await updateDoc(userRef, {
      visibility: profile.value.visibility
    });
  } catch (err) {
    console.error('Error toggling visibility:', err);
    error.value = 'Failed to update visibility settings';
  }
}

// Computed properties for profile data
const hasAddress = computed(() => {
  return profile.value?.addressLine1 || profile.value?.city || profile.value?.state || profile.value?.zipCode;
});

const formattedAddress = computed(() => {
  if (!profile.value) return '';
  
  const parts = [
    profile.value.addressLine1,
    profile.value.addressLine2,
    profile.value.city,
    profile.value.state,
    profile.value.zipCode
  ].filter(Boolean);
  
  return parts.join(', ');
});

const hasSocialLinks = computed(() => {
  return profile.value?.linkedin || profile.value?.twitter || profile.value?.instagram || profile.value?.facebook;
});

const hasMusicLinks = computed(() => {
  return profile.value?.spotify || profile.value?.soundcloud || profile.value?.youtubeMusic || profile.value?.appleMusic;
});

// Helper function to format social media links
function formatSocialLink(url, platform) {
  if (!url) return '#';
  
  // If the URL already starts with http:// or https://, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Platform-specific formatting
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
    case 'spotify':
      return `https://open.spotify.com/artist/${url}`;
    case 'soundcloud':
      return `https://soundcloud.com/${url}`;
    case 'youtubeMusic':
      return `https://music.youtube.com/channel/${url}`;
    case 'appleMusic':
      return `https://music.apple.com/${url}`;
    default:
  return `https://${url}`;
  }
}

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

    // Ensure visibility object exists
    if (!profile.value.visibility) {
      profile.value.visibility = {};
    }
    
    // Ensure customLinks visibility object exists
    if (!profile.value.visibility.customLinks) {
      profile.value.visibility.customLinks = {};
    }
    
    console.log('Profile loaded:', profile.value);
    console.log('Visibility settings:', profile.value.visibility);
    
    // Check premium status after loading profile
    await checkPremiumStatus();
    
  } catch (err) {
    console.error('Error loading profile:', err);
    error.value = 'Failed to load profile';
  } finally {
    loading.value = false;
  }
}

// Save contact as vCard
async function saveContact() {
  try {
    // Get the profile image URL
    const photoUrl = profile.value?.photoURL || '/default-avatar.png';
    
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
      hasAddress.value ? `ADR;type=WORK:;;${formattedAddress.value}` : '',
      `PHOTO;VALUE=URL:${photoUrl}`,
      profile.value.linkedin ? `URL;type=LinkedIn:${formatSocialLink(profile.value.linkedin, 'linkedin')}` : '',
      profile.value.twitter ? `URL;type=Twitter:${formatSocialLink(profile.value.twitter, 'twitter')}` : '',
      profile.value.instagram ? `URL;type=Instagram:${formatSocialLink(profile.value.instagram, 'instagram')}` : '',
      profile.value.facebook ? `URL;type=Facebook:${formatSocialLink(profile.value.facebook, 'facebook')}` : '',
      profile.value.spotify ? `URL;type=Spotify:${formatSocialLink(profile.value.spotify, 'spotify')}` : '',
      profile.value.soundcloud ? `URL;type=SoundCloud:${formatSocialLink(profile.value.soundcloud, 'soundcloud')}` : '',
      profile.value.youtubeMusic ? `URL;type=YouTube:${formatSocialLink(profile.value.youtubeMusic, 'youtubeMusic')}` : '',
      profile.value.appleMusic ? `URL;type=AppleMusic:${formatSocialLink(profile.value.appleMusic, 'appleMusic')}` : '',
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
  } catch (err) {
    console.error('Error saving contact:', err);
    error.value = 'Failed to save contact';
  }
}

// Auth functions
async function signIn() {
  try {
    await authService.signInWithGoogle();
    router.push('/home');
  } catch (err) {
    console.error('Error signing in:', err);
    error.value = 'Failed to sign in';
  }
}

// Add these functions to the script section
function getCustomLinkVisibility(index) {
  if (!profile.value?.visibility?.customLinks) {
    return true;
  }
  // Check if the index exists in the customLinks visibility object
  // If not present or undefined, default to true
  // If explicitly false, return false
  return profile.value.visibility.customLinks[index] !== false;
}

function toggleCustomLinkVisibility(index) {
  try {
    if (!isOwner.value) return;
    
    // Initialize visibility object if it doesn't exist
    if (!profile.value.visibility) {
      profile.value.visibility = {};
    }
    
    // Initialize customLinks object in visibility if it doesn't exist
    if (!profile.value.visibility.customLinks) {
      profile.value.visibility.customLinks = {};
    }
    
    // Get current state
    const currentState = getCustomLinkVisibility(index);
    
    // Toggle the visibility state - explicitly set to true or false
    profile.value.visibility.customLinks[index] = !currentState;
    
    // Log for debugging
    console.log(`Toggling visibility for link ${index}: ${currentState} -> ${!currentState}`);
    console.log('Updated visibility object:', profile.value.visibility);
    
    // Update the profile in Firestore with the complete visibility object
    const userRef = doc(db, 'users', user.value.uid);
    updateDoc(userRef, {
      visibility: profile.value.visibility
    });
  } catch (err) {
    console.error('Error toggling custom link visibility:', err);
    error.value = 'Failed to update visibility settings';
  }
}

// Add this to the script section
function handleImageError(e) {
  // If image fails to load, fallback to default avatar
  e.target.src = '/default-avatar.png';
}

// Initialize
onMounted(async () => {
  // Check if user is logged in
  authService.onAuthStateChanged((newUser) => {
    user.value = newUser;
  });
  
  // Load profile data
  await loadProfile();
});

// Add isPremium ref and check in script section
const isPremium = ref(false);

// Add checkPremiumStatus function
async function checkPremiumStatus() {
  try {
    if (!profile.value) return;
    
    // Check if the profile owner has a premium plan
    const userRef = doc(db, 'users', profile.value.id);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      isPremium.value = userData.plan === 'PRO' || userData.plan === 'BASIC';
    } else {
      isPremium.value = false;
    }
  } catch (err) {
    console.error('Error checking premium status:', err);
    isPremium.value = false;
  }
}
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

/* Add smooth transition for the sticky button */
.fixed button {
  transition: all 0.3s ease;
}

/* Save contact button animations */
.pulse-animation {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.2; }
}

/* Button hover states */
.group:hover .pulse-animation {
  opacity: 0.2;
}

.group:hover .shine-container {
  opacity: 1;
}

.group:hover .shine-effect {
  animation: shine 1.5s ease-in;
}

.group:hover .download-icon {
  transform: translateY(1px);
}

.group:hover .transform {
  transform: scale(1.1);
}

/* Shine effect for the button */
@keyframes shine {
  100% {
    left: 125%;
  }
}

/* Button scale effect on click */
.save-contact-btn:active {
  transform: scale(0.98);
}
</style>