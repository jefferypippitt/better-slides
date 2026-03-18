"use client";

import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import type { PointerEvent } from "react";
import ReactMarkdown from "react-markdown";

interface LiveEditorCanvasProps {
  readonly activeSlide:
    | {
        id: string;
        nodes: {
          body: string;
          id: string;
          sectionId: string;
          x: number;
          y: number;
        }[];
      }
    | undefined;
  readonly activeSlideIndex: number;
  readonly isOver: boolean;
  readonly onDeleteNode: (slideIndex: number, nodeId: string) => void;
  readonly onNextSlide: () => void;
  readonly onNodePointerDown: (
    event: PointerEvent<HTMLDivElement>,
    node: {
      body: string;
      id: string;
      sectionId: string;
      x: number;
      y: number;
    },
    slideIndex: number
  ) => void;
  readonly onPreviousSlide: () => void;
  readonly onSetPreviewRef: (node: HTMLDivElement | null) => void;
  readonly slidesLength: number;
}

export default function LiveEditorCanvas({
  activeSlide,
  activeSlideIndex,
  isOver,
  onDeleteNode,
  onNextSlide,
  onNodePointerDown,
  onPreviousSlide,
  onSetPreviewRef,
  slidesLength,
}: LiveEditorCanvasProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <p className="text-center font-mono font-semibold text-[12px] text-muted-foreground tracking-[0.12em]">
        live editor
      </p>
      <div
        className={`flex min-h-0 flex-1 flex-col border border-border bg-card ${isOver ? "border-foreground/50 bg-foreground/5" : ""}`}
      >
        <div
          className="relative min-h-0 flex-1 bg-[#ececec] dark:bg-[#171717]"
          ref={onSetPreviewRef}
        >
          {!activeSlide || activeSlide.nodes.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="font-mono text-[10px] text-muted-foreground/30 tracking-[0.12em]">
                Click node to add here
              </p>
            </div>
          ) : (
            activeSlide.nodes.map((node) => (
              <div
                className="relative border border-border bg-background px-3 py-2 pr-7 shadow-sm active:cursor-grabbing"
                key={node.id}
                onPointerDown={(event) =>
                  onNodePointerDown(event, node, activeSlideIndex)
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
                  className="absolute top-1 right-1 inline-flex items-center justify-center border border-border bg-background p-0.5 text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteNode(activeSlideIndex, node.id);
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
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
        <div className="flex items-center justify-between border-border border-t px-2 py-1">
          <button
            className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            disabled={activeSlideIndex <= 0}
            onClick={onPreviousSlide}
            type="button"
          >
            <CaretLeft size={10} />
            previous
          </button>
          <p className="font-mono text-[10px] text-muted-foreground tracking-[0.12em]">
            slide {activeSlideIndex + 1} / {slidesLength}
          </p>
          <button
            className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            disabled={activeSlideIndex >= slidesLength - 1}
            onClick={onNextSlide}
            type="button"
          >
            next
            <CaretRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
