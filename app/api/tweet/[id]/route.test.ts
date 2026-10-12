import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetServerUserId, mockGetTweet } = vi.hoisted(() => ({
  mockGetServerUserId: vi.fn(),
  mockGetTweet: vi.fn(),
}));

vi.mock("@/server/session", () => ({
  getServerUserId: mockGetServerUserId,
}));

vi.mock("react-tweet/api", () => ({
  getTweet: mockGetTweet,
}));

import { GET } from "@/app/api/tweet/[id]/route";

function callWithId(id: string) {
  return GET(new Request(`http://localhost/api/tweet/${id}`), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetServerUserId.mockResolvedValue("user-1");
});

describe("GET /api/tweet/[id]", () => {
  it("returns 401 without a session", async () => {
    mockGetServerUserId.mockResolvedValue(null);
    const response = await callWithId("123");
    expect(response.status).toBe(401);
    expect(mockGetTweet).not.toHaveBeenCalled();
  });

  it.each([
    "abc",
    "123abc",
    "1".repeat(26),
  ])("rejects non-numeric id %s", async (id) => {
    const response = await callWithId(id);
    expect(response.status).toBe(400);
    expect(mockGetTweet).not.toHaveBeenCalled();
  });

  it("returns the tweet data", async () => {
    mockGetTweet.mockResolvedValue({ id_str: "123" });
    const response = await callWithId("123");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id_str: "123" } });
  });

  it("returns 404 when the tweet does not exist", async () => {
    mockGetTweet.mockResolvedValue(undefined);
    const response = await callWithId("123");
    expect(response.status).toBe(404);
  });

  it("returns 502 when fetching from X fails", async () => {
    mockGetTweet.mockRejectedValue(new Error("network"));
    const response = await callWithId("123");
    expect(response.status).toBe(502);
  });
});
