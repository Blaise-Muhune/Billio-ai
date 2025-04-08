import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SUBSCRIPTION_PLANS } from './src/config/serverStripe.js';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: join(__dirname, '.env') });

// Check for required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'STRIPE_BASIC_PRICE_ID',
  'STRIPE_PRO_PRICE_ID',
  'STRIPE_BASIC_YEARLY_PRICE_ID',
  'STRIPE_PRO_YEARLY_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Firebase Admin with service account credentials
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  })
});

const db = admin.firestore();

// Initialize Stripe with error checking
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Stripe secret key is missing');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' // Latest stable version
});

const expressApp = express();

expressApp.use(cors());

// Parse raw body for webhook requests
expressApp.use('/api/webhook', express.raw({ type: 'application/json' }));

// Parse JSON body for all other requests
expressApp.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Create subscription endpoint
expressApp.post('/api/subscription/create', async (req, res) => {
  try {
    console.log('Received subscription creation request:', req.body);
    const { plan, billingCycle, userId, email, successUrl, cancelUrl } = req.body;

    if (!plan || !billingCycle || !userId || !email || !successUrl || !cancelUrl) {
      console.log('Missing fields:', { plan, billingCycle, userId, email, successUrl, cancelUrl });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get price ID based on plan and billing cycle
    let priceId;
    if (plan === 'FREE') {
      return res.status(400).json({ error: 'Cannot create subscription for FREE plan' });
    } else {
      const planConfig = EXTENDED_SUBSCRIPTION_PLANS[plan];
      if (!planConfig) {
        return res.status(400).json({ error: 'Invalid plan selected' });
      }

      priceId = planConfig[billingCycle].stripePriceId;
      if (!priceId) {
        return res.status(400).json({ 
          error: `Price ID not configured for ${plan} plan with ${billingCycle} billing cycle`
        });
      }
    }

    // Create or get customer
    let customer;
    const customersRef = db.collection('stripe_customers');
    const customerDoc = await customersRef.doc(userId).get();

    if (customerDoc.exists) {
      // Try to retrieve the customer from Stripe
      try {
        customer = await stripe.customers.retrieve(customerDoc.data().customerId);
        // If customer was deleted in Stripe, create a new one
        if (customer.deleted) {
          throw new Error('Customer was deleted');
        }
      } catch (error) {
        // If customer doesn't exist in Stripe or was deleted, create a new one
        customer = await stripe.customers.create({
          email,
          metadata: {
            userId
          }
        });
        // Update the customer ID in Firestore
        await customersRef.doc(userId).set({
          customerId: customer.id,
          email
        });
      }
    } else {
      // Create new customer if they don't exist
      customer = await stripe.customers.create({
        email,
        metadata: {
          userId
        }
      });
      await customersRef.doc(userId).set({
        customerId: customer.id,
        email
      });
    }

    console.log('Creating Stripe Checkout session for customer:', customer.id);

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId
      }
    });

    console.log('Checkout session created:', session.id);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle subscription cancellation
expressApp.post('/api/subscription/cancel', async (req, res) => {
  try {
    const { userId, subscriptionId } = req.body;
    console.log('Received cancellation request for userId:', userId, 'subscriptionId:', subscriptionId);
    
    if (!userId) {
      console.error('Missing userId in request body');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get the user's subscription from Stripe
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const stripeSubId = userData.subscriptionId || subscriptionId;
    
    if (!stripeSubId) {
      console.error('No active subscription found for user:', userId);
      return res.status(400).json({ error: 'No active subscription found' });
    }

    console.log('Found subscription:', stripeSubId, 'for user:', userId);

    try {
      // Cancel the subscription at period end
      const subscription = await stripe.subscriptions.update(
        stripeSubId,
        {
          cancel_at_period_end: true
        }
      );

      console.log('Successfully canceled subscription at period end:', subscription.id);

      // Update user document with subscription status
      await userRef.update({
        subscriptionStatus: 'canceled',
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      });

      // Get the current plan's features for the remaining period
      const currentPlan = userData.plan;
      const planFeatures = SUBSCRIPTION_PLANS[currentPlan];

      console.log('Updated user document with canceled status');

      res.json({
        success: true,
        message: 'Subscription canceled successfully',
        subscription: {
          status: 'canceled',
          currentPlan,
          endDate: new Date(subscription.current_period_end * 1000),
          features: planFeatures
        }
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      // If the subscription is not found in Stripe, update local state anyway
      if (stripeError.code === 'resource_missing') {
        await userRef.update({
          subscriptionId: null,
          subscriptionStatus: 'canceled',
          plan: 'FREE',
          limits: SUBSCRIPTION_PLANS.FREE.limits,
          updatedAt: new Date()
        });
        return res.json({
          success: true,
          message: 'Local subscription status updated',
          subscription: {
            status: 'canceled',
            currentPlan: 'FREE',
            features: SUBSCRIPTION_PLANS.FREE.limits
          }
        });
      }
      throw stripeError;
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

// Check subscription status and access
expressApp.get('/api/subscription/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const now = new Date();
    const subscriptionEndDate = userData.subscriptionEndDate ? new Date(userData.subscriptionEndDate) : null;

    // Determine if user still has access to premium features
    let hasAccess = false;
    let currentPlan = 'FREE';
    let subscriptionStatus = 'inactive';

    if (userData.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
      
      // User has access if:
      // 1. Subscription is active, or
      // 2. Subscription is canceled but not yet ended
      hasAccess = subscription.status === 'active' || 
                 (subscription.status === 'canceled' && subscription.current_period_end * 1000 > now.getTime());
      
      currentPlan = userData.plan;
      subscriptionStatus = subscription.status;
    }

    // If subscription is canceled but not ended, calculate remaining time
    let remainingTime = null;
    if (subscriptionStatus === 'canceled' && subscriptionEndDate && subscriptionEndDate > now) {
      remainingTime = subscriptionEndDate - now;
    }

    res.json({
      hasAccess,
      currentPlan,
      subscriptionStatus,
      subscriptionEndDate,
      remainingTime,
      features: hasAccess ? SUBSCRIPTION_PLANS[currentPlan] : SUBSCRIPTION_PLANS.FREE
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// Middleware to check subscription access
const checkSubscriptionAccess = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const now = new Date();
    const subscriptionEndDate = userData.subscriptionEndDate ? new Date(userData.subscriptionEndDate) : null;

    // Check if user has access to premium features
    let hasAccess = false;
    if (userData.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
      hasAccess = subscription.status === 'active' || 
                 (subscription.status === 'canceled' && subscription.current_period_end * 1000 > now.getTime());
    }

    // Add subscription info to request
    req.subscription = {
      hasAccess,
      currentPlan: hasAccess ? userData.plan : 'FREE',
      subscriptionStatus: userData.subscriptionStatus,
      subscriptionEndDate,
      features: hasAccess ? SUBSCRIPTION_PLANS[userData.plan] : SUBSCRIPTION_PLANS.FREE
    };

    next();
  } catch (error) {
    console.error('Error checking subscription access:', error);
    res.status(500).json({ error: 'Failed to check subscription access' });
  }
};

// Apply subscription check to premium routes
expressApp.use('/api/premium', checkSubscriptionAccess);

// Get product catalog
expressApp.get('/api/subscription/catalog', async (req, res) => {
  try {
    res.json({
      plans: EXTENDED_SUBSCRIPTION_PLANS,
      discount: {
        yearly: 20 // 20% discount for yearly plans
      }
    });
  } catch (error) {
    console.error('Error fetching subscription catalog:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription catalog' });
  }
});

// Add webhook handler for subscription events
expressApp.post('/api/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Ensure we're using the raw body buffer
    const rawBody = req.body;
    if (!rawBody) {
      throw new Error('No raw body found in request');
    }

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('Webhook event received:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        // Map price ID to plan name and billing cycle
        const priceId = subscription.items.data[0].price.id;
        let planName = 'BASIC';
        let billingCycle = 'monthly';
        
        // Determine plan name and billing cycle based on price ID
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
          planName = 'PRO';
          billingCycle = 'monthly';
        } else if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
          planName = 'BASIC';
          billingCycle = 'monthly';
        } else if (priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
          planName = 'PRO';
          billingCycle = 'yearly';
        } else if (priceId === process.env.STRIPE_BASIC_YEARLY_PRICE_ID) {
          planName = 'BASIC';
          billingCycle = 'yearly';
        } else {
          console.warn(`Unknown price ID: ${priceId}, defaulting to BASIC monthly plan`);
        }

        const planLimits = EXTENDED_SUBSCRIPTION_PLANS[planName]?.[billingCycle]?.limits || SUBSCRIPTION_PLANS.BASIC.limits;
        
        console.log(`Processing checkout.session.completed for user ${userId} with plan ${planName} (${billingCycle})`);
        
        // Update user's subscription status and limits in Firestore
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          plan: planName,
          billingCycle: billingCycle,
          limits: {
            maxCards: planLimits.maxCards,
            maxEvents: planLimits.maxEvents,
            maxDraftsPerCard: planLimits.maxDraftsPerCard
          },
          updatedAt: new Date()
        });

        // Reset usage stats for the user
        const usageRef = db.collection('usage_stats').doc(userId);
        await usageRef.set({
          cards: 0,
          events: 0,
          draftsPerCard: {},
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`Successfully processed checkout.session.completed for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        console.log('Processing subscription deletion event:', event.data.object);
        
        const subscription = event.data.object;
        // Get the customer to find the user ID
        const customer = await stripe.customers.retrieve(subscription.customer);
        const userId = customer.metadata.userId;

        if (!userId) {
          throw new Error('No userId found in customer metadata');
        }
        
        console.log(`Processing subscription deletion for user ${userId}`);
        
        // Reset to FREE plan limits
        const freePlanLimits = SUBSCRIPTION_PLANS.FREE.limits;
        
        // Update user's subscription status and limits in Firestore
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          throw new Error(`User document not found for userId: ${userId}`);
        }

        await userRef.update({
          subscriptionId: null,
          subscriptionStatus: 'canceled',
          plan: 'FREE',
          limits: {
            maxCards: freePlanLimits.maxCards,
            maxEvents: freePlanLimits.maxEvents,
            maxDraftsPerCard: freePlanLimits.maxDraftsPerCard
          },
          updatedAt: new Date()
        });

        console.log(`Successfully processed subscription deletion for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    // Send the error details in the response for better debugging
    res.status(500).json({ 
      error: error.message,
      event: event.type,
      eventId: event.id
    });
  }
});

// Extended subscription plans with yearly options
const EXTENDED_SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    stripePriceId: null,
    price: 0,
    limits: SUBSCRIPTION_PLANS.FREE.limits,
    features: [
      'Up to 5 business cards',
      'Basic card scanning',
      '3 email drafts per card',
      'Basic digital profile',
      'Save contacts as vCard',
      'View-only social links'
    ]
  },
  BASIC: {
    monthly: {
      name: 'Basic Monthly',
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
      price: 9.99,
      interval: 'month',
      limits: SUBSCRIPTION_PLANS.BASIC.limits
    },
    yearly: {
      name: 'Basic Yearly',
      stripePriceId: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
      price: 95.88, // 20% discount from monthly price
      interval: 'year',
      savings: 24,
      fullPrice: 119.88,
      limits: SUBSCRIPTION_PLANS.BASIC.limits
    },
    features: [
      'Up to 20 business cards',
      'Advanced card scanning',
      '10 email drafts per card',
      'No banner ads',
      'Up to 5 events per month',
      'Enhanced digital profile',
      'QR code integration',
      'Download QR codes',
      'Full social media integration',
      'AI email generation'
    ]
  },
  PRO: {
    monthly: {
      name: 'Pro Monthly',
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
      price: 29.99,
      interval: 'month',
      limits: SUBSCRIPTION_PLANS.PRO.limits
    },
    yearly: {
      name: 'Pro Yearly',
      stripePriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
      price: 287.88, // 20% discount from monthly price
      interval: 'year',
      savings: 72,
      fullPrice: 359.88,
      limits: SUBSCRIPTION_PLANS.PRO.limits
    },
    features: [
      'Unlimited business cards',
      'Premium card scanning',
      'Unlimited email drafts',
      'Unlimited events',
      'Unlimited link customization',
      'No banner ads',
      'Premium digital profile',
      'QR code integration',
      'Download your business cards',
      'Advanced social integration',
      'Priority AI message generation',
      'Advanced contact management',
      'Premium support 24/7',
      'Early access to new features'
    ]
  }
};

// Export the Express API for Vercel
export default expressApp;

// Only start the server if running locally
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  expressApp.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment variables loaded successfully');
  });
} 