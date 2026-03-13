import type { NextRequest } from "next/server";
import { buildNotesQrResponse } from "@/server/notes-qr";

interface Props {
  params: Promise<{ deckId: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { deckId } = await params;
  return buildNotesQrResponse(request, deckId);
}
