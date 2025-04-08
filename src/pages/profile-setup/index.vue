<route>
meta:
  title: BilloAI - Complete Your Profile
</route>

<template lang="pug">
//- Loading State
.flex.items-center.justify-center.min-h-screen(v-if="loading")
  .loading-spinner

//- Main Content
main.p-8.max-w-2xl.mx-auto(v-else)
  .bg-white.rounded-xl.shadow-lg.p-6
    .text-center.mb-8
      h1.text-3xl.font-bold.text-emerald-600 {{ isEditing ? 'Edit Profile' : 'Complete Your Profile' }}
      p.text-gray-600.mt-2 {{ isEditing ? 'Update your information' : "Let's get to know you better" }}
    
    //- Error Message (if any)
    .bg-red-50.text-red-600.p-4.rounded-lg.mb-6(v-if="error")
      .flex.items-center.gap-2
        VaIcon(name="error" size="20px")
        span {{ error }}
    
    form(@submit.prevent="saveProfile").space-y-6
      //- Hidden file input for icon uploads
      input(
        type="file"
        ref="fileInput"
        class="hidden"
        accept="image/*"
        @change="handleIconUpload"
      )

      // Profile Picture
      .flex.flex-col.items-center.gap-4
        .relative.group
          .w-32.h-32.rounded-full.overflow-hidden.ring-4.ring-emerald-100.shadow-lg
            img(
              :src="profileImage || user?.photoURL || '/default-avatar.png'"
              class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              alt="Profile picture"
            )
          button(
            type="button"
            class="absolute bottom-0 right-0 bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 transition-colors duration-200 shadow-lg transform translate-y-0 group-hover:-translate-y-1"
            @click="$refs.imageInput.click()"
          )
            VaIcon(name="camera_alt" size="20px")
          input(
            type="file"
            ref="imageInput"
            class="hidden"
            accept="image/*"
            @change="handleImageSelect"
          )
        p.text-sm.text-gray-500 Upload a profile picture (optional)
        //- Preview of uploaded image
        .mt-2.text-sm.text-gray-500(v-if="imageError")
          span.text-red-500 {{ imageError }}

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
        .flex.items-center.gap-2.justify-between
          .flex.items-center.gap-2
            .w-5.h-5.flex.items-center.justify-center
              VaIcon(name="business" size="20px" class="text-gray-700")
            label.block.text-sm.font-medium.text-gray-700
              | Company
              span.text-gray-500.text-sm.ml-1 (optional)
          button(
            @click="toggleVisibility('company')"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            :title="formData.visibility.company ? 'Hide from public' : 'Show to public'"
          )
            VaIcon(
              :name="formData.visibility.company ? 'visibility' : 'visibility_off'"
              size="20px"
              class="text-gray-600"
            )
        input(
          type="text"
          v-model="formData.company"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        )

      // Title
      .space-y-2
        .flex.items-center.gap-2.justify-between
          .flex.items-center.gap-2
            .w-5.h-5.flex.items-center.justify-center
              VaIcon(name="work" size="20px" class="text-gray-700")
            label.block.text-sm.font-medium.text-gray-700
              | Job Title
              span.text-gray-500.text-sm.ml-1 (optional)
          button(
            @click="toggleVisibility('title')"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            :title="formData.visibility.title ? 'Hide from public' : 'Show to public'"
          )
            VaIcon(
              :name="formData.visibility.title ? 'visibility' : 'visibility_off'"
              size="20px"
              class="text-gray-600"
            )
        input(
          type="text"
          v-model="formData.title"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        )

      // Phone Number
      .space-y-2
        .flex.items-center.gap-2.justify-between
          .flex.items-center.gap-2
            .w-5.h-5.flex.items-center.justify-center
              VaIcon(name="phone" size="20px" class="text-gray-700")
            label.block.text-sm.font-medium.text-gray-700
              | Phone Number
              span.text-gray-500.text-sm.ml-1 (optional)
          button(
            @click="toggleVisibility('phone')"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            :title="formData.visibility.phone ? 'Hide from public' : 'Show to public'"
          )
            VaIcon(
              :name="formData.visibility.phone ? 'visibility' : 'visibility_off'"
              size="20px"
              class="text-gray-600"
            )
        input(
          type="tel"
          v-model="formData.phone"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="+1 (555) 555-5555"
        )

      // Bio
      .space-y-2
        .flex.items-center.gap-2.justify-between
          .flex.items-center.gap-2
            .w-5.h-5.flex.items-center.justify-center
              VaIcon(name="description" size="20px" class="text-gray-700")
            label.block.text-sm.font-medium.text-gray-700
              | Bio
              span.text-gray-500.text-sm.ml-1 (optional)
          button(
            @click="toggleVisibility('bio')"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            :title="formData.visibility.bio ? 'Hide from public' : 'Show to public'"
          )
            VaIcon(
              :name="formData.visibility.bio ? 'visibility' : 'visibility_off'"
              size="20px"
              class="text-gray-600"
            )
        textarea(
          v-model="formData.bio"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px] resize-y"
          placeholder="Tell us about yourself..."
        )

      // Address
      .space-y-4
        .flex.items-center.gap-2.justify-between
          .flex.items-center.gap-2
            .w-5.h-5.flex.items-center.justify-center
              VaIcon(name="location_on" size="20px" class="text-gray-700")
            label.block.text-sm.font-medium.text-gray-700
              | Address
              span.text-gray-500.text-sm.ml-1 (optional)
          button(
            @click="toggleVisibility('address')"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            :title="formData.visibility.address ? 'Hide from public' : 'Show to public'"
          )
            VaIcon(
              :name="formData.visibility.address ? 'visibility' : 'visibility_off'"
              size="20px"
              class="text-gray-600"
            )
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

      // Social Media & Music Platforms
      .space-y-4.mt-8.pt-8.border-t.border-gray-100
        .flex.items-center.gap-2.mb-4
          .w-5.h-5.flex.items-center.justify-center
            svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
              path(fill="currentColor" d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0014.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z")
          label.block.text-lg.font-medium.text-gray-900 Social Media & Music
        p.text-sm.text-gray-500.mb-4.px-1 Add your social media profiles and music platform links

        // Social Media Links
        .space-y-4
          // LinkedIn
          .space-y-2
            .flex.items-center.gap-2.justify-between
              .flex.items-center.gap-2
                .w-5.h-5.flex.items-center.justify-center
                  svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                    path(fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z")
                label.block.text-sm.font-medium.text-gray-700 LinkedIn
                  span.text-gray-500.text-sm.ml-1 (optional)
              button(
                @click="toggleVisibility('linkedin')"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                :title="formData.visibility.linkedin ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="formData.visibility.linkedin ? 'visibility' : 'visibility_off'"
                  size="20px"
                  class="text-gray-600"
                )
            input(
              type="url"
              v-model="formData.linkedin"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
              placeholder="linkedin.com/in/username"
            )

          // TikTok
          .space-y-2
            .flex.items-center.gap-2.justify-between
              .flex.items-center.gap-2
                .w-5.h-5.flex.items-center.justify-center
                  svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                    path(
                      fill="currentColor"
                      d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.228 6.228 0 0 1-1.138-1.009 6.268 6.268 0 0 1-1.362-2.638h.004C16.326.924 16.322.5 16.322.5h-3.217v15.093c0 .42-.003 1.685-.987 2.621-.616.585-1.417.875-2.369.875-2.362 0-3.571-2.017-3.571-3.938 0-1.967 1.268-3.865 3.479-3.865.365 0 .758.05 1.137.153v-3.325c-.375-.055-.752-.082-1.127-.083-2.358 0-4.125.871-5.261 2.355C3.18 11.668 2.6 13.397 2.6 15.129c0 1.719.574 3.336 1.617 4.552 1.276 1.487 3.093 2.319 5.11 2.319 1.815 0 3.505-.647 4.769-1.822 1.369-1.271 2.127-3.033 2.127-4.951V8.456c1.123.778 2.434 1.193 3.778 1.193V6.5c-.006 0-1.11.052-1.68-.938z"
                    )
                label.block.text-sm.font-medium.text-gray-700 TikTok
                  span.text-gray-500.text-sm.ml-1 (optional)
              button(
                @click="toggleVisibility('tiktok')"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                :title="formData.visibility.tiktok ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="formData.visibility.tiktok ? 'visibility' : 'visibility_off'"
                  size="20px"
                  class="text-gray-600"
                )
            input(
              type="url"
              v-model="formData.tiktok"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="tiktok.com/@username"
            )

          // Twitter/X
          .space-y-2
            .flex.items-center.gap-2.justify-between
              .flex.items-center.gap-2
                .w-5.h-5.flex.items-center.justify-center
                  svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                    path(fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z")
                label.block.text-sm.font-medium.text-gray-700 Twitter/X
                  span.text-gray-500.text-sm.ml-1 (optional)
              button(
                @click="toggleVisibility('twitter')"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                :title="formData.visibility.twitter ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="formData.visibility.twitter ? 'visibility' : 'visibility_off'"
                  size="20px"
                  class="text-gray-600"
                )
            input(
              type="url"
              v-model="formData.twitter"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="twitter.com/username"
            )

          // Instagram
          .space-y-2
            .flex.items-center.gap-2.justify-between
              .flex.items-center.gap-2
                .w-5.h-5.flex.items-center.justify-center
                  svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                    path(fill="#E4405F" d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.256 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z")
                label.block.text-sm.font-medium.text-gray-700 Instagram
                  span.text-gray-500.text-sm.ml-1 (optional)
              button(
                @click="toggleVisibility('instagram')"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                :title="formData.visibility.instagram ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="formData.visibility.instagram ? 'visibility' : 'visibility_off'"
                  size="20px"
                  class="text-gray-600"
                )
            input(
              type="url"
              v-model="formData.instagram"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E4405F] focus:border-transparent"
              placeholder="instagram.com/username"
            )

          // Facebook
          .space-y-2
            .flex.items-center.gap-2.justify-between
              .flex.items-center.gap-2
                .w-5.h-5.flex.items-center.justify-center
                  svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                    path(fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z")
                label.block.text-sm.font-medium.text-gray-700 Facebook
                  span.text-gray-500.text-sm.ml-1 (optional)
              button(
                @click="toggleVisibility('facebook')"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                :title="formData.visibility.facebook ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="formData.visibility.facebook ? 'visibility' : 'visibility_off'"
                  size="20px"
                  class="text-gray-600"
                )
            input(
              type="url"
              v-model="formData.facebook"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
              placeholder="facebook.com/username"
            )

          // GitHub
          .space-y-2
            .flex.items-center.gap-2.justify-between
              .flex.items-center.gap-2
                .w-5.h-5.flex.items-center.justify-center
                  svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                    path(fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.022A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.291 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z")
                label.block.text-sm.font-medium.text-gray-700 GitHub
                  span.text-gray-500.text-sm.ml-1 (optional)
              button(
                @click="toggleVisibility('github')"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                :title="formData.visibility.github ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="formData.visibility.github ? 'visibility' : 'visibility_off'"
                  size="20px"
                  class="text-gray-600"
                )
            input(
              type="url"
              v-model="formData.github"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="github.com/username"
            )

          // Other Link
          .space-y-2
            .flex.items-center.gap-2.justify-between
              .flex.items-center.gap-2
                .w-5.h-5.flex.items-center.justify-center
                  VaIcon(name="link" size="20px" class="text-gray-700")
                label.block.text-sm.font-medium.text-gray-700 Other Link
                  span.text-gray-500.text-sm.ml-1 (optional)
              button(
                @click="toggleVisibility('otherLink')"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                :title="formData.visibility.otherLink ? 'Hide from public' : 'Show to public'"
              )
                VaIcon(
                  :name="formData.visibility.otherLink ? 'visibility' : 'visibility_off'"
                  size="20px"
                  class="text-gray-600"
                )
            input(
              type="url"
              v-model="formData.otherLink"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="https://example.com"
            )

          // Custom Links Section (Premium Only)
          .space-y-4.mt-8.pt-8.border-t.border-gray-100(v-if="isPremium")
            .flex.items-center.justify-between.mb-4
              .flex.items-center.gap-2
                VaIcon(name="add_link" size="24px" class="text-emerald-600")
                h3.text-lg.font-medium.text-gray-900 Custom Links
              button(
                type="button"
                @click="addCustomLink"
                class="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors duration-200 flex items-center gap-2"
              )
                VaIcon(name="add" size="20px")
                span Add Link

            // Custom Links List
            .space-y-4
              .custom-link-item.bg-gray-50.rounded-xl.p-4.space-y-4(
                v-for="(link, index) in formData.customLinks"
                :key="index"
              )
                // Link Header with Remove Button
                .flex.items-center.justify-between
                  h4.text-sm.font-medium.text-gray-700 Custom Link {{ index + 1 }}
                  .flex.items-center.gap-2
                    button(
                      @click="toggleCustomLinkVisibility(index)"
                      class="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      :title="getCustomLinkVisibility(index) ? 'Hide from public' : 'Show to public'"
                    )
                      VaIcon(
                        :name="getCustomLinkVisibility(index) ? 'visibility' : 'visibility_off'"
                        size="18px"
                        class="text-gray-600"
                      )
                    button(
                      @click="removeCustomLink(index)"
                      class="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                    )
                      VaIcon(name="delete" size="18px")

                // Link Fields
                .space-y-3
                  // Link Name
                  input(
                    v-model="link.name"
                    type="text"
                    class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Link Name (e.g. Portfolio, Blog)"
                  )
                  // URL
                  input(
                    v-model="link.url"
                    type="url"
                    class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="https://example.com"
                  )
                  // Icon Selection
                  .flex.items-center.gap-4
                    // Icon Preview
                    .w-12.h-12.rounded-xl.bg-white.border.border-gray-200.flex.items-center.justify-center.overflow-hidden.relative
                      .absolute.inset-0.flex.items-center.justify-center.bg-black.bg-opacity-50.transition-opacity(
                        v-if="saving && currentUploadIndex === index"
                        class="opacity-100"
                      )
                        .loading-spinner.w-6.h-6.border-2.border-white
                      img(
                        v-if="link.iconUrl || link.previewUrl"
                        :src="link.previewUrl || link.iconUrl"
                        class="w-6 h-6 object-contain"
                        alt="Link icon"
                      )
                      VaIcon(
                        v-else
                        name="link"
                        size="24px"
                        class="text-gray-400"
                      )
                    // Icon Upload Button
                    button(
                      type="button"
                      @click="() => openIconUpload(index)"
                      class="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="saving && currentUploadIndex === index"
                    )
                      template(v-if="saving && currentUploadIndex === index")
                        .loading-spinner.w-4.h-4.border-2.border-emerald-500
                        span.text-sm.text-gray-700 Uploading...
                      template(v-else)
                        VaIcon(name="upload" size="20px" class="text-gray-600")
                        span.text-sm.text-gray-700 {{ link.iconUrl ? 'Change Icon' : 'Upload Icon' }}

      // Required fields note
      .text-sm.text-gray-500.mb-6
        span.text-red-500 * 
        | Required fields

      // Submit Button Container
      .flex.justify-center.w-full.mt-8
        button(
          type="submit"
          class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3.5 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] font-medium text-base"
          :disabled="saving"
        )
          VaIcon(name="check" size="22px")
          span {{ saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Complete Profile') }}
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authService } from '../../services/authService';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { businessCardService } from '../../services/businessCardService';
import { paymentService } from '../../services/paymentService';
import { useStore } from 'vuex';

const router = useRouter();
const route = useRoute();
const store = useStore();
const storage = getStorage();
const user = ref(null);
const error = ref('');
const saving = ref(false);
const loading = ref(true);
const imageInput = ref(null);
const profileImage = ref(null);
const isEditing = ref(false);
const fileInput = ref(null);
let currentUploadIndex = -1;
const isPremium = ref(false);
const showQR = ref(false);
const copiedLink = ref(false);
const imageError = ref('');
const imageFile = ref(null);

const formData = ref({
  displayName: '',
  title: '',
  company: '',
  bio: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  linkedin: '',
  github: '',
  twitter: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  spotify: '',
  soundcloud: '',
  youtubeMusic: '',
  appleMusic: '',
  otherLink: '',
  customLinks: [],
  visibility: {
    nameTitle: true,
    company: true,
    title: true,
    bio: true,
    email: true,
    phone: true,
    address: true,
    linkedin: true,
    github: true,
    twitter: true,
    instagram: true,
    facebook: true,
    tiktok: true,
    spotify: true,
    soundcloud: true,
    youtubeMusic: true,
    appleMusic: true,
    otherLink: true,
    customLinks: {}
  }
});

function getCompanyFromEmail(email) {
  if (!email) return '';
  
  const domain = email.split('@')[1];
  if (!domain) return '';
  
  const commonProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'aol.com', 'mail.com', 'protonmail.com',
    'zoho.com', 'yandex.com', 'live.com', 'msn.com'
  ];
  
  if (commonProviders.includes(domain.toLowerCase())) return '';
  
  return domain
    .split('.')[0]
    .split(/[-_]/)
    .map(word => {
      word = word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

function getNameFromEmail(email) {
  if (!email) return '';
  
  const localPart = email.split('@')[0];
  
  return localPart
    .split(/[._-]/)
    .map(word => {
      word = word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

function openIconUpload(index) {
  currentUploadIndex = index;
  fileInput.value.click();
}

async function handleIconUpload(event) {
  if (currentUploadIndex === -1) return;
  
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    // Reset any previous errors
    error.value = '';

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      error.value = 'Please upload a valid image file (JPEG, PNG, GIF, or SVG)';
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      error.value = 'Image size should be less than 2MB';
      return;
    }

    // Show loading state
    saving.value = true;

    // Create a unique filename with timestamp and sanitized name
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `custom-icons/${user.value.uid}/${timestamp}-${sanitizedName}`;
    
    // Create storage reference
    const iconRef = storageRef(storage, filename);
    
    // Upload the file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: user.value.uid,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };

    // Upload file
    const uploadTask = await uploadBytes(iconRef, file, metadata);
    console.log('Icon uploaded successfully:', uploadTask.ref.fullPath);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(uploadTask.ref);
    console.log('Icon download URL:', downloadURL);
    
    // Update the custom link's icon URL
    formData.value.customLinks[currentUploadIndex].iconUrl = downloadURL;
    
    // Reset the file input
    event.target.value = '';

    // Show success message
    const successMessage = 'Icon uploaded successfully!';
    console.log(successMessage);

  } catch (err) {
    console.error('Error uploading icon:', err);
    error.value = err.message || 'Failed to upload icon';
  } finally {
    saving.value = false;
    currentUploadIndex = -1;
  }
}

// Add this function to preview the icon before upload
function previewIcon(event, index) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      error.value = 'Please upload a valid image file (JPEG, PNG, GIF, or SVG)';
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (formData.value.customLinks[index]) {
        formData.value.customLinks[index].previewUrl = e.target.result;
      }
    };
    reader.readAsDataURL(file);

  } catch (err) {
    console.error('Error creating preview:', err);
    error.value = 'Error creating preview';
  }
}

onMounted(async () => {
  try {
    loading.value = true;
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push('/home');
      return;
    }

    user.value = currentUser;
    console.log('Current user:', currentUser);
    
    // Check premium status first
    await checkPremiumStatus();
    console.log('Premium status after check:', isPremium.value);
    
    // Check if we're editing or completing profile
    const userProfile = await authService.getUserProfile();
    isEditing.value = !!userProfile?.profileCompleted;

    // Initialize formData with default values
    formData.value = {
      displayName: '',
      title: '',
      company: '',
      bio: '',
      email: currentUser.email,
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      linkedin: '',
      github: '',
      twitter: '',
      instagram: '',
      facebook: '',
      tiktok: '',
      spotify: '',
      soundcloud: '',
      youtubeMusic: '',
      appleMusic: '',
      otherLink: '',
      customLinks: [],
      visibility: {
        nameTitle: true,
        company: true,
        title: true,
        bio: true,
        email: true,
        phone: true,
        address: true,
        linkedin: true,
        github: true,
        twitter: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        spotify: true,
        soundcloud: true,
        youtubeMusic: true,
        appleMusic: true,
        otherLink: true,
        customLinks: {}
      }
    };

    if (isEditing.value && userProfile) {
      // Merge existing profile data with default values
      formData.value = {
        ...formData.value,
        ...userProfile,
        email: currentUser.email,
        displayName: currentUser.displayName || userProfile.displayName || getNameFromEmail(currentUser.email),
        customLinks: userProfile.customLinks || [],
        visibility: {
          ...formData.value.visibility,
          ...userProfile.visibility
        }
      };
    } else {
      // Set suggested values for new profile
      const suggestedCompany = getCompanyFromEmail(currentUser.email);
      const suggestedName = currentUser.displayName || getNameFromEmail(currentUser.email);
      
      formData.value.displayName = suggestedName;
      formData.value.company = suggestedCompany;
    }
  } catch (err) {
    console.error('Error loading profile:', err);
    error.value = 'Error loading profile data';
  } finally {
    loading.value = false;
  }
});

async function handleImageSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    // Reset error
    imageError.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      imageError.value = 'Please select an image file';
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      imageError.value = 'Image size should be less than 5MB';
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      profileImage.value = e.target.result;
    };
    reader.readAsDataURL(file);

    // Store the file for later upload
    imageFile.value = file;
  } catch (err) {
    console.error('Error processing image:', err);
    imageError.value = 'Error processing image';
  } finally {
    // Reset input
    event.target.value = '';
  }
}

async function saveProfile() {
  try {
    saving.value = true;
    error.value = '';

    // Validate required fields
    if (!formData.value.displayName?.trim()) {
      error.value = 'Full Name is required';
      return;
    }

    // Upload profile image if selected
    let photoURL = user.value.photoURL;
    if (imageFile.value) {
      const filename = `profile-images/${user.value.uid}/${Date.now()}-${imageFile.value.name}`;
      const imageRef = storageRef(storage, filename);
      await uploadBytes(imageRef, imageFile.value);
      photoURL = await getDownloadURL(imageRef);
    }

    // Update user profile in Firebase Auth
    await authService.updateProfile({
      displayName: formData.value.displayName.trim(),
      photoURL: photoURL || ''
    });

    // Prepare profile data for Firestore, ensuring no undefined values
    const profileData = {
      displayName: formData.value.displayName.trim(),
      company: formData.value.company?.trim() || '',
      title: formData.value.title?.trim() || '',
      phone: formData.value.phone?.trim() || '',
      bio: formData.value.bio?.trim() || '',
      addressLine1: formData.value.addressLine1?.trim() || '',
      addressLine2: formData.value.addressLine2?.trim() || '',
      city: formData.value.city?.trim() || '',
      state: formData.value.state?.trim() || '',
      zipCode: formData.value.zipCode?.trim() || '',
      linkedin: formData.value.linkedin?.trim() || '',
      twitter: formData.value.twitter?.trim() || '',
      instagram: formData.value.instagram?.trim() || '',
      facebook: formData.value.facebook?.trim() || '',
      tiktok: formData.value.tiktok?.trim() || '',
      spotify: formData.value.spotify?.trim() || '',
      soundcloud: formData.value.soundcloud?.trim() || '',
      youtubeMusic: formData.value.youtubeMusic?.trim() || '',
      appleMusic: formData.value.appleMusic?.trim() || '',
      otherLink: formData.value.otherLink?.trim() || '',
      customLinks: formData.value.customLinks,
      photoURL: photoURL || '',
      profileCompleted: true,
      updatedAt: new Date(),
      github: formData.value.github?.trim() || '',
      visibility: {
        ...formData.value.visibility,
        customLinks: formData.value.visibility.customLinks
      }
    };

    // Save to Firestore
    await authService.saveUserProfile(profileData);

    // Redirect to home page
    router.push('/home');
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
    copiedLink.value = true;
    setTimeout(() => {
      copiedLink.value = false;
    }, 2000);
  } catch (err) {
    console.error('Error copying URL:', err);
  }
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
    const status = await paymentService.getSubscriptionStatus();
    console.log('Premium status response:', status); // Debug log
    isPremium.value = status.plan === 'PRO' || status.plan === 'BASIC';
    console.log('isPremium set to:', isPremium.value); // Debug log
  } catch (err) {
    console.error('Error checking premium status:', err);
    isPremium.value = false;
  }
}

function handleDownloadQRCode() {
  // Implementation of downloadQRCode function
}

function handleDownloadBusinessCard() {
  // Implementation of downloadBusinessCard function
}

// Function to ensure URL starts with http:// or https://
function formatUrl(url) {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    return 'http://' + url;
  }
  return url;
}

// Apply formatUrl to all URL fields before saving
formData.value.linkedin = formatUrl(formData.value.linkedin?.trim() || '');
formData.value.twitter = formatUrl(formData.value.twitter?.trim() || '');
formData.value.instagram = formatUrl(formData.value.instagram?.trim() || '');
formData.value.facebook = formatUrl(formData.value.facebook?.trim() || '');
formData.value.spotify = formatUrl(formData.value.spotify?.trim() || '');
formData.value.soundcloud = formatUrl(formData.value.soundcloud?.trim() || '');
formData.value.youtubeMusic = formatUrl(formData.value.youtubeMusic?.trim() || '');
formData.value.appleMusic = formatUrl(formData.value.appleMusic?.trim() || '');
formData.value.otherLink = formatUrl(formData.value.otherLink?.trim() || '');

function toggleVisibility(field) {
  formData.value.visibility[field] = !formData.value.visibility[field];
}

function addCustomLink() {
  if (!Array.isArray(formData.value.customLinks)) {
    formData.value.customLinks = [];
  }
  if (!formData.value.visibility.customLinks) {
    formData.value.visibility.customLinks = {};
  }
  
  const newLink = {
    name: '',
    url: '',
    iconUrl: '',
    visibility: true
  };
  
  formData.value.customLinks.push(newLink);
  const newIndex = formData.value.customLinks.length - 1;
  formData.value.visibility.customLinks[newIndex] = true;
}

function removeCustomLink(index) {
  if (!Array.isArray(formData.value.customLinks)) return;
  
  formData.value.customLinks = formData.value.customLinks.filter((_, i) => i !== index);
  
  // Reorder visibility settings
  const newCustomLinksVisibility = {};
  formData.value.customLinks.forEach((_, i) => {
    newCustomLinksVisibility[i] = true;
  });
  formData.value.visibility.customLinks = newCustomLinksVisibility;
}

function getCustomLinkVisibility(index) {
  if (!formData.value.visibility.customLinks) {
    formData.value.visibility.customLinks = {};
  }
  return formData.value.visibility.customLinks[index] !== false;
}

function toggleCustomLinkVisibility(index) {
  if (!formData.value.visibility.customLinks) {
    formData.value.visibility.customLinks = {};
  }
  formData.value.visibility.customLinks[index] = !getCustomLinkVisibility(index);
}
</script>

<style scoped>
.loading-spinner {
  animation: spin 1s linear infinite;
  border-top-color: transparent;
  border-left-color: transparent;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 