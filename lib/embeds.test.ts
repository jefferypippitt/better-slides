import { describe, expect, it } from "vitest";

import { extractTweetId, toYoutubeEmbedUrl } from "@/lib/embeds";

describe("toYoutubeEmbedUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?t=42",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
  ])("builds an embed URL from %s", (url) => {
    expect(toYoutubeEmbedUrl(url)).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it.each([
    "https://www.youtube.com/watch?v=../../redirect",
    "https://www.youtube.com/watch?v=short",
    "https://example.com/",
  ])("rejects %s", (url) => {
    expect(toYoutubeEmbedUrl(url)).toBeNull();
  });
});

describe("extractTweetId", () => {
  it.each([
    "https://x.com/user/status/1234567890",
    "https://twitter.com/user/status/1234567890?s=20",
  ])("extracts the numeric status ID from %s", (url) => {
    expect(extractTweetId(url)).toBe("1234567890");
  });

  it("returns null when there is no status ID", () => {
    expect(extractTweetId("https://x.com/user")).toBeNull();
  });
});
