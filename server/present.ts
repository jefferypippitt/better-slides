import { getDeckForUser } from "@/lib/decks";

import { parseMarkdownSections } from "@/lib/sections";
import { getServerUserId } from "@/server/session";

export async function getAuthorizedDeckForPresent(deckId: string) {
  const userId = await getServerUserId();
  if (!userId) {
    return null;
  }
  return getDeckForUser(deckId, userId);
}

export async function getPresentDeckSummary(deckId: string) {
  const deck = await getAuthorizedDeckForPresent(deckId);
  if (!deck) {
    return null;
  }
  const slideCount =
    deck.slides.length > 0
      ? deck.slides.length
      : parseMarkdownSections(deck.mdx).length;
  return { deck, slideCount };
}
