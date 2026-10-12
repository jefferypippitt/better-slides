import { NextResponse } from "next/server";
import { getTweet } from "react-tweet/api";
import { getServerUserId } from "@/server/session";

const TWEET_ID_RE = /^\d{1,25}$/;

/**
 * Tweet data for the editor's live X preview. The client `<Tweet>` component
 * fetches from here instead of react-tweet's public proxy.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!TWEET_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid tweet id" }, { status: 400 });
  }

  try {
    const tweet = await getTweet(id);
    return NextResponse.json(
      { data: tweet ?? null },
      {
        status: tweet ? 200 : 404,
        headers: { "Cache-Control": "private, max-age=300" },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tweet" },
      { status: 502 }
    );
  }
}
