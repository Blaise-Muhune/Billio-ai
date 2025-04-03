import { Analytics } from '@vercel/analytics/vue';
<template lang="pug">
.min-h-screen.bg-gray-50
  RouterView
  Analytics
</template>

<script setup>
import { onErrorCaptured } from 'vue'

onErrorCaptured((err, instance, info) => {
  console.error('Error captured in App.vue:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
  return false // prevents error from propagating
})
</script>
