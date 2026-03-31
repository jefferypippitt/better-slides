"use client";

import { usePathname } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_NAVIGATION_KEYBINDS,
  loadNavigationKeybinds,
  NAVIGATION_KEYBINDS_STORAGE_KEY,
  normalizeNavigationKey,
} from "@/lib/navigation-keybinds";
import { navigateSlideWithTransition } from "@/lib/slide-transition";

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
  const router = useTransitionRouter();
  const pathname = usePathname();
  const projectedPageRef = useRef(1);
  const isNavigatingRef = useRef(false);
  const pendingTargetPageRef = useRef<number | null>(null);
  const [navigationKeybinds, setNavigationKeybinds] = useState(
    DEFAULT_NAVIGATION_KEYBINDS
  );

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

  useEffect(() => {
    projectedPageRef.current = getCurrentPage();
  }, [getCurrentPage]);

  useEffect(() => {
    setNavigationKeybinds(loadNavigationKeybinds());

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === NAVIGATION_KEYBINDS_STORAGE_KEY) {
        setNavigationKeybinds(loadNavigationKeybinds());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

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

  const syncToServer = useCallback(
    (page: number) => {
      if (!syncEndpoint) {
        return;
      }
      fetch(syncEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide: page, total: slides.length }),
      }).catch(() => {
        // ignore sync errors
      });
    },
    [syncEndpoint, slides.length]
  );

  const navigateToPage = useCallback(
    async (targetPage: number) => {
      const boundedPage = Math.max(1, Math.min(targetPage, slides.length));
      if (isNavigatingRef.current) {
        if (boundedPage !== projectedPageRef.current) {
          pendingTargetPageRef.current = boundedPage;
        }
        return;
      }

      const fromPage = projectedPageRef.current;
      if (boundedPage === fromPage) {
        return;
      }

      isNavigatingRef.current = true;
      projectedPageRef.current = boundedPage;

      try {
        const direction = boundedPage > fromPage ? "forward" : "backward";
        broadcastState(boundedPage);
        await navigateSlideWithTransition({
          direction,
          href: `${basePath}/${boundedPage}`,
          router,
        });
        syncToServer(boundedPage);
      } finally {
        isNavigatingRef.current = false;
        const queuedTarget = pendingTargetPageRef.current;
        pendingTargetPageRef.current = null;
        if (
          typeof queuedTarget === "number" &&
          queuedTarget !== projectedPageRef.current
        ) {
          navigateToPage(queuedTarget).catch(() => {
            // ignore queued navigation errors
          });
        }
      }
    },
    [basePath, broadcastState, router, slides.length, syncToServer]
  );

  const navigateByDelta = useCallback(
    async (delta: 1 | -1) => {
      await navigateToPage(projectedPageRef.current + delta);
    },
    [navigateToPage]
  );

  // Broadcast channel — remote control (phone / notes window)
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

      navigateToPage(message.slide).catch(() => {
        // ignore remote control navigation errors
      });
    };

    channel.addEventListener("message", onMessage);
    return () => {
      channel.removeEventListener("message", onMessage);
      channel.close();
    };
  }, [getChannelName, getCurrentPage, navigateToPage, slides.length]);

  const initializedRef = useRef(false);

  // SSE stream — receives slide updates from the server (e.g. phone controlling presenter)
  useEffect(() => {
    if (!syncEndpoint) {
      return;
    }

    const url = new URL(syncEndpoint, window.location.origin);
    url.pathname = `${url.pathname}/stream`;
    const es = new EventSource(url.toString());

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as {
          slide: number;
          total: number;
          ended?: boolean;
        };
        if (data.ended) {
          return;
        }

        if (!initializedRef.current) {
          initializedRef.current = true;
          return;
        }

        const currentPage = getCurrentPage();
        if (data.slide !== currentPage) {
          navigateToPage(data.slide).catch(() => {
            // ignore navigation errors
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => es.close();
  }, [syncEndpoint, getCurrentPage, navigateToPage]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const target = e.target as HTMLElement;
      if (
        INTERACTIVE_TAGS.has(target.tagName) ||
        target.isContentEditable ||
        Boolean(target.closest("[data-slide-interactive]"))
      ) {
        return;
      }

      const normalizedKey = normalizeNavigationKey(e.key);
      if (normalizedKey === navigationKeybinds.nextKey) {
        e.preventDefault();
        navigateByDelta(1).catch(() => {
          // ignore keyboard navigation errors
        });
      } else if (normalizedKey === navigationKeybinds.prevKey) {
        e.preventDefault();
        navigateByDelta(-1).catch(() => {
          // ignore keyboard navigation errors
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigateByDelta, navigationKeybinds]);

  return <>{children}</>;
}
