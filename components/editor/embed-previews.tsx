"use client";

import type { ReactNode } from "react";
import { Tweet } from "react-tweet";
import { EmbedErrorBoundary } from "@/components/editor/embed-error-boundary";
import { extractTweetId, toYoutubeEmbedUrl } from "@/lib/embeds";

function PreviewMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded border border-muted-foreground/40 border-dashed p-2 text-center text-[10px] text-muted-foreground">
      {children}
    </div>
  );
}

/**
 * Live YouTube player for the editor canvas. Pointer events are disabled so
 * the element can still be dragged and resized; it plays in presentation mode.
 */
export function YoutubePreview({ url }: { url: string }) {
  const embedUrl = toYoutubeEmbedUrl(url);
  if (!embedUrl) {
    return <PreviewMessage>Not a valid YouTube video link</PreviewMessage>;
  }
  return (
    <iframe
      className="pointer-events-none h-full w-full rounded bg-black"
      loading="lazy"
      src={embedUrl}
      tabIndex={-1}
      title="YouTube video preview"
    />
  );
}

/**
 * Live X post card for the editor canvas, fetched through /api/tweet so a
 * wrong link shows "Tweet not found" before presenting.
 */
export function TweetPreview({ url }: { url: string }) {
  const tweetId = extractTweetId(url);
  if (!tweetId) {
    return <PreviewMessage>Not a valid X post link</PreviewMessage>;
  }
  return (
    <EmbedErrorBoundary
      fallback={<PreviewMessage>Couldn't load this post</PreviewMessage>}
      key={tweetId}
    >
      <div className="pointer-events-none h-full w-full overflow-hidden [&>div]:bg-transparent! [&_.react-tweet-tweet]:bg-transparent!">
        <Tweet apiUrl={`/api/tweet/${tweetId}`} id={tweetId} />
      </div>
    </EmbedErrorBoundary>
  );
}
