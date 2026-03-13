"use client";

import { useMemo, useState } from "react";
import {
  SectionCard,
  type SlideDragHandlers,
  type SlideDragState,
} from "@/components/editor/slide-organizer-section-card";
import { WidgetLibraryPanel } from "@/components/editor/slide-organizer-widget-library-panel";
import type { MarkdownSection } from "@/lib/sections";

const JSX_COMPONENT_RE = /<([A-Z][a-zA-Z0-9]*)\s*\/?>/;

interface SlideOrganizerProps {
  onAttachWidget: (sectionId: string, componentName: string | null) => void;
  onReorder: (newSlides: string[]) => void;
  sections: MarkdownSection[];
  sectionWidgetMap: Record<string, string | undefined>;
  widgetNames: string[];
}

type UseSlideReorderResult = SlideDragState & SlideDragHandlers;

function useSlideReorder({
  onReorder,
  sections,
}: Pick<SlideOrganizerProps, "onReorder" | "sections">): UseSlideReorderResult {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function resetDragState() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    if ((e.target as HTMLElement).closest("[data-nodrag]")) {
      e.preventDefault();
      return;
    }
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
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
      resetDragState();
      return;
    }
    const next = [...sections.map((section) => section.content)];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onReorder(next);
    resetDragState();
  }

  function handleDragEnd() {
    resetDragState();
  }

  return {
    dragIndex,
    handleDragEnd,
    handleDragEnter,
    handleDragOver,
    handleDragStart,
    handleDrop,
    overIndex,
  };
}

export function SlideOrganizer({
  sections,
  onReorder,
  widgetNames,
  sectionWidgetMap,
  onAttachWidget,
}: SlideOrganizerProps) {
  const drag = useSlideReorder({ onReorder, sections });
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const widgetNameSet = useMemo(() => new Set(widgetNames), [widgetNames]);
  const missingComponentNames = useMemo(() => {
    const missing = new Set<string>();
    for (const section of sections) {
      const jsxMatch = section.content.match(JSX_COMPONENT_RE);
      const name = jsxMatch?.[1];
      if (name && !widgetNameSet.has(name)) {
        missing.add(name);
      }
    }
    return [...missing];
  }, [sections, widgetNameSet]);
  const attachedWidgetSet = useMemo(() => {
    const attachedNames = Object.values(sectionWidgetMap).filter(
      (widgetName): widgetName is string => widgetName !== undefined
    );
    return new Set(attachedNames);
  }, [sectionWidgetMap]);

  function handleSelectSection(sectionId: string) {
    setSelectedSectionId((prev) => (prev === sectionId ? null : sectionId));
  }

  function handleAttachFromLibrary(componentName: string) {
    if (!selectedSectionId) {
      return;
    }
    const current = sectionWidgetMap[selectedSectionId];
    // toggle off if same component clicked again
    onAttachWidget(
      selectedSectionId,
      current === componentName ? null : componentName
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Section nodes */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {sections.map((section, index) => {
            const isSelected = selectedSectionId === section.id;
            const attachedWidget = sectionWidgetMap[section.id];
            const jsxMatch = section.content.match(JSX_COMPONENT_RE);
            const jsxComponentName = jsxMatch?.[1] ?? null;
            const missingComponent =
              jsxComponentName !== null && !widgetNameSet.has(jsxComponentName);

            return (
              <SectionCard
                attachedWidget={attachedWidget}
                drag={drag}
                index={index}
                isSelected={isSelected}
                jsxComponentName={jsxComponentName}
                key={section.id}
                missingComponent={missingComponent}
                onAttachWidget={onAttachWidget}
                onSelectSection={handleSelectSection}
                section={section}
                widgetNames={widgetNames}
              />
            );
          })}
        </div>
      </div>

      <WidgetLibraryPanel
        onAttachFromLibrary={handleAttachFromLibrary}
        state={{
          attachedWidgetSet,
          missingComponentNames,
          sectionWidgetMap,
          selectedSectionId,
          widgetNames,
        }}
      />
    </div>
  );
}
