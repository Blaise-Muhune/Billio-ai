/** Contact capture source for analytics / product insights. */
export const SCAN_SOURCES = Object.freeze({
  CARD: 'card',
  SCREENSHOT: 'screenshot',
  MANUAL: 'manual'
});

const SCREENSHOT_NAME_RE =
  /screenshot|screen[\s_-]?shot|screen[\s_-]?capture|capture[_-]?\d|snipping|snip\b/i;

/**
 * Best-effort guess from file name + dimensions.
 * Prefer an explicit override from the UI when available.
 */
export function inferScanSource(file, { width, height } = {}) {
  if (!file) return SCAN_SOURCES.CARD;

  const name = String(file.name || file.fileName || '');
  if (SCREENSHOT_NAME_RE.test(name)) return SCAN_SOURCES.SCREENSHOT;

  const w = Number(width) || 0;
  const h = Number(height) || 0;
  if (w > 0 && h > 0) {
    const portrait = h > w;
    const tallPhone = portrait && h / w >= 1.6;
    // Phone screenshots are usually tall; cards are usually landscape-ish
    if (tallPhone) return SCAN_SOURCES.SCREENSHOT;
    if (!portrait && w / h >= 1.3) return SCAN_SOURCES.CARD;
  }

  return SCAN_SOURCES.CARD;
}

export function normalizeScanSource(value) {
  const v = String(value || '').toLowerCase().trim();
  if (v === SCAN_SOURCES.SCREENSHOT) return SCAN_SOURCES.SCREENSHOT;
  if (v === SCAN_SOURCES.MANUAL || v === 'vcf' || v === 'import') return SCAN_SOURCES.MANUAL;
  if (v === SCAN_SOURCES.CARD) return SCAN_SOURCES.CARD;
  return SCAN_SOURCES.CARD;
}

export async function readImageDimensions(file) {
  if (!file || typeof createImageBitmap !== 'function') {
    return { width: 0, height: 0 };
  }
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return dims;
  } catch {
    return { width: 0, height: 0 };
  }
}
