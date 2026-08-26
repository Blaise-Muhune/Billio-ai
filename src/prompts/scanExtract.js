/**
 * Vision prompt: extract contact identity for follow-up — accuracy over style.
 * @version 2026-08-26.v2
 */
export const SCAN_EXTRACT_PROMPT = `You extract contact details from networking captures for BilloAI (follow-up after meeting someone in person).

ACCEPT as valid (treat equally):
- Physical business card photo (even angled, partial, glare, thumb in frame)
- Screenshot of a phone contact, Messages, WhatsApp, email header, LinkedIn, conference badge, Notes, or similar UI that shows who they are and how to reach them
- Name badge or handwritten contact details

REJECT only if there is clearly no person/contact identity (blank wall, food, meme, random scenery).

PRIORITY: accurate name + reachability (email/phone/LinkedIn). Do not invent emails, phones, or social URLs. Prefer empty string/array over guessing. If a field is blurry or cut off, leave it empty and note it in warnings.

Extract:
- name, company, emails[], phones[], title, websites[], address
- linkedin (full URL or vanity path if visible)
- socials[]: other profile URLs clearly shown (Twitter/X, Instagram, GitHub, etc.)

Style is secondary. Only provide simple preview colors if obvious; otherwise use safe defaults (#ffffff / #0f172a / #475569). Skip contrast-ratio essays.

Return ONLY JSON:
{
  "info": {
    "name": "",
    "company": "",
    "emails": [],
    "phones": [],
    "title": "",
    "websites": [],
    "address": "",
    "linkedin": "",
    "socials": []
  },
  "style": {
    "cardBackgroundColor": "#ffffff",
    "mainTextColor": "#0f172a",
    "secondaryTextColor": "#475569",
    "fontStyle": "modern",
    "layoutStyle": "minimal",
    "designNotes": ""
  },
  "detectedSource": "card" | "screenshot",
  "confidence": {
    "overall": 0.0,
    "name": 0.0,
    "email": 0.0,
    "phone": 0.0
  },
  "warnings": []
}

confidence values are 0–1. Put short human notes in warnings (e.g. "email partially obscured").
If invalid:
{ "error": true, "message": "Specific reason" }`;

const DEFAULT_STYLE = {
  backgroundColor: '#ffffff',
  primaryColor: '#0f172a',
  secondaryColor: '#475569',
  fontStyle: 'modern',
  layoutStyle: 'minimal',
  designNotes: ''
};

function asStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function clamp01(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return null;
  return Math.max(0, Math.min(1, x));
}

/**
 * Normalize model JSON into card fields + meta.
 */
export function parseScanExtractResponse(parsed) {
  if (!parsed || parsed.error) {
    throw new Error(parsed?.message || 'Could not find contact details in that image');
  }

  const info = parsed.info || {};
  const rawStyle = parsed.style || {};
  const style = {
    ...DEFAULT_STYLE,
    backgroundColor: rawStyle.cardBackgroundColor || rawStyle.backgroundColor || DEFAULT_STYLE.backgroundColor,
    primaryColor: rawStyle.mainTextColor || rawStyle.primaryColor || DEFAULT_STYLE.primaryColor,
    secondaryColor: rawStyle.secondaryTextColor || rawStyle.secondaryColor || DEFAULT_STYLE.secondaryColor,
    fontStyle: rawStyle.fontStyle || DEFAULT_STYLE.fontStyle,
    layoutStyle: rawStyle.layoutStyle || DEFAULT_STYLE.layoutStyle,
    designNotes: rawStyle.designNotes || ''
  };

  const confidenceRaw = parsed.confidence || {};
  const confidence = {
    overall: clamp01(confidenceRaw.overall),
    name: clamp01(confidenceRaw.name),
    email: clamp01(confidenceRaw.email),
    phone: clamp01(confidenceRaw.phone)
  };

  const websites = asStringArray(info.websites);
  const linkedin = String(info.linkedin || '').trim();
  if (linkedin && !websites.some((w) => /linkedin\.com/i.test(w))) {
    websites.push(linkedin.startsWith('http') ? linkedin : `https://www.linkedin.com/in/${linkedin.replace(/^\/+/, '')}`);
  }

  return {
    info: {
      name: String(info.name || '').trim(),
      company: String(info.company || '').trim(),
      emails: asStringArray(info.emails),
      phones: asStringArray(info.phones),
      title: String(info.title || '').trim(),
      websites,
      address: String(info.address || '').trim(),
      linkedin,
      socials: asStringArray(info.socials)
    },
    style,
    detectedSource: parsed.detectedSource || null,
    confidence,
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.map((w) => String(w || '').trim()).filter(Boolean)
      : []
  };
}
