/**
 * Chat Completions model for vision (card scan) and text (email drafts).
 * Default: OpenAI flagship (see https://platform.openai.com/docs/models).
 * Override in .env with VITE_OPENAI_MODEL if your org uses a different slug (e.g. gpt-5.4-mini for cost).
 */
export const OPENAI_CHAT_MODEL =
  (import.meta.env.VITE_OPENAI_MODEL && String(import.meta.env.VITE_OPENAI_MODEL).trim()) ||
  'gpt-5.5'
