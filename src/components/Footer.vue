<template lang="pug">
footer.bg-gray-50.border-t.border-gray-100.text-center.py-8.mt-auto
  .max-w-7xl.mx-auto(class="px-4 sm:px-6 lg:px-8")
    .text-center
      // Footer links
      .flex.flex-wrap.justify-center.gap-x-8.gap-y-4.mb-6
        router-link(to="/privacy-policy" class="text-gray-600 hover:text-emerald-600 transition-colors") Privacy Policy
        // router-link(to="/demo" class="text-gray-600 hover:text-emerald-600 transition-colors") Demo
        router-link(to="/subscription" class="text-gray-600 hover:text-emerald-600 transition-colors") Pricing
      // Copyright
      p.text-gray-500.text-sm &copy; {{ currentYear }} BilloAI. All rights reserved.
  
  // Structured Data for SEO
  div(itemscope itemtype="https://schema.org/Organization" style="display: none;")
    meta(itemprop="name" content="BilloAI")
    meta(itemprop="description" content="AI-powered business card scanner and contact management system. Digitize cards instantly and organize your network efficiently.")
    meta(itemprop="url" content="https://billoai.com")
    div(itemprop="address" itemscope itemtype="https://schema.org/PostalAddress")
      meta(itemprop="addressCountry" content="US")
</template>

<script setup>
const currentYear = new Date().getFullYear();
</script> 