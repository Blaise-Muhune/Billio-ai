<route>
meta:
  title: Analytics - BilloAI
  requiresAuth: true
</route>

<template lang="pug">
main(class="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-emerald-50")
  .max-w-7xl.mx-auto(class="px-4 sm:px-6 lg:px-8 py-8")
    //- Header Section
    .mb-8
      h1.text-3xl.font-bold.text-gray-900.mb-2 Analytics Dashboard
      p.text-gray-600 Track your networking insights and business card performance

    //- Loading State
    .flex.justify-center.items-center(class="min-h-[400px]" v-if="loading")
      .loading-spinner

    //- Error State
    .text-center.py-12(v-else-if="error")
      VaIcon(name="error" size="48px" class="text-red-500 mx-auto mb-4")
      h2.text-2xl.font-bold.text-gray-900.mb-2 {{ error }}
      p.text-gray-600 Unable to load analytics data. Please try again later.

    //- Analytics Content
    .space-y-8(v-else)
      //- Overview Cards
      .grid.gap-6(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
        //- Total Business Cards
        .bg-white.rounded-xl.shadow-sm.border.border-gray-100.p-6
          .flex.items-start.justify-between.mb-4
            .flex.items-center.gap-3
              .bg-emerald-100.p-2.rounded-lg
                VaIcon(name="credit_card" size="24px" class="text-emerald-600")
              .text-sm.text-gray-600 Total Cards
          .text-3xl.font-bold.text-gray-900.mb-2 {{ stats.totalCards }}
          .text-sm.text-gray-500 From {{ stats.totalUsers }} users

        //- Card Scans
        .bg-white.rounded-xl.shadow-sm.border.border-gray-100.p-6(v-if="stats.cardScanStats.total > 0")
          .flex.items-start.justify-between.mb-4
            .flex.items-center.gap-3
              .bg-blue-100.p-2.rounded-lg
                VaIcon(name="qr_code_scanner" size="24px" class="text-blue-600")
              .text-sm.text-gray-600 Card Scans
          .text-3xl.font-bold.text-gray-900.mb-2 {{ stats.cardScanStats.total }}
          .text-sm.text-gray-500 {{ stats.cardScanStats.thisMonth }} this month

        //- Profile Completion
        .bg-white.rounded-xl.shadow-sm.border.border-gray-100.p-6
          .flex.items-start.justify-between.mb-4
            .flex.items-center.gap-3
              .bg-purple-100.p-2.rounded-lg
                VaIcon(name="person" size="24px" class="text-purple-600")
              .text-sm.text-gray-600 Profile Completion
          .text-3xl.font-bold.text-gray-900.mb-2 {{ stats.profileCompletionRate }}%
          .text-sm.text-gray-500 Average completion rate

        //- Events Overview
        .bg-white.rounded-xl.shadow-sm.border.border-gray-100.p-6
          .flex.items-start.justify-between.mb-4
            .flex.items-center.gap-3
              .bg-amber-100.p-2.rounded-lg
                VaIcon(name="event" size="24px" class="text-amber-600")
              .text-sm.text-gray-600 Events Overview
          .text-3xl.font-bold.text-gray-900.mb-2 {{ stats.upcomingEventsCount }}
          .text-sm.text-gray-500 Upcoming ({{ stats.pastEventsCount }} past)

      //- Charts Section
      .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
        //- Card Creation Timeline
        .bg-white.rounded-xl.shadow-sm.border.border-gray-100.p-6(v-if="cardTimelineData.labels.length > 0")
          h3.text-lg.font-semibold.text-gray-900.mb-6 Card Creation Timeline
          .h-64.relative
            canvas(ref="cardTimelineChart")

        //- Event Distribution
        .bg-white.rounded-xl.shadow-sm.border.border-gray-100.p-6(v-if="eventDistributionData.labels.length > 0")
          h3.text-lg.font-semibold.text-gray-900.mb-6 Event Distribution
          .h-64.relative
            canvas(ref="eventDistributionChart")

      //- Additional Insights
      .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
        //- Event Categories
        .bg-white.rounded-xl.shadow-sm.border.border-gray-100.p-6(v-if="stats.eventCategories.length > 0")
          h3.text-lg.font-semibold.text-gray-900.mb-6 Event Categories
          .space-y-4
            .flex.items-center.justify-between(v-for="category in stats.eventCategories" :key="category.category")
              .flex.items-center.gap-3
                VaIcon(name="category" size="20px" class="text-gray-400")
                span.text-gray-700 {{ category.category }}
              .text-sm.font-medium.text-gray-900 {{ category.count }} events

        //- Popular Locations
        .bg-white.rounded-xl.shadow-sm.border.border-gray-100.p-6(v-if="stats.eventLocations.length > 0")
          h3.text-lg.font-semibold.text-gray-900.mb-6 Top Event Locations
          .space-y-4
            .flex.items-center.justify-between(v-for="location in stats.eventLocations" :key="location.location")
              .flex.items-center.gap-3
                VaIcon(name="location_on" size="20px" class="text-gray-400")
                span.text-gray-700 {{ location.location }}
              .text-sm.font-medium.text-gray-900 {{ location.count }} events

</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Chart from 'chart.js/auto';
import { useRouter } from 'vue-router';
import { authService } from '../../services/authService';

// Add router
const router = useRouter();

// State
const loading = ref(true);
const error = ref(null);
const stats = ref({
  // Basic stats
  totalCards: 0,
  totalUsers: 0,
  activeEvents: 0,
  totalDrafts: 0,
  
  // User insights
  userGrowth: {
    labels: [],
    data: []
  },
  profileCompletionRate: 0,
  
  // Card insights
  cardScanStats: {
    total: 0,
    thisMonth: 0,
    growth: 0
  },
  sharingMethods: [],
  
  // Event insights
  eventCategories: [],
  eventLocations: [],
  upcomingEventsCount: 0,
  pastEventsCount: 0
});

// Chart data
const cardTimelineData = ref({
  labels: [],
  data: []
});

const eventDistributionData = ref({
  labels: [],
  data: []
});

// Computed property to check if we have chart data
const hasChartData = computed(() => {
  return cardTimelineData.value.labels.length > 0 || eventDistributionData.value.labels.length > 0;
});

// Add user state
const user = ref(null);
const hasAnalyticsAccess = computed(() => {
  return isAuthenticated.value;
});

// Add authentication state
const isAuthenticated = computed(() => {
  return !!user.value;
});

// Chart references
const cardTimelineChart = ref(null);
const eventDistributionChart = ref(null);

// Initialize charts
async function initializeCharts() {
  // Wait for DOM update
  await nextTick();

  // Check if canvas elements exist and we have data
  if (cardTimelineData.value.labels.length > 0 && cardTimelineChart.value) {
    const timelineCtx = cardTimelineChart.value.getContext('2d');
    if (timelineCtx) {
      new Chart(timelineCtx, {
        type: 'line',
        data: {
          labels: cardTimelineData.value.labels,
          datasets: [{
            label: 'Cards Created',
            data: cardTimelineData.value.data,
            borderColor: '#10B981',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(16, 185, 129, 0.1)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: false
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
  }

  if (eventDistributionData.value.labels.length > 0 && eventDistributionChart.value) {
    const distributionCtx = eventDistributionChart.value.getContext('2d');
    if (distributionCtx) {
      new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
          labels: eventDistributionData.value.labels,
          datasets: [{
            data: eventDistributionData.value.data,
            backgroundColor: [
              '#10B981',
              '#6366F1',
              '#F59E0B',
              '#9CA3AF'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }
}

// Helper function to parse dates
function parseDate(date) {
  if (!date) return null;
  // Handle Firestore timestamp
  if (typeof date.toDate === 'function') {
    return date.toDate();
  }
  // Handle string date
  if (typeof date === 'string') {
    return new Date(date);
  }
  // Handle Date object
  if (date instanceof Date) {
    return date;
  }
  return null;
}

// Load analytics data
async function loadAnalytics() {
  try {
    loading.value = true;
    error.value = null;

    // Wait for auth state to be ready
    await new Promise((resolve) => {
      const unsubscribe = authService.onAuthStateChanged((currentUser) => {
        user.value = currentUser;
        if (currentUser) {
          unsubscribe();
          resolve();
        }
      });
    });

    // Check if user is authenticated
    if (!isAuthenticated.value) {
      error.value = 'Please sign in to access analytics';
      return;
    }

    // Fetch collections
    const [usersSnapshot, cardsSnapshot, eventsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'cards')),
      getDocs(collection(db, 'events'))
    ]);

    // Get data
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const cards = cardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const now = new Date();

    // Process user insights
    const profileFields = ['displayName', 'title', 'company', 'phone', 'email', 'photoURL'];
    const completionRates = users.map(user => {
      const filledFields = profileFields.filter(field => !!user[field]).length;
      return (filledFields / profileFields.length) * 100;
    });
    const avgCompletionRate = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;

    // Process card insights
    const cardScans = cards.reduce((total, card) => total + (card.scanCount || 0), 0);
    const thisMonthScans = cards.reduce((total, card) => {
      const scans = card.scans || [];
      return total + scans.filter(scan => {
        const scanDate = parseDate(scan.date);
        return scanDate && scanDate.getMonth() === now.getMonth();
      }).length;
    }, 0);

    // Process event insights
    const eventCats = new Map();
    const eventLocs = new Map();
    let upcoming = 0;
    let past = 0;

    events.forEach(event => {
      // Count categories
      if (event.type) {
        eventCats.set(event.type, (eventCats.get(event.type) || 0) + 1);
      }
      
      // Count locations
      if (event.location) {
        eventLocs.set(event.location, (eventLocs.get(event.location) || 0) + 1);
      }

      // Count upcoming vs past
      const eventDate = parseDate(event.date);
      if (eventDate) {
        if (eventDate >= now) {
          upcoming++;
        } else {
          past++;
        }
      }
    });
    
    // Update stats with all insights
    stats.value = {
      // Basic stats
      totalCards: cards.length,
      totalUsers: users.length,
      activeEvents: events.filter(event => {
        const eventDate = parseDate(event.date);
        return eventDate && eventDate >= now;
      }).length,
      totalDrafts: cards.reduce((total, card) => total + (card.emailDrafts?.length || 0), 0),
      
      // User insights
      profileCompletionRate: Math.round(avgCompletionRate),
      
      // Card insights
      cardScanStats: {
        total: cardScans,
        thisMonth: thisMonthScans,
        growth: thisMonthScans > 0 ? ((thisMonthScans / cardScans) * 100) : 0
      },
      
      // Event insights
      eventCategories: Array.from(eventCats.entries())
        .sort(([, a], [, b]) => b - a)
        .map(([category, count]) => ({ category, count })),
      eventLocations: Array.from(eventLocs.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, count })),
      upcomingEventsCount: upcoming,
      pastEventsCount: past
    };

    // Process timeline and distribution data
    processCardTimeline(cards);
    processEventDistribution(events);

    // Initialize charts after data is loaded and DOM is updated
    await initializeCharts();
  } catch (err) {
    console.error('Error loading analytics:', err);
    error.value = 'Failed to load analytics data';
  } finally {
    loading.value = false;
  }
}

// Process card timeline data
function processCardTimeline(cards) {
  const monthlyData = new Map();
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  cards.forEach(card => {
    const createdAt = parseDate(card.createdAt);
    if (createdAt && createdAt >= sixMonthsAgo) {
      const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
    }
  });

  const sortedData = Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b));

  cardTimelineData.value = {
    labels: sortedData.map(([month]) => {
      const [year, monthNum] = month.split('-');
      return new Date(year, monthNum - 1).toLocaleString('default', { month: 'short' });
    }),
    data: sortedData.map(([, count]) => count)
  };
}

// Process event distribution data
function processEventDistribution(events) {
  const typeCount = new Map();
  
  events.forEach(event => {
    if (event.type) {
      typeCount.set(event.type, (typeCount.get(event.type) || 0) + 1);
    }
  });

  const sortedData = Array.from(typeCount.entries())
    .sort(([, a], [, b]) => b - a);

  eventDistributionData.value = {
    labels: sortedData.map(([type]) => type),
    data: sortedData.map(([, count]) => count)
  };
}

// Initialize on mount
onMounted(() => {
  // Listen for auth state changes
  const unsubscribe = authService.onAuthStateChanged((currentUser) => {
    user.value = currentUser;
    if (currentUser) {
      loadAnalytics();
    } else {
      router.push('/login');
    }
  });

  // Cleanup subscription
  onUnmounted(() => unsubscribe());
});
</script>

<style scoped>
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(16, 185, 129, 0.1);
  border-top: 3px solid #10B981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 