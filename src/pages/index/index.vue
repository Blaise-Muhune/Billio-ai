<route>
meta:
  title: BilloAI — Scan a card, get a contact, send the follow-up
  description: Structured contacts from a photo, a shareable profile link, and AI drafts for follow-ups—built for events, sales, and founders.
</route>

<template lang="pug">
main.font-sans.billo-app-bg
  // Hero Section
  section.relative.overflow-hidden.flex.items-center.justify-center.min-h-screen
    .max-w-3xl.mx-auto.px-4.w-full.text-center
      p.text-xs.font-semibold.uppercase.tracking-widest.text-emerald-600.mb-4 BilloAI
      // Title with proper spacing and alignment
      h1.font-display.text-center.mb-8.text-slate-900(class="text-[clamp(2rem,5vw,3.25rem)] leading-[1.1]")
        span.block.font-bold.text-emerald-600 Smart business cards.
        span.block.font-bold.mt-2 One place to grow your network.

      // Subtitle with proper width and spacing
      p.text-lg.text-slate-600.mb-16.max-w-xl.mx-auto.leading-relaxed Scan cards with AI, fix details in seconds, and keep follow-ups where you already work.

      // Progress Bar
      .w-full.max-w-md.mx-auto.mb-12
        .h-1.bg-emerald-500.rounded-full

      // Action Buttons with proper spacing and styling
      .flex.flex-col.items-center.gap-8
        router-link(
          to="/home"
          class="w-full max-w-md bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-billo hover:bg-emerald-700 transition-all duration-billo ease-billo-out flex items-center justify-center gap-3 relative group"
        )
          span.text-lg.font-medium Get Started Free
          VaIcon(
            name="arrow_downward"
            size="24px"
            class="absolute right-8 transition-all duration-300 group-hover:translate-y-1"
          )
        
        a(
          href="#features"
          class="text-slate-700 hover:text-emerald-600 transition-colors duration-billo ease-billo-out text-lg font-semibold"
        ) See how it works

  // Features Section
  section#features.py-24.bg-white
    .max-w-7xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.mb-20
        h2.font-display.text-4xl.font-bold.text-slate-900.mb-6 What you actually buy with BilloAI
        p.text-xl.text-slate-600.max-w-2xl.mx-auto.leading-relaxed Less retyping. Fewer lost leads. A public link that still works when your title changes.
      
      .grid.gap-8.max-w-6xl.mx-auto(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
        // Feature Cards
        .feature-card(v-for="feature in features" :key="feature.title")
          .billo-card-elevated.billo-motion.flex.h-full.transform.flex-col.items-center.p-8.text-center(
            class="duration-300 hover:-translate-y-1 hover:shadow-xl"
          )
            .mb-6.flex.h-16.w-16.items-center.justify-center.rounded-xl.bg-emerald-100
              VaIcon(:name="feature.icon" size="32px" class="text-emerald-600")
            h3.mb-4.text-2xl.font-bold.text-slate-900 {{ feature.title }}
            p.text-base.leading-relaxed.text-slate-600 {{ feature.description }}

  // How It Works Section
  section.py-24.bg-gradient-to-br.from-emerald-50.to-teal-50
    .max-w-7xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.mb-20
        h2.font-display.text-4xl.font-bold.text-slate-900.mb-6 Simple process
        p.text-xl.text-slate-600.max-w-2xl.mx-auto.leading-relaxed Get started in minutes with a guided flow built for busy events.
      
      .grid.gap-8.max-w-5xl.mx-auto(class="grid-cols-1 md:grid-cols-3")
        // Step Cards
        .step-card(v-for="(step, index) in steps" :key="step.title")
          .billo-card-elevated.billo-motion.relative.flex.h-full.flex-col.items-center.p-8.text-center
            .absolute.right-4.top-4.text-5xl.font-bold(
              class="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent opacity-10"
            ) {{ index + 1 }}
            .mb-6.flex.h-12.w-12.items-center.justify-center.rounded-xl.bg-emerald-100
              VaIcon(:name="step.icon" size="24px" class="text-emerald-600")
            h3.mb-4.text-xl.font-bold.text-slate-900 {{ step.title }}
            p.leading-relaxed.text-slate-600 {{ step.description }}

  // Benefits Section
  section.py-24.bg-white
    .max-w-7xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.mb-20
        h2.font-display.text-4xl.font-bold.text-slate-900.mb-6 Why BilloAI vs. “I’ll deal with this later”
        p.text-xl.text-slate-600.max-w-2xl.mx-auto.leading-relaxed
          | Most apps stop at OCR. BilloAI is built for the moment after the handshake: structured data, a link you can share, and language for the follow-up.
      
      .grid.gap-8.max-w-5xl.mx-auto(class="grid-cols-1 md:grid-cols-2")
        // Benefit Cards
        .benefit-card(v-for="benefit in benefits" :key="benefit.title")
          .flex.items-start.gap-6.p-8.rounded-2xl.border.border-slate-100.transition-all.duration-billo.ease-billo-out(
            class="bg-slate-50/50 hover:border-emerald-100 hover:bg-white hover:shadow-billo-sm"
          )
            .bg-emerald-100.p-4.rounded-xl.flex-shrink-0
              VaIcon(:name="benefit.icon" size="24px" class="text-emerald-600")
            div
              h3.text-xl.font-bold.text-slate-900.mb-3 {{ benefit.title }}
              p.text-slate-600.leading-relaxed {{ benefit.description }}

  // Trust / outcomes (no fabricated personas)
  section.py-20.bg-slate-50.border-y.border-slate-100
    .max-w-5xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.mb-14
        h2.font-display.text-3xl.font-bold.text-slate-900.mb-3 What you get on day one
        p.text-lg.text-slate-600.max-w-2xl.mx-auto.leading-relaxed Honest outcomes—not a drawer of cardstock, not another “I’ll add them to LinkedIn eventually.”
      .grid.gap-6(class="sm:grid-cols-3")
        .billo-card-elevated.billo-motion.p-6.text-left(
          v-for="pillar in trustPillars"
          :key="pillar.title"
        )
          .mb-4.inline-flex.h-12.w-12.items-center.justify-center.rounded-xl.bg-emerald-100
            VaIcon(:name="pillar.icon" size="26px" class="text-emerald-700")
          h3.text-lg.font-bold.text-slate-900.mb-2 {{ pillar.title }}
          p.text-sm.text-slate-600.leading-relaxed {{ pillar.body }}

  // CTA Section
  section.py-24.bg-gradient-to-br.from-emerald-600.to-teal-600.text-white
    .max-w-7xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.max-w-3xl.mx-auto
        h2.font-display.text-4xl.font-bold.mb-6 Ready before your next event?
        p.text-xl.mb-10.max-w-2xl.mx-auto.leading-relaxed.opacity-95
          | Upload your first card in minutes. If it’s not faster than typing the back of a card into your notes app, you’re not using it wrong—we built it to remove that step entirely.
        router-link(
          to="/home"
          class="bg-white text-emerald-700 px-12 py-5 rounded-2xl font-semibold shadow-billo transition-all duration-billo ease-billo-out hover:bg-slate-50 inline-flex items-center gap-3"
        )
          VaIcon(name="rocket_launch" size="24px")
          span.text-lg Start free — keep every lead
</template>

<script setup>
// Features Section Data
const features = [
  {
    icon: 'document_scanner',
    title: 'Scan once, structure everything',
    description:
      'A photo becomes name, title, company, emails, phones, sites, and address fields you can edit—so the CRM row exists even if the CRM never does.',
  },
  {
    icon: 'smart_toy',
    title: 'Follow-up language, not generic spam',
    description:
      'Draft a warm, human “nice to meet you” note grounded in who they are and where you met—ready to send or tweak in seconds.',
  },
  {
    icon: 'qr_code_2',
    title: 'A living link, not a dead PDF',
    description:
      'Share a profile + QR that reflects your current role. When you change jobs or links, the same URL stays fresh for people you already met.',
  },
  {
    icon: 'event_available',
    title: 'Event mode for real hallways',
    description:
      'Rapid capture and grouping by event so Monday morning isn’t “who was that again?”—it’s a sorted list with context.',
  },
];

// How It Works Steps
const steps = [
  {
    icon: 'photo_camera',
    title: 'Capture',
    description: 'Snap or upload a card in seconds—coffee stains, glossy stock, and crooked angles included.',
  },
  {
    icon: 'auto_awesome',
    title: 'Structure',
    description: 'We pull the fields that matter, suggest readable colors for your digital card, and keep the raw image until you delete it.',
  },
  {
    icon: 'chat',
    title: 'Follow up',
    description: 'Turn a contact into a message you’d actually send—then save, copy, or iterate without starting from a blank page.',
  },
];

// Benefits
const benefits = [
  {
    icon: 'speed',
    title: 'Minutes, not Monday',
    description:
      'The job isn’t “OCR.” It’s getting from card → usable contact → sent message before the lead goes cold. BilloAI is tuned for that path.',
  },
  {
    icon: 'psychology',
    title: 'Context beats columns',
    description:
      'Events, titles, and companies become the story behind each row—so your outreach sounds like you remember the conversation, not a mail merge.',
  },
  {
    icon: 'cloud_done',
    title: 'Where you already work',
    description:
      'Web-first: scan on your phone, polish on your laptop. Your cards and drafts stay in one place instead of scattered camera-roll screenshots.',
  },
  {
    icon: 'shield',
    title: 'Built for real data',
    description:
      'Business cards are PII. We treat them that way—clear limits by plan, your account gate, and a product posture aimed at individuals & small teams first.',
  },
];

const trustPillars = [
  {
    icon: 'hub',
    title: 'One pipeline from paper to people',
    body: 'Instead of “photo in camera roll → maybe LinkedIn → maybe spreadsheet,” you get structured fields, a profile link, and drafts in one flow.',
  },
  {
    icon: 'verified',
    title: 'No fake social proof',
    body: 'We’d rather spell the outcome—fewer lost leads, faster follow-ups—than invent testimonials. Try the free tier and judge the workflow.',
  },
  {
    icon: 'trending_up',
    title: 'Room to grow with you',
    body: 'Free for taste; paid tiers when cards, events, and drafts become part of your job. Upgrade when the habit sticks, not on day zero.',
  },
];
</script>

<style scoped>
.feature-card, .step-card, .benefit-card {
  transition: all 0.3s ease;
}

.feature-card:hover, .step-card:hover {
  transform: translateY(-4px);
}

/* Gradient text animation */
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

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Ensure consistent card heights */
.feature-card, .step-card {
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.benefit-card {
  min-height: 160px;
}

/* Ensure consistent button widths */
.cta-button {
  min-width: 200px;
}

</style>