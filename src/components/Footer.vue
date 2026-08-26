<template lang="pug">
footer.app-footer.mt-auto.border-t.font-sans(
  class="border-slate-200/80 bg-gradient-to-b from-slate-50 to-white"
  role="contentinfo"
)
  .max-w-7xl.mx-auto.px-4.py-12(class="sm:px-6 lg:px-8 lg:py-14")
    .flex.flex-col.gap-10(class="lg:flex-row lg:items-start lg:justify-between lg:gap-16")
      //- Brand
      .max-w-md
        router-link.inline-flex.items-baseline.gap-1.rounded-lg.outline-none.transition-opacity(
          to="/"
          class="focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 hover:opacity-90"
          aria-label="BilloAI home"
        )
          span.app-footer__mark Billo
          span.app-footer__mark-ai AI
        p.mt-3.text-sm.leading-relaxed.text-slate-600
          | Scan cards, draft follow-ups, and share a live profile—networking without spreadsheet limbo.

      //- Link columns
      .grid.flex-1.gap-10(class="sm:grid-cols-2 lg:max-w-lg")
        nav(aria-label="Product")
          h2.text-xs.font-semibold.uppercase.tracking-widest.text-slate-500.mb-3 Product
          ul.space-y-2
            li
              router-link.app-footer__link(to="/demo") Demo &amp; tutorial
            li
              router-link.app-footer__link(to="/subscription") Plans &amp; pricing
            li
              router-link.app-footer__link(to="/dashboard") Contacts dashboard
        nav(aria-label="Legal")
          h2.text-xs.font-semibold.uppercase.tracking-widest.text-slate-500.mb-3 Legal
          ul.space-y-2
            li
              router-link.app-footer__link(to="/privacy-policy") Privacy policy
            li
              router-link.app-footer__link(to="/terms") Terms of service
            li
              router-link.app-footer__link(to="/help") Help

    //- Bottom bar
    .mt-10.flex.flex-col.items-center.justify-between.gap-4.border-t.pt-8(
      class="border-slate-200/70 sm:flex-row sm:items-center"
    )
      p.text-sm.text-slate-500
        | © {{ currentYear }} BilloAI. All rights reserved.
      p.text-xs.text-slate-400.text-center(class="sm:text-right")
        | Questions?
        |
        router-link.text-emerald-700(to="/help") Help
        |  or
        |
        a.text-emerald-700(href="mailto:support@billoai.com") support@billoai.com

  //- Structured data (SEO)
  div(itemscope itemtype="https://schema.org/Organization" style="display: none;")
    meta(itemprop="name" content="BilloAI")
    meta(
      itemprop="description"
      content="AI-powered business card scanner and contact management. Digitize cards, organize your network, and share a live profile."
    )
    meta(itemprop="url" content="https://billoai.com")
    div(itemprop="address" itemscope itemtype="https://schema.org/PostalAddress")
      meta(itemprop="addressCountry" content="US")
</template>

<script setup>
const currentYear = new Date().getFullYear();
</script>

<style scoped>
.app-footer__mark {
  @apply text-xl font-extrabold tracking-tight sm:text-2xl;
  background: linear-gradient(105deg, #059669 0%, #0d9488 50%, #14b8a6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.app-footer__mark-ai {
  @apply text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl;
}

.app-footer__link {
  @apply text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-emerald-700;
}

.app-footer__link.router-link-active {
  @apply text-emerald-800;
}
</style>
