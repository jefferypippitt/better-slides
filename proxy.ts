import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const protectedPaths = ["/write", "/present"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/write/:path*", "/present/:path*"],
};
