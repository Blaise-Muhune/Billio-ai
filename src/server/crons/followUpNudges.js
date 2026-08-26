import {
  APP_URL,
  DAY_MS,
  daysBetween,
  emailShell,
  escapeHtml,
  isWeekendUtc,
  resolveUserEmail,
  toDate,
  userWantsProductEmails,
  buildUnsubscribeUrl
} from './helpers.js';

/** First gentle nudge after ~2 days; final nudge ~7 days later. Cap at 2. */
const FIRST_NUDGE_AFTER_DAYS = 2;
const SECOND_NUDGE_AFTER_DAYS = 7;
const MAX_NUDGES = 2;
const STALE_AFTER_DAYS = 18;

/**
 * One digest per user for unsent drafts — never emails the contact.
 */
export async function runFollowUpNudges({ db, sendEmail, now = new Date() }) {
  const summary = { scanned: 0, eligible: 0, emailsSent: 0, draftsUpdated: 0, skippedWeekend: false, errors: [] };

  // Soften inbox noise: skip Saturdays/Sundays UTC
  if (isWeekendUtc(now)) {
    summary.skippedWeekend = true;
    return summary;
  }

  const cutoff = new Date(now.getTime() - FIRST_NUDGE_AFTER_DAYS * DAY_MS);
  const staleBefore = new Date(now.getTime() - STALE_AFTER_DAYS * DAY_MS);

  const byUser = new Map();

  const snap = await db
    .collection('email-drafts')
    .where('status', 'in', ['draft', 'compose_opened'])
    .where('createdAt', '<=', cutoff)
    .where('createdAt', '>', staleBefore)
    .limit(400)
    .get();

  summary.scanned = snap.size;

  for (const doc of snap.docs) {
    const data = doc.data();
    const createdAt = toDate(data.createdAt);
    if (!createdAt || !data.userId) continue;

    const nudgeCount = Number(data.nudgeCount || 0);
    if (nudgeCount >= MAX_NUDGES || data.nudgeComplete) continue;

    const ageDays = daysBetween(createdAt, now);
    const lastNudgeAt = toDate(data.lastNudgeAt);

    let due = false;
    if (nudgeCount === 0 && ageDays >= FIRST_NUDGE_AFTER_DAYS) {
      due = true;
    } else if (
      nudgeCount === 1 &&
      ageDays >= SECOND_NUDGE_AFTER_DAYS &&
      (!lastNudgeAt || daysBetween(lastNudgeAt, now) >= 5)
    ) {
      due = true;
    }

    if (!due) continue;

    summary.eligible += 1;
    if (!byUser.has(data.userId)) byUser.set(data.userId, []);
    byUser.get(data.userId).push({ id: doc.id, ref: doc.ref, data, createdAt });
  }

  for (const [userId, drafts] of byUser) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) continue;
      const userData = userDoc.data();
      if (!userWantsProductEmails(userData)) continue;

      const email = resolveUserEmail(userData);
      if (!email) continue;

      const lastDigest = toDate(userData.lastFollowUpNudgeDigestAt);
      if (lastDigest && daysBetween(lastDigest, now) < 1) continue;

      const firstName = (userData.displayName || '').split(' ')[0] || 'there';
      const items = drafts.slice(0, 8);
      const listHtml = items
        .map((d) => {
          const name = escapeHtml(d.data.recipientName || 'a contact');
          const company = d.data.recipientCompany && d.data.recipientCompany !== 'Unknown'
            ? ` <span style="color:#6b7280;">· ${escapeHtml(d.data.recipientCompany)}</span>`
            : '';
          return `<li style="margin:0 0 8px;">${name}${company}</li>`;
        })
        .join('');

      const count = drafts.length;
      const title =
        count === 1
          ? `One follow-up still waiting`
          : `${count} follow-ups still waiting`;
      const intro =
        count === 1
          ? `Hi ${firstName} — a short note is drafted and ready when you are.`
          : `Hi ${firstName} — a few notes are drafted from people you met. Send them while the conversation is still fresh.`;

      const isFinalWave = items.every((d) => Number(d.data.nudgeCount || 0) >= 1);
      const footerNote = isFinalWave
        ? 'This is the last reminder for these drafts. No more nudges unless you create new ones.'
        : 'We’ll only nudge again once if these are still unsent.';

      const { html, text } = emailShell({
        title,
        intro,
        bodyHtml: `<ul style="padding-left:18px;margin:0;color:#111827;font-size:15px;line-height:1.5;">${listHtml}</ul>`,
        ctaLabel: 'Open follow-ups',
        ctaUrl: `${APP_URL}/home`,
        footerNote,
        unsubscribeUrl: buildUnsubscribeUrl(userId)
      });

      const result = await sendEmail({
        to: email,
        subject: title,
        html,
        text,
        listUnsubscribeUrl: buildUnsubscribeUrl(userId)
      });

      if (!result?.success) {
        summary.errors.push({ userId, error: result?.error || 'send failed' });
        continue;
      }

      summary.emailsSent += 1;
      const batch = db.batch();
      for (const d of drafts) {
        const nextCount = Number(d.data.nudgeCount || 0) + 1;
        batch.update(d.ref, {
          nudgeCount: nextCount,
          lastNudgeAt: now,
          nudgeComplete: nextCount >= MAX_NUDGES,
          updatedAt: now
        });
        summary.draftsUpdated += 1;
      }
      batch.update(db.collection('users').doc(userId), {
        lastFollowUpNudgeDigestAt: now,
        updatedAt: now
      });
      await batch.commit();
    } catch (err) {
      summary.errors.push({ userId, error: err.message });
    }
  }

  return summary;
}
