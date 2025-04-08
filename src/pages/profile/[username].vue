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

        //- Social and Music Links Container
        .px-6.pb-8(
          class="sm:px-8"
          v-if="hasSocialLinks || hasMusicLinks || (profile.github && (isOwner || profile.visibility?.github)) || (profile.otherLink && (isOwner || profile.visibility?.otherLink))"
        )
          .max-w-2xl.mx-auto
            //- Section Headers
            .flex.items-center.justify-between.mb-6
              h3.text-lg.font-semibold.text-gray-900 Connect & Follow
              .flex.items-center.gap-2
                span.text-sm.text-gray-500 {{ Object.keys(profile.visibility || {}).filter(key => profile[key]).length }} links
                button(
                  v-if="isOwner"
                  @click="router.push('/profile-setup')"
                  class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                )
                  VaIcon(name="edit" size="18px" class="text-gray-600")

            //- Links Grid with Categories
            .space-y-8
              //- Professional Networks
              .space-y-4(v-if="profile.linkedin || profile.github")
                .flex.items-center.gap-2.mb-2
                  VaIcon(name="business" size="20px" class="text-gray-600")
                  h4.text-sm.font-medium.text-gray-700 Professional
                .space-y-4
                  //- LinkedIn
                  a(
                    v-if="profile.linkedin && (isOwner || profile.visibility?.linkedin)"
                    :href="formatSocialLink(profile.linkedin, 'linkedin')"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#0A66C2]/10 transition-all duration-300 w-full"
                  )
                    .flex.items-center.justify-center.w-12.h-12.rounded-xl(class="bg-[#0A66C2]/10 group-hover:scale-110 transition-transform duration-300")
                      svg.w-6.h-6(class="text-[#0A66C2]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(
                          fill="currentColor"
                          d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                        )
                    .flex-1
                      .text-sm.font-medium.text-gray-900 LinkedIn
                      .text-xs.text-gray-500.truncate {{ profile.linkedin }}
                    button(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('linkedin')"
                      class="p-2 rounded-full hover:bg-[#0A66C2]/10 transition-colors"
                      :title="profile.visibility?.linkedin ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.linkedin ? 'visibility' : 'visibility_off'"
                        size="18px"
                        class="text-[#0A66C2]"
                      )

                  //- GitHub
                  a(
                    v-if="profile.github && (isOwner || profile.visibility?.github)"
                    :href="formatSocialLink(profile.github, 'github')"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-black/5 transition-all duration-300 w-full"
                  )
                    .flex.items-center.justify-center.w-12.h-12.rounded-xl(class="bg-black/5 group-hover:scale-110 transition-transform duration-300")
                      svg.w-6.h-6(class="text-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(
                          fill="currentColor"
                          d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.744.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.775.418-1.305.76-1.605-2.665-.3-5.467-1.335-5.467-5.93 0-1.31.47-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.47 11.47 0 013.003-.404c1.018.005 2.042.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.625-5.48 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .32.217.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z"
                        )
                    .flex-1
                      .text-sm.font-medium.text-gray-900 GitHub
                      .text-xs.text-gray-500.truncate {{ profile.github }}
                    button(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('github')"
                      class="p-2 rounded-full hover:bg-black/5 transition-colors"
                      :title="profile.visibility?.github ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.github ? 'visibility' : 'visibility_off'"
                        size="18px"
                        class="text-black"
                      )

              //- Social Media
              .space-y-4(v-if="profile.twitter || profile.instagram || profile.facebook")
                .flex.items-center.gap-2.mb-2
                  VaIcon(name="share" size="20px" class="text-gray-600")
                  h4.text-sm.font-medium.text-gray-700 Social Media
                .space-y-4
                  //- Twitter
                  a(
                    v-if="profile.twitter && (isOwner || profile.visibility?.twitter)"
                    :href="formatSocialLink(profile.twitter, 'twitter')"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-black/5 transition-all duration-300 w-full"
                  )
                    .flex.items-center.justify-center.w-12.h-12.rounded-xl(class="bg-black/5 group-hover:scale-110 transition-transform duration-300")
                      svg.w-6.h-6.text-black(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(
                          fill="currentColor"
                          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                        )
                    .flex-1
                      .text-sm.font-medium.text-gray-900 Twitter
                      .text-xs.text-gray-500.truncate {{ profile.twitter }}
                // Add visibility toggle for Twitter
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('twitter')"
                  class="p-2 rounded-full hover:bg-black/5 transition-colors"
                  :title="profile.visibility?.twitter ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.twitter ? 'visibility' : 'visibility_off'"
                    size="18px"
                    class="text-black"
                  )

                //- Instagram
                a(
                  v-if="profile.instagram && (isOwner || profile.visibility?.instagram)"
                  :href="formatSocialLink(profile.instagram, 'instagram')"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#E4405F]/10 transition-all duration-300 w-full"
                )
                  .flex.items-center.justify-center.w-12.h-12.rounded-xl(class="bg-[#E4405F]/10 group-hover:scale-110 transition-transform duration-300")
                    svg.w-6.h-6(class="text-[#E4405F]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                      path(
                        fill="currentColor"
                        d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"
                      )
                  .flex-1
                    .text-sm.font-medium.text-gray-900 Instagram
                    .text-xs.text-gray-500.truncate {{ profile.instagram }}
                // Add visibility toggle for Instagram
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('instagram')"
                  class="p-2 rounded-full hover:bg-[#E4405F]/10 transition-colors"
                  :title="profile.visibility?.instagram ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.instagram ? 'visibility' : 'visibility_off'"
                    size="18px"
                    class="text-[#E4405F]"
                  )

                //- Facebook
                a(
                  v-if="profile.facebook && (isOwner || profile.visibility?.facebook)"
                  :href="formatSocialLink(profile.facebook, 'facebook')"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#1877F2]/10 transition-all duration-300 w-full"
                )
                  .flex.items-center.justify-center.w-12.h-12.rounded-xl(class="bg-[#1877F2]/10 group-hover:scale-110 transition-transform duration-300")
                    svg.w-6.h-6(class="text-[#1877F2]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                      path(
                        fill="currentColor"
                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      )
                  .flex-1
                    .text-sm.font-medium.text-gray-900 Facebook
                    .text-xs.text-gray-500.truncate {{ profile.facebook }}
                // Add visibility toggle for Facebook
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('facebook')"
                  class="p-2 rounded-full hover:bg-[#1877F2]/10 transition-colors"
                  :title="profile.visibility?.facebook ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.facebook ? 'visibility' : 'visibility_off'"
                    size="18px"
                    class="text-[#1877F2]"
                  )

                //- Other Link
                a(
                  v-if="profile.otherLink && (isOwner || profile.visibility?.otherLink)"
                  :href="formatSocialLink(profile.otherLink)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-black/5 transition-all duration-300 w-full"
                )
                  .flex.items-center.justify-center.w-12.h-12.rounded-xl(class="bg-black/5 group-hover:scale-110 transition-transform duration-300")
                    svg.w-6.h-6.text-black(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                      path(
                        fill="currentColor"
                        d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
                      )
                  .flex-1
                    .text-sm.font-medium.text-gray-900 Other Link
                    .text-xs.text-gray-500.truncate {{ profile.otherLink }}
                // Add visibility toggle for Other Link
                button(
                  v-if="isOwner"
                  @click.stop.prevent="toggleVisibility('otherLink')"
                  class="p-2 rounded-full hover:bg-black/5 transition-colors"
                  :title="profile.visibility?.otherLink ? 'Hide from public' : 'Show to public'"
                )
                  VaIcon(
                    :name="profile.visibility?.otherLink ? 'visibility' : 'visibility_off'"
                    size="18px"
                    class="text-black"
                  )

              //- Music Platforms
              .space-y-4(v-if="profile.spotify || profile.soundcloud || profile.youtubeMusic || profile.appleMusic")
                .flex.items-center.gap-2.mb-2
                  VaIcon(name="music_note" size="20px" class="text-gray-600")
                  h4.text-sm.font-medium.text-gray-700 Music
                .space-y-4
                  //- Spotify
                  a(
                    v-if="profile.spotify && (isOwner || profile.visibility?.spotify)"
                    :href="formatSocialLink(profile.spotify, 'spotify')"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#1DB954]/10 transition-all duration-300 w-full"
                  )
                    .flex.items-center.justify-center.w-12.h-12.rounded-xl(class="bg-[#1DB954]/10 group-hover:scale-110 transition-transform duration-300")
                      svg.w-6.h-6(class="text-[#1DB954]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(
                          fill="currentColor"
                          d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                        )
                    .flex-1
                      .text-sm.font-medium.text-gray-900 Spotify
                      .text-xs.text-gray-500.truncate {{ profile.spotify }}
                    // Add visibility toggle for Spotify
                    button(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('spotify')"
                      class="p-2 rounded-full hover:bg-[#1DB954]/10 transition-colors"
                      :title="profile.visibility?.spotify ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.spotify ? 'visibility' : 'visibility_off'"
                        size="18px"
                        class="text-[#1DB954]"
                      )

                  //- SoundCloud
                  a(
                    v-if="profile.soundcloud && (isOwner || profile.visibility?.soundcloud)"
                    :href="formatSocialLink(profile.soundcloud, 'soundcloud')"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#FF3300]/10 transition-all duration-300 w-full"
                  )
                    .flex.items-center.justify-center.w-12.h-12.rounded-xl(class="bg-[#FF3300]/10 group-hover:scale-110 transition-transform duration-300")
                      svg.w-6.h-6(class="text-[#FF3300]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(
                          fill="currentColor"
                          d="M20.5 16.8c-.1.1-.1.1-.2.1-.1 0-.1-.1-.1-.2l.2-1.9-.2-1.9c0-.1 0-.1.1-.2.1 0 .1-.1.2-.1.1 0 .1.1.1.2l.2 2-.2 1.9c-.1.1-.1.1-.1.1zm-3.4-4.2c-.1 0-.1.1-.1.2l-.4 2.5.4 2.5v.2c.1 0 .1-.1.1-.2l.5-2.5-.5-2.5c0-.1-.1-.2-.1-.2h.1zm1.7-.1c-.1 0-.1.1-.1.2l-.3 2.8.3 2.7c0 .1.1.1.1.1.1 0 .1-.1.1-.2l.4-2.7-.4-2.7c0-.1-.1-.2-.1-.2zm-3.4-1.5c-.1 0-.1.1-.1.1l-.5 4.4.5 4.4c0 .1.1.1.1.1.1 0 .1-.1.1-.1l.6-4.4-.6-4.4c0-.1-.1-.1-.1-.1zm1.7.1c-.1 0-.1.1-.1.2l-.4 4.2.4 4.2c0 .1.1.2.1.2.1 0 .1-.1.1-.2l.5-4.2-.5-4.2c0-.1-.1-.2-.1-.2zm-6.8-2.6c-.1 0-.1 0-.1.1l-.3 1.6.3 1.6c0 .1 0 .1.1.1s.1 0 .1-.1l.3-1.6-.3-1.6c0-.1 0-.1-.1-.1zm1.6.3c-.1 0-.1 0-.1.1l-.4 1.9.4 1.9c0 .1 0 .1.1.1.1 0 .1 0 .1-.1l.4-1.9-.4-1.9c0-.1 0-.1-.1-.1zm1.8.4c-.1 0-.1.1-.1.1l-.4 2.2.4 2.2c0 .1.1.1.1.1s.1-.1.1-.1l.4-2.2-.4-2.2c0-.1-.1-.1-.1-.1zm1.7.2c-.1 0-.1.1-.1.1l-.4 2.8.4 2.8c0 .1.1.1.1.1.1 0 .1-.1.1-.1l.4-2.8-.4-2.8c0-.1-.1-.1-.1-.1zM7.5 9.8c-.1 0-.1 0-.1.1L7 11.4l.4 1.5c0 .1 0 .1.1.1.1 0 .1 0 .1-.1l.5-1.5-.5-1.5c0-.1 0-.1-.1-.1zm1.6.8c-.1 0-.1 0-.1.1l-.4 1.8.4 1.8c0 .1 0 .1.1.1.1 0 .1 0 .1-.1l.4-1.8-.4-1.8c0-.1 0-.1-.1-.1zm1.7.3c-.1 0-.1.1-.1.1l-.4 2.2.4 2.2c0 .1.1.1.1.1s.1-.1.1-.1l.4-2.2-.4-2.2c0-.1-.1-.1-.1-.1zM2 13.6c0 .1 0 .1.1.1.1 0 .1 0 .1-.1l.2-.9-.2-.9c0-.1 0-.1-.1s-.1 0-.1.1l-.2.9.2.9zm1.1-1.7c-.1 0-.1 0-.1.1l-.3 1.5.3 1.5c0 .1 0 .1.1.1.1 0 .1 0 .1-.1l.3-1.5-.3-1.5c0-.1 0-.1-.1-.1zm1.1.2c-.1 0-.1 0-.1.1l-.3 1.9.3 1.9c0 .1 0 .1.1.1.1 0 .1 0 .1-.1l.3-1.9-.3-1.9c0-.1 0-.1-.1-.1zM.9 13.7c0 .1 0 .1.1.1s.1 0 .1-.1l.2-1-.2-1c0-.1 0-.1-.1-.1s-.1 0-.1.1l-.2 1 .2 1z"
                        )
                    .flex-1
                      .text-sm.font-medium.text-gray-900 SoundCloud
                      .text-xs.text-gray-500.truncate {{ profile.soundcloud }}
                    // Add visibility toggle for SoundCloud
                    button(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('soundcloud')"
                      class="p-2 rounded-full hover:bg-[#FF3300]/10 transition-colors"
                      :title="profile.visibility?.soundcloud ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.soundcloud ? 'visibility' : 'visibility_off'"
                        size="18px"
                        class="text-[#FF3300]"
                      )

                  //- YouTube Music
                  a(
                    v-if="profile.youtubeMusic && (isOwner || profile.visibility?.youtubeMusic)"
                    :href="formatSocialLink(profile.youtubeMusic, 'youtubeMusic')"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#FF0000]/10 transition-all duration-300 w-full"
                  )
                    .flex.items-center.justify-center.w-12.h-12.rounded-xl(class="bg-[#FF0000]/10 group-hover:scale-110 transition-transform duration-300")
                      svg.w-6.h-6(class="text-[#FF0000]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(
                          fill="currentColor"
                          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                        )
                    .flex-1
                      .text-sm.font-medium.text-gray-900 YouTube Music
                      .text-xs.text-gray-500.truncate {{ profile.youtubeMusic }}
                    // Add visibility toggle for YouTube Music
                    button(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('youtubeMusic')"
                      class="p-2 rounded-full hover:bg-[#FF0000]/10 transition-colors"
                      :title="profile.visibility?.youtubeMusic ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.youtubeMusic ? 'visibility' : 'visibility_off'"
                        size="18px"
                        class="text-[#FF0000]"
                      )

                  //- Apple Music
                  a(
                    v-if="profile.appleMusic && (isOwner || profile.visibility?.appleMusic)"
                    :href="formatSocialLink(profile.appleMusic, 'appleMusic')"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-black/5 transition-all duration-300 w-full"
                  )
                    .flex.items-center.justify-center.w-12.h-12.rounded-xl(class="bg-black/5 group-hover:scale-110 transition-transform duration-300")
                      svg.w-6.h-6(class="text-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24")
                        path(
                          fill="currentColor"
                          d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 011.038-2.022c.323-.16.67-.25 1.018-.324.378-.082.758-.153 1.134-.24.274-.063.457-.23.51-.516a.904.904 0 00.02-.193c0-1.815 0-3.63-.002-5.443a.725.725 0 00-.026-.185c-.04-.15-.15-.243-.304-.234-.16.01-.318.035-.475.066-.76.15-1.52.303-2.28.456l-2.325.47-1.374.278c-.016.003-.032.01-.048.013-.277.077-.377.203-.39.49-.002.042 0 .086 0 .13-.002 2.602 0 5.204-.003 7.805 0 .42-.047.836-.215 1.227-.278.64-.77 1.04-1.434 1.233-.35.1-.71.16-1.075.172-.96.036-1.755-.6-1.92-1.544-.14-.812.23-1.685 1.154-2.075.357-.15.73-.232 1.108-.31.287-.06.575-.116.86-.177.383-.083.583-.323.6-.714v-.15c0-2.96 0-5.922.002-8.882 0-.123.013-.25.042-.37.07-.285.273-.448.546-.518.255-.066.515-.112.774-.165.733-.15 1.466-.296 2.2-.444l2.27-.46c.67-.134 1.34-.27 2.01-.403.22-.043.443-.088.664-.106.31-.025.523.17.554.482.008.073.012.148.012.223.002 1.91.002 3.822 0 5.732z"
                        )
                    .flex-1
                      .text-sm.font-medium.text-gray-900 Apple Music
                      .text-xs.text-gray-500.truncate {{ profile.appleMusic }}
                    // Add visibility toggle for Apple Music
                    button(
                      v-if="isOwner"
                      @click.stop.prevent="toggleVisibility('appleMusic')"
                      class="p-2 rounded-full hover:bg-black/5 transition-colors"
                      :title="profile.visibility?.appleMusic ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="profile.visibility?.appleMusic ? 'visibility' : 'visibility_off'"
                        size="18px"
                        class="text-black"
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