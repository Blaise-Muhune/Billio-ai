/**
 * Free one-tap follow-up: open Gmail / Outlook / system mail with a prefilled message.
 * True silent send from their inbox later needs Gmail API / Microsoft Graph OAuth.
 */

/** Keep compose URLs under common browser limits (esp. mobile Safari). */
const MAX_COMPOSE_BODY_CHARS = 1800;

export function buildFollowUpMessage(draft, card, fallbackBody = '') {
  const to = card?.emails?.[0] || draft?.recipientEmail || '';
  const subject =
    draft?.subject ||
    `Great meeting you${card?.name ? `, ${card.name.split(' ')[0]}` : ''}`;
  const bodyParts = [
    draft?.body || draft?.content || fallbackBody || '',
    draft?.signature || ''
  ].filter(Boolean);
  let body = bodyParts.join('\n\n').trim();
  if (body.length > MAX_COMPOSE_BODY_CHARS) {
    body = `${body.slice(0, MAX_COMPOSE_BODY_CHARS - 1).trimEnd()}…`;
  }
  return { to, subject, body };
}

export function gmailComposeUrl({ to, subject, body }) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: to || '',
    su: subject || '',
    body: body || ''
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function outlookComposeUrl({ to, subject, body }) {
  const params = new URLSearchParams({
    to: to || '',
    subject: subject || '',
    body: body || ''
  });
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

export function mailtoComposeUrl({ to, subject, body }) {
  return `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(
    subject || ''
  )}&body=${encodeURIComponent(body || '')}`;
}

export function openFollowUpCompose(provider, message) {
  const urls = {
    gmail: gmailComposeUrl(message),
    outlook: outlookComposeUrl(message),
    mailto: mailtoComposeUrl(message)
  };
  const url = urls[provider] || urls.mailto;
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  return Boolean(win);
}
