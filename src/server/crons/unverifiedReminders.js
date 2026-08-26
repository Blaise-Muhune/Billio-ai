import {
  APP_URL,
  DAY_MS,
  emailShell,
  resolveUserEmail,
  toDate,
  buildUnsubscribeUrl
} from './helpers.js';

/**
 * One soft reminder if signup email still unverified after 2 days.
 * Uses Firebase Auth as source of truth; points user to the app (no auto re-send).
 */
export async function runUnverifiedReminders({ db, auth, sendEmail, now = new Date() }) {
  const summary = { scanned: 0, emailsSent: 0, errors: [] };
  const minAge = new Date(now.getTime() - 2 * DAY_MS);
  const maxAge = new Date(now.getTime() - 14 * DAY_MS);

  if (!auth?.listUsers) {
    summary.errors.push({ error: 'Firebase Auth admin not available' });
    return summary;
  }

  let pageToken;
  let pages = 0;
  const MAX_PAGES = 20;
  do {
    const result = await auth.listUsers(100, pageToken);
    pages += 1;
    for (const user of result.users) {
      summary.scanned += 1;
      try {
        if (user.emailVerified || !user.email) continue;
        const createdAt = user.metadata?.creationTime
          ? new Date(user.metadata.creationTime)
          : null;
        if (!createdAt || createdAt > minAge || createdAt < maxAge) continue;

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        if (userData.verificationReminderSentAt) continue;

        const email = user.email || resolveUserEmail(userData);
        if (!email) continue;

        const firstName =
          (user.displayName || userData.displayName || '').split(' ')[0] || 'there';
        const { html, text } = emailShell({
          title: 'Confirm your email when you have a minute',
          intro: `Hi ${firstName} — your BilloAI account is ready. Confirming your email keeps follow-ups and billing notices working reliably.`,
          bodyHtml: `<p style="color:#374151;font-size:15px;line-height:1.5;margin:0;">Open the app, tap <strong>resend the link</strong> on the yellow banner, then confirm from your inbox.</p>`,
          ctaLabel: 'Confirm email in BilloAI',
          ctaUrl: `${APP_URL}/home`,
          footerNote: 'One reminder only. We won’t keep asking.',
          unsubscribeUrl: buildUnsubscribeUrl(user.uid)
        });

        const sendResult = await sendEmail({
          to: email,
          subject: 'Confirm your BilloAI email',
          html,
          text,
          listUnsubscribeUrl: buildUnsubscribeUrl(user.uid)
        });

        if (!sendResult?.success) {
          summary.errors.push({ userId: user.uid, error: sendResult?.error || 'send failed' });
          continue;
        }

        summary.emailsSent += 1;
        await db.collection('users').doc(user.uid).set(
          {
            verificationReminderSentAt: now,
            updatedAt: now
          },
          { merge: true }
        );
      } catch (err) {
        summary.errors.push({ userId: user.uid, error: err.message });
      }
    }
    pageToken = result.pageToken;
  } while (pageToken && pages < MAX_PAGES);

  return summary;
}
