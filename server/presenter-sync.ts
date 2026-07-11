import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deck } from "@/lib/db/schema";
import type { PresenterTokenScope } from "@/lib/presenter-token";
import { verifyPresenterToken } from "@/lib/presenter-token";
import { redis } from "@/lib/redis";

export const PRESENCE_TTL_MS = 10_000;
const SYNC_TTL_S = 86_400;

export interface SyncState {
  slide: number;
  total: number;
}

export function syncKey(deckId: string): string {
  return `sync:${deckId}`;
}

export function presenceKey(deckId: string): string {
  return `presence:${deckId}`;
}

export function getDeckId(request: NextRequest): string | null {
  const deckId = request.nextUrl.searchParams.get("deckId");
  return deckId?.trim() || null;
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

export async function resolveOwnerUserId(
  request: NextRequest,
  deckId: string,
  requiredScope: PresenterTokenScope
): Promise<string | null> {
  const token = request.nextUrl.searchParams.get("pt");
  if (
    typeof token === "string" &&
    verifyPresenterToken(token, deckId, requiredScope)
  ) {
    return getDeckOwnerId(deckId);
  }

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session) {
      const allowed = await canAccessDeck(session.user.id, deckId);
      if (allowed) {
        return session.user.id;
      }
    }
  } catch {
    // auth.api.getSession may throw for cross-origin requests
  }

  return null;
}

export async function getPresenterSyncResponse(
  request: NextRequest
): Promise<NextResponse> {
  const deckId = getDeckId(request);
  if (!deckId) {
    return NextResponse.json({ error: "Missing deckId" }, { status: 400 });
  }

  const ownerUserId = await resolveOwnerUserId(request, deckId, "notes");
  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cid = request.nextUrl.searchParams.get("cid");
  const now = Date.now();

  if (cid) {
    await Promise.all([
      redis.zadd(presenceKey(deckId), { score: now, member: cid }),
      redis.zremrangebyscore(presenceKey(deckId), 0, now - PRESENCE_TTL_MS),
    ]);
  }

  const [state, viewers] = await Promise.all([
    redis.get<SyncState>(syncKey(deckId)),
    redis.zcard(presenceKey(deckId)),
  ]);

  if (state?.slide === 0) {
    return NextResponse.json({
      slide: 0,
      total: state.total,
      viewers,
      ended: true,
    });
  }

  return NextResponse.json(
    state
      ? { slide: state.slide, total: state.total, viewers }
      : { slide: 1, total: 1, viewers }
  );
}

export async function postPresenterSyncResponse(
  request: NextRequest
): Promise<NextResponse> {
  const deckId = getDeckId(request);
  if (!deckId) {
    return NextResponse.json({ error: "Missing deckId" }, { status: 400 });
  }

  const ownerUserId = await resolveOwnerUserId(request, deckId, "control");
  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { slide?: number; total?: number };
  const state: SyncState = { slide: body.slide ?? 1, total: body.total ?? 1 };
  await redis.set(syncKey(deckId), state, { ex: SYNC_TTL_S });
  return NextResponse.json({ ok: true });
}
