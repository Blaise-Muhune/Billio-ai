<route>
meta:
  title: 404 - Page Not Found - BilloAI
</route>

<template lang="pug">
main.billo-app-bg.font-sans
  .max-w-2xl.mx-auto.py-8(class="px-4 sm:px-6 lg:px-8")
    .billo-card-elevated.billo-motion.p-8.text-center
      .mb-8
        VaIcon(name="error" size="64px" class="mx-auto text-red-500")
      h1.mb-4.text-4xl.font-bold.text-slate-900 404 - Page Not Found
      p.mb-8.text-xl.text-slate-600 {{ lostPath }} might be a typo or the page has been moved.
      router-link(
        to="/home"
        class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-lg"
      )
        VaIcon(name="home" size="20px")
        span(class="font-medium") Return Home
</template>

<script setup>
const route = useRoute()
const lostPath = route.params["default404"]
// assuming this is still named `[...default404].vue`, the `...` matches any unresolvable route and leaves that match in the `default404` route param.
// Ideally, we'd just name it `...404.vue` but it borks on the [match] starting with a numeral. :shrug:
</script>
