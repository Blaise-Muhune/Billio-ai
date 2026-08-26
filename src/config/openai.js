/**
 * Chat Completions model for vision (card scan) and text (email drafts).
 * Server uses OPENAI_MODEL / OPENAI_API_KEY. This client constant is display/docs only.
 * Override with VITE_OPENAI_MODEL if needed for UI copy.
 */
export const OPENAI_CHAT_MODEL =
  (import.meta.env.VITE_OPENAI_MODEL && String(import.meta.env.VITE_OPENAI_MODEL).trim()) ||
  'gpt-5.5'
