<template lang="pug">
.flex-1.flex.items-center.justify-center.p-8
  .max-w-4xl.w-full
    div(class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center")
      //- Left Column - App Info
      .space-y-8
        .space-y-4
          h1.text-4xl.font-bold.text-gray-900 Billo AI
          p.text-xl.text-gray-600 Transform your business card management with AI-powered organization and communication.
        
        //- Features Grid
        .grid.grid-cols-1.gap-6
          .flex.items-start.gap-4
            .bg-emerald-100.p-3.rounded-xl
              VaIcon(name="qr_code" size="24px" class="text-emerald-600")
            .space-y-2
              h3.text-lg.font-semibold.text-gray-900 Smart Card Scanning
              p.text-gray-600 Instantly digitize business cards with advanced OCR technology
          
          .flex.items-start.gap-4
            .bg-emerald-100.p-3.rounded-xl
              VaIcon(name="smart_toy" size="24px" class="text-emerald-600")
            .space-y-2
              h3.text-lg.font-semibold.text-gray-900 AI-Powered Organization
              p.text-gray-600 Automatically categorize and organize your contacts by event
          
          .flex.items-start.gap-4
            .bg-emerald-100.p-3.rounded-xl
              VaIcon(name="email" size="24px" class="text-emerald-600")
            .space-y-2
              h3.text-lg.font-semibold.text-gray-900 Smart Message Drafts
              p.text-gray-600 Generate personalized follow-up messages with AI assistance
          
          .flex.items-start.gap-4
            .bg-emerald-100.p-3.rounded-xl
              VaIcon(name="group" size="24px" class="text-emerald-600")
            .space-y-2
              h3.text-lg.font-semibold.text-gray-900 Event Management
              p.text-gray-600 Organize contacts by events and conferences for better networking

        //- Trust Indicators
        .pt-4
          .flex.items-center.gap-6
            .text-center
              .text-3xl.font-bold.text-emerald-600 100%
              .text-sm.text-gray-600 Secure
            .text-center
              .text-3xl.font-bold.text-emerald-600 24/7
              .text-sm.text-gray-600 Available
            .text-center
              .text-3xl.font-bold.text-emerald-600 1000+
              .text-sm.text-gray-600 Users

      //- Right Column - Auth Forms
      .bg-white.rounded-2xl.shadow-xl.p-8.space-y-8
        //- Tabs
        .flex.space-x-4.border-b.border-gray-200
          button(
            class="px-4 py-2 text-sm font-medium transition-colors duration-200"
            :class="activeTab === 'login' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'login'"
          ) Sign In
          button(
            class="px-4 py-2 text-sm font-medium transition-colors duration-200"
            :class="activeTab === 'signup' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'signup'"
          ) Create Account

        //- Login Form
        form(v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="space-y-6")
          .space-y-4
            label.block.text-sm.font-medium.text-gray-700 Email
            input(
              type="email"
              v-model="loginForm.email"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            )
          .space-y-4
            label.block.text-sm.font-medium.text-gray-700 Password
            input(
              type="password"
              v-model="loginForm.password"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            )
          button(
            type="submit"
            class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2"
            :disabled="loading"
          )
            .loading-spinner.w-5.h-5.border-2(v-if="loading")
            span(v-else) Sign In

        //- Signup Form
        form(v-else @submit.prevent="handleSignup" class="space-y-6")
          .space-y-4
            label.block.text-sm.font-medium.text-gray-700 Full Name
            input(
              type="text"
              v-model="signupForm.name"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            )
          .space-y-4
            label.block.text-sm.font-medium.text-gray-700 Email
            input(
              type="email"
              v-model="signupForm.email"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            )
          .space-y-4
            label.block.text-sm.font-medium.text-gray-700 Password
            input(
              type="password"
              v-model="signupForm.password"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Create a password"
              required
            )
          button(
            type="submit"
            class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2"
            :disabled="loading"
          )
            .loading-spinner.w-5.h-5.border-2(v-if="loading")
            span(v-else) Create Account

        //- Social Login
        .relative
          .absolute.inset-0.flex.items-center
            .w-full.border-t.border-gray-200
          .relative.flex.justify-center.text-sm
            span.px-2.bg-white.text-gray-500 Or continue with
        .grid.grid-cols-2.gap-4
          button(
            class="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            @click="handleGoogleLogin"
          )
            VaIcon(name="google" size="18px" class="text-gray-700")
            span.text-sm.font-medium.text-gray-700 Google
          button(
            class="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            @click="handleGithubLogin"
          )
            VaIcon(name="code" size="18px" class="text-gray-700")
            span.text-sm.font-medium.text-gray-700 GitHub
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/authService'

const router = useRouter()
const activeTab = ref('login')
const loading = ref(false)

const loginForm = ref({
  email: '',
  password: ''
})

const signupForm = ref({
  name: '',
  email: '',
  password: ''
})

async function handleLogin() {
  loading.value = true
  try {
    await authService.signInWithEmailAndPassword(loginForm.value.email, loginForm.value.password)
    router.push('/')
  } catch (error) {
    console.error('Login error:', error)
    // TODO: Show error message to user
  } finally {
    loading.value = false
  }
}

async function handleSignup() {
  loading.value = true
  try {
    await authService.createUserWithEmailAndPassword(
      signupForm.value.email,
      signupForm.value.password,
      signupForm.value.name
    )
    router.push('/')
  } catch (error) {
    console.error('Signup error:', error)
    // TODO: Show error message to user
  } finally {
    loading.value = false
  }
}

async function handleGoogleLogin() {
  loading.value = true
  try {
    await authService.signInWithGoogle()
    router.push('/')
  } catch (error) {
    console.error('Google login error:', error)
    // TODO: Show error message to user
  } finally {
    loading.value = false
  }
}

async function handleGithubLogin() {
  loading.value = true
  try {
    await authService.signInWithGithub()
    router.push('/')
  } catch (error) {
    console.error('GitHub login error:', error)
    // TODO: Show error message to user
  } finally {
    loading.value = false
  }
}
</script>

<style>
.loading-spinner {
  border-color: white;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 