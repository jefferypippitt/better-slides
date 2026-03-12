import { networkInterfaces } from "node:os";
import { type NextRequest, NextResponse } from "next/server";

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

export function GET(request: NextRequest) {
  const { hostname, port } = request.nextUrl;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const lanIp = detectLanIp();
    if (lanIp) {
      const portStr = port ? `:${port}` : "";
      return NextResponse.json({ baseUrl: `http://${lanIp}${portStr}` });
    }
  }

  return NextResponse.json({ baseUrl: request.nextUrl.origin });
}
