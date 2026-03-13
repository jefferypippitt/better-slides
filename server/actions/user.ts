"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getSessionAction() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

export async function deleteUserAction(): Promise<void> {
  const session = await requireSession();
  await auth.api.deleteUser({
    body: { callbackURL: "/sign-in" },
    headers: await headers(),
    query: { id: session.user.id },
  });
}
