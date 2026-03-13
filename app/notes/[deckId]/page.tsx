import { notFound } from "next/navigation";

import { NotesView } from "@/components/notes/notes-view";
import { getNotesAction } from "@/server/actions/notes";

interface Props {
  params: Promise<{ deckId: string }>;
  searchParams: Promise<{ mode?: "phone" | "window"; pt?: string }>;
}

export default async function DeckNotesPage({ params, searchParams }: Props) {
  const { deckId } = await params;
  const { pt, mode } = await searchParams;
  const data = await getNotesAction(deckId, pt);
  if (!data) {
    notFound();
  }
  const syncMode =
    mode === "phone" || typeof pt === "string" ? "poll" : "broadcast";
  return (
    <NotesView
      notes={data.notes}
      syncEndpoint={data.syncEndpoint}
      syncMode={syncMode}
    />
  );
}
