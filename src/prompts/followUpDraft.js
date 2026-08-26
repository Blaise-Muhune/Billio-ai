/**
 * Follow-up draft prompts — short, human, anti-salesy.
 * Signature is built in code; model only writes subject + body.
 * @version 2026-08-26.v2
 */

export const FOLLOW_UP_SYSTEM_PROMPT = `You write short follow-up emails after meeting someone in person (conference, meetup, sales call, hallway chat).

Voice: warm, specific, human — like a thoughtful person who met them yesterday. Slightly casual, never corporate LinkedIn-speak.

Hard rules:
- Subject: ≤50 characters, concrete, no ALL CAPS, no exclamation spam
- Body: one short paragraph, ≤90 words, easy to skim (may also be pasted into SMS)
- Do NOT invent shared history, compliments about their company, or details not in the context
- If conversation notes exist, weave ONE natural reference; if not, keep it general
- Soft CTA only (keep in touch / happy to reconnect asynchronously). Never “grab coffee” unless notes say they’re local and open to it
- Ban: “Hope this finds you well”, “Just circling back”, “I came across your profile”, “synergy”, “touch base”, “per our conversation” (unless notes justify it), “looking forward to connecting”

Return ONLY JSON: { "subject": "...", "body": "..." }
No signature in the JSON — the app adds it.`;

function clean(value) {
  return String(value || '').trim();
}

function line(label, value) {
  const v = clean(value);
  return v ? `${label}: ${v}` : null;
}

/**
 * @param {{
 *   sender: { displayName?: string, title?: string, company?: string, email?: string },
 *   recipient: { name?: string, company?: string, title?: string },
 *   eventContext: string,
 *   metNote?: string
 * }} ctx
 */
export function buildFollowUpUserPrompt(ctx) {
  const sender = ctx.sender || {};
  const recipient = ctx.recipient || {};
  const lines = [
    'Write a follow-up email from these facts only:',
    '',
    line('Sender name', sender.displayName || 'there'),
    line('Sender title', sender.title),
    line('Sender company', sender.company),
    line('Recipient name', recipient.name),
    line('Recipient title', recipient.title),
    line('Recipient company', recipient.company),
    line('Meeting context', ctx.eventContext),
    line('Conversation notes (from sender)', ctx.metNote),
    '',
    'Remember: subject ≤50 chars, body ≤90 words, one paragraph, soft CTA, no invented details.'
  ].filter((x) => x !== null);

  return lines.join('\n');
}

export function buildFollowUpSignature(sender = {}) {
  const name = clean(sender.displayName);
  const title = clean(sender.title);
  const company = clean(sender.company);
  const parts = [];
  if (name) parts.push(name);
  const roleBits = [title, company].filter(Boolean);
  if (roleBits.length) parts.push(roleBits.join(' · '));
  return parts.join('\n') || name || '';
}

const CLICHE_PATTERNS = [
  /\bhope this (email )?finds you well\b[:,!]?\s*/gi,
  /\bjust circling back\b[:,!]?\s*/gi,
  /\bi came across your profile\b[:,!]?\s*/gi,
  /\btouch base\b/gi,
  /\bsynerg(?:y|ies)\b/gi,
  /\blooking forward to connecting\b[:,!]?\s*/gi
];

function stripCliches(text) {
  let out = String(text || '');
  for (const re of CLICHE_PATTERNS) {
    out = out.replace(re, '');
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

function clampWords(text, maxWords) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}…`;
}

function clampChars(text, max) {
  const s = String(text || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

/**
 * Normalize model output + attach code-built signature.
 */
export function normalizeFollowUpDraft(emailData, sender) {
  let subject = stripCliches(clean(emailData?.subject));
  let body = stripCliches(clean(emailData?.body || emailData?.content));

  subject = clampChars(subject, 50);
  body = clampWords(body, 90);

  if (!subject || subject.length < 4 || /^[—\-–,:;.!?]/.test(subject)) {
    subject = 'Great meeting you';
  }

  const signature = buildFollowUpSignature(sender);

  return { subject, body, signature };
}
