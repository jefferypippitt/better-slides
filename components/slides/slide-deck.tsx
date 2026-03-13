"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";

interface SlideDeckProps {
  basePath?: string;
  children: ReactNode;
  className?: string;
  showCounter?: boolean;
  showProgress?: boolean;
  slides: ReactNode[];
  speakerNotes?: (string | ReactNode | null)[];
  syncEndpoint?: string;
}

const SLIDE_INDEX_RE = /\/(\d+)$/;
const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function SlideDeck({
  children,
  basePath = "/slides",
  slides,
  syncEndpoint,
}: SlideDeckProps) {
  const router = useRouter();
  const pathname = usePathname();

  const extractDeckId = useCallback(() => {
    if (!syncEndpoint) {
      return null;
    }
    try {
      const url = new URL(syncEndpoint, window.location.origin);
      return url.searchParams.get("deckId");
    } catch {
      return null;
    }
  }, [syncEndpoint]);

  const getChannelName = useCallback(() => {
    const deckId = extractDeckId();
    if (!deckId) {
      return null;
    }
    return `better-slides-notes-${deckId}`;
  }, [extractDeckId]);

  const getCurrentPage = useCallback(() => {
    const match = pathname.match(SLIDE_INDEX_RE);
    return match ? Number(match[1]) : 1;
  }, [pathname]);

  const broadcastState = useCallback(
    (page: number) => {
      const channelName = getChannelName();
      if (!channelName) {
        return;
      }
      const channel = new BroadcastChannel(channelName);
      channel.postMessage({ kind: "state", slide: page, total: slides.length });
      channel.close();
    },
    [getChannelName, slides.length]
  );

  // Publish initial state so the phone knows the total slide count immediately.
  useEffect(() => {
    if (!syncEndpoint) {
      return;
    }
    const page = getCurrentPage();
    broadcastState(page);
    fetch(syncEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slide: page, total: slides.length }),
    }).catch(() => {
      // ignore sync errors
    });
    // Only run once on mount — omit getCurrentPage/slides.length intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastState, syncEndpoint, getCurrentPage, slides.length]);

  useEffect(() => {
    const page = getCurrentPage();
    broadcastState(page);
  }, [broadcastState, getCurrentPage]);

  // Heartbeat: keep notes window showing "Live" when slides are idle.
  useEffect(() => {
    if (!syncEndpoint) {
      return;
    }
    const id = setInterval(() => {
      broadcastState(getCurrentPage());
    }, 2000);
    return () => clearInterval(id);
  }, [broadcastState, getCurrentPage, syncEndpoint]);

  useEffect(() => {
    const channelName = getChannelName();
    if (!channelName) {
      return;
    }
    const channel = new BroadcastChannel(channelName);
    const onMessage = (event: MessageEvent<unknown>) => {
      const message = event.data as
        | { kind?: "control"; slide?: number; total?: number }
        | { kind?: "request-state" }
        | undefined;

      if (!message) {
        return;
      }

      if (message.kind === "request-state") {
        const page = getCurrentPage();
        channel.postMessage({
          kind: "state",
          slide: page,
          total: slides.length,
        });
        return;
      }

      if (message.kind !== "control" || typeof message.slide !== "number") {
        return;
      }

      const currentPage = getCurrentPage();
      const targetPage = Math.max(1, Math.min(message.slide, slides.length));
      if (targetPage !== currentPage) {
        router.push(`${basePath}/${targetPage}`);
      }
    };

    channel.addEventListener("message", onMessage);
    return () => {
      channel.removeEventListener("message", onMessage);
      channel.close();
    };
  }, [basePath, getChannelName, getCurrentPage, router, slides.length]);

  const navigate = useCallback(
    (page: number) => {
      router.push(`${basePath}/${page}`);
      broadcastState(page);
      if (syncEndpoint) {
        fetch(syncEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slide: page, total: slides.length }),
        }).catch(() => {
          // ignore sync errors
        });
      }
    },
    [basePath, broadcastState, router, slides.length, syncEndpoint]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        INTERACTIVE_TAGS.has(target.tagName) ||
        target.isContentEditable ||
        Boolean(target.closest("[data-slide-interactive]"))
      ) {
        return;
      }

      const current = getCurrentPage();
      const total = slides.length;

      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        if (current < total) {
          e.preventDefault();
          navigate(current + 1);
        }
      } else if (
        (e.key === "ArrowLeft" || e.key === "ArrowUp") &&
        current > 1
      ) {
        e.preventDefault();
        navigate(current - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [getCurrentPage, navigate, slides.length]);

  return <>{children}</>;
}
