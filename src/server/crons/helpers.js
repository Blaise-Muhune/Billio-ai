/**
 * Shared helpers for Vercel cron jobs (system → user mail only).
 */
import crypto from 'crypto';

export const APP_URL = (process.env.APP_URL || 'https://www.billoai.com').replace(/\/$/, '');
export const DAY_MS = 24 * 60 * 60 * 1000;

function unsubscribeSecret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';
}

export function makeUnsubscribeToken(uid) {
  const secret = unsubscribeSecret();
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update(`unsub:${uid}`).digest('hex').slice(0, 32);
}

export function buildUnsubscribeUrl(uid) {
  const token = makeUnsubscribeToken(uid);
  if (!token) return `${APP_URL}/profile-setup#email-prefs`;
  return `${APP_URL}/api/email/unsubscribe?u=${encodeURIComponent(uid)}&t=${encodeURIComponent(token)}`;
}

export function assertCronAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    const err = new Error('CRON_SECRET is not configured');
    err.status = 503;
    throw err;
  }
  const header = req.headers.authorization || '';
  if (header !== `Bearer ${secret}`) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  if (typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function daysBetween(a, b) {
  return Math.floor((startOfUtcDay(b) - startOfUtcDay(a)) / DAY_MS);
}

export function isWeekendUtc(date = new Date()) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function userWantsProductEmails(userData = {}) {
  if (userData.emailUnsubscribed === true) return false;
  if (userData.productEmailsOptOut === true) return false;
  if (userData.emailSubscribed === false) return false;
  return true;
}

export function resolveUserEmail(userData = {}) {
  return userData.subscriptionEmail || userData.email || null;
}

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function emailShell({ title, intro, bodyHtml, ctaLabel, ctaUrl, footerNote, unsubscribeUrl }) {
  const safeTitle = escapeHtml(title);
  const safeIntro = intro ? `<p style="color:#374151;font-size:16px;line-height:1.5;margin:0 0 16px;">${escapeHtml(intro)}</p>` : '';
  const cta = ctaLabel && ctaUrl
    ? `<p style="margin:28px 0 8px;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">${escapeHtml(ctaLabel)}</a></p>`
    : '';
  const footer = footerNote
    ? `<p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">${escapeHtml(footerNote)}</p>`
    : '';
  const unsub = unsubscribeUrl
    ? `<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b7280;">Unsubscribe from product emails</a></p>`
    : '';

  const html = `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;">
      <p style="margin:0 0 20px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#0f766e;">BilloAI</p>
      <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px;color:#111827;">${safeTitle}</h1>
      ${safeIntro}
      ${bodyHtml || ''}
      ${cta}
      ${footer}
      ${unsub}
      <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} BilloAI</p>
    </div>
  `;

  const textParts = [
    'BilloAI',
    title,
    intro || '',
    ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : '',
    footerNote || '',
    unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : ''
  ].filter(Boolean);

  return { html, text: textParts.join('\n\n') };
}

export async function chunkedQuery(query, pageSize = 200, onPage) {
  let lastDoc = null;
  let total = 0;
  for (;;) {
    let q = query.limit(pageSize);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;
    await onPage(snap.docs);
    total += snap.size;
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < pageSize) break;
  }
  return total;
}
