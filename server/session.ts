import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function getServerSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

export async function getServerUserId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.user.id ?? null;
}
