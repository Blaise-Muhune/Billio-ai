import { SUBSCRIPTION_PLANS } from '../../config/serverStripe.js';
import { APP_URL, emailShell, resolveUserEmail, toDate, buildUnsubscribeUrl } from './helpers.js';

/**
 * Soft-downgrade canceled subscriptions past subscriptionEndDate.
 * Sends at most one factual "you're on Free" note if not already notified.
 */
export async function runSubscriptionExpiry({ db, sendEmail, now = new Date() }) {
  const summary = { scanned: 0, downgraded: 0, emailsSent: 0, errors: [] };
  const freeLimits = SUBSCRIPTION_PLANS.FREE.limits;

  const snap = await db
    .collection('users')
    .where('subscriptionStatus', '==', 'canceled')
    .limit(300)
    .get();

  summary.scanned = snap.size;

  for (const userDoc of snap.docs) {
    try {
      const userData = userDoc.data();
      if (!userData.plan || userData.plan === 'FREE') continue;

      const endDate = toDate(userData.subscriptionEndDate);
      if (!endDate || endDate > now) continue;

      const previousPlan = userData.plan;
      await userDoc.ref.update({
        plan: 'FREE',
        limits: {
          maxCards: freeLimits.maxCards,
          maxEvents: freeLimits.maxEvents,
          maxDraftsPerCard: freeLimits.maxDraftsPerCard
        },
        subscriptionId: null,
        updatedAt: now,
        expiredDowngradedAt: now
      });
      summary.downgraded += 1;

      if (userData.expiryEmailSentAt) continue;
      const email = resolveUserEmail(userData);
      if (!email) continue;

      const planName = previousPlan === 'PRO' ? 'Pro' : 'Basic';
      const firstName = (userData.displayName || '').split(' ')[0] || 'there';
      const { html, text } = emailShell({
        title: 'Your account is on the Free plan',
        intro: `Hi ${firstName} — your BilloAI ${planName} access ended, so your account is now on Free limits.`,
        bodyHtml: `<p style="color:#374151;font-size:15px;line-height:1.5;margin:0;">Your contacts and drafts stay put. Upgrade anytime if you need higher limits again.</p>`,
        ctaLabel: 'View plans',
        ctaUrl: `${APP_URL}/subscription`,
        footerNote: 'This is a one-time notice when paid access ends.',
        unsubscribeUrl: buildUnsubscribeUrl(userDoc.id)
      });

      const result = await sendEmail({
        to: email,
        subject: 'BilloAI — now on Free plan',
        html,
        text,
        listUnsubscribeUrl: buildUnsubscribeUrl(userDoc.id)
      });

      if (result?.success) {
        summary.emailsSent += 1;
        await userDoc.ref.update({ expiryEmailSentAt: now });
      } else {
        summary.errors.push({ userId: userDoc.id, error: result?.error || 'send failed' });
      }
    } catch (err) {
      summary.errors.push({ userId: userDoc.id, error: err.message });
    }
  }

  return summary;
}
