import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { RemoteReceiver } from "@/components/present/remote-receiver";
import { SlideChrome } from "@/components/present/slide-chrome";
import { SlideDeck } from "@/components/slides/slide-deck";
import { auth } from "@/lib/auth";
import { getDeckForUser } from "@/lib/decks";
import { parseMarkdownSections } from "@/lib/sections";
import { getSpeakerNotesForDeck } from "@/lib/speaker-notes";

export const dynamic = "force-dynamic";

interface Props {
  children: React.ReactNode;
  params: Promise<{ deckId: string }>;
}

export default async function PresentLayout({ children, params }: Props) {
  const { deckId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    notFound();
  }
  const deck = await getDeckForUser(deckId, session.user.id);
  if (!deck) {
    notFound();
  }

  const slideCount =
    deck.slides.length > 0
      ? deck.slides.length
      : parseMarkdownSections(deck.mdx).length;
  const speakerNotes = getSpeakerNotesForDeck(deck);
  const syncEndpoint = `/api/nxs-sync?deckId=${encodeURIComponent(deckId)}`;

  // Placeholder array for slide count (used for keyboard nav bounds)
  const slides: React.ReactNode[] = Array.from(
    { length: slideCount },
    (_, i) => <span aria-hidden="true" key={`slide-placeholder-${String(i)}`} />
  );

  return (
    <>
      <SlideDeck
        basePath={`/present/${deckId}`}
        slides={slides}
        speakerNotes={speakerNotes}
        syncEndpoint={syncEndpoint}
      >
        {children}
      </SlideDeck>
      <SlideChrome exitUrl="/write" total={slideCount} />
      <RemoteReceiver
        basePath={`/present/${deckId}`}
        syncEndpoint={syncEndpoint}
      />
    </>
  );
}
