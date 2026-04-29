<route>
meta:
  title: BilloAI - Demo & Tutorial
</route>

<template lang="pug">
main.billo-app-bg.font-sans
  // Hero Section
  .relative.overflow-hidden.border-b.backdrop-blur-md(
    class="border-slate-200/70 bg-white/80"
  )
    .max-w-7xl.mx-auto.py-16(class="px-4 sm:px-6 lg:px-8")
      .text-center
        h1.text-4xl.font-bold.tracking-tight.text-slate-900(class="sm:text-5xl md:text-6xl")
          span.block(class="xl:inline") See How 
          span.block.text-emerald-600(class="xl:inline") BilloAI Works
        p.mx-auto.mt-3.max-w-md.text-base.text-slate-600(class="sm:text-lg md:mt-5 md:max-w-3xl md:text-xl")
          | Transform your business card management and networking experience with our intelligent AI-powered platform.

  // Main Content
  .max-w-7xl.mx-auto.py-12(class="px-4 sm:px-6 lg:px-8")
    // Quick Start Video
    .mb-16
      h2.mb-8.text-3xl.font-bold.text-slate-900 Quick Start Guide
      .aspect-w-16.aspect-h-9.overflow-hidden.rounded-2xl.border.shadow-xl(
        class="billo-card-elevated border-slate-200/90"
      )
        iframe(
          src="https://www.youtube.com/embed/your-video-id"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        )

    // Key Features
    .mb-16
      h2.mb-8.text-3xl.font-bold.text-slate-900 Key Features
      .grid.gap-8(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
        // Feature Card 1
        .billo-card-elevated.billo-motion.p-6.transition-all.duration-300(class="hover:-translate-y-0.5 hover:shadow-xl")
          .mb-4.flex.items-center.gap-4
            .rounded-xl.bg-emerald-100.p-3
              VaIcon(name="qr_code_scanner" size="24px" class="text-emerald-600")
            h3.text-xl.font-bold.text-slate-900 Smart Card Scanning
          p.text-slate-600 Instantly digitize business cards with advanced AI recognition technology.
          .mt-4.flex.aspect-video.w-full.items-center.justify-center.rounded-xl.border.shadow-inner(
            class="border-slate-200/80 bg-gradient-to-br from-slate-100 to-slate-200"
          )
            .flex.flex-col.items-center.gap-2
              VaIcon(name="photo_camera" size="48px" class="text-emerald-500")
              span.text-sm.text-slate-600 Card Scanning Preview

        // Feature Card 2
        .billo-card-elevated.billo-motion.p-6.transition-all.duration-300(class="hover:-translate-y-0.5 hover:shadow-xl")
          .mb-4.flex.items-center.gap-4
            .rounded-xl.bg-emerald-100.p-3
              VaIcon(name="smart_toy" size="24px" class="text-emerald-600")
            h3.text-xl.font-bold.text-slate-900 AI Message Generation
          p.text-slate-600 Generate personalized follow-up messages with our AI assistant.
          .mt-4.flex.aspect-video.w-full.items-center.justify-center.rounded-xl.border.shadow-inner(
            class="border-slate-200/80 bg-gradient-to-br from-slate-100 to-slate-200"
          )
            .flex.flex-col.items-center.gap-2
              VaIcon(name="chat" size="48px" class="text-emerald-500")
              span.text-sm.text-slate-600 AI Message Preview

        // Feature Card 3
        .billo-card-elevated.billo-motion.p-6.transition-all.duration-300(class="hover:-translate-y-0.5 hover:shadow-xl")
          .mb-4.flex.items-center.gap-4
            .rounded-xl.bg-emerald-100.p-3
              VaIcon(name="event" size="24px" class="text-emerald-600")
            h3.text-xl.font-bold.text-slate-900 Event Organization
          p.text-slate-600 Organize contacts by events and manage your networking efficiently.
          .mt-4.flex.aspect-video.w-full.items-center.justify-center.rounded-xl.border.shadow-inner(
            class="border-slate-200/80 bg-gradient-to-br from-slate-100 to-slate-200"
          )
            .flex.flex-col.items-center.gap-2
              VaIcon(name="folder" size="48px" class="text-emerald-500")
              span.text-sm.text-slate-600 Event Organization Preview

    // How It Works
    .mb-16
      h2.mb-8.text-3xl.font-bold.text-slate-900 How It Works
      .space-y-12
        // Step 1
        .flex.flex-col.items-center.gap-8(class="md:flex-row")
          .flex-1.space-y-4
            .flex.items-center.gap-4
              .bg-emerald-100.p-2.rounded-full
                span.text-emerald-600.font-bold 1
              h3.text-xl.font-bold.text-slate-900 Upload Business Cards
            p.ml-12.text-slate-600 Simply drag and drop your business cards or use your camera to scan them. Our AI will automatically extract all important information.
          .flex-1
            .flex.aspect-video.items-center.justify-center.rounded-xl.border.shadow-md(
              class="border-slate-200/80 bg-gradient-to-br from-slate-100 to-slate-200"
            )
              .flex.flex-col.items-center.gap-2
                VaIcon(name="upload_file" size="48px" class="text-emerald-500")
                span.text-sm.text-slate-600 Upload Interface Preview

        // Step 2
        .flex.flex-col.items-center.gap-8(class="md:flex-row-reverse")
          .flex-1.space-y-4
            .flex.items-center.gap-4
              .bg-emerald-100.p-2.rounded-full
                span.text-emerald-600.font-bold 2
              h3.text-xl.font-bold.text-slate-900 Organize & Categorize
            p.ml-12.text-slate-600 Group your contacts by events, generate AI-powered follow-up messages, and manage your network effectively.
          .flex-1
            .flex.aspect-video.items-center.justify-center.rounded-xl.border.shadow-md(
              class="border-slate-200/80 bg-gradient-to-br from-slate-100 to-slate-200"
            )
              .flex.flex-col.items-center.gap-2
                VaIcon(name="category" size="48px" class="text-emerald-500")
                span.text-sm.text-slate-600 Organization Interface Preview

        // Step 3
        .flex.flex-col.items-center.gap-8(class="md:flex-row")
          .flex-1.space-y-4
            .flex.items-center.gap-4
              .bg-emerald-100.p-2.rounded-full
                span.text-emerald-600.font-bold 3
              h3.text-xl.font-bold.text-slate-900 Connect & Follow Up
            p.ml-12.text-slate-600 Use our AI to generate personalized messages, save contacts to your phone, and maintain your professional relationships.
          .flex-1
            .flex.aspect-video.items-center.justify-center.rounded-xl.border.shadow-md(
              class="border-slate-200/80 bg-gradient-to-br from-slate-100 to-slate-200"
            )
              .flex.flex-col.items-center.gap-2
                VaIcon(name="connect_without_contact" size="48px" class="text-emerald-500")
                span.text-sm.text-slate-600 Follow-up Interface Preview

    // Call to Action
    .billo-panel-premium.billo-motion.p-8.text-center
      h2.mb-4.text-2xl.font-bold.text-slate-900 Ready to Get Started?
      p.mb-6.text-slate-600 Join thousands of professionals who are already using BilloAI to manage their networks more effectively.
      .flex.flex-col.items-center.justify-center.gap-3(class="sm:flex-row sm:gap-4")
        router-link(
          to="/auth"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg sm:w-auto"
        )
          VaIcon(name="login" size="18px")
          span Sign Up Now
        router-link(
          to="/subscription"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50/50 sm:w-auto"
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