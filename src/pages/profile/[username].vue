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
            .relative.mb-4
              img(
                :src="profile?.photoURL || '/default-avatar.png'"
                class="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-white"
                alt="Profile picture"
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
        .px-6.py-8.-mt-12(class="sm:px-8" v-if="isOwner || (profile.email && profile.visibility?.email) || (profile.phone && profile.visibility?.phone) || (hasAddress && profile.visibility?.address)")
          .bg-white.rounded-xl.shadow-lg.p-6.max-w-2xl.mx-auto
            //- Save Contact Button - Smaller and new color scheme
            button(
              class="bg-indigo-500 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-600 transition-all duration-300 flex items-center justify-center gap-2 mb-6 mx-auto shadow-sm"
              @click="saveContact"
            )
              VaIcon(name="person_add" size="20px")
              span.font-medium Save Contact

            //- Contact Grid - Using similar grid layout to social links
            .grid.gap-4.justify-center(
              class="grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(140px,140px))] place-items-center mx-auto"
              style="max-width: 600px;"
            )
              //- Email
              a(
                v-if="profile.email && (isOwner || profile.visibility?.email)"
                :href="'mailto:' + profile.email"
                class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors text-center w-full"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full.bg-emerald-100.mb-2
                  VaIcon(name="email" size="24px" class="text-emerald-600")
                .text-sm.text-gray-900.font-medium Email
                // Add visibility toggle for email
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('email')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.email ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.email ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )

              //- Phone
              a(
                v-if="profile.phone && (isOwner || profile.visibility?.phone)"
                :href="'tel:' + profile.phone"
                class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors text-center"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full.bg-emerald-100.mb-2
                  VaIcon(name="phone" size="24px" class="text-emerald-600")
                .text-sm.text-gray-900.font-medium Phone
                // Add visibility toggle for phone
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('phone')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.phone ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.phone ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )
              
              //- Address
              .flex.flex-col.items-center.p-4.rounded-xl.bg-gray-50.text-center(
                v-if="hasAddress && (isOwner || profile.visibility?.address)"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full.bg-emerald-100.mb-2
                  VaIcon(name="location_on" size="24px" class="text-emerald-600")
                .text-sm.text-gray-900.font-medium Address
                // Add visibility toggle for address
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('address')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.address ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.address ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )

        //- Social Links Section
        .px-6.pb-8(
          class="sm:px-8" 
          v-if="hasSocialLinks && (isOwner || (profile.linkedin && profile.visibility?.linkedin) || (profile.twitter && profile.visibility?.twitter) || (profile.instagram && profile.visibility?.instagram) || (profile.facebook && profile.visibility?.facebook))"
        )
          .max-w-2xl.mx-auto
            .grid.gap-4.justify-center(
              class="grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(140px,140px))] place-items-center mx-auto"
              style="max-width: 600px;"
            )
              //- LinkedIn
              a(
                v-if="profile.linkedin && (isOwner || profile.visibility?.linkedin)"
                :href="formatSocialLink(profile.linkedin, 'linkedin')"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-[#0A66C2]/10 transition-colors text-center w-full"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full(class="bg-[#0A66C2]/10 mb-2")
                  svg.w-6.h-6(class="text-[#0A66C2]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                    path(fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z")
                .text-sm.text-gray-900.font-medium LinkedIn
                // Add visibility toggle for LinkedIn
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('linkedin')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.linkedin ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.linkedin ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )

              //- Twitter/X
              a(
                v-if="profile.twitter && (isOwner || profile.visibility?.twitter)"
                :href="formatSocialLink(profile.twitter, 'twitter')"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-black/10 transition-colors text-center w-full"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full(class="bg-black/10 mb-2")
                  svg.w-6.h-6.text-black(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                    path(fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z")
                .text-sm.text-gray-900.font-medium Twitter
                // Add visibility toggle for Twitter
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('twitter')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.twitter ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.twitter ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )

              //- Instagram
              a(
                v-if="profile.instagram && (isOwner || profile.visibility?.instagram)"
                :href="formatSocialLink(profile.instagram, 'instagram')"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-[#E4405F]/10 transition-colors text-center w-full"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full(class="bg-[#E4405F]/10 mb-2")
                  svg.w-6.h-6(class="text-[#E4405F]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                    path(fill="currentColor" d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z")
                .text-sm.text-gray-900.font-medium Instagram
                // Add visibility toggle for Instagram
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('instagram')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.instagram ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.instagram ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )

              //- Facebook
              a(
                v-if="profile.facebook && (isOwner || profile.visibility?.facebook)"
                :href="formatSocialLink(profile.facebook, 'facebook')"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-[#1877F2]/10 transition-colors text-center w-full"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full(class="bg-[#1877F2]/10 mb-2")
                  svg.w-6.h-6(class="text-[#1877F2]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                    path(fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z")
                .text-sm.text-gray-900.font-medium Facebook
                // Add visibility toggle for Facebook
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('facebook')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.facebook ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.facebook ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )

            //- Add visibility toggle for social links
            button(
              v-if="isOwner"
              @click.stop.prevent="toggleVisibility('socialLinks')"
              class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
              :title="profile.visibility?.socialLinks ? 'Hide from public' : 'Show to public'"
            )
              VaIcon(
                :name="profile.visibility?.socialLinks ? 'visibility' : 'visibility_off'"
                size="16px"
                class="text-gray-600"
              )

        //- Music Links Section
        .px-6.pb-8(
          class="sm:px-8" 
          v-if="hasMusicLinks && (isOwner || (profile.spotify && profile.visibility?.spotify) || (profile.soundcloud && profile.visibility?.soundcloud) || (profile.youtubeMusic && profile.visibility?.youtubeMusic) || (profile.appleMusic && profile.visibility?.appleMusic))"
        )
          .max-w-2xl.mx-auto
            .grid.gap-4.justify-center(
              class="grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(140px,140px))] place-items-center mx-auto"
              style="max-width: 600px;"
            )
              //- Spotify
              a(
                v-if="profile.spotify && (isOwner || profile.visibility?.spotify)"
                :href="formatSocialLink(profile.spotify, 'spotify')"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-[#1DB954]/10 transition-colors text-center w-full"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full(class="bg-[#1DB954]/10 mb-2")
                  svg.w-6.h-6(class="text-[#1DB954]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                    path(fill="currentColor" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z")
                .text-sm.text-gray-900.font-medium Spotify
                // Add visibility toggle for Spotify
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('spotify')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.spotify ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.spotify ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )

              //- SoundCloud
              a(
                v-if="profile.soundcloud && (isOwner || profile.visibility?.soundcloud)"
                :href="formatSocialLink(profile.soundcloud, 'soundcloud')"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-[#FF5500]/10 transition-colors text-center w-full"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full(class="bg-[#FF5500]/10 mb-2")
                  svg.w-6.h-6(class="text-[#FF5500]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                    path(fill="currentColor" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z")
                .text-sm.text-gray-900.font-medium SoundCloud
                // Add visibility toggle for SoundCloud
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('soundcloud')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.soundcloud ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.soundcloud ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )

              //- YouTube Music
              a(
                v-if="profile.youtubeMusic && (isOwner || profile.visibility?.youtubeMusic)"
                :href="formatSocialLink(profile.youtubeMusic, 'youtubeMusic')"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-[#FF0000]/10 transition-colors text-center w-full"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full(class="bg-[#FF0000]/10 mb-2")
                  svg.w-6.h-6(class="text-[#FF0000]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                    path(fill="currentColor" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z")
                .text-sm.text-gray-900.font-medium YouTube Music
                // Add visibility toggle for YouTube Music
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('youtubeMusic')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.youtubeMusic ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.youtubeMusic ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )

              //- Apple Music
              a(
                v-if="profile.appleMusic && (isOwner || profile.visibility?.appleMusic)"
                :href="formatSocialLink(profile.appleMusic, 'appleMusic')"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-[#000000]/10 transition-colors text-center w-full"
              )
                .flex.items-center.justify-center.w-12.h-12.rounded-full(class="bg-[#000000]/10 mb-2")
                  svg.w-6.h-6(class="text-[#000000]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                    path(fill="currentColor" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z")
                .text-sm.text-gray-900.font-medium Apple Music
                // Add visibility toggle for Apple Music
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('appleMusic')"
                  class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  :title="profile.visibility?.appleMusic ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.appleMusic ? 'visibility' : 'visibility_off'"
                    size="16px"
                    class="text-gray-600"
                  )

            //- Add visibility toggle for music links
            button(
              v-if="isOwner"
              @click.stop.prevent="toggleVisibility('musicLinks')"
              class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
              :title="profile.visibility?.musicLinks ? 'Hide from public' : 'Show to public'"
            )
              VaIcon(
                :name="profile.visibility?.musicLinks ? 'visibility' : 'visibility_off'"
                size="16px"
                class="text-gray-600"
              )

        //- Other Link
        a(
          v-if="profile.otherLink && (isOwner || profile.visibility?.otherLink)"
          :href="profile.otherLink"
          target="_blank"
          rel="noopener noreferrer"
          class="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-center w-full"
        )
          .flex.items-center.justify-center.w-12.h-12.rounded-full.bg-gray-200.mb-2
            VaIcon(name="link" size="24px" class="text-gray-600")
          .text-sm.text-gray-900.font-medium Other Link
          // Add visibility toggle for Other Link
          button(
            v-if="isOwner"
            @click.stop.prevent="toggleVisibility('otherLink')"
            class="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
            :title="profile.visibility?.otherLink ? 'Hide from public' : 'Show to public'"
          )
            VaIcon(
              :name="profile.visibility?.otherLink ? 'visibility' : 'visibility_off'"
              size="16px"
              class="text-gray-600"
            )

    //- Call to Action (for non-subscribed users)
    .mt-6(v-if="!user || !user.isPremium")
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
            class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-3 mx-auto shadow-md hover:shadow-lg group"
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
  .fixed.bottom-8.right-8.z-50(v-if="!user || !user.isPremium")
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
  
  // Add https:// if not present
  return `https://${url}`;
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

// Initialize
onMounted(async () => {
  // Check if user is logged in
  authService.onAuthStateChanged((newUser) => {
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

/* Add smooth transition for the sticky button */
.fixed button {
  transition: all 0.3s ease;
}
</style>