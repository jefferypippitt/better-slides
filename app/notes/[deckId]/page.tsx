import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { PhoneNotesView } from "@/components/notes/phone-notes-view";

import { auth } from "@/lib/auth";
import { getDeck, getDeckForUser } from "@/lib/decks";
import { verifyPresenterToken } from "@/lib/presenter-token";
import { getSpeakerNotesForDeck } from "@/lib/speaker-notes";

interface Props {
  params: Promise<{ deckId: string }>;
  searchParams: Promise<{ pt?: string }>;
}

export default async function DeckNotesPage({ params, searchParams }: Props) {
  const { deckId } = await params;
  const { pt } = await searchParams;

  // Presenter token path — no session required (QR code flow)
  const validToken = typeof pt === "string" && verifyPresenterToken(pt, deckId);
  if (validToken) {
    const deck = await getDeck(deckId);
    if (!deck) {
      notFound();
    }

    const notes = getSpeakerNotesForDeck(deck);
    const syncEndpoint = `/api/nxs-sync?deckId=${encodeURIComponent(deckId)}&pt=${encodeURIComponent(pt as string)}`;

    return <PhoneNotesView notes={notes} syncEndpoint={syncEndpoint} />;
  }

  // Session path — deck owner viewing notes from their own browser
  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    // Session check failed (e.g. cross-origin request) — fall through to notFound
  }

  if (!session) {
    notFound();
  }

  const deck = await getDeckForUser(deckId, session.user.id);
  if (!deck) {
    notFound();
  }

  const notes = getSpeakerNotesForDeck(deck);
  const syncEndpoint = `/api/nxs-sync?deckId=${encodeURIComponent(deckId)}`;

  return <PhoneNotesView notes={notes} syncEndpoint={syncEndpoint} />;
}
