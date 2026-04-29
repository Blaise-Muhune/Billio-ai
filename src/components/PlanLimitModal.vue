<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/55 p-0 backdrop-blur-md sm:items-center sm:p-4"
    @click.self="$emit('close')"
  >
    <div
      class="billio-modal-panel w-full max-w-md origin-bottom scale-100 rounded-t-[1.5rem] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/95 shadow-2xl ring-1 ring-white/60 sm:rounded-3xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-limit-title"
    >
      <div class="billio-modal-panel__accent h-1 w-full rounded-t-[inherit] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 sm:rounded-t-3xl" />
      <div class="px-5 pb-6 pt-5 sm:p-8">
        <div class="text-center">
          <div class="mb-5 inline-flex rounded-2xl bg-amber-50 p-3.5 ring-1 ring-amber-200/60">
            <VaIcon name="warning" size="32px" class="text-amber-600" />
          </div>

          <h3 id="plan-limit-title" class="mb-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Plan Limit Reached
          </h3>
          <p class="mb-8 text-sm leading-relaxed text-slate-600 sm:text-base">
            {{ message }}
          </p>

          <div class="mb-8 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 text-left shadow-inner sm:p-6">
            <h4 class="mb-5 text-center text-xs font-bold uppercase tracking-widest text-slate-500">Current usage</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div class="flex flex-col items-center">
                  <div class="mb-2 rounded-lg bg-emerald-50 p-2 ring-1 ring-emerald-100">
                    <VaIcon name="business_card" size="20px" class="text-emerald-600" />
                  </div>
                  <div class="text-xl font-bold text-emerald-700 sm:text-2xl">{{ usage.cards }} / {{ limits.maxCards }}</div>
                  <div class="mt-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">Cards</div>
                </div>
              </div>

              <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div class="flex flex-col items-center">
                  <div class="mb-2 rounded-lg bg-emerald-50 p-2 ring-1 ring-emerald-100">
                    <VaIcon name="event" size="20px" class="text-emerald-600" />
                  </div>
                  <div class="text-xl font-bold text-emerald-700 sm:text-2xl">{{ usage.events }} / {{ limits.maxEvents }}</div>
                  <div class="mt-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">Events</div>
                </div>
              </div>

              <div class="col-span-2 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div class="flex flex-col items-center">
                  <div class="mb-2 rounded-lg bg-emerald-50 p-2 ring-1 ring-emerald-100">
                    <VaIcon name="email" size="20px" class="text-emerald-600" />
                  </div>
                  <div class="text-xl font-bold text-emerald-700 sm:text-2xl">
                    {{ usage.draftsPerCard[currentCardId] || 0 }} / {{ limits.maxDraftsPerCard }}
                  </div>
                  <div class="mt-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Email drafts (this card)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <button
              type="button"
              class="order-2 w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 sm:order-1 sm:w-auto"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="button"
              class="order-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-emerald-500 hover:to-teal-500 hover:shadow-xl sm:order-2 sm:w-auto"
              @click="goToSubscription"
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

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          limits.value = userData.limits || SUBSCRIPTION_PLANS.FREE.limits;
        }

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
.billio-modal-panel {
  animation: billio-plan-modal-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes billio-plan-modal-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .billio-modal-panel {
    animation: none;
  }
}
</style>
