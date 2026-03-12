"use client";

import { X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface SlideChromeProps {
  exitUrl: string;
  total: number;
}

const SLIDE_INDEX_RE = /\/(\d+)$/;

export function SlideChrome({ exitUrl, total }: SlideChromeProps) {
  const pathname = usePathname();

  const current = useMemo(() => {
    const match = pathname.match(SLIDE_INDEX_RE);
    return match ? Number(match[1]) - 1 : 0;
  }, [pathname]);

  return (
    <>
      {/* Top chrome — close button pinned to the right */}
      <div className="fixed inset-x-0 top-0 z-60 flex h-11 items-center justify-end bg-background px-4">
        <Link
          aria-label="Exit presentation"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          href={exitUrl}
        >
          <X size={16} weight="bold" />
        </Link>
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
