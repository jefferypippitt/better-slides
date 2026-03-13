"use client";

import {
  CaretLeft,
  CaretRight,
  Code,
  DotsSixVertical,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import { SlideBar } from "./slide-bar";

// ── Types ──────────────────────────────────────────────────────────────────────

type LineKind = "h1" | "h2" | "divider" | "text";

interface EditorLine {
  readonly id: string;
  readonly kind: LineKind;
  readonly text: string;
}

interface Section {
  readonly body: string;
  readonly id: string;
  readonly title: string;
}

interface CanvasNode {
  body: string;
  id: string;
  sectionId: string;
  x: number;
  y: number;
}

interface CanvasSlide {
  id: string;
  nodes: CanvasNode[];
}

// ── Data ───────────────────────────────────────────────────────────────────────

const EDITOR_LINES: EditorLine[] = [
  { id: "h1", text: "# My Presentation", kind: "h1" },
  { id: "sub", text: "Welcome to the future of slides.", kind: "text" },
  { id: "div1", text: "---", kind: "divider" },
  { id: "h2a", text: "## Key Features", kind: "h2" },
  { id: "feat1", text: "- Markdown first", kind: "text" },
  { id: "feat2", text: "- Instant slide structure", kind: "text" },
  { id: "div2", text: "---", kind: "divider" },
  { id: "h2b", text: "## Get Started", kind: "h2" },
  { id: "cta", text: "Sign up free today →", kind: "text" },
];

const FULL_MDX = EDITOR_LINES.map((l) => l.text).join("\n");

const SECTIONS: Section[] = [
  {
    id: "s1",
    title: "My Presentation",
    body: "# My Presentation\nWelcome to the future of slides.",
  },
  {
    id: "s2",
    title: "Key Features",
    body: "## Key Features\n- Markdown first\n- Instant slide structure",
  },
  {
    id: "s3",
    title: "Get Started",
    body: "## Get Started\nSign up free today ->",
  },
];

const NOTES_BY_SECTION: Record<string, string[]> = {
  s1: [
    'Opening / Transition: "Start with `# My Presentation` and say this is the deck title slide."',
    'Closing / Hand-off: "After the title, move to `## Key Features` to explain what is included."',
  ],
  s2: [
    'Opening / Transition: "On `## Key Features`, call out `- Markdown first` and `- Instant slide structure`."',
    'Closing / Hand-off: "Once features are clear, transition to `## Get Started` for the next action."',
  ],
  s3: [
    'Opening / Transition: "For `## Get Started`, read the line `Sign up free today ->` as the CTA."',
    'Closing / Hand-off: "Close by repeating the CTA and inviting the audience to try it now."',
  ],
};

const CHAR_SPEED_MS = 28;
const PAUSE_MS = 3000;
const MAX_SLIDES = 3;

// ── Helpers ────────────────────────────────────────────────────────────────────

function lineOpacityClass(kind: LineKind): string {
  if (kind === "divider") {
    return "opacity-25";
  }
  if (kind === "h2") {
    return "opacity-80";
  }
  if (kind === "text") {
    return "opacity-55";
  }
  return "";
}

function lineSpacingClass(kind: LineKind, index: number): string {
  if (index === 0) {
    return "";
  }
  if (kind === "h1" || kind === "h2" || kind === "divider") {
    return "mt-3";
  }
  return "mt-0.5";
}

function renderTypedLine(kind: LineKind, content: string): React.ReactNode {
  let prefix = "";
  if (kind === "h1") {
    prefix = "# ";
  } else if (kind === "h2") {
    prefix = "## ";
  }
  if (!prefix) {
    return content;
  }
  const prefixPart = content.slice(0, Math.min(prefix.length, content.length));
  const bodyPart = content.slice(prefix.length);
  return (
    <>
      <span className="opacity-40">{prefixPart}</span>
      {bodyPart}
    </>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SolutionSlide() {
  // ── Streaming typing animation ──
  const [charCount, setCharCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const charRef = useRef(0);

  useEffect(() => {
    if (isPaused) {
      const t = setTimeout(() => {
        charRef.current = 0;
        setCharCount(0);
        setIsPaused(false);
      }, PAUSE_MS);
      return () => clearTimeout(t);
    }
    const t = setInterval(() => {
      const next = charRef.current + 1;
      if (next > FULL_MDX.length) {
        setIsPaused(true);
      } else {
        charRef.current = next;
        setCharCount(next);
      }
    }, CHAR_SPEED_MS);
    return () => clearInterval(t);
  }, [isPaused]);

  // ── Right canvas state ──
  const [slides, setSlides] = useState<CanvasSlide[]>([
    { id: "slide-1", nodes: [] },
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const nodeIdRef = useRef(0);

  // ── Unified drag state ──
  // isDragging is the effect trigger; refs hold perf-sensitive drag data
  const [isDragging, setIsDragging] = useState(false);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [ghostSection, setGhostSection] = useState<Section | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const dragKindRef = useRef<"center" | "preview" | null>(null);
  const dragPayloadRef = useRef<{
    sectionId?: string;
    nodeId?: string;
    slideIndex?: number;
    startPx: number;
    startPy: number;
    startNx: number;
    startNy: number;
  } | null>(null);

  const addedSections = new Set(
    slides.flatMap((slide) => slide.nodes.map((node) => node.sectionId))
  );

  const handleAddClick = useCallback(
    (section: Section, dropPos?: { x: number; y: number }) => {
      const slideIndex = activeSlideIndex;
      const nodeId = `node-${nodeIdRef.current}`;
      nodeIdRef.current += 1;

      setSlides((prev) => {
        const targetSlide = prev[slideIndex];
        if (!targetSlide) {
          return prev;
        }

        const nextY = 8 + targetSlide.nodes.length * 18;
        const newNode: CanvasNode = {
          id: nodeId,
          sectionId: section.id,
          body: section.body,
          x: dropPos?.x ?? 8,
          y: dropPos?.y ?? Math.min(nextY, 78),
        };

        return prev.map((slide, index) => {
          if (index !== slideIndex) {
            return slide;
          }
          return {
            ...slide,
            nodes: [...slide.nodes, newNode],
          };
        });
      });
    },
    [activeSlideIndex]
  );

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    function onMove(e: PointerEvent) {
      const d = dragPayloadRef.current;
      if (!d) {
        return;
      }

      if (dragKindRef.current === "center") {
        setGhostPos({ x: e.clientX, y: e.clientY });
        return;
      }

      if (
        dragKindRef.current === "preview" &&
        typeof d.slideIndex === "number" &&
        d.nodeId
      ) {
        const canvas = previewRef.current;
        if (!canvas) {
          return;
        }
        const rect = canvas.getBoundingClientRect();
        const dx = ((e.clientX - d.startPx) / rect.width) * 100;
        const dy = ((e.clientY - d.startPy) / rect.height) * 100;

        setSlides((prev) =>
          prev.map((slide, index) => {
            if (index !== d.slideIndex) {
              return slide;
            }
            return {
              ...slide,
              nodes: slide.nodes.map((node) =>
                node.id === d.nodeId
                  ? {
                      ...node,
                      x: Math.max(0, Math.min(76, d.startNx + dx)),
                      y: Math.max(0, Math.min(80, d.startNy + dy)),
                    }
                  : node
              ),
            };
          })
        );
      }
    }

    function onUp(e: PointerEvent) {
      const d = dragPayloadRef.current;
      if (dragKindRef.current === "center" && d?.sectionId) {
        const canvas = previewRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const overCanvas =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;
          if (overCanvas) {
            const section = SECTIONS.find((s) => s.id === d.sectionId);
            if (section) {
              const x = Math.max(
                0,
                Math.min(76, ((e.clientX - rect.left) / rect.width) * 100 - 12)
              );
              const y = Math.max(
                0,
                Math.min(80, ((e.clientY - rect.top) / rect.height) * 100 - 8)
              );
              handleAddClick(section, { x, y });
            }
          }
        }
      }
      dragKindRef.current = null;
      dragPayloadRef.current = null;
      setIsDragging(false);
      setGhostPos(null);
      setGhostSection(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, handleAddClick]);

  function handlePreviewDragStart(
    e: React.PointerEvent,
    node: CanvasNode,
    slideIndex: number
  ) {
    e.preventDefault();
    dragKindRef.current = "preview";
    dragPayloadRef.current = {
      nodeId: node.id,
      slideIndex,
      startPx: e.clientX,
      startPy: e.clientY,
      startNx: node.x,
      startNy: node.y,
    };
    setIsDragging(true);
  }

  function handleDeleteNode(slideIndex: number, nodeId: string) {
    setSlides((prev) =>
      prev.map((slide, index) => {
        if (index !== slideIndex) {
          return slide;
        }
        return {
          ...slide,
          nodes: slide.nodes.filter((node) => node.id !== nodeId),
        };
      })
    );
  }

  function handleAddSlide() {
    setSlides((prev) => {
      if (prev.length >= MAX_SLIDES) {
        return prev;
      }
      const nextSlides = [
        ...prev,
        { id: `slide-${prev.length + 1}`, nodes: [] },
      ];
      setActiveSlideIndex(nextSlides.length - 1);
      return nextSlides;
    });
  }

  function handleCenterDragStart(e: React.PointerEvent, section: Section) {
    e.preventDefault();
    dragKindRef.current = "center";
    dragPayloadRef.current = {
      sectionId: section.id,
      startPx: e.clientX,
      startPy: e.clientY,
      startNx: 0,
      startNy: 0,
    };
    setGhostPos({ x: e.clientX, y: e.clientY });
    setGhostSection(section);
    setIsDragging(true);
  }

  const activeSlide = slides[activeSlideIndex];
  const activeSectionIds =
    activeSlide?.nodes.map((node) => node.sectionId) ?? [];
  const primarySection = SECTIONS.find((section) =>
    activeSectionIds.includes(section.id)
  );
  const notesTitle = primarySection?.title ?? "Untitled Slide";
  const notesItems = primarySection
    ? NOTES_BY_SECTION[primarySection.id]
    : [
        'Opening / Transition: "Set the context for this slide in one clear sentence."',
        'Closing / Hand-off: "Wrap the key point and guide the audience to the next slide."',
      ];

  // Compute visible typed lines
  const typedParts = FULL_MDX.slice(0, charCount).split("\n");

  return (
    <section className="landing-section sticky top-0 z-3 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="03 / 07" right="THE SOLUTION" />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 p-8">
        <h2 className="text-center font-bold text-[clamp(1.6rem,3.5vw,3rem)] leading-tight tracking-tight">
          Markdown in. <span className="opacity-35">Slides out.</span>
        </h2>

        <div className="grid w-full grid-cols-3 gap-3">
          {/* ── Left: Streaming MDX editor ── */}
          <div className="flex flex-col gap-2">
            <p className="flex items-center justify-center gap-1.5 text-center font-mono font-semibold text-[12px] text-muted-foreground tracking-[0.12em]">
              <Code size={11} /> presentations.mdx
            </p>
            <div className="h-[272px] overflow-hidden border border-border bg-background p-4 font-mono text-[0.72rem] leading-[1.75]">
              {typedParts.map((content, i) => {
                const line = EDITOR_LINES[i];
                if (!line) {
                  return null;
                }
                const isCurrentLine = i === typedParts.length - 1 && !isPaused;
                return (
                  <div
                    className={`${lineSpacingClass(line.kind, i)} ${lineOpacityClass(line.kind)}`}
                    key={line.id}
                  >
                    {renderTypedLine(line.kind, content)}
                    {isCurrentLine && <span className="editor-cursor" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Center: Node graph canvas ── */}
          <div className="flex flex-col gap-2">
            <p className="text-center font-mono font-semibold text-[12px] text-muted-foreground tracking-[0.12em]">
              organize your slides
            </p>
            <div className="h-[272px] overflow-hidden border border-border bg-background p-3">
              <div className="flex h-full w-full flex-col gap-1">
                <div className="flex-1 space-y-1 overflow-hidden">
                  {SECTIONS.map((section) => {
                    const isAdded = addedSections.has(section.id);
                    return (
                      <div
                        className={`flex flex-col border transition-colors ${
                          isAdded
                            ? "border-foreground/25 bg-foreground/3"
                            : "border-border"
                        }`}
                        key={section.id}
                      >
                        {/* biome-ignore lint/a11y/noStaticElementInteractions: pointer drag handle in visual demo. */}
                        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: pointer drag handle in visual demo. */}
                        <div
                          className="flex cursor-grab items-center gap-1.5 px-2 py-1.5 active:cursor-grabbing"
                          onClick={() => {
                            handleAddClick(section);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleAddClick(section);
                            }
                          }}
                          onPointerDown={(e) =>
                            handleCenterDragStart(e, section)
                          }
                        >
                          <DotsSixVertical
                            className="shrink-0 text-muted-foreground/40"
                            size={10}
                          />
                          <span className="flex-1 truncate font-medium font-mono text-[10px]">
                            {section.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    className="border border-border px-2 py-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={slides.length >= MAX_SLIDES}
                    onClick={handleAddSlide}
                    type="button"
                  >
                    add slide
                  </button>
                  <button
                    className="border border-border px-2 py-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                    onClick={() => {
                      setIsNotesOpen(true);
                    }}
                    type="button"
                  >
                    add notes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Preview canvas (blank, drag target) ── */}
          <div className="flex flex-col gap-2">
            <p className="text-center font-mono font-semibold text-[12px] text-muted-foreground tracking-[0.12em]">
              live editor
            </p>
            <div
              className="relative h-[272px] border border-border bg-card"
              ref={previewRef}
              style={{
                backgroundImage:
                  "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            >
              {!activeSlide || activeSlide.nodes.length === 0 ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="font-mono text-[10px] text-muted-foreground/30 tracking-[0.12em]">
                    drag nodes here
                  </p>
                </div>
              ) : (
                activeSlide.nodes.map((node) => (
                  <div
                    className="border border-border bg-background px-3 py-2 shadow-sm active:cursor-grabbing"
                    key={node.id}
                    onPointerDown={(e) =>
                      handlePreviewDragStart(e, node, activeSlideIndex)
                    }
                    style={{
                      position: "absolute",
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      cursor: "grab",
                      userSelect: "none",
                      maxWidth: "86%",
                    }}
                  >
                    <button
                      aria-label="Delete node"
                      className="absolute -top-1 -right-1 inline-flex items-center justify-center border border-border bg-background p-0.5 text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(activeSlideIndex, node.id);
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                      }}
                      title="Delete node"
                      type="button"
                    >
                      <X size={10} />
                    </button>
                    <div className="prose prose-neutral dark:prose-invert prose-headings:my-1 prose-li:my-0 prose-p:my-1 prose-ul:my-1 max-w-none prose-p:whitespace-pre-wrap prose-ul:pl-4 prose-headings:font-semibold prose-headings:text-[11px] text-[10px] leading-[1.4]">
                      <ReactMarkdown>{node.body}</ReactMarkdown>
                    </div>
                  </div>
                ))
              )}
              <div className="pointer-events-none absolute top-2 left-2 border border-border bg-background/85 px-2 py-0.5">
                <p className="font-mono text-[9px] text-muted-foreground">
                  slide {activeSlideIndex + 1}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border border-border px-2 py-1">
              <button
                className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                disabled={activeSlideIndex <= 0}
                onClick={() => {
                  setActiveSlideIndex((prev) => Math.max(prev - 1, 0));
                }}
                type="button"
              >
                <CaretLeft size={10} />
                previous
              </button>
              <p className="font-mono text-[10px] text-muted-foreground tracking-[0.12em]">
                slide {activeSlideIndex + 1} / {slides.length}
              </p>
              <button
                className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                disabled={activeSlideIndex >= slides.length - 1}
                onClick={() => {
                  setActiveSlideIndex((prev) =>
                    Math.min(prev + 1, slides.length - 1)
                  );
                }}
                type="button"
              >
                next
                <CaretRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideBar
        center
        left="BETTER-SLIDES"
        position="bottom"
        right={
          <span className="animation-duration-[1.6s] inline-block motion-safe:animate-bounce">
            TRY IT ↑
          </span>
        }
      />

      {/* Drag ghost follows cursor when pulling from center */}
      {ghostPos && ghostSection && (
        <div
          className="border border-foreground/50 bg-background px-3 py-2 opacity-85 shadow-md"
          style={{
            position: "fixed",
            left: ghostPos.x - 16,
            top: ghostPos.y - 14,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <p className="font-medium font-mono text-[10px]">
            {ghostSection.title}
          </p>
        </div>
      )}

      {isNotesOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/75 backdrop-blur-[1px]">
          <div className="w-[min(460px,92vw)] border border-border bg-card p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3 border-border border-b pb-2">
              <div>
                <p className="font-mono text-[10px] text-muted-foreground tracking-[0.12em]">
                  presenter notes
                </p>
                <h3 className="font-semibold text-sm">
                  Slide {activeSlideIndex + 1}: {notesTitle}
                </h3>
              </div>
              <button
                aria-label="Close notes dialog"
                className="inline-flex items-center justify-center border border-border p-1 text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                onClick={() => {
                  setIsNotesOpen(false);
                }}
                type="button"
              >
                <X size={12} />
              </button>
            </div>

            <div className="space-y-2 font-mono text-[10px] text-muted-foreground">
              {notesItems.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="border border-border px-3 py-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                onClick={() => {
                  setIsNotesOpen(false);
                }}
                type="button"
              >
                done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
