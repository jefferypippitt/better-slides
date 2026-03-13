import { networkInterfaces } from "node:os";
import { type NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

import { auth } from "@/lib/auth";
import { getDeckForUser } from "@/lib/decks";
import { createPresenterToken } from "@/lib/presenter-token";

const QR_WIDTH = 320;

function detectLanIp(): string | null {
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    if (!iface) {
      continue;
    }
    for (const net of iface) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function resolveBaseUrl(request: NextRequest): string {
  const explicitBaseUrl = request.nextUrl.searchParams.get("baseUrl")?.trim();
  if (explicitBaseUrl) {
    try {
      const parsed = new URL(explicitBaseUrl);
      if (
        (parsed.protocol === "http:" || parsed.protocol === "https:") &&
        !isLocalhost(parsed.hostname)
      ) {
        return parsed.origin;
      }
    } catch {
      // Ignore invalid override and fall back.
    }
  }

  if (isLocalhost(request.nextUrl.hostname)) {
    const lanIp = detectLanIp();
    if (lanIp) {
      const port = request.nextUrl.port;
      return `http://${lanIp}${port ? `:${port}` : ""}`;
    }
  }

  return request.nextUrl.origin;
}

export async function buildNotesQrResponse(
  request: NextRequest,
  deckId: string
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownedDeck = await getDeckForUser(deckId, session.user.id);
  if (!ownedDeck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const baseUrl = resolveBaseUrl(request);
  const token = createPresenterToken(deckId);
  const notesUrl = `${baseUrl}/notes/${deckId}?pt=${encodeURIComponent(token)}`;
  const svg = await QRCode.toString(notesUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    type: "svg",
    width: QR_WIDTH,
  });

  return new NextResponse(svg, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
