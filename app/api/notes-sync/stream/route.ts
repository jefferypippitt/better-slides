import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { redis } from "@/lib/redis";
import {
  getDeckId,
  PRESENCE_TTL_MS,
  presenceKey,
  resolveOwnerUserId,
  type SyncState,
  syncKey,
} from "@/server/presenter-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 55;

const POLL_MS = 800;
// Update presence every N ticks (N × POLL_MS ≈ 4.8s), well within PRESENCE_TTL_MS
const PRESENCE_EVERY = 6;

export async function GET(request: NextRequest): Promise<Response> {
  const deckId = getDeckId(request);
  if (!deckId) {
    return NextResponse.json({ error: "Missing deckId" }, { status: 400 });
  }

  const ownerUserId = await resolveOwnerUserId(request, deckId, "notes");
  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cid = request.nextUrl.searchParams.get("cid");
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // controller may already be closed
        }
      };

      // Register presence and send initial state immediately on connect
      const now = Date.now();
      if (cid) {
        await Promise.all([
          redis.zadd(presenceKey(deckId), { score: now, member: cid }),
          redis.zremrangebyscore(presenceKey(deckId), 0, now - PRESENCE_TTL_MS),
        ]);
      }

      const [initial, initialViewers] = await Promise.all([
        redis.get<SyncState>(syncKey(deckId)),
        redis.zcard(presenceKey(deckId)),
      ]);

      send({
        ...(initial ?? { slide: 1, total: 1 }),
        viewers: initialViewers,
        ...(initial?.slide === 0 ? { ended: true } : {}),
      });

      let lastSerialized = JSON.stringify(initial);
      let tick = 0;

      const intervalId = setInterval(async () => {
        try {
          tick++;
          const tickNow = Date.now();

          if (cid && tick % PRESENCE_EVERY === 0) {
            await Promise.all([
              redis.zadd(presenceKey(deckId), {
                score: tickNow,
                member: cid,
              }),
              redis.zremrangebyscore(
                presenceKey(deckId),
                0,
                tickNow - PRESENCE_TTL_MS
              ),
            ]);
          }

          const current = await redis.get<SyncState>(syncKey(deckId));
          const serialized = JSON.stringify(current);

          if (serialized !== lastSerialized) {
            lastSerialized = serialized;
            const viewers = await redis.zcard(presenceKey(deckId));
            send({
              ...(current ?? { slide: 1, total: 1 }),
              viewers,
              ...(current?.slide === 0 ? { ended: true } : {}),
            });
          }
        } catch {
          // ignore transient redis errors
        }
      }, POLL_MS);

      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
