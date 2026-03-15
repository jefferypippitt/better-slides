import { notFound } from "next/navigation";
import { SlideChrome } from "@/components/present/slide-chrome";
import { SlideDeck } from "@/components/slides/slide-deck";
import { getSpeakerNotesForDeck } from "@/lib/speaker-notes";
import { getPresentDeckSummary } from "@/server/present";

export const dynamic = "force-dynamic";

interface Props {
  children: React.ReactNode;
  params: Promise<{ deckId: string }>;
}

export default async function PresentLayout({ children, params }: Props) {
  const { deckId } = await params;
  const summary = await getPresentDeckSummary(deckId);
  if (!summary) {
    notFound();
  }
  const { deck, slideCount } = summary;

  const speakerNotes = getSpeakerNotesForDeck(deck);
  const syncEndpoint = `/api/notes-sync?deckId=${encodeURIComponent(deckId)}`;

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
      <SlideChrome syncEndpoint={syncEndpoint} total={slideCount} />
    </>
  );
}
