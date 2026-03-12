"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { useEffect, useMemo, useState } from "react";
import { resolveMdxComponents } from "@/components/mdx/component-registry";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { convertMarkdownToSlide, hasMdxComponents } from "@/lib/convert-slide";

const Slide = mdxComponents.Slide;
const SlideTitle = mdxComponents.SlideTitle;

interface PresentationPreviewProps {
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

export function PresentationPreview({
  mdx,
  currentSlide,
  onSlideChange,
  totalSlides,
}: PresentationPreviewProps) {
  const [serialized, setSerialized] = useState<MDXRemoteSerializeResult | null>(
    null
  );

  const slides = splitSlides(mdx);
  const slide = slides[currentSlide - 1] ?? "";
  const components = useMemo(() => resolveMdxComponents(slide), [slide]);
  const isRawMarkdown = !hasMdxComponents(slide);

  useEffect(() => {
    function handleWindowKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (currentSlide > 1) {
          onSlideChange(currentSlide - 1);
        }
      } else if (
        (e.key === "ArrowRight" || e.key === "ArrowDown") &&
        currentSlide < totalSlides
      ) {
        onSlideChange(currentSlide + 1);
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [currentSlide, onSlideChange, totalSlides]);

  // Only serialize when the slide contains manual JSX component tags
  useEffect(() => {
    if (isRawMarkdown) {
      setSerialized(null);
      return;
    }
    let cancelled = false;
    setSerialized(null);
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
  }, [slide, isRawMarkdown]);

  function renderSlide() {
    if (isRawMarkdown) {
      return convertMarkdownToSlide(slide);
    }
    if (serialized) {
      return (
        <Slide>
          <MDXRemote {...serialized} components={components} />
        </Slide>
      );
    }
    return (
      <Slide>
        <SlideTitle>{slide ? "Rendering…" : "No content"}</SlideTitle>
      </Slide>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-background focus:outline-none">
      {/* Slide area */}
      <div className="relative w-full flex-1 overflow-hidden">
        {renderSlide()}
      </div>

      {/* Navigation bar */}
      <div className="flex w-full items-center justify-between bg-background/80 px-6 py-3">
        <button
          className="flex items-center gap-1 text-foreground/60 text-sm transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          disabled={currentSlide <= 1}
          onClick={() => onSlideChange(currentSlide - 1)}
          type="button"
        >
          <ArrowLeft size={16} />
          Prev
        </button>
        <span className="text-foreground/60 text-sm">
          {currentSlide} / {totalSlides}
        </span>
        <button
          className="flex items-center gap-1 text-foreground/60 text-sm transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          disabled={currentSlide >= totalSlides}
          onClick={() => onSlideChange(currentSlide + 1)}
          type="button"
        >
          Next
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
