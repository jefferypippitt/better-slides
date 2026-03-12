"use client";

import { DotsSixVertical } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import type { MarkdownSection } from "@/lib/sections";

interface SlideOrganizerProps {
  onAttachWidget: (sectionId: string, componentName: string | null) => void;
  onReorder: (newSlides: string[]) => void;
  onUploadWidget: (sectionId: string) => void;
  sections: MarkdownSection[];
  sectionWidgetMap: Record<string, string | undefined>;
  widgetNames: string[];
}

export function SlideOrganizer({
  sections,
  onReorder,
  widgetNames,
  sectionWidgetMap,
  onAttachWidget,
  onUploadWidget,
}: SlideOrganizerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    if ((e.target as HTMLElement).closest("[data-nodrag]")) {
      e.preventDefault();
      return;
    }
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // ghost image via the node itself
    dragNode.current = e.currentTarget;
  }

  function handleDragEnter(index: number) {
    if (dragIndex === null || dragIndex === index) {
      return;
    }
    setOverIndex(index);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...sections.map((section) => section.content)];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {sections.map((section, index) => {
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== index;
          const attachedWidget = sectionWidgetMap[section.id];

          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: draggable cards rely on drag events.
            // biome-ignore lint/a11y/noNoninteractiveElementInteractions: drag/drop interactions are pointer-based in organizer.
            <div
              className={[
                "group cursor-grab rounded-lg border bg-card transition-all active:cursor-grabbing",
                isDragging ? "opacity-40 ring-2 ring-primary" : "",
                isOver ? "border-primary ring-1 ring-primary" : "border-border",
              ].join(" ")}
              draggable
              key={section.id}
              onDragEnd={handleDragEnd}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={handleDragOver}
              onDragStart={(e) => handleDragStart(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              {/* Card header */}
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <DotsSixVertical
                  className="shrink-0 text-muted-foreground"
                  size={16}
                  weight="bold"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-sm">
                  {section.heading || `Slide ${index + 1}`}
                </span>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {index + 1}
                </span>
              </div>
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <select
                  className="min-w-0 flex-1 rounded border bg-background px-2 py-1 text-xs"
                  data-nodrag
                  onChange={(e) =>
                    onAttachWidget(section.id, e.target.value || null)
                  }
                  value={attachedWidget ?? ""}
                >
                  <option value="">No TSX attached</option>
                  {widgetNames.map((widgetName) => (
                    <option key={widgetName} value={widgetName}>
                      {widgetName}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded border px-2 py-1 text-xs hover:bg-accent/50"
                  data-nodrag
                  onClick={() => onUploadWidget(section.id)}
                  type="button"
                >
                  Upload TSX
                </button>
              </div>

              {/* Raw markdown preview */}
              <pre className="wrap-break-word overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-muted-foreground text-xs leading-relaxed">
                {section.content}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
