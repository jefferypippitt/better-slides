import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

const QR_WIDTH = 320;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();
  if (!rawUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return NextResponse.json(
      { error: "URL must use http or https" },
      { status: 400 }
    );
  }

  const svg = await QRCode.toString(rawUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    type: "svg",
    width: QR_WIDTH,
  });

  return new NextResponse(svg, {
    headers: {
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
