"use server";

import { getNotesPageData } from "@/server/notes";

export type { NotesPageData } from "@/server/notes";

export async function getNotesAction(deckId: string, presenterToken?: string) {
  return await getNotesPageData(deckId, presenterToken);
}
