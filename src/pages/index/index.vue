<route>
meta:
  title: BilloAI — The follow-up button for in-person networking
  description: Meet someone, scan their card, send a warm follow-up from Gmail or Outlook before the lead goes cold—built for conferences, sales, and founders.
</route>

<template lang="pug">
main.font-sans.billo-landing
  // Hero — one composition: brand, promise, CTA, product stage
  section.billo-landing-hero
    .billo-landing-hero__glow(aria-hidden="true")
    .billo-landing-hero__inner
      .billo-landing-hero__copy
        p.billo-landing-hero__brand BilloAI
        h1.billo-landing-hero__title
          span.block Meet someone.
          span.block.billo-landing-hero__accent Send the follow-up before you forget.
        p.billo-landing-hero__lede
          | Scan a card or contact screenshot. Get a human draft. Open it in Gmail or Outlook in one tap.
        .billo-landing-hero__actions
          router-link.billo-landing-hero__cta(to="/home") Start following up free
          a.billo-landing-hero__ghost(href="#loop") See the 60-second loop

      .billo-landing-hero__stage(aria-hidden="true")
        .billo-landing-stage
          .billo-landing-stage__card
            p.billo-landing-stage__kicker Capture
            p.billo-landing-stage__name Alex Chen
            p.billo-landing-stage__meta Product · SaaStr
          .billo-landing-stage__arrow
          .billo-landing-stage__draft
            p.billo-landing-stage__kicker Draft
            p.billo-landing-stage__subject Great meeting you at SaaStr
            p.billo-landing-stage__body Enjoyed the pricing chat — happy to stay in touch.
          .billo-landing-stage__arrow
          .billo-landing-stage__send
            p.billo-landing-stage__kicker Send
            p.billo-landing-stage__apps Gmail · Outlook

  // Features Section
  section#features.py-24.bg-white
    .max-w-7xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.mb-20
        h2.font-display.text-4xl.font-bold.text-slate-900.mb-6 What you actually buy with BilloAI
        p.text-xl.text-slate-600.max-w-2xl.mx-auto.leading-relaxed
          | Not another contact dump—a habit: meet → remember → send, before Monday morning regret.
      
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
  section#loop.py-24.bg-gradient-to-br.from-emerald-50.to-teal-50
    .max-w-7xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.mb-20
        h2.font-display.text-4xl.font-bold.text-slate-900.mb-6 The 60-second loop
        p.text-xl.text-slate-600.max-w-2xl.mx-auto.leading-relaxed Built for the hallway after a talk—not for “I’ll process these cards later.”
      
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
          | Most apps stop at OCR. Billo is built for the moment after the handshake: a message you’d actually send, from the inbox you already use.
      
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
        h2.font-display.text-4xl.font-bold.mb-6 Ready for your next event?
        p.text-xl.mb-10.max-w-2xl.mx-auto.leading-relaxed.opacity-95
          | Leave with follow-ups sent—not a pocket full of cards you’ll sort “tomorrow.” Try it free before your next conference.
        router-link(
          to="/home"
          class="bg-white text-emerald-700 px-12 py-5 rounded-2xl font-semibold shadow-billo transition-all duration-billo ease-billo-out hover:bg-slate-50 inline-flex items-center gap-3"
        )
          VaIcon(name="rocket_launch" size="24px")
          span.text-lg Start free — send your first follow-up
</template>

<script setup>
// Features Section Data
const features = [
  {
    icon: 'document_scanner',
    title: 'Capture the meet',
    description:
      'Snap the card while you’re still talking. We pull name, title, company, and email so you’re not typing under fluorescent lights.',
  },
  {
    icon: 'send',
    title: 'One-tap follow-up',
    description:
      'Get a warm “great meeting you” note, then open it prefilled in Gmail or Outlook—send from your real inbox, not a copy-paste chore.',
  },
  {
    icon: 'event_available',
    title: 'Keep event context',
    description:
      'Group people by conference or meetup so Monday isn’t “who was that again?”—it’s a short list of people you still owe a note.',
  },
  {
    icon: 'qr_code_2',
    title: 'Share your living link',
    description:
      'Hand them your profile + QR when they ask for yours. Same URL stays fresh when your title or links change.',
  },
];

// How It Works Steps
const steps = [
  {
    icon: 'photo_camera',
    title: 'Meet & scan',
    description: 'Snap their card at the booth or after the talk—messy angles and glossy stock are fine.',
  },
  {
    icon: 'auto_awesome',
    title: 'Get the note',
    description: 'AI writes a short, human follow-up grounded in who they are—not a mail-merge template.',
  },
  {
    icon: 'send',
    title: 'Send in one tap',
    description: 'Open Gmail or Outlook with the message ready. Hit send before you leave the venue.',
  },
];

// Benefits
const benefits = [
  {
    icon: 'speed',
    title: 'Minutes, not Monday',
    description:
      'The job isn’t “OCR.” It’s card → usable contact → sent message before the lead goes cold. Billo is tuned for that path.',
  },
  {
    icon: 'psychology',
    title: 'Sounds like you were there',
    description:
      'Titles, companies, and events become the story behind each note—so outreach feels remembered, not automated.',
  },
  {
    icon: 'mail',
    title: 'Your inbox, not ours',
    description:
      'Follow-ups open in Gmail or Outlook so they come from you. No “sent via random SaaS” that tanks reply rates.',
  },
  {
    icon: 'shield',
    title: 'Built for real data',
    description:
      'Business cards are PII. Clear plan limits, your account gate, and a product aimed at individuals & small teams first.',
  },
];

const trustPillars = [
  {
    icon: 'hub',
    title: 'One loop: meet → send',
    body: 'Instead of camera roll → LinkedIn → spreadsheet, you get a follow-up ready to send before the connection cools.',
  },
  {
    icon: 'verified',
    title: 'No fake social proof',
    body: 'We’d rather promise fewer lost leads and more notes sent than invent testimonials. Try free and judge the loop.',
  },
  {
    icon: 'trending_up',
    title: 'Pay when the habit sticks',
    body: 'Free to taste the workflow. Upgrade when follow-ups, events, and drafts become part of how you network.',
  },
];
</script>

<style scoped>
.billo-landing {
  --billo-ink: #0f172a;
  --billo-muted: #475569;
  --billo-line: rgb(15 23 42 / 0.08);
  color: var(--billo-ink);
  background: #fff;
}

.billo-landing-hero {
  position: relative;
  min-height: min(100vh, 56rem);
  display: flex;
  align-items: center;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(ellipse 90% 70% at 12% -10%, rgb(16 185 129 / 0.22), transparent 55%),
    radial-gradient(ellipse 70% 55% at 95% 15%, rgb(13 148 136 / 0.16), transparent 50%),
    linear-gradient(165deg, #f8fafc 0%, #ecfdf5 42%, #f0fdfa 100%);
}

.billo-landing-hero__glow {
  position: absolute;
  inset: auto -20% -35% 20%;
  height: 55%;
  background: radial-gradient(circle at 50% 0%, rgb(16 185 129 / 0.18), transparent 65%);
  pointer-events: none;
  z-index: 0;
  animation: billo-landing-breathe 9s ease-in-out infinite;
}

.billo-landing-hero__inner {
  position: relative;
  z-index: 1;
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: clamp(4.5rem, 12vh, 7rem) 0 clamp(3rem, 8vh, 5rem);
  display: grid;
  gap: clamp(2rem, 5vw, 3.5rem);
  align-items: center;
}

@media (min-width: 960px) {
  .billo-landing-hero__inner {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  }
}

.billo-landing-hero__brand {
  margin: 0 0 1rem;
  font-family: 'Instrument Sans', 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(2.4rem, 6vw, 3.75rem);
  font-weight: 750;
  letter-spacing: -0.045em;
  line-height: 0.95;
  background: linear-gradient(105deg, #059669, #0f766e 55%, #0d9488);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: billo-landing-rise 0.7s ease-out both;
}

.billo-landing-hero__title {
  margin: 0 0 1rem;
  font-family: 'Instrument Sans', 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(1.55rem, 3.6vw, 2.35rem);
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--billo-ink);
  animation: billo-landing-rise 0.75s 0.06s ease-out both;
}

.billo-landing-hero__accent {
  color: #0f766e;
}

.billo-landing-hero__lede {
  margin: 0 0 1.75rem;
  max-width: 34rem;
  font-size: clamp(1rem, 1.5vw, 1.125rem);
  line-height: 1.55;
  color: var(--billo-muted);
  animation: billo-landing-rise 0.8s 0.12s ease-out both;
}

.billo-landing-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem 1.25rem;
  animation: billo-landing-rise 0.85s 0.18s ease-out both;
}

.billo-landing-hero__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3.15rem;
  padding: 0.8rem 1.35rem;
  border-radius: 1rem;
  background: linear-gradient(105deg, #059669, #0d9488);
  color: #fff;
  font-weight: 650;
  font-size: 1.02rem;
  text-decoration: none;
  box-shadow: 0 18px 36px -18px rgb(5 150 105 / 0.95);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.billo-landing-hero__cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 22px 40px -16px rgb(5 150 105 / 0.95);
}

.billo-landing-hero__ghost {
  color: #334155;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid rgb(51 65 85 / 0.25);
  padding-bottom: 0.1rem;
}

.billo-landing-hero__ghost:hover {
  color: #0f766e;
  border-bottom-color: #0f766e;
}

.billo-landing-hero__stage {
  animation: billo-landing-rise 0.9s 0.22s ease-out both;
}

.billo-landing-stage {
  display: grid;
  gap: 0.65rem;
  padding: 1.1rem;
  border-radius: 1.5rem;
  border: 1px solid var(--billo-line);
  background: rgb(255 255 255 / 0.72);
  backdrop-filter: blur(10px);
  box-shadow:
    0 30px 60px -40px rgb(15 118 110 / 0.45),
    inset 0 1px 0 rgb(255 255 255 / 0.8);
}

.billo-landing-stage__card,
.billo-landing-stage__draft,
.billo-landing-stage__send {
  padding: 0.95rem 1.05rem;
  border-radius: 1rem;
  border: 1px solid var(--billo-line);
  background: #fff;
}

.billo-landing-stage__card {
  animation: billo-landing-pulse 5.5s ease-in-out infinite;
}

.billo-landing-stage__draft {
  animation: billo-landing-pulse 5.5s 0.4s ease-in-out infinite;
}

.billo-landing-stage__send {
  animation: billo-landing-pulse 5.5s 0.8s ease-in-out infinite;
}

.billo-landing-stage__kicker {
  margin: 0 0 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0d9488;
}

.billo-landing-stage__name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.billo-landing-stage__meta,
.billo-landing-stage__body,
.billo-landing-stage__apps {
  margin: 0.2rem 0 0;
  font-size: 0.9rem;
  color: var(--billo-muted);
  line-height: 1.4;
}

.billo-landing-stage__subject {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: -0.015em;
}

.billo-landing-stage__arrow {
  width: 1.5rem;
  height: 0.55rem;
  margin-left: 1rem;
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(16 185 129 / 0.15), #10b981);
  position: relative;
}

.billo-landing-stage__arrow::after {
  content: '';
  position: absolute;
  right: -0.15rem;
  top: 50%;
  width: 0.4rem;
  height: 0.4rem;
  border-right: 2px solid #059669;
  border-bottom: 2px solid #059669;
  transform: translateY(-50%) rotate(-45deg);
}

@keyframes billo-landing-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes billo-landing-breathe {
  0%,
  100% {
    opacity: 0.7;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

@keyframes billo-landing-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgb(16 185 129 / 0);
  }
  50% {
    box-shadow: 0 10px 24px -16px rgb(5 150 105 / 0.55);
  }
}

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