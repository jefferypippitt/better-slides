import { and, count, eq, gt } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deck, presenterPresence, presenterSync } from "@/lib/db/schema";
import { verifyPresenterToken } from "@/lib/presenter-token";

// Clients not seen in this window are considered disconnected.
const PRESENCE_TTL_MS = 10_000;

function getDeckId(request: NextRequest): string | null {
  const deckId = request.nextUrl.searchParams.get("deckId");
  if (!deckId) {
    return null;
  }
  return deckId.trim() || null;
}

async function canAccessDeck(userId: string, deckId: string): Promise<boolean> {
  const rows = await db
    .select({ id: deck.id })
    .from(deck)
    .where(and(eq(deck.id, deckId), eq(deck.userId, userId)))
    .limit(1);

  return rows[0]?.id !== undefined;
}

async function getDeckOwnerId(deckId: string): Promise<string | null> {
  const rows = await db
    .select({ userId: deck.userId })
    .from(deck)
    .where(eq(deck.id, deckId))
    .limit(1);
  return rows[0]?.userId ?? null;
}

async function resolveOwnerUserId(
  request: NextRequest,
  deckId: string
): Promise<string | null> {
  // Presenter token takes priority — check it first to avoid calling auth.api.getSession
  // for cross-origin phone requests, which can throw.
  const token = request.nextUrl.searchParams.get("pt");
  if (typeof token === "string" && verifyPresenterToken(token, deckId)) {
    return getDeckOwnerId(deckId);
  }

  // Fall back to session auth (desktop presenter on same origin).
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session) {
      const allowed = await canAccessDeck(session.user.id, deckId);
      if (allowed) {
        return session.user.id;
      }
    }
  } catch {
    // auth.api.getSession can throw for cross-origin requests; treat as no session.
  }

  return null;
}

export async function GET(request: NextRequest) {
  const deckId = getDeckId(request);
  if (!deckId) {
    return NextResponse.json({ error: "Missing deckId" }, { status: 400 });
  }

  const ownerUserId = await resolveOwnerUserId(request, deckId);
  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cid = request.nextUrl.searchParams.get("cid");
  const now = new Date();

  // Upsert this client's presence heartbeat.
  if (cid) {
    await db
      .insert(presenterPresence)
      .values({ clientId: cid, deckId, lastSeen: now })
      .onConflictDoUpdate({
        target: presenterPresence.clientId,
        set: { lastSeen: now, deckId },
      });
  }

  // Count clients that have checked in within the TTL window.
  const cutoff = new Date(now.getTime() - PRESENCE_TTL_MS);
  const [{ viewers }] = await db
    .select({ viewers: count() })
    .from(presenterPresence)
    .where(
      and(
        eq(presenterPresence.deckId, deckId),
        gt(presenterPresence.lastSeen, cutoff)
      )
    );

  const rows = await db
    .select()
    .from(presenterSync)
    .where(eq(presenterSync.deckId, deckId))
    .limit(1);
  const state = rows[0];
  return NextResponse.json(
    state
      ? { slide: state.slide, total: state.total, viewers }
      : { slide: 1, total: 1, viewers }
  );
}

export async function POST(request: NextRequest) {
  const deckId = getDeckId(request);
  if (!deckId) {
    return NextResponse.json({ error: "Missing deckId" }, { status: 400 });
  }

  const ownerUserId = await resolveOwnerUserId(request, deckId);
  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  await db
    .insert(presenterSync)
    .values({
      deckId,
      slide: body.slide ?? 1,
      total: body.total ?? 1,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: presenterSync.deckId,
      set: {
        slide: body.slide ?? 1,
        total: body.total ?? 1,
        updatedAt: new Date(),
      },
    });
  return NextResponse.json({ ok: true });
}
