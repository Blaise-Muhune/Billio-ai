/**
 * Versioned LLM prompts for BilloAI.
 * Bump PROMPT_VERSION when changing scan or follow-up behavior (for logs / A-B later).
 */
export const PROMPT_VERSION = '2026-08-26.v2';

export { SCAN_EXTRACT_PROMPT, parseScanExtractResponse } from './scanExtract.js';
export {
  FOLLOW_UP_SYSTEM_PROMPT,
  buildFollowUpUserPrompt,
  buildFollowUpSignature,
  normalizeFollowUpDraft
} from './followUpDraft.js';
