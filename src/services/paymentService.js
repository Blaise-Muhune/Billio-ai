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
        return { plan: 'FREE', subscriptionStatus: null, billingCycle: 'monthly' };
      }

      const userData = userDoc.data();
      console.log('User subscription data:', userData); // Debug log

      // Check if subscription is active
      const isActive = userData.subscriptionStatus === 'active' || 
                      (userData.subscriptionStatus === 'canceled' && 
                       userData.subscriptionEndDate && 
                       (userData.subscriptionEndDate instanceof Date || 
                        userData.subscriptionEndDate.seconds || 
                        new Date(userData.subscriptionEndDate) > new Date()));

      const plan = isActive ? (userData.plan || 'FREE') : 'FREE';
      console.log('Determined plan:', plan, 'Active:', isActive); // Debug log

      // Handle the currentPeriodEnd - keep Timestamp object as is, no need to convert here
      // This allows proper handling by consumers of this data
      const currentPeriodEnd = userData.subscriptionEndDate || null;

      return {
        plan,
        subscriptionId: userData.subscriptionId,
        subscriptionStatus: userData.subscriptionStatus,
        currentPeriodEnd: currentPeriodEnd,
        // Include billing cycle info from database or default to monthly
        billingCycle: userData.billingCycle || 'monthly',
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

      const { subscriptionId, subscriptionStatus, plan } = await this.getSubscriptionStatus();
      
      // Better error message for manually set plans without a subscription ID
      if (!subscriptionId) {
        if (plan !== 'FREE') {
          throw new Error('This plan was set manually and cannot be canceled through Stripe. Please use the manual cancellation option.');
        } else {
          throw new Error('No active subscription found');
        }
      }

      if (subscriptionStatus === 'canceled') {
        throw new Error('Subscription is already canceled');
      }

      console.log('Canceling subscription:', subscriptionId);

      // Get user document reference
      const userRef = doc(db, 'users', user.uid);
      
      // Update email in user document to ensure it's available for confirmation emails
      await updateDoc(userRef, {
        email: user.email,
        subscriptionEmail: user.email,
        emailSubscribed: true,
        updatedAt: new Date()
      }).catch(err => {
        console.warn('Failed to update email fields before cancellation:', err);
        // Continue with cancellation even if email update fails
      });

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.uid,
          subscriptionId,
          userEmail: user.email // Include email directly in the cancellation request
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // If subscription not found in Stripe, update local state anyway
        if (response.status === 404 && data.code === 'subscription_not_found') {
          // Update local subscription status
          await updateDoc(userRef, {
            subscriptionId: null,
            subscriptionStatus: 'canceled',
            plan: 'FREE',
            limits: SUBSCRIPTION_PLANS.FREE.limits,
            updatedAt: new Date()
          });
          return {
            success: true,
            endDate: null
          };
        }
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      console.log('Cancellation response from server:', data);
      
      // Extract the end date from the response - the server returns it as data.subscription.endDate
      const endDate = data.subscription?.endDate;
      console.log('Extracted end date from response:', endDate);
      
      if (!endDate) {
        console.warn('No end date in response, checking if we can extract it another way');
        console.log('Full response data:', JSON.stringify(data));
      }

      // Update local subscription status
      await updateDoc(userRef, {
        subscriptionStatus: 'canceled',
        subscriptionEndDate: endDate,
        updatedAt: new Date()
      });

      // Return subscription end date along with success status
      return {
        success: true,
        endDate: endDate
      };
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
  },

  // New method to force update plan in database 
  async forceUpdatePlan(plan, billingCycle) {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      console.log(`Manually updating plan to ${plan} (${billingCycle}) for user:`, user.uid);
      
      // Get plan limits from config
      const planConfig = SUBSCRIPTION_PLANS[plan];
      if (!planConfig) {
        throw new Error(`Invalid plan: ${plan}`);
      }

      // Update user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        plan: plan,
        billingCycle: billingCycle,
        subscriptionStatus: 'active',
        limits: planConfig.limits,
        updatedAt: new Date()
      });

      console.log(`Successfully updated plan for user ${user.uid} to ${plan}`);
      return true;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  },

  // Get the current period end directly from Stripe
  async getCurrentPeriodEnd() {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      console.log('Getting current period end for user:', user.uid);

      const response = await fetch(`/api/subscription/period-end/${user.uid}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get current period end');
      }

      const data = await response.json();
      console.log('Current period end data:', data);

      if (data.hasSubscription && data.currentPeriodEnd) {
        // Return the date
        return new Date(data.currentPeriodEnd);
      }

      return null;
    } catch (error) {
      console.error('Error getting current period end:', error);
      throw error;
    }
  },
}; 