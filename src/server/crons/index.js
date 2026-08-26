import { runFollowUpNudges } from './followUpNudges.js';
import { runEventWrapUps } from './eventWrapUp.js';
import { runRenewalReminders } from './renewalReminders.js';
import { runUnverifiedReminders } from './unverifiedReminders.js';
import { runSubscriptionExpiry } from './subscriptionExpiry.js';
import { runStripeReconcile } from './stripeReconcile.js';

export async function runDailyCrons(ctx) {
  const started = Date.now();
  const followUpNudges = await runFollowUpNudges(ctx);
  const eventWrapUps = await runEventWrapUps(ctx);
  const renewalReminders = await runRenewalReminders(ctx);
  const unverifiedReminders = await runUnverifiedReminders(ctx);

  return {
    ok: true,
    job: 'daily',
    durationMs: Date.now() - started,
    followUpNudges,
    eventWrapUps,
    renewalReminders,
    unverifiedReminders
  };
}

export async function runMaintenanceCrons(ctx) {
  const started = Date.now();
  const subscriptionExpiry = await runSubscriptionExpiry(ctx);
  const stripeReconcile = await runStripeReconcile(ctx);

  return {
    ok: true,
    job: 'maintenance',
    durationMs: Date.now() - started,
    subscriptionExpiry,
    stripeReconcile
  };
}

export {
  runFollowUpNudges,
  runEventWrapUps,
  runRenewalReminders,
  runUnverifiedReminders,
  runSubscriptionExpiry,
  runStripeReconcile
};
