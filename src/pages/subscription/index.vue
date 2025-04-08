<template lang="pug">
main(class="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-emerald-50")
  .max-w-7xl.mx-auto(class="px-4 sm:px-6 lg:px-8 py-12")
    //- Home Button
    .flex.justify-end.mb-8
      button(
        @click="router.push('/home')"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 border border-gray-200 shadow-sm hover:shadow"
      )
        VaIcon(name="home" size="20px")
        span.font-medium Return Home

    .text-center.mb-12
      h1.text-4xl.font-bold.text-gray-900.mb-4 Choose Your Plan
      p.text-xl.text-gray-600 Select the plan that best fits your networking needs
      
    //- Billing Toggle (Monthly/Yearly)
    .flex.justify-center.mb-10
      .bg-gray-100.p-1.rounded-xl.inline-flex
        button(
          @click="billingCycle = 'monthly'"
          :class="{'bg-white shadow text-gray-800': billingCycle === 'monthly', 'text-gray-500 hover:text-gray-700': billingCycle !== 'monthly'}"
          class="px-5 py-2 rounded-lg transition-all duration-200 font-medium"
        ) Monthly
        button(
          @click="billingCycle = 'yearly'"
          :class="{'bg-white shadow text-gray-800': billingCycle === 'yearly', 'text-gray-500 hover:text-gray-700': billingCycle !== 'yearly'}"
          class="px-5 py-2 rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
        ) 
          span Yearly
          span.bg-emerald-100.text-emerald-700.text-xs.rounded-full.font-medium(class="px-2 py-0.5") Save 20%

    //- Plans Grid
    .plans
      .plan(
        v-for="(plan, index) in ['FREE', 'BASIC', 'PRO']"
        :key="index"
        :class="{ active: plan === currentPlan, free: plan === 'FREE', basic: plan === 'BASIC', pro: plan === 'PRO' }"
      )
        .plan__content
          .plan__header
            .flex.items-center.justify-between
              h3 {{ plan }}
              //- Show billing cycle badge for current plan
              .plan-badge(v-if="plan === currentPlan && plan !== 'FREE'")
                span.text-xs.font-medium.px-2.py-1.rounded-full.text-white(
                  :class="userBillingCycle === 'yearly' ? 'bg-emerald-500' : 'bg-blue-500'"
                ) {{ userBillingCycle === 'yearly' ? 'Yearly' : 'Monthly' }}
            .plan__price
              template(v-if="plan === 'FREE'")
                span.plan__amount $0
                span.plan__period Forever
              template(v-else)
                .price-container
                  span.plan__amount ${{ getPlanPrice(plan, billingCycle) }}
                  span.plan__period /{{ billingCycle === 'monthly' ? 'month' : 'year' }}
                .original-price(v-if="billingCycle === 'yearly'")
                  s ${{ getFullYearlyPrice(plan) }}
                  span.savings Save ${{ getYearlySavings(plan) }}
          
          .plan__features
            .plan__feature(
              v-for="(feature, i) in getPlanFeatures(plan)"
              :key="i"
            )
              .plan__feature-icon
                svg(xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check")
                  polyline(points="20 6 9 17 4 12")
              .plan__feature-text {{ feature }}
          
          .plan__cta
            button.plan__button.current(
              v-if="plan === currentPlan && (plan === 'FREE' || billingCycle === userBillingCycle)"
              disabled
            ) Current Plan
            button.plan__button.downgrade(
              v-else-if="plan === 'FREE' && (currentPlan === 'BASIC' || currentPlan === 'PRO')"
              @click="selectPlan(plan)"
              :disabled="loading"
            ) {{ loading ? 'Loading...' : 'Downgrade' }}
            button.plan__button(
              v-else
              @click="selectPlan(plan, billingCycle)"
              :disabled="loading"
            ) {{ loading ? 'Loading...' : plan === currentPlan && billingCycle !== userBillingCycle ? 'Switch to ' + billingCycle : plan === 'FREE' ? 'Select' : 'Upgrade' }}

    //- Usage Stats
    .mt-12.bg-white.rounded-2xl.shadow-lg.border.border-gray-100.p-8
      .flex.items-center.justify-between.mb-8
        .flex.items-center.gap-3
          h2.text-2xl.font-bold.text-gray-900 Current Usage
          //- Show plan with billing cycle
          .inline-flex.items-center.px-3.py-1.rounded-lg.text-sm.font-medium(
            :class="{ 'bg-gray-100 text-gray-700': currentPlan === 'FREE', 'bg-blue-100 text-blue-800': currentPlan === 'BASIC', 'bg-emerald-100 text-emerald-800': currentPlan === 'PRO' }"
          )
            span {{ currentPlan }}
            span.mx-1(v-if="currentPlan !== 'FREE'") •
            span(v-if="currentPlan !== 'FREE'") {{ userBillingCycle === 'yearly' ? 'Yearly' : 'Monthly' }}
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
            p.text-gray-600 
              | You'll continue to have access to all 
              span.font-medium {{ currentPlan }} 
              span ({{ billingCycle === 'yearly' ? 'Yearly' : 'Monthly' }})
              |  plan features until the end of your current billing period.
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

    //- Success Modal
    VaModal(
      v-model="showSuccessModal"
      :hide-default-actions="true"
      class="rounded-2xl"
    )
      .p-8.text-center
        //- Success Animation
        .success-animation.mb-6
          .checkmark-circle
            .checkmark.draw

        //- Welcome Message
        h2.text-3xl.font-bold.text-gray-900.mb-4 Welcome to {{ selectedPlan }}!
        p.text-xl.text-gray-600.mb-8 Thank you for subscribing to BilloAI. Your journey to better networking starts now.

        //- Subscription Info
        .bg-emerald-50.rounded-xl.p-6.mb-8
          .flex.items-center.justify-between.mb-4
            h3.text-lg.font-semibold.text-emerald-700 Your Subscription
            .text-emerald-600.font-medium.text-sm(v-if="billingCycle === 'yearly'") Save 20% with yearly billing!
          
          //- Subscription Status
          .flex.items-center.justify-center.mb-6.bg-white.rounded-lg.p-3.border.border-emerald-100
            VaIcon(name="check_circle" size="20px" class="text-emerald-500 mr-2")
            span.text-emerald-700.font-medium Your {{ selectedPlan }} subscription has been successfully activated
          
          .flex.flex-col.gap-2.mb-6
            .flex.items-center.justify-between
              span.text-gray-700 Plan:
              span.font-medium.text-gray-900 {{ selectedPlan }} ({{ billingCycle === 'yearly' ? 'Yearly' : 'Monthly' }})
            .flex.items-center.justify-between
              span.text-gray-700 Price:
              .flex.items-center.gap-2
                span.font-medium.text-gray-900(v-if="billingCycle === 'monthly'") ${{ selectedPlan === 'BASIC' ? '9.99' : '29.99' }}/month
                template(v-else)
                  span.font-medium.text-gray-900 ${{ selectedPlan === 'BASIC' ? '95.88' : '287.88' }}/year
                  span.text-sm.text-emerald-600 (${{ selectedPlan === 'BASIC' ? '7.99' : '23.99' }}/month equivalent)
    
          //- Plan Features
          h3.text-lg.font-semibold.text-emerald-700.mb-4 What's included in your plan:
          .grid.grid-cols-2.gap-4
            .flex.items-center.gap-2(v-for="feature in getPlanFeatures(selectedPlan)" :key="feature")
              VaIcon(name="check_circle" size="20px" class="text-emerald-500")
              span.text-gray-700.text-sm {{ feature }}

        //- Action Button
        button(
          class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          @click="applyChangesAndGoHome"
        ) Start Exploring
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
const showSuccessModal = ref(false);
const currentPlan = ref('FREE');
const selectedPlan = ref('');
const subscriptionStatus = ref(null);
const userBillingCycle = ref('monthly'); // User's actual billing cycle
const billingCycle = ref('monthly'); // Currently selected view mode (monthly/yearly toggle)
const selectedBillingCycle = computed(() => billingCycle.value); // For easier reference
const productCatalog = ref(null);
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

// Get features for the selected plan
function getPlanFeatures(plan) {
  if (productCatalog.value && productCatalog.value.plans[plan]) {
    return productCatalog.value.plans[plan].features;
  }
  
  // Default features if catalog not loaded
  if (plan === 'FREE') {
    return [
      'Up to 5 business cards',
      'Basic card scanning',
      '3 email drafts per card',
      'Basic digital profile',
      'Standard QR code'
    ];
  }
  
  const features = {
    BASIC: [
      'Up to 20 business cards',
      'Advanced card scanning',
      '10 email drafts per card',
      'Up to 5 events',
      'Enhanced digital profile',
      'Custom QR code design'
    ],
    PRO: [
      'Unlimited business cards',
      'Premium card scanning',
      'Unlimited email drafts',
      'Unlimited events',
      'Premium digital profile',
      'Custom QR code branding'
    ]
  };
  return features[plan] || [];
}

// Get the plan price
function getPlanPrice(plan, cycle = 'monthly') {
  if (productCatalog.value && productCatalog.value.plans[plan] && productCatalog.value.plans[plan][cycle]) {
    return productCatalog.value.plans[plan][cycle].price;
  }
  
  if (plan === 'FREE') return 0;
  
  if (cycle === 'monthly') {
    return plan === 'BASIC' ? 9.99 : 29.99;
  } else {
    return plan === 'BASIC' ? 95.88 : 287.88;
  }
}

// Get the full yearly price (monthly price × 12)
function getFullYearlyPrice(plan) {
  if (plan === 'FREE') return 0;
  
  const monthlyPrice = getPlanPrice(plan, 'monthly');
  return (monthlyPrice * 12).toFixed(2);
}

// Get yearly savings amount
function getYearlySavings(plan) {
  if (plan === 'FREE') return 0;
  
  const yearlyPrice = getPlanPrice(plan, 'yearly');
  const fullYearlyPrice = getFullYearlyPrice(plan);
  
  return (fullYearlyPrice - yearlyPrice).toFixed(2);
}

// Calculate monthly equivalent price for yearly plan
function getMonthlyEquivalent(plan) {
  if (plan === 'FREE') return 0;
  
  const yearlyPrice = getPlanPrice(plan, 'yearly');
  return (yearlyPrice / 12).toFixed(2);
}

// Format currency for display
function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

// Navigate to home
function goToHome() {
  showSuccessModal.value = false;
  router.push('/home');
}

// Apply plan changes and navigate home
async function applyChangesAndGoHome() {
  // Make one final attempt to ensure plan is updated
  if (selectedPlan.value !== 'FREE' && currentPlan.value !== selectedPlan.value) {
    try {
      await paymentService.forceUpdatePlan(selectedPlan.value, billingCycle.value);
      alert(`Your ${selectedPlan.value} plan has been activated successfully!`);
    } catch (error) {
      console.error('Final plan update failed:', error);
    }
  }
  
  showSuccessModal.value = false;
  router.push('/home');
}

// Fetch product catalog from server
async function fetchProductCatalog() {
  try {
    const response = await fetch('/api/subscription/catalog');
    if (!response.ok) {
      throw new Error('Failed to fetch product catalog');
    }
    productCatalog.value = await response.json();
    console.log('Product catalog loaded:', productCatalog.value);
  } catch (error) {
    console.error('Error loading product catalog:', error);
  }
}

// Load subscription status and usage stats
async function loadSubscriptionData() {
  try {
    loading.value = true;

    // Initialize with default values to prevent undefined errors
    currentPlan.value = 'FREE';
    subscriptionStatus.value = null;
    usageStats.value = {
      cards: 0,
      events: 0,
      draftsPerCard: {},
      totalDrafts: 0
    };

    // Wait for auth state to be ready
    await new Promise((resolve) => {
      const unsubscribe = authService.onAuthStateChanged((user) => {
        if (user) {
          unsubscribe();
          resolve();
        } else {
          // Handle no user case
          console.log('No user logged in');
          unsubscribe();
          resolve();
        }
      });
    });

    // Check if user is logged in
    const user = authService.getCurrentUser();
    if (!user) {
      console.log('No user logged in, redirecting to login');
      router.push('/login');
      return;
    }

    // Fetch product catalog
    await fetchProductCatalog();

    try {
      const [subscription, usage] = await Promise.all([
        paymentService.getSubscriptionStatus(),
        paymentService.getUsageStats()
      ]);
      
      if (subscription) {
        currentPlan.value = subscription.plan || 'FREE';
        subscriptionStatus.value = subscription.subscriptionStatus;
        subscriptionEndDate.value = subscription.currentPeriodEnd;
      }
      
      if (usage) {
        usageStats.value = usage;
      }
      
      // Set billing cycle based on subscription
      if (subscription && subscription.billingCycle) {
        userBillingCycle.value = subscription.billingCycle;
        // Only set the view mode to match the user's billing cycle on initial load
        if (billingCycle.value === 'monthly' || billingCycle.value === 'yearly') {
          billingCycle.value = subscription.billingCycle;
        }
      }

      // Handle success/canceled states from Stripe Checkout
      if (route.query.success) {
        // If plan is specified in URL, use that instead of currentPlan
        if (route.query.plan) {
          selectedPlan.value = route.query.plan;
          if (route.query.cycle) {
            billingCycle.value = route.query.cycle;
          }
        } else {
          selectedPlan.value = currentPlan.value;
        }
        
        // If there's a mismatch between expected and actual plan, wait and verify
        if (selectedPlan.value !== currentPlan.value && selectedPlan.value !== 'FREE') {
          console.log('Plan mismatch detected, waiting for webhook to complete...');
          await verifySubscriptionUpdate(selectedPlan.value, billingCycle.value);
        }
        
        showSuccessModal.value = true;
      } else if (route.query.canceled) {
        alert('Subscription canceled. Feel free to try again when you\'re ready.');
      }

      // Clear the URL parameters
      if (route.query.success || route.query.canceled) {
        router.replace('/subscription');
      }
    } catch (dataError) {
      console.error('Error fetching subscription data:', dataError);
      // Continue with default values instead of failing
    }
  } catch (error) {
    console.error('Error loading subscription data:', error);
    if (error.message === 'User must be logged in') {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
}

// Verify that the subscription was updated in the database
async function verifySubscriptionUpdate(expectedPlan, expectedCycle, maxAttempts = 3) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    console.log(`Verifying subscription update, attempt ${attempts + 1}/${maxAttempts}...`);
    
    // Wait a bit for the webhook to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Check current subscription status
      const subscription = await paymentService.getSubscriptionStatus();
      
      // If plan matches expected plan, we're good!
      if (subscription && subscription.plan === expectedPlan) {
        console.log('Plan successfully updated to', expectedPlan);
        currentPlan.value = subscription.plan;
        subscriptionStatus.value = subscription.subscriptionStatus;
        // Make sure billing cycle is set correctly
        if (subscription.billingCycle) {
          billingCycle.value = subscription.billingCycle;
        } else {
          billingCycle.value = expectedCycle;
        }
        return true;
      }
      
      // If subscription status is active but plan doesn't match
      if (subscription && subscription.subscriptionStatus === 'active' && subscription.plan !== expectedPlan) {
        console.warn(`Plan mismatch: expected ${expectedPlan}, got ${subscription.plan}`);
      }
    } catch (error) {
      console.error('Error verifying subscription:', error);
    }
    
    attempts++;
  }
  
  console.warn(`Could not verify plan update to ${expectedPlan} after ${maxAttempts} attempts. Forcing plan update.`);
  
  // Force update the plan in the database if webhook didn't work
  try {
    await paymentService.forceUpdatePlan(expectedPlan, expectedCycle);
    const subscription = await paymentService.getSubscriptionStatus();
    if (subscription) {
      currentPlan.value = subscription.plan;
      subscriptionStatus.value = subscription.subscriptionStatus;
    }
    return true;
  } catch (error) {
    console.error('Failed to force update plan:', error);
    return false;
  }
}

// Handle plan selection
async function selectPlan(plan, cycle = 'monthly') {
  if (plan === currentPlan.value) return;
  
  try {
    loading.value = true;
    selectedPlan.value = plan; // Set selected plan when user makes selection
    
    if (plan === 'FREE') {
      await paymentService.cancelSubscription();
      currentPlan.value = plan;
      subscriptionStatus.value = 'canceled';
    } else {
      // Create subscription with correct parameters
      const user = authService.getCurrentUser();
      try {
        // First attempt to directly update the plan in our database
        // This ensures the plan is set even if webhook fails
        await paymentService.forceUpdatePlan(plan, cycle);
        console.log("Pre-emptively updated plan in database");
      } catch (dbError) {
        console.warn("Pre-emptive plan update failed:", dbError);
        // Continue anyway, the webhook might still work
      }
      
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          billingCycle: cycle,
          userId: user.uid,
          email: user.email,
          successUrl: `${window.location.origin}/subscription?success=true&plan=${plan}&cycle=${cycle}`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Store selected plan and cycle in local storage
      // This will help us recover if the page is refreshed
      localStorage.setItem('selectedPlan', plan);
      localStorage.setItem('billingCycle', cycle);

      // Redirect to Stripe Checkout
      window.location.href = data.url;
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
  // Check if we have stored plan info in localStorage
  const storedPlan = localStorage.getItem('selectedPlan');
  const storedCycle = localStorage.getItem('billingCycle');
  
  if (storedPlan && storedCycle) {
    console.log('Found stored plan info:', storedPlan, storedCycle);
    selectedPlan.value = storedPlan;
    billingCycle.value = storedCycle;
    
    // Clear stored values to prevent issues on future visits
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('billingCycle');
  }
  
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

/* Success Animation Styles */
.success-animation {
  @apply relative w-24 h-24 mx-auto;
}

.checkmark-circle {
  @apply w-24 h-24 relative bg-emerald-100 rounded-full;
  animation: scale 0.3s ease-in-out 0.9s both;
}

.checkmark {
  @apply w-12 h-24 relative rotate-45 absolute left-[30%] top-[40%];
}

.checkmark.draw:after {
  @apply absolute h-3 w-3 bg-emerald-500 rounded-full top-[70%] left-[30%];
  content: '';
  animation: checkmark-dot 0.2s ease-in-out forwards;
}

.checkmark.draw:before {
  @apply absolute h-3 w-[2px] bg-emerald-500 bottom-0;
  content: '';
  animation: checkmark-check 0.3s ease-in-out forwards;
}

@keyframes checkmark-check {
  0% {
    height: 0;
    width: 0;
    opacity: 1;
  }
  100% {
    height: 60px;
    width: 3px;
    opacity: 1;
  }
}

@keyframes checkmark-dot {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 12px;
    height: 12px;
    opacity: 1;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

/* Responsive Plan Cards Styling */
.plans {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 my-8 md:my-12 px-2 md:px-0;
}

.plan {
  @apply rounded-2xl border overflow-hidden transition-all duration-300 shadow-sm hover:shadow-lg bg-white;
  height: 100%;
}

/* Don't scale up on mobile as it can cause overflow issues */
@media (min-width: 768px) {
  .plan.active {
    @apply ring-2 ring-emerald-500 transform scale-105 shadow-xl;
  }
}

/* On mobile, just use a border indicator */
@media (max-width: 767px) {
  .plan.active {
    @apply ring-2 ring-emerald-500 shadow-xl;
  }
}

.plan.free {
  @apply border-gray-200;
}

.plan.basic {
  @apply border-blue-200;
}

.plan.pro {
  @apply border-emerald-200;
}

.plan__content {
  @apply flex flex-col h-full;
}

.plan__header {
  @apply p-4 md:p-6 border-b;
}

.plan__header h3 {
  @apply text-lg md:text-2xl font-bold mb-1 md:mb-2;
}

.plan.free h3 {
  @apply text-gray-700;
}

.plan.basic h3 {
  @apply text-blue-600;
}

.plan.pro h3 {
  @apply text-emerald-600;
}

.plan__price {
  @apply flex flex-col gap-1;
}

.plan__amount {
  @apply text-xl md:text-3xl font-bold;
}

.plan__period {
  @apply text-gray-500 text-xs md:text-sm;
}

.price-container {
  @apply flex items-end gap-1;
}

.original-price {
  @apply text-xs md:text-sm text-gray-500 mt-1;
}

.savings {
  @apply text-emerald-600 font-medium ml-1 md:ml-2;
}

.plan__features {
  @apply p-4 md:p-6 flex-grow;
}

.plan__feature {
  @apply flex gap-2 md:gap-3 py-1 md:py-2;
}

.plan__feature-icon {
  @apply flex-shrink-0 text-emerald-500;
}

.plan__feature-icon svg {
  @apply w-4 h-4 md:w-5 md:h-5;
}

.plan__feature-text {
  @apply text-gray-700 text-sm md:text-base;
}

.plan__cta {
  @apply p-4 md:p-6 pt-0;
}

.plan__button {
  @apply w-full py-2 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl font-medium transition-all duration-300 text-sm md:text-base;
}

.plan.free .plan__button {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.plan.basic .plan__button {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.plan.pro .plan__button {
  @apply bg-emerald-500 text-white hover:bg-emerald-600;
}

.plan__button.current {
  @apply bg-gray-100 text-gray-500 cursor-not-allowed;
}

.plan__button.downgrade {
  @apply bg-amber-100 text-amber-700 hover:bg-amber-200;
}

/* Badge Styling */
.plan-badge {
  @apply absolute top-4 right-4;
}

/* Mobile optimizations for other elements */
@media (max-width: 767px) {
  h1.text-4xl {
    @apply text-3xl;
  }
  
  p.text-xl {
    @apply text-lg;
  }
  
  .mt-12 {
    @apply mt-8;
  }
  
  .p-8 {
    @apply p-4;
  }
  
  .gap-8 {
    @apply gap-4;
  }
  
  button.px-6.py-3 {
    @apply px-4 py-2 text-sm;
  }
}
</style> 