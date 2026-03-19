import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "./db";
import { deck as deckTable, deckWidget as deckWidgetTable } from "./db/schema";

export interface CanvasBox {
	id: string;
	kind?: "section" | "separator" | "component" | "image" | "youtube" | "twitter" | "shape" | "text" | "page-number" | "timer" | "qr-code" | "url-qr";
	sectionId?: string;
	componentName?: string;
	imageUrl?: string;
	youtubeUrl?: string;
	twitterUrl?: string;
	shapeColor?: string;
	shapeType?: "rect" | "circle";
	staticText?: string;
	customQrUrl?: string;
	x: number;
	y: number;
	w: number;
	h: number;
	textStyle?: "title" | "subtitle" | "body";
}

export interface SlideLayout {
	id: string;
	canvasLayout: CanvasBox[];
	speakerNotes?: string;
}

export interface DeckWidget {
  compiledJs: string;
  componentName: string;
  deckId: string;
  id: string;
  sourceTsx: string;
  updatedAt: string;
}

function normalizeCanvasBox(item: unknown): CanvasBox | null {
	if (typeof item !== "object" || item === null) return null;
	const candidate = item as Partial<CanvasBox>;
	const kind =
		candidate.kind === "section" ||
		candidate.kind === "separator" ||
		candidate.kind === "component" ||
		candidate.kind === "image" ||
		candidate.kind === "youtube" ||
		candidate.kind === "twitter" ||
		candidate.kind === "shape" ||
		candidate.kind === "text" ||
		candidate.kind === "page-number" ||
		candidate.kind === "timer" ||
		candidate.kind === "qr-code" ||
		candidate.kind === "url-qr"
			? candidate.kind
			: undefined;
	const isDecorative =
		kind === "image" ||
		kind === "youtube" ||
		kind === "twitter" ||
		kind === "shape" ||
		kind === "text" ||
		kind === "page-number" ||
		kind === "timer" ||
		kind === "qr-code" ||
		kind === "url-qr";
	const isSectionLike = !isDecorative && kind !== "separator" && kind !== "component";
	const isComponentLike = kind === "component";
	if (
		typeof candidate.id !== "string" ||
		(isSectionLike && typeof candidate.sectionId !== "string") ||
		(isComponentLike && typeof candidate.componentName !== "string") ||
		typeof candidate.x !== "number" ||
		typeof candidate.y !== "number" ||
		typeof candidate.w !== "number" ||
		typeof candidate.h !== "number"
	) {
		return null;
	}
	if (
		candidate.textStyle !== undefined &&
		candidate.textStyle !== "title" &&
		candidate.textStyle !== "subtitle" &&
		candidate.textStyle !== "body"
	) {
		return null;
	}
	return {
		id: candidate.id,
		kind: candidate.kind ?? "section",
		sectionId: candidate.sectionId,
		componentName: candidate.componentName,
		imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl : undefined,
		youtubeUrl: typeof candidate.youtubeUrl === "string" ? candidate.youtubeUrl : undefined,
		twitterUrl: typeof candidate.twitterUrl === "string" ? candidate.twitterUrl : undefined,
		shapeColor: typeof candidate.shapeColor === "string" ? candidate.shapeColor : undefined,
		shapeType: candidate.shapeType === "circle" ? "circle" : candidate.shapeType === "rect" ? "rect" : undefined,
		staticText: typeof candidate.staticText === "string" ? candidate.staticText : undefined,
		customQrUrl: typeof candidate.customQrUrl === "string" ? candidate.customQrUrl : undefined,
		x: Math.max(0, Math.min(100, candidate.x)),
		y: Math.max(0, Math.min(100, candidate.y)),
		w: Math.max(10, Math.min(100, candidate.w)),
		h: Math.max(10, Math.min(100, candidate.h)),
		textStyle: candidate.textStyle ?? "body",
	};
}

function normalizeCanvasLayout(layout: unknown): CanvasBox[] {
	if (!Array.isArray(layout)) return [];
	return layout
		.map(normalizeCanvasBox)
		.filter((b): b is CanvasBox => b !== null);
}

function normalizeSlideLayout(item: unknown): SlideLayout | null {
	if (typeof item !== "object" || item === null) return null;
	const candidate = item as Record<string, unknown>;
	if (typeof candidate.id !== "string") return null;
	return {
		id: candidate.id,
		canvasLayout: normalizeCanvasLayout(candidate.canvasLayout),
		speakerNotes:
			typeof candidate.speakerNotes === "string" ? candidate.speakerNotes : "",
	};
}

/**
 * Parses the raw JSON stored in `canvas_layout` column into `SlideLayout[]`.
 * Handles two formats:
 *   - New:  SlideLayout[]  → [{ id, canvasLayout: CanvasBox[] }, ...]
 *   - Old:  CanvasBox[]    → migrated to [{ id: 'slide-1', canvasLayout: boxes }]
 */
function parseSlides(raw: unknown): SlideLayout[] {
	if (!Array.isArray(raw) || raw.length === 0) return [];

	const first = raw[0];
	// New format: first element has a `canvasLayout` array property
	if (
		typeof first === "object" &&
		first !== null &&
		"canvasLayout" in first &&
		Array.isArray((first as Record<string, unknown>).canvasLayout)
	) {
		return raw
			.map(normalizeSlideLayout)
			.filter((s): s is SlideLayout => s !== null);
	}

	// Old format: CanvasBox[] — migrate to single slide for backward compat
	const boxes = normalizeCanvasLayout(raw);
	if (boxes.length === 0) return [];
	return [{ id: "slide-1", canvasLayout: boxes, speakerNotes: "" }];
}

export interface Deck {
	id: string;
	userId: string;
	title: string;
	mdx: string;
  widgets: DeckWidget[];
	/** Each entry is one presentation slide with its own canvas layout. */
	slides: SlideLayout[];
	createdAt: string;
	updatedAt: string;
}

type DeckRow = typeof deckTable.$inferSelect;
type DeckWidgetRow = typeof deckWidgetTable.$inferSelect;

function rowToDeck(row: DeckRow, widgets: DeckWidget[]): Deck {
	return {
		id: row.id,
		userId: row.userId,
		title: row.title,
		mdx: row.mdx,
    widgets,
		slides: parseSlides(row.canvasLayout),
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function rowToDeckWidget(row: DeckWidgetRow): DeckWidget {
  return {
    compiledJs: row.compiledJs,
    componentName: row.componentName,
    deckId: row.deckId,
    id: row.id,
    sourceTsx: row.sourceTsx,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function listWidgetsForDeckIds(
  deckIds: string[]
): Promise<Map<string, DeckWidget[]>> {
  const byDeck = new Map<string, DeckWidget[]>();
  if (deckIds.length === 0) {
    return byDeck;
  }
  const rows = await db
    .select()
    .from(deckWidgetTable)
    .where(inArray(deckWidgetTable.deckId, deckIds));
  for (const row of rows) {
    const key = row.deckId;
    const current = byDeck.get(key) ?? [];
    current.push(rowToDeckWidget(row));
    byDeck.set(key, current);
  }
  return byDeck;
}

export async function getDeck(deckId: string): Promise<Deck | null> {
	const rows = await db
		.select()
		.from(deckTable)
		.where(eq(deckTable.id, deckId))
		.limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }
  const widgets = await listWidgetsForDeckIds([row.id]);
	return rowToDeck(row, widgets.get(row.id) ?? []);
}

export async function getDeckForUser(
  deckId: string,
  userId: string
): Promise<Deck | null> {
  const rows = await db
    .select()
    .from(deckTable)
    .where(and(eq(deckTable.id, deckId), eq(deckTable.userId, userId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const widgets = await listWidgetsForDeckIds([row.id]);
  return rowToDeck(row, widgets.get(row.id) ?? []);
}

export async function listUserDecks(userId: string): Promise<Deck[]> {
	const rows = await db
		.select()
		.from(deckTable)
		.where(eq(deckTable.userId, userId));
  const widgetsByDeckId = await listWidgetsForDeckIds(rows.map((row) => row.id));
	return rows.map((row) => rowToDeck(row, widgetsByDeckId.get(row.id) ?? []));
}

const MAX_DECKS_PER_USER = 50;

export async function saveDeck(
	data: Omit<Deck, "id" | "createdAt" | "updatedAt" | "widgets"> & { id?: string },
): Promise<Deck> {
	const existing = await db
		.select({ id: deckTable.id })
		.from(deckTable)
		.where(eq(deckTable.userId, data.userId));

	if (existing.length >= MAX_DECKS_PER_USER) {
		throw new Error(`You've reached the ${MAX_DECKS_PER_USER}-deck limit. Delete an existing deck to create a new one.`);
	}

	const now = new Date();
	const id = data.id ?? nanoid();
	const slides = data.slides.map((s) => ({
		id: s.id,
		canvasLayout: normalizeCanvasLayout(s.canvasLayout),
		speakerNotes: s.speakerNotes ?? "",
	}));
	const [row] = await db
		.insert(deckTable)
		.values({
			id,
			userId: data.userId,
			title: data.title,
			mdx: data.mdx,
			canvasLayout: slides,
			createdAt: now,
			updatedAt: now,
		})
		.returning();
	return rowToDeck(row, []);
}

export async function updateDeck(
	deckId: string,
	updates: Partial<Pick<Deck, "title" | "mdx" | "slides">>,
): Promise<Deck | null> {
	const set: Partial<DeckRow> & { updatedAt: Date } = {
		updatedAt: new Date(),
	};
	if (updates.title !== undefined) set.title = updates.title;
	if (updates.mdx !== undefined) set.mdx = updates.mdx;
	if (updates.slides !== undefined) {
		set.canvasLayout = updates.slides.map((s) => ({
			id: s.id,
			canvasLayout: normalizeCanvasLayout(s.canvasLayout),
			speakerNotes: s.speakerNotes ?? "",
		}));
	}

	const rows = await db
		.update(deckTable)
		.set(set)
		.where(eq(deckTable.id, deckId))
		.returning();
  const row = rows[0];
  if (!row) {
    return null;
  }
  const widgets = await listWidgetsForDeckIds([row.id]);
	return rowToDeck(row, widgets.get(row.id) ?? []);
}

export async function deleteDeck(deckId: string, _userId: string): Promise<void> {
	await db.delete(deckTable).where(eq(deckTable.id, deckId));
}

export async function upsertDeckWidget(input: {
  componentName: string;
  compiledJs: string;
  deckId: string;
  sourceTsx: string;
  userId: string;
}): Promise<DeckWidget> {
  const now = new Date();
  const existing = await db
    .select()
    .from(deckWidgetTable)
    .where(
      and(
        eq(deckWidgetTable.deckId, input.deckId),
        eq(deckWidgetTable.componentName, input.componentName),
        eq(deckWidgetTable.userId, input.userId)
      )
    )
    .limit(1);
  const row = existing[0];
  if (row) {
    const updatedRows = await db
      .update(deckWidgetTable)
      .set({
        compiledJs: input.compiledJs,
        sourceTsx: input.sourceTsx,
        updatedAt: now,
      })
      .where(eq(deckWidgetTable.id, row.id))
      .returning();
    return rowToDeckWidget(updatedRows[0]);
  }
  const inserted = await db
    .insert(deckWidgetTable)
    .values({
      id: nanoid(),
      deckId: input.deckId,
      userId: input.userId,
      componentName: input.componentName,
      sourceTsx: input.sourceTsx,
      compiledJs: input.compiledJs,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return rowToDeckWidget(inserted[0]);
}
