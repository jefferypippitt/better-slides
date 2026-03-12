import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_SEPARATOR = ".";
const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

interface PresenterTokenPayload {
  deckId: string;
  exp: number;
}

function getSigningSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing BETTER_AUTH_SECRET");
  }
  return secret;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(payloadEncoded: string): string {
  return createHmac("sha256", getSigningSecret())
    .update(payloadEncoded)
    .digest("base64url");
}

export function createPresenterToken(deckId: string, ttlMs = DEFAULT_TTL_MS): string {
  const payload: PresenterTokenPayload = {
    deckId,
    exp: Date.now() + ttlMs,
  };
  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadEncoded);
  return `${payloadEncoded}${TOKEN_SEPARATOR}${signature}`;
}

export function verifyPresenterToken(token: string, deckId: string): boolean {
  const [payloadEncoded, providedSignature] = token.split(TOKEN_SEPARATOR);
  if (!payloadEncoded || !providedSignature) {
    return false;
  }

  const expectedSignature = signPayload(payloadEncoded);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return false;
  }

  let payload: PresenterTokenPayload;
  try {
    payload = JSON.parse(fromBase64Url(payloadEncoded)) as PresenterTokenPayload;
  } catch {
    return false;
  }

  if (payload.deckId !== deckId) {
    return false;
  }
  if (typeof payload.exp !== "number" || payload.exp <= Date.now()) {
    return false;
  }
  return true;
}
