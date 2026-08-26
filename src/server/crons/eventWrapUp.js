import {
  APP_URL,
  DAY_MS,
  emailShell,
  escapeHtml,
  resolveUserEmail,
  toDate,
  userWantsProductEmails,
  buildUnsubscribeUrl
} from './helpers.js';

function eventDayKey(dateValue) {
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue.trim())) {
    return dateValue.trim().slice(0, 10);
  }
  const d = toDate(dateValue);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function yesterdayUtcKey(now = new Date()) {
  const y = new Date(now.getTime() - DAY_MS);
  return y.toISOString().slice(0, 10);
}

/**
 * Day after an event: remind them to dump leftover cards / screenshots
 * while the hallway conversations are still fresh. One email per event.
 */
async function sendWrapUpForEvent({ db, sendEmail, eventDoc, now, summary }) {
  const event = eventDoc.data();
  if (event.wrapUpEmailSentAt) return;
  if (!event.userId) return;

  const userDoc = await db.collection('users').doc(event.userId).get();
  if (!userDoc.exists) return;
  const userData = userDoc.data();
  if (!userWantsProductEmails(userData)) return;
  const email = resolveUserEmail(userData);
  if (!email) return;

  const cardsSnap = await db
    .collection('business-cards')
    .where('userId', '==', event.userId)
    .where('eventId', '==', eventDoc.id)
    .limit(80)
    .get();

  const cardCount = cardsSnap.size;
  let pendingDraftCount = 0;
  let cardsWithoutDraft = 0;

  if (cardCount > 0) {
    const cardIds = cardsSnap.docs.map((d) => d.id);
    const pending = [];

    for (let i = 0; i < cardIds.length; i += 10) {
      const slice = cardIds.slice(i, i + 10);
      const draftsSnap = await db
        .collection('email-drafts')
        .where('userId', '==', event.userId)
        .where('status', '==', 'draft')
        .where('cardId', 'in', slice)
        .limit(50)
        .get();
      draftsSnap.forEach((d) => pending.push(d.data()));
    }

    pendingDraftCount = pending.length;
    const draftedCardIds = new Set(pending.map((p) => p.cardId));
    cardsWithoutDraft = cardsSnap.docs.filter((c) => !draftedCardIds.has(c.id)).length;
  }

  const firstName = (userData.displayName || '').split(' ')[0] || 'there';
  const eventName = event.name || 'your event';
  const ctaUrl = `${APP_URL}/home?event=${encodeURIComponent(eventDoc.id)}`;

  const bodyBits = [];
  bodyBits.push(
    `<p style="color:#374151;font-size:15px;line-height:1.55;margin:0 0 12px;">Before the stack of cards and phone screenshots fades into the camera roll, dump them into Billo while you still remember who was who.</p>`
  );
  bodyBits.push(
    `<ul style="padding-left:18px;margin:0 0 12px;color:#111827;font-size:15px;line-height:1.5;">
      <li style="margin:0 0 6px;">Photo of a business card</li>
      <li style="margin:0 0 6px;">Screenshot of a contact, LinkedIn, or phone number</li>
      <li style="margin:0 0 6px;">Tag them to <strong>${escapeHtml(eventName)}</strong>, then send the follow-up</li>
    </ul>`
  );

  if (cardCount === 0) {
    bodyBits.push(
      `<p style="color:#64748b;font-size:14px;line-height:1.5;margin:0;">You haven’t added anyone from this event yet — even one screenshot beats losing the lead.</p>`
    );
  } else {
    const openFollowUps = pendingDraftCount + cardsWithoutDraft;
    bodyBits.push(
      `<p style="color:#64748b;font-size:14px;line-height:1.5;margin:0;">You’ve already saved ${cardCount} contact${cardCount === 1 ? '' : 's'} from ${escapeHtml(eventName)}${openFollowUps > 0 ? ` — ${openFollowUps} still need a follow-up` : ''}.</p>`
    );
  }

  const { html, text } = emailShell({
    title: `Capture leftovers from ${eventName}`,
    intro: `Hi ${firstName} — ${eventName} wrapped yesterday. A quick dump of cards and contact screenshots keeps the hallway conversations from going cold.`,
    bodyHtml: bodyBits.join(''),
    ctaLabel: 'Add people from this event',
    ctaUrl,
    footerNote: 'One note per event. We won’t nag about this again.',
    unsubscribeUrl: buildUnsubscribeUrl(event.userId)
  });

  const result = await sendEmail({
    to: email,
    subject: `Add people from ${eventName} while it’s fresh`,
    html,
    text,
    listUnsubscribeUrl: buildUnsubscribeUrl(event.userId)
  });

  if (!result?.success) {
    summary.errors.push({ eventId: eventDoc.id, error: result?.error || 'send failed' });
    return;
  }

  summary.emailsSent += 1;
  await eventDoc.ref.update({
    wrapUpEmailSentAt: now,
    updatedAt: now
  });
}

export async function runEventWrapUps({ db, sendEmail, now = new Date() }) {
  const summary = { eventsChecked: 0, emailsSent: 0, errors: [] };
  const targetDay = yesterdayUtcKey(now);

  const byDate = await db.collection('events').where('date', '==', targetDay).limit(100).get();
  const recent = await db.collection('events').orderBy('createdAt', 'desc').limit(80).get();

  const seen = new Set();
  const candidates = [];

  for (const doc of [...byDate.docs, ...recent.docs]) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    if (eventDayKey(doc.data().date) !== targetDay) continue;
    candidates.push(doc);
  }

  summary.eventsChecked = candidates.length;

  for (const eventDoc of candidates) {
    try {
      await sendWrapUpForEvent({ db, sendEmail, eventDoc, now, summary });
    } catch (err) {
      summary.errors.push({ eventId: eventDoc.id, error: err.message });
    }
  }

  return summary;
}
