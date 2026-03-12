"use client";

import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { useEffect, useMemo, useState } from "react";
import { resolveMdxComponents } from "@/components/mdx/component-registry";

interface SlidePreviewProps {
  currentSlide: number;
  mdx: string;
  onSlideChange: (slide: number) => void;
  totalSlides: number;
}

const SLIDE_SEPARATOR = /\n---\n/;

function splitSlides(mdx: string): string[] {
  return mdx
    .split(SLIDE_SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function SlidePreview({
  mdx,
  currentSlide,
  totalSlides,
  onSlideChange,
}: SlidePreviewProps) {
  const [serialized, setSerialized] = useState<MDXRemoteSerializeResult | null>(
    null
  );
  const components = useMemo(() => resolveMdxComponents(mdx), [mdx]);
  const slides = splitSlides(mdx);
  const slide = slides[currentSlide - 1] ?? "";

  useEffect(() => {
    let cancelled = false;
    serialize(slide, { parseFrontmatter: false })
      .then((s) => {
        if (!cancelled) {
          setSerialized(s);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSerialized(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slide]);

  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-background shadow">
        <div className="prose prose-sm dark:prose-invert absolute inset-0 overflow-auto p-6">
          {serialized ? (
            <MDXRemote {...serialized} components={components} />
          ) : (
            <p className="text-muted-foreground text-sm italic">
              {slide ? "Rendering…" : "No content"}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="text-muted-foreground text-sm disabled:opacity-40"
          disabled={currentSlide <= 1}
          onClick={() => onSlideChange(currentSlide - 1)}
          type="button"
        >
          ← Prev
        </button>
        <span className="text-muted-foreground text-sm">
          {currentSlide} / {totalSlides}
        </span>
        <button
          className="text-muted-foreground text-sm disabled:opacity-40"
          disabled={currentSlide >= totalSlides}
          onClick={() => onSlideChange(currentSlide + 1)}
          type="button"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
