const YOUTUBE_WATCH_RE = /[?&]v=([^&#]+)/;
const YOUTUBE_SHORT_RE = /youtu\.be\/([^?&#]+)/;
const YOUTUBE_EMBED_RE = /youtube\.com\/embed\/([^?&#]+)/;
/** YouTube video IDs are exactly 11 URL-safe base64 characters. */
const YOUTUBE_ID_RE = /^[\w-]{11}$/;
const TWITTER_STATUS_RE = /\/status\/(\d{1,25})/;

export function extractTweetId(url: string): string | null {
  const match = TWITTER_STATUS_RE.exec(url);
  return match ? match[1] : null;
}
export function extractYoutubeId(url: string): string | null {
  const match =
    YOUTUBE_WATCH_RE.exec(url) ??
    YOUTUBE_SHORT_RE.exec(url) ??
    YOUTUBE_EMBED_RE.exec(url);
  const id = match?.[1];
  return id && YOUTUBE_ID_RE.test(id) ? id : null;
}

export function toYoutubeEmbedUrl(url: string): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
