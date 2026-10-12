import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/qr/route";

function requestFor(url: string) {
  return new NextRequest(
    `http://localhost/api/qr?url=${encodeURIComponent(url)}`
  );
}

describe("GET /api/qr", () => {
  it("returns an SVG for an https URL", async () => {
    const response = await GET(requestFor("https://example.com"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("image/svg+xml");
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,hi",
    `https://example.com/${"a".repeat(3000)}`,
  ])("rejects %s with a 400", async (url) => {
    const response = await GET(requestFor(url));
    expect(response.status).toBe(400);
  });
});
