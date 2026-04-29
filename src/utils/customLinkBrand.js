/**
 * Map custom link URL / label to a bundled icon under public/icons/brands/.
 * Avoids fragile hotlinked CDN logos (Cash App, Venmo, etc.).
 */
const BRAND_RULES = [
  [/cash\.app|cash\.me/i, 'cashapp'],
  [/venmo\.com/i, 'venmo'],
  [/paypal\.(com|me)/i, 'paypal'],
  [/zellepay\.com|\.zelle\b/i, 'zelle'],
  [/stripe\.com/i, 'stripe'],
  [/buymeacoffee\.com/i, 'buymeacoffee'],
  [/ko-fi\.com|kofi\.com/i, 'kofi'],
  [/linktr\.ee|linktree\.com/i, 'linktree'],
  [/calendly\.com/i, 'calendly'],
  [/pay\.google|payments\.google/i, 'googlepay'],
  [/apple\.com\/.*apple-?pay/i, 'applepay'],
]

const NAME_HINTS = [
  [/\bcash\s*app\b|\bcashapp\b/i, 'cashapp'],
  [/\bvenmo\b/i, 'venmo'],
  [/\bpaypal\b/i, 'paypal'],
  [/\bzelle\b/i, 'zelle'],
  [/\bstripe\b/i, 'stripe'],
  [/\bko-?fi\b|\bkofi\b/i, 'kofi'],
  [/\bbuy\s*me\s*a\s*coffee\b|\bbmac\b/i, 'buymeacoffee'],
  [/\blinktree\b|\blink\s*tree\b/i, 'linktree'],
  [/\bcalendly\b/i, 'calendly'],
  [/\bgoogle\s*pay\b/i, 'googlepay'],
  [/\bapple\s*pay\b/i, 'applepay'],
]

export function getCustomLinkBrandSlug(link) {
  const url = String(link?.url || '').trim()
  const name = String(link?.name || '').trim()
  const blob = `${url} ${name}`

  for (const [re, slug] of BRAND_RULES) {
    if (re.test(blob)) return slug
  }
  for (const [re, slug] of NAME_HINTS) {
    if (re.test(name)) return slug
  }
  return null
}

export function brandIconPublicPath(slug) {
  if (!slug) return null
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return `${normalized}icons/brands/${slug}.svg`
}
