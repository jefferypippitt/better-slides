import { DotsSixVertical, X } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { MarkdownSection } from "@/lib/sections";

export interface SlideDragState {
  dragIndex: number | null;
  overIndex: number | null;
}

export interface SlideDragHandlers {
  handleDragEnd: () => void;
  handleDragEnter: (index: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
}

export interface SectionCardProps {
  attachedWidget: string | undefined;
  drag: SlideDragState & SlideDragHandlers;
  index: number;
  isSelected: boolean;
  jsxComponentName: string | null;
  missingComponent: boolean;
  onAttachWidget: (sectionId: string, componentName: string | null) => void;
  onSelectSection: (sectionId: string) => void;
  section: MarkdownSection;
  widgetNames: string[];
}

function getCardBorderClass({
  isDragging,
  isOver,
  isSelected,
  missingComponent,
}: {
  isDragging: boolean;
  isOver: boolean;
  isSelected: boolean;
  missingComponent: boolean;
}): string {
  if (isOver || isDragging) {
    return "";
  }
  if (isSelected) {
    return "border-primary/60 ring-2 ring-primary/30";
  }
  if (missingComponent) {
    return "border-yellow-500/50 ring-1 ring-yellow-500/30";
  }
  return "border-border";
}

function renderWidgetIndicator({
  attachedWidget,
  isSelected,
  jsxComponentName,
  missingComponent,
  onAttachWidget,
  sectionId,
  widgetNames,
}: {
  attachedWidget: string | undefined;
  isSelected: boolean;
  jsxComponentName: string | null;
  missingComponent: boolean;
  onAttachWidget: (sectionId: string, componentName: string | null) => void;
  sectionId: string;
  widgetNames: string[];
}): ReactNode {
  if (attachedWidget) {
    return (
      <span
        className="flex shrink-0 items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] text-foreground"
        data-nodrag
      >
        {attachedWidget}
        <button
          aria-label={`Detach ${attachedWidget}`}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onAttachWidget(sectionId, null);
          }}
          type="button"
        >
          <X size={9} weight="bold" />
        </button>
      </span>
    );
  }
  if (missingComponent) {
    return (
      <span className="shrink-0 rounded border border-yellow-500/40 bg-yellow-500/10 px-1.5 py-0.5 text-[10px] text-yellow-600 dark:text-yellow-400">
        upload {jsxComponentName}
      </span>
    );
  }
  if (isSelected && widgetNames.length > 0) {
    return (
      <span className="shrink-0 text-[10px] text-muted-foreground/60 italic">
        pick from library
      </span>
    );
  }
  return null;
}

export function SectionCard({
  attachedWidget,
  drag,
  index,
  isSelected,
  jsxComponentName,
  missingComponent,
  onAttachWidget,
  onSelectSection,
  section,
  widgetNames,
}: SectionCardProps) {
  const isDragging = drag.dragIndex === index;
  const isOver = drag.overIndex === index && drag.dragIndex !== index;
  const borderClass = getCardBorderClass({
    isDragging,
    isOver,
    isSelected,
    missingComponent,
  });
  const widgetIndicator = renderWidgetIndicator({
    attachedWidget,
    isSelected,
    jsxComponentName,
    missingComponent,
    onAttachWidget,
    sectionId: section.id,
    widgetNames,
  });

  return (
    // biome-ignore lint/a11y/useSemanticElements: draggable card contains nested buttons, so button semantics cannot be used here.
    <div
      className={[
        "group cursor-grab rounded-lg border bg-card transition-all active:cursor-grabbing",
        isDragging ? "opacity-40 ring-2 ring-primary" : "",
        isOver ? "border-primary ring-1 ring-primary" : "",
        borderClass,
      ].join(" ")}
      draggable
      onClick={() => onSelectSection(section.id)}
      onDragEnd={drag.handleDragEnd}
      onDragEnter={() => drag.handleDragEnter(index)}
      onDragOver={drag.handleDragOver}
      onDragStart={(e) => drag.handleDragStart(e, index)}
      onDrop={(e) => drag.handleDrop(e, index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectSection(section.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <DotsSixVertical
          className="shrink-0 text-muted-foreground"
          size={16}
          weight="bold"
        />
        <span className="min-w-0 flex-1 truncate font-medium text-sm">
          {section.heading || `Slide ${index + 1}`}
        </span>
        {widgetIndicator}
        <span className="shrink-0 text-muted-foreground text-xs">
          {index + 1}
        </span>
      </div>

      <pre className="wrap-break-word overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-muted-foreground text-xs leading-relaxed">
        {section.content}
      </pre>
    </div>
  );
}
