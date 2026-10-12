import { describe, expect, it } from "vitest";

import { normalizeCanvasLayout } from "@/lib/decks";

const BASE_BOX = { id: "box-1", x: 10, y: 10, w: 40, h: 30 };

function normalizeOne(fields: Record<string, unknown>) {
  return normalizeCanvasLayout([{ ...BASE_BOX, ...fields }])[0];
}

describe("normalizeCanvasLayout shape colors", () => {
  it("keeps a hex shape color", () => {
    expect(
      normalizeOne({ kind: "shape", shapeColor: "#84cc16" })
    ).toMatchObject({ shapeColor: "#84cc16" });
  });

  it("drops a shape color that would inject extra CSS properties", () => {
    const box = normalizeOne({
      kind: "shape",
      shapeColor: "red;background-image:url(https://evil.example/x.png)",
    });
    expect(box?.shapeColor).toBeUndefined();
  });

  it("drops a non-hex text color", () => {
    const box = normalizeOne({ kind: "text", textColor: "red;position:fixed" });
    expect(box?.textColor).toBeUndefined();
  });
});

describe("normalizeCanvasLayout URLs", () => {
  it("keeps an https image URL", () => {
    const url = "https://example.com/cat.png";
    expect(normalizeOne({ kind: "image", imageUrl: url })?.imageUrl).toBe(url);
  });

  it.each([
    "javascript:alert(1)",
    "data:image/svg+xml,<svg onload=alert(1)>",
    "blob:https://example.com/123",
    "file:///etc/passwd",
    "/relative/path.png",
    `https://example.com/${"a".repeat(3000)}`,
  ])("drops unsafe image URL %s", (imageUrl) => {
    expect(normalizeOne({ kind: "image", imageUrl })?.imageUrl).toBeUndefined();
  });

  it("drops unsafe YouTube, X and QR URLs", () => {
    const box = normalizeOne({
      kind: "youtube",
      youtubeUrl: "javascript:alert(1)",
      twitterUrl: "data:text/html,hi",
      customQrUrl: "ftp://example.com",
    });
    expect(box?.youtubeUrl).toBeUndefined();
    expect(box?.twitterUrl).toBeUndefined();
    expect(box?.customQrUrl).toBeUndefined();
  });

  it("keeps an https X post URL", () => {
    const url = "https://x.com/user/status/1234567890";
    expect(normalizeOne({ kind: "twitter", twitterUrl: url })?.twitterUrl).toBe(
      url
    );
  });
});

describe("normalizeCanvasLayout geometry", () => {
  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])("drops a box whose position is %s", (x) => {
    expect(normalizeCanvasLayout([{ ...BASE_BOX, kind: "image", x }])).toEqual(
      []
    );
  });
});
