export const MAX_URL_LENGTH = 2048;

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Returns the trimmed URL when it is an absolute http(s) URL within
 * MAX_URL_LENGTH, otherwise undefined. Rejects `javascript:`, `data:`,
 * `blob:`, `file:` and relative URLs.
 */
export function toSafeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    return undefined;
  }
  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? trimmed : undefined;
  } catch {
    return undefined;
  }
}
