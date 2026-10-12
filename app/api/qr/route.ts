import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { MAX_URL_LENGTH, toSafeHttpUrl } from "@/lib/safe-url";

const QR_WIDTH = 320;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();
  if (!rawUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  const url = toSafeHttpUrl(rawUrl);
  if (!url) {
    return NextResponse.json(
      {
        error: `URL must use http or https and be at most ${MAX_URL_LENGTH} characters`,
      },
      { status: 400 }
    );
  }

  let svg: string;
  try {
    svg = await QRCode.toString(url, {
      errorCorrectionLevel: "M",
      margin: 1,
      type: "svg",
      width: QR_WIDTH,
    });
  } catch {
    // The URL is too much data to fit in a QR code at this error-correction level.
    return NextResponse.json(
      { error: "URL is too long to encode as a QR code" },
      { status: 400 }
    );
  }

  return new NextResponse(svg, {
    headers: {
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
