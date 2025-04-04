import { createRouter, createWebHistory } from 'vue-router';
import { authService } from '../services/authService';

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('../pages/index/index.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../pages/index/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../pages/auth/index.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/profile-setup',
    name: 'ProfileSetup',
    component: () => import('../pages/profile-setup/index.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/profile/:username',
    name: 'Profile',
    component: () => import('../pages/profile/[username].vue')
  },
  {
    path: '/subscription',
    name: 'Subscription',
    component: () => import('../pages/subscription/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('../pages/analytics/index.vue'),
    meta: {
      requiresAuth: true,
      title: 'Analytics - BilloAI'
    }
  },
  {
    path: '/privacy-policy',
    name: 'PrivacyPolicy',
    component: () => import('../pages/privacy-policy/index.vue'),
    meta: {
      title: 'Privacy Policy - BilloAI'
    }
  },
  {
    path: '/demo',
    name: 'Demo',
    component: () => import('../pages/demo/index.vue'),
    meta: {
      title: 'Demo & Tutorial - BilloAI'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const user = authService.getCurrentUser();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

  if (requiresAuth && !user) {
    // Redirect to auth page if user is not logged in and route requires auth
    next({ 
      name: 'Auth',
      query: { redirect: to.fullPath }  // Save the intended destination
    });
  } else if (requiresGuest && user) {
    // Redirect to home if user is logged in and route requires guest
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router; 