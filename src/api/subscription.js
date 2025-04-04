import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY);

export async function createSubscription(req, res) {
  try {
    const { priceId, userId, email } = req.body;

    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId
      }
    });

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user document in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
      subscriptionStatus: 'active',
      updatedAt: new Date()
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function cancelSubscription(req, res) {
  try {
    const { subscriptionId } = req.body;

    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(subscriptionId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message });
  }
} 