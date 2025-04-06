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

      // Bio
      .space-y-2
        label.block.text-sm.font-medium.text-gray-700
          | Bio
          span.text-gray-500.text-sm.ml-1 (optional)
        textarea(
          v-model="formData.bio"
          class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px] resize-y"
          placeholder="Tell us about yourself..."
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
            .flex.items-center.gap-2
              .w-5.h-5.flex.items-center.justify-center
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                  path(fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z")
              label.block.text-sm.font-medium.text-gray-700 LinkedIn
                span.text-gray-500.text-sm.ml-1 (optional)
            input(
              type="url"
              v-model="formData.linkedin"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
              placeholder="linkedin.com/in/username"
            )

          // Twitter/X
          .space-y-2
            .flex.items-center.gap-2
              .w-5.h-5.flex.items-center.justify-center
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                  path(fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z")
              label.block.text-sm.font-medium.text-gray-700 Twitter/X
                span.text-gray-500.text-sm.ml-1 (optional)
            input(
              type="url"
              v-model="formData.twitter"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="twitter.com/username"
            )

          // Instagram
          .space-y-2
            .flex.items-center.gap-2
              .w-5.h-5.flex.items-center.justify-center
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                  path(fill="#E4405F" d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z")
              label.block.text-sm.font-medium.text-gray-700 Instagram
                span.text-gray-500.text-sm.ml-1 (optional)
            input(
              type="url"
              v-model="formData.instagram"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E4405F] focus:border-transparent"
              placeholder="instagram.com/username"
            )

          // Facebook
          .space-y-2
            .flex.items-center.gap-2
              .w-5.h-5.flex.items-center.justify-center
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                  path(fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z")
              label.block.text-sm.font-medium.text-gray-700 Facebook
                span.text-gray-500.text-sm.ml-1 (optional)
            input(
              type="url"
              v-model="formData.facebook"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
              placeholder="facebook.com/username"
            )

          // Other Link
          .space-y-2
            .flex.items-center.gap-2
              .w-5.h-5.flex.items-center.justify-center
                VaIcon(name="link" size="20px" class="text-gray-700")
              label.block.text-sm.font-medium.text-gray-700 Other Link
                span.text-gray-500.text-sm.ml-1 (optional)
            input(
              type="url"
              v-model="formData.otherLink"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="https://example.com"
            )

        // Music Platforms
        .space-y-4.mt-8
          .flex.items-center.gap-2.mb-4
            .w-5.h-5.flex.items-center.justify-center
              svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                path(fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z")
              label.block.text-lg.font-medium.text-gray-900 Music Platforms

          // Spotify
          .space-y-2
            .flex.items-center.gap-2
              .w-5.h-5.flex.items-center.justify-center
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                  path(fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z")
              label.block.text-sm.font-medium.text-gray-700 Spotify
                span.text-gray-500.text-sm.ml-1 (optional)
            input(
              type="url"
              v-model="formData.spotify"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
              placeholder="open.spotify.com/artist/..."
            )

          // SoundCloud
          .space-y-2
            .flex.items-center.gap-2
              .w-5.h-5.flex.items-center.justify-center
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                  path(fill="#FF3300" d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c0 .055.045.094.09.094s.089-.045.104-.104l.21-1.319-.21-1.334c0-.061-.044-.093-.09-.093m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.119.12.061 0 .105-.061.121-.12l.254-2.474-.254-2.548c-.016-.06-.061-.12-.121-.12m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.15.138.074 0 .135-.061.15-.15l.24-2.532-.24-2.623c0-.075-.06-.135-.135-.135l-.031-.017zm1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.217 2.43.2 2.563c0 .09.075.157.159.157.074 0 .148-.068.148-.158l.227-2.563-.227-2.444.033.015zm.809-1.709c-.101 0-.18.09-.18.181l-.21 3.957.187 2.563c0 .09.08.164.18.164.094 0 .174-.09.18-.18l.209-2.563-.209-3.972c-.008-.104-.088-.179-.18-.179m.959-.914c-.105 0-.195.09-.203.194l-.18 4.872.165 2.548c0 .12.09.209.195.209.104 0 .194-.089.21-.209l.193-2.548-.192-4.856c-.016-.12-.105-.21-.21-.21m.989-.449c-.121 0-.211.089-.225.209l-.165 5.275.165 2.52c0 .119.104.225.225.225.119 0 .225-.105.225-.225l.195-2.52-.196-5.275c0-.12-.105-.225-.225-.225m1.245.045c0-.135-.105-.24-.24-.24-.119 0-.24.105-.24.24l-.149 5.441.149 2.503c.016.135.121.24.256.24.074 0 .15-.03.195-.09.045-.06.074-.135.074-.21l.135-2.474-.135-5.461-.135.03zm.404-1.366c-.135-.016-.255.105-.255.24l-.15 6.576.135 2.459c0 .15.135.255.285.255.149 0 .255-.12.284-.271l.121-2.428-.135-6.576c-.016-.135-.121-.24-.27-.24l-.016-.015zm.676-1.441c-.165 0-.284.135-.284.285l-.103 8.006.135 2.444c0 .165.119.3.284.3.149 0 .284-.15.284-.3l.15-2.459-.15-8.006c0-.15-.15-.285-.3-.285l-.016.015zm.827-.381c-.18 0-.314.159-.314.315l-.091 8.341.119 2.431c.016.18.15.314.314.314.18 0 .314-.149.33-.329l.15-2.414-.15-8.339c-.016-.179-.165-.314-.329-.314l-.029-.006zm1.289.226c-.195 0-.349.165-.349.375l-.09 8.156.105 2.416c0 .21.165.375.369.375.189 0 .349-.165.369-.375l.094-2.416-.094-8.156c0-.21-.179-.375-.369-.375l-.035-.015zm.75-.811c-.21 0-.379.18-.379.39l-.075 8.937.06 2.403c0 .21.194.375.404.375.21 0 .375-.166.39-.391l.074-2.403-.074-8.891c-.016-.21-.18-.404-.404-.404l.004-.015zm.83-.022c-.225 0-.405.195-.405.405l-.061 8.554.061 2.386c0 .225.194.405.405.405.42 0 .405-.195.42-.42l.075-2.371-.075-8.554c0-.21-.21-.405-.42-.405zm1.155.46c-.232 0-.42.21-.42.405l-.045 8.101.045 2.355c0 .225.195.435.42.435.227 0 .42-.21.42-.435l.061-2.355-.061-8.101c0-.225-.193-.405-.42-.405zm.714-1.146c-.247 0-.435.21-.435.436l-.029 9.211.029 2.343c0 .24.194.435.435.435.239 0 .435-.195.449-.435l.046-2.343-.046-9.211c-.014-.226-.209-.436-.449-.449m.975-.049c-.242 0-.449.225-.449.45l-.03 9.246.03 2.328c0 .255.207.456.449.456.24 0 .449-.225.464-.48l.029-2.304-.029-9.225c0-.254-.21-.449-.464-.449m1.005.105c-.255 0-.464.24-.464.48l-.016 9.201.016 2.31c0 .27.224.465.464.465.255 0 .465-.21.479-.48l.016-2.295-.016-9.196c-.015-.255-.224-.48-.479-.48z")
              label.block.text-sm.font-medium.text-gray-700 SoundCloud
                span.text-gray-500.text-sm.ml-1 (optional)
            input(
              type="url"
              v-model="formData.soundcloud"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF3300] focus:border-transparent"
              placeholder="soundcloud.com/username"
            )

          // YouTube Music
          .space-y-2
            .flex.items-center.gap-2
              .w-5.h-5.flex.items-center.justify-center
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                  path(fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z")
              label.block.text-sm.font-medium.text-gray-700 YouTube Music
                span.text-gray-500.text-sm.ml-1 (optional)
            input(
              type="url"
              v-model="formData.youtubeMusic"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
              placeholder="music.youtube.com/channel/..."
            )

          // Apple Music
          .space-y-2
            .flex.items-center.gap-2
              .w-5.h-5.flex.items-center.justify-center
                svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5")
                  path(fill="currentColor" d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 011.038-2.022c.323-.16.67-.25 1.018-.324.378-.082.758-.153 1.134-.24.274-.063.457-.23.51-.516a.904.904 0 00.02-.193c0-1.815 0-3.63-.002-5.443a.725.725 0 00-.026-.185c-.04-.15-.15-.243-.304-.234-.16.01-.318.035-.475.066-.76.15-1.52.303-2.28.456l-2.325.47-1.374.278c-.016.003-.032.01-.048.013-.277.077-.377.203-.39.49-.002.042 0 .086 0 .13-.002 2.602 0 5.204-.003 7.805 0 .42-.047.836-.215 1.227-.278.64-.77 1.04-1.434 1.233-.35.1-.71.16-1.075.172-.96.036-1.755-.6-1.92-1.544-.14-.812.23-1.685 1.154-2.075.357-.15.73-.232 1.108-.31.287-.06.575-.116.86-.177.383-.083.583-.323.6-.714v-.15c0-2.96 0-5.922.002-8.882 0-.123.013-.25.042-.37.07-.285.273-.448.546-.518.255-.066.515-.112.774-.165.733-.15 1.466-.296 2.2-.444l2.27-.46c.67-.134 1.34-.27 2.01-.403.22-.043.443-.088.664-.106.31-.025.523.17.554.482.008.073.012.148.012.223.002 1.91.002 3.822 0 5.732z")
              label.block.text-sm.font-medium.text-gray-700 Apple Music
                span.text-gray-500.text-sm.ml-1 (optional)
            input(
              type="url"
              v-model="formData.appleMusic"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="music.apple.com/artist/..."
            )

      // Required fields note
      .text-sm.text-gray-500.mb-6
        span.text-red-500 * 
        | Required fields

      // Error message
      .text-red-500.text-sm.mb-6(v-if="error") {{ error }}

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
import { storage } from '../../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { businessCardService } from '../../services/businessCardService';
import { paymentService } from '../../services/paymentService';

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
  zipCode: '',
  bio: '',
  linkedin: '',
  twitter: '',
  instagram: '',
  facebook: '',
  spotify: '',
  soundcloud: '',
  youtubeMusic: '',
  appleMusic: '',
  otherLink: '',
  visibility: {
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
    appleMusic: true,
    otherLink: true
  }
});

const isPremium = ref(false);
const showQR = ref(false);
const copiedLink = ref(false);

// Add this function to extract company name from email domain
function getCompanyFromEmail(email) {
  if (!email) return '';
  
  const domain = email.split('@')[1];
  if (!domain) return '';
  
  // Expanded list of common email providers to ignore
  const commonProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'aol.com', 'mail.com', 'protonmail.com',
    'zoho.com', 'yandex.com', 'live.com', 'msn.com'
  ];
  
  if (commonProviders.includes(domain.toLowerCase())) return '';
  
  // Convert domain to company name format
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

// Add this function to extract name from email
function getNameFromEmail(email) {
  if (!email) return '';
  
  const localPart = email.split('@')[0];
  
  // Handle common email formats
  return localPart
    .split(/[._-]/)
    .map(word => {
      // Properly capitalize each word
      word = word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

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

  // Always set email from current user
  formData.value.email = currentUser.email;

  if (isEditing.value) {
    // Load existing profile data but ensure email stays as current user's email
    formData.value = {
      ...userProfile,
      email: currentUser.email, // Always use current email
      displayName: currentUser.displayName || userProfile.displayName || getNameFromEmail(currentUser.email),
    };
  } else {
    // New user setup with pre-filled data from email
    const suggestedCompany = getCompanyFromEmail(currentUser.email);
    const suggestedName = currentUser.displayName || getNameFromEmail(currentUser.email);
    
    formData.value = {
      displayName: suggestedName,
      email: currentUser.email,
      company: suggestedCompany,
      title: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      bio: '',
      linkedin: '',
      twitter: '',
      instagram: '',
      facebook: '',
      spotify: '',
      soundcloud: '',
      youtubeMusic: '',
      appleMusic: '',
      otherLink: '',
      visibility: {
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
        appleMusic: true,
        otherLink: true
      }
    };
  }

  await checkPremiumStatus();
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

    // Validate required fields
    if (!formData.value.displayName?.trim()) {
      error.value = 'Full Name is required';
      return;
    }

    // Upload profile image if selected
    let photoURL = user.value.photoURL;
    if (profileImage.value) {
      const imageFile = await fetch(profileImage.value).then(r => r.blob());
      const imageRef = storageRef(storage, `profile-images/${user.value.uid}`);
      await uploadBytes(imageRef, imageFile);
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
      spotify: formData.value.spotify?.trim() || '',
      soundcloud: formData.value.soundcloud?.trim() || '',
      youtubeMusic: formData.value.youtubeMusic?.trim() || '',
      appleMusic: formData.value.appleMusic?.trim() || '',
      otherLink: formData.value.otherLink?.trim() || '',
      photoURL: photoURL || '',
      profileCompleted: true,
      updatedAt: new Date()
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
    if (!user.value) return false;
    const status = await paymentService.getSubscriptionStatus();
    isPremium.value = status.plan !== 'FREE';
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
</script> 