<route>
meta:
  title: BilloAI - Demo & Tutorial
</route>

<template lang="pug">
main(class="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-emerald-50")
  // Hero Section
  .relative.overflow-hidden.bg-white
    .max-w-7xl.mx-auto.px-4.sm_px-6.lg_px-8.py-16
      .text-center
        h1.text-4xl.font-bold.tracking-tight.text-gray-900.sm_text-5xl.md_text-6xl
          span.block.xl_inline See How 
          span.block.text-emerald-600.xl_inline BilloAI Works
        p.mt-3.max-w-md.mx-auto.text-base.text-gray-500.sm_text-lg.md_text-xl.md_mt-5.md_max-w-3xl
          | Transform your business card management and networking experience with our intelligent AI-powered platform.

  // Main Content
  .max-w-7xl.mx-auto.px-4.sm_px-6.lg_px-8.py-12
    // Quick Start Video
    .mb-16
      h2.text-3xl.font-bold.text-gray-900.mb-8 Quick Start Guide
      .aspect-w-16.aspect-h-9.rounded-2xl.overflow-hidden.shadow-xl.border.border-gray-100
        iframe(
          src="https://www.youtube.com/embed/your-video-id"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        )

    // Key Features
    .mb-16
      h2.text-3xl.font-bold.text-gray-900.mb-8 Key Features
      .grid.gap-8(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
        // Feature Card 1
        .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-6.transition-all.duration-300.hover_shadow-xl
          .flex.items-center.gap-4.mb-4
            .bg-emerald-100.p-3.rounded-xl
              VaIcon(name="qr_code_scanner" size="24px" class="text-emerald-600")
            h3.text-xl.font-bold.text-gray-900 Smart Card Scanning
          p.text-gray-600 Instantly digitize business cards with advanced AI recognition technology.
          .mt-4.rounded-lg.shadow-md.w-full.bg-gradient-to-br.from-gray-100.to-gray-200.aspect-video.flex.items-center.justify-center
            .flex.flex-col.items-center.gap-2
              VaIcon(name="photo_camera" size="48px" class="text-emerald-500")
              span.text-sm.text-gray-600 Card Scanning Preview

        // Feature Card 2
        .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-6.transition-all.duration-300.hover_shadow-xl
          .flex.items-center.gap-4.mb-4
            .bg-emerald-100.p-3.rounded-xl
              VaIcon(name="smart_toy" size="24px" class="text-emerald-600")
            h3.text-xl.font-bold.text-gray-900 AI Message Generation
          p.text-gray-600 Generate personalized follow-up messages with our AI assistant.
          .mt-4.rounded-lg.shadow-md.w-full.bg-gradient-to-br.from-gray-100.to-gray-200.aspect-video.flex.items-center.justify-center
            .flex.flex-col.items-center.gap-2
              VaIcon(name="chat" size="48px" class="text-emerald-500")
              span.text-sm.text-gray-600 AI Message Preview

        // Feature Card 3
        .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-6.transition-all.duration-300.hover_shadow-xl
          .flex.items-center.gap-4.mb-4
            .bg-emerald-100.p-3.rounded-xl
              VaIcon(name="event" size="24px" class="text-emerald-600")
            h3.text-xl.font-bold.text-gray-900 Event Organization
          p.text-gray-600 Organize contacts by events and manage your networking efficiently.
          .mt-4.rounded-lg.shadow-md.w-full.bg-gradient-to-br.from-gray-100.to-gray-200.aspect-video.flex.items-center.justify-center
            .flex.flex-col.items-center.gap-2
              VaIcon(name="folder" size="48px" class="text-emerald-500")
              span.text-sm.text-gray-600 Event Organization Preview

    // How It Works
    .mb-16
      h2.text-3xl.font-bold.text-gray-900.mb-8 How It Works
      .space-y-12
        // Step 1
        .flex.flex-col.items-center.gap-8(class="md:flex-row")
          .flex-1.space-y-4
            .flex.items-center.gap-4
              .bg-emerald-100.p-2.rounded-full
                span.text-emerald-600.font-bold 1
              h3.text-xl.font-bold.text-gray-900 Upload Business Cards
            p.text-gray-600.ml-12 Simply drag and drop your business cards or use your camera to scan them. Our AI will automatically extract all important information.
          .flex-1
            .rounded-xl.shadow-lg.border.border-gray-100.bg-gradient-to-br.from-gray-100.to-gray-200.aspect-video.flex.items-center.justify-center
              .flex.flex-col.items-center.gap-2
                VaIcon(name="upload_file" size="48px" class="text-emerald-500")
                span.text-sm.text-gray-600 Upload Interface Preview

        // Step 2
        .flex.flex-col.items-center.gap-8(class="md:flex-row-reverse")
          .flex-1.space-y-4
            .flex.items-center.gap-4
              .bg-emerald-100.p-2.rounded-full
                span.text-emerald-600.font-bold 2
              h3.text-xl.font-bold.text-gray-900 Organize & Categorize
            p.text-gray-600.ml-12 Group your contacts by events, generate AI-powered follow-up messages, and manage your network effectively.
          .flex-1
            .rounded-xl.shadow-lg.border.border-gray-100.bg-gradient-to-br.from-gray-100.to-gray-200.aspect-video.flex.items-center.justify-center
              .flex.flex-col.items-center.gap-2
                VaIcon(name="category" size="48px" class="text-emerald-500")
                span.text-sm.text-gray-600 Organization Interface Preview

        // Step 3
        .flex.flex-col.items-center.gap-8(class="md:flex-row")
          .flex-1.space-y-4
            .flex.items-center.gap-4
              .bg-emerald-100.p-2.rounded-full
                span.text-emerald-600.font-bold 3
              h3.text-xl.font-bold.text-gray-900 Connect & Follow Up
            p.text-gray-600.ml-12 Use our AI to generate personalized messages, save contacts to your phone, and maintain your professional relationships.
          .flex-1
            .rounded-xl.shadow-lg.border.border-gray-100.bg-gradient-to-br.from-gray-100.to-gray-200.aspect-video.flex.items-center.justify-center
              .flex.flex-col.items-center.gap-2
                VaIcon(name="connect_without_contact" size="48px" class="text-emerald-500")
                span.text-sm.text-gray-600 Follow-up Interface Preview

    // Call to Action
    .bg-white.rounded-2xl.shadow-lg.border.border-emerald-100.p-8.text-center
      h2.text-2xl.font-bold.text-gray-900.mb-4 Ready to Get Started?
      p.text-gray-600.mb-6 Join thousands of professionals who are already using BilloAI to manage their networks more effectively.
      .flex.justify-center.gap-4
        router-link(
          to="/auth"
          class="bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200 px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
        )
          VaIcon(name="login" size="18px")
          span Sign Up Now
        router-link(
          to="/subscription"
          class="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all duration-200 px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:border-gray-300"
        )
          VaIcon(name="diamond" size="18px")
          span View Plans
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.aspect-w-16 {
  position: relative;
  padding-bottom: 56.25%;
}

.aspect-w-16 iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Hover effects */
.hover_shadow-xl:hover {
  --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
</style> 