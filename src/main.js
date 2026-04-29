const DEFAULT_PAGE_TITLE = 'BilloAI'
const DEFAULT_PAGE_DESCRIPTION = 'Scan cards into contacts, share a live profile + QR, and draft follow-ups—networking without retyping or spreadsheet limbo.'
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
import { authService } from './services/authService'
import { getFirebaseUserWhenReady } from './utils/authReady'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
if(import.meta.hot) {
  handleHotUpdate(router)
}

function applyRouteMeta(to) {
  document.title = to?.meta?.title ? to.meta.title : DEFAULT_PAGE_TITLE

  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute('content', to?.meta?.description || DEFAULT_PAGE_DESCRIPTION)
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')
  const twitterTitle = document.querySelector('meta[name="twitter:title"]')
  if (ogTitle) ogTitle.setAttribute('content', to?.meta?.title || DEFAULT_PAGE_TITLE)
  if (twitterTitle) twitterTitle.setAttribute('content', to?.meta?.title || DEFAULT_PAGE_TITLE)

  const ogDescription = document.querySelector('meta[property="og:description"]')
  const twitterDescription = document.querySelector('meta[name="twitter:description"]')
  if (ogDescription) ogDescription.setAttribute('content', to?.meta?.description || DEFAULT_PAGE_DESCRIPTION)
  if (twitterDescription) twitterDescription.setAttribute('content', to?.meta?.description || DEFAULT_PAGE_DESCRIPTION)
}

router.beforeEach(async (to, from, next) => {
  applyRouteMeta(to)

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  const requiresGuest = to.matched.some((r) => r.meta.requiresGuest)

  let user = null
  try {
    user = await getFirebaseUserWhenReady()
  } catch (e) {
    console.error('Auth initialization error:', e)
  }

  if (requiresAuth && !user) {
    next({ path: '/auth', query: { redirect: to.fullPath } })
    return
  }

  if (requiresGuest && user) {
    try {
      const profile = await authService.getUserProfile()
      next(profile?.profileCompleted ? '/home' : '/profile-setup')
    } catch {
      next('/home')
    }
    return
  }

  const allowIncompleteProfile =
    to.path === '/profile-setup' ||
    to.path === '/auth' ||
    to.path === '/privacy-policy' ||
    to.path === '/demo' ||
    /^\/profile\/[^/]+$/.test(to.path)

  if (user && !allowIncompleteProfile) {
    try {
      const profile = await authService.getUserProfile()
      if (!profile?.profileCompleted) {
        next({ path: '/profile-setup' })
        return
      }
    } catch (e) {
      console.error('Profile gate error:', e)
    }
  }

  next()
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
