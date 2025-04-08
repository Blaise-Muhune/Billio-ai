import { loadStripe } from '@stripe/stripe-js';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { authService } from './authService';
import { SUBSCRIPTION_PLANS } from '../config/stripe';

// Initialize Stripe lazily
let stripePromise = null;

const getStripe = async () => {
  if (!stripePromise) {
    stripePromise = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export const paymentService = {
  async createSubscription(priceId) {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      console.log('Creating subscription for user:', user.uid, 'with price:', priceId);

      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          email: user.email,
          successUrl: `${window.location.origin}/subscription?success=true`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Subscription creation failed:', data);
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
      return data;
    } catch (error) {
      console.error('Error in createSubscription:', error);
      throw error;
    }
  },

  async getSubscriptionStatus() {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      console.log('Getting subscription status for user:', user.uid); // Debug log

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        console.log('User document not found, returning FREE plan'); // Debug log
        return { plan: 'FREE', subscriptionStatus: null };
      }

      const userData = userDoc.data();
      console.log('User subscription data:', userData); // Debug log

      // Check if subscription is active
      const isActive = userData.subscriptionStatus === 'active' || 
                      (userData.subscriptionStatus === 'canceled' && 
                       userData.subscriptionEndDate && 
                       new Date(userData.subscriptionEndDate) > new Date());

      const plan = isActive ? (userData.plan || 'FREE') : 'FREE';
      console.log('Determined plan:', plan, 'Active:', isActive); // Debug log

      return {
        plan,
        subscriptionId: userData.subscriptionId,
        subscriptionStatus: userData.subscriptionStatus,
        currentPeriodEnd: userData.subscriptionEndDate,
        limits: userData.limits || {
          maxCards: 5,
          maxEvents: 1,
          maxDraftsPerCard: 1
        }
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  },

  async cancelSubscription() {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      const { subscriptionId, subscriptionStatus } = await this.getSubscriptionStatus();
      
      if (!subscriptionId) {
        throw new Error('No active subscription found');
      }

      if (subscriptionStatus === 'canceled') {
        throw new Error('Subscription is already canceled');
      }

      console.log('Canceling subscription:', subscriptionId);

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.uid,
          subscriptionId 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // If subscription not found in Stripe, update local state anyway
        if (response.status === 404 && data.code === 'subscription_not_found') {
          // Update local subscription status
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            subscriptionId: null,
            subscriptionStatus: 'canceled',
            plan: 'FREE',
            limits: SUBSCRIPTION_PLANS.FREE.limits,
            updatedAt: new Date()
          });
          return true;
        }
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Update local subscription status
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        subscriptionStatus: 'canceled',
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  async getUsageStats() {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      // Get usage stats
      const usageDoc = await getDoc(doc(db, 'usage_stats', user.uid));
      if (!usageDoc.exists()) {
        return {
          cards: 0,
          events: 0,
          draftsPerCard: {}
        };
      }

      const usageData = usageDoc.data();

      // Get total drafts count
      const totalDrafts = Object.values(usageData.draftsPerCard || {}).reduce((sum, count) => sum + count, 0);

      return {
        cards: usageData.cards || 0,
        events: usageData.events || 0,
        draftsPerCard: usageData.draftsPerCard || {},
        totalDrafts
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw error;
    }
  }
}; 