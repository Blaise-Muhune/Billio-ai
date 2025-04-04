<route>
meta:
  title: 404 - Page Not Found - BilloAI
</route>

<template lang="pug">
main(class="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-emerald-50")
  .max-w-2xl.mx-auto(class="px-4 sm:px-6 lg:px-8 py-8")
    .bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-8.text-center
      .mb-8
        VaIcon(name="error" size="64px" class="text-red-500 mx-auto")
      h1.text-4xl.font-bold.text-gray-900.mb-4 404 - Page Not Found
      p.text-xl.text-gray-600.mb-8 {{ lostPath }} might be a typo or the page has been moved.
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
