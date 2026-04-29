import { Analytics } from '@vercel/analytics/vue'

<template lang="pug">
.billo-app-bg.flex.min-h-screen.flex-col
  AppTopNav(v-if="showAppTopNav")
  .flex-1(:class="showAppTopNav ? 'pt-12 sm:pt-14' : ''")
    RouterView
  Footer
  Analytics
</template>

<script setup>
import { computed, onErrorCaptured } from 'vue'
import { useRoute } from 'vue-router'
import AppTopNav from './components/AppTopNav.vue'
import Footer from './components/Footer.vue'

const route = useRoute()
const showAppTopNav = computed(() => route.matched.some((r) => r.meta?.requiresAuth === true))

onErrorCaptured((err, instance, info) => {
  console.error('Error captured in App.vue:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
  return false // prevents error from propagating
})
</script>
