<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
      <div class="p-8">
        <div class="text-center">
          <!-- Warning Icon -->
          <div class="mb-6 bg-amber-100 inline-flex p-3 rounded-xl">
            <VaIcon name="warning" size="32px" class="text-amber-500" />
          </div>

          <!-- Title and Message -->
          <h3 class="text-2xl font-bold text-gray-900 mb-3">
            Plan Limit Reached
          </h3>
          <p class="text-base text-gray-600 mb-8">
            {{ message }}
          </p>

          <!-- Usage Statistics -->
          <div class="bg-gray-50 rounded-xl p-6 mb-8">
            <h4 class="text-sm font-medium text-gray-700 mb-6">Current Usage</h4>
            <div class="grid grid-cols-2 gap-6">
              <!-- Business Cards -->
              <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div class="flex flex-col items-center">
                  <div class="bg-emerald-100 p-2 rounded-lg mb-2">
                    <VaIcon name="business_card" size="20px" class="text-emerald-600" />
                  </div>
                  <div class="text-2xl font-bold text-emerald-600">{{ usage.cards }} / {{ limits.maxCards }}</div>
                  <div class="text-xs text-gray-500 mt-1">Business Cards</div>
                </div>
              </div>

              <!-- Events -->
              <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div class="flex flex-col items-center">
                  <div class="bg-emerald-100 p-2 rounded-lg mb-2">
                    <VaIcon name="event" size="20px" class="text-emerald-600" />
                  </div>
                  <div class="text-2xl font-bold text-emerald-600">{{ usage.events }} / {{ limits.maxEvents }}</div>
                  <div class="text-xs text-gray-500 mt-1">Events</div>
                </div>
              </div>

              <!-- Email Drafts -->
              <div class="col-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div class="flex flex-col items-center">
                  <div class="bg-emerald-100 p-2 rounded-lg mb-2">
                    <VaIcon name="email" size="20px" class="text-emerald-600" />
                  </div>
                  <div class="text-2xl font-bold text-emerald-600">
                    {{ usage.draftsPerCard[currentCardId] || 0 }} / {{ limits.maxDraftsPerCard }}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">Email Drafts (Current Card)</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-center gap-4">
            <button
              @click="$emit('close')"
              class="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              @click="goToSubscription"
              class="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center gap-2"
            >
              <VaIcon name="workspace_premium" size="18px" />
              <span>Upgrade Plan</span>
            </button>
          </div>
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

<style scoped>
/* Add a subtle animation when the modal appears */
.scale-100 {
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Hover effects for cards */
.rounded-lg {
  transition: all 0.2s ease;
}

.rounded-lg:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style> 