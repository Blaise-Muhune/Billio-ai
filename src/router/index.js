import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/index/index.vue';
import ProfileSetup from '../pages/profile-setup/index.vue';
import { authService } from '../services/authService';

const routes = [
  {
    path: '/',
    component: Home
  },
  {
    path: '/profile-setup',
    component: ProfileSetup,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/profile/:username',
    name: 'profile',
    component: () => import('../pages/profile/[username].vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard to check authentication
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const currentUser = authService.getCurrentUser();

  if (requiresAuth && !currentUser) {
    next('/');
    return;
  }

  // If user is authenticated and trying to access profile setup
  if (to.path === '/profile-setup' && currentUser) {
    const userProfile = await authService.getUserProfile();
    // If profile is already completed and user is not explicitly editing
    if (userProfile?.profileCompleted && !to.query.edit) {
      next('/');
      return;
    }
  }

  next();
});

export default router; 