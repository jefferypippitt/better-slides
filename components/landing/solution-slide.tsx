"use client";

import {
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { CaretUp } from "@phosphor-icons/react";
import {
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import LiveEditorCanvas from "./live-editor-canvas";
import OrganizationCanvas from "./organization-canvas";
import PresentationCanvas from "./presentation-canvas";
import SlideBar from "./slide-bar";

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

const MAX_SLIDES = 3;
const MAX_NODES_PER_SLIDE = 3;

export default function SolutionSlide() {
  const [slides, setSlides] = useState<CanvasSlide[]>([
    { id: "slide-1", nodes: [] },
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const nodeIdRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [ghostSection, setGhostSection] = useState<Section | null>(null);

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

  const { setNodeRef: setLiveEditorRef, isOver } = useDroppable({
    id: "live-editor",
  });

  const [organizedSections, setOrganizedSections] =
    useState<Section[]>(SECTIONS);

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over?.id === "live-editor") {
      const sectionId = String(active.id);
      const section = SECTIONS.find((item) => item.id === sectionId);
      if (section) {
        handleAddClick(section);
      }
      return;
    }

    if (!over || active.id === over.id) {
      return;
    }

    setOrganizedSections((prev) => {
      const oldIndex = prev.findIndex((section) => section.id === active.id);
      const newIndex = prev.findIndex((section) => section.id === over.id);

      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }

      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleSectionDragStart(event: DragStartEvent) {
    const sectionId = String(event.active.id);
    const section = SECTIONS.find((item) => item.id === sectionId) ?? null;
    setGhostSection(section);
    setGhostPos(null);
  }

  const handleAddClick = useCallback(
    (section: Section, dropPos?: { x: number; y: number }) => {
      const slideIndex = activeSlideIndex;
      const nodeId = `node-${nodeIdRef.current}`;

      setSlides((prev) => {
        const targetSlide = prev[slideIndex];
        if (!targetSlide) {
          return prev;
        }
        if (targetSlide.nodes.length >= MAX_NODES_PER_SLIDE) {
          return prev;
        }

        nodeIdRef.current += 1;

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

    function onMove(event: globalThis.PointerEvent) {
      const dragData = dragPayloadRef.current;
      if (!dragData) {
        return;
      }

      if (dragKindRef.current === "center") {
        setGhostPos({ x: event.clientX, y: event.clientY });
        return;
      }

      if (
        dragKindRef.current === "preview" &&
        typeof dragData.slideIndex === "number" &&
        dragData.nodeId
      ) {
        const canvas = previewRef.current;
        if (!canvas) {
          return;
        }

        const rect = canvas.getBoundingClientRect();
        const dx = ((event.clientX - dragData.startPx) / rect.width) * 100;
        const dy = ((event.clientY - dragData.startPy) / rect.height) * 100;

        setSlides((prev) =>
          prev.map((slide, index) => {
            if (index !== dragData.slideIndex) {
              return slide;
            }
            return {
              ...slide,
              nodes: slide.nodes.map((node) =>
                node.id === dragData.nodeId
                  ? {
                      ...node,
                      x: Math.max(0, Math.min(76, dragData.startNx + dx)),
                      y: Math.max(0, Math.min(80, dragData.startNy + dy)),
                    }
                  : node
              ),
            };
          })
        );
      }
    }

    function onUp(event: globalThis.PointerEvent) {
      const dragData = dragPayloadRef.current;

      if (dragKindRef.current === "center" && dragData?.sectionId) {
        const canvas = previewRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const overCanvas =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;

          if (overCanvas) {
            const section = SECTIONS.find(
              (item) => item.id === dragData.sectionId
            );
            if (section) {
              const x = Math.max(
                0,
                Math.min(
                  76,
                  ((event.clientX - rect.left) / rect.width) * 100 - 12
                )
              );
              const y = Math.max(
                0,
                Math.min(
                  80,
                  ((event.clientY - rect.top) / rect.height) * 100 - 8
                )
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
  }, [handleAddClick, isDragging]);

  function handlePreviewDragStart(
    event: PointerEvent<HTMLDivElement>,
    node: CanvasNode,
    slideIndex: number
  ) {
    event.preventDefault();
    dragKindRef.current = "preview";
    dragPayloadRef.current = {
      nodeId: node.id,
      slideIndex,
      startPx: event.clientX,
      startPy: event.clientY,
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

  const activeSlide = slides[activeSlideIndex];
  return (
    <section className="landing-section sticky top-0 z-3 flex h-svh flex-col overflow-hidden border-border border-b bg-background">
      <SlideBar left="03 / 07" right="THE SOLUTION" />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 p-6 sm:p-8">
        <h2 className="text-center font-semibold text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.08] tracking-[-0.025em]">
          Markdown in. <span className="opacity-35">Done.</span>
        </h2>

        {/* Mobile fallback */}
        <div className="flex flex-col gap-3 border border-border bg-card p-6 text-center sm:hidden">
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
            Interactive Demo
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Drag markdown sections onto slides and arrange them in a live
            canvas. Best on desktop.
          </p>
        </div>

        <div className="hidden h-[390px] w-full grid-cols-3 items-stretch gap-3 sm:grid">
          <PresentationCanvas />

          <OrganizationCanvas
            addedSections={addedSections}
            maxSlides={MAX_SLIDES}
            onAddSection={handleAddClick}
            onAddSlide={handleAddSlide}
            onSectionDragEnd={handleSectionDragEnd}
            onSectionDragStart={handleSectionDragStart}
            organizedSections={organizedSections}
            slidesLength={slides.length}
          />

          <LiveEditorCanvas
            activeSlide={activeSlide}
            activeSlideIndex={activeSlideIndex}
            isOver={isOver}
            onDeleteNode={handleDeleteNode}
            onNextSlide={() => {
              setActiveSlideIndex((prev) =>
                Math.min(prev + 1, slides.length - 1)
              );
            }}
            onNodePointerDown={handlePreviewDragStart}
            onPreviousSlide={() => {
              setActiveSlideIndex((prev) => Math.max(prev - 1, 0));
            }}
            onSetPreviewRef={(node) => {
              previewRef.current = node;
              setLiveEditorRef(node);
            }}
            slidesLength={slides.length}
          />
        </div>
      </div>

      <SlideBar
        center
        left=""
        position="bottom"
        right={
          <span className="inline-flex items-center gap-1.5">
            TRY IT
            <CaretUp
              className="animation-duration-[1.6s] motion-safe:animate-bounce"
              size={12}
            />
          </span>
        }
      />

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
    </section>
  );
}
