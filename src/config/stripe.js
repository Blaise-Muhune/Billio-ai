import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    stripePriceId: null,
    limits: {
      maxCards: 5,
      maxEvents: 1,
      maxDraftsPerCard: 1
    }
  },
  BASIC: {
    name: 'Basic',
    stripePriceId: import.meta.env.VITE_STRIPE_BASIC_PRICE_ID,
    limits: {
      maxCards: 40,
      maxEvents: 5,
      maxDraftsPerCard: 3
    }
  },
  PRO: {
    name: 'Pro',
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    limits: {
      maxCards: 100,
      maxEvents: 20,
      maxDraftsPerCard: 10
    }
  }
};

// Helper function to format price
export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

// Helper function to check if user has reached plan limits
export function checkPlanLimits(plan, usage) {
  const planConfig = SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.FREE;
  const limits = planConfig.limits;

  return {
    cards: {
      used: usage.cards || 0,
      limit: limits.maxCards,
      remaining: Math.max(0, limits.maxCards - (usage.cards || 0))
    },
    events: {
      used: usage.events || 0,
      limit: limits.maxEvents,
      remaining: Math.max(0, limits.maxEvents - (usage.events || 0))
    },
    draftsPerCard: {
      limit: limits.maxDraftsPerCard
    }
  };
} 