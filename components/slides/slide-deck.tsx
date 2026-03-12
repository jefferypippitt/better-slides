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

  const getCurrentPage = useCallback(() => {
    const match = pathname.match(SLIDE_INDEX_RE);
    return match ? Number(match[1]) : 1;
  }, [pathname]);

  // Publish initial state so the phone knows the total slide count immediately.
  useEffect(() => {
    if (!syncEndpoint) {
      return;
    }
    const page = getCurrentPage();
    fetch(syncEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slide: page, total: slides.length }),
    }).catch(() => {
      // ignore sync errors
    });
    // Only run once on mount — omit getCurrentPage/slides.length intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncEndpoint, getCurrentPage, slides.length]);

  const navigate = useCallback(
    (page: number) => {
      router.push(`${basePath}/${page}`);
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
    [basePath, router, slides.length, syncEndpoint]
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
