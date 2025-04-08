<template lang="pug">
.min-h-screen.flex.items-center.justify-center.bg-gradient-to-br.from-emerald-50.to-teal-50.py-12.px-4(class="sm:px-6 lg:px-8")
  .max-w-md.w-full
    // Header
    .text-center.mb-10
      .mx-auto.w-32.h-12.mb-4
        Logo
      h2.text-4xl.font-bold.tracking-tight.text-gray-900.mb-2 Welcome Back
      p.text-base.text-gray-600 {{ isSignUp ? 'Create your account to get started' : 'Sign in to manage your business cards' }}
    
    // Main Card
    .bg-white.rounded-2xl.shadow-xl.p-8.space-y-6
      // Success Alert for Email Verification
      transition(
        enter-active-class="transition ease-out duration-300"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      )
        .bg-emerald-50.border-l-4.border-emerald-400.p-4.rounded-md(
          v-if="successMessage"
          role="alert"
        )
          .flex
            .flex-shrink-0
              VaIcon(name="check_circle" size="20px" class="text-emerald-500")
            .ml-3
              p.text-sm.text-emerald-700 {{ successMessage }}
            .pl-3.ml-auto
              .flex
                button.inline-flex.text-emerald-400.hover_text-emerald-500.focus_outline-none(
                  @click="successMessage = ''"
                )
                  span.sr-only Close
                  VaIcon(name="close" size="20px")

      // Error Alert
      transition(
        enter-active-class="transition ease-out duration-300"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      )
        .bg-red-50.border-l-4.border-red-400.p-4.rounded-md(
          v-if="error"
          role="alert"
        )
          .flex
            .flex-shrink-0
              svg.h-5.w-5.text-red-400(
                viewBox="0 0 20 20"
                fill="currentColor"
              )
                path(
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                )
            .ml-3
              p.text-sm.text-red-700 {{ error }}
            .pl-3.ml-auto
              .flex
                button.inline-flex.text-red-400.hover_text-red-500.focus_outline-none(
                  @click="error = ''"
                )
                  span.sr-only Close
                  svg.h-5.w-5(
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  )
                    path(
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    )

      // Verification Notice
      .bg-blue-50.border-l-4.border-blue-400.p-4.rounded-md(
        v-if="showVerificationNotice"
        role="alert"
      )
        .flex.items-start
          .flex-shrink-0
            VaIcon(name="info" size="20px" class="text-blue-500 mt-0.5")
          .ml-3
            p.text-sm.text-blue-700.font-medium Please verify your email
            p.text-sm.text-blue-600.mt-1 We've sent a verification link to your email address. Please check your inbox and verify your email to continue.
            button.mt-2.text-sm.font-medium.text-blue-700.hover_text-blue-800.underline(
              @click="resendVerification"
              :disabled="loading"
            ) Resend verification email

      // Auth Form
      form.space-y-6(@submit.prevent="isSignUp ? handleSignUp() : handleSignIn()")
        // Email Input
        .space-y-2
          label.block.text-sm.font-medium.text-gray-700(for="email") Email address
          .relative.rounded-md.shadow-sm
            input#email.appearance-none.block.w-full.px-4.py-3.border.border-gray-300.rounded-lg.placeholder-gray-400.focus_outline-none.focus_ring-2.focus_ring-emerald-500.focus_border-emerald-500(
              v-model="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': error }"
            )
        
        // Password Input
        .space-y-2
          label.block.text-sm.font-medium.text-gray-700(for="password") Password
          .relative.rounded-md.shadow-sm
            input#password.appearance-none.block.w-full.px-4.py-3.border.border-gray-300.rounded-lg.placeholder-gray-400.focus_outline-none.focus_ring-2.focus_ring-emerald-500.focus_border-emerald-500(
              v-model="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              :minlength="isSignUp ? 6 : undefined"
              :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': error }"
            )

        // Auth Actions
        .flex.items-center.justify-between
          .flex.items-center
            input#remember-me.h-4.w-4.text-emerald-600.focus_ring-emerald-500.border-gray-300.rounded(
              type="checkbox"
              v-model="rememberMe"
            )
            label.ml-2.block.text-sm.text-gray-700(for="remember-me") Remember me
          
          .text-sm(v-if="!isSignUp")
            a.font-medium.text-emerald-600.hover_text-emerald-700.transition-colors(
              href="#"
              @click.prevent="handleResetPassword"
            ) Forgot password?

        // Submit Button
        button.relative.w-full.flex.justify-center.py-3.px-4.border.border-transparent.text-sm.font-medium.rounded-lg.text-white.bg-gradient-to-r.from-emerald-500.to-teal-600.hover_from-emerald-600.hover_to-teal-700.focus_outline-none.focus_ring-2.focus_ring-offset-2.focus_ring-emerald-500.transition-all.duration-150.ease-in-out(
          type="submit"
          :disabled="loading"
        )
          span.absolute.left-0.inset-y-0.flex.items-center.pl-3(v-if="!loading")
            svg.h-5.w-5.text-emerald-100.group-hover_text-emerald-200(
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            )
              path(
                fill-rule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clip-rule="evenodd"
              )
          span.flex.items-center.justify-center
            span.loader.w-5.h-5.border-2.border-white.border-t-transparent.rounded-full.animate-spin.mr-2(
              v-if="loading"
            )
            span {{ loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In') }}

        // Divider
        .relative.my-6
          .absolute.inset-0.flex.items-center
            .w-full.border-t.border-gray-200
          .relative.flex.justify-center.text-sm
            span.px-2.bg-white.text-gray-500 Or continue with

        // Google Sign In Button
        button.w-full.flex.items-center.justify-center.px-4.py-3.border.border-gray-300.rounded-lg.shadow-sm.bg-white.text-sm.font-medium.text-gray-700.hover_bg-gray-50.focus_outline-none.focus_ring-2.focus_ring-offset-2.focus_ring-emerald-500.transition-colors(
          type="button"
          @click="handleGoogleSignIn"
          :disabled="loading"
        )
          img.w-5.h-5.mr-2(
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          )
          span Sign {{ isSignUp ? 'up' : 'in' }} with Google

        // Toggle Sign In/Up
        .text-sm.text-center.mt-6
          span.text-gray-600 {{ isSignUp ? 'Already have an account?' : 'Need an account?' }}
          a.font-medium.text-emerald-600.hover_text-emerald-700.transition-colors.ml-1(
            href="#"
            @click.prevent="isSignUp = !isSignUp"
          ) {{ isSignUp ? 'Sign in' : 'Sign up' }}
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../../services/authService'
import Logo from '../../components/Logo.vue'

const router = useRouter()
const route = useRoute()

// Form state
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isSignUp = ref(false)
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const showVerificationNotice = ref(false)

// Handle email/password sign in
const handleSignIn = async () => {
  try {
    loading.value = true;
    error.value = '';
    const user = await authService.signInWithEmailAndPassword(email.value, password.value);
    
    if (!user.emailVerified) {
      showVerificationNotice.value = true;
      return;
    }
    
    // If email is verified, redirect to profile setup if needed
    const userProfile = await authService.getUserProfile();
    if (!userProfile) {
      router.push('/profile-setup');
    } else {
      router.push('/profile-setup');
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Handle email/password sign up
const handleSignUp = async () => {
  try {
    loading.value = true;
    error.value = '';
    await authService.createUserWithEmailAndPassword(email.value, password.value);
    showVerificationNotice.value = true;
    successMessage.value = 'Account created successfully! Please check your email to verify your address. After verification, you can sign in to complete your profile.';
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Handle Google sign in
const handleGoogleSignIn = async () => {
  try {
    loading.value = true
    error.value = ''
    await authService.signInWithGoogle()
    router.push('/home')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Handle password reset
const handleResetPassword = async () => {
  if (!email.value) {
    error.value = 'Please enter your email address'
    return
  }

  try {
    loading.value = true
    error.value = ''
    await authService.sendPasswordResetEmail(email.value)
    error.value = 'Password reset email sent. Please check your inbox.'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Resend verification email
const resendVerification = async () => {
  try {
    loading.value = true
    error.value = ''
    await authService.sendEmailVerification()
    successMessage.value = 'Verification email sent! Please check your inbox.'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Check for email verification success
onMounted(() => {
  if (route.query.verified === 'true') {
    successMessage.value = 'Email verified successfully! Please sign in to complete your profile.';
    isSignUp.value = false; // Switch to sign in mode
  }
})
</script>

<style scoped>
.loader {
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 