const DEFAULT_PAGE_TITLE = 'BilloAI'
// Base Vue config
import { createApp } from 'vue'
import App from './App.vue'

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
  document.title = to?.meta?.title ? to.meta.title : DEFAULT_PAGE_TITLE
})
app.use(router)

// Vuestic UI config
import { createVuestic } from 'vuestic-ui'
const vuestic = createVuestic({
  config: {
    colors: {
      primary: '#10B981', // emerald-500
      secondary: '#059669', // emerald-600
    },
  },
})
app.use(vuestic)

// Error handling
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}

app.mount('#app')
