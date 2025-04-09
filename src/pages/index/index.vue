<route>
meta:
  title: BilloAI - Smart Business Card Manager
  description: Digitize your business cards with AI. Save time, stay organized, and never lose a contact again. Try BilloAI for free today.
</route>

<template lang="pug">
main(class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50")
  // Hero Section
  section.relative.overflow-hidden.flex.items-center.justify-center.min-h-screen
    .max-w-3xl.mx-auto.px-4.w-full.text-center
      // Title with proper spacing and alignment
      h1.text-center.mb-6
        .text-5xl.font-bold.mb-2
          span.text-emerald-500 Smart
        .text-5xl.font-bold.mb-2 Business Card
        .text-5xl.font-bold Management

      // Subtitle with proper width and spacing
      p.text-lg.text-gray-600.mb-16.max-w-2xl.mx-auto Transform your business cards into actionable connections with AI-powered networking tools.

      // Progress Bar
      .w-full.max-w-md.mx-auto.mb-12
        .h-1.bg-emerald-500.rounded-full

      // Action Buttons with proper spacing and styling
      .flex.flex-col.items-center.gap-8
        router-link(
          to="/home"
          class="w-full max-w-md bg-emerald-500 text-white px-8 py-4 rounded-xl hover:bg-emerald-600 transition-all duration-300 flex items-center justify-center gap-3 relative group"
        )
          span.text-lg.font-medium Get Started Free
          VaIcon(
            name="arrow_downward"
            size="24px"
            class="absolute right-8 transition-all duration-300 group-hover:translate-y-1"
          )
        
        a(
          href="#features"
          class="text-gray-700 hover:text-emerald-600 transition-colors duration-300 text-lg font-medium"
        ) Learn More

  // Features Section
  section#features.py-24.bg-white
    .max-w-7xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.mb-20
        h2.text-4xl.font-bold.text-gray-900.mb-6 Key Features
        p.text-xl.text-gray-600.max-w-2xl.mx-auto Everything you need to manage your professional network effectively
      
      .grid.gap-8.max-w-6xl.mx-auto(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
        // Feature Cards
        .feature-card(v-for="feature in features" :key="feature.title")
          .bg-gradient-to-br.from-white.to-gray-50.rounded-2xl.p-8.shadow-lg.border.border-gray-100.h-full.transform.transition-all.duration-300.flex.flex-col.items-center.text-center(
          class="hover:-translate-y-1 hover:shadow-xl"
        )
            .bg-emerald-100.w-16.h-16.rounded-xl.flex.items-center.justify-center.mb-6
              VaIcon(:name="feature.icon" size="32px" class="text-emerald-600")
            h3.text-2xl.font-bold.text-gray-900.mb-4 {{ feature.title }}
            p.text-gray-600.text-lg {{ feature.description }}

  // How It Works Section
  section.py-24.bg-gradient-to-br.from-emerald-50.to-teal-50
    .max-w-7xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.mb-20
        h2.text-4xl.font-bold.text-gray-900.mb-6 Simple Process
        p.text-xl.text-gray-600.max-w-2xl.mx-auto Get started in minutes with our intuitive workflow
      
      .grid.gap-8.max-w-5xl.mx-auto(class="grid-cols-1 md:grid-cols-3")
        // Step Cards
        .step-card(v-for="(step, index) in steps" :key="step.title")
          .bg-white.rounded-2xl.p-8.shadow-lg.border.border-gray-100.h-full.relative.flex.flex-col.items-center.text-center
            .absolute.top-4.right-4.text-5xl.font-bold(
              class="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent opacity-10"
            ) {{ index + 1 }}
            .bg-emerald-100.w-12.h-12.rounded-xl.flex.items-center.justify-center.mb-6
              VaIcon(:name="step.icon" size="24px" class="text-emerald-600")
            h3.text-xl.font-bold.text-gray-900.mb-4 {{ step.title }}
            p.text-gray-600 {{ step.description }}

  // Benefits Section
  section.py-24.bg-white
    .max-w-7xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.mb-20
        h2.text-4xl.font-bold.text-gray-900.mb-6 Why Choose BilloAI
        p.text-xl.text-gray-600.max-w-2xl.mx-auto Built for modern professionals
      
      .grid.gap-8.max-w-5xl.mx-auto(class="grid-cols-1 md:grid-cols-2")
        // Benefit Cards
        .benefit-card(v-for="benefit in benefits" :key="benefit.title")
          .flex.items-start.gap-6.p-8.rounded-xl.transition-all.duration-300(
            class="hover:bg-gray-50"
          )
            .bg-emerald-100.p-4.rounded-xl.flex-shrink-0
              VaIcon(:name="benefit.icon" size="24px" class="text-emerald-600")
            div
              h3.text-xl.font-bold.text-gray-900.mb-3 {{ benefit.title }}
              p.text-gray-600 {{ benefit.description }}

  // Testimonials Section
  section.py-16.bg-white
    .max-w-4xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.mb-10
        h2.text-2xl.font-bold.text-gray-900.mb-2 What people are saying
      
      // Simple circle-based testimonial layout
      .grid.gap-8.max-w-3xl.mx-auto(class="grid-cols-1 sm:grid-cols-2 md:grid-cols-3")
        // Testimonial items
        .testimonial-card(v-for="testimonial in testimonials" :key="testimonial.name")
          .flex.flex-col.items-center.text-center
            .w-12.h-12.rounded-full.mb-3.flex.items-center.justify-center.text-white.font-medium.text-sm.bg-gradient-to-br.from-emerald-500.to-teal-600 {{ getInitials(testimonial.name) }}
            p.text-sm.text-gray-700.mb-2 "{{ testimonial.quote }}"
            .text-xs.font-medium.text-gray-500 {{ testimonial.name }}

  // CTA Section
  section.py-24.bg-gradient-to-br.from-emerald-500.to-teal-500.text-white
    .max-w-7xl.mx-auto.px-4(class="sm:px-6 lg:px-8")
      .text-center.max-w-3xl.mx-auto
        h2.text-4xl.font-bold.mb-6 Ready to Get Started?
        p.text-xl.mb-12.max-w-2xl.mx-auto Join professionals who are already using BilloAI to manage their network more effectively.
        router-link(
          to="/home"
          class="bg-white text-emerald-600 px-12 py-6 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-3"
        )
          VaIcon(name="rocket_launch" size="24px")
          span.text-xl.font-medium Get Started Free
</template>

<script setup>
// Features Section Data
const features = [
  {
    icon: 'document_scanner',
    title: 'One-Click Card Scanning',
    description: 'Instantly scan business cards and save them to your contacts with a single click - no manual data entry required.'
  },
  // {
  //   icon: 'sync',
  //   title: 'Auto Contact Sync',
  //   description: "Automatically sync scanned cards with your phone's contacts and favorite CRM systems in seconds."
  // },
  {
    icon: 'smart_toy',
    title: 'AI Email Assistant',
    description: 'Generate personalized follow-up emails instantly with AI that understands context and business etiquette.'
  },
  {
    icon: 'qr_code_2',
    title: 'Dynamic Digital Cards',
    description: 'Create digital business cards that update in real-time - when you change jobs or details, all shared cards update automatically.'
  },
  {
    icon: 'event_available',
    title: 'Event Networking Mode',
    description: 'Special mode for conferences and events - scan multiple cards rapidly and organize them by event automatically.'
  },
  // {
  //   icon: 'badge',
  //   title: 'Smart Tags & Categories',
  //   description: 'AI automatically categorizes contacts by industry, role, and potential opportunities for smarter networking.'
  // }
];

// How It Works Steps
const steps = [
  {
    icon: 'photo_camera',
    title: 'Capture Cards',
    description: 'Simply take a photo or upload your business cards to get started.'
  },
  {
    icon: 'auto_awesome',
    title: 'AI Processing',
    description: 'Our AI automatically extracts and organizes all the important information.'
  },
  {
    icon: 'chat',
    title: 'Start Connecting',
    description: 'Generate personalized follow-up messages and manage your network effectively.'
  }
];

// Benefits
const benefits = [
  {
    icon: 'speed',
    title: '10x Faster Networking',
    description: 'Save hours of manual data entry and follow-up message writing with our AI-powered tools.'
  },
  {
    icon: 'psychology',
    title: 'Smart Organization',
    description: 'Automatically categorize and tag contacts based on events, industries, and relationships.'
  },
  {
    icon: 'cloud_done',
    title: 'Always Accessible',
    description: 'Access your contacts and generate emails from any device, anywhere, anytime.'
  },
  {
    icon: 'shield',
    title: 'Enterprise Ready',
    description: 'Built with security and scalability in mind for growing businesses.'
  }
];

// Helper function to get initials from name
function getInitials(name) {
  return name.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

// Testimonials
const testimonials = [
  {
    quote: "So much better than keeping business cards in a drawer. No more typing everything manually.",
    name: "Zara"
  },
  {
    quote: "I can finally find people I met at conferences months ago. Makes follow-ups way easier.",
    name: "Theo"
  },
  {
    quote: "Used to lose important contacts all the time. Not anymore.",
    name: "Astrid"
  },
  {
    quote: "The email templates are a huge timesaver. One less thing to think about.",
    name: "Silas"
  },
  {
    quote: "Helps me remember where I met someone. No more awkward follow-up conversations.",
    name: "Fiona"
  },
  {
    quote: "Been using it for 3 months. Can't imagine going back to the old way.",
    name: "Kieran"
  }
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

.testimonial-card {
  transition: all 0.2s ease;
}

.testimonial-card:hover .rounded-full {
  transform: scale(1.1);
}
</style>