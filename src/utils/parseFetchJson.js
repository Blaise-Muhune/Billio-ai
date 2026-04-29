/**
 * Parse JSON from a fetch Response without throwing on empty/HTML bodies
 * (common when the dev API is down and Vite returns 502 with an empty body).
 */
export async function parseJsonResponse(response) {
  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) {
    const proxyHint =
      response.status === 502 || response.status === 504 || response.status === 0
        ? ' Start the API on port 3000 (e.g. npm run start) so Vite can proxy /api.'
        : '';
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}). Empty response.${proxyHint}`);
    }
    throw new Error(`Empty response from server.${proxyHint}`);
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const preview = trimmed.slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(
      !response.ok
        ? `Request failed (${response.status}). Expected JSON: ${preview}`
        : `Invalid JSON from server: ${preview}`
    );
  }
}
