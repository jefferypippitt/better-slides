"use client";

import { X } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

interface SlideChromeProps {
  syncEndpoint?: string;
  total: number;
}

const SLIDE_INDEX_RE = /\/(\d+)$/;

function getChannelName(syncEndpoint: string): string | null {
  try {
    const url = new URL(syncEndpoint, window.location.origin);
    const deckId = url.searchParams.get("deckId");
    return deckId ? `better-slides-notes-${deckId}` : null;
  } catch {
    return null;
  }
}

export function SlideChrome({ total, syncEndpoint }: SlideChromeProps) {
  const router = useRouter();
  const pathname = usePathname();

  const current = useMemo(() => {
    const match = pathname.match(SLIDE_INDEX_RE);
    return match ? Number(match[1]) - 1 : 0;
  }, [pathname]);

  const handleEnd = useCallback(() => {
    if (syncEndpoint) {
      // Signal "ended" to phone pollers via slide: 0
      fetch(syncEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide: 0, total }),
      }).catch(() => undefined);

      // Signal "ended" to broadcast (desktop) notes windows
      const channelName = getChannelName(syncEndpoint);
      if (channelName) {
        const channel = new BroadcastChannel(channelName);
        channel.postMessage({ kind: "ended" });
        channel.close();
      }
    }
    router.push("/the-end");
  }, [router, syncEndpoint, total]);

  return (
    <>
      {/* Top chrome — close button pinned to the right */}
      <div className="fixed inset-x-0 top-0 z-60 flex h-11 items-center justify-end bg-background px-4">
        <button
          aria-label="Exit presentation"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={handleEnd}
          type="button"
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      {/* Bottom chrome — dots centered */}
      <div className="fixed inset-x-0 bottom-0 z-60 flex h-11 items-center justify-center gap-2 bg-background">
        {Array.from({ length: total }).map((_, i) => (
          <div
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "h-1.5 w-6 bg-foreground/60"
                : "h-1.5 w-1.5 bg-foreground/20"
            }`}
            key={`dot-${String(i)}`}
          />
        ))}
      </div>
    </>
  );
}
