"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical } from "@phosphor-icons/react";
import { useId } from "react";

interface Section {
  readonly body: string;
  readonly id: string;
  readonly title: string;
}

interface SortableCardProps {
  readonly isAdded: boolean;
  readonly onAddSection: () => void;
  readonly section: Section;
}

interface OrganizationCanvasProps {
  readonly addedSections: ReadonlySet<string>;
  readonly maxSlides: number;
  readonly onAddSection: (section: Section) => void;
  readonly onAddSlide: () => void;
  readonly onSectionDragEnd: (event: DragEndEvent) => void;
  readonly onSectionDragStart: (event: DragStartEvent) => void;
  readonly organizedSections: Section[];
  readonly slidesLength: number;
}

function SortableCard({ section, isAdded, onAddSection }: SortableCardProps) {
  const {
    attributes,
    isDragging,
    isOver,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  return (
    <div
      className={`flex flex-col border transition-colors ${
        isAdded ? "border-foreground/25 bg-foreground/3" : "border-border"
      } ${isDragging ? "opacity-50" : ""} ${isOver && !isDragging ? "border-t-2 border-t-foreground/70" : ""}`}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        {...attributes}
        {...listeners}
        className="group flex cursor-grab items-center gap-1.5 px-2 py-1.5 active:cursor-grabbing"
        onClick={onAddSection}
        type="button"
      >
        <span className="inline-flex items-center justify-center border border-border/80 bg-muted/70 p-0.5 text-foreground shadow-sm transition-colors group-hover:border-foreground/40 group-hover:bg-muted">
          <DotsSixVertical className="shrink-0" size={12} />
        </span>
        <span className="flex-1 truncate font-medium font-mono text-[10px]">
          {section.title}
        </span>
      </button>
    </div>
  );
}

export default function OrganizationCanvas({
  addedSections,
  maxSlides,
  onAddSlide,
  onAddSection,
  onSectionDragEnd,
  onSectionDragStart,
  organizedSections,
  slidesLength,
}: OrganizationCanvasProps) {
  const id = useId();
  const sectionSensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <p className="text-center font-mono font-semibold text-[12px] text-muted-foreground tracking-[0.12em]">
        organize your slides
      </p>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-border bg-background">
        <div className="min-h-0 flex-1 p-3">
          <DndContext
            autoScroll={false}
            collisionDetection={closestCenter}
            id={id}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onSectionDragEnd}
            onDragStart={onSectionDragStart}
            sensors={sectionSensors}
          >
            <SortableContext
              items={organizedSections.map((section) => section.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex h-full w-full flex-col gap-1">
                <div className="flex-1 space-y-1 overflow-hidden">
                  {organizedSections.map((section) => {
                    const isAdded = addedSections.has(section.id);
                    return (
                      <SortableCard
                        isAdded={isAdded}
                        key={section.id}
                        onAddSection={() => onAddSection(section)}
                        section={section}
                      />
                    );
                  })}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <div className="flex items-center justify-center border-border border-t px-2 py-1">
          <button
            className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            disabled={slidesLength >= maxSlides}
            onClick={onAddSlide}
            type="button"
          >
            add slide
          </button>
        </div>
      </div>
    </div>
  );
}
