import {
  APP_URL,
  DAY_MS,
  emailShell,
  resolveUserEmail,
  toDate,
  buildUnsubscribeUrl
} from './helpers.js';

/**
 * Renewal heads-up: once at ~7 days before period end (active subs only).
 * Factual billing context — not marketing urgency.
 */
export async function runRenewalReminders({ db, sendEmail, now = new Date() }) {
  const summary = { scanned: 0, emailsSent: 0, errors: [] };

  const windowStart = new Date(now.getTime() + 6 * DAY_MS);
  const windowEnd = new Date(now.getTime() + 8 * DAY_MS);

  // Prefer querying by subscriptionEndDate when stored as Timestamp/Date
  const snap = await db
    .collection('users')
    .where('subscriptionStatus', '==', 'active')
    .limit(300)
    .get();

  summary.scanned = snap.size;

  for (const userDoc of snap.docs) {
    try {
      const userData = userDoc.data();
      if (!userData.plan || userData.plan === 'FREE') continue;
      if (userData.renewalReminder7dSentForEndDate) {
        const alreadyFor = toDate(userData.renewalReminder7dSentForEndDate);
        const end = toDate(userData.subscriptionEndDate);
        if (alreadyFor && end && Math.abs(alreadyFor.getTime() - end.getTime()) < DAY_MS) {
          continue;
        }
      }

      const endDate = toDate(userData.subscriptionEndDate);
      if (!endDate) continue;
      if (endDate < windowStart || endDate > windowEnd) continue;

      // cancel_at_period_end users are often marked canceled locally — skip those
      if (userData.subscriptionStatus === 'canceled') continue;

      const email = resolveUserEmail(userData);
      if (!email) continue;

      const planName = userData.plan === 'PRO' ? 'Pro' : 'Basic';
      const cycle = userData.billingCycle === 'yearly' ? 'yearly' : 'monthly';
      const endLabel = endDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      const firstName = (userData.displayName || '').split(' ')[0] || 'there';

      const { html, text } = emailShell({
        title: `Your ${planName} plan renews soon`,
        intro: `Hi ${firstName} — just a quiet heads-up that your BilloAI ${planName} (${cycle}) plan renews on ${endLabel}.`,
        bodyHtml: `<p style="color:#374151;font-size:15px;line-height:1.5;margin:0;">No action needed if you want to continue. You can review or change your plan anytime.</p>`,
        ctaLabel: 'Manage subscription',
        ctaUrl: `${APP_URL}/subscription`,
        footerNote: 'Billing notices only — we won’t spam your inbox about this renewal.',
        unsubscribeUrl: buildUnsubscribeUrl(userDoc.id)
      });

      const result = await sendEmail({
        to: email,
        subject: `BilloAI ${planName} renews on ${endLabel}`,
        html,
        text,
        listUnsubscribeUrl: buildUnsubscribeUrl(userDoc.id)
      });

      if (!result?.success) {
        summary.errors.push({ userId: userDoc.id, error: result?.error || 'send failed' });
        continue;
      }

      summary.emailsSent += 1;
      await userDoc.ref.update({
        renewalReminder7dSentForEndDate: endDate,
        updatedAt: now
      });
    } catch (err) {
      summary.errors.push({ userId: userDoc.id, error: err.message });
    }
  }

  return summary;
}
