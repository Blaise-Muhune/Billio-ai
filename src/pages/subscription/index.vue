<template lang="pug">
main(class="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-emerald-50")
  .max-w-7xl.mx-auto(class="px-4 sm:px-6 lg:px-8 py-12")
    .text-center.mb-12
      h1.text-4xl.font-bold.text-gray-900.mb-4 Choose Your Plan
      p.text-xl.text-gray-600 Select the plan that best fits your networking needs

    //- Plans Grid
    .grid(class="grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto")
      //- Free Plan
      .bg-white.rounded-2xl.shadow-lg.transition-all.duration-300(
        :class="currentPlan === 'FREE' ? 'border-2 border-emerald-500 transform scale-105 shadow-xl ring-4 ring-emerald-50' : 'border border-gray-100'"
        class="p-8"
      )
        .text-center
          .flex.items-center.justify-center.gap-2.mb-4(v-if="currentPlan === 'FREE'")
            VaIcon(name="stars" size="24px" class="text-emerald-500")
            span.text-emerald-600.font-medium Current Plan
          h2.text-2xl.font-bold.text-gray-900.mb-2 Free
          p.text-4xl.font-bold.text-gray-900.mb-4 $0
            span.text-base.font-normal.text-gray-600 /month
          p.text-gray-600.mb-6 Perfect for getting started with basic networking needs
          button(
            class="w-full px-6 py-3 rounded-xl transition-all duration-200"
            :class="currentPlan === 'FREE' ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            @click="selectPlan('FREE')"
            :disabled="true"
          ) {{ currentPlan === 'FREE' ? 'Current Plan' : 'Free Plan' }}
        .mt-8.space-y-4
          .flex.items-center.gap-3(v-for="feature in ['Up to 5 business cards', 'Basic card scanning', '3 email drafts per card', 'Basic digital profile', 'Basic QR code sharing', 'Save contacts as vCard', 'View-only social links', 'No events management', 'Community support']" :key="feature")
            VaIcon(name="check_circle" size="20px" class="text-emerald-500")
            span.text-gray-700 {{ feature }}

      //- Basic Plan
      .bg-white.rounded-2xl.shadow-lg.transition-all.duration-300(
        :class="currentPlan === 'BASIC' ? 'border-2 border-emerald-500 transform scale-105 shadow-xl ring-4 ring-emerald-50' : 'border border-gray-100'"
        class="p-8 relative"
      )
        .absolute.top-0.right-0.bg-emerald-500.text-white.px-4.py-1.rounded-bl-xl.rounded-tr-xl.text-sm.font-medium
          | Popular
        .text-center
          .flex.items-center.justify-center.gap-2.mb-4(v-if="currentPlan === 'BASIC'")
            VaIcon(name="stars" size="24px" class="text-emerald-500")
            span.text-emerald-600.font-medium Current Plan
          h2.text-2xl.font-bold.text-gray-900.mb-2 Basic
          p.text-4xl.font-bold.text-gray-900.mb-4 $9.99
            span.text-base.font-normal.text-gray-600 /month
          p.text-gray-600.mb-6 For growing professionals who need more networking capabilities
          button(
            class="w-full px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            :class="currentPlan === 'BASIC' ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'"
            @click="selectPlan('BASIC')"
            :disabled="loading || currentPlan === 'BASIC'"
          )
            .loading-spinner.w-4.h-4.border-2(v-if="loading")
            span(v-else) {{ currentPlan === 'BASIC' ? 'Current Plan' : 'Upgrade to Basic' }}
        .mt-8.space-y-4
          .flex.items-center.gap-3(v-for="feature in ['Up to 20 business cards', 'Advanced card scanning', '10 email drafts per card', 'Up to 5 events', 'Enhanced digital profile', 'Custom QR code design', 'Download QR codes', 'Full social media integration', 'AI email generation', 'Contact organization', 'Basic analytics', 'Priority email support']" :key="feature")
            VaIcon(name="check_circle" size="20px" class="text-emerald-500")
            span.text-gray-700 {{ feature }}

      //- Pro Plan
      .bg-white.rounded-2xl.shadow-lg.transition-all.duration-300(
        :class="currentPlan === 'PRO' ? 'border-2 border-emerald-500 transform scale-105 shadow-xl ring-4 ring-emerald-50' : 'border border-gray-100'"
        class="p-8 relative"
      )
        .absolute.top-0.right-0.bg-emerald-500.text-white.px-4.py-1.rounded-bl-xl.rounded-tr-xl.text-sm.font-medium
          | Best Value
        .text-center
          .flex.items-center.justify-center.gap-2.mb-4(v-if="currentPlan === 'PRO'")
            VaIcon(name="stars" size="24px" class="text-emerald-500")
            span.text-emerald-600.font-medium Current Plan
          h2.text-2xl.font-bold.text-gray-900.mb-2 Pro
          p.text-4xl.font-bold.text-gray-900.mb-4 $29.99
            span.text-base.font-normal.text-gray-600 /month
          p.text-gray-600.mb-6 For professionals who need unlimited networking capabilities
          button(
            class="w-full px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            :class="currentPlan === 'PRO' ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'"
            @click="selectPlan('PRO')"
            :disabled="loading || currentPlan === 'PRO'"
          )
            .loading-spinner.w-4.h-4.border-2(v-if="loading")
            span(v-else) {{ currentPlan === 'PRO' ? 'Current Plan' : 'Upgrade to Pro' }}
        .mt-8.space-y-4
          .flex.items-center.gap-3(v-for="feature in ['Unlimited business cards', 'Premium card scanning', 'Unlimited email drafts', 'Unlimited events', 'Premium digital profile', 'Custom QR code branding', 'Download business cards', 'Advanced social integration', 'Priority AI email generation', 'Advanced contact management', 'Network analytics', 'Custom branding options', 'Bulk card import', 'Premium support 24/7', 'Early access to new features']" :key="feature")
            VaIcon(name="check_circle" size="20px" class="text-emerald-500")
            span.text-gray-700 {{ feature }}

    //- Usage Stats
    .mt-12.bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-8
      .flex.items-center.justify-between.mb-8
        h2.text-2xl.font-bold.text-gray-900 Current Usage
        .flex.items-center.gap-2.text-sm
          VaIcon(name="info" size="16px" class="text-gray-400")
          span.text-gray-500 Usage resets monthly
      .grid(class="grid-cols-1 md:grid-cols-3 gap-8")
        //- Business Cards Usage
        .usage-stat
          .flex.items-center.justify-between.mb-4
            .flex.items-center.gap-2
              VaIcon(name="credit_card" size="20px" class="text-emerald-500")
              span.text-gray-700.font-medium Business Cards
            span.text-sm.text-gray-500 {{ usageStats.cards }}/{{ planLimits.cards.limit }}
          .w-full.bg-gray-100.rounded-full.h-3.mb-2
            .bg-emerald-500.rounded-full.h-full.transition-all.duration-500(
              :style="{ width: `${Math.min((usageStats.cards / planLimits.cards.limit) * 100, 100)}%` }"
            )
          .flex.items-center.justify-between.text-sm
            span.text-gray-500 {{ planLimits.cards.remaining }} remaining
            span.text-emerald-600.font-medium {{ Math.round((usageStats.cards / planLimits.cards.limit) * 100) }}% used

        //- Events Usage
        .usage-stat
          .flex.items-center.justify-between.mb-4
            .flex.items-center.gap-2
              VaIcon(name="event" size="20px" class="text-emerald-500")
              span.text-gray-700.font-medium Events
            span.text-sm.text-gray-500 {{ usageStats.events }}/{{ planLimits.events.limit }}
          .w-full.bg-gray-100.rounded-full.h-3.mb-2
            .bg-emerald-500.rounded-full.h-full.transition-all.duration-500(
              :style="{ width: `${Math.min((usageStats.events / planLimits.events.limit) * 100, 100)}%` }"
            )
          .flex.items-center.justify-between.text-sm
            span.text-gray-500 {{ planLimits.events.remaining }} remaining
            span.text-emerald-600.font-medium {{ Math.round((usageStats.events / planLimits.events.limit) * 100) }}% used

        //- Email Drafts Usage
        .usage-stat
          .flex.items-center.justify-between.mb-4
            .flex.items-center.gap-2
              VaIcon(name="email" size="20px" class="text-emerald-500")
              span.text-gray-700.font-medium Email Drafts
            span.text-sm.text-gray-500 {{ usageStats.totalDrafts }}/{{ planLimits.draftsPerCard.limit }}
          .w-full.bg-gray-100.rounded-full.h-3.mb-2
            .bg-emerald-500.rounded-full.h-full.transition-all.duration-500(
              :style="{ width: `${Math.min((usageStats.totalDrafts / planLimits.draftsPerCard.limit) * 100, 100)}%` }"
            )
          .flex.items-center.justify-between.text-sm
            span.text-gray-500 {{ planLimits.draftsPerCard.limit - usageStats.totalDrafts }} remaining
            span.text-emerald-600.font-medium {{ Math.round((usageStats.totalDrafts / planLimits.draftsPerCard.limit) * 100) }}% used
          .mt-3.pt-3.border-t.border-gray-100
            .text-xs.text-gray-500 {{ planLimits.draftsPerCard.limit }} drafts per card

    //- Cancel Subscription Button
    .mt-8.text-center(v-if="currentPlan !== 'FREE' && subscriptionStatus !== 'canceled'")
      button(
        class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 border border-red-200"
        @click="confirmCancelSubscription"
        :disabled="canceling"
      ) 
        VaIcon(name="warning" size="20px")
        span(v-if="!canceling") Cancel Subscription
        span(v-else) Canceling...

    //- Subscription Status Message
    .mt-4.text-center(v-if="subscriptionStatus === 'canceled'")
      .inline-flex.items-center.gap-2.text-gray-600
        VaIcon(name="info" size="20px" class="text-gray-400")
        span Your subscription will end at the end of the current billing period.
      .text-sm.text-gray-500.mt-2 You can resubscribe at any time to regain access to premium features.

    //- Cancel Confirmation Modal
    VaModal(
      v-model="showCancelModal"
      :hide-default-actions="true"
      class="rounded-2xl"
    )
      .p-8
        .flex.items-start.gap-4.mb-6
          .flex-shrink-0
            VaIcon(name="warning" size="32px" class="text-red-500")
          div
            h3.text-2xl.font-bold.mb-2 Cancel Subscription
            p.text-gray-600 You'll continue to have access to all {{ currentPlan }} plan features until the end of your current billing period.
            .mt-4.p-4.bg-emerald-50.rounded-xl.border.border-emerald-100
              .flex.items-start.gap-3
                VaIcon(name="info" size="20px" class="text-emerald-500 mt-1")
                div
                  p.text-sm.font-medium.text-emerald-700 Current Access Period
                  p.text-sm.text-emerald-600 You can use all {{ currentPlan }} features until {{ formatDate(subscriptionEndDate) }}
            ul.mt-4.space-y-2.text-sm.text-gray-600
              li.flex.items-center.gap-2
                VaIcon(name="close" size="16px" class="text-red-500")
                span After {{ formatDate(subscriptionEndDate) }}, you'll lose access to:
              li.flex.items-center.gap-2.ml-6
                VaIcon(name="arrow_right" size="16px" class="text-gray-400")
                span Unlimited business cards
              li.flex.items-center.gap-2.ml-6
                VaIcon(name="arrow_right" size="16px" class="text-gray-400")
                span Unlimited email drafts
              li.flex.items-center.gap-2.ml-6
                VaIcon(name="arrow_right" size="16px" class="text-gray-400")
                span Unlimited events
        .flex.justify-end.gap-4
          button(
            class="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
            @click="showCancelModal = false"
          ) Keep Subscription
          button(
            class="px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all duration-300 flex items-center gap-2"
            @click="cancelSubscription"
            :disabled="canceling"
          )
            .loading-spinner.w-4.h-4.border-2(v-if="canceling")
            span(v-else) Yes, Cancel Subscription
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { paymentService } from '../../services/paymentService';
import { SUBSCRIPTION_PLANS, checkPlanLimits } from '../../config/stripe';
import { authService } from '../../services/authService';
import { formatDate } from '../../utils/dateUtils';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const canceling = ref(false);
const showCancelModal = ref(false);
const currentPlan = ref('FREE');
const subscriptionStatus = ref(null);
const usageStats = ref({
  cards: 0,
  events: 0,
  draftsPerCard: {},
  totalDrafts: 0
});

// Add subscription end date
const subscriptionEndDate = ref(null);

// Compute plan limits based on current usage
const planLimits = computed(() => {
  return checkPlanLimits(currentPlan.value, usageStats.value);
});

// Load subscription status and usage stats
async function loadSubscriptionData() {
  try {
    loading.value = true;

    // Wait for auth state to be ready
    await new Promise((resolve) => {
      const unsubscribe = authService.onAuthStateChanged((user) => {
        if (user) {
          unsubscribe();
          resolve();
        }
      });
    });

    const [subscription, usage] = await Promise.all([
      paymentService.getSubscriptionStatus(),
      paymentService.getUsageStats()
    ]);
    
    currentPlan.value = subscription.plan;
    subscriptionStatus.value = subscription.subscriptionStatus;
    subscriptionEndDate.value = subscription.currentPeriodEnd;
    usageStats.value = usage;

    // Handle success/canceled states from Stripe Checkout
    if (route.query.success) {
      alert('Thank you for your subscription!');
    } else if (route.query.canceled) {
      alert('Subscription canceled. Feel free to try again when you\'re ready.');
    }

    // Clear the URL parameters
    if (route.query.success || route.query.canceled) {
      router.replace('/subscription');
    }
  } catch (error) {
    console.error('Error loading subscription data:', error);
    // If user is not logged in, redirect to login
    if (error.message === 'User must be logged in') {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
}

// Handle plan selection
async function selectPlan(plan) {
  if (plan === currentPlan.value) return;
  
  try {
    loading.value = true;
    if (plan === 'FREE') {
      await paymentService.cancelSubscription();
      currentPlan.value = plan;
      subscriptionStatus.value = 'canceled';
    } else {
      const priceId = SUBSCRIPTION_PLANS[plan].stripePriceId;
      if (!priceId) {
        throw new Error(`Price ID not configured for ${plan} plan. Please check your environment variables.`);
      }
      
      // Create subscription and redirect to Stripe Checkout
      await paymentService.createSubscription(priceId);
    }
  } catch (error) {
    console.error('Error selecting plan:', error);
    alert(error.message || 'Failed to select plan. Please try again.');
  } finally {
    loading.value = false;
  }
}

// Handle subscription cancellation
async function confirmCancelSubscription() {
  showCancelModal.value = true;
}

async function cancelSubscription() {
  try {
    canceling.value = true;
    await paymentService.cancelSubscription();
    subscriptionStatus.value = 'canceled';
    showCancelModal.value = false;
    // Reload usage stats after cancellation
    await loadSubscriptionData();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    alert(error.message || 'Failed to cancel subscription. Please try again.');
  } finally {
    canceling.value = false;
  }
}

onMounted(() => {
  loadSubscriptionData();
});
</script>

<style scoped>
.usage-stat {
  @apply p-6 bg-gray-50 rounded-xl;
}

.loading-spinner {
  @apply animate-spin rounded-full border-t-2 border-b-2 border-white h-4 w-4 mx-auto;
}
</style> 