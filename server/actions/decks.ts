"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  MAX_BOXES_PER_SLIDE,
  MAX_SLIDES_PER_DECK,
  STATIC_TEXT_MAX_LENGTH,
} from "@/lib/deck-limits";
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
const TITLE_MAX_LENGTH = 80;
const NOTES_MAX_LENGTH = 1500;
const MDX_MAX_LENGTH = 500_000;

function validateDeckInput(data: {
  title?: string;
  mdx?: string;
  slides?: SlideLayout[];
}) {
  if (data.title !== undefined && data.title.length > TITLE_MAX_LENGTH) {
    throw new Error(`Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
  }
  if (data.mdx !== undefined && data.mdx.length > MDX_MAX_LENGTH) {
    throw new Error("Deck content is too large.");
  }
  if (data.slides) {
    validateSlides(data.slides);
  }
}

function validateSlides(slides: SlideLayout[]) {
  if (slides.length > MAX_SLIDES_PER_DECK) {
    throw new Error(`A deck can have at most ${MAX_SLIDES_PER_DECK} slides.`);
  }
  for (const slide of slides) {
    if (
      slide.speakerNotes !== undefined &&
      slide.speakerNotes.length > NOTES_MAX_LENGTH
    ) {
      throw new Error(
        `Speaker notes must be ${NOTES_MAX_LENGTH} characters or fewer.`
      );
    }
    const boxes = Array.isArray(slide.canvasLayout) ? slide.canvasLayout : [];
    if (boxes.length > MAX_BOXES_PER_SLIDE) {
      throw new Error(
        `A slide can have at most ${MAX_BOXES_PER_SLIDE} elements.`
      );
    }
    for (const box of boxes) {
      if (
        typeof box.staticText === "string" &&
        box.staticText.length > STATIC_TEXT_MAX_LENGTH
      ) {
        throw new Error(
          `Text boxes must be ${STATIC_TEXT_MAX_LENGTH} characters or fewer.`
        );
      }
    }
  }
}

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
  validateDeckInput({
    title: data?.title,
    mdx: data?.mdx,
    slides: data?.slides,
  });
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
  validateDeckInput({
    title: updates.title,
    mdx: updates.mdx,
    slides: updates.slides,
  });
  const updated = await updateDeck(deckId, session.user.id, updates);
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
