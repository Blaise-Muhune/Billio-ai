<template lang="pug">
.logo(:class="classes")
  svg(
    viewBox="0 0 100 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="svgClasses"
  )
    path(
      d="M20 10C26.0751 10 31 14.9249 31 21C31 27.0751 26.0751 32 20 32C13.9249 32 9 27.0751 9 21C9 14.9249 13.9249 10 20 10ZM20 13C15.5817 13 12 16.5817 12 21C12 25.4183 15.5817 29 20 29C24.4183 29 28 25.4183 28 21C28 16.5817 24.4183 13 20 13Z"
      class="fill-emerald-600"
    )
    path(
      d="M40 10h8c6.0751 0 11 4.9249 11 11c0 6.0751-4.9249 11-11 11h-8V10zm8 19c4.4183 0 8-3.5817 8-8c0-4.4183-3.5817-8-8-8h-5v16h5z"
      class="fill-emerald-600"
    )
    text(
      x="65"
      y="27"
      class="text-2xl font-bold fill-gray-900"
    ) AI
</template>

<script setup>
defineProps({
  classes: {
    type: String,
    default: ''
  },
  svgClasses: {
    type: String,
    default: 'w-full h-full'
  }
})
</script>

<style scoped>
.logo {
  display: inline-block;
}
</style> 