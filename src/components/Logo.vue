<template lang="pug">
span.logo(
  :class="classes"
  aria-label="BilloAI"
  role="img"
)
  span.wordmark
    span.wordmark__billo Billo
    span.wordmark__ai AI
</template>

<script setup>
defineProps({
  classes: {
    type: String,
    default: ''
  },
  svgClasses: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.logo {
  display: inline-block;
  line-height: 1;
}

.wordmark {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.02em;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(1.75rem, 5vw, 2.25rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.wordmark__billo {
  background: linear-gradient(105deg, #059669 0%, #0d9488 45%, #14b8a6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.wordmark__ai {
  color: #0f172a;
}
</style>
