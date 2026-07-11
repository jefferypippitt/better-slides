import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getDeck, getDeckForUser } from "@/lib/decks";
import { verifyPresenterToken } from "@/lib/presenter-token";
import { getSpeakerNotesForDeck } from "@/lib/speaker-notes";

export interface NotesPageData {
  notes: (string | null)[];
  syncEndpoint: string;
}

export async function getNotesPageData(
  deckId: string,
  presenterToken?: string
): Promise<NotesPageData | null> {
  const hasValidPresenterToken =
    typeof presenterToken === "string" &&
    verifyPresenterToken(presenterToken, deckId, "notes");

  if (hasValidPresenterToken) {
    const deck = await getDeck(deckId);
    if (!deck) {
      return null;
    }
    const syncEndpoint = `/api/notes-sync?deckId=${encodeURIComponent(deckId)}&pt=${encodeURIComponent(presenterToken)}`;
    return { notes: getSpeakerNotesForDeck(deck), syncEndpoint };
  }

  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
  if (!session) {
    return null;
  }

  const deck = await getDeckForUser(deckId, session.user.id);
  if (!deck) {
    return null;
  }

  return {
    notes: getSpeakerNotesForDeck(deck),
    syncEndpoint: `/api/notes-sync?deckId=${encodeURIComponent(deckId)}`,
  };
}
