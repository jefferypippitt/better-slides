import { describe, expect, it } from "vitest";
import { createPresenterToken, verifyPresenterToken } from "@/lib/presenter-token";

const DECK_ID = "deck-123";
const OTHER_DECK_ID = "deck-456";

describe("presenter token", () => {
  it("verifies a notes-scoped token against a notes requirement", () => {
    const token = createPresenterToken(DECK_ID, "notes");
    expect(verifyPresenterToken(token, DECK_ID, "notes")).toBe(true);
  });

  it("rejects a notes-scoped token against a control requirement", () => {
    const token = createPresenterToken(DECK_ID, "notes");
    expect(verifyPresenterToken(token, DECK_ID, "control")).toBe(false);
  });

  it("allows a control-scoped token to satisfy a notes requirement", () => {
    const token = createPresenterToken(DECK_ID, "control");
    expect(verifyPresenterToken(token, DECK_ID, "notes")).toBe(true);
  });

  it("verifies a control-scoped token against a control requirement", () => {
    const token = createPresenterToken(DECK_ID, "control");
    expect(verifyPresenterToken(token, DECK_ID, "control")).toBe(true);
  });

  it("rejects a token verified against a different deckId", () => {
    const token = createPresenterToken(DECK_ID, "notes");
    expect(verifyPresenterToken(token, OTHER_DECK_ID, "notes")).toBe(false);
  });

  it("rejects an expired token", () => {
    const token = createPresenterToken(DECK_ID, "notes", -1);
    expect(verifyPresenterToken(token, DECK_ID, "notes")).toBe(false);
  });

  it("rejects a malformed token without throwing", () => {
    expect(() => verifyPresenterToken("not-a-real-token", DECK_ID, "notes")).not.toThrow();
    expect(verifyPresenterToken("not-a-real-token", DECK_ID, "notes")).toBe(false);
  });

  it("rejects an empty token string without throwing", () => {
    expect(() => verifyPresenterToken("", DECK_ID, "notes")).not.toThrow();
    expect(verifyPresenterToken("", DECK_ID, "notes")).toBe(false);
  });

  it("rejects a token with a tampered signature", () => {
    const token = createPresenterToken(DECK_ID, "notes");
    const [payloadEncoded, signature] = token.split(".");
    const tamperedSignature =
      signature.slice(0, -1) + (signature.at(-1) === "a" ? "b" : "a");
    const tamperedToken = `${payloadEncoded}.${tamperedSignature}`;
    expect(verifyPresenterToken(tamperedToken, DECK_ID, "notes")).toBe(false);
  });
});
