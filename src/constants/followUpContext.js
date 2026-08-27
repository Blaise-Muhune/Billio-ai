/**
 * Lightweight context for follow-up drafts.
 * meetingType = label only (no Firestore event).
 * Named / existing events use eventId as before.
 */

export const MEETING_TYPES = [
  {
    id: 'networking',
    label: 'Networking event',
    eventContext: 'Met at a networking event'
  },
  {
    id: 'conference',
    label: 'Conference / trade show',
    eventContext: 'Met at a conference or trade show'
  },
  {
    id: 'one_on_one',
    label: '1:1 meeting',
    eventContext: 'Met in a 1:1 meeting'
  },
  {
    id: 'intro',
    label: 'Intro / referral',
    eventContext: 'Met via an introduction or referral'
  },
  {
    id: 'other',
    label: 'Other',
    eventContext: 'Recent in-person meeting'
  }
];

export const FOLLOW_UP_INTENTS = [
  {
    id: 'stay_in_touch',
    label: 'Stay in touch',
    prompt: 'Goal: stay in touch and keep the door open',
    subjectHint:
      'Subject tone: warm reconnect (e.g. great meeting you / nice chatting), not a ask or pitch'
  },
  {
    id: 'share_useful',
    label: 'Share something useful',
    prompt: 'Goal: share something useful or relevant (soft, not salesy)',
    subjectHint:
      'Subject tone: helpful and specific (hint at the useful thing if notes allow), never clickbait'
  },
  {
    id: 'explore_work',
    label: 'Explore working together',
    prompt: 'Goal: gently explore whether working together could make sense',
    subjectHint:
      'Subject tone: soft collaboration nod without sounding salesy, pushy, or like a meeting request'
  },
  {
    id: 'thank_close',
    label: 'Thank them / close the loop',
    prompt: 'Goal: thank them and close the loop warmly',
    subjectHint:
      'Subject tone: grateful and conclusive (thanks / appreciated meeting you), not opening a new thread of asks'
  }
];

const CONTEXT_PREFS_KEY = 'billo_followup_context_prefs';

export function getMeetingType(id) {
  return MEETING_TYPES.find((t) => t.id === id) || null;
}

export function getMeetingTypeLabel(id) {
  return getMeetingType(id)?.label || '';
}

export function getMeetingTypeEventContext(id) {
  return getMeetingType(id)?.eventContext || '';
}

export function getFollowUpIntent(id) {
  return FOLLOW_UP_INTENTS.find((t) => t.id === id) || null;
}

export function getFollowUpIntentLabel(id) {
  return getFollowUpIntent(id)?.label || '';
}

export function getFollowUpIntentPrompt(id) {
  return getFollowUpIntent(id)?.prompt || '';
}

export function getFollowUpIntentSubjectHint(id) {
  return getFollowUpIntent(id)?.subjectHint || '';
}

/** Enough structured context to skip the pre-write sheet on rewrite. */
export function cardHasDraftContext(card) {
  const hasPlace = !!(card?.eventId || String(card?.meetingType || '').trim());
  const hasIntent = !!String(card?.followUpIntent || '').trim();
  return hasPlace && hasIntent;
}

export function loadFollowUpContextPrefs() {
  try {
    const raw = localStorage.getItem(CONTEXT_PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveFollowUpContextPrefs(prefs = {}) {
  try {
    const next = {
      eventId: prefs.eventId || '',
      meetingType: prefs.meetingType || '',
      followUpIntent: prefs.followUpIntent || ''
    };
    if (!next.eventId && !next.meetingType && !next.followUpIntent) return;
    localStorage.setItem(CONTEXT_PREFS_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}
