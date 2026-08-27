/**
 * Server-side OpenAI calls for scan extract + follow-up drafts.
 * Never expose OPENAI_API_KEY to the browser.
 */
import OpenAI from 'openai';
import {
  PROMPT_VERSION,
  SCAN_EXTRACT_PROMPT,
  parseScanExtractResponse,
  FOLLOW_UP_SYSTEM_PROMPT,
  buildFollowUpUserPrompt,
  normalizeFollowUpDraft
} from '../prompts/index.js';

const OPENAI_CHAT_MODEL =
  (process.env.OPENAI_MODEL && String(process.env.OPENAI_MODEL).trim()) ||
  (process.env.OPENAI_CHAT_MODEL && String(process.env.OPENAI_CHAT_MODEL).trim()) ||
  (process.env.VITE_OPENAI_MODEL && String(process.env.VITE_OPENAI_MODEL).trim()) ||
  'gpt-4o';

let client;
function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    const err = new Error('OPENAI_API_KEY is not configured on the server');
    err.status = 503;
    throw err;
  }
  if (!client) {
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

export async function runScanExtract(imageDataUrl) {
  if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:')) {
    const err = new Error('imageDataUrl must be a data URL');
    err.status = 400;
    throw err;
  }
  // Soft size guard (~8MB data URL)
  if (imageDataUrl.length > 8_000_000) {
    const err = new Error('Image too large for scan');
    err.status = 413;
    throw err;
  }

  const response = await getClient().chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: SCAN_EXTRACT_PROMPT },
          { type: 'image_url', image_url: { url: imageDataUrl } }
        ]
      }
    ],
    max_tokens: 900,
    response_format: { type: 'json_object' }
  });

  const raw = response.choices?.[0]?.message?.content || '';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const err = new Error('Failed to read contact details from that image');
    err.status = 422;
    throw err;
  }

  const extracted = parseScanExtractResponse(parsed);
  return { extracted, promptVersion: PROMPT_VERSION, model: OPENAI_CHAT_MODEL };
}

export async function runFollowUpDraft({ sender, recipient, eventContext, metNote }) {
  const response = await getClient().chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [
      { role: 'system', content: FOLLOW_UP_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildFollowUpUserPrompt({
          sender,
          recipient,
          eventContext,
          metNote: metNote || ''
        })
      }
    ],
    max_tokens: 400,
    response_format: { type: 'json_object' }
  });

  const raw = response.choices?.[0]?.message?.content || '{}';
  let emailData;
  try {
    emailData = JSON.parse(raw);
  } catch {
    const err = new Error('Failed to generate follow-up draft');
    err.status = 422;
    throw err;
  }

  const normalized = normalizeFollowUpDraft(emailData, sender || {});
  return { draft: normalized, promptVersion: PROMPT_VERSION, model: OPENAI_CHAT_MODEL };
}
