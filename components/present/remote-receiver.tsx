"use client";

import { usePathname } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import { useCallback, useEffect, useRef } from "react";
import { navigateSlideWithTransition } from "@/lib/slide-transition";

interface RemoteReceiverProps {
  basePath: string;
  pollInterval?: number;
  syncEndpoint: string;
}

const SLIDE_SUFFIX_RE = /\/(\d+)$/;

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function getOrCreateClientId(): string {
  const key = "better-slides-cid";
  const existing = sessionStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const id = generateId();
  sessionStorage.setItem(key, id);
  return id;
}

export function RemoteReceiver({
  basePath,
  syncEndpoint,
  pollInterval = 1500,
}: RemoteReceiverProps) {
  const router = useTransitionRouter();
  const pathname = usePathname();
  const initialized = useRef(false);
  const clientId = useRef<string | null>(null);

  useEffect(() => {
    clientId.current = getOrCreateClientId();
  }, []);

  const poll = useCallback(async () => {
    const cid = clientId.current;
    const url = cid
      ? `${syncEndpoint}&cid=${encodeURIComponent(cid)}`
      : syncEndpoint;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as { slide: number; total: number };
      const remoteSlide = data.slide;

      if (!initialized.current) {
        initialized.current = true;
        return;
      }

      const match = pathname.match(SLIDE_SUFFIX_RE);
      const currentSlide = match ? Number(match[1]) : 1;

      if (remoteSlide !== currentSlide) {
        const direction = remoteSlide >= currentSlide ? "forward" : "backward";
        await navigateSlideWithTransition({
          direction,
          href: `${basePath}/${remoteSlide}`,
          router,
        });
      }
    } catch {
      // ignore poll errors
    }
  }, [basePath, pathname, router, syncEndpoint]);

  useEffect(() => {
    poll(); // initialize immediately (first call skips navigation to avoid stale state)
    const id = setInterval(poll, pollInterval);
    return () => clearInterval(id);
  }, [poll, pollInterval]);

  return null;
}
