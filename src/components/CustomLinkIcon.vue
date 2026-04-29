<template lang="pug">
//- User-uploaded icon first; no-referrer helps some CDNs; @error falls through to brand / default
img(
  v-if="showUserImage"
  :src="userFacingSrc"
  :class="imgClass"
  :alt="altText"
  loading="lazy"
  referrerpolicy="no-referrer"
  decoding="async"
  @error="onUserImgError"
)
//- Bundled brand SVG (Cash App, Venmo, …) when URL matches
img(
  v-else-if="brandSrc && !brandFailed"
  :src="brandSrc"
  :class="imgClass"
  :alt="altText"
  loading="lazy"
  decoding="async"
  @error="brandFailed = true"
)
VaIcon(v-else :name="fallbackIcon" :size="fallbackSize" :class="fallbackClass")
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getCustomLinkBrandSlug, brandIconPublicPath } from '../utils/customLinkBrand'

const props = defineProps({
  link: { type: Object, required: true },
  imgClass: { type: String, default: 'w-5 h-5 object-contain' },
  fallbackIcon: { type: String, default: 'link' },
  fallbackSize: { type: String, default: '20px' },
  fallbackClass: { type: String, default: 'text-gray-700' },
})

const userImgFailed = ref(false)
const brandFailed = ref(false)

const altText = computed(() => props.link?.name || 'Link')

const brandSlug = computed(() => getCustomLinkBrandSlug(props.link))
const brandSrc = computed(() => brandIconPublicPath(brandSlug.value))

const userFacingSrc = computed(() => props.link?.previewUrl || props.link?.iconUrl || '')

const showUserImage = computed(() => Boolean(userFacingSrc.value) && !userImgFailed.value)

watch(
  () => [props.link?.previewUrl, props.link?.iconUrl, props.link?.url, props.link?.name],
  () => {
    userImgFailed.value = false
    brandFailed.value = false
  },
)

function onUserImgError() {
  userImgFailed.value = true
}
</script>
