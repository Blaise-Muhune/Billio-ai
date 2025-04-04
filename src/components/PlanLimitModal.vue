<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div class="text-center">
        <div class="mb-4">
          <svg class="mx-auto h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          Plan Limit Reached
        </h3>
        <p class="text-sm text-gray-500 mb-6">
          {{ message }}
        </p>

        <!-- Usage Statistics -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 class="text-sm font-medium text-gray-700 mb-3">Current Usage</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-emerald-600">{{ usage.cards }} / {{ limits.maxCards }}</div>
              <div class="text-xs text-gray-500">Business Cards</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-emerald-600">{{ usage.events }} / {{ limits.maxEvents }}</div>
              <div class="text-xs text-gray-500">Events</div>
            </div>
            <div class="text-center col-span-2">
              <div class="text-2xl font-bold text-emerald-600">{{ usage.draftsPerCard[currentCardId] || 0 }} / {{ limits.maxDraftsPerCard }}</div>
              <div class="text-xs text-gray-500">Email Drafts (Current Card)</div>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            @click="goToSubscription"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { authService } from '../services/authService';
import { SUBSCRIPTION_PLANS } from '../config/plans';

export default {
  name: 'PlanLimitModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    currentCardId: {
      type: String,
      default: null
    }
  },
  setup() {
    const router = useRouter();
    const usage = ref({
      cards: 0,
      events: 0,
      draftsPerCard: {}
    });
    const limits = ref(SUBSCRIPTION_PLANS.FREE.limits);

    const goToSubscription = () => {
      router.push('/subscription');
    };

    const loadUsageStats = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) return;

        // Get user's plan limits
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          limits.value = userData.limits || SUBSCRIPTION_PLANS.FREE.limits;
        }

        // Get usage stats
        const usageDoc = await getDoc(doc(db, 'usage_stats', user.uid));
        if (usageDoc.exists()) {
          const usageData = usageDoc.data();
          usage.value = {
            cards: usageData.cards || 0,
            events: usageData.events || 0,
            draftsPerCard: usageData.draftsPerCard || {}
          };
        }
      } catch (error) {
        console.error('Error loading usage stats:', error);
      }
    };

    onMounted(() => {
      if (authService.getCurrentUser()) {
        loadUsageStats();
      }
    });

    return {
      usage,
      limits,
      goToSubscription
    };
  }
};
</script> 