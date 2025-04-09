import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SUBSCRIPTION_PLANS } from './src/config/serverStripe.js';
import nodemailer from 'nodemailer';

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
  'STRIPE_WEBHOOK_SECRET',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS'
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

// Debug logging helper
function debugLog(title, data) {
  console.log('\n==== DEBUG: ' + title + ' ====');
  console.log(JSON.stringify(data, null, 2));
  console.log('==== END DEBUG: ' + title + ' ====\n');
}

// Initialize Stripe with error checking
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Stripe secret key is missing');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' // Latest stable version
});

// Set up email transporter
let emailTransporter;
try {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add important options for reliability
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    },
    debug: true, // Enable debug output
    logger: true // Log information to the console
  });
  
  // Verify connection configuration
  emailTransporter.verify(function(error, success) {
    if (error) {
      console.error('Email transporter verification failed:', error);
      console.log('Attempting to create fallback ethereal email account...');
      
      // Create a test account on ethereal.email for testing
      nodemailer.createTestAccount().then(testAccount => {
        console.log('Created ethereal test account', testAccount);
        
        // Create a transporter using the ethereal test account
        emailTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
          debug: true,
          logger: true
        });
        
        console.log('⚠️ Using Ethereal Email as fallback. All emails will be captured at ethereal.email and not actually delivered.');
      }).catch(err => {
        console.error('Failed to create fallback email account:', err);
      });
    } else {
      console.log('✅ Email server is ready to send messages');
      console.log('Email configuration:', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS ? '[PROVIDED]' : '[NOT PROVIDED]'
      });
    }
  });
} catch (err) {
  console.error('Failed to create email transporter:', err);
  
  // Try to create a fallback ethereal email account
  try {
    nodemailer.createTestAccount().then(testAccount => {
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        }
      });
      console.log('Created fallback ethereal email account', testAccount);
    });
  } catch (fallbackErr) {
    console.error('Failed to create fallback email account:', fallbackErr);
  }
}

// Function to send emails with retries
async function sendEmail({ to, subject, html, text, from = `"BilloAI" <${process.env.EMAIL_USER}>`, maxRetries = 3 }) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      if (!emailTransporter) {
        console.error('Email transporter not initialized');
        return { success: false, error: 'Email transporter not initialized' };
      }
      
      console.log(`Attempting to send email to ${to} with subject: ${subject} (Attempt ${retries + 1}/${maxRetries})`);
      
      const mailOptions = {
        from,
        to,
        subject,
        html,
        text
      };
      
      console.log('Email options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        textLength: mailOptions.text?.length || 0,
        htmlLength: mailOptions.html?.length || 0
      });
      
      const info = await emailTransporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info);
      console.log('Message ID:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      
      return { 
        success: true, 
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
        response: info.response
      };
    } catch (error) {
      retries++;
      console.error(`Error sending email (Attempt ${retries}/${maxRetries}):`, error);
      
      if (retries >= maxRetries) {
        console.error('Email sending failed after maximum retries:', {
          code: error.code,
          command: error.command,
          response: error.response,
          responseCode: error.responseCode,
          stack: error.stack
        });
        
        return { 
          success: false, 
          error: error.message,
          code: error.code,
          command: error.command,
          responseCode: error.responseCode,
          attempts: retries
        };
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Function to send subscription confirmation email
async function sendSubscriptionConfirmationEmail(userEmail, plan, billingCycle, endDate) {
  const planName = plan === 'BASIC' ? 'Basic' : 'Pro';
  const cycleText = billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
  const price = EXTENDED_SUBSCRIPTION_PLANS[plan][billingCycle].price;
  
  // Format the price with proper currency display
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
  
  const planFeatures = EXTENDED_SUBSCRIPTION_PLANS[plan].features || [];
  const featuresHtml = planFeatures.map(feature => `<li style="margin-bottom: 8px;">✓ ${feature}</li>`).join('');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://billoai.com/logo.png" alt="BilloAI Logo" style="height: 40px;" />
      </div>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #dcfce7;">
        <h1 style="color: #166534; margin-top: 0; font-size: 24px;">Thank You for Your Subscription!</h1>
        <p style="color: #166534; font-size: 16px;">Your BilloAI ${planName} ${cycleText} plan is now active.</p>
      </div>
      
      <h2 style="color: #333; font-size: 20px;">Subscription Details</h2>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Billing Cycle:</strong> ${cycleText}</p>
        <p><strong>Amount:</strong> ${formattedPrice}${billingCycle === 'yearly' ? '/year' : '/month'}</p>
        ${endDate ? `<p><strong>Next Billing Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>` : ''}
      </div>
      
      <h2 style="color: #333; font-size: 20px;">Plan Features</h2>
      <ul style="padding-left: 20px; color: #4b5563;">
        ${featuresHtml}
      </ul>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6b7280; font-size: 14px;">
        <p>If you have any questions about your subscription, please contact us at <a href="mailto:support@billoai.com" style="color: #10b981;">support@billoai.com</a>.</p>
      </div>
      
      <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p>© ${new Date().getFullYear()} BilloAI. All rights reserved.</p>
      </div>
    </div>
  `;
  
  // Plain text version
  const text = `
    Thank You for Your Subscription!
    
    Your BilloAI ${planName} ${cycleText} plan is now active.
    
    Subscription Details:
    - Plan: ${planName}
    - Billing Cycle: ${cycleText}
    - Amount: ${formattedPrice}${billingCycle === 'yearly' ? '/year' : '/month'}
    ${endDate ? `- Next Billing Date: ${new Date(endDate).toLocaleDateString()}` : ''}
    
    If you have any questions, please contact us at support@billoai.com.
    
    © ${new Date().getFullYear()} BilloAI. All rights reserved.
  `;
  
  return sendEmail({
    to: userEmail,
    subject: `Your BilloAI ${planName} Plan Subscription Confirmation`,
    html,
    text
  });
}

// Function to send subscription cancellation email
async function sendSubscriptionCancellationEmail(userEmail, plan, endDate) {
  const planName = plan === 'BASIC' ? 'Basic' : 'Pro';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://billoai.com/logo.png" alt="BilloAI Logo" style="height: 40px;" />
      </div>
      
      <div style="background-color: #fff7ed; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #ffedd5;">
        <h1 style="color: #9a3412; margin-top: 0; font-size: 24px;">Subscription Cancellation Confirmation</h1>
        <p style="color: #9a3412; font-size: 16px;">Your BilloAI ${planName} plan has been canceled.</p>
      </div>
      
      <p style="color: #4b5563; font-size: 16px;">We're sorry to see you go, but we appreciate the time you spent with us.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Access Until:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        <p>You'll continue to have access to all ${planName} features until this date.</p>
      </div>
      
      <p style="color: #4b5563;">After your subscription ends, your account will be downgraded to the Free tier automatically.</p>
      
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0f2fe;">
        <p style="color: #0369a1; margin-top: 0;"><strong>Changed your mind?</strong></p>
        <p style="color: #0369a1; margin-bottom: 0;">You can resubscribe at any time to restore your premium access by visiting your <a href="https://billoai.com/subscription" style="color: #0ea5e9;">subscription page</a>.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6b7280; font-size: 14px;">
        <p>If you have any questions or feedback, please contact us at <a href="mailto:support@billoai.com" style="color: #10b981;">support@billoai.com</a>.</p>
      </div>
      
      <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p>© ${new Date().getFullYear()} BilloAI. All rights reserved.</p>
      </div>
    </div>
  `;
  
  // Plain text version
  const text = `
    Subscription Cancellation Confirmation
    
    Your BilloAI ${planName} plan has been canceled.
    
    We're sorry to see you go, but we appreciate the time you spent with us.
    
    Access Until: ${new Date(endDate).toLocaleDateString()}
    You'll continue to have access to all ${planName} features until this date.
    
    After your subscription ends, your account will be downgraded to the Free tier automatically.
    
    Changed your mind?
    You can resubscribe at any time to restore your premium access by visiting your subscription page at https://billoai.com/subscription.
    
    If you have any questions or feedback, please contact us at support@billoai.com.
    
    © ${new Date().getFullYear()} BilloAI. All rights reserved.
  `;
  
  return sendEmail({
    to: userEmail,
    subject: `Your BilloAI Subscription Cancellation Confirmation`,
    html,
    text
  });
}

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
    const { userId, subscriptionId, userEmail } = req.body;
    console.log('Received cancellation request for userId:', userId, 'subscriptionId:', subscriptionId);
    debugLog('Cancellation request', { userId, subscriptionId, userEmail });
    
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
    debugLog('User data for cancellation', {
      userId,
      email: userData.email,
      hasEmailInRequest: !!userEmail,
      plan: userData.plan,
      subscriptionId: userData.subscriptionId
    });
    
    // If email came directly in the request, make sure it's also in the user data
    if (userEmail && (!userData.email || userData.email !== userEmail)) {
      console.log(`Updating user's email from request: ${userEmail}`);
      await userRef.update({
        email: userEmail,
        subscriptionEmail: userEmail,
        emailSubscribed: true,
        updatedAt: new Date()
      });
      userData.email = userEmail; // Update local copy as well
      userData.subscriptionEmail = userEmail;
      userData.emailSubscribed = true;
    }
    
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
      console.log('Subscription current_period_end timestamp:', subscription.current_period_end);
      
      // Convert timestamp to Date object
      const endDate = new Date(subscription.current_period_end * 1000);
      console.log('Converted end date:', endDate.toISOString());

      // Update user document with subscription status
      await userRef.update({
        subscriptionStatus: 'canceled',
        subscriptionEndDate: endDate,
        updatedAt: new Date()
      });

      // Get the current plan's features for the remaining period
      const currentPlan = userData.plan;
      const planFeatures = SUBSCRIPTION_PLANS[currentPlan];

      console.log('Updated user document with canceled status and end date:', endDate.toISOString());
      
      // Send cancellation confirmation email
      if (userData.email) {
        try {
          debugLog('User data before sending email', {
            hasEmail: !!userData.email,
            email: userData.email,
            hasSubscriptionEmail: !!userData.subscriptionEmail,
            hasEmailSubscribed: !!userData.emailSubscribed
          });
          
          const emailResult = await sendSubscriptionCancellationEmail(
            userData.email,
            currentPlan,
            endDate
          );
          console.log(`Sent subscription cancellation email to ${userData.email}:`, emailResult);
        } catch (emailError) {
          console.error(`Error sending subscription cancellation email to ${userData.email}:`, emailError);
        }
      } else {
        console.log(`No email found for user ${userId}`);
      }

      res.json({
        success: true,
        message: 'Subscription canceled successfully',
        subscription: {
          status: 'canceled',
          currentPlan,
          endDate: endDate,
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

// Add webhook handler for subscription events
expressApp.post('/api/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Ensure we're using the raw body buffer
    const rawBody = req.body;
    
    console.log('Received webhook with signature:', sig);
    console.log('Raw body type:', typeof rawBody);
    console.log('Raw body is buffer?', Buffer.isBuffer(rawBody));
    
    if (!rawBody) {
      throw new Error('No raw body found in request');
    }

    if (!sig) {
      throw new Error('No Stripe signature found in request headers');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured in environment variables');
    }

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('Webhook event constructed successfully:', event.type);
    } catch (constructError) {
      console.error('Error constructing webhook event:', constructError.message);
      return res.status(400).send(`Webhook Error: ${constructError.message}`);
    }
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
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          console.error(`User document not found for userId: ${userId}`);
          break;
        }
        
        const userData = userDoc.data();
        
        // Get subscription end date (next billing date)
        const endDate = new Date(subscription.current_period_end * 1000);
        
        await userRef.update({
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          plan: planName,
          billingCycle: billingCycle,
          subscriptionEndDate: endDate,
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
        
        // Send confirmation email
        if (userData.email) {
          try {
            debugLog('User data before sending email', {
              hasEmail: !!userData.email,
              email: userData.email,
              hasSubscriptionEmail: !!userData.subscriptionEmail,
              hasEmailSubscribed: !!userData.emailSubscribed
            });
            
            const emailResult = await sendSubscriptionConfirmationEmail(
              userData.email, 
              planName, 
              billingCycle,
              endDate
            );
            console.log(`Sent subscription confirmation email to ${userData.email}:`, emailResult);
          } catch (emailError) {
            console.error(`Error sending subscription confirmation email to ${userData.email}:`, emailError);
          }
        } else {
          console.log(`No email found for user ${userId}`);
        }

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
        
        const userData = userDoc.data();
        const currentPlan = userData.plan || 'FREE';
        
        // Get end date (current time since subscription is already deleted)
        const endDate = new Date();
        
        await userRef.update({
          subscriptionId: null,
          subscriptionStatus: 'canceled',
          plan: 'FREE',
          subscriptionEndDate: endDate,
          limits: {
            maxCards: freePlanLimits.maxCards,
            maxEvents: freePlanLimits.maxEvents,
            maxDraftsPerCard: freePlanLimits.maxDraftsPerCard
          },
          updatedAt: new Date()
        });
        
        // Send cancellation confirmation email
        if (userData.email) {
          try {
            debugLog('User data before sending email', {
              hasEmail: !!userData.email,
              email: userData.email,
              hasSubscriptionEmail: !!userData.subscriptionEmail,
              hasEmailSubscribed: !!userData.emailSubscribed
            });
            
            const emailResult = await sendSubscriptionCancellationEmail(
              userData.email,
              currentPlan,
              endDate
            );
            console.log(`Sent subscription cancellation email to ${userData.email}:`, emailResult);
          } catch (emailError) {
            console.error(`Error sending subscription cancellation email to ${userData.email}:`, emailError);
          }
        } else {
          console.log(`No email found for user ${userId}`);
        }

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
      'QR code'
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
      price: 77.99, // 35% discount from monthly price
      interval: 'year',
      savings: 42,
      fullPrice: 119.88,
      limits: SUBSCRIPTION_PLANS.BASIC.limits
    },
    features: [
      'Up to 20 business cards',
      'Advanced card scanning',
      '10 email drafts per card',
      'Up to 5 events',
      'Enhanced digital profile',
      'QR code',
      'No banner ads'
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
      price: 233.99, // 35% discount from monthly price
      interval: 'year',
      savings: 124,
      fullPrice: 359.88,
      limits: SUBSCRIPTION_PLANS.PRO.limits
    },
    features: [
      'Unlimited business cards',
      'Premium card scanning',
      'Unlimited email drafts',
      'Unlimited events',
      'Premium digital profile',
      'QR code',
      'No banner ads',
      'Custom links'
    ]
  }
};

// Get current period end directly from Stripe
expressApp.get('/api/subscription/period-end/:userId', async (req, res) => {
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
    
    // If there's no subscription ID, user doesn't have an active subscription
    if (!userData.subscriptionId) {
      return res.json({ 
        hasSubscription: false,
        message: 'User has no active subscription'
      });
    }

    try {
      // Get subscription directly from Stripe
      const subscription = await stripe.subscriptions.retrieve(userData.subscriptionId);
      console.log(`Retrieved subscription for user ${userId}:`, subscription.id);
      
      // Get the current period end
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      console.log(`Current period ends on: ${currentPeriodEnd.toISOString()}`);
      
      // Update the user document with the current period end
      await userRef.update({
        subscriptionEndDate: currentPeriodEnd,
        updatedAt: new Date()
      });
      
      return res.json({
        hasSubscription: true,
        subscriptionId: subscription.id,
        currentPeriodEnd: currentPeriodEnd,
        status: subscription.status
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return res.status(400).json({ 
        error: stripeError.message,
        code: stripeError.code
      });
    }
  } catch (error) {
    console.error('Error getting subscription period end:', error);
    return res.status(500).json({ error: 'Failed to retrieve subscription period end' });
  }
});

// Get product catalog
expressApp.get('/api/subscription/catalog', async (req, res) => {
  try {
    res.json({
      plans: EXTENDED_SUBSCRIPTION_PLANS,
      discount: {
        yearly: 35 // 35% discount for yearly plans
      }
    });
  } catch (error) {
    console.error('Error fetching subscription catalog:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription catalog' });
  }
});

// Test Email Endpoint (only in development)
expressApp.post('/api/test-email', async (req, res) => {
  // Check if we're in development environment or if there's a test key
  if (process.env.NODE_ENV === 'production' && req.headers['x-test-key'] !== process.env.EMAIL_TEST_KEY) {
    return res.status(403).json({ error: 'This endpoint is only available in development or with a valid test key' });
  }
  
  try {
    const { to, subject, type } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Email recipient (to) is required' });
    }
    
    console.log(`Received test email request to ${to}, type: ${type || 'custom'}`);
    
    let result;
    
    // Different email templates based on type
    switch (type) {
      case 'subscription':
        result = await sendSubscriptionConfirmationEmail(
          to, 
          'BASIC', 
          'monthly',
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        );
        break;
        
      case 'cancellation':
        result = await sendSubscriptionCancellationEmail(
          to,
          'PRO',
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        );
        break;
        
      default:
        // Custom email
        result = await sendEmail({
          from:'BilloAI <contact@billoai.com>',
          to,
          subject: subject || 'Test Email from BilloAI',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h1 style="color: #166534;">This is a test email</h1>
              <p>If you're seeing this, email sending is working correctly.</p>
              <p>Timestamp: ${new Date().toISOString()}</p>
              <hr />
              <p style="color: #6b7280; font-size: 14px;">This is a test email sent from BilloAI.</p>
            </div>
          `,
          text: `This is a test email. If you're seeing this, email sending is working correctly. Timestamp: ${new Date().toISOString()}`
        });
    }
    
    res.json({ 
      success: result.success,
      message: result.success ? 'Email sent successfully' : 'Failed to send email',
      details: result
    });
  } catch (error) {
    console.error('Error in test-email endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message
    });
  }
});

// Manual endpoint to resend confirmation emails
expressApp.post('/api/subscription/resend-email', async (req, res) => {
  try {
    const { userId, emailType } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get the user data
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const userEmail = userData.email || userData.subscriptionEmail;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'No email address found for user' });
    }
    
    // Determine email type
    const type = emailType || (userData.subscriptionStatus === 'canceled' ? 'cancellation' : 'subscription');
    
    debugLog('Resending email', {
      userId,
      emailType: type,
      email: userEmail,
      subscriptionStatus: userData.subscriptionStatus,
      plan: userData.plan,
      billingCycle: userData.billingCycle
    });
    
    let result;
    
    // Send appropriate email type
    if (type === 'cancellation') {
      // Get end date
      const endDate = userData.subscriptionEndDate ? 
        (userData.subscriptionEndDate.seconds ? 
          new Date(userData.subscriptionEndDate.seconds * 1000) : 
          new Date(userData.subscriptionEndDate)
        ) : 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      result = await sendSubscriptionCancellationEmail(
        userEmail,
        userData.plan || 'BASIC',
        endDate
      );
    } else {
      // Get end date / renewal date
      const endDate = userData.subscriptionEndDate ? 
        (userData.subscriptionEndDate.seconds ? 
          new Date(userData.subscriptionEndDate.seconds * 1000) : 
          new Date(userData.subscriptionEndDate)
        ) : 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      result = await sendSubscriptionConfirmationEmail(
        userEmail,
        userData.plan || 'BASIC',
        userData.billingCycle || 'monthly',
        endDate
      );
    }
    
    res.json({
      success: result.success,
      message: `${type === 'cancellation' ? 'Cancellation' : 'Subscription'} confirmation email ${result.success ? 'sent' : 'failed'}`,
      details: result
    });
  } catch (error) {
    console.error('Error resending confirmation email:', error);
    res.status(500).json({
      error: 'Failed to resend confirmation email',
      details: error.message
    });
  }
});

// Export the Express API for Vercel
export default expressApp;

// Only start the server if running locally
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  expressApp.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment variables loaded successfully');
    
    // Print email configuration on startup
    debugLog('Email Configuration', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? '[PROVIDED]' : '[NOT PROVIDED]',
      transporterInitialized: !!emailTransporter
    });
    
    // Test the email configuration
    if (emailTransporter) {
      emailTransporter.verify()
        .then(() => console.log('✅ Email verification passed'))
        .catch(err => console.error('❌ Email verification failed:', err));
    } else {
      console.error('❌ Email transporter not initialized');
    }
  });
} 