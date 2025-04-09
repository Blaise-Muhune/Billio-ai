const DEFAULT_PAGE_TITLE = 'BilloAI'
const DEFAULT_PAGE_DESCRIPTION = 'Digitize your business cards with AI. Save time, stay organized, and never lose a contact again. Try BilloAI for free today.'
// Base Vue config
import { createApp } from 'vue'
import App from './App.vue'
import { inject } from '@vercel/analytics';

// Import styles first
import 'vuestic-ui/styles/essential.css'
import 'vuestic-ui/styles/typography.css'
import 'vuestic-ui/styles/reset.css'
import 'vuestic-ui/styles/grid.css'
import './index.css'

const app = createApp(App)

// Vue Router with unplugin-vue-router config
import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
if(import.meta.hot) {
  handleHotUpdate(router)
}
router.beforeEach((to)=> {
  // Update page title for SEO
  document.title = to?.meta?.title ? to.meta.title : DEFAULT_PAGE_TITLE
  
  // Update meta description for SEO
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute('content', to?.meta?.description || DEFAULT_PAGE_DESCRIPTION)
  }
  
  // Update Open Graph and Twitter meta tags
  const ogTitle = document.querySelector('meta[property="og:title"]')
  const twitterTitle = document.querySelector('meta[name="twitter:title"]')
  if (ogTitle) ogTitle.setAttribute('content', to?.meta?.title || DEFAULT_PAGE_TITLE)
  if (twitterTitle) twitterTitle.setAttribute('content', to?.meta?.title || DEFAULT_PAGE_TITLE)
  
  const ogDescription = document.querySelector('meta[property="og:description"]')
  const twitterDescription = document.querySelector('meta[name="twitter:description"]')
  if (ogDescription) ogDescription.setAttribute('content', to?.meta?.description || DEFAULT_PAGE_DESCRIPTION)
  if (twitterDescription) twitterDescription.setAttribute('content', to?.meta?.description || DEFAULT_PAGE_DESCRIPTION)
})
app.use(router)

// Vuestic UI config
import { createVuestic } from 'vuestic-ui'
app.use(createVuestic({
  config: {
    colors: {
      primary: '#10B981', // emerald-500
      secondary: '#059669', // emerald-600
    },
  },
}))

// Error handling
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}
inject({
  projectId: 'prj_KCUOU8lnC6afUsLFtAHDIP6xZICt', // Replace with your actual Vercel project ID
});

app.mount('#app')
