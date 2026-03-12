"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  type Deck,
  type DeckWidget,
  deleteDeck,
  getDeck,
  listUserDecks,
  type SlideLayout,
  saveDeck,
  updateDeck,
  upsertDeckWidget,
} from "@/lib/decks";
import { DEFAULT_DECK_MDX, DEFAULT_DECK_TITLE } from "@/lib/default-deck";
import {
  compileWidgetTsx,
  extractDefaultWidgetComponentName,
  toPascalCase,
} from "@/lib/widget-compiler";

const TSX_EXT_RE = /\.tsx?$/i;

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function listDecksAction(): Promise<Deck[]> {
  const session = await requireSession();
  return listUserDecks(session.user.id);
}

export async function createDeckAction(data?: {
  title?: string;
  mdx?: string;
  slides?: SlideLayout[];
}): Promise<Deck> {
  const session = await requireSession();
  return saveDeck({
    userId: session.user.id,
    title: data?.title ?? DEFAULT_DECK_TITLE,
    mdx: data?.mdx ?? DEFAULT_DECK_MDX,
    slides: data?.slides ?? [],
  });
}

export async function updateDeckAction(
  deckId: string,
  updates: { title?: string; mdx?: string; slides?: SlideLayout[] }
): Promise<Deck> {
  const session = await requireSession();
  const existing = await getDeck(deckId);
  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Not found");
  }
  const updated = await updateDeck(deckId, updates);
  if (!updated) {
    throw new Error("Update failed");
  }
  return updated;
}

export async function deleteDeckAction(deckId: string): Promise<void> {
  const session = await requireSession();
  const existing = await getDeck(deckId);
  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Not found");
  }
  await deleteDeck(deckId, session.user.id);
}

export async function uploadDeckWidgetAction(input: {
  deckId: string;
  fileName: string;
  sourceTsx: string;
}): Promise<DeckWidget> {
  const session = await requireSession();
  const existing = await getDeck(input.deckId);
  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Not found");
  }
  const sourceComponentName = extractDefaultWidgetComponentName(
    input.sourceTsx
  );
  const fileComponentName = toPascalCase(
    input.fileName.replace(TSX_EXT_RE, "").trim()
  );
  const componentName = sourceComponentName || fileComponentName;
  if (!componentName) {
    throw new Error("Invalid widget file name");
  }
  const compiledJs = compileWidgetTsx(input.sourceTsx);
  return upsertDeckWidget({
    componentName,
    compiledJs,
    deckId: input.deckId,
    sourceTsx: input.sourceTsx,
    userId: session.user.id,
  });
}
