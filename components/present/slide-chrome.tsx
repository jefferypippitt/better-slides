"use client";

import { X } from "@phosphor-icons/react";
import { useTransitionRouter } from "next-view-transitions";
import { useCallback } from "react";

interface SlideChromeProps {
  syncEndpoint?: string;
  total: number;
}

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
  const router = useTransitionRouter();

  const handleEnd = useCallback(() => {
    if (syncEndpoint) {
      fetch(syncEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide: 0, total }),
      }).catch(() => undefined);

      const endChannelName = getChannelName(syncEndpoint);
      if (endChannelName) {
        const channel = new BroadcastChannel(endChannelName);
        channel.postMessage({ kind: "ended" });
        channel.close();
      }
    }
    router.push("/the-end");
  }, [router, syncEndpoint, total]);

  return (
    <>
      {/* Slide frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-4 z-50 rounded-2xl border border-foreground/15 shadow-[0_0_0_1px_hsl(var(--background))_inset]"
      />

      {/* Close button */}
      <div className="fixed top-6 right-6 z-60">
        <button
          aria-label="Exit presentation"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={handleEnd}
          type="button"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
    </>
  );
}
