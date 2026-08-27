import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SUBSCRIPTION_PLANS } from './src/config/serverStripe.js';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol
} from '@azure/storage-blob';
import { assertCronAuthorized } from './src/server/crons/helpers.js';
import { runDailyCrons, runMaintenanceCrons } from './src/server/crons/index.js';
import { runScanExtract, runFollowUpDraft } from './src/server/aiService.js';
import crypto from 'crypto';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: join(__dirname, '.env') });

// Prefer server OPENAI_API_KEY; allow one-time migration from old VITE_ key (never ship VITE_ to clients for AI)
if (!process.env.OPENAI_API_KEY && process.env.VITE_OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
  console.warn(
    'Using VITE_OPENAI_API_KEY as OPENAI_API_KEY. Move the key to OPENAI_API_KEY and remove VITE_OPENAI_API_KEY from client env.'
  );
}

const useResend = Boolean(process.env.RESEND_API_KEY);

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
  'AZURE_STORAGE_CONNECTION_STRING',
  'OPENAI_API_KEY',
  ...(useResend
    ? []
    : ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'])
];

const AZURE_UPLOAD_CONTAINERS = new Set(['profile-images', 'custom-icons']);

function parseAzureConnectionString(connectionString) {
  const parts = Object.fromEntries(
    connectionString
      .split(';')
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf('=');
        return [part.slice(0, idx), part.slice(idx + 1)];
      })
  );
  if (!parts.AccountName || !parts.AccountKey) {
    throw new Error('Invalid AZURE_STORAGE_CONNECTION_STRING');
  }
  return parts;
}

function createAzureCredential() {
  const parts = parseAzureConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  return {
    accountName: parts.AccountName,
    credential: new StorageSharedKeyCredential(parts.AccountName, parts.AccountKey)
  };
}

async function requireFirebaseUser(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const err = new Error('Missing Authorization bearer token');
    err.status = 401;
    throw err;
  }
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch {
    const err = new Error('Invalid or expired auth token');
    err.status = 401;
    throw err;
  }
}

function unsubscribeSecret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';
}

function makeUnsubscribeToken(uid) {
  const secret = unsubscribeSecret();
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update(`unsub:${uid}`).digest('hex').slice(0, 32);
}

function verifyUnsubscribeToken(uid, token) {
  const expected = makeUnsubscribeToken(uid);
  if (!expected || !token || expected.length !== String(token).length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(token)));
  } catch {
    return false;
  }
}

function buildUnsubscribeUrl(uid) {
  const token = makeUnsubscribeToken(uid);
  const base = (process.env.APP_URL || 'https://www.billoai.com').replace(/\/$/, '');
  if (!token) return `${base}/profile-setup#email-prefs`;
  return `${base}/api/email/unsubscribe?u=${encodeURIComponent(uid)}&t=${encodeURIComponent(token)}`;
}

function sanitizeUploadFileName(name = 'upload.bin') {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'upload.bin';
}

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

const resendClient = useResend ? new Resend(process.env.RESEND_API_KEY) : null;
const defaultFromAddress =
  process.env.EMAIL_FROM ||
  (process.env.EMAIL_USER
    ? `BilloAI <${process.env.EMAIL_USER}>`
    : 'BilloAI <onboarding@resend.dev>');

// Zoho/SMTP fallback when Resend is not configured
let emailTransporter;
if (!useResend) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: process.env.NODE_ENV !== 'production',
      logger: process.env.NODE_ENV !== 'production'
    });

    emailTransporter.verify(function(error) {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('✅ SMTP email server is ready');
      }
    });
  } catch (err) {
    console.error('Failed to create email transporter:', err);
  }
} else {
  console.log('✅ Resend email client ready (RESEND_API_KEY set)');
}

// Function to send emails with retries (Resend preferred, SMTP fallback)
async function sendEmail({
  to,
  subject,
  html,
  text,
  from = defaultFromAddress,
  maxRetries = 3,
  listUnsubscribeUrl
}) {
  let retries = 0;
  const headers = {};
  if (listUnsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${listUnsubscribeUrl}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  while (retries < maxRetries) {
    try {
      console.log(`Attempting to send email to ${to} with subject: ${subject} (Attempt ${retries + 1}/${maxRetries})`);

      if (resendClient) {
        const { data, error } = await resendClient.emails.send({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text,
          headers: Object.keys(headers).length ? headers : undefined
        });
        if (error) {
          throw new Error(error.message || JSON.stringify(error));
        }
        console.log('Email sent via Resend:', data?.id);
        return {
          success: true,
          messageId: data?.id,
          provider: 'resend'
        };
      }

      if (!emailTransporter) {
        console.error('Email transporter not initialized');
        return { success: false, error: 'Email transporter not initialized' };
      }

      const info = await emailTransporter.sendMail({
        from,
        to,
        subject,
        html,
        text,
        headers: Object.keys(headers).length ? headers : undefined
      });
      console.log('Email sent via SMTP:', info.messageId);
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
        response: info.response,
        provider: 'smtp'
      };
    } catch (error) {
      retries++;
      console.error(`Error sending email (Attempt ${retries}/${maxRetries}):`, error);

      if (retries >= maxRetries) {
        return {
          success: false,
          error: error.message,
          code: error.code,
          attempts: retries
        };
      }

      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
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

async function sendPaymentFailedEmail(userEmail, plan, invoiceUrl) {
  const planName = plan === 'PRO' ? 'Pro' : plan === 'BASIC' ? 'Basic' : 'your';
  const html = `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;">
      <p style="margin:0 0 20px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#0f766e;">BilloAI</p>
      <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px;">We couldn’t process a payment</h1>
      <p style="color:#374151;font-size:16px;line-height:1.5;">Your ${planName} subscription payment didn’t go through. Stripe usually retries automatically — you can also update your card when convenient.</p>
      ${invoiceUrl ? `<p style="margin:24px 0;"><a href="${invoiceUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Review invoice</a></p>` : ''}
      <p style="margin:24px 0 0;color:#6b7280;font-size:13px;">This is a billing notice, not a marketing email.</p>
      <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} BilloAI</p>
    </div>
  `;
  const text = `We couldn’t process a payment for your BilloAI ${planName} plan.${invoiceUrl ? ` Review invoice: ${invoiceUrl}` : ''} Stripe may retry automatically.`;
  return sendEmail({
    to: userEmail,
    subject: 'BilloAI — payment needs attention',
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

// Create subscription endpoint (auth required — userId from token)
expressApp.post('/api/subscription/create', async (req, res) => {
  try {
    const decoded = await requireFirebaseUser(req);
    console.log('Received subscription creation request:', req.body);
    const { plan, billingCycle, email, successUrl, cancelUrl } = req.body;
    const userId = decoded.uid;

    if (!plan || !billingCycle || !userId || !email || !successUrl || !cancelUrl) {
      console.log('Missing fields:', { plan, billingCycle, userId, email, successUrl, cancelUrl });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (req.body.userId && req.body.userId !== userId) {
      return res.status(403).json({ error: 'userId does not match authenticated user' });
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
    const status = error.status || 500;
    console.error('Error creating subscription:', error);
    res.status(status).json({ error: error.message });
  }
});

// Handle subscription cancellation
expressApp.post('/api/subscription/cancel', async (req, res) => {
  try {
    const decoded = await requireFirebaseUser(req);
    const userId = decoded.uid;
    const { subscriptionId, userEmail } = req.body;
    console.log('Received cancellation request for userId:', userId, 'subscriptionId:', subscriptionId);
    debugLog('Cancellation request', { userId, subscriptionId, userEmail });
    
    if (!userId) {
      console.error('Missing userId in request body');
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (req.body.userId && req.body.userId !== userId) {
      return res.status(403).json({ error: 'userId does not match authenticated user' });
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

// Check subscription status and access (self only)
expressApp.get('/api/subscription/status/:userId', async (req, res) => {
  try {
    const decoded = await requireFirebaseUser(req);
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (userId !== decoded.uid) {
      return res.status(403).json({ error: 'Forbidden' });
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

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        let userId = invoice.metadata?.userId || null;
        let userEmail = invoice.customer_email || null;
        let plan = 'BASIC';

        if (customerId) {
          try {
            const customer = await stripe.customers.retrieve(customerId);
            userId = userId || customer.metadata?.userId || null;
            userEmail = userEmail || customer.email || null;
          } catch (custErr) {
            console.error('Could not load Stripe customer for payment_failed:', custErr.message);
          }
        }

        if (userId) {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            plan = userData.plan || plan;
            userEmail = userEmail || userData.email || userData.subscriptionEmail;
            const lastFailed = userData.lastPaymentFailedEmailAt?.toDate
              ? userData.lastPaymentFailedEmailAt.toDate()
              : userData.lastPaymentFailedEmailAt
                ? new Date(userData.lastPaymentFailedEmailAt)
                : null;
            // At most one payment-failed email per 3 days
            if (lastFailed && Date.now() - lastFailed.getTime() < 3 * 24 * 60 * 60 * 1000) {
              console.log(`Skipping payment_failed email for ${userId} (recently notified)`);
              break;
            }
            if (userEmail) {
              await sendPaymentFailedEmail(userEmail, plan, invoice.hosted_invoice_url);
              await userDoc.ref.update({
                lastPaymentFailedEmailAt: new Date(),
                lastPaymentFailedInvoiceId: invoice.id || null,
                updatedAt: new Date()
              });
            }
          }
        } else if (userEmail) {
          await sendPaymentFailedEmail(userEmail, plan, invoice.hosted_invoice_url);
        }
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
    const decoded = await requireFirebaseUser(req);
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (userId !== decoded.uid) {
      return res.status(403).json({ error: 'Forbidden' });
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
    const decoded = await requireFirebaseUser(req);
    const userId = decoded.uid;
    const { emailType } = req.body;

    if (req.body.userId && req.body.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
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

/**
 * Issue a short-lived SAS URL so the browser can PUT an image to Azure Blob
 * without exposing the storage account key. Containers: profile-images | custom-icons
 */
expressApp.post('/api/uploads/sas', async (req, res) => {
  try {
    const decoded = await requireFirebaseUser(req);
    const { container, fileName, contentType } = req.body || {};

    if (!AZURE_UPLOAD_CONTAINERS.has(container)) {
      return res.status(400).json({ error: 'Invalid upload container' });
    }
    if (!contentType || !String(contentType).startsWith('image/')) {
      return res.status(400).json({ error: 'Only image uploads are allowed' });
    }

    const { accountName, credential } = createAzureCredential();
    const safeName = sanitizeUploadFileName(fileName);
    const blobName = `${decoded.uid}/${Date.now()}-${safeName}`;
    const expiresOn = new Date(Date.now() + 10 * 60 * 1000);

    const sas = generateBlobSASQueryParameters(
      {
        containerName: container,
        blobName,
        permissions: BlobSASPermissions.parse('cw'),
        startsOn: new Date(Date.now() - 60 * 1000),
        expiresOn,
        protocol: SASProtocol.Https,
        contentType
      },
      credential
    ).toString();

    const blobUrl = `https://${accountName}.blob.core.windows.net/${container}/${blobName}`;
    res.json({
      uploadUrl: `${blobUrl}?${sas}`,
      blobUrl,
      expiresOn: expiresOn.toISOString()
    });
  } catch (error) {
    console.error('Error creating upload SAS:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to create upload URL' });
  }
});

// --- AI (server-side OpenAI; auth required) ---
expressApp.post('/api/ai/scan-extract', async (req, res) => {
  try {
    await requireFirebaseUser(req);
    const { imageDataUrl } = req.body || {};
    const result = await runScanExtract(imageDataUrl);
    res.json(result);
  } catch (error) {
    console.error('scan-extract failed:', error);
    const status = error.status || (error.code === 'invalid_api_key' ? 503 : 500);
    const message =
      error.code === 'invalid_api_key' || error.status === 401
        ? 'AI is misconfigured (invalid OpenAI API key). Update OPENAI_API_KEY on the server.'
        : error.message || 'Scan failed';
    res.status(status).json({ error: message });
  }
});

expressApp.post('/api/ai/follow-up-draft', async (req, res) => {
  try {
    await requireFirebaseUser(req);
    const { sender, recipient, eventContext, metNote } = req.body || {};
    if (!recipient || typeof recipient !== 'object') {
      return res.status(400).json({ error: 'recipient is required' });
    }
    const result = await runFollowUpDraft({ sender, recipient, eventContext, metNote });
    res.json(result);
  } catch (error) {
    console.error('follow-up-draft failed:', error);
    const status = error.status || (error.code === 'invalid_api_key' ? 503 : 500);
    const message =
      error.code === 'invalid_api_key' || error.status === 401
        ? 'AI is misconfigured (invalid OpenAI API key). Update OPENAI_API_KEY on the server.'
        : error.message || 'Draft failed';
    res.status(status).json({ error: message });
  }
});

// Stripe Customer Portal
expressApp.post('/api/subscription/portal', async (req, res) => {
  try {
    const decoded = await requireFirebaseUser(req);
    const userId = decoded.uid;
    const returnUrl =
      (req.body && req.body.returnUrl) ||
      `${(process.env.APP_URL || 'https://www.billoai.com').replace(/\/$/, '')}/subscription`;

    const customerDoc = await db.collection('stripe_customers').doc(userId).get();
    if (!customerDoc.exists) {
      return res.status(400).json({ error: 'No Stripe customer found. Subscribe once first.' });
    }
    const customerId = customerDoc.data().customerId;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('portal session failed:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to open billing portal' });
  }
});

// One-click unsubscribe (signed token)
expressApp.get('/api/email/unsubscribe', async (req, res) => {
  try {
    const uid = String(req.query.u || '');
    const token = String(req.query.t || '');
    if (!uid || !verifyUnsubscribeToken(uid, token)) {
      return res.status(400).send('Invalid or expired unsubscribe link.');
    }
    await db.collection('users').doc(uid).set(
      {
        emailUnsubscribed: true,
        productEmailsOptOut: true,
        emailSubscribed: false,
        unsubscribedAt: new Date(),
        updatedAt: new Date()
      },
      { merge: true }
    );
    const appUrl = (process.env.APP_URL || 'https://www.billoai.com').replace(/\/$/, '');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html><html><body style="font-family:system-ui;padding:2rem;max-width:32rem;margin:auto;">
      <h1>You're unsubscribed</h1>
      <p>You won't get BilloAI product emails (nudges, wrap-ups, reminders). Billing receipts may still arrive from Stripe.</p>
      <p><a href="${appUrl}/profile-setup#email-prefs">Manage email preferences</a></p>
    </body></html>`);
  } catch (error) {
    console.error('unsubscribe failed:', error);
    res.status(500).send('Could not unsubscribe. Try again from Profile & settings.');
  }
});

expressApp.post('/api/email/preferences', async (req, res) => {
  try {
    const decoded = await requireFirebaseUser(req);
    const optOut = Boolean(req.body?.productEmailsOptOut);
    await db.collection('users').doc(decoded.uid).set(
      {
        productEmailsOptOut: optOut,
        emailUnsubscribed: optOut,
        emailSubscribed: !optOut,
        updatedAt: new Date()
      },
      { merge: true }
    );
    res.json({ ok: true, productEmailsOptOut: optOut });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to update preferences' });
  }
});

// Account data export
expressApp.get('/api/account/export', async (req, res) => {
  try {
    const decoded = await requireFirebaseUser(req);
    const uid = decoded.uid;
    const [userDoc, cardsSnap, draftsSnap, eventsSnap, usageDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('business-cards').where('userId', '==', uid).get(),
      db.collection('email-drafts').where('userId', '==', uid).get(),
      db.collection('events').where('userId', '==', uid).get(),
      db.collection('usage_stats').doc(uid).get()
    ]);
    const payload = {
      exportedAt: new Date().toISOString(),
      user: userDoc.exists ? userDoc.data() : null,
      usage: usageDoc.exists ? usageDoc.data() : null,
      businessCards: cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      emailDrafts: draftsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      events: eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    };
    res.setHeader('Content-Disposition', 'attachment; filename="billoai-export.json"');
    res.json(payload);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Export failed' });
  }
});

// Account deletion (Auth + Firestore user data)
expressApp.post('/api/account/delete', async (req, res) => {
  try {
    const decoded = await requireFirebaseUser(req);
    const uid = decoded.uid;
    const confirm = String(req.body?.confirm || '');
    if (confirm !== 'DELETE') {
      return res.status(400).json({ error: 'Send { confirm: "DELETE" } to proceed' });
    }

    const batchDelete = async (snap) => {
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = db.batch();
        docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    };

    const [cardsSnap, draftsSnap, eventsSnap] = await Promise.all([
      db.collection('business-cards').where('userId', '==', uid).get(),
      db.collection('email-drafts').where('userId', '==', uid).get(),
      db.collection('events').where('userId', '==', uid).get()
    ]);
    await batchDelete(cardsSnap);
    await batchDelete(draftsSnap);
    await batchDelete(eventsSnap);
    await db.collection('usage_stats').doc(uid).delete().catch(() => {});
    await db.collection('stripe_customers').doc(uid).delete().catch(() => {});
    await db.collection('users').doc(uid).delete().catch(() => {});
    await admin.auth().deleteUser(uid);
    res.json({ ok: true });
  } catch (error) {
    console.error('account delete failed:', error);
    res.status(error.status || 500).json({ error: error.message || 'Delete failed' });
  }
});

async function handleCron(req, res, runner) {
  try {
    assertCronAuthorized(req);
    const result = await runner({
      db,
      stripe,
      auth: admin.auth(),
      sendEmail,
      now: new Date()
    });
    console.log('Cron completed:', JSON.stringify(result));
    res.status(200).json(result);
  } catch (error) {
    console.error('Cron failed:', error);
    res.status(error.status || 500).json({
      ok: false,
      error: error.message || 'Cron failed'
    });
  }
}

// Vercel Cron: product emails (nudges, wrap-ups, renewals) — once daily (Hobby-safe)
expressApp.get('/api/cron/daily', (req, res) => handleCron(req, res, runDailyCrons));

// Vercel Cron: subscription expiry + Stripe reconcile — once daily
expressApp.get('/api/cron/maintenance', (req, res) => handleCron(req, res, runMaintenanceCrons));

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
      provider: useResend ? 'resend' : 'smtp',
      from: defaultFromAddress,
      host: process.env.EMAIL_HOST,
      user: process.env.EMAIL_USER,
      resendConfigured: useResend,
      smtpConfigured: !!emailTransporter
    });

    if (useResend) {
      console.log('✅ Resend configured — app emails will use RESEND_API_KEY');
    } else if (emailTransporter) {
      emailTransporter.verify()
        .then(() => console.log('✅ Email verification passed'))
        .catch(err => console.error('❌ Email verification failed:', err));
    } else {
      console.error('❌ No email provider configured (set RESEND_API_KEY or SMTP EMAIL_*)');
    }
  });
} 