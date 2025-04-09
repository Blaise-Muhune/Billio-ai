import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// Baseline Helpers
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { VuesticPlugin } from 'vuestic-ui/vite-plugin'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    AutoImport({ imports: [
      'vue', 'pinia', //'vue-router', // presets from github.com/unjs/unimport used by unplugin-auto-import
      VueRouterAutoImports, // swap 'vue-router' for VueRouterAutoImports from unplugin-vue-router
      //{ '@/store/auth.js': ['useAuthStore']}, // Pinia auth store
    ]}),
    Components(),
    VueRouter({
      routeBlockLang: 'yaml',
      routesFolder: 'src/pages',
      dts: 'typed-router.d.ts',
    }),
    AutoImport({
      imports: ['vue', 'vue-router'],
      dts: 'auto-imports.d.ts',
    }),
    Components({
      dirs: ['src/components'],
      dts: 'components.d.ts',
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag === 'pug' || tag === 'Analytics'
        }
      }
    }),
    VuesticPlugin({
      styles: 'minimal',
    }),
    // Add legacy browser support
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Improve SEO performance
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          vuestic: ['vuestic-ui'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage']
        }
      }
    },
    // Improve performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Generate preload directives for main chunks
    modulePreload: {
      polyfill: true
    }
  },
  //base: "/subdir/",
})
