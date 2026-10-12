import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSession, mockGetDeck, mockUpdateDeck, mockDeleteDeck } =
  vi.hoisted(() => ({
    mockGetSession: vi.fn(),
    mockGetDeck: vi.fn(),
    mockUpdateDeck: vi.fn(),
    mockDeleteDeck: vi.fn(),
  }));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/lib/decks", () => ({
  getDeck: mockGetDeck,
  updateDeck: mockUpdateDeck,
  deleteDeck: mockDeleteDeck,
}));

import {
  MAX_BOXES_PER_SLIDE,
  MAX_SLIDES_PER_DECK,
  STATIC_TEXT_MAX_LENGTH,
} from "@/lib/deck-limits";
import type { SlideLayout } from "@/lib/decks";
import { deleteDeckAction, updateDeckAction } from "@/server/actions/decks";

const OWNER_ID = "user-owner";
const OTHER_USER_ID = "user-other";
const DECK_ID = "deck-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateDeckAction", () => {
  it("throws when there is no session", async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(
      updateDeckAction(DECK_ID, { title: "New title" })
    ).rejects.toThrow("Unauthorized");
    expect(mockUpdateDeck).not.toHaveBeenCalled();
  });

  it("throws and does not call updateDeck when the deck belongs to another user", async () => {
    mockGetSession.mockResolvedValue({ user: { id: OTHER_USER_ID } });
    mockGetDeck.mockResolvedValue({ id: DECK_ID, userId: OWNER_ID });
    await expect(
      updateDeckAction(DECK_ID, { title: "New title" })
    ).rejects.toThrow("Not found");
    expect(mockUpdateDeck).not.toHaveBeenCalled();
  });

  it("calls updateDeck with the session's own userId for the owner's own deck", async () => {
    mockGetSession.mockResolvedValue({ user: { id: OWNER_ID } });
    mockGetDeck.mockResolvedValue({ id: DECK_ID, userId: OWNER_ID });
    mockUpdateDeck.mockResolvedValue({
      id: DECK_ID,
      userId: OWNER_ID,
      title: "New title",
    });
    await updateDeckAction(DECK_ID, { title: "New title" });
    expect(mockUpdateDeck).toHaveBeenCalledWith(DECK_ID, OWNER_ID, {
      title: "New title",
    });
  });
});

describe("updateDeckAction slide limits", () => {
  const box = { id: "box", x: 0, y: 0, w: 10, h: 10 };
  const slideWith = (canvasLayout: SlideLayout["canvasLayout"]) => ({
    id: "slide",
    canvasLayout,
  });

  beforeEach(() => {
    mockGetSession.mockResolvedValue({ user: { id: OWNER_ID } });
    mockGetDeck.mockResolvedValue({ id: DECK_ID, userId: OWNER_ID });
  });

  it("rejects more slides than the per-deck limit", async () => {
    const slides = Array.from({ length: MAX_SLIDES_PER_DECK + 1 }, () =>
      slideWith([])
    );
    await expect(updateDeckAction(DECK_ID, { slides })).rejects.toThrow(
      "slides"
    );
    expect(mockUpdateDeck).not.toHaveBeenCalled();
  });

  it("rejects more elements than the per-slide limit", async () => {
    const boxes = Array.from({ length: MAX_BOXES_PER_SLIDE + 1 }, () => box);
    await expect(
      updateDeckAction(DECK_ID, { slides: [slideWith(boxes)] })
    ).rejects.toThrow("elements");
    expect(mockUpdateDeck).not.toHaveBeenCalled();
  });

  it("rejects text boxes over the length limit", async () => {
    const longText = {
      ...box,
      kind: "text" as const,
      staticText: "a".repeat(STATIC_TEXT_MAX_LENGTH + 1),
    };
    await expect(
      updateDeckAction(DECK_ID, { slides: [slideWith([longText])] })
    ).rejects.toThrow("Text boxes");
    expect(mockUpdateDeck).not.toHaveBeenCalled();
  });
});

describe("deleteDeckAction", () => {
  it("throws and does not call deleteDeck when the deck belongs to another user", async () => {
    mockGetSession.mockResolvedValue({ user: { id: OTHER_USER_ID } });
    mockGetDeck.mockResolvedValue({ id: DECK_ID, userId: OWNER_ID });
    await expect(deleteDeckAction(DECK_ID)).rejects.toThrow("Not found");
    expect(mockDeleteDeck).not.toHaveBeenCalled();
  });

  it("calls deleteDeck with the session's own userId for the owner's own deck", async () => {
    mockGetSession.mockResolvedValue({ user: { id: OWNER_ID } });
    mockGetDeck.mockResolvedValue({ id: DECK_ID, userId: OWNER_ID });
    await deleteDeckAction(DECK_ID);
    expect(mockDeleteDeck).toHaveBeenCalledWith(DECK_ID, OWNER_ID);
  });
});
